import { b, t as C } from "./OpenGrid-CeUdO_fM.js";
import { D, I, L, O, S, i, l, r, s } from "./OpenGrid-CeUdO_fM.js";
class T {
  constructor(t, e, o, r2 = {}) {
    this._left = t, this._right = e;
    const s2 = document.createElement("div");
    s2.className = "og-shuttle", s2.style.cssText = `display:flex;gap:6px;align-items:center;justify-content:center;flex-direction:${r2.layout === "horizontal" ? "row" : "column"};`;
    const c = (d, h, g) => {
      const n = document.createElement("button");
      return n.type = "button", n.className = "og-shuttle-btn", n.textContent = d, n.title = h, n.style.cssText = "min-width:34px;height:30px;padding:0 8px;border:1px solid #bbb;border-radius:7px;background:#fff;cursor:pointer;font-size:14px;color:#444;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.06);", n.addEventListener("mouseover", () => {
        n.style.background = "#f0f6ff", n.style.borderColor = "#1976d2";
      }), n.addEventListener("mouseout", () => {
        n.style.background = "#fff", n.style.borderColor = "#bbb";
      }), n.addEventListener("click", g), n;
    }, _ = r2.labels ?? {}, p = (d) => this._left.t(d);
    s2.appendChild(c(_.toRight ?? "▶", p("shuttle.toRight"), () => {
      this._left.moveCheckedTo(this._right);
    })), s2.appendChild(c(_.toLeft ?? "◀", p("shuttle.toLeft"), () => {
      this._right.moveCheckedTo(this._left);
    })), r2.includeAll && (s2.appendChild(c(_.allRight ?? "⏩", p("shuttle.allRight"), () => {
      this._moveAll(this._left, this._right);
    })), s2.appendChild(c(_.allLeft ?? "⏪", p("shuttle.allLeft"), () => {
      this._moveAll(this._right, this._left);
    }))), o.appendChild(s2), this._el = s2;
  }
  _moveAll(t, e) {
    const o = t.getData().length;
    o > 0 && t.moveRowsTo(e, Array.from({ length: o }, (r2, s2) => s2));
  }
  destroy() {
    this._el.remove();
  }
}
function v(E, t, e, o) {
  return new T(E, t, e, o);
}
class N {
  constructor(t, e) {
    this._data = [], this._roots = [], this._expandedKeys = /* @__PURE__ */ new Set(), this._selectedId = null, this._container = typeof t == "string" ? document.querySelector(t) : t, this._opts = { nodeWidth: 160, nodeHeight: 72, levelGap: 52, siblingGap: 20, expandOnLoad: true, onNodeClick: () => {
    }, ...e }, this._container.classList.add("og-orgchart");
  }
  setData(t) {
    this._data = t;
    const { idField: e, parentIdField: o, expandOnLoad: r2 } = this._opts;
    r2 && this._expandedKeys.size === 0 && t.forEach((s2) => this._expandedKeys.add(s2[e])), this._roots = b(t, { idField: e, parentIdField: o }, this._expandedKeys), this._render();
  }
  setTheme(t) {
    this._container.setAttribute("data-og-theme", t);
  }
  setSkin(t) {
    this._container.setAttribute("data-og-skin", t);
  }
  expandAll() {
    const t = (e) => {
      for (const o of e) this._expandedKeys.add(o._treeId), o.children.length && t(o.children);
    };
    t(this._roots), this._rebuild();
  }
  collapseAll() {
    this._expandedKeys.clear(), this._rebuild();
  }
  _toggle(t) {
    this._expandedKeys.has(t) ? this._expandedKeys.delete(t) : this._expandedKeys.add(t), this._rebuild();
  }
  _rebuild() {
    const { idField: t, parentIdField: e } = this._opts;
    this._roots = b(this._data, { idField: t, parentIdField: e }, this._expandedKeys), this._render();
  }
  _calcLayout() {
    const { nodeWidth: t, nodeHeight: e, levelGap: o, siblingGap: r2 } = this._opts, s2 = /* @__PURE__ */ new Map();
    let c = 0;
    const _ = (h) => {
      const g = h._depth * (e + o), n = h._expanded ? h.children : [];
      if (!n.length) {
        const f = c;
        return c += t + r2, s2.set(h._treeId, { x: f, y: g }), { minX: f, maxX: f };
      }
      let i2 = 1 / 0, u = -1 / 0;
      for (const f of n) {
        const { minX: a, maxX: m } = _(f);
        a < i2 && (i2 = a), m > u && (u = m);
      }
      const l2 = i2 + (u - i2 + t) / 2 - t / 2;
      return s2.set(h._treeId, { x: l2, y: g }), { minX: i2, maxX: u };
    };
    for (const h of this._roots) _(h);
    let p = 0, d = 0;
    for (const { x: h, y: g } of s2.values()) h + t > p && (p = h + t), g + e > d && (d = g + e);
    return { layout: s2, totalW: p + r2, totalH: d + o + 16 };
  }
  _line(t, e, o, r2, s2) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "line");
    c.setAttribute("x1", String(e)), c.setAttribute("y1", String(o)), c.setAttribute("x2", String(r2)), c.setAttribute("y2", String(s2)), c.setAttribute("class", "og-orgchart-line"), t.appendChild(c);
  }
  _render() {
    const { nodeWidth: t, nodeHeight: e, levelGap: o, columns: r2 } = this._opts, { layout: s2, totalW: c, totalH: _ } = this._calcLayout();
    this._container.innerHTML = "";
    const p = document.createElement("div");
    p.className = "og-orgchart-wrap", p.style.cssText = `width:${c}px;height:${_}px;`;
    const d = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    d.setAttribute("width", String(c)), d.setAttribute("height", String(_)), d.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;overflow:visible;";
    const h = (n) => {
      for (const i2 of n) {
        if (!i2._expanded || !i2.children.length) continue;
        const u = s2.get(i2._treeId), l2 = u.x + t / 2, f = u.y + e, a = f + o / 2, m = i2.children;
        if (this._line(d, l2, f, l2, a), m.length > 1) {
          const x = s2.get(m[0]._treeId), y = s2.get(m[m.length - 1]._treeId);
          this._line(d, x.x + t / 2, a, y.x + t / 2, a);
        }
        for (const x of m) {
          const y = s2.get(x._treeId), A = y.x + t / 2;
          this._line(d, A, a, A, y.y);
        }
        h(m);
      }
    };
    h(this._roots), p.appendChild(d);
    const g = (n) => {
      for (const i2 of n) {
        const u = s2.get(i2._treeId);
        if (!u) continue;
        const l2 = document.createElement("div");
        l2.className = "og-orgchart-node", i2._hasChildren && l2.classList.add("og-orgchart-node--branch"), i2._expanded && l2.classList.add("og-orgchart-node--expanded"), this._selectedId === i2._treeId && l2.classList.add("og-orgchart-node--selected"), l2.style.cssText = `left:${u.x}px;top:${u.y}px;width:${t}px;height:${e}px;`;
        const f = document.createElement("div");
        f.className = "og-orgchart-node-content";
        for (const a of r2) {
          const m = i2.data[a.field], x = document.createElement("div");
          if (x.className = "og-orgchart-col" + (a.className ? " " + a.className : ""), a.style) {
            const y = typeof a.style == "function" ? a.style(m, i2.data) : a.style;
            x.setAttribute("style", y);
          }
          if (a.renderer) {
            const y = a.renderer(m, i2.data);
            typeof y == "string" ? x.innerHTML = y : x.appendChild(y);
          } else x.textContent = m ?? "";
          f.appendChild(x);
        }
        if (l2.appendChild(f), i2._hasChildren) {
          const a = document.createElement("button");
          a.type = "button", a.className = "og-orgchart-toggle", a.setAttribute("aria-expanded", i2._expanded ? "true" : "false"), a.setAttribute("aria-label", C(i2._expanded ? "tree.collapse" : "tree.expand"));
          const m = document.createElement("i");
          m.setAttribute("aria-hidden", "true"), m.className = i2._expanded ? "bi bi-dash-circle" : "bi bi-plus-circle", a.appendChild(m), a.addEventListener("click", (x) => {
            x.stopPropagation(), this._toggle(i2._treeId);
          }), l2.appendChild(a);
        }
        l2.addEventListener("click", () => {
          this._selectedId = i2._treeId, this._opts.onNodeClick(i2._treeId, i2.data), this._container.querySelectorAll(".og-orgchart-node--selected").forEach((a) => a.classList.remove("og-orgchart-node--selected")), l2.classList.add("og-orgchart-node--selected");
        }), p.appendChild(l2), i2._expanded && i2.children.length && g(i2.children);
      }
    };
    g(this._roots), this._container.appendChild(p);
  }
}
class I2 {
  static parse(t, e = {}) {
    var _a, _b, _c;
    const { fieldMap: o = {}, trim: r2 = true } = e, c = new DOMParser().parseFromString(t.trim(), "text/xml"), _ = c.querySelector("parsererror");
    if (_) throw new Error(`XML 파싱 오류: ${(_a = _.textContent) == null ? void 0 : _a.trim()}`);
    const p = c.documentElement;
    let d = e.rowTag;
    d || (d = ((_c = (_b = e.rootTag ? c.querySelector(e.rootTag) : p) == null ? void 0 : _b.children[0]) == null ? void 0 : _c.tagName) ?? "row");
    const h = c.getElementsByTagName(d), g = [];
    for (let n = 0; n < h.length; n++) {
      const i2 = h[n], u = {};
      for (const l2 of Array.from(i2.attributes)) {
        const f = o[l2.name] ?? l2.name;
        u[f] = r2 ? l2.value.trim() : l2.value;
      }
      for (const l2 of Array.from(i2.children)) {
        const f = o[l2.tagName] ?? l2.tagName, a = l2.textContent ?? "";
        u[f] = r2 ? a.trim() : a;
      }
      g.push(u);
    }
    return g;
  }
  static stringify(t, e = {}) {
    const { rootTag: o = "rows", rowTag: r2 = "row", mode: s2 = "element", fieldMap: c = {}, declaration: _ = true, indent: p = 2, nullAs: d = "", excludeFields: h = [] } = e, g = " ".repeat(p), n = [];
    _ && n.push('<?xml version="1.0" encoding="UTF-8"?>'), n.push(`<${o}>`);
    for (const i2 of t) {
      const u = Object.entries(i2).filter(([l2]) => !h.includes(l2));
      if (s2 === "attribute") {
        const l2 = u.map(([f, a]) => {
          const m = c[f] ?? f, x = a == null ? d : String(a);
          return `${m}="${this._escAttr(x)}"`;
        }).join(" ");
        n.push(`${g}<${r2}${l2 ? " " + l2 : ""} />`);
      } else {
        n.push(`${g}<${r2}>`);
        for (const [l2, f] of u) {
          const a = c[l2] ?? l2, m = f == null ? d : String(f);
          n.push(`${g}${g}<${a}>${this._escText(m)}</${a}>`);
        }
        n.push(`${g}</${r2}>`);
      }
    }
    return n.push(`</${o}>`), n.join(`
`);
  }
  static parseSap(t) {
    var _a, _b, _c, _d;
    const o = new DOMParser().parseFromString(t.trim(), "text/xml"), r2 = { header: {}, items: [], returns: [], raw: o }, s2 = o.getElementsByTagName("DOCUMENTHEADER")[0];
    if (s2) for (const p of Array.from(s2.children)) r2.header[p.tagName] = ((_a = p.textContent) == null ? void 0 : _a.trim()) ?? "";
    const c = o.getElementsByTagName("RETURN");
    for (const p of Array.from(c)) {
      const d = {};
      for (const h of Array.from(p.children)) d[h.tagName] = ((_b = h.textContent) == null ? void 0 : _b.trim()) ?? "";
      r2.returns.push(d);
    }
    const _ = ["ACCOUNTGL", "ACCOUNTRECEIVABLE", "ACCOUNTPAYABLE", "ITEMS"];
    for (const p of _) {
      const d = o.getElementsByTagName(p)[0];
      if (!d) continue;
      const h = d.getElementsByTagName("ITEM"), g = h.length > 0 ? Array.from(h) : [d];
      for (const n of g) {
        const i2 = {};
        for (const u of Array.from(n.children)) i2[u.tagName] = ((_c = u.textContent) == null ? void 0 : _c.trim()) ?? "";
        r2.items.push(i2);
      }
      break;
    }
    if (r2.items.length === 0) {
      const p = o.documentElement, d = Array.from(p.children).filter((h) => h.hasAttribute("SEGMENT"));
      for (const h of d) {
        if (h.tagName === "EDI_DC40") continue;
        const g = {};
        for (const n of Array.from(h.children)) g[n.tagName] = ((_d = n.textContent) == null ? void 0 : _d.trim()) ?? "";
        Object.keys(g).length > 0 && r2.items.push(g);
      }
    }
    return r2;
  }
  static stringifySap(t) {
    const e = ['<?xml version="1.0" encoding="UTF-8"?>', "<BAPI_CALL>"];
    if (t.BAPI_FUNCTION && e.push(`  <FUNCTION>${this._escText(t.BAPI_FUNCTION)}</FUNCTION>`), t.DOCUMENTHEADER && typeof t.DOCUMENTHEADER == "object") {
      e.push("  <DOCUMENTHEADER>");
      for (const [r2, s2] of Object.entries(t.DOCUMENTHEADER)) s2 != null && s2 !== "" && e.push(`    <${r2}>${this._escText(String(s2))}</${r2}>`);
      e.push("  </DOCUMENTHEADER>");
    }
    const o = Object.keys(t).find((r2) => Array.isArray(t[r2]) && !r2.startsWith("_"));
    if (o) {
      e.push(`  <${o}>`);
      for (const r2 of t[o]) {
        e.push("    <ITEM>");
        for (const [s2, c] of Object.entries(r2)) c != null && c !== "" && !s2.startsWith("_") && e.push(`      <${s2}>${this._escText(String(c))}</${s2}>`);
        e.push("    </ITEM>");
      }
      e.push(`  </${o}>`);
    }
    return e.push("</BAPI_CALL>"), e.join(`
`);
  }
  static stringifySapBatch(t) {
    const e = ['<?xml version="1.0" encoding="UTF-8"?>', `<BAPI_BATCH total="${t.documents.length}">`];
    return t.documents.forEach((o, r2) => {
      e.push(`  <BAPI_CALL seq="${r2 + 1}">`);
      const s2 = this.stringifySap(o).split(`
`).filter((c) => !c.startsWith("<?xml")).map((c) => "    " + c).join(`
`);
      e.push(s2), e.push("  </BAPI_CALL>");
    }), e.push("</BAPI_BATCH>"), e.join(`
`);
  }
  static _escText(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escAttr(t) {
    return this._escText(t).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
}
export {
  D as DEFAULT_ICON_ROLES,
  T as GridShuttle,
  I as IconRegistry,
  L as LocaleRegistry,
  O as OpenGrid,
  N as OrgChart,
  S as SkinRegistry,
  I2 as XmlConverter,
  v as createGridShuttle,
  i as iconRegistry,
  l as localeRegistry,
  r as renderIcon,
  s as skinRegistry,
  C as t
};
//# sourceMappingURL=open-grid.js.map
