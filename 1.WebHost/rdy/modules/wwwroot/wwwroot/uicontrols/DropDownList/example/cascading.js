'use strict';
let $cascading = {
    prop: {
        // 실무 코드는 부서 값이 이미 정해진 수정 화면을 다시 열 때, 회사가 바뀌어도 이전 부서를
        // 그대로 재선택할 수 있도록 별도로 기억해 둔다.
        selectedDepartmentNo: null
    },

    event: {
        ddlCompanyNo_change() {
            var companyNo = syn.uicontrols.$select.getValue('ddlCompanyNo');

            // 부서 드롭다운을 서버에서 다시 조회한다. parameters 문자열에 방금 고른 회사 코드를 실어 보낸다.
            syn.uicontrols.$select.dataRefresh('ddlDepartmentNo', {
                dataSourceID: 'BDLCHP007',
                parameters: '@CompanyNo:{0};'.format(companyNo),
                local: false,
                toSynControl: false,
                required: true
            }, function () {
                // 목록이 다시 채워진 직후, 이전에 선택했던 부서가 새 목록에도 있으면 그대로 재선택한다.
                if ($this.prop.selectedDepartmentNo) {
                    syn.uicontrols.$select.setSelectedValue('ddlDepartmentNo', $this.prop.selectedDepartmentNo);
                }

                syn.$l.eventLog('ddlCompanyNo_change', '부서 목록을 회사(' + companyNo + ') 기준으로 다시 조회했습니다.');
            });
        },

        ddlDepartmentNo_change() {
            $this.prop.selectedDepartmentNo = syn.uicontrols.$select.getValue('ddlDepartmentNo');
        },

        btnSave_click() {
            // 실무 코드에서 흔한 저장 전 수동 검증(선언적 validators:['require']와 별개로 한 번 더 확인).
            if (syn.uicontrols.$select.getValue('ddlDepartmentNo') == '') {
                syn.$w.alert('부서를 선택하세요.');
                return;
            }

            syn.$l.eventLog('btnSave_click', 'DepartmentNo: ' + syn.uicontrols.$select.getValue('ddlDepartmentNo'));
        }
    }
}
