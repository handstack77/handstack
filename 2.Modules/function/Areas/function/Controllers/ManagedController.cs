using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

using function.Entity;
using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Authorization;
using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Serilog;

namespace function.Areas.function.Controllers
{
    [Area("function")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    [TypeFilter(typeof(RequestOriginActionFilter))]
    public class ManagedController(IWebHostEnvironment environment, ILogger logger, IConfiguration configuration) : BaseController
    {
        private ILogger logger { get; } = logger;
        private IConfiguration configuration { get; } = configuration;
        private IWebHostEnvironment environment { get; } = environment;

        // http://localhost:8421/function/api/managed/reset-contract
        [HttpGet("[action]")]
        public ActionResult ResetContract()
        {
            _ = BadRequest();
            ActionResult result;
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    lock (FunctionMapper.ScriptMappings)
                    {
                        FunctionMapper.FunctionSourceMappings.Clear();
                        FunctionMapper.ScriptMappings.Clear();
                        FunctionMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] 계약 초기화 오류", "ManagedController/ResetContract");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "Function 계약 초기화 중 오류가 발생했습니다.");
                }
            }

            return result;
        }
    }
}

