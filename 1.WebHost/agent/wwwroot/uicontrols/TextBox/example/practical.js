'use strict';
let $practical = {
    prop: {
        requiredFields: [
            { id: 'txtCustomerName', name: '고객명' },
            { id: 'txtMobilePhoneNo', name: '휴대전화' }
        ]
    },

    hook: {
        pageLoad() {
            $this.method.setCustomerType('P');
        }
    },

    method: {
        // 고객 구분에 따라 법인 전용 입력 행을 보이거나 숨긴다.
        setCustomerType(customerType) {
            let isCorporate = customerType == 'C';
            let row = syn.$l.get('rowCorporate');
            if (isCorporate == true) {
                syn.$m.removeClass(row, 'hidden');
            }
            else {
                syn.$m.addClass(row, 'hidden');
                syn.uicontrols.$textbox.clear('txtBusinessNo');
                syn.uicontrols.$textbox.clear('txtCeoName');
            }
        },

        getCustomerType() {
            return syn.uicontrols.$radio.getSelectedByValue('rdoCustomerType');
        },

        // 필수값 확인을 한 곳에 모으고, 비어 있는 항목마다 안내한 뒤 건수를 돌려준다.
        checkRequireVal() {
            let cntReturn = 0;
            let fields = $this.prop.requiredFields.slice();
            if ($this.method.getCustomerType() == 'C') {
                fields.push({ id: 'txtBusinessNo', name: '사업자번호' });
            }

            for (let i = 0; i < fields.length; i++) {
                if (syn.uicontrols.$textbox.getValue(fields[i].id) == '') {
                    syn.$w.alert(`${fields[i].name} 항목은 반드시 입력 해야합니다.`);
                    cntReturn++;
                    break;
                }
            }

            return cntReturn;
        },

        newCustomer() {
            let ids = ['txtCustomerNo', 'txtCustomerName', 'txtLoginID', 'txtMobilePhoneNo', 'txtHomePhoneNo', 'txtEmail', 'txtBirthDate',
                'txtBusinessNo', 'txtCeoName', 'txtPayHour', 'txtPayTime', 'txtRemark'];
            ids.forEach((id) => {
                syn.uicontrols.$textbox.clear(id);
            });

            syn.uicontrols.$textbox.setValue('txtCreditLimit', 0);
            syn.uicontrols.$textbox.setValue('txtDiscountRate', 0);
            syn.uicontrols.$radio.selectedValue('rdoCustomerType', 'P');
            $this.method.setCustomerType('P');
            syn.$l.get('preResult').innerText = '저장 버튼을 누르면 입력값이 JSON 으로 표시됩니다.';
        },

        save() {
            if ($this.method.checkRequireVal() > 0) {
                return;
            }

            let customerNo = 'C' + new Date().getTime().toString().slice(-8);
            let data = {
                CustomerNo: customerNo,
                CustomerType: $this.method.getCustomerType(),
                CustomerName: syn.uicontrols.$textbox.getValue('txtCustomerName'),
                LoginID: syn.uicontrols.$textbox.getValue('txtLoginID'),
                MobilePhoneNo: syn.uicontrols.$textbox.getValue('txtMobilePhoneNo'),
                HomePhoneNo: syn.uicontrols.$textbox.getValue('txtHomePhoneNo'),
                Email: syn.uicontrols.$textbox.getValue('txtEmail'),
                BirthDate: syn.uicontrols.$textbox.getValue('txtBirthDate'),
                BusinessNo: syn.uicontrols.$textbox.getValue('txtBusinessNo'),
                CeoName: syn.uicontrols.$textbox.getValue('txtCeoName'),
                CreditLimit: syn.$l.get('txtCreditLimit').value.replace(/,/g, '') == '' ? 0 : Number(syn.uicontrols.$textbox.getValue('txtCreditLimit')),
                DiscountRate: Number(syn.uicontrols.$textbox.getValue('txtDiscountRate') || 0),
                PayTime: syn.uicontrols.$textbox.getValue('txtPayTime'),
                Remark: syn.uicontrols.$textbox.getValue('txtRemark')
            };

            syn.uicontrols.$textbox.setValue('txtCustomerNo', customerNo);
            syn.$l.get('preResult').innerText = JSON.stringify(data, null, 2);
            syn.$l.eventLog('save', `${data.CustomerName} 고객 정보를 저장했습니다 (${customerNo})`);
        }
    },

    event: {
        btnNew_click() {
            $this.method.newCustomer();
        },

        btnSave_click() {
            $this.method.save();
        },

        rdoCustomerType1_change(evt) {
            $this.method.setCustomerType($this.method.getCustomerType());
        },

        rdoCustomerType2_change(evt) {
            $this.method.setCustomerType($this.method.getCustomerType());
        },

        txtLoginID_blur(evt) {
            let loginID = syn.uicontrols.$textbox.getValue('txtLoginID');
            if (loginID.length > 0 && loginID.length < 4) {
                syn.$w.alert('영문 ID 는 4자 이상 입력하세요.');
            }
        }
    }
}
