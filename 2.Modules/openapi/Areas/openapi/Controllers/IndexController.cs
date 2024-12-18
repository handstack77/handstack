using HandStack.Web.Common;

using MediatR;

using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace openapi.Areas.openapi.Controllers
{
    [Area("openapi")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class IndexController : BaseController
    {
        private readonly IMediator mediator;
        private readonly ILogger logger;

        public IndexController(IMediator mediator, ILogger logger)
        {
            this.mediator = mediator;
            this.logger = logger;
        }

        // http://localhost:8000/openapi/api/index
        [HttpGet]
        public string Get()
        {
            return "openapi IndexController";
        }
    }
}
