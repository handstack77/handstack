using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using graphclient.Entity;
using graphclient.Extensions;
using HandStack.Core.ExtensionMethod;
using Mediator;

namespace graphclient.Events
{
    public class QueryRefreshRequest(string changeType, string filePath, string? userWorkID, string? applicationID) : IRequest<bool>
    {
        public string ChangeType { get; } = changeType;

        public string FilePath { get; } = filePath;

        public string? UserWorkID { get; } = userWorkID;

        public string? ApplicationID { get; } = applicationID;
    }

    public class QueryRefreshRequestHandler(Serilog.ILogger logger) : IRequestHandler<QueryRefreshRequest, bool>
    {
        private readonly Serilog.ILogger logger = logger;

        public ValueTask<bool> Handle(QueryRefreshRequest request, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(request);

            var filePath = request.FilePath;
            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
            {
                filePath = filePath.SubstringSafe(1);
            }

            logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {request.ChangeType}, FilePath: {filePath}", "Query/Refresh");

            var fileInfo = new FileInfo(filePath);
            var watcherChangeTypes = Enum.Parse<WatcherChangeTypes>(request.ChangeType);
            var actionResult = false;

            switch (watcherChangeTypes)
            {
                case WatcherChangeTypes.Created:
                case WatcherChangeTypes.Changed:
                    if (ModuleConfiguration.IsContractFileExtension(fileInfo.Extension) == true)
                    {
                        actionResult = GraphMapper.AddStatementMap(filePath, true, logger);
                    }
                    break;
                case WatcherChangeTypes.Deleted:
                    var applicationID = fileInfo.Directory?.Parent?.Name ?? "";
                    var projectID = fileInfo.Directory?.Name ?? "";
                    var transactionID = Path.GetFileNameWithoutExtension(fileInfo.Name);
                    GraphMapper.RemoveByTransaction(applicationID, projectID, transactionID);
                    actionResult = true;
                    break;
            }

            return ValueTask.FromResult(actionResult);
        }
    }
}

