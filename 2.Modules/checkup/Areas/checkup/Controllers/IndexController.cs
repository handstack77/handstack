using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Text;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using MediatR;

using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Session;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

using Newtonsoft.Json;

using Serilog;

using Sqids;

namespace checkup.Areas.checkup.Controllers
{
    [Area("checkup")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class IndexController : BaseController
    {
        private readonly IMediator mediator;
        private readonly ILogger logger;
        private readonly IDataProtector dataProtector;
        private readonly IDistributedCache distributedCache;
        private readonly ISequentialIdGenerator sequentialIdGenerator;
        private readonly TextInfo textInfo;
        private readonly SqidsEncoder<int> sqids;

        public IndexController(IMediator mediator, ILogger logger, IDataProtectionProvider dataProtectionProvider, IDistributedCache distributedCache, ISequentialIdGenerator sequentialIdGenerator, SqidsEncoder<int> sqids)
        {
            this.mediator = mediator;
            this.logger = logger;
            this.distributedCache = distributedCache;
            dataProtector = dataProtectionProvider.CreateProtector(nameof(SessionMiddleware));
            this.sequentialIdGenerator = sequentialIdGenerator;
            textInfo = new CultureInfo("en-US", false).TextInfo;
            this.sqids = sqids;
        }

        [HttpGet]
        public string Get()
        {
            return "checkup IndexController";
        }

        // http://localhost:8421/checkup/api/index/has-key?cacheKey=
        [HttpGet("[action]")]
        public ActionResult HasKey(string cacheKey)
        {
            ActionResult result = BadRequest();
            try
            {
                var hasCache = false;
                if (distributedCache.Get(cacheKey) != null)
                {
                    hasCache = true;
                    distributedCache.Remove(cacheKey);
                }
                result = Ok(hasCache);
            }
            catch (Exception exception)
            {
                var exceptionText = exception.ToMessage();
                logger.Warning("[{LogCategory}] " + exceptionText, "Index/HasKey");
                result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
            }

            return result;
        }

        // http://localhost:8421/checkup/api/index/create-id?applicationID=HDS&projectID=SYS&transactionID=SYS010&serviceID=LD01&tokenID=123456
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
                && string.IsNullOrEmpty(tokenID) == false
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
                        if (distributedCache.Get(requestID) == null)
                        {
                            distributedCache.Remove(requestID);
                        }

                        var options = new DistributedCacheEntryOptions()
                        .SetAbsoluteExpiration(TimeSpan.FromMinutes(fromMinutes == null ? 10 : (int)fromMinutes));
                        distributedCache.Set(requestID, "".ToByte(Encoding.UTF8), options);

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

        // http://localhost:8421/checkup/api/index/sha256hash?text=handstack12345
        [HttpGet("[action]")]
        public string SHA256Hash(string text)
        {
            return text.ToSHA256();
        }

        // http://localhost:8421/checkup/api/index/get-session?key=hello
        [HttpGet("[action]")]
        public string GetSession(string key)
        {
            var result = HttpContext.Session.GetString(key);
            if (string.IsNullOrEmpty(result) == true)
            {
                result = "";
            }

            result = HttpContext.Session.Id + "|" + result;

            return result;
        }

        // http://localhost:8421/checkup/api/index/set-session?key=hello&value=world
        [HttpGet("[action]")]
        public string SetSession(string key, string value)
        {
            value = value + DateTime.Now.ToString();
            HttpContext.Session.SetString(key, value);
            value = HttpContext.Session.Id + "|" + value;
            return value;
        }

        // http://localhost:8421/checkup/api/index/session-key
        [HttpGet("[action]")]
        public string SessionKey()
        {
            var result = "";

            try
            {
                HttpContext.Request.Cookies.TryGetValue(GlobalConfiguration.SessionCookieName, out var cookieValue);
                if (cookieValue != null)
                {
                    var protectedData = Convert.FromBase64String(cookieValue.SessionDecryptPad());
                    var unprotectedData = dataProtector.Unprotect(protectedData);
                    result = System.Text.Encoding.UTF8.GetString(unprotectedData);
                }
            }
            catch (Exception exception)
            {
                result = exception.Message;
            }

            return result;
        }

        // http://localhost:8421/checkup/api/index/id
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

        // http://localhost:8421/checkup/api/index/guid
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

        // http://localhost:8421/checkup/api/index/encode-no?numbers=12345678&key=abcdefghijklmnopqrstuvwxyz1234567890
        [HttpGet("[action]")]
        public ActionResult EncodeNo([FromQuery] int[] numbers, string? key)
        {
            ActionResult result = BadRequest();

            if (string.IsNullOrEmpty(key) == true)
            {
                result = Content(sqids.Encode(numbers), "text/html");
            }
            else
            {
                var sqids = new SqidsEncoder<int>(new()
                {
                    Alphabet = key,
                    MinLength = 8,
                });
                result = Content(sqids.Encode(numbers), "text/html");
            }
            return result;
        }

        // http://localhost:8421/checkup/api/index/decode-no?hash=1rQ2go&key=abcdefghijklmnopqrstuvwxyz1234567890
        [HttpGet("[action]")]
        public ActionResult DecodeNo(string hash, string? key)
        {
            ActionResult result = BadRequest();
            if (string.IsNullOrEmpty(key) == true)
            {
                result = Content(string.Join(",", sqids.Decode(hash)), "text/html");
            }
            else
            {
                var sqids = new SqidsEncoder<int>(new()
                {
                    Alphabet = key,
                    MinLength = 8,
                });
                result = Content(string.Join(",", sqids.Decode(hash)), "text/html");
            }
            return result;
        }
    }
}
