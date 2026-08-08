import { p as re, c as _ } from "./OpenGrid-CeUdO_fM.js";
function B(e) {
  return !!e && typeof e.ref == "string";
}
const M = 1;
function ie(e, t) {
  return JSON.stringify(e) === JSON.stringify(t);
}
function oe(e) {
  const t = (e == null ? void 0 : e.primary) ?? "#1976d2", n = (e == null ? void 0 : e.graphite) ?? "#3a3f45";
  return { rampFrom: (r) => r === "primary" ? t : n };
}
function se(e) {
  const t = [];
  for (const n of e) {
    const r = typeof n == "number" ? n : typeof n == "string" && n.trim() !== "" ? Number(n) : NaN;
    Number.isFinite(r) && t.push(r);
  }
  return t;
}
function ae(e) {
  const t = se(e), n = t.length;
  if (n === 0) return { count: 0, distinct: 0 };
  const r = [...t].sort((m, g) => m - g), o = r[0], i = r[n - 1], a = t.reduce((m, g) => m + g, 0) / n, c = t.reduce((m, g) => m + (g - a) ** 2, 0) / n, l = Math.sqrt(c), f = /* @__PURE__ */ new Map();
  for (const m of t) f.set(m, (f.get(m) ?? 0) + 1);
  const d = f.size;
  return { min: o, max: i, avg: a, stddev: l, count: n, distinct: d, rankOf: (m) => {
    let g = 0;
    for (const w of t) w > m && g++;
    return g + 1;
  }, rankAscOf: (m) => {
    let g = 0;
    for (const w of t) w < m && g++;
    return g + 1;
  }, percentileOf: (m) => {
    let g = 0;
    for (const w of t) w <= m && g++;
    return g / n;
  }, countOf: (m) => f.get(m) ?? 0 };
}
function q(e) {
  const t = {};
  return e.min !== void 0 && (t.min = e.min), e.max !== void 0 && (t.max = e.max), e.avg !== void 0 && (t.avg = e.avg), e.stddev !== void 0 && (t.stddev = e.stddev), e.count !== void 0 && (t.count = e.count), e.distinct !== void 0 && (t.distinct = e.distinct), t;
}
const ce = ["og:", "og-"];
function ue(e) {
  return ce.some((t) => e.startsWith(t));
}
function z(e) {
  const t = e.lastIndexOf("@"), n = t >= 0 ? e.slice(t + 1) : e;
  return n.split(".")[0] ?? n;
}
function le(e, t) {
  return z(e) === z(t);
}
function de(e, t, n, r, o) {
  const i = { key: e, value: t, origin: n, priority: r.priority ?? 0, seq: o };
  return r.pluginId !== void 0 && (i.pluginId = r.pluginId), r.spiVersion !== void 0 && (i.spiVersion = r.spiVersion), r.deprecated !== void 0 && (i.deprecated = r.deprecated), i;
}
class S {
  constructor(t = {}) {
    this._map = /* @__PURE__ */ new Map(), this._seq = 0, this._disposed = false, this._warned = /* @__PURE__ */ new Set(), this._cfg = t;
  }
  _warn(t, n) {
    const r = `[OpenGrid] ${n}`, o = `${t}::${n}`;
    return this._warned.has(o) || (this._warned.add(o), (this._cfg.onWarn ?? ((s) => {
      typeof console < "u" && console.warn(s);
    }))(r)), r;
  }
  register(t, n, r = {}) {
    if (this._disposed) return { ok: false, action: "rejected", reason: "disposed" };
    if (typeof t != "string" || t.length === 0) return { ok: false, action: "rejected", reason: "invalid-key" };
    const o = r.origin ?? "user";
    if (ue(t) && o !== "builtin") return { ok: false, action: "rejected", reason: "reserved-namespace", warning: this._warn(t, `reserved namespace: '${t}' 는 og:* 코어 예약 대역입니다(origin:'builtin' 만 점유).`) };
    if (this._cfg.spi && r.spiVersion !== void 0 && !le(this._cfg.spi.version, r.spiVersion)) return { ok: false, action: "rejected", reason: "spi-mismatch", warning: this._warn(t, `SPI major 불일치: '${t}' 선언 ${r.spiVersion}, 코어 ${this._cfg.spi.name}@${this._cfg.spi.version}.`) };
    const i = this._map.get(t);
    return i && !this._resolveConflict(i, r) ? { ok: false, action: "kept", reason: "protected-builtin", warning: this._warn(t, `'${t}' 는 ${i.origin === "builtin" ? "내장(built-in) 보호" : "override 미지정"} — 덮으려면 { override:true }.`) } : (this._map.set(t, de(t, n, o, r, this._seq++)), { ok: true, action: i ? "replaced" : "added" });
  }
  _resolveConflict(t, n) {
    return t.origin === "builtin" && n.override !== true ? false : this._cfg.duplicatePolicy === "explicit-override" ? n.override === true : true;
  }
  get(t) {
    var _a;
    return (_a = this._map.get(t)) == null ? void 0 : _a.value;
  }
  require(t, n) {
    const r = this.get(t);
    if (r !== void 0) return r;
    if (n !== void 0) return n;
    if (this._cfg.placeholder) return this._cfg.placeholder(t);
  }
  has(t) {
    return this._map.has(t);
  }
  list() {
    return [...this._map.keys()];
  }
  entries() {
    return [...this._map.values()];
  }
  unregister(t) {
    return this._map.delete(t);
  }
  disposePlugin(t) {
    let n = 0;
    for (const [r, o] of this._map) o.pluginId === t && (this._map.delete(r), n++);
    return n;
  }
  dispose() {
    this._map.clear(), this._warned.clear(), this._disposed = true;
  }
}
function b(e) {
  return typeof e == "number" ? e : typeof e == "string" && e.trim() !== "" ? Number(e) : NaN;
}
const h = 864e5;
function k(e) {
  const t = new Date(e);
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
}
function W(e) {
  const t = k(e), n = new Date(t).getDay();
  return t - n * h;
}
const fe = { needs: [], test(e, t) {
  const n = b(t.value);
  if (!Number.isFinite(n)) return false;
  switch (e.op) {
    case ">":
      return n > e.a;
    case ">=":
      return n >= e.a;
    case "<":
      return n < e.a;
    case "<=":
      return n <= e.a;
    case "=":
      return n === e.a;
    case "!=":
      return n !== e.a;
    case "between":
      return e.b !== void 0 && n >= Math.min(e.a, e.b) && n <= Math.max(e.a, e.b);
    default:
      return false;
  }
} }, pe = { needs: [], test(e, t) {
  const n = t.value == null ? "" : String(t.value);
  return e.ci === false ? n.includes(e.text) : n.toLowerCase().includes(e.text.toLowerCase());
} }, me = { needs: [], test(e, t, n, r) {
  const o = t.value, i = o instanceof Date ? o.getTime() : typeof o == "number" ? o : Date.parse(String(o));
  if (!Number.isFinite(i)) return false;
  const s = r.now, a = k(s);
  switch (e.rel) {
    case "today":
      return k(i) === a;
    case "yesterday":
      return k(i) === a - h;
    case "tomorrow":
      return k(i) === a + h;
    case "thisWeek": {
      const c = W(s);
      return i >= c && i < c + 7 * h;
    }
    case "lastWeek": {
      const c = W(s) - 7 * h;
      return i >= c && i < c + 7 * h;
    }
    case "thisMonth": {
      const c = new Date(s);
      return new Date(i).getFullYear() === c.getFullYear() && new Date(i).getMonth() === c.getMonth();
    }
    case "lastMonth": {
      const c = new Date(s.valueOf()), l = new Date(c.getFullYear(), c.getMonth() - 1, 1);
      return new Date(i).getFullYear() === l.getFullYear() && new Date(i).getMonth() === l.getMonth();
    }
    case "next7d":
      return i >= a && i < a + 7 * h;
    case "last7d":
      return i < a + h && i >= a - 6 * h;
    default:
      return false;
  }
} }, ge = { needs: ["rank"], test(e, t, n) {
  const r = b(t.value);
  return Number.isFinite(r) ? e.bottom ? n.rankAscOf ? n.rankAscOf(r) <= e.n : false : n.rankOf ? n.rankOf(r) <= e.n : false : false;
} }, he = { needs: ["percentile"], test(e, t, n) {
  const r = b(t.value);
  if (!Number.isFinite(r) || !n.percentileOf) return false;
  const o = n.percentileOf(r);
  return e.bottom ? o <= e.pct / 100 : o >= 1 - e.pct / 100;
} }, ve = { needs: ["avg"], test(e, t, n) {
  const r = b(t.value);
  return !Number.isFinite(r) || n.avg === void 0 ? false : e.below ? r < n.avg : r > n.avg;
} }, be = { needs: ["avg", "stddev"], test(e, t, n) {
  const r = b(t.value);
  if (!Number.isFinite(r) || n.avg === void 0 || n.stddev === void 0) return false;
  const o = Math.abs(r - n.avg), i = e.k * n.stddev;
  return e.outside === false ? o <= i : o >= i;
} }, ye = { needs: ["cardinality"], test(e, t, n) {
  const r = b(t.value);
  if (!Number.isFinite(r) || !n.countOf) return false;
  const o = n.countOf(r);
  return e.unique ? o === 1 : o > 1;
} }, we = { needs: [], test() {
  return false;
} }, Y = Object.freeze({ compare: fe, textContains: pe, dateOccurring: me, topN: ge, topNpct: he, aboveAvg: ve, stdBand: be, duplicate: ye, custom: we });
function j() {
  const e = new S({ spi: { name: "CFPredicate", version: "1" } });
  for (const [t, n] of Object.entries(Y)) e.register(t, n, { origin: "builtin" });
  return e;
}
function L(e, t) {
  const n = e.scope;
  return !(n.columnId !== t.columnId || n.range && (t.rowIndex < n.range.startRow || t.rowIndex >= n.range.endRow) || n.rowState && n.rowState !== t.rowState);
}
function ke(e) {
  return [...e].sort((t, n) => t.priority - n.priority || (t.id < n.id ? -1 : t.id > n.id ? 1 : 0));
}
function Ie(e) {
  return typeof e == "number" ? e : typeof e == "string" && e.trim() !== "" ? Number(e) : NaN;
}
function y(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function U(e, t, n) {
  const r = Ie(t), o = Number.isFinite(r), i = !o || r === 0 ? 0 : r > 0 ? 1 : -1, s = n.min ?? 0, a = n.max ?? 0;
  if (e.kind === "bar") {
    if (!o) return { sign: 0 };
    const c = e.axis ?? "zero";
    let l, f = false;
    if (c === "zero") {
      const d = Math.max(Math.abs(s), Math.abs(a)) || 1, u = Math.abs(r) / d;
      l = y(u), e.clamp && u > 1 && (f = true);
    } else {
      const d = a - s || 1, u = (r - s) / d;
      l = y(u), e.clamp && (u < 0 || u > 1) && (f = true);
    }
    return { ratio: l, sign: i, value: r, clamped: f };
  }
  if (e.kind === "scale") {
    if (!o) return { sign: 0 };
    const c = e.mode ?? "discrete";
    let l;
    if (e.diverging) {
      const u = e.midpoint === "zero" ? 0 : e.midpoint === "mean" ? n.avg ?? (s + a) / 2 : typeof e.midpoint == "number" ? e.midpoint : 0;
      if (r <= u) {
        const p = u - s || 1;
        l = 0.5 * y((r - s) / p);
      } else {
        const p = a - u || 1;
        l = 0.5 + 0.5 * y((r - u) / p);
      }
    } else {
      const u = a - s || 1;
      l = y((r - s) / u);
    }
    if (c === "continuous") return { ratio: l, sign: i, value: r };
    const f = e.diverging ? Math.max(3, Math.min(5, e.bands ?? 3)) : Math.max(2, Math.min(5, e.bands ?? 3)), d = Math.min(f - 1, Math.floor(l * f));
    return { ratio: l, bandIndex: d, bandCount: f, sign: i, value: r };
  }
  if (e.kind === "icon") {
    if (!o) return { sign: 0 };
    const c = e.steps ?? 3, l = a - s || 1, f = y((r - s) / l);
    let d = Math.min(c - 1, Math.floor(f * c));
    return e.reverse && (d = c - 1 - d), { bandIndex: d, bandCount: c, ratio: f, sign: i, value: r };
  }
  return o ? { sign: i, value: r } : { sign: i };
}
function _e(e, t) {
  return e.get(t);
}
class G {
  constructor(t) {
    this.ruleTypes = t;
  }
  evaluate(t, n, r, o) {
    const i = ke(t.filter((u) => L(u, n)));
    let s;
    const a = [], c = [];
    let l;
    for (const u of i) {
      const p = _e(this.ruleTypes, u.when.type);
      if (!p) continue;
      let v = false;
      try {
        v = p.test(u.when, n, r, o);
      } catch {
        v = false;
      }
      if (!v) continue;
      const V = U(u.encode, n.value, r), m = { ruleId: u.id, conditionType: u.when.type, threshold: Me(u), inputValue: n.value, statsUsed: q(r), priority: u.priority, wonOver: [] }, g = { ruleId: u.id, fired: true, encode: u.encode, datum: V, ...u.style !== void 0 ? { styleRef: u.style } : {}, lineage: m };
      if (u.encode.kind === "bar" || u.encode.kind === "scale" ? (s && c.push(s.ruleId), s = g) : a.push(g), u.stopIfTrue) {
        l = u.id;
        break;
      }
    }
    s && c.length && (s = { ...s, lineage: { ...s.lineage, wonOver: [...c] } });
    const f = s ?? a[0], d = { decorators: a };
    return s && (d.background = s), f && (d.winner = f), l !== void 0 && (d.stoppedAt = l), d;
  }
}
function Me(e) {
  const { type: t, ...n } = e.when;
  return n;
}
const $ = "#f4f5f6";
function D(e) {
  const t = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${t(e.r)}${t(e.g)}${t(e.b)}`;
}
function x(e, t, n) {
  const r = n < 0 ? 0 : n > 1 ? 1 : n;
  return { r: e.r + (t.r - e.r) * r, g: e.g + (t.g - e.g) * r, b: e.b + (t.b - e.b) * r };
}
function C(e) {
  return re(e) ?? { r: 58, g: 63, b: 69 };
}
function xe(e) {
  return x({ r: 255, g: 255, b: 255 }, e, 0.08);
}
function R(e, t) {
  const n = C(e);
  return D(x(xe(n), n, t));
}
function A(e, t) {
  const n = Math.max(2, Math.min(5, Math.floor(t))), r = [];
  for (let o = 0; o < n; o++) r.push(R(e, n === 1 ? 0 : o / (n - 1)));
  return r;
}
function E(e, t, n, r = $) {
  const o = C(r);
  return n <= 0.5 ? D(x(C(e), o, n / 0.5)) : D(x(o, C(t), (n - 0.5) / 0.5));
}
function H(e, t, n, r = $) {
  const o = Math.max(3, Math.min(5, Math.floor(n))), i = [];
  for (let s = 0; s < o; s++) i.push(E(e, t, o === 1 ? 0.5 : s / (o - 1), r));
  return i;
}
const P = 4.5, F = "#111111", N = "#ffffff";
class J {
  pickInk(t) {
    const n = _(F, t), r = _(N, t), o = r >= n, i = o ? N : F, s = o ? r : n;
    return s >= P ? { color: i, ratio: s } : { color: i, outline: true, outlineColor: o ? F : N, ratio: s };
  }
}
function Ce(e) {
  return Math.max(_(F, e), _(N, e)) >= P;
}
const K = new J(), T = "#111111";
function O(e) {
  return e === void 0 || !Number.isFinite(e) ? "—" : Number.isInteger(e) ? String(e) : String(Math.round(e * 1e3) / 1e3);
}
function X(e) {
  return e === void 0 ? "—" : `${Math.round(e * 100)}%`;
}
class Q {
  constructor() {
    this.kind = "bar";
  }
  encode(t, n, r) {
    const o = t.encode, i = t.datum;
    if (i.value === void 0) return { layer: "background", inkColor: T, ariaSummary: "값 없음" };
    const s = o.seed ?? (i.sign === -1 ? "graphite" : "primary"), a = n.rampFrom(s), l = (o.axis ?? "zero") === "zero" && i.sign === -1 ? "right" : "left", f = K.pickInk(a), d = i.ratio ?? 0, u = i.clamped ? " (범위 초과·클램프)" : "", p = o.log ? " (log)" : "", v = `값 ${O(i.value)}, 막대 ${X(d)}${i.sign === -1 ? " 음수" : ""}${u}${p}`;
    return { layer: "background", fill: { color: a, from: l, ratio: d }, inkColor: f.color, ...f.outline ? { inkOutline: true } : {}, ...i.clamped ? { clamped: true } : {}, ariaSummary: v };
  }
}
class Z {
  constructor() {
    this.kind = "scale";
  }
  encode(t, n, r) {
    const o = t.encode, i = t.datum;
    if (i.value === void 0) return { layer: "background", inkColor: T, ariaSummary: "값 없음" };
    const s = o.mode ?? "discrete";
    let a, c = "";
    if (o.diverging) {
      const d = n.rampFrom("graphite"), u = n.rampFrom("primary");
      if (s === "continuous") a = E(d, u, i.ratio ?? 0.5);
      else {
        const p = H(d, u, i.bandCount ?? 3);
        a = p[i.bandIndex ?? 0] ?? p[0], c = ` (구간 ${(i.bandIndex ?? 0) + 1}/${i.bandCount ?? p.length})`;
      }
    } else {
      const d = o.seed ?? "graphite", u = n.rampFrom(d);
      if (s === "continuous") a = R(u, i.ratio ?? 0);
      else {
        const p = A(u, i.bandCount ?? 3);
        a = p[i.bandIndex ?? 0] ?? p[0], c = ` (구간 ${(i.bandIndex ?? 0) + 1}/${i.bandCount ?? p.length})`;
      }
    }
    const l = K.pickInk(a), f = `값 ${O(i.value)}, 히트맵 ${X(i.ratio)}${c}`;
    return { layer: "background", fill: { color: a, ratio: i.ratio ?? 0 }, inkColor: l.color, ...l.outline ? { inkOutline: true } : {}, ariaSummary: f };
  }
}
function Fe(e, t) {
  return t <= 1 ? "circle" : e <= 0 ? "triangleDown" : e >= t - 1 ? "triangleUp" : "circle";
}
class ee {
  constructor() {
    this.kind = "icon";
  }
  encode(t, n, r) {
    const o = t.encode, i = t.datum;
    if (i.value === void 0) return { layer: "decorator", inkColor: T, ariaSummary: "값 없음" };
    const s = i.bandCount ?? o.steps ?? 3, a = i.bandIndex ?? 0, c = Fe(a, s), l = A(n.rampFrom("graphite"), Math.max(2, s)), f = l[Math.min(l.length - 1, a)] ?? l[0], d = `cf-icon-${a}-of-${s}`, u = a <= 0 ? "하위" : a >= s - 1 ? "상위" : "중간", p = `값 ${O(i.value)}, ${u} 구간 ${a + 1}/${s} (${c})`;
    return { layer: "decorator", glyph: { role: d, tint: f, shape: c }, inkColor: f, ariaSummary: p };
  }
}
class te {
  constructor() {
    this.kind = "sparkline";
  }
  encode(t, n, r) {
    const o = t.encode, i = t.datum;
    return { layer: "decorator", inkColor: "#111111", ariaSummary: `인셀 ${o.chart ?? "line"} 스파크, 값 ${O(i.value)}` };
  }
}
function ne() {
  const e = new S({ spi: { name: "CFEncoder", version: "1" } });
  return e.register("bar", new Q(), { origin: "builtin" }), e.register("scale", new Z(), { origin: "builtin" }), e.register("icon", new ee(), { origin: "builtin" }), e.register("sparkline", new te(), { origin: "builtin" }), e;
}
function Ne() {
  return new S({ spi: { name: "CFNamedStyle", version: "1" } });
}
function I(e) {
  return typeof e == "object" && e !== null;
}
class Oe {
  load(t, n) {
    const r = [], o = [], i = Array.isArray(t) ? t : I(t) && Array.isArray(t.rules) ? t.rules : [];
    for (const s of i) {
      if (!I(s)) {
        o.push({ ruleId: "?", reason: "malformed", detail: "not an object" });
        continue;
      }
      const a = typeof s.id == "string" ? s.id : "?", c = s.when, l = s.encode, f = s.scope;
      if (typeof s.v == "number" && s.v > M) {
        o.push({ ruleId: a, reason: "future-version", detail: `v${s.v} > ${M}` });
        continue;
      }
      if (!I(c) || typeof c.type != "string" || !I(l) || typeof l.kind != "string" || !I(f) || typeof f.columnId != "string") {
        o.push({ ruleId: a, reason: "malformed", detail: "missing when/encode/scope" });
        continue;
      }
      if (!n.types.has(c.type)) {
        o.push({ ruleId: a, reason: "unknown-condition", detail: String(c.type) });
        continue;
      }
      if (!n.encoders.has(l.kind)) {
        o.push({ ruleId: a, reason: "unknown-encoder", detail: String(l.kind) });
        continue;
      }
      const d = s.style;
      if (B(d) && !n.styles.has(d.ref)) {
        o.push({ ruleId: a, reason: "unknown-style", detail: d.ref });
        continue;
      }
      r.push(s);
    }
    return { rules: r, skipped: o };
  }
}
function Se(e) {
  return JSON.stringify({ v: M, rules: e });
}
class $e {
  constructor(t = []) {
    this.byColumn = /* @__PURE__ */ new Map(), this.all = [];
    for (const n of t) this.add(n);
  }
  add(t) {
    this.all.push(t);
    const n = this.byColumn.get(t.scope.columnId) ?? [];
    n.push(t), this.byColumn.set(t.scope.columnId, n);
  }
  rulesFor(t) {
    return this.byColumn.get(t) ?? [];
  }
  list() {
    return this.all;
  }
}
class De {
  constructor(t, n = ne(), r = j(), o) {
    this.rules = t, this.encoders = n, this.ruleTypes = r, this.evaluator = o ?? new G(r);
  }
  get lineage() {
    return this;
  }
  paintFor(t, n, r, o, i) {
    const s = this.evaluator.evaluate(this.rules.rulesFor(t.columnId), t, n, i), a = [];
    if (s.background) {
      const c = this.encoders.get(s.background.encode.kind);
      c && a.push(c.encode(s.background, r, o));
    }
    for (const c of s.decorators) {
      const l = this.encoders.get(c.encode.kind);
      l && a.push(l.encode(c, r, o));
    }
    return a;
  }
  statsNeedsFor(t) {
    const n = /* @__PURE__ */ new Set();
    for (const r of this.rules.rulesFor(t)) {
      const o = this.ruleTypes.get(r.when.type);
      if (o) for (const i of o.needs) n.add(i);
    }
    return [...n].sort();
  }
  explain(t, n, r, o) {
    const i = this.evaluator.evaluate(n, t, r, o), s = [];
    i.background && s.push(i.background.lineage);
    for (const a of i.decorators) s.push(a.lineage);
    return s.sort((a, c) => a.priority - c.priority);
  }
}
export {
  P as AA_BODY,
  Y as BUILTIN_PREDICATES,
  Q as BarEncoder,
  De as CFEngine,
  $e as CFRuleStore,
  M as CF_SCHEMA_VERSION,
  G as DefaultCFEvaluator,
  Oe as DefaultCFRuleLoader,
  J as DefaultInkResolver,
  ee as IconEncoder,
  $ as NEUTRAL_MIDPOINT,
  Z as ScaleEncoder,
  te as SparklineEncoder,
  ie as cfRuleEquals,
  ae as computeColumnStats,
  U as computeDatum,
  ne as createEncoderRegistry,
  Ne as createNamedStyleRegistry,
  j as createRuleTypeRegistry,
  H as divergingBands,
  E as divergingColor,
  B as isStyleRef,
  Ce as passesInkGate,
  L as scopeMatches,
  A as sequentialBands,
  R as sequentialColor,
  Se as serializeRules,
  q as snapshotStats,
  oe as staticAppearanceView
};
//# sourceMappingURL=index-DrCPRuYi.js.map
