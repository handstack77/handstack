namespace agent.Entity
{
    public sealed class TargetStatusResponse
    {
        public string Id { get; set; } = "";

        public string Name { get; set; } = "";

        public string State { get; set; } = "Stopped";

        public int? Pid { get; set; }

        public DateTimeOffset? StartTimeUtc { get; set; }

        public TimeSpan? Uptime { get; set; }

        public double? CpuPercent { get; set; }

        public long? RamBytes { get; set; }

        public TargetRequestStat RequestStat { get; set; } = new TargetRequestStat();

        public TargetResponseStat ResponseStat { get; set; } = new TargetResponseStat();

        public int? LastExitCode { get; set; }

        public DateTimeOffset? LastExitTimeUtc { get; set; }
    }
}

