using System;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial class DataSource
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty("DataSourceID")]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty("DataProvider")]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty("TanantPattern")]
        public string TanantPattern { get; set; } = string.Empty;

        [JsonProperty("TanantValue")]
        public string TanantValue { get; set; } = string.Empty;

        [JsonProperty("ConnectionString")]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty("IsEncryption")]
        public string IsEncryption { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;
    }
}
