'use strict';
let $features = {
    prop: {
        fruitIDs: ['chkFruitApple', 'chkFruitBanana', 'chkFruitGrape']
    },

    event: {
        chkDefault_change() {
            syn.$l.eventLog('chkDefault_change', syn.uicontrols.$checkbox.getValue('chkDefault'));
        },

        chkDefault_click() {
            syn.$l.eventLog('chkDefault_click', '클릭 이벤트 (getValue: ' + syn.uicontrols.$checkbox.getValue('chkDefault') + ')');
        },

        chkUseYN_change() {
            syn.$l.eventLog('chkUseYN_change', syn.uicontrols.$checkbox.getValue('chkUseYN'));
        },

        chkStatus_change() {
            syn.$l.eventLog('chkStatus_change', syn.uicontrols.$checkbox.getValue('chkStatus'));
        },

        chkSyn_change() {
            syn.$l.eventLog('chkSyn_change', syn.uicontrols.$checkbox.getValue('chkSyn'));
        },

        // 전체 선택: 그룹의 모든 항목을 같은 상태로 맞춘다.
        chkAll_change() {
            let isChecked = syn.uicontrols.$checkbox.getValue('chkAll') == 'Y';
            $this.prop.fruitIDs.forEach((id) => {
                syn.uicontrols.$checkbox.setValue(id, isChecked == true ? '1' : '');
            });
        },

        chkFruitApple_change() {
            $this.method.syncAll();
        },

        chkFruitBanana_change() {
            $this.method.syncAll();
        },

        chkFruitGrape_change() {
            $this.method.syncAll();
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$checkbox.getValue('chkUseYN'));
        },

        btnSetY_click() {
            syn.uicontrols.$checkbox.setValue('chkUseYN', 'Y');
            syn.$l.eventLog('btnSetY_click', 'checkedValue 와 일치하면 체크 상태가 됩니다.');
        },

        btnSetTrue_click() {
            syn.uicontrols.$checkbox.setValue('chkUseYN', true);
            syn.$l.eventLog('btnSetTrue_click', 'checkedValue(Y)와 일치하지 않는 값이라 체크되지 않습니다. 현재 값: ' + syn.uicontrols.$checkbox.getValue('chkUseYN'));
        },

        btnSetEmpty_click() {
            syn.uicontrols.$checkbox.setValue('chkUseYN', '');
            syn.$l.eventLog('btnSetEmpty_click', 'falsy 값은 항상 체크 해제됩니다.');
        },

        btnToggle_click() {
            syn.uicontrols.$checkbox.toggleValue('chkUseYN');
            syn.$l.eventLog('btnToggle_click', syn.uicontrols.$checkbox.getValue('chkUseYN'));
        },

        btnClear_click() {
            ['chkDefault', 'chkUseYN', 'chkStatus', 'chkSyn', 'chkAll'].forEach((id) => {
                syn.uicontrols.$checkbox.clear(id);
            });
            $this.prop.fruitIDs.forEach((id) => {
                syn.uicontrols.$checkbox.clear(id);
            });
        },

        btnGroupNames_click() {
            syn.$l.eventLog('btnGroupNames_click', JSON.stringify(syn.uicontrols.$checkbox.getGroupNames()));
        },

        btnGroupValues_click() {
            let selected = $this.prop.fruitIDs.filter((id) => {
                return syn.uicontrols.$checkbox.getValue(id) == '1';
            });
            syn.$l.eventLog('btnGroupValues_click', '선택된 항목: ' + (selected.length == 0 ? '(없음)' : selected.join(', ')));
        }
    },

    method: {
        // 개별 항목이 모두 체크되면 '전체 선택'도 체크하고, 하나라도 빠지면 해제한다.
        syncAll() {
            let allChecked = $this.prop.fruitIDs.every((id) => {
                return syn.uicontrols.$checkbox.getValue(id) == '1';
            });
            syn.uicontrols.$checkbox.setValue('chkAll', allChecked == true ? 'Y' : '');
        }
    }
}
