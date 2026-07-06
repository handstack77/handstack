'use strict';
let $languagemode = {
    prop: {
        jsonSample: '{\n\t"name": "handstack",\n\t"active": true,\n\t"count": 3\n}',
        htmlSample: '<div class="card">\n\t<h1>제목</h1>\n\t<p>본문 내용</p>\n</div>',
        sqlSample: 'SELECT UserID, UserName\nFROM Users\nWHERE UseYN = \'1\'\nORDER BY UserName;'
    },

    event: {
        // language 옵션은 각 <syn_sourceeditor>의 syn-options로 지정되며,
        // 같은 SourceEditor 컨트롤이 언어에 따라 문법 강조를 다르게 보여주는 것을 확인할 수 있습니다.
        btnFillSamples_click() {
            syn.uicontrols.$sourceeditor.setValue('txtJson', $languagemode.prop.jsonSample);
            syn.uicontrols.$sourceeditor.setValue('txtHtml', $languagemode.prop.htmlSample);
            syn.uicontrols.$sourceeditor.setValue('txtSql', $languagemode.prop.sqlSample);
        },

        btnGetAll_click() {
            var json = syn.uicontrols.$sourceeditor.getValue('txtJson');
            var html = syn.uicontrols.$sourceeditor.getValue('txtHtml');
            var sql = syn.uicontrols.$sourceeditor.getValue('txtSql');

            syn.$l.eventLog('btnGetAll_click', JSON.stringify({ json: json, html: html, sql: sql }));
        }
    }
}
