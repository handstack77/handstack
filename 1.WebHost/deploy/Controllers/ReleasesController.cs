using System;

using deploy.Entity;
using deploy.Security;
using deploy.Services;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace deploy.Controllers
{
    [ApiController]
    [Route("api/releases")]
    public sealed class ReleasesController : DeployControllerBase
    {
        private readonly IReleaseStorageService releaseStorageService;
        private readonly ILogger<ReleasesController> logger;

        public ReleasesController(IReleaseStorageService releaseStorageService, ILogger<ReleasesController> logger)
        {
            this.releaseStorageService = releaseStorageService;
            this.logger = logger;
        }

        [HttpGet]
        public IActionResult GetReleases()
        {
            return Ok(new
            {
                success = true,
                items = releaseStorageService.GetReleases()
            });
        }

        [HttpGet("{releaseId}")]
        public IActionResult GetRelease(string releaseId)
        {
            var release = releaseStorageService.GetRelease(releaseId);
            if (release == null)
            {
                logger.LogWarning("Release lookup failed. ReleaseId={ReleaseId}", releaseId);
                return NotFound(new
                {
                    success = false,
                    message = "release를 찾을 수 없습니다."
                });
            }

            return Ok(new
            {
                success = true,
                item = release
            });
        }

        [HttpPost]
        [ServiceFilter(typeof(ManagementKeyActionFilter))]
        public IActionResult CreateRelease([FromBody] CreateReleaseRequest request)
        {
            logger.LogInformation(
                "Create release requested. Channel={Channel}, Platform={Platform}, RemoteIpAddress={RemoteIpAddress}",
                request.Channel,
                request.Platform,
                HttpContext.Connection.RemoteIpAddress?.ToString());

            var release = releaseStorageService.CreateRelease(request);
            return Ok(new
            {
                success = true,
                item = release
            });
        }

        [HttpPost("{releaseId}/packages")]
        [RequestSizeLimit(1024L * 1024L * 1024L)]
        [ServiceFilter(typeof(ManagementKeyActionFilter))]
        public IActionResult UploadPackage(string releaseId, [FromForm] string? packageType, [FromForm] string? targetId, [FromForm] string? version, [FromForm] IFormFile? file)
        {
            if (file == null)
            {
                logger.LogWarning("Package upload rejected because file was missing. ReleaseId={ReleaseId}", releaseId);
                return BadRequest(new
                {
                    success = false,
                    message = "업로드 파일 확인 필요."
                });
            }

            try
            {
                logger.LogInformation(
                    "Package upload requested. ReleaseId={ReleaseId}, PackageType={PackageType}, TargetId={TargetId}, Version={Version}, FileName={FileName}, Size={Size}",
                    releaseId,
                    packageType,
                    targetId,
                    version,
                    file.FileName,
                    file.Length);

                var package = releaseStorageService.SavePackage(
                    releaseId,
                    packageType ?? "",
                    targetId ?? "",
                    version ?? "",
                    file);
                return Ok(new
                {
                    success = true,
                    item = package
                });
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Package upload failed. ReleaseId={ReleaseId}", releaseId);
                return BadRequest(new
                {
                    success = false,
                    message = exception.Message
                });
            }
        }

        [HttpPost("{releaseId}/publish")]
        [ServiceFilter(typeof(ManagementKeyActionFilter))]
        public IActionResult PublishRelease(string releaseId)
        {
            try
            {
                logger.LogInformation(
                    "Release publish requested. ReleaseId={ReleaseId}, RemoteIpAddress={RemoteIpAddress}",
                    releaseId,
                    HttpContext.Connection.RemoteIpAddress?.ToString());

                var release = releaseStorageService.PublishRelease(releaseId);
                return Ok(new
                {
                    success = true,
                    item = release,
                    versionUrl = $"/{releaseStorageService.PublicRequestPath}/{release.Channel}/version.json"
                });
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Release publish failed. ReleaseId={ReleaseId}", releaseId);
                return BadRequest(new
                {
                    success = false,
                    message = exception.Message
                });
            }
        }
    }
}
