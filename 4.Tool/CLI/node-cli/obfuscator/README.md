# handstack-wwwroot-obfuscator (obfuscator-cli)

`obfuscator-cli`는 HandStack `1.WebHost`, `2.Modules` 하위 각 프로젝트의 `wwwroot`를 대상으로 HTML/CSS 압축과 JS 난독화를 수행하는 CLI입니다. `vite.config.mjs` 최적화 규칙(html-minifier-terser, clean-css, javascript-obfuscator)을 `lib/bundler.js` 공용 모듈로 옮기고, 하드코딩된 `lib/` 벤더 제외 대신 디렉토리/파일 glob 패턴 기반 제외를 지원하도록 일반화했습니다. `publish.bat`(퍼블리시 산출물) 후처리용으로 `publish-optimize` 명령을 통해 같은 로직을 in-place(source=output)로도 실행할 수 있습니다.

## 사전 조건

- Node.js 18+
- npm

## 설치

```powershell
cd .\node-cli\obfuscator
npm install
```

## 실행

```powershell
node .\obfuscator.js bundle --config .\obfuscator.json
```

또는

```powershell
npm run cli -- bundle --config .\obfuscator.json
```

`bundle`은 기본 명령이라 생략할 수 있습니다: `node .\obfuscator.js --config .\obfuscator.json`.

## 명령어

### 1) bundle (기본)

설정 파일 또는 `--source`/`--output`으로 지정한 wwwroot를 최적화/난독화하여 출력 경로에 생성합니다.

옵션:

- `-c, --config <file>`: 프로젝트 목록 설정 파일 경로 (기본 `./obfuscator.json`)
- `-s, --source <path>` / `-o, --output <path>`: 설정 파일 없이 단일 프로젝트만 실행할 때 사용 (`-n, --name`으로 결과 표시 이름 지정 가능)
- `--project <name>`: 설정 파일 내 특정 프로젝트만 실행, 반복 지정 가능 (예: `--project ack --project rdy-command`)
- `--exclude-dir <pattern>`: 최적화/난독화에서 제외할 디렉토리 glob 패턴, 반복 지정 가능. 설정 파일의 `excludeDirs`에 추가로 합쳐집니다.
- `--exclude-file <pattern>`: 최적화/난독화에서 제외할 파일 glob 패턴, 반복 지정 가능. 설정 파일의 `excludeFiles`에 추가로 합쳐집니다.
- `-s, --source`/`-o, --output`으로 설정 파일 없이 단일 실행할 때도, 그리고 설정 파일에 `excludeDirs`/`excludeFiles`를 생략했을 때도 아래 기본값이 적용됩니다.
  - `excludeDirs` 기본값: `["lib", "node_modules", ".git", "obj", "bin", "demo"]`
  - `excludeFiles` 기본값: `["*.map", "*.min.js"]`
- `--dry-run`: 실제로 파일을 쓰지 않고 대상 파일 수만 확인

제외 대상으로 판정된 디렉토리/파일은 `lib/` 벤더 폴더와 동일하게 **최적화/난독화 없이 원본 그대로 출력 경로에 복사**됩니다(출력에서 완전히 제거되는 것이 아닙니다).

실행 중 프로젝트별로 `[프로젝트명] 진행 파일 수: N/전체`가 같은 줄에 갱신 표시되고, 프로젝트 처리가 끝나면 `[완료]` 요약이 출력됩니다.

`--source`/`--output`(또는 `obfuscator.json`의 프로젝트 `output`)이 원본과 같은 경로를 가리키면 in-place로 동작합니다. 일반적으로 프로젝트 처리 전에 출력 디렉토리를 비우지만, in-place일 때는 원본이 곧 출력이므로 이 삭제 단계를 건너뜁니다.

HTML/CSS/JS 파일에 Handlebars/Mustache 같은 템플릿 문법이 섞여 있어 파서가 실패하면 해당 파일은 예외로 전체 실행을 멈추지 않고 **원본 그대로 복사**하며, 결과에 `[경고] <상대경로>: 파싱 실패로 원본 그대로 복사 (<에러 메시지>)`로 표시됩니다.

예시:

```powershell
# obfuscator.json에 등록된 모든 프로젝트 실행
node .\obfuscator.js bundle --config .\obfuscator.json

# 특정 프로젝트만, 실행 시점에 제외 패턴 추가
node .\obfuscator.js bundle --config .\obfuscator.json --project ack --exclude-dir demo --exclude-file "*.spec.js"

# 설정 파일 없이 단일 wwwroot만 실행
node .\obfuscator.js bundle --source "C:\projects\handstack77\handstack\1.WebHost\ack\wwwroot" --output "C:\projects\handstack77\handstack\1.WebHost\ack\wwwroot-bundle" --exclude-dir lib --exclude-file "*.map"

# 실제로 쓰지 않고 대상 개수만 확인
node .\obfuscator.js bundle --config .\obfuscator.json --dry-run
```

### 2) init

샘플 `obfuscator.json`을 생성합니다. 이미 파일이 있으면 실패합니다.

```powershell
node .\obfuscator.js init --output .\obfuscator.json
```

### 3) publish-optimize

`publish.bat` 산출물처럼 이미 배치된 결과물의 `wwwroot`를 **같은 경로에(source=output)** 최적화/난독화합니다. 별도 설정 파일 없이 `--root` 하위 `app`, `modules` 디렉토리를 재귀 탐색해 이름이 정확히 `wwwroot`인 디렉토리를 모두 찾아 각각 처리합니다(찾으면 그 하위는 더 탐색하지 않음).

옵션:

- `-r, --root <path>` (필수): `publish.bat`의 `%publish_path%\handstack`에 해당하는 루트 경로. `<root>\app`, `<root>\modules` 하위에서 `wwwroot`를 탐색합니다.
- `--exclude-dir <pattern>` / `--exclude-file <pattern>`: `bundle`과 동일, 기본 제외 목록에 추가로 합쳐집니다.
- `--dry-run`: 실제로 파일을 쓰지 않고 대상 개수만 확인

```powershell
node .\obfuscator.js publish-optimize --root "C:\projects\handstack77\publish\win-x64\handstack"
```

`publish.bat`은 모든 모듈 빌드와 파일 정리(robocopy assemblies)가 끝난 뒤, pdb 정리 전에 이 명령을 자동으로 실행합니다(`os_mode`/`action_mode`와 무관하게 항상 실행).

## 설정 파일(obfuscator.json) 형식

`projects`는 문자열(wwwroot 경로) 또는 객체(`name`/`source`/`output`/`excludeDirs`/`excludeFiles`)를 섞어서 쓸 수 있습니다. 문자열 항목은 이름을 `상위폴더명/wwwroot` 형태로, 출력 경로를 `<source><outputSuffix>`(기본 접미사 `-bundle`, 원본과 형제 디렉토리)로 자동 유도합니다.

```json
{
    "outputSuffix": "-bundle",
    "excludeDirs": ["lib", "node_modules", ".git", "obj", "bin"],
    "excludeFiles": ["*.map", "*.min.js"],
    "projects": [
        "C:\\projects\\handstack77\\handstack\\1.WebHost\\ack\\wwwroot",
        {
            "name": "rdy-command",
            "source": "C:\\projects\\handstack77\\handstack\\1.WebHost\\rdy\\modules\\command\\wwwroot",
            "output": "C:\\projects\\handstack77\\handstack\\1.WebHost\\rdy\\modules\\command\\wwwroot-bundle",
            "excludeDirs": ["demo"]
        }
    ]
}
```

- `excludeDirs`/`excludeFiles` 최상위 값은 모든 프로젝트에 공통 적용되고, 각 프로젝트 항목의 같은 이름 속성과 합쳐집니다.
- 최상위 `excludeDirs`/`excludeFiles`를 생략하면 `lib/config-loader.js`의 기본값(`excludeDirs`: `lib`, `node_modules`, `.git`, `obj`, `bin`, `demo` / `excludeFiles`: `*.map`, `*.min.js`)이 적용됩니다. 설정 파일에 명시하면 그 값이 기본값을 대체합니다(합쳐지지 않음).
- 패턴은 [minimatch](https://www.npmjs.com/package/minimatch) glob 문법을 사용합니다. `excludeDirs`는 경로 세그먼트 이름(`lib`) 또는 세그먼트까지의 상대 경로(`modules/command/lib`)에 매칭되고, `excludeFiles`는 파일명(`*.min.js`) 또는 소스 루트 기준 상대 경로에 매칭됩니다.
- `obfuscator.json`을 참고 예시로 제공합니다. 실제 실행 전에 `obfuscator.json`으로 복사해 프로젝트 목록을 조정하세요.

## 확장자별 처리 규칙

`lib/bundler.js`가 담당하며 `vite.config.mjs`와 동일합니다.

- `.html`: `html-minifier-terser` (공백 정리, 인라인 CSS 압축, 주석 제거, 인라인 JS는 그대로 유지)
- `.css`: `clean-css` level 2
- `.js`: `javascript-obfuscator` (control-flow flattening, self-defending, string-array 인코딩 등)
- 그 외 확장자 및 제외 대상 디렉토리/파일: 원본 그대로 복사

## 공용 모듈

- `lib/bundler.js`: `collectFiles`, `optimizeFile`, `bundleProject`, `bundleAll` — 실제 최적화/난독화 로직. `bundleProject`/`bundleAll`은 파일 처리마다 호출되는 `onProgress` 콜백을 받고, 프로젝트 결과에 파싱 실패 파일 목록(`warnings`)을 포함합니다.
- `lib/pattern-matcher.js`: `isExcludedDirectory`, `isExcludedFile` — glob 패턴 기반 제외 판정
- `lib/config-loader.js`: `loadConfig` — `obfuscator.json` 로드/정규화, `defaultExcludeDirs`/`defaultExcludeFiles` 기본값 제공
- `lib/wwwroot-scanner.js`: `findWwwrootDirs` — 주어진 경로 하위에서 이름이 `wwwroot`인 디렉토리를 재귀 탐색(`publish-optimize`에서 사용)

이 모듈들은 CLI 외부에서도 `require('./lib/bundler')` 형태로 재사용할 수 있도록 CLI 파싱 로직과 분리되어 있습니다.
