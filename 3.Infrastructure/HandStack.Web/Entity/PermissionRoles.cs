using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial class PermissionRoles
    {
        [JsonProperty("RoleID")]
        public string RoleID { get; set; } = string.Empty;

        [JsonProperty("ModuleID")]
        public string ModuleID { get; set; } = string.Empty;

        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty("TransactionID")]
        public string TransactionID { get; set; } = string.Empty;
    }
}
