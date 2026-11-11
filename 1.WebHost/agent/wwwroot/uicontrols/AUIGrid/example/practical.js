'use strict';
let $practical = {
    config: {
        // dropdown 컬럼(local: true)이 코드 목록을 찾는 곳. 실무에서는 서버에서 내려준 공통코드가 캐싱된다.
        dataSource: {
            CategoryID: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    { CodeID: 'FOD', CodeValue: '식품' },
                    { CodeID: 'ELE', CodeValue: '전자기기' },
                    { CodeID: 'HOM', CodeValue: '생활용품' },
                    { CodeID: 'SPT', CodeValue: '스포츠' }
                ]
            }
        }
    },

    prop: {
        // 예제용 서버 데이터. 조회 버튼을 누르면 조건에 맞는 행만 그리드에 채운다.
        products: [
            { ProductNo: 'P001', ProductName: '유기농 현미 5kg', CategoryID: 'FOD', Price: 23000, Stock: 40, UseYN: 'Y', ReleaseDate: '2026-01-05' },
            { ProductNo: 'P002', ProductName: '콜드브루 원액 1L', CategoryID: 'FOD', Price: 15000, Stock: 25, UseYN: 'Y', ReleaseDate: '2026-02-10' },
            { ProductNo: 'P003', ProductName: '주방 세제 리필', CategoryID: 'HOM', Price: 6500, Stock: 0, UseYN: 'N', ReleaseDate: '2025-11-20' },
            { ProductNo: 'P004', ProductName: '무선 이어폰', CategoryID: 'ELE', Price: 89000, Stock: 12, UseYN: 'Y', ReleaseDate: '2026-03-15' },
            { ProductNo: 'P005', ProductName: '보조 배터리 20000mAh', CategoryID: 'ELE', Price: 42000, Stock: 33, UseYN: 'Y', ReleaseDate: '2026-04-01' },
            { ProductNo: 'P006', ProductName: '요가 매트', CategoryID: 'SPT', Price: 32000, Stock: 18, UseYN: 'Y', ReleaseDate: '2026-05-12' },
            { ProductNo: 'P007', ProductName: '스파클링 워터 24입', CategoryID: 'FOD', Price: 18000, Stock: 0, UseYN: 'N', ReleaseDate: '2026-06-03' },
            { ProductNo: 'P008', ProductName: '러닝화', CategoryID: 'SPT', Price: 99000, Stock: 9, UseYN: 'Y', ReleaseDate: '2026-07-21' }
        ]
    },

    hook: {
        pageLoad() {
            // 조회 조건의 분류 드롭다운은 그리드와 같은 코드 목록을 사용한다.
            syn.uicontrols.$select.loadData('ddlCategory', $this.config.dataSource.CategoryID, false);
            $this.method.search();
        }
    },

    method: {
        gridID() {
            return syn.uicontrols.$auigrid.getGridID('grdProduct');
        },

        search() {
            let category = syn.uicontrols.$select.getValue('ddlCategory');
            let useYN = syn.$l.get('ddlUseYN').value;
            let name = syn.uicontrols.$textbox.getValue('txtProductName').trim();

            let rows = $this.prop.products.filter((product) => {
                return (category == '' || product.CategoryID == category)
                    && (useYN == '' || product.UseYN == useYN)
                    && (name == '' || product.ProductName.indexOf(name) > -1);
            });

            // 조회 결과는 Flag 가 'R'(조회 그대로)인 상태로 채워진다.
            syn.uicontrols.$auigrid.setValue('grdProduct', rows.map((row) => { return Object.assign({}, row); }));
            syn.$l.get('spnCount').innerText = `${rows.length}건`;
            $this.method.refreshChanged();
            $this.method.refreshDetail(0);
            $this.method.setFooter();
        },

        // 하단 합계 영역: 판매가/재고 합계를 보여 준다.
        setFooter() {
            syn.uicontrols.$auigrid.setFooter('grdProduct', [
                { dataField: 'ProductName', positionField: 'ProductName', labelText: '합계' },
                { dataField: 'Price', positionField: 'Price', operation: 'SUM', style: 'auigrid-right', formatString: '#,##0' },
                { dataField: 'Stock', positionField: 'Stock', operation: 'SUM', style: 'auigrid-right', formatString: '#,##0' }
            ], true);
        },

        // 추가(C)/수정(U)/삭제(D)된 행만 객체 배열로 모은다.
        changedRows() {
            let gridID = $this.method.gridID();
            let plain = (item, flag) => {
                let row = { Flag: flag };
                Object.keys(item).forEach((key) => {
                    if (key.startsWith('_$') == false && key != 'Flag') {
                        row[key] = item[key];
                    }
                });
                return row;
            };

            let added = AUIGrid.getAddedRowItems(gridID);
            let addedIDs = added.map((item) => { return item._$uid; });
            let edited = AUIGrid.getEditedRowItems(gridID).filter((item) => { return addedIDs.includes(item._$uid) == false; });
            let removed = AUIGrid.getRemovedItems(gridID);

            return added.map((item) => { return plain(item, 'C'); })
                .concat(edited.map((item) => { return plain(item, 'U'); }))
                .concat(removed.map((item) => { return plain(item, 'D'); }));
        },

        refreshChanged() {
            let rows = $this.method.changedRows();
            syn.$l.get('spnChanged').innerText = `${rows.length}건`;
            syn.$l.get('preResult').textContent = rows.length == 0
                ? '변경된 행이 없습니다.'
                : rows.map((row) => { return `[${row.Flag}] ${row.ProductNo || '(신규)'} ${row.ProductName}`; }).join('\n');
        },

        // 선택된 행의 정보를 오른쪽 패널에 보여 준다.
        refreshDetail(rowIndex) {
            let count = syn.uicontrols.$auigrid.countRows('grdProduct');
            if (rowIndex < 0 || rowIndex >= count) {
                ['divDetailNo', 'divDetailName', 'divDetailValue', 'divDetailFlag'].forEach((id) => { syn.$l.get(id).innerText = '-'; });
                return;
            }

            let get = (field) => { return syn.uicontrols.$auigrid.getDataAtCell('grdProduct', rowIndex, field); };
            let price = Number(get('Price')) || 0;
            let stock = Number(get('Stock')) || 0;
            let flag = syn.uicontrols.$auigrid.getFlag('grdProduct', rowIndex);
            syn.$l.get('divDetailNo').innerText = get('ProductNo') || '(신규)';
            syn.$l.get('divDetailName').innerText = get('ProductName') || '-';
            syn.$l.get('divDetailValue').innerText = `${(price * stock).toLocaleString()}원`;
            syn.$l.get('divDetailFlag').innerText = flag == '' ? '조회 상태' : { C: '추가됨', U: '수정됨', D: '삭제됨' }[flag];
        },

        // 저장 전 필수값을 행 단위로 확인한다.
        validate() {
            let count = syn.uicontrols.$auigrid.countRows('grdProduct');
            for (let i = 0; i < count; i++) {
                let get = (field) => { return syn.uicontrols.$auigrid.getDataAtCell('grdProduct', i, field); };
                if (String(get('ProductName') || '').trim() == '') {
                    syn.$w.alert(`${i + 1}행: 상품명을 입력 해야합니다.`);
                    syn.uicontrols.$auigrid.selectCell('grdProduct', i, 'ProductName');
                    return false;
                }

                if (String(get('CategoryID') || '') == '') {
                    syn.$w.alert(`${i + 1}행: 분류를 선택 해야합니다.`);
                    syn.uicontrols.$auigrid.selectCell('grdProduct', i, 'CategoryID');
                    return false;
                }

                if ((Number(get('Price')) || 0) <= 0) {
                    syn.$w.alert(`${i + 1}행: 판매가는 0보다 커야 합니다.`);
                    syn.uicontrols.$auigrid.selectCell('grdProduct', i, 'Price');
                    return false;
                }
            }

            return true;
        },

        save() {
            if (syn.uicontrols.$auigrid.checkEditValue('grdProduct') == false) {
                syn.$w.alert('저장할 변경 내용이 없습니다.');
                return;
            }

            if ($this.method.validate() == false) {
                return;
            }

            let rows = $this.method.changedRows();
            syn.$l.eventLog('save', `${rows.length}건 저장 요청: ` + JSON.stringify(rows.map((row) => { return { flag: row.Flag, no: row.ProductNo }; })));

            // 서버 저장이 성공했다고 가정하고, 변경 추적 상태를 초기화한 뒤 다시 조회한다.
            syn.$w.alert(`${rows.length}건을 저장했습니다.`);
            AUIGrid.resetUpdatedItems($this.method.gridID());
            $this.method.refreshChanged();
        },

        // 삭제는 확인(Yes/No) 절차를 거친 뒤 선택한 행을 삭제 표시한다.
        removeRow() {
            let rowIndex = syn.uicontrols.$auigrid.getActiveRowIndex('grdProduct');
            if (rowIndex < 0) {
                syn.$w.alert('삭제할 행을 선택하세요.');
                return;
            }

            let alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            syn.$w.alert(`${rowIndex + 1}행을 삭제 하시겠습니까?`, '삭제 확인', alertOptions, (result) => {
                if (result == 'Yes') {
                    syn.uicontrols.$auigrid.removeRow('grdProduct', 'ProductName', rowIndex);
                    $this.method.refreshChanged();
                    $this.method.refreshDetail(syn.uicontrols.$auigrid.getActiveRowIndex('grdProduct'));
                }
            });
        }
    },

    event: {
        grdProduct_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            $this.method.refreshDetail(rowIndex);
        },

        grdProduct_afterChange(elID, rowIndex, columnIndex, dataField, oldValue, newValue, item) {
            $this.method.refreshChanged();
            $this.method.refreshDetail(rowIndex);
        },

        btnSearch_click() {
            if (syn.uicontrols.$auigrid.checkEditValue('grdProduct') == true) {
                let alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'question';
                alertOptions.buttonType = '3';
                syn.$w.alert('저장하지 않은 변경 내용이 있습니다. 다시 조회할까요?', '확인', alertOptions, (result) => {
                    if (result == 'Yes') {
                        $this.method.search();
                    }
                });
            }
            else {
                $this.method.search();
            }
        },

        btnSave_click() {
            $this.method.save();
        },

        btnAddRow_click() {
            syn.uicontrols.$auigrid.insertRow('grdProduct', { index: 'last', values: { UseYN: 'Y', Stock: 0, Price: 0 } });
            let last = syn.uicontrols.$auigrid.countRows('grdProduct') - 1;
            syn.uicontrols.$auigrid.selectCell('grdProduct', last, 'ProductName');
            $this.method.refreshChanged();
        },

        btnRemoveRow_click() {
            $this.method.removeRow();
        },

        btnExcel_click() {
            syn.uicontrols.$auigrid.exportFile('grdProduct', { type: 'xlsx', fileName: 'products.xlsx' });
        }
    }
}
