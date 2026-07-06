# DropDownList (syn.uicontrols.$select)

## 이 컨트롤은 무엇인가요?

DropDownList는 브라우저의 네이티브 `<select>` 태그를 그대로 사용하면서, 여기에 검색·다중 선택·스타일링 기능을 더한 콤보박스 UI 컨트롤입니다.

내부적으로는 [tail.select](https://github.com/pytesNET/tail.select) 라는 오픈소스 플러그인을 감싸서(wrapping) 동작하며, `syn.uicontrols.$select` 라는 이름의 싱글턴 객체로 등록되어 있습니다. HTML 마크업에서는 항상 `<select>` 태그와 `syn-options` 속성을 사용하고, JavaScript 코드에서는 `syn.uicontrols.$select.메서드명(...)` 형태로 호출합니다.

가장 큰 특징은 옵션 목록(코드값)을 직접 HTML에 나열하지 않고, 데이터소스로부터 자동으로 채워 넣을 수 있다는 점입니다. 데이터소스는 두 가지 방식을 지원합니다.

- 로컬 캐시 JSON: `code/{storeSourceID}.json` 파일을 읽어서 옵션을 구성 (예: `/assets/shared/code/CMM002.json`)
- 원격 데이터소스: `syn.$w.getDataSource`를 통해 서버에서 코드값 목록을 조회

## 언제 사용하나요?

- DropDownList (`$select`): 코드값 하나만 선택하는 일반적인 콤보박스가 필요할 때. 성별, 지역, 상태값처럼 "하나의 값을 고르는" 상황에 사용합니다.
- DropDownCheckList: 옵션 여러 개를 체크박스 형태로 동시에 선택해야 할 때 사용합니다. (`multiSelectAll` 류의 다중 선택 UI가 필요한 경우)
- CodePicker: 코드값이 매우 많거나, 검색/모달 형태의 팝업으로 선택해야 할 때 사용합니다. DropDownList도 `search: true` 옵션으로 자체 검색을 지원하지만, 코드 목록이 아주 많거나 계층 구조를 가진 경우에는 CodePicker가 더 적합합니다.

정리하면, DropDownList는 "가벼운 단일 선택 콤보박스"가 필요한 대부분의 화면에서 기본으로 선택하는 컨트롤입니다.

## 빠른 시작

1페이지에 `<select>` 태그를 배치하고 `id`와 `syn-options` 속성을 지정합니다.

```html
<select id="ddlGender" syn-options="{
    placeholder: '전체',
    storeSourceID: 'CMM002',
    local: true,
    toSynControl: true
}"></select>
```

2페이지 하단에 `syn.loader.js` 스크립트 한 줄만 추가하면, 로더가 필요한 CSS/JS(`DropDownList.js`, `DropDownList.css`, `tail.select` 등)를 자동으로 주입하고 컨트롤을 초기화합니다.

```html
<script src="/js/syn.loader.js"></script>
```

3값을 읽거나 설정할 때는 페이지 스크립트에서 `syn.uicontrols.$select`를 사용합니다.

```js
// 선택된 값 조회
var value = syn.uicontrols.$select.getValue('ddlGender');

// 값 설정 (코드값 기준)
syn.uicontrols.$select.setValue('ddlGender', '1');
```

## 예제 실행하기

이 폴더의 `example` 디렉토리에 초보자용 실행 예제가 있습니다. 웹 서버를 통해 `/uicontrols/DropDownList/example/*.html` 경로로 접속해서 바로 확인할 수 있습니다.

- `basic.html`: 정적인 옵션 목록을 마크업에 그대로 담아 사용하는 가장 단순한 예제
- `localdatasource.html`: 로컬 캐시 JSON(`code/{storeSourceID}.json`)을 데이터소스로 사용하는 예제
- `remotedatasource.html`: 원격 데이터소스(`local: false`)를 사용해 서버에서 코드값을 조회하는 예제
- `events.html`: `change` 이벤트, `getSelectedValue`/`setSelectedValue` 등 값 조작 API를 함께 보여주는 예제

각 예제는 `<script src="/js/syn.loader.js"></script>` 한 줄만으로 동작하도록 만들어졌습니다.

## 더 알아보기

- 전체 옵션(Options), 메서드, 이벤트 목록은 같은 폴더의 [API.md](./API.md) 문서를 참고하세요.
- 실제 소스 코드는 `DropDownList.js`, `DropDownList.css` 파일에서 확인할 수 있습니다.
- tail.select 플러그인 자체의 세부 동작(예: `getControl`로 얻은 picker 객체의 메서드)은 [tail.select GitHub Wiki](https://github.com/pytesNET/tail.select/wiki)를 참고하세요.
