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
        "ContractBasePath": [
            "../contracts/prompter"
        ],
        "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
        "IsTransactionLogging": false,
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
                "ModelID": "gpt-4o-mini",
                "Endpoint": "",
                "Comment": "OpenAI 프롬프트 API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM2",
                "LLMProvider": "Claude",
                "ApiKey": "[sk-ant-api...키]",
                "ModelID": "claude-3-5-sonnet-latest",
                "Endpoint": "",
                "Comment": "Claude Messages API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM3",
                "LLMProvider": "Gemini",
                "ApiKey": "[AIza...키]",
                "ModelID": "gemini-1.5-flash",
                "Endpoint": "",
                "Comment": "Gemini GenerateContent API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM4",
                "LLMProvider": "Ollama",
                "ApiKey": "",
                "ModelID": "llama3.1",
                "Endpoint": "http://localhost:11434",
                "Comment": "Ollama 로컬 Chat API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM5",
                "LLMProvider": "LMStudio",
                "ApiKey": "",
                "ModelID": "local-model",
                "Endpoint": "http://localhost:1234",
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
        "AllowedBodyFileBasePaths": []
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

#### ContractBasePath

prompter 모듈의 거래 파일들이 있는 기본 디렉토리 경로를 입력합니다. 상대경로는 모듈의 기본 디렉토리를 기준으로 설정됩니다.

#### IsTransactionLogging

prompter 모듈의 요청에서 응답 사이의 SQL 거래 로그를 저장합니다. (기본값: false)

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

- ApplicationID: 어플리케이션의 ID를 설정합니다.
- ProjectID: 프로젝트의 ID를 설정합니다.
- DataSourceID: 프롬프트 계약의 `<datasource>`에서 참조할 LLM 데이터 소스 ID를 설정합니다.
- LLMProvider: LLM 제공자를 설정합니다. OpenAI, Claude, Gemini, Ollama, LMStudio를 기본 지원합니다. AzureOpenAI는 기존 설정 호환이 필요한 경우에만 사용합니다. (기본값: OpenAI)
- ApiKey: LLM 서비스에서 발급한 ApiKey를 입력합니다. Ollama와 LMStudio는 인증을 사용하지 않으면 빈 문자열로 둘 수 있습니다.
- ModelID: LLM 서비스에서 제공하는 모델 ID를 입력합니다. 기본 예시는 OpenAI `gpt-4o-mini`, Claude `claude-3-5-sonnet-latest`, Gemini `gemini-1.5-flash`, Ollama `llama3.1`, LMStudio `local-model`입니다.
- Endpoint: LLM 서비스 endpoint를 입력합니다. OpenAI, Claude, Gemini는 비어 있으면 모듈 기본 endpoint를 사용합니다. Ollama와 LMStudio는 로컬 서버 주소가 필요합니다.
- Comment: 주석을 설정합니다.

기본 provider별 설정 예시는 다음과 같습니다.

| LLMProvider | DataSourceID | ApiKey | ModelID | Endpoint |
| --- | --- | --- | --- | --- |
| OpenAI | LLM1 | `[sk-proj-API...키]` | `gpt-4o-mini` | 빈 문자열이면 `https://api.openai.com/v1/chat/completions` 사용 |
| Claude | LLM2 | `[sk-ant-api...키]` | `claude-3-5-sonnet-latest` | 빈 문자열이면 `https://api.anthropic.com/v1/messages` 사용 |
| Gemini | LLM3 | `[AIza...키]` | `gemini-1.5-flash` | 빈 문자열이면 `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` 사용 |
| Ollama | LLM4 | 빈 문자열 가능 | `llama3.1` | `http://localhost:11434` |
| LMStudio | LLM5 | 빈 문자열 가능 | `local-model` | `http://localhost:1234` |

Ollama endpoint는 `http://localhost:11434`처럼 base URL을 입력하면 내부에서 `/api/chat`을 붙여 호출합니다. LMStudio endpoint는 `http://localhost:1234` 또는 `http://localhost:1234/v1`을 입력하면 `/v1/chat/completions`로 정규화합니다.

#### Tool 보안 설정

- AllowedKernelPlugins: 계약에서 사용할 수 있는 KernelPlugin과 function 목록입니다. 기본값은 math/time/text 일부 function만 허용합니다.
- AllowedMcpServers: MCP 실행 allowlist입니다. name, command prefix, args prefix, timeout, working directory를 제한합니다. 기본값은 빈 목록입니다.
- AllowedCliTools: CLI 실행 allowlist입니다. name, command prefix, args prefix, timeout, working directory를 제한합니다. 기본값은 빈 목록입니다.
- AllowedBodyFileBasePaths: statement body의 file path가 읽을 수 있는 서버 디렉터리 목록입니다. 기본값은 빈 목록입니다.

## 프롬프트 계약

prompter 계약은 `<commands>`를 사용하지 않습니다. 루트 실행 컨테이너는 `<prompts>`이고 로더는 `//prompts/statement`만 읽습니다. 기존 `PromptMap`, `Prompt`, `StatementID` 명칭과 HandStack 거래 서비스의 `CommandType: "P"` 및 외부 QueryID 규칙은 유지됩니다.

```xml
<prompts>
    <statement id="GP01" seq="0" use="Y" timeout="0" desc="프롬프트 실행" maxtokens="4000" temperature="1.0" topp="1.0" presence="0.0" frequency="0.0">
        <![CDATA[
${UserMessage}
        ]]>
        <tools mode="auto" maxrounds="3">
            <kernel name="math" functions="Add,Subtract" />
            <kernel name="time" functions="Now,Today" />
            <mcp name="filesystem" command="npx" args="-y,@modelcontextprotocol/server-filesystem,C:/safe-root" />
            <cli name="git-status" command="git" args="status,--short" timeout="10" />
        </tools>
        <authorization type="Bearer" value="@Token" />
        <headers>
            <header name="X-Tenant" value="@TenantID" />
        </headers>
        <body type="form-data">
            <part type="file" name="uploadByPath" path="{@UploadFilePath}" fileName="{@FileName}" contentType="application/octet-stream" />
            <part type="file" name="uploadByBase64" base64="{@PayloadBase64}" fileName="payload.json" contentType="application/json" />
        </body>
        <param id="@UserMessage" type="String" length="-1" value="" />
        <param id="@Token" type="String" length="4000" value="NULL" />
    </statement>
</prompts>
```

`tools`의 기본 mode는 `none`이고 `maxrounds` 기본값은 3입니다. KernelPlugin, MCP, CLI는 계약 선언과 module.json allowlist가 모두 일치할 때만 실행됩니다. file body는 path와 base64가 모두 있으면 path를 우선하며, path는 AllowedBodyFileBasePaths 아래에 있을 때만 읽습니다.

## 설정 정보 관리 화면

프로그램 실행 후, 자세한 내용은 웹 브라우저에서 다음 URL을 통해 확인할 수 있습니다. 또한, 편집한 환경설정을 가져오기 및 내보내기 기능도 제공합니다.

> http://localhost:8421/prompter/module-settings.html


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
        "ContractBasePath": [
            "../contracts/prompter"
        ],
        "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
        "IsTransactionLogging": false,
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
                "ModelID": "gpt-4o-mini",
                "Endpoint": "",
                "Comment": "OpenAI 프롬프트 API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM2",
                "LLMProvider": "Claude",
                "ApiKey": "[sk-ant-api...키]",
                "ModelID": "claude-3-5-sonnet-latest",
                "Endpoint": "",
                "Comment": "Claude Messages API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM3",
                "LLMProvider": "Gemini",
                "ApiKey": "[AIza...키]",
                "ModelID": "gemini-1.5-flash",
                "Endpoint": "",
                "Comment": "Gemini GenerateContent API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM4",
                "LLMProvider": "Ollama",
                "ApiKey": "",
                "ModelID": "llama3.1",
                "Endpoint": "http://localhost:11434",
                "Comment": "Ollama 로컬 Chat API"
            },
            {
                "ApplicationID": "HDS",
                "ProjectID": "*",
                "DataSourceID": "LLM5",
                "LLMProvider": "LMStudio",
                "ApiKey": "",
                "ModelID": "local-model",
                "Endpoint": "http://localhost:1234",
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
        "AllowedBodyFileBasePaths": []
    }
}
```
