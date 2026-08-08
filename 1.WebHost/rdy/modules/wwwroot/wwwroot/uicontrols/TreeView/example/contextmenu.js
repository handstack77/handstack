'use strict';
let $contextmenu = {
    prop: {
        // ATM020(qcn.groupware 소속조직 트리)과 동일하게 ProgramID 계열 컬럼명을 사용하는 예제
        dataSet: [
            { ProgramID: 'ROOT', ProgramName: '전체 조직', ParentID: null, FolderYN: 'Y' },
            { ProgramID: 'C01', ProgramName: '인사팀', ParentID: 'ROOT', FolderYN: 'Y' },
            { ProgramID: 'C0101', ProgramName: '홍길동', ParentID: 'C01', FolderYN: 'N' },
            { ProgramID: 'C02', ProgramName: '개발팀', ParentID: 'ROOT', FolderYN: 'Y' },
            { ProgramID: 'C0201', ProgramName: '이영희', ParentID: 'C02', FolderYN: 'N' }
        ]
    },

    hook: {
        pageLoad() {
            syn.uicontrols.$tree.setValue('tvlTreeView', $contextmenu.prop.dataSet);
            syn.uicontrols.$tree.expandAll('tvlTreeView');
        }
    },

    event: {
        tvlTreeView_click(evt, data) {
            syn.$l.eventLog('tvlTreeView_click', data.node.title);
        },

        ctxTreeItem_beforeOpen(evt, ui) {
            // 우클릭된 노드를 찾아 폴더 여부에 따라 메뉴 항목을 동적으로 켜고 끕니다.
            var tree = syn.uicontrols.$tree.getControl('tvlTreeView').tree;
            var node = $.ui.fancytree.getNode(ui.target);
            if (node) {
                tree.activateKey(node.key);
                var isFolder = node.data.folder === true || node.folder === true;
                syn.uicontrols.$contextmenu.enableEntry('ctxTreeItem', 'rename', isFolder);
                syn.$l.eventLog('ctxTreeItem_beforeOpen', node.title + ' (folder=' + isFolder + ')');
            }
        },

        ctxTreeItem_select(evt, ui) {
            var tree = syn.uicontrols.$tree.getControl('tvlTreeView').tree;
            var node = tree.getActiveNode();
            syn.$l.eventLog('ctxTreeItem_select', ui.cmd + ' -> ' + (node ? node.title : ''));
            document.getElementById('preLog').textContent = '메뉴 "' + ui.cmd + '" 선택: ' + (node ? node.title : '');
        }
    }
}
