'use strict';
let $basic = {
    prop: {
        // reduceMap 기본값(key/title/parentID/folder)에 맞춘 평평한(flat) 배열 데이터
        dataSet: [
            { key: 'ROOT', title: '전체 조직', parentID: null, folder: 'Y' },
            { key: 'A01', title: '인사팀', parentID: 'ROOT', folder: 'Y' },
            { key: 'A0101', title: '홍길동', parentID: 'A01', folder: 'N' },
            { key: 'A0102', title: '김철수', parentID: 'A01', folder: 'N' },
            { key: 'A02', title: '개발팀', parentID: 'ROOT', folder: 'Y' },
            { key: 'A0201', title: '이영희', parentID: 'A02', folder: 'N' }
        ]
    },

    hook: {
        pageLoad() {
            // 페이지가 열릴 때 초기 데이터를 채워 넣습니다.
            syn.uicontrols.$tree.setValue('tvlTreeView', $basic.prop.dataSet);
            syn.uicontrols.$tree.expandAll('tvlTreeView');
        }
    },

    event: {
        tvlTreeView_click(evt, data) {
            syn.$l.eventLog('tvlTreeView_click', data.node.title);
        },

        tvlTreeView_dblclick(evt, data) {
            syn.$l.eventLog('tvlTreeView_dblclick', data.node.key + ' / ' + data.node.title);
        },

        btnGetValue_click() {
            var value = syn.uicontrols.$tree.getValue('tvlTreeView');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(value));
            document.getElementById('preLog').textContent = JSON.stringify(value, null, 2);
        },

        btnSetValue_click() {
            syn.uicontrols.$tree.setValue('tvlTreeView', $basic.prop.dataSet);
            syn.uicontrols.$tree.expandAll('tvlTreeView');
            syn.$l.eventLog('btnSetValue_click', '초기 데이터로 다시 채웠습니다.');
        },

        btnClear_click() {
            syn.uicontrols.$tree.clear('tvlTreeView');
            syn.$l.eventLog('btnClear_click', '트리를 비웠습니다.');
        },

        btnGetControl_click() {
            var control = syn.uicontrols.$tree.getControl('tvlTreeView');
            syn.$l.eventLog('btnGetControl_click', 'FancyTree 인스턴스 획득: ' + (control && control.tree ? 'OK' : 'FAIL'));
        }
    }
}
