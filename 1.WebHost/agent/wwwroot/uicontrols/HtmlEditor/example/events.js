'use strict';
let $events = {
    event: {
        // 에디터 초기화(비동기 로드 포함)가 끝난 직후 1회 호출됩니다.
        // getValue/setValue를 안전하게 호출할 수 있는 시점을 파악하는 용도로 사용합니다.
        edtEvent_documentReady(elID, editor) {
            syn.$l.eventLog('edtEvent_documentReady', elID + ' 초기화 완료');
        },

        // 에디터 안에서 이미지 크기를 드래그로 조절하면 호출됩니다.
        edtEvent_imageResized(elID, evt, editor, selectedImage) {
            syn.$l.eventLog('edtEvent_imageResized', 'width: ' + evt.width + ', height: ' + evt.height);

            if (evt.width > 600) {
                var ratio = evt.width / evt.height;
                evt.width = 600;
                evt.height = parseFloat(evt.width / ratio);
                editor.dom.setStyle(selectedImage, 'width', evt.width);
                editor.dom.setStyle(selectedImage, 'height', evt.height);
                selectedImage.setAttribute('width', evt.width);
                selectedImage.setAttribute('height', evt.height);

                syn.$l.eventLog('edtEvent_imageResized', '600px를 초과해 자동으로 축소했습니다.');
            }
        },

        btnGetValue_click() {
            var value = syn.uicontrols.$htmleditor.getValue('edtEvent');
            syn.$l.eventLog('btnGetValue_click', value);
        },

        btnSetValue_click() {
            syn.uicontrols.$htmleditor.setValue('edtEvent', '<p>변경된 내용입니다.</p>');
        },

        btnClear_click() {
            syn.uicontrols.$htmleditor.clear('edtEvent');
        },

        btnIsDirty_click() {
            var dirty = syn.uicontrols.$htmleditor.isDirty('edtEvent');
            syn.$l.eventLog('btnIsDirty_click', '변경 여부: ' + dirty);
        }
    }
}
