using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;

namespace HandStack.Core.Helpers
{
    public static class NetworkHelper
    {
        public static bool IsIntranet(string ipAddress, int port, AddressFamily addressFamily = AddressFamily.InterNetwork)
        {
            var result = false;

            try
            {
                using var socket = new Socket(addressFamily, SocketType.Stream, ProtocolType.Tcp);
                socket.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.DontLinger, false);

                var asyncResult = socket.BeginConnect(ipAddress, port, null, null);

                result = asyncResult.AsyncWaitHandle.WaitOne(1000, true);
            }
            catch
            {
                result = false;
            }

            return result;
        }

        public static bool IsPing(string hostNameOrAddress, AddressFamily addressFamily = AddressFamily.InterNetwork)
        {
            var result = false;

            try
            {
                using var tcpClient = new TcpClient(addressFamily);
                var pingSender = new Ping();
                var options = new PingOptions();

                options.DontFragment = true;

                var buffer = Encoding.ASCII.GetBytes("");
                var timeout = 120;
                var reply = pingSender.Send(hostNameOrAddress, timeout, buffer, options);

                result = (reply.Status == IPStatus.Success);
            }
            catch
            {
                result = false;
            }

            return result;
        }
    }
}
