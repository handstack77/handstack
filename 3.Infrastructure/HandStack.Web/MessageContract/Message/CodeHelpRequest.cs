using System.Collections.Generic;

using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;

namespace HandStack.Web.MessageContract.Message
{
    public class CodeHelpRequest
    {
        public CodeHelpRequest()
        {
            ReturnType = ExecuteCodeHelpTypeObject.Json;
            DataSourceID = "";
            GlobalID = "";
            BusinessID = "";
            ApplicationID = "";
            LocaleID = "";
            IsFmtOnly = false;
            CodeHelpObjects = new List<CodeHelpObject>();
        }

        public ExecuteCodeHelpTypeObject ReturnType { get; set; }

        public string DataSourceID { get; set; }

        public string GlobalID { get; set; }

        public string BusinessID { get; set; }

        public string ApplicationID { get; set; }

        public string LocaleID { get; set; }

        public bool IsFmtOnly { get; set; }

        public List<CodeHelpObject> CodeHelpObjects { get; set; }
    }
}
