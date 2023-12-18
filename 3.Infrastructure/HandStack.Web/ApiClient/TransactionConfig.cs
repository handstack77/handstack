using System.Net;
using System.Net.NetworkInformation;

namespace HandStack.Web.ApiClient
{
    public static class TransactionConfig
    {
        public static int TransactionTimeout = 0;
        public static string DiscoveryApiServerUrl = "";
        public static string ClientTag = "";

        public static class Program
        {
            public static string ProgramName = "";
            public static string ProgramVersion = "";
            public static string InstallType = "L";
            public static string LanguageID = "ko";
            public static string BranchCode = "";
            public static string ClientTokenID = "";
            public static string IPAddress = GetIPAddress();
            public static string MacAddress = GetMacAddress();
            public static string NetworkInterfaceType = GetNetworkInterfaceType();
        }

        public static class Transaction
        {
            public static string SystemID = "";
            public static string ProtocolVersion = "001";
            public static string RunningEnvironment = "D";
            public static string MachineName = "LOCALHOST";
            public static string MachineTypeID = "S";
            public static string CompressionYN = "N";
            public static string DataFormat = "J";
            public static string EncryptionType = "P"; // "P:Plain, F:Full, H:Header, B:Body",
            public static string EncryptionKey = "G"; // "P:프로그램, K:KMS 서버, G:GlobalID 키",
        }

        public static class OperatorUser
        {
            public static string UserID = "";
        }

        public static string GetIPAddress()
        {
            string ip = "127.0.0.1";
            IPAddress[] host = Dns.GetHostAddresses(Dns.GetHostName());
            foreach (var item in host)
            {
                if (item.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    ip = item.ToString();
                }
            }
            return ip;
        }

        public static string GetMacAddress()
        {
            NetworkInterface[] NetworkInterfaces = NetworkInterface.GetAllNetworkInterfaces();
            return NetworkInterfaces.Length > 0 ? NetworkInterfaces[0].GetPhysicalAddress().ToString() : "";
        }

        public static string GetNetworkInterfaceType()
        {
            NetworkInterface[] NetworkInterfaces = NetworkInterface.GetAllNetworkInterfaces();
            return NetworkInterfaces.Length > 0 ? ((int)NetworkInterfaces[0].NetworkInterfaceType).ToString().PadLeft(3, '0') : "001";
        }
    }
}
