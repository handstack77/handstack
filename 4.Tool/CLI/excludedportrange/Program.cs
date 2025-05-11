using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;

namespace excludedportrange
{
    class Program
    {
        [DllImport("Iphlpapi.dll")]
        internal static extern uint DeletePersistentTcpPortReservation(ushort startPort, ushort numberOfPorts);

        [DllImport("Iphlpapi.dll")]
        internal static extern uint DeletePersistentUdpPortReservation(ushort startPort, ushort numberOfPorts);

        static int Main(string[] args)
        {
            string mode;
            ushort startPort;
            ushort numberOfPorts;

            if (args.Length > 2)
            {
                mode = args[0];
                startPort = ushort.Parse(args[1]);
                var endPort = ushort.Parse(args[2]);

                if (startPort > endPort)
                {
                    Help();
                    return 0;
                }

                numberOfPorts = (ushort)(endPort - startPort + 1);
            }
            else
            {
                Help();
                return 0;
            }

            var portToDelete = (ushort)IPAddress.HostToNetworkOrder((short)startPort);

            var result = 0;
            Console.WriteLine($"{mode} Deleting... {startPort}:{numberOfPorts}");

            switch (mode)
            {
                case "tcp":
                    result = (int)DeletePersistentTcpPortReservation(portToDelete, numberOfPorts);
                    break;

                case "udp":
                    result = (int)DeletePersistentUdpPortReservation(portToDelete, numberOfPorts);
                    break;
            }

            Console.WriteLine(result);
            return result;
        }

        static void Help()
        {
            var appName = Path.GetFileName(Assembly.GetExecutingAssembly().Location);
            Console.WriteLine($"{appName} [tcp|udp] [startport] [endport]");
            Console.WriteLine($"ex)");
            Console.WriteLine($"\t{appName} tcp 15000 15550");
        }
    }
}
