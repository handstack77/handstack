# bundling CLI

`bundling`은 HandStack 화면 리소스(`.html`, `.js`, `.css`)를 압축/정리/병합하는 .NET 10 기반 CLI 도구입니다.

## 주요 기능

- 단일 파일 압축: `compress`
- 디렉터리 전체 압축: `compresspath`
- `.min.*` 파일을 원본 이름으로 적용: `minify`, `minifypath`
- 코드 정렬(Pretty): `beautifyfile`, `beautifypath`
- Base64 번들 정의로 파일 병합: `merge`
- `bundleconfig.json` 기반 번들 처리: `artifact`

## 사전 조건

- .NET SDK 10.0+
- NuGet 패키지 복원 가능 환경
- `3.Infrastructure/Assemblies/<Configuration>/HandStack.Core.dll` 존재

## 빌드

```powershell
dotnet build .\bundling\bundling.csproj
```

## 실행

```powershell
dotnet run --project .\bundling -- <command> [options]
```

실행 파일로 배포된 경우:

```powershell
bundling <command> [options]
```

## 명령어

| 명령어 | 설명 | 주요 옵션 |
| --- | --- | --- |
| `compress` | 단일 파일 압축 | `--file`, `--keep`, `--passmin` |
| `compresspath` | 디렉터리(하위 포함) 압축 | `--path`, `--keep`, `--passmin`, `--excludes` |
| `minify` | `.min.*` 파일을 원본 이름으로 치환 | `--file`, `--keep` |
| `minifypath` | 디렉터리 내 `.min.*` 일괄 치환 | `--path`, `--keep` |
| `beautifyfile` | 단일 파일 정렬 | `--file` |
| `beautifypath` | 디렉터리 내 파일 정렬 | `--path` |
| `merge` | Base64 인코딩 번들 정의를 읽어 병합 | `--bundle` |
| `artifact` | `bundleconfig.json` 기반 번들링 | `--artifactFile` |

공통 옵션:

- `--debug`: 시작 시 디버거 연결 대기(약 10초)

## 옵션 상세

- `--file`: 대상 파일 전체 경로
- `--path`: 대상 디렉터리 전체 경로
- `--keep`: 원본 보존 여부 (`true`면 `.src.*` 백업 생성)
- `--passmin`: `compress*`에서 `.min.*` 파일 건너뛰기 (기본 `true`)
- `--excludes`: `compresspath` 제외 하위 경로 목록 (`|` 구분)
- `--bundle`: 아래 JSON을 Base64로 인코딩한 문자열
- `--artifactFile`: `bundleconfig.json` 파일 경로

`--bundle` JSON 예시:

```json
{
  "fileType": "js",
  "inputFileNames": [
    "C:/src/a.js",
    "C:/src/b.js"
  ],
  "outputFileName": "C:/dist/app.bundle.js"
}
```

## 실행 예시

```powershell
bundling compress --file=sample/BOD/BOD010.html --keep=true
bundling compresspath --path=sample/BOD --keep=true --excludes=node_modules|dist
bundling minify --file=sample/BOD/BOD010.min.js --keep=true
bundling beautifypath --path=sample
bundling artifact --artifactFile=sample/bundleconfig.json
```

`merge`용 Base64 생성 예시(Windows PowerShell):

```powershell
$json = '{"fileType":"js","inputFileNames":["C:/src/a.js","C:/src/b.js"],"outputFileName":"C:/dist/app.bundle.js"}'
$bundle = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
bundling merge --bundle=$bundle
```

## 로그

`bundling/appsettings.json`의 Serilog 설정을 따르며 기본 파일 로그는 `../log/app.log`입니다.
