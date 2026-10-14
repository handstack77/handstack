'use strict';
let $signaturepad = {
    prop: {
        saved: '',
        penColors: ['#1e3a8a', '#b91c1c', '#000000'],
        penColorIndex: 0
    },
    hook: {
        pageLoad() {
            $this.method.show();
        }
    },
    event: {
        sigMain_beginStroke() {
            $this.method.log('beginStroke');
        },

        sigMain_endStroke() {
            $this.method.log('endStroke');
        },

        sigMain_change(evt) {
            $this.method.log('change', evt.detail.value.length + ' chars');
            $this.method.show();
        },

        btnGetValue_click() {
            $this.method.show();
        },

        btnSave_click() {
            $this.prop.saved = syn.uicontrols.$signaturepad.getValue('sigMain');
            $this.method.log('saved', $this.prop.saved.length + ' chars');
        },

        async btnRestore_click() {
            await syn.uicontrols.$signaturepad.setValue('sigMain', $this.prop.saved);
            $this.method.show();
        },

        btnUndo_click() {
            syn.uicontrols.$signaturepad.undo('sigMain');
        },

        btnClear_click() {
            syn.uicontrols.$signaturepad.clear('sigMain');
            $this.method.show();
        },

        btnColor_click() {
            $this.prop.penColorIndex = ($this.prop.penColorIndex + 1) % $this.prop.penColors.length;
            syn.uicontrols.$signaturepad.setPenColor('sigMain', $this.prop.penColors[$this.prop.penColorIndex]);
        },

        btnReadOnly_click() {
            const control = syn.uicontrols.$signaturepad.getControl('sigMain');
            syn.uicontrols.$signaturepad.setReadOnly('sigMain', control.readOnly == false);
        },

        btnDisabled_click() {
            const control = syn.uicontrols.$signaturepad.getControl('sigMain');
            syn.uicontrols.$signaturepad.setDisabled('sigMain', control.disabled == false);
        }
    },
    method: {
        show() {
            const value = syn.uicontrols.$signaturepad.getValue('sigMain');
            document.getElementById('result').textContent = value ? value.substring(0, 80) + '... (' + value.length + ' chars)' : '(빈 값)';
            const preview = document.getElementById('preview');
            if (value) {
                preview.src = value;
            }
            else {
                preview.removeAttribute('src');
            }
        },

        log(name, value) {
            const log = document.getElementById('events');
            log.textContent = (name + ' ' + (value || '') + '\n' + log.textContent).slice(0, 10000);
        }
    }
};
