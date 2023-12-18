using HandStack.Core.ExtensionMethod;
using HandStack.Web.MessageContract.Message;

using MediatR;

namespace logger.Events
{
    public class LoggerRequest : INotification
    {
        public long LogNo { get; set; }

        public string ServerID { get; set; }

        public string RunningEnvironment { get; set; }

        public string ProgramName { get; set; }

        public string GlobalID { get; set; }

        public string Acknowledge { get; set; }

        public string ApplicationID { get; set; }

        public string ProjectID { get; set; }

        public string TransactionID { get; set; }

        public string ServiceID { get; set; }

        public string Type { get; set; }

        public string Flow { get; set; }

        public string Level { get; set; }

        public string Format { get; set; }

        public string Message { get; set; }

        public string Properties { get; set; }

        public string UserID { get; set; }

        public string CreatedAt { get; set; }

        public string StartedAt { get; set; }

        public string EndedAt { get; set; }

        public LoggerRequest(MediatorRequest request)
        {
            LogNo = request.Parameters.Get<long>("LogNo");
            ServerID = request.Parameters.Get<string>("ServerID").ToStringSafe();
            RunningEnvironment = request.Parameters.Get<string>("RunningEnvironment").ToStringSafe();
            ProgramName = request.Parameters.Get<string>("ProgramName").ToStringSafe();
            GlobalID = request.Parameters.Get<string>("GlobalID").ToStringSafe();
            Acknowledge = request.Parameters.Get<string>("Acknowledge").ToStringSafe();
            ApplicationID = request.Parameters.Get<string>("ApplicationID").ToStringSafe();
            ProjectID = request.Parameters.Get<string>("ProjectID").ToStringSafe();
            TransactionID = request.Parameters.Get<string>("TransactionID").ToStringSafe();
            ServiceID = request.Parameters.Get<string>("ServiceID").ToStringSafe();
            Type = request.Parameters.Get<string>("Type").ToStringSafe();
            Flow = request.Parameters.Get<string>("Flow").ToStringSafe();
            Level = request.Parameters.Get<string>("Level").ToStringSafe();
            Format = request.Parameters.Get<string>("Format").ToStringSafe();
            Message = request.Parameters.Get<string>("Message").ToStringSafe();
            Properties = request.Parameters.Get<string>("Properties").ToStringSafe();
            UserID = request.Parameters.Get<string>("UserID").ToStringSafe();
            CreatedAt = request.Parameters.Get<string>("CreatedAt").ToStringSafe();
            StartedAt = request.Parameters.Get<string>("StartedAt").ToStringSafe();
            EndedAt = request.Parameters.Get<string>("EndedAt").ToStringSafe();
        }
    }
}
