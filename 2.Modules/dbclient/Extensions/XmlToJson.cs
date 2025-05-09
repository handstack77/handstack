using System.Data;
using System.IO;
using System.Text;
using System.Xml;
using System.Xml.XPath;

namespace dbclient.Extensions
{
    public sealed class XmlToJson
    {
        public static string JSONTransformer(string resultSetXML, string rootNodeName, string elementNodeName)
        {
            var xmlDoc = new XmlDocument();
            var dataset = new DataSet();
            var result = new StringBuilder();
            var recordCount = 0;
            var currentIndex = 0;

            var reader = new XmlTextReader(new StringReader(resultSetXML));
            var xdoc = new XPathDocument(reader);
            var nav = xdoc.CreateNavigator();
            var iter = nav.Select(rootNodeName + "/" + elementNodeName);

            recordCount = iter.Count;
            currentIndex = 0;

            result.Append("{ \"recordcount\": \"" + recordCount.ToString() + "\", \"data\": [ ");

            while (iter.MoveNext())
            {
                var item = iter.Current;
                result.Append("{ ");

                if (item != null && item.HasAttributes == true)
                {
                    item.MoveToFirstAttribute();
                    var line = "";

                    do
                    {
                        var name = item.Name;
                        var value = item.Value;

                        line += "\"" + name + "\": \"" + value.Replace("\"", "\\\"") + "\", ";
                    } while (item.MoveToNextAttribute());

                    line = line.Substring(0, line.Length - 2);
                    result.Append(line);
                }

                result.Append(" }");
                if (currentIndex < recordCount - 1) result.Append(", ");
                currentIndex++;
            }

            result.Append(" ]}");

            reader.Close();
            return result.ToString();
        }
    }
}
