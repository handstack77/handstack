using System;
using System.IO;

using repository.Extensions;

using Xunit;

namespace Repository.Tests
{
    public class LocalStorageTests
    {
        [Fact]
        public void CopyDoesNotOverwriteExistingFileUnlessExplicitlyRequested()
        {
            using var directory = new TestDirectory();
            var source = Path.Combine(directory.Path, "source.txt");
            var target = Path.Combine(directory.Path, "target.txt");
            File.WriteAllText(source, "새 내용");
            File.WriteAllText(target, "기존 내용");
            Assert.Throws<IOException>(() => FileSystemExtensions.CopyFile(source, target));
            Assert.Equal("기존 내용", File.ReadAllText(target));
            FileSystemExtensions.CopyFile(source, target, true);
            Assert.Equal("새 내용", File.ReadAllText(target));
        }

        [Fact]
        public void FileEnumerationHonorsExtensionFilter()
        {
            using var directory = new TestDirectory();
            File.WriteAllText(Path.Combine(directory.Path, "contract.json"), "{}");
            File.WriteAllText(Path.Combine(directory.Path, "ignored.txt"), "fixture");
            Assert.EndsWith("contract.json", Assert.Single(FileSystemExtensions.GetFiles(directory.Path, "*.json")));
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
