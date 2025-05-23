﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

using Dapper;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;

using HtmlAgilityPack;

using Newtonsoft.Json.Linq;

using Serilog;

namespace openapi.Extensions
{
    public static class DatabaseMapper
    {
        private static Random random = new Random();

        static DatabaseMapper()
        {
        }

        public static string DecryptConnectionString(string connectionString)
        {
            var result = "";
            try
            {
                var values = connectionString.SplitAndTrim('.');

                var encrypt = values[0];
                var decryptKey = values[1];
                var hostName = values[2];
                var hash = values[3];

                if ($"{encrypt}.{decryptKey}.{hostName}".ToSHA256() == hash)
                {
                    decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').Substring(0, 32);
                    result = encrypt.DecryptAES(decryptKey);
                }
            }
            catch (Exception exception)
            {
                Log.Logger.Error("[{LogCategory}] " + $"{connectionString} 확인 필요: " + exception.ToMessage(), "DatabaseMapper/DecryptConnectionString");
            }

            return result;
        }

        public static string Find(string SQL, Dictionary<string, object?> queryParameters)
        {
            var result = string.Empty;
            var children = new HtmlDocument();
            children.OptionDefaultStreamEncoding = Encoding.UTF8;
            children.LoadHtml(SQL);
            var parameters = JObject.FromObject(queryParameters);

            var childNodes = children.DocumentNode.ChildNodes;
            foreach (var childNode in childNodes)
            {
                result = result + ConvertChildren(childNode, parameters);
            }

            if (string.IsNullOrEmpty(result) == true)
            {
                result = "";
            }
            else
            {
                result = result + new string(' ', random.Next(1, 10));
            }

            return result;
        }

        public static string ConvertChildren(HtmlNode htmlNode, JObject parameters)
        {
            var result = "";
            var nodeType = htmlNode.NodeType.ToString();
            if (nodeType == "Text")
            {
                result = ConvertParameter(htmlNode, parameters);
            }
            else if (nodeType == "Element")
            {
                switch (htmlNode.Name.ToString().ToLower())
                {
                    case "if":
                        return ConvertIf(htmlNode, parameters);
                    case "foreach":
                        return ConvertForeach(htmlNode, parameters);
                    case "bind":
                        parameters = ConvertBind(htmlNode, parameters);
                        result = "";
                        break;
                    case "param":
                        return "";
                    default:
                        result = "";
                        break;
                }
            }

            return result;
        }

        public static string ConvertForeach(HtmlNode htmlNode, JObject parameters)
        {
            var result = "";
            // JArray list = Eval.Execute<JArray>(htmlNode.Attributes["collection"].Value, parameters);
            var list = parameters[htmlNode.Attributes["collection"].Value] as JArray;
            if (list != null)
            {
                var item = htmlNode.Attributes["item"].Value;
                var open = htmlNode.Attributes["open"] == null ? "" : htmlNode.Attributes["open"].Value;
                var close = htmlNode.Attributes["close"] == null ? "" : htmlNode.Attributes["close"].Value;
                var separator = htmlNode.Attributes["separator"] == null ? "" : htmlNode.Attributes["separator"].Value;

                var foreachTexts = new List<string>();
                foreach (var coll in list)
                {
                    var foreachParam = parameters;
                    foreachParam[item] = coll.Value<string>();

                    var foreachText = "";
                    foreach (var childNode in htmlNode.ChildNodes)
                    {
                        var childrenText = ConvertChildren(childNode, foreachParam);
                        childrenText = Regex.Replace(childrenText, "^\\s*$", "");

                        if (string.IsNullOrEmpty(childrenText) == false)
                        {
                            foreachText = foreachText + childrenText;
                        }
                    }

                    if (string.IsNullOrEmpty(foreachText) == false)
                    {
                        foreachTexts.Add(foreachText);
                    }
                }

                result = (open + string.Join(separator, foreachTexts.ToArray()) + close);
            }

            return result;
        }

        public static string ConvertIf(HtmlNode htmlNode, JObject parameters)
        {
            var evalString = htmlNode.Attributes["test"].Value;
            evalString = ReplaceEvalString(evalString, parameters);
            evalString = evalString.Replace(" and ", " && ");
            evalString = evalString.Replace(" or ", " || ");
            var evalText = evalString.Replace("'", "\"");

            var line = JsonUtils.GenerateDynamicLinqStatement(parameters);
            var queryable = new[] { parameters }.AsQueryable().Select(line.Replace("#", "$"));
            var evalResult = queryable.Any(evalText);

            var convertString = "";
            if (evalResult == true)
            {
                foreach (var childNode in htmlNode.ChildNodes)
                {
                    convertString = convertString + ConvertChildren(childNode, parameters);
                }
            }

            return convertString;
        }

        public static JObject ConvertBind(HtmlNode htmlNode, JObject parameters)
        {
            var bindID = htmlNode.Attributes["name"].Value;
            var evalString = htmlNode.Attributes["value"].Value;
            evalString = ReplaceEvalString(evalString, parameters);
            var evalText = evalString.Replace("'", "\"");

            var evalResult = evalText;
            var line = JsonUtils.GenerateDynamicLinqStatement(parameters);
            var queryable = new[] { parameters }.AsQueryable().Select(line.Replace("#", "$"));
            var queryResult = queryable.Select<string>(evalText);
            if (queryResult.Any() == true)
            {
                evalResult = queryResult.First();
            }

            parameters[bindID] = evalResult;

            return parameters;
        }

        public static string ConvertParameter(HtmlNode htmlNode, JObject parameters)
        {
            var convertString = htmlNode.InnerText;
            if (parameters != null && parameters.Count > 0)
            {
                var keyString = "";
                convertString = RecursiveParameters(convertString, parameters, keyString);
            }

            try
            {
                convertString = Regex.Replace(convertString, "&amp;", "&");
                convertString = Regex.Replace(convertString, "&lt;", "<");
                convertString = Regex.Replace(convertString, "&gt;", ">");
                convertString = Regex.Replace(convertString, "&quot;", "\"");
            }
            catch (Exception exception)
            {
                Log.Error("[{LogCategory}] " + exception.ToMessage(), "DatabaseMapper/ConvertParameter");
            }

            return convertString;
        }

        public static string RecursiveParameters(string convertString, JObject? parameters, string keyString)
        {
            if (parameters != null)
            {
                foreach (var parameter in parameters)
                {
                    if (parameter.Value != null)
                    {
                        if (parameter.Value.Type.ToString() == "Object")
                        {
                            var nextKeyString = keyString + parameter.Key + "\\.";
                            convertString = RecursiveParameters(convertString, parameter.Value?.ToObject<JObject>(), nextKeyString);
                        }
                        else
                        {
                            var name = parameter.Key;
                            var value = parameter.Value.ToStringSafe();

                            name = name.StartsWith("$") == true ? "\\" + name : name;
                            if (name.StartsWith("\\$") == false)
                            {
                                value = value.Replace("\"", "\\\"").Replace("'", "''");
                            }
                            // 문자값 변환
                            convertString = Regex.Replace(convertString, "\\#{" + name + "}", "'" + value + "'");

                            // 숫자값 변환
                            convertString = Regex.Replace(convertString, "\\${" + name + "}", value);
                        }
                    }
                }
            }

            return convertString;
        }

        public static string ReplaceEvalString(string evalString, JObject parameters)
        {
            foreach (var parameter in parameters)
            {
                if (parameter.Value != null)
                {
                    var replacePrefix = "";
                    var replacePostfix = "";
                    Regex paramRegex;

                    if (parameter.Value.Type.ToString() == "Object")
                    {
                        replacePostfix = "";
                        paramRegex = new Regex("(^|[^a-zA-Z0-9])(" + parameter.Key + "\\.)([a-zA-Z0-9]+)");
                    }
                    else
                    {
                        replacePostfix = " ";
                        paramRegex = new Regex("(^|[^a-zA-Z0-9])(" + parameter.Key + ")($|[^a-zA-Z0-9])");
                    }

                    if (paramRegex.IsMatch(evalString) == true)
                    {
                        evalString = paramRegex.Replace(evalString, "$1" + replacePrefix + "$2" + replacePostfix + "$3");
                    }
                }
            }

            return evalString;
        }

        public static string ReplaceCData(string rawText)
        {
            var cdataRegex = new Regex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)");
            var matches = cdataRegex.Matches(rawText);

            if (matches != null && matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    var matchSplit = Regex.Split(match.Value, "(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)");
                    var cdataText = matchSplit[2];
                    cdataText = Regex.Replace(cdataText, "&", "&amp;");
                    cdataText = Regex.Replace(cdataText, "<", "&lt;");
                    cdataText = Regex.Replace(cdataText, ">", "&gt;");
                    cdataText = Regex.Replace(cdataText, "\"", "&quot;");

                    rawText = rawText.Replace(match.Value, cdataText);
                }
            }
            return rawText;
        }

        public static Dictionary<string, object?> ToParametersDictionary(this DynamicParameters dynamicParams)
        {
            var result = new Dictionary<string, object?>();
            var iLookup = (SqlMapper.IParameterLookup)dynamicParams;

            foreach (var paramName in dynamicParams.ParameterNames)
            {
                var value = iLookup[paramName];
                result.Add(paramName, value);
            }

            var templates = dynamicParams.GetType().GetField("templates", BindingFlags.NonPublic | BindingFlags.Instance);
            if (templates != null)
            {
                var list = templates.GetValue(dynamicParams) as List<Object>;
                if (list != null)
                {
                    foreach (var props in list.Select(obj => obj.GetPropertyValuePairs().ToList()))
                    {
                        props.ForEach(p => result.Add(p.Key, p.Value));
                    }
                }
            }
            return result;
        }
    }
}
