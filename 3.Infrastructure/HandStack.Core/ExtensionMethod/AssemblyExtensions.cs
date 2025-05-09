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
            foreach (var resourceName in @this.GetManifestResourceNames())
            {
                result.Add(resourceName, @this.GetManifestResourceInfo(resourceName));
            }

            return result;
        }

        public async static Task<string?> GetStringEmbeddedResource(this Assembly @this, string resourceName)
        {
            string? result = null;
            using (var stream = @this.GetStreamEmbeddedResource(resourceName))
            {
                if (stream != null)
                {
                    using var reader = new StreamReader(stream);
                    result = await reader.ReadToEndAsync();
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
            await using var resourceStream = GetStreamEmbeddedResource(@this, resourceName);
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

            var buffer = new byte[2048];
            var path = @this.Location;
            if (string.IsNullOrEmpty(path) == true)
            {
                return DateTime.MinValue;
            }

            using (Stream stream = new FileStream(path, FileMode.Open, FileAccess.Read))
            {
                stream.ReadExactly(buffer);
            }

            var i = BitConverter.ToInt32(buffer, peHeaderOffset);
            var secondsSince1970 = BitConverter.ToInt32(buffer, i + linkerTimestampOffset);

            var dateTime = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Local);
            dateTime = dateTime.AddSeconds(secondsSince1970);
            dateTime = dateTime.AddHours(TimeZoneInfo.ConvertTimeToUtc(dateTime).ToEpochTimeSpan().Hours);
            return dateTime;
        }
    }
}
