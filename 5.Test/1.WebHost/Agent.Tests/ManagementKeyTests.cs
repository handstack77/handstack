using agent.Options;
using agent.Security;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Xunit;

namespace Agent.Tests
{
    public class ManagementKeyTests
    {
        [Theory]
        [InlineData("fixture-key", "fixture-key", true)]
        [InlineData(" fixture-key ", "fixture-key ", true)]
        [InlineData("fixture-key", "fixture-kez", false)]
        [InlineData("", "", false)]
        [InlineData("fixture-key", null, false)]
        public void EmptyOrDifferentManagementKeysAreRejected(string expected, string? supplied, bool allowed)
        {
            using var services = new ServiceCollection().AddOptions().Configure<AgentOptions>(options => options.ManagementKey = expected).BuildServiceProvider();
            var validator = new ManagementKeyValidator(services.GetRequiredService<IOptionsMonitor<AgentOptions>>());
            Assert.Equal(allowed, validator.Validate(supplied));
        }

        [Theory]
        [InlineData("", "X-Management-Key")]
        [InlineData(" X-Custom-Key ", "X-Custom-Key")]
        public void HeaderNameUsesFallbackOrTrimmedConfiguration(string configured, string expected)
        {
            using var services = new ServiceCollection().AddOptions().Configure<AgentOptions>(options => options.ManagementHeaderName = configured).BuildServiceProvider();
            var validator = new ManagementKeyValidator(services.GetRequiredService<IOptionsMonitor<AgentOptions>>());
            Assert.Equal(expected, validator.ManagementHeaderName);
        }
    }
}
