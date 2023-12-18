using System.Collections.Generic;

namespace HandStack.Web.Entity
{
    public partial class Variable
    {
        public Variable()
        {
            UserID = "";
            UserName = "";
            UserNo = "";
            ClientIP = "";
            Roles = new List<string>();
        }

        public string UserID { get; set; }
        public string UserName { get; set; }
        public string UserNo { get; set; }
        public string ClientIP { get; set; }
        public List<string> Roles { get; set; }
    }

    public partial class Code
    {
        public Code()
        {
            Value = "";
            Name = "";
        }

        public string Value { get; set; }
        public string Name { get; set; }
    }
}
