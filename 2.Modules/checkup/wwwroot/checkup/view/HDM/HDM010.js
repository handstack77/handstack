'use strict';
let $HDM010 = {
    config: {
        dataSource: {
            FieldType: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: 'String',
                        CodeValue: 'String'
                    },
                    {
                        CodeID: 'Int32',
                        CodeValue: 'Int32'
                    },
                    {
                        CodeID: 'Int64',
                        CodeValue: 'Int64'
                    },
                    {
                        CodeID: 'DateTime',
                        CodeValue: 'DateTime'
                    },
                    {
                        CodeID: 'Boolean',
                        CodeValue: 'Boolean'
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
        focusMetaEntityNo: null,
        saveAndAction: '',
        adjustHeight: 298
    },

    transaction: {
        LD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Grid', dataFieldID: 'MetaEntity', clear: true }],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    if ($string.isNullOrEmpty($this.prop.focusMetaEntityNo) == false) {
                        var items = syn.uicontrols.$auigrid.getDataAtCol('grdMetaEntity', 'EntityNo');
                        for (var i = 0, length = items.length; i < length; i++) {
                            var item = items[i];

                            if ($this.prop.focusMetaEntityNo == item) {
                                syn.uicontrols.$auigrid.selectCell('grdMetaEntity', i, 2);
                                break;
                            }
                        }
                    }
                }
            }
        },

        LD02: {
            inputs: [{ type: 'Row', dataFieldID: 'MetaEntity' }],
            outputs: [{ type: 'Grid', dataFieldID: 'MetaField', clear: true }],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    var countRows = syn.uicontrols.$auigrid.countRows('grdMetaField');
                    if (countRows > 0) {
                        syn.$l.get('btnInitialData').removeAttribute('disabled');
                    }
                    else {
                        syn.$l.get('btnInitialData').setAttribute('disabled', 'disabled');
                    }
                }
                else {
                    syn.$l.get('btnInitialData').setAttribute('disabled', 'disabled');
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
            inputs: [{ type: 'Row', dataFieldID: 'MetaEntity' }],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '삭제 되었습니다');
                }
                else {
                    syn.$w.notify('warning', '삭제에 실패했습니다. 오류: ' + error);
                }
            }
        },

        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MetaEntity' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    var windowID = 'HDM010';

                    var popupOptions = $object.clone(syn.$w.popupOptions);
                    popupOptions.title = '초기 데이터 관리';
                    popupOptions.src = 'HDM011.html';
                    popupOptions.channelID = windowID;
                    popupOptions.isModal = true;
                    popupOptions.width = 1024;
                    popupOptions.height = 600;
                    popupOptions.notifyActions.push({
                        actionID: 'response',
                        handler(evt, val) {
                            syn.$w.windowClose(val);
                        }
                    });

                    syn.$w.windowOpen(windowID, popupOptions, (elID) => {
                        var gridID = 'grdMetaEntity';
                        var activeRow = syn.uicontrols.$auigrid.getActiveRowIndex(gridID);
                        var entityMeta = {
                            readonly: false,
                            entityNo: syn.uicontrols.$auigrid.getDataAtCell(gridID, activeRow, 'EntityNo'),
                            entityID: syn.uicontrols.$auigrid.getDataAtCell(gridID, activeRow, 'EntityID'),
                            entityName: syn.uicontrols.$auigrid.getDataAtCell(gridID, activeRow, 'EntityName'),
                            categoryName: syn.uicontrols.$auigrid.getDataAtCell(gridID, activeRow, 'CategoryName'),
                            fields: [],
                            seedData: JSON.parse(syn.$l.get('txtSeedData').value.trim() || '[]')
                        };

                        var items = syn.uicontrols.$auigrid.getSettings('grdMetaField').data;
                        for (var i = 0, length = items.length; i < length; i++) {
                            var item = items[i];
                            entityMeta.fields.push({
                                FieldID: item.FieldID,
                                FieldName: item.FieldName,
                                FieldType: ['Int32', 'Int64', 'Single', 'Decimal'].indexOf(item.FieldType) > -1 ? 'numeric' : 'text',
                                MaxLength: item.MaxLength
                            });
                        }

                        syn.$n.call(windowID, 'request', entityMeta);
                    });
                }
            }
        },

        MD01: {
            inputs: [
                { type: 'Row', dataFieldID: 'MetaEntity' },
                { type: 'List', dataFieldID: 'MetaField' }
            ],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '저장 되었습니다');

                    if ($string.isNullOrEmpty($this.prop.saveAndAction) == false) {
                        if ($this.prop.saveAndAction == 'initialData') {
                            $this.method.windowOpenInitialData();
                        }

                        $this.prop.saveAndAction = '';
                    }
                    else {
                        $this.method.search();
                    }
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

        pageResizing: function (dimension) {
            syn.uicontrols.$auigrid.setControlSize('grdMetaEntity', { height: (dimension.windowHeight - $this.prop.adjustHeight) });
            syn.uicontrols.$auigrid.setControlSize('grdMetaField', { height: (dimension.windowHeight - $this.prop.adjustHeight) });
        }
    },

    event: {
        grdMetaEntity_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            var gridID = 'grdMetaEntity';
            var activeRow = syn.uicontrols.$auigrid.getActiveRowIndex(gridID);
            var entityNo = syn.uicontrols.$auigrid.getDataAtCell(gridID, activeRow, 'EntityNo');
            if (entityNo != $this.prop.focusMetaEntityNo) {
                $this.prop.focusMetaEntityNo = entityNo;
                syn.uicontrols.$auigrid.clear('grdMetaField');
                syn.$w.transactionAction('LD02');
            }

            if ($string.isNullOrEmpty($this.prop.focusMetaEntityNo) == true) {
                syn.$w.updateUIButton([{ command: 'save', disabled: true, }]);
            }
            else {
                syn.$w.updateUIButton([{ command: 'save', disabled: false, }]);
            }
        },

        grdMetaEntity_afterChange(changes) {
            if (changes && changes.length > 0) {
                var change = changes[0];
                var row = change[0];
                var columnID = change[1];
                var oldValue = change[2];
                var newValue = change[3];

                oldValue = $object.isNullOrUndefined(oldValue) == true ? '' : oldValue;

                var columns = ['MemberStatusName', 'RoleDevelop', 'RoleBusiness', 'RoleOperation', 'RoleManaged', 'ExpiredAt'];
                if (columns.indexOf(columnID) > -1 && oldValue != newValue) {
                    var gridID = 'grdMetaEntity';
                    if (syn.uicontrols.$auigrid.getDataAtCell(gridID, row, 'ModifiedMemberNo') != syn.$w.User.UserNo) {
                        syn.uicontrols.$auigrid.setDataAtCell(gridID, row, 'ModifiedMemberNo', syn.$w.User.UserNo);
                        syn.uicontrols.$auigrid.setDataAtCell(gridID, row, 'ModifiedMemberName', syn.$w.User.UserName);
                    }
                }
            }
        },

        async btnNewMetaEntity_click(evt) {
            syn.$l.get('txtEntityNo').value = await syn.$r.httpFetch('/checkup/api/index/id').send();
            syn.$l.get('txtCreatedMemberNo').value = syn.$w.User.UserNo;
            syn.$l.get('txtEntityID').value = '';
            syn.$l.get('txtAcronyms').value = '';
            syn.$l.get('txtEntityName').value = '';
            syn.$l.get('txtCategoryName').value = '';
            syn.$l.get('txtComment').value = '';

            syn.$w.showDialog(syn.$l.get('tplMetaEntity'), {
                minWidth: 480,
                minHeight: 540,
            });
        },

        btnInitialData_click(evt) {
            $this.prop.saveAndAction = 'initialData';
            $this.method.save();
        },

        btnAddMetaField_click() {
            if ($string.isNullOrEmpty($this.prop.focusMetaEntityNo) == true) {
                syn.$w.alert('엔티티를 선택 하세요');
            }
            else {
                syn.uicontrols.$auigrid.insertRow('grdMetaField', {
                    amount: parseInt(syn.$l.get('ddlAddCount').value),
                    values: {
                        EntityNo: $this.prop.focusMetaEntityNo,
                        FieldType: 'String',
                        FieldTypeName: 'String',
                        MaxLength: '50',
                        '#TenantID': `${syn.$w.ManagedApp.UserWorkID}|${syn.$w.ManagedApp.ApplicationID}`
                    },
                    focusColumnID: 'FieldID'
                });
            }
        },

        btnRemoveMetaField_click() {
            syn.uicontrols.$auigrid.removeRow('grdMetaField', 3);
        },

        btnSaveMetaEntity_click() {
            var entityID = syn.$l.get('txtEntityID').value.trim();
            if (entityID == '') {
                syn.$w.alert('엔티티 ID를 입력하세요');
                return false;
            }

            var entityName = syn.$l.get('txtEntityName').value.trim();
            if (entityName == '') {
                syn.$w.alert('엔티티 명을 입력하세요');
                return false;
            }

            syn.$w.transactionAction('ID01');
        }
    },

    method: {
        search() {
            syn.$w.transactionAction('LD01');
        },

        save() {
            var gridID = 'grdMetaField';
            if (syn.uicontrols.$auigrid.checkEditValue('grdMetaEntity') == false && syn.uicontrols.$auigrid.checkEditValue(gridID) == false) {
                if ($this.prop.saveAndAction == 'initialData') {
                    $this.method.windowOpenInitialData();
                }
                return false;
            }

            if (syn.uicontrols.$auigrid.checkValueCountCol(gridID, 'PK', '1') == 0) {
                syn.$w.alert('PK (기본키)를 하나 이상 입력하세요');
                return false;
            }

            if (syn.uicontrols.$auigrid.checkEmptyValueCol(gridID, 'FieldID') == true) {
                syn.$w.alert('필드 ID를 입력하세요');
                return false;
            }

            if (syn.uicontrols.$auigrid.checkUniqueValueCol(gridID, 'FieldID') == false) {
                syn.$w.alert('고유한 필드 ID를 입력하세요');
                return false;
            }

            syn.$w.transactionAction('MD01');
        },

        windowOpenInitialData() {
            var items = syn.uicontrols.$auigrid.getSettings('grdMetaField').data;
            if (items.length > 0) {
                syn.$w.transactionAction('GD01');
            }
            else {
                syn.$w.alert('필드 정보를 입력하세요');
            }
        },
    },
}
