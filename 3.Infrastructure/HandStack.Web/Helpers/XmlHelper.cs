using System;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;

using HandStack.Web.Enumeration;

namespace HandStack.Web.Helpers
{
    public static class XmlHelper
    {
        public static bool IsValid(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return false;
            }

            input = input!.Trim();

            if (!input.StartsWith("<") || !input.EndsWith(">"))
            {
                return false;
            }

            try
            {
                var xmlDocument = new XmlDocument();

                xmlDocument.LoadXml(input);

                return true;
            }
            catch (XmlException)
            {
                return false;
            }
            catch
            {
                return false;
            }
        }

        public static string Format(string? input, Indentation indentationMode, bool newLineOnAttributes)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return string.Empty;
            }

            input = input!.Trim();

            try
            {
                var xmlDocument = new XmlDocument();
                xmlDocument.LoadXml(input);

                var xmlWriterSettings = new XmlWriterSettings()
                {
                    Async = true,
                    OmitXmlDeclaration = xmlDocument.FirstChild == null ? false : xmlDocument.FirstChild.NodeType != XmlNodeType.XmlDeclaration,
                    NewLineOnAttributes = newLineOnAttributes,
                };

                switch (indentationMode)
                {
                    case Indentation.TwoSpaces:
                        xmlWriterSettings.Indent = true;
                        xmlWriterSettings.IndentChars = "  ";
                        break;
                    case Indentation.FourSpaces:
                        xmlWriterSettings.Indent = true;
                        xmlWriterSettings.IndentChars = "    ";
                        break;
                    case Indentation.OneTab:
                        xmlWriterSettings.Indent = true;
                        xmlWriterSettings.IndentChars = "\t";
                        break;
                    case Indentation.Minified:
                        xmlWriterSettings.Indent = false;
                        break;
                    default:
                        throw new NotSupportedException();
                }

                var stringBuilder = new StringBuilder();
                using (var xmlWriter = XmlWriter.Create(stringBuilder, xmlWriterSettings))
                {
                    xmlDocument.Save(xmlWriter);
                }

                if (xmlDocument.FirstChild != null && xmlDocument.FirstChild.NodeType == XmlNodeType.XmlDeclaration)
                {
                    Match match = Regex.Match(xmlDocument.FirstChild.InnerText, @"(?<=encoding\s*=\s*"")[^""]*", RegexOptions.None);
                    if (match.Success)
                    {
                        stringBuilder = stringBuilder.Replace("utf-16", match.Value);
                    }
                    else
                    {
                        stringBuilder = stringBuilder.Replace("encoding=\"utf-16\"", "");
                    }
                }
                return stringBuilder.ToString();
            }
            catch (XmlException exception)
            {
                return exception.Message;
            }
            catch (Exception exception)
            {
                return exception.Message;
            }
        }
    }
}
