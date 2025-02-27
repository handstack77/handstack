using System;
using System.Collections.Generic;

using HtmlAgilityPack;

using Newtonsoft.Json;

namespace prompter.Entity
{
    [JsonObject(MemberSerialization.OptIn)]
    public record PromptMap
    {
        [JsonProperty]
        public string ApplicationID { get; set; }

        [JsonProperty]
        public string ProjectID { get; set; }

        [JsonProperty]
        public string TransactionID { get; set; }

        [JsonProperty]
        public string DataSourceID { get; set; }

        [JsonProperty]
        public string StatementID { get; set; }

        [JsonProperty]
        public int Seq { get; set; }

        [JsonProperty]
        public string Comment { get; set; }

        [JsonProperty]
        public string Prompt { get; set; }

        [JsonProperty]
        public bool TransactionLog { get; set; }

        [JsonProperty]
        public int Timeout { get; set; }

        [JsonProperty]
        public int MaxTokens { get; set; }

        [JsonProperty]
        public double Temperature { get; set; }

        [JsonProperty]
        public double TopP { get; set; }

        [JsonProperty]
        public double PresencePenalty { get; set; }

        [JsonProperty]
        public double FrequencyPenalty { get; set; }

        [JsonProperty]
        public List<InputVariableMap> InputVariables { get; set; }

        public HtmlDocument Chidren { get; set; }

        [JsonProperty]
        public DateTime ModifiedAt { get; set; }

        public PromptMap()
        {
            ApplicationID = "";
            ProjectID = "";
            TransactionID = "";
            DataSourceID = "";
            StatementID = "";
            Seq = 0;
            Comment = "";
            Prompt = "";
            TransactionLog = false;
            Timeout = 0;
            MaxTokens = 4000;
            Temperature = 1.0;
            TopP = 1.0;
            PresencePenalty = 0.0;
            FrequencyPenalty = 0.0;
            InputVariables = new List<InputVariableMap>();
            Chidren = new HtmlDocument();
            ModifiedAt = DateTime.MinValue;
        }
    }
}
