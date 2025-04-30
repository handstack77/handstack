# PowerShell 및 Unix/Linux 로그 모니터링 명령어 개발자 가이드

이 가이드는 실시간 로그 파일 모니터링을 위한 PowerShell(Windows) 및 Bash(Unix/Linux) 명령어를 설명합니다.

## PowerShell 명령어 (Windows)

```powershell
Get-Content -Path "$env:HANDSTACK_HOME\log\app$(Get-Date -Format 'yyyyMMdd').log" -Encoding UTF8 -Wait -Tail 300
Get-Content -Path "$env:HANDSTACK_HOME\log\dbclient\module$(Get-Date -Format 'yyyyMMdd').log" -Encoding UTF8 -Wait -Tail 300
Get-Content -Path "$env:HANDSTACK_HOME\log\dbclient\profile$(Get-Date -Format 'yyyyMMdd').log" -Encoding UTF8 -Wait -Tail 300
Get-Content -Path "$env:HANDSTACK_HOME\log\transact\module$(Get-Date -Format 'yyyyMMdd').log" -Encoding UTF8 -Wait -Tail 300
```

### 일반 터미널에서 실행
```batch
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path \"$env:HANDSTACK_HOME\log\app$(Get-Date -Format 'yyyyMMdd').log\" -Encoding UTF8 -Wait -Tail 300"
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path \"$env:HANDSTACK_HOME\log\dbclient\module$(Get-Date -Format 'yyyyMMdd').log\" -Encoding UTF8 -Wait -Tail 300"
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path \"$env:HANDSTACK_HOME\log\dbclient\profile$(Get-Date -Format 'yyyyMMdd').log\" -Encoding UTF8 -Wait -Tail 300"
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path \"$env:HANDSTACK_HOME\log\transact\module$(Get-Date -Format 'yyyyMMdd').log\" -Encoding UTF8 -Wait -Tail 300"
```

### 주요 매개변수 설명

- **-Path**: 읽을 파일 경로
  - `$env:HANDSTACK_HOME`: 환경 변수에서 HANDSTACK_HOME 값을 가져옴
  - `\log\app$(Get-Date -Format 'yyyyMMdd').log`: 현재 날짜를 yyyyMMdd 형식으로 포함한 로그 파일명
- **-Encoding UTF8**: 파일을 UTF-8 인코딩으로 읽음
- **-Wait**: 파일 끝에 도달한 후에도 종료하지 않고 새로운 내용이 추가되면 계속 표시
- **-Tail 300**: 파일의 마지막 300줄부터 읽기 시작

## Unix/Linux 명령어 (Bash)

```bash
tail -n 300 -f "$HANDSTACK_HOME/log/app$(date +%Y%m%d).log"
tail -n 300 -f "$HANDSTACK_HOME/log/dbclient/module$(date +%Y%m%d).log"
tail -n 300 -f "$HANDSTACK_HOME/log/dbclient/profile$(date +%Y%m%d).log"
tail -n 300 -f "$HANDSTACK_HOME/log//transact/module$(date +%Y%m%d).log"
```

### 주요 매개변수 설명

- **-n 300**: 파일의 마지막 300줄부터 출력
- **-f**: (follow) 파일이 업데이트될 때 계속해서 출력 (실시간 모니터링)
- **$HANDSTACK_HOME**: 환경 변수에서 HANDSTACK_HOME 값을 가져옴
- **$(date +%Y%m%d)**: 현재 날짜를 YYYYMMDD 형식으로 추출하여 파일명에 삽입

## 사용 시나리오

- 애플리케이션 로그를 실시간으로 모니터링할 때 사용
- 오늘 날짜로 생성된 로그 파일의 최근 내용만 확인하고 싶을 때
- 로그 파일이 지속적으로 업데이트되는 상황에서 새로운 로그 항목을 실시간으로 확인할 때

## 참고사항

- 두 명령어 모두 환경 변수 `HANDSTACK_HOME`이 올바르게 설정되어 있어야 함
- PowerShell의 경우 `-Wait` 매개변수, Linux의 경우 `-f` 옵션을 통해 실시간 모니터링 기능 제공
- 명령어를 중지하려면 Windows에서는 `Ctrl+C`, Unix/Linux에서도 `Ctrl+C` 사용