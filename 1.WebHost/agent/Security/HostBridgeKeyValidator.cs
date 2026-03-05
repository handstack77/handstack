using System.Security.Cryptography;
using System.Text;

using agent.Options;

using Microsoft.Extensions.Options;

namespace agent.Security
{
    public sealed class HostBridgeKeyValidator
    {
        private readonly IOptionsMonitor<AgentOptions> optionsMonitor;

        public HostBridgeKeyValidator(IOptionsMonitor<AgentOptions> optionsMonitor)
        {
            this.optionsMonitor = optionsMonitor;
        }

        public bool Enabled => optionsMonitor.CurrentValue.HostBridge.Enabled;

        public string HeaderName
        {
            get
            {
                var headerName = optionsMonitor.CurrentValue.HostBridge.HeaderName;
                if (string.IsNullOrWhiteSpace(headerName) == true)
                {
                    return "X-Bridge-Key";
                }

                return headerName.Trim();
            }
        }

        public bool Validate(string? providedKey)
        {
            var expectedKey = optionsMonitor.CurrentValue.HostBridge.BridgeKey;
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
