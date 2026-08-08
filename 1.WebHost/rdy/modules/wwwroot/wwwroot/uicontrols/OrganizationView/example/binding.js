'use strict';
var $binding = createControlBindingExample({
    adapterName: 'organization',
    initialValue: 'ROOT',
    setup: function () {
        syn.uicontrols.$organization.setValue('orgBinding', [
            {id: 'ROOT', parentID: null, name: '전체 조직', title: '대표이사'},
            {id: 'DEV', parentID: 'ROOT', name: '개발팀', title: '팀장'},
            {id: 'DEV01', parentID: 'DEV', name: '홍길동', title: '개발자'},
            {id: 'SALES', parentID: 'ROOT', name: '영업팀', title: '팀장'}
        ]);
    },
    get: function () {
        var control = syn.uicontrols.$organization.getControl('orgBinding');
        return control.selectedBindingID || '';
    },
    set: function (value) {
        var control = syn.uicontrols.$organization.getControl('orgBinding');
        control.selectedBindingID = value;
        document.getElementById('spnOrganizationNode').textContent = value;
        control.orgchart.$chartContainer.find('.node').removeClass('focused').filter(function () {
            var data = $(this).data('nodeData') || {};
            return data.id === value || data.key === value;
        }).addClass('focused');
    },
    nextValue: function (current) {
        return current === 'SALES' ? 'DEV' : 'SALES';
    },
    events: {
        orgBinding_select: function (evt, node) {
            var data = node.data('nodeData') || {};
            return data.id || data.key || node.attr('id');
        }
    },
    business: {
        title: '결재 조직 지정',
        description: '조직도에서 선택한 노드 키를 결재선의 담당 조직 코드로 저장합니다.',
        rules: ['최상위 ROOT가 아닌 실제 담당 조직을 선택해야 합니다.'],
        validate: function (value) {
            return value && value !== 'ROOT' ? true : '결재를 담당할 하위 조직을 선택하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {ApprovalLineID: 'LINE-01', OrganizationID: value}};
        }
    }
});
