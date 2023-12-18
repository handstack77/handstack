'use strict';
let $DOC099 = {
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
            hidden: true,
            action(evt) {
            }
        },
        {
            command: 'delete',
            icon: 'trash',
            text: '삭제',
            class: 'btn-danger',
            hidden: true,
            action(evt) {
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
        variableName: 'ready',
    },

    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }],
            callback: (error, responseObject, addtionalData) => {
                if ($object.isNullOrUndefined(error) == true) {

                }
            }
        },
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            $this.prop.variableName = 'loaded';
        },
    },

    event: {
        btnNewItem_click() {
            syn.$l.eventLog('$this.event.btnNewItem_click', $this.prop.variableName, 'Information');
        }
    },

    method: {
        search() {
            syn.$w.transactionAction('GD01');
        }
    }
}
