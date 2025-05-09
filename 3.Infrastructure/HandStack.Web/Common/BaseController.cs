using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Entity;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace HandStack.Web.Common
{
    [Controller]
    public abstract class BaseController : ControllerBase
    {
        public UserAccount? UserAccount => HttpContext.Items["UserAccount"] as UserAccount;

        public BaseController()
        {
            CultureInfo.DefaultThreadCurrentCulture = CultureInfo.DefaultThreadCurrentUICulture = new CultureInfo("ko-KR");
        }

        protected async Task<bool> VerifyUserRole(HttpContext? httpContext, string scheme, string roleID)
        {
            var result = false;
            if (httpContext != null)
            {
                try
                {
                    var authenticateResult = await httpContext.AuthenticateAsync(scheme);
                    if (authenticateResult.Succeeded == true)
                    {
                        var principal = authenticateResult.Principal;
                        if (principal?.Identity?.IsAuthenticated == true)
                        {
                            var roles = principal.FindFirst("Roles")?.Value;
                            if (roles != null)
                            {
                                if (roles.SplitComma().IndexOf(roleID) > -1)
                                {
                                    result = true;
                                }
                            }
                        }
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error(exception, "[{LogCategory}] " + $"scheme: {scheme}, roleID: {roleID} 검증 오류", "BaseController/VerifyUserRole");
                }
            }

            return result;
        }

        protected async Task<List<Claim>> GetPrincipalClaims(HttpContext? httpContext, string scheme)
        {
            var result = new List<Claim>();
            if (httpContext != null)
            {
                try
                {
                    var authenticateResult = await httpContext.AuthenticateAsync(scheme);
                    if (authenticateResult.Succeeded == true)
                    {
                        var principal = authenticateResult.Principal;
                        if (principal?.Identity?.IsAuthenticated == true)
                        {
                            result = principal.Claims.ToList();
                        }
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error(exception, "[{LogCategory}] " + $"scheme: {scheme} 확인 오류", "BaseController/GetPrincipalClaims");
                }
            }

            return result;
        }
    }
}
