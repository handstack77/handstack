using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using prompter.Extensions;
using Serilog;

namespace prompter.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "prompter";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static List<string> AllowClientIP = ["*"];
        public static bool IsBundledWithHost = false;
        public static bool IsContractFileWatching = true;
        public static readonly string[] ContractFileExtensions = { ".xml", ".pmt" };
        public static readonly string ContractFileWatcherFilter = "*.xml|*.pmt";
        public static List<string> ContractBasePath = [];
        public static Dictionary<string, FileSyncManager> PromptFileSyncManager = [];
        public static string BusinessServerUrl = "";
        public static string ModuleBasePath = "";
        public static string DatabaseContractPath = "";
        public static int CircuitBreakResetSecond = 30;
        public static bool IsApiFindServer = false;
        public static bool IsTransactionLogging = false;
        public static bool IsChatHistoryConsoleShow = false;
        public static string DefaultPromptResultFieldID = "PromptResult";
        public static string ModuleLogFilePath = "";
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static List<LLMSource> LLMSource = [];
        public static List<AllowedKernelPlugin> AllowedKernelPlugins = [];
        public static List<AllowedExternalTool> AllowedMcpServers = [];
        public static List<AllowedExternalTool> AllowedCliTools = [];
        public static List<string> AllowedBuiltinTools = [];
        public static List<string> AllowedBodyFileBasePaths = [];
        public static List<string> DriveBasePaths = [];
        public static string ImageGenerationDataSourceID = "";
        public static string ImageGenerationModelID = "gpt-image-1";
        public static string GeneratedImageBasePath = "";
        public static string SkillBasePath = "";
        public static string SkillsBaseUrl = "https://skills.sh";
        public static string SkillsApiBearerToken = "";
        public static bool EnableSkillSearch = false;
        public static bool EnableSkillInstall = false;
        public static ConcurrentDictionary<string, byte> CacheKeys = new();
        public static ILogger? ModuleLogger = null;

        public static bool IsContractFileExtension(string extension)
        {
            return Array.Exists(ContractFileExtensions, item => item.Equals(extension, StringComparison.OrdinalIgnoreCase));
        }
    }
}
