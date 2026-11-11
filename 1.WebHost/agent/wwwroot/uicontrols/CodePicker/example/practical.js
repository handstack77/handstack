'use strict';
let $practical = {
    method: {
        pick(elID, code, text) {
            syn.uicontrols.$codepicker.setValue(elID, code);
            syn.uicontrols.$codepicker.setText(elID, text);
        },

        // 실무 코드의 필수값 검증은 대부분 코드 입력창(_Code)을 직접 읽어서 비어 있는지 확인한다.
        validate() {
            let fields = [
                { id: 'chpCustomer', name: '고객' },
                { id: 'chpManager', name: '담당 직원' },
                { id: 'chpProduct', name: '주문 상품' }
            ];

            for (let i = 0; i < fields.length; i++) {
                if (syn.$l.get(`${fields[i].id}_Code`).value.trim() == '') {
                    syn.$w.alert(`${fields[i].name}을(를) 선택 하세요`);
                    return false;
                }
            }

            return true;
        },

        save() {
            if ($this.method.validate() == false) {
                return;
            }

            let data = {
                CustomerID: syn.uicontrols.$codepicker.getValue('chpCustomer'),
                CustomerName: syn.$l.get('chpCustomer_Text').value,
                ManagerID: syn.uicontrols.$codepicker.getValue('chpManager'),
                ManagerName: syn.$l.get('chpManager_Text').value,
                ProductIDs: syn.uicontrols.$codepicker.getValue('chpProduct').split(','),
                ProductNames: syn.$l.get('chpProduct_Text').value.split(','),
                Memo: syn.uicontrols.$textbox.getValue('txtMemo')
            };

            syn.$l.get('preResult').innerText = JSON.stringify(data, null, 2);
            syn.$l.eventLog('save', `${data.CustomerName} 고객의 주문(${data.ProductIDs.length}개 상품)을 저장했습니다.`);
        },

        newOrder() {
            ['chpCustomer', 'chpManager', 'chpProduct'].forEach((id) => {
                syn.uicontrols.$codepicker.clear(id);
            });
            syn.uicontrols.$textbox.clear('txtMemo');
            syn.$l.get('preResult').innerText = '저장 버튼을 누르면 선택한 값이 JSON 으로 표시됩니다.';
        }
    },

    event: {
        // 담당 직원 팝업을 열기 직전: 선택한 고객 코드를 조회 조건에 실어 담당 직원 목록을 그 고객 소속으로 좁힌다.
        chpManager_buttonClick(elID, synOptions) {
            let parameters = $string.toParameterObject(synOptions.parameters);
            parameters.CustomerID = syn.uicontrols.$codepicker.getValue('chpCustomer');
            synOptions.parameters = $object.toParameterString(parameters);
        },

        // 고객이 바뀌면 이전 고객 소속이던 담당 직원은 더 이상 유효하지 않으므로 비운다.
        chpCustomer_change(elID, inputValue, inputText, result) {
            syn.uicontrols.$codepicker.clear('chpManager');
            syn.$l.eventLog('chpCustomer_change', `${inputText} 선택 -> 담당 직원 초기화`);
        },

        chpProduct_change(elID, inputValue, inputText, result) {
            let count = inputValue == '' ? 0 : inputValue.split(',').length;
            syn.$l.eventLog('chpProduct_change', `${count}개 상품 선택`);
        },

        btnSample_click() {
            $this.method.pick('chpCustomer', 'C-2001', '김민준');
            $this.method.pick('chpManager', 'E-3001', '박지후');
            $this.method.pick('chpProduct', 'P-1001,P-1002', '무선 이어폰,보조 배터리');
        },

        btnNew_click() {
            $this.method.newOrder();
        },

        btnSave_click() {
            $this.method.save();
        }
    }
}
