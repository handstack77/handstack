using System;
using System.Collections.Generic;
using System.Linq;

using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace HandStack.Web.Authorization
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
    public class AuthorizeUserAttribute(params Role[] roles) : Attribute, IAuthorizationFilter
    {
        public readonly IList<Role> Roles = roles ?? Array.Empty<Role>();

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            ArgumentNullException.ThrowIfNull(context);

            var allowAnonymous = context.ActionDescriptor.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any();
            if (allowAnonymous == false)
            {
                if (context.HttpContext.Items["UserAccount"] is not UserAccount account)
                {
                    context.Result = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };
                }
                else if (Roles.Any() == true)
                {
                    var isAuthorized = false;
                    for (var i = 0; i < account.Roles.Count; i++)
                    {
                        var memberRole = account.Roles[i];
                        var transactionMinRoleValue = Role.User.GetRoleValue(account.Roles, true);
                        if (Enum.TryParse<Role>(memberRole, out var parsedUserRole) == true)
                        {
                            var userRoleValue = (int)parsedUserRole;
                            if (userRoleValue <= transactionMinRoleValue)
                            {
                                isAuthorized = true;
                                break;
                            }
                        }

                        if (isAuthorized == false && account.Roles.Contains(memberRole) == true)
                        {
                            isAuthorized = true;
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
