using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

using HandStack.Web.MessageContract.Message;

namespace logger.Encapsulation
{
    public interface ILoggerClient
    {
        Task<bool> InsertWithPolicy(LogMessage logMessage, IReadOnlyDictionary<string, object?>? extraPayload = null);

        Task<DataSet?> LogList(string applicationID, string? serverID, string? globalID, string? environment, string? projectID, string? serviceID, string? transactionID, string? startedAt, string? endedAt);

        Task<DataSet?> LogDetail(string applicationID, string logNo);

        Task Delete();
    }
}
