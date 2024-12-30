using CreateCSVFile;
using System;
using System.Diagnostics.CodeAnalysis;
using System.Drawing;
using System.IO;
using System.Net.NetworkInformation;
using System.Text;
using static System.Net.Mime.MediaTypeNames;
using System.Xml.Linq;
using static System.Net.WebRequestMethods;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.IE;
using System.Collections.Generic;
using System.Collections;
using OpenQA.Selenium.DevTools.V129.Debugger;

namespace HealthDeptLOV
{
   
    class Program
    {
        const string delimiter = "```";
        const string circleHeading = @"
The `<circle>` elements from the captured SVG elements depict the 'cx' and 'cy' positions and the 'r' radius of the circle. The rgb fill color is also provided.
";
        const string svgHeading = @"The top '<svg>' element defining height and width of the viewing box.";
        const string transforms = "transforms";
        const string tickYHeading = @"This defines the tick elements, their spacing and their text values on the Y axis of the graph.";
        const string tickXHeading = @"This defines the tick elements, their spacing and their text values on the X axis of the graph.";
        const string pathHeading = @"There are 2 path elements corresponding to the x-y axes of the graph. They use the commands of the 'd' group";
        const string lineHeading = @"In a line chart the lines will define the data in the view box. For other graph types the line will delineate some specific data point.";
        const string rectHeading = @"Rects will define data as bars in  the chart. This will also apply to histograms";
        const string errorHeading = @"**There are errors in your d3 js code**";
        static void Main(string[] args)
        {
           // delSVGMappingFile();
          /*  if (checkSVGFilesExist())
            {
                getSVG();
                getLines();
                getTickXY();
                getPaths();
                getCircles();
                getScriptErrors();
            }*/
           
         
            createSVGMappingFile();
            //delSVGFiles();
            //   int milliseconds = 2000;
            //   Thread.Sleep(milliseconds);
            //  }
        }
        
        static void createSVGMappingFile()
        {
            int counter = 0;
            string path = @"C:\salesforce\repos\Claude tools\";
            string svgFile = @"svg.txt";

           
            while (true) { 
                delFile(path, svgFile);
            //    delSVGMappingFile();

                if (checkSVGFilesExist())
                {
                    Console.WriteLine("H......SVG...");
                    IWebDriver driver = new ChromeDriver();
                    driver.Url = "http://127.0.0.1:5501/chart5_1.html";
                    IList<IWebElement> elements = driver.FindElements(By.XPath(".//*[name()='svg']"));
                    List<string> stringList = new List<string> { svgHeading };
                    string svgStart = "<svg width=";
                    string svg_h = " height=";
                    for (int i = 0; i < elements.Count; i++)
                    {
                        string w = elements[i].GetAttribute("width");
                        svgStart = svgStart + '"' + w + "'";
                        string h = elements[i].GetAttribute("height");
                        svgStart = svgStart + svg_h + '"' + w + "'" + ">";
                        stringList.Add(svgStart);
                    }
                    stringList.Add(delimiter);
                    writeSVGMappingFile(stringList.ToArray());

                    IList<IWebElement> elementsLn = driver.FindElements(By.XPath(".//*[name()='line']"));
                    List<string> stringListLn = new List<string> { lineHeading };
                    string lineStart = "<line x1=";
                    string lineEnd = "</line>";
                    string x2 = " x2=";
                    string y1 = " y1=";
                    string y2 = " y2=";
                    bool isComplete = false;
                    for (int i = 0; i < elementsLn.Count; i++)
                    {
                        isComplete = false;
                        string x = elementsLn[i].GetAttribute("x1");
                        if (x != null)
                        {
                            lineStart = lineStart + '"' + x + '"';
                            isComplete = true;
                        }

                        string x_2 = elementsLn[i].GetAttribute("x2");
                        if (x_2 != null && isComplete)
                        {
                            lineStart = lineStart + x2 + '"' + x_2 + '"';
                            isComplete = true;
                        }

                        string y_1 = elementsLn[i].GetAttribute("y1");
                        if (y_1 != null && isComplete)
                        {
                            lineStart = lineStart + y1 + '"' + y_1 + '"';
                            isComplete = true;
                        }

                        string y_2 = elementsLn[i].GetAttribute("y2");
                        if (y_2 != null && isComplete)
                        {
                            lineStart = lineStart + y2 + '"' + y_2 + '"' + lineEnd;
                        }
                        if(isComplete)
                            stringListLn.Add(lineStart);
                        lineStart = "<line x1=";
                    
                    }
                    stringListLn.Add(delimiter);
                    writeSVGMappingFile(stringListLn.ToArray());

                    IList<IWebElement> elementsPath = driver.FindElements(By.XPath(".//*[name()='path' and @class='domain']"));
                    List<string> stringListPath = new List<string> { pathHeading };
                    string pathStart = "<path d=";
                    string pathEnd = "</path>";
                    for (int i = 0; i < elementsPath.Count; i++)
                    {
                        string d = elementsPath[i].GetAttribute("d");
                        pathStart = pathStart + '"' + d + "'" + pathEnd;
                        stringListPath.Add(pathStart);
                        pathStart = "<path d=";
                    }
                    stringListPath.Add(delimiter);
                    writeSVGMappingFile(stringListPath.ToArray());

                    IList<IWebElement> elementsG = driver.FindElements(By.XPath(".//*[name()='g' and @class='tick']"));
                    List<string> stringListX = new List<string> { tickXHeading };
                    List<string> stringListY = new List<string> { tickYHeading };
                    string tick = "<g class=" + "'" + "tick" + "'" + "transforms=";
                    string lineX = "<line x2=";
                    string lineY = "<line y2=";
                    string textStart = "<text>";
                    string textEnd = "</text>";
                    string tickEnd = "</g>";
                    bool isX = false;
                    bool isY = false;
                    bool finished = false;
                    for (int i = 0; i < elementsG.Count; i++)
                    {
                        string trans = elementsG[i].GetAttribute("transform");
                        tick = tick + '"' + trans + "\"";
                        IList<IWebElement> els = elementsG[i].FindElements(By.TagName("line"));
                        for (int j = 0; j < els.Count; j++)
                        {
                            string ln = els[j].GetAttribute("x2");
                            if (ln != null)
                            {
                                tick = tick + lineX + '"' + ln + '"';
                                isY = true;
                            }
                            string ln1 = els[j].GetAttribute("y2");
                            if (ln1 != null)
                            {
                                tick = tick + lineY + '"' + ln1 + '"';
                                isX = true;
                            }
                        }

                        IList<IWebElement> elsTxt = elementsG[i].FindElements(By.TagName("text"));
                        for (int j = 0; j < elsTxt.Count; j++)
                        {
                            string t = elsTxt[j].Text;
                            tick = tick + textStart + t + textEnd;
                            finished = true;
                        }

                        if (isX && finished)
                        {
                            stringListX.Add(tick);
                            isX = finished = false;
                            tick = "<g class=" + "'" + "tick" + "'" + "transforms=";
                        }
                        else if (isY && finished)
                        {
                            stringListY.Add(tick);
                            isY = finished = false;
                            tick = "<g class=" + "'" + "tick" + "'" + "transforms=";
                        }
                    }
                    stringListX.Add(delimiter);
                    writeSVGMappingFile(stringListX.ToArray());
                    stringListY.Add(delimiter);
                    writeSVGMappingFile(stringListY.ToArray());

                    IList<IWebElement> elementsC = driver.FindElements(By.XPath(".//*[name()='circle']"));
                    string circle_y = " cy= ";
                    string circle_x = "<circle> cx= ";
                    string circle_r = " r= ";
                    string circle_fill = " rgb_color=";
                    string circle_end = "></circle>";
                    int count = elementsC.Count;//1452
                    int counter_1 = 0;
                    int counter_2 = count - 5;
                    List<string> stringListC = new List<string> { circleHeading };
                    stringListC.Add("-The total numver of circles is: " + count + "-");
                    stringListC.Add("-The first 5 circles-");
                    for (int i = 0; i < elementsC.Count; i++)
                    {
                        if (counter_1 < 5)
                        {
                            string cy = elementsC[i].GetAttribute("cy");
                            circle_y = circle_y + '"' + cy + '"';
                            string cx = elementsC[i].GetAttribute("cx");
                            circle_x = circle_x + '"' + cx + '"' + circle_y;
                            string r = elementsC[i].GetAttribute("r");
                            circle_x = circle_x + circle_r + "\"" + r + "\"";
                            string fill = elementsC[i].GetAttribute("style");
                            circle_x = circle_x + "\"" + fill + "\"" + circle_end;
                            stringListC.Add(circle_x);
                            circle_x = "<circle> cx= ";
                            circle_y = " cy= ";
                        }
                        if (counter_1 == 5)
                        {
                            stringListC.Add("-The last 5 circles-");
                        }

                        if (counter_1 >= count - 5 && counter_1 < count)
                        {
                            string cy = elementsC[i].GetAttribute("cy");
                            circle_y = circle_y + '"' + cy + '"';
                            string cx = elementsC[i].GetAttribute("cx");
                            circle_x = circle_x + '"' + cx + '"' + circle_y;
                            string r = elementsC[i].GetAttribute("r");
                            circle_x = circle_x + circle_r + "\"" + r + "\"";
                            string fill = elementsC[i].GetAttribute("style");
                            circle_x = circle_x + "\"" + fill + "\"" + circle_end;
                            stringListC.Add(circle_x);
                            circle_x = "<circle> cx= ";
                            circle_y = " cy= ";
                        }
                        counter_1++;
                    }
                    stringListC.Add(delimiter);
                    if(count > 0)
                    {
                        writeSVGMappingFile(stringListC.ToArray());
                    }
                   

                    IList<IWebElement> elementsR = driver.FindElements(By.XPath(".//*[name()='rect']"));
                    string rect_y = " y= ";
                    string rect_x = "<rect> x= ";
                    string rectHeight = " height= ";
                    string rectWidth = " width= ";
                    string rect_fill = " fill=";
                    string rect_end = "></rect>";

                    count = elementsR.Count;//1452
                    List<string> stringListR = new List<string> { rectHeading };
                    for (int i = 0; i < elementsR.Count; i++)
                    {
                            string y = elementsR[i].GetAttribute("y");
                            rect_y = rect_y + '"' + y + '"';
                            string x = elementsR[i].GetAttribute("x");
                            rect_x = rect_x + '"' + x + '"' + rect_y;
                            string h = elementsR[i].GetAttribute("height");
                            rect_x = rect_x + rectHeight + "\"" + h + "\"";
                            string w = elementsR[i].GetAttribute("width");
                            rect_x = rect_x + rectWidth + "\"" + w + "\"";
                            string fill = elementsR[i].GetAttribute("fill");
                            rect_x = rect_x + rect_fill + "\"" + fill + "\"" + rect_end;
                            stringListR.Add(rect_x);
                            rect_x = "<rect> x= ";
                            rect_y = " y= ";
                      
                       
                    }
                    stringListR.Add(delimiter);
                    writeSVGMappingFile(stringListR.ToArray());

                    ILogs logs = driver.Manage().Logs;
                    var logEntries = logs.GetLog(LogType.Browser); // LogType: Browser, Server, Driver, Client and Profiler
                    List<string> errorLogs = logEntries.Where(x => x.Level == LogLevel.Severe).Select(x => x.Message).ToList();
                    bool errAdded = false;
                    errorLogs.ForEach(e =>
                    {
                        if (!errAdded)
                        {
                            List<string> stringList = new List<string> { errorHeading };
                            stringList.Add(e.ToString());
                            stringList.Add(delimiter);
                            if(!e.ToString().Contains("favicon.ico"))
                                writeSVGMappingFile(stringList.ToArray());
                            errAdded = true;
                        }
                    });
                    counter++;
               }
                if (counter >= 3)
                    break;
            }
           
        }

        static void delSVGMappingFile()
        {
            try
            {
                string path = "C:/salesforce/repos/Claude tools/";
                string svgFile = "svgMapping.txt";
                if (System.IO.File.Exists(path + svgFile))
                {
                    System.IO.File.Delete(path + svgFile);
                }
            }
            catch (Exception exp)
            {
                Console.WriteLine(exp.Message);

            }
      }

        static void delFile(string path, string svgFile)
        {
            try
            {
              
                if (System.IO.File.Exists(path + svgFile))
                {
                    System.IO.File.Delete(path + svgFile);
                    Console.WriteLine("Here DEL......SVG...");
                }
              
            }
            catch (Exception exp)
            {
                Console.WriteLine(exp.Message);
                
            }

        }

        static string[] readHtmlFile(string path, string htmlFile)
        {
            List<string> stringList = new List<string> { "" };
            if (System.IO.File.Exists(path + htmlFile))
            {
                using (StreamReader reader = new StreamReader(path + htmlFile))
                {
                    string line;
                    // Read line by line The value for , must be changed to , in the Preferred Language LOV.
                    while ((line = reader.ReadLine()) != null)
                    {
                        var val = line.TrimStart();
                        stringList.Add(val);
                    }
                }
            }
            string[] stringArray = stringList.ToArray();
            return stringArray;
        }

        static string[] readLinesFromFile(string path, string svgFile) {
            List<string> stringList = new List<string> { "" };
            if (System.IO.File.Exists(path + svgFile))
            {
                using (StreamReader reader = new StreamReader(path + svgFile))
                {
                    string line;
                    // Read line by line The value for , must be changed to , in the Preferred Language LOV.
                    while ((line = reader.ReadLine()) != null)
                    {
                        var val = line.TrimStart();
                        stringList.Add(val);
                    }
                }
            }
            else
            {
                Console.WriteLine("NOT STARTED");
            }
            string[] stringArray = stringList.ToArray();
            return stringArray;
        }/*cy= "300"
<circle cx = "0"
 fill="rgb(191, 191, 255)"></circle>
 cy= "315"*/
        static string[] readCirclesFromFile(string path, string svgFile)
        {
            List<string> stringList = new List<string> { "" };
            if (System.IO.File.Exists(path + svgFile))
            {
                using (StreamReader reader = new StreamReader(path + svgFile))
                {
                    string line;
                    string cy = "";
                    string fill = "";
                    string cx = "";
                    // Read line by line The value for , must be changed to , in the Preferred Language LOV.
                    while ((line = reader.ReadLine()) != null)
                    {
                        var val = line.TrimStart();
                        if (val.Contains("cy"))
                        {
                            cy = val;
                        }
                        else if (val.Contains("cx"))
                        {
                            cx = val + cy;
                        }
                        else if (val.Contains("fill"))
                        {
                            cx = cx + val;
                        }
                        stringList.Add(cx);
                        cx = "";
                    }
                   
                }
            }
            string[] stringArray = stringList.ToArray();
            return stringArray;
        }

        static void writeSVGMappingFile(string[] lines)
        {
            string docPath = @"C:\salesforce\repos\Claude tools\svgMapping.txt";
            if (!System.IO.File.Exists(docPath))
            {
                Console.Write("HERE");
                // Create a file to write to.
                using (StreamWriter sw = System.IO.File.CreateText(docPath))
                {
                    sw.WriteLine("This file contains information about the SVG elements of the d3 js graph");
                }
            }
            using (StreamWriter writer = System.IO.File.AppendText(docPath))
            {
                for (int i = 0; i < lines.Length; i++)
                {
                    writer.WriteLine(lines[i]);
                }
            }
            
        }

        static string[] readLinesFromFiles(string path, string f1,string f2)
        {
          /*
            contents = await readFileSync(join(path, f2), 'utf-8');
            let tickText = contents.split(/\r ?\n /);
            let full: any[] = [];
            for (let i = 0; i < len; i++)
            {
                let t = tick[i]?.toString() ?? "";
                let val = t + tickText[i]?.toString();
                full.push(val);
            }
            return full;*/
            List<string> stringList = new List<string> { "" };
            if (System.IO.File.Exists(path + f1))
            {
                using (StreamReader reader = new StreamReader(path + f1))
                {
                    string line;
                    // Read line by line The value for , must be changed to , in the Preferred Language LOV.
                    while ((line = reader.ReadLine()) != null)
                    {
                        var val = line.TrimStart();
                        stringList.Add(val);
                    }
                }
            }
            List<string> stringList1 = new List<string> { "" };
            if (System.IO.File.Exists(path + f2))
            {
                using (StreamReader reader = new StreamReader(path + f2))
                {
                    string line;
                    // Read line by line The value for , must be changed to , in the Preferred Language LOV.
                    while ((line = reader.ReadLine()) != null)
                    {
                        var val = line.TrimStart();
                        stringList1.Add(val);
                    }
                }
            }
            string[] stringArray = stringList.ToArray();
            string[] stringArray1 = stringList1.ToArray();
            int len = 0;
            int len1 = stringArray1.Length;
            int len2 = stringArray.Length;
            if(len1 >= len2)
            {
                len = len2;
            }else if(len1 < len2)
            {
                len = len1;
            }
            List<string> stringList3 = new List<string> { "" };
            for (int i = 0; i < len; i++)
            {
                string val = stringArray[i];//has "" then **error
                string val1 = stringArray1[i];
                stringList3.Add(val + val1);
            }
            string[] stringArray3 = stringList3.ToArray();
            return stringArray3;
        }

        static bool checkSVGFilesExist()
        {
            string directoryPath = @"C:\salesforce\repos\Claude tools\";
            
            string fileName = directoryPath + "svg.txt";

            bool hasFile = false;
            while (true)
            {
                int milliseconds = 2000;
                Thread.Sleep(milliseconds);
                string[] files = Directory.GetFiles(directoryPath);
                foreach (string file in files)
                {
                    if (file == fileName)
                    {
                        hasFile = true;
                    }
                }
                if (hasFile) {
                    Console.WriteLine("has file");
                    break; }
            }
            string path = "C:/salesforce/repos/Claude tools/";
            string svgFile = "svg.txt";
           
            return hasFile;
        }



        static void CreateEergyInstance()
        {
          const string MW = "MW_";
            const string row = "row.";
            string inputs = "";
            for (int i = 1; i <= 288; i++)
            {
                inputs = inputs + row + MW + i + ",";
            }
            WriteText(inputs, "inputs.txt");
        }

        static void CreateEergyObj()
        {
            const string  MW = "MW_";

            string header = "function(Id,Name,Type";
            const string id = "this.Id = Id;";
            const string name = "this.Name = Name;";
            const string type = "this.Type = Type";


            StringBuilder body = new StringBuilder();
            body.Append(id);
            body.Append(name);
            body.Append(type);

            for (int i = 1;i <= 288;i++) { 
              string nxtMw = MW+i;
              header = header + "," + nxtMw;
              string mwItem = "this." + nxtMw + " = " + nxtMw + ";";
              body.Append(mwItem);
            }

            string func = header + "\n" + body.ToString();
            WriteText(func, "func.txt");
        }

        static void GetMW()
        {
            string fileName = @"C:\salesforce\MWN0__c.txt";
            StringBuilder sb = new StringBuilder();           
            try
            {
                // Create a StreamReader
                using (StreamReader reader = new StreamReader(fileName))
                {
                    string line;
                while ((line = reader.ReadLine()) != null)
                    {//MW_1: edge.node.MW_1__c.value
                        sb.Append(line + ": edge.node." + line + "__c.value,");
                        WriteText(sb.ToString(), "MWQLWired.txt");
                        sb.Clear();

                    }
                }
            }
             catch (Exception exp)
            {
                Console.WriteLine(exp.Message);
            }

        }

        static void WriteText(string output, string title)
        {
            // Set a variable to the Documents path.
            string docPath = @"C:\salesforce\";

            // Write the string array to a new file named "WriteLines.txt".
            using (StreamWriter outputFile = new StreamWriter(Path.Combine(docPath, title), true))
            {
                outputFile.WriteLine(output);
            }

        }

        static void GetLatLon()
        {
            string fileName = @"C:\salesforce\Lat0 to end 180E.txt";
            StringBuilder sb = new StringBuilder();
            int externalId = 68;
            Double[] latlon = new Double[3];
            Double elevation;
            try
            {
                // Create a StreamReader
                using (StreamReader reader = new StreamReader(fileName))
                {
                    string xLine = "";
                    string line;
                    bool nextLat = false;
                    // Read line by line The value for , must be changed to , in the Preferred Language LOV.

                    while ((line = reader.ReadLine()) != null)
                    {
                        var val = line.TrimStart();
                        if (nextLat && !val.Contains("ele"))
                        {
                            sb.Clear();
                            latlon[2] = 0;
                            sb.Append(latlon[0] + "," + latlon[1] + "," + latlon[2]);
                            WriteCSV(sb.ToString());
                            nextLat = false;
                        }
                        if (val.Contains("lat"))
                        {
                            latlon = readCharsForLatLon(line);
                            nextLat = true;
                        }
                        else if (val.Contains("ele"))
                        {
                            sb.Clear();
                            elevation = GetElevation(line);
                            latlon[2] = elevation;
                            sb.Append(latlon[0] + "," + latlon[1] + "," + latlon[2]);
                            WriteCSV(sb.ToString());
                            nextLat = false;
                        }


                    }


                }
            }
            catch (Exception exp)
            {
                Console.WriteLine(exp.Message);
            }

        }

        static Double[] readCharsForLatLon(string line)
        {
            var coords = new double[3];
            StringBuilder sb = new StringBuilder();
            string strLat = "";
            string strLon = "";
            double lat = 0;
            double lon = 0;
            char[] array = line.ToCharArray();
            bool haveLat = false;
            for (int i = 0; i < array.Length; i++)
            {
                if (!haveLat && ((array[i] <= '9' && array[i] >= '0') || array[i] == '-'|| array[i] == '.'))
                {
                    sb.Append(array[i]);
                }
                if (array[i] == 'l' && array[i+1] == 'o')
                {
                    haveLat = true;
                    strLat = sb.ToString();
                    sb.Clear();
                }
                if (haveLat && (array[i] <= '9' && array[i] >= '0' || array[i] == '-' || array[i] == '.'))
                {
                    sb.Append(array[i]);
                }
            }
            strLon = sb.ToString();
            lat = Double.Parse(strLat);
            lon = Double.Parse(strLon);
            coords[0] = lat;
            coords[1] = lon;
            coords[2] = 0;
            return coords;

        }

        static Double GetElevation(string line)
        {
            Double elevation = 0;
            StringBuilder sb = new StringBuilder();
            char[] array = line.ToCharArray();
            for (int i = 0; i < array.Length; i++)
            {
                if ((array[i] <= '9' && array[i] >= '0') || array[i] == '-' || array[i] == '.')
                {
                    sb.Append(array[i]);
                }
            }
            elevation = Double.Parse(sb.ToString());

                return elevation;
        }

        static void GetElevationData()
        {
            var c = new Class1();
            c.GetType_();
            double a = 191;
            double b = 186;
            int x = 0;
            int y = 0;

            List<double> xList = new List<double>();
            List<double> yList = new List<double>();

            for (int i = 0; i < 360; i++)
            {
                double xVal = a * Math.Cos(i);
                double yVal = b * Math.Sin(i);

                xList.Add(xVal);
                yList.Add(yVal);

            }
            CreateElevationDataInput();
        }

        static void CreateElevationDataInput()
        {
            string fileName = @"C:\salesforce\repos\elevationdata.txt";
            StringBuilder sb = new StringBuilder();

            try
            {
                // Create a StreamReader
                using (StreamReader reader = new StreamReader(fileName))
                {
                    string xLine = "";
                    string line;
                    int id = 1;
                    // Read line by line The value for , must be changed to , in the Preferred Language LOV.

                    while ((line = reader.ReadLine()) != null)
                    {
                        var val = line.TrimStart();
                        if (val.Contains("elevation"))
                        {
                            xLine = val + ",";
                        } else if (val.Contains("lng"))
                        {
                            xLine = xLine + val;
                            xLine = "ExternalId " + id + "," + xLine;
                            sb.AppendLine(xLine);
                            xLine = "";
                            id++;
                        }
                        

                    }
                    WriteCSV(sb.ToString());

                }
            }
            catch (Exception exp)
            {
                Console.WriteLine(exp.Message);
            }
        }

        static void CreateCSVInput()
        {
            string fileName = @"C:\salesforce\newxyCoords.txt";
            StringBuilder sb = new StringBuilder();

            try
            {
                // Create a StreamReader
                using (StreamReader reader = new StreamReader(fileName))
                {
                    string xLine = "";
                    string line;
                    // Read line by line The value for , must be changed to , in the Preferred Language LOV.

                    while ((line = reader.ReadLine()) != null)
                    {
                        var val = line.TrimStart();
                        if (val.Contains("x"))
                        {
                            xLine = val + ",";
                        }
                        else
                        {
                            xLine = xLine + val;
                            sb.AppendLine(xLine);
                            xLine = "";
                        }

                    }
                    WriteCSV(sb.ToString());

                }
            }
            catch (Exception exp)
            {
                Console.WriteLine(exp.Message);
            }
        }
        static void WriteCSV(string output)
        {
            // Set a variable to the Documents path.
            string docPath = @"C:\salesforce\repos";
           
            // Write the string array to a new file named "WriteLines.txt".
            using (StreamWriter outputFile = new StreamWriter(Path.Combine(docPath, "elevationGPXDataTo180E.csv"), true))
            {
                    outputFile.WriteLine(output);
            }
           
        }
    }
}
