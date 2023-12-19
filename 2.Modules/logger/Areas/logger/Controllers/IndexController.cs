using MediatR;

using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace logger.Areas.logger.Controllers
{
    [Area("logger")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class IndexController : ControllerBase
    {
        private readonly IMediator mediator;
        private readonly ILogger logger;

        public IndexController(IMediator mediator, ILogger logger)
        {
            this.mediator = mediator;
            this.logger = logger;
        }

        // http://localhost:8000/logger/api/index
        [HttpGet]
        public string Get()
        {
            return "logger IndexController";
        }
    }
}
