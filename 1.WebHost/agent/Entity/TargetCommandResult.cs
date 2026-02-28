namespace agent.Entity
{
    public sealed class TargetCommandResult
    {
        public bool Success { get; set; }

        public string ErrorCode { get; set; } = "";

        public string Message { get; set; } = "";

        public int? Pid { get; set; }
    }
}

