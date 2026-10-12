'use strict';
let $features = {
    prop: {
        orders: [
            { OrderNo: 'O-1001', ProductName: '무선 이어폰', Quantity: 2 },
            { OrderNo: 'O-1002', ProductName: '보조 배터리', Quantity: 1 }
        ],
        bindings: ['txtCustomerName', 'txtAge', 'ddlGradeCode', 'chkUseYN', 'txtMemo']
    },

    hook: {
        // 입력 컨트롤을 Form 저장소(CustomerStore)와 명시적으로 연결한다. 연결 후에는 저장소 <-> 화면이 양방향으로 반영된다.
        async pageLoad() {
            for (let i = 0; i < $this.prop.bindings.length; i++) {
                await syn.uicontrols.$data.bindingSourceAsync($this.prop.bindings[i], 'CustomerStore');
            }

            $this.method.refreshForm();
            $this.method.renderOrders();
        }
    },

    method: {
        showForm(title, data) {
            syn.$l.get('preForm').textContent = JSON.stringify(data, null, 2);
            syn.$l.eventLog(title, JSON.stringify(data));
        },

        showGrid(title, data) {
            syn.$l.get('preGrid').textContent = JSON.stringify(data, null, 2);
            syn.$l.eventLog(title, `${data.length}건`);
            $this.method.renderOrders();
        },

        // 입력 컨트롤을 바꿀 때마다 저장소가 어떻게 바뀌는지 오른쪽 영역에 바로 보여 준다.
        refreshForm() {
            syn.$l.get('preForm').textContent = JSON.stringify(syn.uicontrols.$data.getValue('srcCustomer', true), null, 2);
        },

        // 저장소 배열을 표로 그려 Flag 변화를 눈으로 확인한다.
        renderOrders() {
            let rows = $this.store.OrderStore;
            syn.$l.get('tbodyOrders').innerHTML = rows.length == 0
                ? '<tr><td colspan="4" class="text-center text-muted">저장소가 비어 있습니다.</td></tr>'
                : rows.map((row) => {
                    return `<tr><td>${row.Flag}</td><td>${row.OrderNo}</td><td>${row.ProductName}</td><td class="text-end">${row.Quantity}</td></tr>`;
                }).join('');
        }
    },

    event: {
        txtCustomerName_change() { $this.method.refreshForm(); },
        txtAge_change() { $this.method.refreshForm(); },
        ddlGradeCode_change() { $this.method.refreshForm(); },
        chkUseYN_change() { $this.method.refreshForm(); },

        // 저장소 값을 바꾸면 연결된 화면 컨트롤에도 반영된다.
        btnSetValue_click() {
            syn.uicontrols.$data.setValue('srcCustomer', { CustomerName: '김민준', Age: 34, GradeCode: 'B', UseYN: 'Y', Memo: '우수 고객' });
            $this.method.refreshForm();
        },

        // columns 에 선언되지 않은 필드는 경고 로그를 남기고 무시된다.
        btnSetUndeclared_click() {
            syn.uicontrols.$data.setValue('srcCustomer', { CustomerName: '이서연', NotDeclared: '무시되는 값' });
            $this.method.refreshForm();
        },

        // 화면 컨트롤과 연결된 필드는 저장소 getter 가 컨트롤 값을 돌려주므로, clear 만으로는 값이 바뀌지 않는다.
        // 연결을 유지한 채 초기화하려면 clear 와 함께 화면 컨트롤도 비운다.
        btnClear_click() {
            syn.uicontrols.$data.clear('srcCustomer');
            syn.uicontrols.$textbox.clear('txtCustomerName');
            syn.uicontrols.$textbox.clear('txtAge');
            syn.uicontrols.$select.clear('ddlGradeCode');
            syn.uicontrols.$checkbox.clear('chkUseYN');
            syn.uicontrols.$textarea.clear('txtMemo');
            $this.method.refreshForm();
            syn.$l.eventLog('btnClear_click', '저장소와 화면 컨트롤을 함께 초기화했습니다.');
        },

        btnGetAll_click() {
            $this.method.showForm('btnGetAll_click', syn.uicontrols.$data.getValue('srcCustomer', true));
        },

        // Form 저장소는 isAll 을 생략하면 값이 객체인 필드만 남기므로 보통 {} 가 반환된다.
        btnGetDefault_click() {
            $this.method.showForm('btnGetDefault_click', syn.uicontrols.$data.getValue('srcCustomer'));
        },

        btnMeta_click() {
            $this.method.showForm('btnMeta_click', syn.uicontrols.$data.getMetaStore('srcCustomer'));
        },

        btnStore_click() {
            $this.method.showForm('btnStore_click', $this.store.CustomerStore);
        },

        btnLoadRows_click() {
            syn.uicontrols.$data.setValue('srcOrders', $this.prop.orders.map((row) => { return Object.assign({}, row); }));
            $this.method.showGrid('btnLoadRows_click', syn.uicontrols.$data.getValue('srcOrders', true));
        },

        btnInsertRow_click() {
            $this.store.OrderStore.push({ Flag: 'C', OrderNo: 'O-' + (1000 + Math.floor(Math.random() * 900)), ProductName: '요가 매트', Quantity: 1 });
            $this.method.showGrid('btnInsertRow_click', syn.uicontrols.$data.getValue('srcOrders', true));
        },

        btnUpdateRow_click() {
            let row = $this.store.OrderStore[0];
            if (row == null) {
                syn.$w.alert('먼저 조회 흉내 버튼으로 데이터를 채우세요.');
                return;
            }

            row.Quantity = 5;
            if (row.Flag == 'R') {
                row.Flag = 'U';
            }
            $this.method.showGrid('btnUpdateRow_click', syn.uicontrols.$data.getValue('srcOrders', true));
        },

        // 서버에 이미 있는 행은 배열에서 지우지 않고 Flag 만 'D' 로 바꿔 저장 시점에 삭제 대상으로 넘긴다.
        btnDeleteRow_click() {
            let rows = $this.store.OrderStore;
            if (rows.length == 0) {
                syn.$w.alert('먼저 조회 흉내 버튼으로 데이터를 채우세요.');
                return;
            }

            let row = rows[rows.length - 1];
            if (row.Flag == 'C') {
                rows.splice(rows.length - 1, 1);
            }
            else {
                row.Flag = 'D';
            }
            $this.method.showGrid('btnDeleteRow_click', syn.uicontrols.$data.getValue('srcOrders', true));
        },

        btnGridChanged_click() {
            $this.method.showGrid('btnGridChanged_click', syn.uicontrols.$data.getValue('srcOrders'));
        },

        btnGridAll_click() {
            $this.method.showGrid('btnGridAll_click', syn.uicontrols.$data.getValue('srcOrders', true));
        },

        btnGridClear_click() {
            syn.uicontrols.$data.clear('srcOrders');
            $this.method.showGrid('btnGridClear_click', syn.uicontrols.$data.getValue('srcOrders', true));
        }
    }
}
