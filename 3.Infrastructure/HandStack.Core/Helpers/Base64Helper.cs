using System;
using System.Text;
using System.Text.RegularExpressions;

namespace HandStack.Core.Helpers
{
    public static class Base64Helper
    {
        private static readonly Regex Base64FormatRegex = new Regex(@"[^A-Z0-9+/=]", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly UTF8Encoding StrictUtf8Encoding = new UTF8Encoding(false, true);

        internal static bool IsBase64DataStrict(string? data)
        {
            if (string.IsNullOrWhiteSpace(data))
            {
                return false;
            }

            data = data!.Trim();

            if (data.Length % 4 != 0)
            {
                return false;
            }

            if (Base64FormatRegex.IsMatch(data))
            {
                return false;
            }

            var equalIndex = data.IndexOf('=');
            var length = data.Length;

            if (!(equalIndex == -1 || equalIndex == length - 1 || (equalIndex == length - 2 && data[length - 1] == '=')))
            {
                return false;
            }

            string? decoded;

            try
            {
                var decodedData = Convert.FromBase64String(data);
                decoded = StrictUtf8Encoding.GetString(decodedData);
            }
            catch (Exception)
            {
                return false;
            }

            char current;
            for (var i = 0; i < decoded.Length; i++)
            {
                current = decoded[i];
                if (current == 65533)
                {
                    return false;
                }

                if (!(current == 0x9
                    || current == 0xA
                    || current == 0xD
                    || (current >= 0x20 && current <= 0xD7FF)
                    || (current >= 0xE000 && current <= 0xFFFD)
                    || (current >= 0x10000 && current <= 0x10FFFF)))
                {
                    return false;
                }
            }

            return true;
        }
    }
}
