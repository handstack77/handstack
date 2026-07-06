# TextBox (syn.uicontrols.$textbox)

## 이 컨트롤은 무엇인가요?

TextBox는 네이티브 `<input type="text">` 요소를 확장(enhancement)해서 다양한 입력 형식을 자동으로 처리해 주는 컨트롤입니다. `syn-options` 속성에 `editType`을 지정하는 것만으로 아래와 같은 서브타입을 사용할 수 있습니다.

| 분류 | editType 값 | 설명 |
| --- | --- | --- |
| 일반 텍스트 | `text` (기본값) | 일반 문자열 입력 |
| 영문/대소문자 | `english`, `uppercase`, `lowercase` | 입력 중 한글 제거, 대문자/소문자 강제 변환 |
| 숫자 | `number`, `numeric` | 숫자만 입력, `numeric`은 blur 시 3자리 콤마 통화 서식(`formatNumber`) 적용 |
| 숫자 스피너 | `spinner` | 증감 버튼이 붙은 숫자 입력(ISpin) |
| 날짜/시간 | `year`, `date`, `yearmonth`, `hour`, `minute`, `time5`, `time8` | 각 형식에 맞는 blur 검증과 자동 포맷팅(`HH:MM`, `HH:MM:SS` 등) |
| 전화번호 | `homephone`, `mobilephone`, `phone` | 지역/휴대전화 번호 패턴 검사 후 `-` 포함 형식으로 자동 변환 |
| 이메일 | `email` | blur 시 이메일 형식 검증 |
| 등록번호 | `juminno`(주민등록번호), `businessno`(사업자번호, 체크섬 검증), `corporateno`(법인번호, 체크섬 검증) | 자동 마스킹 및 유효성 검사 |
| 커스텀 마스크 | `maskPattern` 옵션(VMasker 패턴, 예: `'999-99-99999'`) | 임의의 입력 마스크 지정 |
| 자동완성 목록 | `datalistID` / `datalistItems` / `datalistUrl` | HTML `<datalist>` 연동, 정적/원격 데이터소스 로딩 지원 |

이 외에도 `maxlength`(또는 `maxlengthB`, 한글 등 2byte 문자 기준 길이 제한) 지정 시 blur 시점에 길이 초과 알림을 띄워 줍니다.

## 언제 사용하나요?

- 일반 입력 필드부터 전화번호, 이메일, 주민/사업자/법인번호, 날짜/시간 조각, 숫자 서식까지 - "글자를 입력받는" 대부분의 화면 요소에 사용합니다.
- 드롭다운으로 만들기엔 항목이 유동적이거나 사용자가 직접 입력해야 하지만 자동완성 힌트가 필요한 경우 `datalistItems`/`datalistUrl`을 사용합니다.
- 폼 전송(`transactConfig`) 시 서버 검증 전에 클라이언트에서 형식을 걸러내고 싶을 때 `validators` 옵션(`require`, `unique`, `numeric`, `ipaddress`, `email`, `date`, `url` 등)을 함께 지정합니다.

## 빠른 시작

```html
<input id="txtName" type="text" syn-options="{editType: 'text', maxCount: null}">
<input id="txtPhone" type="text" syn-options="{editType: 'homephone'}">
<input id="txtAmount" type="text" syn-options="{editType: 'numeric', minCount: 0, maxCount: 100000}">

<script src="/js/syn.loader.js"></script>
```

`syn.loader.js` 한 줄만 추가하면 필요한 CSS/JS가 자동으로 주입되고, 페이지가 로드될 때 위 입력창들이 각 `editType`에 맞는 동작(포맷팅, 검증, 마스킹)을 갖추게 됩니다.

값을 읽고 쓸 때는 컨트롤 API를 사용합니다.

```js
var value = syn.uicontrols.$textbox.getValue('txtAmount');
syn.uicontrols.$textbox.setValue('txtAmount', 12345);
syn.uicontrols.$textbox.clear('txtAmount');
```

## 예제 실행하기

아래 예제 파일들을 브라우저로 열어 실제 동작을 확인할 수 있습니다. (`/uicontrols/TextBox/example/` 경로)

- `basic.html` - 일반 텍스트, 영문/대소문자 강제, maxlength 예제
- `numberformat.html` - 숫자(`number`/`numeric`), 스피너(`spinner`) 서식 예제
- `textvalidation.html` - 전화번호/이메일/등록번호/날짜/시간 등 형식 검증 예제
- `events.html` - datalist 자동완성, getValue/setValue/clear 및 이벤트 로그 예제

각 예제는 `<script src="/js/syn.loader.js"></script>` 한 줄만으로 동작하며, 버튼을 눌러 콘솔/로그 영역에서 결과를 확인할 수 있습니다.

## 더 알아보기

- 자세한 옵션/메서드/이벤트 목록은 같은 폴더의 [API.md](./API.md)를 참고하세요.
- 실제 소스는 `TextBox.js`, `TextBox.css` 파일을 참고하세요.
