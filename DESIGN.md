---
version: 1.1
name: HandStack 업무 화면 디자인 시스템
description: >-
  Tabler CSS(Bootstrap 5 기반) + Tabler Icons 웹폰트 + Master CSS 유틸리티 + HandStack
  syn.loader 런타임으로 업무 화면(목록·상세·마스터/디테일·사이드패널·대시보드·배치처리·팝업·보고서)을
  일관되게 구성하고, 화면 저작 도구가 같은 규칙을 구성요소로 제공하기 위한 디자인 지침.
  모든 클래스명은 이 저장소에 번들된 @tabler/core 1.3.2 배포본 CSS에서 실재를 확인했습니다.
stack:
  tabler: "@tabler/core@1.3.2 (Bootstrap 5 기반)"
  icons: "@tabler/icons-webfont@3.25.0"
  utility: "@master/css (런타임 엔진)"
  runtime: "syn.loader.js (HandStack)"
  js: "tabler.min.js (드롭다운·탭·알림 닫기 등 Bootstrap 동작)"
  locale: "ko-KR 우선"
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
surfaces:
  bg-surface: "라이트 #ffffff / 다크 #1f2937 (--tblr-bg-surface, 카드)"
  bg-surface-secondary: "라이트 #f9fafb / 다크 #111827 (페이지 배경)"
  bg-surface-tertiary: "라이트 #f9fafb / 다크 #1f2937 (세그먼트·입력 트랙)"
  border-color: "라이트 #e5e7eb / 다크 #2e3c51"
  body-bg: "라이트 #f9fafb / 다크 #111827"
  body-color: "라이트 #1f2937 / 다크 #e5e7eb"
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
  weights: { normal: 400, medium: 500, semibold: 600, bold: 700 }
  mono:
    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
spacing:
  "0": 0
  "1": 0.25rem
  "2": 0.5rem
  "3": 1rem
  "4": 1.5rem
  "5": 2rem
  "6": 2.5rem
  card-x: 1.25rem
  card-y: 1rem
  page-padding: 1rem
rounded:
  sm: 4px
  DEFAULT: 6px
  lg: 8px
  xl: 1rem
  pill: 100rem
  circle: 50%
elevation:
  flat: "면 분리(회색 페이지 배경 + 흰 카드)"
  border: "1px 경계선(border-top / border-end)"
  status: "card-status-top / card-status-start 띠"
  shadow: "드롭다운·팝업처럼 실제로 떠 있는 요소만 (Tabler 기본값)"
containers:
  list-detail: "max-width:1600!"
  popup: "max-width:1200!"
  report: "max-width:1000!"
  breakpoints: { sm: 576px, md: 768px, lg: 992px, xl: 1200px, xxl: 1400px }
components:
  page:
    backgroundColor: body-bg
    container: "container-fluid + 화면 유형별 max-width"
  card:
    backgroundColor: bg-surface
    rounded: lg
    statusBar: "card-status-top bg-dark-overlay"
  button-primary: { backgroundColor: primary, textColor: light, rounded: DEFAULT }
  button-neutral: { backgroundColor: light, textColor: body-color, rounded: DEFAULT }
  button-subtle:  { backgroundColor: "muted-lt", textColor: body-color, rounded: DEFAULT }
  button-danger:  { backgroundColor: danger,  textColor: light, rounded: DEFAULT }
  button-icon:    { backgroundColor: "muted-lt", rounded: DEFAULT }
  input: { backgroundColor: light, textColor: body-color, rounded: DEFAULT, height: 2.25rem }
  badge: { rounded: sm, typography: h5 }
  grid-wrapper: { class: "form-fieldset p-0", padding: 0 }
---

# DESIGN.md — HandStack 업무 화면 지침

이 문서는 **AI 코딩 에이전트와 개발자, 그리고 화면 저작 도구가 HandStack 업무 화면(HTML)을 만들 때 따르는 단일 기준**입니다.
Tabler 공식 문서는 "무엇이 존재하는가"를 알려주고, 이 문서는 **"그중 무엇을 언제, 어떤 조합으로 쓰는가"** 를 정합니다.
**둘이 충돌하면 이 문서가 우선합니다.**

## 문서 정보

| 항목 | 내용 |
|---|---|
| 적용 범위 | `wwwroot` 업무 화면 HTML 전체 — 목록(조회)·상세(입력)·마스터/디테일·사이드패널·대시보드·배치처리·팝업·보고서 |
| 기준 버전 | 저장소 번들 기준 `@tabler/core` **1.3.2**, `@tabler/icons-webfont` **3.25.0** (정본: `2.Modules/wwwroot/libman.json`) |
| 적용 원칙 | 신규 화면은 필수 준수. 기존 화면은 **수정하는 범위 내에서만** 점진 적용(일괄 리팩터링 금지) |
| 검증 근거 | 이 문서의 모든 클래스명은 `2.Modules/wwwroot/wwwroot/lib/tabler-core/dist/css/tabler.min.css`(1.3.2)와 `.../tabler-icons-webfont/dist/tabler-icons.min.css`(3.25.0)에서 실재를 확인함 |
| 저작 도구 | 「디자인 저작 구성요소」 장이 도구상자 분류·속성 모델·구성요소 정의 스키마의 정본 |
| 개정 절차 | 규칙을 바꿀 때는 이 문서를 먼저 고치고, 근거가 되는 실제 화면 경로를 함께 기록(「반복 개선 가이드」) |

### 참조 자산

HandStack 화면은 CDN이 아니라 **`wwwroot` 모듈이 배포하는 로컬 번들**을 사용합니다. 버전은 `libman.json`이 고정하며 화면이 개별적으로 참조 URL을 바꾸지 않습니다.

```text
/lib/tabler-core/dist/css/tabler.min.css             ← @tabler/core@1.3.2
/lib/tabler-core/dist/js/tabler.min.js               ← 드롭다운·탭·알림 닫기 등 동작
/lib/tabler-icons-webfont/dist/tabler-icons.min.css  ← @tabler/icons-webfont@3.25.0
/lib/master-css/index.min.js                         ← syn.loader.js가 런타임 로드
```

- **`@latest` 참조는 금지합니다.** 예고 없는 스타일 변경 위험이 있고, 로컬 번들과 클래스 목록이 어긋납니다. 새 클래스가 필요하면 CDN을 가리키지 말고 `libman.json` 버전을 올린 뒤 번들을 갱신합니다.
- 이 문서에서 "존재한다/존재하지 않는다"는 판단은 모두 **1.3.2 번들 기준**입니다. 상위 버전(1.5.x) 문서·블로그의 클래스명을 그대로 옮겨 쓰지 마세요. 1.5.x에만 있고 **1.3.2에는 없는** 대표 사례: `progress-steps`, `btn-xl`, `progress-lg`.
- 날짜 선택·코드 선택·차트·파일 업로드·리치 텍스트처럼 일반 Tabler 프로젝트가 플러그인(Litepicker·Tom Select·ApexCharts·Dropzone·Quill)으로 해결하는 영역은 **HandStack에서 `syn_*` 컴포넌트가 대신합니다.** 대응표는 「`syn_*` 컴포넌트」 장에 있습니다.

---

## 개요

업무 화면은 마케팅 페이지가 아닙니다. **밀도 높은 데이터를 빠르게 읽고, 정확하게 입력하고, 실수 없이 저장하는 것**이 유일한 목표입니다.

- **조용한 인터페이스** — 기본 톤은 회색(`gray-50` 배경 + 흰 카드 + `gray-200` 경계선)입니다. 색은 장식이 아니라 **신호**입니다. 한 화면에 강조색이 여러 개 보이면 설계가 잘못된 것입니다.
- **높은 정보 밀도** — 본문 글자 크기가 `0.875rem`(14px)로 일반 웹사이트보다 작습니다. 여백을 넉넉히 주기보다 **카드로 구획을 나눠** 밀도를 감당합니다.
- **예측 가능한 배치** — 같은 업무는 같은 자리에 있어야 합니다. 조회 버튼은 항상 필터 카드 오른쪽, 저장 버튼은 항상 카드 푸터 오른쪽, 신규 등록은 항상 페이지 헤더 오른쪽입니다.
- **한 화면 한 목적** — 하나의 화면은 하나의 업무 단위를 처리합니다. 부가 작업은 팝업이나 별도 화면으로 분리합니다.
- **대상 사용자** — 하루 종일 같은 화면을 쓰는 내부 실무자. 화려함보다 **키보드 이동, 일관된 라벨 위치, 명확한 오류 메시지**가 훨씬 중요합니다.
- **한국어 우선** — 라벨·버튼·안내·오류 메시지·`aria-label`은 모두 한국어로 작성합니다. 코드·식별자만 영문이고, 영문 기본 메시지를 그대로 노출하지 않습니다.

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
- **같은 요소의 같은 속성을 두 체계로 중복 지정하지 않습니다.** 고정 치수(`w:120`, `f:20`)는 Master CSS, 레이아웃 의미가 분명한 간격·정렬(`mt-2`, `px-2`, `g-0`, `align-items-center`)은 Tabler 유틸리티가 기본입니다.

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
| Dark | `--tblr-dark` | `#1f2937` | 본문 텍스트, 중립 강조 |

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
- **면(surface) 색은 직접 지정하지 말고 Tabler의 표면 변수를 따릅니다.** 1.3.2 번들에도 같은 체계가 있습니다: `--tblr-bg-surface`(카드), `--tblr-bg-surface-secondary`(페이지 배경), `--tblr-bg-surface-tertiary`(세그먼트·입력 트랙). 유틸리티는 `bg-surface` / `bg-surface-secondary` / `bg-surface-tertiary`입니다.

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

- **HandStack 목록 화면에서 상태는 "표시"보다 "필터"인 경우가 많습니다.** 검색 카드 안의 `btn-group` + `btn bg-muted-lt` 토글 버튼이 이 프로젝트의 표준이며, 배지는 클릭 동작이 없는 요약·건수 표시에만 씁니다(「버튼」·「배지 · 태그 · 상태 표시」 참고).
- 그리드 상태 컬럼의 색상은 HTML에 하드코딩하지 않습니다. **JS에 `상태코드 → 클래스` 매핑 함수를 한 곳에 두고** `syn_auigrid` 렌더러에서 적용합니다.
- **색상만으로 의미를 전달하지 않습니다.** 상태명 텍스트, 아이콘, 부호(`-12%`), 검증 메시지를 함께 제공합니다(색각 이상 사용자 대응).

### 다크 모드

Tabler는 루트 요소의 `data-bs-theme`로 테마를 전환하고, 이 저장소에도 `2.Modules/wwwroot/wwwroot/css/dark_mode.css`가 있습니다.

```html
<html lang="ko" data-bs-theme="light">
```

- 값은 `light` / `dark` / `auto`입니다. 관련 속성: `data-bs-theme-base`(회색 팔레트), `data-bs-theme-font`, `data-bs-theme-primary`, `data-bs-theme-radius`.
- 테마 전환 스크립트는 **브라우저가 첫 페인트를 하기 전에** 실행되어야 합니다. 그렇지 않으면 화면이 깜빡입니다.
- **모든 색을 위 유틸리티와 CSS 변수로만** 지정하십시오. HEX를 직접 쓴 요소는 다크 모드에서 그대로 깨집니다.

---

## 타이포그래피

본문 기준은 `0.875rem`(14px) / `line-height 1.43` / `font-weight 400`입니다. 제목 가중치는 600입니다.

### 크기 스케일

이 프로젝트는 글자·아이콘 크기를 **Master CSS `f:NN`(px)** 으로 지정하는 것이 관례입니다. Tabler의 `fs-*`도 유효하지만, 한 화면 안에서 두 체계를 섞지 마세요.

| 의미 | Master CSS (권장) | Tabler 동등 | 크기 | 용도 |
|---|---|---|---|---|
| h1 | `f:24` | `fs-1` / `.h1` | 1.5rem (24px) | 지표 숫자, KPI 값, 큰 아이콘 |
| h2 | `f:20` | `fs-2` / `.h2` | 1.25rem (20px) | `page-title`, 버튼·헤더 아이콘 |
| h3 | `f:16` | `fs-3` / `.h3` | 1rem (16px) | `card-title`, 인라인 아이콘 |
| h4 | `f:14` | `fs-4` / `.h4` | 0.875rem (14px) | 본문, 소제목 |
| h5 | `f:12` | `fs-5` / `.h5` | 0.75rem (12px) | `page-pretitle`, 배지, 힌트 |
| h6 | `f:10` | `fs-6` / `.h6` | 0.625rem (10px) | 극히 예외적인 보조 라벨 |

### 규칙

- **의미에 맞는 요소를 쓰고, 크기는 클래스로 조정합니다.** 글자를 크게 하려고 `h1`을 쓰지 마세요. 시각적 크기만 필요하면 `<div class="h3">`처럼 `.h1`~`.h6` 클래스를 씁니다.
- 화면 최상위 제목은 `h2.page-title`, 카드 제목은 `h3.card-title`을 기본으로 하고 제목 계층(`h2`→`h3`→`h4`)을 건너뛰지 않습니다.
- 보조 설명은 `text-secondary`, 더 낮은 강조는 `text-muted`를 씁니다. 입력 아래 도움말은 `small.form-hint`입니다.
- 가중치는 `fw-normal`(400) / `fw-medium`(500) / `fw-semibold`(600) / `fw-bold`(700)를 씁니다. **`font-weight-semibold`는 존재하지 않습니다.**
- 강조는 `strong`, `em`, `code`, `kbd`, `mark`, `time`, `abbr` 같은 **시맨틱 요소**로 표현합니다. `b`·`i`·밑줄·색상만으로 의미를 만들지 않습니다.
- 긴 값이 레이아웃을 깨면 `text-truncate`로 자릅니다. 이 클래스는 폭이 정해진 부모(그리드의 `col`, `w-100`, 표 셀) 안에서만 동작하므로 반드시 그런 컨테이너 안에 둡니다. 잘린 전체 값은 `title` 속성으로 제공합니다.
- 인라인 `style="font-size:..."`와 새 타이포그래피 CSS 클래스를 만들지 않습니다.
- 그 외 보조 클래스: `text-uppercase`, `text-nowrap`, `lh-1` / `lh-sm`, `subheader`(대문자 소형 라벨), `hr-text`(가운데 글자 있는 구분선).
  - `tracking-tight` / `tracking-wide`는 **1.3.2 번들에 없습니다.** 자간은 조정하지 않습니다.
- 한글 본문의 자간·행간을 임의로 좁히지 않습니다. 14px 한글은 기본 행간이 이미 빡빡합니다.

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
  - 일반 목록/상세/마스터·디테일/대시보드 → `max-width:1600!`
  - 팝업/좁은 폭 화면 → `max-width:1200!`
  - 인쇄/결재문서 폼(RPT 계열) → `max-width:1000!`
- `page-header`에는 `d-print-none`을 붙여 인쇄 시 숨깁니다. 오른쪽 액션은 항상 `col-auto ms-auto d-print-none > btn-list`입니다.
- 헤더 아래 구분선이 필요하면 `page-header page-header-border`를 씁니다.
- **`page-header` / `page-body`는 이미 `--tblr-page-padding`(1rem)만큼 세로 여백을 가집니다.** 이 프로젝트의 관례인 `mt-2` 외에 `m-3`·`mt-4` 같은 여백을 관성적으로 덧붙이지 마세요. 여백이 두 번 들어가 화면 밀도가 무너집니다.
- `<body style="visibility:hidden">`은 렌더링 완료 후 HandStack이 해제하므로 그대로 유지합니다. RPT 계열은 `<body class="bg-white" style="visibility:hidden">`처럼 `bg-white`를 추가합니다.
- 저장·조회 같은 주 액션은 **모바일에서도 숨기지 않습니다.** 숨겨도 되는 보조 액션에만 `d-none d-md-inline-flex`를 씁니다.

### 그리드와 간격

- 12칼럼 Bootstrap 그리드(`row` / `col` / `col-3` / `col-md-6` / `col-auto`)를 씁니다.
- 카드를 나열하는 행은 `row row-cards`, **높이를 맞춰야 하면** `row row-deck row-cards`를 씁니다.
- 행 내부 간격은 `g-2`(0.5rem) / `g-3`(1rem)을 기본으로 하고, 카드 안에서 경계선을 붙여 분할할 때는 `g-0`을 씁니다.
- 간격 스케일(1.3.2 기준): `0`=0, `1`=0.25rem, `2`=0.5rem, `3`=1rem, `4`=1.5rem, `5`=2rem, **`6`=2.5rem**.
  - 방향: `m`/`mt`/`mb`/`ms`/`me`/`mx`/`my`, 패딩은 `p`/`pt`/`pb`/`ps`/`pe`/`px`/`py`. 가운데 정렬은 `mx-auto`.
  - **논리적 방향(`ms`/`me`)만 씁니다.** `ml-*` / `mr-*` / `pl-*` / `pr-*`은 Bootstrap 5에 없습니다. Master CSS의 `mr:4`(콜론)와 혼동하지 마세요.
- 플렉스 레이아웃 간격은 `gap-1`~`gap-6`, 형제 요소 세로 간격은 `space-y-*`, 항목 사이 구분선이 필요하면 `divide-y`를 씁니다(모두 1.3.2에 있습니다).
- **HandStack 화면의 실무 기본값**: 카드 사이 간격은 `mt-2`, 폼 행 사이는 `mb-2`(조밀) / `mb-3`(일반), 조밀한 카드 본문은 `card-body p-2`.
- 구조의 고정 치수(`w:120`, `mr:4`)는 Master CSS, 레이아웃 의미가 분명한 간격(`mt-2`, `px-2`, `g-0`)은 Tabler 유틸리티를 씁니다. **같은 요소의 같은 방향 여백을 두 체계로 중복 지정하지 않습니다.**

### 반응형

| 중단점 | 값 | 업무 화면에서의 의미 |
|---|---|---|
| `sm` | ≥576px | 거의 쓰지 않음 |
| `md` | ≥768px | 태블릿. 검색 필터를 2열로 |
| `lg` | ≥992px | 노트북. 기본 레이아웃 시작점 |
| `xl` | ≥1200px | 데스크톱. 검색 필터 4열, 마스터/디테일 좌우 분할 |
| `xxl` | ≥1400px | 와이드 모니터. 그리드 컬럼 추가 노출 |

- 검색 필터 열의 표준 조합은 `col-12 col-md-6 col-xl-3`입니다. 기존 화면이 `col-3` 고정을 쓰고 있으면 그 화면 안에서는 통일을 우선합니다.
- 마스터/디테일 좌우 분할은 `lg` 미만에서 세로로 쌓습니다(`col-12 col-lg-5`).
- 터치 대상은 최소 44×44px을 확보합니다. 아이콘 전용 버튼은 기본 크기(`btn btn-icon`)를 쓰고 `btn-sm`으로 줄이지 않습니다.
- 그리드·표는 좁은 화면에서 가로 스크롤(`table-responsive`, 그리드 자체 스크롤)을 허용합니다. **컬럼을 임의로 숨기면 데이터 누락으로 오인됩니다.**

---

## 입체감

이 시스템은 **그림자를 계층 표현의 주된 수단으로 쓰지 않습니다.** 업무 화면에서 그림자가 많으면 시각적으로 시끄럽고 스캔 속도가 떨어집니다.

계층은 다음 순서로 표현합니다.

1. **면 분리** — 회색 페이지 배경(`gray-50`) 위에 흰 카드를 얹는 것이 1차 계층입니다.
2. **경계선** — 카드 내부 구획은 `border-top` / `border-end` 등 1px 선으로 나눕니다.
3. **상태 바** — 카드 상단/좌측의 얇은 띠(`card-status-top` / `card-status-start`)로 카드의 성격을 표시합니다.
4. **그림자** — 드롭다운·팝업처럼 **실제로 떠 있는 요소에만** 사용합니다. Tabler 기본값을 그대로 쓰고 직접 정의하지 않습니다(`shadow-sm` / `shadow` / `shadow-none`).

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
- 강조 바는 **메인 콘텐츠 카드**(목록·상세·마스터/디테일·사이드패널)에 붙이고, 팝업 내부 카드나 KPI 타일 같은 보조 카드에는 생략합니다.
- 스크롤 중에도 헤더가 보여야 하면 `sticky-top`, 하단 액션바가 필요하면 `sticky-bottom`을 씁니다(둘 다 화면이 실제로 길 때만).

---

## 형태

- **기본 반경은 6px(`--tblr-border-radius`)** 이고, **카드는 8px(`--tblr-border-radius-lg`)** 입니다. 입력·버튼·드롭다운은 6px을 공유합니다.
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
| 상세 보기 | `ti-eye` | 증감(상승/하락) | `ti-trending-up` / `ti-trending-down` |
| 사용자 | `ti-user` | 조직/부서 | `ti-sitemap` |
| 설정 | `ti-settings` | 더보기 | `ti-dots-vertical` |
| 정보 | `ti-info-circle` | 경고 | `ti-alert-triangle` |
| 오류 | `ti-alert-circle` | 성공 | `ti-circle-check` |

> 주의: `ti-organization`은 **존재하지 않는 아이콘**입니다. 조직도는 `ti-sitemap`, `ti-hierarchy`, `ti-binary-tree`를 쓰세요. 아이콘 이름은 추측하지 말고 [Tabler Icons](https://tabler.io/icons)에서 확인하거나 번들된 `tabler-icons.min.css`에서 검색한 뒤 사용합니다.

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
        <h3 class="card-title">주문 목록 <span class="badge bg-blue-lt ms-2">128건</span></h3>
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
- **그리드를 담는 카드는 `form-fieldset p-0`가 이 프로젝트의 표준 래퍼입니다.** 여백이 0이어야 그리드가 카드 안쪽 패딩만큼 잘려 보이지 않습니다. `card-body p-0`도 같은 목적으로 쓰이지만 신규 화면은 `form-fieldset p-0`를 우선하고, 순수 `<table>`을 담는 경우에는 `card-table`을 씁니다.
- **하나의 카드 안에서 여러 정보 섹션을 세로로 나눌 때는 중첩 카드를 만들지 말고** `card-header`(+ 두 번째부터 `border-top`)를 반복합니다.
- 밀도 조절: `card-sm`(조밀) / `card-md` / `card-lg`(여유). 업무 목록·폼은 기본 또는 `card-sm`.
- 그 외: 카드 본문 안에서만 스크롤 `card-body-scrollable`, 테두리 제거 `card-borderless`, 비활성 `card-inactive`, 카드 높이 맞춤은 부모 행에 `row-deck`.
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
- **한 카드·한 영역에 `btn-primary`는 하나만** 둡니다. 주 액션이 둘이면 사용자가 무엇을 눌러야 할지 판단해야 합니다.
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

### 배지 · 태그 · 상태 표시

```html
<div class="badges-list">
    <span class="badge bg-blue text-blue-fg">진행 중</span>
    <span class="badge bg-green text-green-fg">완료</span>
    <span class="badge bg-yellow-lt">검토 필요</span>
    <span class="badge badge-outline text-azure">승인 대기</span>
    <span class="badge badge-pill bg-purple-lt">VIP</span>
</div>

<div class="tags-list">
    <span class="tag">긴급 <a href="#" class="btn-close" aria-label="긴급 태그 제거"></a></span>
</div>

<span class="status status-green"><span class="status-dot"></span>정상</span>
```

| 컴포넌트 | 쓰는 경우 |
|---|---|
| 배지 `badge` | 클릭 동작이 없는 짧은 상태·건수 표시 |
| 태그 `tag` / `tags-list` | 사용자가 추가·제거하는 값(선택된 필터, 수신자, 키워드) |
| 상태 `status` + `status-dot` | 시스템·연결·처리 상태를 점으로 표시 |

- **배지는 클릭 동작이 없는 짧은 상태·개수 표시 전용**입니다. 클릭해야 하면 버튼 그룹이나 세그먼트 컨트롤을 쓰세요.
- 이 프로젝트의 목록 화면 상태 컬럼은 배지보다 **상태 필터 버튼그룹 + 일반 텍스트 컬럼**이 관례입니다. 배지는 대시보드 요약, 카드 제목 옆 건수 표시 같은 곳에 최소로 씁니다.
- 크기 `badge-sm` / `badge-lg`, 형태 `badge-pill`, 외곽선 `badge-outline`, 점만 표시 `badge-dot`, 아이콘 전용 `badge-icononly`. `badge-notification`은 다른 요소 우상단에 겹쳐 붙는 알림 배지입니다.
- **`badge-blink`(깜빡임)는 업무 화면에서 사용 금지**입니다. 주의 산만하고 접근성 문제(전정 장애·주의력 저하)를 유발합니다.
- 증감 지표는 전용 클래스가 아니라 유틸리티 조합입니다. **부호를 텍스트로 반드시 포함**합니다.

  ```html
  <span class="text-green d-inline-flex align-items-center lh-1">
      +18.2%<i class="f:16 ti ti-trending-up ms-1" aria-hidden="true"></i>
  </span>
  ```

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
- 닫기 버튼에는 항상 한국어 `aria-label`을 붙이고, 컨테이너에는 `role="alert"`을 붙입니다.
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

### 팝업 · 모달

이 프로젝트에는 **두 가지 오버레이 패턴**이 공존합니다. 용도가 다르므로 **화면 하나 안에서 섞지 말고, 아래 기준으로 하나를 선택**합니다.

| 패턴 | 기반 | 쓰는 경우 | 제어 |
|---|---|---|---|
| **`simplemodal-data`** (업무 팝업 기본) | SimpleModal (`syn.bundle.js`에 번들) | 다른 화면·화면 조각을 불러오는 업무 팝업(상세 보기, 코드도움, 결재 상신). **호출 화면으로 결과 값을 돌려줘야 할 때** | `syn.$w.showDialog` / `syn.$w.showUIDialog` / `syn.$w.closeDialog`, `syn-options`의 `triggerConfig` |
| **Bootstrap 모달** (`modal` / `modal-dialog`) | Tabler(Bootstrap) `tabler.min.js` | **한 화면 안에서 완결되는 보조 대화상자** — 확인·경고, JSON/로그 보기, 짧은 안내. 결과를 돌려받을 필요가 없는 경우 | `data-bs-toggle="modal"` / `data-bs-dismiss="modal"` 또는 Bootstrap JS API |

- **업무 화면(`view/*`)의 기본값은 `simplemodal-data`입니다.** 화면 간 호출·데이터 반환·드래그 이동이 필요하면 이 패턴만 씁니다.
- Bootstrap 모달은 `app-settings.html`, `module-settings.html` 같은 **관리·설정 화면의 보조 대화상자**에서 실제로 쓰이는 방식입니다. 같은 용도라면 그대로 따라도 됩니다.
- **두 패턴을 겹쳐 띄우지 않습니다.** `simplemodal-data` 팝업 안에서 Bootstrap 모달을 여는 것도 중첩입니다.

#### 패턴 1 — `simplemodal-data` (업무 팝업 기본)

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

- 이 패턴에서 닫기/트리거는 `syn-options="{triggerConfig:{...}}"`로 바인딩합니다. **`data-bs-dismiss="modal"`을 섞어 쓰지 않습니다.**
- 팝업 헤더는 `card-header dialog-header sticky-top p-2`로 스크롤 중에도 고정되게 합니다(`dialog-header`는 Tabler가 아니라 `syn.bundle.css`가 제공). 내용이 길면 본문에 `card-body-scrollable`을 붙입니다.
- 팝업 컨테이너 폭은 `max-width:1200!`을 따릅니다. 크기 하한은 `syn.$w.dialogOptions`의 `minWidth`(320) / `minHeight`(240)입니다.
- 호출 화면은 `syn.$w.showDialog(el, options, callback)`의 콜백으로 결과를 받고, 팝업은 `syn.$w.closeDialog(result)`로 값을 돌려줍니다. 다른 화면 URL을 iframe으로 띄울 때는 `syn.$w.showUIDialog(src, options, callback)`를 씁니다.
- 제목으로 쓰는 요소(`h3`)는 팝업 드래그 이동 손잡이로도 동작합니다.

#### 패턴 2 — Bootstrap 모달 (화면 내 보조 대화상자)

```html
<button type="button" id="btnJsonView" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#mdlJsonView">
    <i class="f:20 mr:4 ti ti-code" aria-hidden="true"></i>JSON 보기
</button>

<div class="modal modal-blur fade" id="mdlJsonView" tabindex="-1" role="dialog"
     aria-labelledby="mdlJsonViewTitle" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="mdlJsonViewTitle">설정 JSON</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="닫기"></button>
            </div>
            <div class="modal-body">…</div>
            <div class="modal-footer">
                <button type="button" class="btn bg-muted-lt" data-bs-dismiss="modal">닫기</button>
                <button type="button" class="btn btn-primary">
                    <i class="f:20 mr:4 ti ti-check" aria-hidden="true"></i>적용
                </button>
            </div>
        </div>
    </div>
</div>
```

- 폭은 `modal-sm`(확인) / 기본 / `modal-lg`(상세·로그) / `modal-xl`(넓은 표)이고, 전체 폭이 필요하면 `modal-full-width`입니다. 내용이 길면 `modal-dialog-scrollable`로 헤더·푸터를 고정합니다.
- 상단 색 띠가 필요하면 `modal-status bg-success`처럼 상태 색을 씁니다.
- 동작에 `tabler.min.js`가 필요합니다. 닫기 버튼은 `btn-close` + `data-bs-dismiss="modal"` + 한국어 `aria-label`입니다.
- `aria-labelledby`로 제목과 연결하고, 트리거 버튼에는 `data-bs-target`이 가리키는 `id`가 실제로 존재해야 합니다.
- **입력 폼 본체를 모달로 옮기지 않습니다.** 등록·수정 본문은 화면에 두고, 모달은 확인·보기·짧은 선택에만 씁니다.

#### 두 패턴 공통 규칙

- **팝업 위에 팝업을 띄우지 않습니다.** 단계가 필요하면 하나의 팝업 안에서 `steps`로 전환합니다.
- 접근성: 열릴 때 포커스를 팝업 안으로 옮기고, 닫으면 **호출한 요소로 포커스를 되돌립니다.** 아이콘 전용 닫기 버튼에도 `aria-label`이 필요합니다.
- 팝업 내부 카드에는 `card-status-top`을 붙이지 않습니다(강조가 겹칩니다).
- 화면 옆에서 밀려 나오는 보조 패널(필터 상세, 도움말)이 필요하면 `offcanvas offcanvas-end`를 쓸 수 있습니다(1.3.2에 있음). **입력 폼 본체를 오프캔버스에 넣지 마세요** — 컨텍스트가 끊깁니다.

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
- 변형: `progress-sm`, `progress-stacked`, `progress-separated`, `progress-bar-striped` / `progress-bar-animated`. **`progress-lg`와 `progress-steps`는 1.3.2에 없습니다.**
- **`width`는 값에 따라 바뀌는 동적 값이므로 인라인 `style`이 허용되는 유일한 시각 속성입니다.**
- 자체 구현 막대(`<div class="bar-track"><div class="bar-fill">`)를 만들지 말고 `progress` + `progress-bar`를 씁니다.

---

### 세그먼트 컨트롤 · 탭 · 단계 · 타임라인

| 컴포넌트 | 쓰는 경우 | 핵심 규칙 |
|---|---|---|
| 세그먼트 (`nav nav-segmented`) | 같은 데이터의 보기 방식(일간/주간/월간, 카드형/목록형), 상호 배타적인 소수 옵션 | 선택 상태를 `active`**와** `aria-selected`로 함께 표현. 옵션이 5개를 넘거나 서버에서 오면 `select`/드롭다운으로. 세로 배치는 `nav-segmented-vertical`. **업무 상태 필터는 세그먼트가 아니라 버튼 그룹**을 우선 |
| 탭 (`nav nav-tabs`) | **같은 대상의 다른 측면**(기본정보 / 변경이력 / 첨부파일) | 서로 다른 업무를 탭으로 묶지 않음. 저장되지 않은 입력이 있는 탭을 벗어날 때 경고. 카드 헤더에 붙일 때 `card-header-tabs`, 카드 자체가 탭이면 `card-tabs` |
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

HandStack 고유 컴포넌트입니다. **정본은 `2.Modules/wwwroot/wwwroot/uicontrols/` 디렉터리**이며, 각 컨트롤 폴더에 `README.md` · `API.md` · `example/`이 함께 있습니다. **이 목록에 없는 이름(`syn_combo`, `syn_upload`, `syn_editor` 등)은 존재하지 않으므로 추측으로 만들어 쓰지 마세요.**

업무 화면에서 자주 쓰는 컴포넌트

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

그 외 제공 컴포넌트 — 필요할 때 해당 컨트롤의 `README.md`와 `example/`을 먼저 확인합니다.

| 용도 | 컴포넌트 |
|---|---|
| 그리드 계열 | `syn_opengrid`(OpenGrid), `syn_grid`(WebGrid), `syn_list`(GridList), `syn_auipivot`(AUIPivot) |
| 차트 계열 | `syn_chart`(HighChart), `syn_echarts`(ECharts) |
| 편집기 | `syn_sourceeditor`, `syn_jsoneditor` |
| 선택·입력 | `syn_colorpicker`, `syn_calendar`, `syn_propertypanel` |
| 지도·미디어 | `syn_googlemap`, `syn_navermap`, `syn_mediaplayer` |

- 모든 데이터 바인딩 요소에 `syn-datafield`를 지정합니다(PascalCase: `MainForm`, `Grid1`, `Name`).
- 이벤트 바인딩은 `syn-events="['click']"`, 옵션·검증·트리거는 `syn-options="{...}"`로 지정합니다.
- 같은 역할의 컴포넌트가 여럿이면(그리드·차트) **모듈 내 기존 화면이 쓰는 것을 따릅니다.** 화면마다 다른 그리드를 섞지 않습니다.

**일반 Tabler 플러그인 ↔ HandStack 대응**

Tabler 공식 문서와 외부 예제는 아래 플러그인을 전제로 합니다. **이 저장소에서는 대응하는 `syn_*` 컴포넌트를 쓰고, 플러그인을 새로 들여오지 않습니다.**

| Tabler 플러그인 | 영역 | HandStack 대응 |
|---|---|---|
| Tom Select | 검색·다중 선택 | `syn_codepicker` |
| Litepicker | 날짜·기간 선택 | `syn_datepicker` / `syn_dateperiodpicker` |
| ApexCharts | 차트 | `syn_chartjs` (`libman.json`의 Chart.js·ECharts 번들 사용) |
| Dropzone | 파일 업로드 | `syn_fileclient` |
| Quill | WYSIWYG 편집기 | `syn_htmleditor` |
| FullCalendar | 캘린더 | 모듈별 기존 화면 확인 후 결정 |
| IMask | 입력 마스크 | `syn-options`의 입력 형식·검증 옵션 |

---

## 폼

폼은 업무 화면에서 가장 자주 만들고 가장 자주 틀리는 부분입니다. **라벨 배치는 아래 두 패턴 중 하나만** 씁니다. 일반 Tabler 문서의 "라벨을 입력 위에 쌓는" 예시는 어느 쪽도 아니므로 따르지 마세요(밀도가 낮고 시선이 상하로 튑니다).

### 패턴 A — 검색 필터 (`input-group` 좌측 라벨)

조회 조건처럼 한 줄에 여러 항목을 좁게 배치할 때 씁니다.

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="card-body">
        <div class="row g-2 align-items-center">
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
- **조회 버튼은 항상 필터 카드의 오른쪽 끝**이고, 초기화 버튼은 그 왼쪽입니다.
- 입력과 버튼·체크박스가 같은 줄에 섞이면 행에 `align-items-center`를 붙여 세로를 맞춥니다.
- `input-group-flat`은 입력과 버튼 사이 경계를 없앤 검색창 형태입니다. 입력 앞뒤에 아이콘을 붙일 때는 `input-icon` + `input-icon-addon`, 입력 뒤에 붙는 아이콘 버튼은 `btn btn-icon bg-muted-lt`를 씁니다.
- 좁은 화면까지 고려하는 신규 화면은 열 폭을 `col-12 col-md-6 col-xl-3`으로 잡습니다(「반응형」 참고).

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

        <div class="row mb-2 align-items-center">
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
- **체크박스·스위치·버튼이 텍스트 입력과 같은 행에 있으면 행에 `align-items-center`를 붙여 세로 중앙을 맞춥니다.**

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
- 스위치는 `form-check form-switch`, 큰 스위치는 `form-switch-lg`. 켜짐/꺼짐 라벨이 다르면 `form-check-label-on` / `form-check-label-off`를 씁니다.

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
- **클라이언트 검증은 편의 기능이며 서버 검증(`transact` 계약의 검증 규칙)을 대체하지 않습니다.**

---

## 표와 그리드

**업무 목록은 `syn_auigrid`로 만듭니다.** 순수 `<table>`은 RPT 계열 인쇄 화면과, 그리드가 과한 소량의 읽기 전용 요약표에만 허용합니다.

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

- **숫자·금액은 우측 정렬**, 코드·상태·날짜는 가운데 정렬, 나머지는 좌측 정렬입니다. 그리드에서는 컬럼 정의의 스타일 옵션으로, 순수 표에서는 `text-end` / `text-center`로 지정합니다.
- 결과 건수는 카드 제목 옆 배지로 표시합니다.
- 순수 `<table>`을 쓰는 경우: `table-responsive`로 감싸고, `table table-vcenter table-hover card-table` 조합을 기본으로 합니다. 그 외 `table-nowrap`, `table-sort`, `table-selectable`, `table-striped`, `table-sm`, 그룹 구분선 `table-group-divider`.
- 표의 세로 정렬은 셀마다 `align-middle`을 붙이지 말고 **표 전체에 `table-vcenter`** 를 씁니다.
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
    <div>
        <div class="datagrid-title">거래처</div>
        <div>한빛물산</div>
    </div>
</div>
```

- `datagrid`는 `--tblr-datagrid-item-width`(기본 15rem)를 기준으로 자동 배치되는 CSS 그리드입니다. 항목 폭은 이 변수로 조절하고 `col-*`을 덧붙이지 않습니다.
- 1.3.2에서 실제로 스타일이 정의된 클래스는 `datagrid`와 `datagrid-title` 둘뿐입니다(`datagrid-item` / `datagrid-content`는 CSS 규칙이 없습니다). 값 영역에 별도 클래스를 붙이지 마세요.

---

## 화면 유형별 표준 패턴

새 화면을 만들기 전에 **어떤 유형인지 먼저 결정하고** 해당 패턴을 따릅니다.

| 유형 | 구성 | 핵심 | 컨테이너 폭 |
|---|---|---|---|
| 목록(조회) | 필터 카드 + 결과 카드 | 카드 2개 분리, 조회 버튼은 필터 카드 우측 | `max-width:1600!` |
| 상세(입력) | 폼 카드(들) + 카드 푸터 액션 | 패턴 B 좌측 라벨, 저장은 푸터 우측 | `max-width:1600!` |
| 마스터/디테일 | `row g-0` + `col-5 border-end`(마스터) + `col`(디테일) | 한 카드 안에서 좌우 분할 | `max-width:1600!` |
| 사이드 패널형 | `row g-0` + `col-3 border-end`(메타) + `col`(본문) | 좌측은 `card-header` 반복 섹션 | `max-width:1600!` |
| 대시보드 | 필터 카드 + KPI 카드 행 + 차트/요약 + 드릴다운 | `row row-deck row-cards`로 높이 정렬 | `max-width:1600!` |
| 배치/마감 처리 | 실행 조건 + 진행률 + 단계 목록 + 로그/오류 | 실행 버튼은 확인 팝업을 거침 | `max-width:1600!` |
| 팝업 | `simplemodal-data`(업무 팝업 기본) 또는 Bootstrap 모달(화면 내 보조 대화상자) | 헤더 고정, 팝업 위 팝업 금지, 한 화면에서 두 패턴 혼용 금지 | `max-width:1200!` / `modal-lg`·`modal-xl` |
| 보고서/인쇄(RPT) | `<body class="bg-white">` + 좁은 컨테이너 | 화면 전용 `<style>` 허용(유일한 예외) | `max-width:1000!` |

### 목록(조회) 화면

```html
<div class="page-body mt-2">
    <div class="container-fluid max-width:1600!">

        <!-- 1. 검색 필터 카드 (패턴 A) -->
        <div class="card">
            <div class="card-status-top bg-dark-overlay"></div>
            <div class="card-body">
                <div class="row g-2 align-items-center">…필터 항목 + 우측 조회 버튼…</div>
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
        <div class="col-12 col-lg-5 border-end">
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
- 좌측 비율은 마스터 컬럼 수에 따라 `col-lg-5`(균형) 또는 `col-lg-7`(마스터 정보가 많을 때)을 씁니다. 좁은 화면에서는 `col-12`로 세로로 쌓입니다.
- **`border-end` / `border-top`을 씁니다.** `border-r` / `border-t`는 Tabler에도 Master CSS에도 없는 클래스입니다(Master CSS는 콜론 문법 `br:1` / `bt:1`).
- 업무 규칙으로 **부모 미선택, 부모 신규(키 없음), 빈 자식, 편집 중 부모 변경**의 동작을 모두 정의합니다. 부모 키가 없으면 자식 추가를 막고, 가짜 키를 만들지 않습니다.

### 사이드 패널형 화면

전자결재 상세처럼 좌측에 문서 메타 정보를 여러 섹션으로 쌓고, 우측에 그리드나 iframe으로 본문을 보여주는 화면입니다.

```html
<div class="card">
    <div class="card-status-top bg-dark-overlay"></div>
    <div class="row g-0">
        <div class="col-12 col-lg-3 border-end">
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

### 대시보드 화면

```html
<div class="row row-deck row-cards mt-2">
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card card-sm">
            <div class="card-body">
                <div class="subheader">3분기 매출</div>
                <div class="d-flex align-items-baseline">
                    <div class="h1 mb-0 me-2">1,284</div>
                    <div class="text-secondary">백만원</div>
                    <div class="ms-auto">
                        <span class="text-green d-inline-flex align-items-center lh-1">
                            +18.2%<i class="f:16 ti ti-trending-up ms-1" aria-hidden="true"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- KPI 타일 반복 -->
</div>
```

- KPI 타일은 **숫자 + 단위 + 기준 기간 + 증감**을 한 세트로 표시합니다. 숫자만 있는 타일은 해석이 불가능합니다.
- KPI 타일에는 `card-status-top`을 붙이지 않습니다(강조가 겹칩니다).
- 차트는 `syn_chartjs`로 그립니다. 카드 크기에 맞춘 높이 조절이 필요하면 `chart-sm` / `chart-lg` / `chart-square` / `chart-sparkline` 컨테이너 클래스를 씁니다.
- **차트만 있고 숫자 표가 없는 대시보드는 만들지 않습니다.** 실무자는 결국 값을 읽습니다. 차트 아래 요약 그리드를 함께 둡니다.

### 배치/마감 처리 화면

- 구성은 **실행 조건 카드 → 진행률 카드 → 단계/로그 카드** 순서입니다.
- 실행 버튼은 되돌릴 수 없는 작업이므로 **확인 팝업을 거칩니다.** 대상 건수와 영향 범위를 확인 문구에 포함합니다.
- 진행 상태는 `progress` + `progress-bar`와 **처리 건수 텍스트**를 함께 보여 줍니다(「진행률」 참고).
- 단계 표시는 `steps`, 처리 이력은 `timeline` 또는 로그 그리드를 씁니다.
- 실패 항목은 건수만 알리지 말고 **원인과 재처리 방법**을 함께 제공합니다.

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
- 인쇄에서 빠져야 하는 요소에는 `d-print-none`, 인쇄에서만 보일 요소에는 `d-print-block`을 붙입니다.
- 화면 전용 `<style>`에는 용지 여백·페이지 분할(`break-inside`)처럼 **유틸리티로 표현할 수 없는 규칙만** 정의합니다.

---

## 명명·파일 규칙

- 화면 파일은 `{업무코드 3자}{일련번호 3자리}.html`과 동일 이름의 `.js`가 한 쌍입니다. 예: `ATM030.html` + `ATM030.js`
  - 파생 화면(팝업 등)은 일련번호 끝자리로 구분: `ATM010` → `ATM011`, `ATM012`
  - 보고서 화면은 `RPT` 접두어를 사용합니다.
- 경로 구조: `modules/{모듈}/wwwroot/{모듈}/view/{시스템}/{업무}/{화면ID}.html`
- 데이터 바인딩 식별자(`syn-datafield`)는 PascalCase를 씁니다: `MainForm`, `Grid1`, `Name`
- 컨트롤 `id`는 접두어 관례를 따릅니다: `txt` `ddl` `chk` `btn` `grd` `lbl` `div`
- HTML을 만들면 반드시 짝이 되는 `.js`도 함께 만들거나, 팝업 조각처럼 JS가 불필요한 경우 그 이유를 명시합니다.
- 버튼 동작이 복잡한 팝업/상세 화면은 사용법을 설명하는 `{화면ID}.md`(버튼별 동작 설명표 등)를 함께 두는 관례가 있습니다(`CRM081.md`, `ODM011.md`). 필요하면 같이 작성합니다.

---

## 디자인 저작 구성요소

이 장은 **화면 저작 도구(드래그 앤 드롭 디자이너, AI 화면 생성기)의 도구상자·속성 패널·검증 규칙에 대한 정본**입니다. 도구가 생성하는 마크업은 앞 장들의 규칙을 그대로 따라야 하며, **도구로 만든 화면과 손으로 쓴 화면이 구분되지 않아야** 합니다.

> 현재 이 저장소에는 해당 저작 도구가 포함되어 있지 않습니다. 이 장은 도구를 만들거나 AI가 화면을 생성할 때 따르는 **구성요소 계약**이며, 여기의 마크업은 모두 HandStack 런타임(`syn.loader.js` + Tabler 1.3.2 + Master CSS) 기준입니다.

### 저작 모델

```text
도구상자(좌) ── 드래그/클릭 ──▶ 캔버스(중앙: 실제 페이지 골격) ──선택──▶ 속성 패널(우)
   분류별 구성요소                page → page-wrapper →                 기본정보
   미리보기 + 설명                page-header / page-body →             위치와 크기
                                  container-fluid → row → col → …       스타일 + 고유 속성
```

- **배치 방법은 두 가지를 모두 제공합니다.** ① 도구상자에서 캔버스로 **드래그**해 삽입 위치(파란 삽입선)를 지정, ② 캔버스에서 대상 영역을 선택한 뒤 도구상자 항목을 **클릭**해 그 영역의 끝에 추가.
- 캔버스는 **실제 Tabler CSS와 Master CSS가 적용된 DOM**입니다. 미리보기용 근사 렌더링을 쓰지 않습니다. 그래야 저작 결과와 실행 결과가 같습니다.
- 드롭 대상이 아닌 곳에 놓으면 **가장 가까운 유효 부모로 승격**시키고, 승격된 위치를 토스트로 알립니다(조용히 무시하지 않습니다).
- 선택 요소는 파란 외곽선 + 좌상단에 한국어 구성요소 이름 배지로 표시하고, `Esc`로 부모 선택, `Tab`/`Shift+Tab`으로 형제 이동, `Delete`로 삭제, `Ctrl+D`로 복제합니다.
- 실행 취소(`Ctrl+Z`) / 다시 실행(`Ctrl+Shift+Z`)은 **속성 변경까지 포함**해 기록합니다.
- 저장 결과는 `{화면ID}.html`과 짝이 되는 `{화면ID}.js`입니다. 도구는 이벤트 핸들러 뼈대를 `.js`에 함께 생성합니다.

### 드롭 허용 규칙

| 부모 영역 | 허용되는 자식 | 금지 |
|---|---|---|
| 페이지 본문 `container-fluid` | 행, 카드, 알림, 빈 상태 | 폼 입력 직접 배치 |
| 행 `row` | 열 `col`만 | 그 외 모든 구성요소 |
| 열 `col` | 카드, 폼 요소, 데이터, 기본 요소 | 열(중첩 열은 행을 먼저 만듦) |
| 카드 `card` | 카드 상태바 / 헤더 / 본문 / 그리드 래퍼 / 푸터 | 임의 요소 직접 배치 |
| 카드 본문 `card-body` | 행, 폼 요소, 데이터, 기본 요소 | 카드(의미 없는 중첩 금지) |
| 카드 헤더 `card-header` | 제목, 배지, 카드 액션 | 폼 입력, 데이터 그리드 |
| 카드 푸터 `card-footer` | 버튼 목록, 요약 텍스트 | 폼 입력, 데이터 그리드 |
| 그리드 래퍼 `form-fieldset p-0` | `syn_auigrid`, 표 | 폼 입력, 카드 |
| 입력 그룹 `input-group` | 라벨, 입력, 버튼, 접두/접미 텍스트 | 행, 카드 |
| 업무 팝업 `simplemodal-data` | 카드 1개(헤더 + 본문 + 푸터) | 팝업·모달(중첩 금지) |
| 모달 본문 `modal-body` | 행, 폼 요소, 데이터 | 모달·업무 팝업(중첩 금지) |

### 도구상자 분류

구성요소 이름은 **한국어가 기본**이고, 코드 식별자는 영문 kebab-case입니다. 도구상자 검색은 한국어 이름·영문 코드·Tabler 클래스명을 모두 매칭합니다.

#### 1. 레이아웃 — `layout`

| 구성요소 | 코드 | 생성 마크업(요약) |
|---|---|---|
| 페이지 골격 | `page-shell` | `div.page > div.page-wrapper > (page-header + page-body)` |
| 페이지 헤더 | `page-header` | `div.page-header.mt-2.d-print-none > container > row.g-2.align-items-center` |
| 컨테이너 | `container` | `div.container-fluid.max-width:1600!` |
| 행 | `row` | `div.row.g-2` |
| 열 | `col` | `div.col-12.col-md-6.col-xl-3` |
| 카드 | `card` | `div.card`(+ `card-status-top bg-dark-overlay` 옵션) |
| 카드 헤더 | `card-header` | `div.card-header > h3.card-title + div.card-actions` |
| 카드 본문 | `card-body` | `div.card-body`(조밀은 `p-2`) |
| 카드 푸터 | `card-footer` | `div.card-footer.text-end.p-2 > div.btn-list.justify-content-end` |
| 그리드 래퍼 | `grid-wrapper` | `div.form-fieldset.p-0` |
| 좌우 분할 패널 | `split-pane` | `div.row.g-0 > div.col-12.col-lg-5.border-end + div.col` |
| 구분선 | `divider` | `div.hr-text` / `hr` |
| 아코디언 | `accordion` | `div.accordion > .accordion-item …` |
| 탭 패널 | `tab-panel` | `ul.nav.nav-tabs + div.tab-content > .tab-pane` |
| 스크롤 영역 | `scroll-area` | `div.overflow-auto`(높이 지정 필수) / `card-body-scrollable` |
| 업무 팝업 | `popup` | `div.simplemodal-data > div.card`(헤더 `dialog-header sticky-top p-2`) |
| 모달 | `modal` | `div.modal.modal-blur.fade > .modal-dialog > .modal-content`(화면 내 보조 대화상자) |
| 슬라이드 패널 | `offcanvas` | `div.offcanvas.offcanvas-end` |

#### 2. 기본 요소 — `basic`

| 구성요소 | 코드 | 생성 마크업(요약) |
|---|---|---|
| 제목 | `heading` | `h2.page-title` / `h3.card-title` / `h4` |
| 본문 텍스트 | `text` | `div` / `p`(+ `text-secondary`) |
| 소형 라벨 | `subheader` | `div.subheader` |
| 아이콘 | `icon` | `i.ti.ti-*`(크기는 `f:NN`) |
| 버튼 | `button` | `button.btn.btn-primary` |
| 아이콘 버튼 | `icon-button` | `button.btn.btn-icon.bg-muted-lt` + `aria-label` |
| 버튼 목록 | `button-list` | `div.btn-list` |
| 버튼 그룹 | `button-group` | `div.btn-group[role=group]` |
| 링크 | `link` | `a.link-primary` |
| 배지 | `badge` | `span.badge.bg-blue-lt` |
| 태그 목록 | `tag-list` | `div.tags-list > span.tag` |
| 상태 표시 | `status` | `span.status.status-green > span.status-dot` |
| 아바타 | `avatar` | `span.avatar` |
| 이미지 | `image` | `img.rounded`(+ `object-cover`) |
| 리본 | `ribbon` | `div.ribbon.ribbon-top.bg-red` |
| 자리표시자 | `placeholder` | `div.placeholder.placeholder-glow` |

#### 3. 폼 — `form`

| 구성요소 | 코드 | 생성 마크업(요약) |
|---|---|---|
| 폼 행(좌측 라벨) | `form-row` | `div.row.mb-2 > label.col-2.col-form-label + div.col-4` |
| 검색 필터 항목 | `filter-item` | `div.input-group > label.w:100.col-form-label.px-2 + 입력` |
| 텍스트 입력 | `input-text` | `input.form-control[type=text]` + `syn-datafield` |
| 숫자 입력 | `input-number` | `input.form-control.text-end[inputmode=numeric]` |
| 비밀번호 | `input-password` | `input.form-control[type=password]` |
| 여러 줄 입력 | `textarea` | `textarea.form-control[rows]` |
| 선택(기본) | `select` | `select.form-select`(고정 소수 옵션 전용) |
| 코드/콤보 선택 | `code-picker` | `syn_codepicker` |
| 체크박스 | `checkbox` | `label.form-check > input.form-check-input` |
| 라디오 | `radio` | `label.form-check > input.form-check-input[type=radio]` |
| 스위치 | `switch` | `label.form-check.form-switch` |
| 선택 그룹 | `select-group` | `div.form-selectgroup > label.form-selectgroup-item` |
| 이미지 선택 | `image-check` | `label.form-imagecheck` |
| 색상 선택 | `color-check` | `label.form-colorinput` |
| 날짜 선택 | `date-picker` | `syn_datepicker` |
| 기간 선택 | `date-range` | `syn_dateperiodpicker` |
| 범위 슬라이더 | `range` | `input.form-range` |
| 파일 첨부 | `file-upload` | `syn_fileclient` |
| 서식 편집기 | `rich-text` | `syn_htmleditor` |
| 조직/사원 선택 | `org-picker` | `syn_organization` |
| 읽기 전용 값 | `plaintext` | `div.form-control-plaintext` |
| 필드셋 | `fieldset` | `fieldset.form-fieldset > legend` |
| 도움말 | `form-hint` | `small.form-hint` |
| 검증 메시지 | `validation-message` | `div.invalid-feedback` |

#### 4. 데이터 — `data`

| 구성요소 | 코드 | 생성 마크업(요약) |
|---|---|---|
| 데이터 그리드 | `data-grid` | `syn_auigrid`(래퍼 `form-fieldset p-0` 안) |
| 표 | `table` | `div.table-responsive > table.table.table-vcenter.card-table` |
| 요약 정의목록 | `datagrid` | `div.datagrid > div > div.datagrid-title + div` |
| 목록 그룹 | `list-group` | `div.list-group.list-group-flush > button.list-group-item.list-group-item-action` |
| KPI 타일 | `kpi-tile` | `div.card.card-sm > .card-body > .subheader + .h1` |
| 증감 지표 | `trend` | `span.text-green.d-inline-flex.align-items-center.lh-1` |
| 차트 | `chart` | `syn_chartjs` |
| 진행률 | `progress` | `div.progress > .progress-bar[role=progressbar]` |
| 단계 | `steps` | `div.steps > .step-item` |
| 타임라인 | `timeline` | `ul.timeline > li.timeline-event` |
| 트리 | `tree` | `syn_tree` |
| 빈 상태 | `empty` | `div.empty > .empty-icon/.empty-title/.empty-subtitle/.empty-action` |
| 페이지네이션 | `pagination` | `ul.pagination` |

#### 5. 탐색 — `navigation`

| 구성요소 | 코드 | 생성 마크업(요약) |
|---|---|---|
| 상위 경로 | `page-pretitle` | `div.page-pretitle.f:12!` |
| 브레드크럼 | `breadcrumb` | `ol.breadcrumb > li.breadcrumb-item` |
| 탭 | `nav-tabs` | `ul.nav.nav-tabs[role=tablist]` |
| 세그먼트 컨트롤 | `nav-segmented` | `nav.nav.nav-segmented[role=tablist]` |
| 드롭다운 메뉴 | `dropdown` | `div.dropdown > button.dropdown-toggle + .dropdown-menu` |
| 우클릭 메뉴 | `context-menu` | `syn_contextmenu` |

#### 6. 피드백 — `feedback`

| 구성요소 | 코드 | 생성 마크업(요약) |
|---|---|---|
| 알림 | `alert` | `div.alert.alert-warning[role=alert]` |
| 토스트 | `toast` | HandStack 토스트/노티파이어 호출 |
| 툴팁 | `tooltip` | 대상 요소에 `data-bs-toggle="tooltip"` |
| 팝오버 | `popover` | 대상 요소에 `data-bs-toggle="popover"` |
| 확인 대화상자 | `confirm-dialog` | 화면 내 확인은 `modal-sm` + `modal-status`, 화면 간 호출은 `simplemodal-data` + 취소·확인 버튼 |
| 로딩 스피너 | `spinner` | `div.spinner-border[role=status]` + `visually-hidden` 텍스트 |
| 화면 안내 | `guide` | `syn_guide` |

#### 7. 업무 확장 — `business`

HandStack 런타임(`syn.loader.js`)이 제공하는 구성요소입니다. 도구는 **자리(슬롯)와 속성만 관리**하고 렌더링은 런타임에 맡깁니다.

| 구성요소 | 태그 | 비고 |
|---|---|---|
| 업무 데이터 그리드 | `syn_auigrid` | 컬럼 정의·편집·검증 옵션을 고유 속성으로 관리 |
| 데이터소스 바인딩 | `syn_data` | 폼·그리드의 조회/저장 계약 연결 |
| 코드/콤보 선택 | `syn_codepicker` | 공통코드 ID를 속성으로 지정 |
| 조직/사원 선택 | `syn_organization` | |
| 트리 | `syn_tree` | |
| 첨부파일 | `syn_fileclient` | `repository` 업로드 계약이 확인된 화면에서만 |
| 리치 텍스트 | `syn_htmleditor` | |
| 차트 | `syn_chartjs` | |
| 우클릭 메뉴 | `syn_contextmenu` | |
| 화면 안내 | `syn_guide` | |

> **존재하지 않는 런타임 컴포넌트 이름을 추측해서 만들지 않습니다.** 도구상자에 없는 업무 구성요소가 필요하면 먼저 런타임에 등록하고 「`syn_*` 컴포넌트」 표에 추가합니다.

### 공통 속성

모든 구성요소는 아래 **세 그룹의 공통 속성**을 가집니다. 속성 패널은 항상 같은 순서(기본정보 → 위치와 크기 → 스타일 → 고유 속성)로 보여 줍니다.

#### 기본정보 — `basic`

| 속성 | 한국어 라벨 | 출력 | 비고 |
|---|---|---|---|
| `id` | 구성요소 ID | `id` 속성 | 화면 내 고유. 접두어 관례: `txt` `ddl` `chk` `btn` `grd` `lbl` `div` |
| `name` | 이름(설명) | 저작 데이터에만 저장 | 도구상자·구조 트리 표시용 한국어 이름 |
| `dataField` | 데이터 필드 | `syn-datafield` | PascalCase. 폼/그리드 바인딩에 사용 |
| `events` | 이벤트 | `syn-events="['click']"` | 바인딩할 이벤트 목록 |
| `options` | 옵션/검증/트리거 | `syn-options="{...}"` | 검증기·컬럼 정의·트리거 구성 |
| `label` | 라벨 | `<label for>` 텍스트 | 폼 계열 필수 |
| `required` | 필수 여부 | 라벨에 `required` 클래스 + `syn-options`의 `validators:['require']` | 라벨 텍스트에 `*`를 쓰지 않음 |
| `readOnly` | 읽기 전용 | `readonly` 속성 | 값은 전송됨 |
| `disabled` | 사용 안 함 | `disabled` 속성 / `.disabled` | 값 전송 안 됨 |
| `visible` | 표시 여부 | `hidden` 클래스 토글(Master CSS) | 인라인 `style="display:none"` 금지 |
| `printable` | 인쇄 포함 | `d-print-none` / `d-print-block` | |
| `ariaLabel` | 접근성 이름 | `aria-label` | 아이콘 전용 버튼은 필수 |
| `tooltip` | 도움말 풍선 | `data-bs-toggle="tooltip" title` | |
| `hint` | 입력 도움말 | `small.form-hint` | |
| `tabIndex` | 탭 순서 | `tabindex` | 양수 금지(0 또는 -1만) |
| `permission` | 권한 코드 | 런타임 표시 제어 | **서버 권한 검증을 대체하지 않음** |

#### 위치와 크기 — `layout`

| 속성 | 한국어 라벨 | 출력 | 값 |
|---|---|---|---|
| `parent` | 배치 영역 | 부모 노드 | 드롭 허용 규칙 참조 |
| `order` | 배치 순서 | DOM 순서 | 위/아래 이동 버튼 제공 |
| `colSpan` | 열 너비 | `col-{1..12}` / `col` / `col-auto` | 12칼럼 |
| `colSpanMd` / `colSpanXl` | 반응형 너비 | `col-md-*` / `col-xl-*` | 태블릿/데스크톱 |
| `width` | 너비 | `w-100` / `w-auto` 또는 Master CSS `w:NN` | 고정 폭은 Master CSS, 비율은 Tabler |
| `height` | 높이 | `h-100` / `h-full`, 그리드·차트는 고유 속성 | |
| `margin` | 바깥 여백 | `m*-{0..6}` | 방향별 지정(`ms`/`me`만 사용) |
| `padding` | 안쪽 여백 | `p*-{0..6}` | |
| `gap` | 요소 간격 | `g-*`(행) / `gap-*`(플렉스) | |
| `alignH` | 가로 정렬 | `text-start/center/end`, `justify-content-*`, `ms-auto` | |
| **`alignV`** | **세로 정렬** | **아래 표 참조** | 모든 구성요소가 지원 |
| `overflow` | 넘침 처리 | `overflow-auto` / `overflow-hidden` / `text-truncate` | |
| `sticky` | 고정 | `sticky-top` / `sticky-bottom` | |
| `containerWidth` | 컨테이너 폭 | `max-width:1600!` / `1200!` / `1000!` | 컨테이너 구성요소 전용 |

#### 세로 정렬 (`alignV`) — 컨테이너 유형별 출력

**세로 정렬은 부모의 배치 방식에 따라 출력 클래스가 달라집니다.** 저작 도구는 부모를 보고 자동으로 올바른 클래스를 선택하고, 지원되지 않는 조합은 속성 패널에서 비활성화합니다.

| 부모 유형 | 대상 | 출력 클래스 | 선택지 |
|---|---|---|---|
| 행 `row` (자식 전체) | 행 | `align-items-start` / `align-items-center` / `align-items-end` / `align-items-baseline` / `align-items-stretch` | 위 / 가운데 / 아래 / 기준선 / 늘이기 |
| 행 `row` (개별 열) | 열 | `align-self-start` / `align-self-center` / `align-self-end` / `align-self-baseline` / `align-self-stretch` | 동일 |
| 플렉스 `d-flex` | 컨테이너 / 항목 | `align-items-*` / `align-self-*` | 동일 |
| 반응형 | 행 / 열 | `align-items-md-center`, `align-self-lg-end` 등 | 중단점별 지정 |
| 표 `table` | 표 전체 | `table-vcenter` | 셀마다 붙이지 않음 |
| 표 셀 `td`/`th` | 셀 | `align-top` / `align-middle` / `align-bottom` / `align-baseline` | `vertical-align` 속성 |
| 인라인 요소 | 요소 | `align-top` / `align-middle` / `align-bottom` / `align-baseline` | 아이콘·배지 미세 조정 |
| 카드 행 `row-cards` | 행 | `row-deck` | 카드 높이 맞춤 |
| 폼 라벨 | 라벨 | `col-form-label` | 입력과 기준선 자동 정렬 |

- **`align-*`(vertical-align) 계열은 인라인 요소와 표 셀에만 동작합니다.** 블록 요소의 세로 정렬에 쓰면 아무 일도 일어나지 않습니다. 저작 도구는 이 경우 `align-items-*`를 대신 출력합니다.
- 폼 행에서 체크박스·스위치·버튼이 텍스트 입력과 같은 줄에 있으면 **기본값으로 `align-items-center`** 를 넣습니다.
- 숫자 단위(`백만원`)를 큰 숫자 옆에 붙일 때는 `align-items-baseline`을 씁니다.

#### 스타일 — `style`

| 속성 | 한국어 라벨 | 출력 | 값 |
|---|---|---|---|
| `colorRole` | 색상 역할 | `btn-*` / `bg-*` / `text-*` / `alert-*` | primary, secondary, success, info, warning, danger, dark, light + 팔레트 12색 |
| `emphasis` | 강조 수준 | 진한(`bg-blue`) / 연한(`bg-blue-lt`) / 외곽선(`badge-outline`) / 고스트(`btn-ghost-*`) | |
| `size` | 크기 | `sm` / 기본 / `lg` | 1.3.2에 `btn-xs` / `btn-xl`은 없음 |
| `rounded` | 모서리 | `rounded-0` / `rounded` / `rounded-circle` / `rounded-pill` | |
| `border` | 테두리 | `border` / `border-0` / `border-top` / `border-end` / `border-wide` | |
| `borderColor` | 테두리 색 | `border-primary` / `border-*-subtle` | |
| `background` | 배경 | `bg-*` / `bg-*-lt` / `bg-surface` | 임의 HEX 금지 |
| `textColor` | 글자 색 | `text-*` / `text-*-fg` / `text-secondary` / `text-muted` | |
| `textSize` | 글자 크기 | Master CSS `f:NN`(권장) 또는 `fs-1`~`fs-6` / `.h1`~`.h6` | 한 화면에서 한 체계만 |
| `fontWeight` | 굵기 | `fw-normal` / `fw-medium` / `fw-semibold` / `fw-bold` | |
| `shadow` | 그림자 | `shadow-sm` / `shadow` / `shadow-none` | 떠 있는 요소만 |
| `statusBar` | 카드 상태바 | `card-status-top` / `card-status-start` + 색 | 기본 `bg-dark-overlay` |
| `icon` | 아이콘 | `ti ti-*` | 아이콘 선택기에서 고름(웹폰트만) |
| `cursor` | 커서 | `cursor-pointer` / `cursor-not-allowed` | 실제 클릭 가능한 요소만 |

- **스타일 패널에는 자유 입력 색상 필드를 두지 않습니다.** 팔레트에서만 고르게 하면 다크 모드와 상태 색 일관성이 저절로 지켜집니다.
- 인라인 `style` 출력은 **진행률 막대의 `width`처럼 값이 데이터에 따라 바뀌는 경우에만** 허용합니다.
- 도구는 **Tabler 문법과 Master CSS 문법을 섞어 출력하지 않습니다.** 고정 치수는 Master CSS(`f:`, `w:`, `max-width:`), 간격·정렬·표시 제어는 Tabler 유틸리티로 고정합니다(단, 표시 토글은 Master CSS `hidden`).

### 구성요소별 고유 속성 (발췌)

| 구성요소 | 고유 속성 |
|---|---|
| 열 `col` | 반응형 폭, 자동 폭 여부, 세로 정렬(`align-self`) |
| 카드 `card` | 상태바 표시/색, 밀도(`card-sm`/`card-md`/`card-lg`), 테두리 제거, 본문 스크롤, 헤더·푸터 사용 여부 |
| 버튼 `button` | 유형(주/보조/위험/고스트), 아이콘 + 위치, 처리 중 상태, 확인 메시지, 트리거(`syn-options.triggerConfig`) |
| 텍스트 입력 `input-text` | 최대 길이, 입력 형식(영문/숫자/전화/사업자), 자리표시자, 검증기 목록 |
| 숫자 입력 `input-number` | 소수 자릿수, 천 단위 구분, 최소/최대, 단위 접미 |
| 선택 `select` | 옵션 목록, 전체 항목 표시, 다중 선택, 기본값 |
| 코드 선택 `code-picker` | 공통코드 ID, 반환 필드 매핑, 다중 선택 여부, 연동 대상 필드 |
| 날짜 선택 `date-picker` | 형식, 기본값, 최소/최대, 기간 연결 대상 |
| 데이터 그리드 `data-grid` | 컬럼 정의(필드/제목/폭/유형/정렬/읽기전용/숨김), 높이, 편집 가능, 행 추가·삭제, 합계 행, 엑셀 내보내기 |
| 표 `table` | 컬럼 정의, 줄무늬, 호버, 선택 가능, 정렬 가능, 밀도 |
| 목록 그룹 `list-group` | 항목 템플릿, 선택 모드(단일/다중), 아바타·배지 표시 |
| KPI 타일 `kpi-tile` | 지표명, 값 필드, 단위, 기준 기간, 증감 필드, 증감 방향 색 |
| 차트 `chart` | 차트 유형, 계열 필드, 축 라벨, 범례 위치, 높이, 색상 세트 |
| 진행률 `progress` | 값 필드, 최대값, 표시 형식(%/건수), 미정 상태 여부 |
| 단계 `steps` | 단계 목록, 현재 단계, 이동 가능 여부, 번호 표시, 방향(가로/세로) |
| 타임라인 `timeline` | 항목 필드(시각/행위/주체), 정렬 순서, 아이콘 매핑 |
| 알림 `alert` | 유형, 제목, 본문, 아이콘, 닫기 가능, 액션 버튼 |
| 업무 팝업 `popup` | 제목, 폭(`max-width:1200!`), 본문 스크롤, 닫기 트리거, 반환 값 매핑, 확인·취소 버튼 라벨 |
| 모달 `modal` | 제목, 크기(`modal-sm`/기본/`modal-lg`/`modal-xl`), 본문 스크롤, 상태 띠(`modal-status`), 트리거 버튼 연결(`data-bs-target`), 확인·취소 버튼 라벨 |
| 탭 `nav-tabs` | 탭 항목, 기본 활성 탭, 카드 헤더 결합 여부 |
| 첨부파일 `file-upload` | 업로드 계약(`repository`) ID, 확장자 제한, 최대 개수/용량 |

### 구성요소 정의 스키마

도구상자 항목은 아래 JSON 구조로 등록합니다. 새 구성요소를 추가할 때 **이 스키마를 벗어나지 않습니다.**

```json
{
  "code": "input-text",
  "name": "텍스트 입력",
  "category": "form",
  "icon": "ti-cursor-text",
  "description": "한 줄 텍스트를 입력받습니다.",
  "dropTargets": ["col", "card-body", "input-group", "form-row"],
  "allowsChildren": false,
  "defaultProps": {
    "basic":  { "id": "txtField1", "name": "텍스트 입력", "dataField": "Field1", "label": "항목명", "required": false },
    "layout": { "colSpan": 4, "alignV": "center", "margin": { "bottom": 2 } },
    "style":  { "size": "default" }
  },
  "specificProps": [
    { "key": "maxLength",   "label": "최대 길이", "type": "number", "default": 50 },
    { "key": "editType",    "label": "입력 형식", "type": "enum",
      "options": ["자유", "영문", "숫자", "전화번호", "사업자번호"], "default": "자유" },
    { "key": "placeholder", "label": "자리표시자", "type": "string" },
    { "key": "validators",  "label": "검증기", "type": "list", "default": [] }
  ],
  "template": "<input type=\"text\" id=\"{{basic.id}}\" class=\"form-control\" maxlength=\"{{maxLength}}\" syn-datafield=\"{{basic.dataField}}\" />",
  "rules": [
    "label이 비어 있으면 ariaLabel을 요구한다",
    "부모가 input-group이면 colSpan을 무시한다",
    "required가 켜지면 validators에 require를 추가한다"
  ]
}
```

- `template`은 **최종 마크업의 유일한 출처**입니다. 도구가 별도 경로로 클래스를 덧붙이지 않습니다.
- `dropTargets`가 빈 배열이면 어디에도 놓을 수 없습니다(추상 구성요소).
- `rules`는 저작 시점 검증 메시지의 근거가 됩니다.

### 저작 시점 검증 규칙

도구는 저장·미리보기 전에 아래를 **자동 검사하고 한국어 메시지로 안내**합니다.

| # | 규칙 | 메시지 예 |
|---|---|---|
| 1 | 구성요소 ID 중복 없음 | "`txtName` ID가 2개 있습니다. 하나를 변경해 주세요." |
| 2 | 폼 입력에 라벨 또는 접근성 이름 존재 | "'거래처명' 입력에 라벨이 없습니다." |
| 3 | 아이콘 전용 버튼에 `aria-label` 존재 | "아이콘 버튼에 설명을 입력해 주세요." |
| 4 | `row` 직계 자식이 모두 `col` | "행에는 열만 넣을 수 있습니다." |
| 5 | 카드 중첩이 2단계를 넘지 않음 | "카드 안에 카드를 넣지 마세요. 헤더를 추가해 섹션을 나누세요." |
| 6 | 한 영역에 `btn-primary`가 하나 | "주 액션 버튼이 2개입니다." |
| 7 | 라벨 폭이 화면 안에서 통일됨 | "폼 라벨 폭이 `col-2`와 `col-3`으로 섞여 있습니다." |
| 8 | 존재하지 않는 클래스 미사용 | "`alert-title`은 1.3.2에 없습니다. `alert-heading`을 쓰세요." |
| 9 | 인라인 스타일이 허용 목록 안 | "색상은 인라인 스타일 대신 팔레트에서 선택해 주세요." |
| 10 | 필수 표시가 `required` 클래스로 됨 | "라벨 텍스트의 `*`를 지우고 필수 여부를 켜세요." |
| 11 | 검색 필터와 결과가 별도 카드 | "조회 조건과 결과를 같은 카드에 두지 마세요." |
| 12 | 그리드 래퍼가 `form-fieldset p-0` | "그리드가 카드 여백에 가려집니다." |
| 13 | 팝업·모달 중첩 없음, 한 화면 한 패턴 | "팝업 안에 팝업을 넣을 수 없습니다.", "이 화면은 이미 업무 팝업(`simplemodal-data`)을 쓰고 있습니다." |
| 14 | 금지 클래스 미사용 | "`badge-blink`는 사용할 수 없습니다." |
| 15 | 데이터 바인딩 지정 | "입력·그리드에 데이터 필드(`syn-datafield`)가 없습니다." |
| 16 | 문법 혼용 없음 | "`mr-4`는 없는 클래스입니다. Tabler는 `me-4`, Master CSS는 `mr:4`입니다." |
| 17 | 컨테이너 폭이 화면 유형과 일치 | "팝업 화면의 컨테이너 폭은 `max-width:1200!`입니다." |
| 18 | `syn_*` 태그가 등록된 컴포넌트 | "`syn_combo`는 등록되지 않은 컴포넌트입니다." |

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
| 그리드/플렉스 간격 | `g-*` / `gx-*` / `gy-*`, `gap-1`~`gap-6`, `space-y-*`, `divide-y` |
| 표시/숨김 | `d-none` `d-block` `d-flex` `d-inline-flex`, 반응형 `d-none d-md-block` |
| 인쇄 제어 | `d-print-none` `d-print-block` |
| 정렬 | `text-start` `text-center` `text-end`, `justify-content-end` `align-items-center` `align-self-center` `ms-auto` |
| 세로 정렬 | `align-baseline` `align-top` `align-middle` `align-bottom` (인라인 요소·표 셀 전용) |
| 커서 | `cursor-pointer` `cursor-not-allowed` `cursor-progress` `cursor-wait` `cursor-move` `cursor-help` 등 |
| 스크린리더 전용 | `visually-hidden` |
| 넘침 | `overflow-auto` `overflow-hidden` `text-truncate` |
| 고정 | `sticky-top` `sticky-bottom` |
| 크기 | `w-100` `h-100` `w-full` `h-full` `w-1`(표 최소폭 컬럼) |
| 표면 | `bg-surface` `bg-surface-secondary` `bg-surface-tertiary` |

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
- 상태를 색으로만 알리지 않습니다. 텍스트·아이콘·부호·형태를 함께 제공합니다.
- 동적 영역에는 `role`과 `aria-*`를 붙입니다: 알림 `role="alert"`, 진행 `role="progressbar"` + `aria-valuenow`, 탭 `role="tablist"`/`tab`/`tabpanel` + `aria-selected`, 현재 위치 `aria-current="page"` / `"step"`.
- 팝업은 열릴 때 포커스를 팝업 안으로 이동시키고, 닫으면 **호출한 요소로 포커스를 되돌립니다.** 닫기 버튼에 한국어 `aria-label`을 붙입니다.
- 오류는 `aria-describedby`로 메시지 요소와 연결합니다.
- 링크·버튼 텍스트만으로 동작을 알 수 있어야 합니다. "여기", "클릭" 금지.
- **자동으로 움직이는 것을 만들지 않습니다.** 캐러셀 자동 재생, `badge-blink`, 불필요한 아이콘 애니메이션은 쓰지 않습니다.
- 키보드만으로 조회 → 입력 → 저장 전체 흐름이 가능해야 합니다. `tabindex`에 양수를 쓰지 않습니다.
- `iframe`에는 `title`을 붙입니다.
- 안내·오류 메시지는 한국어 문장으로 씁니다. 영문 기본 메시지를 그대로 노출하지 않습니다.

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
- 검증은 `syn-options="{validators:[...]}"`를 1차 수단으로 쓰고, 서버 검증을 반드시 함께 둡니다.
- 팝업은 화면마다 한 패턴만 씁니다 — 결과를 돌려주는 업무 팝업은 `simplemodal-data`, 화면 안에서 끝나는 확인·보기는 Bootstrap 모달.
- 동일 상태 코드는 전 화면에서 같은 색을 씁니다. 색상 매핑은 JS 한 곳에 모읍니다.
- 아이콘은 `ti ti-*` 웹폰트로 쓰고 크기는 `f:NN`으로 조절합니다.
- 아이콘 전용 버튼에 `aria-label`, 텍스트 옆 아이콘에 `aria-hidden="true"`를 붙입니다.
- 오류 메시지에 **원인과 해결 방법**을 씁니다.
- 조회 결과가 없을 때 `empty` 컴포넌트로 다음 행동을 안내합니다.
- 숫자·금액은 우측 정렬합니다.
- 같은 줄에 섞인 입력·버튼·체크박스는 `align-items-center`로 세로를 맞춥니다.
- 한 카드·한 영역의 `btn-primary`는 하나로 유지합니다.
- 숨김 토글은 `hidden` 클래스로 처리합니다.
- HTML을 만들면 짝이 되는 `.js`도 함께 만듭니다.

### 하지 말 것

```md
- 임의의 HEX 색상이나 인라인 색상 스타일을 쓰지 말 것 (Tabler 색상 유틸리티 사용)
- 시각적 스타일을 인라인 style로 넣지 말 것 (display/visibility 토글, progress-bar width 같은 동적 값만 예외)
- container-xl 등 고정 폭을 업무 화면 기본 컨테이너로 쓰지 말 것 (container-fluid + max-width:NNNN! 사용)
- 순수 <table>로 업무 목록을 만들지 말 것 (syn_auigrid 사용, RPT 보고서 화면만 예외)
- 화면 간 호출·결과 반환이 필요한 업무 팝업을 Bootstrap modal로 만들지 말 것 (simplemodal-data + triggerConfig 사용)
- 한 화면 안에서 simplemodal-data와 Bootstrap modal을 섞어 쓰지 말 것 (닫기 방식이 달라 동작이 엇갈림)
- 등록·수정 폼 본체를 Bootstrap modal로 옮기지 말 것 (모달은 확인·보기·짧은 선택 전용)
- 라벨을 입력 위에 쌓는 일반 Tabler 폼 레이아웃을 업무 폼에 쓰지 말 것 (좌측 라벨 패턴 A 또는 B 사용)
- 필수 표시를 라벨 텍스트에 "*"로 하드코딩하지 말 것 (label에 required 클래스만 추가)
- 상태 색을 화면마다 다르게 하드코딩하지 말 것 (상태 코드 → 색상 매핑 함수 사용)
- 클릭해야 하는 상태 필터를 배지로 만들지 말 것 (btn-group + btn bg-muted-lt 또는 btn-check 사용)
- SVG 아이콘과 웹폰트 아이콘을 섞어 쓰지 말 것 (ti ti-* 웹폰트로 통일)
- 웹폰트 아이콘에 icon-sm / icon-lg를 쓰지 말 것 (SVG 전용 클래스, f:NN 사용)
- FontAwesome, Bootstrap Icons 등 타 아이콘 폰트를 쓰지 말 것
- Tabler 문법과 Master CSS 문법을 섞지 말 것
    (Tabler는 하이픈: me-2, border-top / Master CSS는 콜론: mr:4, f:20)
- 존재하지 않는 클래스를 추측해서 쓰지 말 것
    (없음: alert-title, border-dashed, border-dotted, border-r, border-t,
           ml-*, mr-*, pl-*, pr-*, tracking-tight, tracking-wide,
           btn-xs, btn-xl, progress-lg, progress-steps, font-weight-semibold,
           align-content-baseline, datagrid-content)
    (없는 아이콘 예: ti-organization → ti-sitemap 사용)
    (참고: hidden은 Master CSS가 제공하므로 이 프로젝트에서는 유효)
- 존재하지 않는 syn_* 컴포넌트 이름을 추측해서 쓰지 말 것 (표에 없으면 기존 화면에서 유사 사례를 먼저 확인)
- 카드 안에 의미 없는 카드를 중첩하지 말 것 (card-header + border-top 반복으로 섹션 분리)
- page-header / page-body에 기본 여백 외의 여백을 겹쳐 넣지 말 것 (이미 page-padding 1rem을 가짐)
- 표를 레이아웃 도구로 쓰지 말 것
- div·span에 onclick을 달아 클릭 요소를 만들지 말 것 (button / a 사용)
- 팝업 위에 팝업을 띄우지 말 것 (steps로 단계 전환)
- badge-blink와 캐러셀 자동 재생을 쓰지 말 것
- 모든 필드에 성공 검증 표시(is-valid)를 뿌리지 말 것
- 한 영역에 btn-primary를 두 개 이상 두지 말 것
- 새 CSS 클래스·버튼 스타일을 화면 단위로 만들지 말 것 (유틸리티 조합으로 해결, 반복되면 공용 CSS에 한 번만 정의)
- CDN @latest를 참조하지 말 것 (로컬 번들 사용, 버전은 libman.json이 고정)
```

---

## 준수 검증 체크리스트

새 화면을 만든 뒤 아래를 확인합니다. 1~10번은 grep으로 기계 검증이 가능합니다.

| # | 검증 항목 | 확인 방법 |
|---|---|---|
| 1 | 타 아이콘 폰트·SVG 미사용 | `fa-`, `bi-`, `<svg` 검색 결과 0건 |
| 2 | HEX 색상 하드코딩 없음 | `#` 뒤 3·6자리 HEX가 `class`/`style`에 없음 |
| 3 | 인라인 시각 스타일 없음 | `style="` 안에 `color` `background` `font-size` `border` 없음 (progress `width`, `display`/`visibility` 제외) |
| 4 | 존재하지 않는 클래스 없음 | `alert-title`, `border-dashed`, `border-r`, `border-t`, `ml-`, `mr-`(하이픈), `pl-`, `pr-`, `tracking-`, `btn-xs`, `btn-xl`, `progress-steps`, `font-weight-` 검색 결과 0건 |
| 5 | 기본 컨테이너 준수 | `container-xl` 0건, `container-fluid` + `max-width:*!` 존재 |
| 6 | 팝업 패턴 일관성 | 한 화면에 `simplemodal-data`와 `modal-dialog`가 함께 있지 않음. 업무 팝업(결과 반환)은 `simplemodal-data` 사용 |
| 7 | 필수 표시 준수 | 라벨 텍스트에 `*` 하드코딩 없이 `required` 클래스 사용 |
| 8 | 데이터 바인딩 지정 | 입력 컨트롤·그리드에 `syn-datafield` 존재 |
| 9 | ID 중복 없음 | 문서 내 `id=` 값이 모두 고유 |
| 10 | 짝 파일 존재 | `{화면ID}.html`과 `{화면ID}.js`가 쌍으로 존재 |
| 11 | 화면 유형 템플릿 준수 | 「화면 유형별 표준 패턴」의 골격·컨테이너 폭과 일치 |
| 12 | 라벨 배치·연결 | 폼 라벨이 좌측(패턴 A 또는 B)이고 폭이 통일됨, `label[for]` ↔ `input[id]` 연결 |
| 13 | 아이콘 접근성 | 아이콘 전용 버튼에 `aria-label`, 텍스트 옆 아이콘에 `aria-hidden="true"` |
| 14 | 상태 색상 일관성 | 동일 상태 코드가 기존 화면과 같은 색·같은 컴포넌트로 표현됨 |
| 15 | `syn_*` 컴포넌트 존재 확인 | 사용한 `syn_*` 태그가 표에 있거나 동일 모듈 내 기존 사용례가 있음 |
| 16 | 정렬 규칙 | 숫자·금액이 우측 정렬, 코드·상태·날짜가 가운데 정렬, 표 전체 `table-vcenter` |
| 17 | 세로 정렬 | 입력·버튼·체크박스가 섞인 행에 `align-items-center` 적용 |
| 18 | 빈 상태 처리 | 조회 결과 0건일 때 `empty` 컴포넌트가 표시됨 |
| 19 | 피드백 품질 | alert·검증 메시지에 원인과 다음 행동이 한국어로 포함됨 |
| 20 | 키보드 접근 | 조회 → 입력 → 저장 전 과정이 키보드만으로 가능 |
| 21 | 다크 모드 | `data-bs-theme="dark"`에서 색·대비가 깨지지 않음 |
| 22 | 인쇄 | `d-print-none`이 적용되어 불필요한 요소가 인쇄되지 않음 |
| 23 | 반응형 | `lg` 미만에서 가로 스크롤 없이 읽히고, 주 액션이 사라지지 않음 |

---

## 알려진 함정 (실제 화면·예제에서 반복 발견된 오류)

기존 화면이나 외부 예제 코드를 참고할 때 **아래는 따라 쓰지 마세요.** 모두 1.3.2 번들에서 동작하지 않거나 이 지침에 어긋납니다.

| 발견되는 코드 | 문제 | 대체 |
|---|---|---|
| `class="ti ti-plus mr-1"` | `mr-*`는 Bootstrap 5에 없음 | Tabler는 `me-1`, 이 프로젝트 관례는 Master CSS `mr:4` |
| `class="ms-4 pl-0"` | `pl-*` 없음 | `ps-0` |
| `class="font-weight-semibold"` | 없음 | `fw-semibold` |
| `<h4 class="alert-title">` | 1.3.2에 없음 | `alert-heading` |
| `<div class="progress-steps">` | 1.5.x 전용, 1.3.2에 없음 | `steps` 또는 `progress` |
| `class="btn btn-xs"` / `btn-xl` | 없음 | `btn-sm` / 기본 크기 |
| `class="badge badge-blink"` | 접근성 위반 | 색·텍스트로 강조 |
| `<style> .kpi-value { color:#1f3b64 } </style>` | 임의 HEX·화면 전용 스타일 | `.h1` + `text-*` 유틸리티 (RPT 화면만 예외) |
| `<div class="bar-track"><div class="bar-fill">` | 자체 구현 진행률 | `progress` + `progress-bar` |
| `class="page-body m-3"` + `page-header mt-4` | 기본 `page-padding`과 중복 | 이 프로젝트 관례인 `mt-2`까지만 |
| 업무 팝업을 `modal-dialog`로 만들고 결과를 전역 변수로 전달 | 호출 화면과의 결과 반환 계약이 없음 | `simplemodal-data` + `syn.$w.showDialog` 콜백 |
| 한 화면에 `simplemodal-data`와 `modal-dialog`가 섞임 | 닫기 방식(`triggerConfig` vs `data-bs-dismiss`)이 엇갈림 | 화면마다 한 패턴만 선택 |
| `accept="gif;jpg;png"` | 잘못된 형식 | `accept=".gif,.jpg,.png"` |
| `ti-organization` | 없는 아이콘 | `ti-sitemap` |
| 인라인 `style="display:none"` | 토글 추적 어려움 | `hidden` 클래스 토글(Master CSS) |
| `<i class="ti ti-user icon-lg">` | `icon-*`는 SVG 전용 | `f:20` 등 font-size 지정 |
| 코드도움(`syn_codepicker`) 결과 없이 저장 성공 메시지 | 미연동 상태를 성공으로 가장 | 연동 전에는 미연동 상태를 명시 |

---

## 반복 개선 가이드

이 문서를 고쳐야 할 때는 다음 순서를 지킵니다.

1. **실재 확인** — 바꾸려는 클래스가 현재 번들 CSS에 있는지 먼저 확인합니다(`2.Modules/wwwroot/wwwroot/lib/tabler-core/dist/css/tabler.min.css` 검색). 아이콘은 `tabler-icons.min.css`에서 확인합니다.
2. **근거 기록** — 규칙을 바꾸면 그렇게 만든 실제 화면 경로를 함께 적습니다. 근거 없는 규칙은 지켜지지 않습니다.
3. **도구 반영** — 「디자인 저작 구성요소」의 도구상자·속성·검증 규칙을 같이 갱신합니다. 문서와 도구가 어긋나면 도구가 이깁니다.
4. **버전 표기** — `libman.json`의 Tabler 버전을 올릴 때는 프런트매터의 `stack`, 「문서 정보」의 기준 버전, "존재하지 않는 클래스" 목록을 **모두** 재검증합니다.
5. **연계 문서** — 화면 구조·컴포넌트·UI 규칙이 바뀌면 `handstack-docs`의 관련 문서와 `static/uicontrols` 가이드를 같은 작업에서 갱신합니다(`CLAUDE.md`의 연계 문서 규칙).

### 알려진 공백

- 순수 `<table>`의 컬럼 리사이즈·고정 헤더는 Tabler가 제공하지 않습니다. `syn_auigrid`를 씁니다.
- Tabler에는 업무용 트리·조직 선택·결재선 컴포넌트가 없습니다. `syn_*` 런타임 구성요소로 채웁니다.
- 인쇄 레이아웃(용지 여백, 페이지 분할)은 유틸리티로 표현할 수 없어 RPT 화면 전용 CSS를 허용합니다.
- 한글 폰트는 Tabler 기본값(`Inter Var` 계열)에 포함되지 않습니다. 프로젝트 CSS에서 `--tblr-font-sans-serif`를 재정의해 `Noto Sans KR`을 앞에 둡니다.
- 1.3.2 번들에는 `progress-steps`, `btn-xl`, `progress-lg`가 없습니다. 필요하면 `libman.json` 버전을 올리는 논의가 먼저입니다.

---

## 참고 링크

**Layout** — [Page headers](https://docs.tabler.io/ui/layout/page-headers) · [Page layouts](https://docs.tabler.io/ui/layout/page-layouts) · [Navs and tabs](https://docs.tabler.io/ui/layout/navs-tabs)

**Components** — [Alerts](https://docs.tabler.io/ui/components/alerts) · [Badges](https://docs.tabler.io/ui/components/badges) · [Breadcrumb](https://docs.tabler.io/ui/components/breadcrumb) · [Buttons](https://docs.tabler.io/ui/components/buttons) · [Cards](https://docs.tabler.io/ui/components/cards) · [Dropdowns](https://docs.tabler.io/ui/components/dropdowns) · [Empty states](https://docs.tabler.io/ui/components/empty) · [List group](https://docs.tabler.io/ui/components/list-group) · [Modal](https://docs.tabler.io/ui/components/modal) · [Offcanvas](https://docs.tabler.io/ui/components/offcanvas) · [Progress bars](https://docs.tabler.io/ui/components/progress) · [Segmented Control](https://docs.tabler.io/ui/components/segmented-control) · [Status](https://docs.tabler.io/ui/components/status) · [Steps](https://docs.tabler.io/ui/components/steps) · [Tables](https://docs.tabler.io/ui/components/tables) · [Tags](https://docs.tabler.io/ui/components/tags) · [Timelines](https://docs.tabler.io/ui/components/timelines) · [Toasts](https://docs.tabler.io/ui/components/toasts)

**Forms** — [Form elements](https://docs.tabler.io/ui/forms/form-elements) · [Form fieldset](https://docs.tabler.io/ui/forms/form-fieldset) · [Form selectgroup](https://docs.tabler.io/ui/forms/form-selectboxes) · [Validation states](https://docs.tabler.io/ui/forms/form-validation)

**Utilities** — [Borders](https://docs.tabler.io/ui/utilities/borders) · [Cursors](https://docs.tabler.io/ui/utilities/cursors) · [Margins](https://docs.tabler.io/ui/utilities/margins) · [Printing](https://docs.tabler.io/ui/utilities/printing) · [Vertical align](https://docs.tabler.io/ui/utilities/vertical-align) · [Visually hidden](https://docs.tabler.io/ui/utilities/visually-hidden)

**Base** — [Colors](https://docs.tabler.io/ui/base/colors) · [Typography](https://docs.tabler.io/ui/base/typography) · [Color modes](https://docs.tabler.io/ui/getting-started/color-modes) · [Tabler Icons](https://tabler.io/icons) · [Icons webfont](https://docs.tabler.io/icons/libraries/webfont)

**Master CSS** — [Documentation](https://rc.css.master.co/docs)

> **Tabler 공식 문서와 이 문서가 충돌하면 이 문서를 따릅니다.** 공식 문서는 범용 관리자 템플릿과 최신 버전을 전제로 하고, 이 문서는 번들 1.3.2와 HandStack 런타임 위에서 동작하는 밀도 높은 사내 업무 화면, 그리고 그 화면을 만드는 저작 도구를 전제로 하기 때문입니다.
