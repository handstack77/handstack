namespace agent.Entity
{
    public sealed class HostDiskStat
    {
        public string Name { get; set; } = "";

        public string DriveType { get; set; } = "";

        public string Format { get; set; } = "";

        public long TotalBytes { get; set; }

        public long FreeBytes { get; set; }

        public long UsedBytes { get; set; }
    }
}

