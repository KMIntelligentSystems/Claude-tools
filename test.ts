class linex2{
    x2: number = 0;
}

class liney2{
  y2: number = 0;
}
class lineTextx2{
    x2: number = 0;
    text: number = 0;
}

class lineTexty2{
  y2: number = 0;
  text: number = 0;
}

class transforms{
    id: number = 0;
    transform: string = "";
}

class rect {
    x: number = 0;
    y: number = 0;
    height: number = 0;
    width: number = 0;
}

class svg {
    height: string = "";
    width: string = "";
}


const ids =  [
    'transform2',  'transform14',
    'transform3',  'transform6',
    'transform5',  'transform1',
    'transform21', 'transform12',
    'transform8',  'transform7',
    'transform9',  'transform17',
    'transform0',  'transform11',
    'transform13', 'transform4',
    'transform15', 'transform10',
    'transform18', 'transform20',
    'transform19', 'transform16'
  ]

const rects: rect[] = [{x: 48,y: 18,width: 44.163330078125,height: 360},
{x: 92.163330078125,y: 376.38568115234375,width: 44.163330078125,height: 1.6143392324447632},
{x: 136.32666015625,y: 378,width: 44.163352966308594,height: 0},
{x: 180.49002075195312,y: 378,width: 44.163330078125,height: 0},
{x: 224.65335083007812,y: 378,width: 44.16331100463867,height: 0},
{x: 268.816650390625,y: 378,width: 44.16337203979492,height: 0},
{x: 312.98004150390625,y: 378,width: 44.163330078125,height: 0},
{x: 357.14337158203125,y: 378,width: 44.163330078125,height: 0},
{x: 401.30670166015625,y: 376.38568115234375,width: 36.693321228027344,height: 1.6143392324447632}]

const lineTransforms: string[] = [  'translate(82.08798147758367,0)',  'translate(0,230.85201793721976)',  'translate(123.1319722163755,0)',  'translate(246.263944432751,0)',  'translate(205.21995369395916,0)',  'translate(41.043990738791834,0)',  'translate(0,4.843049327354274)',  'translate(0,295.4260089686099)',  'translate(328.35192591033467,0)',  'translate(287.30793517154285,0)',  'translate(369.3959166491265,0)',  'translate(0,133.9910313901345)',  'translate(0,0)',  'translate(0,327.7130044843049)',  'translate(0,263.1390134529148)',  'translate(164.17596295516734,0)',  'translate(0,198.56502242152467)',  'translate(0,360)',  'translate(0,101.70403587443947)',  'translate(0,37.13004484304931)',  'translate(0,69.4170403587444)',  'translate(0,166.2780269058296)'];
const lineX2: linex2[] = [{x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}, {x2: -6}]
const lineY2: liney2[] = [{y2: 6}, {y2: 6}, {y2: 6}, {y2: 6}, {y2: 6}, {y2: 6}, {y2: 6}, {y2: 6}, {y2: 6}, {y2: 6}];
const lineTextX2: lineTextx2[] =  [{x2:-9,text:0},{x2:-9,text:100},{x2:-9,text:120},{x2:-9,text:140},{x2:-9,text:160},{x2:-9,text:180},{x2:-9,text:20},{x2:-9,text:200},{x2:-9,text:220},{x2:-9,text:40},{x2:-9,text:60},{x2:-9,text:80}];
const lineTextY2: lineTexty2[] = [{y2:9,text:0},{y2:9,text:1000},{y2:9,text:2000},{y2:9,text:3000},{y2:9,text:4000},{y2:9,text:5000},{y2:9,text:6000},{y2:9,text:7000},{y2:9,text:8000},{y2:9,text:9000}];

const svgData: string[] = [ 'height: 400', 'width: 460' ];
function main(){
    let start = "<svg>";
    let end = "</svg>"
    let frame = start;
    let svg_ = setSVG_(svgData);
    frame = frame + svg_;
    let trans = setTransforms_([ 'translate(40,10)', 'translate(0, 360)' ]);
    frame = frame + trans;
    let paths = setPaths_(["M0,6V0H390V6", "M-6,360H0V0H-6"]);
    frame = frame + paths;
    let ticks = setTicks(lineTransforms, lineX2, lineY2, lineTextX2, lineTextY2);
    frame = frame + ticks;
    let rects_ = setRects(rects);
    frame = frame + rects_ + end;
}

export  function setSVG(height: string, width: string){
    let res: string = "";
    let h = "<height>";
    let h_end = "</height>";
    let w = "<width>";
    let w_end = "</width>";
    
    res = h + height + h_end + w + width + w_end;
 
    return res as string;
}

export async function setTranslate(trans: string){
    const start = "translate(".length;
    const end = trans.length - 1;
    let vals:any[] = trans.substring(start, end).split(",");
    let x = "<x>" + vals[0] + "</x>";
    let y = "<y>" + vals[1] + "</y>";
    let res = "<translate>" + x + y + "</translate>";
    return res;
}

export async function setTickLines(line: string, type: string){
    let line_x2 = "";
    let line_y2 = "";
    if(type == "y2"){
        line_y2 = line;
        return line_y2;
    } else{
        line_x2 = line;
        return line_x2;
    }
}

export async function setTickText(text: string, pos: string, type: string){
    let line_text_x = "<line_text_x>";
    let line_text_x_end = "</line_text_x>";
    let line_text_y = "<line_text_y>";
    let line_text_y_end = "</line_text_y>";
    let x2 = "<line_len_x>";
    let x2_end = "</line_len_x>"
    let y2 = "<line_len_y>";
    let y2_end = "</line_len_y>"
    //y2 is for the line meaning x2 is 0 as is x1 and y1
    if(type == "y2"){
        x2 = x2 + pos + x2_end;
        line_text_x =line_text_x + text + line_text_x_end;
        return line_text_x;
    } else{
        y2 = y2 + pos + y2_end;
        line_text_y =line_text_y + text + line_text_y_end;
        return line_text_y;
    }
}


export async function setPaths(p: string){
    //"M0,6V0H390V6"

    let path = "<path>";
    let path_end = "</path>";
    let move_from = "<move_from>";
    let move_from_end = "</move_from>";
    
    let splitArray = p.split(",");
    
    let start = splitArray[0];
    let end: string = splitArray[1] as string;
  
    path = path + move_from + start + move_from_end;
        
    let commands = getPathCommands(end);
   
    path = path + commands + path_end;
    return path;
  }

  export async function setTransforms(trans1: string){
    let transform: string = "<translate>";
    let transform_end: string = "</translate>";
    let x: string = "<x>";
    let x_end: string = "</x>";
    let y: string = "<y>";
    let y_end: string = "</y>";

    trans1 = trans1.replace("translate(", "");
    trans1 = trans1.replace(")", "");
    let splitArray = trans1.split(",");
    const x1 = splitArray[0];
    const y1 = splitArray[1];
   
    let transforms = transform + x + x1 + x_end + y + y1 + y_end + transform_end;
    return transforms;
  }

export async function setRect(x_: number, y_: number, h: number, w: number){
   
    let rect = "<rect>";
    let rect_end = "</rect>";
    let x = "<x>";  
    let x_end = "</x>";
    let y = "<y>";
    let y_end = "</y>";
    let width = "<width>"
    let width_end = "</width>"
    let height = "<height>"
    let height_end = "</height>"

    let res = rect + x + x_ + x_end + y + y_ + y_end + width + w + width_end + height + h + height_end + rect_end;
    return res;
}

export async function setRectFill(fill: string){
  let rect_color = "<rect_color>";
  let rect_color_end = "</rect_color>";

  return rect_color + fill + rect_color_end;
}

export async function setLegendText(text:  string){
    let legend = "<legend_txt>";
    let legend_end = "</legend_txt>";

    return legend + text + legend_end;
  }

function setSVG_(svg: string[]): string{
    let res: string = "";
    let h = "<height>";
    let h_end = "</height>";
    let w = "<width>";
    let w_end = "</width>";
    let splitArray_h = svg[0]?.split(",");
    let splitArray_w = svg[1]?.split(",");
    let height: any = "";
    let width: any = "";
    if(splitArray_h){
            height = splitArray_h[0];
    }
    let heights = height.split(':');
    res = h + heights[1] + h_end;
    if(splitArray_w){
        width = splitArray_w[0];
    }
    let widths = width.split(':');
    res = res + w + widths[1] + w_end;
   
    return res;
}
function setRects(rects: rect[]): string{
    let res: string = "<rects>";
    let rect = "<rect>";
    let rect_end = "</rect>";
    let x = "<x>";  
    let x_end = "</x>";
    let y = "<y>";
    let y_end = "</y>";
    let width = "<width>"
    let width_end = "</width>"
    let height = "<height>"
    let height_end = "</height>"
    rects.forEach(r =>{
        let res_ = rect + x + r.x + x_end + y + r.y + y_end + width + r.width + width_end + height + r.height + height_end + rect_end;
        res = res + res_;
    })

    return res + "</rects>";
}








export async function setRect_(x_: number, y_: number, h: number, w: number){
    //let res: string = "<rects>";
    let rect = "<rect>";
    let rect_end = "</rect>";
    let x = "<x>";  
    let x_end = "</x>";
    let y = "<y>";
    let y_end = "</y>";
    let width = "<width>"
    let width_end = "</width>"
    let height = "<height>"
    let height_end = "</height>"

    let res = rect + x + x_ + x_end + y + y_ + y_end + width + w + width_end + height + h + height_end + rect_end;
}


function setTicks(lineTransforms: string[], lineX2: linex2[], lineY2: liney2[],  lineTextX2: lineTextx2[],lineTextY2: lineTexty2[]): string{
    let tick_h = "<tick_horizontal>";
    let tick_end_v = "</tick_vertical>";
    let tick_v = "<tick_vertical>";
    let tick_end_h = "</tick_horizontal>";
    let transform = "<transform>";
    let transform_end = "</transform>";
    let line_y = "<line_len_y>";
    let line_x = "<line_len_x>";
    let line_end_y = "</line_len_y>";
    let line_text_y = "<line_text_y>";
    let line_text_end_y = "</line_text_y>";
    let line_end_x = "</line_len_x>";
    let line_text_x = "<line_text_x>";
    let line_text_end_x = "</line_text_x>";
    
    let i = 0;
    let transformCollection: transforms[] = [];
    
    ids.forEach(e =>{
        let x = e.substring("transform".length);
        let transform: transforms = new transforms();
        transform.id = +x;
        transform.transform = lineTransforms[i++] as string;
        transformCollection.push(transform);
    })
    transformCollection.sort((a, b) => a.id - b.id);
    let transformCollection1 = transformCollection.slice(0,lineY2.length);
    let transformCollection2 = transformCollection.slice(lineY2.length, transformCollection.length);
    let transformY = "";
    let index = 0;
    transformCollection1.forEach(v => {
        let trn: string = setTranslate_(v.transform);
        transformY = transformY + transform + trn + line_y + lineY2[index]?.y2 + line_end_y + line_text_y + lineTextY2[index++]?.text + line_text_end_y + transform_end + '\n';
    })
    let transformX = "";
    index = 0;
    transformCollection2.forEach(v => {
        let trn: string = setTranslate_(v.transform);
        transformX = transformX + transform + trn + line_x + lineX2[index]?.x2 + line_end_x + line_text_x + lineTextX2[index++]?.text + line_text_end_x + transform_end + '\n';
    
    })
    transformX = tick_h + transformX + tick_end_h;
    transformY = tick_v + transformY + tick_end_v;

    let trans: string = "<ticks>";
    trans = trans + transformY;
    trans = trans + transformX;
    return trans + "</ticks>";
}

function setTranslate_(trans: string):string{
    const start = "translate(".length;
    const end = trans.length - 1;
    let vals:any[] = trans.substring(start, end).split(",");
    let x = "<x>" + vals[0] + "</x>";
    let y = "<y>" + vals[1] + "</y>";
    let res = "<translate>" + x + y + "</translate>";

    return res;
}

function setTransforms_(globalTransforms: string[]):string{
    let transforms: string = "<transforms>";
    let transforms_end: string = "</transforms>";
    let transform: string = "<transform>";
    let transform_end: string = "</transform>";
    let x: string = "<x>";
    let x_end: string = "</x>";
    let y: string = "<y>";
    let y_end: string = "</y>";
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
    
    return transforms;
  }

 


  function setPaths_(paths: string[]): string{
    let paths_: string = "<paths>";
    let path = "<path>";
    let path_end = "</path>";
    let move_from = "<move_from>";
    let move_from_end = "</move_from>";
    let move_to = "<move_to>";
    let move_to_end = "</move_to>";
    for(let i = 0; i <paths.length; i++){
        let splitArray = paths[i]?.split(",");
        let start: any = [];
        let end: any = [];
        if(splitArray){
            start = splitArray[0];
            end = splitArray[1];
            start = start.substring(1);
            path = path + move_from + start + move_from_end;
        }
        let commands = getPathCommands(end);
        path = path + commands + path_end;
      
        paths_ = paths_ + path;
        path = "<path>";
    }
    return paths_ + "</paths>";
  }

  export async function setLinePaths(p: string){
    let path = "<path>";
    let path_end = "</path>";
    let move_from = "<move_from>";
    let move_from_end = "</move_from>";
    
    let splitArray:string[] = p.split(",");
    
    let start = splitArray[0]?.substring(1);
    for(let i = 1;i < splitArray.length;i++){
        let cmd = splitArray[i] as string;
        let commands = getLinePathCommands(cmd);
        path = path + move_from + start + move_from_end + commands;
    }
    
    return path + path_end;
  }

  function getLinePathCommands(command: string): string{
    //65.399L355
    let move_to = "<move_to>";
    let move_to_end = "</move_to>";
    let line_to = "<line_to>";
    let lineTo_to_end = "</line_to>";
    if(command.includes("L")){
        let len = command.length;
        let idx = command.indexOf("L");
        let m = command.substring(0, idx);
        let l = command.substring(idx+1, len);
        move_to = move_to  + m + move_to_end + line_to + l + lineTo_to_end;
    } else{
        move_to = move_to  + command + move_to_end;
    }
     return move_to;
  }


  function getPathCommands(command: string): string{
    let move_to = "<move_to>";
    let move_to_end = "</move_to>";
    let vertical = "<vertical>";
    let vertical_end = "</vertical>";
    let horizontal = "<horizontal>";
    let horizontal_end = "</horizontal>";
    let elements = command.split('');
    let isVertical = false;
    let isHorizontal = false;
    let len = elements.length;

    let j = 0;
    while(j <= len){
        if(!isNaN(Number(elements[j])) && j == 0){
            let val:any = elements[j]?.toString();
            while(true){
                if(!isNaN(Number(elements[++j]))){
                    val = val + elements[j]?.toString();
                } else{
                    move_to = move_to + val;
                    if(isVertical){
                        move_to = move_to + vertical_end;
                        isVertical = false;
                    } else if(isHorizontal){
                        move_to = move_to + horizontal_end;
                        isHorizontal = false;
                    }
                    else{
                        move_to = move_to  + move_to_end;
                    }
                    break;
                }
            }
        } else if(isNaN(Number(elements[j]))){
            //end the previous step which is the numeric value
            if(j < elements.length){
                if(elements[j] == 'V'){
                    isVertical = true;
                    move_to = move_to + vertical;
                } else if(elements[j] == 'H'){
                    move_to = move_to + horizontal;
                    isHorizontal = true;
                }
            }
            j++;
        } else if(!isNaN(Number(elements[j])) && j > 0){
            let hasNeg = false;
            if(elements[j-1] == '-'){
                hasNeg = true;
            }
            let val:any = elements[j]?.toString();
            while(true){
                if(!isNaN(Number(elements[++j]))){
                    val = val + elements[j]?.toString();
                } else{
                    if(hasNeg){
                        val = "-" + val;
                        hasNeg = false;
                    }
                    move_to = move_to + val;
                    if(isVertical){
                        move_to = move_to + vertical_end;
                        isVertical = false;
                    } else if(isHorizontal){
                        move_to = move_to + horizontal_end;
                        isHorizontal = false;
                    } else{
                        move_to = move_to  + move_to_end;
                    }

                    break;
                }
            }
        }
    }

    if(isVertical){
        move_to= move_to + vertical_end;
    } else  if(isHorizontal){
        move_to= move_to + horizontal_end;
    }
    return move_to;
  }
  //setTransforms([ 'translate(0, 360)', 'translate(40,10)' ]);
  //setPaths(["M0,6V0H390V6", "M-6,360H0V0H-6"]);
  //setTicks(lineTransforms, lineX2, lineY2, lineTextX2, lineTextY2);
  //setRects(rects);
  main();