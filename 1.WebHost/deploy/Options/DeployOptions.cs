namespace deploy.Options
{
    public sealed class DeployOptions
    {
        public const string SectionName = "Deploy";

        public string ServiceName { get; set; } = "handstack-deploy";

        public string ManagementHeaderName { get; set; } = "X-Deploy-Key";

        public string ManagementKey { get; set; } = "";

        public string StorageRoot { get; set; } = "storage";

        public string DefaultChannel { get; set; } = "stable";

        public string DefaultPlatform { get; set; } = "win-x64";

        public string PublicRootPath { get; set; } = "";

        public string PublicRequestPath { get; set; } = "release";

        public bool Mandatory { get; set; }

        public bool MaintenanceMode { get; set; }

        public string ReleaseNotes { get; set; } = "";
    }
}
