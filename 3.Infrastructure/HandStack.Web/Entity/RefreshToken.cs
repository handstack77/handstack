using System;
using System.ComponentModel.DataAnnotations;

namespace HandStack.Web.Entity
{
    public record RefreshToken
    {
        [Key]
        public int RefreshTokenNo { get; set; }

        public string UserNo { get; set; } = string.Empty;

        public string Token { get; set; } = string.Empty;

        public DateTime ExpiredAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public string CreatedByIP { get; set; } = string.Empty;

        public DateTime? RevokedAt { get; set; }

        public string RevokedByIP { get; set; } = string.Empty;

        public string? ReplacedByToken { get; set; } = null;

        public bool IsExpired => DateTime.UtcNow >= ExpiredAt;

        public bool IsRevoked => RevokedAt != null;

        public bool IsActive => RevokedAt == null && IsExpired == false;
    }
}
