using System;
using System.Collections.Concurrent;
using System.IO;
using System.Linq;
using System.Text;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Json;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HandStack.Web
{
    /// <summary>
    /// 실행 OS별 설정 파일(appsettings.{windows|linux|macos}.json, module.{windows|linux|macos}.json)을
    /// 기본 설정 파일에 덮어씁니다. OS별 파일은 프로그램이 시작할 때 한 번만 읽으며, 이후 파일이 바뀌어도 반영하지 않습니다.
    /// 병합 규칙은 객체는 재귀 병합, 값과 배열은 OS별 파일의 값으로 교체합니다. OS별 파일이 없으면 기본 설정을 그대로 사용합니다.
    /// </summary>
    public static class PlatformSettings
    {
        private static readonly ConcurrentDictionary<string, JObject?> overrideSnapshots = new(StringComparer.OrdinalIgnoreCase);

        private static readonly JsonLoadSettings loadSettings = new()
        {
            CommentHandling = CommentHandling.Ignore,
            LineInfoHandling = LineInfoHandling.Ignore
        };

        private static readonly JsonMergeSettings mergeSettings = new()
        {
            MergeArrayHandling = MergeArrayHandling.Replace,
            MergeNullValueHandling = MergeNullValueHandling.Merge,
            PropertyNameComparison = StringComparison.OrdinalIgnoreCase
        };

        /// <summary>현재 실행 OS 이름(windows, linux, macos)입니다. 지원하지 않는 OS면 null입니다.</summary>
        public static string? CurrentPlatform
        {
            get
            {
                if (OperatingSystem.IsWindows() == true)
                {
                    return "windows";
                }

                if (OperatingSystem.IsLinux() == true)
                {
                    return "linux";
                }

                if (OperatingSystem.IsMacOS() == true)
                {
                    return "macos";
                }

                return null;
            }
        }

        /// <summary>기본 설정 파일 경로에서 OS별 설정 파일 경로를 반환합니다. 예) /a/module.json → /a/module.linux.json</summary>
        public static string? GetPlatformFilePath(string baseFilePath, string? platform = null)
        {
            platform = (platform ?? CurrentPlatform)?.ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(baseFilePath) == true || platform is not ("windows" or "linux" or "macos"))
            {
                return null;
            }

            var directoryPath = Path.GetDirectoryName(baseFilePath);
            var platformFileName = $"{Path.GetFileNameWithoutExtension(baseFilePath)}.{platform}{Path.GetExtension(baseFilePath)}";
            return string.IsNullOrEmpty(directoryPath) == true ? platformFileName : Path.Combine(directoryPath, platformFileName);
        }

        /// <summary>기본 설정 파일을 읽고 OS별 설정 파일이 있으면 덮어쓴 JSON 텍스트를 반환합니다.</summary>
        public static string ReadAllText(string baseFilePath, string? platform = null)
        {
            return Merge(baseFilePath, File.ReadAllText(baseFilePath), platform);
        }

        /// <summary>기본 설정 JSON 텍스트에 OS별 설정 파일의 값을 덮어씁니다. OS별 설정 파일이 없으면 기본 텍스트를 그대로 반환합니다.</summary>
        public static string Merge(string baseFilePath, string baseJsonText, string? platform = null)
        {
            var platformSnapshot = GetOverrideSnapshot(baseFilePath, platform);
            if (platformSnapshot == null)
            {
                return baseJsonText;
            }

            var root = JObject.Parse(baseJsonText, loadSettings);
            root.Merge(platformSnapshot.DeepClone(), mergeSettings);
            return root.ToString(Formatting.Indented);
        }

        /// <summary>
        /// 기본 설정 파일(예: appsettings.json)을 대체하는 구성 소스를 만들어 OS별 설정 파일을 덮어쓴 설정을 사용하게 합니다.
        /// OS별 설정 파일이 없으면 구성 소스를 바꾸지 않으므로 기존 동작(파일 변경 감지 포함)이 그대로 유지됩니다.
        /// </summary>
        public static IConfigurationBuilder UsePlatformSettings(this IConfigurationBuilder builder, string directoryPath, string baseFileName = "appsettings.json", string? platform = null)
        {
            var baseFilePath = Path.GetFullPath(Path.Combine(directoryPath, baseFileName));
            if (GetOverrideSnapshot(baseFilePath, platform) == null)
            {
                return builder;
            }

            var sourceIndex = builder.Sources.ToList().FindLastIndex(source =>
                source is JsonConfigurationSource jsonSource && string.Equals(Path.GetFileName(jsonSource.Path), baseFileName, StringComparison.OrdinalIgnoreCase));
            if (sourceIndex < 0)
            {
                return builder;
            }

            var baseJsonText = File.Exists(baseFilePath) == true ? File.ReadAllText(baseFilePath) : "{}";
            var mergedSource = new PlatformJsonConfigurationSource
            {
                Content = Encoding.UTF8.GetBytes(Merge(baseFilePath, baseJsonText, platform))
            };

            builder.Sources.RemoveAt(sourceIndex);
            builder.Sources.Insert(sourceIndex, mergedSource);
            return builder;
        }

        private static JObject? GetOverrideSnapshot(string baseFilePath, string? platform)
        {
            var platformFilePath = GetPlatformFilePath(baseFilePath, platform);
            if (platformFilePath == null)
            {
                return null;
            }

            return overrideSnapshots.GetOrAdd(Path.GetFullPath(platformFilePath), static fullPath =>
            {
                if (File.Exists(fullPath) == false)
                {
                    return null;
                }

                try
                {
                    return JObject.Parse(File.ReadAllText(fullPath), loadSettings);
                }
                catch (JsonException exception)
                {
                    throw new InvalidDataException($"OS별 설정 파일의 JSON 형식을 확인해야 합니다: {fullPath}", exception);
                }
            });
        }

        private sealed class PlatformJsonConfigurationSource : JsonStreamConfigurationSource
        {
            public byte[] Content { get; init; } = [];

            public override IConfigurationProvider Build(IConfigurationBuilder builder)
            {
                return new PlatformJsonConfigurationProvider(this);
            }
        }

        // 구성 루트가 다시 로드되어도 같은 병합 결과를 읽을 수 있도록 매번 새 스트림으로 읽습니다.
        private sealed class PlatformJsonConfigurationProvider(PlatformJsonConfigurationSource source) : JsonStreamConfigurationProvider(source)
        {
            public override void Load()
            {
                using var stream = new MemoryStream(source.Content);
                Load(stream);
            }
        }
    }
}
