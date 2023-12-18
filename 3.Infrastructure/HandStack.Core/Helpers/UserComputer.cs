using System;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace HandStack.Core.Helper
{
    public static class UserComputer
    {
        public static string MachineName
        {
            get { return Environment.MachineName; }
        }

        public static bool Is64BitOS
        {
            get { return Environment.Is64BitOperatingSystem; }
        }

        public static bool Is64BitProcess
        {
            get { return Environment.Is64BitProcess; }
        }

        public static int SystemPageSize
        {
            get { return Environment.SystemPageSize; }
        }

        public static string OSVersion
        {
            get { return Environment.OSVersion.ToString(); }
        }

        public static int ProcessorCount
        {
            get { return Environment.ProcessorCount; }
        }

        public static bool UserInteractive
        {
            get { return Environment.UserInteractive; }
        }

        public static string UserName
        {
            get { return Environment.UserName; }
        }

        public static string IpAddress
        {
            get { return GetLocalIPAddress(); }
        }

        public static string MacAddress
        {
            get { return GetLocalMacAddress(); }
        }

        public static string Version
        {
            get
            {
                return Environment.Version.ToString();
            }
        }

        public static string GetLocalIPAddress()
        {
            var host = Dns.GetHostEntry(Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == AddressFamily.InterNetwork)
                {
                    return ip.ToString();
                }
            }
            return "127.0.0.1";
        }

        public static string GetLocalMacAddress()
        {
            var interfaces = NetworkInterface.GetAllNetworkInterfaces();
            foreach (var item in interfaces)
            {
                return item.GetPhysicalAddress().ToString();
            }
            return "127.0.0.1";
        }
    }
}
