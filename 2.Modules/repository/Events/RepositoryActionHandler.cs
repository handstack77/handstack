using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Newtonsoft.Json;

using Serilog;

namespace repository.Events
{
    /*
    MediatorRequest mediatorRequest = new MediatorRequest()
    {
        ActionModuleID = ModuleConfiguration.ModuleID,
        SubscribeEventID = "repository.Events.RepositoryAction",
    };

    Dictionary<string, object> templateParameters = new Dictionary<string, object>();

    templateParameters.Add("applicationID", "");
    templateParameters.Add("repositoryID", "");
    templateParameters.Add("applictionNo", "");
    templateParameters.Add("itemID", "");

    mediatorRequest.Parameters = new Dictionary<string, object?>();
    mediatorRequest.Parameters.Add("Method", "UpdateTenantAppDependencyID");
    mediatorRequest.Parameters.Add("Arguments", templateParameters);

    await mediatorClient.PublishAsync(mediatorRequest);
    */
    public class RepositoryAction : INotification
    {
        public string Method { get; set; }

        public Dictionary<string, object>? Arguments { get; set; }

        public RepositoryAction(MediatorRequest request)
        {
            Method = request.Parameters.Get<string>("Method").ToStringSafe();
            Arguments = request.Parameters.Get<Dictionary<string, object>>("Arguments");
        }
    }

    public class RepositoryActionHandler : INotificationHandler<RepositoryAction>
    {
        private ILogger logger { get; }

        public RepositoryActionHandler(ILogger logger)
        {
            this.logger = logger;
        }

        public Task Handle(RepositoryAction repositoryAction, CancellationToken cancellationToken)
        {
            try
            {
                logger.Warning("[{LogCategory}] " + $"{repositoryAction.Method} Method 확인 필요", "RepositoryActionHandler/Handle");
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "RepositoryActionHandler/Handle");
            }

            return Task.CompletedTask;
        }
    }
}
