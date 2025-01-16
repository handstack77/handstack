using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

using checkup.Entity;
using checkup.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using MediatR;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Session;
using Microsoft.Extensions.Caching.Distributed;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

using Sqids;

namespace checkup.Areas.checkup.Controllers
{
    [Area("checkup")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class AccountController : BaseController
    {
        private readonly IDataProtector dataProtector;
        private readonly MediatorClient mediatorClient;
        private readonly IMediator mediator;
        private readonly ILogger logger;
        private readonly ISequentialIdGenerator sequentialIdGenerator;
        private readonly SqidsEncoder<int> sqids;

        public AccountController(MediatorClient mediatorClient, ILogger logger, IMediator mediator, IDataProtectionProvider dataProtectionProvider, ISequentialIdGenerator sequentialIdGenerator, SqidsEncoder<int> sqids)
        {
            this.mediatorClient = mediatorClient;
            this.logger = logger;
            this.mediator = mediator;
            this.sequentialIdGenerator = sequentialIdGenerator;
            this.dataProtector = dataProtectionProvider.CreateProtector(nameof(SessionMiddleware));
            this.sqids = sqids;
        }

        [HttpGet]
        public string Get()
        {
            return "checkup AccountController";
        }

        // http://localhost:8000/checkup/api/account/invite-member?userID=dev@handstack.io&clientIP=1.1.1.67
        [HttpGet("[action]")]
        public ActionResult InviteMember(string emailID, string applicationName, string roles, string? userName)
        {
            ActionResult result = BadRequest("요청 정보 확인이 필요합니다");
            var entityResult = new EntityResult();

            string? remoteClientIP = HttpContext.GetRemoteIpAddress();

            if (string.IsNullOrEmpty(emailID) == false)
            {
                string? personNo = null;

                try
                {
                    string existUser = "0";
                    var scalarResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, "SYS.USR010.GD01", new
                    {
                        PersonID = emailID,
                    });

                    if (scalarResults == null)
                    {
                        entityResult.ErrorText = "SYS.USR010.GD01 확인 필요";
                        logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${entityResult.ErrorText}", "AccountController/InviteMember");
                        return Ok(entityResult);
                    }
                    else
                    {
                        existUser = scalarResults.ToString();
                    }

                    if (existUser == "0")
                    {
                        var nonResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, "SYS.USR010.ID01", new
                        {
                            PersonNo = sequentialIdGenerator.NewId().ToString("N"),
                            PersonID = emailID,
                            PersonName = string.IsNullOrEmpty(userName) == true ? "" : userName,
                        });

                        if (nonResults == null)
                        {
                            entityResult.ErrorText = "SYS.USR010.ID01 확인 필요";
                            logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${entityResult.ErrorText}", "AccountController/InviteMember");
                            return Ok(entityResult);
                        }
                    }

                    var dynamicResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Dynamic, "SYS.USR010.GD02", new
                    {
                        PersonID = emailID,
                    });

                    if (dynamicResults == null)
                    {
                        entityResult.ErrorText = "SYS.USR010.GD02 확인 필요";
                        logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${entityResult.ErrorText}", "AccountController/InviteMember");
                        return Ok(entityResult);
                    }
                    else if (dynamicResults.Count > 0)
                    {
                        var item = dynamicResults[0];
                        personNo = item.PersonNo;
                        userName = item.PersonName;
                    }

                    if (string.IsNullOrEmpty(userName) == true)
                    {
                        userName = emailID;
                    }

                    if (string.IsNullOrEmpty(personNo) == true || string.IsNullOrEmpty(userName) == true)
                    {
                        entityResult.ErrorText = "SYS.USR010.GD02 결과 필요";
                        logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${entityResult.ErrorText}", "AccountController/InviteMember");
                        return Ok(entityResult);
                    }

                    result = Ok(entityResult);
                }
                catch (Exception exception)
                {
                    entityResult.ErrorText = "초대 이메일 발송 오류";
                    logger.Error(exception, "[{LogCategory}] " + $"초대 이메일 발송 오류", "AccountController/InviteMember");
                    result = Ok(entityResult);
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/account/login?userID=dev@handstack.io&password=sha256&clientIP=1.1.1.67
        [AllowAnonymous]
        [HttpGet("[action]")]
        public ActionResult Login(string userID, string password, string clientIP)
        {
            ActionResult result = BadRequest("요청 정보 확인이 필요합니다");
            var entityResult = new EntityResult();

            string? remoteClientIP = HttpContext.GetRemoteIpAddress();
            if (clientIP == remoteClientIP)
            {
                string? personNo = null;

                try
                {
                    var dynamicResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Dynamic, "SYS.USR010.GD02", new
                    {
                        PersonID = userID
                    });

                    if (dynamicResults == null)
                    {
                        entityResult.ErrorText = "SYS.USR010.GD02 확인 필요";
                        logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${entityResult.ErrorText}", "AccountController/Email");
                        return Ok(entityResult);
                    }
                    else if (dynamicResults.Count > 0)
                    {
                        var item = dynamicResults[0];
                        personNo = item.PersonNo;
                        if (item.Password != password)
                        {
                            personNo = null;
                        }
                    }

                    if (string.IsNullOrEmpty(personNo) == true)
                    {
                        entityResult.ErrorText = "SYS.USR010.GD02 결과 필요";
                        logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${entityResult.ErrorText}", "AccountController/Email");
                        return Ok(entityResult);
                    }

                    string issueID = sequentialIdGenerator.NewId().ToString("N");
                    string signInUrl = Request.GetBaseUrl() + $"/checkup/api/account/sign-in?userID={userID}&issueID={issueID}&validID={issueID.EncryptAES(ModuleConfiguration.EncryptionAES256Key).EncodeBase64()}";
                    string signID = signInUrl.ToSHA256();
                    signInUrl = signInUrl + $"&signID={signID}";

                    entityResult.Message = signInUrl;
                    result = Ok(entityResult);
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] " + $"로그인 이메일 검증 오류", "AccountController/Email");
                    result = BadRequest(exception.Message);
                }
            }

            return result;
        }

        // http://localhost:8000/checkup/api/account/sign-in?userID=email@handstack.io&issueID=08db7618-9fd0-9485-ca91-a8521400025c&validID=WlGVxKVMiG3UYsrZlvY2lWg+AC9472BfOhJbj+r4mniaTdyNBuUayunuCB9oj/En&signID=5aea84ed469249b1cdb1cddf6618d4eb2f346e88fcfd8eff58580a675646f568
        [HttpGet("[action]")]
        public async Task<ActionResult> SignIn(string userID, string issueID, string validID, string signID)
        {
            ActionResult result = BadRequest();

            string errorText;
            string linkUrl = $"/checkup/redirection.html?tick={DateTime.Now.Ticks}";
            string clientIP = HttpContext.GetRemoteIpAddress().ToStringSafe();

            if (string.IsNullOrEmpty(userID) == false
                && string.IsNullOrEmpty(issueID) == false
                && string.IsNullOrEmpty(validID) == false
                && string.IsNullOrEmpty(signID) == false)
            {
                DateTime createdAt;

                try
                {
                    var issueDateTime = Guid.Parse(issueID).ToDateTime();
                    DateTime dateTime = (issueDateTime == null ? DateTime.UtcNow : (DateTime)issueDateTime);
                    var adjustHours = TimeZoneInfo.Local.GetUtcOffset(dateTime).TotalHours;
                    createdAt = dateTime.AddHours(adjustHours);

                    string signInUrl = Request.GetAbsoluteUrl().Split("&signID=")[0];
                    string hashID = signInUrl.ToSHA256();
                    string decryptIssueID = validID.DecodeBase64().DecryptAES(ModuleConfiguration.EncryptionAES256Key);

                    if (createdAt.AddDays(3) < DateTime.Now || signID != hashID || issueID != decryptIssueID)
                    {
                        result = LocalRedirect(linkUrl);
                        return result;
                    }

                    // 로그인 처리
                    var dynamicPersons = ModuleExtensions.ExecuteMetaSQL(ReturnType.Dynamic, "SYS.USR010.GD02", new
                    {
                        PersonID = userID,
                    });

                    if (dynamicPersons == null)
                    {
                        errorText = "SYS.USR010.GD02 확인 필요";
                        logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${errorText}", "AccountController/Email");
                        result = Redirect(linkUrl);
                    }
                    else if (dynamicPersons.Count > 0)
                    {
                        var user = dynamicPersons[0];
                        string memberNo = user.MemberNo;
                        // 사용자 명, 프로그램 명 확인
                        var dsMembers = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, "SYS.USR010.GD03", new
                        {
                            MemberNo = memberNo,
                            MemberName = user.PersonName,
                            EmailID = userID
                        }) as DataSet;

                        if (dsMembers == null)
                        {
                            errorText = "SYS.USR010.GD03 확인 필요";
                            logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${errorText}", "AccountController/Email");
                            result = Redirect(linkUrl);
                        }
                        else if (dsMembers.Tables.Count > 0)
                        {
                            var member = dsMembers.Tables[0].Rows[0];
                            var memberClaims = dsMembers.Tables[1].Rows;

                            if (member != null)
                            {
                                if (member.GetString("IsNewMember") == "1")
                                {
                                    var memberSequence = ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, "SYS.SYS010.GD03", new
                                    {
                                        GroupID = "M",
                                        MemberNo = memberNo
                                    });

                                    string userWorkID = sqids.Encode((int)memberSequence);

                                    ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, "SYS.USR010.UD02", new
                                    {
                                        UserWorkID = userWorkID,
                                        MemberNo = memberNo
                                    });

                                    for (int i = 0; i < memberClaims.Count; i++)
                                    {
                                        DataRow memberClaim = memberClaims[i];
                                        if (memberClaim["ClaimType"].ToStringSafe() == "UserWorkID")
                                        {
                                            memberClaim["ClaimValue"] = userWorkID;
                                            break;
                                        }
                                    }
                                }

                                linkUrl = $"/checkup/checkin.html?tick={DateTime.Now.Ticks}";

                                var userAccount = new UserAccount()
                                {
                                    ApplicationID = GlobalConfiguration.ApplicationID,
                                    UserNo = member.GetString("UserNo").ToStringSafe(),
                                    UserID = member.GetString("UserID").ToStringSafe(),
                                    UserName = member.GetString("UserName").ToStringSafe(),
                                    Email = member.GetString("Email").ToStringSafe(),
                                    Roles = new List<string>(),
                                    Claims = new Dictionary<string, string>(),
                                    LoginedAt = DateTime.Now
                                };

                                var memberRoles = member.GetString("Roles").ToStringSafe().Split(",", StringSplitOptions.RemoveEmptyEntries);
                                foreach (var memberRole in memberRoles)
                                {
                                    if (Enum.TryParse<Role>(memberRole, out var role) == true)
                                    {
                                        if (userAccount.Roles.Contains(role.ToString()) == false)
                                        {
                                            userAccount.Roles.Add(role.ToString());
                                        }
                                    }
                                }

                                var claims = new List<Claim>
                                {
                                    new Claim("UserID", userAccount.UserID),
                                    new Claim("UserName", userAccount.UserName.ToStringSafe()),
                                    new Claim("UserNo", userAccount.UserNo),
                                    new Claim("Roles", string.Join(",", userAccount.Roles.ToArray())),
                                    new Claim("LoginedAt", userAccount.LoginedAt.ToString())
                                };

                                foreach (DataRow item in memberClaims)
                                {
                                    var claimType = item.GetString("ClaimType");
                                    string claimValue = item.GetString("ClaimValue").ToStringSafe();
                                    if (string.IsNullOrEmpty(claimType) == false)
                                    {
                                        var claim = new Claim(claimType, claimValue);
                                        if (claims.Contains(claim) == false)
                                        {
                                            userAccount.Claims.Add(claimType, claimValue);
                                            claims.Add(claim);
                                        }
                                    }
                                }

                                userAccount.Celluar = member["Celluar"]?.ToString();
                                userAccount.PositionName = member["PositionName"]?.ToString();
                                userAccount.DepartmentName = member["DepartmentName"]?.ToString();
                                userAccount.CompanyName = member["CompanyName"]?.ToString();

                                var columns = member.Table.Columns;
                                userAccount.BirthDate = columns.Contains("BirthDate") == true ? member["BirthDate"]?.ToString() : null;
                                userAccount.Gender = columns.Contains("Gender") == true ? member["Gender"]?.ToString() : null;
                                userAccount.Address = columns.Contains("Address") == true ? member["Address"]?.ToString() : null;
                                userAccount.ExtendOption = columns.Contains("ExtendOption") == true ? member["ExtendOption"]?.ToString() : null;

                                // applicationUser에서 UserNo, UserID, UserName, Email, Roles를 제외한 추가 정보
                                var excludeColumnNames = new string[] { "UserNo", "UserID", "UserName", "Email", "Roles" };
                                Dictionary<string, string> dictionary = new Dictionary<string, string>();
                                dictionary.Add("ClientIP", clientIP);

                                foreach (DataColumn item in columns)
                                {
                                    if (excludeColumnNames.Contains(item.ColumnName) == false)
                                    {
                                        dictionary.Add(item.ColumnName, member.GetString(item.ColumnName).ToStringSafe());
                                    }
                                }

                                var variable = JObject.FromObject(dictionary);
                                variable.Add("InstallType", GlobalConfiguration.InstallType);
                                BearerToken bearerToken = CreateBearerToken(userAccount, claims, variable);

                                var claimsIdentity = new ClaimsIdentity(claims, $"{GlobalConfiguration.CookiePrefixName}.AuthenticationScheme");
                                var authenticationProperties = new AuthenticationProperties()
                                {
                                    AllowRefresh = true,
                                    IsPersistent = true
                                };

                                CookieOptions cookieOptions = new CookieOptions();
                                cookieOptions.HttpOnly = false;
                                cookieOptions.SameSite = SameSiteMode.Lax;

                                DateTimeOffset expiredAt = DateTime.Now.AddDays(1);
                                if (GlobalConfiguration.UserSignExpire > 0)
                                {
                                    expiredAt = DateTime.Now.AddMinutes(GlobalConfiguration.UserSignExpire);
                                }
                                else if (GlobalConfiguration.UserSignExpire < 0)
                                {
                                    int addDay = DateTime.Now.Day == userAccount.LoginedAt.Day ? 1 : 0;
                                    expiredAt = DateTime.Parse(DateTime.Now.AddDays(1).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00");
                                }

                                cookieOptions.Expires = expiredAt;
                                authenticationProperties.ExpiresUtc = expiredAt;

                                long expireTicks = ((expiredAt.Ticks - (new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).Ticks) / 10000);
                                string jsonAcount = JsonConvert.SerializeObject(userAccount);

                                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.TokenID", bearerToken.TokenID, cookieOptions);
                                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.ExpireTicks", expireTicks.ToString(), cookieOptions);
                                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.Member", jsonAcount.EncodeBase64(), cookieOptions);
                                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.Variable", JsonConvert.SerializeObject(variable).EncodeBase64(), cookieOptions);
                                WriteCookie($"{GlobalConfiguration.CookiePrefixName}.BearerToken", userAccount.UserID.EncodeBase64() + "." + JsonConvert.SerializeObject(bearerToken).EncryptAES(userAccount.UserID.PadRight(32, ' ')), cookieOptions);

                                await HttpContext.AuthenticateAsync();
                                await HttpContext.SignInAsync(new ClaimsPrincipal(claimsIdentity), authenticationProperties);

                                try
                                {
                                    HttpContext.Request.Cookies.TryGetValue(GlobalConfiguration.SessionCookieName, out string? cookieValue);
                                    if (string.IsNullOrEmpty(cookieValue) == false)
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
                                    logger.Warning(exception, "[{LogCategory}] " + $"{userAccount.UserID} 세션 키 확인 오류", "AccountController/SignIn");
                                }

                                logger.Information("[{LogCategory}] " + $"{userAccount.UserID} 로그인", "AccountController/SignIn");

                                result = LocalRedirect(linkUrl);
                            }
                        }
                    }
                }
                catch (Exception exception)
                {
                    errorText = $"만료된 요청 이거나 잘못된 요청 정보입니다 ";
                    logger.Error(exception, "[{LogCategory}] " + errorText + Request.GetAbsoluteUrl(), "AccountController/SignIn");
                    result = Redirect($"/checkup/redirection.html?tick={DateTime.Now.Ticks}");
                    return result;
                }
            }

            return result;
        }

        private BearerToken CreateBearerToken(UserAccount userAccount, List<Claim> claims, JObject variable)
        {
            BearerToken result = new BearerToken();

            var guid = sequentialIdGenerator.NewId();
            DateTime now = DateTime.Now;
            result.TokenID = $"{GlobalConfiguration.RunningEnvironment}|{GlobalConfiguration.HostName}|{GlobalConfiguration.SystemID}|{GlobalConfiguration.ApplicationID}|{guid.ToString("N")}";
            result.IssuerName = GlobalConfiguration.SystemID;
            result.ClientIP = HttpContext.GetRemoteIpAddress().ToStringSafe();
            result.CreatedAt = now;

            if (GlobalConfiguration.UserSignExpire > 0)
            {
                result.ExpiredAt = now.AddMinutes(GlobalConfiguration.UserSignExpire);
            }
            else if (GlobalConfiguration.UserSignExpire < 0)
            {
                int addDay = DateTime.Now.Day == userAccount.LoginedAt.Day ? 1 : 0;
                result.ExpiredAt = DateTime.Parse(DateTime.Now.AddDays(addDay).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00");
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

        // http://localhost:8000/checkup/api/account/signal-event
        [HttpGet("[action]")]
        public ActionResult SignalEvent()
        {
            ActionResult result = Content("", "text/html", Encoding.UTF8);

            return Ok(DateTime.Now.ToString("{0:s}"));
            // try
            // {
            //     MediatorRequest mediatorRequest = new MediatorRequest()
            //     {
            //         ActionModuleID = ModuleConfiguration.ModuleID,
            //         SubscribeEventID = "ncloudsender.Events.PublishHtmlMail",
            //     };
            // 
            //     string mailTemplate = System.IO.File.ReadAllText(PathExtensions.Combine(ModuleConfiguration.WWWRootBasePath, "verify-email.html"));
            //     mailTemplate = mailTemplate.Replace("#{이름}", "HandStack");
            //     mailTemplate = mailTemplate.Replace("#{로그인주소}", "http://localhost:8000/checkup/account/signin.html");
            // 
            //     mediatorRequest.Parameters = new Dictionary<string, object?>();
            //     mediatorRequest.Parameters.Add("SenderGroupID", "MessageSender");
            //     mediatorRequest.Parameters.Add("Title", "HTML 메일 발송");
            //     mediatorRequest.Parameters.Add("Body", mailTemplate);
            //     mediatorRequest.Parameters.Add("MailAddress", "handstack77@gmail.com");
            //     mediatorRequest.Parameters.Add("MemberName", "HandStack");
            // 
            //     await mediatorClient.PublishAsync(mediatorRequest);
            // 
            //     mediatorRequest = new MediatorRequest()
            //     {
            //         ActionModuleID = ModuleConfiguration.ModuleID,
            //         SubscribeEventID = "ncloudsender.Events.PublishSMSText"
            //     };
            //     
            //     mediatorRequest.Parameters = new Dictionary<string, object?>();
            //     mediatorRequest.Parameters.Add("SenderGroupID", "MessageSender");
            //     mediatorRequest.Parameters.Add("PhoneNo", "01000000000");
            //     mediatorRequest.Parameters.Add("Content", "블라블라");
            //     
            //     await mediatorClient.PublishAsync(mediatorRequest);
            // }
            // catch (Exception exception)
            // {
            //     result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
            //     logger.Error("[{LogCategory}] " + $"{exception.ToMessage()}", "AccountController/SignalEvent");
            // }
            // 
            // return result;
        }

        // http://localhost:8000/checkup/api/account/is-authenticated
        [HttpGet("[action]")]
        public bool IsAuthenticated()
        {
            return User.Identity == null ? false : User.Identity.IsAuthenticated;
        }

        // http://localhost:8000/checkup/api/account/logout
        [HttpGet("[action]")]
        public async Task Logout(string? cookiePrefixName = "")
        {
            if (string.IsNullOrEmpty(cookiePrefixName) == true)
            {
                cookiePrefixName = GlobalConfiguration.CookiePrefixName;
            }

            try
            {
                if (User.Identity != null && User.Identity.IsAuthenticated == true)
                {
                    var userName = User.FindFirst(ClaimTypes.Name)?.Value;
                    await HttpContext.SignOutAsync();
                    logger.Information("[{LogCategory}] " + $"{userName} 로그아웃", "Logout/OnGet");
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "Logout/OnGet");
            }

            var cookieKeys = Request.Cookies.Keys.ToList();
            for (int i = 0; i < cookieKeys.Count; i++)
            {
                string cookieKey = cookieKeys[i];
                if (cookieKey.StartsWith(cookiePrefixName) == true)
                {
                    Response.Cookies.Delete(cookieKey);
                }
            }
        }
    }
}
