using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;

using checkup.Entity;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace checkup.Areas.checkup.Controllers
{
    [Area("checkup")]
    [Route("[area]/api/[controller]")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [ApiController]
    public class FunctionController : ControllerBase
    {
        // http://localhost:8000/checkup/api/function/execute?accessToken=test&loadOptions[option1]=value1&featureMeta.Timeout=0
        [HttpPost("[action]")]
        public DataSet? Execute([FromBody] List<DynamicParameter> dynamicParameters, [FromQuery] DataContext dataContext)
        {
            string typeMember = "SYS.SYS010.LF01";
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

                                // projectType = "F";
                                // searchPattern = "*.cs|*.js|*.json|*.xml|";
                                // sourceDirectoryPath = Path.Combine(appBasePath, "function");
                                // FeatureBuildFileMenu(applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType, new List<string>() { "working" });
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

        private readonly IHttpContextAccessor httpContextAccessor;

        private readonly HttpContext? httpContext;

        public FunctionController(IHttpContextAccessor httpContextAccessor)
        {
            this.httpContextAccessor = httpContextAccessor;
            httpContext = httpContextAccessor.HttpContext;
        }

        [HttpGet]
        public string Get()
        {
            return "checkup FunctionController";
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
