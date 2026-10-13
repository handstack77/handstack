using System.Collections.Generic;

namespace HandStack.Web.Authorization
{
    public class RequestOriginOptions
    {
        public const string SectionName = "AppSettings:Security:RequestOriginApiAccess";

        public bool Enabled { get; set; } = true;

        public bool AllowLoopback { get; set; } = true;

        public string HeaderName { get; set; } = "X-Api-Key";

        // true 이면 Referer/Origin 비교 시 포트까지 검증하고, false(기본값)이면 포트를 검증하지 않고 호스트만 비교한다
        public bool IsPortComparison { get; set; } = false;

        public List<string> AllowedReferers { get; set; } = [];

        public List<string> ApiKeys { get; set; } = [];
    }
}
