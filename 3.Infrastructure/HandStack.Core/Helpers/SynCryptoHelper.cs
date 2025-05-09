using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Web;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Core.Helpers
{
    public static class SynCryptoHelper
    {
        public static string Encrypt(string plainText, string key = "")
        {
            var buffer = new List<int>();
            var keyLength = 6;
            if (string.IsNullOrEmpty(key) == true)
            {
                key = key.ToSHA256().Substring(0, keyLength);
            }
            else
            {
                keyLength = key.Length;
            }

            key = key.ToSHA256().Substring(0, keyLength);

            for (var i = 0; i < plainText.Length; i++)
            {
                var passOffset = i % keyLength;
                var calAscii = (plainText[i] + key[passOffset]);
                buffer.Add(calAscii);
            }

            return HttpUtility.UrlEncode(Convert.ToBase64String(Encoding.UTF8.GetBytes((JsonSerializer.Serialize(buffer)) + "." + key)));
        }

        public static string Decrypt(string cipherText, string key = "")
        {
            var result = string.Empty;
            if (string.IsNullOrEmpty(cipherText) == true)
            {
                return result;
            }
            else
            {
                cipherText = Encoding.UTF8.GetString(Convert.FromBase64String(HttpUtility.UrlDecode(cipherText)));

                if (cipherText.IndexOf('.') == -1)
                {
                    return result;
                }

                var source = cipherText.Split('.');
                var content = source[0];
                var passcode = source[1];

                var keyLength = 6;
                if (string.IsNullOrEmpty(key) == true)
                {
                    key = key.ToSHA256().Substring(0, keyLength);
                }
                else
                {
                    keyLength = key.Length;
                }

                if (passcode == key.ToSHA256().Substring(0, keyLength))
                {
                    var buffer = new List<int>();
                    var str = new List<char>();
                    var charList = JsonSerializer.Deserialize<List<int>>(content);

                    if (charList != null)
                    {
                        for (var i = 0; i < charList.Count; i++)
                        {
                            var passOffset = i % keyLength;
                            var calAscii = (charList[i] - passcode[passOffset]);
                            buffer.Add(calAscii);
                        }
                        for (var i = 0; i < buffer.Count; i++)
                        {
                            var ch = buffer[i];
                            str.Add((char)ch);
                        }

                        result = new string(str.ToArray());
                    }
                }
            }

            return result;
        }
    }
}
