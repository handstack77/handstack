'use strict';
let $practical = {
    prop: {
        storageKey: 'guide.practical.orderGuideSeen',
        orders: [
            { OrderNo: 'O-1001', CustomerName: '김민준', ProductName: '무선 이어폰', Status: 'WAIT' },
            { OrderNo: 'O-1002', CustomerName: '이서연', ProductName: '보조 배터리', Status: 'DONE' },
            { OrderNo: 'O-1003', CustomerName: '박지후', ProductName: '요가 매트', Status: 'WAIT' },
            { OrderNo: 'O-1004', CustomerName: '최하윤', ProductName: '러닝화', Status: 'DONE' }
        ],
        statusNames: { WAIT: '접수 대기', DONE: '처리 완료' }
    },

    hook: {
        pageComplete() {
            $this.method.search();

            // 처음 방문한 사용자에게만 안내 투어를 자동으로 보여 준다(다시 보지 않도록 브라우저에 기억).
            if ($this.method.hasSeen() == false) {
                setTimeout(() => {
                    syn.uicontrols.$guide.introStart('hlpOrder');
                }, 400);
            }
        }
    },

    method: {
        hasSeen() {
            try {
                return localStorage.getItem($this.prop.storageKey) == 'Y';
            }
            catch (error) {
                return true;
            }
        },

        markSeen(value) {
            try {
                if (value == true) {
                    localStorage.setItem($this.prop.storageKey, 'Y');
                }
                else {
                    localStorage.removeItem($this.prop.storageKey);
                }
            }
            catch (error) {
                syn.$l.eventLog('markSeen', '브라우저 저장소를 사용할 수 없습니다.', 'Warning');
            }
        },

        log(text) {
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog('practical', text);
        },

        search() {
            let keyword = syn.$l.get('txtKeyword').value.trim();
            let status = syn.$l.get('ddlStatus').value;
            let rows = $this.prop.orders.filter((order) => {
                return (status == '' || order.Status == status)
                    && (keyword == '' || order.OrderNo.indexOf(keyword) > -1 || order.CustomerName.indexOf(keyword) > -1);
            });

            syn.$l.get('tbodyOrders').innerHTML = rows.length == 0
                ? '<tr><td colspan="4" class="text-center text-muted">조회된 주문이 없습니다.</td></tr>'
                : rows.map((order) => { return `<tr><td>${order.OrderNo}</td><td>${order.CustomerName}</td><td>${order.ProductName}</td><td>${$this.prop.statusNames[order.Status]}</td></tr>`; }).join('');
            syn.$l.get('spnCount').innerText = `${rows.length}건`;
        }
    },

    event: {
        hlpOrder_complete() {
            $this.method.markSeen(true);
            $this.method.log('안내 투어를 끝까지 마쳤습니다. 다음 방문부터 자동으로 시작되지 않습니다.');
        },

        hlpOrder_exit() {
            $this.method.markSeen(true);
        },

        btnSearch_click() {
            $this.method.search();
        },

        // 언제든 사용법 버튼으로 투어를 다시 볼 수 있다.
        btnGuide_click() {
            syn.uicontrols.$guide.introStart('hlpOrder');
        },

        btnReset_click() {
            $this.method.markSeen(false);
            $this.method.log('다음 방문부터 안내 투어가 다시 자동으로 시작됩니다.');
        }
    }
}
