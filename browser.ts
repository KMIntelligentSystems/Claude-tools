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

      const tick  = this.driver.findElements(By.xpath("//*[name()='g' and @class='tick']"));
      tick.then(value =>{
        let i = 0;
        for (var v of value) {
          v.getAttribute("transform").then(v1 => {
          //  console.log(i, v1);
            this.setTransformData(i, v1);
            i++;
          })
        }
    })
      const globalTransform =  this.driver.findElements(By.xpath("//*[name()='g' and not(@class)]"));
      globalTransform.then(value =>{
        let i = 0;
        for (var v of value) {
          v.getAttribute("transform").then(v1 => {
           
            if(v1){
              this.setGlobalTranslateData(i, v1)
              i++;
            }
          })
        }
    })
           const first =  this.driver.findElements(By.xpath("//*[name()='svg']"));
              
              first.then(value =>{

                let i = 0;
                for (var v of value) {
                  v.getAttribute("height").then(h => {
                    this.setSVGData(0, "height: "+ h);
                  })
                }
            })
            const second =  this.driver.findElements(By.xpath("//*[name()='svg']"));
            second.then(value =>{
              for (var v of value) {
                v.getAttribute("width").then(w => {
                  this.setSVGData(1, "width: "+ w);
                })
              }
          })
           
           const promiseRect = this.findElement("//*[name()='rect']");
            let i: number = 2;
            promiseRect.then(value => {
                
                for (var v of value) {
                    
                    const r = new rect();
                    v.getRect().then(val =>{
                    r.x = val.x;
                    r.y = val.y;
                    r.width = val.width;
                    r.height = val.height;
                    //this.log(r.toString());
                    this.setRectData( i, r.toString());
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
                      console.log("d", val);
                      p.val = val;
                      i++;
                      this.setPathData(i, p);
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
                        console.log("ln y2", ln.y2)
                        this.setLineData(i++,ln.toString(), ln.isX2);                    
                       } 
                })
                v.getAttribute("x2").then(val =>{
                    if(val){
                        ln.x2 = +val;
                        ln.isX2 = true;
                        console.log("ln x2", ln.x2)
                        this.setLineData(j++,ln.toString(), ln.isX2);
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
                     /* console.log(i++);
                      console.log("textx2", txt.x2);
                      console.log("txt.x2_text", txt.x2_text)
                      console.log("txt.toString()1", txt.toString())*/
                      this.setLineTextData(i++, txt.toString(), txt.isX2);
                  } 
                  
              })
              v.getAttribute("y").then(val =>{
                  if(val){
                      txt.y2_text = v_;
                      txt.y2 = val;
                      txt.isX2 = false;
                      this.setLineTextData(j++, txt.toString(), txt.isX2);
                   /* console.log(j++);
                    console.log("txt.toString()2", txt.toString())
                    console.log("texty2", txt.y2);*/
                    console.log("txt.y2_text", txt.y2_text)
                  } 

              })
             // i++;
          }
      })
     
    
         
    } catch(Exception){
        const  svg_elements = "<svg>No svg elements were found, indicating a syntax error<svg>";
       
    }
  }

  public async setSVGData(counter: number, value: string){
    
    const collection = await this.client.getOrCreateCollection({
      name: "SVGCollection",
    });
    
    await collection.add({
      documents: [
        value,
      ],
      ids: ["svg"+ counter],
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

    console.log("results", results);
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