using System.Collections.Generic;

namespace agent.Entity
{
    public class OperationResult
    {
        public bool Success { get; set; } = true;

        public string ErrorCode { get; set; } = "";

        public string Message { get; set; } = "";

        public List<string> Errors { get; set; } = new List<string>();
    }
}
