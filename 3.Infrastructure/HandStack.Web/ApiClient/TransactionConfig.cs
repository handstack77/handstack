using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

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
            foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up)
                    continue;

                if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback ||
                    ni.Description.ToLower().Contains("virtual") ||
                    ni.Description.ToLower().Contains("docker") ||
                    ni.Description.ToLower().Contains("vmware") ||
                    ni.Name.ToLower().Contains("vethernet") ||
                    ni.Description.ToLower().Contains("hyper-v"))
                    continue;

                IPInterfaceProperties ipProps = ni.GetIPProperties();
                foreach (UnicastIPAddressInformation ip in ipProps.UnicastAddresses)
                {
                    if (ip.Address.AddressFamily == AddressFamily.InterNetwork)
                    {
                        return ip.Address.ToString();
                    }
                }
            }

            return "127.0.0.1";
        }

        public static string GetMacAddress()
        {
            foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up)
                    continue;

                if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback ||
                    ni.Description.ToLower().Contains("virtual") ||
                    ni.Description.ToLower().Contains("docker") ||
                    ni.Description.ToLower().Contains("vmware") ||
                    ni.Name.ToLower().Contains("vethernet") ||
                    ni.Description.ToLower().Contains("hyper-v"))
                    continue;

                return ni.GetPhysicalAddress().ToString();
            }

            return "";
        }

        public static string GetNetworkInterfaceType()
        {
            foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up)
                    continue;

                if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback ||
                    ni.Description.ToLower().Contains("virtual") ||
                    ni.Description.ToLower().Contains("docker") ||
                    ni.Description.ToLower().Contains("vmware") ||
                    ni.Name.ToLower().Contains("vethernet") ||
                    ni.Description.ToLower().Contains("hyper-v"))
                    continue;

                return ((int)ni.NetworkInterfaceType).ToString().PadLeft(3, '0');
            }

            return "001";
        }
    }
}
