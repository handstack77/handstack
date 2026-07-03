'use strict';

let $TST020 = {
    event: {
        btnExecuteFunction_click() {
            if ($this.method.validateInputFields(['txtUrl', 'txtJsonMessage']) === false) return;

            let data = syn.$l.get('txtJsonMessage').value.trim();

            let xhr = new XMLHttpRequest();
            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4) {
                    syn.$l.get('txtFunctionResult').value = JSON.stringify(JSON.parse(this.responseText), null, 4);
                }
            });

            xhr.open("POST", syn.$l.get('txtUrl').value.trim());
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("AuthorizationKey", syn.$l.get('txtAuthorizationKey').value.trim());

            xhr.send(data);
        }
    },

    method: {
        validateInputFields(fields) {
            for (let field of fields) {
                if (syn.$l.get(field).value.trim() === '') {
                    syn.$w.alert(`${field}를 입력하세요.`, null, null, () => {
                        syn.$l.get(field).focus();
                    });
                    return false;
                }
            }
            return true;
        }
    }
};
