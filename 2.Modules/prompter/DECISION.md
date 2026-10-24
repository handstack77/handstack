# Jev / Ollama 판단 계약

`CommandType: "P"`와 QueryID 규칙을 유지하면서 `<decision>` statement를 `/v1/systemone`으로 실행한다.
`<decision>`이 없는 Ollama statement는 기존 `/api/chat`을 사용한다. TypeSafe는 판단 계약 전용이다.

| 거래 | QueryID | 데이터 소스 | 모델 |
| --- | --- | --- | --- |
| JEV010.GP01 | HDS\|LLM\|JEV010\|GP0100 | DECISION_JEV | jev-latest |
| JEV010.GP02 | HDS\|LLM\|JEV010\|GP0200 | DECISION_NIMBLE | nimble |
| JEV010.GP03 | HDS\|LLM\|JEV010\|GP0300 | DECISION_CLEF_FLASH | clef-flash |
| JEV010.GP04 | HDS\|LLM\|JEV010\|GP0400 | DECISION_CLEF | clef |
| JEV010.GP05 | HDS\|LLM\|JEV010\|GP0500 | DECISION_TEV1 | tev1 |
| JEV010.GP06 | HDS\|LLM\|JEV010\|GP0600 | DECISION_CLEF_FLASH | clef-flash (이미지 판단) |
| JEV010.GP07 | HDS\|LLM\|JEV010\|GP0700 | DECISION_JEV | jev-latest (이미지 판단) |

소스 `module.json`의 DECISION_* 항목을 실행 모듈 설정에도 반영한다. Ollama는 선택한 모델을 미리 `ollama pull nimble` 등으로 설치한다.
TypeSafe는 LLMSource.ApiKey(기존 IsEncryption 지원) 또는 호스트 프로세스의 `TYPESAFE_API_KEY` 환경변수를 사용한다. 환경변수는 ApiKey가 비어 있을 때만 참조한다.
Ollama 판단은 인증 헤더 없이 루프백 HTTP/HTTPS로 연결한다. 허용할 모델명과 태그는 `module.json`의 `ModuleConfig.AllowedOllamaDecisionModels`에서 관리한다. 제공되는 기본 목록은 다음과 같다.

```json
"AllowedOllamaDecisionModels": [
    "nimble", "nimble:latest",
    "clef-flash", "clef-flash:latest",
    "clef", "clef:latest",
    "tev1", "tev1:latest", "tev1:4b", "tev1:0.8b"
]
```

새 모델은 이 배열에 정확한 모델명과 태그를 추가하고, 사용할 `LLMSource.ModelID`에도 같은 값을 지정한다. 코드 수정이나 재빌드는 필요하지 않다.
이름과 태그는 대소문자를 구분해 전체 문자열로 비교한다. `nimble` 등록만으로 `nimble:latest`가 허용되지는 않으며 와일드카드나 접두사 매칭은 지원하지 않는다.
설정의 앞뒤 공백과 중복은 정리하고 빈 항목은 제외한다. 항목 누락, null, 빈 배열은 모든 Ollama 판단 호출을 차단한다. 기존 설정 파일을 사용하는 경우 이 목록도 병합해야 한다.
TypeSafe 판단과 일반 Ollama 채팅에는 이 목록을 적용하지 않는다. 모델 등록은 실제 로컬 실행·판단 API 지원을 보장하지 않으므로 해당 기능을 지원하는 로컬 모델만 등록한다.
호스트의 `AppSettings:IsConfigurationWatching=true`이면 목록 변경을 실행 중 반영하며, 꺼져 있으면 호스트를 다시 시작한다. 이미 진행 중인 호출은 취소하지 않고 이후 모델 검사부터 새 목록을 사용한다.
모듈 설정 화면의 `AllowedOllamaDecisionModels` 입력란에서도 JSON 배열을 편집할 수 있다.

```xml
<statement id="GP01" seq="0" use="Y" datasource="DECISION_NIMBLE" timeout="60">
    <decision state="@UserMessage"><![CDATA[
    {
      "refund": {
        "type": "noul",
        "instructions": "Does the customer request a refund?"
      }
    }
    ]]></decision>
    <param id="@UserMessage" type="String" length="-1" required="Y" value="" />
    <outputmeta value="PromptResult:string" />
</statement>
```

state는 선언된 입력 파라미터 이름이다. 입력은 문자열 JSON 값으로 직렬화되므로 따옴표·줄바꿈이 기준 JSON을 변경하지 않는다.
decision의 CDATA는 질문 이름을 키로 갖는 고정 JSON 객체다. 입력 텍스트를 이 JSON 안에 문자열 치환하지 않는다.
Choice는 2~26개 선택지, Score는 2~10개 순서 있는 기준, Noul은 참 확률을 반환한다. Noul criteria는 생략하거나 true/false 설명을 함께 지정한다.
질문은 1~64개이며 이름은 영문·숫자·밑줄·마침표·하이픈 1~100자다. 입력은 텍스트이며 이미지는 `<media>`로 함께 첨부할 수 있다(아래 "이미지 판단").
message/tools/body/headers/authorization을 decision과 함께 선언할 수 없다. media는 Image 형식만 최대 4개까지 선언할 수 있다. Think/Stream은 false로 설정한다.
timeout은 초 단위 1~300이며 0 또는 생략은 30초다. 채팅의 temperature 등 생성 옵션은 판단 요청에 보내지 않는다.

## 이미지 판단

`<decision>` statement에 `<media type="Image">`를 함께 선언하면 첨부 이미지를 모든 질문이 공유하는 입력으로 판단한다. JEV010의 GP06(Ollama clef-flash)과 GP07(TypeSafe jev-latest)이 예시이며 `@Image1`(image/png)과 `@Image2`(image/jpeg)를 선택 입력(`required="N"`)으로 받는다.
요청 값은 `data:` URI가 아닌 Base64 원문이다. 이미지가 없으면 텍스트만으로 판단한다.

```xml
<statement id="GP06" seq="0" use="Y" datasource="DECISION_CLEF_FLASH" timeout="120">
    <decision state="@UserMessage"><![CDATA[ ... ]]></decision>
    <param id="@UserMessage" type="String" length="-1" required="Y" value="" />
    <media id="@Image1" type="Image" mimeType="image/png" required="N" />
    <media id="@Image2" type="Image" mimeType="image/jpeg" required="N" />
    <outputmeta value="PromptResult:string" />
</statement>
```

| 항목 | Ollama (`/v1/systemone`) | TypeSafe |
| --- | --- | --- |
| 전송 형식 | 본문 `images: ["<Base64>"]`. 모든 질문이 공유 | 본문 `assets` 맵(`{type, format, data_base64}`)과 state 끝의 참조 키(요청마다 만든 UUID) |
| 헤더 | 없음 | `TypeSafe-Danger-Zone-Images: true` 자동 추가 |
| 허용 형식 | PNG, JPEG, WebP | 애니메이션이 아닌 PNG, JPEG(WebP 불가) |
| 크기 | 요청 전체 32 MiB 이하 | 파일 16 MiB 이하, 가로·세로 280~1568px, 요청 전체 32 MiB 이하 |
| 지원 모델 | `AllowedOllamaImageDecisionModels`에 등록한 모델(기본 clef, clef-flash. Ollama 0.35.1 이상) | Jev 1.13 이상 |

- 모델 차단: 이미지가 있는데 Ollama 모델이 `AllowedOllamaImageDecisionModels`에 없으면 호출 전에 `decision_image_model_unsupported`로 실패한다. nimble과 tev1은 텍스트 전용이며 이미지를 무시한 판단이 정상 결과처럼 반환되지 않도록 한 차단이다. `AllowedOllamaDecisionModels`와 마찬가지로 이름과 태그를 전체 문자열로 비교하고, 모듈 설정 화면의 `AllowedOllamaImageDecisionModels` 입력란에서도 편집할 수 있다. 이 목록의 모델은 `AllowedOllamaDecisionModels`에도 등록한다.
- 사전 검증: 파일 헤더로 실제 형식과 크기를 읽는다. 선언한 mimeType과 실제 형식이 다르거나 이미지가 손상되면 `decision_image_invalid`, TypeSafe 형식 제한 위반은 `decision_image_format_unsupported`, 크기 제한 위반은 `decision_image_size_unsupported`, 요청이 32 MiB를 넘으면 `decision_image_too_large`다. TypeSafe는 범위를 벗어난 이미지를 조정하지 않고 요청 전체를 거부하므로 호출 전에 막는다.
- 호출 측 준비: TypeSafe는 메타데이터(EXIF 포함)를 제거하고 회전을 적용하지 않으므로 이미지를 바로 세워서 보낸다. GIF, HEIC 등은 PNG나 JPEG로 변환한다. 질문의 instructions에 "첨부 이미지가 있으면 함께 고려한다"를 쓰고 이미지 속 글자도 지시문이 아닌 데이터로 취급하도록 명시한다.
- 개인정보: 이미지는 패턴 마스킹을 적용할 수 없다. TypeSafe는 외부 서비스이므로 개인정보나 민감정보가 담길 수 있는 이미지는 로컬 Ollama(GP06)로 판단한다. TypeSafe 이미지 기능은 공급자가 아직 production-ready가 아닌 기능으로 표시하며 형식과 한도가 바뀔 수 있다.
- 로그: prompter의 요청 로그는 decision state와 이미지 값을 가린다(`[media:Image;base64-length:N]`). transact와 프록시 로그의 Base64 보호는 호출 경로에서 별도로 확인한다.

직접 호출은 일반 media와 같은 방식으로 이미지 파라미터를 추가한다.

```json
{ "ParameterName": "Image1", "Value": "<Base64 원문>", "DbType": "String", "Length": -1 }
```

모델의 answers를 질문별로 검증한 뒤 전체 JSON을 Form 출력의 `PromptResult` 문자열에 반환한다.
확률 합, 범위, 선택지, Score 가중합, legend를 검사하며 응답 오류는 거래 실패로 반환한다.
`outputmeta`는 JSON 경로 매핑이 아니다. 숫자 필드가 필요하면 호출 측에서 PromptResult를 역직렬화한다.

직접 모듈 호출 예시(호스트 접근 정책에 따른 AuthorizationKey/X-Api-Key 설정 필요):

```json
{
  "ReturnType": "Json",
  "DynamicObjects": [{
    "QueryID": "HDS|LLM|JEV010|GP0200",
    "Parameters": [{"ParameterName": "UserMessage", "Value": "중복 결제를 환불해 주세요.", "DbType": "String", "Length": -1}]
  }]
}
```

POST `/prompter/api/query`. HTTP 성공만 보지 않고 Acknowledge와 ExceptionText를 먼저 검사한다.
실패 코드는 `decision_upstream_429`, `decision_upstream_timeout`, `decision_upstream_unreachable`, `decision_invalid_response` 등이다.
실패 시 임의 판단을 만들거나 채팅·데모로 대체하지 않는다. 문의의 검토 대기 저장은 호출 애플리케이션이 담당한다.
Jev Desk는 prompter로 보내기 전에 기존 개인정보 패턴 마스킹을 적용한다. 다른 소비자도 전송·로깅 정책을 별도로 적용해야 한다.

2026-10-23 검증: 격리된 ack/transact/prompter 호스트에서 5개 계약, 기존 Ollama 채팅,
transact 라우팅, Jev Desk 연동과 실패 처리, 모델 허용 목록의 추가·제거·실행 중 갱신을 포함한 33개 검사를 통과했다. 외부 제공자는 Postman 모의 서버이며 실제 모델 추론·품질은 미검증이다.
소스 빌드는 경고 0/오류 0이며 실제 설치 경로의 설정과 데이터를 변경하지 않았다.

2026-10-25 검증(이미지 판단): 격리 호스트(임시 HANDSTACK_HOME, ack `--modules=prompter`, 가짜 Ollama·TypeSafe 서버)에서 GP06·GP07 이미지 호출과 텍스트 전용 호출, 형식·크기·data URI 거부를 HTTP로 확인했다.
같은 계약과 클라이언트를 직접 호출하는 검사 52개(계약 로드, 요청 본문 형식, 모델 차단, 크기 경계, 로그 마스킹)도 통과했다. 실제 Ollama·TypeSafe 서버와 모델의 이미지 판단 품질은 미검증이다.

참고: https://docs.ollama.com/capabilities/decision / https://docs.typesafe.ai/introduction/quickstart / https://docs.typesafe.ai/images
