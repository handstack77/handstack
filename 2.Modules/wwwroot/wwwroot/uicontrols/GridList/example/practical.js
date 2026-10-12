'use strict';
let $practical = {
    prop: {
        statusNames: { WAIT: '접수 대기', DONE: '접수 완료' },
        // 예제용 서버 데이터(처리 후 상태가 바뀌는 것을 확인하기 위해 배열을 직접 수정한다).
        orders: [
            { OrderNo: 'O-2001', CustomerName: '김민준', ProductName: '무선 이어폰', Amount: 89000, Status: 'WAIT' },
            { OrderNo: 'O-2002', CustomerName: '이서연', ProductName: '보조 배터리', Amount: 42000, Status: 'WAIT' },
            { OrderNo: 'O-2003', CustomerName: '박지후', ProductName: '요가 매트', Amount: 32000, Status: 'DONE' },
            { OrderNo: 'O-2004', CustomerName: '최하윤', ProductName: '러닝화', Amount: 99000, Status: 'WAIT' },
            { OrderNo: 'O-2005', CustomerName: '정도윤', ProductName: '유기농 현미 5kg', Amount: 23000, Status: 'DONE' },
            { OrderNo: 'O-2006', CustomerName: '강서아', ProductName: '콜드브루 원액 1L', Amount: 15000, Status: 'WAIT' },
            { OrderNo: 'O-2007', CustomerName: '조은우', ProductName: '주방 세제 리필', Amount: 6500, Status: 'WAIT' },
            { OrderNo: 'O-2008', CustomerName: '윤지안', ProductName: '무선 이어폰', Amount: 89000, Status: 'DONE' },
            { OrderNo: 'O-2009', CustomerName: '장예준', ProductName: '스파클링 워터 24입', Amount: 18000, Status: 'WAIT' },
            { OrderNo: 'O-2010', CustomerName: '임수아', ProductName: '요가 매트', Amount: 32000, Status: 'WAIT' }
        ]
    },

    hook: {
        pageComplete() {
            $this.method.search();
        }
    },

    method: {
        search() {
            let status = syn.$l.get('ddlStatus').value;
            let name = syn.uicontrols.$textbox.getValue('txtCustomerName').trim();
            let rows = $this.prop.orders.filter((order) => {
                return (status == '' || order.Status == status)
                    && (name == '' || order.CustomerName.indexOf(name) > -1);
            }).map((order) => {
                return Object.assign({}, order, { StatusName: $this.prop.statusNames[order.Status], Amount: order.Amount.toLocaleString() });
            });

            syn.uicontrols.$list.setValue('lstOrders', rows);
            syn.$l.get('spnCount').innerText = `${rows.length}건`;
            $this.method.showDetail(null);
        },

        showDetail(order) {
            syn.$l.get('divNo').innerText = order ? order.OrderNo : '-';
            syn.$l.get('divCustomer').innerText = order ? order.CustomerName : '-';
            syn.$l.get('divProduct').innerText = order ? `${order.ProductName} / ${order.Amount}원` : '-';
            syn.$l.get('divStatus').innerText = order ? (order.StatusName || $this.prop.statusNames[order.Status]) : '-';
        },

        // 체크된 행(주문 번호 목록)을 가져온다.
        checkedOrderNos() {
            return syn.uicontrols.$list.getControl('lstOrders').table.column(0).checkboxes.selected().toArray();
        },

        approve() {
            let orderNos = $this.method.checkedOrderNos();
            if (orderNos.length == 0) {
                syn.$w.alert('접수 처리할 주문을 선택하세요.');
                return;
            }

            let targets = $this.prop.orders.filter((order) => { return orderNos.includes(order.OrderNo); });
            let alreadyDone = targets.filter((order) => { return order.Status == 'DONE'; });
            if (alreadyDone.length > 0) {
                syn.$w.alert(`이미 접수 완료된 주문이 포함되어 있습니다: ${alreadyDone.map((order) => { return order.OrderNo; }).join(', ')}`);
                return;
            }

            let alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            syn.$w.alert(`${targets.length}건을 접수 처리 하시겠습니까?`, '접수 확인', alertOptions, (result) => {
                if (result == 'Yes') {
                    targets.forEach((order) => { order.Status = 'DONE'; });
                    syn.$l.get('preResult').innerText = JSON.stringify({ Approved: targets.map((order) => { return order.OrderNo; }), Count: targets.length }, null, 2);
                    syn.$l.eventLog('approve', `${targets.length}건 접수 처리`);
                    $this.method.search();
                }
            });
        }
    },

    event: {
        // GridList 는 syn-events 에 여러 이름을 적으면 마지막 이름(dblclick)의 핸들러가 모든 이벤트에서 호출된다.
        // 그래서 하나의 핸들러에서 인자 개수로 select(5개: data, e, dt, type, indexes)와 dblclick(2개: tr, data)을 구분한다.
        // 행을 선택하면 오른쪽 패널에 상세를 보여 준다(선택된 행들 중 마지막 행).
        lstOrders_select(data, e, dt, type, indexes) {
            let rows = data.toArray();
            $this.method.showDetail(rows.length > 0 ? rows[rows.length - 1] : null);
        },

        lstOrders_dblclick(row, data) {
            syn.$w.alert(`주문 ${data.OrderNo} / ${data.CustomerName} / ${data.ProductName} / 금액 ${data.Amount}원 (${data.StatusName})`);
        },

        btnSearch_click() {
            $this.method.search();
        },

        btnApprove_click() {
            $this.method.approve();
        }
    }
}
