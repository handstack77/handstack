using System.Net.NetworkInformation;
using System.Net;
using System.Net.Sockets;

namespace HandStack.Core.ExtensionMethod
{
    public static class SocketExtensions
    {
        public static bool IsConnencted(this Socket @this, int latencyWait = 10)
        {
            bool result = false;
            try
            {
                result = @this.Poll(latencyWait, SelectMode.SelectRead) == true && @this.Available > 0;
            }
            catch
            {
            }

            return result;
        }

        public static bool PortInUse(int port)
        {
            bool inUse = false;
            IPGlobalProperties ipProperties = IPGlobalProperties.GetIPGlobalProperties();
            IPEndPoint[] ipEndPoints = ipProperties.GetActiveTcpListeners();


            foreach (IPEndPoint endPoint in ipEndPoints)
            {
                if (endPoint.Port == port)
                {
                    inUse = true;
                    break;
                }
            }

            return inUse;
        }
    }
}
