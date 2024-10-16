import 'chromedriver';
import { promises } from 'fs';
import { Options} from 'selenium-webdriver';
import { Builder,/*Browser,*/ ThenableWebDriver, WebElement, By, WebElementPromise} from 'selenium-webdriver';
import { fs } from 'memfs';
import { readFileSync, writeFileSync } from 'fs';
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
  QueryEngineToolParams,
  SimpleKVStore,
  SimpleIndexStore
} from "llamaindex";
import { DEFAULT_NAMESPACE } from "@llamaindex/core/global";

import { ChromaClient, Embedding } from "chromadb"; 
//import {setRectDbEmbedding, getRectDbEmbedding} from './vectorstoreEmbedding'
import {setSVGRect, setSVGData, setTransformsData, setTranslateData, setTickLineData, setTickTextData, setPathData} from './tools'
import { setTransforms, setSVG, setTranslate, setTickLines, setTickText, setPaths, setRect} from './test'

/*
Tool to add web elements to vector store using chromadb
The data is not persisted so this must be run after starting chroma: docker run -p 8000:8000 chromadb/chroma
1. Read the elements of the html svg using selenium-webdriver. The driver uses an async function findElement using a path to return the requested svg data
public  async findElement(el: string): Promise<WebElement[]> where el eg is  const promiseRect = this.findElement("//*[name()='rect']");
2. Set the data in the vector store eg public async setRectData(counter: number, value: string)
 const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    
    await collection.add({
      documents: [
        value,
      ],
      ids: ["rect" + counter],
    });
*/

//import { Page, NewablePage, WebComponent, WaitCondition } from './';
export type WaitCondition = (browser: Browser) => Promise<boolean>;



 class rect {
    x: number = 0;
    y: number = 0;
    height: number = 0;
    width: number = 0;
    toString(): string{
        const str = "x: " + this.x.toString() + "," + "y: " + this.y.toString() + "," + "width: " + this.width.toString() + "," + "height: " + this.height.toString();
        return str;
    }
}

class rects{
   values: rect[] = []; 
}

class path{
   moveFrom: string = "";
   moveTo: string = "";
   val: string = "";
}

class paths{
    values: path[] = [];
}

class tickLine{
    x2: number = 0;
    y2: number = 0;
    isX2: boolean = false;
    toString(): string{
      let str = "";
      if(this.isX2){
          str = "x2: " + this.x2.toString();
      } else {
        str = "y2: " + this.y2.toString();
      }
      return str;
    }
}
class tickText{
    x2_text: string = "";
    y2_text: string = "";
    x2: string = "";
    y2: string = "";
    isX2: boolean = false;
    toString(): string{
      let str = "";
      if(this.isX2){
          str = "x2: " + this.x2 + ",text:" + this.x2_text;
      } else {
        str = "y2: " + this.y2 + ",text:" + this.y2_text;
      }
      return str;
    }
}
class tick{
    line: tickLine = new tickLine();
    text: tickText = new tickText();
}

class ticks{
    values: tick[] = [];
}

class svg{
  height: string = "";
  width: string = "";
  toString(): string{
    const str = "height: " + this.height + ",width: " + this.width;
    return str;
  }
}

export class SVGElements{
    public error: string = "";
    rects: rects = new rects();
    paths: paths = new paths();
    ticks: ticks = new ticks();
 }

 
 
export class Browser {
  private driver: ThenableWebDriver;
  public constructor() {
    this.driver = new Builder().forBrowser('chrome').build();
  }

  public setOptions(){
    const options = new Options(this.driver);
    
  }
  public async get(url: string){
    await this.driver.get(url);
    
  
  }
  public async navigate(url: string): Promise<void> {
    await this.driver.navigate().to(url);
  }

  
  public els: SVGElements = new SVGElements();

  kvstore: SimpleKVStore = new SimpleKVStore();
  private nodeCollection: string = DEFAULT_NAMESPACE;

  public client:ChromaClient = new ChromaClient();
  
  public async setChromadb(): Promise<any>{
  
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    return collection;
  }
  
  public  async findElement(el: string): Promise<WebElement[]>{
    const promise = await this.driver.findElements(By.xpath(el));
    
    return promise;
  }

  public async findElements() {
    let tempText: tickText[] = [];
    let tempLine: tickLine[] = [];
    let rects_ = new rects();
    let paths_ = new paths();
    let ticks_ = new ticks();
    try{
      
        const first =  this.driver.findElements(By.xpath("//*[name()='svg']"));
            //provides svg h and w
            first.then(value =>{
                let i = 0;
                for (var v of value) {
                  v.getAttribute("height").then(h => {
                  
                    v.getAttribute("width").then(w => {
                      setSVG(h,w).then(val => {
                        setSVGData(val);
                      })
                     
                    })
                  })
                }
            })
        /*    const second =  this.driver.findElements(By.xpath("//*[name()='svg']"));
            second.then(value =>{
              let i = 0;
              for (var v of value) {
                v.getAttribute("width").then(w => {
                  setSVGData(w,i, "width");
                })
              }
          })*/

       /* const globalTransform =  this.driver.findElements(By.xpath("//*[name()='g' and not(@class)]"));
          globalTransform.then(value =>{
            let i = 0;
            for (var v of value) {
              v.getAttribute("transform").then(v1 => {
               
                if(v1){
                  setTransforms(v1).then(t => {
                    setTransformsData(v1, i);
                  })
                  //provides for <transforms><x><y> translate(60,20) translate(0,340)
                  //setTransforms([ 'translate(40,10)', 'translate(0, 360)' ]);
                  //this.setGlobalTranslateData(i, v1)
                  i++;
                }
              })
            }
        })
      const tick  = this.driver.findElements(By.xpath("//*[name()='g' and @class='tick']"));
      tick.then(value =>{
        let i = 0;
        for (var v of value) {
          v.getAttribute("transform").then(v1 => {
            //Provides translate(0,164.39503438574548) for all ticks
           // this.setTransformData(i, v1);
           setTranslate(v1).then(t => {
            setTranslateData(v1, i);
           })
            i++;
          })
        }
    })

    const promiseLine = this.findElement("//*[name()='line']");
    promiseLine.then(value =>{
      let i = 0;
      let j = 0;
      for (var v of value) {
          const ln = new tickLine();
          v.getAttribute("y2").then(val =>{
              if(val){
                  ln.y2 = +val;
                  ln.isX2 = false;
                  setTickLines(val, "y2").then(l => {
                    setTickLineData(val,i,"y2")
                  });
                  i++;
                //  console.log("ln y2", ln.y2)
                 // this.setLineData(i++,ln.toString(), ln.isX2);                    
                 } 
          })
          v.getAttribute("x2").then(val =>{
              if(val){
                  ln.x2 = +val;
                  ln.isX2 = true;
                  setTickLines(val, "x2").then(l => {
                    setTickLineData(val,j,"x2")
                  });
                  j++;
                //  console.log("ln x2", ln.x2)
                 // this.setLineData(j++,ln.toString(), ln.isX2);
              } 
             
          })
          
      } 
  })
     
  const promiseLineTxt = this.findElement(("//*[name()='text']"));
  promiseLineTxt.then(value =>{
    let i = 0;
    let j = 0;
    for (var v of value) {
        let v_ = "";
        v.getText().then(val =>{
          v_ = val; 
        })
        const txt = new tickText();
        v.getAttribute("x").then(val =>{
            if(val){
                txt.x2_text = v_;
                txt.x2 = val;
                txt.isX2 = true;
                setTickText(v_, val,"x2").then(l => {
                   setTickTextData(l, i, "x2");
                });
                i++;
               / console.log(i++);
                console.log("textx2", txt.x2);
                console.log("txt.x2_text", txt.x2_text)
                console.log("txt.toString()1", txt.toString())/
                //this.setLineTextData(i++, txt.toString(), txt.isX2);
            } 
            
        })
        v.getAttribute("y").then(val =>{
            if(val){
                txt.y2_text = v_;
                txt.y2 = val;
                txt.isX2 = false;
                setTickText(v_, val,"y2").then(l => {
                  setTickTextData(l, j, "y2");
               });
               j++;
            } 

        })
    }
})
          
           
          const promiseRect = this.findElement("//*[name()='rect']");
            let i: number = 0;
            promiseRect.then(value => {
                for (var v of value) {
                    v.getRect().then(val =>{
                    setRect(val.x, val.y, val.height, val.width).then(r => {
                      this.setRectData( i, r);
                    })
                    i++;
                })
            } 
            });

            const promisePath = this.findElement("//*[name()='path']");
            promisePath.then(value =>{
              let i = 0;
              for (var v of value) {
                  let p = new path();
                  v.getAttribute("d").then(val =>{
                      p.val = val;
                      i++;
                      setPaths(val).then(p => {
                        setPathData(p, i);
                      })
                     // this.setPathData(i, p);
                  })
                 
              }
          })*/
         
    } catch(Exception){
        const  svg_elements = "<svg>No svg elements were found, indicating a syntax error<svg>";
       
    }
  }

  public async setSVGData_(counter: number, value: string){
    
    const collection = await this.client.getOrCreateCollection({
      name: "svg",
    });
    console.log(value)
    console.log(counter)
    let type = "h";
    if(value.includes("width")){
      type = "w"
    }
    await collection.add({
      documents: [
        value,
      ],
      ids: ["svg_"+ type],
    });  
  }
  
  public async setGlobalTranslateData(counter: number, value: string){
    
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    
    await collection.add({
      documents: [
        value,
      ],
      ids: ["translate" + counter],
    });
  }

  public async setRectData(counter: number, value: string){
    setSVGRect(value, counter);
  }

  public async setRectData_(counter: number, value: string){
    console.log("rect...", value);
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    
    await collection.add({
      documents: [
        value,
      ],
      ids: ["rect" + counter],
    });

    
  }

  public async setPathData(counter: number, value: path){
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    //let p = "<path>" + "<moveFrom>" + value.moveFrom + "</moveFrom>" + "<moveTo>" + value.moveTo + "</moveTo>" + "</path>"
    await collection.add({
      documents: [
        value.val,
      ],
      ids: ["path" + counter],
    });
  }

   public async setLineData(counter: number, value: string, isX2: boolean){
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    let ln = "line";
    if(isX2){
      ln += "x2"
    } else{
       ln += "y2"
    }
    await collection.add({
      documents: [
        value,
      ],
      ids: [ln + counter],
    });
  }

  public async setLineTextData(counter: number, value: string, isX2: boolean){
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    let ln = "line_txt";
    if(isX2){
      ln += "x2"
    } else{
       ln += "y2"
    }
    await collection.add({
      documents: [
        value,
      ],
      ids: [ln + counter],
    });
  }

  public async setTransformData(counter: number, value: string){
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
   // console.log("i", counter)
    //console.log("trans", value)
    const trans: string = "transform"
    await collection.add({
      documents: [
        value,
      ],
      ids: [trans + counter],
    });
  }

  public async getChromaData(){
    
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    const results = await (await collection).query({
      queryTexts: "This is a query for selecting rects", // Chroma will embed this for you
      nResults: 1, // how many results to return
    });

   // console.log("results", results);
  }

  public log(val: string){ 
    const path = 'C:/salesforce/repos/file.txt';
    const filename = "file.txt";
    writeFileSync(path, val+"\n", {
      flag: 'a',
    });
    //const f = new fs.WriteStream(path);
    
    //const file = f.createWriteStream(path);
   // f.write(val);
    
    //f.write(this.els);
  }

  public async clearCookies(url?: string): Promise<void> {
    if (url) {
      const currentUrl = await this.driver.getCurrentUrl();
      await this.navigate(url);
      await this.driver.manage().deleteAllCookies();
      await this.navigate(currentUrl);
    } else {
      await this.driver.manage().deleteAllCookies();
    }
  }

  public async wait(condition: WaitCondition) {
    await this.waitAny(condition);
  }

  public async waitAny(conditions: WaitCondition | WaitCondition[]): Promise<void> {
    const all = (!(conditions instanceof Array)) ? [ conditions ] : conditions;

    await this.driver.wait(async () => {
      for (const condition of all) {
        try {
          if (await condition(this) === true) {
            return true;
          }
          continue;
        } catch (ex) {
          continue;
        }
      }
    });
  }

  public async close(): Promise<void> {
    await this.driver.quit();
  }
}