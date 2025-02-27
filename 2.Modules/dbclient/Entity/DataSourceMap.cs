using System.Collections.Generic;

using HandStack.Data;

namespace dbclient.Entity
{
    public record DataSourceMap
    {
        public string ApplicationID { get; set; }

        public List<string> ProjectListID { get; set; }

        public DataProviders DataProvider { get; set; }

        public string ConnectionString { get; set; }

        // Unspecified: 지정된 것과 다른 격리 수준이 사용되고 있지만, 그 수준을 알 수 없습니다.
        // Chaos: 더 높은 격리 수준의 보류 중인 변경 사항을 덮어쓸 수 없습니다.
        // ReadUncommitted: 더티 리드가 가능하며, 공유 잠금이 발행되지 않고 독점 잠금이 적용되지 않습니다.
        // ReadCommitted (기본값): 더티 리드를 방지하기 위해 데이터가 읽히는 동안 공유 잠금이 유지되지만, 트랜잭션이 끝나기 전에 데이터가 변경될 수 있습니다.
        // RepeatableRead: 쿼리에 사용된 모든 데이터에 잠금이 걸려 다른 사용자가 데이터를 업데이트하지 못하게 합니다.
        // Serializable: 트랜잭션이 완료될 때까지 다른 사용자가 데이터셋에 행을 업데이트하거나 삽입하지 못하도록 범위 잠금이 걸립니다.
        // Snapshot: 데이터를 수정하는 동안 데이터를 읽을 수 있도록 버전 데이터를 저장하여 차단을 줄입니다. 다른 트랜잭션에서 수행된 변경 사항을 다시 쿼리하더라도 볼 수 없음을 나타냅니다.
        public string TransactionIsolationLevel { get; set; }

        public DataSourceMap()
        {
            ApplicationID = "";
            ProjectListID = new List<string>();
            DataProvider = DataProviders.SqlServer;
            ConnectionString = "";
            TransactionIsolationLevel = "ReadCommitted";
        }
    }
}
