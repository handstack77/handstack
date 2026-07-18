'use strict';
let $events = {
    event: {
        // 담당자 팝업을 열기 직전: 업체 코드를 조회 조건(parameters)에 실어 보낸다.
        // 실무 코드는 항상 $string.toParameterObject/$object.toParameterString로 파싱-조립한다.
        chpPartnerID_buttonClick(elID, synOptions) {
            var parameters = $string.toParameterObject(synOptions.parameters);
            parameters.CompanyID = syn.$l.get('chpCompanyID_Code').value;
            synOptions.parameters = $object.toParameterString(parameters);

            syn.$l.eventLog('chpPartnerID_buttonClick', '조회 조건: ' + synOptions.parameters);
        },

        chpPartnerID_change(elID, inputValue, inputText, result) {
            syn.$l.eventLog('chpPartnerID_change', JSON.stringify({ value: inputValue, text: inputText }));
        },

        // 업체를 다시 선택하면(=바뀌면) 이미 선택된 담당자는 더 이상 유효하지 않으므로 비워준다.
        // 실무에서 이 초기화를 빠뜨리면 "업체는 바뀌었는데 담당자는 이전 업체 소속 그대로 남는" 버그가 된다.
        chpCompanyID_change(elID, inputValue, inputText, result) {
            syn.uicontrols.$codepicker.clear('chpPartnerID');
            syn.$l.eventLog('chpCompanyID_change', '업체 변경 -> 담당자 초기화');
        },

        btnSave_click() {
            // 실무 코드의 필수값 검증은 대부분 $codepicker API 대신 코드/텍스트 input을 직접 읽어서 확인한다.
            var companyID = syn.$l.get('chpCompanyID_Code').value.trim();
            if (companyID == '') {
                syn.$w.alert('업체 명을 선택 하세요');
                return;
            }

            var partnerID = syn.$l.get('chpPartnerID_Code').value.trim();
            if (partnerID == '') {
                syn.$w.alert('업체 담당자 명을 선택 하세요');
                return;
            }

            syn.$l.eventLog('btnSave_click', 'CompanyID: ' + companyID + ', PartnerID: ' + partnerID);
        }
    }
}
