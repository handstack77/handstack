# node-cli

`node-cli`는 HandStack Node 기반 도구를 모아둔 디렉터리입니다.

현재 핵심 CLI 프로젝트:

- `license-cli/`: 라이선스 생성/검증/JS 라이선스 파일 생성 도구

## 구성

- `node-cli.esproj`: Visual Studio JavaScript 프로젝트 엔트리
- `package.json`: 루트 패키지 메타 정보
- `license-cli/`: 실제 실행 가능한 라이선스 CLI 코드

## 빠른 시작

```powershell
cd .\node-cli\license-cli
npm install
node .\license-cli.js --help
```

또는 npm 스크립트:

```powershell
npm run cli -- --help
```

## 참고

루트(`node-cli`) 자체에는 독립 실행 커맨드가 정의되어 있지 않으며, 실제 기능은 `license-cli` 하위 프로젝트에서 제공합니다.
