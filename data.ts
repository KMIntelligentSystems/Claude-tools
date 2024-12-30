export const svgHeading = `
The mappings of SVG elements are mapped to the four categories below\n
`;

export const viewBox = `
#1. SVG viewBox:
This maps to the height and width of a SVG viewing area.
 Look at the specific values below when questioned about the "view_box":\n
`
export const path_1 = `
#2. SVG path:
There are two mappings for the path element:
2.1. The "<path>" element of svg  with class "domain" maps the x-y axes of a graph. 
The paths will be in a grouping element "<g...></g>". The "d" attributes are mapped as:\n
`

export const path_2 = `
2.2. The "<path>" element of svg  with class "line" maps the lines for a line chart. \n
`

export const svgPathText_1 = `
#3. SVG text for axes:
The text of interest is for the x-y axes labelling.
3.1 The text on the x-axis with "tick" lines descending from the x-axis:\n
`

export const svgPathText_2 = `
3.2 The text on the y-axis with "tick" lines horizontally aligned on the y-axis:\n
`
export const rect = `
#4. SVG rect.
In this case the rects form a legend at the bottom of the graph. They have text and color values:\n
`
 const dataCSV:string[][] = 
  [['1912,-0.25,-0.14,-0.38,-0.17,-0.21,-0.24,-0.42,-0.54,-0.57,-0.57,-0.39,-0.43'],
  ['1913,-0.4,-0.45,-0.42,-0.39,-0.44,-0.45,-0.36,-0.34,-0.34,-0.32,-0.2,-0.03'],
  ['1914,0.04,-0.1,-0.24,-0.3,-0.21,-0.25,-0.23,-0.16,-0.17,-0.03,-0.16,-0.04'],
  ['1915,-0.21,-0.04,-0.1,0.06,-0.06,-0.22,-0.13,-0.22,-0.2,-0.24,-0.13,-0.21'],
  ['1916,-0.13,-0.15,-0.29,-0.3,-0.35,-0.49,-0.37,-0.28,-0.36,-0.34,-0.46,-0.81'],
  ['1917,-0.57,-0.63,-0.63,-0.55,-0.55,-0.43,-0.25,-0.22,-0.23,-0.44,-0.34,-0.68'],
  ['1918,-0.48,-0.34,-0.25,-0.44,-0.43,-0.36,-0.32,-0.32,-0.17,-0.06,-0.12,-0.3'],
  ['1919,-0.21,-0.23,-0.22,-0.13,-0.28,-0.36,-0.29,-0.33,-0.25,-0.2,-0.42,-0.42']]
export const str0 = `23: 1
30: 1
31: 1
32: 1
35: 2
46: 1
48: 2
52: 2
57: 1
58: 1
60: 1
63: 2
64: 1
69: 2
72: 1
74: 1
75: 2
78: 1
80: 1
87: 6
90: 1
92: 3
93: 2
98: 1
103: 1
104: 1
109: 1
113: 1
114: 2
115: 2
127: 3
132: 1
137: 1
138: 1
149: 2
150: 1
162: 1
173: 1
184: 2
218: 1
265: 1
277: 1
287: 2
288: 1
300: 1
316: 1
345: 2
369: 1
449: 1
460: 2
576: 1
749: 1
9502: 1
`
export const str1 =
'23:1    \n'+
'30:1    \n'+
'31:1    \n'+
'35:2    \n'+
'52:2    \n'+
'58:1    \n'+
'60:1    \n'+
'63:2    \n'+
'64:1    \n'+
'69:2    \n'+
'72:1    \n'+
'74:1    \n'+
'75:2    \n'+
'80:1    \n'+
'87:2    \n'+
'90:1    \n'+
'92:2    \n'+
'98:1    \n'+
'104:1    \n'+
'113:1    \n'+
'114:2    \n'+
'115:2    \n'+
'132:1    \n'+
'137:1    \n'+
'218:1    \n'+
'265:1    \n'+
'277:1    \n'+
'287:2    \n'+
'300:1    \n'+
'369:1  \n'+
'460:1  \n'
export const str2 =
'32:1   \n'+
'46:1  \n'+
'48:2  \n'+
'52:1  \n'+
'57:1  \n'+
'78:1  \n'+
'84:1  \n'+
'87:3  \n'+
'92:2  \n'+
'93:2  \n'+
'103:1  \n'+
'109:1  \n'+
'115:1  \n'+
'127:3  \n'+
'132:1  \n'+
'138:1  \n'+
'149:2  \n'+
'150:1  \n'+
'162:1  \n'+
'173:1  \n'+
'184:2  \n'+
'218:2  \n'+
'288:1  \n'+
'316:1  \n'+
'345:2  \n'+
'404:1  \n'+
'449:1  \n'+
'460:1  \n'+
'576:1  \n'+
'749:1  \n'+
'9502:1  \n'
export const str3 =
'52:2  \n'+
'57:2  \n'+
'58:1  \n'+
'63:1  \n'+
'66:2  \n'+
'69:1  \n'+
'74:1  \n'+
'80:2  \n'+
'85:1  \n'+
'87:2  \n'+
'91:2  \n'+
'92:1  \n'+
'104:1  \n'+
'114:1  \n'+
'115:3  \n'+
'125:1  \n'+
'127:1  \n'+
'129:1  \n'+
'136:1  \n'+
'138:1  \n'+
'156:1  \n'+
'161:1  \n'+
'171:1  \n'+
'196:1  \n'+
'201:1  \n'+
'207:1  \n'+
'230:1  \n'+
'231:1  \n'+
'287:1  \n'+
'333:1  \n'+
'379:1  \n'+
'404:1  \n'+
'691:1  \n'+
'822:1  \n'
export const str4 =
'29:1  \n'+
'34:1  \n'+
'35:1  \n'+
'38:1  \n'+
'49:1  \n'+
'56:1  \n'+
'57:1  \n'+
'58:2  \n'+
'65:1  \n'+
'69:5  \n'+
'87:4  \n'+
'92:2  \n'+
'102:1  \n'+
'104:2  \n'+
'105:1  \n'+
'115:1  \n'+
'149:1  \n'+
'153:1  \n'+
'156:1  \n'+
'162:2  \n'+
'165:1  \n'+
'167:1  \n'+
'172:1  \n'+
'184:1  \n'+
'196:1  \n'+
'230:1  \n'+
'322:1  \n'+
'345:1  \n'+
'633:1  \n'+
'800:1  \n'+
'806:1  \n'+
'1036:1  \n'
export const str5=
'29:1  \n'+
'45:1  \n'+
'50:1  \n'+
'56:1  \n'+
'57:3  \n'+
'58:5  \n'+
'61:1  \n'+
'69:4  \n'+
'79:1  \n'+
'80:1  \n'+
'87:1  \n'+
'92:4  \n'+
'103:1  \n'+
'109:1  \n'+
'114:1  \n'+
'115:2  \n'+
'138:1  \n'+
'149:1  \n'+
'173:2  \n'+
'196:1  \n'+
'207:1  \n'+
'218:1  \n'+
'230:1  \n'+
'253:2  \n'+
'287:1  \n'+
'391:1  \n'+
'438:1  \n'+
'724:1  \n'
