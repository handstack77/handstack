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

    public record ModuleConfig
    {
        public string AuthorizationKey { get; set; }

        public string ModuleBasePath { get; set; }

        public bool IsSQLiteCreateOnNotSettingRequest { get; set; }

        public string BusinessServerUrl { get; set; }

        public int LogDeleteRepeatSecond { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public List<DataSource> DataSource { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            ModuleBasePath = "";
            IsSQLiteCreateOnNotSettingRequest = false;
            BusinessServerUrl = "";
            LogDeleteRepeatSecond = 43200;
            CircuitBreakResetSecond = 30;
            DataSource = new List<DataSource>();
        }
    }
}
