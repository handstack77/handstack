using System.Collections.Generic;

using HandStack.Web;

namespace function.Entity
{
    public class ModuleConfigJson : ModuleSetting
    {
        public ModuleConfig ModuleConfig { get; set; }

        public ModuleConfigJson()
        {
            ModuleConfig = new ModuleConfig();
        }
    }

    public class NodeScriptConfig
    {
        public string LocalStoragePath { get; set; }

        public string LogMinimumLevel { get; set; }

        public string FileLogBasePath { get; set; }

        public int TimeoutMS { get; set; }

        public bool IsSingleThread { get; set; }

        public bool WatchGracefulShutdown { get; set; }

        public bool EnableFileWatching { get; set; }

        public List<string> WatchFileNamePatterns { get; set; }

        public string NodeAndV8Options { get; set; }

        public string EnvironmentVariables { get; set; }

        public NodeScriptConfig()
        {
            LocalStoragePath = "";
            LogMinimumLevel = "";
            FileLogBasePath = "";
            TimeoutMS = -1;
            IsSingleThread = true;
            WatchGracefulShutdown = false;
            EnableFileWatching = false;
            WatchFileNamePatterns = new List<string>();
            NodeAndV8Options = "";
            EnvironmentVariables = "";
        }
    }

    public class CSharpScriptConfig
    {
        public bool EnableFileWatching { get; set; }

        public string FileLogBasePath { get; set; }

        public List<string> WatchFileNamePatterns { get; set; }

        public CSharpScriptConfig()
        {
            EnableFileWatching = false;
            FileLogBasePath = "";
            WatchFileNamePatterns = new List<string>();
        }
    }

    public class PythonFunctionConfig
    {
        public bool EnablePythonDLL { get; set; }

        public string PythonDLLFilePath { get; set; }

        public bool EnableFileWatching { get; set; }

        public string FileLogBasePath { get; set; }

        public List<string> WatchFileNamePatterns { get; set; }

        public PythonFunctionConfig()
        {
            EnablePythonDLL = false;
            PythonDLLFilePath = "";
            EnableFileWatching = false;
            FileLogBasePath = "";
            WatchFileNamePatterns = new List<string>();
        }
    }

    public class FunctionSource
    {
        public string ApplicationID { get; set; }

        public string ProjectID { get; set; }

        public string DataSourceID { get; set; }

        public string DataProvider { get; set; }

        public string LanguageType { get; set; }

        public string ConnectionString { get; set; }

        public string WorkingDirectoryPath { get; set; }

        public string IsEncryption { get; set; }

        public string Comment { get; set; }

        public FunctionSource()
        {
            ApplicationID = "";
            ProjectID = "";
            LanguageType = "";
            DataSourceID = "";
            DataProvider = "";
            ConnectionString = "";
            IsEncryption = "";
            WorkingDirectoryPath = "";
            Comment = "";
        }
    }

    public class ModuleConfig
    {
        public string AuthorizationKey { get; set; }

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public bool IsLogServer { get; set; }

        public string LogServerUrl { get; set; }

        public List<string> ContractBasePath { get; set; }

        public bool IsTransactionLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public string ModuleBasePath { get; set; }

        public int TransactionLogFileSizeLimitBytes { get; set; }

        public int TransactionLogMaxRollingFiles { get; set; }

        public NodeScriptConfig NodeFunctionConfig { get; set; }

        public CSharpScriptConfig CSharpFunctionConfig { get; set; }

        public PythonFunctionConfig PythonFunctionConfig { get; set; }

        public string DefaultDataSourceID { get; set; }

        public List<FunctionSource> FunctionSource { get; set; }

        public List<string> AllowClientIP { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 60;
            IsLogServer = false;
            LogServerUrl = "";
            ContractBasePath = new List<string>();
            IsTransactionLogging = false;
            ModuleLogFilePath = "";
            ModuleBasePath = "";
            TransactionLogFileSizeLimitBytes = 104857600;
            TransactionLogMaxRollingFiles = 30;
            CSharpFunctionConfig = new CSharpScriptConfig();
            NodeFunctionConfig = new NodeScriptConfig();
            PythonFunctionConfig = new PythonFunctionConfig();
            DefaultDataSourceID = "";
            FunctionSource = new List<FunctionSource>();
            AllowClientIP = new List<string>() { "*" };
        }
    }
}
