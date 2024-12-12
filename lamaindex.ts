import { Anthropic, FunctionTool, Settings, WikipediaTool, AnthropicAgent, DEFAULT_COLLECTION } from "llamaindex";
import {
  SimpleVectorStore,
  ChromaVectorStore,
  TogetherEmbedding,
  TogetherLLM,
  VectorStoreIndex,
  storageContextFromDefaults,
  SimpleDirectoryReader,
  PromptTemplate,
  getResponseSynthesizer,
  QueryEngineTool,
  ToolMetadata,
  QueryEngineToolParams,
  OpenAI,
  VectorIndexRetriever,
  RetrieverQueryEngine,
  StorageContext,
} from "llamaindex";

import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { Document } from "llamaindex";
//import { requirement } from './langgraph'
import { PapaCSVReader } from "llamaindex/readers/CSVReader";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { ChromaAgent } from "./chromaagent";
import { getCSVData, writeCSVFile } from "./tools"

Settings.callbackManager.on("llm-tool-call", (event:any) => {
  console.log("llm-tool-call", event.detail.toolCall);
});

const anthropic = new Anthropic({
  apiKey: "",
  model: "claude-3-opus",
});

Settings.llm = anthropic;
//Settings.embed_model = embed_model

const agent = new AnthropicAgent({
  llm: anthropic,
  tools: [
    FunctionTool.from<{ location: string }>(
      (query) => {
        return `The weather in ${query.location} is sunny`;
      },
      {
        name: "weather",
        description: "Get the weather",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The location to get the weather for",
            },
          },
          required: ["location"],
        },
      },
    ),
    new WikipediaTool(),
  ],
});


export async function persistCSVData(){
  const path = "C:/Anthropic/US Labour by Industry.csv";
  const storageContext = await storageContextFromDefaults({
    persistDir: "./storage",
  });
  const reader = new PapaCSVReader();
  const documents = await reader.loadData(path);
 // const document = new Document({ text: "Test Text" });
 // const docStore = storageContext.docStore;
  const index = await VectorStoreIndex.fromDocuments(documents, {
    storageContext,
  });
  return index;
}

/*export async function getChunkDataAnalysis(){
  const secondStorageContext = await storageContextFromDefaults({
    persistDir: "./storage",
  });
  if(!secondStorageContext){
    return "";
  }
  const loadedIndex = await VectorStoreIndex.init({
    storageContext: secondStorageContext,
  });
  const loadedQueryEngine = loadedIndex.asQueryEngine();
  const loadedResponse = await loadedQueryEngine.query({
    query: "Provide all the data",
  });
  console.log("EXISTING START...", loadedResponse.toString())
  return loadedResponse.toString();
}

export async function persistChunkDataAnalysis(data: string){
  const existing: string = await getChunkDataAnalysis();
  const storageContext = await storageContextFromDefaults({
    persistDir: "./storage",
  });
  existing.concat(data);
  console.log("EXISTING....", existing)
  const docStore = storageContext.docStore;

  const document: Document = new Document({ text: existing, id_: "user_manual", metadata: {svgId: "111"}})
  const index = await VectorStoreIndex.fromDocuments([document], {
    storageContext,
  });
  return index;
}*/

/**********************************
  * called from retrievers tool csvDataTool to load te llamaindex using
  * CSVLoader from the langchain library
  */
export async function loadCSVFile(input_: any){
  console.log("INPUT....", input_)
  const client: ChromaClient = new ChromaClient({})
  const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env["OPENAI_API_KEY"] as string,
    openai_model: "text-embedding-3-small"
  })
  const allData: string[][] = [];
  const collection = await client.getCollection({name: "global_temperatures.csv", embeddingFunction: embeddingFunction});
  const count = await collection.count();
  for(let i = 0; i < count; i++){
    const results = await collection.get({
      ids: `chunk_${i}`,
    });
    let doc = results.documents[0]?.toString();
    //Add header to all subsequent chunks
    if(!doc?.includes("Year"))
    {
      doc = "Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec\n"  + doc;
    }
    const document: Document = new Document({ text: doc, id_: "user_manual", metadata: {svgId: "111"}})
    
    const input = `select data where the months: 'Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec' and the 
    rows of years are all the years.\n Just return the requested data without comment`;
   
    const index = await VectorStoreIndex.fromDocuments([document]);
    const loadedQueryEngine = index.asQueryEngine();
    const response = await loadedQueryEngine.query({
      query: input,
    });
    
    await getCSVData(response?.message.content.toString(), allData);
   // console.log("ALL DATA...", allData)
  }
  await writeCSVFile(allData);
}

export async function loadCSVFile_(input_: any){
  console.log("INPUT....", input_)

  const input = `select data where the months: 'Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec' and the 
  rows of years are all the years from 1912 to 1919.\n Just return the requested data without comment`;

  const path = "C:/salesforce/repos/Claude tools/global_temperatures.csv";//"C:/Anthropic/US Labour by Industry.csv";
console.log("INPUT...",input)
    const reader = new PapaCSVReader();
    const documents = await reader.loadData(path);
    
    Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});
  /*  Settings.chunkSize = 1000;
    Settings.chunkOverlap = 50;*/
   // console.log("DOCS...", documents)
   const storageContext = await storageContextFromDefaults({
    persistDir: "./storage",
  });
  
  //const index_= await VectorStoreIndex.fromVectorStore()
   const index = await VectorStoreIndex.fromDocuments(documents, {
    storageContext,
  });

 /* const index = await VectorStoreIndex.init({
    storageContext: storageContext,
  });*/
  const loadedQueryEngine = index.asQueryEngine();
  const response = await loadedQueryEngine.query({
    query: input,
  });
 

/*  Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});
  index = await VectorStoreIndex.fromDocuments([document]);
  const queryEngine = index.asQueryEngine();
  const res = await queryEngine.query({
    query: infoAndRequest,
  });*/

 /* const retriever = index.asRetriever();
  const results = await retriever.retrieve({
    query: input,
  });
  for (const result of results) {
    const node = result;
    console.log("NODE....",node)
  }*/
 /* const queryEngine = index.asQueryEngine();
   // Query the index
   const response = await queryEngine.query({
     query: input,
   });*/
console.log("RESPONSE",response?.message.content)
   //console.log("CSV LLAMA", response)
   //return String(response?.message.content);
  // return String(results);
 // return response;
 }

 
export {};