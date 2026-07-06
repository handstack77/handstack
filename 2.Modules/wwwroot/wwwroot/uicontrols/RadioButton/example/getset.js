'use strict';
let $getset = {
    event: {
        btnGetValue_click() {
            // getValue는 개별 라디오 항목 하나의 checked 상태(true/false)를 반환합니다.
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$radio.getValue('rdoUseYn1')));
        },

        btnSetValue_click() {
            // setValue는 개별 라디오 항목 하나의 checked 상태를 설정합니다.
            syn.uicontrols.$radio.setValue('rdoUseYn1', true);
            syn.$l.eventLog('btnSetValue_click', 'rdoUseYn1 selected');
        },

        btnClear_click() {
            // clear는 개별 라디오 항목의 선택을 해제합니다.
            syn.uicontrols.$radio.clear('rdoUseYn1');
            syn.$l.eventLog('btnClear_click', 'rdoUseYn1 cleared');
        },

        btnSelectedValue_click() {
            // selectedValue는 그룹(name) 단위로 value가 일치하는 항목을 선택 상태로 만듭니다.
            syn.uicontrols.$radio.selectedValue('rdoUseYn', 'N');
            syn.$l.eventLog('btnSelectedValue_click', 'rdoUseYn group set to N');
        }
    }
}
