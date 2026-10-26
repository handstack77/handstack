using prompter.Extensions;

using Newtonsoft.Json.Linq;

using Xunit;

namespace Prompter.Tests
{
    public class PromptParameterTests
    {
        [Theory]
        [InlineData("@UserID", "UserID")]
        [InlineData(":UserID", "UserID")]
        [InlineData("$UserID", "UserID")]
        [InlineData("#UserID", "UserID")]
        [InlineData("UserID", "UserID")]
        [InlineData("", "")]
        public void ProviderParameterPrefixesNormalizeToOneName(string name, string expected)
        {
            Assert.Equal(expected, PromptMapper.NormalizeParameterName(name));
        }

        [Theory]
        [InlineData("안녕하세요 ${UserID}", "안녕하세요 홍길동")]
        [InlineData("안녕하세요 #{UserID}", "안녕하세요 '홍길동'")]
        public void PromptTextReceivesCurrentParameterValue(string template, string expected)
        {
            var text = PromptMapper.ConvertParameterText(template, new JObject { ["UserID"] = "홍길동" });
            Assert.Equal(expected, text);
        }
    }
}
