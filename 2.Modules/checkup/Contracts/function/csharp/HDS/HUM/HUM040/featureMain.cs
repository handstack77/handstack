using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;

using checkup.Entity;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json.Linq;

namespace HDS.Function.HUM
{
    public class HUM040
    {
        private readonly HttpContext? httpContext;

        public HUM040()
        {
            this.httpContext = null;
        }

        public HUM040(HttpContext? httpContext)
        {
            this.httpContext = httpContext;
        }

        protected DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HUM.HUM040.LF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string applicationName = dynamicParameters.Value("ApplicationName").ToStringSafe();
                string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(applicationName) == true
                    || string.IsNullOrEmpty(userNo) == true)
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

                                string projectType = string.Empty;

                                projectType = "R";
                                searchPattern = "*.html|*.js|*.css|*.json";
                                sourceDirectoryPath = Path.Combine(appBasePath, "wwwroot");
                                directoryInfo = new DirectoryInfo(sourceDirectoryPath);
                                WWWRootFileMenu(userWorkID, applicationID, projectType, searchPattern, menus, directoryInfo, rootDirectory, 2);
                            }

                            menus = menus.OrderBy(p => p.menuID).ToList();
                            DataTableHelper dataTableBuilder = new DataTableHelper();
                            dataTableBuilder.AddColumn("FileID", typeof(string));
                            dataTableBuilder.AddColumn("FileName", typeof(string));
                            dataTableBuilder.AddColumn("Extension", typeof(string));
                            dataTableBuilder.AddColumn("MD5", typeof(string));
                            dataTableBuilder.AddColumn("Length", typeof(string));
                            dataTableBuilder.AddColumn("LastWriteTime", typeof(string));

                            for (int i = 0; i < menus.Count; i++)
                            {
                                dataTableBuilder.NewRow();

                                var menu = menus[i];
                                dataTableBuilder.SetValue(i, 0, menu.menuID);
                                dataTableBuilder.SetValue(i, 1, menu.menuName);
                                dataTableBuilder.SetValue(i, 2, menu.extension);
                                dataTableBuilder.SetValue(i, 3, menu.md5);
                                dataTableBuilder.SetValue(i, 4, menu.length);
                                dataTableBuilder.SetValue(i, 5, menu.lastWriteTime);
                            }

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

        protected DataSet? GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HUM.HUM040.GF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();
            string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(itemPath) == true
                || string.IsNullOrEmpty(userNo) == true)
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
                    string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
                    if (directorySeparatorChar != "/")
                    {
                        itemPath = itemPath.Replace("/", directorySeparatorChar);
                    }
                    string? sourceItemPath = Path.Combine(appBasePath, itemPath);

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
                dataTableBuilder.AddColumn("CompressBase64", typeof(string));

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

        protected DataSet? MF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HUM.HUM040.MF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string compressBase64 = dynamicParameters.Value("CompressBase64").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();
            string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(compressBase64) == true
                || string.IsNullOrEmpty(itemPath) == true
                || string.IsNullOrEmpty(userNo) == true)
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                var logger = dataContext.logger;
                logger?.Information($"Function: {typeMember} 작업 시작");

                FileInfo fileInfo = new FileInfo(itemPath);
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
                    if (directorySeparatorChar != "/")
                    {
                        itemPath = itemPath.Replace("/", directorySeparatorChar);
                    }
                    string? sourceItemPath = Path.Combine(appBasePath, itemPath);

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

        private void WWWRootFileMenu(string userWorkID, string applicationID, string projectType, string searchPattern, List<Menu> menus, DirectoryInfo directory, Menu rootDirectory, int level)
        {
            string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID) + directorySeparatorChar;
            foreach (var file in directory.GetFileInfos(SearchOption.TopDirectoryOnly, searchPattern.Split("|").Where(x => string.IsNullOrWhiteSpace(x) == false).ToArray()))
            {
                Menu menuItem = new Menu();
                menuItem.menuID = file.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                menuItem.menuName = file.Name;
                menuItem.parentMenuID = rootDirectory.menuID;
                menuItem.parentMenuName = rootDirectory.menuName;
                menuItem.showYN = "Y";
                menuItem.projectType = projectType;
                menuItem.menuType = "F";
                menuItem.directoryYN = "N";
                menuItem.functions = "";
                menuItem.projectID = "";
                menuItem.fileID = "";
                menuItem.sortingNo = 2;
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
