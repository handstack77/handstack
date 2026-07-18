'use strict';
let $document = {
    event: {
        btnSubmit_click() {
            // 실무 코드는 syn-options의 validators:['require']와 별개로, 저장/상신 버튼에서
            // getValue() == '' 여부를 한 번 더 직접 확인하고 카운터(cntReturn 등)로 누적 검증하는 경우가 많다.
            if (syn.uicontrols.$htmleditor.getValue('edtContents') == '') {
                syn.$w.alert('본문내용 항목은 반드시 입력 해야합니다.');
                return;
            }

            // 실무 코드에서는 이 시점에 서버로 상신 트랜잭션을 보내고, 응답이 성공하면 조회 모드로 전환한다.
            syn.uicontrols.$htmleditor.setMode('edtContents', 'readonly');
            syn.$l.eventLog('btnSubmit_click', '상신 완료 - 조회 모드로 전환');
        },

        btnReopen_click() {
            // 결재자가 반려하면 다시 작성 가능한 상태로 되돌린다.
            syn.uicontrols.$htmleditor.setMode('edtContents', 'design');
            syn.$l.eventLog('btnReopen_click', '반려 - 편집 모드로 전환');
        }
    }
}
