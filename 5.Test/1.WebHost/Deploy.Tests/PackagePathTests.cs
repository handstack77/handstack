using System;
using System.IO;

using deploy.Updates;

using Xunit;

namespace Deploy.Tests
{
    public class PackagePathTests
    {
        [Fact]
        public void ModuleFileResolvesInsideInstallationRoot()
        {
            using var directory = new TestDirectory();
            Assert.True(UpdatePathPolicy.TryResolveInstallPath(directory.Path, "./modules/transact/transact.dll", out var resolved));
            Assert.Equal(Path.Combine(directory.Path, "modules", "transact", "transact.dll"), resolved);
        }

        [Theory]
        [InlineData("modules/../../outside.txt")]
        [InlineData("../app/ack.dll")]
        [InlineData("unknown/file.txt")]
        public void EscapingOrUnsupportedPackagePathIsRejected(string relativePath)
        {
            using var directory = new TestDirectory();
            Assert.False(UpdatePathPolicy.TryResolveInstallPath(directory.Path, relativePath, out var resolved));
            Assert.Empty(resolved);
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
