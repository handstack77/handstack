using System;
using System.Diagnostics;
using System.IO.Pipes;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.Helpers;

using Microsoft.Extensions.Hosting;

using Serilog;

namespace ack.Services
{
    internal class NamePipeService : BackgroundService
    {
        private readonly ILogger logger;

        public NamePipeService(ILogger logger)
        {
            this.logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var currentId = Process.GetCurrentProcess().Id;
            while (!stoppingToken.IsCancellationRequested)
            {
                using var pipeServer = new NamedPipeServerStream(currentId.ToString(), PipeDirection.InOut, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
                {
                    try
                    {
                        await pipeServer.WaitForConnectionAsync(stoppingToken);
                        var streamHelper = new StreamHelper(pipeServer);
                        streamHelper.WriteString("응답");
                        var filename = streamHelper.ReadString();

                        logger.Information("요청 file: {0} on user: {1}.", filename, pipeServer.GetImpersonationUserName());
                        streamHelper.WriteString("완료");
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested == true)
                    {
                        break;
                    }
                    catch (Exception exception)
                    {
                        logger.Error(exception, "");
                    }
                }
            }
        }
    }
}
