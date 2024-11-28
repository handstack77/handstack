'use strict';
let $CHP010 = {
    config: {
        actionButtons: [{
            command: 'search',
            icon: 'search',
            text: '조회',
            action(evt) {
                $this.method.search();
            }
        },
        {
            command: 'delete',
            icon: 'trash',
            text: '삭제',
            class: 'btn-danger',
            disabled: true,
            action(evt) {
                $this.method.delete();
            }
        },
        {
            command: 'save',
            icon: 'edit',
            text: '저장',
            class: 'btn-primary',
            disabled: true,
            action(evt) {
                $this.method.save();
            }
        },
        {
            command: 'refresh',
            icon: 'refresh',
            action(evt) {
                location.reload();
            }
        }]
    },

    prop: {
        focusGroupCode: null
    },

    transaction: {
        LD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Grid', dataFieldID: 'CodeGroup', clear: true }],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    var gridID = 'grdCodeGroup';
                    if ($string.isNullOrEmpty($this.prop.focusGroupCode) == true) {
                        var rowCount = syn.uicontrols.$grid.countRows(gridID);
                        if (rowCount > 0) {
                            syn.uicontrols.$grid.selectCell(gridID, 0, 2);
                        }
                    }
                    else {
                        var items = syn.uicontrols.$grid.getDataAtCol(gridID, 'GroupID');
                        for (var i = 0, length = items.length; i < length; i++) {
                            var item = items[i];

                            if ($this.prop.focusGroupCode == item) {
                                syn.uicontrols.$grid.selectCell('grdCodeGroup', i, 2);
                                syn.$w.transactionAction('LD02');
                                break;
                            }
                        }
                    }
                }
            }
        },

        LD02: {
            inputs: [{ type: 'Row', dataFieldID: 'CodeGroup' }],
            outputs: [{ type: 'Grid', dataFieldID: 'CodeDetail', clear: true }],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {

                }
            }
        },

        ID01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '저장 되었습니다');
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + error);
                }

                syn.$w.closeDialog();
                $this.method.search();
            }
        },

        DD01: {
            inputs: [{ type: 'Row', dataFieldID: 'CodeGroup' }],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '삭제 되었습니다');
                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '삭제에 실패했습니다. 오류: ' + error);
                }
            }
        },

        MD01: {
            inputs: [
                { type: 'Row', dataFieldID: 'CodeGroup' },
                { type: 'List', dataFieldID: 'CodeDetail' }
            ],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '저장 되었습니다');

                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + error);
                }
            }
        },
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            syn.$l.get('txtApplicationNo').value = syn.$w.ManagedApp.ApplicationNo;
            syn.$l.get('txtUserNo').value = syn.$w.User.UserNo;
            syn.$l.get('txtTenantID').value = `${syn.$w.ManagedApp.UserWorkID}|${syn.$w.ManagedApp.ApplicationID}`;

            $this.method.search();
        },
    },

    event: {
        grdCodeGroup_afterSelectionEnd(row, column, row2, column2, selectionLayerLevel) {
            var gridID = 'grdCodeGroup';
            if (syn.uicontrols.$grid.getGridValue(gridID).colHeaderClick) {
                return;
            }

            var activeRow = syn.uicontrols.$grid.getActiveRowIndex(gridID);
            var groupCode = syn.uicontrols.$grid.getDataAtCell(gridID, activeRow, 'GroupID');
            if (groupCode != $this.prop.focusGroupCode) {
                $this.prop.focusGroupCode = groupCode;
                syn.uicontrols.$grid.clear('grdCodeDetail');
                syn.$w.transactionAction('LD02');
            }

            if ($string.isNullOrEmpty($this.prop.focusGroupCode) == true) {
                syn.$w.updateUIButton([{ command: 'save', disabled: true }, { command: 'delete', disabled: true }]);
            }
            else {
                syn.$w.updateUIButton([{ command: 'save', disabled: false }, { command: 'delete', disabled: false }]);
            }
        },

        btnNewCodeGroup_click(evt) {
            syn.$l.get('txtCreatedMemberNo').value = syn.$w.User.UserNo;
            syn.$l.get('txtCodeID').value = '';
            syn.$l.get('txtCodeValue').value = '';
            syn.$l.get('txtComment').value = '';
            syn.$l.get('txtSortingNo').value = '';

            syn.$w.showDialog(syn.$l.get('tplCodeGroup'), {
                minWidth: 480,
                minHeight: 500,
            });
        },

        btnAddCodeDetail_click() {
            if ($string.isNullOrEmpty($this.prop.focusGroupCode) == true) {
                syn.$w.alert('기초코드를 선택 하세요');
            }
            else {
                syn.uicontrols.$grid.insertRow('grdCodeDetail', {
                    amount: parseInt(syn.$l.get('ddlAddCount').value),
                    values: {
                        GroupCode: $this.prop.focusGroupCode,
                        '#TenantID': `${syn.$w.ManagedApp.UserWorkID}|${syn.$w.ManagedApp.ApplicationID}`
                    },
                    focusColumnID: 'CodeID'
                });
            }
        },

        btnRemoveCodeDetail_click() {
            syn.uicontrols.$grid.removeRow('grdCodeDetail', 2);
        },

        btnSaveCodeGroup_click() {
            var codeID = syn.$l.get('txtCodeID').value.trim();
            if (codeID == '') {
                syn.$w.alert('그룹 ID를 입력하세요');
                return false;
            }

            var codeValue = syn.$l.get('txtCodeValue').value.trim();
            if (codeValue == '') {
                syn.$w.alert('그룹 명을 입력하세요');
                return false;
            }

            syn.$w.transactionAction('ID01');
        }
    },

    method: {
        search() {
            syn.uicontrols.$grid.clear('grdCodeDetail');
            syn.$w.transactionAction('LD01');
        },

        save() {
            var gridID = 'grdCodeDetail';
            if (syn.uicontrols.$grid.checkEmptyValueCol(gridID, 'CodeID') == true) {
                syn.$w.alert('코드 ID를 입력하세요');
                return false;
            }

            if (syn.uicontrols.$grid.checkUniqueValueCol(gridID, 'CodeID') == false) {
                syn.$w.alert('고유한 코드 ID를 입력하세요');
                return false;
            }

            syn.$w.transactionAction('MD01');
        },

        delete() {
            var text = prompt(`삭제를 하기 위해 그룹 ID "${$this.prop.focusGroupCode}"를 입력하세요`);
            if (text == $this.prop.focusGroupCode) {
                $this.prop.focusGroupCode = '';
                syn.$w.transactionAction('DD01');
            }
        }
    }
}
