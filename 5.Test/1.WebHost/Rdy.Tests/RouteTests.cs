using rdy.Extensions;

using Xunit;

namespace Rdy.Tests
{
    public class RouteTests
    {
        [Theory]
        [InlineData("TransactionExecute", "transaction-execute")]
        [InlineData("already-slug", "already-slug")]
        [InlineData("", "")]
        public void OutboundRouteUsesLowercaseWords(string input, string expected)
        {
            Assert.Equal(expected, new SlugifyParameterTransformer().TransformOutbound(input));
        }

        [Fact]
        public void MissingRouteValueStaysMissing()
        {
            Assert.Null(new SlugifyParameterTransformer().TransformOutbound(null!));
        }
    }
}
