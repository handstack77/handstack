﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using HandStack.Web.ApiClient;
using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

using openapi.Entity;
using openapi.Extensions;

using Serilog;

namespace openapi.Areas.openapi.Controllers
{
    [Area("openapi")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ManagedController : BaseController
    {
        private ILogger logger { get; }

        private readonly IMemoryCache memoryCache;

        private readonly MediatorClient mediatorClient;

        public ManagedController(ILogger logger, IMemoryCache memoryCache, MediatorClient mediatorClient)
        {
            this.logger = logger;
            this.memoryCache = memoryCache;
            this.mediatorClient = mediatorClient;
        }

        // http://localhost:8000/openapi/api/managed/initialize-settings
        [HttpGet("[action]")]
        public async Task<ActionResult> InitializeSettings()
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
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
                        result = StatusCode(StatusCodes.Status500InternalServerError, sendResponse.ExceptionText);
                    }
                }
                catch (Exception exception)
                {
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/openapi/api/managed/delete-api-service
        [HttpGet("[action]")]
        public ActionResult DeleteApiService(string apiServiceID)
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var apiService = ModuleConfiguration.ApiServices.FirstOrDefault(item =>
                        item.APIServiceID == apiServiceID
                    );

                    if (apiService != null)
                    {
                        ModuleConfiguration.ApiServices.Remove(apiService);
                    }

                    var accessMemberApis = ModuleConfiguration.AccessMemberApis.GetValueOrDefault(apiServiceID);
                    if (accessMemberApis != null)
                    {
                        ModuleConfiguration.AccessMemberApis.Remove(apiServiceID);
                    }

                    var apiParameters = ModuleConfiguration.ApiParameters.GetValueOrDefault(apiServiceID);
                    if (apiParameters != null)
                    {
                        ModuleConfiguration.ApiParameters.Remove(apiServiceID);
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/ResetContract");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/openapi/api/managed/delete-api-data-source
        [HttpGet("[action]")]
        public ActionResult DeleteApiDataSource(string dataSourceID)
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var dataSource = ModuleConfiguration.ApiDataSource.FirstOrDefault(item =>
                        item.DataSourceID == dataSourceID
                    );

                    if (dataSource != null)
                    {
                        ModuleConfiguration.ApiDataSource.Remove(dataSource);
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/ResetContract");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/openapi/api/managed/cache-clear
        [HttpGet("[action]")]
        public ActionResult CacheClear()
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    List<string> items = GetMemoryCacheKeys();
                    foreach (string item in items)
                    {
                        memoryCache.Remove(item);
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Warning("[{LogCategory}] " + exceptionText, "Transaction/CacheClear");
                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        private List<string> GetMemoryCacheKeys()
        {
            List<string> result = new List<string>();
            foreach (var cacheKey in ModuleConfiguration.CacheKeys)
            {
                if (cacheKey.StartsWith($"{ModuleConfiguration.ModuleID}|") == true)
                {
                    result.Add(cacheKey);
                }
            }

            return result;
        }
    }
}
