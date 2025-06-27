using System;

namespace HandStack.Web.Entity
{
    public record KeyItem
    {
        public required string Key { get; init; }
        public required string Value { get; set; }
        public required string IsEncryption { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; init; }
        public required string Environment { get; init; }
        public required string[] Tags { get; init; }
    }
}
