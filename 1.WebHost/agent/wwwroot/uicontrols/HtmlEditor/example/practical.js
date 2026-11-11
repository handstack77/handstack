'use strict';
let $practical = {
    prop: {
        isReady: false,
        templates: {
            greeting: '<p>안녕하세요, 고객님.</p><p>항상 저희 서비스를 이용해 주셔서 감사합니다.</p>',
            notice: '<p><strong>서비스 점검 안내</strong></p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><th>점검 일시</th><td>매월 첫째 주 일요일 02:00 ~ 04:00</td></tr><tr><th>영향 범위</th><td>주문 조회, 결제</td></tr></table><p><br></p>',
            signature: '<p>감사합니다.<br><strong>고객지원팀</strong> 드림</p>'
        }
    },

    event: {
        // getValue/setValue 를 안전하게 호출할 수 있는 시점(초기화 완료)을 알려준다.
        edtBody_documentReady(elID, editor) {
            $this.prop.isReady = true;
            syn.$l.eventLog('edtBody_documentReady', '본문 에디터가 준비되었습니다.');
        },

        btnGreeting_click() { $this.method.insert('greeting'); },
        btnNotice_click() { $this.method.insert('notice'); },
        btnSignature_click() { $this.method.insert('signature'); },
        btnPreview_click() { $this.method.togglePreview(); },
        btnNew_click() { $this.method.newMail(); },
        btnSave_click() { $this.method.save(); }
    },

    method: {
        // 에디터가 준비되기 전에는 insertContent 가 동작하지 않으므로 먼저 확인한다.
        insert(name) {
            if ($this.prop.isReady == false) {
                syn.$w.alert('에디터가 준비되는 중입니다. 잠시 후 다시 시도하세요.');
                return;
            }

            syn.uicontrols.$htmleditor.insertContent('edtBody', $this.prop.templates[name]);
        },

        // 태그를 제거한 순수 텍스트 길이로 본문이 비어 있는지 판단한다.
        textLength() {
            let editor = syn.uicontrols.$htmleditor.getHtmlEditor('edtBody');
            return editor == null ? 0 : editor.getContent({ format: 'text' }).trim().length;
        },

        togglePreview() {
            let card = syn.$l.get('cardPreview');
            if (card.classList.contains('hidden') == true) {
                syn.$l.get('divPreview').innerHTML = syn.uicontrols.$htmleditor.getValue('edtBody');
                card.classList.remove('hidden');
                syn.uicontrols.$htmleditor.setMode('edtBody', 'readonly');
                syn.$l.get('spnState').innerText = '미리보기 (본문 편집 잠금)';
            }
            else {
                card.classList.add('hidden');
                syn.uicontrols.$htmleditor.setMode('edtBody', 'design');
                syn.$l.get('spnState').innerText = '작성 중';
            }
        },

        validate() {
            if (syn.uicontrols.$textbox.getValue('txtTo') == '') {
                syn.$w.alert('받는 사람 항목은 반드시 입력 해야합니다.');
                return false;
            }

            if (syn.uicontrols.$textbox.getValue('txtSubject').trim() == '') {
                syn.$w.alert('제목 항목은 반드시 입력 해야합니다.');
                return false;
            }

            if ($this.method.textLength() == 0) {
                syn.$w.alert('본문 항목은 반드시 입력 해야합니다.');
                return false;
            }

            return true;
        },

        save() {
            if ($this.method.validate() == false) {
                return;
            }

            let body = syn.uicontrols.$htmleditor.getValue('edtBody');
            let result = {
                To: syn.uicontrols.$textbox.getValue('txtTo'),
                Subject: syn.uicontrols.$textbox.getValue('txtSubject').trim(),
                BodyTextLength: $this.method.textLength(),
                BodyHtmlLength: body.length,
                Body: body
            };

            syn.$l.get('preResult').innerText = JSON.stringify(result, null, 2);
            syn.$l.get('spnState').innerText = '발송 요청됨';
            syn.$l.eventLog('save', `${result.To} 에게 발송 요청 (본문 ${result.BodyTextLength}자)`);
        },

        // 내용을 수정한 적이 있으면 새 메일 작성 전에 확인을 받는다(isDirty).
        newMail() {
            let reset = () => {
                syn.uicontrols.$textbox.clear('txtTo');
                syn.uicontrols.$textbox.clear('txtSubject');
                syn.uicontrols.$htmleditor.clear('edtBody');
                syn.$l.get('cardPreview').classList.add('hidden');
                syn.uicontrols.$htmleditor.setMode('edtBody', 'design');
                syn.$l.get('spnState').innerText = '작성 중';
                syn.$l.get('preResult').innerText = '발송 요청 버튼을 누르면 메일 정보가 표시됩니다.';
            };

            if ($this.prop.isReady == true && syn.uicontrols.$htmleditor.isDirty('edtBody') == true) {
                let alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'question';
                alertOptions.buttonType = '3';
                syn.$w.alert('작성 중인 내용이 있습니다. 새 메일을 작성할까요?', '확인', alertOptions, (result) => {
                    if (result == 'Yes') {
                        reset();
                    }
                });
            }
            else {
                reset();
            }
        }
    }
}
