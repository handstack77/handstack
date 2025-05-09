using HandStack.Web.MessageContract.Contract;
using HandStack.Web.Messages;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Message
{
    public partial class TransactionResponse : ResponseBase
    {
        [JsonProperty("system")]
        public SystemType System { get; set; }

        [JsonProperty("transaction")]
        public TransactionType Transaction { get; set; }

        [JsonProperty("message")]
        public MessageType Message { get; set; }

        [JsonProperty("result")]
        public ResultType Result { get; set; }

        public TransactionResponse()
        {
            System = new SystemType();
            Transaction = new TransactionType();
            Message = new MessageType();
            Result = new ResultType();
        }
    }
}
