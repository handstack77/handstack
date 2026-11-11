# SignaturePad (syn.uicontrols.$signaturepad)

## 이 컨트롤은 무엇인가요?

SignaturePad는 마우스·터치·펜으로 서명을 입력받는 컨트롤입니다. 오픈소스 [signature_pad](https://github.com/szimek/signature_pad)(szimek, MIT, v5.1.4)를 감싸며, 획의 속도에 따라 굵기가 달라지는 자연스러운 선으로 그려집니다.

값은 **base64 data URL 문자열**(`data:image/png;base64,iVBOR...`)로 주고받습니다. 그래서 서명을 일반 문자열 필드처럼 JSON에 담아 서버로 보내거나, `<img src>`에 바로 넣어 보여줄 수 있습니다.

- `getValue` : 서명이 있으면 data URL 문자열, 없으면 빈 문자열(`''`)
- `setValue` : data URL 또는 접두사 없는 순수 base64 문자열을 받아 그림. 빈 값이면 지움

## 언제 사용하나요?

- 인수증, 동의서, 계약서, 점검 확인서처럼 화면에서 직접 서명을 받아야 할 때
- 서명 이미지를 DB/파일에 문자열로 저장했다가 다시 화면에 복원해야 할 때

| 구분 | SignaturePad | FileClient |
|---|---|---|
| 용도 | 화면에서 직접 그린 서명 | 이미 만들어진 파일 업로드/다운로드 |
| 값 | base64 data URL 문자열 | 파일 목록/업로드 정보 |

## 빠른 시작

```html
<syn_signaturepad id="sigReceiver" syn-datafield="ReceiverSignature" syn-events="['change']" syn-options="{
    height: '200px',
    penColor: '#1e3a8a'
}"></syn_signaturepad>
```

```javascript
'use strict';
let $mypage = {
    event: {
        sigReceiver_change(evt) {
            // 사용자가 획을 그리거나 undo 했을 때 발생. evt.detail.value 는 getValue() 와 같은 값
        },

        async btnSave_click() {
            if (syn.uicontrols.$signaturepad.isEmpty('sigReceiver') == true) {
                return;
            }

            // 'data:image/png;base64,...' 문자열
            var signature = syn.uicontrols.$signaturepad.getValue('sigReceiver');
        },

        async btnLoad_click(signature) {
            // 저장해 둔 값을 복원 (이미지 로딩이 끝나면 완료되는 Promise<boolean>)
            await syn.uicontrols.$signaturepad.setValue('sigReceiver', signature);
        }
    }
}
```

`/js/syn.loader.js`가 `syn_signaturepad` 태그를 인식해 signature_pad 라이브러리(`/lib/signature_pad/dist/signature_pad.umd.min.js`)와 컨트롤 파일을 자동으로 불러오므로 별도 스크립트 태그가 필요 없습니다. 라이브러리는 `libman restore`로 내려받습니다(`libman.json`에 등록되어 있음).

## 동작 방식

- 원본 `<syn_signaturepad>` 요소가 그대로 서명 영역이 되며, 안에 `<canvas>`가 만들어집니다. 요소 `id`와 `syn-datafield`는 바뀌지 않습니다.
- 영역 크기가 바뀌면(ResizeObserver) 캔버스 해상도를 다시 맞추고 그려 둔 내용을 유지합니다. 고해상도(devicePixelRatio) 화면도 선명하게 그려집니다.
- `readOnly`/`setDisabled` 상태에서는 입력만 막히며 `setValue`로는 값을 바꿀 수 있습니다.
- `imageType: 'image/jpeg'` 처럼 투명도를 지원하지 않는 형식을 쓰면 투명 배경이 검게 저장되므로 배경색이 자동으로 흰색으로 바뀝니다.
- `setValue`로 불러온 이미지는 현재 영역 크기에 맞춰 늘려 그립니다. 가로세로 비율이 다른 영역에 불러오면 이미지가 늘어날 수 있으니 같은 비율의 영역을 쓰세요.
- `undo`는 사용자가 그린 획만 취소합니다(`setValue`로 불러온 이미지는 대상이 아님).

## 예제 실행하기

`example/` 폴더에 다음 예제가 있습니다. 실행 중인 사이트에서 아래 경로로 바로 열어볼 수 있습니다.

- `example/basic.html` — 기본 서명 입력, `getValue`로 값을 읽어 미리보기
- `example/getset.html` — `getValue`/`getBase64`/`setValue`/`clear`로 값을 읽고 쓰는 방법(순수 base64, 잘못된 값 처리 포함)
- `example/features.html` : 전체 기능 확인 - 모든 옵션/메서드/이벤트를 한 화면에서 확인하는 예제
- `example/practical.html` : 물품 수령 확인(실무형) - 입력 검증/저장/불러오기 흐름을 반영한 예제

별도 샘플 페이지는 `/sample/uicontrol/signaturepad.html`입니다.

## 더 알아보기

전체 옵션/메서드/이벤트 목록은 [API.md](./API.md)를 참고하세요.
