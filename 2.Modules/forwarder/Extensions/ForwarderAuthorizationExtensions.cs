using System;
using System.Linq;

using forwarder.Entity;

using HandStack.Web.Extensions;
using HandStack.Web.Helper;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;

namespace forwarder.Extensions
{
    public static class ForwarderAuthorizationExtensions
    {
        public static bool TryAuthorizeBearerToken(this HttpContext httpContext, out BearerToken? bearerToken, out string message)
        {
            bearerToken = null;
            message = "BearerToken 헤더 확인 필요";

            var isAllowClientIP = ModuleConfiguration.AllowClientIP.Any(p => p == "*" || p == httpContext.GetRemoteIpAddress());
            if (isAllowClientIP == false)
            {
                message = "허용된 클라이언트 IP 확인 필요";
                return false;
            }

            var token = httpContext.Request.Headers["BearerToken"].ToString();
            if (string.IsNullOrWhiteSpace(token) == true)
            {
                return false;
            }

            if (TokenHelper.TryParseToken(token, out bearerToken) == false || bearerToken == null)
            {
                message = "BearerToken 기본 무결성 확인 필요";
                return false;
            }

            if (bearerToken.ExpiredAt.HasValue == true && bearerToken.ExpiredAt.Value < DateTime.Now)
            {
                bearerToken = null;
                message = "BearerToken 만료 확인 필요";
                return false;
            }

            if (bearerToken.Policy == null || string.IsNullOrWhiteSpace(bearerToken.Policy.UserID) == true)
            {
                bearerToken = null;
                message = "BearerToken 사용자 정보 확인 필요";
                return false;
            }

            if (string.IsNullOrWhiteSpace(bearerToken.Policy.UserNo) == true)
            {
                bearerToken = null;
                message = "BearerToken 사용자 번호 확인 필요";
                return false;
            }

            if (bearerToken.CreatedAt.HasValue == false)
            {
                bearerToken = null;
                message = "BearerToken 생성일시 확인 필요";
                return false;
            }

            message = "";
            return true;
        }
    }
}
