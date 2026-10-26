using System;
using System.Linq;

using Dapper;

using dbclient.Entity;
using dbclient.Extensions;

using HandStack.Data;
using HandStack.Web.MessageContract.DataObject;

using HtmlAgilityPack;

using Xunit;

namespace DbClient.Tests
{
    public class SqlFilterTests
    {
        private static StatementMap Statement()
        {
            var html = new HtmlDocument();
            html.LoadHtml("SELECT * FROM Items WHERE 1=1 <filters parameter=\"Filters\"><field groupID=\"Name\" column=\"Name\" type=\"String\" operators=\"eq,contains\" /></filters>");
            return new StatementMap { Chidren = html };
        }

        [Fact]
        public void FilterValueIsBoundAndNeverInsertedIntoSql()
        {
            var value = "x' OR 1=1 --";
            var query = new QueryObject();
            query.Parameters.Add(new DynamicParameter { ParameterName = "Filters", DbType = "String", Value = "[{\"groupID\":\"Name\",\"operator\":\"eq\",\"logic\":\"AND\",\"key\":\"" + value + "\"}]" });
            var parameters = new DynamicParameters();
            var sql = DatabaseMapper.Find(Statement(), query, parameters, DataProviders.SqlServer);
            Assert.DoesNotContain(value, sql);
            Assert.Contains("@Filter_main_0", sql);
            Assert.Single(parameters.ParameterNames);
            Assert.Equal("Filter_main_0", parameters.ParameterNames.Single());
        }

        [Fact]
        public void UndeclaredFilterGroupIsRejectedBeforeExecution()
        {
            var query = new QueryObject();
            query.Parameters.Add(new DynamicParameter { ParameterName = "Filters", DbType = "String", Value = "[{\"groupID\":\"UntrustedColumn\",\"operator\":\"eq\",\"logic\":\"AND\",\"key\":1}]" });
            Assert.Throws<InvalidOperationException>(() => DatabaseMapper.Find(Statement(), query, new DynamicParameters(), DataProviders.SqlServer));
        }
    }
}
