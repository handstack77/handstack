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
        public static ushort ReverseBytes(this ushort @this)
        {
            return (ushort)((@this & 0xFFU) << 8 | (@this & 0xFF00U) >> 8);
        }

        public static uint ReverseBytes(this UInt32 @this)
        {
            return (@this & 0x000000FFU) << 24 | (@this & 0x0000FF00U) << 8 | (@this & 0x00FF0000U) >> 8 | (@this & 0xFF000000U) >> 24;
        }

        public static ulong ReverseBytes(this ulong @this)
        {
            return (@this & 0x00000000000000FFUL) << 56 | (@this & 0x000000000000FF00UL) << 40 |
                   (@this & 0x0000000000FF0000UL) << 24 | (@this & 0x00000000FF000000UL) << 8 |
                   (@this & 0x000000FF00000000UL) >> 8 | (@this & 0x0000FF0000000000UL) >> 24 |
                   (@this & 0x00FF000000000000UL) >> 40 | (@this & 0xFF00000000000000UL) >> 56;
        }

        public static bool IsBetween(this int @this, int minimumValue, int maximumValue)
        {
            return (minimumValue <= @this) && (maximumValue >= @this);
        }

        /// <code>
        /// long @this = 5;
        /// if(@this.IsBetween(1, 10) == true) { 
        ///     // ... 
        /// }
        /// </code>
        public static bool IsBetween(this long @this, long minimumValue, long maximumValue)
        {
            return (minimumValue <= @this) && (maximumValue >= @this);
        }

        /// <code>
        /// double @this = 5;
        /// if(@this.IsBetween(1, 10) == true) { 
        ///     // ... 
        /// }
        /// </code>
        public static bool IsBetween(this double @this, double minimumValue, double maximumValue)
        {
            return (minimumValue <= @this) && (maximumValue >= @this);
        }

        /// <code>
        /// decimal @this = 5;
        /// if(@this.IsBetween(1, 10) == true) { 
        ///     // ... 
        /// }
        /// </code>
        public static bool IsBetween(this decimal @this, decimal minimumValue, decimal maximumValue)
        {
            return (minimumValue <= @this) && (maximumValue >= @this);
        }

        /// <code>
        /// decimal @this = 5;
        /// if(@this.IsBetween(1, 10) == true) { 
        ///     // ... 
        /// }
        /// </code>
        public static bool IsBetween(this float @this, float minimumValue, float maximumValue)
        {
            return (minimumValue <= @this) && (maximumValue >= @this);
        }

        public static int PercentageOf(this int @this, int totalValue)
        {
            return Convert.ToInt32(@this * 100 / totalValue);
        }

        public static long PercentageOf(this long @this, long totalValue)
        {
            return Convert.ToInt64(@this * 100 / totalValue);
        }

        public static double PercentageOf(this double @this, double totalValue)
        {
            return Convert.ToDouble(@this * 100 / totalValue);
        }

        public static decimal PercentageOf(this decimal @this, decimal totalValue)
        {
            return Convert.ToDecimal(@this * 100 / totalValue);
        }

        public static float PercentageOf(this float @this, float totalValue)
        {
            return Convert.ToSingle(@this * 100 / totalValue);
        }

        public static string ToCurrencyString(this int @this)
        {
            return string.Format("{0:N0}", @this);
        }

        public static string ToCurrencyString(this long @this)
        {
            return string.Format("{0:N0}", @this);
        }

        public static string ToCurrencyString(this decimal @this)
        {
            return string.Format("{0:N0}", @this);
        }

        public static string ToCurrencyString(this decimal @this, int digits)
        {
            return string.Format("{0:N" + digits.ToString() + "}", @this);
        }

        public static string ToCurrencyString(this double @this)
        {
            return string.Format("{0:N0}", @this);
        }

        public static string ToCurrencyString(this double @this, int digits)
        {
            return string.Format("{0:N" + digits.ToString() + "}", @this);
        }

        public static string ToCurrencyString(this float @this)
        {
            return string.Format("{0:N0}", @this);
        }

        public static string ToCurrencyString(this float @this, int digits)
        {
            return string.Format("{0:N" + digits.ToString() + "}", @this);
        }

        public static string? GetEnumDescriptionFromInt<T>(this int value) where T : Enum
        {
            var enumValue = (T)Enum.ToObject(typeof(T), value);

            return enumValue.GetDescriptionFromValue();
        }

        public static T GetEnumValueFromInt<T>(this int value) where T : Enum
        {
            return (T)Enum.ToObject(typeof(T), value);
        }


        public static readonly string[] SizesStrings
            = {
                "B",
                "KB",
                "MB",
                "GB",
                "TB",
                "PB",
                "EB",
                "ZB",
                "YB"
            };

        public static string ToByteSize(this int fileSize)
        {
            var order = 0;
            while (fileSize >= 1024 && order < SizesStrings.Length - 1)
            {
                order++;
                fileSize /= 1024;
            }

            return $"{fileSize.ToCurrencyString()} {SizesStrings[order]}";
        }

        public static string ToByteSize(this double fileSize)
        {
            var order = 0;
            while (fileSize >= 1024 && order < SizesStrings.Length - 1)
            {
                order++;
                fileSize /= 1024;
            }

            return $"{fileSize.ToCurrencyString()} {SizesStrings[order]}";
        }

        public static string ToByteSize(this float fileSize)
        {
            var order = 0;
            while (fileSize >= 1024 && order < SizesStrings.Length - 1)
            {
                order++;
                fileSize /= 1024;
            }

            return $"{fileSize.ToCurrencyString()} {SizesStrings[order]}";
        }

        public static string ToByteSize(this long fileSize)
        {
            var order = 0;
            while (fileSize >= 1024 && order < SizesStrings.Length - 1)
            {
                order++;
                fileSize /= 1024;
            }

            return $"{fileSize.ToCurrencyString()} {SizesStrings[order]}";
        }

        public static bool IsNullOrZero(this int? @this)
        {
            return @this == null || @this.HasValue == false || @this.Value == 0;
        }

        public static bool IsNullOrZero(this long? @this)
        {
            return @this == null || @this.HasValue == false || @this.Value == 0;
        }

        public static bool IsNullOrZero(this decimal? @this)
        {
            return @this == null || @this.HasValue == false || @this.Value == 0;
        }

        public static bool IsNullOrZero(this float? @this)
        {
            return @this == null || @this.HasValue == false || @this.Value == 0;
        }

        public static bool IsNullOrZero(this double? @this)
        {
            return @this == null || @this.HasValue == false || @this.Value == 0;
        }
    }
}
