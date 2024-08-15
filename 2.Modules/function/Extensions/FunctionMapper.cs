using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;

using function.Builder;
using function.Entity;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using Serilog;

namespace function.Extensions
{
    public static class FunctionMapper
    {
        public static ExpiringDictionary<string, ModuleSourceMap> FunctionSourceMappings = new ExpiringDictionary<string, ModuleSourceMap>();
        public static ExpiringDictionary<string, ModuleScriptMap> ScriptMappings = new ExpiringDictionary<string, ModuleScriptMap>();

        static FunctionMapper()
        {
        }

        public static ModuleSourceMap? GetDataSourceMap(string applicationID, string projectID, string transactionID, string dataSourceID)
        {
            ModuleSourceMap? result = null;
            lock (FunctionSourceMappings)
            {
                string functionSourceMappingsKey = $"{applicationID}|{dataSourceID}";
                result = FunctionSourceMappings.FirstOrDefault(item => item.Key == functionSourceMappingsKey
                    && (item.Value.ProjectListID.IndexOf(projectID) > -1 || item.Value.ProjectListID.IndexOf("*") > -1)).Value;

                if (result == null)
                {
                    string userWorkID = string.Empty;
                    string appBasePath = string.Empty;
                    DirectoryInfo baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                    var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                    foreach (string directory in directories)
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(directory);
                        if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                        {
                            appBasePath = directoryInfo.FullName;
                            userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                            break;
                        }
                    }

                    string tenantID = $"{userWorkID}|{applicationID}";
                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                        {
                            string appSettingText = File.ReadAllText(settingFilePath);
                            var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                            if (appSetting != null)
                            {
                                var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.DataSource == null ? "[]" : appSetting.DataSource));
                                if (dataTable != null)
                                {
                                    var items = dataTable.Select($"ApplicationID = '{applicationID}' AND DataSourceID = '{dataSourceID}'");
                                    if (items != null && items.Length > 0)
                                    {
                                        var item = items[0];
                                        List<string> projects = item.GetStringSafe("ProjectID").SplitComma();
                                        string dataProvider = item.GetStringSafe("DataProvider");
                                        string connectionString = item.GetStringSafe("ConnectionString");
                                        if (projects.IndexOf(projectID) > -1 || projects.IndexOf("*") > -1)
                                        {
                                            if (FunctionSourceMappings.ContainsKey(functionSourceMappingsKey) == false)
                                            {
                                                ModuleSourceMap moduleSourceMap = new ModuleSourceMap();
                                                moduleSourceMap.ProjectListID = projects;
                                                moduleSourceMap.DataSourceID = dataSourceID;
                                                moduleSourceMap.DataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), dataProvider);
                                                moduleSourceMap.ConnectionString = connectionString;
                                                if (moduleSourceMap.IsEncryption.ParseBool() == true)
                                                {
                                                    moduleSourceMap.ConnectionString = DecryptConnectionString(moduleSourceMap);
                                                }

                                                if (moduleSourceMap.DataProvider == DataProviders.SQLite)
                                                {
                                                    if (moduleSourceMap.ConnectionString.IndexOf("#{ContentRootPath}") > -1)
                                                    {
                                                        moduleSourceMap.ConnectionString = moduleSourceMap.ConnectionString.Replace("#{ContentRootPath}", GlobalConfiguration.ContentRootPath);
                                                    }
                                                }

                                                string workingDirectoryPath = Path.Combine(appBasePath, "function", "working", projectID, transactionID);
                                                if (Directory.Exists(workingDirectoryPath) == false)
                                                {
                                                    Directory.CreateDirectory(workingDirectoryPath);
                                                }
                                                moduleSourceMap.WorkingDirectoryPath = workingDirectoryPath;

                                                FunctionSourceMappings.Add(functionSourceMappingsKey, moduleSourceMap);
                                            }

                                            result = FunctionSourceMappings.FirstOrDefault(item => item.Key == functionSourceMappingsKey
                                                && (item.Value.ProjectListID.IndexOf(projectID) > -1 || item.Value.ProjectListID.IndexOf("*") > -1)).Value;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return result;
        }

        public static ModuleScriptMap? GetScriptMap(string queryID)
        {
            ModuleScriptMap? result = null;
            lock (ScriptMappings)
            {
                result = ScriptMappings.FirstOrDefault(item => item.Key == queryID).Value;

                if (result == null)
                {
                    var itemKeys = queryID.Split("|");
                    string applicationID = itemKeys[0];
                    string projectID = itemKeys[1];
                    string transactionID = itemKeys[2];

                    string filePath = string.Empty;
                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                    {
                        var scriptMapFile = Path.Combine(basePath, "csharp", applicationID, projectID, transactionID, "featureMeta.json");
                        if (File.Exists(scriptMapFile) == true)
                        {
                            filePath = scriptMapFile;
                        }
                        else
                        {
                            scriptMapFile = Path.Combine(basePath, "javascript", applicationID, projectID, transactionID, "featureMeta.json");
                            if (File.Exists(scriptMapFile) == true)
                            {
                                filePath = scriptMapFile;
                            }
                        }

                        if (File.Exists(filePath) == true)
                        {
                            MergeContractFile(filePath);
                        }

                        result = ScriptMappings.FirstOrDefault(item => item.Key == queryID).Value;
                        if (result != null)
                        {
                            break;
                        }
                    }

                    if (result == null)
                    {
                        string userWorkID = string.Empty;
                        string appBasePath = string.Empty;
                        DirectoryInfo baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                        var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                        foreach (string directory in directories)
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(directory);
                            if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                            {
                                appBasePath = directoryInfo.FullName;
                                userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                                break;
                            }
                        }

                        if (string.IsNullOrEmpty(appBasePath) == false)
                        {
                            string tenantID = $"{userWorkID}|{applicationID}";
                            var scriptMapFile = Path.Combine(appBasePath, "csharp", "javascript", projectID, transactionID, "featureMeta.json");
                            if (File.Exists(scriptMapFile) == true)
                            {
                                filePath = scriptMapFile;
                            }
                            else
                            {
                                scriptMapFile = Path.Combine(appBasePath, "function", "javascript", projectID, transactionID, "featureMeta.json");
                                if (File.Exists(scriptMapFile) == true)
                                {
                                    filePath = scriptMapFile;
                                }
                            }

                            if (File.Exists(filePath) == true)
                            {
                                MergeContractFile(filePath);
                            }

                            result = ScriptMappings.FirstOrDefault(item => item.Key == queryID).Value;
                        }
                    }
                }
            }

            return result;

            static void MergeContractFile(string scriptMapFile)
            {
                try
                {
                    if (File.Exists(scriptMapFile) == false)
                    {
                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/MergeContractFile");
                        return;
                    }

                    if (scriptMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && GlobalConfiguration.IsTenantFunction == false)
                    {
                        return;
                    }

                    FunctionScriptContract? functionScriptContract = FunctionScriptContract.FromJson(File.ReadAllText(scriptMapFile));

                    if (functionScriptContract == null)
                    {
                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/MergeContractFile");
                        return;
                    }

                    string? fileExtension = null;
                    switch (functionScriptContract.Header.LanguageType)
                    {
                        case "javascript":
                            fileExtension = "js";
                            break;
                        case "csharp":
                            fileExtension = "cs";
                            break;
                    }

                    if (string.IsNullOrEmpty(fileExtension) == true)
                    {
                        Log.Logger.Error("[{LogCategory}] " + $"{functionScriptContract.Header.LanguageType} 언어 타입 확인 필요", "FunctionMapper/MergeContractFile");
                        return;
                    }

                    var functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                    if (File.Exists(functionScriptFile) == true)
                    {
                        FunctionHeader header = functionScriptContract.Header;
                        if (scriptMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                        {
                            FileInfo fileInfo = new FileInfo(scriptMapFile);
                            header.ApplicationID = string.IsNullOrEmpty(header.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Parent?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                            header.ProjectID = string.IsNullOrEmpty(header.ProjectID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ProjectID;
                            header.TransactionID = string.IsNullOrEmpty(header.TransactionID) == true ? (fileInfo.Directory?.Name).ToStringSafe().Replace(fileInfo.Extension, "") : header.TransactionID;
                        }

                        var items = functionScriptContract.Commands;
                        foreach (var item in items)
                        {
                            if (header.Use == true)
                            {
                                ModuleScriptMap moduleScriptMap = new ModuleScriptMap();
                                moduleScriptMap.ApplicationID = header.ApplicationID;
                                moduleScriptMap.ProjectID = header.ProjectID;
                                moduleScriptMap.TransactionID = header.TransactionID;
                                moduleScriptMap.ScriptID = item.ID + item.Seq.ToString().PadLeft(2, '0');
                                moduleScriptMap.ExportName = item.ID;
                                moduleScriptMap.Seq = item.Seq;
                                moduleScriptMap.IsHttpContext = header.IsHttpContext;
                                moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

                                if (string.IsNullOrEmpty(item.EntryType) == true)
                                {
                                    moduleScriptMap.EntryType = $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}";
                                }
                                else
                                {
                                    moduleScriptMap.EntryType = item.EntryType;
                                }

                                if (string.IsNullOrEmpty(item.EntryType) == true)
                                {
                                    moduleScriptMap.EntryMethod = item.ID;
                                }
                                else
                                {
                                    moduleScriptMap.EntryMethod = item.EntryMethod;
                                }

                                moduleScriptMap.DataSourceID = header.DataSourceID;
                                moduleScriptMap.LanguageType = header.LanguageType;
                                moduleScriptMap.ProgramPath = functionScriptFile;
                                moduleScriptMap.Timeout = item.Timeout;
                                moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                                moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                                moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                                moduleScriptMap.Comment = item.Comment;

                                moduleScriptMap.ModuleParameters = new List<ModuleParameterMap>();
                                List<FunctionParam> functionParams = item.Params;
                                if (functionParams != null && functionParams.Count > 0)
                                {
                                    foreach (FunctionParam functionParam in functionParams)
                                    {
                                        moduleScriptMap.ModuleParameters.Add(new ModuleParameterMap()
                                        {
                                            Name = functionParam.ID,
                                            DbType = functionParam.Type,
                                            Length = functionParam.Length,
                                            DefaultValue = functionParam.Value,
                                        });
                                    }
                                }

                                string mappingQueryID = string.Concat(
                                    moduleScriptMap.ApplicationID, "|",
                                    moduleScriptMap.ProjectID, "|",
                                    moduleScriptMap.TransactionID, "|",
                                    moduleScriptMap.ScriptID
                                );

                                if (ScriptMappings.ContainsKey(mappingQueryID) == false)
                                {
                                    ScriptMappings.Add(mappingQueryID, moduleScriptMap);
                                }
                                else
                                {
                                    Log.Logger.Warning("[{LogCategory}] " + $"ScriptMap 정보 중복 확인 필요 - {scriptMapFile}, ApplicationID - {moduleScriptMap.ApplicationID}, ProjectID - {moduleScriptMap.ProjectID}, TransactionID - {moduleScriptMap.TransactionID}, ScriptID - {moduleScriptMap.ScriptID}", "FunctionMapper/MergeContractFile");
                                }
                            }
                        }
                    }
                    else
                    {
                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/MergeContractFile");
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error(exception, "[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류", "FunctionMapper/MergeContractFile");
                }
            }
        }

        public static bool HasContractFile(string fileRelativePath)
        {
            bool result = false;
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                string filePath = Path.Combine(basePath, fileRelativePath);
                result = File.Exists(filePath);
                if (result == true)
                {
                    break;
                }

                if (filePath.IndexOf(@"\csharp\") == -1 || filePath.IndexOf(@"\javascript\") == -1)
                {
                    filePath = Path.Combine(basePath, "csharp", fileRelativePath);
                    result = File.Exists(filePath);
                    if (result == true)
                    {
                        break;
                    }

                    filePath = Path.Combine(basePath, "javascript", fileRelativePath);
                    result = File.Exists(filePath);
                    if (result == true)
                    {
                        break;
                    }
                }
            }

            return result;
        }


        public static bool Remove(string projectID, string businessID, string transactionID, string scriptID)
        {
            bool result = false;
            lock (ScriptMappings)
            {
                string queryID = string.Concat(
                    projectID, "|",
                    businessID, "|",
                    transactionID, "|",
                    scriptID
                );

                if (ScriptMappings.ContainsKey(queryID) == true)
                {
                    result = ScriptMappings.Remove(queryID);
                }
            }

            return result;
        }

        public static bool HasScript(string applicationID, string projectID, string transactionID, string scriptID)
        {
            bool result = false;
            string queryID = string.Concat(
                applicationID, "|",
                projectID, "|",
                transactionID, "|",
                scriptID
            );

            result = ScriptMappings.ContainsKey(queryID);

            return result;
        }

        public static bool AddScriptMap(string scriptMapFile, bool forceUpdate, ILogger logger)
        {
            bool result = false;

            try
            {
                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (scriptMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && GlobalConfiguration.IsTenantFunction == false)
                    {
                        return result;
                    }

                    string filePath = string.Empty;
                    var scriptMapFilePath = Path.Combine(basePath, "csharp", scriptMapFile);
                    if (File.Exists(scriptMapFilePath) == true)
                    {
                        filePath = scriptMapFilePath;
                    }
                    else
                    {
                        scriptMapFilePath = Path.Combine(basePath, "javascript", scriptMapFile);
                        if (File.Exists(scriptMapFilePath) == true)
                        {
                            filePath = scriptMapFilePath;
                        }
                    }

                    if (File.Exists(filePath) == true)
                    {
                        FunctionScriptContract? functionScriptContract = FunctionScriptContract.FromJson(File.ReadAllText(filePath));

                        if (functionScriptContract == null)
                        {
                            logger.Information("[{LogCategory}] " + $"{filePath} 대응 functionFilePath 파일 없음", "FunctionMapper/AddScriptMap");
                            continue;
                        }

                        string? fileExtension = null;
                        switch (functionScriptContract.Header.LanguageType)
                        {
                            case "javascript":
                                fileExtension = "js";
                                break;
                            case "csharp":
                                fileExtension = "cs";
                                break;
                        }

                        if (string.IsNullOrEmpty(fileExtension) == true)
                        {
                            logger.Error("[{LogCategory}] " + $"{functionScriptContract.Header.LanguageType} 언어 타입 확인 필요", "FunctionMapper/AddScriptMap");
                            continue;
                        }

                        string functionScriptFile = filePath.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                        if (File.Exists(functionScriptFile) == true)
                        {
                            FunctionHeader header = functionScriptContract.Header;
                            if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                            {
                                FileInfo fileInfo = new FileInfo(filePath);
                                header.ApplicationID = string.IsNullOrEmpty(header.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Parent?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                                header.ProjectID = string.IsNullOrEmpty(header.ProjectID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ProjectID;
                                header.TransactionID = string.IsNullOrEmpty(header.TransactionID) == true ? (fileInfo.Directory?.Name).ToStringSafe().Replace(fileInfo.Extension, "") : header.TransactionID;
                            }

                            var items = functionScriptContract.Commands;
                            foreach (var item in items)
                            {
                                if (header.Use == true)
                                {
                                    ModuleScriptMap moduleScriptMap = new ModuleScriptMap();
                                    moduleScriptMap.ApplicationID = header.ApplicationID;
                                    moduleScriptMap.ProjectID = header.ProjectID;
                                    moduleScriptMap.TransactionID = header.TransactionID;
                                    moduleScriptMap.ScriptID = item.ID + item.Seq.ToString().PadLeft(2, '0');
                                    moduleScriptMap.ExportName = item.ID;
                                    moduleScriptMap.Seq = item.Seq;
                                    moduleScriptMap.IsHttpContext = header.IsHttpContext;
                                    moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

                                    if (string.IsNullOrEmpty(item.EntryType) == true)
                                    {
                                        moduleScriptMap.EntryType = $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}";
                                    }
                                    else
                                    {
                                        moduleScriptMap.EntryType = item.EntryType;
                                    }

                                    if (string.IsNullOrEmpty(item.EntryType) == true)
                                    {
                                        moduleScriptMap.EntryMethod = item.ID;
                                    }
                                    else
                                    {
                                        moduleScriptMap.EntryMethod = item.EntryMethod;
                                    }

                                    moduleScriptMap.DataSourceID = header.DataSourceID;
                                    moduleScriptMap.LanguageType = header.LanguageType;
                                    moduleScriptMap.ProgramPath = functionScriptFile;
                                    moduleScriptMap.Timeout = item.Timeout;
                                    moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                                    moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                                    moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                                    moduleScriptMap.Comment = item.Comment;

                                    moduleScriptMap.ModuleParameters = new List<ModuleParameterMap>();
                                    List<FunctionParam> functionParams = item.Params;
                                    if (functionParams != null && functionParams.Count > 0)
                                    {
                                        foreach (FunctionParam functionParam in functionParams)
                                        {
                                            moduleScriptMap.ModuleParameters.Add(new ModuleParameterMap()
                                            {
                                                Name = functionParam.ID,
                                                DbType = functionParam.Type,
                                                Length = functionParam.Length,
                                                DefaultValue = functionParam.Value,
                                            });
                                        }
                                    }

                                    string queryID = string.Concat(
                                        moduleScriptMap.ApplicationID, "|",
                                        moduleScriptMap.ProjectID, "|",
                                        moduleScriptMap.TransactionID, "|",
                                        moduleScriptMap.ScriptID
                                    );

                                    lock (ScriptMappings)
                                    {
                                        if (functionScriptContract.Header.LanguageType == "csharp")
                                        {
                                            var runner = Runner.Instance;
                                            runner.FileAssemblyCache.Remove(functionScriptFile);
                                        }

                                        if (ScriptMappings.ContainsKey(queryID) == false)
                                        {
                                            ScriptMappings.Add(queryID, moduleScriptMap);
                                        }
                                        else if (forceUpdate == true)
                                        {
                                            ScriptMappings.Remove(queryID);
                                            ScriptMappings.Add(queryID, moduleScriptMap);
                                        }
                                        else
                                        {
                                            logger.Warning("[{LogCategory}] " + $"ScriptMap 정보 중복 확인 필요 - {filePath}, ApplicationID - {moduleScriptMap.ApplicationID}, ProjectID - {moduleScriptMap.ProjectID}, TransactionID - {moduleScriptMap.TransactionID}, ScriptID - {moduleScriptMap.ScriptID}", "FunctionMapper/AddScriptMap");
                                        }
                                    }
                                }
                            }
                        }
                        else
                        {
                            logger.Error("[{LogCategory}] " + $"functionFilePath 파일 없음 - " + functionScriptFile, "FunctionMapper/AddScriptMap");
                        }

                        result = true;
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - {exception.ToMessage()}", "FunctionMapper/AddScriptMap");
            }

            return result;
        }

        public static void LoadContract(string environmentName, ILogger logger, IConfiguration configuration)
        {
            try
            {
                if (ModuleConfiguration.ContractBasePath.Count == 0)
                {
                    ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBasePath($"../contracts/{ModuleConfiguration.ModuleID}"));
                }

                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == false || basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                    {
                        continue;
                    }

                    logger.Information("[{LogCategory}] ContractBasePath: " + basePath, "FunctionMapper/LoadContract");

                    string[] scriptMapFiles = Directory.GetFiles(basePath, "featureMeta.json", SearchOption.AllDirectories);

                    foreach (string scriptMapFile in scriptMapFiles)
                    {
                        string functionScriptFile;
                        try
                        {
                            if (File.Exists(scriptMapFile) == false)
                            {
                                logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/LoadContract");
                                continue;
                            }

                            FunctionScriptContract? functionScriptContract = FunctionScriptContract.FromJson(File.ReadAllText(scriptMapFile));

                            if (functionScriptContract == null)
                            {
                                logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/LoadContract");
                                continue;
                            }

                            string? fileExtension = null;
                            switch (functionScriptContract.Header.LanguageType)
                            {
                                case "javascript":
                                    fileExtension = "js";
                                    break;
                                case "csharp":
                                    fileExtension = "cs";
                                    break;
                            }

                            if (string.IsNullOrEmpty(fileExtension) == true)
                            {
                                logger.Error("[{LogCategory}] " + $"{functionScriptContract.Header.LanguageType} 언어 타입 확인 필요", "FunctionMapper/LoadContract");
                                continue;
                            }

                            functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                            if (File.Exists(functionScriptFile) == true)
                            {
                                FunctionHeader header = functionScriptContract.Header;
              
                                var items = functionScriptContract.Commands;
                                foreach (var item in items)
                                {
                                    if (header.Use == true)
                                    {
                                        ModuleScriptMap moduleScriptMap = new ModuleScriptMap();
                                        moduleScriptMap.ApplicationID = header.ApplicationID;
                                        moduleScriptMap.ProjectID = header.ProjectID;
                                        moduleScriptMap.TransactionID = header.TransactionID;
                                        moduleScriptMap.ScriptID = item.ID + item.Seq.ToString().PadLeft(2, '0');
                                        moduleScriptMap.ExportName = item.ID;
                                        moduleScriptMap.Seq = item.Seq;
                                        moduleScriptMap.IsHttpContext = header.IsHttpContext;
                                        moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

                                        if (string.IsNullOrEmpty(item.EntryType) == true)
                                        {
                                            moduleScriptMap.EntryType = $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}";
                                        }
                                        else
                                        {
                                            moduleScriptMap.EntryType = item.EntryType;
                                        }

                                        if (string.IsNullOrEmpty(item.EntryType) == true)
                                        {
                                            moduleScriptMap.EntryMethod = item.ID;
                                        }
                                        else
                                        {
                                            moduleScriptMap.EntryMethod = item.EntryMethod;
                                        }

                                        moduleScriptMap.DataSourceID = header.DataSourceID;
                                        moduleScriptMap.LanguageType = header.LanguageType;
                                        moduleScriptMap.ProgramPath = functionScriptFile;
                                        moduleScriptMap.Timeout = item.Timeout;
                                        moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                                        moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                                        moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                                        moduleScriptMap.Comment = item.Comment;

                                        moduleScriptMap.ModuleParameters = new List<ModuleParameterMap>();
                                        List<FunctionParam> functionParams = item.Params;
                                        if (functionParams != null && functionParams.Count > 0)
                                        {
                                            foreach (FunctionParam functionParam in functionParams)
                                            {
                                                moduleScriptMap.ModuleParameters.Add(new ModuleParameterMap()
                                                {
                                                    Name = functionParam.ID,
                                                    DbType = functionParam.Type,
                                                    Length = functionParam.Length,
                                                    DefaultValue = functionParam.Value,
                                                });
                                            }
                                        }

                                        string queryID = string.Concat(
                                            moduleScriptMap.ApplicationID, "|",
                                            moduleScriptMap.ProjectID, "|",
                                            moduleScriptMap.TransactionID, "|",
                                            moduleScriptMap.ScriptID
                                        );

                                        lock (ScriptMappings)
                                        {
                                            if (ScriptMappings.ContainsKey(queryID) == false)
                                            {
                                                ScriptMappings.Add(queryID, moduleScriptMap, TimeSpan.FromDays(3650));
                                            }
                                            else
                                            {
                                                logger.Warning("[{LogCategory}] " + $"ScriptMap 정보 중복 확인 필요 - {scriptMapFile}, ApplicationID - {moduleScriptMap.ApplicationID}, ProjectID - {moduleScriptMap.ProjectID}, TransactionID - {moduleScriptMap.TransactionID}, ScriptID - {moduleScriptMap.ScriptID}", "FunctionMapper/LoadContract");
                                            }
                                        }
                                    }
                                }
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/LoadContract");
                            }
                        }
                        catch (Exception exception)
                        {
                            logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - {exception.ToMessage()}", "FunctionMapper/LoadContract");
                        }
                    }
                }

                foreach (var item in ModuleConfiguration.FunctionSource)
                {
                    string projectIDText = item.ProjectID;
                    var projectIDList = projectIDText.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList();

                    if (projectIDList.Count > 0)
                    {
                        string dataSourceID = $"{item.ApplicationID}|{item.DataSourceID}";
                        if (FunctionSourceMappings.ContainsKey(dataSourceID) == false)
                        {
                            var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), item.DataProvider);
                            var connectionString = item.ConnectionString;

                            if (item.IsEncryption.ParseBool() == true)
                            {
                                connectionString = DecryptConnectionString(item);
                            }

                            if (dataProvider == DataProviders.SQLite)
                            {
                                if (connectionString.IndexOf("#{ContentRootPath}") > -1)
                                {
                                    connectionString = connectionString.Replace("#{ContentRootPath}", GlobalConfiguration.ContentRootPath);
                                }
                            }

                            if (Directory.Exists(item.WorkingDirectoryPath) == false)
                            {
                                Directory.CreateDirectory(item.WorkingDirectoryPath);
                            }

                            FunctionSourceMappings.Add(dataSourceID, new ModuleSourceMap()
                            {
                                DataSourceID = item.DataSourceID,
                                ProjectListID = projectIDList,
                                DataProvider = dataProvider,
                                ConnectionString = connectionString,
                                WorkingDirectoryPath = item.WorkingDirectoryPath
                            }, TimeSpan.FromDays(3650));
                        }
                        else
                        {
                            logger.Warning("[{LogCategory}] " + $"DataSourceID 중복 확인 필요 - {dataSourceID}", "FunctionMapper/LoadContract");
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"LoadContract 오류 - {exception.ToMessage()}", "FunctionMapper/LoadContract");
            }
        }

        public static string DecryptConnectionString(FunctionSource? functionSource)
        {
            string result = "";
            if (functionSource != null)
            {
                try
                {
                    var values = functionSource.ConnectionString.SplitAndTrim('.');

                    string encrypt = values[0];
                    string decryptKey = values[1];
                    string hostName = values[2];
                    string hash = values[3];

                    if ($"{encrypt}.{decryptKey}.{hostName}".ToSHA256() == hash)
                    {
                        decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').Substring(0, 32);
                        result = encrypt.DecryptAES(decryptKey);
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error("[{LogCategory}] " + $"FunctionSource: {JsonConvert.SerializeObject(functionSource)} 확인 필요: " + exception.ToMessage(), "DatabaseMapper/DecryptConnectionString");
                }
            }

            return result;
        }

        public static string DecryptConnectionString(ModuleSourceMap? moduleSourceMap)
        {
            string result = "";
            if (moduleSourceMap != null)
            {
                try
                {
                    var values = moduleSourceMap.ConnectionString.SplitAndTrim('.');

                    string encrypt = values[0];
                    string decryptKey = values[1];
                    string hostName = values[2];
                    string hash = values[3];

                    if ($"{encrypt}.{decryptKey}.{hostName}".ToSHA256() == hash)
                    {
                        decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').Substring(0, 32);
                        result = encrypt.DecryptAES(decryptKey);
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error("[{LogCategory}] " + $"ModuleSourceMap: {JsonConvert.SerializeObject(moduleSourceMap)} 확인 필요: " + exception.ToMessage(), "DatabaseMapper/DecryptConnectionString");
                }
            }

            return result;
        }
    }
}
