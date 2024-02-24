'use strict';
let $HAC040 = {
    config: {
        actionButtons: [{
            command: 'search',
            icon: 'search',
            text: '조회',
            action(evt) {
                $this.method.search();
            }
        },
        {
            command: 'save',
            icon: 'edit',
            text: '저장',
            class: 'btn-primary',
            action(evt) {
                var applicationID = syn.$l.get('txtApplicationID').value.trim();
                if (applicationID == '') {
                    syn.$w.alert('어플리케이션 ID를 입력하세요');
                    return false;
                }

                var applicationName = syn.$l.get('txtApplicationName').value.trim();
                if (applicationName == '') {
                    syn.$w.alert('어플리케이션 명을 입력하세요');
                    return false;
                }

                $this.store.Exception.Error = '';
                syn.$w.transactionAction('MF01');
            }
        },
        {
            command: 'refresh',
            icon: 'refresh',
            action(evt) {
                location.reload();
            }
        }]
    },

    transaction: {
        GF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ]
        },

        DF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '앱 삭제가 완료 되었습니다');

                    syn.$r.httpRequest('GET', '/handsup/api/tenant-app/logout');
                    syn.$w.removeStorage('program_token', true);
                    syn.$w.removeStorage('handstack_managedapp', true);
                    setTimeout(() => {
                        location.href = `/handsup/checkin.html?tick=${(new Date()).getTime()}`;
                    }, 3000);
                }
                else {
                    syn.$w.notify('warning', '앱 삭제에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        },

        MF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '저장 되었습니다');

                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        }
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            syn.$l.get('txtApplicationNo').value = syn.$w.ManagedApp.ApplicationNo;
            syn.$l.get('txtUserWorkID').value = syn.$w.ManagedApp.UserWorkID;
            syn.$l.get('txtApplicationID').value = syn.$w.ManagedApp.ApplicationID;
            syn.$l.get('txtUserNo').value = syn.$w.User.UserNo;

            $this.method.search();
        }
    },

    event: {
        btnAppSecretGenerate_click(evt) {
            syn.$l.get('txtAppSecret').value = syn.$l.random();
        },

        btnDeleteApp_click(evt) {
            var applicationID = syn.$l.get('txtApplicationID').value;
            var text = prompt(`삭제를 하기 위해 어플리케이션 ID "${applicationID}"를 입력하세요`);
            if (text == applicationID) {
                syn.$w.transactionAction('DF01');
            }
        }
    },

    method: {
        search() {
            syn.$w.transactionAction('GF01');
        }
    },
}
