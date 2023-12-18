using System;
using System.Net;

namespace HandStack.Web.ApiClient
{
    public class BypassWebProxy : IWebProxy
    {
        public ICredentials? Credentials { get; set; }

        public Uri GetProxy(Uri destination)
        {
            return destination;
        }

        public bool IsBypassed(Uri host)
        {
            return false;
        }

        private static BypassWebProxy defaultProxy = new BypassWebProxy();
        public static BypassWebProxy Default
        {
            get
            {
                return defaultProxy;
            }
        }
    }
}
