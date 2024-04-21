using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace HandStack.Core.ExtensionMethod
{
    public static class ProcessExtensions
    {
        public static void Run(this Process process, bool isShowCommand, string echoPrefix)
        {
            process.EchoAndStart(isShowCommand, echoPrefix);
        }

        public static Task RunAsync(this Process process, bool isShowCommand, string echoPrefix)
        {
            var tcs = new TaskCompletionSource<object>();
            process.Exited += (s, e) => tcs.SetResult(new());
            process.EnableRaisingEvents = true;
            process.EchoAndStart(isShowCommand, echoPrefix);
            return tcs.Task;
        }

        private static void EchoAndStart(this Process process, bool isShowCommand, string echoPrefix)
        {
            if (isShowCommand == true)
            {
                var message = $"{echoPrefix}: {process.StartInfo.FileName} {process.StartInfo.Arguments}, WorkingDirectory: {process.StartInfo.WorkingDirectory}";
                Console.WriteLine(message);
            }

            process.Start();
        }
    }
}
