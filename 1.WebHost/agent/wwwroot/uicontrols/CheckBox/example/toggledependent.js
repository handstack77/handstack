'use strict';
let $toggledependent = {
    event: {
        chkContractYN_change() {
            // getValue는 boolean이 아니라 checkedValue/uncheckedValue 문자열('Y'/'N')을 반환한다.
            // 논리 조건으로 쓰려면 $string.toBoolean으로 감싸는 것이 실무 코드의 일반적인 관행이다.
            var isContracted = $string.toBoolean(syn.uicontrols.$checkbox.getValue('chkContractYN') == 'Y');

            if (isContracted == true) {
                if (syn.uicontrols.$datepicker.getValue('dtpContractDate') == '') {
                    syn.uicontrols.$datepicker.setValue('dtpContractDate', $date.toString(new Date(), 'd'));
                }
            }
            else {
                syn.uicontrols.$datepicker.setValue('dtpContractDate', '');
            }

            syn.$l.eventLog('chkContractYN_change', 'ContractYN: ' + syn.uicontrols.$checkbox.getValue('chkContractYN'));
        }
    }
}
