using System;
using System.Data;
using System.Data.Common;
using System.Reflection;

using Dapper;

using dbclient.DataClient;
using dbclient.Entity;
using dbclient.Extensions;
using dbclient.NativeParameters;

using HandStack.Data;

using Microsoft.Data.SqlClient;

using MySqlConnector;

using NpgsqlTypes;

using Oracle.ManagedDataAccess.Client;

using Xunit;

namespace DbClient.Tests
{
    public class ParameterSizeTests
    {
        [Fact]
        public void NativeSqlServerMaxOutputKeepsMaxSize()
        {
            var parameters = new SqlServerDynamicParameters();
            parameters.Add("Value", null, SqlDbType.NVarChar, ParameterDirection.Output, -1);
            Assert.Equal(-1, Assert.Single(parameters.sqlParameters).Size);
        }

        [Theory]
        [InlineData(DataProviders.SqlServer)]
        [InlineData(DataProviders.Oracle)]
        [InlineData(DataProviders.MySQL)]
        [InlineData(DataProviders.PostgreSQL)]
        [InlineData(DataProviders.SQLite)]
        public void NativeMaxInputAndExplicitSizeUseTheSamePolicy(DataProviders provider)
        {
            var factory = typeof(QueryDataClient).GetMethod("CreateDynamicParameters", BindingFlags.Static | BindingFlags.NonPublic)!;
            dynamic parameters = factory.Invoke(null, new object[] { provider, new StatementMap { NativeDataClient = true } })!;
            dynamic type = provider switch
            {
                DataProviders.SqlServer => (object)SqlDbType.NVarChar,
                DataProviders.Oracle => OracleDbType.NVarchar2,
                DataProviders.MySQL => MySqlDbType.LongText,
                DataProviders.PostgreSQL => NpgsqlDbType.Text,
                _ => DbType.String
            };
            var value = new string('한', 100000);
            parameters.Add("Value", value, type, ParameterDirection.Input, -1);
            parameters.Add("Limited", "abc", type, ParameterDirection.Input, 42);
            DbParameter[] bound = provider switch
            {
                DataProviders.SqlServer => ((SqlServerDynamicParameters)parameters).sqlParameters.ToArray(),
                DataProviders.Oracle => ((OracleDynamicParameters)parameters).oracleParameters.ToArray(),
                DataProviders.MySQL => ((MySqlDynamicParameters)parameters).mysqlParameters.ToArray(),
                DataProviders.PostgreSQL => ((NpgsqlDynamicParameters)parameters).npgsqlParameters.ToArray(),
                _ => ((SQLiteDynamicParameters)parameters).sqlliteParameters.ToArray()
            };
            Assert.Equal(provider == DataProviders.SqlServer ? -1 : 0, bound[0].Size);
            Assert.Same(value, bound[0].Value);
            Assert.Equal(42, bound[1].Size);
        }

        [Fact]
        public void GenericOracleMaxInputBindsWithoutNegativeSize()
        {
            var factory = typeof(QueryDataClient).GetMethod("CreateDynamicParameters", BindingFlags.Static | BindingFlags.NonPublic)!;
            dynamic parameters = factory.Invoke(null, new object[] { DataProviders.Oracle, new StatementMap { NativeDataClient = false } })!;
            var input = new string('한', 5000);
            parameters.Add("Value", input, DbType.String, ParameterDirection.Input, -1);
            using var connection = new OracleConnection();
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT :Value FROM DUAL";
            ((DynamicParameters)parameters).AddParameters(command);
            Assert.Equal(input, command.Parameters[0].Value);
            Assert.True(command.Parameters[0].Size == 0 || command.Parameters[0].Size >= input.Length);
        }

        [Theory]
        [InlineData(DataProviders.SqlServer)]
        [InlineData(DataProviders.Oracle)]
        [InlineData(DataProviders.MySQL)]
        [InlineData(DataProviders.PostgreSQL)]
        [InlineData(DataProviders.SQLite)]
        public void GenericMaxBindingPreservesValuesAndExplicitLengths(DataProviders provider)
        {
            using var database = new DatabaseFactory(provider == DataProviders.SQLite ? "Data Source=:memory:" : "", provider);
            var factory = typeof(QueryDataClient).GetMethod("CreateDynamicParameters", BindingFlags.Static | BindingFlags.NonPublic)!;
            dynamic parameters = factory.Invoke(null, new object[] { provider, new StatementMap { NativeDataClient = false } })!;
            var value = new string('한', 100000);
            parameters.Add("Value", value, DbType.String, ParameterDirection.Input, -1);
            if (provider != DataProviders.SQLite)
            {
                parameters.Add("Output", null, DbType.String, ParameterDirection.Output, -1);
            }
            parameters.Add("Limited", "abc", DbType.String, ParameterDirection.Input, 42);
            parameters.Add("Number", 7, DbType.Int32, ParameterDirection.Input, -1);
            var command = database.Command!;
            command.CommandText = "SELECT 1";
            ((DynamicParameters)parameters).AddParameters(command);
            Assert.Equal(value, command.Parameters["Value"].Value);
            Assert.Equal(42, command.Parameters["Limited"].Size);
            Assert.Equal(7, command.Parameters["Number"].Value);
            Assert.Equal(DbType.Int32, command.Parameters["Number"].DbType);
            if (provider != DataProviders.SQLite)
            {
                Assert.Equal(provider == DataProviders.SqlServer ? -1 : provider == DataProviders.Oracle ? 32767 : 0,
                    command.Parameters["Output"].Size);
            }
            Assert.Equal(value, ((DynamicParameters)parameters).Get<string>("Value"));
            Assert.Equal(value, ((DynamicParameters)parameters).ToParametersDictionary()["Value"]);
        }

        [Theory]
        [InlineData(DataProviders.SqlServer, false)]
        [InlineData(DataProviders.SqlServer, true)]
        [InlineData(DataProviders.Oracle, false)]
        [InlineData(DataProviders.Oracle, true)]
        [InlineData(DataProviders.MySQL, false)]
        [InlineData(DataProviders.MySQL, true)]
        [InlineData(DataProviders.PostgreSQL, false)]
        [InlineData(DataProviders.PostgreSQL, true)]
        [InlineData(DataProviders.SQLite, false)]
        [InlineData(DataProviders.SQLite, true)]
        public void MaxInputPreservesNullAndBinaryValues(DataProviders provider, bool isNull)
        {
            using var database = new DatabaseFactory(provider == DataProviders.SQLite ? "Data Source=:memory:" : "", provider);
            var parameters = new ProviderDynamicParameters();
            object value = isNull ? DBNull.Value : new byte[100000];
            parameters.Add("Value", value, DbType.Binary, ParameterDirection.Input, -1);
            var command = database.Command!;
            command.CommandText = "SELECT 1";
            parameters.AddParameters(command);
            Assert.Same(value, command.Parameters["Value"].Value);
            Assert.Equal(provider == DataProviders.SqlServer ? -1 : 0, command.Parameters["Value"].Size);
        }

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public void SqliteMaxValueRoundTripsWithoutTruncation(bool native)
        {
            using var database = new DatabaseFactory("Data Source=:memory:", DataProviders.SQLite);
            var value = new string('한', 100000);
            object parameters;
            if (native)
            {
                var nativeParameters = new SQLiteDynamicParameters();
                nativeParameters.Add("Value", value, DbType.String, ParameterDirection.Input, -1);
                parameters = nativeParameters;
            }
            else
            {
                var genericParameters = new ProviderDynamicParameters();
                genericParameters.Add("Value", value, DbType.String, ParameterDirection.Input, -1);
                parameters = genericParameters;
            }
            Assert.Equal(value, database.Connection!.ExecuteScalar<string>("SELECT @Value", parameters));
        }

        [Fact]
        public void ReplacingMaxWithExplicitSizeRemovesMaxPolicy()
        {
            var parameters = new ProviderDynamicParameters();
            parameters.Add("@Value", "first", DbType.String, ParameterDirection.Input, -1);
            parameters.Add("Value", "second", DbType.String, ParameterDirection.Input, 12);
            using var command = new SqlCommand("SELECT @Value", new SqlConnection());
            parameters.AddParameters(command);
            Assert.Equal(12, command.Parameters["Value"].Size);
            Assert.Equal("second", command.Parameters["Value"].Value);
        }

        [Theory]
        [InlineData(OracleDbType.Clob)]
        [InlineData(OracleDbType.NClob)]
        [InlineData(OracleDbType.Blob)]
        public void NativeOracleLobKeepsItsTypeAndFullValue(OracleDbType type)
        {
            var parameters = new OracleDynamicParameters();
            object value = type == OracleDbType.Blob ? new byte[100000] : new string('한', 100000);
            parameters.Add("Value", value, type, ParameterDirection.Input, -1);
            var parameter = Assert.Single(parameters.oracleParameters);
            Assert.Equal(type, parameter.OracleDbType);
            Assert.Same(value, parameter.Value);
            Assert.Equal(0, parameter.Size);
        }

        [Theory]
        [InlineData(ParameterDirection.Output)]
        [InlineData(ParameterDirection.InputOutput)]
        [InlineData(ParameterDirection.ReturnValue)]
        public void NativeOracleMaxScalarOutputHasABuffer(ParameterDirection direction)
        {
            var parameters = new OracleDynamicParameters();
            parameters.Add("Value", null, OracleDbType.NVarchar2, direction, -1);
            var parameter = Assert.Single(parameters.oracleParameters);
            Assert.Equal(OracleDbType.NVarchar2, parameter.OracleDbType);
            Assert.Equal(32767, parameter.Size);
        }

        [Fact]
        public void TemplateValuesRemainVisibleToParameterLogging()
        {
            var parameters = new ProviderDynamicParameters();
            parameters.AddDynamicParams(new { Value = "한글" });
            Assert.Equal("한글", parameters.ToParametersDictionary()["Value"]);
        }
    }
}
