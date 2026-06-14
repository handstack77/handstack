using System.Collections.Generic;

using HandStack.Web;
namespace prompter.Entity
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

        public string DatabaseContractPath { get; set; }

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public bool IsLogServer { get; set; }

        public string LogServerUrl { get; set; }

        public bool IsContractFileWatching { get; set; }

        public List<string> ContractBasePath { get; set; }

        public bool IsTransactionLogging { get; set; }

        public bool IsChatHistoryConsoleShow { get; set; }

        public string DefaultPromptResultFieldID { get; set; }

        public string ModuleLogFilePath { get; set; }

        public List<LLMSource> LLMSource { get; set; }

        public List<AllowedKernelPlugin> AllowedKernelPlugins { get; set; }

        public List<AllowedExternalTool> AllowedMcpServers { get; set; }

        public List<AllowedExternalTool> AllowedCliTools { get; set; }

        public List<string> AllowedBuiltinTools { get; set; }

        public List<string> AllowedBodyFileBasePaths { get; set; }

        public List<string> DriveBasePaths { get; set; }

        public string ImageGenerationDataSourceID { get; set; }

        public string ImageGenerationModelID { get; set; }

        public string GeneratedImageBasePath { get; set; }

        public string SkillBasePath { get; set; }

        public string SkillsBaseUrl { get; set; }

        public string SkillsApiBearerToken { get; set; }

        public bool EnableSkillSearch { get; set; }

        public bool EnableSkillInstall { get; set; }

        public List<string> AllowClientIP { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            ModuleBasePath = "";
            DatabaseContractPath = "";
            BusinessServerUrl = "";
            IsTransactionLogging = false;
            ModuleLogFilePath = "";
            IsLogServer = false;
            LogServerUrl = "";
            IsContractFileWatching = false;
            ContractBasePath = new List<string>();
            CircuitBreakResetSecond = 30;
            IsChatHistoryConsoleShow = false;
            DefaultPromptResultFieldID = "PromptResult";
            LLMSource = new List<LLMSource>();
            AllowedKernelPlugins = new List<AllowedKernelPlugin>();
            AllowedMcpServers = new List<AllowedExternalTool>();
            AllowedCliTools = new List<AllowedExternalTool>();
            AllowedBuiltinTools = new List<string>();
            AllowedBodyFileBasePaths = new List<string>();
            DriveBasePaths = new List<string>();
            ImageGenerationDataSourceID = "";
            ImageGenerationModelID = "gpt-image-1";
            GeneratedImageBasePath = "";
            SkillBasePath = "";
            SkillsBaseUrl = "https://skills.sh";
            SkillsApiBearerToken = "";
            EnableSkillSearch = false;
            EnableSkillInstall = false;
            AllowClientIP = new List<string>() { "*" };
        }
    }
}
