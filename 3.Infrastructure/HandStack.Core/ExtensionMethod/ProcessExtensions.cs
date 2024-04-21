using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace HandStack.Core.ExtensionMethod
{
    public static class ProcessExtensions
    {
        public static void Run(this Process process, bool isStartUpLog, string echoPrefix)
        {
            process.EchoAndStart(isStartUpLog, echoPrefix);
        }

        public static Task RunAsync(this Process process, bool isStartUpLog, string echoPrefix)
        {
            var tcs = new TaskCompletionSource<object>();
            process.Exited += (s, e) => tcs.SetResult(new());
            process.EnableRaisingEvents = true;
            process.EchoAndStart(isStartUpLog, echoPrefix);
            return tcs.Task;
        }

        private static void EchoAndStart(this Process process, bool isStartUpLog, string echoPrefix)
        {
            if (isStartUpLog == false)
            {
                var message = $"{(string.IsNullOrEmpty(process.StartInfo.WorkingDirectory) ? "" : $"{echoPrefix}: Working Directory: {process.StartInfo.WorkingDirectory}{Environment.NewLine}")}{echoPrefix}: {process.StartInfo.FileName} {process.StartInfo.Arguments}";
                Console.Error.WriteLine(message);
            }

            process.Start();
        }
    }
}
