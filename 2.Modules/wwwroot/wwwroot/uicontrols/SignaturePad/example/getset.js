'use strict';
let $getset = {
    event: {
        async btnCopy_click() {
            var value = syn.uicontrols.$signaturepad.getValue('sigSource');

            // setValue 는 이미지 로딩이 끝나면 완료되는 Promise<boolean> 을 반환합니다. 빈 문자열을 넣으면 지웁니다.
            var success = await syn.uicontrols.$signaturepad.setValue('sigTarget', value);
            syn.$l.eventLog('btnCopy_click', 'setValue 결과: ' + success);
        },

        btnBase64_click() {
            // 'data:image/png;base64,' 를 뺀 base64 본문만 반환합니다.
            var base64 = syn.uicontrols.$signaturepad.getBase64('sigSource');
            syn.$l.eventLog('btnBase64_click', base64 ? base64.substring(0, 40) + '... (' + base64.length + ' chars)' : '(빈 값)');
        },

        async btnSetBase64_click() {
            // 접두사가 없는 base64 도 받아들이며, 앞부분(iVBOR, /9j/ 등)으로 이미지 형식을 판별합니다.
            var png1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            var success = await syn.uicontrols.$signaturepad.setValue('sigTarget', png1x1);
            syn.$l.eventLog('btnSetBase64_click', 'setValue 결과: ' + success);
        },

        async btnSetInvalid_click() {
            // 이미지 data URL / base64 가 아니면 값을 바꾸지 않고 false 를 반환합니다.
            var success = await syn.uicontrols.$signaturepad.setValue('sigTarget', 'not-an-image');
            syn.$l.eventLog('btnSetInvalid_click', 'setValue 결과: ' + success);
        },

        btnClear_click() {
            syn.uicontrols.$signaturepad.clear('sigSource');
            syn.uicontrols.$signaturepad.clear('sigTarget');
        }
    }
}
