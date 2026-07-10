using System;
using System.IO;
using System.Linq;

using graphclient.Entity;
using graphclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Serilog;

namespace graphclient.Areas.graphclient.Controllers
{
    [Area("graphclient")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ManagedController : BaseController
    {
        private readonly ILogger logger;
        private readonly IConfiguration configuration;
        private readonly IWebHostEnvironment environment;

        public ManagedController(IWebHostEnvironment environment, ILogger logger, IConfiguration configuration)
        {
            this.environment = environment;
            this.logger = logger;
            this.configuration = configuration;
        }

        // http://localhost:8421/graphclient/api/managed/reset-contract
        [HttpGet("[action]")]
        public ActionResult ResetContract()
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                lock (GraphMapper.StatementMappings)
                {
                    lock (GraphMapper.DataSourceMappings)
                    {
                        GraphMapper.StatementMappings.Clear();
                        GraphMapper.DataSourceMappings.Clear();
                        GraphMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);
                    }
                }

                return Ok();
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] graph 계약 초기화 오류", "ManagedController/ResetContract");
                return StatusCode(StatusCodes.Status500InternalServerError, "graph 계약 초기화 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/graphclient/api/managed/reset-app-contract?userWorkID=userWorkID&applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult ResetAppContract(string userWorkID, string applicationID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                lock (GraphMapper.StatementMappings)
                {
                    lock (GraphMapper.DataSourceMappings)
                    {
                        RemoveApplicationMappings(applicationID);

                        var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                        var contractBasePath = PathExtensions.Combine(appBasePath, "graphclient");
                        if (Directory.Exists(contractBasePath) == true)
                        {
                            var contractFiles = ModuleConfiguration.ContractFileExtensions
                                .SelectMany(extension => Directory.GetFiles(contractBasePath, "*" + extension, SearchOption.AllDirectories));
                            foreach (var contractFile in contractFiles)
                            {
                                GraphMapper.AddStatementMap(contractFile, true, logger);
                            }
                        }

                        GraphMapper.LoadTenantGraphDataSources(appBasePath, logger);
                    }
                }

                return Ok();
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 앱 graph 계약 초기화 오류. UserWorkID: {UserWorkID}, ApplicationID: {ApplicationID}", "ManagedController/ResetAppContract", userWorkID, applicationID);
                return StatusCode(StatusCodes.Status500InternalServerError, "앱 graph 계약 초기화 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/graphclient/api/managed/delete-app-contract?userWorkID=userWorkID&applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult DeleteAppContract(string userWorkID, string applicationID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                lock (GraphMapper.StatementMappings)
                {
                    lock (GraphMapper.DataSourceMappings)
                    {
                        RemoveApplicationMappings(applicationID);
                    }
                }

                RemoveTenantFileSyncManagers(userWorkID, applicationID);
                return Ok();
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 앱 graph 계약 삭제 오류. UserWorkID: {UserWorkID}, ApplicationID: {ApplicationID}", "ManagedController/DeleteAppContract", userWorkID, applicationID);
                return StatusCode(StatusCodes.Status500InternalServerError, "앱 graph 계약 삭제 중 오류가 발생했습니다.");
            }
        }

        private static void RemoveApplicationMappings(string applicationID)
        {
            var statementKeys = GraphMapper.StatementMappings
                .Where(item => item.Value.ApplicationID.Equals(applicationID, StringComparison.OrdinalIgnoreCase))
                .Select(item => item.Key)
                .ToList();
            foreach (var key in statementKeys)
            {
                GraphMapper.StatementMappings.Remove(key);
            }

            var dataSourceKeys = GraphMapper.DataSourceMappings
                .Where(item => item.Value.ApplicationID.Equals(applicationID, StringComparison.OrdinalIgnoreCase))
                .Select(item => item.Key)
                .ToList();
            foreach (var key in dataSourceKeys)
            {
                GraphMapper.DataSourceMappings.Remove(key);
            }
        }

        private void RemoveTenantFileSyncManagers(string userWorkID, string applicationID)
        {
            lock (ModuleConfiguration.GraphFileSyncManager)
            {
                var tenantKeys = ModuleConfiguration.GraphFileSyncManager.Keys
                    .Where(key => IsTenantPath(key, userWorkID, applicationID))
                    .ToList();

                foreach (var key in tenantKeys)
                {
                    if (ModuleConfiguration.GraphFileSyncManager.TryGetValue(key, out var fileSyncManager) == true)
                    {
                        fileSyncManager.Stop();
                        fileSyncManager.Dispose();
                    }

                    ModuleConfiguration.GraphFileSyncManager.Remove(key);
                }

                if (tenantKeys.Count > 0)
                {
                    logger.Information("[{LogCategory}] " + string.Join(",", tenantKeys), "Managed/DeleteAppContract");
                }
            }
        }

        private static bool IsTenantPath(string path, string userWorkID, string applicationID)
        {
            var normalizedPath = path.Replace("\\", "/");
            var tenantSegment = $"{userWorkID}/{applicationID}";
            return normalizedPath.IndexOf(tenantSegment, StringComparison.OrdinalIgnoreCase) > -1;
        }
    }
}
