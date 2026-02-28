using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using dbclient.Entity;
using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Extensions;

using MediatR;

namespace dbclient.Events
{
    public class QueryRefreshRequest : IRequest<bool>
    {
        public string ChangeType { get; }

        public string FilePath { get; }

        public string? UserWorkID { get; }

        public string? ApplicationID { get; }

        public QueryRefreshRequest(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ChangeType = changeType;
            FilePath = filePath;
            UserWorkID = userWorkID;
            ApplicationID = applicationID;
        }
    }

    public class QueryRefreshRequestHandler : IRequestHandler<QueryRefreshRequest, bool>
    {
        private readonly Serilog.ILogger logger;

        public QueryRefreshRequestHandler(Serilog.ILogger logger)
        {
            this.logger = logger;
        }

        public Task<bool> Handle(QueryRefreshRequest request, CancellationToken cancellationToken)
        {
            var actionResult = false;
            var filePath = request.FilePath;

            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
            {
                filePath = filePath.Substring(1);
            }

            logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {request.ChangeType}, FilePath: {filePath}", "Query/Refresh");

            var fileInfo = new FileInfo(filePath);

            var businessContracts = DatabaseMapper.StatementMappings;
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
                            if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && fileInfo.Extension == ".xml" == true)
                            {
                                logger.Information("[{LogCategory}] " + $"Add TenantApp StatementMap FilePath: {filePath}", "Query/Refresh");
                                actionResult = DatabaseMapper.AddStatementMap(filePath, true, logger);
                            }
                        }
                        else
                        {
                            foreach (var basePath in ModuleConfiguration.ContractBasePath)
                            {
                                var itemPath = PathExtensions.Join(basePath, filePath);
                                var directoryInfo = new DirectoryInfo(basePath);
                                if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && fileInfo.Extension == ".xml" == true)
                                {
                                    logger.Information("[{LogCategory}] " + $"Add StatementMap FilePath: {filePath}", "Query/Refresh");
                                    actionResult = DatabaseMapper.AddStatementMap(filePath, true, logger);
                                    break;
                                }
                            }
                        }
                        break;
                    case WatcherChangeTypes.Deleted:
                        var existStatementMaps = new List<StatementMap>();
                        if (!string.IsNullOrWhiteSpace(request.UserWorkID) && !string.IsNullOrWhiteSpace(request.ApplicationID))
                        {
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, request.UserWorkID, request.ApplicationID);
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true)
                            {
                                existStatementMaps = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                                    p.ApplicationID == request.ApplicationID &&
                                    p.ProjectID == fileInfo.Directory?.Name &&
                                    p.TransactionID == fileInfo.Name.Replace(fileInfo.Extension, "")).ToList();
                            }
                        }
                        else
                        {
                            existStatementMaps = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                                p.ApplicationID == fileInfo.Directory?.Parent?.Name &&
                                p.ProjectID == fileInfo.Directory?.Name &&
                                p.TransactionID == fileInfo.Name.Replace(fileInfo.Extension, "")).ToList();
                        }

                        if (existStatementMaps.Count > 0)
                        {
                            var mapStrings = new List<string>();
                            for (var i = 0; i < existStatementMaps.Count; i++)
                            {
                                var item = existStatementMaps[i];
                                mapStrings.Add($"{item.ApplicationID}|{item.ProjectID}|{item.TransactionID}|{item.StatementID}");
                            }

                            for (var i = 0; i < mapStrings.Count; i++)
                            {
                                var item = existStatementMaps[i];
                                var items = mapStrings[i].SplitAndTrim('|');
                                logger.Information("[{LogCategory}] " + $"Delete StatementMap ApplicationID: {item.ApplicationID}, ProjectID: {item.ProjectID}, TransactionID: {item.TransactionID}, FunctionID: {item.StatementID}", "Query/Refresh");
                                DatabaseMapper.Remove(items[0], items[1], items[2], items[3]);
                            }
                        }
                        break;
                }
            }

            return Task.FromResult(actionResult);
        }
    }
}
