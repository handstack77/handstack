---
version: 1.0
name: HandStack 업무 화면 디자인 시스템
description: >-
  Tabler CSS(Bootstrap 5 기반) + Tabler Icons 웹폰트 + Master CSS 유틸리티 + HandStack
  syn.loader 런타임으로 업무 화면(목록·상세·마스터/디테일·사이드패널·팝업·보고서)을 일관되게
  구성하기 위한 디자인 지침. 모든 클래스명은 이 저장소에 번들된 @tabler/core 1.3.2 배포본에서 검증했습니다.
stack:
  tabler: "@tabler/core@1.3.2"
  icons: "@tabler/icons-webfont@3.25.0"
  utility: "@master/css (런타임 엔진)"
  runtime: "syn.loader.js (HandStack)"
colors:
  primary: "#066fd1"
  secondary: "#6b7280"
  success: "#2fb344"
  info: "#4299e1"
  warning: "#f59f00"
  danger: "#d63939"
  dark: "#1f2937"
  light: "#f9fafb"
  muted: "#6b7280"
  body-bg: "#f9fafb"
  body-color: "#1f2937"
  border: "#e5e7eb"
  blue: "#066fd1"
  azure: "#4299e1"
  indigo: "#4263eb"
  purple: "#ae3ec9"
  pink: "#d6336c"
  red: "#d63939"
  orange: "#f76707"
  yellow: "#f59f00"
  lime: "#74b816"
  green: "#2fb344"
  teal: "#0ca678"
  cyan: "#17a2b8"
  gray-50: "#f9fafb"
  gray-100: "#f3f4f6"
  gray-200: "#e5e7eb"
  gray-300: "#d1d5db"
  gray-400: "#9ca3af"
  gray-500: "#6b7280"
  gray-600: "#4b5563"
  gray-700: "#374151"
  gray-800: "#1f2937"
  gray-900: "#111827"
  gray-950: "#030712"
typography:
  body:
    fontFamily: '"Noto Sans KR", "Inter Var", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.4285714286
  h1: { fontSize: 1.5rem, fontWeight: 600 }
  h2: { fontSize: 1.25rem, fontWeight: 600 }
  h3: { fontSize: 1rem, fontWeight: 600 }
  h4: { fontSize: 0.875rem, fontWeight: 600 }
  h5: { fontSize: 0.75rem, fontWeight: 600 }
  h6: { fontSize: 0.625rem, fontWeight: 600 }
  mono:
    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
spacing:
  "0": 0
  "1": 0.25rem
  "2": 0.5rem
  "3": 1rem
  "4": 1.5rem
  "5": 2rem
  "6": 3rem
  card-x: 1.25rem
  card-y: 1rem
rounded:
  sm: 4px
  DEFAULT: 6px
  lg: 8px
  xl: 1rem
  pill: 100rem
containers:
  list-detail: "max-width:1600!"
  popup: "max-width:1200!"
  report: "max-width:1000!"
components:
  page:
    backgroundColor: body-bg
    container: container-fluid
  card:
    backgroundColor: light
    rounded: DEFAULT
    statusBar: "card-status-top bg-dark-overlay"
  button-primary: { backgroundColor: primary, textColor: light, rounded: DEFAULT }
  button-neutral: { backgroundColor: light, textColor: body-color, rounded: DEFAULT }
  button-danger:  { backgroundColor: danger,  textColor: light, rounded: DEFAULT }
  button-icon:    { backgroundColor: "muted-lt", rounded: DEFAULT }
  input: { backgroundColor: light, textColor: body-color, rounded: DEFAULT, height: 2.25rem }
  badge: { rounded: sm, typography: h5 }
---

# DESIGN.md — HandStack 업무 화면 지침

이 문서는 **AI 코딩 에이전트와 개발자가 HandStack 업무 화면(HTML)을 작성할 때 따르는 단일 기준**입니다.
Tabler 공식 문서는 "무엇이 존재하는가"를 알려주고, 이 문서는 "그중 무엇을 언제 쓰는가"를 정합니다.
**둘이 충돌하면 이 문서가 우선합니다.**

## 문서 정보

| 항목 | 내용 |
|---|---|
| 적용 범위 | `wwwroot` 업무 화면 HTML 전체 (목록·상세·마스터/디테일·사이드패널·팝업·보고서) |
| 기준 버전 | 저장소 번들 기준 `@tabler/core` **1.3.2**, `@tabler/icons-webfont` **3.25.0** (정본: `2.Modules/wwwroot/libman.json`) |
| 적용 원칙 | 신규 화면은 필수 준수. 기존 화면은 **수정하는 범위 내에서만** 점진 적용(일괄 리팩터링 금지) |
| 검증 근거 | 이 문서의 모든 클래스명은 `2.Modules/wwwroot/wwwroot/lib/tabler-core/dist/css/tabler.min.css`(1.3.2)에서 실재를 확인함 |
| 개정 절차 | 규칙을 바꿀 때는 이 문서를 먼저 고치고, 근거가 되는 실제 화면 경로를 함께 기록 |

### 참조 자산

HandStack 화면은 CDN이 아니라 **`wwwroot` 모듈이 배포하는 로컬 번들**을 사용합니다. 버전은 `libman.json`이 고정하며 화면이 개별적으로 참조 URL을 바꾸지 않습니다.

```text
/lib/tabler-core/dist/css/tabler.min.css             ← @tabler/core@1.3.2
/lib/tabler-core/dist/js/tabler.min.js               ← 드롭다운·탭·알림 닫기 등 동작
/lib/tabler-icons-webfont/dist/tabler-icons.min.css  ← @tabler/icons-webfont@3.25.0
/lib/master-css/index.min.js                         ← syn.loader.js가 런타임 로드
```

- **`@latest` 참조는 금지합니다.** 예고 없는 스타일 변경 위험이 있고, 로컬 번들과 클래스 목록이 어긋납니다. 새 클래스가 필요하면 CDN을 가리키지 말고 `libman.json` 버전을 올린 뒤 번들을 갱신합니다.
- 이 문서에서 "존재한다/존재하지 않는다"는 판단은 모두 **1.3.2 번들 기준**입니다. 상위 버전 문서·블로그의 클래스명을 그대로 옮겨 쓰지 마세요.

---

## 개요

업무 화면은 마케팅 페이지가 아닙니다. **밀도 높은 데이터를 빠르게 읽고, 정확하게 입력하고, 실수 없이 저장하는 것**이 유일한 목표입니다.

- **조용한 인터페이스**: 기본 톤은 회색(`gray-50` 배경 + 흰 카드 + `gray-200` 경계선)입니다. 색은 장식이 아니라 **신호**입니다. 한 화면에 강조색이 여러 개 보이면 설계가 잘못된 것입니다.
- **높은 정보 밀도**: 본문 글자 크기가 `0.875rem`(14px)로 일반 웹사이트보다 작습니다. 여백을 넉넉히 주기보다 **카드로 구획을 나눠** 밀도를 감당합니다.
- **예측 가능한 배치**: 같은 업무는 같은 자리에 있어야 합니다. 조회 버튼은 항상 필터 카드 오른쪽, 저장 버튼은 항상 카드 푸터 오른쪽, 신규 등록은 항상 페이지 헤더 오른쪽입니다.
- **한 화면 한 목적**: 하나의 화면은 하나의 업무 단위를 처리합니다. 부가 작업은 팝업이나 별도 화면으로 분리합니다.
- **대상 사용자**: 하루 종일 같은 화면을 쓰는 내부 실무자. 화려함보다 **키보드 이동, 일관된 라벨 위치, 명확한 오류 메시지**가 훨씬 중요합니다.

---

## 기술 스택 계층

이 프로젝트의 화면은 세 계층이 조합되어 동작합니다. **각 계층의 문법을 섞지 마세요.** 대부분의 "존재하지 않는 클래스" 사고는 여기서 발생합니다.

```text
HandStack (syn.loader.js)          ← 화면 로딩, 데이터 바인딩(syn-datafield), 컴포넌트(syn_*), 팝업, 검증
├─ Tabler CSS (Bootstrap 5 기반)   ← 레이아웃·카드·버튼·폼·배지 등 시각 컴포넌트   (문법: card, btn-primary, border-top, me-2)
└─ Master CSS (런타임 엔진)         ← 화면 고유의 치수·간격 유틸리티                  (문법: f:20, w:120, mr:4, max-width:1600!)
```

| 계층 | 문법 | 맞는 예 | 틀린 예 |
|---|---|---|---|
| Tabler / Bootstrap | `이름-값` (하이픈) | `me-2`, `mt-3`, `border-top`, `w-100` | `mr-2`, `ml-2`, `border-t`, `border-r` |
| Master CSS | `속성:값` (콜론) | `mr:4`, `f:20`, `w:120`, `max-width:1600!` | `mr-4`, `f-20`, `max-width-1600` |

- **Master CSS**는 빌드 도구가 아니라 **런타임 엔진**입니다. `syn.loader.js`가 `/lib/master-css/index.min.js`를 로드해 클래스를 실제 CSS로 변환하므로, 클래스만 정확히 쓰면 별도 빌드가 필요 없습니다. 끝의 `!`(예: `f:12!`)는 Master CSS의 `!important` 문법입니다.
- Master CSS는 `hidden`, `block`, `flex` 같은 **시맨틱 클래스**도 제공합니다. 그래서 이 프로젝트에서는 `class="btn hidden"`이 유효합니다 — **일반 Tabler 프로젝트에는 `hidden` 클래스가 없다**는 점만 기억하세요(Tabler만 쓰는 곳에서는 `d-none`).
- **아이콘**은 Tabler Icons 웹폰트(`ti ti-*`)만 사용합니다.

---

## 색상

Tabler CSS 변수와 `bg-*` / `text-*` / `border-*` 유틸리티만 사용합니다. **임의의 HEX 값과 인라인 색상 스타일은 금지합니다.**

### 의미 색상 (Semantic)

| 역할 | 토큰 | 값 | 대표 용도 |
|---|---|---|---|
| Primary | `--tblr-primary` | `#066fd1` | 주 액션(조회·저장·확인), 활성 상태 |
| Success | `--tblr-success` | `#2fb344` | 완료·승인·정상 처리 |
| Warning | `--tblr-warning` | `#f59f00` | 대기·주의·검토 필요 |
| Danger | `--tblr-danger` | `#d63939` | 오류·반려·삭제, 필수 표시 `*` |
| Info | `--tblr-info` | `#4299e1` | 안내·부가 정보 |
| Secondary / Muted | `--tblr-secondary` | `#6b7280` | 보조 텍스트, 비활성 |
| Dark | `--tblr-dark` | `#1f2937` | 본문 텍스트 |

### 팔레트

기본 12색(`blue` `azure` `indigo` `purple` `pink` `red` `orange` `yellow` `lime` `green` `teal` `cyan`)과 회색 11단계(`gray-50` ~ `gray-950`)를 제공합니다. 각 색상에는 세 가지 형태가 있습니다.

```html
<span class="badge bg-blue text-blue-fg">진한 배경</span>   <!-- 배경색 + 대비 확보된 전경색 -->
<span class="badge bg-blue-lt">연한 배경</span>              <!-- -lt: 낮은 강조. 전경색 자동 -->
<span class="badge badge-outline text-blue">외곽선</span>    <!-- 배경 없음 -->
```

- `text-*-fg`는 해당 배경 위에서 대비가 보장된 전경색입니다. `bg-blue`에는 `text-white`가 아니라 **`text-blue-fg`를 씁니다.**
- `-lt` 변형은 보조 버튼, 은은한 선택 배경, 아이콘 칩 등 **낮은 강조**에 씁니다. 이 프로젝트에서 아이콘 전용 보조 버튼의 표준 배경인 `bg-muted-lt`가 대표 사례입니다.
- 회색 계열과 `text-secondary` / `text-muted`가 레이아웃·구분선·보조 텍스트의 기본입니다.

### 상태 색상 매핑 (전 화면 공통)

동일한 상태 코드는 화면·모듈이 달라도 **반드시 같은 색**을 씁니다.

```md
완료 / 승인 / 정상    → bg-green   또는 bg-success
진행 중 / 처리 중     → bg-blue    또는 bg-primary
대기 / 검토 필요      → bg-yellow  또는 bg-warning
취소 / 반려 / 실패    → bg-red     또는 bg-danger
마감 / 종료 / 비활성  → bg-secondary 또는 text-muted
세부 상태가 많을 때    → azure, indigo, purple, teal, cyan 순으로 확장
```

- **HandStack 목록 화면에서 상태는 "표시"보다 "필터"인 경우가 많습니다.** 검색 카드 안의 `btn-group` + `btn bg-muted-lt` 토글 버튼이 이 프로젝트의 표준이며, 배지는 클릭 동작이 없는 요약·건수 표시에만 씁니다(「버튼」·「배지」 참고).
- 그리드 상태 컬럼의 색상은 HTML에 하드코딩하지 않습니다. **JS에 `상태코드 → 클래스` 매핑 함수를 한 곳에 두고** `syn_auigrid` 렌더러에서 적용합니다.
- **색상만으로 의미를 전달하지 않습니다.** 상태명 텍스트, 아이콘, 검증 메시지를 함께 제공합니다(색각 이상 사용자 대응).

### 다크 모드

Tabler는 루트 요소의 `data-bs-theme="dark"`로 다크 테마를 전환하고, 이 저장소에도 `2.Modules/wwwroot/wwwroot/css/dark_mode.css`가 있습니다. **모든 색을 위 유틸리티로만** 지정하십시오. HEX를 직접 쓴 요소는 다크 모드에서 그대로 깨집니다.

---

## 타이포그래피

본문 기준은 `0.875rem`(14px) / `line-height 1.43` / `font-weight 400`입니다. 제목 가중치는 600입니다.

### 크기 스케일

이 프로젝트는 글자·아이콘 크기를 **Master CSS `f:NN`(px)** 으로 지정하는 것이 관례입니다. Tabler의 `fs-*`도 유효하지만, 한 화면 안에서 두 체계를 섞지 마세요.

| 의미 | Master CSS (권장) | Tabler 동등 | 크기 | 용도 |
|---|---|---|---|---|
| h1 | `f:24` | `fs-1` | 1.5rem (24px) | 지표 숫자, 큰 아이콘 |
| h2 | `f:20` | `fs-2` | 1.25rem (20px) | `page-title`, 버튼·헤더 아이콘 |
| h3 | `f:16` | `fs-3` | 1rem (16px) | `card-title`, 인라인 아이콘 |
| h4 | `f:14` | `fs-4` | 0.875rem (14px) | 본문, 소제목 |
| h5 | `f:12` | `fs-5` | 0.75rem (12px) | `page-pretitle`, 배지, 힌트 |
| h6 | `f:10` | `fs-6` | 0.625rem (10px) | 극히 예외적인 보조 라벨 |

### 규칙

- **의미에 맞는 요소를 쓰고, 크기는 클래스로 조정합니다.** 글자를 크게 하려고 `h1`을 쓰지 마세요. 시각적 크기만 필요하면 `<div class="h3">`처럼 `.h1`~`.h6` 클래스를 씁니다.
- 화면 최상위 제목은 `h2.page-title`, 카드 제목은 `h3.card-title`을 기본으로 하고 제목 계층(`h2`→`h3`→`h4`)을 건너뛰지 않습니다.
- 보조 설명은 `text-secondary`, 더 낮은 강조는 `text-muted`를 씁니다. 입력 아래 도움말은 `small.form-hint`입니다.
- 강조는 `strong`, `em`, `code`, `kbd`, `mark`, `time`, `abbr` 같은 **시맨틱 요소**로 표현합니다. `b`·`i`·밑줄·색상만으로 의미를 만들지 않습니다.
- 긴 값이 레이아웃을 깨면 `text-truncate`로 자릅니다. 이 클래스는 폭이 정해진 부모(그리드의 `col`, `w-100`, 표 셀) 안에서만 동작하므로 반드시 그런 컨테이너 안에 둡니다. 잘린 전체 값은 `title` 속성으로 제공합니다.
- 인라인 `style="font-size:..."`와 새 타이포그래피 CSS 클래스를 만들지 않습니다.
- 그 외 보조 클래스: `text-uppercase`, `fw-medium` / `fw-bold`, `lh-1` / `lh-sm`, `subheader`(대문자 소형 라벨), `hr-text`(가운데 글자 있는 구분선).
  - `tracking-tight` / `tracking-wide`는 **1.3.2 번들에 없습니다.**

---

## 레이아웃

### 페이지 골격 (모든 화면 공통)

HandStack 화면은 완전한 HTML 문서가 아니라 `syn.loader.js`가 로드하는 **프래그먼트**입니다.

```html
<body style="visibility:hidden">
    <form id="form1" syn-datafield="MainForm">
        <div class="page">
            <div class="page-wrapper">

                <!-- 페이지 헤더 -->
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

                <!-- 페이지 본문 -->
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

- 구조는 **`page` → `page-wrapper` → (`page-header` + `page-body`) → `container-fluid`** 순서를 반드시 지킵니다.
- **컨테이너는 `container-fluid` + Master CSS 폭 제어가 기본입니다.** 업무 화면은 넓은 모니터에서 최대한 많은 컬럼을 보여줘야 합니다. `container-xl` 같은 고정 폭 클래스는 새 화면에 쓰지 않으며, 남아 있는 화면은 리팩터링 대상입니다.
- 폭 값은 화면 성격에 따라 정해져 있습니다. 신규 화면은 **모듈 내 기존 화면과 동일한 값**을 따르고 임의로 바꾸지 않습니다.
  - 일반 목록/상세 화면 → `max-width:1600!`
  - 팝업/좁은 폭 화면 → `max-width:1200!`
  - 인쇄/결재문서 폼(RPT 계열) → `max-width:1000!`
- `page-header`에는 `d-print-none`을 붙여 인쇄 시 숨깁니다. 오른쪽 액션은 항상 `col-auto ms-auto d-print-none > btn-list`입니다.
- 헤더 아래 구분선이 필요하면 `page-header page-header-border`를 씁니다.
- `<body style="visibility:hidden">`은 렌더링 완료 후 HandStack이 해제하므로 그대로 유지합니다. RPT 계열은 `<body class="bg-white" style="visibility:hidden">`처럼 `bg-white`를 추가합니다.
- 저장·조회 같은 주 액션은 **모바일에서도 숨기지 않습니다.** 숨겨도 되는 보조 액션에만 `d-none d-md-inline-flex`를 씁니다.

### 그리드와 간격

- 12칼럼 Bootstrap 그리드(`row` / `col-*` / `col-md-*` / `col-lg-*`)를 씁니다.
- 카드를 나열하는 행은 `row row-cards`, **높이를 맞춰야 하면** `row row-deck row-cards`를 씁니다.
- 행 내부 간격은 `g-2`(0.5rem) / `g-3`(1rem)을 기본으로 하고, 카드 안에서 경계선을 붙여야 하면 `g-0`을 씁니다.
- 간격 스케일: `0`=0, `1`=0.25rem, `2`=0.5rem, `3`=1rem, `4`=1.5rem, `5`=2rem, `6`=3rem.
  - 방향: `m`/`mt`/`mb`/`ms`/`me`/`mx`/`my`, 패딩은 `p`/`pt`/`pb`/`ps`/`pe`/`px`/`py`. 가운데 정렬은 `mx-auto`.
  - **논리적 방향(`ms`/`me`)을 씁니다.** `ml-*`/`mr-*`은 Bootstrap 5에 없습니다. Master CSS의 `mr:4`(콜론)와 혼동하지 마세요.
- **HandStack 화면의 실무 기본값**: 카드 사이 간격은 `mt-2`, 폼 행 사이는 `mb-2`, 조밀한 카드 본문은 `card-body p-2`.
- 구조의 고정 치수(`w:120`, `mr:4`)는 Master CSS, 레이아웃 의미가 분명한 간격(`mt-2`, `px-2`, `g-0`)은 Tabler 유틸리티를 씁니다. **같은 요소의 같은 방향 여백을 두 체계로 중복 지정하지 않습니다.**

---

## 입체감

이 시스템은 **그림자를 계층 표현의 주된 수단으로 쓰지 않습니다.** 업무 화면에서 그림자가 많으면 시각적으로 시끄럽고 스캔 속도가 떨어집니다.

계층은 다음 순서로 표현합니다.

1. **면 분리** — 회색 페이지 배경(`gray-50`) 위에 흰 카드를 얹는 것이 1차 계층입니다.
2. **경계선** — 카드 내부 구획은 `border-top` / `border-end` 등 1px 선으로 나눕니다.
3. **상태 바** — 카드 상단/좌측의 얇은 띠(`card-status-top` / `card-status-start`)로 카드의 성격을 표시합니다.
4. **그림자** — 드롭다운·팝업처럼 **실제로 떠 있는 요소에만** 사용합니다. Tabler 기본값을 그대로 쓰고 직접 정의하지 않습니다.

```html
<!-- 기본: 중립 강조 바를 얹은 업무 카드 -->
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-header"><h3 class="card-title">기본 정보</h3></div>
    <div class="card-body">…</div>
</div>

<!-- 의미가 있을 때만 색을 바꿉니다 -->
<div class="card"><div class="card-status-start bg-green"></div>…</div>
```

- 카드 상단 강조 바의 기본값은 **`card-status-top bg-dark-overlay`**(중립)입니다. 색이 의미를 가질 때만 `bg-green` 등으로 교체합니다. 카드마다 다른 색을 쓰면 신호가 죽습니다.
- 강조 바는 **메인 콘텐츠 카드**(목록·상세·마스터/디테일·사이드패널)에 붙이고, 팝업 내부 카드나 보조 카드에는 생략합니다.
- 스크롤 중에도 헤더가 보여야 하면 `sticky-top`, 하단 액션바가 필요하면 `sticky-bottom`을 씁니다(둘 다 화면이 실제로 길 때만).

---

## 형태

- **기본 반경은 6px(`--tblr-border-radius`)** 입니다. 카드·입력·버튼·드롭다운이 모두 이 값을 공유합니다.
- 반경 스케일: `rounded-0`(0) / `rounded-1`(4px) / `rounded`(6px) / `rounded-2`·`rounded-3`(더 큰 값) / `rounded-circle`(원) / `rounded-pill`(100rem).
- 형태 변형은 **의미가 있을 때만** 씁니다.
  - `rounded-circle` — 아바타, 원형 아이콘 칩
  - `rounded-pill` / `badge-pill` — 개수 표시, 태그형 필터
  - `btn-square` — 그리드·표 안에 촘촘히 붙는 아이콘 버튼(반경 제거)
  - `btn-pill` — 강조된 단독 CTA. 업무 화면에서는 거의 쓰지 않습니다.
- 테두리 두께는 `border`(1px)가 기본이고, 강조가 필요하면 `border-wide` 또는 방향별 `border-top-wide` / `border-start-wide`를 씁니다.
- **`border-dashed` / `border-dotted`는 1.3.2에 없습니다.** 점선이 꼭 필요하면 프로젝트 공용 CSS에 한 번 정의하고 재사용합니다.
- 색 있는 테두리는 `border-primary` `border-danger` `border-blue` … 또는 `border-*-subtle`(연한 톤)을 씁니다. 투명도는 `border-opacity-10/25/50/75/100`.

---

## 컴포넌트

### 아이콘 — Tabler Icons 웹폰트

**업무 화면의 아이콘은 SVG가 아니라 웹폰트만 사용합니다.** 마크업이 짧고, 색·크기를 텍스트와 동일하게 제어할 수 있습니다.

```html
<!-- 기본형 -->
<i class="ti ti-user"></i>

<!-- 버튼 안: 텍스트와 함께 -->
<button type="button" class="btn btn-primary">
    <i class="f:20 mr:4 ti ti-device-floppy" aria-hidden="true"></i>저장
</button>

<!-- 아이콘 전용 버튼: aria-label 필수 -->
<button type="button" class="btn btn-icon bg-muted-lt" aria-label="행 추가">
    <i class="f:18 ti ti-plus" aria-hidden="true"></i>
</button>

<!-- 의미를 갖는 색 -->
<i class="f:20 ti ti-alert-triangle text-warning" aria-hidden="true"></i>
```

**크기 규칙**

- 웹폰트 아이콘은 글리프이므로 **font-size로 크기를 정합니다.** 이 프로젝트는 Master CSS `f:NN`이 관례입니다 — 버튼·헤더 아이콘 `f:20` 또는 `f:18`, 촘촘한 인라인 아이콘 `f:16`, 큰 지표 아이콘 `f:24`.
- **`icon-sm` / `icon-md` / `icon-lg`는 SVG 아이콘용 클래스입니다.** `width`/`height`/`stroke-width`를 설정하므로 `<i class="ti …">`에는 효과가 없습니다. 웹폰트에 쓰지 마세요.
- 애니메이션이 필요하면 `icon-pulse`(반복)·`icon-tada`(강조)·`icon-rotate`를 쓰되 업무 화면에서는 진행 중 표시 외에는 자제합니다.

**접근성**

- 아이콘 옆에 텍스트가 있으면 아이콘에 `aria-hidden="true"`를 붙입니다(스크린리더 중복 낭독 방지).
- 아이콘만 있는 버튼·링크에는 **`aria-label`이 필수**입니다.

**업무 화면 표준 아이콘**

| 동작 | 아이콘 | 동작 | 아이콘 |
|---|---|---|---|
| 조회/검색 | `ti-search` | 필터 초기화 | `ti-filter-off` |
| 저장 | `ti-device-floppy` | 확인/승인 | `ti-check` |
| 신규/행 추가 | `ti-plus` | 행 삭제 | `ti-minus` |
| 삭제 | `ti-trash` | 수정 | `ti-edit` |
| 닫기/취소 | `ti-x` | 새로고침 | `ti-refresh` |
| 연동값 갱신 | `ti-refresh-dot` | 인쇄 | `ti-printer` |
| 엑셀 내보내기 | `ti-file-export` | 업로드 | `ti-upload` |
| 다운로드 | `ti-download` | 첨부 | `ti-paperclip` |
| 복사 | `ti-copy` | 기간/날짜 | `ti-calendar-event` |
| 이력 | `ti-history` | 결재 기안 | `ti-notes` |
| 사용자 | `ti-user` | 조직/부서 | `ti-sitemap` |
| 설정 | `ti-settings` | 더보기 | `ti-dots-vertical` |
| 정보 | `ti-info-circle` | 경고 | `ti-alert-triangle` |
| 오류 | `ti-alert-circle` | 성공 | `ti-circle-check` |

> 주의: `ti-organization`은 **존재하지 않는 아이콘**입니다. 조직도는 `ti-sitemap`, `ti-hierarchy`, `ti-binary-tree`를 쓰세요. 아이콘 이름은 추측하지 말고 [Tabler Icons](https://tabler.io/icons)에서 확인한 뒤 사용합니다.

---

### 페이지 헤더

- `page-pretitle`(상위 메뉴 경로)과 `breadcrumb` 중 **하나만** 씁니다. 이 프로젝트의 기본은 `page-pretitle f:12!`입니다.
  - 메뉴 위치를 한 줄로 보여주면 충분할 때 → `page-pretitle`
  - 실제로 상위 화면으로 이동해야 할 때 → `breadcrumb`
- 브레드크럼 마지막 항목은 링크가 아니며 `active` + `aria-current="page"`를 반드시 지정합니다. 구분자 변형: `breadcrumb-dots` / `breadcrumb-arrows` / `breadcrumb-bullets` / `breadcrumb-muted`.
- 브레드크럼은 제목을 대체하지 않습니다. 항상 `page-title`과 함께 씁니다.

```html
<div class="col">
    <ol class="breadcrumb mb-1" aria-label="현재 위치">
        <li class="breadcrumb-item"><a href="#">영업 관리</a></li>
        <li class="breadcrumb-item active" aria-current="page">월간 현황</li>
    </ol>
    <h2 class="page-title"><span class="text-truncate">월간 매출 현황</span></h2>
</div>
```

---

### 카드

카드는 이 시스템의 **기본 레이아웃 단위**입니다. 검색 영역과 결과 영역은 반드시 별도 카드로 분리합니다.

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-header">
        <h3 class="card-title">주문 목록</h3>
        <div class="card-actions">
            <div class="btn-group">
                <button type="button" class="btn btn-icon bg-muted-lt" aria-label="행 추가">
                    <i class="f:18 ti ti-plus" aria-hidden="true"></i>
                </button>
                <button type="button" class="btn btn-icon bg-muted-lt" aria-label="행 삭제">
                    <i class="f:18 ti ti-minus" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    </div>
    <div class="card-body">…</div>
    <div class="card-footer text-end p-2">
        <div class="btn-list justify-content-end">
            <button type="button" class="btn bg-muted-lt">취소</button>
            <button type="button" class="btn btn-primary">
                <i class="f:20 mr:4 ti ti-check" aria-hidden="true"></i>저장
            </button>
        </div>
    </div>
</div>
```

**규칙**

- `card-header`는 제목/보조제목, `card-body`는 내용, `card-footer`는 **명시적 액션이나 요약**만 담습니다. 역할을 섞지 않습니다.
- 헤더 우측 액션은 **`card-header > card-actions > btn-group`** 3단 구조가 표준입니다. 헤더의 아이콘 액션은 `btn btn-icon bg-muted-lt`를 씁니다 — 카드 헤더는 보조 액션 자리이므로 주 액션 색(`btn-primary`)을 쓰지 않습니다.
- **그리드를 담는 카드는 `form-fieldset p-0`가 이 프로젝트의 표준 래퍼입니다.** `card-body p-0`도 같은 목적으로 쓰이지만 신규 화면은 `form-fieldset p-0`를 우선합니다. 순수 `<table>`을 담는 경우에는 `card-table`을 씁니다.
- **하나의 카드 안에서 여러 정보 섹션을 세로로 나눌 때는 중첩 카드를 만들지 말고** `card-header`(+ 두 번째부터 `border-top`)를 반복합니다.
- 밀도 조절: `card-sm`(조밀) / `card-md` / `card-lg`(여유). 업무 목록·폼은 기본 또는 `card-sm`.
- 그 외: 카드 본문 안에서만 스크롤 `card-body-scrollable`, 테두리 제거 `card-borderless`, 비활성 `card-inactive`.
- 장식용 이미지 카드, 의미 없는 중첩 카드는 만들지 않습니다.

---

### 버튼

```md
주 액션(조회·저장·확인)    btn btn-primary
긍정 확정(승인·완료 처리)   btn btn-success
중립/취소/닫기             btn  또는  btn bg-muted-lt   ← 색 강조 없음
보조 액션(토글·부가 명령)   btn btn-outline-secondary
낮은 강조(툴바 내부)        btn btn-ghost-secondary
위험 액션(삭제·반려)        btn btn-danger  /  btn-outline-danger
아이콘 전용 보조 버튼       btn btn-icon bg-muted-lt   ← 카드 헤더·필터 옆 (프로젝트 표준)
아이콘 전용 일반 버튼       btn btn-icon
버튼 묶음                  btn-list(간격 있음)  /  btn-group(붙임)
```

- 크기: `btn-sm` / 기본 / `btn-lg` 세 가지뿐입니다(1.3.2에 `btn-xs` / `btn-xl`은 **없습니다**). 업무 화면은 **기본 크기와 `btn-sm`만** 쓰고, 미세 조정은 Master CSS `f:` 클래스로 텍스트·아이콘 크기를 맞춥니다.
- 아이콘 + 텍스트: `<i class="f:20 mr:4 ti ti-check" aria-hidden="true"></i>적용`
- 처리 중 상태는 `btn-loading`, 비활성은 `disabled` 속성(`<button>`) 또는 `.disabled` 클래스(`<a>`)를 씁니다.
- **권한·상태에 따라 버튼을 숨길 때는 클래스를 토글합니다.** 이 프로젝트에서는 Master CSS의 `hidden`이 표준입니다.

  ```html
  <button type="button" id="btnDelete" class="btn btn-danger hidden">삭제</button>
  ```

  인라인 `style="display:none"`보다 이 방식이 우선입니다. (Tabler만 쓰는 코드로 옮길 때는 `d-none`으로 바꿔야 합니다 — `hidden`은 Master CSS 제공 클래스입니다.)
- 같은 의미의 액션을 화면마다 다른 색으로 표현하지 않습니다. 새 버튼 스타일 클래스를 임의로 만들지 않습니다.

**토글 버튼 그룹 (상태 필터) — 이 프로젝트의 표준**

목록 화면의 상태 필터는 배지가 아니라 **클릭 가능한 버튼 그룹**으로 만듭니다. 배지는 표시용이지 조작용이 아닙니다.

```html
<div class="btn-group" role="group" aria-label="처리 상태 필터">
    <button type="button" id="btnStatus0" syn-events="['click']" class="btn bg-muted-lt">전체</button>
    <button type="button" id="btnStatus1" syn-events="['click']" class="btn bg-muted-lt">진행중</button>
    <button type="button" id="btnStatus2" syn-events="['click']" class="btn bg-muted-lt">완료</button>
</div>
```

JS 이벤트 바인딩이 필요 없는 순수 CSS 토글이면 `btn-check` 라디오 패턴도 쓸 수 있습니다.

```html
<div class="btn-group" role="group" aria-label="처리 상태 필터">
    <input type="radio" class="btn-check" name="status" id="stAll" checked>
    <label for="stAll" class="btn">전체</label>
    <input type="radio" class="btn-check" name="status" id="stIng">
    <label for="stIng" class="btn">진행중</label>
</div>
```

---

### 배지

```html
<div class="badges-list">
    <span class="badge bg-blue text-blue-fg">진행 중</span>
    <span class="badge bg-green text-green-fg">완료</span>
    <span class="badge bg-yellow-lt">검토 필요</span>
    <span class="badge badge-outline text-azure">승인 대기</span>
    <span class="badge badge-pill bg-purple-lt">VIP</span>
</div>
```

- **배지는 클릭 동작이 없는 짧은 상태·개수 표시 전용**입니다. 클릭해야 하면 버튼 그룹이나 세그먼트 컨트롤을 쓰세요.
- 이 프로젝트의 목록 화면 상태 컬럼은 배지보다 **상태 필터 버튼그룹 + 일반 텍스트 컬럼**이 관례입니다. 배지는 대시보드 요약, 카드 제목 옆 건수 표시 같은 곳에 최소로 씁니다.
- 크기 `badge-sm` / `badge-lg`, 형태 `badge-pill`, 외곽선 `badge-outline`, 점만 표시 `badge-dot`, 아이콘 전용 `badge-icononly`. `badge-notification`은 다른 요소 우상단에 겹쳐 붙는 알림 배지입니다.
- **`badge-blink`(깜빡임)는 업무 화면에서 사용 금지**입니다. 주의 산만하고 접근성 문제(전정 장애·주의력 저하)를 유발합니다.

---

### 알림 (Alert)

```html
<div class="alert alert-warning alert-dismissible" role="alert">
    <div class="d-flex">
        <div class="alert-icon"><i class="f:20 ti ti-alert-triangle" aria-hidden="true"></i></div>
        <div>
            <h4 class="alert-heading">검토가 필요한 항목이 있습니다.</h4>
            <div class="alert-description">
                납기일이 없는 주문 3건을 확인해 주세요. <a href="#" class="alert-link">주문 목록 열기</a>
            </div>
        </div>
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="알림 닫기"></button>
</div>
```

- 색상: `alert-success` / `alert-info` / `alert-warning` / `alert-danger`(+ 팔레트 색 `alert-blue` 등).
- **제목은 `alert-heading`, 본문은 `alert-description`입니다.** `alert-title`은 Tabler 베타 시절 클래스이며 **1.3.2에는 없습니다.** 기존 화면에 남아 있어도 신규 작성에는 쓰지 마세요.
- 강한 배경으로 시선을 끌어야 하면 `alert-important`, 약하게 처리하려면 `alert-minor` / `alert-muted`. 액션이 붙는 알림은 `alert-action`, 항목 나열은 `alert-list`.
- **오류 알림은 원인과 다음 행동을 함께** 씁니다. "오류가 발생했습니다"만 쓰지 마세요.
- 닫기 버튼에는 항상 한글 `aria-label`을 붙이고, 컨테이너에는 `role="alert"`을 붙입니다.
- 저장 성공처럼 잠깐 알리면 되는 경우는 화면 상단에 알림을 쌓지 말고 HandStack의 토스트/노티파이어를 씁니다. 알림은 **화면 문맥 안에서 계속 읽혀야 하는 메시지**에만 씁니다.

---

### 드롭다운

```html
<div class="dropdown">
    <button type="button" class="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="f:20 mr:4 ti ti-adjustments" aria-hidden="true"></i>추가 작업
    </button>
    <div class="dropdown-menu dropdown-menu-end">
        <h6 class="dropdown-header">문서 작업</h6>
        <button type="button" class="dropdown-item">
            <i class="f:18 ti ti-file-text dropdown-item-icon" aria-hidden="true"></i>견적서 만들기
        </button>
        <div class="dropdown-divider"></div>
        <button type="button" class="dropdown-item disabled" disabled>
            <i class="f:18 ti ti-lock dropdown-item-icon" aria-hidden="true"></i>마감 취소
        </button>
    </div>
</div>
```

- 공간을 절약해야 하는 **보조 명령만** 드롭다운에 넣습니다. 주 액션은 화면에 직접 노출합니다.
- 토글에는 `data-bs-toggle="dropdown"` + `aria-expanded="false"`가 필요합니다(동작에 `tabler.min.js` 필요).
- 메뉴 항목은 실제 `button` 또는 `a` 요소로 만듭니다(`div`에 클릭 핸들러 금지 — 키보드 접근 불가).
- 위험 명령은 이름을 명확히 쓰고 실행 전 확인 절차를 둡니다.
- 변형: `dropdown-menu-end`(우측 정렬), `dropdown-menu-arrow`(화살표), `dropdown-menu-card`(카드형 콘텐츠).

---

### 팝업 (`simplemodal-data`)

**Bootstrap `modal` / `modal-dialog`를 업무 팝업에 사용하지 않습니다.** HandStack의 `simplemodal-data` 패턴을 씁니다.

```html
<div id="tplDetail" style="display:none" class="simplemodal-data">
    <div class="card">
        <div class="card-header dialog-header sticky-top p-2">
            <h4 class="card-title">상세 정보</h4>
            <div class="card-actions">
                <button type="button" class="btn btn-icon border-0" aria-label="닫기"
                    syn-options="{triggerConfig:{triggerEvent:'click', method:'syn.$w.closeDialog'}}">
                    <i class="f:18 ti ti-x" aria-hidden="true"></i>
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
- 팝업 헤더는 `card-header dialog-header sticky-top p-2`로 스크롤 중에도 고정되게 합니다.
- 팝업 컨테이너 폭은 `max-width:1200!`을 따릅니다.
- 팝업 안에 또 팝업을 띄우지 않습니다. 단계가 필요하면 하나의 팝업 안에서 `steps`로 전환합니다.
- 아이콘 전용 닫기 버튼에도 `aria-label`이 필요합니다.

---

### 진행률 (Progress)

```html
<div class="mb-2">
    <div class="d-flex mb-1">
        <div>업로드 진행</div>
        <div class="ms-auto text-secondary">72%</div>
    </div>
    <div class="progress">
        <div class="progress-bar bg-blue" style="width: 72%" role="progressbar"
             aria-valuenow="72" aria-valuemin="0" aria-valuemax="100" aria-label="업로드 진행 72퍼센트">
            <span class="visually-hidden">72% 완료</span>
        </div>
    </div>
</div>

<!-- 진행률을 알 수 없는 처리 -->
<div class="progress progress-sm">
    <div class="progress-bar progress-bar-indeterminate bg-purple" role="progressbar" aria-label="동기화 처리 중"></div>
</div>
```

- 값이 **실제로 변하는 작업**(업로드·배치·일괄 처리)에만 씁니다. 정적인 비율 표시에는 쓰지 마세요.
- `role="progressbar"` + `aria-valuenow` / `aria-valuemin` / `aria-valuemax` / `aria-label`을 반드시 제공하고, **퍼센트나 처리 건수를 텍스트로도 표시합니다.**
- 변형: `progress-sm`, `progress-stacked`, `progress-separated`, `progress-bar-striped` / `progress-bar-animated`.
- **`width`는 값에 따라 바뀌는 동적 값이므로 인라인 `style`이 허용되는 유일한 시각 속성입니다.**

---

### 세그먼트 컨트롤 · 탭 · 단계 · 타임라인

| 컴포넌트 | 쓰는 경우 | 핵심 규칙 |
|---|---|---|
| 세그먼트 (`nav nav-segmented`) | 같은 데이터의 보기 방식(일간/주간/월간, 카드형/목록형), 상호 배타적인 소수 옵션 | 선택 상태를 `active`**와** `aria-selected`로 함께 표현. 옵션이 5개를 넘거나 서버에서 오면 `select`/드롭다운으로. **업무 상태 필터는 세그먼트가 아니라 버튼 그룹**을 우선 |
| 탭 (`nav nav-tabs`) | **같은 대상의 다른 측면**(기본정보 / 변경이력) | 서로 다른 업무를 탭으로 묶지 않음. 저장되지 않은 입력이 있는 탭을 벗어날 때 경고. 카드 헤더에 붙일 때 `card-header-tabs`, 카드 자체가 탭이면 `card-tabs` |
| 단계 (`steps`) | 다단계 등록·승인처럼 현재 단계와 남은 순서를 알아야 할 때 | 이동 가능한 단계는 `<a>`/`<button>`, 갈 수 없는 단계는 `<span>`. 현재 단계는 `active` + `aria-current="step"`. 번호 표시 `steps-counter`, 세로 `steps-vertical` |
| 타임라인 (`timeline`) | 이력·감사 로그·결재 흐름 같은 **시간순 읽기 전용** 정보 | 각 항목에 **시각·행위·주체**를 모두 포함하고 시각은 `<time datetime="…">`으로 감쌈. 정렬 순서(최신순/오름차순)를 화면에 명시 |

```html
<nav class="nav nav-segmented" role="tablist" aria-label="매출 조회 기간">
    <button type="button" class="nav-link active" role="tab" data-bs-toggle="tab" aria-selected="true">일간</button>
    <button type="button" class="nav-link" role="tab" data-bs-toggle="tab" aria-selected="false" tabindex="-1">월간</button>
</nav>
```

- **캐러셀(`carousel`)은 업무 입력·조회 흐름에 쓰지 않습니다.** 도움말 슬라이드 같은 시각 자료에만 제한하고, 자동 재생은 끕니다(`data-bs-ride="false"`).

---

## `syn_*` 컴포넌트

HandStack 고유 컴포넌트입니다. **이름이 비슷한 대체 컴포넌트(`syn_combo`, `syn_upload`, `syn_editor`, `syn_calendar` 등)는 존재하지 않으므로 추측으로 만들어 쓰지 마세요.** 아래 표에 없는 이름이 필요하면 먼저 같은 모듈의 기존 화면에서 유사 사례를 찾습니다.

| 용도 | 컴포넌트 | 대체하지 말 것 |
|---|---|---|
| 데이터 그리드 | `syn_auigrid` | 순수 `<table>` (목록 화면 필수) |
| 폼/그리드 데이터소스 바인딩 | `syn_data` | |
| 날짜 선택 | `syn_datepicker` | `<input type="date">` |
| 기간 선택 | `syn_dateperiodpicker` | 날짜 입력 2개 |
| 코드/콤보 선택 | `syn_codepicker` | 코드값 연동이 필요한 `<select>` |
| 트리 | `syn_tree` | |
| 조직 선택 | `syn_organization` | |
| 파일 첨부/다운로드 | `syn_fileclient` | 자체 구현 드롭존 |
| 리치 텍스트 편집 | `syn_htmleditor` | |
| 차트 | `syn_chartjs` | |
| 우클릭 메뉴 | `syn_contextmenu` | |
| 화면 안내 | `syn_guide` | |

- 모든 데이터 바인딩 요소에 `syn-datafield`를 지정합니다(PascalCase: `MainForm`, `Grid1`, `Name`).
- 이벤트 바인딩은 `syn-events="['click']"`, 옵션·검증·트리거는 `syn-options="{...}"`로 지정합니다.

---

## 폼

폼은 업무 화면에서 가장 자주 만들고 가장 자주 틀리는 부분입니다. **라벨 배치는 아래 두 패턴 중 하나만** 씁니다. 일반 Tabler 문서의 "라벨을 입력 위에 쌓는" 예시는 어느 쪽도 아니므로 따르지 마세요.

### 패턴 A — 검색 필터 (`input-group` 좌측 라벨)

조회 조건처럼 한 줄에 여러 항목을 좁게 배치할 때 씁니다.

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-body">
        <div class="row g-2">
            <div class="col-3">
                <div class="input-group">
                    <label class="w:100 col-form-label px-2" for="txtName">이름</label>
                    <input type="text" id="txtName" class="form-control" syn-datafield="Name" />
                </div>
            </div>
            <div class="col-3">
                <div class="input-group">
                    <label class="w:100 col-form-label px-2">상태</label>
                    <div class="btn-group" role="group" aria-label="상태 필터">
                        <button type="button" id="btnStatus0" syn-events="['click']" class="btn bg-muted-lt">전체</button>
                        <button type="button" id="btnStatus1" syn-events="['click']" class="btn bg-muted-lt">진행중</button>
                        <button type="button" id="btnStatus2" syn-events="['click']" class="btn bg-muted-lt">완료</button>
                    </div>
                </div>
            </div>
            <div class="col text-end">
                <div class="btn-list justify-content-end">
                    <button type="button" class="btn bg-muted-lt">
                        <i class="f:20 mr:4 ti ti-filter-off" aria-hidden="true"></i>초기화
                    </button>
                    <button type="button" class="btn btn-primary">
                        <i class="f:20 mr:4 ti ti-search" aria-hidden="true"></i>조회
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
```

- 라벨 자리에는 `<span>`이 아니라 **`<label for="…">`** 을 씁니다. 클릭하면 입력에 포커스가 가고 스크린리더가 라벨을 읽습니다.
- 라벨 폭은 화면 안에서 **하나의 값으로 통일**합니다. 이 프로젝트는 Master CSS `w:100`(px)이 관례이며, 화면마다 인라인 `style="min-width:…"`을 쓰지 않습니다.
- `input-group-flat`은 입력과 버튼 사이 경계를 없앤 검색창 형태입니다. 입력 뒤에 붙는 아이콘 버튼은 `btn btn-icon bg-muted-lt`를 씁니다.

### 패턴 B — 등록/수정 폼 (`row` + `col-N col-form-label`)

단건 입력 폼의 표준입니다.

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-header"><h3 class="card-title">기본 정보</h3></div>
    <div class="card-body">

        <div class="row mb-2">
            <label class="col-2 col-form-label required" for="txtName">이름</label>
            <div class="col-4">
                <input type="text" id="txtName" class="form-control" maxlength="50"
                    syn-datafield="Name" syn-options="{validators:['require']}" />
            </div>
            <label class="col-2 col-form-label px-2" for="txtBizNo">사업자번호</label>
            <div class="col-4">
                <input type="text" id="txtBizNo" class="form-control" maxlength="12" inputmode="numeric"
                    syn-datafield="BizNo" />
                <small class="form-hint">숫자만 입력하면 자동으로 하이픈이 붙습니다.</small>
            </div>
        </div>

        <div class="row mb-2">
            <label class="col-2 col-form-label">기간</label>
            <div class="col-4">
                <syn_dateperiodpicker syn-datafield="Period"></syn_dateperiodpicker>
            </div>
            <label class="col-2 col-form-label px-2">사용 여부</label>
            <div class="col-4">
                <label class="form-check form-switch col-form-label px-2">
                    <input class="form-check-input" type="checkbox" syn-datafield="UseYN" />
                    <span class="form-check-label">사용</span>
                </label>
            </div>
        </div>

        <div class="row">
            <label class="col-2 col-form-label" for="txtRemark">비고</label>
            <div class="col-10">
                <textarea id="txtRemark" class="form-control" rows="3" maxlength="1000" syn-datafield="Remark"></textarea>
            </div>
        </div>

    </div>
    <div class="card-footer text-end p-2">
        <div class="btn-list justify-content-end">
            <button type="button" class="btn bg-muted-lt">취소</button>
            <button type="button" class="btn btn-primary">
                <i class="f:20 mr:4 ti ti-check" aria-hidden="true"></i>저장
            </button>
        </div>
    </div>
</div>
```

**핵심 규칙**

- **라벨은 언제나 입력의 왼쪽입니다.** 밀도가 낮아지고 시선이 상하로 튀는 상단 라벨 레이아웃은 업무 폼에 쓰지 않습니다.
  - 예외: 팝업 안의 좁은 단일 폼처럼 좌측 라벨이 물리적으로 불가능한 경우에만 `form-label`(상단 라벨)을 허용합니다.
- 모든 `label`에는 `for` 속성으로 입력의 `id`를 연결합니다. `syn_*` 컴포넌트처럼 `id`를 붙이기 어려운 경우에는 컴포넌트 쪽에 `aria-label`을 제공합니다.
- **필수 표시는 라벨에 `required` 클래스만 추가합니다.** Tabler CSS가 자동으로 붉은 `*`를 붙입니다(`.required:after`). 라벨 텍스트에 `*`를 직접 쓰지 마세요.
- 라벨 폭(`col-2` / `col-3` / `col-4`)은 **한 화면 안에서 통일**합니다.
- 도움말은 `small.form-hint`, 읽기 전용 표시값은 `form-control-plaintext`(또는 `bg-muted-lt` 배경 입력), 실제 비활성 입력은 `disabled` 속성.
- `placeholder`는 라벨을 대신하지 않습니다. **입력 형식 예시**만 짧게 넣습니다.
- 논리적으로 하나인 항목 묶음은 `fieldset.form-fieldset` + `legend`로 감쌉니다(그리드 래퍼로 쓰는 `form-fieldset p-0`와는 목적이 다릅니다).
- 입력 크기: `form-control-sm` / 기본 / `form-control-lg`. 업무 화면은 기본을 유지합니다.

### 체크·스위치·선택 그룹

```html
<!-- 스위치: 켜짐/꺼짐 라벨 -->
<label class="form-check form-switch">
    <input class="form-check-input" type="checkbox" syn-datafield="AutoYN">
    <span class="form-check-label form-check-label-on">사용</span>
    <span class="form-check-label form-check-label-off">미사용</span>
</label>

<!-- 라디오형 선택 그룹 -->
<div class="form-selectgroup">
    <label class="form-selectgroup-item">
        <input type="radio" name="visitType" value="V" class="form-selectgroup-input" checked>
        <span class="form-selectgroup-label"><i class="f:16 mr:4 ti ti-building-store" aria-hidden="true"></i>방문</span>
    </label>
    <label class="form-selectgroup-item">
        <input type="radio" name="visitType" value="P" class="form-selectgroup-input">
        <span class="form-selectgroup-label"><i class="f:16 mr:4 ti ti-phone" aria-hidden="true"></i>전화</span>
    </label>
</div>
```

- 선택 그룹은 **값이 고정되어 있고 개수가 적을 때(대략 6개 이하)** 만 씁니다.
- **서버 코드·조직·대량 옵션은 선택 그룹이나 네이티브 `select`로 만들지 말고 `syn_codepicker` / `syn_organization`을 씁니다.**
- 변형: `form-selectgroup-pills`(알약형), `form-selectgroup-boxes`(카드형), `form-selectgroup-vertical`.

### 검증

이 프로젝트의 1차 검증 수단은 **`syn-options="{validators:[...]}"`** 입니다. Bootstrap의 `is-invalid`/`invalid-feedback`은 서버 응답 오류처럼 HandStack 검증기로 표현할 수 없는 경우에만 보조로 씁니다.

```html
<label class="col-2 col-form-label required" for="txtPhone">연락처</label>
<div class="col-4">
    <input type="tel" id="txtPhone" class="form-control is-invalid"
        aria-describedby="txtPhoneError" syn-datafield="Phone" syn-options="{validators:['require']}" />
    <div id="txtPhoneError" class="invalid-feedback">휴대전화 번호 11자리를 모두 입력해 주세요.</div>
</div>
```

- 오류: `is-invalid` + `invalid-feedback`, 성공: `is-valid` + `valid-feedback`. 절제된 형태는 `is-invalid-lite` / `is-valid-lite`.
- 오류 입력에는 `aria-describedby`로 메시지 요소를 연결합니다. 스크린리더가 오류 내용을 읽습니다.
- **성공 상태를 모든 필드에 표시하지 않습니다.** 초록 체크가 화면을 뒤덮으면 진짜 오류가 묻힙니다. 중복 확인이 끝난 ID처럼 **확인 결과 자체가 정보인 경우에만** 씁니다.
- **오류 메시지는 해결 방법을 씁니다.** "잘못된 값입니다"(×) → "휴대전화 번호 11자리를 모두 입력해 주세요"(○)
- 첫 번째 오류 필드로 포커스를 이동시킵니다.

---

## 표와 그리드

**업무 목록은 `syn_auigrid`로 만듭니다.** 순수 `<table>`은 RPT 계열 인쇄 화면과, 그리드가 과한 소량의 정적 요약표에만 허용합니다.

```html
<div class="card mt-2">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-header">
        <h3 class="card-title">조회 결과 <span class="badge bg-blue-lt ms-2">128건</span></h3>
        <div class="card-actions">
            <div class="btn-group">
                <button type="button" class="btn btn-icon bg-muted-lt" aria-label="행 추가">
                    <i class="f:18 ti ti-plus" aria-hidden="true"></i>
                </button>
                <button type="button" class="btn btn-icon bg-muted-lt" aria-label="엑셀 내보내기">
                    <i class="f:18 ti ti-file-export" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    </div>
    <div class="form-fieldset p-0">
        <syn_auigrid syn-datafield="Grid1"
            syn-options="{columns:[
                {header:'번호', dataField:'Seq', width:60},
                {header:'거래처', dataField:'CustomerName'},
                {header:'금액', dataField:'Amount', width:120, style:'text-end'},
                {header:'상태', dataField:'Status', width:100, style:'text-center'}
            ]}">
        </syn_auigrid>
    </div>
</div>
```

- **숫자·금액은 우측 정렬**, 코드·상태는 가운데 정렬, 나머지는 좌측 정렬입니다. 그리드에서는 컬럼 정의의 스타일 옵션으로, 순수 표에서는 `text-end` / `text-center`로 지정합니다.
- 결과 건수는 카드 제목 옆 배지로 표시합니다.
- 순수 `<table>`을 쓰는 경우: `table-responsive`로 감싸고, `table table-vcenter table-hover card-table` 조합을 기본으로 합니다. 그 외 `table-nowrap`, `table-sort`, `table-selectable`, `table-striped`, `table-sm`.
- **표를 레이아웃 도구로 쓰지 않습니다.** 표는 표 형태의 데이터 전용입니다.
- 데이터가 없을 때는 빈 영역을 두지 말고 `empty` 컴포넌트로 다음 행동을 안내합니다.

```html
<div class="empty">
    <div class="empty-icon"><i class="f:24 ti ti-search" aria-hidden="true"></i></div>
    <p class="empty-title">조회된 자료가 없습니다</p>
    <p class="empty-subtitle text-secondary">조회 조건을 변경한 뒤 다시 조회해 주세요.</p>
    <div class="empty-action">
        <button type="button" class="btn btn-primary">
            <i class="f:20 mr:4 ti ti-filter-off" aria-hidden="true"></i>조건 초기화
        </button>
    </div>
</div>
```

**요약 정보 표시(`datagrid`)** — 읽기 전용 라벨/값 쌍을 반응형 격자로 배치할 때 씁니다. 편집 폼에는 쓰지 않습니다.

```html
<div class="datagrid">
    <div>
        <div class="datagrid-title">주문번호</div>
        <div>SO-2026-0001</div>
    </div>
</div>
```

- `datagrid`는 `--tblr-datagrid-item-width`(기본 15rem)를 기준으로 자동 배치되는 CSS 그리드입니다. 항목 폭은 이 변수로 조절하고 `col-*`을 덧붙이지 않습니다.
- 1.3.2에서 실제로 스타일이 정의된 클래스는 `datagrid`와 `datagrid-title` 둘뿐입니다. 값 영역에 별도 클래스를 붙이지 마세요.

---

## 화면 유형별 표준 패턴

새 화면을 만들기 전에 **어떤 유형인지 먼저 결정하고** 해당 패턴을 따릅니다.

| 유형 | 구성 | 핵심 | 컨테이너 폭 |
|---|---|---|---|
| 목록(조회) | 필터 카드 + 결과 카드 | 카드 2개 분리, 조회 버튼은 필터 카드 우측 | `max-width:1600!` |
| 상세(입력) | 폼 카드(들) + 카드 푸터 액션 | 패턴 B 좌측 라벨, 저장은 푸터 우측 | `max-width:1600!` |
| 마스터/디테일 | `row g-0` + `col-5 border-end`(마스터) + `col`(디테일) | 한 카드 안에서 좌우 분할 | `max-width:1600!` |
| 사이드 패널형 | `row g-0` + `col-3 border-end`(메타) + `col`(본문) | 좌측은 `card-header` 반복 nested 섹션 | `max-width:1600!` |
| 팝업 | `simplemodal-data` (Bootstrap modal 아님) | 헤더 `sticky-top`, 닫기는 `triggerConfig` | `max-width:1200!` |
| 보고서/인쇄(RPT) | `<body class="bg-white">` + 좁은 컨테이너 | 화면 전용 `<style>` 허용(유일한 예외) | `max-width:1000!` |

### 목록(조회) 화면

```html
<div class="page-body mt-2">
    <div class="container-fluid max-width:1600!">

        <!-- 1. 검색 필터 카드 (패턴 A) -->
        <div class="card">
            <div class="card-status-top bg-dark-overlay"></div>
            <div class="card-body">
                <div class="row g-2">…필터 항목 + 우측 조회 버튼…</div>
            </div>
        </div>

        <!-- 2. 결과 카드 (syn_auigrid) -->
        <div class="card mt-2">
            <div class="card-status-top bg-dark-overlay"></div>
            <div class="card-header">
                <h3 class="card-title">목록 <span class="badge bg-blue-lt ms-2">128건</span></h3>
                <div class="card-actions"><div class="btn-group">…아이콘 액션…</div></div>
            </div>
            <div class="form-fieldset p-0">
                <syn_auigrid syn-datafield="Grid1" syn-options="{columns:[…]}"></syn_auigrid>
            </div>
            <div class="card-footer text-end p-2">
                <div class="btn-list justify-content-end">…취소 / 저장…</div>
            </div>
        </div>

    </div>
</div>
```

- **필터와 결과는 반드시 별도 카드**입니다. 한 카드에 합치면 조회 조건과 결과의 경계가 사라집니다.
- 하단 액션은 `card-footer text-end p-2` + `btn-list`로 충분합니다. 화면이 길어 스크롤 중에도 액션이 보여야 하는 경우에만 `sticky-bottom`을 추가합니다.

### 마스터/디테일 화면

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="row g-0">
        <div class="col-5 border-end">
            <div class="card-header"><h3 class="card-title">마스터</h3></div>
            <div class="card-body p-2"><!-- 마스터 그리드 --></div>
        </div>
        <div class="col">
            <div class="card-header">
                <h3 class="card-title">디테일</h3>
                <div class="card-actions">
                    <div class="btn-group">
                        <button type="button" class="btn btn-icon bg-muted-lt" aria-label="행 추가">
                            <i class="f:18 ti ti-plus" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-icon bg-muted-lt" aria-label="행 삭제">
                            <i class="f:18 ti ti-minus" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body p-2"><!-- 디테일 그리드 또는 폼 --></div>
        </div>
    </div>
</div>
```

- 좌우 분할은 **하나의 카드 안에서** `row g-0` + `border-end`로 합니다. 카드를 두 개 만들면 사이 간격 때문에 마스터-디테일 관계가 시각적으로 끊깁니다.
- 좌측 비율은 마스터 컬럼 수에 따라 `col-5`(균형) 또는 `col-7`(마스터 정보가 많을 때)을 씁니다.
- **`border-end` / `border-top`을 씁니다.** `border-r` / `border-t`는 Tabler에도 Master CSS에도 없는 클래스입니다(Master CSS는 콜론 문법 `br:1` / `bt:1`).

### 사이드 패널형 화면

전자결재 상세처럼 좌측에 문서 메타 정보를 여러 섹션으로 쌓고, 우측에 그리드나 iframe으로 본문을 보여주는 화면입니다.

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="row g-0">
        <div class="col-3 border-end">
            <div class="card-header"><h3 class="card-title">문서정보</h3></div>
            <div class="card-body p-2"><!-- 첫 섹션 폼 --></div>

            <div class="card-header border-top">
                <h3 class="card-title">첨부파일 <span class="badge bg-blue-lt ms-2" id="lblUploadCount">0 / 10</span></h3>
                <div class="card-actions">
                    <div class="btn-group">
                        <button type="button" class="btn btn-icon bg-muted-lt" aria-label="파일 추가">
                            <i class="f:18 ti ti-paperclip" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body p-2">
                <div id="lstDocumentFiles" class="row p-2 align-content-start"></div>
            </div>
            <!-- 필요한 만큼 card-header border-top / card-body p-2 섹션을 반복 -->
        </div>
        <div class="col">
            <iframe id="ifmReport" class="border-0 w-full h-full" title="보고서 미리보기"></iframe>
        </div>
    </div>
</div>
```

- 좌측 컬럼은 하나의 카드 안에서 `card-header`를 반복해 세로 섹션(문서정보 / 관련문서 / 첨부파일 / 결재선)을 쌓습니다. **첫 섹션에는 `border-top`이 없고, 두 번째부터 붙입니다.**
- 동적 목록(첨부파일·결재선·수신자)은 정적 마크업 없이 빈 컨테이너만 두고 JS가 그립니다. Bootstrap `list-group`을 정적으로 채워두지 않습니다.
- `iframe`에는 반드시 `title` 속성을 붙입니다.

### 목록 항목 패널 (`list-group`)

JS가 그리는 선택형 목록에는 `list-group`을 씁니다.

```html
<div class="list-group list-group-flush">
    <div class="list-group-header sticky-top">데이터 원본</div>
    <button type="button" class="list-group-item list-group-item-action active" aria-current="true">
        <div class="row align-items-center">
            <div class="col-auto"><span class="avatar bg-blue-lt text-blue"><i class="f:20 ti ti-database" aria-hidden="true"></i></span></div>
            <div class="col text-truncate">
                <span class="text-body d-block">BDL01</span>
                <div class="text-secondary text-truncate">로컬 데이터베이스</div>
            </div>
            <div class="col-auto"><span class="badge bg-blue-lt">기본</span></div>
        </div>
    </button>
</div>
```

- 클릭 가능한 항목은 **`<button>` 또는 `<a>`** 로 만들고 `list-group-item-action`을 붙입니다. `<div onclick>`은 키보드로 접근할 수 없습니다.
- 선택 상태는 `active` 클래스와 `aria-current="true"`로 함께 표현합니다.

### 보고서/인쇄 화면 (RPT)

`RPT` 계열 화면에 한해 모든 태그와 화면 전용 `<style>` 블록을 허용합니다. **이 유형이 인라인/전용 스타일이 허용되는 유일한 예외입니다.**

- `<body class="bg-white" style="visibility:hidden">`, 컨테이너 폭은 `max-width:1000!`.
- RPT 접두 화면이라도 인쇄용 표가 필요 없는 결재 문서 폼이라면 `<table>` 없이 패턴 B의 카드 + `row`/`col` 폼 구조로 작성해도 됩니다 — "RPT는 table 허용"이지 "RPT는 table 필수"는 아닙니다.
- 인쇄에서 빠져야 하는 요소에는 `d-print-none`을 붙입니다.

---

## 명명·파일 규칙

- 화면 파일은 `{업무코드 3자}{일련번호 3자리}.html`과 동일 이름의 `.js`가 한 쌍입니다. 예: `ATM030.html` + `ATM030.js`
  - 파생 화면(팝업 등)은 일련번호 끝자리로 구분: `ATM010` → `ATM011`, `ATM012`
  - 보고서 화면은 `RPT` 접두어를 사용합니다.
- 경로 구조: `modules/{모듈}/wwwroot/{모듈}/view/{시스템}/{업무}/{화면ID}.html`
- 데이터 바인딩 식별자(`syn-datafield`)는 PascalCase를 씁니다: `MainForm`, `Grid1`, `Name`
- HTML을 만들면 반드시 짝이 되는 `.js`도 함께 만들거나, 팝업 조각처럼 JS가 불필요한 경우 그 이유를 명시합니다.
- 버튼 동작이 복잡한 팝업/상세 화면은 사용법을 설명하는 `{화면ID}.md`(버튼별 동작 설명표 등)를 함께 두는 관례가 있습니다(`CRM081.md`, `ODM011.md`). 필요하면 같이 작성합니다.

---

## 유틸리티

프로젝트 CSS를 새로 만들기 전에 **항상 유틸리티로 해결되는지 먼저 확인**합니다.

### Master CSS (치수·간격 — 이 프로젝트 우선)

| 목적 | 클래스 예시 | 비고 |
|---|---|---|
| 폰트/아이콘 크기 | `f:12`, `f:18`, `f:20`, `f:12!` | 숫자는 px |
| 너비 | `w:100`, `w:120`, `w:120!` | 라벨·인풋 고정 너비 |
| 여백 | `mr:4`, `mr:2`, `p:10!` | **콜론** 문법 |
| 테두리 | `b:1` | |
| 줄 높이 | `line-height:40` | |
| 컨테이너 폭 | `max-width:1600!`, `max-width:1200!`, `max-width:1000!` | 화면 성격별 |
| 표시/숨김 | `hidden` | Master CSS 시맨틱 클래스(= `display:none`) |

끝의 `!`는 Master CSS의 `!important` 문법입니다. 기존 스타일을 덮어써야 할 때만 씁니다.

### Tabler / Bootstrap (구조·의미)

| 목적 | 클래스 |
|---|---|
| 테두리 방향 | `border` `border-top` `border-end` `border-bottom` `border-start` `border-x` `border-y` |
| 테두리 제거 | `border-0` `border-top-0` `border-end-0` `border-bottom-0` `border-start-0` |
| 테두리 두께/색 | `border-1`~`border-5`, `border-wide`, `border-primary` … `border-*-subtle`, `border-opacity-10/25/50/75/100` |
| 반경 | `rounded-0` `rounded` `rounded-1`~`rounded-3` `rounded-circle` `rounded-pill` |
| 여백 | `m`/`p` + 방향(`t` `b` `s` `e` `x` `y`) + 스케일(`0`~`6`, `auto`) — 예: `mt-2`, `px-2`, `mx-auto` |
| 그리드 간격 | `g-*` / `gx-*` / `gy-*` |
| 표시/숨김 | `d-none` `d-block` `d-flex` `d-inline-flex`, 반응형 `d-none d-md-block` |
| 인쇄 제어 | `d-print-none` `d-print-block` |
| 정렬 | `text-start` `text-center` `text-end`, `justify-content-end` `align-items-center` `ms-auto` |
| 세로 정렬 | `align-baseline` `align-top` `align-middle` `align-bottom` (인라인 요소·표 셀 전용) |
| 커서 | `cursor-pointer` `cursor-not-allowed` `cursor-progress` `cursor-wait` `cursor-move` `cursor-help` 등 |
| 스크린리더 전용 | `visually-hidden` |
| 넘침 | `overflow-auto` `overflow-hidden` `text-truncate` |
| 고정 | `sticky-top` `sticky-bottom` |
| 크기 | `w-100` `h-100` `w-full` `h-full` `w-1`(표 최소폭 컬럼) |

**적용 원칙**

- 테두리는 **섹션 구분에만** 씁니다. 카드 내부 후속 섹션은 `border-top`, 좌우 분할은 `border-end`, 불필요한 선 제거는 `border-0`. 임의 색상·두께의 인라인 border 스타일은 쓰지 않습니다.
- **실제로 클릭 가능한 요소에만 `cursor-pointer`를 붙입니다.** 단순 텍스트·장식 아이콘에 붙이면 클릭 가능해 보이는 거짓 신호가 됩니다. 비활성 컨트롤은 `cursor-not-allowed`만으로 끝내지 말고 `disabled` 상태와 **왜 비활성인지 설명**을 함께 제공합니다.
- 세로 정렬 클래스는 `vertical-align` CSS 속성이므로 **인라인 요소와 표 셀에만** 적용됩니다. 행 내부 수직 정렬은 `row align-items-center` 또는 `d-flex align-items-center`를 씁니다. 표 전체는 셀마다 붙이지 말고 `table-vcenter`를 씁니다.
- 인라인 `style=""`은 `display` / `visibility` 토글과 `progress-bar`의 `width` 같은 **동적 값**에만 허용합니다. 숨김은 가능하면 인라인 스타일 대신 `hidden` 클래스 토글을 씁니다.

---

## 접근성

업무 화면은 매일 오래 쓰는 도구입니다. 접근성은 선택이 아니라 품질 요건입니다.

- **모든 입력에 라벨을 연결합니다.** `label[for]` ↔ `input[id]`. 시각적 라벨이 없거나 `syn_*` 컴포넌트라 `id` 연결이 어려우면 `aria-label`을 씁니다.
- **아이콘 전용 버튼에는 `aria-label`이 필수**이고, 아이콘 자체는 `aria-hidden="true"`입니다.
- 클릭·키보드 조작 대상은 `<button>` / `<a>` / `<input>`으로 만듭니다. `div`·`span`에 `onclick`을 달지 않습니다.
- 상태를 색으로만 알리지 않습니다. 텍스트·아이콘·형태를 함께 제공합니다.
- 동적 영역에는 `role`과 `aria-*`를 붙입니다: 알림 `role="alert"`, 진행 `role="progressbar"` + `aria-valuenow`, 탭 `role="tablist"`/`tab`/`tabpanel` + `aria-selected`, 현재 위치 `aria-current="page"` / `"step"`.
- 팝업은 열릴 때 포커스를 팝업 안으로 이동시키고, 닫기 버튼에 한글 `aria-label`을 붙입니다.
- 오류는 `aria-describedby`로 메시지 요소와 연결합니다.
- 링크·버튼 텍스트만으로 동작을 알 수 있어야 합니다. "여기", "클릭" 금지.
- **자동으로 움직이는 것을 만들지 않습니다.** 캐러셀 자동 재생, `badge-blink`, 불필요한 아이콘 애니메이션은 쓰지 않습니다.
- 키보드만으로 조회 → 입력 → 저장 전체 흐름이 가능해야 합니다. `tabindex`에 양수를 쓰지 않습니다.
- `iframe`에는 `title`을 붙입니다.

---

## 해야 할 것 / 하지 말 것

### 해야 할 것

- 로컬 번들(`/lib/tabler-core`, 1.3.2)을 쓰고, 클래스명은 사용 전에 실재 여부를 확인합니다.
- 페이지 골격(`page` → `page-wrapper` → `page-header` + `page-body` → `container-fluid` + `max-width:*!`)을 그대로 지킵니다.
- 검색 영역과 결과 영역을 별도 카드로 분리합니다.
- 메인 콘텐츠 카드에 `card-status-top bg-dark-overlay`를 붙입니다.
- 목록은 `syn_auigrid`, 그리드 래퍼는 `form-fieldset p-0`를 씁니다.
- 폼 라벨은 항상 입력 왼쪽에 두고, 라벨 폭을 화면 안에서 통일합니다.
- 필수 표시는 라벨의 `required` 클래스로만 합니다.
- 검증은 `syn-options="{validators:[...]}"`를 1차 수단으로 씁니다.
- 동일 상태 코드는 전 화면에서 같은 색을 씁니다. 색상 매핑은 JS 한 곳에 모읍니다.
- 아이콘은 `ti ti-*` 웹폰트로 쓰고 크기는 `f:NN`으로 조절합니다.
- 아이콘 전용 버튼에 `aria-label`, 텍스트 옆 아이콘에 `aria-hidden="true"`를 붙입니다.
- 오류 메시지에 **원인과 해결 방법**을 씁니다.
- 조회 결과가 없을 때 `empty` 컴포넌트로 다음 행동을 안내합니다.
- 숫자·금액은 우측 정렬합니다.
- 숨김 토글은 `hidden` 클래스로 처리합니다.
- HTML을 만들면 짝이 되는 `.js`도 함께 만듭니다.

### 하지 말 것

```md
- 임의의 HEX 색상이나 인라인 색상 스타일을 쓰지 말 것 (Tabler 색상 유틸리티 사용)
- 시각적 스타일을 인라인 style로 넣지 말 것 (display/visibility 토글, progress-bar width 같은 동적 값만 예외)
- container-xl 등 고정 폭을 업무 화면 기본 컨테이너로 쓰지 말 것 (container-fluid + max-width:NNNN! 사용)
- 순수 <table>로 업무 목록을 만들지 말 것 (syn_auigrid 사용, RPT 보고서 화면만 예외)
- Bootstrap modal을 업무 팝업에 사용하지 말 것 (simplemodal-data + triggerConfig 사용)
- 라벨을 입력 위에 쌓는 일반 Tabler 폼 레이아웃을 업무 폼에 쓰지 말 것 (좌측 라벨 패턴 A 또는 B 사용)
- 필수 표시를 라벨 텍스트에 "*"로 하드코딩하지 말 것 (label에 required 클래스만 추가)
- 상태 색을 화면마다 다르게 하드코딩하지 말 것 (상태 코드 → 색상 매핑 함수 사용)
- 클릭해야 하는 상태 필터를 배지로 만들지 말 것 (btn-group + btn bg-muted-lt 사용)
- SVG 아이콘과 웹폰트 아이콘을 섞어 쓰지 말 것 (ti ti-* 웹폰트로 통일)
- 웹폰트 아이콘에 icon-sm / icon-lg를 쓰지 말 것 (SVG 전용 클래스, f:NN 사용)
- FontAwesome, Bootstrap Icons 등 타 아이콘 폰트를 쓰지 말 것
- Tabler 문법과 Master CSS 문법을 섞지 말 것
    (Tabler는 하이픈: me-2, border-top / Master CSS는 콜론: mr:4, f:20)
- 존재하지 않는 클래스를 추측해서 쓰지 말 것
    (없음: alert-title, border-dashed, border-dotted, border-r, border-t, ml-*, mr-*,
           tracking-tight, btn-xs, btn-xl, align-content-baseline)
    (없는 아이콘 예: ti-organization → ti-sitemap 사용)
    (참고: hidden은 Master CSS가 제공하므로 이 프로젝트에서는 유효)
- 존재하지 않는 syn_* 컴포넌트 이름을 추측해서 쓰지 말 것 (표에 없으면 기존 화면에서 유사 사례를 먼저 확인)
- 카드 안에 의미 없는 카드를 중첩하지 말 것 (card-header + border-top 반복으로 섹션 분리)
- 표를 레이아웃 도구로 쓰지 말 것
- div·span에 onclick을 달아 클릭 요소를 만들지 말 것 (button / a 사용)
- 팝업 위에 팝업을 띄우지 말 것 (steps로 단계 전환)
- badge-blink와 캐러셀 자동 재생을 쓰지 말 것
- 모든 필드에 성공 검증 표시(is-valid)를 뿌리지 말 것
- 새 CSS 클래스·버튼 스타일을 화면 단위로 만들지 말 것 (유틸리티 조합으로 해결, 반복되면 공용 CSS에 한 번만 정의)
- CDN @latest를 참조하지 말 것 (로컬 번들 사용, 버전은 libman.json이 고정)
```

---

## 준수 검증 체크리스트

새 화면을 만든 뒤 아래를 확인합니다. 1~9번은 grep으로 기계 검증이 가능합니다.

| # | 검증 항목 | 확인 방법 |
|---|---|---|
| 1 | 타 아이콘 폰트·SVG 미사용 | `fa-`, `bi-`, `<svg` 검색 결과 0건 |
| 2 | HEX 색상 하드코딩 없음 | `#` 뒤 3·6자리 HEX가 `class`/`style`에 없음 |
| 3 | 인라인 시각 스타일 없음 | `style="` 안에 `color` `background` `font-size` `border` 없음 (progress `width`, `display`/`visibility` 제외) |
| 4 | 존재하지 않는 클래스 없음 | `alert-title`, `border-dashed`, `border-r`, `border-t`, `ml-`, `mr-`(하이픈), `tracking-` 검색 결과 0건 |
| 5 | 기본 컨테이너 준수 | `container-xl` 0건, `container-fluid` + `max-width:*!` 존재 |
| 6 | Bootstrap modal 미사용 | `modal-dialog` 검색 결과 0건 |
| 7 | 필수 표시 준수 | 라벨 텍스트에 `*` 하드코딩 없이 `required` 클래스 사용 |
| 8 | 데이터 바인딩 지정 | 입력 컨트롤·그리드에 `syn-datafield` 존재 |
| 9 | 짝 파일 존재 | `{화면ID}.html`과 `{화면ID}.js`가 쌍으로 존재 |
| 10 | 화면 유형 템플릿 준수 | 「화면 유형별 표준 패턴」의 골격·컨테이너 폭과 일치 |
| 11 | 라벨 배치·연결 | 폼 라벨이 좌측(패턴 A 또는 B)이고 폭이 통일됨, `label[for]` ↔ `input[id]` 연결 |
| 12 | 아이콘 접근성 | 아이콘 전용 버튼에 `aria-label`, 텍스트 옆 아이콘에 `aria-hidden="true"` |
| 13 | 상태 색상 일관성 | 동일 상태 코드가 기존 화면과 같은 색·같은 컴포넌트로 표현됨 |
| 14 | `syn_*` 컴포넌트 존재 확인 | 사용한 `syn_*` 태그가 표에 있거나 동일 모듈 내 기존 사용례가 있음 |
| 15 | 정렬 규칙 | 숫자·금액이 우측 정렬, 상태 코드가 가운데 정렬 |
| 16 | 빈 상태 처리 | 조회 결과 0건일 때 `empty` 컴포넌트가 표시됨 |
| 17 | 피드백 품질 | alert·검증 메시지에 원인과 다음 행동이 텍스트로 포함됨 |
| 18 | 키보드 접근 | 조회 → 입력 → 저장 전 과정이 키보드만으로 가능 |

---

## 참고 링크

**Layout** — [Page headers](https://docs.tabler.io/ui/layout/page-headers) · [Page layouts](https://docs.tabler.io/ui/layout/page-layouts)

**Components** — [Alerts](https://docs.tabler.io/ui/components/alerts) · [Badges](https://docs.tabler.io/ui/components/badges) · [Breadcrumb](https://docs.tabler.io/ui/components/breadcrumb) · [Buttons](https://docs.tabler.io/ui/components/buttons) · [Cards](https://docs.tabler.io/ui/components/cards) · [Dropdowns](https://docs.tabler.io/ui/components/dropdowns) · [Empty states](https://docs.tabler.io/ui/components/empty) · [Progress bars](https://docs.tabler.io/ui/components/progress) · [Segmented Control](https://docs.tabler.io/ui/components/segmented-control) · [Steps](https://docs.tabler.io/ui/components/steps) · [Timelines](https://docs.tabler.io/ui/components/timelines)

**Forms** — [Form elements](https://docs.tabler.io/ui/forms/form-elements) · [Form fieldset](https://docs.tabler.io/ui/forms/form-fieldset) · [Form selectgroup](https://docs.tabler.io/ui/forms/form-selectboxes) · [Validation states](https://docs.tabler.io/ui/forms/form-validation)

**Utilities** — [Borders](https://docs.tabler.io/ui/utilities/borders) · [Cursors](https://docs.tabler.io/ui/utilities/cursors) · [Margins](https://docs.tabler.io/ui/utilities/margins) · [Vertical align](https://docs.tabler.io/ui/utilities/vertical-align)

**Base** — [Colors](https://docs.tabler.io/ui/base/colors) · [Typography](https://docs.tabler.io/ui/base/typography) · [Tabler Icons](https://tabler.io/icons) · [Icons webfont](https://docs.tabler.io/icons/libraries/webfont)

**Master CSS** — [Documentation](https://rc.css.master.co/docs)

> **Tabler 공식 문서와 이 문서가 충돌하면 이 문서를 따릅니다.** 공식 문서는 범용 관리자 템플릿을 전제로 하고, 이 문서는 HandStack 런타임 위에서 동작하는 밀도 높은 사내 업무 화면을 전제로 하기 때문입니다.
