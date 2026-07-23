'use strict';

// syn.$bind 예제 4번 섹션(커스텀 컨트롤 어댑터)에서 쓰는 미니 그리드.
// AUIGrid/Handsontable류 그리드의 getData()/setData(arr)/on('change', cb) 형태
// 공개 API를 흉내낸 데모용 컨트롤로, 실제 그리드를 붙일 때와 동일한 어댑터
// 작성 방식(get/set/on)을 보여주기 위한 것이다.
function BindingMiniGrid(container) {
    this.container = container;
    this.data = [];
    this.listeners = { change: [] };
    this.container.innerHTML =
        '<table class="table table-vcenter card-table"><thead><tr><th>상품명</th><th>수량</th><th>완료</th></tr></thead><tbody></tbody></table>';
    this.tbody = this.container.querySelector('tbody');
}
BindingMiniGrid.prototype.getData = function () { return this.data; };
BindingMiniGrid.prototype.on = function (evt, cb) { this.listeners[evt].push(cb); };
BindingMiniGrid.prototype._emitChange = function () {
    var data = this.data;
    this.listeners.change.forEach(function (cb) { cb(data); });
};
BindingMiniGrid.prototype.setData = function (arr) {
    var incoming = (arr || []).map(function (o) {
        return { id: o.id, title: o.title, qty: o.qty, done: !!o.done };
    });
    var sameShape = incoming.length === this.data.length &&
        incoming.every(function (row, i) { return this.data[i] && row.id === this.data[i].id; }, this);
    this.data = incoming;
    if (!sameShape) this._render();
    else this._patch(); // 구조가 그대로면 입력 엘리먼트를 재생성하지 않고 값만 갱신(포커스 유지)
};
BindingMiniGrid.prototype._render = function () {
    var self = this;
    this.tbody.innerHTML = '';
    this.data.forEach(function (row, idx) {
        var tr = document.createElement('tr');
        tr.appendChild(self._cell('text', row.title, function (v) { self.data[idx].title = v; self._emitChange(); }));
        tr.appendChild(self._cell('number', row.qty, function (v) { self.data[idx].qty = Number(v) || 0; self._emitChange(); }));
        tr.appendChild(self._cell('checkbox', row.done, function (v) { self.data[idx].done = v; self._emitChange(); }));
        self.tbody.appendChild(tr);
    });
};
BindingMiniGrid.prototype._cell = function (type, value, onChange) {
    var td = document.createElement('td');
    var input = document.createElement('input');
    input.type = type;
    input.className = 'form-control form-control-sm';
    if (type === 'checkbox') {
        input.checked = !!value;
        input.addEventListener('change', function () { onChange(input.checked); });
    } else {
        input.value = value;
        input.addEventListener('input', function () { onChange(input.value); });
    }
    td.appendChild(input);
    return td;
};
BindingMiniGrid.prototype._patch = function () {
    var self = this;
    Array.prototype.forEach.call(this.tbody.children, function (tr, idx) {
        var row = self.data[idx];
        var inputs = tr.querySelectorAll('input');
        var titleInput = inputs[0], qtyInput = inputs[1], doneInput = inputs[2];
        if (document.activeElement !== titleInput && titleInput.value !== row.title) titleInput.value = row.title;
        if (document.activeElement !== qtyInput && Number(qtyInput.value) !== row.qty) qtyInput.value = row.qty;
        if (doneInput.checked !== row.done) doneInput.checked = row.done;
    });
};

let $binding = {
    extends: [
        'parsehtml'
    ],

    nextItemId: 4,
    unsubscribeDemo: null,
    mountedDemo: null,
    demoStore: null,

    hook: {
        pageLoad() {
            // -------------------------------------------------------------------
            // 1) 초기 데이터 정의 (순수 객체 / 평면 객체 배열)
            // -------------------------------------------------------------------
            var initialData = {
                user: { name: '홍길동', email: 'hong@example.com', active: true, role: 'user', plan: 'basic', bio: '', rating: 3 },
                address: { city: '서울', zip: '04524' },
                items: [
                    { id: 1, title: '우유', qty: 2, done: false },
                    { id: 2, title: '계란', qty: 1, done: true },
                    { id: 3, title: '식빵', qty: 1, done: false }
                ],
                clickCount: 0
            };

            // -------------------------------------------------------------------
            // 2) 커스텀 컨트롤 어댑터 / 바인딩 타입 등록 (mount()보다 먼저 등록해야 한다)
            // -------------------------------------------------------------------
            syn.$bind.registerAdapter('rating', {
                get(el) { return Number(el.dataset.value || 0); },
                set(el, value) {
                    el.dataset.value = value;
                    el.querySelectorAll('.star').forEach(function (star) {
                        star.classList.toggle('filled', Number(star.dataset.value) <= Number(value));
                    });
                },
                on(el, handler) {
                    el.addEventListener('click', function (ev) {
                        var star = ev.target.closest('.star');
                        if (!star) return;
                        handler(Number(star.dataset.value));
                    });
                }
            });

            syn.$bind.registerAdapter('toggle', {
                get(el) { return el.classList.contains('on'); },
                set(el, value) {
                    el.classList.toggle('on', !!value);
                    el.setAttribute('aria-pressed', !!value);
                },
                on(el, handler) {
                    el.addEventListener('click', function () { handler(!el.classList.contains('on')); });
                }
            });

            var miniGridEl = syn.$l.get('miniGrid');
            miniGridEl._miniGrid = new BindingMiniGrid(miniGridEl);
            syn.$bind.registerAdapter('minigrid', {
                get(el) { return el._miniGrid.getData(); },
                set(el, value) { el._miniGrid.setData(value); },
                on(el, handler) { el._miniGrid.on('change', handler); }
            });

            syn.$bind.registerBinding('uppercase', {
                toDOM(el, v) { el.textContent = (v || '').toUpperCase(); }
            });

            syn.$bind.registerAdapter('counter', {
                get(el) { return Number(el.textContent); },
                set(el, value) { el.textContent = value; },
                on(el, handler) {
                    el.addEventListener('click', function () { handler(Number(el.textContent) + 1); });
                }
            });

            // -------------------------------------------------------------------
            // 3) store 생성 + 선언적 바인딩(mount)
            // -------------------------------------------------------------------
            var mounted = syn.$bind.mount(document.body, initialData);
            $binding.store = mounted.store;
            window.store = $binding.store; // 크롬 개발자 도구 콘솔에서 store.data... 로 직접 실습할 수 있도록 전역 노출

            // -------------------------------------------------------------------
            // 4) 리스트(테이블) 행 삭제 버튼: 동적으로 렌더링되는 행이라 syn-events 대신
            //    이벤트 위임(delegation)으로 직접 연결한다.
            // -------------------------------------------------------------------
            syn.$l.get('tbl_items').addEventListener('click', function (ev) {
                var btn = ev.target.closest('.js-remove-row');
                if (!btn) return;
                var tr = btn.closest('tr');
                var idx = Array.prototype.indexOf.call(tr.parentElement.children, tr);
                $binding.store.data.items.splice(idx, 1);
            });

            // -------------------------------------------------------------------
            // 5) 디버그: 변경 이벤트 로그 + 원본 데이터 스냅샷
            // -------------------------------------------------------------------
            var logLines = [];
            $binding.refreshDump = function () {
                syn.$l.get('txt_dataDump').value = JSON.stringify($binding.store.toRaw(), null, 2);
            };
            $binding.store.subscribe('', function (ev) {
                var line = '[' + ev.type + '] ' + ev.path + ' = ' + JSON.stringify(ev.value);
                logLines.push(line);
                if (logLines.length > 40) logLines.shift();
                syn.$l.get('txt_eventLog').value = logLines.join('\n');
                $binding.refreshDump();
            }, { deep: true });
            $binding.refreshDump();
        }
    },

    event: {
        // ------------------------------------------------------------- 2. 중첩 객체
        btn_replaceAddress_click() {
            $binding.store.data.address = { city: '부산', zip: '48058' };
        },

        // ------------------------------------------------------------- 3. 배열(리스트) 바인딩
        btn_push_click() {
            $binding.store.data.items.push({ id: $binding.nextItemId++, title: '새 항목', qty: 1, done: false });
        },

        btn_pop_click() {
            $binding.store.data.items.pop();
        },

        btn_replaceIndex_click() {
            if ($binding.store.data.items.length > 1) {
                $binding.store.data.items[1] = { id: $binding.nextItemId++, title: '교체된 항목', qty: 9, done: true };
            }
        },

        btn_itemsSort_click() {
            $binding.store.data.items.sort(function (a, b) { return a.title.localeCompare(b.title); });
        },

        // ------------------------------------------------------------- 7.1 createStore(data)
        btn_createStore_click() {
            var outputEl = syn.$l.get('txt_createStoreOutput');
            if (!$binding.demoStore) {
                $binding.demoStore = syn.$bind.createStore({ count: 0 });
                $binding.demoStore.subscribe('count', function (ev) {
                    outputEl.value = ev.value;
                });
                outputEl.value = $binding.demoStore.data.count;
            }
            $binding.demoStore.data.count++;
        },

        // ------------------------------------------------------------- 7.2 mount(root, dataOrStore)
        btn_mount_click() {
            if ($binding.mountedDemo) return;
            var mountAreaEl = syn.$l.get('mountArea');
            var tpl = syn.$l.get('mountAreaTemplate');
            mountAreaEl.innerHTML = '';
            mountAreaEl.appendChild(tpl.content.cloneNode(true));
            $binding.mountedDemo = syn.$bind.mount(mountAreaEl, { label: '처음 값' });
        },

        btn_mountDestroy_click() {
            if (!$binding.mountedDemo) return;
            $binding.mountedDemo.destroy();
            $binding.mountedDemo = null;
            syn.$l.get('mountArea').innerHTML = '<span class="form-text">mount() 실행 전 (아직 바인딩 없음)</span>';
        },

        // ------------------------------------------------------------- 7.3 attach(root, store)
        btn_attach_click() {
            if (!$binding.mountedDemo) { alert('7.2에서 먼저 mount()를 실행하세요.'); return; }
            var attachAreaEl = syn.$l.get('attachArea');
            var tpl = syn.$l.get('attachAreaTemplate');
            attachAreaEl.innerHTML = '';
            attachAreaEl.appendChild(tpl.content.cloneNode(true));
            syn.$bind.attach(attachAreaEl, $binding.mountedDemo.store);
        },

        // ------------------------------------------------------------- 7.6 raw(value)
        btn_raw_click() {
            var proxyRow = $binding.store.data.items[0];
            var rawRow = syn.$bind.raw(proxyRow);
            syn.$l.get('txt_rawOutput').value =
                'JSON.stringify(rawRow) = ' + JSON.stringify(rawRow) + '\n' +
                'proxyRow === rawRow -> ' + (proxyRow === rawRow);
        },

        // ------------------------------------------------------------- 7.7 store.data / get(path) / set(path, value)
        btn_pathGet_click() {
            var path = syn.$l.get('txt_path').value;
            var result = $binding.store.get(path);
            syn.$l.get('txt_pathOutput').value = 'store.get("' + path + '") = ' + JSON.stringify(result);
        },

        btn_pathSet_click() {
            var path = syn.$l.get('txt_path').value;
            var raw = syn.$l.get('txt_pathValue').value;
            var value;
            try { value = JSON.parse(raw); } catch (e) { value = raw; }
            $binding.store.set(path, value);
            syn.$l.get('txt_pathOutput').value =
                'store.set("' + path + '", ' + JSON.stringify(value) + ') 완료 -> 화면이 갱신되었는지 확인하세요';
        },

        // ------------------------------------------------------------- 7.8 subscribe(path, cb, { deep })
        btn_subscribeToggle_click() {
            var btn = syn.$l.get('btn_subscribeToggle');
            var outputEl = syn.$l.get('txt_subscribeOutput');
            if ($binding.unsubscribeDemo) {
                $binding.unsubscribeDemo();
                $binding.unsubscribeDemo = null;
                btn.textContent = 'items 구독 시작';
                outputEl.value = outputEl.value + '\n(구독 해제됨)';
                return;
            }
            var lines = ['(구독 시작됨 - 3번 섹션에서 items를 바꿔보세요)'];
            outputEl.value = lines.join('\n');
            $binding.unsubscribeDemo = $binding.store.subscribe('items', function (ev) {
                lines.push('[' + ev.type + '] ' + ev.path + ' = ' + JSON.stringify(ev.value));
                if (lines.length > 20) lines.shift();
                outputEl.value = lines.join('\n');
            }, { deep: true });
            btn.textContent = 'items 구독 해제';
        },

        // ------------------------------------------------------------- 7.9 batch(fn)
        btn_batchOff_click() { $binding.runBatchDemo(false); },
        btn_batchOn_click() { $binding.runBatchDemo(true); },

        btn_batchReset_click() {
            $binding.store.data.items = [
                { id: $binding.nextItemId++, title: '우유', qty: 2, done: false },
                { id: $binding.nextItemId++, title: '계란', qty: 1, done: true },
                { id: $binding.nextItemId++, title: '식빵', qty: 1, done: false }
            ];
        },

        // ------------------------------------------------------------- 7.10 toRaw()
        btn_toRawDump_click() {
            syn.$l.get('txt_toRawOutput').value = JSON.stringify($binding.store.toRaw(), null, 2);
        },

        btn_toRawMutate_click() {
            var raw = $binding.store.toRaw();
            raw.user.name = '반응 없이 직접 바뀐 이름';
            syn.$l.get('txt_toRawOutput').value =
                'raw는 원본 객체 자체라 raw.user.name을 직접 바꾸면 실제 값도 바뀝니다.\n' +
                'store.get("user.name") = ' + JSON.stringify($binding.store.get('user.name')) + ' (바뀐 값이 그대로 조회됨)\n' +
                '하지만 Proxy의 set 트랩을 거치지 않아 이벤트가 발생하지 않으므로,\n' +
                '1번 섹션의 이름 입력/텍스트는 갱신되지 않은 채로 남아있을 것입니다.\n' +
                '화면까지 갱신하려면 항상 store.data.user.name = ... 처럼 Proxy를 통해야 합니다.';
        },

        // ------------------------------------------------------------- 7.11 scope(basePath)
        btn_scopeGet_click() {
            var idx = syn.$l.get('txt_scopeIndex').value;
            var rowScope = $binding.store.scope('items[' + idx + ']');
            syn.$l.get('txt_scopeOutput').value =
                'store.scope("items[' + idx + ']").get("title") = ' + JSON.stringify(rowScope.get('title'));
        },

        btn_scopeSet_click() {
            var idx = syn.$l.get('txt_scopeIndex').value;
            var value = syn.$l.get('txt_scopeValue').value;
            var rowScope = $binding.store.scope('items[' + idx + ']');
            rowScope.set('title', value);
            syn.$l.get('txt_scopeOutput').value =
                'store.scope("items[' + idx + ']").set("title", "' + value + '") 완료 -> 3번 섹션 테이블에서 확인하세요';
        }
    },

    // splice처럼 한 번의 호출로 내부적으로 여러 변경이 연속 발생하는 연산을 store.batch()로
    // 감쌀 때와 아닐 때, 구독 콜백이 관찰하는 중간 상태가 실제로 달라짐을 보여준다.
    runBatchDemo(useBatch) {
        var lines = [];
        var unsub = $binding.store.subscribe('items', function (ev) {
            lines.push('[' + ev.type + '] 이 시점의 store.get("items").length = ' + $binding.store.get('items').length);
        }, { deep: true });

        if ($binding.store.data.items.length < 2) {
            lines.push('(items가 2개 미만이라 생략됨 - 먼저 "items 초기화" 버튼을 눌러주세요)');
        } else if (useBatch) {
            $binding.store.batch(function () { $binding.store.data.items.splice(1, 1); });
        } else {
            $binding.store.data.items.splice(1, 1);
        }

        unsub();
        syn.$l.get('txt_batchOutput').value =
            (useBatch ? 'batch 사용 (store.batch로 감쌈):\n' : 'batch 미사용:\n') + lines.join('\n');
    }
};
