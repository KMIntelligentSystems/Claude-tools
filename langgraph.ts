import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicTool, tool, DynamicStructuredTool } from "@langchain/core/tools";
import {PromptTemplate, BaseStringPromptTemplate, ChatPromptTemplate}  from "@langchain/core/prompts";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { MemorySaver, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { /*OpenAI,*/  ChatOpenAI } from "@langchain/openai";
import { loadCSVFile, persistCSVData} from "./lamaindex";
//import { Anthropic, FunctionTool, AnthropicAgent } from "llamaindex";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { Calculator } from '@langchain/community/tools/calculator';
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { Browser } from "./browser";

import { example1} from "./webdriver";
import { ChromaClient,  OpenAIEmbeddingFunction } from "chromadb";
import {  saveHtml, createSVGMappingFile, getHtml,saveAnalysisTool, createSVGVectorStore, checkSVGFilesExist } from "./tools";
import { ChatPromptValue } from "@langchain/core/prompt_values";
import type { ChatGeneration} from "@langchain/core/outputs";
import { readFileSync, writeFileSync} from 'fs';
import { getToolCallingAgent, getDocumentNodes/*, loadCSVFile*/ } from './llamaindexanalyzertool'
import {Document, VectorStoreIndex,  OpenAI,Settings, OpenAIEmbedding,} from "llamaindex";
import {testGetfromLlamaindex} from './vectorstoreEmbedding'
import { ChromaAgent } from "./chromaagent";

import "dotenv/config";
import { ChatOllama } from "@langchain/ollama";


//from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate, PromptTemplate, SystemMessagePromptTemplate
//import Anthropic from '@anthropic-ai/sdk';

/*const client = new Anthropic({
  apiKey: "", // This is the default and can be omitted
});*/



const ANTHROPIC_API_KEY=""


// Chain your prompt and model together
const saveHtmlTool =  new DynamicTool({
  name: "File_Saver",
  description:
    "call this to output the html code to a local directory",
  func: async ( value: string) => {
    console.log("HTML...",value);
	  const res = await saveHtml(value);
	  return res;
  }
});

const getHtmlTool =  new DynamicTool({
  name: "File_Saver",
  description:
    "call this to read the html code from a directory",
  func: async () => {
	  const res = await getHtml();
	  return res;
  }
});
/***********************************
 * Creates the individual custom SVG elements in individual files
 */
const createSVGVectors =  new DynamicTool({
  name: "File_Saver",
  description:
    "call this to create vectors of the html rendered SVG",
  func: async () => {
	  const res = await createSVGVectorStore();
	  return res;
  }
});
/***************************************
 * amalgamates the individual SVG  files to 
 * common mapping file: svgMapping.txt
 */
const createSVGMapping =  new DynamicTool({
  name: "File_Saver",
  description:
    "call this to map custom SVG data to common mapping file for use by Analyzer",
  func: async () => {
	  await createSVGMappingFile();
  }
});

//Code to save the html after putting thru tool to cleanse as html
/***NOTE**
Syntax:
d3.csv(url[[, row], callback])
Parameters:
url: It is the URL of the file that is to be fetched.
callback: It is the function that is to be performed after the file is fetched. \n
Example:
 d3.csv("data.csv", (d) => { 
            ...
        }) */

const svgAnalyzerTemplate = `<|begin_of_text|><|start_header_id|>analyser<|end_header_id|>
Your role is Analyzer. As Analyzer you will examine the requirements for the d3 js code. The requirements will be found in {requirement}. 
You will articulate what the data representation should show based on the requirements. 
You must be clear as to what elements and values should be in the graph.\n
You will formulate questions about the rendering of the d3 js code. You will ask another agent which can provide the svg elements 
that render the graph.Use your understanding of the requirements to formulate questions about the svg rendering of the requirements.\n
Ensure at the very least the following:
1. The graphical display of the data as stipulated in the requirements;\n
2. The x-axis labels are displayed;\n
3. The y-axis labels are displayed;\n
It may be the case that the elements are not displayed. In this case, stop asking questions there are syntax errors in the code. 
You may find 'error' statements in {answer}. Ensure that your understanding of the error is included in your questions.\n
Ask your question using the key: "toolQuestion" and place your question there.\n
Another agent, Evaluator may ask supplementary questions. Look at these questions and phrase them with your understanding of the requiremente.
If there are supplementary questions you will find them in {toolQuestion}
\n\n
`

const svgAnalyzerPrompt = new PromptTemplate({
      inputVariables: ["requirement", "answer", "previousAnswers", "previousQuestions","stage", "toolQuestion"], 
      template: svgAnalyzerTemplate,
});

const evaluatorTemplate = `<|begin_of_text|><|start_header_id|>evaluator<|end_header_id|>
Your role is Evaluator. You will have an understanding of the requirements to code d3 js graphs. 
The requirements are in {requirement}.\n 
You will receive  questions concerning implementation of the requirements in a d3 js graph, The questions are in {previousQuestions}. 
You will also receive answers to the questions in {previousAnswers}. Examine the previous answers. 
Ensure at the very least the following:
1. The data points are grphically displayed\n
2. The x-axis labels are displayed, that is, the text values are in the answers\n
3. The y-axis labels are displayed, that is, the text values are in the answers\n
If these are not present in the answers, then you must score a "no" \n
Carefully examine the answers in order to provide the Coder the information required to complete the task.\n
If you are satisfied that the requirements are met in evaluating the answers then the score is "yes".
Create a report outlining how well the requirements seem to be implemented. 
Your report will be in XML with '<summary_report>' as your root element with whatever child elements seem appropriate 
but end with the 
child element '<score>' with your score of "yes" or "no".

`
const evaluatorPrompt = new PromptTemplate({
      inputVariables: [ "requirement", "html", "score", "previousAnswers", "previousQuestions"],
      template: evaluatorTemplate,
});

const coderTemplate = `<|begin_of_text|><|start_header_id|>coder<|end_header_id|>Your role is Coder. 
As coder you are proficient at d3 js coding using typescript. You have three tasks:
1. Look closely at the requirements for the code. As you will see the requirements require specific data inputs. 
These inputs are available from an external tool. The requirements can be found in {requirement}.\n
The requirements can be found in {requirement}.
This data will be the input for your d3 js code. The csv data is in {data}. Understand the data and the requirements.\n
2. Create the d3 js code following the requirements and the format of the CSV data from task 1. 
Use a mock csv file called 'data.csv'.\n Make sure the code can be run in a browser.
It should be pure html. Wrap your code in XML tags: '<html></html>'\n
Just return the html code without explanation or added commentary. 
The code will be run in the browser. So just the code is required.\n
3. You may receive a previous version of your code. In that case you will also receive a report about problems with your code.
If there are problems, you will find your code in {html}. You will find the report about your previous code in {answer}.
**HINT**
Remember when using 'd3.csv("data.csv")', the 'd3.csv' function adheres to standard RFC4180. 
This standard states that for the comma-separated data, the first line comprises the 'headings' while 
the remaining comma-separated lines comprise the 'data'. In the case of 'd3', the headings can be referenced 
as 'columns' - so 'data.columns' is the array of headings. The 'data' lines can be accessed directly (eg with a 'for-loop').\n\n

  `
const coderPrompt = new PromptTemplate({
      inputVariables: [  "requirement", "data", "answer", "html"],
      template: coderTemplate,
});

const dataAnalyzerTemplate = `<|begin_of_text|><|start_header_id|>datanalyzer<|end_header_id|>
As a DataAnalyzer, your task is to verify that the data provided to be graphed is complete. You will find the input data in {data}. 
Another agent has generated a report on what is displayed in the graph. This report will provide information about what labels are displayed on the 
x-y axes of the graph and what is displayed in the body of the graph. What is displayed in the body of the graph will depend on the type of graph such as bar chart, 
bubble chart, pie chart, or line chart. You will find this information in {requirement}. You will find the agent's report about what seems to be displayed 
in the graph in {answer}. Look at the requirements, the data input and the report to determine how well the graph captures the data. 
Provide a report with key: "dataReport".
`

const dataAnalyzerPrompt = new PromptTemplate({
      inputVariables: [  "requirement", "answer", "data"],
      template: dataAnalyzerTemplate,
});


const fixerTemplate = `<|begin_of_text|><|start_header_id|>fixer<|end_header_id|>You are expert in JavaScript and 
the d3 js framework. Your role is code Fixer. You will fix code that has errors. You will have the following 3 tasks:
1. You will receive a report concerning problems such as syntax errors in the d3 js code. Understand the problems in order to fix the code.
You will find the report in {answer}.\n
2. You will examine the code in light of what seems to be the problem. Apply a fix to the problem. You will find the code in {html}.\n
3. You will provide the complete code. It should be pure html. Wrap your code in XML tags: '<html></html>'\n
.
    `
const fixerPrompt = new PromptTemplate({
        inputVariables: ["answer", "html"],
        template: fixerTemplate,
});
 
const retrieverTemplate = `<|begin_of_text|><|start_header_id|>retriever<|end_header_id|>
 Your role as Retriever is to extract information from the provided requirement in {requirement} 
 in order to provide a prompt to another agent whose role is to extract the requested information 
 from a data store. Make the command to fetch data as precise as possible without adding commentary or explanation. 
 Wrap the command in XML tags: '<query></query>'. If you receive the data ensure it is in a CSV format suitable 
 for JavaScript`
const retrieverPrompt = new PromptTemplate({
        inputVariables: ["requirement"],
        template: retrieverTemplate,
});
/********************************
 * Retriever to load csv, place in index, query index
 */
const csvDataTool =  new DynamicTool({
  name: "CSV_Data_Retrieval",
  description:
    "call this to to get the filtered csv data to be used as input data by the coding agent",
  func: async (input: String) => {
    console.log("INPUT...",input);
	  const res = await loadCSVFile(input);//getCSVData
	  return res;
  }
});


/*****************************************
 * Chromadb
 */
const svg_xmlDataTool =  new DynamicTool({
  name: "SVG_XML_Data_Retrieval",
  description:
    "call this to provide the unique XML conceptualization of rendered SVG elements ",
  func: async (request) => {
    const csvPath = "./line chart.csv";
    const name = "svg_csv";
    const client = new ChromaAgent();
    await client.loadCSVFile(csvPath, name);
    console.log("REQUEST....",request)
    
    const results = await client.querySVGVectors(`An autonomous agent has generated an analysis of what it thinks the graph in SVG
        should represent. It will provide its analysis and a question to you. The agent analysis will be general in regard to the graph elements. You will answer
        the general question with specific values as numbers or text.
        ***********` + request + "***********", name);
        
        let res = results;
        console.log("RES....",res)
        let score = "no";
        if(res.includes("yes")){
          score = "pass";
        }
        let result = {answer: res as string, toolQuestion: request, score: score};
    
        return result;
    }
  
});


/************************************************************** */

const retriever__ = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY,
});//.bindTools([csvDataTool]);

const retriever_ = new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});

const retriever =  new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"}).bindTools([svg_xmlDataTool]);//"gpt-3.5-turbo-instruct"

//not sure if this is needed
const outputParser = new StringOutputParser();
const coderOutputParser = new StringOutputParser();
const jsonOutputParser = new JsonOutputParser();
const retrieverChain = retrieverPrompt.pipe(retriever).pipe(outputParser).pipe(csvDataTool);

const analyzer__ = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY
});//.bindTools([svg_xmlDataTool]);



const analyzer_ = new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});//.bindTools([svg_xmlDataTool]);

const analyzer =  new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"}).bindTools([svg_xmlDataTool]);//"gpt-3.5-turbo-instruct"
//const analyzerChain = svgAnalyzerPrompt.pipe(svg_xmlDataTool).pipe(outputParser).pipe(analyzer); 
const analyzerChain = svgAnalyzerPrompt.pipe(analyzer).pipe(outputParser);//.pipe(svg_xmlDataTool);//.pipe(jsonOutputParser); 

const evaluator_ = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY
});

const evaluator__ = new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});

const evaluator = new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});//"gpt-3.5-turbo-instruct"
const evaluatorChain = evaluatorPrompt.pipe(evaluator).pipe(outputParser);

const coder_ = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY
})//.bindTools([csvDataTool]);

const coder__ = new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});//.bindTools([csvDataTool]);

const coder = new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});//"gpt-3.5-turbo-instruct"
//const coderChain = coderPrompt.pipe(coder).pipe(coderOutputParser);
const coderChain = coderPrompt.pipe(coder).pipe(coderOutputParser).pipe(saveHtmlTool).pipe(createSVGVectors).pipe(getHtmlTool);
const dataAnalyzer_ = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY
});//.bindTools([csvDataTool]);

const fixer__ = new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});

const fixer = new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});//"gpt-3.5-turbo-instruct"
const fixerChain = fixerPrompt.pipe(fixer).pipe(coderOutputParser);


const dataAnalyzer__ = new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});

const dataAnalyzer = new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});//"gpt-3.5-turbo-instruct"
const dataAnalyzerChain = dataAnalyzerPrompt.pipe(dataAnalyzer).pipe(coderOutputParser);

/************************************************************ */

const GraphAnnotation = Annotation.Root({
  // Define a 'messages' channel to store an array of BaseMessage objects
  messages: Annotation<BaseMessage[]>({
    // Reducer function: Combines the current state with new messages
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
    // Default function: Initialize the channel with an empty array
    default: () => [],
  })
});

const StateAnnotation = Annotation.Root({
  data: Annotation<string>,
  requirement: Annotation<string>,
  recommendation: Annotation<string>,
  html: Annotation<string>,
  svgElements:  Annotation<string>,
  toolQuestion:  Annotation<string>,
  answer: Annotation<string>,
  previousAnswers: Annotation<string[]>,
  previousQuestions: Annotation<string[]>,
  score:  Annotation<string>,
  stage: Annotation<string>,
  userManual:  Annotation<string>,
  svgMapping:  Annotation<string>,
});

// Define the function that determines whether to continue or not
// We can extract the state typing via `StateAnnotation.State`
async function shouldContinue(state: typeof StateAnnotation.State) {
   if(state["score"]== "no"){
   //if(state["toolQuestion"] != ""){
      return "analyzer" 
//}
 //     else {
 //     return "analyzer"
 //   }
   } else {
    console.log("endddddddddddd", state)
   // return "__end__";
   return "dataAnalyzer"
   }
 //   return "__end__";
}

async function checkForErrors(state: typeof StateAnnotation.State) {
  if(state["answer"].includes("error")){
    console.log("errors", state)
     return "coder" 
  } else {
   console.log("no errors", state)
  // return "__end__";
  return "evaluator"
  }
//   return "__end__";
}

async function analyzerAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...Anal")
  console.log("state",state)

   const agentResponse = await analyzerChain.invoke({requirement: state.requirement, answer: state.answer, previousAnswers: state.previousAnswers, previousQuestions: state.previousQuestions, stage: state.stage, toolQuestion:state.toolQuestion});
   state["toolQuestion"] = agentResponse;
  if(agentResponse.includes("toolQuestion")){
    console.log("TOOOOOOOOOOOOOOOOOOL")
    let idx = agentResponse.lastIndexOf("toolQuestion");
    state["toolQuestion"] = agentResponse;//.substring(idx, idx + 250);
  }
   /*if(agentResponse["answer"]){
    state["answer"] = agentResponse["answer"]
    state["previousAnswers"].push(agentResponse["answer"]);
  }
 
  if(agentResponse["score"]){
    console.log("agentResponse score", agentResponse["score"])
    state["score"] = agentResponse["score"]
  } else{
    state["score"] = "no";
  }

  if(agentResponse["toolQuestion"]){
    state["toolQuestion"] = agentResponse["toolQuestion"];
    state["previousQuestions"].push(agentResponse["toolQuestion"]);
  }*/
 // state["previousQuestions"].push(agentResponse.content.toString());
  
  /*response: analyzer gets question with prompt about rects
  {
    toolQuestion: "How many SVG 'rect' elements are present in the SVG rendering of the bar graph?"
  }*/

 /*   state["score"] = "no";
  
  
  state["previousQuestions"].push(agentResponse["toolQuestion"]);
  
  state["toolQuestion"] = agentResponse["toolQuestion"];
  let val = "QUESTION: " + state["toolQuestion"] + '\n' + "ANSWER: " + state["answer"] + '\n';
  writeFileSync('C:/salesforce/repos/Claude tools/findings.txt', val+"\n", {
    flag: 'a',
  });*/
  
  console.log("anal state end", state)
  return state;
}

/*****************************************
 * The tool createSVGVectors calls createSVGVectorStore() in tool which calls Browser to get elements
 * 1. Browser findElements creates individual txt files
 * 2. Background checker creates svgMapping from txt files and then deletes them
 * 3. GetDocumentNodes reads the svgMapping fileand returns Document for vector store
 */
async function toolAgent(state: typeof StateAnnotation.State) {
  Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});
  const embedModel = new OpenAIEmbedding();
  Settings.embedModel = embedModel;
  console.log("state", state)
  //"How many SVG 'rect' elements are present in the graph, and do they correspond to the number of years from 2001 to 2021?";
  const request =  state["toolQuestion"];
  console.log("Hereee", request)
  const documents: Document[] = await getDocumentNodes();//loadCSVFile();
  const index = await VectorStoreIndex.fromDocuments(documents);
  //index.embedModel()
  let infoAndRequest = `An autonomous agent has generated an analysis of what it thinks the graph in SVG
  should represent. It will provide its analysis and a question to you. 
  The agent analysis will be general in regard to the graph elements. You will answer
  the general question with specific values as numbers or text. You must simply interpret the customized 
  svg elements in the store you query against the terms of the questions put to you about these svg elements.
  The absence of svg elements indicates some error. You must report any errors that are reported in the store.
  The agent's questions are:\n
  ***********` + request + "***********"
    const queryEngine = index.asQueryEngine();
    const res = await queryEngine.query({
      query: infoAndRequest,
    });
    state["answer"] = res.message.content as string;
    state["previousAnswers"].push(state["answer"]);
    console.log("res", res)
    return state;
}

async function fixerAgent(state: typeof StateAnnotation.State) {
    console.log("HERE...FIXER", state.html)
    //coderChain.
    const agentResponse = await fixerChain.invoke({ answer: state.answer,html: state.html });
    console.log("FIXER>>end", agentResponse)
   state.html = agentResponse;
   return state;
}

async function codeAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...CODER")
  const agentResponse = await coderChain.invoke({ requirement: state.requirement, data: state.data, answer: state.answer, html: state.html});
  console.log("Coder>>end: HTML....", agentResponse)
  state.html= agentResponse;
 return state;
}

async function dataAnalyzerAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...DATA ANALYZER")
  //coderChain.
  const agentResponse = await dataAnalyzerChain.invoke({ requirement: state.requirement, data: state.data, answer: state.answer});
  console.log("Coder>>end", agentResponse)
  //return "__end__";
 return state;
}

async function evalAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...EVAL")
  state["stage"] = "2";
  const agentResponse: string = await evaluatorChain.invoke({ requirement: state.requirement, html: state.html, score: state.score, previousAnswers: state.previousAnswers, previousQuestions: state.previousQuestions });
 console.log("EVAL RES", agentResponse)
 state["toolQuestion"] = "";
 if(agentResponse.includes("toolQuestion")){
  console.log("TOOOOOL  EVAL")
  state["toolQuestion"] = agentResponse;//.substring(idx, idx + 250);
}
 if(agentResponse.includes("yes")){
  state["score"] = "yes";
 }
 /*if(agentResponse.search("<score>yes</score>")){
  state["score"] = "yes";
 }*/
 return (state);
} 

async function retrieverAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...Ret")
  
  const agentResponse = await retrieverChain.invoke({ requirement: state.requirement});
  console.log("IN RETRIVER...", agentResponse)
  state.data = agentResponse;
  return state;
}

// Define a new graph
const workflow = new StateGraph(StateAnnotation)
  .addNode("coder", codeAgent)
  .addNode("retriever", retrieverAgent)
  .addNode("evaluator", evalAgent)
  .addNode("dataAnalyzer",dataAnalyzerAgent)
  .addNode("analyzer",analyzerAgent)
  .addNode("tools", toolAgent)
 // .addNode("fixer", fixerAgent)
  .addEdge("__start__", "retriever")
  .addEdge("retriever", "coder")
  .addEdge("coder", "analyzer")
  .addEdge(  "analyzer" , "tools")
  .addConditionalEdges("tools", checkForErrors)
 // .addEdge( "tools", "evaluator")
 // .addEdge("retriever", "coder")
  .addConditionalEdges("evaluator", shouldContinue);

// Initialize memory to persist state between graph runs
const checkpointer = new MemorySaver();

// Finally, we compile it!
// This compiles it into a LangChain Runnable.
// Note that we're (optionally) passing the memory when compiling the graph
const app = workflow.compile({ checkpointer });


async function readStoreManual(){
let data = "";
  try {
  data = readFileSync('./custom svg mappings.txt', 'utf8');
  
} catch (err) {
  console.error(err);
}
  return data;
}

// Use the Runnable
export async function main() {
  //Get web elements and put in llamaindex documents
/*const browser = new Browser();
  browser.get("C:/anthropic/chart5_1.html")
  await browser.findElements().then(_ => {
    //createSVGMappingFile();
  });*/
 // example1();
//  await createSVGMappingFile();
 // await testGetfromLlamaindex();
 // await createToolCallingAgent() works perfectly;
 /*const tools =  await createToolCallingAgent();
 console.log("tto",tools)
 doesn't understand - needs more clarification
 askSVGToolAgent();*/

 //await testGetfromLlamaindex();


//let agent = new ChromaAgent();
//await agent.loadTextFile();
/*const client = new ChromaAgent();
await client.delCollection("svg_csv", "SVG")
await client.loadCSVFile('./line chart.csv', "svg_csv")
const results = await client.querySVGVectors(`how many categories are there`, "svg_csv");
  console.log(results)*/

  const manual = "";//await readStoreManual();
 let requirement = "The requirement is to produce a d3 js bar graph depicting the wages of one industry: 'Agriculture' for all years '2001' to '2021'. You will be provided with the years and the wages as an input string in CSV format.";
 requirement= `Create a d3 js line graph with a legend at the bottom of the graph. 
 The graph depicts the wages of employees in 3 industries for the years 2001,2002,2003. 
 The industries are: Agriculture, Mining, Utilities. `
 
 const data = `Industry,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001
Agriculture,58085,55553,53853,53706,52389,51298,49938,48922,47935,47253,47191,46449,44886,43869,42319,40592,39199,38216,37205,36297,34591` 
 //const data = `75,104,369,300,92,64,265,35,287,69,52,23,287,87,114,114,98,137,87,90,63,69,80,113,58,115,30,35,92,460,74,72,63,115,60,75,31,277,52,218,132,316,127,87,449,46,345,48,184,149,345,92,749,93,9502,138,48,87,103,32,93,57,109,127,149,78,162,173,87,184,288,576,460,150,127,92,84,115,218,404,52,85,66,52,201,287,69,114,379,115,161,91,231,230,822,115,80,58,207,171,156,91,138,104,691,74,87,63,333,125,196,57,92,127,136,129,66,80,115,87,57,172,184,230,153,162,104,165,1036,69,196,38,92,162,806,105,69,29,633,102,87,345,58,56,35,49,92,156,58,104,167,115,87,800,87,322,65,149,34,69,69,391,58,58,207,61,253,109,69,57,56,114,58,80,149,287,57,138,92,87,103,230,57,724,50,92,79,92,45,196,29,69,253,173,438,173,218,115,58,92,115,230,87,287,53,80,92,89,4607,173,96,80,115,104,138,92,48,98,231,127,114,91,115,80,403,253,75,63,69,92,171,58,104,47,53,80,213,1498,104,125,127,58,432,90,52,69,173,75,69,139,127,45,87,138,92,58,208,52,149,60,89,119,287,74,138,171,391,104,35,92,656,90,92,103,69,345,115,87,107,93,92,247,172,58,34,99,104,57,80,345,461,330,80,75,94,104,218,58,115,79,108,184,115,60,101,40,92,102,3283,126,92,225,107,288,63,62,80,69,115,46,102,60,40,345,63,114,74,80,144,56,127,98,104,71,98,104,92,208,287,93,230,196,290,164,91,115,40,92,127,231,104,58,610,225,183,98,81,115,97,438,111,173,346,80,172,126,126,317,59,52,197,80,58,577,127,214,71,32,127,115,64,149,1035,80,1612,98,92,58,278,45,69,215,69,92,172,75,58,101,80,137,805,515,149,92,93,125,63,863,231,115,70,115,80,127,98,127,113,69,61,645,23,69,58,104,196,137,93,518,145,58,103,69,123,53,173,230,63,403,93,115,87,74,90,1036,93,160,201,131,460,287,61,98,64,46,138,149,74,56,80,92,67,133,403,160,138,63,69,69,331,92,368,103,92,180,114,58,115,144,345,172,98,76,67,68,80,345,490,62,190,46,91,231,93,79,83,115,58,139,162`

 const inputs = {"data": "", "requirement": requirement, "previousAnswers": [], "previousQuestions": [],"stage": "1","score": "no", "toolQuestion": "", "userManual": manual,"answer": "", "html": ""}
 // console.log(inputs)
  var config =  { "configurable": { "thread_id": "42" } }
 const finalState = await app.invoke(
    inputs,
    { configurable: { thread_id: "42" }  }
  );
  console.log(finalState);
  //console.log(data);
  
}
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main();