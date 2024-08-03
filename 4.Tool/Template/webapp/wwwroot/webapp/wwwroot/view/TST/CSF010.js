'use strict';
let $CSF010 = {
    transaction: {
        GF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }]
        }
    },

    event: {
        btnSearch_click(evt) {
            syn.$w.transactionAction('GF01');
        }
    }
}
