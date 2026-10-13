using System.Collections.Generic;

namespace HandStack.Web.Authorization
{
    public class RequestOriginOptions
    {
        public const string SectionName = "AppSettings:Security:ApiAccess";

        public bool Enabled { get; set; } = true;

        public bool AllowLoopback { get; set; } = true;

        public string HeaderName { get; set; } = "X-Api-Key";

        public List<string> AllowedReferers { get; set; } = [];

        public List<string> ApiKeys { get; set; } = [];
    }
}
