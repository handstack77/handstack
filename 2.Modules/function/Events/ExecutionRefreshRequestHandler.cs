using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using function.Entity;
using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using MediatR;

namespace function.Events
{
    public class ExecutionRefreshRequest : IRequest<bool>
    {
        public string ChangeType { get; }

        public string FilePath { get; }

        public string? UserWorkID { get; }

        public string? ApplicationID { get; }

        public ExecutionRefreshRequest(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ChangeType = changeType;
            FilePath = filePath;
            UserWorkID = userWorkID;
            ApplicationID = applicationID;
        }
    }

    public class ExecutionRefreshRequestHandler : IRequestHandler<ExecutionRefreshRequest, bool>
    {
        private readonly Serilog.ILogger logger;

        public ExecutionRefreshRequestHandler(Serilog.ILogger logger)
        {
            this.logger = logger;
        }

        public Task<bool> Handle(ExecutionRefreshRequest request, CancellationToken cancellationToken)
        {
            var actionResult = false;
            var filePath = request.FilePath;

            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
            {
                filePath = filePath.Substring(1);
            }

            logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {request.ChangeType}, FilePath: {filePath}", "Query/Refresh");

            var fileInfo = new FileInfo(filePath);

            var businessContracts = FunctionMapper.ScriptMappings;
            lock (businessContracts)
            {
                var watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), request.ChangeType);
                switch (watcherChangeTypes)
                {
                    case WatcherChangeTypes.Created:
                    case WatcherChangeTypes.Changed:
                        if (!string.IsNullOrWhiteSpace(request.UserWorkID) && !string.IsNullOrWhiteSpace(request.ApplicationID))
                        {
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, request.UserWorkID, request.ApplicationID);
                            var itemPath = PathExtensions.Join(appBasePath, filePath);
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && (fileInfo.Name.StartsWith("featureMain.") == true || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                            {
                                if (fileInfo.Extension != ".json")
                                {
                                    filePath = filePath.Replace(fileInfo.Name, "featureMeta.json");
                                }

                                logger.Information("[{LogCategory}] " + $"Add TenantApp ModuleScriptMap FilePath: {filePath}", "Query/Refresh");
                                actionResult = FunctionMapper.AddScriptMap(filePath, true, logger);
                            }
                        }
                        else
                        {
                            foreach (var basePath in ModuleConfiguration.ContractBasePath)
                            {
                                var itemPath = PathExtensions.Join(basePath, filePath);
                                var directoryInfo = new DirectoryInfo(basePath);
                                if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && (fileInfo.Name.StartsWith("featureMain.") == true || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                                {
                                    if (fileInfo.Extension != ".json")
                                    {
                                        filePath = filePath.Replace(fileInfo.Name, "featureMeta.json");
                                    }

                                    logger.Information("[{LogCategory}] " + $"Add ModuleScriptMap FilePath: {filePath}", "Query/Refresh");
                                    actionResult = FunctionMapper.AddScriptMap(filePath, true, logger);
                                    break;
                                }
                            }
                        }
                        break;
                    case WatcherChangeTypes.Deleted:
                        var existStatementMaps = new List<ModuleScriptMap>();
                        if (!string.IsNullOrWhiteSpace(request.UserWorkID) && !string.IsNullOrWhiteSpace(request.ApplicationID))
                        {
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, request.UserWorkID, request.ApplicationID);
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true)
                            {
                                existStatementMaps = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                                    p.ApplicationID == request.ApplicationID &&
                                    p.ProjectID == fileInfo.Directory?.Parent?.Name &&
                                    p.TransactionID == fileInfo.Directory?.Name).ToList();
                            }
                        }
                        else
                        {
                            existStatementMaps = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                                p.ApplicationID == GlobalConfiguration.ApplicationID &&
                                p.ProjectID == fileInfo.Directory?.Parent?.Name &&
                                p.TransactionID == fileInfo.Directory?.Name).ToList();
                        }

                        if (existStatementMaps.Count > 0)
                        {
                            var mapStrings = new List<string>();
                            for (var i = 0; i < existStatementMaps.Count; i++)
                            {
                                var item = existStatementMaps[i];
                                mapStrings.Add($"{item.ApplicationID}|{item.ProjectID}|{item.TransactionID}|{item.ScriptID}");
                            }

                            for (var i = 0; i < mapStrings.Count; i++)
                            {
                                var item = existStatementMaps[i];
                                var items = mapStrings[i].SplitAndTrim('|');
                                logger.Information("[{LogCategory}] " + $"Delete ModuleScriptMap ApplicationID: {item.ApplicationID}, ProjectID: {item.ProjectID}, TransactionID: {item.TransactionID}, FunctionID: {item.ScriptID}", "Query/Refresh");
                                FunctionMapper.Remove(items[0], items[1], items[2], items[3]);
                            }
                        }
                        break;
                }
            }

            return Task.FromResult(actionResult);
        }
    }
}
