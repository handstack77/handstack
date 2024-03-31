using System;
using System.Threading.Tasks;

using openapi.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Data.Enumeration;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using Serilog;
using HandStack.Web.MessageContract.Message;
using System.Collections.Generic;
using HandStack.Web.ApiClient;
using HandStack.Web.MessageContract.Enumeration;

namespace openapi.Areas.openapi.Controllers
{
    [Area("openapi")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ManagedController : ControllerBase
    {
        private ILogger logger { get; }

        private readonly MediatorClient mediatorClient;

        public ManagedController(ILogger logger, MediatorClient mediatorClient)
        {
            this.logger = logger;
            this.mediatorClient = mediatorClient;
        }

        // http://localhost:8000/openapi/api/managed/initialize-settings
        [HttpGet("[action]")]
        public async Task<ActionResult> InitializeSettings()
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    MediatorRequest mediatorRequest = new MediatorRequest()
                    {
                        ActionModuleID = ModuleConfiguration.ModuleID,
                        SubscribeEventID = "dbclient.Events.ManagedRequest",
                    };

                    Dictionary<string, object> templateParameters = new Dictionary<string, object>();
                    templateParameters.Add("applicationID", ModuleConfiguration.ModuleDataSource.ApplicationID);
                    templateParameters.Add("projectID", ModuleConfiguration.ModuleDataSource.ProjectID);
                    templateParameters.Add("dataSourceID", ModuleConfiguration.ModuleDataSource.DataSourceID);
                    templateParameters.Add("dataProvider", ModuleConfiguration.ModuleDataSource.DataProvider);
                    templateParameters.Add("connectionString", ModuleConfiguration.ModuleDataSource.ConnectionString);
                    templateParameters.Add("isEncryption", ModuleConfiguration.ModuleDataSource.IsEncryption);
                    templateParameters.Add("tanantPattern", ModuleConfiguration.ModuleDataSource.TanantPattern);
                    templateParameters.Add("tanantValue", ModuleConfiguration.ModuleDataSource.TanantValue);

                    mediatorRequest.Parameters = new Dictionary<string, object?>();
                    mediatorRequest.Parameters.Add("Method", "AddModuleDataSource");
                    mediatorRequest.Parameters.Add("Arguments", templateParameters);

                    var sendResponse = await mediatorClient.SendAsync(mediatorRequest);
                    if (sendResponse.Acknowledge == AcknowledgeType.Success)
                    {
                        result = Ok();
                    }
                    else
                    {
                        result = StatusCode(500, sendResponse.ExceptionText);
                    }
                }
                catch (Exception exception)
                {
                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }
    }
}
