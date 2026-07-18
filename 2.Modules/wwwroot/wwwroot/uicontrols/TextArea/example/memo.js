'use strict';
let $memo = {
    event: {
        // 실무 코드는 "신규 작성" 전환 시 이전 레코드의 메모 내용이 남아있지 않도록 clear를 호출한다.
        btnClear_click() {
            syn.uicontrols.$textarea.setValue('txtComment', '');
            syn.$l.eventLog('btnClear_click', '메모 내용을 비웠습니다.');
        }
    }
}
