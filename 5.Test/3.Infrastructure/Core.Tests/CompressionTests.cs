using HandStack.Core.Helpers;

using Xunit;

namespace Core.Tests
{
    public class CompressionTests
    {
        [Theory]
        [InlineData("")]
        [InlineData("HandStack 거래 입력")]
        [InlineData("한글과 emoji 😀\n줄바꿈\t값")]
        [InlineData("반복반복반복반복반복반복반복반복")]
        public void WireEncodingsPreserveUnicodeAndControlCharacters(string text)
        {
            Assert.Equal(text, LZStringHelper.DecompressFromBase64(LZStringHelper.CompressToBase64(text)));
            Assert.Equal(text, LZStringHelper.DecompressFromUTF16(LZStringHelper.CompressToUTF16(text)));
            Assert.Equal(text, LZStringHelper.DecompressFromEncodedURIComponent(LZStringHelper.CompressToEncodedURIComponent(text)));
            Assert.Equal(text, LZStringHelper.DecompressFromUint8Array(LZStringHelper.CompressToUint8Array(text)));
        }
    }
}
