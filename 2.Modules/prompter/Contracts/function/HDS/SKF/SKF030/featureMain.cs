using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

using Newtonsoft.Json.Linq;

using prompter.Entity;
using prompter.KernelPlugin;

namespace HDS.Function.SKF
{
    public class SKF020
    {
        protected async Task<DataSet?> GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SKF030.GF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string prompt = dynamicParameters.Value("Prompt").ToStringSafe();
                string kernelFunction = dynamicParameters.Value("KernelFunction").ToStringSafe("Translation");
                string from = dynamicParameters.Value("From").ToStringSafe();
                string to = dynamicParameters.Value("To").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(prompt) == true
                    || string.IsNullOrEmpty(from) == true
                    || string.IsNullOrEmpty(to) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    // OpenAI 자격 증명 확인
                    var openAIModelId = dataContext.functionHeader.Configuration?.Get<string>("OpenAIModelId").ToStringSafe();
                    var openAIApiKey = dataContext.functionHeader.Configuration?.Get<string>("OpenAIApiKey").ToStringSafe();

                    if (string.IsNullOrEmpty(openAIModelId) == true || string.IsNullOrEmpty(openAIApiKey) == true)
                    {
                        result.BuildExceptionData("Y", "Warning", "OpenAI 자격 증명 확인 필요", typeMember);
                        goto TransactionException;
                    }

                    // Kernel 생성
                    Kernel kernel = Kernel.CreateBuilder()
                        .AddOpenAIChatCompletion(openAIModelId, openAIApiKey)
                        .Build();

                    // 플러그인 추가
                    kernel.ImportPluginFromType<MathPlugin>("math");
                    kernel.ImportPluginFromType<TimePlugin>("time");
                    kernel.ImportPluginFromType<TextPlugin>("text");

                    // 프롬프트 플러그인 로드
                    string promptsPath = PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "Prompts", "GeneraterPlugin");
                    var prompts = kernel.CreatePluginFromPromptDirectory(promptsPath);

                    // 프롬프트 실행
                    var promptResult = await kernel.InvokeAsync(
                        prompts[kernelFunction],
                        new()
                        {
                            { "prompt", prompt },
                        }
                    );

                    string message = promptResult.ToString();

                    // 결과 테이블 생성
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
