namespace dbplatform.Models;

internal sealed record TenantMetadata(
    string Tenant,
    string Engine,
    string Database,
    string User,
    string Port,
    string ContainerName,
    DateTimeOffset CreatedAt);
