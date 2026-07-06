'use strict';
let $jqgridbasic = {
    hook: {
        pageLoad() {
            // syn_jqgrid 커스텀 태그가 없으므로 controlLoad를 페이지에서 직접 호출합니다.
            syn.uicontrols.$jqgrid.controlLoad('grdLegacy', {
                caption: '레거시 제품 목록',
                gridWidth: 600,
                gridHeight: '260px',
                rowNumbers: true,
                multiSelect: false,
                colModels: [
                    { name: 'ProdID', label: '제품코드', width: 120, key: true, edittype: 'text' },
                    { name: 'ProdName', label: '제품명', width: 200, edittype: 'text' },
                    { name: 'Price', label: '가격', width: 120, align: 'right', edittype: 'text' }
                ]
            });

            syn.uicontrols.$jqgrid.dataBinding('grdLegacy', [
                { ProdID: 'P001', ProdName: '모니터', Price: 250000 },
                { ProdID: 'P002', ProdName: '키보드', Price: 45000 }
            ]);
        }
    },

    event: {
        btnAddRow_click() {
            syn.uicontrols.$jqgrid.addRow('grdLegacy', { ProdID: '', ProdName: '', Price: 0 }, 'last');
            syn.$l.eventLog('btnAddRow_click', '행 추가');
        },

        btnDeleteRow_click() {
            var rowid = syn.uicontrols.$jqgrid.getFocusRowID('grdLegacy');
            if (rowid) {
                syn.uicontrols.$jqgrid.deleteRow('grdLegacy', rowid);
                syn.$l.eventLog('btnDeleteRow_click', '행 삭제: ' + rowid);
            }
        },

        btnGetUpdateDatas_click() {
            var rows = syn.uicontrols.$jqgrid.getUpdateDatas('grdLegacy');
            syn.$l.eventLog('btnGetUpdateDatas_click', JSON.stringify(rows));
        },

        grdLegacy_onSelectRow(rowid, status) {
            syn.$l.eventLog('grdLegacy_onSelectRow', rowid);
        }
    }
}
