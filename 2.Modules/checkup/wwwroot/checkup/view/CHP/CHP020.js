'use strict';
let $CHP020 = {
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
        focusCodeHelpID: null
    },

    transaction: {
        LD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Grid', dataFieldID: 'CodeHelp', clear: true }],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    var gridID = 'grdCodeHelp';
                    if ($string.isNullOrEmpty($this.prop.focusCodeHelpID) == true) {
                        var rowCount = syn.uicontrols.$auigrid.countRows(gridID);
                        if (rowCount > 0) {
                            syn.uicontrols.$auigrid.selectCell(gridID, 0, 1);
                        }
                    }
                    else {
                        var items = syn.uicontrols.$auigrid.getDataAtCol(gridID, 'CodeHelpID');
                        for (var i = 0, length = items.length; i < length; i++) {
                            var item = items[i];

                            if ($this.prop.focusCodeHelpID == item) {
                                syn.uicontrols.$auigrid.selectCell('grdCodeHelp', i, 1);
                                syn.$w.transactionAction('LD02');
                                break;
                            }
                        }
                    }
                }
            }
        },

        LD02: {
            inputs: [{ type: 'Row', dataFieldID: 'CodeHelp' }],
            outputs: [{ type: 'Grid', dataFieldID: 'CodeHelpScheme', clear: true }],
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
            inputs: [{ type: 'Row', dataFieldID: 'CodeHelp' }],
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
                { type: 'Row', dataFieldID: 'CodeHelp' },
                { type: 'List', dataFieldID: 'CodeHelpScheme' }
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
        grdCodeHelp_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            var gridID = 'grdCodeHelp';
            var activeRow = syn.uicontrols.$auigrid.getActiveRowIndex(gridID);
            var codeHelpID = syn.uicontrols.$auigrid.getDataAtCell(gridID, activeRow, 'CodeHelpID');
            if (codeHelpID != $this.prop.focusCodeHelpID) {
                $this.prop.focusCodeHelpID = codeHelpID;
                syn.uicontrols.$auigrid.clear('grdCodeHelpScheme');
                syn.$w.transactionAction('LD02');
            }

            if ($string.isNullOrEmpty($this.prop.focusCodeHelpID) == true) {
                syn.$w.updateUIButton([{ command: 'save', disabled: true }, { command: 'delete', disabled: true }]);
            }
            else {
                syn.$w.updateUIButton([{ command: 'save', disabled: false }, { command: 'delete', disabled: false }]);
            }
        },

        btnNewCodeHelp_click(evt) {
            syn.$l.get('txtCreatedMemberNo').value = syn.$w.User.UserNo;
            syn.$l.get('txtCodeHelpID').value = '';
            syn.$l.get('txtCodeHelpName').value = '';
            syn.$l.get('txtDataSourceID').value = '';
            syn.$l.get('txtCommandText').value = '';
            syn.$l.get('txtCodeColumnID').value = '';
            syn.$l.get('txtValueColumnID').value = '';
            syn.$l.get('txtComment').value = '';

            syn.$w.showDialog(syn.$l.get('tplCodeHelp'), {
                minWidth: 920,
                minHeight: 650,
            });
        },

        btnAddCodeHelpScheme_click() {
            if ($string.isNullOrEmpty($this.prop.focusCodeHelpID) == true) {
                syn.$w.alert('코드도움를 선택 하세요');
            }
            else {
                syn.uicontrols.$auigrid.insertRow('grdCodeHelpScheme', {
                    amount: parseInt(syn.$l.get('ddlAddCount').value),
                    values: {
                        CodeHelpID: $this.prop.focusCodeHelpID,
                        '#TenantID': `${syn.$w.ManagedApp.UserWorkID}|${syn.$w.ManagedApp.ApplicationID}`
                    },
                    focusColumnID: 'CodeHelpID'
                });
            }
        },

        btnRemoveCodeHelpScheme_click() {
            syn.uicontrols.$auigrid.removeRow('grdCodeHelpScheme', 2);
        },

        btnSaveCodeHelp_click() {
            var codeHelpID = syn.$l.get('txtCodeHelpID').value.trim();
            if (codeHelpID == '') {
                syn.$w.alert('코드도움 ID를 입력하세요');
                return false;
            }

            var codeHelpName = syn.$l.get('txtCodeHelpName').value.trim();
            if (codeHelpName == '') {
                syn.$w.alert('코드도움 명을 입력하세요');
                return false;
            }

            var dataSourceID = syn.$l.get('txtDataSourceID').value.trim();
            if (dataSourceID == '') {
                syn.$w.alert('데이터 소스 ID를 입력하세요');
                return false;
            }

            var commandText = syn.$l.get('txtCommandText').value.trim();
            if (commandText == '') {
                syn.$w.alert('SQL을 입력하세요');
                return false;
            }

            var codeColumnID = syn.$l.get('txtCodeColumnID').value.trim();
            if (codeColumnID == '') {
                syn.$w.alert('코드 컬럼 ID를 입력하세요');
                return false;
            }

            var valueColumnID = syn.$l.get('txtValueColumnID').value.trim();
            if (valueColumnID == '') {
                syn.$w.alert('데이터 컬럼 ID를 입력하세요');
                return false;
            }

            syn.$w.transactionAction('ID01');
        }
    },

    method: {
        search() {
            syn.uicontrols.$auigrid.clear('grdCodeHelpScheme');
            syn.$w.transactionAction('LD01');
        },

        save() {
            var gridID = 'grdCodeHelp';
            if (syn.uicontrols.$auigrid.checkEmptyValueCol(gridID, 'CodeHelpName') == true) {
                syn.$w.alert('코드도움 명을 입력하세요');
                return false;
            }

            if (syn.uicontrols.$auigrid.checkEmptyValueCol(gridID, 'DataSourceID') == true) {
                syn.$w.alert('데이터 소스 ID를 입력하세요');
                return false;
            }

            if (syn.uicontrols.$auigrid.checkEmptyValueCol(gridID, 'CommandText') == true) {
                syn.$w.alert('SQL을 입력하세요');
                return false;
            }

            if (syn.uicontrols.$auigrid.checkEmptyValueCol(gridID, 'CodeColumnID') == true) {
                syn.$w.alert('코드 컬럼 ID를 입력하세요');
                return false;
            }

            if (syn.uicontrols.$auigrid.checkEmptyValueCol(gridID, 'ValueColumnID') == true) {
                syn.$w.alert('데이터 컬럼 ID를 입력하세요');
                return false;
            }

            gridID = 'grdCodeHelpScheme';
            if (syn.uicontrols.$auigrid.checkEmptyValueCol(gridID, 'ColumnID') == true) {
                syn.$w.alert('코드 컬럼 ID를 입력하세요');
                return false;
            }

            if (syn.uicontrols.$auigrid.checkUniqueValueCol(gridID, 'ColumnID') == false) {
                syn.$w.alert('고유한 코드 컬럼 ID를 입력하세요');
                return false;
            }

            syn.$w.transactionAction('MD01');
        },

        delete() {
            var text = prompt(`삭제를 하기 위해 코드도움 ID "${$this.prop.focusCodeHelpID}"를 입력하세요`);
            if (text == $this.prop.focusCodeHelpID) {
                $this.prop.focusCodeHelpID = '';
                syn.$w.transactionAction('DD01');
            }
        }
    }
}
