'use strict';
let $getset = {
    event: {
        async btnCopy_click() {
            var items = syn.uicontrols.$filedropzone.getValue('fdzSource');

            // setValue 는 서버에 업로드/삭제하지 않고 목록만 바꿉니다(서버 파일은 그대로). 항목 정보가 충분하면 서버 조회 없이 표시합니다.
            var success = await syn.uicontrols.$filedropzone.setValue('fdzTarget', items);
            $this.method.log('setValue(항목 배열)', success + ', ' + items.length + '개');
        },

        async btnSetIds_click() {
            // ItemID 만 있어도 됩니다. 항목 정보는 서버(GetItem)에서 조회합니다. 쉼표 문자열이나 JSON 문자열도 받습니다.
            var ids = syn.uicontrols.$filedropzone.getValue('fdzSource').map(function (item) { return item.ItemID; });
            var success = await syn.uicontrols.$filedropzone.setValue('fdzTarget', ids);
            $this.method.log('setValue(ItemID 배열)', success + ', ' + ids.length + '개');
        },

        btnClearTarget_click() {
            // 화면 목록만 비웁니다. 서버 파일을 지우려면 removeItem / removeAll 을 사용합니다.
            syn.uicontrols.$filedropzone.clear('fdzTarget');
            $this.method.log('clear', '복사본 비움');
        },

        async btnLoad_click() {
            // 현재 dependencyID 의 파일을 서버에서 다시 조회해 목록을 교체합니다.
            var items = await syn.uicontrols.$filedropzone.load('fdzSource');
            $this.method.log('load', items.length + '개');
        },

        async btnBad_click() {
            // 해석할 수 없는 항목은 건너뛰고 false 를 반환합니다(나머지 항목은 표시).
            var success = await syn.uicontrols.$filedropzone.setValue('fdzTarget', [{ foo: 1 }, 'no-such-item']);
            $this.method.log('setValue(잘못된 값)', success);
        }
    },

    method: {
        log(name, value) {
            var log = syn.$l.get('preLog');
            log.textContent = name + ' ' + value + '\n' + log.textContent;
        }
    }
}
