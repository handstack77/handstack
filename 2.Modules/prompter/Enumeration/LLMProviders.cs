using System.Collections.Generic;

namespace prompter.Enumeration
{
    public enum LLMProviders
    {
        OpenAI,
        Claude,
        Gemini,
        Ollama,
        LMStudio,
        AzureOpenAI,
    }

    public static class LLMProvidersExtensions
    {
        private static readonly Dictionary<LLMProviders, string> BaseLLMProviders = new Dictionary<LLMProviders, string>
        {
            { LLMProviders.OpenAI, "OpenAI" },
            { LLMProviders.Claude, "Claude" },
            { LLMProviders.Gemini, "Gemini" },
            { LLMProviders.Ollama, "Ollama" },
            { LLMProviders.LMStudio, "LMStudio" },
            { LLMProviders.AzureOpenAI, "AzureOpenAI" },
        };

        public static string ToEnumString(this LLMProviders key, string category = "base")
        {
            var result = string.Empty;
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
