using System.CommandLine;
using dbplatform.Services;

namespace dbplatform.Commands;

internal static class CliRootCommand
{
    public static RootCommand Build()
    {
        var dockerRunner = new DockerRunner();
        var tenantService = new TenantService(dockerRunner);

        var root = new RootCommand("독립 데이터베이스 Docker 서비스 관리 도구");
        root.Subcommands.Add(DockerCommands.Build(tenantService));

        return root;
    }
}
