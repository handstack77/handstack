'use strict';
let $filter = {
    prop: {
        dataSet: [
            { key: 'ROOT', title: '전체 조직', parentID: null, folder: 'Y' },
            { key: 'D01', title: '인사팀', parentID: 'ROOT', folder: 'Y' },
            { key: 'D0101', title: '홍길동', parentID: 'D01', folder: 'N' },
            { key: 'D0102', title: '김개발', parentID: 'D01', folder: 'N' },
            { key: 'D02', title: '개발팀', parentID: 'ROOT', folder: 'Y' },
            { key: 'D0201', title: '이영희', parentID: 'D02', folder: 'N' },
            { key: 'D0202', title: '박개발', parentID: 'D02', folder: 'N' }
        ]
    },

    hook: {
        pageLoad() {
            syn.uicontrols.$tree.setValue('tvlTreeView', $filter.prop.dataSet);
            syn.uicontrols.$tree.expandAll('tvlTreeView');
        }
    },

    event: {
        tvlTreeView_click(evt, data) {
            syn.$l.eventLog('tvlTreeView_click', data.node.title);
        },

        txtTreeNodeFilter_keydown(evt) {
            if (evt.keyCode == 13) {
                var filterText = syn.$l.get('txtTreeNodeFilter').value;
                if ($string.isNullOrEmpty(filterText.trim()) == false) {
                    syn.uicontrols.$tree.filterNodes('tvlTreeView', filterText);
                    syn.$l.eventLog('txtTreeNodeFilter_keydown', 'filterNodes: ' + filterText);
                }
                else {
                    syn.uicontrols.$tree.clearFilter('tvlTreeView');
                    syn.$l.eventLog('txtTreeNodeFilter_keydown', 'clearFilter (검색어 없음)');
                }
            }
        },

        btnDeleteTreeFilter_click() {
            syn.uicontrols.$tree.clearFilter('tvlTreeView');

            var el = syn.$l.get('txtTreeNodeFilter');
            el.value = '';
            el.focus();

            syn.$l.eventLog('btnDeleteTreeFilter_click', '필터를 해제했습니다.');
        },

        btnFilterBranches_click() {
            // filterBranches는 일치 노드가 속한 가지 전체(부모 포함)를 남깁니다.
            syn.uicontrols.$tree.filterBranches('tvlTreeView', '개발');
            syn.$l.eventLog('btnFilterBranches_click', "filterBranches('개발')");
        }
    }
}
