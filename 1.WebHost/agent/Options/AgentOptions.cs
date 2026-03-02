using System.Collections.Generic;

namespace agent.Options
{
    public sealed class AgentOptions
    {
        public const string SectionName = "Agent";

        public string ServiceName { get; set; } = "handstack-agent";

        public string ManagementHeaderName { get; set; } = "X-Management-Key";

        public string ManagementKey { get; set; } = "";

        public string StateDirectoryPath { get; set; } = "state";

        public string CollectDirectoryPath { get; set; } = "collect";

        public List<TargetProcessOptions> Targets { get; set; } = new List<TargetProcessOptions>();

        public DotNetMonitorOptions DotNetMonitor { get; set; } = new DotNetMonitorOptions();

        public AuditLogOptions AuditLog { get; set; } = new AuditLogOptions();
    }
}

