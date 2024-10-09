import { Anthropic, FunctionTool, Settings, WikipediaTool, AnthropicAgent } from "llamaindex";
import {
  SimpleVectorStore,
  TogetherEmbedding,
  TogetherLLM,
  VectorStoreIndex,
  SimpleDirectoryReader,
  PromptTemplate,
  getResponseSynthesizer,
  QueryEngineTool,
  ToolMetadata,
  QueryEngineToolParams
} from "llamaindex";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { Document } from "llamaindex";
import { requirement } from './langgraph'
import { PapaCSVReader } from "llamaindex/readers/CSVReader";

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

async function main() {
  //await getCSVData()
  /*const { response } = await agent.chat({
    message:
      "What is the weather in New York? What's the history of New York from Wikipedia in 3 sentences?",
  });

  console.log(response);*/
}

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

//void main();