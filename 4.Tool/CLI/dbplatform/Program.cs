using dbplatform.Commands;

if (args.Length == 0 || args is ["--help" or "-h" or "-?"])
{
    Console.WriteLine("""
        dbp - 독립 데이터베이스 Docker 서비스 관리 도구

        사용법:
          dbp docker <command> [options]

        명령:
          tenant, t  데이터베이스 서비스를 관리합니다.

        옵션:
          -?, -h, --help  도움말과 사용법 정보를 표시합니다.
          --version       버전 정보를 표시합니다.
        """);
    return 0;
}

return await CliRootCommand.Build().Parse(args).InvokeAsync();

internal sealed class CliException(string message, int exitCode = 1) : Exception(message)
{
    public int ExitCode { get; } = exitCode;
}