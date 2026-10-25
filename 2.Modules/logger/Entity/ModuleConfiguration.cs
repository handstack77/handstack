using System.Collections.Generic;

namespace logger.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "logger";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static bool IsBundledWithHost = false;
        public static string BusinessServerUrl = "";
        public static string ModuleBasePath = "";
        public static int LogDeleteRepeatSecond = 43200;
        public static int CircuitBreakResetSecond = 30;
        public static bool IsApiFindServer = false;
        public static List<DataSource> DataSource = [];
        public static Dictionary<string, ApplicationCircuitBreakerPolicy> ApplicationIDCircuitBreakers = [];
    }
}

