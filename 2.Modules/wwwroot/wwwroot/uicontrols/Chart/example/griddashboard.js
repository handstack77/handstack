'use strict';
let $griddashboard = {
    prop: {
        dataSet: [
            { WorkingDate: '07-14', WorkingTime: 8, ExtendedWorkingTime: 0 },
            { WorkingDate: '07-15', WorkingTime: 8, ExtendedWorkingTime: 1.5 },
            { WorkingDate: '07-16', WorkingTime: 8, ExtendedWorkingTime: 0 },
            { WorkingDate: '07-17', WorkingTime: 8, ExtendedWorkingTime: 2 },
            { WorkingDate: '07-18', WorkingTime: 7, ExtendedWorkingTime: 0 }
        ],

        metaColumns: {
            WorkingDate: { FieldID: 'WorkingDate', DataType: 'string' },
            WorkingTime: { FieldID: 'WorkingTime', DataType: 'int' },
            ExtendedWorkingTime: { FieldID: 'ExtendedWorkingTime', DataType: 'int' }
        }
    },

    method: {
        // 실무 코드(HQB010.js)의 chartData()와 동일한 흐름: 그리드 열을 각각 getDataAtCol로 뽑아
        // 인덱스 기준으로 다시 행 배열({필드명: 값})로 조립한다.
        buildChartData() {
            var workingDate = syn.uicontrols.$auigrid.getDataAtCol('grdWorkingTime', 'WorkingDate');
            var workingTime = syn.uicontrols.$auigrid.getDataAtCol('grdWorkingTime', 'WorkingTime');
            var extendedWorkingTime = syn.uicontrols.$auigrid.getDataAtCol('grdWorkingTime', 'ExtendedWorkingTime');

            var rows = [];
            for (var i = 0; i < workingDate.length; i++) {
                rows.push({ WorkingDate: workingDate[i], WorkingTime: workingTime[i], ExtendedWorkingTime: extendedWorkingTime[i] });
            }

            return rows;
        }
    },

    event: {
        btnLoadRows_click() {
            syn.uicontrols.$auigrid.setValue('grdWorkingTime', $this.prop.dataSet);

            var rows = $this.method.buildChartData();
            syn.uicontrols.$chartjs.setValue('chtWorkingTime', rows, $this.prop.metaColumns);
        }
    }
}
