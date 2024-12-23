import { Anthropic, FunctionTool, Settings, WikipediaTool, AnthropicAgent, OpenAIEmbedding,} from "llamaindex";
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

//Settings.llm = anthropic;
//Settings.embed_model = embed_model
Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});
  const embedModel = new OpenAIEmbedding();
  Settings.embedModel = embedModel;
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
  * called from retrievers tool csvDataTool to 
  * interact with chroma store of the csv vectors
  * input_ is retriever's query passed to csvdatatool
  * 1. Fetch the chunked data
  * 2. Place in llamaindex vector store
  * 3. Query it
  * 4. Call getCSVData to create object for csv writer
  * 5. Write csv
  * 6. Create new collection to be used by embedDataTool
  */
export async function loadCSVFile(input: any){
  console.log("INPUT....LLAMA", input)
  const client: ChromaClient = new ChromaClient({})
  const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env["OPENAI_API_KEY"] as string,
    openai_model: "text-embedding-3-small"
  })
  const name = "filtered_global_temperatures";
  const allData: string[][] = [];
  const collection = await client.getCollection({name: name, 
    embeddingFunction: embeddingFunction});
  const count = await collection.count();
  //Iterate all the chunks
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
    rows of years are the years between 1880 and 2000 .\n Just return the requested data without comment`;
   //Put each chunk in a vector store and query it
    
   const index = await VectorStoreIndex.fromDocuments([document]);
    const loadedQueryEngine = index.asQueryEngine();
    const response = await loadedQueryEngine.query({
      query: input,
   });
    
    //The llamaindex query returns a string of the chunked data that
    //is all the years and data are in one string. This function
    //returns each year's data as one string array in the array allData
    /******************************
    * "Year, Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec  
      1880, -0.2, -0.26, -0.09, -0.17, -0.1, -0.22, -0.2, -0.11, -0.16, -0.23, -0.23, -0.19  
      1881, -0.2, -0.16, 0.02, 0.04, 0.06, -0.19, 0.01, -0.04, -0.16, -0.22, -0.19, -0.08"
      is one string 
    */
  //  await getCSVData(response?.message.content.toString(), allData);
   //     console.log("ALL DATA...", allData)
  }
  //Each string in set of years is parsed as:
  //"year:1880;jan:-0.2;...dec:-019;"
  //Now that the out_csv is created and this works just get file now
 // await writeCSVFile(allData);
  const chromaAgent: ChromaAgent = new ChromaAgent();
  await chromaAgent.createCollection("filtered_global_temperatures","C:/salesforce/repos/Claude tools/out.csv");
}
export {};