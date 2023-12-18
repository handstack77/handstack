using System.Collections.Generic;

namespace HandStack.Web.MessageContract.DataObject
{
    public class CodeHelpObject
    {
        public CodeHelpObject()
        {
            QueryID = "";
            NameValues = "";
            DecryptParameters = new List<DecryptParameter>();
        }

        public string QueryID;

        public string NameValues;

        public List<DecryptParameter> DecryptParameters;
    }
}
