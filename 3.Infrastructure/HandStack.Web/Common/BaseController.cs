using System.Globalization;

using HandStack.Web.Entity;

using Microsoft.AspNetCore.Mvc;


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
    }
}
