using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

using HandStack.Web;

using Microsoft.Extensions.Configuration;

using Xunit;

namespace Web.Tests
{
    public class PlatformSettingsTests
    {
        [Fact]
        public void OsOverrideReplacesArraysAndMergesNestedObjects()
        {
            using var directory = new TestDirectory();
            var path = Path.Combine(directory.Path, "module.json");
            File.WriteAllText(Path.Combine(directory.Path, "module.windows.json"), """{"Modules":["transact"],"Settings":{"Port":9421}}""");
            using var merged = JsonDocument.Parse(PlatformSettings.Merge(path, """{"Modules":["wwwroot","dbclient"],"Settings":{"Port":8421,"Locale":"ko-KR"}}""", "windows"));
            Assert.Single(merged.RootElement.GetProperty("Modules").EnumerateArray());
            Assert.Equal("transact", merged.RootElement.GetProperty("Modules")[0].GetString());
            Assert.Equal(9421, merged.RootElement.GetProperty("Settings").GetProperty("Port").GetInt32());
            Assert.Equal("ko-KR", merged.RootElement.GetProperty("Settings").GetProperty("Locale").GetString());
        }

        [Fact]
        public void LaterConfigurationProviderKeepsPrecedenceOverOsSettings()
        {
            using var directory = new TestDirectory();
            File.WriteAllText(Path.Combine(directory.Path, "appsettings.json"), """{"Port":8421}""");
            File.WriteAllText(Path.Combine(directory.Path, "appsettings.windows.json"), """{"Port":9421}""");
            var configuration = new ConfigurationBuilder().SetBasePath(directory.Path).AddJsonFile("appsettings.json")
                .UsePlatformSettings(directory.Path, platform: "windows")
                .AddInMemoryCollection(new Dictionary<string, string?> { ["Port"] = "10421" }).Build();
            using var lifetime = configuration as System.IDisposable;
            Assert.Equal("10421", configuration["Port"]);
        }

        private sealed class TestDirectory : IDisposable
        {
            private static readonly string Root = System.IO.Path.GetFullPath(System.IO.Path.Combine(System.IO.Path.GetTempPath(), "handstack-unit-tests"));

            public string Path { get; } = System.IO.Path.Combine(Root, Guid.NewGuid().ToString("N"));

            public TestDirectory()
            {
                Directory.CreateDirectory(Path);
            }

            public void Dispose()
            {
                var target = System.IO.Path.GetFullPath(Path);
                if (target.StartsWith(Root + System.IO.Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) == false)
                {
                    throw new InvalidOperationException("테스트 임시 경로 확인 실패");
                }

                if (Directory.Exists(target))
                {
                    Directory.Delete(target, true);
                }
            }
        }
    }
}
