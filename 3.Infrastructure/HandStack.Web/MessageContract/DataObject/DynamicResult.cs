using Dapper;

namespace HandStack.Web.MessageContract.DataObject
{
    public class DynamicResult
    {
        public DynamicResult()
        {
            ParseSQL = "";
            DynamicParameters = null;
            ExceptionText = null;
        }

        public string ParseSQL { get; set; }

        public DynamicParameters? DynamicParameters { get; set; }

        public string? ExceptionText { get; set; }
    }
}
