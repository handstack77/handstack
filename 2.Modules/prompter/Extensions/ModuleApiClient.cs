using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;

using ChoETL;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Newtonsoft.Json.Linq;

using prompter.Entity;

using Serilog;

namespace prompter.Extensions
{
    public class ModuleApiClient
    {
        private readonly ILogger logger;
        private readonly TransactionClient transactionClient;

        public ModuleApiClient(ILogger logger, TransactionClient transactionClient)
        {
            this.logger = logger;
            this.transactionClient = transactionClient;
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

        public async Task<string> GetCodeHelp(string codeHelpID, string applicationID, string transactionCommandID, string parametersText, string? delimiter = null, string? eol = null)
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
                var dataSource = transactionResult[codeHelpID]?["DataSource"];
                if (dataSource != null)
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

                    result = stringBuilder.ToString().Replace("\"\"", "\"");
                }

                logger.Information("[{LogCategory}] " + $"코드도움 거래: {parametersText}", "ModuleApiClient/GetCodeHelp");
                return result;
            }

            var errorMessage = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
            logger.Warning("[{LogCategory}] " + $"CodeHelpID: {codeHelpID}, Parameters: {parametersText}, ErrorMessage: {errorMessage}", "ModuleApiClient/GetCodeHelp");
            return result;
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
