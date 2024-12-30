import { Anthropic, FunctionTool, Settings, WikipediaTool, AnthropicAgent, OpenAIEmbedding} from "llamaindex";
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
import {str0,str1, str2, str3, str4, str5} from './data'
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { Document } from "llamaindex";
//import { requirement } from './langgraph'
import { PapaCSVReader } from "llamaindex/readers/CSVReader";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { ChromaAgent } from "./chromaagent";
import { getBinData, stringifyBinRecords, cleanseData, writeFile, writeAFile } from "./tools"
import { ANTHROPIC_API_KEY } from './langgraph'

Settings.callbackManager.on("llm-tool-call", (event:any) => {
  console.log("llm-tool-call", event.detail.toolCall);
});

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  model: "claude-3-opus",
});

//Settings.llm = anthropic;
//Settings.embed_model = embed_model
//OpenAI
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
export async function loadCSVFile(input: any, prevData: Record<string,number>[]){
  console.log("INPUT....LLAMA", input)
  const client: ChromaClient = new ChromaClient({})
  const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env["OPENAI_API_KEY"] as string,
    openai_model: "text-embedding-3-small"
  })
  const name = "price_histogram"; //"filtered_global_temperatures"; //;
  let consolidated: Record<string, number>[] = [];//prevData;
  const allData: string[][] = [];
  const collection = await client.getCollection({name: name, 
    embeddingFunction: embeddingFunction});
  const count = await collection.count();
  console.log("COUNT ", count)
  //Iterate all the chunks
  for(let i = 0; i < count; i++){
    const results = await collection.get({
      ids: `chunk_${i}`,
    });
    console.log(`chunk_${i}`)
  //  console.log("CONSOLIDATED", consolidated)
    await writeFile("C:/salesforce/repos/Claude tools/consolidated.txt", consolidated,"price");
    let doc = results.documents[0]?.toString();

   // console.log('DOC ', doc)
    //Add header to all subsequent chunks
   /* if(!doc?.includes("Year"))
    {
      doc = "Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec\n"  + doc;
    }*/
   if(doc?.includes("price")){
     doc = doc.substring("price".length + 1);
   }
   
    const document: Document = new Document({ text: doc, id_: "user_manual", metadata: {svgId: "111"}})
    let input = `select data where the months: 'Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec' and the 
    rows of years are the years between 1880 and 2000 .\n Just return the requested data without comment`;
    
    input = `Order the data in ascending order. Count the unique numbers in the list. Output the unique number and the count of that number.
    Just output the list of numbers and their frequencies separated by a colon (":") `
   //Put each chunk in a vector store and query it
   //sleep(1000)
  let response: string = await queryVectorStore(input, document);
  let data = await cleanseData(response);
   //console.log("LLAMAINDEX....", data)
   consolidated  = await getBinNumbers(data, consolidated, i);
  // consolidated = [];
 //  await consolidateData(temp, consolidated);
   
//KEEP   
//  const chromaAgent: ChromaAgent = new ChromaAgent(); 
// await chromaAgent.createVectorStoreEmbedding("price_histogram_llama", response.toString(), i);
  
   // await updateVectorStore("price_histogram_llama", i-1,  response.toString() );
  
   
    //USED TO PARSE THE RETURNED STRINGS FROM RAG INTO CSV FILE FOR DATA PROCESSOR. NOT NEEDED
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
  return consolidated;
  //Each string in set of years is parsed as:
  //"year:1880;jan:-0.2;...dec:-019;"
  //Now that the out_csv is created and this works just get file now
 // await writeCSVFile(allData);
 // const chromaAgent: ChromaAgent = new ChromaAgent();
 // await chromaAgent.createCollection("price_histogram","C:/salesforce/repos/Claude tools/out.csv", "");//filtered_global_temperatures
}

/***************************************************
 * Change the bin data as Records to strings to be stored 
 * in ChromaDB
 */
export async function updateChromaDB(records: Record<string, number>[]){
  const data = await stringifyBinRecords(records, "price");
  const chromaAgent: ChromaAgent = new ChromaAgent(); 
  await chromaAgent.createVectorStoreEmbedding("price_histogram_llama", data);
}

export async function loadCSVFile_(input: any, prevData: Record<string,number>[]){
  console.log("INPUT....LLAMA", input)

  let consolidated: Record<string, number>[] = await getBinNumbers(str0, prevData, 0);
  prevData = consolidated;
 console.log("DATS", prevData)
 /*consolidated =  await getBinNumbers(str2, prevData, 1);
 prevData = consolidated;
  consolidated =  await getBinNumbers(str3, prevData, 2);
 prevData = consolidated;
  consolidated =  await getBinNumbers(str4, prevData, 3);
 prevData = consolidated;
  consolidated =  await getBinNumbers(str4, prevData, 4);
 prevData = consolidated;
  consolidated =  await getBinNumbers(str5, prevData, 4);
  prevData = consolidated;*/
   
  return consolidated;
}

export async function getBinNumbers(response: string, prevData: Record<string,number>[], pos: number){
  let consolidated: Record<string, number>[] = await getBinData(response, prevData,pos );
  return consolidated;
}

async function queryVectorStore(input: string,document: Document){
  let result = "";
  try{
    const index = await VectorStoreIndex.fromDocuments([document]);
     const loadedQueryEngine = index.asQueryEngine();
     const response = await loadedQueryEngine.query({
       query: input,
    });
    result = response.toString();
   } catch (e) {
     console.error(e);
   }
   return result;
}

export async function delChromaCollectionIds(name: string)
{
  const ids: string[] = [];
  const client: ChromaClient = new ChromaClient({})
  const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env["OPENAI_API_KEY"] as string,
    openai_model: "text-embedding-3-small"
  });
  const collection = await client.getCollection({name: name, 
    embeddingFunction: embeddingFunction});
  const count = await collection.count();
  for(let i = 0; i < count; i++){
    let id = `chunk_${i}`;
    ids.push(id);
  }
  if(ids.length > 0){
    console.log("here del   ")
    const client = new ChromaAgent();
    await client.delCollection(name, ids);
  } else{
    console.log("here del  NOT ")
  }
  
}

async function updateVectorStore(name: string, index: number,list: string ){
  const client: ChromaClient = new ChromaClient({});
  const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env["OPENAI_API_KEY"] as string,
    openai_model: "text-embedding-3-small"
  })
 
  const collection = await client.getCollection({name: name, 
    embeddingFunction: embeddingFunction});
    const results = await collection.get({
      ids: `chunk_${index}`,
    });
    const input = "There are 2 lists of unique numbers and their frequency in the lists. One is your list. The other is an input list: " 
    + list + `. This list is a string which can be parsed as a list looking for the new line delimiter ('\n'). Look for the delimiters to find a number and frequency. Your task is look at each item of the input list, check if you have that unique number and if you do 
    add the frequency of that number to your unique number. 
    If there are no occurrences in your list of this item from the input list then just add it to the bottom of your list. Return the consolidated list`
    let doc = results.documents[0]?.toString();
    const document: Document = new Document({ text: doc, id_: "user_manual", metadata: {svgId: "111"}})
    const ind = await VectorStoreIndex.fromDocuments([document]);
    const loadedQueryEngine = ind.asQueryEngine();
    const response = await loadedQueryEngine.query({
      query: input,
   });
  /*  const results_ = await collection.query({nResults: 1, 
       // where: {"ids": `chunk_${index}`}, 
        queryTexts: ["Using this list of numbers: " + list + `. For each item in the list there is a unique number and its frequency. 
          Find the same numbers in your list and increment your unique number with the number of occurrences
          in the input list. If there are no occurrences in your list just add it to the bottom of your list. Return the consolidated list`], });
*/
        console.log("GET CSV DATA ", response)

  //  let doc = results.documents[0]?.toString();
  
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export {};