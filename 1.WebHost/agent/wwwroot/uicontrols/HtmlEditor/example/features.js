'use strict';
let $features = {
    method: {
        show(title, text) {
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text.length > 120 ? text.slice(0, 120) + '...' : text);
        }
    },

    event: {
        // 에디터 초기화가 끝나고 초기 값 반영까지 마친 직후 1회 호출된다.
        edtFull_documentReady(elID, editor) {
            syn.$l.eventLog('edtFull_documentReady', `${elID} 준비 완료`);
        },

        edtSimple_documentReady(elID, editor) {
            syn.$l.eventLog('edtSimple_documentReady', `${elID} 준비 완료`);
        },

        btnGetValue_click() {
            $this.method.show('btnGetValue_click', syn.uicontrols.$htmleditor.getValue('edtFull'));
        },

        btnSetValue_click() {
            syn.uicontrols.$htmleditor.setValue('edtFull', '<h3>setValue 로 교체한 본문</h3><p>표와 목록도 넣을 수 있습니다.</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><th>항목</th><th>값</th></tr><tr><td>주문 수</td><td>12</td></tr></table>');
        },

        btnClear_click() {
            syn.uicontrols.$htmleditor.clear('edtFull');
        },

        btnIsDirty_click() {
            $this.method.show('btnIsDirty_click', 'isDirty: ' + syn.uicontrols.$htmleditor.isDirty('edtFull'));
        },

        btnInsert_click() {
            syn.uicontrols.$htmleditor.insertContent('edtFull', '<p><em>[삽입된 문장] ' + new Date().toLocaleString() + '</em></p>');
        },

        btnBold_click() {
            syn.uicontrols.$htmleditor.execCommand('edtFull', 'bold');
        },

        btnReadonly_click() {
            syn.uicontrols.$htmleditor.setMode('edtFull', 'readonly');
        },

        btnDesign_click() {
            syn.uicontrols.$htmleditor.setMode('edtFull', 'design');
        },

        btnSimpleValue_click() {
            $this.method.show('btnSimpleValue_click', syn.uicontrols.$htmleditor.getValue('edtSimple'));
        },

        btnSetting_click() {
            let setting = syn.uicontrols.$htmleditor.getHtmlSetting('edtFull');
            $this.method.show('btnSetting_click', JSON.stringify({
                repositoryID: setting.repositoryID,
                menubar: setting.menubar,
                toolbar: setting.toolbar,
                language: setting.language,
                imageFileSizeLimit: setting.imageFileSizeLimit
            }, null, 2));
        },

        btnEditor_click() {
            let editor = syn.uicontrols.$htmleditor.getHtmlEditor('edtFull');
            $this.method.show('btnEditor_click', editor == null ? '(없음)' : `TinyMCE ${editor.editorManager.majorVersion}.${editor.editorManager.minorVersion}, 글자 수: ${editor.getContent({ format: 'text' }).length}`);
        },

        btnDependency_click() {
            $this.method.show('btnDependency_click', String(syn.uicontrols.$htmleditor.getDependencyID('edtFull')));
        }
    }
}
