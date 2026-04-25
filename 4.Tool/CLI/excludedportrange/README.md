# excludedportrange CLI

`excludedportrange`는 Windows의 영구 포트 예약(Persistent Port Reservation)을 네이티브 API로 삭제하는 도구입니다.

## 지원 환경

- Windows 전용
- 관리자 권한 권장

## 용도

- TCP/UDP 포트 예약 해제
- `netsh int ipv4 delete excludedportrange ...` 동작을 API 수준에서 수행

## 빌드

```powershell
dotnet build .\dbplatform\dbplatform.csproj
```

## 실행

```powershell
excludedportrange [tcp|udp] [startport] [endport]
```

또는

```powershell
dotnet run --project .\excludedportrange -- [tcp|udp] [startport] [endport]
```

## 인자

- 첫 번째: `tcp` 또는 `udp`
- 두 번째: 시작 포트
- 세 번째: 종료 포트

`startport <= endport` 이어야 하며, 범위 길이는 내부적으로 `(endport - startport + 1)`로 계산됩니다.

## 예시

```powershell
# 단일 TCP 포트(12000) 예약 삭제
excludedportrange tcp 12000 12000

# UDP 포트 범위(15000~15550) 예약 삭제
excludedportrange udp 15000 15550
```

## 확인 명령

```powershell
netsh int ipv4 show excludedportrange protocol=tcp
netsh int ipv4 show excludedportrange protocol=udp
```

## 반환 코드

프로그램은 Win32 결과 코드를 그대로 반환합니다. 대표 예:

- `0`: 성공
- `5`: 액세스 거부(관리자 권한 필요)
- `87`: 잘못된 매개변수
- `1168`: 지정된 예약 항목 없음

## 주의사항

- 운영 중인 서비스가 사용하는 포트 예약을 제거하면 충돌/장애가 발생할 수 있습니다.
- 작업 전 `show excludedportrange`로 대상 범위를 먼저 확인하세요.
