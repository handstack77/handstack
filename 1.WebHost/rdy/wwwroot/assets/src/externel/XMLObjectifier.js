/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var XMLObjectifier = (function ()
{
    var _clone = function (obj)
    {
        if (!!obj && typeof (obj) === "object")
        {
            function F() { }
            F.prototype = obj;
            return new F();
        }
    };
    //Is Numeric check
    var isNumeric = function (s)
    {
        var testStr = "";
        if (!!s && typeof (s) === "string") { testStr = s; }
        var pattern = /^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/;
        return pattern.test(testStr);
    };
    var _self = {
        xmlToJSON: function (xdoc)
        {
            try
            {
                if (!xdoc) { return null; }
                var tmpObj = {};
                tmpObj.typeOf = "JSXBObject";
                var xroot = (xdoc.nodeType == 9) ? xdoc.documentElement : xdoc;
                tmpObj.RootName = xroot.nodeName || "";
                if (xdoc.nodeType == 3 || xdoc.nodeType == 4)
                {
                    return xdoc.nodeValue;
                }
                //Trim function
                function trim(s)
                {
                    return s.replace(/^\s+|\s+$/gm, '');
                }
                //Alters attribute and collection names to comply with JS
                function formatName(name)
                {
                    var regEx = /-/g;
                    var tName = String(name).replace(regEx, "_");
                    return tName;
                }
                //Set Attributes of an object
                function setAttributes(obj, node)
                {
                    if (node.attributes.length > 0)
                    {
                        var a = node.attributes.length - 1;
                        var attName;
                        obj._attributes = [];
                        do
                        { //Order is irrelevant (speed-up)
                            attName = String(formatName(node.attributes[a].name));
                            obj._attributes.push(attName);
                            obj[attName] = trim(node.attributes[a].value);
                        } while (a--);
                    }
                }

                //Node Prototype
                var _node = (function ()
                {
                    var _self = {
                        activate: function ()
                        {
                            var nodes = [];
                            if (!!nodes)
                            {
                                nodes.getNodesByAttribute = function (attr, obj)
                                {
                                    if (!!nodes && nodes.length > 0)
                                    {
                                        var out = [];
                                        var cNode;
                                        var maxLen = nodes.length - 1;
                                        try
                                        {
                                            do
                                            {
                                                cNode = nodes[maxLen];
                                                if (cNode[attr] === obj)
                                                {
                                                    out.push(cNode);
                                                }
                                            } while (maxLen--);
                                            out.reverse();
                                            return out;
                                        } catch (e) { return null; }
                                        return null;
                                    }
                                };
                                nodes.getNodeByAttribute = function (attr, obj)
                                {
                                    if (!!nodes && nodes.length > 0)
                                    {
                                        var cNode;
                                        var maxLen = nodes.length - 1;
                                        try
                                        {
                                            do
                                            {
                                                cNode = nodes[maxLen];
                                                if (cNode[attr] === obj)
                                                {
                                                    return cNode;
                                                }
                                            } while (maxLen--);
                                        } catch (e) { return null; }
                                        return null;
                                    }
                                };
                                nodes.getNodesByValue = function (obj)
                                {
                                    if (!!nodes && nodes.length > 0)
                                    {
                                        var out = [];
                                        var cNode;
                                        var maxLen = nodes.length - 1;
                                        try
                                        {
                                            do
                                            {
                                                cNode = nodes[maxLen];
                                                if (!!cNode.Text && cNode.Text === obj)
                                                {
                                                    out.push(cNode);
                                                }
                                            } while (maxLen--);
                                            return out;
                                        } catch (e) { return null; }
                                        return null;
                                    }
                                };
                                nodes.contains = function (attr, obj)
                                {
                                    if (!!nodes && nodes.length > 0)
                                    {
                                        var maxLen = nodes.length - 1;
                                        try
                                        {
                                            do
                                            {
                                                if (nodes[maxLen][attr] === obj)
                                                {
                                                    return true;
                                                }
                                            } while (maxLen--);
                                        } catch (e) { return false; }
                                        return false;
                                    }
                                };
                                nodes.indexOf = function (attr, obj)
                                {
                                    var pos = -1;
                                    if (!!nodes && nodes.length > 0)
                                    {
                                        var maxLen = nodes.length - 1;
                                        try
                                        {
                                            do
                                            {
                                                if (nodes[maxLen][attr] === obj)
                                                {
                                                    pos = maxLen;
                                                }
                                            } while (maxLen--);
                                        } catch (e) { return -1; }
                                        return pos;
                                    }
                                };
                                nodes.SortByAttribute = function (col, dir)
                                {
                                    if (!!nodes && nodes.length > 0)
                                    {
                                        function getValue(pair, idx)
                                        {
                                            var out = pair[idx];
                                            out = (bam.validation.isNumeric(out)) ? parseFloat(out) : out;
                                            return out;
                                        }
                                        function sortFn(a, b)
                                        {
                                            var tA, tB;
                                            tA = getValue(a, col);
                                            tB = getValue(b, col);
                                            var res = (tA < tB) ? -1 : (tB < tA) ? 1 : 0;
                                            if (!!dir)
                                            {
                                                res = (dir.toUpperCase() === "DESC") ? (0 - res) : res;
                                            }
                                            return res;
                                        }
                                        nodes.sort(sortFn);
                                    }
                                };
                                nodes.SortByValue = function (dir)
                                {
                                    if (!!nodes && nodes.length > 0)
                                    {
                                        function getValue(pair)
                                        {
                                            var out = pair.Text;
                                            out = (bam.validation.isNumeric(out)) ? parseFloat(out) : out;
                                            return out;
                                        }
                                        function sortFn(a, b)
                                        {
                                            var tA, tB;
                                            tA = getValue(a);
                                            tB = getValue(b);
                                            var res = (tA < tB) ? -1 : (tB < tA) ? 1 : 0;
                                            if (!!dir)
                                            {
                                                res = (dir.toUpperCase() === "DESC") ? (0 - res) : res;
                                            }
                                            return res;
                                        }
                                        nodes.sort(sortFn);
                                    }
                                };
                                nodes.SortByNode = function (node, dir)
                                {
                                    if (!!nodes && nodes.length > 0)
                                    {
                                        function getValue(pair, node)
                                        {
                                            var out = pair[node][0].Text;
                                            out = (bam.validation.isNumeric(out)) ? parseFloat(out) : out;
                                            return out;
                                        }
                                        function sortFn(a, b)
                                        {
                                            var tA, tB;
                                            tA = getValue(a, node);
                                            tB = getValue(b, node);
                                            var res = (tA < tB) ? -1 : (tB < tA) ? 1 : 0;
                                            if (!!dir)
                                            {
                                                res = (dir.toUpperCase() === "DESC") ? (0 - res) : res;
                                            }
                                            return res;
                                        }
                                        nodes.sort(sortFn);
                                    }
                                };
                            }
                            return nodes;
                        }
                    };
                    return _self;
                })();
                //Makes a new node of type _node;
                var makeNode = function ()
                {
                    var _fn = _clone(_node);
                    return _fn.activate();
                }
                //Set collections
                function setHelpers(grpObj)
                {
                    //Selects a node withing array where attribute = value
                    grpObj.getNodeByAttribute = function (attr, obj)
                    {
                        if (this.length > 0)
                        {
                            var cNode;
                            var maxLen = this.length - 1;
                            try
                            {
                                do
                                {
                                    cNode = this[maxLen];
                                    if (cNode[attr] == obj)
                                    {
                                        return cNode;
                                    }
                                } while (maxLen--);
                            } catch (e) { return false; }
                            return false;
                        }
                    };

                    grpObj.contains = function (attr, obj)
                    {
                        if (this.length > 0)
                        {
                            var maxLen = this.length - 1;
                            try
                            {
                                do
                                {
                                    if (this[maxLen][attr] == obj)
                                    {
                                        return true;
                                    }
                                } while (maxLen--);
                            } catch (e) { return false; }
                            return false;
                        }
                    };

                    grpObj.indexOf = function (attr, obj)
                    {
                        var pos = -1;
                        if (this.length > 0)
                        {
                            var maxLen = this.length - 1;
                            try
                            {
                                do
                                {
                                    if (this[maxLen][attr] == obj)
                                    {
                                        pos = maxLen;
                                    }
                                } while (maxLen--);
                            } catch (e) { return -1; }
                            return pos;
                        }
                    };

                    grpObj.SortByAttribute = function (col, dir)
                    {
                        if (this.length)
                        {
                            function getValue(pair, idx)
                            {
                                var out = pair[idx];
                                out = (isNumeric(out)) ? parseFloat(out) : out;
                                return out;
                            }
                            function sortFn(a, b)
                            {
                                var res = 0;
                                var tA, tB;
                                tA = getValue(a, col);
                                tB = getValue(b, col);
                                if (tA < tB) { res = -1; } else if (tB < tA) { res = 1; }
                                if (dir)
                                {
                                    res = (dir.toUpperCase() == "DESC") ? (0 - res) : res;
                                }
                                return res;
                            }
                            this.sort(sortFn);
                        }
                    };

                    grpObj.SortByValue = function (dir)
                    {
                        if (this.length)
                        {
                            function getValue(pair)
                            {
                                var out = pair.Text;
                                out = (isNumeric(out)) ? parseFloat(out) : out;
                                return out;
                            }
                            function sortFn(a, b)
                            {
                                var res = 0;
                                var tA, tB;
                                tA = getValue(a);
                                tB = getValue(b);
                                if (tA < tB) { res = -1; } else if (tB < tA) { res = 1; }
                                if (dir)
                                {
                                    res = (dir.toUpperCase() == "DESC") ? (0 - res) : res;
                                }
                                return res;
                            }
                            this.sort(sortFn);
                        }
                    };

                    grpObj.SortByNode = function (node, dir)
                    {
                        if (this.length)
                        {
                            function getValue(pair, node)
                            {
                                var out = pair[node][0].Text;
                                out = (isNumeric(out)) ? parseFloat(out) : out;
                                return out;
                            }
                            function sortFn(a, b)
                            {
                                var res = 0;
                                var tA, tB;
                                tA = getValue(a, node);
                                tB = getValue(b, node);
                                if (tA < tB) { res = -1; } else if (tB < tA) { res = 1; }
                                if (dir)
                                {
                                    res = (dir.toUpperCase() == "DESC") ? (0 - res) : res;
                                }
                                return res;
                            }
                            this.sort(sortFn);
                        }
                    };
                }
                //Recursive JSON Assembler
                //Set Object Nodes
                function setObjects(obj, node)
                {
                    var elemName; //Element name
                    var cnode; //Current Node
                    var tObj; //New subnode
                    var cName = "";
                    if (!node) { return null; }
                    //Set node attributes if any
                    if (node.attributes.length > 0) { setAttributes(obj, node); }
                    obj.Text = "";
                    if (node.hasChildNodes())
                    {
                        var nodeCount = node.childNodes.length - 1;
                        var n = 0;
                        do
                        { //Order is irrelevant (speed-up)
                            cnode = node.childNodes[n];
                            switch (cnode.nodeType)
                            {
                                case 1: //Node
                                    //Process child nodes
                                    obj._children = [];
                                    //SOAP XML FIX to remove namespaces (i.e. soapenv:)
                                    elemName = (cnode.localName) ? cnode.localName : cnode.baseName;
                                    elemName = formatName(elemName);
                                    if (cName != elemName) { obj._children.push(elemName); }
                                    //Create sub elemns array
                                    if (!obj[elemName])
                                    {
                                        obj[elemName] = []; //Create Collection
                                    }
                                    tObj = {};
                                    obj[elemName].push(tObj);
                                    if (cnode.attributes.length > 0)
                                    {
                                        setAttributes(tObj, cnode);
                                    }
                                    //Set Helper functions (contains, indexOf, sort, etc);
                                    if (!obj[elemName].contains)
                                    {
                                        setHelpers(obj[elemName]);
                                    }
                                    cName = elemName;
                                    if (cnode.hasChildNodes())
                                    {
                                        setObjects(tObj, cnode); //Recursive Call
                                    }
                                    break;
                                case 3: //Text Value
                                    obj.Text += trim(cnode.nodeValue);
                                    break;
                                case 4: //CDATA
                                    obj.Text += (cnode.text) ? trim(cnode.text) : trim(cnode.nodeValue);
                                    break;
                            }
                        } while (n++ < nodeCount);
                    }
                }
                //RUN
                setObjects(tmpObj, xroot);
                //Clean-up memmory
                xdoc = null;
                xroot = null;
                return tmpObj;
            } catch (e)
            {
                return null;
            }
        },

        //Converts Text to XML DOM
        textToXML: function (strXML)
        {
            var xmlDoc = null;
            try
            {
                xmlDoc = (document.all) ? new ActiveXObject("Microsoft.XMLDOM") : new DOMParser();
                xmlDoc.async = false;
            } catch (e) { throw new Error("XML Parser could not be instantiated"); }
            var out;
            try
            {
                if (document.all)
                {
                    out = (xmlDoc.loadXML(strXML)) ? xmlDoc : false;
                } else
                {
                    out = xmlDoc.parseFromString(strXML, "text/xml");
                }
            } catch (e) { throw new Error("Error parsing XML string"); }
            return out;
        }
    };
    return _self;
})();

// xml2json
/*
xml2json v 1.1
copyright 2005-2007 Thomas Frank

This program is free software under the terms of the 
GNU General Public License version 2 as published by the Free 
Software Foundation. It is distributed without any warranty.
*/

xml2json = {
    parser: function (xmlcode, ignoretags, debug)
    {
        if (!ignoretags) { ignoretags = "" };
        xmlcode = xmlcode.replace(/\s*\/>/g, '/>');
        xmlcode = xmlcode.replace(/<\?[^>]*>/g, "").replace(/<\![^>]*>/g, "");
        if (!ignoretags.sort) { ignoretags = ignoretags.split(",") };
        var x = this.no_fast_endings(xmlcode);
        x = this.attris_to_tags(x);
        x = escape(x);
        x = x.split("%3C").join("<").split("%3E").join(">").split("%3D").join("=").split("%22").join("\"");
        for (var i = 0; i < ignoretags.length; i++)
        {
            x = x.replace(new RegExp("<" + ignoretags[i] + ">", "g"), "*$**" + ignoretags[i] + "**$*");
            x = x.replace(new RegExp("</" + ignoretags[i] + ">", "g"), "*$***" + ignoretags[i] + "**$*")
        };
        x = '<JSONTAGWRAPPER>' + x + '</JSONTAGWRAPPER>';
        this.xmlobject = {};
        var y = this.xml_to_object(x).jsontagwrapper;
        if (debug) { y = this.show_json_structure(y, debug) };
        return y
    },
    xml_to_object: function (xmlcode)
    {
        var x = xmlcode.replace(/<\//g, "�");
        x = x.split("<");
        var y = [];
        var level = 0;
        var opentags = [];
        for (var i = 1; i < x.length; i++)
        {
            var tagname = x[i].split(">")[0];
            opentags.push(tagname);
            level++
            y.push(level + "<" + x[i].split("�")[0]);
            while (x[i].indexOf("�" + opentags[opentags.length - 1] + ">") >= 0) { level--; opentags.pop() }
        };
        var oldniva = -1;
        var objname = "this.xmlobject";
        for (var i = 0; i < y.length; i++)
        {
            var preeval = "";
            var niva = y[i].split("<")[0];
            var tagnamn = y[i].split("<")[1].split(">")[0];
            tagnamn = tagnamn.toLowerCase();
            var rest = y[i].split(">")[1];
            if (niva <= oldniva)
            {
                var tabort = oldniva - niva + 1;
                for (var j = 0; j < tabort; j++) { objname = objname.substring(0, objname.lastIndexOf(".")) }
            };
            objname += "." + tagnamn;
            var pobject = objname.substring(0, objname.lastIndexOf("."));
            if (eval("typeof " + pobject) != "object") { preeval += pobject + "={value:" + pobject + "};\n" };
            var objlast = objname.substring(objname.lastIndexOf(".") + 1);
            var already = false;
            for (k in eval(pobject)) { if (k == objlast) { already = true } };
            var onlywhites = true;
            for (var s = 0; s < rest.length; s += 3)
            {
                if (rest.charAt(s) != "%") { onlywhites = false }
            };
            if (rest != "" && !onlywhites)
            {
                if (rest / 1 != rest)
                {
                    rest = "'" + rest.replace(/\'/g, "\\'") + "'";
                    rest = rest.replace(/\*\$\*\*\*/g, "</");
                    rest = rest.replace(/\*\$\*\*/g, "<");
                    rest = rest.replace(/\*\*\$\*/g, ">")
                }
            }
            else { rest = "{}" };
            if (rest.charAt(0) == "'") { rest = 'unescape(' + rest + ')' };
            if (already && !eval(objname + ".sort")) { preeval += objname + "=[" + objname + "];\n" };
            var before = "="; after = "";
            if (already) { before = ".push("; after = ")" };
            var toeval = preeval + objname + before + rest + after;
            eval(toeval);
            if (eval(objname + ".sort")) { objname += "[" + eval(objname + ".length-1") + "]" };
            oldniva = niva
        };
        return this.xmlobject
    },
    show_json_structure: function (obj, debug, l)
    {
        var x = '';
        if (obj.sort) { x += "[\n" } else { x += "{\n" };
        for (var i in obj)
        {
            if (!obj.sort) { x += i + ":" };
            if (typeof obj[i] == "object")
            {
                x += this.show_json_structure(obj[i], false, 1)
            }
            else
            {
                if (typeof obj[i] == "function")
                {
                    var v = obj[i] + "";
                    //v=v.replace(/\t/g,"");
                    x += v
                }
                else if (typeof obj[i] != "string") { x += obj[i] + ",\n" }
                else { x += "'" + obj[i].replace(/\'/g, "\\'").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "\\r") + "',\n" }
            }
        };
        if (obj.sort) { x += "],\n" } else { x += "},\n" };
        if (!l)
        {
            x = x.substring(0, x.lastIndexOf(","));
            x = x.replace(new RegExp(",\n}", "g"), "\n}");
            x = x.replace(new RegExp(",\n]", "g"), "\n]");
            var y = x.split("\n"); x = "";
            var lvl = 0;
            for (var i = 0; i < y.length; i++)
            {
                if (y[i].indexOf("}") >= 0 || y[i].indexOf("]") >= 0) { lvl-- };
                tabs = ""; for (var j = 0; j < lvl; j++) { tabs += "\t" };
                x += tabs + y[i] + "\n";
                if (y[i].indexOf("{") >= 0 || y[i].indexOf("[") >= 0) { lvl++ }
            };
            if (debug == "html")
            {
                x = x.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                x = x.replace(/\n/g, "<BR>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
            };
            if (debug == "compact") { x = x.replace(/\n/g, "").replace(/\t/g, "") }
        };
        return x
    },
    no_fast_endings: function (x)
    {
        x = x.split("/>");
        for (var i = 1; i < x.length; i++)
        {
            var t = x[i - 1].substring(x[i - 1].lastIndexOf("<") + 1).split(" ")[0];
            x[i] = "></" + t + ">" + x[i]
        };
        x = x.join("");
        return x
    },
    attris_to_tags: function (x)
    {
        var d = ' ="\''.split("");
        x = x.split(">");
        for (var i = 0; i < x.length; i++)
        {
            var temp = x[i].split("<");
            for (var r = 0; r < 4; r++) { temp[0] = temp[0].replace(new RegExp(d[r], "g"), "_jsonconvtemp" + r + "_") };
            if (temp[1])
            {
                temp[1] = temp[1].replace(/'/g, '"');
                temp[1] = temp[1].split('"');
                for (var j = 1; j < temp[1].length; j += 2)
                {
                    for (var r = 0; r < 4; r++) { temp[1][j] = temp[1][j].replace(new RegExp(d[r], "g"), "_jsonconvtemp" + r + "_") }
                };
                temp[1] = temp[1].join('"')
            };
            x[i] = temp.join("<")
        };
        x = x.join(">");
        x = x.replace(/ ([^=]*)=([^ |>]*)/g, "><$1>$2</$1");
        x = x.replace(/>"/g, ">").replace(/"</g, "<");
        for (var r = 0; r < 4; r++) { x = x.replace(new RegExp("_jsonconvtemp" + r + "_", "g"), d[r]) };
        return x
    }
};


if (!Array.prototype.push)
{
    Array.prototype.push = function (x)
    {
        this[this.length] = x;
        return true
    }
};

if (!Array.prototype.pop)
{
    Array.prototype.pop = function ()
    {
        var response = this[this.length - 1];
        this.length--;
        return response
    }
};
