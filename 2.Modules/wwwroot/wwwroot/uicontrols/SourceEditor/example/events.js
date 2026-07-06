'use strict';
let $events = {
    prop: {
        isBound: false
    },

    event: {
        // SourceEditor는 syn-events로 change/blur/focus 같은 이벤트를 자동 연결해주지 않습니다.
        // 대신 getControl()로 Monaco 인스턴스를 얻어 공식 이벤트 API를 직접 등록해야 합니다.
        btnBindEvents_click() {
            var control = syn.uicontrols.$sourceeditor.getControl('txtEvent');
            if (!control || !control.editor) {
                syn.$l.eventLog('btnBindEvents_click', '에디터가 아직 초기화되지 않았습니다. 잠시 후 다시 시도하세요.');
                return;
            }

            if ($events.prop.isBound) {
                syn.$l.eventLog('btnBindEvents_click', '이미 이벤트가 연결되어 있습니다.');
                return;
            }

            control.editor.onDidChangeModelContent(function (evt) {
                syn.$l.eventLog('txtEvent_change', control.editor.getValue());
            });

            control.editor.onDidFocusEditorText(function () {
                syn.$l.eventLog('txtEvent_focus', '포커스를 얻었습니다');
            });

            control.editor.onDidBlurEditorText(function () {
                syn.$l.eventLog('txtEvent_blur', '포커스를 잃었습니다');
            });

            $events.prop.isBound = true;
            syn.$l.eventLog('btnBindEvents_click', '이벤트가 연결되었습니다. 에디터에 입력해보세요.');
        },

        btnGetValue_click() {
            var value = syn.uicontrols.$sourceeditor.getValue('txtEvent');
            syn.$l.eventLog('btnGetValue_click', value);
        },

        btnSetValue_click() {
            syn.uicontrols.$sourceeditor.setValue('txtEvent', 'function hello() {\n\treturn "world";\n}');
        },

        btnClear_click() {
            syn.uicontrols.$sourceeditor.clear('txtEvent');
        }
    }
}
