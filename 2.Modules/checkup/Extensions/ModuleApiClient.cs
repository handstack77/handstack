using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json.Linq;

using Serilog;

using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Threading.Tasks;

namespace checkup.Extensions
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
                    TransactionClientObject transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    transactionObject.ProgramID = transactionInfo[0];
                    transactionObject.BusinessID = transactionInfo[1];
                    transactionObject.TransactionID = transactionInfo[2];
                    transactionObject.FunctionID = transactionInfo[3];
                    transactionObject.ScreenID = transactionObject.TransactionID;
                    transactionObject.StartTraceID = string.IsNullOrEmpty(startTraceID) == true ? nameof(ModuleApiClient) : startTraceID;
                    StackTrace stackTrace = new StackTrace();

                    if (serviceParameters != null)
                    {
                        transactionObject.Inputs.Add(serviceParameters);
                    }

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject);

                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        string message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {message}", "ModuleApiClient/TransactionDirect");
                    }
                    else
                    {
                        result = transactionResult;
                    }
                }
                catch (Exception exception)
                {
                    logger.Error("[{LogCategory}] " + $"transactionCommandID: {transactionCommandID}, Message: " + exception.ToMessage(), "ModuleApiClient/TransactionDirect");
                }
            }

            return result;
        }
    }
}
