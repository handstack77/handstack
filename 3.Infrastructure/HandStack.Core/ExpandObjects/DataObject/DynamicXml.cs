using System;
using System.Dynamic;
using System.Linq;
using System.Xml.Linq;

namespace HandStack.Core.ExpandObjects.DataObject
{
    /// <code>
    /// dynamic person = DynamicXml.Parse("<Person><Name>Matt</Name><Age>28</Age><IsAwesome>true</IsAwesome></Person>");
    /// string name = person.Name; // Matt
    /// int age = person.Age; // 28
    /// bool isAwesome = person.IsAwesome; // true
    /// </code>
    public class DynamicXml : DynamicObject
    {
        public static DynamicXml Parse(string text)
        {
            return new DynamicXml(XElement.Parse(text));
        }

        private readonly XElement root;

        private DynamicXml(XElement root)
        {
            this.root = root;
        }

        public override bool TryGetMember(GetMemberBinder binder, out object? output)
        {
            bool result = false;
            XElement[] nodes = this.root.Elements(binder.Name).ToArray();
            if (nodes.Length > 1)
            {
                output = nodes.Select(o => new DynamicXml(o)).ToArray();
                result = true;
            }
            else if (nodes.Length == 1)
            {
                output = new DynamicXml(nodes.First());
                result = true;
            }
            else
            {
                output = null;
                result = false;
            }

            return result;
        }

        public override bool TryConvert(ConvertBinder binder, out object? output)
        {
            bool result = false;
            try
            {
                output = Convert.ChangeType(this.root.Value, binder.Type);
                result = true;
            }
            catch (Exception exception)
            {
                if (exception is InvalidCastException ||
                    exception is FormatException ||
                    exception is OverflowException ||
                    exception is ArgumentNullException)
                {
                    output = null;
                    result = false;
                }
                else
                {
                    throw;
                }
            }

            return result;
        }
    }
}
