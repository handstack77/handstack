using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Web.Extensions
{
    public static class FileRoller
    {
        public static string RollingFileName(string connectionString, RollingPeriod period, string? fileID = "filename")
        {
            if (period == RollingPeriod.Never)
            {
                return connectionString;
            }

            var stringParser = ConnectionStringParser.Parse(connectionString);
            var fullpath = stringParser[fileID.ToStringSafe()];

            var filename = Path.GetFileName(fullpath);
            var extension = Path.GetExtension(filename);
            var file = Path.GetFileNameWithoutExtension(filename);
            var folderPart = Path.GetDirectoryName(fullpath) ?? ("." + Path.DirectorySeparatorChar);
            var dateFormat = string.Empty;
            var date = DateTime.Now;

            switch (period)
            {
                case RollingPeriod.Minute:
                    dateFormat = "yyyy-MM-dd-HHmm";
                    break;
                case RollingPeriod.TenMinute:
                    dateFormat = "yyyy-MM-dd-HHmm";
                    var tenMinutes = date.Minute / 10 * 10;
                    date = date.AddMinutes(-date.Minute).AddMinutes(tenMinutes);
                    break;
                case RollingPeriod.HalfHour:
                    dateFormat = "yyyy-MM-dd-HHmm";
                    var halfHourMinutes = date.Minute / 30 * 30;
                    date = date.AddMinutes(-date.Minute).AddMinutes(halfHourMinutes);
                    break;
                case RollingPeriod.Hour:
                    dateFormat = "yyyy-MM-dd-HH";
                    break;
                case RollingPeriod.Daily:
                    dateFormat = "yyyy-MM-dd";
                    break;
                case RollingPeriod.Month:
                    dateFormat = "yyyy-MM";
                    break;
                case RollingPeriod.Year:
                    dateFormat = "yyyy";
                    break;
            }

            if (string.IsNullOrEmpty(dateFormat) == false)
            {
                file = file + "-" + date.ToString(dateFormat);
            }

            stringParser["filename"] = PathExtensions.Combine(folderPart, $"{file}{extension}");

            return ConnectionStringParser.Create(stringParser);
        }

        private static class ConnectionStringParser
        {
            public static IDictionary<string, string> Parse(string str)
            {
                if (str.IndexOf(";", StringComparison.Ordinal) == -1 && str.IndexOf("=", StringComparison.Ordinal) == -1)
                {
                    return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["filename"] = str
                    };
                }
                var all = from kvp in str.Split(';')
                          let kv = kvp.Split('=')
                          select new { key = kv.First(), value = kv.Last() };
                return all.ToDictionary(a => a.key, a => a.value, StringComparer.CurrentCultureIgnoreCase);
            }

            public static string Create(IDictionary<string, string> connStrInfo)
            {
                return string.Join(";", connStrInfo.Select(a => string.Join("=", a.Key, a.Value)));
            }
        }

    }
}
