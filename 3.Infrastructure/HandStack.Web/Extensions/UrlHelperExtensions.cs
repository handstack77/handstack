using System;
using Microsoft.AspNetCore.Mvc;

namespace HandStack.Web.Extensions
{
    public static class UrlHelperExtensions
    {
        public static string? GetLocalUrl(this IUrlHelper urlHelper, string localUrl)
        {
            ArgumentNullException.ThrowIfNull(urlHelper);

            if (!urlHelper.IsLocalUrl(localUrl))
            {
                return urlHelper.Page("/Index");
            }

            return localUrl;
        }
    }
}
