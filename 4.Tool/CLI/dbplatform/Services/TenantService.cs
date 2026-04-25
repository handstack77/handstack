using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

using dbplatform.Models;

namespace dbplatform.Services;

internal sealed partial class TenantService(DockerRunner dockerRunner)
{
    private static readonly string AppRoot = Path.Combine(AppContext.BaseDirectory, "dbp");

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public async Task<int> CreateAsync(
        string tenant,
        string engineValue,
        string databaseValue,
        string userValue,
        string password,
        string? portValue,
        CancellationToken cancellationToken)
    {
        tenant = ValidateTenant(tenant);
        var engine = DbEngine.Parse(engineValue);
        var database = ValidateName(databaseValue, "데이터베이스 이름");
        var user = ValidateName(userValue, "사용자 이름");
        if (engine.Id == "oracle" && !string.Equals(database, "XEPDB1", StringComparison.OrdinalIgnoreCase))
        {
            throw new CliException("Oracle XE는 현재 --db 값으로 XEPDB1만 지원합니다.");
        }

        var port = portValue ?? engine.DefaultPort.ToString();

        var tenantDir = TenantDir(tenant);
        if (Directory.Exists(tenantDir))
        {
            throw new CliException($"사업자 '{tenant}'는 이미 존재합니다. 경로: {tenantDir}");
        }

        Directory.CreateDirectory(tenantDir);
        Directory.CreateDirectory(Path.Combine(tenantDir, "backups"));

        var containerName = $"dbp_{tenant}_{engine.Id}";
        var metadata = new TenantMetadata(tenant, engine.Id, database, user, port, containerName, DateTimeOffset.UtcNow);
        await File.WriteAllTextAsync(Path.Combine(tenantDir, ".env"), BuildEnv(engine, metadata, password), Encoding.UTF8, cancellationToken);
        await File.WriteAllTextAsync(Path.Combine(tenantDir, "compose.yml"), BuildCompose(engine, metadata), Encoding.UTF8, cancellationToken);
        await File.WriteAllTextAsync(
            Path.Combine(tenantDir, "metadata.json"),
            JsonSerializer.Serialize(metadata, JsonOptions),
            Encoding.UTF8,
            cancellationToken);

        Console.WriteLine($"사업자 '{tenant}' 서비스를 생성했습니다. 경로: {tenantDir}");
        var code = await dockerRunner.ComposeAsync(tenantDir, ProjectName(tenant, engine.Id), "up", "-d");
        if (code != 0)
        {
            return code;
        }

        if (engine.Id == "sqlserver")
        {
            await InitializeSqlServerAsync(metadata, password, cancellationToken);
        }
        else if (engine.Id == "oracle")
        {
            await InitializeOracleAsync(metadata, password, cancellationToken);
        }
        else
        {
            await WaitUntilReadyAsync(metadata, cancellationToken);
        }

        return 0;
    }

    public Task<int> StartAsync(string tenant, CancellationToken cancellationToken) => ComposeAsync(tenant, cancellationToken, "up", "-d");

    public Task<int> StopAsync(string tenant, CancellationToken cancellationToken) => ComposeAsync(tenant, cancellationToken, "stop");

    public Task<int> RestartAsync(string tenant, CancellationToken cancellationToken) => ComposeAsync(tenant, cancellationToken, "restart");

    public Task<int> StatusAsync(string tenant, CancellationToken cancellationToken) => ComposeAsync(tenant, cancellationToken, "ps");

    public Task<int> ListAsync(CancellationToken cancellationToken)
    {
        if (!Directory.Exists(AppRoot))
        {
            Console.WriteLine("등록된 사업자가 없습니다.");
            return Task.FromResult(0);
        }

        var rows = Directory.EnumerateDirectories(Path.Combine(AppRoot, "tenants"))
            .Select(dir => TryLoadMetadata(Path.GetFileName(dir)))
            .Where(meta => meta is not null)
            .Cast<TenantMetadata>()
            .OrderBy(meta => meta.Tenant)
            .ToList();

        if (rows.Count == 0)
        {
            Console.WriteLine("등록된 사업자가 없습니다.");
            return Task.FromResult(0);
        }

        foreach (var row in rows)
        {
            Console.WriteLine($"{row.Tenant}\t{row.Engine}\t{row.Database}\t포트={row.Port}\t컨테이너={row.ContainerName}");
        }

        return Task.FromResult(0);
    }

    public async Task<int> BackupAsync(string tenant, string? outputRoot, CancellationToken cancellationToken)
    {
        var metadata = LoadTenant(tenant);
        var backupDir = outputRoot is null ? Path.Combine(TenantDir(metadata.Tenant), "backups") : Path.GetFullPath(outputRoot);
        Directory.CreateDirectory(backupDir);

        var stamp = DateTimeOffset.Now.ToString("yyyyMMddHHmmss");
        var ext = metadata.Engine switch
        {
            "sqlserver" => "bak",
            "postgres" => "dump",
            "oracle" => "dmp",
            _ => "sql"
        };
        var fileName = $"{metadata.Tenant}_{metadata.Engine}_{metadata.Database}_{stamp}.{ext}";
        var containerPath = ContainerBackupPath(metadata.Engine, fileName);
        var hostPath = Path.Combine(backupDir, fileName);

        await EnsureRunningAsync(metadata, cancellationToken);

        var command = metadata.Engine switch
        {
            "sqlserver" => SqlServerBackup(metadata.Database, containerPath),
            "mysql" => $"mysqldump -uroot -p\"$MYSQL_ROOT_PASSWORD\" --single-transaction --routines --triggers {Sh(metadata.Database)} > {Sh(containerPath)}",
            "mariadb" => $"mariadb-dump -uroot -p\"$MARIADB_ROOT_PASSWORD\" --single-transaction --routines --triggers {Sh(metadata.Database)} > {Sh(containerPath)}",
            "postgres" => $"pg_dump -U {Sh(metadata.User)} -d {Sh(metadata.Database)} -Fc -f {Sh(containerPath)}",
            "oracle" => OracleBackup(metadata, Path.GetFileName(containerPath)),
            _ => throw new CliException($"지원하지 않는 데이터베이스 엔진입니다: {metadata.Engine}")
        };

        await dockerRunner.ExecShellAsync(metadata.ContainerName, command, cancellationToken);
        await dockerRunner.CopyFromContainerAsync(metadata.ContainerName, containerPath, hostPath, cancellationToken);
        await dockerRunner.ExecShellAsync(metadata.ContainerName, $"rm -f {Sh(containerPath)}", cancellationToken);
        if (metadata.Engine == "oracle")
        {
            await dockerRunner.ExecShellAsync(metadata.ContainerName, $"rm -f {Sh(OracleLogPath(containerPath))}", cancellationToken);
        }

        Console.WriteLine(hostPath);
        return 0;
    }

    public async Task<int> RestoreAsync(string tenant, string fileValue, bool replace, CancellationToken cancellationToken)
    {
        var metadata = LoadTenant(tenant);
        var file = Path.GetFullPath(fileValue);
        if (!File.Exists(file))
        {
            throw new CliException($"백업 파일이 존재하지 않습니다: {file}");
        }

        await EnsureRunningAsync(metadata, cancellationToken);
        var containerPath = ContainerBackupPath(metadata.Engine, Path.GetFileName(file));
        var password = metadata.Engine == "oracle" ? LoadPassword(metadata.Tenant) : null;
        if (metadata.Engine == "sqlserver")
        {
            await dockerRunner.ExecShellAsync(metadata.ContainerName, "mkdir -p /var/opt/mssql/backup", cancellationToken);
        }

        await dockerRunner.CopyToContainerAsync(file, metadata.ContainerName, containerPath, cancellationToken);
        var command = metadata.Engine switch
        {
            "sqlserver" => SqlServerRestore(metadata.Database, containerPath, replace),
            "mysql" => MySqlRestore(metadata.Database, containerPath, replace),
            "mariadb" => MariaDbRestore(metadata.Database, containerPath, replace),
            "postgres" => PostgresRestore(metadata.User, metadata.Database, containerPath, replace),
            "oracle" => OracleRestore(metadata, Path.GetFileName(containerPath), replace, password!),
            _ => throw new CliException($"지원하지 않는 데이터베이스 엔진입니다: {metadata.Engine}")
        };

        await dockerRunner.ExecShellAsync(metadata.ContainerName, command, cancellationToken);
        await dockerRunner.ExecShellAsync(metadata.ContainerName, $"rm -f {Sh(containerPath)}", cancellationToken);
        if (metadata.Engine == "oracle")
        {
            await dockerRunner.ExecShellAsync(metadata.ContainerName, $"rm -f {Sh(OracleLogPath(containerPath))}", cancellationToken);
        }

        Console.WriteLine($"사업자 '{metadata.Tenant}'의 데이터베이스 '{metadata.Database}'를 복구했습니다.");
        return 0;
    }

    public async Task<int> RemoveAsync(string tenant, bool keepVolume, CancellationToken cancellationToken)
    {
        tenant = ValidateTenant(tenant);
        var tenantDir = TenantDir(tenant);
        EnsureTenantDir(tenantDir, tenant);

        var composeArgs = keepVolume ? new[] { "down" } : new[] { "down", "-v" };
        var metadata = LoadTenant(tenant);
        var code = await dockerRunner.ComposeAsync(tenantDir, ProjectName(tenant, metadata.Engine), composeArgs);
        if (code == 0)
        {
            Directory.Delete(tenantDir, recursive: true);
        }

        return code;
    }

    private async Task<int> ComposeAsync(string tenant, CancellationToken cancellationToken, params string[] composeArgs)
    {
        tenant = ValidateTenant(tenant);
        var tenantDir = TenantDir(tenant);
        EnsureTenantDir(tenantDir, tenant);
        var metadata = LoadTenant(tenant);

        return await dockerRunner.ComposeAsync(tenantDir, ProjectName(tenant, metadata.Engine), composeArgs);
    }

    private async Task EnsureRunningAsync(TenantMetadata metadata, CancellationToken cancellationToken)
    {
        var code = await ComposeAsync(metadata.Tenant, cancellationToken, "up", "-d");
        if (code != 0)
        {
            throw new CliException("사업자 데이터베이스 컨테이너를 시작하지 못했습니다.", code);
        }

        await WaitUntilReadyAsync(metadata, cancellationToken);
    }

    private async Task WaitUntilReadyAsync(TenantMetadata metadata, CancellationToken cancellationToken)
    {
        var command = metadata.Engine switch
        {
            "sqlserver" => "SQLCMD=$(command -v sqlcmd || find /opt -name sqlcmd -type f 2>/dev/null | head -n 1); \"$SQLCMD\" -C -S localhost -U sa -P \"$MSSQL_SA_PASSWORD\" -Q 'SELECT 1' >/dev/null 2>&1",
            "mysql" => "mysqladmin ping -uroot -p\"$MYSQL_ROOT_PASSWORD\" --silent >/dev/null 2>&1",
            "mariadb" => "mariadb-admin ping -uroot -p\"$MARIADB_ROOT_PASSWORD\" --silent >/dev/null 2>&1",
            "postgres" => $"pg_isready -U {Sh(metadata.User)} -d {Sh(metadata.Database)} >/dev/null 2>&1",
            "oracle" => $"{OracleTool("sqlplus")} -L -S system/\"$ORACLE_PWD\"@//localhost:1521/{metadata.Database} <<'SQL' >/dev/null 2>&1\nSELECT 1 FROM dual;\nEXIT;\nSQL",
            _ => throw new CliException($"지원하지 않는 데이터베이스 엔진입니다: {metadata.Engine}")
        };

        var maxAttempts = metadata.Engine == "oracle" ? 150 : 60;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            var code = await dockerRunner.RunAsync(
                "docker",
                new[] { "exec", metadata.ContainerName, "sh", "-c", command },
                Directory.GetCurrentDirectory(),
                cancellationToken);

            if (code == 0)
            {
                return;
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }

        var seconds = maxAttempts * 2;
        throw new CliException($"사업자 '{metadata.Tenant}'의 데이터베이스 서비스가 {seconds}초 안에 준비되지 않았습니다.");
    }

    private async Task InitializeSqlServerAsync(TenantMetadata metadata, string password, CancellationToken cancellationToken)
    {
        var escapedPassword = password.Replace("'", "''");
        var query = $"""
            IF DB_ID(N'{metadata.Database}') IS NULL EXEC(N'CREATE DATABASE [{metadata.Database}]');
            IF SUSER_ID(N'{metadata.User}') IS NULL CREATE LOGIN [{metadata.User}] WITH PASSWORD=N'{escapedPassword}', CHECK_POLICY=OFF;
            EXEC(N'USE [{metadata.Database}];
            IF USER_ID(N''{metadata.User}'') IS NULL CREATE USER [{metadata.User}] FOR LOGIN [{metadata.User}];
            IF IS_ROLEMEMBER(N''db_owner'', N''{metadata.User}'') = 0 ALTER ROLE db_owner ADD MEMBER [{metadata.User}];');
            """;

        var command = $"SQLCMD=$(command -v sqlcmd || find /opt -name sqlcmd -type f 2>/dev/null | head -n 1); \"$SQLCMD\" -C -S localhost -U sa -P \"$MSSQL_SA_PASSWORD\" -Q {Sh(query)}";
        Console.WriteLine("SQL Server 접속이 가능해질 때까지 대기합니다...");

        for (var attempt = 1; attempt <= 60; attempt++)
        {
            var code = await dockerRunner.RunAsync(
                "docker",
                new[] { "exec", metadata.ContainerName, "sh", "-c", command },
                Directory.GetCurrentDirectory(),
                cancellationToken);

            if (code == 0)
            {
                Console.WriteLine($"데이터베이스 '{metadata.Database}'와 사용자 '{metadata.User}'를 초기화했습니다.");
                return;
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }

        throw new CliException("SQL Server가 120초 안에 준비되지 않았습니다.");
    }

    private async Task InitializeOracleAsync(TenantMetadata metadata, string password, CancellationToken cancellationToken)
    {
        var user = OracleIdentifier(metadata.User);
        var escapedPassword = OracleString(password);
        var script = $"""
            WHENEVER SQLERROR EXIT SQL.SQLCODE
            DECLARE
              user_count NUMBER;
            BEGIN
              SELECT COUNT(*) INTO user_count FROM dba_users WHERE username = '{user}';
              IF user_count = 0 THEN
                EXECUTE IMMEDIATE 'CREATE USER {user} IDENTIFIED BY "{escapedPassword}"';
              END IF;
            END;
            /
            GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE PROCEDURE, CREATE TRIGGER, CREATE TYPE, UNLIMITED TABLESPACE TO {user};
            CREATE OR REPLACE DIRECTORY DBP_DUMP_DIR AS '/tmp';
            GRANT READ, WRITE ON DIRECTORY DBP_DUMP_DIR TO {user};
            EXIT;
            """;
        var command = OracleSqlPlus(metadata.Database, script);
        Console.WriteLine("Oracle XE 접속이 가능해질 때까지 대기합니다...");

        for (var attempt = 1; attempt <= 150; attempt++)
        {
            var code = await dockerRunner.RunAsync(
                "docker",
                new[] { "exec", metadata.ContainerName, "sh", "-c", command },
                Directory.GetCurrentDirectory(),
                cancellationToken);

            if (code == 0)
            {
                Console.WriteLine($"Oracle 스키마 사용자 '{metadata.User}'를 초기화했습니다.");
                return;
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }

        throw new CliException("Oracle XE가 300초 안에 준비되지 않았습니다.");
    }

    private static string BuildEnv(DbEngine engine, TenantMetadata metadata, string password)
    {
        var lines = new List<string>
        {
            $"TENANT_ID={metadata.Tenant}",
            $"CONTAINER_NAME={metadata.ContainerName}",
            $"HOST_PORT={metadata.Port}",
            $"DB_NAME={metadata.Database}",
            $"DB_USER={metadata.User}",
            $"DB_PASSWORD={password}"
        };

        if (engine.Id == "sqlserver")
        {
            lines.Add("ACCEPT_EULA=Y");
            lines.Add("MSSQL_PID=Express");
        }

        return string.Join(Environment.NewLine, lines) + Environment.NewLine;
    }

    private static string BuildCompose(DbEngine engine, TenantMetadata metadata)
    {
        if (!File.Exists(engine.TemplatePath))
        {
            throw new CliException($"데이터베이스 엔진 '{engine.Id}'의 compose 템플릿을 찾을 수 없습니다: {engine.TemplatePath}");
        }

        return File.ReadAllText(engine.TemplatePath, Encoding.UTF8)
            .Replace("${TENANT_ID}", metadata.Tenant, StringComparison.Ordinal);
    }

    private static string SqlServerBackup(string database, string containerPath)
    {
        var query = $"BACKUP DATABASE [{database}] TO DISK = N'{containerPath}' WITH INIT, FORMAT;";
        return $"mkdir -p /var/opt/mssql/backup; SQLCMD=$(command -v sqlcmd || find /opt -name sqlcmd -type f 2>/dev/null | head -n 1); \"$SQLCMD\" -C -S localhost -U sa -P \"$MSSQL_SA_PASSWORD\" -Q {Sh(query)}";
    }

    private static string SqlServerRestore(string database, string containerPath, bool replace)
    {
        if (!replace)
        {
            return $"SQLCMD=$(command -v sqlcmd || find /opt -name sqlcmd -type f 2>/dev/null | head -n 1); \"$SQLCMD\" -C -S localhost -U sa -P \"$MSSQL_SA_PASSWORD\" -Q {Sh($"RESTORE DATABASE [{database}] FROM DISK = N'{containerPath}';")}";
        }

        var query = $"ALTER DATABASE [{database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [{database}] FROM DISK = N'{containerPath}' WITH REPLACE; ALTER DATABASE [{database}] SET MULTI_USER;";
        return $"SQLCMD=$(command -v sqlcmd || find /opt -name sqlcmd -type f 2>/dev/null | head -n 1); \"$SQLCMD\" -C -S localhost -U sa -P \"$MSSQL_SA_PASSWORD\" -Q {Sh(query)}";
    }

    private static string MySqlRestore(string database, string containerPath, bool replace)
    {
        var prefix = replace
            ? $"mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" -e {Sh($"DROP DATABASE IF EXISTS `{database}`; CREATE DATABASE `{database}`;")}; "
            : string.Empty;

        return $"{prefix}mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" {Sh(database)} < {Sh(containerPath)}";
    }

    private static string MariaDbRestore(string database, string containerPath, bool replace)
    {
        var prefix = replace
            ? $"mariadb -uroot -p\"$MARIADB_ROOT_PASSWORD\" -e {Sh($"DROP DATABASE IF EXISTS `{database}`; CREATE DATABASE `{database}`;")}; "
            : string.Empty;

        return $"{prefix}mariadb -uroot -p\"$MARIADB_ROOT_PASSWORD\" {Sh(database)} < {Sh(containerPath)}";
    }

    private static string PostgresRestore(string user, string database, string containerPath, bool replace)
    {
        var clean = replace ? "--clean --if-exists" : string.Empty;
        return $"pg_restore -U {Sh(user)} -d {Sh(database)} {clean} {Sh(containerPath)}";
    }

    private static string OracleBackup(TenantMetadata metadata, string dumpFileName)
    {
        var schema = OracleIdentifier(metadata.User);
        var logFileName = Path.ChangeExtension(dumpFileName, ".log");
        return $"""
            set -e
            rm -f {Sh($"/tmp/{dumpFileName}")} {Sh($"/tmp/{logFileName}")};
            {OracleTool("expdp")} system/"$ORACLE_PWD"@//localhost:1521/{metadata.Database} schemas={schema} directory=DBP_DUMP_DIR dumpfile={Sh(dumpFileName)} logfile={Sh(logFileName)} reuse_dumpfiles=Y
            """;
    }

    private static string OracleRestore(TenantMetadata metadata, string dumpFileName, bool replace, string password)
    {
        var schema = OracleIdentifier(metadata.User);
        var logFileName = Path.ChangeExtension(dumpFileName, ".log");
        var prefix = replace ? OracleSqlPlus(metadata.Database, RecreateOracleUserScript(schema, password)) + Environment.NewLine : string.Empty;
        return $"""
            set -e
            chmod 644 {Sh($"/tmp/{dumpFileName}")};
            {prefix}{OracleTool("impdp")} system/"$ORACLE_PWD"@//localhost:1521/{metadata.Database} schemas={schema} directory=DBP_DUMP_DIR dumpfile={Sh(dumpFileName)} logfile={Sh(logFileName)}
            """;
    }

    private static string RecreateOracleUserScript(string user, string password)
    {
        var escapedPassword = OracleString(password);
        return $"""
            WHENEVER SQLERROR EXIT SQL.SQLCODE
            DECLARE
              user_count NUMBER;
            BEGIN
              SELECT COUNT(*) INTO user_count FROM dba_users WHERE username = '{user}';
              IF user_count > 0 THEN
                EXECUTE IMMEDIATE 'DROP USER {user} CASCADE';
              END IF;
              EXECUTE IMMEDIATE 'CREATE USER {user} IDENTIFIED BY "{escapedPassword}"';
            END;
            /
            GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE PROCEDURE, CREATE TRIGGER, CREATE TYPE, UNLIMITED TABLESPACE TO {user};
            CREATE OR REPLACE DIRECTORY DBP_DUMP_DIR AS '/tmp';
            GRANT READ, WRITE ON DIRECTORY DBP_DUMP_DIR TO {user};
            EXIT;
            """;
    }

    private static string OracleSqlPlus(string database, string script) =>
        $"""
        {OracleTool("sqlplus")} -L -S system/"$ORACLE_PWD"@//localhost:1521/{database} <<'SQL'
        {script}
        SQL
        """;

    private static string OracleTool(string tool) => $"{tool.ToUpperInvariant()}=$(command -v {tool} || find /opt/oracle -name {tool} -type f 2>/dev/null | head -n 1); \"${tool.ToUpperInvariant()}\"";

    private static string OracleIdentifier(string value) => value.ToUpperInvariant();

    private static string OracleString(string value) => value.Replace("\"", "\"\"");

    private static string OracleLogPath(string dumpPath) => Path.ChangeExtension(dumpPath, ".log").Replace('\\', '/');

    private static string ContainerBackupPath(string engine, string fileName) => engine switch
    {
        "sqlserver" => $"/var/opt/mssql/backup/{fileName}",
        _ => $"/tmp/{fileName}"
    };

    private static string LoadPassword(string tenant)
    {
        var envPath = Path.Combine(TenantDir(tenant), ".env");
        if (!File.Exists(envPath))
        {
            throw new CliException($"사업자 '{tenant}'의 환경 파일을 찾을 수 없습니다: {envPath}");
        }

        foreach (var line in File.ReadLines(envPath))
        {
            if (line.StartsWith("DB_PASSWORD=", StringComparison.Ordinal))
            {
                return line["DB_PASSWORD=".Length..];
            }
        }

        throw new CliException($"사업자 '{tenant}'의 환경 파일에 DB_PASSWORD가 없습니다.");
    }

    private static TenantMetadata LoadTenant(string tenant)
    {
        tenant = ValidateTenant(tenant);
        var metadata = TryLoadMetadata(tenant);
        return metadata ?? throw new CliException($"사업자 '{tenant}'가 존재하지 않습니다.");
    }

    private static TenantMetadata? TryLoadMetadata(string tenant)
    {
        var path = Path.Combine(TenantDir(tenant), "metadata.json");
        if (!File.Exists(path))
        {
            return null;
        }

        return JsonSerializer.Deserialize<TenantMetadata>(File.ReadAllText(path), JsonOptions);
    }

    private static string TenantDir(string tenant) => Path.Combine(AppRoot, "tenants", tenant);

    private static string ProjectName(string tenant, string engine) => $"dbp_{tenant}_{engine}";

    private static void EnsureTenantDir(string tenantDir, string tenant)
    {
        if (!Directory.Exists(tenantDir))
        {
            throw new CliException($"사업자 '{tenant}'가 존재하지 않습니다. 경로: {tenantDir}");
        }
    }

    private static string ValidateTenant(string value)
    {
        if (!TenantRegex().IsMatch(value))
        {
            throw new CliException("사업자 ID는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");
        }

        return value;
    }

    private static string ValidateName(string value, string label)
    {
        if (!NameRegex().IsMatch(value))
        {
            throw new CliException($"{label}은(는) 영문자로 시작해야 하며 영문자, 숫자, 밑줄만 사용할 수 있습니다.");
        }

        return value;
    }

    private static string Sh(string value) => "'" + value.Replace("'", "'\"'\"'") + "'";

    [GeneratedRegex("^[a-z0-9][a-z0-9-]{0,62}$")]
    private static partial Regex TenantRegex();

    [GeneratedRegex("^[A-Za-z][A-Za-z0-9_]{0,62}$")]
    private static partial Regex NameRegex();
}
