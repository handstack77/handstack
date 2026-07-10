using System;
using System.Collections.Generic;
using System.CommandLine;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

using Newtonsoft.Json.Linq;

using Serilog;

namespace handstack
{
    internal static class ContractPackCommand
    {
        public static void Register(RootCommand rootCommand, HandstackCommandContext context)
        {
            var command = new Command("contractpack", "Contracts 디렉터리의 계약 파일을 모듈별 전용 확장자로 변환합니다")
            {
                context.OptionDirectory,
                context.OptionOptions
            };

            // handstack contractpack --directory=C:/projects/myapp/modules/myapp/Contracts --options=true
            command.SetAction(parseResult =>
            {
                var directory = parseResult.GetValue(context.OptionDirectory);
                var options = parseResult.GetValue(context.OptionOptions);
                var backup = string.Equals(options, "true", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(options, "Y", StringComparison.OrdinalIgnoreCase)
                    || options == "1";

                return Run(directory?.FullName, backup);
            });

            rootCommand.Add(command);
        }

        private sealed class RenameItem
        {
            public string ModuleID { get; set; } = "";
            public string SourceFilePath { get; set; } = "";
            public string TargetFilePath { get; set; } = "";
        }

        private sealed class FunctionItem
        {
            public string SourceDirectoryPath { get; set; } = "";
            public string TargetFilePath { get; set; } = "";
            public string Content { get; set; } = "";
        }

        private static int Run(string? contractsDirectoryPath, bool backup)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(contractsDirectoryPath) == true)
                {
                    Log.Error("Contracts 디렉터리 경로 확인이 필요합니다");
                    return -1;
                }

                var contractsRootPath = Path.GetFullPath(contractsDirectoryPath);
                var contractsDirectoryInfo = new DirectoryInfo(contractsRootPath);
                if (contractsDirectoryInfo.Exists == false)
                {
                    Log.Error($"Contracts 디렉터리 경로 확인이 필요합니다: {contractsRootPath}");
                    return -1;
                }

                var functionItems = BuildFunctionItems(contractsRootPath);
                var functionSourceDirectories = functionItems
                    .Select(item => Path.GetFullPath(item.SourceDirectoryPath))
                    .ToList();

                var renameItems = new List<RenameItem>();
                AddRenameItems(renameItems, contractsRootPath, "command", ".xml", ".bas");
                AddRenameItems(renameItems, contractsRootPath, "dbclient", ".xml", ".dbc");
                AddRenameItems(renameItems, contractsRootPath, "graphclient", ".xml", ".cyp");
                AddRenameItems(renameItems, contractsRootPath, "prompter", ".xml", ".pmt");
                AddRenameItems(renameItems, contractsRootPath, "repository", ".json", ".rpo");
                AddRenameItems(renameItems, contractsRootPath, "transact", ".json", ".txn", fileInfo =>
                    fileInfo.Name.Equals("publicTransactions.json", StringComparison.OrdinalIgnoreCase) == false);
                AddRenameItems(renameItems, contractsRootPath, "function", ".xml", ".fnc", fileInfo =>
                    fileInfo.Name.Equals("featureSQL.xml", StringComparison.OrdinalIgnoreCase) == false
                    && functionSourceDirectories.Any(sourceDirectory => IsPathUnderDirectory(fileInfo.FullName, sourceDirectory)) == false);

                ValidatePlan(contractsRootPath, renameItems, functionItems);

                if (backup == true)
                {
                    var backupZipFilePath = GetBackupFilePath(contractsDirectoryInfo);
                    ZipFile.CreateFromDirectory(contractsRootPath, backupZipFilePath, CompressionLevel.Optimal, false);
                    Log.Information($"contractpack backup: {backupZipFilePath.Replace("\\", "/")}");
                }

                foreach (var functionItem in functionItems)
                {
                    var targetDirectoryPath = Path.GetDirectoryName(functionItem.TargetFilePath);
                    if (string.IsNullOrWhiteSpace(targetDirectoryPath) == false)
                    {
                        Directory.CreateDirectory(targetDirectoryPath);
                    }

                    File.WriteAllText(functionItem.TargetFilePath, functionItem.Content, new UTF8Encoding(false));
                    Log.Information($"contractpack function: {functionItem.SourceDirectoryPath.Replace("\\", "/")} -> {functionItem.TargetFilePath.Replace("\\", "/")}");
                }

                foreach (var renameItem in renameItems)
                {
                    File.Move(renameItem.SourceFilePath, renameItem.TargetFilePath);
                    Log.Information($"contractpack {renameItem.ModuleID}: {renameItem.SourceFilePath.Replace("\\", "/")} -> {renameItem.TargetFilePath.Replace("\\", "/")}");
                }

                foreach (var functionItem in functionItems.OrderByDescending(item => item.SourceDirectoryPath.Length))
                {
                    Directory.Delete(functionItem.SourceDirectoryPath, true);
                    Log.Information($"contractpack function source deleted: {functionItem.SourceDirectoryPath.Replace("\\", "/")}");
                }

                Log.Information($"contractpack 완료: rename {renameItems.Count}, function {functionItems.Count}");
                return 0;
            }
            catch (Exception exception)
            {
                Log.Error(exception, "contractpack 오류");
                return -1;
            }
        }

        private static void AddRenameItems(List<RenameItem> renameItems, string contractsRootPath, string moduleID, string sourceExtension, string targetExtension, Func<FileInfo, bool>? predicate = null)
        {
            var moduleDirectoryPath = Path.Combine(contractsRootPath, moduleID);
            if (Directory.Exists(moduleDirectoryPath) == false)
            {
                return;
            }

            foreach (var sourceFilePath in Directory.EnumerateFiles(moduleDirectoryPath, "*" + sourceExtension, SearchOption.AllDirectories))
            {
                var sourceFileInfo = new FileInfo(sourceFilePath);
                if (sourceFileInfo.Extension.Equals(sourceExtension, StringComparison.OrdinalIgnoreCase) == false)
                {
                    continue;
                }

                if (predicate != null && predicate(sourceFileInfo) == false)
                {
                    continue;
                }

                var targetFilePath = Path.ChangeExtension(sourceFileInfo.FullName, targetExtension);
                if (sourceFileInfo.FullName.Equals(targetFilePath, StringComparison.OrdinalIgnoreCase) == true)
                {
                    continue;
                }

                renameItems.Add(new RenameItem
                {
                    ModuleID = moduleID,
                    SourceFilePath = sourceFileInfo.FullName,
                    TargetFilePath = targetFilePath
                });
            }
        }

        private static List<FunctionItem> BuildFunctionItems(string contractsRootPath)
        {
            var result = new List<FunctionItem>();
            var functionDirectoryPath = Path.Combine(contractsRootPath, "function");
            if (Directory.Exists(functionDirectoryPath) == false)
            {
                return result;
            }

            foreach (var featureMetaFilePath in Directory.EnumerateFiles(functionDirectoryPath, "featureMeta.json", SearchOption.AllDirectories))
            {
                var featureMetaFileInfo = new FileInfo(featureMetaFilePath);
                var sourceDirectoryInfo = featureMetaFileInfo.Directory;
                if (sourceDirectoryInfo == null)
                {
                    throw new DirectoryNotFoundException($"featureMeta.json 디렉터리 확인 필요: {featureMetaFilePath}");
                }

                var featureMainFiles = sourceDirectoryInfo.GetFiles("featureMain.*", SearchOption.TopDirectoryOnly)
                    .Where(fileInfo => fileInfo.Extension.Equals(".cs", StringComparison.OrdinalIgnoreCase) == true
                        || fileInfo.Extension.Equals(".js", StringComparison.OrdinalIgnoreCase) == true
                        || fileInfo.Extension.Equals(".py", StringComparison.OrdinalIgnoreCase) == true)
                    .ToList();

                if (featureMainFiles.Count == 0)
                {
                    throw new FileNotFoundException($"featureMain.* 파일 확인 필요: {sourceDirectoryInfo.FullName}");
                }

                if (featureMainFiles.Count > 1)
                {
                    throw new InvalidOperationException($"featureMain.* 파일이 둘 이상입니다: {sourceDirectoryInfo.FullName}");
                }

                var featureMeta = JObject.Parse(File.ReadAllText(featureMetaFileInfo.FullName));
                var header = featureMeta["Header"] as JObject ?? throw new InvalidOperationException($"Header 확인 필요: {featureMetaFileInfo.FullName}");
                var commands = featureMeta["Commands"] as JArray ?? throw new InvalidOperationException($"Commands 확인 필요: {featureMetaFileInfo.FullName}");
                if (sourceDirectoryInfo.Parent == null)
                {
                    throw new DirectoryNotFoundException($"function 계약 부모 디렉터리 확인 필요: {sourceDirectoryInfo.FullName}");
                }

                var targetFilePath = Path.Combine(sourceDirectoryInfo.Parent.FullName, sourceDirectoryInfo.Name + ".fnc");
                var content = CreateFunctionContent(header, commands, featureMainFiles[0], sourceDirectoryInfo);

                XDocument.Parse(content, LoadOptions.PreserveWhitespace);

                result.Add(new FunctionItem
                {
                    SourceDirectoryPath = sourceDirectoryInfo.FullName,
                    TargetFilePath = targetFilePath,
                    Content = content
                });
            }

            return result;
        }

        private static string CreateFunctionContent(JObject header, JArray commands, FileInfo featureMainFileInfo, DirectoryInfo sourceDirectoryInfo)
        {
            var scriptSource = File.ReadAllText(featureMainFileInfo.FullName).TrimEnd();
            var lines = new List<string>
            {
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
                "<mapper xmlns=\"contract.xsd\">",
                "    <header>",
                $"        <application>{XmlEscape(GetJsonString(header, "ApplicationID", "application"))}</application>",
                $"        <project>{XmlEscape(GetJsonString(header, "ProjectID", "project"))}</project>",
                $"        <transaction>{XmlEscape(GetJsonStringDefault(header, sourceDirectoryInfo.Name, "TransactionID", "transaction"))}</transaction>",
                $"        <datasource>{XmlEscape(GetJsonString(header, "DataSourceID", "datasource"))}</datasource>",
                $"        <language>{XmlEscape(GetJsonString(header, "LanguageType", "language"))}</language>",
                $"        <referenceModuleID>{XmlEscape(GetJsonString(header, "ReferenceModuleID", "referenceModuleID"))}</referenceModuleID>",
                $"        <isHttpContext>{ToBooleanText(GetJsonStringDefault(header, "false", "IsHttpContext", "isHttpContext"), false)}</isHttpContext>",
                $"        <use>{ToUseText(GetJsonStringDefault(header, "true", "Use", "use"), true)}</use>",
                $"        <desc>{XmlEscape(GetJsonString(header, "Comment", "Description", "desc"))}</desc>",
                "    </header>",
                "    <script><![CDATA[",
                ToSafeCData(scriptSource),
                "    ]]></script>"
            };

            var featureSQLFilePath = Path.Combine(sourceDirectoryInfo.FullName, "featureSQL.xml");
            if (File.Exists(featureSQLFilePath) == true)
            {
                var featureSQLSource = File.ReadAllText(featureSQLFilePath);
                featureSQLSource = Regex.Replace(featureSQLSource, @"^\s*<\?xml[^>]*\?>\s*", "");
                if (string.IsNullOrWhiteSpace(featureSQLSource) == false)
                {
                    lines.Add("    <featureSQL>");
                    lines.Add(IndentLines(featureSQLSource.Trim(), "        "));
                    lines.Add("    </featureSQL>");
                }
            }

            lines.Add("    <commands>");

            foreach (var commandToken in commands)
            {
                if (commandToken is not JObject command)
                {
                    continue;
                }

                var commandID = GetJsonString(command, "ID", "id");
                var commandSeq = GetJsonStringDefault(command, "0", "Seq", "seq");
                var commandUse = ToUseText(GetJsonStringDefault(command, "true", "Use", "use"), true);
                var commandTimeout = GetJsonStringDefault(command, "0", "Timeout", "timeout");
                var commandDescription = GetJsonString(command, "Comment", "Description", "desc");

                lines.Add($"        <command id=\"{XmlEscape(commandID)}\" seq=\"{XmlEscape(commandSeq)}\" use=\"{XmlEscape(commandUse)}\" timeout=\"{XmlEscape(commandTimeout)}\" desc=\"{XmlEscape(commandDescription)}\">");
                lines.Add($"            <entryType>{XmlEscape(GetJsonString(command, "EntryType", "entryType"))}</entryType>");
                lines.Add($"            <entryMethod>{XmlEscape(GetJsonString(command, "EntryMethod", "entryMethod"))}</entryMethod>");
                lines.Add($"            <beforeTransaction>{XmlEscape(GetJsonString(command, "BeforeTransaction", "beforeTransaction"))}</beforeTransaction>");
                lines.Add($"            <afterTransaction>{XmlEscape(GetJsonString(command, "AfterTransaction", "afterTransaction"))}</afterTransaction>");
                lines.Add($"            <fallbackTransaction>{XmlEscape(GetJsonString(command, "FallbackTransaction", "fallbackTransaction"))}</fallbackTransaction>");

                if (command["Params"] is JArray parameters)
                {
                    foreach (var parameterToken in parameters)
                    {
                        if (parameterToken is not JObject parameter)
                        {
                            continue;
                        }

                        var parameterID = GetJsonString(parameter, "ID", "id");
                        var parameterType = GetJsonStringDefault(parameter, "String", "Type", "type");
                        var parameterLength = GetJsonStringDefault(parameter, "-1", "Length", "length");
                        var parameterValue = GetJsonString(parameter, "Value", "value");
                        var parameterRequired = ToBooleanText(GetJsonStringDefault(parameter, "false", "IsRequired", "Required", "required"), false);

                        lines.Add($"            <param id=\"{XmlEscape(parameterID)}\" type=\"{XmlEscape(parameterType)}\" length=\"{XmlEscape(parameterLength)}\" value=\"{XmlEscape(parameterValue)}\" required=\"{XmlEscape(parameterRequired)}\" />");
                    }
                }

                if (command["OutputMetas"] is JArray outputMetas)
                {
                    foreach (var outputMetaToken in outputMetas)
                    {
                        var outputMetaValue = outputMetaToken.Type == JTokenType.String
                            ? outputMetaToken.ToString()
                            : GetJsonString(outputMetaToken as JObject, "Value", "value");
                        if (string.IsNullOrWhiteSpace(outputMetaValue) == false)
                        {
                            lines.Add($"            <outputmeta value=\"{XmlEscape(outputMetaValue)}\" />");
                        }
                    }
                }

                lines.Add("        </command>");
            }

            lines.Add("    </commands>");
            lines.Add("</mapper>");

            return string.Join(Environment.NewLine, lines) + Environment.NewLine;
        }

        private static void ValidatePlan(string contractsRootPath, List<RenameItem> renameItems, List<FunctionItem> functionItems)
        {
            foreach (var renameItem in renameItems)
            {
                EnsurePathUnderDirectory(renameItem.SourceFilePath, contractsRootPath);
                EnsurePathUnderDirectory(renameItem.TargetFilePath, contractsRootPath);
            }

            foreach (var functionItem in functionItems)
            {
                EnsurePathUnderDirectory(functionItem.SourceDirectoryPath, Path.Combine(contractsRootPath, "function"));
                EnsurePathUnderDirectory(functionItem.TargetFilePath, contractsRootPath);
            }

            var duplicateTargets = renameItems.Select(item => item.TargetFilePath)
                .Concat(functionItems.Select(item => item.TargetFilePath))
                .GroupBy(item => Path.GetFullPath(item), StringComparer.OrdinalIgnoreCase)
                .Where(group => group.Count() > 1)
                .Select(group => group.Key)
                .ToList();

            if (duplicateTargets.Count > 0)
            {
                throw new InvalidOperationException("contractpack 대상 파일 중복: " + string.Join(", ", duplicateTargets));
            }

            var existingTargets = renameItems.Select(item => item.TargetFilePath)
                .Concat(functionItems.Select(item => item.TargetFilePath))
                .Where(File.Exists)
                .ToList();

            if (existingTargets.Count > 0)
            {
                throw new IOException("contractpack 대상 파일이 이미 존재합니다: " + string.Join(", ", existingTargets));
            }
        }

        private static string GetBackupFilePath(DirectoryInfo contractsDirectoryInfo)
        {
            var parentDirectoryPath = contractsDirectoryInfo.Parent?.FullName;
            if (string.IsNullOrWhiteSpace(parentDirectoryPath) == true)
            {
                throw new DirectoryNotFoundException($"Contracts 부모 디렉터리 확인 필요: {contractsDirectoryInfo.FullName}");
            }

            var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            var backupZipFilePath = Path.Combine(parentDirectoryPath, $"{contractsDirectoryInfo.Name}_{timestamp}.zip");
            var sequence = 1;
            while (File.Exists(backupZipFilePath) == true)
            {
                backupZipFilePath = Path.Combine(parentDirectoryPath, $"{contractsDirectoryInfo.Name}_{timestamp}_{sequence}.zip");
                sequence += 1;
            }

            return backupZipFilePath;
        }

        private static void EnsurePathUnderDirectory(string path, string directoryPath)
        {
            if (IsPathUnderDirectory(path, directoryPath) == false)
            {
                throw new IOException($"허용되지 않은 경로입니다. path: {path}, directory: {directoryPath}");
            }
        }

        private static bool IsPathUnderDirectory(string path, string directoryPath)
        {
            var fullPath = Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            var fullDirectoryPath = Path.GetFullPath(directoryPath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            return fullPath.Equals(fullDirectoryPath, StringComparison.OrdinalIgnoreCase) == true
                || fullPath.StartsWith(fullDirectoryPath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) == true
                || fullPath.StartsWith(fullDirectoryPath + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) == true;
        }

        private static string GetJsonString(JObject? jsonObject, params string[] names)
        {
            return GetJsonStringDefault(jsonObject, "", names);
        }

        private static string GetJsonStringDefault(JObject? jsonObject, string defaultValue, params string[] names)
        {
            if (jsonObject == null)
            {
                return defaultValue;
            }

            foreach (var name in names)
            {
                var property = jsonObject.Properties().FirstOrDefault(item => item.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (property != null && property.Value.Type != JTokenType.Null)
                {
                    return property.Value.ToString();
                }
            }

            return defaultValue;
        }

        private static string XmlEscape(string value)
        {
            return System.Security.SecurityElement.Escape(value) ?? "";
        }

        private static string ToUseText(string value, bool defaultValue)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return defaultValue == true ? "Y" : "N";
            }

            return value.Equals("Y", StringComparison.OrdinalIgnoreCase) == true
                || value.Equals("true", StringComparison.OrdinalIgnoreCase) == true
                || value == "1"
                ? "Y"
                : "N";
        }

        private static string ToBooleanText(string value, bool defaultValue)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return defaultValue == true ? "true" : "false";
            }

            return value.Equals("Y", StringComparison.OrdinalIgnoreCase) == true
                || value.Equals("true", StringComparison.OrdinalIgnoreCase) == true
                || value == "1"
                ? "true"
                : "false";
        }

        private static string ToSafeCData(string value)
        {
            return value.Replace("]]>", "]]]]><![CDATA[>");
        }

        private static string IndentLines(string value, string indent)
        {
            return string.Join(Environment.NewLine, value.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None).Select(line => indent + line));
        }
    }
}
