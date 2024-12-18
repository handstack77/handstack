using HandStack.Web.Common;

using MediatR;

using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace prompter.Areas.prompter.Controllers
{
    [Area("prompter")]
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

        // http://localhost:8000/prompter/api/index
        [HttpGet]
        public string Get()
        {
            return "prompter IndexController";
        }
    }
}
