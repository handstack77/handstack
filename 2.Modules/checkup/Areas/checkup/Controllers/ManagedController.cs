using System;

using checkup.Entity;
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

        // http://localhost:8421/checkup/api/managed/initialize-settings
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

                    var existUser = "0";
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
                        var administratorKey = Guid.NewGuid().ToString("N");
                        var password = administratorKey.ToSHA256();
                        var nonResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.SYS010.ZD02", new
                        {
                            MemberNo = sequentialIdGenerator.NewId().ToString("N"),
                            PersonNo = sequentialIdGenerator.NewId().ToString("N"),
                            EmailID = ModuleConfiguration.AdministratorEmailID,
                            Password = password,
                        });

                        if (nonResults == null)
                        {
                            logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: SYS.SYS010.ZD02 확인 필요", "ManagedController/InitializeSettings");
                            return Ok();
                        }

                        Console.WriteLine($"Administrator Email ID: {ModuleConfiguration.AdministratorEmailID}");
                        Console.WriteLine($"Administrator Key: {administratorKey}");
                    }
                    else
                    {
                        Console.WriteLine($"Administrator Email ID: {ModuleConfiguration.AdministratorEmailID}");

                        var prefix = "file:";
                        var startIndex = ModuleConfiguration.ConnectionString.IndexOf(prefix) + prefix.Length;
                        var endIndex = ModuleConfiguration.ConnectionString.IndexOf(';', startIndex);
                        var filePath = ModuleConfiguration.ConnectionString.Substring(startIndex, endIndex - startIndex);

                        Console.WriteLine($"Administrator Key: {filePath} Person 정보 확인 및 키 초기화 방법. http://localhost:{GlobalConfiguration.ServerPort}/checkup/api/managed/reset-administrator-key?oldPasswordKey=[초기화하는 기존 키]");
                    }

                    Console.WriteLine($"http://localhost:{GlobalConfiguration.ServerPort}/checkup/account/signin.html");

                    result = Ok();
                }
                catch (Exception exception)
                {
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8421/checkup/api/managed/reset-administrator-key
        [HttpGet("[action]")]
        public ActionResult ResetAdministratorKey(string? oldPasswordKey = "")
        {
            ActionResult result = BadRequest();
            if (string.IsNullOrEmpty(oldPasswordKey) == true)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.SYS010.ZD01");

                    var administratorKey = Guid.NewGuid().ToString("N");
                    var password = administratorKey.ToSHA256();
                    var rowAffected = "0";
                    var scalarResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.USR010.UD03", new
                    {
                        UserID = ModuleConfiguration.AdministratorEmailID,
                        OldPassword = oldPasswordKey,
                        NewPassword = password,
                    });

                    if (scalarResults != null)
                    {
                        rowAffected = scalarResults.ToString();
                    }

                    if (rowAffected == "0")
                    {
                        Console.WriteLine($"Administrator Email ID: {ModuleConfiguration.AdministratorEmailID}");

                        var prefix = "file:";
                        var startIndex = ModuleConfiguration.ConnectionString.IndexOf(prefix) + prefix.Length;
                        var endIndex = ModuleConfiguration.ConnectionString.IndexOf(';', startIndex);
                        var filePath = ModuleConfiguration.ConnectionString.Substring(startIndex, endIndex - startIndex);

                        Console.WriteLine($"Administrator Key: {filePath} Person 정보에서 기존 Password Key 확인 필요");
                        administratorKey = "Person 정보에서 기존 Password Key 확인 필요";
                    }
                    else
                    {
                        Console.WriteLine($"Administrator Email ID: {ModuleConfiguration.AdministratorEmailID}");
                        Console.WriteLine($"Administrator Key: {administratorKey}");
                    }

                    result = Ok(administratorKey);
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
