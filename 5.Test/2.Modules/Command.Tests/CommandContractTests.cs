using System;
using System.IO;

using command.Extensions;

using Serilog;

using Xunit;

namespace Command.Tests
{
    public class CommandContractTests
    {
        [Fact]
        public void ContractParserPreservesSequenceAndHttpDefaults()
        {
            using var directory = new TestDirectory();
            var path = Path.Combine(directory.Path, "fixture.xml");
            File.WriteAllText(path, """
                <mapper><header><application>APP</application><project>TEST</project><transaction>COMMAND</transaction><use>Y</use><timeout>15</timeout></header>
                <commands><command id="GC01" seq="0" use="Y"><executable>fixture</executable></command><command id="GC01" seq="1" use="Y"><executable>fixture</executable></command></commands>
                <requests><request id="GW01" seq="0" use="Y"><url>https://example.invalid/unused</url></request></requests></mapper>
                """);
            var commands = CommandMapper.ParseCommandFile(path, Log.Logger);
            Assert.Collection(commands,
                first => { Assert.Equal("GC0100", first.CommandID); Assert.Equal(15, first.Timeout); },
                second => Assert.Equal("GC0101", second.CommandID),
                http => { Assert.Equal("HTTP", http.CommandType); Assert.Equal("GET", http.Method); Assert.Equal("application/json", http.ContentType); });
        }

        [Fact]
        public void DisabledContractDoesNotProduceExecutableCommands()
        {
            using var directory = new TestDirectory();
            var path = Path.Combine(directory.Path, "disabled.xml");
            File.WriteAllText(path, "<mapper><header><use>N</use></header><commands><command id=\"GC01\"><executable>unused</executable></command></commands></mapper>");
            Assert.Empty(CommandMapper.ParseCommandFile(path, Log.Logger));
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
