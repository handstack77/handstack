namespace agent.Options
{
    public sealed class AuditLogOptions
    {
        public bool Enabled { get; set; } = false;

        public string LogServerUrl { get; set; } = "http://localhost:8421/logger/api/log/insert";

        public string RunningEnvironment { get; set; } = "D";

        public string ApplicationID { get; set; } = "HDS";

        public string ProjectID { get; set; } = "agent";

        public string TransactionID { get; set; } = "targets";

        public string ProgramName { get; set; } = "agent";

        public string ProgramID { get; set; } = "agent";

        public string UserIdHeaderName { get; set; } = "X-User-Id";

        public string DeviceIdHeaderName { get; set; } = "X-Device-Id";

        public int TimeoutSeconds { get; set; } = 3;
    }
}
