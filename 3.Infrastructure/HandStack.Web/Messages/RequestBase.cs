using System;
using System.Collections.Generic;
using System.ComponentModel;

using HandStack.Web.MessageContract.Enumeration;

using Newtonsoft.Json;

namespace HandStack.Web.Messages
{
    public class RequestBase
    {
        public RequestBase()
        {
            ClientTag = "";
            AccessToken = "";
            Version = "0";
            RequestID = "";
            Action = "SYN";
            Kind = "BIZ";
            Environment = "D";
        }

        [JsonProperty("acceptDateTime")]
        public DateTime? AcceptDateTime { get; set; }

        [JsonProperty("accessToken")]
        public string? AccessToken { get; set; }

        [JsonProperty("action"), Description("'SYN: Request/Response, PSH: Execute/None, ACK: Subscribe'")]
        public string Action { get; set; }

        [JsonProperty("kind"), Description("'DBG: Debug, BIZ: Business, URG: Urgent, FIN: Finish'")]
        public string Kind { get; set; }

        [JsonProperty("clientTag")]
        public string ClientTag { get; set; }

        // CryptographyType: 'F:Full, H:Header, B:Body',
        // CryptographyKey: 'P:프로그램, K:KMS 서버, D:Decrypt 키',
        [JsonProperty("loadOptions")]
        public Dictionary<string, string>? LoadOptions { get; set; }

        [JsonProperty("requestID")]
        public string RequestID { get; set; }

        [JsonProperty("version")]
        public string Version { get; set; }

        [JsonProperty("environment"), Description("'D: Development, P: Production, T: Test")]
        public string Environment { get; set; }

        public virtual bool ValidRequest(RequestBase request, ResponseBase response)
        {
            if (string.IsNullOrWhiteSpace(request.RequestID)
                || string.IsNullOrWhiteSpace(request.Action)
                || string.IsNullOrWhiteSpace(request.Kind)
                || string.IsNullOrWhiteSpace(request.Environment)
            )
            {
                response.Acknowledge = AcknowledgeType.Failure;
                response.ExceptionText = "허가되지 않는 요청";
                return false;
            }

            return true;
        }
    }
}

