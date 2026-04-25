using System.CommandLine;
using System.CommandLine.Help;

using dbplatform.Services;

namespace dbplatform.Commands;

internal static class DockerCommands
{
    public static Command Build(TenantService tenantService)
    {
        var tenant = new Command("docker", "데이터베이스 서비스를 관리합니다.");
        tenant.Aliases.Add("d");
        AddCommandHelp(tenant);

        tenant.Subcommands.Add(BuildCreateCommand(tenantService));
        tenant.Subcommands.Add(BuildLifecycleCommand("start", "데이터베이스 서비스를 시작합니다.", tenantService.StartAsync));
        tenant.Subcommands.Add(BuildLifecycleCommand("stop", "데이터베이스 서비스를 중지합니다.", tenantService.StopAsync));
        tenant.Subcommands.Add(BuildLifecycleCommand("restart", "데이터베이스 서비스를 재시작합니다.", tenantService.RestartAsync));
        tenant.Subcommands.Add(BuildLifecycleCommand("status", "Docker Compose 상태를 표시합니다.", tenantService.StatusAsync));
        tenant.Subcommands.Add(BuildListCommand(tenantService));
        tenant.Subcommands.Add(BuildBackupCommand(tenantService));
        tenant.Subcommands.Add(BuildRestoreCommand(tenantService));
        tenant.Subcommands.Add(BuildRemoveCommand(tenantService));

        return tenant;
    }

    private static Command BuildCreateCommand(TenantService tenantService)
    {
        var command = new Command("create", "데이터베이스 서비스를 생성하고 시작합니다.");
        AddCommandHelp(command);
        var tenant = TenantOption();
        var engine = RequiredStringOption("--engine", "데이터베이스 엔진입니다. sqlserver, mysql, mariadb, postgres, oracle 중 하나를 사용합니다.");
        var database = RequiredStringOption("--db", "생성할 데이터베이스 이름입니다.");
        var user = RequiredStringOption("--user", "생성할 데이터베이스 사용자 이름입니다.");
        var password = RequiredStringOption("--password", "데이터베이스 비밀번호입니다.");
        var port = new Option<string>("--port") { Description = "호스트에 노출할 포트입니다. 생략하면 엔진 기본 포트를 사용합니다." };

        command.Options.Add(tenant);
        command.Options.Add(engine);
        command.Options.Add(database);
        command.Options.Add(user);
        command.Options.Add(password);
        command.Options.Add(port);
        command.SetAction((parseResult, cancellationToken) => ExecuteAsync(() =>
            tenantService.CreateAsync(
                RequiredValue(parseResult, tenant),
                RequiredValue(parseResult, engine),
                RequiredValue(parseResult, database),
                RequiredValue(parseResult, user),
                RequiredValue(parseResult, password),
                parseResult.GetValue(port),
                cancellationToken)));

        return command;
    }

    private static Command BuildLifecycleCommand(
        string name,
        string description,
        Func<string, CancellationToken, Task<int>> action)
    {
        var command = new Command(name, description);
        AddCommandHelp(command);
        var tenant = TenantOption();

        command.Options.Add(tenant);
        command.SetAction((parseResult, cancellationToken) => ExecuteAsync(() =>
            action(RequiredValue(parseResult, tenant), cancellationToken)));

        return command;
    }

    private static Command BuildListCommand(TenantService tenantService)
    {
        var command = new Command("list", "등록된 사업자 목록을 표시합니다.");
        AddCommandHelp(command);
        command.SetAction((_, cancellationToken) => ExecuteAsync(() => tenantService.ListAsync(cancellationToken)));
        return command;
    }

    private static Command BuildBackupCommand(TenantService tenantService)
    {
        var command = new Command("backup", "데이터베이스 백업을 생성합니다.");
        AddCommandHelp(command);
        var tenant = TenantOption();
        var output = new Option<string>("--out") { Description = "백업 파일을 저장할 호스트 디렉터리입니다." };

        command.Options.Add(tenant);
        command.Options.Add(output);
        command.SetAction((parseResult, cancellationToken) => ExecuteAsync(() =>
            tenantService.BackupAsync(
                RequiredValue(parseResult, tenant),
                parseResult.GetValue(output),
                cancellationToken)));

        return command;
    }

    private static Command BuildRestoreCommand(TenantService tenantService)
    {
        var command = new Command("restore", "데이터베이스 백업을 복구합니다.");
        AddCommandHelp(command);
        var tenant = TenantOption();
        var file = RequiredStringOption("--file", "복구할 백업 파일 경로입니다.");
        var replace = new Option<bool>("--replace") { Description = "기존 데이터베이스를 교체하며 복구합니다." };

        command.Options.Add(tenant);
        command.Options.Add(file);
        command.Options.Add(replace);
        command.SetAction((parseResult, cancellationToken) => ExecuteAsync(() =>
            tenantService.RestoreAsync(
                RequiredValue(parseResult, tenant),
                RequiredValue(parseResult, file),
                parseResult.GetValue(replace),
                cancellationToken)));

        return command;
    }

    private static Command BuildRemoveCommand(TenantService tenantService)
    {
        var command = new Command("remove", "사업자 서비스와 관리 파일을 삭제합니다.");
        AddCommandHelp(command);
        var tenant = TenantOption();
        var keepVolume = new Option<bool>("--keep-volume") { Description = "Docker volume은 삭제하지 않고 보존합니다." };

        command.Options.Add(tenant);
        command.Options.Add(keepVolume);
        command.SetAction((parseResult, cancellationToken) => ExecuteAsync(() =>
            tenantService.RemoveAsync(
                RequiredValue(parseResult, tenant),
                parseResult.GetValue(keepVolume),
                cancellationToken)));

        return command;
    }

    private static Option<string> TenantOption() => RequiredStringOption("--tenant", "필수. 사업자 ID입니다. 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");

    private static Option<string> RequiredStringOption(string name, string description) =>
        new(name) { Description = description.StartsWith("필수.", StringComparison.Ordinal) ? description : $"필수. {description}" };

    private static string RequiredValue(ParseResult parseResult, Option<string> option)
    {
        var value = parseResult.GetValue(option);
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new CliException($"필수 옵션이 누락되었습니다: {option.Name}");
        }

        return value;
    }

    private static void AddCommandHelp(Command command)
    {
        command.Options.Add(new HelpOption("--help", ["-h", "-?"])
        {
            Description = "도움말과 사용법 정보를 표시합니다."
        });
    }

    private static async Task<int> ExecuteAsync(Func<Task<int>> action)
    {
        try
        {
            return await action();
        }
        catch (CliException ex)
        {
            Console.Error.WriteLine($"오류: {ex.Message}");
            return ex.ExitCode;
        }
    }
}
