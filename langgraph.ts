import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicTool, tool, DynamicStructuredTool } from "@langchain/core/tools";
import {PromptTemplate, BaseStringPromptTemplate, ChatPromptTemplate}  from "@langchain/core/prompts";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { MemorySaver, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { OpenAI,  ChatOpenAI } from "@langchain/openai";
import { getCSVData } from "./lamaindex";
//import { Anthropic, FunctionTool, AnthropicAgent } from "llamaindex";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { Calculator } from '@langchain/community/tools/calculator';
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Browser, SVGElements } from "./browser";
import { ChromaClient, CollectionType } from "chromadb";
import { getSVGData } from "./tools";
import { ChatPromptValue } from "@langchain/core/prompt_values";
import type { ChatGeneration } from "@langchain/core/outputs";

//import { ChatOllama } from "@langchain.jslangchain-community/chat_models/ollama";


//from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate, PromptTemplate, SystemMessagePromptTemplate
//import Anthropic from '@anthropic-ai/sdk';

/*const client = new Anthropic({
  apiKey: "", // This is the default and can be omitted
});*/



const ANTHROPIC_API_KEY=""


const coderTemplate = `<|begin_of_text|><|start_header_id|>coder<|end_header_id|>Your role is Coder. Your task is to render Scalar Vector Graphics using the JavaScript framework: d3 js and produce valid html to execute in a browser.\n
    As a coder you will need to understand the requirements for the code. The requirements are in {requirement}. Look at it closely.\n
    The input data used to meet the requirements will be provided to you in {data}. This data is in CSV format. Do not make up data or imagine a csv file from an external data source. Always use the CSV string provided in {data}.\n
    You will receive a report about how well your code meets the requirements. The report will indicate improvements for the code. You can find the recommendation for improvement in {recommendation}.\n
    If improvements are recommended, look at the version of your code for which the recommendation was made. Then make the recommended improvements to that code. Your previous version of the code is in {html}.\n\n
    Return your completed code with the single key:'html'. Remember the code must start with '<!DOCTYPE html><html>' and end with '</html>'. 
    Ensure that the code can be executed and does not have line returns ('\n') or other string delimiters ('\'). Do not add explanation or preamble.
  `
const coderPrompt = new PromptTemplate({
      inputVariables: [ "data", "requirement", "recommendation", "html"],
      template: coderTemplate,
});

const coder = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY
});//.bindTools([csvDataTool]);


//const chainA = coderPrompt.pipe({ llm: coder });
/*const modelOpenAI = new OpenAI({ temperature: 0 });
const promptOpenAI = PromptTemplate.fromTemplate(
  "What is a good name for a company that makes {product}?"
);
const chainA = promptOpenAI.pipe({ llm: coder});

const responseA = await coderPrompt.format({data: "", requirement: "", recommendation: "", html: "" });
const response = await coder.invoke(responseA);


const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant who always uses tools to ensure you provide accurate, up to date information.",
  ],
  ["human", "{input}"],
]);*/

// Chain your prompt and model together
const saveHtmlTool =  new DynamicTool({
  name: "File_Saver",
  description:
    "call this to output the html code to a local directory",
  func: async ( value: string) => {
    console.log("HTML...",value);
	  const res = await getCSVData(value);
	  return res;
  }
});

const coderOutputParser = new StringOutputParser();
const generations: ChatGeneration[] = [
  { text: "{html}", message: new AIMessage("{html}") },
];
let promptValue = new ChatPromptValue([
  new SystemMessage(
    "You will ensure that the input is correctly formatted html. It must start with '<!DOCTYPE html>' and end with '</html>'."
  ),
]);

coderOutputParser.parseResultWithPrompt(
  generations,
  promptValue,
);

const coderChain = coderPrompt.pipe(coder).pipe(coderOutputParser).pipe(saveHtmlTool);

const evaluatorTemplate = `<|begin_of_text|><|start_header_id|>evaluator<|end_header_id|>Your role is Evaluator of d3 js and JavaScript code in general as pertains to the requirements for that code. Your task is to provide a report on how well the code meets the requirements. The requirements can be found in {requirement}.\n
    The code to be evaluated can be found in {html}.\n
    You will also receive a report about the execution of the code in the browser. As d3 js implements Scalar Vector Graphics (SVG) elements, the report contains a tag '<svg>'. Examine the tag for these possibilities:
    1. The element contains data which relates to the data expected by the requirements. Check that all the data is provided and give a score accordingly;\n
    2. The element is empty meaning that the required data is not been displayed. This would result in a score of 'no';
    3. The element may contain the string: 'No svg elements were found, indicating a syntax error'. If you find this error look closely at the code and report your findings to the Coder with a score of 'no'.\n
    The svg data will be found in {image_report}\n\n
    Your tasks will result in a report for the Coder. The report will be in XML with '<recommendation>' as your root element. Add your comments and recommendations in a child element called '<comment>'. No preamble or further explanation is required.\n
    Provide a score as JSON with a key 'score' with values 'yes', 'no' or 'maybe' as to whether the code meets the requirements. Use 'maybe' if you think improvements can be made.\n
    Allow for only three iterations between you and the coder to make improvements. In this case return 'yes'.
    `
const evaluatorPrompt = new PromptTemplate({
      inputVariables: [ "requirement", "html", "image_report"],
      template: evaluatorTemplate,
});
const fixerTemplate = `<|begin_of_text|><|start_header_id|>fixer<|end_header_id|>You are expert in JavaScript and the d3 js framework. Your role is code Fixer. You will fix code that has errors. You will receive an XML report. If there are errors, there will be a message and other information such as the line number and position in 
    the line where the error occurs. Look carefully for the indicators of error. Look in the error message for the line number followed by the position in the line of the error. The line and the position are separated by a colon . The report is in {svg_elements}.\n
    If there are no errors then simply report that fact.\n\n
    Return an XML report with one element for your new code or the old code if there are no errors. Use the tag 'code' for that. In addition, add any comment using the tag 'comment'.
    `
const fixerPrompt = new PromptTemplate({
        inputVariables: ["svg_elements"],
        template: fixerTemplate,
});
 
const retrieverTemplate = `<|begin_of_text|><|start_header_id|>retriever<|end_header_id|> Your role as Retriever is to extract information from the provided requirement in {requirement} in order to provide a prompt to another agent whose role is to extract the requested information from a data store. Make the command to fetch data as precise as possible without adding commentary or explanation. Wrap the command in XML tags: '<query></query>'. If you receive the data ensure it is in a CSV format suitable for JavaScript`
const retrieverPrompt = new PromptTemplate({
        inputVariables: ["requirement"],
        template: retrieverTemplate,
});

const csvDataTool =  new DynamicTool({
  name: "CSV_Data_Retrieval",
  description:
    "call this to to get the filtered csv data to be used as input data by the coding agent",
  func: async (_input: String) => {
    console.log("INPUT...",_input);
	  const res = await getCSVData(_input);
	  return res;
  }
});



const retriever = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY,
});//.bindTools([csvDataTool]);
const outputParser = new StringOutputParser();
const retrieverChain = retrieverPrompt.pipe(retriever).pipe(outputParser).pipe(csvDataTool);
/*const tools = [new Calculator()];
const agent = await createToolCallingAgent({
  retriever,
  tools,
  retrieverPrompt,
});*/



export const requirement = "Provide all the wage data for all industries for year 2020 in CSV format"

const GraphAnnotation = Annotation.Root({
  // Define a 'messages' channel to store an array of BaseMessage objects
  messages: Annotation<BaseMessage[]>({
    // Reducer function: Combines the current state with new messages
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
    // Default function: Initialize the channel with an empty array
    default: () => [],
  })
});



/*const tools_ = [tool_]
const model = new ChatAnthropic({
    model: "claude-3-opus-20240229",
    temperature: 0,
}).bindTools(tools_);*/


  
//const toolNode = new ToolNode(tools);
const StateAnnotation = Annotation.Root({
  data: Annotation<string>,
  requirement: Annotation<string>,
  recommendation: Annotation<string>,
  html: Annotation<string>,
});

// Define the function that determines whether to continue or not
// We can extract the state typing via `StateAnnotation.State`
function shouldContinue(state: typeof StateAnnotation.State) {

  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof StateAnnotation.State) {
  return "__end__";
}

async function codeAgent(state: typeof StateAnnotation.State) {
    console.log("HERE...CODER")
    //coderChain.
    const agentResponse:AIMessage = await coderChain.invoke({ data: state.data, requirement: state.requirement, recommendation: state.recommendation,html: state.html });
    
    //return "__end__";
   return ({/*"image_report": svg_elements,*/ html: agentResponse?.content});
}

async function retrieverAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...Ret")
  
  const agentResponse:AIMessage = await retrieverChain.invoke({ requirement: state.requirement});
  //const agentResponse = await retrieverPrompt.invoke({ requirement: state.requirement});
  console.log("res...RET",agentResponse.content);
 // const response = await csvDataTool.invoke(agentResponse.content);
  return ({data: agentResponse});
}

// Define a new graph
const workflow = new StateGraph(StateAnnotation)
  .addNode("coder", codeAgent)
  .addNode("retriever", retrieverAgent)
  //.addNode("tools", toolNode)
  .addEdge("__start__", "retriever")
  .addEdge("retriever", "coder")
  .addConditionalEdges("coder", shouldContinue)
  //.addEdge("tools", "agent");

// Initialize memory to persist state between graph runs
const checkpointer = new MemorySaver();

// Finally, we compile it!
// This compiles it into a LangChain Runnable.
// Note that we're (optionally) passing the memory when compiling the graph
const app = workflow.compile({ checkpointer });




// Use the Runnable
export async function main() {
  /*const browser = new Browser();
  browser.get("C:/anthropic/chart4.html")
  browser.findElements();*/
  
  await getSVGData();
/*  const client:ChromaClient = new ChromaClient();
  
  const collection = await client.getOrCreateCollection({
    name: "SVGCollection",
  });
 // await client.deleteCollection({ name: "SVGCollection",});
  
  const results = await collection.peek({
       limit: 60
     });
  console.log('results', results);
  const response = await collection.get({
    ids: ["translate0","translate1"],
     offset: 0,
    //include: ["embeddsings", "metadatas", "documents"],
    //whereDocument: { $contains: "value" },
  });
  console.log('res', response)*/
  const requirement = "The requirement is to produce a d3 js bar graph depicting the wages of one industry: 'Agriculture' for all years '2001' to '2021'. You will be provided with the years and the wages as an input string in CSV format.";
  //const data = `75,104,369,300,92,64,265,35,287,69,52,23,287,87,114,114,98,137,87,90,63,69,80,113,58,115,30,35,92,460,74,72,63,115,60,75,31,277,52,218,132,316,127,87,449,46,345,48,184,149,345,92,749,93,9502,138,48,87,103,32,93,57,109,127,149,78,162,173,87,184,288,576,460,150,127,92,84,115,218,404,52,85,66,52,201,287,69,114,379,115,161,91,231,230,822,115,80,58,207,171,156,91,138,104,691,74,87,63,333,125,196,57,92,127,136,129,66,80,115,87,57,172,184,230,153,162,104,165,1036,69,196,38,92,162,806,105,69,29,633,102,87,345,58,56,35,49,92,156,58,104,167,115,87,800,87,322,65,149,34,69,69,391,58,58,207,61,253,109,69,57,56,114,58,80,149,287,57,138,92,87,103,230,57,724,50,92,79,92,45,196,29,69,253,173,438,173,218,115,58,92,115,230,87,287,53,80,92,89,4607,173,96,80,115,104,138,92,48,98,231,127,114,91,115,80,403,253,75,63,69,92,171,58,104,47,53,80,213,1498,104,125,127,58,432,90,52,69,173,75,69,139,127,45,87,138,92,58,208,52,149,60,89,119,287,74,138,171,391,104,35,92,656,90,92,103,69,345,115,87,107,93,92,247,172,58,34,99,104,57,80,345,461,330,80,75,94,104,218,58,115,79,108,184,115,60,101,40,92,102,3283,126,92,225,107,288,63,62,80,69,115,46,102,60,40,345,63,114,74,80,144,56,127,98,104,71,98,104,92,208,287,93,230,196,290,164,91,115,40,92,127,231,104,58,610,225,183,98,81,115,97,438,111,173,346,80,172,126,126,317,59,52,197,80,58,577,127,214,71,32,127,115,64,149,1035,80,1612,98,92,58,278,45,69,215,69,92,172,75,58,101,80,137,805,515,149,92,93,125,63,863,231,115,70,115,80,127,98,127,113,69,61,645,23,69,58,104,196,137,93,518,145,58,103,69,123,53,173,230,63,403,93,115,87,74,90,1036,93,160,201,131,460,287,61,98,64,46,138,149,74,56,80,92,67,133,403,160,138,63,69,69,331,92,368,103,92,180,114,58,115,144,345,172,98,76,67,68,80,345,490,62,190,46,91,231,93,79,83,115,58,139,162`
  const inputs = { "requirement": requirement}

  var config =  { "configurable": { "thread_id": "42" } }
  
 /* const finalState = await app.invoke(
    inputs,
    { configurable: { thread_id: "42" }  }
  );
  console.log(finalState);*/
  //console.log(data);
}

void main();