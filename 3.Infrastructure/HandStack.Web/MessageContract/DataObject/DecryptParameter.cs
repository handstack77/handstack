using System;

namespace HandStack.Web.MessageContract.DataObject
{
    public class DecryptParameter
    {
        public DecryptParameter()
        {
            ResultSetIndex = "";
            ColumnNames = Array.Empty<string>();
        }

        public string ResultSetIndex { get; set; }

        public string[] ColumnNames { get; set; }
    }
}
