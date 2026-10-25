using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

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

using Newtonsoft.Json;

using Serilog;

using transact.Entity;
using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    [TypeFilter(typeof(RequestOriginActionFilter))]
    public class ManagedController(IWebHostEnvironment environment, IConfiguration configuration, ILogger logger, TransactLoggerClient loggerClient) : BaseController
    {
        private TransactLoggerClient loggerClient { get; } = loggerClient;
        private ILogger logger { get; } = logger;
        private IConfiguration configuration { get; } = configuration;
        private IWebHostEnvironment environment { get; } = environment;

        // http://localhost:8421/transact/api/managed/reset-contract
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
                    TransactionMapper.LoadContract(GlobalConfiguration.EnvironmentName, Log.Logger, configuration);

                    result = Ok();
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/ResetContract");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/managed/verify
        // AI 공격 대응 하드닝(SecurityHardening) 플래그의 활성/비활성 상태를 확인한다.
        [HttpGet("[action]")]
        public ActionResult Verify()
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowMetadataAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var hardening = ModuleConfiguration.SecurityHardening;
                    var rateLimit = hardening.RateLimit ?? new RateLimitConfig();

                    var protections = new List<ProtectionState>
                    {
                        new("EnforceRealClientIP", hardening.EnforceRealClientIP, hardening.EnforceRealClientIP, "실제 소켓/프록시 IP 신뢰(본문 SourceIP 무시)"),
                        new("TrustedLocalhostBypass", hardening.TrustedLocalhostBypass, hardening.TrustedLocalhostBypass, "localhost 인가 우회 유지(true=레거시 우회 ON, 운영 false 권장)"),
                        new("LockdownMetadataEndpoints", hardening.LockdownMetadataEndpoints, hardening.LockdownMetadataEndpoints, "열거/관리 엔드포인트 AuthorizationKey 강제"),
                        new("RateLimit", rateLimit.Enabled, $"{rateLimit.Mode}, IP {rateLimit.PerIpPerMinute}/분, Token {rateLimit.PerTokenPerMinute}/분", "IP/토큰 분당 유량 제어"),
                        new("MaxRoutes", hardening.MaxRoutes > 0, hardening.MaxRoutes, "경로 수 상한(0=무제한)"),
                        new("MaxDataMapSetCount", hardening.MaxDataMapSetCount > 0, hardening.MaxDataMapSetCount, "데이터맵 세트 수 상한(0=무제한)"),
                        new("MaxDecompressedBytes", hardening.MaxDecompressedBytes > 0, hardening.MaxDecompressedBytes, "압축 해제 크기 상한(0=무제한)"),
                        new("SanitizeErrorText", hardening.SanitizeErrorText, hardening.SanitizeErrorText, "오류 메시지 코드화(차분 오라클 제거)"),
                        new("RegexTimeoutMilliseconds", hardening.RegexTimeoutMilliseconds > 0, hardening.RegexTimeoutMilliseconds, "권한 정규식 타임아웃(0=무제한)"),
                        new("MaxConcurrentPushTasks", hardening.MaxConcurrentPushTasks > 0, hardening.MaxConcurrentPushTasks, "PSH 동시 실행 상한(0=무제한)"),
                        new("EnforceWorkflowContractGuard", hardening.EnforceWorkflowContractGuard, hardening.EnforceWorkflowContractGuard, "동적 Workflow 계약 사전 가드")
                    };

                    var verifyResult = new
                    {
                        moduleID = ModuleConfiguration.ModuleID,
                        version = ModuleConfiguration.Version,
                        isConfigure = ModuleConfiguration.IsConfigure,
                        activeCount = protections.Count(item => item.Active == true),
                        totalCount = protections.Count,
                        replayProtection = new
                        {
                            isValidationRequest = ModuleConfiguration.IsValidationRequest,
                            isValidationGlobalID = ModuleConfiguration.IsValidationGlobalID
                        },
                        securityHardening = protections
                    };

                    result = Content(JsonConvert.SerializeObject(verifyResult), "application/json");
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/Verify");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/managed/string-encrypt?value=helloworld
        [HttpGet("[action]")]
        public ActionResult StringEncrypt(string value)
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
                    result = Content(SynCryptoHelper.Encrypt(value));
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/StringEncrypt");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/managed/string-decrypt?value=WzE2MSwxNTIsMTYyLDIwNSwxNjAsMTc1LDE2OCwxNjUsMTYyLDE5N10uOTM2YTE4
        [HttpGet("[action]")]
        public ActionResult StringDecrypt(string value)
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
                    result = Content(SynCryptoHelper.Decrypt(value));
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/StringDecrypt");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        private sealed class ProtectionState(string name, bool active, object value, string note)
        {
            public string Name { get; } = name;
            public bool Active { get; } = active;
            public object Value { get; } = value;
            public string Note { get; } = note;
        }
    }
}

