using System.Collections.Generic;

using HandStack.Data;

namespace dbclient.Entity
{
    public class DataSourceMap
    {
        public string ApplicationID { get; set; }

        public List<string> ProjectListID { get; set; }

        public DataProviders DataProvider { get; set; }

        public string ConnectionString { get; set; }

        public DataSourceMap()
        {
            ApplicationID = "";
            ProjectListID = new List<string>();
            DataProvider = DataProviders.SqlServer;
            ConnectionString = "";
        }
    }
}
