using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;

using checkup.Entity;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.Modules;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HDS.Function.SYS
{
    public class SYS010
    {
        private readonly HttpContext? httpContext;

        public SYS010()
        {
            this.httpContext = null;
        }

        public SYS010(HttpContext? httpContext)
        {
            this.httpContext = httpContext;
        }

        public DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.LF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();
                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string applicationName = dynamicParameters.Value("ApplicationName").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(applicationName) == true)
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
                        string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
                        string searchPattern = "*.*";
                        string? sourceDirectoryPath = appBasePath;

                        List<Menu> menus = new List<Menu>();
                        if (string.IsNullOrEmpty(sourceDirectoryPath) == false && Directory.Exists(sourceDirectoryPath) == true)
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(sourceDirectoryPath);
                            if (directoryInfo.Exists == true)
                            {
                                Menu rootDirectory = new Menu();
                                rootDirectory.menuID = applicationID;
                                rootDirectory.menuName = string.IsNullOrEmpty(applicationName) == true ? applicationID : applicationName;
                                rootDirectory.parentMenuID = null;
                                rootDirectory.parentMenuName = null;
                                rootDirectory.showYN = "Y";
                                rootDirectory.menuType = "D";
                                rootDirectory.directoryYN = (rootDirectory.menuType == "D" ? "Y" : "N");
                                rootDirectory.functions = "";
                                rootDirectory.projectID = "";
                                rootDirectory.fileID = "";
                                rootDirectory.sortingNo = 1;
                                rootDirectory.level = 1;
                                rootDirectory.icon = "folder";
                                rootDirectory.badge = "";
                                menus.Add(rootDirectory);

                                string projectType = string.Empty;
                                projectType = "D";
                                searchPattern = "*.xml";
                                sourceDirectoryPath = Path.Combine(appBasePath, "dbclient");
                                FeatureBuildFileMenu(userWorkID, applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType);

                                projectType = "B";
                                searchPattern = "*.json";
                                sourceDirectoryPath = Path.Combine(appBasePath, "transact");
                                FeatureBuildFileMenu(userWorkID, applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType);

                                projectType = "U";
                                searchPattern = "*.html|*.js|*.json";
                                sourceDirectoryPath = Path.Combine(appBasePath, "wwwroot", "view");
                                FeatureBuildFileMenu(userWorkID, applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType);

                                if (GlobalConfiguration.IsTenantFunction == true)
                                {
                                    projectType = "F";
                                    searchPattern = "*.cs|*.js|*.json|*.xml|";
                                    sourceDirectoryPath = Path.Combine(appBasePath, "function");
                                    FeatureBuildFileMenu(userWorkID, applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType, new List<string>() { "working" });
                                }
                            }

                            menus = menus.OrderBy(p => p.menuID).ToList();
                            string menuJson = JsonConvert.SerializeObject(menus);
                            string compressBase64 = LZStringHelper.CompressToBase64(menuJson);
                            DataTableHelper dataTableBuilder = new DataTableHelper();
                            dataTableBuilder.AddColumn("HostFileMenu", typeof(string));

                            dataTableBuilder.NewRow();
                            dataTableBuilder.SetValue(0, 0, compressBase64);

                            using (DataTable table = dataTableBuilder.GetDataTable())
                            {
                                result.Tables.Add(table);
                            }
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
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

        public DataSet? LF02(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.LF02";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string applicationName = dynamicParameters.Value("ApplicationName").ToStringSafe();
                string projectType = dynamicParameters.Value("ProjectType").ToStringSafe();
                string parentMenuID = dynamicParameters.Value("ParentMenuID").ToStringSafe();
                string parentMenuName = dynamicParameters.Value("ParentMenuName").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(applicationName) == true
                    || string.IsNullOrEmpty(projectType) == true
                    || string.IsNullOrEmpty(parentMenuID) == true
                    || string.IsNullOrEmpty(parentMenuName) == true)
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
                        string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
                        string searchPattern = "*.*";
                        string? sourceDirectoryPath = appBasePath;

                        switch (projectType)
                        {
                            case "D":
                                searchPattern = "*.xml";
                                sourceDirectoryPath = Path.Combine(appBasePath, "dbclient");
                                break;
                            case "F":
                                searchPattern = "*.cs|*.js|*.json|*.xml|";
                                sourceDirectoryPath = Path.Combine(appBasePath, "function", "Node");
                                break;
                            case "B":
                                searchPattern = "*.json";
                                sourceDirectoryPath = Path.Combine(appBasePath, "transact");
                                break;
                            case "U":
                                searchPattern = "*.html|*.js|*.json";
                                sourceDirectoryPath = Path.Combine(appBasePath, "wwwroot", "view");
                                break;
                        }

                        List<Menu> menus = new List<Menu>();
                        if (string.IsNullOrEmpty(sourceDirectoryPath) == false && Directory.Exists(sourceDirectoryPath) == true)
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(sourceDirectoryPath);
                            if (directoryInfo.Exists == true)
                            {
                                foreach (var directory in directoryInfo.GetDirectories("*", SearchOption.TopDirectoryOnly))
                                {
                                    Menu menuDirectory = new Menu();
                                    menuDirectory.menuID = directory.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                                    menuDirectory.menuName = directory.Name;
                                    menuDirectory.parentMenuID = parentMenuID;
                                    menuDirectory.parentMenuName = parentMenuName;
                                    menuDirectory.showYN = "Y";
                                    menuDirectory.menuType = "D";
                                    menuDirectory.directoryYN = (menuDirectory.menuType == "D" ? "Y" : "N");
                                    menuDirectory.functions = "";
                                    menuDirectory.projectID = "";
                                    menuDirectory.fileID = "";
                                    menuDirectory.sortingNo = 1;
                                    menuDirectory.level = 1;
                                    menuDirectory.icon = "folder";
                                    menuDirectory.badge = "";
                                    menus.Add(menuDirectory);

                                    BuildFileMenu(userWorkID, applicationID, projectType, searchPattern, menus, directory, 2);
                                }
                            }
                        }

                        string menuJson = JsonConvert.SerializeObject(menus);
                        string compressBase64 = LZStringHelper.CompressToBase64(menuJson);
                        DataTableHelper dataTableBuilder = new DataTableHelper();
                        dataTableBuilder.AddColumn("HostFileMenu", typeof(string));

                        dataTableBuilder.NewRow();
                        dataTableBuilder.SetValue(0, 0, compressBase64);

                        using (DataTable table = dataTableBuilder.GetDataTable())
                        {
                            result.Tables.Add(table);
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
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

        public DataSet? LF03(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.LF03";
            DataSet result = new DataSet();
            try
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                )
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
                                DataTableHelper dataTableBuilder = new DataTableHelper();
                                dataTableBuilder.AddColumn("DataSourceID", typeof(string));
                                dataTableBuilder.AddColumn("DataProvider", typeof(string));
                                dataTableBuilder.AddColumn("Comment", typeof(string));

                                var items = dataTable.Select($"ApplicationID = '{applicationID}'");
                                for (int i = 0; i < items.Count(); i++)
                                {
                                    var item = items[i];

                                    string dataSourceID = item["DataSourceID"].ToStringSafe();
                                    string dataProvider = item["DataProvider"].ToStringSafe();
                                    string comment = item["Comment"].ToStringSafe();

                                    dataTableBuilder.NewRow();
                                    dataTableBuilder.SetValue(i, 0, dataSourceID);
                                    dataTableBuilder.SetValue(i, 1, dataProvider);
                                    dataTableBuilder.SetValue(i, 2, comment);
                                }

                                using (DataTable table = dataTableBuilder.GetDataTable())
                                {
                                    result.Tables.Add(table);
                                }
                            }
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 앱 환경설정 파일 확인 필요", typeMember);

                    }
                }

                if (result.Tables.Count == 1)
                {
                    result.BuildExceptionData("Y", "Warning", $"applicationID: {applicationID}의 데이터 원본 확인 필요", typeMember);
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

        public DataSet? LF04(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.LF04";
            using DataSet result = new DataSet();
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

                ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == "checkup");
                if (module != null)
                {
                    string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                    string configurationText = System.IO.File.ReadAllText(moduleConfigFilePath);
                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

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
                                string publishText = JsonConvert.SerializeObject(appSetting.Publish);
                                var publishSettings = JsonConvert.DeserializeAnonymousType(publishText, new[] {
                                    new {
                                        DeployID = "",
                                        Protocol = "",
                                        Host = "",
                                        ManagedKey = ""
                                    }
                                });

                                DataTableHelper dataTableBuilder = new DataTableHelper();
                                dataTableBuilder.AddColumn("DeployID", typeof(string));

                                dataTableBuilder.NewRow();
                                dataTableBuilder.SetValue(0, 0, "RequestOrigin");

                                if (publishSettings != null && publishSettings.Count() > 0)
                                {
                                    for (int i = 0; i < publishSettings.Count(); i++)
                                    {
                                        var publishSetting = publishSettings[i];
                                        dataTableBuilder.NewRow();
                                        dataTableBuilder.SetValue((i + 1), 0, publishSetting.DeployID);
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
            string typeMember = "SYS.SYS010.GF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string projectType = dynamicParameters.Value("ProjectType").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(itemPath) == true)
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                var logger = dataContext.logger;
                logger?.Information($"Function: {typeMember} 작업 시작");

                string sourceText = string.Empty;
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceItemPath = GetHostItemPath(appBasePath, projectType, itemPath);

                    if (string.IsNullOrEmpty(sourceItemPath) == false && System.IO.File.Exists(sourceItemPath) == true)
                    {
                        sourceText = LZStringHelper.CompressToBase64(System.IO.File.ReadAllText(sourceItemPath));
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "파일 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                DataTableHelper dataTableBuilder = new DataTableHelper();
                dataTableBuilder.AddColumn("SourceText", typeof(string));

                dataTableBuilder.NewRow();
                dataTableBuilder.SetValue(0, 0, sourceText);

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

        public DataSet? MF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.MF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string applicationNo = dynamicParameters.Value("ApplicationNo").ToStringSafe();
            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string compressBase64 = dynamicParameters.Value("CompressBase64").ToStringSafe();
            string projectType = dynamicParameters.Value("ProjectType").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();

            if (string.IsNullOrEmpty(applicationNo) == true
                || string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(compressBase64) == true
                || string.IsNullOrEmpty(itemPath) == true)
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
                    string? sourceItemPath = GetHostItemPath(appBasePath, projectType, itemPath);

                    if (string.IsNullOrEmpty(sourceItemPath) == false && System.IO.File.Exists(sourceItemPath) == true)
                    {
                        string? sourceText = LZStringHelper.DecompressFromBase64(compressBase64);
                        System.IO.File.WriteAllText(sourceItemPath, sourceText);
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "파일 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                    goto TransactionException;
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

        public DataSet? IF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.IF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string applicationNo = dynamicParameters.Value("ApplicationNo").ToStringSafe();
            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string projectType = dynamicParameters.Value("ProjectType").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();

            if (string.IsNullOrEmpty(applicationNo) == true
                || string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(itemPath) == true)
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                var logger = dataContext.logger;
                logger?.Information($"Function: {typeMember} 작업 시작");

                var pathProjectType = GetItemPathToProjectType(itemPath);
                if (pathProjectType != projectType)
                {
                    result.BuildExceptionData("Y", "Warning", "디렉토리 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceItemPath = GetHostItemPath(appBasePath, "", itemPath);

                    if (string.IsNullOrEmpty(sourceItemPath) == false && Directory.Exists(sourceItemPath) == false)
                    {
                        Directory.CreateDirectory(sourceItemPath);
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "디렉토리 정보 또는 중복 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                    goto TransactionException;
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

        public DataSet? IF02(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.IF02";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string applicationNo = dynamicParameters.Value("ApplicationNo").ToStringSafe();
            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string compressBase64 = dynamicParameters.Value("CompressBase64").ToStringSafe();
            string projectType = dynamicParameters.Value("ProjectType").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();

            if (string.IsNullOrEmpty(applicationNo) == true
                    || string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(compressBase64) == true
                    || string.IsNullOrEmpty(itemPath) == true)
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
                    string? sourceItemPath = GetHostItemPath(appBasePath, projectType, itemPath);

                    if (string.IsNullOrEmpty(sourceItemPath) == false && System.IO.File.Exists(sourceItemPath) == false)
                    {
                        string? sourceText = LZStringHelper.DecompressFromBase64(compressBase64);
                        FileInfo file = new FileInfo(sourceItemPath);
                        if (file.Directory?.Exists == false)
                        {
                            file.Directory.Create();
                        }
                        System.IO.File.WriteAllText(sourceItemPath, sourceText);
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "기존 파일 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                    goto TransactionException;
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

        public DataSet? DF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.DF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string applicationNo = dynamicParameters.Value("ApplicationNo").ToStringSafe();
            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string projectType = dynamicParameters.Value("ProjectType").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();

            if (string.IsNullOrEmpty(applicationNo) == true
                || string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(itemPath) == true)
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                var logger = dataContext.logger;
                logger?.Information($"Function: {typeMember} 작업 시작");

                var pathProjectType = GetItemPathToProjectType(itemPath);
                if (pathProjectType != projectType)
                {
                    result.BuildExceptionData("Y", "Warning", "디렉토리 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceItemPath = GetHostItemPath(appBasePath, "", itemPath);

                    if (string.IsNullOrEmpty(sourceItemPath) == false && Directory.Exists(sourceItemPath) == true)
                    {
                        Directory.Delete(sourceItemPath, true);
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "디렉토리 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                    goto TransactionException;
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

        public DataSet? DF02(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.DF02";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationNo = dynamicParameters.Value("ApplicationNo").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string projectType = dynamicParameters.Value("ProjectType").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();

            if (string.IsNullOrEmpty(applicationNo) == true
                || string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(itemPath) == true)
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
                    string? sourceItemPath = GetHostItemPath(appBasePath, projectType, itemPath);

                    if (string.IsNullOrEmpty(sourceItemPath) == false && System.IO.File.Exists(sourceItemPath) == true)
                    {
                        System.IO.File.Delete(sourceItemPath);
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "파일 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                    goto TransactionException;
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

        private static string GetItemPathToProjectType(string itemPath)
        {
            string? result = null;
            string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
            if (itemPath.StartsWith(directorySeparatorChar) == true)
            {
                itemPath = itemPath.Substring(1);
            }

            if (directorySeparatorChar != "/")
            {
                itemPath = itemPath.Replace("/", directorySeparatorChar);
            }

            if (itemPath.StartsWith("dbclient") == true)
            {
                result = "D";
            }
            else if (itemPath.StartsWith("function") == true)
            {
                result = "F";
            }
            else if (itemPath.StartsWith("transact") == true)
            {
                result = "B";
            }
            else if (itemPath.StartsWith("wwwroot") == true)
            {
                result = "U";
            }

            return result;
        }

        private static string GetHostItemPath(string appBasePath, string? projectType, string itemPath)
        {
            string? sourceItemPath = null;
            string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
            if (itemPath.StartsWith(directorySeparatorChar) == true)
            {
                itemPath = itemPath.Substring(1);
            }

            if (directorySeparatorChar != "/")
            {
                itemPath = itemPath.Replace("/", directorySeparatorChar);
            }

            switch (projectType)
            {
                case "D":
                    sourceItemPath = Path.Combine(appBasePath, "dbclient", itemPath);
                    break;
                case "F":
                    sourceItemPath = Path.Combine(appBasePath, "function", itemPath);
                    break;
                case "B":
                    sourceItemPath = Path.Combine(appBasePath, "transact", itemPath);
                    break;
                case "U":
                    sourceItemPath = Path.Combine(appBasePath, "wwwroot", "view", itemPath);
                    break;
                default:
                    sourceItemPath = Path.Combine(appBasePath, itemPath);
                    break;
            }

            return sourceItemPath;
        }

        private void FeatureBuildFileMenu(string userWorkID, string applicationID, string searchPattern, string sourceDirectoryPath, List<Menu> menus, DirectoryInfo directoryInfo, Menu rootDirectory, string projectType, List<string>? passingDirectorys = null)
        {
            DirectoryInfo featureDirectoryInfo = new DirectoryInfo(sourceDirectoryPath);
            if (featureDirectoryInfo.Exists == false)
            {
                featureDirectoryInfo.Create();
            }

            if (directoryInfo.Exists == true)
            {
                string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID) + directorySeparatorChar;
                Menu featureDirectory = new Menu();
                featureDirectory.menuID = featureDirectoryInfo.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                featureDirectory.menuName = featureDirectoryInfo.Name;
                featureDirectory.parentMenuID = rootDirectory.menuID;
                featureDirectory.parentMenuName = rootDirectory.menuName;
                featureDirectory.showYN = "Y";
                featureDirectory.projectType = projectType;
                featureDirectory.menuType = "D";
                featureDirectory.directoryYN = "Y";
                featureDirectory.functions = "";
                featureDirectory.projectID = "";
                featureDirectory.fileID = "";
                featureDirectory.sortingNo = 1;
                featureDirectory.level = 2;
                featureDirectory.icon = "folder";
                featureDirectory.badge = "";
                menus.Add(featureDirectory);

                foreach (var directory in featureDirectoryInfo.GetDirectories("*", SearchOption.TopDirectoryOnly))
                {
                    if (passingDirectorys != null && passingDirectorys.IndexOf(directory.Name) > -1)
                    {
                        continue;
                    }

                    Menu menuDirectory = new Menu();
                    menuDirectory.menuID = directory.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuDirectory.menuName = directory.Name;
                    menuDirectory.parentMenuID = featureDirectory.menuID;
                    menuDirectory.parentMenuName = featureDirectory.menuName;
                    menuDirectory.showYN = "Y";
                    menuDirectory.projectType = projectType;
                    menuDirectory.menuType = "D";
                    menuDirectory.directoryYN = "Y";
                    menuDirectory.functions = "";
                    menuDirectory.projectID = "";
                    menuDirectory.fileID = "";
                    menuDirectory.sortingNo = 1;
                    menuDirectory.level = 3;
                    menuDirectory.icon = "folder";
                    menuDirectory.badge = "";
                    menus.Add(menuDirectory);

                    BuildFileMenu(userWorkID, applicationID, projectType, searchPattern, menus, directory, 4);
                }
            }
        }

        private void BuildFileMenu(string userWorkID, string applicationID, string projectType, string searchPattern, List<Menu> menus, DirectoryInfo directory, int level)
        {
            string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID) + directorySeparatorChar;
            if (projectType == "F")
            {
                foreach (var directoryInfo in directory.GetDirectories("*", SearchOption.TopDirectoryOnly))
                {
                    Menu menuDirectory = new Menu();
                    menuDirectory.menuID = directoryInfo.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuDirectory.menuName = directoryInfo.Name;
                    menuDirectory.parentMenuID = directory.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuDirectory.parentMenuName = directory.Name;
                    menuDirectory.showYN = "Y";
                    menuDirectory.projectType = projectType;
                    menuDirectory.menuType = "D";
                    menuDirectory.directoryYN = "Y";
                    menuDirectory.functions = "";
                    menuDirectory.projectID = "";
                    menuDirectory.fileID = "";
                    menuDirectory.sortingNo = 1;
                    menuDirectory.level = level;
                    menuDirectory.icon = "folder";
                    menuDirectory.badge = "";
                    menus.Add(menuDirectory);

                    foreach (var file in directoryInfo.GetFileInfos(SearchOption.AllDirectories, searchPattern.Split("|").Where(x => string.IsNullOrWhiteSpace(x) == false).ToArray()))
                    {
                        Menu menuItem = new Menu();
                        menuItem.menuID = file.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                        menuItem.menuName = file.Directory?.Name + file.Extension;
                        menuItem.parentMenuID = menuDirectory.menuID;
                        menuItem.parentMenuName = menuDirectory.menuName;
                        menuItem.showYN = "Y";
                        menuItem.projectType = projectType;
                        menuItem.menuType = "F";
                        menuItem.directoryYN = "N";
                        menuItem.functions = "";
                        menuItem.projectID = projectType;
                        menuItem.fileID = "";
                        menuItem.sortingNo = 1;
                        menuItem.level = level + 1;
                        menuItem.icon = "";
                        menuItem.badge = "";
                        menuItem.extension = file.Extension;
                        menuItem.lastWriteTime = file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                        menuItem.length = file.Length.ToString();
                        menuItem.md5 = file.ToMD5Hash();

                        if (menuItem.fileID.StartsWith("/") == true)
                        {
                            menuItem.fileID = menuItem.fileID.Substring(1);
                        }

                        menus.Add(menuItem);
                    }
                }
            }
            else
            {
                foreach (var file in directory.GetFileInfos(SearchOption.TopDirectoryOnly, searchPattern.Split("|").Where(x => string.IsNullOrWhiteSpace(x) == false).ToArray()))
                {
                    Menu menuItem = new Menu();
                    menuItem.menuID = file.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuItem.menuName = file.Name;
                    menuItem.parentMenuID = directory.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuItem.parentMenuName = directory.Name;
                    menuItem.showYN = "Y";
                    menuItem.projectType = projectType;
                    menuItem.menuType = "F";
                    menuItem.directoryYN = "N";
                    menuItem.functions = "";
                    menuItem.projectID = "";
                    menuItem.fileID = "";
                    menuItem.sortingNo = 1;
                    menuItem.level = level;
                    menuItem.icon = "";
                    menuItem.badge = "";
                    menuItem.extension = file.Extension;
                    menuItem.lastWriteTime = file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                    menuItem.length = file.Length.ToString();
                    menuItem.md5 = file.ToMD5Hash();

                    if (menuItem.fileID.StartsWith("/") == true)
                    {
                        menuItem.fileID = menuItem.fileID.Substring(1);
                    }

                    menus.Add(menuItem);
                }
            }
        }
    }
}
