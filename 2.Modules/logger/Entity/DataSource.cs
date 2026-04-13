using System.Collections.Generic;

using Newtonsoft.Json;

namespace logger.Entity
{
    public partial record DataSource
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("TableName")]
        public string TableName { get; set; } = string.Empty;

        [JsonProperty("DataProvider")]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty("RemovePeriod")]
        public int RemovePeriod { get; set; } = -30;

        [JsonProperty("ConnectionString")]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty("IsEncryption")]
        public string IsEncryption { get; set; } = string.Empty;

        [JsonProperty("Schema")]
        public LogDataSourceSchema? Schema { get; set; }

        public bool HasDynamicSchema()
        {
            return Schema?.Columns != null && Schema.Columns.Count > 0;
        }
    }

    public partial record LogDataSourceSchema
    {
        [JsonProperty("Columns")]
        public List<LogDataSourceColumn> Columns { get; set; } = new List<LogDataSourceColumn>();

        [JsonProperty("Roles")]
        public LogDataSourceRoles Roles { get; set; } = new LogDataSourceRoles();
    }

    public partial record LogDataSourceColumn
    {
        [JsonProperty("ColumnName")]
        public string ColumnName { get; set; } = string.Empty;

        [JsonProperty("Name")]
        public string Name
        {
            get => ColumnName;
            set
            {
                if (string.IsNullOrWhiteSpace(ColumnName) == true)
                {
                    ColumnName = value;
                }
            }
        }

        public bool ShouldSerializeName()
        {
            return false;
        }

        [JsonProperty("LogicalType")]
        public string LogicalType { get; set; } = "String";

        [JsonProperty("Type")]
        public string Type
        {
            get => LogicalType;
            set
            {
                if (string.IsNullOrWhiteSpace(LogicalType) == true || LogicalType == "String")
                {
                    LogicalType = value;
                }
            }
        }

        public bool ShouldSerializeType()
        {
            return false;
        }

        [JsonProperty("Length")]
        public int? Length { get; set; }

        [JsonProperty("Precision")]
        public int? Precision { get; set; }

        [JsonProperty("Scale")]
        public int? Scale { get; set; }

        [JsonProperty("Nullable")]
        public bool Nullable { get; set; } = true;

        [JsonProperty("SourceType")]
        public string SourceType { get; set; } = string.Empty;

        [JsonProperty("SourceKey")]
        public string SourceKey { get; set; } = string.Empty;

        [JsonProperty("Required")]
        public bool Required { get; set; }

        [JsonProperty("DefaultValue")]
        public string? DefaultValue { get; set; }

        [JsonProperty("IsIdentity")]
        public bool? IsIdentity { get; set; }
    }

    public partial record LogDataSourceRoles
    {
        [JsonProperty("PrimaryKey")]
        public string PrimaryKey { get; set; } = string.Empty;

        [JsonProperty("CreatedAt")]
        public string CreatedAt { get; set; } = string.Empty;

        [JsonProperty("Message")]
        public string Message { get; set; } = string.Empty;

        [JsonProperty("Properties")]
        public string Properties { get; set; } = string.Empty;

        [JsonProperty("ServerID")]
        public string ServerID { get; set; } = string.Empty;

        [JsonProperty("GlobalID")]
        public string GlobalID { get; set; } = string.Empty;

        [JsonProperty("Environment")]
        public string Environment { get; set; } = string.Empty;

        [JsonProperty("RunningEnvironment")]
        public string RunningEnvironment
        {
            get => Environment;
            set
            {
                if (string.IsNullOrWhiteSpace(Environment) == true)
                {
                    Environment = value;
                }
            }
        }

        public bool ShouldSerializeRunningEnvironment()
        {
            return false;
        }

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty("ServiceID")]
        public string ServiceID { get; set; } = string.Empty;

        [JsonProperty("TransactionID")]
        public string TransactionID { get; set; } = string.Empty;
    }
}
