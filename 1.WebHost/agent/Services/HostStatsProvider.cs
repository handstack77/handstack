using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

using agent.Entity;

namespace agent.Services
{
    public sealed class HostStatsProvider : IHostStatsProvider
    {
        private static readonly Regex MemInfoRegex = new Regex(@"^(?<key>[A-Za-z_]+):\s+(?<value>\d+)\s+kB$", RegexOptions.Compiled);

        private readonly ILogger<HostStatsProvider> logger;
        private readonly object syncRoot;

        private DateTimeOffset? lastCpuSampleTimeUtc;
        private TimeSpan? lastTotalCpuTime;

        public HostStatsProvider(ILogger<HostStatsProvider> logger)
        {
            this.logger = logger;
            syncRoot = new object();
        }

        public Task<HostStatsResponse> GetStatsAsync(CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var utcNow = DateTimeOffset.UtcNow;
            var processSnapshot = CollectProcessSnapshot();
            var cpuPercent = CalculateCpuPercent(utcNow, processSnapshot.TotalProcessorTime);

            var (totalMemoryBytes, availableMemoryBytes) = GetMemoryStats();
            var usedMemoryBytes = (totalMemoryBytes.HasValue == true && availableMemoryBytes.HasValue == true)
                ? Math.Max(0L, totalMemoryBytes.Value - availableMemoryBytes.Value)
                : (long?)null;

            var (load1, load5, load15) = GetLoadAverage();

            var response = new HostStatsResponse
            {
                UtcNow = utcNow,
                MachineName = Environment.MachineName,
                HostName = Dns.GetHostName(),
                OsDescription = RuntimeInformation.OSDescription,
                OsArchitecture = RuntimeInformation.OSArchitecture.ToString(),
                ProcessArchitecture = RuntimeInformation.ProcessArchitecture.ToString(),
                ProcessorCount = Environment.ProcessorCount,
                Uptime = TimeSpan.FromMilliseconds(Environment.TickCount64),
                CpuPercent = cpuPercent,
                TotalMemoryBytes = totalMemoryBytes,
                AvailableMemoryBytes = availableMemoryBytes,
                UsedMemoryBytes = usedMemoryBytes,
                ProcessCount = processSnapshot.ProcessCount,
                ThreadCount = processSnapshot.ThreadCount,
                WorkingSetAllProcessesBytes = processSnapshot.WorkingSetBytes,
                LoadAverage1m = load1,
                LoadAverage5m = load5,
                LoadAverage15m = load15,
                Network = GetNetworkStats(),
                Disks = GetDiskStats()
            };

            return Task.FromResult(response);
        }

        private (int ProcessCount, int ThreadCount, long WorkingSetBytes, TimeSpan TotalProcessorTime) CollectProcessSnapshot()
        {
            var processCount = 0;
            var threadCount = 0;
            long workingSetBytes = 0;
            var totalProcessorTime = TimeSpan.Zero;

            foreach (var process in Process.GetProcesses())
            {
                try
                {
                    processCount++;
                    threadCount += process.Threads.Count;
                    workingSetBytes += process.WorkingSet64;
                    totalProcessorTime += process.TotalProcessorTime;
                }
                catch
                {
                }
                finally
                {
                    process.Dispose();
                }
            }

            return (processCount, threadCount, workingSetBytes, totalProcessorTime);
        }

        private double? CalculateCpuPercent(DateTimeOffset sampledAtUtc, TimeSpan currentTotalCpuTime)
        {
            lock (syncRoot)
            {
                if (lastCpuSampleTimeUtc.HasValue == false || lastTotalCpuTime.HasValue == false)
                {
                    lastCpuSampleTimeUtc = sampledAtUtc;
                    lastTotalCpuTime = currentTotalCpuTime;
                    return null;
                }

                var elapsedWall = sampledAtUtc - lastCpuSampleTimeUtc.Value;
                var elapsedCpu = currentTotalCpuTime - lastTotalCpuTime.Value;

                lastCpuSampleTimeUtc = sampledAtUtc;
                lastTotalCpuTime = currentTotalCpuTime;

                if (elapsedWall.TotalMilliseconds <= 0 || Environment.ProcessorCount <= 0)
                {
                    return 0;
                }

                var cpu = elapsedCpu.TotalMilliseconds / (Environment.ProcessorCount * elapsedWall.TotalMilliseconds) * 100D;
                if (cpu < 0)
                {
                    cpu = 0;
                }

                if (cpu > 100)
                {
                    cpu = 100;
                }

                return Math.Round(cpu, 2, MidpointRounding.AwayFromZero);
            }
        }

        private static List<HostDiskStat> GetDiskStats()
        {
            var result = new List<HostDiskStat>();
            foreach (var drive in DriveInfo.GetDrives())
            {
                try
                {
                    if (drive.IsReady == false)
                    {
                        continue;
                    }

                    var total = drive.TotalSize;
                    var free = drive.AvailableFreeSpace;
                    var used = total - free;
                    if (used < 0)
                    {
                        used = 0;
                    }

                    result.Add(new HostDiskStat
                    {
                        Name = drive.Name,
                        DriveType = drive.DriveType.ToString(),
                        Format = drive.DriveFormat,
                        TotalBytes = total,
                        FreeBytes = free,
                        UsedBytes = used
                    });
                }
                catch
                {
                }
            }

            return result;
        }

        private static HostNetworkStat GetNetworkStats()
        {
            long bytesSent = 0;
            long bytesReceived = 0;
            var hasValue = false;

            foreach (var networkInterface in NetworkInterface.GetAllNetworkInterfaces())
            {
                try
                {
                    if (networkInterface.OperationalStatus != OperationalStatus.Up)
                    {
                        continue;
                    }

                    var stats = networkInterface.GetIPStatistics();
                    bytesSent += stats.BytesSent;
                    bytesReceived += stats.BytesReceived;
                    hasValue = true;
                }
                catch
                {
                }
            }

            if (hasValue == false)
            {
                return new HostNetworkStat();
            }

            return new HostNetworkStat
            {
                BytesSent = bytesSent,
                BytesReceived = bytesReceived
            };
        }

        private (long? TotalMemoryBytes, long? AvailableMemoryBytes) GetMemoryStats()
        {
            if (OperatingSystem.IsLinux() == true)
            {
                var linuxStats = ReadLinuxMemoryStats();
                if (linuxStats.TotalMemoryBytes.HasValue == true && linuxStats.AvailableMemoryBytes.HasValue == true)
                {
                    return linuxStats;
                }
            }

            if (OperatingSystem.IsWindows() == true)
            {
                var windowsStats = ReadWindowsMemoryStats();
                if (windowsStats.TotalMemoryBytes.HasValue == true && windowsStats.AvailableMemoryBytes.HasValue == true)
                {
                    return windowsStats;
                }
            }

            try
            {
                var gcInfo = GC.GetGCMemoryInfo();
                if (gcInfo.TotalAvailableMemoryBytes > 0)
                {
                    var total = gcInfo.TotalAvailableMemoryBytes;
                    var used = GC.GetTotalMemory(forceFullCollection: false);
                    var available = total - used;
                    if (available < 0)
                    {
                        available = 0;
                    }

                    return (total, available);
                }
            }
            catch (Exception exception)
            {
                logger.LogDebug(exception, "Fallback GC memory stat failed.");
            }

            return (null, null);
        }

        private static (long? TotalMemoryBytes, long? AvailableMemoryBytes) ReadLinuxMemoryStats()
        {
            try
            {
                if (File.Exists("/proc/meminfo") == false)
                {
                    return (null, null);
                }

                long? totalKb = null;
                long? availableKb = null;

                foreach (var line in File.ReadLines("/proc/meminfo"))
                {
                    var match = MemInfoRegex.Match(line);
                    if (match.Success == false)
                    {
                        continue;
                    }

                    var key = match.Groups["key"].Value;
                    if (long.TryParse(match.Groups["value"].Value, out var valueKb) == false)
                    {
                        continue;
                    }

                    if (string.Equals(key, "MemTotal", StringComparison.Ordinal) == true)
                    {
                        totalKb = valueKb;
                    }
                    else if (string.Equals(key, "MemAvailable", StringComparison.Ordinal) == true)
                    {
                        availableKb = valueKb;
                    }
                    else if (availableKb.HasValue == false && string.Equals(key, "MemFree", StringComparison.Ordinal) == true)
                    {
                        availableKb = valueKb;
                    }

                    if (totalKb.HasValue == true && availableKb.HasValue == true)
                    {
                        break;
                    }
                }

                if (totalKb.HasValue == false || availableKb.HasValue == false)
                {
                    return (null, null);
                }

                return (totalKb.Value * 1024L, availableKb.Value * 1024L);
            }
            catch
            {
                return (null, null);
            }
        }

        private static (long? TotalMemoryBytes, long? AvailableMemoryBytes) ReadWindowsMemoryStats()
        {
            try
            {
                var status = new MemoryStatusEx();
                status.Length = (uint)Marshal.SizeOf<MemoryStatusEx>();

                if (GlobalMemoryStatusEx(ref status) == false)
                {
                    return (null, null);
                }

                return ((long)status.TotalPhys, (long)status.AvailPhys);
            }
            catch
            {
                return (null, null);
            }
        }

        private static (double? LoadAverage1m, double? LoadAverage5m, double? LoadAverage15m) GetLoadAverage()
        {
            if (OperatingSystem.IsLinux() == false)
            {
                return (null, null, null);
            }

            try
            {
                if (File.Exists("/proc/loadavg") == false)
                {
                    return (null, null, null);
                }

                var line = File.ReadAllText("/proc/loadavg").Trim();
                if (string.IsNullOrWhiteSpace(line) == true)
                {
                    return (null, null, null);
                }

                var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 3)
                {
                    return (null, null, null);
                }

                var ok1 = double.TryParse(parts[0], out var load1);
                var ok5 = double.TryParse(parts[1], out var load5);
                var ok15 = double.TryParse(parts[2], out var load15);

                return (ok1 ? load1 : null, ok5 ? load5 : null, ok15 ? load15 : null);
            }
            catch
            {
                return (null, null, null);
            }
        }

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool GlobalMemoryStatusEx(ref MemoryStatusEx buffer);

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        private struct MemoryStatusEx
        {
            public uint Length;
            public uint MemoryLoad;
            public ulong TotalPhys;
            public ulong AvailPhys;
            public ulong TotalPageFile;
            public ulong AvailPageFile;
            public ulong TotalVirtual;
            public ulong AvailVirtual;
            public ulong AvailExtendedVirtual;
        }
    }
}

