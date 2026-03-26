using System.Security.Cryptography;
using System.Text;

using deploy.Options;

using Microsoft.Extensions.Options;

namespace deploy.Security
{
    public sealed class ManagementKeyValidator
    {
        private readonly IOptionsMonitor<DeployOptions> optionsMonitor;

        public ManagementKeyValidator(IOptionsMonitor<DeployOptions> optionsMonitor)
        {
            this.optionsMonitor = optionsMonitor;
        }

        public string ManagementHeaderName
        {
            get
            {
                var headerName = optionsMonitor.CurrentValue.ManagementHeaderName;
                if (string.IsNullOrWhiteSpace(headerName) == true)
                {
                    return "X-Deploy-Key";
                }

                return headerName.Trim();
            }
        }

        public bool HasConfiguredKey()
        {
            return string.IsNullOrWhiteSpace(optionsMonitor.CurrentValue.ManagementKey) == false;
        }

        public bool Validate(string? providedKey)
        {
            var expectedKey = optionsMonitor.CurrentValue.ManagementKey;
            if (string.IsNullOrWhiteSpace(expectedKey) == true || string.IsNullOrWhiteSpace(providedKey) == true)
            {
                return false;
            }

            var expectedBytes = Encoding.UTF8.GetBytes(expectedKey.Trim());
            var providedBytes = Encoding.UTF8.GetBytes(providedKey.Trim());

            if (expectedBytes.Length != providedBytes.Length)
            {
                return false;
            }

            return CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
        }
    }
}
