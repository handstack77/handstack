'use strict';
let $practical = {
    prop: {
        discountLimit: 3000000,
        defaults: { txtQty1: 3, txtPrice1: 120000, txtQty2: 12, txtPrice2: 30000, txtQty3: 2, txtPrice3: 250000 }
    },

    hook: {
        pageComplete() {
            $this.method.calculate();
        }
    },

    method: {
        number(elID) {
            return Number(syn.uicontrols.$textbox.getValue(elID) || 0);
        },

        // 각 행 금액과 합계를 계산해 값 표시 요소(Element)에 채운다. number 타입 요소는 통화 서식으로 표시된다.
        calculate() {
            let supply = 0;
            for (let i = 1; i <= 3; i++) {
                let amount = $this.method.number(`txtQty${i}`) * $this.method.number(`txtPrice${i}`);
                syn.uicontrols.$element.setValue(`tdAmount${i}`, amount);
                supply += amount;
            }

            let vat = Math.floor(supply * 0.1);
            syn.uicontrols.$element.setValue('spnSupply', supply);
            syn.uicontrols.$element.setValue('spnVat', vat);
            syn.uicontrols.$element.setValue('spnTotal', supply + vat);

            let isDiscount = supply >= $this.prop.discountLimit;
            syn.uicontrols.$element.setValue('spnDiscount', isDiscount == true ? '대상' : '비대상');
            syn.uicontrols.$element.setValue('divMessage', isDiscount == true
                ? `<span class="text-success">공급가액이 <strong>${$this.prop.discountLimit.toLocaleString()}원</strong> 이상이라 할인 대상입니다.</span>`
                : `할인 대상까지 <strong>${Math.max(0, $this.prop.discountLimit - supply).toLocaleString()}원</strong> 남았습니다.`);
        }
    },

    event: {
        txtQty1_blur() { $this.method.calculate(); },
        txtQty2_blur() { $this.method.calculate(); },
        txtQty3_blur() { $this.method.calculate(); },
        txtPrice1_blur() { $this.method.calculate(); },
        txtPrice2_blur() { $this.method.calculate(); },
        txtPrice3_blur() { $this.method.calculate(); },

        // getValue 는 통화 서식을 제거한 숫자 문자열을 돌려준다.
        spnTotal_dblclick() {
            let total = syn.uicontrols.$element.getValue('spnTotal');
            syn.$w.copyToClipboard(total).then(() => {
                syn.$l.eventLog('spnTotal_dblclick', `합계 ${total} 을(를) 복사했습니다.`);
            });
        },

        btnReset_click() {
            Object.keys($this.prop.defaults).forEach((id) => {
                syn.uicontrols.$textbox.setValue(id, $this.prop.defaults[id]);
            });
            $this.method.calculate();
        }
    }
}
