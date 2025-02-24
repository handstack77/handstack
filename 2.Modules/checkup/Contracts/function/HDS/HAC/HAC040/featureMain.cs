using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;

using checkup.Entity;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Net;

namespace HDS.Function.HAC
{
    public class HAC040
    {
        protected DataSet? GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC040.GF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(userNo) == true)
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    string appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                            var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                            if (appSetting != null)
                            {
                                appSetting.DataSource = null;
                                appSetting.Storage = null;
                                appSetting.Public = null;
                                appSetting.Routing = null;
                                appSetting.Receive = null;
                                appSetting.Publish = null;
                                appSetting.AllowAnonymousPath = null;
                                appSetting.WithOrigin = null;
                                appSetting.WithReferer = null;
                            }

                            var dataTable = JsonConvert.DeserializeObject<DataTable>($"[{JsonConvert.SerializeObject(appSetting)}]");
                            if (dataTable != null)
                            {
                                result.Tables.Add(dataTable);
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                            goto TransactionException;
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
                        return result;
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

        protected DataSet? MF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC040.MF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string applicationName = dynamicParameters.Value("ApplicationName").ToStringSafe();
                string appSecret = dynamicParameters.Value("AppSecret").ToStringSafe();
                string signInID = dynamicParameters.Value("SignInID").ToStringSafe();
                string userNo = dynamicParameters.Value("UserNo").ToStringSafe();
                string comment = dynamicParameters.Value("Comment").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(applicationName) == true
                    || string.IsNullOrEmpty(userNo) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    string appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                            var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                            if (appSetting != null)
                            {
                                appSetting.ApplicationName = applicationName;
                                appSetting.AppSecret = appSecret;
                                appSetting.SignInID = signInID;
                                appSetting.Comment = comment;
                                appSetting.ModifiedMemberID = userNo;
                                appSetting.ModifiedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                                System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                            goto TransactionException;
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
                        return result;
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

        protected DataSet? DF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC040.DF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(userNo) == true)
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    string appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    if (Directory.Exists(appBasePath) == true)
                    {
                        string baseUrl = dataContext.functionHeader.Configuration?[$"{dataContext.platform}BaseUrl"].ToStringSafe();
                        string url = $"{baseUrl}/checkup/api/tenant-app/delete-app?memberNo={userNo}&userWorkID={userWorkID}&applicationID={applicationID}&accessKey={ModuleConfiguration.ManagedAccessKey}";

                        var client = new RestClient();
                        var request = new RestRequest(url, Method.Get);
                        request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                        RestResponse response = client.Execute(request);
                        if (response.StatusCode != HttpStatusCode.OK)
                        {
                            result.BuildExceptionData("Y", "Warning", response.Content.ToStringSafe(), typeMember);
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
                        return result;
                    }
                }
                catch (Exception exception)
                {
                    result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
                    goto TransactionException;
                }

TransactionException:
                return result;
            }
        }
    }
}
