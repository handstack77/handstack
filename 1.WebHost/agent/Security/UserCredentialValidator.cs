using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

using agent.Options;

using Microsoft.Extensions.Options;

namespace agent.Security
{
    public sealed class UserCredentialValidator
    {
        private readonly IOptionsMonitor<List<UserCredentialOptions>> usersOptionsMonitor;

        public UserCredentialValidator(IOptionsMonitor<List<UserCredentialOptions>> usersOptionsMonitor)
        {
            this.usersOptionsMonitor = usersOptionsMonitor;
        }

        public bool TryValidate(string? emailID, string? password, out UserCredentialOptions? user, out string errorCode)
        {
            user = null;
            errorCode = "";

            if (string.IsNullOrWhiteSpace(emailID) == true || string.IsNullOrWhiteSpace(password) == true)
            {
                errorCode = "missing_credentials";
                return false;
            }

            var normalizedEmail = emailID.Trim();
            var normalizedPassword = password.Trim();
            var configuredUsers = usersOptionsMonitor.CurrentValue ?? new List<UserCredentialOptions>();
            var matchedUser = configuredUsers.FirstOrDefault(candidate =>
                string.Equals(candidate.EmailID?.Trim(), normalizedEmail, StringComparison.OrdinalIgnoreCase) == true);

            if (matchedUser is null)
            {
                errorCode = "invalid_credentials";
                return false;
            }

            if (SecureEquals(matchedUser.Password, normalizedPassword) == false)
            {
                errorCode = "invalid_credentials";
                return false;
            }

            if (TryParseDate(matchedUser.ExpiredAt, out var expiredAt) == true && expiredAt <= DateTimeOffset.UtcNow)
            {
                errorCode = "account_expired";
                return false;
            }

            user = matchedUser;
            return true;
        }

        public static bool TryParseDate(string? value, out DateTimeOffset parsedValue)
        {
            parsedValue = default;
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return false;
            }

            if (DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed) == false)
            {
                return false;
            }

            parsedValue = parsed.ToUniversalTime();
            return true;
        }

        private static bool SecureEquals(string? expected, string? provided)
        {
            if (string.IsNullOrWhiteSpace(expected) == true || string.IsNullOrWhiteSpace(provided) == true)
            {
                return false;
            }

            var expectedBytes = Encoding.UTF8.GetBytes(expected.Trim());
            var providedBytes = Encoding.UTF8.GetBytes(provided.Trim());
            if (expectedBytes.Length != providedBytes.Length)
            {
                return false;
            }

            return CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
        }
    }
}
