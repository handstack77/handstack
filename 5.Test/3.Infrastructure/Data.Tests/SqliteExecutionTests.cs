using System;
using System.Linq;

using HandStack.Data;

using Xunit;

namespace Data.Tests
{
    public class SqliteExecutionTests
    {
        [Fact]
        public void ScalarQueryBindsUserInputAsAParameter()
        {
            using var database = new DatabaseFactory("Data Source=:memory:", DataProviders.SQLite);
            const string input = "홍길동'; SELECT 9; --";
            Assert.True(database.AddParameter("@Name", input) >= 0);
            Assert.Equal(input, database.ExecuteScalar("SELECT @Name"));
        }

        [Fact]
        public void TableQueryPreservesColumnNamesAndValues()
        {
            using var database = new DatabaseFactory("Data Source=:memory:", DataProviders.SQLite);
            using var table = database.ExecuteDataTable("SELECT '사용자' AS Name, 42 AS Value");
            Assert.NotNull(table);
            var row = Assert.Single(table.Rows.Cast<System.Data.DataRow>());
            Assert.Equal("사용자", row["Name"]);
            Assert.Equal(42L, Convert.ToInt64(row["Value"]));
        }
    }
}
