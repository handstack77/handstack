using command.Entity;

using HandStack.Web;
using HandStack.Web.MessageContract.Message;

using Newtonsoft.Json;

namespace command.Extensions
{
    public class CommandLoggerClient
    {
        private readonly Serilog.ILogger logger;
        private readonly Serilog.ILogger? transactionLogger;

        public CommandLoggerClient(Serilog.ILogger logger, Serilog.ILogger? transactionLogger = null)
        {
            this.logger = logger;
            this.transactionLogger = transactionLogger;
        }

        public void DynamicRequestLogging(DynamicRequest request, string acknowledge, string applicationID, System.Action<string>? fallbackFunction = null)
        {
            Write("Request", request.GlobalID, acknowledge, applicationID, JsonConvert.SerializeObject(request), "Execution/Execute");
        }

        public void DynamicResponseLogging(string globalID, string acknowledge, string applicationID, string message, string properties, System.Action<string>? fallbackFunction = null)
        {
            Write("Response", globalID, acknowledge, applicationID, message, properties);
        }

        public void ProgramMessageLogging(string globalID, string acknowledge, string applicationID, string message, string properties, System.Action<string>? fallbackFunction = null)
        {
            Write("Program", globalID, acknowledge, applicationID, message, properties);
        }

        public void TransactionMessageLogging(string globalID, string acknowledge, string applicationID, string projectID, string transactionID, string serviceID, string message, string properties, System.Action<string>? fallbackFunction = null)
        {
            Write("Transaction", globalID, acknowledge, applicationID, message, $"{projectID}|{transactionID}|{serviceID}|{properties}");
        }

        private void Write(string logType, string globalID, string acknowledge, string applicationID, string message, string properties)
        {
            var logData = $"Type: {logType}, GlobalID: {globalID}, Acknowledge: {acknowledge}, ApplicationID: {applicationID}, Properties: {properties}, Message: {message}";
            if (acknowledge == "Y")
            {
                transactionLogger?.Information("[{LogCategory}] " + logData, $"{ModuleConfiguration.ModuleID}/{logType}");
                logger.Information("[{LogCategory}] [{GlobalID}] " + message, $"{ModuleConfiguration.ModuleID}/{logType}", globalID);
            }
            else
            {
                transactionLogger?.Error("[{LogCategory}] " + logData, $"{ModuleConfiguration.ModuleID}/{logType}");
                logger.Error("[{LogCategory}] [{GlobalID}] " + message, $"{ModuleConfiguration.ModuleID}/{logType}", globalID);
            }
        }
    }
}

