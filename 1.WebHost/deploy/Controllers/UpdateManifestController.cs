using System;
using System.IO;
using System.Text.Json;

using deploy.Services;

using deploy.Updates;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace deploy.Controllers
{
    [ApiController]
    public sealed class UpdateManifestController : DeployControllerBase
    {
        private readonly IUpdatePackageRepositoryService repositoryService;
        private readonly ILogger<UpdateManifestController> logger;

        public UpdateManifestController(IUpdatePackageRepositoryService repositoryService, ILogger<UpdateManifestController> logger)
        {
            this.repositoryService = repositoryService;
            this.logger = logger;
        }

        [HttpGet("/release/manifest.json")]
        public IActionResult GetManifest()
        {
            try
            {
                var publicBaseUri = $"{Request.Scheme}://{Request.Host}{Request.PathBase}/{repositoryService.PublicRequestPath}";
                var manifest = repositoryService.BuildManifest(publicBaseUri);
                var json = JsonSerializer.Serialize(manifest, UpdateJson.DefaultSerializerOptions);
                return Content(json, "application/json; charset=utf-8");
            }
            catch (FileNotFoundException)
            {
                return NotFound(new
                {
                    success = false,
                    message = "공개된 배포 패키지가 없습니다."
                });
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to build public manifest.");
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = exception.Message
                });
            }
        }

        [HttpPost("/deploy-error")]
        [RequestSizeLimit(256L * 1024L * 1024L)]
        public IActionResult ReportDeployError([FromForm] string? message, [FromForm] string? source, [FromForm] string? version, [FromForm] IFormFile? file)
        {
            var result = repositoryService.SaveDeployError(message ?? "", source, version, file);
            return ToOperationResult(result);
        }
    }
}
