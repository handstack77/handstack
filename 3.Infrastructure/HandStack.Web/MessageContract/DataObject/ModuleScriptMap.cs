using System;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.DataObject
{
    [JsonObject(MemberSerialization.OptIn)]
    public class ModuleScriptMap
    {
        [JsonProperty]
        public string ApplicationID { get; set; } = "";
        [JsonProperty]
        public string ProjectID { get; set; } = "";
        [JsonProperty]
        public string TransactionID { get; set; } = "";
        [JsonProperty]
        public string DataSourceID { get; set; } = "";
        [JsonProperty]
        public string ScriptID { get; set; } = "";
        [JsonProperty]
        public string ExportName { get; set; } = "";
        [JsonProperty]
        public int Seq { get; set; }
        [JsonProperty]
        public string LanguageType { get; set; } = "";
        [JsonProperty]
        public string ProgramPath { get; set; } = "";
        [JsonProperty]
        public string? ReferenceModuleID { get; set; } = "";
        [JsonProperty]
        public string? EntryType { get; set; } = "";
        [JsonProperty]
        public string? EntryMethod { get; set; } = "";
        [JsonProperty]
        public bool IsHttpContext { get; set; }
        [JsonProperty]
        public string Comment { get; set; } = "";
        [JsonProperty]
        public bool TransactionLog { get; set; }
        [JsonProperty]
        public int Timeout { get; set; }
        [JsonProperty]
        public string BeforeTransactionCommand { get; set; } = "";
        [JsonProperty]
        public string AfterTransactionCommand { get; set; } = "";
        [JsonProperty]
        public string FallbackTransactionCommand { get; set; } = "";
        [JsonProperty]
        public List<ModuleParameterMap> ModuleParameters { get; set; } = new List<ModuleParameterMap>();
        [JsonProperty]
        public DateTime? ModifiedAt { get; set; } = null;
    }
}
