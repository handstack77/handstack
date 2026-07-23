/*!
 * syn.$bind - Proxy 기반 양방향 데이터 바인딩
 *
 * 순수 객체({}) 및 평면 객체 배열([{}, {}, ...]) 형태의 데이터를 Proxy로 감싸서
 * 프로퍼티 값 변경/재할당, 배열 push·pop·splice·정렬, 배열 인덱스 직접 교체,
 * 배열 내 객체 값 변경을 표준 JS 문법만으로 감지하고 화면에 반영한다.
 *
 * syn.uicontrols.$data가 syn-datafield/syn-options 메타 설정 기반으로 HandStack
 * 전용 컨트롤을 바인딩하는 것과는 별개로, $binding은 syn-bind/syn-bind-list
 * 속성만으로 표준 HTMLElement는 물론 AUIGrid, Handsontable, tail-select,
 * daterangepicker 같은 임의의 커스텀 컨트롤까지 get/set/on/off 4개 함수(어댑터)
 * 구현만으로 가볍게 양방향 연결하고 싶을 때 사용한다. 두 시스템은 서로 다른
 * HTML 속성(syn-datafield vs syn-bind)을 사용하므로 같은 화면에서 함께 써도 충돌하지 않는다.
 *
 * 데이터 변경은 별도 API 없이 표준 JS 문법 그대로 사용한다.
 *   store.data.user.name = '홍길동';            프로퍼티 값 변경
 *   store.data.user = { name: '김철수' };        프로퍼티(객체) 재할당
 *   store.data.items.push({ title: '신규' });    배열 push
 *   store.data.items[2] = { title: '교체' };     배열 인덱스 직접 변경
 *   store.data.items[2].title = '수정';          배열 내 객체 값 변경
 *   store.data.items.splice(1, 1);               배열 splice
 *
 * 사용 예:
 *   <input type="text" syn-bind="value:user.name">
 *   <span syn-bind="text:user.name"></span>
 *
 *   const mounted = syn.$bind.mount(document.body, { user: { name: '홍길동' } });
 *   mounted.store.data.user.name = '김철수'; // 표준 JS 문법으로 값 변경 시 화면 자동 반영
 *   mounted.destroy(); // 바인딩 해제
 *
 * 선언적 바인딩 문법
 *   syn-bind="타입1(인자1):경로1; 타입2(인자2):경로2"
 *   내장 타입: text, html, value, checked, radio, edit, show, hide, disabled, class(이름), attr(이름), style(속성), adapter(어댑터명)
 *
 *   <tbody syn-bind-list="items">
 *     <template>
 *       <tr>
 *         <td><input type="text" syn-bind="value:title"></td>
 *       </tr>
 *     </template>
 *   </tbody>
 *
 * 커스텀 컨트롤 어댑터
 *   syn.$bind.registerAdapter('grid', {
 *       get(el) { return el._grid.getData(); },
 *       set(el, value) { el._grid.setData(value || []); },
 *       on(el, handler) { el._grid.on('change', handler); }
 *   });
 *   <div id="grid" syn-bind="adapter(grid):items"></div>
 */
(function (context) {
    'use strict';

    const $binding = syn.$bind || new syn.module();

    const RAW = Symbol('syn.binding:raw');

    function isObservable(val) {
        const type = context.$object.getType(val);
        return type === 'object' || type === 'array';
    }

    function isArrayIndexKey(obj, key) {
        return Array.isArray(obj) && String(key >>> 0) === key && key !== '';
    }

    function joinPath(base, key, isIndex) {
        if (isIndex) return base + '[' + key + ']';
        return base ? base + '.' + key : String(key);
    }

    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // "items[0].title" -> [{key:'items'}, {key:0,index:true}, {key:'title'}]
    function parsePath(path) {
        const out = [];
        if (!path) return out;
        const re = /([^.\[\]]+)|\[(\d+)\]/g;
        let m;
        while ((m = re.exec(path))) {
            if (m[1] !== undefined) out.push({ key: m[1], index: false });
            else out.push({ key: Number(m[2]), index: true });
        }
        return out;
    }

    function pathMatches(eventPath, subPath, deep) {
        if (subPath === '') return true; // 루트 구독은 모든 변경을 수신(디버깅/전체 감시용)
        if (eventPath === subPath) return true;
        if (!deep) return false;
        return eventPath.indexOf(subPath + '.') === 0 || eventPath.indexOf(subPath + '[') === 0;
    }

    class Store {
        constructor(rootData) {
            this._listeners = [];
            this._proxyCache = new WeakMap();
            this._batching = false;
            this._pending = [];
            this.data = this._wrap(rootData, '');
        }

        // target을 감싸는 Proxy를 생성(또는 캐시에서 재사용)한다.
        _wrap(target, path) {
            if (!isObservable(target)) return target;
            const cached = this._proxyCache.get(target);
            if (cached) return cached;

            const self = this;
            const handler = {
                get(obj, key) {
                    if (key === RAW) return obj;
                    if (typeof key === 'symbol') return obj[key];
                    const val = obj[key];
                    if (typeof val === 'function') return val; // 배열 메서드 등: 호출 시 this는 호출부에서 proxy로 바인딩되므로 push/pop/splice가 자연스럽게 트랩을 통과한다
                    if (isObservable(val)) {
                        const childPath = joinPath(path, key, isArrayIndexKey(obj, key));
                        return self._wrap(val, childPath);
                    }
                    return val;
                },
                set(obj, key, value) {
                    if (typeof key === 'symbol') { obj[key] = value; return true; }

                    if (key === 'length') {
                        const oldLen = obj.length;
                        obj.length = value;
                        self._emit({ path: path, type: 'length', key: key, value: value, oldValue: oldLen });
                        return true;
                    }

                    const isIndex = isArrayIndexKey(obj, key);
                    const hadKey = Array.isArray(obj) ? Number(key) < obj.length : Object.prototype.hasOwnProperty.call(obj, key);
                    const oldValue = obj[key];
                    const rawValue = (value !== null && typeof value === 'object' && value[RAW] !== undefined) ? value[RAW] : value;

                    obj[key] = rawValue;

                    const childPath = joinPath(path, key, isIndex);
                    const notifyValue = isObservable(rawValue) ? self._wrap(rawValue, childPath) : rawValue;
                    self._emit({
                        path: childPath,
                        type: hadKey ? 'set' : 'add',
                        key: key,
                        value: notifyValue,
                        oldValue: oldValue,
                        parentPath: path
                    });
                    return true;
                },
                deleteProperty(obj, key) {
                    if (typeof key === 'symbol') { delete obj[key]; return true; }
                    const isIndex = isArrayIndexKey(obj, key);
                    const oldValue = obj[key];
                    delete obj[key];
                    const childPath = joinPath(path, key, isIndex);
                    self._emit({ path: childPath, type: 'delete', key: key, value: undefined, oldValue: oldValue, parentPath: path });
                    return true;
                }
            };

            const proxy = new Proxy(target, handler);
            this._proxyCache.set(target, proxy);
            return proxy;
        }

        _emit(event) {
            if (this._batching) { this._pending.push(event); return; }
            this._dispatch([event]);
        }

        _dispatch(events) {
            const listeners = this._listeners.slice();
            for (let i = 0; i < listeners.length; i++) {
                const listener = listeners[i];
                for (let j = 0; j < events.length; j++) {
                    const ev = events[j];
                    if (pathMatches(ev.path, listener.path, listener.deep)) {
                        try {
                            listener.cb(ev);
                        } catch (e) {
                            syn.$l.eventLog('$bind.dispatch', `"${listener.path}" 경로 구독자 처리 중 오류가 발생했습니다: ${e && e.message ? e.message : e}`, 'Error', e);
                        }
                    }
                }
            }
        }

        // path의 변경을 구독한다. opts.deep=true면 하위 경로 변경도 함께 수신한다.
        // 반환값: 구독 해제 함수
        subscribe(path, cb, opts) {
            const listener = { path: path, cb: cb, deep: !!(opts && opts.deep) };
            const listeners = this._listeners;
            listeners.push(listener);
            return function () {
                const idx = listeners.indexOf(listener);
                if (idx >= 0) listeners.splice(idx, 1);
            };
        }

        // 여러 변경을 한 번에 묶어서 통지한다(splice처럼 다중 트랩 호출이 발생하는 연산 최적화용).
        batch(fn) {
            const wasBatching = this._batching;
            this._batching = true;
            try {
                fn();
            } finally {
                if (!wasBatching) {
                    this._batching = false;
                    const events = this._pending;
                    this._pending = [];
                    if (events.length) this._dispatch(events);
                }
            }
        }

        get(path) {
            const segs = parsePath(path);
            let cur = this.data;
            for (let i = 0; i < segs.length; i++) {
                if (cur === null || cur === undefined) return undefined;
                cur = cur[segs[i].key];
            }
            return cur;
        }

        set(path, value) {
            const segs = parsePath(path);
            if (!segs.length) throw new Error('$bind: set()에는 빈 경로를 사용할 수 없습니다.');
            let cur = this.data;
            for (let i = 0; i < segs.length - 1; i++) cur = cur[segs[i].key];
            cur[segs[segs.length - 1].key] = value;
        }

        toRaw() {
            return this.data[RAW];
        }

        scope(basePath) {
            return new ScopedStore(this, basePath);
        }
    }

    class ScopedStore {
        constructor(store, basePath) {
            this.store = store;
            this.basePath = basePath;
        }

        _full(relPath) {
            if (!relPath) return this.basePath;
            if (relPath.charAt(0) === '[') return this.basePath + relPath;
            return this.basePath + '.' + relPath;
        }

        get data() { return this.store.get(this.basePath); }

        get(relPath) { return this.store.get(this._full(relPath)); }
        set(relPath, value) { this.store.set(this._full(relPath), value); }
        subscribe(relPath, cb, opts) { return this.store.subscribe(this._full(relPath), cb, opts); }
        batch(fn) { return this.store.batch(fn); }
        scope(relPath) { return new ScopedStore(this.store, this._full(relPath)); }
    }

    const bindings = {
        text: {
            toDOM(el, v) { el.textContent = v == null ? '' : v; }
        },
        html: {
            toDOM(el, v) { el.innerHTML = v == null ? '' : v; }
        },
        show: {
            toDOM(el, v) { el.style.display = v ? '' : 'none'; }
        },
        hide: {
            toDOM(el, v) { el.style.display = v ? 'none' : ''; }
        },
        disabled: {
            toDOM(el, v) { el.disabled = !!v; }
        },
        class: {
            toDOM(el, v, arg) { el.classList.toggle(arg, !!v); }
        },
        attr: {
            toDOM(el, v, arg) {
                if (v === null || v === undefined || v === false) el.removeAttribute(arg);
                else el.setAttribute(arg, v);
            }
        },
        style: {
            toDOM(el, v, arg) { el.style[arg] = v == null ? '' : v; }
        },
        value: {
            toDOM(el, v) {
                const s = v === null || v === undefined ? '' : String(v);
                if (el.value !== s) el.value = s;
            },
            event(el) { return el.tagName === 'SELECT' ? 'change' : 'input'; },
            fromDOM(el) {
                if (el.type === 'number' || el.type === 'range') return el.value === '' ? null : Number(el.value);
                return el.value;
            }
        },
        checked: {
            toDOM(el, v) { el.checked = !!v; },
            event: 'change',
            fromDOM(el) { return el.checked; }
        },
        radio: {
            toDOM(el, v) { el.checked = (el.value === String(v)); },
            event: 'change',
            fromDOM(el) { return el.value; }
        },
        edit: {
            toDOM(el, v) {
                const s = v === null || v === undefined ? '' : String(v);
                if (el.textContent !== s) el.textContent = s;
            },
            event: 'input',
            fromDOM(el) { return el.textContent; }
        }
    };

    const controlAdapters = {};

    function parseBindings(text) {
        return text.split(';').map(function (s) { return s.trim(); }).filter(Boolean).map(function (entry) {
            const m = entry.match(/^([\w-]+)(?:\(([^)]*)\))?\s*:\s*(.+)$/);
            if (!m) throw new Error(`$bind: 잘못된 바인딩 표현식입니다: "${entry}"`);
            return { type: m[1], arg: m[2], path: m[3].trim() };
        });
    }

    function bindAdapter(el, store, spec) {
        const adapterName = el.getAttribute('syn-bind-adapter') || spec.arg;
        const adapter = controlAdapters[adapterName];
        if (!adapter) throw new Error(`$bind: 등록되지 않은 컨트롤 어댑터입니다: "${adapterName}" ($binding.registerAdapter로 먼저 등록하세요)`);

        adapter.set(el, store.get(spec.path));

        let refreshScheduled = false;
        function scheduleRefresh() {
            if (refreshScheduled) return;
            refreshScheduled = true;
            Promise.resolve().then(function () {
                refreshScheduled = false;
                adapter.set(el, store.get(spec.path));
            });
        }
        const unsubStore = store.subscribe(spec.path, scheduleRefresh, { deep: true });

        let handler = null;
        if (adapter.on) {
            handler = function (val) { store.set(spec.path, arguments.length ? val : adapter.get(el)); };
            adapter.on(el, handler);
        }

        return function () {
            unsubStore();
            if (adapter.off && handler) adapter.off(el, handler);
        };
    }

    function bindElement(el, store, bindText) {
        const specs = parseBindings(bindText);
        const cleanups = [];

        specs.forEach(function (spec) {
            if (spec.type === 'adapter') {
                cleanups.push(bindAdapter(el, store, spec));
                return;
            }
            const handler = bindings[spec.type];
            if (!handler) {
                syn.$l.eventLog('$bind.bindElement', `알 수 없는 바인딩 타입입니다: "${spec.type}"`, 'Warning');
                return;
            }

            handler.toDOM(el, store.get(spec.path), spec.arg);
            const unsub = store.subscribe(spec.path, function (ev) { handler.toDOM(el, ev.value, spec.arg); });
            cleanups.push(unsub);

            if (handler.event) {
                const evtName = typeof handler.event === 'function' ? handler.event(el) : handler.event;
                const listener = function () { store.set(spec.path, handler.fromDOM(el)); };
                el.addEventListener(evtName, listener);
                cleanups.push(function () { el.removeEventListener(evtName, listener); });
            }
        });

        return function () { cleanups.forEach(function (fn) { fn(); }); };
    }

    // -------------------------------------------------------------------
    // 리스트(배열) 반복 바인딩: syn-bind-list="경로" 컨테이너 안의 <template> 1개를 행 템플릿으로 사용
    // -------------------------------------------------------------------

    function bindList(container, store, path) {
        const template = container.querySelector('template');
        if (!template) throw new Error('$bind: syn-bind-list 컨테이너에는 <template> 자식이 있어야 합니다.');
        container.removeChild(template);

        let rowCleanups = [];
        const idxRegex = new RegExp('^' + escapeRegExp(path) + '\\[(\\d+)\\]$');

        function clearRows() {
            rowCleanups.forEach(function (fns) { if (fns) fns.forEach(function (fn) { fn(); }); });
            rowCleanups = [];
            while (container.firstChild) container.removeChild(container.firstChild);
        }

        function renderRow(i) {
            const frag = template.content.cloneNode(true);
            const scoped = store.scope(path + '[' + i + ']');
            rowCleanups[i] = attach(frag, scoped);
            container.appendChild(frag);
        }

        function renderAll() {
            clearRows();
            const arr = store.get(path) || [];
            for (let i = 0; i < arr.length; i++) renderRow(i);
        }

        function replaceRow(idx) {
            if (rowCleanups[idx]) rowCleanups[idx].forEach(function (fn) { fn(); });
            const oldEl = container.children[idx];
            const frag = template.content.cloneNode(true);
            const scoped = store.scope(path + '[' + idx + ']');
            rowCleanups[idx] = attach(frag, scoped);
            if (oldEl) container.replaceChild(frag, oldEl);
            else container.appendChild(frag); // 템플릿이 다중 루트일 경우를 대비한 안전장치
        }

        renderAll();

        // splice처럼 한 연산에서 여러 트랩 호출이 발생하는 경우를 대비해 마이크로태스크로 통지를 모아 1회만 재렌더링한다.
        let dirtyFull = false;
        let dirtyIndices = {};
        let flushScheduled = false;

        function scheduleFlush() {
            if (flushScheduled) return;
            flushScheduled = true;
            Promise.resolve().then(function () {
                flushScheduled = false;
                if (dirtyFull) {
                    dirtyFull = false;
                    dirtyIndices = {};
                    renderAll();
                    return;
                }
                Object.keys(dirtyIndices).forEach(function (idx) { replaceRow(Number(idx)); });
                dirtyIndices = {};
            });
        }

        const unsub = store.subscribe(path, function (ev) {
            if (ev.path === path) { dirtyFull = true; scheduleFlush(); return; } // 배열 전체 재할당 또는 length 변경
            const m = ev.path.match(idxRegex);
            if (m) {
                if (ev.type === 'set') { dirtyIndices[m[1]] = true; scheduleFlush(); } // 기존 인덱스 요소 교체
                else { dirtyFull = true; scheduleFlush(); } // add/delete: 구조 변경이므로 전체 재렌더링
                return;
            }
            // 그 외(예: items[2].title)는 행 내부 바인딩이 이미 자체적으로 처리하므로 무시한다.
        }, { deep: true });

        return function () { clearRows(); unsub(); };
    }

    function findTargets(root, selector) {
        const out = [];
        function consider(node) {
            if (node.nodeType !== 1) return;
            if (node.matches(selector)) out.push(node);
            const found = node.querySelectorAll(selector);
            for (let i = 0; i < found.length; i++) out.push(found[i]);
        }
        if (root.nodeType === 11) { // DocumentFragment
            for (let i = 0; i < root.childNodes.length; i++) consider(root.childNodes[i]);
        } else {
            consider(root);
        }
        return out;
    }

    function attach(root, store) {
        const cleanups = [];

        findTargets(root, '[syn-bind-list]').forEach(function (el) {
            cleanups.push(bindList(el, store, el.getAttribute('syn-bind-list')));
        });

        findTargets(root, '[syn-bind]').forEach(function (el) {
            cleanups.push(bindElement(el, store, el.getAttribute('syn-bind')));
        });

        return cleanups;
    }

    $binding.extend({
        createStore(data) {
            return new Store(data);
        },

        mount(root, dataOrStore) {
            const store = dataOrStore instanceof Store ? dataOrStore : this.createStore(dataOrStore);
            const cleanups = attach(root, store);
            return {
                store: store,
                destroy() { cleanups.forEach(function (fn) { fn(); }); }
            };
        },

        attach(root, store) {
            return attach(root, store);
        },

        // 새로운 선언적 바인딩 타입 등록: { toDOM(el, value, arg), event?, fromDOM? }
        registerBinding(type, handler) {
            bindings[type] = handler;
        },

        // 커스텀 컨트롤 어댑터 등록: { get(el), set(el, value), on?(el, handler), off?(el, handler) }
        registerAdapter(name, adapter) {
            if (!adapter || typeof adapter.get !== 'function' || typeof adapter.set !== 'function') {
                throw new Error(`$bind: 어댑터는 get(el)/set(el, value)를 반드시 구현해야 합니다: ${name}`);
            }
            controlAdapters[name] = adapter;
        },

        // 프록시를 원본 순수 객체/배열로 변환한다.
        raw(value) {
            return (value !== null && typeof value === 'object' && value[RAW] !== undefined) ? value[RAW] : value;
        },

        bindings: bindings,
        controlAdapters: controlAdapters,
        Store: Store
    });

    syn.$bind = $binding;
})(globalRoot);
