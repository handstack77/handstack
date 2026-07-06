'use strict';
let $form = {
    event: {
        btnGetValue_click() {
            // storeType: 'Form'은 isAll을 true로 줘야 필드 값이 모두 채워진 전체 레코드를 돌려받습니다.
            // (isAll을 생략하면 값이 객체 타입인 필드만 남기 때문에 문자열/숫자/불린 필드는 대부분 비어 보입니다.)
            var record = syn.uicontrols.$data.getValue('srcForm', true);
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(record));
        },

        btnClear_click() {
            // columns에 정의된 dataType 기본값(문자열: '', 숫자: 0, 불린: false)으로 되돌립니다.
            // 주의: clear()는 내부 저장소 값만 되돌리며, 이미 바인딩된 입력 컨트롤의 화면 표시값은 그대로 남습니다.
            // (clear 진행 중에는 바인딩 반응(propertyEvent)이 꺼져 있어 화면 컨트롤에는 반영되지 않습니다.)
            syn.uicontrols.$data.clear('srcForm');
            var record = syn.uicontrols.$data.getValue('srcForm', true);
            syn.$l.eventLog('btnClear_click', 'srcForm 저장소 초기화: ' + JSON.stringify(record));
        }
    }
}
