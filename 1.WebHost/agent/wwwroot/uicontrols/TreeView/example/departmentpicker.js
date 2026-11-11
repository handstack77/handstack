'use strict';
let $departmentpicker = {
    prop: {
        // 서버가 내려주는 원본 모양의 flat 배열. 필드명이 key/title/parentID/folder가 아니어도
        // reduceMap이 있으면 그대로 사용할 수 있다(별도 가공/재구성 불필요).
        dataSet: [
            { ProgramID: 'ROOT', ProgramName: '전체 조직', ParentID: null, FolderYN: 'Y' },
            { ProgramID: 'A01', ProgramName: '인사팀', ParentID: 'ROOT', FolderYN: 'Y' },
            { ProgramID: 'A0101', ProgramName: '홍길동', ParentID: 'A01', FolderYN: 'N' },
            { ProgramID: 'A0102', ProgramName: '김철수', ParentID: 'A01', FolderYN: 'N' },
            { ProgramID: 'A02', ProgramName: '개발팀', ParentID: 'ROOT', FolderYN: 'Y' },
            { ProgramID: 'A0201', ProgramName: '이영희', ParentID: 'A02', FolderYN: 'N' }
        ]
    },

    event: {
        btnOpenDepartment_click() {
            syn.$l.get('divDepartmentPicker').style.display = '';

            // 실무 코드는 트랜잭션(LD01 등) 응답으로 받은 flat 배열을 가공 없이 그대로 setValue에 넘긴다.
            syn.uicontrols.$tree.setValue('tvlTreeView', $this.prop.dataSet);
            // expendLevel은 라이브러리에 있는 그대로의 메서드명(오타 아님) - 2단계까지 펼쳐서 보여준다.
            syn.uicontrols.$tree.expendLevel('tvlTreeView', 2);

            var rootNodeID = syn.uicontrols.$tree.getRootNodeID('tvlTreeView');
            if (rootNodeID) {
                syn.uicontrols.$tree.activateKey('tvlTreeView', rootNodeID);
            }
        },

        tvlTreeView_dblclick(evt, data) {
            // reduceMap으로 매핑되었어도 원본 필드는 data.node.data에 그대로 남아있어 ProgramID로 접근한다.
            var item = data.node.data;
            syn.$l.get('txtDepartmentNo').value = item.ProgramID;

            syn.$l.eventLog('tvlTreeView_dblclick', item.ProgramID + ' / ' + item.ProgramName + ' 선택');

            syn.$l.get('divDepartmentPicker').style.display = 'none';
        },

        txtTreeNodeFilter_keydown(evt) {
            if (evt.keyCode == 13) {
                var filterText = syn.$l.get('txtTreeNodeFilter').value.trim();
                if (filterText != '') {
                    syn.uicontrols.$tree.filterNodes('tvlTreeView', filterText);
                }
                else {
                    syn.uicontrols.$tree.clearFilter('tvlTreeView');
                }
            }
        },

        btnCloseDepartment_click() {
            syn.$l.get('divDepartmentPicker').style.display = 'none';
        }
    }
}
