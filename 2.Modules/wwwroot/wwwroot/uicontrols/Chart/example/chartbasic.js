'use strict';
let $chartbasic = {
    prop: {
        // $chart.setValue는 Highcharts 시리즈 객체 배열([{ name, data }, ...])을 그대로 받습니다.
        // (참고: $chartjs.setValue는 이와 달리 "행 배열 + 컬럼 메타데이터"를 받습니다. API.md 참고)
        newSeries: [
            { name: '2026(예상)', data: [25, 40, 33, 50] }
        ]
    },

    event: {
        btnGetValue_click() {
            // getValue는 [{ name, data }] 형태로 각 시리즈 값을 돌려줍니다.
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$chart.getValue('chtSales')));
        },

        btnSetValue_click() {
            // 주의(API.md "알려진 이슈" 참고): $chart.setValue는 시리즈 교체 자체는 정상 적용하지만,
            // 내부 구현에 남아있는 참조 오류(control이 어디에도 선언되어 있지 않음) 때문에
            // 곧바로 ReferenceError를 던집니다. 화면에는 새 시리즈가 반영되는 것을 확인할 수 있습니다.
            try {
                syn.uicontrols.$chart.setValue('chtSales', $this.prop.newSeries);
                syn.$l.eventLog('btnSetValue_click', '예외 없이 완료됨(예상과 다름, 소스 변경 여부 확인 필요)');
            } catch (error) {
                syn.$l.eventLog('btnSetValue_click', '알려진 버그로 예외 발생(시리즈 자체는 이미 반영됨): ' + error.message, 'Debug');
            }
        },

        btnClear_click() {
            syn.uicontrols.$chart.clear('chtSales');
        },

        btnToImage_click() {
            // 주의(API.md "알려진 이슈" 참고): toImage는 이 저장소에 포함되어 있지 않은
            // 전역 download 함수를 참조하므로 ReferenceError가 발생할 수 있습니다.
            try {
                syn.uicontrols.$chart.toImage('chtSales', 'sales-chart');
            } catch (error) {
                syn.$l.eventLog('btnToImage_click', 'download 라이브러리 미포함으로 예외 발생: ' + error.message, 'Debug');
            }
        }
    }
}
