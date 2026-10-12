'use strict';
let $practical = {
    prop: {
        maxLength: 500,
        minLength: 10,
        templates: {
            delay: '주문한 상품이 아직 도착하지 않았습니다.\n주문 번호:\n주문 일자:\n현재 배송 상태와 도착 예정일을 알려주세요.',
            refund: '수령한 상품의 교환(환불)을 요청합니다.\n주문 번호:\n사유:\n교환(환불) 절차를 안내해 주세요.'
        }
    },

    hook: {
        pageLoad() {
            // 순수 textarea(toSynControl: false) 는 syn-events 가 연결되지 않으므로 표준 이벤트를 직접 등록한다.
            syn.$l.addEvent('txtContent', 'input', () => {
                $this.method.updateCounter();
            });
            $this.method.updateCounter();
        }
    },

    method: {
        byteLength(text) {
            return new TextEncoder().encode(text).length;
        },

        updateCounter() {
            let text = syn.uicontrols.$textarea.getValue('txtContent');
            let counter = syn.$l.get('spnCounter');
            counter.innerText = `${text.length} / ${$this.prop.maxLength}자 (${$this.method.byteLength(text)} byte)`;
            counter.classList.toggle('text-danger', text.length > 0 && text.length < $this.prop.minLength);
        },

        selectedType() {
            return document.querySelector('input[name="rdoInquiryType"]:checked').value;
        },

        applyTemplate(text) {
            let current = syn.uicontrols.$textarea.getValue('txtContent');
            syn.uicontrols.$textarea.setValue('txtContent', current == '' ? text : current + '\n\n' + text);
            $this.method.updateCounter();
        },

        validate() {
            if (syn.uicontrols.$textbox.getValue('txtTitle') == '') {
                syn.$w.alert('제목 항목은 반드시 입력 해야합니다.');
                return false;
            }

            let content = syn.uicontrols.$textarea.getValue('txtContent').trim();
            if (content.length < $this.prop.minLength) {
                syn.$w.alert(`문의 내용은 ${$this.prop.minLength}자 이상 입력 해야합니다.`);
                return false;
            }

            return true;
        },

        save() {
            if ($this.method.validate() == false) {
                return;
            }

            let data = {
                InquiryNo: 'Q' + new Date().getTime().toString().slice(-8),
                InquiryType: $this.method.selectedType(),
                Title: syn.uicontrols.$textbox.getValue('txtTitle'),
                Content: syn.uicontrols.$textarea.getValue('txtContent').trim(),
                Lines: syn.uicontrols.$textarea.getValue('txtContent').trim().split('\n').length,
                Memo: syn.uicontrols.$textarea.getValue('txtMemo')
            };

            syn.$l.get('preResult').innerText = JSON.stringify(data, null, 2);
            syn.$l.eventLog('save', `문의를 접수했습니다 (${data.InquiryNo})`);
        },

        newInquiry() {
            syn.$l.get('rdoInquiryType1').checked = true;
            syn.uicontrols.$textbox.clear('txtTitle');
            syn.uicontrols.$textarea.clear('txtContent');
            syn.uicontrols.$textarea.clear('txtMemo');
            $this.method.updateCounter();
            syn.$l.get('preResult').innerText = '접수 버튼을 누르면 입력 내용이 JSON 으로 표시됩니다.';
        }
    },

    event: {
        btnNew_click() {
            $this.method.newInquiry();
        },

        btnSave_click() {
            $this.method.save();
        },

        btnTemplate1_click() {
            $this.method.applyTemplate($this.prop.templates.delay);
        },

        btnTemplate2_click() {
            $this.method.applyTemplate($this.prop.templates.refund);
        }
    }
}
