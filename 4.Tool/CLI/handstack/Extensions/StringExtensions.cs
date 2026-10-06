using System;

namespace handstack.Extensions
{
    public static class StringExtensions
    {
        public static string ReplaceLastOccurrence(this string source, string findText, string replaceText)
        {
            ArgumentNullException.ThrowIfNull(source);

            var startIndex = source.LastIndexOf(findText, StringComparison.Ordinal);

            ArgumentNullException.ThrowIfNull(findText);
            return source.Remove(startIndex, findText.Length).Insert(startIndex, replaceText);
        }
    }
}
