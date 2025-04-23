using System;
using System.Collections.Generic;

namespace HandStack.Web.MessageContract.DataObject
{
    public partial class BearerToken
    {
        public string TokenID { get; set; } = string.Empty;

        public string IssuerName { get; set; } = string.Empty;

        public string ClientIP { get; set; } = string.Empty;

        public DateTime? CreatedAt { get; set; }

        public DateTime? ExpiredAt { get; set; }

        public Policy Policy { get; set; } = new Policy();

        public dynamic? Variable { get; set; }
    }

    public partial class Policy
    {
        public string UserNo { get; set; } = string.Empty;

        public string UserID { get; set; } = string.Empty;

        public string UserName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string VerifyTokenID { get; set; } = string.Empty;

        public List<string> Roles { get; set; } = new List<string>();

        public Dictionary<string, string> Claims { get; set; } = new Dictionary<string, string>();
    }
}
