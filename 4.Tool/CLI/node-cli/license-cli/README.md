# handstack-license-generator (license-cli)

`license-cli`는 HandStack 라이선스 생성/검증 및 브라우저 전달용 JavaScript 라이선스 파일 생성 도구입니다.

## 사전 조건

- Node.js 14+
- npm

## 설치

```powershell
cd .\node-cli\license-cli
npm install
```

## 실행

```powershell
node .\license-cli.js <command> [options]
```

또는

```powershell
npm run cli -- <command> [options]
```

## 명령어

### 1) create

새 라이선스를 생성하고 `licenses.json`에 저장합니다.

필수 옵션:

- `-m, --module-id <id>`
- `-c, --company <name>`
- `-p, --product <name>`
- `-h, --hosts <hosts>` (쉼표 구분)

선택 옵션:

- `-e, --environment <env>` (기본 `개발`)
- `-x, --expires <ISO date>`
- `-o, --output <file>` (기본 `licenses.json`)
- `--show-key`
- `--gen-js`
- `--js-dir <dir>` (기본 `./licenses`)
- `--js-minify`

예시:

```powershell
node .\license-cli.js create --module-id handstack-ui-v1 --company HandStack --product HandStackUI-v1.0.0-PROD001 --hosts handstack.kr,www.handstack.kr --environment Production --expires 2026-07-01T23:59:59.000Z --gen-js --js-dir .\generated-licenses
```

### 2) generate-js

저장된 라이선스에서 JavaScript 파일을 생성합니다.

옵션:

- `-m, --module-id <id>`: 특정 모듈만 생성
- `-f, --file <file>`: 라이선스 파일 (기본 `licenses.json`)
- `-o, --output-dir <dir>`: 출력 폴더 (기본 `./licenses`)
- `--minify`
- `--no-timestamp`
- `--publisher <publisher>`
- `--prefix <prefix>`
- `--suffix <suffix>` (기본 `License`)

예시:

```powershell
node .\license-cli.js generate-js --output-dir .\js-licenses --minify --publisher handstack.kr
node .\license-cli.js generate-js --module-id handstack-ui-v1 --output-dir .\single-js --prefix lib_ --suffix _license
```

### 3) validate

모듈 라이선스 유효성을 검증합니다.

옵션:

- `-m, --module-id <id>` (필수)
- `-f, --file <file>` (기본 `licenses.json`)
- `-H, --check-host <host>`: 특정 호스트 허용 여부도 함께 검사

예시:

```powershell
node .\license-cli.js validate --module-id handstack-ui-v1 --check-host www.handstack.kr
```

### 4) list

전체 라이선스를 출력합니다.

옵션:

- `-f, --file <file>`
- `--stats`
- `--format <table|json>` (기본 `table`)

예시:

```powershell
node .\license-cli.js list --stats
node .\license-cli.js list --format json
```

### 5) check-host

특정 호스트가 라이선스에 허용되는지 검사합니다.

옵션:

- `-m, --module-id <id>` (필수)
- `-H, --host <host>` (필수)
- `-f, --file <file>`

예시:

```powershell
node .\license-cli.js check-host --module-id handstack-ui-v1 --host api.handstack.kr
```

### 6) stats

라이선스 통계를 출력합니다.

옵션:

- `-f, --file <file>`

예시:

```powershell
node .\license-cli.js stats
```

## 파일 형식

기본 저장 파일(`licenses.json`)은 아래 구조를 사용합니다.

```json
{
  "Licenses": {},
  "GeneratedAt": "...",
  "GeneratedBy": "handstack",
  "Version": "1.0.0"
}
```

## 검증 규칙 요약

- `module-id`: 영숫자/`-`/`_`만 허용
- `expires`: ISO 8601 문자열 검증
- `hosts`: 도메인/IP/와일드카드(`*.domain`) 검증
- 라이선스 키: AES-256-CBC + SHA256 서명

## 참고 파일

- `example-with-js-generation.js`: 전체 동작 예제
- `demo/license-validation-demo.html`: 브라우저 검증 데모
