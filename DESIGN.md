# DESIGN.md

## 문서 정보

| 항목 | 내용 |
|---|---|
| 적용 범위 | `wwwroot` 화면 HTML |
| 적용 원칙 | **신규 화면은 필수 준수. 기존 화면은 수정하는 범위 내에서만 점진 적용** (일괄 리팩터링 금지) |
| 개정 절차 | 규칙 변경 시 이 문서를 먼저 수정하고, 근거가 되는 실제 화면 경로를 함께 기록 |

이 문서는 AI(코딩 어시스턴트)와 개발자가 이 프로젝트에서 화면(HTML)을 작성할 때 따라야 할 UI 규칙을 정의합니다. 일반 Tabler 문서(`https://docs.tabler.io/ui`)와 다른 부분이 많으므로, **Tabler 공식 문서보다 이 문서가 우선**합니다. 이 문서의 규칙은 예시가 아니라 실제 운영 화면에서 반복 확인된 관례이며, 새 패턴이 필요하면 먼저 기존 화면에 유사 사례가 있는지 확인한 뒤 이 문서에 반영합니다.

---

## 1. 기술 스택 계층

이 프로젝트의 화면은 세 개의 계층이 조합되어 동작합니다. 각 계층의 역할을 혼동하지 마세요.

```text
HandStack (syn.loader.js)          ← 화면 로딩, 데이터 바인딩(syn-datafield), 컴포넌트(syn_*), 팝업
├─ Tabler CSS (Bootstrap 5 기반)   ← 레이아웃·카드·버튼·폼·배지 등 시각 컴포넌트
└─ Master CSS (런타임 엔진)         ← f:20, w:120, mr:4 같은 단축 유틸리티 클래스
```

- **Tabler**: CDN으로 로드됩니다 (`@tabler/core`). 일부 화면은 `@latest`를 사용 중이므로, **신규 참조 작성 시에는 버전을 고정**(`@tabler/core@1.3.2` 등)하는 것을 권장합니다. `@latest`는 예고 없는 스타일 변경 리스크가 있습니다.
- **Master CSS**: `syn.loader.js`가 런타임에 `/lib/master-css/index.min.js`를 로드하여 `f:20` 같은 클래스를 실제 CSS로 변환합니다. 빌드 도구가 아니라 **런타임 엔진**이므로, 클래스만 정확히 쓰면 별도 빌드 없이 동작합니다. 끝의 `!`(예: `f:12!`)는 Master CSS의 `!important` 문법입니다.
- **아이콘**: Tabler Icons 웹폰트(`ti ti-*`)만 사용합니다.

---

## 2. 화면 유형 분류

새 화면을 만들기 전에 어떤 유형인지 먼저 결정하고, 해당 유형의 템플릿(6장)을 따르세요.

| 유형 | 특징 | 핵심 구성 |
|---|---|---|
| 목록(조회) 화면 | 검색 조건 + 데이터 그리드 | 필터 카드 + `syn_auigrid` 카드 (+ 하단 액션 영역) |
| 상세(입력) 화면 | 단건 조회/등록/수정 폼 | `row` + `col-N col-form-label` 라벨 폼 카드 (좁은 필터형은 `input-group`) |
| 사이드 패널형 화면 | 좌측 메타 정보 + 우측 본문(그리드/iframe) | `row g-0` + `col-3 border-r`(좌) + `col`(우), 좌측은 `card-header`를 여러 번 반복하는 nested 섹션 |
| 팝업 화면 | 다른 화면에서 호출되는 다이얼로그 | `simplemodal-data` 패턴 (Bootstrap modal 아님) |
| 보고서/인쇄 화면 | RPT 계열, 인쇄 전용 | `<body class="bg-white">` + 좁은 컨테이너 폭, 화면 전용 `<style>` 허용 (유일한 예외) |

---

## 3. 명명·파일 규칙

- 화면 파일은 `{업무코드 3자}{일련번호 3자리}.html`과 동일 이름의 `.js`가 한 쌍입니다. 예: `ATM030.html` + `ATM030.js`
  - 파생 화면(팝업 등)은 일련번호 끝자리로 구분: `ATM010` → `ATM011`, `ATM012`
  - 보고서 화면은 `RPT` 접두어를 사용
- 경로 구조: `modules/{모듈}/wwwroot/{모듈}/view/{시스템}/{업무}/{화면ID}.html`
- 데이터 바인딩 식별자(`syn-datafield`)는 PascalCase를 사용: `MainForm`, `Grid1`, `Name`
- HTML을 만들면 반드시 짝이 되는 `.js`도 함께 만들거나, 팝업 조각처럼 JS가 불필요한 경우 그 이유를 명시합니다.
- 화면 사용법을 설명하는 `{화면ID}.md`(버튼별 동작 설명표 등)가 함께 있는 경우가 있습니다(`CRM081.md`, `ODM011.md` 등). 버튼 동작이 복잡한 팝업/상세 화면을 만들 때는 이 관례를 참고해 필요 시 함께 작성합니다.

---

## 4. 색상 및 타이포그래피 규칙

### 4.1 색상

Tabler CSS 변수 및 `bg-*`/`text-*` 유틸리티만 사용합니다. 임의의 HEX 색상 지정은 금지합니다.

```md
Primary:  --tblr-primary   → btn-primary, text-primary
Success:  --tblr-success   → bg-success (완료/승인)
Danger:   --tblr-danger    → bg-danger (취소/반려/오류, 삭제 버튼)
Warning:  --tblr-warning   → bg-warning (대기/주의)
Muted:    bg-muted-lt      → 읽기전용 입력값 배경, 아이콘 전용 보조 버튼 배경
```

- **상태 표시는 배지(`badge bg-*`)보다 상태 필터 버튼그룹이 실제 관례입니다.** 검색 카드 안에 `btn-group` + `btn bg-muted-lt` 버튼을 나열해 "전체/진행중/완료/반려" 같은 상태를 토글하는 방식이 표준입니다. 그리드 내부의 상태 컬럼도 배지가 아니라 일반 텍스트 컬럼으로 표시하고, 색상이 필요하면 JS 렌더러에서 상태 코드 → 색상 클래스 매핑 함수로 처리합니다. `badge` 클래스는 이 두 근거 디렉터리에서 실사용 사례가 없으므로, 배지가 필요한 예외적인 화면(대시보드 등)에서만 아래 팔레트를 참고해 최소로 사용하세요.
- 배지를 쓰는 예외 화면의 색상 규칙:
  - 완료/승인 → `bg-green` 또는 `bg-success`
  - 취소/반려/실패 → `bg-red` 또는 `bg-danger`
  - 대기/진행중 → `bg-yellow` 또는 `bg-warning`
  - 세부 상태가 많으면 Tabler 팔레트(`bg-blue`, `bg-cyan`, `bg-purple`, `bg-indigo`, `bg-orange`)와 `-lt` 변형 사용
  - **상태 값이 코드 테이블에서 오는 경우, 색상을 HTML에 하드코딩하지 말고 JS에서 상태 코드 → 색상 클래스 매핑 함수를 두고 그리드 렌더러에서 적용**합니다. 동일 상태 코드는 모듈이 달라도 같은 색을 쓰는 것이 원칙입니다.

- 기본 팔레트(`blue`, `azure`, `indigo`, `purple`, `pink`, `red`, `orange`, `yellow`, `lime`, `green`, `teal`, `cyan`)는 행동 유도나 의미 있는 상태처럼 구분이 필요한 요소에만 사용합니다. 한 화면에서 의미 없이 여러 강조색을 섞지 않습니다.
- 라이트 팔레트(`bg-*-lt`)는 보조 버튼, 선택 상태의 은은한 배경, 정보성 보조 영역처럼 낮은 강조가 필요한 경우에 사용합니다. 본문 텍스트의 유일한 전달 수단으로 사용하지 않아야 합니다.
- 레이아웃 배경, 구분선, 비활성·보조 텍스트는 Tabler 회색 팔레트(`gray-50`~`gray-950`)와 `text-secondary`/`text-muted` 계열을 우선합니다. 배경·테두리·텍스트에 각각 임의의 색을 지정해 대비 체계를 깨지 않습니다.
- 색상만으로 상태·오류·필수 여부를 전달하지 않습니다. 상태명, 아이콘, 유효성 메시지 등 텍스트 또는 시각적 단서를 함께 제공합니다.
- 팔레트와 유틸리티의 최신 목록은 [Tabler Colors](https://docs.tabler.io/ui/base/colors)를 참고하되, 이 문서의 상태 매핑과 HEX 사용 금지 규칙을 우선합니다.

### 4.2 타이포그래피

- 문서와 화면의 구조는 의미에 맞는 HTML 요소로 작성합니다. 화면의 최상위 제목은 `h1` 또는 프로젝트 골격의 `h2.page-title` 중 기존 화면 관례를 따르고, 하위 섹션은 순서를 건너뛰지 않는 `h2`~`h6` 제목으로 계층을 표현합니다. 단순히 글자를 크게 보이게 하려고 제목 태그를 사용하지 않습니다.
- 일반 설명과 안내 문구는 `p`로 묶어 문단을 구분합니다. 줄바꿈을 반복하거나 빈 요소로 간격을 만들지 말고, 기존 Tabler·Master CSS 유틸리티를 사용합니다.
- 강조는 의미에 따라 `strong`, `em`, `code`, `kbd`, `time`, `abbr` 등 시맨틱 요소를 사용합니다. `b`, `i`, 밑줄 및 임의의 색상만으로 의미를 표현하지 않습니다.
- 글자 크기와 아이콘 크기는 5장의 Master CSS `f:NN` 규칙을 따르며, 인라인 `font-size`나 새 타이포그래피 CSS 클래스를 만들지 않습니다. 보조 텍스트는 제목보다 작고 낮은 대비로, 핵심 업무 값과 오류 메시지는 충분히 식별 가능하게 유지합니다.
- Tabler의 제목·문단·시맨틱 텍스트 요소 사용 예시는 [Tabler Typography](https://docs.tabler.io/ui/base/typography)를 참고하되, 이 프로젝트의 좌측 라벨 폼 규칙(6.3)이 우선합니다.

---

## 5. Master CSS 유틸리티 규칙

Bootstrap 표준 유틸리티(`fs-*`, `w-*`, `me-*`) 대신 Master CSS 단축 표기를 우선 사용합니다 (기존 화면과의 통일성).

| 목적 | 클래스 예시 | 비고 |
|---|---|---|
| 폰트 크기 | `f:12`, `f:18`, `f:20`, `f:12!` | 숫자는 px |
| 너비 | `w:100`, `w:120`, `w:120!` | 라벨·인풋 고정 너비 |
| 여백 | `mr:4`, `mr:2`, `p:10!` | |
| 테두리 | `b:1` | |
| 줄 높이 | `line-height:40` | |
| 컨테이너 폭 | `max-width:1600!`, `min-width:1536 max-width:1920!`, `max-width:1000!`, `max-width:1200!` | 화면 성격별로 다름 (6.1 참고) |

- 끝의 `!`는 Master CSS의 important 문법입니다. 기존 스타일을 덮어써야 할 때만 사용합니다.
- 인라인 `style=""`은 `display:none`, `visibility:hidden` 같은 **JS 상태 토글 용도로만** 허용합니다. 색상·크기·여백을 인라인 style로 넣지 마세요.

---

## 6. 화면 유형별 표준 템플릿

### 6.1 페이지 골격 (모든 화면 공통)

HandStack 화면은 완전한 HTML 문서가 아니라 `syn.loader.js`가 로드하는 **프래그먼트**입니다.

```html
<body style="visibility:hidden">
    <form id="form1" syn-datafield="MainForm">
        <div class="page">
            <div class="page-wrapper">
                <div class="page-header mt-2 d-print-none">
                    <div class="container-fluid max-width:1600!">
                        <div class="row g-2 align-items-center">
                            <div class="col">
                                <div class="page-pretitle f:12!">모듈명 &gt; 메뉴명</div>
                                <h2 class="page-title">화면 제목</h2>
                            </div>
                            <div class="col-auto ms-auto d-print-none">
                                <div class="btn-list">
                                    <!-- 페이지 헤더 우측 주요 액션(신규/기안 등) -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="page-body mt-2">
                    <div class="container-fluid max-width:1600!">
                        <!-- 화면 유형별 본문 -->
                    </div>
                </div>
            </div>
        </div>
    </form>
</body>
```

- 컨테이너는 `container-xl`이 아니라 **`container-fluid`** + Master CSS 폭 제어를 사용합니다. `container-xl`이 남아있는 화면은 리팩터링 대상이며 새 화면에는 절대 쓰지 않습니다.
- 실제 폭 값은 화면 성격에 따라 관례가 갈립니다. 신규 화면은 **모듈 내 기존 화면과 동일한 값**을 따르세요(다른 모듈이라도 임의로 값을 바꾸지 않습니다):
  - 일반 목록/상세 화면: `max-width:1600!`
  - 팝업/좁은 폭 화면: `max-width:1200!`
  - 인쇄/결재문서 폼(RPT 계열): `max-width:1000!`
- `page-header`는 `mt-2 d-print-none`을 함께 붙이는 경우가 많습니다(인쇄 시 헤더 숨김). 페이지 헤더 우측에 주요 액션(신규 등록, 기안하기 등)이 있으면 `col-auto ms-auto d-print-none` + `btn-list`로 배치합니다.
- `<body style="visibility:hidden">`은 렌더링 완료 후 HandStack이 해제하므로 그대로 유지합니다. RPT 계열은 `<body class="bg-white" style="visibility:hidden">`처럼 `bg-white` 클래스를 추가로 붙입니다.

### 6.2 목록(조회) 화면

검색 필터 카드와 그리드 카드를 분리하고, 목록은 반드시 `syn_auigrid`로 구현합니다.

```html
<!-- 검색 필터 카드 -->
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-body">
        <div class="row g-2">
            <div class="col-3">
                <div class="input-group">
                    <label class="w:100 col-form-label px-2">이름</label>
                    <input type="text" class="form-control" syn-datafield="Name" />
                </div>
            </div>
            <div class="col-3">
                <div class="input-group">
                    <label class="w:100 col-form-label px-2">상태</label>
                    <div class="btn-group">
                        <button type="button" id="btnStatus0" syn-events="['click']" class="btn bg-muted-lt">전체</button>
                        <button type="button" id="btnStatus1" syn-events="['click']" class="btn bg-muted-lt">진행중</button>
                        <button type="button" id="btnStatus2" syn-events="['click']" class="btn bg-muted-lt">완료</button>
                    </div>
                </div>
            </div>
            <div class="col text-end">
                <button type="button" class="btn btn-primary">
                    <i class="f:20 mr:4 ti ti-search"></i> 조회
                </button>
            </div>
        </div>
    </div>
</div>

<!-- 목록 카드 -->
<div class="card mt-2">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-header">
        <h3 class="card-title">목록</h3>
        <div class="card-actions">
            <div class="btn-group">
                <button type="button" class="btn btn-icon bg-muted-lt">
                    <i class="f:18 ti ti-plus"></i>
                </button>
            </div>
        </div>
    </div>
    <div class="form-fieldset p-0">
        <syn_auigrid syn-datafield="Grid1"
            syn-options="{columns:[
                {header:'번호', dataField:'Seq', width:60},
                {header:'이름', dataField:'Name'},
                {header:'상태', dataField:'Status', width:100}
            ]}">
        </syn_auigrid>
    </div>
</div>

<!-- 하단 액션바 (필요 시) -->
<div class="card-footer text-end p-2">
    <div class="btn-list">
        <button type="button" class="btn bg-muted-lt">취소</button>
        <button type="button" class="btn btn-primary">
            <i class="f:20 mr:4 ti ti-check"></i> 저장
        </button>
    </div>
</div>
```

- 목록 카드 안에서 그리드를 감싸는 컨테이너는 `form-fieldset p-0`가 사실상 표준 래퍼입니다. `card-body p-0`도 동일 목적으로 쓰이지만 새 화면은 `form-fieldset p-0`를 우선하세요.
- 카드 헤더 우측 액션은 `card-header > card-actions > btn-group` 3단 구조가 표준입니다. 아이콘 전용 액션 버튼은 `btn btn-icon bg-muted-lt`를 사용합니다(단순 `btn-primary`가 아님) — 신규/추가처럼 카드 헤더에 놓이는 보조 액션은 눈에 띄되 주 액션 색은 아닙니다.
- 상태 필터는 배지가 아니라 `btn-group` + `btn bg-muted-lt` 토글 버튼으로 구현합니다(4장 참고). Tabler의 `nav-tabs`/`tab-pane`은 이 근거 화면들에서 쓰이지 않으므로, 탭이 필요해 보이는 상황에서도 우선 이 버튼그룹 패턴을 검토하세요.
- 하단 고정 액션바가 필요한 극히 일부 화면만 `sticky-bottom`을 쓰고, 대다수는 `card-footer text-end p-2` + `btn-list`로 충분합니다. 화면이 길어 스크롤 중에도 액션이 보여야 하는 경우에만 `sticky-bottom`을 추가하세요.

### 6.3 상세(입력) 화면

라벨 배치는 화면 성격에 따라 **두 가지 정형 패턴**이 있습니다. 일반 Tabler 문서의 "라벨은 인풋 위" 규칙은 어느 쪽도 아니므로 따르지 마세요.

**(A) 검색 필터·좁은 폼**: `input-group` 내부 왼쪽에 라벨 배치.

```html
<div class="input-group">
    <label class="w:100 col-form-label px-2">이름</label>
    <input type="text" class="form-control" syn-datafield="Name" />
</div>
```

**(B) 마스터/상세 등록·수정 폼**: `row` + `col-N col-form-label` 라벨 + `col`/`col-N` 입력 영역. 필수 입력은 라벨에 `required` 클래스만 추가하면 `*` 표시가 자동으로 붙습니다(별도 텍스트 `*`를 하드코딩하지 않음).

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-header">
        <h3 class="card-title">기본 정보</h3>
    </div>
    <div class="card-body">
        <div class="row mb-2">
            <label class="col-2 col-form-label required">이름</label>
            <div class="col-4">
                <input type="text" class="form-control" syn-datafield="Name" syn-options="{validators:['require']}" />
            </div>
            <label class="col-2 col-form-label px-2">사용 여부</label>
            <div class="col-4">
                <label class="form-check form-switch col-form-label px-2">
                    <input class="form-check-input" type="checkbox" syn-datafield="UseYN" />
                </label>
            </div>
        </div>
    </div>
</div>
```

- 어느 패턴이든 **라벨은 항상 입력 영역의 왼쪽**입니다. (A)는 `input-group`으로 라벨과 입력을 한 덩어리로 묶고, (B)는 `row` 안에서 라벨 컬럼과 입력 컬럼을 분리합니다. 새 화면에서 어느 패턴을 쓸지 애매하면 같은 모듈의 유사 화면을 따릅니다.
- 필수 입력 표시는 `required` 클래스만 붙이고 `*` 문자를 라벨 텍스트에 직접 넣지 않습니다. 유효성 검사는 Bootstrap의 `is-invalid`/`invalid-feedback`이 아니라 `syn-options="{validators:['require']}"` 같은 JS 옵션으로 처리합니다.
- 기간 선택은 `syn_dateperiodpicker`, 트리는 `syn_tree`, 달력/기간은 `syn_datepicker`/`syn_dateperiodpicker`, 코드 선택(콤보)은 `syn_codepicker`, 파일 첨부는 `syn_fileclient`, 리치 텍스트는 `syn_htmleditor`, 조직도는 `syn_organization`, 차트는 `syn_chartjs` 컴포넌트를 사용합니다(9장 표 참고). 순수 HTML `<input type="date">`나 자체 구현 드롭존으로 대체하지 않습니다.
- 모든 데이터 바인딩 요소에 `syn-datafield`를 지정합니다.

### 6.4 사이드 패널형 화면 (좌측 메타 + 우측 본문)

전자결재 상세처럼 좌측에 문서 메타 정보를 여러 섹션으로 쌓고, 우측에 그리드나 iframe으로 본문을 보여주는 화면은 아래 구조를 따릅니다.

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="row g-0">
        <div class="col-3 border-r mr-4">
            <div class="card-header">
                <h3 class="card-title">문서정보</h3>
            </div>
            <div class="card-body p-2">
                <!-- 첫 섹션 폼 -->
            </div>
            <div class="card-header border-t">
                <h3 class="card-title">첨부파일 <em id="lblUploadCount">0 / 10</em></h3>
                <div class="card-actions">
                    <div class="btn-group">
                        <button type="button" class="btn btn-icon bg-muted-lt"><i class="f:18 ti ti-plus"></i></button>
                    </div>
                </div>
            </div>
            <div class="card-body p-2">
                <div id="lstDocumentFiles" class="row p-2 align-content-baseline"></div>
            </div>
            <!-- 필요한 만큼 card-header border-t / card-body p-2 섹션을 반복 -->
        </div>
        <div class="col">
            <iframe id="ifmReport" class="border-0 w-full h-full"></iframe>
        </div>
    </div>
</div>
```

- 좌측 컬럼은 하나의 카드 안에서 `card-header`(첫 섹션은 `border-t` 없음, 이후 섹션은 `card-header border-t`)를 반복해 세로로 여러 정보 블록(문서정보/관련문서/첨부파일/수신자/결재선 등)을 쌓습니다.
- 각 섹션의 항목 리스트(첨부파일, 결재선, 수신자 등)는 정적 마크업 없이 빈 `<div id="lst...">`만 두고 JS가 동적으로 카드형 항목을 그려 넣습니다. list-group 같은 Bootstrap 컴포넌트를 정적으로 채워두지 않습니다.
- 우측 본문이 다른 화면(보고서 등)을 그대로 보여줘야 하면 `iframe`을 사용합니다.

### 6.5 팝업 화면

Bootstrap `modal`/`modal-dialog`를 사용하지 않습니다. HandStack의 `simplemodal-data` 패턴을 사용합니다.

```html
<div id="tplDetail" style="display:none" class="simplemodal-data">
    <div class="card">
        <div class="card-header dialog-header sticky-top p-2">
            <h4 class="card-title">상세 정보</h4>
            <div class="card-actions">
                <button type="button" class="btn btn-icon border-0"
                    syn-options="{triggerConfig:{triggerEvent:'click', method:'syn.$w.closeDialog'}}">
                    <i class="f:18 ti ti-x"></i>
                </button>
            </div>
        </div>
        <div class="card-body p-2">
            <!-- 상세 폼 -->
        </div>
    </div>
</div>
```

- 닫기/트리거는 `syn-options="{triggerConfig:{...}}"`로 바인딩합니다. `data-bs-dismiss="modal"`은 사용하지 않습니다.
- 팝업 헤더는 `card-header` 단독보다 `card-header dialog-header sticky-top p-2`로 스크롤 중에도 헤더가 고정되도록 하는 경우가 많습니다.
- 팝업 컨테이너 폭은 6.1의 팝업 값(`max-width:1200!`)을 따릅니다.

### 6.6 인라인/전용 스타일이 허용되는 화면 (예외 유형)

`RPT` 계열 화면에 한해 모든 태그와 화면 전용 `<style>` 블록을 허용합니다. 이 유형이 인라인/전용 스타일이 허용되는 **유일한 예외**입니다. `<body>`에 `bg-white` 클래스를 추가하고, 컨테이너 폭은 `max-width:1000!`을 사용합니다. RPT 접두 화면이라도 인쇄용 표가 필요 없는 결재 문서 폼이라면 `<table>` 없이 6.3의 카드+row/col 폼 구조로 작성해도 됩니다 — "RPT는 table 허용"이지 "RPT는 table 필수"는 아닙니다.

---

## 7. 버튼 규칙

```md
주 액션(저장/조회):     btn btn-primary
보조 액션(토글/탭):     btn btn-outline-secondary
중립/취소/닫기:         btn                ← 색상 강조 없음. 팝업/폼 하단 닫기·취소가 여기 해당
위험 액션(삭제):        btn btn-danger
아이콘 전용 보조 버튼:  btn btn-icon bg-muted-lt   ← 카드 헤더/필터 옆의 추가·삭제·클리어 아이콘 버튼
아이콘 전용 일반 버튼:  btn btn-icon
버튼 묶음:              btn-group 또는 btn-list
```

- 아이콘+텍스트: `<i class="f:20 mr:4 ti ti-check"></i> 적용`
- 크기 조절은 `btn-sm`/`btn-lg`보다 Master CSS `f:` 클래스로 텍스트·아이콘 크기를 맞추는 방식을 우선합니다.
- 새로운 버튼 스타일 클래스를 임의로 만들지 않습니다.
- 표준 아이콘 조합: 조회/검색 `ti-search`, 저장/확인 `ti-check` 또는 `ti-device-floppy`, 신규/행추가 `ti-plus`, 삭제 `ti-trash`(+ `btn-danger`), 닫기/취소 `ti-x`, 인쇄 `ti-printer`, 새로고침/연동값 갱신 `ti-refresh-dot`, 업로드 `ti-upload`, 결재 기안 `ti-notes`.
- 권한이나 상태에 따라 버튼을 숨겨야 하면 기본 클래스에 `hidden`을 추가해 두고(`class="btn hidden"`, `class="btn btn-danger hidden"`) JS가 조건에 맞을 때 클래스를 제거하는 방식을 씁니다. 인라인 `style="display:none"`보다 이 방식을 우선하세요(5장 참고).
- 상태 필터(전체/진행중/완료 등)는 버튼이 아니라 배지처럼 보이더라도 `btn-group` + `btn bg-muted-lt` 조합으로 구현합니다(4장, 6.2 참고). 이 버튼들은 클릭으로 필터를 토글하는 액션이지 상태 표시 배지가 아닙니다.

---

## 8. 카드 규칙

- 카드는 이 프로젝트의 기본 레이아웃 단위입니다. 검색 영역과 목록/상세 영역을 별도 카드로 분리합니다.
- 카드 상단 강조 바: `card-status-top bg-dark-overlay` (의미가 있으면 해당 `bg-*`로 교체 가능). 메인 콘텐츠 카드(목록/상세/사이드 패널)에는 붙이고, 팝업 내부 카드나 보조 카드에는 생략해도 됩니다.
- 그리드를 담는 카드는 `form-fieldset p-0`(우선) 또는 `card-body p-0`으로 내부 여백을 제거합니다.
- 하나의 카드 안에서 여러 정보 섹션을 세로로 나눠야 할 때는 `card-header`(+ 이후 섹션은 `border-t`)를 반복하는 nested 구조를 사용합니다(6.4 참고). 별도의 중첩 `card`를 만들지 않습니다.
- `card-footer`는 카드별 액션/요약 행이 꼭 필요할 때만 사용합니다.

---

## 9. 아이콘 및 syn_* 컴포넌트 규칙

```html
<i class="ti ti-user"></i>
<i class="f:18 ti ti-x"></i>
```

- Tabler Icons(`ti ti-*`)만 사용합니다. 크기는 `f:NN`으로 조절합니다.
- FontAwesome(`fa-*`), Bootstrap Icons, 기타 아이콘 폰트 사용 금지. (일부 레거시 화면에 FontAwesome이 남아 있으나 신규 사용 금지)

실제 화면에서 쓰이는 `syn_*` 커스텀 컴포넌트와 용도는 아래와 같습니다. 이름이 비슷한 대체 컴포넌트(`syn_combo`, `syn_upload`, `syn_editor`, `syn_calendar` 등)는 존재하지 않으므로 추측으로 만들어 쓰지 마세요.

| 용도 | 컴포넌트 | 비고 |
|---|---|---|
| 데이터 그리드 | `syn_auigrid` | 목록 화면 필수 |
| 폼/그리드 데이터소스 바인딩 | `syn_data` | |
| 날짜 선택 | `syn_datepicker` | |
| 기간 선택 | `syn_dateperiodpicker` | |
| 코드/콤보 선택 | `syn_codepicker` | Bootstrap `select`가 아니라 코드값 연동이 필요하면 사용 |
| 트리 | `syn_tree` | 조직도/분류 트리 |
| 조직 선택 | `syn_organization` | |
| 파일 첨부/다운로드 | `syn_fileclient` | 드롭존 대신 사용 |
| 리치 텍스트 편집 | `syn_htmleditor` | |
| 차트 | `syn_chartjs` | |
| 우클릭 메뉴 | `syn_contextmenu` | |
| 화면 안내 | `syn_guide` | |

---

## 10. Tabler 레이아웃·컴포넌트·폼·유틸리티 보완 지침

이 장은 Tabler 공식 문서에서 제공하는 패턴 중 HandStack 화면에 적용 가능한 범위를 정리합니다. **이 장의 모든 내용은 2~9장의 HandStack 규칙을 보완할 뿐, 이를 대체하지 않습니다.** 특히 업무 팝업, 목록 그리드, 코드 선택, 라벨 배치는 각각 `simplemodal-data`, `syn_auigrid`, `syn_codepicker`, 6.3절의 기존 규칙이 우선입니다.

### 10.1 레이아웃과 페이지 헤더

- 모든 업무 화면은 6.1의 `container-fluid > page-wrapper > page-header > page-body` 골격을 사용합니다. Tabler의 고정 폭 레이아웃이나 `container-xl` 예시는 이 프로젝트의 기본 패턴으로 사용하지 않습니다.
- 페이지 제목은 `h2.page-title` 하나를 기본으로 하고, 보조 설명은 `text-secondary`로 제목 아래에 둡니다. 경로 정보가 필요할 때만 제목 앞에 `ol.breadcrumb`를 배치하며, 현재 항목에는 `active`와 `aria-current="page"`를 지정합니다.
- 우측 페이지 액션은 `col-auto ms-auto d-print-none > btn-list`에 넣고, 작은 화면에서 숨겨도 되는 보조 액션에만 `d-none d-md-inline-flex`를 사용합니다. 저장·조회 같은 주 액션은 모바일에서도 숨기지 않습니다.
- 넓은 화면의 다단 구성에는 `row`와 반응형 `col-*`을 사용합니다. 업무 목록과 입력 폼의 기본 분할 규칙은 6.2·6.3을 따르며, Tabler의 일반 대시보드 레이아웃을 그대로 복사하지 않습니다.

### 10.2 피드백·상태·탐색 컴포넌트

| 컴포넌트 | 적용 지침 |
|---|---|
| Alert | 저장 결과, 권한 부족, 일시적 안내처럼 화면 문맥 안에서 즉시 읽혀야 하는 메시지에만 `alert`와 의미 색상(`alert-success`, `alert-warning`, `alert-danger`, `alert-info`)을 사용합니다. 닫을 수 있는 안내는 닫기 버튼에 `aria-label="닫기"`를 제공하고, 오류만 색으로 구분하지 말고 원인과 다음 행동을 함께 씁니다. |
| Badge | 4장의 상태 필터 버튼그룹 원칙이 우선입니다. 배지는 대시보드 요약·카운트처럼 클릭 동작이 없는 짧은 보조 상태에만 최소로 사용하며, 상태 코드별 색상 매핑을 공통으로 유지합니다. |
| Breadcrumb | 깊이가 필요한 화면에서만 사용하며, 마지막 항목은 링크가 아닌 현재 위치로 표시합니다. 제목을 대체하지 않고 페이지 헤더의 보조 탐색으로만 둡니다. |
| Dropdown | 공간을 절약해야 하는 보조 명령만 `dropdown`에 묶습니다. 위험 명령은 항목 이름을 명확히 쓰고 확인 절차를 둡니다. 토글에는 `data-bs-toggle="dropdown"`과 `aria-expanded="false"`를, 메뉴에는 실제 `button` 또는 `a` 요소를 사용합니다. |
| Progress | 업로드·배치·처리 진행처럼 값이 변하는 작업에만 `progress > progress-bar`를 사용합니다. 진행 바에는 `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`을 제공하고 퍼센트 또는 처리 건수를 텍스트로도 표시합니다. |
| Steps | 다단계 등록·승인처럼 사용자가 현재 단계와 순서를 알아야 할 때만 사용합니다. 완료·현재·대기 상태를 텍스트와 클래스 모두로 표현하고, 단계 자체가 페이지 이동이면 실제 링크/버튼으로 구현합니다. |
| Timeline | 이력, 감사 로그, 결재 흐름처럼 시간순 읽기 전용 정보에 사용합니다. 최신순/오름차순을 화면에서 명시하고 각 항목에 시각·행위·주체를 포함합니다. |

### 10.3 액션과 콘텐츠 컴포넌트

- **Buttons**: 7장의 주/보조/위험 버튼 구분과 `btn-list`, `btn-group` 규칙을 따릅니다. 같은 의미의 액션을 한 화면에서 서로 다른 색으로 표현하지 않으며, 아이콘 전용 버튼은 반드시 `aria-label`을 가집니다.

  ```html
  <button type="button" class="btn btn-primary">
      <i class="f:20 mr:4 ti ti-device-floppy" aria-hidden="true"></i>저장
  </button>
  <button type="button" class="btn btn-icon bg-muted-lt" aria-label="행 추가">
      <i class="f:18 ti ti-plus" aria-hidden="true"></i>
  </button>
  ```

- **Cards**: 8장의 카드 구조를 기본으로 합니다. `card-header`, `card-body`, `card-footer`는 각각 제목/콘텐츠/명시적 액션·요약의 역할을 지키고, 의미 없는 중첩 카드나 장식용 이미지 카드는 만들지 않습니다.
- **Segmented control**: 동일 데이터의 보기 방식 또는 상호 배타적인 소수의 정적 옵션에만 사용합니다. 화면 상태를 실제로 전환하는 컨트롤이므로 현재 선택 상태를 텍스트·`active`·`aria-pressed`로 함께 드러냅니다. 업무 상태 필터는 기존 `btn-group + btn bg-muted-lt` 패턴을 우선합니다.
- **Carousel**: 이미지 미리보기, 도움말 슬라이드처럼 순서가 있는 시각 자료에만 제한합니다. 업무 입력·조회 흐름, 공지 목록, 자동 재생이 필요한 핵심 정보에는 사용하지 않습니다. 각 슬라이드에 대체 텍스트를 제공하고 자동 재생을 켜지 않는 것을 기본으로 합니다.
- **Modal**: Tabler/Bootstrap `modal` 예시는 이 프로젝트 업무 팝업에 적용하지 않습니다. 계속해서 6.5의 `simplemodal-data`와 `syn-options.triggerConfig`를 사용합니다.

### 10.4 폼과 검증

- 텍스트·숫자·날짜 등 기본 입력에는 `form-control`, 체크/스위치에는 `form-check` 패턴을 사용하되, 라벨 배치는 반드시 6.3의 좌측 라벨 두 패턴 중 하나를 따릅니다. `placeholder`는 라벨을 대신하지 않으며, 입력 목적을 반복하지 않는 짧은 예시만 제공합니다.
- 논리적으로 하나인 항목 묶음은 `form-fieldset`과 `legend`를 사용합니다. 목록 그리드 래퍼에는 기존 관례인 `form-fieldset p-0`을 계속 우선합니다.
- 선택 값이 고정되고 적은 경우에만 selectgroup을 사용합니다. 서버 코드·조직·대량 옵션처럼 데이터 연동이 필요한 선택은 네이티브 `select` 또는 selectgroup으로 대체하지 말고 `syn_codepicker`, `syn_organization` 등 실제 `syn_*` 컴포넌트를 사용합니다.
- 검증 실패 시 대상 입력에 `is-invalid`와 연결된 `invalid-feedback`를 사용하고, 오류 메시지는 해결 방법을 설명합니다. 필수 표시는 라벨의 `required` 클래스로만 표시하며 `*`를 직접 쓰지 않습니다. 성공 상태를 모든 필드에 표시하지 말고, 완료 확인이 필요한 경우에만 `is-valid`와 `valid-feedback`를 사용합니다.

  ```html
  <label for="txtName" class="col-2 col-form-label required">이름</label>
  <div class="col">
      <input id="txtName" type="text" class="form-control is-invalid"
          aria-describedby="txtNameError" syn-datafield="Name" />
      <div id="txtNameError" class="invalid-feedback">이름을 입력하세요.</div>
  </div>
  ```

### 10.5 테두리·여백·커서·세로 정렬

- 테두리는 섹션 구분에만 사용합니다. 카드 내부 후속 섹션은 기존처럼 `border-t`, 사이드 패널 분리는 `border-r`, 불필요한 선 제거는 `border-0`을 사용합니다. 임의 색상·두께의 인라인 border 스타일은 사용하지 않습니다.
- 화면 구조의 고정 크기·간격에는 Master CSS(`mr:4`, `w:120` 등)가 우선이며, Tabler/Bootstrap 여백 클래스는 기존 템플릿에 있는 `mt-2`, `p-2`, `px-2`, `g-0`처럼 레이아웃 의미가 명확한 경우에만 사용합니다. 같은 요소에서 두 체계로 같은 방향의 여백을 중복 지정하지 않습니다.
- 기본 `button`, 링크, 실제 클릭 가능한 요소만 포인터 커서를 가집니다. 단순 텍스트·행·장식 아이콘에 `cursor-pointer`를 붙여 클릭 가능해 보이게 하지 말고, 비활성 컨트롤은 `disabled` 상태와 설명을 함께 제공합니다.
- 행 내부의 수직 정렬은 `row align-items-center` 또는 `d-flex align-items-center`를 우선합니다. 표 셀·아이콘과 텍스트처럼 인라인 요소의 정렬에만 `align-middle`을 사용하며, 여백 보정용 `vertical-align` 인라인 스타일은 사용하지 않습니다.

### 10.6 공식 참고 링크

- Layout: [Page headers](https://docs.tabler.io/ui/layout/page-headers), [Page layouts](https://docs.tabler.io/ui/layout/page-layouts)
- Components: [Alerts](https://docs.tabler.io/ui/components/alerts), [Badges](https://docs.tabler.io/ui/components/badges), [Breadcrumb](https://docs.tabler.io/ui/components/breadcrumb), [Buttons](https://docs.tabler.io/ui/components/buttons), [Cards](https://docs.tabler.io/ui/components/cards), [Carousel](https://docs.tabler.io/ui/components/carousel), [Dropdowns](https://docs.tabler.io/ui/components/dropdowns), [Modals](https://docs.tabler.io/ui/components/modals), [Progress bars](https://docs.tabler.io/ui/components/progress), [Segmented Control](https://docs.tabler.io/ui/components/segmented-control), [Steps](https://docs.tabler.io/ui/components/steps), [Timelines](https://docs.tabler.io/ui/components/timelines)
- Forms: [Form elements](https://docs.tabler.io/ui/forms/form-elements), [Form fieldset](https://docs.tabler.io/ui/forms/form-fieldset), [Form selectgroup](https://docs.tabler.io/ui/forms/form-selectboxes), [Validation states](https://docs.tabler.io/ui/forms/form-validation)
- Utilities: [Borders](https://docs.tabler.io/ui/utilities/borders), [Cursors](https://docs.tabler.io/ui/utilities/cursors), [Margins](https://docs.tabler.io/ui/utilities/margins), [Vertical align](https://docs.tabler.io/ui/utilities/vertical-align)

---

## 11. 금지 사항 (Never)

```md
- container-xl을 기본 컨테이너로 사용하지 말 것 (container-fluid 사용)
- 순수 <table>로 업무 목록을 만들지 말 것 (syn_auigrid 사용, RPT 보고서 화면만 예외)
- Bootstrap modal을 업무 팝업에 사용하지 말 것 (simplemodal-data 패턴 사용)
- FontAwesome 등 타 아이콘 폰트를 사용하지 말 것 (ti ti-* 만 사용)
- 신규 화면의 Tabler 아이콘 예시·구현에 SVG를 사용하지 말 것 (`<i class="ti ti-*"></i>` 웹폰트 사용)
- 임의의 HEX 색상, 인라인 색상 스타일을 사용하지 말 것 (Tabler 색상 유틸리티 사용). 대시보드형 화면이라도 예외를 두지 말 것
- 시각적 스타일을 인라인 style로 넣지 말 것 (display/visibility 토글만 허용, 가능하면 class="hidden" 토글 우선)
- 라벨을 인풋 위에 쌓는 일반 Tabler 폼 레이아웃을 쓰지 말 것 (input-group 좌측 라벨 또는 row+col-N 좌측 라벨 중 모듈 관례를 따를 것)
- 필수 입력 표시를 라벨 텍스트에 "*"로 하드코딩하지 말 것 (label에 required 클래스만 추가)
- 상태 표시를 화면마다 다른 배지 색으로 하드코딩하지 말 것 (상태 코드 → 색상 매핑 일관 유지, 가능하면 배지 대신 상태 필터 버튼그룹 사용)
- 새로운 커스텀 CSS 클래스·버튼 스타일을 임의로 만들지 말 것 (Tabler + Master CSS 조합으로 해결)
- 존재하지 않는 syn_* 컴포넌트 이름을 추측해서 쓰지 말 것 (9장 표에 없는 이름이 필요하면 먼저 실제 화면에서 유사 사례를 찾을 것)
```

---

## 12. 준수 검증 (QA 게이트)

새 화면 작성 후 아래를 확인합니다. 앞의 6개는 grep으로 기계 검증이 가능합니다.

| # | 검증 항목 | 확인 방법 |
|---|---|---|
| 1 | 타 아이콘 폰트 미사용 | 파일에서 `fa-`, `bi-` 검색 결과 0건 |
| 2 | Bootstrap modal 미사용 | `modal-dialog` 검색 결과 0건 |
| 3 | 기본 컨테이너 준수 | `container-xl` 검색 결과 0건 |
| 4 | 인라인 색상 스타일 없음 | `style="` 내에 `color`, `background`, `font-size` 없음 |
| 5 | HEX 색상 하드코딩 없음 | `#` 뒤 3~6자리 HEX가 class/style에 없음 |
| 6 | 데이터 바인딩 지정 | 입력 컨트롤·그리드에 `syn-datafield` 존재 |
| 7 | 화면 유형 템플릿 준수 | 6장 템플릿과 골격 구조 일치 |
| 8 | 짝 파일 존재 | `{화면ID}.html`과 `{화면ID}.js`가 쌍으로 존재 |
| 9 | 라벨 배치 준수 | 폼 라벨이 6.3의 두 패턴(input-group 또는 row+col-N) 중 하나로 좌측 배치 |
| 10 | 필수 표시 준수 | 필수 입력 라벨에 `*` 하드코딩 없이 `required` 클래스 사용 |
| 11 | 상태 색상 일관성 | 동일 상태 코드에 기존 화면과 같은 색상/버튼그룹 패턴 사용 |
| 12 | syn_* 컴포넌트 존재 확인 | 사용한 `syn_*` 태그가 9장 표에 있거나 동일 모듈 내 기존 사용례가 있음 |
| 13 | 아이콘 접근성·형식 준수 | 신규 아이콘이 `ti ti-*` 웹폰트이며, 아이콘 전용 버튼에 `aria-label`이 있음 |
| 14 | 피드백 접근성 | alert/progress/검증 메시지에 의미·현재 값·오류 원인이 텍스트로 제공됨 |
