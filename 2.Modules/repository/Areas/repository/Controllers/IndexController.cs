using HandStack.Web.Common;

using Mediator;

using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace repository.Areas.repository.Controllers
{
    [Area("repository")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class IndexController(IMediator mediator, ILogger logger) : BaseController
    {
        private readonly IMediator mediator = mediator;
        private readonly ILogger logger = logger;

        // http://localhost:8421/repository/api/index
        [HttpGet]
        public string Get()
        {
            return "repository IndexController";
        }
    }
}
