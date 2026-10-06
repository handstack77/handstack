using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial record PermissionRoles
    {
        [JsonProperty(nameof(RoleID))]
        public string RoleID { get; set; } = string.Empty;

        [JsonProperty(nameof(ModuleID))]
        public string ModuleID { get; set; } = string.Empty;

        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; } = string.Empty;
    }
}
