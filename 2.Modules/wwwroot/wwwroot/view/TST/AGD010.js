'use strict';
let $AGD010 = {
    config: {
        dataSource: {
            CMM001: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: '0',
                        CodeValue: '권한없음'
                    },
                    {
                        CodeID: '1',
                        CodeValue: '권한존재'
                    }
                ]
            },
            CMM002: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: '0',
                        CodeValue: '남자'
                    },
                    {
                        CodeID: '1',
                        CodeValue: '여자'
                    },
                    {
                        CodeID: '2',
                        CodeValue: '공개안함'
                    }
                ]
            }
        }
    },

    prop: {
        channel: null
    },

    transaction: {
        LD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Grid', dataFieldID: 'DataList' }]
        }
    },

    hook: {
        pageLoad() {
            var footerLayout = [{
                labelText: '∑',
                positionField: '#base'
            }, {
                dataField: 'quantity',
                positionField: 'quantity',
                operation: 'SUM',
                formatString: '#,##0'
            }, {
                dataField: 'quantity, price',
                dataType: 'numeric',
                positionField: 'price',
                operation: 'SUM',
                formatString: '#,##0'
            }];

            syn.uicontrols.$auigrid.setFooter('grdDataList', footerLayout);

            // syn.$w.loadJson('data.json', null, function (setting, json) {
            //     if (json) {
            //         syn.uicontrols.$auigrid.setValue('grdDataList', json);
            //     }
            // });
        }
    },

    event: {
        btnSearch_click() {
            syn.$w.transactionAction('LD01');
        },

        grdDataList_cellClick(evt) {
        },

        grdDataList_cellLinkClick(dataField, rowIndex, columnIndex, value, item) {
        },

        grdDataList_cellButtonClick(dataField, rowIndex, columnIndex, value, item) {
        },

        grdDataList_cellEditEndBefore(evt) {
            if (evt.dataField == "원하는 필드명" && evt.isClipboard == true) {
                
            }
            return evt.value;
        },

        btnAddRow_click() {
            syn.uicontrols.$auigrid.insertRow('grdDataList', {
                amount: 1,
                values: {
                    ApplicationNo: syn.$w.ManagedApp.ApplicationNo,
                    MemberNo: '',
                    MemberStatus: 'R',
                    ProName: '요청',
                    CreatedMemberNo: syn.$w.User.UserNo,
                    CreatedMemberName: syn.$w.User.UserName
                },
                focusColumnID: 'ProName'
            });
        },

        btnRemoveRow_click() {
            syn.uicontrols.$auigrid.removeRow('grdDataList');
        },

        btnExcelExport_click() {
            syn.uicontrols.$auigrid.exportFile('grdDataList', {
                type: 'xlsx',
                fileName: 'export.xlsx'
            });
        },

        btnExcelImport_click() {
            syn.uicontrols.$auigrid.importFile('grdDataList', (result, fileName) => {
                debugger;
            });
        }
    },

    method: {
        srcFunction(rowIndex, columnIndex, value, item) {
            return `https://www.auisoft.net/demo/auigrid/assets/${value}.png`;
        }
    }
}
