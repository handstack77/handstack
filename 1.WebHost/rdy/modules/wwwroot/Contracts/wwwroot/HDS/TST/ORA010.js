'use strict';
let $ORA010 = {
    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }]
        }
    },

    event: {
        btnSearch_click(evt) {
            syn.$w.transactionAction('GD01');
        }
    }
}
