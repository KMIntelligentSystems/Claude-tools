import {ChromaVectorStore, SimpleDirectoryReader, VectorStoreIndex, StorageContext,Document, storageContextFromDefaults, serviceContextFromDefaults} from "llamaindex";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import { chunkData, writeAFile } from './tools';

class DataChunk{
  public count: number = 0;
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
        
    }

   public async delCollection(name: string, ids: string[])
   {
    const embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: process.env["OPENAI_API_KEY"] as string,
      openai_model: "text-embedding-3-small"
    })
    const chromaVS: ChromaVectorStore = new ChromaVectorStore({collectionName:name});
    chromaVS.delete("");

    const index = await VectorStoreIndex.fromVectorStore(chromaVS);

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

    /*****************************************
     * Create a collecion to hold the  initial CSV data
     * creates the collection before the agents are invoked
     * Error about Context Window limit :
     * "This model's maximum context length is 8192 tokens, 
     * however you requested 10868 tokens" 
     * Each chunk has to have a header added except the first which has the csv header
     */
    public async createCollection(name: string, csvPath: string, header: string){
            let data = await readFileSync(csvPath,  "utf-8");
            const textSplitter = new RecursiveCharacterTextSplitter();
            textSplitter.chunkSize = 500;
            textSplitter.chunkOverlap = 50;
        
            const docs = await textSplitter.createDocuments([data])
            const embeddingFunction = new OpenAIEmbeddingFunction({
              openai_api_key: process.env["OPENAI_API_KEY"] as string,
              openai_model: "text-embedding-3-small"
            })
          
            const collection = await this.client.getOrCreateCollection({name: name, 
              embeddingFunction: embeddingFunction});
            docs.forEach(async (chunk, index) => {
              if(!chunk.pageContent.includes(header)){
                chunk.pageContent = header + chunk.pageContent;
              }
              await collection.add({
                ids: `chunk_${index}`,
                documents: chunk.pageContent,
              });
            });
        }

        /***************************************************
         * Called from llamaindex after parsing input data from loadCSVData
         * to embed so that processor can go through the chunks and add to memory file
         */
        public async createVectorStoreEmbedding(name: string, data: string){
          writeAFile("C:/salesforce/repos/Claude tools/chroma.txt", data)
          const textSplitter = new RecursiveCharacterTextSplitter();
            textSplitter.chunkSize = 500;
            textSplitter.chunkOverlap = 50;
        
            const docs = await textSplitter.createDocuments([data])
          const embeddingFunction = new OpenAIEmbeddingFunction({
            openai_api_key: process.env["OPENAI_API_KEY"] as string,
            openai_model: "text-embedding-3-small"
          })
          writeAFile("C:/salesforce/repos/Claude tools/chroma.txt", "----------------------")
          

        
          const collection = await this.client.getOrCreateCollection({name: name, 
            embeddingFunction: embeddingFunction});
            docs.forEach(async (chunk, index) => {
              writeAFile("C:/salesforce/repos/Claude tools/chroma.txt", chunk.pageContent)
              await collection.add({
                ids: `chunk_${index}`,
                documents: chunk.pageContent,
              });
            });
        }

          // let meta: Record<string,string>  = {"id": `chunk_${index}` };

    /*************************************
     * Called from langgraph embedDataTool
     * The data has already been loaded by tools.ts at start of run
     * Loads first chunk to start the process to Data Processor
     * name = "filtered_global_temperatures"
     * datachunk[0]
     */
    public async getCSVData(query: string,name: string, chunk: DataChunk){
      console.log("query ", query)
      const requirement = `select data where the months: 'Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec' and the 
      rows of years are all the years from 1880 to 2000.\n Just return the requested data without comment.
      `
      const embeddingFunction = new OpenAIEmbeddingFunction({
        openai_api_key: process.env["OPENAI_API_KEY"] as string,
        openai_model: "text-embedding-3-small"
      })
      const collection = await this.client.getCollection({name: name, embeddingFunction: embeddingFunction});
      const results = await collection.get({ids: chunk.ids})//chunk.ids
     /* const results_ = await collection.query({nResults: 1, 
      //  where: {"id": "chunk_0"}, 
        queryTexts: [requirement ], });

        console.log("GET CSV DATA ", results_)*/
      chunk.count = await collection.count();
      chunk.data = results.documents.toString();
      return results.documents.toString();
    }

    /************************************************
     * Called from Data Processor 
     */
    public async queryChunkedVectors(query: string, name: string, id: string, chunk: DataChunk){
      const embeddingFunction = new OpenAIEmbeddingFunction({
        openai_api_key: process.env["OPENAI_API_KEY"] as string,
        openai_model: "text-embedding-3-small"
      })
      const collection = await this.client.getCollection({name: name, embeddingFunction: embeddingFunction});
      const results = await collection.get({
        ids: id,
      });
 /*     const q = `select data where the months: 'Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec' and the 
    rows of years are the years between 1880 and 2000`;
      const results_ = await collection.query({nResults: 1, 
        where: {ids: id},// n_results
        queryTexts: [q], });
      console.log("TESTING CHROMADB QUERY...", results_)*/

      chunk.count = await collection.count();
      chunk.data = results.documents.toString();
      chunk.ids = [id];
      return results.documents.toString();
    }

    /***********************************************
     * obsolete Use Chroma store to save the data findings of  
     * data processor agent
     */
    public async createDataAnalysisVectorStore(name: string, data: string){
      const chromaVS: ChromaVectorStore = new ChromaVectorStore({collectionName:name});
      const index = await VectorStoreIndex.fromVectorStore(chromaVS);
      const ctx = await storageContextFromDefaults({ vectorStore: chromaVS });

      const document: Document = new Document({ text: data });
      await VectorStoreIndex.fromDocuments([document], {
        storageContext: ctx,
      });
    
    }

    /*************************************************
     * Update data findings from the tool invocation for llamaindex
     * to analyse the chunked data.
     */
    public async updateDataAnalysisDocuments(name:string,  data: string){
      writeFileSync("C:/salesforce/repos/Claude tools/retainDataFindings.txt", data+"\n", {
        flag: 'a',
      });
    /*  const chromaVS = new ChromaVectorStore({collectionName: name });
      if(!chromaVS){
        await this.createDataAnalysisVectorStore(name, data);
      } else {
        const index = await VectorStoreIndex.fromVectorStore(chromaVS);
        const document: Document = new Document({ text: data });
        await index.insert(document);
      }*/
    }

    //https://github.com/run-llama/LlamaIndexTS/blob/8386510d86711f5b37a29b4862ebd7dd9c2b4c9a/examples/chromadb/preFilters.ts#L13
    public async queryDataAnalysisVectorStore(collectionName: string){
      const chromaVS = new ChromaVectorStore({ collectionName });
      const index = await VectorStoreIndex.fromVectorStore(chromaVS);
      const queryEngine = index.asQueryEngine();
      const response = await queryEngine.query({ query:"provide all data" });
      console.log(response.toString());
  
      /*const queryFn = async (filters?: MetadataFilters) => {
        console.log("\nQuerying dogs by filters: ", JSON.stringify(filters));
        const query = "List all colors of dogs";
        const queryEngine = index.asQueryEngine({
          preFilters: filters,
          similarityTopK: 3,
        });
        const response = await queryEngine.query({ query });
        console.log(response.toString());
      };*/
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