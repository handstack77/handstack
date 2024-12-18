using System;

using checkup.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace checkup.Areas.checkup.Controllers
{
    [Area("checkup")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ManagedController : BaseController
    {
        private ILogger logger { get; }
        private readonly ISequentialIdGenerator sequentialIdGenerator;
        private readonly ModuleApiClient businessApiClient;

        public ManagedController(ILogger logger, ModuleApiClient businessApiClient, ISequentialIdGenerator sequentialIdGenerator)
        {
            this.logger = logger;
            this.businessApiClient = businessApiClient;
            this.sequentialIdGenerator = sequentialIdGenerator;
        }

        // http://localhost:8000/checkup/api/managed/initialize-settings
        [HttpGet("[action]")]
        public ActionResult InitializeSettings()
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
                    ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.SYS010.ZD01");

                    string existUser = "0";
                    var scalarResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, "SYS.USR010.GD01", new
                    {
                        PersonID = ModuleConfiguration.AdministratorEmailID
                    });

                    if (scalarResults != null)
                    {
                        existUser = scalarResults.ToString();
                    }

                    if (existUser == "0")
                    {
                        string administratorKey = Guid.NewGuid().ToString("N");
                        string password = administratorKey.ToSHA256();
                        var nonResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.SYS010.ZD02", new
                        {
                            MemberNo = sequentialIdGenerator.NewId().ToString("N"),
                            PersonNo = sequentialIdGenerator.NewId().ToString("N"),
                            EmailID = ModuleConfiguration.AdministratorEmailID,
                            Password = password,
                        });

                        if (nonResults == null)
                        {
                            logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: SYS.USR010.ID01 확인 필요", "ManagedController/InitializeSettings");
                            return Ok();
                        }

                        Console.WriteLine($"Administrator Email ID: {ModuleConfiguration.AdministratorEmailID}");
                        Console.WriteLine($"Administrator Key: {administratorKey}");
                        Console.WriteLine($"http://localhost:{GlobalConfiguration.ServerPort}/checkup//account/signin.html");
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }
    }
}
