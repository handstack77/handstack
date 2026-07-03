'use strict';
let $dropdownchecklist = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$multiselect.getValue('ddlFileExtension')));
        },

        btnSetValue_click() {
            syn.uicontrols.$multiselect.setValue('ddlFileExtension', ['02', '05']);
        },

        btnClear_click() {
            syn.uicontrols.$multiselect.clear('ddlFileExtension');
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

            syn.uicontrols.$multiselect.loadData('ddlFileExtension', dataSource, true);
        },

        btnControlReload_click() {
            syn.uicontrols.$multiselect.controlReload('ddlFileExtension');
        },

        btnGetSelectedIndex_click() {
            syn.$l.eventLog('btnGetSelectedIndex_click', syn.uicontrols.$multiselect.getSelectedIndex('ddlFileExtension'));
        },

        btnSetSelectedIndex_click() {
            syn.uicontrols.$multiselect.setSelectedIndex('ddlFileExtension', 3);
        },

        btnGetSelectedValue_click() {
            syn.$l.eventLog('btnGetSelectedValue_click', syn.uicontrols.$multiselect.getSelectedValue('ddlFileExtension'));
        },

        btnGetSelectedText_click() {
            syn.$l.eventLog('btnGetSelectedText_click', syn.uicontrols.$multiselect.getSelectedText('ddlFileExtension'));
        },

        btnSetSelectedValue_click() {
            syn.uicontrols.$multiselect.setSelectedValue('ddlFileExtension', '1');

            setTimeout(function () {
                var values = [];
                values.push('1');
                values.push('2');
                values.push('3');
                values.push('4');
                syn.uicontrols.$multiselect.setSelectedValue('ddlFileExtension', values);
            }, 10000);
        },

        btnSetSelectedText_click() {
            syn.$l.eventLog('btnSetSelectedText_click', syn.uicontrols.$multiselect.setSelectedText('ddlFileExtension', '중2'));

            setTimeout(function () {
                var values = [];
                values.push('초4');
                values.push('초5');
                values.push('초6');
                syn.uicontrols.$multiselect.setSelectedText('ddlFileExtension', values);
            }, 10000);
        },

        btnGetControl_click() {
            var picker = syn.uicontrols.$multiselect.getControl('ddlFileExtension');
            // https://github.com/pytesNET/tail.select/wiki 메서드 참조
        },

        btnDataRefresh_click() {
            syn.uicontrols.$multiselect.dataRefresh('ddlBusinessRank', {
                dataSourceID: 'ZCB001',
                parameters: '@CodeGroupID:CMM013;',
                local: false,
                toSynControl: false,
                required: true,
                selectedValue: ['2', '5', '7']
            });
        }
    }
}
