using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

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

namespace HDS.Function.HFM
{
    public class HFM030
    {
        public partial class PackageLock
        {
            [JsonProperty("name")]
            public string Name { get; set; }

            [JsonProperty("version")]
            public string Version { get; set; }

            [JsonProperty("lockfileVersion")]
            public long LockfileVersion { get; set; }

            [JsonProperty("requires")]
            public bool Requires { get; set; }

            [JsonProperty("packages")]
            public Dictionary<string, Package> Packages { get; set; }
        }

        public partial class Package
        {
            [JsonProperty("version")]
            public string Version { get; set; }

            [JsonProperty("resolved")]
            public Uri Resolved { get; set; }
        }

        protected DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HFM.HFM030.LF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

                if (string.IsNullOrWhiteSpace(userWorkID)
                    || string.IsNullOrWhiteSpace(applicationID)
                    || string.IsNullOrWhiteSpace(userNo))
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
                    dataTableBuilder.AddColumn("resolved", typeof(string));

                    string packageLockFilePath = dataContext.functionHeader.Configuration?[$"{dataContext.platform}PackageLockFilePath"].ToStringSafe();
                    packageLockFilePath = GlobalConfiguration.GetBaseDirectoryPath(packageLockFilePath);

                    if (System.IO.File.Exists(packageLockFilePath) == true)
                    {
                        var packageLockJson = System.IO.File.ReadAllText(packageLockFilePath);
                        var packageLock = JsonConvert.DeserializeObject<PackageLock>(packageLockJson);
                        if (packageLock != null)
                        {
                            var referencedPackages = packageLock.Packages;

                            List<string> excludePackages = new List<string>();
                            excludePackages.Add("node_modules/syn");

                            int rowIndex = -1;
                            foreach (var referencedPackage in referencedPackages)
                            {
                                if (!string.IsNullOrWhiteSpace(referencedPackage.Key) && excludePackages.IndexOf($"{referencedPackage.Key}") == -1)
                                {
                                    rowIndex = rowIndex + 1;
                                    dataTableBuilder.NewRow();
                                    dataTableBuilder.SetValue(rowIndex, 0, $"{referencedPackage.Key.Replace("node_modules/", "")}");
                                    dataTableBuilder.SetValue(rowIndex, 1, $"{referencedPackage.Value.Version}");
                                    dataTableBuilder.SetValue(rowIndex, 2, $"{referencedPackage.Value.Resolved}");
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

