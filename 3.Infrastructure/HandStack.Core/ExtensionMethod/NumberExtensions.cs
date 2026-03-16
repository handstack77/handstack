using System;

namespace HandStack.Core.ExtensionMethod
{
    /// <code>
    /// // Format for Number 레퍼런스
    /// string.Format("{0:00000}", 15);                        // "00015"
    /// string.Format("{0:00000}", -15);                       // "-00015"
    /// string.Format("{0,5}", 15);                            // "   15"
    /// string.Format("{0,-5}", 15);                           // "15   "
    /// string.Format("{0,5:000}", 15);                        // "  015"
    /// string.Format("{0,-5:000}", 15);                       // "015  "
    /// string.Format("{0:#;minus #}", 15);                    // "15"
    /// string.Format("{0:#;minus #}", -15);                   // "minus 15"
    /// string.Format("{0:#;minus #;zero}", 0);                // "zero"
    /// string.Format("{0:+### ### ### ###}", 447900123456);   // "+447 900 123 456"
    /// string.Format("{0:##-####-####}", 8958712551);         // "89-5871-2551"
    /// string.Format("{0:0.00}", 123.4567);                   // "123.46"
    /// string.Format("{0:0.00}", 123.4);                      // "123.40"
    /// string.Format("{0:0.00}", 123.0);                      // "123.00"
    /// string.Format("{0:0.##}", 123.4567);                   // "123.46"
    /// string.Format("{0:0.##}", 123.4);                      // "123.4"
    /// string.Format("{0:0.##}", 123.0);                      // "123"
    /// string.Format("{0:00.0}", 123.4567);                   // "123.5"
    /// string.Format("{0:00.0}", 23.4567);                    // "23.5"
    /// string.Format("{0:00.0}", 3.4567);                     // "03.5"
    /// string.Format("{0:00.0}", -3.4567);                    // "-03.5"
    /// string.Format("{0:0,0.0}", 12345.67);                  // "12,345.7"
    /// string.Format("{0:0,0}", 12345.67);                    // "12,346"
    /// string.Format("{0:0.0}", 0.0);                         // "0.0"
    /// string.Format("{0:0.#}", 0.0);                         // "0"
    /// string.Format("{0:#.0}", 0.0);                         // ".0"
    /// string.Format("{0:#.#}", 0.0);                         // ""
    /// string.Format("{0,10:0.0}", 123.4567);                 // "     123.5"
    /// string.Format("{0,-10:0.0}", 123.4567);                // "123.5     "
    /// string.Format("{0,10:0.0}", -123.4567);                // "    -123.5"
    /// string.Format("{0,-10:0.0}", -123.4567);               // "-123.5    "
    /// string.Format("{0:0.00;minus 0.00;zero}", 123.4567);   // "123.46"
    /// string.Format("{0:0.00;minus 0.00;zero}", -123.4567);  // "minus 123.46"
    /// string.Format("{0:0.00;minus 0.00;zero}", 0.0);        // "zero"
    /// string.Format("{0:my number is 0.0}", 12.3);           // "my number is 12.3"
    /// string.Format("{0:0aaa.bbb0}", 12.3);                  // "12aaa.bbb3"
    /// </code>
    public static class NumberExtensions
    {
        public static readonly string[] SizesStrings = { "B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB" };

        #region Reverse Bytes

        public static ushort ReverseBytes(this ushort @this)
        {
            return (ushort)((@this & 0xFFU) << 8 | (@this & 0xFF00U) >> 8);
        }

        public static uint ReverseBytes(this uint @this)
        {
            return (@this & 0x000000FFU) << 24 | (@this & 0x0000FF00U) << 8 |
                   (@this & 0x00FF0000U) >> 8 | (@this & 0xFF000000U) >> 24;
        }

        public static ulong ReverseBytes(this ulong @this)
        {
            return (@this & 0x00000000000000FFUL) << 56 | (@this & 0x000000000000FF00UL) << 40 |
                   (@this & 0x0000000000FF0000UL) << 24 | (@this & 0x00000000FF000000UL) << 8 |
                   (@this & 0x000000FF00000000UL) >> 8 | (@this & 0x0000FF0000000000UL) >> 24 |
                   (@this & 0x00FF000000000000UL) >> 40 | (@this & 0xFF00000000000000UL) >> 56;
        }

        public static bool IsBetween(this int @this, int minimumValue, int maximumValue)
            => @this >= Math.Min(minimumValue, maximumValue) && @this <= Math.Max(minimumValue, maximumValue);

        public static bool IsBetween(this long @this, long minimumValue, long maximumValue)
            => @this >= Math.Min(minimumValue, maximumValue) && @this <= Math.Max(minimumValue, maximumValue);

        public static bool IsBetween(this double @this, double minimumValue, double maximumValue)
            => @this >= Math.Min(minimumValue, maximumValue) && @this <= Math.Max(minimumValue, maximumValue);

        public static bool IsBetween(this decimal @this, decimal minimumValue, decimal maximumValue)
            => @this >= Math.Min(minimumValue, maximumValue) && @this <= Math.Max(minimumValue, maximumValue);

        public static bool IsBetween(this float @this, float minimumValue, float maximumValue)
            => @this >= Math.Min(minimumValue, maximumValue) && @this <= Math.Max(minimumValue, maximumValue);

        public static int PercentageOf(this int @this, int totalValue)
            => totalValue == 0 ? 0 : Convert.ToInt32(@this * 100.0 / totalValue);

        public static long PercentageOf(this long @this, long totalValue)
            => totalValue == 0 ? 0 : Convert.ToInt64(@this * 100.0 / totalValue);

        public static double PercentageOf(this double @this, double totalValue)
            => Math.Abs(totalValue) < double.Epsilon ? 0 : (@this * 100.0 / totalValue);

        public static decimal PercentageOf(this decimal @this, decimal totalValue)
            => totalValue == 0m ? 0m : (@this * 100m / totalValue);

        public static float PercentageOf(this float @this, float totalValue)
            => Math.Abs(totalValue) < float.Epsilon ? 0f : (@this * 100f / totalValue);

        public static string ToCurrencyString(this int @this) => @this.ToString("N0");
        
        public static string ToCurrencyString(this long @this) => @this.ToString("N0");
        
        public static string ToCurrencyString(this decimal @this) => @this.ToString("N0");
        
        public static string ToCurrencyString(this decimal @this, int digits) => @this.ToString($"N{Math.Max(0, digits)}");
        
        public static string ToCurrencyString(this double @this) => @this.ToString("N0");
        
        public static string ToCurrencyString(this double @this, int digits) => @this.ToString($"N{Math.Max(0, digits)}");
        
        public static string ToCurrencyString(this float @this) => @this.ToString("N0");
        
        public static string ToCurrencyString(this float @this, int digits) => @this.ToString($"N{Math.Max(0, digits)}");

        public static string? GetEnumDescriptionFromInt<T>(this int value) where T : Enum
        {
            var enumValue = (T)Enum.ToObject(typeof(T), value);
            return enumValue.GetDescriptionFromValue();
        }

        public static T GetEnumValueFromInt<T>(this int value) where T : Enum
        {
            return (T)Enum.ToObject(typeof(T), value);
        }

        #endregion

        private static string FormatByteSize(double bytes, int digits)
        {
            int order = 0;
            double value = bytes;
            double absValue = Math.Abs(bytes);

            while (absValue >= 1024 && order < SizesStrings.Length - 1)
            {
                order++;
                value /= 1024;
                absValue /= 1024;
            }

            return $"{value.ToString($"N{Math.Max(0, digits)}")} {SizesStrings[order]}";
        }

        public static string ToByteSize(this long fileSize, int digits = 0) => FormatByteSize(fileSize, digits);
       
        public static string ToByteSize(this long? fileSize, int digits = 0) => FormatByteSize(fileSize ?? 0, digits);

        public static string ToByteSize(this int fileSize, int digits = 0) => FormatByteSize(fileSize, digits);
       
        public static string ToByteSize(this int? fileSize, int digits = 0) => FormatByteSize(fileSize ?? 0, digits);

        public static string ToByteSize(this float fileSize, int digits = 0) => FormatByteSize(fileSize, digits);
        
        public static string ToByteSize(this float? fileSize, int digits = 0) => FormatByteSize(fileSize ?? 0f, digits);

        public static string ToByteSize(this double fileSize, int digits = 0) => FormatByteSize(fileSize, digits);
        
        public static string ToByteSize(this double? fileSize, int digits = 0) => FormatByteSize(fileSize ?? 0d, digits);

        public static string ToByteSize(this decimal fileSize, int digits = 0) => FormatByteSize((double)fileSize, digits);
        
        public static string ToByteSize(this decimal? fileSize, int digits = 0) => FormatByteSize((double)(fileSize ?? 0m), digits);

        public static bool IsNullOrZero(this int? @this) => @this.GetValueOrDefault() == 0;
        
        public static bool IsNullOrZero(this long? @this) => @this.GetValueOrDefault() == 0L;
        
        public static bool IsNullOrZero(this decimal? @this) => @this.GetValueOrDefault() == 0m;

        public static bool IsNullOrZero(this float? @this) => !@this.HasValue || Math.Abs(@this.Value) <= float.Epsilon;
        
        public static bool IsNullOrZero(this double? @this) => !@this.HasValue || Math.Abs(@this.Value) <= double.Epsilon;
    }
}
