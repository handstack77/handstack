using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class SystemType
    {
        [JsonProperty("programID")]
        public string ProgramID { get; set; }

        [JsonProperty("moduleID")]
        public string ModuleID { get; set; }

        [JsonProperty("version")]
        public string Version { get; set; }

        [JsonProperty("routes")]
        public List<Route> Routes { get; set; }

        [JsonProperty("localeID")]
        public string LocaleID { get; set; }

        [JsonProperty("hostName")]
        public string HostName { get; set; }

        [JsonProperty("pathName")]
        public string PathName { get; set; }

        public SystemType()
        {
            ProgramID = "";
            ModuleID = "";
            Version = "";
            Routes = new List<Route>();
            LocaleID = "";
            HostName = "";
            PathName = "";
        }
    }
}
