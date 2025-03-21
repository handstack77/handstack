﻿'use strict';

let $TST010 = {
    event: {
        btnMakeBatchScript_click() {
            if ($this.method.validateInputFields(['txtUrl', 'txtJsonMessage']) === false) return;

            let data = syn.$l.get('txtJsonMessage').value.trim();
            syn.$l.get('txtFunctionResult').value = `curl -X POST "${syn.$l.get('txtUrl').value.trim()}" -H "Content-Type: application/json" -H "AuthorizationKey: ${syn.$l.get('txtAuthorizationKey').value.trim()}" -d ""${JSON.stringify(JSON.parse(data)).replaceAll('"', '\\"')}""`;
        },

        btnMakeBashScript_click() {
            if ($this.method.validateInputFields(['txtUrl', 'txtJsonMessage']) === false) return;

            let data = syn.$l.get('txtJsonMessage').value.trim();
            syn.$l.get('txtFunctionResult').value = `curl --location --request POST '${syn.$l.get('txtUrl').value.trim()}' --header 'Content-Type: application/json' --header "AuthorizationKey: ${syn.$l.get('txtAuthorizationKey').value.trim()}" --data-raw '${JSON.stringify(JSON.parse(data), null, 4)}'`;
        },

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
