using System.Xml.Linq;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Core.Licensing
{
    public class Customer : LicenseAttributes
    {
        internal Customer(XElement? xmlData)
            : base(xmlData, "CustomerData")
        {
        }

        public string Name
        {
            get { return GetTag("Name").ToStringSafe(); }
            set { SetTag("Name", value); }
        }

        public string Company
        {
            get { return GetTag("Company").ToStringSafe(); }
            set { SetTag("Company", value); }
        }

        public string Email
        {
            get { return GetTag("Email").ToStringSafe(); }
            set { SetTag("Email", value); }
        }
    }
}
