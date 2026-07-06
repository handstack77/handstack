'use strict';
let $chartjsbasic = {
    prop: {
        // setValue(elID, value, metaColumns)에 넘길 "행 배열"입니다.
        // labelID('YEAR')와 series에 정의한 columnID(AMOUNT1, AMOUNT2)가 각 행의 키와 일치해야 합니다.
        dataSource: [
            { YEAR: 2022, AMOUNT1: 12, AMOUNT2: 20 },
            { YEAR: 2023, AMOUNT1: 35, AMOUNT2: 15 },
            { YEAR: 2024, AMOUNT1: 18, AMOUNT2: 30 },
            { YEAR: 2025, AMOUNT1: 42, AMOUNT2: 25 }
        ],

        // setValue는 각 컬럼 값의 타입을 metaColumns[컬럼명].DataType과 대조해서 검증합니다.
        // 여기 없는 컬럼은 검증을 건너뜁니다. DataType이 실제 값과 안 맞으면 조용히 반영을 건너뜁니다.
        metaColumns: {
            YEAR: { FieldID: 'YEAR', DataType: 'int' },
            AMOUNT1: { FieldID: 'AMOUNT1', DataType: 'int' },
            AMOUNT2: { FieldID: 'AMOUNT2', DataType: 'int' }
        }
    },

    event: {
        btnGetValue_click() {
            // 주의(API.md 참고): $chartjs.getValue는 실제 구현이 없는 스텁이라 항상 ''을 반환합니다.
            syn.$l.eventLog('btnGetValue_click', '반환값: "' + syn.uicontrols.$chartjs.getValue('chtChart') + '" (항상 빈 문자열)');
        },

        btnSetValue_click() {
            syn.uicontrols.$chartjs.setValue('chtChart', $this.prop.dataSource, $this.prop.metaColumns);
        },

        btnClear_click() {
            syn.uicontrols.$chartjs.clear('chtChart');
        }
    }
}
