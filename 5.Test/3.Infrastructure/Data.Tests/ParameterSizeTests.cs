using System;
using System.Data;
using System.Data.Common;
using System.Data.SQLite;
using System.IO;

using HandStack.Data.ExtensionMethod;

using Microsoft.Data.SqlClient;

using MySqlConnector;

using Npgsql;

using Oracle.ManagedDataAccess.Client;

using Xunit;

namespace Data.Tests
{
    public class ParameterSizeTests
    {
        [Theory]
        [InlineData("SqlServer")]
        [InlineData("Oracle")]
        [InlineData("MySQL")]
        [InlineData("PostgreSQL")]
        [InlineData("SQLite")]
        public void MaxSizePreservesTheNativeTypeAndEntireInput(string provider)
        {
            DbParameter parameter = provider switch
            {
                "SqlServer" => new SqlParameter("Value", SqlDbType.NVarChar),
                "Oracle" => new OracleParameter("Value", OracleDbType.NVarchar2),
                "MySQL" => new MySqlParameter("Value", MySqlDbType.LongText),
                "PostgreSQL" => new NpgsqlParameter("Value", NpgsqlTypes.NpgsqlDbType.Text),
                _ => new SQLiteParameter("Value", DbType.String)
            };
            var type = parameter.DbType;
            var value = new string('한', 100000);
            parameter.Value = value;
            parameter.SetParameterSize(-1);
            Assert.Equal(type, parameter.DbType);
            Assert.Same(value, parameter.Value);
            Assert.Equal(provider == "SqlServer" ? -1 : 0, parameter.Size);
            parameter.SetParameterSize(123);
            Assert.Equal(123, parameter.Size);
        }

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public void SqlContractLengthMinusOneIsAppliedAfterTypeResolution(bool native)
        {
            var root = Path.Combine(Path.GetTempPath(), "handstack-size-" + Guid.NewGuid().ToString("N"));
            var directory = Path.Combine(root, "HDS", "TST");
            Directory.CreateDirectory(directory);
            var path = Path.Combine(directory, "TST010.xml");
            try
            {
                File.WriteAllText(path, "<mapper><commands><statement id=\"LD01\" native=\"" + native.ToString().ToLowerInvariant()
                    + "\">SELECT @Value<param id=\"@Value\" type=\"" + (native ? "NVarChar" : "String")
                    + "\" length=\"-1\" /></statement></commands></mapper>");
                var result = native
                    ? DatabaseExtensions.GetSqlClientTuple(path, "LD01", "{\"Value\":\"한글\"}")
                    : DatabaseExtensions.GetSqlClientMetaSQL(root, "HDS", "TST", "TST010", "LD01", "{\"Value\":\"한글\"}");
                Assert.NotNull(result);
                Assert.NotNull(result.Item2);
                var parameter = Assert.Single(result.Item2);
                Assert.Equal(-1, parameter.Size);
                Assert.Equal("한글", parameter.Value);
                Assert.Equal(SqlDbType.NVarChar, parameter.SqlDbType);
            }
            finally
            {
                File.Delete(path);
                Directory.Delete(directory);
                Directory.Delete(Path.GetDirectoryName(directory)!);
                Directory.Delete(root);
            }
        }
    }
}
