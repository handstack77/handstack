using System.Collections.Generic;

namespace HandStack.Web.MessageContract.DataObject
{
    public class CodeHelpObject
    {
        public CodeHelpObject()
        {
            QueryID = "";
            NameValues = "";
            DecryptParameters = [];
        }

        public string QueryID;

        public string NameValues;

        public List<DecryptParameter> DecryptParameters;
    }
}
