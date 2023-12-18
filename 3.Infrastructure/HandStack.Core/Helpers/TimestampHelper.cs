using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace HandStack.Core.Helpers
{
    internal static class TimestampHelper
    {
        internal static class ZoneInfo
        {
            private static string utcDisplayName = "";
            private static string localDisplayName = "";
            private static readonly IReadOnlyCollection<TimeZoneInfo> systemTimeZone = TimeZoneInfo.GetSystemTimeZones();
            private static readonly IReadOnlyDictionary<string, string> timeZoneCollection = InitTimeZoneCollection();

            internal static string UtcDisplayName => utcDisplayName;

            internal static string LocalDisplayName => localDisplayName;

            internal static IReadOnlyList<string> DisplayNames => timeZoneCollection.Keys.ToList();

            internal static IReadOnlyDictionary<string, string> TimeZones => timeZoneCollection;

            private static IReadOnlyDictionary<string, string> InitTimeZoneCollection()
            {
                Dictionary<string, string> timeZoneCollection = new();
                if (!Regex.IsMatch(systemTimeZone.ElementAt(0).DisplayName, @"^\(UTC.*\).+$"))
                {
                    foreach (TimeZoneInfo zone in systemTimeZone)
                    {
                        string displayName = $"(UTC{zone.BaseUtcOffset.Hours:+00;-00;}:{zone.BaseUtcOffset.Minutes:00;00;}) " + zone.DisplayName;
                        if (zone.Id == TimeZoneInfo.Utc.Id)
                        {
                            displayName = "(UTC) " + zone.DisplayName;
                            utcDisplayName = "(UTC) " + zone.DisplayName;
                        }
                        if (zone.Id == TimeZoneInfo.Local.Id)
                        {
                            localDisplayName = displayName;
                        }
                        timeZoneCollection.Add(displayName, zone.Id);
                    }
                }
                else
                {
                    foreach (TimeZoneInfo zone in systemTimeZone)
                    {
                        timeZoneCollection.Add(zone.DisplayName, zone.Id);
                    }
                    utcDisplayName = TimeZoneInfo.Utc.DisplayName;
                    localDisplayName = TimeZoneInfo.Local.DisplayName;
                }
                return timeZoneCollection;
            }
        }

        internal static class TimeZone
        {
            internal static DateTimeOffset MinValue(TimeZoneInfo timezone)
            {
                if (timezone is null)
                {
                    timezone = TimeZoneInfo.Utc;
                }
                DateTimeOffset t1 = TimeZoneInfo.ConvertTime(new DateTimeOffset(10, 1, 1, 0, 0, 0, TimeZoneInfo.Utc.BaseUtcOffset), timezone);
                DateTimeOffset minValue = DateTimeOffset.MinValue;
                if (t1.Year < 10)
                {
                    minValue = minValue.Subtract(t1.Offset);
                }
                return TimeZoneInfo.ConvertTime(minValue, timezone);
            }

            internal static DateTimeOffset MaxValue(TimeZoneInfo timezone)
            {
                if (timezone is null)
                {
                    timezone = TimeZoneInfo.Utc;
                }
                DateTimeOffset t1 = TimeZoneInfo.ConvertTime(new DateTimeOffset(9990, 12, 31, 23, 59, 59, TimeZoneInfo.Utc.BaseUtcOffset), timezone);
                DateTimeOffset maxValue = DateTimeOffset.MaxValue;
                if (t1.Year > 9990)
                {
                    maxValue = maxValue.Subtract(t1.Offset);
                }
                return TimeZoneInfo.ConvertTime(maxValue, timezone);
            }
        }
    }
}
