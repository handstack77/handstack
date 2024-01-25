'use strict';
let $BOD010 = {
    transaction: {
        ZD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [],
            callback: (error, responseObject, addtionalData) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', `게시판 테이블이 초기화 되었습니다 !`);
                    syn.$w.transactionAction('LD01');
                }
            }
        },

        LD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Grid', dataFieldID: 'Board' }]
        },
    },

    hook: {
        pageLoad() {
            syn.$w.transactionAction('LD01');
        }
    },

    event: {
        btnTruncateTable_click(evt) {
            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            syn.$w.alert('정말로 게시판 테이블을 초기화 하시겠습니까?', '초기화 확인', alertOptions, (result) => {
                if (result == 'Yes') {
                    syn.$w.transactionAction('ZD01');
                }
            });
        },

        btnNewBoard_click(evt) {
            var windowID = 'BOD010';
            var popupOptions = $object.clone(syn.$w.popupOptions);
            popupOptions.title = '신규 게시글 작성';
            popupOptions.src = 'BOD011.html';
            popupOptions.channelID = windowID;
            popupOptions.isModal = true;
            popupOptions.width = 800;
            popupOptions.height = 750;
            popupOptions.notifyActions.push({
                actionID: 'response',
                handler(evt, val) {
                    syn.$w.windowClose(windowID);
                    syn.$w.transactionAction('LD01');
                }
            });

            syn.$w.windowOpen(windowID, popupOptions);
        },

        btnSearch_click(evt) {
            syn.$w.transactionAction('LD01');
        },

        grdBoard_cellButtonClick(elID, row, column, prop, value) {
            var gridID = 'grdBoard';
            var columnViewPost = syn.uicontrols.$grid.propToCol(gridID, 'EditPost');
            if (column == columnViewPost && row > -1) {
                var windowID = 'BOD010';
                var popupOptions = $object.clone(syn.$w.popupOptions);
                popupOptions.title = '게시글 확인 및 편집';
                popupOptions.src = 'BOD012.html';
                popupOptions.channelID = windowID;
                popupOptions.isModal = true;
                popupOptions.width = 800;
                popupOptions.height = 750;
                popupOptions.notifyActions.push({
                    actionID: 'response',
                    handler(evt, val) {
                        syn.$w.windowClose(windowID);
                        syn.$w.transactionAction('LD01');
                    }
                });

                syn.$w.windowOpen(windowID, popupOptions, (elID) => {
                    var post = {
                        postID: syn.uicontrols.$grid.getDataAtCell(gridID, row, 'ID'),
                        title: syn.uicontrols.$grid.getDataAtCell(gridID, row, 'Title')
                    };

                    syn.$n.call(windowID, 'request', post);
                });
            };
        }
    }
}
