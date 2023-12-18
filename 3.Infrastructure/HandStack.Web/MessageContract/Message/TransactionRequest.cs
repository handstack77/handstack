using HandStack.Web.MessageContract.Contract;
using HandStack.Web.Messages;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Message
{
    public partial class TransactionRequest : RequestBase
    {
        [JsonProperty("system")]
        public SystemType System { get; set; }

        [JsonProperty("interface")]
        public InterfaceType Interface { get; set; }

        [JsonProperty("transaction")]
        public TransactionType Transaction { get; set; }

        [JsonProperty("payLoad")]
        public PayLoadType PayLoad { get; set; }

        public TransactionRequest()
        {
            System = new SystemType();
            Interface = new InterfaceType();
            Transaction = new TransactionType();
            PayLoad = new PayLoadType();
        }

        public override bool ValidRequest(RequestBase request, ResponseBase response)
        {
            return true;
        }
    }
}
