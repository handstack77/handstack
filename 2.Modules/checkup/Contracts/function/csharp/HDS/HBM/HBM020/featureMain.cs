using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HDS.Function.HBM
{
    public class HBM020
    {
        public DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HBM.HBM020.LF01";
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
                            string publicText = JsonConvert.SerializeObject(appSetting.Public);
                            var publicTransactions = JsonConvert.DeserializeAnonymousType(publicText, new[] {
                                new {
                                    ProjectID = "",
                                    TransactionID = "",
                                    Comment = ""
                                }
                            });

                            DataTableHelper dataTableBuilder = new DataTableHelper();
                            dataTableBuilder.AddColumn("ProjectID", typeof(string));
                            dataTableBuilder.AddColumn("TransactionID", typeof(string));
                            dataTableBuilder.AddColumn("Comment", typeof(string));

                            if (publicTransactions != null && publicTransactions.Count() > 0)
                            {
                                for (int i = 0; i < publicTransactions.Count(); i++)
                                {
                                    var publicTransaction = publicTransactions[i];
                                    dataTableBuilder.NewRow();
                                    dataTableBuilder.SetValue(i, 0, publicTransaction.ProjectID);
                                    dataTableBuilder.SetValue(i, 1, publicTransaction.TransactionID);
                                    dataTableBuilder.SetValue(i, 2, publicTransaction.Comment);
                                }
                            }

                            using (DataTable table = dataTableBuilder.GetDataTable())
                            {
                                result.Tables.Add(table);
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
                return result;
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
            string typeMember = "HBM.HBM010.MF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string publics = dynamicParameters.Value("WithPublics").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(publics) == true
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
                    string settingFilePath = Path.Combine(appBasePath, "settings.json");
                    if (System.IO.File.Exists(settingFilePath) == true)
                    {
                        string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                        if (appSetting != null)
                        {
                            var appPublics = JsonConvert.DeserializeObject<List<AppPublic>>(publics);
                            if (appPublics == null)
                            {
                                appSetting.Public = new List<AppPublic>();
                            }
                            else
                            {
                                appSetting.Public = appPublics;
                            }

                            System.IO.File.WriteAllText(settingFilePath, JsonConvert.SerializeObject(appSetting, Formatting.Indented));
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
            return result;
        }
    }
}
