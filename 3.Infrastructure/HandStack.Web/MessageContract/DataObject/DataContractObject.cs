using System;
using System.Collections.Generic;
using System.Xml;
using System.Xml.Serialization;

namespace HandStack.Web.MessageContract.DataObject
{
    [XmlRoot(ElementName = "header", Namespace = "contract.xsd")]
    public class Header(string application, string project, string transaction, string dataSource, string use, string desc, string modifiedDate)
    {
        [XmlElement(ElementName = "application", Namespace = "contract.xsd")]
        public string Application { get; set; } = application;

        [XmlElement(ElementName = "project", Namespace = "contract.xsd")]
        public string Project { get; set; } = project;

        [XmlElement(ElementName = "transaction", Namespace = "contract.xsd")]
        public string Transaction { get; set; } = transaction;

        [XmlElement(ElementName = "datasource", Namespace = "contract.xsd")]
        public string DataSource { get; set; } = dataSource;

        [XmlElement(ElementName = "use", Namespace = "contract.xsd")]
        public string Use { get; set; } = use;

        [XmlElement(ElementName = "desc", Namespace = "contract.xsd")]
        public string Desc { get; set; } = desc;

        [XmlElement(ElementName = "modifieddate", Namespace = "contract.xsd")]
        public string ModifiedDate { get; set; } = modifiedDate;
    }

    [XmlRoot(ElementName = "param", Namespace = "contract.xsd")]
    public class Param(string iD, string type, string length, string value)
    {
        [XmlAttribute(AttributeName = "id")]
        public string ID { get; set; } = iD;

        [XmlAttribute(AttributeName = "type")]
        public string Type { get; set; } = type;

        [XmlAttribute(AttributeName = "length")]
        public string Length { get; set; } = length;

        [XmlAttribute(AttributeName = "value")]
        public string Value { get; set; } = value;
    }

    [XmlRoot(ElementName = "statement", Namespace = "contract.xsd")]
    public class Statement
    {
        public Statement()
        {
            Content = "";
            CDataContent = Array.Empty<XmlNode>();
            Param = [];
            ID = "";
            Seq = "";
            Use = "";
            Timeout = "";
            Desc = "";
            Modified = "";
        }

        [XmlIgnore]
        public string? Content { get; set; }

        [XmlText]
        public XmlNode[] CDataContent
        {
            get
            {
                var dummy = new XmlDocument();
                return new XmlNode[] { dummy.CreateCDataSection(Content) };
            }
            set
            {
                if (value == null)
                {
                    Content = null;
                    return;
                }

                if (value.Length != 1)
                {
                    throw new InvalidOperationException($"Invalid array length {value.Length}");
                }

                var node0 = value[0];
                if (node0 is not XmlCDataSection cdata)
                {
                    throw new InvalidOperationException($"Invalid node type {node0.NodeType}");
                }

                Content = cdata.Data;
            }
        }

        [XmlElement(ElementName = "param", Namespace = "contract.xsd")]
        public List<Param> Param { get; set; }

        [XmlAttribute(AttributeName = "id")]
        public string ID { get; set; }

        [XmlAttribute(AttributeName = "seq")]
        public string Seq { get; set; }

        [XmlAttribute(AttributeName = "use")]
        public string Use { get; set; }

        [XmlAttribute(AttributeName = "timeout")]
        public string Timeout { get; set; }

        [XmlAttribute(AttributeName = "desc")]
        public string Desc { get; set; }

        [XmlAttribute(AttributeName = "modified")]
        public string Modified { get; set; }
    }

    [XmlRoot(ElementName = "commands", Namespace = "contract.xsd")]
    public class Commands(List<Statement> statement)
    {
        [XmlElement(ElementName = "statement", Namespace = "contract.xsd")]
        public List<Statement> Statement { get; set; } = statement;
    }

    [XmlRoot(ElementName = "mapper", Namespace = "contract.xsd")]
    public class DataContractObject
    {
        public DataContractObject()
        {
            Header = null;
            Commands = null;
            Xmlns = "";
        }

        [XmlElement(ElementName = "header", Namespace = "contract.xsd")]
        public Header? Header { get; set; }

        [XmlElement(ElementName = "commands", Namespace = "contract.xsd")]
        public Commands? Commands { get; set; }

        [XmlAttribute(AttributeName = "xmlns")]
        public string Xmlns { get; set; }
    }
}
