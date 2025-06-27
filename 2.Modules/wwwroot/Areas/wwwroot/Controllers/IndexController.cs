using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

using HandStack.Core;
using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using MediatR;

using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

using Newtonsoft.Json;

using Serilog;

using Sqids;

using wwwroot.Entity;

namespace wwwroot.Areas.wwwroot.Controllers
{
    [Area("wwwroot")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class IndexController : BaseController
    {
        private readonly IMediator mediator;
        private readonly ILogger logger;
        private readonly IDistributedCache distributedCache;
        private readonly ISequentialIdGenerator sequentialIdGenerator;
        private readonly SqidsEncoder<int> sqids;
        private readonly IAntiforgery antiforgery;

        public IndexController(IMediator mediator, ILogger logger, IDistributedCache distributedCache, ISequentialIdGenerator sequentialIdGenerator, SqidsEncoder<int> sqids, IAntiforgery antiforgery)
        {
            this.mediator = mediator;
            this.logger = logger;
            this.distributedCache = distributedCache;
            this.sequentialIdGenerator = sequentialIdGenerator;
            this.sqids = sqids;
            this.antiforgery = antiforgery;
        }

        // http://localhost:8421/wwwroot/api/index
        [HttpGet]
        public string Get()
        {
            return "wwwroot IndexController";
        }

        // http://localhost:8421/wwwroot/api/index/get-anti-forgery-token
        [HttpGet("[action]")]
        public IActionResult GetAntiForgeryToken()
        {
            var tokens = antiforgery.GetAndStoreTokens(HttpContext);
            return new JsonResult(new { token = tokens.RequestToken });
        }

        // http://localhost:8421/wwwroot/api/index/validate-token
        [HttpGet("[action]")]
        public async Task<IActionResult> ValidateToken()
        {
            try
            {
                // 쿠키 이름, 헤더 이름 X-CSRF-TOKEN 또는 폼 필드 "__RequestVerificationToken" 검증
                await antiforgery.ValidateRequestAsync(HttpContext);
                return Ok();
            }
            catch
            {
                return BadRequest();
            }
        }

        // http://localhost:8421/wwwroot/api/index/create-id?applicationID=HDS&projectID=SYS&transactionID=SYS010&serviceID=LD01&screenID=web&tokenID=123456
        [HttpGet("[action]")]
        [HttpPost("[action]")]
        public async Task<ActionResult> CreateID(string? applicationID, string? projectID, string? transactionID, string? serviceID, string? tokenID, string? screenID, int? fromMinutes = 10)
        {
            ActionResult result = BadRequest();

            if (Request.Method == "POST")
            {
                var rawBody = await Request.GetRawBodyStringAsync();
                var rawSetting = JsonConvert.DeserializeAnonymousType(rawBody, new
                {
                    applicationID = "",
                    projectID = "",
                    transactionID = "",
                    serviceID = "",
                    screenID = "",
                    tokenID = ""
                });

                if (rawSetting != null)
                {
                    applicationID = rawSetting.applicationID;
                    projectID = rawSetting.projectID;
                    transactionID = rawSetting.transactionID;
                    serviceID = rawSetting.serviceID;
                    screenID = rawSetting.screenID;
                    tokenID = rawSetting.tokenID;
                }
            }

            if (string.IsNullOrEmpty(applicationID) == false
                && string.IsNullOrEmpty(projectID) == false
                && string.IsNullOrEmpty(transactionID) == false
                && string.IsNullOrEmpty(serviceID) == false
            )
            {
                var isWithOrigin = false;
                var requestRefererUrl = Request.Headers.Referer.ToString();
                if (string.IsNullOrEmpty(requestRefererUrl) == false)
                {
                    for (var i = 0; i < GlobalConfiguration.WithOrigins.Count; i++)
                    {
                        var origin = GlobalConfiguration.WithOrigins[i];
                        if (requestRefererUrl.IndexOf(origin) > -1)
                        {
                            isWithOrigin = true;
                            break;
                        }
                    }
                }
                else if (GlobalConfiguration.WithOrigins.Contains(Request.GetBaseUrl()) == true)
                {
                    isWithOrigin = true;
                }

                if (isWithOrigin == false)
                {
                    result = BadRequest();
                }
                else
                {
                    try
                    {
                        var transactionObject = new TransactionClientObject();
                        transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                        transactionObject.ProgramID = applicationID;
                        transactionObject.BusinessID = projectID;
                        transactionObject.TransactionID = transactionID;
                        transactionObject.FunctionID = serviceID;
                        transactionObject.ScreenID = string.IsNullOrEmpty(screenID) == true ? transactionID : screenID;

                        var requestID = GetRequestID(transactionObject, tokenID);
                        if (distributedCache.Get(requestID) != null)
                        {
                            distributedCache.Remove(requestID);
                        }

                        var options = new DistributedCacheEntryOptions()
                        .SetAbsoluteExpiration(TimeSpan.FromMinutes(fromMinutes == null ? 10 : (int)fromMinutes));
                        distributedCache.Set(requestID, "".ToByte(Encoding.UTF8), options);

                        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
                        if (string.IsNullOrEmpty(tokens.RequestToken) == false)
                        {
                            Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken,
                                new CookieOptions
                                {
                                    HttpOnly = false,
                                    Secure = false,
                                    SameSite = SameSiteMode.Strict
                                });
                        }

                        result = Ok(requestID);
                    }
                    catch (Exception exception)
                    {
                        var exceptionText = exception.ToMessage();
                        logger.Warning("[{LogCategory}] " + exceptionText, "Index/CreateID");
                        result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                    }
                }
            }

            return result;
        }

        private string GetRequestID(TransactionClientObject transactionObject, string? tokenID)
        {
            string requestID;
            var installType = TransactionConfig.Program.InstallType;
            var environment = TransactionConfig.Transaction.RunningEnvironment;
            var machineTypeID = TransactionConfig.Transaction.MachineTypeID;
            var programID = transactionObject.ProgramID.PadLeft(8, '0');
            var businessID = transactionObject.BusinessID.PadLeft(3, '0');
            var transactionID = transactionObject.TransactionID.PadLeft(6, '0');
            var functionID = transactionObject.FunctionID.PadLeft(4, '0');
            tokenID = (string.IsNullOrEmpty(tokenID) == true ? TransactionConfig.Program.ClientTokenID : tokenID).PadLeft(6, '0');
            var requestTime = DateTime.Now.ToString("HHmmss");

            // -- 36바이트 = 설치구분 1자리(L: Local, C: Cloud, O: Onpremise) + 환경 ID 1자리 + 어플리케이션 ID 8자리 + 프로젝트 ID 3자리 + 거래 ID 6자리 + 기능 ID 4자리 + 시스템 구분 1자리 (W: WEB, P: Program, S: SVR, E: EXT) + ClientTokenID 6자리 + Timestamp (HHmmss) 6자리
            requestID = $"{installType}{environment}{programID}{businessID}{transactionID}{functionID}{machineTypeID}{tokenID}{requestTime}";
            return requestID;
        }

        // http://localhost:8421/wwwroot/api/index/sha256hash?text=handstack12345
        [HttpGet("[action]")]
        public string SHA256Hash(string text)
        {
            var result = Reflector.AssertLicenseStaticFunc<string>(ModuleConfiguration.ModuleID, typeof(ModuleConfiguration), "MyStaticMethod", "example parameter");
            return text.ToSHA256();
        }

        // http://localhost:8421/wwwroot/api/index/id
        [HttpGet("[action]")]
        public ActionResult ID(int? count, bool? hasSplits = false)
        {
            ActionResult result = BadRequest();

            if (hasSplits == true)
            {
                if (count != null && count > 0)
                {
                    var list = new List<string>();
                    for (var i = 0; i < count; i++)
                    {
                        list.Add(sequentialIdGenerator.NewId().ToString());
                    }
                    result = new JsonResult(list);
                }
                else
                {
                    result = Content(sequentialIdGenerator.NewId().ToString());
                }
            }
            else
            {
                if (count != null && count > 0)
                {
                    var list = new List<string>();
                    for (var i = 0; i < count; i++)
                    {
                        list.Add(sequentialIdGenerator.NewId().ToString("N"));
                    }
                    result = new JsonResult(list);
                }
                else
                {
                    result = Content(sequentialIdGenerator.NewId().ToString("N"));
                }
            }

            // var issueDateTime = Guid.Parse(shortenerNo).ToDateTime();
            // DateTime dateTime = (issueDateTime == null ? DateTime.UtcNow : (DateTime)issueDateTime);
            // var adjustHours = TimeZoneInfo.Local.GetUtcOffset(dateTime).TotalHours;
            // var shortenerDateTime = dateTime.AddHours(adjustHours);

            return result;
        }

        // http://localhost:8421/wwwroot/api/index/guid
        [HttpGet("[action]")]
        public ActionResult GUID(bool? hasSplits = false)
        {
            if (hasSplits == true)
            {
                return Content(Guid.NewGuid().ToString());
            }
            else
            {
                return Content(Guid.NewGuid().ToString("N"));
            }
        }

        // http://localhost:8421/wwwroot/api/index/encode-no?numbers=12345678
        [HttpGet("[action]")]
        public ActionResult EncodeNo([FromQuery] int[] numbers, string? key)
        {
            return Content(sqids.Encode(numbers), "text/html");
        }

        // http://localhost:8421/wwwroot/api/index/decode-no?hash=1rQ2go
        [HttpGet("[action]")]
        public ActionResult DecodeNo(string hash, string? key)
        {
            return Content(string.Join(",", sqids.Decode(hash)), "text/html");
        }

        // http://localhost:8421/wwwroot/api/index/get-secret?keyName=MySecret
        [HttpGet("[action]")]
        public async Task<string> GetSecret(string? baseUrl, string keyName)
        {
            if (string.IsNullOrEmpty(baseUrl) == true)
            {
                baseUrl = Request.GetBaseUrl();
            }

            var requestUri = $"{baseUrl}/secrets/{keyName}";
            using var httpClient = new HttpClient() { Timeout = TimeSpan.FromSeconds(3) };
            using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);

            request.Headers.Add("HandStack-MachineID", GlobalConfiguration.HardwareID);
            request.Headers.Add("HandStack-IP", GlobalConfiguration.ServerLocalIP);
            request.Headers.Add("HandStack-HostName", GlobalConfiguration.HostName);
            request.Headers.Add("HandStack-Environment", GlobalConfiguration.RunningEnvironment);

            using var response = await httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var secretData = await response.Content.ReadAsStringAsync();
            var keyItem = JsonConvert.DeserializeObject<KeyItem>(secretData)!;

            string systemVaultKey = "[Strong@Passw0rd]";
            var vaultKey = (systemVaultKey + "|" + keyItem.Key.PadRight(32, '0')).Substring(0, 32);
            var content = keyItem.IsEncryption.ToBoolean() == true ? keyItem.Value.DecryptAES(keyItem.Key.PadRight(32, '0').Substring(0, 32)) : keyItem.Value;

            return content;
        }
    }
}
