using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

namespace HDS.Function.HFM
{
    public class HFM020
    {
        protected DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HFM.HFM020.LF01";
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
                    var logger = dataContext.logger;
                    logger?.Information($"Function: {typeMember} 작업 시작");

                    DataTableHelper dataTableBuilder = new DataTableHelper();
                    dataTableBuilder.AddColumn("name", typeof(string));
                    dataTableBuilder.AddColumn("version", typeof(string));

                    string nugetPackageFilePath = Path.Combine(GlobalConfiguration.EntryBasePath, "nuget.json");
                    if (System.IO.File.Exists(nugetPackageFilePath) == true)
                    {
                        string packageJson = "";
                        using (var fs = new FileStream(nugetPackageFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                        using (var sr = new StreamReader(fs))
                        {
                            packageJson = sr.ReadToEnd();
                        }

                        var package = JsonConvert.DeserializeAnonymousType(packageJson, new
                        {
                            Label = "",
                            PackageReference = new[] {
                                new {
                                    Include = "",
                                    Version = ""
                                }
                            }
                        });
                        if (package != null)
                        {
                            var referencedPackages = package.PackageReference;

                            List<string> excludePackages = new List<string>();
                            excludePackages.Add("HandStack.Core");
                            excludePackages.Add("HandStack.Data");
                            excludePackages.Add("HandStack.Web");

                            int rowIndex = -1;
                            foreach (var referencedPackage in referencedPackages)
                            {
                                if (excludePackages.IndexOf($"{referencedPackage.Include}") == -1)
                                {
                                    rowIndex = rowIndex + 1;
                                    dataTableBuilder.NewRow();
                                    dataTableBuilder.SetValue(rowIndex, 0, $"{referencedPackage.Include}");
                                    dataTableBuilder.SetValue(rowIndex, 1, $"{referencedPackage.Version}");
                                }
                            }
                        }
                    }

                    using (DataTable table = dataTableBuilder.GetDataTable())
                    {
                        table.DefaultView.Sort = "name ASC";
                        using (DataTable sortTable = table.DefaultView.ToTable())
                        {
                            result.Tables.Add(sortTable);
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
}
