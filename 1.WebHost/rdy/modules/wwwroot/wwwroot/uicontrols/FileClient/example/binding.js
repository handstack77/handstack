'use strict';
var $binding = createControlBindingExample({
    adapterName: 'fileclient',
    initialValue: 'APV-20260723-01',
    get: function () {
        return syn.uicontrols.$fileclient.getValue('sfcBinding');
    },
    set: function (value) {
        syn.uicontrols.$fileclient.setValue('sfcBinding', value);
    },
    nextValue: function (current) {
        return current === 'APV-20260723-02' ? 'APV-20260723-01' : 'APV-20260723-02';
    },
    events: {
        btnMockFile_click: function () {
            syn.uicontrols.$fileclient.setValue('sfcBinding', 'APV-20260723-UPLOADED');
            return syn.uicontrols.$fileclient.getValue('sfcBinding');
        }
    },
    business: {
        title: '결재 첨부파일 연결',
        description: '업로드 컴포넌트의 ItemID를 결재 문서에 연결하는 거래 입력으로 사용합니다.',
        rules: ['파일 업로드 완료 콜백에서 받은 ItemID가 있어야 합니다.'],
        validate: function (value) {
            return /^APV-[A-Z0-9-]+$/.test(value) ? true : '업로드 완료 후 반환된 첨부 ItemID를 확인하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD_FILE', input: {DocumentID: 'APV-20260723-01', AttachmentItemID: value}};
        }
    }
});
