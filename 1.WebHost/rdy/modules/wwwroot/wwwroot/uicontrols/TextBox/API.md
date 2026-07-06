# TextBox API 참조

`syn.uicontrols.$textbox`

## 마크업

TextBox는 네이티브 `<input type="text">` 요소에 `syn-options` 속성으로 옵션을 JSON 형태로 지정해서 사용합니다.

```html
<input id="txtSample" type="text" syn-options="{editType: 'text'}">
```

- 값 변경 등 이벤트 핸들러를 페이지 스크립트에서 받으려면 `syn-events="['change']"`처럼 이벤트 이름 배열을 지정하고, 페이지 `.js`에 `event.<elID>_<eventName>(evt)` 함수를 정의합니다.
- 글자 수 제한은 표준 HTML `maxlength` 속성, 또는 한글 등 2byte 문자를 고려한 길이 제한이 필요하면 `maxlengthB` 속성을 사용합니다. 둘 중 하나라도 지정하면 blur 시 초과 여부를 검사해 안내창을 띄웁니다.
- 자동완성 목록은 `list` 속성(datalist)이 내부적으로 자동 생성/연결되므로 별도 마크업이 필요 없습니다.

## Options (defaultSetting)

| 옵션 | 타입/기본값 | 설명 |
| --- | --- | --- |
| `editType` | string, 기본 `'text'` | 서브타입 지정. 아래 표 참고 |
| `inValidateClear` | boolean, 기본 `true` | `corporateno` 등 형식 오류 시 값을 지울지(true) 빨간 글자로 표시만 할지(false) 결정 |
| `formatNumber` | boolean, 기본 `true` | `numeric` 타입에서 blur 시 3자리 콤마(통화) 서식 적용 여부 |
| `maskPattern` | string, 기본 `null` | VMasker 입력 마스크 패턴 (예: `'99:99'`, `'999-99-99999'`, `'(99) SSSS-AAAA'`) |
| `maxCount` | number, 기본 `null` | `number`/`numeric`/`spinner`에서 허용 최대값 |
| `minCount` | number, 기본 `0` | `number`/`numeric`/`spinner`에서 허용 최소값 |
| `allowChars` | array, 기본 `[]` | `english` 타입 blur 검증 시 예외 허용할 값 목록 |
| `placeText` | array/string, 기본 `[]` | superplaceholder로 표시할 안내 문구(1개 이상이면 문구가 순환 표시됨) |
| `defaultSetValue` | string, 기본 `'0'` | 기본 설정값(참고용) |
| `dataType` | string, 기본 `'string'` | `clear()` 호출 시 되돌릴 값의 데이터 타입(`string`, `int` 등) |
| `belongID` | string, 기본 `null` | 소속 그룹/프레임 식별자 |
| `getter` / `setter` | boolean, 기본 `false` | `true`이면 `getValue`/`setValue` 시 페이지 훅(`mod.hook.frameEvent`)을 거쳐 값 가공 |
| `controlText` | string, 기본 `null` | 검증 실패 메시지 등에 사용되는 컨트롤 표시명(로케일 처리 대상) |
| `validators` | array, 기본 `null` | 폼 전송(`transactConfig`) 시 적용할 검증 규칙 배열. 예: `['require', 'email']`, `['require', 'numeric']`. 실제 검증은 `$validation.transactionValidate`가 수행 |
| `transactConfig` | object, 기본 `null` | 트랜잭션(서버 전송) 연동 설정 |
| `triggerConfig` | object, 기본 `null` | 값이 비어 있을 때 참조할 트리거 옵션 연동 설정 |
| `datalistID` | string, 기본 `null` | 사용할 `<datalist>` id (미지정 시 `elID + '_datalist'` 자동 생성) |
| `datalistItems` | array, 기본 `[]` | 정적 자동완성 목록. 문자열 배열 또는 `{value, label}` 객체 배열 |
| `datalistUrl` | string, 기본 `null` | focus 시 원격에서 자동완성 목록을 로드할 URL |
| `datalistValueField` / `datalistLabelField` | string, 기본 `'value'`/`'label'` | 원격 응답에서 값/라벨로 사용할 필드명 |
| `dataSourceID` / `storeSourceID` | string, 기본 `null` | 코드성 데이터소스(원격 또는 로컬 캐시) 연동용 ID |
| `parameters` | object, 기본 `null` | 원격 데이터소스 조회 시 전달할 파라미터 |
| `local` | boolean, 기본 `true` | 데이터소스를 로컬 캐시(`code/{storeSourceID}.json`)에서 가져올지 여부 |
| `sharedAssetUrl` | string, 기본 `''` | 로컬 데이터소스 JSON 조회 시 사용할 기준 URL(미지정 시 `syn.Config.SharedAssetUrl`) |

### editType 값 목록

| editType | 동작 요약 |
| --- | --- |
| `text` | 일반 텍스트, 별도 변환 없음 |
| `english` | 한글 입력 차단(영문/숫자/`_`만 허용), `textCase` 옵션으로 대소문자 강제 가능 |
| `uppercase` | 영문 대문자만 허용 |
| `lowercase` | 영문 소문자만 허용 |
| `number` | 숫자/`-`만 입력, blur 시 `minCount`/`maxCount` 범위로 보정 (콤마 서식 없음) |
| `numeric` | 숫자/`-`만 입력, blur 시 `minCount`/`maxCount` 보정 + `formatNumber`가 true면 콤마 통화 서식 적용 |
| `spinner` | `numeric`과 동일한 입력 규칙 + 증감 버튼(ISpin, `minCount`~`maxCount`, step 1/pageStep 10) |
| `year` | 4자리 연도, blur 시 유효 연도 검증 |
| `date` | 8자리 또는 `yyyy-MM-dd`, blur 시 유효 일자 검증 |
| `yearmonth` | `yyyy-MM`, blur 시 유효 연월 검증 |
| `hour` | 0~23 범위 보정, 1자리면 0 패딩 |
| `minute` | 0~59 범위 보정, 1자리면 0 패딩 |
| `time5` | `HH:MM` 형식, 자동 마스크(`99:99`) + 유효성 검사 |
| `time8` | `HH:MM:SS` 형식, 자동 마스크(`99:99:99`) + 유효성 검사 |
| `homephone` | 지역/일반 전화번호, blur 시 자동으로 `-` 삽입, 형식 오류면 값 비움 |
| `mobilephone` | 휴대전화번호(01x), blur 시 자동으로 `-` 삽입 |
| `phone` | 휴대전화/지역전화 모두 허용하는 통합 전화번호 |
| `email` | blur 시 이메일 형식 검증, 실패 시 값 비움 |
| `juminno` | 주민등록번호, 기본 마스크 `999999-9999999`, 정규식 검증 |
| `businessno` | 사업자등록번호, 기본 마스크 `999-99-99999`, 체크섬(`isBusinessNo`) 검증 |
| `corporateno` | 법인등록번호, 기본 마스크 `999999-9999999`, 체크섬(`isCorporateNo`) 검증. `inValidateClear=false`면 오류 시 값을 비우지 않고 빨간 굵은 글씨로만 표시 |

## 메서드

| 메서드 | 매개변수 | 설명 |
| --- | --- | --- |
| `controlLoad(elID, setting)` | 요소 id, 옵션 객체 | 컨트롤 초기화(내부적으로 페이지 로드시 자동 호출됨) |
| `getValue(elID)` | 요소 id | 현재 값 반환. `number`/`numeric`은 콤마 제거된 숫자 문자열로 반환 |
| `setValue(elID, value)` | 요소 id, 값 | 값 설정. `number`/`numeric`이면 숫자 값을 통화 서식으로 변환해 표시. `value`가 `undefined`/`null`이면 `triggerConfig` 옵션 값 또는 빈 문자열로 대체 |
| `clear(elID, isControlLoad)` | 요소 id | `dataType` 옵션에 맞는 기본값으로 초기화 |
| `dataRefresh(elID, setting, callback)` | 요소 id, 옵션, 콜백 | `dataSourceID`/`storeSourceID` 데이터를 다시 조회해 자동완성 목록 갱신 |
| `setDatalistItems(elID, items)` | 요소 id, 배열 | 자동완성(datalist) 목록 전체 교체 |
| `addDatalistItem(elID, item)` | 요소 id, 항목 | 자동완성 목록에 항목 1개 추가 |
| `removeDatalistItem(elID, value)` | 요소 id, 값 | 자동완성 목록에서 값이 일치하는 항목 제거 |
| `clearDatalistItems(elID)` | 요소 id | 자동완성 목록 전체 비우기 |
| `getDatalistItems(elID)` | 요소 id | 현재 저장된 자동완성 목록 배열 반환 |
| `loadDatalistItems(elID, url, callback)` | 요소 id, URL(선택), 콜백(선택) | 원격 URL에서 자동완성 목록을 로드 |
| `filterDatalistItems(elID, filterText)` | 요소 id, 검색어 | 저장된 전체 목록 중 값/라벨에 검색어가 포함된 항목만 표시 |
| `setLocale(elID, translations, control, options)` | - | 다국어 리소스에 맞춰 placeholder/controlText 갱신 |

## 이벤트 (syn-events)

TextBox는 `editType`에 따라 내부적으로 `focus`/`blur`/`input` 이벤트를 자동으로 연결해 형식 변환·검증을 수행합니다. 페이지에서 별도 로직을 실행하려면 표준 DOM 이벤트 이름을 `syn-events`에 지정하면 됩니다.

| 이벤트 | 설명 |
| --- | --- |
| `change` | 값이 변경되고 포커스가 벗어날 때 |
| `input` | 값 입력 중(키 입력 등) |
| `focus` | 포커스를 받았을 때 |
| `blur` | 포커스를 잃었을 때(내부적으로 서식/검증이 먼저 수행된 뒤 호출됨) |
| `click` | 클릭 시(버튼 등 다른 요소와 조합 시 주로 사용) |

```html
<input id="txtEmail" type="text" syn-options="{editType: 'email'}" syn-events="['change', 'blur']">
```

```js
let $sample = {
    event: {
        txtEmail_change(evt) {
            syn.$l.eventLog('txtEmail_change', syn.uicontrols.$textbox.getValue('txtEmail'));
        },
        txtEmail_blur(evt) {
            syn.$l.eventLog('txtEmail_blur', syn.uicontrols.$textbox.getValue('txtEmail'));
        }
    }
}
```

## 참고

- 소스: `TextBox.js`, `TextBox.css`
- 입력 마스크는 [VMasker](https://github.com/vitorbritto/vmasker) 라이브러리, 스피너는 ISpin 라이브러리를 사용합니다.
- `validators` 옵션은 `transactConfig`를 통한 폼 전송 시 `$validation.transactionValidate`가 검사하며, TextBox 자체는 형식 변환/자체 blur 검증만 담당합니다.
- 예제는 [example](./example) 폴더, 사용 개요는 [README.md](./README.md)를 참고하세요.
