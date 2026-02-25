using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using System.Net;

using Microsoft.Extensions.Configuration;

using Octokit;

namespace forbes.Extensions
{
    public sealed class GitHubSyncManager
    {
        private readonly GitHubClient? gitHubClient;
        private readonly string logFilePath;
        private readonly object logSync = new object();

        public GitHubSyncManager(string personalAccessToken, string productHeaderValue = "HandStack.Forbes", string? logDirectoryPath = null)
        {
            logFilePath = InitializeLogFilePath(logDirectoryPath);

            if (string.IsNullOrWhiteSpace(productHeaderValue))
            {
                LogError("GitHub 클라이언트 초기화 실패. productHeaderValue 값이 비어 있습니다.");
                return;
            }

            if (string.IsNullOrWhiteSpace(personalAccessToken))
            {
                LogError("GitHub 클라이언트 초기화 실패. GitHubPersonalAccessToken 값이 비어 있습니다.");
                return;
            }

            try
            {
                gitHubClient = new GitHubClient(new ProductHeaderValue(productHeaderValue))
                {
                    Credentials = new Credentials(personalAccessToken)
                };
            }
            catch (Exception exception)
            {
                LogError("GitHub 클라이언트 초기화 중 예외가 발생했습니다.", exception);
            }
        }

        public static GitHubSyncManager CreateFromConfiguration(IConfiguration configuration, string tokenKey = "GitHubPersonalAccessToken", string productHeaderValue = "HandStack.Forbes")
        {
            if (configuration is null)
            {
                return new GitHubSyncManager(string.Empty, productHeaderValue);
            }

            string token = configuration[tokenKey]
                ?? string.Empty;
            string? entryDirectoryPath = configuration["EntryDirectoryPath"];
            string logDirectoryPath = string.IsNullOrWhiteSpace(entryDirectoryPath)
                ? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tracelog")
                : Path.Combine(entryDirectoryPath, "tracelog");

            return new GitHubSyncManager(token, productHeaderValue, logDirectoryPath);
        }

        public GitHubClient? GetClient()
        {
            if (gitHubClient is null)
            {
                LogError("GetClient 실패. GitHub 클라이언트가 초기화되지 않았습니다.");
            }

            return gitHubClient;
        }

        public async Task<Repository?> GetRepositoryAsync(string owner, string repositoryName)
        {
            if (!TryGetClient(out GitHubClient? client) || !ValidateRepository(owner, repositoryName))
            {
                return null;
            }

            try
            {
                return await client.Repository.Get(owner, repositoryName);
            }
            catch (Exception exception)
            {
                LogError($"GetRepositoryAsync 실패. owner: {owner}, repo: {repositoryName}", exception);
                return null;
            }
        }

        public async Task<GitHubRepositoryInfo?> GetRepositoryInfoAsync(string owner, string repositoryName)
        {
            Repository? repository = await GetRepositoryAsync(owner, repositoryName);
            if (repository is null)
            {
                return null;
            }

            return new GitHubRepositoryInfo(
                repository.FullName,
                repository.DefaultBranch,
                repository.Private,
                repository.UpdatedAt);
        }

        public async Task<GitHubPullFileResult?> PullFileAsync(string owner, string repositoryName, string branch, string path)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateBranchAndPath(branch, path))
            {
                return null;
            }

            try
            {
                Reference reference = await client.Git.Reference.Get(owner, repositoryName, $"heads/{branch}");
                string latestCommitSha = reference.Object.Sha;

                IReadOnlyList<RepositoryContent> contents = await client.Repository.Content.GetAllContentsByRef(owner, repositoryName, path, branch);
                RepositoryContent file = contents.Single();

                return new GitHubPullFileResult(
                    latestCommitSha,
                    file.Sha,
                    DecodeContent(file),
                    file.Path,
                    branch);
            }
            catch (Exception exception)
            {
                LogError($"PullFileAsync 실패. owner: {owner}, repo: {repositoryName}, branch: {branch}, path: {path}", exception);
                return null;
            }
        }

        public async Task<string?> GetFileTextContentAsync(string owner, string repositoryName, string branch, string path)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateBranchAndPath(branch, path))
            {
                return null;
            }

            try
            {
                IReadOnlyList<RepositoryContent> contents = await client.Repository.Content.GetAllContentsByRef(owner, repositoryName, path, branch);
                RepositoryContent? file = contents.SingleOrDefault();
                if (file is null)
                {
                    LogError($"GetFileTextContentAsync 실패. 파일을 찾을 수 없습니다. owner: {owner}, repo: {repositoryName}, branch: {branch}, path: {path}");
                    return null;
                }

                return DecodeContent(file);
            }
            catch (Exception exception)
            {
                LogError($"GetFileTextContentAsync 실패. owner: {owner}, repo: {repositoryName}, branch: {branch}, path: {path}", exception);
                return null;
            }
        }

        public async Task<IReadOnlyList<GitHubRepositoryTreeItem>> GetRepositoryContentsRecursiveAsync(string owner, string repositoryName, string branch, string rootPath)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateBranchAndPath(branch, rootPath))
            {
                return Array.Empty<GitHubRepositoryTreeItem>();
            }

            var collectedFiles = new List<GitHubRepositoryTreeItem>();
            await CollectRepositoryContentsRecursiveAsync(client, owner, repositoryName, branch, rootPath, collectedFiles);
            return collectedFiles;
        }

        public async Task PushUpdateFileAsync(string owner, string repositoryName, string branch, string path, string newTextContent, string commitMessage)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateBranchAndPath(branch, path)
                || !ValidateCommitMessage(commitMessage))
            {
                return;
            }

            try
            {
                RepositoryContent currentFile = (await client.Repository.Content.GetAllContentsByRef(owner, repositoryName, path, branch)).Single();

                var request = new UpdateFileRequest(
                    commitMessage,
                    newTextContent ?? string.Empty,
                    currentFile.Sha,
                    branch);

                await client.Repository.Content.UpdateFile(owner, repositoryName, path, request);
            }
            catch (Exception exception)
            {
                LogError($"PushUpdateFileAsync 실패. owner: {owner}, repo: {repositoryName}, branch: {branch}, path: {path}", exception);
            }
        }

        public async Task PushOverwriteLastWriteWinsAsync(string owner, string repositoryName, string branch, string path, string newTextContent, string commitMessage)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateBranchAndPath(branch, path)
                || !ValidateCommitMessage(commitMessage))
            {
                return;
            }

            try
            {
                RepositoryContent latestFile = (await client.Repository.Content.GetAllContentsByRef(owner, repositoryName, path, branch)).Single();

                var request = new UpdateFileRequest(
                    commitMessage,
                    newTextContent ?? string.Empty,
                    latestFile.Sha,
                    branch);

                await client.Repository.Content.UpdateFile(owner, repositoryName, path, request);
            }
            catch (Exception exception)
            {
                LogError($"PushOverwriteLastWriteWinsAsync 실패. owner: {owner}, repo: {repositoryName}, branch: {branch}, path: {path}", exception);
            }
        }

        public async Task UpsertFileAsync(string owner, string repositoryName, string branch, string path, string newTextContent, string commitMessage)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateBranchAndPath(branch, path)
                || !ValidateCommitMessage(commitMessage))
            {
                return;
            }

            try
            {
                RepositoryContent? currentFile = null;
                try
                {
                    currentFile = (await client.Repository.Content.GetAllContentsByRef(owner, repositoryName, path, branch)).SingleOrDefault();
                }
                catch (NotFoundException)
                {
                    currentFile = null;
                }

                if (currentFile is null)
                {
                    var createRequest = new CreateFileRequest(
                        commitMessage,
                        newTextContent ?? string.Empty,
                        branch);

                    await client.Repository.Content.CreateFile(owner, repositoryName, path, createRequest);
                    return;
                }

                var updateRequest = new UpdateFileRequest(
                    commitMessage,
                    newTextContent ?? string.Empty,
                    currentFile.Sha,
                    branch);

                await client.Repository.Content.UpdateFile(owner, repositoryName, path, updateRequest);
            }
            catch (Exception exception)
            {
                LogError($"UpsertFileAsync 실패. owner: {owner}, repo: {repositoryName}, branch: {branch}, path: {path}", exception);
            }
        }

        public async Task<bool> TriggerRepositoryDispatchAsync(string owner, string repositoryName, string eventType, object? clientPayload = null)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateEventType(eventType))
            {
                return false;
            }

            try
            {
                var endpoint = new Uri($"repos/{owner}/{repositoryName}/dispatches", UriKind.Relative);
                var body = new
                {
                    event_type = eventType,
                    client_payload = clientPayload ?? new { }
                };

                await client.Connection.Post<object>(endpoint, body, "application/vnd.github.v3+json", "application/json");
                return true;
            }
            catch (Exception exception)
            {
                LogError($"TriggerRepositoryDispatchAsync 실패. owner: {owner}, repo: {repositoryName}, eventType: {eventType}", exception);
                return false;
            }
        }

        public async Task<bool> TriggerWorkflowDispatchAsync(string owner, string repositoryName, string workflowId, string gitReference, object? inputs = null)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateWorkflowDispatch(workflowId, gitReference))
            {
                return false;
            }

            try
            {
                string escapedWorkflowId = Uri.EscapeDataString(workflowId);
                var endpoint = new Uri($"repos/{owner}/{repositoryName}/actions/workflows/{escapedWorkflowId}/dispatches", UriKind.Relative);
                var body = new
                {
                    @ref = gitReference,
                    inputs = inputs ?? new { }
                };

                await client.Connection.Post<object>(endpoint, body, "application/vnd.github.v3+json", "application/json");
                return true;
            }
            catch (ApiException apiException) when (apiException.StatusCode == HttpStatusCode.NotFound)
            {
                LogError($"TriggerWorkflowDispatchAsync 실패. 워크플로를 찾을 수 없습니다. owner: {owner}, repo: {repositoryName}, workflowId: {workflowId}");
                return false;
            }
            catch (Exception exception)
            {
                LogError($"TriggerWorkflowDispatchAsync 실패. owner: {owner}, repo: {repositoryName}, workflowId: {workflowId}, ref: {gitReference}", exception);
                return false;
            }
        }

        public async Task DeleteFileAsync(string owner, string repositoryName, string branch, string path, string commitMessage)
        {
            if (!TryGetClient(out GitHubClient? client)
                || !ValidateRepository(owner, repositoryName)
                || !ValidateBranchAndPath(branch, path)
                || !ValidateCommitMessage(commitMessage))
            {
                return;
            }

            try
            {
                RepositoryContent currentFile = (await client.Repository.Content.GetAllContentsByRef(owner, repositoryName, path, branch)).Single();

                var request = new DeleteFileRequest(
                    commitMessage,
                    currentFile.Sha,
                    branch);

                await client.Repository.Content.DeleteFile(owner, repositoryName, path, request);
            }
            catch (Exception exception)
            {
                LogError($"DeleteFileAsync 실패. owner: {owner}, repo: {repositoryName}, branch: {branch}, path: {path}", exception);
            }
        }

        public async Task<Repository?> CreateRepositoryAsync(NewRepository request, string? organization = null)
        {
            if (!TryGetClient(out GitHubClient? client))
            {
                return null;
            }

            if (request is null)
            {
                LogError("CreateRepositoryAsync 실패. request 값이 null 입니다.");
                return null;
            }

            try
            {
                if (string.IsNullOrWhiteSpace(organization))
                {
                    return await client.Repository.Create(request);
                }

                return await client.Repository.Create(organization, request);
            }
            catch (Exception exception)
            {
                LogError($"CreateRepositoryAsync 실패. repository: {request.Name}, organization: {organization ?? "(user)"}", exception);
                return null;
            }
        }

        private bool TryGetClient([NotNullWhen(true)] out GitHubClient? client, [CallerMemberName] string caller = "")
        {
            client = gitHubClient;
            if (client is null)
            {
                LogError($"{caller} 작업을 건너뜁니다. GitHub 클라이언트가 초기화되지 않았습니다.");
                return false;
            }

            return true;
        }

        private bool ValidateRepository(string owner, string repositoryName)
        {
            if (string.IsNullOrWhiteSpace(owner))
            {
                LogError("유효성 검사 실패. owner 값이 비어 있습니다.");
                return false;
            }

            if (string.IsNullOrWhiteSpace(repositoryName))
            {
                LogError("유효성 검사 실패. repositoryName 값이 비어 있습니다.");
                return false;
            }

            return true;
        }

        private bool ValidateBranchAndPath(string branch, string path)
        {
            if (string.IsNullOrWhiteSpace(branch))
            {
                LogError("유효성 검사 실패. branch 값이 비어 있습니다.");
                return false;
            }

            if (string.IsNullOrWhiteSpace(path))
            {
                LogError("유효성 검사 실패. path 값이 비어 있습니다.");
                return false;
            }

            return true;
        }

        private bool ValidateCommitMessage(string commitMessage)
        {
            if (string.IsNullOrWhiteSpace(commitMessage))
            {
                LogError("유효성 검사 실패. commitMessage 값이 비어 있습니다.");
                return false;
            }

            return true;
        }

        private bool ValidateEventType(string eventType)
        {
            if (string.IsNullOrWhiteSpace(eventType))
            {
                LogError("유효성 검사 실패. eventType 값이 비어 있습니다.");
                return false;
            }

            return true;
        }

        private bool ValidateWorkflowDispatch(string workflowId, string gitReference)
        {
            if (string.IsNullOrWhiteSpace(workflowId))
            {
                LogError("유효성 검사 실패. workflowId 값이 비어 있습니다.");
                return false;
            }

            if (string.IsNullOrWhiteSpace(gitReference))
            {
                LogError("유효성 검사 실패. ref 값이 비어 있습니다.");
                return false;
            }

            return true;
        }

        private static string DecodeContent(RepositoryContent repositoryContent)
        {
            if (string.IsNullOrWhiteSpace(repositoryContent.Content))
            {
                return string.Empty;
            }

            if (string.Equals(repositoryContent.Encoding, "base64", StringComparison.OrdinalIgnoreCase))
            {
                string normalized = repositoryContent.Content.Replace("\r", "").Replace("\n", "");
                try
                {
                    byte[] bytes = Convert.FromBase64String(normalized);
                    return Encoding.UTF8.GetString(bytes);
                }
                catch (FormatException)
                {
                    return repositoryContent.Content;
                }
            }

            return repositoryContent.Content;
        }

        private async Task CollectRepositoryContentsRecursiveAsync(
            GitHubClient client,
            string owner,
            string repositoryName,
            string branch,
            string currentPath,
            List<GitHubRepositoryTreeItem> collector)
        {
            try
            {
                IReadOnlyList<RepositoryContent> contents = await client.Repository.Content.GetAllContentsByRef(owner, repositoryName, currentPath, branch);
                foreach (RepositoryContent content in contents)
                {
                    string contentType = Convert.ToString(content.Type) ?? string.Empty;
                    if (contentType.Equals("dir", StringComparison.OrdinalIgnoreCase) || contentType.Equals("directory", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrWhiteSpace(content.Path))
                        {
                            await CollectRepositoryContentsRecursiveAsync(client, owner, repositoryName, branch, content.Path, collector);
                        }

                        continue;
                    }

                    if (!string.IsNullOrWhiteSpace(content.Path))
                    {
                        collector.Add(new GitHubRepositoryTreeItem(content.Path, content.Sha ?? string.Empty));
                    }
                }
            }
            catch (Exception exception)
            {
                LogError($"GetRepositoryContentsRecursiveAsync 실패. owner: {owner}, repo: {repositoryName}, branch: {branch}, path: {currentPath}", exception);
            }
        }

        private string InitializeLogFilePath(string? logDirectoryPath)
        {
            string resolvedDirectoryPath = logDirectoryPath ?? string.Empty;
            if (string.IsNullOrWhiteSpace(resolvedDirectoryPath))
            {
                resolvedDirectoryPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tracelog");
            }

            try
            {
                Directory.CreateDirectory(resolvedDirectoryPath);
            }
            catch
            {
                resolvedDirectoryPath = AppDomain.CurrentDomain.BaseDirectory;
            }

            return Path.Combine(resolvedDirectoryPath, $"github-sync-{DateTime.Now:yyyy-MM-dd}.log");
        }

        private void LogError(string message, Exception? exception = null)
        {
            string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            string logMessage = exception is null
                ? $"[{timestamp}] [ERROR] {message}"
                : $"[{timestamp}] [ERROR] {message} | {exception.GetType().Name}: {exception.Message}";

            try
            {
                lock (logSync)
                {
                    File.AppendAllText(logFilePath, logMessage + Environment.NewLine, Encoding.UTF8);
                }
            }
            catch
            {
            }

            try
            {
                TraceLogger.Error(logMessage);
            }
            catch
            {
            }
        }
    }

    public sealed class GitHubRepositoryInfo
    {
        public string FullName { get; }
        public string DefaultBranch { get; }
        public bool IsPrivate { get; }
        public DateTimeOffset UpdatedAt { get; }

        public GitHubRepositoryInfo(string fullName, string defaultBranch, bool isPrivate, DateTimeOffset updatedAt)
        {
            FullName = fullName;
            DefaultBranch = defaultBranch;
            IsPrivate = isPrivate;
            UpdatedAt = updatedAt;
        }
    }

    public sealed class GitHubPullFileResult
    {
        public string CommitSha { get; }
        public string FileSha { get; }
        public string Content { get; }
        public string Path { get; }
        public string Branch { get; }

        public GitHubPullFileResult(string commitSha, string fileSha, string content, string path, string branch)
        {
            CommitSha = commitSha;
            FileSha = fileSha;
            Content = content;
            Path = path;
            Branch = branch;
        }
    }

    public sealed class GitHubRepositoryTreeItem
    {
        public string Path { get; }
        public string Sha { get; }

        public GitHubRepositoryTreeItem(string path, string sha)
        {
            Path = path;
            Sha = sha;
        }
    }
}
