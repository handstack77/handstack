using System.Collections.Generic;

namespace forwarder.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "forwarder";
        public static string Version = "";
        public static bool IsBundledWithHost = false;
        public static string BusinessServerUrl = "";
        public static string ModuleBasePath = "";
        public static string ModuleFilePath = "";
        public static string ModuleLogFilePath = "";
        public static bool UseProxy = true;
        public static string ProxyServer = "";
        public static string ProxyUsername = "";
        public static string ProxyPassword = "";
        public static string ProxyBypass = "";
        public static bool IgnoreHTTPSErrors = false;
        public static int RequestTimeoutMS = 30000;
        public static int MaxRedirects = 10;
        public static string SessionStorageBasePath = "";
        public static int BrowserIdleTimeoutSecond = 60;
        public static Dictionary<string, string> ForwardUrls = new Dictionary<string, string>();
        public static List<string> AllowClientIP = new List<string>() { "*" };
    }
}
