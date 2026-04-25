namespace dbplatform.Models;

internal sealed record DbEngine(string Id, int DefaultPort, string TemplateFileName)
{
    public string TemplatePath => Path.Combine(TemplatesRoot, TemplateFileName);

    private static string TemplatesRoot => Path.Combine(AppContext.BaseDirectory, "Templates");

    public static DbEngine Parse(string value)
    {
        var engine = value.ToLowerInvariant() switch
        {
            "sqlserver" or "mssql" => Create("sqlserver", 1433),
            "mysql" => Create("mysql", 3306),
            "mariadb" => Create("mariadb", 3306),
            "postgres" or "postgresql" => Create("postgres", 5432),
            "oracle" or "oraclexe" or "xe" => Create("oracle", 1521),
            _ => throw new CliException($"지원하지 않는 데이터베이스 엔진입니다: '{value}'. sqlserver, mysql, mariadb, postgres, oracle 중 하나를 사용하세요.")
        };

        if (!File.Exists(engine.TemplatePath))
        {
            throw new CliException($"데이터베이스 엔진 '{engine.Id}'의 compose 템플릿을 찾을 수 없습니다: {engine.TemplatePath}");
        }

        return engine;
    }

    private static DbEngine Create(string id, int defaultPort) => new(id, defaultPort, $"{id}.compose.yml");
}
