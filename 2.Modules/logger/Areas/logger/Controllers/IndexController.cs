using HandStack.Web.Common;

using Mediator;

using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace logger.Areas.logger.Controllers
{
    [Area("logger")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class IndexController(IMediator mediator, ILogger logger) : BaseController
    {
        private readonly IMediator mediator = mediator;
        private readonly ILogger logger = logger;

        // http://localhost:8421/logger/api/index
        [HttpGet]
        public string Get()
        {
            return "logger IndexController";
        }
    }
}
