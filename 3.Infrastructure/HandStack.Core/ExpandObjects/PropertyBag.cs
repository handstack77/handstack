using System;
using System.Collections.Generic;
using System.Xml;
using System.Xml.Schema;
using System.Xml.Serialization;

namespace HandStack.Core.ExpendObjects
{
    [XmlRoot("properties")]
    public class PropertyBag : PropertyBag<object?>
    {
        public new static PropertyBag CreateFromXml(string xml)
        {
            var bag = new PropertyBag();
            bag.FromXml(xml);
            return bag;
        }
    }

    [XmlRoot("properties")]
    public class PropertyBag<TValue> : Dictionary<string, TValue?>, IXmlSerializable
    {
        public XmlSchema? GetSchema()
        {
            return null;
        }

        public void WriteXml(XmlWriter writer)
        {
            foreach (string key in Keys)
            {
                TValue? value = this[key];

                Type? type = null;
                if (value != null)
                {
                    type = value.GetType();
                }

                if (type == null)
                {
                    continue;
                }

                writer.WriteStartElement("item");

                writer.WriteStartElement("key");
                writer.WriteString(key);
                writer.WriteEndElement();

                writer.WriteStartElement("value");
                string? xmlType = Utilities.MapTypeToXmlType(type);
                bool isCustom = false;

                if (value == null)
                {
                    writer.WriteAttributeString("type", "nil");
                }
                else if (string.IsNullOrEmpty(xmlType) == false)
                {
                    if (xmlType != "string")
                    {
                        writer.WriteStartAttribute("type");
                        writer.WriteString(xmlType);
                        writer.WriteEndAttribute();
                    }
                }
                else
                {
                    isCustom = true;
                    xmlType = "___" + value.GetType().FullName;
                    writer.WriteStartAttribute("type");
                    writer.WriteString(xmlType);
                    writer.WriteEndAttribute();
                }

                if (isCustom == false)
                {
                    if (value == null)
                    {
                        writer.WriteValue("");
                    }
                    else
                    {
                        writer.WriteValue(value);
                    }
                }
                else
                {
                    if (value == null)
                    {
                        writer.WriteValue("");
                    }
                    else
                    {
                        XmlSerializer ser = new XmlSerializer(value.GetType());
                        ser.Serialize(writer, value);
                    }
                }
                writer.WriteEndElement();
                writer.WriteEndElement();
            }
        }

        public void ReadXml(XmlReader reader)
        {
            Clear();
            while (reader.Read())
            {
                if (reader.NodeType == XmlNodeType.Element && reader.Name == "key")
                {
                    string? xmlType = null;
                    string name = reader.ReadElementContentAsString();

                    reader.ReadToNextSibling("value");

                    if (reader.MoveToNextAttribute() == true)
                    {
                        xmlType = reader.Value;
                    }

                    if (string.IsNullOrEmpty(xmlType) == true)
                    {
                        xmlType = "string";
                    }

                    reader.MoveToContent();

                    TValue? value;
                    string strval = string.Empty;
                    if (xmlType == "nil")
                    {
                        value = default(TValue);
                    }

                    else if (xmlType.StartsWith("___"))
                    {
                        while (reader.Read() && reader.NodeType != XmlNodeType.Element)
                        { }

                        Type? type = Utilities.GetTypeFromName(xmlType.Substring(3));
                        if (type == null)
                        {
                            value = default(TValue);
                        }
                        else
                        {
                            XmlSerializer ser = new XmlSerializer(type);
                            value = (TValue?)ser.Deserialize(reader);
                        }
                    }
                    else
                    {
                        Type? type = Utilities.MapXmlTypeToType(xmlType);
                        if (type == null)
                        {
                            value = default(TValue);
                        }
                        else
                        {
#pragma warning disable CS8625
                            value = (TValue?)reader.ReadElementContentAs(type, null);
#pragma warning restore CS8625
                        }
                    }

                    this.Add(name, value);
                }
            }
        }

        public string ToXml()
        {
            string? xml = null;
            SerializationUtils.SerializeObject(this, out xml);
            return xml;
        }

        public bool FromXml(string xml)
        {
            Clear();

            if (string.IsNullOrEmpty(xml) == true)
            {
                return true;
            }

            var result = SerializationUtils.DeSerializeObject(xml, this.GetType()) as PropertyBag<TValue>;
            if (result != null)
            {
                foreach (var item in result)
                {
                    this.Add(item.Key, item.Value);
                }
            }
            else
            {
                return false;
            }

            return true;
        }

        public static PropertyBag<TValue> CreateFromXml(string xml)
        {
            var bag = new PropertyBag<TValue>();
            bag.FromXml(xml);
            return bag;
        }
    }
}
