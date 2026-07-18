# DataSource (syn.uicontrols.$data)

## 이 컨트롤은 무엇인가요?

DataSource는 화면에 아무것도 그리지 않는(`display: none`) 데이터 저장 노드입니다. `<syn_data>` 태그로 선언하면 페이지 안에 이름이 있는 자바스크립트 객체(또는 배열) 저장소 하나가 만들어지고, 다른 컨트롤(TextBox, CheckBox, Grid 등)이 여기에 "바인딩"되어 값을 주고받습니다.

즉, DataSource 자체는 입력창도 버튼도 아니고, 화면의 입력 컨트롤들과 서버 전송(트랜잭션) 사이에 값을 모아두는 "그릇" 역할만 합니다.

```html
<syn_data id="srcForm" syn-options="{
    dataSourceID: 'FormStore',
    storeType: 'Form',
    columns: [
        { data: 'Name', dataType: 'string' },
        { data: 'Age', dataType: 'number' }
    ]
}"></syn_data>
```

내부적으로는 `columns`에 정의된 각 필드에 대해 `Object.defineProperty`로 getter/setter가 만들어지고, 그 필드에 `syn-datafield`로 바인딩된 입력 컨트롤(`bindingID: 'FormStore'`)의 `getValue`/`setValue`를 자동으로 호출해 줍니다. 그래서 "DataSource에 값을 저장한다"는 것은 실제로는 "바인딩된 화면 컨트롤의 값을 읽고 쓴다"는 뜻입니다.

## 언제 사용하나요?

DataSource는 `storeType` 옵션 값에 따라 두 가지 형태로 사용합니다.

| storeType | 저장 형태 | 사용 시점 |
| --- | --- | --- |
| `Form` (기본값) | 객체 1개(단일 레코드) | 상세/등록/수정 화면처럼 필드 여러 개를 한 건의 데이터로 다룰 때. TextBox, CheckBox, DropDownList 등을 `bindingID`로 연결 |
| `Grid` (또는 리스트 계열) | 배열(레코드 여러 건) | 목록/그리드 화면처럼 여러 행을 다룰 때. Grid, GridList 등을 `bindingID`로 연결 |

두 경우 모두 서버 조회/저장 트랜잭션(`transactConfig`)의 입력(input) 또는 출력(output) 대상으로 지정해서, 조회 결과를 화면에 뿌리거나 화면에서 입력한 값을 서버로 보낼 때 중간 저장소로 사용합니다. Grid 형태에서는 각 행마다 `Flag` 값(`R`/`C`/`U`/`D`)으로 조회 이후 무엇이 바뀌었는지를 추적합니다.

## 빠른 시작

```html
<syn_data id="srcForm" syn-options="{
    dataSourceID: 'FormStore',
    storeType: 'Form',
    columns: [
        { data: 'Name', dataType: 'string' },
        { data: 'Age', dataType: 'number' }
    ]
}"></syn_data>

<input type="text" id="txtName" syn-datafield="Name" syn-options="{bindingID: 'FormStore'}">
<input type="text" id="txtAge" syn-datafield="Age" syn-options="{editType: 'number', bindingID: 'FormStore'}">

<script src="/js/syn.loader.js"></script>
```

`syn.loader.js` 한 줄만 추가하면 필요한 CSS/JS가 자동으로 주입되고, `bindingID: 'FormStore'`가 지정된 입력 컨트롤들이 `srcForm` DataSource와 자동으로 연결됩니다.

값을 읽거나 초기화할 때는 컨트롤 API를 사용합니다.

```js
// isAll을 true로 줘야 필드 값이 모두 채워진 전체 레코드를 돌려받습니다.
var record = syn.uicontrols.$data.getValue('srcForm', true);

// Form의 각 필드를 columns에 정의한 dataType 기본값으로 되돌립니다.
syn.uicontrols.$data.clear('srcForm');
```

> DataSource는 `setValue`를 지원하지 않습니다("지원 안함"으로 구현되어 있음). 값을 바꾸려면 바인딩된 화면 컨트롤(TextBox.setValue, Grid.setValue 등)을 사용해야 DataSource에도 값이 반영됩니다.
>
> 반대로 `clear()`는 내부 저장소 값만 초기화할 뿐, 이미 화면에 바인딩된 입력 컨트롤의 표시 값까지 자동으로 지워주지는 않습니다.

## 예제 실행하기

아래 예제 파일들을 브라우저로 열어 실제 동작을 확인할 수 있습니다. (`/uicontrols/DataSource/example/` 경로)

- `form.html` - `storeType: 'Form'`, 입력 컨트롤과 1:1 필드 바인딩, getValue/clear 예제
- `grid.html` - `storeType: 'Grid'`, 배열 데이터 바인딩과 행 추가/삭제에 따른 `Flag`(R/C/U/D) 변화 예제
- `getset.html` - `getValue(elID, isAll)`의 기본/전체 조회 차이, `setValue` 미지원, `clear` 동작 데모
- `exception.html` - 실무에서 가장 흔한 패턴: 저장 트랜잭션 실패 시 오류 내용을 담아두는 `Exception` 저장소와, 확인 후 `clear`로 비우는 흐름
- `worklist.html` - 그리드 컨트롤 없이 `storeType: 'Grid'` 배열만 `push`/`splice`로 직접 다루는 업무 목록(전자결재 결재선 등) 패턴

각 예제는 `<script src="/js/syn.loader.js"></script>` 한 줄만으로 동작하며, 버튼을 눌러 콘솔/로그 영역에서 결과를 확인할 수 있습니다.

## 더 알아보기

- 자세한 옵션/메서드/이벤트 목록은 같은 폴더의 [API.md](./API.md)를 참고하세요.
- 실제 소스는 `DataSource.js`, `DataSource.css` 파일을 참고하세요.
