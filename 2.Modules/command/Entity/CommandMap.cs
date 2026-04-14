using System;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace command.Entity
{
    [JsonObject(MemberSerialization.OptIn)]
    public record CommandMap
    {
        [JsonProperty]
        public string ApplicationID { get; set; }

        [JsonProperty]
        public string ProjectID { get; set; }

        [JsonProperty]
        public string TransactionID { get; set; }

        [JsonProperty]
        public string CommandID { get; set; }

        [JsonProperty]
        public int Seq { get; set; }

        [JsonProperty]
        public string CommandType { get; set; }

        [JsonProperty]
        public bool Use { get; set; }

        [JsonProperty]
        public int Timeout { get; set; }

        [JsonProperty]
        public int MaxOutputBytes { get; set; }

        [JsonProperty]
        public string Comment { get; set; }

        [JsonProperty]
        public bool TransactionLog { get; set; }

        [JsonProperty]
        public string ExecutablePath { get; set; }

        [JsonProperty]
        public string Arguments { get; set; }

        [JsonProperty]
        public string WorkingDirectory { get; set; }

        [JsonProperty]
        public Dictionary<string, string> EnvironmentVariables { get; set; }

        [JsonProperty]
        public List<int> SuccessExitCodes { get; set; }

        [JsonProperty]
        public string Method { get; set; }

        [JsonProperty]
        public string Url { get; set; }

        [JsonProperty]
        public Dictionary<string, string> QueryParameters { get; set; }

        [JsonProperty]
        public CommandAuthorizationMap Authorization { get; set; }

        [JsonProperty]
        public Dictionary<string, string> Headers { get; set; }

        [JsonProperty]
        public string ContentType { get; set; }

        [JsonProperty]
        public string Body { get; set; }

        [JsonProperty]
        public string BodyType { get; set; }

        [JsonProperty]
        public List<CommandBodyPartMap> BodyParts { get; set; }

        [JsonProperty]
        public List<CommandParameterMap> Parameters { get; set; }

        [JsonProperty]
        public DateTime ModifiedAt { get; set; }

        public CommandMap()
        {
            ApplicationID = "";
            ProjectID = "";
            TransactionID = "";
            CommandID = "";
            Seq = 0;
            CommandType = "";
            Use = true;
            Timeout = 0;
            MaxOutputBytes = 0;
            Comment = "";
            TransactionLog = false;
            ExecutablePath = "";
            Arguments = "";
            WorkingDirectory = "";
            EnvironmentVariables = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            SuccessExitCodes = new List<int>() { 0 };
            Method = "GET";
            Url = "";
            QueryParameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            Authorization = new CommandAuthorizationMap();
            Headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            ContentType = "application/json";
            Body = "";
            BodyType = "raw";
            BodyParts = new List<CommandBodyPartMap>();
            Parameters = new List<CommandParameterMap>();
            ModifiedAt = DateTime.MinValue;
        }
    }

    public record CommandContract
    {
        public CommandContractHeader Header { get; set; }

        public List<CommandContractCli> Commands { get; set; }

        public List<CommandContractRequest> Requests { get; set; }

        public DateTime ModifiedAt { get; set; }

        public CommandContract()
        {
            Header = new CommandContractHeader();
            Commands = new List<CommandContractCli>();
            Requests = new List<CommandContractRequest>();
            ModifiedAt = DateTime.MinValue;
        }
    }

    public record CommandContractHeader
    {
        public string ApplicationID { get; set; }

        public string ProjectID { get; set; }

        public string TransactionID { get; set; }

        public bool Use { get; set; }

        public int Timeout { get; set; }

        public int MaxOutputBytes { get; set; }

        public string Comment { get; set; }

        public CommandContractHeader()
        {
            ApplicationID = "";
            ProjectID = "";
            TransactionID = "";
            Use = true;
            Timeout = 0;
            MaxOutputBytes = 0;
            Comment = "";
        }
    }

    public record CommandContractCli
    {
        public string ID { get; set; }

        public int Seq { get; set; }

        public bool Use { get; set; }

        public int Timeout { get; set; }

        public int MaxOutputBytes { get; set; }

        public string Comment { get; set; }

        public bool TransactionLog { get; set; }

        public string ExecutablePath { get; set; }

        public string Arguments { get; set; }

        public string WorkingDirectory { get; set; }

        public Dictionary<string, string> EnvironmentVariables { get; set; }

        public List<int> SuccessExitCodes { get; set; }

        public List<CommandParameterMap> Parameters { get; set; }

        public CommandContractCli()
        {
            ID = "";
            Seq = 0;
            Use = true;
            Timeout = 0;
            MaxOutputBytes = 0;
            Comment = "";
            TransactionLog = false;
            ExecutablePath = "";
            Arguments = "";
            WorkingDirectory = "";
            EnvironmentVariables = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            SuccessExitCodes = new List<int>() { 0 };
            Parameters = new List<CommandParameterMap>();
        }
    }

    public record CommandContractRequest
    {
        public string ID { get; set; }

        public int Seq { get; set; }

        public bool Use { get; set; }

        public int Timeout { get; set; }

        public int MaxOutputBytes { get; set; }

        public string Comment { get; set; }

        public bool TransactionLog { get; set; }

        public string Method { get; set; }

        public string Url { get; set; }

        public Dictionary<string, string> QueryStrings { get; set; }

        public CommandAuthorizationMap Authorization { get; set; }

        public Dictionary<string, string> Headers { get; set; }

        public string ContentType { get; set; }

        public string Body { get; set; }

        public string BodyType { get; set; }

        public List<CommandBodyPartMap> BodyParts { get; set; }

        public List<CommandParameterMap> Parameters { get; set; }

        public CommandContractRequest()
        {
            ID = "";
            Seq = 0;
            Use = true;
            Timeout = 0;
            MaxOutputBytes = 0;
            Comment = "";
            TransactionLog = false;
            Method = "GET";
            Url = "";
            QueryStrings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            Authorization = new CommandAuthorizationMap();
            Headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            ContentType = "application/json";
            Body = "";
            BodyType = "raw";
            BodyParts = new List<CommandBodyPartMap>();
            Parameters = new List<CommandParameterMap>();
        }
    }

    public record CommandAuthorizationMap
    {
        [JsonProperty]
        public string Type { get; set; }

        [JsonProperty]
        public string Name { get; set; }

        [JsonProperty]
        public string In { get; set; }

        [JsonProperty]
        public string Username { get; set; }

        [JsonProperty]
        public string Password { get; set; }

        [JsonProperty]
        public string Value { get; set; }

        public CommandAuthorizationMap()
        {
            Type = "";
            Name = "";
            In = "Header";
            Username = "";
            Password = "";
            Value = "";
        }
    }

    public record CommandBodyPartMap
    {
        [JsonProperty]
        public string Type { get; set; }

        [JsonProperty]
        public string Name { get; set; }

        [JsonProperty]
        public string Value { get; set; }

        [JsonProperty]
        public string FileName { get; set; }

        [JsonProperty]
        public string Path { get; set; }

        [JsonProperty]
        public string Base64 { get; set; }

        [JsonProperty]
        public string ContentType { get; set; }

        public CommandBodyPartMap()
        {
            Type = "text";
            Name = "";
            Value = "";
            FileName = "";
            Path = "";
            Base64 = "";
            ContentType = "";
        }
    }

    public record CommandParameterMap
    {
        [JsonProperty]
        public string Name { get; set; }

        [JsonProperty]
        public string DbType { get; set; }

        [JsonProperty]
        public int Length { get; set; }

        [JsonProperty]
        public string DefaultValue { get; set; }

        [JsonProperty]
        public string TestValue { get; set; }

        [JsonProperty]
        public bool Required { get; set; }

        public CommandParameterMap()
        {
            Name = "";
            DbType = "String";
            Length = -1;
            DefaultValue = "NULL";
            TestValue = "";
            Required = true;
        }
    }

    public record CommandExecutionResult
    {
        public string CommandID { get; set; } = "";

        public string Type { get; set; } = "";

        public int? ExitCode { get; set; }

        public string StandardOutput { get; set; } = "";

        public string StandardError { get; set; } = "";

        public int? StatusCode { get; set; }

        public string ReasonPhrase { get; set; } = "";

        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        public string ResponseContent { get; set; } = "";

        public long ElapsedMS { get; set; }
    }
}
