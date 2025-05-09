using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace HandStack.Core.ExtensionMethod
{
    public static class SocketExtensions
    {
        public static bool IsConnencted(this Socket @this, int latencyWait = 10)
        {
            var result = false;
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
            var inUse = false;
            var ipProperties = IPGlobalProperties.GetIPGlobalProperties();
            var ipEndPoints = ipProperties.GetActiveTcpListeners();


            foreach (var endPoint in ipEndPoints)
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
