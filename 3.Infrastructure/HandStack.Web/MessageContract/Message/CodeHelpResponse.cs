using System.Data;

namespace HandStack.Web.MessageContract.Message
{
    public class CodeHelpResponse
    {
        public CodeHelpResponse()
        {
            ResultDataSet = null;
            ResultJson = "";
        }

        public DataSet? ResultDataSet { get; set; }

        public string ResultJson { get; set; }
    }
}
