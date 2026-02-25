using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
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
        private const string BaseChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        public static string DateConvert(object inputValue, char operationType)
        {
            string defaultEncodedResult = GetDefaultEncodedResult();
            string processedInput;

            if (inputValue is DateTime dateTime)
            {
                processedInput = dateTime.ToString("yyyyMMdd");
            }
            else if (inputValue is DateTimeOffset dateTimeOffset)
            {
                processedInput = dateTimeOffset.ToString("yyyyMMdd");
            }
            else
            {
                processedInput = inputValue?.ToString() ?? string.Empty;
            }

            if (operationType == 'E')
            {
                if (long.TryParse(processedInput, out long numberToEncode))
                {
                    return EncodeToBase36(numberToEncode);
                }
                return defaultEncodedResult;
            }
            else if (operationType == 'D')
            {
                if (string.IsNullOrWhiteSpace(processedInput))
                {
                    return defaultEncodedResult;
                }

                long? decodedNumber = DecodeFromBase36(processedInput);

                if (decodedNumber.HasValue)
                {
                    return decodedNumber.Value.ToString();
                }
                return defaultEncodedResult;
            }
            else
            {
                return defaultEncodedResult;
            }
        }

        private static string GetDefaultEncodedResult()
        {
            DateTime today = DateTime.Now;
            long todayNumber = long.Parse(today.ToString("yyyyMMdd"));
            return EncodeToBase36(todayNumber);
        }

        private static string EncodeToBase36(long number)
        {
            if (number == 0)
            {
                return "0";
            }

            string result = string.Empty;
            long temp = number;

            while (temp > 0)
            {
                result = BaseChars[(int)(temp % 36)] + result;
                temp /= 36;
            }

            return result;
        }

        private static long? DecodeFromBase36(string encoded)
        {
            if (string.IsNullOrWhiteSpace(encoded))
            {
                return null;
            }

            string upperEncoded = encoded.ToUpper();
            long result = 0;
            long basePower = 1;

            for (int i = upperEncoded.Length - 1; i >= 0; i--)
            {
                int digit = BaseChars.IndexOf(upperEncoded[i]);

                if (digit < 0)
                {
                    return null;
                }

                result += digit * basePower;
                basePower *= 36;
            }

            return result;
        }


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
            var chars = "abcdefghijkmnopqrstuvwxyz1234567890";
            var sb = new StringBuilder(uniqueSize);

            var count = 0;
            foreach (var b in Guid.NewGuid().ToByteArray())
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
            var bytes = Guid.NewGuid().ToByteArray();
            return BitConverter.ToInt64(bytes, 0);
        }

        public static string ToBetween(this string @this, char startChar, char endChar)
        {
            var Result = "";
            var StartIndex = @this.IndexOf(startChar);

            if (StartIndex != -1)
            {
                ++StartIndex;
                var EndIndex = @this.IndexOf(endChar, StartIndex);
                if (EndIndex != -1)
                {
                    Result = @this.Substring(StartIndex, EndIndex - StartIndex);
                }
            }

            return Result;
        }

        public static int Count(this string @this, char searchChar)
        {
            var Result = 0;
            foreach (var CharValue in @this)
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
            return string.IsNullOrWhiteSpace(@this);
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
            if (string.IsNullOrWhiteSpace(@this) || length > @this.Length || length < 0)
            {
                return @this;
            }

            if (isText == false)
            {
                return @this.Substring(0, length);
            }
            else
            {
                var utf8Bytes = Encoding.UTF8.GetBytes(@this);
                var convertBytes = Encoding.Convert(Encoding.UTF8, Encoding.Default, utf8Bytes);

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
            if (string.IsNullOrWhiteSpace(@this) || length > @this.Length || length < 0)
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
            var bytes = new byte[hex.Length / 2];
            for (var i = 0; i < hex.Length / 2; i++)
            {
                var code = hex.Substring(i * 2, 2);
                bytes[i] = byte.Parse(code, NumberStyles.HexNumber);
            }
            return bytes;
        }

        public static List<string> ToList(this string @this, string separator)
        {
            var list = new List<string>();

            foreach (var value in @this.Split(separator.ToCharArray()))
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

        public static string EncodeBase64Url(this string @this)
        {
            return WebUtility.UrlEncode(Convert.ToBase64String(@this.ToBytes(Encoding.UTF8)));
        }

        public static string EncodeBase64Url(this string @this, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            return WebUtility.UrlEncode(Convert.ToBase64String(@this.ToBytes(encoding)));
        }

        public static string DecodeBase64Url(this string @this)
        {
            return Encoding.UTF8.GetString(Convert.FromBase64String(WebUtility.UrlDecode(@this)));
        }

        public static string DecodeBase64Url(this string @this, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            return encoding.GetString(Convert.FromBase64String(WebUtility.UrlDecode(@this)));
        }

        public static bool ParseBool(this string @this, bool defaultValue = false)
        {
            if (string.IsNullOrWhiteSpace(@this))
            {
                return defaultValue;
            }

            var lowerVal = @this.ToLower();
            var trueValues = new[] { "true", "y", "1", "ok", "yes", "on" };
            return trueValues.Contains(lowerVal);
        }

        public static DateTime? ParseDateTime(this string @this, DateTime? defaultValue = null, DateTimeStyles dateTimeStyles = DateTimeStyles.None)
        {
            DateTime? result = null;

            if (string.IsNullOrWhiteSpace(@this))
            {
                result = defaultValue;
            }
            else
            {
                DateTime dateTime;
                var isParse = DateTime.TryParse(@this, out dateTime);
                if (isParse == true)
                {
                    result = dateTime;
                }
                else
                {
                    result = defaultValue;
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
            var result = defaultValue;
            return int.TryParse(@this, NumberStyles.Any, numberFormat, out result) == true ? result : defaultValue;
        }

        public static long ParseLong(this string @this, long defaultValue)
        {
            return ParseLong(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static long ParseLong(this string @this, long defaultValue, IFormatProvider numberFormat)
        {
            var result = defaultValue;
            return long.TryParse(@this, NumberStyles.Any, numberFormat, out result) == true ? result : defaultValue;
        }

        public static decimal ParseDecimal(this string @this, decimal defaultValue)
        {
            return ParseDecimal(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static decimal ParseDecimal(this string @this, decimal defaultValue, IFormatProvider numberFormat)
        {
            var result = defaultValue;
            return decimal.TryParse(@this, NumberStyles.Any, numberFormat, out result) == true ? result : defaultValue;
        }

        public static double ParseDouble(this string @this, double defaultValue)
        {
            return ParseDouble(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static double ParseDouble(this string @this, double defaultValue, IFormatProvider numberFormat)
        {
            var result = defaultValue;
            return double.TryParse(@this, NumberStyles.Any, numberFormat, out result) == true ? result : defaultValue;
        }

        public static float ParseFloat(this string @this, float defaultValue)
        {
            return ParseFloat(@this, defaultValue, CultureInfo.CurrentCulture.NumberFormat);
        }

        public static float ParseFloat(this string @this, float defaultValue, IFormatProvider numberFormat)
        {
            var result = defaultValue;
            return float.TryParse(@this, NumberStyles.Any, numberFormat, out result) == true ? result : defaultValue;
        }

        public static string ToNumeric(this string @this)
        {
            if (!string.IsNullOrWhiteSpace(@this))
            {
                var result = new char[@this.Length];
                var i = 0;

                foreach (var character in @this)
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
            var count = 0;
            var i = 0;
            while ((i = @this.IndexOf(pattern, i)) != -1)
            {
                i += pattern.Length;
                count++;
            }
            return count;
        }

        public static bool ToBoolean(this string? @this)
        {
            if (string.IsNullOrWhiteSpace(@this))
            {
                return false;
            }

            return ParseBool(@this);
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
            if (string.IsNullOrWhiteSpace(@this))
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
            if (string.IsNullOrWhiteSpace(@this))
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

        public static string ToSHA256(this string @this)
        {
            using var sha256Hash = SHA256.Create();
            var bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(@this));
            var builder = new StringBuilder();
            for (var i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            return builder.ToString();
        }

        public static string ToSHA256(this string @this, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            using var sha256Hash = SHA256.Create();
            var bytes = sha256Hash.ComputeHash(encoding.GetBytes(@this));
            var builder = new StringBuilder();
            for (var i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            return builder.ToString();
        }

        public static string EncryptAES(this string @this, string key, int keySize = 256, int blockSize = 128, CipherMode cipherMode = CipherMode.CBC, PaddingMode paddingMode = PaddingMode.PKCS7, int ivLength = 16)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = cipherMode;
            aes.Padding = paddingMode;
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = new byte[ivLength];

            var encrypt = aes.CreateEncryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream();
            using (var cs = new CryptoStream(ms, encrypt, CryptoStreamMode.Write))
            {
                var bytes = Encoding.UTF8.GetBytes(@this);
                cs.Write(bytes, 0, bytes.Length);
            }

            return Convert.ToBase64String(ms.ToArray());
        }

        public static string DecryptAES(this string @this, string key, int keySize = 256, int blockSize = 128, CipherMode cipherMode = CipherMode.CBC, PaddingMode paddingMode = PaddingMode.PKCS7, int ivLength = 16)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = cipherMode;
            aes.Padding = paddingMode;
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = new byte[ivLength];

            var decrypt = aes.CreateDecryptor();
            using var ms = new MemoryStream();
            using (var cs = new CryptoStream(ms, decrypt, CryptoStreamMode.Write))
            {
                var bytes = Convert.FromBase64String(@this);
                cs.Write(bytes, 0, bytes.Length);
            }

            return Encoding.UTF8.GetString(ms.ToArray());
        }

        public static byte[] DecryptAESBytes(this string @this, string key, int keySize = 256, int blockSize = 128, CipherMode cipherMode = CipherMode.CBC, PaddingMode paddingMode = PaddingMode.PKCS7, int ivLength = 16)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = cipherMode;
            aes.Padding = paddingMode;
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = new byte[ivLength];

            var decrypt = aes.CreateDecryptor();
            using var ms = new MemoryStream();
            using (var cs = new CryptoStream(ms, decrypt, CryptoStreamMode.Write))
            {
                var bytes = Convert.FromBase64String(@this);
                cs.Write(bytes, 0, bytes.Length);
            }

            return ms.ToArray();
        }

        public static string? Truncate(this string @this, int maxLength, string suffix = "...")
        {
            if (@this == null || @this.Length <= maxLength)
            {
                return @this;
            }

            var strLength = maxLength - suffix.Length;
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

            using var stream = new MemoryStream(Encoding.Default.GetBytes(@this));
            return (T?)serializer.ReadObject(stream);
        }

        public static T? DeserializeJson<T>(this string @this, Encoding encoding)
        {
            var serializer = new DataContractJsonSerializer(typeof(T));

            using var stream = new MemoryStream(encoding.GetBytes(@this));
            return (T?)serializer.ReadObject(stream);
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
            var result = defaultValue;

            if (@this != null)
            {
                try
                {
                    var value = @this.ToString();
                    if (string.IsNullOrWhiteSpace(value))
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

        public static List<string> SplitComma(this string @this)
        {
            if (string.IsNullOrWhiteSpace(@this))
            {
                return new List<string>();
            }

            return @this.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                      .Select(s => s.Trim())
                      .ToList();
        }

        public static List<string> SplitAndTrim(this string @this, params char[] separators)
        {
            return @this.Trim().Split(separators, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList();
        }

        public static string WordWrap(this string @this, int maxLineLength)
        {
            var result = new StringBuilder(256);
            int i;
            var last = 0;
            var space = new[] { ' ', '\r', '\n', '\t' };
            do
            {
                i = last + maxLineLength > @this.Length
                    ? @this.Length
                    : (@this.LastIndexOfAny(new[] { ' ', ',', '.', '?', '!', ':', ';', '-', '\n', '\r', '\t' }, Math.Min(@this.Length - 1, last + maxLineLength)) + 1);
                if (i <= last) i = Math.Min(last + maxLineLength, @this.Length);
                result.AppendLine(@this.Substring(last, i - last).Trim(space));
                last = i;
            } while (i < @this.Length);

            return result.ToString();
        }

        public static string PaddingLeft(this string @this, int totalWidth, char paddingChar = ' ')
        {
            if (totalWidth <= 0)
            {
                return @this;
            }
            return @this.PadLeft(totalWidth, paddingChar).Substring(0, totalWidth);
        }

        public static string PaddingRight(this string @this, int totalWidth, char paddingChar = ' ')
        {
            if (totalWidth <= 0)
            {
                return @this;
            }
            return @this.PadRight(totalWidth, paddingChar).Substring(0, totalWidth);
        }

        public static string NormalizeKey(this string @this)
        {
            if (@this.Length == 32) return @this;
            if (@this.Length == 64 && Regex.IsMatch(@this, "^[0-9a-fA-F]{64}$"))
            {
                return @this.Substring(0, 32);
            }
            if (@this.Length < 32)
            {
                return @this.PadRight(32, '0');
            }

            var hex = @this.ToSHA256();
            return hex.Substring(0, 32);
        }
    }
}

