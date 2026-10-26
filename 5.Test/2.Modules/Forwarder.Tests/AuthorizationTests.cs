using System.Net;

using forwarder.Entity;
using forwarder.Extensions;

using Microsoft.AspNetCore.Http;

using Xunit;

namespace Forwarder.Tests
{
    public class AuthorizationTests
    {
        [Theory]
        [InlineData("192.0.2.10", true)]
        [InlineData("192.0.2.11", false)]
        public void OnlyConfiguredClientAddressIsAllowed(string address, bool expected)
        {
            var previous = ModuleConfiguration.AllowClientIP;
            try
            {
                ModuleConfiguration.AllowClientIP = ["192.0.2.10"];
                var context = new DefaultHttpContext();
                context.Connection.RemoteIpAddress = IPAddress.Parse(address);
                Assert.Equal(expected, context.IsAllowClientIP());
            }
            finally
            {
                ModuleConfiguration.AllowClientIP = previous;
            }
        }

        [Fact]
        public void MissingBearerTokenIsRejectedEvenForAllowedAddress()
        {
            var previous = ModuleConfiguration.AllowClientIP;
            try
            {
                ModuleConfiguration.AllowClientIP = ["*"];
                var context = new DefaultHttpContext();
                context.Connection.RemoteIpAddress = IPAddress.Loopback;
                Assert.False(context.TryAuthorizeBearerToken(out var token, out var error));
                Assert.Null(token);
                Assert.Contains("BearerToken", error);
            }
            finally
            {
                ModuleConfiguration.AllowClientIP = previous;
            }
        }
    }
}
