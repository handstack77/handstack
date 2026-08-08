'use strict';
var $binding = createControlBindingExample({
    adapterName: 'gridlist',
    initialValue: [
        {id: 'U01', name: '홍길동', department: '개발팀'},
        {id: 'U02', name: '이영희', department: '영업팀'}
    ],
    get: function () {
        return syn.uicontrols.$list.getValue('lstBinding');
    },
    set: function (value) {
        syn.uicontrols.$list.setValue('lstBinding', value);
    },
    nextValue: function (current) {
        current.push({id: 'U' + String(current.length + 1).padStart(2, '0'), name: '모델 추가', department: '지원팀'});
        return current;
    },
    events: {
        btnListControlChange_click: function () {
            syn.uicontrols.$list.setCellData('lstBinding', 0, 'name', '컨트롤 API 수정');
            return syn.uicontrols.$list.getValue('lstBinding');
        }
    },
    business: {
        title: '결재자 목록 저장',
        description: 'DataTables 행 배열을 결재선 순서가 포함된 List 입력으로 변환합니다.',
        rules: ['결재자 ID와 이름은 필수입니다.', '같은 결재자 ID를 중복 지정할 수 없습니다.'],
        validate: function (value) {
            var ids = {};
            var invalid = (value || []).some(function (item) {
                if (!item.id || !String(item.name || '').trim() || ids[item.id]) {
                    return true;
                }
                ids[item.id] = true;
                return false;
            });
            return invalid ? '결재자 ID/이름과 중복 여부를 확인하세요.' : true;
        },
        buildPayload: function (value) {
            var rows = value.map(function (item, index) {
                return {ApproverID: item.id, ApproverName: item.name, DepartmentName: item.department, ApprovalOrder: index + 1};
            });
            return {transactionID: 'MD01', inputs: [{type: 'List', dataFieldID: 'ApprovalLine', rows: rows}]};
        }
    }
});
