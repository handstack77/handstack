using System;

namespace HandStack.Core.Licensing
{
    public record LicenseItem
    {
        public required string CompanyName { get; init; }
        public required string AuthorizedHost { get; init; }
        public required string Key { get; init; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; init; }
        public required string Environment { get; init; }
        public required string SignKey { get; init; }
    }
}
