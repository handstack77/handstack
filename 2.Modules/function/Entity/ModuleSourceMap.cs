using System.Collections.Generic;

using HandStack.Data;

namespace function.Entity
{
    public class ModuleSourceMap
    {
        public List<string> ProjectListID { get; set; } = new List<string>();

        public string DataSourceID { get; set; } = "";

        public DataProviders DataProvider { get; set; }

        public string ConnectionString { get; set; } = "";

        public string WorkingDirectoryPath { get; set; } = "";
    }
}
