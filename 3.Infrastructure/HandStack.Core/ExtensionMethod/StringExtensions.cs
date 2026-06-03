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

        public static string ReplaceDefaultValueTokens(this string @this, IReadOnlyDictionary<string, string> bearerVariable, Func<string> sequentialIdFactory)
        {
            if (string.IsNullOrWhiteSpace(@this) == true)
            {
                return @this;
            }

            var bearerVariableTokenRegex = new Regex(@"(?<==)(?<token>\$[\p{L}_][\p{L}\p{N}_.-]*)", RegexOptions.CultureInvariant);
            var defaultValueTokenRegex = new Regex(@"(?<==)@(?<name>DateAdd|StartDateOfWeek|EndDateOfWeek|StartDateOfMonth|EndDateOfMonth|StartDateOfQuarter|EndDateOfQuarter|TimeSecond|Date|Now|Time|SUID|GUID)(?:\((?<args>[^)]*)\))?", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

            var defaultValues = bearerVariableTokenRegex.Replace(@this, match => bearerVariable.TryGetValue(match.Groups["token"].Value, out var value) == true ? value : string.Empty);
            var now = DateTime.Now;
            return defaultValueTokenRegex.Replace(defaultValues, match => ResolveDefaultValueToken(match, now, sequentialIdFactory));
        }

        // var resolvedDefaultValues = defaultValues.ReplaceDefaultValueTokens(bearerVariable, () => sequentialIdGenerator.NewId().ToString("N"));
        private static string ResolveDefaultValueToken(Match match, DateTime now, Func<string> sequentialIdFactory)
        {
            var tokenName = match.Groups["name"].Value.ToUpperInvariant();
            var args = ParseDefaultValueTokenArguments(match.Groups["args"].Value);

            /*
            # 기본값 토큰 치환 규칙
            - @Date 문자열을 "DateTime.Now yyyy-MM-dd" 형식으로 치환
            - @DateAdd(1), @DateAdd(-1) 과 같은 문자열을 "DateTime.Now 에 AddDays 를 적용하여 yyyy-MM-dd" 형식으로 치환
            - @StartDateOfWeek 문자열을 "금주 시작 일 적용하여 yyyy-MM-dd" 형식으로 치환
            - @EndDateOfWeek 문자열을 "금주 종료 일 적용하여 yyyy-MM-dd" 형식으로 치환
            - @StartDateOfMonth 문자열을 "당월 시작 일 적용하여 yyyy-MM-dd" 형식으로 치환
            - @EndDateOfMonth 문자열을 "당월 종료 일 적용하여 yyyy-MM-dd" 형식으로 치환
            - @StartDateOfMonth(1), StartDateOfMonth(-1) 과 같은 문자열을 "당월을 기준으로 AddMonths 를 적용하여 시작 일 yyyy-MM-dd" 형식으로 치환
            - @EndDateOfMonth(1), @EndDateOfMonth(-1) 과 같은 문자열을 "당월을 기준으로 AddMonths 를 적용하여 종료 일 yyyy-MM-dd" 형식으로 치환
            - @StartDateOfQuarter(1), @StartDateOfQuarter(2), @StartDateOfQuarter(3), @StartDateOfQuarter(4) 문자열을 "올해 특정 분기 시작 일 적용하여 yyyy-MM-dd" 형식으로 치환
            - @EndDateOfQuarter(1), @EndDateOfQuarter(2), @EndDateOfQuarter(3), @EndDateOfQuarter(4) 문자열을 "올해 특정 분기 종료 일 적용하여 yyyy-MM-dd" 형식으로 치환
            - @StartDateOfQuarter(1, -1), @StartDateOfQuarter(2, -1), @StartDateOfQuarter(3, -1), @StartDateOfQuarter(4, -1) 문자열을 "올해를 기준으로 두번째 매개변수로 년도를 이동하여 특정 분기 시작 일 적용하여 yyyy-MM-dd" 형식으로 치환
            - @EndDateOfQuarter(1, -1), @EndDateOfQuarter(2, -1), @EndDateOfQuarter(3, -1), @EndDateOfQuarter(4, -1) 문자열을 "올해를 기준으로 두번째 매개변수로 년도를 이동하여 특정 분기 종료 일 적용하여 yyyy-MM-dd" 형식으로 치환
            - @Now 문자열을 "DateTime.Now yyyy-MM-dd hh:mm:ss" 형식으로 치환 
            - @Time 문자열을 "DateTime.Now hh:mm" 형식으로 치환 
            - @TimeSecond 문자열을 "DateTime.Now hh:mm:ss" 형식으로 치환 
            - @SUID 문자열을 "sequentialIdGenerator.NewId().ToString("N");" 형식으로 치환 
            - @GUID 문자열을 "Guid.NewGuid().ToString("N");" 형식으로 치환 
            */
            return tokenName switch
            {
                "DATE" => now.ToString("yyyy-MM-dd"),
                "DATEADD" => now.AddDays(GetIntArgument(args, 0, 0)).ToString("yyyy-MM-dd"),
                "STARTDATEOFWEEK" => GetStartDateOfWeek(now).ToString("yyyy-MM-dd"),
                "ENDDATEOFWEEK" => GetStartDateOfWeek(now).AddDays(6).ToString("yyyy-MM-dd"),
                "STARTDATEOFMONTH" => GetStartDateOfMonth(now, GetIntArgument(args, 0, 0)).ToString("yyyy-MM-dd"),
                "ENDDATEOFMONTH" => GetStartDateOfMonth(now, GetIntArgument(args, 0, 0)).AddMonths(1).AddDays(-1).ToString("yyyy-MM-dd"),
                "STARTDATEOFQUARTER" => TryGetQuarterDate(args, now, out var startDateOfQuarter, false) == true ? startDateOfQuarter.ToString("yyyy-MM-dd") : match.Value,
                "ENDDATEOFQUARTER" => TryGetQuarterDate(args, now, out var endDateOfQuarter, true) == true ? endDateOfQuarter.ToString("yyyy-MM-dd") : match.Value,
                "NOW" => now.ToString("yyyy-MM-dd hh:mm:ss"),
                "TIME" => now.ToString("hh:mm"),
                "TIMESECOND" => now.ToString("hh:mm:ss"),
                "SUID" => sequentialIdFactory(),
                "GUID" => Guid.NewGuid().ToString("N"),
                _ => match.Value
            };
        }

        private static string[] ParseDefaultValueTokenArguments(string args)
        {
            if (string.IsNullOrWhiteSpace(args) == true)
            {
                return [];
            }

            return args.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        }

        private static int GetIntArgument(string[] args, int index, int defaultValue)
        {
            return args.Length > index && int.TryParse(args[index], out var value) == true ? value : defaultValue;
        }

        private static DateTime GetStartDateOfWeek(DateTime value)
        {
            var daysSinceMonday = ((int)value.DayOfWeek + 6) % 7;
            return value.Date.AddDays(-daysSinceMonday);
        }

        private static DateTime GetStartDateOfMonth(DateTime value, int monthOffset)
        {
            var target = value.Date.AddMonths(monthOffset);
            return new DateTime(target.Year, target.Month, 1);
        }

        private static bool TryGetQuarterDate(string[] args, DateTime now, out DateTime value, bool endDate)
        {
            value = default;
            if (args.Length == 0 || int.TryParse(args[0], out var quarter) == false || quarter is < 1 or > 4)
            {
                return false;
            }

            var yearOffset = GetIntArgument(args, 1, 0);
            var startMonth = ((quarter - 1) * 3) + 1;
            var startDate = new DateTime(now.Year + yearOffset, startMonth, 1);
            value = endDate == true ? startDate.AddMonths(3).AddDays(-1) : startDate;
            return true;
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
            return Regex.IsMatch(@this, regexPattern);
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
            if (@this == null || maxLength < 0 || @this.Length <= maxLength)
            {
                return @this;
            }

            var strLength = maxLength - suffix.Length;
            return @this.SubstringSafe(0, strLength) + suffix;
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

        public static string SubstringSafe(this string? @this, int startIndex)
        {
            if (string.IsNullOrEmpty(@this) == true || startIndex < 0 || startIndex >= @this.Length)
            {
                return "";
            }

            return @this.Substring(startIndex);
        }

        public static string SubstringSafe(this string? @this, int startIndex, int length)
        {
            if (string.IsNullOrEmpty(@this) == true || startIndex < 0 || length <= 0 || startIndex >= @this.Length)
            {
                return "";
            }

            return @this.Substring(startIndex, Math.Min(length, @this.Length - startIndex));
        }

        public static DateTime ToDateTimeSafe(this string? @this, DateTime defaultValue)
        {
            return DateTime.TryParse(@this, out var result) == true ? result : defaultValue;
        }
    }
}

