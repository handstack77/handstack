# prompter

prompts 계약을 기반으로 LLM 프롬프트 실행을 Open API로 제공하는 모듈입니다.

```json
{
    "ModuleID": "prompter",
    "Name": "prompter",
    "IsBundledWithHost": false,
    "Version": "1.0.0",
    "ModuleConfig": {
        "SystemID": "HANDSTACK",
        "ModuleBasePath": "../modules/prompter",
        "IsContractFileWatching": true,
        "ContractBasePath": [
            "../contracts/prompter"
        ],
        "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
        "IsTransactionLogging": false,
        "IsChatHistoryConsoleShow": false,
        "DefaultPromptResultFieldID": "PromptResult",
        "ModuleLogFilePath": "../log/prompter/module.log",
        "IsLogServer": true,
        "LogServerUrl": "http://localhost:8421/logger/api/log/insert",
        "EventAction": [
            "prompter.Events.ManagedRequest"
        ],
        "SubscribeAction": [],
        "LLMSource": [
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM1",
                "LLMProvider": "OpenAI",
                "ApiKey": "[sk-proj-API...키]",
                "ModelID": "gpt-5.4-mini",
                "Endpoint": "",
                "Think": false,
                "Stream": false,
                "Comment": "OpenAI 프롬프트 API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM2",
                "LLMProvider": "Claude",
                "ApiKey": "[sk-ant-api...키]",
                "ModelID": "claude-haiku-4-5",
                "Endpoint": "",
                "Think": false,
                "Stream": false,
                "Comment": "Claude Messages API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM3",
                "LLMProvider": "Gemini",
                "ApiKey": "[AIza...키]",
                "ModelID": "gemini-3.1-flash-lite",
                "Endpoint": "",
                "Think": false,
                "Stream": false,
                "Comment": "Gemini GenerateContent API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM4",
                "LLMProvider": "Ollama",
                "ApiKey": "",
                "ModelID": "gemma4:26b",
                "Endpoint": "http://localhost:11434",
                "Think": false,
                "Stream": false,
                "Comment": "Ollama 로컬 Chat API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM5",
                "LLMProvider": "LMStudio",
                "ApiKey": "",
                "ModelID": "openai/gpt-oss-20b",
                "Endpoint": "http://localhost:1234",
                "Think": false,
                "Stream": false,
                "Comment": "LM Studio 로컬 OpenAI 호환 API"
            }
        ],
        "AllowedKernelPlugins": [
            {
                "Name": "math",
                "Functions": [ "Add", "Subtract" ]
            },
            {
                "Name": "time",
                "Functions": [ "Now", "Today" ]
            },
            {
                "Name": "text",
                "Functions": [ "Trim" ]
            }
        ],
        "AllowedMcpServers": [],
        "AllowedCliTools": [],
        "AllowedBuiltinTools": [
            "corpus_rag_search",
            "generate_image",
            "skill_search",
            "skill_install"
        ],
        "AllowedBodyFileBasePaths": [],
        "DriveBasePaths": [
            "../modules/prompter/drive"
        ],
        "ImageGenerationDataSourceID": "LLM1",
        "ImageGenerationModelID": "gpt-image-1",
        "GeneratedImageBasePath": "../modules/prompter/generated-images",
        "SkillBasePath": "../modules/prompter/skills",
        "SkillsBaseUrl": "https://skills.sh",
        "SkillsApiBearerToken": "",
        "EnableSkillSearch": true,
        "EnableSkillInstall": false
    }
}
```
소스) prompter 환경설정 예제

## 옵션 설명

### ModuleID

모듈을 식별하는 고유 ID 입니다. 반드시 입력 되어야 합니다.

### Name

모듈의 정보성 이름을 부여합니다.

### IsBundledWithHost

모듈이 호스트 애플리케이션과 함께 번들로 제공되는지 여부를 나타냅니다. 모놀리식 아키텍처로 개발하는 경우 true로 설정하며, 이는 ack 프로젝트와 연관된 모든 module 프로젝트가 참조로 연결되어 단일 코드 베이스에서 관리됨을 의미합니다. (기본값: false)

### Version

모듈 버전을 주.부.수 숫자로 관리합니다.

### ModuleConfig

#### SystemID

ack 프로그램에서 운영하는 시스템 식별 ID를 입력합니다. (기본값: HANDSTACK)

#### BusinessServerUrl

모듈 내에서 거래를 위한 transact 모듈을 실행하는 업무 서버의 Url을 입력합니다. (기본값: http://localhost:8421/transact/api/transaction/execute)

#### IsContractFileWatching

ContractBasePath 아래의 prompter 계약 파일 변경을 감시해 캐시를 갱신할지 여부를 설정합니다. 기본 설정 파일은 true이며, 설정을 생략하면 false로 처리됩니다.

#### ContractBasePath

prompter 모듈의 거래 파일들이 있는 기본 디렉토리 경로를 입력합니다. 상대경로는 모듈의 기본 디렉토리를 기준으로 설정됩니다.

#### IsTransactionLogging

prompter 모듈의 요청에서 응답 사이의 프롬프트 거래 로그를 저장합니다. (기본값: false)

#### IsChatHistoryConsoleShow

LLM assistant 응답을 채팅 히스토리에 추가한 직후 콘솔에 출력합니다. (기본값: false)

#### DefaultPromptResultFieldID

거래 응답에서 프롬프트 실행 결과를 담을 기본 필드 ID입니다. (기본값: PromptResult)

#### ModuleLogFilePath

모듈 내에서 작성하는 로그의 파일명을 포함하는 파일 경로입니다.

#### IsLogServer

prompter 모듈의 로그를 logger 모듈을 운영하는 서버로 저장합니다. (기본값: false)

#### LogServerUrl

logger 모듈을 운영하는 서버의 URL 경로입니다. (기본값: http://localhost:8421/logger/api/log/insert)

#### EventAction

모듈 간의 Mediator 발신 이벤트 통신을 위한 식별 ID를 설정합니다. 예) [대상 모듈 ID].Events.[호출 이벤트 ID]

#### SubscribeAction

모듈 간의 Mediator 수신 이벤트 통신을 위한 식별 ID를 설정합니다. 예) [공개 모듈 ID].Events.[수신 이벤트 ID]

#### LLMSource

prompter 모듈의 Contract 파일에서 사용하는 LLM 데이터 원본 목록입니다. Contract의 `<datasource>LLM1</datasource>` 값이 `LLMSource[].DataSourceID`와 매칭되어 대상 provider, 모델, endpoint를 결정합니다.

프롬프트 계약에서 사용할 수 있는 LLM 소스를 설정합니다. 같은 `ApplicationID`와 `ProjectID` 범위 안에서 `DataSourceID`를 다르게 지정하면 계약별로 OpenAI, Claude, Gemini, Ollama, LM Studio를 선택해서 사용할 수 있습니다.

- ApplicationID: 애플리케이션의 ID를 설정합니다.
- ProjectID: 프로젝트의 ID를 설정합니다.
- DataSourceID: 프롬프트 계약의 `<datasource>`에서 참조할 LLM 데이터 소스 ID를 설정합니다.
- LLMProvider: LLM 제공자를 설정합니다. OpenAI, Claude, Gemini, Ollama, LMStudio를 기본 지원합니다. AzureOpenAI는 기존 설정 호환이 필요한 경우에만 사용합니다. (기본값: OpenAI)
- ApiKey: LLM 서비스에서 발급한 ApiKey를 입력합니다. Ollama와 LMStudio는 인증을 사용하지 않으면 빈 문자열로 둘 수 있습니다.
- ModelID: LLM 서비스에서 제공하는 모델 ID를 입력합니다. 기본 예시는 OpenAI `gpt-5.4-mini`, Claude `claude-haiku-4-5`, Gemini `gemini-3.1-flash-lite`, Ollama `gemma4:26b`, LMStudio `openai/gpt-oss-20b`입니다.
- Endpoint: LLM 서비스 endpoint를 입력합니다. OpenAI, Claude, Gemini는 비어 있으면 모듈 기본 endpoint를 사용합니다. Ollama와 LMStudio는 로컬 서버 주소가 필요합니다.
- Think: provider가 사고 과정 제어 옵션을 지원할 때 활성화합니다. 지원하지 않는 provider에서는 무시될 수 있습니다. (기본값: false)
- Stream: provider가 스트리밍 응답을 지원할 때 활성화합니다. (기본값: false)
- Comment: 주석을 설정합니다.

기본 provider별 설정 예시는 다음과 같습니다.

| LLMProvider | DataSourceID | ApiKey | ModelID | Endpoint |
| --- | --- | --- | --- | --- |
| OpenAI | LLM1 | `[sk-proj-API...키]` | `gpt-5.4-mini` | 빈 문자열이면 `https://api.openai.com/v1/chat/completions` 사용 |
| Claude | LLM2 | `[sk-ant-api...키]` | `claude-haiku-4-5` | 빈 문자열이면 `https://api.anthropic.com/v1/messages` 사용 |
| Gemini | LLM3 | `[AIza...키]` | `gemini-3.1-flash-lite` | 빈 문자열이면 `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` 사용 |
| Ollama | LLM4 | 빈 문자열 가능 | `gemma4:26b` | `http://localhost:11434` |
| LMStudio | LLM5 | 빈 문자열 가능 | `openai/gpt-oss-20b` | `http://localhost:1234` |

Ollama endpoint는 `http://localhost:11434`처럼 base URL을 입력하면 내부에서 `/api/chat`을 붙여 호출합니다. LMStudio endpoint는 `http://localhost:1234` 또는 `http://localhost:1234/v1`을 입력하면 `/v1/chat/completions`로 정규화합니다.

Ollama의 일부 qwen3 계열 채팅 템플릿은 메시지 목록에 비어 있지 않은 `user` role이 없으면 `no user query found in messages` 오류를 반환합니다. `<message>` 없이 작성된 기존 statement가 `system` role 하나만 생성하는 경우 prompter는 Ollama 요청에 한해 마지막 유효한 `system` 메시지를 `user`로 정규화합니다. 메시지 내용을 복제하지 않으므로 입력 토큰 수는 늘어나지 않습니다.

#### Tool 보안 설정

- AllowedKernelPlugins: 계약에서 사용할 수 있는 KernelPlugin과 function 목록입니다. 기본값은 math/time/text 일부 function만 허용합니다.
- AllowedMcpServers: MCP 실행 allowlist입니다. name, command prefix, args prefix, timeout, working directory를 제한합니다. 기본값은 빈 목록입니다.
- AllowedCliTools: CLI 실행 allowlist입니다. name, command prefix, args prefix, timeout, working directory를 제한합니다. 기본값은 빈 목록입니다.
- AllowedBuiltinTools: 계약에서 선언할 수 있는 내장 도구 allowlist입니다. 기본 제공 도구는 `corpus_rag_search`, `generate_image`, `skill_search`, `skill_install`입니다.
- AllowedBodyFileBasePaths: statement body의 file path가 읽을 수 있는 서버 디렉터리 목록입니다. 기본값은 빈 목록입니다.
- DriveBasePaths: `corpus_rag_search`가 검색할 서버 문서 디렉터리 목록입니다. 상대경로는 모듈 기본 디렉터리를 기준으로 해석되며 `.docx`, `.pptx`, `.xlsx`, `.pdf`, `.txt`, `.md` 파일을 읽습니다.
- ImageGenerationDataSourceID: `generate_image`가 사용할 OpenAI 또는 AzureOpenAI LLMSource의 DataSourceID입니다. 비어 있으면 OpenAI 계열 LLMSource를 검색합니다.
- ImageGenerationModelID: 이미지 생성 모델 ID입니다. 비어 있으면 LLMSource의 ModelID를 사용하고, 둘 다 없으면 `gpt-image-1`을 사용합니다.
- GeneratedImageBasePath: `generate_image`가 base64 이미지 응답을 PNG 파일로 저장할 디렉터리입니다.
- SkillBasePath: `skill_install`이 검증된 skill 파일을 설치할 서버 디렉터리입니다.
- SkillsBaseUrl: skill 검색과 설치에 사용할 API base URL입니다. 기본값은 `https://skills.sh`입니다.
- SkillsApiBearerToken: skills API 호출에 사용할 Bearer 토큰입니다. 비어 있으면 `VERCEL_OIDC_TOKEN` 환경 변수를 사용합니다.
- EnableSkillSearch: `skill_search` 실행과 관리 API 검색을 허용합니다. (기본값: false)
- EnableSkillInstall: `skill_install` 실행과 관리 API 설치를 허용합니다. 기본 설정은 false로 두어 명시적으로 열 때만 설치합니다.

## 프롬프트 계약

prompter 계약은 `//prompts/statement`만 읽습니다. 기존 `PromptMap`, `Prompt`, `StatementID` 명칭과 HandStack 거래 서비스의 `CommandType: "P"` 및 외부 QueryID 규칙은 유지됩니다.

```xml
<prompts>
    <statement id="GP01" seq="0" use="Y" timeout="0" desc="프롬프트 실행" maxtokens="4000" temperature="1.0" topp="1.0" presence="0.0" frequency="0.0">
        <![CDATA[
${UserMessage}
        ]]>
        <tools mode="auto" maxrounds="10">
            <kernel name="math" functions="Add,Subtract" />
            <kernel name="time" functions="Now,Today" />
            <mcp name="filesystem" command="npx" args="-y,@modelcontextprotocol/server-filesystem,C:/safe-root" />
            <cli name="git-status" command="git" args="status,--short" timeout="10" />
            <builtin name="corpus_rag_search" />
            <builtin name="generate_image" />
            <builtin name="skill_search" />
            <builtin name="skill_install" />
        </tools>
        <authorization type="Bearer" value="@Token" />
        <headers>
            <header name="X-Tenant" value="@TenantID" />
        </headers>
        <body type="form-data">
            <part type="file" name="uploadByPath" path="@UploadFilePath" fileName="@FileName" contentType="application/octet-stream" />
            <part type="file" name="uploadByBase64" base64="@PayloadBase64" fileName="payload.json" contentType="application/json" />
        </body>
        <param id="@UserMessage" type="String" length="-1" value="" />
        <param id="@Token" type="String" length="4000" value="NULL" />
        <param id="@TenantID" type="String" length="-1" value="" />
        <param id="@UploadFilePath" type="String" length="-1" value="" />
        <param id="@FileName" type="String" length="-1" value="" />
        <param id="@PayloadBase64" type="String" length="-1" value="" />
    </statement>
</prompts>
```

statement 본문은 단일 CDATA 프롬프트 또는 role별 `<message>` 목록으로 작성할 수 있습니다. statement의 `role` 기본값은 `user`이며, 시스템 지시문으로 전달하려면 `role="system"`을 명시합니다. `<message>`가 없으면 기존 방식처럼 statement의 CDATA와 동적 태그를 하나의 프롬프트로 조립하고, statement의 `role` 속성을 메시지 역할로 사용합니다. `<message>`가 있으면 statement 최상위 CDATA를 먼저 statement `role` 메시지로 추가한 뒤, `<message>` 노드를 XML 선언 순서대로 추가합니다. `<message>` 자체의 `role`을 생략한 경우에도 statement role을 상속하므로 기본값은 `user`입니다.

```xml
<statement id="GP02" seq="0" use="Y" timeout="0" desc="역할별 프롬프트 실행">
    <![CDATA[
# INSTRUCTIONS
- 한국어만 사용하세요.
    ]]>
    <message>
        <![CDATA[
INTENTS: Question, Assertion, Declaration
        ]]>
    </message>
    <message role="assistant">
        <![CDATA[
USER: 오늘 날씨는 어떤가요?
ASSISTANT:
Question
        ]]>
    </message>
    <message role="user">
        <![CDATA[
USER: ${UserMessage}
ASSISTANT:
        ]]>
    </message>
    <param id="@UserMessage" type="String" length="-1" value="" />
    <media id="@Image1" type="Image" mimeType="image/png" required="N" />
    <media id="@Audio1" type="Audio" mimeType="audio/wav" required="N" />
</statement>
```

위 예시는 LLM 요청 메시지를 `system`(statement CDATA) -> `system` -> `assistant` -> `user` 순서로 생성합니다. 각 message 본문에도 `${ParameterName}` 치환과 코드도움 치환식이 동일하게 적용됩니다. `CLS010`의 `GP02`는 이 방식으로 `LLM.CLS010.GP02` 거래에서 `UserMessage`를 role별 프롬프트의 마지막 user 메시지로 전달합니다.

### 멀티모달 입력

`<media>`는 `QueryObject.Parameters`로 받은 Base64 원문을 텍스트와 분리해 LLM 제공자의 멀티모달 메시지 형식으로 전달합니다.

- `id`: 요청 파라미터 이름입니다. `<param>` 또는 다른 `<media>`와 대소문자 구분 없이 중복될 수 없습니다.
- `type`: `Image` 또는 `Audio`만 허용합니다.
- `mimeType`: `image/png`, `image/jpeg`, `audio/wav`, `audio/mpeg`처럼 구체적인 MIME 타입이 필요합니다. `image/*`, `audio/*`는 허용하지 않습니다.
- `required`: `Y`이면 값이 없을 때 provider 호출 전에 실패하고, `N`이면 빈 값을 생략합니다.

요청 값은 `data:image/png;base64,...` 형식이나 URL이 아니라 Base64 데이터 부분만 전달해야 합니다. Base64는 일반 프롬프트, authorization, headers, body, pretransaction 치환 대상에서 제외되며, 현재 statement에서 생성한 마지막 `user` 메시지에 첨부됩니다. 현재 statement에 `user` 메시지가 없으면 media 전용 `user` 메시지를 추가합니다.

```json
{
  "ReturnType": "Json",
  "DynamicObjects": [
    {
      "QueryID": "HDS|LLM|CLS010|GP0200",
      "Parameters": [
        { "ParameterName": "@UserMessage", "Value": "이미지와 오디오를 설명해 줘", "DbType": "String", "Length": -1 },
        { "ParameterName": "@Image1", "Value": "<base64-only>", "DbType": "String", "Length": -1 },
        { "ParameterName": "@Audio1", "Value": "<base64-only>", "DbType": "String", "Length": -1 }
      ]
    }
  ]
}
```

provider별 입력 지원 범위는 다음과 같습니다. 실제 모델도 해당 modality를 지원해야 합니다.

| LLMProvider | Image | Audio | 전송 형식 |
| --- | --- | --- | --- |
| OpenAI | 지원 | 지원 (`audio/wav`, `audio/mpeg`) | Chat Completions content parts |
| Claude | 지원 | 미지원 | Messages base64 image source |
| Gemini | 지원 | 지원 | GenerateContent inlineData |
| Ollama | 지원 | 미지원 | Chat message images |
| LMStudio | 지원 | 미지원 | OpenAI 호환 image_url content part |

미지원 media가 포함되면 HTTP 요청을 보내기 전에 명시적인 오류로 종료합니다. prompter 내부 요청 로그에서는 media 값을 유형과 Base64 길이만 남기도록 마스킹하지만, prompter에 도달하기 전의 `transact` 또는 외부 프록시 로그 정책은 별도로 확인해야 합니다.

`tools`의 기본 mode는 `none`이고 `maxrounds` 기본값은 10입니다. KernelPlugin, MCP, CLI, built-in tool은 계약 선언과 module.json allowlist가 모두 일치할 때만 실행됩니다. file body는 path와 base64가 모두 있으면 path를 우선하며, path는 AllowedBodyFileBasePaths 아래에 있을 때만 읽습니다.

Built-in tool은 추가로 요청 파라미터의 `AgentOptions` JSON에서 기능별 활성화 값이 true여야 모델에 노출됩니다. 예시는 다음과 같습니다.

```json
{
    "drive": {
        "enabled": true,
        "topK": 5
    },
    "tools": {
        "generate_image": true
    },
    "skills": {
        "enabled": true,
        "installEnabled": false
    }
}
```

`corpus_rag_search`는 `drive.enabled` 또는 `tools.corpus_rag_search`, `generate_image`는 `tools.generate_image`, `skill_search`는 `skills.enabled` 또는 `tools.skill_search`로 활성화합니다. `skill_install`은 `skills.enabled` 또는 `tools.skill_search`로 skill 기능을 켠 뒤 `skills.installEnabled` 또는 `tools.skill_install`을 함께 true로 지정해야 합니다. `skill_search`와 `skill_install`은 각각 `EnableSkillSearch`, `EnableSkillInstall` 모듈 설정도 true여야 합니다.

프롬프트 계약의 문자열 치환 규칙은 다음과 같습니다.

- 프롬프트 본문은 `${ParameterName}` 형식으로 요청 파라미터를 치환합니다.
- `authorization`, `headers`, `body` 속성은 값 전체가 파라미터일 때 `@ParameterName` 형식으로 전달합니다.
- 프롬프트 본문에 `@{CodeHelpID|ApplicationID|BusinessID|TransactionID|FunctionID|Parameters...}` 형식을 추가하면 해당 위치를 코드도움 결과로 치환합니다. 예를 들어 `@{CHP001|HDS|SYS|SYS010|LD01|@GroupCode:SYS001;CompanyNo:1;}`는 `HDS|SYS|SYS010|LD01` 거래를 `ApplicationID=HDS`, `CodeHelpID=CHP001`, `Parameters=@GroupCode:SYS001;CompanyNo:1;`로 호출한 뒤 반환된 `DataSource`를 CSV 문자열로 변환해 삽입합니다.
- 코드도움 치환식의 마지막에 `|TemplateID`를 추가하면 `Prompts/CodeHelpTemplates/TemplateID.tmp` Mustache 템플릿으로 결과를 렌더링합니다. 템플릿 모델은 `Title`, `Items`, `CodeIDs`, `CodeValues`를 제공합니다.

## 설정 정보 관리 화면

프로그램 실행 후, 자세한 내용은 웹 브라우저에서 다음 URL을 통해 확인할 수 있습니다. 또한, 편집한 환경설정을 가져오기 및 내보내기 기능도 제공합니다.

> http://localhost:8421/prompter/module-settings.html

Tool 보안 설정 JSON에서는 `AllowedKernelPlugins`, `AllowedMcpServers`, `AllowedCliTools`, `AllowedBuiltinTools`, `AllowedBodyFileBasePaths`, `DriveBasePaths`, `ImageGenerationDataSourceID`, `ImageGenerationModelID`, `GeneratedImageBasePath`, `SkillBasePath`, `SkillsBaseUrl`, `SkillsApiBearerToken`, `EnableSkillSearch`, `EnableSkillInstall` 값을 함께 편집합니다.

## 관리 API

다음 API는 기존 managed API와 동일하게 `HttpContext.IsAllowAuthorization()` 검사를 통과해야 합니다.

- `GET /prompter/api/managed/skill-search?query=excel&limit=5`: `EnableSkillSearch`가 true일 때 skills API에서 skill을 검색합니다. `limit`은 1~20 범위로 제한됩니다.
- `POST /prompter/api/managed/skill-install`: `EnableSkillInstall`이 true일 때 요청 본문 `{ "ID": "owner/repo/skill" }`의 skill을 audit 확인 후 `SkillBasePath` 아래에 설치합니다.


---

## prompter 모듈 설정 확인하기

> [prompter 모듈 참고하기](https://handstack.kr/docs/reference/api/modules/prompter)

```json
{
    "ModuleID": "prompter",
    "Name": "prompter",
    "IsBundledWithHost": false,
    "Version": "1.0.0",
    "ModuleConfig": {
        "SystemID": "HANDSTACK",
        "ModuleBasePath": "../modules/prompter",
        "IsContractFileWatching": true,
        "ContractBasePath": [
            "../contracts/prompter"
        ],
        "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
        "IsTransactionLogging": false,
        "IsChatHistoryConsoleShow": false,
        "DefaultPromptResultFieldID": "PromptResult",
        "ModuleLogFilePath": "../log/prompter/module.log",
        "IsLogServer": true,
        "LogServerUrl": "http://localhost:8421/logger/api/log/insert",
        "EventAction": [
            "prompter.Events.ManagedRequest"
        ],
        "SubscribeAction": [],
        "LLMSource": [
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM1",
                "LLMProvider": "OpenAI",
                "ApiKey": "[sk-proj-API...키]",
                "ModelID": "gpt-5.4-mini",
                "Endpoint": "",
                "Think": false,
                "Stream": false,
                "Comment": "OpenAI 프롬프트 API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM2",
                "LLMProvider": "Claude",
                "ApiKey": "[sk-ant-api...키]",
                "ModelID": "claude-haiku-4-5",
                "Endpoint": "",
                "Think": false,
                "Stream": false,
                "Comment": "Claude Messages API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM3",
                "LLMProvider": "Gemini",
                "ApiKey": "[AIza...키]",
                "ModelID": "gemini-3.1-flash-lite",
                "Endpoint": "",
                "Think": false,
                "Stream": false,
                "Comment": "Gemini GenerateContent API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM4",
                "LLMProvider": "Ollama",
                "ApiKey": "",
                "ModelID": "gemma4:26b",
                "Endpoint": "http://localhost:11434",
                "Think": false,
                "Stream": false,
                "Comment": "Ollama 로컬 Chat API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM5",
                "LLMProvider": "LMStudio",
                "ApiKey": "",
                "ModelID": "openai/gpt-oss-20b",
                "Endpoint": "http://localhost:1234",
                "Think": false,
                "Stream": false,
                "Comment": "LM Studio 로컬 OpenAI 호환 API"
            }
        ],
        "AllowedKernelPlugins": [
            {
                "Name": "math",
                "Functions": [ "Add", "Subtract" ]
            },
            {
                "Name": "time",
                "Functions": [ "Now", "Today" ]
            },
            {
                "Name": "text",
                "Functions": [ "Trim" ]
            }
        ],
        "AllowedMcpServers": [],
        "AllowedCliTools": [],
        "AllowedBuiltinTools": [
            "corpus_rag_search",
            "generate_image",
            "skill_search",
            "skill_install"
        ],
        "AllowedBodyFileBasePaths": [],
        "DriveBasePaths": [
            "../modules/prompter/drive"
        ],
        "ImageGenerationDataSourceID": "LLM1",
        "ImageGenerationModelID": "gpt-image-1",
        "GeneratedImageBasePath": "../modules/prompter/generated-images",
        "SkillBasePath": "../modules/prompter/skills",
        "SkillsBaseUrl": "https://skills.sh",
        "SkillsApiBearerToken": "",
        "EnableSkillSearch": true,
        "EnableSkillInstall": false
    }
}
```
