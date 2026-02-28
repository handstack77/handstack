namespace agent.Entity
{
    public sealed class CollectResult
    {
        public bool Success { get; set; }

        public string Message { get; set; } = "";

        public string TargetId { get; set; } = "";

        public int Pid { get; set; }

        public string DirectoryPath { get; set; } = "";

        public List<string> Files { get; set; } = new List<string>();

        public List<string> Errors { get; set; } = new List<string>();
    }
}

