'use strict';
let $getset = {
    event: {
        btnGetValueDefault_click() {
            // storeType: 'Form'에서 isAll을 생략하면, 값이 객체 타입인 필드만 남기 때문에
            // 문자열/숫자 필드뿐인 이 예제에서는 대부분 빈 객체({})가 반환됩니다.
            var record = syn.uicontrols.$data.getValue('srcForm');
            syn.$l.eventLog('btnGetValueDefault_click', JSON.stringify(record));
        },

        btnGetValueAll_click() {
            // isAll을 true로 주면 Name/Age 필드가 모두 채워진 레코드를 그대로 돌려받습니다.
            var record = syn.uicontrols.$data.getValue('srcForm', true);
            syn.$l.eventLog('btnGetValueAll_click', JSON.stringify(record));
        },

        btnSetValueAttempt_click() {
            // DataSource.setValue는 빈 구현("지원 안함")이라 호출해도 저장소 값이 바뀌지 않습니다.
            syn.uicontrols.$data.setValue('srcForm', { Name: '무시됨', Age: 0 });
            var record = syn.uicontrols.$data.getValue('srcForm', true);
            syn.$l.eventLog('btnSetValueAttempt_click', '변화 없음: ' + JSON.stringify(record));
        },

        btnSetValueCorrect_click() {
            // 값을 바꾸려면 bindingID로 연결된 화면 컨트롤의 setValue를 사용해야 DataSource에도 반영됩니다.
            syn.uicontrols.$textbox.setValue('txtName', '홍길동');
            syn.uicontrols.$textbox.setValue('txtAge', 30);
            var record = syn.uicontrols.$data.getValue('srcForm', true);
            syn.$l.eventLog('btnSetValueCorrect_click', JSON.stringify(record));
        },

        btnClear_click() {
            syn.uicontrols.$data.clear('srcForm');
            var record = syn.uicontrols.$data.getValue('srcForm', true);
            syn.$l.eventLog('btnClear_click', 'srcForm 저장소 초기화: ' + JSON.stringify(record));
        }
    }
}
