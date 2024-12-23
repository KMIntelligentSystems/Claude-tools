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
import { loadCSVFile} from "./lamaindex";
//import { Anthropic, FunctionTool, AnthropicAgent } from "llamaindex";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { Calculator } from '@langchain/community/tools/calculator';
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";

import { Browser } from "./browser";

import { example1} from "./webdriver";
import { ChromaClient,  OpenAIEmbeddingFunction } from "chromadb";
import {  saveHtml, getHtml, createSVGVectorStore, getChunkIds, deleteSVGMappingFile, readTextFile,  writeCSVFile, getCSVHeading } from "./tools";
import { ChatPromptValue } from "@langchain/core/prompt_values";
import type { ChatGeneration} from "@langchain/core/outputs";
import { readFileSync, writeFileSync} from 'fs';
import { getToolCallingAgent, getDocumentNodes/*, loadCSVFile*/ } from './llamaindexanalyzertool'
import {Document, VectorStoreIndex,  OpenAI,Settings, OpenAIEmbedding} from "llamaindex";
import {testGetfromLlamaindex} from './vectorstoreEmbedding'
import { ChromaAgent } from "./chromaagent";

import "dotenv/config";
import { ChatOllama } from "@langchain/ollama";

const ANTHROPIC_API_KEY=""


/*************************************
 * Save the real html to a directory
 */
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
/***************************************
 * Piped tool to get the html data after it has been saved 
 * by saveHtml() in order to provide to sellenium as script? 
 */
const getHtmlTool =  new DynamicTool({
  name: "File_Saver",
  description:
    "call this to read the html code from a directory",
  func: async () => {
	  const res = await getHtml();
	  return res;
  }
});
/***************************************
 * Piped tool to send to llamaindex to appraise chunked
 * data
 */
const appraiseChunkedData=  new DynamicTool({
  name: "Chunked_data_appraisal",
  description:
    "call this to fetch an appraisal of chunked data ",
  func: async (request) => {
    const query = "Summarize the main points in this document";
    if(request.includes("yes")){
      const data = await readTextFile("C:/salesforce/repos/Claude tools/retainDataFindings.txt");
      let doc = new Document({ text: data, id_: "Chunked_Data", metadata: {dataId: "111"}});
      const index = await VectorStoreIndex.fromDocuments([doc]);
        const queryEngine = index.asQueryEngine();
        const res = await queryEngine.query({
          query: query,
        });
        let result = res.message.content as string;
       console.log("RESULT...SUMMARIZE", result)
        return result;
    }
    console.log("REQUES...", request)
    
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
 * 
 * amalgamates the individual SVG  files to 
 * common mapping file: svgMapping.txt done in C#
 */
const deleteSVGMapping =  new DynamicTool({
  name: "File_Del",
  description:
    "call this to delete SVG mapping file after use by Analyzer",
  func: async () => {
	  await deleteSVGMappingFile();
  }
});
/**************************************************** */
const svgAnalyzerTemplate = `<|begin_of_text|><|start_header_id|>analyser<|end_header_id|>
Your role is Analyzer. As Analyzer you will examine the requirements for the d3 js code. The requirements will be found 
in {requirement}. 
You will articulate what the data representation should show based on the requirements. 
You must be clear as to what elements and values should be in the graph.\n
You will formulate questions about the rendering of the d3 js code. You will ask another agent which can provide the svg elements 
that render the graph.Use your understanding of the requirements to formulate questions about the svg rendering of the requirements.\n
Ensure at the very least the following:
1. The graphical display of the data as stipulated in the requirements;\n
2. The x-axis labels are displayed;\n
3. The y-axis labels are displayed;\n
It may be the case that the elements are not displayed. In this case, stop asking questions there are syntax errors in the code.\n
Ask your question using the key: "toolQuestion" and place your question there.
`

const svgAnalyzerPrompt = new PromptTemplate({
      inputVariables: ["requirement"], 
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
Carefully examine the answers in order to provide the Coder the information required to complete the task.
In particular, provide as much technical detail as you can especially where errors are reported. Report the error details where there
are errors.\n
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
As coder you are proficient at d3 js coding using typescript. As a Coder you know that code development can be an iterative process. 
There is the initial stage where you as coder follow the code and data requirements to produce the first 'cut' of the code. 
The code is then reviewed and feedback is provided to you at the review stage. The cycle of code enhancement-review may continue until 
the evaluating agent is satisfied.\n\n
Note: you are in Initial Phase when the code review report is empty. If there is information in the report then you are 
in Review Phase and not Initial Phase. This report is in {answer}, look at it to determine your phase.
**Initial Phase** 
1. Look closely at the requirements for the code. The requirements can be found in {requirement}.\n
2. You must infer the data requirements from a report which summarizes the data to be provided. It will, for example, describe 
the text values for the x-y axes of a d3 js generated graph. Look at this report to determine the appropriate data values for 
the graph. The data requirements can be found in {dataFindings}\n
3. Create the d3 js code following the requirements and the format of the CSV data from task 1. 
Use a csv file called 'data.csv' and use the d3 js function: 'd3.csv("data.csv)'. Make sure the code can be run in a browser.
It should be pure html. Wrap your code in XML tags: '<html></html>'\n
Just return the html code without explanation or added commentary. 
**Review Phase**
Look closely at the requirements so you have context of the review which follows in point form. The requirements are 
in {requirement}.\n
1. Look for any syntax errors itemized in the code review report. Understand the meaning of the syntax errors.
The code review is in {answer}\n
2. Look for comment in the code review report about missing elements not meeting the requirements for the d3 js code. 
The requirements are in {requirement}
3. Look at code you generated in {html}. Determine how to fix the code. Generate the code as pure html. 
Wrap your code in XML tags: '<html></html>'\n
Just return the html code without explanation or added commentary. \n
In which ever phase you think you are in, announce it as: "The current phase is.."
  `
const coderPrompt = new PromptTemplate({
      inputVariables: [  "requirement", "dataFindings", "answer", "html"],
      template: coderTemplate,
});

const dataAnalyzerTemplate = `<|begin_of_text|><|start_header_id|>datanalyzer<|end_header_id|>
As a DataAnalyzer, your task is to provide a summary of the data to be displayed in a graph with x-y axes.
You will find the requirements for the graph in {requirement}. Look at the requirements for the code.\n
You will receive an analysis of the data to be used in the graph. The data analysis is in {dataFindings}. \n
Summarize the findings of this analysis of the data. Summarize the data points to be shown in the graph.
Provide ranges of values and not all the values. Remember this is a summary report indicating ranges and quantities of data.

`

const dataAnalyzerPrompt = new PromptTemplate({
      inputVariables: [  "requirement",  "dataFindings"],
      template: dataAnalyzerTemplate,
});


const dataProcessorTemplate = `<|begin_of_text|><|start_header_id|>dataProcessor<|end_header_id|>
You will receive data which you will analyze. The data is in {data}. The actual data can be found under "data:".\n
The data is associated with the requirements for that data, namely, to create a graph of the data. The requirements are in {requirement}
Analyze the data and the requirements. Provide a summary of what would be on the x-y axes. Provide a numerical analysis of how the data 
should be represented for the type of graph required.\n
Note that the total number of chunks of data you will receive can be found under "count:". Pay close attention to this number.
This number denotes the iteration you are in. Your position in the iteration is in {dataChunkId}. \n
Note that the number of chunks you have analyzed already can be found in {dataChunkId}. If this number is less than that under "count:" then request more data.\n
When more data is required use the key: "more_data" with value "yes". Otherwise, the value is "no".
You must pay attention to these numbers so you can signal that all data has been processed and then you must state "no" for the key "more_data"\n
Provide your analysis of the data and requirements ensuring there is a summary of numerical data for this chunk. 
Place your analysis under the key: "data_analysis".
`
const dataProcessorPrompt = new PromptTemplate({
        inputVariables: [ "data","requirement", "dataChunkId"],
        template: dataProcessorTemplate,
});
 
const retrieverTemplate = `<|begin_of_text|><|start_header_id|>retriever<|end_header_id|>
 Your role as Retriever is to extract information from the provided requirement in {requirement} 
 in order to provide a query to an LLM to fetch data from a CSV file. The query you construct will be in plain text 
 providing the information from the requirements to enable extraction of the relevant rows and columns from the CSV file.\n 
Just provide the query without adding commentary or explanation.\n
Wrap the query in XML tags: '<query></query>'.`
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
    "call this passing query to retrieve requested data",
  func: async (query: string) => {
	  await loadCSVFile(query);
  }
});


/*****************************************
 * Chromadb
 */
let heading: string = "";
const client = new ChromaAgent();
const embedDataTool =  new DynamicTool({
  name: "Data_embedding",
  description:
    "call this to provide the unique XML conceptualization of rendered SVG elements ",
  func: async (request) => {
    console.log("REQUEST...",request)
  
    const csvPath = "C:/salesforce/repos/Claude tools/";//"./line chart.csv";
    const name = "filtered_global_temperatures";// global_temperatures.csv

     client.dataChunk.ids = ["chunk_0"];//was 0
     //loads first chunk to be processed
     const results = await client.getCSVData(request, name, client.dataChunk);//query
      let count: string = client.dataChunk.count.toString();
      let data: string = client.dataChunk.data;
      heading = await getCSVHeading(data)+"\r\n";
      let ids: string[] = client.dataChunk.ids;
      let idStr: string = "[";
      ids.forEach(id =>{
        idStr = idStr + '"' + id + '"' + ",";
      });
      idStr = idStr.substring(0, idStr.length - 1) + "]";
      const res = "Count: " + count + ". Data: " + data + ". Ids: " + idStr;
      return res;
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

const retriever =  new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});//.bindTools([embedDataTool]);//"gpt-3.5-turbo-instruct"

//not sure if this is needed
const outputParser = new StringOutputParser();
const coderOutputParser = new StringOutputParser();
const jsonOutputParser = new JsonOutputParser();
const retrieverChain = retrieverPrompt.pipe(retriever).pipe(outputParser).pipe(csvDataTool)
                        .pipe(embedDataTool).pipe(outputParser);

const analyzer__ = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY
});//.bindTools([embedDataTool]);



const analyzer_= new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});//.bindTools([embedDataTool]);

const analyzer =  new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});//.bindTools([embedDataTool]);//"gpt-3.5-turbo-instruct"
//const analyzerChain = svgAnalyzerPrompt.pipe(embedDataTool).pipe(outputParser).pipe(analyzer); 
const analyzerChain = svgAnalyzerPrompt.pipe(analyzer).pipe(outputParser);//.pipe(embedDataTool);//.pipe(jsonOutputParser); 

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
const coderChain = coderPrompt.pipe(coder).pipe(coderOutputParser).pipe(saveHtmlTool).pipe(createSVGVectors);//.pipe(getHtmlTool);

const dataAnalyzer_ = new ChatAnthropic({
  model: "claude-3-opus-20240229",
  temperature: 0,
  apiKey: ANTHROPIC_API_KEY
});//.bindTools([csvDataTool]);


const dataAnalyzer__ = new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});

const dataAnalyzer = new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});//"gpt-3.5-turbo-instruct"
const dataAnalyzerChain = dataAnalyzerPrompt.pipe(dataAnalyzer).pipe(coderOutputParser);

const fixer__ = new ChatOllama({
  model: "llama3",
  temperature: 0,
  // other params...
});

const dataProcessor_ = new ChatAnthropic({model: "claude-3-opus-20240229",temperature: 0,apiKey: ANTHROPIC_API_KEY});
const dataProcessor = new ChatOpenAI({ temperature: 0, apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});
const dataProcessorChain = dataProcessorPrompt.pipe(dataProcessor).pipe(coderOutputParser);

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
  dataChunkId: Annotation<string>,
  requirement: Annotation<string>,
  recommendation: Annotation<string>,
  html: Annotation<string>,
  toolQuestion:  Annotation<string>,
  toolUse:  Annotation<string>,
  answer: Annotation<string>,
  previousAnswers: Annotation<string[]>,
  previousQuestions: Annotation<string[]>,
  score:  Annotation<string>,
  storeCount: Annotation<string>,
  dataFindings:  Annotation<string>,
  dataAnalysis:  Annotation<string>,
});

// Define the function that determines whether to continue or not
// We can extract the state typing via `StateAnnotation.State`
async function shouldContinue(state: typeof StateAnnotation.State) {
   if(state["score"]== "no"){
   //if(state["toolQuestion"] != ""){
      return "coder" 
//}
 //     else {
 //     return "analyzer"
 //   }
   } else {
    console.log("endddddddddddd", state)
    return "__end__";
  // return "dataAnalyzer"
   }
 //   return "__end__";
}

async function checkForErrors(state: typeof StateAnnotation.State) {
  if(state["answer"].includes("error") && state["toolUse"] == "SVG analyzer"){
     return "coder" 
  } else if(state["toolUse"] == "Data processor" && state["dataFindings"].includes("yes")){
    return "dataProcessor";
  } else {
   // return "__end__";
    return "dataAnalyzer"
  }
}

async function getChunkedData(state: typeof StateAnnotation.State) {
  if(state["toolUse"] == "Data analyzer" && state["dataFindings"].includes("yes")){
    return "dataProcessor";
  } else {
    return "dataAnalyzer"
  }
  }
//   return "__end__";

async function analyzerAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...Anal")
 // console.log("state",state)

   const agentResponse = await analyzerChain.invoke({requirement: state.requirement});
   state["toolQuestion"] = agentResponse;
   state["toolUse"] = "SVG analyzer";
  if(agentResponse.includes("toolQuestion")){
    console.log("TOOOOOOOOOOOOOOOOOOL")
    let idx = agentResponse.lastIndexOf("toolQuestion");
    state["toolQuestion"] = agentResponse;//.substring(idx, idx + 250);
    console.log("state after analyzer",state);
  }

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
  //console.log("state", state)
  //"How many SVG 'rect' elements are present in the graph, and do they correspond to the number of years from 2001 to 2021?";
  const request =  state["toolQuestion"];
 
  let index;
  let infoAndRequest;
  if(state["toolUse"]== "Data processor"){
    infoAndRequest = `
    `
    const data = await readTextFile("C:/salesforce/repos/Claude tools/retainDataFindings.txt");
    const document: Document = new Document({ text: data, id_: "user_manual", metadata: {svgId: "111"}})
    Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});
    index = await VectorStoreIndex.fromDocuments([document]);
    const queryEngine = index.asQueryEngine();
    const res = await queryEngine.query({
      query: infoAndRequest,
    });
    console.log("Hereee processor", request)
  } else if(state["toolUse"]== "SVG analyzer"){
    infoAndRequest = `An autonomous agent has generated an analysis of what it thinks the graph in SVG
  should represent. It will provide its analysis and a question to you. 
  The agent analysis will be general in regard to the graph elements. You will answer
  the general question with specific values as numbers or text. You must simply interpret the customized 
  svg elements in the store you query against the terms of the questions put to you about these svg elements.
  The absence of svg elements indicates some error. You must report any errors that are reported in the store.
  The agent's questions are:\n
    ***********` + request + "***********"
    const documents: Document[] = await getDocumentNodes();
    index = await VectorStoreIndex.fromDocuments(documents);
  }
  console.log("Hereee  svg", request)
  let result = "";
  if(index){
    const queryEngine = index.asQueryEngine();
    if(infoAndRequest) {
      const res = await queryEngine.query({
        query: infoAndRequest,
      });
      result = res.message.content.toString();
    } 
  }
  
  if(state["toolUse"]== "Data processor"){
    state["dataFindings"] = result;
  } else{
    state["answer"] = result;
  }
   
    console.log("res", result)
    return state;
}

async function evalAgent(state: typeof StateAnnotation.State) {
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

async function codeAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...CODER")
  const agentResponse = await coderChain.invoke({ requirement: state.requirement, dataFindings: state.dataFindings, answer: state.answer, html: state.html});
 // console.log("Coder>>end: HTML....", agentResponse)
  state.html= agentResponse;
 return state;
}

async function dataAnalyzerAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...DATA ANALYZER")
  state["dataFindings"] = await readTextFile("C:/salesforce/repos/Claude tools/retainDataFindings.txt");
  const agentResponse = await dataAnalyzerChain.invoke({ requirement: state.requirement, dataFindings: state.dataFindings});
  console.log("DATA ANALYZER end", agentResponse)
  state.dataAnalysis = agentResponse;
  return state;
}

let dbQuery: string = `select data where the months: 'Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec' and the 
    rows of years are the years between 1880 and 2000`;
async function dataProcessorAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...DATA PROCESSOR", state.data)
  const agentResponse = await dataProcessorChain.invoke({ data: state.data, requirement: state.requirement, dataChunkId: state.dataChunkId });
  console.log("DATA PROCESSOR..END", agentResponse)
 // const currIds = await getChunkIds(agentResponse);
  //const allIds: number = currIds.length + +state.dataChunkId;
  const allIds: number = +state.dataChunkId + 1;
  console.log("NUM...", allIds);
  state["dataChunkId"] = allIds.toString();
  const id: string = "chunk_" + allIds.toString();
 // const currIds: string[] = [id];
  const response =  await client.queryChunkedVectors(dbQuery,"filtered_global_temperatures", id, client.dataChunk)// global_temperatures.csv
   let count: string = client.dataChunk.count.toString();
   let data: string = heading + client.dataChunk.data;
   let ids: string[] = client.dataChunk.ids;
   let idStr: string = "[";
   ids.forEach(id =>{
     idStr = idStr + '"' + id + '"' + ",";
   });
   idStr = idStr.substring(0, idStr.length - 1) + "]";
   
   const res = "Count: " + count + ". Data: " + data + ". Ids: " + idStr;
   console.log("RES..",res)
   state["toolUse"] = "Data processor";
   state["data"] = res; 
 
   //each iteration will produce new data finding until there is "yes"
   //the last finding will be at end of retention file.
  if(allIds > client.dataChunk.count){
    //this is a precaution in case the agent doesn't signal no
    state["dataFindings"] = "no" + "data findings: " + agentResponse;
  } else {
    state["dataFindings"] = agentResponse;
  }
  
  client.updateDataAnalysisDocuments("data_findings", agentResponse);
   
 return state;
}

async function retrieverAgent(state: typeof StateAnnotation.State) {
  console.log("HERE...Ret")
  
  const agentResponse = await retrieverChain.invoke({ requirement: state.requirement});
  state.data = agentResponse;

  //temp use of Data processor to test tool agent from retriever
  state["toolUse"] = "Data processor";
  return state;
}

// Define a new graph
const workflow = new StateGraph(StateAnnotation)
  .addNode("coder", codeAgent)
  .addNode("retriever", retrieverAgent)
  .addNode("dataProcessor", dataProcessorAgent)
  .addNode("evaluator", evalAgent)
  .addNode("dataAnalyzer",dataAnalyzerAgent)
  .addNode("analyzer",analyzerAgent)
  .addNode("tools", toolAgent)
  .addNode("dataAnayzer", dataAnalyzerAgent)
  .addEdge("__start__", "retriever")
  .addEdge("retriever", "dataProcessor")
  .addEdge("dataAnalyzer","coder")
  //.addEdge("retriever", "dataAnalyzer")
  .addEdge("coder", "analyzer")
  .addEdge("analyzer" , "tools")
  .addEdge("tools", "evaluator")
 // .addConditionalEdges("tools", checkForErrors)
  .addConditionalEdges("dataProcessor", checkForErrors)
  .addConditionalEdges("evaluator", shouldContinue);//was evaluator

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
  const dataCSV:string[][] = 
  [['1912,-0.25,-0.14,-0.38,-0.17,-0.21,-0.24,-0.42,-0.54,-0.57,-0.57,-0.39,-0.43'],
  ['1913,-0.4,-0.45,-0.42,-0.39,-0.44,-0.45,-0.36,-0.34,-0.34,-0.32,-0.2,-0.03'],
  ['1914,0.04,-0.1,-0.24,-0.3,-0.21,-0.25,-0.23,-0.16,-0.17,-0.03,-0.16,-0.04'],
  ['1915,-0.21,-0.04,-0.1,0.06,-0.06,-0.22,-0.13,-0.22,-0.2,-0.24,-0.13,-0.21'],
  ['1916,-0.13,-0.15,-0.29,-0.3,-0.35,-0.49,-0.37,-0.28,-0.36,-0.34,-0.46,-0.81'],
  ['1917,-0.57,-0.63,-0.63,-0.55,-0.55,-0.43,-0.25,-0.22,-0.23,-0.44,-0.34,-0.68'],
  ['1918,-0.48,-0.34,-0.25,-0.44,-0.43,-0.36,-0.32,-0.32,-0.17,-0.06,-0.12,-0.3'],
  ['1919,-0.21,-0.23,-0.22,-0.13,-0.28,-0.36,-0.29,-0.33,-0.25,-0.2,-0.42,-0.42']]
 /* await writeCSVFile(dataCSV).then(d => {
    console.log("DDD", d)
  })*/
  //Get web elements and put in llamaindex documents
/*const browser = new Browser();
  browser.get("C:/salesforce/repos/SVG/chart5_1.html")
  await browser.findElements().then(_ => {
    //createSVGMappingFile();
  });*/
 //await client.queryDataAnalysisVectorStore("data_findings");
 let requirement = "The requirement is to produce a d3 js bar graph depicting the wages of one industry: 'Agriculture' for all years '2001' to '2021'. You will be provided with the years and the wages as an input string in CSV format.";
 requirement= `Create a d3 js line graph with a legend at the bottom of the graph. 
 The graph depicts the wages of employees in 3 industries for the years 2001,2002,2003. 
 The industries are: Agriculture, Mining, Utilities. `

 requirement = `
 The requirement is to produce a d3 js bubble chart depicting the temperatures for every year from 1880 to 2000 
 where each of the monthly values are clustered for each year. So the span between each year will contain the values 
 represented as small circles for the 12 months: 'Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec'. 
 The range of the temperatures is -0.8 to +1. Indicate the zero temperature line clearly. Use a color spectrum from blue 
 for the colder temperatures through to orange-yellow for warmer temperatures.
 `
 
 const data = `Industry,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001
Agriculture,58085,55553,53853,53706,52389,51298,49938,48922,47935,47253,47191,46449,44886,43869,42319,40592,39199,38216,37205,36297,34591` 
 //const data = `75,104,369,300,92,64,265,35,287,69,52,23,287,87,114,114,98,137,87,90,63,69,80,113,58,115,30,35,92,460,74,72,63,115,60,75,31,277,52,218,132,316,127,87,449,46,345,48,184,149,345,92,749,93,9502,138,48,87,103,32,93,57,109,127,149,78,162,173,87,184,288,576,460,150,127,92,84,115,218,404,52,85,66,52,201,287,69,114,379,115,161,91,231,230,822,115,80,58,207,171,156,91,138,104,691,74,87,63,333,125,196,57,92,127,136,129,66,80,115,87,57,172,184,230,153,162,104,165,1036,69,196,38,92,162,806,105,69,29,633,102,87,345,58,56,35,49,92,156,58,104,167,115,87,800,87,322,65,149,34,69,69,391,58,58,207,61,253,109,69,57,56,114,58,80,149,287,57,138,92,87,103,230,57,724,50,92,79,92,45,196,29,69,253,173,438,173,218,115,58,92,115,230,87,287,53,80,92,89,4607,173,96,80,115,104,138,92,48,98,231,127,114,91,115,80,403,253,75,63,69,92,171,58,104,47,53,80,213,1498,104,125,127,58,432,90,52,69,173,75,69,139,127,45,87,138,92,58,208,52,149,60,89,119,287,74,138,171,391,104,35,92,656,90,92,103,69,345,115,87,107,93,92,247,172,58,34,99,104,57,80,345,461,330,80,75,94,104,218,58,115,79,108,184,115,60,101,40,92,102,3283,126,92,225,107,288,63,62,80,69,115,46,102,60,40,345,63,114,74,80,144,56,127,98,104,71,98,104,92,208,287,93,230,196,290,164,91,115,40,92,127,231,104,58,610,225,183,98,81,115,97,438,111,173,346,80,172,126,126,317,59,52,197,80,58,577,127,214,71,32,127,115,64,149,1035,80,1612,98,92,58,278,45,69,215,69,92,172,75,58,101,80,137,805,515,149,92,93,125,63,863,231,115,70,115,80,127,98,127,113,69,61,645,23,69,58,104,196,137,93,518,145,58,103,69,123,53,173,230,63,403,93,115,87,74,90,1036,93,160,201,131,460,287,61,98,64,46,138,149,74,56,80,92,67,133,403,160,138,63,69,69,331,92,368,103,92,180,114,58,115,144,345,172,98,76,67,68,80,345,490,62,190,46,91,231,93,79,83,115,58,139,162`
//For chunking create the initial chromadb collection
 client.createCollection("filtered_global_temperatures", "C:/Anthropic/global_temperatures.csv");//global_temperatures.csv
 const inputs = {"data": "", "requirement": requirement,"score": "no", "toolQuestion": "","answer": "", "html": "", "dataFindings": "", "dataChunkId": "0"}
 // console.log(inputs)
  var config =  { "configurable": { "thread_id":   "42" } }
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