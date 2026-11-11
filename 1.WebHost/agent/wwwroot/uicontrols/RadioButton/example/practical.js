'use strict';
let $practical = {
    prop: {
        unitPrice: 12000,
        deliveryFee: { PARCEL: 3000, QUICK: 12000, VISIT: 0 }
    },

    hook: {
        pageLoad() {
            $this.method.refresh();
        }
    },

    method: {
        selected(group) {
            return syn.uicontrols.$radio.getSelectedByValue(group);
        },

        toggle(rowID, isVisible) {
            syn.$l.get(rowID).classList.toggle('hidden', isVisible == false);
        },

        // 그룹에서 '지금 선택된 값'을 기준으로 화면 전체를 다시 계산한다(어느 라디오가 change 를 냈는지는 중요하지 않다).
        refresh() {
            $this.method.toggle('rowReserveDate', $this.method.selected('rdoOrderType') == 'R');
            $this.method.toggle('rowAddress', $this.method.selected('rdoDelivery') != 'VISIT');
            $this.method.toggle('rowCard', $this.method.selected('rdoPay') == 'CARD');
            $this.method.toggle('rowDeposit', $this.method.selected('rdoPay') == 'DEPOSIT');

            if ($this.method.selected('rdoPay') != 'CARD') {
                syn.uicontrols.$textbox.setValue('txtInstallment', 0);
            }

            $this.method.calculate();
        },

        getQuantity() {
            let quantity = Number(syn.uicontrols.$textbox.getValue('txtQuantity') || 0);
            return quantity < 1 ? 1 : quantity;
        },

        calculate() {
            let fee = $this.prop.deliveryFee[$this.method.selected('rdoDelivery')] || 0;
            let total = $this.prop.unitPrice * $this.method.getQuantity() + fee;
            syn.$l.get('spnTotalAmount').innerText = `결제 예정 금액 ${total.toLocaleString()}원 (배송비 ${fee.toLocaleString()}원 포함)`;
            return total;
        },

        validate() {
            if ($this.method.selected('rdoOrderType') == 'R' && syn.uicontrols.$textbox.getValue('txtReserveDate') == '') {
                syn.$w.alert('예약 일자 항목은 반드시 입력 해야합니다.');
                return false;
            }

            if ($this.method.selected('rdoDelivery') != 'VISIT' && syn.uicontrols.$textbox.getValue('txtAddress') == '') {
                syn.$w.alert('배송지 항목은 반드시 입력 해야합니다.');
                return false;
            }

            if ($this.method.selected('rdoPay') == 'DEPOSIT' && syn.uicontrols.$textbox.getValue('txtDepositor') == '') {
                syn.$w.alert('입금자명 항목은 반드시 입력 해야합니다.');
                return false;
            }

            return true;
        },

        save() {
            if ($this.method.validate() == false) {
                return;
            }

            let data = {
                OrderType: $this.method.selected('rdoOrderType'),
                ReserveDate: syn.uicontrols.$textbox.getValue('txtReserveDate'),
                Quantity: $this.method.getQuantity(),
                DeliveryType: $this.method.selected('rdoDelivery'),
                Address: $this.method.selected('rdoDelivery') == 'VISIT' ? '' : syn.uicontrols.$textbox.getValue('txtAddress'),
                PayType: $this.method.selected('rdoPay'),
                Installment: Number(syn.uicontrols.$textbox.getValue('txtInstallment') || 0),
                Depositor: $this.method.selected('rdoPay') == 'DEPOSIT' ? syn.uicontrols.$textbox.getValue('txtDepositor') : '',
                TotalAmount: $this.method.calculate()
            };

            syn.$l.get('preResult').innerText = JSON.stringify(data, null, 2);
            syn.$l.eventLog('save', `주문을 접수했습니다. 결제 금액 ${data.TotalAmount.toLocaleString()}원`);
        }
    },

    event: {
        btnSave_click() {
            $this.method.save();
        },

        rdoOrderType1_change() { $this.method.refresh(); },
        rdoOrderType2_change() { $this.method.refresh(); },
        rdoDelivery1_change() { $this.method.refresh(); },
        rdoDelivery2_change() { $this.method.refresh(); },
        rdoDelivery3_change() { $this.method.refresh(); },
        rdoPay1_change() { $this.method.refresh(); },
        rdoPay2_change() { $this.method.refresh(); },
        rdoPay3_change() { $this.method.refresh(); },

        txtQuantity_blur() {
            $this.method.calculate();
        }
    }
}
