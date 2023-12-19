using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using MediatR;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

using Newtonsoft.Json;

using Serilog;

namespace wwwroot.Areas.wwwroot.Controllers
{
    [Area("wwwroot")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class IndexController : ControllerBase
    {
        private readonly IMediator mediator;
        private readonly ILogger logger;
        private readonly IDistributedCache distributedCache;

        public IndexController(IMediator mediator, ILogger logger, IDistributedCache distributedCache)
        {
            this.mediator = mediator;
            this.logger = logger;
            this.distributedCache = distributedCache;
        }

        // http://localhost:8000/wwwroot/api/index
        [HttpGet]
        public string Get()
        {
            return "wwwroot IndexController";
        }

        // http://localhost:8000/wwwroot/api/index/create-id?applicationID=HDS&projectID=SYS&transactionID=SYS010&serviceID=LD01&screenID=web&tokenID=123456
        [HttpGet("[action]")]
        [HttpPost("[action]")]
        public async Task<ActionResult> CreateID(string? applicationID, string? projectID, string? transactionID, string? serviceID, string? tokenID, string? screenID, int? fromMinutes = 10)
        {
            ActionResult result = BadRequest();

            if (Request.Method == "POST")
            {
                string rawBody = await Request.GetRawBodyStringAsync();
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
                && string.IsNullOrEmpty(screenID) == false
                && string.IsNullOrEmpty(tokenID) == false
            )
            {
                bool isWithOrigin = false;
                string? requestRefererUrl = Request.Headers.Referer.ToString();
                if (string.IsNullOrEmpty(requestRefererUrl) == false)
                {
                    for (int i = 0; i < GlobalConfiguration.WithOrigins.Count; i++)
                    {
                        string origin = GlobalConfiguration.WithOrigins[i];
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
                        TransactionClientObject transactionObject = new TransactionClientObject();
                        transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                        transactionObject.ProgramID = applicationID;
                        transactionObject.BusinessID = projectID;
                        transactionObject.TransactionID = transactionID;
                        transactionObject.FunctionID = serviceID;
                        transactionObject.ScreenID = string.IsNullOrEmpty(screenID) == true ? transactionID : screenID;

                        string requestID = GetRequestID(transactionObject, tokenID);
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
                        string exceptionText = exception.ToMessage();
                        logger.Warning("[{LogCategory}] " + exceptionText, "Index/CreateID");
                        result = StatusCode(500, exceptionText);
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

        // http://localhost:8000/handsup/api/index/client-ip
        [HttpGet("[action]")]
        public Task<string> ClientIP()
        {
            return Task.FromResult(HttpContext.GetRemoteIpAddress().ToStringSafe());
        }
    }
}
