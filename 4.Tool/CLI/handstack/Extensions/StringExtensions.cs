using System;

namespace handstack.Extensions
{
    public static class StringExtensions
    {
        public static string ReplaceLastOccurrence(this string source, string findText, string replaceText)
        {
            var startIndex = source.LastIndexOf(findText, StringComparison.Ordinal);

            return source.Remove(startIndex, findText.Length).Insert(startIndex, replaceText);
        }
    }
}
