'use strict';
let $features = {
    event: {
        txtComment_focus(evt) {
            syn.$l.eventLog('txtComment_focus', '포커스 진입');
        },

        txtComment_input(evt) {
            syn.$l.eventLog('txtComment_input', evt.target.value);
        },

        txtComment_change(evt) {
            syn.$l.eventLog('txtComment_change', syn.uicontrols.$textbox.getValue('txtComment'));
        },

        txtComment_blur(evt) {
            syn.$l.eventLog('txtComment_blur', syn.uicontrols.$textbox.getValue('txtComment'));
        },

        txtAmount_change(evt) {
            syn.$l.eventLog('txtAmount_change', `표시값: ${evt.target.value}, getValue: ${syn.uicontrols.$textbox.getValue('txtAmount')}`);
        },

        btnSetItems_click() {
            syn.uicontrols.$textbox.setDatalistItems('txtCity', ['제주특별자치도', '강원특별자치도', '경기도']);
            syn.$l.eventLog('btnSetItems_click', '목록 교체: ' + JSON.stringify(syn.uicontrols.$textbox.getDatalistItems('txtCity')));
        },

        btnAddItem_click() {
            syn.uicontrols.$textbox.addDatalistItem('txtCity', { value: 'ULS', label: '울산광역시' });
            syn.$l.eventLog('btnAddItem_click', '항목 추가: 울산광역시');
        },

        btnRemoveItem_click() {
            syn.uicontrols.$textbox.removeDatalistItem('txtCity', '대구광역시');
            syn.$l.eventLog('btnRemoveItem_click', '항목 제거: 대구광역시');
        },

        btnFilterItems_click() {
            syn.uicontrols.$textbox.filterDatalistItems('txtCity', '광역시');
            syn.$l.eventLog('btnFilterItems_click', "'광역시'가 포함된 항목만 표시");
        },

        btnGetItems_click() {
            syn.$l.eventLog('btnGetItems_click', JSON.stringify(syn.uicontrols.$textbox.getDatalistItems('txtCity')));
        },

        btnLoadItems_click() {
            syn.uicontrols.$textbox.loadDatalistItems('txtRemoteCity', '/uicontrols/TextBox/example/code/cities.json', function (items) {
                syn.$l.eventLog('btnLoadItems_click', `${items.length}건 로드`);
            });
        },

        btnClearItems_click() {
            syn.uicontrols.$textbox.clearDatalistItems('txtCity');
            syn.$l.eventLog('btnClearItems_click', '자동완성 목록 비움');
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify({
                Amount: syn.uicontrols.$textbox.getValue('txtAmount'),
                Comment: syn.uicontrols.$textbox.getValue('txtComment'),
                Email: syn.uicontrols.$textbox.getValue('txtEmail')
            }));
        },

        btnSetValue_click() {
            syn.uicontrols.$textbox.setValue('txtAmount', 1234567);
            syn.$l.eventLog('btnSetValue_click', `표시값: ${syn.$l.get('txtAmount').value}`);
        },

        btnSetNull_click() {
            syn.uicontrols.$textbox.setValue('txtAmount', null);
            syn.$l.eventLog('btnSetNull_click', 'null 은 triggerConfig 값 또는 빈 문자열로 대체됩니다.');
        },

        btnClear_click() {
            syn.uicontrols.$textbox.clear('txtAmount');
            syn.uicontrols.$textbox.clear('txtComment');
        },

        btnValidate_click() {
            let amount = syn.uicontrols.$textbox.getValue('txtAmount');
            if (amount == '') {
                syn.$w.alert('금액 항목은 반드시 입력 해야합니다.');
                return;
            }

            if (/^-?\d+$/.test(amount) == false) {
                syn.$w.alert('금액은 숫자만 입력할 수 있습니다.');
                return;
            }

            syn.$l.eventLog('btnValidate_click', `검증 통과: ${amount}`);
        }
    }
}
