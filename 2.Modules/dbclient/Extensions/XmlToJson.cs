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
            XmlDocument xmlDoc = new XmlDocument();
            DataSet dataset = new DataSet();
            StringBuilder result = new StringBuilder();
            int recordCount = 0;
            int currentIndex = 0;

            XmlTextReader reader = new XmlTextReader(new StringReader(resultSetXML));
            XPathDocument xdoc = new XPathDocument(reader);
            XPathNavigator nav = xdoc.CreateNavigator();
            XPathNodeIterator iter = nav.Select(rootNodeName + "/" + elementNodeName);

            recordCount = iter.Count;
            currentIndex = 0;

            result.Append("{ \"recordcount\": \"" + recordCount.ToString() + "\", \"data\": [ ");

            while (iter.MoveNext())
            {
                XPathNavigator? item = iter.Current;
                result.Append("{ ");

                if (item != null && item.HasAttributes == true)
                {
                    item.MoveToFirstAttribute();
                    string line = "";

                    do
                    {
                        string name = item.Name;
                        string value = item.Value;

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
