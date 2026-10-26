using System;
using System.Data;

using graphclient.Extensions;

using Xunit;

namespace GraphClient.Tests
{
    public class ColumnMetadataTests
    {
        [Fact]
        public void GraphResultsPreserveLengthAndNumericMetadata()
        {
            using var table = new DataTable();
            table.Columns.Add("Name", typeof(string)).MaxLength = 80;
            table.Columns.Add("Count", typeof(long));
            table.Columns.Add("CreatedAt", typeof(DateTimeOffset));
            Assert.Equal("Name:string|80;Count:number;CreatedAt:date", table.BuildMeta());
            var columns = table.GetDbColumns();
            Assert.Equal(80, columns[0].Length);
            Assert.Equal("Int64", columns[1].DataType);
        }

        [Theory]
        [InlineData("Boolean", "bool")]
        [InlineData("Decimal", "numeric")]
        [InlineData("Byte[]", "binary")]
        [InlineData("UnknownType", "string")]
        public void MetadataTypesHaveStableClientNames(string type, string expected)
        {
            Assert.Equal(expected, JsonExtensions.ToMetaDataType(type));
        }
    }
}
