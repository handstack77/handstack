using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Data.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using repository.Extensions;

using Serilog;

namespace repository.Events
{
    /*
    MediatorRequest mediatorRequest = new MediatorRequest()
    {
        ActionModuleID = ModuleConfiguration.ModuleID,
        SubscribeEventID = "repository.Events.RepositoryRequest",
    };

    Dictionary<string, object> templateParameters = new Dictionary<string, object>();

    templateParameters.Add("applicationID", "");
    templateParameters.Add("repositoryID", "");
    templateParameters.Add("applictionNo", "");
    templateParameters.Add("itemID", "");

    mediatorRequest.Parameters = new Dictionary<string, object?>();
    mediatorRequest.Parameters.Add("Method", "UpdateTenantAppDependencyID");
    mediatorRequest.Parameters.Add("Arguments", templateParameters);

    var sendResponse = await mediatorClient.SendAsync(mediatorRequest);
    */
    public class RepositoryRequest : IRequest<object?>
    {
        public string Method { get; set; }

        public Dictionary<string, object>? Arguments { get; set; }

        public RepositoryRequest(MediatorRequest request)
        {
            Method = request.Parameters.Get<string>("Method").ToStringSafe();
            Arguments = request.Parameters.Get<Dictionary<string, object>>("Arguments");
        }
    }

    public class RepositoryRequestHandler : IRequestHandler<RepositoryRequest, object?>
    {
        private ILogger logger { get; }

        private readonly ModuleApiClient moduleApiClient;

        public RepositoryRequestHandler(ILogger logger, ModuleApiClient moduleApiClient)
        {
            this.logger = logger;
            this.moduleApiClient = moduleApiClient;
        }

        public Task<object?> Handle(RepositoryRequest repositoryAction, CancellationToken cancellationToken)
        {
            object? response = null;
            try
            {
                if (repositoryAction.Method == "UpdateTenantAppDependencyID")
                {
                    if (repositoryAction.Arguments != null)
                    {
                        string applicationNo = repositoryAction.Arguments.Get<string>("applicationNo").ToStringSafe();
                        string logoItemID = repositoryAction.Arguments.Get<string>("logoItemID").ToStringSafe();
                        string applicationID = repositoryAction.Arguments.Get<string>("applicationID").ToStringSafe();
                        string repositoryID = repositoryAction.Arguments.Get<string>("repositoryID").ToStringSafe();

                        var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
                        if (repository == null)
                        {
                            logger.Warning("[{LogCategory}] 데이터 거래 오류 " + $"UpdateDependencyID {applicationID}, {repositoryID} RepositoryID 요청 정보 확인 필요", "RepositoryRequestHandler/Handle");
                            goto TransactionException;
                        }

                        var logoResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Dynamic, repository, "SYS.SYS010.MD01", new
                        {
                            ApplicationNo = applicationNo,
                            ItemID = logoItemID
                        });

                        if (logoResults != null)
                        {
                            if (logoResults.Count > 0)
                            {
                                var item = logoResults[0];
                                response = item.AbsolutePath;
                            }
                        }
                    }
                }
                else
                {
                    logger.Warning("[{LogCategory}] " + $"{repositoryAction.Method} Method 확인 필요", "RepositoryRequestHandler/Handle");
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "RepositoryRequestHandler/Handle");
            }

TransactionException:
            return Task.FromResult(response);
        }
    }
}
