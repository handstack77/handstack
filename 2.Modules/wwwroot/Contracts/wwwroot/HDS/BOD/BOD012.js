'use strict';
let $BOD012 = {
    prop: {
        channel: null
    },

    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }]
        },

        UD01: {
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

        DD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '삭제 되었습니다');

                    setTimeout(() => {
                        syn.$n.emit('response');
                    }, 200);
                }
                else {
                    syn.$w.notify('warning', '삭제에 실패했습니다. 오류: ' + error);
                }
            }
        },
    },

    hook: {
        pageLoad() {
            var channelID = syn.$r.query('channelID');
            if (window != window.parent && channelID) {
                $this.prop.channel = syn.$n.rooms.connect({ window: window.parent, origin: '*', scope: channelID });
                $this.prop.channel.bind('request', function (evt, params) {
                    syn.$l.get('txtID').value = params.postID;
                    syn.$l.get('lblTitle').textContent = params.title;

                    syn.$w.transactionAction('GD01');
                });
            }
        }
    },

    event: {
        btnRemovePost_click() {
            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            syn.$w.alert('정말로 게시글을 삭제 하시겠습니까?', '삭제 확인', alertOptions, (result) => {
                if (result == 'Yes') {
                    syn.$w.transactionAction('DD01');
                }
            });
        },

        btnConfirm_click() {
            var title = syn.$l.get('txtTitle').value.trim();
            if (title == '') {
                syn.$w.alert('제목을 입력하세요');
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

            syn.$w.transactionAction('UD01');
        }
    }
}
