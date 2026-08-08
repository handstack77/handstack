'use strict';
let $requiredform = {
    method: {
        // 실무 코드의 흔한 관행: 필드별 필수값 확인을 한 곳에 모아두고, 비어 있을 때마다
        // alert를 띄우면서 cntReturn을 하나씩 증가시킨다. 호출부는 cntReturn == 0일 때만 저장을 진행한다.
        checkRequireVal() {
            var cntReturn = 0;

            if (syn.uicontrols.$textbox.getValue('txtCompanyName') == '') {
                syn.$w.alert('거래처명 항목은 반드시 입력 해야합니다.');
                cntReturn++;
            }

            if (syn.uicontrols.$textbox.getValue('txtBusinessNo') == '') {
                syn.$w.alert('사업자등록번호 항목은 반드시 입력 해야합니다.');
                cntReturn++;
            }

            return cntReturn;
        }
    },

    event: {
        btnSave_click() {
            if ($this.method.checkRequireVal() > 0) {
                return;
            }

            syn.$l.eventLog('btnSave_click', JSON.stringify({
                CompanyName: syn.uicontrols.$textbox.getValue('txtCompanyName'),
                BusinessNo: syn.uicontrols.$textbox.getValue('txtBusinessNo'),
                ManagerEmail: syn.uicontrols.$textbox.getValue('txtManagerEmail'),
                TotalAmount: syn.uicontrols.$textbox.getValue('txtTotalAmount')
            }));
        }
    }
}
