using System.Collections.Generic;

namespace wwwroot.Entity
{
    // module.json ModuleConfig.SharedFileConfigPath가 가리키는 "공통 파일 관리" 정보 파일(예: qcn.winform shared_files.json)의 스키마.
    public class SharedFileCatalog
    {
        public List<SharedFileEntry> Items { get; set; }

        public SharedFileCatalog()
        {
            Items = new List<SharedFileEntry>();
        }
    }

    public class SharedFileEntry
    {
        // 웹 브라우저에서 요청하는 절대경로 또는 상대경로 (예: /assets/common.css)
        public string RequestPath { get; set; }

        // 실제 서빙할 호스트 파일 경로. 절대경로 또는 모듈 기준 상대경로를 사용할 수 있다.
        public string HostFilePath { get; set; }

        public SharedFileEntry()
        {
            RequestPath = "";
            HostFilePath = "";
        }
    }
}
