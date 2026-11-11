# SignaturePad API 참조

`syn.uicontrols.$signaturepad` (버전: `v2026.10.14`)

의존 라이브러리: [signature_pad](https://github.com/szimek/signature_pad) 5.1.4 (`/lib/signature_pad/dist/signature_pad.umd.min.js`, 전역 `SignaturePad`). 로더가 자동으로 불러오며, 직접 페이지에 넣을 때는 컨트롤보다 먼저 로드해야 합니다.

## 마크업

```html
<syn_signaturepad id="sigReceiver" syn-datafield="ReceiverSignature" syn-events="['beginStroke','endStroke','change']" syn-options="{
    width: '100%',
    height: '200px',
    penColor: '#1e3a8a',
    placeholder: '여기에 서명해 주세요'
}"></syn_signaturepad>
```

원본 요소가 서명 영역(호스트)이 되며 안에 `<canvas class="syn-signaturepad-canvas">`와 안내 문구 요소가 생성됩니다. 호스트에는 다음 클래스가 붙습니다.

| 클래스 | 의미 |
|---|---|
| `syn-signaturepad` | 항상 |
| `syn-signaturepad-empty` | 서명이 비어 있을 때 |
| `syn-signaturepad-readonly` | 읽기 전용일 때 |
| `syn-signaturepad-disabled` | 비활성화일 때 |

## Options (defaultSetting)

| 옵션명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `width` | string | `'100%'` | 서명 영역 너비(CSS 값) |
| `height` | string | `'200px'` | 서명 영역 높이(CSS 값) |
| `placeholder` | string | `'여기에 서명해 주세요'` | 비어 있을 때 보이는 안내 문구. 빈 문자열이면 표시하지 않음 |
| `penColor` | string | `'#000000'` | 펜 색상 |
| `backgroundColor` | string | `'rgba(0,0,0,0)'` | 캔버스 배경색. 기본은 투명 |
| `minWidth` | number | `0.5` | 가장 빠르게 그을 때의 최소 선 굵기(px) |
| `maxWidth` | number | `2.5` | 가장 느리게 그을 때의 최대 선 굵기(px) |
| `dotSize` | number \| null | `null` | 점 하나를 찍었을 때 크기. `null`이면 라이브러리 기본값((`minWidth`+`maxWidth`)/2) |
| `minDistance` | number | `5` | 이 거리(px)보다 가까운 점은 무시해 선을 부드럽게 함 |
| `velocityFilterWeight` | number | `0.7` | 속도 필터 가중치(0~1). 클수록 속도 변화가 선 굵기에 덜 반영됨 |
| `throttle` | number | `16` | 점 처리 간격(ms). `0`이면 제한 없음 |
| `compositeOperation` | string | `'source-over'` | 캔버스 `globalCompositeOperation` 값 |
| `imageType` | string | `'image/png'` | `getValue`가 만드는 이미지 형식. `'image/png'`, `'image/jpeg'`, `'image/webp'`, `'image/svg+xml'`. JPEG은 배경이 투명이면 `'#ffffff'`로 자동 변경 |
| `imageQuality` | number \| null | `null` | JPEG/WebP 품질(0~1). `null`이면 브라우저 기본값 |
| `readOnly` | boolean | `false` | `true`이면 입력을 막음(값은 `setValue`로만 변경) |
| `dataType` | string | `'string'` | 값의 데이터 타입 |
| `belongID` | string \| string[] \| null | `null` | 이 필드가 속한 트랜잭션 함수 ID |
| `getter` | boolean \| function | `false` | 값을 가져올 때 커스텀 변환 함수 |
| `setter` | boolean \| function | `false` | 값을 설정할 때 커스텀 변환 함수 |
| `controlText` | string \| null | `null` | 컨트롤 라벨/설명 텍스트(검증 메시지, 접근성 `aria-label`에 사용) |
| `validators` | array \| null | `null` | 값 검증 규칙 |
| `transactConfig` | object \| null | `null` | 트랜잭션 관련 설정 |
| `triggerConfig` | object \| null | `null` | 다른 컨트롤에 의해 트리거되는 동작 설정 |

옵션은 페이지의 `hook.controlInit(elID, setting)`으로도 바꿀 수 있습니다.

## 메서드

모든 메서드는 첫 인자로 컨트롤 `elID`를 받습니다. 아직 로드되지 않은 `elID`에 대해서는 아무 일도 하지 않고 기본값을 반환합니다.

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| `controlLoad` | `controlLoad(elID, setting)` | 컨트롤 초기화(마크업 상 `<syn_signaturepad>`가 자동으로 호출). 이미 로드되어 있으면 기존 항목 반환. 라이브러리가 없으면 예외 |
| `getValue` | `getValue(elID, meta)` | data URL 문자열 반환. 서명이 없으면 `''`, 컨트롤이 없으면 `null`. `setValue` 이미지 로딩 중에는 요청한 값을 그대로 반환 |
| `getBase64` | `getBase64(elID)` | `data:image/...;base64,` 접두사를 뺀 base64 본문만 반환 |
| `setValue` | `setValue(elID, value, meta)` | data URL 또는 순수 base64 문자열을 그림(기존 내용은 교체). 빈 값(`''`/`null`/`undefined`)이면 지움. `Promise<boolean>` 반환(성공 `true`, 해석/로딩 실패 `false`). `change` 이벤트는 발생하지 않음 |
| `clear` | `clear(elID, isControlLoad)` | 서명을 모두 지움. `change` 이벤트는 발생하지 않음 |
| `isEmpty` | `isEmpty(elID)` | 서명이 비어 있으면 `true` |
| `undo` | `undo(elID)` | 마지막 획을 취소. 취소할 획이 없으면 `false`. 취소하면 `change` 이벤트 발생. `setValue`로 불러온 이미지는 취소 대상이 아님 |
| `setPenColor` | `setPenColor(elID, color)` | 이후 그리는 획의 색상 변경 |
| `setReadOnly` | `setReadOnly(elID, isReadOnly)` | 읽기 전용 전환(인자 생략 시 `true`) |
| `setDisabled` | `setDisabled(elID, isDisabled)` | 비활성화 전환(인자 생략 시 `true`). 입력 불가 + 흐리게 표시 |
| `resize` | `resize(elID)` | 영역 크기에 캔버스를 즉시 맞춤. 보통은 ResizeObserver가 자동 처리 |
| `destroy` | `destroy(elID)` | 이벤트/관찰자를 해제하고 캔버스를 제거. 호스트 요소는 남음 |
| `getControl` | `getControl(elID)` | 내부 레지스트리 항목 반환: `{ id, host, canvas, pad, placeholder, setting, readOnly, disabled, ... }`. `pad`는 signature_pad 인스턴스(`toData`/`fromData`/`toSVG` 등 직접 사용 가능) |
| `addModuleList` | `addModuleList(el, moduleList, setting, controlType)` | 폼 컨트롤 목록에 등록(`syn.js`가 호출) |
| `setLocale` | `setLocale(elID, translations, control, options)` | 다국어 텍스트 적용 (현재 구현은 빈 함수) |

### 값 형식

| 입력 값 | `setValue` 처리 |
|---|---|
| `'data:image/png;base64,iVBOR...'` | 그대로 사용 (png/jpeg/gif/webp/svg+xml, base64 인코딩만 지원) |
| `'iVBOR...'` (접두사 없는 base64) | 앞부분으로 형식을 판별해 접두사를 붙임(`iVBOR`=png, `/9j/`=jpeg, `R0lGOD`=gif, `UklGR`=webp, `PHN2Zy`/`PD94bW`=svg). 모르면 png |
| `''`, `null`, `undefined` | 서명을 지움 |
| 그 외(이미지가 아닌 data URL, 객체, 깨진 문자열) | 값을 바꾸지 않고 경고 로그 후 `false` 반환 |

## 이벤트 (syn-events)

`syn-events`에 이름을 적으면 호스트 요소에 DOM 이벤트로 연결되어 페이지의 `<elID>_<eventName>(evt)` 핸들러가 호출됩니다.

| 이벤트 | 시점 | `evt.detail` |
|---|---|---|
| `beginStroke` | 사용자가 획을 시작할 때 | `{ originalEvent }` |
| `endStroke` | 사용자가 획을 끝낼 때 | `{ originalEvent }` |
| `change` | 획이 끝났을 때(`endStroke` 직후), `undo` 했을 때 | `{ value }` — `getValue()`와 같은 data URL |

`setValue`/`clear` 같은 코드 호출로는 `change`가 발생하지 않습니다(무한 루프 방지).

## 참고

- 서명이 없는 상태는 `getValue`가 `''`를 돌려주므로 필수 입력 검사는 `isEmpty(elID)` 또는 `getValue(elID) === ''`로 합니다.
- 서버 저장 시 data URL은 수 KB~수십 KB입니다. 용량이 중요하면 `imageType: 'image/jpeg'` + `imageQuality`를 쓰거나 `getBase64`로 접두사를 제외하고 전송하세요.
- 숨겨진 탭 등 크기가 0인 영역에서 로드되면 표시되는 시점에 자동으로 크기를 맞춥니다.
