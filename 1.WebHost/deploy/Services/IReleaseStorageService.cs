using System.Collections.Generic;

using deploy.Entity;

using Microsoft.AspNetCore.Http;

namespace deploy.Services
{
    public interface IReleaseStorageService
    {
        string PublicRootPath { get; }

        string PublicRequestPath { get; }

        IReadOnlyList<ReleaseRecord> GetReleases();

        ReleaseRecord? GetRelease(string releaseId);

        ReleaseRecord CreateRelease(CreateReleaseRequest request);

        ReleasePackageRecord SavePackage(string releaseId, string packageType, string targetId, string version, IFormFile file);

        ReleaseRecord PublishRelease(string releaseId);
    }
}
