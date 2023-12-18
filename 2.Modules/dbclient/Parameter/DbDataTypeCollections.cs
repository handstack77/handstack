using System.Collections.Generic;

namespace dbclient.Parameter
{
    public class DbDataTypeCollections : Dictionary<string, List<DbDataType>>
    {
        public DbDataTypeCollections(string parameterName, List<DbDataType> parameterList)
        {
            Add(parameterName, parameterList);
        }
    }
}
