'use strict';
let $methods = {
    event: {
        btnMethodsGetValue_click() {
            // 컨트롤의 현재 값(ItemID)을 그대로 읽는다. 아직 업로드한 파일이 없으면 빈 문자열이다.
            syn.$l.eventLog('btnMethodsGetValue_click', JSON.stringify(syn.uicontrols.$fileclient.getValue('sfcMethodsFile')));
        },

        btnMethodsSetValue_click() {
            // 서버에서 내려받은 기존 ItemID로 컨트롤 값을 미리 채워둘 때 사용(예: 수정 화면 초기화)
            var itemID = syn.$l.get('txtMethodsItemID').value;
            if (itemID == '') {
                syn.$l.eventLog('btnMethodsSetValue_click', '조회할 ItemID를 입력하세요');
                return;
            }

            syn.uicontrols.$fileclient.setValue('sfcMethodsFile', itemID);
            syn.$l.eventLog('btnMethodsSetValue_click', syn.uicontrols.$fileclient.getValue('sfcMethodsFile'));
        },

        btnMethodsClear_click() {
            syn.uicontrols.$fileclient.clear('sfcMethodsFile');
            syn.$l.eventLog('btnMethodsClear_click', '컨트롤 값이 초기화되었습니다');
        },

        btnMethodsGetItem_click() {
            var itemID = syn.$l.get('txtMethodsItemID').value != '' ? syn.$l.get('txtMethodsItemID').value : syn.uicontrols.$fileclient.getValue('sfcMethodsFile');
            if (itemID == '') {
                syn.$l.eventLog('btnMethodsGetItem_click', '조회할 ItemID를 입력하거나 먼저 파일을 업로드하세요');
                return;
            }

            syn.uicontrols.$fileclient.getItem('sfcMethodsFile', itemID, function (result) {
                syn.$l.eventLog('btnMethodsGetItem_click', JSON.stringify(result));
            });
        },

        btnMethodsDeleteItem_click() {
            var itemID = syn.$l.get('txtMethodsItemID').value != '' ? syn.$l.get('txtMethodsItemID').value : syn.uicontrols.$fileclient.getValue('sfcMethodsFile');
            if (itemID == '') {
                syn.$l.eventLog('btnMethodsDeleteItem_click', '삭제할 ItemID를 입력하거나 먼저 파일을 업로드하세요');
                return;
            }

            // 삭제에 성공하면 컨트롤 값(ItemID)도 자동으로 비워진다.
            syn.uicontrols.$fileclient.deleteItem('sfcMethodsFile', itemID, function (result) {
                syn.$l.eventLog('btnMethodsDeleteItem_click', JSON.stringify(result));
            });
        }
    }
}
