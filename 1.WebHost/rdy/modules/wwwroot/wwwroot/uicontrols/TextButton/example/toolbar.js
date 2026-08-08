'use strict';
let $toolbar = {
    event: {
        btnNew_click() {
            syn.$l.eventLog('btnNew_click', '신규 입력 상태로 전환');
        },

        btnSave_click() {
            syn.$l.eventLog('btnSave_click', '저장 트랜잭션 실행(예: syn.$w.transactionAction(\'MD01\'))');
        },

        // 실무 코드의 표준 삭제 확인 절차: alertOptions를 복제해 question 아이콘 + Yes/No/취소(buttonType: '3')로
        // 확인받고, 'Yes'를 눌렀을 때만 실제 삭제 트랜잭션을 실행한다.
        btnDelete_click() {
            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            alertOptions.style = 'font:red!';

            syn.$w.alert('정말 삭제 하시겠습니까? 복구가 불가합니다.', '삭제 확인', alertOptions, function (result) {
                if (result == 'Yes') {
                    syn.$l.eventLog('btnDelete_click', '삭제 트랜잭션 실행(예: syn.$w.transactionAction(\'DD01\'))');
                }
                else {
                    syn.$l.eventLog('btnDelete_click', '취소됨');
                }
            });
        },

        btnAddRow_click() {
            syn.$l.eventLog('btnAddRow_click', '그리드 행 추가 아이콘 버튼(실무에서는 보통 triggerConfig로 선언적 연결)');
        },

        btnRemoveRow_click() {
            syn.$l.eventLog('btnRemoveRow_click', '그리드 행 삭제 아이콘 버튼');
        }
    }
}
