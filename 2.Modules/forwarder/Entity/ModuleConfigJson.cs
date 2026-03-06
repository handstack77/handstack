using System.Collections.Generic;

using HandStack.Web;

namespace forwarder.Entity
{
    public class ModuleConfigJson : ModuleSetting
    {
        public ModuleConfig ModuleConfig { get; set; }

        public ModuleConfigJson()
        {
            ModuleConfig = new ModuleConfig();
        }
    }

    public record ModuleConfig
    {
        public string BusinessServerUrl { get; set; }

        public string ModuleBasePath { get; set; }

        public string ModuleFilePath { get; set; }

        public string ModuleLogFilePath { get; set; }

        public bool UseProxy { get; set; }

        public string ProxyServer { get; set; }

        public string ProxyUsername { get; set; }

        public string ProxyPassword { get; set; }

        public string ProxyBypass { get; set; }

        public bool IgnoreHTTPSErrors { get; set; }

        public int RequestTimeoutMS { get; set; }

        public int MaxRedirects { get; set; }

        public string SessionStorageBasePath { get; set; }

        public int BrowserIdleTimeoutSecond { get; set; }

        public List<Dictionary<string, string>> ForwardUrls { get; set; }

        public List<string> AllowClientIP { get; set; }

        public ModuleConfig()
        {
            BusinessServerUrl = "";
            ModuleBasePath = "";
            ModuleFilePath = "";
            ModuleLogFilePath = "";
            UseProxy = true;
            ProxyServer = "";
            ProxyUsername = "";
            ProxyPassword = "";
            ProxyBypass = "";
            IgnoreHTTPSErrors = false;
            RequestTimeoutMS = 30000;
            MaxRedirects = 10;
            SessionStorageBasePath = "../sqlite/forwarder";
            BrowserIdleTimeoutSecond = 60;
            ForwardUrls = new List<Dictionary<string, string>>();
            AllowClientIP = new List<string>() { "*" };
        }
    }
}
