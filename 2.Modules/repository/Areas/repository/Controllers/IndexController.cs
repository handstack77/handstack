using MediatR;

using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace repository.Areas.repository.Controllers
{
    [Area("repository")]
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

        // http://localhost:8080/repository/api/index
        [HttpGet]
        public string Get()
        {
            return "repository IndexController";
        }
    }
}
