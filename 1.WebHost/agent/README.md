# handstack-agent

`handstack-agent`는 호스트 서버에서 여러 `ack` 프로세스를 제어하기 위한 관리 API 서버입니다.

## 공개 API

아래 항목은 현재 코드에서 외부에 노출되는 모든 Controller API입니다.

### 기본 상태 / 사용자 인증

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/` | 없음 | 에이전트 상태 확인용 헬스 체크입니다. `name`, `now`, `status`를 반환합니다. |
| `GET` | `/validate/{key}` | 없음 | 전달한 관리 키 문자열을 검증합니다. `valid`, `header`를 반환합니다. |
| `POST` | `/auth/login` | 없음 | `Users` 섹션의 `EmailID`, `Password`로 로그인합니다. 성공 시 `handstack-agent-auth` 쿠키를 발급합니다. |
| `GET` | `/auth/me` | 인증 쿠키 | 현재 로그인 사용자 정보와 역할을 반환합니다. |
| `POST` | `/auth/logout` | 인증 쿠키 | 로그인 쿠키를 제거합니다. |

### 관리 API (`Agent:ManagementHeaderName`, 기본 `X-Management-Key`)

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/targets` | 관리 대상 프로세스 목록을 반환합니다. |
| `GET` | `/targets/{targetAckId}/status` | 대상 프로세스의 현재 상태를 반환합니다. |
| `POST` | `/targets/{targetAckId}/start` | 대상 프로세스를 시작합니다. |
| `POST` | `/targets/{targetAckId}/stop` | 대상 프로세스를 중지합니다. |
| `POST` | `/targets/{targetAckId}/restart` | 대상 프로세스를 재시작합니다. |
| `GET` | `/settings/{targetAckId}/diagnostics` | 대상 `ack` 런타임 진단 정보를 조회합니다. 프로세스가 실행 중이어야 합니다. |
| `GET` | `/settings/{targetAckId}` | 대상의 `appsettings.json` 전체 내용을 조회합니다. |
| `POST` | `/settings/{targetAckId}` | 요청 본문의 `AppSettings` 객체를 포함한 JSON을 저장합니다. |
| `GET` | `/modules/{targetAckId}/{moduleId}` | 대상의 `module.json` 전체 내용을 조회합니다. |
| `POST` | `/modules/{targetAckId}/{moduleId}` | 요청 본문의 `module.json` JSON을 저장합니다. |
| `GET` | `/stats` | 호스트의 CPU, 메모리, 디스크, 네트워크 통계를 반환합니다. |
| `GET` | `/logs/{targetAckId}?file={file}&rows={rows}` | 지정한 실행 중 `ack` 대상의 로그 파일 마지막 행을 반환합니다. |
| `GET` | `/logtree/{targetAckId}` | 지정한 실행 중 `ack` 대상의 로그 디렉터리 트리를 반환합니다. |

### 호스트 브리지 API (`Agent:HostBridge:HeaderName`, 기본 `X-Bridge-Key`)

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/bridge/targets/{targetAckId}/status` | 브리지 모드에서 대상 프로세스 상태를 반환합니다. |
| `POST` | `/bridge/targets/{targetAckId}/start` | 브리지 모드에서 대상 프로세스를 시작합니다. |
| `POST` | `/bridge/targets/{targetAckId}/stop` | 브리지 모드에서 대상 프로세스를 중지합니다. |
| `POST` | `/bridge/targets/{targetAckId}/restart` | 브리지 모드에서 대상 프로세스를 재시작합니다. |

`/logs/{targetAckId}`는 지정한 실행 중 `ack` 대상의 `WorkingDirectory/../log`에서 로그를 읽어옵니다. `file`을 생략하면 최신 `app*.log`를 우선 선택하고, `rows`를 생략하면 `300`행, 최대 `5000`행을 반환합니다. `file`은 로그 디렉터리 하위의 상대경로만 허용합니다.
`/logtree/{targetAckId}`는 지정한 실행 중 `ack` 대상의 `WorkingDirectory/../log` 디렉터리 하위 파일/폴더를 트리(JSON)로 반환합니다.
`/settings/{targetAckId}` 저장은 `appsettings.json` 저장 후 `/globalconfiguration/apply` 런타임 적용을 시도하며, 응답의 `restartRequiredKeys`로 재시작 필요 항목을 확인할 수 있습니다.
`/modules/{targetAckId}/{moduleId}` 저장은 `module.json` 저장 후 `ModuleConfig:EventAction`, `ModuleConfig:SubscribeAction`이 포함된 경우 `/moduleconfiguration/mediatr/{moduleId}/apply` 런타임 적용을 시도하며, 응답의 `restartRequiredPaths`로 재시작 필요 항목을 확인할 수 있습니다.
`/bridge/targets/*` API는 `Agent:HostBridge:Enabled=true`일 때만 활성화되며, 비활성 상태에서는 `404 Not Found`를 반환합니다.

## 설정

`appsettings.json`의 `Agent` 섹션에서 관리 키, 브리지, 타깃 프로세스 설정을 구성하고 `Users` 섹션에서 로그인 계정을 구성합니다.

- `ManagementHeaderName`: 기본 `X-Management-Key`
- `ManagementKey`: 중앙 서버에서 호출할 인증 키
- `Targets`: 제어 대상 `ack` 프로세스 목록
- `HostBridge`: `/bridge/targets/*` API 활성화 여부, 브리지 헤더명, 브리지 키 설정
- `AuditLog`: `/targets` API 요청 감사 로그(`logger/api/log/insert`) 설정

`Users` 섹션은 `/auth/login`에 사용하는 계정 목록이며 `EmailID`, `Password`, `UserName`, `Roles`, `CreatedAt`, `ExpiredAt` 값을 포함할 수 있습니다.

`AuditLog:Enabled=true`일 때 `/targets` API 호출은 `누가(사용자/클라이언트IP)`, `언제`, `무엇(액션/타깃/결과)` 정보를 `logger` 모듈로 전송합니다.

`/settings`, `/modules` API는 파일 저장 후 ACK 런타임 적용 API를 호출합니다.

- `/settings/{targetAckId}`: `appsettings.json` 저장 + `/globalconfiguration/apply` 호출
- `/modules/{targetAckId}/{module-id}`: `module.json` 저장 + MediatR(`EventAction`, `SubscribeAction`)는 `/moduleconfiguration/mediatr/{module-id}/apply` 호출
- 응답의 `restartRequiredKeys`/`restartRequiredPaths`로 재시작 필요 항목을 확인할 수 있습니다.

## 로컬 실행

```powershell
dotnet run --project 1.WebHost/agent/agent.csproj
```

예시 호출:

```powershell
$headers = @{ "X-Management-Key" = "CHANGE-THIS-KEY" }
Invoke-RestMethod -Uri "http://localhost:8422/targets" -Headers $headers
```

## 호스트 브리지 모드 (Docker -> Host 프로세스 제어)

Docker 컨테이너 내부 `agent`가 호스트의 `ack.exe`를 제어해야 할 경우, **호스트에 브리지 agent**를 하나 더 실행하고 컨테이너 agent가 이를 호출하도록 구성합니다.

### 1) 호스트 브리지 실행

```powershell
$env:ASPNETCORE_URLS='http://0.0.0.0:8584'
$env:Agent__HostBridge__Enabled='true'
$env:Agent__HostBridge__HeaderName='X-Bridge-Key'
$env:Agent__HostBridge__BridgeKey='CHANGE-THIS-BRIDGE-KEY'
$env:Agent__Targets__0__UseCommandBridge='false'
$env:Agent__Targets__0__ExecutablePath='C:\handstack\app\ack.exe'
$env:Agent__Targets__0__WorkingDirectory='C:\handstack\app'
dotnet run --project 1.WebHost/agent/agent.csproj --no-launch-profile
```

### 2) Docker agent 실행(브리지 위임)

```powershell
docker run -d --name handstack-agent-local -p 8422:8422 -e Agent__Targets__0__UseCommandBridge=true -e Agent__Targets__0__CommandBridgeUrl=http://host.docker.internal:8584 -e Agent__Targets__0__CommandBridgeHeaderName=X-Bridge-Key -e Agent__Targets__0__CommandBridgeKey=CHANGE-THIS-BRIDGE-KEY handstack-agent:latest
```

이 구성이 적용되면 컨테이너 `agent`의 `/targets/{targetAckId}/start|stop|restart|status` 요청은 호스트 브리지의 `/bridge/targets/{targetAckId}/...`로 전달됩니다.

## Windows Service 등록 예시

```powershell
dotnet publish 1.WebHost/agent/agent.csproj -c Release -o C:\handstack\agent
sc.exe create handstack-agent binPath= "C:\handstack\agent\agent.exe --urls http://0.0.0.0:8422" start= auto
sc.exe start handstack-agent
```

## Ubuntu systemd 등록 예시

```bash
dotnet publish 1.WebHost/agent/agent.csproj -c Release -o /opt/handstack/agent
```

`/etc/systemd/system/handstack-agent.service`:

```ini
[Unit]
Description=HandStack Agent
After=network.target

[Service]
WorkingDirectory=/opt/handstack/agent
ExecStart=/opt/handstack/agent/agent --urls http://0.0.0.0:8422
Restart=always
RestartSec=5
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

적용:

```bash
sudo systemctl daemon-reload
sudo systemctl enable handstack-agent
sudo systemctl start handstack-agent
```
