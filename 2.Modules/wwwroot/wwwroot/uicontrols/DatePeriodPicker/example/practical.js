'use strict';
let $practical = {
    prop: {
        channelNames: { ONL: '온라인', OFF: '오프라인', PHN: '전화 주문' },
        maxMonths: 6,
        sales: []
    },

    hook: {
        pageLoad() {
            // 예제용 매출 데이터: 오늘 기준으로 최근 8개월 동안 며칠 간격으로 생성한다(실제 화면에서는 서버 조회 결과를 사용한다).
            let customers = ['김민준', '이서연', '박지후', '최하윤', '정도윤', '강서아'];
            let channels = ['ONL', 'OFF', 'PHN'];
            let products = ['기본 요금제', '프리미엄 요금제', '추가 저장공간', '교육 과정', '유지보수 계약'];
            for (let i = 0; i < 60; i++) {
                $this.prop.sales.push({
                    SalesDate: moment().subtract(i * 4, 'days').format('YYYY-MM-DD'),
                    CustomerName: customers[i % customers.length],
                    Channel: channels[(i * 7) % channels.length],
                    ProductName: products[(i * 3) % products.length],
                    Amount: 10000 + ((i * 7919) % 90) * 1000
                });
            }

            // 기본 조회 기간(value: 'month:-1')이 채워진 상태에서 바로 첫 조회를 실행한다.
            $this.method.search();
        }
    },

    method: {
        getPeriod() {
            return {
                startDate: syn.$l.get('dtpSalesDate_StartedAt').value.trim(),
                endDate: syn.$l.get('dtpSalesDate_EndedAt').value.trim()
            };
        },

        validatePeriod(period) {
            if (period.startDate == '' || period.endDate == '') {
                syn.$w.alert('조회 기간을 입력 하세요');
                return false;
            }

            // YYYY-MM-DD 형식이라 문자열 비교로 선후를 판단할 수 있다.
            if (period.startDate > period.endDate) {
                syn.$w.alert('종료 일은 시작 일보다 이전 일 수 없습니다.');
                return false;
            }

            if (moment(period.endDate).diff(moment(period.startDate), 'months', true) > $this.prop.maxMonths) {
                syn.$w.alert(`조회 기간은 최대 ${$this.prop.maxMonths}개월까지 선택할 수 있습니다.`);
                return false;
            }

            return true;
        },

        search() {
            let period = $this.method.getPeriod();
            if ($this.method.validatePeriod(period) == false) {
                return;
            }

            let channel = syn.$l.get('ddlChannel').value;
            let customerName = syn.uicontrols.$textbox.getValue('txtCustomerName').trim();

            let items = $this.prop.sales.filter((sale) => {
                return sale.SalesDate >= period.startDate && sale.SalesDate <= period.endDate
                    && (channel == '' || sale.Channel == channel)
                    && (customerName == '' || sale.CustomerName.indexOf(customerName) > -1);
            });

            let html = items.map((sale) => {
                return `<tr><td>${sale.SalesDate}</td><td>${sale.CustomerName}</td><td>${$this.prop.channelNames[sale.Channel]}</td><td>${sale.ProductName}</td><td class="text-end">${sale.Amount.toLocaleString()}</td></tr>`;
            }).join('');

            syn.$l.get('tbodySales').innerHTML = html == '' ? '<tr><td colspan="5" class="text-center text-muted">조회된 매출이 없습니다.</td></tr>' : html;
            let total = items.reduce((sum, sale) => { return sum + sale.Amount; }, 0);
            syn.$l.get('spnSummary').innerText = `${items.length}건 / 합계 ${total.toLocaleString()}원 (${period.startDate} ~ ${period.endDate})`;
        },

        reset() {
            syn.uicontrols.$dateperiodpicker.clear('dtpSalesDate');
            syn.$l.get('ddlChannel').value = '';
            syn.uicontrols.$textbox.clear('txtCustomerName');
            syn.$l.get('tbodySales').innerHTML = '<tr><td colspan="5" class="text-center text-muted">조회 기간을 선택한 뒤 조회하세요.</td></tr>';
            syn.$l.get('spnSummary').innerText = '0건';
        }
    },

    event: {
        btnSearch_click() {
            $this.method.search();
        },

        btnReset_click() {
            $this.method.reset();
        },

        // 팝업에서 "확인"을 누르면 곧바로 조회한다.
        dtpSalesDate_onconfirm() {
            $this.method.search();
        },

        dtpSalesDate_onreset() {
            $this.method.reset();
        }
    }
}
