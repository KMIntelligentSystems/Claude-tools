import {ChromaVectorStore,OpenAIEmbedding, SimpleDirectoryReader, VectorStoreIndex,  OpenAI,
    Settings, StorageContext, HuggingFaceEmbedding,VectorStoreQueryMode,  Document, RetrieverQueryEngine, QueryEngineTool,
OpenAIAgent} from "llamaindex";
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import * as fs from 'fs';

 /****************************************
   * vector-store based indices generate embeddings during index construction
   * Meaning the LLM endpoint will be called during index construction to generate embeddings data.
   * 
   */
 export async function getToolCallingAgent(request: string) {
    Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});

    const documents =  await getDocumentNodes() as Document[];
    // Split text and create embeddings. Store them in a VectorStoreIndex
    const index = await VectorStoreIndex.fromDocuments(documents);
    const retriever = index.asRetriever({
        similarityTopK: 10,
      });
    const queryEngine = index.asQueryEngine();
    const res = await queryEngine.query({
      query: request,
    });
console.log(res)
    return res;
    // define the query engine as a tool
     // Query the index
    /*const queryEngine = index.asQueryEngine({
        retriever,
      });*/
  /*  const tools = [
      new QueryEngineTool({
        queryEngine: queryEngine,
        metadata: {
          name: "svg_customized_as_xml",
          description: `This tool provides data about a x-y axes SVG defined chart from which can be deduced the appearance of the chart.`,
        },
      }),
    ];
  
    return tools;*/
    
    
  }

  /****************************************
   * Read each file with their custom svg elements
   * Create llamaindex documents
   */
  export async function getDocumentNodes(){
    let docs:Document[] = [];
   
    while(true)
    {
      if (fs.existsSync('./svgMapping.txt')) {
        sleep(4000);
        let data = await readFileSync('./svgMapping.txt', 'utf8');//mapping of svg.txt
        let manual = new Document({ text: data, id_: "user_manual", metadata: {svgId: "111"}});
        docs.push(manual);
        break;
       /* const path = "C:/salesforce/repos/Claude tools/";
        const svgFile = "svgMapping.txt"
        if(fs.existsSync(path+svgFile)){
          unlinkSync(path+svgFile);
        }*/
      
      }
    }
    return docs;
  }

  async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
//createToolCallingAgent();
export {}