using wwwroot.Areas.wwwroot.Controllers;

using Xunit;

namespace Wwwroot.Tests
{
    public class SyncRequestTests
    {
        [Fact]
        public void ContractSyncNormalizesModuleAndPathSeparators()
        {
            Assert.True(SyncRequest.TryCreate(" DBCLIENT ", " Deleted ", "/HDS\\TST\\query.xml", out var request, out var error));
            Assert.Equal("dbclient", request.ModuleName);
            Assert.Equal("HDS/TST/query.xml", request.RelativeFilePath);
            Assert.True(request.IsDeleteChange);
            Assert.Empty(error);
        }

        [Theory]
        [InlineData("unknown", "Created", "file.xml")]
        [InlineData("transact", "", "file.json")]
        [InlineData("transact", "Created", "")]
        public void IncompleteOrUnsupportedSyncRequestIsRejected(string module, string change, string path)
        {
            Assert.False(SyncRequest.TryCreate(module, change, path, out _, out var error));
            Assert.NotEmpty(error);
        }
    }
}
