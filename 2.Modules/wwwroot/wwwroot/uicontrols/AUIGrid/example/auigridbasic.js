'use strict';
let $auigridbasic = {
    config: {
        // dropdown 컬럼이 local:true + dataSourceID로 코드 목록을 찾는 곳.
        // 실무에서는 서버에서 내려준 공통코드가 여기(mod.config.dataSource)에 캐싱된다.
        dataSource: {
            CategoryID: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    { CodeID: 'ELEC', CodeValue: '전자제품' },
                    { CodeID: 'FURN', CodeValue: '가구' },
                    { CodeID: 'APPL', CodeValue: '생활가전' }
                ]
            }
        }
    },

    prop: {
        dataSet: [
            { ProdID: 'P001', ProdName: '모니터', CategoryID: 'ELEC', Price: 259000, UseYN: 'Y', ReleaseDate: '2026-01-05' },
            { ProdID: 'P002', ProdName: '키보드', CategoryID: 'ELEC', Price: 49000, UseYN: 'Y', ReleaseDate: '2026-02-10' },
            { ProdID: 'P003', ProdName: '스탠드 조명', CategoryID: 'FURN', Price: 39000, UseYN: 'N', ReleaseDate: '2025-11-20' }
        ]
    },

    event: {
        btnLoadRows_click() {
            syn.uicontrols.$auigrid.setValue('grdProduct', $this.prop.dataSet);
            syn.$l.eventLog('btnLoadRows_click', '샘플 데이터 3건 로드');
        },

        btnGetValue_click() {
            var rows = syn.uicontrols.$auigrid.getValue('grdProduct', 'List');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(rows));
        },

        btnClear_click() {
            syn.uicontrols.$auigrid.clear('grdProduct');
        },

        grdProduct_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            syn.$l.eventLog('grdProduct_afterSelectionEnd', '{0},{1},{2}'.format(rowIndex, columnIndex, dataField));
        },

        grdProduct_afterChange(elID, rowIndex, columnIndex, dataField, oldValue, newValue, item) {
            syn.$l.eventLog('grdProduct_afterChange', '{0}: {1} -> {2}'.format(dataField, oldValue, newValue));
        },

        grdProduct_filtering(evt) {
            syn.$l.eventLog('grdProduct_filtering', '헤더 인라인 필터 조건 변경');
        }
    }
}
