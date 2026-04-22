using System.Collections.Generic;

namespace graphclient.Entity
{
    public record GraphDataSourceMap
    {
        public string ApplicationID { get; set; } = string.Empty;

        public List<string> ProjectListID { get; set; } = new();

        public string DataSourceID { get; set; } = string.Empty;

        public string GraphProvider { get; set; } = string.Empty;

        public string ConnectionString { get; set; } = string.Empty;

        public string UserName { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public string Database { get; set; } = string.Empty;

        public string Comment { get; set; } = string.Empty;
    }
}
