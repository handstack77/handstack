using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ChoETL;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Microsoft.Extensions.Caching.Memory;

using Newtonsoft.Json.Linq;

using prompter.Entity;

using Serilog;

using Stubble.Core.Builders;

namespace prompter.Extensions
{
    public class ModuleApiClient
    {
        private const string CodeHelpTemplateDirectoryName = "CodeHelpTemplates";
        private const string CodeHelpTemplateExtension = ".tpl";

        private readonly ILogger logger;
        private readonly TransactionClient transactionClient;
        private readonly IMemoryCache memoryCache;

        public ModuleApiClient(ILogger logger, TransactionClient transactionClient, IMemoryCache memoryCache)
        {
            this.logger = logger;
            this.transactionClient = transactionClient;
            this.memoryCache = memoryCache;
        }

        // var repositoryItems = result?["FormData0"]?.ToObject<RepositoryItems>();
        // var repositorys = result?["GridData0"]?.ToObject<List<Repository>>();
        // var formData = JsonConvert.DeserializeObject<DataTable>($"[{result?["FormData0"]}]");
        public async Task<Dictionary<string, JToken>?> TransactionDirect(string transactionCommandID, List<ServiceParameter>? serviceParameters = null, string? startTraceID = null)
        {
            Dictionary<string, JToken>? result = null;

            if (string.IsNullOrEmpty(transactionCommandID) == false)
            {
                try
                {
                    var transactionInfo = transactionCommandID.Split("|");
                    var transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    transactionObject.ProgramID = transactionInfo[0];
                    transactionObject.BusinessID = transactionInfo[1];
                    transactionObject.TransactionID = transactionInfo[2];
                    transactionObject.FunctionID = transactionInfo[3];
                    transactionObject.ScreenID = transactionObject.TransactionID;
                    transactionObject.StartTraceID = string.IsNullOrEmpty(startTraceID) == true ? nameof(ModuleApiClient) : startTraceID;

                    if (serviceParameters != null)
                    {
                        transactionObject.Inputs.Add(serviceParameters);
                    }

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject, ModuleConfiguration.ModuleID);

                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        var message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {message}", "ModuleApiClient/TransactionDirect");
                    }

                    result = transactionResult;
                }
                catch (Exception exception)
                {
                    logger.Error("[{LogCategory}] " + $"transactionCommandID: {transactionCommandID}, Message: " + exception.ToMessage(), "ModuleApiClient/TransactionDirect");
                }
            }

            return result;
        }

        public async Task<string> GetCodeHelp(string codeHelpID, string applicationID, string transactionCommandID, string parametersText, string? delimiter = null, string? eol = null, string? templateID = null)
        {
            var result = "";

            if (string.IsNullOrWhiteSpace(codeHelpID) == true
                || string.IsNullOrWhiteSpace(applicationID) == true
                || string.IsNullOrWhiteSpace(transactionCommandID) == true)
            {
                logger.Warning("[{LogCategory}] " + $"CodeHelpID: {codeHelpID}, ApplicationID: {applicationID}, transactionCommandID: {transactionCommandID} 확인 필요", "ModuleApiClient/GetCodeHelp");
                return result;
            }

            var serviceParameters = new List<ServiceParameter>
            {
                new ServiceParameter("ApplicationID", applicationID),
                new ServiceParameter("CodeHelpID", codeHelpID),
                new ServiceParameter("Parameters", NormalizeCodeHelpParameters(parametersText))
            };

            var transactionResult = await TransactionDirect(transactionCommandID, serviceParameters, "ModuleApiClient/GetCodeHelp");
            if (transactionResult != null && transactionResult.Count > 0 && transactionResult.ContainsKey("HasException") == false)
            {
                var codeHelpObject = transactionResult[codeHelpID];
                var dataSource = codeHelpObject?["DataSource"];
                if (dataSource != null)
                {
                    result = string.IsNullOrWhiteSpace(templateID) == true ? ConvertCodeHelpDataSourceToCsv(dataSource, delimiter, eol) : RenderCodeHelpTemplate(codeHelpObject, dataSource, templateID);
                }

                logger.Information("[{LogCategory}] " + $"코드도움 거래: {parametersText}", "ModuleApiClient/GetCodeHelp");
                return result;
            }

            var errorMessage = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
            logger.Warning("[{LogCategory}] " + $"CodeHelpID: {codeHelpID}, Parameters: {parametersText}, ErrorMessage: {errorMessage}", "ModuleApiClient/GetCodeHelp");
            return result;
        }

        private string RenderCodeHelpTemplate(JToken? codeHelpObject, JToken dataSource, string templateID)
        {
            var result = "";
            var templatePath = GetCodeHelpTemplatePath(templateID);
            if (string.IsNullOrEmpty(templatePath) == true)
            {
                logger.Warning("[{LogCategory}] " + $"코드도움 템플릿 ID 확인 필요: {templateID}", "ModuleApiClient/RenderCodeHelpTemplate");
                return result;
            }

            if (File.Exists(templatePath) == false)
            {
                logger.Warning("[{LogCategory}] " + $"코드도움 템플릿 파일 확인 필요: {templatePath}", "ModuleApiClient/RenderCodeHelpTemplate");
                return result;
            }

            try
            {
                var cacheKey = GetCodeHelpTemplateCacheKey(templatePath);
                var template = memoryCache.GetOrCreate(cacheKey, entry =>
                {
                    ModuleConfiguration.CacheKeys.TryAdd(cacheKey, 0);
                    return File.ReadAllText(templatePath, Encoding.UTF8);
                });

                var model = CreateCodeHelpTemplateModel(codeHelpObject, dataSource);
                var renderer = new StubbleBuilder().Build();
                result = renderer.Render(template, model);
            }
            catch (Exception exception)
            {
                logger.Warning("[{LogCategory}] " + $"TemplateID: {templateID}, Message: {exception.ToMessage()}", "ModuleApiClient/RenderCodeHelpTemplate");
            }

            return result;
        }

        private static string ConvertCodeHelpDataSourceToCsv(JToken dataSource, string? delimiter, string? eol)
        {
            var stringBuilder = new StringBuilder();
            var jsonReader = new StringReader(dataSource.ToStringSafe());
            using var choJSONReader = new ChoJSONReader(jsonReader);
            using (var choCSVWriter = new ChoCSVWriter(stringBuilder, new ChoCSVRecordConfiguration()
            {
                Delimiter = string.IsNullOrEmpty(delimiter) == true ? "," : delimiter,
                EOLDelimiter = string.IsNullOrEmpty(eol) == true ? Environment.NewLine : eol
            }).WithFirstLineHeader().QuoteAllFields(false))
            {
                choCSVWriter.Write(choJSONReader);
            }

            return stringBuilder.ToString().Replace("\"\"", "\"");
        }

        private static Dictionary<string, object?> CreateCodeHelpTemplateModel(JToken? codeHelpObject, JToken dataSource)
        {
            var codeColumnID = codeHelpObject?["CodeColumnID"].ToStringSafe();
            var valueColumnID = codeHelpObject?["ValueColumnID"].ToStringSafe();
            var items = new List<Dictionary<string, object?>>();
            IEnumerable<JToken> sourceItems = dataSource.Type == JTokenType.Array ? dataSource.Children<JToken>() : new[] { dataSource };

            foreach (var sourceItem in sourceItems)
            {
                var item = new Dictionary<string, object?>();
                if (sourceItem is JObject sourceObject)
                {
                    foreach (var property in sourceObject.Properties())
                    {
                        item[property.Name] = property.Value.ToStringSafe();
                    }
                }

                item["CodeID"] = string.IsNullOrWhiteSpace(codeColumnID) == true ? item.GetValueOrDefault("CodeID")?.ToString() ?? "" : sourceItem[codeColumnID].ToStringSafe();
                item["CodeValue"] = string.IsNullOrWhiteSpace(valueColumnID) == true ? item.GetValueOrDefault("CodeValue")?.ToString() ?? "" : sourceItem[valueColumnID].ToStringSafe();
                items.Add(item);
            }

            return new Dictionary<string, object?>()
            {
                ["Title"] = codeHelpObject?["Comment"].ToStringSafe() ?? "",
                ["CodeColumnID"] = codeColumnID,
                ["ValueColumnID"] = valueColumnID,
                ["Items"] = items,
                ["CodeIDs"] = string.Join(",", items.Select(item => item["CodeID"]?.ToString() ?? "")),
                ["CodeValues"] = string.Join(",", items.Select(item => item["CodeValue"]?.ToString() ?? ""))
            };
        }

        private static string GetCodeHelpTemplatePath(string templateID)
        {
            if (string.IsNullOrWhiteSpace(templateID) == true)
            {
                return "";
            }

            var fileName = templateID.Trim();
            if (fileName.EndsWith(CodeHelpTemplateExtension, StringComparison.OrdinalIgnoreCase) == true)
            {
                fileName = fileName.Substring(0, fileName.Length - CodeHelpTemplateExtension.Length);
            }

            if (fileName.IndexOfAny(Path.GetInvalidFileNameChars()) > -1
                || fileName.Contains("..", StringComparison.Ordinal)
                || fileName.Contains("/", StringComparison.Ordinal)
                || fileName.Contains("\\", StringComparison.Ordinal))
            {
                return "";
            }

            return Path.Combine(ModuleConfiguration.ModuleBasePath, "Prompts", CodeHelpTemplateDirectoryName, fileName + CodeHelpTemplateExtension);
        }

        private static string GetCodeHelpTemplateCacheKey(string templatePath)
        {
            return $"{ModuleConfiguration.ModuleID}|CodeHelpTemplate|{Path.GetFileNameWithoutExtension(templatePath)}";
        }

        private static string NormalizeCodeHelpParameters(string parametersText)
        {
            if (string.IsNullOrWhiteSpace(parametersText) == true)
            {
                return "";
            }

            if (parametersText.StartsWith("@") == true || parametersText.Contains(":") == true || parametersText.Contains(";") == true)
            {
                return parametersText;
            }

            return $"@GroupCode:{parametersText};";
        }
    }
}
