namespace agent.Entity
{
    public sealed class HostDiskStat
    {
        public string Name { get; set; } = "";

        public string DriveType { get; set; } = "";

        public string Format { get; set; } = "";

        public string TotalBytes { get; set; } = "";

        public string FreeBytes { get; set; } = "";

        public string UsedBytes { get; set; } = "";
    }
}

