'use strict';
let $basic = {
    event: {
        fdzBasic_change(evt) {
            // 업로드 성공 / 삭제 / undo 시 발생합니다. evt.detail.value 는 getValue() 와 같은 항목 배열입니다.
            $this.method.show(evt.detail.value);
        },

        btnGetValue_click() {
            // 업로드가 끝난 파일 항목({ItemID, FileName, Size, Extension, ...}) 배열, 없으면 []
            $this.method.show(syn.uicontrols.$filedropzone.getValue('fdzBasic'));
        },

        async btnClear_click() {
            var success = await syn.uicontrols.$filedropzone.removeAll('fdzBasic');
            syn.$l.eventLog('btnClear_click', 'removeAll 결과: ' + success);
        }
    },

    method: {
        show(items) {
            syn.$l.get('preResult').textContent = items.map(function (item) {
                return item.FileName + ' (' + syn.uicontrols.$filedropzone.toFileLengthString(item.Size) + ') ' + item.ItemID;
            }).join('\n') || '(파일 없음)';
        }
    }
}
