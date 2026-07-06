# ColorPicker (syn.uicontrols.$colorpicker)

## 이 컨트롤은 무엇인가요?

ColorPicker는 색상 값을 `#RRGGBB` 형태의 16진수 문자열로 입력받는 컨트롤입니다. 내부적으로 경량 색상 선택 라이브러리(`CP`, `/js/color-picker/color-picker.js`)를 사용하며, 화면에는 두 부분이 렌더링됩니다.

- 색상 코드를 직접 타이핑할 수 있는 텍스트 입력창(실제로는 `TextBox` 컨트롤로 로드됨, 자동 마스크 `#SSSSSS` 적용)
- 클릭하면 색상 팔레트 팝업(그러데이션 선택 영역 + 미리 정의된 색상 스와치 20개)을 여는 버튼

두 방식 모두 같은 값을 공유하므로, 사용자는 팔레트를 클릭해서 고르거나 코드를 직접 입력해서 색상을 지정할 수 있습니다.

## 언제 사용하나요?

- 배경색, 글자색, 라벨 색상 등 관리 화면에서 색상값을 저장해야 할 때
- 사용자가 미리 정의된 색상 팔레트 중에서 고르되, 필요하면 임의의 16진수 색상도 직접 입력할 수 있어야 할 때

단순히 몇 가지 정해진 색상 중 하나만 고르면 되는 경우라면 `DropDownList`가 더 간단할 수 있습니다.

## 빠른 시작

```html
<syn_colorpicker id="clpBackgroundColor" syn-datafield="BackgroundColor" syn-options="{
    defaultColor: 'FF0000'
}"></syn_colorpicker>
```

`/js/syn.loader.js`가 `syn_colorpicker` 태그를 자동으로 인식해 필요한 CSS/JS(`/js/color-picker/color-picker.js` 등)를 알아서 불러오므로, 별도의 스크립트 태그를 추가할 필요가 없습니다. 페이지 맨 아래에 `<script src="/js/syn.loader.js"></script>` 한 줄만 있으면 됩니다.

## 예제 실행하기

`example/` 폴더에 다음 예제가 있습니다. 실행 중인 사이트에서 아래 경로로 바로 열어볼 수 있습니다.

- `example/basic.html` — 기본 색상 선택기, 미리 정의된 색상(`defaultColor`) 지정
- `example/getset.html` — `getValue`/`setValue`/`clear` 메서드로 값을 읽고 쓰는 방법

## 더 알아보기

전체 옵션/메서드 목록은 [API.md](./API.md)를 참고하세요.
