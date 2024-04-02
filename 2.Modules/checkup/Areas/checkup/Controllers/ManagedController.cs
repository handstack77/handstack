using System;
using System.Threading.Tasks;

using checkup.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Data.Enumeration;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace checkup.Areas.checkup.Controllers
{
    [Area("checkup")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ManagedController : ControllerBase
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
            string? authorizationKey = Request.GetParamData("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
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
                    }

                    result = Ok();
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
