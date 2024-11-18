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
    const path = 'C:/salesforce/repos/Claude tools/';
    const svgFile = "svg.txt";
    const xfile = "tickX.txt";
    const yfile = "tickY.txt";
    const rectFile = "rect.txt";
    const pathFile = "path.txt";
    const linePathFile = "linePath.txt";
    let docs:Document[] = [];
   
   // let data = await readFileSync(path+svgFile,  "utf-8");

    /*let svg = new Document({ text: data, id_: "view_box", metadata:{svgId: "000"} });
    docs.push(svg);
    data = await readFileSync(path+xfile,  "utf-8");
    let tick_x = new Document({ text: data, id_: "tick_x", metadata:{svgId: "010"} });
    docs.push(tick_x);
    data = await readFileSync(path+yfile,  "utf-8");
    let tick_y = new Document({ text: data, id_: "tick_y", metadata:{svgId: "011"} });
    docs.push(tick_y);

    data = await readFileSync(path+rectFile,  "utf-8");
    let rects = new Document({ text: data, id_: "rects", metadata:{svgId: "001"} });
    docs.push(rects);
    data = await readFileSync(path+pathFile,  "utf-8");
    let paths = new Document({ text: data, id_: "paths", metadata: {svgId: "100"}});
    docs.push(paths);

    data = await readFileSync(path+linePathFile,  "utf-8");
    let linePaths = new Document({ text: data, id_: "chart_lines", metadata: {svgId: "110"}});
    docs.push(linePaths);*/
    if (fs.existsSync('./svgMapping.txt')) {
      let data = await readFileSync('./svgMapping.txt', 'utf8');//mapping of svg.txt
      let manual = new Document({ text: data, id_: "user_manual", metadata: {svgId: "111"}});
      docs.push(manual);
    }

    return docs;
  }
  
//createToolCallingAgent();
export {}