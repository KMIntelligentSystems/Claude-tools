import 'chromedriver';;
import { Options} from 'selenium-webdriver';
import { Builder,/*Browser,*/ ThenableWebDriver, WebElement, By, WebElementPromise} from 'selenium-webdriver';
import { readFileSync, writeFileSync, unlinkSync,  existsSync } from 'fs';

import { setTransforms, setSVG, setTranslate, setTickLines, setTickText, 
  setPaths, setRect, setLinePaths, setRectFill, setLegendText} from './test'

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

  public async getSVGElement(){
    const first =  this.driver.findElements(By.xpath("//*[name()='svg']"));
    let comment = "<!-- The dimensions of the SVG frame  --> ";
            //provides svg h and w
            first.then(value =>{
                for (var v of value) {
                 v.getAttribute("height").then(h => {
                    v.getAttribute("width").then(w => {
                      let val = setSVG(h,w);
                      this.log(comment + val, "svg");
                    })
                  })
                }
            })
  }

  public async getTransforms(){
        //Vector = "transform"
        const globalTransform =  this.driver.findElements(By.xpath("//*[name()='g' and not(@class)]"));
        let commentAdded = false;
        let comment = "<!-- Translates the svg frame within the given height and width  --> ";
          globalTransform.then(value =>{
            for (var v of value) {
              v.getAttribute("transform").then(v1 => {
               
                if(v1){
                  setTransforms(v1).then(t => {
                    if(!commentAdded){
                      this.log(comment + t, "svg");
                      commentAdded = true;
                    } else{
                      this.log(t, "svg");
                    } 
                  })
                }
              })
            }
        })
  }

  public async getTickXY(){
    const tick  = this.driver.findElements(By.xpath("//*[name()='g' and @class='tick']"));
    const commentForY = "<!-- The y-axis data is translated up the axis with the translate increments -->";
    const commentForX = "<!-- The x-axis data is translated along the axis with the translate increments -->"
    let commentX = false;
    let commentY = false;
    tick.then(value =>{
      for (var v of value) {
        v.getAttribute("transform").then(v1 => {
         setTranslate(v1).then(t => {
          //The y is 0 thus straight line
          if(t.includes("<y>0</y>")){
            if(!commentX){
              this.log(commentForX + t, "tick_x")
              commentX = true;
            }else{
              this.log(t, "tick_x")
            }
          } else {
            //Just vertical line
            if(!commentY){
              this.log(commentForY + t, "tick_y")
              commentY = true;
            }else{
              this.log(t, "tick_y")
            }
          }
         })
        })
      }
     })
  }

public async getTickLine(){
  const promiseLine = this.driver.findElements(By.xpath("//*[name()='line']"));
  let commentY = "<!-- The tick lengths up the y-axis going from right to left --> ";
  let commentForX = false;
  let commentX = "<!-- The tick lengths descending from the x-axis --> ";
  let commentForY = false;
  promiseLine.then(value =>{
    for (var v of value) {
        v.getAttribute("y2").then(val =>{
            if(val){
                setTickLines(val, "y2").then(l => {
                  let val: string= "line_len_x>" + l + "</line_len_x>";
                  if(!commentForX){
                    this.log(commentX + val, "tick_x");
                    commentForX = true;
                  }else {
                    this.log(val, "tick_x");
                  }
                });                  
               } 
        })
        v.getAttribute("x2").then(val =>{
            if(val){
                setTickLines(val, "x2").then(l => {
                  let val: string= "line_len_y>" + l + "</line_len_y>";
                  if(!commentForY){
                    this.log(commentY + val, "tick_y");
                    commentForY = true;
                  }else {
                    this.log(val, "tick_y");
                  }
                }); 
            } 
        })
      } 
    })
  }

  public async getTickText(){
    const promiseLineTxt = this.driver.findElements(By.xpath("//*[name()='text' and @fill='currentColor']"));
    let commentX = "<!-- The tick text values of the x-axis --> ";
    let commentForX = false;
    let commentY = "<!-- The tick text values of the y-axis --> ";
    let commentForY = false;
    promiseLineTxt.then(value =>{
      let i = 0;
      let j = 0;
      for (var v of value) {
          let v_ = "";
          v.getText().then(val =>{
            v_ = val; 
          })
          v.getAttribute("x").then(val =>{
              if(val){
                  setTickText(v_, val,"x2").then(l => {
                    if(!commentForY){
                      this.log(commentY + l, "tick_y");
                      commentForY = true;
                    } else {
                      this.log(l, "tick_y");
                    }
                  });
              }   
          })
          v.getAttribute("y").then(val =>{
              if(val){
                  setTickText(v_, val,"y2").then(l => {
                    if(!commentForX){
                      this.log(commentX + l, "tick_x");
                      commentForX = true;
                    } else {
                      this.log(l, "tick_x");
                    }
                 });
              } 
          })
        }
    })
  }

  public async getRects(){
    const promiseRect = this.driver.findElements(By.xpath("//*[name()='rect']"));
    let comment = "<!-- The rects defining the sizes of rectangles in a bar chart or if small as legend --> ";
    let commentForRect = false;
    promiseRect.then(value => {
        for (var v of value) {
            v.getRect().then(val =>{
            setRect(val.x, val.y, val.height, val.width).then(r => {
              if(!commentForRect){
                this.log(comment + r, "rects");
                commentForRect = true;
              } else{
                this.log(r, "rects");
              }
            })
        })
        v.getAttribute("fill").then(val => {
          setRectFill(val).then(f => {
            this.log(f, "rects");
          });
        })
      } 
    });
  }

  public async getLegendText(){
    let hasX = false;
    let hasY = false;
    const promiseLineTxt = this.driver.findElements(By.xpath("//*[name()='g']//*[name()='g']//*[name()='text']"));
    promiseLineTxt.then(value =>{
      for (var v of value) {
        v.getText().then(val =>{
          
          setLegendText(val).then(t => {
            const regexp = /\d+/;
            if(!t.match(regexp)){
              this.log(t, "rects");
            }
          })
        })
      }
    })
  }

  public async getPaths(){
    const promisePath = this.driver.findElements(By.xpath("//*[name()='path'and @class='domain']"));
    let comment = "<!-- The paths define the x-y axes --> ";
    let commentForPath = false;
    promisePath.then(value =>{
      for (var v of value) {
          v.getAttribute("d").then(val =>{
              setPaths(val).then(p => {
                if(!commentForPath){
                  this.log(comment + p, "paths");
                  commentForPath = true;               
                }else{
                  this.log(p, "paths");
                }
              })
          })
        }
    })
  }

  public async getLines(){
    const promisePath = this.driver.findElements(By.xpath("//*[name()='path'and @class='line']"));
    let comment = "<!-- The paths define the line chart --> ";
    let commentForPath = false;
    promisePath.then(value =>{
      for (var v of value) {
          v.getAttribute("d").then(val =>{
              setLinePaths(val).then(p => {
                if(!commentForPath){
                  this.log(comment + p, "line_paths");
                  commentForPath = true;               
                }else{
                  this.log(p, "line_paths");
                }
              })
          })
        }
    })
  }

  public async findElements() {
    try{
         await this.delFiles();
         await this.getSVGElement();
         await this.getTickXY();
         await this.getTickLine();
         await this.getTickText();
         await this.getTransforms();
         await this.getRects();
         await this.getPaths();
         await this.getLines();
         await this.getLegendText();
    } catch(Exception){
        const  svg_elements = "<svg>No svg elements were found, indicating a syntax error<svg>";
       
    }
      
  }

  async delFiles(){
    try {
      const path = 'C:/salesforce/repos/Claude tools/';
      const svgFile = "svg.txt";
      const xfile = "tickX.txt";
      const yfile = "tickY.txt";
      const rectFile = "rect.txt";
      const pathFile = "path.txt";
      const linePathFile = "linePath.txt";
      if(existsSync(path+svgFile)){
        unlinkSync(path+svgFile);
      }
      if(existsSync(path+xfile)){
        unlinkSync(path+xfile);
      }
      if(existsSync(path+yfile)){
        unlinkSync(path+yfile);
      }
      if(existsSync(path+rectFile)){
        unlinkSync(path+rectFile);
      }
      if(existsSync(path+pathFile)){
        unlinkSync(path+pathFile);
      }
      if(existsSync(path+linePathFile)){
        unlinkSync(path+linePathFile);
      }
  } catch (err) {
      console.error('Error deleting the file:', err);
  }
  }

  public log(val: string, type: string){ 
    const path = 'C:/salesforce/repos/Claude tools/';
    const svgFile = "svg.txt";
    const xfile = "tickX.txt";
    const yfile = "tickY.txt";
    const rectFile = "rect.txt";
    const pathFile = "path.txt";
    const linePathFile = "linePath.txt";
    if(type == "svg"){
      writeFileSync(path+svgFile, val+"\n", {
        flag: 'a',
      });
    } else if (type == 'tick_x'){
      writeFileSync(path+xfile, val+"\n", {
        flag: 'a',
      });
    } else if (type == 'tick_y'){
      writeFileSync(path+yfile, val+"\n", {
        flag: 'a',
      });
    } else if (type == 'rects'){
      writeFileSync(path+rectFile, val+"\n", {
        flag: 'a',
      });
    } else if (type == 'paths'){
      writeFileSync(path+pathFile, val+"\n", {
        flag: 'a',
      });
    }else if (type == 'line_paths'){
      writeFileSync(path+linePathFile, val+"\n", {
        flag: 'a',
      });
    }
  }

 /* public async setSVGData_(counter: number, value: string){
    
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
  }*/

  

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

 
