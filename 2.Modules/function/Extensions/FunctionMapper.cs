using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Xml.Linq;

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
                ScriptMappings.TryGetValue(queryID, out result);

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

                        ScriptMappings.TryGetValue(queryID, out result);
                        if (result != null)
                        {
                            break;
                        }

                        foreach (var extension in ModuleConfiguration.ContractFileExtensions)
                        {
                            var xmlFilePath = PathExtensions.Join(basePath, applicationID, projectID, transactionID + extension);
                            if (File.Exists(xmlFilePath) == true)
                            {
                                MergeXmlContractFile(xmlFilePath, false, Log.Logger);
                                ScriptMappings.TryGetValue(queryID, out result);
                                if (result != null)
                                {
                                    break;
                                }
                            }
                        }

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

                            ScriptMappings.TryGetValue(queryID, out result);

                            if (result == null)
                            {
                                foreach (var extension in ModuleConfiguration.ContractFileExtensions)
                                {
                                    var tenantXmlFilePath = PathExtensions.Combine(appBasePath, "function", projectID, transactionID + extension);
                                    if (File.Exists(tenantXmlFilePath) == true)
                                    {
                                        MergeXmlContractFile(tenantXmlFilePath, false, Log.Logger);
                                        ScriptMappings.TryGetValue(queryID, out result);
                                        if (result != null)
                                        {
                                            break;
                                        }
                                    }
                                }
                            }
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
                                moduleScriptMap.Description = item.Description;
                                moduleScriptMap.OutputMetas = new List<string>(item.OutputMetas);

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
                                            IsRequired = functionParam.IsRequired,
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
                var scriptMapFiles = Path.IsPathRooted(scriptFilePath) == true
                    ? new List<string> { scriptFilePath }
                    : ModuleConfiguration.ContractBasePath.Select(basePath => PathExtensions.Join(basePath, scriptFilePath)).ToList();

                foreach (var scriptMapFile in scriptMapFiles)
                {
                    if (scriptFilePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && GlobalConfiguration.IsTenantFunction == false)
                    {
                        return result;
                    }

                    if (File.Exists(scriptMapFile) == true)
                    {
                        if (ModuleConfiguration.IsContractFileExtension(Path.GetExtension(scriptMapFile)) == true
                            && Path.GetFileName(scriptMapFile).Equals("featureSQL.xml", StringComparison.OrdinalIgnoreCase) == false)
                        {
                            result = MergeXmlContractFile(scriptMapFile, forceUpdate, logger);
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
                                    moduleScriptMap.Description = item.Description;
                                    moduleScriptMap.OutputMetas = new List<string>(item.OutputMetas);

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
                                                IsRequired = functionParam.IsRequired,
                                                DefaultValue = functionParam.Value
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
                                                runner.FileAssemblyCache.TryRemove(functionScriptFile, out _);
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
            var mainFilePath = PathExtensions.Combine(functionDirectoryPath, $"{moduleName}.py");
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

        // command/graphclient 모듈과 동일하게 xmlns="contract.xsd" 기본 네임스페이스를 무시하고 LocalName 으로 매칭
        private static IEnumerable<XElement> XmlDescendants(XContainer? container, string localName)
        {
            return container == null
                ? Enumerable.Empty<XElement>()
                : container.Descendants().Where(item => item.Name.LocalName.Equals(localName, StringComparison.OrdinalIgnoreCase));
        }

        private static IEnumerable<XElement> XmlChildren(XContainer? container, string localName)
        {
            return container == null
                ? Enumerable.Empty<XElement>()
                : container.Elements().Where(item => item.Name.LocalName.Equals(localName, StringComparison.OrdinalIgnoreCase));
        }

        private static XElement? XmlChild(XContainer? container, string localName)
        {
            return XmlChildren(container, localName).FirstOrDefault();
        }

        private static string XmlElementValue(XContainer? container, string localName)
        {
            return XmlChild(container, localName)?.Value.ToStringSafe().Trim() ?? "";
        }

        private static string XmlElementMarkup(XElement? element)
        {
            if (element == null)
            {
                return "";
            }

            if (element.Elements().Any() == false)
            {
                return element.Value.Trim('\r', '\n');
            }

            return string.Join(Environment.NewLine, element.Elements().Select(item => item.ToString(SaveOptions.DisableFormatting))).Trim();
        }

        private static string XmlAttributeValue(XElement? element, string localName)
        {
            if (element == null)
            {
                return "";
            }

            return element.Attributes().FirstOrDefault(item => item.Name.LocalName.Equals(localName, StringComparison.OrdinalIgnoreCase))?.Value.ToStringSafe().Trim() ?? "";
        }

        // command/dbclient/graphclient 모듈과 동일하게 {TransactionID}.xml/.fnc 단일 파일로 관리되는 계약을 파싱
        // <mapper><header>...</header><script><![CDATA[ ... ]]></script><featureSQL><![CDATA[ ... ]]></featureSQL><commands><command>...</command></commands></mapper>
        private static (FunctionScriptContract Contract, string ScriptSource, string FeatureSQLSource) ParseXmlContract(string xmlFilePath)
        {
            var document = XDocument.Load(xmlFilePath, LoadOptions.PreserveWhitespace);
            var root = document.Root;

            var contract = new FunctionScriptContract();
            var headerElement = XmlChild(root, "header");
            contract.Header.ApplicationID = XmlElementValue(headerElement, "application");
            contract.Header.ProjectID = XmlElementValue(headerElement, "project");
            contract.Header.TransactionID = XmlElementValue(headerElement, "transaction");
            contract.Header.DataSourceID = XmlElementValue(headerElement, "datasource");
            contract.Header.LanguageType = XmlElementValue(headerElement, "language");
            contract.Header.ReferenceModuleID = XmlElementValue(headerElement, "referenceModuleID");
            contract.Header.IsHttpContext = XmlElementValue(headerElement, "isHttpContext").ToBoolean(false);
            contract.Header.Use = XmlElementValue(headerElement, "use").ToBoolean(true);
            contract.Header.Comment = XmlElementValue(headerElement, "desc");

            var scriptSource = (XmlChild(root, "script")?.Value ?? "").Trim('\r', '\n');
            var featureSQLSource = XmlElementMarkup(XmlChild(root, "featureSQL"));

            var commandsElement = XmlChild(root, "commands");
            foreach (var commandElement in XmlChildren(commandsElement, "command"))
            {
                var command = new FunctionCommand();
                command.ID = XmlAttributeValue(commandElement, "id");
                command.Seq = XmlAttributeValue(commandElement, "seq").ParseInt(0);
                command.Use = XmlAttributeValue(commandElement, "use").ToBoolean(true);
                command.Timeout = XmlAttributeValue(commandElement, "timeout").ParseInt(0);
                command.Description = XmlAttributeValue(commandElement, "desc");
                command.EntryType = XmlElementValue(commandElement, "entryType");
                command.EntryMethod = XmlElementValue(commandElement, "entryMethod");
                command.BeforeTransaction = XmlElementValue(commandElement, "beforeTransaction");
                command.AfterTransaction = XmlElementValue(commandElement, "afterTransaction");
                command.FallbackTransaction = XmlElementValue(commandElement, "fallbackTransaction");

                foreach (var paramElement in XmlChildren(commandElement, "param"))
                {
                    var typeValue = XmlAttributeValue(paramElement, "type");
                    command.Params.Add(new FunctionParam
                    {
                        ID = XmlAttributeValue(paramElement, "id"),
                        Type = string.IsNullOrWhiteSpace(typeValue) ? "String" : typeValue,
                        Length = XmlAttributeValue(paramElement, "length").ParseInt(-1),
                        Value = XmlAttributeValue(paramElement, "value"),
                        IsRequired = XmlAttributeValue(paramElement, "required").ToBoolean(false)
                    });
                }

                foreach (var outputMetaElement in XmlChildren(commandElement, "outputmeta"))
                {
                    var value = XmlAttributeValue(outputMetaElement, "value");
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        command.OutputMetas.Add(value);
                    }
                }

                contract.Commands.Add(command);
            }

            return (contract, scriptSource, featureSQLSource);
        }

        // JS(Node require)/Python(import) 는 실제 디스크 파일이 필요하므로 <script> CDATA 내용을 xml 옆에 {TransactionID}.g.{ext} 로 물리화
        private static string MaterializeScriptFile(string xmlFilePath, string transactionID, string scriptSource, string fileExtension)
        {
            var directoryPath = Path.GetDirectoryName(xmlFilePath)!;
            var generatedFilePath = PathExtensions.Combine(directoryPath, $"{transactionID}.g.{fileExtension}");
            File.WriteAllText(generatedFilePath, scriptSource);
            return generatedFilePath;
        }

        // 단일 계약 내부의 <featureSQL> 원문은 기존 실행 경로가 요구하는 XML 파일로 물리화한다.
        private static string MaterializeFeatureSQLFile(string xmlFilePath, string transactionID, string featureSQLSource)
        {
            var directoryPath = Path.GetDirectoryName(xmlFilePath)!;
            var generatedFilePath = PathExtensions.Combine(directoryPath, $"{transactionID}.g.featureSQL");
            File.WriteAllText(generatedFilePath, featureSQLSource);
            return generatedFilePath;
        }

        public static bool MergeXmlContractFile(string xmlFilePath, bool forceUpdate, ILogger logger)
        {
            var result = false;

            try
            {
                if (File.Exists(xmlFilePath) == false)
                {
                    logger.Information("[{LogCategory}] " + $"{xmlFilePath} 대응 업무 계약 파일 없음", "FunctionMapper/MergeXmlContractFile");
                    return result;
                }

                if (xmlFilePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && GlobalConfiguration.IsTenantFunction == false)
                {
                    return result;
                }

                var (contract, scriptSource, featureSQLSource) = ParseXmlContract(xmlFilePath);

                string? fileExtension = null;
                switch (contract.Header.LanguageType)
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
                    logger.Error("[{LogCategory}] " + $"{xmlFilePath} 언어 타입 확인 필요", "FunctionMapper/MergeXmlContractFile");
                    return result;
                }

                var header = contract.Header;
                var fileInfo = new FileInfo(xmlFilePath);
                var isTenantContractFile = xmlFilePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true;
                if (isTenantContractFile == true)
                {
                    // 테넌트 경로: {appBasePath:.../applicationID}/function/{projectID}/{transactionID}.xml|.fnc
                    header.ApplicationID = string.IsNullOrWhiteSpace(header.ApplicationID) ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                    header.ProjectID = string.IsNullOrWhiteSpace(header.ProjectID) ? (fileInfo.Directory?.Name).ToStringSafe() : header.ProjectID;
                    header.TransactionID = string.IsNullOrWhiteSpace(header.TransactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : header.TransactionID;
                }
                else
                {
                    // 일반 경로: {ContractBasePath}/{applicationID}/{projectID}/{transactionID}.xml|.fnc
                    header.ApplicationID = string.IsNullOrWhiteSpace(header.ApplicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                    header.ProjectID = string.IsNullOrWhiteSpace(header.ProjectID) ? (fileInfo.Directory?.Name).ToStringSafe() : header.ProjectID;
                    header.TransactionID = string.IsNullOrWhiteSpace(header.TransactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : header.TransactionID;
                }

                var generatedFilePath = MaterializeScriptFile(xmlFilePath, header.TransactionID, scriptSource, fileExtension);
                if (string.IsNullOrWhiteSpace(featureSQLSource) == false)
                {
                    MaterializeFeatureSQLFile(xmlFilePath, header.TransactionID, featureSQLSource);
                }

                var items = contract.Commands;
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
                        moduleScriptMap.EntryType = string.IsNullOrWhiteSpace(item.EntryType) ? $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}" : item.EntryType;
                        moduleScriptMap.EntryMethod = string.IsNullOrWhiteSpace(item.EntryMethod) ? item.ID : item.EntryMethod;
                        moduleScriptMap.DataSourceID = !string.IsNullOrWhiteSpace(header.DataSourceID) ? header.DataSourceID : ModuleConfiguration.DefaultDataSourceID;
                        moduleScriptMap.LanguageType = header.LanguageType;
                        moduleScriptMap.ProgramPath = generatedFilePath;
                        moduleScriptMap.Timeout = item.Timeout;
                        moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                        moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                        moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                        moduleScriptMap.Description = item.Description;
                        moduleScriptMap.OutputMetas = new List<string>(item.OutputMetas);

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
                                    IsRequired = functionParam.IsRequired,
                                    DefaultValue = functionParam.Value
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
                            if (header.LanguageType == "csharp")
                            {
                                var runner = Runner.Instance;
                                runner.FileAssemblyCache.TryRemove(generatedFilePath, out _);
                            }
                            else if (header.LanguageType == "python")
                            {
                                deletePythonCache(generatedFilePath, moduleScriptMap);
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
                                logger.Warning("[{LogCategory}] " + $"ScriptMap 정보 중복 확인 필요 - {xmlFilePath}, ApplicationID - {moduleScriptMap.ApplicationID}, ProjectID - {moduleScriptMap.ProjectID}, TransactionID - {moduleScriptMap.TransactionID}, ScriptID - {moduleScriptMap.ScriptID}", "FunctionMapper/MergeXmlContractFile");
                            }
                        }
                    }
                }

                result = true;
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"{xmlFilePath} 업무 계약 파일 오류 - {exception.ToMessage()}", "FunctionMapper/MergeXmlContractFile");
            }

            return result;
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
                                        moduleScriptMap.Description = item.Description;
                                        moduleScriptMap.OutputMetas = new List<string>(item.OutputMetas);

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
                                                    IsRequired = functionParam.IsRequired,
                                                    DefaultValue = functionParam.Value
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

                    // command/dbclient/graphclient 모듈과 동일한 {TransactionID}.xml/.fnc 단일 파일 계약 스캔
                    // featureMeta.json(폴더 방식) 스캔이 먼저 끝난 뒤에 실행되므로, 동일 TransactionID 가 폴더 방식과 단일 파일 방식에 모두 존재하면
                    // ScriptMappings.ContainsKey 검사에 의해 폴더 방식이 우선 등록되고 단일 파일 쪽은 중복 경고 로그만 남긴다.
                    var xmlContractFiles = ModuleConfiguration.ContractFileExtensions
                        .SelectMany(extension => Directory.GetFiles(basePath, "*" + extension, SearchOption.AllDirectories))
                        .Where(item => Path.GetFileName(item).Equals("featureSQL.xml", StringComparison.OrdinalIgnoreCase) == false
                            && Path.GetRelativePath(basePath, item).Replace("\\", "/").Split('/').Length == 3);

                    foreach (var xmlContractFile in xmlContractFiles)
                    {
                        MergeXmlContractFile(xmlContractFile, false, logger);
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
                        decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').SubstringSafe(0, 32);
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
                        decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').SubstringSafe(0, 32);
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


