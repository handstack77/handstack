'use strict';
let $practical = {
    prop: {
        saved: '{\n    "service": "order-api",\n    "port": 8421,\n    "logLevel": "Information",\n    "features": {\n        "audit": true,\n        "retryCount": 3\n    }\n}\n',
        timer: null,
        isBound: false
    },

    hook: {
        pageLoad() {
            // Monaco 는 엔진을 불러온 뒤 비동기로 에디터를 만들므로, 준비될 때까지 기다렸다가 초기 값과 이벤트를 연결한다.
            $this.prop.timer = setInterval(() => {
                let control = syn.uicontrols.$sourceeditor.getControl('txtConfig');
                if (control && control.editor) {
                    clearInterval($this.prop.timer);
                    $this.method.ready(control.editor);
                }
            }, 200);
        }
    },

    method: {
        editor() {
            let control = syn.uicontrols.$sourceeditor.getControl('txtConfig');
            return control ? control.editor : null;
        },

        ready(editor) {
            syn.uicontrols.$sourceeditor.setValue('txtConfig', $this.prop.saved);
            editor.onDidChangeModelContent(() => {
                $this.method.refreshState();
            });
            $this.prop.isBound = true;
            $this.method.refreshState();
        },

        refreshState() {
            let changed = syn.uicontrols.$sourceeditor.getValue('txtConfig') != $this.prop.saved;
            syn.$l.get('spnState').innerText = changed == true ? '저장하지 않은 변경 있음' : '변경 없음';
            syn.$l.get('spnState').classList.toggle('text-danger', changed);
        },

        // JSON 문법 오류의 위치를 에디터 표시(마커)로 보여 준다.
        validate() {
            let editor = $this.method.editor();
            let text = syn.uicontrols.$sourceeditor.getValue('txtConfig');
            let model = editor.getModel();
            monaco.editor.setModelMarkers(model, 'validate', []);

            try {
                let config = JSON.parse(text);
                if (config.port == null || Number(config.port) < 1 || Number(config.port) > 65535) {
                    throw new Error('port 는 1~65535 사이의 숫자여야 합니다.');
                }

                syn.$l.get('preResult').textContent = `검증 통과: service=${config.service}, port=${config.port}`;
                return true;
            }
            catch (error) {
                let match = /position (\d+)/.exec(error.message);
                let position = match ? model.getPositionAt(Number(match[1])) : { lineNumber: 1, column: 1 };
                monaco.editor.setModelMarkers(model, 'validate', [{
                    severity: monaco.MarkerSeverity.Error,
                    message: error.message,
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column + 1
                }]);
                syn.$l.get('preResult').textContent = `검증 실패 (${position.lineNumber}행 ${position.column}열): ${error.message}`;
                return false;
            }
        },

        format() {
            let text = syn.uicontrols.$sourceeditor.getValue('txtConfig');
            try {
                syn.uicontrols.$sourceeditor.setValue('txtConfig', JSON.stringify(JSON.parse(text), null, 4) + '\n');
                syn.$l.get('preResult').textContent = '들여쓰기 4칸으로 서식을 정리했습니다.';
            }
            catch (error) {
                $this.method.validate();
            }
        },

        save() {
            if ($this.method.validate() == false) {
                syn.$w.alert('JSON 문법 오류가 있어 저장할 수 없습니다.');
                return;
            }

            $this.prop.saved = syn.uicontrols.$sourceeditor.getValue('txtConfig');
            $this.method.refreshState();
            syn.$l.get('preResult').textContent += '\n설정을 저장했습니다(예제에서는 서버 전송 대신 메모리에 보관).';
            syn.$l.eventLog('save', '서비스 설정을 저장했습니다.');
        }
    },

    event: {
        btnFormat_click() { $this.method.format(); },

        btnValidate_click() { $this.method.validate(); },

        btnSave_click() { $this.method.save(); },

        btnRevert_click() {
            syn.uicontrols.$sourceeditor.setValue('txtConfig', $this.prop.saved);
            monaco.editor.setModelMarkers($this.method.editor().getModel(), 'validate', []);
            syn.$l.get('preResult').textContent = '마지막으로 저장한 내용으로 되돌렸습니다.';
        }
    }
}
