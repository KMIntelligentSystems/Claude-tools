import 'chromedriver';
//import chrome from 'selenium-webdriver/chrome';
const Chrome = require('selenium-webdriver/chrome');
//const { Browser, Builder } = require("selenium-webdriver");

import { Options,ProxyConfig} from 'selenium-webdriver';
import { Builder,/*Browser,*/ ThenableWebDriver, WebElement, By, WebElementPromise} from 'selenium-webdriver';
import { readFileSync, writeFileSync, unlinkSync,  existsSync } from 'fs';

import { setTransforms, setSVG, setTranslate, setTickLines, setTickText, 
  setPaths, setRect, setLinePaths, setRectFill, setLegendText, setLinePathColors} from './test'
import { createSVGMappingFile } from './tools'

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
   options = new Chrome.Options();
  
  public constructor() {
    //--disable-web-security
    this.options.addArguments('--disable-web-security');
    this.driver = new Builder().forBrowser('chrome').setChromeOptions(this.options).build();
    
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
                     console.log("svg element", val);
                      this.log(val, "svg");
                    })
                  })
                }
            }).then(null, function (err) {
                  console.log("SVG!", err);
          });
  }

  public async getTransforms(){
        //Vector = "transform"
        const globalTransform =  this.driver.findElements(By.xpath("//*[name()='g' and not(@class)]"));
  
        let commentAdded = false;
        let comment = "<!-- Translates the svg frame within the given height and width  --> ";
          globalTransform.then(value =>{
           
            for (var v of value) {
              
              v.getAttribute("transform").then(v1 => {
                console.log(v1)
                if(v1){
                  setTransforms(v1).then(t => {
                  //  console.log("transform", t)
                //    this.log(t, "svg");
                  
                  })
                }
              })
            }
        }).then(null, function (err) {
          console.log("SVG transforms!", err);
  });
  }

  public async getTickXY(){
    const tick  = this.driver.findElements(By.xpath("//*[name()='g' and @class='tick']"));
    const commentForY = "<!-- The y-axis data is translated up the axis with the translate increments -->";
    const commentForX = "<!-- The x-axis data is translated along the axis with the translate increments -->"
    let commentX = false;
    let commentY = false;
    tick.then(value =>{
      if(value.length== 0){
        this.log("**There are no ticks along the x-axis", "tick_x");
        this.log("**There are no ticks along the y-axis", "tick_y");
      }
      for (var v of value) {
        v.getAttribute("transform").then(v1 => {
         
         setTranslate(v1).then(t => {
         // console.log("tickxy", t)
          //The y is 0 thus straight line
          if(t.includes(",0")){
              this.log(t, "tick_x")
          } else if(t.includes("0,"))  {
            //Just vertical line
              this.log(t, "tick_y")
          }
         })
        })
      }
    });
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
                  let val: string= "<line_len_x>" + l + "</line_len_x>";
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
                  let val: string= "<line_len_y>" + l + "</line_len_y>";
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
      if(value.length== 0){
        this.log("**There are no tick texts along the x-axis", "tick_text_x");
        this.log("**There are no tick texts along the y-axis", "tick_text_y");
      }
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
                   // console.log("ticktext x", l)
                      this.log(l, "tick_text_y");
                  });
              }   
          })
          v.getAttribute("y").then(val =>{
              if(val){
                  setTickText(v_, val,"y2").then(l => {
                   // console.log("ticktext y", l)
                      this.log(l, "tick_text_x");
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
      if(value.length== 0){
        this.log("**There are no rects to define legends or bars", "rects");
      }
        for (var v of value) {
            v.getRect().then(val =>{
            setRect(val.x, val.y, val.height, val.width).then(r => {
                this.log(r, "rects");
             //console.log("rect", r)
            })
        })
        v.getAttribute("fill").then(val => {
          setRectFill(val).then(f => {
           // console.log("rect fill", f)
            this.log(f, "rects");
          });
        })
      } 
    }).then(null, function (err) {
      console.log("RECTS!", err);
    });
  }

  public async getLegendText(){
    let hasX = false;
    let hasY = false;
    const promiseLineTxt = this.driver.findElements(By.xpath("//*[name()='g']//*[name()='g']//*[name()='text']"));
    promiseLineTxt.then(value =>{
      
      for (var v of value) {
        v.getAttribute("x").then(val => {
         // console.log("legend x", val)
         this.log(val, "all_x_pos");
        })
        v.getAttribute("y").then(val => {
         // console.log("legend y", val)
         this.log(val, "all_y_pos");
        })
        v.getText().then(val =>{
        //  console.log("legend txt", val)
        this.log(val, "all_text");
         /* setLegendText(val).then(t => {
            const regexp = /\d+/;
            if(!t.match(regexp)){
              this.log(t, "rects");
            }
          })*/
        })
      }
    })
  }

  public async getPaths(){
    const promisePath = this.driver.findElements(By.xpath("//*[name()='path'and @class='domain']"));
    let comment = "<!-- The paths define the x-y axes --> ";
    let commentForPath = false;
    promisePath.then(value =>{
      if(value.length== 0){
        this.log("**The x-y axes are not defined", "paths");
      }
      for (var v of value) {
          v.getAttribute("d").then(val =>{
              setPaths(val).then(p => {
                this.log(p, "paths");
               //console.log("xy axes", p)
              })
          })
        }
    }).then(null, function (err) {
      console.log("PATHS!", err);
    });
  }

  public async getScriptErrors(){
   /* var errorStrings = new List<string> 
    { 
        "SyntaxError", 
        "EvalError", 
        "ReferenceError", 
        "RangeError", 
        "TypeError", 
        "URIError" 
    };*/

    var jsErrors = this.driver.manage().logs();//.GetLog(LogType.Browser).Where(x => errorStrings.Any(e => x.Message.Contains(e)));
    console.log("js errore", jsErrors)
    var res = await jsErrors.get( "browser");
    res.forEach(e => {
      console.log("ERROR...", e.message)
    })
  }
  public async getLines(){
    const promisePath = this.driver.findElements(By.xpath("//*[name()='path'and @class='line']"));
    let comment = "<!-- The paths define the line chart --> ";
    let commentStroke = "<!-- The paths have unique colors --> ";
    let commentForPath = false;
    let commentStrokeDone = false;
    promisePath.then(value =>{
      if(value.length== 0){
        this.log("**There are no lines depicted for a line chart ", "chart_lines");
        this.log("**There are no lines depicted for a line chart nd therefore no color strokes", "chart_lines_fill");
      }
      for (var v of value) {
          v.getAttribute("d").then(val =>{
            console.log("line paths---", val)
              setLinePaths(val).then(p => {
                this.log(p, "chart_lines");
              })
          })
          v.getAttribute("stroke").then(val =>{
            setLinePathColors(val).then(c => {
              console.log("stroke", c)
              this.log(c, "chart_lines_fill");
            })
          })
        }
    }).then(null, function (err) {
      console.log("LINE PATHS!", err);
    });
  }
/*******************
 * jupyter-lab
 * public void TestCleanup()
{
    var errorStrings = new List<string> 
    { 
        "SyntaxError", 
        "EvalError", 
        "ReferenceError", 
        "RangeError", 
        "TypeError", 
        "URIError" 
    };

    var jsErrors = Driver.Manage().Logs.GetLog(LogType.Browser).Where(x => errorStrings.Any(e => x.Message.Contains(e)));

    if (jsErrors.Any())
    {
        Assert.Fail("JavaScript error(s):" + Environment.NewLine + jsErrors.Aggregate("", (s, entry) => s + entry.Message + Environment.NewLine));
    }
}
 * 
 */
  public async findElements() {
    try{
        // await this.delFiles();
       
         await this.getSVGElement();
         await this.getTickXY();
       //  await this.getTickLine();
         await this.getTickText();
         await this.getTransforms();
         await this.getRects();
         await this.getPaths();
         await this.getLines();
         await this.getLegendText();
         await this.getScriptErrors();
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
      const allTextFile = "allText.txt";
      const allXPosFile = "allXPos.txt"
      const allYPosFile = "allYPos.txt"
      const txtTickXFile ="tick_text_x.txt";
      const txtTickYFile ="tick_text_y.txt";
      const linePathFillFile = "linePathFill.txt";
      const svgMappingFile = "svgMaapping.txt";
      if(existsSync(path+svgFile)){
        unlinkSync(path+svgFile);
      }
      if(existsSync(path+txtTickXFile)){
        unlinkSync(path+txtTickXFile);
      }
      if(existsSync(path+txtTickYFile)){
        unlinkSync(path+txtTickYFile);
      }
      if(existsSync(path+linePathFillFile)){
        unlinkSync(path+linePathFillFile);
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
      if(existsSync(path+allTextFile)){
        unlinkSync(path+allTextFile);
      }
      if(existsSync(path+allXPosFile)){
        unlinkSync(path+allXPosFile);
      }
      if(existsSync(path+allYPosFile)){
        unlinkSync(path+allYPosFile);
      }
  } catch (err) {
      console.error('Error deleting the file:', err);
  }
  }

  public log(val: string, type: string){ 
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
    }else if (type == 'chart_lines'){
      writeFileSync(path+linePathFile, val+"\n", {
        flag: 'a',
      });
    }else if (type == 'chart_lines_fill'){
      writeFileSync(path+linePathFill, val+"\n", {
        flag: 'a',
      });
    }
    else if (type == 'all_text'){
      writeFileSync(path+allTextFile, val+"\n", {
        flag: 'a',
      });
    } else if (type == 'all_x_pos'){
      writeFileSync(path+allXPosFile, val+"\n", {
        flag: 'a',
      });
    }else if (type == 'all_y_pos'){
      writeFileSync(path+allYPosFile, val+"\n", {
        flag: 'a',
      });
    }else if (type == 'tick_text_y'){
      writeFileSync(path+txtTickY, val+"\n", {
        flag: 'a',
      });
    }else if (type == 'tick_text_x'){
      writeFileSync(path+txtTickX, val+"\n", {
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

 
