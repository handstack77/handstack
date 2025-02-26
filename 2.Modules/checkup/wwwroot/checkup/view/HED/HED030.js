'use strict';
let $HED030 = {
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
            command: 'backup',
            icon: 'download',
            text: '데이터베이스 백업',
            class: 'btn-primary',
            action(evt) {
                $this.method.backup();
            }
        },
        {
            command: 'restore',
            icon: 'upload',
            text: '데이터베이스 복원',
            class: 'btn-danger',
            action(evt) {
                $this.method.restore();
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
        gridInstance: null,
        focusTableName: null,
        selectedPageIndex: '0',
        adjustHeight: 654
    },

    transaction: {
        LF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'Table', clear: true }
            ]
        },

        LF02: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'TableColumn', clear: true }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    $this.store.Exception.Error = '';
                    syn.$w.transactionAction('LF03');
                }
            }
        },

        LF03: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' },
                { type: 'Grid', dataFieldID: 'TableData', clear: true }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    for (var i = 0, length = $this.store.TableData.length; i < length; i++) {
                        delete $this.store.TableData[i].Flag;
                    }

                    var rowCount = syn.$l.get('txtRowCount').value;
                    syn.$l.get('lblTableData').textContent = `데이터: ${$string.toCurrency(rowCount) || '0'}건`;

                    var totalPageIndex = Math.ceil($string.toNumber(rowCount) / 50);

                    var dataSource = [];
                    for (var i = 0, length = totalPageIndex; i < length; i++) {
                        dataSource.push({ PageIndex: i });
                    }
                    var optionText = '<option value="#{PageIndex}">#{PageIndex}</option>';
                    syn.$l.get('ddlPageIndex').innerHTML = $string.interpolate(optionText, dataSource);
                    syn.$l.get('ddlPageIndex').value = $this.prop.selectedPageIndex || '0';
                    $this.method.updateTableData($this.store.TableData);
                }
                else {
                    syn.$w.notify('warning', '테이블 데이터 조회에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        },

        MF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    var tokenID = syn.$l.get('txtTokenID').value;
                    syn.$w.fileDownload(`/checkup/api/tenant-app/backup-database-download?userWorkID=${syn.$w.ManagedApp.UserWorkID}&applicationID=${syn.$w.ManagedApp.ApplicationID}&downloadTokenID=${tokenID}`);
                    syn.$l.get('txtTokenID').value = '';
                }
                else {
                    syn.$w.notify('warning', '데이터베이스 백업에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        },

        MF02: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$l.get('fleAsset').click();
                }
                else {
                    syn.$w.notify('warning', '데이터베이스 복원에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        },

        IF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '입력하신 SQL이 실행 되었습니다');
                }
                else {
                    syn.$w.notify('warning', 'SQL 실행에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        }
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        async pageLoad() {
            syn.$l.get('txtApplicationNo').value = syn.$w.ManagedApp.ApplicationNo;
            syn.$l.get('txtUserWorkID').value = syn.$w.ManagedApp.UserWorkID;
            syn.$l.get('txtApplicationID').value = syn.$w.ManagedApp.ApplicationID;
            syn.$l.get('txtUserNo').value = syn.$w.User.UserNo;

            $this.method.searchAppTarget();
        },

        pageResizing: function (dimension) {
            var windowHeight = dimension.windowHeight;
            if (windowHeight < 820) {
                windowHeight = 820;
            }
            syn.uicontrols.$auigrid.setControlSize('grdTableColumn', { height: (windowHeight - $this.prop.adjustHeight) });
            syn.uicontrols.$auigrid.setControlSize('grdTableData', { height: (windowHeight - ($this.prop.adjustHeight - 356)) });
        }
    },

    event: {
        async fleAsset_change(evt) {
            var fileUpload = syn.$l.get('fleAsset');
            if (fileUpload.files.length > 0) {
                var tokenID = syn.$l.get('txtTokenID').value;
                syn.$l.get('txtTokenID').value = '';

                var myHeaders = new Headers();
                var formData = new FormData();
                formData.append("file", fileUpload.files[0]);

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: formData
                };

                var response = await fetch(`/checkup/api/tenant-app/restore-database-upload?userWorkID=${syn.$w.ManagedApp.UserWorkID}&applicationID=${syn.$w.ManagedApp.ApplicationID}&uploadTokenID=${tokenID}`, requestOptions);
                if (response.status == 200) {
                    syn.$w.notify('success', '데이터베이스가 복원 되었습니다');
                    var alertOptions = $object.clone(syn.$w.alertOptions);
                    alertOptions.icon = 'success';
                    alertOptions.buttonType = '1';
                    syn.$w.alert('데이터베이스가 복원 되었습니다', '복원', alertOptions, function (result) {
                        location.reload();
                    });
                }
                else {
                    syn.$w.notify('warning', '데이터베이스 복원에 실패했습니다');
                }
            }
        },

        grdTable_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            var gridID = 'grdTable';
            var tableName = syn.uicontrols.$auigrid.getDataAtCell(gridID, rowIndex, 'tbl_name');
            if (tableName != $this.prop.focusTableName) {
                $this.prop.focusTableName = tableName;
                syn.$l.get('txtTableName').value = tableName;
                syn.uicontrols.$auigrid.clear('grdTableColumn');

                $this.store.Exception.Error = '';
                syn.$w.transactionAction('LF02');

                syn.$l.get('ddlPageIndex').value = '0';
                $this.prop.selectedPageIndex = syn.$l.get('ddlPageIndex').value;
            }
        },

        ddlPageIndex_change(evt) {
            if (syn.$l.get('ddlAppTarget').value != '') {
                $this.prop.selectedPageIndex = syn.$l.get('ddlPageIndex').value;

                $this.store.Exception.Error = '';
                syn.$w.transactionAction('LF03');
            }
            else {
                syn.$w.alert('관리 대상 서버를 선택 하세요');
            }
        },

        btnSQLEditor_click(evt) {
            if (syn.$l.get('ddlAppTarget').value != '') {
                syn.$l.get('txtSql').value = '';
                syn.$l.get('txtCompressBase64').value = '';

                syn.$w.showDialog(syn.$l.get('tplSqlEditor'), {
                    minWidth: 640,
                    minHeight: 480,
                });
            }
            else {
                syn.$w.alert('관리 대상 서버를 선택 하세요');
            }
        },

        btnExecuteSql_click(evt) {
            syn.$l.get('txtCompressBase64').value = syn.$c.LZString.compressToBase64(syn.$l.get('txtSql').value);
            $this.store.Exception.Error = '';
            syn.$w.transactionAction('IF01');
        }
    },

    method: {
        search() {
            $this.store.Exception.Error = '';
            syn.$w.transactionAction('LF01');
        },

        backup() {
            $this.store.Exception.Error = '';
            syn.$w.transactionAction('MF01');
        },

        restore() {
            $this.store.Exception.Error = '';
            syn.$w.transactionAction('MF02');
        },

        searchAppTarget() {
            var directObject = {
                programID: syn.Config.ApplicationID,
                businessID: 'SYS',
                transactionID: 'SYS010',
                functionID: 'LF04',
                dataMapInterface: 'Row|Form,Grid',
                inputObjects: [
                    { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                    { prop: 'UserNo', val: syn.$w.User.UserNo },
                    { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID }
                ]
            };

            syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                if (responseData.length == 2) {
                    var dataSource = responseData[1].value;
                    var optionText = '<option value="#{DeployID}" selected="selected">#{DeployID}</option>';
                    syn.$l.get('ddlAppTarget').innerHTML = $string.interpolate(optionText, dataSource);

                    syn.$l.get('ddlAppTarget').options.selectedIndex = 0;
                    if (syn.$l.get('ddlAppTarget').value != '') {
                        $this.method.search();
                    }
                }
                else {
                    syn.$w.alert(`$관리 대상 서버 정보를 조회하지 못했습니다`);
                }
            });
        },

        updateTableData(dataSource) {
            var gridID = 'grdTableData';
            syn.uicontrols.$auigrid.clear(gridID);

            var columns = [];
            var columnNames = syn.uicontrols.$auigrid.getColumnValues('grdTableColumn', 'ColumnName');
            for (var i = 0, length = columnNames.length; i < length; i++) {
                var columnName = columnNames[i];
                columns.push([columnName, columnName, null, false, 'text', true, 'left']);
            }

            var columnLayout = syn.uicontrols.$auigrid.getInitializeColumns(gridID, columns, true);
            syn.uicontrols.$auigrid.changeColumnLayout(gridID, columnLayout);
            syn.uicontrols.$auigrid.setValue(gridID, dataSource);

            if (dataSource && $object.isEmpty(dataSource) == false) {
                syn.uicontrols.$auigrid.setFitColumnSize(gridID);
            }
        }
    }
}
