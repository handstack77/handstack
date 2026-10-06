using System.Collections.Generic;

namespace dbclient.Entity
{
    public record SQLMapMeta
    {
        public List<StatementMap> Statements = [];
        public Dictionary<string, string> DefinedSQL = [];
        public Dictionary<string, string> ExecuteSQL = [];
        public Dictionary<string, Dictionary<string, object?>?> Parameters = [];
    }
}
