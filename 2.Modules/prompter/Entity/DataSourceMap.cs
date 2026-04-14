using System.Collections.Generic;

using prompter.Enumeration;

namespace prompter.Entity
{
    public record DataSourceMap
    {
        public string ApplicationID { get; set; }

        public List<string> ProjectListID { get; set; }

        public LLMProviders LLMProvider { get; set; }

        public string ModelID { get; set; }

        public string ApiKey { get; set; }

        public string? Endpoint { get; set; }

        public string? ServiceID { get; set; }

        public DataSourceMap()
        {
            ApplicationID = "";
            ProjectListID = new List<string>();
            LLMProvider = LLMProviders.OpenAI;
            ModelID = "";
            ApiKey = "";
            Endpoint = string.Empty;
            ServiceID = string.Empty;
        }
    }
}
