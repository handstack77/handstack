using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Message;

using Mediator;

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
    public class RepositoryAction(MediatorRequest request) : INotification
    {
        public string Method { get; set; } = request.Parameters.Get<string>("Method").ToStringSafe();

        public Dictionary<string, object>? Arguments { get; set; } = request.Parameters.Get<Dictionary<string, object>>("Arguments");
    }

    public class RepositoryActionHandler(ILogger logger) : INotificationHandler<RepositoryAction>
    {
        private ILogger logger { get; } = logger;

        public ValueTask Handle(RepositoryAction repositoryAction, CancellationToken cancellationToken)
        {
            try
            {
                ArgumentNullException.ThrowIfNull(repositoryAction);

                logger.Warning("[{LogCategory}] " + $"{repositoryAction.Method} Method 확인 필요", "RepositoryActionHandler/Handle");
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "RepositoryActionHandler/Handle");
            }

            return ValueTask.CompletedTask;
        }
    }
}
