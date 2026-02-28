using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using MediatR;

using Newtonsoft.Json;

using repository.Entity;
using repository.Extensions;

using Serilog;

namespace repository.Events
{
    public class StorageRefreshRequest : IRequest<bool>
    {
        public string ChangeType { get; }

        public string FilePath { get; }

        public string? UserWorkID { get; }

        public string? ApplicationID { get; }

        public StorageRefreshRequest(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ChangeType = changeType;
            FilePath = filePath;
            UserWorkID = userWorkID;
            ApplicationID = applicationID;
        }
    }

    public class StorageRefreshRequestHandler : IRequestHandler<StorageRefreshRequest, bool>
    {
        private readonly ILogger logger;

        public StorageRefreshRequestHandler(ILogger logger)
        {
            this.logger = logger;
        }

        public Task<bool> Handle(StorageRefreshRequest request, CancellationToken cancellationToken)
        {
            var actionResult = false;
            var filePath = request.FilePath;

            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
            {
                filePath = filePath.Substring(1);
            }

            logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {request.ChangeType}, FilePath: {filePath}", "Storage/Refresh");

            var fileInfo = new FileInfo(filePath);

            lock (ModuleConfiguration.FileRepositorys)
            {
                var watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), request.ChangeType);
                switch (watcherChangeTypes)
                {
                    case WatcherChangeTypes.Created:
                    case WatcherChangeTypes.Changed:
                        foreach (var basePath in ModuleConfiguration.ContractBasePath)
                        {
                            var repositoryFile = PathExtensions.Join(basePath, filePath);
                            try
                            {
                                if (System.IO.File.Exists(repositoryFile) == true && (repositoryFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == false))
                                {
                                    var repositoryText = System.IO.File.ReadAllText(repositoryFile);
                                    var repositorys = JsonConvert.DeserializeObject<List<Repository>>(repositoryText);
                                    if (repositorys != null)
                                    {
                                        logger.Information("[{LogCategory}] " + $"Add Contract FilePath: {repositoryFile}", "Storage/Refresh");

                                        foreach (var repository in repositorys)
                                        {
                                            var findRepository = ModuleConfiguration.FileRepositorys.Find(x => x.ApplicationID == repository.ApplicationID && x.RepositoryID == repository.RepositoryID);
                                            if (findRepository != null)
                                            {
                                                ModuleConfiguration.FileRepositorys.Remove(findRepository);
                                            }
                                        }

                                        foreach (var repository in repositorys)
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
                                            logger.Information("[{LogCategory}] " + $"Add Contract RepositoryID: {repository.RepositoryID}, RepositoryName: {repository.RepositoryName}", "Storage/Refresh");
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
                        break;
                    case WatcherChangeTypes.Deleted:
                        foreach (var basePath in ModuleConfiguration.ContractBasePath)
                        {
                            var repositoryFile = PathExtensions.Join(basePath, filePath);
                            if (System.IO.File.Exists(repositoryFile) == true && (repositoryFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == false))
                            {
                                logger.Information("[{LogCategory}] " + $"Delete Contract FilePath: {repositoryFile}", "Storage/Refresh");

                                var repositoryText = System.IO.File.ReadAllText(repositoryFile);
                                var repositorys = JsonConvert.DeserializeObject<List<Repository>>(repositoryText);
                                if (repositorys != null)
                                {
                                    foreach (var repository in repositorys)
                                    {
                                        var findRepository = ModuleConfiguration.FileRepositorys.Find(x => x.ApplicationID == repository.ApplicationID && x.RepositoryID == repository.RepositoryID);
                                        if (findRepository != null)
                                        {
                                            ModuleConfiguration.FileRepositorys.Remove(findRepository);
                                            logger.Information("[{LogCategory}] " + $"Delete Contract RepositoryID: {findRepository.RepositoryID}, RepositoryName: {findRepository.RepositoryName}", "Storage/Refresh");
                                        }
                                    }
                                }
                                actionResult = true;
                                break;
                            }
                        }
                        break;
                }
            }

            return Task.FromResult(actionResult);
        }
    }
}
