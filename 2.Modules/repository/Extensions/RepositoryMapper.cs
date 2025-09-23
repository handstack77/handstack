using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using repository.Entity;

using Serilog;

namespace repository.Extensions
{
    public static class RepositoryMapper
    {
        public static void LoadContract(string environmentName, ILogger logger, IConfiguration configuration)
        {
            try
            {
                if (ModuleConfiguration.ContractBasePath.Count == 0)
                {
                    ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBaseDirectoryPath($"../contracts/{ModuleConfiguration.ModuleID}"));
                }

                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == false)
                    {
                        continue;
                    }

                    Log.Logger.Information("[{LogCategory}] ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");

                    var repositoryFiles = Directory.GetFiles(basePath, "*.json", SearchOption.AllDirectories);
                    foreach (var repositoryFile in repositoryFiles)
                    {
                        try
                        {
                            if (File.Exists(repositoryFile) == true && (repositoryFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == false))
                            {
                                var repositoryText = File.ReadAllText(repositoryFile);
                                var repositorys = JsonConvert.DeserializeObject<List<Repository>>(repositoryText);
                                if (repositorys != null)
                                {
                                    foreach (var repository in repositorys)
                                    {
                                        if (ModuleConfiguration.FileRepositorys.Find(x => x.ApplicationID == repository.ApplicationID && x.RepositoryID == repository.RepositoryID) == null)
                                        {
                                            if (repository.PhysicalPath.IndexOf("{appBasePath}") == -1)
                                            {
                                                repository.PhysicalPath = GlobalConfiguration.GetBaseDirectoryPath(repository.PhysicalPath);
                                                var repositoryDirectoryInfo = new DirectoryInfo(repository.PhysicalPath);
                                                if (repositoryDirectoryInfo.Exists == false)
                                                {
                                                    repositoryDirectoryInfo.Create();
                                                }
                                            }

                                            repository.UserWorkID = "";
                                            repository.SettingFilePath = repositoryFile;

                                            if (repository.IsLocalDbFileManaged == true)
                                            {
                                                ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.ZD01");
                                            }

                                            ModuleConfiguration.FileRepositorys.Add(repository);
                                        }
                                        else
                                        {
                                            Log.Logger.Warning("[{LogCategory}] " + $"{PathExtensions.Join(repositoryFile)} RepositoryID: {repository.RepositoryID}, RepositoryName: {repository.RepositoryName} 업무 계약 중복 확인 필요", $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            Log.Logger.Error("[{LogCategory}] " + $"{repositoryFile} 업무 계약 파일 오류 - " + exception.ToMessage(), $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");
                        }
                    }

                    var duplicates = ModuleConfiguration.FileRepositorys
                        .GroupBy(x => new { x.ApplicationID, x.RepositoryID })
                        .Where(g => g.Count() > 1)
                        .Select(g => new { g.Key.ApplicationID, g.Key.RepositoryID, Count = g.Count() });

                    foreach (var duplicate in duplicates)
                    {
                        logger.Warning("[{LogCategory}] " + $"중복 저장소 업무 계약 확인 필요. ApplicationID: {duplicate.ApplicationID}, RepositoryID: {duplicate.RepositoryID}, Count: {duplicate.Count}", "Storage/Refresh");
                    }
                }
            }
            catch (Exception exception)
            {
                Log.Logger.Error("[{LogCategory}] " + $"LoadContract 오류 - " + exception.ToMessage(), $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");
            }
        }
    }
}
