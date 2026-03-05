namespace agent.Options
{
    public sealed class HostBridgeOptions
    {
        public bool Enabled { get; set; } = false;

        public string HeaderName { get; set; } = "X-Bridge-Key";

        public string BridgeKey { get; set; } = "";
    }
}
