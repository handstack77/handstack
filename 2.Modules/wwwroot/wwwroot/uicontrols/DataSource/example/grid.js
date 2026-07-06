'use strict';
let $grid = {
    prop: {
        dataSet: [
            { GroupCode: 'MD01', GroupName: '메뉴 분류', Flag: 'R' },
            { GroupCode: 'DD01', GroupName: '부서 분류', Flag: 'R' }
        ]
    },

    event: {
        btnLoadRows_click() {
            // 그리드에 데이터를 채우면(setValue), 그리드가 바인딩된 srcGrid 저장소에도 같은 값이 반영됩니다.
            syn.uicontrols.$auigrid.setValue('grdGrid', $this.prop.dataSet);
            syn.$l.eventLog('btnLoadRows_click', '샘플 데이터 2건 로드 (Flag: R)');
        },

        btnInsertRow_click() {
            // 새로 추가한 행은 Flag가 'C'(Create)로 표시됩니다.
            syn.uicontrols.$auigrid.insertRow('grdGrid', { GroupCode: 'LD01', GroupName: '노선 분류' });
            syn.$l.eventLog('btnInsertRow_click', '행 추가 (Flag: C)');
        },

        btnGetValueDefault_click() {
            // isAll을 생략(기본 false)하면 Flag가 'R'인 행(조회 후 변경 없는 행)은 제외되고 반환됩니다.
            var rows = syn.uicontrols.$data.getValue('srcGrid');
            syn.$l.eventLog('btnGetValueDefault_click', JSON.stringify(rows));
        },

        btnGetValueAll_click() {
            // isAll을 true로 주면 Flag와 상관없이 저장소의 전체 행을 그대로 돌려받습니다.
            var rows = syn.uicontrols.$data.getValue('srcGrid', true);
            syn.$l.eventLog('btnGetValueAll_click', JSON.stringify(rows));
        }
    }
}
