'use strict';
let $features = {
    event: {
        dtpEvents_onselect(elID, which, date) {
            syn.$l.eventLog('dtpEvents_onselect', `${which}: ${date}`);
        },

        dtpEvents_onreset(elID, startValue, endValue) {
            syn.$l.eventLog('dtpEvents_onreset', `초기화 (${startValue || '(빈 값)'} ~ ${endValue || '(빈 값)'})`);
        },

        dtpEvents_onconfirm(elID, startValue, endValue) {
            syn.$l.eventLog('dtpEvents_onconfirm', `${startValue} ~ ${endValue}`);
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$dateperiodpicker.getValue('dtpEvents'));
        },

        // setValue 는 콤마로 시작일/종료일을 구분한다. 콤마가 없으면 같은 값이 시작/종료에 모두 채워진다.
        btnSetValue_click() {
            syn.uicontrols.$dateperiodpicker.setValue('dtpEvents', '2026-01-01,2026-01-31');
        },

        btnSetSingle_click() {
            syn.uicontrols.$dateperiodpicker.setValue('dtpEvents', '2026-06-15');
        },

        btnClear_click() {
            syn.uicontrols.$dateperiodpicker.clear('dtpEvents');
        },

        btnShowPopup_click() {
            setTimeout(() => {
                syn.uicontrols.$dateperiodpicker.showPopup('dtpEvents');
            }, 0);
        },

        btnHidePopup_click() {
            syn.uicontrols.$dateperiodpicker.hidePopup();
        },

        btnGetControl_click() {
            let control = syn.uicontrols.$dateperiodpicker.getControl('dtpFields');
            syn.$l.eventLog('btnGetControl_click', `id: ${control.id}, 시작 입력창: ${control.textbox1ID}, 종료 입력창: ${control.textbox2ID}`);
        },

        // 컨트롤이 만든 입력창의 문자열을 직접 읽을 수도 있다(YYYY-MM-DD 형식이라 문자열 비교로 선후를 판단할 수 있다).
        btnFieldValues_click() {
            let startedAt = syn.$l.get('dtpEvents_StartedAt').value;
            let endedAt = syn.$l.get('dtpEvents_EndedAt').value;
            syn.$l.eventLog('btnFieldValues_click', `${startedAt} ~ ${endedAt} (시작 <= 종료: ${startedAt <= endedAt})`);
        }
    }
}
