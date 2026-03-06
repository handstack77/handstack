using HandStack.Web.Common;

using Microsoft.AspNetCore.Mvc;

namespace forwarder.Areas.forwarder.Controllers
{
    [Area("forwarder")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class IndexController : BaseController
    {
        // 모듈 상태를 간단히 확인할 때 사용하는 기본 엔드포인트다.
        [HttpGet]
        public string Get()
        {
            return "forwarder 기본 컨트롤러";
        }
    }
}
