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
  import { join } from 'path';
  import {svgHeading, viewBox, path_1, path_2, svgPathText_1, svgPathText_2, rect} from './data';
  import { Browser } from "./browser";
  import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
 /* import {setRectDbEmbedding, setSVGDbEmbedding, setTransformsDbEmbedding, 
    setTranslateDbEmbedding, setTickLineDbEmbedding, setTickTextDbEmbedding, setPathDbEmbedding,
  } from './vectorstoreEmbedding'
  import { getRectDbEmbedding, getSVGDbEmbedding, getTransformDbEmbedding, 
    getTranslateDbEmbedding, getTickLineXDbEmbedding, getTickTextYDbEmbedding, getPathDbEmbedding
  } from './vectorstoreEmbedding'*/
  import { DynamicTool } from "@langchain/core/tools";
  import { readFileSync, writeFileSync, unlinkSync,readdirSync } from 'fs';
  import { getToolCallingAgent, getDocumentNodes } from './llamaindexanalyzertool'
  import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
  //import PrimeWorker from "worker-loader!
   

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

  export async function createSVGVectorStore(){
    const browser = new Browser();
    browser.get("C:/anthropic/chart5_1.html")
    await browser.findElements().then(_ => {
      
    
    });
  }
  
 
  export async function loadCSVFile(){
    let llamadocs:Document[] = [];
    const csvPath =  "C:/Anthropic/US Labour by Industry.csv";
    const loader = new CSVLoader(csvPath);
    const docs = await loader.load();
    let content = docs[0]?.pageContent as string;

    let manual = new Document({ text: content, id_: "US_Labour_data", metadata: {svgId: "1111"}});
    llamadocs.push(manual);

    return llamadocs;
  }
  export async function saveHtml(data: string){
        //console.log("SAVE...", data);
        let html: string[] = [];
        try{
          html = await readLinesFromHTML(data);    
        } catch (err) {
          console.log(err);
        }

        try {
            await fsPromises.writeFile("C:/anthropic/chart5_1.html", data, {//C:/anthropic/chart5.html
              flag: 'w',
            });
            } catch (err) {
                console.log(err);
            }
  }

  export async function getHtml(){
    let contents = await readFileSync(join("C:/anthropic/", "chart5_1.html"), 'utf-8');
    return contents;
  }

  async function readLinesFromHTML(data: string){
    let contents = data.split(/\r?\n/);
    let len = contents.length;
    let full: any[] = [];
    let start = false;
    let end = false;
    for(let i = 0; i < len;i++){
        let line = contents[i]?.toString() ?? "";
        if(!end){
          if(line.includes("<html>")){
            start = true;
          }
          if(start){
            line = line.replace("\\","");
            full.push(line);
          }
          console.log(line)
        }
        if(line.includes("</html>")){
          end = true;
        }
      }
      return full;
  }

  export async function checkSVGFilesExist(){
    const directoryPath = './';
    while(true){
      const files = fs.readdirSync(directoryPath);
      if(files.includes("svg.txt")){
        break;
      }
    }
  }

  export async function createSVGMappingFile(){
    const path = 'C:/salesforce/repos/Claude tools/';
    const svgFile = "svg.txt";
    const xfile = "tickX.txt";
    const txtTickX ="tick_text_x.txt";
    const txtTickY ="tick_text_y.txt";
    const yfile = "tickY.txt";
    const rectFile = "rect.txt";
    const pathFile = "path.txt";
    const linePathFile = "linePath.txt";
    const linePathFill = "linePathFill.txt";
    const allTextFile = "allText.txt";
    const allXPosFile = "allXPos.txt"
    const allYPosFile = "allYPos.txt"
    const delimiter = "```"
    let heading: string[] = [svgHeading];
    let svgData = await readLinesFromFile(path, svgFile);
    await writeSVGMappingFile(heading);
    heading = [viewBox];
    await writeSVGMappingFile(heading);
    await writeSVGMappingFile([delimiter]);
    await writeSVGMappingFile(svgData);
    await writeSVGMappingFile([delimiter]);
    //SVG Path
    let pathData = await readLinesFromFile(path, pathFile);
    await writeSVGMappingFile([path_1]);
    await writeSVGMappingFile([delimiter]);
    await writeSVGMappingFile(pathData);
    await writeSVGMappingFile([delimiter]);
    //SVG Line Paths
    let pathDataLines = await readLinesFromFiles(path, linePathFile, linePathFill);
    await writeSVGMappingFile([path_2]);
    await writeSVGMappingFile([delimiter]);
    await writeSVGMappingFile(pathDataLines);
    await writeSVGMappingFile([delimiter]);
    //SVG tick x
    let tickXData = await readLinesFromFiles(path, xfile, txtTickX);
    await writeSVGMappingFile([svgPathText_1]);
    await writeSVGMappingFile([delimiter]);
    await writeSVGMappingFile(tickXData);
    await writeSVGMappingFile([delimiter]);
     //SVG tick x
     let tickYData = await readLinesFromFiles(path, yfile, txtTickY);
     await writeSVGMappingFile([svgPathText_2]);
     await writeSVGMappingFile([delimiter]);
     await writeSVGMappingFile(tickYData);
     await writeSVGMappingFile([delimiter]);
      //SVG rects
    let rectData = await readLinesFromFile(path, rectFile);
    await writeSVGMappingFile([rect]);
    await writeSVGMappingFile([delimiter]);
    await writeSVGMappingFile(rectData);
    await writeSVGMappingFile([delimiter]);
  }

  async function writeSVGMappingFile(data: string[]){
    try {
      await fsPromises.writeFile("C:/salesforce/repos/Claude tools/svgMapping.txt", data, {
        flag: 'a',
      });
      } catch (err) {
          console.log(err);
      }
  }

  async function readLinesFromFile(path: string, f: string){
    let contents = await readFileSync(join(path, f), 'utf-8');
    return contents.split(/\r?\n/);
  }

  async function readLinesFromFiles(path: string, f1: string, f2: string){
    let contents = await readFileSync(join(path, f1), 'utf-8');
    //<g class="tick"transform="translate(0,0)
    let tick = contents.split(/\r?\n/);
    let len = tick.length;
    contents = await readFileSync(join(path, f2), 'utf-8');
    let tickText = contents.split(/\r?\n/);
    let full: any[] = [];
    for(let i = 0; i < len;i++){
        let t = tick[i]?.toString() ?? "";
        let val = t + tickText[i]?.toString();
      full.push(val);
      }
  return full;
}

  export async function saveSVGtoCSV(dat: string){
    
    const csvWriter = createCsvWriter({
      path: 'out.csv',
      header: [
        {id: 'name', title: 'NAME'},
        {id: 'age', title: 'AGE'}
      ]
    });
    
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ];
    
    csvWriter
      .writeRecords(data)
      .then(() => console.log('The CSV file was written successfully'));
   /* try {
        await fsPromises.writeFile("C:/anthropic/analysis.txt", data, {
          flag: 'w',
        });
        } catch (err) {
            console.log(err);
        }*/
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