using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

using function.Builder;
using function.Entity;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
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
                var functionSourceMappingsKey = $"{applicationID}|{dataSourceID}";
                result = FunctionSourceMappings.FirstOrDefault(item => item.Key == functionSourceMappingsKey
                    && (item.Value.ProjectListID.IndexOf(projectID) > -1 || item.Value.ProjectListID.IndexOf("*") > -1)).Value;

                if (result == null)
                {
                    var userWorkID = string.Empty;
                    var appBasePath = string.Empty;
                    var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                    var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                    foreach (var directory in directories)
                    {
                        var directoryInfo = new DirectoryInfo(directory);
                        if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                        {
                            appBasePath = directoryInfo.FullName.Replace("\\", "/");
                            userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                            break;
                        }
                    }

                    var tenantID = $"{userWorkID}|{applicationID}";
                    if (Directory.Exists(appBasePath) == true)
                    {
                        var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                        if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                        {
                            var appSettingText = File.ReadAllText(settingFilePath);
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
                                        var projects = item.GetStringSafe("ProjectID").SplitComma();
                                        var dataProvider = item.GetStringSafe("DataProvider");
                                        var connectionString = item.GetStringSafe("ConnectionString");
                                        if (projects.IndexOf(projectID) > -1 || projects.IndexOf("*") > -1)
                                        {
                                            if (FunctionSourceMappings.ContainsKey(functionSourceMappingsKey) == false)
                                            {
                                                var moduleSourceMap = new ModuleSourceMap();
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

                                                var workingDirectoryPath = PathExtensions.Combine(appBasePath, "function", "working", projectID, transactionID);
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
                    var applicationID = itemKeys[0];
                    var projectID = itemKeys[1];
                    var transactionID = itemKeys[2];

                    var filePath = string.Empty;
                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                    {
                        var scriptMapFile = PathExtensions.Join(basePath, applicationID, projectID, transactionID, "featureMeta.json");
                        if (File.Exists(scriptMapFile) == true)
                        {
                            filePath = scriptMapFile;
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
                        var userWorkID = string.Empty;
                        var appBasePath = string.Empty;
                        var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                        var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                        foreach (var directory in directories)
                        {
                            var directoryInfo = new DirectoryInfo(directory);
                            if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                            {
                                appBasePath = directoryInfo.FullName.Replace("\\", "/");
                                userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                                break;
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(appBasePath))
                        {
                            var tenantID = $"{userWorkID}|{applicationID}";
                            var scriptMapFile = PathExtensions.Combine(appBasePath, "function", projectID, transactionID, "featureMeta.json");
                            if (File.Exists(scriptMapFile) == true)
                            {
                                filePath = scriptMapFile;
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

                    var configData = System.IO.File.ReadAllText(scriptMapFile);

                    JsonNode? root = JsonNode.Parse(configData, documentOptions: new JsonDocumentOptions
                    {
                        CommentHandling = JsonCommentHandling.Skip,
                        AllowTrailingCommas = true
                    });
                    if (root is JsonObject rootNode)
                    {
                        var hasSignatureKey = rootNode.TryGetPropertyValue("SignatureKey", out var signatureKeyNode) && signatureKeyNode is JsonValue;
                        var hasEncrypt = rootNode.TryGetPropertyValue("EncryptCommands", out var encryptNode) && encryptNode is JsonValue;
                        if (hasSignatureKey == true && hasEncrypt == true)
                        {
                            var signatureKey = signatureKeyNode!.GetValue<string>();
                            var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                            if (licenseItem == null)
                            {
                                Log.Logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - 서명 키 불일치", "FunctionMapper/MergeContractFile");
                                return;
                            }

                            var cipher = encryptNode!.GetValue<string>();
                            var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                            JsonNode? restored;
                            try
                            {
                                restored = JsonNode.Parse(plain);

                                if (restored is not JsonArray restoredArr)
                                {
                                    Log.Logger.Error("[{LogCategory}] " + $"Decrypted Services는 {scriptMapFile} 내의 JSON 배열이 아닙니다.", "FunctionMapper/MergeContractFile");
                                    return;
                                }

                                rootNode["Services"] = restoredArr;
                            }
                            catch (Exception exception)
                            {
                                Log.Logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {scriptMapFile}", "FunctionMapper/MergeContractFile");
                                return;
                            }

                            rootNode.Remove("SignatureKey");
                            rootNode.Remove("EncryptCommands");

                            configData = rootNode.ToJsonString();
                        }
                    }

                    var functionScriptContract = FunctionScriptContract.FromJson(configData);
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
                        case "python":
                            fileExtension = "py";
                            break;
                    }

                    if (string.IsNullOrWhiteSpace(fileExtension))
                    {
                        Log.Logger.Error("[{LogCategory}] " + $"{scriptMapFile} 언어 타입 확인 필요", "FunctionMapper/MergeContractFile");
                        return;
                    }

                    var functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                    if (File.Exists(functionScriptFile) == true)
                    {
                        var fileInfo = new FileInfo(scriptMapFile);
                        var header = functionScriptContract.Header;
                        var isTenantContractFile = false;
                        if (scriptMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                        {
                            isTenantContractFile = true;
                            header.ApplicationID = string.IsNullOrWhiteSpace(header.ApplicationID) ? (fileInfo.Directory?.Parent?.Parent?.Parent?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                            header.ProjectID = string.IsNullOrWhiteSpace(header.ProjectID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ProjectID;
                            header.TransactionID = string.IsNullOrWhiteSpace(header.TransactionID) ? (fileInfo.Directory?.Name).ToStringSafe().Replace(fileInfo.Extension, "") : header.TransactionID;
                        }
                        else
                        {
                            header.ApplicationID = string.IsNullOrWhiteSpace(header.ApplicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                            header.ProjectID = string.IsNullOrWhiteSpace(header.ProjectID) ? (fileInfo.Directory?.Name).ToStringSafe() : header.ProjectID;
                            header.TransactionID = string.IsNullOrWhiteSpace(header.TransactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : header.TransactionID;
                        }

                        var items = functionScriptContract.Commands;
                        foreach (var item in items)
                        {
                            if (header.Use == true)
                            {
                                var moduleScriptMap = new ModuleScriptMap();
                                moduleScriptMap.ApplicationID = header.ApplicationID;
                                moduleScriptMap.ProjectID = header.ProjectID;
                                moduleScriptMap.TransactionID = header.TransactionID;
                                moduleScriptMap.ScriptID = item.ID + item.Seq.ToString().PadLeft(2, '0');
                                moduleScriptMap.ExportName = item.ID;
                                moduleScriptMap.Seq = item.Seq;
                                moduleScriptMap.IsHttpContext = header.IsHttpContext;
                                moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

                                if (string.IsNullOrWhiteSpace(item.EntryType))
                                {
                                    moduleScriptMap.EntryType = $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}";
                                }
                                else
                                {
                                    moduleScriptMap.EntryType = item.EntryType;
                                }

                                if (string.IsNullOrWhiteSpace(item.EntryType))
                                {
                                    moduleScriptMap.EntryMethod = item.ID;
                                }
                                else
                                {
                                    moduleScriptMap.EntryMethod = item.EntryMethod;
                                }

                                moduleScriptMap.DataSourceID = !string.IsNullOrWhiteSpace(header.DataSourceID) ? header.DataSourceID : ModuleConfiguration.DefaultDataSourceID;
                                moduleScriptMap.LanguageType = header.LanguageType;
                                moduleScriptMap.ProgramPath = functionScriptFile;
                                moduleScriptMap.Timeout = item.Timeout;
                                moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                                moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                                moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                                moduleScriptMap.Comment = item.Comment;

                                moduleScriptMap.ModuleParameters = new List<ModuleParameterMap>();
                                var functionParams = item.Params;
                                if (functionParams != null && functionParams.Count > 0)
                                {
                                    foreach (var functionParam in functionParams)
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

                                var mappingQueryID = string.Concat(
                                    moduleScriptMap.ApplicationID, "|",
                                    moduleScriptMap.ProjectID, "|",
                                    moduleScriptMap.TransactionID, "|",
                                    moduleScriptMap.ScriptID
                                );

                                if (ScriptMappings.ContainsKey(mappingQueryID) == false)
                                {
                                    if (isTenantContractFile == true)
                                    {
                                        ScriptMappings.Add(mappingQueryID, moduleScriptMap);
                                    }
                                    else
                                    {
                                        ScriptMappings.Add(mappingQueryID, moduleScriptMap, TimeSpan.FromDays(36500));
                                    }
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
            var result = false;
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                var filePath = PathExtensions.Join(basePath, fileRelativePath);
                result = File.Exists(filePath);
                if (result == true)
                {
                    break;
                }
            }

            return result;
        }


        public static bool Remove(string projectID, string businessID, string transactionID, string scriptID)
        {
            var result = false;
            lock (ScriptMappings)
            {
                var queryID = string.Concat(
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
            var result = false;
            var queryID = string.Concat(
                applicationID, "|",
                projectID, "|",
                transactionID, "|",
                scriptID
            );

            result = ScriptMappings.ContainsKey(queryID);

            return result;
        }

        public static bool AddScriptMap(string scriptFilePath, bool forceUpdate, ILogger logger)
        {
            var result = false;

            try
            {
                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (scriptFilePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && GlobalConfiguration.IsTenantFunction == false)
                    {
                        return result;
                    }

                    var scriptMapFile = PathExtensions.Join(basePath, scriptFilePath);
                    if (File.Exists(scriptMapFile) == true)
                    {
                        var configData = System.IO.File.ReadAllText(scriptMapFile);

                        JsonNode? root = JsonNode.Parse(configData, documentOptions: new JsonDocumentOptions
                        {
                            CommentHandling = JsonCommentHandling.Skip,
                            AllowTrailingCommas = true
                        });
                        if (root is JsonObject rootNode)
                        {
                            var hasSignatureKey = rootNode.TryGetPropertyValue("SignatureKey", out var signatureKeyNode) && signatureKeyNode is JsonValue;
                            var hasEncrypt = rootNode.TryGetPropertyValue("EncryptCommands", out var encryptNode) && encryptNode is JsonValue;
                            if (hasSignatureKey == true && hasEncrypt == true)
                            {
                                var signatureKey = signatureKeyNode!.GetValue<string>();
                                var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                if (licenseItem == null)
                                {
                                    logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - 서명 키 불일치", "FunctionMapper/AddScriptMap");
                                    continue;
                                }

                                var cipher = encryptNode!.GetValue<string>();
                                var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                JsonNode? restored;
                                try
                                {
                                    restored = JsonNode.Parse(plain);

                                    if (restored is not JsonArray restoredArr)
                                    {
                                        logger.Error("[{LogCategory}] " + $"Decrypted Services는 {scriptMapFile} 내의 JSON 배열이 아닙니다.", "FunctionMapper/AddScriptMap");
                                        continue;
                                    }

                                    rootNode["Services"] = restoredArr;
                                }
                                catch (Exception exception)
                                {
                                    logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {scriptMapFile}", "FunctionMapper/AddScriptMap");
                                    continue;
                                }

                                rootNode.Remove("SignatureKey");
                                rootNode.Remove("EncryptCommands");

                                configData = rootNode.ToJsonString();
                            }
                        }

                        var functionScriptContract = FunctionScriptContract.FromJson(configData);
                        if (functionScriptContract == null)
                        {
                            logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/AddScriptMap");
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
                            case "python":
                                fileExtension = "py";
                                break;
                        }

                        if (string.IsNullOrWhiteSpace(fileExtension))
                        {
                            logger.Error("[{LogCategory}] " + $"{scriptFilePath} 언어 타입 확인 필요", "FunctionMapper/AddScriptMap");
                            continue;
                        }

                        var functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                        if (File.Exists(functionScriptFile) == true)
                        {
                            var header = functionScriptContract.Header;
                            var isTenantContractFile = false;
                            if (scriptMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                            {
                                isTenantContractFile = true;
                                var fileInfo = new FileInfo(scriptMapFile);
                                header.ApplicationID = string.IsNullOrWhiteSpace(header.ApplicationID) ? (fileInfo.Directory?.Parent?.Parent?.Parent?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                                header.ProjectID = string.IsNullOrWhiteSpace(header.ProjectID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ProjectID;
                                header.TransactionID = string.IsNullOrWhiteSpace(header.TransactionID) ? (fileInfo.Directory?.Name).ToStringSafe().Replace(fileInfo.Extension, "") : header.TransactionID;
                            }

                            var items = functionScriptContract.Commands;
                            foreach (var item in items)
                            {
                                if (header.Use == true)
                                {
                                    var moduleScriptMap = new ModuleScriptMap();
                                    moduleScriptMap.ApplicationID = header.ApplicationID;
                                    moduleScriptMap.ProjectID = header.ProjectID;
                                    moduleScriptMap.TransactionID = header.TransactionID;
                                    moduleScriptMap.ScriptID = item.ID + item.Seq.ToString().PadLeft(2, '0');
                                    moduleScriptMap.ExportName = item.ID;
                                    moduleScriptMap.Seq = item.Seq;
                                    moduleScriptMap.IsHttpContext = header.IsHttpContext;
                                    moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

                                    if (string.IsNullOrWhiteSpace(item.EntryType))
                                    {
                                        moduleScriptMap.EntryType = $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}";
                                    }
                                    else
                                    {
                                        moduleScriptMap.EntryType = item.EntryType;
                                    }

                                    if (string.IsNullOrWhiteSpace(item.EntryType))
                                    {
                                        moduleScriptMap.EntryMethod = item.ID;
                                    }
                                    else
                                    {
                                        moduleScriptMap.EntryMethod = item.EntryMethod;
                                    }

                                    moduleScriptMap.DataSourceID = !string.IsNullOrWhiteSpace(header.DataSourceID) ? header.DataSourceID : ModuleConfiguration.DefaultDataSourceID;
                                    moduleScriptMap.LanguageType = header.LanguageType;
                                    moduleScriptMap.ProgramPath = functionScriptFile;
                                    moduleScriptMap.Timeout = item.Timeout;
                                    moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                                    moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                                    moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                                    moduleScriptMap.Comment = item.Comment;

                                    moduleScriptMap.ModuleParameters = new List<ModuleParameterMap>();
                                    var functionParams = item.Params;
                                    if (functionParams != null && functionParams.Count > 0)
                                    {
                                        foreach (var functionParam in functionParams)
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

                                    var queryID = string.Concat(
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
                                        else if (functionScriptContract.Header.LanguageType == "python")
                                        {
                                            deletePythonCache(functionScriptFile, moduleScriptMap);
                                        }

                                        if (ScriptMappings.ContainsKey(queryID) == false)
                                        {
                                            if (isTenantContractFile == true)
                                            {
                                                ScriptMappings.Add(queryID, moduleScriptMap);
                                            }
                                            else
                                            {
                                                ScriptMappings.Add(queryID, moduleScriptMap, TimeSpan.FromDays(36500));
                                            }
                                        }
                                        else if (forceUpdate == true)
                                        {
                                            ScriptMappings.Remove(queryID);
                                            if (isTenantContractFile == true)
                                            {
                                                ScriptMappings.Add(queryID, moduleScriptMap);
                                            }
                                            else
                                            {
                                                ScriptMappings.Add(queryID, moduleScriptMap, TimeSpan.FromDays(36500));
                                            }
                                        }
                                        else
                                        {
                                            logger.Warning("[{LogCategory}] " + $"ScriptMap 정보 중복 확인 필요 - {scriptMapFile}, ApplicationID - {moduleScriptMap.ApplicationID}, ProjectID - {moduleScriptMap.ProjectID}, TransactionID - {moduleScriptMap.TransactionID}, ScriptID - {moduleScriptMap.ScriptID}", "FunctionMapper/AddScriptMap");
                                        }
                                    }
                                }
                            }
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] " + $"functionFilePath 파일 없음 - " + functionScriptFile, "FunctionMapper/AddScriptMap");
                        }

                        result = true;
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"{scriptFilePath} 업무 계약 파일 오류 - {exception.ToMessage()}", "FunctionMapper/AddScriptMap");
            }

            return result;
        }

        private static void deletePythonCache(string functionScriptFile, ModuleScriptMap moduleScriptMap)
        {
            var functionDirectoryPath = Path.GetDirectoryName(functionScriptFile)!;
            var transactionID = new DirectoryInfo(functionDirectoryPath).Name;
            var moduleName = $"{moduleScriptMap.ApplicationID}_{moduleScriptMap.ProjectID}_{moduleScriptMap.TransactionID}";
            var mainFilePath = functionScriptFile.Replace("featureMain.py", $"{moduleName}.py");
            if (File.Exists(mainFilePath) == false)
            {
                File.Delete(mainFilePath);
            }

            var pythonCachePath = PathExtensions.Combine(functionDirectoryPath, "__pycache__");
            if (Directory.Exists(pythonCachePath) == true)
            {
                Directory.Delete(pythonCachePath, true);
            }
        }

        public static void LoadContract(string environmentName, ILogger logger, IConfiguration configuration)
        {
            try
            {
                if (ModuleConfiguration.ContractBasePath.Count == 0)
                {
                    ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBaseDirectoryPath($"../contracts/{ModuleConfiguration.ModuleID}"));
                }

                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == false || basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                    {
                        continue;
                    }

                    logger.Information("[{LogCategory}] ContractBasePath: " + basePath, "FunctionMapper/LoadContract");

                    var scriptMapFiles = Directory.GetFiles(basePath, "featureMeta.json", SearchOption.AllDirectories);

                    foreach (var scriptMapFile in scriptMapFiles)
                    {
                        string functionScriptFile;
                        try
                        {
                            if (File.Exists(scriptMapFile) == false)
                            {
                                logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/LoadContract");
                                continue;
                            }

                            var configData = System.IO.File.ReadAllText(scriptMapFile);

                            JsonNode? root = JsonNode.Parse(configData, documentOptions: new JsonDocumentOptions
                            {
                                CommentHandling = JsonCommentHandling.Skip,
                                AllowTrailingCommas = true
                            });
                            if (root is JsonObject rootNode)
                            {
                                var hasSignatureKey = rootNode.TryGetPropertyValue("SignatureKey", out var signatureKeyNode) && signatureKeyNode is JsonValue;
                                var hasEncrypt = rootNode.TryGetPropertyValue("EncryptCommands", out var encryptNode) && encryptNode is JsonValue;
                                if (hasSignatureKey == true && hasEncrypt == true)
                                {
                                    var signatureKey = signatureKeyNode!.GetValue<string>();
                                    var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                    if (licenseItem == null)
                                    {
                                        logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - 서명 키 불일치", "FunctionMapper/LoadContract");
                                        continue;
                                    }

                                    var cipher = encryptNode!.GetValue<string>();
                                    var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                    JsonNode? restored;
                                    try
                                    {
                                        restored = JsonNode.Parse(plain);

                                        if (restored is not JsonArray restoredArr)
                                        {
                                            logger.Error("[{LogCategory}] " + $"Decrypted Services는 {scriptMapFile} 내의 JSON 배열이 아닙니다.", "FunctionMapper/LoadContract");
                                            continue;
                                        }

                                        rootNode["Services"] = restoredArr;
                                    }
                                    catch (Exception exception)
                                    {
                                        logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {scriptMapFile}", "FunctionMapper/LoadContract");
                                        continue;
                                    }

                                    rootNode.Remove("SignatureKey");
                                    rootNode.Remove("EncryptCommands");

                                    configData = rootNode.ToJsonString();
                                }
                            }

                            var functionScriptContract = FunctionScriptContract.FromJson(configData);
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
                                case "python":
                                    fileExtension = "py";
                                    break;
                            }

                            if (string.IsNullOrWhiteSpace(fileExtension))
                            {
                                logger.Error("[{LogCategory}] " + $"{scriptMapFile} 언어 타입 확인 필요", "FunctionMapper/LoadContract");
                                continue;
                            }

                            functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                            if (File.Exists(functionScriptFile) == true)
                            {
                                var header = functionScriptContract.Header;

                                var items = functionScriptContract.Commands;
                                foreach (var item in items)
                                {
                                    if (header.Use == true)
                                    {
                                        var moduleScriptMap = new ModuleScriptMap();
                                        moduleScriptMap.ApplicationID = header.ApplicationID;
                                        moduleScriptMap.ProjectID = header.ProjectID;
                                        moduleScriptMap.TransactionID = header.TransactionID;
                                        moduleScriptMap.ScriptID = item.ID + item.Seq.ToString().PadLeft(2, '0');
                                        moduleScriptMap.ExportName = item.ID;
                                        moduleScriptMap.Seq = item.Seq;
                                        moduleScriptMap.IsHttpContext = header.IsHttpContext;
                                        moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

                                        if (string.IsNullOrWhiteSpace(item.EntryType))
                                        {
                                            moduleScriptMap.EntryType = $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}";
                                        }
                                        else
                                        {
                                            moduleScriptMap.EntryType = item.EntryType;
                                        }

                                        if (string.IsNullOrWhiteSpace(item.EntryType))
                                        {
                                            moduleScriptMap.EntryMethod = item.ID;
                                        }
                                        else
                                        {
                                            moduleScriptMap.EntryMethod = item.EntryMethod;
                                        }

                                        moduleScriptMap.DataSourceID = !string.IsNullOrWhiteSpace(header.DataSourceID) ? header.DataSourceID : ModuleConfiguration.DefaultDataSourceID;
                                        moduleScriptMap.LanguageType = header.LanguageType;
                                        moduleScriptMap.ProgramPath = functionScriptFile;
                                        moduleScriptMap.Timeout = item.Timeout;
                                        moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                                        moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                                        moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                                        moduleScriptMap.Comment = item.Comment;

                                        moduleScriptMap.ModuleParameters = new List<ModuleParameterMap>();
                                        var functionParams = item.Params;
                                        if (functionParams != null && functionParams.Count > 0)
                                        {
                                            foreach (var functionParam in functionParams)
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

                                        var queryID = string.Concat(
                                            moduleScriptMap.ApplicationID, "|",
                                            moduleScriptMap.ProjectID, "|",
                                            moduleScriptMap.TransactionID, "|",
                                            moduleScriptMap.ScriptID
                                        );

                                        lock (ScriptMappings)
                                        {
                                            if (ScriptMappings.ContainsKey(queryID) == false)
                                            {
                                                if (functionScriptContract.Header.LanguageType == "python")
                                                {
                                                    deletePythonCache(functionScriptFile, moduleScriptMap);
                                                }

                                                ScriptMappings.Add(queryID, moduleScriptMap, TimeSpan.FromDays(36500));
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
                    var projectIDText = item.ProjectID;
                    var projectIDList = projectIDText.Split(",").Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList();

                    if (projectIDList.Count > 0)
                    {
                        var dataSourceID = $"{item.ApplicationID}|{item.DataSourceID}";
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
                            }, TimeSpan.FromDays(36500));
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
            var result = "";
            if (functionSource != null)
            {
                try
                {
                    var values = functionSource.ConnectionString.SplitAndTrim('.');

                    var encrypt = values[0];
                    var decryptKey = values[1];
                    var hostName = values[2];
                    var hash = values[3];

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
            var result = "";
            if (moduleSourceMap != null)
            {
                try
                {
                    var values = moduleSourceMap.ConnectionString.SplitAndTrim('.');

                    var encrypt = values[0];
                    var decryptKey = values[1];
                    var hostName = values[2];
                    var hash = values[3];

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

