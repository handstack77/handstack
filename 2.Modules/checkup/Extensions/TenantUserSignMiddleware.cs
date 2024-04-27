using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;

using Newtonsoft.Json;

using Serilog;

namespace checkup.Extensions
{
    public class TenantUserSignMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantUserSignMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            string requestPath = httpContext.Request.Path.ToString();
            string tenantAppRequestPath = $"/{GlobalConfiguration.TenantAppRequestPath}/";
            if (requestPath.StartsWith(tenantAppRequestPath) == true)
            {
                var splits = requestPath.SplitAndTrim('/');
                string userWorkID = splits.Count > 2 ? splits[1] : "";
                string applicationID = splits.Count > 2 ? splits[2] : "";
                if (string.IsNullOrEmpty(applicationID) == false)
                {
                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                    if (directoryInfo.Exists == false)
                    {
                        httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
                        return;
                    }
                    else
                    {
                        string pathName = splits.Count > 3 ? splits[3] : "";
                        if (pathName.StartsWith("app.environment.json") == true)
                        {

                        }
                        else
                        {
                            string tenantID = $"{userWorkID}|{applicationID}";
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = await File.ReadAllTextAsync(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null && appSetting.ApplicationID == applicationID)
                                {
                                    if (appSetting.AllowAnonymousPath?.Contains("*") == false)
                                    {
                                        string tenantAppBasePath = $"/{GlobalConfiguration.TenantAppRequestPath}/{userWorkID}/{applicationID}/wwwroot";
                                        string? member = httpContext.Request.Cookies[$"{applicationID}.Member"];
                                        if (string.IsNullOrEmpty(member) == true)
                                        {
                                            bool isAllowAnonymous = false;
                                            string parent = "";
                                            var parents = requestPath.Replace(new FileInfo(requestPath).Name, "*").Replace(tenantAppBasePath, "").SplitAndTrim('/');
                                            for (int i = 0; i < parents.Count; i++)
                                            {
                                                parent += parents[i] + "/";
                                                if (appSetting.AllowAnonymousPath?.Contains(parent + "*") == true)
                                                {
                                                    isAllowAnonymous = true;
                                                    break;
                                                }
                                            }

                                            if (isAllowAnonymous == true || appSetting.AllowAnonymousPath?.Contains(requestPath.Replace(tenantAppBasePath, "")) == true)
                                            {
                                            }
                                            else
                                            {
                                                var requestRefererUrl = httpContext.Request.Headers.Referer.ToString();
                                                if (string.IsNullOrEmpty(requestRefererUrl) == true)
                                                {
                                                    httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                                    return;
                                                }
                                                else
                                                {
                                                    string requestAbsoluteUrl = httpContext.Request.GetBaseUrl() + tenantAppBasePath;
                                                    if (requestRefererUrl.Contains("/view/") == false && appSetting.AllowAnonymousPath?.Contains(requestRefererUrl.Replace(requestAbsoluteUrl, "")) == false)
                                                    {
                                                        httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                                        return;
                                                    }
                                                }
                                            }
                                        }
                                        else
                                        {
                                            try
                                            {
                                                UserAccount? userAccount = JsonConvert.DeserializeObject<UserAccount>(member.DecodeBase64());
                                                if (userAccount != null)
                                                {
                                                    var lastedLoginTime = userAccount.LoginedAt.DateDiff(PartOfDateTime.Second, DateTime.Now);
                                                    var allowLimitTime = DateTime.Parse(userAccount.LoginedAt.AddDays(1).ToString("yyyy-MM-dd") + "T" + GlobalConfiguration.UserSignExpire.ToString().Replace("-", "").PadLeft(2, '0') + ":00:00").DateDiff(PartOfDateTime.Second, DateTime.Now);
                                                    if ((GlobalConfiguration.UserSignExpire > 0 && GlobalConfiguration.UserSignExpire < lastedLoginTime) || allowLimitTime > lastedLoginTime)
                                                    {
                                                        foreach (var cookieKey in httpContext.Request.Cookies.Keys)
                                                        {
                                                            if (cookieKey.StartsWith($"{applicationID}.") == true)
                                                            {
                                                                httpContext.Response.Cookies.Delete(cookieKey);
                                                            }
                                                        }

                                                        string signInPath = $"{tenantAppBasePath}signin.html";
                                                        if (File.Exists(httpContext.MapPath(signInPath)) == true)
                                                        {
                                                            httpContext.Response.Redirect(signInPath);
                                                        }
                                                        else
                                                        {
                                                            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                                        }

                                                        return;
                                                    }
                                                    else
                                                    {
                                                        httpContext.Items["UserAccount"] = userAccount;
                                                    }
                                                }
                                            }
                                            catch (Exception exception)
                                            {
                                                Log.Warning("[{LogCategory}] " + $"{applicationID}.Member 검증 확인 필요 " + exception.ToMessage(), "Startup/Configure");
                                            }
                                        }
                                    }
                                }
                            }
                            else
                            {
                                httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
                                return;
                            }
                        }
                    }
                }
            }

            await _next(httpContext);
        }
    }
}

