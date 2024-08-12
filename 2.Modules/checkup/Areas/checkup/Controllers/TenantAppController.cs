using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using checkup.Entity;
using checkup.Extensions;
using checkup.Services;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.Helper;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;
using HandStack.Web.Modules;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

using Serilog;

using Sqids;

namespace checkup.Areas.checkup.Controllers
{
    [Area("checkup")]
    [Route("[area]/api/[controller]")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [ApiController]
    public class TenantAppController : ControllerBase
    {
        private readonly object balanceLock = new object();

        private ILogger logger { get; }

        private IWebHostEnvironment environment { get; }

        private readonly ISequentialIdGenerator sequentialIdGenerator;

        private readonly IMemoryCache memoryCache;

        private readonly IOptions<CorsOptions> corsOptions;

        private readonly SqidsEncoder<int> sqids;

        private readonly SqidsEncoder<int> tenantSqids;

        private readonly ModuleApiClient moduleApiClient;

        private readonly IUserAccountService userTokenService;

        private readonly IJwtManager jwtManager;

        private readonly MediatorClient mediatorClient;

        private string appDbConnectionString = "";

        public TenantAppController(MediatorClient mediatorClient, ILogger logger, IMemoryCache memoryCache, IWebHostEnvironment environment, ISequentialIdGenerator sequentialIdGenerator, SqidsEncoder<int> sqids, IOptions<CorsOptions> corsOptions, ModuleApiClient moduleApiClient, IJwtManager jwtManager, IUserAccountService userTokenService)
        {
            this.mediatorClient = mediatorClient;
            this.logger = logger;
            this.memoryCache = memoryCache;
            this.environment = environment;
            this.sequentialIdGenerator = sequentialIdGenerator;
            this.sqids = sqids;
            this.tenantSqids = new SqidsEncoder<int>(new()
            {
                Alphabet = "abcdefghijklmnopqrstuvwxyz1234567890",
                MinLength = 8,
            });
            this.corsOptions = corsOptions;
            this.moduleApiClient = moduleApiClient;
            this.jwtManager = jwtManager;
            this.userTokenService = userTokenService;

            appDbConnectionString = "URI=file:{appBasePath}/.managed/sqlite/app.db;Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;";
        }

        public class QueryParams
        {
            public Dictionary<string, string> KeyValues { get; set; } = new Dictionary<string, string>();
        }

        // http://localhost:8000/checkup/api/tenant-app/direct?commandID=HDS|JWT|JWT010|AD01&KeyValues[UserAccountID]=08db77a3cba70039ca91a82878021905
        [HttpGet("[action]")]
        public async Task<ActionResult> Direct(string commandID, [FromQuery] QueryParams? queryParams)
        {
            string? remoteClientIP = HttpContext.GetRemoteIpAddress();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey && User.Identity != null && User.Identity.IsAuthenticated == true)
            {
                List<ServiceParameter>? serviceParameters = null;
                if (queryParams != null)
                {
                    serviceParameters = new List<ServiceParameter>();
                    foreach (var item in queryParams.KeyValues)
                    {
                        serviceParameters.Add(item.Key, item.Value);
                    }
                }

                var transactionResult = await moduleApiClient.TransactionDirect(commandID, serviceParameters);

                // response?["FormData0"]["KeyColumn"] == null
                // var repositoryItems = response?["FormData0"]?.ToObject<RepositoryItems>();
                // var repositorys = response?["GridData0"]?.ToObject<List<Repository>>();
                // var formData = JsonConvert.DeserializeObject<DataTable>($"[{response?["FormData0"]}]");
                return Ok(transactionResult);
            }

            return NotFound();
        }

        // http://localhost:8000/checkup/api/tenant-app/authenticate?applicationID=helloworld&accountSignNo=7D2937949D90795F7FFC1EE4938893F8
        [HttpGet("[action]")]
        public async Task<ActionResult> Authenticate(string userWorkID, string applicationID, string accountSignNo)
        {
            AuthenticateResponse result = new AuthenticateResponse();

            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
            DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
            if (directoryInfo.Exists == true)
            {
                string tenantID = $"{userWorkID}|{applicationID}";
                string settingFilePath = Path.Combine(appBasePath, "settings.json");
                if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                {
                    string appSettingText = await System.IO.File.ReadAllTextAsync(settingFilePath);
                    var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                    if (appSetting != null && string.IsNullOrEmpty(appSetting.SignInID) == false)
                    {
                        List<ServiceParameter> serviceParameters = new List<ServiceParameter>();
                        serviceParameters.Add("AccountSignNo", accountSignNo);
                        var transactionAccount = await moduleApiClient.TransactionDirect($"{applicationID}|{appSetting.SignInID}", serviceParameters);

                        if (transactionAccount != null)
                        {
                            if (transactionAccount.ContainsKey("HasException") == true)
                            {
                                string message = (transactionAccount?["HasException"]?["ErrorMessage"]).ToStringSafe();
                                logger.Error("[{LogCategory}] " + $"ErrorMessage: {message}", "UserAccountService/Authenticate");
                                result.ErrorMessage = $"Forbes 앱 SignInID: {appSetting.SignInID} 확인 필요 {message}";
                                return Ok(result);
                            }
                            else
                            {
                                var member = transactionAccount["FormData0"];
                                if (member == null || (member["IsAccount"]?.ToStringSafe() == "0") == true)
                                {
                                    result.ErrorMessage = $"Forbes 앱 '{accountSignNo}' 사용자 계정 인증 코드 만료";
                                    return Ok(result);
                                }
                                else
                                {
                                    var tokenResult = userTokenService.CreateUserInformation(transactionAccount?["FormData0"]);
                                    if (tokenResult == null || tokenResult.Item1 == null)
                                    {
                                        result.ErrorMessage = $"Forbes 앱 사용자 정보 확인 필요";
                                        return Ok(result);
                                    }

                                    UserAccount userAccount = tokenResult.Item1;
                                    userAccount.ApplicationID = applicationID;
                                    userAccount.UserAccountID = Guid.NewGuid().ToString("N");

                                    var claims = tokenResult.Item2;

                                    string clientIP = HttpContext.GetRemoteIpAddress().ToStringSafe();
                                    // member에서 UserNo, UserID, UserName, Email, Roles를 제외한 추가 정보
                                    var excludeColumnNames = new string[] { "UserNo", "UserID", "UserName", "Email", "Roles" };
                                    var memberColumns = transactionAccount?["FormData0"]?.Value<JObject>()?.Properties().Select(p => p.Name).ToList();
                                    Dictionary<string, string> dictionary = new Dictionary<string, string>();
                                    dictionary.Add("ClientIP", clientIP);

                                    if (memberColumns != null)
                                    {
                                        foreach (var item in memberColumns)
                                        {
                                            if (excludeColumnNames.Contains(item) == false)
                                            {
                                                dictionary.Add(item, member[item].ToStringSafe());
                                            }
                                        }
                                    }

                                    var variable = JObject.FromObject(dictionary);
                                    variable.Add("InstallType", GlobalConfiguration.InstallType);

                                    var jwtToken = await jwtManager.GenerateJwtToken(userAccount);
                                    var refreshToken = jwtManager.GenerateRefreshToken(clientIP);

                                    Dictionary<string, JToken>? transactionResult = null;

                                    serviceParameters = new List<ServiceParameter>();
                                    serviceParameters.Add("UserAccountID", userAccount.UserAccountID);
                                    serviceParameters.Add("ApplicationID", applicationID);
                                    serviceParameters.Add("UserID", userAccount.UserID);
                                    serviceParameters.Add("UserName", userAccount.UserName);
                                    serviceParameters.Add("Email", userAccount.Email);
                                    serviceParameters.Add("Celluar", userAccount.Celluar);
                                    serviceParameters.Add("PositionName", userAccount.PositionName);
                                    serviceParameters.Add("DepartmentName", userAccount.DepartmentName);
                                    serviceParameters.Add("CompanyName", userAccount.CompanyName);
                                    serviceParameters.Add("BirthDate", userAccount.BirthDate);
                                    serviceParameters.Add("Address", userAccount.Address);
                                    serviceParameters.Add("Gender", userAccount.Gender);
                                    serviceParameters.Add("IPAddress", clientIP);
                                    serviceParameters.Add("Roles", JsonConvert.SerializeObject(userAccount.Roles));
                                    serviceParameters.Add("Claims", JsonConvert.SerializeObject(userAccount.Claims));
                                    serviceParameters.Add("ExtendOption", userAccount.ExtendOption);
                                    serviceParameters.Add("CreatedMemberNo", userAccount.UserNo);
                                    transactionResult = await moduleApiClient.TransactionDirect($"HDS|JWT|JWT010|ID01", serviceParameters);
                                    if (transactionResult?.ContainsKey("HasException") == true)
                                    {
                                        string message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                                        result.ErrorMessage = $"Forbes 앱 사용자 계정 추가 실패 {message}";
                                        logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: {result.ErrorMessage}", "UserAccountService/Authenticate");
                                        return Ok(result);
                                    }

                                    serviceParameters = new List<ServiceParameter>();
                                    serviceParameters.Add("UserAccountID", userAccount.UserAccountID);
                                    serviceParameters.Add("Token", refreshToken.Token);
                                    serviceParameters.Add("ExpiredAt", refreshToken.ExpiredAt.ToString("yyyy-MM-dd HH:mm:ss.fff"));
                                    serviceParameters.Add("CreatedAt", refreshToken.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss.fff"));
                                    serviceParameters.Add("CreatedByIP", refreshToken.CreatedByIP);
                                    transactionResult = await moduleApiClient.TransactionDirect($"HDS|JWT|JWT010|ID02", serviceParameters);
                                    if (transactionResult?.ContainsKey("HasException") == true)
                                    {
                                        string message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                                        result.ErrorMessage = $"Forbes 앱 사용자 RefreshToken 추가 실패 {message}";
                                        logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: {result.ErrorMessage}", "UserAccountService/Authenticate");
                                        return Ok(result);
                                    }

                                    await userTokenService.RemoveOldRefreshTokens(userAccount);

                                    result.UserAccountID = userAccount.UserAccountID;
                                    result.AccessToken = jwtToken.ToStringSafe();
                                    result.RefreshToken = refreshToken.Token;

                                    var cookieOptions = GetCookieOptions(userAccount);
                                    BearerToken bearerToken = CreateBearerToken(userAccount, claims, variable, cookieOptions.Expires);

                                    WriteCookie($"{applicationID}.RefreshToken", refreshToken.Token, cookieOptions);
                                    WriteCookie($"{applicationID}.TokenID", bearerToken.TokenID, cookieOptions);
                                    WriteCookie($"{applicationID}.Member", JsonConvert.SerializeObject(userAccount).EncodeBase64(), cookieOptions);
                                    WriteCookie($"{applicationID}.Variable", JsonConvert.SerializeObject(variable).EncodeBase64(), cookieOptions);
                                    WriteCookie($"{applicationID}.BearerToken", userAccount.UserID.EncodeBase64() + "." + JsonConvert.SerializeObject(bearerToken).EncryptAES(userAccount.UserID.PadRight(32, ' ')), cookieOptions);
                                }
                            }
                        }
                        else
                        {
                            result.ErrorMessage = $"Forbes 앱 SignInID 실행 확인 필요";
                        }
                    }
                    else
                    {
                        result.ErrorMessage = $"Forbes 앱 SignInID 확인 필요";
                    }
                }
                else
                {
                    result.ErrorMessage = $"Forbes 앱 설정 확인 필요";
                }
            }
            else
            {
                result.ErrorMessage = $"필수 요청 항목 확인 필요";
            }

            return Ok(result);
        }

        // http://localhost:8000/checkup/api/tenant-app/refresh-token?applicationID=helloworld&refreshToken=2E14205609C886A98C7F057ED41F3058DEC87B2C7D0E9B2C9F139A695035D93869E33A4D3F028EAD1632E83479ED5BC935EDBEBEF21706ED74A5626E24D06F15
        [HttpGet("[action]")]
        public async Task<ActionResult> RefreshToken(string applicationID, string? refreshToken)
        {
            AuthenticateResponse result = new AuthenticateResponse();
            var cookieRefreshToken = Request.Cookies[$"{applicationID}.RefreshToken"];
            if (string.IsNullOrEmpty(cookieRefreshToken) == false)
            {
                refreshToken = cookieRefreshToken;
            }

            if (string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(refreshToken) == false)
            {
                string ipAddress = HttpContext.GetRemoteIpAddress().ToStringSafe();
                var userTokenResult = await userTokenService.GetUserResultByRefreshToken(refreshToken);
                var tupleResult = userTokenService.CreateUserInformation(userTokenResult);
                if (userTokenResult != null && tupleResult != null)
                {
                    var userAccount = tupleResult.Item1;
                    if (userAccount == null)
                    {
                        result.ErrorMessage = $"유효하지 않은 토큰";
                        return Ok(result);
                    }

                    var claims = tupleResult.Item2;
                    List<ServiceParameter> serviceParameters = new List<ServiceParameter>();
                    serviceParameters.Add("RefreshToken", refreshToken);
                    var transactionResult = await moduleApiClient.TransactionDirect("HDS|JWT|JWT010|GD03", serviceParameters);
                    if (transactionResult?.ContainsKey("HasException") == true)
                    {
                        string message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                        result.ErrorMessage = $"RefreshToken로 토큰 정보 조회 실패 {message}";
                        logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: {result.ErrorMessage}", "UserAccountService/RefreshToken");
                    }
                    else
                    {
                        var userRefreshToken = transactionResult?["FormData0"]?.ToObject<RefreshToken>();
                        if (userRefreshToken != null)
                        {
                            if (userRefreshToken.IsRevoked == true)
                            {
                                await userTokenService.RevokeDescendantRefreshTokens(userRefreshToken, userAccount, ipAddress);
                            }

                            if (userRefreshToken.IsActive == false)
                            {
                                result.ErrorMessage = $"유효하지 않은 토큰";
                                return Ok(result);
                            }

                            var newRefreshToken = await userTokenService.RotateRefreshToken(userRefreshToken, ipAddress);
                            if (newRefreshToken != null)
                            {
                                serviceParameters = new List<ServiceParameter>();
                                serviceParameters.Add("UserAccountID", userAccount.UserAccountID);
                                serviceParameters.Add("Token", newRefreshToken.Token);
                                serviceParameters.Add("ExpiredAt", newRefreshToken.ExpiredAt.ToString("yyyy-MM-dd HH:mm:ss.fff"));
                                serviceParameters.Add("CreatedAt", newRefreshToken.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss.fff"));
                                serviceParameters.Add("CreatedByIP", newRefreshToken.CreatedByIP);
                                transactionResult = await moduleApiClient.TransactionDirect($"HDS|JWT|JWT010|ID02", serviceParameters);
                                if (transactionResult?.ContainsKey("HasException") == true)
                                {
                                    string message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                                    result.ErrorMessage = $"Forbes 앱 사용자 기존 RefreshToken 정보 교체 추가 실패 {message}";
                                    logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: {result.ErrorMessage}", "UserAccountService/RefreshToken");
                                    return Ok(result);
                                }

                                await userTokenService.RemoveOldRefreshTokens(userAccount);

                                var jwtToken = await jwtManager.GenerateJwtToken(userAccount);

                                result.UserAccountID = userAccount.UserAccountID.ToStringSafe();
                                result.AccessToken = jwtToken.ToStringSafe();
                                result.RefreshToken = newRefreshToken.Token;

                                // member에서 UserNo, UserID, UserName, Email, Roles를 제외한 추가 정보
                                var excludeColumnNames = new string[] { "UserNo", "UserID", "UserName", "Email", "Roles" };
                                var memberColumns = userTokenResult?.Value<JObject>()?.Properties().Select(p => p.Name).ToList();
                                Dictionary<string, string> dictionary = new Dictionary<string, string>();
                                dictionary.Add("ClientIP", ipAddress);

                                if (memberColumns != null)
                                {
                                    foreach (var item in memberColumns)
                                    {
                                        if (excludeColumnNames.Contains(item) == false)
                                        {
                                            if (userTokenResult != null)
                                            {
                                                dictionary.Add(item, userTokenResult[item].ToStringSafe());
                                            }
                                        }
                                    }
                                }

                                var variable = JObject.FromObject(dictionary);
                                variable.Add("InstallType", GlobalConfiguration.InstallType);

                                var cookieOptions = GetCookieOptions(userAccount);
                                BearerToken bearerToken = CreateBearerToken(userAccount, claims, variable, cookieOptions.Expires);

                                WriteCookie($"{applicationID}.RefreshToken", newRefreshToken.Token, cookieOptions);
                                WriteCookie($"{applicationID}.TokenID", bearerToken.TokenID, cookieOptions);
                                WriteCookie($"{applicationID}.Member", JsonConvert.SerializeObject(userAccount).EncodeBase64(), cookieOptions);
                                WriteCookie($"{applicationID}.Variable", JsonConvert.SerializeObject(variable).EncodeBase64(), cookieOptions);
                                WriteCookie($"{applicationID}.BearerToken", userAccount.UserID.EncodeBase64() + "." + JsonConvert.SerializeObject(bearerToken).EncryptAES(userAccount.UserID.PadRight(32, ' ')), cookieOptions);
                            }
                        }
                        else
                        {
                            result.ErrorMessage = $"RefreshToken로 토큰 정보 조회 실행 확인 필요";
                        }
                    }
                }
                else
                {
                    result.ErrorMessage = $"유효하지 않은 토큰";
                }
            }
            else
            {
                result.ErrorMessage = $"필수 요청 항목 확인 필요";
            }

            return Ok(result);
        }

        // http://localhost:8000/checkup/api/tenant-app/get?applicationID=helloworld&userAccountID=0AD3C1E514A749F78F7D3088AAB53A61
        [HttpGet("[action]")]
        public async Task<ActionResult> Get(string? applicationID, string userAccountID)
        {
            UserAccount? result = null;
            if (string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(userAccountID) == false)
            {
                var userTokenResult = await userTokenService.GetUserAccountByID(applicationID, userAccountID);
                var tupleResult = userTokenService.CreateUserInformation(userTokenResult);
                if (userTokenResult != null && tupleResult != null)
                {
                    result = tupleResult.Item1;
                }
            }

            return Ok(result);
        }

        // http://localhost:8000/checkup/api/tenant-app/revoke-token?applicationID=helloworld&refreshToken=2E14205609C886A98C7F057ED41F3058DEC87B2C7D0E9B2C9F139A695035D93869E33A4D3F028EAD1632E83479ED5BC935EDBEBEF21706ED74A5626E24D06F15
        [HttpGet("[action]")]
        public async Task<ActionResult> RevokeToken(string? applicationID, string? refreshToken)
        {
            string result = "";
            var cookieRefreshToken = Request.Cookies[$"{applicationID}.RefreshToken"];
            if (string.IsNullOrEmpty(cookieRefreshToken) == false)
            {
                refreshToken = cookieRefreshToken;
            }

            if (string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(refreshToken) == false)
            {
                var userTokenResult = await userTokenService.GetUserResultByRefreshToken(refreshToken);
                var tupleResult = userTokenService.CreateUserInformation(userTokenResult);
                if (userTokenResult != null && tupleResult != null)
                {
                    var userAccount = tupleResult.Item1;
                    if (userAccount == null)
                    {
                        result = $"유효하지 않은 토큰";
                        return Ok(result);
                    }

                    List<ServiceParameter> serviceParameters = new List<ServiceParameter>();
                    serviceParameters.Add("RefreshToken", refreshToken);
                    var transactionResult = await moduleApiClient.TransactionDirect("HDS|JWT|JWT010|GD03", serviceParameters);
                    if (transactionResult?.ContainsKey("HasException") == true)
                    {
                        string message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                        result = $"RefreshToken로 토큰 정보 조회 실패 {message}";
                        logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: {result}", "UserAccountService/RefreshToken");
                    }
                    else
                    {
                        var userRefreshToken = transactionResult?["FormData0"]?.ToObject<RefreshToken>();
                        if (userRefreshToken != null)
                        {
                            await userTokenService.RevokeToken(userRefreshToken, HttpContext.GetRemoteIpAddress().ToStringSafe());
                        }
                    }
                }
                else
                {
                    result = $"유효하지 않은 토큰";
                }
            }
            else
            {
                result = $"필수 요청 항목 확인 필요";
            }

            return Ok(result);
        }

        private BearerToken CreateBearerToken(UserAccount userAccount, List<Claim>? claims, JObject? variable, DateTimeOffset? dateTimeOffset)
        {
            BearerToken result = new BearerToken();

            var guid = sequentialIdGenerator.NewId();
            DateTime now = DateTime.Now;
            result.TokenID = $"{GlobalConfiguration.RunningEnvironment}|{GlobalConfiguration.HostName}|{GlobalConfiguration.SystemID}|{GlobalConfiguration.ApplicationID}|{guid.ToString("N")}";
            result.IssuerName = GlobalConfiguration.SystemID;
            result.ClientIP = HttpContext.GetRemoteIpAddress().ToStringSafe();
            result.CreatedAt = now;

            if (dateTimeOffset != null)
            {
                result.ExpiredAt = ((DateTimeOffset)dateTimeOffset).DateTime;
            }

            result.Policy = new Policy();
            result.Policy.UserID = userAccount.UserID;
            result.Policy.UserName = userAccount.UserName;
            result.Policy.Email = userAccount.Email;

            foreach (var item in userAccount.Roles)
            {
                result.Policy.Roles.Add(item.ToString());
            }

            result.Policy.Claims = new Dictionary<string, string>();
            if (claims != null)
            {
                foreach (var claim in claims)
                {
                    result.Policy.Claims.Add(claim.Type, claim.Value);
                }
            }

            result.Variable = variable;

            result.Policy.VerifyTokenID = JsonConvert.SerializeObject(result).ToSHA256();
            return result;
        }

        private CookieOptions GetCookieOptions(UserAccount userAccount)
        {
            CookieOptions cookieOptions = new CookieOptions();
            cookieOptions.HttpOnly = false;
            cookieOptions.SameSite = SameSiteMode.Lax;

            if (GlobalConfiguration.UserSignExpire > 0)
            {
                cookieOptions.Expires = DateTime.Now.AddMinutes(GlobalConfiguration.UserSignExpire);
            }
            else if (GlobalConfiguration.UserSignExpire < 0)
            {
                int addDay = DateTime.Now.Day == userAccount.LoginedAt.Day ? 1 : 0;
                cookieOptions.Expires = DateTime.Parse(DateTime.Now.AddDays(1).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00");
            }
            else
            {
                cookieOptions.Expires = DateTime.Now.AddDays(1);
            }

            return cookieOptions;
        }

        private void WriteCookie(string key, string value, CookieOptions? cookieOptions = null)
        {
            if (cookieOptions == null)
            {
                cookieOptions = new CookieOptions();
                cookieOptions.HttpOnly = false;
                cookieOptions.SameSite = SameSiteMode.Lax;
            }

            Response.Cookies.Append(key, value, cookieOptions);
        }

        private long ToFileLength(long fileLength)
        {
            long result = 0;
            if (fileLength < 0)
            {
                fileLength = 0;
            }

            if (fileLength < 1048576.0)
            {
                result = (fileLength / 1024);
            }
            else if (fileLength < 1073741824.0)
            {
                result = (fileLength / 1024) / 1024;
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/refresh-cors-origin-app?applicationID=helloworld&appSecret=1447a93fc5324512ad69e3bc9acac9c6
        [HttpGet("[action]")]
        public async Task<ActionResult> RefreshCorsOriginApp(string userWorkID, string applicationID, string appSecret)
        {
            ActionResult result = BadRequest();
            if (string.IsNullOrEmpty(userWorkID) == true || string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(appSecret) == true)
            {
                result = BadRequest();
            }
            else
            {
                string tenantID = $"{userWorkID}|{applicationID}";
                var corsPolicy = corsOptions.Value.GetPolicy(tenantID);
                try
                {
                    if (corsPolicy != null && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID)) == true)
                    {
                        string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                        DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                        if (directoryInfo.Exists == true)
                        {
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = await System.IO.File.ReadAllTextAsync(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null && appSetting.ApplicationID == applicationID && appSetting.AppSecret == appSecret)
                                {
                                    var withOriginUris = appSetting.WithOrigin;

                                    corsPolicy.Origins.Clear();
                                    if (withOriginUris != null)
                                    {
                                        foreach (var withOriginUri in withOriginUris)
                                        {
                                            corsPolicy.Origins.Add(withOriginUri);
                                        }
                                    }

                                    result = Ok();
                                }
                            }
                        }
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Warning("[{LogCategory}] " + exceptionText, "TenantAppController/RefreshCorsOriginApp");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/refresh-origin-app?applicationID=helloworld&appSecret=1447a93fc5324512ad69e3bc9acac9c6
        [HttpGet("[action]")]
        public async Task<ActionResult> RefreshOriginApp(string userWorkID, string applicationID, string appSecret)
        {
            ActionResult result = BadRequest();
            if (string.IsNullOrEmpty(userWorkID) == true || string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(appSecret) == true)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    string tenantID = $"{userWorkID}|{applicationID}";
                    if (ModuleConfiguration.TenantAppOrigins.ContainsKey(tenantID) == true)
                    {
                        ModuleConfiguration.TenantAppOrigins.Remove(tenantID);
                    }

                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    if (Directory.Exists(appBasePath) == true)
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                        if (directoryInfo.Exists == true)
                        {
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = await System.IO.File.ReadAllTextAsync(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null && appSetting.ApplicationID == applicationID && appSetting.AppSecret == appSecret)
                                {
                                    var withOriginUris = appSetting.WithOrigin;
                                    if (withOriginUris != null)
                                    {
                                        ModuleConfiguration.TenantAppOrigins.Add(tenantID, withOriginUris);
                                    }
                                }
                            }
                        }
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Warning("[{LogCategory}] " + exceptionText, "TenantAppController/RefreshOriginApp");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/refresh-referer-app?applicationID=helloworld&appSecret=1447a93fc5324512ad69e3bc9acac9c6
        [HttpGet("[action]")]
        public async Task<ActionResult> RefreshRefererApp(string userWorkID, string applicationID, string appSecret)
        {
            ActionResult result = BadRequest();
            if (string.IsNullOrEmpty(userWorkID) == true || string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(appSecret) == true)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    string tenantID = $"{userWorkID}|{applicationID}";
                    if (ModuleConfiguration.TenantAppReferers.ContainsKey(tenantID) == true)
                    {
                        ModuleConfiguration.TenantAppReferers.Remove(tenantID);
                    }

                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    if (Directory.Exists(appBasePath) == true)
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                        if (directoryInfo.Exists == true)
                        {
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = await System.IO.File.ReadAllTextAsync(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null && appSetting.ApplicationID == applicationID && appSetting.AppSecret == appSecret)
                                {
                                    var withRefererUris = appSetting.WithReferer;
                                    if (withRefererUris != null)
                                    {
                                        ModuleConfiguration.TenantAppReferers.Add(tenantID, withRefererUris);
                                    }
                                }
                            }
                        }
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Warning("[{LogCategory}] " + exceptionText, "TenantAppController/RefreshRefererApp");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/definition-bundling?applicationID=16f0edaab65f4cd2b4c9d77c07fc64e5&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult DefinitionBundling(string accessKey, string userWorkID, string applicationID)
        {
            ActionResult result = BadRequest();

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
            {
                ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == "wwwroot");
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (module != null && Directory.Exists(appBasePath) == true)
                {
                    string tenantID = $"{userWorkID}|{applicationID}";
                    string environmentFilePath = Path.Combine(appBasePath, "wwwroot", "app.environment.json");
                    if (System.IO.File.Exists(environmentFilePath) == true || GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == true)
                    {
                        string appEnvironmentText = System.IO.File.ReadAllText(environmentFilePath);
                        var environmentSetting = JsonConvert.DeserializeObject<EnvironmentSetting>(appEnvironmentText);
                        if (environmentSetting != null)
                        {
                            string fileType = string.Empty;
                            string errorText = string.Empty;
                            string appAssetsPath = Path.Combine(appBasePath, "wwwroot", "assets");
                            string phisycalTargetFilePath = Path.Combine(appAssetsPath, "app.bundle.js");

                            try
                            {
                                string webRootPath = Path.Combine(module.BasePath, "wwwroot");
                                List<string> phisycalSourceFilePaths = new List<string>();

                                List<string> definitionScripts = environmentSetting.Definition.Scripts.Concat(environmentSetting.Definition.Controls).ToList();
                                for (int i = 0; i < definitionScripts.Count; i++)
                                {
                                    string sourceFile = definitionScripts[i];

                                    List<string> phisycalFilePaths = new List<string>();
                                    phisycalFilePaths.Add(webRootPath);
                                    phisycalFilePaths.AddRange(sourceFile.Split("/"));

                                    string phisycalSourceFilePath = Path.Combine(phisycalFilePaths.ToArray());
                                    if (phisycalSourceFilePath.IndexOf("http") == -1 && System.IO.File.Exists(phisycalSourceFilePath) == true)
                                    {
                                        phisycalSourceFilePaths.Add(phisycalSourceFilePath);
                                    }
                                }

                                FileInfo targetFileInfo = new FileInfo(phisycalTargetFilePath);
                                if (targetFileInfo.Directory?.Exists == false)
                                {
                                    Directory.CreateDirectory(targetFileInfo.Directory.FullName);
                                }

                                fileType = "js";
                                bool bundleResult = BundleFileProcess(webRootPath, fileType, phisycalSourceFilePaths, phisycalTargetFilePath);
                                if (bundleResult == false)
                                {
                                    var bundleFile = new
                                    {
                                        fileType = fileType,
                                        inputFileNames = phisycalSourceFilePaths,
                                        outputFileName = phisycalTargetFilePath
                                    };

                                    string base64BundleFile = JsonConvert.SerializeObject(bundleFile).EncodeBase64();
                                    logger.Error("[{LogCategory}] " + $"applicationID: {applicationID}, bundle: {base64BundleFile}", "TenantAppController/DefinitionBundling");
                                }

                                phisycalTargetFilePath = Path.Combine(appAssetsPath, "app.bundle.css");
                                phisycalSourceFilePaths.Clear();
                                definitionScripts = environmentSetting.Definition.Styles;
                                for (int i = 0; i < definitionScripts.Count; i++)
                                {
                                    string sourceFile = definitionScripts[i];

                                    List<string> phisycalFilePaths = new List<string>();
                                    phisycalFilePaths.Add(webRootPath);
                                    phisycalFilePaths.AddRange(sourceFile.Split("/"));

                                    string phisycalSourceFilePath = Path.Combine(phisycalFilePaths.ToArray());
                                    if (phisycalSourceFilePath.IndexOf("http") == -1 && System.IO.File.Exists(phisycalSourceFilePath) == true)
                                    {
                                        phisycalSourceFilePaths.Add(phisycalSourceFilePath);
                                    }
                                }

                                targetFileInfo = new FileInfo(phisycalTargetFilePath);
                                if (targetFileInfo.Directory?.Exists == false)
                                {
                                    Directory.CreateDirectory(targetFileInfo.Directory.FullName);
                                }

                                fileType = "css";
                                bundleResult = BundleFileProcess(webRootPath, fileType, phisycalSourceFilePaths, phisycalTargetFilePath);
                                if (bundleResult == false)
                                {
                                    var bundleFile = new
                                    {
                                        fileType = fileType,
                                        inputFileNames = phisycalSourceFilePaths,
                                        outputFileName = phisycalTargetFilePath
                                    };

                                    string base64BundleFile = JsonConvert.SerializeObject(bundleFile).EncodeBase64();
                                    logger.Error("[{LogCategory}] " + $"applicationID: {applicationID}, bundle: {base64BundleFile}", "TenantAppController/DefinitionBundling");
                                }

                                string phisycalBundleFilePath = Path.Combine(appAssetsPath, "app.bundle.json");
                                if (System.IO.File.Exists(phisycalBundleFilePath) == true)
                                {
                                    System.IO.File.Delete(phisycalBundleFilePath);
                                }

                                result = Ok();
                            }
                            catch (Exception exception)
                            {
                                errorText = $"exception: {exception.GetAllMessages()}";
                                logger.Error(exception, "[{LogCategory}] " + errorText, "TenantAppController/DefinitionBundling");
                            }
                        }
                    }
                }
            }

            return result;
        }

        private bool BundleFileProcess(string webRootPath, string fileType, List<string> inputFileNames, string outputFileName)
        {
            bool result = false;
            try
            {
                string bundlerFilePath = Path.Combine(GlobalConfiguration.BatchProgramBasePath, "bundling", (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? "bundling.exe" : "bundling"));
                if (System.IO.File.Exists(bundlerFilePath) == false)
                {
                    return result;
                }

                var bundleFile = new
                {
                    fileType = fileType,
                    inputFileNames = inputFileNames,
                    outputFileName = outputFileName
                };

                string base64BundleFile = JsonConvert.SerializeObject(bundleFile).EncodeBase64();
                var executeResult = CommandHelper.RunScript($"{bundlerFilePath} {base64BundleFile}");

                string minifyFilePath = outputFileName.Replace("." + fileType, ".min." + fileType);
                FileInfo targetFileInfo = new FileInfo(outputFileName);

                if (fileType == "js")
                {
                    _ = Task.Run(() =>
                    {
                        // https://github.com/mishoo/UglifyJS
                        var executeResult = CommandHelper.RunScript($"uglifyjs --compress --mangle --output {minifyFilePath} -- {outputFileName}");
                        if (executeResult.Count > 0 && executeResult[0].Item1 != 0)
                        {
                            System.IO.File.Copy(outputFileName, minifyFilePath);
                        }
                    });
                }
                else
                {
                    _ = Task.Run(() =>
                    {
                        // https://github.com/fmarcia/uglifycss
                        string cssRootPath = Path.Combine(webRootPath, "css");
                        var executeResult = CommandHelper.RunScript($"uglifycss --convert-urls {cssRootPath} {outputFileName} --output {minifyFilePath}");
                        if (executeResult.Count > 0 && executeResult[0].Item1 != 0)
                        {
                            System.IO.File.Copy(outputFileName, minifyFilePath);
                        }
                    });
                }

                result = true;
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"inputFileName: {string.Join(",", inputFileNames)}, outputFileName: {outputFileName}", "TenantAppController/CssCompress");
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/sign-in?applicationNo=08dbcde8520ce00cca91a85e00064bf7&memberNo=08db77a3cba70039ca91a82878021905
        [HttpGet("[action]")]
        public ActionResult SignIn(string applicationNo, string memberNo)
        {
            ActionResult result = BadRequest();

            if (string.IsNullOrEmpty(applicationNo) == false && string.IsNullOrEmpty(memberNo) == false)
            {
                try
                {
                    var dsMembers = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, "SYS.SYS010.GD01", new
                    {
                        ApplicationNo = applicationNo,
                        MemberNo = memberNo
                    }) as DataSet;

                    if (dsMembers == null)
                    {
                        logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: $SYS.SYS010.GD01 확인 필요", "TenantAppController/Email");
                        return result;
                    }
                    else if (dsMembers.Tables.Count > 0)
                    {
                        var member = dsMembers.Tables[0].Rows[0];

                        if (member != null)
                        {
                            CookieOptions cookieOptions = new CookieOptions();
                            cookieOptions.HttpOnly = true;
                            cookieOptions.SameSite = SameSiteMode.Lax;

                            int roleNo = int.Parse($"1{member.GetString("RoleDevelop")}{member.GetString("RoleBusiness")}{member.GetString("RoleOperation")}{member.GetString("RoleManaged")}");
                            string managedRoleID = sqids.Encode(roleNo);
                            Response.Cookies.Append($"{GlobalConfiguration.CookiePrefixName}.ManagedRoleID", managedRoleID, cookieOptions);

                            result = Ok();
                        }
                    }
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] " + Request.GetAbsoluteUrl(), "TenantAppController/SignIn");
                    return result;
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/logout
        [HttpGet("[action]")]
        public ActionResult Logout()
        {
            Response.Cookies.Delete($"{GlobalConfiguration.CookiePrefixName}.ManagedRoleID");
            return Ok();
        }

        // http://localhost:8000/checkup/api/tenant-app/create-app?applicationName=나의 첫번째 앱&memberNo=08db77a3cba70039ca91a82878021905&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        [HttpPost("[action]")]
        public async Task<ActionResult> CreateApp(string accessKey
            , string memberNo
            , string? userWorkID = ""
            , string? applicationName = ""
            , string? acronyms = ""
            , string? logoItemID = ""
            , string? companyName = ""
            , string? ownerName = ""
            , string? publicYN = "Y"
            , string? comment = ""
            , string? forbesID = "handstack.apps.empty-app"
        )
        {
            ActionResult result = BadRequest("요청 정보 확인이 필요합니다");
            var entityResult = new EntityResult();

            if (Request.HasFormContentType == true)
            {
                memberNo = Request.GetContainValue("memberNo").ToStringSafe();
                userWorkID = Request.GetContainValue("userWorkID").ToStringSafe();
                applicationName = Request.GetContainValue("applicationName");
                acronyms = Request.GetContainValue("acronyms");
                logoItemID = Request.GetContainValue("logoItemID");
                companyName = Request.GetContainValue("companyName");
                ownerName = Request.GetContainValue("ownerName");
                publicYN = Request.GetContainValue("publicYN").ToStringSafe().ToBoolean() == true ? "Y" : "N";
                comment = Request.GetContainValue("comment");
                forbesID = Request.GetContainValue("forbesID");
            }

            if (ModuleConfiguration.ManagedAccessKey == accessKey
                && string.IsNullOrEmpty(applicationName) == false
                && string.IsNullOrEmpty(memberNo) == false
                && string.IsNullOrEmpty(userWorkID) == false)
            {
                // memberNo 확인 및 제한 조건 검증
                var verifyMemberResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Dynamic, "SYS.SYS010.GD02", new
                {
                    MemberNo = memberNo
                });

                int memberCount = 0;
                int applicationCount = 0;
                if (verifyMemberResults == null)
                {
                }
                else if (verifyMemberResults.Count > 0)
                {
                    var item = verifyMemberResults[0];
                    memberCount = (int)item.MemberCount;
                    applicationCount = (int)item.ApplicationCount;
                }

                if (memberCount == 0)
                {
                    return BadRequest("사용자 정보 또는 요청 정보 확인이 필요합니다");
                }

                // Forbes 앱 정보 생성
                var scalarResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, "SYS.SYS010.GD03", new
                {
                    GroupID = "A",
                    MemberNo = memberNo
                });

                string applicationID = string.Empty;
                string applicationNo = string.Empty;
                if (scalarResults != null)
                {
                    applicationNo = sequentialIdGenerator.NewId().ToString("N");
                    applicationID = tenantSqids.Encode((int)scalarResults);
                }
                else
                {
                    return BadRequest("Forbes 앱 정보 생성 확인이 필요합니다");
                }

                // Application 임시 디렉토리 확인 및 삭제
                string appTempBasePath = Path.Combine(GlobalConfiguration.CreateAppTempPath, applicationID);
                if (Directory.Exists(appTempBasePath) == true)
                {
                    Directory.Delete(appTempBasePath, true);
                }

                // Application 임시 디렉토리 생성
                Directory.CreateDirectory(appTempBasePath);

                // Forbes 앱 파일을 임시 디렉토리에 복사
                string forbesAppBasePath = Path.Combine(GlobalConfiguration.ForbesBasePath, forbesID.ToStringSafe());
                if (Directory.Exists(forbesAppBasePath) == false)
                {
                    return BadRequest("Forbes ID 정보 또는 요청 정보 확인이 필요합니다");
                }

                DirectoryInfo forbesAppDirectoryInfo = new DirectoryInfo(forbesAppBasePath);
                forbesAppDirectoryInfo.CopyTo(appTempBasePath, true);

                Directory.CreateDirectory(Path.Combine(appTempBasePath, "dbclient"));
                Directory.CreateDirectory(Path.Combine(appTempBasePath, "transact"));
                Directory.CreateDirectory(Path.Combine(appTempBasePath, "function"));
                Directory.CreateDirectory(Path.Combine(appTempBasePath, "function", "csharp"));
                Directory.CreateDirectory(Path.Combine(appTempBasePath, "function", "javascript"));
                Directory.CreateDirectory(Path.Combine(appTempBasePath, "wwwroot"));

                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.SYS010.DD01", new
                    {
                        IdentityNo = scalarResults,
                        GroupID = "A",
                        MemberNo = memberNo,
                    });
                    return BadRequest($"Forbes 앱 정보 생성이 제한 되었습니다");
                }

                string tenantID = $"{userWorkID}|{applicationID}";
                string settingFilePath = Path.Combine(appBasePath, "settings.json");
                if (System.IO.File.Exists(settingFilePath) == true || GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == true)
                {
                    ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.SYS010.DD01", new
                    {
                        IdentityNo = scalarResults,
                        GroupID = "A",
                        MemberNo = memberNo,
                    });
                    return BadRequest($"{applicationID} 어플리케이션 생성이 제한 되었습니다");
                }

                string baseUrl = Request.GetBaseUrl();
                string appSecret = Guid.NewGuid().ToString("N").Replace("-", "").Substring(0, 8).ToUpper();
                Dictionary<string, string> replaceKeyValues = new Dictionary<string, string>();
                replaceKeyValues.Add("#{ApplicationNo}", applicationNo);
                replaceKeyValues.Add("#{ApplicationID}", applicationID);
                replaceKeyValues.Add("#{ApplicationName}", applicationName);
                replaceKeyValues.Add("#{ApplicationBaseUrl}", baseUrl);
                replaceKeyValues.Add("#{RandomID}", appSecret);
                replaceKeyValues.Add("#{UserWorkID}", userWorkID);
                replaceKeyValues.Add("#{TenantID}", tenantID);
                replaceKeyValues.Add("#{MemberNo}", memberNo);
                replaceKeyValues.Add("#{Comment}", comment.ToStringSafe().Replace(Environment.NewLine, " "));
                replaceKeyValues.Add("#{CreatedAt}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));

                // 디렉토리내 모든 파일에서 치환 변수 변경
                ReplaceInFiles(appTempBasePath, replaceKeyValues);

                // Application logoItemID를 확인하여 LogoPath 업데이트
                string logoPath = "";
                if (string.IsNullOrEmpty(logoItemID) == false)
                {
                    MediatorRequest mediatorRequest = new MediatorRequest()
                    {
                        ActionModuleID = ModuleConfiguration.ModuleID,
                        SubscribeEventID = "repository.Events.RepositoryRequest",
                    };

                    Dictionary<string, object> templateParameters = new Dictionary<string, object>();

                    templateParameters.Add("applicationID", GlobalConfiguration.ApplicationID);
                    templateParameters.Add("repositoryID", "CHECKUPLP01");
                    templateParameters.Add("applicationNo", applicationNo);
                    templateParameters.Add("logoItemID", logoItemID);

                    mediatorRequest.Parameters = new Dictionary<string, object?>();
                    mediatorRequest.Parameters.Add("Method", "UpdateTenantAppDependencyID");
                    mediatorRequest.Parameters.Add("Arguments", templateParameters);

                    var sendResponse = await mediatorClient.SendAsync(mediatorRequest);
                    if (sendResponse.Acknowledge == AcknowledgeType.Success)
                    {
                        var data = sendResponse.Result as string;
                        if (data != null)
                        {
                            logoPath = data;
                        }
                    }
                }

                // Forbes 앱에 정보 생성
                var applicationResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, "SYS.SYS010.ID01", new
                {
                    ApplicationNo = applicationNo,
                    ApplicationID = applicationID,
                    ApplicationName = applicationName,
                    Acronyms = acronyms,
                    LogoPath = logoPath,
                    CompanyName = companyName,
                    OwnerName = ownerName,
                    PublicYN = publicYN,
                    Comment = comment,
                    MemberNo = memberNo
                });

                string createdAt = string.Empty;
                if (applicationResults == null)
                {
                }
                else
                {
                    createdAt = applicationResults;
                }

                if (string.IsNullOrEmpty(createdAt) == true)
                {
                    return BadRequest("어플리케이션 정보 또는 요청 정보 확인이 필요합니다");
                }

                string connectionString = appDbConnectionString.Replace("{appBasePath}", appBasePath);
                string logDbFilePath = Path.Combine(appBasePath, $".managed/sqlite/app.db");

                FileInfo fileInfo = new FileInfo(logDbFilePath);
                if (fileInfo.Directory != null && fileInfo.Directory.Exists == false)
                {
                    Directory.CreateDirectory(fileInfo.Directory.FullName);
                }

                if (fileInfo.Exists == false)
                {
                    ModuleExtensions.TenantAppExecuteMetaSQL(connectionString, ReturnType.NonQuery, "SYS.SYS010.ZD03");
                }

                // checkup Forbes 앱 데이터 모델 정보를 Forbes 앱에 복사
                string forbesMetaFilePath = Path.Combine(forbesAppBasePath, "meta.xml");
                if (System.IO.File.Exists(forbesMetaFilePath) == true)
                {
                    using DataSet dsMetaData = new DataSet();
                    dsMetaData.LoadFile(forbesMetaFilePath);

                    if (dsMetaData.Tables.Count > 1)
                    {
                        DataTable metaEntity = dsMetaData.Tables[0];
                        DataTable metaField = dsMetaData.Tables[1];
                        DataTable? metaRelation = dsMetaData.Tables.Count > 2 ? dsMetaData.Tables[2] : null;

                        for (int i = 0; i < metaEntity.Rows.Count; i++)
                        {
                            DataRow rowEntity = metaEntity.Rows[i];
                            string oldEntityNo = rowEntity["EntityNo"].ToStringSafe();
                            string newEntityNo = sequentialIdGenerator.NewId().ToString("N");

                            rowEntity["ApplicationNo"] = applicationNo;
                            rowEntity["EntityNo"] = newEntityNo;
                            rowEntity["CreatedAt"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

                            var filteredFieldRows = from DataRow row in metaField.AsEnumerable()
                                                    where row.Field<string>("EntityNo") == oldEntityNo
                                                    select row;

                            foreach (DataRow rowField in filteredFieldRows)
                            {
                                rowField["EntityNo"] = newEntityNo;
                            }

                            if (metaRelation != null)
                            {
                                var filteredDepartureRelationRows = from DataRow row in metaRelation.AsEnumerable()
                                                                    where row.Field<string>("DepartureEntityNo") == oldEntityNo
                                                                    select row;

                                foreach (DataRow rowField in filteredDepartureRelationRows)
                                {
                                    rowField["ApplicationNo"] = applicationNo;
                                    rowField["DepartureEntityNo"] = newEntityNo;
                                }

                                var filteredArrivalRelationRows = from DataRow row in metaRelation.AsEnumerable()
                                                                  where row.Field<string>("ArrivalEntityNo") == oldEntityNo
                                                                  select row;

                                foreach (DataRow rowField in filteredArrivalRelationRows)
                                {
                                    rowField["ApplicationNo"] = applicationNo;
                                    rowField["ArrivalEntityNo"] = newEntityNo;
                                }
                            }
                        }

                        // forbes 앱 메타 입력
                        using (SQLiteConnection connection = new SQLiteConnection(connectionString))
                        {
                            connection.Open();

                            using (var transaction = connection.BeginTransaction())
                            {
                                try
                                {
                                    BulkInsertData("MetaEntity", metaEntity, connection);
                                    BulkInsertData("MetaField", metaField, connection);

                                    if (metaRelation != null)
                                    {
                                        BulkInsertData("MetaRelation", metaRelation, connection);
                                    }

                                    transaction.Commit();
                                }
                                catch (Exception exception)
                                {
                                    transaction.Rollback();

                                    logger.Error(exception, "[{LogCategory}] " + $"forbesID: {forbesID}, tenantID: {tenantID}, meta.xml", "TenantAppController/CreateApp");
                                    return Content("Forbes 앱 메타 정보 정합성 확인이 필요합니다");
                                }
                            }
                        }

                        // checkup 앱 메타 입력
                        using (SQLiteConnection connection = new SQLiteConnection(ModuleConfiguration.ConnectionString))
                        {
                            connection.Open();

                            using (var transaction = connection.BeginTransaction())
                            {
                                try
                                {
                                    BulkInsertData("MetaEntity", metaEntity, connection);
                                    BulkInsertData("MetaField", metaField, connection);

                                    if (metaRelation != null)
                                    {
                                        BulkInsertData("MetaRelation", metaRelation, connection);
                                    }

                                    transaction.Commit();
                                }
                                catch (Exception exception)
                                {
                                    transaction.Rollback();

                                    logger.Error(exception, "[{LogCategory}] " + $"forbesID: {forbesID}, tenantID: {tenantID}, meta.xml", "TenantAppController/CreateApp");
                                    return Content("checkup 모듈 메타 정보 정합성 확인이 필요합니다");
                                }
                            }
                        }
                    }
                    else
                    {
                        return Content("Forbes 앱 메타 정보 검증이 필요합니다");
                    }
                }

                // checkup Forbes 앱 데이터 정보를 Forbes 앱에 복사
                string forbesMetaDataFilePath = Path.Combine(forbesAppBasePath, "meta.sql");
                if (System.IO.File.Exists(forbesMetaDataFilePath) == true)
                {
                    string forbesMetaDataText = System.IO.File.ReadAllText(forbesMetaDataFilePath);
                    using (SQLiteConnection connection = new SQLiteConnection(connectionString))
                    {
                        connection.Open();

                        using (var transaction = connection.BeginTransaction())
                        using (var command = new SQLiteCommand(connection))
                        {
                            try
                            {
                                command.CommandText = forbesMetaDataText;
                                command.ExecuteNonQuery();
                                transaction.Commit();
                            }
                            catch (Exception exception)
                            {
                                transaction.Rollback();

                                logger.Error(exception, "[{LogCategory}] " + $"forbesID: {forbesID}, tenantID: {tenantID}, meta.sql", "TenantAppController/CreateApp");
                                return Content("Forbes 앱 데이터 정보 정합성 확인이 필요합니다");
                            }
                        }
                    }
                }

                DirectoryInfo tempAppDirectoryInfo = new DirectoryInfo(appTempBasePath);
                tempAppDirectoryInfo.CopyTo(appBasePath, true);

                // forbes 앱 meta.xml 엔티티 정보 파일 삭제
                string metaFilePath = Path.Combine(appBasePath, "meta.xml");
                if (System.IO.File.Exists(metaFilePath) == true)
                {
                    System.IO.File.Delete(metaFilePath);
                }

                Directory.Delete(appTempBasePath, true);

                TenentAppContractUpdate(userWorkID, applicationID);

                result = Ok(applicationNo);
            }

            return result;
        }

        private void TenentAppContractUpdate(string userWorkID, string applicationID)
        {
            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
            DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
            if (directoryInfo.Exists == true)
            {
                string tenantID = $"{userWorkID}|{applicationID}";
                string settingFilePath = Path.Combine(appBasePath, "settings.json");
                if (System.IO.File.Exists(settingFilePath) == true || GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == true)
                {
                    string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                    var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                    if (appSetting != null)
                    {
                        string baseUrl = Request.GetBaseUrl();

                        // dbclient, repository, transact, function 계약 파일 업데이트
                        string contractUrl = $"{baseUrl}/checkup/api/tenant-app/refresh-referer-app?userWorkID={userWorkID}&applicationID={applicationID}&appSecret={appSetting.AppSecret}";
                        ContractUpdate(contractUrl);

                        contractUrl = $"{baseUrl}/checkup/api/tenant-app/refresh-origin-app?userWorkID={userWorkID}&applicationID={applicationID}&appSecret={appSetting.AppSecret}";
                        ContractUpdate(contractUrl);

                        contractUrl = $"{baseUrl}/dbclient/api/managed/reset-app-contract?userWorkID={userWorkID}&applicationID={applicationID}";
                        ContractUpdate(contractUrl);

                        contractUrl = $"{baseUrl}/repository/api/managed/reset-app-contract?userWorkID={userWorkID}&applicationID={applicationID}";
                        ContractUpdate(contractUrl);

                        contractUrl = $"{baseUrl}/transact/api/managed/reset-app-contract?userWorkID={userWorkID}&applicationID={applicationID}";
                        ContractUpdate(contractUrl);

                        contractUrl = $"{baseUrl}/function/api/managed/reset-app-contract?userWorkID={userWorkID}&applicationID={applicationID}";
                        ContractUpdate(contractUrl);
                    }
                }
            }
        }

        // http://localhost:8000/checkup/api/tenant-app/delete-app?applicationID=9ysztou4&userWorkID=9ysztou4&memberNo=08db77a3cba70039ca91a82878021905&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public async Task<ActionResult> DeleteApp(string accessKey
            , string memberNo
            , string userWorkID
            , string applicationID
        )
        {
            ActionResult result = BadRequest("요청 정보 확인이 필요합니다");

            if (ModuleConfiguration.ManagedAccessKey == accessKey
                && string.IsNullOrEmpty(applicationID) == false
                && string.IsNullOrEmpty(memberNo) == false
                && string.IsNullOrEmpty(userWorkID) == false)
            {
                // memberNo 확인 및 제한 조건 검증
                var verifyMemberResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Dynamic, "SYS.SYS010.GD04", new
                {
                    ApplicationID = applicationID,
                    MemberNo = memberNo,
                    UserWorkID = userWorkID
                });

                string applicationNo = string.Empty;
                if (verifyMemberResults == null)
                {
                }
                else if (verifyMemberResults.Count > 0)
                {
                    var item = verifyMemberResults[0];
                    applicationNo = item.ApplicationNo;
                }

                if (string.IsNullOrEmpty(applicationNo) == true)
                {
                    return BadRequest("어플리케이션 정보 또는 요청 정보 확인이 필요합니다");
                }

                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                if (directoryInfo.Exists == true)
                {
                    string tenantID = $"{userWorkID}|{applicationID}";
                    string settingFilePath = Path.Combine(appBasePath, "settings.json");
                    if (System.IO.File.Exists(settingFilePath) == true || GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == true)
                    {
                        string appSettingText = await System.IO.File.ReadAllTextAsync(settingFilePath);
                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                        if (appSetting != null)
                        {
                            ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.SYS010.DD02", new
                            {
                                ApplicationNo = applicationNo
                            });

                            try
                            {
                                string disposeTenantAppsFilePath = Path.Combine(GlobalConfiguration.EntryBasePath, "dispose-tenantapps.log");
                                using (StreamWriter file = new StreamWriter(disposeTenantAppsFilePath, true))
                                {
                                    file.WriteLine($"{tenantID}|{appBasePath}");
                                }

                                if (GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                                {
                                    GlobalConfiguration.DisposeTenantApps.Add(tenantID);
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Warning(exception, "[{LogCategory}] " + $"DisposeTenantApps 확인 필요: {tenantID}, {appBasePath}", "TenantAppController/DeleteApp");
                            }

                            try
                            {
                                DeleteDirectoryExceptManaged(appBasePath);
                            }
                            catch (Exception exception)
                            {
                                Log.Warning(exception, "[{LogCategory}] " + $"DeleteDirectoryExceptManaged 확인 필요: {tenantID}, {appBasePath}", "TenantAppController/DeleteApp");
                            }

                            TenentAppContractUpdate(userWorkID, applicationID);

                            result = Ok();
                        }
                        else
                        {
                            result = BadRequest($"{tenantID} settings.json 정보 확인이 필요합니다");
                        }
                    }
                    else
                    {
                        result = BadRequest($"{tenantID} settings.json 정보가 필요합니다");
                    }
                }
                else
                {
                    result = BadRequest("이미 삭제 된 앱입니다");
                }
            }

            return result;
        }

        private void DeleteDirectoryExceptManaged(string path)
        {
            var files = Directory.GetFiles(path);
            var directories = Directory.GetDirectories(path);

            foreach (var file in files)
            {
                System.IO.File.SetAttributes(file, FileAttributes.Normal);
                System.IO.File.Delete(file);
            }

            foreach (var dir in directories)
            {
                if (Path.GetFileName(dir).Equals(".managed", StringComparison.OrdinalIgnoreCase) == true)
                {
                    continue;
                }

                DeleteDirectoryExceptManaged(dir);
            }

            if (Directory.GetFiles(path).Length == 0 && Directory.GetDirectories(path).Length == 0)
            {
                Directory.Delete(path, false);
            }
        }

        private void BulkInsertData(string tableName, DataTable data, SQLiteConnection connection)
        {
            List<string> columnNames = new List<string>();
            for (int i = 0; i < data.Columns.Count; i++)
            {
                columnNames.Add(data.Columns[i].ColumnName);
            }

            using (var command = new SQLiteCommand(connection))
            {
                foreach (DataRow row in data.Rows)
                {
                    command.CommandText = $"INSERT INTO {tableName} ({string.Join(", ", columnNames)}) VALUES ({string.Join(", ", row.ItemArray.Select(i => $"'{i}'"))})";
                    command.ExecuteNonQuery();
                }
            }
        }

        private void ContractUpdate(string contractUrl)
        {
            Task.Run(async () =>
            {
                Uri baseUri = new Uri(contractUrl);
                var client = new RestClient();
                var request = new RestRequest(baseUri, Method.Get);
                request.AddHeader("ApplicationName", GlobalConfiguration.ApplicationName);
                request.AddHeader("SystemID", GlobalConfiguration.SystemID);
                request.AddHeader("HostName", GlobalConfiguration.HostName);
                request.AddHeader("RunningEnvironment", GlobalConfiguration.RunningEnvironment);
                request.AddHeader("ApplicationRuntimeID", GlobalConfiguration.ApplicationRuntimeID);
                request.AddHeader("AuthorizationKey", GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName);

                var response = await client.ExecuteAsync(request);
                if (response.StatusCode != HttpStatusCode.OK)
                {
                    logger.Error("[{LogCategory}] " + $"{contractUrl} 요청 실패", "TenantAppController/ContractUpdate");
                }
            });
        }

        private void ReplaceInFiles(string directoryPath, Dictionary<string, string> replaceKeyValues)
        {
            foreach (string file in Directory.GetFiles(directoryPath))
            {
                var fileInfo = new FileInfo(file);
                if (fileInfo.IsBinary() == false)
                {
                    string fileText = System.IO.File.ReadAllText(file);
                    bool changed = false;
                    foreach (var replaceKeyValue in replaceKeyValues)
                    {
                        string findText = replaceKeyValue.Key;
                        string replaceText = replaceKeyValue.Value;

                        int count = Regex.Matches(fileText, findText, RegexOptions.None).Count;

                        if (count > 0)
                        {
                            if (changed == false)
                            {
                                changed = true;
                            }
                            fileText = fileText.Replace(findText, replaceText);
                        }
                    }

                    if (changed == true)
                    {
                        System.IO.File.WriteAllText(file, fileText);
                    }
                }
            }

            foreach (string directory in Directory.GetDirectories(directoryPath))
            {
                ReplaceInFiles(directory, replaceKeyValues);
            }
        }

        // http://localhost:8000/checkup/api/tenant-app/meta-scheme?applicationID=helloworld&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult MetaScheme(string accessKey, string userWorkID, string applicationID)
        {
            ActionResult result = NotFound();

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string appDbFilePath = $"{appBasePath}/.managed/sqlite/app.db";
                    if (System.IO.File.Exists(appDbFilePath) == true)
                    {
                        string connectionString = appDbConnectionString.Replace("{appBasePath}", appBasePath);
                        using (SQLiteClient dbClient = new SQLiteClient(connectionString))
                        using (DataSet? dsResult = dbClient.ExecuteDataSet("SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY 1 DESC, 2;", CommandType.Text))
                        {
                            if (dsResult != null && dsResult.Tables.Count > 0)
                            {
                                using DataTable dataTable = dsResult.Tables[0];
                                result = Content(JsonConvert.SerializeObject(dataTable), "application/json");
                            }
                        }
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/table-columns?applicationID=helloworld&tableName=Customer&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult TableColumns(string accessKey, string userWorkID, string applicationID, string tableName)
        {
            ActionResult result = NotFound();

            if (ModuleConfiguration.ManagedAccessKey == accessKey
                && string.IsNullOrEmpty(userWorkID) == false
                && string.IsNullOrEmpty(applicationID) == false
                && string.IsNullOrEmpty(tableName) == false
            )
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string appDbFilePath = $"{appBasePath}/.managed/sqlite/app.db";
                    if (System.IO.File.Exists(appDbFilePath) == true)
                    {
                        string connectionString = appDbConnectionString.Replace("{appBasePath}", appBasePath);
                        using SQLiteClient dbClient = new SQLiteClient(connectionString);

                        var tableCount = dbClient.ExecuteScalar($"SELECT COUNT(*) AS RowCount FROM sqlite_master WHERE type = 'table' AND tbl_name = '{tableName}';", CommandType.Text);
                        if (tableCount.ToStringSafe().ToBoolean() == true)
                        {
                            using (DataSet? dsResult = dbClient.ExecuteDataSet($"SELECT * FROM {tableName} WHERE 1>2;", CommandType.Text, true))
                            {
                                if (dsResult != null && dsResult.Tables.Count > 0)
                                {
                                    using DataTable dataTable = dsResult.Tables[0];

                                    var keyColumns = dataTable.PrimaryKey;
                                    var tableColumns = dataTable.Columns;

                                    DataTableHelper dataTableBuilder = new DataTableHelper();
                                    dataTableBuilder.AddColumn("ColumnName", typeof(string));
                                    dataTableBuilder.AddColumn("DataType", typeof(string));
                                    dataTableBuilder.AddColumn("PK", typeof(string));
                                    dataTableBuilder.AddColumn("UI", typeof(string));
                                    dataTableBuilder.AddColumn("NN", typeof(string));
                                    dataTableBuilder.AddColumn("AI", typeof(string));
                                    dataTableBuilder.AddColumn("Ordinal", typeof(string));

                                    for (int i = 0; i < tableColumns.Count; i++)
                                    {
                                        var tableColumn = tableColumns[i];
                                        dataTableBuilder.NewRow();
                                        dataTableBuilder.SetValue(i, 0, tableColumn.ColumnName);
                                        dataTableBuilder.SetValue(i, 1, tableColumn.DataType.ToString().Replace("System.", ""));
                                        dataTableBuilder.SetValue(i, 2, keyColumns.Contains(tableColumn) == true ? "1" : "0");
                                        dataTableBuilder.SetValue(i, 3, tableColumn.Unique == true ? "1" : "0");
                                        dataTableBuilder.SetValue(i, 4, tableColumn.AllowDBNull == false ? "1" : "0");
                                        dataTableBuilder.SetValue(i, 5, tableColumn.AutoIncrement == true ? "1" : "0");
                                        dataTableBuilder.SetValue(i, 6, tableColumn.Ordinal.ToString());
                                    }

                                    using (DataTable table = dataTableBuilder.GetDataTable())
                                    {
                                        result = Content(JsonConvert.SerializeObject(table), "application/json");
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/table-data?applicationID=helloworld&tableName=Album&pageIndex=0&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult TableData(string accessKey, string userWorkID, string applicationID, string tableName, string pageIndex = "0")
        {
            ActionResult result = NotFound();

            if (ModuleConfiguration.ManagedAccessKey == accessKey
                && string.IsNullOrEmpty(userWorkID) == false
                && string.IsNullOrEmpty(applicationID) == false
                && string.IsNullOrEmpty(tableName) == false
            )
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string appDbFilePath = $"{appBasePath}/.managed/sqlite/app.db";
                    if (System.IO.File.Exists(appDbFilePath) == true)
                    {
                        string connectionString = appDbConnectionString.Replace("{appBasePath}", appBasePath);
                        using SQLiteClient dbClient = new SQLiteClient(connectionString);

                        var tableCount = dbClient.ExecuteScalar($"SELECT COUNT(*) AS RowCount FROM sqlite_master WHERE type = 'table' AND tbl_name = '{tableName}';", CommandType.Text);
                        if (tableCount.ToStringSafe().ToBoolean() == true)
                        {
                            using (DataSet? dsResult = dbClient.ExecuteDataSet($"SELECT COUNT(*) AS RowCount FROM {tableName};SELECT * FROM {tableName} LIMIT {pageIndex.ParseInt(0) * 50}, 50;", CommandType.Text))
                            {
                                if (dsResult != null && dsResult.Tables.Count > 0)
                                {
                                    result = Content(JsonConvert.SerializeObject(dsResult), "application/json");
                                }
                            }
                        }
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/backup-database?applicationID=helloworld&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult BackupDatabase(string accessKey, string userWorkID, string applicationID)
        {
            ActionResult result = BadRequest();

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string appDbFilePath = $"{appBasePath}/.managed/sqlite/app.db";
                    string issueDateTime = sequentialIdGenerator.NewId().ToString("N");
                    string backupAppDbFilePath = $"{appBasePath}/.managed/sqlite/app-backup.db";
                    if (System.IO.File.Exists(appDbFilePath) == true)
                    {
                        string appDbDirectoryPath = Path.Combine(appBasePath, ".managed", "sqlite");
                        var backupIssueFiles = Directory.GetFiles(appDbDirectoryPath, "backup-*");
                        for (int i = 0; i < backupIssueFiles.Length; i++)
                        {
                            var backupIssueFile = backupIssueFiles[i];
                            FileInfo fileInfo = new FileInfo(backupIssueFile);
                            if (fileInfo.Name.Replace("backup-", "").Length == 32)
                            {
                                try
                                {
                                    fileInfo.Delete();
                                }
                                catch
                                {
                                }
                            }
                        }

                        string connectionString = appDbConnectionString.Replace("{appBasePath}", appBasePath);
                        using (var source = new SQLiteConnection(connectionString))
                        using (var destination = new SQLiteConnection(connectionString.Replace("/app.db;", $"/app-backup.db;")))
                        {
                            source.Open();
                            destination.Open();
                            source.BackupDatabase(destination, "main", "main", -1, null, 0);
                        }

                        if (System.IO.File.Exists(backupAppDbFilePath) == true)
                        {
                            result = Content(issueDateTime, "text/plain");

                            System.IO.File.Create($"{appBasePath}/.managed/sqlite/backup-{issueDateTime}").Close();
                        }
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/backup-database-download?applicationID=helloworld&downloadTokenID=08DBB57E66F24CD7CA91A830F006DA4F
        [HttpGet("[action]")]
        public ActionResult BackupDatabaseDownload(string userWorkID, string applicationID, string downloadTokenID)
        {
            ActionResult result = NotFound();

            if (string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(downloadTokenID) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    if (Guid.TryParse(downloadTokenID, out Guid issueGuid) == true)
                    {
                        string backupIssueDbFilePath = $"{appBasePath}/.managed/sqlite/backup-{downloadTokenID}";

                        if (System.IO.File.Exists(backupIssueDbFilePath) == true)
                        {
                            DateTime issueDateTime = (issueGuid.ToDateTime() ?? DateTime.UtcNow).ToLocalTime();
                            string backupAppDbFilePath = $"{appBasePath}/.managed/sqlite/app-backup.db";

                            PhysicalFileResult physicalFileResult = new PhysicalFileResult(backupAppDbFilePath, MimeHelper.GetMimeType(backupAppDbFilePath).ToStringSafe());
                            physicalFileResult.FileDownloadName = $"backup-{issueDateTime.ToString("yyyyMMddHHmmss")}.db";

                            System.IO.File.Delete(backupIssueDbFilePath);
                            result = physicalFileResult;
                        }
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/restore-database?applicationID=helloworld&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult RestoreDatabase(string accessKey, string userWorkID, string applicationID)
        {
            ActionResult result = BadRequest();

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string appDbDirectoryPath = Path.Combine(appBasePath, ".managed", "sqlite");
                    var restoreIssueFiles = Directory.GetFiles(appDbDirectoryPath, "restore-*");
                    for (int i = 0; i < restoreIssueFiles.Length; i++)
                    {
                        var restoreIssueFile = restoreIssueFiles[i];
                        FileInfo fileInfo = new FileInfo(restoreIssueFile);
                        if (fileInfo.Name.Replace("restore-", "").Length == 32)
                        {
                            try
                            {
                                fileInfo.Delete();
                            }
                            catch
                            {
                            }
                        }
                    }

                    string issueDateTime = sequentialIdGenerator.NewId().ToString("N");
                    System.IO.File.Create($"{appBasePath}/.managed/sqlite/restore-{issueDateTime}").Close();
                    result = Content(issueDateTime, "text/plain");
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/restore-database-upload?applicationID=helloworld&uploadTokenID=08DBB5828D73213ECA91A8276401A03E
        [HttpPost("[action]")]
        public async Task<ActionResult> RestoreDatabaseUpload([FromForm] IFormFile file)
        {
            ActionResult result = BadRequest();
            string userWorkID = Request.Query["userWorkID"].ToString();
            string applicationID = Request.Query["applicationID"].ToString();
            string uploadTokenID = Request.Query["uploadTokenID"].ToString();

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(userWorkID) == true || string.IsNullOrEmpty(uploadTokenID) == true)
            {
                return result = BadRequest("필수 요청 정보 확인 필요");
            }

            if (Request.HasFormContentType == true)
            {
                if (file == null)
                {
                    return result = BadRequest("업로드 파일 정보 확인 필요");
                }
                else
                {
                    try
                    {
                        string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                        if (Directory.Exists(appBasePath) == true)
                        {
                            string restoreIssueDbFilePath = $"{appBasePath}/.managed/sqlite/restore-{uploadTokenID}";

                            if (System.IO.File.Exists(restoreIssueDbFilePath) == true && Guid.TryParse(uploadTokenID, out Guid issueGuid) == true)
                            {
                                DateTime issueDateTime = (issueGuid.ToDateTime() ?? DateTime.UtcNow).ToLocalTime();
                                string issueNumber = issueDateTime.ToString("yyyyMMddHHmmss");
                                string appDbFilePath = $"{appBasePath}/.managed/sqlite/app.db";
                                string appDbDirectoryPath = Path.Combine(appBasePath, ".managed", "sqlite");
                                if (Directory.Exists(appDbDirectoryPath) == true)
                                {
                                    string itemPhysicalPath = Path.Combine(appDbDirectoryPath, $"app-restore-{issueNumber}.db");
                                    using (FileStream fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
                                    {
                                        await file.CopyToAsync(fileStream);
                                    }

                                    if (System.IO.File.Exists(appDbFilePath) == true)
                                    {
                                        string connectionString = appDbConnectionString.Replace("{appBasePath}", appBasePath);
                                        using (var source = new SQLiteConnection(connectionString.Replace("/app.db;", $"/app-restore-{issueNumber}.db;")))
                                        using (var destination = new SQLiteConnection(connectionString))
                                        {
                                            source.Open();
                                            destination.Open();
                                            source.BackupDatabase(destination, "main", "main", -1, null, 0);
                                        }
                                    }

                                    var restoreFiles = Directory.GetFiles(appDbDirectoryPath, "app-restore-*.db");
                                    for (int i = 0; i < restoreFiles.Length; i++)
                                    {
                                        var restoreFile = restoreFiles[i];
                                        FileInfo fileInfo = new FileInfo(restoreFile);
                                        if (fileInfo.Name.Replace("app-restore-", "").Replace(".db", "").ParseLong(0) < issueNumber.ParseLong(1))
                                        {
                                            try
                                            {
                                                fileInfo.Delete();
                                            }
                                            catch
                                            {
                                            }
                                        }
                                    }

                                    result = Ok();

                                    System.IO.File.Delete(restoreIssueDbFilePath);
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        logger.Error("[{LogCategory}] " + $"{exception.Message}", "TenantAppController/RestoreDatabase");
                        result = BadRequest(exception.Message);
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/execute-sql?applicationID=helloworld&compressBase64=MoUQMiDCAqAEBUsBiAlA8gWVgZwI4BsBLAFwFMB9AWwENsyAnWAdQAkQURZiBPAB1IC8AcmLUARvlJCA3EA=&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        [HttpPost("[action]")]
        public ActionResult ExecuteSql(string accessKey, string userWorkID, string applicationID, string? compressBase64)
        {
            ActionResult result = BadRequest();

            if (Request.HasFormContentType == true)
            {
                accessKey = Request.GetContainValue("accessKey").ToStringSafe(accessKey);
                userWorkID = Request.GetContainValue("userWorkID").ToStringSafe(userWorkID);
                applicationID = Request.GetContainValue("applicationID").ToStringSafe(applicationID);
                compressBase64 = Request.GetContainValue("compressBase64");
            }

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(compressBase64) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string appDbFilePath = $"{appBasePath}/.managed/sqlite/app.db";
                    if (System.IO.File.Exists(appDbFilePath) == true)
                    {
                        string connectionString = appDbConnectionString.Replace("{appBasePath}", appBasePath);
                        using (SQLiteClient dbClient = new SQLiteClient(connectionString))
                        {
                            string? executeSql = LZStringHelper.DecompressFromBase64(compressBase64);
                            if (string.IsNullOrEmpty(executeSql) == false)
                            {
                                int affectedRows = dbClient.ExecuteNonQuery(executeSql, CommandType.Text);
                                result = Content(affectedRows.ToString(), "text/plain");
                            }
                        }
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/package-download?applicationID=helloworld&packageNo=08DBAA8914CED69CCA91A83AD40485F1&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult PackageDownload(string accessKey, string userWorkID, string applicationID, string packageNo)
        {
            ActionResult result = NotFound();

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(packageNo) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string packageFilePath = Path.Combine(appBasePath, "publish", $"hostapp-{applicationID}-{packageNo}.zip");
                    if (string.IsNullOrEmpty(packageFilePath) == false && System.IO.File.Exists(packageFilePath) == true)
                    {
                        result = new PhysicalFileResult(packageFilePath, MimeHelper.GetMimeType(packageFilePath).ToStringSafe());
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/publish?applicationID=helloworld&packageNo=08DBAA8914CED69CCA91A83AD40485F1&accessID=Z2B032VV&signID=60969e8117cc3016c525bd3b3e63f0d7bd663153f90cdac67cc9c141bc73aa54
        [HttpGet("[action]")]
        [HttpPost("[action]")]
        public async Task<ActionResult> Publish([FromForm] IFormFile? file)
        {
            ActionResult result = BadRequest();
            if (Request.Method == "GET")
            {
                return Ok();
            }

            StringBuilder? outputBuilder = new StringBuilder(65536);
            string userWorkID = Request.Query["userWorkID"].ToString();
            string applicationID = Request.Query["applicationID"].ToString();
            string packageNo = Request.Query["packageNo"].ToString();
            string accessID = Request.Query["accessID"].ToString();
            string signID = Request.Query["signID"].ToString();

            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(packageNo) == true
                || string.IsNullOrEmpty(accessID) == true
                || string.IsNullOrEmpty(signID) == true
                || ($"{applicationID}|{packageNo}|{accessID}").ToSHA256() != signID
            )
            {
                outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|필수 요청 정보 확인 필요");
                goto TransactionException;
            }

            if (Request.HasFormContentType == true)
            {
                if (file == null)
                {
                    outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|업로드 패키지 파일 정보 확인 필요");
                    goto TransactionException;
                }
                else
                {
                    try
                    {
                        string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                        if (Directory.Exists(appBasePath) == true)
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(Path.Combine(appBasePath, ".managed", "publish"));
                            if (directoryInfo.Exists == false)
                            {
                                outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{directoryInfo.Name} 게시 디렉토리 생성");
                                directoryInfo.Create();
                            }

                            string saveFileName = file.FileName;
                            string extension = Path.GetExtension(saveFileName);
                            string itemPhysicalPath = Path.Combine(directoryInfo.FullName, saveFileName);
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{saveFileName} 패키지 파일 복사 시작");
                            using (FileStream fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
                            {
                                await file.CopyToAsync(fileStream);
                            }
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{saveFileName} 패키지 파일 복사 완료");

                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{saveFileName} 패키지 파일 압축 해제 시작");
                            DirectoryInfo extractDirectoryInfo = directoryInfo.CreateSubdirectory(saveFileName.Replace(extension, ""));
                            ZipFile.ExtractToDirectory(itemPhysicalPath, extractDirectoryInfo.FullName, true);
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{saveFileName} 패키지 파일 압축 해제 완료");
                        }
                        else
                        {
                            outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|ApplicationID 확인 필요");
                        }
                    }
                    catch (Exception exception)
                    {
                        outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{exception}");
                        logger.Error("[{LogCategory}] " + $"{exception.Message}", "TenantAppController/Publish");
                    }
                }
            }

TransactionException:
            result = Content(outputBuilder.ToString(), "text/plain");
            outputBuilder = null;
            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/archives-backup?applicationID=helloworld&packageNo=08DBAA8914CED69CCA91A83AD40485F1&accessID=Z2B032VV&signID=60969e8117cc3016c525bd3b3e63f0d7bd663153f90cdac67cc9c141bc73aa54
        [HttpGet("[action]")]
        public async Task<ActionResult> ArchivesBackup(string userWorkID, string applicationID, string packageNo, string accessID, string signID)
        {
            ActionResult result = BadRequest();

            StringBuilder? outputBuilder = new StringBuilder(65536);
            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(packageNo) == true
                || string.IsNullOrEmpty(accessID) == true
                || string.IsNullOrEmpty(signID) == true
                || ($"{applicationID}|{packageNo}|{accessID}").ToSHA256() != signID
            )
            {
                outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|필수 요청 정보 확인 필요");
                goto TransactionException;
            }

            try
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string packageDirectoryName = $"hostapp-{applicationID}-{packageNo}";
                    string packageDirectoryPath = Path.Combine(appBasePath, ".managed", "publish", packageDirectoryName);
                    string packageArchiveFilePath = Path.Combine(packageDirectoryPath, "package-archives.json");
                    if (Directory.Exists(packageDirectoryPath) == true && System.IO.File.Exists(packageArchiveFilePath) == true)
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(Path.Combine(appBasePath, ".managed", "backup", packageNo));
                        if (directoryInfo.Exists == false)
                        {
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{directoryInfo.Name} 백업 디렉토리 생성");
                            directoryInfo.Create();
                        }

                        string backupDirectoryPath = directoryInfo.FullName;
                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|package-archives.json 읽기 시작");
                        string packageArchiveJson = await System.IO.File.ReadAllTextAsync(packageArchiveFilePath);
                        var packageArchive = JsonConvert.DeserializeAnonymousType(packageArchiveJson, new
                        {
                            Table = new[]
                            {
                                new {
                                    PackageNo= "",
                                    PackageName= "",
                                    Version= "",
                                    BeforeCommandID= "",
                                    AfterCommandID= "",
                                    IssueToPhoneNo= "",
                                    CompleteCallYN= "",
                                    CreatedMemberNo= ""
                                }
                            },
                            Table1 = new[]
                            {
                                new {
                                    ItemNo= 0,
                                    PackageNo= "",
                                    ItemType= "",
                                    RelativePath= "",
                                    FileName= "",
                                    Extension= "",
                                    Size= 0,
                                    MD5= "",
                                    FileModifiedAt= "",
                                    PublishAction= "",
                                    SortingNo= 0
                                }
                            }
                        });

                        if (packageArchive != null)
                        {
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|게시 대상 파일 백업 시작");
                            string directorySeparatorChar = Path.DirectorySeparatorChar.ToString();
                            string locationPath = "";
                            string sourceItemPath = "";
                            string targetItemPath = "";
                            for (int i = 0; i < packageArchive.Table1.Length; i++)
                            {
                                var item = packageArchive.Table1[i];
                                locationPath = item.RelativePath.Replace("/", directorySeparatorChar);
                                if (item.ItemType == "F" || item.ItemType == "P")
                                {
                                    sourceItemPath = Path.Combine(appBasePath, locationPath);
                                    targetItemPath = Path.Combine(backupDirectoryPath, locationPath);

                                    if (System.IO.File.Exists(sourceItemPath) == true)
                                    {
                                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 파일 백업 시작");
                                        FileInfo fileInfo = new FileInfo(targetItemPath);
                                        if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
                                        {
                                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 백업 디렉토리 생성");
                                            fileInfo.Directory?.Create();
                                        }

                                        System.IO.File.Copy(sourceItemPath, targetItemPath, true);
                                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 파일 백업 완료");
                                    }
                                    else
                                    {
                                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 파일 소스 없음");
                                    }
                                }
                                else if (item.ItemType == "D")
                                {
                                    sourceItemPath = Path.Combine(appBasePath, locationPath);
                                    targetItemPath = Path.Combine(backupDirectoryPath, locationPath);

                                    if (Directory.Exists(sourceItemPath) == true)
                                    {
                                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 디렉토리 백업 시작");
                                        DirectoryInfo targetDirectoryInfo = new DirectoryInfo(sourceItemPath);
                                        directoryInfo.CopyTo(targetItemPath, true);
                                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 디렉토리 백업 완료");
                                    }
                                    else
                                    {
                                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 디렉토리 백업 소스 없음");
                                    }
                                }
                            }
                        }
                        else
                        {
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|게시 대상 없음");
                        }
                    }
                    else
                    {
                        outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|패키지 파일 확인 필요");
                    }
                }
                else
                {
                    outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|ApplicationID 확인 필요");
                }
            }
            catch (Exception exception)
            {
                outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{exception}");
                logger.Error("[{LogCategory}] " + $"{exception.Message}", "TenantAppController/ArchivesBackup");
            }

TransactionException:
            result = Content(outputBuilder.ToString(), "text/plain");
            outputBuilder = null;
            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/progress?applicationID=helloworld&packageNo=08DBAA8914CED69CCA91A83AD40485F1&accessID=Z2B032VV&signID=60969e8117cc3016c525bd3b3e63f0d7bd663153f90cdac67cc9c141bc73aa54
        [HttpGet("[action]")]
        public async Task<ActionResult> Progress(string userWorkID, string applicationID, string packageNo, string accessID, string signID)
        {
            ActionResult result = BadRequest();

            StringBuilder? outputBuilder = new StringBuilder(65536);
            if (string.IsNullOrEmpty(userWorkID) == true
                || string.IsNullOrEmpty(applicationID) == true
                || string.IsNullOrEmpty(packageNo) == true
                || string.IsNullOrEmpty(accessID) == true
                || string.IsNullOrEmpty(signID) == true
                || ($"{applicationID}|{packageNo}|{accessID}").ToSHA256() != signID
            )
            {
                outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|필수 요청 정보 확인 필요");
                goto TransactionException;
            }

            try
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string packageDirectoryName = $"hostapp-{applicationID}-{packageNo}";
                    string packageDirectoryPath = Path.Combine(appBasePath, ".managed", "publish", packageDirectoryName);
                    string packageArchiveFilePath = Path.Combine(packageDirectoryPath, "package-archives.json");
                    if (Directory.Exists(packageDirectoryPath) == true && System.IO.File.Exists(packageArchiveFilePath) == true)
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(Path.Combine(appBasePath, ".managed", "backup", packageNo));
                        if (directoryInfo.Exists == false)
                        {
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{directoryInfo.Name} 백업 디렉토리 생성");
                            directoryInfo.Create();
                        }

                        string backupDirectoryPath = directoryInfo.FullName;
                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|package-archives.json 읽기 시작");
                        string packageArchiveJson = await System.IO.File.ReadAllTextAsync(packageArchiveFilePath);
                        var packageArchive = JsonConvert.DeserializeAnonymousType(packageArchiveJson, new
                        {
                            Table = new[]
                            {
                                new {
                                    PackageNo= "",
                                    PackageName= "",
                                    Version= "",
                                    BeforeCommandID= "",
                                    AfterCommandID= "",
                                    IssueToPhoneNo= "",
                                    CompleteCallYN= "",
                                    CreatedMemberNo= ""
                                }
                            },
                            Table1 = new[]
                            {
                                new {
                                    ItemNo= 0,
                                    PackageNo= "",
                                    ItemType= "",
                                    RelativePath= "",
                                    FileName= "",
                                    Extension= "",
                                    Size= 0,
                                    MD5= "",
                                    FileModifiedAt= "",
                                    PublishAction= "",
                                    SortingNo= 0
                                }
                            }
                        });

                        if (packageArchive != null)
                        {
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|게시 진행 시작");
                            string directorySeparatorChar = Path.DirectorySeparatorChar.ToString();
                            string locationPath = "";
                            string sourceItemPath = "";
                            string targetItemPath = "";
                            for (int i = 0; i < packageArchive.Table1.Length; i++)
                            {
                                var item = packageArchive.Table1[i];
                                locationPath = item.RelativePath.Replace("/", directorySeparatorChar);
                                if (item.ItemType == "F" || item.ItemType == "P")
                                {
                                    sourceItemPath = Path.Combine(packageDirectoryPath, locationPath);
                                    targetItemPath = Path.Combine(appBasePath, locationPath);

                                    if (System.IO.File.Exists(sourceItemPath) == true)
                                    {
                                        FileInfo fileInfo = new FileInfo(targetItemPath);
                                        if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
                                        {
                                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 게시 디렉토리 생성");
                                            fileInfo.Directory?.Create();
                                        }

                                        switch (item.PublishAction)
                                        {
                                            case "C": // 복사
                                                outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 파일 복사 시작");
                                                System.IO.File.Copy(sourceItemPath, targetItemPath, true);
                                                outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 파일 복사 완료");
                                                break;
                                            case "D": // 삭제
                                                if (System.IO.File.Exists(targetItemPath) == true)
                                                {
                                                    outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 파일 삭제 시작");
                                                    System.IO.File.Delete(targetItemPath);
                                                    outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 파일 삭제 완료");
                                                }
                                                else
                                                {
                                                    outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 삭제 파일 없음");
                                                }
                                                break;
                                            case "B": // 배치 스크립트
                                            case "S": // 쉘 스크립트
                                                string runScript = "";
                                                FileInfo scriptFileInfo = new FileInfo(sourceItemPath);
                                                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true && scriptFileInfo.Extension.ToLower() == ".bat")
                                                {
                                                    runScript = await System.IO.File.ReadAllTextAsync(sourceItemPath);
                                                }
                                                else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux) == true && scriptFileInfo.Extension.ToLower() == ".sh")
                                                {
                                                    runScript = await System.IO.File.ReadAllTextAsync(sourceItemPath);
                                                }
                                                else
                                                {
                                                    outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 스크립트 파일 확인 필요 없음");
                                                }

                                                if (string.IsNullOrEmpty(runScript) == false)
                                                {
                                                    try
                                                    {
                                                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 스크립트 실행 시작");
                                                        var executeResults = CommandHelper.RunScript(runScript
                                                            , workingDirectory: fileInfo.DirectoryName.ToStringSafe()
                                                            , redirectStandardOutput: true
                                                            , redirectStandardError: true);

                                                        if (executeResults.Count > 0)
                                                        {
                                                            for (int j = 0; j < executeResults.Count; j++)
                                                            {
                                                                var executeResult = executeResults[j];
                                                                outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|exit: {executeResult.Item1}, output: {executeResult.Item2}, error: {executeResult.Item3}");
                                                            }
                                                        }
                                                        outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 스크립트 실행 완료");
                                                    }
                                                    catch (Exception exception)
                                                    {
                                                        outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 스크립트 실행 오류: {exception}");
                                                    }
                                                }
                                                break;
                                        }
                                    }
                                }
                                else if (item.ItemType == "D")
                                {
                                    sourceItemPath = Path.Combine(packageDirectoryPath, locationPath);
                                    targetItemPath = Path.Combine(appBasePath, locationPath);

                                    if (Directory.Exists(sourceItemPath) == true)
                                    {
                                        switch (item.PublishAction)
                                        {
                                            case "C": // 복사
                                                outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 디렉토리 복사 시작");
                                                DirectoryInfo targetDirectoryInfo = new DirectoryInfo(sourceItemPath);
                                                targetDirectoryInfo.CopyTo(targetItemPath, true);
                                                outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 디렉토리 복사 완료");
                                                break;
                                            case "D": // 삭제
                                                if (Directory.Exists(targetItemPath) == true)
                                                {
                                                    outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 디렉토리 삭제 시작");
                                                    Directory.Delete(targetItemPath);
                                                    outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 디렉토리 삭제 완료");
                                                }
                                                else
                                                {
                                                    outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 디렉토리 삭제 대상 없음");
                                                }
                                                break;
                                        }
                                    }
                                    else
                                    {
                                        outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{locationPath} 복사 디렉토리 확인 필요");
                                    }
                                }
                            }
                        }
                        else
                        {
                            outputBuilder.AppendLine($"I|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|게시 대상 없음");
                        }
                    }
                    else
                    {
                        outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|패키지 파일 확인 필요");
                    }
                }
                else
                {
                    outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|ApplicationID 확인 필요");
                }
            }
            catch (Exception exception)
            {
                outputBuilder.AppendLine($"E|{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}|{exception}");
                logger.Error("[{LogCategory}] " + $"{exception.Message}", "TenantAppController/Progress");
            }

TransactionException:
            result = Content(outputBuilder.ToString(), "text/plain");
            outputBuilder = null;
            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/upload-common-file?applicationID=helloworld&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpPost("[action]")]
        public async Task<ActionResult> UploadCommonFile([FromForm] IFormFile file)
        {
            ActionResult result = BadRequest();
            string userWorkID = Request.Query["userWorkID"].ToString();
            string applicationID = Request.Query["applicationID"].ToString();
            string accessKey = Request.Query["accessKey"].ToString();
            string userID = string.IsNullOrEmpty(Request.Query["userID"]) == true ? "" : Request.Query["userID"].ToString();

            if (string.IsNullOrEmpty(userWorkID) == true || string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(accessKey) == true)
            {
                return result = BadRequest("필수 요청 정보 확인 필요");
            }

            if (Request.HasFormContentType == true)
            {
                if (file == null)
                {
                    return result = BadRequest("업로드 파일 정보 확인 필요");
                }
                else
                {
                    try
                    {
                        long uploadSizeLimit = 10485760; // 10MB
                        if (uploadSizeLimit < ToFileLength(file.Length))
                        {
                            return BadRequest(uploadSizeLimit.ToByteSize() + " 이상 업로드 할 수 없습니다");
                        }

                        if (ModuleConfiguration.ManagedAccessKey == accessKey)
                        {
                            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                            if (Directory.Exists(appBasePath) == true)
                            {
                                string? appWWWDirectoryPath = Path.Combine(appBasePath, "wwwroot");

                                if (string.IsNullOrEmpty(appWWWDirectoryPath) == false && Directory.Exists(appWWWDirectoryPath) == true)
                                {
                                    string saveFileName = file.FileName;
                                    string itemPhysicalPath = Path.Combine(appWWWDirectoryPath, saveFileName);
                                    using (FileStream fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
                                    {
                                        await file.CopyToAsync(fileStream);
                                    }

                                    result = Ok();
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        logger.Error("[{LogCategory}] " + $"{exception.Message}", "TenantAppController/UploadCommonFile");
                        return Content(JsonConvert.SerializeObject(result), "application/json");
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/asset-file-list?userWorkID=3qmbxyhc&applicationID=9ysztou4&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult AssetFileList(string userWorkID, string applicationID, string accessKey, string? locationPath = "")
        {
            ActionResult result = NotFound();

            string requestRefererUrl = Request.Headers.Referer.ToStringSafe();
            string requestPath = Request.Path.ToString();
            string viewRequestPath = $"/{Request.Host.ToString()}/{ModuleConfiguration.ModuleID}/view/";
            if (string.IsNullOrEmpty(requestRefererUrl) == false && requestRefererUrl.IndexOf(viewRequestPath) > -1 && ModuleConfiguration.ManagedAccessKey == accessKey)
            {
                string tenantID = $"{userWorkID}|{applicationID}";
                string physicalPath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "wwwroot", "assets");

                if (Directory.Exists(physicalPath) == false)
                {
                    Directory.CreateDirectory(physicalPath);
                }

                if (string.IsNullOrEmpty(locationPath) == false)
                {
                    List<string> physicalPaths =
                    [
                        GlobalConfiguration.TenantAppBasePath,
                        userWorkID,
                        applicationID,
                        "wwwroot",
                        "assets",
                    ];

                    var paths = locationPath.SplitAndTrim('/');
                    if (paths != null && paths.Count > 0)
                    {
                        physicalPaths = physicalPaths.Concat(paths).ToList();
                    }

                    physicalPath = Path.Combine(physicalPaths.ToArray());
                }

                if (Directory.Exists(physicalPath) == true)
                {
                    var directoryInfo = new DirectoryInfo(physicalPath);
                    var filesAndDirectories = directoryInfo.EnumerateFileSystemInfos()
                        .Select((fsi, index) => new
                        {
                            no = index + 1,
                            @class = fsi.Attributes.HasFlag(FileAttributes.Directory) == true ? "directory" : "file",
                            name = fsi.Attributes.HasFlag(FileAttributes.Directory) == true ? fsi.Name + "/" : fsi.Name,
                            size = fsi.Attributes.HasFlag(FileAttributes.Directory) ? null : new FileInfo(fsi.FullName).Length.ToString("N0"),
                            lastmodified = fsi.LastWriteTime.ToString("yyyy-MM-dd tt h:mm:ss")
                        })
                        .OrderBy(fsi => fsi.@class == "directory" ? 0 : 1)
                        .ThenBy(fsi => fsi.name)
                        .ToList();

                    filesAndDirectories = filesAndDirectories
                        .Select((fsi, index) => new
                        {
                            no = index + 1,
                            @class = fsi.@class,
                            name = fsi.name,
                            size = fsi.size,
                            lastmodified = fsi.lastmodified
                        })
                        .ToList();

                    result = Content(JsonConvert.SerializeObject(filesAndDirectories), "application/json");
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/upload-asset-file?applicationID=helloworld&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpPost("[action]")]
        public async Task<ActionResult> UploadAssetFile([FromForm] IFormFile file)
        {
            ActionResult result = BadRequest();
            string userWorkID = Request.Query["userWorkID"].ToString();
            string applicationID = Request.Query["applicationID"].ToString();
            string accessKey = Request.Query["accessKey"].ToString();
            string locationPath = string.IsNullOrEmpty(Request.Query["locationPath"]) == true ? "" : Request.Query["locationPath"].ToString();
            string userID = string.IsNullOrEmpty(Request.Query["userID"]) == true ? "" : Request.Query["userID"].ToString();

            if (string.IsNullOrEmpty(userWorkID) == true || string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(locationPath) == true || string.IsNullOrEmpty(accessKey) == true)
            {
                return BadRequest("필수 요청 정보 확인 필요");
            }

            if (Request.HasFormContentType == true)
            {
                if (file == null)
                {
                    return BadRequest("업로드 파일 정보 확인 필요");
                }
                else
                {
                    try
                    {
                        long uploadSizeLimit = 10485760; // 10MB
                        if (uploadSizeLimit < ToFileLength(file.Length))
                        {
                            return BadRequest(uploadSizeLimit.ToByteSize() + " 이상 업로드 할 수 없습니다");
                        }

                        if (ModuleConfiguration.ManagedAccessKey == accessKey)
                        {
                            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                            if (Directory.Exists(appBasePath) == true)
                            {
                                string directorySeparatorChar = Path.DirectorySeparatorChar.ToString();
                                if (locationPath.StartsWith($"/{userWorkID}/{applicationID}/") == true)
                                {
                                    locationPath = locationPath.Substring($"/{userWorkID}/{applicationID}/".Length);
                                }

                                locationPath = locationPath.Replace("/", directorySeparatorChar);
                                string? appAssetDirectoryPath = Path.Combine(appBasePath, "wwwroot", locationPath);

                                if (string.IsNullOrEmpty(appAssetDirectoryPath) == false && Directory.Exists(appAssetDirectoryPath) == true)
                                {
                                    bool isCompressFile = false;
                                    string saveFileName = file.FileName;
                                    string extension = Path.GetExtension(saveFileName);
                                    if (string.IsNullOrEmpty(extension) == false)
                                    {
                                        extension = Path.GetExtension(saveFileName);

                                        if (extension == ".zip")
                                        {
                                            isCompressFile = true;
                                            saveFileName = Guid.NewGuid().ToString("N") + extension;
                                        }
                                    }

                                    string itemPhysicalPath = Path.Combine(appAssetDirectoryPath, saveFileName);
                                    using (FileStream fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
                                    {
                                        await file.CopyToAsync(fileStream);
                                    }

                                    if (isCompressFile == true)
                                    {
                                        if (extension == ".zip")
                                        {
                                            ZipFile.ExtractToDirectory(itemPhysicalPath, appAssetDirectoryPath, true);
                                            System.IO.File.Delete(itemPhysicalPath);
                                        }
                                    }

                                    result = Ok();
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        logger.Error("[{LogCategory}] " + $"{exception.Message}", "TenantAppController/UploadAssetFile");
                        return Content(JsonConvert.SerializeObject(result), "application/json");
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/npm-package?packageName=axios&version=
        [HttpGet("[action]")]
        public async Task<ActionResult> NpmPackage(string packageName, string? version)
        {
            ActionResult result = NotFound();

            if (string.IsNullOrEmpty(packageName) == false)
            {
                var options = new RestClientOptions("https://www.npmjs.com");
                var client = new RestClient(options);
                var request = new RestRequest($"/package/{packageName}/{(string.IsNullOrEmpty(version) == true ? "" : "v/" + version)}", Method.Get);
                RestResponse response = await client.ExecuteAsync(request);
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var content = response.Content;
                    if (content != null)
                    {
                        content = content.Replace("<head>", "<head>\n    <base href=\"https://www.npmjs.com/\">");
                        content = Regex.Replace(content, @"<a\s+([^>]*)(?<!target=""_blank"")([^>]*)>", "<a $1 target=\"_blank\"$2>");
                        content = Regex.Replace(content, @"<form\s+([^>]*)(?<!target=""_blank"")([^>]*)>", "<form $1 target=\"_blank\"$2>");
                        result = Content(content, "text/html");
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/nuget-package?packageName=MediatR&version=
        [HttpGet("[action]")]
        public async Task<ActionResult> NugetPackage(string packageName, string? version)
        {
            ActionResult result = NotFound();

            if (string.IsNullOrEmpty(packageName) == false)
            {
                var options = new RestClientOptions("https://www.nuget.org");
                var client = new RestClient(options);
                var request = new RestRequest($"/packages/{packageName}/{version}", Method.Get);
                RestResponse response = await client.ExecuteAsync(request);
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var content = response.Content;
                    if (content != null)
                    {
                        content = content.Replace("<head>", "<head>\n    <base href=\"https://www.nuget.org/\">");
                        content = Regex.Replace(content, @"<a\s+([^>]*)(?<!target=""_blank"")([^>]*)>", "<a $1 target=\"_blank\"$2>");
                        content = Regex.Replace(content, @"<form\s+([^>]*)(?<!target=""_blank"")([^>]*)>", "<form $1 target=\"_blank\"$2>");
                        result = Content(content, "text/html");
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/create-directory?applicationID=helloworld&projectType=B&directoryName=TST&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult CreateDirectory(string accessKey, string userWorkID, string applicationID, string directoryName, string projectType)
        {
            ActionResult result = NotFound();

            if (projectType == "F" && GlobalConfiguration.IsTenantFunction == false)
            {
                return result;
            }

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(directoryName) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceFilePath = GetHostItemPath(appBasePath, projectType, directoryName);

                    if (string.IsNullOrEmpty(sourceFilePath) == false && Directory.Exists(sourceFilePath) == false)
                    {
                        Directory.CreateDirectory(sourceFilePath);
                        result = Ok();
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/delete-directory?applicationID=helloworld&projectType=B&directoryName=TST&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult DeleteDirectory(string accessKey, string userWorkID, string applicationID, string directoryName, string projectType)
        {
            ActionResult result = NotFound();

            if (projectType == "F" && GlobalConfiguration.IsTenantFunction == false)
            {
                return result;
            }

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(directoryName) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceFilePath = GetHostItemPath(appBasePath, projectType, directoryName);

                    if (string.IsNullOrEmpty(sourceFilePath) == false && Directory.Exists(sourceFilePath) == true)
                    {
                        Directory.Delete(sourceFilePath, true);
                        result = Ok();
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/delete-file?applicationID=helloworld&projectType=B&filePath=TST/TST010.json&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult DeleteFile(string accessKey, string userWorkID, string applicationID, string itemPath, string projectType)
        {
            ActionResult result = NotFound();

            if (projectType == "F" && GlobalConfiguration.IsTenantFunction == false)
            {
                return result;
            }

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(itemPath) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string directorySeparatorChar = Path.DirectorySeparatorChar.ToString();
                    if (directorySeparatorChar != "/")
                    {
                        itemPath = itemPath.Replace("/", directorySeparatorChar);
                    }

                    string? sourceFilePath = null;
                    if (projectType == "R")
                    {
                        sourceFilePath = Path.Combine(appBasePath, "wwwroot", itemPath);
                    }
                    else
                    {
                        sourceFilePath = GetHostItemPath(appBasePath, projectType, itemPath);
                    }

                    if (string.IsNullOrEmpty(sourceFilePath) == false && System.IO.File.Exists(sourceFilePath) == true)
                    {
                        System.IO.File.Delete(sourceFilePath);
                        result = Ok();
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/plain-text?applicationID=helloworld&projectType=B&filePath=STR/SLT010.json
        [HttpGet("[action]")]
        public ActionResult PlainText(string accessKey, string userWorkID, string applicationID, string filePath, string? projectType)
        {
            ActionResult result = NotFound();

            if (projectType == "F" && GlobalConfiguration.IsTenantFunction == false)
            {
                return result;
            }

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(filePath) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceFilePath = GetHostItemPath(appBasePath, projectType, filePath);
                    if (string.IsNullOrEmpty(sourceFilePath) == false && System.IO.File.Exists(sourceFilePath) == true)
                    {
                        result = new PhysicalFileResult(sourceFilePath, MimeHelper.GetMimeType(sourceFilePath).ToStringSafe());
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/post-text?applicationID=helloworld&filePath=wwwroot/view/STR/SLT010.html&compressBase64=EYGwhqZA
        [HttpGet("[action]")]
        [HttpPost("[action]")]
        public ActionResult PostText(string accessKey, string userWorkID, string applicationID, string filePath, string? projectType, string? compressBase64)
        {
            ActionResult result = NotFound();

            if (projectType == "F" && GlobalConfiguration.IsTenantFunction == false)
            {
                return result;
            }

            if (Request.HasFormContentType == true)
            {
                compressBase64 = Request.GetContainValue("compressBase64");
            }

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(compressBase64) == false && string.IsNullOrEmpty(filePath) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceFilePath = GetHostItemPath(appBasePath, projectType, filePath);

                    if (string.IsNullOrEmpty(sourceFilePath) == false && System.IO.File.Exists(sourceFilePath) == true)
                    {
                        string? sourceText = LZStringHelper.DecompressFromBase64(compressBase64);
                        System.IO.File.WriteAllText(sourceFilePath, sourceText);
                        result = Ok();
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/total-items?applicationID=helloworld&applicationName=HelloWorld&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult TotalItems(string accessKey, string userWorkID, string applicationID, string applicationName = "")
        {
            ActionResult result = NotFound();

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
            {
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string searchPattern = "*.*";
                    string? sourceDirectoryPath = appBasePath;

                    List<Menu> menus = new List<Menu>();
                    if (string.IsNullOrEmpty(sourceDirectoryPath) == false && Directory.Exists(sourceDirectoryPath) == true)
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(sourceDirectoryPath);
                        if (directoryInfo.Exists == true)
                        {
                            Menu rootDirectory = new Menu();
                            rootDirectory.menuID = applicationID;
                            rootDirectory.menuName = string.IsNullOrEmpty(applicationName) == true ? applicationID : applicationName;
                            rootDirectory.parentMenuID = null;
                            rootDirectory.parentMenuName = null;
                            rootDirectory.showYN = "Y";
                            rootDirectory.menuType = "D";
                            rootDirectory.directoryYN = (rootDirectory.menuType == "D" ? "Y" : "N");
                            rootDirectory.functions = "";
                            rootDirectory.projectID = "";
                            rootDirectory.fileID = "";
                            rootDirectory.sortingNo = 1;
                            rootDirectory.level = 1;
                            rootDirectory.icon = "folder";
                            rootDirectory.badge = "";
                            menus.Add(rootDirectory);

                            string projectType = string.Empty;
                            projectType = "D";
                            searchPattern = "*.xml";
                            sourceDirectoryPath = Path.Combine(appBasePath, "dbclient");
                            FeatureBuildFileMenu(userWorkID, applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType);

                            projectType = "B";
                            searchPattern = "*.json";
                            sourceDirectoryPath = Path.Combine(appBasePath, "transact");
                            FeatureBuildFileMenu(userWorkID, applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType);

                            projectType = "U";
                            searchPattern = "*.html|*.js|*.json";
                            sourceDirectoryPath = Path.Combine(appBasePath, "wwwroot", "view");
                            FeatureBuildFileMenu(userWorkID, applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType);

                            if (GlobalConfiguration.IsTenantFunction == true)
                            {
                                projectType = "F";
                                searchPattern = "*.cs|*.js|*.json|*.xml|";
                                sourceDirectoryPath = Path.Combine(appBasePath, "function");
                                FeatureBuildFileMenu(userWorkID, applicationID, searchPattern, sourceDirectoryPath, menus, directoryInfo, rootDirectory, projectType);
                            }
                        }
                        result = Content(JsonConvert.SerializeObject(menus), "application/json");
                    }
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/tenant-app/items?applicationID=helloworld&projectType=B&parentMenuID=HBM&parentMenuName=HelloWorld&accessKey=6eac215f2f5e495cad4f2abfdcad7644
        [HttpGet("[action]")]
        public ActionResult Items(string accessKey, string userWorkID, string applicationID, string projectType, string parentMenuID, string parentMenuName)
        {
            ActionResult result = NotFound();

            if (projectType == "F" && GlobalConfiguration.IsTenantFunction == false)
            {
                return result;
            }

            if (ModuleConfiguration.ManagedAccessKey == accessKey && string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false && string.IsNullOrEmpty(projectType) == false && string.IsNullOrEmpty(parentMenuID) == false && string.IsNullOrEmpty(parentMenuName) == false)
            {
                string directorySeparatorChar = Path.DirectorySeparatorChar.ToString();
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID) + directorySeparatorChar;
                if (Directory.Exists(appBasePath) == true)
                {
                    string searchPattern = "*.*";
                    string? sourceDirectoryPath = null;
                    switch (projectType)
                    {
                        case "D":
                            searchPattern = "*.xml";
                            sourceDirectoryPath = Path.Combine(appBasePath, "dbclient");
                            break;
                        case "F":
                            searchPattern = "*.cs|*.js|*.json|*.xml|";
                            sourceDirectoryPath = Path.Combine(appBasePath, "function", "Node");
                            break;
                        case "B":
                            searchPattern = "*.json";
                            sourceDirectoryPath = Path.Combine(appBasePath, "transact");
                            break;
                        case "U":
                            searchPattern = "*.html|*.js|*.json";
                            sourceDirectoryPath = Path.Combine(appBasePath, "wwwroot", "view");
                            break;
                    }

                    List<Menu> menus = new List<Menu>();
                    if (string.IsNullOrEmpty(sourceDirectoryPath) == false && Directory.Exists(sourceDirectoryPath) == true)
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(sourceDirectoryPath);
                        if (directoryInfo.Exists == true)
                        {
                            foreach (var directory in directoryInfo.GetDirectories("*", SearchOption.TopDirectoryOnly))
                            {
                                Menu menuDirectory = new Menu();
                                menuDirectory.menuID = directory.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                                menuDirectory.menuName = directory.Name;
                                menuDirectory.parentMenuID = parentMenuID;
                                menuDirectory.parentMenuName = parentMenuName;
                                menuDirectory.showYN = "Y";
                                menuDirectory.menuType = "D";
                                menuDirectory.directoryYN = (menuDirectory.menuType == "D" ? "Y" : "N");
                                menuDirectory.functions = "";
                                menuDirectory.projectID = "";
                                menuDirectory.fileID = "";
                                menuDirectory.sortingNo = 1;
                                menuDirectory.level = 1;
                                menuDirectory.icon = "folder";
                                menuDirectory.badge = "";
                                menus.Add(menuDirectory);

                                BuildFileMenu(userWorkID, applicationID, projectType, searchPattern, sourceDirectoryPath, menus, menuDirectory, directory, 2);
                            }
                        }
                        result = Content(JsonConvert.SerializeObject(menus), "application/json");
                    }
                }
            }

            return result;
        }

        private static string GetHostItemPath(string appBasePath, string? projectType, string itemPath)
        {
            string result = "";
            string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
            if (itemPath.StartsWith(directorySeparatorChar) == true)
            {
                itemPath = itemPath.Substring(1);
            }

            if (directorySeparatorChar != "/")
            {
                itemPath = itemPath.Replace("/", directorySeparatorChar);
            }

            switch (projectType)
            {
                case "D":
                    result = Path.Combine(appBasePath, "dbclient", itemPath);
                    break;
                case "F":
                    result = Path.Combine(appBasePath, "function", itemPath);
                    break;
                case "B":
                    result = Path.Combine(appBasePath, "transact", itemPath);
                    break;
                case "U":
                    result = Path.Combine(appBasePath, "wwwroot", "view", itemPath);
                    break;
                default:
                    result = Path.Combine(appBasePath, "wwwroot", itemPath);
                    break;
            }

            return result;
        }

        private void FeatureBuildFileMenu(string userWorkID, string applicationID, string searchPattern, string sourceDirectoryPath, List<Menu> menus, DirectoryInfo directoryInfo, Menu rootDirectory, string projectType)
        {
            DirectoryInfo featureDirectoryInfo = new DirectoryInfo(sourceDirectoryPath);
            if (directoryInfo.Exists == true)
            {
                string directorySeparatorChar = Path.DirectorySeparatorChar.ToString();
                string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID) + directorySeparatorChar;
                Menu featureDirectory = new Menu();
                featureDirectory.menuID = featureDirectoryInfo.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                featureDirectory.menuName = featureDirectoryInfo.Name;
                featureDirectory.parentMenuID = rootDirectory.menuID;
                featureDirectory.parentMenuName = rootDirectory.menuName;
                featureDirectory.showYN = "Y";
                featureDirectory.menuType = "D";
                featureDirectory.directoryYN = (rootDirectory.menuType == "D" ? "Y" : "N");
                featureDirectory.functions = "";
                featureDirectory.projectID = "";
                featureDirectory.fileID = "";
                featureDirectory.sortingNo = 1;
                featureDirectory.level = 2;
                featureDirectory.icon = "folder";
                featureDirectory.badge = "";
                menus.Add(featureDirectory);

                foreach (var directory in featureDirectoryInfo.GetDirectories("*", SearchOption.TopDirectoryOnly))
                {
                    Menu menuDirectory = new Menu();
                    menuDirectory.menuID = directory.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuDirectory.menuName = directory.Name;
                    menuDirectory.parentMenuID = featureDirectory.menuID;
                    menuDirectory.parentMenuName = featureDirectory.menuName;
                    menuDirectory.showYN = "Y";
                    menuDirectory.menuType = "D";
                    menuDirectory.directoryYN = (rootDirectory.menuType == "D" ? "Y" : "N");
                    menuDirectory.functions = "";
                    menuDirectory.projectID = "";
                    menuDirectory.fileID = "";
                    menuDirectory.sortingNo = 1;
                    menuDirectory.level = 3;
                    menuDirectory.icon = "folder";
                    menuDirectory.badge = "";
                    menus.Add(menuDirectory);

                    BuildFileMenu(userWorkID, applicationID, projectType, searchPattern, sourceDirectoryPath, menus, menuDirectory, directory, 4);
                }
            }
        }

        private void BuildFileMenu(string userWorkID, string applicationID, string projectType, string searchPattern, string sourceDirectoryPath, List<Menu> menus, Menu parentMenu, DirectoryInfo directory, int level)
        {
            string directorySeparatorChar = System.IO.Path.DirectorySeparatorChar.ToString();
            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID) + directorySeparatorChar;
            if (projectType == "F")
            {
                foreach (var directoryInfo in directory.GetDirectories("*", SearchOption.TopDirectoryOnly))
                {
                    Menu menuDirectory = new Menu();
                    menuDirectory.menuID = directoryInfo.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuDirectory.menuName = directoryInfo.Name;
                    menuDirectory.parentMenuID = directory.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuDirectory.parentMenuName = directory.Name;
                    menuDirectory.showYN = "Y";
                    menuDirectory.menuType = "D";
                    menuDirectory.directoryYN = (menuDirectory.menuType == "D" ? "Y" : "N");
                    menuDirectory.functions = "";
                    menuDirectory.projectID = "";
                    menuDirectory.fileID = "";
                    menuDirectory.sortingNo = 1;
                    menuDirectory.level = level;
                    menuDirectory.icon = "folder";
                    menuDirectory.badge = "";
                    menus.Add(menuDirectory);

                    foreach (var file in directoryInfo.GetFileInfos(SearchOption.AllDirectories, searchPattern.Split("|").Where(x => string.IsNullOrWhiteSpace(x) == false).ToArray()))
                    {
                        Menu menuItem = new Menu();
                        menuItem.menuID = file.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                        menuItem.menuName = file.Directory?.Name + file.Extension;
                        menuItem.parentMenuID = menuDirectory.menuID;
                        menuItem.parentMenuName = menuDirectory.menuName;
                        menuItem.showYN = "Y";
                        menuItem.menuType = "F";
                        menuItem.directoryYN = (menuItem.menuType == "D" ? "Y" : "N");
                        menuItem.functions = "";
                        menuItem.projectID = projectType;
                        menuItem.fileID = "";
                        menuItem.sortingNo = 1;
                        menuItem.level = level + 1;
                        menuItem.icon = "";
                        menuItem.badge = "";

                        if (menuItem.fileID.StartsWith("/") == true)
                        {
                            menuItem.fileID = menuItem.fileID.Substring(1);
                        }

                        menus.Add(menuItem);
                    }
                }
            }
            else
            {
                foreach (var file in directory.GetFileInfos(SearchOption.TopDirectoryOnly, searchPattern.Split("|").Where(x => string.IsNullOrWhiteSpace(x) == false).ToArray()))
                {
                    Menu menuItem = new Menu();
                    menuItem.menuID = file.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuItem.menuName = file.Name;
                    menuItem.parentMenuID = directory.FullName.Replace(appBasePath, "").Replace(@"\", "/");
                    menuItem.parentMenuName = directory.Name;
                    menuItem.showYN = "Y";
                    menuItem.menuType = "F";
                    menuItem.directoryYN = (menuItem.menuType == "D" ? "Y" : "N");
                    menuItem.functions = "";
                    menuItem.projectID = projectType;
                    menuItem.fileID = "";
                    menuItem.sortingNo = 1;
                    menuItem.level = level;
                    menuItem.icon = "";
                    menuItem.badge = "";

                    if (menuItem.fileID.StartsWith("/") == true)
                    {
                        menuItem.fileID = menuItem.fileID.Substring(1);
                    }

                    menus.Add(menuItem);
                }
            }
        }
    }
}
