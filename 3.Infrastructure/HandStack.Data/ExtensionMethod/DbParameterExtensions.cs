using System;
using System.Data;
using System.Data.Common;

using Microsoft.Data.SqlClient;

using Oracle.ManagedDataAccess.Client;

namespace HandStack.Data.ExtensionMethod
{
    public static class DbParameterExtensions
    {
        /// <summary>
        /// -1은 컬럼 타입을 유지하면서 매개변수의 길이 제한을 해제한다. 컬럼의 실제 최대 길이와 저장 가능 여부는 데이터베이스에서 검사한다.
        /// </summary>
        public static void SetParameterSize(this DbParameter parameter, int? size)
        {
            ArgumentNullException.ThrowIfNull(parameter);

            if (size > 0)
            {
                parameter.Size = size.Value;
            }
            else if (size == -1)
            {
                if (parameter is SqlParameter)
                {
                    parameter.Size = parameter.DbType is DbType.String or DbType.AnsiString
                        or DbType.StringFixedLength or DbType.AnsiStringFixedLength or DbType.Binary ? -1 : 0;
                }
                else if (parameter is OracleParameter oracleParameter)
                {
                    // LOB은 별도 길이 제한을 두지 않으며, VARCHAR2를 CLOB으로 바꾸지 않는다.
                    oracleParameter.Size = oracleParameter.Direction != ParameterDirection.Input && oracleParameter.OracleDbType is OracleDbType.Char or OracleDbType.NChar or OracleDbType.Varchar2 or OracleDbType.NVarchar2 or OracleDbType.Raw ? 32767 : 0;
                }
                else
                {
                    // Npgsql, MySqlConnector, SQLite는 0일 때 입력값 전체를 사용한다.
                    parameter.Size = 0;
                }
            }
        }
    }
}
