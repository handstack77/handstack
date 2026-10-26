using System.Collections.Generic;

using HandStack.Web.MessageContract.Contract;

using transact.Extensions;

using Xunit;

namespace Transact.Tests
{
    public class DataMapValidationTests
    {
        [Theory]
        [InlineData("FormData0", "{\"Count\":3}", true)]
        [InlineData("GridData0", "[{\"Count\":3}]", true)]
        [InlineData("FormData0", "[]", false)]
        [InlineData("GridData0", "{}", false)]
        [InlineData("InvalidName", "{}", false)]
        [InlineData("FormData0", "invalid json", false)]
        public void DataMapNamesAndJsonShapesAreValidated(string name, string value, bool expected)
        {
            var result = DataMapItemValidator.ValidateDataMapItems([new DataMapItem { FieldID = name, Value = value }], "");
            Assert.Equal(expected, result.IsValid);
            Assert.Equal(expected, result.Errors.Count == 0);
        }

        [Fact]
        public void FailedBusinessExpressionReturnsItsMessage()
        {
            var items = new List<DataMapItem> { new DataMapItem { FieldID = "FormData0", Value = new { Count = 0 } } };
            var result = DataMapItemValidator.ValidateDataMapItems(items, "FormData0.Count > 0 | '수량이 필요합니다'");
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, error => error.Contains("수량이 필요합니다"));
        }
    }
}
