'use strict';
let $features = {
    prop: {
        penColors: ['#000000', '#1d4ed8', '#b91c1c'],
        penColorIndex: 0,
        narrow: false
    },

    event: {
        sigBasic_beginStroke() { $this.method.log('beginStroke'); },
        sigBasic_endStroke() { $this.method.log('endStroke'); },
        // 사용자가 획을 그리거나 undo 했을 때 발생합니다. evt.detail.value 는 getValue() 와 같은 data URL 입니다.
        sigBasic_change(evt) { $this.method.log('change', evt.detail.value.length + ' chars'); },

        btnGetValue_click() { $this.method.logValue('getValue', syn.uicontrols.$signaturepad.getValue('sigBasic')); },
        btnGetJpeg_click() { $this.method.logValue('getValue(JPEG)', syn.uicontrols.$signaturepad.getValue('sigJpeg')); },
        btnGetBase64_click() { $this.method.logValue('getBase64', syn.uicontrols.$signaturepad.getBase64('sigBasic')); },
        btnIsEmpty_click() { $this.method.log('isEmpty', syn.uicontrols.$signaturepad.isEmpty('sigBasic')); },

        async btnCopyToReadOnly_click() {
            var success = await syn.uicontrols.$signaturepad.setValue('sigReadOnly', syn.uicontrols.$signaturepad.getValue('sigBasic'));
            $this.method.log('setValue(읽기 전용)', success);
        },

        btnUndo_click() { $this.method.log('undo', syn.uicontrols.$signaturepad.undo('sigBasic')); },
        btnClear_click() { syn.uicontrols.$signaturepad.clear('sigBasic'); $this.method.log('clear'); },

        btnPenColor_click() {
            $this.prop.penColorIndex = ($this.prop.penColorIndex + 1) % $this.prop.penColors.length;
            var color = $this.prop.penColors[$this.prop.penColorIndex];
            syn.uicontrols.$signaturepad.setPenColor('sigBasic', color);
            $this.method.log('setPenColor', color);
        },

        btnReadOnly_click() {
            var control = syn.uicontrols.$signaturepad.getControl('sigBasic');
            syn.uicontrols.$signaturepad.setReadOnly('sigBasic', control.readOnly == false);
            $this.method.log('setReadOnly', control.readOnly);
        },

        btnDisabled_click() {
            var control = syn.uicontrols.$signaturepad.getControl('sigBasic');
            syn.uicontrols.$signaturepad.setDisabled('sigBasic', control.disabled == false);
            $this.method.log('setDisabled', control.disabled);
        },

        btnNarrow_click() {
            // 크기는 ResizeObserver 로 자동 감지되어 그려 둔 내용이 유지됩니다. 즉시 맞춰야 하면 resize() 를 호출합니다.
            $this.prop.narrow = !$this.prop.narrow;
            syn.$l.get('sigBasic').style.width = $this.prop.narrow ? '220px' : '100%';
            syn.uicontrols.$signaturepad.resize('sigBasic');
            $this.method.log('resize', $this.prop.narrow ? '220px' : '100%');
        },

        btnDestroy_click() {
            syn.uicontrols.$signaturepad.destroy('sigJpeg');
            $this.method.log('destroy', syn.uicontrols.$signaturepad.getControl('sigJpeg') == null);
        }
    },

    method: {
        logValue(name, value) {
            $this.method.log(name, value ? value.substring(0, 50) + '... (' + value.length + ' chars)' : '(빈 값)');
        },

        log(name, value) {
            var log = syn.$l.get('preLog');
            log.textContent = (name + (value === undefined ? '' : ' ' + value) + '\n' + log.textContent).slice(0, 8000);
        }
    }
}
