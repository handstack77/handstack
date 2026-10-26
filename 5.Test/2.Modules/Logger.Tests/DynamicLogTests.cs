using System.Collections.Generic;

using HandStack.Data;
using HandStack.Web.MessageContract.Message;

using logger.Entity;

using Xunit;

namespace Logger.Tests
{
    public class DynamicLogTests
    {
        private static DataSource Source()
        {
            return new DataSource
            {
                ApplicationID = "APP",
                TableName = "LogEntries",
                Schema = new LogDataSourceSchema
                {
                    Columns = [new LogDataSourceColumn { ColumnName = "Message", SourceType = "Payload", SourceKey = "text", Required = true }]
                }
            };
        }

        [Fact]
        public void LogPayloadUsesParametersInsteadOfSqlText()
        {
            const string value = "untrusted ' text; DROP TABLE LogEntries;";
            var insert = LogDataSourceSchemaSqlBuilder.BuildInsert(Source(), DataProviders.SQLite, new LogMessage(), new Dictionary<string, object?> { ["text"] = value });
            Assert.DoesNotContain(value, insert.CommandText);
            Assert.Contains("@p0", insert.CommandText);
            Assert.Equal(value, insert.Parameters.Get<string>("p0"));
        }

        [Fact]
        public void MissingRequiredLogColumnIsRejected()
        {
            Assert.Throws<DynamicLogValidationException>(() => LogDataSourceSchemaSqlBuilder.BuildInsert(Source(), DataProviders.SQLite, new LogMessage(), null));
        }
    }
}
