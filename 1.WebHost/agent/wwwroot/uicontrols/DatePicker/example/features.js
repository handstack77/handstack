'use strict';
let $features = {
    event: {
        // DatePicker 는 syn-events 대신 '{elID}_onselect' 관례 함수를 정의하면 열릴 때, 닫힐 때, 날짜를 선택할 때 호출된다.
        dtpNow_onselect(elID, date) {
            syn.$l.eventLog('dtpNow_onselect', elID + ' => ' + date);
        },

        dtpRangeStart_onselect(elID, date) {
            syn.$l.eventLog('dtpRangeStart_onselect', elID + ' => ' + date);
        },

        dtpRangeEnd_onselect(elID, date) {
            syn.$l.eventLog('dtpRangeEnd_onselect', elID + ' => ' + date);
        },

        dtpTime_onselect(elID, date) {
            syn.$l.eventLog('dtpTime_onselect', elID + ' => ' + date);
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify({
                Now: syn.uicontrols.$datepicker.getValue('dtpNow'),
                Format: syn.uicontrols.$datepicker.getValue('dtpFormat'),
                Time: syn.uicontrols.$datepicker.getValue('dtpTime')
            }));
        },

        btnSetValue_click() {
            syn.uicontrols.$datepicker.setValue('dtpNow', '2026-12-31');
        },

        btnSetDate_click() {
            let control = syn.uicontrols.$datepicker.getControl('dtpNow');
            control.picker.setDate(new Date(2027, 0, 15));
            syn.$l.eventLog('btnSetDate_click', 'Pikaday setDate(Date) => ' + control.picker.getDate());
        },

        btnClear_click() {
            syn.uicontrols.$datepicker.clear('dtpNow');
            syn.uicontrols.$datepicker.clear('dtpTime');
        },

        btnSetMin_click() {
            let control = syn.uicontrols.$datepicker.getControl('dtpNow');
            control.picker.setMinDate(new Date(new Date().getTime() + 86400000));
            syn.$l.eventLog('btnSetMin_click', '내일 이전 날짜는 선택할 수 없습니다.');
        },

        btnShow_click() {
            // 버튼 클릭이 문서 클릭(바깥 클릭 닫기)으로 이어져 바로 닫히지 않도록 다음 틱에 연다.
            setTimeout(() => {
                syn.uicontrols.$datepicker.getControl('dtpFormat').picker.show();
            }, 0);
        },

        btnGetControl_click() {
            let control = syn.uicontrols.$datepicker.getControl('dtpNow');
            syn.$l.eventLog('btnGetControl_click', `id: ${control.id}, format: ${control.setting.format}, picker.isVisible: ${control.picker.isVisible()}`);
        },

        btnTimeSet_click() {
            syn.uicontrols.$datepicker.setValue('dtpTime', '2026-12-31 18:30');
        }
    }
}
