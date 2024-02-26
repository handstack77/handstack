using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Net;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.DataObject;

using checkup;

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

namespace HDS.Function.HAC
{
    public class HAC020
    {
        public DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC020.LF01";
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
                            var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.Storage == null ? "[]" : appSetting.Storage));
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

                return result;
            }
            catch (Exception exception)
            {
                result.BuildExceptionData("Y", "Error", exception.Message, typeMember, exception.StackTrace);
                return result;
            }

TransactionException:
            if (result.Tables.Count == 1)
            {
                result.Tables.Add(new DataTable());
            }

            return result;
        }

        public DataSet? GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC020.GF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string requestOrigin = dynamicParameters.Value("RequestOrigin").ToStringSafe();
            string repositoryID = dynamicParameters.Value("RepositoryID").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(requestOrigin) == true
                || string.IsNullOrEmpty(repositoryID) == true)
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                var url = $"{requestOrigin}/repository/api/storage/get-repository?applicationID={applicationID}&repositoryID={repositoryID}";
                var client = new RestClient();
                var request = new RestRequest(url, Method.Get);

                request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                request.AddHeader("Content-Type", "application/json; charset=utf-8");

                RestResponse response = client.Execute(request);
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    if (response.Content.ToStringSafe() == "{}")
                    {
                        result.BuildExceptionData("Y", "Warning", "저장소 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                    else
                    {
                        var dataTable = JsonConvert.DeserializeObject<DataTable>($"[{response.Content.ToStringSafe()}]");
                        if (dataTable != null)
                        {
                            result.Tables.Add(dataTable);
                        }
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "저장소 모듈 실행 확인 필요", typeMember);
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

        public DataSet? MF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC020.MF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string pageMode = dynamicParameters.Value("PageMode").ToStringSafe();
            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string repositoryID = dynamicParameters.Value("RepositoryID").ToStringSafe();
            string repositoryName = dynamicParameters.Value("RepositoryName").ToStringSafe();
            string accessID = dynamicParameters.Value("AccessID").ToStringSafe();
            string storageType = dynamicParameters.Value("StorageType").ToStringSafe();
            string physicalPath = dynamicParameters.Value("PhysicalPath").ToStringSafe();
            string blobContainerID = dynamicParameters.Value("BlobContainerID").ToStringSafe();
            string blobConnectionString = dynamicParameters.Value("BlobConnectionString").ToStringSafe();
            string blobItemUrl = dynamicParameters.Value("BlobItemUrl").ToStringSafe();
            string isVirtualPath = dynamicParameters.Value("IsVirtualPath").ToStringSafe();
            string accessMethod = dynamicParameters.Value("AccessMethod").ToStringSafe();
            string isFileUploadDownloadOnly = dynamicParameters.Value("IsFileUploadDownloadOnly").ToStringSafe();
            string isMultiUpload = dynamicParameters.Value("IsMultiUpload").ToStringSafe();
            string isFileOverWrite = dynamicParameters.Value("IsFileOverWrite").ToStringSafe();
            string isFileNameEncrypt = dynamicParameters.Value("IsFileNameEncrypt").ToStringSafe();
            string isKeepFileExtension = dynamicParameters.Value("IsKeepFileExtension").ToStringSafe();
            string isAutoPath = dynamicParameters.Value("IsAutoPath").ToStringSafe();
            string policyPathID = dynamicParameters.Value("PolicyPathID").ToStringSafe();
            string uploadTypeID = dynamicParameters.Value("UploadTypeID").ToStringSafe();
            string uploadExtensions = dynamicParameters.Value("UploadExtensions").ToStringSafe();
            string uploadCount = dynamicParameters.Value("UploadCount").ToStringSafe();
            string uploadSizeLimit = dynamicParameters.Value("UploadSizeLimit").ToStringSafe();
            string isLocalDBFileManaged = dynamicParameters.Value("IsLocalDbFileManaged").ToStringSafe();
            string sqliteConnectionString = dynamicParameters.Value("SQLiteConnectionString").ToStringSafe();
            string transactionGetItem = dynamicParameters.Value("TransactionGetItem").ToStringSafe();
            string transactionDeleteItem = dynamicParameters.Value("TransactionDeleteItem").ToStringSafe();
            string transactionUpsertItem = dynamicParameters.Value("TransactionUpsertItem").ToStringSafe();
            string transactionUpdateDependencyID = dynamicParameters.Value("TransactionUpdateDependencyID").ToStringSafe();
            string transactionUpdateFileName = dynamicParameters.Value("TransactionUpdateFileName").ToStringSafe();
            string comment = dynamicParameters.Value("Comment").ToStringSafe();
            string requestOrigin = dynamicParameters.Value("RequestOrigin").ToStringSafe();
            string createdAt = DateTime.Now.ToString("u");

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(pageMode) == true
                || string.IsNullOrEmpty(repositoryID) == true
                || string.IsNullOrEmpty(repositoryName) == true
                || string.IsNullOrEmpty(storageType) == true
                || string.IsNullOrEmpty(uploadTypeID) == true
                || string.IsNullOrEmpty(requestOrigin) == true
            )
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            if (storageType == "FileSystem")
            {
                if (string.IsNullOrEmpty(physicalPath) == true)
                {
                    result.BuildExceptionData("Y", "Warning", "FileSystem 필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }
            }
            else if (storageType == "AzureBlob")
            {
                if (string.IsNullOrEmpty(blobContainerID) == true
                    || string.IsNullOrEmpty(blobConnectionString) == true
                    || string.IsNullOrEmpty(blobItemUrl) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "AzureBlob 필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }
            }
            else
            {
                result.BuildExceptionData("Y", "Warning", $"StorageType: {storageType} 정보 확인 필요", typeMember);
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
                            var repositoryJson = appSetting.Storage;
                            if (repositoryJson != null)
                            {
                                var repository = repositoryJson.Find(p => p.ApplicationID == applicationID && p.RepositoryID == repositoryID);
                                if (pageMode == "new")
                                {
                                    if (repository == null)
                                    {
                                        repository = new AppStorage();
                                        repository.ApplicationID = applicationID;
                                        repository.RepositoryID = repositoryID;
                                        repository.RepositoryName = repositoryName;
                                        repository.AccessID = accessID;
                                        repository.StorageType = storageType;
                                        repository.PhysicalPath = physicalPath;
                                        repository.BlobContainerID = blobContainerID;
                                        repository.BlobConnectionString = blobConnectionString;
                                        repository.BlobItemUrl = blobItemUrl;
                                        repository.IsVirtualPath = isVirtualPath.ParseBool(false);
                                        repository.AccessMethod = accessMethod;
                                        repository.IsFileUploadDownloadOnly = isFileUploadDownloadOnly.ParseBool(false);
                                        repository.IsMultiUpload = isMultiUpload.ParseBool(false);
                                        repository.IsFileOverWrite = isFileOverWrite.ParseBool(false);
                                        repository.IsFileNameEncrypt = isFileNameEncrypt.ParseBool(false);
                                        repository.IsKeepFileExtension = isKeepFileExtension.ParseBool(false);
                                        repository.IsAutoPath = isAutoPath.ParseBool(false);
                                        repository.PolicyPathID = policyPathID;
                                        repository.UploadTypeID = uploadTypeID;
                                        repository.UploadExtensions = uploadExtensions;
                                        repository.UploadCount = uploadCount.ParseInt(0);
                                        repository.UploadSizeLimit = uploadSizeLimit.ParseInt(0);
                                        repository.IsLocalDbFileManaged = isLocalDBFileManaged.ParseBool(false);
                                        repository.SQLiteConnectionString = sqliteConnectionString;
                                        repository.TransactionGetItem = transactionGetItem;
                                        repository.TransactionDeleteItem = transactionDeleteItem;
                                        repository.TransactionUpsertItem = transactionUpsertItem;
                                        repository.TransactionUpdateDependencyID = transactionUpdateDependencyID;
                                        repository.TransactionUpdateFileName = transactionUpdateFileName;
                                        repository.Comment = comment;
                                        repository.CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

                                        repositoryJson.Add(repository);

                                        System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{repositoryID} 중복 저장소 ID 확인 필요", typeMember);
                                        goto TransactionException;
                                    }
                                }
                                else if (pageMode == "edit")
                                {
                                    if (repository != null)
                                    {
                                        repository.ApplicationID = applicationID;
                                        repository.RepositoryID = repositoryID;
                                        repository.RepositoryName = repositoryName;
                                        repository.AccessID = accessID;
                                        repository.StorageType = storageType;
                                        repository.PhysicalPath = physicalPath;
                                        repository.BlobContainerID = blobContainerID;
                                        repository.BlobConnectionString = blobConnectionString;
                                        repository.BlobItemUrl = blobItemUrl;
                                        repository.IsVirtualPath = isVirtualPath.ParseBool(false);
                                        repository.AccessMethod = accessMethod;
                                        repository.IsFileUploadDownloadOnly = isFileUploadDownloadOnly.ParseBool(false);
                                        repository.IsMultiUpload = isMultiUpload.ParseBool(false);
                                        repository.IsFileOverWrite = isFileOverWrite.ParseBool(false);
                                        repository.IsFileNameEncrypt = isFileNameEncrypt.ParseBool(false);
                                        repository.IsKeepFileExtension = isKeepFileExtension.ParseBool(false);
                                        repository.IsAutoPath = isAutoPath.ParseBool(false);
                                        repository.PolicyPathID = policyPathID;
                                        repository.UploadTypeID = uploadTypeID;
                                        repository.UploadExtensions = uploadExtensions;
                                        repository.UploadCount = uploadCount.ParseInt(0);
                                        repository.UploadSizeLimit = uploadSizeLimit.ParseInt(0);
                                        repository.IsLocalDbFileManaged = isLocalDBFileManaged.ParseBool(false);
                                        repository.SQLiteConnectionString = sqliteConnectionString;
                                        repository.TransactionGetItem = transactionGetItem;
                                        repository.TransactionDeleteItem = transactionDeleteItem;
                                        repository.TransactionUpsertItem = transactionUpsertItem;
                                        repository.TransactionUpdateDependencyID = transactionUpdateDependencyID;
                                        repository.TransactionUpdateFileName = transactionUpdateFileName;
                                        repository.Comment = comment;
                                        repository.ModifiedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

                                        System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{repositoryID} 저장소 ID 확인 필요", typeMember);
                                        goto TransactionException;
                                    }
                                }
                                else
                                {
                                    result.BuildExceptionData("Y", "Warning", $"PageMode: {pageMode} 정보 확인 필요", typeMember);
                                    goto TransactionException;
                                }

                                var url = $"{requestOrigin}/repository/api/managed/reset-app-contract?applicationID={applicationID}&userWorkID={userWorkID}";
                                var client = new RestClient();
                                var request = new RestRequest(url, Method.Get);

                                request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                                request.AddHeader("Content-Type", "application/json; charset=utf-8");

                                RestResponse response = client.Execute(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    result.BuildExceptionData("Y", "Warning", "저장소 모듈 실행 확인 필요", typeMember);
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
                goto TransactionException;
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
            string typeMember = "HAC.HAC020.DF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string repositoryID = dynamicParameters.Value("RepositoryID").ToStringSafe();
            string requestOrigin = dynamicParameters.Value("RequestOrigin").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(repositoryID) == true
                || string.IsNullOrEmpty(requestOrigin) == true
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
                            var repositoryJson = appSetting.Storage;
                            if (repositoryJson != null)
                            {
                                var repository = repositoryJson.Find(p => p.ApplicationID == applicationID && p.RepositoryID == repositoryID);
                                if (repository != null)
                                {
                                    repositoryJson.Remove(repository);

                                    System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));

                                    var url = $"{requestOrigin}/repository/api/managed/reset-app-contract?applicationID={applicationID}&userWorkID={userWorkID}";
                                    var client = new RestClient();
                                    var request = new RestRequest(url, Method.Get);

                                    request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                                    request.AddHeader("Content-Type", "application/json; charset=utf-8");

                                    RestResponse response = client.Execute(request);
                                    if (response.StatusCode != HttpStatusCode.OK)
                                    {
                                        result.BuildExceptionData("Y", "Warning", "저장소 모듈 실행 확인 필요", typeMember);
                                        goto TransactionException;
                                    }
                                }
                                else
                                {
                                    result.BuildExceptionData("Y", "Warning", $"{repositoryID} 저장소 ID 확인 필요", typeMember);
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
