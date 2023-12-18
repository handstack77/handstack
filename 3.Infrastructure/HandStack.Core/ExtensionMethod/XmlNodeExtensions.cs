using System;
using System.Xml;

namespace HandStack.Core.ExtensionMethod
{
    public static class XmlNodeExtensions
    {
        public static XmlNode CreateChildNode(this XmlNode @this, string nodeName)
        {
            XmlDocument? document = @this is XmlDocument ? (XmlDocument)@this : @this.OwnerDocument;

            if (document == null)
            {
                throw new ArgumentException("XmlNode 정보 확인 필요");
            }

            XmlNode node = document.CreateElement(nodeName);
            @this.AppendChild(node);
            return node;
        }

        public static XmlNode CreateChildNode(this XmlNode @this, string nodeName, string namespaceUri)
        {
            XmlDocument? document = @this is XmlDocument ? (XmlDocument)@this : @this.OwnerDocument;

            if (document == null)
            {
                throw new ArgumentException("XmlNode 정보 확인 필요");
            }

            XmlNode node = document.CreateElement(nodeName, namespaceUri);
            @this.AppendChild(node);
            return node;
        }

        public static XmlCDataSection CreateCDataSection(this XmlNode @this)
        {
            return @this.CreateCDataSection("");
        }

        public static XmlCDataSection CreateCDataSection(this XmlNode @this, string nodeData)
        {
            XmlDocument? document = @this is XmlDocument ? (XmlDocument)@this : @this.OwnerDocument;

            if (document == null)
            {
                throw new ArgumentException("XmlNode 정보 확인 필요");
            }

            XmlCDataSection node = document.CreateCDataSection(nodeData);
            @this.AppendChild(node);
            return node;
        }

        public static string? GetCDataSection(this XmlNode @this)
        {
            foreach (var node in @this.ChildNodes)
            {
                if (node is XmlCDataSection)
                {
                    return ((XmlCDataSection)node).Value;
                }
            }
            return null;
        }

        public static string? GetAttribute(this XmlNode @this, string attributeName)
        {
            return GetAttribute(@this, attributeName, null);
        }

        public static string? GetAttribute(this XmlNode @this, string attributeName, string? defaultValue)
        {
            XmlAttribute? attribute = @this?.Attributes?[attributeName];
            return (attribute != null ? attribute.InnerText : defaultValue);
        }

        public static void SetAttribute(this XmlNode @this, string nodeName, object value)
        {
            SetAttribute(@this, nodeName, value?.ToString());
        }

        public static void SetAttribute(this XmlNode @this, string nodeName, string? value)
        {
            if (@this != null)
            {
                var attribute = @this.Attributes?[nodeName, @this.NamespaceURI];
                if (attribute == null)
                {
                    attribute = @this?.OwnerDocument?.CreateAttribute(nodeName, @this.OwnerDocument.NamespaceURI);
                    if (@this != null && attribute != null)
                    {
                        @this.Attributes?.Append(attribute);
                    }
                }

                if (attribute != null)
                {
                    attribute.InnerText = value == null ? "" : value;
                }
            }
        }
    }
}
