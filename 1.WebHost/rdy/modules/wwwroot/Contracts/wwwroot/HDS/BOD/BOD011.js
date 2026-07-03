'use strict';
let $BOD011 = {
    transaction: {
        ID01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '저장 되었습니다');

                    setTimeout(() => {
                        syn.$n.emit('response');
                    }, 200);
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + error);
                }
            }
        },
    },

    hook: {
        pageLoad() {
            var channelID = syn.$r.query('channelID');
            if (window != window.parent && channelID) {
                syn.$n.rooms.connect({ window: window.parent, origin: '*', scope: channelID });
            }
        }
    },

    event: {
        btnConfirm_click() {
            var title = syn.$l.get('txtTitle').value.trim();
            if (title == '') {
                syn.$w.alert('제목을 입력하세요');
                return false;
            }

            var createDate = syn.$l.get('dtpCreateDate').value.trim();
            if (createDate == '') {
                syn.$w.alert('작성일을 입력하세요');
                return false;
            }

            var author = syn.$l.get('txtAuthor').value.trim();
            if (author == '') {
                syn.$w.alert('작성자를 입력하세요');
                return false;
            }

            var content = syn.uicontrols.$htmleditor.getValue('htmContent').trim();
            if (content == '') {
                syn.$w.alert('게시글 내용을 입력하세요');
                return false;
            }

            syn.$w.transactionAction('ID01');
        }
    },
}
