'use strict';
let $validate = {
    extends: [
        'parsehtml'
    ],

    method: {
        customValidation(options) {
            console.log(options);
            return syn.$l.get('txt_custom').value.trim() != '';
        }
    },

    event: {
        btn_isContinue_click() {
            syn.$v.isContinue = syn.$string.toBoolean(syn.$l.get('txt_isContinue').value);
        },

        btn_messages_click() {
            syn.$l.get('txt_messages').value = JSON.stringify(syn.$v.messages);
        },

        btn_elements_click() {
            syn.$l.get('txt_elements').value = JSON.stringify(syn.$v.elements, null, 2);
        },

        btn_targetEL_click() {
            syn.$l.get('txt_targetEL').value = syn.$v.targetEL ? syn.$v.targetEL.id : '';
        },

        btn_regexs_click() {
            var summary = Object.keys(syn.$v.regexs).map((key) => `${key}: ${syn.$v.regexs[key]}`).join('\n');
            syn.$l.get('txt_regexs').value = summary;
        },

        btn_roles_click() {
            syn.$l.get('txt_roles').value = JSON.stringify(syn.$v.roles);
        },

        btn_typeConstants_click() {
            syn.$l.get('txt_typeConstants').value = `valueType: ${JSON.stringify(syn.$v.valueType)}\nvalidType: ${JSON.stringify(syn.$v.validType)}`;
        },

        btn_setElement_click() {
            syn.$v.setElement('txt_setElement');
            syn.$l.get('txt_setElement').value = '설정되었습니다';
        },

        btn_required_click() {
            syn.$v.required('txt_required', true, 'Required 검사가 실패했습니다.');
        },

        btn_required_validateControl_click() {
            var isValid = syn.$v.validateControl('txt_required');
            if (isValid == false) {
                var messages = syn.$v.toMessages();
                if ($string.isNullOrEmpty(messages) == false) {
                    alert(messages);
                }
            }
        },

        btn_pattern_numeric_click() {
            syn.$v.pattern('txt_pattern', 'numeric', { 'expr': syn.$v.regexs.numeric, 'message': '숫자를 입력 해야합니다.' });
        },

        btn_pattern_email_click() {
            syn.$v.pattern('txt_pattern', 'email', { 'expr': syn.$v.regexs.email, 'message': '이메일을 입력 해야합니다.' });
        },

        btn_pattern_juminNo_click() {
            syn.$v.pattern('txt_pattern', 'juminNo', { 'expr': syn.$v.regexs.juminNo, 'message': '주민등록번호를 입력 해야합니다.' });
        },

        btn_pattern_validateControl_click() {
            var isValid = syn.$v.validateControl('txt_pattern');
            if (isValid == false) {
                var messages = syn.$v.toMessages();
                if ($string.isNullOrEmpty(messages) == false) {
                    alert(messages);
                }
            }
        },

        btn_range_click() {
            syn.$v.pattern('txt_range', 'numeric', { 'expr': syn.$v.regexs.numeric, 'message': '숫자를 입력 해야합니다.' });
            syn.$v.range('txt_range', 'overflow', { 'min': 0, 'max': 100, 'minOperator': '<', 'maxOperator': '>', 'message': '1 ~ 100 이내 값을 입력 해야합니다.' });
        },

        btn_range_validateControl_click() {
            var isValid = syn.$v.validateControl('txt_range');
            if (isValid == false) {
                var messages = syn.$v.toMessages();
                if ($string.isNullOrEmpty(messages) == false) {
                    alert(messages);
                }
            }
        },

        btn_custom_click() {
            syn.$v.custom('txt_custom', 'customVaild', { 'functionName': 'customValidation', 'functionParam1': 'ok', 'message': '사용자 지정 검사가 실패했습니다.' });
        },

        btn_custom_validateControl_click() {
            var isValid = syn.$v.validateControl('txt_custom');
            if (isValid == false) {
                var messages = syn.$v.toMessages();
                if ($string.isNullOrEmpty(messages) == false) {
                    alert(messages);
                }
            }
        },

        btn_removeValidate_click() {
            syn.$v.setElement('txt_pattern');
            syn.$v.removeValidate('pattern', 'numeric');
            syn.$l.get('txt_removeTarget').value = 'txt_pattern 의 pattern.numeric 규칙이 제거되었습니다';
        },

        btn_remove_click() {
            syn.$v.setElement('txt_pattern');
            syn.$v.remove('numeric');
            syn.$l.get('txt_removeTarget').value = 'txt_pattern 의 numeric 규칙(pattern/range/custom)이 모두 제거되었습니다';
        },

        btn_clear_click() {
            syn.$v.clear();
            alert('모든 검증 규칙과 상태가 초기화되었습니다.');
        },

        btn_validateControl_click() {
            var elID = syn.$l.get('txt_validateControl').value;
            var isValid = syn.$v.validateControl(elID);
            alert(`${elID}: ${isValid}`);
        },

        btn_validateControls_click() {
            var isValid = syn.$v.validateControls(syn.$l.get('txt_required', 'txt_pattern', 'txt_range', 'txt_custom'));
            if (isValid == false) {
                var messages = syn.$v.toMessages();
                if ($string.isNullOrEmpty(messages) == false) {
                    alert(messages);
                }
            }
        },

        btn_validateForm_click() {
            var isValid = syn.$v.validateForm();
            if (isValid == false) {
                var messages = syn.$v.toMessages();
                if ($string.isNullOrEmpty(messages) == false) {
                    alert(messages);
                }
            }
        },

        btn_toMessages_click() {
            syn.$l.get('txt_toMessagesResult').value = syn.$v.toMessages();
        },

        btn_getRoleValue_click() {
            syn.$l.get('txt_roleResult').value = syn.$v.getRoleValue(syn.$l.get('txt_roleInput').value);
        },

        btn_getRoleName_click() {
            syn.$l.get('txt_roleResult').value = syn.$v.getRoleName(syn.$l.get('txt_roleInput').value);
        }
    }
};
