using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;

using Newtonsoft.Json.Linq;

namespace HDS.Function.SKF
{
    public class SKF110
    {
        protected async Task<DataSet?> GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SKF110.GF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string prompt = dynamicParameters.Value("Prompt").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(prompt) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var openAIModelId = dataContext.functionHeader.Configuration?.Get<string>("OpenAIModelId").ToStringSafe();
                    var openAIApiKey = dataContext.functionHeader.Configuration?.Get<string>("OpenAIApiKey").ToStringSafe();

                    if (string.IsNullOrEmpty(openAIModelId) == true || string.IsNullOrEmpty(openAIApiKey) == true)
                    {
                        result.BuildExceptionData("Y", "Warning", "OpenAI 자격 증명 확인 필요", typeMember);
                        goto TransactionException;
                    }

                    Kernel kernel = Kernel.CreateBuilder()
                        .AddOpenAIChatCompletion(
                            modelId: openAIModelId,
                            apiKey: openAIApiKey)
                    .Build();

                    var promptResult = await kernel.InvokePromptAsync(prompt);

                    DataTableHelper dataTableBuilder = new DataTableHelper();
                    dataTableBuilder.AddColumn("PromptResult", typeof(string));

                    dataTableBuilder.NewRow();
                    dataTableBuilder.SetValue(0, 0, promptResult.ToString());

                    using (DataTable table = dataTableBuilder.GetDataTable())
                    {
                        result.Tables.Add(table);
                    }
                }
                catch (Exception exception)
                {
                    result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
                    goto TransactionException;
                }

TransactionException:
                if (result.Tables.Count == 1)
                {
                    result.Tables.Add(new DataTable());
                }

                return result;
            }
        }
    }
}
