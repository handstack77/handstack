using System;
using System.Collections.Generic;

namespace HandStack.Web.MessageContract.DataObject
{
    public partial class BearerToken
    {
        public BearerToken()
        {
            TokenID = string.Empty;
            IssuerName = string.Empty;
            ClientIP = string.Empty;
            Policy = new Policy();
            Variable = null;
            CreatedAt = null;
            ExpiredAt = null;
        }

        public string TokenID { get; set; }

        public string IssuerName { get; set; }

        public string ClientIP { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? ExpiredAt { get; set; }

        public Policy Policy { get; set; }

        public dynamic? Variable { get; set; }
    }

    public partial class Policy
    {
        public Policy()
        {
            UserID = "";
            UserName = "";
            Email = "";
            VerifyTokenID = "";
            Roles = new List<string>();
            Claims = new Dictionary<string, string>();
        }

        public string UserID { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; }

        public string VerifyTokenID { get; set; }

        public List<string> Roles { get; set; }

        public Dictionary<string, string> Claims { get; set; }
    }
}
