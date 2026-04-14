using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;

using command.Entity;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Extensions;

using Microsoft.Extensions.Configuration;

using Serilog;

namespace command.Extensions
{
    public static class CommandMapper
    {
        public static ExpiringDictionary<string, CommandMap> CommandMappings = new ExpiringDictionary<string, CommandMap>();

        public static bool HasCommand(string applicationID, string projectID, string transactionID, string commandID)
        {
            var queryID = $"{applicationID}|{projectID}|{transactionID}|{commandID}";
            return GetCommandMap(queryID) != null;
        }

        public static CommandMap? GetCommandMap(string queryID)
        {
            CommandMap? result = null;
            lock (CommandMappings)
            {
                CommandMappings.TryGetValue(queryID, out result);
            }

            if (result != null)
            {
                return result;
            }

            var items = queryID.Split('|', StringSplitOptions.RemoveEmptyEntries);
            if (items.Length < 4)
            {
                return null;
            }

            var applicationID = items[0];
            var projectID = items[1];
            var transactionID = items[2];
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                var filePath = PathExtensions.Combine(basePath, applicationID, projectID, transactionID + ".xml");
                if (File.Exists(filePath) == true)
                {
                    AddCommandMap(GetRelativePath(basePath, filePath), false, Log.Logger);
                    lock (CommandMappings)
                    {
                        CommandMappings.TryGetValue(queryID, out result);
                    }

                    break;
                }
            }

            return result;
        }

        public static bool Remove(string applicationID, string projectID, string transactionID, string commandID)
        {
            var queryID = $"{applicationID}|{projectID}|{transactionID}|{commandID}";
            lock (CommandMappings)
            {
                return CommandMappings.Remove(queryID);
            }
        }

        public static bool AddCommandMap(string fileRelativePath, bool forceUpdate, ILogger logger)
        {
            var result = false;
            var relativePath = NormalizeRelativePath(fileRelativePath);
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                var filePath = PathExtensions.Join(basePath, relativePath);
                if (File.Exists(filePath) == false)
                {
                    continue;
                }

                try
                {
                    var commandMaps = ParseCommandFile(filePath, logger);
                    if (commandMaps.Count == 0)
                    {
                        return false;
                    }

                    lock (CommandMappings)
                    {
                        foreach (var commandMap in commandMaps)
                        {
                            var queryID = ToQueryID(commandMap);
                            if (forceUpdate == true && CommandMappings.ContainsKey(queryID) == true)
                            {
                                CommandMappings.Remove(queryID);
                            }

                            if (CommandMappings.ContainsKey(queryID) == false)
                            {
                                CommandMappings.Add(queryID, commandMap, TimeSpan.FromDays(36500));
                                result = true;
                            }
                            else
                            {
                                logger.Warning("[{LogCategory}] CommandMap 정보 중복 오류 - {FilePath}, QueryID - {QueryID}", "CommandMapper/AddCommandMap", filePath, queryID);
                            }
                        }
                    }
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] {FilePath} command 계약 파일 오류", "CommandMapper/AddCommandMap", filePath);
                }

                break;
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

                    var commandMapFiles = Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories);
                    foreach (var commandMapFile in commandMapFiles)
                    {
                        AddCommandMap(GetRelativePath(basePath, commandMapFile), false, logger);
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] LoadContract 오류", "CommandMapper/LoadContract");
            }
        }

        public static List<CommandMap> ParseCommandFile(string filePath, ILogger logger)
        {
            var result = new List<CommandMap>();
            var fileInfo = new FileInfo(filePath);
            var document = XDocument.Load(filePath, LoadOptions.PreserveWhitespace);
            var root = document.Root;
            if (root == null)
            {
                return result;
            }

            var contract = ReadContract(fileInfo, root);
            if (contract.Header.Use == false)
            {
                return result;
            }

            var applicationID = contract.Header.ApplicationID;
            var projectID = contract.Header.ProjectID;
            var transactionID = contract.Header.TransactionID;
            applicationID = string.IsNullOrWhiteSpace(applicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : applicationID;
            projectID = string.IsNullOrWhiteSpace(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
            transactionID = string.IsNullOrWhiteSpace(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;

            var defaultTimeout = contract.Header.Timeout > 0 ? contract.Header.Timeout : ModuleConfiguration.DefaultCommandTimeout;
            var defaultMaxOutputBytes = contract.Header.MaxOutputBytes > 0 ? contract.Header.MaxOutputBytes : ModuleConfiguration.DefaultMaxOutputBytes;
            foreach (var item in contract.Commands)
            {
                if (string.IsNullOrWhiteSpace(item.ID))
                {
                    logger.Warning("[{LogCategory}] command id 확인 필요 - {FilePath}", "CommandMapper/ParseCommandFile", filePath);
                    continue;
                }

                var commandMap = new CommandMap
                {
                    ApplicationID = applicationID,
                    ProjectID = projectID,
                    TransactionID = transactionID,
                    CommandID = ToCommandID(item.ID, item.Seq),
                    Seq = item.Seq,
                    CommandType = "CLI",
                    Use = item.Use,
                    Timeout = item.Timeout > 0 ? item.Timeout : defaultTimeout,
                    MaxOutputBytes = item.MaxOutputBytes > 0 ? item.MaxOutputBytes : defaultMaxOutputBytes,
                    Comment = item.Comment,
                    TransactionLog = item.TransactionLog,
                    ExecutablePath = item.ExecutablePath,
                    Arguments = item.Arguments,
                    WorkingDirectory = item.WorkingDirectory,
                    EnvironmentVariables = new Dictionary<string, string>(item.EnvironmentVariables, StringComparer.OrdinalIgnoreCase),
                    SuccessExitCodes = item.SuccessExitCodes.Count == 0 ? new List<int>() { 0 } : new List<int>(item.SuccessExitCodes),
                    Parameters = CloneParameters(item.Parameters),
                    ModifiedAt = contract.ModifiedAt
                };

                result.Add(commandMap);
            }

            foreach (var item in contract.Requests)
            {
                if (string.IsNullOrWhiteSpace(item.ID))
                {
                    logger.Warning("[{LogCategory}] request id 확인 필요 - {FilePath}", "CommandMapper/ParseCommandFile", filePath);
                    continue;
                }

                var commandMap = new CommandMap
                {
                    ApplicationID = applicationID,
                    ProjectID = projectID,
                    TransactionID = transactionID,
                    CommandID = ToCommandID(item.ID, item.Seq),
                    Seq = item.Seq,
                    CommandType = "HTTP",
                    Use = item.Use,
                    Timeout = item.Timeout > 0 ? item.Timeout : defaultTimeout,
                    MaxOutputBytes = item.MaxOutputBytes > 0 ? item.MaxOutputBytes : defaultMaxOutputBytes,
                    Comment = item.Comment,
                    TransactionLog = item.TransactionLog,
                    Method = string.IsNullOrWhiteSpace(item.Method) ? "GET" : item.Method.ToUpperInvariant(),
                    Url = item.Url,
                    QueryParameters = new Dictionary<string, string>(item.QueryStrings, StringComparer.OrdinalIgnoreCase),
                    Authorization = item.Authorization,
                    Headers = new Dictionary<string, string>(item.Headers, StringComparer.OrdinalIgnoreCase),
                    ContentType = string.IsNullOrWhiteSpace(item.ContentType) ? "application/json" : item.ContentType,
                    Body = item.Body,
                    BodyType = string.IsNullOrWhiteSpace(item.BodyType) ? "raw" : item.BodyType,
                    BodyParts = new List<CommandBodyPartMap>(item.BodyParts),
                    Parameters = CloneParameters(item.Parameters),
                    ModifiedAt = contract.ModifiedAt
                };

                result.Add(commandMap);
            }

            return result;
        }

        private static CommandContract ReadContract(FileInfo fileInfo, XElement root)
        {
            var contract = new CommandContract
            {
                Header = ReadHeader(Descendants(root, "header").FirstOrDefault()),
                ModifiedAt = fileInfo.LastWriteTime
            };

            var commands = Descendants(root, "commands").FirstOrDefault();
            foreach (var item in Children(commands, "command"))
            {
                var commandType = AttributeValue(item, "type").ToStringSafe().ToUpperInvariant();
                var executable = ElementValue(item, "executable");
                var url = ElementValue(item, "url");
                var isLegacyHttpCommand =
                    commandType.Equals("HTTP", StringComparison.OrdinalIgnoreCase) == true ||
                    commandType.Equals("WEB", StringComparison.OrdinalIgnoreCase) == true ||
                    (string.IsNullOrWhiteSpace(commandType) == true &&
                        string.IsNullOrWhiteSpace(executable) == true &&
                        string.IsNullOrWhiteSpace(url) == false);

                if (isLegacyHttpCommand == true)
                {
                    contract.Requests.Add(ReadRequest(item));
                }
                else
                {
                    contract.Commands.Add(ReadCommand(item));
                }
            }

            var requests = Descendants(root, "requests").FirstOrDefault();
            foreach (var item in Children(requests, "request"))
            {
                contract.Requests.Add(ReadRequest(item));
            }

            return contract;
        }

        private static CommandContractHeader ReadHeader(XElement? header)
        {
            return new CommandContractHeader
            {
                ApplicationID = ElementValue(header, "application"),
                ProjectID = ElementValue(header, "project"),
                TransactionID = ElementValue(header, "transaction"),
                Use = ElementValue(header, "use").ToBoolean(true),
                Timeout = ElementValue(header, "timeout").ParseInt(0),
                MaxOutputBytes = ElementValue(header, "maxOutputBytes").ParseInt(0),
                Comment = ElementValue(header, "desc")
            };
        }

        private static CommandContractCli ReadCommand(XElement item)
        {
            var command = new CommandContractCli
            {
                ID = AttributeValue(item, "id"),
                Seq = AttributeValue(item, "seq").ParseInt(0),
                Use = AttributeValue(item, "use").ToBoolean(true),
                Timeout = AttributeValue(item, "timeout").ParseInt(0),
                MaxOutputBytes = AttributeValue(item, "maxOutputBytes").ParseInt(0),
                Comment = AttributeValue(item, "desc"),
                TransactionLog = AttributeValue(item, "log").ToBoolean(false),
                ExecutablePath = ElementValue(item, "executable"),
                Arguments = ElementValue(item, "arguments"),
                WorkingDirectory = ElementValue(item, "workingDirectory"),
                Parameters = ReadParameters(Children(item, "param")),
                SuccessExitCodes = ReadSuccessExitCodes(ElementValue(item, "successExitCodes"))
            };

            foreach (var variable in Descendants(Child(item, "environment"), "variable"))
            {
                var key = AttributeValue(variable, "id");
                if (string.IsNullOrWhiteSpace(key) == false)
                {
                    command.EnvironmentVariables[key] = variable.Value.ToStringSafe();
                }
            }

            return command;
        }

        private static CommandContractRequest ReadRequest(XElement item)
        {
            var bodyNode = Child(item, "body");
            var bodyParts = ReadBodyParts(bodyNode);
            var bodyType = AttributeValue(bodyNode, "type");
            var contentType = AttributeValue(bodyNode, "contentType");
            var request = new CommandContractRequest
            {
                ID = AttributeValue(item, "id"),
                Seq = AttributeValue(item, "seq").ParseInt(0),
                Use = AttributeValue(item, "use").ToBoolean(true),
                Timeout = AttributeValue(item, "timeout").ParseInt(0),
                MaxOutputBytes = AttributeValue(item, "maxOutputBytes").ParseInt(0),
                Comment = AttributeValue(item, "desc"),
                TransactionLog = AttributeValue(item, "log").ToBoolean(false),
                Method = ElementValue(item, "method").ToStringSafe().ToUpperInvariant(),
                Url = ElementValue(item, "url"),
                QueryStrings = ReadNameValueMap(Child(item, "querystrings"), "value"),
                Authorization = ReadAuthorization(Child(item, "authorization")),
                Headers = ReadNameValueMap(Child(item, "headers"), "header"),
                ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/json" : contentType,
                Body = bodyParts.Count == 0 ? (bodyNode?.Value.ToStringSafe().Trim() ?? "") : "",
                BodyType = string.IsNullOrWhiteSpace(bodyType) ? "raw" : bodyType,
                BodyParts = bodyParts,
                Parameters = ReadParameters(Children(item, "param"))
            };

            if (string.IsNullOrWhiteSpace(request.Method) == true)
            {
                request.Method = "GET";
            }

            return request;
        }

        private static List<CommandParameterMap> ReadParameters(IEnumerable<XElement> parameterNodes)
        {
            var result = new List<CommandParameterMap>();
            foreach (var paramNode in parameterNodes)
            {
                result.Add(new CommandParameterMap
                {
                    Name = AttributeValue(paramNode, "id"),
                    DbType = AttributeValue(paramNode, "type").ToStringSafe() == "" ? "String" : AttributeValue(paramNode, "type"),
                    Length = AttributeValue(paramNode, "length").ParseInt(-1),
                    DefaultValue = AttributeValue(paramNode, "value").ToStringSafe() == "" ? "NULL" : AttributeValue(paramNode, "value"),
                    TestValue = AttributeValue(paramNode, "test"),
                    Required = AttributeValue(paramNode, "required").ToBoolean(true)
                });
            }

            return result;
        }

        private static List<int> ReadSuccessExitCodes(string successExitCodes)
        {
            var result = new List<int>();
            if (string.IsNullOrWhiteSpace(successExitCodes) == true)
            {
                result.Add(0);
                return result;
            }

            foreach (var successExitCode in successExitCodes.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                result.Add(successExitCode.ParseInt(0));
            }

            return result.Count == 0 ? new List<int>() { 0 } : result;
        }

        private static Dictionary<string, string> ReadNameValueMap(XElement? container, string itemName)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in Children(container, itemName))
            {
                var key = AttributeValue(item, "id");
                if (string.IsNullOrWhiteSpace(key) == true)
                {
                    key = AttributeValue(item, "name");
                }

                if (string.IsNullOrWhiteSpace(key) == false)
                {
                    var value = item.Value.ToStringSafe().Trim();
                    if (string.IsNullOrWhiteSpace(value) == true)
                    {
                        value = AttributeValue(item, "value");
                    }

                    result[key] = value;
                }
            }

            return result;
        }

        private static CommandAuthorizationMap ReadAuthorization(XElement? authorization)
        {
            if (authorization == null)
            {
                return new CommandAuthorizationMap();
            }

            var value = authorization.Value.ToStringSafe().Trim();
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                value = AttributeValue(authorization, "value");
            }

            return new CommandAuthorizationMap
            {
                Type = AttributeValue(authorization, "type"),
                Name = AttributeValue(authorization, "name"),
                In = AttributeValue(authorization, "in").ToStringSafe() == "" ? "Header" : AttributeValue(authorization, "in"),
                Username = AttributeValue(authorization, "username"),
                Password = AttributeValue(authorization, "password"),
                Value = value
            };
        }

        private static List<CommandBodyPartMap> ReadBodyParts(XElement? body)
        {
            var result = new List<CommandBodyPartMap>();
            foreach (var part in Children(body, "part"))
            {
                var partMap = new CommandBodyPartMap
                {
                    Type = AttributeValue(part, "type").ToStringSafe() == "" ? "text" : AttributeValue(part, "type"),
                    Name = AttributeValue(part, "name").ToStringSafe() == "" ? AttributeValue(part, "id") : AttributeValue(part, "name"),
                    Value = part.Value.ToStringSafe().Trim(),
                    FileName = AttributeValue(part, "fileName"),
                    Path = AttributeValue(part, "path"),
                    Base64 = AttributeValue(part, "base64"),
                    ContentType = AttributeValue(part, "contentType")
                };

                if (string.IsNullOrWhiteSpace(partMap.Value) == true)
                {
                    partMap.Value = AttributeValue(part, "value");
                }

                result.Add(partMap);
            }

            return result;
        }

        private static List<CommandParameterMap> CloneParameters(List<CommandParameterMap> parameters)
        {
            return parameters.Select(item => new CommandParameterMap
            {
                Name = item.Name,
                DbType = item.DbType,
                Length = item.Length,
                DefaultValue = item.DefaultValue,
                TestValue = item.TestValue,
                Required = item.Required
            }).ToList();
        }

        private static string ToCommandID(string id, int seq)
        {
            return id + seq.ToString().PadLeft(2, '0');
        }

        private static string ToQueryID(CommandMap commandMap)
        {
            return $"{commandMap.ApplicationID}|{commandMap.ProjectID}|{commandMap.TransactionID}|{commandMap.CommandID}";
        }

        private static string NormalizeRelativePath(string fileRelativePath)
        {
            var result = fileRelativePath.Replace("\\", "/");
            while (result.StartsWith("/") || result.StartsWith("\\"))
            {
                result = result.Substring(1);
            }

            return result;
        }

        private static string GetRelativePath(string basePath, string filePath)
        {
            return NormalizeRelativePath(Path.GetRelativePath(basePath, filePath));
        }

        private static IEnumerable<XElement> Descendants(XContainer? container, string localName)
        {
            return container == null
                ? Enumerable.Empty<XElement>()
                : container.Descendants().Where(item => item.Name.LocalName.Equals(localName, StringComparison.OrdinalIgnoreCase));
        }

        private static IEnumerable<XElement> Children(XContainer? container, string localName)
        {
            return container == null
                ? Enumerable.Empty<XElement>()
                : container.Elements().Where(item => item.Name.LocalName.Equals(localName, StringComparison.OrdinalIgnoreCase));
        }

        private static XElement? Child(XContainer? container, string localName)
        {
            return Children(container, localName).FirstOrDefault();
        }

        private static string ElementValue(XContainer? container, string localName)
        {
            return Child(container, localName)?.Value.ToStringSafe().Trim() ?? "";
        }

        private static string AttributeValue(XElement? element, string localName)
        {
            if (element == null)
            {
                return "";
            }

            return element.Attributes().FirstOrDefault(item => item.Name.LocalName.Equals(localName, StringComparison.OrdinalIgnoreCase))?.Value.ToStringSafe().Trim() ?? "";
        }
    }
}
