'use strict';
let $checkbox = {
    prop: {
        dataSet: [
            { key: 'ROOT', title: '결재 라인', parentID: null, folder: 'Y' },
            { key: 'B01', title: '기안', parentID: 'ROOT', folder: 'Y' },
            { key: 'B0101', title: '홍길동', parentID: 'B01', folder: 'N' },
            { key: 'B02', title: '검토', parentID: 'ROOT', folder: 'Y' },
            { key: 'B0201', title: '김철수', parentID: 'B02', folder: 'N' },
            { key: 'B0202', title: '이영희', parentID: 'B02', folder: 'N' },
            { key: 'B03', title: '승인', parentID: 'ROOT', folder: 'Y' },
            { key: 'B0301', title: '박부장', parentID: 'B03', folder: 'N' }
        ]
    },

    hook: {
        pageLoad() {
            syn.uicontrols.$tree.setValue('tvlCheckTree', $checkbox.prop.dataSet);
            syn.uicontrols.$tree.expandAll('tvlCheckTree');
        }
    },

    event: {
        tvlCheckTree_click(evt, data) {
            // 체크박스 클릭 결과를 확인할 때는 select 이벤트가 아니라 click 이벤트에서
            // data.node.isSelected()로 직접 확인합니다. (TreeView의 select는 syn-events로
            // 연결되지 않는 이벤트명이라 핸들러가 동작하지 않습니다. API.md의 "이벤트" 참고)
            syn.$l.eventLog('tvlCheckTree_click', data.node.title + ' selected=' + data.node.isSelected());
        },

        btnGetSelected_click() {
            var nodes = syn.uicontrols.$tree.getSelectedNodes('tvlCheckTree');
            var titles = nodes.map(function (node) { return node.title; });
            syn.$l.eventLog('btnGetSelected_click', titles.join(', '));
            document.getElementById('preLog').textContent = '선택된 노드: ' + titles.join(', ');
        },

        btnSelectAll_click() {
            syn.uicontrols.$tree.selectedAll('tvlCheckTree', true);
            syn.$l.eventLog('btnSelectAll_click', '모두 선택했습니다.');
        },

        btnUnselectAll_click() {
            syn.uicontrols.$tree.selectedAll('tvlCheckTree', false);
            syn.$l.eventLog('btnUnselectAll_click', '모두 선택 해제했습니다.');
        }
    }
}
