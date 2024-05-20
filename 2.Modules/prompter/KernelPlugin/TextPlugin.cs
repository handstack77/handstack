using System.ComponentModel;
using System.Globalization;

using Microsoft.SemanticKernel;

namespace prompter.KernelPlugin
{
    public sealed class TextPlugin
    {
        [KernelFunction, Description("Trim whitespace from the start and end of a string.")]
        public string Trim(string input) => input.Trim();

        [KernelFunction, Description("Trim whitespace from the start of a string.")]
        public string TrimStart(string input) => input.TrimStart();

        [KernelFunction, Description("Trim whitespace from the end of a string.")]
        public string TrimEnd(string input) => input.TrimEnd();

        [KernelFunction, Description("Convert a string to uppercase.")]
        public string Uppercase(string input, CultureInfo? cultureInfo = null) => input.ToUpper(cultureInfo);

        [KernelFunction, Description("Convert a string to lowercase.")]
        public string Lowercase(string input, CultureInfo? cultureInfo = null) => input.ToLower(cultureInfo);

        [KernelFunction, Description("Get the length of a string.")]
        public int Length(string input) => input?.Length ?? 0;

        [KernelFunction, Description("Concat two strings into one.")]
        public string Concat(
            [Description("First input to concatenate with")] string input,
            [Description("Second input to concatenate with")] string input2) =>
            string.Concat(input, input2);

        [KernelFunction, Description("Echo the input string. Useful for capturing plan input for use in multiple functions.")]
        public string Echo(
          [Description("Input string to echo.")] string text)
        {
            return text;
        }
    }
}
