'use strict';
let $practical = {
    prop: {
        // 시/도 → 시/군/구 연동 목록(실제 화면에서는 서버 코드 조회 결과를 사용한다).
        regions: [
            { CodeID: 'SEO', CodeValue: '서울', Districts: [{ CodeID: 'JUN', CodeValue: '중구' }, { CodeID: 'GNM', CodeValue: '강남구' }, { CodeID: 'MAP', CodeValue: '마포구' }] },
            { CodeID: 'GYG', CodeValue: '경기', Districts: [{ CodeID: 'SUW', CodeValue: '수원시' }, { CodeID: 'SEN', CodeValue: '성남시' }] },
            { CodeID: 'BUS', CodeValue: '부산', Districts: [{ CodeID: 'HAE', CodeValue: '해운대구' }, { CodeID: 'SUY', CodeValue: '수영구' }] }
        ],
        statusNames: { REC: '접수', PAY: '결제 완료', SHP: '배송 중', DON: '배송 완료', CAN: '취소' },
        orders: [
            { OrderNo: 'O-1001', CustomerName: '김민준', Region: 'SEO', District: 'JUN', Status: 'REC', Amount: 45000 },
            { OrderNo: 'O-1002', CustomerName: '이서연', Region: 'SEO', District: 'GNM', Status: 'PAY', Amount: 128000 },
            { OrderNo: 'O-1003', CustomerName: '박지후', Region: 'SEO', District: 'MAP', Status: 'SHP', Amount: 73000 },
            { OrderNo: 'O-1004', CustomerName: '최하윤', Region: 'GYG', District: 'SUW', Status: 'DON', Amount: 36000 },
            { OrderNo: 'O-1005', CustomerName: '정도윤', Region: 'GYG', District: 'SEN', Status: 'PAY', Amount: 91000 },
            { OrderNo: 'O-1006', CustomerName: '강서아', Region: 'BUS', District: 'HAE', Status: 'SHP', Amount: 54000 },
            { OrderNo: 'O-1007', CustomerName: '조은우', Region: 'BUS', District: 'SUY', Status: 'CAN', Amount: 22000 },
            { OrderNo: 'O-1008', CustomerName: '윤지안', Region: 'SEO', District: 'GNM', Status: 'DON', Amount: 167000 },
            { OrderNo: 'O-1009', CustomerName: '장예준', Region: 'GYG', District: 'SUW', Status: 'REC', Amount: 31000 },
            { OrderNo: 'O-1010', CustomerName: '임수아', Region: 'BUS', District: 'HAE', Status: 'DON', Amount: 84000 }
        ]
    },

    hook: {
        pageLoad() {
            // 시/도 목록은 이미 가지고 있는 데이터로 채운다(loadData). placeholder 옵션은 required 가 false 일 때 자동으로 추가된다.
            syn.uicontrols.$select.loadData('ddlRegion', {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: $this.prop.regions.map((item) => { return { CodeID: item.CodeID, CodeValue: item.CodeValue }; })
            }, false);

            $this.method.loadDistricts('');
            $this.method.search();
        }
    },

    method: {
        regionName(code, districtCode) {
            let region = $this.prop.regions.find((item) => { return item.CodeID == code; });
            if (region == null) {
                return '';
            }

            let district = region.Districts.find((item) => { return item.CodeID == districtCode; });
            return `${region.CodeValue} ${district ? district.CodeValue : ''}`.trim();
        },

        // 선택한 시/도에 속한 시/군/구만 다시 채운다. 시/도가 비어 있으면 목록도 비운다.
        loadDistricts(regionCode) {
            let region = $this.prop.regions.find((item) => { return item.CodeID == regionCode; });
            syn.uicontrols.$select.loadData('ddlDistrict', {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: region ? region.Districts : []
            }, false);
        },

        search() {
            let region = syn.uicontrols.$select.getValue('ddlRegion');
            let district = syn.uicontrols.$select.getValue('ddlDistrict');
            let status = syn.uicontrols.$select.getValue('ddlStatus');
            let customerName = syn.uicontrols.$textbox.getValue('txtCustomerName').trim();

            let items = $this.prop.orders.filter((order) => {
                return (region == '' || order.Region == region)
                    && (district == '' || order.District == district)
                    && (status == '' || order.Status == status)
                    && (customerName == '' || order.CustomerName.indexOf(customerName) > -1);
            });

            let html = items.map((order) => {
                return `<tr><td>${order.OrderNo}</td><td>${order.CustomerName}</td><td>${$this.method.regionName(order.Region, order.District)}</td><td>${$this.prop.statusNames[order.Status]}</td><td class="text-end">${order.Amount.toLocaleString()}</td></tr>`;
            }).join('');

            syn.$l.get('tbodyOrders').innerHTML = html == '' ? '<tr><td colspan="5" class="text-center text-muted">조회된 주문이 없습니다.</td></tr>' : html;
            syn.$l.get('spnCount').innerText = `${items.length}건 / 합계 ${items.reduce((sum, order) => { return sum + order.Amount; }, 0).toLocaleString()}원`;
        },

        reset() {
            syn.uicontrols.$select.clear('ddlRegion');
            syn.uicontrols.$select.clear('ddlStatus');
            $this.method.loadDistricts('');
            syn.uicontrols.$textbox.clear('txtCustomerName');
            $this.method.search();
        }
    },

    event: {
        btnSearch_click() {
            $this.method.search();
        },

        btnReset_click() {
            $this.method.reset();
        },

        ddlRegion_change() {
            $this.method.loadDistricts(syn.uicontrols.$select.getValue('ddlRegion'));
            $this.method.search();
        },

        ddlDistrict_change() {
            $this.method.search();
        },

        ddlStatus_change() {
            $this.method.search();
        }
    }
}
