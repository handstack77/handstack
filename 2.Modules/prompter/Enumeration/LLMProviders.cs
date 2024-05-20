using System.Collections.Generic;

namespace prompter.Enumeration
{
    public enum LLMProviders
    {
        OpenAI,
        AzureOpenAI,
    }

    public static class LLMProvidersExtensions
    {
        private static readonly Dictionary<LLMProviders, string> BaseLLMProviders = new Dictionary<LLMProviders, string>
        {
            { LLMProviders.OpenAI, "OpenAI" },
            { LLMProviders.AzureOpenAI, "AzureOpenAI" },
        };

        public static string ToEnumString(this LLMProviders key, string category = "base")
        {
            string result = string.Empty;
            switch (category)
            {
                default:
                    result = BaseLLMProviders[key];
                    break;
            }

            return result;
        }
    }
}
