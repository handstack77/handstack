using System;
using System.Collections.Generic;

using deploy.Entity;

using deploy.Updates;

using Microsoft.AspNetCore.Http;

namespace deploy.Services
{
    public interface IUpdatePackageRepositoryService
    {
        string PublicRootPath { get; }

        string PublicRequestPath { get; }

        IReadOnlyList<UpdateCatalogPackage> GetPackages();

        UpdateCatalogPackage SavePackage(IFormFile file, string? releaseNotes, DateTimeOffset? releaseDate);

        UpdateManifestDocument BuildManifest(string publicBaseUri);

        OperationResult SaveDeployError(string message, string? source, string? version, IFormFile? file);
    }
}
