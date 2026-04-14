using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using command.Entity;
using command.Extensions;

using HandStack.Core.ExtensionMethod;

using MediatR;

namespace command.Events
{
    public class CommandRefreshRequest : IRequest<bool>
    {
        public string ChangeType { get; }

        public string FilePath { get; }

        public string? UserWorkID { get; }

        public string? ApplicationID { get; }

        public CommandRefreshRequest(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ChangeType = changeType;
            FilePath = filePath;
            UserWorkID = userWorkID;
            ApplicationID = applicationID;
        }
    }

    public class CommandRefreshRequestHandler : IRequestHandler<CommandRefreshRequest, bool>
    {
        private readonly Serilog.ILogger logger;

        public CommandRefreshRequestHandler(Serilog.ILogger logger)
        {
            this.logger = logger;
        }

        public Task<bool> Handle(CommandRefreshRequest request, CancellationToken cancellationToken)
        {
            var actionResult = false;
            var filePath = request.FilePath;
            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true || filePath.StartsWith(Path.AltDirectorySeparatorChar) == true)
            {
                filePath = filePath.Substring(1);
            }

            logger.Information("[{LogCategory}] WatcherChangeTypes: {ChangeType}, FilePath: {FilePath}", "Command/Refresh", request.ChangeType, filePath);

            var fileInfo = new FileInfo(filePath);
            lock (CommandMapper.CommandMappings)
            {
                var watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), request.ChangeType);
                switch (watcherChangeTypes)
                {
                    case WatcherChangeTypes.Created:
                    case WatcherChangeTypes.Changed:
                        foreach (var basePath in ModuleConfiguration.ContractBasePath)
                        {
                            var itemPath = PathExtensions.Join(basePath, filePath);
                            var directoryInfo = new DirectoryInfo(basePath);
                            if (directoryInfo.Exists == true && File.Exists(itemPath) == true && fileInfo.Extension.Equals(".xml", StringComparison.OrdinalIgnoreCase) == true)
                            {
                                logger.Information("[{LogCategory}] Add CommandMap FilePath: {FilePath}", "Command/Refresh", filePath);
                                actionResult = CommandMapper.AddCommandMap(filePath, true, logger);
                                break;
                            }
                        }
                        break;
                    case WatcherChangeTypes.Deleted:
                        var existCommandMaps = CommandMapper.CommandMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == fileInfo.Directory?.Parent?.Name &&
                            p.ProjectID == fileInfo.Directory?.Name &&
                            p.TransactionID == fileInfo.Name.Replace(fileInfo.Extension, "")).ToList();

                        if (existCommandMaps.Count > 0)
                        {
                            var mapStrings = new List<string>();
                            foreach (var item in existCommandMaps)
                            {
                                mapStrings.Add($"{item.ApplicationID}|{item.ProjectID}|{item.TransactionID}|{item.CommandID}");
                            }

                            for (var i = 0; i < mapStrings.Count; i++)
                            {
                                var item = existCommandMaps[i];
                                var items = mapStrings[i].SplitAndTrim('|');
                                logger.Information("[{LogCategory}] Delete CommandMap ApplicationID: {ApplicationID}, ProjectID: {ProjectID}, TransactionID: {TransactionID}, CommandID: {CommandID}", "Command/Refresh", item.ApplicationID, item.ProjectID, item.TransactionID, item.CommandID);
                                CommandMapper.Remove(items[0], items[1], items[2], items[3]);
                            }
                        }
                        break;
                }
            }

            return Task.FromResult(actionResult);
        }
    }
}

