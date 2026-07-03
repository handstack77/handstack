'use strict';
let $validate = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$k.version;
        }
    },

    method: {
        customValidation(options) {
            console.log(options);
            return syn.$l.get('txt_custom').value.trim() != '';
        }
    },

    event: {
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
        }
    }
};
