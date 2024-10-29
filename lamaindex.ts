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
} from "llamaindex";

import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { Document } from "llamaindex";
import { requirement } from './langgraph'
import { PapaCSVReader } from "llamaindex/readers/CSVReader";
//import { ChromaClient, OpenAIEmbeddingFunction} from "chromadb";

//import { OpenAI } from "openai";


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

//export async function getSVG_XMLData() went to tools
/*export async function getSVG_XMLData_() {
  const collectionName = "svg_xml_elements";
  const client:ChromaClient = new ChromaClient();
  const collection:any = await client.getOrCreateCollection({
        name: collectionName,
  });
  const res = await collection.get({
    ids: ["svg_xml_elements"],
  });
 // console.log(res)
  const chromaVS = new ChromaVectorStore({ collectionName });
  const data = chromaVS.getCollection();
  data.then(v => {
    //console.log(v.get());
  })
  
 
}*/
export async function getCSVData(input: String) {
  console.log("START...", input)
  const reader = new PapaCSVReader();
  const path = "C:/Anthropic/US Labour by Industry.csv";
  const documents = await reader.loadData(path);

  // Split text and create embeddings. Store them in a VectorStoreIndex
  const index = await VectorStoreIndex.fromDocuments(documents);

  const csvPrompt = new PromptTemplate({
    templateVars: ["query", "context"],
    template: `The following CSV file is loaded from ${path}
\`\`\`csv
{context}
\`\`\`
Given the CSV file, use the information provided in {query} to create a command that can be used to fetch the data. Just provide correctly formatted csv output.
`,
  });
  const responseSynthesizer = getResponseSynthesizer("compact", {
    textQATemplate: csvPrompt,
  });

  const queryEngine = index.asQueryEngine({ responseSynthesizer });
  

  // Query the index
  const response = await queryEngine.query({
    query: String(input),
  });

  /*const queryEngineTool = 
    new QueryEngineTool({
      queryEngine: index.asQueryEngine({ responseSynthesizer }),
      metadata: {
        name: "Data_Provider",
        description: "A tool to provide csv input data",
      },
    });*/
  
  return String(response?.message.content);
}

/*const embeddingFunction = new OpenAIEmbeddingFunction({
  openai_api_key: process.env["OPENAI_API_KEY"] as string,
  openai_model: "text-embedding-3-small"
})
async function testLLama(){
  Settings.llm =  new OpenAI({ apiKey:process.env["OPENAI_API_KEY"] as string});
//  const client:ChromaClient = new ChromaClient();
 // const collection = await client.getOrCreateCollection({name: "svg", embeddingFunction: embeddingFunction});
   
  const chromaVS = new ChromaVectorStore({ collectionName:"rects"});
  //const client = chromaVS.client();
  
  const vectorStoreIndex = await VectorStoreIndex.fromVectorStore(chromaVS);

  const retriever = (await VectorStoreIndex.fromVectorStore(chromaVS)).asRetriever(
    {
      similarityTopK:1,
    }
)
    const nodes = await retriever.retrieve("Provide all items");
    console.log(nodes)
 /   const queryEngine = vectorStoreIndex.asQueryEngine({
   
    });
    const response = await queryEngine.query({ query: "List all items" });/
 / const retriever = new VectorIndexRetriever({
    index: vectorStoreIndex,
    similarityTopK: 500,
  });

  const responseSynthesizer = getResponseSynthesizer("tree_summarize");
  const queryEngine = new RetrieverQueryEngine(retriever, responseSynthesizer);
  const response = await queryEngine.query({
    query: "How many results do you have?",
  });/

 // console.log(response.toString());

 / const index = await VectorStoreIndex.fromVectorStore(chromaVS);
  const queryEngine = index.asQueryEngine({
    similarityTopK: 3,
  });
  const response = await queryEngine.query({ query:"Provide all values" });
  console.log(response.toString());/
}*/

async function main() {
// await testLLama();
}
main();