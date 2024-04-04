using System.Collections.Generic;

using HandStack.Web.MessageContract.Enumeration;

namespace HandStack.Web.MessageContract.DataObject
{
    public class QueryObject
    {
        public QueryObject()
        {
            QueryID = "";
            JsonObject = JsonObjectType.FormJson;
            JsonObjects = new List<JsonObjectType>();
            Parameters = new List<DynamicParameter>();
            DecryptParameters = new List<DecryptParameter>();
            BaseFieldMappings = new List<BaseFieldMapping>();
            BaseFieldRelations = new List<BaseFieldRelation?>();
            IgnoreResult = false;
        }

        public string QueryID { get; set; }

        public JsonObjectType JsonObject { get; set; }

        public List<JsonObjectType> JsonObjects { get; set; }

        public List<DynamicParameter> Parameters { get; set; }

        public List<DecryptParameter> DecryptParameters { get; set; }

        public List<BaseFieldMapping> BaseFieldMappings { get; set; }

        public List<BaseFieldRelation?> BaseFieldRelations { get; set; }

        public bool IgnoreResult { get; set; }
    }
}
