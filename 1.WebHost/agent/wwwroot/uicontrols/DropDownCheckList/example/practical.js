'use strict';
let $practical = {
    prop: {
        categoryNames: { FOD: '식품', BEV: '음료', HOM: '생활용품', ELE: '전자기기', BKS: '도서', SPT: '스포츠' },
        saleNames: { ON: '판매 중', OUT: '품절', STOP: '판매 중지' },
        products: [
            { ProductNo: 'P-001', ProductName: '유기농 현미 5kg', Category: 'FOD', SaleStatus: 'ON', Price: 23000 },
            { ProductNo: 'P-002', ProductName: '콜드브루 원액 1L', Category: 'BEV', SaleStatus: 'ON', Price: 15000 },
            { ProductNo: 'P-003', ProductName: '주방 세제 리필', Category: 'HOM', SaleStatus: 'OUT', Price: 6500 },
            { ProductNo: 'P-004', ProductName: '무선 이어폰', Category: 'ELE', SaleStatus: 'ON', Price: 89000 },
            { ProductNo: 'P-005', ProductName: '프로그래밍 입문서', Category: 'BKS', SaleStatus: 'STOP', Price: 28000 },
            { ProductNo: 'P-006', ProductName: '요가 매트', Category: 'SPT', SaleStatus: 'ON', Price: 32000 },
            { ProductNo: 'P-007', ProductName: '스파클링 워터 24입', Category: 'BEV', SaleStatus: 'OUT', Price: 18000 },
            { ProductNo: 'P-008', ProductName: '보조 배터리 20000mAh', Category: 'ELE', SaleStatus: 'ON', Price: 42000 },
            { ProductNo: 'P-009', ProductName: '견과류 선물 세트', Category: 'FOD', SaleStatus: 'STOP', Price: 35000 },
            { ProductNo: 'P-010', ProductName: '러닝화', Category: 'SPT', SaleStatus: 'ON', Price: 99000 }
        ]
    },

    hook: {
        pageLoad() {
            $this.method.search();
        }
    },

    method: {
        // 다중 선택 값은 콤마 문자열로 반환되므로, 비어 있으면 '전체'로 보고 아니면 배열로 나눠 비교한다.
        selectedValues(elID) {
            let value = syn.uicontrols.$multiselect.getValue(elID);
            return value == '' ? [] : value.split(',');
        },

        search() {
            let categories = $this.method.selectedValues('ddlCategory');
            let saleStatuses = $this.method.selectedValues('ddlSaleStatus');
            let productName = syn.uicontrols.$textbox.getValue('txtProductName').trim();

            let items = $this.prop.products.filter((product) => {
                return (categories.length == 0 || categories.includes(product.Category))
                    && (saleStatuses.length == 0 || saleStatuses.includes(product.SaleStatus))
                    && (productName == '' || product.ProductName.indexOf(productName) > -1);
            });

            let html = items.map((product) => {
                return `<tr><td>${product.ProductNo}</td><td>${product.ProductName}</td><td>${$this.prop.categoryNames[product.Category]}</td><td>${$this.prop.saleNames[product.SaleStatus]}</td><td class="text-end">${product.Price.toLocaleString()}</td></tr>`;
            }).join('');

            syn.$l.get('tbodyProducts').innerHTML = html == '' ? '<tr><td colspan="5" class="text-center text-muted">조회된 상품이 없습니다.</td></tr>' : html;
            syn.$l.get('spnCount').innerText = `${items.length}건`;

            let conditions = [];
            if (categories.length > 0) {
                conditions.push('분류: ' + syn.uicontrols.$multiselect.getSelectedText('ddlCategory').join(', '));
            }

            if (saleStatuses.length > 0) {
                conditions.push('상태: ' + syn.uicontrols.$multiselect.getSelectedText('ddlSaleStatus').join(', '));
            }

            if (productName != '') {
                conditions.push(`상품명: ${productName}`);
            }

            syn.$l.get('spnCondition').innerText = conditions.length == 0 ? '전체' : conditions.join(' / ');
        },

        reset() {
            syn.uicontrols.$multiselect.clear('ddlCategory');
            syn.uicontrols.$multiselect.clear('ddlSaleStatus');
            syn.uicontrols.$textbox.clear('txtProductName');
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

        ddlCategory_change() {
            $this.method.search();
        },

        ddlSaleStatus_change() {
            $this.method.search();
        }
    }
}
