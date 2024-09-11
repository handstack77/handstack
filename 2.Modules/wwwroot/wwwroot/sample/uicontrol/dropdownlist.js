'use strict';
let $dropdownlist = {
    config: {
        programID: 'OMS',
        businessID: 'SMP',
        systemID: 'BOP01',
        transactionID: 'SMP110',
        screenID: 'dropdownlist',
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
        },
        transactions: []
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$select.getValue('ddlFileExtension')));
        },

        btnSetValue_click() {
            syn.uicontrols.$select.setValue('ddlFileExtension', '02');
        },

        btnClear_click() {
            syn.uicontrols.$select.clear('ddlFileExtension');
        },

        btnLoadData_click() {
            var dataSource = {
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
            };

            syn.uicontrols.$select.loadData('ddlFileExtension', dataSource, true);
        },

        btnControlReload_click() {
            syn.uicontrols.$select.controlReload('ddlFileExtension');
        },

        btnSelectRowIndex_click() {
            syn.uicontrols.$select.selectRowIndex('ddlFileExtension', 3);
        },

        btnGetSelectedIndex_click() {
            syn.$l.eventLog('btnGetSelectedIndex_click', syn.uicontrols.$select.getSelectedIndex('ddlFileExtension'));
        },

        btnSetSelectedIndex_click() {
            syn.uicontrols.$select.setSelectedIndex('ddlFileExtension', 3);
        },

        btnGetSelectedValue_click() {
            syn.$l.eventLog('btnGetSelectedValue_click', syn.uicontrols.$select.getSelectedValue('ddlFileExtension'));
        },

        btnGetSelectedText_click() {
            syn.$l.eventLog('btnGetSelectedText_click', syn.uicontrols.$select.getSelectedText('ddlFileExtension'));
        },

        btnSetSelectedValue_click() {
            syn.$l.eventLog('btnSetSelectedValue_click', syn.uicontrols.$select.setSelectedValue('ddlFileExtension', '1'));
        },

        btnSetSelectedText_click() {
            syn.$l.eventLog('btnSetSelectedText_click', syn.uicontrols.$select.setSelectedText('ddlFileExtension', '초2'));
        },

        btnGetControl_click() {
            var picker = syn.uicontrols.$select.getControl('ddlFileExtension');
            // https://github.com/pytesNET/tail.select/wiki 메서드 참조
        },

        btnDataRefresh_click() {
            syn.uicontrols.$select.dataRefresh('ddlBusinessRank', {
                dataSourceID: 'ZCB001',
                parameters: '@CodeGroupID:CMM013;@CodeGroupID:CMM013;',
                local: false,
                toSynControl: false,
                required: true,
                selectedValue: '5'
            }, function () {
                alert('do....');
            });
        }
    }
}