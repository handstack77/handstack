using System;
using System.IO;
using System.Threading.Tasks;

using forbes.Extensions;

using Xunit;

namespace Forbes.Tests
{
    public class FileSyncTests
    {
        [Theory]
        [InlineData("contract.json")]
        [InlineData("contract.xml")]
        public async Task MultipleContractFiltersPublishCreatedFile(string name)
        {
            using var directory = new TestDirectory();
            using var watcher = new FileSyncManager(directory.Path, "*.json|*.xml");
            var change = new TaskCompletionSource<FileInfo>(TaskCreationOptions.RunContinuationsAsynchronously);
            watcher.MonitoringFile += (kind, file) =>
            {
                if (kind == WatcherChangeTypes.Created && file.Name == name)
                {
                    change.TrySetResult(file);
                }
            };
            watcher.Start();
            await File.WriteAllTextAsync(Path.Combine(directory.Path, name), "fixture");
            var created = await change.Task.WaitAsync(System.TimeSpan.FromSeconds(10));
            Assert.Equal(Path.Combine(directory.Path, name), created.FullName);
            watcher.Stop();
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
