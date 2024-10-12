"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Browser = exports.SVGElements = void 0;
require("chromedriver");
var selenium_webdriver_1 = require("selenium-webdriver");
var selenium_webdriver_2 = require("selenium-webdriver");
var fs_1 = require("fs");
var llamaindex_1 = require("llamaindex");
var global_1 = require("@llamaindex/core/global");
var chromadb_1 = require("chromadb");
var rect = /** @class */ (function () {
    function rect() {
        this.x = 0;
        this.y = 0;
        this.height = 0;
        this.width = 0;
    }
    rect.prototype.toString = function () {
        var str = "x: " + this.x.toString() + "," + "y: " + this.y.toString() + "," + "width: " + this.width.toString() + "," + "height: " + this.height.toString();
        return str;
    };
    return rect;
}());
var rects = /** @class */ (function () {
    function rects() {
        this.values = [];
    }
    return rects;
}());
var path = /** @class */ (function () {
    function path() {
        this.moveFrom = "";
        this.moveTo = "";
        this.val = "";
    }
    return path;
}());
var paths = /** @class */ (function () {
    function paths() {
        this.values = [];
    }
    return paths;
}());
var tickLine = /** @class */ (function () {
    function tickLine() {
        this.x2 = 0;
        this.y2 = 0;
        this.isX2 = false;
    }
    tickLine.prototype.toString = function () {
        var str = "";
        if (this.isX2) {
            str = "x2: " + this.x2.toString();
        }
        else {
            str = "y2: " + this.y2.toString();
        }
        return str;
    };
    return tickLine;
}());
var tickText = /** @class */ (function () {
    function tickText() {
        this.x2_text = "";
        this.y2_text = "";
        this.x2 = "";
        this.y2 = "";
        this.isX2 = false;
    }
    tickText.prototype.toString = function () {
        var str = "";
        if (this.isX2) {
            str = "x2: " + this.x2 + ",text:" + this.x2_text;
        }
        else {
            str = "y2: " + this.y2 + ",text:" + this.y2_text;
        }
        return str;
    };
    return tickText;
}());
var tick = /** @class */ (function () {
    function tick() {
        this.line = new tickLine();
        this.text = new tickText();
    }
    return tick;
}());
var ticks = /** @class */ (function () {
    function ticks() {
        this.values = [];
    }
    return ticks;
}());
var svg = /** @class */ (function () {
    function svg() {
        this.height = "";
        this.width = "";
    }
    svg.prototype.toString = function () {
        var str = "height: " + this.height + ",width: " + this.width;
        return str;
    };
    return svg;
}());
var SVGElements = /** @class */ (function () {
    function SVGElements() {
        this.error = "";
        this.rects = new rects();
        this.paths = new paths();
        this.ticks = new ticks();
    }
    return SVGElements;
}());
exports.SVGElements = SVGElements;
var Browser = /** @class */ (function () {
    function Browser() {
        this.els = new SVGElements();
        this.kvstore = new llamaindex_1.SimpleKVStore();
        this.nodeCollection = global_1.DEFAULT_NAMESPACE;
        this.client = new chromadb_1.ChromaClient();
        this.driver = new selenium_webdriver_2.Builder().forBrowser('chrome').build();
    }
    Browser.prototype.setOptions = function () {
        var options = new selenium_webdriver_1.Options(this.driver);
    };
    Browser.prototype.get = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.driver.get(url)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.navigate = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.driver.navigate().to(url)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.setChromadb = function () {
        return __awaiter(this, void 0, void 0, function () {
            var collection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getOrCreateCollection({
                            name: "SVGCollection",
                        })];
                    case 1:
                        collection = _a.sent();
                        return [2 /*return*/, collection];
                }
            });
        });
    };
    Browser.prototype.findElement = function (el) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.driver.findElements(selenium_webdriver_2.By.xpath(el))];
                    case 1:
                        promise = _a.sent();
                        return [2 /*return*/, promise];
                }
            });
        });
    };
    Browser.prototype.findElements = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tempText, tempLine, rects_, paths_, ticks_, tick_1, globalTransform, first, second, promiseRect, i_1, promisePath, promiseLine, promiseLineTxt, svg_elements;
            var _this = this;
            return __generator(this, function (_a) {
                tempText = [];
                tempLine = [];
                rects_ = new rects();
                paths_ = new paths();
                ticks_ = new ticks();
                try {
                    tick_1 = this.driver.findElements(selenium_webdriver_2.By.xpath("//*[name()='g' and @class='tick']"));
                    tick_1.then(function (value) {
                        var i = 0;
                        for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                            var v = value_1[_i];
                            v.getAttribute("transform").then(function (v1) {
                                //  console.log(i, v1);
                                _this.setTransformData(i, v1);
                                i++;
                            });
                        }
                    });
                    globalTransform = this.driver.findElements(selenium_webdriver_2.By.xpath("//*[name()='g' and not(@class)]"));
                    globalTransform.then(function (value) {
                        var i = 0;
                        for (var _i = 0, value_2 = value; _i < value_2.length; _i++) {
                            var v = value_2[_i];
                            v.getAttribute("transform").then(function (v1) {
                                if (v1) {
                                    _this.setGlobalTranslateData(i, v1);
                                    i++;
                                }
                            });
                        }
                    });
                    first = this.driver.findElements(selenium_webdriver_2.By.xpath("//*[name()='svg']"));
                    first.then(function (value) {
                        var i = 0;
                        for (var _i = 0, value_3 = value; _i < value_3.length; _i++) {
                            var v = value_3[_i];
                            v.getAttribute("height").then(function (h) {
                                _this.setSVGData(0, "height: " + h);
                            });
                        }
                    });
                    second = this.driver.findElements(selenium_webdriver_2.By.xpath("//*[name()='svg']"));
                    second.then(function (value) {
                        for (var _i = 0, value_4 = value; _i < value_4.length; _i++) {
                            var v = value_4[_i];
                            v.getAttribute("width").then(function (w) {
                                _this.setSVGData(1, "width: " + w);
                            });
                        }
                    });
                    promiseRect = this.findElement("//*[name()='rect']");
                    i_1 = 2;
                    promiseRect.then(function (value) {
                        var _loop_1 = function () {
                            var r = new rect();
                            v.getRect().then(function (val) {
                                r.x = val.x;
                                r.y = val.y;
                                r.width = val.width;
                                r.height = val.height;
                                //this.log(r.toString());
                                _this.setRectData(i_1, r.toString());
                                i_1++;
                            });
                        };
                        for (var _i = 0, value_5 = value; _i < value_5.length; _i++) {
                            var v = value_5[_i];
                            _loop_1();
                        }
                    });
                    promisePath = this.findElement("//*[name()='path']");
                    promisePath.then(function (value) {
                        var i = 0;
                        var _loop_2 = function () {
                            var p = new path();
                            v.getAttribute("d").then(function (val) {
                                console.log("d", val);
                                p.val = val;
                                i++;
                                _this.setPathData(i, p);
                            });
                        };
                        for (var _i = 0, value_6 = value; _i < value_6.length; _i++) {
                            var v = value_6[_i];
                            _loop_2();
                        }
                    });
                    promiseLine = this.findElement("//*[name()='line']");
                    promiseLine.then(function (value) {
                        var i = 0;
                        var j = 0;
                        var _loop_3 = function () {
                            var ln = new tickLine();
                            v.getAttribute("y2").then(function (val) {
                                if (val) {
                                    ln.y2 = +val;
                                    ln.isX2 = false;
                                    console.log("ln y2", ln.y2);
                                    _this.setLineData(i++, ln.toString(), ln.isX2);
                                }
                            });
                            v.getAttribute("x2").then(function (val) {
                                if (val) {
                                    ln.x2 = +val;
                                    ln.isX2 = true;
                                    console.log("ln x2", ln.x2);
                                    _this.setLineData(j++, ln.toString(), ln.isX2);
                                }
                            });
                        };
                        for (var _i = 0, value_7 = value; _i < value_7.length; _i++) {
                            var v = value_7[_i];
                            _loop_3();
                        }
                    });
                    promiseLineTxt = this.findElement(("//*[name()='text']"));
                    promiseLineTxt.then(function (value) {
                        var i = 0;
                        var j = 0;
                        var _loop_4 = function () {
                            var v_ = "";
                            v.getText().then(function (val) {
                                v_ = val;
                            });
                            var txt = new tickText();
                            v.getAttribute("x").then(function (val) {
                                if (val) {
                                    txt.x2_text = v_;
                                    txt.x2 = val;
                                    txt.isX2 = true;
                                    /* console.log(i++);
                                     console.log("textx2", txt.x2);
                                     console.log("txt.x2_text", txt.x2_text)
                                     console.log("txt.toString()1", txt.toString())*/
                                    _this.setLineTextData(i++, txt.toString(), txt.isX2);
                                }
                            });
                            v.getAttribute("y").then(function (val) {
                                if (val) {
                                    txt.y2_text = v_;
                                    txt.y2 = val;
                                    txt.isX2 = false;
                                    _this.setLineTextData(j++, txt.toString(), txt.isX2);
                                    /* console.log(j++);
                                     console.log("txt.toString()2", txt.toString())
                                     console.log("texty2", txt.y2);*/
                                    console.log("txt.y2_text", txt.y2_text);
                                }
                            });
                        };
                        for (var _i = 0, value_8 = value; _i < value_8.length; _i++) {
                            var v = value_8[_i];
                            _loop_4();
                        }
                    });
                }
                catch (Exception) {
                    svg_elements = "<svg>No svg elements were found, indicating a syntax error<svg>";
                }
                return [2 /*return*/];
            });
        });
    };
    Browser.prototype.setSVGData = function (counter, value) {
        return __awaiter(this, void 0, void 0, function () {
            var collection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getOrCreateCollection({
                            name: "SVGCollection",
                        })];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, collection.add({
                                documents: [
                                    value,
                                ],
                                ids: ["svg" + counter],
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.setGlobalTranslateData = function (counter, value) {
        return __awaiter(this, void 0, void 0, function () {
            var collection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getOrCreateCollection({
                            name: "SVGCollection",
                        })];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, collection.add({
                                documents: [
                                    value,
                                ],
                                ids: ["translate" + counter],
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.setRectData = function (counter, value) {
        return __awaiter(this, void 0, void 0, function () {
            var collection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("rect...", value);
                        return [4 /*yield*/, this.client.getOrCreateCollection({
                                name: "SVGCollection",
                            })];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, collection.add({
                                documents: [
                                    value,
                                ],
                                ids: ["rect" + counter],
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.setPathData = function (counter, value) {
        return __awaiter(this, void 0, void 0, function () {
            var collection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getOrCreateCollection({
                            name: "SVGCollection",
                        })];
                    case 1:
                        collection = _a.sent();
                        //let p = "<path>" + "<moveFrom>" + value.moveFrom + "</moveFrom>" + "<moveTo>" + value.moveTo + "</moveTo>" + "</path>"
                        return [4 /*yield*/, collection.add({
                                documents: [
                                    value.val,
                                ],
                                ids: ["path" + counter],
                            })];
                    case 2:
                        //let p = "<path>" + "<moveFrom>" + value.moveFrom + "</moveFrom>" + "<moveTo>" + value.moveTo + "</moveTo>" + "</path>"
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.setLineData = function (counter, value, isX2) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, ln;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getOrCreateCollection({
                            name: "SVGCollection",
                        })];
                    case 1:
                        collection = _a.sent();
                        ln = "line";
                        if (isX2) {
                            ln += "x2";
                        }
                        else {
                            ln += "y2";
                        }
                        return [4 /*yield*/, collection.add({
                                documents: [
                                    value,
                                ],
                                ids: [ln + counter],
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.setLineTextData = function (counter, value, isX2) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, ln;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getOrCreateCollection({
                            name: "SVGCollection",
                        })];
                    case 1:
                        collection = _a.sent();
                        ln = "line_txt";
                        if (isX2) {
                            ln += "x2";
                        }
                        else {
                            ln += "y2";
                        }
                        return [4 /*yield*/, collection.add({
                                documents: [
                                    value,
                                ],
                                ids: [ln + counter],
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.setTransformData = function (counter, value) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, trans;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getOrCreateCollection({
                            name: "SVGCollection",
                        })];
                    case 1:
                        collection = _a.sent();
                        trans = "transform";
                        return [4 /*yield*/, collection.add({
                                documents: [
                                    value,
                                ],
                                ids: [trans + counter],
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.getChromaData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var collection, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getOrCreateCollection({
                            name: "SVGCollection",
                        })];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, collection];
                    case 2: return [4 /*yield*/, (_a.sent()).query({
                            queryTexts: "This is a query for selecting rects", // Chroma will embed this for you
                            nResults: 1, // how many results to return
                        })];
                    case 3:
                        results = _a.sent();
                        console.log("results", results);
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.log = function (val) {
        var path = 'C:/salesforce/repos/file.txt';
        var filename = "file.txt";
        (0, fs_1.writeFileSync)(path, val + "\n", {
            flag: 'a',
        });
        //const f = new fs.WriteStream(path);
        //const file = f.createWriteStream(path);
        // f.write(val);
        //f.write(this.els);
    };
    Browser.prototype.clearCookies = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var currentUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!url) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.driver.getCurrentUrl()];
                    case 1:
                        currentUrl = _a.sent();
                        return [4 /*yield*/, this.navigate(url)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.driver.manage().deleteAllCookies()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.navigate(currentUrl)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.driver.manage().deleteAllCookies()];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.wait = function (condition) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.waitAny(condition)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.waitAny = function (conditions) {
        return __awaiter(this, void 0, void 0, function () {
            var all;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        all = (!(conditions instanceof Array)) ? [conditions] : conditions;
                        return [4 /*yield*/, this.driver.wait(function () { return __awaiter(_this, void 0, void 0, function () {
                                var _i, all_1, condition, ex_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _i = 0, all_1 = all;
                                            _a.label = 1;
                                        case 1:
                                            if (!(_i < all_1.length)) return [3 /*break*/, 6];
                                            condition = all_1[_i];
                                            _a.label = 2;
                                        case 2:
                                            _a.trys.push([2, 4, , 5]);
                                            return [4 /*yield*/, condition(this)];
                                        case 3:
                                            if ((_a.sent()) === true) {
                                                return [2 /*return*/, true];
                                            }
                                            return [3 /*break*/, 5];
                                        case 4:
                                            ex_1 = _a.sent();
                                            return [3 /*break*/, 5];
                                        case 5:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Browser.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.driver.quit()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Browser;
}());
exports.Browser = Browser;
