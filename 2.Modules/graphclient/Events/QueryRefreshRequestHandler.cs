using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using graphclient.Extensions;

using MediatR;

namespace graphclient.Events
{
    public class QueryRefreshRequest : IRequest<bool>
    {
        public QueryRefreshRequest(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ChangeType = changeType;
            FilePath = filePath;
            UserWorkID = userWorkID;
            ApplicationID = applicationID;
        }

        public string ChangeType { get; }

        public string FilePath { get; }

        public string? UserWorkID { get; }

        public string? ApplicationID { get; }
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
            var filePath = request.FilePath;
            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
            {
                filePath = filePath.Substring(1);
            }

            logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {request.ChangeType}, FilePath: {filePath}", "Query/Refresh");

            var fileInfo = new FileInfo(filePath);
            var watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), request.ChangeType);
            var actionResult = false;

            switch (watcherChangeTypes)
            {
                case WatcherChangeTypes.Created:
                case WatcherChangeTypes.Changed:
                    if (fileInfo.Extension.Equals(".xml", StringComparison.OrdinalIgnoreCase))
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

            return Task.FromResult(actionResult);
        }
    }
}
