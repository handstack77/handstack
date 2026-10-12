'use strict';
let $features = {
    config: {
        // dropdown 컬럼이 local:true + dataSourceID 로 코드 목록을 찾는 곳(실무에서는 서버 공통코드가 캐싱된다).
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
        // getValue('List', metaColumns) 가 컬럼 값을 전송 형식으로 바꿀 때 사용하는 매핑
        metaColumns: {
            ProductNo: { fieldID: 'ProductNo', dataType: 'string' },
            ProductName: { fieldID: 'ProductName', dataType: 'string' },
            CategoryID: { fieldID: 'CategoryID', dataType: 'string' },
            Price: { fieldID: 'Price', dataType: 'number' },
            Stock: { fieldID: 'Stock', dataType: 'number' },
            UseYN: { fieldID: 'UseYN', dataType: 'string' }
        },
        isMerged: false,
        isFixed: true,
        isTall: true
    },

    method: {
        samples() {
            let names = ['유기농 현미', '콜드브루 원액', '주방 세제', '무선 이어폰', '보조 배터리', '요가 매트', '스파클링 워터', '러닝화', '프로그래밍 입문서', '견과류 세트'];
            let categories = ['FOD', 'FOD', 'HOM', 'ELE', 'ELE', 'SPT', 'FOD', 'SPT', 'HOM', 'FOD'];
            let rows = [];
            for (let i = 0; i < 20; i++) {
                rows.push({
                    ProductNo: 'P' + String(i + 1).padStart(3, '0'),
                    ProductName: names[i % names.length] + (i >= names.length ? ' 2' : ''),
                    CategoryID: categories[i % categories.length],
                    Price: 5000 + ((i * 7919) % 90) * 1000,
                    Stock: (i * 13) % 50,
                    UseYN: i % 4 == 3 ? 'N' : 'Y',
                    ReleaseDate: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
                    Homepage: 'https://example.com/products/' + (i + 1),
                    Detail: '보기',
                    Memo: i % 5 == 0 ? '신상품' : ''
                });
            }

            return rows;
        },

        show(title, data) {
            let text = typeof data == 'string' ? data : JSON.stringify(data, null, 2);
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text.length > 140 ? text.slice(0, 140) + '...' : text);
        },

        // 그리드 내부 관리용 키(밑줄+달러로 시작)를 제외한 평범한 행 객체로 바꾼다.
        plainRow(item, flag) {
            let row = { Flag: flag };
            Object.keys(item).forEach((key) => {
                if (key.startsWith('_$') == false && key != 'Flag') {
                    row[key] = item[key];
                }
            });

            return row;
        },

        // 추가(C)/수정(U)/삭제(D)된 행만 객체 배열로 모은다(AUIGrid 원본 API 사용).
        changedRows() {
            let gridID = syn.uicontrols.$auigrid.getGridID('grdProduct');
            let added = AUIGrid.getAddedRowItems(gridID);
            let addedIDs = added.map((item) => { return item._$uid; });
            let edited = AUIGrid.getEditedRowItems(gridID).filter((item) => { return addedIDs.includes(item._$uid) == false; });
            let removed = AUIGrid.getRemovedItems(gridID);
            return added.map((item) => { return $this.method.plainRow(item, 'C'); })
                .concat(edited.map((item) => { return $this.method.plainRow(item, 'U'); }))
                .concat(removed.map((item) => { return $this.method.plainRow(item, 'D'); }));
        },

        selectedRow() {
            return syn.uicontrols.$auigrid.getActiveRowIndex('grdProduct');
        }
    },

    hook: {
        pageLoad() {
            syn.uicontrols.$auigrid.setValue('grdProduct', $this.method.samples());
        }
    },

    event: {
        grdProduct_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            syn.$l.eventLog('grdProduct_afterSelectionEnd', `${rowIndex}행, ${dataField} = ${value}`);
        },

        grdProduct_afterChange(elID, rowIndex, columnIndex, dataField, oldValue, newValue, item) {
            syn.$l.eventLog('grdProduct_afterChange', `${rowIndex}행 ${dataField}: ${oldValue} -> ${newValue} (Flag=${syn.uicontrols.$auigrid.getFlag(elID, rowIndex)})`);
        },

        grdProduct_cellEditEnd(elID, evt) {
            syn.$l.eventLog('grdProduct_cellEditEnd', `${evt.dataField} 편집 종료`);
        },

        grdProduct_cellButtonClick(elID, rowIndex, columnIndex, dataField, item) {
            syn.$l.eventLog('grdProduct_cellButtonClick', `${item.ProductNo} 상세 버튼 클릭`);
        },

        grdProduct_filtering(evt) {
            syn.$l.eventLog('grdProduct_filtering', '필터 조건 변경');
        },

        grdProduct_sorting(evt) {
            syn.$l.eventLog('grdProduct_sorting', '정렬 변경');
        },

        btnLoad_click() {
            syn.uicontrols.$auigrid.setValue('grdProduct', $this.method.samples());
        },

        btnClear_click() {
            syn.uicontrols.$auigrid.clear('grdProduct');
        },

        btnInsertLast_click() {
            syn.uicontrols.$auigrid.insertRow('grdProduct', { index: 'last' });
        },

        btnInsertFirst_click() {
            syn.uicontrols.$auigrid.insertRow('grdProduct', { index: 'first', values: { ProductNo: 'NEW001', ProductName: '신규 상품', CategoryID: 'ELE', Price: 10000, UseYN: 'Y' } });
        },

        btnInsertDown_click() {
            syn.uicontrols.$auigrid.insertRow('grdProduct', { index: 'selectionDown', values: { ProductName: '선택 행 아래 추가' } });
        },

        btnInsertMany_click() {
            syn.uicontrols.$auigrid.insertRow('grdProduct', { index: 'last', amount: 3, values: { UseYN: 'Y' } });
        },

        btnRemove_click() {
            syn.uicontrols.$auigrid.removeRow('grdProduct');
        },

        btnUpdateRow_click() {
            syn.uicontrols.$auigrid.updateRow('grdProduct', { ProductName: 'updateRow 로 변경한 이름', Price: 77000 }, 0);
        },

        // 추가(C)/수정(U)/삭제(D)된 행만 객체 배열로 보여 준다.
        btnGetList_click() {
            $this.method.show('btnGetList_click', $this.method.changedRows());
        },

        // 트랜잭션으로 보낼 때 쓰는 형식: metaColumns 를 넘기면 행마다 [{prop, val}, ...] 배열로 변환된다.
        btnGetListMeta_click() {
            $this.method.show('btnGetListMeta_click', syn.uicontrols.$auigrid.getValue('grdProduct', 'List', $this.prop.metaColumns));
        },

        btnFlags_click() {
            let count = syn.uicontrols.$auigrid.countRows('grdProduct');
            let flags = [];
            for (let i = 0; i < count; i++) {
                let flag = syn.uicontrols.$auigrid.getFlag('grdProduct', i);
                if (flag != '') {
                    flags.push(`${i}행: ${flag}`);
                }
            }

            $this.method.show('btnFlags_click', flags.length == 0 ? '(변경된 행 없음)' : flags.join('\n'));
        },

        btnSetFlag_click() {
            syn.uicontrols.$auigrid.setFlag('grdProduct', $this.method.selectedRow(), 'U');
        },

        btnIsUpdate_click() {
            $this.method.show('btnIsUpdate_click', `isUpdateData: ${syn.uicontrols.$auigrid.isUpdateData('grdProduct')}, checkEditValue: ${syn.uicontrols.$auigrid.checkEditValue('grdProduct')}`);
        },

        btnGridData_click() {
            $this.method.show('btnGridData_click', syn.uicontrols.$auigrid.getGridData('grdProduct').slice(0, 3));
        },

        btnGetCell_click() {
            let row = $this.method.selectedRow();
            $this.method.show('btnGetCell_click', `${row}행 상품명: ${syn.uicontrols.$auigrid.getDataAtCell('grdProduct', row, 'ProductName')}`);
        },

        btnSetCell_click() {
            let row = $this.method.selectedRow();
            let price = Number(syn.uicontrols.$auigrid.getDataAtCell('grdProduct', row, 'Price')) || 0;
            syn.uicontrols.$auigrid.setDataAtCell('grdProduct', row, 'Price', price + 1000);
        },

        btnGetCol_click() {
            $this.method.show('btnGetCol_click', syn.uicontrols.$auigrid.getDataAtCol('grdProduct', 'Price'));
        },

        btnActive_click() {
            $this.method.show('btnActive_click', `선택 행: ${syn.uicontrols.$auigrid.getActiveRowIndex('grdProduct')}, 선택 열: ${syn.uicontrols.$auigrid.getActiveColIndex('grdProduct')}, 전체 행: ${syn.uicontrols.$auigrid.countRows('grdProduct')}`);
        },

        btnSelectCell_click() {
            syn.uicontrols.$auigrid.selectCell('grdProduct', 2, 'Price');
        },

        btnFindRow_click() {
            let index = syn.uicontrols.$auigrid.getRowIndexByValue('grdProduct', 'ProductNo', 'P005');
            $this.method.show('btnFindRow_click', `P005 의 행 번호: ${index}`);
            if (index > -1) {
                syn.uicontrols.$auigrid.selectCell('grdProduct', index, 'ProductName');
            }
        },

        btnSearch_click() {
            syn.uicontrols.$auigrid.search('grdProduct', 'ProductName', '이어폰');
        },

        btnFilter_click() {
            syn.uicontrols.$auigrid.addCondition('grdProduct', 'Price', 'gte', 50000);
        },

        btnClearFilter_click() {
            syn.uicontrols.$auigrid.clearConditions('grdProduct');
        },

        btnSort_click() {
            syn.uicontrols.$auigrid.setSorting('grdProduct', [{ dataField: 'Price', sortType: -1 }]);
        },

        btnClearSort_click() {
            syn.uicontrols.$auigrid.clearSorting('grdProduct');
        },

        btnHideMemo_click() {
            syn.uicontrols.$auigrid.visibleColumns('grdProduct', ['Memo'], false);
        },

        btnShowMemo_click() {
            syn.uicontrols.$auigrid.visibleColumns('grdProduct', ['Memo'], true);
        },

        btnFixed_click() {
            $this.prop.isFixed = !$this.prop.isFixed;
            syn.uicontrols.$auigrid.setFixedColumnCount('grdProduct', $this.prop.isFixed == true ? 2 : 0);
        },

        btnFooter_click() {
            syn.uicontrols.$auigrid.setFooter('grdProduct', [
                { dataField: 'ProductName', positionField: 'ProductName', labelText: '합계' },
                { dataField: 'Price', positionField: 'Price', operation: 'SUM', style: 'auigrid-right', formatString: '#,##0' },
                { dataField: 'Stock', positionField: 'Stock', operation: 'SUM', style: 'auigrid-right', formatString: '#,##0' }
            ], true);
        },

        btnSize_click() {
            $this.prop.isTall = !$this.prop.isTall;
            syn.uicontrols.$auigrid.setControlSize('grdProduct', { height: $this.prop.isTall == true ? 360 : 200 });
        },

        btnMerge_click() {
            $this.prop.isMerged = !$this.prop.isMerged;
            syn.uicontrols.$auigrid.setCellMerge('grdProduct', $this.prop.isMerged);
        },

        async btnExportJson_click() {
            $this.method.show('btnExportJson_click', await syn.uicontrols.$auigrid.exportAsString('grdProduct', { type: 'json' }));
        },

        async btnExportCsv_click() {
            $this.method.show('btnExportCsv_click', await syn.uicontrols.$auigrid.exportAsString('grdProduct', { type: 'csv' }));
        },

        btnExportXlsx_click() {
            syn.uicontrols.$auigrid.exportFile('grdProduct', { type: 'xlsx', fileName: 'products.xlsx' });
        }
    }
}
