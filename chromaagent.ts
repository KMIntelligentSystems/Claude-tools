import {ChromaVectorStore, SimpleDirectoryReader, VectorStoreIndex, StorageContext, HuggingFaceEmbedding} from "llamaindex";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import { chunkData } from './tools';

class DataChunk{
  public count: Number = 0;
  public data: string = "";
  public ids: string[] = [];
}
export class ChromaAgent{
    public dataChunk = new DataChunk();
    public client:ChromaClient = new ChromaClient({});
    public async setChromaStore(){
        const collection:any = await this.client.getOrCreateCollection({
            name: "my_collection",
        });
        const vectorstore: ChromaVectorStore = new ChromaVectorStore({collectionName: collection});
    }

   public async delCollection(name: string, ids: string)
   {
    const embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: process.env["OPENAI_API_KEY"] as string,
      openai_model: "text-embedding-3-small"
    })
    const collection: any = await this.client.getOrCreateCollection({name: name, embeddingFunction: embeddingFunction});
    await collection.delete({ids: ids})
   }

    public async  getDocumentChromaNodes(svgFile: string, id: string, metadata: string){
    
      
      let data = await readFileSync(svgFile,  "utf-8");
      const embeddingFunction = new OpenAIEmbeddingFunction({
        openai_api_key: process.env["OPENAI_API_KEY"] as string,
        openai_model: "text-embedding-3-small"
      })
      const collection: any = await this.client.getOrCreateCollection({name: "svg_elements", embeddingFunction: embeddingFunction});
      //  await collection.delete({ids: "SVG_Text"})
        await collection.add({
          documents: data,
          ids: id,
          metadatas: [{ "source": metadata }],
        });

    

    return collection;
    }

    public async createCollection(name: string){
            const csvPath_ = "C:/Anthropic/global_temperatures.csv";
            let data = await readFileSync(csvPath_,  "utf-8");
            const textSplitter = new RecursiveCharacterTextSplitter();
            textSplitter.chunkSize = 1000;
            textSplitter.chunkOverlap = 50;
            const chunks = textSplitter.splitText(data);
            let strs: string[] = await chunkData();
            const docs = await textSplitter.createDocuments(strs)
            const embeddingFunction = new OpenAIEmbeddingFunction({
              openai_api_key: process.env["OPENAI_API_KEY"] as string,
              openai_model: "text-embedding-3-small"
            })
            
            const collection = await this.client.getOrCreateCollection({name: name, embeddingFunction: embeddingFunction});
            strs.forEach(async (chunk, index) => {
              await collection.add({
                ids: `chunk_${index}`,
                documents: chunk,
              });
            });
          }

    /*************************************
     * Called from langgraph svg_xmlDataTool
     */
    public async loadCSVFile(query: string,name: string, chunk: DataChunk){
console.log("query ", query)
      const embeddingFunction = new OpenAIEmbeddingFunction({
        openai_api_key: process.env["OPENAI_API_KEY"] as string,
        openai_model: "text-embedding-3-small"
      })
      const collection = await this.client.getCollection({name: name, embeddingFunction: embeddingFunction});
      const results = await collection.get({ids: chunk.ids})
      chunk.count = await collection.count();
    /*  const results = await collection.query({
        queryTexts: [query],
        nResults: 1,
      });*/
    //  console.log("VAL........",results)
      chunk.data = results.documents.toString();
      return results.documents.toString();
    }

    public async queryChunkedVectors( query: string,name: string, ids: string[]){
      const embeddingFunction = new OpenAIEmbeddingFunction({
        openai_api_key: process.env["OPENAI_API_KEY"] as string,
        openai_model: "text-embedding-3-small"
      })
      const collection = await this.client.getCollection({name: name, embeddingFunction: embeddingFunction});
      const results = await collection.query({
        queryTexts: [query],
        nResults: 1,
      });
  
    console.log("queryText", results.documents);
    return results.documents.toString();
    }


    public async loadTextFile(){
      const csvPath = "./svg mapping.txt";
      let data = await readFileSync('./svg mapping.txt',  "utf-8").toString();

      const embeddingFunction = new OpenAIEmbeddingFunction({
        openai_api_key: process.env["OPENAI_API_KEY"] as string,
        openai_model: "text-embedding-3-small"
      })
    const collection = await this.client.getOrCreateCollection({name: "svg_elements", embeddingFunction: embeddingFunction});
    await collection.add({
      documents: data,
      ids: "SVG_Text",
    //  metadatas: [{ "svgType": "width_and_height" }],
    });
    const results = await collection.query({
      queryTexts: ["Tell me about path categories"],
      nResults: 20,
    });

  console.log("queryText", results.documents);
    }


    public async saveHtml(counter: number, value: string, type: string){
    
        //const json = await this.kvstore.get("rect", this.nodeCollection);
        //await this.client.deleteCollection({name: "my_collection"})
        const collection = await this.client.getOrCreateCollection({
          name: "my_collection",
        });
        
        await collection.add({
          documents: [
            value,
          ],
          ids: [type + counter],
        });
    
        
      }

    public async setSVGData(counter: number, value: string, type: string){
    
        //const json = await this.kvstore.get("rect", this.nodeCollection);
        //await this.client.deleteCollection({name: "my_collection"})
        const collection = await this.client.getOrCreateCollection({
          name: "my_collection",
        });
        
        await collection.add({
          documents: [
            value,
          ],
          ids: [type + counter],
        });
    
        
      }

    public async getRects(){
        const collection:any = await this.client.getOrCreateCollection({
            name: "my_collection",
        });
        const response = await collection.get({
            ids: ["rect1", "rect2", "rect3", "rect4","rect5", "rect6","rect7", "rect8", "rect9"],
            // where: { "key": "value" },
             limit: 10,
             offset: 0,
            //include: ["embeddings", "metadatas", "documents"],
            //whereDocument: { $contains: "value" },
          });
    }

    public async getDockerContainer(){
        //const remote_db = this.client..HttpClient()
    }
 
}