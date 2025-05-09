using System.IO;
using System.Linq;
using System.Threading.Tasks;

using checkup.Services;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;

using Microsoft.AspNetCore.Http;

namespace checkup.Extensions
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;

        public JwtMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext, IJwtManager jwtManager)
        {
            var requestPath = httpContext.Request.Path.ToString();
            var tenantAppRequestPath = $"/{GlobalConfiguration.TenantAppRequestPath}/";
            if (requestPath.StartsWith(tenantAppRequestPath) == true)
            {
                var splits = requestPath.SplitAndTrim('/');
                var userWorkID = splits.Count > 2 ? splits[1] : "";
                var applicationID = splits.Count > 2 ? splits[2] : "";
                if (string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
                {
                    var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    var directoryInfo = new DirectoryInfo(appBasePath);
                    if (directoryInfo.Exists == false)
                    {
                        httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
                        return;
                    }
                    else
                    {
                        var token = httpContext.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                        if (token != null)
                        {
                            var isValidateToken = await jwtManager.ValidateJwtToken(token, userWorkID, applicationID);
                            if (isValidateToken == true)
                            {
                                httpContext.Items["JwtAccount"] = await jwtManager.GetUserAccount(token, userWorkID, applicationID);
                            }
                        }
                    }
                }
            }

            await _next(httpContext);
        }
    }
}

