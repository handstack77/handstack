'use strict';
let $features = {
    method: {
        show(title, data) {
            let text = typeof data == 'string' ? data : JSON.stringify(data, null, 2);
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text);
        },

        readAll() {
            let element = syn.uicontrols.$element;
            return {
                Text: element.getValue('spnText'),
                Html: element.getValue('divHtml'),
                Content: element.getValue('pContent'),
                Amount: element.getValue('spnAmount'),
                Flag: element.getValue('spnFlag'),
                Out: element.getValue('outValue')
            };
        }
    },

    event: {
        spnText_click(evt) {
            syn.$l.eventLog('spnText_click', '클릭');
        },

        spnText_dblclick(evt) {
            syn.$l.eventLog('spnText_dblclick', '더블클릭');
        },

        btnGetValue_click() {
            $this.method.show('btnGetValue_click', $this.method.readAll());
        },

        btnSetText_click() {
            syn.uicontrols.$element.setValue('spnText', '새 텍스트 ' + new Date().toLocaleTimeString());
            syn.uicontrols.$element.setValue('pContent', '<b>태그</b>가 문자 그대로 표시됩니다');
            syn.uicontrols.$element.setValue('outValue', '출력값 변경');
        },

        btnSetHtml_click() {
            syn.uicontrols.$element.setValue('divHtml', '<span style="color: #d63939;">빨간 글씨</span> HTML 로 교체');
        },

        btnSetAmount_click() {
            syn.uicontrols.$element.setValue('spnAmount', 1234567);
            syn.$l.eventLog('btnSetAmount_click', `표시값: ${syn.$l.get('spnAmount').innerText}, getValue: ${syn.uicontrols.$element.getValue('spnAmount')}`);
        },

        btnSetFlag_click() {
            syn.uicontrols.$element.setValue('spnFlag', false);
            syn.$l.eventLog('btnSetFlag_click', `표시값: ${syn.$l.get('spnFlag').innerText}, getValue: ${syn.uicontrols.$element.getValue('spnFlag')}`);
        },

        btnClear_click() {
            ['spnText', 'divHtml', 'pContent', 'spnAmount', 'spnFlag', 'outValue'].forEach((id) => {
                syn.uicontrols.$element.clear(id);
            });
        }
    }
}
