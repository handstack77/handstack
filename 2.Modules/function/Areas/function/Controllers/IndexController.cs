using HandStack.Web.Common;

using MediatR;

using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace function.Areas.function.Controllers
{
    [Area("function")]
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

        // http://localhost:8000/function/api/index
        [HttpGet]
        public string Get()
        {
            return "function IndexController";
        }
    }
}
