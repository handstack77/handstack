const a = (h) => {
  const e = globalThis.requestAnimationFrame;
  if (typeof e == "function") {
    const i = e(() => h()), o = globalThis.cancelAnimationFrame;
    return { cancel: () => o == null ? void 0 : o(i) };
  }
  const s = setTimeout(h, 16);
  return { cancel: () => clearTimeout(s) };
};
class c {
  constructor(e) {
    this._cells = /* @__PURE__ */ new Map(), this._upserts = /* @__PURE__ */ new Map(), this._removes = /* @__PURE__ */ new Set(), this._coalesced = 0, this._dropped = 0, this._disposed = false, this._cfg = e;
  }
  enqueue(e) {
    if (!this._disposed) {
      if (e.kind === "snapshot") {
        this._dropped += this._cells.size + this._upserts.size + this._removes.size, this._cells.clear(), this._upserts.clear(), this._removes.clear(), this._snapshot = e, this._scheduleFrame();
        return;
      }
      this._mergeDelta(e), this._scheduleFrame();
    }
  }
  _mergeDelta(e) {
    if (e.removes) for (const s of e.removes) {
      this._removes.add(s), this._upserts.delete(s);
      for (const i of this._cells.keys()) i.slice(0, i.indexOf("\0")) === s && this._cells.delete(i);
    }
    if (e.upserts) for (const s of e.upserts) {
      if (this._removes.has(s.rowId)) continue;
      const i = this._upserts.get(s.rowId);
      i && this._coalesced++, this._upserts.set(s.rowId, { ...i ?? {}, ...s.row });
    }
    if (e.cells) for (const s of e.cells) {
      if (this._removes.has(s.rowId)) continue;
      const i = s.rowId + "\0" + s.field;
      this._cells.has(i) && this._coalesced++, this._cells.set(i, { rowId: s.rowId, field: s.field, value: s.value });
    }
  }
  _scheduleFrame() {
    this._frame || (this._frame = this._cfg.scheduleFrame(() => {
      this._frame = void 0, this._flushFrame();
    }));
  }
  _flushFrame() {
    if (this._disposed) return;
    if (this._snapshot) {
      const r = this._snapshot;
      this._snapshot = void 0, this._cfg.flush({ cells: [], upserts: [], removes: [], snapshot: r, overflowToNextFrame: false });
      return;
    }
    const e = this._cfg.maxBatchPerFrame ?? 0, s = [];
    let i = false;
    for (const [r, n] of this._cells) {
      if (e > 0 && s.length >= e) {
        i = true;
        break;
      }
      s.push(n), this._cells.delete(r);
    }
    const o = [...this._upserts.entries()].map(([r, n]) => ({ rowId: r, row: n })), t = [...this._removes];
    this._upserts.clear(), this._removes.clear(), !(s.length === 0 && o.length === 0 && t.length === 0) && (this._cfg.flush({ cells: s.map((r) => ({ rowId: r.rowId, field: r.field, value: r.value })), upserts: o, removes: t, overflowToNextFrame: i }), (i || this._cells.size > 0) && this._scheduleFrame());
  }
  get stats() {
    return { pending: this._cells.size + this._upserts.size + this._removes.size, coalesced: this._coalesced, dropped: this._dropped };
  }
  dispose() {
    var _a;
    this._disposed = true, (_a = this._frame) == null ? void 0 : _a.cancel(), this._frame = void 0, this._cells.clear(), this._upserts.clear(), this._removes.clear(), this._snapshot = void 0;
  }
}
class d {
  constructor(e) {
    this.spi = "command", this.kind = "rt.apply", this.label = "rt.backgroundUpdate", this._at = 0, this._cellInverse = [], this._insertedRowIds = [], this._removedInverse = [], this._batch = e, this.footprint = d._footprintOf(e);
  }
  get appliedDelta() {
    return this._applied;
  }
  do(e) {
    this._at = e.clock.now(), this._cellInverse = [], this._insertedRowIds = [], this._removedInverse = [];
    const s = [];
    e.mutation.beginBatch();
    try {
      const i = [];
      for (const t of this._batch.cells) {
        const r = e.coords.indexOf(t.rowId);
        r < 0 || (this._cellInverse.push({ rowId: t.rowId, field: t.field, oldValue: e.coords.getCellValue(t.rowId, t.field) }), i.push({ rowIndex: r, field: t.field, value: t.value }), s.push({ rowId: t.rowId, field: t.field }));
      }
      i.length > 0 && e.mutation.writeCells(i);
      for (const t of this._batch.upserts) {
        const r = e.coords.indexOf(t.rowId);
        if (r >= 0) {
          const n = [];
          for (const [l, _] of Object.entries(t.row)) this._cellInverse.push({ rowId: t.rowId, field: l, oldValue: e.coords.getCellValue(t.rowId, l) }), n.push({ rowIndex: r, field: l, value: _ }), s.push({ rowId: t.rowId, field: l });
          n.length > 0 && e.mutation.writeCells(n);
        } else e.mutation.insertRow(t.row, "last"), this._insertedRowIds.push(t.rowId);
      }
      const o = [];
      for (const t of this._batch.removes) {
        const r = e.coords.indexOf(t);
        r < 0 || (this._removedInverse.push({ rowId: t, snapshot: e.coords.getRowSnapshot(t) }), o.push({ rowId: t, index: r }));
      }
      o.length > 0 && e.mutation.deleteRows(o.sort((t, r) => r.index - t.index).map((t) => t.index)), this._applied = { changedCells: s, insertedRowIds: [...this._insertedRowIds], removedRowIds: this._removedInverse.map((t) => t.rowId), userInitiated: false };
    } finally {
      e.mutation.endBatch();
    }
  }
  undo(e) {
    e.mutation.beginBatch();
    try {
      const s = this._insertedRowIds.map((o) => e.coords.indexOf(o)).filter((o) => o >= 0).sort((o, t) => t - o);
      s.length > 0 && e.mutation.deleteRows(s);
      for (const o of this._removedInverse) o.snapshot && e.mutation.insertRow(o.snapshot, "last");
      const i = [];
      for (const o of this._cellInverse) {
        const t = e.coords.indexOf(o.rowId);
        t >= 0 && i.push({ rowIndex: t, field: o.field, value: o.oldValue });
      }
      i.length > 0 && e.mutation.writeCells(i);
    } finally {
      e.mutation.endBatch();
    }
  }
  serialize() {
    return { kind: this.kind, payload: { cells: this._batch.cells, upserts: this._batch.upserts, removes: this._batch.removes }, at: this._at };
  }
  static _footprintOf(e) {
    if (e.snapshot || e.upserts.length > 0 || e.removes.length > 0) return { scope: "structure" };
    const s = [...new Set(e.cells.map((o) => o.rowId))], i = [...new Set(e.cells.map((o) => o.field))];
    return s.length === 1 && i.length === 1 ? { scope: "cell", rowId: s[0], field: i[0] } : { scope: "range", rowIds: s, fields: i };
  }
}
class u {
  constructor(e, s) {
    this._statusListeners = /* @__PURE__ */ new Set(), this._attached = false, this._source = e, this._deps = s, this._now = s.now ?? (() => Date.now()), this._connection = e.status, this._scheduler = new c({ ...s.maxBatchPerFrame !== void 0 ? { maxBatchPerFrame: s.maxBatchPerFrame } : {}, scheduleFrame: s.scheduleFrame ?? a, flush: (i) => this._applyBatch(i) });
  }
  attach() {
    this._attached || (this._attached = true, this._offData = this._source.onData((e) => this._onData(e)), this._offStatus = this._source.onStatus((e) => this._onStatus(e)), this._source.start());
  }
  detach() {
    var _a, _b;
    this._attached && (this._attached = false, (_a = this._offData) == null ? void 0 : _a.call(this), (_b = this._offStatus) == null ? void 0 : _b.call(this), this._offData = void 0, this._offStatus = void 0, this._source.stop(), this._scheduler.dispose());
  }
  get connection() {
    return this._connection;
  }
  get backpressureStats() {
    return this._scheduler.stats;
  }
  onConnection(e) {
    return this._statusListeners.add(e), () => this._statusListeners.delete(e);
  }
  _onData(e) {
    this._deps.freshness.markReceived(e.serverTime ?? this._now()), this._scheduler.enqueue(e);
  }
  _onStatus(e) {
    this._connection = e, this._deps.announce.onConnection(e.status), this._deps.freshness.tick();
    for (const s of this._statusListeners) s(e);
  }
  _applyBatch(e) {
    const s = this._deps.stateGuard.capture();
    if (e.snapshot) {
      if (this._deps.applySnapshot) {
        this._deps.applySnapshot(e.snapshot.rows);
        const t = { changedCells: [], insertedRowIds: [], removedRowIds: [], userInitiated: false };
        this._deps.stateGuard.restore(s, t), this._deps.announce.onBackgroundChange(t);
      } else console.warn("[open-grid/realtime] snapshot received but no applySnapshot dep wired — skipped");
      return;
    }
    const i = new d(e);
    this._deps.sink.beginBatch();
    try {
      this._deps.sink.dispatchSilent(i);
    } finally {
      this._deps.sink.endBatch();
    }
    const o = i.appliedDelta;
    if (o && (this._deps.stateGuard.restore(s, o), this._deps.announce.onBackgroundChange(o), this._deps.chart)) {
      const t = [.../* @__PURE__ */ new Set([...o.changedCells.map((r) => r.rowId), ...o.insertedRowIds, ...o.removedRowIds])];
      t.length > 0 && this._deps.chart.markDirty(t);
    }
  }
}
class f {
  constructor(e, s) {
    this._lastConflicts = [], this._src = e, this._coords = s;
  }
  get lastConflicts() {
    return this._lastConflicts;
  }
  capture() {
    const e = this._src.readEditing();
    return { selection: this._src.readSelection(), scroll: this._src.readScroll(), ...e ? { editing: e } : {}, sortFilterSig: this._src.readSortFilterSig() };
  }
  restore(e, s) {
    this._lastConflicts = [];
    const i = new Set(s.removedRowIds), o = e.selection.filter((t) => !i.has(t.rowId) && this._coords.rowIdToIndex(t.rowId) >= 0);
    this._src.writeSelection(o), e.scroll.anchorRowId && (i.has(e.scroll.anchorRowId) || this._coords.rowIdToIndex(e.scroll.anchorRowId) < 0) ? this._src.writeScroll({ pixelWithinRow: 0, scrollLeft: e.scroll.scrollLeft }) : this._src.writeScroll(e.scroll), e.editing && (!i.has(e.editing.rowId) && this._coords.rowIdToIndex(e.editing.rowId) >= 0 ? (s.changedCells.some((n) => n.rowId === e.editing.rowId && n.field === e.editing.field) && this._lastConflicts.push({ rowId: e.editing.rowId, field: e.editing.field }), this._src.writeEditing(e.editing)) : this._src.writeEditing(void 0));
  }
}
class p {
  constructor(e) {
    this._lastState = "stale", this._listeners = /* @__PURE__ */ new Set(), this._staleAfterMs = e.staleAfterMs, this._now = e.now ?? (() => Date.now());
  }
  markReceived(e) {
    this._lastReceivedAt = e, this._emitIfChanged();
  }
  compute() {
    const e = this._now();
    if (this._lastReceivedAt === void 0) return { state: "stale", ageMs: 1 / 0 };
    const s = e - this._lastReceivedAt;
    return { state: s > this._staleAfterMs ? "stale" : "fresh", ageMs: s, lastReceivedAt: this._lastReceivedAt };
  }
  tick() {
    return this._emitIfChanged();
  }
  _emitIfChanged() {
    const e = this.compute();
    if (e.state !== this._lastState) {
      this._lastState = e.state;
      for (const s of this._listeners) s(e);
    }
    return e;
  }
  onChange(e) {
    return this._listeners.add(e), () => this._listeners.delete(e);
  }
}
class w {
  constructor(e) {
    this._pendingCells = /* @__PURE__ */ new Set(), this._pendingRows = /* @__PURE__ */ new Set(), this._announce = e.announce, this._debounceMs = e.debounceMs ?? 500, this._schedule = e.schedule ?? ((s, i) => {
      const o = setTimeout(s, i);
      return { cancel: () => clearTimeout(o) };
    });
  }
  onBackgroundChange(e) {
    for (const s of e.changedCells) this._pendingCells.add(s.rowId + " " + s.field), this._pendingRows.add(s.rowId);
    for (const s of e.insertedRowIds) this._pendingRows.add(s);
    for (const s of e.removedRowIds) this._pendingRows.add(s);
    this._arm();
  }
  _arm() {
    this._timer || (this._timer = this._schedule(() => {
      this._timer = void 0, this._flush();
    }, this._debounceMs));
  }
  _flush() {
    this._pendingCells.size === 0 && this._pendingRows.size === 0 || (this._announce({ kind: "background-update", changedCount: this._pendingCells.size, rowCount: this._pendingRows.size, label: "background", interruptsFocus: false }), this._pendingCells.clear(), this._pendingRows.clear());
  }
  onConnection(e) {
    this._announce({ kind: "connection", changedCount: 0, rowCount: 0, label: "connection", interruptsFocus: false, connectionStatus: e });
  }
  dispose() {
    var _a;
    (_a = this._timer) == null ? void 0 : _a.cancel(), this._timer = void 0, this._pendingCells.clear(), this._pendingRows.clear();
  }
}
export {
  c as BackpressureScheduler,
  p as FreshnessClock,
  f as LiveStateGuard,
  u as RealtimeController,
  w as RtAnnouncePolicy,
  d as RtApplyCommand,
  a as defaultFrameScheduler
};
//# sourceMappingURL=index-DnarQ4eR.js.map
