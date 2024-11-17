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

namespace HealthDeptLOV
{
    class Program
    {

        static void Main(string[] args)
        {
            /*  Class1 c = new Class1();
              c.TestSelectMany();*/
            // CreateEergyInstance();


            delSVGMappingFile();
            createSVGMappingFile();
            delSVGFiles();
        }
        static void createSVGMappingFile()
        {
            string path = @"C:\salesforce\repos\Claude tools\";
            StringBuilder sb = new StringBuilder();
            string svgFile = "svg.txt";
            string xfile = "tickX.txt";
            string txtTickX = "tick_text_x.txt";
            string txtTickY = "tick_text_y.txt";
            string yfile = "tickY.txt";
            string rectFile = "rect.txt";
            string pathFile = "path.txt";
            string linePathFile = "linePath.txt";
            string linePathFill = "linePathFill.txt";
            string allTextFile = "allText.txt";
            string allXPosFile = "allXPos.txt";
            string allYPosFile = "allYPos.txt";
            string errorFile = "errors.txt";
            string delimiter = "```";
            string svgHeading = @"
The mappings of SVG elements are mapped to the four categories below\n
";

            string viewBox = @"
#1. SVG viewBox:
This maps to the height and width of a SVG viewing area.
 Look at the specific values below when questioned about the `view_box`:\n
";
string path_1 = @"
#2. SVG path:
There are two mappings for the path element:
2.1.The `<path>` element of svg  with class 'domain' maps the x-y axes of a graph.
The paths will be in a grouping element `<g...></g>`. The 'd' attributes are mapped as:\n
";

string path_2 = @"
2.2. The `<path>` element of svg with class `line` maps the lines for a line chart. \n
";

            string svgPathText_1 = @"
#3. SVG text for axes:
The text of interest is for the x-y axes labelling.
3.1 The text on the x-axis with `tick` lines descending from the x-axis:\n
";

            string svgPathText_2 = @"
3.2 The text on the y-axis with `tick` lines horizontally aligned on the y-axis:\n
";
            string rect = @"
#4. SVG rect.
In this case the rects form a legend at the bottom of the graph.They have text and color values:\n
";

            string error = @"
#5. Errors.";

            if (checkSVGFilesExist())
            {
                string[] svgData = readLinesFromFile(path, svgFile);
                List<string> stringList = new List<string> { svgHeading };
                stringList.Add(viewBox);
                stringList.Add(delimiter);
                for (int i = 0; i < svgData.Length; i++)
                {
                    stringList.Add(svgData[i]);
                }
                stringList.Add(delimiter);
                writeSVGMappingFile(stringList.ToArray());
                //SVG Path
                stringList.Clear();
                string[] pathData = readLinesFromFile(path, pathFile);
                stringList.Add(path_1);
                stringList.Add(delimiter);
                for (int i = 0; i < pathData.Length; i++)
                {
                    stringList.Add(pathData[i]);
                }
                stringList.Add(delimiter);
                //SVG Line Paths
                stringList.Clear();
                string[] pathDataLines = readLinesFromFiles(path, linePathFile, linePathFill);
                stringList.Add(path_2);
                stringList.Add(delimiter);
                for (int i = 0; i < pathDataLines.Length; i++)
                {
                    stringList.Add(pathDataLines[i]);
                }
                stringList.Add(delimiter);
                writeSVGMappingFile(stringList.ToArray());
                //SVG tick x
                stringList.Clear();
                stringList.Add(svgPathText_1);
                string[] tickXData = readLinesFromFiles(path, xfile, txtTickX);
                stringList.Add(delimiter);
                for (int i = 0; i < tickXData.Length; i++)
                {
                    stringList.Add(tickXData[i]);
                }
                stringList.Add(delimiter);
                writeSVGMappingFile(stringList.ToArray());
                //SVG tick x
                stringList.Clear();
                stringList.Add(svgPathText_2);
                string[] tickYData = readLinesFromFiles(path, yfile, txtTickY);
                stringList.Add(delimiter);
                for (int i = 0; i < tickYData.Length; i++)
                {
                    stringList.Add(tickYData[i]);
                }
                stringList.Add(delimiter);
                writeSVGMappingFile(stringList.ToArray());
                //SVG rects
                stringList.Clear();
                stringList.Add(rect);
                string[] rectData = readLinesFromFile(path, rectFile);
                stringList.Add(delimiter);
                for (int i = 0; i < rectData.Length; i++)
                {
                    stringList.Add(rectData[i]);
                }
                stringList.Add(delimiter);
                writeSVGMappingFile(stringList.ToArray());
                //Errors
                stringList.Clear();
                stringList.Add(error);
                string[] errorData = readLinesFromFile(path, errorFile);
                if(errorData.Length > 0)
                {
                    stringList.Add(delimiter);
                    for (int i = 0; i < errorData.Length; i++)
                    {
                        stringList.Add(errorData[i]);
                    }
                    stringList.Add(delimiter);
                    writeSVGMappingFile(stringList.ToArray());
                }
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

        static void delSVGFiles()
        {
            try
            {
                string path = "C:/salesforce/repos/Claude tools/";
                string svgFile = "svg.txt";
                string xfile = "tickX.txt";
                string yfile = "tickY.txt";
                string rectFile = "rect.txt";
                string pathFile = "path.txt";
                string linePathFile = "linePath.txt";
                string allTextFile = "allText.txt";
                string allXPosFile = "allXPos.txt";
                string allYPosFile = "allYPos.txt";
                string txtTickXFile = "tick_text_x.txt";
                string txtTickYFile = "tick_text_y.txt";
                string linePathFillFile = "linePathFill.txt";
                string errorFile = "errors.txt";
                Console.WriteLine("Here DEL......");
                if (System.IO.File.Exists(path + svgFile))
                {
                    System.IO.File.Delete(path + svgFile);
                    Console.WriteLine("Here DEL......SVG...");
                }
                if (System.IO.File.Exists(path + txtTickXFile))
                {
                    System.IO.File.Delete(path + txtTickXFile);
                }
                if (System.IO.File.Exists(path + txtTickYFile))
                {
                    System.IO.File.Delete(path + txtTickYFile);
                }
                if (System.IO.File.Exists(path + linePathFillFile))
                {
                    System.IO.File.Delete(path + linePathFillFile);
                }
                if (System.IO.File.Exists(path + xfile))
                {
                    System.IO.File.Delete(path + xfile);
                }
                if (System.IO.File.Exists(path + yfile))
                {
                    System.IO.File.Delete(path + yfile);
                }
                if (System.IO.File.Exists(path + rectFile))
                {
                    System.IO.File.Delete(path + rectFile);
                }
                if (System.IO.File.Exists(path + pathFile))
                {
                    System.IO.File.Delete(path + pathFile);
                }
                if (System.IO.File.Exists(path + linePathFile))
                {
                    System.IO.File.Delete(path + linePathFile);
                }
                if (System.IO.File.Exists(path + allTextFile))
                {
                    System.IO.File.Delete(path + allTextFile);
                }
                if (System.IO.File.Exists(path + allXPosFile))
                {
                    System.IO.File.Delete(path + allXPosFile);
                }
                if (System.IO.File.Exists(path + allYPosFile))
                {
                    System.IO.File.Delete(path + allYPosFile);
                }
                if (System.IO.File.Exists(path + errorFile))
                {
                    System.IO.File.Delete(path + errorFile);
                }
            }
            catch (Exception exp)
            {
                Console.WriteLine(exp.Message);
                
            }
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
            string[] stringArray = stringList.ToArray();
            return stringArray;
        }

        static void writeSVGMappingFile(string[] lines)
        {
            // Set a variable to the Documents path.
            string docPath = @"C:\salesforce\repos\Claude tools\svgMapping.txt";
            if (!System.IO.File.Exists(docPath))
            {
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
