using System;
using System.Data;
using System.Text;

using Dapper;

using dbclient.Profiler;

using HandStack.Data;

using Npgsql;
using NpgsqlTypes;

using Oracle.ManagedDataAccess.Client;

namespace dbclient.Extensions
{
    internal enum FilterGuidFormat
    {
        Default, String36, String32, Binary16, Binary16BigEndian
    }

    internal enum FilterBooleanFormat
    {
        Default, Native, Numeric
    }

    // 일반/NativeDataClient 모두 같은 공급자별 매개변수를 생성한다.
    internal sealed class SqlFilterParameter : SqlMapper.ICustomQueryParameter
    {
        private readonly DbType type;

        internal object Value { get; }

        internal SqlFilterParameter(object value, DbType type, DataProviders provider, FilterGuidFormat guidFormat, FilterBooleanFormat booleanFormat)
        {
            if (type == DbType.Guid)
            {
                var guid = (Guid)value;
                (value, type) = guidFormat switch
                {
                    FilterGuidFormat.String36 => (guid.ToString("D"), DbType.String),
                    FilterGuidFormat.String32 => (guid.ToString("N"), DbType.AnsiString),
                    FilterGuidFormat.Binary16 => (guid.ToByteArray(), DbType.Binary),
                    FilterGuidFormat.Binary16BigEndian => (guid.ToByteArray(bigEndian: true), DbType.Binary),
                    _ when provider == DataProviders.Oracle => (guid.ToByteArray(), DbType.Binary),
                    _ => (value, type)
                };
            }
            if (type == DbType.Boolean && (booleanFormat == FilterBooleanFormat.Numeric ||
                (provider == DataProviders.Oracle && booleanFormat == FilterBooleanFormat.Default)))
            {
                // Oracle 19c/21c의 NUMBER(1) 컬럼에서도 동작한다.
                value = (short)((bool)value ? 1 : 0);
                type = DbType.Int16;
            }
            if (type is DbType.DateTime or DbType.DateTime2)
            {
                type = provider is DataProviders.SqlServer or DataProviders.PostgreSQL ? DbType.DateTime2 : DbType.DateTime;
            }
            if (type == DbType.DateTimeOffset)
            {
                var utc = ((DateTimeOffset)value).ToUniversalTime();
                if (provider is DataProviders.MySQL or DataProviders.SQLite)
                {
                    // 시간대가 없는 저장소에는 UTC 시각을 기록한 컬럼과 비교한다.
                    value = DateTime.SpecifyKind(utc.UtcDateTime, DateTimeKind.Unspecified);
                    type = DbType.DateTime;
                }
                else
                {
                    value = utc;
                }
            }
            if (value is string text)
            {
                if (text.Contains('\0'))
                {
                    throw new InvalidOperationException("filters: 문자열 비교값에 NUL 문자를 사용할 수 없습니다.");
                }
                if (provider == DataProviders.Oracle &&
                    ((type == DbType.String && (text.Length > 2000 || OracleNationalByteCount(text) > 4000)) ||
                        (type == DbType.AnsiString && Encoding.UTF8.GetByteCount(text) > 4000)))
                {
                    throw new InvalidOperationException("filters: Oracle 문자열 필터는 NVARCHAR2 2000 UTF-16 단위 및 국가 문자셋 4000바이트, VARCHAR2 UTF-8 4000바이트 범위여야 합니다.");
                }
            }
            Value = value;
            this.type = type;
        }

        public void AddParameter(IDbCommand command, string name)
        {
            var actual = command is ProfilerDbCommand profiled ? profiled.WrappedCommand : command;
            if (actual is OracleCommand oracleCommand)
            {
                oracleCommand.BindByName = true;
            }
            var parameter = actual.CreateParameter();
            parameter.ParameterName = name;
            parameter.Direction = ParameterDirection.Input;
            parameter.Value = Value;

            if (parameter is OracleParameter oracle)
            {
                oracle.OracleDbType = type switch
                {
                    DbType.String => OracleDbType.NVarchar2,
                    DbType.AnsiString => OracleDbType.Varchar2,
                    DbType.Binary => OracleDbType.Raw,
                    DbType.Boolean => OracleDbType.Boolean,
                    DbType.Int16 => OracleDbType.Int16,
                    DbType.Int32 => OracleDbType.Int32,
                    DbType.Int64 => OracleDbType.Int64,
                    DbType.Decimal => OracleDbType.Decimal,
                    DbType.Double => OracleDbType.BinaryDouble,
                    DbType.Single => OracleDbType.BinaryFloat,
                    DbType.Date => OracleDbType.Date,
                    DbType.DateTime => OracleDbType.TimeStamp,
                    DbType.DateTimeOffset => OracleDbType.TimeStampTZ,
                    _ => throw new InvalidOperationException($"filters: Oracle에서 지원하지 않는 매개변수 타입입니다: {type}")
                };
            }
            else
            {
                parameter.DbType = type;
            }
            if (parameter is NpgsqlParameter postgres)
            {
                // Npgsql DateTime의 기본 매핑(timestamptz)에 의존하지 않는다.
                if (type == DbType.DateTime2) postgres.NpgsqlDbType = NpgsqlDbType.Timestamp;
                if (type == DbType.DateTimeOffset) postgres.NpgsqlDbType = NpgsqlDbType.TimestampTz;
            }
            if (Value is string str)
            {
                parameter.Size = Math.Max(1, str.Length);
            }
            if (Value is byte[] bytes)
            {
                parameter.Size = bytes.Length;
            }
            actual.Parameters.Add(parameter);
        }

        private static int OracleNationalByteCount(string value)
        {
            // Oracle UTF8 국가 문자셋은 CESU-8이다. 보조 문자는 surrogate 각각을 3바이트로 계산한다.
            var count = 0;
            foreach (var character in value)
            {
                count += character <= 0x7f ? 1 : character <= 0x7ff ? 2 : 3;
                if (count > 4000) break;
            }
            return count;
        }
    }
}
