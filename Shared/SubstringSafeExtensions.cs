using System;

namespace HandStack.Core.ExtensionMethod
{
    internal static class SubstringSafeExtensions
    {
        public static string SubstringSafe(this string? value, int startIndex)
        {
            if (string.IsNullOrEmpty(value) == true || startIndex < 0 || startIndex >= value.Length)
            {
                return "";
            }

            return value.Substring(startIndex);
        }

        public static string SubstringSafe(this string? value, int startIndex, int length)
        {
            if (string.IsNullOrEmpty(value) == true || startIndex < 0 || length <= 0 || startIndex >= value.Length)
            {
                return "";
            }

            return value.Substring(startIndex, Math.Min(length, value.Length - startIndex));
        }
    }
}
