import {ChromaVectorStore,OpenAIEmbedding, SimpleDirectoryReader, VectorStoreIndex,  OpenAI,
  Settings, StorageContext, HuggingFaceEmbedding,VectorStoreQueryMode, RetrieverQueryEngine,OpenAIAgent} from "llamaindex";
import { promises as fsPromises } from 'fs';
import { PapaCSVReader } from "llamaindex/readers/CSVReader";
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
  import { readFileSync, writeFileSync, unlinkSync,readdirSync, existsSync } from 'fs';
  import { getToolCallingAgent, getDocumentNodes } from './llamaindexanalyzertool'
  import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
  import { RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
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
   /* const browser = new Browser();
    browser.get("http://127.0.0.1:5501/chart5_1.html")
    await browser.findElements().then(_ => {
      console.log("DATA  ", browser.circleData.data);
    
    });*/
    await callSVGTemplate();
  }

  export async function chunkData(){
    const csvPath_ = "C:/Anthropic/global_temperatures.csv";
    let data = await readFileSync(csvPath_,  "utf-8");
    const textSplitter = new RecursiveCharacterTextSplitter();
    textSplitter.chunkSize = 1000;
    textSplitter.chunkOverlap = 50;
    const chunks = textSplitter.splitText(data);
    let strs: string[] = [];
    (await chunks).forEach(val => {
      strs.push(val);
    })
    return strs;
  }
 /**********************************
  * NOT called from retrievers tool csvDataTool to load te llamaindex using
  * CSVLoader from the langchain library
  */
  export async function loadCSVFile(){
    let llamadocs:Document[] = [];
    const csvPath = "C:/salesforce/repos/Claude tools/global_temperatures.csv";// "C:/Anthropic/US Labour by Industry.csv";
    const loader = new CSVLoader(csvPath);
    const docs = await loader.load();
    let content = docs[0]?.pageContent as string;

    //let doc = new Document({ text: content, id_: "US_Labour_data", metadata: {svgId: "1111"}});
    let doc = new Document({ text: content, id_: "global_temperature_data", metadata: {svgId: "0001"}});
    llamadocs.push(doc);

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
            await fsPromises.writeFile(/*"C:/anthropic/chart5_1.html"*/"C:/salesforce/repos/SVG/chart5_1.html", data, {//C:/anthropic/chart5.html
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

  export async function deleteSVGMappingFile(){
    const path = "C:/salesforce/repos/Claude tools/";
    const svgFile = "svgMapping.txt"
    if(existsSync(path+svgFile)){
      unlinkSync(path+svgFile);
    }
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
    

  export async function readTextFile(path: string){
    let data = await readFileSync(path, "utf-8");
    return data;
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
 /******************************
  * Year, Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec  
1880, -0.2, -0.26, -0.09, -0.17, -0.1, -0.22, -0.2, -0.11, -0.16, -0.23, -0.23, -0.19  
1881, -0.2, -0.16, 0.02, 0.04, 0.06, -0.19, 0.01, -0.04, -0.16, -0.22, -0.19, -0.08  
  */
export async function getCSVData(dataMsg: string, allData:string[][]){
 // console.log("dataMsg...", dataMsg)

 // const allData:string[][] = [];
  let yrData:string[]= [];
  let data_: string[] = [];
  let foundRows = false;
  let str: string = dataMsg;
  let firstRow = false;
  if(dataMsg.includes("Year")){
    let index = dataMsg.indexOf("Dec") + 4;
    str = dataMsg.substring(index);
    firstRow = true;
  }
    let len = str.length;
    let i = 0;
    let commaCounter = 0;
    const commaCnt = 12;
    
    while(i < len ){
      data_.push(str.charAt(i));
      if(str.charAt(i) == ","){
        commaCounter++;
      }
      if(str.charAt(i)=='\n' && firstRow)
      {
        let dataStr: string = data_.join('');
        yrData.push(dataStr.substring(0,dataStr.length - 1));
        allData.push(yrData);
        yrData = [];
        data_ = [];
        dataStr = "";
        commaCounter = 0;
        foundRows = true;

      }
      
      if(commaCounter >= commaCnt && firstRow && foundRows){
        let dataStr: string = data_.join('');
        yrData.push(dataStr);
        let ind = str.indexOf(dataStr);
        let final = str.substring(ind)
        if(!final.includes("\n"))
          allData.push([final]);
        yrData = [];
        foundRows = false;
        commaCounter = 0;
      }

    /*  if(commaCounter >= commaCnt && !firstRow){
       // 1889,-0.09,0.17,0.06,0.1,-0.01,-0.1,-0.07,-0.2,-0.24,-0.25,-0.33,-0.29,-0.1,-0.08,0.01,0.05,-0.12,-0.27
        let dataStr: string = data_.join('');
      
    
        let ind = str.indexOf(dataStr);
        let final = str.substring(ind)
        if(!final.includes("\n"))
          allData.push([final]);
       //STRRR 1889,-0.09,0.17,0.06,0.1,-0.01,-0.1,-0.07,-0.2,-0.24,-0.25,-0.33,-0.29,-0.1,-0.08,0.01,0.05,-0.12,-0.27
        yrData = [];
        foundRows = false;
        commaCounter = 0;
        dataStr = "";
        data_ = [];
      }*/
      i++;
    } 
 }

export async function writeCSVFile(data: string[][]){

const csvWriter = createCsvWriter({
      path: './out.csv',
      header: [
        {id: 'year', title: 'Year'},
        {id: 'jan', title: 'Jan'},
        {id: 'feb', title: 'Feb'},
        {id: 'mar', title: 'Mar'},
        {id: 'apr', title: 'Apr'},
        {id: 'may', title: 'May'},
        {id: 'jun', title: 'Jun'},
        {id: 'jul', title: 'Jul'},
        {id: 'aug', title: 'Aug'},
        {id: 'sep', title: 'Sep'},
        {id: 'oct', title: 'Oct'},
        {id: 'nov', title: 'Nov'},
        {id: 'dec', title: 'Dec'},
      ]
    });
    //STRRR 1889,-0.09,0.17,0.06,0.1,-0.01,-0.1,-0.07,-0.2,-0.24,-0.25,-0.33,-0.29,-0.1,-0.08,0.01,0.05,-0.12,-0.27
    //"name:John;age:30;city:Canberra";
    
   
    let csvInput: Record<string,string>[] = [];
    data.forEach(d => {
      let str: string = d[0] as string;
      let i = 0;
      let temp = "year:" + str.substring(0,4)+ ";";
      str = str.substring(5);
    
      let data_ :string[] = [];
      let j = 0;
      let dataStr: string = "";
      let hasDec = false;
      while(i < 12 ){
        if(j > 71){
          console.log("HERRRR")
          break;
        }
         
        data_.push(str.charAt(j));
        
        if(str.charAt(j++) == ","){
          dataStr = data_.join('');
          if(dataStr.includes(",")){
            dataStr = dataStr.substring(0,dataStr.length-1);
          }
          if(i == 0){
            temp = temp + "jan:" + dataStr + ";";
            i++;
          } else if(i == 1){
            temp = temp + "feb:" + dataStr + ";"; 
            i++;
          } else if(i == 2){
            temp = temp + "mar:" + dataStr + ";";
            i++;
          } else if(i == 3){
            temp = temp + "apr:" + dataStr + ";";
            i++;
          } else if(i == 4){
            temp = temp + "may:" + dataStr + ";";
            i++;
          } else if(i == 5){
            temp = temp + "jun:" + dataStr + ";";
            i++;
          } else if(i == 6){
            temp = temp + "jul:" + dataStr + ";";
            i++;
          } else if(i == 7){
            temp = temp + "aug:" + dataStr + ";";
            i++;
          } else if(i == 8){
            temp = temp + "sep:" + dataStr + ";";           
            i++;
          } else if(i == 9){
            temp = temp + "oct:" + dataStr + ";";
            i++;
          } else if(i == 10){
        
            temp = temp + "nov:" + dataStr + ";";
            i++;
          } 
          data_ = [];
        } else if(i == 11 && !hasDec){
          console.log("DATA STRING", dataStr)//= nov
        //  let reverse = reverseString(str);
          //let ind = reverse.indexOf(dataStr);
         // let dec = reverse.substring(ind+dataStr.length+1)
          let ind = str.indexOf(dataStr);
          let dec = str.substring(ind+dataStr.length+1)

          if(dec.includes(",")){
            while(dec.includes(",")){
              ind = dec.indexOf(dataStr);
              dec = dec.substring(ind+dataStr.length+1)
            }
          } 
          temp = temp + "dec:" + dec + ";";
          console.log("size   ", temp.length)
          hasDec = true;
          data_ = [];
          dataStr = "";
        }
        
      }
      console.log(temp)
      const obj: Record<string, string> = parseStringToObject(temp) as Record<string, string>;
      console.log("obj", obj)
      csvInput.push(obj);
    })
    console.log("CSVVV",csvInput)
    await csvWriter
    .writeRecords(csvInput)
    .then(() => console.log('The CSV file was written successfully'));
      /*const data = [
    { year: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ];*/
  
   
 }

 function reverseString(str: string) : string{
  if (str === "") {
      return "";
  } else {
      return reverseString(str.substr(1)) + str.charAt(0);
  }
}

const parseStringToObject = (str: string): Record<string, string | number> => {
    const obj: Record<string, string | number> = {};
    const pairs = str.split(';');
    
    pairs.forEach(pair => {
      console.log("PAIR ", pair)
        const [key, value] = pair.split(':');
        if(key)
        obj[key] = value as string; //isNaN(Number(value)) ? value : Number(value);
    });

    return obj;
};

  /***************************************
   * Signal to C# that html is created and ready for Selenium
   */
  export async function callSVGTemplate() {

    try {
        await fsPromises.writeFile("C:/salesforce/repos/Claude tools/svg.txt", "test", {
          flag: 'w',
        });
        } catch (err) {
            console.log(err);
        }
  }

  /*******************************************
   * dataProcessorAgent returns the list of chunk ids
   * "chunk_numbers": ["chunk_1", "chunk_2", "chunk_3"],
   * returns set [ 'chunk_2', 'chunk_3', 'chunk_4' ]
   */
  export async function getChunkIds(dataFindings: string){
    let ids = "";
    if(dataFindings.includes("chunk_numbers")){
      if(dataFindings.includes("[")){
        let index_2 = dataFindings.indexOf("[");
        if(dataFindings.includes("[")){
          let index_3 = dataFindings.indexOf("]");
          ids = dataFindings.substring(index_2,index_3);
        }
      }
    }
    let idArray: string[] = [];
    if(ids){
      let index = 0;
      let len = ids.length;
      while(true){
        if(ids.charAt(index)== "_"){
          if(parseInt(ids.charAt(index+1)) && parseInt(ids.charAt(index+2))){
            let num = ids.substring(index+1, index+2);
            idArray.push("chunk_" + num);
          }else if(parseInt(ids.charAt(index+1))){
            idArray.push("chunk_" + ids.charAt(index+1));
          }
        }
        
        index++;
        if(index >= len-1)
          break;
      }
    }
    console.log("IDDSSS", idArray)
    return idArray;   
  }
/****************************
 *  'Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N,DJF,MAM,JJA,SON\r\n' +
    '1880,-0.2,-0.26,-0.09,-0.17,-0.1,-0.22,-0.2,-0.11,-0.16,-0.23,-0.23,-0.19,-0.18,***,***,-0.12,-0.18,-0.21\r\n' +
    '1881,-0.2,-0.16,0.02,0.04,0.06,-0.19,0.01,-0.04,-0.16,-0.22,-0.19,-0.08,-0.09,-0.1,-0.18,0.04,-0.08,-0.19\r\n' +
    '1882,0.16,0.13,0.04,-0.16,-0.14,-0.23,-0.16,-0.08,-0.15,-0.24,-0.17,-0.36,-0.11,-0.09,0.07,-0.09,-0.16,-0.19\r\n' +
    '1883,-0.29,-0.37,-0.12,-0.18,-0.18,-0.07,-0.07,-0.14,-0.22,-0.12,-0.24,-0.11,-0.18,-0.2,-0.34,-0.16,-0.1,-0.19\r\n'
 */
  export async function getCSVHeading(data:string){
    let index = data.indexOf("\r\n");
    let heading = data.substring(0, index);
    return heading;
  }

  export async function getCummulativeIds(currIds: string[], priorIds: string){
    let strSet = "[";
//['chunk_0']
    const brkt_end = priorIds.indexOf("]");
    const prevSet = priorIds.substring(0,brkt_end);
    strSet = prevSet + ",";
    currIds.forEach(e =>{
      strSet = strSet + e + ",";
    })
    strSet = strSet + "]";
    console.log("IDDSSS.....STRING", strSet)
    return strSet;
  }

  export async function getCummulativeTotalCount(currIds: string[], ids: string){
    let len = ids.length;
    let index = 0;
    let num = currIds.length
    while(true){
      if(ids.charAt(index)== "_"){
        if(parseInt(ids.charAt(index+1)) && parseInt(ids.charAt(index+2))){
          num++;
        }
      }
      
      index++;
      if(index >= len-1)
        break;
    }
    console.log("IDDSSS.....NUM", num)
    return num;
  }