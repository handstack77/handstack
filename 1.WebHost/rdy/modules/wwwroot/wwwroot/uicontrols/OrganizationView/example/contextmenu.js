'use strict';
let $contextmenu = {
    prop: {
        dataSet: [
            { id: 'ROOT', parentID: null, name: '전체 조직', title: '대표이사' },
            { id: 'C01', parentID: 'ROOT', name: '인사팀', title: '팀장' },
            { id: 'C0101', parentID: 'C01', name: '홍길동', title: '사원' },
            { id: 'C02', parentID: 'ROOT', name: '개발팀', title: '팀장' },
            { id: 'C0201', parentID: 'C02', name: '이영희', title: '사원' }
        ]
    },

    hook: {
        pageLoad() {
            syn.uicontrols.$organization.setValue('orgChartView', $contextmenu.prop.dataSet);
        }
    },

    event: {
        orgChartView_click(evt, focusNodes) {
            syn.$l.eventLog('orgChartView_click', 'focusNodes=' + focusNodes);
        },

        ctxTreeItem_beforeOpen(evt, ui) {
            // 우클릭된 노드를 찾아 최상위(대표이사) 노드에서는 "하위조직 생성"만 의미 있게 남기고,
            // 그 외 노드에서는 두 메뉴를 모두 사용할 수 있도록 동적으로 제어합니다.
            var node = $(ui.target).closest('.node');
            var isRoot = node.hasClass('top-level');
            syn.uicontrols.$contextmenu.enableEntry('ctxTreeItem', 'user_department', !isRoot);
            syn.$l.eventLog('ctxTreeItem_beforeOpen', node.find('.title').text() + ' (root=' + isRoot + ')');
        },

        ctxTreeItem_select(evt, ui) {
            var node = $(ui.target).closest('.node');
            var nodeText = node.find('.title').text();
            syn.$l.eventLog('ctxTreeItem_select', ui.cmd + ' -> ' + nodeText);
            document.getElementById('preLog').textContent = '메뉴 "' + ui.cmd + '" 선택: ' + nodeText;
        }
    }
}
