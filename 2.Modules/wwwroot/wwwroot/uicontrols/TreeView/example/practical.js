'use strict';
let $practical = {
    prop: {
        departments: [
            { DeptID: 'D00', DeptName: '본사', ParentID: null, FolderYN: 'Y', MemberCount: 0 },
            { DeptID: 'D10', DeptName: '경영지원본부', ParentID: 'D00', FolderYN: 'Y', MemberCount: 4 },
            { DeptID: 'D11', DeptName: '인사팀', ParentID: 'D10', FolderYN: 'N', MemberCount: 5 },
            { DeptID: 'D12', DeptName: '재무팀', ParentID: 'D10', FolderYN: 'N', MemberCount: 6 },
            { DeptID: 'D20', DeptName: '개발본부', ParentID: 'D00', FolderYN: 'Y', MemberCount: 3 },
            { DeptID: 'D21', DeptName: '플랫폼개발팀', ParentID: 'D20', FolderYN: 'N', MemberCount: 12 },
            { DeptID: 'D22', DeptName: '서비스개발팀', ParentID: 'D20', FolderYN: 'N', MemberCount: 9 },
            { DeptID: 'D30', DeptName: '영업본부', ParentID: 'D00', FolderYN: 'Y', MemberCount: 2 },
            { DeptID: 'D31', DeptName: '국내영업팀', ParentID: 'D30', FolderYN: 'N', MemberCount: 8 },
            { DeptID: 'D32', DeptName: '해외영업팀', ParentID: 'D30', FolderYN: 'N', MemberCount: 7 }
        ],
        activeKey: null,
        isNew: false,
        sequence: 90
    },

    hook: {
        pageLoad() {
            $this.method.reload();
        }
    },

    method: {
        // 트리 값을 다시 채운다. setValue 는 중첩 구조 변환 중 원본을 건드릴 수 있어 복제본을 넘긴다.
        reload(activateKey) {
            syn.uicontrols.$tree.setValue('tvlDept', $this.prop.departments.map((row) => { return Object.assign({}, row); }));
            syn.uicontrols.$tree.expandAll('tvlDept');
            if (activateKey) {
                syn.uicontrols.$tree.activateKey('tvlDept', activateKey);
            }
        },

        find(deptID) {
            return $this.prop.departments.find((row) => { return row.DeptID == deptID; });
        },

        children(deptID) {
            return $this.prop.departments.filter((row) => { return row.ParentID == deptID; });
        },

        log(text) {
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog('practical', text);
        },

        fill(dept, parentName, isNew) {
            $this.prop.isNew = isNew;
            syn.uicontrols.$textbox.setValue('txtDeptID', dept ? dept.DeptID : '');
            syn.uicontrols.$textbox.setValue('txtParentName', parentName || '');
            syn.uicontrols.$textbox.setValue('txtDeptName', dept ? dept.DeptName : '');
            syn.uicontrols.$textbox.setValue('txtMemberCount', dept ? String(dept.MemberCount) : '');
            syn.$l.get('spnMode').innerText = dept == null ? '선택 없음' : (isNew == true ? '하위 부서 추가 중' : '부서 수정');
        },

        select(deptID) {
            let dept = $this.method.find(deptID);
            if (dept == null) {
                return;
            }

            $this.prop.activeKey = deptID;
            let parent = $this.method.find(dept.ParentID);
            $this.method.fill(dept, parent ? parent.DeptName : '(최상위)', false);
            $this.method.log(`${dept.DeptName} 선택 (하위 부서 ${$this.method.children(deptID).length}개)`);
        },

        addChild() {
            let parent = $this.method.find($this.prop.activeKey);
            if (parent == null) {
                syn.$w.alert('상위 부서를 먼저 선택하세요.');
                return;
            }

            if (parent.FolderYN != 'Y') {
                syn.$w.alert('팀 단위 부서에는 하위 부서를 추가할 수 없습니다.');
                return;
            }

            $this.prop.sequence++;
            $this.method.fill({ DeptID: 'D' + $this.prop.sequence, DeptName: '', MemberCount: 0 }, parent.DeptName, true);
            syn.$l.get('txtDeptName').focus();
        },

        save() {
            let name = syn.uicontrols.$textbox.getValue('txtDeptName').trim();
            if (name == '') {
                syn.$w.alert('부서명 항목은 반드시 입력 해야합니다.');
                return;
            }

            let deptID = syn.uicontrols.$textbox.getValue('txtDeptID');
            if ($this.prop.isNew == true) {
                $this.prop.departments.push({ DeptID: deptID, DeptName: name, ParentID: $this.prop.activeKey, FolderYN: 'N', MemberCount: 0 });
                $this.method.log(`${name} 부서를 추가했습니다.`);
            }
            else {
                let dept = $this.method.find(deptID);
                if (dept == null) {
                    syn.$w.alert('저장할 부서를 선택하세요.');
                    return;
                }

                dept.DeptName = name;
                $this.method.log(`${name} 부서 정보를 수정했습니다.`);
            }

            $this.method.reload(deptID);
        },

        remove() {
            let dept = $this.method.find($this.prop.activeKey);
            if (dept == null) {
                syn.$w.alert('삭제할 부서를 선택하세요.');
                return;
            }

            if (dept.ParentID == null) {
                syn.$w.alert('최상위 부서는 삭제할 수 없습니다.');
                return;
            }

            if ($this.method.children(dept.DeptID).length > 0) {
                syn.$w.alert('하위 부서가 있는 부서는 삭제할 수 없습니다. 하위 부서를 먼저 삭제하세요.');
                return;
            }

            if (dept.MemberCount > 0) {
                syn.$w.alert(`소속 인원이 ${dept.MemberCount}명 있어 삭제할 수 없습니다.`);
                return;
            }

            let alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            syn.$w.alert(`'${dept.DeptName}' 부서를 삭제 하시겠습니까?`, '삭제 확인', alertOptions, (result) => {
                if (result == 'Yes') {
                    $this.prop.departments = $this.prop.departments.filter((row) => { return row.DeptID != dept.DeptID; });
                    $this.prop.activeKey = null;
                    $this.method.fill(null, '', false);
                    $this.method.log(`${dept.DeptName} 부서를 삭제했습니다.`);
                    $this.method.reload(dept.ParentID);
                }
            });
        }
    },

    event: {
        tvlDept_activate(evt, data) {
            $this.method.select(data.node.key);
        },

        // 검색어가 있으면 일치하는 노드(와 상위 노드)만 보여 주고, 지우면 필터를 해제한다.
        txtFilter_input() {
            let keyword = syn.uicontrols.$textbox.getValue('txtFilter').trim();
            if (keyword == '') {
                syn.uicontrols.$tree.clearFilter('tvlDept');
            }
            else {
                syn.uicontrols.$tree.filterNodes('tvlDept', keyword);
            }
        },

        btnExpand_click() { syn.uicontrols.$tree.expandAll('tvlDept'); },
        btnCollapse_click() { syn.uicontrols.$tree.collapseAll('tvlDept'); },
        btnAddChild_click() { $this.method.addChild(); },
        btnSave_click() { $this.method.save(); },
        btnRemove_click() { $this.method.remove(); }
    }
}
