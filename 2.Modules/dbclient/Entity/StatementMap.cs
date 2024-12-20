using System;
using System.Collections.Generic;

using HtmlAgilityPack;

using Newtonsoft.Json;

namespace dbclient.Entity
{
    [JsonObject(MemberSerialization.OptIn)]
    public class StatementMap
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
        public string TransactionIsolationLevel { get; set; }

        [JsonProperty]
        public string StatementID { get; set; }

        [JsonProperty]
        public int Seq { get; set; }

        [JsonProperty]
        public string Comment { get; set; }

        [JsonProperty]
        public bool NativeDataClient { get; set; }

        [JsonProperty]
        public string SQL { get; set; }

        [JsonProperty]
        public bool TransactionLog { get; set; }

        [JsonProperty]
        public int Timeout { get; set; }

        [JsonProperty]
        public string BeforeTransactionCommand { get; set; }

        [JsonProperty]
        public string AfterTransactionCommand { get; set; }

        [JsonProperty]
        public string FallbackTransactionCommand { get; set; }

        [JsonProperty]
        public List<DbParameterMap> DbParameters { get; set; }

        public HtmlDocument Chidren { get; set; }

        [JsonProperty]
        public DateTime ModifiedAt { get; set; }

        public StatementMap()
        {
            ApplicationID = "";
            ProjectID = "";
            TransactionID = "";
            DataSourceID = "";
            TransactionIsolationLevel = "ReadCommitted";
            StatementID = "";
            Seq = 0;
            Comment = "";
            NativeDataClient = false;
            SQL = "";
            TransactionLog = false;
            Timeout = 0;
            BeforeTransactionCommand = "";
            AfterTransactionCommand = "";
            FallbackTransactionCommand = "";
            DbParameters = new List<DbParameterMap>();
            Chidren = new HtmlDocument();
            ModifiedAt = DateTime.MinValue;
        }
    }
}
