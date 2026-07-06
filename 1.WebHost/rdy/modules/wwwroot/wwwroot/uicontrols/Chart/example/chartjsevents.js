'use strict';
let $chartjsevents = {
    prop: {
        dataSource: [
            { MONTH: '1월', VISIT: 120, SIGNUP: 20 },
            { MONTH: '2월', VISIT: 150, SIGNUP: 35 },
            { MONTH: '3월', VISIT: 90, SIGNUP: 18 },
            { MONTH: '4월', VISIT: 200, SIGNUP: 42 }
        ],
        metaColumns: {
            MONTH: { FieldID: 'MONTH', DataType: 'string' },
            VISIT: { FieldID: 'VISIT', DataType: 'int' },
            SIGNUP: { FieldID: 'SIGNUP', DataType: 'int' }
        }
    },

    event: {
        btnSetValue_click() {
            syn.uicontrols.$chartjs.setValue('chtTrend', $this.prop.dataSource, $this.prop.metaColumns);
        },

        btnGetChartControl_click() {
            // getChartControl(elID)은 { id, chart, config, value } 래퍼 객체를 반환합니다.
            // (Highcharts 쪽 $chart.getChartControl과 달리 차트 인스턴스가 아니라 래퍼임에 주의)
            var control = syn.uicontrols.$chartjs.getChartControl('chtTrend');
            if (control) {
                control.chart.options.plugins = control.chart.options.plugins || {};
                control.chart.options.plugins.title = { display: true, text: '월별 방문자/가입자 추이' };
                control.chart.update();
                syn.$l.eventLog('btnGetChartControl_click', '차트 제목을 직접 설정했습니다.');
            }
        },

        btnClear_click() {
            syn.uicontrols.$chartjs.clear('chtTrend');
        }
    }
}
