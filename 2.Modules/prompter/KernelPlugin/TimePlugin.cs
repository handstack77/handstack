using System;
using System.ComponentModel;

using Microsoft.SemanticKernel;

namespace prompter.KernelPlugin
{
    public sealed class TimePlugin
    {
        [KernelFunction, Description("Get the current date")]
        public string Date(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("D", formatProvider);

        [KernelFunction, Description("Get the current date")]
        public string Today(IFormatProvider? formatProvider = null) =>
            this.Date(formatProvider);

        [KernelFunction, Description("Get the current date and time in the local time zone")]
        public string Now(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("f", formatProvider);

        [KernelFunction, Description("Get the current UTC date and time")]
        public string UtcNow(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.UtcNow.ToString("f", formatProvider);

        [KernelFunction, Description("Get the current time")]
        public string Time(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("hh:mm:ss tt", formatProvider);

        [KernelFunction, Description("Get the current year")]
        public string Year(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("yyyy", formatProvider);

        [KernelFunction, Description("Get the current month name")]
        public string Month(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("MMMM", formatProvider);

        [KernelFunction, Description("Get the current month number")]
        public string MonthNumber(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("MM", formatProvider);

        [KernelFunction, Description("Get the current day of the month")]
        public string Day(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("dd", formatProvider);

        [KernelFunction]
        [Description("Get the date offset by a provided number of days from today")]
        public string DaysAgo([Description("The number of days to offset from today")] double input, IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.AddDays(-input).ToString("D", formatProvider);

        [KernelFunction, Description("Get the current day of the week")]
        public string DayOfWeek(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("dddd", formatProvider);

        [KernelFunction, Description("Get the current clock hour")]
        public string Hour(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("h tt", formatProvider);

        [KernelFunction, Description("Get the current clock 24-hour number")]
        public string HourNumber(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("HH", formatProvider);

        [KernelFunction]
        [Description("Get the date of the last day matching the supplied week day name in English. Example: Che giorno era 'Martedi' scorso -> dateMatchingLastDayName 'Tuesday' => Tuesday, 16 May, 2023")]
        public string DateMatchingLastDayName(
            [Description("The day name to match")] DayOfWeek input,
            IFormatProvider? formatProvider = null)
        {
            DateTimeOffset dateTime = DateTimeOffset.Now;

            for (int i = 1; i <= 7; ++i)
            {
                dateTime = dateTime.AddDays(-1);
                if (dateTime.DayOfWeek == input)
                {
                    break;
                }
            }

            return dateTime.ToString("D", formatProvider);
        }

        [KernelFunction, Description("Get the minutes on the current hour")]
        public string Minute(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("mm", formatProvider);

        [KernelFunction, Description("Get the seconds on the current minute")]
        public string Second(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("ss", formatProvider);

        [KernelFunction, Description("Get the local time zone offset from UTC")]
        public string TimeZoneOffset(IFormatProvider? formatProvider = null) =>
            DateTimeOffset.Now.ToString("%K", formatProvider);

        [KernelFunction, Description("Get the local time zone name")]
        public string TimeZoneName() =>
            TimeZoneInfo.Local.DisplayName;
    }
}
