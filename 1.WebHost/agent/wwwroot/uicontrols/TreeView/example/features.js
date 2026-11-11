'use strict';
let $features = {
    prop: {
        // reduceMap 으로 연결한 실제 컬럼명(ProgramID/ProgramName/ParentID/FolderYN)을 쓰는 평평한(flat) 데이터
        menus: [
            { ProgramID: 'P', ProgramName: '업무 메뉴', ParentID: null, FolderYN: 'Y' },
            { ProgramID: 'P01', ProgramName: '고객 관리', ParentID: 'P', FolderYN: 'Y' },
            { ProgramID: 'P0101', ProgramName: '고객 등록', ParentID: 'P01', FolderYN: 'N' },
            { ProgramID: 'P0102', ProgramName: '고객 조회', ParentID: 'P01', FolderYN: 'N' },
            { ProgramID: 'P02', ProgramName: '상품 관리', ParentID: 'P', FolderYN: 'Y' },
            { ProgramID: 'P0201', ProgramName: '상품 등록', ParentID: 'P02', FolderYN: 'N' },
            { ProgramID: 'P0202', ProgramName: '재고 현황', ParentID: 'P02', FolderYN: 'N' },
            { ProgramID: 'P03', ProgramName: '주문 관리', ParentID: 'P', FolderYN: 'Y' },
            { ProgramID: 'P0301', ProgramName: '주문 접수', ParentID: 'P03', FolderYN: 'N' },
            { ProgramID: 'P0302', ProgramName: '주문 현황', ParentID: 'P03', FolderYN: 'N' },
            { ProgramID: 'P0303', ProgramName: '배송 관리', ParentID: 'P03', FolderYN: 'N' }
        ]
    },

    method: {
        show(title, data) {
            let text = typeof data == 'string' ? data : JSON.stringify(data, null, 2);
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text.length > 140 ? text.slice(0, 140) + '...' : text);
        },

        // setValue 는 전달한 배열을 중첩 구조로 바꾸는 과정에서 원본을 건드릴 수 있으므로 복제본을 넘긴다.
        load() {
            ['tvlMenu', 'tvlCheck'].forEach((id) => {
                syn.uicontrols.$tree.setValue(id, $this.prop.menus.map((row) => { return Object.assign({}, row); }));
                syn.uicontrols.$tree.expandAll(id);
            });
        }
    },

    hook: {
        pageLoad() {
            $this.method.load();
        }
    },

    event: {
        tvlMenu_click(evt, data) {
            syn.$l.eventLog('tvlMenu_click', data.node.title);
        },

        tvlMenu_dblclick(evt, data) {
            syn.$l.eventLog('tvlMenu_dblclick', `${data.node.key} / ${data.node.title}`);
        },

        tvlMenu_activate(evt, data) {
            syn.$l.eventLog('tvlMenu_activate', `활성: ${data.node.title}`);
        },

        tvlMenu_expand(evt, data) {
            syn.$l.eventLog('tvlMenu_expand', `펼침: ${data.node.title}`);
        },

        tvlMenu_collapse(evt, data) {
            syn.$l.eventLog('tvlMenu_collapse', `접음: ${data.node.title}`);
        },

        // 체크박스 선택 상태는 select 이벤트가 아니라 click 이벤트에서 isSelected() 로 확인한다.
        tvlCheck_click(evt, data) {
            syn.$l.eventLog('tvlCheck_click', `${data.node.title} 선택 상태: ${data.node.isSelected()}`);
        },

        btnLoad_click() {
            $this.method.load();
        },

        btnGetValue_click() {
            $this.method.show('btnGetValue_click', syn.uicontrols.$tree.getValue('tvlMenu'));
        },

        btnClear_click() {
            syn.uicontrols.$tree.clear('tvlMenu');
            syn.uicontrols.$tree.clear('tvlCheck');
        },

        btnExpandAll_click() {
            syn.uicontrols.$tree.expandAll('tvlMenu');
        },

        btnCollapseAll_click() {
            syn.uicontrols.$tree.collapseAll('tvlMenu');
        },

        btnExpandLevel_click() {
            syn.uicontrols.$tree.expendLevel('tvlMenu', 2);
        },

        btnCollapseLevel_click() {
            syn.uicontrols.$tree.collapseLevel('tvlMenu', 2);
        },

        btnRoot_click() {
            $this.method.show('btnRoot_click', 'getRootNodeID: ' + syn.uicontrols.$tree.getRootNodeID('tvlMenu'));
        },

        btnActivate_click() {
            syn.uicontrols.$tree.activateKey('tvlMenu', 'P0302');
        },

        btnActive_click() {
            let node = syn.uicontrols.$tree.getActiveNode('tvlMenu');
            $this.method.show('btnActive_click', node == null ? '(활성 노드 없음)' : `${node.key} / ${node.title}`);
        },

        btnFilterNodes_click() {
            syn.uicontrols.$tree.filterNodes('tvlMenu', '주문');
        },

        btnFilterBranches_click() {
            syn.uicontrols.$tree.filterBranches('tvlMenu', '주문');
        },

        btnClearFilter_click() {
            syn.uicontrols.$tree.clearFilter('tvlMenu');
        },

        btnToggle_click() {
            $this.method.show('btnToggle_click', '활성 상태: ' + syn.uicontrols.$tree.toogleEnabled('tvlMenu'));
        },

        btnSelectAll_click() {
            syn.uicontrols.$tree.selectedAll('tvlCheck', true);
        },

        btnUnselectAll_click() {
            syn.uicontrols.$tree.selectedAll('tvlCheck', false);
        },

        btnSelected_click() {
            let nodes = syn.uicontrols.$tree.getSelectedNodes('tvlCheck');
            $this.method.show('btnSelected_click', nodes.length == 0 ? '(선택된 노드 없음)' : nodes.map((node) => { return `${node.key} ${node.title}`; }).join('\n'));
        },

        // 활성 노드(없으면 '주문 관리')의 선택 상태를 그 하위 노드 전체에 적용한다.
        btnSetNodeAll_click() {
            let tree = syn.uicontrols.$tree.getControl('tvlCheck').tree;
            let node = tree.getNodeByKey('P03');
            node.setSelected(true);
            syn.uicontrols.$tree.setNodeSelectedAll('tvlCheck', node);
            $this.method.show('btnSetNodeAll_click', `${node.title} 와 하위 ${node.countChildren()}개 노드를 선택했습니다.`);
        }
    }
}
