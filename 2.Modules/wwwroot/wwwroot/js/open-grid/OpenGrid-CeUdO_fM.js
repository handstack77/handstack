class Is {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  on(e, t) {
    const s = this.listeners.get(e) ?? [];
    return s.push({ handler: t, once: false }), this.listeners.set(e, s), this;
  }
  once(e, t) {
    const s = this.listeners.get(e) ?? [];
    return s.push({ handler: t, once: true }), this.listeners.set(e, s), this;
  }
  off(e, t) {
    if (!t) return this.listeners.delete(e), this;
    const s = this.listeners.get(e);
    if (s) {
      const i = s.filter((o) => o.handler !== t);
      i.length === 0 ? this.listeners.delete(e) : this.listeners.set(e, i);
    }
    return this;
  }
  emit(e, ...t) {
    const s = this.listeners.get(e);
    if (!s || s.length === 0) return false;
    const i = [];
    for (const o of s) o.handler(...t), o.once || i.push(o);
    return i.length !== s.length && (i.length === 0 ? this.listeners.delete(e) : this.listeners.set(e, i)), true;
  }
  removeAllListeners(e) {
    return e ? this.listeners.delete(e) : this.listeners.clear(), this;
  }
  listenerCount(e) {
    var _a;
    return ((_a = this.listeners.get(e)) == null ? void 0 : _a.length) ?? 0;
  }
}
class Ts {
  constructor(e, t) {
    this._totalRows = 0, this._scrollTop = 0, this._viewportHeight = 0, this._rafId = null, this._onScroll = () => {
      this._scrollTop = this.container.scrollTop, this._scheduleRender();
    }, this.container = e, this.rowHeight = t.rowHeight, this.overscan = t.overscan ?? 5, this.onRender = t.onRender, this.container.addEventListener("scroll", this._onScroll, { passive: true });
  }
  _scheduleRender() {
    this._rafId === null && (this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      const e = this.getVisibleRange();
      this.onRender(e.startIndex, e.endIndex);
    }));
  }
  getVisibleRange() {
    const e = Math.ceil(this._viewportHeight / this.rowHeight), t = Math.max(0, Math.floor(this._scrollTop / this.rowHeight) - this.overscan), s = Math.min(this._totalRows - 1, t + e + this.overscan * 2), i = t * this.rowHeight;
    return { startIndex: t, endIndex: s, offsetY: i };
  }
  setTotalRows(e) {
    this._totalRows = e, this._updateSpacerHeight(), this._scheduleRender();
  }
  setViewportHeight(e) {
    this._viewportHeight = e, this._scheduleRender();
  }
  setRowHeight(e) {
    this.rowHeight = e, this._updateSpacerHeight(), this._scheduleRender();
  }
  scrollToRow(e) {
    const t = e * this.rowHeight, s = t + this.rowHeight, i = this._scrollTop + this._viewportHeight;
    if (t < this._scrollTop) this._scrollTop = t, this.container.scrollTop = t;
    else if (s > i) {
      const o = s - this._viewportHeight;
      this._scrollTop = o, this.container.scrollTop = o;
    }
  }
  getTotalHeight() {
    return this._totalRows * this.rowHeight;
  }
  _updateSpacerHeight() {
    const e = this.container.querySelector(".og-spacer");
    e && (e.style.height = `${this.getTotalHeight()}px`);
  }
  destroy() {
    this.container.removeEventListener("scroll", this._onScroll), this._rafId !== null && cancelAnimationFrame(this._rafId);
  }
}
class wt {
  constructor(e, t = 0) {
    this._flatLeaves = [], this._maxDepth = 1, this._frozenCount = 0, this._columns = e, this._frozenCount = t, this._process();
  }
  _process() {
    const e = [];
    let t = 0;
    const s = (i, o) => {
      for (const n of i) n.children && n.children.length > 0 ? (s(n.children, o + 1), this._maxDepth = Math.max(this._maxDepth, o + 1)) : e.push({ ...n, _colIndex: t++, _depth: o, _leaf: true });
    };
    this._maxDepth = 1, s(this._columns, 1), this._flatLeaves = e;
  }
  get leaves() {
    return this._flatLeaves;
  }
  get visibleLeaves() {
    return this._flatLeaves.filter((e) => !e.hidden);
  }
  get headerDepth() {
    return this._maxDepth;
  }
  get frozenCount() {
    return this._frozenCount;
  }
  setFrozen(e) {
    this._frozenCount = e;
  }
  setColumns(e) {
    this._columns = e, this._process();
  }
  hideColumn(e) {
    const t = Array.isArray(e) ? e : [e];
    this._flatLeaves.forEach((s) => {
      t.includes(s.field) && (s.hidden = true);
    });
  }
  showColumn(e) {
    const t = Array.isArray(e) ? e : [e];
    this._flatLeaves.forEach((s) => {
      t.includes(s.field) && (s.hidden = false);
    });
  }
  addColumn(e, t = "last") {
    t === "last" ? this._columns.push(e) : t === "first" ? this._columns.unshift(e) : this._columns.splice(t, 0, e), this._process();
  }
  removeColumn(e) {
    const t = (s) => s.filter((i) => i.field === e ? false : (i.children && (i.children = t(i.children)), true));
    this._columns = t(this._columns), this._process();
  }
  getColumnByField(e) {
    return this._flatLeaves.find((t) => t.field === e);
  }
  getColumnByIndex(e) {
    return this._flatLeaves[e];
  }
  getColumnIndex(e) {
    return this._flatLeaves.findIndex((t) => t.field === e);
  }
  buildHeaderCells() {
    const e = Array.from({ length: this._maxDepth }, () => []);
    let t = 0;
    const s = (i, o) => {
      let n = 0;
      for (const a of i) if (!a.hidden) if (a.children && a.children.length > 0) {
        const l = s(a.children, o + 1);
        l > 0 && (e[o - 1].push({ column: a, colIndex: t, depth: o, colSpan: l, rowSpan: 1 }), n += l);
      } else e[o - 1].push({ column: a, colIndex: t++, depth: o, colSpan: 1, rowSpan: this._maxDepth - o + 1 }), n++;
      return n;
    };
    return s(this._columns, 1), e;
  }
  computeWidths(e, t = 100) {
    const s = this.visibleLeaves, i = s.filter((l) => l.flex), o = s.filter((l) => !l.flex && l.width).reduce((l, d) => l + d.width, 0), n = i.reduce((l, d) => l + (d.flex ?? 1), 0), a = Math.max(0, e - o);
    return s.map((l) => l.flex ? Math.round(l.flex / n * a) : l.width ?? t);
  }
}
function Ds(r, e) {
  return r.indexOf("{") === -1 ? r : r.replace(/\{\{|\}\}|\{(\w+)\}/g, (t, s) => {
    if (t === "{{") return "{";
    if (t === "}}") return "}";
    const i = e ? e[s] : void 0;
    return i === void 0 ? t : String(i);
  });
}
const Os = { contextMenu: { sortAsc: "오름차순 정렬", sortDesc: "내림차순 정렬", find: "찾기", exportExcel: "Excel로 저장", exportCsv: "CSV로 저장", print: "인쇄" }, filter: { title: "필터", opContains: "포함", opEq: "같음", opNe: "같지 않음", opStartsWith: "시작", opEndsWith: "끝남", opGt: "보다 큼", opLt: "보다 작음", opGte: "이상", opLte: "이하", valuePlaceholder: "필터 값 입력...", clear: "초기화", apply: "적용", legend: "필터", clearAria: "필터 초기화", all: "전체" }, findBar: { label: "찾기", placeholder: "검색어 입력...", searchAria: "그리드 내 검색", closeAria: "찾기 닫기", countBadge: "{n}건" }, pagination: { rowsPerPage: "행/페이지:", rangeBadge: "{from}–{to} / {total}건", empty: "0건" }, drag: { rowCount: "{count}개 행 이동" }, crossGrid: { overlayAria: "그리드 필드 매핑", title: "필드 매핑", desc1: "두 그리드의 필드 구조가 다릅니다. <b>타깃 필드</b>마다 어떤 <b>소스 필드</b>의 값을 가져올지 지정하세요. ", desc2: "아래 스크립트를 복사해 <code>crossGridMapping</code> 에 baking 하면 다음부터는 이 창 없이 자동 변환됩니다.", emptyOption: "(비움)", scriptTitle: "생성된 변환 스크립트", copy: "복사", copied: "복사됨!", copyFailed: "복사 실패", cancel: "취소", applyMove: "적용 후 이동", scriptComment: "// crossGridMapping 옵션에 이 함수를 그대로 지정하세요." }, shuttle: { toRight: "체크한 행을 오른쪽 그리드로 이동", toLeft: "체크한 행을 왼쪽 그리드로 이동", allRight: "왼쪽 전체를 오른쪽으로 이동", allLeft: "오른쪽 전체를 왼쪽으로 이동" }, tree: { collapse: "접기", expand: "펼치기" }, detail: { glyphLabel: "▤ 상세", glyphTooltip: "상세 보기", expandAria: "상세 패널 펼치기", collapseAria: "상세 패널 접기", expandedAnnounce: "행 상세 패널을 펼쳤습니다.", collapsedAnnounce: "행 상세 패널을 접었습니다.", collapsedAllAnnounce: "모든 상세 패널을 접었습니다.", depthLimitOpen: "중첩 깊이 한계({max})로 상세 패널을 열 수 없습니다.", depthLimitSubgrid: "중첩 깊이 한계({max})로 서브 그리드를 생성하지 않습니다." }, worksheet: { addAria: "새 워크시트 추가" }, editor: { datePick: "날짜 선택", select: "선택", cellPositionAnnounce: "{row}행 {col}열, {header}: {value}" }, cell: { emptyValue: "빈 값", revealTooltip: "클릭하면 원문 표시", revealAria: "마스킹 해제", radioAria: "선택", barcodeAria: "바코드: {value}" }, row: { selectAllAria: "전체 행 선택", selectAria: "{n}행 선택", moveAnnounce: "행 {from}을(를) {to}번째 위치로 이동" }, group: { badge: "{label}  ({count}건)", nullLabel: "(없음)" }, pivot: { totalLabel: "합계" }, data: { loadedAnnounce: "{count}행 데이터 로드됨", skippedCellsAnnounce: "쓰기 대상이 아닌 셀 {count}개를 건너뛰었습니다" }, range: { selectionAnnounce: "{r1}행 {c1}열 ~ {r2}행 {c2}열, {n}개 셀 선택", formulaPreserved: "수식 셀 {count}개 보존", fillSkipped: "채우기 대상이 아닌 셀 {count}개를 건너뛰었습니다", fillHandleAria: "채우기 핸들" }, sort: { asc: "오름차순", desc: "내림차순", none: "정렬 해제", announce: "{field} {dir} 정렬" }, chart: { defaultTitle: "차트", badgeSampled: "샘플링됨 {to}/{from}행", badgeAggregated: "category 집계됨 ({op})", badgePieFirstSeries: "파이: 첫 시리즈만 표시", badgeNegativesAbs: "음수→절대값 표시 · bar 권장", badgeRangeFallback: "범위 소스 없음 · 선택 행으로 대체", badgeEngineFallback: "{engine} 미설치 · 내장 차트로 대체", announcePrefix: "차트 안내: {badges}", a11ySummary: "{title}: 카테고리 {categories}개, 시리즈 {series}", a11ySummaryNoTitle: "카테고리 {categories}개, 시리즈 {series}", a11yAltText: "{title}: {categories}개 카테고리별 {series} — 상세 값은 아래 표를 참고하세요", a11yNoData: "데이터 없음", tooltipEmpty: "없음", canvasDefault: "차트" }, formulaError: { err: "수식 오류", ref: "참조 대상이 삭제됨", cycle: "순환 참조", div0: "0으로 나눔", name: "알 수 없는 함수/이름", value: "숫자가 아닌 값에 산술 연산", num: "수치 도메인 오류", fallback: "수식 오류" }, formula: { cellErrorAnnounce: "{field} 셀 오류: {message}", ariaError: "수식 {src}, 오류: {message}", ariaValue: "수식 {src}, 값 {value}{approx}", approxSuffix: " (근사값)" }, grid: { containerAria: "OPEN_GRID 데이터 그리드", emptyMessage: "데이터가 없습니다.", filterTooltip: "필터", detailRegion: "상세 내용" }, export: { printSummary: "{rows}행 × {cols}열 · {date}" } }, $s = { intlLocale: "ko-KR", dir: "ltr", exportFont: "맑은 고딕" }, zs = { contextMenu: { sortAsc: "Sort ascending", sortDesc: "Sort descending", find: "Find", exportExcel: "Save as Excel", exportCsv: "Save as CSV", print: "Print" }, filter: { title: "Filter", opContains: "Contains", opEq: "Equals", opNe: "Not equal", opStartsWith: "Starts with", opEndsWith: "Ends with", opGt: "Greater than", opLt: "Less than", opGte: "At least", opLte: "At most", valuePlaceholder: "Enter filter value...", clear: "Reset", apply: "Apply", legend: "Filter", clearAria: "Reset filter", all: "All" }, findBar: { label: "Find", placeholder: "Enter search term...", searchAria: "Search within grid", closeAria: "Close find", countBadge: (r) => r.n === 1 ? "1 match" : `${r.n} matches` }, pagination: { rowsPerPage: "Rows per page:", rangeBadge: "{from}–{to} of {total}", empty: "0 rows" }, drag: { rowCount: (r) => r.count === 1 ? "Move 1 row" : `Move ${r.count} rows` }, crossGrid: { overlayAria: "Grid field mapping", title: "Field mapping", desc1: "The two grids have different field structures. For each <b>target field</b>, choose which <b>source field</b> to pull its value from. ", desc2: "Copy the script below and bake it into <code>crossGridMapping</code> to convert automatically without this dialog next time.", emptyOption: "(none)", scriptTitle: "Generated conversion script", copy: "Copy", copied: "Copied!", copyFailed: "Copy failed", cancel: "Cancel", applyMove: "Apply and move", scriptComment: "// Assign this function to the crossGridMapping option as-is." }, shuttle: { toRight: "Move checked rows to the right grid", toLeft: "Move checked rows to the left grid", allRight: "Move all from left to right", allLeft: "Move all from right to left" }, tree: { collapse: "Collapse", expand: "Expand" }, detail: { glyphLabel: "▤ Detail", glyphTooltip: "View detail", expandAria: "Expand detail panel", collapseAria: "Collapse detail panel", expandedAnnounce: "Row detail panel expanded.", collapsedAnnounce: "Row detail panel collapsed.", collapsedAllAnnounce: "All detail panels collapsed.", depthLimitOpen: "Nesting depth limit ({max}) reached — cannot open the detail panel.", depthLimitSubgrid: "Nesting depth limit ({max}) reached — subgrid will not be created." }, worksheet: { addAria: "Add new worksheet" }, editor: { datePick: "Pick a date", select: "Select", cellPositionAnnounce: "Row {row}, column {col}, {header}: {value}" }, cell: { emptyValue: "empty", revealTooltip: "Click to reveal the original", revealAria: "Reveal masked value", radioAria: "Select", barcodeAria: "Barcode: {value}" }, row: { selectAllAria: "Select all rows", selectAria: "Select row {n}", moveAnnounce: "Move row {from} to position {to}" }, group: { badge: "{label}  ({count})", nullLabel: "(none)" }, pivot: { totalLabel: "Total" }, data: { loadedAnnounce: (r) => r.count === 1 ? "1 row loaded" : `${r.count} rows loaded`, skippedCellsAnnounce: (r) => r.count === 1 ? "Skipped 1 non-writable cell" : `Skipped ${r.count} non-writable cells` }, range: { selectionAnnounce: "Selected {n} cells from row {r1} column {c1} to row {r2} column {c2}", formulaPreserved: (r) => r.count === 1 ? "1 formula cell preserved" : `${r.count} formula cells preserved`, fillSkipped: (r) => r.count === 1 ? "Skipped 1 non-fillable cell" : `Skipped ${r.count} non-fillable cells`, fillHandleAria: "Fill handle" }, sort: { asc: "ascending", desc: "descending", none: "unsorted", announce: "{field} sorted {dir}" }, chart: { defaultTitle: "Chart", badgeSampled: "Sampled {to}/{from} rows", badgeAggregated: "Category aggregated ({op})", badgePieFirstSeries: "Pie: first series only", badgeNegativesAbs: "Negatives shown as absolute · bar recommended", badgeRangeFallback: "No range source · using selected rows", badgeEngineFallback: "{engine} not installed · using built-in chart", announcePrefix: "Chart notice: {badges}", a11ySummary: "{title}: {categories} categories, series {series}", a11ySummaryNoTitle: "{categories} categories, series {series}", a11yAltText: "{title}: {series} across {categories} categories — see the table below for detailed values", a11yNoData: "No data", tooltipEmpty: "none", canvasDefault: "Chart" }, formulaError: { err: "Formula error", ref: "Reference was deleted", cycle: "Circular reference", div0: "Division by zero", name: "Unknown function/name", value: "Arithmetic on a non-numeric value", num: "Numeric domain error", fallback: "Formula error" }, formula: { cellErrorAnnounce: "{field} cell error: {message}", ariaError: "Formula {src}, error: {message}", ariaValue: "Formula {src}, value {value}{approx}", approxSuffix: " (approx.)" }, grid: { containerAria: "OPEN_GRID data grid", emptyMessage: "No data.", filterTooltip: "Filter", detailRegion: "Detail" }, export: { printSummary: "{rows} rows × {cols} cols · {date}" } }, Bs = { intlLocale: "en-US", dir: "ltr", exportFont: "Calibri" };
function yt(r) {
  const e = r.indexOf(".");
  return e < 0 ? [r, ""] : [r.slice(0, e), r.slice(e + 1)];
}
function $e(r, e) {
  if (!r) return;
  const [t, s] = yt(e), i = r[t];
  return i ? i[s] : void 0;
}
function vt(r, e) {
  const t = {};
  for (const s of Object.keys(r)) t[s] = { ...r[s] };
  for (const s of Object.keys(e)) t[s] = { ...t[s] ?? {}, ...e[s] };
  return t;
}
class je {
  constructor(e) {
    this._locales = /* @__PURE__ */ new Map(), this._meta = /* @__PURE__ */ new Map(), this._extends = /* @__PURE__ */ new Map(), this._overrides = {}, this._cache = /* @__PURE__ */ new Map(), this._warned = /* @__PURE__ */ new Set(), this._parent = e, this._active = e ? e._active : "ko";
  }
  register(e, t, s) {
    return this._locales.set(e, t), (s == null ? void 0 : s.extends) && this._extends.set(e, s.extends), this._cache.clear(), { missingKeys: this._allDotKeys().filter((n) => $e(t, n) === void 0) };
  }
  extend(e, t) {
    const s = this._locales.get(e) ?? {};
    return this._locales.set(e, vt(s, t)), this._cache.clear(), this;
  }
  has(e) {
    var _a;
    return this._locales.has(e) || (((_a = this._parent) == null ? void 0 : _a.has(e)) ?? false);
  }
  get(e) {
    return this._locales.get(e);
  }
  list() {
    const e = new Set(this._locales.keys());
    if (this._parent) for (const t of this._parent.list()) e.add(t);
    return [...e];
  }
  setActive(e) {
    if (!this.has(e) && e !== "ko") {
      typeof console < "u" && console.warn(`[LocaleRegistry] 미등록 로케일 "${e}" — 무시하고 현재 로케일 유지. / unknown locale, keeping current.`);
      return;
    }
    this._active = e;
  }
  active() {
    return this._active;
  }
  child() {
    return new je(this);
  }
  setOverride(e, t) {
    var _a;
    const [s, i] = yt(e), o = (_a = this._overrides)[s] ?? (_a[s] = {});
    return o[i] = t, this._cache.clear(), this;
  }
  applyOverrides(e) {
    return this._overrides = vt(this._overrides, e), this._cache.clear(), this;
  }
  t(e, t) {
    const s = this._resolveCached(e);
    return s === void 0 ? (this._warned.has(e) || (this._warned.add(e), typeof console < "u" && console.warn(`[LocaleRegistry] 미등록 메시지 키 "${e}" — 키 원문 반환. / unknown message key, returning the key.`)), e) : typeof s == "function" ? s(t ?? {}) : Ds(s, t);
  }
  meta() {
    return this._resolveMeta(this._active) ?? this._resolveMeta("ko") ?? { intlLocale: this._active };
  }
  _resolveCached(e) {
    const t = `${this._active}\0${e}`, s = this._cache.get(t);
    if (s !== void 0) return s === null ? void 0 : s;
    const i = this._resolve(e);
    return this._cache.set(t, i === void 0 ? null : i), i;
  }
  _resolve(e) {
    const t = this._active;
    for (let i = this; i; i = i._parent) {
      const o = $e(i._overrides, e);
      if (o !== void 0) return o;
      const n = $e(i._locales.get(t), e);
      if (n !== void 0) return n;
    }
    const s = this._extendsOf(t);
    if (s && s !== t && this._resolveLocale(s) !== void 0) {
      const o = bt(this, s, e);
      if (o !== void 0) return o;
    }
    if (t !== "ko") {
      const i = bt(this, "ko", e);
      if (i !== void 0) return i;
    }
  }
  _resolveLocale(e) {
    for (let t = this; t; t = t._parent) {
      const s = t._locales.get(e);
      if (s) return s;
    }
  }
  _extendsOf(e) {
    for (let t = this; t; t = t._parent) {
      const s = t._extends.get(e);
      if (s) return s;
    }
  }
  _resolveMeta(e) {
    for (let t = this; t; t = t._parent) {
      const s = t._meta.get(e);
      if (s) return s;
    }
  }
  _allDotKeys() {
    const e = this._resolveLocale("ko");
    if (!e) return [];
    const t = [];
    for (const s of Object.keys(e)) {
      const i = e[s];
      if (i) for (const o of Object.keys(i)) t.push(`${s}.${o}`);
    }
    return t;
  }
  _seed(e, t, s) {
    this._locales.set(e, t), this._meta.set(e, s);
  }
}
function bt(r, e, t) {
  for (let s = r; s; s = s._parent) {
    const i = $e(s._locales.get(e), t);
    if (i !== void 0) return i;
  }
}
const se = new je();
se._seed("ko", Os, $s), se._seed("en", zs, Bs);
function B(r, e) {
  return se.t(r, e);
}
class Hs {
  constructor(e, t, s, i) {
    this._field = "", this._outsideHandler = null, this._onApply = t, this._onClear = s, this._t = i ?? B, this._el = document.createElement("div"), this._el.className = "og-filter-panel", this._el.style.cssText = `
      position:absolute;z-index:1000;min-width:200px;max-width:280px;
      background:var(--og-row-bg,#fff);border:1px solid var(--og-border-color,#e0e0e0);
      border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,0.15);
      padding:10px;box-sizing:border-box;display:none;font-size:13px;
    `, e.appendChild(this._el);
  }
  open(e, t, s) {
    var _a;
    this._field = e, this._el.innerHTML = "";
    const i = document.createElement("div");
    i.textContent = this._t("filter.title"), i.style.cssText = "font-weight:600;margin-bottom:8px;color:var(--og-text-color,#333);", this._el.appendChild(i);
    const o = document.createElement("div");
    o.style.cssText = "display:flex;gap:4px;margin-bottom:6px;";
    const n = document.createElement("select");
    n.style.cssText = "flex:1;padding:3px 4px;border:1px solid var(--og-border-color,#e0e0e0);border-radius:3px;font-size:12px;";
    const a = [{ label: this._t("filter.opContains"), value: "contains" }, { label: this._t("filter.opEq"), value: "=" }, { label: this._t("filter.opNe"), value: "!=" }, { label: this._t("filter.opStartsWith"), value: "startsWith" }, { label: this._t("filter.opEndsWith"), value: "endsWith" }, { label: this._t("filter.opGt"), value: ">" }, { label: this._t("filter.opLt"), value: "<" }, { label: this._t("filter.opGte"), value: ">=" }, { label: this._t("filter.opLte"), value: "<=" }];
    for (const p of a) {
      const f = document.createElement("option");
      f.value = p.value, f.textContent = p.label, n.appendChild(f);
    }
    s[0] && (n.value = s[0].operator), o.appendChild(n), this._el.appendChild(o);
    const l = document.createElement("input");
    l.type = "text", l.placeholder = this._t("filter.valuePlaceholder"), l.value = ((_a = s[0]) == null ? void 0 : _a.value) ?? "", l.style.cssText = `
      width:100%;padding:4px 6px;border:1px solid var(--og-border-color,#e0e0e0);
      border-radius:3px;font-size:12px;box-sizing:border-box;margin-bottom:8px;
      outline:none;
    `, l.addEventListener("keydown", (p) => {
      p.key === "Enter" ? h.click() : p.key === "Escape" && this.close();
    }), this._el.appendChild(l);
    const d = document.createElement("div");
    d.style.cssText = "display:flex;gap:6px;justify-content:flex-end;";
    const c = document.createElement("button");
    c.textContent = this._t("filter.clear"), c.style.cssText = `
      padding:3px 10px;border:1px solid var(--og-border-color,#e0e0e0);
      border-radius:3px;background:#fff;cursor:pointer;font-size:12px;color:#666;
    `, c.addEventListener("click", () => {
      this._onClear(this._field), this.close();
    });
    const h = document.createElement("button");
    h.textContent = this._t("filter.apply"), h.style.cssText = `
      padding:3px 10px;border:1px solid var(--og-primary,#1976d2);
      border-radius:3px;background:var(--og-primary,#1976d2);
      color:#fff;cursor:pointer;font-size:12px;
    `, h.addEventListener("click", () => {
      const p = l.value.trim();
      p ? this._onApply(this._field, [{ operator: n.value, value: p }]) : this._onClear(this._field), this.close();
    }), d.appendChild(c), d.appendChild(h), this._el.appendChild(d);
    const u = t.getBoundingClientRect(), g = this._el.parentElement.getBoundingClientRect();
    this._el.style.top = `${u.bottom - g.top + 2}px`, this._el.style.left = `${Math.min(u.left - g.left, g.width - 220)}px`, this._el.style.display = "block", requestAnimationFrame(() => l.focus()), this._outsideHandler && document.removeEventListener("mousedown", this._outsideHandler), this._outsideHandler = (p) => {
      !this._el.contains(p.target) && p.target !== t && this.close();
    }, setTimeout(() => document.addEventListener("mousedown", this._outsideHandler), 0);
  }
  close() {
    this._el.style.display = "none", this._outsideHandler && (document.removeEventListener("mousedown", this._outsideHandler), this._outsideHandler = null);
  }
  get isOpen() {
    return this._el.style.display !== "none";
  }
  destroy() {
    this.close(), this._el.remove();
  }
}
const Ps = 10;
function Ns(r, e = Ps) {
  const t = Math.pow(10, e);
  return Math.round(r * t) / t;
}
class v {
  constructor(e, t) {
    this._c = e, this._s = t < 0 ? 0 : t;
  }
  static from(e) {
    if (e instanceof v) return e;
    if (typeof e == "bigint") return new v(e, 0);
    const t = String(e).trim();
    if (!t || t === "null" || t === "undefined" || t === "NaN") return new v(0n, 0);
    const s = t.startsWith("-"), i = s ? t.slice(1) : t, o = i.indexOf(".");
    let n, a;
    if (o === -1) n = BigInt(i), a = 0;
    else {
      const l = i.slice(o + 1);
      n = BigInt(i.slice(0, o) + l), a = l.length;
    }
    return new v(s ? -n : n, a);
  }
  static zero() {
    return new v(0n, 0);
  }
  static one() {
    return new v(1n, 0);
  }
  static _align(e, t) {
    return e._s === t._s ? [e._c, t._c, e._s] : e._s > t._s ? [e._c, t._c * 10n ** BigInt(e._s - t._s), e._s] : [e._c * 10n ** BigInt(t._s - e._s), t._c, t._s];
  }
  add(e) {
    const [t, s, i] = v._align(this, v.from(e));
    return new v(t + s, i);
  }
  sub(e) {
    const [t, s, i] = v._align(this, v.from(e));
    return new v(t - s, i);
  }
  mul(e) {
    const t = v.from(e);
    return new v(this._c * t._c, this._s + t._s);
  }
  div(e, t = 20) {
    const s = v.from(e);
    if (s._c === 0n) throw new Error("OGDecimal: division by zero");
    const o = this._c * 10n ** BigInt(t + s._s) / s._c;
    return new v(o, t + this._s);
  }
  mod(e) {
    const t = v.from(e), [s, i, o] = v._align(this, t);
    return new v(s % i, o);
  }
  neg() {
    return new v(-this._c, this._s);
  }
  abs() {
    return new v(this._c < 0n ? -this._c : this._c, this._s);
  }
  eq(e) {
    const [t, s] = v._align(this, v.from(e));
    return t === s;
  }
  gt(e) {
    const [t, s] = v._align(this, v.from(e));
    return t > s;
  }
  lt(e) {
    const [t, s] = v._align(this, v.from(e));
    return t < s;
  }
  gte(e) {
    return !this.lt(e);
  }
  lte(e) {
    return !this.gt(e);
  }
  isZero() {
    return this._c === 0n;
  }
  isNeg() {
    return this._c < 0n;
  }
  isPos() {
    return this._c > 0n;
  }
  toFixed(e) {
    let t = this._c, s = this._s;
    if (s < e) t = t * 10n ** BigInt(e - s);
    else if (s > e) {
      const c = 10n ** BigInt(s - e), h = c / 2n, u = t < 0n, g = u ? -t : t, p = g % c;
      let f = g / c;
      p >= h && (f += 1n), t = u ? -f : f;
    }
    s = e;
    const i = t < 0n, n = (i ? -t : t).toString().padStart(e + 1, "0"), a = n.slice(0, n.length - e) || "0", l = e > 0 ? "." + n.slice(n.length - e) : "";
    return (i ? "-" : "") + a + l;
  }
  toString() {
    if (this._s === 0) return this._c.toString();
    let e = this._c, t = this._s;
    for (; t > 0 && e !== 0n && e % 10n === 0n; ) e /= 10n, t--;
    return new v(e, t).toFixed(t);
  }
  toNumber() {
    return parseFloat(this.toFixed(20));
  }
  static sum(e) {
    return e.reduce((t, s) => t.add(s), v.zero());
  }
  static avg(e, t = 20) {
    return e.length ? v.sum(e).div(e.length, t) : v.zero();
  }
  static min(e) {
    if (!e.length) throw new Error("OGDecimal.min: empty array");
    return e.map(v.from).reduce((t, s) => t.lt(s) ? t : s);
  }
  static max(e) {
    if (!e.length) throw new Error("OGDecimal.max: empty array");
    return e.map(v.from).reduce((t, s) => t.gt(s) ? t : s);
  }
}
function xt(r, e, t = 30) {
  return new Vs(r, e, t).parse();
}
class Vs {
  constructor(e, t, s) {
    this._ctx = t, this._prec = s, this._pos = 0, this._src = e.trim();
  }
  parse() {
    const e = this._additive();
    if (this._skip(), this._pos < this._src.length) throw new SyntaxError(`FormulaEngine: 예상치 못한 토큰 '${this._src[this._pos]}' (위치 ${this._pos})`);
    return e;
  }
  _additive() {
    let e = this._multiplicative();
    for (this._skip(); this._pos < this._src.length; ) {
      const t = this._src[this._pos];
      if (t !== "+" && t !== "-") break;
      this._pos++, this._skip();
      const s = this._multiplicative();
      e = t === "+" ? e.add(s) : e.sub(s), this._skip();
    }
    return e;
  }
  _multiplicative() {
    let e = this._unary();
    for (this._skip(); this._pos < this._src.length; ) {
      const t = this._src[this._pos];
      if (t !== "*" && t !== "/" && t !== "%") break;
      this._pos++, this._skip();
      const s = this._unary();
      t === "*" ? e = e.mul(s) : t === "/" ? e = e.div(s, this._prec) : e = e.mod(s), this._skip();
    }
    return e;
  }
  _unary() {
    return this._skip(), this._src[this._pos] === "-" ? (this._pos++, this._unary().neg()) : this._primary();
  }
  _primary() {
    this._skip();
    const e = this._src[this._pos];
    if (e === "(") {
      this._pos++;
      const t = this._additive();
      if (this._skip(), this._src[this._pos] !== ")") throw new SyntaxError("FormulaEngine: 닫는 괄호 ) 누락");
      return this._pos++, t;
    }
    return e === "[" ? this._fieldRef() : this._literal();
  }
  _fieldRef() {
    this._pos++;
    const e = this._pos;
    for (; this._pos < this._src.length && this._src[this._pos] !== "]"; ) this._pos++;
    if (this._pos >= this._src.length) throw new SyntaxError("FormulaEngine: 닫는 ] 누락");
    const t = this._src.slice(e, this._pos);
    this._pos++;
    const s = this._ctx[t];
    if (s == null) throw new ReferenceError(`FormulaEngine: 필드 '[${t}]'가 행 데이터에 없습니다`);
    return v.from(s);
  }
  _literal() {
    const e = this._pos;
    for (; this._pos < this._src.length && /[0-9.]/.test(this._src[this._pos]); ) this._pos++;
    const t = this._src.slice(e, this._pos);
    if (!t) throw new SyntaxError(`FormulaEngine: 숫자 또는 [필드]를 기대했지만 '${this._src[this._pos] ?? "EOF"}' 발견 (위치 ${e})`);
    return v.from(t);
  }
  _skip() {
    for (; this._pos < this._src.length && /\s/.test(this._src[this._pos]); ) this._pos++;
  }
}
function Ge(r, e) {
  if (r == null || r === "") return r ?? "";
  const t = typeof e == "string" ? { type: e } : e, s = t.char ?? "*";
  switch (t.type) {
    case "ssn":
      return Ws(r, s);
    case "phone":
    case "mobile":
      return Ks(r, s);
    case "email":
      return Us(r, s);
    case "credit":
      return js(r, s);
    case "account":
      return qs(r, s, t.visiblePrefix ?? 3, t.visibleSuffix ?? 4);
    case "password":
      return s.repeat(Math.max(r.length, 6));
    case "name":
      return Gs(r, s);
    case "ip":
      return Ys(r, s);
    case "partial":
      return Se(r, s, t.visiblePrefix ?? 0, t.visibleSuffix ?? 4);
    default:
      return r;
  }
}
function Ws(r, e) {
  const t = r.replace(/[^0-9]/g, "");
  if (t.length < 7) {
    const n = r.includes("-") ? "-" : "", a = r.indexOf("-") >= 0 ? r.indexOf("-") : 6;
    return r.slice(0, a) + n + e.repeat(Math.max(1, r.length - a - n.length));
  }
  const s = t.slice(0, 6), i = t[6], o = t.length - 7;
  return `${s}-${i}${e.repeat(o)}`;
}
function Ks(r, e) {
  const t = r.replace(/[^0-9]/g, "");
  return t.length === 11 ? `${t.slice(0, 3)}-${e.repeat(4)}-${t.slice(7)}` : t.length === 10 ? t.startsWith("02") ? `${t.slice(0, 2)}-${e.repeat(4)}-${t.slice(6)}` : `${t.slice(0, 3)}-${e.repeat(3)}-${t.slice(6)}` : t.length === 9 ? `${t.slice(0, 2)}-${e.repeat(3)}-${t.slice(5)}` : Se(r, e, 3, 4);
}
function Us(r, e) {
  const t = r.indexOf("@");
  if (t < 0) return Se(r, e, 2, 0);
  const s = r.slice(0, t), i = r.slice(t), o = Math.min(2, s.length), n = s.slice(0, o), a = Math.max(s.length - o, 3);
  return `${n}${e.repeat(a)}${i}`;
}
function js(r, e) {
  const t = r.replace(/[^0-9]/g, "");
  if (t.length < 8) return r;
  const s = t.slice(0, 4), i = t.slice(-4), o = t.length - 8, n = e.repeat(Math.max(o, 8)), a = [s];
  for (let l = 0; l < n.length; l += 4) {
    const d = n.slice(l, l + 4);
    d && a.push(d);
  }
  return a.push(i), a.join("-");
}
function qs(r, e, t, s) {
  const i = r.replace(/[^0-9]/g, "");
  if (i.length <= t + s) return Se(i, e, t, s);
  const o = i.slice(0, t), n = i.slice(-s), a = i.length - t - s;
  return `${o}-${e.repeat(a)}-${n}`;
}
function Gs(r, e) {
  const t = r.trim();
  return t.length === 0 ? r : t.length === 1 ? e : t.length === 2 ? `${t[0]}${e}` : `${t[0]}${e.repeat(t.length - 2)}${t[t.length - 1]}`;
}
function Ys(r, e) {
  const t = r.split(".");
  if (t.length !== 4) return Se(r, e, 3, 0);
  const s = (i) => e.repeat(Math.max(i.length, 3));
  return `${t[0]}.${t[1]}.${s(t[2])}.${s(t[3])}`;
}
function Se(r, e, t, s) {
  if (r.length <= t + s) return r;
  const i = r.slice(0, t), o = s > 0 ? r.slice(-s) : "", n = r.length - t - s;
  return `${i}${e.repeat(n)}${o}`;
}
const Xs = "#e0e0e0";
class ze {
  constructor(e = "default", t = "default") {
    this.theme = e, this.skin = t;
  }
}
class Ye {
  constructor(e = new ze()) {
    this._ctx = e;
  }
  get context() {
    return this._ctx;
  }
  _skinActive() {
    return this._ctx.skin !== "default";
  }
  setSkin(e) {
    this._ctx = new ze(this._ctx.theme, e);
  }
  _borderColorVar() {
    return `var(--og-border-color,${Xs})`;
  }
  border(e) {
    let t = (e == null ? void 0 : e.style) ?? "solid";
    if ((e == null ? void 0 : e.state) && (t = "solid"), this._skinActive()) {
      const s = "var(--og-border-width, 1px)", i = (e == null ? void 0 : e.state) ? "solid" : `var(--og-border-style, ${t})`;
      return `${s} ${i} ${this._borderColorVar()}`;
    }
    return `1px ${t} ${this._borderColorVar()}`;
  }
  divider() {
    return this._skinActive() ? `var(--og-border-width, 1px) var(--og-divider-style, solid) ${this._borderColorVar()}` : this.border();
  }
  texture(e) {
    return e === "data" || e === "status" || e === "range" || e === "merge" || e === "focus" ? "none" : "var(--og-texture-bg, none)";
  }
  radius(e) {
    return `${e}px`;
  }
  cellPadding() {
    return "2px 8px";
  }
  elevation(e = "md") {
    const t = { sm: "0 1px 2px", md: "0 2px 6px", lg: "0 8px 24px" }, s = { sm: "0.07", md: "0.10", lg: "0.14" };
    return `var(--og-elevation-${e}, ${t[e]}) rgba(var(--og-shadow-ink, 0 0 0), var(--og-elevation-alpha-${e}, ${s[e]}))`;
  }
  focusRing(e) {
    let t = (e == null ? void 0 : e.width) ?? 2, s = (e == null ? void 0 : e.style) ?? "solid";
    t < 2 && (t = 2), s === "none" && (s = "solid");
    const i = (e == null ? void 0 : e.color) ?? "var(--og-focus-border,var(--og-primary,#1976d2))";
    return this._skinActive() && (e == null ? void 0 : e.width) === void 0 && (e == null ? void 0 : e.style) === void 0 ? `var(--og-focus-width, 2px) var(--og-focus-style, solid) ${i}` : `${t}px ${s} ${i}`;
  }
}
const ye = new Ye(), Zs = "0 0 16 16", Xe = { "sort-up": '<path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.5.5 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>', "sort-down": '<path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>', "chevron-expand": '<path fill-rule="evenodd" d="M3.646 9.146a.5.5 0 0 1 .708 0L8 12.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708m0-2.292a.5.5 0 0 0 .708 0L8 3.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708"/>', funnel: '<path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2z"/>', "funnel-fill": '<path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>', filter: '<path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>', search: '<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>', "chevron-left": '<path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>', "chevron-right": '<path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>', "chevron-up": '<path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>', "chevron-down": '<path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>', "chevron-double-left": '<path fill-rule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/><path fill-rule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>', "chevron-double-right": '<path fill-rule="evenodd" d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708"/><path fill-rule="evenodd" d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708"/>', "arrow-up": '<path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/>', "arrow-down": '<path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"/>', "arrow-left": '<path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>', "arrow-right": '<path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>', "arrow-clockwise": '<path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>', "plus-lg": '<path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>', "plus-circle": '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>', trash3: '<path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>', "grip-vertical": '<path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>', "grip-horizontal": '<path d="M2 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2m0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>', "pin-angle": '<path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146m.122 2.112v-.002zm0-.002v.002a.5.5 0 0 1-.122.51L6.293 6.878a.5.5 0 0 1-.511.12H5.78l-.014-.004a5 5 0 0 0-.288-.076 5 5 0 0 0-.765-.116c-.422-.028-.836.008-1.175.15l5.51 5.509c.141-.34.177-.753.149-1.175a5 5 0 0 0-.192-1.054l-.004-.013v-.001a.5.5 0 0 1 .12-.512l3.536-3.535a.5.5 0 0 1 .532-.115l.096.022c.087.017.208.034.344.034q.172.002.343-.04L9.927 2.028q-.042.172-.04.343a1.8 1.8 0 0 0 .062.46z"/>', "pin-angle-fill": '<path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146"/>', eye: '<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>', "eye-slash": '<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/><path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>', pencil: '<path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>', "check-lg": '<path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>', "x-lg": '<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>', clipboard: '<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>', "clipboard-check": '<path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>', eraser: '<path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"/>', square: '<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>', "check-square": '<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>', "dash-square": '<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>', "check-all": '<path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z"/>', "filetype-csv": '<path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM3.517 14.841a1.13 1.13 0 0 0 .401.823q.195.162.478.252.284.091.665.091.507 0 .859-.158.354-.158.539-.44.187-.284.187-.656 0-.336-.134-.56a1 1 0 0 0-.375-.357 2 2 0 0 0-.566-.21l-.621-.144a1 1 0 0 1-.404-.176.37.37 0 0 1-.144-.299q0-.234.185-.384.188-.152.512-.152.214 0 .37.068a.6.6 0 0 1 .246.181.56.56 0 0 1 .12.258h.75a1.1 1.1 0 0 0-.2-.566 1.2 1.2 0 0 0-.5-.41 1.8 1.8 0 0 0-.78-.152q-.439 0-.776.15-.337.149-.527.421-.19.273-.19.639 0 .302.122.524.124.223.352.367.228.143.539.213l.618.144q.31.073.463.193a.39.39 0 0 1 .152.326.5.5 0 0 1-.085.29.56.56 0 0 1-.255.193q-.167.07-.413.07-.175 0-.32-.04a.8.8 0 0 1-.248-.115.58.58 0 0 1-.255-.384zM.806 13.693q0-.373.102-.633a.87.87 0 0 1 .302-.399.8.8 0 0 1 .475-.137q.225 0 .398.097a.7.7 0 0 1 .272.26.85.85 0 0 1 .12.381h.765v-.072a1.33 1.33 0 0 0-.466-.964 1.4 1.4 0 0 0-.489-.272 1.8 1.8 0 0 0-.606-.097q-.534 0-.911.223-.375.222-.572.632-.195.41-.196.979v.498q0 .568.193.976.197.407.572.626.375.217.914.217.439 0 .785-.164t.55-.454a1.27 1.27 0 0 0 .226-.674v-.076h-.764a.8.8 0 0 1-.118.363.7.7 0 0 1-.272.25.9.9 0 0 1-.401.087.85.85 0 0 1-.478-.132.83.83 0 0 1-.299-.392 1.7 1.7 0 0 1-.102-.627zm8.239 2.238h-.953l-1.338-3.999h.917l.896 3.138h.038l.888-3.138h.879z"/>', "filetype-xlsx": '<path fill-rule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM7.86 14.841a1.13 1.13 0 0 0 .401.823q.195.162.479.252.284.091.665.091.507 0 .858-.158.355-.158.54-.44a1.17 1.17 0 0 0 .187-.656q0-.336-.135-.56a1 1 0 0 0-.375-.357 2 2 0 0 0-.565-.21l-.621-.144a1 1 0 0 1-.405-.176.37.37 0 0 1-.143-.299q0-.234.184-.384.188-.152.513-.152.214 0 .37.068a.6.6 0 0 1 .245.181.56.56 0 0 1 .12.258h.75a1.1 1.1 0 0 0-.199-.566 1.2 1.2 0 0 0-.5-.41 1.8 1.8 0 0 0-.78-.152q-.44 0-.777.15-.336.149-.527.421-.19.273-.19.639 0 .302.123.524t.351.367q.229.143.54.213l.618.144q.31.073.462.193a.39.39 0 0 1 .153.326.5.5 0 0 1-.085.29.56.56 0 0 1-.255.193q-.168.07-.413.07-.176 0-.32-.04a.8.8 0 0 1-.249-.115.58.58 0 0 1-.255-.384zm-3.726-2.909h.893l-1.274 2.007 1.254 1.992h-.908l-.85-1.415h-.035l-.853 1.415H1.5l1.24-2.016-1.228-1.983h.931l.832 1.438h.036zm1.923 3.325h1.697v.674H5.266v-3.999h.791zm7.636-3.325h.893l-1.274 2.007 1.254 1.992h-.908l-.85-1.415h-.035l-.853 1.415h-.861l1.24-2.016-1.228-1.983h.931l.832 1.438h.036z"/>', "filetype-pdf": '<path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1.6 11.85H0v3.999h.791v-1.342h.803q.43 0 .732-.173.305-.175.463-.474a1.4 1.4 0 0 0 .161-.677q0-.375-.158-.677a1.2 1.2 0 0 0-.46-.477q-.3-.18-.732-.179m.545 1.333a.8.8 0 0 1-.085.38.57.57 0 0 1-.238.241.8.8 0 0 1-.375.082H.788V12.48h.66q.327 0 .512.181.185.183.185.522m1.217-1.333v3.999h1.46q.602 0 .998-.237a1.45 1.45 0 0 0 .595-.689q.196-.45.196-1.084 0-.63-.196-1.075a1.43 1.43 0 0 0-.589-.68q-.396-.234-1.005-.234zm.791.645h.563q.371 0 .609.152a.9.9 0 0 1 .354.454q.118.302.118.753a2.3 2.3 0 0 1-.068.592 1.1 1.1 0 0 1-.196.422.8.8 0 0 1-.334.252 1.3 1.3 0 0 1-.483.082h-.563zm3.743 1.763v1.591h-.79V11.85h2.548v.653H7.896v1.117h1.606v.638z"/>', "filetype-json": '<path fill-rule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM4.151 15.29a1.2 1.2 0 0 1-.111-.449h.764a.58.58 0 0 0 .255.384q.105.073.25.114.142.041.319.041.245 0 .413-.07a.56.56 0 0 0 .255-.193.5.5 0 0 0 .084-.29.39.39 0 0 0-.152-.326q-.152-.12-.463-.193l-.618-.143a1.7 1.7 0 0 1-.539-.214 1 1 0 0 1-.352-.367 1.1 1.1 0 0 1-.123-.524q0-.366.19-.639.192-.272.528-.422.337-.15.777-.149.456 0 .779.152.326.153.5.41.18.255.2.566h-.75a.56.56 0 0 0-.12-.258.6.6 0 0 0-.246-.181.9.9 0 0 0-.37-.068q-.324 0-.512.152a.47.47 0 0 0-.185.384q0 .18.144.3a1 1 0 0 0 .404.175l.621.143q.326.075.566.211a1 1 0 0 1 .375.358q.135.222.135.56 0 .37-.188.656a1.2 1.2 0 0 1-.539.439q-.351.158-.858.158-.381 0-.665-.09a1.4 1.4 0 0 1-.478-.252 1.1 1.1 0 0 1-.29-.375m-3.104-.033a1.3 1.3 0 0 1-.082-.466h.764a.6.6 0 0 0 .074.27.5.5 0 0 0 .454.246q.285 0 .422-.164.137-.165.137-.466v-2.745h.791v2.725q0 .66-.357 1.005-.355.345-.985.345a1.6 1.6 0 0 1-.568-.094 1.15 1.15 0 0 1-.407-.266 1.1 1.1 0 0 1-.243-.39m9.091-1.585v.522q0 .384-.117.641a.86.86 0 0 1-.322.387.9.9 0 0 1-.47.126.9.9 0 0 1-.47-.126.87.87 0 0 1-.32-.387 1.55 1.55 0 0 1-.117-.641v-.522q0-.386.117-.641a.87.87 0 0 1 .32-.387.87.87 0 0 1 .47-.129q.265 0 .47.129a.86.86 0 0 1 .322.387q.117.255.117.641m.803.519v-.513q0-.565-.205-.973a1.46 1.46 0 0 0-.59-.63q-.38-.22-.916-.22-.534 0-.92.22a1.44 1.44 0 0 0-.589.628q-.205.407-.205.975v.513q0 .562.205.973.205.407.589.626.386.217.92.217.536 0 .917-.217.384-.22.589-.626.204-.41.205-.973m1.29-.935v2.675h-.746v-3.999h.662l1.752 2.66h.032v-2.66h.75v4h-.656l-1.761-2.676z"/>', printer: '<path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/><path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1"/>', download: '<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>', upload: '<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>', table: '<path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 2h-4v3h4zm0 4h-4v3h4zm0 4h-4v3h3a1 1 0 0 0 1-1zm-5 3v-3H6v3zm-5 0v-3H1v2a1 1 0 0 0 1 1zm-4-4h4V8H1zm0-4h4V4H1zm5-3v3h4V4zm4 4H6v3h4z"/>', "bar-chart": '<path d="M4 11H2v3h2zm5-4H7v7h2zm5-5v12h-2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"/>', "graph-up": '<path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>', "pie-chart": '<path d="M7.5 1.018a7 7 0 0 0-4.79 11.566L7.5 7.793zm1 0V7.5h6.482A7 7 0 0 0 8.5 1.018M14.982 8.5H8.207l-4.79 4.79A7 7 0 0 0 14.982 8.5M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8"/>', "check-circle-fill": '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>', "exclamation-triangle-fill": '<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>', "x-circle-fill": '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>', "info-circle": '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>', "lock-fill": '<path fill-rule="evenodd" d="M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4m0 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3"/>', unlock: '<path fill-rule="evenodd" d="M12 0a4 4 0 0 1 4 4v2.5h-1V4a3 3 0 1 0-6 0v2h.5A2.5 2.5 0 0 1 12 8.5v5A2.5 2.5 0 0 1 9.5 16h-7A2.5 2.5 0 0 1 0 13.5v-5A2.5 2.5 0 0 1 2.5 6H8V4a4 4 0 0 1 4-4M2.5 7A1.5 1.5 0 0 0 1 8.5v5A1.5 1.5 0 0 0 2.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 9.5 7z"/>', asterisk: '<path d="M8 0a1 1 0 0 1 1 1v5.268l4.562-2.634a1 1 0 1 1 1 1.732L10 8l4.562 2.634a1 1 0 1 1-1 1.732L9 9.732V15a1 1 0 1 1-2 0V9.732l-4.562 2.634a1 1 0 1 1-1-1.732L6 8 1.438 5.366a1 1 0 0 1 1-1.732L7 6.268V1a1 1 0 0 1 1-1"/>', calculator: '<path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M4 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>', gear: '<path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>', list: '<path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>', "three-dots-vertical": '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>', "three-dots": '<path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>', plus: '<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>', dash: '<path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>', "question-circle": '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>', "eye-reveal": '<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8z"/><path d="M8 5.5A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5zm0 4A1.5 1.5 0 1 1 8 6.5a1.5 1.5 0 0 1 0 3z" fill="#fff"/>' };
Object.keys(Xe).length;
const Ct = { "sort.asc": "sort-up", "sort.desc": "sort-down", "sort.none": "chevron-expand", filter: "funnel", "filter.active": "funnel-fill", search: "search", "row.add": "plus-lg", "row.delete": "trash3", delete: "trash3", "row.drag": "grip-vertical", "column.drag": "grip-horizontal", expand: "chevron-right", collapse: "chevron-down", "tree.expand": "chevron-right", "tree.collapse": "chevron-down", "mask.reveal": "eye-reveal", "mask.show": "eye", "mask.hide": "eye-slash", "export.excel": "filetype-xlsx", "export.csv": "filetype-csv", "export.pdf": "filetype-pdf", "export.json": "filetype-json", export: "download", import: "upload", print: "printer", table: "table", edit: "pencil", copy: "clipboard", paste: "clipboard-check", clear: "eraser", check: "check-lg", close: "x-lg", add: "plus", remove: "dash", "select.all": "check-all", "select.none": "square", "select.check": "check-square", "select.indeterminate": "dash-square", pin: "pin-angle", "pin.active": "pin-angle-fill", "status.error": "x-circle-fill", "status.warning": "exclamation-triangle-fill", "status.success": "check-circle-fill", "status.info": "info-circle", "status.lock": "lock-fill", "status.unlock": "unlock", required: "asterisk", chart: "bar-chart", "chart.bar": "bar-chart", "chart.line": "graph-up", "chart.pie": "pie-chart", formula: "calculator", "nav.first": "chevron-double-left", "nav.prev": "chevron-left", "nav.next": "chevron-right", "nav.last": "chevron-double-right", "nav.up": "arrow-up", "nav.down": "arrow-down", refresh: "arrow-clockwise", menu: "list", more: "three-dots-vertical", "more.horizontal": "three-dots", settings: "gear", help: "question-circle" }, Qs = "";
function Js(r) {
  return r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
class qe {
  constructor(e, t) {
    if (this._roles = /* @__PURE__ */ new Map(), this._parent = t, e) for (const [s, i] of Object.entries(e)) this.register(s, i);
  }
  register(e, t) {
    const s = Object.prototype.hasOwnProperty.call(Xe, t) ? Xe[t] : t;
    return this._roles.set(e, s), this;
  }
  has(e) {
    var _a;
    return this._roles.has(e) || (((_a = this._parent) == null ? void 0 : _a.has(e)) ?? false);
  }
  resolveBody(e) {
    const t = this._roles.get(e);
    return t !== void 0 ? t : this._parent ? this._parent.resolveBody(e) : null;
  }
  child() {
    return new qe(void 0, this);
  }
  render(e, t) {
    const s = this.resolveBody(e) ?? Qs, i = t == null ? void 0 : t.size, o = i != null ? ` width="${i}" height="${i}"` : "", n = t == null ? void 0 : t.title, a = n ? `<title>${Js(n)}</title>` : "", d = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${Zs}"${o} fill="currentColor"${n ? ' role="img"' : ""} style="stroke-linejoin:var(--og-icon-corner, miter)">${a}${s}</svg>`;
    return (t == null ? void 0 : t.el) ? new DOMParser().parseFromString(d, "image/svg+xml").documentElement : d;
  }
  roles() {
    return [...this._roles.keys()];
  }
}
const ge = new qe(Ct);
function ei(r, e) {
  return ge.render(r, e);
}
function ve(r, e, t) {
  return r.t ? r.t(e, t) : B(e, t);
}
function Rt(r) {
  if (r.hasCellFormula) return null;
  const e = r.column;
  if (!e.formula) return null;
  const t = e.formulaPrecision ?? 30;
  try {
    let s;
    return typeof e.formula == "function" ? s = e.formula(r.row, v) : s = xt(e.formula, r.row, t), s instanceof v ? e.precision != null ? s.toFixed(e.precision) : s.toString() : typeof s == "string" ? s : e.precision != null ? v.from(s).toFixed(e.precision) : String(s);
  } catch (s) {
    return console.warn("[OpenGrid] Formula error:", s), "#ERR";
  }
}
function ti(r, e, t, s, i, o) {
  if (r == null || r === "") return "";
  let n = Number(r);
  if (isNaN(n)) return String(r);
  if (t != null && (n = Ns(n, t)), s) try {
    return new Intl.NumberFormat(void 0, { style: "currency", currency: s, ...t != null ? { minimumFractionDigits: t, maximumFractionDigits: t } : {} }).format(n);
  } catch {
  }
  if (!e) return t != null ? n.toFixed(t) : String(n);
  const a = e.indexOf(";"), l = a >= 0 ? e.slice(a + 1) : null, d = n < 0 && l != null ? l : a >= 0 ? e.slice(0, a) : e, c = n < 0 && l != null ? Math.abs(n) : n, h = d.match(/[#0][#0,]*(?:\.[#0]+)?/);
  if (!h) return String(n);
  const u = h[0], g = d.slice(0, h.index), p = d.slice(h.index + u.length), f = u.includes(","), m = u.includes(".") ? u.split(".")[1].length : t ?? 0, _ = c.toLocaleString("ko-KR", { minimumFractionDigits: m, maximumFractionDigits: m, useGrouping: f });
  return g + _ + p;
}
function Mt(r, e = "yyyy-MM-dd", t, s) {
  if (!r) return "";
  const i = r instanceof Date ? r : new Date(r);
  if (isNaN(i.getTime())) return String(r);
  const o = i.getFullYear(), n = String(i.getMonth() + 1).padStart(2, "0"), a = String(i.getDate()).padStart(2, "0");
  return e.replace("yyyy", String(o)).replace("MM", n).replace("dd", a);
}
function si(r, e, t, s) {
  const i = Ge(r, e.mask), o = document.createElement("span");
  o.style.cssText = "display:flex;align-items:center;gap:3px;overflow:hidden;width:100%;box-sizing:border-box;";
  const n = document.createElement("span");
  n.style.cssText = "flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;letter-spacing:0.4px;color:var(--og-mask-text,#888);", n.textContent = i;
  const a = document.createElement("button");
  return a.title = ve(s, "cell.revealTooltip"), a.setAttribute("aria-label", ve(s, "cell.revealAria")), a.innerHTML = ge.render("mask.reveal", { size: 13 }), a.style.cssText = `flex-shrink:0;background:none;border:none;cursor:pointer;color:#c0c0c0;padding:1px 2px;line-height:0;border-radius:${ye.radius(3)};display:flex;align-items:center;`, a.addEventListener("mouseover", () => {
    a.style.color = "var(--og-primary,#1976d2)", a.style.background = "rgba(25,118,210,0.08)";
  }), a.addEventListener("mouseout", () => {
    a.style.color = "#c0c0c0", a.style.background = "none";
  }), a.addEventListener("click", (l) => {
    l.stopPropagation(), n.textContent = r, n.style.fontFamily = "", n.style.letterSpacing = "", n.style.color = "", a.remove(), (e._maskRevealedRows ?? (e._maskRevealedRows = /* @__PURE__ */ new Set())).add(t);
  }), o.appendChild(n), o.appendChild(a), o;
}
class be {
  render(e) {
    var _a;
    const t = document.createElement("span");
    t.className = "og-cell-text";
    const s = Rt(e);
    if (s !== null) return t.textContent = s, t.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;", t;
    const { value: i, column: o, rowIndex: n } = e;
    if (e.displayValue != null) return t.textContent = e.displayValue, t.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;", t;
    let a;
    if (o.valueMap && i != null && o.valueMap[i] ? a = o.valueMap[i] : a = i == null ? "" : String(i), o.mask) {
      const l = o._maskRevealed === true, d = ((_a = o._maskRevealedRows) == null ? void 0 : _a.has(n)) === true;
      if (!l && !d) return si(a, o, n, e);
    }
    return t.textContent = a, t.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;", t;
  }
}
class ii {
  constructor(e = [], t) {
    this._opts = e.map((s) => typeof s == "string" ? { label: s, value: s } : { label: s.label ?? s.text ?? String(s.value ?? ""), value: s.value }), this._fn = t ?? null;
  }
  render(e) {
    const t = document.createElement("span");
    t.className = "og-cell-text", t.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;";
    const s = e.value;
    if (s == null || s === "") return t;
    const i = String(s), n = (this._fn ? this._fn(e.row, e.rowIndex).map((a) => typeof a == "string" ? { label: a, value: a } : { label: a.label ?? a.text ?? String(a.value ?? ""), value: a.value }) : this._opts).find((a) => String(a.value) === i);
    return t.textContent = n ? n.label : i, t;
  }
}
class oi {
  render(e) {
    const t = document.createElement("span");
    t.className = "og-cell-number";
    const s = Rt(e);
    if (s !== null) return t.textContent = s, t.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;width:100%;text-align:right;", t;
    if (e.displayFormatter) {
      const i = e.displayFormatter(e.value, e.column.field ?? "", e.row);
      if (i != null) return t.textContent = i, t.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;width:100%;text-align:right;", t;
    }
    return t.textContent = ti(e.value, e.column.format ?? "#,##0", e.column.precision, e.column.currency, e.column.field, e.row), t.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;width:100%;text-align:right;", t;
  }
}
class ri {
  render(e) {
    const t = document.createElement("span");
    t.className = "og-cell-date";
    const s = e.displayFormatter ? e.displayFormatter(e.value, e.column.field ?? "", e.row) : null;
    return s != null ? t.textContent = s : t.textContent = Mt(e.value, e.column.format, e.column.field, e.row), t.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;", t;
  }
}
class kt {
  render(e) {
    const t = document.createElement("span");
    t.className = "og-cell-checkbox", t.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;";
    const s = document.createElement("input");
    return s.type = "checkbox", s.checked = !!e.value, s.disabled = true, s.style.cssText += "cursor:pointer;pointer-events:none;", t.appendChild(s), t;
  }
}
class ni {
  constructor(e) {
    this.def = e;
  }
  render(e) {
    var _a, _b, _c, _d;
    const t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;";
    const s = document.createElement("button");
    s.className = `og-cell-btn${((_a = this.def) == null ? void 0 : _a.buttonClass) ? " " + this.def.buttonClass : ""}`;
    const i = (_b = this.def) == null ? void 0 : _b.label, o = typeof i == "function" ? i(e.value, e.row) : i ?? String(e.value ?? "btn");
    if (s.style.cssText = `
      padding:2px 10px;border:1px solid var(--og-primary,#1976d2);
      border-radius:4px;background:var(--og-row-bg,#fff);color:var(--og-primary,#1976d2);
      cursor:pointer;font-size:12px;white-space:nowrap;transition:background 0.12s;
      ${((_c = this.def) == null ? void 0 : _c.style) ?? ""}
    `, (_d = this.def) == null ? void 0 : _d.icon) {
      s.style.display = "inline-flex", s.style.alignItems = "center", s.style.gap = "4px";
      const n = document.createElement("span");
      n.style.cssText = "display:inline-flex;flex-shrink:0;", n.innerHTML = ge.render(this.def.icon, { size: 13 });
      const a = document.createElement("span");
      a.textContent = o, this.def.iconPos === "right" ? (s.appendChild(a), s.appendChild(n)) : (s.appendChild(n), s.appendChild(a));
    } else s.textContent = o;
    return s.addEventListener("mouseover", () => s.style.background = "var(--og-primary-light,#e3f2fd)"), s.addEventListener("mouseout", () => s.style.background = "var(--og-row-bg,#fff)"), t.appendChild(s), t;
  }
}
class ai {
  constructor(e, t) {
    this.colorMap = e, this.labelMap = t;
  }
  render(e) {
    var _a, _b, _c;
    const t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;height:100%;";
    const s = document.createElement("span"), i = e.value == null ? "" : String(e.value), o = ((_a = this.labelMap) == null ? void 0 : _a[i]) ?? ((_b = e.column.valueMap) == null ? void 0 : _b[i]) ?? i;
    s.textContent = o;
    const n = ((_c = this.colorMap) == null ? void 0 : _c[i]) ?? "#666";
    return s.style.cssText = `
      display:inline-block;padding:2px 8px;border-radius:${ye.radius(12)};font-size:11px;
      background:${n}22;color:${n};border:1px solid ${n}66;
      white-space:nowrap;
    `, t.appendChild(s), t;
  }
}
class li {
  constructor(e, t) {
    this.hrefFn = e, this.target = t;
  }
  render(e) {
    const t = document.createElement("a");
    return t.className = "og-cell-link", t.textContent = e.value == null ? "" : String(e.value), t.href = this.hrefFn ? this.hrefFn(e.value, e.row) : "#", this.target && (t.target = this.target), t.style.cssText = "color:var(--og-primary,#1976d2);text-decoration:underline;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;", this.hrefFn || t.addEventListener("click", (s) => s.preventDefault()), t;
  }
}
class di {
  constructor(e) {
    this.templateFn = e;
  }
  render(e) {
    const t = document.createElement("div");
    return t.className = "og-cell-template", t.style.cssText = "display:flex;align-items:center;height:100%;overflow:hidden;", t.innerHTML = this.templateFn(e.value, e.row, e.rowIndex), t;
  }
}
class ci {
  constructor(e) {
    this.def = e;
  }
  render(e) {
    var _a, _b, _c, _d, _e2;
    const t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;";
    const s = document.createElement("img"), i = ((_a = this.def) == null ? void 0 : _a.srcFn) ? this.def.srcFn(e.value, e.row) : String(e.value ?? "");
    s.src = i;
    const o = ((_b = this.def) == null ? void 0 : _b.width) ?? 28, n = ((_c = this.def) == null ? void 0 : _c.height) ?? 28, a = ((_d = this.def) == null ? void 0 : _d.radius) ?? 4;
    s.style.cssText = `width:${o}px;height:${n}px;object-fit:cover;border-radius:${ye.radius(a)};display:block;`;
    const l = (_e2 = this.def) == null ? void 0 : _e2.alt;
    return s.alt = typeof l == "function" ? l(e.value, e.row) : l ?? "", s.onerror = () => {
      s.style.display = "none";
    }, t.appendChild(s), t;
  }
}
class hi {
  constructor(e) {
    this.def = e;
  }
  render(e) {
    var _a, _b, _c, _d;
    const t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;gap:5px;width:100%;padding:0 4px;box-sizing:border-box;";
    const s = ((_a = this.def) == null ? void 0 : _a.max) ?? 100, i = Number(e.value) || 0, o = Math.min(100, Math.max(0, i / s * 100)), n = ((_b = this.def) == null ? void 0 : _b.colorFn) ? this.def.colorFn(i) : ((_c = this.def) == null ? void 0 : _c.color) ?? "var(--og-primary,#1976d2)", a = document.createElement("div");
    a.className = "og-progress-track", a.style.cssText = `flex:1;height:10px;background:#e0e0e0;border-radius:${ye.radius(5)};overflow:hidden;`;
    const l = document.createElement("div");
    if (l.className = "og-progress-fill", l.style.cssText = `width:${o}%;height:100%;background:${n};border-radius:${ye.radius(5)};`, a.appendChild(l), t.appendChild(a), ((_d = this.def) == null ? void 0 : _d.showLabel) !== false) {
      const d = document.createElement("span");
      d.style.cssText = "font-size:11px;color:#666;white-space:nowrap;min-width:28px;text-align:right;", d.textContent = `${Math.round(o)}%`, t.appendChild(d);
    }
    return t;
  }
}
class ui {
  constructor(e) {
    this.def = e;
  }
  render(e) {
    var _a, _b, _c, _d;
    const t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;";
    const s = Array.isArray(e.value) ? e.value.map(Number) : [];
    if (!s.length) return t.textContent = "-", t;
    const i = ((_a = this.def) == null ? void 0 : _a.width) ?? 80, o = ((_b = this.def) == null ? void 0 : _b.height) ?? 22, n = ((_c = this.def) == null ? void 0 : _c.color) ?? "#1976d2", a = ((_d = this.def) == null ? void 0 : _d.chartType) ?? "bar", l = document.createElement("canvas");
    l.width = i, l.height = o, l.style.cssText = "display:block;";
    const d = l.getContext("2d");
    if (d) {
      const c = Math.max(...s, 1), h = Math.min(...s, 0), u = c - h || 1, g = s.length;
      if (a === "bar") {
        const p = i / g;
        s.forEach((f, m) => {
          const _ = (f - h) / u * (o - 2);
          d.fillStyle = n, d.fillRect(m * p + 1, o - _ - 1, p - 2, _);
        });
      } else {
        const p = s.map((f, m) => ({ x: m / (g - 1 || 1) * i, y: o - (f - h) / u * (o - 4) - 2 }));
        a === "area" && (d.fillStyle = n + "33", d.beginPath(), d.moveTo(p[0].x, o), p.forEach((f) => d.lineTo(f.x, f.y)), d.lineTo(p[p.length - 1].x, o), d.closePath(), d.fill()), d.strokeStyle = n, d.lineWidth = 1.5, d.beginPath(), p.forEach((f, m) => m === 0 ? d.moveTo(f.x, f.y) : d.lineTo(f.x, f.y)), d.stroke();
      }
    }
    return t.appendChild(l), t;
  }
}
class pi {
  render(e) {
    const t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;";
    const s = !!e.value, i = document.createElement("span");
    i.className = "og-switch" + (s ? " og-switch--on" : ""), i.style.cssText = `display:inline-block;width:34px;height:18px;border-radius:${ye.radius(9)};
      background:${s ? "var(--og-primary,#1976d2)" : "#bdbdbd"};
      position:relative;transition:background 0.2s;cursor:pointer;flex-shrink:0;pointer-events:none;`;
    const o = document.createElement("span");
    return o.style.cssText = `position:absolute;top:2px;left:${s ? "16px" : "2px"};
      width:14px;height:14px;border-radius:50%;background:#fff;
      transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);`, i.appendChild(o), t.appendChild(i), t;
  }
}
class gi {
  constructor(e) {
    this.def = e;
  }
  render(e) {
    var _a, _b;
    const t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;gap:1px;height:100%;";
    const s = ((_a = this.def) == null ? void 0 : _a.max) ?? 5, i = Math.round(Number(e.value) || 0), o = ((_b = this.def) == null ? void 0 : _b.color) ?? "#ffa000";
    for (let n = 1; n <= s; n++) {
      const a = document.createElement("span");
      a.textContent = "★", a.style.cssText = `font-size:14px;color:${n <= i ? o : "#e0e0e0"};line-height:1;`, t.appendChild(a);
    }
    return t;
  }
}
class fi {
  render(e) {
    const t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;pointer-events:none;";
    const s = document.createElement("input");
    return s.type = "radio", s.checked = !!e.value, s.setAttribute("aria-checked", e.value ? "true" : "false"), s.setAttribute("aria-label", e.column.header ?? ve(e, "cell.radioAria")), e.column.group && (s.name = `og-radio-${e.rowIndex}-${e.column.group}`), s.style.cssText = "width:14px;height:14px;cursor:pointer;accent-color:var(--og-primary,#1976d2);", t.appendChild(s), t;
  }
}
class _i {
  render(e) {
    const t = document.createElement("span");
    if (t.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;overflow:hidden;", !e.value) return t;
    const s = document.createElement("img");
    return s.src = String(e.value), s.alt = e.column.alt ?? e.column.field, s.style.cssText = "max-width:100%;max-height:100%;object-fit:contain;display:block;", s.setAttribute("role", "img"), t.appendChild(s), t;
  }
}
function mi(r) {
  const e = document.createElement("div");
  return e.innerHTML = r, e.querySelectorAll("script,iframe,object,embed").forEach((t) => t.remove()), e.querySelectorAll("*").forEach((t) => {
    for (const s of [...t.attributes]) s.name.startsWith("on") && t.removeAttribute(s.name);
    if (t.tagName === "A") {
      const s = t.getAttribute("href") ?? "";
      /^javascript:/i.test(s) && t.removeAttribute("href");
    }
  }), e.innerHTML;
}
class wi {
  render(e) {
    const t = document.createElement("span");
    t.style.cssText = "display:block;overflow:hidden;width:100%;";
    const s = e.column.sanitize !== false, i = String(e.value ?? "");
    return t.innerHTML = s ? mi(i) : i, t;
  }
}
const yi = ["212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412", "211214", "211232"], vi = "2331112";
function Et(r) {
  let e = "", t = true;
  for (const s of r) e += (t ? "1" : "0").repeat(+s), t = !t;
  return e;
}
function bi(r) {
  const e = [104];
  for (const s of r) {
    const i = s.charCodeAt(0) - 32;
    i >= 0 && i <= 94 && e.push(i);
  }
  let t = 104;
  for (let s = 1; s < e.length; s++) t += e[s] * s;
  return e.push(t % 103), e.map((s) => Et(yi[s])).join("") + Et(vi) + "11";
}
class xi {
  render(e) {
    const t = String(e.value ?? ""), s = e.column.barcodeHeight ?? 28, i = document.createElement("div");
    i.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;overflow:hidden;gap:1px;", i.setAttribute("role", "img"), i.setAttribute("aria-label", ve(e, "cell.barcodeAria", { value: t })), i.innerHTML = Ci(t, s);
    const o = document.createElement("span");
    return o.textContent = t, o.style.cssText = "font-size:9px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;", i.appendChild(o), i;
  }
}
function Ci(r, e) {
  if (!r) return "";
  const t = bi(r), s = 1.4, i = 6, o = t.length * s + i * 2, n = [];
  let a = 0, l = i;
  for (; a < t.length; ) if (t[a] === "1") {
    let d = 0;
    for (; a + d < t.length && t[a + d] === "1"; ) d++;
    n.push(`<rect x="${l.toFixed(2)}" y="0" width="${(d * s).toFixed(2)}" height="${e}"/>`), l += d * s, a += d;
  } else l += s, a++;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o.toFixed(2)} ${e}" width="${o.toFixed(2)}" height="${e}" style="display:block" aria-hidden="true"><g fill="currentColor">${n.join("")}</g></svg>`;
}
const St = /* @__PURE__ */ new Map();
function G(r, e) {
  St.set(r, e);
}
G("number", () => new oi()), G("date", () => new ri()), G("boolean", () => new kt()), G("checkbox", () => new kt()), G("radio", () => new fi()), G("img", () => new _i()), G("html", () => new wi()), G("barcode", () => new xi()), G("switch", () => new pi()), G("select", (r) => new ii(r.options ?? [], r.optionsFn)), G("button", (r, e) => new ni(e)), G("link", (r, e) => new li(e == null ? void 0 : e.hrefFn, e == null ? void 0 : e.target)), G("badge", (r, e) => new ai(e == null ? void 0 : e.colorMap, e ? e.labelMap ?? e.valueMap : void 0)), G("image", (r, e) => e ? new ci(e) : new be()), G("progress", (r, e) => e ? new hi(e) : new be()), G("sparkline", (r, e) => e ? new ui(e) : new be()), G("rating", (r, e) => e ? new gi(e) : new be()), G("template", (r, e) => e ? new di(e.templateFn) : new be());
function Ri(r) {
  const e = r.renderer;
  let t, s;
  e ? typeof e == "string" ? (t = e, s = void 0) : (t = e.type, s = e) : (t = String(r.type ?? ""), s = void 0);
  const i = St.get(t);
  return i ? i(r, s) : new be();
}
const Mi = { "#ERR": "formulaError.err", "#REF": "formulaError.ref", "#CYCLE": "formulaError.cycle", "#DIV0": "formulaError.div0", "#NAME": "formulaError.name", "#VALUE": "formulaError.value", "#NUM": "formulaError.num" };
class ki {
  constructor(e, t, s, i) {
    this._cellMap = /* @__PURE__ */ new Map(), this._root = e, this._opts = t, this._cbs = s, this._ap = i ?? new Ye(new ze(t.theme ?? "default")), this._header = T("div", "og-header"), this._header.style.cssText = `flex-shrink:0;overflow-x:auto;overflow-y:hidden;border:0;border-bottom:${this._ap.divider()};scrollbar-width:none;`, this._bodyWrap = T("div", "og-body-wrapper"), this._bodyWrap.style.cssText = "flex:1;overflow:auto;position:relative;", this._bodyWrap.style.setProperty("--scrollbar-size", "8px"), this._body = T("div", "og-body"), this._body.style.cssText = "position:relative;", this._bodyWrap.appendChild(this._body), e.appendChild(this._header), e.appendChild(this._bodyWrap), this._bodyWrap.addEventListener("scroll", () => {
      this._header.scrollLeft = this._bodyWrap.scrollLeft;
    }, { passive: true });
  }
  get bodyWrapper() {
    return this._bodyWrap;
  }
  _t(e, t) {
    return this._cbs.t ? this._cbs.t(e, t) : B(e, t);
  }
  updateSize(e, t) {
    this._bodyWrap.style.height = `${e - t}px`;
  }
  getHeaderHeight() {
    return this._header.offsetHeight;
  }
  renderHeader(e, t, s, i, o) {
    var _a, _b, _c, _d;
    this._header.innerHTML = "";
    const n = this._ap, a = o._frozenCount ?? 0, l = !!((_a = o.masterDetail) == null ? void 0 : _a.enabled) && (((_b = o.masterDetail) == null ? void 0 : _b.toggle) ?? "expander-col") === "expander-col", d = 28;
    let c = 0;
    o.stateColumn && (c += 24), o.draggable && (c += 18), o.rowNumber && (c += 44), o.checkColumn && (c += 36), l && (c += d);
    const h = c + t.reduce((m, _, w) => m + (s[w] ?? o.defaultColumnWidth), 0);
    this._header.style.background = "var(--og-header-bg,#f5f5f5)";
    const u = T("table", "og-header-table");
    u.setAttribute("role", "presentation"), u.style.cssText = `table-layout:fixed;border-collapse:collapse;border-spacing:0;margin:0;width:${h}px;background:var(--og-header-bg,#f5f5f5);`;
    const g = e.length;
    let p = 0;
    const f = (m, _, w, y = "") => {
      const R = T("th", `og-header-cell og-extra-col ${y}`);
      R.setAttribute("rowspan", String(g)), R.textContent = w, At(R, { width: `${_}px`, minWidth: `${_}px`, textAlign: "center", borderRight: n.border(), borderBottom: n.border(), borderTop: "0", borderLeft: "0", lineHeight: "normal", verticalAlign: "middle", padding: "0", fontSize: "11px", color: "#999", userSelect: "none", boxSizing: "border-box", background: "var(--og-header-bg,#f5f5f5)" }), a > 0 && (R.style.position = "sticky", R.style.left = `${p}px`, R.style.zIndex = "4"), p += _, m.appendChild(R);
    };
    for (let m = 0; m < e.length; m++) {
      const _ = T("tr", "og-header-row");
      if (_.style.height = `${o.headerHeight}px`, m === 0) {
        if (o.stateColumn && f(_, 24, ""), o.draggable && f(_, 18, ""), o.rowNumber && f(_, 44, "No"), o.checkColumn) {
          const w = T("th", "og-header-cell og-extra-col");
          w.setAttribute("rowspan", String(g)), w.style.cssText = `width:36px;min-width:36px;text-align:center;border-right:${n.border()};border-bottom:${n.border()};border-top:0;border-left:0;line-height:normal;vertical-align:middle;background:var(--og-header-bg,#f5f5f5);box-sizing:border-box;`, a > 0 && (w.style.position = "sticky", w.style.left = `${p}px`, w.style.zIndex = "4"), p += 36;
          const y = document.createElement("input");
          y.type = "checkbox", y.setAttribute("aria-label", this._t("row.selectAllAria")), y.style.cssText = "width:16px;height:16px;", y.addEventListener("change", () => this._cbs.onAllCheck(y.checked)), w.appendChild(y), _.appendChild(w);
        }
        l && f(_, d, "", "og-detail-toggle-col");
      }
      for (const w of e[m] ?? []) {
        const y = T("th", "og-header-cell"), R = w.column;
        w.colSpan > 1 && (y.colSpan = w.colSpan), w.rowSpan > 1 && (y.rowSpan = w.rowSpan);
        const A = w.colSpan === 1 ? t.findIndex((M) => M.field === R.field) : -1;
        if (w.colSpan === 1) {
          const M = A >= 0 ? s[A] ?? o.defaultColumnWidth : R.width ?? o.defaultColumnWidth;
          y.style.width = `${M}px`, y.style.minWidth = `${M}px`;
        }
        const S = i.find((M) => M.field === R.field), O = R.sortable !== false && o.sortable && w.colSpan === 1;
        if (y.setAttribute("role", "columnheader"), y.setAttribute("scope", "col"), O && (y.setAttribute("aria-sort", S ? S.dir === "asc" ? "ascending" : "descending" : "none"), y.tabIndex = A === 0 ? 0 : -1, y.addEventListener("keydown", (M) => {
          if (M.key === "Enter" || M.key === " ") M.preventDefault(), this._cbs.onHeaderClick(R.field, M.shiftKey);
          else if (M.key === "ArrowRight") {
            M.preventDefault();
            const L = y.nextElementSibling;
            (L == null ? void 0 : L.tagName) === "TH" && L.focus();
          } else if (M.key === "ArrowLeft") {
            M.preventDefault();
            const L = y.previousElementSibling;
            (L == null ? void 0 : L.tagName) === "TH" && L.focus();
          }
        })), A >= 0 && A < a) {
          let M = 0;
          o.stateColumn && (M += 24), o.draggable && (M += 18), o.rowNumber && (M += 44), o.checkColumn && (M += 36), l && (M += d);
          for (let L = 0; L < A; L++) M += s[L] ?? o.defaultColumnWidth;
          y.classList.add("og-frozen"), A === a - 1 && y.classList.add("og-frozen-last"), y.style.left = `${M}px`;
        }
        const z = R.header ?? R.field, $ = typeof z == "string" && z.indexOf(`
`) >= 0, C = R.headerWrap === true || $;
        At(y, { padding: "4px 8px", boxSizing: "border-box", background: "var(--og-header-bg)", color: "var(--og-header-color)", lineHeight: C ? "1.3" : "normal", verticalAlign: "middle", fontSize: "var(--og-font-size)", textAlign: R.headerAlign ?? "center", borderTop: "0", borderLeft: "0", borderRight: n.border(), borderBottom: n.border(), userSelect: "none", cursor: O ? "pointer" : "default", whiteSpace: C ? "normal" : "nowrap", overflow: C ? "visible" : "hidden", textOverflow: C ? "clip" : "ellipsis", wordBreak: C ? "break-word" : "normal", position: "relative" }), y.title = (typeof R.tooltip == "string" ? R.tooltip : z) ?? "";
        const E = T("span");
        if (C ? (E.style.cssText = "overflow:visible;text-overflow:clip;white-space:normal;word-break:break-word;", String(z).split(`
`).forEach((L, K) => {
          K > 0 && E.appendChild(document.createElement("br")), E.appendChild(document.createTextNode(L));
        })) : (E.textContent = z, E.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"), y.appendChild(E), S) {
          y.classList.add("og-sorted");
          const M = T("span", "og-sort-icon");
          M.textContent = S.dir === "asc" ? " ↑" : " ↓", y.appendChild(M);
        }
        if (R.filterable !== false && o.filterable && w.colSpan === 1) {
          const M = T("span", "og-filter-icon"), L = (((_d = (_c = o._activeFilters) == null ? void 0 : _c[R.field]) == null ? void 0 : _d.length) ?? 0) > 0;
          M.textContent = L ? "⊿" : "▿", M.title = this._t("grid.filterTooltip"), M.style.cssText = "margin-left:3px;cursor:pointer;font-size:10px;opacity:0.6;", L && M.classList.add("og-filter-icon--active"), M.addEventListener("click", (K) => {
            K.stopPropagation(), this._cbs.onFilterIconClick(R.field, M);
          }), y.appendChild(M);
        }
        if (R.resizable !== false) {
          const M = T("div", "og-resize-handle");
          M.style.cssText = "position:absolute;right:0;top:0;bottom:0;width:4px;cursor:col-resize;z-index:1;", y.appendChild(M);
          const L = A;
          Ei(M, y, (K) => {
            L >= 0 && this._cbs.onColResize(L, K);
          });
        }
        o.columnReorder && A >= 0 && w.colSpan === 1 && (y.draggable = true, y.addEventListener("dragstart", (M) => {
          var _a2;
          this._cbs.onColDragStart(A), y.classList.add("og-col-dragging"), (_a2 = M.dataTransfer) == null ? void 0 : _a2.setData("text/plain", String(A));
        }), y.addEventListener("dragend", () => {
          y.classList.remove("og-col-dragging"), this._header.querySelectorAll(".og-col-drop-over").forEach((M) => M.classList.remove("og-col-drop-over"));
        }), y.addEventListener("dragover", (M) => {
          M.preventDefault();
          const L = this._cbs.getColDragIdx();
          L !== null && L !== A && (this._header.querySelectorAll(".og-col-drop-over").forEach((K) => K.classList.remove("og-col-drop-over")), y.classList.add("og-col-drop-over"));
        }), y.addEventListener("dragleave", () => {
          y.classList.remove("og-col-drop-over");
        }), y.addEventListener("drop", (M) => {
          M.preventDefault(), y.classList.remove("og-col-drop-over"), this._cbs.onColDrop(A);
        })), O && y.addEventListener("click", (M) => {
          M.target.classList.contains("og-resize-handle") || this._cbs.onHeaderClick(R.field, M.shiftKey);
        }), _.appendChild(y);
      }
      u.appendChild(_);
    }
    this._header.appendChild(u);
  }
  renderBody(e) {
    var _a, _b, _c, _d, _e2, _f, _g, _h, _i2, _j, _k, _l, _m, _n, _o2, _p, _q, _r2;
    const { startIndex: t, endIndex: s, data: i, leaves: o, widths: n, offsetY: a, totalHeight: l, selectedRows: d, checkedRows: c, groupFlatRows: h = null, onGroupToggle: u, onTreeToggle: g, extraOpts: p = {}, mergeEngine: f, detailApi: m } = e;
    let _ = e.opts;
    const w = this._ap;
    Object.keys(p).length && (_ = { ..._, ...p }), m == null ? void 0 : m.onBeforeTeardown(), this._body.innerHTML = "", this._cellMap.clear();
    const y = _.autoHeight === true;
    this._body.classList.toggle("og-autoheight", y), this._body.style.height = y ? "" : `${l}px`;
    const R = _._frozenCount ?? 0, A = !!m && (m.toggleMode ?? "expander-col") === "expander-col", S = 28;
    let O = 0;
    _.stateColumn && (O += 24), _.draggable && (O += 18), _.rowNumber && (O += 44), _.checkColumn && (O += 36), A && (O += S);
    const z = O + o.reduce((C, E, W) => C + (n[W] ?? _.defaultColumnWidth), 0);
    if (this._body.style.minWidth = `${z}px`, s < t) return;
    const $ = document.createDocumentFragment();
    if (h && m) for (let C = t - 1; C >= 0; C--) {
      const E = h[C];
      if (!(E && E._isDetailFiller === true)) {
        if (E && E._isDetailHead === true && C + E._span - 1 >= t) {
          const W = a + (C - t) * _.rowHeight;
          this._appendDetailPanel($, E._rowId, W, E._span * _.rowHeight, z, m);
        }
        break;
      }
    }
    for (let C = t; C <= s; C++) {
      const E = h ? h[C] : null;
      if (E && E._isDetailFiller === true) continue;
      if (E && E._isDetailHead === true && m) {
        const x = E, F = a + (C - t) * _.rowHeight;
        this._appendDetailPanel($, x._rowId, F, x._span * _.rowHeight, z, m);
        continue;
      }
      if (E && E._isDetailHead === true) continue;
      const W = E && E._isGroup === true, M = E && E._isTree === true;
      if (W) {
        const x = E, F = `__${x._groupField}:${x._groupValue}`, V = T("div", "og-group-row"), ce = a + (C - t) * _.rowHeight;
        V.style.cssText = [y ? "" : `top:${ce}px;height:${_.rowHeight}px;`, "display:flex;align-items:stretch;cursor:pointer;", `padding-left:${4 + x._depth * 12}px;`, "background:var(--og-header-bg,#f5f5f5);", `border:0;border-bottom:${w.divider()};`].join(""), V.setAttribute("role", "row"), V.setAttribute("aria-expanded", x._expanded ? "true" : "false"), V.setAttribute("aria-rowindex", String(C + 1)), V.setAttribute("aria-level", String(x._depth + 1));
        let U = 0;
        if (_.stateColumn && (U += 24), _.draggable && (U += 18), _.rowNumber && (U += 44), _.checkColumn && (U += 36), A && (U += S), U > 0) {
          const b = T("div", "og-group-state-cell");
          b.style.cssText = [`width:${U}px;min-width:${U}px;flex-shrink:0;`, "display:flex;align-items:center;justify-content:center;", "font-size:10px;font-weight:700;gap:2px;", `border-right:${w.border()};`].join("");
          const q = x._states ?? { added: 0, edited: 0, removed: 0 };
          if (q.added > 0) {
            const H = T("span");
            H.textContent = `+${q.added}`, H.style.cssText = `color:var(--og-row-added-bg,#2e7d32);background:#e8f5e9;padding:1px 3px;border-radius:${w.radius(3)};`, b.appendChild(H);
          }
          if (q.edited > 0) {
            const H = T("span");
            H.textContent = `M${q.edited}`, H.style.cssText = `color:#e65100;background:#fff8e1;padding:1px 3px;border-radius:${w.radius(3)};`, b.appendChild(H);
          }
          if (q.removed > 0) {
            const H = T("span");
            H.textContent = `D${q.removed}`, H.style.cssText = `color:var(--og-row-removed-bg,#c62828);background:#ffebee;padding:1px 3px;border-radius:${w.radius(3)};`, b.appendChild(H);
          }
          V.appendChild(b);
        }
        let le = false;
        for (let b = 0; b < o.length; b++) {
          const q = o[b], H = n[b] ?? _.defaultColumnWidth, Ee = x._summaryFmt !== void 0 && q.field in (x._summaryFmt ?? {}), X = T("div", "og-group-cell");
          if (X.style.cssText = [`width:${H}px;min-width:${H}px;flex-shrink:0;`, `padding:${w.cellPadding()};box-sizing:border-box;overflow:hidden;`, `border-right:${w.border()};`, "display:flex;align-items:center;", "white-space:nowrap;text-overflow:ellipsis;"].join(""), Ee) {
            const re = x._summaryFmt[q.field];
            X.textContent = re !== "" ? re : "-", X.style.justifyContent = "flex-end", X.style.color = "var(--og-primary,#1976d2)", X.style.fontWeight = "600";
          } else if (!le) {
            le = true;
            const re = T("span", "og-group-arrow");
            re.textContent = x._expanded ? "▾ " : "▸ ", re.style.cssText = "color:var(--og-primary,#1976d2);margin-right:4px;flex-shrink:0;", X.appendChild(re);
            const oe = T("span", "og-group-label");
            oe.textContent = this._t("group.badge", { label: x._groupLabel, count: x._childCount }), oe.style.cssText = "overflow:hidden;text-overflow:ellipsis;font-weight:600;", X.appendChild(oe), X.style.gap = "0";
          }
          V.appendChild(X);
        }
        V.addEventListener("click", () => u == null ? void 0 : u(F)), $.appendChild(V);
        continue;
      }
      const L = M ? E : null, K = L ? L.data : h ? E : i.getRowByIndex(C);
      if (!K) continue;
      const ie = M || W ? "none" : i.getRowState(C), P = T("div", "og-row");
      if (P.setAttribute("role", "row"), P.setAttribute("aria-rowindex", String(C + 1)), !y) {
        const x = a + (C - t) * _.rowHeight;
        P.style.top = `${x}px`, P.style.height = `${_.rowHeight}px`;
      }
      let Y = C % 2 === 0 ? "var(--og-row-bg,#fff)" : "var(--og-row-alt-bg,#fafafa)";
      P.style.background = Y, ie === "added" && P.classList.add("og-state-added"), ie === "edited" && P.classList.add("og-state-edited"), ie === "removed" && P.classList.add("og-state-removed"), d.has(C) && P.classList.add("og-selected"), P.setAttribute("aria-selected", d.has(C) ? "true" : "false"), ie === "added" && (Y = "var(--og-row-added-bg,#e8f5e9)"), ie === "edited" && (Y = "var(--og-row-edited-bg,#fff8e1)"), ie === "removed" && (Y = "var(--og-row-removed-bg,#ffebee)"), d.has(C) && (Y = "var(--og-row-selected-bg,#bbdefb)");
      const ke = C;
      P.addEventListener("click", (x) => {
        this._cbs.onCellClick(ke, -1, x);
      });
      const Oe = /* @__PURE__ */ new Map();
      let te = 0;
      if (_.stateColumn) {
        const x = T("div", "og-cell og-col-state"), F = { added: "✚", edited: "✎", removed: "✖", none: "" }, V = { added: "#2e7d32", edited: "#bf360c", removed: "#c62828", none: "" };
        x.textContent = F[ie] ?? "", x.style.color = V[ie] ?? "", x.title = ie, R > 0 && (x.style.position = "sticky", x.style.left = `${te}px`, x.style.zIndex = "2", x.style.background = Y), te += 24, P.appendChild(x);
      }
      const gt = this._cbs.getDndManager();
      if (_.draggable && gt) {
        const x = gt.attachHandle(P, C, _._totalRows ?? s + 1);
        R > 0 && (x.style.position = "sticky", x.style.left = `${te}px`, x.style.zIndex = "2", x.style.background = Y), te += 18, P.appendChild(x);
      }
      if (_.rowNumber) {
        const x = T("div", "og-cell og-col-rownum");
        x.textContent = String(C + 1), R > 0 && (x.style.position = "sticky", x.style.left = `${te}px`, x.style.zIndex = "2", x.style.background = Y), te += 44, P.appendChild(x);
      }
      if (_.checkColumn) {
        const x = T("div", "og-cell og-col-check"), F = document.createElement("input");
        F.type = "checkbox", F.checked = c.has(C), F.setAttribute("aria-label", this._t("row.selectAria", { n: C + 1 })), F.addEventListener("click", (V) => V.stopPropagation()), F.addEventListener("change", (V) => {
          V.stopPropagation(), this._cbs.onRowCheck(C, F.checked);
        }), x.appendChild(F), R > 0 && (x.style.position = "sticky", x.style.left = `${te}px`, x.style.zIndex = "2", x.style.background = Y), te += 36, P.appendChild(x);
      }
      if (A) {
        const x = T("div", "og-cell og-col-detail-toggle");
        x.style.cssText = "display:flex;align-items:center;justify-content:center;flex-shrink:0;box-sizing:border-box;";
        const F = m.getRowId(K), V = !!F && m.isExpanded(F), ce = m.getGlyph(V), U = T("span", "og-detail-expander");
        U.textContent = ce.glyph, U.title = ce.title, U.setAttribute("role", "button"), U.setAttribute("tabindex", "0"), U.setAttribute("aria-label", ce.ariaLabel), F && U.setAttribute("aria-controls", `og-detail-${F}`), U.style.cssText = "cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-width:22px;min-height:22px;user-select:none;line-height:1;";
        const le = F, b = C, q = (H) => {
          H.stopPropagation(), le && m.onToggle(b, le);
        };
        U.addEventListener("click", q), U.addEventListener("keydown", (H) => {
          (H.key === "Enter" || H.key === " ") && (H.preventDefault(), q(H));
        }), x.appendChild(U), R > 0 && (x.style.position = "sticky", x.style.left = `${te}px`, x.style.zIndex = "2", x.style.background = Y), x.style.width = `${S}px`, x.style.minWidth = `${S}px`, te += S, P.appendChild(x), F && P.setAttribute("aria-expanded", V ? "true" : "false");
      }
      for (let x = 0; x < o.length; x++) {
        const F = o[x], V = n[x] ?? _.defaultColumnWidth, ce = _.editable && F.editable !== false, U = x === 0, le = f && !f.isEmpty ? f.getInfo(C, x) : null;
        if (le == null ? void 0 : le.hidden) {
          const k = T("div", "og-cell og-cell--merge-ph");
          k.style.cssText = `width:${V}px;min-width:${V}px;flex-shrink:0;visibility:hidden;box-sizing:border-box;`, P.appendChild(k);
          continue;
        }
        const b = T("div", "og-cell");
        b.setAttribute("role", "gridcell"), b.setAttribute("aria-colindex", String(x + 1));
        const q = (le == null ? void 0 : le.rowSpan) ?? 1, H = (le == null ? void 0 : le.colSpan) ?? 1, Ee = q > 1 ? q * _.rowHeight : _.rowHeight;
        let X = V;
        if (H > 1) for (let k = 1; k < H; k++) X += n[x + k] ?? _.defaultColumnWidth;
        const re = x < R;
        let oe = 0;
        if (re) {
          _.stateColumn && (oe += 24), _.draggable && (oe += 18), _.rowNumber && (oe += 44), _.checkColumn && (oe += 36), A && (oe += S);
          for (let k = 0; k < x; k++) oe += n[k] ?? _.defaultColumnWidth;
          b.classList.add("og-frozen-cell"), x === R - 1 && b.classList.add("og-frozen-last");
        }
        b.style.width = `${X}px`, b.style.minWidth = `${X}px`, b.style.maxWidth = `${X}px`, q > 1 && (b.style.height = `${Ee}px`), re && (b.style.background = Y), L && U && (b.style.padding = "0"), b.style.overflow = "hidden", q > 1 ? (b.style.height = `${Ee}px`, b.style.position = "absolute", b.style.zIndex = "3", b.style.background = Y && Y !== "inherit" ? Y : "var(--og-row-bg, #fff)", b.style.borderTop = "0", b.style.borderLeft = "0", b.style.borderBottom = "1px solid var(--og-border-color, #e0e0e0)") : re && (b.style.position = "sticky", b.style.left = `${oe}px`, b.style.zIndex = "1"), F.type === "number" || F.align === "right" ? b.classList.add("og-cell--right") : F.align === "center" && b.classList.add("og-cell--center"), ce && b.classList.add("og-cell--editable"), F.wrap && b.classList.add("og-cell--wrap"), ce || b.setAttribute("aria-readonly", "true"), H > 1 && b.setAttribute("aria-colspan", String(H)), q > 1 && b.setAttribute("aria-rowspan", String(q)), ((_a = _._focusCell) == null ? void 0 : _a.ri) === C && ((_b = _._focusCell) == null ? void 0 : _b.ci) === x && (b.classList.add("og-cell-focused"), b.tabIndex = -1), ((_c = _._rangeRects) == null ? void 0 : _c.some((k) => C >= k.startRow && C <= k.endRow && x >= k.startCol && x <= k.endCol)) && (b.classList.add("og-range-selected"), b.style.background = "var(--og-range-bg, rgba(25,118,210,0.12))");
        const he = K ? K[F.field] : null;
        b.setAttribute("aria-label", `${F.header}: ${he == null ? "" : String(he)}`), F.tooltip != null ? b.title = typeof F.tooltip == "function" ? String(F.tooltip(he, K) ?? "") : String(F.tooltip) : _.tooltips && he != null && he !== "" && (b.title = String(he));
        const ne = ((_e2 = (_d = this._cbs).getFormulaMeta) == null ? void 0 : _e2.call(_d, C, F.field)) ?? null;
        if (ne) {
          const k = he == null ? this._t("cell.emptyValue") : String(he);
          if (ne.error) {
            const j = Mi[ne.error], ae = j ? this._t(j) : this._t("formulaError.fallback");
            b.setAttribute("aria-label", this._t("formula.ariaError", { src: ne.src, message: ae })), b.title = `${ne.error} — ${ae}`, b.style.color = "var(--og-formula-error-color, #c62828)";
          } else {
            const j = ne.approx ? this._t("formula.approxSuffix") : "";
            b.setAttribute("aria-label", this._t("formula.ariaValue", { src: ne.src, value: k, approx: j })), b.title = `${ne.src}${j}`;
          }
          if (((_f = _.formula) == null ? void 0 : _f.cellMarker) !== false) {
            b.classList.add("og-formula-cell");
            const j = ne.error ? "var(--og-formula-error-color, #c62828)" : "var(--og-formula-marker-color, #1976d2)", ae = b.style.background || b.style.backgroundColor;
            b.style.backgroundImage = `linear-gradient(135deg, ${j} 0 6px, transparent 6px)`, b.style.backgroundRepeat = "no-repeat", b.style.backgroundPosition = "top right", b.style.backgroundSize = "8px 8px", ae && (b.style.backgroundColor = ae);
          }
        }
        const ft = (_h = (_g = this._cbs).resolveRenderHook) == null ? void 0 : _h.call(_g, "cellClass", C, F.field);
        ft && (b.className += " " + ft);
        const _t = (_j = (_i2 = this._cbs).resolveRenderHook) == null ? void 0 : _j.call(_i2, "ariaLabel", C, F.field);
        _t != null && b.setAttribute("aria-label", String(_t));
        let mt = b;
        if (L && U) {
          const k = T("div", "og-tree-cell"), j = L._ancestorHasMore ?? [];
          for (let ee = 0; ee < L._depth; ee++) {
            const de = T("span", "og-tree-guide");
            j[ee] && de.classList.add("og-tree-guide--line"), k.appendChild(de);
          }
          if (L._depth > 0) {
            const ee = T("span", "og-tree-connector");
            ee.classList.add(L._isLastChild ? "og-tree-connector--last" : "og-tree-connector--mid"), k.appendChild(ee);
          }
          const ae = T("span", "og-tree-toggle-wrap");
          if (!L._hasChildren) {
            const ee = T("span", "og-tree-leaf-dot");
            ae.appendChild(ee);
          }
          k.appendChild(ae);
          const Q = document.createElement("i");
          if (L._hasChildren) {
            const ee = Ft(F.treeNodeIcon, K, true, L._expanded);
            Q.className = L._expanded ? `${ee} og-tree-node-icon og-tree-node-icon--branch og-tree-node-icon--open og-tree-node-icon--toggle` : `${ee} og-tree-node-icon og-tree-node-icon--branch og-tree-node-icon--toggle`, Q.setAttribute("role", "button"), Q.setAttribute("tabindex", "0"), Q.setAttribute("aria-expanded", L._expanded ? "true" : "false"), Q.setAttribute("aria-label", this._t(L._expanded ? "tree.collapse" : "tree.expand")), Q.addEventListener("click", (de) => {
              de.stopPropagation(), g == null ? void 0 : g(L._treeId);
            }), Q.addEventListener("keydown", (de) => {
              (de.key === "Enter" || de.key === " ") && (de.preventDefault(), de.stopPropagation(), g == null ? void 0 : g(L._treeId));
            });
          } else {
            const ee = Ft(F.treeNodeIcon, K, false, false);
            Q.setAttribute("aria-hidden", "true"), Q.className = `${ee} og-tree-node-icon og-tree-node-icon--leaf`;
          }
          k.appendChild(Q), b.appendChild(k), mt = k;
        }
        if (F.cellStyle) {
          const k = K[F.field], j = typeof F.cellStyle == "function" ? F.cellStyle(k, K, C) : F.cellStyle;
          Object.assign(b.style, j);
        }
        const Ls = Ri(F).render({ value: K[F.field], row: K, rowIndex: C, column: F, colIndex: x, isSelected: d.has(C), rowState: ie, displayValue: ((_l = (_k = this._cbs).resolveRenderHook) == null ? void 0 : _l.call(_k, "displayText", C, F.field)) ?? ((_n = (_m = this._cbs).getDisplayText) == null ? void 0 : _n.call(_m, C, F.field)) ?? null, displayFormatter: ((_p = (_o2 = this._cbs).getDisplayFormatter) == null ? void 0 : _p.call(_o2)) ?? null, hasCellFormula: ne != null, t: (k, j) => this._t(k, j) });
        mt.appendChild(Ls), (_r2 = (_q = this._cbs).applyCF) == null ? void 0 : _r2.call(_q, b, C, F.field, K ? K[F.field] : void 0, X, Ee);
        const ue = C, pe = x;
        if (b.addEventListener("click", (k) => {
          k.stopPropagation(), this._cbs.onCellClick(ue, pe, k);
        }), b.addEventListener("dblclick", (k) => {
          k.stopPropagation(), this._cbs.onCellDblClick(ue, pe, k);
        }), b.addEventListener("mouseover", (k) => {
          k.stopPropagation(), this._cbs.onCellMouseOver(ue, pe, k);
        }), b.addEventListener("mouseout", (k) => {
          k.stopPropagation(), this._cbs.onCellMouseOut(ue, pe, k);
        }), b.addEventListener("mousedown", (k) => {
          k.stopPropagation(), this._cbs.onCellMouseDown(ue, pe, k);
        }), b.addEventListener("mouseup", (k) => {
          k.stopPropagation(), this._cbs.onCellMouseUp(ue, pe, k);
        }), b.addEventListener("mousemove", (k) => {
          k.stopPropagation(), this._cbs.onCellMouseMove(ue, pe, k);
        }), Oe.set(x, b), q > 1) {
          const k = document.createElement("div");
          k.style.cssText = [`width:${V}px;min-width:${V}px;height:${_.rowHeight}px;`, "flex-shrink:0;box-sizing:border-box;", `border-right:${w.border()};`].join(""), P.appendChild(k);
          let j = 0;
          _.stateColumn && (j += 24), _.draggable && (j += 18), _.rowNumber && (j += 44), _.checkColumn && (j += 36), A && (j += S);
          for (let Q = 0; Q < x; Q++) j += n[Q] ?? _.defaultColumnWidth;
          const ae = a + (C - t) * _.rowHeight;
          b.style.left = `${j}px`, b.style.top = `${ae}px`, $.appendChild(b);
        } else P.appendChild(b);
      }
      this._cellMap.set(C, Oe), $.appendChild(P);
    }
    if (i.rowCount === 0) {
      const C = T("div", "og-empty-message");
      C.textContent = this._t("grid.emptyMessage"), C.style.cssText = "width:100%;", $.appendChild(C);
    }
    this._body.appendChild($);
  }
  getCellEl(e, t) {
    var _a;
    return (_a = this._cellMap.get(e)) == null ? void 0 : _a.get(t);
  }
  _appendDetailPanel(e, t, s, i, o, n) {
    const a = T("div", "og-detail-panel og-detail-panel-intro");
    a.dataset.ogRowId = t, a.id = `og-detail-${t}`, a.setAttribute("role", "region"), a.setAttribute("aria-label", n.ariaLabel), a.style.cssText = ["position:absolute;left:0;", `top:${s}px;width:${o}px;height:${i}px;`, "box-sizing:border-box;", "overflow-y:auto;overflow-x:auto;", "overscroll-behavior:contain;", "background:var(--og-detail-bg,#fff);", `border:0;border-bottom:${this._ap.divider()};`, "z-index:var(--og-z-detail,2);"].join("");
    const l = n.getPanelHost(t);
    a.appendChild(l), e.appendChild(a);
  }
  destroy() {
    this._root.innerHTML = "";
  }
}
function Ft(r, e, t, s) {
  let i;
  return r ? typeof r == "function" ? i = r(e, t, s) : t ? i = s ? r.branchOpen ?? "bi-folder2-open" : r.branch ?? "bi-folder2" : i = r.leaf ?? "bi-file-earmark" : i = t ? s ? "bi-folder2-open" : "bi-folder2" : "bi-file-earmark", i.startsWith("bi ") ? i : `bi ${i}`;
}
function T(r, e) {
  const t = document.createElement(r);
  return e && (t.className = e), t;
}
function At(r, e) {
  Object.assign(r.style, e);
}
function Lt(r, e, t = "text/plain;charset=utf-8") {
  const s = new Blob([r], { type: t }), i = URL.createObjectURL(s), o = document.createElement("a");
  o.href = i, o.download = e, o.click(), URL.revokeObjectURL(i);
}
function Ei(r, e, t) {
  let s = 0, i = 0;
  r.addEventListener("mousedown", (o) => {
    o.stopPropagation(), o.preventDefault(), s = o.clientX, i = e.offsetWidth;
    const n = (l) => {
      const d = Math.max(40, i + l.clientX - s);
      e.style.width = `${d}px`, e.style.minWidth = `${d}px`;
    }, a = (l) => {
      document.removeEventListener("mousemove", n), document.removeEventListener("mouseup", a), t(Math.max(40, i + l.clientX - s));
    };
    document.addEventListener("mousemove", n), document.addEventListener("mouseup", a);
  });
}
const Si = /* @__PURE__ */ new Set(["--og-radius-none", "--og-radius-sm", "--og-radius-md", "--og-radius-lg", "--og-radius-pill", "--og-radius-container", "--og-radius-control", "--og-radius-widget", "--og-container-radius", "--og-border-width", "--og-border-width-strong", "--og-border-style", "--og-divider-style", "--og-divider-repeat", "--og-elevation-sm", "--og-elevation-md", "--og-elevation-lg", "--og-elevation-alpha-sm", "--og-elevation-alpha-md", "--og-elevation-alpha-lg", "--og-elevation-inset", "--og-cell-padding-x", "--og-cell-padding-y", "--og-density-row-height", "--og-density-header-height", "--og-density-footer-height", "--og-scrollbar-size", "--og-texture-bg", "--og-texture-size", "--og-texture-opacity", "--og-focus-width", "--og-focus-style", "--og-focus-offset", "--og-focus-radius", "--og-icon-size", "--og-icon-fill", "--og-icon-stroke-width", "--og-icon-corner", "--og-transition-fast", "--og-transition-base", "--og-row-accent-width"]), Fi = /#[0-9a-fA-F]{3,8}\b/, Ai = /\b(?:rgba?|hsla?)\(\s*\d/, Li = /\b(?:red|green|blue|black|white|gray|grey|yellow|orange|purple|pink|brown|cyan|magenta)\b/i;
function It(r, e) {
  for (const [t, s] of Object.entries(e)) {
    const i = t;
    if (!Si.has(i)) throw new Error(`[SkinRegistry] 스킨 "${r}" 의 토큰 "${i}" 은 FORM 토큰이 아닙니다. 스킨은 형태(radius/border/elevation/…)만 소유하며 색 토큰은 data-og-theme 축입니다(색⊥형태 직교성).`);
    const o = String(s ?? "");
    if (Fi.test(o) || Ai.test(o) || Li.test(o)) throw new Error(`[SkinRegistry] 스킨 "${r}" 토큰 "${i}: ${o}" 에 색 리터럴이 있습니다. 스킨 델타는 색을 담을 수 없습니다(Rule 2). 색이 필요하면 COLOR 토큰(예: var(--og-texture-ink))을 참조하세요.`);
  }
}
function Tt(r, e) {
  const t = { ...e }, s = [], i = t["--og-focus-width"];
  if (i != null) {
    const o = parseFloat(String(i));
    !Number.isNaN(o) && o < 2 && (t["--og-focus-width"] = "2px", s.push(`focus-width ${i} → 2px (가시 포커스 최소 2px, HANMS)`));
  }
  return t["--og-focus-style"] === "none" && (t["--og-focus-style"] = "solid", s.push("focus-style none → solid (가시 포커스 비협상, HANMS)")), { delta: t, warnings: s };
}
class Dt {
  constructor() {
    this._skins = /* @__PURE__ */ new Map(), this._styleEl = null;
  }
  registerBuiltin(e, t) {
    It(e, t);
    const { delta: s } = Tt(e, t);
    this._skins.set(e, s);
  }
  define(e, t) {
    It(e, t);
    const s = Tt(e, t);
    this._skins.set(e, s.delta);
    for (const i of s.warnings) typeof console < "u" && console.warn(`[SkinRegistry] "${e}": ${i}`);
    return this._inject(e, s.delta), s;
  }
  has(e) {
    return this._skins.has(e);
  }
  get(e) {
    return this._skins.get(e);
  }
  list() {
    return [...this._skins.keys()];
  }
  _inject(e, t) {
    if (typeof document > "u") return;
    this._styleEl || (this._styleEl = document.createElement("style"), this._styleEl.setAttribute("data-og-skins", "runtime"), document.head.appendChild(this._styleEl));
    const s = Object.entries(t).map(([i, o]) => `  ${i}: ${o};`).join(`
`);
    this._styleEl.appendChild(document.createTextNode(`
.og-container[data-og-skin="${e}"] {
${s}
}
`));
  }
}
const Ii = { "--og-radius-sm": "0", "--og-radius-md": "0", "--og-radius-lg": "0", "--og-radius-pill": "0", "--og-radius-container": "0", "--og-container-radius": "0", "--og-border-width": "1px", "--og-border-style": "solid", "--og-divider-style": "solid", "--og-elevation-sm": "none", "--og-elevation-md": "none", "--og-elevation-lg": "0 1px 2px", "--og-cell-padding-x": "6px", "--og-density-row-height": "28", "--og-density-header-height": "28", "--og-focus-width": "2px", "--og-focus-style": "solid", "--og-focus-radius": "0", "--og-icon-fill": "0", "--og-icon-corner": "miter" }, Ti = { "--og-radius-sm": "4px", "--og-radius-md": "8px", "--og-radius-lg": "12px", "--og-radius-pill": "999px", "--og-radius-container": "12px", "--og-container-radius": "12px", "--og-radius-control": "8px", "--og-radius-widget": "6px", "--og-border-width": "1px", "--og-border-style": "solid", "--og-elevation-sm": "0 1px 3px", "--og-elevation-md": "0 4px 12px", "--og-elevation-lg": "0 12px 32px", "--og-elevation-alpha-sm": "0.06", "--og-elevation-alpha-md": "0.10", "--og-elevation-alpha-lg": "0.16", "--og-cell-padding-x": "12px", "--og-cell-padding-y": "2px", "--og-density-row-height": "40", "--og-density-header-height": "42", "--og-focus-width": "2px", "--og-focus-offset": "2px", "--og-focus-radius": "8px", "--og-icon-fill": "0", "--og-icon-corner": "round" }, Di = { "--og-radius-sm": "2px", "--og-radius-md": "3px", "--og-radius-lg": "4px", "--og-container-radius": "3px", "--og-border-width": "1px", "--og-border-style": "dashed", "--og-divider-style": "dashed", "--og-divider-repeat": "2", "--og-texture-bg": "repeating-linear-gradient(45deg, rgba(var(--og-texture-ink),0.04) 0 2px, transparent 2px 6px)", "--og-texture-size": "6px 6px", "--og-texture-opacity": "1", "--og-elevation-sm": "0 1px 2px", "--og-elevation-md": "0 2px 4px", "--og-elevation-lg": "0 4px 10px", "--og-cell-padding-x": "10px", "--og-density-row-height": "36", "--og-focus-style": "dashed", "--og-icon-fill": "0", "--og-icon-corner": "round" }, Oi = { "--og-radius-sm": "2px", "--og-radius-md": "3px", "--og-radius-lg": "4px", "--og-container-radius": "4px", "--og-border-width": "1px", "--og-border-style": "solid", "--og-divider-style": "solid", "--og-elevation-sm": "none", "--og-elevation-md": "none", "--og-elevation-lg": "none", "--og-elevation-inset": "none", "--og-cell-padding-x": "10px", "--og-density-row-height": "34", "--og-focus-width": "2px", "--og-focus-style": "solid", "--og-icon-fill": "0", "--og-icon-corner": "round" }, $i = { "--og-radius-sm": "0", "--og-radius-md": "2px", "--og-radius-lg": "2px", "--og-container-radius": "2px", "--og-border-width": "2px", "--og-border-width-strong": "3px", "--og-border-style": "solid", "--og-divider-style": "solid", "--og-elevation-sm": "none", "--og-elevation-md": "0 2px 4px", "--og-elevation-lg": "0 4px 8px", "--og-elevation-alpha-md": "0.30", "--og-elevation-alpha-lg": "0.40", "--og-cell-padding-x": "10px", "--og-density-row-height": "40", "--og-focus-width": "3px", "--og-focus-style": "solid", "--og-focus-offset": "2px", "--og-focus-radius": "0", "--og-icon-size": "18px", "--og-icon-fill": "1", "--og-icon-stroke-width": "2", "--og-icon-corner": "miter" }, zi = { "--og-radius-sm": "2px", "--og-radius-md": "4px", "--og-radius-lg": "8px", "--og-container-radius": "8px", "--og-radius-control": "4px", "--og-radius-widget": "4px", "--og-border-width": "1px", "--og-border-style": "solid", "--og-divider-style": "solid", "--og-elevation-sm": "0 1px 2px", "--og-elevation-md": "0 2px 6px", "--og-elevation-lg": "0 8px 24px", "--og-elevation-alpha-sm": "0.12", "--og-elevation-alpha-md": "0.16", "--og-elevation-alpha-lg": "0.20", "--og-cell-padding-x": "8px", "--og-density-row-height": "36", "--og-focus-width": "2px", "--og-focus-style": "solid", "--og-focus-offset": "1px", "--og-icon-fill": "0", "--og-icon-corner": "round" }, Bi = [["sharp", Ii], ["rounded", Ti], ["stitch", Di], ["flat", Oi], ["high-contrast", $i], ["material", zi]], Ze = new Dt();
for (const [r, e] of Bi) Ze.registerBuiltin(r, e);
const Hi = "default", Ot = Object.freeze({ tokens: Object.freeze({}) });
function $t(r, e, t) {
  for (const s of Object.keys(t)) if (!e.has(s)) throw new Error(`[AppearanceAxis:${r}] 토큰 "${s}" 은 ${r} 축 이름공간이 아닙니다. 각 축은 자기 이름공간 토큰만 소유합니다(축 오염 금지 — 이름-분리 물리 직교, 불변식 1).`);
}
class zt {
  constructor(e) {
    this._values = /* @__PURE__ */ new Map(), this.id = e.id, this.namespace = e.namespace, this._attrName = e.attrName, this._requiresRelayout = e.requiresRelayout ?? false;
  }
  registerBuiltin(e, t) {
    $t(this.id, this.namespace, t), this._values.set(e, this._guardrails(e, t).delta);
  }
  _guardrails(e, t) {
    return { delta: t, warnings: [] };
  }
  define(e, t) {
    $t(this.id, this.namespace, t);
    const s = this._guardrails(e, t);
    this._values.set(e, s.delta);
    for (const i of s.warnings) typeof console < "u" && console.warn(`[AppearanceAxis:${this.id}] "${e}": ${i}`);
    return s;
  }
  has(e) {
    return this._values.has(e);
  }
  resolve(e) {
    if (e === Hi) return Ot;
    const t = this._values.get(e);
    if (t === void 0) return Ot;
    const s = { tokens: t, attr: { name: this._attrName, value: e } };
    return this._requiresRelayout && (s.requiresRelayout = true), s;
  }
  list() {
    return [...this._values.keys()];
  }
}
const Bt = /* @__PURE__ */ new Set(["--og-density-row-height", "--og-density-header-height", "--og-density-footer-height", "--og-font-size", "--og-density-touch-min"]), Qe = 44;
class Pi extends zt {
  constructor() {
    super({ id: "density", attrName: "data-og-density", namespace: Bt, requiresRelayout: true });
  }
  _guardrails(e, t) {
    const s = { ...t }, i = [];
    for (const o of ["--og-density-row-height", "--og-density-header-height", "--og-density-footer-height"]) {
      const n = s[o];
      if (n == null) continue;
      const a = parseFloat(String(n));
      !Number.isNaN(a) && a < Qe && e.includes("touch") && (s[o] = `${Qe}px`, i.push(`${o} ${n} → ${Qe}px (터치 히트타깃 최소 44px, REQ-T2-018)`));
    }
    return { delta: s, warnings: i };
  }
}
const Ni = { "--og-density-row-height": "28px", "--og-density-header-height": "30px", "--og-density-footer-height": "28px", "--og-font-size": "12px" }, Vi = { "--og-density-row-height": "36px", "--og-density-header-height": "38px", "--og-density-footer-height": "36px", "--og-font-size": "13px" }, Wi = { "--og-density-row-height": "40px", "--og-density-header-height": "44px", "--og-density-footer-height": "40px", "--og-font-size": "14px" }, Ki = { "--og-density-row-height": "56px", "--og-density-header-height": "48px", "--og-density-footer-height": "48px", "--og-font-size": "15px" }, Ui = { "--og-density-row-height": "44px", "--og-density-header-height": "44px", "--og-density-footer-height": "44px", "--og-font-size": "13px" }, ji = [["compact", Ni], ["comfortable", Vi], ["spacious", Wi], ["gallery", Ki], ["compact-touch", Ui]], Ht = new Pi();
for (const [r, e] of ji) Ht.registerBuiltin(r, e);
const Pt = /* @__PURE__ */ new Set(["--og-texture-bg", "--og-texture-size", "--og-texture-opacity", "--og-texture-seam", "--og-texture-zone"]), Je = 0.1;
class qi extends zt {
  constructor() {
    super({ id: "texture", attrName: "data-og-texture", namespace: Pt });
  }
  _guardrails(e, t) {
    const s = { ...t }, i = [], o = s["--og-texture-opacity"];
    if (o != null) {
      const n = parseFloat(String(o));
      !Number.isNaN(n) && n > Je && (s["--og-texture-opacity"] = String(Je), i.push(`--og-texture-opacity ${o} → ${Je} (질감 알파 정직 상한, 텍스트 아래 AA 안전, §9.5)`));
    }
    return { delta: s, warnings: i };
  }
}
const Gi = { "--og-texture-bg": "repeating-linear-gradient(0deg, rgba(var(--og-texture-ink),0.05) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(var(--og-texture-ink),0.04) 0 1px, transparent 1px 4px)", "--og-texture-size": "4px 4px", "--og-texture-opacity": "0.06", "--og-texture-zone": "chrome" }, Yi = { "--og-texture-bg": "radial-gradient(rgba(var(--og-texture-ink),0.05) 0.5px, transparent 0.5px)", "--og-texture-size": "3px 3px", "--og-texture-opacity": "0.05", "--og-texture-zone": "chrome" }, Xi = { "--og-texture-bg": "repeating-linear-gradient(0deg, rgba(var(--og-texture-ink),0.06) 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, rgba(var(--og-texture-ink),0.06) 0 1px, transparent 1px 8px)", "--og-texture-size": "8px 8px", "--og-texture-opacity": "0.07", "--og-texture-seam": "var(--og-texture-ink)", "--og-texture-zone": "chrome" }, Zi = [["linen", Gi], ["paper-grain", Yi], ["graph", Xi]], Nt = new qi();
for (const [r, e] of Zi) Nt.registerBuiltin(r, e);
class Qi {
  constructor(e) {
    this._autoHeightWarned = false, this._deps = e;
  }
  _paginationHeight() {
    return this._deps.getOptions().pagination ? 38 : 0;
  }
  onResize() {
    const { width: e } = this._deps.getContainer().getBoundingClientRect();
    e && (this.recalcWidths(e), this.renderHeader(), this.doRender(...this.visRange()));
  }
  recalcWidths(e) {
    const t = this._deps.getColLayout(), s = this._deps.getOptions(), i = t.computeWidths(e - (s.stateColumn ? 24 : 0) - (s.draggable ? 18 : 0) - (s.rowNumber ? 44 : 0) - (s.checkColumn ? 36 : 0), s.defaultColumnWidth), o = this._deps.getUserWidths();
    o.size && t.visibleLeaves.forEach((n, a) => {
      const l = o.get(n.field);
      l != null && (i[a] = l);
    }), this._deps.setColWidths(i);
  }
  renderHeader() {
    const e = this._deps.getRenderer(), t = this._deps.getColLayout(), s = this._deps.getSfMgr(), i = this._deps.getOptions();
    e == null ? void 0 : e.renderHeader(t.buildHeaderCells(), t.visibleLeaves, this._deps.getColWidths(), s.sortList, { ...i, _activeFilters: s.filters, _frozenCount: t.frozenCount }), this.syncHeaderLayout();
  }
  syncHeaderLayout() {
    const e = this._deps.getRenderer(), t = this._deps.getVs();
    if (!e || !t) return;
    const s = this._deps.getOptions(), { height: i } = this._deps.getContainer().getBoundingClientRect();
    if (!i) return;
    const o = e.getHeaderHeight(), n = o > s.headerHeight ? o : s.headerHeight;
    e.updateSize(i - this._paginationHeight(), n);
    let a = i - n - this._paginationHeight();
    const l = s.fallbackViewportHeight;
    if (l && l > 0) {
      const d = t.getTotalHeight();
      a >= d && a > l && (a = l);
    }
    t.setViewportHeight(a);
  }
  doRender(e, t) {
    var _a;
    const s = this._deps.getRenderer(), i = this._deps.getVs();
    if (!s || !i) return;
    const o = this._deps.getOptions(), n = i.getVisibleRange(), a = o.autoHeight === true;
    a && ([e, t] = this.visRange(), !this._autoHeightWarned && t - e + 1 > 2e3 && (this._autoHeightWarned = true, console.warn(`[OpenGrid] autoHeight 는 가상 스크롤이 아니라 전 행(${t - e + 1}행)을 렌더합니다. 행이 많으면 고정 rowHeight(가상 스크롤) 사용을 권장합니다.`)));
    const l = this._deps.getGrpMgr(), c = l.isGroupMode || l.isTreeMode || this._deps.getDetailMgr().isActive ? this._deps.getFlatModel().getFlatArray() : null, h = this._deps.getColLayout(), u = this._deps.getData(), g = this._deps.getRowMgr();
    s.renderBody({ startIndex: e, endIndex: t, data: u, leaves: h.visibleLeaves, widths: this._deps.getColWidths(), opts: o, offsetY: a ? 0 : n.offsetY, totalHeight: a ? 0 : i.getTotalHeight(), selectedRows: g.selectedRows, checkedRows: g.checkedRows, groupFlatRows: c, onGroupToggle: (p) => l.handleGroupToggle(p), onTreeToggle: l.isTreeMode ? (p) => l.handleTreeToggle(p) : void 0, extraOpts: { _totalRows: u.rowCount, _frozenCount: h.frozenCount, _focusCell: this._deps.getEditMgr().focusCell, ...this._deps.getRangeMgr().getOverlayExtraOpts() }, mergeEngine: this._deps.getMergeEngine(), detailApi: this._deps.buildDetailRenderContext() }), ((_a = o.footer) == null ? void 0 : _a.length) && this._deps.renderFooterEl(), this._deps.getRangeMgr().repaint();
  }
  visRange() {
    var _a;
    const e = this._deps.getOptions(), t = this._deps.getPagination();
    if (e.pagination && t) {
      const { start: o, end: n } = t.getRange();
      return [o, n];
    }
    const s = this._deps.getFlatModel().count();
    if (e.autoHeight) return [0, s - 1];
    const i = (_a = this._deps.getVs()) == null ? void 0 : _a.getVisibleRange();
    return [(i == null ? void 0 : i.startIndex) ?? 0, Math.min(((i == null ? void 0 : i.endIndex) ?? 30) + this._visCount() + 5, s - 1)];
  }
  _visCount() {
    const e = this._deps.getOptions(), t = this._deps.getContainer().getBoundingClientRect().height;
    return Math.ceil((t - e.headerHeight - this._paginationHeight()) / e.rowHeight) + 5;
  }
}
let Ji = 0;
function Vt() {
  return `og-r-${++Ji}`;
}
class eo {
  constructor(e = "_ogRowId") {
    this._data = [], this._original = [], this._meta = /* @__PURE__ */ new Map(), this._displayIndexes = [], this._idMap = /* @__PURE__ */ new Map(), this._findQuery = "", this._findFields = [], this._getStrategy = (t, s) => s, this._idField = e;
  }
  getDataIndexByRowId(e) {
    return this._idMap.get(e);
  }
  setStrategyResolver(e) {
    this._getStrategy = e;
  }
  setData(e) {
    this._data = e.map((t) => {
      const s = Vt(), i = { ...t, [this._idField]: s };
      return this._meta.set(s, { state: "none", rowId: s }), i;
    }), this._original = this._data.map((t) => ({ ...t })), this._rebuildIdMap(), this._displayIndexes = this._data.map((t, s) => s);
  }
  getData() {
    return this._displayIndexes.map((e) => this._data[e]);
  }
  getOriginalData() {
    return [...this._original];
  }
  getAllData() {
    return [...this._data];
  }
  clearData() {
    this._data = [], this._original = [], this._meta.clear(), this._idMap.clear(), this._displayIndexes = [];
  }
  get rowCount() {
    return this._displayIndexes.length;
  }
  get totalRowCount() {
    return this._data.length;
  }
  addRow(e, t = "last") {
    const s = Vt(), i = { ...e, [this._idField]: s };
    if (this._meta.set(s, { state: "added", rowId: s }), t === "last") {
      const o = this._data.push(i) - 1;
      this._idMap.set(s, o), this._displayIndexes.push(o);
    } else if (t === "first") this._data.unshift(i), this._rebuildIdMap(), this._displayIndexes.unshift(0);
    else {
      const o = Math.min(t, this._displayIndexes.length), n = o < this._displayIndexes.length ? this._displayIndexes[o] : this._data.length;
      this._data.splice(n, 0, i), this._rebuildIdMap(), this._displayIndexes = this._data.map((a, l) => l);
    }
  }
  removeRow(e) {
    const t = this._displayIndexes[e];
    if (t === void 0) return;
    const s = this._data[t], i = s[this._idField], o = this._meta.get(i);
    return (o == null ? void 0 : o.state) === "added" ? (this._data.splice(t, 1), this._meta.delete(i)) : this._meta.set(i, { ...o, state: "removed" }), this._rebuildIdMap(), this._displayIndexes = this._data.map((n, a) => ({ r: n, i: a })).filter(({ r: n }) => {
      var _a;
      return ((_a = this._meta.get(n[this._idField])) == null ? void 0 : _a.state) !== "removed";
    }).map(({ i: n }) => n), s;
  }
  moveRow(e, t) {
    const s = this._displayIndexes[e], i = this._displayIndexes[t];
    if (s === void 0 || i === void 0) return;
    const [o] = this._data.splice(s, 1), n = s < i ? i - 1 : i;
    this._data.splice(n, 0, o), this._rebuildIdMap(), this._displayIndexes = this._data.map((a, l) => ({ r: a, i: l })).filter(({ r: a }) => {
      var _a;
      return ((_a = this._meta.get(a[this._idField])) == null ? void 0 : _a.state) !== "removed";
    }).map(({ i: a }) => a);
  }
  updateCell(e, t, s) {
    const i = this._displayIndexes[e];
    if (i === void 0) return false;
    const n = this._data[i][this._idField], a = this._meta.get(n);
    return (a == null ? void 0 : a.state) === "none" && this._meta.set(n, { ...a, state: "edited", original: { ...this._original[i] } }), this._data[i][t] = s, true;
  }
  getRowByIndex(e) {
    const t = this._displayIndexes[e];
    return t !== void 0 ? this._data[t] : void 0;
  }
  getCellValue(e, t) {
    var _a;
    return (_a = this.getRowByIndex(e)) == null ? void 0 : _a[t];
  }
  hasRow(e) {
    var _a;
    return this._idMap.get(e) === void 0 ? false : ((_a = this._meta.get(e)) == null ? void 0 : _a.state) !== "removed";
  }
  getRowById(e) {
    if (!this.hasRow(e)) return;
    const t = this._idMap.get(e);
    return this._data[t];
  }
  getCellValueByRowId(e, t) {
    var _a;
    return (_a = this.getRowById(e)) == null ? void 0 : _a[t];
  }
  setComputedValueByRowId(e, t, s) {
    const i = this._idMap.get(e);
    i !== void 0 && (this._data[i][t] = s);
  }
  getEditedRows() {
    return this._data.filter((e) => {
      var _a;
      return ((_a = this._meta.get(e[this._idField])) == null ? void 0 : _a.state) === "edited";
    });
  }
  getChangedRows() {
    return this.getEditedRows();
  }
  getAddedRows() {
    return this._data.filter((e) => {
      var _a;
      return ((_a = this._meta.get(e[this._idField])) == null ? void 0 : _a.state) === "added";
    });
  }
  getRemovedRows() {
    return this._data.filter((e) => {
      var _a;
      return ((_a = this._meta.get(e[this._idField])) == null ? void 0 : _a.state) === "removed";
    });
  }
  getChanges() {
    const e = [], t = [], s = [];
    for (const i of this._data) {
      const o = i[this._idField], n = this._meta.get(o), a = (n == null ? void 0 : n.state) ?? "none";
      if (a === "added") e.push({ ...i });
      else if (a === "removed") s.push({ ...i });
      else if (a === "edited") {
        const l = n.original ?? {}, d = Object.keys(i).filter((c) => c !== this._idField && i[c] !== l[c]);
        t.push({ ...i, _changedFields: d });
      }
    }
    return { added: e, edited: t, removed: s };
  }
  getChangedColumns() {
    return this._data.filter((e) => {
      var _a;
      return ((_a = this._meta.get(e[this._idField])) == null ? void 0 : _a.state) === "edited";
    }).map((e) => {
      var _a;
      const t = ((_a = this._meta.get(e[this._idField])) == null ? void 0 : _a.original) ?? {}, s = [];
      for (const i of Object.keys(e)) i !== this._idField && e[i] !== t[i] && s.push({ field: i, oldValue: t[i], newValue: e[i] });
      return { row: { ...e }, fields: s.map((i) => i.field), diff: s };
    });
  }
  getOriginalRow(e) {
    const t = this._displayIndexes[e];
    if (t === void 0) return;
    const s = this._data[t], i = this._meta.get(s[this._idField]);
    if (!(!i || i.state === "added")) return i.state === "edited" && i.original ? { ...i.original } : { ...this._original[t] };
  }
  getRowsWithState(e) {
    return this._data.map((t) => {
      var _a;
      const s = ((_a = this._meta.get(t[this._idField])) == null ? void 0 : _a.state) ?? "none";
      return { ...t, [e]: s };
    });
  }
  getRowState(e) {
    var _a;
    const t = this.getRowByIndex(e);
    return t ? ((_a = this._meta.get(t[this._idField])) == null ? void 0 : _a.state) ?? "none" : "none";
  }
  applySort(e) {
    const t = (o) => {
      var _a, _b;
      return ((_b = this._meta.get((_a = this._data[o]) == null ? void 0 : _a[this._idField])) == null ? void 0 : _b.state) !== "removed";
    };
    if (e.length === 0) {
      this._displayIndexes = this._data.map((o, n) => n).filter(t);
      return;
    }
    const s = this._displayIndexes.filter(t).map((o) => {
      const n = this._data[o];
      return { idx: o, keys: e.map((a) => n[a.field]) };
    }), i = this._getStrategy("sortComparator", (o, n, a, l) => {
      if (o == null && n == null) return 0;
      if (o == null) return -1;
      if (n == null) return 1;
      if (typeof o == "number" && typeof n == "number") return o - n;
      const d = String(o), c = String(n);
      return d < c ? -1 : d > c ? 1 : 0;
    });
    s.sort((o, n) => {
      for (let a = 0; a < e.length; a++) {
        const l = e[a].dir, d = e[a].field, c = o.keys[a], h = n.keys[a], u = i(c, h, d, l);
        if (u !== 0) return l === "asc" ? u : -u;
      }
      return 0;
    }), this._displayIndexes = s.map((o) => o.idx);
  }
  applyFilter(e) {
    const t = Object.keys(e), s = this._getStrategy("filterPredicate", (i, o, n) => to(i, o));
    this._displayIndexes = this._data.map((i, o) => ({ r: i, i: o })).filter(({ r: i }) => {
      var _a;
      if (((_a = this._meta.get(i[this._idField])) == null ? void 0 : _a.state) === "removed" || t.length > 0 && !t.every((o) => {
        const n = i[o];
        return e[o].every((a) => s(n, a, o));
      })) return false;
      if (this._findQuery && this._findFields.length > 0) {
        const o = this._findQuery;
        if (!this._findFields.some((a) => {
          const l = i[a];
          return l != null && String(l).toLowerCase().includes(o);
        })) return false;
      }
      return true;
    }).map(({ i }) => i);
  }
  setFindFilter(e, t) {
    this._findQuery = e.toLowerCase(), this._findFields = t;
  }
  _rebuildIdMap() {
    this._idMap.clear(), this._data.forEach((e, t) => {
      this._idMap.set(e[this._idField], t);
    });
  }
}
function to(r, e) {
  const t = r, s = e.value;
  switch (e.operator) {
    case "=":
      return t == s;
    case "!=":
      return t != s;
    case ">":
      return t > s;
    case ">=":
      return t >= s;
    case "<":
      return t < s;
    case "<=":
      return t <= s;
    case "contains":
      return String(t).includes(String(s));
    case "startsWith":
      return String(t).startsWith(String(s));
    case "endsWith":
      return String(t).endsWith(String(s));
    default:
      return true;
  }
}
function Be(r) {
  return r && r._isGroup === true;
}
function Wt(r, e, t = [], s = /* @__PURE__ */ new Set(), i, o) {
  return e.length ? Kt(r, e, 0, t, s, "", i, o) : [];
}
function Kt(r, e, t, s, i, o, n, a) {
  const l = e[t], d = /* @__PURE__ */ new Map();
  for (const h of r) {
    const u = a ? a(h, e.slice(t)) : h[l];
    d.has(u) || d.set(u, []), d.get(u).push(h);
  }
  const c = [];
  for (const [h, u] of d) {
    const g = `${o}__${l}:${h}`, p = i.has(g);
    let f;
    t < e.length - 1 ? f = Kt(u, e, t + 1, s, i, g, n, a) : f = u;
    const { summary: m, summaryFmt: _ } = so(u, s), w = io(u, n);
    c.push({ _isGroup: true, _groupField: l, _groupValue: h, _groupLabel: h == null ? B("group.nullLabel") : String(h), _depth: t, _expanded: p, _childCount: u.length, _summary: m, _summaryFmt: _, _states: w, children: f });
  }
  return c;
}
function so(r, e) {
  const t = {}, s = {};
  for (const i of e) {
    const o = r.map((d) => d[i.field]).filter((d) => d != null && d !== "");
    let n = null;
    const a = i.op.toUpperCase();
    if (a === "SUM") n = o.length > 0 ? v.sum(o.map(String)) : null;
    else if (a === "AVG") n = o.length > 0 ? v.sum(o.map(String)).div(v.from(String(o.length))) : null;
    else if (a === "COUNT") {
      t[i.field] = r.length, s[i.field] = r.length.toLocaleString("ko-KR");
      continue;
    } else a === "MAX" ? n = o.length > 0 ? v.max(o.map(String)) : null : a === "MIN" && (n = o.length > 0 ? v.min(o.map(String)) : null);
    if (!n) {
      t[i.field] = null, s[i.field] = "";
      continue;
    }
    const l = n.toNumber();
    t[i.field] = l, s[i.field] = oo(l, i.format);
  }
  return { summary: t, summaryFmt: s };
}
function io(r, e) {
  if (!e) return { added: 0, edited: 0, removed: 0 };
  let t = 0, s = 0, i = 0;
  for (const o of r) {
    const n = e(o);
    n === "added" ? t++ : n === "edited" ? s++ : n === "removed" && i++;
  }
  return { added: t, edited: s, removed: i };
}
function oo(r, e) {
  if (e == null) return r % 1 === 0 ? r.toLocaleString("ko-KR") : parseFloat(r.toFixed(6)).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const t = e.includes("#") || e.includes(","), s = e.match(/\.(\d+)$/), i = s ? parseInt(s[1], 10) : /^\d+$/.test(e) ? parseInt(e, 10) : 0, o = Math.abs(r).toFixed(i), [n = "0", a] = o.split("."), l = t ? n.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : n, d = a !== void 0 ? `${l}.${a}` : l;
  return r < 0 ? `-${d}` : d;
}
function Ut(r) {
  const e = [];
  for (const t of r) if (e.push(t), t._expanded) for (const s of t.children) Be(s) ? e.push(...Ut([s])) : e.push(s);
  return e;
}
function jt(r, e = "") {
  const t = [];
  for (const s of r) {
    const i = `${e}__${s._groupField}:${s._groupValue}`;
    t.push(i);
    const o = s.children.filter((n) => Be(n));
    o.length && t.push(...jt(o, i));
  }
  return t;
}
function qt(r) {
  return r != null && r._isTree === true;
}
function et(r, e, t = /* @__PURE__ */ new Set()) {
  const { idField: s, parentIdField: i, expandOnLoad: o = false } = e, n = /* @__PURE__ */ new Map(), a = [];
  for (const c of r) {
    const h = c[s], u = { _isTree: true, _treeId: h, _treeParentId: c[i], _depth: 0, _expanded: o || t.has(h), _hasChildren: false, _childCount: 0, _isLastChild: false, _ancestorHasMore: [], data: c, children: [] };
    n.set(h, u);
  }
  for (const c of n.values()) {
    const h = c._treeParentId;
    if (h == null || h === "" || !n.has(h)) a.push(c);
    else {
      const g = n.get(h);
      g.children.push(c), g._hasChildren = true;
    }
  }
  function l(c, h) {
    for (const u of c) u._depth = h, u._childCount = Gt(u), l(u.children, h + 1);
  }
  l(a, 0);
  function d(c, h) {
    for (let u = 0; u < c.length; u++) {
      const g = c[u], p = u === c.length - 1;
      g._isLastChild = p, g._ancestorHasMore = h, g.children.length > 0 && d(g.children, [...h, !p]);
    }
  }
  return d(a, []), a;
}
function Gt(r) {
  let e = r.children.length;
  for (const t of r.children) e += Gt(t);
  return e;
}
function Yt(r) {
  const e = [];
  for (const t of r) e.push(t), t._expanded && t.children.length > 0 && e.push(...Yt(t.children));
  return e;
}
function ro(r, e) {
  r.has(e) ? r.delete(e) : r.add(e);
}
function tt(r) {
  const e = [];
  for (const t of r) e.push(t._treeId), t.children.length && e.push(...tt(t.children));
  return e;
}
class no {
  constructor(e) {
    this._backing = null, this._splices = [], this._revIndex = null, this._revIndexSrc = null, this._d = e;
  }
  setBacking(e) {
    this._backing = e, this._invalidate();
  }
  registerSplice(e) {
    this._splices.push(e), this._invalidate();
  }
  count() {
    return this._flat().length;
  }
  getFlatArray() {
    return this._flat();
  }
  resolveFlatRow(e) {
    var _a;
    const t = this._flat()[e];
    if (t == null) return { kind: "data" };
    if (t._isDetailFiller === true) return { kind: "detailFiller", rowId: t._rowId };
    if (t._isDetailHead === true) return { kind: "detailHead", rowId: t._rowId };
    if (Be(t)) return { kind: "group" };
    if (qt(t)) return { kind: "tree", rowId: (_a = t.data) == null ? void 0 : _a[this._d.rowIdField] };
    const s = t[this._d.rowIdField], i = this._d.getDataLayer().getDataIndexByRowId(s), o = { kind: "data", rowId: s };
    return i !== void 0 && (o.dataIndex = i), this._backing || (o.displayIndex = e), o;
  }
  flatIndexOfRowId(e) {
    return this._ensureRevIndex(), this._revIndex.get(e) ?? -1;
  }
  rowIdOfFlat(e) {
    const t = this.resolveFlatRow(e);
    return t.kind === "data" || t.kind === "tree" ? t.rowId ?? null : null;
  }
  _flat() {
    let e = this._backing ? this._backing() : this._d.getDataLayer().getData();
    for (const t of this._splices) e = t(e);
    return e;
  }
  _invalidate() {
    this._revIndex = null, this._revIndexSrc = null;
  }
  _ensureRevIndex() {
    var _a;
    const e = this._flat();
    if (this._revIndex && this._revIndexSrc === e) return;
    const t = /* @__PURE__ */ new Map();
    for (let s = 0; s < e.length; s++) {
      const i = e[s];
      if (i == null || Be(i) || i._isDetailHead === true || i._isDetailFiller === true) continue;
      const n = (_a = qt(i) ? i.data : i) == null ? void 0 : _a[this._d.rowIdField];
      n != null && t.set(n, s);
    }
    this._revIndex = t, this._revIndexSrc = e;
  }
}
class ao {
  constructor(e) {
    this._selectedRows = /* @__PURE__ */ new Set(), this._checkedRows = /* @__PURE__ */ new Set(), this._data = e;
  }
  get selectedRows() {
    return this._selectedRows;
  }
  get checkedRows() {
    return this._checkedRows;
  }
  selectSingle(e) {
    this._selectedRows.clear(), this._selectedRows.add(e);
  }
  selectToggle(e) {
    this._selectedRows.has(e) ? this._selectedRows.delete(e) : this._selectedRows.add(e);
  }
  clearSelection() {
    this._selectedRows.clear();
  }
  check(e, t) {
    t ? this._checkedRows.add(e) : this._checkedRows.delete(e);
  }
  checkAll(e, t) {
    if (e) for (let s = 0; s < t; s++) this._checkedRows.add(s);
    else this._checkedRows.clear();
  }
  checkByValue(e, t) {
    for (let s = 0; s < this._data.rowCount; s++) t.includes(this._data.getCellValue(s, e)) && this._checkedRows.add(s);
  }
  uncheckAll() {
    this._checkedRows.clear();
  }
  checkById(e) {
  }
  addCheckById(e) {
  }
  uncheckById(e) {
  }
  getSelections() {
    return [...this._selectedRows].map((e) => this._data.getRowByIndex(e)).filter(Boolean);
  }
  getChecked() {
    return [...this._checkedRows].map((e) => ({ row: this._data.getRowByIndex(e), rowIndex: e }));
  }
  getAllChecked() {
    return this.getChecked().map((e) => e.row);
  }
  getActiveRow() {
    return this._selectedRows.size > 0 ? [...this._selectedRows][0] : -1;
  }
  activate(e) {
    this._selectedRows.clear(), this._selectedRows.add(e);
  }
  deselect() {
    this._selectedRows.clear();
  }
  reset() {
    this._selectedRows.clear(), this._checkedRows.clear();
  }
}
function Z(r, e) {
  return `${r}:${e}`;
}
function fe(r) {
  const e = r.indexOf(":");
  return e === -1 ? { rowId: r, field: "" } : { rowId: r.slice(0, e), field: r.slice(e + 1) };
}
const lo = /* @__PURE__ */ new Set(["#ERR", "#REF", "#CYCLE", "#DIV0", "#NAME", "#VALUE", "#NUM"]);
function He(r) {
  return typeof r == "string" && lo.has(r) ? r : null;
}
const co = 500, ho = { "#REF": "formulaError.ref", "#CYCLE": "formulaError.cycle", "#VALUE": "formulaError.value", "#DIV0": "formulaError.div0", "#NAME": "formulaError.name", "#NUM": "formulaError.num" };
class uo {
  constructor(e) {
    this._deps = e;
  }
  flushRecalc() {
    const e = this._deps.getDirtySeeds();
    if (e.size === 0) return;
    const t = [...e];
    e.clear(), this.afterRecalc(this._deps.getRecalc().onValuesChanged(t), { skipRender: true });
  }
  afterRecalc(e, t = {}) {
    var _a, _b;
    if (e.changed.length > 0 || e.cycles > 0) {
      const s = { changed: e.changed, cycles: e.cycles, ms: e.ms, large: e.changed.length > co };
      this._deps.emit("formulaRecalc", s), (_b = (_a = this._deps.getOptions().formula) == null ? void 0 : _a.onFormulaRecalc) == null ? void 0 : _b.call(_a, s);
    }
    t.skipRender || this._deps.doRenderWindow();
  }
  handleFormulaError(e, t, s) {
    var _a, _b;
    const o = { rowIndex: this._deps.getFlatModel().flatIndexOfRowId(e), field: t, error: s };
    this._deps.emit("formulaError", o), (_b = (_a = this._deps.getOptions().formula) == null ? void 0 : _a.onFormulaError) == null ? void 0 : _b.call(_a, o), this._deps.announce(this._deps.t("formula.cellErrorAnnounce", { field: t, message: this._formulaErrorMessageKo(s) }));
  }
  _formulaErrorMessageKo(e) {
    const t = ho[e] ?? "formulaError.fallback";
    return this._deps.t(t);
  }
  buildAccessor() {
    return { visibleFields: () => this._deps.getColLayout().visibleLeaves.map((e) => e.field), rowIdAtFlat: (e) => {
      const t = this._deps.getFlatModel().resolveFlatRow(e);
      return t.kind === "data" ? t.rowId ?? null : null;
    }, flatIndexOfRowId: (e) => this._deps.getFlatModel().flatIndexOfRowId(e), displayedRowIds: () => {
      const e = [], t = this._deps.getFlatModel(), s = t.count();
      for (let i = 0; i < s; i++) {
        const o = t.resolveFlatRow(i);
        o.kind === "data" && o.rowId && e.push(o.rowId);
      }
      return e;
    }, getCellValue: (e, t) => this._deps.getData().getCellValueByRowId(e, t), hasRow: (e) => this._deps.getData().hasRow(e), hasField: (e) => this._deps.getColLayout().getColumnByField(e) != null };
  }
  setCellFormula(e, t, s) {
    const i = this._deps.getFlatModel().resolveFlatRow(e);
    i.kind !== "data" || !i.rowId || this.setCellFormulaByRowId(i.rowId, t, s, e);
  }
  setCellFormulaByRowId(e, t, s, i) {
    var _a, _b;
    const o = i ?? this._deps.getFlatModel().flatIndexOfRowId(e), n = this._deps.getRecalc(), a = n.getCellFormula(e, t), l = n.setCellFormula(e, t, s), d = { rowIndex: o, field: t, formula: s, oldFormula: a };
    this._deps.emit("formulaChange", d), (_b = (_a = this._deps.getOptions().formula) == null ? void 0 : _a.onFormulaChange) == null ? void 0 : _b.call(_a, d), this.afterRecalc(l);
  }
  getCellFormula(e, t) {
    const s = this._deps.getFlatModel().resolveFlatRow(e);
    return s.kind !== "data" || !s.rowId ? null : this._deps.getRecalc().getCellFormula(s.rowId, t);
  }
  hasCellFormula(e, t) {
    const s = this._deps.getFlatModel().resolveFlatRow(e);
    return s.kind === "data" && !!s.rowId && this._deps.getRecalc().hasCellFormula(s.rowId, t);
  }
  clearCellFormula(e, t) {
    const s = this._deps.getFlatModel().resolveFlatRow(e);
    if (s.kind !== "data" || !s.rowId) return;
    const i = this._deps.getRecalc(), o = i.clearCellFormula(s.rowId, t);
    o.length ? this.afterRecalc(i.onValuesChanged(o)) : this._deps.doRenderWindow();
  }
  getCellError(e, t) {
    const s = this._deps.getFlatModel().resolveFlatRow(e);
    return s.kind !== "data" || !s.rowId ? null : this._deps.getRecalc().getCellError(s.rowId, t);
  }
  getDependents(e, t) {
    const s = this._deps.getFlatModel().resolveFlatRow(e);
    if (s.kind !== "data" || !s.rowId) return [];
    const i = this._deps.getFlatModel();
    return this._deps.getRecalc().getDependents(s.rowId, t).map(({ rowId: o, field: n }) => ({ rowIndex: i.flatIndexOfRowId(o), field: n }));
  }
  getPrecedents(e, t) {
    const s = this._deps.getFlatModel().resolveFlatRow(e);
    if (s.kind !== "data" || !s.rowId) return [];
    const i = this._deps.getFlatModel();
    return this._deps.getRecalc().graph.getPrecedents(Z(s.rowId, t)).map(fe).map(({ rowId: o, field: n }) => ({ rowIndex: i.flatIndexOfRowId(o), field: n }));
  }
  recalculate() {
    this.afterRecalc(this._deps.getRecalc().recalculateAll());
  }
  recalculateCell(e, t) {
    const s = this._deps.getFlatModel().resolveFlatRow(e);
    s.kind !== "data" || !s.rowId || this.afterRecalc(this._deps.getRecalc().onValuesChanged([Z(s.rowId, t)]));
  }
  offsetFormula(e, t, s, i) {
    return this._deps.getRecalc().offsetFormula(e, t, s, i);
  }
  getFormulaMeta(e, t) {
    const s = this._deps.getFlatModel().resolveFlatRow(e);
    if (s.kind !== "data" || !s.rowId) return null;
    const i = this._deps.getRecalc().store.getFormula(s.rowId, t);
    return i ? { src: i.src, error: i.error, approx: !!i.approx } : null;
  }
  recalcRangeBearingFormulas() {
    this.afterRecalc(this._deps.getRecalc().recalcRangeBearing());
  }
}
const st = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
function Xt(r) {
  const e = r.trim(), t = /^([+-]?)(\d*)(?:\.(\d*))?[eE]([+-]?\d+)$/.exec(e);
  if (!t) return e;
  const [, s, i, o = "", n] = t, a = i || "0", l = parseInt(n, 10);
  let d = a + o, c = a.length + l;
  d === "" && (d = "0"), c <= 0 ? (d = "0".repeat(-c + 1) + d, c = 1) : c > d.length && (d = d + "0".repeat(c - d.length));
  const h = d.slice(0, c) || "0", u = d.slice(c);
  return s + h + (u ? "." + u : "");
}
function po(r) {
  const e = r.startsWith("=") ? r.slice(1) : r, t = new go(e), s = t.parseComparison();
  if (t.skip(), !t.eof()) throw new SyntaxError(`FormulaParser: 예상치 못한 토큰 '${t.peekChar()}' (위치 ${t.pos})`);
  return s;
}
class go {
  constructor(e) {
    this.pos = 0, this.src = e;
  }
  eof() {
    return this.pos >= this.src.length;
  }
  peekChar() {
    return this.src[this.pos] ?? "";
  }
  skip() {
    for (; !this.eof() && /\s/.test(this.peekChar()); ) this.pos++;
  }
  _tryOp(...e) {
    this.skip();
    for (const t of e.sort((s, i) => i.length - s.length)) if (this.src.startsWith(t, this.pos)) return this.pos += t.length, t;
    return null;
  }
  parseComparison() {
    let e = this.parseConcat();
    for (; ; ) {
      const t = this._tryOp("<=", ">=", "<>", "=", "<", ">");
      if (!t) break;
      const s = this.parseConcat();
      e = { t: "bin", op: t, left: e, right: s };
    }
    return e;
  }
  parseConcat() {
    let e = this.parseAdditive();
    for (; this._tryOp("&"); ) {
      const s = this.parseAdditive();
      e = { t: "bin", op: "&", left: e, right: s };
    }
    return e;
  }
  parseAdditive() {
    let e = this.parseMultiplicative();
    for (; ; ) {
      this.skip();
      const t = this.peekChar();
      if (t !== "+" && t !== "-") break;
      this.pos++;
      const s = this.parseMultiplicative();
      e = { t: "bin", op: t, left: e, right: s };
    }
    return e;
  }
  parseMultiplicative() {
    let e = this.parsePower();
    for (; ; ) {
      this.skip();
      const t = this.peekChar();
      if (t !== "*" && t !== "/" && t !== "%") break;
      this.pos++;
      const s = this.parsePower();
      e = { t: "bin", op: t, left: e, right: s };
    }
    return e;
  }
  parsePower() {
    const e = this.parseUnary();
    if (this.skip(), this.peekChar() === "^") {
      this.pos++;
      const t = this.parsePower();
      return { t: "bin", op: "^", left: e, right: t };
    }
    return e;
  }
  parseUnary() {
    this.skip();
    const e = this.peekChar();
    return e === "-" || e === "+" ? (this.pos++, { t: "unary", op: e, arg: this.parseUnary() }) : this.parsePrimary();
  }
  parsePrimary() {
    this.skip();
    const e = this.peekChar();
    if (e === "(") {
      this.pos++;
      const t = this.parseComparison();
      if (this.skip(), this.peekChar() !== ")") throw new SyntaxError("FormulaParser: 닫는 괄호 ) 누락");
      return this.pos++, t;
    }
    if (e === "[") return this._fieldRef();
    if (e === '"') return this._stringLit();
    if (/[A-Za-z$]/.test(e)) return this._identifierLike();
    if (/[0-9.]/.test(e)) return this._number();
    throw new SyntaxError(`FormulaParser: 예상치 못한 문자 '${e || "EOF"}' (위치 ${this.pos})`);
  }
  _fieldRef() {
    this.pos++;
    const e = this.pos;
    for (; !this.eof() && this.peekChar() !== "]"; ) this.pos++;
    if (this.eof()) throw new SyntaxError("FormulaParser: 닫는 ] 누락");
    const t = this.src.slice(e, this.pos);
    return this.pos++, { t: "field", field: t };
  }
  _stringLit() {
    this.pos++;
    let e = "";
    for (; !this.eof(); ) {
      const t = this.peekChar();
      if (t === '"') {
        if (this.src[this.pos + 1] === '"') {
          e += '"', this.pos += 2;
          continue;
        }
        return this.pos++, { t: "str", v: e };
      }
      e += t, this.pos++;
    }
    throw new SyntaxError('FormulaParser: 닫는 " 누락');
  }
  _identifierLike() {
    const e = this.pos;
    let t = false;
    this.peekChar() === "$" && (t = true, this.pos++);
    const s = this.pos;
    for (; !this.eof() && /[A-Za-z]/.test(this.peekChar()); ) this.pos++;
    const i = this.src.slice(s, this.pos);
    if (!i) throw new SyntaxError(`FormulaParser: 식별자를 기대했지만 '${this.peekChar() || "EOF"}' (위치 ${e})`);
    if (!t) {
      if (this.skip(), this.peekChar() === "(") {
        this.pos++;
        const c = [];
        if (this.skip(), this.peekChar() !== ")") for (c.push(this.parseComparison()), this.skip(); this.peekChar() === ","; ) this.pos++, c.push(this.parseComparison()), this.skip();
        if (this.peekChar() !== ")") throw new SyntaxError(`FormulaParser: 함수 '${i}' 닫는 ) 누락`);
        return this.pos++, { t: "call", name: i.toUpperCase(), args: c };
      }
      const d = i.toUpperCase();
      if (this.peekChar() !== "$" && !/[0-9]/.test(this.peekChar())) {
        if (d === "TRUE") return { t: "bool", v: true };
        if (d === "FALSE") return { t: "bool", v: false };
      }
    }
    let o = false;
    this.peekChar() === "$" && (o = true, this.pos++);
    const n = this.pos;
    for (; !this.eof() && /[0-9]/.test(this.peekChar()); ) this.pos++;
    if (this.pos === n) {
      if (t || o) throw new SyntaxError(`FormulaParser: 셀참조 행번호 누락 (위치 ${this.pos})`);
      return { t: "error", code: "#NAME" };
    }
    const a = parseInt(this.src.slice(n, this.pos), 10), l = { t: "rawRef", colLetters: i.toUpperCase(), row: a, dollarCol: t, dollarRow: o };
    return this._maybeRange(l);
  }
  _maybeRange(e) {
    const t = this.pos;
    if (this.skip(), this.peekChar() === ":") {
      this.pos++, this.skip();
      let s = false, i = false;
      this.peekChar() === "$" && (s = true, this.pos++);
      const o = this.pos;
      for (; !this.eof() && /[A-Za-z]/.test(this.peekChar()); ) this.pos++;
      const n = this.src.slice(o, this.pos).toUpperCase();
      if (!n) throw new SyntaxError(`FormulaParser: 범위 두번째 코너 열문자 누락 (위치 ${this.pos})`);
      this.peekChar() === "$" && (i = true, this.pos++);
      const a = this.pos;
      for (; !this.eof() && /[0-9]/.test(this.peekChar()); ) this.pos++;
      if (this.pos === a) throw new SyntaxError(`FormulaParser: 범위 두번째 코너 행번호 누락 (위치 ${this.pos})`);
      const l = parseInt(this.src.slice(a, this.pos), 10);
      return { t: "rawRange", a: e, b: { t: "rawRef", colLetters: n, row: l, dollarCol: s, dollarRow: i } };
    }
    return this.pos = t, e;
  }
  _number() {
    const e = this.pos;
    for (; !this.eof() && /[0-9]/.test(this.peekChar()); ) this.pos++;
    if (this.peekChar() === ".") for (this.pos++; !this.eof() && /[0-9]/.test(this.peekChar()); ) this.pos++;
    if (this.peekChar() === "e" || this.peekChar() === "E") {
      const s = this.pos;
      this.pos++, (this.peekChar() === "+" || this.peekChar() === "-") && this.pos++;
      const i = this.pos;
      for (; !this.eof() && /[0-9]/.test(this.peekChar()); ) this.pos++;
      this.pos === i && (this.pos = s);
    }
    const t = this.src.slice(e, this.pos);
    if (!t || t === ".") throw new SyntaxError(`FormulaParser: 숫자를 기대했지만 '${this.peekChar() || "EOF"}' (위치 ${e})`);
    return { t: "num", v: Xt(t) };
  }
}
function fo(r) {
  let e = 0;
  for (const t of r.toUpperCase()) e = e * 26 + (t.charCodeAt(0) - 64);
  return e - 1;
}
function _o(r) {
  let e = r + 1, t = "";
  for (; e > 0; ) {
    const s = (e - 1) % 26;
    t = String.fromCharCode(65 + s) + t, e = Math.floor((e - 1) / 26);
  }
  return t || "A";
}
function it(r, e) {
  const { accessor: t, host: s, refMode: i } = e, o = fo(r.colLetters), a = t.visibleFields()[o];
  if (a === void 0) return null;
  const l = r.row - 1, d = t.rowIdAtFlat(l);
  if (d === null) return null;
  if (i === "relative" && !r.dollarRow) {
    const c = t.flatIndexOfRowId(s.rowId);
    return { kind: "rel", dRow: c === -1 ? 0 : l - c, field: a, dollarRow: r.dollarRow, dollarCol: r.dollarCol };
  }
  return { kind: "abs", rowId: d, field: a, dollarRow: r.dollarRow, dollarCol: r.dollarCol };
}
function mo(r, e, t, s = "stable") {
  const i = { host: e, accessor: t, refMode: s };
  function o(n) {
    switch (n.t) {
      case "rawRef": {
        const a = it(n, i);
        return a ? { t: "ref", ref: a } : { t: "error", code: "#REF" };
      }
      case "rawRange": {
        const a = it(n.a, i), l = it(n.b, i);
        return !a || !l ? { t: "error", code: "#REF" } : { t: "range", ref: { a, b: l } };
      }
      case "call":
        return { t: "call", name: n.name, args: n.args.map(o) };
      case "unary":
        return { t: "unary", op: n.op, arg: o(n.arg) };
      case "bin":
        return { t: "bin", op: n.op, left: o(n.left), right: o(n.right) };
      default:
        return n;
    }
  }
  return o(r);
}
function Fe(r) {
  switch (r.t) {
    case "range":
      return true;
    case "call":
      return r.args.some(Fe);
    case "unary":
      return Fe(r.arg);
    case "bin":
      return Fe(r.left) || Fe(r.right);
    default:
      return false;
  }
}
class I extends Error {
  constructor(e) {
    super(e), this.code = e;
  }
}
function Zt(r, e, t, s = {}) {
  const i = /* @__PURE__ */ new Set(), o = { v: false }, n = s.divisionPrecision ?? 30;
  try {
    return { value: N(r, e, t, i, o, n, s.functions, s.now), error: null, approx: o.v, touched: i };
  } catch (a) {
    const l = a instanceof I ? a.code : "#ERR";
    return { value: l, error: l, approx: o.v, touched: i };
  }
}
function ot(r, e, t) {
  if (r.kind === "abs") return r.rowId;
  const s = t.flatIndexOfRowId(e.rowId);
  return s === -1 ? null : t.rowIdAtFlat(s + r.dRow);
}
function wo(r, e, t, s) {
  const i = ot(r, e, t);
  if (i === null || !t.hasRow(i)) throw new I("#REF");
  if (!t.hasField(r.field)) throw new I("#REF");
  s.add(Z(i, r.field));
  const o = t.getCellValue(i, r.field), n = He(o);
  if (n) throw new I(n);
  return o;
}
function yo(r, e, t, s) {
  const i = ot(r.a, e, t), o = ot(r.b, e, t);
  if (i === null || o === null || !t.hasRow(i) || !t.hasRow(o)) throw new I("#REF");
  if (!t.hasField(r.a.field) || !t.hasField(r.b.field)) throw new I("#REF");
  const n = t.displayedRowIds(), a = n.indexOf(i), l = n.indexOf(o);
  if (a === -1 || l === -1) throw new I("#REF");
  const d = Math.min(a, l), c = Math.max(a, l), h = n.slice(d, c + 1), u = t.visibleFields(), g = u.indexOf(r.a.field), p = u.indexOf(r.b.field), [f, m] = g === -1 || p === -1 ? [null, null] : [Math.min(g, p), Math.max(g, p)], _ = [];
  for (const w of h) {
    if (f === null || m === null) {
      s.add(Z(w, r.a.field)), _.push(t.getCellValue(w, r.a.field));
      continue;
    }
    for (let y = f; y <= m; y++) {
      const R = u[y];
      s.add(Z(w, R)), _.push(t.getCellValue(w, R));
    }
  }
  return _;
}
function D(r) {
  if (r == null || r === "") return v.zero();
  if (r instanceof v) return r;
  if (typeof r == "boolean") return v.from(r ? "1" : "0");
  if (typeof r == "number") return v.from(r);
  if (typeof r == "string") {
    const e = r.trim();
    if (!st.test(e)) throw new I("#VALUE");
    return v.from(Xt(e));
  }
  throw new I("#VALUE");
}
function xe(r) {
  return r == null ? "" : r instanceof v ? r.toString() : typeof r == "boolean" ? r ? "TRUE" : "FALSE" : String(r);
}
function Ae(r) {
  return typeof r == "boolean" ? r : r instanceof v ? !r.isZero() : typeof r == "number" ? r !== 0 : typeof r == "string" ? r.trim().toUpperCase() === "TRUE" || st.test(r.trim()) && r.trim() !== "0" : false;
}
function vo(r) {
  return r <= 0 ? v.from("1") : v.from("0." + "0".repeat(r - 1) + "1");
}
function Qt(r, e, t) {
  const s = Math.max(e, 0), i = r.toFixed(s + 20), o = i.startsWith("-"), n = o ? i.slice(1) : i, [a, l = ""] = n.split("."), d = l.slice(0, s), c = l.slice(s), h = /[1-9]/.test(c), u = (o ? "-" : "") + a + (s > 0 ? "." + d : "");
  let g = v.from(u);
  if (h && t === "up") {
    const p = vo(s);
    g = o ? g.sub(p) : g.add(p);
  }
  return g;
}
function Jt(r) {
  const e = Qt(r, 0, "down");
  return r.isNeg() && !r.eq(e) ? e.sub("1") : e;
}
function bo(r, e) {
  return v.from(r.toFixed(Math.max(e, 0)));
}
function es(r, e, t, s) {
  const i = Jt(e);
  if (e.eq(i)) {
    const o = Number(i.toFixed(0));
    if (!Number.isFinite(o) || Math.abs(o) > 1e5) return s.v = true, v.from(String(Math.pow(r.toNumber(), e.toNumber())));
    if (o === 0) return v.one();
    let n = v.one();
    for (let a = 0; a < Math.abs(o); a++) n = n.mul(r);
    if (o < 0) {
      if (n.isZero()) throw new I("#DIV0");
      n = v.one().div(n, t);
    }
    return n;
  }
  return s.v = true, v.from(String(Math.pow(r.toNumber(), e.toNumber())));
}
function xo(r, e, t, s, i) {
  switch (r) {
    case "+":
      return D(e).add(D(t));
    case "-":
      return D(e).sub(D(t));
    case "*":
      return D(e).mul(D(t));
    case "/": {
      const o = D(t);
      if (o.isZero()) throw new I("#DIV0");
      return D(e).div(o, s);
    }
    case "%": {
      const o = D(t);
      if (o.isZero()) throw new I("#DIV0");
      return D(e).mod(o);
    }
    case "^":
      return es(D(e), D(t), s, i);
    case "&":
      return xe(e) + xe(t);
    case "=":
    case "<>": {
      const o = Co(e, t);
      return r === "=" ? o : !o;
    }
    case "<":
    case "<=":
    case ">":
    case ">=": {
      const o = D(e), n = D(t);
      return r === "<" ? o.lt(n) : r === "<=" ? o.lte(n) : r === ">" ? o.gt(n) : o.gte(n);
    }
    default:
      throw new I("#ERR");
  }
}
function Co(r, e) {
  try {
    return D(r).eq(D(e));
  } catch {
    return xe(r) === xe(e);
  }
}
function ts(r, e) {
  return r.t === "range" ? yo(r.ref, e.host, e.accessor, e.touched) : [N(r, e.host, e.accessor, e.touched, e.approxBox, e.prec, e.functions, e.now)];
}
function _e(r, e) {
  const t = [];
  for (const s of r) for (const i of ts(s, e)) He(i) || t.push(i);
  return t;
}
function Pe(r) {
  return r == null || r === "" ? false : r instanceof v || typeof r == "number" ? true : typeof r == "string" ? st.test(r.trim()) : false;
}
function Ro(r, e, t) {
  if (t.functions) {
    const s = t.functions.get(r);
    if (s) return Mo(s, e, t);
  }
  switch (r) {
    case "SUM": {
      const s = _e(e, t);
      return v.sum(s.map((i) => D(i)));
    }
    case "AVG":
    case "AVERAGE": {
      const i = _e(e, t).filter((o) => o != null && o !== "").map((o) => D(o));
      if (i.length === 0) throw new I("#ERR");
      return v.avg(i, t.prec);
    }
    case "MIN": {
      const s = _e(e, t).filter(Pe);
      if (s.length === 0) throw new I("#ERR");
      return v.min(s.map((i) => D(i)));
    }
    case "MAX": {
      const s = _e(e, t).filter(Pe);
      if (s.length === 0) throw new I("#ERR");
      return v.max(s.map((i) => D(i)));
    }
    case "COUNT": {
      const s = _e(e, t);
      return v.from(String(s.filter(Pe).length));
    }
    case "COUNTA": {
      const s = _e(e, t);
      return v.from(String(s.filter((i) => i != null && i !== "").length));
    }
    case "IF": {
      if (e.length < 2) throw new I("#ERR");
      const s = N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now);
      return Ae(s) ? N(e[1], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now) : e.length > 2 ? N(e[2], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now) : false;
    }
    case "AND":
      return e.every((s) => Ae(N(s, t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)));
    case "OR":
      return e.some((s) => Ae(N(s, t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)));
    case "NOT":
      if (e.length !== 1) throw new I("#ERR");
      return !Ae(N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now));
    case "ROUND": {
      if (e.length !== 2) throw new I("#ERR");
      const s = D(N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)), i = Number(D(N(e[1], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)).toFixed(0));
      return bo(s, i);
    }
    case "ROUNDUP":
    case "ROUNDDOWN": {
      if (e.length !== 2) throw new I("#ERR");
      const s = D(N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)), i = Number(D(N(e[1], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)).toFixed(0));
      return Qt(s, i, r === "ROUNDUP" ? "up" : "down");
    }
    case "ABS": {
      if (e.length !== 1) throw new I("#ERR");
      return D(N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)).abs();
    }
    case "INT": {
      if (e.length !== 1) throw new I("#ERR");
      return Jt(D(N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)));
    }
    case "MOD": {
      if (e.length !== 2) throw new I("#ERR");
      const s = D(N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)), i = D(N(e[1], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now));
      if (i.isZero()) throw new I("#DIV0");
      return s.mod(i);
    }
    case "POWER": {
      if (e.length !== 2) throw new I("#ERR");
      const s = D(N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now)), i = D(N(e[1], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now));
      return es(s, i, t.prec, t.approxBox);
    }
    case "SQRT": {
      if (e.length !== 1) throw new I("#ERR");
      const s = D(N(e[0], t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now));
      if (s.isNeg()) throw new I("#NUM");
      return t.approxBox.v = true, v.from(String(Math.sqrt(s.toNumber())));
    }
    case "CONCAT":
      return e.map((s) => xe(N(s, t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now))).join("");
    default:
      throw new I("#NAME");
  }
}
function Mo(r, e, t) {
  const { min: s, max: i } = r.arity;
  if (e.length < s || i !== "variadic" && e.length > i) throw new I("#ERR");
  const o = e.map((a) => ({ scalar: () => N(a, t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now), tryScalar: () => {
    try {
      return { ok: true, value: N(a, t.host, t.accessor, t.touched, t.approxBox, t.prec, t.functions, t.now) };
    } catch (l) {
      return { ok: false, error: l instanceof I ? l.code : "#ERR" };
    }
  }, list: () => ts(a, t) })), n = { prec: t.prec, now: t.now ?? (() => Date.now()), argCount: e.length, markApprox: () => {
    t.approxBox.v = true;
  }, fail: (a) => {
    throw new I(a);
  }, toNum: (a) => D(a), toBool: (a) => Ae(a), toStr: (a) => xe(a), isNumeric: (a) => Pe(a), collect: () => _e(e, t) };
  return r.evaluate(o, n);
}
function N(r, e, t, s, i, o, n, a) {
  switch (r.t) {
    case "num":
      return v.from(r.v);
    case "str":
      return r.v;
    case "bool":
      return r.v;
    case "error":
      throw new I(r.code);
    case "field": {
      if (!t.hasField(r.field)) throw new I("#REF");
      s.add(Z(e.rowId, r.field));
      const l = t.getCellValue(e.rowId, r.field), d = He(l);
      if (d) throw new I(d);
      return ss(l);
    }
    case "ref": {
      const l = wo(r.ref, e, t, s);
      return ss(l);
    }
    case "range":
      throw new I("#VALUE");
    case "call":
      return Ro(r.name, r.args, { host: e, accessor: t, touched: s, prec: o, approxBox: i, functions: n, now: a });
    case "unary": {
      const l = D(N(r.arg, e, t, s, i, o, n, a));
      return r.op === "-" ? l.neg() : l;
    }
    case "bin":
      return xo(r.op, N(r.left, e, t, s, i, o, n, a), N(r.right, e, t, s, i, o, n, a), o, i);
    default:
      throw new I("#ERR");
  }
}
function ss(r) {
  return r == null ? null : r instanceof v || typeof r == "string" || typeof r == "boolean" ? r : typeof r == "number" ? v.from(r) : String(r);
}
class ko {
  constructor() {
    this._cells = /* @__PURE__ */ new Map();
  }
  setFormula(e, t, s) {
    this._cells.set(Z(e, t), s);
  }
  getFormula(e, t) {
    return this._cells.get(Z(e, t));
  }
  clearFormula(e, t) {
    this._cells.delete(Z(e, t));
  }
  hasFormula(e, t) {
    return this._cells.has(Z(e, t));
  }
  getFormulaByKey(e) {
    return this._cells.get(e);
  }
  getAllFormulaCells() {
    const e = [];
    for (const [t, s] of this._cells) {
      const i = t.indexOf(":");
      e.push({ rowId: t.slice(0, i), field: t.slice(i + 1), cell: s });
    }
    return e;
  }
  getRangeBearingKeys() {
    const e = [];
    for (const [t, s] of this._cells) s.hasRangeRef && e.push(t);
    return e;
  }
  size() {
    return this._cells.size;
  }
}
class Eo {
  constructor() {
    this._precedents = /* @__PURE__ */ new Map(), this._dependents = /* @__PURE__ */ new Map(), this._byRowId = /* @__PURE__ */ new Map(), this._byField = /* @__PURE__ */ new Map();
  }
  _addEdge(e, t) {
    let s = this._dependents.get(e);
    s || (s = /* @__PURE__ */ new Set(), this._dependents.set(e, s)), s.add(t);
    const { rowId: i, field: o } = fe(e);
    let n = this._byRowId.get(i);
    n || (n = /* @__PURE__ */ new Set(), this._byRowId.set(i, n)), n.add(t);
    let a = this._byField.get(o);
    a || (a = /* @__PURE__ */ new Set(), this._byField.set(o, a)), a.add(t);
  }
  _removeEdgesFrom(e) {
    const t = this._precedents.get(e);
    if (t) for (const s of t) {
      const i = this._dependents.get(s);
      i && (i.delete(e), i.size === 0 && this._dependents.delete(s));
      const { rowId: o, field: n } = fe(s), a = this._byRowId.get(o);
      a && (a.delete(e), a.size === 0 && this._byRowId.delete(o));
      const l = this._byField.get(n);
      l && (l.delete(e), l.size === 0 && this._byField.delete(n));
    }
  }
  addFormula(e, t) {
    this._removeEdgesFrom(e), this._precedents.set(e, new Set(t));
    for (const s of t) this._addEdge(s, e);
  }
  removeFormula(e) {
    this._removeEdgesFrom(e), this._precedents.delete(e);
  }
  isFormula(e) {
    return this._precedents.has(e);
  }
  getPrecedents(e) {
    return [...this._precedents.get(e) ?? []];
  }
  getDependents(e) {
    return [...this._dependents.get(e) ?? []];
  }
  getDependentsClosure(e) {
    const t = /* @__PURE__ */ new Set();
    for (const o of e) this.isFormula(o) && t.add(o);
    const s = [...e];
    let i = 0;
    for (; i < s.length; ) {
      const o = s[i++], n = this._dependents.get(o);
      if (n) for (const a of n) t.has(a) || (t.add(a), s.push(a));
    }
    return [...t];
  }
  topoOrder(e) {
    const t = new Set(e), s = /* @__PURE__ */ new Map();
    for (const d of e) {
      const c = this._precedents.get(d);
      let h = 0;
      if (c) for (const u of c) t.has(u) && h++;
      s.set(d, h);
    }
    const i = [];
    for (const [d, c] of s) c === 0 && i.push(d);
    let o = 0;
    const n = [];
    for (; o < i.length; ) {
      const d = i[o++];
      n.push(d);
      const c = this._dependents.get(d);
      if (c) for (const h of c) {
        if (!t.has(h)) continue;
        const u = (s.get(h) ?? 0) - 1;
        s.set(h, u), u === 0 && i.push(h);
      }
    }
    const a = new Set(n), l = e.filter((d) => !a.has(d));
    return { order: n, cycles: l };
  }
  formulasReferencing(e, t) {
    return t !== void 0 ? [...this._dependents.get(Z(e, t)) ?? []] : [...this._byRowId.get(e) ?? []];
  }
  formulasReferencingField(e) {
    return [...this._byField.get(e) ?? []];
  }
  allFormulaKeys() {
    return [...this._precedents.keys()];
  }
}
function rt(r, e, t) {
  let s;
  if (r.kind === "abs") s = r.rowId;
  else {
    const l = t.flatIndexOfRowId(e.rowId);
    s = l === -1 ? null : t.rowIdAtFlat(l + r.dRow);
  }
  if (s === null || !t.hasRow(s) || !t.hasField(r.field)) return "#REF!";
  const i = t.flatIndexOfRowId(s), o = t.visibleFields().indexOf(r.field);
  if (i === -1 || o === -1) return "#REF!";
  const n = (r.dollarCol ? "$" : "") + _o(o), a = (r.dollarRow ? "$" : "") + (i + 1);
  return n + a;
}
function So(r) {
  return '"' + r.replace(/"/g, '""') + '"';
}
const Fo = { "+": "+", "-": "-", "*": "*", "/": "/", "%": "%", "^": "^", "&": "&", "=": "=", "<>": "<>", "<": "<", "<=": "<=", ">": ">", ">=": ">=" };
function Ao(r, e, t) {
  return "=" + Le(r, e, t);
}
function Le(r, e, t) {
  switch (r.t) {
    case "num":
      return r.v;
    case "str":
      return So(r.v);
    case "bool":
      return r.v ? "TRUE" : "FALSE";
    case "field":
      return `[${r.field}]`;
    case "error":
      return "#REF!";
    case "ref":
      return rt(r.ref, e, t);
    case "range":
      return `${rt(r.ref.a, e, t)}:${rt(r.ref.b, e, t)}`;
    case "call":
      return `${r.name}(${r.args.map((s) => Le(s, e, t)).join(",")})`;
    case "unary":
      return `${r.op}${Le(r.arg, e, t)}`;
    case "bin":
      return `(${Le(r.left, e, t)}${Fo[r.op]}${Le(r.right, e, t)})`;
    default:
      return "#REF!";
  }
}
class is {
  constructor(e) {
    this.store = new ko(), this.graph = new Eo(), this._accessor = e.accessor, this._setComputedValue = e.setComputedValue, this._onFormulaError = e.onFormulaError, this._refMode = e.refMode ?? "stable", this._prec = e.divisionPrecision ?? 30, this._functions = e.functions, this._now = e.now;
  }
  _evalOpts() {
    const e = { divisionPrecision: this._prec };
    return this._functions && (e.functions = this._functions), this._now && (e.now = this._now), e;
  }
  compile(e, t) {
    let s;
    try {
      s = po(e);
    } catch {
      s = { t: "error", code: "#ERR" };
    }
    const i = mo(s, t, this._accessor, this._refMode);
    return { ast: i, hasRangeRef: Fe(i) };
  }
  setCellFormula(e, t, s) {
    const i = { rowId: e, field: t }, { ast: o, hasRangeRef: n } = this.compile(s, i), a = { src: s, ast: o, hasRangeRef: n, value: null, error: null };
    this.store.setFormula(e, t, a);
    const l = Z(e, t), d = Zt(o, i, this._accessor, this._evalOpts());
    return this.graph.addFormula(l, d.touched), this.onValuesChanged([l]);
  }
  getCellFormula(e, t) {
    var _a;
    return ((_a = this.store.getFormula(e, t)) == null ? void 0 : _a.src) ?? null;
  }
  hasCellFormula(e, t) {
    return this.store.hasFormula(e, t);
  }
  clearCellFormula(e, t) {
    const s = Z(e, t), i = this.graph.getDependents(s);
    return this.store.clearFormula(e, t), this.graph.removeFormula(s), i;
  }
  getCellError(e, t) {
    var _a;
    return ((_a = this.store.getFormula(e, t)) == null ? void 0 : _a.error) ?? null;
  }
  getDependents(e, t) {
    return this.graph.getDependents(Z(e, t)).map(fe);
  }
  onValuesChanged(e) {
    var _a;
    const t = Ne(), s = this.graph.getDependentsClosure(e), { order: i, cycles: o } = this.graph.topoOrder(s);
    for (const n of o) {
      const { rowId: a, field: l } = fe(n), d = this.store.getFormula(a, l);
      d && (d.value = "#CYCLE", d.error = "#CYCLE"), this._setComputedValue(a, l, "#CYCLE"), (_a = this._onFormulaError) == null ? void 0 : _a.call(this, a, l, "#CYCLE");
    }
    for (const n of i) this._evaluateOne(n);
    return { changed: [...i, ...o], cycles: o.length, ms: Ne() - t };
  }
  _evaluateOne(e) {
    var _a;
    const { rowId: t, field: s } = fe(e), i = this.store.getFormula(t, s);
    if (!i) return;
    const o = Zt(i.ast, { rowId: t, field: s }, this._accessor, this._evalOpts());
    this.graph.addFormula(e, o.touched), i.value = o.value, i.error = o.error, i.approx = o.approx, this._setComputedValue(t, s, o.value), o.error && ((_a = this._onFormulaError) == null ? void 0 : _a.call(this, t, s, o.error));
  }
  recalculateAll() {
    var _a;
    const e = Ne(), t = this.graph.allFormulaKeys(), { order: s, cycles: i } = this.graph.topoOrder(t);
    for (const o of i) {
      const { rowId: n, field: a } = fe(o), l = this.store.getFormula(n, a);
      l && (l.value = "#CYCLE", l.error = "#CYCLE"), this._setComputedValue(n, a, "#CYCLE"), (_a = this._onFormulaError) == null ? void 0 : _a.call(this, n, a, "#CYCLE");
    }
    for (const o of s) this._evaluateOne(o);
    return { changed: [...s, ...i], cycles: i.length, ms: Ne() - e };
  }
  recalcRangeBearing() {
    return this.onValuesChanged(this.store.getRangeBearingKeys());
  }
  invalidateRow(e) {
    return this.onValuesChanged(this.graph.formulasReferencing(e));
  }
  invalidateField(e) {
    return this.onValuesChanged(this.graph.formulasReferencingField(e));
  }
  offsetFormula(e, t, s, i) {
    const o = this.store.getFormula(e, t);
    if (!o) return "";
    const n = (() => {
      const l = this._accessor.flatIndexOfRowId(e);
      return l === -1 ? e : this._accessor.rowIdAtFlat(l + s) ?? e;
    })();
    (() => {
      const l = this._accessor.visibleFields(), d = l.indexOf(t);
      return d === -1 ? t : l[d + i] ?? t;
    })();
    const a = this._shiftAst(o.ast, s, i);
    return Ao(a, { rowId: n }, this._accessor);
  }
  _shiftAst(e, t, s) {
    const i = (n) => {
      if (n.kind === "rel") return { ...n, dRow: n.dollarRow ? n.dRow : n.dRow + t };
      let a = n.field;
      if (!n.dollarCol && s !== 0) {
        const d = this._accessor.visibleFields(), c = d.indexOf(n.field), h = c === -1 ? void 0 : d[c + s];
        if (!h) return { kind: "abs", rowId: "__dead__", field: "__dead__", dollarRow: n.dollarRow, dollarCol: n.dollarCol };
        a = h;
      }
      let l = n.rowId;
      if (!n.dollarRow && t !== 0) {
        const d = this._accessor.flatIndexOfRowId(n.rowId), c = d === -1 ? null : this._accessor.rowIdAtFlat(d + t);
        if (c === null) return { kind: "abs", rowId: "__dead__", field: "__dead__", dollarRow: n.dollarRow, dollarCol: n.dollarCol };
        l = c;
      }
      return { kind: "abs", rowId: l, field: a, dollarRow: n.dollarRow, dollarCol: n.dollarCol };
    }, o = (n) => {
      switch (n.t) {
        case "ref": {
          const a = i(n.ref);
          return a.kind === "abs" && a.rowId === "__dead__" ? { t: "error", code: "#REF" } : { t: "ref", ref: a };
        }
        case "range": {
          const a = i(n.ref.a), l = i(n.ref.b);
          return a.kind === "abs" && a.rowId === "__dead__" || l.kind === "abs" && l.rowId === "__dead__" ? { t: "error", code: "#REF" } : { t: "range", ref: { a, b: l } };
        }
        case "call":
          return { t: "call", name: n.name, args: n.args.map(o) };
        case "unary":
          return { t: "unary", op: n.op, arg: o(n.arg) };
        case "bin":
          return { t: "bin", op: n.op, left: o(n.left), right: o(n.right) };
        default:
          return n;
      }
    };
    return o(e);
  }
}
function Ne() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
class Lo {
  constructor() {
    this._onKeyDown = (e) => {
      e.stopPropagation(), e.key === "Enter" ? (e.preventDefault(), this._onCommit(this.input.value)) : e.key === "Escape" && this._onCancel();
    }, this._onBlur = () => {
      this._onCommit(this.input.value);
    };
  }
  mount(e, t, s, i) {
    this._container = e, this._onCommit = s, this._onCancel = i, e.setAttribute("aria-haspopup", "dialog"), e.setAttribute("aria-expanded", "true"), this.input = document.createElement("input"), this.input.type = "date", this.input.className = "og-cell-input", this.input.setAttribute("aria-label", t.column.header ?? ve(t, "editor.datePick"));
    const o = t.value;
    if (o) {
      const n = o instanceof Date ? o : new Date(o);
      isNaN(n.getTime()) || (this.input.value = Mt(n, "yyyy-MM-dd"));
    }
    this.input.addEventListener("keydown", this._onKeyDown), this.input.addEventListener("blur", this._onBlur), e.appendChild(this.input);
  }
  getValue() {
    var _a;
    return (_a = this.input) == null ? void 0 : _a.value;
  }
  focus() {
    var _a;
    (_a = this.input) == null ? void 0 : _a.focus();
  }
  destroy() {
    var _a, _b, _c;
    (_a = this._container) == null ? void 0 : _a.setAttribute("aria-expanded", "false"), (_b = this.input) == null ? void 0 : _b.removeEventListener("keydown", this._onKeyDown), (_c = this.input) == null ? void 0 : _c.removeEventListener("blur", this._onBlur);
  }
}
function os(r) {
  return r.map((e) => typeof e == "string" ? { label: e, value: e } : { label: e.label ?? e.text ?? String(e.value ?? ""), value: e.value });
}
class Io {
  constructor(e = [], t) {
    this._options = os(e), this._optionsFn = t ?? null;
  }
  mount(e, t, s, i) {
    this._container = e, this._onCommit = s, this._onCancel = i, e.setAttribute("aria-haspopup", "listbox"), e.setAttribute("aria-expanded", "true"), this.select = document.createElement("select"), this.select.className = "og-cell-select", this.select.setAttribute("aria-label", t.column.header ?? ve(t, "editor.select"));
    const o = this._optionsFn ? os(this._optionsFn(t.row, t.rowIndex)) : this._options;
    for (const a of o) {
      const l = document.createElement("option");
      l.value = String(a.value), l.textContent = a.label, this.select.appendChild(l);
    }
    const n = t.value == null ? "" : String(t.value);
    o.some((a) => String(a.value) === n) && (this.select.value = n), this.select.addEventListener("change", () => s(this.select.value)), this.select.addEventListener("blur", () => s(this.select.value)), this.select.addEventListener("keydown", (a) => {
      a.key === "Escape" && i();
    }), e.appendChild(this.select);
  }
  getValue() {
    var _a;
    return (_a = this.select) == null ? void 0 : _a.value;
  }
  focus() {
    var _a;
    (_a = this.select) == null ? void 0 : _a.focus();
  }
  destroy() {
    var _a;
    (_a = this._container) == null ? void 0 : _a.setAttribute("aria-expanded", "false");
  }
}
class To {
  constructor() {
    this._onKeyDown = (e) => {
      e.stopPropagation(), e.key === "Enter" || e.key === "Tab" ? (e.preventDefault(), this._onCommit(this.input.value)) : e.key === "Escape" && this._onCancel();
    }, this._onBlur = () => {
      this._onCommit(this.input.value);
    };
  }
  mount(e, t, s, i) {
    this._onCommit = s, this._onCancel = i, this.input = document.createElement("input"), this.input.type = "text", this.input.value = t.value == null ? "" : String(t.value), this.input.style.cssText = `
      width:100%;height:100%;border:none;outline:none;padding:0 8px;
      font-size:var(--og-font-size,13px);font-family:var(--og-font-family,sans-serif);
      background:var(--og-row-bg,#fff);box-sizing:border-box;
    `, this.input.addEventListener("keydown", this._onKeyDown), this.input.addEventListener("blur", this._onBlur), e.appendChild(this.input);
  }
  getValue() {
    var _a;
    return (_a = this.input) == null ? void 0 : _a.value;
  }
  focus() {
    var _a, _b;
    (_a = this.input) == null ? void 0 : _a.focus(), (_b = this.input) == null ? void 0 : _b.select();
  }
  destroy() {
    var _a, _b;
    (_a = this.input) == null ? void 0 : _a.removeEventListener("keydown", this._onKeyDown), (_b = this.input) == null ? void 0 : _b.removeEventListener("blur", this._onBlur);
  }
}
class Do {
  constructor(e) {
    this._onKeyDown = (t) => {
      t.stopPropagation(), t.key === "Enter" || t.key === "Tab" ? (t.preventDefault(), this._commit()) : t.key === "Escape" && this._onCancel();
    }, this._onBlur = () => {
      this._commit();
    }, this.min = e == null ? void 0 : e.min, this.max = e == null ? void 0 : e.max, this.step = e == null ? void 0 : e.step;
  }
  mount(e, t, s, i) {
    this._onCommit = s, this._onCancel = i, this.input = document.createElement("input"), this.input.type = "number", this.input.value = t.value == null ? "" : String(t.value), this.min != null && (this.input.min = String(this.min)), this.max != null && (this.input.max = String(this.max)), this.step != null && (this.input.step = String(this.step)), this.input.style.cssText = `
      width:100%;height:100%;border:none;outline:none;padding:0 8px;
      font-size:var(--og-font-size,13px);text-align:right;
      background:var(--og-row-bg,#fff);box-sizing:border-box;
    `, this.input.addEventListener("keydown", this._onKeyDown), this.input.addEventListener("blur", this._onBlur), e.appendChild(this.input);
  }
  _commit() {
    const e = this.input.value === "" ? null : Number(this.input.value);
    this._onCommit(e);
  }
  getValue() {
    var _a, _b;
    return ((_a = this.input) == null ? void 0 : _a.value) === "" ? null : Number((_b = this.input) == null ? void 0 : _b.value);
  }
  focus() {
    var _a, _b;
    (_a = this.input) == null ? void 0 : _a.focus(), (_b = this.input) == null ? void 0 : _b.select();
  }
  destroy() {
    var _a, _b;
    (_a = this.input) == null ? void 0 : _a.removeEventListener("keydown", this._onKeyDown), (_b = this.input) == null ? void 0 : _b.removeEventListener("blur", this._onBlur);
  }
}
class rs {
  mount(e, t, s, i) {
    this._onCommit = s, e.style.cssText += "display:flex;align-items:center;justify-content:center;", this.chk = document.createElement("input"), this.chk.type = "checkbox", this.chk.checked = !!t.value, this.chk.style.cursor = "pointer", this.chk.addEventListener("change", () => s(this.chk.checked)), e.appendChild(this.chk);
  }
  getValue() {
    var _a;
    return (_a = this.chk) == null ? void 0 : _a.checked;
  }
  focus() {
    var _a;
    (_a = this.chk) == null ? void 0 : _a.focus();
  }
  destroy() {
  }
}
const ns = /* @__PURE__ */ new Map();
function Ce(r, e) {
  ns.set(r, e);
}
Ce("number", (r, e) => {
  const t = {};
  return e && (e.min != null && (t.min = e.min), e.max != null && (t.max = e.max), e.step != null && (t.step = e.step)), new Do(t);
}), Ce("date", () => new Lo()), Ce("boolean", () => new rs()), Ce("checkbox", () => new rs()), Ce("select", (r, e) => new Io((e ? e.options : r.options) ?? [], r.optionsFn));
function as(r) {
  const e = r.editor;
  let t, s;
  e ? typeof e == "string" ? (t = e, s = void 0) : (t = e.type, s = e) : (t = String(r.type ?? ""), s = void 0);
  const i = ns.get(t);
  return i ? i(r, s) : new To();
}
function Ie(r) {
  const e = typeof r.renderer == "string" ? r.renderer : r.renderer && typeof r.renderer == "object" ? r.renderer.type : "";
  return r.type === "boolean" || r.type === "checkbox" || e === "checkbox" || e === "switch";
}
class Oo {
  constructor(e) {
    this._activeEditor = null, this._editCell = null, this._focusCell = null, this._dragColIdx = null, this._d = e;
  }
  get activeEditor() {
    return this._activeEditor;
  }
  get editCell() {
    return this._editCell;
  }
  get focusCell() {
    return this._focusCell;
  }
  get dragColIdx() {
    return this._dragColIdx;
  }
  set dragColIdx(e) {
    this._dragColIdx = e;
  }
  setFocusCell(e, t) {
    this._focusCell = { ri: e, ci: t }, this._d.scrollToRow(e), this._d.doRender();
    const s = this._d.getVisibleLeaves()[t], i = this._d.data.getRowByIndex(e);
    if (s && i) {
      const o = i[s.field];
      this._d.announce(this._d.t("editor.cellPositionAnnounce", { row: e + 1, col: t + 1, header: s.header, value: o == null ? this._d.t("cell.emptyValue") : String(o) }));
    }
  }
  clearFocusCell() {
    this._focusCell = null;
  }
  startEditByKey(e, t) {
    var _a, _b, _c, _d, _e2, _f, _g;
    const s = this._d.getVisibleLeaves()[t];
    if (!s) return;
    if (Ie(s)) {
      const c = this._d.getOptions();
      if (s.editable !== false && (s.editable !== void 0 || c.editable)) {
        const u = this._d.data.getRowByIndex(e);
        u && this._d.writeCell(e, s.field, !u[s.field]);
      }
      return;
    }
    const i = this._d.data.getRowByIndex(e);
    if (s.editable === false || typeof s.editable == "function" && !s.editable(i, e)) return;
    this.commitEdit();
    const o = (_a = this._d.getRenderer()) == null ? void 0 : _a.getCellEl(e, t);
    if (!o) return;
    o.innerHTML = "";
    const n = as(s);
    this._activeEditor = n, this._editCell = { ri: e, ci: t };
    const a = { type: "editStart", rowIndex: e, columnIndex: t, field: s.field, oldValue: i == null ? void 0 : i[s.field], newValue: i == null ? void 0 : i[s.field], row: i, column: s };
    this._d.emit("editStart", a), (_c = (_b = this._d.getOptions()).onEditStart) == null ? void 0 : _c.call(_b, a), o.classList.add("og-editing");
    const d = { value: (((_e2 = (_d = this._d).hasCellFormula) == null ? void 0 : _e2.call(_d, e, s.field)) ? (_g = (_f = this._d).getCellFormula) == null ? void 0 : _g.call(_f, e, s.field) : null) ?? (i == null ? void 0 : i[s.field]), row: i, rowIndex: e, column: s, colIndex: t, isSelected: true, rowState: "none", t: (c, h) => this._d.t(c, h) };
    n.mount(o, d, (c) => this.commitEditWithValue(e, t, c), () => this.cancelEdit()), requestAnimationFrame(() => n.focus());
  }
  startEdit(e, t, s) {
    var _a, _b, _c, _d, _e2, _f;
    const i = this._d.getOptions();
    if (!i.editable) return;
    const o = this._d.getVisibleLeaves()[t];
    if (!o || Ie(o)) return;
    const n = this._d.data.getRowByIndex(e);
    if (o.editable === false || typeof o.editable == "function" && !o.editable(n, e) || !o.editable && !i.editable) return;
    this.commitEdit();
    const a = (_a = this._d.getRenderer()) == null ? void 0 : _a.getCellEl(e, t);
    if (!a) return;
    a.innerHTML = "";
    const l = as(o);
    this._activeEditor = l, this._editCell = { ri: e, ci: t };
    const d = { type: "editStart", rowIndex: e, columnIndex: t, field: o.field, oldValue: n == null ? void 0 : n[o.field], newValue: n == null ? void 0 : n[o.field], row: n, column: o };
    this._d.emit("editStart", d), (_b = i.onEditStart) == null ? void 0 : _b.call(i, d), a.classList.add("og-editing");
    const h = { value: (((_d = (_c = this._d).hasCellFormula) == null ? void 0 : _d.call(_c, e, o.field)) ? (_f = (_e2 = this._d).getCellFormula) == null ? void 0 : _f.call(_e2, e, o.field) : null) ?? (n == null ? void 0 : n[o.field]), row: n, rowIndex: e, column: o, colIndex: t, isSelected: true, rowState: "none", t: (u, g) => this._d.t(u, g) };
    l.mount(a, h, (u) => this.commitEditWithValue(e, t, u), () => this.cancelEdit()), requestAnimationFrame(() => l.focus());
  }
  commitEdit() {
    if (!this._activeEditor || !this._editCell) return;
    const e = this._activeEditor.getValue(), { ri: t, ci: s } = this._editCell;
    this._finishEdit(t, s, e, false);
  }
  commitEditWithValue(e, t, s) {
    this._finishEdit(e, t, s, false);
  }
  cancelEdit() {
    if (!this._editCell) return;
    const { ri: e, ci: t } = this._editCell;
    this._finishEdit(e, t, void 0, true);
  }
  _finishEdit(e, t, s, i) {
    var _a, _b, _c, _d, _e2, _f, _g, _h, _i2, _j, _k;
    if (!this._activeEditor) return;
    const o = this._d.getVisibleLeaves()[t], n = (_a = this._d.getRenderer()) == null ? void 0 : _a.getCellEl(e, t);
    if (n && (this._activeEditor.destroy(), n.classList.remove("og-editing")), this._activeEditor = null, this._editCell = null, !i && o) {
      const a = this._d.data.getCellValue(e, o.field), l = ((_c = (_b = this._d).hasCellFormula) == null ? void 0 : _c.call(_b, e, o.field)) ?? false;
      if (typeof s == "string" && s.trimStart().startsWith("=")) {
        (_e2 = (_d = this._d).setCellFormula) == null ? void 0 : _e2.call(_d, e, o.field, s);
        const c = this._d.data.getRowByIndex(e), h = this._d.getOptions(), u = { type: "editEnd", rowIndex: e, columnIndex: t, field: o.field, oldValue: a, newValue: s, row: c, column: o };
        this._d.emit("editEnd", u), (_f = h.onEditEnd) == null ? void 0 : _f.call(h, u), this._d.emit("dataChange", this._d.data.getData()), (_g = h.onDataChange) == null ? void 0 : _g.call(h, this._d.data.getData());
      } else if (s !== a || l) {
        l && ((_i2 = (_h = this._d).clearCellFormula) == null ? void 0 : _i2.call(_h, e, o.field)), this._d.data.updateCell(e, o.field, s);
        const c = this._d.data.getRowByIndex(e), h = this._d.getOptions(), u = { type: "editEnd", rowIndex: e, columnIndex: t, field: o.field, oldValue: a, newValue: s, row: c, column: o };
        this._d.emit("editEnd", u), (_j = h.onEditEnd) == null ? void 0 : _j.call(h, u), this._d.emit("dataChange", this._d.data.getData()), (_k = h.onDataChange) == null ? void 0 : _k.call(h, this._d.data.getData());
      }
    }
    this._d.doRender(), requestAnimationFrame(() => this._d.getContainer().focus({ preventScroll: true }));
  }
}
class $o {
  constructor(e) {
    this._d = e;
  }
  _readCssVar(e) {
    return getComputedStyle(this._d.getContainer()).getPropertyValue(e).trim();
  }
  _hexToXlsxRgb(e) {
    const t = e.trim(), s = t.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/i);
    if (s) return [s[1], s[2], s[3]].map((o) => parseInt(o).toString(16).padStart(2, "0")).join("").toUpperCase();
    const i = t.replace("#", "").toUpperCase();
    return i.length === 3 ? i[0] + i[0] + i[1] + i[1] + i[2] + i[2] : i.length === 6 ? i : "";
  }
  exportExcel(e) {
    const t = typeof e == "string" ? { filename: e } : e ?? {};
    let s = t.filename ?? "export";
    s.toLowerCase().endsWith(".xlsx") || (s += ".xlsx");
    const i = t.sheetName ?? (this._d.getOptions().ariaLabel || "Sheet1"), o = this._d.getData(), n = this._d.getColLayout().visibleLeaves.filter((d) => {
      var _a;
      return !((_a = t.exceptFields) == null ? void 0 : _a.includes(d.field));
    }), a = t.includeHeader !== false, l = (this._d.getStrategy ?? ((d, c) => c))("cellSerializer", (d, c, h) => c.type === "number" && typeof d == "number" ? d : typeof d == "boolean" ? d ? "✓" : "" : typeof d == "object" ? "" : String(d));
    import("./xlsx.min-Bbz2ZypC.js").then((d) => d.x).then(({ utils: d, writeFile: c }) => {
      var _a, _b, _c;
      const h = [];
      a && h.push(n.map((E) => E.header));
      for (const E of o) h.push(n.map((W) => {
        const M = E[W.field];
        if (t.maskOnExport && W.mask && this._d.getMaskEnabled(W.field)) return Ge(M == null ? "" : String(M), W.mask);
        const L = M;
        return L == null || L === "" ? "" : l(L, W, E);
      }));
      const u = d.aoa_to_sheet(h), g = this._d.getColWidths(), p = this._d.getColLayout();
      u["!cols"] = n.map((E) => ({ wpx: g[p.getColumnIndex(E.field)] ?? 100 })), u["!rows"] = h.map((E, W) => ({ hpx: W === 0 && a ? 22 : 19 }));
      const f = t.styleMode ?? "theme";
      let m = "1565C0", _ = "FFFFFF", w = "FFFFFF", y = "EEF2FF", R = "212121", A = "BDBDBD", S = 10;
      if (f === "theme") {
        const E = (M) => this._hexToXlsxRgb(M);
        m = E(this._readCssVar("--og-header-bg")) || m, _ = E(this._readCssVar("--og-header-color")) || _, w = E(this._readCssVar("--og-row-bg")) || w, y = E(this._readCssVar("--og-row-alt-bg")) || y, R = E(this._readCssVar("--og-row-color")) || R, A = E(this._readCssVar("--og-border-color")) || A;
        const W = this._readCssVar("--og-font-size");
        W && (S = Math.max(8, Math.round(parseFloat(W) * 0.75)));
      }
      const O = f === "none", z = ((_b = (_a = this._d).getMeta) == null ? void 0 : _b.call(_a).exportFont) ?? "맑은 고딕", $ = { hdrFont: O ? {} : { bold: true, color: { rgb: _ }, sz: S, name: z }, dataFont: O ? {} : { sz: S, color: { rgb: R }, name: z }, hdrFill: O ? {} : { patternType: "solid", fgColor: { rgb: m } }, evenFill: O ? {} : { patternType: "solid", fgColor: { rgb: w } }, oddFill: O ? {} : { patternType: "solid", fgColor: { rgb: y } }, hdrBorder: O ? {} : { top: { style: "medium", color: { rgb: m } }, bottom: { style: "medium", color: { rgb: m } }, left: { style: "thin", color: { rgb: m } }, right: { style: "thin", color: { rgb: m } } }, dataBorder: O ? {} : { top: { style: "thin", color: { rgb: A } }, bottom: { style: "thin", color: { rgb: A } }, left: { style: "thin", color: { rgb: A } }, right: { style: "thin", color: { rgb: A } } } };
      h.forEach((E, W) => {
        const M = a && W === 0, K = (a ? W - 1 : W) % 2 === 0;
        E.forEach((ie, P) => {
          const Y = d.encode_cell({ r: W, c: P });
          u[Y] || (u[Y] = { t: "s", v: "" });
          const ke = n[P], Oe = ke.type === "number" || ke.align === "right", te = M ? "center" : Oe ? "right" : ke.align ?? "left";
          u[Y].s = { font: M ? $.hdrFont : $.dataFont, fill: M ? $.hdrFill : K ? $.evenFill : $.oddFill, border: M ? $.hdrBorder : $.dataBorder, alignment: { horizontal: te, vertical: "center", wrapText: false } };
        });
      });
      const C = d.book_new();
      d.book_append_sheet(C, u, i), c(C, s, { cellStyles: true }), (_c = t.onAfter) == null ? void 0 : _c.call(t, new Blob([]));
    }).catch(() => {
      console.error("Excel 내보내기 실패: xlsx 패키지를 확인하세요.");
    });
  }
  exportCsv(e) {
    const t = typeof e == "string" ? { filename: e } : e ?? {}, s = this._d.getData(), i = this._d.getColLayout().visibleLeaves, o = i.map((l) => `"${l.header}"`).join(","), n = s.map((l) => i.map((d) => {
      const c = l[d.field] ?? "";
      if (t.maskOnExport && d.mask && this._d.getMaskEnabled(d.field)) return Ge(String(c), d.mask);
      const h = c;
      return typeof h == "string" && h.includes(",") ? `"${h}"` : h;
    }).join(",")), a = t.filename ?? "export.csv";
    Lt("\uFEFF" + [o, ...n].join(`
`), a);
  }
  exportJson(e) {
    const t = typeof e == "string" ? e : (e == null ? void 0 : e.filename) ?? "export.json";
    Lt(JSON.stringify(this._d.getData(), null, 2), t, "application/json");
  }
  print(e) {
    var _a, _b;
    const t = (e == null ? void 0 : e.title) ?? "OPEN_GRID", s = (e == null ? void 0 : e.footerText) ?? "", i = this._d.getData(), o = this._d.getColLayout().visibleLeaves.filter((p) => {
      var _a2;
      return !((_a2 = e == null ? void 0 : e.excludeFields) == null ? void 0 : _a2.includes(p.field));
    }), n = o.map((p) => `<th>${p.header ?? p.field}</th>`).join(""), a = i.map((p) => `<tr>${o.map((f) => `<td>${String(p[f.field] ?? "")}</td>`).join("")}</tr>`).join(""), l = s ? `<div class="og-print-footer">${s}</div>` : "", c = (((_b = (_a = this._d).getMeta) == null ? void 0 : _b.call(_a)) ?? { intlLocale: "ko-KR" }).intlLocale, h = this._d.t ? this._d.t("export.printSummary", { rows: i.length, cols: o.length, date: (/* @__PURE__ */ new Date()).toLocaleString(c) }) : `${i.length}행 × ${o.length}열 · ${(/* @__PURE__ */ new Date()).toLocaleString(c)}`, u = `<!DOCTYPE html>
<html lang="${c}"><head>
<meta charset="UTF-8"><title>${t}</title>
<style>
  @page{margin:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;margin:0;padding:1cm;}
  h2{margin:0 0 10px;font-size:14px;color:#333;}
  p{margin:0 0 8px;font-size:11px;color:#999;}
  table{border-collapse:collapse;width:100%;}
  th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;white-space:nowrap;}
  th{background:#f5f5f5;font-weight:600;color:#333;}
  tr:nth-child(even) td{background:#fafafa;}
  .og-print-footer{position:fixed;bottom:0;left:0;right:0;padding:6px 1cm;font-size:10px;color:#888;border-top:1px solid #e5e7eb;background:#fff;text-align:center;}
</style>
</head><body>
<h2>${t}</h2>
<p>${h}</p>
<table>
  <thead><tr>${n}</tr></thead>
  <tbody>${a}</tbody>
</table>
${l}
<script>window.addEventListener('load',()=>{window.print();window.addEventListener('afterprint',()=>window.close());});<\/script>
</body></html>`, g = window.open("", "_blank", "width=960,height=640");
    g && (g.document.write(u), g.document.close());
  }
  exportSheetsExcel(e) {
    const t = this._d.getWsManager();
    if (!t) {
      this.exportExcel(e ?? "workbook");
      return;
    }
    const s = e ?? "workbook.xlsx", i = (this._d.getStrategy ?? ((o, n) => n))("cellSerializer", (o, n, a) => typeof o == "boolean" ? o ? "✓" : "" : n.type === "number" && typeof o == "number" ? o : String(o));
    import("./xlsx.min-Bbz2ZypC.js").then((o) => o.x).then(({ utils: o, writeFile: n }) => {
      const a = o.book_new(), l = this._d.getOptions();
      for (const d of t.getNames()) {
        const c = t.get(d), h = c.columns.length ? c.columns : l.columns, u = [h.map((p) => p.header)];
        for (const p of c.data) u.push(h.map((f) => {
          const m = p[f.field];
          return m == null ? "" : i(m, f, p);
        }));
        const g = o.aoa_to_sheet(u);
        g["!cols"] = h.map(() => ({ wpx: 100 })), o.book_append_sheet(a, g, d);
      }
      n(a, s.endsWith(".xlsx") ? s : s + ".xlsx", { cellStyles: true });
    }).catch(() => console.error("exportSheetsExcel: xlsx 패키지를 확인하세요."));
  }
}
class zo {
  constructor(e) {
    this._d = e;
  }
  fmtNum(e, t) {
    if (!t) return Math.round(e).toLocaleString("ko-KR");
    const s = t.match(/[#0][#0,]*(?:\.[#0]+)?|\d+/), i = s ? t.slice(0, s.index) : "", o = s ? t.slice(s.index + s[0].length) : "", n = s ? s[0] : t, a = n.includes("#") || n.includes(","), l = n.match(/\.(\d+)$/), d = l ? parseInt(l[1], 10) : /^\d+$/.test(n) ? parseInt(n, 10) : 0, c = Math.abs(e).toFixed(d), [h = "0", u] = c.split("."), g = a ? h.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : h, p = u !== void 0 ? `${g}.${u}` : g, f = `${i}${p}${o}`;
    return e < 0 ? `-${f}` : f;
  }
  computeValues() {
    const e = this._d.getOptions().footer;
    if (!e || e.length === 0) return [];
    const t = this._d.getData();
    return e.filter((s) => s.field && s.op).map((s) => {
      const i = s.field, o = s.op, n = t.map((u) => u[i]).filter((u) => u != null && u !== "" && !He(u));
      let a = null;
      const l = o.toUpperCase(), d = (this._d.getStrategy ?? ((u, g) => g))("summaryOp", null);
      if (d) {
        const u = d(l, n, i);
        if (u != null) return { _field: i, _value: u, _formatted: this.fmtNum(u, s.format) };
      }
      if (l === "SUM") a = n.length > 0 ? v.sum(n.map((u) => String(u))) : null;
      else if (l === "AVG") a = n.length > 0 ? v.sum(n.map((u) => String(u))).div(v.from(String(n.length))) : null;
      else if (l === "COUNT") {
        const u = n.length;
        return { _field: i, _value: u, _formatted: u.toLocaleString("ko-KR") };
      } else l === "MAX" ? a = n.length > 0 ? v.max(n.map((u) => String(u))) : null : l === "MIN" && (a = n.length > 0 ? v.min(n.map((u) => String(u))) : null);
      if (!a) return { _field: i, _value: null, _formatted: "" };
      const c = a.toNumber(), h = this.fmtNum(c, s.format);
      return { _field: i, _value: c, _formatted: h };
    });
  }
  render() {
    var _a, _b;
    const e = this._d.getContainer();
    (_a = e.querySelector(".og-footer-bar")) == null ? void 0 : _a.remove();
    const s = this._d.getOptions(), i = s.footer;
    if (!i || i.length === 0) return;
    const o = this._d.getColLayout().visibleLeaves, n = this._d.getColWidths() ?? o.map((h) => h.width ?? 100), a = new Map(this.computeValues().map((h) => [h._field, h])), l = document.createElement("div");
    l.className = "og-footer-bar", l.style.cssText = ["display:flex;align-items:stretch;", `min-height:${s.footerHeight}px;`, "border-top:2px solid var(--og-primary,#1976d2);", "background:var(--og-header-bg,#f5f5f5);", "overflow:hidden;flex-shrink:0;font-size:13px;font-weight:600;"].join("");
    let d = 0;
    if (s.stateColumn && (d += 24), s.draggable && (d += 18), s.rowNumber && (d += 44), s.checkColumn && (d += 36), d > 0) {
      const h = document.createElement("div");
      h.style.cssText = `width:${d}px;flex-shrink:0;border-right:1px solid var(--og-border-color,#e0e0e0);`, l.appendChild(h);
    }
    let c = 0;
    for (const h of i) {
      const u = Math.max(1, h.colspan ?? 1);
      let g = 0;
      for (let w = 0; w < u; w++) g += n[c + w] ?? 100;
      const p = o[c];
      c += u;
      const f = document.createElement("div");
      f.style.cssText = [`width:${g}px;min-width:${g}px;flex-shrink:0;`, "padding:4px 8px;box-sizing:border-box;overflow:hidden;", "border-right:1px solid var(--og-border-color,#e0e0e0);", "white-space:nowrap;text-overflow:ellipsis;"].join("");
      const m = h.field, _ = m ? a.get(m) : null;
      if (_) {
        const w = _._formatted ?? String(_._value ?? ""), y = h.label ? `${h.label}: ` : "";
        f.textContent = y + w, f.title = `${((_b = h.op) == null ? void 0 : _b.toUpperCase()) ?? ""} = ${w}`, f.style.color = "var(--og-primary,#1976d2)", f.style.textAlign = h.align ?? ((p == null ? void 0 : p.type) === "number", "right");
      } else h.label && (f.textContent = h.label, f.style.textAlign = h.align ?? "left", f.style.color = "var(--og-row-color,#212121)");
      l.appendChild(f);
    }
    s.footerPosition === "top" ? e.insertBefore(l, e.firstChild) : e.appendChild(l);
  }
}
class Bo {
  constructor(e) {
    this._d = e;
  }
  handleKeyDown(e) {
    var _a, _b, _c, _d, _e2;
    const t = this._d.getEditMgr();
    if (t.activeEditor) return;
    this._d.handleCellKeyEvt("cellKeyDown", e);
    const s = this._d.getData(), i = this._d.getColLayout(), o = s.rowCount, n = i.visibleLeaves.length;
    if (o === 0 || n === 0) return;
    if ((e.ctrlKey || e.metaKey) && e.key === "c") {
      e.preventDefault(), this._copyToClipboard();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      e.preventDefault(), this._pasteFromClipboard();
      return;
    }
    const a = ((_b = (_a = this._d).getRangeHooks) == null ? void 0 : _b.call(_a)) ?? null;
    if ((e.ctrlKey || e.metaKey) && (a == null ? void 0 : a.isEnabled()) && (e.key === "d" || e.key === "D")) {
      e.preventDefault(), a.ctrlFill("down");
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (a == null ? void 0 : a.isEnabled()) && (e.key === "r" || e.key === "R")) {
      e.preventDefault(), a.ctrlFill("right");
      return;
    }
    if (e.shiftKey && (a == null ? void 0 : a.isEnabled()) && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const d = e.key === "ArrowDown" ? "down" : e.key === "ArrowUp" ? "up" : e.key === "ArrowLeft" ? "left" : "right";
      a.extendFocus(d);
      return;
    }
    const l = this._d.getOptions();
    if ((e.ctrlKey || e.metaKey) && l.draggable && t.focusCell) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const d = t.focusCell.ci !== void 0 ? t.focusCell.ri : 0;
        d < o - 1 && (this._d.handleRowDrop(d, d + 1), this._d.setFocusCell(d + 1, t.focusCell.ci), this._d.announce(this._d.t("row.moveAnnounce", { from: d + 1, to: d + 2 })));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const d = t.focusCell.ri;
        d > 0 && (this._d.handleRowDrop(d, d - 1), this._d.setFocusCell(d - 1, t.focusCell.ci), this._d.announce(this._d.t("row.moveAnnounce", { from: d + 1, to: d })));
        return;
      }
    }
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const d = t.focusCell, c = d ? Math.min(d.ri + 1, o - 1) : 0;
        this._d.setFocusCell(c, (d == null ? void 0 : d.ci) ?? 0);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const d = t.focusCell, c = d ? Math.max(d.ri - 1, 0) : 0;
        this._d.setFocusCell(c, (d == null ? void 0 : d.ci) ?? 0);
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        const d = t.focusCell;
        if (!d) {
          this._d.setFocusCell(0, 0);
          break;
        }
        d.ci < n - 1 ? this._d.setFocusCell(d.ri, d.ci + 1) : d.ri < o - 1 && this._d.setFocusCell(d.ri + 1, 0);
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        const d = t.focusCell;
        if (!d) {
          this._d.setFocusCell(0, 0);
          break;
        }
        d.ci > 0 ? this._d.setFocusCell(d.ri, d.ci - 1) : d.ri > 0 && this._d.setFocusCell(d.ri - 1, n - 1);
        break;
      }
      case "Tab": {
        e.preventDefault();
        const d = t.focusCell;
        if (!d) {
          this._d.setFocusCell(0, 0);
          break;
        }
        e.shiftKey ? d.ci > 0 ? this._d.setFocusCell(d.ri, d.ci - 1) : d.ri > 0 && this._d.setFocusCell(d.ri - 1, n - 1) : d.ci < n - 1 ? this._d.setFocusCell(d.ri, d.ci + 1) : d.ri < o - 1 && this._d.setFocusCell(d.ri + 1, 0);
        break;
      }
      case "Home": {
        if (e.preventDefault(), e.ctrlKey || e.metaKey) this._d.setFocusCell(0, 0);
        else {
          const d = t.focusCell;
          this._d.setFocusCell((d == null ? void 0 : d.ri) ?? 0, 0);
        }
        break;
      }
      case "End": {
        if (e.preventDefault(), e.ctrlKey || e.metaKey) this._d.setFocusCell(o - 1, n - 1);
        else {
          const d = t.focusCell;
          this._d.setFocusCell((d == null ? void 0 : d.ri) ?? 0, n - 1);
        }
        break;
      }
      case "PageDown": {
        e.preventDefault();
        const d = t.focusCell, c = this._d.getOptions().pageSize ?? 10, h = Math.min(d ? d.ri + c : c - 1, o - 1);
        this._d.setFocusCell(h, (d == null ? void 0 : d.ci) ?? 0);
        break;
      }
      case "PageUp": {
        e.preventDefault();
        const d = t.focusCell, c = this._d.getOptions().pageSize ?? 10, h = d ? Math.max(d.ri - c, 0) : 0;
        this._d.setFocusCell(h, (d == null ? void 0 : d.ci) ?? 0);
        break;
      }
      case " ": {
        if (t.focusCell) {
          e.preventDefault();
          const d = t.focusCell.ri, c = this._d.getRowMgr();
          this._d.getOptions().checkColumn ? (c.check(d, !c.checkedRows.has(d)), this._d.doRender()) : (c.selectToggle(d), this._d.doRender());
        }
        break;
      }
      case "F2":
      case "Enter": {
        t.focusCell && this._d.getOptions().editable && (e.preventDefault(), t.startEditByKey(t.focusCell.ri, t.focusCell.ci));
        break;
      }
      case "Escape": {
        (_e2 = (_d = (_c = this._d).getRangeHooks) == null ? void 0 : _d.call(_c)) == null ? void 0 : _e2.clear(), t.clearFocusCell(), this._d.doRender();
        break;
      }
    }
  }
  _copyToClipboard() {
    var _a, _b, _c, _d;
    if (!this._d.getOptions().clipboard) return;
    const t = (_b = (_a = this._d).getRangeHooks) == null ? void 0 : _b.call(_a);
    if ((t == null ? void 0 : t.isEnabled()) && t.hasSelection()) {
      const a = t.copyText();
      if (a != null) {
        (_c = navigator.clipboard) == null ? void 0 : _c.writeText(a).catch(() => {
        });
        return;
      }
    }
    const s = this._d.getEditMgr(), i = this._d.getColLayout(), o = this._d.getData();
    let n = "";
    if (s.focusCell) {
      const { ri: a, ci: l } = s.focusCell, d = i.visibleLeaves[l];
      d && (n = String(o.getCellValue(a, d.field) ?? ""));
    } else if (this._d.getRowMgr().selectedRows.size > 0) {
      const a = i.visibleLeaves;
      n = [...this._d.getRowMgr().selectedRows].sort((d, c) => d - c).map((d) => {
        const c = o.getRowByIndex(d);
        return a.map((h) => String((c == null ? void 0 : c[h.field]) ?? "")).join("	");
      }).join(`
`);
    }
    n && ((_d = navigator.clipboard) == null ? void 0 : _d.writeText(n).catch(() => {
    }));
  }
  _pasteFromClipboard() {
    var _a, _b, _c;
    const e = this._d.getOptions();
    if (!e.clipboard || !e.editable) return;
    const t = this._d.getEditMgr(), s = (_b = (_a = this._d).getRangeHooks) == null ? void 0 : _b.call(_a);
    (_c = navigator.clipboard) == null ? void 0 : _c.readText().then((i) => {
      var _a2, _b2;
      if (!i || (s == null ? void 0 : s.isEnabled()) && s.hasSelection() && s.pasteText(i) || !t.focusCell) return;
      const { ri: o, ci: n } = t.focusCell, a = i.split(`
`), l = this._d.getColLayout().visibleLeaves, d = this._d.getData(), c = [];
      for (let h = 0; h < a.length; h++) {
        const u = a[h].split("	");
        for (let g = 0; g < u.length; g++) {
          const p = o + h, f = n + g, m = l[f];
          m && p < d.rowCount && c.push({ rowIndex: p, field: m.field, value: u[g] });
        }
      }
      c.length && ((_b2 = (_a2 = this._d).writeCells) == null ? void 0 : _b2.call(_a2, c));
    }).catch(() => {
    });
  }
}
class Ho {
  constructor(e) {
    this._sortList = [], this._filters = {}, this._d = e;
  }
  get sortList() {
    return this._sortList;
  }
  get filters() {
    return this._filters;
  }
  handleSortClick(e, t) {
    var _a, _b, _c;
    const s = this._d.getOptions();
    if (!s.sortable) return;
    const i = this._sortList.findIndex((a) => a.field === e);
    if (i >= 0) {
      const a = this._sortList[i];
      a.dir === "asc" ? a.dir = "desc" : this._sortList.splice(i, 1);
    } else (!t || !s.multiSort) && (this._sortList = []), this._sortList.push({ field: e, dir: "asc" });
    this._d.getData().applySort(this._sortList), (_b = (_a = this._d).onReproject) == null ? void 0 : _b.call(_a), this._d.renderHeader(), this._d.doRender();
    const o = this._sortList.find((a) => a.field === e), n = this._d.t(o ? o.dir === "asc" ? "sort.asc" : "sort.desc" : "sort.none");
    this._d.announce(this._d.t("sort.announce", { field: e, dir: n })), this._d.emit("sortChange", { sortList: this._sortList }), (_c = s.onSortChange) == null ? void 0 : _c.call(s, { field: e, dir: (o == null ? void 0 : o.dir) ?? "asc", sortList: this._sortList });
  }
  sort(e, t = "asc") {
    var _a, _b;
    if (Array.isArray(e)) this._sortList = e;
    else {
      const s = this._sortList.findIndex((i) => i.field === e);
      s >= 0 ? this._sortList[s].dir = t : this._sortList = [{ field: e, dir: t }], this._d.getOptions().multiSort || (this._sortList = this._sortList.slice(-1));
    }
    this._d.getData().applySort(this._sortList), (_b = (_a = this._d).onReproject) == null ? void 0 : _b.call(_a), this._d.renderHeader(), this._d.doRender(), this._d.emit("sortChange", { sortList: this._sortList });
  }
  resetSort() {
    var _a, _b;
    this._sortList = [], this._d.getData().applySort([]), (_b = (_a = this._d).onReproject) == null ? void 0 : _b.call(_a), this._d.renderHeader(), this._d.doRender();
  }
  initSort(e) {
    var _a, _b;
    this._sortList = [...e], this._d.getData().applySort(this._sortList), (_b = (_a = this._d).onReproject) == null ? void 0 : _b.call(_a);
  }
  getSortState() {
    return [...this._sortList];
  }
  setFilter(e, t) {
    var _a, _b;
    this._filters[e] = t, this.applyFilters(), this._d.renderHeader(), this._d.doRender(), this._d.emit("filterChange", { field: e, filterItems: t, allFilters: this._filters }), (_b = (_a = this._d.getOptions()).onFilterChange) == null ? void 0 : _b.call(_a, { field: e, filterItems: t, allFilters: this._filters });
  }
  resetFilter(e) {
    e ? delete this._filters[e] : this._filters = {}, this.applyFilters(), this._d.renderHeader(), this._d.doRender();
  }
  getFilterState() {
    return { ...this._filters };
  }
  restoreFilter(e) {
    this._filters = { ...e }, this.applyFilters();
  }
  applyFilters() {
    var _a, _b, _c, _d;
    const e = this._d.getData();
    e.setFindFilter(this._d.getFindFilter(), this._d.getColLayout().visibleLeaves.map((s) => s.field)), e.applyFilter(this._filters), (_b = (_a = this._d).onReproject) == null ? void 0 : _b.call(_a);
    const t = e.rowCount;
    (_c = this._d.getVs()) == null ? void 0 : _c.setTotalRows(t), (_d = this._d.getPagination()) == null ? void 0 : _d.setTotalRows(t);
  }
}
class Po {
  constructor(e) {
    this._bar = null, this._input = null, this._count = null, this._lbl = null, this._close = null, this._filter = "", this._d = e;
  }
  get findFilter() {
    return this._filter;
  }
  init(e) {
    const t = document.createElement("div");
    t.className = "og-find-bar", t.hidden = true;
    const s = document.createElement("span");
    s.className = "og-find-label", s.textContent = this._d.t("findBar.label");
    const i = document.createElement("input");
    i.type = "text", i.className = "og-find-input", i.placeholder = this._d.t("findBar.placeholder"), i.setAttribute("aria-label", this._d.t("findBar.searchAria"));
    const o = document.createElement("span");
    o.className = "og-find-count";
    const n = document.createElement("button");
    n.className = "og-find-close", n.textContent = "✕", n.setAttribute("aria-label", this._d.t("findBar.closeAria")), t.appendChild(s), t.appendChild(i), t.appendChild(o), t.appendChild(n), e.insertBefore(t, e.firstChild), i.addEventListener("input", () => {
      this._filter = i.value.trim(), this._apply();
    }), i.addEventListener("keydown", (a) => {
      a.key === "Escape" && this.close();
    }), n.addEventListener("click", () => this.close()), this._bar = t, this._input = i, this._count = o, this._lbl = s, this._close = n;
  }
  refreshLabels() {
    this._lbl && (this._lbl.textContent = this._d.t("findBar.label")), this._input && (this._input.placeholder = this._d.t("findBar.placeholder"), this._input.setAttribute("aria-label", this._d.t("findBar.searchAria"))), this._close && this._close.setAttribute("aria-label", this._d.t("findBar.closeAria")), this._count && this._filter && (this._count.textContent = this._d.t("findBar.countBadge", { n: this._d.getData().rowCount }));
  }
  open() {
    this._bar && (this._bar.hidden = false, this._input.focus(), this._input.select());
  }
  close() {
    this._bar && (this._bar.hidden = true, this._filter = "", this._input.value = "", this._count && (this._count.textContent = ""), this._apply());
  }
  _apply() {
    var _a, _b;
    const e = this._d.getData(), t = this._d.getColLayout().visibleLeaves.map((i) => i.field);
    e.setFindFilter(this._filter, t), e.applyFilter(this._d.getFilters());
    const s = e.rowCount;
    (_a = this._d.getVs()) == null ? void 0 : _a.setTotalRows(s), (_b = this._d.getPagination()) == null ? void 0 : _b.setTotalRows(s), this._count && (this._count.textContent = this._filter ? this._d.t("findBar.countBadge", { n: s }) : ""), this._d.doRender();
  }
}
class No {
  constructor(e) {
    this._d = e;
  }
  handleCellClick(e, t, s) {
    var _a, _b, _c, _d, _e2, _f, _g, _h, _i2;
    const i = this._d.getOptions(), o = this._d.getRowMgr(), n = this._d.getEditMgr();
    i.selection === "single" || i.selection === "row" ? o.selectSingle(e) : i.selection === "multiple" ? s.ctrlKey || s.metaKey ? o.selectToggle(e) : o.selectSingle(e) : i.selection === "cells" && t >= 0 && ((_b = (_a = this._d).onCellsClick) == null ? void 0 : _b.call(_a, e, t, s.shiftKey));
    const a = this._d.getData().getRowByIndex(e), l = this._d.getColLayout().visibleLeaves[t];
    if (a && l) {
      const d = l.editable !== false && (l.editable !== void 0 || i.editable);
      if (Ie(l) && d) {
        const f = a[l.field];
        this._d.writeCell(e, l.field, !f);
      }
      if (l.type === "radio") {
        const f = l.group;
        for (const m of this._d.getColLayout().visibleLeaves) m.type === "radio" && m.field !== l.field && (!f || m.group === f) && this._d.getData().updateCell(e, m.field, false);
        this._d.writeCell(e, l.field, true);
      }
      let c = a[l.field];
      if (c === void 0 && l.formula) try {
        const f = l.formulaPrecision ?? 30, m = xt(l.formula, a, f);
        c = m instanceof v ? l.precision != null ? m.toFixed(l.precision) : m.toString() : String(m);
      } catch {
      }
      const h = { type: "cellClick", rowIndex: e, columnIndex: t, field: l.field, value: c, row: a, column: l, target: s.target, originalEvent: s };
      this._d.emit("cellClick", h), (_c = i.onCellClick) == null ? void 0 : _c.call(i, h);
      const u = { type: "rowClick", rowIndex: e, row: a, target: s.target, originalEvent: s };
      this._d.emit("rowClick", u), (_d = i.onRowClick) == null ? void 0 : _d.call(i, u);
      const g = l.type === "select";
      !(n.activeEditor != null && ((_e2 = n.editCell) == null ? void 0 : _e2.ri) === e && ((_f = n.editCell) == null ? void 0 : _f.ci) === t) && (i.editMode === "click" || g) && !Ie(l) && n.startEdit(e, t, s);
    }
    n.activeEditor && ((_g = n.editCell) == null ? void 0 : _g.ri) === e && ((_h = n.editCell) == null ? void 0 : _h.ci) === t || i.selection !== "cells" && (this._d.doRender(), this._d.emit("selectionChange", { rows: o.getSelections(), rowIndexes: [...o.selectedRows] }), (_i2 = i.onSelectionChange) == null ? void 0 : _i2.call(i, { rows: o.getSelections(), rowIndexes: [...o.selectedRows], cells: [] }));
  }
  handleCellDblClick(e, t, s) {
    var _a, _b;
    const i = this._d.getData().getRowByIndex(e), o = this._d.getColLayout().visibleLeaves[t];
    if (!i || !o) return;
    const n = this._d.getOptions(), a = { type: "cellDblClick", rowIndex: e, columnIndex: t, field: o.field, value: i[o.field], row: i, column: o, target: s.target, originalEvent: s };
    this._d.emit("cellDblClick", a), (_a = n.onCellDblClick) == null ? void 0 : _a.call(n, a);
    const l = { type: "rowDblClick", rowIndex: e, row: i, target: s.target, originalEvent: s };
    this._d.emit("rowDblClick", l), (_b = n.onRowDblClick) == null ? void 0 : _b.call(n, l), n.editMode === "dblclick" && this._d.getEditMgr().startEdit(e, t, s);
  }
  handleCellMouseOver(e, t, s) {
    var _a, _b;
    const i = this._d.getData().getRowByIndex(e), o = this._d.getColLayout().visibleLeaves[t];
    if (!i || !o) return;
    const n = this._d.getOptions(), a = { type: "cellMouseOver", rowIndex: e, columnIndex: t, field: o.field, value: i[o.field], row: i, column: o, target: s.target, originalEvent: s };
    this._d.emit("cellMouseOver", a), (_a = n.onCellMouseOver) == null ? void 0 : _a.call(n, a);
    const l = { type: "rowMouseOver", rowIndex: e, row: i, target: s.target, originalEvent: s };
    this._d.emit("rowMouseOver", l), (_b = n.onRowMouseOver) == null ? void 0 : _b.call(n, l);
  }
  handleCellMouseOut(e, t, s) {
    var _a, _b;
    const i = this._d.getData().getRowByIndex(e), o = this._d.getColLayout().visibleLeaves[t];
    if (!i || !o) return;
    const n = this._d.getOptions(), a = { type: "cellMouseOut", rowIndex: e, columnIndex: t, field: o.field, value: i[o.field], row: i, column: o, target: s.target, originalEvent: s };
    this._d.emit("cellMouseOut", a), (_a = n.onCellMouseOut) == null ? void 0 : _a.call(n, a);
    const l = { type: "rowMouseOut", rowIndex: e, row: i, target: s.target, originalEvent: s };
    this._d.emit("rowMouseOut", l), (_b = n.onRowMouseOut) == null ? void 0 : _b.call(n, l);
  }
  handleCellMouseDown(e, t, s) {
    var _a, _b, _c, _d;
    (_b = (_a = this._d).rangeMouseDown) == null ? void 0 : _b.call(_a, e, t, s);
    const i = this._d.getData().getRowByIndex(e), o = this._d.getColLayout().visibleLeaves[t];
    if (!i || !o) return;
    const n = this._d.getOptions(), a = { type: "cellMouseDown", rowIndex: e, columnIndex: t, field: o.field, value: i[o.field], row: i, column: o, target: s.target, originalEvent: s };
    this._d.emit("cellMouseDown", a), (_c = n.onCellMouseDown) == null ? void 0 : _c.call(n, a);
    const l = { type: "rowMouseDown", rowIndex: e, row: i, target: s.target, originalEvent: s };
    this._d.emit("rowMouseDown", l), (_d = n.onRowMouseDown) == null ? void 0 : _d.call(n, l);
  }
  handleCellMouseUp(e, t, s) {
    var _a, _b, _c, _d;
    (_b = (_a = this._d).rangeMouseUp) == null ? void 0 : _b.call(_a, e, t, s);
    const i = this._d.getData().getRowByIndex(e), o = this._d.getColLayout().visibleLeaves[t];
    if (!i || !o) return;
    const n = this._d.getOptions(), a = { type: "cellMouseUp", rowIndex: e, columnIndex: t, field: o.field, value: i[o.field], row: i, column: o, target: s.target, originalEvent: s };
    this._d.emit("cellMouseUp", a), (_c = n.onCellMouseUp) == null ? void 0 : _c.call(n, a);
    const l = { type: "rowMouseUp", rowIndex: e, row: i, target: s.target, originalEvent: s };
    this._d.emit("rowMouseUp", l), (_d = n.onRowMouseUp) == null ? void 0 : _d.call(n, l);
  }
  handleCellMouseMove(e, t, s) {
    var _a, _b, _c, _d;
    (_b = (_a = this._d).rangeMouseMove) == null ? void 0 : _b.call(_a, e, t, s);
    const i = this._d.getData().getRowByIndex(e), o = this._d.getColLayout().visibleLeaves[t];
    if (!i || !o) return;
    const n = this._d.getOptions(), a = { type: "cellMouseMove", rowIndex: e, columnIndex: t, field: o.field, value: i[o.field], row: i, column: o, target: s.target, originalEvent: s };
    this._d.emit("cellMouseMove", a), (_c = n.onCellMouseMove) == null ? void 0 : _c.call(n, a);
    const l = { type: "rowMouseMove", rowIndex: e, row: i, target: s.target, originalEvent: s };
    this._d.emit("rowMouseMove", l), (_d = n.onRowMouseMove) == null ? void 0 : _d.call(n, l);
  }
  handleCellKeyEvt(e, t) {
    var _a, _b, _c;
    const s = this._d.getEditMgr();
    if (!s.focusCell || s.activeEditor) return;
    const { ri: i, ci: o } = s.focusCell, n = this._d.getData().getRowByIndex(i), a = this._d.getColLayout().visibleLeaves[o];
    if (!n || !a) return;
    const l = this._d.getOptions(), d = { type: e, rowIndex: i, columnIndex: o, field: a.field, value: n[a.field], row: n, column: a, key: t.key, target: this._d.getContainer(), originalEvent: t };
    this._d.emit(e, d), e === "cellKeyDown" ? (_a = l.onCellKeyDown) == null ? void 0 : _a.call(l, d) : e === "cellKeyUp" ? (_b = l.onCellKeyUp) == null ? void 0 : _b.call(l, d) : (_c = l.onCellKeyPress) == null ? void 0 : _c.call(l, d);
  }
}
function Vo(r, e) {
  return { startRow: Math.min(r.ri, e.ri), endRow: Math.max(r.ri, e.ri), startCol: Math.min(r.ci, e.ci), endCol: Math.max(r.ci, e.ci) };
}
class Wo {
  constructor(e) {
    this._anchor = { ri: 0, ci: 0 }, this._focus = { ri: 0, ci: 0 }, this._identity = { rowIds: [], fields: [] }, this._rects = [], this._hasSelection = false, this._additive = false, this._host = e;
  }
  get hasSelection() {
    return this._hasSelection;
  }
  getAnchor() {
    return { ...this._anchor };
  }
  getFocus() {
    return { ...this._focus };
  }
  getIdentity() {
    return { rowIds: [...this._identity.rowIds], fields: [...this._identity.fields] };
  }
  getRangeSelection() {
    return this._rects.map((e) => ({ ...e }));
  }
  getActiveRange() {
    return this._rects[0] ? { ...this._rects[0] } : null;
  }
  getPrimaryRect() {
    return this.getActiveRange();
  }
  getProjectedFlatRows() {
    return this._identity.rowIds.map((e) => this._host.flatIndexOfRowId(e)).filter((e) => e >= 0).sort((e, t) => e - t);
  }
  beginDrag(e, t, s = {}) {
    s.shift && this._hasSelection ? this._focus = { ri: e, ci: t } : (this._anchor = { ri: e, ci: t }, this._focus = { ri: e, ci: t }), this._hasSelection = true, this._additive = !!s.additive, this._recompute();
  }
  updateFocus(e, t) {
    this._hasSelection && (this._focus = { ri: e, ci: t }, this._recompute());
  }
  endDrag() {
    this._hasSelection && this.snapshotIdentity();
  }
  get additive() {
    return this._additive;
  }
  click(e, t) {
    this._anchor = { ri: e, ci: t }, this._focus = { ri: e, ci: t }, this._hasSelection = true, this._recompute(), this.snapshotIdentity();
  }
  shiftClickExtend(e, t) {
    if (!this._hasSelection) {
      this.click(e, t);
      return;
    }
    this._focus = { ri: e, ci: t }, this._recompute(), this.snapshotIdentity();
  }
  extendFocus(e) {
    if (!this._hasSelection) return;
    const t = Math.max(0, this._host.count() - 1), s = Math.max(0, this._host.visibleFields().length - 1);
    let { ri: i, ci: o } = this._focus;
    switch (e) {
      case "up":
        i = Math.max(0, i - 1);
        break;
      case "down":
        i = Math.min(t, i + 1);
        break;
      case "left":
        o = Math.max(0, o - 1);
        break;
      case "right":
        o = Math.min(s, o + 1);
        break;
    }
    this._focus = { ri: i, ci: o }, this._recompute(), this.snapshotIdentity();
  }
  setRect(e) {
    this._anchor = { ri: e.startRow, ci: e.startCol }, this._focus = { ri: e.endRow, ci: e.endCol }, this._hasSelection = true, this._rects = [{ ...e }], this.snapshotIdentity();
  }
  clear() {
    this._hasSelection = false, this._rects = [], this._identity = { rowIds: [], fields: [] };
  }
  snapshotIdentity() {
    const e = this._rects[0];
    if (!e) {
      this._identity = { rowIds: [], fields: [] };
      return;
    }
    const t = [];
    for (let o = e.startRow; o <= e.endRow; o++) {
      const n = this._host.rowIdOfFlat(o);
      n && t.push(n);
    }
    const i = this._host.visibleFields().slice(e.startCol, e.endCol + 1);
    this._identity = { rowIds: t, fields: i };
  }
  reproject() {
    if (!this._hasSelection) return;
    if (this._identity.rowIds.length === 0 || this._identity.fields.length === 0) {
      this._rects = [];
      return;
    }
    const e = this._identity.rowIds.map((l) => this._host.flatIndexOfRowId(l)).filter((l) => l >= 0), t = this._host.visibleFields(), s = this._identity.fields.map((l) => t.indexOf(l)).filter((l) => l >= 0);
    if (e.length === 0 || s.length === 0) {
      this._rects = [];
      return;
    }
    const i = Math.min(...e), o = Math.max(...e), n = Math.min(...s), a = Math.max(...s);
    this._rects = [{ startRow: i, endRow: o, startCol: n, endCol: a }], this._anchor = { ri: i, ci: n }, this._focus = { ri: o, ci: a };
  }
  _recompute() {
    this._rects = [Vo(this._anchor, this._focus)];
  }
}
const Ko = /^-?\d+(\.\d+)?$/, Uo = /^(.*?)(\d+)$/;
function jo(r) {
  const e = String(r ?? "").trim();
  if (e === "" || !Ko.test(e)) return null;
  try {
    return v.from(e);
  } catch {
    return null;
  }
}
function qo(r) {
  const e = r.length;
  if (e === 0) return { kind: "copy" };
  const t = r.map(jo);
  if (t.every((s) => s !== null)) {
    if (e === 1) return { kind: "copy" };
    const s = t, i = s.slice(1).map((n, a) => n.sub(s[a]));
    return i.every((n) => n.eq(i[0])) ? { kind: "arith", step: i[0], values: s } : { kind: "copy" };
  }
  if (e >= 2) {
    const s = r.map((i) => Uo.exec(String(i ?? "")));
    if (s.every((i) => i !== null)) {
      const i = s.map((n) => n[1]);
      if (i.every((n) => n === i[0])) {
        const n = s.map((d) => v.from(d[2])), a = n.slice(1).map((d, c) => d.sub(n[c]));
        if (a.every((d) => d.eq(a[0]))) return { kind: "text-suffix", step: a[0], values: n, prefix: i[0] };
      }
    }
  }
  return { kind: "copy" };
}
function ls(r, e, t) {
  return t <= 0 ? 0 : r === "down" || r === "right" ? (e - 1) % t : (t - e % t) % t;
}
function Go(r, e, t, s) {
  const i = e.length;
  if (r.kind === "copy" || !r.values || !r.step) return e[ls(t, s, i)];
  const o = t === "down" || t === "right", n = o ? r.values[r.values.length - 1] : r.values[0], a = o ? r.step : r.step.neg(), l = n.add(a.mul(s));
  return r.kind === "text-suffix" ? `${r.prefix}${l.toNumber()}` : l.toNumber();
}
function Re(r, e) {
  const t = [];
  for (let s = r; s <= e; s++) t.push(s);
  return t;
}
function Yo(r, e, t, s, i) {
  var _a;
  const o = r.resolveFlatRow(e);
  return o.kind !== "data" || !o.rowId ? { rowIndex: e, field: t, action: "skip", reason: "non-data-row" } : r.isEditable && !r.isEditable(o.rowId, t) ? { rowIndex: e, field: t, action: "skip", reason: "not-editable" } : !!((_a = r.hasCellFormula) == null ? void 0 : _a.call(r, o.rowId, t)) && !r.overwriteFormula ? (i(), { rowIndex: e, field: t, action: "skip", reason: "formula-preserved" }) : { rowIndex: e, field: t, action: "value", value: s };
}
function Xo(r, e, t, s, i, o, n, a) {
  var _a, _b;
  const l = r.resolveFlatRow(e);
  if (l.kind !== "data" || !l.rowId) return { rowIndex: e, field: s, action: "skip", reason: "non-data-row" };
  if (r.isEditable && !r.isEditable(l.rowId, s)) return { rowIndex: e, field: s, action: "skip", reason: "not-editable" };
  const d = r.resolveFlatRow(i), c = !!(d.rowId && ((_a = r.hasCellFormula) == null ? void 0 : _a.call(r, d.rowId, n)));
  if (c && d.rowId) {
    if (r.forceCopyFormula) {
      const g = r.getCellValue(i, n);
      return { rowIndex: e, field: s, action: "setFormula", formula: String(g) };
    }
    if (r.offsetFormula) {
      const g = r.offsetFormula(d.rowId, n, e - i, t - o);
      return { rowIndex: e, field: s, action: "setFormula", formula: g };
    }
  }
  const h = !!((_b = r.hasCellFormula) == null ? void 0 : _b.call(r, l.rowId, s));
  if (!c && h && !r.overwriteFormula) return a(), { rowIndex: e, field: s, action: "skip", reason: "formula-preserved" };
  const u = r.getCellValue(i, n);
  return { rowIndex: e, field: s, action: "value", value: u };
}
function Zo(r, e, t, s, i) {
  const o = t === "up" || t === "down", n = [];
  let a = 0;
  const l = () => {
    a++;
  }, d = o ? Re(r.startCol, r.endCol) : Re(r.startRow, r.endRow);
  for (const c of d) {
    const h = o ? i.fieldAt(c) : void 0, u = o ? Re(r.startRow, r.endRow).map((_) => ({ ri: _, ci: c })) : Re(r.startCol, r.endCol).map((_) => ({ ri: c, ci: _ })), g = u.map((_) => {
      const w = o ? h : i.fieldAt(_.ci);
      return w ? i.getCellValue(_.ri, w) : void 0;
    }), p = s === "series" ? qo(g) : { kind: "copy" }, f = o ? Re(e.startRow, e.endRow) : Re(e.startCol, e.endCol);
    (t === "down" || t === "right" ? f : [...f].reverse()).forEach((_, w) => {
      const y = w + 1, R = o ? _ : c, A = o ? c : _, S = o ? h : i.fieldAt(_);
      if (!S) return;
      if (p.kind !== "copy") {
        const C = Go(p, g, t, y);
        n.push(Yo(i, R, S, C, l));
        return;
      }
      const O = ls(t, y, u.length), z = u[O], $ = o ? h : i.fieldAt(z.ci);
      $ && n.push(Xo(i, R, A, S, z.ri, z.ci, $, l));
    });
  }
  return { items: n, skippedFormula: a };
}
function Qo(r, e) {
  return e === "down" ? r.endRow <= r.startRow ? null : { source: { startRow: r.startRow, endRow: r.startRow, startCol: r.startCol, endCol: r.endCol }, target: { startRow: r.startRow + 1, endRow: r.endRow, startCol: r.startCol, endCol: r.endCol } } : r.endCol <= r.startCol ? null : { source: { startRow: r.startRow, endRow: r.endRow, startCol: r.startCol, endCol: r.startCol }, target: { startRow: r.startRow, endRow: r.endRow, startCol: r.startCol + 1, endCol: r.endCol } };
}
function Jo(r, e) {
  const t = [];
  for (let s = r.startRow; s <= r.endRow; s++) {
    const i = [];
    for (let o = r.startCol; o <= r.endCol; o++) {
      const n = e.fieldAt(o);
      if (!n) {
        i.push("");
        continue;
      }
      const a = e.getDisplayText ? e.getDisplayText(s, n) : String(e.getCellValue(s, n) ?? "");
      i.push(a);
    }
    t.push(i.join("	"));
  }
  return t.join(`
`);
}
function er(r) {
  return r === "" ? [[""]] : r.split(`
`).map((e) => e.split("	"));
}
function tr(r, e, t) {
  var _a;
  const s = r.length, i = s > 0 ? Math.max(...r.map((c) => c.length)) : 0;
  if (s === 0 || i === 0) return [];
  const o = e.endRow - e.startRow + 1, n = e.endCol - e.startCol + 1, a = Math.max(o, s), l = Math.max(n, i), d = [];
  for (let c = 0; c < a; c++) for (let h = 0; h < l; h++) {
    const u = e.startRow + c, g = e.startCol + h, p = t.fieldAt(g);
    if (!p) continue;
    const f = t.resolveFlatRow(u);
    if (f.kind !== "data" || !f.rowId) {
      d.push({ rowIndex: u, field: p, action: "skip", reason: "non-data-row" });
      continue;
    }
    if (t.isEditable && !t.isEditable(f.rowId, p)) {
      d.push({ rowIndex: u, field: p, action: "skip", reason: "not-editable" });
      continue;
    }
    const m = ((_a = r[c % s]) == null ? void 0 : _a[h % i]) ?? "";
    d.push({ rowIndex: u, field: p, action: "value", value: m });
  }
  return d;
}
function ds(r, e) {
  const t = [];
  for (let s = r.startRow; s <= r.endRow; s++) {
    const i = [];
    for (let o = r.startCol; o <= r.endCol; o++) {
      const n = e.fieldAt(o);
      i.push(n ? e.getCellValue(s, n) : void 0);
    }
    t.push(i);
  }
  return t;
}
function sr(r, e) {
  const t = ds(r, e).flat(), s = [];
  for (const i of t) {
    const o = String(i ?? "").trim();
    o === "" || !/^-?\d+(\.\d+)?$/.test(o) || s.push(v.from(o));
  }
  return s.length === 0 ? null : { sum: v.sum(s).toString(), avg: v.avg(s).toString(), count: s.length, min: v.min(s).toString(), max: v.max(s).toString() };
}
class ir {
  constructor(e) {
    this._isDragging = false, this._fillDragSource = null, this._fillDragStart = null, this._fillPreview = null, this._handlePointerId = null, this._autoScrollRAF = null, this._autoScrollVX = 0, this._autoScrollVY = 0, this._overlayEl = null, this._borderEl = null, this._previewEl = null, this._handleEl = null, this._mountedWrap = null, this._d = e;
    const t = { count: () => this._d.getFlatModel().count(), resolveFlatRow: (s) => this._d.getFlatModel().resolveFlatRow(s), flatIndexOfRowId: (s) => this._d.getFlatModel().flatIndexOfRowId(s), rowIdOfFlat: (s) => this._d.getFlatModel().rowIdOfFlat(s), visibleFields: () => this._d.getColLayout().visibleLeaves.map((s) => s.field) };
    this._model = new Wo(t);
  }
  isEnabled() {
    var _a;
    const e = this._d.getOptions();
    return ((_a = e.rangeSelection) == null ? void 0 : _a.enabled) ?? e.selection === "cells";
  }
  _rangeOpts() {
    const e = this._d.getOptions().rangeSelection;
    return { fillHandle: (e == null ? void 0 : e.fillHandle) ?? true, multiRange: (e == null ? void 0 : e.multiRange) ?? false, autoScrollEdge: (e == null ? void 0 : e.autoScrollEdge) ?? 24, seriesFill: (e == null ? void 0 : e.seriesFill) ?? true, enabledInTreeGroup: (e == null ? void 0 : e.enabledInTreeGroup) ?? false, fillOverwriteFormula: (e == null ? void 0 : e.fillOverwriteFormula) ?? false };
  }
  _editorActive() {
    return this._d.getEditMgr().activeEditor != null;
  }
  hasSelection() {
    return this._model.hasSelection;
  }
  getRangeSelection() {
    return this._model.getRangeSelection();
  }
  getActiveRange() {
    return this._model.getActiveRange();
  }
  getFillPreview() {
    return this._fillPreview;
  }
  getRangeValues() {
    const e = this.getActiveRange();
    return e ? ds(e, this._queryCtx()) : [];
  }
  getRangeStats() {
    const e = this.getActiveRange();
    return e ? sr(e, this._queryCtx()) : null;
  }
  _queryCtx() {
    return { fieldAt: (e) => {
      var _a;
      return (_a = this._d.getColLayout().visibleLeaves[e]) == null ? void 0 : _a.field;
    }, getCellValue: (e, t) => this._d.getData().getCellValue(e, t) };
  }
  handleCellMouseDown(e, t, s) {
    if (!this.isEnabled() || this._editorActive() || e < 0 || t < 0) return;
    this._model.beginDrag(e, t, { additive: s.ctrlKey || s.metaKey, shift: s.shiftKey }), this._isDragging = true, this._d.setFocusCell(e, t), this._d.doRender();
    const i = () => {
      document.removeEventListener("mouseup", i), this.handleCellMouseUp(-1, -1, s);
    };
    document.addEventListener("mouseup", i);
  }
  handleCellMouseMove(e, t, s) {
    this._isDragging && (e >= 0 && t >= 0 && (this._model.updateFocus(e, t), this._d.doRender()), this._maybeAutoscroll(s));
  }
  handleCellMouseUp(e, t, s) {
    this._isDragging && (this._isDragging = false, this._stopAutoscroll(), this._model.endDrag(), this._afterModelChange(true));
  }
  handleClick(e, t, s) {
    if (!this.isEnabled() || this._editorActive()) return;
    s ? this._model.shiftClickExtend(e, t) : this._model.click(e, t);
    const i = this._model.getFocus();
    this._d.setFocusCell(i.ri, i.ci), this._afterModelChange(true);
  }
  extendFocus(e) {
    if (!this.isEnabled() || !this._model.hasSelection) return;
    this._model.extendFocus(e);
    const t = this._model.getFocus();
    this._d.setFocusCell(t.ri, t.ci), this._afterModelChange(true);
  }
  clear() {
    this._model.hasSelection && (this._model.clear(), this._afterModelChange(true));
  }
  clearRangeSelection() {
    this.clear();
  }
  setRangeSelection(e) {
    const t = Array.isArray(e) ? e[0] : e;
    if (!t) {
      this.clear();
      return;
    }
    this._model.setRect(t);
    const s = this._model.getFocus();
    this._d.setFocusCell(s.ri, s.ci), this._afterModelChange(true);
  }
  reproject() {
    var _a, _b;
    if (!this._model.hasSelection) return;
    this._model.reproject();
    const e = this._model.getActiveRange();
    this._d.emit("rangeChange", { range: e }), (_b = (_a = this._d.getOptions()).onRangeChange) == null ? void 0 : _b.call(_a, { range: e });
  }
  _afterModelChange(e) {
    var _a, _b;
    if (this._d.doRender(), !e) return;
    const t = this._model.getRangeSelection(), s = this._model.getActiveRange(), i = this._d.getOptions();
    this._d.emit("selectionChange", { rows: [], rowIndexes: [], cells: t }), (_a = i.onSelectionChange) == null ? void 0 : _a.call(i, { rows: [], rowIndexes: [], cells: t }), this._d.emit("rangeChange", { range: s }), (_b = i.onRangeChange) == null ? void 0 : _b.call(i, { range: s }), this._announceSelection();
  }
  _announceSelection() {
    const e = this.getActiveRange();
    if (!e) return;
    const t = e.endRow - e.startRow + 1, s = e.endCol - e.startCol + 1;
    this._d.announce(this._d.t("range.selectionAnnounce", { r1: e.startRow + 1, c1: e.startCol + 1, r2: e.endRow + 1, c2: e.endCol + 1, n: t * s }));
  }
  ctrlFill(e) {
    if (!this.isEnabled()) return;
    const t = this.getActiveRange();
    if (!t) return;
    const s = Qo(t, e);
    s && this._commitFill(s.source, s.target, e, "copy");
  }
  fillRange(e, t, s = "copy") {
    let i;
    t.startRow < e.startRow ? i = "up" : t.endRow > e.endRow ? i = "down" : t.startCol < e.startCol ? i = "left" : i = "right", this._commitFill(e, t, i, s);
  }
  _isEditable(e, t) {
    const s = this._d.getColLayout().getColumnByField(t);
    if (!s || s.editable === false) return false;
    const i = this._d.getOptions();
    if (typeof s.editable == "function") {
      const o = this._d.getFlatModel().flatIndexOfRowId(e), n = o >= 0 ? this._d.getData().getRowByIndex(o) : void 0;
      return n ? !!s.editable(n, o) : false;
    }
    return s.editable !== void 0 ? true : !!i.editable;
  }
  _commitFill(e, t, s, i) {
    var _a, _b, _c, _d;
    const o = this._rangeOpts(), n = o.seriesFill ? i : "copy", a = { resolveFlatRow: (p) => this._d.getFlatModel().resolveFlatRow(p), fieldAt: (p) => {
      var _a2;
      return (_a2 = this._d.getColLayout().visibleLeaves[p]) == null ? void 0 : _a2.field;
    }, getCellValue: (p, f) => this._d.getData().getCellValue(p, f), isEditable: (p, f) => this._isEditable(p, f), hasCellFormula: (p, f) => {
      var _a2, _b2;
      return ((_b2 = (_a2 = this._d).hasCellFormula) == null ? void 0 : _b2.call(_a2, p, f)) ?? false;
    }, offsetFormula: (p, f, m, _) => {
      var _a2, _b2;
      return ((_b2 = (_a2 = this._d).offsetFormula) == null ? void 0 : _b2.call(_a2, p, f, m, _)) ?? "";
    }, overwriteFormula: o.fillOverwriteFormula }, l = Zo(e, t, s, n, a), d = [], c = [], h = [];
    for (const p of l.items) if (p.action === "value") {
      const f = this._d.getData().getCellValue(p.rowIndex, p.field);
      d.push({ rowIndex: p.rowIndex, field: p.field, oldValue: f, newValue: p.value }), c.push({ rowIndex: p.rowIndex, field: p.field, value: p.value });
    } else if (p.action === "setFormula" && p.formula != null) {
      const f = this._d.getFlatModel().resolveFlatRow(p.rowIndex);
      f.kind === "data" && f.rowId && (h.push({ rowId: f.rowId, field: p.field, formula: p.formula }), d.push({ rowIndex: p.rowIndex, field: p.field, oldValue: this._d.getData().getCellValue(p.rowIndex, p.field), newValue: p.formula }));
    }
    const u = { source: e, target: t, mode: n, written: d, skippedFormula: l.skippedFormula, cancel: false };
    if (this._d.emit("rangeFill", u), (_b = (_a = this._d.getOptions()).onRangeFill) == null ? void 0 : _b.call(_a, u), u.cancel) return;
    c.length && this._d.writeCells(c);
    for (const p of h) (_d = (_c = this._d).setCellFormulaByRowId) == null ? void 0 : _d.call(_c, p.rowId, p.field, p.formula);
    l.skippedFormula > 0 && this._d.announce(this._d.t("range.formulaPreserved", { count: l.skippedFormula }));
    const g = l.items.filter((p) => p.action === "skip" && p.reason !== "formula-preserved").length;
    g > 0 && this._d.announce(this._d.t("range.fillSkipped", { count: g }));
  }
  copyText() {
    var _a, _b;
    const e = this.getActiveRange();
    if (!e) return null;
    const s = Jo(e, { fieldAt: (i) => {
      var _a2;
      return (_a2 = this._d.getColLayout().visibleLeaves[i]) == null ? void 0 : _a2.field;
    }, getCellValue: (i, o) => this._d.getData().getCellValue(i, o), getDisplayText: (i, o) => this._d.getDisplayValue(i, o) });
    return this._d.emit("rangeCopy", { range: e, text: s }), (_b = (_a = this._d.getOptions()).onRangeCopy) == null ? void 0 : _b.call(_a, { range: e, text: s }), s;
  }
  pasteText(e) {
    const t = this.getActiveRange();
    if (!t) return false;
    const s = er(e), n = tr(s, t, { resolveFlatRow: (a) => this._d.getFlatModel().resolveFlatRow(a), fieldAt: (a) => {
      var _a;
      return (_a = this._d.getColLayout().visibleLeaves[a]) == null ? void 0 : _a.field;
    }, isEditable: (a, l) => this._isEditable(a, l) }).filter((a) => a.action === "value").map((a) => ({ rowIndex: a.rowIndex, field: a.field, value: a.value }));
    return this._d.writeCells(n), true;
  }
  _maybeAutoscroll(e) {
    const t = this._d.getRenderer();
    if (!t) return;
    const i = t.bodyWrapper.getBoundingClientRect(), o = this._rangeOpts().autoScrollEdge;
    let n = 0, a = 0;
    const l = e.clientY - i.top, d = i.bottom - e.clientY, c = e.clientX - i.left, h = i.right - e.clientX;
    if (l < o ? a = -this._scrollSpeed(o - l) : d < o && (a = this._scrollSpeed(o - d)), c < o ? n = -this._scrollSpeed(o - c) : h < o && (n = this._scrollSpeed(o - h)), n === 0 && a === 0) {
      this._stopAutoscroll();
      return;
    }
    this._autoScrollVX = n, this._autoScrollVY = a, this._autoScrollRAF == null && this._runAutoscroll();
  }
  _scrollSpeed(e) {
    return Math.max(2, Math.min(20, e));
  }
  _runAutoscroll() {
    const e = this._d.getRenderer();
    if (!e) {
      this._autoScrollRAF = null;
      return;
    }
    e.bodyWrapper.scrollTop += this._autoScrollVY, e.bodyWrapper.scrollLeft += this._autoScrollVX, this._autoScrollRAF = requestAnimationFrame(() => this._runAutoscroll());
  }
  _stopAutoscroll() {
    this._autoScrollRAF != null && (cancelAnimationFrame(this._autoScrollRAF), this._autoScrollRAF = null), this._autoScrollVX = 0, this._autoScrollVY = 0;
  }
  mount(e) {
    if (this._mountedWrap === e) return;
    this._mountedWrap = e;
    const t = document.createElement("div");
    t.className = "og-range-overlay", t.style.cssText = "position:sticky;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:6;";
    const s = document.createElement("div");
    s.className = "og-range-border", s.style.cssText = "position:absolute;box-sizing:border-box;border:2px solid var(--og-range-border,#1976d2);pointer-events:none;display:none;";
    const i = document.createElement("div");
    i.className = "og-range-fill-preview", i.style.cssText = "position:absolute;box-sizing:border-box;border:1px dashed var(--og-range-border,#1976d2);pointer-events:none;display:none;";
    const o = document.createElement("div");
    o.className = "og-range-fill-handle", o.setAttribute("role", "button"), o.setAttribute("aria-label", this._d.t("range.fillHandleAria")), o.style.cssText = "position:absolute;display:none;pointer-events:auto;background-color:var(--og-fill-handle-bg,#1976d2);", o.addEventListener("pointerdown", (n) => this._onHandlePointerDown(n)), t.appendChild(s), t.appendChild(i), t.appendChild(o), e.insertBefore(t, e.firstChild), e.addEventListener("scroll", () => this.repaint(), { passive: true }), this._overlayEl = t, this._borderEl = s, this._previewEl = i, this._handleEl = o;
  }
  repaint() {
    if (!this._overlayEl) return;
    const e = this._d.getRenderer(), t = this.getActiveRange();
    if (!e || !t) {
      this._hideOverlay();
      return;
    }
    const s = e.bodyWrapper.getBoundingClientRect(), i = e.getCellEl(t.startRow, t.startCol), o = e.getCellEl(t.endRow, t.endCol);
    if (!i || !o) {
      this._hideOverlay();
      return;
    }
    const n = i.getBoundingClientRect(), a = o.getBoundingClientRect(), l = Math.min(n.left, a.left) - s.left, d = Math.min(n.top, a.top) - s.top, c = Math.max(n.right, a.right) - s.left, h = Math.max(n.bottom, a.bottom) - s.top;
    if (Object.assign(this._borderEl.style, { display: "block", left: `${l}px`, top: `${d}px`, width: `${Math.max(0, c - l)}px`, height: `${Math.max(0, h - d)}px` }), this._rangeOpts().fillHandle ? Object.assign(this._handleEl.style, { display: "block", left: `${c}px`, top: `${h}px` }) : this._handleEl.style.display = "none", this._fillPreview) {
      const u = this._fillPreview.target, g = e.getCellEl(u.startRow, u.startCol), p = e.getCellEl(u.endRow, u.endCol);
      if (g && p) {
        const f = g.getBoundingClientRect(), m = p.getBoundingClientRect(), _ = Math.min(f.left, m.left) - s.left, w = Math.min(f.top, m.top) - s.top, y = Math.max(f.right, m.right) - s.left, R = Math.max(f.bottom, m.bottom) - s.top;
        Object.assign(this._previewEl.style, { display: "block", left: `${_}px`, top: `${w}px`, width: `${Math.max(0, y - _)}px`, height: `${Math.max(0, R - w)}px` });
        return;
      }
    }
    this._previewEl.style.display = "none";
  }
  _hideOverlay() {
    this._borderEl && (this._borderEl.style.display = "none"), this._handleEl && (this._handleEl.style.display = "none"), this._previewEl && (this._previewEl.style.display = "none");
  }
  getOverlayExtraOpts() {
    return { _rangeRects: this._model.getRangeSelection() };
  }
  _resolveCellAtPoint(e, t) {
    var _a;
    const i = (_a = typeof document.elementFromPoint == "function" ? document.elementFromPoint(e, t) : null) == null ? void 0 : _a.closest(".og-cell"), o = i == null ? void 0 : i.closest(".og-row");
    if (!i || !o) return null;
    const n = i.getAttribute("aria-colindex"), a = o.getAttribute("aria-rowindex");
    return n == null || a == null ? null : { ri: Number(a) - 1, ci: Number(n) - 1 };
  }
  _onHandlePointerDown(e) {
    var _a;
    const t = this.getActiveRange();
    if (!t) return;
    e.stopPropagation(), e.preventDefault(), this._handlePointerId = e.pointerId;
    try {
      (_a = this._handleEl) == null ? void 0 : _a.setPointerCapture(e.pointerId);
    } catch {
    }
    this._fillDragSource = t, this._fillDragStart = { x: e.clientX, y: e.clientY };
    const s = (o) => this._onHandlePointerMove(o), i = (o) => {
      document.removeEventListener("pointermove", s), document.removeEventListener("pointerup", i), this._onHandlePointerUp(o);
    };
    document.addEventListener("pointermove", s), document.addEventListener("pointerup", i);
  }
  _onHandlePointerMove(e) {
    const t = this._fillDragSource, s = this._fillDragStart;
    if (!t || !s) return;
    const i = this._resolveCellAtPoint(e.clientX, e.clientY);
    if (!i) return;
    const o = e.clientX - s.x, n = e.clientY - s.y, a = Math.abs(n) >= Math.abs(o);
    let l, d;
    if (a) if (i.ri > t.endRow) l = "down", d = { startRow: t.endRow + 1, endRow: i.ri, startCol: t.startCol, endCol: t.endCol };
    else if (i.ri < t.startRow) l = "up", d = { startRow: i.ri, endRow: t.startRow - 1, startCol: t.startCol, endCol: t.endCol };
    else {
      this._fillPreview = null, this.repaint();
      return;
    }
    else if (i.ci > t.endCol) l = "right", d = { startRow: t.startRow, endRow: t.endRow, startCol: t.endCol + 1, endCol: i.ci };
    else if (i.ci < t.startCol) l = "left", d = { startRow: t.startRow, endRow: t.endRow, startCol: i.ci, endCol: t.startCol - 1 };
    else {
      this._fillPreview = null, this.repaint();
      return;
    }
    const h = this._rangeOpts().seriesFill ? "series" : "copy", g = e.ctrlKey || e.metaKey ? h === "series" ? "copy" : "series" : h;
    this._fillPreview = { source: t, target: d, axis: l, mode: g }, this.repaint();
  }
  _onHandlePointerUp(e) {
    const t = this._fillPreview;
    this._fillDragSource = null, this._fillDragStart = null, this._fillPreview = null, this._handlePointerId = null, t && this._commitFill(t.source, t.target, t.axis, t.mode), this.repaint();
  }
}
class or {
  constructor(e) {
    this._groupFields = [], this._groupExpandedKeys = /* @__PURE__ */ new Set(), this._groupFlatRows = [], this._isGroupMode = false, this._treeRoots = [], this._treeFlatRows = [], this._treeExpandedKeys = /* @__PURE__ */ new Set(), this._isTreeMode = false, this._d = e;
  }
  get isGroupMode() {
    return this._isGroupMode;
  }
  get isTreeMode() {
    return this._isTreeMode;
  }
  get groupFlatRows() {
    return this._groupFlatRows;
  }
  get treeFlatRows() {
    return this._treeFlatRows;
  }
  groupBy(e) {
    this._groupFields = e, this._groupExpandedKeys.clear(), this._isGroupMode = e.length > 0, this.rebuildGroups();
  }
  clearGroup() {
    var _a;
    this._groupFields = [], this._groupExpandedKeys.clear(), this._isGroupMode = false, this._groupFlatRows = [], this._d.setFlatBacking(null), (_a = this._d.getVs()) == null ? void 0 : _a.setTotalRows(this._d.getFlatCount()), this._d.doRender();
  }
  expandAll() {
    if (!this._isGroupMode) return;
    const e = Wt(this._d.getData(), this._groupFields, this._getSummaryDefs(), void 0, void 0, this._groupKeyFn());
    jt(e).forEach((t) => this._groupExpandedKeys.add(t)), this.rebuildGroups();
  }
  _groupKeyFn() {
    return this._d.getStrategy ? this._d.getStrategy("groupKeyFn", void 0) : void 0;
  }
  collapseAll() {
    this._groupExpandedKeys.clear(), this._isGroupMode && this.rebuildGroups();
  }
  handleGroupToggle(e) {
    this._groupExpandedKeys.has(e) ? this._groupExpandedKeys.delete(e) : this._groupExpandedKeys.add(e), this.rebuildGroups();
  }
  rebuildGroups() {
    var _a;
    const e = this._d.getData(), t = this._d.getDataLayer(), s = (n) => {
      const a = e.indexOf(n);
      return a >= 0 ? t.getRowState(a) : "none";
    }, i = Wt(e, this._groupFields, this._getSummaryDefs(), this._groupExpandedKeys, s, this._groupKeyFn());
    this._groupFlatRows = Ut(i), this._d.setFlatBacking(() => this._groupFlatRows);
    const o = this._d.getFlatCount();
    (_a = this._d.getVs()) == null ? void 0 : _a.setTotalRows(o), this._d.doRenderFull(o);
  }
  enableTree() {
    this._isTreeMode = true, this._isGroupMode = false;
    const e = this._d.getOptions();
    if (e.expandOnLoad) {
      const t = et(this._d.getData(), { idField: e.treeId, parentIdField: e.treeParentId });
      tt(t).forEach((s) => this._treeExpandedKeys.add(s));
    }
    this.rebuildTree();
  }
  disableTree() {
    var _a;
    this._isTreeMode = false, this._treeRoots = [], this._treeFlatRows = [], this._treeExpandedKeys.clear(), this._d.setFlatBacking(null), (_a = this._d.getVs()) == null ? void 0 : _a.setTotalRows(this._d.getFlatCount()), this._d.doRender();
  }
  expandNodes(e, t = true) {
    const s = Array.isArray(e) ? e : [e];
    for (const i of s) t ? this._treeExpandedKeys.add(i) : this._treeExpandedKeys.delete(i);
    this._isTreeMode && this.rebuildTree();
  }
  expandAllNodes() {
    this._isTreeMode && (tt(this._treeRoots).forEach((e) => this._treeExpandedKeys.add(e)), this.rebuildTree());
  }
  collapseAllNodes() {
    this._isTreeMode && (this._treeExpandedKeys.clear(), this.rebuildTree());
  }
  handleTreeToggle(e) {
    ro(this._treeExpandedKeys, e), this.rebuildTree();
  }
  rebuildTree() {
    var _a;
    const e = this._d.getOptions();
    this._treeRoots = et(this._d.getData(), { idField: e.treeId, parentIdField: e.treeParentId, expandOnLoad: e.expandOnLoad }, this._treeExpandedKeys), this._treeFlatRows = Yt(this._treeRoots), this._d.setFlatBacking(() => this._treeFlatRows);
    const t = this._d.getFlatCount();
    (_a = this._d.getVs()) == null ? void 0 : _a.setTotalRows(t), this._d.doRenderFull(t);
  }
  _getSummaryDefs() {
    const e = this._d.getOptions().summary;
    if (!e) return [];
    if (e.rows && e.rows.length > 0) return e.fields.flatMap((s) => e.rows.map((i) => ({ field: s, op: i.op, format: i.format })));
    const t = Array.isArray(e.ops) ? e.ops : e.ops ? [e.ops] : ["SUM"];
    return e.fields.map((s) => ({ field: s, op: t[0] ?? "SUM", format: e.format }));
  }
}
class rr {
  constructor(e = {}) {
    this._expanded = /* @__PURE__ */ new Set(), this._maxDepth = e.maxDepth ?? 2, this._expandMultiple = e.expandMultiple ?? true, this._depth = e.depth ?? 0;
  }
  get expandedRowIds() {
    return this._expanded;
  }
  get size() {
    return this._expanded.size;
  }
  get depth() {
    return this._depth;
  }
  get maxDepth() {
    return this._maxDepth;
  }
  get expandMultiple() {
    return this._expandMultiple;
  }
  isExpanded(e) {
    return this._expanded.has(e);
  }
  canExpand() {
    return this._depth < this._maxDepth;
  }
  expand(e) {
    return this._expanded.has(e) ? true : this.canExpand() ? (this._expandMultiple || this._expanded.clear(), this._expanded.add(e), true) : false;
  }
  collapse(e) {
    return this._expanded.delete(e);
  }
  toggle(e) {
    return this._expanded.has(e) ? (this.collapse(e), "collapsed") : this.expand(e) ? "expanded" : "rejected";
  }
  collapseAll() {
    const e = Array.from(this._expanded);
    return this._expanded.clear(), e;
  }
  buildEventPayload(e, t, s, i) {
    return { rowIndex: t, rowId: e, row: s, host: i };
  }
}
function nr(r) {
  return !!r && r._isGroup === true;
}
function ar(r) {
  return !!r && r._isTree === true;
}
function lr(r) {
  return !!r && (r._isDetailHead === true || r._isDetailFiller === true);
}
function dr(r) {
  return !(r == null || lr(r) || nr(r));
}
function cr(r) {
  return ar(r) ? r.data : r;
}
function hr(r, e, t) {
  if (t.getSlotCount) {
    const o = Math.floor(t.getSlotCount(r, e));
    return Number.isFinite(o) && o > 0 ? o : 1;
  }
  const s = t.height ?? 200, i = t.rowHeight > 0 ? t.rowHeight : 1;
  return Math.max(1, Math.ceil(s / i));
}
function ur(r, e) {
  const t = [];
  if (e.expandedRowIds.size === 0) {
    for (const s of r) t.push(s);
    return t;
  }
  for (const s of r) {
    if (t.push(s), !dr(s)) continue;
    const i = cr(s), o = i != null ? e.getRowId(i) : null;
    if (o == null || !e.expandedRowIds.has(o)) continue;
    const n = hr(i, o, e), a = { _isDetailHead: true, _rowId: o, _masterFlatBase: s, _span: n };
    t.push(a);
    for (let l = 1; l < n; l++) t.push({ _isDetailFiller: true, _rowId: o });
  }
  return t;
}
class pr {
  constructor(e) {
    this.adapter = e, this._entries = /* @__PURE__ */ new Map();
  }
  get size() {
    return this._entries.size;
  }
  has(e) {
    return this._entries.has(e);
  }
  getOrCreate(e, t) {
    const s = this._entries.get(e);
    if (s) return s.attached = true, s;
    const i = t(), o = this.adapter.create(e, i), n = { host: i, instance: o, attached: true };
    return this._entries.set(e, n), n;
  }
  reattach(e) {
    const t = this._entries.get(e);
    return !t || t.attached ? false : (this.adapter.reattach(t.instance, t.host), t.attached = true, true);
  }
  detach(e) {
    const t = this._entries.get(e);
    return !t || !t.attached ? false : (this.adapter.detach(t.instance, t.host), t.attached = false, true);
  }
  detachAll() {
    for (const e of this._entries.keys()) this.detach(e);
  }
  remove(e, t = {}) {
    const s = this._entries.get(e);
    if (s) {
      if (t.cache) {
        s.attached && this.adapter.detach(s.instance, s.host), s.attached = false;
        return;
      }
      this.adapter.destroy(s.instance, s.host), this._entries.delete(e);
    }
  }
  getInstance(e) {
    var _a;
    return (_a = this._entries.get(e)) == null ? void 0 : _a.instance;
  }
  getHost(e) {
    var _a;
    return (_a = this._entries.get(e)) == null ? void 0 : _a.host;
  }
  isAttached(e) {
    var _a;
    return ((_a = this._entries.get(e)) == null ? void 0 : _a.attached) === true;
  }
  isEditing(e, t) {
    if (!t) return false;
    const s = this._entries.get(e);
    return !!s && t(s.instance);
  }
  destroyAll() {
    for (const e of this._entries.values()) this.adapter.destroy(e.instance, e.host);
    this._entries.clear();
  }
}
let cs = false;
class gr {
  constructor(e) {
    this._hosts = /* @__PURE__ */ new Map(), this._focusPendingRestore = null, this._d = e;
    const t = this._mdOpts();
    this._state = new rr({ maxDepth: t.maxDepth ?? 2, expandMultiple: t.expandMultiple ?? true, depth: e.getDepth() });
    const s = { create: (o, n) => this._buildInstance(o, n), detach: (o, n) => {
      n.remove();
    }, reattach: () => {
    }, destroy: (o, n) => {
      var _a;
      try {
        (_a = o == null ? void 0 : o.destroy) == null ? void 0 : _a.call(o);
      } catch {
      }
      n.remove();
    } };
    this._cache = new pr(s), e.getFlatModel().registerSplice((o) => this._splice(o)), t.heightMode === "auto" && !cs && (cs = true, console.warn("[OpenGrid] masterDetail.heightMode:'auto' 는 Spike-B(가변높이 VirtualScroll) 통과 전까지 미공개 기능입니다. 'fixed' 로 동작합니다(11_design_F2_v2.md §2.2/C12.2)."));
  }
  _mdOpts() {
    var _a;
    return ((_a = this._d.getOptions()) == null ? void 0 : _a.masterDetail) ?? {};
  }
  get enabled() {
    return this._mdOpts().enabled === true;
  }
  get isActive() {
    return this.enabled && this._state.size > 0;
  }
  get maxDepth() {
    return this._state.maxDepth;
  }
  _resolveRowId(e) {
    if (typeof e == "number") {
      const t = this._d.getFlatModel().resolveFlatRow(e);
      return t.kind === "data" || t.kind === "tree" ? t.rowId ?? null : null;
    }
    return (e == null ? void 0 : e.id) ?? null;
  }
  isExpandedId(e) {
    return this._state.isExpanded(e);
  }
  isRowExpanded(e) {
    const t = this._resolveRowId(e);
    return t != null && this._state.isExpanded(t);
  }
  expandRow(e) {
    if (!this.enabled) return;
    const t = this._resolveRowId(e);
    if (t == null || this._state.isExpanded(t)) return;
    if (!this._state.expand(t)) {
      this._d.announce(this._d.t("detail.depthLimitOpen", { max: this._state.maxDepth }));
      return;
    }
    this._afterToggle(t, "expanded");
  }
  collapseRow(e) {
    const t = this._resolveRowId(e);
    if (t == null || !this._state.isExpanded(t)) return;
    const s = this._hosts.get(t);
    s && document.activeElement && s.contains(document.activeElement) && (this._focusPendingRestore = t), this._state.collapse(t), this._releaseInstance(t), this._afterToggle(t, "collapsed");
  }
  toggleRow(e) {
    const t = this._resolveRowId(e);
    t != null && (this._state.isExpanded(t) ? this.collapseRow(e) : this.expandRow(e));
  }
  collapseAllDetails() {
    const e = this._state.collapseAll();
    if (e.length !== 0) {
      for (const t of e) this._releaseInstance(t);
      this._rebuildAndRender();
      for (const t of e) this._d.emit("rowCollapse", { rowIndex: this._d.getFlatModel().flatIndexOfRowId(t), rowId: t, row: this._d.getRowById(t), host: null });
      this._d.announce(this._d.t("detail.collapsedAllAnnounce"));
    }
  }
  getDetailInstance(e) {
    const t = this._resolveRowId(e);
    if (t != null) return this._cache.getInstance(t);
  }
  resyncPanelWidths() {
    this.isActive && this._rebuildAndRender();
  }
  getPanelHost(e) {
    let t = this._hosts.get(e);
    return t || (t = document.createElement("div"), t.className = "og-detail-host", t.style.cssText = "width:100%;height:100%;box-sizing:border-box;overflow:auto;", this._hosts.set(e, t)), this._cache.getOrCreate(e, () => t), this._focusPendingRestore === e && (this._focusPendingRestore = null), t;
  }
  _buildInstance(e, t) {
    const s = this._mdOpts(), i = this._d.getRowById(e), o = this._d.getDepth(), n = { grid: this._d.getGridInstance(), rowId: e, depth: o, collapse: () => this.collapseRow({ id: e }), refresh: () => {
      var _a, _b;
      try {
        (_b = (_a = this._cache.getInstance(e)) == null ? void 0 : _a.refresh) == null ? void 0 : _b.call(_a);
      } catch {
      }
    } };
    if (typeof s.renderer == "function") {
      const a = s.renderer(i, t, n);
      return a instanceof HTMLElement && a !== t && t.appendChild(a), { destroy: () => {
      } };
    }
    if (s.subgridOptions) {
      if (o + 1 > this._state.maxDepth) return this._d.announce(this._d.t("detail.depthLimitSubgrid", { max: this._state.maxDepth })), { destroy: () => {
      } };
      if (this._d.createSubgrid) return this._d.createSubgrid(t, s.subgridOptions, o + 1);
    }
    return { destroy: () => {
    } };
  }
  onBeforeTeardown() {
    for (const [e, t] of this._hosts) if (this._cache.isAttached(e)) {
      if (this.isEditing(e)) {
        document.body.appendChild(t);
        continue;
      }
      this._cache.detach(e);
    }
  }
  isEditing(e) {
    const t = this._cache.getInstance(e);
    return !!t && typeof t.isEditing == "function" && !!t.isEditing();
  }
  consumePendingFocusRestore() {
    const e = this._focusPendingRestore;
    return this._focusPendingRestore = null, e;
  }
  _releaseInstance(e) {
    const t = this._mdOpts();
    this._cache.remove(e, { cache: t.cache === true }), t.cache !== true && this._hosts.delete(e);
  }
  _splice(e) {
    var _a;
    if (!this.isActive) return e;
    const t = this._mdOpts(), s = ((_a = this._d.getOptions()) == null ? void 0 : _a.rowHeight) ?? 32, i = { expandedRowIds: this._state.expandedRowIds, getRowId: (o) => this._d.getRowId(o), rowHeight: s, height: t.height ?? 200 };
    if (typeof t.detailRowCount == "number") {
      const o = t.detailRowCount;
      i.getSlotCount = () => o;
    }
    return ur(e, i);
  }
  _afterToggle(e, t) {
    this._rebuildAndRender();
    const i = this._d.getFlatModel().flatIndexOfRowId(e), o = t === "expanded" ? this._hosts.get(e) ?? null : null, n = { rowIndex: i, rowId: e, row: this._d.getRowById(e), host: o };
    this._d.emit(t === "expanded" ? "rowExpand" : "rowCollapse", n), this._d.announce(this._d.t(t === "expanded" ? "detail.expandedAnnounce" : "detail.collapsedAnnounce"));
  }
  _rebuildAndRender() {
    var _a;
    const e = this._d.getFlatModel().count();
    (_a = this._d.getVs()) == null ? void 0 : _a.setTotalRows(e), this._d.doRenderFull(e);
  }
  destroy() {
    this._cache.destroyAll(), this._hosts.clear();
  }
}
function fr(r, e) {
  return r == null || Number.isNaN(r) ? "" : e ? e(r, { axis: "tooltip" }) : String(r);
}
function hs(r, e = {}) {
  const { categories: t, series: s } = r, i = ["category", ...s.map((d) => d.name)], o = t.map((d, c) => [d, ...s.map((h) => fr(h.data[c] ?? null, e.numberFormat))]), a = s.map((d) => d.name).join(", ") || B("chart.tooltipEmpty");
  return { caption: e.title ? B("chart.a11ySummary", { title: e.title, categories: t.length, series: a }) : B("chart.a11ySummaryNoTitle", { categories: t.length, series: a }), colHeaders: i, rows: o };
}
const _r = 0.8, mr = 50;
function us(r) {
  if (r == null || r === "") return null;
  if (typeof r == "number") return Number.isFinite(r) ? r : null;
  const e = Number(r);
  return Number.isFinite(e) ? e : null;
}
function ps(r, e, t) {
  if ((r == null ? void 0 : r.type) === "number") return true;
  if (r == null ? void 0 : r.type) return false;
  let s = 0, i = 0;
  for (const o of e) {
    if (s >= mr) break;
    const n = o[t];
    n == null || n === "" || (s++, us(n) !== null && i++);
  }
  return s === 0 ? false : i / s >= _r;
}
function wr(r) {
  return typeof r == "string" ? r : r.field;
}
function yr(r, e) {
  return typeof r == "string" ? e : r.name ?? e;
}
function vr(r, e) {
  let t = null;
  for (const i of e) if (!ps(i, r, i.field)) {
    t = i;
    break;
  }
  const s = e.filter((i) => i !== t && ps(i, r, i.field));
  return { categoryField: (t == null ? void 0 : t.field) ?? null, seriesCols: s };
}
function br(r, e, t) {
  if (typeof t == "function") return t(r, e);
  if (!r.length) return 0;
  switch (t) {
    case "sum":
      return v.sum(r).toNumber();
    case "avg":
      return v.avg(r).toNumber();
    case "min":
      return v.min(r).toNumber();
    case "max":
      return v.max(r).toNumber();
    case "count":
      return r.length;
    default:
      return v.sum(r).toNumber();
  }
}
function xr(r, e) {
  var _a;
  switch (r.kind) {
    case "all":
    case "columns":
      return { rows: e.getAllRows(), effectiveKind: r.kind, rangeFallback: false };
    case "selection":
      return { rows: e.getSelectedRows(), effectiveKind: "selection", rangeFallback: false };
    case "checked":
      return { rows: e.getCheckedRows(), effectiveKind: "checked", rangeFallback: false };
    case "range": {
      const t = r.range ?? ((_a = e.getActiveRange) == null ? void 0 : _a.call(e)) ?? null;
      return !t || !e.getRangeRows ? { rows: e.getSelectedRows(), effectiveKind: "selection", rangeFallback: true } : { rows: e.getRangeRows(t), effectiveKind: "range", rangeFallback: false };
    }
  }
}
function Cr(r, e, t) {
  return r.kind === "range" && e === "range" && r.range && t.getRangeColumns ? t.getRangeColumns(r.range) : t.getVisibleColumns();
}
function Rr(r, e, t = {}) {
  const { rows: s, effectiveKind: i, rangeFallback: o } = xr(r, e), n = Cr(r, i, e);
  let a = null, l;
  if (r.kind === "columns") a = t.category ?? r.category ?? null, l = t.series ?? r.series;
  else if (t.series) a = t.category ?? null, l = t.series;
  else {
    const w = vr(s, n);
    a = t.category ?? w.categoryField, l = w.seriesCols.map((y) => y.field);
  }
  const d = new Map(n.map((w) => [w.field, w])), c = a ? s.map((w) => String(w[a] ?? "")) : s.map((w, y) => String(y + 1)), h = l.map((w) => {
    const y = wr(w), R = d.get(y), A = yr(w, (R == null ? void 0 : R.header) ?? y), S = s.map((C) => us(C[y])), O = typeof w == "string" ? void 0 : w.pattern, z = typeof w == "string" ? void 0 : w.color, $ = { name: A, data: S };
    return O && ($.pattern = O), z && ($.color = z), $;
  }), u = s.length;
  let g = c, p = h, f, m = false;
  if (t.aggregate && c.length > 0) {
    const w = [], y = /* @__PURE__ */ new Map();
    for (let R = 0; R < c.length; R++) {
      const A = c[R];
      y.has(A) ? y.get(A).push(R) : (y.set(A, [R]), w.push(A));
    }
    w.length < c.length && (g = w, p = h.map((R) => ({ ...R, data: w.map((A) => {
      const O = y.get(A).map((z) => R.data[z]).filter((z) => z !== null);
      return O.length ? br(O, A, t.aggregate) : null;
    }) })), f = typeof t.aggregate == "function" ? "custom" : t.aggregate, m = true);
  }
  const _ = { categories: g, series: p, meta: { sourceKind: i, total: u, sampled: m, a11yTable: hs({ categories: g, series: p }, { title: t.title, numberFormat: t.numberFormat }) } };
  return f && (_.meta.aggregatedOp = f), { model: _, rangeFallback: o };
}
function Mr(r) {
  return r === "line" || r === "area";
}
function nt(r) {
  return r == null || Number.isNaN(r) ? null : r;
}
function gs(r) {
  let e = -1, t = -1, s = 1 / 0, i = -1 / 0;
  for (let n = 0; n < r.length; n++) {
    const a = nt(r[n]);
    a != null && (a < s && (s = a, e = n), a > i && (i = a, t = n));
  }
  const o = [];
  return e >= 0 && o.push(e), t >= 0 && o.push(t), o;
}
function kr(r, e) {
  const t = r.length;
  if (e >= t || e <= 2) return Array.from({ length: t }, (a, l) => l);
  const s = (a) => nt(r[a]) ?? 0, i = [0], o = (t - 2) / (e - 2);
  let n = 0;
  for (let a = 0; a < e - 2; a++) {
    let l = 0, d = 0;
    const c = Math.floor((a + 1) * o) + 1;
    let h = Math.floor((a + 2) * o) + 1;
    h = Math.min(h, t);
    const u = h - c;
    for (let y = c; y < h; y++) l += y, d += s(y);
    u > 0 && (l /= u, d /= u);
    const g = Math.floor(a * o) + 1, p = Math.floor((a + 1) * o) + 1, f = n, m = s(n);
    let _ = -1, w = g;
    for (let y = g; y < p && y < t; y++) {
      const R = Math.abs((f - l) * (s(y) - m) - (f - y) * (d - m)) * 0.5;
      R > _ && (_ = R, w = y);
    }
    i.push(w), n = w;
  }
  return i.push(t - 1), i;
}
function Er(r, e, t, s = {}) {
  var _a;
  const i = r.categories.length;
  if (!Number.isFinite(e) || e <= 0 || i <= e) return { model: r, sampled: false };
  let o, n;
  if (Mr(t)) {
    const l = ((_a = r.series[0]) == null ? void 0 : _a.data) ?? new Array(i).fill(0), d = /* @__PURE__ */ new Set([0, i - 1]);
    for (const g of r.series) for (const p of gs(g.data)) d.add(p);
    const c = new Set(d), h = kr(l, e);
    for (const g of h) {
      if (c.size >= e) break;
      c.add(g);
    }
    let u = [...c].sort((g, p) => g - p);
    if (u.length > e) {
      const g = /* @__PURE__ */ new Set([0, i - 1]), p = r.series.map((m) => gs(m.data));
      let f = true;
      for (; f && g.size < e; ) {
        f = false;
        for (const m of p) {
          if (g.size >= e) break;
          const _ = m.find((w) => !g.has(w));
          _ !== void 0 && (g.add(_), f = true);
        }
      }
      u = [...g].sort((m, _) => m - _).slice(0, e);
    }
    o = u.map((g) => r.categories[g]), n = r.series.map((g) => ({ ...g, data: u.map((p) => g.data[p]) }));
  } else {
    const l = e, d = i / l;
    o = [];
    const c = [];
    for (let h = 0; h < l; h++) {
      const u = Math.floor(h * d), g = Math.min(Math.floor((h + 1) * d), i);
      if (u >= g) continue;
      c.push([u, g]);
      const p = r.categories[u], f = r.categories[g - 1];
      o.push(g - u > 1 ? `${p}…${f}` : p);
    }
    n = r.series.map((h) => ({ ...h, data: c.map(([u, g]) => {
      let p = 0, f = false;
      for (let m = u; m < g; m++) {
        const _ = nt(h.data[m]);
        _ != null && (p += _, f = true);
      }
      return f ? p : null;
    }) }));
  }
  return { model: { categories: o, series: n, meta: { ...r.meta, sampled: true, sampledFrom: i, sampledTo: o.length, a11yTable: hs({ categories: o, series: n }, { title: s.title, numberFormat: s.numberFormat }) } }, sampled: true };
}
const fs = ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#F0E442", "#56B4E9", "#D55E00", "#999999"], _s = ["solid", "hatch", "dot", "cross"];
function at(r) {
  return Math.min(255, Math.max(0, r));
}
function Ve(r) {
  const e = r.trim(), t = e.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (t) return { r: at(+t[1]), g: at(+t[2]), b: at(+t[3]) };
  const s = e.replace("#", "");
  return /^[0-9a-f]{3}$/i.test(s) ? { r: parseInt(s[0] + s[0], 16), g: parseInt(s[1] + s[1], 16), b: parseInt(s[2] + s[2], 16) } : /^[0-9a-f]{6}$/i.test(s) ? { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) } : null;
}
function lt(r) {
  const e = r / 255;
  return e <= 0.03928 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4);
}
function ms(r) {
  return 0.2126 * lt(r.r) + 0.7152 * lt(r.g) + 0.0722 * lt(r.b);
}
function ws(r, e) {
  const t = Ve(r), s = Ve(e);
  if (!t || !s) return 1;
  const i = ms(t), o = ms(s), [n, a] = i >= o ? [i, o] : [o, i];
  return (n + 0.05) / (a + 0.05);
}
function Sr(r, e = {}) {
  var _a;
  const t = (e.palette && e.palette.length ? e.palette : fs).slice();
  return !((_a = e.palette) == null ? void 0 : _a.length) && e.primary && Ve(e.primary) && (t.length < 2 || ws(e.primary, t[1]) >= 3) && (t[0] = e.primary), r.map((s, i) => ({ color: s.color ?? t[i % t.length], pattern: s.pattern ?? _s[i % _s.length] }));
}
function ys(r, e) {
  if (r === 0) return 0;
  const t = Math.abs(r), s = Math.floor(Math.log10(t)), i = t / Math.pow(10, s);
  let o;
  return e ? i < 1.5 ? o = 1 : i < 3 ? o = 2 : i < 7 ? o = 5 : o = 10 : i <= 1 ? o = 1 : i <= 2 ? o = 2 : i <= 5 ? o = 5 : o = 10, o * Math.pow(10, s);
}
function dt(r, e) {
  const t = Math.max(0, -Math.floor(Math.log10(e)) + 6), s = Math.pow(10, t), i = Math.round(r * s) / s;
  return i === 0 ? 0 : i;
}
function vs(r, e, t = 6) {
  let s = r, i = e;
  if (s > i && ([s, i] = [i, s]), s === i) if (s === 0) s = -1, i = 1;
  else {
    const u = Math.abs(s) * 0.5;
    s -= u, i += u;
  }
  const o = Math.max(2, t), n = ys(i - s, false), a = ys(n / (o - 1), true), l = dt(Math.floor(s / a) * a, a), d = dt(Math.ceil(i / a) * a, a), c = [], h = Math.round((d - l) / a) + 1;
  for (let u = 0; u < h; u++) c.push(dt(l + u * a, a));
  return { min: l, max: d, step: a, ticks: c };
}
function Fr(r, e, t) {
  for (const s of r) {
    const i = Math.min(s.x, s.x + s.w), o = Math.max(s.x, s.x + s.w), n = Math.min(s.y, s.y + s.h), a = Math.max(s.y, s.y + s.h);
    if (e >= i && e <= o && t >= n && t <= a) return s;
  }
  return null;
}
function Ar(r, e, t) {
  if (!r.length) return null;
  let s = -1, i = 1 / 0;
  for (const a of r) {
    const l = Math.abs(a.cx - e);
    l < i && (i = l, s = a.categoryIndex);
  }
  let o = null, n = 1 / 0;
  for (const a of r) {
    if (a.categoryIndex !== s) continue;
    const l = Math.abs(a.cy - t);
    l < n && (n = l, o = a);
  }
  return o;
}
function bs(r, e, t, s) {
  return r.length ? s === "line" || s === "area" ? Ar(r, e, t) : Fr(r, e, t) : null;
}
const xs = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;padding:0;margin:-1px;", Me = { top: 26, right: 14, bottom: 34, left: 52 }, Te = 3.5;
let Lr = 0;
function ct(r, e, t) {
  return r == null || Number.isNaN(r) ? "" : e.numberFormat ? e.numberFormat(r, { axis: t }) : String(r);
}
class Cs {
  constructor() {
    this.id = "builtin-canvas", this._host = null, this._canvas = null, this._a11yTable = null, this._legend = null, this._tooltip = null, this._live = null, this._model = null, this._w = 480, this._h = 300, this._geoms = [], this._hidden = /* @__PURE__ */ new Set(), this._cursor = { cat: 0, series: 0 }, this._onPoint = null, this._onMouseMove = (e) => {
      if (this._spec.tooltip === false) return;
      const { x: t, y: s } = this._localXY(e), i = bs(this._geoms, t, s, this._spec.type);
      i ? this._showTooltip(i, t, s) : this._hideTooltip();
    }, this._onMouseLeave = () => this._hideTooltip(), this._onClick = (e) => {
      const { x: t, y: s } = this._localXY(e), i = bs(this._geoms, t, s, this._spec.type);
      i && this._emitPoint(i);
    }, this._onKeyDown = (e) => {
      const t = this._model;
      if (!t) return;
      const s = t.categories.length, i = t.series.length;
      let o = true;
      switch (e.key) {
        case "ArrowRight":
          this._cursor.cat = Math.min(s - 1, this._cursor.cat + 1);
          break;
        case "ArrowLeft":
          this._cursor.cat = Math.max(0, this._cursor.cat - 1);
          break;
        case "ArrowDown":
          this._cursor.series = Math.min(i - 1, this._cursor.series + 1);
          break;
        case "ArrowUp":
          this._cursor.series = Math.max(0, this._cursor.series - 1);
          break;
        case "Enter":
        case " ": {
          const n = this._cursorPoint();
          n && this._emitPoint(n);
          break;
        }
        default:
          o = false;
      }
      o && (e.preventDefault(), this._announceCursor());
    };
  }
  async init(e, t) {
    this._host = e, this._spec = t, e.classList.add("og-chart"), getComputedStyle(e).position === "static" && (e.style.position = "relative");
    const s = document.createElement("canvas");
    s.className = "og-chart-canvas", s.style.cssText = "display:block;", s.setAttribute("role", "img"), s.tabIndex = 0, s.setAttribute("aria-label", t.title ?? B("chart.canvasDefault")), this._canvas = s;
    const i = document.createElement("table");
    i.className = "og-chart-a11y", i.style.cssText = xs;
    const o = `og-chart-a11y-${++Lr}`;
    i.id = o, s.setAttribute("aria-describedby", o), this._a11yTable = i;
    const n = document.createElement("div");
    n.className = "og-chart-legend", n.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;", this._legend = n;
    const a = document.createElement("div");
    a.className = "og-chart-tooltip", a.style.cssText = "position:absolute;pointer-events:none;display:none;z-index:5;padding:4px 8px;font-size:12px;border-radius:4px;background:#333;color:#fff;white-space:nowrap;", this._tooltip = a;
    const l = document.createElement("div");
    l.className = "og-chart-live", l.setAttribute("aria-live", "polite"), l.style.cssText = xs, this._live = l, e.appendChild(s), e.appendChild(i), e.appendChild(n), e.appendChild(a), e.appendChild(l), s.addEventListener("mousemove", this._onMouseMove), s.addEventListener("mouseleave", this._onMouseLeave), s.addEventListener("click", this._onClick), s.addEventListener("keydown", this._onKeyDown);
  }
  render(e, t) {
    var _a;
    this._model = e, this._spec = t, this._cursor.cat = e.categories.length ? Math.min(Math.max(this._cursor.cat, 0), e.categories.length - 1) : 0, this._cursor.series = e.series.length ? Math.min(Math.max(this._cursor.series, 0), e.series.length - 1) : 0, this._canvas && this._canvas.setAttribute("aria-label", ((_a = t.a11y) == null ? void 0 : _a.caption) ?? t.title ?? B("chart.canvasDefault")), this._renderA11yTable(e, t), this._renderLegend(e, t), this._computeGeometry(e, t), this._paint(e, t), this._hideTooltip();
  }
  resize(e, t) {
    this._w = Math.max(80, Math.floor(e)), this._h = Math.max(60, Math.floor(t)), this._model && this.render(this._model, this._spec);
  }
  onPointClick(e) {
    this._onPoint = e;
  }
  destroy() {
    var _a, _b, _c, _d, _e2, _f;
    const e = this._canvas;
    e && (e.removeEventListener("mousemove", this._onMouseMove), e.removeEventListener("mouseleave", this._onMouseLeave), e.removeEventListener("click", this._onClick), e.removeEventListener("keydown", this._onKeyDown)), (_a = this._a11yTable) == null ? void 0 : _a.remove(), (_b = this._canvas) == null ? void 0 : _b.remove(), (_c = this._legend) == null ? void 0 : _c.remove(), (_d = this._tooltip) == null ? void 0 : _d.remove(), (_e2 = this._live) == null ? void 0 : _e2.remove(), (_f = this._host) == null ? void 0 : _f.classList.remove("og-chart"), this._host = this._canvas = this._a11yTable = this._legend = this._tooltip = this._live = null, this._geoms = [], this._onPoint = null;
  }
  getGeometry() {
    return this._geoms;
  }
  _renderA11yTable(e, t) {
    const s = this._a11yTable;
    if (!s) return;
    const i = e.meta.a11yTable;
    s.innerHTML = "";
    const o = document.createElement("caption");
    o.textContent = i.caption, s.appendChild(o);
    const n = document.createElement("thead"), a = document.createElement("tr");
    for (const d of i.colHeaders) {
      const c = document.createElement("th");
      c.scope = "col", c.textContent = d, a.appendChild(c);
    }
    n.appendChild(a), s.appendChild(n);
    const l = document.createElement("tbody");
    for (const d of i.rows) {
      const c = document.createElement("tr");
      d.forEach((h, u) => {
        const g = document.createElement(u === 0 ? "th" : "td");
        u === 0 && (g.scope = "row"), g.textContent = h, c.appendChild(g);
      }), l.appendChild(c);
    }
    s.appendChild(l);
  }
  _renderLegend(e, t) {
    var _a;
    const s = this._legend;
    if (!s) return;
    if (t.legend === false) {
      s.style.display = "none";
      return;
    }
    s.style.display = "flex";
    const i = this._styles(e, t), o = Array.from(s.querySelectorAll("button.og-chart-legend-item"));
    if (o.length === e.series.length && o.every((d, c) => d.dataset.seriesName === e.series[c].name)) {
      e.series.forEach((d, c) => {
        const h = o[c], u = !this._hidden.has(c);
        this._updateLegendButton(h, e.series[c], i[c], u);
      });
      return;
    }
    const a = document.activeElement, l = a instanceof HTMLButtonElement ? o.indexOf(a) : -1;
    if (s.innerHTML = "", e.series.forEach((d, c) => {
      const h = document.createElement("button");
      h.type = "button", h.className = "og-chart-legend-item", h.dataset.seriesName = d.name, h.style.cssText = "display:inline-flex;align-items:center;gap:5px;min-height:24px;padding:2px 6px;font-size:12px;cursor:pointer;background:none;border:1px solid transparent;border-radius:4px;";
      const u = document.createElement("span");
      u.setAttribute("aria-hidden", "true"), u.style.cssText = "display:inline-block;width:12px;height:12px;border-radius:2px;";
      const g = document.createElement("span");
      h.appendChild(u), h.appendChild(g), this._updateLegendButton(h, d, i[c], !this._hidden.has(c)), h.addEventListener("click", () => {
        const p = !this._hidden.has(c);
        p ? this._hidden.add(c) : this._hidden.delete(c), this._updateLegendButton(h, d, i[c], !p), this._computeGeometry(this._model, this._spec), this._paint(this._model, this._spec);
      }), s.appendChild(h);
    }), l >= 0) {
      const d = s.querySelectorAll("button.og-chart-legend-item");
      (_a = d[l] ?? d[d.length - 1]) == null ? void 0 : _a.focus();
    }
  }
  _updateLegendButton(e, t, s, i) {
    e.setAttribute("aria-pressed", String(i)), e.style.opacity = i ? "1" : "0.45";
    const o = e.querySelector("span[aria-hidden]");
    o && (o.style.background = s.color);
    const n = e.querySelector("span:not([aria-hidden])");
    n && (n.textContent = `${t.name} (${s.pattern})`);
  }
  _styles(e, t) {
    var _a, _b;
    return Sr(e.series.map((s) => ({ color: s.color, pattern: s.pattern })), { palette: t.palette ?? ((_a = t.theme) == null ? void 0 : _a.palette), primary: (_b = t.theme) == null ? void 0 : _b.primary });
  }
  _plotRect() {
    return { x: Me.left, y: Me.top, w: Math.max(1, this._w - Me.left - Me.right), h: Math.max(1, this._h - Me.top - Me.bottom) };
  }
  _valueExtent(e) {
    let t = 1 / 0, s = -1 / 0;
    return e.series.forEach((i, o) => {
      if (!this._hidden.has(o)) for (const n of i.data) n == null || Number.isNaN(n) || (n < t && (t = n), n > s && (s = n));
    }), (!Number.isFinite(t) || !Number.isFinite(s)) && (t = 0, s = 1), (this._spec.type === "bar" || this._spec.type === "bar-stacked" || this._spec.type === "bar-grouped") && (t = Math.min(0, t), s = Math.max(0, s)), { min: t, max: s };
  }
  _computeGeometry(e, t) {
    const s = [], i = this._plotRect(), n = e.categories.length || 1, { min: a, max: l } = this._valueExtent(e), d = vs(a, l, 6), c = (f) => {
      const m = (f - d.min) / (d.max - d.min || 1);
      return i.y + i.h - m * i.h;
    }, h = c(0 < d.min ? d.min : 0 > d.max ? d.max : 0), u = i.w / n, g = t.type === "line" || t.type === "area", p = e.series.map((f, m) => ({ s: f, si: m })).filter(({ si: f }) => !this._hidden.has(f));
    if (g) for (const { s: f, si: m } of p) f.data.forEach((_, w) => {
      const y = i.x + u * w + u / 2, R = _ == null ? NaN : c(_);
      Number.isNaN(R) || s.push({ seriesIndex: m, categoryIndex: w, x: y - Te, y: R - Te, w: Te * 2, h: Te * 2, cx: y, cy: R });
    });
    else {
      const f = p.length || 1, m = u * 0.72, _ = m / f;
      p.forEach(({ s: w, si: y }, R) => {
        w.data.forEach((A, S) => {
          if (A == null || Number.isNaN(A)) return;
          const z = i.x + u * S + (u - m) / 2 + _ * R, $ = c(A), C = Math.min($, h), E = Math.abs(h - $);
          s.push({ seriesIndex: y, categoryIndex: S, x: z, y: C, w: _, h: E, cx: z + _ / 2, cy: C + E / 2 });
        });
      });
    }
    this._geoms = s;
  }
  _paint(e, t) {
    const s = this._canvas;
    if (!s) return;
    const i = Dr();
    s.width = Math.floor(this._w * i), s.height = Math.floor(this._h * i), s.style.width = `${this._w}px`, s.style.height = `${this._h}px`;
    const o = s.getContext ? s.getContext("2d") : null;
    if (!o) return;
    o.setTransform(i, 0, 0, i, 0, 0), o.clearRect(0, 0, this._w, this._h);
    const n = t.theme, a = this._plotRect(), { min: l, max: d } = this._valueExtent(e), c = vs(l, d, 6), h = (f) => {
      const m = (f - c.min) / (c.max - c.min || 1);
      return a.y + a.h - m * a.h;
    };
    o.strokeStyle = (n == null ? void 0 : n.gridLine) || (n == null ? void 0 : n.border) || "#e0e0e0", o.fillStyle = (n == null ? void 0 : n.text) || "#212121", o.lineWidth = 1, o.font = `${(n == null ? void 0 : n.fontSize) || 12}px ${(n == null ? void 0 : n.fontFamily) || "sans-serif"}`, o.textAlign = "right", o.textBaseline = "middle";
    for (const f of c.ticks) {
      const m = h(f);
      o.beginPath(), o.moveTo(a.x, m), o.lineTo(a.x + a.w, m), o.stroke(), o.fillText(ct(f, t, "y"), a.x - 6, m);
    }
    o.textAlign = "center", o.textBaseline = "top";
    const u = a.w / (e.categories.length || 1);
    e.categories.forEach((f, m) => {
      const _ = a.x + u * m + u / 2;
      o.fillText(String(f), _, a.y + a.h + 6);
    });
    const g = this._styles(e, t);
    if (t.type === "line" || t.type === "area") {
      const f = /* @__PURE__ */ new Map();
      for (const m of this._geoms) {
        let _ = f.get(m.seriesIndex);
        _ || (_ = [], f.set(m.seriesIndex, _)), _.push(m);
      }
      for (const [m, _] of f) {
        _.sort((w, y) => w.categoryIndex - y.categoryIndex), o.strokeStyle = g[m].color, o.lineWidth = 2, o.setLineDash(Ir(g[m].pattern)), o.beginPath(), _.forEach((w, y) => y === 0 ? o.moveTo(w.cx, w.cy) : o.lineTo(w.cx, w.cy)), o.stroke(), o.setLineDash([]), o.fillStyle = g[m].color;
        for (const w of _) o.beginPath(), o.arc(w.cx, w.cy, Te, 0, Math.PI * 2), o.fill();
      }
    } else for (const f of this._geoms) o.fillStyle = g[f.seriesIndex].color, o.fillRect(f.x, f.y, f.w, f.h), Tr(o, f, g[f.seriesIndex].pattern);
  }
  _localXY(e) {
    var _a;
    const t = (_a = this._canvas) == null ? void 0 : _a.getBoundingClientRect();
    if (!t || t.width === 0 && t.height === 0) return { x: e.offsetX ?? 0, y: e.offsetY ?? 0 };
    const s = t.width > 0 ? this._w / t.width : 1, i = t.height > 0 ? this._h / t.height : 1;
    return { x: (e.clientX - t.left) * s, y: (e.clientY - t.top) * i };
  }
  _cursorPoint() {
    return this._geoms.find((e) => e.categoryIndex === this._cursor.cat && e.seriesIndex === this._cursor.series) ?? null;
  }
  _announceCursor() {
    const e = this._model;
    if (!e) return;
    const t = e.series[this._cursor.series], s = e.categories[this._cursor.cat], i = (t == null ? void 0 : t.data[this._cursor.cat]) ?? null, o = `${(t == null ? void 0 : t.name) ?? ""}, ${s ?? ""}: ${ct(i, this._spec, "tooltip") || B("chart.tooltipEmpty")}`;
    this._live && (this._live.textContent = o);
    const n = this._cursorPoint();
    n && this._showTooltip(n, n.cx, n.cy);
  }
  _pointOf(e) {
    var _a, _b;
    const t = this._model;
    return { seriesName: ((_a = t.series[e.seriesIndex]) == null ? void 0 : _a.name) ?? "", category: t.categories[e.categoryIndex] ?? "", value: ((_b = t.series[e.seriesIndex]) == null ? void 0 : _b.data[e.categoryIndex]) ?? null, index: e.categoryIndex };
  }
  _emitPoint(e) {
    var _a;
    (_a = this._onPoint) == null ? void 0 : _a.call(this, this._pointOf(e));
  }
  _showTooltip(e, t, s) {
    const i = this._tooltip;
    if (!i || this._spec.tooltip === false) return;
    const o = this._pointOf(e);
    i.textContent = `${o.seriesName} · ${o.category}: ${ct(o.value, this._spec, "tooltip")}`, i.style.display = "block", i.style.left = `${t + 10}px`, i.style.top = `${s + 10}px`;
  }
  _hideTooltip() {
    this._tooltip && (this._tooltip.style.display = "none");
  }
}
function Ir(r) {
  switch (r) {
    case "hatch":
      return [6, 3];
    case "dot":
      return [2, 3];
    case "cross":
      return [8, 3, 2, 3];
    default:
      return [];
  }
}
function Tr(r, e, t) {
  if (t === "solid" || !t) return;
  r.save(), r.beginPath(), r.rect(e.x, e.y, e.w, e.h), r.clip(), r.strokeStyle = "rgba(255,255,255,0.55)", r.lineWidth = 1;
  const s = 5;
  if (t === "hatch" || t === "cross") for (let i = -e.h; i < e.w; i += s) r.beginPath(), r.moveTo(e.x + i, e.y + e.h), r.lineTo(e.x + i + e.h, e.y), r.stroke();
  if (t === "cross") for (let i = 0; i < e.w + e.h; i += s) r.beginPath(), r.moveTo(e.x + i, e.y), r.lineTo(e.x + i - e.h, e.y + e.h), r.stroke();
  if (t === "dot") {
    r.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = e.y + s; i < e.y + e.h; i += s) for (let o = e.x + s; o < e.x + e.w; o += s) r.beginPath(), r.arc(o, i, 1, 0, Math.PI * 2), r.fill();
  }
  r.restore();
}
function Dr() {
  return typeof window < "u" && window.devicePixelRatio ? window.devicePixelRatio : 1;
}
const Or = 500, $r = 50, zr = 100, ht = { width: 480, height: 300 };
let Br = 0;
class Hr {
  constructor(e) {
    this._charts = /* @__PURE__ */ new Map(), this._d = e;
  }
  createChart(e) {
    var _a;
    const t = `chart-${++Br}`, s = this._d.getContainer(), i = this._snapshotRange(e), { adapter: o, engineFallback: n } = this._resolveAdapter(e), { panel: a, host: l, badgeBox: d, backdrop: c } = this._buildPanel(e, s), h = { id: t, config: e, adapter: o, panel: a, badgeBox: d, host: l, backdrop: c, model: null, spec: null, snapshot: i, liveHandler: null, debounceTimer: null, resizeObserver: null, resizeDebounceTimer: null, renderSize: { ...ht }, localEvents: /* @__PURE__ */ new Map(), destroyed: false, instance: null };
    try {
      this._charts.set(t, h);
      const { model: u, rangeFallback: g } = this._extract(h);
      h.model = u, h.spec = this._buildSpec(e, u), h.renderSize = this._resolveRenderSize(e, l), o.init(l, h.spec), o.resize(h.renderSize.width, h.renderSize.height), o.render(u, h.spec), (_a = o.onPointClick) == null ? void 0 : _a.call(o, (f) => this._onPointClick(h, f)), this._renderBadges(h, g, n), e.live !== false && this._subscribeLive(h), this._attachResizeObserver(h);
      const p = this._makeInstance(h);
      return this._bindOptionCallbacks(h), this._emit(h, "chartCreate", p), this._d.emit("chartCreate", p), p;
    } catch (u) {
      try {
        this._destroy(h);
      } catch {
      }
      throw u;
    }
  }
  _resolveRenderSize(e, t) {
    var _a;
    const s = e.size ?? ht, i = t.clientWidth;
    return { width: ((_a = e.size) == null ? void 0 : _a.width) ?? (i > 0 ? i : s.width), height: s.height };
  }
  _attachResizeObserver(e) {
    if (typeof ResizeObserver > "u") return;
    const t = zr, s = new ResizeObserver(() => {
      e.destroyed || (clearTimeout(e.resizeDebounceTimer), e.resizeDebounceTimer = setTimeout(() => {
        if (e.destroyed) return;
        const i = e.host.clientWidth;
        i > 0 && i !== e.renderSize.width && (e.renderSize = { width: i, height: e.renderSize.height }, e.adapter.resize(e.renderSize.width, e.renderSize.height));
      }, t));
    });
    s.observe(e.host), e.resizeObserver = s;
  }
  getCharts() {
    return [...this._charts.values()].filter((e) => !e.destroyed).map((e) => this._makeInstance(e));
  }
  destroyCharts() {
    for (const e of [...this._charts.values()]) this._destroy(e);
  }
  _snapshotRange(e) {
    var _a, _b;
    if (e.source.kind !== "range") return null;
    const t = e.source.range ?? ((_b = (_a = this._d).getActiveRange) == null ? void 0 : _b.call(_a)) ?? null;
    if (!t) return null;
    const s = this._d.getFlatModel(), i = this._d.getVisibleColumns(), o = [];
    for (let a = t.startRow; a <= t.endRow; a++) {
      const l = s.rowIdOfFlat(a);
      l != null && o.push(l);
    }
    const n = [];
    for (let a = t.startCol; a <= t.endCol; a++) {
      const l = i[a];
      l && n.push(l.field);
    }
    return { rowIds: o, fields: n };
  }
  _extract(e) {
    var _a;
    const t = e.config, s = ((_a = this._d.getOptions()) == null ? void 0 : _a.chart) ?? {}, i = t.numberFormat ?? s.numberFormat, o = this._extractDeps(e), n = Rr(t.source, o, { category: t.category, series: t.series ?? (t.source.kind === "columns" ? t.source.series : void 0), aggregate: t.aggregate, title: t.title, numberFormat: i }), a = t.maxPoints ?? s.maxPoints ?? Or;
    return { model: Er(n.model, a, t.type, { title: t.title, numberFormat: i }).model, rangeFallback: n.rangeFallback };
  }
  _extractDeps(e) {
    const t = e.snapshot;
    return { getAllRows: () => this._d.getAllRows(), getSelectedRows: () => this._d.getSelectedRows(), getCheckedRows: () => this._d.getCheckedRows(), getVisibleColumns: () => this._d.getVisibleColumns(), getActiveRange: this._d.getActiveRange ? () => this._d.getActiveRange() : void 0, getRangeRows: t ? () => t.rowIds.map((s) => this._d.getRowById(s)).filter((s) => !!s) : void 0, getRangeColumns: t ? () => {
      const s = this._d.getVisibleColumns(), i = new Set(t.fields), o = s.filter((n) => i.has(n.field));
      return o.length ? o : s;
    } : void 0 };
  }
  _buildSpec(e, t) {
    var _a;
    const s = ((_a = this._d.getOptions()) == null ? void 0 : _a.chart) ?? {}, i = this._snapshotTheme(), o = { type: e.type, theme: i, a11y: t.meta.a11yTable, palette: e.palette ?? s.palette ?? i.palette };
    e.title !== void 0 && (o.title = e.title), e.legend !== void 0 && (o.legend = e.legend), e.tooltip !== void 0 && (o.tooltip = e.tooltip), e.axis !== void 0 && (o.axis = e.axis);
    const n = e.numberFormat ?? s.numberFormat;
    return n && (o.numberFormat = n), o;
  }
  _readVar(e, t, s) {
    return getComputedStyle(e).getPropertyValue(t).trim() || s;
  }
  _snapshotTheme() {
    var _a;
    const e = this._d.getContainer(), t = ((_a = this._d.getOptions()) == null ? void 0 : _a.chart) ?? {}, s = this._readVar(e, "--og-primary", "#1976d2"), i = this._readVar(e, "--og-font-size", "13px"), o = parseInt(i, 10) || 13;
    return { primary: s, border: this._readVar(e, "--og-border-color", "#e0e0e0"), text: this._readVar(e, "--og-row-color", "#212121"), bg: this._readVar(e, "--og-row-bg", "#ffffff"), gridLine: this._readVar(e, "--og-border-color", "#e0e0e0"), fontFamily: getComputedStyle(e).fontFamily || "sans-serif", fontSize: o, palette: (t.palette && t.palette.length ? t.palette : fs).slice() };
  }
  _buildPanel(e, t) {
    var _a, _b;
    const s = e.placement ?? ((_b = (_a = this._d.getOptions()) == null ? void 0 : _a.chart) == null ? void 0 : _b.placement) ?? "docked", i = e.size ?? ht, o = document.createElement("div");
    o.className = "og-chart-panel", o.setAttribute("data-placement", s), o.setAttribute("role", "group"), o.setAttribute("aria-label", e.title ?? this._d.t("chart.defaultTitle"));
    const n = document.createElement("div");
    n.className = "og-chart-badges", n.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;";
    const a = document.createElement("div");
    a.className = "og-chart-host", a.style.cssText = `position:relative;width:${i.width}px;max-width:100%;`;
    let l = null;
    const d = this._readVar(t, "--og-row-bg", "#ffffff"), c = this._readVar(t, "--og-border-color", "#e0e0e0"), h = `box-sizing:border-box;padding:10px;background:${d};border:1px solid ${c};border-radius:6px;`;
    return s === "modal" ? (l = document.createElement("div"), l.className = "og-chart-backdrop", l.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center;", o.style.cssText = h + "max-width:90vw;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,0.3);", l.appendChild(o), l.addEventListener("click", (u) => {
      u.target === l && this._destroyById(o);
    }), document.body.appendChild(l)) : s === "inline" ? (o.style.cssText = h + "width:100%;", (e.mount ?? t).appendChild(o)) : s === "floating" ? (o.style.cssText = h + "position:absolute;top:12px;right:12px;z-index:20;box-shadow:0 4px 16px rgba(0,0,0,0.18);", t.appendChild(o)) : (o.style.cssText = h + "width:100%;margin-top:8px;", t.appendChild(o)), o.appendChild(n), o.appendChild(a), { panel: o, host: a, badgeBox: n, backdrop: l };
  }
  _renderBadges(e, t, s) {
    var _a;
    const i = e.badgeBox;
    i.innerHTML = "";
    const o = e.model.meta, n = [];
    o.sampled && o.sampledFrom && n.push(this._d.t("chart.badgeSampled", { to: (_a = o.sampledTo) == null ? void 0 : _a.toLocaleString(), from: o.sampledFrom.toLocaleString() })), o.aggregatedOp && n.push(this._d.t("chart.badgeAggregated", { op: o.aggregatedOp })), o.pieReducedToFirst && n.push(this._d.t("chart.badgePieFirstSeries")), o.negativesAbsInPie && n.push(this._d.t("chart.badgeNegativesAbs")), t && n.push(this._d.t("chart.badgeRangeFallback")), s && n.push(this._d.t("chart.badgeEngineFallback", { engine: s }));
    for (const a of n) {
      const l = document.createElement("span");
      l.className = "og-chart-badge", l.style.cssText = "display:inline-block;padding:2px 8px;font-size:11px;border-radius:10px;background:#fff3cd;color:#8a6d3b;border:1px solid #ffe08a;", l.textContent = a, i.appendChild(l);
    }
    i.style.display = n.length ? "flex" : "none", n.length && this._d.announce(this._d.t("chart.announcePrefix", { badges: n.join(", ") }));
  }
  _subscribeLive(e) {
    var _a;
    const s = (((_a = this._d.getOptions()) == null ? void 0 : _a.chart) ?? {}).debounceMs ?? $r, i = () => {
      e.destroyed || (clearTimeout(e.debounceTimer), e.debounceTimer = setTimeout(() => {
        e.destroyed || this._refresh(e);
      }, s));
    };
    e.liveHandler = i, this._d.on("dataChange", i), this._d.on("formulaRecalc", i);
  }
  _refresh(e) {
    if (e.destroyed) return;
    const { model: t, rangeFallback: s } = this._extract(e);
    e.model = t, e.spec = this._buildSpec(e.config, t), e.adapter.render(t, e.spec), this._renderBadges(e, s, null), this._emit(e, "chartRender", { id: e.id, model: t }), this._d.emit("chartRender", { id: e.id, model: t });
  }
  _resolveAdapter(e) {
    var _a, _b;
    const t = e.engine ?? ((_b = (_a = this._d.getOptions()) == null ? void 0 : _a.chart) == null ? void 0 : _b.defaultEngine) ?? "builtin";
    return t && typeof t == "object" ? { adapter: t, engineFallback: null } : t === "chartjs" || t === "echarts" ? { adapter: new Cs(), engineFallback: t } : { adapter: new Cs(), engineFallback: null };
  }
  _onPointClick(e, t) {
    this._emit(e, "chartPointClick", { id: e.id, point: t }), this._d.emit("chartPointClick", { id: e.id, point: t });
  }
  _makeInstance(e) {
    if (e.instance) return e.instance;
    const t = { id: e.id, update: (s) => {
      e.destroyed || (s && (e.config = { ...e.config, ...s }), s && (s.source || s.category || s.series) && (e.snapshot = this._snapshotRange(e.config)), this._refresh(e));
    }, refresh: () => this._refresh(e), setType: (s) => {
      e.destroyed || (e.config = { ...e.config, type: s }, this._refresh(e));
    }, destroy: () => this._destroy(e), toBlob: (s) => e.adapter.toBlob ? e.adapter.toBlob(s) : Promise.resolve(null), getModel: () => e.model, on: (s, i) => this._on(e, s, i) };
    return e.instance = t, t;
  }
  _bindOptionCallbacks(e) {
    var _a;
    const t = ((_a = this._d.getOptions()) == null ? void 0 : _a.chart) ?? {}, s = this._makeInstance(e);
    typeof t.onChartCreate == "function" && t.onChartCreate(s), typeof t.onChartRender == "function" && this._on(e, "chartRender", t.onChartRender), typeof t.onChartPointClick == "function" && this._on(e, "chartPointClick", t.onChartPointClick), typeof t.onChartDestroy == "function" && this._on(e, "chartDestroy", t.onChartDestroy);
  }
  _on(e, t, s) {
    const i = e.localEvents.get(t) ?? [];
    i.push(s), e.localEvents.set(t, i);
  }
  _emit(e, t, ...s) {
    for (const i of e.localEvents.get(t) ?? []) try {
      i(...s);
    } catch {
    }
  }
  _destroyById(e) {
    for (const t of this._charts.values()) if (t.panel === e) {
      this._destroy(t);
      return;
    }
  }
  _destroy(e) {
    var _a;
    if (!e.destroyed) {
      e.destroyed = true, e.liveHandler && (this._d.off("dataChange", e.liveHandler), this._d.off("formulaRecalc", e.liveHandler)), clearTimeout(e.debounceTimer), clearTimeout(e.resizeDebounceTimer);
      try {
        (_a = e.resizeObserver) == null ? void 0 : _a.disconnect();
      } catch {
      }
      try {
        e.adapter.destroy();
      } catch {
      }
      (e.backdrop ?? e.panel).remove(), this._emit(e, "chartDestroy", { id: e.id }), this._d.emit("chartDestroy", { id: e.id }), e.localEvents.clear(), this._charts.delete(e.id);
    }
  }
}
class Pr {
  constructor(e, t) {
    this._originals = /* @__PURE__ */ new Map(), this._hadOwn = /* @__PURE__ */ new Map(), this._stack = /* @__PURE__ */ new Map(), this._strategies = /* @__PURE__ */ new Map(), this._callPath = [], this._host = e, this._strict = (t == null ? void 0 : t.strict) ?? true, this._maxDepth = (t == null ? void 0 : t.maxDepth) ?? 32;
  }
  override(e, t, s = {}) {
    if (typeof t != "function") throw new TypeError(`OverrideKernel.override: fn for "${e}" must be a function`);
    if (!this._originals.has(e)) {
      const o = this._host[e];
      if (typeof o != "function") throw new TypeError(`OverrideKernel.override: host["${e}"] is not a function`);
      this._hadOwn.set(e, Object.prototype.hasOwnProperty.call(this._host, e)), this._originals.set(e, o.bind(this._host));
    }
    const i = this._stack.get(e) ?? [];
    return i.push({ fn: t, opts: s }), this._stack.set(e, i), this._host[e] = this._buildDispatcher(e), this._host;
  }
  _buildDispatcher(e) {
    var _a;
    const t = this._originals.get(e), s = this._stack.get(e) ?? [], i = s.reduce((d, c) => (...h) => c.fn(d, ...h), t), o = ((_a = s[s.length - 1]) == null ? void 0 : _a.opts) ?? {}, n = o.reentrant === true, a = o.onError === "fallback", l = this;
    return function(...d) {
      if (!n && l._callPath.indexOf(e) !== -1) return t(...d);
      if (l._callPath.length >= l._maxDepth) {
        if (l._strict && !a) throw new Error(`OverrideKernel: max override depth (${l._maxDepth}) exceeded at "${e}"`);
        return t(...d);
      }
      l._callPath.push(e);
      try {
        return i(...d);
      } catch (c) {
        if (a && !l._strict) return console.warn(`[og.override:${e}]`, c), t(...d);
        if (a && l._strict) return console.warn(`[og.override:${e}]`, c), t(...d);
        throw c;
      } finally {
        l._callPath.pop();
      }
    };
  }
  strategy(e, t) {
    if (typeof t != "function") throw new TypeError(`OverrideKernel.strategy: fn for "${e}" must be a function`);
    return this._strategies.set(e, t), this._host;
  }
  getStrategy(e, t) {
    return this._strategies.get(e) ?? t;
  }
  hasStrategy(e) {
    return this._strategies.has(e);
  }
  restore(e) {
    return this._originals.has(e) ? (this._hadOwn.get(e) ? this._host[e] = this._originals.get(e) : delete this._host[e], this._originals.delete(e), this._hadOwn.delete(e), this._stack.delete(e), this._host) : this._host;
  }
  restoreAll() {
    for (const e of [...this._originals.keys()]) this.restore(e);
    return this._strategies.clear(), this._callPath = [], this._host;
  }
  hasOverride(e) {
    return this._originals.has(e);
  }
  getOverrideNames() {
    return [...this._originals.keys()];
  }
}
const ut = "_ogRowId";
class me {
  static compose(e, t, s, i) {
    const o = me.buildCoreServices(e, t, s), n = me.buildFormula(e, o), a = me.buildManagers(e, o, n, i), l = me.buildOverrideKernel(e, a);
    return { mounted: me.mount(e, l) };
  }
  static buildCoreServices(e, t, s) {
    const i = typeof t == "string" ? document.querySelector(t) : t;
    if (!i) throw new Error(`OpenGrid: container not found: ${t}`);
    if (e._container = i, e._options = { height: "100%", width: "100%", rowHeight: 32, headerHeight: 34, footerHeight: 30, autoHeight: false, fillWidth: false, defaultColumnWidth: 100, editable: false, editMode: "dblclick", history: true, historySize: 100, selection: "single", clipboard: true, sortable: true, multiSort: true, filterable: true, defaultSort: [], frozenColumns: 0, frozenRows: 0, rowNumber: false, stateColumn: false, checkColumn: false, draggable: false, crossGrid: false, crossGridMapping: "auto", mergeCells: false, groupBy: [], summary: void 0, treeMode: "auto", treeId: "id", treeParentId: "parentId", expandOnLoad: false, pagination: false, pageSize: 50, footer: void 0, footerPosition: "bottom", theme: "default", skin: "default", cssVars: {}, ariaLabel: "OPEN_GRID 데이터 그리드", ...s }, e._data = new eo(ut), e._flatModel = new no({ getDataLayer: () => e._data, rowIdField: ut }), e._rowMgr = new ao(e._data), e._colLayout = new wt(e._options.columns, e._options.frozenColumns), s.locale || s.messages) {
      const o = se.child();
      s.messages && o.applyOverrides(s.messages), s.locale && (o.setActive(s.locale), e._container.setAttribute("lang", o.meta().intlLocale)), e._locales = o;
    } else e._locales = null;
    return { _phase: "core" };
  }
  static buildFormula(e, t) {
    var _a, _b;
    return e._formula = new uo({ getData: () => e._data, getColLayout: () => e._colLayout, getFlatModel: () => e._flatModel, getRecalc: () => e._recalc, getDirtySeeds: () => e._formulaDirtySeeds, getOptions: () => e._options, emit: (s, i) => {
      e.emit(s, i);
    }, announce: (s) => e._announce(s), t: (s, i) => e.t(s, i), doRenderWindow: () => e._doRender(...e._visRange()) }), e._recalc = new is({ accessor: e._formula.buildAccessor(), setComputedValue: (s, i, o) => e._data.setComputedValueByRowId(s, i, o), onFormulaError: (s, i, o) => e._formula.handleFormulaError(s, i, o), refMode: ((_a = e._options.formula) == null ? void 0 : _a.refMode) ?? "stable", divisionPrecision: ((_b = e._options.formula) == null ? void 0 : _b.divisionPrecision) ?? 30 }), { _phase: "formula" };
  }
  static buildManagers(e, t, s, i) {
    return e._editMgr = new Oo({ data: e._data, colLayout: e._colLayout, getRenderer: () => e._renderer, getContainer: () => e._container, getOptions: () => e._options, emit: (o, ...n) => e.emit(o, ...n), doRender: () => e._doRender(...e._visRange()), announce: (o) => e._announce(o), t: (o, n) => e.t(o, n), writeCell: (o, n, a) => e.writeCell(o, n, a), scrollToRow: (o) => {
      var _a;
      return (_a = e._vs) == null ? void 0 : _a.scrollToRow(o);
    }, getVisibleLeaves: () => e._colLayout.visibleLeaves, hasCellFormula: (o, n) => e.hasCellFormula(o, n), getCellFormula: (o, n) => e.getCellFormula(o, n), setCellFormula: (o, n, a) => e.setCellFormula(o, n, a), clearCellFormula: (o, n) => e.clearCellFormula(o, n) }), e._exportMgr = new $o({ getData: () => e._data.getData(), getColLayout: () => e._colLayout, getColWidths: () => e._colWidths, getOptions: () => e._options, getContainer: () => e._container, getMaskEnabled: (o) => e.getMaskEnabled(o), getWsManager: () => e._wsManager, getStrategy: (o, n) => e._ovk.getStrategy(o, n), t: (o, n) => e.t(o, n), getMeta: () => (e._locales ?? se).meta() }), e._footerMgr = new zo({ getData: () => e._data.getData(), getColLayout: () => e._colLayout, getColWidths: () => e._colWidths, getOptions: () => e._options, getContainer: () => e._container, getStrategy: (o, n) => e._ovk.getStrategy(o, n) }), e._kbdMgr = new Bo({ getEditMgr: () => e._editMgr, getRowMgr: () => e._rowMgr, getData: () => e._data, getColLayout: () => e._colLayout, getOptions: () => e._options, setFocusCell: (o, n) => e._setFocusCell(o, n), handleRowDrop: (o, n) => e._handleRowDrop(o, n), doRender: () => e._doRender(...e._visRange()), announce: (o) => e._announce(o), t: (o, n) => e.t(o, n), emit: (o, ...n) => e.emit(o, ...n), visRange: () => e._visRange(), handleCellKeyEvt: (o, n) => e._handleCellKeyEvt(o, n), writeCells: (o) => e.writeCells(o), getRangeHooks: () => e._rangeMgr }), e._sfMgr = new Ho({ getData: () => e._data, getColLayout: () => e._colLayout, getFindFilter: () => e._findMgr.findFilter, getVs: () => e._vs, getPagination: () => e._pagination, getOptions: () => e._options, renderHeader: () => e._renderHeader(), doRender: () => e._doRender(...e._visRange()), announce: (o) => e._announce(o), t: (o, n) => e.t(o, n), emit: (o, ...n) => e.emit(o, ...n), onReproject: () => e._rangeMgr.reproject() }), e._findMgr = new Po({ getColLayout: () => e._colLayout, getData: () => e._data, getFilters: () => e._sfMgr.filters, getVs: () => e._vs, getPagination: () => e._pagination, doRender: () => e._doRender(...e._visRange()), t: (o, n) => e.t(o, n) }), e._cellEvt = new No({ getData: () => e._data, getColLayout: () => e._colLayout, getOptions: () => e._options, getEditMgr: () => e._editMgr, getRowMgr: () => e._rowMgr, emit: (o, ...n) => e.emit(o, ...n), writeCell: (o, n, a) => e.writeCell(o, n, a), doRender: () => e._doRender(...e._visRange()), getContainer: () => e._container, onCellsClick: (o, n, a) => e._rangeMgr.handleClick(o, n, a), rangeMouseDown: (o, n, a) => e._rangeMgr.handleCellMouseDown(o, n, a), rangeMouseMove: (o, n, a) => e._rangeMgr.handleCellMouseMove(o, n, a), rangeMouseUp: (o, n, a) => e._rangeMgr.handleCellMouseUp(o, n, a) }), e._rangeMgr = new ir({ getOptions: () => e._options, getData: () => e._data, getColLayout: () => e._colLayout, getFlatModel: () => e._flatModel, getRenderer: () => e._renderer, getEditMgr: () => e._editMgr, setFocusCell: (o, n) => e._setFocusCell(o, n), writeCells: (o) => e.writeCells(o), getDisplayValue: (o, n) => e.getDisplayValue(o, n), emit: (o, ...n) => e.emit(o, ...n), doRender: () => e._doRender(...e._visRange()), announce: (o) => e._announce(o), t: (o, n) => e.t(o, n), hasCellFormula: (o, n) => e._recalc.hasCellFormula(o, n), offsetFormula: (o, n, a, l) => e._recalc.offsetFormula(o, n, a, l), setCellFormulaByRowId: (o, n, a) => e._formula.setCellFormulaByRowId(o, n, a) }), e._grpMgr = new or({ getData: () => e._data.getData(), getDataLayer: () => e._data, getOptions: () => e._options, getVs: () => e._vs, doRenderFull: (o) => e._doRender(0, o - 1), doRender: () => e._doRender(...e._visRange()), getStrategy: (o, n) => e._ovk.getStrategy(o, n), setFlatBacking: (o) => e._flatModel.setBacking(o), getFlatCount: () => e._flatModel.count() }), e._detailMgr = new gr({ getOptions: () => e._options, getFlatModel: () => e._flatModel, getVs: () => e._vs, getRowId: (o) => o[ut], getRowById: (o) => e._data.getRowById(o), doRenderFull: (o) => e._doRender(0, o - 1), emit: (o, n) => e.emit(o, n), announce: (o) => e._announce(o), t: (o, n) => e.t(o, n), getDepth: () => e._options._detailDepth ?? 0, getGridInstance: () => e, createSubgrid: (o, n, a) => i.createSubgrid(o, n, a) }), e._chartMgr = new Hr({ getContainer: () => e._container, getOptions: () => e._options, getAllRows: () => e._data.getData(), getSelectedRows: () => e._rowMgr.getSelections(), getCheckedRows: () => e._rowMgr.getChecked().map((o) => o.row), getVisibleColumns: () => e._colLayout.visibleLeaves.map((o) => ({ field: o.field, header: o.header, type: o.type })), getFlatModel: () => e._flatModel, getRowById: (o) => e._data.getRowById(o), getActiveRange: () => e._rangeMgr.getActiveRange(), on: (o, n) => {
      e.on(o, n);
    }, off: (o, n) => {
      e.off(o, n);
    }, emit: (o, ...n) => e.emit(o, ...n), announce: (o) => e._announce(o), t: (o, n) => e.t(o, n) }), { _phase: "managers" };
  }
  static buildOverrideKernel(e, t) {
    if (e._ovk = new Pr(e, { strict: e._options.overrideStrict ?? true }), e._data.setStrategyResolver((s, i) => e._ovk.getStrategy(s, i)), e._ovk == null) throw new Error("[OpenGrid] 초기화 순서 위반: OverrideKernel(_ovk)은 _mount() 이전에 생성돼야 합니다 — 매니저 strategy 슬롯(footer/group 등)이 초기 렌더에서 _ovk.getStrategy 를 참조합니다.");
    return { _phase: "ovk" };
  }
  static mount(e, t) {
    return e._mount(), { _phase: "mounted" };
  }
}
class Nr {
  constructor(e) {
    this._batchDepth = 0, this._batchDirty = false, this._deps = e;
  }
  commit(e) {
    var _a, _b, _c, _d, _e2;
    if (e.coalescable && this._batchDepth > 0) {
      this._batchDirty = true;
      return;
    }
    const t = this._deps.getData();
    e.totals === "count" ? ((_a = this._deps.getVs()) == null ? void 0 : _a.setTotalRows(this._deps.getFlatModel().count()), (_b = this._deps.getPagination()) == null ? void 0 : _b.setTotalRows(t.rowCount)) : e.totals === "zero" && ((_c = this._deps.getVs()) == null ? void 0 : _c.setTotalRows(0), (_d = this._deps.getPagination()) == null ? void 0 : _d.setTotalRows(0)), (_e2 = e.preRender) == null ? void 0 : _e2.call(e), e.flushFormula && this._deps.flushFormula();
    const s = () => {
      e.renderMode === "sync-window" ? this._deps.doRenderWindow() : e.renderMode === "full" && this._deps.doRenderFull();
    }, i = () => {
      var _a2, _b2;
      this._deps.emit("dataChange", e.emitPayload()), e.fireOnDataChangeExplicitly && ((_b2 = (_a2 = this._deps.getOptions()).onDataChange) == null ? void 0 : _b2.call(_a2, e.emitPayload()));
    };
    e.emitBeforeRender ? (i(), s()) : (s(), i());
  }
  setData(e) {
    var _a;
    const t = this._deps.getTrigMgr(), s = t.mkCtx("setData", [e]);
    if (!t.exec("before:setData", s)) return;
    this._deps.getRowMgr().reset();
    const i = this._deps.getData();
    i.setData(e), this._deps.resetFormulaState(), this._deps.applyFilters();
    const o = this._deps.getGrpMgr();
    o.isTreeMode ? o.rebuildTree() : o.isGroupMode ? o.rebuildGroups() : (_a = this._deps.getVs()) == null ? void 0 : _a.setTotalRows(this._deps.getFlatModel().count());
    const n = this._deps.getContainer();
    n.setAttribute("aria-rowcount", String(i.rowCount)), n.setAttribute("aria-colcount", String(this._deps.getColLayout().visibleLeaves.length)), this._deps.announce(this._deps.t("data.loadedAnnounce", { count: i.rowCount })), this.commit({ renderMode: "async-vs", emitPayload: () => i.getData() }), s.result = e.length, t.exec("after:setData", s);
  }
  insertRow(e, t = "last") {
    const s = this._deps.getTrigMgr(), i = s.mkCtx("insertRow", [e, t]);
    if (!s.exec("before:insertRow", i)) return;
    const o = this._deps.getData(), n = t === "before" ? 0 : t === "after" ? o.rowCount : t;
    o.addRow(e, n);
    const a = o.rowCount;
    this.commit({ totals: "count", renderMode: "sync-window", emitPayload: () => o.getData(), fireOnDataChangeExplicitly: true }), i.result = { rowCount: a, item: e }, s.exec("after:insertRow", i);
  }
  pushRow(e) {
    const t = Array.isArray(e) ? e : [e], s = this._deps.getData();
    t.forEach((i) => s.addRow(i, "last")), this.commit({ totals: "count", renderMode: "sync-window", emitPayload: () => s.getData(), fireOnDataChangeExplicitly: true });
  }
  deleteRow(e) {
    const t = this._deps.getTrigMgr(), s = this._deps.getData(), i = t.mkCtx("deleteRow", [e]), o = Array.isArray(e) ? [...e] : [e];
    if (i.extra = { rows: o.map((d) => s.getRowByIndex(d)) }, !t.exec("before:deleteRow", i)) return;
    const n = o.sort((d, c) => c - d), a = n.map((d) => this._deps.getRowIdAt(d)).filter((d) => d != null);
    n.forEach((d) => s.removeRow(d));
    const l = s.rowCount;
    this.commit({ totals: "count", renderMode: "sync-window", preRender: () => this._deps.invalidateRemovedRows(a), emitPayload: () => s.getData(), fireOnDataChangeExplicitly: true }), i.result = { deleted: n.length, rowCount: l }, t.exec("after:deleteRow", i);
  }
  writeCell(e, t, s) {
    var _a, _b;
    const i = this._deps.getData(), o = i.getCellValue(e, t), n = this._deps.getTrigMgr(), a = n.mkCtx("writeCell", [e, t, s]);
    if (a.extra = { oldValue: o, rowIndex: e, field: t }, !n.exec("before:writeCell", a)) return;
    i.updateCell(e, t, s);
    const l = i.getRowByIndex(e), d = this._deps.getColLayout(), c = d.getColumnByField(t), h = d.getColumnIndex(t), u = { type: "editEnd", rowIndex: e, columnIndex: h, field: t, oldValue: o, newValue: s, row: l, column: c };
    this._deps.emit("editEnd", u), (_b = (_a = this._deps.getOptions()).onEditEnd) == null ? void 0 : _b.call(_a, u), this._deps.seedFormulaDirty(e, t), this.commit({ renderMode: "sync-window", flushFormula: true, emitBeforeRender: true, emitPayload: () => i.getData(), fireOnDataChangeExplicitly: true, coalescable: true }), a.result = { rowIndex: e, field: t, oldValue: o, newValue: s }, n.exec("after:writeCell", a);
  }
  beginBatch() {
    this._batchDepth++;
  }
  endBatch() {
    this._batchDepth !== 0 && (this._batchDepth--, this._batchDepth === 0 && this._batchDirty && (this._batchDirty = false, this.commit({ renderMode: "sync-window", flushFormula: true, emitBeforeRender: true, emitPayload: () => this._deps.getData().getData(), fireOnDataChangeExplicitly: true })));
  }
  writeCells(e) {
    this.beginBatch();
    let t = 0;
    const s = this._deps.getFlatModel();
    for (const i of e) {
      if (s.resolveFlatRow(i.rowIndex).kind !== "data") {
        t++;
        continue;
      }
      this.writeCell(i.rowIndex, i.field, i.value);
    }
    return this.endBatch(), t > 0 && (this._deps.announce(this._deps.t("data.skippedCellsAnnounce", { count: t })), this._deps.emit("writeCellsSkip", { skipped: t, total: e.length })), t;
  }
}
const We = "";
function Rs(r) {
  const e = Object.entries(r).filter(([, t]) => t !== We).map(([t, s]) => `    ${JSON.stringify(t)}: src[${JSON.stringify(s)}],`);
  return B("crossGrid.scriptComment") + `
function mapRow(src) {
  return {
` + e.join(`
`) + (e.length ? `
` : "") + `  };
}`;
}
function Vr(r) {
  return (e) => {
    const t = {};
    for (const [s, i] of Object.entries(r)) i !== We && (t[s] = e[i]);
    return t;
  };
}
function Wr(r, e) {
  if (r.length !== e.length) return false;
  const t = new Set(e);
  return r.every((s) => t.has(s));
}
function Kr(r, e) {
  return new Promise((t) => {
    const s = new Set(r.map((S) => S.field)), i = {};
    for (const S of e) i[S.field] = s.has(S.field) ? S.field : We;
    const o = document.createElement("div");
    o.className = "og-mapper-overlay", o.setAttribute("role", "dialog"), o.setAttribute("aria-modal", "true"), o.setAttribute("aria-label", B("crossGrid.overlayAria")), o.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;font-family:var(--og-font-family,-apple-system,sans-serif);";
    const n = document.createElement("div");
    n.style.cssText = "background:#fff;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,0.3);width:min(620px,92vw);max-height:88vh;overflow:auto;color:#222;", o.appendChild(n);
    const a = document.createElement("div");
    a.style.cssText = "padding:18px 20px 8px;", a.innerHTML = '<div style="font-size:16px;font-weight:700;">' + B("crossGrid.title") + '</div><div style="font-size:12.5px;color:#666;margin-top:4px;line-height:1.5;">' + B("crossGrid.desc1") + B("crossGrid.desc2") + "</div>", n.appendChild(a);
    const l = document.createElement("div");
    l.style.cssText = "padding:6px 20px;";
    const d = `<option value="">${B("crossGrid.emptyOption")}</option>` + r.map((S) => `<option value="${De(S.field)}">${De(S.header)} &lt;${De(S.field)}&gt;</option>`).join("");
    for (const S of e) {
      const O = document.createElement("div");
      O.style.cssText = "display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f0f0f0;";
      const z = document.createElement("div");
      z.style.cssText = "flex:1;font-size:13px;min-width:0;", z.innerHTML = `<span style="font-weight:600;">${De(S.header)}</span><span style="color:#999;font-size:11.5px;"> &lt;${De(S.field)}&gt;</span>`;
      const $ = document.createElement("span");
      $.textContent = "←", $.style.cssText = "color:#888;flex-shrink:0;";
      const C = document.createElement("select");
      C.style.cssText = "flex:1;min-width:0;padding:6px 8px;border:1px solid #ccc;border-radius:6px;font-size:13px;background:#fff;", C.innerHTML = d, C.value = i[S.field] ?? We, C.addEventListener("change", () => {
        i[S.field] = C.value, f();
      }), O.append(z, $, C), l.appendChild(O);
    }
    n.appendChild(l);
    const c = document.createElement("div");
    c.style.cssText = "padding:10px 20px 4px;";
    const h = document.createElement("div");
    h.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;", h.innerHTML = '<span style="font-size:12.5px;font-weight:600;color:#444;">' + B("crossGrid.scriptTitle") + "</span>";
    const u = document.createElement("button");
    u.type = "button", u.textContent = B("crossGrid.copy"), u.style.cssText = "font-size:12px;padding:4px 10px;border:1px solid #ccc;border-radius:6px;background:#f7f7f7;cursor:pointer;", h.appendChild(u);
    const g = document.createElement("pre");
    g.style.cssText = "margin:0;background:#0d1117;color:#c9d1d9;padding:12px;border-radius:8px;font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.5;overflow:auto;max-height:180px;", c.append(h, g), n.appendChild(c);
    function p() {
      return Rs(i);
    }
    function f() {
      g.textContent = p();
    }
    f(), u.addEventListener("click", () => {
      var _a;
      const S = p();
      (_a = navigator.clipboard) == null ? void 0 : _a.writeText(S).then(() => {
        u.textContent = B("crossGrid.copied"), setTimeout(() => u.textContent = B("crossGrid.copy"), 1200);
      }, () => {
        u.textContent = B("crossGrid.copyFailed"), setTimeout(() => u.textContent = B("crossGrid.copy"), 1200);
      });
    });
    const m = document.createElement("div");
    m.style.cssText = "display:flex;justify-content:flex-end;gap:8px;padding:14px 20px 18px;";
    const _ = document.createElement("button");
    _.type = "button", _.textContent = B("crossGrid.cancel"), _.style.cssText = "font-size:13px;padding:8px 16px;border:1px solid #ccc;border-radius:7px;background:#fff;cursor:pointer;";
    const w = document.createElement("button");
    w.type = "button", w.textContent = B("crossGrid.applyMove"), w.style.cssText = "font-size:13px;padding:8px 16px;border:0;border-radius:7px;background:#1976d2;color:#fff;cursor:pointer;font-weight:600;", m.append(_, w), n.appendChild(m);
    let y = false;
    function R(S) {
      y || (y = true, document.removeEventListener("keydown", A), o.remove(), t(S));
    }
    function A(S) {
      S.key === "Escape" && R(null);
    }
    _.addEventListener("click", () => R(null)), o.addEventListener("mousedown", (S) => {
      S.target === o && R(null);
    }), w.addEventListener("click", () => R({ mapping: { ...i }, script: p() })), document.addEventListener("keydown", A), document.body.appendChild(o), w.focus();
  });
}
function De(r) {
  return String(r).replace(/[&<>"]/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[e]);
}
class Ur {
  constructor() {
    this._map = /* @__PURE__ */ new Map();
  }
  register(e, t) {
    this._map.set(e, t);
  }
  unregister(e) {
    this._map.delete(e);
  }
  get(e) {
    return this._map.get(e);
  }
  get size() {
    return this._map.size;
  }
  resolveAt(e, t, s) {
    var _a;
    const o = (_a = document.elementFromPoint(e, t)) == null ? void 0 : _a.closest(".og-body-wrapper");
    if (!o) return null;
    const n = this._map.get(o);
    return !n || n === s ? null : n;
  }
}
const Ke = new Ur(), jr = "_ogRowId";
class qr {
  constructor(e) {
    this._deps = e;
  }
  getSelf() {
    return this._deps.getSelf();
  }
  _rowCount() {
    return this._deps.getData().rowCount;
  }
  _insertRow(e, t) {
    this._deps.insertRow(e, t);
  }
  _visibleLeafInfos() {
    return this._deps.getColLayout().visibleLeaves.map((e) => ({ field: e.field, header: e.header }));
  }
  handleCrossGridDrop(e, t, s) {
    const i = Ke.get(t);
    !i || i === this._deps.getSelf() || this.moveRowsTo(i, this._deps.dragRowSet(e), s);
  }
  async moveRowsTo(e, t, s) {
    const i = this._deps.getSelf();
    if (!e || e === i || !t.length) return false;
    const o = this._deps.getPeerController(e);
    if (!o) return false;
    const n = [...new Set(t)].sort((h, u) => h - u), a = s ?? o._rowCount();
    let l = n.map((h) => {
      const u = { ...this._deps.getData().getRowByIndex(h) };
      return delete u[jr], u;
    });
    const d = await this._resolveCrossTransform(o);
    if (d === false) return false;
    d && (l = l.map((h) => d(h)));
    const c = { sourceGrid: i, targetGrid: e, rows: l, sourceIndexes: n, targetIndex: a };
    return this.fireGridDropBefore(c) === false || c.cancel || o.fireGridDropBefore(c) === false || c.cancel ? false : (l.forEach((h, u) => o._insertRow(h, a + u)), [...n].sort((h, u) => u - h).forEach((h) => this._deps.deleteRow(h)), this.fireGridDropAfter(c), o.fireGridDropAfter(c), this.fireGridDropComplete(c), o.fireGridDropComplete(c), true);
  }
  async moveCheckedTo(e) {
    const t = this._deps.getChecked().map((s) => s.rowIndex);
    return t.length ? (this._deps.uncheckAll(), this.moveRowsTo(e, t)) : false;
  }
  async _resolveCrossTransform(e) {
    var _a, _b;
    const t = this._deps.getOptions().crossGridMapping;
    if (typeof t == "function") return t;
    if (t !== "interactive") return null;
    const s = this._visibleLeafInfos(), i = e._visibleLeafInfos();
    if (Wr(s.map((a) => a.field), i.map((a) => a.field))) return null;
    const o = await Kr(s, i);
    if (!o) return false;
    const n = { sourceGrid: this._deps.getSelf(), targetGrid: e.getSelf(), mapping: o.mapping, script: o.script };
    return this._deps.emit("gridDropMapping", n), (_b = (_a = this._deps.getOptions()).onGridDropMapping) == null ? void 0 : _b.call(_a, n), console.log(`[OpenGrid] cross-grid mapping script:
` + Rs(o.mapping)), Vr(o.mapping);
  }
  fireGridDropBefore(e) {
    var _a, _b;
    return this._deps.emit("gridDropBefore", e), (_b = (_a = this._deps.getOptions()).onGridDropBefore) == null ? void 0 : _b.call(_a, e);
  }
  fireGridDropAfter(e) {
    var _a, _b;
    this._deps.emit("gridDropAfter", e), (_b = (_a = this._deps.getOptions()).onGridDropAfter) == null ? void 0 : _b.call(_a, e);
  }
  fireGridDropComplete(e) {
    var _a, _b;
    this._deps.emit("gridDropComplete", e), (_b = (_a = this._deps.getOptions()).onGridDropComplete) == null ? void 0 : _b.call(_a, e);
  }
}
const Gr = "⊕", Yr = "⊖";
function Xr(r, e = B) {
  return { glyph: r ? Yr : Gr, ariaLabel: e(r ? "detail.collapseAria" : "detail.expandAria"), title: e("detail.glyphTooltip") };
}
class Zr {
  constructor(e, t, s, i, o, n) {
    this._selects = /* @__PURE__ */ new Map(), this._selected = {}, this._config = t, this._onFilter = s, this._onReset = i, this._t = n ?? B, this._el = document.createElement("fieldset"), this._el.className = "og-filter-select";
    const a = document.createElement("legend");
    a.className = "og-filter-select-legend", a.textContent = t.legend ?? this._t("filter.legend"), this._el.appendChild(a);
    const l = document.createElement("div");
    l.className = "og-filter-select-row";
    for (const c of t.columns) {
      const h = `og-fsel-${c.field}`, u = document.createElement("div");
      u.className = "og-filter-select-group";
      const g = document.createElement("label");
      g.htmlFor = h, g.textContent = c.label, g.className = "og-filter-select-label";
      const p = document.createElement("select");
      p.id = h, p.className = "og-filter-select-sel", p.setAttribute("aria-label", c.label), o && p.setAttribute("aria-controls", o), c.dependsOn ? this._fill(p, [], false) : this._fill(p, this._resolve(c, ""), true), p.addEventListener("change", () => this._onChange(c.field, p.value)), u.appendChild(g), u.appendChild(p), l.appendChild(u), this._selects.set(c.field, p);
    }
    const d = document.createElement("button");
    d.type = "button", d.textContent = this._t("filter.clear"), d.className = "og-filter-select-reset", d.setAttribute("aria-label", this._t("filter.clearAria")), d.addEventListener("click", () => this._reset()), this._el.appendChild(l), this._el.appendChild(d), e.insertBefore(this._el, e.firstChild);
  }
  _resolve(e, t) {
    if (e.options) return e.options;
    let s = e.data ?? [];
    e.dependsOn && e.dependsOnKey && t && (s = s.filter((n) => String(n[e.dependsOnKey] ?? "") === t));
    const i = e.valueKey ?? "value", o = e.textKey ?? i;
    return s.map((n) => ({ value: String(n[i] ?? ""), text: String(n[o] ?? n[i] ?? "") }));
  }
  _fill(e, t, s) {
    e.innerHTML = "";
    const i = document.createElement("option");
    i.value = "", i.textContent = this._t("filter.all"), e.appendChild(i);
    for (const o of t) {
      const n = document.createElement("option");
      n.value = o.value, n.textContent = o.text, e.appendChild(n);
    }
    e.disabled = !s;
  }
  _onChange(e, t) {
    const s = this._config.columns.find((o) => o.field === e), i = s.filterKey ?? s.field;
    t ? (this._selected[e] = t, this._onFilter(i, [{ operator: "=", value: t }])) : (delete this._selected[e], this._onReset(i)), this._cascade(e);
  }
  _cascade(e) {
    const t = this._selected[e] ?? "";
    for (const s of this._config.columns) {
      if (s.dependsOn !== e) continue;
      const i = this._selects.get(s.field);
      if (!i) continue;
      const o = s.filterKey ?? s.field;
      t ? (this._fill(i, this._resolve(s, t), true), i.value = "", delete this._selected[s.field], this._onReset(o)) : (this._fill(i, [], false), delete this._selected[s.field], this._onReset(o), this._cascade(s.field));
    }
  }
  _reset() {
    this._selected = {};
    for (const e of this._config.columns) {
      const t = this._selects.get(e.field), s = e.filterKey ?? e.field;
      t && (e.dependsOn ? this._fill(t, [], false) : (t.value = "", t.disabled = false), this._onReset(s));
    }
  }
  reset() {
    this._reset();
  }
  destroy() {
    this._el.remove();
  }
}
const Qr = { "pagination.rowsPerPage": "행/페이지:", "pagination.empty": "0건" };
function Jr(r, e) {
  return r === "pagination.rangeBadge" ? `${e == null ? void 0 : e.from}–${e == null ? void 0 : e.to} / ${e == null ? void 0 : e.total}건` : Qr[r] ?? r;
}
class en {
  constructor(e, t, s, i) {
    this._page = 1, this._totalRows = 0, this._pageSize = t, this._onChange = s, this._t = i ?? Jr, this._el = document.createElement("div"), this._el.className = "og-pagination", this._el.style.cssText = `
      display:flex;align-items:center;justify-content:center;gap:4px;
      padding:6px 8px;border-top:1px solid var(--og-border-color,#e0e0e0);
      background:var(--og-header-bg,#f5f5f5);flex-shrink:0;user-select:none;
      font-size:12px;color:var(--og-text-color,#333);
    `, e.appendChild(this._el), this._render();
  }
  get page() {
    return this._page;
  }
  get pageSize() {
    return this._pageSize;
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this._totalRows / this._pageSize));
  }
  setTotalRows(e) {
    this._totalRows = e, this._page > this.totalPages && (this._page = this.totalPages), this._render();
  }
  setPageSize(e) {
    this._pageSize = e, this._page = 1, this._render(), this._emit();
  }
  goTo(e) {
    const t = Math.max(1, Math.min(e, this.totalPages));
    t !== this._page && (this._page = t, this._render(), this._emit());
  }
  getRange() {
    const e = (this._page - 1) * this._pageSize, t = Math.min(e + this._pageSize - 1, this._totalRows - 1);
    return { start: e, end: t };
  }
  _emit() {
    this._onChange({ page: this._page, pageSize: this._pageSize, totalRows: this._totalRows, totalPages: this.totalPages });
  }
  _render() {
    this._el.innerHTML = "";
    const e = this.totalPages, t = document.createElement("span");
    t.style.cssText = "display:flex;align-items:center;gap:3px;margin-right:8px;";
    const s = document.createElement("span");
    s.textContent = this._t("pagination.rowsPerPage"), s.style.color = "#888";
    const i = document.createElement("select");
    i.style.cssText = "padding:2px 4px;border:1px solid var(--og-border-color,#e0e0e0);border-radius:3px;font-size:11px;cursor:pointer;";
    for (const c of [10, 20, 50, 100, 200]) {
      const h = document.createElement("option");
      h.value = String(c), h.textContent = String(c), c === this._pageSize && (h.selected = true), i.appendChild(h);
    }
    i.addEventListener("change", () => this.setPageSize(Number(i.value))), t.appendChild(s), t.appendChild(i), this._el.appendChild(t);
    const o = document.createElement("span"), { start: n, end: a } = this.getRange();
    o.textContent = this._totalRows > 0 ? this._t("pagination.rangeBadge", { from: n + 1, to: a + 1, total: this._totalRows }) : this._t("pagination.empty"), o.style.cssText = "margin-right:8px;color:#888;", this._el.appendChild(o);
    const l = (c, h, u) => {
      const g = document.createElement("button");
      return g.textContent = c, g.disabled = u, g.style.cssText = `
        min-width:28px;height:24px;padding:0 6px;
        border:1px solid var(--og-border-color,#e0e0e0);border-radius:3px;
        background:${u ? "#f5f5f5" : "#fff"};
        color:${u ? "#bbb" : "var(--og-text-color,#333)"};
        cursor:${u ? "default" : "pointer"};font-size:12px;
      `, u || g.addEventListener("click", () => this.goTo(h)), g;
    };
    this._el.appendChild(l("«", 1, this._page === 1)), this._el.appendChild(l("‹", this._page - 1, this._page === 1));
    const d = tn(this._page, e);
    for (const c of d) if (c === -1) {
      const h = document.createElement("span");
      h.textContent = "…", h.style.padding = "0 3px", this._el.appendChild(h);
    } else {
      const h = l(String(c), c, c === this._page);
      c === this._page && (h.style.background = "var(--og-primary,#1976d2)", h.style.color = "#fff", h.style.borderColor = "var(--og-primary,#1976d2)"), this._el.appendChild(h);
    }
    this._el.appendChild(l("›", this._page + 1, this._page === e)), this._el.appendChild(l("»", e, this._page === e));
  }
  refreshLabels() {
    this._render();
  }
  destroy() {
    this._el.remove();
  }
}
function tn(r, e) {
  if (e <= 7) return Array.from({ length: e }, (s, i) => i + 1);
  const t = [1];
  r > 3 && t.push(-1);
  for (let s = Math.max(2, r - 1); s <= Math.min(e - 1, r + 1); s++) t.push(s);
  return r < e - 2 && t.push(-1), t.push(e), t;
}
class sn {
  constructor(e, t, s, i) {
    this._dx = t - e.left, this._dy = s - e.top;
    const o = document.createElement("div");
    o.className = "og-drag-ghost", o.style.cssText = `position:fixed;left:0;top:0;width:${e.width}px;height:${Math.min(e.height, 40)}px;transform:translate(${e.left}px,${e.top}px);background:rgba(25,118,210,0.12);border:2px dashed #1976d2;box-sizing:border-box;pointer-events:none;z-index:10000;border-radius:3px;opacity:0.92;display:flex;align-items:center;padding-left:10px;font-size:12px;color:#1565c0;font-weight:600;white-space:nowrap;overflow:hidden;`, i > 1 && (o.textContent = B("drag.rowCount", { count: i })), document.body.appendChild(o), this._el = o;
  }
  move(e, t) {
    this._el.style.transform = `translate(${e - this._dx}px,${t - this._dy}px)`;
  }
  destroy() {
    this._el.remove();
  }
}
class Ms {
  constructor(e = "#1976d2") {
    const t = document.createElement("div");
    t.className = "og-drop-indicator", t.style.cssText = "position:absolute;left:0;right:0;display:none;align-items:center;pointer-events:none;z-index:9998;transform:translateY(-50%);";
    const s = (o) => {
      const n = document.createElement("div"), a = o === "left" ? `border-left:7px solid ${e}` : `border-right:7px solid ${e}`;
      return n.style.cssText = `width:0;height:0;flex-shrink:0;border-top:5px solid transparent;border-bottom:5px solid transparent;${a};`, n;
    }, i = document.createElement("div");
    i.style.cssText = `flex:1;height:3px;background:${e};border-radius:2px;box-shadow:0 0 0 1px rgba(255,255,255,0.7);`, t.append(s("left"), i, s("right")), this._el = t;
  }
  showIn(e, t) {
    this._el.parentElement !== e && (this._el.remove(), e.appendChild(this._el)), this._el.style.display = "flex", this._el.style.top = `${t}px`;
  }
  hide() {
    this._el.style.display = "none";
  }
  destroy() {
    this._el.remove();
  }
}
const ks = (r, e, t) => Math.max(e, Math.min(t, r));
class on {
  constructor(e, t, s, i = null, o = () => 1) {
    this._bodyEl = e, this._rowHeight = t, this._onDrop = s, this._cross = i, this._getDragCount = o, this._drag = null, this._selfIndicator = new Ms("#1976d2"), this._crossIndicator = new Ms("#2e7d32"), this._onMouseMove = this._onMouseMove.bind(this), this._onMouseUp = this._onMouseUp.bind(this);
  }
  attachHandle(e, t, s) {
    const i = document.createElement("div");
    return i.className = "og-drag-handle", i.innerHTML = "⠿", i.style.cssText = `
      width:18px;min-width:18px;height:100%;
      display:flex;align-items:center;justify-content:center;
      cursor:grab;font-size:14px;color:#bbb;flex-shrink:0;
      user-select:none;border-right:1px solid var(--og-border-color,#e0e0e0);
    `, i.addEventListener("mousedown", (o) => {
      o.preventDefault(), o.stopPropagation(), this._startDrag(o, e, t, s);
    }), i;
  }
  _startDrag(e, t, s, i) {
    const o = t.getBoundingClientRect(), n = this._getDragCount(s);
    this._drag = { fromIndex: s, bodyEl: this._bodyEl, rowHeight: this._rowHeight, totalRows: i, ghost: new sn(o, e.clientX, e.clientY, n), currentTarget: s, crossTarget: null }, document.addEventListener("mousemove", this._onMouseMove, true), document.addEventListener("mouseup", this._onMouseUp, true);
  }
  _onMouseMove(e) {
    if (!this._drag) return;
    const t = this._drag;
    if (t.ghost.move(e.clientX, e.clientY), this._cross) {
      const o = this._cross.resolveTarget(e.clientX, e.clientY);
      if (o && o.bodyEl !== t.bodyEl) {
        const n = o.bodyEl.getBoundingClientRect(), a = e.clientY - n.top + o.bodyEl.scrollTop, l = ks(Math.round(a / o.rowHeight), 0, o.totalRows);
        t.crossTarget = { bodyEl: o.bodyEl, index: l }, this._selfIndicator.hide(), this._crossIndicator.showIn(o.bodyEl, l * o.rowHeight);
        return;
      }
    }
    t.crossTarget = null, this._crossIndicator.hide();
    const s = t.bodyEl.getBoundingClientRect(), i = e.clientY - s.top + t.bodyEl.scrollTop;
    t.currentTarget = ks(Math.round(i / t.rowHeight), 0, t.totalRows - 1), this._selfIndicator.showIn(t.bodyEl, t.currentTarget * t.rowHeight);
  }
  _onMouseUp(e) {
    if (document.removeEventListener("mousemove", this._onMouseMove, true), document.removeEventListener("mouseup", this._onMouseUp, true), !this._drag) return;
    const { fromIndex: t, currentTarget: s, ghost: i, crossTarget: o } = this._drag;
    this._drag = null, i.destroy(), this._selfIndicator.hide(), this._crossIndicator.hide(), o && this._cross ? this._cross.onCrossDrop(t, o.bodyEl, o.index) : t !== s && this._onDrop(t, s);
  }
  destroy() {
    var _a;
    document.removeEventListener("mousemove", this._onMouseMove, true), document.removeEventListener("mouseup", this._onMouseUp, true), (_a = this._drag) == null ? void 0 : _a.ghost.destroy(), this._selfIndicator.destroy(), this._crossIndicator.destroy(), this._drag = null;
  }
}
class we {
  constructor() {
    this._map = /* @__PURE__ */ new Map();
  }
  static _key(e, t) {
    return `${e}:${t}`;
  }
  applyMergeCells(e) {
    this._map.clear();
    for (const t of e) {
      const s = Math.max(1, t.rowSpan ?? 1), i = Math.max(1, t.colSpan ?? 1);
      this._map.set(we._key(t.row, t.col), { rowSpan: s, colSpan: i, hidden: false });
      for (let o = 0; o < s; o++) for (let n = 0; n < i; n++) o === 0 && n === 0 || this._map.set(we._key(t.row + o, t.col + n), { rowSpan: 1, colSpan: 1, hidden: true });
    }
  }
  applyAutoMerge(e, t, s) {
    var _a, _b;
    this._map.clear();
    for (let i = 0; i < t.length; i++) {
      const o = t[i], n = s[i];
      let a = 0;
      for (let l = 1; l <= e.length; l++) {
        const d = (_a = e[l - 1]) == null ? void 0 : _a[n], c = l < e.length ? (_b = e[l]) == null ? void 0 : _b[n] : void 0;
        if (l === e.length || c !== d) {
          const h = l - a;
          if (h > 1) {
            this._map.set(we._key(a, o), { rowSpan: h, colSpan: 1, hidden: false });
            for (let u = a + 1; u < l; u++) this._map.set(we._key(u, o), { rowSpan: 1, colSpan: 1, hidden: true });
          }
          a = l;
        }
      }
    }
  }
  getInfo(e, t) {
    return this._map.get(we._key(e, t)) ?? null;
  }
  clear() {
    this._map.clear();
  }
  get isEmpty() {
    return this._map.size === 0;
  }
}
const rn = [{ id: "sort-asc", labelKey: "contextMenu.sortAsc", icon: "↑", action: "sortAsc" }, { id: "sort-desc", labelKey: "contextMenu.sortDesc", icon: "↓", action: "sortDesc" }, { type: "divider" }, { id: "find", labelKey: "contextMenu.find", icon: "🔍", action: "find" }, { type: "divider" }, { id: "excel", labelKey: "contextMenu.exportExcel", icon: "📊", action: "excel" }, { id: "csv", labelKey: "contextMenu.exportCsv", icon: "📄", action: "csv" }, { id: "print", labelKey: "contextMenu.print", icon: "🖨", action: "print" }], nn = [{ id: "sort-asc", label: "오름차순 정렬", icon: "↑", action: "sortAsc" }, { id: "sort-desc", label: "내림차순 정렬", icon: "↓", action: "sortDesc" }, { type: "divider" }, { id: "find", label: "찾기", icon: "🔍", action: "find" }, { type: "divider" }, { id: "excel", label: "Excel로 저장", icon: "📊", action: "excel" }, { id: "csv", label: "CSV로 저장", icon: "📄", action: "csv" }, { id: "print", label: "인쇄", icon: "🖨", action: "print" }];
function an(r) {
  return r ? rn.map((e) => "type" in e ? { type: "divider" } : { id: e.id, label: r(e.labelKey), icon: e.icon, action: e.action }) : nn;
}
class ln {
  constructor(e, t, s) {
    this._anchor = e, this._actions = t, this._t = s, this._el = null, this._docClick = null, this._docKey = null, this._docScroll = null, this._docMouseMove = null, this._focusIdx = -1;
  }
  open(e, t) {
    var _a, _b;
    this.close();
    const s = t ?? an(this._t), i = document.createElement("div");
    i.className = "og-context-menu", i.setAttribute("role", "menu");
    for (const d of s) {
      if (d.type === "divider") {
        const u = document.createElement("div");
        u.className = "og-cm-divider", u.setAttribute("role", "separator"), i.appendChild(u);
        continue;
      }
      const c = document.createElement("button");
      if (c.className = "og-cm-item", c.setAttribute("role", "menuitem"), c.setAttribute("tabindex", "-1"), d.disabled && (c.classList.add("og-cm-disabled"), c.setAttribute("aria-disabled", "true")), d.icon) {
        const u = document.createElement("span");
        if (u.className = "og-cm-icon", /^[a-zA-Z][\w-]*(\s+[\w-]+)+$/.test(d.icon.trim())) {
          const g = document.createElement("i");
          g.className = d.icon, u.appendChild(g);
        } else u.textContent = d.icon;
        u.setAttribute("aria-hidden", "true"), c.appendChild(u);
      }
      const h = document.createElement("span");
      h.className = "og-cm-label", h.textContent = d.label ?? "", c.appendChild(h), c.addEventListener("click", (u) => {
        u.stopPropagation(), d.disabled || this._runAction(d), this.close();
      }), i.appendChild(c);
    }
    const n = (_a = this._anchor.closest("[data-og-theme]")) == null ? void 0 : _a.getAttribute("data-og-theme");
    n && i.setAttribute("data-og-theme", n);
    const l = (_b = this._anchor.closest("[data-og-skin]")) == null ? void 0 : _b.getAttribute("data-og-skin");
    l && i.setAttribute("data-og-skin", l), document.body.appendChild(i), this._el = i, this._docMouseMove = (d) => {
      if (!this._el) return;
      const c = this._el.getBoundingClientRect();
      (d.clientX < c.left - 4 || d.clientX > c.right + 4 || d.clientY < c.top - 4 || d.clientY > c.bottom + 4) && this.close();
    }, this._position(i, e.clientX, e.clientY, () => {
      this._el === i && document.addEventListener("mousemove", this._docMouseMove, { capture: true, passive: true });
    }), this._docClick = (d) => {
      i.contains(d.target) || this.close();
    }, this._docKey = (d) => {
      var _a2;
      if (d.key === "Escape") {
        this.close();
        return;
      }
      if (d.key === "ArrowDown") {
        d.preventDefault(), this._moveFocus(1);
        return;
      }
      if (d.key === "ArrowUp") {
        d.preventDefault(), this._moveFocus(-1);
        return;
      }
      d.key === "Enter" && ((_a2 = i.querySelector(".og-cm-item:focus")) == null ? void 0 : _a2.click());
    }, this._docScroll = () => this.close(), setTimeout(() => {
      document.addEventListener("click", this._docClick), document.addEventListener("keydown", this._docKey), window.addEventListener("scroll", this._docScroll, { passive: true });
    }, 0), this._focusIdx = -1, this._moveFocus(1);
  }
  close() {
    var _a;
    (_a = this._el) == null ? void 0 : _a.remove(), this._el = null, this._docClick && document.removeEventListener("click", this._docClick), this._docKey && document.removeEventListener("keydown", this._docKey), this._docScroll && window.removeEventListener("scroll", this._docScroll), this._docMouseMove && document.removeEventListener("mousemove", this._docMouseMove, { capture: true }), this._docClick = this._docKey = this._docScroll = this._docMouseMove = null, this._focusIdx = -1;
  }
  destroy() {
    this.close();
  }
  _position(e, t, s, i) {
    e.style.cssText = "position:fixed;visibility:hidden;left:0;top:0;", requestAnimationFrame(() => {
      const { width: o, height: n } = e.getBoundingClientRect(), a = window.innerWidth, l = window.innerHeight, d = t + o > a ? Math.max(0, t - o) : t, c = s + n > l ? Math.max(0, s - n) : s;
      e.style.cssText = `position:fixed;left:${d}px;top:${c}px;z-index:9999;`, i == null ? void 0 : i();
    });
  }
  _moveFocus(e) {
    var _a;
    if (!this._el) return;
    const t = Array.from(this._el.querySelectorAll(".og-cm-item:not(.og-cm-disabled)"));
    t.length && (this._focusIdx = (this._focusIdx + e + t.length) % t.length, (_a = t[this._focusIdx]) == null ? void 0 : _a.focus());
  }
  _runAction(e) {
    if (typeof e.action == "function") {
      e.action();
      return;
    }
    switch (e.action) {
      case "sortAsc":
        this._actions.onSortAsc();
        break;
      case "sortDesc":
        this._actions.onSortDesc();
        break;
      case "find":
        this._actions.onFind();
        break;
      case "excel":
        this._actions.onExcel();
        break;
      case "csv":
        this._actions.onCsv();
        break;
      case "print":
        this._actions.onPrint();
        break;
    }
  }
}
class Es {
  constructor(e, t, s) {
    this._sheets = /* @__PURE__ */ new Map(), this._active = "", this._onSwitch = t, this._t = s ?? B, this._tabBar = this._buildTabBar(e);
  }
  add(e, t = [], s = []) {
    if (this._sheets.has(e)) throw new Error(`WorksheetManager: 시트 '${e}'이 이미 존재합니다`);
    this._sheets.set(e, { name: e, columns: t, data: s }), this._renderTabs(), this._sheets.size === 1 && this.switch(e);
  }
  remove(e) {
    if (!this._sheets.has(e)) return;
    if (this._sheets.size === 1) throw new Error("WorksheetManager: 마지막 시트는 삭제할 수 없습니다");
    const t = this._active === e;
    this._sheets.delete(e), this._renderTabs(), t && this.switch(this._sheets.keys().next().value);
  }
  rename(e, t) {
    if (!this._sheets.has(e)) return;
    if (this._sheets.has(t)) throw new Error(`WorksheetManager: 시트 '${t}'이 이미 존재합니다`);
    this._sheets.get(e);
    const s = Array.from(this._sheets.entries()).map(([i, o]) => i === e ? [t, { ...o, name: t }] : [i, o]);
    this._sheets = new Map(s), this._active === e && (this._active = t), this._renderTabs();
  }
  switch(e) {
    const t = this._sheets.get(e);
    if (!t) throw new Error(`WorksheetManager: 시트 '${e}'을 찾을 수 없습니다`);
    this._active = e, this._renderTabs(), this._onSwitch(e, t);
  }
  get(e) {
    return this._sheets.get(e);
  }
  getNames() {
    return Array.from(this._sheets.keys());
  }
  getActive() {
    return this._active;
  }
  syncData(e, t) {
    const s = this._sheets.get(e);
    s && (s.data = t);
  }
  destroy() {
    this._tabBar.remove();
  }
  _buildTabBar(e) {
    const t = document.createElement("div");
    return t.className = "og-sheet-tabs", e.appendChild(t), t;
  }
  _renderTabs() {
    this._tabBar.innerHTML = "";
    for (const t of this._sheets.keys()) {
      const s = document.createElement("button");
      s.className = "og-sheet-tab", s.textContent = t, s.setAttribute("role", "tab"), s.setAttribute("aria-selected", t === this._active ? "true" : "false"), t === this._active && s.classList.add("og-sheet-tab--active"), s.addEventListener("click", () => {
        t !== this._active && this.switch(t);
      }), s.addEventListener("dblclick", () => this._startRename(s, t)), this._tabBar.appendChild(s);
    }
    const e = document.createElement("button");
    e.className = "og-sheet-add", e.textContent = "+", e.setAttribute("aria-label", this._t("worksheet.addAria")), e.addEventListener("click", () => {
      const t = `Sheet${this._sheets.size + 1}`;
      this.add(t, [], []), this.switch(t);
    }), this._tabBar.appendChild(e);
  }
  _startRename(e, t) {
    const s = document.createElement("input");
    s.className = "og-sheet-tab-rename", s.value = t, e.replaceWith(s), s.focus(), s.select();
    const i = () => {
      const o = s.value.trim() || t;
      try {
        o !== t ? this.rename(t, o) : this._renderTabs();
      } catch {
        this._renderTabs();
      }
    };
    s.addEventListener("blur", i), s.addEventListener("keydown", (o) => {
      o.key === "Enter" && s.blur(), o.key === "Escape" && (s.value = t, s.blur());
    });
  }
}
class dn {
  constructor() {
    this._triggers = /* @__PURE__ */ new Map();
  }
  add(e, t) {
    this._triggers.has(e) || this._triggers.set(e, []), this._triggers.get(e).push(t);
  }
  remove(e, t) {
    const s = this._triggers.get(e);
    if (s) {
      const i = s.indexOf(t);
      i >= 0 && s.splice(i, 1);
    }
  }
  clear(e) {
    e ? this._triggers.delete(e) : this._triggers.clear();
  }
  mkCtx(e, t) {
    let s = false;
    return { operation: e, args: t, result: void 0, extra: {}, timestamp: Date.now(), get cancelled() {
      return s;
    }, cancel() {
      s = true;
    } };
  }
  exec(e, t) {
    const s = this._triggers.get(e) ?? [];
    for (const i of s) if (i(t), t.cancelled) return false;
    if (e.startsWith("after:")) {
      const i = this._triggers.get("complete") ?? [];
      for (const o of i) o(t);
    }
    return true;
  }
}
class cn {
  constructor() {
    this._order = [], this._hooks = /* @__PURE__ */ new Map();
  }
  register(e) {
    this._hooks.has(e.id) || this._order.push(e.id), this._hooks.set(e.id, e);
  }
  get(e) {
    return this._hooks.get(e);
  }
  has(e) {
    return this._hooks.has(e);
  }
  ids() {
    return [...this._order];
  }
  resolve(e, t, s) {
    const i = this._hooks.get(e);
    return !i || !i.gate() ? null : i.resolve(t, s);
  }
  activeIds() {
    return this._order.filter((e) => this._hooks.get(e).gate());
  }
}
class hn {
  constructor(e) {
    this._renderHooks = new cn(), this._deps = e;
  }
  get renderHooks() {
    return this._renderHooks;
  }
  registerRenderHook(e) {
    this._renderHooks.register(e);
  }
  resolveRenderHook(e, t, s) {
    return this._renderHooks.resolve(e, t, s);
  }
  strategy(e, t) {
    this._deps.kernel.strategy(e, t);
  }
  getStrategy(e, t) {
    return this._deps.kernel.getStrategy(e, t);
  }
  hasStrategy(e) {
    return this._deps.kernel.hasStrategy(e);
  }
  override(e, t, s = {}) {
    this._deps.kernel.override(e, t, s);
  }
  beforeMutation(e, t) {
    this._deps.getTrigMgr().add(`before:${e}`, t);
  }
  afterMutation(e, t) {
    this._deps.getTrigMgr().add(`after:${e}`, t);
  }
  offMutation(e, t, s) {
    this._deps.getTrigMgr().remove(`${e}:${t}`, s);
  }
  catalog() {
    const e = [["sortComparator", "(a,b,field,dir)=>number"], ["filterPredicate", "(value,fi,field)=>boolean"], ["displayFormatter", "(value,field,row)=>string"], ["cellSerializer", "(value,col,row)=>any"], ["groupKeyFn", "(row,remainingFields)=>any"], ["summaryOp", "(op,nums,field)=>number|null"], ["cellClassResolver", "(value,field,row)=>string|null"], ["ariaLabelResolver", "(value,field,row)=>string|null"], ["skinResolver", "(skinId)=>SkinTokenDelta|null"]].map(([n, a]) => ({ name: n, category: "strategy", signature: a })), t = this._renderHooks.ids().map((n) => ({ name: n, category: "renderHook", signature: "(rowIndex,field)=>value|null" })), s = [{ name: "before:mutation", category: "lifecycle", signature: "(ctx)=>void — cancelable" }, { name: "after:mutation", category: "lifecycle", signature: "(ctx)=>void — observe" }], i = [{ name: "getDisplayValue", category: "override", signature: "(orig,rowIndex,field)=>string" }, { name: "readCell", category: "override", signature: "(orig,rowIndex,field)=>any" }], o = [{ name: "override(name,fn)", category: "escapeHatch", signature: "best-effort arbitrary method wrap (UC-11)" }];
    return [...e, ...t, ...s, ...i, ...o];
  }
}
const Ss = "og-cf-bar", Fs = "og-cf-icon", pt = "ogCf";
function un(r) {
  return r === "triangleUp" ? "▲" : r === "triangleDown" ? "▼" : "●";
}
function pn(r) {
  for (const e of Array.from(r.children)) (e.classList.contains(Ss) || e.classList.contains(Fs)) && e.remove();
  r.dataset[pt] && (r.style.backgroundColor = "", r.style.color = "", r.style.textShadow = "", delete r.dataset[pt]);
}
function gn(r, e, t, s) {
  if (pn(r), e.length === 0) return;
  let i = false;
  const o = [];
  for (const n of e) {
    if (n.ariaSummary && o.push(n.ariaSummary), n.fill) {
      const { color: a, from: l, ratio: d } = n.fill;
      if (l === void 0) r.style.backgroundColor = a;
      else {
        r.style.position = "relative";
        const c = document.createElement("div");
        c.className = Ss;
        const h = Math.max(0, Math.min(1, d)) * t;
        c.style.position = "absolute", c.style.top = "0", c.style.bottom = "0", c.style.width = `${h}px`, c.style.background = a, l === "right" ? c.style.right = "0" : c.style.left = "0", c.style.zIndex = "0", c.style.pointerEvents = "none", r.insertBefore(c, r.firstChild);
      }
      r.style.color = n.inkColor, n.inkOutline && (r.style.textShadow = "0 0 2px rgba(255,255,255,0.9), 0 0 2px rgba(255,255,255,0.9)"), i = true;
    }
    if (n.glyph) {
      const { role: a, tint: l, shape: d } = n.glyph, c = document.createElement("span");
      c.className = Fs, c.textContent = un(d), c.style.color = l, c.style.marginRight = "4px", c.style.display = "inline-block", c.setAttribute("role", "img"), c.setAttribute("aria-label", a), r.insertBefore(c, r.firstChild), i = true;
    }
  }
  if (o.length > 0) {
    const n = r.getAttribute("aria-label") ?? "", a = o.join(" · ");
    r.setAttribute("aria-label", n ? `${n} — ${a}` : a), i = true;
  }
  i && (r.dataset[pt] = "1");
}
const Ue = (r) => r;
function fn(r, e, t, s) {
  return { x: Ue(r), y: Ue(e), w: Ue(Math.max(0, t)), h: Ue(Math.max(0, s)) };
}
const As = "_ogRowId";
const _J = class _J extends Is {
  constructor(e, t) {
    var _a;
    super(), this._vs = null, this._ro = null, this._renderer = null, this._appearance = null, this._icons = null, this._locales = null, this._trigMgr = new dn(), this._destroyed = false, this._colWidths = [], this._userWidths = /* @__PURE__ */ new Map(), this._filterPanel = null, this._filterSelect = null, this._pagination = null, this._dnd = null, this._mergeEngine = new we(), this._liveRegion = null, this._ctxMenu = null, this._cmHandler = null, this._cmKbdHandler = null, this._wsManager = null, this._formulaDirtySeeds = /* @__PURE__ */ new Set(), this._cf = null, this._cfStats = /* @__PURE__ */ new Map(), this._cfRules = [], this._cfAppearance = null, this._cfComputeStats = null, this._rt = null, me.compose(this, e, t, { createSubgrid: (i, o, n) => new _J(i, { ...o, _detailDepth: n }) }), this._bindOptionEvents(), ((_a = this._options.defaultSort) == null ? void 0 : _a.length) && this._sfMgr.initSort(this._options.defaultSort), this.override = Object.assign((i, o, n) => this._ovk.override(i, o, n), { strategy: (i, o) => this._ovk.strategy(i, o) });
    const s = this.destroy.bind(this);
    this.destroy = () => {
      try {
        s();
      } finally {
        this._ovk.restoreAll();
      }
    };
    for (const [i, o] of _J._defaultStrategies) this._ovk.strategy(i, o);
    for (const [i, o, n] of _J._defaultOverrides) this._ovk.override(i, o, n);
    requestAnimationFrame(() => {
      var _a2, _b;
      this.emit("ready", this), (_b = (_a2 = this._options).onReady) == null ? void 0 : _b.call(_a2, this);
    });
  }
  get extensions() {
    return this._extensions;
  }
  static defaultOverride(e, t, s = {}) {
    return _J._defaultOverrides.push([e, t, s]), _J;
  }
  static registerRenderer(e, t) {
    return G(e, t), _J;
  }
  static registerEditor(e, t) {
    return Ce(e, t), _J;
  }
  static defineSkin(e, t) {
    return Ze.define(e, t), _J;
  }
  static defineIconSet(e) {
    for (const [t, s] of Object.entries(e)) ge.register(t, s);
    return _J;
  }
  static defineLocale(e, t, s) {
    return se.register(e, t, s), _J;
  }
  restore(e) {
    return this._ovk.restore(e), this;
  }
  restoreAll() {
    return this._ovk.restoreAll(), this;
  }
  hasOverride(e) {
    return this._ovk.hasOverride(e);
  }
  getOverrideNames() {
    return this._ovk.getOverrideNames();
  }
  getStrategy(e, t) {
    return this._ovk.getStrategy(e, t);
  }
  _mount() {
    var _a, _b, _c;
    this._extensions = new hn({ kernel: this._ovk, getTrigMgr: () => this._trigMgr }), this._extensions.registerRenderHook({ id: "displayText", gate: () => this.hasOverride("getDisplayValue") || this._ovk.hasStrategy("displayFormatter"), resolve: (s, i) => this.getDisplayValue(s, i) }), this._extensions.registerRenderHook({ id: "cellClass", gate: () => this._ovk.hasStrategy("cellClassResolver"), resolve: (s, i) => {
      const o = this._ovk.getStrategy("cellClassResolver", null);
      return o ? o(this.readCell(s, i), i, this._data.getRowByIndex(s)) : null;
    } }), this._extensions.registerRenderHook({ id: "ariaLabel", gate: () => this._ovk.hasStrategy("ariaLabelResolver"), resolve: (s, i) => {
      const o = this._ovk.getStrategy("ariaLabelResolver", null);
      return o ? o(this.readCell(s, i), i, this._data.getRowByIndex(s)) : null;
    } }), this._container.classList.add("og-container");
    const e = this._options.height, t = this._options.width;
    this._container.style.height = typeof e == "number" ? `${e}px` : String(e), this._container.style.width = typeof t == "number" ? `${t}px` : String(t), this._container.style.display = "flex", this._container.style.flexDirection = "column", this._container.style.overflow = "hidden", this._container.style.boxSizing = "border-box", this._container.style.border = "1px solid var(--og-border-color, #e0e0e0)", this._container.style.fontFamily = "var(--og-font-family, -apple-system, sans-serif)", this._container.style.fontSize = "var(--og-font-size, 13px)", this._container.setAttribute("data-og-theme", this._options.theme), this._container.setAttribute("data-og-skin", this._options.skin ?? "default");
    for (const [s, i] of Object.entries(this._options.cssVars)) this._container.style.setProperty(s, i);
    this._appearance = new Ye(new ze(this._options.theme, this._options.skin ?? "default")), this._renderer = new ki(this._container, this._options, { onHeaderClick: (s, i) => this._handleSortClick(s, i), onCellClick: (s, i, o) => this._handleCellClick(s, i, o), onCellDblClick: (s, i, o) => this._handleCellDblClick(s, i, o), onCellMouseOver: (s, i, o) => this._handleCellMouseOver(s, i, o), onCellMouseOut: (s, i, o) => this._handleCellMouseOut(s, i, o), onCellMouseDown: (s, i, o) => this._handleCellMouseDown(s, i, o), onCellMouseUp: (s, i, o) => this._handleCellMouseUp(s, i, o), onCellMouseMove: (s, i, o) => this._handleCellMouseMove(s, i, o), onRowCheck: (s, i) => this._handleRowCheck(s, i), onAllCheck: (s) => this._handleAllCheck(s), onColResize: (s, i) => this._handleColResize(s, i), onFilterIconClick: (s, i) => this._handleFilterIconClick(s, i), getDndManager: () => this._dnd, onColDragStart: (s) => {
      this._editMgr.dragColIdx = s;
    }, onColDrop: (s) => {
      this._editMgr.dragColIdx !== null && this._editMgr.dragColIdx !== s && this._reorderColumn(this._editMgr.dragColIdx, s), this._editMgr.dragColIdx = null;
    }, getColDragIdx: () => this._editMgr.dragColIdx, resolveRenderHook: (s, i, o) => this._extensions.resolveRenderHook(s, i, o), getDisplayFormatter: () => this._ovk.getStrategy("displayFormatter", null) ?? null, getFormulaMeta: (s, i) => this._formula.getFormulaMeta(s, i), t: (s, i) => this.t(s, i), applyCF: (s, i, o, n, a, l) => {
      if (!this._cf || !this._cfAppearance) return;
      const d = this._cfStats.get(o);
      if (!d) return;
      const c = this._cf.paintFor({ value: n, rowIndex: i, columnId: o, rowState: "none" }, d, this._cfAppearance, fn(0, 0, a, l), { now: Date.now() });
      gn(s, c, a);
    } }, this._appearance), this._render = new Qi({ getContainer: () => this._container, getOptions: () => this._options, getRenderer: () => this._renderer, getVs: () => this._vs, getPagination: () => this._pagination, getData: () => this._data, getColLayout: () => this._colLayout, getFlatModel: () => this._flatModel, getMergeEngine: () => this._mergeEngine, getColWidths: () => this._colWidths, setColWidths: (s) => {
      this._colWidths = s;
    }, getUserWidths: () => this._userWidths, getSfMgr: () => this._sfMgr, getRowMgr: () => this._rowMgr, getEditMgr: () => this._editMgr, getGrpMgr: () => this._grpMgr, getDetailMgr: () => this._detailMgr, getRangeMgr: () => this._rangeMgr, buildDetailRenderContext: () => this._buildDetailRenderContext(), renderFooterEl: () => this._renderFooterEl() }), this._mutation = new Nr({ getData: () => this._data, getVs: () => this._vs, getPagination: () => this._pagination, getFlatModel: () => this._flatModel, getColLayout: () => this._colLayout, getContainer: () => this._container, getTrigMgr: () => this._trigMgr, getRowMgr: () => this._rowMgr, getGrpMgr: () => this._grpMgr, getOptions: () => this._options, emit: (s, i) => {
      this.emit(s, i);
    }, announce: (s) => this._announce(s), t: (s, i) => this.t(s, i), applyFilters: () => this._applyFilters(), flushFormula: () => this._formula.flushRecalc(), doRenderWindow: () => this._doRender(...this._visRange()), doRenderFull: () => this._doRender(0, -1), resetFormulaState: () => {
      var _a2, _b2;
      this._formulaDirtySeeds.clear(), this._recalc = new is({ accessor: this._formula.buildAccessor(), setComputedValue: (s, i, o) => this._data.setComputedValueByRowId(s, i, o), onFormulaError: (s, i, o) => this._formula.handleFormulaError(s, i, o), refMode: ((_a2 = this._options.formula) == null ? void 0 : _a2.refMode) ?? "stable", divisionPrecision: ((_b2 = this._options.formula) == null ? void 0 : _b2.divisionPrecision) ?? 30 });
    }, seedFormulaDirty: (s, i) => {
      const o = this._flatModel.resolveFlatRow(s);
      o.kind === "data" && o.rowId && this._formulaDirtySeeds.add(Z(o.rowId, i));
    }, invalidateRemovedRows: (s) => {
      for (const i of s) this._formula.afterRecalc(this._recalc.invalidateRow(i), { skipRender: true });
    }, getRowIdAt: (s) => {
      var _a2;
      return (_a2 = this._data.getRowByIndex(s)) == null ? void 0 : _a2[As];
    } }), this._rangeMgr.mount(this._renderer.bodyWrapper), this._filterPanel = new Hs(this._container, (s, i) => this.setFilter(s, i), (s) => this.resetFilter(s), (s, i) => this.t(s, i)), this._container.setAttribute("role", "grid"), this._container.setAttribute("aria-label", this._options.ariaLabel ?? ((_a = this._options.cssVars) == null ? void 0 : _a["aria-label"]) ?? this.t("grid.containerAria")), this._container.setAttribute("aria-rowcount", "0"), this._container.setAttribute("aria-colcount", String(this._options.columns.filter((s) => !s.hidden).length)), this._liveRegion = document.createElement("div"), this._liveRegion.setAttribute("aria-live", "polite"), this._liveRegion.setAttribute("aria-atomic", "true"), this._liveRegion.className = "og-live-region", Object.assign(this._liveRegion.style, { position: "absolute", width: "1px", height: "1px", margin: "-1px", padding: "0", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: "0" }), this._container.appendChild(this._liveRegion), this._container.tabIndex = 0, this._container.addEventListener("keydown", (s) => this._handleKeyDown(s)), this._container.addEventListener("keyup", (s) => this._handleCellKeyEvt("cellKeyUp", s)), this._container.addEventListener("keypress", (s) => this._handleCellKeyEvt("cellKeyPress", s)), this._vs = new Ts(this._renderer.bodyWrapper, { rowHeight: this._options.rowHeight, onRender: (s, i) => this._doRender(s, i) }), Ke.register(this._renderer.bodyWrapper, this), this._cross = new qr({ getSelf: () => this, getData: () => this._data, getColLayout: () => this._colLayout, getOptions: () => this._options, emit: (s, i) => {
      this.emit(s, i);
    }, insertRow: (s, i) => this.insertRow(s, i), deleteRow: (s) => this.deleteRow(s), getChecked: () => this._rowMgr.getChecked(), uncheckAll: () => this._rowMgr.uncheckAll(), dragRowSet: (s) => this._dragRowSet(s), getPeerController: (s) => s._cross }), this._options.draggable && (this._dnd = new on(this._renderer.bodyWrapper, this._options.rowHeight, (s, i) => this._handleRowDrop(s, i), this._options.crossGrid ? { resolveTarget: (s, i) => {
      const o = Ke.resolveAt(s, i, this);
      return !o || !o._options.crossGrid ? null : { bodyEl: o._crossBodyEl(), rowHeight: o._options.rowHeight, totalRows: o._data.rowCount };
    }, onCrossDrop: (s, i, o) => this._cross.handleCrossGridDrop(s, i, o) } : void 0, (s) => this._dragRowSet(s).length)), this._options.pagination && (this._pagination = new en(this._container, this._options.pageSize, (s) => {
      this.emit("pageChange", s), this._doRender(...this._visRange());
    }, (s, i) => this.t(s, i))), this._findMgr.init(this._container), this._initContextMenu(), ((_b = this._options.worksheets) == null ? void 0 : _b.length) && this._initWorksheets(), this._options.density != null && this.setDensity(this._options.density), this._options.texture != null && this.setTexture(this._options.texture), ((_c = this._options.conditionalFormat) == null ? void 0 : _c.length) && this.setConditionalFormat(this._options.conditionalFormat), this._ro = new ResizeObserver(() => this._onResize()), this._ro.observe(this._container), this._onResize();
  }
  _initContextMenu() {
    const e = this._options.contextMenu;
    e !== false && (this._cmHandler && this._container.removeEventListener("contextmenu", this._cmHandler), this._cmKbdHandler && this._container.removeEventListener("keydown", this._cmKbdHandler), this._cmHandler = this._cmKbdHandler = null, this._ctxMenu = new ln(this._container, { onSortAsc: () => {
      const t = this._colLayout.visibleLeaves[0];
      t && this.orderBy(t.field, "asc");
    }, onSortDesc: () => {
      const t = this._colLayout.visibleLeaves[0];
      t && this.orderBy(t.field, "desc");
    }, onFind: () => this._findMgr.open(), onExcel: () => this.exportExcel(), onCsv: () => this.exportCsv(), onPrint: () => this.print() }, (t, s) => this.t(t, s)), this._cmHandler = (t) => {
      var _a;
      const s = t.target.closest(".og-cell");
      if (!s) return;
      t.preventDefault();
      const i = Number(s.dataset.colIndex ?? -1), o = this._colLayout.visibleLeaves[i];
      o && this._ctxMenu && (this._ctxMenu._actions.onSortAsc = () => this.orderBy(o.field, "asc"), this._ctxMenu._actions.onSortDesc = () => this.orderBy(o.field, "desc"));
      const n = Array.isArray(e) ? e : void 0;
      (_a = this._ctxMenu) == null ? void 0 : _a.open(t, n);
    }, this._container.addEventListener("contextmenu", this._cmHandler), this._cmKbdHandler = (t) => {
      var _a;
      if (t.shiftKey && t.key === "F10") {
        t.preventDefault();
        const s = this._container.getBoundingClientRect(), i = { clientX: s.left + 80, clientY: s.top + 40 };
        (_a = this._ctxMenu) == null ? void 0 : _a.open(i);
      }
    }, this._container.addEventListener("keydown", this._cmKbdHandler));
  }
  openContextMenu(e, t) {
    var _a;
    (_a = this._ctxMenu) == null ? void 0 : _a.open(e, t);
  }
  closeContextMenu() {
    var _a;
    (_a = this._ctxMenu) == null ? void 0 : _a.close();
  }
  setFilterSelect(e) {
    var _a;
    (_a = this._filterSelect) == null ? void 0 : _a.destroy(), this._filterSelect = null, e && (this._container.id || (this._container.id = `og-${Math.random().toString(36).slice(2, 7)}`), this._filterSelect = new Zr(this._container, e, (t, s) => this.setFilter(t, s), (t) => this.resetFilter(t), this._container.id, (t, s) => this.t(t, s)));
  }
  setOptions(e) {
    var _a;
    if (Object.assign(this._options, e), "contextMenu" in e && ((_a = this._ctxMenu) == null ? void 0 : _a.destroy(), this._ctxMenu = null, this._initContextMenu()), "groupBy" in e || "summary" in e) {
      const t = e.groupBy ?? [];
      t.length > 0 ? this._grpMgr.groupBy(t) : this.clearGroup();
      return;
    }
    this._renderHeader(), this._doRender(...this._visRange());
  }
  setMaskEnabled(e, t) {
    var _a;
    const s = this._colLayout.getColumnByField(e);
    s && (t ? (s._maskRevealed = false, (_a = s._maskRevealedRows) == null ? void 0 : _a.clear()) : s._maskRevealed = true, this._doRender(...this._visRange()));
  }
  getMaskEnabled(e) {
    const t = this._colLayout.getColumnByField(e);
    return t ? t._maskRevealed !== true : false;
  }
  _initWorksheets() {
    const e = this._options.worksheets;
    this._wsManager = new Es(this._container, (t, s) => this._loadWorksheetState(s), (t, s) => this.t(t, s));
    for (const t of e) this._wsManager.add(t.name, t.columns ?? this._options.columns, t.data ?? []);
  }
  _loadWorksheetState(e) {
    var _a, _b;
    this._rowMgr.reset(), this._data.setData(e.data), this._colLayout = new wt(e.columns.length ? e.columns : this._options.columns, this._options.frozenColumns), (_a = this._vs) == null ? void 0 : _a.setTotalRows(this._data.rowCount), (_b = this._pagination) == null ? void 0 : _b.setTotalRows(this._data.rowCount), this._container.setAttribute("aria-rowcount", String(this._data.rowCount)), this._container.setAttribute("aria-colcount", String(this._colLayout.visibleLeaves.length));
    const { width: t } = this._container.getBoundingClientRect();
    t && this._recalcWidths(t), this._renderHeader(), this._doRender(...this._visRange());
  }
  addWorksheet(e, t, s) {
    this._wsManager || (this._wsManager = new Es(this._container, (i, o) => this._loadWorksheetState(o), (i, o) => this.t(i, o))), this._wsManager.add(e, t ?? this._options.columns, s ?? []);
  }
  removeWorksheet(e) {
    var _a;
    (_a = this._wsManager) == null ? void 0 : _a.remove(e);
  }
  switchWorksheet(e) {
    var _a;
    (_a = this._wsManager) == null ? void 0 : _a.switch(e);
  }
  renameWorksheet(e, t) {
    var _a;
    (_a = this._wsManager) == null ? void 0 : _a.rename(e, t);
  }
  getWorksheet(e) {
    var _a;
    return (_a = this._wsManager) == null ? void 0 : _a.get(e);
  }
  getWorksheetNames() {
    var _a;
    return ((_a = this._wsManager) == null ? void 0 : _a.getNames()) ?? [];
  }
  exportSheetsExcel(e) {
    this._exportMgr.exportSheetsExcel(e);
  }
  _onResize() {
    this._render.onResize();
  }
  _recalcWidths(e) {
    this._render.recalcWidths(e);
  }
  _renderHeader() {
    this._render.renderHeader();
  }
  _syncHeaderLayout() {
    this._render.syncHeaderLayout();
  }
  _doRender(e, t) {
    this._render.doRender(e, t);
  }
  _buildDetailRenderContext() {
    if (!this._detailMgr.enabled) return;
    const e = this._options.masterDetail ?? {};
    return { toggleMode: e.toggle ?? "expander-col", ariaLabel: e.ariaLabel ?? this.t("grid.detailRegion"), getRowId: (t) => t == null ? void 0 : t[As], isExpanded: (t) => this._detailMgr.isExpandedId(t), onToggle: (t, s) => this._detailMgr.toggleRow({ id: s }), getGlyph: (t) => Xr(t, (s, i) => this.t(s, i)), getPanelHost: (t) => this._detailMgr.getPanelHost(t), onBeforeTeardown: () => this._detailMgr.onBeforeTeardown() };
  }
  _handleGroupToggle(e) {
    this._grpMgr.handleGroupToggle(e);
  }
  _visRange() {
    return this._render.visRange();
  }
  _handleSortClick(e, t) {
    this._sfMgr.handleSortClick(e, t);
  }
  _isToggleCol(e) {
    return Ie(e);
  }
  _handleCellClick(e, t, s) {
    this._cellEvt.handleCellClick(e, t, s);
  }
  _handleCellDblClick(e, t, s) {
    this._cellEvt.handleCellDblClick(e, t, s);
  }
  _handleCellMouseOver(e, t, s) {
    this._cellEvt.handleCellMouseOver(e, t, s);
  }
  _handleCellMouseOut(e, t, s) {
    this._cellEvt.handleCellMouseOut(e, t, s);
  }
  _handleCellMouseDown(e, t, s) {
    this._cellEvt.handleCellMouseDown(e, t, s);
  }
  _handleCellMouseUp(e, t, s) {
    this._cellEvt.handleCellMouseUp(e, t, s);
  }
  _handleCellMouseMove(e, t, s) {
    this._cellEvt.handleCellMouseMove(e, t, s);
  }
  _handleCellKeyEvt(e, t) {
    this._cellEvt.handleCellKeyEvt(e, t);
  }
  _handleRowCheck(e, t) {
    this._rowMgr.check(e, t), this._doRender(...this._visRange()), this.emit("rowCheck", { rowIndex: e, checked: t, row: this._data.getRowByIndex(e) });
  }
  _handleFilterIconClick(e, t) {
    var _a, _b;
    if ((_a = this._filterPanel) == null ? void 0 : _a.isOpen) {
      this._filterPanel.close();
      return;
    }
    const s = this._sfMgr.filters[e] ?? [];
    (_b = this._filterPanel) == null ? void 0 : _b.open(e, t, s);
  }
  _handleAllCheck(e) {
    this._rowMgr.checkAll(e, this._data.rowCount), this._doRender(...this._visRange()), this.emit("allCheck", { checked: e });
  }
  _handleRowDrop(e, t) {
    var _a, _b;
    this._data.moveRow(e, t), this._doRender(...this._visRange()), this.emit("rowDrop", { fromIndex: e, toIndex: t }), (_b = (_a = this._options).onRowDrop) == null ? void 0 : _b.call(_a, { fromIndex: e, toIndex: t });
  }
  _crossBodyEl() {
    return this._renderer.bodyWrapper;
  }
  _dragRowSet(e) {
    const t = [...this._rowMgr.selectedRows];
    return t.length > 1 && t.includes(e) ? t.sort((s, i) => s - i) : [e];
  }
  moveRowsTo(e, t, s) {
    return this._cross.moveRowsTo(e, t, s);
  }
  moveCheckedTo(e) {
    return this._cross.moveCheckedTo(e);
  }
  reorderRow(e, t) {
    this._data.moveRow(e, t), this._doRender(...this._visRange());
  }
  _handleColResize(e, t) {
    this._colWidths[e] !== void 0 && (this._colWidths[e] = t);
    const s = this._colLayout.visibleLeaves[e];
    s && this._userWidths.set(s.field, t), this._renderHeader(), this._doRender(...this._visRange());
  }
  _handleKeyDown(e) {
    this._kbdMgr.handleKeyDown(e);
  }
  _setFocusCell(e, t) {
    this._rowMgr.selectSingle(e), this._editMgr.setFocusCell(e, t);
  }
  _announce(e) {
    this._liveRegion && (this._liveRegion.textContent = "", setTimeout(() => {
      this._liveRegion && (this._liveRegion.textContent = e);
    }, 50));
  }
  _bindOptionEvents() {
    this._options.onCellClick && this.on("cellClick", this._options.onCellClick), this._options.onCellDblClick && this.on("cellDblClick", this._options.onCellDblClick), this._options.onRowClick && this.on("rowClick", this._options.onRowClick), this._options.onEditStart && this.on("editStart", this._options.onEditStart), this._options.onEditEnd && this.on("editEnd", this._options.onEditEnd), this._options.onSortChange && this.on("sortChange", this._options.onSortChange), this._options.onFilterChange && this.on("filterChange", this._options.onFilterChange), this._options.onScroll && this.on("scroll", this._options.onScroll), this._options.onDataChange && this.on("dataChange", this._options.onDataChange), this._options.onSelectionChange && this.on("selectionChange", this._options.onSelectionChange), this._options.onRowDblClick && this.on("rowDblClick", this._options.onRowDblClick), this._options.onRowMouseOver && this.on("rowMouseOver", this._options.onRowMouseOver), this._options.onRowMouseOut && this.on("rowMouseOut", this._options.onRowMouseOut), this._options.onRowMouseDown && this.on("rowMouseDown", this._options.onRowMouseDown), this._options.onRowMouseUp && this.on("rowMouseUp", this._options.onRowMouseUp), this._options.onRowMouseMove && this.on("rowMouseMove", this._options.onRowMouseMove), this._options.onCellMouseOver && this.on("cellMouseOver", this._options.onCellMouseOver), this._options.onCellMouseOut && this.on("cellMouseOut", this._options.onCellMouseOut), this._options.onCellMouseDown && this.on("cellMouseDown", this._options.onCellMouseDown), this._options.onCellMouseUp && this.on("cellMouseUp", this._options.onCellMouseUp), this._options.onCellMouseMove && this.on("cellMouseMove", this._options.onCellMouseMove), this._options.onCellKeyDown && this.on("cellKeyDown", this._options.onCellKeyDown), this._options.onCellKeyUp && this.on("cellKeyUp", this._options.onCellKeyUp), this._options.onCellKeyPress && this.on("cellKeyPress", this._options.onCellKeyPress), this._options.onRowExpand && this.on("rowExpand", this._options.onRowExpand), this._options.onRowCollapse && this.on("rowCollapse", this._options.onRowCollapse);
  }
  setData(e) {
    this._mutation.setData(e), this._cf && (this._recomputeCFStats(), this._doRender(...this._visRange()));
  }
  getData() {
    return this._data.getData();
  }
  getSourceRows() {
    return this._data.getOriginalData();
  }
  pushData(e) {
    var _a, _b;
    const t = [...this._data.getAllData(), ...e];
    this._data.setData(t);
    const s = this._data.rowCount;
    (_a = this._vs) == null ? void 0 : _a.setTotalRows(this._flatModel.count()), (_b = this._pagination) == null ? void 0 : _b.setTotalRows(s);
  }
  prefixData(e) {
    var _a, _b;
    const t = [...e, ...this._data.getAllData()];
    this._data.setData(t);
    const s = this._data.rowCount;
    (_a = this._vs) == null ? void 0 : _a.setTotalRows(this._flatModel.count()), (_b = this._pagination) == null ? void 0 : _b.setTotalRows(s);
  }
  async setConditionalFormat(e) {
    if (this._cfRules = e, !e.length) {
      this._cf = null, this._cfStats.clear(), this._doRender(...this._visRange());
      return;
    }
    const t = await import("./index-DrCPRuYi.js");
    this._cf = new t.CFEngine(new t.CFRuleStore(e)), this._cfAppearance = t.staticAppearanceView(), this._cfComputeStats = t.computeColumnStats, this._recomputeCFStats(), this._doRender(...this._visRange());
  }
  _recomputeCFStats() {
    const e = this._cfComputeStats;
    if (!this._cfRules.length || !e) {
      this._cfStats.clear();
      return;
    }
    const t = new Set(this._cfRules.map((o) => o.scope.columnId)), s = this._data.getData(), i = /* @__PURE__ */ new Map();
    for (const o of t) i.set(o, e(s.map((n) => n[o])));
    this._cfStats = i;
  }
  async setRealtimeSource(e, t) {
    var _a;
    (_a = this._rt) == null ? void 0 : _a.detach(), this._rt = null;
    const s = await import("./index-DnarQ4eR.js"), o = { mutation: { writeCell: (h, u, g) => this._mutation.writeCell(h, u, g), writeCells: (h) => this._mutation.writeCells(h.map((u) => ({ ...u }))), insertRow: (h, u) => this._mutation.insertRow(h, u ?? "last"), deleteRows: (h) => this._mutation.deleteRow([...h]), beginBatch: () => this._mutation.beginBatch(), endBatch: () => this._mutation.endBatch() }, coords: { rowCount: () => this._flatModel.count(), rowIdAt: (h) => this._flatModel.rowIdOfFlat(h) ?? void 0, indexOf: (h) => this._flatModel.flatIndexOfRowId(h), getCellValue: (h, u) => this._data.getCellValueByRowId(h, u), getRowSnapshot: (h) => {
      const u = this._data.getRowById(h);
      return u ? { ...u } : void 0;
    } }, values: { equals: (h, u) => Object.is(h, u) }, clock: { now: () => Date.now() } }, n = { dispatchSilent: (h) => h.do(o), beginBatch: () => this._mutation.beginBatch(), endBatch: () => this._mutation.endBatch() }, a = { rowIdToIndex: (h) => this._flatModel.flatIndexOfRowId(h), indexToRowId: (h) => this._flatModel.rowIdOfFlat(h) ?? void 0 }, l = { readSelection: () => [], readScroll: () => {
      var _a2;
      return { pixelWithinRow: 0, scrollLeft: ((_a2 = this._renderer) == null ? void 0 : _a2.bodyWrapper.scrollLeft) ?? 0 };
    }, readEditing: () => {
    }, readSortFilterSig: () => "", writeSelection: () => {
    }, writeScroll: () => {
    }, writeEditing: () => {
    } }, d = { sink: n, stateGuard: new s.LiveStateGuard(l, a), freshness: new s.FreshnessClock({ staleAfterMs: (t == null ? void 0 : t.staleAfterMs) ?? 5e3 }), announce: new s.RtAnnouncePolicy({ announce: (t == null ? void 0 : t.announce) ?? (() => {
    }), ...(t == null ? void 0 : t.debounceMs) !== void 0 ? { debounceMs: t.debounceMs } : {} }), ...(t == null ? void 0 : t.scheduleFrame) ? { scheduleFrame: t.scheduleFrame } : {}, ...(t == null ? void 0 : t.maxBatchPerFrame) !== void 0 ? { maxBatchPerFrame: t.maxBatchPerFrame } : {}, applySnapshot: (h) => this.setData(h) }, c = new s.RealtimeController(e, d);
    return this._rt = c, c.attach(), c;
  }
  disconnectRealtime() {
    var _a;
    (_a = this._rt) == null ? void 0 : _a.detach(), this._rt = null;
  }
  clearData() {
    this._rowMgr.reset(), this._data.clearData(), this._mutation.commit({ totals: "zero", renderMode: "full", emitPayload: () => [] });
  }
  insertRow(e, t = "last") {
    this._mutation.insertRow(e, t);
  }
  pushRow(e) {
    this._mutation.pushRow(e);
  }
  appendRows(e) {
    this.pushRow(e);
  }
  unshiftRow(e) {
    (Array.isArray(e) ? e : [e]).forEach((s) => this._data.addRow(s, "first")), this._mutation.commit({ totals: "count", renderMode: "sync-window", emitPayload: () => this._data.getData(), fireOnDataChangeExplicitly: true });
  }
  prependRows(e) {
    this.unshiftRow(e);
  }
  deleteRow(e) {
    this._mutation.deleteRow(e);
  }
  deleteById(e) {
  }
  readCell(e, t) {
    return this._data.getCellValue(e, t);
  }
  getDisplayValue(e, t) {
    const s = this.readCell(e, t);
    return this._ovk.getStrategy("displayFormatter", (o, n, a) => o == null ? "" : String(o))(s, t, this._data.getRowByIndex(e));
  }
  writeCell(e, t, s) {
    this._mutation.writeCell(e, t, s);
  }
  getRowAt(e) {
    return this._data.getRowByIndex(e);
  }
  getFlatRowModel() {
    return this._flatModel;
  }
  beginBatch() {
    this._mutation.beginBatch();
  }
  endBatch() {
    this._mutation.endBatch();
  }
  setCellFormula(e, t, s) {
    this._formula.setCellFormula(e, t, s);
  }
  getCellFormula(e, t) {
    return this._formula.getCellFormula(e, t);
  }
  hasCellFormula(e, t) {
    return this._formula.hasCellFormula(e, t);
  }
  clearCellFormula(e, t) {
    this._formula.clearCellFormula(e, t);
  }
  getCellError(e, t) {
    return this._formula.getCellError(e, t);
  }
  getDependents(e, t) {
    return this._formula.getDependents(e, t);
  }
  getPrecedents(e, t) {
    return this._formula.getPrecedents(e, t);
  }
  recalculate() {
    this._formula.recalculate();
  }
  recalculateCell(e, t) {
    this._formula.recalculateCell(e, t);
  }
  offsetFormula(e, t, s, i) {
    return this._formula.offsetFormula(e, t, s, i);
  }
  writeCells(e) {
    return this._mutation.writeCells(e);
  }
  getRangeSelection() {
    return this._rangeMgr.getRangeSelection();
  }
  getActiveRange() {
    return this._rangeMgr.getActiveRange();
  }
  setRangeSelection(e) {
    this._rangeMgr.setRangeSelection(e);
  }
  clearRangeSelection() {
    this._rangeMgr.clearRangeSelection();
  }
  getRangeValues() {
    return this._rangeMgr.getRangeValues();
  }
  getRangeStats() {
    return this._rangeMgr.getRangeStats();
  }
  fillRange(e, t, s = "copy") {
    this._rangeMgr.fillRange(e, t, s);
  }
  createChart(e) {
    return this._chartMgr.createChart(e);
  }
  getCharts() {
    return this._chartMgr.getCharts();
  }
  destroyCharts() {
    this._chartMgr.destroyCharts();
  }
  getChanges() {
    return this._data.getChanges();
  }
  getEditedRows() {
    return this._data.getEditedRows();
  }
  getChangedRows() {
    return this._data.getChangedRows();
  }
  getChangedColumns() {
    return this._data.getChangedColumns();
  }
  getAddedRows() {
    return this._data.getAddedRows();
  }
  getRemovedRows() {
    return this._data.getRemovedRows();
  }
  getOriginalRow(e) {
    return this._data.getOriginalRow(e);
  }
  getRowsWithState(e) {
    return this._data.getRowsWithState(e);
  }
  undo() {
  }
  redo() {
  }
  clearHistory() {
  }
  getColumnDefs() {
    return this._colLayout.visibleLeaves;
  }
  getAllColumnDefs() {
    return this._colLayout.leaves;
  }
  getColumnCount() {
    return this._colLayout.visibleLeaves.length;
  }
  applyColumns(e) {
    const t = this._trigMgr.mkCtx("applyColumns", [e]);
    this._trigMgr.exec("before:applyColumns", t) && (this._colLayout.setColumns(e), this._recalcWidths(this._container.getBoundingClientRect().width), this._renderHeader(), this._doRender(...this._visRange()), t.result = { columnCount: e.length }, this._trigMgr.exec("after:applyColumns", t));
  }
  insertColumn(e, t) {
    this._colLayout.addColumn(e, t), this._recalcWidths(this._container.getBoundingClientRect().width), this._renderHeader(), this._doRender(...this._visRange());
  }
  deleteColumn(e) {
    this._colLayout.removeColumn(e), this._recalcWidths(this._container.getBoundingClientRect().width), this._formula.afterRecalc(this._recalc.invalidateField(e), { skipRender: true }), this._renderHeader(), this._doRender(...this._visRange());
  }
  _reorderColumn(e, t) {
    var _a, _b;
    const s = this._colLayout.visibleLeaves.map((n) => n);
    if (e < 0 || t < 0 || e >= s.length || t >= s.length) return;
    const i = [...this._options.columns], [o] = i.splice(e, 1);
    i.splice(t, 0, o), this._options.columns = i, this.applyColumns(i), (_b = (_a = this._options).onColumnReorder) == null ? void 0 : _b.call(_a, { fromIndex: e, toIndex: t, field: o.field ?? "" });
  }
  hideColumn(e) {
    this._colLayout.hideColumn(e), this._recalcWidths(this._container.getBoundingClientRect().width), this._renderHeader(), this._doRender(...this._visRange());
  }
  showColumn(e) {
    this._colLayout.showColumn(e), this._recalcWidths(this._container.getBoundingClientRect().width), this._renderHeader(), this._doRender(...this._visRange());
  }
  getColumnIndex(e) {
    return this._colLayout.getColumnIndex(e);
  }
  getFieldAt(e) {
    var _a;
    return ((_a = this._colLayout.getColumnByIndex(e)) == null ? void 0 : _a.field) ?? "";
  }
  getColValues(e, t = false) {
    return this._data.getData().map((s) => s[e]);
  }
  getUniqueValues(e, t = false) {
    return [...new Set(this.getColValues(e, t))];
  }
  setColWidths(e) {
  }
  calcColWidths(e = false) {
    return [];
  }
  getSelections() {
    return this._rowMgr.getSelections();
  }
  getActiveRow() {
    return this._rowMgr.getActiveRow();
  }
  activate(e) {
    this._rowMgr.activate(e), this._doRender(...this._visRange());
  }
  deselect() {
    this._rowMgr.deselect(), this._doRender(...this._visRange());
  }
  getChecked() {
    return this._rowMgr.getChecked();
  }
  getAllChecked() {
    return this._rowMgr.getAllChecked();
  }
  checkById(e) {
  }
  addCheckById(e) {
  }
  checkByValue(e, t) {
    this._rowMgr.checkByValue(e, t), this._doRender(...this._visRange());
  }
  uncheckById(e) {
  }
  uncheckAll() {
    this._rowMgr.uncheckAll(), this._doRender(...this._visRange());
  }
  orderBy(e, t = "asc") {
    const s = this._trigMgr.mkCtx("orderBy", [e, t]);
    this._trigMgr.exec("before:orderBy", s) && (this._sfMgr.sort(e, t), this._recalcRangeBearingFormulas(), s.result = { sortList: this._sfMgr.sortList }, this._trigMgr.exec("after:orderBy", s));
  }
  resetOrder() {
    this._sfMgr.resetSort(), this._recalcRangeBearingFormulas();
  }
  setFilter(e, t) {
    const s = this._trigMgr.mkCtx("setFilter", [e, t]);
    this._trigMgr.exec("before:setFilter", s) && (this._sfMgr.setFilter(e, t), this._recalcRangeBearingFormulas(), s.result = { field: e, filteredCount: this._data.rowCount }, this._trigMgr.exec("after:setFilter", s));
  }
  resetFilter(e) {
    this._sfMgr.resetFilter(e), this._recalcRangeBearingFormulas();
  }
  _recalcRangeBearingFormulas() {
    this._formula.recalcRangeBearingFormulas();
  }
  getFilterState() {
    return this._sfMgr.getFilterState();
  }
  restoreFilter(e) {
    this._sfMgr.restoreFilter(e);
  }
  _applyFilters() {
    this._sfMgr.applyFilters();
  }
  freeze(e) {
    this._colLayout.setFrozen(e), this._renderHeader(), this._doRender(...this._visRange());
  }
  mergeCells(e) {
    this._mergeEngine.applyMergeCells(e), this._doRender(...this._visRange());
  }
  autoMerge(e) {
    const t = this._colLayout.visibleLeaves, s = [], i = [];
    for (const o of e) {
      const n = t.findIndex((a) => a.field === o);
      n >= 0 && (s.push(n), i.push(o));
    }
    this._mergeEngine.applyAutoMerge(this._data.getData(), s, i), this._doRender(...this._visRange());
  }
  clearMerge() {
    this._mergeEngine.clear(), this._doRender(...this._visRange());
  }
  freezeRows(e) {
  }
  groupBy(e) {
    const t = this._trigMgr.mkCtx("groupBy", [e]);
    this._trigMgr.exec("before:groupBy", t) && (this._grpMgr.groupBy(e), t.result = { fields: e }, this._trigMgr.exec("after:groupBy", t));
  }
  clearGroup() {
    this._grpMgr.clearGroup();
  }
  expandAll() {
    this._grpMgr.expandAll();
  }
  collapseAll() {
    this._grpMgr.collapseAll();
  }
  enableTree() {
    this._grpMgr.enableTree();
  }
  disableTree() {
    this._grpMgr.disableTree();
  }
  expandNodes(e, t = true) {
    this._grpMgr.expandNodes(e, t);
  }
  expandAllNodes() {
    this._grpMgr.expandAllNodes();
  }
  collapseAllNodes() {
    this._grpMgr.collapseAllNodes();
  }
  expandRow(e) {
    this._detailMgr.expandRow(e);
  }
  collapseRow(e) {
    this._detailMgr.collapseRow(e);
  }
  toggleRow(e) {
    this._detailMgr.toggleRow(e);
  }
  isRowExpanded(e) {
    return this._detailMgr.isRowExpanded(e);
  }
  collapseAllDetails() {
    this._detailMgr.collapseAllDetails();
  }
  getDetailInstance(e) {
    return this._detailMgr.getDetailInstance(e);
  }
  resyncPanelWidths() {
    this._detailMgr.resyncPanelWidths();
  }
  addTreeRow(e, t, s) {
  }
  exportExcel(e) {
    this._exportMgr.exportExcel(e);
  }
  exportCsv(e) {
    this._exportMgr.exportCsv(e);
  }
  exportJson(e) {
    this._exportMgr.exportJson(e);
  }
  print(e) {
    this._exportMgr.print(e);
  }
  toArray(e = true) {
    const t = this._data.getData();
    if (e) return t;
    const s = this._colLayout.visibleLeaves;
    return t.map((i) => s.map((o) => i[o.field]));
  }
  jumpToRow(e) {
    var _a;
    this._rowMgr.selectSingle(e), (_a = this._vs) == null ? void 0 : _a.scrollToRow(e), this._doRender(...this._visRange());
  }
  jumpToCol(e) {
  }
  getScrollPos() {
    var _a, _b;
    return { x: ((_a = this._renderer) == null ? void 0 : _a.bodyWrapper.scrollLeft) ?? 0, y: ((_b = this._renderer) == null ? void 0 : _b.bodyWrapper.scrollTop) ?? 0 };
  }
  setFooter(e) {
    this._options.footer = e, this._renderFooterEl();
  }
  getFooterData() {
    return this._footerMgr.computeValues();
  }
  getFooterValue(e) {
    var _a;
    return ((_a = this._footerMgr.computeValues().find((t) => t._field === e)) == null ? void 0 : _a._value) ?? null;
  }
  _renderFooterEl() {
    this._footerMgr.render();
  }
  resize(e, t) {
    e && (this._container.style.width = `${e}px`), t && (this._container.style.height = `${t}px`), this._onResize();
  }
  setTheme(e) {
    this._container.setAttribute("data-og-theme", e);
  }
  setThemeVar(e, t) {
    this._container.style.setProperty(e, t);
  }
  setSkin(e) {
    var _a;
    this._options.skin = e, this._container.setAttribute("data-og-skin", e), (_a = this._appearance) == null ? void 0 : _a.setSkin(e), this._container.style.border = e === "default" ? "1px solid var(--og-border-color, #e0e0e0)" : this._appearance ? this._appearance.border() : "1px solid var(--og-border-color, #e0e0e0)", this._renderHeader(), this._doRender(...this._visRange());
  }
  getSkin() {
    return this._options.skin ?? "default";
  }
  setIcon(e, t) {
    var _a;
    this._icons || (this._icons = ge.child()), this._icons.register(e, t);
    try {
      (_a = this._extensions) == null ? void 0 : _a.strategy("iconResolver", (s, i) => this._icons.render(s, i));
    } catch {
    }
    return this;
  }
  renderIcon(e, t) {
    return (this._icons ?? ge).render(e, t);
  }
  setLocale(e) {
    var _a, _b;
    const t = this.getLocale();
    (this._locales ?? (this._locales = se.child())).setActive(e), this._options.locale = e, this._container.setAttribute("lang", (this._locales ?? se).meta().intlLocale), (_a = this._pagination) == null ? void 0 : _a.refreshLabels(), (_b = this._findMgr) == null ? void 0 : _b.refreshLabels(), this._filterPanel = null, this._renderHeader(), this._doRender(...this._visRange()), this.emit("localeChange", { locale: e, prev: t });
  }
  getLocale() {
    return (this._locales ?? se).active();
  }
  setMessage(e, t) {
    return (this._locales ?? (this._locales = se.child())).setOverride(e, t), this;
  }
  t(e, t) {
    return (this._locales ?? se).t(e, t);
  }
  setSkinVar(e, t) {
    if (/#[0-9a-fA-F]{3,8}\b/.test(t) || /\b(?:rgba?|hsla?)\(\s*\d/.test(t)) throw new Error(`[OpenGrid.setSkinVar] "${e}: ${t}" 에 색 리터럴 — 색은 setThemeVar 축입니다(색⊥형태).`);
    this._container.style.setProperty(e, t);
  }
  setDensity(e) {
    const t = Ht.resolve(e);
    t.attr ? this._container.setAttribute(t.attr.name, t.attr.value) : this._container.removeAttribute("data-og-density");
    for (const i of Bt) this._container.style.removeProperty(i);
    this._container.style.removeProperty("--og-row-height");
    for (const [i, o] of Object.entries(t.tokens)) this._container.style.setProperty(i, o);
    const s = t.tokens["--og-density-row-height"];
    s != null && this._container.style.setProperty("--og-row-height", s), t.requiresRelayout && this._onResize();
  }
  setTexture(e) {
    const t = Nt.resolve(e);
    t.attr ? this._container.setAttribute(t.attr.name, t.attr.value) : this._container.removeAttribute("data-og-texture");
    for (const s of Pt) this._container.style.removeProperty(s);
    for (const [s, i] of Object.entries(t.tokens)) this._container.style.setProperty(s, i);
  }
  addTrigger(e, t) {
    return this._trigMgr.add(e, t), this;
  }
  removeTrigger(e, t) {
    return this._trigMgr.remove(e, t), this;
  }
  clearTriggers(e) {
    return this._trigMgr.clear(e), this;
  }
  _mkCtx(e, t) {
    return this._trigMgr.mkCtx(e, t);
  }
  _trig(e, t) {
    return this._trigMgr.exec(e, t);
  }
  destroy() {
    var _a, _b, _c, _d, _e2, _f, _g, _h, _i2, _j, _k;
    this._destroyed || (this._destroyed = true, this._renderer && Ke.unregister(this._renderer.bodyWrapper), this._trigMgr.clear(), (_a = this._ro) == null ? void 0 : _a.disconnect(), (_b = this._vs) == null ? void 0 : _b.destroy(), (_c = this._rt) == null ? void 0 : _c.detach(), this._rt = null, (_d = this._chartMgr) == null ? void 0 : _d.destroyCharts(), (_e2 = this._detailMgr) == null ? void 0 : _e2.destroy(), (_f = this._filterPanel) == null ? void 0 : _f.destroy(), (_g = this._dnd) == null ? void 0 : _g.destroy(), this._cmHandler && this._container.removeEventListener("contextmenu", this._cmHandler), this._cmKbdHandler && this._container.removeEventListener("keydown", this._cmKbdHandler), this._cmHandler = this._cmKbdHandler = null, (_h = this._ctxMenu) == null ? void 0 : _h.destroy(), (_i2 = this._wsManager) == null ? void 0 : _i2.destroy(), (_j = this._renderer) == null ? void 0 : _j.destroy(), (_k = this._liveRegion) == null ? void 0 : _k.remove(), this._liveRegion = null, this._container.innerHTML = "", this._container.classList.remove("og-container"), this.removeAllListeners());
  }
};
_J._defaultOverrides = [];
_J._defaultStrategies = [];
_J.defaults = { strategy(e, t) {
  return _J._defaultStrategies.push([e, t]), _J;
} };
let J = _J;
export {
  Ct as D,
  qe as I,
  je as L,
  J as O,
  Dt as S,
  et as b,
  ws as c,
  ge as i,
  se as l,
  Ve as p,
  ei as r,
  Ze as s,
  B as t
};
//# sourceMappingURL=OpenGrid-CeUdO_fM.js.map
