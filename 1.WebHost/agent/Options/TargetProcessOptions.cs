namespace agent.Options
{
    public sealed class TargetProcessOptions
    {
        public string Id { get; set; } = "";

        public string Name { get; set; } = "";

        public string Description { get; set; } = "";

        public string ExecutablePath { get; set; } = "";

        public string Arguments { get; set; } = "";

        public string WorkingDirectory { get; set; } = "";

        public string ProcessName { get; set; } = "";

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

