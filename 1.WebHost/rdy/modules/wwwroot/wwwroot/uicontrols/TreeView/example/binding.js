'use strict';
var $binding = createControlBindingExample({
    adapterName: 'treeview',
    initialValue: 'ROOT',
    setup: function () {
        syn.uicontrols.$tree.setValue('tvlBinding', [
            {key: 'ROOT', title: '전체 조직', parentID: null, folder: 'Y'},
            {key: 'DEV', title: '개발팀', parentID: 'ROOT', folder: 'Y'},
            {key: 'DEV01', title: '개발자', parentID: 'DEV', folder: 'N'},
            {key: 'SALES', title: '영업팀', parentID: 'ROOT', folder: 'Y'}
        ]);
        syn.uicontrols.$tree.expandAll('tvlBinding');
    },
    get: function () {
        var node = syn.uicontrols.$tree.getActiveNode('tvlBinding');
        return node ? node.key : '';
    },
    set: function (value) {
        syn.uicontrols.$tree.activateKey('tvlBinding', value);
    },
    nextValue: function (current) {
        return current === 'SALES' ? 'DEV' : 'SALES';
    },
    events: {
        tvlBinding_click: function (evt, data) {
            return data.node.key;
        }
    },
    business: {
        title: '담당 부서 지정',
        description: '트리에서 활성화한 노드 키를 업무 요청의 담당 부서 코드로 저장합니다.',
        rules: ['전체 조직(ROOT)이 아닌 실제 담당 부서를 선택해야 합니다.'],
        validate: function (value) {
            return value && value !== 'ROOT' ? true : '담당 부서를 선택하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {RequestID: 'REQ-20260723-01', DepartmentID: value}};
        }
    }
});
