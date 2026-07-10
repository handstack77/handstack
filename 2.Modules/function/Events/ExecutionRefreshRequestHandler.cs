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

using Mediator;

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

        public ValueTask<bool> Handle(ExecutionRefreshRequest request, CancellationToken cancellationToken)
        {
            var actionResult = false;
            var filePath = request.FilePath;

            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
            {
                filePath = filePath.SubstringSafe(1);
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
                            var isFlatContractFile = ModuleConfiguration.IsContractFileExtension(fileInfo.Extension) == true && fileInfo.Name.Equals("featureSQL.xml", StringComparison.OrdinalIgnoreCase) == false;
                            if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && (fileInfo.Name.StartsWith("featureMain.") == true || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml" || isFlatContractFile == true) == true)
                            {
                                if (fileInfo.Extension != ".json" && isFlatContractFile == false)
                                {
                                    filePath = filePath.Replace(fileInfo.Name, "featureMeta.json");
                                }

                                logger.Information("[{LogCategory}] " + $"Add TenantApp ModuleScriptMap FilePath: {filePath}", "Query/Refresh");
                                actionResult = FunctionMapper.AddScriptMap(isFlatContractFile == true ? itemPath : filePath, true, logger);
                            }
                        }
                        else
                        {
                            foreach (var basePath in ModuleConfiguration.ContractBasePath)
                            {
                                var itemPath = PathExtensions.Join(basePath, filePath);
                                var directoryInfo = new DirectoryInfo(basePath);
                                var isFlatContractFile = ModuleConfiguration.IsContractFileExtension(fileInfo.Extension) == true && fileInfo.Name.Equals("featureSQL.xml", StringComparison.OrdinalIgnoreCase) == false;
                                if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && (fileInfo.Name.StartsWith("featureMain.") == true || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml" || isFlatContractFile == true) == true)
                                {
                                    if (fileInfo.Extension != ".json" && isFlatContractFile == false)
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
                        // 폴더 방식(featureMain.*/featureMeta.json/featureSQL.xml)은 fileInfo.Directory.Name 이 TransactionID.
                        // flat 단일 파일 방식({TransactionID}.xml/.fnc)은 fileInfo.Directory.Name 이 ProjectID 이고, TransactionID 는 파일명(확장자 제외).
                        var isDeletedFlatContractFile = ModuleConfiguration.IsContractFileExtension(fileInfo.Extension) == true && fileInfo.Name.Equals("featureSQL.xml", StringComparison.OrdinalIgnoreCase) == false;
                        var deletedProjectID = isDeletedFlatContractFile == true ? fileInfo.Directory?.Name : fileInfo.Directory?.Parent?.Name;
                        var deletedTransactionID = isDeletedFlatContractFile == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : fileInfo.Directory?.Name;
                        if (!string.IsNullOrWhiteSpace(request.UserWorkID) && !string.IsNullOrWhiteSpace(request.ApplicationID))
                        {
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, request.UserWorkID, request.ApplicationID);
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true)
                            {
                                existStatementMaps = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                                    p.ApplicationID == request.ApplicationID &&
                                    p.ProjectID == deletedProjectID &&
                                    p.TransactionID == deletedTransactionID).ToList();
                            }
                        }
                        else
                        {
                            existStatementMaps = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                                p.ApplicationID == GlobalConfiguration.ApplicationID &&
                                p.ProjectID == deletedProjectID &&
                                p.TransactionID == deletedTransactionID).ToList();
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

            return ValueTask.FromResult(actionResult);
        }
    }
}

