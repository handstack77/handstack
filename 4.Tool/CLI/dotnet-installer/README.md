# dotnet-installer

`dotnet-installer`는 게시된 배포 파일을 각 운영체제 설치 파일로 묶어주는 .NET 10 콘솔 프로젝트입니다.

- Windows: Inno Setup 기반 `.exe`
- Ubuntu: Debian `.deb`
- macOS: Apple `.pkg`

`--source` 옵션은 필수이며, 패키징할 publish 폴더 경로를 직접 지정해야 합니다. (`--source "<path>"` 또는 `--source="<path>"`)

## 사전 준비

### Windows에서 `.exe` 설치 파일 만들기

1. .NET SDK 10 설치
```powershell
winget install -e --id Microsoft.DotNet.SDK.10
```
2. .NET 설치 확인
```powershell
dotnet --version
```
3. Inno Setup 6 설치
```powershell
winget install -e --id JRSoftware.InnoSetup
```
4. Inno Setup 설치 확인 (`ISCC.exe` 동작 확인)
```powershell
& "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe" /?
```
5. Windows 패키징 실행
```powershell
dotnet-installer.exe --source "<publish-folder-path>" --targets windows
```
6. `ISCC.exe` 경로를 직접 지정해서 실행 (선택)
```powershell
dotnet-installer.exe --source "<publish-folder-path>" --targets windows --windows-iscc "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
```

### Ubuntu에서 `.deb` 설치 파일 만들기

1. Microsoft 패키지 피드 등록
```bash
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && sudo dpkg -i packages-microsoft-prod.deb && rm packages-microsoft-prod.deb
```
2. 패키지 목록 갱신
```bash
sudo apt update
```
3. .NET SDK 10 설치
```bash
sudo apt install -y dotnet-sdk-10.0
```
4. .NET 설치 확인
```bash
dotnet --version
```
5. `dpkg-deb` 도구 설치
```bash
sudo apt install -y dpkg-dev
```
6. `dpkg-deb` 설치 확인
```bash
dpkg-deb --version
```
7. Ubuntu 패키징 실행
```bash
./dotnet-installer --source "<publish-folder-path>" --targets ubuntu
```

### macOS에서 `.pkg` 설치 파일 만들기

1. Homebrew로 .NET SDK 10 설치
```bash
brew install --cask dotnet-sdk
```
2. .NET 설치 확인
```bash
dotnet --version
```
3. Xcode Command Line Tools 설치 (`pkgbuild` 포함)
```bash
xcode-select --install
```
4. `pkgbuild` 설치 확인
```bash
pkgbuild --version
```
5. macOS 패키징 실행
```bash
./dotnet-installer --source "<publish-folder-path>" --targets macos
```

### 권장 사항: 운영체제별 Publish 산출물 사용

- 가능하면 OS별 런타임으로 각각 publish 후, 해당 publish 폴더를 `--source`로 지정해서 패키징하세요.
- 예시: `win-x64`, `linux-x64`, `osx-x64` 또는 `osx-arm64`

## 빌드

```powershell
$env:DOTNET_CLI_HOME=(Get-Location).Path; $env:DOTNET_CLI_TELEMETRY_OPTOUT='1'; dotnet build .\dotnet-installer\dotnet-installer.csproj
```

## 사용 방법

기본값으로 전체 대상 패키징:

```powershell
dotnet-installer.exe --source "<publish-folder-path>"
```

Windows만 생성:

```powershell
dotnet-installer.exe --source "<publish-folder-path>" --targets windows
```

Ubuntu + macOS만 생성:

```powershell
dotnet-installer.exe --source "<publish-folder-path>" --targets ubuntu,macos
```

소스/출력/버전/앱이름 커스텀:

```powershell
dotnet-installer.exe --source "<publish-folder-path>" --output ".\artifacts" --app-name "my-app" --version "1.0.0"
```

## 참고 사항

- 소스 publish 디렉터리의 파일 구조를 그대로 패키징합니다.
- `--app-name`의 기본값은 `my-app`입니다.
- 생성 결과물은 `artifacts/windows`, `artifacts/ubuntu`, `artifacts/macos` 아래에 저장됩니다.
