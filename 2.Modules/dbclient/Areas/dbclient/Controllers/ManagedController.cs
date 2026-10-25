using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

using dbclient.Entity;
using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Authorization;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using HtmlAgilityPack;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using Serilog;

namespace dbclient.Areas.dbclient.Controllers
{
    [Area("dbclient")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    [TypeFilter(typeof(RequestOriginActionFilter))]
    public partial class ManagedController(IWebHostEnvironment environment, ILogger logger, IConfiguration configuration) : BaseController
    {
        private static readonly Regex cdataRegex = MyRegex();
        private ILogger logger { get; } = logger;
        private IConfiguration configuration { get; } = configuration;
        private IWebHostEnvironment environment { get; } = environment;

        // http://localhost:8421/dbclient/api/managed/reset-contract
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
                    lock (DatabaseMapper.StatementMappings)
                    {
                        DatabaseMapper.DataSourceMappings.Clear();
                        DatabaseMapper.StatementMappings.Clear();
                        DatabaseMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] 계약 초기화 오류", "ManagedController/ResetContract");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "DB 계약 초기화 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        public static string ReplaceCData(string rawText)
        {
            var matches = cdataRegex.Matches(rawText);

            if (matches != null && matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    var cdataText = match.Groups[2].Value;
                    cdataText = cdataText.Replace("&", "&amp;")
                                         .Replace("<", "&lt;")
                                         .Replace(">", "&gt;")
                                         .Replace("\"", "&quot;");

                    ArgumentNullException.ThrowIfNull(rawText);
                    rawText = rawText.Replace(match.Value, cdataText);
                }
            }
            return rawText;
        }

        [GeneratedRegex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)", RegexOptions.Compiled)]
        private static partial Regex MyRegex();
    }
}


