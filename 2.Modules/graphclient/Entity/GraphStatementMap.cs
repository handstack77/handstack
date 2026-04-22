using System;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace graphclient.Entity
{
    [JsonObject(MemberSerialization.OptIn)]
    public record GraphStatementMap
    {
        [JsonProperty]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty]
        public string TransactionID { get; set; } = string.Empty;

        [JsonProperty]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty]
        public string StatementID { get; set; } = string.Empty;

        [JsonProperty]
        public int Seq { get; set; }

        [JsonProperty]
        public string Comment { get; set; } = string.Empty;

        [JsonProperty]
        public int Timeout { get; set; }

        [JsonProperty]
        public bool TransactionLog { get; set; }

        [JsonProperty]
        public string Cypher { get; set; } = string.Empty;

        [JsonProperty]
        public List<GraphStatementParameter> Parameters { get; set; } = new();

        [JsonProperty]
        public DateTime ModifiedAt { get; set; } = DateTime.MinValue;

        [JsonProperty]
        public string SourceFilePath { get; set; } = string.Empty;
    }
}
