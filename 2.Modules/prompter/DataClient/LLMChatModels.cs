using System.Collections.Generic;

using Newtonsoft.Json.Linq;

using prompter.Enumeration;

namespace prompter.DataClient
{
    public record LLMChatRequest
    {
        public LLMProviders Provider { get; set; }

        public string Prompt { get; set; }

        public string ModelID { get; set; }

        public string ApiKey { get; set; }

        public string Endpoint { get; set; }

        public int MaxTokens { get; set; }

        public double Temperature { get; set; }

        public double TopP { get; set; }

        public double PresencePenalty { get; set; }

        public double FrequencyPenalty { get; set; }

        public List<LLMChatMessage> ChatHistory { get; set; }

        public List<LLMToolDefinition> Tools { get; set; }

        public Dictionary<string, string> Headers { get; set; }

        public Dictionary<string, string> QueryParameters { get; set; }

        public LLMRequestBody Body { get; set; }

        public string ToolMode { get; set; }

        public LLMChatRequest()
        {
            Provider = LLMProviders.OpenAI;
            Prompt = "";
            ModelID = "";
            ApiKey = "";
            Endpoint = "";
            MaxTokens = 4000;
            Temperature = 1.0;
            TopP = 1.0;
            PresencePenalty = 0.0;
            FrequencyPenalty = 0.0;
            ChatHistory = new List<LLMChatMessage>();
            Tools = new List<LLMToolDefinition>();
            Headers = new Dictionary<string, string>();
            QueryParameters = new Dictionary<string, string>();
            Body = new LLMRequestBody();
            ToolMode = "none";
        }
    }

    public record LLMChatMessage
    {
        public string Role { get; set; }

        public string Content { get; set; }

        public string Name { get; set; }

        public string ToolCallID { get; set; }

        public List<LLMToolCall> ToolCalls { get; set; }

        public LLMChatMessage()
        {
            Role = "user";
            Content = "";
            Name = "";
            ToolCallID = "";
            ToolCalls = new List<LLMToolCall>();
        }

        public LLMChatMessage(string role, string content) : this()
        {
            Role = role;
            Content = content;
        }
    }

    public record LLMToolDefinition
    {
        public string Kind { get; set; }

        public string FunctionName { get; set; }

        public string DisplayName { get; set; }

        public string Description { get; set; }

        public JObject Parameters { get; set; }

        public object? Source { get; set; }

        public LLMToolDefinition()
        {
            Kind = "";
            FunctionName = "";
            DisplayName = "";
            Description = "";
            Parameters = new JObject();
            Source = null;
        }
    }

    public record LLMToolCall
    {
        public string ID { get; set; }

        public string FunctionName { get; set; }

        public string Arguments { get; set; }

        public LLMToolCall()
        {
            ID = "";
            FunctionName = "";
            Arguments = "{}";
        }
    }

    public record LLMChatResponse
    {
        public string Content { get; set; }

        public List<LLMToolCall> ToolCalls { get; set; }

        public JObject? Raw { get; set; }

        public LLMChatResponse()
        {
            Content = "";
            ToolCalls = new List<LLMToolCall>();
            Raw = null;
        }
    }

    public record LLMRequestBody
    {
        public string Type { get; set; }

        public string RawText { get; set; }

        public List<LLMRequestBodyPart> Parts { get; set; }

        public LLMRequestBody()
        {
            Type = "";
            RawText = "";
            Parts = new List<LLMRequestBodyPart>();
        }
    }

    public record LLMRequestBodyPart
    {
        public string Type { get; set; }

        public string Name { get; set; }

        public string Value { get; set; }

        public byte[]? Content { get; set; }

        public string FileName { get; set; }

        public string ContentType { get; set; }

        public LLMRequestBodyPart()
        {
            Type = "field";
            Name = "";
            Value = "";
            Content = null;
            FileName = "";
            ContentType = "application/octet-stream";
        }
    }
}
