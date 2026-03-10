# handstack-agent

`handstack-agent`는 호스트 서버에서 여러 `ack` 프로세스를 제어하기 위한 관리 API 서버입니다.

## 주요 API

- `GET /targets`
- `GET /targets/{id}/status`
- `POST /targets/{id}/start`
- `POST /targets/{id}/stop`
- `POST /targets/{id}/restart`
- `GET /settings/{id}/status`
- `POST /settings/{id}`
- `GET /modules/{module-id}` (`?id={target-id}` 선택)
- `POST /modules/{module-id}` (`?id={target-id}` 선택)
- `GET /stats`
- `GET /validate/{key}`
- `GET /logs?file={file}&rows={rows}`
- `GET /logtree`

`/logs`는 실행 중인 `ack` 대상의 `WorkingDirectory/../log`에서 로그를 읽어오며, `file` 미지정 시 최신 `app*.log`, `rows` 미지정 시 `300`행을 반환합니다. `file`은 파일명 또는 하위 상대경로를 지원합니다.
`/logtree`는 실행 중인 `ack` 대상의 `WorkingDirectory/../log` 디렉터리 하위 파일/폴더를 트리(JSON)로 반환합니다.

`/targets`, `/settings`, `/modules`, `/stats`, `/logs`, `/logtree` API는 `Agent:ManagementHeaderName` 헤더로 관리 키를 전달해야 합니다.

## 설정

`appsettings.json`의 `Agent` 섹션에서 관리 키와 타깃 프로세스 설정을 구성합니다.

- `ManagementHeaderName`: 기본 `X-Management-Key`
- `ManagementKey`: 중앙 서버에서 호출할 인증 키
- `Targets`: 제어 대상 `ack` 프로세스 목록
- `AuditLog`: `/targets` API 요청 감사 로그(`logger/api/log/insert`) 설정

`AuditLog:Enabled=true`일 때 `/targets` API 호출은 `누가(사용자/클라이언트IP)`, `언제`, `무엇(액션/타깃/결과)` 정보를 `logger` 모듈로 전송합니다.

`/settings`, `/modules` API는 파일 저장 후 ACK 런타임 적용 API를 호출합니다.

- `/settings/{id}`: `appsettings.json` 저장 + `/globalconfiguration/apply` 호출
- `/modules/{module-id}`: `module.json` 저장 + MediatR(`EventAction`, `SubscribeAction`)는 `/moduleconfiguration/mediatr/{module-id}/apply` 호출
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

이 구성이 적용되면 컨테이너 `agent`의 `/targets/{id}/start|stop|restart|status` 요청은 호스트 브리지의 `/bridge/targets/{id}/...`로 전달됩니다.

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




