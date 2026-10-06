using System.Collections.Generic;

using Newtonsoft.Json;

namespace logger.Entity
{
    public partial record DataSource
    {
        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(nameof(TableName))]
        public string TableName { get; set; } = string.Empty;

        [JsonProperty(nameof(DataProvider))]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty(nameof(RemovePeriod))]
        public int RemovePeriod { get; set; } = -30;

        [JsonProperty(nameof(ConnectionString))]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty(nameof(IsEncryption))]
        public string IsEncryption { get; set; } = string.Empty;

        [JsonProperty(nameof(Schema))]
        public LogDataSourceSchema? Schema { get; set; }

        public bool HasDynamicSchema()
        {
            return Schema?.Columns != null && Schema.Columns.Count > 0;
        }
    }

    public partial record LogDataSourceSchema
    {
        [JsonProperty(nameof(Columns))]
        public List<LogDataSourceColumn> Columns { get; set; } = [];

        [JsonProperty(nameof(Roles))]
        public LogDataSourceRoles Roles { get; set; } = new LogDataSourceRoles();
    }

    public partial record LogDataSourceColumn
    {
        [JsonProperty(nameof(ColumnName))]
        public string ColumnName { get; set; } = string.Empty;

        [JsonProperty(nameof(Name))]
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

        [JsonProperty(nameof(LogicalType))]
        public string LogicalType { get; set; } = "String";

        [JsonProperty(nameof(Type))]
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

        [JsonProperty(nameof(Length))]
        public int? Length { get; set; }

        [JsonProperty(nameof(Precision))]
        public int? Precision { get; set; }

        [JsonProperty(nameof(Scale))]
        public int? Scale { get; set; }

        [JsonProperty(nameof(Nullable))]
        public bool Nullable { get; set; } = true;

        [JsonProperty(nameof(SourceType))]
        public string SourceType { get; set; } = string.Empty;

        [JsonProperty(nameof(SourceKey))]
        public string SourceKey { get; set; } = string.Empty;

        [JsonProperty(nameof(Required))]
        public bool Required { get; set; }

        [JsonProperty(nameof(DefaultValue))]
        public string? DefaultValue { get; set; }

        [JsonProperty(nameof(IsIdentity))]
        public bool? IsIdentity { get; set; }
    }

    public partial record LogDataSourceRoles
    {
        [JsonProperty(nameof(PrimaryKey))]
        public string PrimaryKey { get; set; } = string.Empty;

        [JsonProperty(nameof(CreatedAt))]
        public string CreatedAt { get; set; } = string.Empty;

        [JsonProperty(nameof(Message))]
        public string Message { get; set; } = string.Empty;

        [JsonProperty(nameof(Properties))]
        public string Properties { get; set; } = string.Empty;

        [JsonProperty(nameof(ServerID))]
        public string ServerID { get; set; } = string.Empty;

        [JsonProperty(nameof(GlobalID))]
        public string GlobalID { get; set; } = string.Empty;

        [JsonProperty(nameof(Environment))]
        public string Environment { get; set; } = string.Empty;

        [JsonProperty(nameof(RunningEnvironment))]
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

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty(nameof(ServiceID))]
        public string ServiceID { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; } = string.Empty;
    }
}
