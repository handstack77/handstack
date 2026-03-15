using System;

namespace agent.Entity
{
    public sealed class TargetStatusResponse
    {
        public string Id { get; set; } = "";

        public string Name { get; set; } = "";

        public string State { get; set; } = "Stopped";

        public int? Pid { get; set; }

        public DateTime? StartTime { get; set; }

        public TimeSpan? Uptime { get; set; }

        public double? CpuPercent { get; set; }

        public long? RamBytes { get; set; }
    }
}

