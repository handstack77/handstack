'use strict';
let $HDM011 = {
    transaction: {
        UD01: {
            inputs: [
                { type: 'Row', dataFieldID: 'MainForm' }
            ],
            outputs: [],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', '저장 되었습니다');

                    setTimeout(() => {
                        syn.$n.emit('response', 'HDM010');
                    }, 300);
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + error);
                }
            }
        },
    },

    hook: {
        pageLoad() {
            var channelID = syn.$r.query('channelID');
            if (window != window.parent && channelID) {
                $this.prop.childrenChannel = syn.$n.rooms.connect({ window: window.parent, origin: '*', scope: channelID });
                $this.prop.childrenChannel.bind('request', function (evt, params) {
                    if (params.readonly == false) {
                        syn.$m.removeClass('divButton', 'hidden');
                        syn.$m.removeClass('divFooter', 'hidden');
                    }

                    syn.$l.get('txtEntityNo').value = params.entityNo;
                    syn.$l.get('lblTitle').textContent = `${params.entityName} (${params.entityID}) 엔티티`;
                    var gridID = 'grdMetaData';
                    var settings = syn.uicontrols.$grid.getSettings(gridID);

                    var columns = [];

                    for (var i = 0, length = params.fields.length; i < length; i++) {
                        var field = params.fields[i];
                        columns.push([field.FieldID, field.FieldName, 100, false, field.FieldType, false, 'left']);
                    }

                    var gridSetting = syn.uicontrols.$grid.getInitializeColumns({ columns: columns }, gridID);

                    settings.colHeaders = gridSetting.colHeaders;
                    settings.colWidths = gridSetting.colWidths;
                    settings.columns = gridSetting.columns;

                    settings.colHeaders.unshift('Flag');
                    settings.colWidths.unshift(10);
                    settings.columns.unshift({
                        data: 'Flag',
                        type: 'text',
                        readOnly: true
                    });
                    syn.uicontrols.$grid.updateSettings(gridID, settings);

                    setTimeout(() => {
                        var metaColumns = {};
                        for (var k = 0; k < settings.columns.length; k++) {
                            var column = settings.columns[k];
                            var dataType = 'string'
                            switch (column.type) {
                                case 'radio':
                                case 'checkbox':
                                case 'checkbox2':
                                    dataType = 'bool';
                                    break;
                                case 'numeric':
                                    dataType = 'int';
                                    break;
                                case 'date':
                                    dataType = 'string';
                                    break;
                            }

                            metaColumns[column.data] = {
                                fieldID: column.data,
                                dataType: dataType
                            };
                        }

                        syn.uicontrols.$grid.setValue(gridID, params.seedData, metaColumns);
                    }, 25);
                });
            }
        }
    },

    event: {
        btnAddMetaData_click() {
            syn.uicontrols.$grid.insertRow('grdMetaData', {
                amount: parseInt(syn.$l.get('ddlAddCount').value),
            }, (row, amount) => {
                syn.uicontrols.$grid.setDataAtCell('grdMetaData', row, 1, '');
                syn.uicontrols.$grid.selectCell('grdMetaData', row, 1);
            });
        },

        btnRemoveMetaData_click() {
            syn.uicontrols.$grid.removeRow('grdMetaData');
        },

        btnSaveMetaData_click() {
            var gridID = 'grdMetaData';
            var seeds = [];
            var rowCount = syn.uicontrols.$grid.countRows(gridID);
            for (var i = 0, iLength = rowCount; i < iLength; i++) {
                var visualRow = syn.uicontrols.$grid.getPhysicalRowIndex(gridID, i);
                var item = syn.uicontrols.$grid.getSourceDataAtRow(gridID, visualRow);

                if (item.Flag != 'D') {
                    seeds.push(item);
                }
            }

            for (var i = 0, length = seeds.length; i < length; i++) {
                delete seeds[i].Flag;
            }

            syn.$l.get('txtSeedData').value = JSON.stringify(seeds);
            syn.$w.transactionAction('UD01');
        }
    },
}
