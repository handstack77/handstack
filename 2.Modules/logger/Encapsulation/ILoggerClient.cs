using System.Data;
using System.Threading.Tasks;

using HandStack.Web.MessageContract.Message;

namespace logger.Encapsulation
{
    public interface ILoggerClient
    {
        Task InsertWithPolicy(LogMessage logMessage);

        Task<DataSet?> LogList(string applicationID, string? serverID, string? globalID, string? environment, string? projectID, string? serviceID, string? transactionID, string? startedAt, string? endedAt);

        Task<DataSet?> LogDetail(string applicationID, string logNo);

        Task Delete();
    }
}
