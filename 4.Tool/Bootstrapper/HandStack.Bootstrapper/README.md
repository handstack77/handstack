# HandStack.Bootstrapper

HandStack 개발 환경을 준비하기 위한, Windows / macOS / Ubuntu에서 실행 가능한 크로스 플랫폼
부트스트래퍼입니다. 한 번 실행으로 다음을 조용한 모드(silent)로 설치합니다:

1. **.NET SDK 10** — **버전은 반드시 10이어야 합니다.** Microsoft 공식 `dotnet-install` 스크립트로
   `10.0` 채널에 고정해서 설치하며, 다른 메이저 버전(8, 9, 11...)은 설치 대상이 아닙니다.
2. **Node.js LTS**
3. **PowerShell** (크로스 플랫폼 `pwsh`)
4. **git**
5. **curl**
6. **gulp-cli** (`npm install -g gulp-cli`)
7. **Microsoft.Web.LibraryManager.Cli** (`dotnet tool install --global Microsoft.Web.LibraryManager.Cli`)

일반적인 .NET 콘솔 앱이며, **[Velopack](https://velopack.io)**으로 패키징/배포하여 OS별로 단일
설치 파일(설치 프로그램 + 업데이트)로 배포할 수 있습니다.

## 빠른 가이드 (Quick Guide)

대상 머신(도구를 설치할 실제 PC)에는 **.NET이 미리 설치되어 있을 필요가 없습니다.**
self-contained로 게시(publish)한 실행 파일 하나만 있으면 그 자체로 실행되고, 실행 즉시
".NET SDK 10 → Node.js LTS → PowerShell → git → curl → gulp-cli → libman" 순서로 필요한
것만 골라 조용히 설치합니다.

### 1단계 — 실행 파일 만들기 (.NET SDK가 있는 빌드 머신에서, OS별로 1회)

OS별 **게시 프로필**(`src/Properties/PublishProfiles/*.pubxml`)이 이미
self-contained + 단일 파일(`PublishSingleFile`) 설정을 담고 있으므로, `-p:PublishProfile=<프로필명>`만
지정하면 됩니다.

```powershell
# Windows 빌드 머신
dotnet publish src/HandStack.Bootstrapper.csproj -c Release -p:PublishProfile=win-x64 -o out/win-x64
```

```bash
# macOS 빌드 머신 (Apple Silicon)
dotnet publish src/HandStack.Bootstrapper.csproj -c Release -p:PublishProfile=osx-arm64 -o out/osx-arm64
# 인텔 맥이라면 osx-x64 프로필 사용
dotnet publish src/HandStack.Bootstrapper.csproj -c Release -p:PublishProfile=osx-x64 -o out/osx-x64
```

```bash
# Ubuntu 빌드 머신
dotnet publish src/HandStack.Bootstrapper.csproj -c Release -p:PublishProfile=linux-x64 -o out/linux-x64
```

각 명령이 만든 `out/<rid>/` 폴더(특히 `HandStack.Bootstrapper`/`HandStack.Bootstrapper.exe`, 그리고
디버그 심볼 `.pdb`)를 대상 머신에 그대로 복사하면 됩니다. `.pdb`는 실행에 필요 없으므로 제외해도
됩니다. 설치 프로그램/자동 업데이트까지 갖춘 배포판이 필요하면 아래
["Velopack으로 릴리스 패키징하기"](#velopack으로-릴리스-패키징하기)를 참고하세요.

### 2단계 — 대상 머신에서 한 번에 설치하기

| OS | 실행 명령 (한 줄) | 비고 |
|---|---|---|
| Windows | 일반 PowerShell/cmd 또는 탐색기에서 `.\HandStack.Bootstrapper.exe` | 관리자 권한이 아니면 UAC 승인 창을 띄워 자동으로 재실행 |
| macOS | `chmod +x ./HandStack.Bootstrapper && ./HandStack.Bootstrapper` | 일반 사용자로 실행 (root 금지) |
| Ubuntu | `chmod +x ./HandStack.Bootstrapper && ./HandStack.Bootstrapper` | root가 아니면 `sudo`로 자동 재실행(같은 터미널에서 비밀번호 입력) |

한 번 실행으로 전 과정이 끝나며, 이미 설치되어 있는 항목은 자동으로 건너뜁니다(아래
["이미 설치되어 있으면 건너뜁니다"](#동작-방식) 참고). 재실행해도 안전합니다(idempotent).

> 개발 중 빠르게 테스트해 보고 싶고 빌드 머신에 이미 .NET SDK(8 이상)가 있다면, 게시 없이
> [`dotnet run`](#로컬에서-빌드--실행-패키징-없이)으로 바로 실행할 수도 있습니다.

## 동작 방식

| OS      | .NET SDK 10             | Node.js LTS                            | PowerShell                      | git                | curl               |
|---------|--------------------------|------------------------------------------|-----------------------------------|---------------------|----------------------|
| Windows | `dotnet-install.ps1`     | `winget install OpenJS.NodeJS.LTS`      | `winget install Microsoft.PowerShell` | `winget install Git.Git` | `winget install cURL.cURL` |
| macOS   | `dotnet-install.sh`      | `brew install node`                      | `aka.ms/install-powershell.sh`   | `brew install git`  | `brew install curl`  |
| Ubuntu  | `dotnet-install.sh`      | NodeSource `setup_lts.x` + `apt-get`    | `aka.ms/install-powershell.sh`   | `apt-get install git` | `apt-get install curl` |

`gulp-cli`와 `Microsoft.Web.LibraryManager.Cli`는 OS별 패키지 매니저가 필요 없이 (Node.js/.NET SDK가
이미 설치되어 있다는 전제로) `npm`과 `dotnet tool`을 그대로 사용하므로 세 OS에서 동일하게 동작합니다.

모든 설치는 조용한 모드/비대화형 옵션(`--silent`, `DEBIAN_FRONTEND=noninteractive`,
`NONINTERACTIVE=1` 등)으로 실행됩니다 — 프롬프트나 UI가 뜨지 않습니다.

**이미 설치되어 있으면 건너뜁니다.** 각 구성 요소를 설치하기 전에 먼저 존재 여부를 확인합니다.

- .NET SDK: `dotnet --list-sdks` 결과에 `10.0.`으로 시작하는 **정식(GA) 버전**이 있으면 건너뜁니다.
  `10.0.100-rc.2.xxx`처럼 `-`가 붙은 프리뷰/RC 빌드는 버전 10이 정식 설치된 것으로 간주하지
  않으므로, 프리뷰만 설치된 상태라면 정식 버전을 다시(추가로) 설치합니다.
- Node.js: `node --version`이 성공하면 건너뜁니다. (버전이 실제로 LTS 라인인지까지는 확인하지
  않고, node 명령이 존재하는지만 확인합니다.)
- PowerShell: `pwsh --version`이 성공하면 건너뜁니다. (Windows에 기본 내장된 Windows PowerShell
  `powershell.exe`가 아니라, 설치 대상인 PowerShell 7+ `pwsh`를 기준으로 확인합니다.)
- git / curl: 각각 `git --version`, `curl --version`이 성공하면 건너뜁니다. (curl은 최신 Windows에
  기본 내장되어 있어 대부분 바로 건너뛰게 됩니다.)
- gulp-cli / libman: 각각 `gulp --version`, `libman --version`이 성공하면 건너뜁니다.

**같은 실행 안에서 방금 설치한 도구를 바로 이어서 사용합니다.** winget/`dotnet-install` 스크립트가
PATH를 갱신해도 이미 실행 중인 프로세스에는 자동 반영되지 않으므로, Windows에서는 각 설치 직후
현재 프로세스의 PATH를 레지스트리 기준으로 새로고침합니다(`WindowsPath.cs`). 그렇지 않으면 예를
들어 Node.js를 방금 설치한 직후 이어지는 `gulp-cli`(npm) 설치 단계가 `npm`을 찾지 못해 실패할 수
있습니다. 또한 npm이 만드는 `gulp` 같은 명령은 Windows에서 `.cmd` 셸 스크립트로 설치되어 프로세스를
직접 실행할 수 없으므로, 해당 확인/실행은 `cmd.exe`를 거칩니다.

**관리자/루트 권한이 필요합니다:**
- Windows: 별도 조치가 필요 없습니다. 관리자 권한이 아닌 상태로 실행하면 UAC 승인 창을 띄워
  자기 자신을 관리자 권한으로 자동 재실행합니다(원래 창은 조용히 종료). 이 자동 재실행은 게시된
  self-contained 단일 실행 파일에서만 동작하며, `dotnet run`처럼 dotnet 호스트로 실행 중이면
  (재실행 대상을 특정할 수 없어) 동작하지 않으므로 그 경우 관리자 권한 셸에서 직접 실행하세요.
  또한 UAC 승인 창에서 취소하면 그대로 오류로 종료됩니다.
- Ubuntu: 별도 조치가 필요 없습니다. root가 아닌 상태로 실행하면 자기 자신을 `sudo <실행 파일>`로
  다시 실행합니다 — 표준 입출력을 그대로 물려주므로 sudo의 비밀번호 프롬프트가 지금과 같은
  터미널에 표시됩니다(GUI 대화상자가 아닙니다). 물론 `sudo ./HandStack.Bootstrapper`로 처음부터
  root로 실행해도 그대로 동작합니다. 이 자동 재실행은 게시된 self-contained 단일 실행 파일에서만
  동작하며, `dotnet run`처럼 dotnet 호스트로 실행 중이거나 `sudo`가 설치되어 있지 않으면 동작하지
  않으므로 그 경우 `sudo ./HandStack.Bootstrapper`로 직접 다시 실행하세요.
- macOS: 일반 사용자 권한으로 실행하세요 (Homebrew는 root 실행을 거부합니다). .NET SDK 설치
  단계에서만 내부적으로 `sudo`로 권한을 상승시키므로, 그때 비밀번호를 물어볼 수 있습니다.

> winget 패키지 ID, apt 패키지명, 스크립트 URL 등은 시간이 지나면서 바뀔 수 있습니다. 어떤 단계가
> 실패하기 시작하면 `winget search <이름>`, `brew search <이름>` 또는 최신 NodeSource/Microsoft
> 문서를 확인한 뒤 `src/Platform/` 아래 해당 파일을 수정하세요.

## 프로젝트 구조

```
src/
  HandStack.Bootstrapper.csproj
  Program.cs                 진입점 — 8단계 설치를 순서대로 조율
  ProcessRunner.cs             외부 프로세스 실행/출력 스트리밍 헬퍼
  Properties/
    PublishProfiles/
      win-x64.pubxml           Windows용 게시 프로필 (self-contained, 단일 파일)
      osx-x64.pubxml            macOS(Intel)용 게시 프로필 (self-contained, 단일 파일)
      osx-arm64.pubxml           macOS(Apple Silicon)용 게시 프로필 (self-contained, 단일 파일)
      linux-x64.pubxml            Ubuntu용 게시 프로필 (self-contained, 단일 파일)
  Platform/
    IPlatformInstaller.cs      OS별 설치 전략 인터페이스
    WindowsInstaller.cs
    MacInstaller.cs
    LinuxInstaller.cs
    DotNetInstallHelper.cs     dotnet-install.ps1/.sh 공용 로직
    InstallChecks.cs           "이미 설치되어 있는지" 확인하는 공용 로직
    AdditionalTools.cs         gulp-cli / libman (npm, dotnet tool 기반) 설치 로직
    WindowsPath.cs              같은 프로세스 안에서 방금 설치한 도구를 찾도록 PATH 보정 (Windows 전용)
build/
  pack-windows.ps1             win-x64용 게시(publish) + `vpk pack`
  pack-macos.sh                 osx-arm64/x64용 게시 + `vpk pack`
  pack-linux.sh                  linux-x64용 게시 + `vpk pack`
```

## 로컬에서 빌드 & 실행 (패키징 없이)

```powershell
dotnet run --project src/HandStack.Bootstrapper.csproj
```

## Velopack으로 릴리스 패키징하기

Velopack 빌드는 대상 OS에서 직접 만들어야 합니다(하나의 크로스 컴파일 단계로 처리되지 않음).
그러므로 각 플랫폼에서 해당 스크립트를 실행하세요.

1. 각 머신에 Velopack CLI를 한 번 설치합니다:
   ```
   dotnet tool install -g vpk
   ```
2. Windows (관리자 권한 PowerShell):
   ```powershell
   pwsh
   .\build\pack-windows.ps1 -Version 1.0.0
   ```
3. macOS:
   ```bash
   ./build/pack-macos.sh 1.0.0
   ```
4. Ubuntu:
   ```bash
   ./build/pack-linux.sh 1.0.0
   ```

각 스크립트는 해당 OS의 게시 프로필(`-p:PublishProfile=<rid>`)로 `dotnet publish`를 실행해
self-contained 단일 파일 빌드를 만든 뒤, `vpk pack`에 전달하여 Velopack 릴리스(설치 파일 + 업데이트
피드)를 `releases/<rid>/` 아래에 생성합니다.

`vpk`의 정확한 플래그 이름은 Velopack 버전에 따라 바뀌어 왔습니다. 스크립트가 알 수 없는
플래그 오류를 내면, 설치된 버전 기준으로 `vpk pack --help`를 실행해 확인 후 스크립트를
조정하세요.

## 커스터마이징

- **.NET SDK 버전**: 이 프로젝트는 ".NET SDK는 버전 10이어야 한다"는 요구사항에 따라
  `Program.cs`의 `DotNetChannel = "10.0"`으로 고정되어 있습니다. 특정 패치 버전(예: 최신 대신
  `10.0.100`)으로 더 좁혀야 한다면 이 값을 수정하되, 메이저 버전 10 자체를 벗어나지 않도록 하세요.
- **구성 요소 제외/추가**: `Program.cs`의 8단계 시퀀스와 각 `*Installer.cs`/`AdditionalTools.cs`의
  대응 메서드를 수정하세요.
- **조용한 설치 플래그 조정**: 각 플랫폼 설치기(installer)의 설치 메서드가 패키지 매니저별
  플래그를 조정하는 유일한 위치입니다.
- **게시(단일 파일/self-contained) 설정 변경**: `src/Properties/PublishProfiles/`
  아래 OS별 `.pubxml` 파일에서 `PublishSingleFile`, `SelfContained`, `PublishTrimmed` 등을
  조정하세요. Visual Studio의 "게시(Publish)" 대화상자에도 이 프로필들이 그대로 나타납니다.
