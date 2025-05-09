using System.Collections.Generic;

using HandStack.Data;

namespace openapi.Enumeration
{
    public static class DataProvidersExtensions
    {
        private static readonly Dictionary<DataProviders, string> BaseTransactions = new Dictionary<DataProviders, string>
        {
            { DataProviders.SqlServer, "SQS010" },
            { DataProviders.Oracle, "ORA010" },
            { DataProviders.MySQL, "MYS010" },
            { DataProviders.PostgreSQL, "PGS010" },
            { DataProviders.SQLite, "SLT010" }
        };

        public static string ToEnumString(this DataProviders key, string category = "base")
        {
            var result = string.Empty;
            switch (category)
            {
                default:
                    result = BaseTransactions[key];
                    break;
            }

            return result;
        }
    }
}
