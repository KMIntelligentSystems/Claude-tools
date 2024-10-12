import {ChromaVectorStore, SimpleDirectoryReader, VectorStoreIndex, StorageContext, HuggingFaceEmbedding,VectorStoreQueryMode, RetrieverQueryEngine} from "llamaindex";
import { promises as fsPromises } from 'fs';
import { ChromaClient, CollectionType } from "chromadb";
import {
   // ChromaVectorStore,
    Document,
   // VectorStoreIndex,
    storageContextFromDefaults,
  } from "llamaindex";

  import * as fs from 'fs';

  /*Get web elements from chroma and create xml
   1. Get the svg data from chromadb using collection and the names: svg01, svg02, up to 4 translate, and 40 for rect, path, lineX2, lineY2, line_txtx2, line_txty2
   2. Create the xml from the reslts of 1. Get the details from test.js to complete this.
  */
  
   /*Put xml from above into chromaDb
    Temp: read example xml and put in chroma in setSVGXMLData()
   */
  const collectionName = "SVGCollection";
  const collectionSVG_XML = "SVG_XMLCollection";

  class rect {
    x: number = 0;
    y: number = 0;
    height: number = 0;
    width: number = 0;
}

class path{
   val: string = "";
}

class linex2{
    x2: number = 0;
}

class liney2{
  y2: number = 0;
}
class lineTextx2{
    x2: string = "";
    text: string = "";
}

class lineTexty2{
  y2: string = "";
  text: string = "";
}

class svg{
  height: string = "";
  width: string = "";
}

  export async function setSVGXMLData(){
    const data = fs.readFileSync('./svgAsXML.txt', 'utf-8');
    const client:ChromaClient = new ChromaClient();
    const collection:any = await client.getOrCreateCollection({
          name:  collectionSVG_XML,
    });

    await collection.add({
      documents: [
        data,
      ],
      ids: ["svg_xml_elements"],
    });
  }
  
  export async function getSVGData(){
      const client:ChromaClient = new ChromaClient();
      const collection:any = await client.getOrCreateCollection({
            name: collectionName,
      });
      const svgData: string[] = [];
      svgData.push("svg0");
      svgData.push("svg1");
      const res = await collection.get({
        ids: svgData,
      });
      let svgData_: string[] = res.documents;

      const globalTransforms: string[] = [];
      const globalTransform: string = "translate";
      for(let i = 0; i < 4; i++){
        globalTransforms.push(globalTransform + i.toString())
      }
      const resp = await collection.get({
        ids: globalTransforms,
      });
      let globalTransforms_: string[] = resp.documents;

      const rects: string[] = [];
      const rect = "rect";
      for(let i = 0; i < 40; i++){
        rects.push(rect + i.toString())
      }
      const response = await collection.get({
        ids: rects,
      });
      let rects_: rect[] = response.documents as rect[];
  
      console.log('rect', response.documents)

      const paths: string[] = [];
      const path = "path";
      for(let i = 0; i < 40; i++){
        paths.push(path + i.toString())
      }

      const response6 = await collection.get({
        ids: paths,
      });
      let paths_:string[] =  response6.documents;
      console.log('path', response6.documents)

      const linesx2: string[] = [];
      const linex2 = "linex2";
      for(let i = 0; i < 40; i++){
        linesx2.push(linex2 + i.toString())
      }

      const response1 = await collection.get({
        ids: linesx2,
        //limit: 100,
        //offset: 10,
      });
      let linesx2_: linex2[] = response1.documents as linex2[];
      //console.log('reslinex2', response1.documents)

      const linestxtx2: string[] = [];
      const linetxtx2 = "line_txtx2";
      for(let i = 0; i < 40; i++){
        linestxtx2.push(linetxtx2 + i.toString())
      }

      const response2 = await collection.get({
        ids: linestxtx2,
       // limit: 100,
       // offset: 10,
      });
      let linestxtx2_: lineTextx2[] = response2.documents as lineTextx2[];
      //console.log('reslineTxtx2', response2.documents)

      const linesy2: string[] = [];
      const liney2 = "liney2";
      for(let i = 0; i < 40; i++){
        linesy2.push(liney2 + i.toString())
      }
      const response3 = await collection.get({
        ids: linesy2,
        //limit: 100,
        //offset: 10,
      });
      let linesy2_: liney2[] = response3.documents as liney2[];
      //console.log('resliney2', response3.documents)

      const linestxty2: string[] = [];
      const linetxty2 = "line_txty2";
      for(let i = 0; i < 40; i++){
        linestxty2.push(linetxty2 + i.toString())
      }
      const response4 = await collection.get({
        ids: linestxty2,
      });
      let linestxty2_: lineTexty2[] = response4.documents as lineTexty2[];
      //console.log('linetxty2', response4.documents)*/

      const transforms: string[] = [];
      const transform = "transform";
      for(let i = 0; i < 40; i++){
        transforms.push(transform + i.toString())
      }
      const response5 = await collection.get({
        ids: transforms,
      });
      let transforms_: string[] = response5.documents
      console.log("id", response5.ids)
      console.log('transform', response5.documents)

     // setTree(svgData_, globalTransforms_, rects_,paths_, linesx2_,linestxtx2_,linesy2_,linestxty2_,transforms_);
  }

  function setTree(svgData: string[], globalTransforms: string[], rects: rect[], paths: string[],linesx2: linex2[],linestxtx2: lineTextx2[],
    linesy2: liney2[],linestxty2: lineTexty2[],transforms: string[]){
    let tree = "<svg>";
    let width = "<width>";
    let height = "<height>";
    let transform = "<transform>";
    let h = svgData[0];
    let w = svgData[1];
    

    //'x: 48,y: 18,width: 44.163330078125,height: 360',
    tree + h + w;
    console.log(rects[0]);
    console.log(linesx2[0]);
    console.log(linestxty2[0]);
    console.log(transforms[0]);
    console.log("global", globalTransforms);
    console.log("svg", svgData[0]);
    console.log("svg", svgData[1]);
    const lenx2:number = linesx2.length;
    return "";
  }

  function setTransforms(globalTransforms: string[]):string{
    let transforms: string = "<transforms>";
    let transforms_end: string = "</transforms>";
    let transform: string = "<transform>";
    let transform_end: string = "</transform>";
    let x: string = "<x>";
    let x_end: string = "</x>";
    let y: string = "<y>";
    let y_end: string = "<y>";
    let trans1:string = globalTransforms[0] as string;
    let trans2: string = globalTransforms[1] as string;
    trans1 = trans1.replace("translate(", "");
    trans1 = trans1.replace(")", "");
    let splitArray = trans1.split(",");
    const x1 = splitArray[0];
    const y1 = splitArray[1];
    trans2 = trans2.replace("translate(", "");
    trans2 = trans2.replace(")", "");
    let splitArray2 = trans2.split(",");
    const x2 = splitArray2[0];
    const y2 = splitArray2[1];
    transforms = transforms + transform + x + x1 + x_end + y + y1 + y_end + transform_end 
    + transform + x + x2 + x_end + y + y2 + y_end + transform_end + transforms_end;
    
    return transform;
  }

  function setPath(paths: string[]): string{
    const path: string = "<path>"
    return "";
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
    