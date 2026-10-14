'use strict';
let $practical = {
    prop: {
        saved: null
    },

    event: {
        // 서명을 시작하면 이전 오류 문구를 지웁니다.
        sigReceiver_change() {
            $this.method.showError('');
        },

        btnUndo_click() {
            syn.uicontrols.$signaturepad.undo('sigReceiver');
        },

        btnClear_click() {
            syn.uicontrols.$signaturepad.clear('sigReceiver');
            $this.method.showError('');
        },

        btnSave_click() {
            var receiver = syn.$l.get('txtReceiver').value.trim();
            if (receiver === '') {
                $this.method.showError('수령인을 입력해 주세요.');
                return;
            }

            if (syn.uicontrols.$signaturepad.isEmpty('sigReceiver') == true) {
                $this.method.showError('서명을 입력해 주세요.');
                return;
            }

            // 서명은 data URL 문자열이므로 일반 문자열 필드처럼 JSON 에 담아 서버로 보낼 수 있습니다.
            $this.prop.saved = {
                receiver: receiver,
                signedAt: new Date().toISOString(),
                signature: syn.uicontrols.$signaturepad.getValue('sigReceiver')
            };

            var preview = Object.assign({}, $this.prop.saved, { signature: $this.prop.saved.signature.substring(0, 40) + '... (' + $this.prop.saved.signature.length + ' chars)' });
            syn.$l.get('preSaved').textContent = JSON.stringify(preview, null, 2);

            var img = syn.$l.get('imgSaved');
            img.src = $this.prop.saved.signature;
            img.hidden = false;
            $this.method.showError('');
        },

        async btnLoad_click() {
            if ($this.prop.saved == null) {
                $this.method.showError('저장된 내용이 없습니다. 먼저 저장해 주세요.');
                return;
            }

            // 저장된 값을 화면에 되돌립니다. 이미 그려진 서명은 교체됩니다.
            syn.$l.get('txtReceiver').value = $this.prop.saved.receiver;
            await syn.uicontrols.$signaturepad.setValue('sigReceiver', $this.prop.saved.signature);
            $this.method.showError('');
        }
    },

    method: {
        showError(message) {
            syn.$l.get('divError').textContent = message;
        }
    }
}
