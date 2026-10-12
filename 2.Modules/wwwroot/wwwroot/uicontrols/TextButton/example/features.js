'use strict';
let $features = {
    event: {
        btnDefault_click() { syn.$l.eventLog('btnDefault_click', syn.uicontrols.$button.getValue('btnDefault')); },
        btnPrimary_click() { syn.$l.eventLog('btnPrimary_click', syn.uicontrols.$button.getValue('btnPrimary')); },
        btnSecondary_click() { syn.$l.eventLog('btnSecondary_click', syn.uicontrols.$button.getValue('btnSecondary')); },
        btnSuccess_click() { syn.$l.eventLog('btnSuccess_click', syn.uicontrols.$button.getValue('btnSuccess')); },
        btnWarning_click() { syn.$l.eventLog('btnWarning_click', syn.uicontrols.$button.getValue('btnWarning')); },
        btnDanger_click() { syn.$l.eventLog('btnDanger_click', syn.uicontrols.$button.getValue('btnDanger')); },
        btnInfo_click() { syn.$l.eventLog('btnInfo_click', syn.uicontrols.$button.getValue('btnInfo')); },

        btnTypeButton_click() {
            syn.$l.eventLog('btnTypeButton_click', 'type=button 은 폼을 제출하지 않습니다.');
        },

        btnTypeReset_click() {
            syn.$l.eventLog('btnTypeReset_click', 'type=reset 은 폼 입력값을 초기값으로 되돌립니다.');
        },

        // submit 타입은 기본 동작(폼 제출)을 막아야 화면이 새로 고쳐지지 않는다.
        btnTypeSubmit_click(evt) {
            evt.preventDefault();
            syn.$l.eventLog('btnTypeSubmit_click', 'type=submit 의 기본 제출 동작을 막았습니다.');
        },

        btnTabler_click() {
            syn.$l.eventLog('btnTabler_click', 'Tabler 클래스(btn btn-primary)와 아이콘을 직접 지정한 버튼');
        },

        btnIcon_click() {
            syn.$l.eventLog('btnIcon_click', '아이콘 전용 버튼(btn-icon)');
        },

        btnGroup1_click() { syn.$l.eventLog('btnGroup1_click', '일간'); },
        btnGroup2_click() { syn.$l.eventLog('btnGroup2_click', '주간'); },
        btnGroup3_click() { syn.$l.eventLog('btnGroup3_click', '월간'); },

        btnTarget_click() {
            syn.$l.eventLog('btnTarget_click', '대상 버튼을 클릭했습니다.');
        },

        btnTarget_mouseover() {
            syn.$l.eventLog('btnTarget_mouseover', '마우스가 대상 버튼 위로 올라왔습니다.');
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$button.getValue('btnTarget'));
        },

        btnSetValue_click() {
            syn.uicontrols.$button.setValue('btnTarget', '변경된 라벨');
        },

        btnClear_click() {
            syn.uicontrols.$button.clear('btnTarget');
        },

        btnDisable_click() {
            syn.$l.get('btnTarget').disabled = true;
        },

        btnEnable_click() {
            syn.$l.get('btnTarget').disabled = false;
        },

        btnClasses_click() {
            syn.$l.eventLog('btnClasses_click', syn.$l.get('btnTarget').className);
        }
    }
}
