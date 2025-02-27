using System;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public record UserAccount
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

        public string ApplicationRoleID { get; set; } = string.Empty;

        /*
        Root = 0,
        Administrator = 100,
        Master = 200,
        Architect = 300,
        Manager = 400,
        BusinessOwner = 500,
        Operator = 600,
        Developer = 700,
        Designer = 800,
        User = 900
         */
        public List<string> Roles { get; set; } = new List<string>();

        public Dictionary<string, string> Claims { get; set; } = new Dictionary<string, string>();

        public DateTime LoginedAt { get; set; }
    }
}
