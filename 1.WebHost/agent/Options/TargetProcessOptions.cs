using System;
using System.Collections.Generic;
using System.IO;

namespace agent.Options
{
    public sealed class TargetProcessOptions
    {
        public string Id { get; set; } = "";

        public string Name { get; set; } = "";

        public string HostAccessID { get; set; } = "";

        public string Description { get; set; } = "";

        public string ExecutablePath { get; set; } = "";

        public string Arguments { get; set; } = "";

        public string WorkingDirectory { get; set; } = "";

        public string ProcessName { get; set; } = "";

        public bool UseStatusProbeWhenProcessNotFound { get; set; } = false;

        public string StatusProbeUrl { get; set; } = "";

        public int StatusProbeTimeoutSeconds { get; set; } = 3;

        public bool UseCommandBridge { get; set; } = false;

        public string CommandBridgeUrl { get; set; } = "";

        public string CommandBridgeHeaderName { get; set; } = "X-Bridge-Key";

        public string CommandBridgeKey { get; set; } = "";

        public int CommandBridgeTimeoutSeconds { get; set; } = 5;

        public int StopTimeoutSeconds { get; set; } = 20;

        public bool KillEntireProcessTree { get; set; } = true;

        public Dictionary<string, string> EnvironmentVariables { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        public string ResolveProcessName()
        {
            if (string.IsNullOrWhiteSpace(ProcessName) == false)
            {
                return ProcessName.Trim();
            }

            if (string.IsNullOrWhiteSpace(ExecutablePath) == false)
            {
                return Path.GetFileNameWithoutExtension(ExecutablePath.Trim());
            }

            return "";
        }
    }
}
