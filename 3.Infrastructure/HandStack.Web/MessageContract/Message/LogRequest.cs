using System;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Message
{
    public class LogRequest
    {
        public LogRequest()
        {
            LogMessage = new LogMessage();
            FallbackFunction = null;
        }

        public LogMessage LogMessage { get; set; }

        public Action<string>? FallbackFunction { get; set; }
    }

    public class LogMessage
    {
        public LogMessage()
        {
            LogNo = 0;
            ServerID = "";
            RunningEnvironment = "";
            ProgramName = "";
            GlobalID = "";
            Acknowledge = "";
            ApplicationID = "";
            ProjectID = "";
            TransactionID = "";
            ServiceID = "";
            Type = "";
            Flow = "";
            Level = "";
            Format = "";
            Message = "";
            Properties = "";
            UserID = "";
            CreatedAt = "";
            StartedAt = "";
            EndedAt = "";
            IpAddress = "";
            DeviceID = "";
            ProgramID = "";
        }

        [JsonProperty("LogNo")]
        public long LogNo { get; set; }

        [JsonProperty("ServerID")]
        public string ServerID { get; set; }

        [JsonProperty("RunningEnvironment")]
        public string RunningEnvironment { get; set; }

        [JsonProperty("ProgramName")]
        public string ProgramName { get; set; }

        [JsonProperty("GlobalID")]
        public string GlobalID { get; set; }

        [JsonProperty("Acknowledge")]
        public string Acknowledge { get; set; }

        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; }

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; }

        [JsonProperty("TransactionID")]
        public string TransactionID { get; set; }

        [JsonProperty("ServiceID")]
        public string ServiceID { get; set; }

        [JsonProperty("Type")]
        public string Type { get; set; }

        [JsonProperty("Flow")]
        public string Flow { get; set; }

        [JsonProperty("Level")]
        public string Level { get; set; }

        [JsonProperty("Format")]
        public string Format { get; set; }

        [JsonProperty("Message")]
        public string Message { get; set; }

        [JsonProperty("Properties")]
        public string Properties { get; set; }

        [JsonProperty("UserID")]
        public string UserID { get; set; }

        [JsonProperty("CreatedAt")]
        public string CreatedAt { get; set; }

        [JsonProperty("StartedAt")]
        public string StartedAt { get; set; }

        [JsonProperty("EndedAt")]
        public string EndedAt { get; set; }

        [JsonProperty("IpAddress")]
        public string IpAddress { get; set; }

        [JsonProperty("DeviceID")]
        public string DeviceID { get; set; }

        [JsonProperty("ProgramID")]
        public string ProgramID { get; set; }
    }
}
