using System.Diagnostics;

namespace HandStack.Bootstrapper;

/// <summary>외부 프로세스를 실행하고 출력을 스트리밍하며, 실패 시 예외를 던질지 선택할 수 있다.</summary>
internal static class ProcessRunner
{
    public static async Task<int> RunAsync(
        string fileName,
        string arguments,
        bool requireSuccess = true,
        IDictionary<string, string>? env = null)
    {
        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        if (env is not null)
        {
            foreach (var (key, value) in env)
            {
                psi.Environment[key] = value;
            }
        }

        Console.WriteLine($"  $ {fileName} {arguments}");

        using var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        process.OutputDataReceived += (_, e) => { if (e.Data is not null) Console.WriteLine($"    {e.Data}"); };
        process.ErrorDataReceived += (_, e) => { if (e.Data is not null) Console.Error.WriteLine($"    {e.Data}"); };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        await process.WaitForExitAsync();

        if (requireSuccess && process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"명령이 종료 코드 {process.ExitCode}(으)로 실패했습니다: {fileName} {arguments}");
        }

        return process.ExitCode;
    }

    /// <summary>
    /// 설치 여부 확인처럼 화면에 굳이 로그를 남기지 않아도 되는 조회용 명령을 실행하고
    /// 표준 출력을 반환한다. 명령을 찾을 수 없거나 실행에 실패해도 예외를 던지지 않고
    /// 종료 코드 -1과 빈 출력을 반환한다.
    /// </summary>
    public static async Task<(int ExitCode, string StdOut)> CaptureAsync(string fileName, string arguments)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };

            using var process = new Process { StartInfo = psi };
            process.Start();

            var stdOutTask = process.StandardOutput.ReadToEndAsync();
            _ = process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            return (process.ExitCode, await stdOutTask);
        }
        catch
        {
            return (-1, string.Empty);
        }
    }
}
