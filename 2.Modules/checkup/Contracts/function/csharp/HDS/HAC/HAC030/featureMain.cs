using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

namespace HDS.Function.HAC
{
    public class HAC030
    {
        private readonly HttpContext? httpContext;

        public HAC030()
        {
            this.httpContext = null;
        }

        public HAC030(HttpContext? httpContext)
        {
            this.httpContext = httpContext;
        }

        public DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC030.LF01";
            using DataSet? result = new DataSet();
            try
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true)
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;

                }
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string settingFilePath = Path.Combine(appBasePath, "settings.json");
                    if (System.IO.File.Exists(settingFilePath) == true)
                    {
                        string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                        if (appSetting != null)
                        {
                            var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.Routing == null ? "[]" : appSetting.Routing));
                            if (dataTable != null)
                            {
                                result.Tables.Add(dataTable);
                            }
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                    }
                }
            }
            catch (Exception exception)
            {
                result.BuildExceptionData("Y", "Error", exception.Message, typeMember, exception.StackTrace);
            }

TransactionException:
            if (result.Tables.Count == 1)
            {
                result.Tables.Add(new DataTable());
            }

            return result;
        }

        public DataSet? GF01([FromBody] List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC030.GF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string messageServerUrl = dynamicParameters.Value("Uri").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(messageServerUrl) == true)
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                DynamicRequest dynamicRequest = new DynamicRequest();
                try
                {
                    if (messageServerUrl.IndexOf("event://") > -1)
                    {
                        var mediator = httpContext?.RequestServices.GetService<IMediator>();
                        if (mediator != null)
                        {
                            string moduleEventName = messageServerUrl.Replace("event://", "");
                            Type? type = Assembly.Load(moduleEventName.Split(".")[0])?.GetType(moduleEventName);
                            if (type != null)
                            {
                                object? instance = Activator.CreateInstance(type, dynamicRequest);
                                if (instance == null)
                                {
                                    result.BuildExceptionData("Y", "Warning", $"moduleEventName: {moduleEventName} instance 확인 필요", typeMember);
                                    goto TransactionException;
                                }
                                else
                                {
                                    object? eventResponse = mediator.Send(instance);
                                    if (eventResponse == null)
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"moduleEventName: {moduleEventName} 응답 확인 필요", typeMember);
                                        goto TransactionException;
                                    }
                                }
                            }
                            else
                            {
                                result.BuildExceptionData("Y", "Warning", $"moduleEventName: {moduleEventName} type 확인 필요", typeMember);
                                goto TransactionException;
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"event 프로토콜 지원 확인 필요", typeMember);
                            goto TransactionException;
                        }
                    }
                    else if (messageServerUrl.IndexOf("http://") > -1 || messageServerUrl.IndexOf("https://") > -1)
                    {
                        var restClient = new RestClient();
                        var restRequest = new RestRequest(messageServerUrl, Method.Post);
                        restRequest.Timeout = 3000;

                        restRequest.AddHeader("Content-Type", "application/json");
                        string json = JsonConvert.SerializeObject(dynamicRequest);
                        restRequest.AddParameter("application/json", json, ParameterType.RequestBody);

                        RestResponse restResponse = restClient.Execute(restRequest);

                        if (restResponse.StatusCode != HttpStatusCode.OK)
                        {
                            result.BuildExceptionData("Y", "Warning", $"AP 요청 오류: {restResponse.ErrorMessage} type 확인 필요", typeMember);
                            goto TransactionException;
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", $"요청 프로토콜 지원 확인 필요", typeMember);
                        goto TransactionException;
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

        public DataSet? MF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC030.MF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string pageMode = dynamicParameters.Value("PageMode").ToStringSafe();
            string transactProxyID = dynamicParameters.Value("TransactProxyID").ToStringSafe();
            string projectID = dynamicParameters.Value("ProjectID").ToStringSafe();
            string commandType = dynamicParameters.Value("CommandType").ToStringSafe();
            string environment = dynamicParameters.Value("Environment").ToStringSafe();
            string uri = dynamicParameters.Value("Uri").ToStringSafe();
            string comment = dynamicParameters.Value("Comment").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(pageMode) == true
                || string.IsNullOrEmpty(projectID) == true
                || string.IsNullOrEmpty(commandType) == true
                || string.IsNullOrEmpty(environment) == true
                || string.IsNullOrEmpty(uri) == true
            )
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                    string tenantAppID = directoryInfo.Name;

                    string settingFilePath = Path.Combine(appBasePath, "settings.json");
                    if (System.IO.File.Exists(settingFilePath) == true)
                    {
                        string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                        if (appSetting != null)
                        {
                            var routingJson = appSetting.Routing;
                            if (routingJson != null)
                            {
                                if (pageMode == "new")
                                {
                                    var routing = routingJson.Find(p => p.ApplicationID == applicationID
                                        && p.ProjectID == projectID
                                        && p.CommandType == commandType
                                        && p.Environment == environment
                                    );

                                    if (routing == null)
                                    {
                                        routing = new Routing();
                                        routing.ApplicationID = applicationID;
                                        routing.ProjectID = projectID;
                                        routing.CommandType = commandType;
                                        routing.Environment = environment;
                                        routing.Uri = uri;
                                        routing.Comment = comment;

                                        routingJson.Add(routing);

                                        System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"중복 거래 라우팅 ID 확인 필요", typeMember);
                                        goto TransactionException;
                                    }
                                }
                                else if (pageMode == "edit")
                                {
                                    var routing = routingJson.Find(p => $"{p.ApplicationID}|{p.ProjectID}|{p.CommandType}|{p.Environment}" == transactProxyID);

                                    if (routing != null)
                                    {
                                        routing.ApplicationID = applicationID;
                                        routing.ProjectID = projectID;
                                        routing.CommandType = commandType;
                                        routing.Environment = environment;
                                        routing.Uri = uri;
                                        routing.Comment = comment;

                                        System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"거래 라우팅 ID 확인 필요", typeMember);
                                        goto TransactionException;
                                    }
                                }
                                else
                                {
                                    result.BuildExceptionData("Y", "Warning", $"PageMode: {pageMode} 정보 확인 필요", typeMember);
                                    goto TransactionException;
                                }
                            }
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                    }
                }
            }
            catch (Exception exception)
            {
                result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
            }

TransactionException:
            if (result.Tables.Count == 1)
            {
                result.Tables.Add(new DataTable());
            }

            return result;
        }

        public DataSet? DF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC030.DF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string projectID = dynamicParameters.Value("ProjectID").ToStringSafe();
            string commandType = dynamicParameters.Value("CommandType").ToStringSafe();
            string environment = dynamicParameters.Value("Environment").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(projectID) == true
                || string.IsNullOrEmpty(commandType) == true
                || string.IsNullOrEmpty(environment) == true
            )
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                    string tenantAppID = directoryInfo.Name;

                    string settingFilePath = Path.Combine(appBasePath, "settings.json");
                    if (System.IO.File.Exists(settingFilePath) == true)
                    {
                        string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                        if (appSetting != null)
                        {
                            var routingJson = appSetting.Routing;
                            if (routingJson != null)
                            {
                                var routing = routingJson.Find(p => p.ApplicationID == applicationID
                                    && p.ProjectID == projectID
                                    && p.CommandType == commandType
                                    && p.Environment == environment
                                );

                                if (routing != null)
                                {
                                    routingJson.Remove(routing);

                                    System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                                }
                                else
                                {
                                    result.BuildExceptionData("Y", "Warning", $"거래 라우팅 ID 확인 필요", typeMember);
                                }
                            }
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                    }
                }
            }
            catch (Exception exception)
            {
                result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
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
