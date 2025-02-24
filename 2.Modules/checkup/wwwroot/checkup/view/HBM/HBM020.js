'use strict';
let $HBM020 = {
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
                var withPublics = syn.uicontrols.$auigrid.getSettings('grdAppPublics').data.filter((item) => item.Flag != 'D').map((item) => item);
                withPublics = $array.distinct(withPublics).filter(n => n);

                for (var i = 0, length = withPublics.length; i < length; i++) {
                    delete withPublics[i].Flag;
                }

                syn.$l.get('txtWithPublics').value = JSON.stringify(withPublics);

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

    prop: {
    },

    transaction: {
        LF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'AppPublics' }
            ]
        },

        MF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($object.isNullOrUndefined(error) == true) {
                    syn.$w.notify('success', '저장 되었습니다');
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        },
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            syn.$l.get('txtUserWorkID').value = syn.$w.ManagedApp.UserWorkID;
            syn.$l.get('txtApplicationID').value = syn.$w.ManagedApp.ApplicationID;

            $this.method.search();
        },
    },

    event: {
        btnAddAppPublics_click() {
            syn.uicontrols.$auigrid.insertRow('grdAppPublics', {
                amount: 1,
                focusColumnID: 'ProjectID'
            });
        },

        btnRemoveAppPublics_click() {
            syn.uicontrols.$auigrid.removeRow('grdAppPublics');
        }
    },

    method: {
        search() {
            syn.$w.transactionAction('LF01');
        },
    },
}
