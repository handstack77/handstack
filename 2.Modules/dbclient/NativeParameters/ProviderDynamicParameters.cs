using System.Collections.Generic;
using System.Data;
using System.Data.Common;

using Dapper;

using HandStack.Data.ExtensionMethod;

namespace dbclient.NativeParameters
{
    // Dapper의 값 조회/출력 매핑은 유지하고, -1 크기만 실제 공급자의 매개변수에 적용한다.
    public class ProviderDynamicParameters : DynamicParameters, SqlMapper.IDynamicParameters
    {
        private readonly HashSet<string> maxSizeParameters = [];

        public new void Add(string name, object? value, DbType? dbType, ParameterDirection? direction, int? size)
        {
            Add(name, value, dbType, direction, size, null, null);
        }

        public new void Add(string name, object? value = null, DbType? dbType = null, ParameterDirection? direction = null, int? size = null, byte? precision = null, byte? scale = null)
        {
            var parameterName = name.Length > 0 && name[0] is '@' or ':' or '?' ? name.Substring(1) : name;
            if (size == -1)
            {
                maxSizeParameters.Add(parameterName);
            }
            else
            {
                maxSizeParameters.Remove(parameterName);
            }

            // Oracle에서 음수 Size를 설정하기 전에 막고, Dapper의 기본 문자열 크기도 덮어쓴다.
            base.Add(name, value, dbType, direction, size == -1 ? 0 : size, precision, scale);
        }

        void SqlMapper.IDynamicParameters.AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            base.AddParameters(command, identity);
            foreach (DbParameter parameter in command.Parameters)
            {
                var name = parameter.ParameterName;
                var parameterName = name.Length > 0 && name[0] is '@' or ':' or '?' ? name.Substring(1) : name;
                if (maxSizeParameters.Contains(parameterName))
                {
                    parameter.SetParameterSize(-1);
                }
            }
        }
    }
}
