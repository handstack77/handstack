namespace agent.Entity
{
    public sealed class TargetMonitorStats
    {
        public TargetRequestStat RequestStat { get; set; } = new TargetRequestStat();

        public TargetResponseStat ResponseStat { get; set; } = new TargetResponseStat();
    }
}

