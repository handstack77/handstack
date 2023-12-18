using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace HandStack.Core.ExtensionMethod
{
    public static class DateTimeExtensions
    {
        ///<summary>
        ///	현재 시스템의 시간과 UTC (Universal Time Coordinated 협정 세계시(時))과의 차이를 TimeSpan값으로 조회합니다.
        ///</summary>
        public static TimeSpan UtcOffset
        {
            get { return DateTime.Now.Subtract(DateTime.UtcNow); }
        }

        private static string timeZone = "Korea Standard Time";

        public static string TimeZone
        {
            get { return timeZone; }
            set
            {
                TimeZoneInstance = null;
                timeZone = value;
            }
        }

        private static TimeZoneInfo? timeZoneInstance = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);

        public static TimeZoneInfo? TimeZoneInstance
        {
            get
            {
                if (timeZoneInstance == null)
                {
                    try
                    {
                        timeZoneInstance = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
                    }
                    catch
                    {
                        TimeZone = "Korea Standard Time";
                        timeZoneInstance = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
                    }
                }
                return timeZoneInstance;
            }
            private set { timeZoneInstance = value; }
        }

        public static DateTime GetStandardDateTime(this DateTime? @this)
        {
            DateTime result = DateTime.UtcNow;
            if (@this == null)
            {
                @this = DateTime.UtcNow;
            }

            if (TimeZoneInstance != null)
            {
                result = TimeZoneInfo.ConvertTimeFromUtc(@this.Value, TimeZoneInstance); ;
            }

            return result;
        }

        public static DateTime GetStandardDateTime(this DateTime? @this, TimeZoneInfo timeZoneInfo)
        {
            if (@this == null)
            {
                @this = DateTime.UtcNow;
            }

            return TimeZoneInfo.ConvertTimeFromUtc(@this.Value, timeZoneInfo);
        }

        public static DateTime GetUtcDateTime(this DateTime? @this)
        {
            DateTime result = DateTime.Now.ToUniversalTime();
            if (@this == null)
            {
                @this = DateTime.Now;
            }

            if (TimeZoneInstance != null)
            {
                result = TimeZoneInfo.ConvertTime(@this.Value, TimeZoneInstance).ToUniversalTime();
            }

            return result;
        }

        public static DateTime GetUtcDateTime(this DateTime? @this, TimeZoneInfo timeZoneInfo)
        {
            if (@this == null)
            {
                @this = DateTime.Now;
            }

            return TimeZoneInfo.ConvertTime(@this.Value, timeZoneInfo).ToUniversalTime();
        }

        public static long GetJavascriptTime(this DateTime @this)
        {
            return (long)@this.Subtract(new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
        }

        public static long GetJavascriptTime()
        {
            return (long)DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
        }

        public static DateTime JavascriptNumberToDateTime(long getTime)
        {
            return new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddMilliseconds(getTime).ToLocalTime(); ;
        }

        public static DateTime AdjustTimeZoneOffset(this DateTime @this, TimeZoneInfo? tzi = null)
        {
            DateTime result = DateTime.UtcNow;
            if (tzi == null)
            {
                tzi = TimeZoneInstance;
            }

            if (tzi != null)
            {
                var offset = tzi.GetUtcOffset(@this).TotalHours;
                var offset2 = TimeZoneInfo.Local.GetUtcOffset(@this).TotalHours;
                result = @this.AddHours(offset2 - offset);
            }

            return result;
        }

        public static string ToFormatString(this DateTime @this, string format = "s")
        {
            /// Custom DateTime Formatting 레퍼런스
            /// // create @this @this 2008-03-09 16:05:07.123
            /// DateTime @this = new DateTime(2008, 3, 9, 16, 5, 7, 123);
            /// 
            /// string.Format("{0:y yy yyy yyyy}", @this);  // "8 08 008 2008"   year
            /// string.Format("{0:M MM MMM MMMM}", @this);  // "3 03 Mar March"  month
            /// string.Format("{0:d dd ddd dddd}", @this);  // "9 09 Sun Sunday" day
            /// string.Format("{0:h hh H HH}",     @this);  // "4 04 16 16"      hour 12/24
            /// string.Format("{0:m mm}",          @this);  // "5 05"            minute
            /// string.Format("{0:s ss}",          @this);  // "7 07"            second
            /// string.Format("{0:f ff fff ffff}", @this);  // "1 12 123 1230"   sec.fraction
            /// string.Format("{0:F FF FFF FFFF}", @this);  // "1 12 123 123"    without zeroes
            /// string.Format("{0:t tt}",          @this);  // "P PM"            A.M. or P.M.
            /// string.Format("{0:z zz zzz}",      @this);  // "-6 -06 -06:00"   @this zone
            /// 
            /// // @this separator in german culture is "." (so "/" changes to ".")
            /// string.Format("{0:d/M/yyyy HH:mm:ss}", @this); // "9/3/2008 16:05:07" - english (en-US)
            /// string.Format("{0:d/M/yyyy HH:mm:ss}", @this); // "9.3.2008 16:05:07" - german (de-DE)
            ///          
            /// // month/day numbers without/with leading zeroes
            /// string.Format("{0:M/d/yyyy}", @this);            // "3/9/2008"
            /// string.Format("{0:MM/dd/yyyy}", @this);          // "03/09/2008"
            /// 
            /// // day/month names
            /// string.Format("{0:ddd, MMM d, yyyy}", @this);    // "Sun, Mar 9, 2008"
            /// string.Format("{0:dddd, MMMM d, yyyy}", @this);  // "Sunday, March 9, 2008"
            /// 
            /// // two/four digit year
            /// string.Format("{0:MM/dd/yy}", @this);            // "03/09/08"
            /// string.Format("{0:MM/dd/yyyy}", @this);          // "03/09/2008"
            /// 
            /// Specifier	DateTimeFormatInfo property	Pattern value (for en-US culture)
            /// t	    ShortTimePattern	                h:mm tt
            /// d	    ShortDatePattern	                M/d/yyyy
            /// T	    LongTimePattern	                    h:mm:ss tt
            /// D	    LongDatePattern	                    dddd, MMMM dd, yyyy
            /// f	    (combination of D and t)	        dddd, MMMM dd, yyyy h:mm tt
            /// F	    FullDateTimePattern	                dddd, MMMM dd, yyyy h:mm:ss tt
            /// g	    (combination of d and t)	        M/d/yyyy h:mm tt
            /// G	    (combination of d and T)	        M/d/yyyy h:mm:ss tt
            /// m, M	MonthDayPattern	                    MMMM dd
            /// y, Y	YearMonthPattern	                MMMM, yyyy
            /// r, R	RFC1123Pattern	                    ddd, dd MMM yyyy HH':'mm':'ss 'GMT' (*)
            /// s	    SortableDateTi­mePattern	            yyyy'-'MM'-'dd'T'HH':'mm':'ss (*)
            /// u	    UniversalSorta­bleDateTimePat­tern	yyyy'-'MM'-'dd HH':'mm':'ss'Z' (*)
            ///          
            /// string.Format("{0:t}", @this);  // "4:05 PM"                         ShortTime
            /// string.Format("{0:d}", @this);  // "3/9/2008"                        ShortDate
            /// string.Format("{0:T}", @this);  // "4:05:07 PM"                      LongTime
            /// string.Format("{0:D}", @this);  // "Sunday, March 09, 2008"          LongDate
            /// string.Format("{0:f}", @this);  // "Sunday, March 09, 2008 4:05 PM"  LongDate+ShortTime
            /// string.Format("{0:F}", @this);  // "Sunday, March 09, 2008 4:05:07 PM" FullDateTime
            /// string.Format("{0:g}", @this);  // "3/9/2008 4:05 PM"                ShortDate+ShortTime
            /// string.Format("{0:G}", @this);  // "3/9/2008 4:05:07 PM"             ShortDate+LongTime
            /// string.Format("{0:m}", @this);  // "March 09"                        MonthDay
            /// string.Format("{0:y}", @this);  // "March, 2008"                     YearMonth
            /// string.Format("{0:r}", @this);  // "Sun, 09 Mar 2008 16:05:07 GMT"   RFC1123
            /// string.Format("{0:s}", @this);  // "2008-03-09T16:05:07"             SortableDateTime
            /// string.Format("{0:u}", @this);  // "2008-03-09 16:05:07Z"            UniversalSortableDateTime
            return string.Format("{0:"+ format + "}", @this);
        }

        public static string ToDateString(this DateTime @this)
        {
            return @this.ToString("yyyy-MM-dd HH:mm:ss.fff");
        }

        public static string ToShortDate(this DateTime @this)
        {
            return ToShortDate(@this, CultureInfo.CurrentCulture);
        }

        public static string ToShortDate(this DateTime @this, string culture)
        {
            return ToShortDate(@this, new CultureInfo(culture));
        }

        public static string ToShortDate(this DateTime @this, CultureInfo culture)
        {
            if (culture == null)
            {
                culture = CultureInfo.CurrentCulture;
            }

            return @this.ToString(culture.DateTimeFormat.ShortDatePattern, culture);
        }

        public static string ToLongDate(this DateTime @this)
        {
            return ToLongDate(@this, CultureInfo.CurrentCulture);
        }

        public static string ToLongDate(this DateTime @this, string culture)
        {
            return ToLongDate(@this, new CultureInfo(culture));
        }

        public static string ToLongDate(this DateTime @this, CultureInfo culture)
        {
            if (culture == null)
            {
                culture = CultureInfo.CurrentCulture;
            }

            return @this.ToString(culture.DateTimeFormat.LongDatePattern, culture);
        }

        public static string ToShortTime(this DateTime @this)
        {
            return ToShortTime(@this, CultureInfo.CurrentCulture);
        }

        public static string ToShortTime(this DateTime @this, string culture)
        {
            return ToShortTime(@this, new CultureInfo(culture));
        }

        public static string ToShortTime(this DateTime @this, CultureInfo culture)
        {
            if (culture == null)
            {
                culture = CultureInfo.CurrentCulture;
            }

            return @this.ToString(culture.DateTimeFormat.ShortTimePattern, culture);
        }

        public static string ToLongTime(this DateTime @this)
        {
            return ToLongTime(@this, CultureInfo.CurrentCulture);
        }

        public static string ToLongTime(this DateTime @this, string culture)
        {
            return ToLongTime(@this, new CultureInfo(culture));
        }

        public static string ToLongTime(this DateTime @this, CultureInfo culture)
        {
            if (culture == null)
            {
                culture = CultureInfo.CurrentCulture;
            }

            return @this.ToString(culture.DateTimeFormat.LongTimePattern, culture);
        }

        public static double DateDiff(this DateTime @this, PartOfDateTime datePart, DateTime endDate)
        {
            double Result = 0;

            TimeSpan SubtractDateTime = new TimeSpan(endDate.Ticks - @this.Ticks);

            switch (datePart)
            {
                case PartOfDateTime.Year:
                    Result = endDate.Year - @this.Year;
                    break;

                case PartOfDateTime.Quarter:
                    double AvgQuarterDays = 365 / 4;
                    Result = Math.Floor(SubtractDateTime.TotalDays / AvgQuarterDays);
                    break;

                case PartOfDateTime.Month:
                    double AvgMonthDays = 365 / 12;
                    Result = Math.Floor(SubtractDateTime.TotalDays / AvgMonthDays);
                    break;

                case PartOfDateTime.Day:
                    Result = SubtractDateTime.TotalDays;
                    break;

                case PartOfDateTime.Week:
                    Result = Math.Floor(SubtractDateTime.TotalDays / 7);
                    break;

                case PartOfDateTime.Hour:
                    Result = SubtractDateTime.TotalHours;
                    break;

                case PartOfDateTime.Minute:
                    Result = SubtractDateTime.TotalMinutes;
                    break;

                case PartOfDateTime.Second:
                    Result = SubtractDateTime.TotalSeconds;
                    break;

                case PartOfDateTime.Millisecond:
                    Result = SubtractDateTime.TotalMilliseconds;
                    break;

                default:
                    throw new ArgumentException("검증되지 않는 PartOfDateTime 값입니다");
            }

            return Result;
        }

        public static DateTime FirstDayOfMonth(this DateTime @this)
        {
            return new DateTime(@this.Year, @this.Month, 1, @this.Hour, @this.Minute, @this.Second, @this.Millisecond);
        }

        public static DateTime LastDayOfMonth(this DateTime @this)
        {
            return FirstDayOfMonth(@this).AddMonths(1).AddDays(-1);
        }

        public static DateTime FirstDayOfWeek(this DateTime @this)
        {
            return new DateTime(@this.Year, @this.Month, @this.Day, @this.Hour, @this.Minute, @this.Second, @this.Millisecond).AddDays(-(int)@this.DayOfWeek);
        }

        public static DateTime LastDayOfWeek(this DateTime @this)
        {
            return FirstDayOfWeek(@this).AddDays(6);
        }

        public static DateTime SetTime(this DateTime @this, int hours, int minutes, int seconds)
        {
            return @this.SetTime(new TimeSpan(hours, minutes, seconds));
        }

        public static DateTime SetTime(this DateTime @this, TimeSpan currentTimeSpan)
        {
            return @this.Date.Add(currentTimeSpan);
        }

        public static bool IsToday(this DateTime @this)
        {
            return (@this.Date == DateTime.Today);
        }

        public static bool IsWeekend(this DateTime @this)
        {
            return (@this.DayOfWeek == DayOfWeek.Saturday || @this.DayOfWeek == DayOfWeek.Sunday);
        }

        public static DateTime GetWeekday(this DateTime @this, DayOfWeek weekday)
        {
            return @this.FirstDayOfWeek().GetNextWeekday(weekday);
        }

        private static DateTime GetNextWeekday(this DateTime @this, DayOfWeek weekday)
        {
            while (@this.DayOfWeek != weekday)
            {
                @this = @this.AddDays(1);
            }

            return @this;
        }

        public static int GetWeekOfYear(this DateTime @this)
        {
            return GetWeekOfYear(@this, CultureInfo.CurrentCulture);
        }

        public static int GetWeekOfYear(this DateTime @this, string culture)
        {
            return GetWeekOfYear(@this, new CultureInfo(culture));
        }

        public static int GetWeekOfYear(this DateTime @this, CultureInfo culture)
        {
            if (culture == null)
            {
                culture = CultureInfo.CurrentCulture;
            }

            CalendarWeekRule weekRule = culture.DateTimeFormat.CalendarWeekRule;
            DayOfWeek firstDayOfWeek = culture.DateTimeFormat.FirstDayOfWeek;
            return culture.Calendar.GetWeekOfYear(@this, weekRule, firstDayOfWeek);
        }

        public static int Age(this DateTime @this)
        {
            if (DateTime.Today.Month < @this.Month ||
                DateTime.Today.Month == @this.Month &&
                DateTime.Today.Day < @this.Day)
            {
                return DateTime.Today.Year - @this.Year - 1;
            }
            return DateTime.Today.Year - @this.Year;
        }

        public static DateTime Ago(this TimeSpan @this)
        {
            return DateTime.Now.Subtract(@this);
        }

        public static DateTime FromNow(this TimeSpan @this)
        {
            return DateTime.Now.Add(@this);
        }

        public static DateTime UtcAgo(this TimeSpan @this)
        {
            return DateTime.UtcNow.Subtract(@this);
        }

        public static DateTime UtcFromNow(this TimeSpan @this)
        {
            return DateTime.UtcNow.Add(@this);
        }

        public static TimeSpan Elapsed(this DateTime @this)
        {
            return DateTime.Now - @this;
        }

        public static DateTime EndOfDay(this DateTime @this)
        {
            return new DateTime(@this.Year, @this.Month, @this.Day).AddDays(1).Subtract(new TimeSpan(0, 0, 0, 0, 1));
        }

        public static DateTime EndOfMonth(this DateTime @this)
        {
            return new DateTime(@this.Year, @this.Month, 1).AddMonths(1).Subtract(new TimeSpan(0, 0, 0, 0, 1));
        }

        public static DateTime EndOfWeek(this DateTime @this, DayOfWeek startDayOfWeek = DayOfWeek.Sunday)
        {
            DateTime end = @this;
            DayOfWeek endDayOfWeek = startDayOfWeek - 1;
            if (endDayOfWeek < 0)
            {
                endDayOfWeek = DayOfWeek.Saturday;
            }

            if (end.DayOfWeek != endDayOfWeek)
            {
                if (endDayOfWeek < end.DayOfWeek)
                {
                    end = end.AddDays(7 - (end.DayOfWeek - endDayOfWeek));
                }
                else
                {
                    end = end.AddDays(endDayOfWeek - end.DayOfWeek);
                }
            }

            return new DateTime(end.Year, end.Month, end.Day, 23, 59, 59, 999);
        }

        public static DateTime EndOfYear(this DateTime @this)
        {
            return new DateTime(@this.Year, 1, 1).AddYears(1).Subtract(new TimeSpan(0, 0, 0, 0, 1));
        }

        public static bool IsAfternoon(this DateTime @this)
        {
            return @this.TimeOfDay >= new DateTime(2000, 1, 1, 12, 0, 0).TimeOfDay;
        }

        public static bool IsDateEqual(this DateTime @this, DateTime dateToCompare)
        {
            return (@this.Date == dateToCompare.Date);
        }

        public static bool IsMorning(this DateTime @this)
        {
            return @this.TimeOfDay < new DateTime(2000, 1, 1, 12, 0, 0).TimeOfDay;
        }

        public static bool IsFuture(this DateTime @this)
        {
            return @this > DateTime.Now;
        }

        public static bool IsPast(this DateTime @this)
        {
            return @this < DateTime.Now;
        }

        public static bool IsTimeEqual(this DateTime @this, DateTime timeToCompare)
        {
            return (@this.TimeOfDay == timeToCompare.TimeOfDay);
        }

        public static bool IsWeekDay(this DateTime @this)
        {
            return !(@this.DayOfWeek == DayOfWeek.Saturday || @this.DayOfWeek == DayOfWeek.Sunday);
        }

        public static bool IsWeekendDay(this DateTime @this)
        {
            return (@this.DayOfWeek == DayOfWeek.Saturday || @this.DayOfWeek == DayOfWeek.Sunday);
        }

        public static DateTime SetTime(this DateTime @this, int hour)
        {
            return SetTime(@this, hour, 0, 0, 0);
        }

        public static DateTime SetTime(this DateTime @this, int hour, int minute)
        {
            return SetTime(@this, hour, minute, 0, 0);
        }

        public static DateTime SetTime(this DateTime @this, int hour, int minute, int second, int millisecond)
        {
            return new DateTime(@this.Year, @this.Month, @this.Day, hour, minute, second, millisecond);
        }

        public static DateTime StartOfDay(this DateTime @this)
        {
            return new DateTime(@this.Year, @this.Month, @this.Day);
        }

        public static DateTime StartOfMonth(this DateTime @this)
        {
            return new DateTime(@this.Year, @this.Month, 1);
        }

        public static DateTime StartOfWeek(this DateTime @this, DayOfWeek startDayOfWeek = DayOfWeek.Sunday)
        {
            var start = new DateTime(@this.Year, @this.Month, @this.Day);

            if (start.DayOfWeek != startDayOfWeek)
            {
                int d = startDayOfWeek - start.DayOfWeek;
                if (startDayOfWeek <= start.DayOfWeek)
                {
                    return start.AddDays(d);
                }
                return start.AddDays(-7 + d);
            }

            return start;
        }

        public static DateTime StartOfYear(this DateTime @this)
        {
            return new DateTime(@this.Year, 1, 1);
        }

        public static TimeSpan ToEpochTimeSpan(this DateTime @this)
        {
            return @this.Subtract(new DateTime(1970, 1, 1));
        }

        public static DateTime Yesterday(this DateTime @this)
        {
            return @this.AddDays(-1);
        }

        public static DateTime Tomorrow(this DateTime @this)
        {
            return @this.AddDays(1);
        }

        public static double ToUnixTimestamp(this DateTime @this)
        {
            var origin = new DateTime(1970, 1, 1, 0, 0, 0, 0);
            var diff = @this - origin;
            return Math.Floor(diff.TotalSeconds);
        }

        public static DateTime FromUnixTimestamp(this double @this)
        {
            var epoch = new DateTime(1970, 1, 1, 0, 0, 0, 0);
            return epoch.AddSeconds(@this);
        }

        public static DateTime ToDayEnd(this DateTime @this)
        {
            return @this.Date.AddDays(1).AddMilliseconds(-1);
        }

        public static IEnumerable<DateTime> DaysOfMonth(int year, int month)
        {
            return Enumerable.Range(0, DateTime.DaysInMonth(year, month))
                .Select(day => new DateTime(year, month, day + 1));
        }

        public static int WeekDayInstanceOfMonth(this DateTime @this)
        {
            var y = 0;
            return DaysOfMonth(@this.Year, @this.Month)
                .Where(x => x.DayOfWeek.Equals(@this.DayOfWeek))
                .Select(x => new { n = ++y, @this = x })
                .Where(x => x.@this.Equals(new DateTime(@this.Year, @this.Month, @this.Day)))
                .Select(x => x.n).FirstOrDefault();
        }

        public static int TotalDaysInMonth(this DateTime @this)
        {
            return DaysOfMonth(@this.Year, @this.Month).Count();
        }

        public static DateTime ToDateTimeUnspecified(this DateTime @this)
        {
            if (@this.Kind == DateTimeKind.Unspecified)
            {
                return @this;
            }

            return new DateTime(@this.Year, @this.Month, @this.Day, @this.Hour, @this.Minute, @this.Second, DateTimeKind.Unspecified);
        }

        public static DateTime TrimMilliseconds(this DateTime @this)
        {
            return new DateTime(@this.Year, @this.Month, @this.Day, @this.Hour, @this.Minute, @this.Second, @this.Kind);
        }
    }

    public enum PartOfDateTime
    {
        Year,
        Quarter,
        Month,
        Week,
        Day,
        Hour,
        Minute,
        Second,
        Millisecond
    }
}
