using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Net.Http;

using agent.Options;
using agent.Security;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace agent.Controllers
{
    [Route("")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class LogsController : TargetProcessControllerBase
    {
        private const int DefaultRows = 300;
        private const int MaxRows = 5000;

        private readonly IOptionsMonitor<AgentOptions> optionsMonitor;

        public LogsController(
            IOptionsMonitor<AgentOptions> optionsMonitor,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory)
            : base(optionsMonitor, httpClientFactory, loggerFactory)
        {
            this.optionsMonitor = optionsMonitor;
        }

        [HttpGet("logs")]
        public async Task<ActionResult> GetLogs([FromQuery(Name = "file")] string? requestedFileName, [FromQuery] int? rows, CancellationToken cancellationToken)
        {
            var context = await TryResolveRunningAckLogContextAsync(cancellationToken);
            if (context is null)
            {
                return NotFound(new
                {
                    message = "실행 중인 ack 대상을 찾을 수 없습니다."
                });
            }

            var (runningTarget, workingDirectory, logDirectoryPath) = context.Value;
            if (Directory.Exists(logDirectoryPath) == false)
            {
                return NotFound(new
                {
                    targetId = runningTarget.Id,
                    logDirectory = logDirectoryPath,
                    message = "로그 디렉터리를 찾을 수 없습니다."
                });
            }

            var logFileName = string.IsNullOrWhiteSpace(requestedFileName) == true
                ? TryGetLatestLogFilePath(logDirectoryPath)
                : requestedFileName.Trim();
            if (string.IsNullOrWhiteSpace(logFileName) == true)
            {
                return NotFound(new
                {
                    targetId = runningTarget.Id,
                    logDirectory = logDirectoryPath,
                    message = "로그 파일을 찾을 수 없습니다."
                });
            }

            if (TryResolveLogFilePath(logDirectoryPath, logFileName, out var normalizedLogFilePath, out var logFilePath, out var validationMessage) == false)
            {
                return BadRequest(new
                {
                    file = logFileName,
                    message = validationMessage
                });
            }

            if (System.IO.File.Exists(logFilePath) == false)
            {
                return NotFound(new
                {
                    targetId = runningTarget.Id,
                    file = normalizedLogFilePath,
                    logDirectory = logDirectoryPath,
                    message = "요청한 로그 파일을 찾을 수 없습니다."
                });
            }

            var rowCount = NormalizeRows(rows);
            var lines = ReadLastLines(logFilePath, rowCount);

            return Ok(new
            {
                targetId = runningTarget.Id,
                workingDirectory,
                logDirectory = logDirectoryPath,
                file = normalizedLogFilePath,
                rows = rowCount,
                lineCount = lines.Count,
                lines
            });
        }

        [HttpGet("logtree")]
        public async Task<ActionResult> GetLogTree(CancellationToken cancellationToken)
        {
            var context = await TryResolveRunningAckLogContextAsync(cancellationToken);
            if (context is null)
            {
                return NotFound(new
                {
                    message = "실행 중인 ack 대상을 찾을 수 없습니다."
                });
            }

            var (runningTarget, workingDirectory, logDirectoryPath) = context.Value;
            if (Directory.Exists(logDirectoryPath) == false)
            {
                return NotFound(new
                {
                    targetId = runningTarget.Id,
                    logDirectory = logDirectoryPath,
                    message = "로그 디렉터리를 찾을 수 없습니다."
                });
            }

            var tree = BuildLogTree(logDirectoryPath, logDirectoryPath);
            return Ok(new
            {
                targetId = runningTarget.Id,
                workingDirectory,
                logDirectory = logDirectoryPath,
                tree
            });
        }

        private async Task<(TargetProcessOptions Target, string WorkingDirectory, string LogDirectoryPath)?> TryResolveRunningAckLogContextAsync(CancellationToken cancellationToken)
        {
            var runningTarget = await FindRunningAckTargetAsync(cancellationToken);
            if (runningTarget is null)
            {
                return null;
            }

            var workingDirectory = ResolveWorkingDirectory(runningTarget);
            var logDirectoryPath = Path.GetFullPath(Path.Combine(workingDirectory, "..", "log"));
            return (runningTarget, workingDirectory, logDirectoryPath);
        }

        private async Task<TargetProcessOptions?> FindRunningAckTargetAsync(CancellationToken cancellationToken)
        {
            foreach (var target in optionsMonitor.CurrentValue.Targets)
            {
                if (string.IsNullOrWhiteSpace(target.Id) == true || IsAckTarget(target) == false)
                {
                    continue;
                }

                var status = await GetStatusAsync(target.Id, cancellationToken);
                if (status != null)
                {
                    return target;
                }
            }

            return null;
        }

        private static bool IsAckTarget(TargetProcessOptions target)
        {
            var processName = target.ResolveProcessName();
            if (string.Equals(processName, "ack", StringComparison.OrdinalIgnoreCase) == true)
            {
                return true;
            }

            if (string.IsNullOrWhiteSpace(target.ExecutablePath) == false)
            {
                var fileName = Path.GetFileNameWithoutExtension(target.ExecutablePath.Trim());
                if (string.Equals(fileName, "ack", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return true;
                }
            }

            return false;
        }

        private static string? TryGetLatestLogFilePath(string logDirectoryPath)
        {
            var latestFile = Directory.EnumerateFiles(logDirectoryPath, "app*.log", SearchOption.AllDirectories)
                .Select(path => new FileInfo(path))
                .OrderByDescending(file => file.LastWriteTimeUtc)
                .FirstOrDefault();

            latestFile ??= Directory.EnumerateFiles(logDirectoryPath, "*.log", SearchOption.AllDirectories)
                .Select(path => new FileInfo(path))
                .OrderByDescending(file => file.LastWriteTimeUtc)
                .FirstOrDefault();

            return latestFile is null ? null : ToRelativePath(logDirectoryPath, latestFile.FullName);
        }

        private static bool TryResolveLogFilePath(string logDirectoryPath, string filePathOrName, out string normalizedRelativePath, out string fullPath, out string validationMessage)
        {
            normalizedRelativePath = "";
            fullPath = "";
            validationMessage = "";

            var normalized = (filePathOrName ?? "").Trim().Replace("\\", "/", StringComparison.Ordinal).TrimStart('/');
            if (string.IsNullOrWhiteSpace(normalized) == true)
            {
                validationMessage = "file 쿼리가 비어 있습니다.";
                return false;
            }

            var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length == 0)
            {
                validationMessage = "file 쿼리가 비어 있습니다.";
                return false;
            }

            foreach (var segment in segments)
            {
                if (segment == "." || segment == "..")
                {
                    validationMessage = "상위/현재 경로(.)는 사용할 수 없습니다.";
                    return false;
                }

                if (segment.IndexOfAny(Path.GetInvalidFileNameChars()) > -1)
                {
                    validationMessage = "file 경로에 허용되지 않는 문자가 포함되어 있습니다.";
                    return false;
                }
            }

            normalizedRelativePath = string.Join("/", segments);
            var candidatePath = Path.GetFullPath(Path.Combine(logDirectoryPath, normalizedRelativePath.Replace("/", Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal)));
            var logRootPath = Path.GetFullPath(logDirectoryPath);
            var rootWithSeparator = logRootPath.EndsWith(Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal)
                ? logRootPath
                : logRootPath + Path.DirectorySeparatorChar;

            if (candidatePath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase) == false)
            {
                validationMessage = "file 경로는 로그 디렉터리 하위 경로만 허용됩니다.";
                return false;
            }

            fullPath = candidatePath;
            validationMessage = "";
            return true;
        }

        private static int NormalizeRows(int? rows)
        {
            var rowCount = rows.GetValueOrDefault(DefaultRows);
            if (rowCount <= 0)
            {
                rowCount = DefaultRows;
            }

            if (rowCount > MaxRows)
            {
                rowCount = MaxRows;
            }

            return rowCount;
        }

        private static List<string> ReadLastLines(string logFilePath, int rows)
        {
            var lines = new Queue<string>(rows);
            using var stream = new FileStream(logFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var reader = new StreamReader(stream);
            while (reader.EndOfStream == false)
            {
                var line = reader.ReadLine() ?? "";
                if (lines.Count == rows)
                {
                    lines.Dequeue();
                }

                lines.Enqueue(line);
            }

            return lines.ToList();
        }

        private static LogTreeNode BuildLogTree(string directoryPath, string rootDirectoryPath)
        {
            var directoryInfo = new DirectoryInfo(directoryPath);
            var node = new LogTreeNode
            {
                Name = directoryInfo.Name,
                Path = ToRelativePath(rootDirectoryPath, directoryPath),
                Type = "directory",
                LastWriteTimeUtc = directoryInfo.LastWriteTimeUtc
            };

            foreach (var childDirectory in directoryInfo.EnumerateDirectories().OrderBy(item => item.Name, StringComparer.OrdinalIgnoreCase))
            {
                node.Children.Add(BuildLogTree(childDirectory.FullName, rootDirectoryPath));
            }

            foreach (var childFile in directoryInfo.EnumerateFiles().OrderBy(item => item.Name, StringComparer.OrdinalIgnoreCase))
            {
                node.Children.Add(new LogTreeNode
                {
                    Name = childFile.Name,
                    Path = ToRelativePath(rootDirectoryPath, childFile.FullName),
                    Type = "file",
                    SizeBytes = childFile.Length,
                    LastWriteTimeUtc = childFile.LastWriteTimeUtc
                });
            }

            return node;
        }

        private static string ToRelativePath(string rootDirectoryPath, string path)
        {
            var relativePath = Path.GetRelativePath(rootDirectoryPath, path).Replace("\\", "/", StringComparison.Ordinal);
            return string.Equals(relativePath, ".", StringComparison.Ordinal) == true ? "" : relativePath;
        }

        private sealed class LogTreeNode
        {
            public string Name { get; set; } = "";

            public string Path { get; set; } = "";

            public string Type { get; set; } = "";

            public long? SizeBytes { get; set; }

            public DateTimeOffset? LastWriteTimeUtc { get; set; }

            public List<LogTreeNode> Children { get; set; } = new List<LogTreeNode>();
        }
    }
}
