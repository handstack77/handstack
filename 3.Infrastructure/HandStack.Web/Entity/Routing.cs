using System;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial class Routing
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty("CommandType")]
        public string CommandType { get; set; } = string.Empty;

        [JsonProperty("Environment")]
        public string Environment { get; set; } = string.Empty;

        [JsonProperty("Uri")]
        public string Uri { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;
    }
}
