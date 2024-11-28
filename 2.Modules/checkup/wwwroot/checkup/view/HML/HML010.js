'use strict';
let $HML010 = {
    config: {
        dataSource: {
            SYS034: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: 'R',
                        CodeValue: '요청'
                    },
                    {
                        CodeID: 'J',
                        CodeValue: '합류'
                    },
                    {
                        CodeID: 'D',
                        CodeValue: '탈퇴'
                    },
                    {
                        CodeID: 'E',
                        CodeValue: '만료'
                    }
                ]
            }
        },
        actionButtons: [{
            command: 'search',
            icon: 'search',
            text: '조회',
            action(evt) {
                $this.method.search();
            }
        },
        {
            command: 'save',
            icon: 'edit',
            text: '저장',
            class: 'btn-primary',
            action(evt) {
                var gridID = 'grdAppMember';
                if (syn.uicontrols.$grid.checkEditValue(gridID) == false) {
                    return false;
                }

                if (syn.uicontrols.$grid.checkEmptyValueCol(gridID, 'EmailID') == true) {
                    syn.$w.alert('이메일을 입력하세요');
                    return false;
                }

                if (syn.uicontrols.$grid.checkUniqueValueCol(gridID, 'EmailID') == false) {
                    syn.$w.alert('고유한 이메일을 입력하세요');
                    return false;
                }

                if (syn.uicontrols.$grid.checkEmptyValueCols(gridID, ['RoleDevelop', 'RoleBusiness', 'RoleOperation', 'RoleManaged'], '0') == true) {
                    syn.$w.alert('개발, 업무, 운영, 관리 역할중 하나를 선택 하세요');
                    return false;
                }

                syn.$w.transactionAction('MD01');
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
    },

    transaction: {
        LD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Grid', dataFieldID: 'AppMember', clear: true }]
        },

        MD01: {
            inputs: [{ type: 'List', dataFieldID: 'AppMember' }],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '저장 되었습니다');
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
            var gridID = 'grdAppMember';
            var settings = syn.uicontrols.$grid.getSettings(gridID);
            settings.cells = function (row, col, prop) {
                if (prop == 'ApplicationNo' || prop == 'MemberNo' || prop == 'EmailID') {
                    var cellProperties = {};
                    var flag = syn.uicontrols.$grid.getFlag(gridID, row);
                    if (flag == 'C') {
                        cellProperties.readOnly = false;
                    }
                    else {
                        cellProperties.readOnly = true;
                    }

                    return cellProperties;
                }
            };
            syn.uicontrols.$grid.updateSettings(gridID, settings);

            syn.$l.get('txtApplicationNo').value = syn.$w.ManagedApp.ApplicationNo;

            $this.method.search();
        },
    },

    event: {
        grdAppMember_afterChange(changes) {
            if (changes && changes.length > 0) {
                var change = changes[0];
                var row = change[0];
                var columnID = change[1];
                var oldValue = change[2];
                var newValue = change[3];

                oldValue = $object.isNullOrUndefined(oldValue) == true ? '' : oldValue;

                var columns = ['MemberStatusName', 'RoleDevelop', 'RoleBusiness', 'RoleOperation', 'RoleManaged', 'ExpiredAt'];
                if (columns.indexOf(columnID) > -1 && oldValue != newValue) {
                    var gridID = 'grdAppMember';
                    if (syn.uicontrols.$grid.getDataAtCell(gridID, row, 'ModifiedMemberNo') != syn.$w.User.UserNo) {
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'ModifiedMemberNo', syn.$w.User.UserNo);
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'ModifiedMemberName', syn.$w.User.UserName);
                    }
                }
            }
        },

        btnAddAppMember_click() {
            syn.uicontrols.$grid.insertRow('grdAppMember', {
                amount: 1,
                values: {
                    ApplicationNo: syn.$w.ManagedApp.ApplicationNo,
                    MemberNo: '',
                    MemberStatus: 'R',
                    MemberStatusName: '요청',
                    CreatedMemberNo: syn.$w.User.UserNo,
                    CreatedMemberName: syn.$w.User.UserName
                },
                focusColumnID: 'EmailID'
            });
        },

        btnRemoveAppMember_click() {
            syn.uicontrols.$grid.removeRow('grdAppMember');
        }
    },

    method: {
        search() {
            syn.$w.transactionAction('LD01');
        },
    },
}
