using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using command.Entity;
using command.Extensions;

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

namespace command.Areas.command.Controllers
{
    [Area("command")]
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

        // http://localhost:8421/command/api/managed/reset-contract
        [HttpGet("[action]")]
        public ActionResult ResetContract()
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                lock (CommandMapper.CommandMappings)
                {
                    CommandMapper.CommandMappings.Clear();
                    CommandMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);
                }

                return Ok();
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] command 계약 초기화 오류", "ManagedController/ResetContract");
                return StatusCode(StatusCodes.Status500InternalServerError, "command 계약 초기화 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/command/api/managed/reset-app-contract?userWorkID=userWorkID&applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult ResetAppContract(string userWorkID, string applicationID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                lock (CommandMapper.CommandMappings)
                {
                    RemoveApplicationMappings(applicationID);

                    var basePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "command");
                    if (Directory.Exists(basePath) == false)
                    {
                        return Ok();
                    }

                    var commandMapFiles = ModuleConfiguration.ContractFileExtensions
                        .SelectMany(extension => Directory.GetFiles(basePath, "*" + extension, SearchOption.AllDirectories));
                    foreach (var commandMapFile in commandMapFiles)
                    {
                        CommandMapper.AddCommandMapFile(commandMapFile, true, true, logger);
                    }
                }

                return Ok();
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 앱 command 계약 초기화 오류. UserWorkID: {UserWorkID}, ApplicationID: {ApplicationID}", "ManagedController/ResetAppContract", userWorkID, applicationID);
                return StatusCode(StatusCodes.Status500InternalServerError, "앱 command 계약 초기화 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/command/api/managed/delete-app-contract?userWorkID=userWorkID&applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult DeleteAppContract(string userWorkID, string applicationID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                lock (CommandMapper.CommandMappings)
                {
                    RemoveApplicationMappings(applicationID);
                }

                RemoveTenantFileSyncManagers(userWorkID, applicationID);
                return Ok();
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 앱 command 계약 삭제 오류. UserWorkID: {UserWorkID}, ApplicationID: {ApplicationID}", "ManagedController/DeleteAppContract", userWorkID, applicationID);
                return StatusCode(StatusCodes.Status500InternalServerError, "앱 command 계약 삭제 중 오류가 발생했습니다.");
            }
        }

        private static void RemoveApplicationMappings(string applicationID)
        {
            var commandMappings = CommandMapper.CommandMappings
                .Where(item => item.Value.ApplicationID.Equals(applicationID, StringComparison.OrdinalIgnoreCase))
                .Select(item => item.Key)
                .ToList();

            foreach (var key in commandMappings)
            {
                CommandMapper.CommandMappings.Remove(key);
            }
        }

        private void RemoveTenantFileSyncManagers(string userWorkID, string applicationID)
        {
            lock (ModuleConfiguration.CommandFileSyncManager)
            {
                var tenantKeys = ModuleConfiguration.CommandFileSyncManager.Keys
                    .Where(key => IsTenantPath(key, userWorkID, applicationID))
                    .ToList();

                foreach (var key in tenantKeys)
                {
                    if (ModuleConfiguration.CommandFileSyncManager.TryGetValue(key, out var fileSyncManager) == true)
                    {
                        fileSyncManager.Stop();
                        fileSyncManager.Dispose();
                    }

                    ModuleConfiguration.CommandFileSyncManager.Remove(key);
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
