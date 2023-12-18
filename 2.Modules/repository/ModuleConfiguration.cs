using Newtonsoft.Json.Linq;
using repository.Entities;
using System.Collections.Generic;
using System;
using HandStack.Web.Entity;

namespace repository
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "handsup";
        public static string ApplicationID = "HDS";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static bool IsBundledWithHost = false;
        public static string DatabaseContractPath = "";
        public static List<string> ContractBasePath = new List<string>();
        public static string ModuleBasePath = "";
        public static string ModuleFilePath = "";
        public static string BusinessServerUrl = "";
        public static bool IsModuleLogging = false;
        public static string ModuleLogFilePath = "";
        public static int CircuitBreakResetSecond = 60;
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static bool IsExceptionDetailText = false;
        public static int DefaultCommandTimeout = 30;

        public static string RunningEnvironment = "D";
        public static string FileServerUrl = "";
        public static string FileRootPath = "";
        public static string RepositoryList = "";
        public static string TransactionFileRepositorys = "";
        public static string XFrameOptions = "SAMEORIGIN";
        public static long AllowMaxFileUploadLength = 120000;
        public static int PurgeTokenTimeout = 120000;
        public static bool TokenGenerateIPCheck = false;
        public static List<Repository> FileRepositorys = new List<Repository>();
        public static bool IsApiFindServer = false;
    }
}
