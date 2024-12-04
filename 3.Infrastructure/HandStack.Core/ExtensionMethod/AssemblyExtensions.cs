using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;

namespace HandStack.Core.ExtensionMethod
{
    public static class AssemblyExtensions
    {
        public static Dictionary<string, ManifestResourceInfo?>? GetManifestResources(this Assembly @this)
        {
            var result = new Dictionary<string, ManifestResourceInfo?>();
            foreach (string resourceName in @this.GetManifestResourceNames())
            {
                result.Add(resourceName, @this.GetManifestResourceInfo(resourceName));
            }

            return result;
        }

        public static string? GetStringEmbeddedResource(this Assembly @this, string resourceName)
        {
            string? result = null;
            using (Stream? stream = @this.GetStreamEmbeddedResource(resourceName))
            {
                if (stream != null)
                {
                    using var reader = new StreamReader(stream);
                    result = reader.ReadToEnd();
                }
            }
            return result;
        }

        public static Stream? GetStreamEmbeddedResource(this Assembly @this, string resourceName)
        {
            return @this.GetManifestResourceStream(resourceName);
        }

        public async static Task<ReadOnlyMemory<byte>>? GetByteEmbeddedResource(this Assembly @this, string resourceName)
        {
            await using Stream? resourceStream = GetStreamEmbeddedResource(@this, resourceName);
            using var memoryStream = new MemoryStream();
            await resourceStream!.CopyToAsync(memoryStream);
            return new ReadOnlyMemory<byte>(memoryStream.ToArray());
        }

        public static DateTime GetLinkerTimestamp(this Assembly @this)
        {
            if (@this == null)
            {
                return DateTime.MinValue;
            }

            const int peHeaderOffset = 60;
            const int linkerTimestampOffset = 8;

            byte[] buffer = new byte[2048];
            string path = @this.Location;
            if (string.IsNullOrEmpty(path) == true)
            {
                return DateTime.MinValue;
            }

            using (Stream stream = new FileStream(path, FileMode.Open, FileAccess.Read))
            {
                stream.ReadExactly(buffer);
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
