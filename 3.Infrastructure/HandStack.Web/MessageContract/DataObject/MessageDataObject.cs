using System.Collections.Generic;

namespace HandStack.Web.MessageContract.DataObject
{
    public class MessageDataObject
    {
        public MessageDataObject()
        {
            ResponseCode = "";
            ResultType = "";
            Message = "";
            Additional = [];
        }

        public string ResponseCode;

        public string ResultType;

        public string Message;

        public List<string> Additional;
    }
}
