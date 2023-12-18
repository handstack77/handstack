using dbclient.Enumeration;

using HandStack.Core.DataModel;

namespace dbclient.Parameter
{
    public class DbDataType : BaseEntity
    {
        private string parameterName = "";

        private string parameterValue = "";

        private DatabaseType dataType = DatabaseType.NotSupported;

        public string ParameterValue
        {
            get { return parameterValue; }
            set { parameterValue = value; }
        }

        public string ParameterName
        {
            get { return parameterName; }
            set { parameterName = value; }
        }

        public DatabaseType DataType
        {
            get { return dataType; }
            set { dataType = value; }
        }

        public DbDataType(string parameterName, string parameterValue, DatabaseType dataType)
        {
            ParameterName = parameterName;
            ParameterValue = parameterValue;
            DataType = dataType;
        }
    }
}
