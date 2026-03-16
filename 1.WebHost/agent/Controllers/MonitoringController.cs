using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using agent.Entity;
using agent.Security;

using Microsoft.AspNetCore.Mvc;

using Serilog;

using HandStack.Core.ExtensionMethod;

namespace agent.Controllers
{
    [Route("")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class MonitoringController : AgentControllerBase
    {
        private static readonly Regex MemInfoRegex = new Regex(@"^(?<key>[A-Za-z_]+):\s+(?<value>\d+)\s+kB$", RegexOptions.Compiled);
        private static readonly object syncRoot = new object();

        private static DateTime? lastCpuSampleTime;
        private static TimeSpan? lastTotalCpuTime;

        [HttpGet("stats")]
        public ActionResult GetStats(CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var now = DateTime.Now;
            var processSnapshot = CollectProcessSnapshot();
            var cpuPercent = CalculateCpuPercent(now, processSnapshot.TotalProcessorTime);

            var (totalMemoryBytes, availableMemoryBytes) = GetMemoryStats();
            var usedMemoryBytes = (totalMemoryBytes.HasValue == true && availableMemoryBytes.HasValue == true)
                ? Math.Max(0L, totalMemoryBytes.Value - availableMemoryBytes.Value)
                : (long?)null;

            var networkStats = GetNetworkStats();
            var response = new
            {
                Now = now,
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
                NetworkBytesSent = networkStats.BytesSent,
                NetworkBytesReceived = networkStats.BytesReceived,
                Disks = GetDiskStats()
            };

            return Ok(response);
        }

        private static (int ProcessCount, int ThreadCount, long WorkingSetBytes, TimeSpan TotalProcessorTime) CollectProcessSnapshot()
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

        private static double? CalculateCpuPercent(DateTime sampledAt, TimeSpan currentTotalCpuTime)
        {
            lock (syncRoot)
            {
                if (lastCpuSampleTime.HasValue == false || lastTotalCpuTime.HasValue == false)
                {
                    lastCpuSampleTime = sampledAt;
                    lastTotalCpuTime = currentTotalCpuTime;
                    return null;
                }

                var elapsedWall = sampledAt - lastCpuSampleTime.Value;
                var elapsedCpu = currentTotalCpuTime - lastTotalCpuTime.Value;

                lastCpuSampleTime = sampledAt;
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
                        TotalBytes = total.ToByteSize(2),
                        FreeBytes = free.ToByteSize(2),
                        UsedBytes = used.ToByteSize(2)
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
                Log.Debug(exception, "대체 GC 메모리 통계 수집에 실패했습니다.");
            }

            return (null, null);
        }

        private static (long? TotalMemoryBytes, long? AvailableMemoryBytes) ReadLinuxMemoryStats()
        {
            try
            {
                if (System.IO.File.Exists("/proc/meminfo") == false)
                {
                    return (null, null);
                }

                long? totalKb = null;
                long? availableKb = null;

                foreach (var line in System.IO.File.ReadLines("/proc/meminfo"))
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
                var status = new MemoryStatusEx
                {
                    Length = (uint)Marshal.SizeOf<MemoryStatusEx>()
                };

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

