'use strict';
let $basic = {
    prop: {
        // reduceMap 기본값(key/title/parentID)에 맞춘 평평한(flat) 배열 데이터
        // 화면 표시는 nodeTitle('name')/nodeContent('title')이 담당합니다.
        dataSet: [
            { id: 'ROOT', parentID: null, name: '전체 조직', title: '대표이사' },
            { id: 'A01', parentID: 'ROOT', name: '인사팀', title: '팀장' },
            { id: 'A0101', parentID: 'A01', name: '홍길동', title: '사원' },
            { id: 'A0102', parentID: 'A01', name: '김철수', title: '사원' },
            { id: 'A02', parentID: 'ROOT', name: '개발팀', title: '팀장' },
            { id: 'A0201', parentID: 'A02', name: '이영희', title: '사원' }
        ]
    },

    hook: {
        pageLoad() {
            // 페이지가 열릴 때 초기 데이터를 채워 넣습니다.
            syn.uicontrols.$organization.setValue('orgChartView', $basic.prop.dataSet);
        }
    },

    event: {
        // setValue 로 채운 노드는 원본 컬럼(name/title)이 data 아래에 있으므로 nodeTemplate 으로 직접 그린다.
        orgChartView_nodeTemplate(data) {
            let item = data.data || data;
            return `<div class="title">${item.name || ''}</div><div class="content">${item.title || ''}</div>`;
        },

        orgChartView_select(evt, node) {
            syn.$l.eventLog('orgChartView_select', node.find('.title').text());
        },

        orgChartView_click(evt, focusNodes) {
            syn.$l.eventLog('orgChartView_click', 'focusNodes=' + focusNodes);
        },

        btnGetValue_click() {
            var value = syn.uicontrols.$organization.getValue('orgChartView');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(value));
            document.getElementById('preLog').textContent = JSON.stringify(value, null, 2);
        },

        btnSetValue_click() {
            syn.uicontrols.$organization.setValue('orgChartView', $basic.prop.dataSet);
            syn.$l.eventLog('btnSetValue_click', '초기 데이터로 다시 채웠습니다.');
        },

        btnClear_click() {
            syn.uicontrols.$organization.clear('orgChartView');
            syn.$l.eventLog('btnClear_click', '조직도를 비웠습니다.');
        },

        btnGetControl_click() {
            var control = syn.uicontrols.$organization.getControl('orgChartView');
            syn.$l.eventLog('btnGetControl_click', 'OrgChart 인스턴스 획득: ' + (control && control.orgchart ? 'OK' : 'FAIL'));
        }
    }
}
