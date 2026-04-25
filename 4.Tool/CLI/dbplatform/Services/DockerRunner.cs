using System.Diagnostics;

namespace dbplatform.Services;

internal sealed class DockerRunner
{
    public Task<int> ComposeAsync(string tenantDir, string projectName, params string[] composeArgs)
    {
        var args = new List<string>
        {
            "compose",
            "-f",
            Path.Combine(tenantDir, "compose.yml"),
            "--env-file",
            Path.Combine(tenantDir, ".env"),
            "-p",
            projectName
        };
        args.AddRange(composeArgs);

        return RunAsync("docker", args, tenantDir);
    }

    public async Task ExecShellAsync(string container, string command, CancellationToken cancellationToken)
    {
        var code = await RunAsync("docker", new[] { "exec", container, "sh", "-c", command }, Directory.GetCurrentDirectory(), cancellationToken);
        if (code != 0)
        {
            throw new CliException("Docker 컨테이너 내부 명령 실행에 실패했습니다.", code);
        }
    }

    public async Task CopyFromContainerAsync(string container, string containerPath, string hostPath, CancellationToken cancellationToken)
    {
        var code = await RunAsync("docker", new[] { "cp", $"{container}:{containerPath}", hostPath }, Directory.GetCurrentDirectory(), cancellationToken);
        if (code != 0)
        {
            throw new CliException("컨테이너에서 호스트로 백업 파일을 복사하지 못했습니다.", code);
        }
    }

    public async Task CopyToContainerAsync(string hostPath, string container, string containerPath, CancellationToken cancellationToken)
    {
        var code = await RunAsync("docker", new[] { "cp", hostPath, $"{container}:{containerPath}" }, Directory.GetCurrentDirectory(), cancellationToken);
        if (code != 0)
        {
            throw new CliException("호스트에서 컨테이너로 백업 파일을 복사하지 못했습니다.", code);
        }
    }

    public async Task<int> RunAsync(
        string fileName,
        IEnumerable<string> args,
        string workingDirectory,
        CancellationToken cancellationToken = default)
    {
        var startInfo = new ProcessStartInfo(fileName)
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = false,
            RedirectStandardError = false,
            UseShellExecute = false
        };

        foreach (var arg in args)
        {
            startInfo.ArgumentList.Add(arg);
        }

        using var process = Process.Start(startInfo) ?? throw new CliException($"프로세스를 시작하지 못했습니다: {fileName}");
        await process.WaitForExitAsync(cancellationToken);
        return process.ExitCode;
    }
}
