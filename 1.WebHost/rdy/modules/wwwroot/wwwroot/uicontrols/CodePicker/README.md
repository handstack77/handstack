# CodePicker (syn.uicontrols.$codepicker)

## 이 컨트롤은 무엇인가요?

CodePicker는 "코드값 검색 팝업" 패턴을 구현한 UI 컨트롤입니다. 하나의 `<syn_codepicker>` 태그를 화면에 배치하면, 컨트롤이 초기화되면서 실제로는 아래 3개의 엘리먼트로 확장됩니다.

- `<id>_Code` : 실제 값(코드값)을 담는 입력창
- `<id>_Text` : 코드값에 해당하는 이름(텍스트)을 보여주는 입력창
- `<id>_Button` : 돋보기 아이콘 버튼. 클릭하면 검색 팝업(코드도움 다이얼로그)이 열립니다.

사용자가 돋보기 버튼을 누르거나 `_Code`/`_Text` 입력창에서 Enter를 치면, `syn.uicontrols.$codepicker.find()`가 호출되어 `dataSourceID`로 지정한 데이터소스를 검색할 수 있는 팝업창(`codeHelpUrl`, 기본적으로 `/assets/shared/codehelp/index2.html`)을 띄웁니다. 팝업에서 항목을 선택하면 그 결과가 다시 `_Code`(코드값)와 `_Text`(코드명)에 채워집니다.

즉, CodePicker는 "화면에 코드 목록을 미리 다 그려놓는" 방식이 아니라, "필요할 때 팝업으로 검색해서 하나(또는 여러 개)를 골라오는" 방식의 컨트롤입니다. 컨트롤 자체 외에도 Handsontable 기반 WebGrid의 커스텀 셀 타입(`registerCellType('codehelp', ...)`)으로도 동일한 팝업 검색 기능을 사용할 수 있지만, 이 문서는 단독 입력 컨트롤로 사용하는 방법을 기준으로 설명합니다.

## 언제 사용하나요?

- DropDownList (`$select`): 코드값 개수가 적당히 적고(수십 개 이내), 화면에 옵션을 미리 다 나열해도 괜찮은 경우에 사용합니다. 성별, 지역, 상태값처럼 "목록에서 하나 고르기"에 적합합니다.
- CodePicker (`$codepicker`): 코드값(마스터 데이터)이 매우 많거나(예: 거래처, 상품, 사용자 목록), 조건을 입력해서 검색한 뒤 골라야 하는 경우에 사용합니다. 드롭다운으로 나열하기엔 항목이 너무 많을 때 적합한 선택입니다.

정리하면, "옵션 개수가 적으면 DropDownList, 많고 검색이 필요하면 CodePicker"가 기본 기준입니다.

## 빠른 시작

1. 페이지에 `<syn_codepicker>` 태그를 배치하고 `id`, `syn-datafield`, `syn-options` 속성을 지정합니다.

```html
<syn_codepicker id="chpCompanyID" syn-datafield="CompanyID" syn-options="{
    belongID: 'LD01',
    dataSourceID: 'BDLCHP011',
    local: false,
    isMultiSelect: false,
    textBelongID: ['LD01'],
    textDataFieldID: 'CompanyName',
    controlText: '업체 명'
}"></syn_codepicker>
```

2. 페이지 하단에 `syn.loader.js` 스크립트 한 줄만 추가하면, 로더가 필요한 CSS/JS(`CodePicker.js`, `CodePicker.css` 등)를 자동으로 주입하고 컨트롤을 초기화합니다.

```html
<script src="/js/syn.loader.js"></script>
```

3. 값을 읽거나 설정할 때는 페이지 스크립트에서 `syn.uicontrols.$codepicker`를 사용합니다.

```js
// 코드값 조회
var value = syn.uicontrols.$codepicker.getValue('chpCompanyID');

// 코드값 직접 설정
syn.uicontrols.$codepicker.setValue('chpCompanyID', '1000');

// 검색 팝업을 코드로 직접 여는 방법(돋보기 버튼 클릭과 동일)
syn.uicontrols.$codepicker.open('chpCompanyID');
```

## 예제 실행하기

이 폴더의 `example` 디렉토리에 초보자용 실행 예제가 있습니다. 웹 서버를 통해 `/uicontrols/CodePicker/example/*.html` 경로로 접속해서 바로 확인할 수 있습니다.

- `basic.html`: CodePicker를 배치하고 돋보기 버튼으로 검색 팝업을 여는 가장 단순한 예제
- `events.html`: 실무에서 가장 흔한 연동(Cascading) 코드피커 패턴 - 업체를 고르면 담당자 피커의 조회 조건(`parameters`)이 좁혀지고, 업체를 다시 바꾸면 담당자 값이 초기화됨

각 예제는 `<script src="/js/syn.loader.js"></script>` 한 줄만으로 동작하도록 만들어졌습니다.

주의: 실제 팝업 검색 화면(`codeHelpUrl`)은 서버에 등록된 `dataSourceID`가 실제 데이터를 응답해야 정상적으로 항목이 표시됩니다. 예제 화면 자체는 CodePicker 컨트롤의 마크업/이벤트/API 사용법을 보여주는 데 초점을 맞췄습니다.

## 더 알아보기

- 전체 옵션(Options), 메서드, 이벤트 목록은 같은 폴더의 [API.md](./API.md) 문서를 참고하세요.
- 실제 소스 코드는 `CodePicker.js` 파일에서 확인할 수 있습니다.
- 팝업 검색 화면 자체(코드도움 다이얼로그, `index2.html`)의 동작은 이 컨트롤의 범위 밖이며, 서버 쪽 데이터소스(`dataSourceID`) 설정과 함께 별도로 관리됩니다.
