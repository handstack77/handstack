namespace agent.Options
{
    public sealed class DotNetMonitorOptions
    {
        public bool Enabled { get; set; } = false;

        public string BaseAddress { get; set; } = "http://127.0.0.1:52323";

        public string ApiKeyHeaderName { get; set; } = "Authorization";

        public string ApiKeyPrefix { get; set; } = "Bearer";

        public string ApiKey { get; set; } = "";

        public bool AllowInsecureTls { get; set; } = false;

        public string MetricsPath { get; set; } = "/metrics";

        public string LogsPathTemplate { get; set; } = "/logs/{pid}";

        public string TracePathTemplate { get; set; } = "/trace/{pid}";

        public string DumpPathTemplate { get; set; } = "/dump/{pid}";

        public int DefaultCollectionDurationSeconds { get; set; } = 30;
    }
}

