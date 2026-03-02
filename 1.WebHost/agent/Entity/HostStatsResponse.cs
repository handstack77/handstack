using System;
using System.Collections.Generic;

namespace agent.Entity
{
    public sealed class HostStatsResponse
    {
        public DateTimeOffset UtcNow { get; set; }

        public string MachineName { get; set; } = "";

        public string HostName { get; set; } = "";

        public string OsDescription { get; set; } = "";

        public string OsArchitecture { get; set; } = "";

        public string ProcessArchitecture { get; set; } = "";

        public int ProcessorCount { get; set; }

        public TimeSpan Uptime { get; set; }

        public double? CpuPercent { get; set; }

        public long? TotalMemoryBytes { get; set; }

        public long? AvailableMemoryBytes { get; set; }

        public long? UsedMemoryBytes { get; set; }

        public int ProcessCount { get; set; }

        public int ThreadCount { get; set; }

        public long WorkingSetAllProcessesBytes { get; set; }

        public double? LoadAverage1m { get; set; }

        public double? LoadAverage5m { get; set; }

        public double? LoadAverage15m { get; set; }

        public HostNetworkStat Network { get; set; } = new HostNetworkStat();

        public List<HostDiskStat> Disks { get; set; } = new List<HostDiskStat>();
    }
}

