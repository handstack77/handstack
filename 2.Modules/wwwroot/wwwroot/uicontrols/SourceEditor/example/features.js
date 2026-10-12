'use strict';
let $features = {
    prop: {
        isDark: true,
        isReadonly: false,
        isMinimap: true,
        isLineNumbers: true,
        isTall: true,
        isBound: false,
        samples: {
            javascript: "function calculateTotal(items) {\n    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);\n}\n\nconsole.log(calculateTotal([{ price: 1200, quantity: 3 }]));\n",
            sql: "SELECT o.OrderNo, c.CustomerName, SUM(d.Quantity * d.UnitPrice) AS Amount\nFROM Orders o\n    INNER JOIN Customers c ON c.CustomerID = o.CustomerID\n    INNER JOIN OrderDetails d ON d.OrderNo = o.OrderNo\nWHERE o.OrderDate >= '2026-01-01'\nGROUP BY o.OrderNo, c.CustomerName\nORDER BY Amount DESC;\n",
            json: '{\n    "service": "order-api",\n    "port": 8421,\n    "features": { "audit": true, "retryCount": 3 }\n}\n'
        }
    },

    method: {
        show(title, text) {
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text.length > 140 ? text.slice(0, 140) + '...' : text);
        },

        // 에디터는 Monaco 엔진을 불러온 뒤 비동기로 만들어지므로, 인스턴스를 쓰기 전에 준비 여부를 확인한다.
        editor() {
            let control = syn.uicontrols.$sourceeditor.getControl('txtCode');
            if (control == null || control.editor == null) {
                syn.$w.alert('에디터가 아직 초기화되지 않았습니다. 잠시 후 다시 시도하세요.');
                return null;
            }

            return control.editor;
        },

        setSample(language) {
            let editor = $this.method.editor();
            if (editor == null) {
                return;
            }

            monaco.editor.setModelLanguage(editor.getModel(), language);
            syn.uicontrols.$sourceeditor.setValue('txtCode', $this.prop.samples[language]);
        }
    },

    event: {
        btnGetValue_click() {
            $this.method.show('btnGetValue_click', syn.uicontrols.$sourceeditor.getValue('txtCode'));
        },

        btnSetJs_click() { $this.method.setSample('javascript'); },
        btnSetSql_click() { $this.method.setSample('sql'); },
        btnSetJson_click() { $this.method.setSample('json'); },

        btnClear_click() {
            syn.uicontrols.$sourceeditor.clear('txtCode');
        },

        btnTheme_click() {
            if ($this.method.editor() == null) {
                return;
            }

            $this.prop.isDark = !$this.prop.isDark;
            monaco.editor.setTheme($this.prop.isDark == true ? 'vs-dark' : 'vs');
        },

        btnReadonly_click() {
            let editor = $this.method.editor();
            if (editor != null) {
                $this.prop.isReadonly = !$this.prop.isReadonly;
                editor.updateOptions({ readOnly: $this.prop.isReadonly });
                syn.$l.eventLog('btnReadonly_click', `readOnly: ${$this.prop.isReadonly}`);
            }
        },

        btnMinimap_click() {
            let editor = $this.method.editor();
            if (editor != null) {
                $this.prop.isMinimap = !$this.prop.isMinimap;
                editor.updateOptions({ minimap: { enabled: $this.prop.isMinimap } });
            }
        },

        btnLineNumbers_click() {
            let editor = $this.method.editor();
            if (editor != null) {
                $this.prop.isLineNumbers = !$this.prop.isLineNumbers;
                editor.updateOptions({ lineNumbers: $this.prop.isLineNumbers == true ? 'on' : 'off' });
            }
        },

        // 컨테이너 크기를 코드로 바꾼 뒤에는 layoutResize 로 레이아웃을 다시 계산한다.
        btnHeight_click() {
            $this.prop.isTall = !$this.prop.isTall;
            syn.$l.get('txtCode').style.height = $this.prop.isTall == true ? '320px' : '180px';
            syn.uicontrols.$sourceeditor.layoutResize('txtCode');
        },

        btnRevealLine_click() {
            let editor = $this.method.editor();
            if (editor != null) {
                editor.revealLine(3);
                editor.setPosition({ lineNumber: 3, column: 1 });
                editor.focus();
            }
        },

        btnActions_click() {
            let actions = syn.uicontrols.$sourceeditor.getActions('txtCode');
            $this.method.show('btnActions_click', `등록된 액션 ${actions ? actions.length : 0}개`);
        },

        btnBind_click() {
            let editor = $this.method.editor();
            if (editor == null) {
                return;
            }

            if ($this.prop.isBound == true) {
                syn.$l.eventLog('btnBind_click', '이미 이벤트가 연결되어 있습니다.');
                return;
            }

            editor.onDidChangeModelContent(() => {
                syn.$l.eventLog('txtCode_change', `${editor.getModel().getLineCount()}줄`);
            });
            editor.onDidFocusEditorText(() => {
                syn.$l.eventLog('txtCode_focus', '포커스를 얻었습니다');
            });
            editor.onDidBlurEditorText(() => {
                syn.$l.eventLog('txtCode_blur', '포커스를 잃었습니다');
            });
            editor.onDidChangeCursorPosition((evt) => {
                syn.$l.get('preLog').textContent = `커서 위치: ${evt.position.lineNumber}행 ${evt.position.column}열`;
            });
            $this.prop.isBound = true;
            syn.$l.eventLog('btnBind_click', '이벤트가 연결되었습니다. 에디터에 입력해 보세요.');
        }
    }
}
