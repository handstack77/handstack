'use strict';
let $practical = {
    prop: {
        original: [
            { id: 'D00', parentID: null, name: '본사', title: '대표이사' },
            { id: 'D10', parentID: 'D00', name: '경영지원본부', title: '본부장' },
            { id: 'D11', parentID: 'D10', name: '인사팀', title: '팀장' },
            { id: 'D12', parentID: 'D10', name: '재무팀', title: '팀장' },
            { id: 'D20', parentID: 'D00', name: '개발본부', title: '본부장' },
            { id: 'D21', parentID: 'D20', name: '플랫폼개발팀', title: '팀장' },
            { id: 'D22', parentID: 'D20', name: '서비스개발팀', title: '팀장' },
            { id: 'D30', parentID: 'D00', name: '영업본부', title: '본부장' },
            { id: 'D31', parentID: 'D30', name: '국내영업팀', title: '팀장' }
        ],
        selectedNode: null,
        menuNode: null,
        sequence: 100
    },

    hook: {
        pageLoad() {
            $this.method.load();
        }
    },

    method: {
        load() {
            $this.prop.selectedNode = null;
            syn.uicontrols.$organization.setValue('orgChart', $this.prop.original.map((row) => { return Object.assign({}, row); }));
            $this.method.showSelected(null);
            $this.method.refreshChanges();
        },

        nodeID(node) {
            return node.attr('id');
        },

        nodeName(node) {
            return node.find('.title').first().text();
        },

        // 현재 조직 구조를 평평한(flat) 배열로 가져온다(reduceMap 기준 컬럼).
        current() {
            return syn.uicontrols.$organization.getValue('orgChart') || [];
        },

        showSelected(node) {
            if (node == null) {
                ['divName', 'divCode', 'divChildren'].forEach((id) => { syn.$l.get(id).innerText = '-'; });
                return;
            }

            let children = syn.uicontrols.$organization.getRelatedNodes('orgChart', node, 'children');
            let names = children ? children.map((index, el) => { return $(el).children('.title').text(); }).get() : [];
            syn.$l.get('divName').innerText = $this.method.nodeName(node);
            syn.$l.get('divCode').innerText = $this.method.nodeID(node);
            syn.$l.get('divChildren').innerText = names.length == 0 ? '없음' : names.join(', ');
        },

        // 원본과 현재 구조를 비교해 이동/추가/삭제된 조직을 찾는다.
        diff() {
            let originals = {};
            $this.prop.original.forEach((row) => { originals[row.id] = row; });
            let nowRows = $this.method.current();
            let nowMap = {};
            nowRows.forEach((row) => { nowMap[row.id] = row; });

            let changes = [];
            nowRows.forEach((row) => {
                let before = originals[row.id];
                if (before == null) {
                    changes.push({ Flag: 'C', id: row.id, name: row.name, parentID: row.parentID });
                }
                else if (before.parentID != row.parentID) {
                    changes.push({ Flag: 'U', id: row.id, name: row.name, parentID: row.parentID, beforeParentID: before.parentID });
                }
            });

            $this.prop.original.forEach((row) => {
                if (nowMap[row.id] == null) {
                    changes.push({ Flag: 'D', id: row.id, name: row.name });
                }
            });

            return changes;
        },

        refreshChanges() {
            let changes = $this.method.diff();
            syn.$l.get('spnChanged').innerText = `${changes.length}건`;
            let nameOf = (id) => {
                let row = $this.prop.original.find((item) => { return item.id == id; }) || $this.method.current().find((item) => { return item.id == id; });
                return row ? row.name : id;
            };
            syn.$l.get('preChanges').textContent = changes.length == 0 ? '변경 내역이 없습니다.' : changes.map((change) => {
                if (change.Flag == 'U') {
                    return `[이동] ${change.name}: ${nameOf(change.beforeParentID)} → ${nameOf(change.parentID)}`;
                }

                return change.Flag == 'C' ? `[추가] ${change.name} (상위: ${nameOf(change.parentID)})` : `[삭제] ${change.name}`;
            }).join('\n');
        },

        addChild(node, name) {
            if (node == null) {
                syn.$w.alert('상위 조직을 먼저 선택하세요.');
                return;
            }

            name = (name || '').trim();
            if (name == '') {
                syn.$w.alert('추가할 조직명을 입력 하세요.');
                return;
            }

            $this.prop.sequence++;
            syn.uicontrols.$organization.addChildren('orgChart', node, [{ id: 'N' + $this.prop.sequence, name: name, title: '팀장' }]);
            $this.method.refreshChanges();
            $this.method.showSelected(node);
        },

        addSibling(node, name) {
            $this.prop.sequence++;
            syn.uicontrols.$organization.addSiblings('orgChart', node, [{ id: 'N' + $this.prop.sequence, name: name, title: '팀장' }]);
            $this.method.refreshChanges();
        },

        remove(node) {
            if (node == null) {
                return;
            }

            if ($this.method.nodeID(node) == 'D00') {
                syn.$w.alert('최상위 조직은 삭제할 수 없습니다.');
                return;
            }

            let alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            syn.$w.alert(`'${$this.method.nodeName(node)}' 조직과 하위 조직을 모두 삭제 하시겠습니까?`, '삭제 확인', alertOptions, (result) => {
                if (result == 'Yes') {
                    syn.uicontrols.$organization.removeNodes('orgChart', node);
                    $this.prop.selectedNode = null;
                    $this.method.showSelected(null);
                    $this.method.refreshChanges();
                }
            });
        },

        save() {
            let changes = $this.method.diff();
            if (changes.length == 0) {
                syn.$w.alert('저장할 개편 내용이 없습니다.');
                return;
            }

            syn.$l.eventLog('save', `${changes.length}건 개편안 저장 요청: ` + JSON.stringify(changes));
            syn.$w.alert(`${changes.length}건의 개편 내용을 저장했습니다.`);
            $this.prop.original = $this.method.current().map((row) => { return { id: row.id, parentID: row.parentID, name: row.name, title: row.title }; });
            $this.method.refreshChanges();
        }
    },

    event: {
        // setValue 로 채운 노드는 원본 컬럼이 data 아래에, addChildren/addSiblings 로 추가한 노드는 최상위에 있다.
        orgChart_nodeTemplate(data) {
            let item = data.data || data;
            return `<div class="title">${item.name || ''}</div><div class="content">${item.title || ''}</div>`;
        },

        orgChart_select(evt, node) {
            $this.prop.selectedNode = node;
            $this.method.showSelected(node);
        },

        // 노드를 다른 조직 밑으로 드래그하면 변경 내역을 다시 계산한다.
        orgChart_nodedrop(evt, params) {
            setTimeout(() => {
                $this.method.refreshChanges();
                $this.method.showSelected($this.prop.selectedNode);
            }, 100);
        },

        // 우클릭한 노드를 기억해 두었다가 메뉴 선택 시 사용한다.
        ctxOrg_beforeOpen(evt, ui) {
            $this.prop.menuNode = $(ui.target).closest('.node');
            $this.prop.selectedNode = $this.prop.menuNode;
            $this.method.showSelected($this.prop.menuNode);
        },

        ctxOrg_select(evt, ui) {
            let node = $this.prop.menuNode;
            switch (ui.cmd) {
                case 'members':
                    syn.$w.alert(`${$this.method.nodeName(node)} 구성원 조회는 서버 연동 화면에서 제공합니다(예제에서는 생략).`);
                    break;
                case 'addChild':
                    $this.method.addChild(node, syn.uicontrols.$textbox.getValue('txtNewName') || '신규 조직');
                    break;
                case 'addSibling':
                    if ($this.method.nodeID(node) == 'D00') {
                        syn.$w.alert('최상위 조직과 같은 레벨에는 추가할 수 없습니다.');
                    }
                    else {
                        $this.method.addSibling(node, syn.uicontrols.$textbox.getValue('txtNewName') || '신규 조직');
                    }
                    break;
                case 'remove':
                    $this.method.remove(node);
                    break;
            }
        },

        btnAddChild_click() {
            $this.method.addChild($this.prop.selectedNode, syn.uicontrols.$textbox.getValue('txtNewName'));
            syn.uicontrols.$textbox.clear('txtNewName');
        },

        btnReset_click() {
            $this.method.load();
        },

        btnSave_click() {
            $this.method.save();
        }
    }
}
