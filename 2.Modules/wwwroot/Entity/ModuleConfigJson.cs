using System.Collections.Generic;

using HandStack.Web;

namespace wwwroot.Entity
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

        public string BusinessServerUrl { get; set; }

        public string SystemVaultKey { get; set; }

        public string ContractRequestPath { get; set; }

        public string ContractBasePath { get; set; }

        public string WWWRootBasePath { get; set; }

        public string ModuleFilePath { get; set; }

        public bool IsModuleLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public List<string> FileSyncTokens { get; set; }

        public CreateIDPolicyConfig CreateIDPolicy { get; set; }

        // 공통 파일 관리: 이 경로의 JSON 파일(qcn.winform "공통 파일 관리" 화면이 관리하는 shared_files.json과 같은 형식, items[].requestPath/hostFilePath)을 읽어 SharedFiles로 서빙한다.
        public string SharedFileConfigPath { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            BusinessServerUrl = "";
            SystemVaultKey = "";
            ContractRequestPath = "";
            ContractBasePath = "";
            WWWRootBasePath = "";
            ModuleFilePath = "";
            IsModuleLogging = false;
            ModuleLogFilePath = "";
            FileSyncTokens = new List<string>();
            CreateIDPolicy = new CreateIDPolicyConfig();
            SharedFileConfigPath = "";
        }
    }

    public record CreateIDPolicyConfig
    {
        public bool Enabled { get; set; }

        // 로그인/로그아웃처럼 인증 전에 GlobalID가 필요한 화면만 명시한다.
        public List<string> AllowedScreens { get; set; }

        // 서버 간 발급 키. 각 키는 허용 IP 범위를 설정해야 한다.
        public List<CreateIDAuthorizationKeyConfig> AuthorizationKeys { get; set; }

        public CreateIDPolicyConfig()
        {
            Enabled = false;
            AllowedScreens = new List<string>();
            AuthorizationKeys = new List<CreateIDAuthorizationKeyConfig>();
        }
    }

    public record CreateIDAuthorizationKeyConfig
    {
        public string Key { get; set; }

        public List<string> AllowedIPs { get; set; }

        public CreateIDAuthorizationKeyConfig()
        {
            Key = "";
            AllowedIPs = new List<string>();
        }
    }
}
