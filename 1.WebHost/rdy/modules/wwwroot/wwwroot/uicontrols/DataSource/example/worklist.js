'use strict';
let $worklist = {
    method: {
        // $this.store.ApprovalLine 배열이 바뀔 때마다 화면의 카드 목록을 직접 다시 그린다.
        // (그리드 컨트롤이 없으므로 렌더링도 직접 담당해야 한다)
        render() {
            var rows = $this.store.ApprovalLine;
            var html = rows.map(function (row, index) {
                return '<div>{0}. {1}({2}) - {3}</div>'.format(index + 1, row.EmployeeName, row.EmployeeNo, row.Status);
            }).join('');

            syn.$l.get('divApprovalLine').innerHTML = html || '<div>결재선이 비어 있습니다.</div>';
        }
    },

    event: {
        btnAddApprover_click() {
            var employeeNo = syn.$l.get('txtEmployeeNo').value;
            var employeeName = syn.$l.get('txtEmployeeName').value;
            if ($string.isNullOrEmpty(employeeNo) == true || $string.isNullOrEmpty(employeeName) == true) {
                syn.$w.alert('사번과 성명을 입력하세요.');
                return;
            }

            $this.store.ApprovalLine.push({
                SortingNo: $this.store.ApprovalLine.length + 1,
                EmployeeNo: employeeNo,
                EmployeeName: employeeName,
                Status: '대기'
            });

            syn.$l.get('txtEmployeeNo').value = '';
            syn.$l.get('txtEmployeeName').value = '';

            $this.method.render();
            syn.$l.eventLog('btnAddApprover_click', '결재선 ' + $this.store.ApprovalLine.length + '명');
        },

        btnRemoveLastApprover_click() {
            if ($this.store.ApprovalLine.length <= 0) {
                syn.$w.alert('제거할 결재자가 없습니다.');
                return;
            }

            var removed = $this.store.ApprovalLine.splice($this.store.ApprovalLine.length - 1, 1);
            $this.method.render();
            syn.$l.eventLog('btnRemoveLastApprover_click', JSON.stringify(removed));
        },

        btnGetValue_click() {
            // Grid 저장소의 getValue는 isAll을 생략하면 Flag가 'R'인 행만 제외한다.
            // 여기서는 push로 채운 행에 Flag를 별도로 지정하지 않았으므로(undefined) 모두 "변경분"으로 취급되어
            // 저장 트랜잭션에 그대로 포함된다 - 실무의 신규 결재선 저장 흐름과 동일하다.
            var rows = syn.uicontrols.$data.getValue('srcApprovalLine');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(rows));
        }
    }
}
