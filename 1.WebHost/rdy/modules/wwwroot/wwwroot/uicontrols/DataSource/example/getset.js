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
            // srcForm의 columns에 등록된 필드(Name, Age)를 한 번에 설정합니다.
            // 필드에 bindingID로 연결된 화면 컨트롤이 있으면 그 컨트롤의 setValue까지 자동으로 호출되어 화면에도 반영됩니다(양방향 바인딩).
            syn.uicontrols.$data.setValue('srcForm', { Name: '홍길동', Age: 30 });
            var record = syn.uicontrols.$data.getValue('srcForm', true);
            syn.$l.eventLog('btnSetValueAttempt_click', JSON.stringify(record));
        },

        btnSetValueCorrect_click() {
            // 화면 컨트롤의 setValue를 직접 호출해도 동일하게 DataSource에 반영됩니다(반대 방향의 바인딩 경로).
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
