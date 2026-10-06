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

        [JsonProperty(nameof(LogNo))]
        public long LogNo { get; set; }

        [JsonProperty(nameof(ServerID))]
        public string ServerID { get; set; }

        [JsonProperty(nameof(RunningEnvironment))]
        public string RunningEnvironment { get; set; }

        [JsonProperty(nameof(ProgramName))]
        public string ProgramName { get; set; }

        [JsonProperty(nameof(GlobalID))]
        public string GlobalID { get; set; }

        [JsonProperty(nameof(Acknowledge))]
        public string Acknowledge { get; set; }

        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; }

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; }

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; }

        [JsonProperty(nameof(ServiceID))]
        public string ServiceID { get; set; }

        [JsonProperty(nameof(Type))]
        public string Type { get; set; }

        [JsonProperty(nameof(Flow))]
        public string Flow { get; set; }

        [JsonProperty(nameof(Level))]
        public string Level { get; set; }

        [JsonProperty(nameof(Format))]
        public string Format { get; set; }

        [JsonProperty(nameof(Message))]
        public string Message { get; set; }

        [JsonProperty(nameof(Properties))]
        public string Properties { get; set; }

        [JsonProperty(nameof(UserID))]
        public string UserID { get; set; }

        [JsonProperty(nameof(CreatedAt))]
        public string CreatedAt { get; set; }

        [JsonProperty(nameof(StartedAt))]
        public string StartedAt { get; set; }

        [JsonProperty(nameof(EndedAt))]
        public string EndedAt { get; set; }

        [JsonProperty(nameof(IpAddress))]
        public string IpAddress { get; set; }

        [JsonProperty(nameof(DeviceID))]
        public string DeviceID { get; set; }

        [JsonProperty(nameof(ProgramID))]
        public string ProgramID { get; set; }
    }
}
