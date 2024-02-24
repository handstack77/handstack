using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Data.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.Modules;

using checkup;
using checkup.Entity;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

using Serilog;

namespace HDS.Function.HED
{
    public class HED030
    {
        private readonly HttpContext? httpContext;

        public HED030()
        {
            this.httpContext = null;
        }

        public HED030(HttpContext? httpContext)
        {
            this.httpContext = httpContext;
        }

        public DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HED.HED030.LF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string deployID = dynamicParameters.Value("DeployID").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(deployID) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logger = dataContext.logger;
                    logger?.Information($"Function: {typeMember} 작업 시작");
                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);

                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            string? protocol = string.Empty;
                            string? host = string.Empty;
                            string? managedKey = string.Empty;
                            if (deployID == "RequestOrigin")
                            {
                                ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == "checkup");
                                if (module != null)
                                {
                                    string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                                    string configurationText = System.IO.File.ReadAllText(moduleConfigFilePath);
                                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                                    protocol = httpContext?.Request.Scheme;
                                    host = httpContext?.Request.Host.ToString();
                                    managedKey = moduleConfigJson?.ModuleConfig.ManagedAccessKey;
                                }
                            }
                            else
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.Publish == null ? "[]" : appSetting.Publish));
                                    if (dataTable != null && dataTable.Rows.Count > 0)
                                    {
                                        var item = dataTable.Select($"DeployID = '{deployID}'").FirstOrDefault();
                                        if (item != null)
                                        {
                                            protocol = item["Protocol"].ToStringSafe();
                                            host = item["Host"].ToStringSafe();
                                            managedKey = item["ManagedKey"].ToStringSafe();
                                        }
                                    }
                                }
                            }

                            if (string.IsNullOrEmpty(protocol) == true || string.IsNullOrEmpty(host) == true)
                            {
                            }
                            else
                            {
                                string resource = $"/checkup/api/tenant-app/meta-scheme?userWorkID={userWorkID}&applicationID={applicationID}&accessKey={managedKey}";
                                var client = new RestClient();
                                var url = $"{protocol}://{host}{resource}";
                                var request = new RestRequest(url, Method.Get);
                                
                                request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                                RestResponse response = client.Execute(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 실행 정보 확인 필요", typeMember);
                                }
                                else
                                {
                                    using var table = JsonConvert.DeserializeObject<DataTable>(response.Content.ToStringSafe());
                                    if (table != null)
                                    {
                                        result.Tables.Add(table);
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 응답 정보 확인 필요", typeMember);
                                    }
                                }
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
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

        public DataSet? LF02(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HDM.HED030.LF02";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string tableName = dynamicParameters.Value("TableName").ToStringSafe();
                string deployID = dynamicParameters.Value("DeployID").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(tableName) == true
                    || string.IsNullOrEmpty(deployID) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logger = dataContext.logger;
                    logger?.Information($"Function: {typeMember} 작업 시작");
                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);

                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            string? protocol = string.Empty;
                            string? host = string.Empty;
                            string? managedKey = string.Empty;
                            if (deployID == "RequestOrigin")
                            {
                                ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == "checkup");
                                if (module != null)
                                {
                                    string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                                    string configurationText = System.IO.File.ReadAllText(moduleConfigFilePath);
                                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                                    protocol = httpContext?.Request.Scheme;
                                    host = httpContext?.Request.Host.ToString();
                                    managedKey = moduleConfigJson?.ModuleConfig.ManagedAccessKey;
                                }
                            }
                            else
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.Publish == null ? "[]" : appSetting.Publish));
                                    if (dataTable != null && dataTable.Rows.Count > 0)
                                    {
                                        var item = dataTable.Select($"DeployID = '{deployID}'").FirstOrDefault();
                                        if (item != null)
                                        {
                                            protocol = item["Protocol"].ToStringSafe();
                                            host = item["Host"].ToStringSafe();
                                            managedKey = item["ManagedKey"].ToStringSafe();
                                        }
                                    }
                                }
                            }

                            if (string.IsNullOrEmpty(protocol) == true || string.IsNullOrEmpty(host) == true)
                            {
                            }
                            else
                            {
                                string resource = $"/checkup/api/tenant-app/table-columns?userWorkID={userWorkID}&applicationID={applicationID}&tableName={tableName}&accessKey={managedKey}";
                                var client = new RestClient();
                                var url = $"{protocol}://{host}{resource}";
                                var request = new RestRequest(url, Method.Get);
                                
                                request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                                RestResponse response = client.Execute(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 실행 정보 확인 필요", typeMember);
                                }
                                else
                                {
                                    using var table = JsonConvert.DeserializeObject<DataTable>(response.Content.ToStringSafe());
                                    if (table != null)
                                    {
                                        result.Tables.Add(table);
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 응답 정보 확인 필요", typeMember);
                                    }
                                }
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
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

        public DataSet? LF03(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HDM.HED030.LF03";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string tableName = dynamicParameters.Value("TableName").ToStringSafe();
                string deployID = dynamicParameters.Value("DeployID").ToStringSafe();
                string pageIndex = dynamicParameters.Value("PageIndex").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(tableName) == true
                    || string.IsNullOrEmpty(deployID) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logger = dataContext.logger;
                    logger?.Information($"Function: {typeMember} 작업 시작");
                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);

                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            string? protocol = string.Empty;
                            string? host = string.Empty;
                            string? managedKey = string.Empty;
                            if (deployID == "RequestOrigin")
                            {
                                ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == "checkup");
                                if (module != null)
                                {
                                    string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                                    string configurationText = System.IO.File.ReadAllText(moduleConfigFilePath);
                                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                                    protocol = httpContext?.Request.Scheme;
                                    host = httpContext?.Request.Host.ToString();
                                    managedKey = moduleConfigJson?.ModuleConfig.ManagedAccessKey;
                                }
                            }
                            else
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.Publish == null ? "[]" : appSetting.Publish));
                                    if (dataTable != null && dataTable.Rows.Count > 0)
                                    {
                                        var item = dataTable.Select($"DeployID = '{deployID}'").FirstOrDefault();
                                        if (item != null)
                                        {
                                            protocol = item["Protocol"].ToStringSafe();
                                            host = item["Host"].ToStringSafe();
                                            managedKey = item["ManagedKey"].ToStringSafe();
                                        }
                                    }
                                }
                            }

                            if (string.IsNullOrEmpty(protocol) == true || string.IsNullOrEmpty(host) == true)
                            {
                            }
                            else
                            {
                                string resource = $"/checkup/api/tenant-app/table-data?userWorkID={userWorkID}&applicationID={applicationID}&tableName={tableName}&pageIndex={pageIndex}&accessKey={managedKey}";
                                var client = new RestClient();
                                var url = $"{protocol}://{host}{resource}";
                                var request = new RestRequest(url, Method.Get);
                                
                                request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                                RestResponse response = client.Execute(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 실행 정보 확인 필요", typeMember);
                                }
                                else
                                {
                                    using var dataSet = JsonConvert.DeserializeObject<DataSet>(response.Content.ToStringSafe());
                                    if (dataSet != null)
                                    {
                                        result.Tables.Add(dataSet.Tables[0].Copy());
                                        result.Tables.Add(dataSet.Tables[1].Copy());
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 응답 정보 확인 필요", typeMember);
                                    }
                                }
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
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

        public DataSet? MF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HED.HED030.MF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string deployID = dynamicParameters.Value("DeployID").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(deployID) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logger = dataContext.logger;
                    logger?.Information($"Function: {typeMember} 작업 시작");
                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);

                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            string? protocol = string.Empty;
                            string? host = string.Empty;
                            string? managedKey = string.Empty;
                            if (deployID == "RequestOrigin")
                            {
                                ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == "checkup");
                                if (module != null)
                                {
                                    string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                                    string configurationText = System.IO.File.ReadAllText(moduleConfigFilePath);
                                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                                    protocol = httpContext?.Request.Scheme;
                                    host = httpContext?.Request.Host.ToString();
                                    managedKey = moduleConfigJson?.ModuleConfig.ManagedAccessKey;
                                }
                            }
                            else
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.Publish == null ? "[]" : appSetting.Publish));
                                    if (dataTable != null && dataTable.Rows.Count > 0)
                                    {
                                        var item = dataTable.Select($"DeployID = '{deployID}'").FirstOrDefault();
                                        if (item != null)
                                        {
                                            protocol = item["Protocol"].ToStringSafe();
                                            host = item["Host"].ToStringSafe();
                                            managedKey = item["ManagedKey"].ToStringSafe();
                                        }
                                    }
                                }
                            }

                            if (string.IsNullOrEmpty(protocol) == true || string.IsNullOrEmpty(host) == true)
                            {
                            }
                            else
                            {
                                string resource = $"/checkup/api/tenant-app/backup-database?userWorkID={userWorkID}&applicationID={applicationID}&accessKey={managedKey}";
                                var client = new RestClient();
                                var url = $"{protocol}://{host}{resource}";
                                var request = new RestRequest(url, Method.Get);
                                
                                request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                                RestResponse response = client.Execute(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 실행 정보 확인 필요", typeMember);
                                }
                                else
                                {
                                    var content = response.Content;
                                    if (content != null)
                                    {
                                        DataTableHelper dataTableBuilder = new DataTableHelper();
                                        dataTableBuilder.AddColumn("TokenID", typeof(string));

                                        dataTableBuilder.NewRow();
                                        dataTableBuilder.SetValue(0, 0, content);

                                        using (DataTable table = dataTableBuilder.GetDataTable())
                                        {
                                            result.Tables.Add(table);
                                        }
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 응답 정보 확인 필요", typeMember);
                                    }
                                }
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
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

        public DataSet? MF02(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HED.HED030.MF02";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string deployID = dynamicParameters.Value("DeployID").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(deployID) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logger = dataContext.logger;
                    logger?.Information($"Function: {typeMember} 작업 시작");
                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);

                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            string? protocol = string.Empty;
                            string? host = string.Empty;
                            string? managedKey = string.Empty;
                            if (deployID == "RequestOrigin")
                            {
                                ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == "checkup");
                                if (module != null)
                                {
                                    string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                                    string configurationText = System.IO.File.ReadAllText(moduleConfigFilePath);
                                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                                    protocol = httpContext?.Request.Scheme;
                                    host = httpContext?.Request.Host.ToString();
                                    managedKey = moduleConfigJson?.ModuleConfig.ManagedAccessKey;
                                }
                            }
                            else
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.Publish == null ? "[]" : appSetting.Publish));
                                    if (dataTable != null && dataTable.Rows.Count > 0)
                                    {
                                        var item = dataTable.Select($"DeployID = '{deployID}'").FirstOrDefault();
                                        if (item != null)
                                        {
                                            protocol = item["Protocol"].ToStringSafe();
                                            host = item["Host"].ToStringSafe();
                                            managedKey = item["ManagedKey"].ToStringSafe();
                                        }
                                    }
                                }
                            }

                            if (string.IsNullOrEmpty(protocol) == true || string.IsNullOrEmpty(host) == true)
                            {
                            }
                            else
                            {
                                string resource = $"/checkup/api/tenant-app/restore-database?userWorkID={userWorkID}&applicationID={applicationID}&accessKey={managedKey}";
                                var client = new RestClient();
                                var url = $"{protocol}://{host}{resource}";
                                var request = new RestRequest(url, Method.Get);
                                
                                request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                                RestResponse response = client.Execute(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 실행 정보 확인 필요", typeMember);
                                }
                                else
                                {
                                    var content = response.Content;
                                    if (content != null)
                                    {
                                        DataTableHelper dataTableBuilder = new DataTableHelper();
                                        dataTableBuilder.AddColumn("TokenID", typeof(string));

                                        dataTableBuilder.NewRow();
                                        dataTableBuilder.SetValue(0, 0, content);

                                        using (DataTable table = dataTableBuilder.GetDataTable())
                                        {
                                            result.Tables.Add(table);
                                        }
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 응답 정보 확인 필요", typeMember);
                                    }
                                }
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
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

        public DataSet? IF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HED.HED030.IF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string deployID = dynamicParameters.Value("DeployID").ToStringSafe();
                string compressBase64 = dynamicParameters.Value("CompressBase64").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(deployID) == true
                    || string.IsNullOrEmpty(compressBase64) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logger = dataContext.logger;
                    logger?.Information($"Function: {typeMember} 작업 시작");
                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);

                    if (Directory.Exists(appBasePath) == true)
                    {
                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            string? protocol = string.Empty;
                            string? host = string.Empty;
                            string? managedKey = string.Empty;
                            if (deployID == "RequestOrigin")
                            {
                                ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == "checkup");
                                if (module != null)
                                {
                                    string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                                    string configurationText = System.IO.File.ReadAllText(moduleConfigFilePath);
                                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                                    protocol = httpContext?.Request.Scheme;
                                    host = httpContext?.Request.Host.ToString();
                                    managedKey = moduleConfigJson?.ModuleConfig.ManagedAccessKey;
                                }
                            }
                            else
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.Publish == null ? "[]" : appSetting.Publish));
                                    if (dataTable != null && dataTable.Rows.Count > 0)
                                    {
                                        var item = dataTable.Select($"DeployID = '{deployID}'").FirstOrDefault();
                                        if (item != null)
                                        {
                                            protocol = item["Protocol"].ToStringSafe();
                                            host = item["Host"].ToStringSafe();
                                            managedKey = item["ManagedKey"].ToStringSafe();
                                        }
                                    }
                                }
                            }

                            if (string.IsNullOrEmpty(protocol) == true || string.IsNullOrEmpty(host) == true)
                            {
                            }
                            else
                            {
                                string resource = $"/checkup/api/tenant-app/execute-sql?userWorkID={userWorkID}&applicationID={applicationID}&accessKey={managedKey}";
                                var client = new RestClient();
                                var url = $"{protocol}://{host}{resource}";
                                var request = new RestRequest(url, Method.Post);
                                request.AddParameter("compressBase64", compressBase64);
                                
                                RestResponse response = client.Execute(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 실행 정보 확인 필요", typeMember);
                                }
                                else
                                {
                                    var content = response.Content;
                                    if (content != null)
                                    {
                                        DataTableHelper dataTableBuilder = new DataTableHelper();
                                        dataTableBuilder.AddColumn("AffectedRows", typeof(string));

                                        dataTableBuilder.NewRow();
                                        dataTableBuilder.SetValue(0, 0, content);

                                        using (DataTable table = dataTableBuilder.GetDataTable())
                                        {
                                            result.Tables.Add(table);
                                        }
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{deployID} 대상 서버 응답 정보 확인 필요", typeMember);
                                    }
                                }
                            }
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "applicationID 정보 확인 필요", typeMember);
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
}
