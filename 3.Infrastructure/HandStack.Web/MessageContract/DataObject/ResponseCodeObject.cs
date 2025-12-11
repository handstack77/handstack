using System.Collections.Generic;
using System.Data;

namespace HandStack.Web.MessageContract.DataObject
{
    public class ResponseCodeObject
    {
        public ResponseCodeObject()
        {
            Comment = "";
            CodeColumnID = "";
            ValueColumnID = "";
            CreatedAt = "";
            Scheme = new List<Scheme>();
            DataSource = null;
        }

        public string Comment { get; set; }

        public string CodeColumnID { get; set; }

        public string ValueColumnID { get; set; }

        public string CreatedAt { get; set; }

        public List<Scheme> Scheme { get; set; }

        public DataTable? DataSource { get; set; }
    }

    public class Scheme
    {
        public Scheme()
        {
            ColumnID = "";
            ColumnText = "";
            ColumnType = "";
            HiddenYN = false;
        }

        public string ColumnID { get; set; }

        public string ColumnText { get; set; }

        public string ColumnType { get; set; }

        public bool HiddenYN { get; set; }
    }
}
