using System.Collections.Generic;

using HandStack.Web;

namespace logger.Entity
{
    public class ModuleConfigJson : ModuleSetting
    {
        public ModuleConfig ModuleConfig { get; set; }

        public ModuleConfigJson()
        {
            ModuleConfig = new ModuleConfig();
        }
    }

    public class ModuleConfig
    {
        public string ModuleBasePath { get; set; }

        public bool IsSQLiteCreateOnNotSettingRequest { get; set; }

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public List<DataSource> DataSource { get; set; }

        public ModuleConfig()
        {
            ModuleBasePath = "";
            IsSQLiteCreateOnNotSettingRequest = false;
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 30;
            DataSource = new List<DataSource>();
        }
    }
}
