using System;
using System.Buffers.Text;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using transact.Entity;
using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public partial class WorkflowController : BaseController
    {
        private readonly Serilog.ILogger logger;
        private readonly IDistributedCache distributedCache;
        private readonly TransactLoggerClient loggerClient;
        private readonly TransactClient transactClient;

        public WorkflowController(IDistributedCache distributedCache, Serilog.ILogger logger, TransactLoggerClient loggerClient, TransactClient transactClient)
        {
            this.logger = logger;
            this.distributedCache = distributedCache;
            this.loggerClient = loggerClient;
            this.transactClient = transactClient;
        }

        // http://localhost:8421/transact/api/workflow/execute
        [HttpPost("[action]")]
        public async Task<ActionResult> Execute(TransactionRequest request)
        {
            var response = new TransactionResponse();
            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(response), "application/json");
            }

            var transactionRouteCount = request.System.Routes.Count > 0 ? request.System.Routes.Count - 1 : -1;
            var transactionWorkID = request.LoadOptions?.Get<string>("work-id").ToStringSafe();
            transactionWorkID = string.IsNullOrWhiteSpace(transactionWorkID) ? "mainapp" : transactionWorkID;

            try
            {
                var baseUrl = HttpContext.Request.GetBaseUrl();
                var refererPath = HttpContext.Request.Headers.Referer.ToString();
                var tenantAppRequestPath = $"{baseUrl}/{GlobalConfiguration.TenantAppRequestPath}/";
                var transactionUserWorkID = request.LoadOptions?.Get<string>("work-id").ToStringSafe();
                var transactionApplicationID = request.LoadOptions?.Get<string>("app-id").ToStringSafe();
                request.System.ProgramID = !string.IsNullOrWhiteSpace(transactionApplicationID) ? transactionApplicationID : request.System.ProgramID;

                if (!string.IsNullOrWhiteSpace(transactionUserWorkID))
                {
                    transactionWorkID = transactionUserWorkID;
                }

                transactClient.DefaultResponseHeaderConfiguration(request, response, transactionRouteCount);

                if (ModuleConfiguration.IsValidationRequest == true)
                {
                    if (ModuleConfiguration.BypassGlobalIDTransactions.Contains(request.Transaction.TransactionID) == false && (request.System.Routes.Count == 0 || distributedCache.Get(request.Transaction.GlobalID) == null))
                    {
                        response.ExceptionText = "잘못된 요청";
                        return Content(JsonConvert.SerializeObject(response), "application/json");
                    }
                    else
                    {
                        distributedCache.Remove(request.Transaction.GlobalID);
                    }

                    var jsMilliseconds = request.System.Routes[transactionRouteCount].RequestTick;
                    var dateTimeOffset = DateTimeOffset.FromUnixTimeMilliseconds(jsMilliseconds);
                    var interval = DateTimeOffset.UtcNow - dateTimeOffset;
                    if (interval.TotalSeconds > 180)
                    {
                        response.ExceptionText = "요청 만료";
                        return Content(JsonConvert.SerializeObject(response), "application/json");
                    }

                    if (ModuleConfiguration.IsValidationGlobalID == true && ModuleConfiguration.BypassGlobalIDTransactions.Contains(request.Transaction.TransactionID) == false)
                    {
                        var findGlobalID = ModuleConfiguration.RequestGlobalIDList.FirstOrDefault(p => p == request.Transaction.GlobalID);
                        if (!string.IsNullOrWhiteSpace(findGlobalID))
                        {
                            response.ExceptionText = "중복 요청";
                            return Content(JsonConvert.SerializeObject(response), "application/json");
                        }

                        ModuleConfiguration.RequestGlobalIDList.Add(request.Transaction.GlobalID);
                    }
                }

                var isAllowRequestTransactions = false;
                if (ModuleConfiguration.AllowRequestTransactions.ContainsKey("*") == true)
                {
                    isAllowRequestTransactions = true;
                }
                else if (ModuleConfiguration.AllowRequestTransactions.ContainsKey(request.System.ProgramID) == true)
                {
                    var allowProjects = ModuleConfiguration.AllowRequestTransactions[request.System.ProgramID];
                    if (allowProjects != null && (allowProjects.Contains("*") == true || allowProjects.Contains(request.Transaction.BusinessID) == true))
                    {
                        isAllowRequestTransactions = true;
                    }
                }

                if (isAllowRequestTransactions == false)
                {
                    response.ExceptionText = $"애플리케이션 ID: '{request.System.ProgramID}', 프로젝트 ID: {request.Transaction.BusinessID} 요청 가능 거래 매핑 정보 확인 필요";
                    return Content(JsonConvert.SerializeObject(response), "application/json");
                }

                response.System.PathName = Request.Path;

                if (string.IsNullOrWhiteSpace(request.Action) ||
                    string.IsNullOrWhiteSpace(request.Kind) ||
                    request.System == null ||
                    request.Transaction == null ||
                    request.PayLoad == null ||
                    request.Interface == null)
                {
                    response.ExceptionText = "잘못된 입력 전문";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                if (string.IsNullOrWhiteSpace(request.Transaction.DataFormat))
                {
                    request.Transaction.DataFormat = "J";
                }

                if (request.Transaction.DataFormat == "T")
                {
                    if (request.PayLoad.DataMapSet == null)
                    {
                        request.PayLoad.DataMapSet = new List<List<DataMapItem>>();
                    }

                    request.PayLoad.DataMapSet.Clear();

                    foreach (var dataMapSetRaw in request.PayLoad.DataMapSetRaw)
                    {
                        var decryptInputData = transactClient.DecryptInputData(dataMapSetRaw, request.Transaction.CompressionYN);
                        var reqJArray = transactClient.ToJson(decryptInputData);
                        if (!TryDeserializeDataMapItems(reqJArray.ToString(), out var reqInputs))
                        {
                            response.ExceptionText = "입력 데이터 맵 정보 확인 필요";
                            return LoggingAndReturn(response, transactionWorkID, "N", null);
                        }

                        request.PayLoad.DataMapSet.Add(reqInputs);
                    }
                }
                else if (request.Transaction.DataFormat == "J")
                {
                    if (request.Transaction.CompressionYN.ParseBool() == true)
                    {
                        if (request.PayLoad.DataMapSet == null)
                        {
                            request.PayLoad.DataMapSet = new List<List<DataMapItem>>();
                        }

                        request.PayLoad.DataMapSet.Clear();

                        foreach (var dataMapSetRaw in request.PayLoad.DataMapSetRaw)
                        {
                            var decryptInputData = transactClient.DecryptInputData(dataMapSetRaw, request.Transaction.CompressionYN);
                            if (string.IsNullOrWhiteSpace(decryptInputData))
                            {
                                request.PayLoad.DataMapSet.Add(new List<DataMapItem>());
                            }
                            else if (!TryDeserializeDataMapItems(decryptInputData, out var reqInput))
                            {
                                response.ExceptionText = "입력 데이터 맵 정보 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "N", null);
                            }
                            else
                            {
                                request.PayLoad.DataMapSet.Add(reqInput);
                            }
                        }
                    }
                }
                else
                {
                    response.ExceptionText = $"데이터 포맷 '{request.Transaction.DataFormat}' 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                if (request.PayLoad.DataMapCount.Count == 0 && request.PayLoad.DataMapSet.Count > 0)
                {
                    request.PayLoad.DataMapCount.Add(request.PayLoad.DataMapSet.Count);
                }

                if (string.IsNullOrWhiteSpace(request.Environment) ||
                    ModuleConfiguration.AvailableEnvironment.Count == 0 ||
                    ModuleConfiguration.AvailableEnvironment.Contains(request.Environment) == false)
                {
                    response.ExceptionText = $"입력 전문 '{request.Environment}' 환경정보 구분코드 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                var isAllowWorkflowRequestTransaction = false;
                if (ModuleConfiguration.AllowRequestTransactions.ContainsKey("*") == true)
                {
                    isAllowWorkflowRequestTransaction = true;
                }
                else if (ModuleConfiguration.AllowRequestTransactions.ContainsKey(request.System.ProgramID) == true)
                {
                    var allowProjects = ModuleConfiguration.AllowRequestTransactions[request.System.ProgramID];
                    if (allowProjects != null && (allowProjects.Contains("*") == true || allowProjects.Contains(request.Transaction.BusinessID) == true))
                    {
                        isAllowWorkflowRequestTransaction = true;
                    }
                }
                else
                {
                    isAllowWorkflowRequestTransaction = refererPath.StartsWith(tenantAppRequestPath) &&
                        !string.IsNullOrWhiteSpace(transactionUserWorkID) &&
                        !string.IsNullOrWhiteSpace(transactionApplicationID);
                }

                if (isAllowWorkflowRequestTransaction == false)
                {
                    response.ExceptionText = $"애플리케이션 ID: '{request.System.ProgramID}', 프로젝트 ID: {request.Transaction.BusinessID} 요청 가능 거래 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.TransactionRequestLogging(request, transactionWorkID, "Y", (string error) =>
                    {
                        logger.Information("[{LogCategory}] [{GlobalID}] " + $"fallback error: {error}, Request JSON: {JsonConvert.SerializeObject(request)}", "Workflow/Execute", request.Transaction.GlobalID);
                    });
                }

                var businessContract = TransactionMapper.GetBusinessContract(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
                if (businessContract == null)
                {
                    response.ExceptionText = $"ProgramID '{request.System.ProgramID}', BusinessID '{request.Transaction.BusinessID}', TransactionID '{request.Transaction.TransactionID}' 거래 Workflow 입력 전문 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                if (string.IsNullOrWhiteSpace(businessContract.TransactionApplicationID))
                {
                    businessContract.TransactionApplicationID = request.System.ProgramID;
                }

                var transactionInfo = businessContract.Services.FirstOrDefault(item => item.ServiceID == request.Transaction.FunctionID)?.DeepCopy();
                if (transactionInfo == null)
                {
                    response.ExceptionText = $"FunctionID '{request.Transaction.FunctionID}' Workflow 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                var isAccessScreenID = false;
                if (transactionInfo.AccessScreenID == null)
                {
                    isAccessScreenID = businessContract.TransactionID == request.Transaction.ScreenID;
                }
                else if (transactionInfo.AccessScreenID.IndexOf(request.Transaction.ScreenID) > -1)
                {
                    isAccessScreenID = true;
                }
                else if (businessContract.TransactionID == request.Transaction.ScreenID)
                {
                    isAccessScreenID = true;
                }

                if (isAccessScreenID == false)
                {
                    var publicTransaction = TransactionMapper.GetPublicTransaction(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
                    isAccessScreenID = publicTransaction != null;
                }

                if (isAccessScreenID == false)
                {
                    response.ExceptionText = $"ScreenID '{request.Transaction.ScreenID}' 요청 가능화면 Workflow 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                if (transactionInfo.CommandType != "W" || transactionInfo.WorkflowSteps.Count == 0)
                {
                    response.ExceptionText = $"CommandType: '{transactionInfo.CommandType}', WorkflowSteps: '{transactionInfo.WorkflowSteps.Count}' Workflow 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                var privillegeTypes = new Dictionary<string, string>();
                var requestSystemID = "";
                BearerToken? bearerToken = null;
                var token = request.AccessToken;
                try
                {
                    var isBypassAuthorizeIP = false;
                    if (string.IsNullOrWhiteSpace(ModuleConfiguration.BypassAuthorizeIP.FirstOrDefault(p => p == "*")) == false)
                    {
                        isBypassAuthorizeIP = true;
                    }
                    else
                    {
                        foreach (var ip in ModuleConfiguration.BypassAuthorizeIP)
                        {
                            if (request.Interface.SourceIP.IndexOf(ip) > -1)
                            {
                                isBypassAuthorizeIP = true;
                                break;
                            }
                        }
                    }

                    if (GlobalConfiguration.IsPermissionRoles == true && isBypassAuthorizeIP == false)
                    {
                        var isAuthorized = false;
                        var permissionRoles = GlobalConfiguration.PermissionRoles.Where(x => x.ModuleID == "transact");
                        if (permissionRoles.Any() == true)
                        {
                            var queryID = $"/{request.System.ProgramID}/{request.Transaction.BusinessID}/{request.Transaction.TransactionID}";

                            var publicRoles = permissionRoles.Where(x => x.RoleID == "Public");
                            for (var i = 0; i < publicRoles.Count(); i++)
                            {
                                var publicRole = publicRoles.ElementAt(i);
                                if (publicRole != null)
                                {
                                    var allowTransactionPattern = new Regex($"[\\/]{publicRole.ApplicationID}[\\/]{publicRole.ProjectID}[\\/]{publicRole.TransactionID}");
                                    isAuthorized = allowTransactionPattern.IsMatch(queryID);
                                    if (isAuthorized == true)
                                    {
                                        break;
                                    }
                                }
                            }

                            if (isAuthorized == false)
                            {
                                var member = HttpContext.Request.Cookies[$"{GlobalConfiguration.CookiePrefixName}.Member"];
                                if (!string.IsNullOrWhiteSpace(member) && TryReadCookieUserAccount(member, out var user))
                                {
                                    if (user != null)
                                    {
                                        var userRoles = user.ApplicationRoleID.SplitComma();
                                        if (userRoles.Any() == true)
                                        {
                                            foreach (var permissionRole in permissionRoles.Where(x => x.RoleID != "Public"))
                                            {
                                                var roles = permissionRole.RoleID.SplitComma();
                                                if (roles.Intersect(userRoles).Any() == true)
                                                {
                                                    var allowTransactionPattern = new Regex($"[\\/]{permissionRole.ApplicationID}[\\/]{permissionRole.ProjectID}[\\/]{permissionRole.TransactionID}");
                                                    isAuthorized = allowTransactionPattern.IsMatch(queryID);
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else
                        {
                            isAuthorized = true;
                        }

                        if (isAuthorized == false)
                        {
                            response.ExceptionText = "인증 자격 증명 확인 필요";
                            return Content(JsonConvert.SerializeObject(response), "application/json");
                        }
                    }

                    if (request.System.Routes.Count > 0)
                    {
                        var route = request.System.Routes[transactionRouteCount];
                        requestSystemID = route.SystemID;
                    }

                    // Referer 실행 경로가 Forbes 앱이고 요청 헤더에 Authorization가 있으면 인증 검증
                    UserAccount? userAccount = null;
                    if (refererPath.StartsWith(tenantAppRequestPath) == true)
                    {
                        var splits = refererPath.Replace(baseUrl, "").Split('/');
                        var userWorkID = splits.Length > 3 ? splits[2] : "";
                        var applicationID = splits.Length > 3 ? splits[3] : "";
                        if (!string.IsNullOrWhiteSpace(userWorkID) && !string.IsNullOrWhiteSpace(applicationID))
                        {
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true)
                            {
                                userAccount = HttpContext.Items["JwtAccount"] as UserAccount;
                            }
                        }
                    }

                    var isTransactionTokenOnly = transactionInfo.AuthorizeMethod?.Contains("TransactionTokenOnly") == true;
                    if (isTransactionTokenOnly == true)
                    {
                        var isTransactionTokenYN = false;
                        if (!string.IsNullOrWhiteSpace(request.Transaction.TransactionToken) && transactionInfo.TransactionTokens?.Contains(request.Transaction.TransactionToken) == true)
                        {
                            isTransactionTokenYN = true;
                        }

                        if (isTransactionTokenYN == false)
                        {
                            response.ExceptionText = "TransactionToken 확인 필요";
                            return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                        }
                    }
                    else if (string.IsNullOrWhiteSpace(token) && userAccount != null)
                    {
                        if (ModuleConfiguration.SystemID == requestSystemID && isBypassAuthorizeIP == true)
                        {
                        }
                        else if (transactionInfo.Authorize == true)
                        {
                            var isRoleYN = true;
                            if (transactionInfo.AuthorizeMethod == null || transactionInfo.AuthorizeMethod?.Contains("Role") == true)
                            {
                                if (transactionInfo.Roles != null && transactionInfo.Roles.Count > 0)
                                {
                                    isRoleYN = false;
                                    var transactionMinRoleValue = Role.User.GetRoleValue(transactionInfo.Roles, true);
                                    foreach (var userRole in userAccount.Roles)
                                    {
                                        if (Enum.TryParse<Role>(userRole, out var parsedUserRole) == true)
                                        {
                                            var userRoleValue = (int)parsedUserRole;
                                            if (userRoleValue <= transactionMinRoleValue)
                                            {
                                                isRoleYN = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            var isClaimYN = true;
                            if (transactionInfo.AuthorizeMethod == null || transactionInfo.AuthorizeMethod?.Contains("Policy") == true)
                            {
                                if (transactionInfo.Policys != null && transactionInfo.Policys.Count > 0)
                                {
                                    isClaimYN = false;
                                    foreach (var claim in userAccount.Claims)
                                    {
                                        if (transactionInfo.Policys.ContainsKey(claim.Key) == true)
                                        {
                                            var allowClaims = transactionInfo.Policys[claim.Key];
                                            if (allowClaims == null || allowClaims.IndexOf(claim.Value) > -1)
                                            {
                                                isClaimYN = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            var isTransactionTokenYN = false;
                            if (transactionInfo.AuthorizeMethod == null || transactionInfo.AuthorizeMethod?.Contains("TransactionToken") == true)
                            {
                                if (!string.IsNullOrWhiteSpace(request.Transaction.TransactionToken) && transactionInfo.TransactionTokens?.Contains(request.Transaction.TransactionToken) == true)
                                {
                                    isTransactionTokenYN = true;
                                }
                            }

                            if (isRoleYN == false && isClaimYN == false && isTransactionTokenYN == false)
                            {
                                response.ExceptionText = "앱 사용자 역할 또는 정책 권한 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }
                        }
                    }
                    else if (ModuleConfiguration.SystemID == requestSystemID && isBypassAuthorizeIP == true)
                    {
                        if (!string.IsNullOrWhiteSpace(token) && token.IndexOf(".") > -1 && !string.IsNullOrWhiteSpace(request.Transaction.OperatorID))
                        {
                            if (!TrySplitBearerToken(token, out _, out var encryptedToken, out var tokenHash))
                            {
                                response.ExceptionText = $"{request.Transaction.OperatorID}: BearerToken 정보 확인 필요.";
                                logger.Warning("[{LogCategory}] " + response.ExceptionText + $"Request JSON: {JsonConvert.SerializeObject(request)}", "Transaction/Execute");
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            var signature = string.IsNullOrWhiteSpace(tokenHash) == false ? (tokenHash == GlobalConfiguration.HostAccessID.ToSHA256() ? request.Transaction.OperatorID.PaddingRight(32) : "") : request.Transaction.OperatorID.PaddingRight(32);
                            if (!TryReadBearerToken(encryptedToken, signature, out bearerToken))
                            {
                                response.ExceptionText = $"{request.Transaction.OperatorID}: BearerToken 정보 확인 필요.";
                                logger.Warning("[{LogCategory}] " + response.ExceptionText + $"Request JSON: {JsonConvert.SerializeObject(request)}", "Transaction/Execute");
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }
                        }
                    }
                    else
                    {
                        if (ModuleConfiguration.SystemID != requestSystemID)
                        {
                            response.ExceptionText = $"SystemID: {requestSystemID} 확인 필요";
                            return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                        }
                        else if (string.IsNullOrWhiteSpace(token))
                        {
                            var moduleScheme = $"{GlobalConfiguration.CookiePrefixName}.{request.System.ModuleID}.AuthenticationScheme";
                            var isRoleYN = false;
                            if (refererPath.StartsWith(baseUrl) == true)
                            {
                                try
                                {
                                    var schemeProvider = HttpContext.RequestServices.GetRequiredService<IAuthenticationSchemeProvider>();
                                    var scheme = await schemeProvider.GetSchemeAsync(moduleScheme);
                                    if (scheme != null)
                                    {
                                        var authenticateResult = await HttpContext.AuthenticateAsync(moduleScheme);
                                        if (authenticateResult.Succeeded == true)
                                        {
                                            var principal = authenticateResult.Principal;
                                            if (principal?.Identity?.IsAuthenticated == true)
                                            {
                                                var roles = principal.FindFirst("Roles")?.Value;
                                                if (roles != null && transactionInfo.Roles != null && transactionInfo.Roles.Count > 0)
                                                {
                                                    var transactionMinRoleValue = Role.User.GetRoleValue(transactionInfo.Roles, true);
                                                    foreach (var userRole in roles.SplitComma())
                                                    {
                                                        if (Enum.TryParse<Role>(userRole, out var parsedUserRole) == true)
                                                        {
                                                            var userRoleValue = (int)parsedUserRole;
                                                            if (userRoleValue <= transactionMinRoleValue)
                                                            {
                                                                isRoleYN = true;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                catch
                                {
                                    isRoleYN = false;
                                }
                            }

                            if (isRoleYN == false && transactionInfo.AuthorizeMethod == null || transactionInfo.AuthorizeMethod?.Contains("TransactionToken") == true)
                            {
                                if (!string.IsNullOrWhiteSpace(request.Transaction.TransactionToken) && transactionInfo.TransactionTokens?.Contains(request.Transaction.TransactionToken) == true)
                                {
                                    isRoleYN = true;
                                }
                            }

                            if (isRoleYN == false && ModuleConfiguration.UseApiAuthorize == true && transactionInfo.Authorize == true)
                            {
                                response.ExceptionText = $"'{businessContract.ApplicationID}' 애플리케이션, '{businessContract.ProjectID}' 프로젝트 또는 {moduleScheme} 역할 권한 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }
                        }
                        else if (refererPath.StartsWith(tenantAppRequestPath) == false && ModuleConfiguration.UseApiAuthorize == true)
                        {
                            if (!TrySplitBearerToken(token, out var userID, out var encryptedToken, out var tokenHash))
                            {
                                response.ExceptionText = "BearerToken 기본 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            if (userID != request.Transaction.OperatorID)
                            {
                                response.ExceptionText = "BearerToken 사용자 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            var signature = string.IsNullOrWhiteSpace(tokenHash) == false ? (tokenHash == GlobalConfiguration.HostAccessID.ToSHA256() ? request.Transaction.OperatorID.PaddingRight(32) : "") : request.Transaction.OperatorID.PaddingRight(32);
                            if (!TryReadBearerToken(encryptedToken, signature, out bearerToken))
                            {
                                response.ExceptionText = $"{request.Transaction.OperatorID}: BearerToken 정보가 훼손되거나 확인 할 수 없습니다. 다시 로그인 해야 합니다.";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            if (bearerToken == null)
                            {
                                response.ExceptionText = "BearerToken 정보 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            if (transactionInfo.Authorize == true)
                            {
                                var isRoleYN = true;
                                if (transactionInfo.AuthorizeMethod == null || transactionInfo.AuthorizeMethod?.Contains("Role") == true)
                                {
                                    if (transactionInfo.Roles != null && transactionInfo.Roles.Count > 0)
                                    {
                                        isRoleYN = false;
                                        var transactionMinRoleValue = Role.User.GetRoleValue(transactionInfo.Roles, true);
                                        foreach (var userRole in bearerToken.Policy.Roles)
                                        {
                                            if (Enum.TryParse<Role>(userRole, out var parsedUserRole) == true)
                                            {
                                                var userRoleValue = (int)parsedUserRole;
                                                if (userRoleValue <= transactionMinRoleValue)
                                                {
                                                    isRoleYN = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }

                                var isClaimYN = true;
                                if (transactionInfo.AuthorizeMethod == null || transactionInfo.AuthorizeMethod?.Contains("Policy") == true)
                                {
                                    if (transactionInfo.Policys != null && transactionInfo.Policys.Count > 0)
                                    {
                                        isClaimYN = false;
                                        foreach (var claim in bearerToken.Policy.Claims)
                                        {
                                            if (transactionInfo.Policys.ContainsKey(claim.Key) == true)
                                            {
                                                var allowClaims = transactionInfo.Policys[claim.Key];
                                                if (allowClaims == null || allowClaims.IndexOf(claim.Value) > -1)
                                                {
                                                    isClaimYN = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }

                                var isTransactionTokenYN = false;
                                if (transactionInfo.AuthorizeMethod == null || transactionInfo.AuthorizeMethod?.Contains("TransactionToken") == true)
                                {
                                    if (!string.IsNullOrWhiteSpace(request.Transaction.TransactionToken) && transactionInfo.TransactionTokens?.Contains(request.Transaction.TransactionToken) == true)
                                    {
                                        isTransactionTokenYN = true;
                                    }
                                }

                                if (isRoleYN == false && isClaimYN == false && isTransactionTokenYN == false)
                                {
                                    response.ExceptionText = "BearerToken 역할 또는 정책 권한 확인 필요";
                                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                }
                            }
                        }
                        else
                        {
                            if (!string.IsNullOrWhiteSpace(token))
                            {
                                if (token.IndexOf(".") > -1)
                                {
                                    if (!TrySplitBearerToken(token, out var userID, out var encryptedToken, out var tokenHash))
                                    {
                                        response.ExceptionText = "BearerToken 기본 무결성 확인 필요";
                                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                    }

                                    var signature = string.IsNullOrWhiteSpace(tokenHash) == false ? (tokenHash == GlobalConfiguration.HostAccessID.ToSHA256() ? userID.PaddingRight(32) : "") : userID.PaddingRight(32);
                                    if (!TryReadBearerToken(encryptedToken, signature, out bearerToken))
                                    {
                                        response.ExceptionText = $"{userID}: BearerToken 정보가 훼손되거나 확인 할 수 없습니다.";
                                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                    }
                                }
                            }
                        }
                    }

                    // PrivillegeDatabaseDDL, PrivillegeDatabaseDML, PrivillegeDatabaseDCL, PrivillegePermissionEXE, PrivillegeFeatureRUN
                    var privillegeKeys = new List<string>();
                    var claims = new Dictionary<string, string>();
                    if (userAccount != null)
                    {
                        if (userAccount.Claims.ContainsKey("PrivillegeKeys") == true)
                        {
                            privillegeKeys = userAccount.Claims["PrivillegeKeys"].SplitAndTrim(',');
                            claims = userAccount.Claims;
                        }
                    }
                    else if (bearerToken != null)
                    {
                        if (bearerToken.Policy.Claims.ContainsKey("PrivillegeKeys") == true)
                        {
                            privillegeKeys = bearerToken.Policy.Claims["PrivillegeKeys"].SplitAndTrim(',');
                            claims = bearerToken.Policy.Claims;
                        }
                    }

                    foreach (var privillegeKey in privillegeKeys)
                    {
                        if (claims.ContainsKey(privillegeKey))
                        {
                            privillegeTypes.Add(privillegeKey, claims[privillegeKey]);
                        }
                    }
                }
                catch (Exception exception)
                {
                    response.ExceptionText = $"인증 또는 권한 확인 오류 - {exception.ToMessage()}";
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                if (bearerToken != null)
                {
                    if (ModuleConfiguration.HasTrustedCheckIP == true)
                    {
                        var clientIP = HttpContext.GetRemoteIpAddress(bearerToken.ClientIP, ModuleConfiguration.TrustedProxyIP).ToStringSafe();
                        var verifyTokenID = bearerToken.Policy.VerifyTokenID;
                        if (string.IsNullOrWhiteSpace(verifyTokenID))
                        {
                            if (bearerToken.ClientIP != clientIP)
                            {
                                response.ExceptionText = $"거래 액세스 토큰 IP 유효성 오류";
                                return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                            }
                        }
                        else
                        {
                            bearerToken.Policy.VerifyTokenID = "";
                            if (verifyTokenID == JsonConvert.SerializeObject(bearerToken).ToSHA256() && bearerToken.ClientIP == clientIP)
                            {
                                bearerToken.Policy.VerifyTokenID = verifyTokenID;
                            }
                            else
                            {
                                response.ExceptionText = $"거래 액세스 토큰 유효성 오류";
                                return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                            }
                        }
                    }

                    if (bearerToken.ExpiredAt != null && bearerToken.ExpiredAt < DateTime.UtcNow)
                    {
                        response.ExceptionText = $"거래 액세스 토큰 유효기간 만료";
                        return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                    }
                }

                request.Transaction.CommandType = transactionInfo.CommandType;
                response.Transaction.CommandType = transactionInfo.CommandType;

                var workflowResult = await ExecuteWorkflowAsync(request, businessContract, transactionInfo, new List<string>(), bearerToken);
                if (workflowResult.Success == false)
                {
                    response.ExceptionText = workflowResult.ExceptionText;
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                response.Message.ResponseStatus = "N";
                response.Message.MainCode = nameof(MessageCode.T200);
                response.Message.MainText = MessageCode.T200;
                response.ResponseID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, request.Environment, DateTime.Now.ToString("yyyyMMddHHmmddsss"));
                response.Acknowledge = AcknowledgeType.Success;

                var returnType = string.IsNullOrWhiteSpace(transactionInfo.ReturnType) ? "Json" : transactionInfo.ReturnType;
                if (System.Enum.TryParse<ExecuteDynamicTypeObject>(returnType, out var executeDynamicTypeObject) == false)
                {
                    executeDynamicTypeObject = ExecuteDynamicTypeObject.Json;
                }

                response.Result.ResponseType = ((int)executeDynamicTypeObject).ToString();
                response.Result.DataSet = workflowResult.DataSet;
                response.Result.DataSetMeta = workflowResult.ResultMeta.Count > 0
                    ? workflowResult.ResultMeta
                    : workflowResult.DataSet.Select(item => item.FieldID).ToList();

                response.Result.DataMapCount.Clear();
                foreach (var dataMapItem in response.Result.DataSet)
                {
                    var value = JTokenFromObject(dataMapItem.Value);
                    response.Result.DataMapCount.Add(value.Type == JTokenType.Array ? value.Count() : 1);
                    if (request.Transaction.CompressionYN.ParseBool() == true && (value is JObject || value is JArray))
                    {
                        dataMapItem.Value = LZStringHelper.CompressToBase64(JsonConvert.SerializeObject(value));
                    }
                }

                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] Workflow 실행 오류", "Workflow/Execute", request.Transaction.GlobalID);
            }

            return LoggingAndReturn(response, transactionWorkID, "N", null);
        }

        private ActionResult LoggingAndReturn(TransactionResponse response, string transactionWorkID, string acknowledge, TransactionInfo? transactionInfo)
        {
            if (ModuleConfiguration.IsTransactionLogging == true || (transactionInfo != null && transactionInfo.TransactionLog == true))
            {
                loggerClient.TransactionResponseLogging(response, transactionWorkID, acknowledge, (string error) =>
                {
                    logger.Information("[{LogCategory}] [{GlobalID}] " + $"fallback error: {error}, Response JSON: {JsonConvert.SerializeObject(response)}", "Workflow/Execute", response.Transaction.GlobalID);
                });
            }

            return Content(JsonConvert.SerializeObject(response), "application/json");
        }

        private static Dictionary<string, JToken> CreateStepValues(List<DataMapItem> dataSet, WorkflowStep step)
        {
            var values = FlattenDataMapItems(dataSet);
            if (step.OutputMappings.Count == 0)
            {
                return values;
            }

            foreach (var mapping in step.OutputMappings)
            {
                var targetFieldID = string.IsNullOrWhiteSpace(mapping.TargetFieldID) ? mapping.SourceFieldID : mapping.TargetFieldID;
                if (TryGetValue(values, mapping.SourceFieldID, out var sourceValue) == true)
                {
                    AddFlattenedValue(values, targetFieldID, sourceValue);
                }
                else if (mapping.DefaultValue != null)
                {
                    AddFlattenedValue(values, targetFieldID, JToken.FromObject(mapping.DefaultValue));
                }
                else if (mapping.Required == true)
                {
                    throw new System.InvalidOperationException($"SourceFieldID '{mapping.SourceFieldID}' 출력 매핑 확인 필요");
                }
            }

            return values;
        }

        private static Dictionary<string, JToken> FlattenDataMapItems(List<DataMapItem> dataMapItems)
        {
            var values = new Dictionary<string, JToken>(System.StringComparer.OrdinalIgnoreCase);
            foreach (var item in dataMapItems)
            {
                if (string.IsNullOrWhiteSpace(item.FieldID))
                {
                    continue;
                }

                AddFlattenedValue(values, item.FieldID, JTokenFromObject(item.Value));
            }

            return values;
        }

        private static void AddFlattenedValue(Dictionary<string, JToken> values, string fieldID, JToken value)
        {
            if (string.IsNullOrWhiteSpace(fieldID))
            {
                return;
            }

            values[fieldID] = value;
            if (value is JObject jObject)
            {
                foreach (var property in jObject.Properties())
                {
                    values[property.Name] = property.Value;
                    values[$"{fieldID}.{property.Name}"] = property.Value;
                }
            }
            else if (value is JArray jArray && jArray.First is JObject firstObject)
            {
                foreach (var property in firstObject.Properties())
                {
                    values[property.Name] = property.Value;
                    values[$"{fieldID}.{property.Name}"] = property.Value;
                }
            }
        }

        private static bool TryGetValue(Dictionary<string, JToken> values, string fieldID, out JToken value)
        {
            value = JValue.CreateNull();
            if (string.IsNullOrWhiteSpace(fieldID))
            {
                return false;
            }

            return values.TryGetValue(fieldID, out value!);
        }

        private static JToken JTokenFromObject(object? value)
        {
            if (value == null)
            {
                return JValue.CreateNull();
            }

            if (value is JToken token)
            {
                return token;
            }

            return JToken.FromObject(value);
        }

        private static bool EvaluateWorkflowAssertions(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStep step, WorkflowStepResult stepResult, out string exceptionText)
        {
            exceptionText = "";
            if (step.Assertions.Count == 0)
            {
                return true;
            }

            var hasThrowsAssertion = step.Assertions.Any(item => item.Assert.ToStringSafe().Equals("Throws", StringComparison.OrdinalIgnoreCase));
            foreach (var assertion in step.Assertions)
            {
                if (EvaluateWorkflowAssertion(requestValues, stepValues, stepResult, assertion, out var assertionExceptionText) == false)
                {
                    exceptionText = string.IsNullOrWhiteSpace(assertion.Message) == false ? assertion.Message : assertionExceptionText;
                    return false;
                }
            }

            if (stepResult.Success == false && hasThrowsAssertion == true)
            {
                stepResult.Success = true;
                stepResult.ExceptionText = "";
                stepResult.ExceptionType = "";
            }

            return true;
        }

        private static bool EvaluateWorkflowAssertion(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStepResult stepResult, WorkflowAssertion assertion, out string exceptionText)
        {
            exceptionText = "";
            var assertName = assertion.Assert.ToStringSafe();
            if (string.IsNullOrWhiteSpace(assertName) == true)
            {
                exceptionText = "Assert 확인 필요";
                return false;
            }

            switch (assertName.ToUpperInvariant())
            {
                case "EQUAL":
                    return CompareAssertionValues(requestValues, stepValues, stepResult, assertion.Expected, assertion.Actual, JToken.DeepEquals, "Equal", out exceptionText);
                case "NOTEQUAL":
                    return CompareAssertionValues(requestValues, stepValues, stepResult, assertion.Expected, assertion.Actual, (expected, actual) => JToken.DeepEquals(expected, actual) == false, "NotEqual", out exceptionText);
                case "TRUE":
                    return EvaluateSingleValueAssertion(requestValues, stepValues, stepResult, assertion.Value, value => TryGetBoolean(value, out var booleanValue) == true && booleanValue == true, "True", out exceptionText);
                case "FALSE":
                    return EvaluateSingleValueAssertion(requestValues, stepValues, stepResult, assertion.Value, value => TryGetBoolean(value, out var booleanValue) == true && booleanValue == false, "False", out exceptionText);
                case "NULL":
                    return EvaluateSingleValueAssertion(requestValues, stepValues, stepResult, assertion.Value, IsNullToken, "Null", out exceptionText);
                case "NOTNULL":
                    return EvaluateSingleValueAssertion(requestValues, stepValues, stepResult, assertion.Value, value => IsNullToken(value) == false, "NotNull", out exceptionText);
                case "CONTAINS":
                    return EvaluateCollectionAssertion(requestValues, stepValues, stepResult, assertion.Value, assertion.Collection, ContainsToken, "Contains", out exceptionText);
                case "DOESNOTCONTAIN":
                    return EvaluateCollectionAssertion(requestValues, stepValues, stepResult, assertion.Value, assertion.Collection, (value, collection) => ContainsToken(value, collection) == false, "DoesNotContain", out exceptionText);
                case "EMPTY":
                    return EvaluateSingleValueAssertion(requestValues, stepValues, stepResult, assertion.Collection, IsEmptyToken, "Empty", out exceptionText);
                case "NOTEMPTY":
                    return EvaluateSingleValueAssertion(requestValues, stepValues, stepResult, assertion.Collection, value => IsEmptyToken(value) == false, "NotEmpty", out exceptionText);
                case "SINGLE":
                    return EvaluateSingleValueAssertion(requestValues, stepValues, stepResult, assertion.Collection, IsSingleToken, "Single", out exceptionText);
                case "INRANGE":
                    return EvaluateInRangeAssertion(requestValues, stepValues, stepResult, assertion, out exceptionText);
                case "THROWS":
                    return EvaluateThrowsAssertion(stepResult, assertion, out exceptionText);
                case "ISTYPE":
                    return EvaluateIsTypeAssertion(requestValues, stepValues, stepResult, assertion, out exceptionText);
                case "SAME":
                    return EvaluateSameAssertion(requestValues, stepValues, stepResult, assertion, out exceptionText);
                default:
                    exceptionText = $"Assert '{assertName}' 확인 필요";
                    return false;
            }
        }

        private static bool CompareAssertionValues(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStepResult stepResult, WorkflowAssertionValue expectedValue, WorkflowAssertionValue actualValue, Func<JToken, JToken, bool> predicate, string assertName, out string exceptionText)
        {
            exceptionText = "";
            if (TryResolveAssertionValue(requestValues, stepValues, stepResult, expectedValue, out var expected, out exceptionText) == false ||
                TryResolveAssertionValue(requestValues, stepValues, stepResult, actualValue, out var actual, out exceptionText) == false)
            {
                return false;
            }

            if (predicate(expected, actual) == true)
            {
                return true;
            }

            exceptionText = $"{assertName} 검증 실패. expected: {expected}, actual: {actual}";
            return false;
        }

        private static bool EvaluateSingleValueAssertion(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStepResult stepResult, WorkflowAssertionValue assertionValue, Func<JToken, bool> predicate, string assertName, out string exceptionText)
        {
            exceptionText = "";
            if (TryResolveAssertionValue(requestValues, stepValues, stepResult, assertionValue, out var value, out exceptionText) == false)
            {
                return false;
            }

            if (predicate(value) == true)
            {
                return true;
            }

            exceptionText = $"{assertName} 검증 실패. value: {value}";
            return false;
        }

        private static bool EvaluateCollectionAssertion(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStepResult stepResult, WorkflowAssertionValue itemValue, WorkflowAssertionValue collectionValue, Func<JToken, JToken, bool> predicate, string assertName, out string exceptionText)
        {
            exceptionText = "";
            if (TryResolveAssertionValue(requestValues, stepValues, stepResult, itemValue, out var value, out exceptionText) == false ||
                TryResolveAssertionValue(requestValues, stepValues, stepResult, collectionValue, out var collection, out exceptionText) == false)
            {
                return false;
            }

            if (predicate(value, collection) == true)
            {
                return true;
            }

            exceptionText = $"{assertName} 검증 실패. value: {value}, collection: {collection}";
            return false;
        }

        private static bool EvaluateInRangeAssertion(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStepResult stepResult, WorkflowAssertion assertion, out string exceptionText)
        {
            exceptionText = "";
            if (TryResolveAssertionValue(requestValues, stepValues, stepResult, assertion.Value, out var value, out exceptionText) == false ||
                TryResolveAssertionValue(requestValues, stepValues, stepResult, assertion.Min, out var min, out exceptionText) == false ||
                TryResolveAssertionValue(requestValues, stepValues, stepResult, assertion.Max, out var max, out exceptionText) == false)
            {
                return false;
            }

            if (TryGetDecimal(value, out var decimalValue) == true && TryGetDecimal(min, out var decimalMin) == true && TryGetDecimal(max, out var decimalMax) == true)
            {
                if (decimalValue >= decimalMin && decimalValue <= decimalMax)
                {
                    return true;
                }
            }
            else if (TryGetDateTime(value, out var dateValue) == true && TryGetDateTime(min, out var dateMin) == true && TryGetDateTime(max, out var dateMax) == true)
            {
                if (dateValue >= dateMin && dateValue <= dateMax)
                {
                    return true;
                }
            }

            exceptionText = $"InRange 검증 실패. value: {value}, min: {min}, max: {max}";
            return false;
        }

        private static bool EvaluateThrowsAssertion(WorkflowStepResult stepResult, WorkflowAssertion assertion, out string exceptionText)
        {
            exceptionText = "";
            if (stepResult.Success == true || string.IsNullOrWhiteSpace(stepResult.ExceptionText) == true)
            {
                exceptionText = "Throws 검증 실패. 예외가 발생하지 않았습니다";
                return false;
            }

            if (string.IsNullOrWhiteSpace(assertion.ExceptionType) == false &&
                stepResult.ExceptionType.Contains(assertion.ExceptionType, StringComparison.OrdinalIgnoreCase) == false &&
                stepResult.ExceptionText.Contains(assertion.ExceptionType, StringComparison.OrdinalIgnoreCase) == false)
            {
                exceptionText = $"Throws 검증 실패. exceptionType: {assertion.ExceptionType}, actual: {stepResult.ExceptionType}";
                return false;
            }

            return true;
        }

        private static bool EvaluateIsTypeAssertion(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStepResult stepResult, WorkflowAssertion assertion, out string exceptionText)
        {
            exceptionText = "";
            if (TryResolveAssertionValue(requestValues, stepValues, stepResult, assertion.Value, out var value, out exceptionText) == false)
            {
                return false;
            }

            var expectedTypeName = assertion.TypeName.ToStringSafe();
            if (string.IsNullOrWhiteSpace(expectedTypeName) == true)
            {
                exceptionText = "TypeName 확인 필요";
                return false;
            }

            if (IsTokenType(value, expectedTypeName) == true)
            {
                return true;
            }

            exceptionText = $"IsType 검증 실패. typeName: {expectedTypeName}, actual: {value.Type}";
            return false;
        }

        private static bool EvaluateSameAssertion(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStepResult stepResult, WorkflowAssertion assertion, out string exceptionText)
        {
            exceptionText = "";
            if (TryResolveAssertionValue(requestValues, stepValues, stepResult, assertion.Expected, out var expected, out exceptionText) == false ||
                TryResolveAssertionValue(requestValues, stepValues, stepResult, assertion.Actual, out var actual, out exceptionText) == false)
            {
                return false;
            }

            if (ReferenceEquals(expected, actual) == true)
            {
                return true;
            }

            exceptionText = "Same 검증 실패";
            return false;
        }

        private static bool TryResolveAssertionValue(Dictionary<string, JToken> requestValues, Dictionary<string, Dictionary<string, JToken>> stepValues, WorkflowStepResult stepResult, WorkflowAssertionValue assertionValue, out JToken value, out string exceptionText)
        {
            value = JValue.CreateNull();
            exceptionText = "";

            var source = assertionValue.Source.ToStringSafe();
            var fieldID = assertionValue.FieldID.ToStringSafe();
            if (fieldID.Length > 0 && (string.IsNullOrWhiteSpace(source) == true || source.Equals("Literal", StringComparison.OrdinalIgnoreCase) == true) && assertionValue.Value == null)
            {
                source = "Step";
            }

            if (string.IsNullOrWhiteSpace(source) == true || source.Equals("Literal", StringComparison.OrdinalIgnoreCase) == true)
            {
                value = JTokenFromObject(assertionValue.Value);
                return true;
            }

            Dictionary<string, JToken>? sourceValues = null;
            if (source.Equals("Request", StringComparison.OrdinalIgnoreCase) == true)
            {
                sourceValues = requestValues;
            }
            else if (source.Equals("Step", StringComparison.OrdinalIgnoreCase) == true)
            {
                if (string.IsNullOrWhiteSpace(assertionValue.SourceStepID) == true)
                {
                    sourceValues = stepResult.Values;
                }
                else
                {
                    stepValues.TryGetValue(assertionValue.SourceStepID, out sourceValues);
                }
            }
            else
            {
                exceptionText = $"Source '{source}' 확인 필요";
                return false;
            }

            if (sourceValues != null && TryGetValue(sourceValues, fieldID, out value) == true)
            {
                return true;
            }

            exceptionText = $"FieldID '{fieldID}' 검증 값 확인 필요";
            return false;
        }

        private static bool IsNullToken(JToken value)
        {
            return value.Type == JTokenType.Null || value.Type == JTokenType.Undefined;
        }

        private static bool IsEmptyToken(JToken value)
        {
            return value.Type switch
            {
                JTokenType.Array => !value.Any(),
                JTokenType.Object => !value.Children<JProperty>().Any(),
                JTokenType.String => value.ToString().Length == 0,
                _ => false
            };
        }

        private static bool IsSingleToken(JToken value)
        {
            return value.Type switch
            {
                JTokenType.Array => value.Count() == 1,
                JTokenType.Object => value.Children<JProperty>().Count() == 1,
                JTokenType.String => value.ToString().Length == 1,
                _ => false
            };
        }

        private static bool ContainsToken(JToken value, JToken collection)
        {
            if (collection.Type == JTokenType.String)
            {
                return collection.ToString().Contains(value.ToString(), StringComparison.Ordinal);
            }

            if (collection is JArray array)
            {
                return array.Any(item => JToken.DeepEquals(item, value));
            }

            if (collection is JObject jObject)
            {
                return jObject.Properties().Any(item => item.Name.Equals(value.ToString(), StringComparison.OrdinalIgnoreCase) || JToken.DeepEquals(item.Value, value));
            }

            return false;
        }

        private static bool TryGetBoolean(JToken value, out bool result)
        {
            result = false;
            if (value.Type == JTokenType.Boolean)
            {
                result = value.Value<bool>();
                return true;
            }

            return bool.TryParse(value.ToString(), out result);
        }

        private static bool TryGetDecimal(JToken value, out decimal result)
        {
            result = 0;
            return decimal.TryParse(value.ToString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out result);
        }

        private static bool TryGetDateTime(JToken value, out DateTime result)
        {
            result = default;
            return DateTime.TryParse(value.ToString(), System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out result);
        }

        private static bool IsTokenType(JToken value, string typeName)
        {
            return typeName.ToUpperInvariant() switch
            {
                "STRING" => value.Type == JTokenType.String,
                "INTEGER" => value.Type == JTokenType.Integer,
                "INT" => value.Type == JTokenType.Integer,
                "FLOAT" => value.Type == JTokenType.Float,
                "NUMBER" => value.Type == JTokenType.Integer || value.Type == JTokenType.Float,
                "BOOLEAN" => value.Type == JTokenType.Boolean,
                "BOOL" => value.Type == JTokenType.Boolean,
                "OBJECT" => value.Type == JTokenType.Object,
                "ARRAY" => value.Type == JTokenType.Array,
                "NULL" => IsNullToken(value),
                _ => value.Type.ToString().Equals(typeName, StringComparison.OrdinalIgnoreCase)
            };
        }

        private static bool TryDeserializeDataMapItems(string json, out List<DataMapItem> items)
        {
            items = new List<DataMapItem>();
            try
            {
                items = JsonConvert.DeserializeObject<List<DataMapItem>>(json) ?? new List<DataMapItem>();
                return true;
            }
            catch
            {
                return false;
            }
        }

        private async Task<WorkflowRunResult> ExecuteWorkflowAsync(TransactionRequest request, BusinessContract businessContract, TransactionInfo workflowInfo, List<string> workflowPath, BearerToken? bearerToken)
        {
            var result = new WorkflowRunResult();
            var workflowApplicationID = string.IsNullOrWhiteSpace(businessContract.TransactionApplicationID) ? businessContract.ApplicationID : businessContract.TransactionApplicationID;
            var workflowProjectID = string.IsNullOrWhiteSpace(businessContract.TransactionProjectID) ? businessContract.ProjectID : businessContract.TransactionProjectID;
            var workflowKey = $"{workflowApplicationID}|{workflowProjectID}|{businessContract.TransactionID}|{workflowInfo.ServiceID}";
            if (workflowPath.Contains(workflowKey, StringComparer.OrdinalIgnoreCase) == true)
            {
                result.ExceptionText = $"Workflow 순환 호출 확인 필요: {string.Join(" -> ", workflowPath)} -> {workflowKey}";
                return result;
            }

            workflowPath.Add(workflowKey);
            try
            {
                var workflowSteps = workflowInfo.WorkflowSteps;
                if (workflowSteps.Count == 0)
                {
                    result.ExceptionText = $"'{workflowKey}' WorkflowSteps 확인 필요";
                    return result;
                }

                var currentPayLoad = ClonePayLoad(request.PayLoad);
                var requestValues = FlattenDataMapItems(currentPayLoad.DataMapSet.SelectMany(item => item).ToList());
                var stepValues = new Dictionary<string, Dictionary<string, JToken>>(System.StringComparer.OrdinalIgnoreCase);
                for (var i = 0; i < workflowSteps.Count; i++)
                {
                    var step = workflowSteps[i];
                    if (string.IsNullOrWhiteSpace(step.StepID))
                    {
                        step.StepID = $"{step.CommandType}{(i + 1).ToString().PadLeft(2, '0')}";
                    }

                    WorkflowStepResult stepResult = new WorkflowStepResult();
                    TransactionRequest? executedStepRequest = null;
                    try
                    {
                        var applicationID = string.IsNullOrWhiteSpace(step.ApplicationID)
                            ? (businessContract.TransactionApplicationID.ToStringSafe() == "" ? businessContract.ApplicationID : businessContract.TransactionApplicationID.ToStringSafe())
                            : step.ApplicationID;
                        var projectID = string.IsNullOrWhiteSpace(step.TransactionProjectID) ? businessContract.ProjectID : step.TransactionProjectID;
                        var transactionID = string.IsNullOrWhiteSpace(step.TransactionID) ? businessContract.TransactionID : step.TransactionID;
                        var serviceID = string.IsNullOrWhiteSpace(step.ServiceID) ? workflowInfo.ServiceID : step.ServiceID;

                        BusinessContract? targetContract;
                        if (businessContract.ApplicationID == applicationID &&
                            businessContract.ProjectID == projectID &&
                            businessContract.TransactionID == transactionID)
                        {
                            targetContract = businessContract;
                        }
                        else
                        {
                            targetContract = TransactionMapper.GetBusinessContract(applicationID, projectID, transactionID);
                        }

                        if (targetContract == null)
                        {
                            stepResult.ExceptionText = $"ApplicationID '{applicationID}', ProjectID '{projectID}', TransactionID '{transactionID}' 계약 확인 필요";
                        }
                        else
                        {
                            if (string.IsNullOrWhiteSpace(targetContract.TransactionApplicationID))
                            {
                                targetContract.TransactionApplicationID = applicationID;
                            }

                            var targetInfo = targetContract.Services.FirstOrDefault(item => item.ServiceID == serviceID)?.DeepCopy();
                            if (targetInfo == null)
                            {
                                stepResult.ExceptionText = $"ServiceID '{serviceID}' 거래 매핑 정보 확인 필요";
                            }
                            else
                            {
                                var commandType = string.IsNullOrWhiteSpace(step.CommandType) ? targetInfo.CommandType : step.CommandType;
                                commandType = commandType.ToStringSafe().ToUpperInvariant();
                                if (string.IsNullOrWhiteSpace(commandType))
                                {
                                    stepResult.ExceptionText = $"StepID '{step.StepID}' CommandType 확인 필요";
                                }
                                else
                                {
                                    var stepRequestForRoute = CloneStepRequest(request, applicationID, projectID, transactionID, serviceID, commandType);
                                    stepRequestForRoute.PayLoad = ClonePayLoad(currentPayLoad);
                                    if (step.InputMappings.Count > 0)
                                    {
                                        var stepRequestValues = FlattenDataMapItems(stepRequestForRoute.PayLoad.DataMapSet.SelectMany(item => item).ToList());
                                        ApplyInputMappingsToPayLoad(stepRequestForRoute.PayLoad, step.InputMappings, stepRequestValues, stepValues);
                                    }

                                    executedStepRequest = stepRequestForRoute;
                                    if (commandType == "W")
                                    {
                                        var workflowResult = await ExecuteWorkflowAsync(stepRequestForRoute, targetContract, targetInfo, workflowPath, bearerToken);
                                        if (workflowResult.Success == false)
                                        {
                                            stepResult.ExceptionText = workflowResult.ExceptionText;
                                        }
                                        else
                                        {
                                            stepResult.Success = true;
                                            stepResult.DataSet = workflowResult.DataSet;
                                            stepResult.ResultMeta = workflowResult.ResultMeta;
                                            stepResult.Values = CreateStepValues(stepResult.DataSet, step);
                                        }
                                    }
                                    else
                                    {
                                        targetInfo.CommandType = commandType;
                                        targetInfo.ReturnType = string.IsNullOrWhiteSpace(step.ReturnType) ? targetInfo.ReturnType : step.ReturnType;
                                        targetInfo.ReturnType = string.IsNullOrWhiteSpace(targetInfo.ReturnType) ? "Json" : targetInfo.ReturnType;
                                        targetInfo.TransactionScope = step.TransactionScope ?? targetInfo.TransactionScope;

                                        var transactionObject = new TransactionObject();
                                        transactionObject.LoadOptions = stepRequestForRoute.LoadOptions == null ? new Dictionary<string, string>() : new Dictionary<string, string>(stepRequestForRoute.LoadOptions);
                                        transactionObject.RequestID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, stepRequestForRoute.Environment, stepRequestForRoute.Transaction.ScreenID, DateTime.Now.ToString("yyyyMMddHHmmddsss"));
                                        transactionObject.GlobalID = stepRequestForRoute.Transaction.GlobalID;
                                        transactionObject.TransactionID = string.Concat(
                                            string.IsNullOrWhiteSpace(targetContract.TransactionApplicationID) ? targetContract.ApplicationID : targetContract.TransactionApplicationID,
                                            "|",
                                            string.IsNullOrWhiteSpace(targetContract.TransactionProjectID) ? targetContract.ProjectID : targetContract.TransactionProjectID,
                                            "|",
                                            stepRequestForRoute.Transaction.TransactionID);
                                        transactionObject.ServiceID = stepRequestForRoute.Transaction.FunctionID;
                                        transactionObject.TransactionScope = targetInfo.TransactionScope;
                                        transactionObject.ReturnType = targetInfo.ReturnType;
                                        transactionObject.ClientTag = stepRequestForRoute.ClientTag;

                                        transactionObject.Inputs = CreateTransactionInputs(stepRequestForRoute.PayLoad, bearerToken);
                                        transactionObject.InputsItemCount = stepRequestForRoute.PayLoad.DataMapCount.Count > 0
                                            ? new List<int>(stepRequestForRoute.PayLoad.DataMapCount)
                                            : CreateDefaultDataMapCount(transactionObject.Inputs.Count);

                                        var inputContracts = targetInfo.Inputs;
                                        if (inputContracts.Count == 0)
                                        {
                                            inputContracts = new List<ModelInputContract>();
                                            if (transactionObject.InputsItemCount.Any(item => item > 0) == true)
                                            {
                                                for (var inputIndex = 0; inputIndex < transactionObject.InputsItemCount.Count; inputIndex++)
                                                {
                                                    inputContracts.Add(new ModelInputContract()
                                                    {
                                                        ModelID = "Dynamic",
                                                        Fields = new List<string>(),
                                                        Type = "Row",
                                                        BaseFieldMappings = new List<BaseFieldMapping>(),
                                                        ParameterHandling = "Rejected"
                                                    });
                                                }
                                            }
                                        }

                                        var outputContracts = step.ServiceOutputs.Count > 0 ? step.ServiceOutputs : targetInfo.Outputs;
                                        var applicationResponse = await transactClient.RequestDataTransactionAsync(stepRequestForRoute, targetInfo, transactionObject, inputContracts, outputContracts);
                                        if (!string.IsNullOrWhiteSpace(applicationResponse.ExceptionText))
                                        {
                                            stepResult.ExceptionText = applicationResponse.ExceptionText;
                                        }
                                        else
                                        {
                                            var dataSet = new List<DataMapItem>();
                                            switch (targetInfo.ReturnType)
                                            {
                                                case "Scalar":
                                                    dataSet.Add(new DataMapItem() { FieldID = "Scalar", Value = applicationResponse.ResultObject });
                                                    break;
                                                case "NonQuery":
                                                    dataSet.Add(new DataMapItem() { FieldID = "RowsAffected", Value = applicationResponse.ResultInteger });
                                                    break;
                                                case "Xml":
                                                    dataSet.Add(new DataMapItem() { FieldID = "Xml", Value = applicationResponse.ResultObject });
                                                    break;
                                                default:
                                                    if (string.IsNullOrWhiteSpace(applicationResponse.ResultJson) == false)
                                                    {
                                                        var token = JToken.Parse(applicationResponse.ResultJson);
                                                        if (token is JArray array)
                                                        {
                                                            foreach (var arrayItem in array)
                                                            {
                                                                if (arrayItem is not JObject itemObject)
                                                                {
                                                                    dataSet.Add(new DataMapItem() { FieldID = "Result", Value = arrayItem });
                                                                }
                                                                else
                                                                {
                                                                    var fieldID = itemObject["id"] ?? itemObject["ID"] ?? itemObject["fieldID"] ?? itemObject["FieldID"];
                                                                    var value = itemObject["value"] ?? itemObject["Value"];

                                                                    dataSet.Add(new DataMapItem()
                                                                    {
                                                                        FieldID = fieldID.ToStringSafe(),
                                                                        Value = value
                                                                    });
                                                                }
                                                            }
                                                        }
                                                        else
                                                        {
                                                            dataSet.Add(new DataMapItem() { FieldID = "Result", Value = token });
                                                        }
                                                    }
                                                    break;
                                            }

                                            stepResult.Success = true;
                                            stepResult.DataSet = dataSet;
                                            stepResult.ResultMeta = applicationResponse.ResultMeta;
                                            stepResult.Values = CreateStepValues(stepResult.DataSet, step);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        stepResult.ExceptionText = exception.ToMessage();
                        stepResult.ExceptionType = exception.GetType().FullName ?? exception.GetType().Name;
                    }

                    if (EvaluateWorkflowAssertions(requestValues, stepValues, step, stepResult, out var assertionExceptionText) == false)
                    {
                        result.ExceptionText = $"StepID '{step.StepID}' Workflow 검증 오류 - {assertionExceptionText}";
                        return result;
                    }

                    if (stepResult.Success == false)
                    {
                        result.ExceptionText = $"StepID '{step.StepID}' Workflow 실행 오류 - {stepResult.ExceptionText}";
                        return result;
                    }

                    stepValues[step.StepID] = stepResult.Values;
                    if (executedStepRequest != null)
                    {
                        currentPayLoad = ClonePayLoad(executedStepRequest.PayLoad);
                    }

                    result.DataSet = stepResult.DataSet;
                    result.ResultMeta = stepResult.ResultMeta;
                    result.Values = stepResult.Values;
                }

                result.Success = true;
                return result;
            }
            finally
            {
                workflowPath.Remove(workflowKey);
            }
        }

        private static TransactionRequest CloneStepRequest(TransactionRequest request, string applicationID, string projectID, string transactionID, string serviceID, string commandType)
        {
            var stepRequest = JsonConvert.DeserializeObject<TransactionRequest>(JsonConvert.SerializeObject(request));
            if (stepRequest == null)
            {
                throw new InvalidOperationException("Workflow 단계 요청 생성 오류");
            }

            stepRequest.System.ProgramID = applicationID;
            stepRequest.Transaction.BusinessID = projectID;
            stepRequest.Transaction.TransactionID = transactionID;
            stepRequest.Transaction.FunctionID = serviceID;
            stepRequest.Transaction.CommandType = commandType;
            stepRequest.Transaction.ScreenID = string.IsNullOrWhiteSpace(stepRequest.Transaction.ScreenID) ? transactionID : stepRequest.Transaction.ScreenID;
            return stepRequest;
        }

        private static PayLoadType ClonePayLoad(PayLoadType payLoad)
        {
            var clone = JsonConvert.DeserializeObject<PayLoadType>(JsonConvert.SerializeObject(payLoad)) ?? new PayLoadType();
            clone.DataMapCount ??= new List<int>();
            clone.DataMapSet ??= new List<List<DataMapItem>>();
            clone.DataMapSetRaw ??= new List<string>();
            return clone;
        }

        private static void ApplyInputMappingsToPayLoad(PayLoadType payLoad, List<WorkflowFieldMapping> inputMappings, Dictionary<string, JToken> payLoadValues, Dictionary<string, Dictionary<string, JToken>> stepValues)
        {
            foreach (var mapping in inputMappings)
            {
                var targetInputIndex = mapping.TargetInputIndex < 0 ? 0 : mapping.TargetInputIndex;
                var value = ResolveInputMappingValue(mapping, payLoadValues, stepValues);
                var targetFieldID = string.IsNullOrWhiteSpace(mapping.TargetFieldID) ? mapping.SourceFieldID : mapping.TargetFieldID;

                SetPayLoadValue(payLoad, targetInputIndex, targetFieldID, value);
                AddFlattenedValue(payLoadValues, targetFieldID, JTokenFromObject(value));
            }
        }

        private static object? ResolveInputMappingValue(WorkflowFieldMapping mapping, Dictionary<string, JToken> payLoadValues, Dictionary<string, Dictionary<string, JToken>> stepValues)
        {
            var hasMappingValue = false;
            JToken value = JValue.CreateNull();
            if (mapping.DefaultValue != null && string.IsNullOrWhiteSpace(mapping.SourceFieldID))
            {
                value = JToken.FromObject(mapping.DefaultValue);
                hasMappingValue = true;
            }
            else
            {
                Dictionary<string, JToken>? sourceValues = null;
                var source = mapping.Source.ToStringSafe();
                if (source.Equals("Step", System.StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(mapping.SourceStepID) == false)
                {
                    if (string.IsNullOrWhiteSpace(mapping.SourceStepID) == false)
                    {
                        stepValues.TryGetValue(mapping.SourceStepID, out sourceValues);
                    }
                }
                else
                {
                    sourceValues = payLoadValues;
                }

                if (sourceValues != null && TryGetValue(sourceValues, mapping.SourceFieldID, out value) == true)
                {
                    hasMappingValue = true;
                }
                else if (mapping.DefaultValue != null)
                {
                    value = JToken.FromObject(mapping.DefaultValue);
                    hasMappingValue = true;
                }
            }

            if (hasMappingValue == false)
            {
                if (mapping.Required == true)
                {
                    throw new InvalidOperationException($"SourceFieldID '{mapping.SourceFieldID}' 입력 매핑 확인 필요");
                }

                value = JTokenFromObject("");
            }

            return ToDataMapValue(value);
        }

        private static object? ToDataMapValue(JToken value)
        {
            if (value.Type == JTokenType.Null || value.Type == JTokenType.Undefined)
            {
                return null;
            }

            if (value is JValue jValue)
            {
                return jValue.Value;
            }

            return value;
        }

        private static void SetPayLoadValue(PayLoadType payLoad, int targetInputIndex, string fieldID, object? value)
        {
            while (payLoad.DataMapSet.Count <= targetInputIndex)
            {
                payLoad.DataMapSet.Add(new List<DataMapItem>());
            }

            while (payLoad.DataMapCount.Count <= targetInputIndex)
            {
                payLoad.DataMapCount.Add(0);
            }

            var inputItems = payLoad.DataMapSet[targetInputIndex];
            var item = inputItems.FirstOrDefault(item => item.FieldID.ToStringSafe().Equals(fieldID, StringComparison.OrdinalIgnoreCase));
            if (item == null)
            {
                inputItems.Add(new DataMapItem()
                {
                    FieldID = fieldID,
                    Value = value
                });
            }
            else
            {
                item.Value = value;
            }

            payLoad.DataMapCount[targetInputIndex] = Math.Max(payLoad.DataMapCount[targetInputIndex], 1);
        }

        private static List<List<TransactField>> CreateTransactionInputs(PayLoadType payLoad, BearerToken? bearerToken)
        {
            var result = new List<List<TransactField>>();
            foreach (var inputItems in payLoad.DataMapSet)
            {
                var fields = new List<TransactField>();
                foreach (var item in inputItems)
                {
                    fields.Add(new TransactField()
                    {
                        FieldID = item.FieldID,
                        Length = -1,
                        DataType = "String",
                        Value = item.Value
                    });
                }

                AddBearerFields(fields, bearerToken);
                result.Add(fields);
            }

            return result;
        }

        private static void AddBearerFields(List<TransactField> fields, BearerToken? bearerToken)
        {
            var bearerFields = bearerToken == null ? null : bearerToken.Variable as JObject;
            if (bearerFields == null)
            {
                return;
            }

            foreach (var item in bearerFields)
            {
                var fieldID = "$" + item.Key;
                if (fields.Any(p => p.FieldID == fieldID) == true)
                {
                    fields.RemoveAll(p => p.FieldID == fieldID);
                }

                var jToken = item.Value;
                if (jToken == null)
                {
                    throw new InvalidOperationException($"{fieldID} Bearer 필드 확인 필요");
                }

                object? fieldValue = null;
                if (jToken is JValue)
                {
                    fieldValue = jToken.ToObject<string>();
                }
                else if (jToken is JObject)
                {
                    fieldValue = jToken.ToString();
                }
                else if (jToken is JArray)
                {
                    fieldValue = jToken.ToArray();
                }

                if (fieldValue != null && fieldValue.ToString() == "[DbNull]")
                {
                    fieldValue = null;
                }

                fields.Add(new TransactField()
                {
                    FieldID = fieldID,
                    Length = -1,
                    DataType = "String",
                    Value = fieldValue
                });
            }
        }

        private bool TryReadCookieUserAccount(string member, out UserAccount? userAccount)
        {
            userAccount = null;
            if (string.IsNullOrWhiteSpace(member))
            {
                return false;
            }

            try
            {
                userAccount = JsonConvert.DeserializeObject<UserAccount>(member.DecodeBase64());
                return userAccount != null;
            }
            catch (Exception exception)
            {
                logger.Warning(exception, "[{LogCategory}] Member 쿠키 역직렬화 오류", "Transaction/Execute");
                return false;
            }
        }

        private bool TrySplitBearerToken(string token, out string userID, out string encryptedToken, out string tokenHash)
        {
            userID = "";
            encryptedToken = "";
            tokenHash = "";

            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }

            var tokenArray = token.Split('.');
            if (tokenArray.Length < 2 || string.IsNullOrWhiteSpace(tokenArray[1]))
            {
                return false;
            }

            try
            {
                userID = tokenArray[0].DecodeBase64();
            }
            catch (Exception exception)
            {
                logger.Warning(exception, "[{LogCategory}] BearerToken 사용자 정보 디코딩 오류", "Workflow/Execute");
                return false;
            }

            if (string.IsNullOrWhiteSpace(userID))
            {
                return false;
            }

            encryptedToken = tokenArray[1];
            tokenHash = tokenArray.Length > 2 ? tokenArray[2] : "";
            return true;
        }

        private bool TryReadBearerToken(string encryptedToken, string signature, out BearerToken? bearerToken)
        {
            bearerToken = null;
            if (string.IsNullOrWhiteSpace(encryptedToken))
            {
                return false;
            }

            try
            {
                bearerToken = JsonConvert.DeserializeObject<BearerToken>(encryptedToken.DecryptAES(signature));
                return bearerToken != null;
            }
            catch (Exception exception)
            {
                logger.Warning(exception, "[{LogCategory}] BearerToken 역직렬화 오류", "Workflow/Execute");
                return false;
            }
        }

        private static List<int> CreateDefaultDataMapCount(int inputCount)
        {
            return inputCount == 0 ? new List<int>() : new List<int>() { inputCount };
        }

    }
}
