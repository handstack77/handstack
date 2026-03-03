# dotnet-installer

`dotnet-installer`는 publish 산출물을 설치 패키지로 변환하는 .NET 10 콘솔 도구입니다.

생성 대상:

- Windows: `.exe` (Inno Setup)
- Ubuntu: `.deb` (`dpkg-deb`)
- macOS: `.pkg` (`pkgbuild`)

## 사전 조건

공통:

- .NET SDK 10.0+

대상별 추가:

- Windows 패키징: Inno Setup (`ISCC.exe`)
- Ubuntu 패키징: `dpkg-deb` (`dpkg-dev` 패키지)
- macOS 패키징: `pkgbuild` (Xcode Command Line Tools)

### Windows에서 `.exe` 설치 파일 만들기

Inno Setup  설치
```powershell
winget install -e --id JRSoftware.InnoSetup
```
Inno Setup 설치 확인 (`ISCC.exe` 동작 확인)
```powershell
& "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe" /?

## 빌드

```powershell
dotnet build .\dotnet-installer\dotnet-installer.csproj
```

## 실행

```powershell
dotnet run --project .\dotnet-installer -- [options]
```

또는 빌드 산출물 직접 실행:

```powershell
.\dotnet-installer\bin\Debug\net10.0\dotnet-installer.exe [options]
```

## 옵션

- `--source <path>`: 게시(publish) 폴더 경로 (필수)
- `--output <path>`: 출력 폴더 (기본 `./artifacts`)
- `--app-name <name>`: 앱 이름 (기본 `my-app`)
- `--version <version>`: 패키지 버전 (기본 UTC 타임스탬프)
- `--publisher <name>`: 게시자 (기본 `HandStack`)
- `--maintainer <name>`: Debian Maintainer (기본 `HandStack`)
- `--description <text>`: 패키지 설명
- `--entry-exe <file>`: Windows 시작 EXE 파일명
- `--entry-command <cmd>`: Linux `.desktop` 실행 명령
- `--windows-iscc <path>`: `ISCC.exe` 전체 경로
- `--targets <list>`: `windows,ubuntu,macos,all` (기본 `all`)
- `--verbose`: 하위 프로세스 stdout/stderr 출력
- `-h`, `--help`: 도움말

## 실행 예시

```powershell
# 전체 대상
.\dotnet-installer\bin\Debug\net10.0\dotnet-installer.exe --source C:/publish/myapp

# Windows만
.\dotnet-installer\bin\Debug\net10.0\dotnet-installer.exe --source C:/publish/myapp --targets windows

# Ubuntu + macOS
.\dotnet-installer\bin\Debug\net10.0\dotnet-installer.exe --source C:/publish/myapp --targets ubuntu,macos

# 출력/버전/이름 지정
.\dotnet-installer\bin\Debug\net10.0\dotnet-installer.exe --source C:/publish/myapp --output C:/artifacts --app-name handstack-app --version 1.2.3

# Inno Setup 경로 직접 지정
.\dotnet-installer\bin\Debug\net10.0\dotnet-installer.exe --source C:/publish/myapp --targets windows --windows-iscc "C:/Program Files (x86)/Inno Setup 6/ISCC.exe"
```

## 출력 경로

기본 출력 루트는 `./artifacts`이며, 대상별 하위 폴더를 생성합니다.

- `artifacts/windows/*.exe`
- `artifacts/ubuntu/*.deb`
- `artifacts/macos/*.pkg`

## 운영 팁

- OS별 publish 산출물을 먼저 만든 뒤 해당 폴더를 `--source`로 지정하는 방식을 권장합니다.
- Windows/Ubuntu/macOS 패키징은 각 도구(`ISCC`, `dpkg-deb`, `pkgbuild`)가 실행 가능한 환경에서 수행해야 합니다.
