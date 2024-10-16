//import { OpenAI } from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChromaClient, CollectionType , Embedding, Documents, OpenAIEmbeddingFunction} from "chromadb";
import { validateHeaderName } from "http";
import { OpenAIEmbedding, Settings } from "llamaindex";
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
  const client:ChromaClient = new ChromaClient();
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
    await client.deleteCollection({ name: "svg",});
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

  let i = 2;
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
    export async function setTransformsDbEmbedding(val: string, id: number){
      const collection = await client.getOrCreateCollection({name: "transforms", embeddingFunction: embeddingFunction});

      await collection.add({
          documents: [val],
          ids: [id.toString()],
          metadatas: [{ "transform": "global" }],
        });
        
    }

    export async function setTranslateDbEmbedding(val: string, id: number){
      const collection = await client.getOrCreateCollection({name: "translate", embeddingFunction: embeddingFunction});

      await collection.add({
          documents: [val],
          ids: [id.toString()],
          metadatas: [{ "translate": "tick" }],
        });
        
    }

    export async function setTickLineDbEmbedding(val: string, id: number, type: string){
      if(type == "x2"){
        const collection = await client.getOrCreateCollection({name: "tick_line_x", embeddingFunction: embeddingFunction});
        await collection.add({
            documents: [val],
            ids: [id.toString()],
            metadatas: [{ "tickline": "x2" }],
          }); 
      } else if(type == "y2"){
        const collection = await client.getOrCreateCollection({name: "tick_line_y", embeddingFunction: embeddingFunction});
        await collection.add({
            documents: [val],
            ids: [id.toString()],
            metadatas: [{ "tickline": "y2" }],
          }); 
      }
    
    }

    export async function setTickTextDbEmbedding(val: string, id: number, type: string){
      if(type == "x2"){
        const collection = await client.getOrCreateCollection({name: "tick_text_x", embeddingFunction: embeddingFunction});
        await collection.add({
            documents: [val],
            ids: [id.toString()],
            metadatas: [{ "ticktext": "x2" }],
          }); 
      } else if(type == "y2"){
        const collection = await client.getOrCreateCollection({name: "tick_text_y", embeddingFunction: embeddingFunction});
        await collection.add({
            documents: [val],
            ids: [id.toString()],
            metadatas: [{ "ticktext": "y2" }],
          }); 
      }
    
    }

    export async function setPathDbEmbedding(val: string, id: number){
      const collection = await client.getOrCreateCollection({name: "paths", embeddingFunction: embeddingFunction});
  
      await collection.add({
          documents: [val],
          ids: [id.toString()],
          metadatas: [{ "path": id }],
        });
        
    }
    
   export async function setRectDbEmbedding(val: string, id: number){
    const collection = await client.getOrCreateCollection({name: "rects", embeddingFunction: embeddingFunction});

    await collection.add({
        documents: [val],
        ids: [id.toString()],
        metadatas: [{ "rect": id }],
       // embeddings: [[embedding]]
      });
      
  }

  export async function getSVGDbEmbedding(){
    
    const collection = await client.getCollection({name: "svg", embeddingFunction: embeddingFunction});
    const results = await collection.peek({
      limit: 60
    });
 console.log('results', results);
   /* const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
    console.log("queryText", results.documents);*/
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
      /*const result = await collection.query({
        queryEmbeddings: [embeddings],
        nResults: 10,
        where: {"metadata_field": "is_equal_to_this"},
    })
    console.log("queryEmbed",result.documents);*/
  
    console.log("queryText", results.documents);
  }
  export async function getTranslateDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "translate", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
      /*const result = await collection.query({
        queryEmbeddings: [embeddings],
        nResults: 10,
        where: {"metadata_field": "is_equal_to_this"},
    })
    console.log("queryEmbed",result.documents);*/
  
    console.log("queryText", results.documents);
  }
 
  export async function getPathDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "paths", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
      /*const result = await collection.query({
        queryEmbeddings: [embeddings],
        nResults: 10,
        where: {"metadata_field": "is_equal_to_this"},
    })
    console.log("queryEmbed",result.documents);*/

    console.log("queryText", results.documents);

    
  }
  
  export async function getRectDbEmbedding(){
    const collection = await client.getOrCreateCollection({name: "rects", embeddingFunction: embeddingFunction});
    const results = await collection.query({
        queryTexts: ["what are the values"],
        nResults: 20,
      });
      /*const result = await collection.query({
        queryEmbeddings: [embeddings],
        nResults: 10,
        where: {"metadata_field": "is_equal_to_this"},
    })
    console.log("queryEmbed",result.documents);*/

    console.log("queryText", results.documents);

    
  }
 
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

  
  //Not set yet
   //hromadb.PersistentClient(path=storage_path)

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
    //  await setRectDbEmbedding(input, 0);
     // await getRectDbEmbedding();
     //await setSVGDbEmbedding("<height> 400</height>")
       await getSVGDbEmbedding();
      // await getPathDbEmbedding();
     // await getTickTextXDbEmbedding();
     //await getTickTextYDbEmbedding();
    // await getTickLineXDbEmbedding();
    //await getTickLineYDbEmbedding();
    //await getTranslateDbEmbedding();
   // await getTransformDbEmbedding();
      //  deleteCollection();
        //listCollections("svg");
    }
/*const collection = await client.getOrCreateCollection({
      name: "SVGCollection",
    });*/
   

 main();
  //export{}
  
  