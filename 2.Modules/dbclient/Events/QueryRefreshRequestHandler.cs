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

using Mediator;

namespace dbclient.Events
{
    public class QueryRefreshRequest(string changeType, string filePath) : IRequest<bool>
    {
        public string ChangeType { get; } = changeType;

        public string FilePath { get; } = filePath;
    }

    public class QueryRefreshRequestHandler(Serilog.ILogger logger) : IRequestHandler<QueryRefreshRequest, bool>
    {
        private readonly Serilog.ILogger logger = logger;

        public ValueTask<bool> Handle(QueryRefreshRequest request, CancellationToken cancellationToken)
        {
            var actionResult = false;
            ArgumentNullException.ThrowIfNull(request);
            var filePath = request.FilePath;

            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
            {
                filePath = filePath.SubstringSafe(1);
            }

            logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {request.ChangeType}, FilePath: {filePath}", "Query/Refresh");

            var fileInfo = new FileInfo(filePath);

            var businessContracts = DatabaseMapper.StatementMappings;
            lock (businessContracts)
            {
                var watcherChangeTypes = Enum.Parse<WatcherChangeTypes>(request.ChangeType);
                switch (watcherChangeTypes)
                {
                    case WatcherChangeTypes.Created:
                    case WatcherChangeTypes.Changed:
                        foreach (var basePath in ModuleConfiguration.ContractBasePath)
                        {
                            var itemPath = PathExtensions.Join(basePath, filePath);
                            var directoryInfo = new DirectoryInfo(basePath);
                            if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && ModuleConfiguration.IsContractFileExtension(fileInfo.Extension) == true)
                            {
                                logger.Information("[{LogCategory}] " + $"Add StatementMap FilePath: {filePath}", "Query/Refresh");
                                actionResult = DatabaseMapper.AddStatementMap(filePath, true, logger);
                                break;
                            }
                        }
                        break;
                    case WatcherChangeTypes.Deleted:
                        var existStatementMaps = new List<StatementMap>();
                        existStatementMaps = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == fileInfo.Directory?.Parent?.Name &&
                            p.ProjectID == fileInfo.Directory?.Name &&
                            p.TransactionID == fileInfo.Name.Replace(fileInfo.Extension, "")).ToList();

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

            return ValueTask.FromResult(actionResult);
        }
    }
}

