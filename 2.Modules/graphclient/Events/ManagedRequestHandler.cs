using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using graphclient.Entity;
using graphclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Serilog;

namespace graphclient.Events
{
    public class ManagedRequest : IRequest<object?>
    {
        public ManagedRequest(MediatorRequest request)
        {
            Method = request.Parameters.Get<string>("Method").ToStringSafe();
            Arguments = request.Parameters.Get<Dictionary<string, object>>("Arguments");
        }

        public string Method { get; }

        public Dictionary<string, object>? Arguments { get; }
    }

    public class ManagedRequestHandler : IRequestHandler<ManagedRequest, object?>
    {
        private readonly ILogger logger;

        public ManagedRequestHandler(ILogger logger)
        {
            this.logger = logger;
        }

        public Task<object?> Handle(ManagedRequest managedAction, CancellationToken cancellationToken)
        {
            object? response = null;
            try
            {
                if (managedAction.Method == "AddModuleGraphDataSource" || managedAction.Method == "AddModuleDataSource")
                {
                    if (managedAction.Arguments == null)
                    {
                        response = "AddModuleGraphDataSource 오류, Arguments 확인 필요";
                    }
                    else
                    {
                        var graphDataSource = new GraphDataSource()
                        {
                            ApplicationID = managedAction.Arguments.Get<string>("applicationID").ToStringSafe(),
                            ProjectID = managedAction.Arguments.Get<string>("projectID").ToStringSafe(),
                            DataSourceID = managedAction.Arguments.Get<string>("dataSourceID").ToStringSafe(),
                            GraphProvider = managedAction.Arguments.Get<string>("graphProvider").ToStringSafe(),
                            ConnectionString = managedAction.Arguments.Get<string>("connectionString").ToStringSafe(),
                            UserName = managedAction.Arguments.Get<string>("userName").ToStringSafe(),
                            Password = managedAction.Arguments.Get<string>("password").ToStringSafe(),
                            Database = managedAction.Arguments.Get<string>("database").ToStringSafe(),
                            IsEncryption = managedAction.Arguments.Get<string>("isEncryption").ToStringSafe(),
                            Comment = managedAction.Arguments.Get<string>("comment").ToStringSafe()
                        };

                        if (GraphMapper.AddGraphDataSource(graphDataSource, logger, true) == false)
                        {
                            response = "AddModuleGraphDataSource 오류, 요청값 확인 필요";
                        }
                    }
                }
                else
                {
                    logger.Warning("[{LogCategory}] " + $"{managedAction.Method} Method 확인 필요", "ManagedRequestHandler/Handle");
                }
            }
            catch (System.Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "ManagedRequestHandler/Handle");
                response = exception.ToMessage();
            }

            return Task.FromResult(response);
        }
    }
}

