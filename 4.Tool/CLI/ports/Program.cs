using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace ports
{
    internal class Program
    {
        private const string Version = "1.0.0";
        private static bool userOnly = false;

        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                ShowList();
                return;
            }

            switch (args[0])
            {
                case "bye":
                    if (args.Length < 2)
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine("오류: 포트 번호를 지정해 주세요.");
                        Console.ResetColor();
                        Environment.Exit(1);
                    }
                    KillPort(args[1]);
                    break;

                case "-v":
                case "--version":
                    Console.WriteLine($"ports 버전 {Version}");
                    break;

                case "-u":
                case "--user":
                    userOnly = true;
                    ShowList();
                    break;

                default:
                    if (args[0].StartsWith("-"))
                    {
                        Console.WriteLine($"알 수 없는 옵션: {args[0]}");
                        Environment.Exit(1);
                    }
                    ShowList();
                    break;
            }
        }

        private static void KillPort(string portStr)
        {
            if (!int.TryParse(portStr, out int port))
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("오류: 포트 번호는 숫자여야 합니다.");
                Console.ResetColor();
                return;
            }

            var entries = GetListeningPorts();
            var target = entries.FirstOrDefault(x => x.Port == port);
            if (target == null)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"포트 {port}에서 실행 중인 프로세스를 찾을 수 없습니다.");
                Console.ResetColor();
                Environment.Exit(1);
            }

            try
            {
                var proc = Process.GetProcessById(target.Pid);
                string procName = target.ProcessName;
                proc.Kill();

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"포트 {port}의 {procName} (PID: {target.Pid}) 프로세스를 종료했습니다.");
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"포트 {port}의 프로세스를 종료하지 못했습니다. 관리자 권한(sudo)으로 시도해 보세요.");
                Console.WriteLine($"상세 정보: {ex.Message}");
                Console.ResetColor();
                Environment.Exit(1);
            }
        }

        private static void ShowList()
        {
            var ports = GetListeningPorts();
            var seenPorts = new HashSet<int>();
            var displayData = new List<(string Port, string Name, string Path)>();

            foreach (var item in ports)
            {
                if (seenPorts.Contains(item.Port)) continue;
                seenPorts.Add(item.Port);

                string displayName = item.ProcessName;
                string displayPath = item.Path;

                if (displayName.Equals("node", StringComparison.OrdinalIgnoreCase))
                {
                    string? cwd = GetCwdForPid(item.Pid);
                    if (!string.IsNullOrWhiteSpace(cwd))
                    {
                        string pkgPath = Path.Combine(cwd, "package.json");
                        if (File.Exists(pkgPath))
                        {
                            try
                            {
                                string content = File.ReadAllText(pkgPath);
                                var match = Regex.Match(content, "\"name\"\\s*:\\s*\"([^\"]+)\"");
                                if (match.Success)
                                {
                                    displayName = match.Groups[1].Value;
                                }
                            }
                            catch { }
                        }

                        string home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                        displayPath = cwd.StartsWith(home)
                            ? "~" + cwd.Substring(home.Length).Replace("\\", "/")
                            : cwd;
                    }
                }

                if (userOnly && (displayPath == "-" || string.IsNullOrWhiteSpace(displayPath))) continue;

                displayData.Add((item.Port.ToString(), displayName, displayPath));
            }

            if (displayData.Count == 0) return;

            string headPort = "port";
            string headName = "process";
            string headPath = "path";

            int maxPortLen = Math.Max(headPort.Length * 2, displayData.Max(x => x.Port.Length));
            int maxNameLen = Math.Max(headName.Length * 2, displayData.Max(x => x.Name.Length));

            string format = $"{{0,-{maxPortLen}}}   {{1,-{maxNameLen}}}   {{2}}";

            Console.Write("\u001b[1m");
            Console.WriteLine(string.Format(format, headPort, headName, headPath));
            Console.ResetColor();

            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine(string.Format(format, new string('-', maxPortLen), new string('-', maxNameLen), "----"));
            Console.ResetColor();

            foreach (var row in displayData)
            {
                Console.WriteLine(string.Format(format, row.Port, row.Name, row.Path));
            }
        }

        private static List<PortInfo> GetListeningPorts()
        {
            var results = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? GetPortsWindows() : GetPortsUnix();
            return results.OrderBy(x => x.Port).ToList();
        }

        private static List<PortInfo> GetPortsWindows()
        {
            var list = new List<PortInfo>();
            var output = RunCommand("netstat", "-ano");
            var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var line in lines)
            {
                if (!line.Contains("TCP") || !line.Contains("LISTENING")) continue;

                var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 5) continue;

                string localAddr = parts[1];
                string pidStr = parts[parts.Length - 1];

                int lastColon = localAddr.LastIndexOf(':');
                if (lastColon == -1) continue;

                string portStr = localAddr.Substring(lastColon + 1);

                if (int.TryParse(portStr, out int port) && int.TryParse(pidStr, out int pid))
                {
                    string procName = "Unknown";
                    string? path = "-";
                    try
                    {
                        var p = Process.GetProcessById(pid);
                        procName = p.ProcessName;

                        if (p.MainModule?.FileName is string fileName)
                        {
                            path = Path.GetDirectoryName(fileName);
                        }
                    }
                    catch
                    {
                        // 프로세스 접근 거부 등 무시
                    }

                    list.Add(new PortInfo { Port = port, Pid = pid, ProcessName = procName, Path = path ?? "-" });
                }
            }
            return list;
        }

        private static List<PortInfo> GetPortsUnix()
        {
            var list = new List<PortInfo>();
            try
            {
                var output = RunCommand("lsof", "-iTCP -sTCP:LISTEN -n -P");
                var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var line in lines)
                {
                    if (line.StartsWith("COMMAND")) continue;
                    var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length < 9) continue;

                    string cmd = parts[0];
                    string pidStr = parts[1];
                    string nodeName = parts[8];

                    int lastColon = nodeName.LastIndexOf(':');
                    if (lastColon == -1) continue;
                    string portStr = nodeName.Substring(lastColon + 1);

                    if (int.TryParse(portStr, out int port) && int.TryParse(pidStr, out int pid))
                    {
                        list.Add(new PortInfo { Port = port, Pid = pid, ProcessName = cmd, Path = "-" });
                    }
                }
            }
            catch
            {
                Console.WriteLine("오류: lsof 명령을 실행할 수 없습니다. 설치 여부를 확인해 주세요.");
            }
            return list;
        }

        private static string? GetCwdForPid(int pid)
        {
            try
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    var p = Process.GetProcessById(pid);
                    return p.MainModule?.FileName is string fileName ? Path.GetDirectoryName(fileName) : null;
                }
                else
                {
                    string output = RunCommand("lsof", $"-p {pid}");
                    var lines = output.Split('\n');
                    foreach (var line in lines)
                    {
                        var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 9 && parts[3] == "cwd")
                        {
                            int slashIndex = line.IndexOf("/", StringComparison.Ordinal);
                            if (slashIndex >= 0)
                            {
                                return line.Substring(slashIndex).Trim();
                            }
                        }
                    }
                    return null;
                }
            }
            catch { return null; }
        }

        private static string RunCommand(string command, string args)
        {
            var processInfo = new ProcessStartInfo
            {
                FileName = command,
                Arguments = args,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            try
            {
                using var process = Process.Start(processInfo);
                if (process == null) return string.Empty;

                string output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();
                return output;
            }
            catch { return string.Empty; }
        }

        class PortInfo
        {
            public int Port { get; set; }
            public int Pid { get; set; }
            public string ProcessName { get; set; } = string.Empty;
            public string Path { get; set; } = "-";
        }
    }
}
