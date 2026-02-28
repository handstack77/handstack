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
- `GET /collect/{id}`

`/targets`, `/settings`, `/modules`, `/stats`, `/collect` API는 `Agent:ManagementHeaderName` 헤더로 관리 키를 전달해야 합니다.

## 설정

`appsettings.json`의 `Agent` 섹션에서 관리 키, 타깃 프로세스, `dotnet-monitor` 연동값을 설정합니다.

- `ManagementHeaderName`: 기본 `X-Management-Key`
- `ManagementKey`: 중앙 서버에서 호출할 인증 키
- `Targets`: 제어 대상 `ack` 프로세스 목록
- `DotNetMonitor`: 메트릭/로그/트레이스/덤프 수집 API 정보
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
Invoke-RestMethod -Uri "http://localhost:5000/targets" -Headers $headers
```

## Windows Service 등록 예시

```powershell
dotnet publish 1.WebHost/agent/agent.csproj -c Release -o C:\handstack\agent
sc.exe create handstack-agent binPath= "C:\handstack\agent\agent.exe --urls http://0.0.0.0:8577" start= auto
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
ExecStart=/opt/handstack/agent/agent --urls http://0.0.0.0:8577
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

