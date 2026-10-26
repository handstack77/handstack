using HandStack.Web.MessageContract.DataObject;

namespace HandStack.Web.Extensions
{
    // 실행 모듈은 현재 설정과 로딩한 계약을 제공하고 공통 필터가 위임 검증을 담당한다.
    public interface IMcpDelegationContext
    {
        McpDelegationOptions Options { get; }

        BusinessContract? GetBusinessContract(string applicationID, string projectID, string transactionID);
    }
}
