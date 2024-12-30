using System;
using System.Collections.Generic;
using System.Linq;

using HandStack.Web.Entity;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace HandStack.Web.Authorization
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
    public class AuthorizeUserAttribute : Attribute, IAuthorizationFilter
    {
        public readonly IList<Role> Roles;

        public AuthorizeUserAttribute(params Role[] roles)
        {
            this.Roles = roles ?? new Role[] { };
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var allowAnonymous = context.ActionDescriptor.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any();
            if (allowAnonymous == false)
            {
                var account = context.HttpContext.Items["UserAccount"] as UserAccount;
                if (account == null)
                {
                    context.Result = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };
                }
                else if (Roles.Any() == true)
                {
                    bool isAuthorized = false;
                    for (int i = 0; i < account.Roles.Count; i++)
                    {
                        var memberRole = account.Roles[i];
                        if (Enum.TryParse<Role>(memberRole, out var role) == true)
                        {
                            isAuthorized = Roles.Contains(role);
                            break;
                        }
                    }

                    if (isAuthorized == false)
                    {
                        context.Result = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };
                    }
                }
            }
        }
    }
}
