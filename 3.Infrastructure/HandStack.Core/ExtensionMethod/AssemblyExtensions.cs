using System;
using System.IO;
using System.Reflection;

namespace HandStack.Core.ExtensionMethod
{
    public static class AssemblyExtensions
    {
        public static string? GetStringEmbeddedResource(this Assembly @this, string resourceName)
        {
            string? result = null;
            using (Stream? stream = @this.GetStreamEmbeddedResource(resourceName))
            {
                if (stream != null)
                {
                    using (StreamReader Reader = new StreamReader(stream))
                    {
                        result = Reader.ReadToEnd();
                    }
                }
            }
            return result;
        }

        public static Stream? GetStreamEmbeddedResource(this Assembly @this, string resourceName)
        {
            return @this.GetManifestResourceStream(resourceName);
        }

        public static DateTime GetLinkerTimestamp(this Assembly @this)
        {
            if (@this == null)
            {
                throw new ArgumentNullException("@this", "@this는 null일 수 없습니다");
            }

            const int peHeaderOffset = 60;
            const int linkerTimestampOffset = 8;

            byte[] buffer = new byte[2048];
            string path = @this.Location;
            using (Stream stream = new FileStream(path, FileMode.Open, FileAccess.Read))
            {
                stream.Read(buffer, 0, buffer.Length);
            }

            int i = BitConverter.ToInt32(buffer, peHeaderOffset);
            int secondsSince1970 = BitConverter.ToInt32(buffer, i + linkerTimestampOffset);

            DateTime dateTime = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Local);
            dateTime = dateTime.AddSeconds(secondsSince1970);
            dateTime = dateTime.AddHours(TimeZoneInfo.ConvertTimeToUtc(dateTime).ToEpochTimeSpan().Hours);
            return dateTime;
        }
    }
}
