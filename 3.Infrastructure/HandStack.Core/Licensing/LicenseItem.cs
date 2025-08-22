using System;
using System.Collections.Generic;

namespace HandStack.Core.Licensing
{
    public record LicenseItem
    {
        public string CompanyName { get; init; } = string.Empty;
        public string ProductName { get; init; } = string.Empty;
        public string AuthorizedHost { get; init; } = string.Empty;
        public string Key { get; init; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; init; }
        public string Environment { get; init; } = string.Empty;
        public string SignKey { get; init; } = string.Empty;
        public LicenseValidationData? Data { get; set; }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string? Error { get; set; }
        public LicenseValidationData? Data { get; set; }
    }

    public class LicenseValidationData
    {
        public string ModuleID { get; set; } = "";
        public string Company { get; set; } = "";
        public string Product { get; set; } = "";
        public string Environment { get; set; } = "";
        public string CreatedAt { get; set; } = "";
        public string? ExpiresAt { get; set; }
        public List<string> AllowedHosts { get; set; } = new();
        public string CurrentDomain { get; set; } = "";
        public string DomainMatch { get; set; } = "";
        public DateTime ValidatedAt { get; set; }
    }
}
