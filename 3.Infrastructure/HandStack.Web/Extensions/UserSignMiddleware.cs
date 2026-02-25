using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Authorization;
using HandStack.Web.Entity;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Session;

using Newtonsoft.Json;

using Serilog;

namespace HandStack.Web.Extensions
{
    public class UserSignMiddleware
    {
        private readonly IDataProtector dataProtector;
        private readonly RequestDelegate next;

        public UserSignMiddleware(IDataProtectionProvider dataProtectionProvider, RequestDelegate next)
        {
            dataProtector = dataProtectionProvider.CreateProtector(nameof(SessionMiddleware));
            this.next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            var endpoint = httpContext.GetEndpoint();
            if (string.IsNullOrWhiteSpace(Path.GetExtension(httpContext.Request.Path)) == false || endpoint?.Metadata?.GetMetadata<IAllowAnonymous>() is object)
            {
            }
            else
            {
                var authorizeUserAttribute = endpoint?.Metadata?.GetMetadata<AuthorizeUserAttribute>();
                if (authorizeUserAttribute != null)
                {
                    var controller = httpContext.GetControllerByUrl();
                    if (controller != null)
                    {
                        if (controller.MethodInfo.GetCustomAttribute<AllowAnonymousAttribute>() != null)
                        {
                        }
                        else if (httpContext.User.Identity?.IsAuthenticated == true)
                        {

                            var userAccount = new UserAccount();
                            userAccount.ApplicationID = httpContext.User.Claims.First(x => x.Type == "ApplicationID").Value;
                            userAccount.UserAccountID = httpContext.User.Claims.First(x => x.Type == "UserAccountID").Value;
                            userAccount.UserID = httpContext.User.Claims.First(x => x.Type == "UserID").Value;
                            userAccount.UserName = httpContext.User.Claims.First(x => x.Type == "UserName").Value;
                            userAccount.Email = httpContext.User.Claims.First(x => x.Type == "Email").Value;

                            if (DateTime.TryParse(httpContext.User.Claims.First(x => x.Type == "LoginedAt").Value, out var loginedAt) == true)
                            {
                                userAccount.LoginedAt = loginedAt;
                            }

                            var tokenRoles = (httpContext.User.Claims.FirstOrDefault(x => x.Type == "Roles")?.Value).ToStringSafe().Split(",", StringSplitOptions.RemoveEmptyEntries);
                            foreach (var tokenRole in tokenRoles)
                            {
                                if (userAccount.Roles.Contains(tokenRole) == false)
                                {
                                    userAccount.Roles.Add(tokenRole);
                                }
                            }

                            var tokenClaims = JsonConvert.DeserializeObject<Dictionary<string, string>>(httpContext.User.Claims.First(x => x.Type == "Claims").Value);
                            if (tokenClaims == null || tokenClaims.Count == 0)
                            {
                                userAccount.Claims = new Dictionary<string, string>();
                            }
                            else
                            {
                                userAccount.Claims = tokenClaims;
                            }

                            userAccount.Celluar = httpContext.User.Claims.FirstOrDefault(x => x.Type == "Celluar")?.Value;
                            userAccount.PositionName = httpContext.User.Claims.FirstOrDefault(x => x.Type == "PositionName")?.Value;
                            userAccount.DepartmentName = httpContext.User.Claims.FirstOrDefault(x => x.Type == "DepartmentName")?.Value;
                            userAccount.CompanyName = httpContext.User.Claims.FirstOrDefault(x => x.Type == "CompanyName")?.Value;
                            userAccount.BirthDate = httpContext.User.Claims.FirstOrDefault(x => x.Type == "BirthDate")?.Value;
                            userAccount.Gender = httpContext.User.Claims.FirstOrDefault(x => x.Type == "Gender")?.Value;
                            userAccount.Address = httpContext.User.Claims.FirstOrDefault(x => x.Type == "Address")?.Value;
                            userAccount.ExtendOption = httpContext.User.Claims.FirstOrDefault(x => x.Type == "ExtendOption")?.Value;

                            if (authorizeUserAttribute?.Roles != null)
                            {
                                var accountRoles = new List<string>();
                                foreach (var item in userAccount.Roles)
                                {
                                    accountRoles.Add(item.ToString());
                                }

                                var authorizeRoles = new List<string>();
                                foreach (var item in authorizeUserAttribute.Roles)
                                {
                                    authorizeRoles.Add(item.ToString());
                                }

                                if (authorizeRoles.Any() == true && authorizeRoles.Any(accountRoles.Contains) == false)
                                {
                                    httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                    await httpContext.Response.WriteAsync("401 Unauthorized");
                                    return;
                                }
                            }
                        }
                        else
                        {
                            var member = httpContext.Request.Cookies[$"{GlobalConfiguration.CookiePrefixName}.Member"];
                            if (string.IsNullOrWhiteSpace(member))
                            {
                                httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                await httpContext.Response.WriteAsync("401 Unauthorized");
                                return;
                            }
                            else
                            {
                                var userAccount = JsonConvert.DeserializeObject<UserAccount>(member.DecodeBase64());
                                if (userAccount != null)
                                {
                                    if (authorizeUserAttribute?.Roles != null)
                                    {
                                        var accountRoles = new List<string>();
                                        foreach (var item in userAccount.Roles)
                                        {
                                            accountRoles.Add(item.ToString());
                                        }

                                        var authorizeRoles = new List<string>();
                                        foreach (var item in authorizeUserAttribute.Roles)
                                        {
                                            authorizeRoles.Add(item.ToString());
                                        }

                                        if (authorizeRoles.Any() == true && authorizeRoles.Any(accountRoles.Contains) == false)
                                        {
                                            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                            await httpContext.Response.WriteAsync("401 Unauthorized");
                                            return;
                                        }
                                    }

                                    try
                                    {
                                        var lastedLoginedAt = userAccount.LoginedAt.DateDiff(PartOfDateTime.Second, DateTime.Now);
                                        var allowLimitedAt = DateTime.Parse(userAccount.LoginedAt.AddDays(1).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00").DateDiff(PartOfDateTime.Second, DateTime.Now);
                                        if ((GlobalConfiguration.UserSignExpire > 0 && GlobalConfiguration.UserSignExpire < lastedLoginedAt) || allowLimitedAt > lastedLoginedAt)
                                        {
                                            await httpContext.SignOutAsync();
                                            foreach (var cookieKey in httpContext.Request.Cookies.Keys)
                                            {
                                                if (cookieKey.StartsWith($"{GlobalConfiguration.CookiePrefixName}.") == true)
                                                {
                                                    httpContext.Response.Cookies.Delete(cookieKey);
                                                }
                                            }

                                            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                            await httpContext.Response.WriteAsync("401 Unauthorized");
                                            return;
                                        }
                                        else
                                        {
                                            var claims = new List<Claim>();
                                            foreach (var item in userAccount.Claims)
                                            {
                                                var claimType = item.Key;
                                                var claimValue = item.Value;
                                                if (!string.IsNullOrWhiteSpace(claimType))
                                                {
                                                    var claim = new Claim(claimType, claimValue);
                                                    if (claims.Contains(claim) == false)
                                                    {
                                                        claims.Add(claim);
                                                    }
                                                }
                                            }

                                            var claimsIdentity = new ClaimsIdentity(claims, $"{GlobalConfiguration.CookiePrefixName}.AuthenticationScheme");
                                            var authenticationProperties = new AuthenticationProperties()
                                            {
                                                AllowRefresh = true,
                                                IsPersistent = true
                                            };


                                            DateTimeOffset expiredAt = DateTime.Now.AddDays(1);
                                            if (GlobalConfiguration.UserSignExpire > 0)
                                            {
                                                expiredAt = DateTime.Now.AddMinutes(GlobalConfiguration.UserSignExpire - lastedLoginedAt);
                                            }
                                            else if (GlobalConfiguration.UserSignExpire < 0)
                                            {
                                                var addDay = DateTime.Now.Day == userAccount.LoginedAt.Day ? 1 : 0;
                                                expiredAt = DateTime.Parse(DateTime.Now.AddDays(1).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00");
                                            }

                                            authenticationProperties.ExpiresUtc = expiredAt;

                                            await httpContext.AuthenticateAsync();
                                            await httpContext.SignInAsync(new ClaimsPrincipal(claimsIdentity), authenticationProperties);

                                            try
                                            {
                                                httpContext.Request.Cookies.TryGetValue(GlobalConfiguration.SessionCookieName, out var cookieValue);
                                                if (!string.IsNullOrWhiteSpace(cookieValue))
                                                {
                                                    var protectedData = Convert.FromBase64String(cookieValue.SessionDecryptPad());
                                                    var unprotectedData = dataProtector.Unprotect(protectedData);
                                                    userAccount.SessionKey = Encoding.UTF8.GetString(unprotectedData);

                                                    var jsonAcount = JsonConvert.SerializeObject(userAccount);
                                                    if (httpContext.Session.IsAvailable == true)
                                                    {
                                                        httpContext.Session.SetString($"{GlobalConfiguration.CookiePrefixName}.Member", jsonAcount);
                                                    }

                                                    var cookieOptions = new CookieOptions();
                                                    cookieOptions.HttpOnly = false;
                                                    cookieOptions.SameSite = SameSiteMode.Lax;
                                                    cookieOptions.Expires = expiredAt;
                                                    httpContext.Response.Cookies.Append($"{GlobalConfiguration.CookiePrefixName}.Member", jsonAcount.EncodeBase64(), cookieOptions);
                                                }
                                            }
                                            catch (Exception exception)
                                            {
                                                Log.Warning(exception, "[{LogCategory}] " + $"{userAccount.UserID} 세션 키 확인 오류", "UserSignMiddleware/InvokeAsync");
                                            }
                                        }
                                    }
                                    catch (Exception exception)
                                    {
                                        Log.Warning("[{LogCategory}] " + $"{GlobalConfiguration.CookiePrefixName}.Member 복구 또는 로그아웃 처리 실패 " + exception.ToMessage(), "UserSignMiddleware/InvokeAsync");

                                        httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                        await httpContext.Response.WriteAsync("401 Unauthorized");
                                        return;
                                    }
                                }
                                else
                                {
                                    httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                    await httpContext.Response.WriteAsync("401 Unauthorized");
                                    return;
                                }
                            }
                        }


                        if (httpContext.User.Identity?.IsAuthenticated == false && controller.MethodInfo.GetCustomAttribute<AllowAnonymousAttribute>() == null)
                        {

                        }
                    }
                    else
                    {
                        var unAuthorizedPath = string.Empty;
                        var requestPath = httpContext.Request.Path.ToString();
                        var tenantAppRequestPath = $"/{GlobalConfiguration.TenantAppRequestPath}/";
                        if (requestPath.StartsWith(tenantAppRequestPath) == true)
                        {
                            var splits = requestPath.Split('/');
                            var userWorkID = splits.Length > 3 ? splits[2] : "";
                            var applicationID = splits.Length > 3 ? splits[3] : "";
                            if (!string.IsNullOrWhiteSpace(applicationID))
                            {
                                var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                                var directoryInfo = new DirectoryInfo(appBasePath);
                                if (directoryInfo.Exists == true)
                                {
                                    var tenantAppBasePath = $"/{GlobalConfiguration.TenantAppRequestPath}/{userWorkID}/{applicationID}/wwwroot";
                                    unAuthorizedPath = $"{tenantAppBasePath}/unauthorized.html";
                                }
                            }
                        }
                        else
                        {
                            unAuthorizedPath = $"/unauthorized.html";
                        }

                        if (File.Exists(httpContext.MapPath(unAuthorizedPath)) == true)
                        {
                            httpContext.Response.Redirect(unAuthorizedPath);
                        }
                        else
                        {
                            await httpContext.Response.WriteAsync("401 Unauthorized");
                        }
                    }
                }
            }

            await next(httpContext);
        }
    }
}

