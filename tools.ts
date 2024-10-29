import {ChromaVectorStore,OpenAIEmbedding, SimpleDirectoryReader, VectorStoreIndex,  OpenAI,
  Settings, StorageContext, HuggingFaceEmbedding,VectorStoreQueryMode, RetrieverQueryEngine,OpenAIAgent} from "llamaindex";
import { promises as fsPromises } from 'fs';
import { ChromaClient, CollectionType } from "chromadb";
import {
   // ChromaVectorStore,
    Document,
   // VectorStoreIndex,
    storageContextFromDefaults,
  } from "llamaindex";

  import * as fs from 'fs';
 /* import {setRectDbEmbedding, setSVGDbEmbedding, setTransformsDbEmbedding, 
    setTranslateDbEmbedding, setTickLineDbEmbedding, setTickTextDbEmbedding, setPathDbEmbedding,
  } from './vectorstoreEmbedding'
  import { getRectDbEmbedding, getSVGDbEmbedding, getTransformDbEmbedding, 
    getTranslateDbEmbedding, getTickLineXDbEmbedding, getTickTextYDbEmbedding, getPathDbEmbedding
  } from './vectorstoreEmbedding'*/
  import { DynamicTool } from "@langchain/core/tools";
  import { readFileSync, writeFileSync, unlinkSync } from 'fs';
  import { getToolCallingAgent, getDocumentNodes } from './llamaindexanalyzertool'

  /*Get web elements from chroma and create xml
   1. Get the svg data from chromadb using collection and the names: svg01, svg02, up to 4 translate, and 40 for rect, path, lineX2, lineY2, line_txtx2, line_txty2
   2. Create the xml from the reslts of 1. Get the details from test.js to complete this.

   REDUNDANT: easier to write files using Selenium - using Chroma hard to synchronize
  */
  
   /*Put xml from above into chromaDb
    Temp: read example xml and put in chroma in setSVGXMLData()
   */
  const collectionName = "SVGCollection";
  const collectionSVG_XML = "SVG_XMLCollection";

   /*********************************
   * Functions called by browser for each svg element
   * mapped to a vector store embedding 
   *********************************/
/*  export async function setSVGData(val: string){
    await setSVGDbEmbedding(val);
  }

  export async function setTransformsData(val: string, id: number){
    console.log("settrans", val)
    setTransformsDbEmbedding(val, id);
  }

  export async function setTranslateData(val: string, id: number){
    setTranslateDbEmbedding(val, id);
  }
  
  export async function setTickLineData(val: string, id: number, type: string){
    setTickLineDbEmbedding(val, id, type);
  }

  export async function setTickTextData(val: string, id: number, type: string){
    setTickTextDbEmbedding(val, id, type);
  }

   export async function setPathData(val: string, id: number){
    setPathDbEmbedding(val, id);
   }

  export async function setSVGRect(rect: string, id: number){
    await setRectDbEmbedding(rect, id);
  }

  export async function getSVGRect(){
    const rects: any = await getRectDbEmbedding();
  }*/

  export async function askSVGToolAgent(){
    const svg_xmlDataTool =  new DynamicTool({
      name: "SVG_XML_Data_Retrieval",
      description:
        "call this to provide the unique XML conceptualization of rendered SVG elements ",
      func: async (request) => {
          const documents: Document[] = await getDocumentNodes();
          const index = await VectorStoreIndex.fromDocuments(documents);
            const retriever = index.asRetriever({
                similarityTopK: 10,
              });
            const queryEngine = index.asQueryEngine();
            const res = await queryEngine.query({
              query: request,
            });
            let result = res.message.content as string;
           
            return result;
        }
      
    });
    await svg_xmlDataTool.invoke("Use the tool as directed");
}

 
  export async function saveHtml(data: string){
        console.log("SAVE...", data);
        try {
            await fsPromises.writeFile("C:/anthropic/chart5.html", data, {
              flag: 'w',
            });
            } catch (err) {
                console.log(err);
            }
  }
    
  export async function saveAnalysisTool(data: string){
    console.log("SAVE...", data);
   /* try {
        await fsPromises.writeFile("C:/anthropic/analysis.txt", data, {
          flag: 'w',
        });
        } catch (err) {
            console.log(err);
        }*/
}