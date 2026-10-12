'use strict';
let $features = {
    event: {
        // 직접 입력하거나 팝업에서 선택을 마치면 호출된다(직접 입력으로 바뀐 경우 result 는 null).
        chpBasic_change(elID, inputValue, inputText, result) {
            syn.$l.eventLog('chpBasic_change', JSON.stringify({ value: inputValue, text: inputText, fromPopup: result != null }));
        },

        chpTextOnly_change(elID, inputValue, inputText, result) {
            syn.$l.eventLog('chpTextOnly_change', JSON.stringify({ value: inputValue, text: inputText }));
        },

        chpMulti_change(elID, inputValue, inputText, result) {
            syn.$l.eventLog('chpMulti_change', JSON.stringify({ value: inputValue, text: inputText }));
        },

        // 팝업이 열리기 직전에 호출된다. synOptions.parameters 를 바꾸면 팝업 조회 조건이 바뀐다.
        chpBasic_buttonClick(elID, synOptions) {
            let parameters = $string.toParameterObject(synOptions.parameters);
            parameters.UseYN = 'Y';
            synOptions.parameters = $object.toParameterString(parameters);
            syn.$l.eventLog('chpBasic_buttonClick', '조회 조건: ' + synOptions.parameters);
        },

        // 팝업 선택 결과를 흉내 낸다: 코드값은 setValue, 표시 이름은 setText 로 각각 설정한다.
        btnPick_click() {
            syn.uicontrols.$codepicker.setValue('chpBasic', 'P-1001');
            syn.uicontrols.$codepicker.setText('chpBasic', '무선 이어폰');
            syn.uicontrols.$codepicker.setValue('chpTextOnly', 'C-2001');
            syn.uicontrols.$codepicker.setText('chpTextOnly', '김민준');
            syn.uicontrols.$codepicker.setValue('chpMulti', 'P-1001,P-1002,P-1003');
            syn.uicontrols.$codepicker.setText('chpMulti', '무선 이어폰,보조 배터리,요가 매트');
            syn.$l.eventLog('btnPick_click', '예제용 선택 값을 설정했습니다.');
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify({
                Basic: syn.uicontrols.$codepicker.getValue('chpBasic'),
                BasicText: syn.$l.get('chpBasic_Text').value,
                TextOnly: syn.uicontrols.$codepicker.getValue('chpTextOnly'),
                Multi: syn.uicontrols.$codepicker.getValue('chpMulti')
            }));
        },

        btnSetValue_click() {
            syn.uicontrols.$codepicker.setValue('chpBasic', 'P-9999');
            syn.uicontrols.$codepicker.setText('chpBasic', '직접 설정한 상품');
        },

        btnClear_click() {
            ['chpBasic', 'chpTextOnly', 'chpWidth', 'chpRequired', 'chpMulti'].forEach((id) => {
                syn.uicontrols.$codepicker.clear(id);
            });
        },

        btnOpen_click() {
            syn.uicontrols.$codepicker.open('chpBasic');
            syn.$l.eventLog('btnOpen_click', '돋보기 버튼 클릭을 코드로 실행했습니다(서버 데이터소스가 필요).');
        },

        btnFind_click() {
            syn.uicontrols.$codepicker.find({ elID: 'chpBasic', dataSourceID: 'CHP_PRODUCT', local: false, viewType: 'form' }).then((result) => {
                syn.$l.eventLog('btnFind_click', '선택 결과: ' + JSON.stringify(result));
            });
        },

        btnParameters_click() {
            let text = syn.uicontrols.$codepicker.toParameterString({ CategoryID: 'ELE', UseYN: 'Y' });
            let object = syn.uicontrols.$codepicker.toParameterObject(text);
            syn.$l.eventLog('btnParameters_click', `${text} => ${JSON.stringify(object)}`);
        }
    }
}
