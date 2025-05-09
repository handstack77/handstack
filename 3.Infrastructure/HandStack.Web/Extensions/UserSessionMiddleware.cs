using System;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Entity;

using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Session;

using Newtonsoft.Json;

using Serilog;

namespace HandStack.Web.Extensions
{
    public class UserSessionMiddleware
    {

        private readonly IDataProtector dataProtector;
        private readonly RequestDelegate next;

        public UserSessionMiddleware(RequestDelegate next, IDataProtectionProvider dataProtectionProvider)
        {
            this.next = next;
            dataProtector = dataProtectionProvider.CreateProtector(nameof(SessionMiddleware));
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            if (httpContext.Request.Path.Value != null && httpContext.Session.IsAvailable == true)
            {
                var member = httpContext.Request.Cookies[$"{GlobalConfiguration.CookiePrefixName}.Member"];
                if (string.IsNullOrEmpty(member) == false)
                {
                    try
                    {
                        var userAccount = JsonConvert.DeserializeObject<UserAccount>(member.DecodeBase64());
                        if (userAccount != null)
                        {
                            var userSessionKey = userAccount.SessionKey;
                            string? contextSessionKey = null;

                            try
                            {
                                httpContext.Request.Cookies.TryGetValue(GlobalConfiguration.SessionCookieName, out var cookieValue);
                                if (string.IsNullOrEmpty(cookieValue) == false)
                                {
                                    var protectedData = Convert.FromBase64String(cookieValue.SessionDecryptPad());
                                    var unprotectedData = dataProtector.Unprotect(protectedData);
                                    contextSessionKey = System.Text.Encoding.UTF8.GetString(unprotectedData);
                                }
                            }
                            catch
                            {
                            }

                            if (string.IsNullOrEmpty(contextSessionKey) == false && userSessionKey != contextSessionKey)
                            {
                                userAccount.SessionKey = contextSessionKey;
                                var jsonAcount = JsonConvert.SerializeObject(userAccount);
                                if (httpContext.Session.IsAvailable == true)
                                {
                                    httpContext.Session.SetString($"{GlobalConfiguration.CookiePrefixName}.Member", jsonAcount);
                                }

                                var cookieOptions = new CookieOptions();
                                cookieOptions.HttpOnly = false;
                                cookieOptions.SameSite = SameSiteMode.Lax;

                                if (GlobalConfiguration.UserSignExpire > 0)
                                {
                                    cookieOptions.Expires = DateTime.Now.AddMinutes(GlobalConfiguration.UserSignExpire);
                                }
                                else if (GlobalConfiguration.UserSignExpire < 0)
                                {
                                    var addDay = DateTime.Now.Day == userAccount.LoginedAt.Day ? 1 : 0;
                                    cookieOptions.Expires = DateTime.Parse(DateTime.Now.AddDays(1).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00");
                                }
                                else
                                {
                                    cookieOptions.Expires = DateTime.Now.AddDays(1);
                                }

                                httpContext.Response.Cookies.Append($"{GlobalConfiguration.CookiePrefixName}.Member", jsonAcount.EncodeBase64(), cookieOptions);
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Warning("[{LogCategory}] " + "SessionKey 사용자 갱신 처리 실패 " + exception.ToMessage(), "UserSessionMiddleware/InvokeAsync");
                    }
                }
            }

            await next(httpContext);
        }
    }
}
