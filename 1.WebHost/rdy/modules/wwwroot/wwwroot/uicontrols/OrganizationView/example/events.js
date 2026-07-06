'use strict';
let $events = {
    prop: {
        dataSet: [
            { id: 'ROOT', parentID: null, name: '전체 조직', title: '대표이사' },
            { id: 'B01', parentID: 'ROOT', name: '인사팀', title: '팀장' },
            { id: 'B0101', parentID: 'B01', name: '홍길동', title: '사원' },
            { id: 'B02', parentID: 'ROOT', name: '개발팀', title: '팀장' },
            { id: 'B0201', parentID: 'B02', name: '이영희', title: '사원' },
            { id: 'B0202', parentID: 'B02', name: '박민수', title: '사원' }
        ],
        // select 이벤트에서 마지막으로 클릭한 노드를 기억해 두었다가
        // getRelatedNodes 버튼에서 사용합니다.
        selectedNode: null
    },

    hook: {
        pageLoad() {
            syn.uicontrols.$organization.setValue('orgChartView', $events.prop.dataSet);
        }
    },

    event: {
        orgChartView_nodedrop(evt, params) {
            // params.draggedNode / dragZone / dropZone 은 모두 jQuery 객체입니다.
            var dragged = params.draggedNode.children('.title').text();
            var from = params.dragZone.children('.title').text();
            var to = params.dropZone.children('.title').text();
            syn.$l.eventLog('orgChartView_nodedrop', dragged + ' : ' + from + ' -> ' + to);

            // 드롭된 자리(dropZone) 기준으로 바뀐 하위 조직 목록을 다시 조회할 수 있습니다.
            var relatedNodes = syn.uicontrols.$organization.getRelatedNodes('orgChartView', params.dropZone, 'children');
            document.getElementById('preLog').textContent =
                dragged + ' 이(가) ' + to + ' 밑으로 이동. 새 하위 조직 수: ' + (relatedNodes ? relatedNodes.length : 0);
        },

        orgChartView_select(evt, node) {
            $events.prop.selectedNode = node;
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
            $events.prop.selectedNode = null;
            syn.uicontrols.$organization.setValue('orgChartView', $events.prop.dataSet);
            syn.$l.eventLog('btnSetValue_click', '초기 데이터로 다시 채웠습니다.');
        },

        btnClear_click() {
            $events.prop.selectedNode = null;
            syn.uicontrols.$organization.clear('orgChartView');
            syn.$l.eventLog('btnClear_click', '조직도를 비웠습니다.');
        },

        btnGetRelatedNodes_click() {
            if (!$events.prop.selectedNode) {
                syn.$l.eventLog('btnGetRelatedNodes_click', '먼저 조직도에서 노드를 한 번 클릭해서 선택하세요.');
                return;
            }

            var children = syn.uicontrols.$organization.getRelatedNodes('orgChartView', $events.prop.selectedNode, 'children');
            var titles = children ? children.map(function (idx, el) { return $(el).children('.title').text(); }).get() : [];
            syn.$l.eventLog('btnGetRelatedNodes_click', JSON.stringify(titles));
            document.getElementById('preLog').textContent =
                $events.prop.selectedNode.find('.title').text() + '의 하위 조직: ' + (titles.length ? titles.join(', ') : '(없음)');
        }
    }
}
