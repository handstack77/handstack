using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Web;

using Microsoft.Extensions.Hosting;

using RestSharp;

using Serilog;

namespace ack.Services
{
    internal class ModuleConfigurationService : IHostedService
    {
        private readonly ILogger logger;

        public ModuleConfigurationService(ILogger logger)
        {
            this.logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            string moduleConfigurationUrl = "";
            try
            {
                var client = new RestClient();
                foreach (var item in GlobalConfiguration.ModuleConfigurationUrl)
                {
                    moduleConfigurationUrl = item;
                    if (Uri.TryCreate(moduleConfigurationUrl, UriKind.Absolute, out var uriResult) && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps) == true)
                    {
                        logger.Information($"ModuleConfigurationUrl: {item} 요청");

                        Uri baseUri = new Uri(item);
                        var request = new RestRequest(baseUri, Method.Get);
                        request.AddHeader("ApplicationName", GlobalConfiguration.ApplicationName);
                        request.AddHeader("SystemID", GlobalConfiguration.SystemID);
                        request.AddHeader("HostName", GlobalConfiguration.HostName);
                        request.AddHeader("RunningEnvironment", GlobalConfiguration.RunningEnvironment);
                        request.AddHeader("ApplicationRuntimeID", GlobalConfiguration.ApplicationRuntimeID);
                        request.AddHeader("AuthorizationKey", GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName);

                        var response = await client.ExecuteAsync(request);
                        if (response.StatusCode != HttpStatusCode.OK)
                        {
                            logger.Error($"ModuleConfigurationUrl: {item}, StatusCode: {response.StatusCode}, ErrorMessage: {response.ErrorMessage} 응답 확인 필요");
                        }
                    }
                    else
                    {
                        logger.Error($"ModuleConfigurationUrl: {item} 경로 확인 필요");
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, $"BackgroundTaskAsync 오류: {moduleConfigurationUrl}");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
