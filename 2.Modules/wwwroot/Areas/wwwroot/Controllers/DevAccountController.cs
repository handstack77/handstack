using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.Helper;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Session;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

using wwwroot.Entity;

namespace wwwroot.Areas.wwwroot.Controllers
{
    // 개발 목적 테스트 계정 자동 로그인. AppSettings:IsEnabledDevAutoSignIn == true 이고 RunningEnvironment == "D"(개발)일 때만 동작한다.
    // 운영/스테이징에서는 appsettings.json 기본값(false)과 RunningEnvironment 이중 게이트로 항상 비활성화된다.
    [Area("wwwroot")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class DevAccountController : BaseController
    {
        private readonly IDataProtector dataProtector;
        private readonly ILogger logger;
        private readonly ISequentialIdGenerator sequentialIdGenerator;

        public DevAccountController(ILogger logger, IDataProtectionProvider dataProtectionProvider, ISequentialIdGenerator sequentialIdGenerator)
        {
            this.logger = logger;
            this.dataProtector = dataProtectionProvider.CreateProtector(nameof(SessionMiddleware));
            this.sequentialIdGenerator = sequentialIdGenerator;
        }

        // http://localhost:8421/wwwroot/api/dev-account/sign-in?returnUrl=/
        [HttpGet("[action]")]
        public async Task<ActionResult> SignIn(string? returnUrl = "/")
        {
            if (GlobalConfiguration.IsEnabledDevAutoSignIn == false || GlobalConfiguration.RunningEnvironment != "D")
            {
                return NotFound();
            }

            var linkUrl = (string.IsNullOrWhiteSpace(returnUrl) == false && Url.IsLocalUrl(returnUrl) == true) ? returnUrl : "/";
            var clientIP = HttpContext.GetRemoteIpAddress().ToStringSafe();
            var config = ModuleConfiguration.DevAutoSignIn;

            if (string.IsNullOrWhiteSpace(config.UserID) == true)
            {
                logger.Error("[{LogCategory}] " + "module.json ModuleConfig.DevAutoSignIn.UserID 확인 필요", "DevAccountController/SignIn");
                return BadRequest("module.json ModuleConfig.DevAutoSignIn 설정 확인 필요");
            }

            try
            {
                var userAccount = new UserAccount()
                {
                    ApplicationID = GlobalConfiguration.ApplicationID,
                    UserNo = config.UserNo,
                    UserID = config.UserID,
                    UserName = string.IsNullOrWhiteSpace(config.UserName) ? config.UserID : config.UserName,
                    Email = config.Email,
                    Roles = new List<string>(config.Roles),
                    Claims = new Dictionary<string, string>(),
                    LoginedAt = DateTime.Now,
                    Celluar = string.IsNullOrWhiteSpace(config.Celluar) ? null : config.Celluar,
                    PositionName = string.IsNullOrWhiteSpace(config.PositionName) ? null : config.PositionName,
                    DepartmentName = string.IsNullOrWhiteSpace(config.DepartmentName) ? null : config.DepartmentName,
                    CompanyName = string.IsNullOrWhiteSpace(config.CompanyName) ? null : config.CompanyName,
                    BirthDate = string.IsNullOrWhiteSpace(config.BirthDate) ? null : config.BirthDate,
                    Gender = string.IsNullOrWhiteSpace(config.Gender) ? null : config.Gender,
                    Address = string.IsNullOrWhiteSpace(config.Address) ? null : config.Address,
                    ExtendOption = string.IsNullOrWhiteSpace(config.ExtendOption) ? null : config.ExtendOption
                };

                var claims = new List<Claim>
                {
                    new Claim("UserID", userAccount.UserID),
                    new Claim("UserName", userAccount.UserName.ToStringSafe()),
                    new Claim("UserNo", userAccount.UserNo.ToStringSafe()),
                    new Claim("Roles", string.Join(",", userAccount.Roles.ToArray())),
                    new Claim("LoginedAt", userAccount.LoginedAt.ToString()),
                    new Claim("IsDevAutoSignIn", "true")
                };
                userAccount.Claims.Add("IsDevAutoSignIn", "true");

                var dictionary = new Dictionary<string, string>();
                dictionary.Add("ClientIP", clientIP);

                var variable = JObject.FromObject(dictionary);
                variable.Add("InstallType", GlobalConfiguration.InstallType);
                var bearerToken = CreateBearerToken(userAccount, claims, variable);

                var claimsIdentity = new ClaimsIdentity(claims, $"{GlobalConfiguration.CookiePrefixName}.AuthenticationScheme");
                var authenticationProperties = new AuthenticationProperties()
                {
                    AllowRefresh = true,
                    IsPersistent = true
                };

                var cookieOptions = new CookieOptions();
                cookieOptions.HttpOnly = false;
                cookieOptions.SameSite = SameSiteMode.Lax;

                DateTimeOffset expiredAt = DateTime.Now.AddDays(1);
                if (GlobalConfiguration.UserSignExpire > 0)
                {
                    expiredAt = DateTime.Now.AddMinutes(GlobalConfiguration.UserSignExpire);
                }
                else if (GlobalConfiguration.UserSignExpire < 0)
                {
                    var addDay = DateTime.Now.Day == userAccount.LoginedAt.Day ? 1 : 0;
                    expiredAt = (DateTime.Now.AddDays(1).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00").ToDateTimeSafe(DateTime.Now.AddDays(1));
                }

                cookieOptions.Expires = expiredAt;
                authenticationProperties.ExpiresUtc = expiredAt;

                var expireTicks = ((expiredAt.Ticks - (new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).Ticks) / 10000);
                var jsonAcount = JsonConvert.SerializeObject(userAccount);

                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.TokenID", bearerToken.TokenID, cookieOptions);
                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.ExpireTicks", expireTicks.ToString(), cookieOptions);
                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.Member", jsonAcount.EncodeBase64(), cookieOptions);
                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.Variable", JsonConvert.SerializeObject(variable).EncodeBase64(), cookieOptions);
                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.BearerToken", TokenHelper.CreateBearerToken(userAccount.UserID, bearerToken), cookieOptions);

                await HttpContext.AuthenticateAsync();
                await HttpContext.SignInAsync(new ClaimsPrincipal(claimsIdentity), authenticationProperties);

                try
                {
                    HttpContext.Request.Cookies.TryGetValue(GlobalConfiguration.SessionCookieName, out var cookieValue);
                    if (!string.IsNullOrWhiteSpace(cookieValue))
                    {
                        var protectedData = Convert.FromBase64String(cookieValue.SessionDecryptPad());
                        var unprotectedData = dataProtector.Unprotect(protectedData);
                        userAccount.SessionKey = Encoding.UTF8.GetString(unprotectedData);

                        if (HttpContext.Session.IsAvailable == true)
                        {
                            HttpContext.Session.SetString($"{GlobalConfiguration.CookiePrefixName}.Member", jsonAcount);
                        }
                    }
                }
                catch (Exception exception)
                {
                    logger.Warning(exception, "[{LogCategory}] " + $"{userAccount.UserID} 세션 키 확인 오류", "DevAccountController/SignIn");
                }

                logger.Information("[{LogCategory}] " + $"{userAccount.UserID} 개발 테스트 계정 자동 로그인", "DevAccountController/SignIn");

                return LocalRedirect(linkUrl);
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + "개발 테스트 계정 자동 로그인 오류", "DevAccountController/SignIn");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        private BearerToken CreateBearerToken(UserAccount userAccount, List<Claim> claims, JObject variable)
        {
            var result = new BearerToken();

            var guid = sequentialIdGenerator.NewId();
            var now = DateTime.Now;
            result.TokenID = $"{GlobalConfiguration.RunningEnvironment}|{GlobalConfiguration.HostName}|{GlobalConfiguration.SystemID}|{GlobalConfiguration.ApplicationID}|{guid:N}";
            result.IssuerName = GlobalConfiguration.SystemID;
            result.ClientIP = HttpContext.GetRemoteIpAddress().ToStringSafe();
            result.CreatedAt = now;

            if (GlobalConfiguration.UserSignExpire > 0)
            {
                result.ExpiredAt = now.AddMinutes(GlobalConfiguration.UserSignExpire);
            }
            else if (GlobalConfiguration.UserSignExpire < 0)
            {
                var addDay = DateTime.Now.Day == userAccount.LoginedAt.Day ? 1 : 0;
                result.ExpiredAt = (DateTime.Now.AddDays(addDay).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00").ToDateTimeSafe(DateTime.Now.AddDays(addDay));
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
            foreach (var claim in claims)
            {
                result.Policy.Claims.Add(claim.Type, claim.Value);
            }

            result.Variable = variable;

            result.Policy.VerifyTokenID = JsonConvert.SerializeObject(result).ToSHA256();
            return result;
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
    }
}
