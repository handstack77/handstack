# 테스트 프로젝트 검증 결과

2026-10-26 Windows x64, .NET SDK 10.0.402에서 검증했습니다. 현재 테스트 프로젝트는 호스트 5개, 모듈 10개, 인프라 3개로 총 18개이며 솔루션 폴더와 실제 디스크 구조를 일치시켰습니다.

## Debug 전체 실행

`./5.Test/Test.ps1`로 프로젝트 18개를 순서대로 빌드·실행해 통과 67개, 실패 0개, 건너뜀 0개를 확인했습니다. 솔루션·실행 목록과 테스트 프로젝트의 경로를 대조하고, 공용 연동 소스와 인프라 DLL의 해시가 작업 전과 같은 것도 확인했습니다. 연계 문서의 TypeScript 검사와 전체 사이트 빌드를 통과했습니다.

| 테스트 프로젝트 | 통과 | 실패 | 건너뜀 |
|---|---|---|---|
| Ack.Tests | 4 | 0 | 0 |
| Agent.Tests | 7 | 0 | 0 |
| Command.Tests | 2 | 0 | 0 |
| Core.Tests | 4 | 0 | 0 |
| Data.Tests | 2 | 0 | 0 |
| DbClient.Tests | 2 | 0 | 0 |
| Deploy.Tests | 4 | 0 | 0 |
| Forbes.Tests | 2 | 0 | 0 |
| Forwarder.Tests | 3 | 0 | 0 |
| Function.Tests | 3 | 0 | 0 |
| GraphClient.Tests | 5 | 0 | 0 |
| Logger.Tests | 2 | 0 | 0 |
| Prompter.Tests | 8 | 0 | 0 |
| Rdy.Tests | 4 | 0 | 0 |
| Repository.Tests | 2 | 0 | 0 |
| Transact.Tests | 7 | 0 | 0 |
| Web.Tests | 2 | 0 | 0 |
| Wwwroot.Tests | 4 | 0 | 0 |

## 테스트별 임시 디렉터리 통합 검증

Deploy·Forbes·Command·Repository·Web 테스트 클래스 내부에 기존 임시 디렉터리 구현을 비공개 중첩 클래스로 통합했습니다. 공용 파일과 Directory.Build.props의 링크를 제거한 뒤 전체 18개 프로젝트를 다시 실행해 통과 67개, 실패·건너뜀 0개를 확인했습니다. 기존 테스트 검증문과 경로 확인·정리 코드는 그대로 유지했습니다. 인프라 Assemblies의 작업 전후 해시도 동일합니다.

TRX 결과는 임시 디렉터리 `handstack-tests-776ff09756e642d9b47adb58130f3bb1`에 보존했습니다. 연계 테스트 실행 가이드의 Shared 설명을 갱신하고 TypeScript 검사와 문서 사이트 빌드도 통과했습니다.

## 구조와 참조

`Directory.Build.props`는 `5.Test` 바로 아래에 유지합니다. 임시 디렉터리 생성·정리는 사용하는 테스트 클래스 내부의 비공개 `TestDirectory`가 담당합니다. `Test.ps1`은 세 분류 폴더 아래의 프로젝트를 탐색합니다. 테스트 프로젝트는 배포 목록에 포함하지 않습니다.

## 범위와 제한

외부 DB별 업무·그래프 서버·LLM·클라우드 저장소·운영 배포는 기본 테스트에서 실행하지 않습니다. SQLite와 파일 감시는 테스트가 소유한 로컬 자원만 사용합니다. 프로젝트별 범위는 [README.md](README.md)를 참고합니다.
