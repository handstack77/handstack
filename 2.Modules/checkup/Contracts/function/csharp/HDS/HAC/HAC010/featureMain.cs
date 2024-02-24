using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.IO;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.DataObject;

using checkup;

using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

using Serilog;

namespace HDS.Function.HAC
{
    public class HAC010
    {
        public DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC010.LF01";
            DataSet result = new DataSet();
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
                            var dataTable = JsonConvert.DeserializeObject<DataTable>(JsonConvert.SerializeObject(appSetting.DataSource == null ? "[]" : appSetting.DataSource));
                            if (dataTable != null)
                            {
                                result.Tables.Add(dataTable);
                            }
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
                    result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID} 확인 필요", typeMember);
                    goto TransactionException;
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

        public DataSet? GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC010.GF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string connectionString = dynamicParameters.Value("ConnectionString").ToStringSafe();
                string provider = dynamicParameters.Value("DataProvider").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(connectionString) == true
                    || string.IsNullOrEmpty(provider) == true)
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);
                    string commandText = string.Empty;

                    switch (dataProvider)
                    {
                        case DataProviders.SqlServer:
                            commandText = "SELECT GETDATE() AS ServerDateTime;";
                            break;
                        case DataProviders.Oracle:
                            commandText = "SELECT SYSDATE AS ServerDateTime FROM DUAL";
                            break;
                        case DataProviders.MySQL:
                            commandText = "SELECT NOW() AS ServerDateTime;";
                            break;
                        case DataProviders.PostgreSQL:
                            commandText = "SELECT CURRENT_DATE AS ServerDateTime;";
                            break;
                        case DataProviders.SQLite:
                            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                            if (Directory.Exists(appBasePath) == true)
                            {
                                connectionString = connectionString.Replace("{appBasePath}", appBasePath);
                            }
                            else
                            {
                                result.BuildExceptionData("Y", "Warning", "Connection 생성 실패. applicationID 정보 확인 필요", typeMember);
                                goto TransactionException;
                            }

                            commandText = "SELECT DATETIME('now','localtime') AS ServerDateTime;";
                            break;
                        default:
                            result.BuildExceptionData("Y", "Warning", "지원되지 않는 데이터 제공자. 요청 정보 확인 필요", typeMember);
                            goto TransactionException;
                    }

                    using (DatabaseFactory databaseFactory = new DatabaseFactory(connectionString, dataProvider))
                    {
                        if (databaseFactory.Connection == null)
                        {
                            result.BuildExceptionData("Y", "Warning", "Connection 생성 실패. 요청 정보 확인 필요", typeMember);
                            goto TransactionException;
                        }
                        else
                        {
                            if (databaseFactory.Connection.IsConnectionOpen() == false)
                            {
                                databaseFactory.Connection.Open();
                            }

                            using (var command = databaseFactory.Connection.CreateCommand())
                            {
                                command.CommandTimeout = 3000;
                                command.CommandText = commandText;
                                command.CommandType = CommandType.Text;

                                using (var ds = new DataSet())
                                {
                                    DbDataAdapter? dataAdapter = databaseFactory.SqlFactory.CreateDataAdapter();
                                    if (dataAdapter != null)
                                    {
                                        dataAdapter.SelectCommand = command;
                                        dataAdapter.Fill(ds);
                                    }

                                    if (ds != null && ds.Tables[0] != null)
                                    {
                                        result.Tables.Add(ds.Tables[0].Copy());
                                    }
                                }
                            }
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
        }

        public DataSet? MF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC010.MF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string connectionString = dynamicParameters.Value("ConnectionString").ToStringSafe();
            string provider = dynamicParameters.Value("DataProvider").ToStringSafe();
            string pageMode = dynamicParameters.Value("PageMode").ToStringSafe();
            string dataSourceID = dynamicParameters.Value("DataSourceID").ToStringSafe();
            string projectID = dynamicParameters.Value("ProjectID").ToStringSafe();
            string comment = dynamicParameters.Value("Comment").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(connectionString) == true
                || string.IsNullOrEmpty(provider) == true
                || string.IsNullOrEmpty(pageMode) == true
                || string.IsNullOrEmpty(dataSourceID) == true
                || string.IsNullOrEmpty(projectID) == true
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
                            var dataSourceJson = appSetting.DataSource;
                            if (dataSourceJson != null)
                            {
                                var dataSource = dataSourceJson.Find(p => p.ApplicationID == applicationID && p.DataSourceID == dataSourceID);
                                if (pageMode == "new")
                                {
                                    if (dataSource == null)
                                    {
                                        dataSource = new DataSource();
                                        dataSource.ApplicationID = applicationID;
                                        dataSource.DataSourceID = dataSourceID;
                                        dataSource.DataProvider = provider;
                                        dataSource.ConnectionString = connectionString;
                                        dataSource.ProjectID = projectID;
                                        dataSource.Comment = comment;

                                        dataSourceJson.Add(dataSource);

                                        System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{dataSourceID} 중복 데이터 원본 ID 확인 필요", typeMember);
                                        goto TransactionException;
                                    }
                                }
                                else if (pageMode == "read" || pageMode == "edit")
                                {
                                    if (dataSource != null)
                                    {
                                        dataSource.ApplicationID = applicationID;
                                        dataSource.DataSourceID = dataSourceID;
                                        dataSource.DataProvider = provider;
                                        dataSource.ConnectionString = connectionString;
                                        dataSource.ProjectID = projectID;
                                        dataSource.Comment = comment;

                                        System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                                    }
                                    else
                                    {
                                        result.BuildExceptionData("Y", "Warning", $"{dataSourceID} 데이터 원본 ID 확인 필요", typeMember);
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
            string typeMember = "HAC.HAC010.DF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string dataSourceID = dynamicParameters.Value("DataSourceID").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(dataSourceID) == true
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
                            var dataSourceJson = appSetting.DataSource;
                            if (dataSourceJson != null)
                            {
                                var dataSource = dataSourceJson.Find(p => p.ApplicationID == applicationID && p.DataSourceID == dataSourceID);
                                if (dataSource != null)
                                {
                                    dataSourceJson.Remove(dataSource);

                                    System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
                                }
                                else
                                {
                                    result.BuildExceptionData("Y", "Warning", $"{dataSourceID} 데이터 원본 ID 확인 필요", typeMember);
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
    }
}
