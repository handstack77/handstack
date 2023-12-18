using System;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;

namespace HandStack.Core.Helpers
{
    public static class NetworkHelper
    {
        public static bool IsIntranet(string ipAddress, int port, AddressFamily addressFamily = AddressFamily.InterNetwork)
        {
            bool result = false;

            try
            {
                using (Socket socket = new Socket(addressFamily, SocketType.Stream, ProtocolType.Tcp))
                {
                    socket.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.DontLinger, false);

                    IAsyncResult asyncResult = socket.BeginConnect(ipAddress, port, null, null);

                    result = asyncResult.AsyncWaitHandle.WaitOne(1000, true);
                }
            }
            catch
            {
                result = false;
            }

            return result;
        }

        public static bool IsPing(string hostNameOrAddress, AddressFamily addressFamily = AddressFamily.InterNetwork)
        {
            bool result = false;

            try
            {
                using (TcpClient tcpClient = new TcpClient(addressFamily))
                {
                    Ping pingSender = new Ping();
                    PingOptions options = new PingOptions();

                    options.DontFragment = true;

                    byte[] buffer = Encoding.ASCII.GetBytes("");
                    int timeout = 120;
                    PingReply reply = pingSender.Send(hostNameOrAddress, timeout, buffer, options);

                    result = (reply.Status == IPStatus.Success);
                }
            }
            catch
            {
                result = false;
            }

            return result;
        }
    }
}
