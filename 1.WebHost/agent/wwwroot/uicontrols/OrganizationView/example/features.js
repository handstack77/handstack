'use strict';
let $features = {
    prop: {
        dataSet: [
            { id: 'D00', parentID: null, name: '본사', title: '대표이사' },
            { id: 'D10', parentID: 'D00', name: '경영지원본부', title: '본부장' },
            { id: 'D11', parentID: 'D10', name: '인사팀', title: '팀장' },
            { id: 'D12', parentID: 'D10', name: '재무팀', title: '팀장' },
            { id: 'D20', parentID: 'D00', name: '개발본부', title: '본부장' },
            { id: 'D21', parentID: 'D20', name: '플랫폼개발팀', title: '팀장' },
            { id: 'D22', parentID: 'D20', name: '서비스개발팀', title: '팀장' },
            { id: 'D30', parentID: 'D00', name: '영업본부', title: '본부장' }
        ],
        selectedNode: null,
        isHorizontal: false,
        sequence: 100
    },

    method: {
        show(title, data) {
            let text = typeof data == 'string' ? data : JSON.stringify(data, null, 2);
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text.length > 140 ? text.slice(0, 140) + '...' : text);
        },

        // 노드를 클릭해 선택해 두어야 하는 기능이 많아, 선택 여부를 먼저 확인한다.
        needNode() {
            if ($this.prop.selectedNode == null) {
                syn.$w.alert('먼저 조직도에서 노드를 클릭해 선택하세요.');
                return null;
            }

            return $this.prop.selectedNode;
        },

        newData(prefix) {
            $this.prop.sequence++;
            return { id: 'D' + $this.prop.sequence, name: prefix + $this.prop.sequence, title: '담당' };
        },

        load() {
            $this.prop.selectedNode = null;
            syn.$l.get('spnSelected').innerText = '(없음)';
            syn.uicontrols.$organization.setValue('orgChart', $this.prop.dataSet.map((row) => { return Object.assign({}, row); }));
        }
    },

    hook: {
        pageLoad() {
            $this.method.load();
        }
    },

    event: {
        // setValue 로 채운 노드는 원본 컬럼이 data 아래에 들어 있으므로, nodeTemplate 으로 부서명(name)과 직책(title)을 직접 그린다.
        // 선택/드래그 이벤트가 노드 텍스트를 읽을 수 있도록 title/content 클래스를 유지한다.
        orgChart_nodeTemplate(data) {
            // setValue 로 채운 노드는 원본이 data 아래에, addChildren/addSiblings 로 추가한 노드는 최상위에 있다.
            let item = data.data || data;
            return `<div class="title">${item.name || ''}</div><div class="content">${item.title || ''}</div>`;
        },

        // 노드가 만들어진 직후 호출된다(여기서는 팀 단위 노드에 보조 문구를 붙인다).
        orgChart_createNode($node, data) {
            if (data.title == '팀장') {
                $node.find('.content').append('<div class="text-muted" style="font-size: 11px;">팀 단위</div>');
            }
        },

        orgChart_nodedrop(evt, params) {
            let dragged = params.draggedNode.children('.title').text();
            let from = params.dragZone.children('.title').text();
            let to = params.dropZone.children('.title').text();
            syn.$l.eventLog('orgChart_nodedrop', `${dragged}: ${from} -> ${to}`);
        },

        orgChart_select(evt, node) {
            $this.prop.selectedNode = node;
            syn.$l.get('spnSelected').innerText = node.find('.title').first().text();
            syn.$l.eventLog('orgChart_select', node.find('.title').first().text());
        },

        orgChart_click(evt, focusNodes) {
            syn.$l.eventLog('orgChart_click', `focusNodes=${focusNodes}`);
        },

        btnLoad_click() {
            $this.method.load();
        },

        btnGetValue_click() {
            $this.method.show('btnGetValue_click', syn.uicontrols.$organization.getValue('orgChart'));
        },

        btnHierarchy_click() {
            $this.method.show('btnHierarchy_click', syn.uicontrols.$organization.getHierarchy('orgChart', false));
        },

        btnClear_click() {
            $this.prop.selectedNode = null;
            syn.$l.get('spnSelected').innerText = '(없음)';
            syn.uicontrols.$organization.clear('orgChart');
        },

        // init 은 새 옵션으로 다시 그린다. 방향을 바꾸면서 현재 데이터를 그대로 사용한다.
        btnDirection_click() {
            $this.prop.isHorizontal = !$this.prop.isHorizontal;
            let nested = syn.uicontrols.$organization.getHierarchy('orgChart', true);
            syn.uicontrols.$organization.init('orgChart', { data: nested, direction: $this.prop.isHorizontal == true ? 'l2r' : 't2b' });
            $this.prop.selectedNode = null;
        },

        btnAddChild_click() {
            let node = $this.method.needNode();
            if (node != null) {
                syn.uicontrols.$organization.addChildren('orgChart', node, [$this.method.newData('신규팀')]);
            }
        },

        btnAddSibling_click() {
            let node = $this.method.needNode();
            if (node != null) {
                syn.uicontrols.$organization.addSiblings('orgChart', node, [$this.method.newData('신규팀')]);
            }
        },

        btnAddParent_click() {
            syn.uicontrols.$organization.addParent('orgChart', $this.method.newData('상위조직'));
        },

        btnRemove_click() {
            let node = $this.method.needNode();
            if (node != null) {
                syn.uicontrols.$organization.removeNodes('orgChart', node);
                $this.prop.selectedNode = null;
                syn.$l.get('spnSelected').innerText = '(없음)';
            }
        },

        btnHideParent_click() {
            let node = $this.method.needNode();
            if (node != null) {
                syn.uicontrols.$organization.hideParent('orgChart', node);
            }
        },

        btnShowParent_click() {
            let node = $this.method.needNode();
            if (node != null) {
                syn.uicontrols.$organization.showParent('orgChart', node);
            }
        },

        btnHideSiblings_click() {
            let node = $this.method.needNode();
            if (node != null) {
                syn.uicontrols.$organization.hideSiblings('orgChart', node, 'left');
            }
        },

        btnShowSiblings_click() {
            let node = $this.method.needNode();
            if (node != null) {
                syn.uicontrols.$organization.showSiblings('orgChart', node, 'left');
            }
        },

        btnShowChildren_click() {
            let node = $this.method.needNode();
            if (node != null) {
                syn.uicontrols.$organization.showChildren('orgChart', node);
            }
        },

        btnRelated_click() {
            let node = $this.method.needNode();
            if (node != null) {
                let children = syn.uicontrols.$organization.getRelatedNodes('orgChart', node, 'children');
                let titles = children ? children.map((index, el) => { return $(el).children('.title').text(); }).get() : [];
                $this.method.show('btnRelated_click', `${node.find('.title').first().text()} 의 하위 조직: ${titles.length > 0 ? titles.join(', ') : '(없음)'}`);
            }
        },

        btnState_click() {
            let node = $this.method.needNode();
            if (node != null) {
                $this.method.show('btnState_click', JSON.stringify({
                    children: syn.uicontrols.$organization.getNodeState('orgChart', node, 'children'),
                    parent: syn.uicontrols.$organization.getNodeState('orgChart', node, 'parent'),
                    siblings: syn.uicontrols.$organization.getNodeState('orgChart', node, 'siblings')
                }, null, 2));
            }
        },

        btnScale_click() {
            syn.uicontrols.$organization.setChartScale('orgChart', null, 1.2);
        },

        btnExport_click() {
            syn.uicontrols.$organization.export('orgChart', 'organization', 'png');
        }
    }
}
