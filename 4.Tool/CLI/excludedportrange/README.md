# Windows TCP 포트 예약 관리 가이드

Windows 운영체제에서는 `netsh` 명령어를 통해 TCP/IP 포트를 예약하거나 제외 범위를 관리할 수 있습니다. 이 문서에서는 개발자가 애플리케이션 개발 시 필요한 TCP 포트 관리 방법에 대해 설명합니다.

## 주요 명령어 설명

### 1. TCP 포트 예약 추가

```bash
netsh int ipv4 Add excludedportrange protocol=tcp startport=12000 numberofports=1 store=persistent
```

**매개변수 설명:**
- `int ipv4`: IPv4 인터페이스 구성을 지정
- `Add excludedportrange`: 제외 포트 범위 추가
- `protocol=tcp`: TCP 프로토콜 사용
- `startport=12000`: 시작 포트 번호(12000)
- `numberofports=1`: 예약할 포트 개수(1개)
- `store=persistent`: 설정을 영구적으로 저장 (시스템 재시작 후에도 유지)

이 명령은 포트 12000을 시스템의 동적 포트 할당에서 제외하여, 해당 포트가 다른 애플리케이션에 무작위로 할당되지 않도록 합니다.

### 2. TCP 포트 예약 삭제

```bash
netsh int ipv4 delete excludedportrange protocol=tcp startport=12000 numberofports=1
```

**매개변수 설명:**
- `delete excludedportrange`: 기존 제외 포트 범위 삭제
- 다른 매개변수는 추가 명령과 동일한 의미

이 명령은 이전에 추가한 포트 12000에 대한 예약을 제거합니다.

### 3. TCP 포트 예약 목록 확인

```bash
netsh int ipv4 show excludedportrange protocol=tcp
```

**매개변수 설명:**
- `show excludedportrange`: 현재 시스템에 설정된 제외 포트 범위 표시

이 명령은 현재 시스템에서 사용이 제한된(예약된) 모든 TCP 포트 목록을 보여줍니다.

## 개발자를 위한 활용 시나리오

### 시나리오 1: 애플리케이션 포트 충돌 방지

특정 포트 번호를 사용하는 애플리케이션을 개발할 때, 해당 포트가 다른 프로세스에 의해 무작위로 할당되는 것을 방지하기 위해 사용합니다.

```bash
# 개발 중인 애플리케이션을 위해 포트 8080 예약
netsh int ipv4 Add excludedportrange protocol=tcp startport=8080 numberofports=1 store=persistent

# 애플리케이션 실행 및 테스트

# 개발 완료 후 예약 해제
netsh int ipv4 delete excludedportrange protocol=tcp startport=8080 numberofports=1
```

### 시나리오 2: 연속 포트 범위 예약

여러 개의 연속된 포트가 필요한 마이크로서비스 아키텍처에서 사용:

```bash
# 마이크로서비스를 위해 9000-9010 포트 범위 예약
netsh int ipv4 Add excludedportrange protocol=tcp startport=9000 numberofports=11 store=persistent

# 포트 예약 확인
netsh int ipv4 show excludedportrange protocol=tcp
```

### 시나리오 3: 임시 테스트 환경 설정

```bash
# 테스트를 위한 임시 포트 예약 (재부팅 후 자동 해제)
netsh int ipv4 Add excludedportrange protocol=tcp startport=7000 numberofports=5 store=active
```

## 주의사항

1. 관리자 권한으로 명령 프롬프트 또는 PowerShell을 실행해야 합니다.
2. `store=persistent` 옵션은 시스템 재부팅 후에도 설정이 유지되므로, 임시 테스트에는 `store=active` 사용을 권장합니다.
3. 충돌 확인: 이미 다른 애플리케이션이 사용 중인 포트를 예약하려고 하면 오류가 발생할 수 있습니다.
4. 포트 예약 상태는 다음 명령으로 확인할 수 있습니다:
   ```bash
   netstat -ano | findstr :포트번호
   ```

## Windows 시스템에서 네이티브 API를 통해 TCP/UDP 포트 예약을 삭제

excludedportrange CLI 는 Windows 시스템에서 TCP 또는 UDP 포트의 영구 예약을 삭제하는 명령줄 유틸리티입니다. Windows의 netsh 명령어 대신 네이티브 API를 직접 호출하여 포트 예약을 관리합니다.

## 실행 예제

```bash
excludedportrange tcp 12000 12000
```

이 명령은 다음을 수행합니다:

1. `tcp` - TCP 프로토콜의 포트 예약을 다룹니다.
2. `12000` - 시작 포트 번호
3. `12000` - 종료 포트 번호 (시작과 같으므로 단일 포트를 의미함)

내부적으로 프로그램은 아래와 같이 처리합니다:
- `mode = "tcp"`
- `startPort = 12000`
- `endPort = 12000`
- `numberOfPorts = 1` (12000 - 12000 + 1)
- `DeletePersistentTcpPortReservation` 함수를 호출하여 포트 12000에 대한 영구 예약을 삭제합니다.

## 반환 코드 정보

프로그램은 실행 결과로 Windows 시스템 오류 코드를 반환합니다:

- `0`: 성공
- `5`: 액세스 거부 (관리자 권한 필요)
- `87`: 매개변수가 잘못됨
- `1168`: 지정된 포트 예약을 찾을 수 없음
