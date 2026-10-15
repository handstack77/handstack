'use strict';
let $basic = {
    transaction: {
        LD01: { inputs: [{ type: 'Row', dataFieldID: 'MainForm' }], outputs: [] },
        UD01: { inputs: [], outputs: [{ type: 'Form', dataFieldID: 'MainForm' }] }
    },
    hook: {
        pageLoad() { $this.method.show(); }
    },
    event: {
        calDay_change(evt) {
            $this.method.log('day change', evt.detail); $this.method.show();
        },

        calDay_viewChange(evt) {
            $this.method.log('day viewChange', evt.detail);
        },

        calMonth_change(evt) {
            $this.method.log('month change', evt.detail); $this.method.show();
        },

        calMonth_viewChange(evt) {
            $this.method.log('month viewChange', evt.detail);
        },

        btnGetValue_click() {
            $this.method.show();
        },
        btnSetValue_click() {
            const api = syn.uicontrols.$barcalender;
            api.setValue('calDay', '2024-02-29');
            api.setValue('calMonth', '2024-02');
            $this.method.show();
        },

        btnClear_click() {
            syn.uicontrols.$barcalender.clear('calDay');
            syn.uicontrols.$barcalender.clear('calMonth');
            $this.method.show();
        },

        btnDisabled_click() {
            const api = syn.uicontrols.$barcalender;
            ['calDay', 'calMonth'].forEach(id => api.setDisabled(id, !api.getControl(id).disabled));
        },

        btnReadOnly_click() {
            const api = syn.uicontrols.$barcalender;
            ['calDay', 'calMonth'].forEach(id => api.setReadOnly(id, !api.getControl(id).readOnly));
        },

        btnReadBinding_click() {
            document.getElementById('result').textContent = JSON.stringify(syn.$w.getterValue('LD01'), null, 2);
        },

        btnWriteBinding_click() {
            syn.$w.setterValue('UD01', [{ SelectedDate: '2025-12-31', SelectedMonth: '2025-12' }]);
            $this.method.show();
        }
    },
    method: {
        show() {
            const api = syn.uicontrols.$barcalender;
            document.getElementById('result').textContent = JSON.stringify({ SelectedDate: api.getValue('calDay'), SelectedMonth: api.getValue('calMonth') }, null, 2);
        },

        log(name, detail) {
            const el = document.getElementById('events');
            el.textContent = (name + ': ' + JSON.stringify(detail) + '\n' + el.textContent).slice(0, 8000);
        }
    }
};
