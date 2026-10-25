using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Authorization;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using prompter.DataClient;
using prompter.Entity;
using prompter.Extensions;

using Serilog;

namespace prompter.Areas.prompter.Controllers
{
    [Area("prompter")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    [TypeFilter(typeof(RequestOriginActionFilter))]
    public partial class ManagedController(ILogger logger, PromptBuiltinToolService builtinToolService) : BaseController
    {
        private ILogger logger { get; } = logger;
        private PromptBuiltinToolService builtinToolService { get; } = builtinToolService;

        // http://localhost:8421/prompter/api/managed/reset-contract
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
                    lock (PromptMapper.PromptMappings)
                    {
                        PromptMapper.DataSourceMappings.Clear();
                        PromptMapper.PromptMappings.Clear();
                        PromptMapper.LoadContract(Log.Logger);
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

        // http://localhost:8421/prompter/api/managed/skill-search?query=excel&limit=5
        [HttpGet("skill-search")]
        public async Task<ActionResult> SkillSearch(string query, int limit = 5)
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
                    var response = await builtinToolService.SearchSkillsAsync(query, limit, HttpContext.RequestAborted);
                    result = Content(response, "application/json");
                }
                catch (Exception exception)
                {
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8421/prompter/api/managed/skill-install
        [HttpPost("skill-install")]
        public async Task<ActionResult> SkillInstall([FromBody] SkillInstallRequest request)
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
                    var response = await builtinToolService.InstallSkillAsync(request?.ID.ToStringSafe() ?? "", HttpContext.RequestAborted);
                    result = Content(response, "application/json");
                }
                catch (Exception exception)
                {
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        public static string ReplaceCData(string rawText)
        {
            var matches = MyRegex().Matches(rawText);

            if (matches != null && matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    var cdataText = match.Groups[2].Value;
                    cdataText = cdataText.Replace("&", "&amp;");
                    cdataText = cdataText.Replace("<", "&lt;");
                    cdataText = cdataText.Replace(">", "&gt;");
                    cdataText = cdataText.Replace("\"", "&quot;");

                    ArgumentNullException.ThrowIfNull(rawText);
                    rawText = rawText.Replace(match.Value, cdataText);
                }
            }
            return rawText;
        }

        [GeneratedRegex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)")]
        private static partial Regex MyRegex();
    }

    public record SkillInstallRequest
    {
        public string ID { get; set; } = "";
    }
}
