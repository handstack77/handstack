'use strict';
let $features = {
    method: {
        // 클릭된 라디오가 아니라 그룹에서 '지금 선택된 값'을 기준으로 화면을 갱신한다.
        viewVisible() {
            let isList = syn.uicontrols.$radio.getSelectedByValue('rdoView') == 'LIST';
            syn.$l.get('divListView').classList.toggle('hidden', isList == false);
            syn.$l.get('divCardView').classList.toggle('hidden', isList == true);
        }
    },

    event: {
        rdoUseYn1_change() {
            syn.$l.eventLog('rdoUseYn1_change', '선택값: ' + syn.uicontrols.$radio.getSelectedByValue('rdoUseYn'));
        },

        rdoUseYn2_change() {
            syn.$l.eventLog('rdoUseYn2_change', '선택값: ' + syn.uicontrols.$radio.getSelectedByValue('rdoUseYn'));
        },

        rdoGrade1_change() {
            syn.$l.eventLog('rdoGrade1_change', syn.uicontrols.$radio.getSelectedByValue('rdoGrade'));
        },

        rdoGrade2_change() {
            syn.$l.eventLog('rdoGrade2_change', syn.uicontrols.$radio.getSelectedByValue('rdoGrade'));
        },

        rdoGrade3_change() {
            syn.$l.eventLog('rdoGrade3_change', syn.uicontrols.$radio.getSelectedByValue('rdoGrade'));
        },

        rdoView1_change() {
            $this.method.viewVisible();
        },

        rdoView2_change() {
            $this.method.viewVisible();
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', 'rdoUseYn1.checked = ' + syn.uicontrols.$radio.getValue('rdoUseYn1'));
        },

        btnSetValue_click() {
            syn.uicontrols.$radio.setValue('rdoUseYn2', true);
            syn.$l.eventLog('btnSetValue_click', '선택값: ' + syn.uicontrols.$radio.getSelectedByValue('rdoUseYn'));
        },

        btnClear_click() {
            syn.uicontrols.$radio.clear('rdoUseYn2');
            syn.$l.eventLog('btnClear_click', '선택값: ' + (syn.uicontrols.$radio.getSelectedByValue('rdoUseYn') || '(없음)'));
        },

        btnGroupNames_click() {
            syn.$l.eventLog('btnGroupNames_click', JSON.stringify(syn.uicontrols.$radio.getGroupNames()));
        },

        btnSelectedByValue_click() {
            syn.$l.eventLog('btnSelectedByValue_click', syn.uicontrols.$radio.getSelectedByValue('rdoGrade'));
        },

        btnSelectedByText_click() {
            syn.$l.eventLog('btnSelectedByText_click', syn.uicontrols.$radio.getSelectedByText('rdoGrade'));
        },

        btnSelectedByID_click() {
            syn.$l.eventLog('btnSelectedByID_click', syn.uicontrols.$radio.getSelectedByID('rdoGrade'));
        },

        btnSelectedValue_click() {
            syn.uicontrols.$radio.selectedValue('rdoGrade', 'C');
            syn.$l.eventLog('btnSelectedValue_click', '선택값: ' + syn.uicontrols.$radio.getSelectedByValue('rdoGrade'));
        }
    }
}
