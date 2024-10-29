//import { OpenAI } from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChromaClient, CollectionType , Embedding, Documents, OpenAIEmbeddingFunction} from "chromadb";

import { validateHeaderName } from "http";
import { OpenAIEmbedding, Settings, VectorStoreIndex, ChromaVectorStore, OpenAI, StorageContext, 
  storageContextFromDefaults, serviceContextFromDefaults,  Document, TextNode } from "llamaindex";
//import { Chroma, ChromaLibArgs } from "langchain/vectorstores/chroma";

//const openai = new OpenAI({apiKey:process.env["OPENAI_API_KEY"] as string, model:"gpt-4o"});//"gpt-3.5-turbo-instruct"
/*const openai = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"],
  });*/
const input = '<rect><x>108.75472259521484</x><y>78.82304382324219</y><width>27.169811248779297</width><height>325.1769714355469</height></rect>';

/*const result = await openai.embeddings.create({
  input,
  model: 'text-embedding-3-small',
});

const embeddingResponse: OpenAI.Embeddings.CreateEmbeddingResponse =
  await openai.embeddings.create({
    model: 'text-embedding-ada-002', //is optimized for generating embeddings from text inputs.
    input: "", //sanitizedQuery + getLastAssistantMessageContent(messages),
  });*/

  //For chromadb
  // By default, Chroma uses text-embedding-ada-002
  const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env["OPENAI_API_KEY"] as string,
    openai_model: "text-embedding-3-small"
})

  //Chroma
 /* const client:ChromaClient = new ChromaClient();
  // use directly
  
  async function getChromaEmbedding(){
    //run http://localhost:8000/api/v1/collections 
    //generate is a wrapper
   // const embeddings = await embeddingFunction.generate([input]);
    

    const collection = await client.getOrCreateCollection({name: "rects", embeddingFunction: embeddingFunction});
    

    collection.add({
        documents: [input],
        ids: ['rect01'],
        metadatas: [{ name: input }],
        embeddings: [[1.1]]
      });

      const results = await collection.query({
        queryTexts: ["what are the <x> values"],
        nResults: 2,
      });
    console.log(results.documents);
   
    //const collectionGet = await client.getCollection({name:"rects", embeddingFunction: embeddingFunction})
  }

  function saveToDisk(){
 
  }

  async function deleteCollection(){
    await client.deleteCollection({ name: "transforms"});
    /await client.deleteCollection({ name: "svg"});
    await client.deleteCollection({ name: "translate"});
    await client.deleteCollection({ name: "tick_line_x"});
    await client.deleteCollection({ name: "tick_line_y"});
    await client.deleteCollection({ name: "tick_text_x"});
    await client.deleteCollection({ name: "tick_text_y"});
    await client.deleteCollection({ name: "paths"});
    await client.deleteCollection({ name: "rects"});/
  }

  async function listCollections(name: string){
  let inCollection
  const collections = await client.listCollections({
    //     limit: 10,
    //     offset: 0,
    }).then(n => {
       n.forEach(v => {
        if(v.name == name){
          inCollection = true;
        }
       })
    });
    return inCollection;
  }

  let i = 0;
  export async function setSVGDbEmbedding(val: string){
    i++;
    console.log(i)
    console.log("CREATE", val)
    const collection = await client.getOrCreateCollection({name: "svg", embeddingFunction: embeddingFunction});
    await collection.add({
      documents: [val],
      ids: [i.toString()],
      metadatas: [{ "svgType": "width_and_height" }],
    });   
      
  }
//<transforms><x><y> translate(60,20) translate(0,340)
    let transformId = 1;
    export async function setTransformsDbEmbedding(val: string, id: number){
      console.log("TRAND", val)
      const collection = await client.getOrCreateCollection({name: "transforms", embeddingFunction: embeddingFunction});
      transformId++;
      await collection.add({
          documents: [val],
          ids: [transformId.toString()],
          metadatas: [{ "transform": "global_" + transformId }],
        });
        
    }

    let translateId = 0;
    export async function setTranslateDbEmbedding(val: string, id: number){
      translateId++
      const collection = await client.getOrCreateCollection({name: "translate", embeddingFunction: embeddingFunction});
console.log(translateId)
      await collection.add({
          documents: [val],
          ids: [translateId.toString()],
          metadatas: [{ "translate": "translate" + translateId }],
        });
        
    }

    let tickLineId = 0;
    export async function setTickLineDbEmbedding(val: string, id: number, type: string){
      tickLineId++;
      console.log("TICK", tickLineId)
      if(type == "x2"){
        const collection = await client.getOrCreateCollection({name: "tick_line_x", embeddingFunction: embeddingFunction});
        await collection.add({
            documents: [val],
            ids: [tickLineId.toString()],
            metadatas: [{ "tickline": "x2" + tickLineId }],
          }); 
      } else if(type == "y2"){
        const collection = await client.getOrCreateCollection({name: "tick_line_y", embeddingFunction: embeddingFunction});
        await collection.add({
            documents: [val],
            ids: [tickLineId.toString()],
            metadatas: [{ "tickline_y": "y2" + tickLineId }],
          }); 
      }
    
    }

    let tickTextId = 0;
    export async function setTickTextDbEmbedding(val: string, id: number, type: string){
      tickTextId++;
      if(type == "x2"){
        const collection = await client.getOrCreateCollection({name: "tick_text_x", embeddingFunction: embeddingFunction});
        await collection.add({
            documents: [val],
            ids: [tickTextId.toString()],
            metadatas: [{ "ticktext_x2": "x2" + tickTextId}],
          }); 
      } else if(type == "y2"){
        const collection = await client.getOrCreateCollection({name: "tick_text_y", embeddingFunction: embeddingFunction});
        await collection.add({
            documents: [val],
            ids: [tickTextId.toString()],
            metadatas: [{ "ticktext_y2": "y2" + tickTextId }],
          }); 
      }
    
    }
    let pathId = 0;
    export async function setPathDbEmbedding(val: string, id: number){
      console.log("PATH", val)
      const collection = await client.getOrCreateCollection({name: "paths", embeddingFunction: embeddingFunction});
      pathId++;
      await collection.add({
          documents: [val],
          ids: [pathId.toString()],
          metadatas: [{ "path": "path_" + pathId.toString() }]
        });
        
    }
    
    let rectId = 0;
   export async function setRectDbEmbedding(val: string, id: number){
    const collection = await client.getOrCreateCollection({name: "rects", embeddingFunction: embeddingFunction});
    rectId++;
    await collection.add({
        documents: [val],
        ids: [rectId.toString()],
        metadatas: [{ "rect": "rect_" + rectId }],
       // embeddings: [[embedding]]
      });
      
  }

  export async function getSVGDbEmbedding(){
    const collection = await client.getCollection({name: "svg", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
    console.log("queryText", results.documents);
  }
  //"tick_line_x",
  export async function getTickLineXDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "tick_line_x", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
      
    console.log("queryText", results.documents);
  }
  //tick_line_y
  export async function getTickLineYDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "tick_line_y", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
     
    console.log("queryText", results.documents);
  }

   // "tick_text_y
   export async function getTickTextYDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "tick_text_y", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
  
    console.log("queryText", results.documents);
  }
 //"tick_text_x"
 export async function getTickTextXDbEmbedding(){
  const collection = await client.getOrCreateCollection({name: "tick_text_x", embeddingFunction: embeddingFunction});
  const results = await collection.query({
      queryTexts: ["what are the values"],
      nResults: 20,
    });

  console.log("queryText", results.documents);
}

  export async function getTransformDbEmbedding(){
    //nothing
    const collection = await client.getOrCreateCollection({name: "transforms", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
      /const result = await collection.query({
        queryEmbeddings: [embeddings],
        nResults: 10,
        where: {"metadata_field": "is_equal_to_this"},
    })
    console.log("queryEmbed",result.documents);/
  
    console.log("queryText", results.documents);
  }
  export async function getTranslateDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "translate", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
      /const result = await collection.query({
        queryEmbeddings: [embeddings],
        nResults: 10,
        where: {"metadata_field": "is_equal_to_this"},
    })
    console.log("queryEmbed",result.documents);/
  
    console.log("queryText", results.documents);
  }
 
  export async function getPathDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "paths", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
      /const result = await collection.query({
        queryEmbeddings: [embeddings],
        nResults: 10,
        where: {"metadata_field": "is_equal_to_this"},
    })
    console.log("queryEmbed",result.documents);/

    console.log("queryText", results.documents);

    
  }
 
  export async function getRectDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "rects", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["The XML is part of a representation of a bar chart. This part represents the bars or rectangles of data frequency. Interpret this representation in terms of a bar chart"],
        nResults: 20,
      });
      /const result = await collection.query({
        queryEmbeddings: [embeddings],
        nResults: 10,
        where: {"metadata_field": "is_equal_to_this"},
    })
    console.log("queryEmbed",result.documents);/
      
    console.log("queryText", results.documents);
    return results.documents;

    
  }*/
 
 /* const embedding = new OpenAIEmbeddings({apiKey:process.env["OPENAI_API_KEY"] as string })
  export async function setRectEmbedding( val: string, index: number){

     const db:ChromaLibArgs = {url: "http://localhost:8000/api/v1/collections", collectionName: "rects"}
     const vectorStore = await Chroma.fromTexts(
      //  ["Hello world", "Bye bye", "hello nice world"],
        [val],
        [{ rectId: index }],
        embedding,
        db
      );
  }

  export async function getRectEmbedding(){
    const dbConfig:ChromaLibArgs = {url: "http://localhost:8000/api/v1/collections", collectionName: "rects"}
    const d = await Chroma.fromExistingCollection(embedding, dbConfig);
  

   /const resultOne = await vectorStore.similaritySearch("hello world", 1);
      console.log(resultOne);
     
     const collection = await client.getCollection({
        name: "rects",
        embeddingFunction: embeddingFunction
      })

      const results = await collection.query({
        queryTexts: ["what is the width of the rectangle"],
        nResults: 2,
      });
    console.log(results.documents);/

  }*/

  //llamaindex uses openai
  Settings.embedModel = new OpenAIEmbedding({
    model: "text-embedding-ada-002",
  });
  /**************************************
   * llamaindex
   * The VectorStoreIndex, an index that stores the nodes only according to their vector embeddings.
   * A document is just a special text node with a docId.
   * storageContextFromDefaults: docStore, indexStore, vectorStore, vectorStores, storeImages, persistDir
   * Question: The XML is part of a representation of a bar chart. The provided data are the bars. How many bars are there?
   * Answer: The original answer is correct. There are 20 bars in the provided data.
   */
  async function setIndexNodes(){
    const node1 = new TextNode();
    node1.text = "";
    node1.id_ = ""
    /*
      
node2 = TextNode(text="<text_chunk>", id_="<node_id>")
nodes = [node1, node2]
index = VectorStoreIndex(nodes)
    */
  }

  /*********************************
   * llamaindex
   */
  async function testLLama(/*data: any[], id: string*/){
    Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});
   
    //[ '<height>400</height><width>800</width>' ]
     const docs_ = [
      [
        [
          [
          "translate><x>0</x><y>340</y></translate",
"translate><x>0</x><y>310.73250573095754</y></translate",
"translate><x>0</x><y>281.46501146191514</y></translate",
"translate><x>0</x><y>252.19751719287274</y></translate",
"translate><x>0</x><y>222.93002292383034</y></translate",
"translate><x>0</x><y>193.6625286547879</y></translate",
"translate><x>0</x><y>164.39503438574548</y></translate",
"translate><x>0</x><y>135.12754011670302</y></translate",
"translate><x>0</x><y>105.86004584766063</y></translate",
"translate><x>0</x><y>76.5925515786182</y></translate",
"translate><x>0</x><y>47.3250573095758</y></translate",
"translate><x>0</x><y>18.05756304053336</y></translate",
        ]
        
        ]
      
      ]
    ]
 
    let i = 0;
    
    let str = "";
  
    docs_.forEach(d => {
      str = str + `${d}` + ',';
    })
    const document = new Document({ text: str, id_: "translate_v"});

    const storageContext = await storageContextFromDefaults({
      persistDir: "./storage/translate_v"
    });

   
    const index = await VectorStoreIndex.fromDocuments([document], {
      storageContext,
    });

   /*  const chromaVS = new ChromaVectorStore({ collectionName:"paths"});
    const index = await VectorStoreIndex.fromVectorStore(chromaVS);
    const r = index.asRetriever();
    const res = r.retrieve("retrieve all data");
    console.log(res.toString());*/
    const queryEngine = index.asQueryEngine();
    const response = await queryEngine.query({
      query: "The XML is part of a svg representation of a bar chart. The data is the x2 value of a svg line representing tick lines of the size provided?"  });
    // Output response
    console.log(response.toString());
  }

  async function testGetfromLlamaindex(){
    Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});
    const secondStorageContext = await storageContextFromDefaults({
      persistDir: "./storage/line_text_x",
    });
    const loadedIndex = await VectorStoreIndex.init({
      storageContext: secondStorageContext,
    });
    const loadedQueryEngine = loadedIndex.asQueryEngine();
    const loadedResponse = await loadedQueryEngine.query({
      query: "The XML is part of a representation of a bar chart. The provided data is a y-axis value. What are the values?",
    });
    console.log(loadedResponse.toString());
  }
 
  async function peersistChroma(){
    //https://docs.trychroma.com/deployment/docker
    //docker run --env-file ./.chroma_env -v <path_to_authz.yaml>:/chroma/<authz.yaml> -p 8000:8000 chromadb/chroma
    //docker run -p 8000:8000 chromadb/chroma

    const chromaClient = new ChromaClient({
        path: "http://localhost:8000",
        auth: {
            provider: "basic",
          //  credentials: process.env["CHROMA_CLIENT_AUTH_CREDENTIALS"]
        }
})

chromaClient.heartbeat()

  }

   //Langchain version
    async function main(){
        //Langchain
        /*const embeddings = new OpenAIEmbeddings();
        const documentRes = await embeddings.embedDocuments([input]);
        console.log(documentRes);*/
        //*********** */
        //Chroma
        //getChromaEmbedding();
//getEmbedding();
   
    //   await getSVGDbEmbedding();
  /*     
      await getTickTextXDbEmbedding();
     await getTickTextYDbEmbedding();
     await getTickLineXDbEmbedding();
    await getTickLineYDbEmbedding();
    
     await getTransformDbEmbedding();
     //   deleteCollection();
        //listCollections("svg");
        await getPathDbEmbedding();*/
      //  const res: any[] = await getRectDbEmbedding();
        testLLama();
       // testGetfromLlamaindex();
       //await getTranslateDbEmbedding();
    }
/*const collection = await client.getOrCreateCollection({
      name: "SVGCollection",
    });*/
   

  //main();
  export{}
  
  