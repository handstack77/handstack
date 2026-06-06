using System.Collections.Generic;

namespace HandStack.Web.Entity
{
    public record QueryReport
    {
        public string CommandType { get; set; } = "";

        public string ApplicationID { get; set; } = "";

        public string ProjectID { get; set; } = "";

        public string TransactionID { get; set; } = "";

        public string ServiceID { get; set; } = "";

        public int Seq { get; set; }

        public string Description { get; set; } = "";

        public List<QueryReportParameter> Parameters { get; set; } = new List<QueryReportParameter>();

        public List<string> OutputMetas { get; set; } = new List<string>();
    }

    public record QueryReportParameter
    {
        public string Name { get; set; } = "";

        public object? DefaultValue { get; set; }

        public string DbType { get; set; } = "";

        public int Length { get; set; }

        public bool IsRequired { get; set; }
    }
}
