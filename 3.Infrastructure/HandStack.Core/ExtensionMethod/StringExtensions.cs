using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Serialization;

namespace HandStack.Core.ExtensionMethod
{
    public static class StringExtensions
    {
        public static string ToStringSafe(this string? @this)
        {
            return @this?.ToString() ?? "";
        }

        public static string ToStringSafe(this string? @this, string defaultValue)
        {
            return @this?.ToString() ?? defaultValue;
        }

        public static string ToString(this string? @this, string defaultValue)
        {
            return @this?.ToString() ?? defaultValue;
        }

        public static string ToJoin<T>(this IEnumerable<T> @this, string separator)
        {
            return string.Join(separator, @this);
        }

        public static string ToJoin<T>(this IEnumerable<T> @this, char separator)
        {
            return string.Join(separator.ToString(), @this);
        }

        public static byte[] ToByte(this string @this, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            return encoding.GetBytes(@this);
        }

        public static string GenerateUniqueId(int uniqueSize = 8)
        {
            string chars = "abcdefghijkmnopqrstuvwxyz1234567890";
            StringBuilder sb = new StringBuilder(uniqueSize);

            int count = 0;
            foreach (byte b in Guid.NewGuid().ToByteArray())
            {
                sb.Append(chars[b % (chars.Length - 1)]);

                count++;

                if (count >= uniqueSize)
                {
                    return sb.ToString();
                }
            }

            return sb.ToString();
        }

        public static long GenerateUniqueNumericId()
        {
            byte[] bytes = Guid.NewGuid().ToByteArray();
            return BitConverter.ToInt64(bytes, 0);
        }

        public static string ToBetween(this string @this, char startChar, char endChar)
        {
            string Result = "";
            int StartIndex = @this.IndexOf(startChar);

            if (StartIndex != -1)
            {
                ++StartIndex;
                int EndIndex = @this.IndexOf(endChar, StartIndex);
                if (EndIndex != -1)
                {
                    Result = @this.Substring(StartIndex, EndIndex - StartIndex);
                }
            }

            return Result;
        }

        public static int Count(this string @this, char searchChar)
        {
            int Result = 0;
            foreach (char CharValue in @this)
            {
                if (CharValue == searchChar)
                {
                    ++Result;
                }
            }

            return Result;
        }

        public static bool IsInteger(this string @this)
        {
            int output;
            return int.TryParse(@this, out output);
        }

        public static bool IsNumeric(this string @this)
        {
            float output;
            return float.TryParse(@this, out output);
        }

        public static bool IsNullOrEmpty(this string @this)
        {
            return string.IsNullOrEmpty(@this);
        }

        public static string Concat(this string @this, params string[] concatValues)
        {
            return string.Concat(@this, string.Concat(concatValues));
        }

        public static string Left(this string @this, int length)
        {
            return Left(@this, length, true);
        }

        public static string Left(this string @this, int length, bool isText = true)
        {
            if (string.IsNullOrEmpty(@this) || length > @this.Length || length < 0)
            {
                return @this;
            }

            if (isText == false)
            {
                return @this.Substring(0, length);
            }
            else
            {
                Byte[] utf8Bytes = Encoding.UTF8.GetBytes(@this);
                Byte[] convertBytes = Encoding.Convert(Encoding.UTF8, Encoding.Default, utf8Bytes);

                if (convertBytes.Length < length)
                {
                    return Encoding.Default.GetString(convertBytes);
                }
                else
                {
                    return Encoding.Default.GetString(convertBytes, 0, length);
                }
            }
        }

        public static string Right(this string @this, int length)
        {
            if (string.IsNullOrEmpty(@this) || length > @this.Length || length < 0)
            {
                return @this;
            }

            return @this.Substring(@this.Length - length);
        }

        public static bool IsMatch(this string @this, string regexPattern)
        {
            return (new Regex(regexPattern)).IsMatch(@this);
        }

        public static string[] Split(this string @this, string separator)
        {
            return @this.Split(separator.ToCharArray());
        }

        public static string[] Split(this string @this, string regexPattern, RegexOptions patternOptions)
        {
            return Regex.Split(@this, regexPattern, patternOptions);
        }

        public static byte[] ToBytes(this string @this, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            return encoding.GetBytes(@this);
        }

        public static byte[] HexToBytes(this string hex)
        {
            byte[] bytes = new byte[hex.Length / 2];
            for (int i = 0; i < hex.Length / 2; i++)
            {
                string code = hex.Substring(i * 2, 2);
                bytes[i] = byte.Parse(code, NumberStyles.HexNumber);
            }
            return bytes;
        }

        public static string BytesToHex(this byte[] bytes)
        {
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                hex.AppendFormat("{0:X2}", bytes[i]);
            }
            return hex.ToString();
        }

        public static List<string> ToList(this string @this, string separator)
        {
            List<string> list = new List<string>();

            foreach (string value in @this.Split(separator.ToCharArray()))
            {
                list.Add(value.Trim());
            }

            return list;
        }

        public static string EncodeBase64(this string @this)
        {
            return Convert.ToBase64String(@this.ToBytes(Encoding.UTF8));
        }

        public static string EncodeBase64(this string @this, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            return Convert.ToBase64String(@this.ToBytes(encoding));
        }

        public static string DecodeBase64(this string @this)
        {
            return Encoding.UTF8.GetString(Convert.FromBase64String(@this));
        }

        public static string DecodeBase64(this string @this, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            return encoding.GetString(Convert.FromBase64String(@this));
        }

        public static bool ParseBool(this string @this, bool defaultValue = false)
        {
            bool result = false;
            if (string.IsNullOrEmpty(@this) == true)
            {
                result = defaultValue;
            }
            else
            {
                result = (@this == "true" || @this == "True" || @this == "TRUE" || @this == "Y" || @this == "1");
            }

            return result;
        }

        public static DateTime? ParseDateTime(this string @this, DateTime? defaultValue = null, DateTimeStyles dateTimeStyles = DateTimeStyles.None)
        {
            DateTime? result = null;

            if (string.IsNullOrEmpty(@this) == true)
            {
                result = defaultValue;
            }
            else
            {
                DateTime dateTime;
                bool isParse = DateTime.TryParse(@this, out dateTime);
                if (isParse == true)
                {
                    result = dateTime;
                }
            }

            return result;
        }

        public static int ParseInt(this string @this, int defaultValue)
        {
            return ParseInt(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static int ParseInt(this string @this, int defaultValue, IFormatProvider numberFormat)
        {
            int Result = defaultValue;
            int.TryParse(@this, NumberStyles.Any, numberFormat, out Result);
            return Result;
        }

        public static long ParseLong(this string @this, long defaultValue)
        {
            return ParseLong(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static long ParseLong(this string @this, long defaultValue, IFormatProvider numberFormat)
        {
            long Result = defaultValue;
            long.TryParse(@this, NumberStyles.Any, numberFormat, out Result);
            return Result;
        }

        public static decimal ParseDecimal(this string @this, decimal defaultValue)
        {
            return ParseDecimal(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static decimal ParseDecimal(this string @this, decimal defaultValue, IFormatProvider numberFormat)
        {
            decimal Result = defaultValue;
            decimal.TryParse(@this, NumberStyles.Any, numberFormat, out Result);
            return Result;
        }

        public static double ParseDouble(this string @this, double defaultValue)
        {
            return ParseDouble(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static double ParseDouble(this string @this, double defaultValue, IFormatProvider numberFormat)
        {
            double Result = defaultValue;
            double.TryParse(@this, NumberStyles.Any, numberFormat, out Result);
            return Result;
        }

        public static float ParseFloat(this string @this, float defaultValue)
        {
            return ParseFloat(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static float ParseFloat(this string @this, float defaultValue, IFormatProvider numberFormat)
        {
            float Result = defaultValue;
            float.TryParse(@this, NumberStyles.Any, numberFormat, out Result);
            return Result;
        }

        public static string ToNumeric(this string @this)
        {
            if (string.IsNullOrEmpty(@this) == false)
            {
                char[] result = new char[@this.Length];
                int i = 0;

                foreach (char character in @this)
                {
                    if (char.IsNumber(character))
                    {
                        result[i++] = character;
                    }
                }

                if (0 == i)
                {
                    @this = "";
                }
                else if (result.Length != i)
                {
                    @this = new string(result, 0, i);
                }
            }
            return @this;
        }

        public static int ToCount(this string @this, string pattern)
        {
            int count = 0;
            int i = 0;
            while ((i = @this.IndexOf(pattern, i)) != -1)
            {
                i += pattern.Length;
                count++;
            }
            return count;
        }

        public static bool ToBoolean(this string @this)
        {
            return Reflector.StringToTypedValue<bool>(@this);
        }

        public static short ToShort(this string @this)
        {
            return Reflector.StringToTypedValue<short>(@this);
        }

        public static int ToInt(this string @this)
        {
            return Reflector.StringToTypedValue<int>(@this);
        }

        public static long ToLong(this string @this)
        {
            return Reflector.StringToTypedValue<long>(@this);
        }

        public static decimal ToDecimal(this string @this)
        {
            return Reflector.StringToTypedValue<decimal>(@this);
        }

        public static float ToFloat(this string @this)
        {
            return Reflector.StringToTypedValue<float>(@this);
        }

        public static double ToDouble(this string @this)
        {
            return Reflector.StringToTypedValue<double>(@this);
        }

        public static DateTime ToDateTime(this string @this, string dateFormat)
        {
            return XmlConvert.ToDateTime(@this, dateFormat);
        }

        public static string Replace(this string @this, string regexPattern, string replaceValue, bool ignoreCase)
        {
            if (string.IsNullOrEmpty(@this) == true)
            {
                return @this;
            }

            if (ignoreCase == true)
            {
                return Regex.Replace(@this, regexPattern, replaceValue, RegexOptions.Compiled | RegexOptions.IgnoreCase);
            }
            else
            {
                return Regex.Replace(@this, regexPattern, replaceValue, RegexOptions.Compiled);
            }
        }

        public static string Replace(this string @this, int index, int length, string replacement)
        {
            var builder = new StringBuilder();
            builder.Append(@this.Substring(0, index));
            builder.Append(replacement);
            builder.Append(@this.Substring(index + length));
            return builder.ToString();
        }

        public static string ToCamelCase(this string @this)
        {
            if (string.IsNullOrEmpty(@this) == true)
            {
                return @this;
            }

            return char.ToLowerInvariant(@this[0]) + @this.Substring(1);
        }

        public static string Format(this string format, object[] args)
        {
            return string.Format(format, args);
        }

        public static Match Match(this string @this, string pattern)
        {
            return Regex.Match(@this, pattern);
        }

        public static Match Match(this string @this, string pattern, RegexOptions options)
        {
            return Regex.Match(@this, pattern, options);
        }

        public static MatchCollection Matches(this string @this, string pattern)
        {
            return Regex.Matches(@this, pattern);
        }

        public static MatchCollection Matches(this string @this, string pattern, RegexOptions options)
        {
            return Regex.Matches(@this, pattern, options);
        }

        public static string ToSHA256(this string value)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(value));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

        public static string ToSHA256(this string value, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(encoding.GetBytes(value));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

        public static string EncryptAES(this string value, string key, int keySize = 256, int blockSize = 128, CipherMode cipherMode = CipherMode.CBC, PaddingMode paddingMode = PaddingMode.PKCS7, int ivLength = 16)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = cipherMode;
            aes.Padding = paddingMode;
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = new byte[ivLength];

            var encrypt = aes.CreateEncryptor(aes.Key, aes.IV);
            using (var ms = new MemoryStream())
            {
                using (var cs = new CryptoStream(ms, encrypt, CryptoStreamMode.Write))
                {
                    byte[] bytes = Encoding.UTF8.GetBytes(value);
                    cs.Write(bytes, 0, bytes.Length);
                }

                return Convert.ToBase64String(ms.ToArray());
            }
        }

        public static string DecryptAES(this string value, string key, int keySize = 256, int blockSize = 128, CipherMode cipherMode = CipherMode.CBC, PaddingMode paddingMode = PaddingMode.PKCS7, int ivLength = 16)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = cipherMode;
            aes.Padding = paddingMode;
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = new byte[ivLength];

            var decrypt = aes.CreateDecryptor();
            using (var ms = new MemoryStream())
            {
                using (var cs = new CryptoStream(ms, decrypt, CryptoStreamMode.Write))
                {
                    byte[] bytes = Convert.FromBase64String(value);
                    cs.Write(bytes, 0, bytes.Length);
                }

                return Encoding.UTF8.GetString(ms.ToArray());
            }
        }

        public static string? Truncate(this string @this, int maxLength, string suffix = "...")
        {
            if (@this == null || @this.Length <= maxLength)
            {
                return @this;
            }

            int strLength = maxLength - suffix.Length;
            return @this.Substring(0, strLength) + suffix;
        }

        public static StringBuilder AppendIf<T>(this StringBuilder @this, Func<T, bool> predicate, params T[] values)
        {
            foreach (var item in values)
            {
                if (predicate(item))
                {
                    @this.Append(item);
                }
            }

            return @this;
        }

        public static StringBuilder AppendJoin<T>(this StringBuilder @this, string separator, IEnumerable<T> values)
        {
            @this.Append(string.Join(separator, values));

            return @this;
        }

        public static StringBuilder AppendJoin<T>(this StringBuilder @this, string separator, params T[] values)
        {
            @this.Append(string.Join(separator, values));

            return @this;
        }

        public static StringBuilder AppendLineFormat(this StringBuilder @this, string format, params object[] args)
        {
            @this.AppendLine(string.Format(format, args));

            return @this;
        }

        public static StringBuilder AppendLineFormat(this StringBuilder @this, string format, List<IEnumerable<object>> args)
        {
            @this.AppendLine(string.Format(format, args));

            return @this;
        }

        public static StringBuilder AppendLineJoin<T>(this StringBuilder @this, string separator, IEnumerable<T> values)
        {
            @this.AppendLine(string.Join(separator, values));

            return @this;
        }

        public static StringBuilder AppendLineJoin(this StringBuilder @this, string separator, params object[] values)
        {
            @this.AppendLine(string.Join(separator, values));

            return @this;
        }

        public static string Substring(this StringBuilder @this, int startIndex)
        {
            return @this.ToString(startIndex, @this.Length - startIndex);
        }

        public static string Substring(this StringBuilder @this, int startIndex, int length)
        {
            return @this.ToString(startIndex, length);
        }

        public static T? DeserializeJson<T>(this string @this)
        {
            var serializer = new DataContractJsonSerializer(typeof(T));

            using (var stream = new MemoryStream(Encoding.Default.GetBytes(@this)))
            {
                return (T?)serializer.ReadObject(stream);
            }
        }

        public static T? DeserializeJson<T>(this string @this, Encoding encoding)
        {
            var serializer = new DataContractJsonSerializer(typeof(T));

            using (var stream = new MemoryStream(encoding.GetBytes(@this)))
            {
                return (T?)serializer.ReadObject(stream);
            }
        }

        public static T? DeserializeXml<T>(this string @this)
        {
            var x = new XmlSerializer(typeof(T));
            var r = new StringReader(@this);

            return (T?)x.Deserialize(r);
        }

        public static T? GetEnumValueFromDescription<T>(this string description) where T : Enum
        {
            var value =
                typeof(T).GetFields()
                .SelectMany(x => x.GetCustomAttributes(typeof(DescriptionAttribute), false),
                    (f, a) => new { field = f, attribute = a })
                .Where(x => ((DescriptionAttribute)x.attribute).Description == description)
                .FirstOrDefault()
                ?.field.GetRawConstantValue();

            return (T?)(value ?? default(T));
        }

        public static bool ToBoolean(this string @this, bool defaultValue)
        {
            return ToBoolean((object)@this, defaultValue);
        }

        public static bool ToBoolean(this object @this, bool defaultValue)
        {
            bool result = defaultValue;

            if (@this != null)
            {
                try
                {
                    string? value = @this.ToString();
                    if (string.IsNullOrEmpty(value) == true)
                    {
                        result = false;
                    }
                    else
                    {
                        switch (value.ToLower())
                        {
                            case "yes":
                            case "true":
                            case "y":
                            case "1":
                                result = true;
                                break;

                            case "no":
                            case "false":
                            case "n":
                            case "0":
                                result = false;
                                break;

                            default:
                                result = bool.Parse(value);
                                break;
                        }
                    }
                }
                catch
                {
                }
            }

            return result;
        }

        public static bool HasEscapeChar(this string @this)
        {
            return @this.Contains("\\n")
                || @this.Contains("\\r")
                || @this.Contains("\\\\")
                || @this.Contains("\\\"")
                || @this.Contains("\\t")
                || @this.Contains("\\f")
                || @this.Contains("\\b");
        }

        public static List<string> SplitComma(this string raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
            {
                return new List<string>();
            }

            return raw.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                      .Select(s => s.Trim())
                      .ToList();
        }

        public static List<string> SplitAndTrim(this string value, params char[] separators)
        {
            return value.Trim().Split(separators, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList();
        }
    }
}
