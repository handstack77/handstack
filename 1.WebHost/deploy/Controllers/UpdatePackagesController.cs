using System;

using deploy.Security;
using deploy.Services;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace deploy.Controllers
{
    [ApiController]
    [Route("api/update-packages")]
    public sealed class UpdatePackagesController : DeployControllerBase
    {
        private readonly IUpdatePackageRepositoryService repositoryService;
        private readonly ILogger<UpdatePackagesController> logger;

        public UpdatePackagesController(IUpdatePackageRepositoryService repositoryService, ILogger<UpdatePackagesController> logger)
        {
            this.repositoryService = repositoryService;
            this.logger = logger;
        }

        [HttpGet]
        public IActionResult GetPackages()
        {
            return Ok(new
            {
                success = true,
                items = repositoryService.GetPackages()
            });
        }

        [HttpPost]
        [RequestSizeLimit(1024L * 1024L * 1024L)]
        [ServiceFilter(typeof(ManagementKeyActionFilter))]
        public IActionResult UploadPackage([FromForm] string? releaseNotes, [FromForm] DateTimeOffset? releaseDate, [FromForm] IFormFile? file)
        {
            if (file == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "업로드 파일 확인 필요."
                });
            }

            try
            {
                var item = repositoryService.SavePackage(file, releaseNotes, releaseDate);
                return Ok(new
                {
                    success = true,
                    item
                });
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Update package upload failed. FileName={FileName}", file.FileName);
                return BadRequest(new
                {
                    success = false,
                    message = exception.Message
                });
            }
        }
    }
}
