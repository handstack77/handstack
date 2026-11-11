'use strict';
let $practical = {
    prop: {
        bindings: ['txtOrderNo', 'txtOrderDate', 'txtCustomerName', 'txtDeliveryAddress', 'txtMemo'],
        sample: {
            info: { OrderNo: 'O-20261001', CustomerName: '김민준', OrderDate: '2026-10-01', DeliveryAddress: '서울시 중구 세종대로 110', Memo: '오전 배송 요청' },
            lines: [
                { LineNo: 1, ProductName: '무선 이어폰', UnitPrice: 89000, Quantity: 1 },
                { LineNo: 2, ProductName: '보조 배터리', UnitPrice: 42000, Quantity: 2 },
                { LineNo: 3, ProductName: '충전 케이블', UnitPrice: 9000, Quantity: 3 }
            ]
        }
    },

    hook: {
        // 입력 컨트롤을 Form 저장소(OrderInfo)와 연결한다. 이후 setValue/getValue 로 저장소와 화면이 함께 갱신된다.
        async pageLoad() {
            for (let i = 0; i < $this.prop.bindings.length; i++) {
                await syn.uicontrols.$data.bindingSourceAsync($this.prop.bindings[i], 'OrderInfo');
            }

            $this.method.newOrder();
        }
    },

    method: {
        lines() {
            return $this.store.OrderLines;
        },

        // 삭제 표시(D)된 행은 화면에서 제외하고 나머지 행으로 합계를 계산한다.
        visibleLines() {
            return $this.method.lines().filter((line) => { return line.Flag != 'D'; });
        },

        render() {
            let rows = $this.method.visibleLines();
            syn.$l.get('tbodyLines').innerHTML = rows.length == 0
                ? '<tr><td colspan="7" class="text-center text-muted">주문 상세가 없습니다. 상품 추가 버튼을 누르세요.</td></tr>'
                : rows.map((line) => {
                    let index = $this.method.lines().indexOf(line);
                    return `<tr><td>${line.Flag}</td><td>${line.LineNo}</td>`
                        + `<td><input type="text" class="form-control form-control-sm inpName" data-index="${index}" value="${line.ProductName}" maxlength="60"></td>`
                        + `<td><input type="text" class="form-control form-control-sm text-end inpPrice" data-index="${index}" value="${line.UnitPrice}"></td>`
                        + `<td><input type="text" class="form-control form-control-sm text-end inpQty" data-index="${index}" value="${line.Quantity}"></td>`
                        + `<td class="text-end">${(line.UnitPrice * line.Quantity).toLocaleString()}</td>`
                        + `<td><button type="button" class="btn btn-sm btn-icon btn-danger btnRemove" data-index="${index}"><i class="ti ti-trash"></i></button></td></tr>`;
                }).join('');

            let total = rows.reduce((sum, line) => { return sum + line.UnitPrice * line.Quantity; }, 0);
            syn.$l.get('spnTotal').innerText = `합계 ${total.toLocaleString()}원`;

            syn.$l.querySelectorAll('.inpName').forEach((el) => {
                el.addEventListener('change', () => { $this.method.edit(Number(el.dataset.index), 'ProductName', el.value.trim()); });
            });
            syn.$l.querySelectorAll('.inpPrice').forEach((el) => {
                el.addEventListener('change', () => { $this.method.edit(Number(el.dataset.index), 'UnitPrice', Number(el.value.replace(/,/g, '')) || 0); });
            });
            syn.$l.querySelectorAll('.inpQty').forEach((el) => {
                el.addEventListener('change', () => { $this.method.edit(Number(el.dataset.index), 'Quantity', Math.max(1, Number(el.value) || 1)); });
            });
            syn.$l.querySelectorAll('.btnRemove').forEach((el) => {
                el.addEventListener('click', () => { $this.method.removeLine(Number(el.dataset.index)); });
            });
        },

        // 조회된 행(R)을 수정하면 Flag 를 U 로 바꾸고, 새로 추가한 행(C)은 C 를 유지한다.
        edit(index, field, value) {
            let line = $this.method.lines()[index];
            line[field] = value;
            if (line.Flag == 'R') {
                line.Flag = 'U';
            }

            $this.method.render();
        },

        addLine() {
            let lines = $this.method.lines();
            let nextNo = lines.reduce((max, line) => { return Math.max(max, line.LineNo); }, 0) + 1;
            lines.push({ Flag: 'C', LineNo: nextNo, ProductName: '', UnitPrice: 0, Quantity: 1 });
            $this.method.render();
        },

        // 서버에 있는 행(R/U)은 Flag 만 D 로 바꿔 저장 시 삭제 대상으로 넘기고, 방금 추가한 행(C)은 배열에서 바로 지운다.
        removeLine(index) {
            let lines = $this.method.lines();
            let line = lines[index];
            if (line.Flag == 'C') {
                lines.splice(index, 1);
            }
            else {
                line.Flag = 'D';
            }

            $this.method.render();
        },

        setState(text) {
            syn.$l.get('spnState').innerText = text;
        },

        // 서버 조회 결과를 받은 상황을 흉내 낸다: Form 은 setValue 로 화면에 반영하고, 배열은 Flag 'R' 로 채워진다.
        load() {
            syn.uicontrols.$data.setValue('srcOrderInfo', $this.prop.sample.info);
            syn.uicontrols.$data.setValue('srcOrderLines', $this.prop.sample.lines.map((line) => { return Object.assign({}, line); }));
            $this.method.setState(`조회됨 (${$this.prop.sample.info.OrderNo})`);
            syn.$l.get('preResult').innerText = '저장 버튼을 누르면 저장 대상이 표시됩니다.';
            $this.method.render();
        },

        newOrder() {
            syn.uicontrols.$data.setValue('srcOrderInfo', { OrderNo: '', CustomerName: '', OrderDate: $date.toString(new Date(), 'd'), DeliveryAddress: '', Memo: '' });
            syn.uicontrols.$data.clear('srcOrderLines');
            $this.method.setState('신규');
            syn.$l.get('preResult').innerText = '저장 버튼을 누르면 저장 대상이 표시됩니다.';
            $this.method.render();
        },

        validate(info) {
            if (info.OrderDate == '') {
                syn.$w.alert('주문 일자 항목은 반드시 입력 해야합니다.');
                return false;
            }

            if (info.CustomerName == '') {
                syn.$w.alert('고객명 항목은 반드시 입력 해야합니다.');
                return false;
            }

            let rows = $this.method.visibleLines();
            if (rows.length == 0) {
                syn.$w.alert('주문 상세를 1건 이상 입력 해야합니다.');
                return false;
            }

            if (rows.some((line) => { return line.ProductName == '' || line.UnitPrice <= 0; }) == true) {
                syn.$w.alert('상품명과 단가를 모두 입력 해야합니다.');
                return false;
            }

            return true;
        },

        save() {
            let info = syn.uicontrols.$data.getValue('srcOrderInfo', true);
            if ($this.method.validate(info) == false) {
                return;
            }

            let isNew = info.OrderNo == '';
            if (isNew == true) {
                syn.uicontrols.$data.setValue('srcOrderInfo', { OrderNo: 'O-' + new Date().getTime().toString().slice(-8) });
                info = syn.uicontrols.$data.getValue('srcOrderInfo', true);
            }

            // 신규 주문은 모든 행이 C 이고, 조회한 주문은 변경분(U/D/C)만 getValue 기본 호출로 돌려받는다.
            let changedLines = isNew == true
                ? $this.method.lines().filter((line) => { return line.Flag != 'D'; }).map((line) => { return Object.assign({}, line, { Flag: 'C' }); })
                : syn.uicontrols.$data.getValue('srcOrderLines');

            syn.$l.get('preResult').innerText = JSON.stringify({ Row: { OrderInfo: info }, List: { OrderLines: changedLines } }, null, 2);
            syn.$l.eventLog('save', `${info.OrderNo} 저장 요청 (${isNew ? '신규' : '수정'}, 상세 변경 ${changedLines.length}건)`);

            // 저장 성공 후에는 화면의 상세 행을 조회 직후 상태(R)로 맞추고, 삭제된 행은 제거한다.
            let lines = $this.method.lines();
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].Flag == 'D') {
                    lines.splice(i, 1);
                }
                else {
                    lines[i].Flag = 'R';
                }
            }

            $this.method.setState(`저장됨 (${info.OrderNo})`);
            $this.method.render();
        }
    },

    event: {
        btnLoad_click() { $this.method.load(); },
        btnNew_click() { $this.method.newOrder(); },
        btnAddLine_click() { $this.method.addLine(); },
        btnSave_click() { $this.method.save(); }
    }
}
