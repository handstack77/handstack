using System;
using System.Collections.Generic;
using System.ComponentModel;

using HandStack.Web.MessageContract.Enumeration;

using Newtonsoft.Json;

namespace HandStack.Web.Messages
{
    public class ResponseBase
    {
        public ResponseBase()
        {
            Acknowledge = AcknowledgeType.Failure;
            CorrelationID = "";
            ExceptionText = "";
            Version = "0";
            ResponseID = "";
            LoadOptions = new Dictionary<string, object>();
            Environment = "D";
            RowsAffected = 0;
        }

        [JsonProperty("acceptDateTime")]
        public DateTime? AcceptDateTime { get; set; }

        [JsonProperty("acknowledge")]
        public AcknowledgeType Acknowledge { get; set; }

        [JsonProperty("correlationID")]
        public string CorrelationID { get; set; }

        [JsonProperty("exceptionText")]
        public string ExceptionText { get; set; }

        [JsonProperty("rowsAffected")]
        public int RowsAffected { get; set; }

        [JsonProperty("responseID")]
        public string ResponseID { get; set; }

        // CryptographyType: 'F:Full, H:Header, B:Body',
        // CryptographyKey: 'P:프로그램, K:KMS 서버, D:Decrypt 키',
        [JsonProperty("loadOptions")]
        public Dictionary<string, object> LoadOptions { get; set; }

        [JsonProperty("version")]
        public string Version { get; set; }

        [JsonProperty("environment"), Description("'D: Development, P: Production, T: Test")]
        public string Environment { get; set; }
    }
}
