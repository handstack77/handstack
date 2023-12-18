using System;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public class UserAccount
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? UserAccountID { get; set; } = string.Empty;

        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? UserNo { get; set; } = null;

        public string UserID { get; set; } = string.Empty;

        public string UserName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? Celluar { get; set; } = null;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? PositionName { get; set; } = null;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? DepartmentName { get; set; } = null;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? CompanyName { get; set; } = null;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? BirthDate { get; set; } = null;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? Gender { get; set; } = null;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? Address { get; set; } = null;

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? ExtendOption { get; set; } = null;

        public string SessionKey { get; set; } = string.Empty;

        public List<Role> Roles { get; set; } = new List<Role>();

        public Dictionary<string, string> Claims { get; set; } = new Dictionary<string, string>();

        public DateTime LoginedAt { get; set; }
    }
}
