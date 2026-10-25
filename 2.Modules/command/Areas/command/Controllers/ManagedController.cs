using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using command.Entity;
using command.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Authorization;
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
    [TypeFilter(typeof(RequestOriginActionFilter))]
    public class ManagedController(IWebHostEnvironment environment, ILogger logger, IConfiguration configuration) : BaseController
    {
        private readonly ILogger logger = logger;
        private readonly IConfiguration configuration = configuration;
        private readonly IWebHostEnvironment environment = environment;

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
    }
}
