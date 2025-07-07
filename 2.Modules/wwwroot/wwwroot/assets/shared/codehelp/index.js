'use strict';
let $index = {
    prop: {
        gridID: 'grdCodeList',
        codeConfig: {
            dataSourceID: '',
            storeSourceID: null,
            searchValue: '',
            searchText: '',
            isMultiSelect: false,
            isAutoSearch: true,
            isOnlineData: false,
            parameters: ''
        },
    },

    hook: {
        controlInit(elID, controlOptions) {
            switch (elID) {
                case $this.prop.gridID:
                    return syn.uicontrols.$grid.getInitializeColumns({
                        columns: [
                            ['empty', '', 10, false, 'text', false, 'left']
                        ]
                    });
                    break;
            }
        },

        pageLoad() {
            var parameterID = syn.$r.query('parameterID');
            if (parent && parameterID) {
                var setting = parent[parent.syn.$w.pageScript].codePickerArguments[parameterID];

                if (setting.storeSourceID) {
                    var dataSource = null;
                    var mod = window[syn.$w.pageScript];
                    if (mod.mappingModel && mod.config.dataSource && mod.config.dataSource[setting.storeSourceID] && setting.local == true) {
                        dataSource = mod.config.dataSource[setting.storeSourceID];
                    }

                    if (dataSource) {
                        if (parent && parent.document && dataSource.Description) {
                            var popupHeader = parent.document.querySelector('h3.mt-0.mb-0');
                            popupHeader.textContent = dataSource.Description;
                        }

                        $this.prop.codeConfig = syn.$w.argumentsExtend(dataSource, $this.prop.codeConfig);
                        $this.prop.codeConfig = syn.$w.argumentsExtend($this.prop.codeConfig, setting);
                        $this.method.initialize();
                    }
                    else {
                        if (setting.local == true) {
                            syn.$w.loadJSON(syn.Config.SharedAssetUrl + 'code/{0}.json'.format(setting.dataSourceID), setting, function (setting, json) {
                                if (parent && parent.document && json.Description) {
                                    var popupHeader = parent.document.querySelector('h3.mt-0.mb-0');
                                    popupHeader.textContent = json.Description;
                                }

                                $this.prop.codeConfig = syn.$w.argumentsExtend(json, $this.prop.codeConfig);
                                $this.prop.codeConfig = syn.$w.argumentsExtend($this.prop.codeConfig, setting);
                                $this.method.initialize();
                            }, null, false);
                        }
                        else {
                            syn.$w.getDataSource(setting.dataSourceID, setting.parameters, function (json) {
                                if ($object.isNullOrUndefined(json) == false) {
                                    if (parent && parent.document && json.Description) {
                                        var popupHeader = parent.document.querySelector('h3.mt-0.mb-0');
                                        popupHeader.textContent = json.Description;
                                    }

                                    $this.prop.codeConfig = syn.$w.argumentsExtend(json, $this.prop.codeConfig);
                                    $this.prop.codeConfig = syn.$w.argumentsExtend($this.prop.codeConfig, setting);
                                    $this.method.initialize();
                                }
                                else {
                                    alert(`${setting.dataSourceID} 코드헬프 확인 필요`);
                                }
                            });
                        }
                    }
                }
            }
            else {
                alert('코드헬프 페이지는 단독으로 실행할 수 없습니다');
            }
        },
    },

    event: {
        grdCodeList_afterOnCellDoubleClick(event, coords, td) {
            var result = null;

            if (coords.row > -1) {
                var codeConfig = $this.prop.codeConfig;

                if (codeConfig.isMultiSelect == false) {
                    var physicalRowIndex = syn.uicontrols.$grid.getPhysicalRowIndex($this.prop.gridID, coords.row);
                    var item = syn.uicontrols.$grid.getSourceDataAtRow($this.prop.gridID, physicalRowIndex);
                    var code = {
                        value: item[$this.prop.codeConfig.CodeColumnID],
                        text: item[$this.prop.codeConfig.ValueColumnID]
                    };

                    var code = syn.$w.argumentsExtend(item, code);
                    delete code['Flag'];
                    result = [code];

                    $this.method.saveReturn(result);
                }
                else {
                    var physicalRowIndex = syn.uicontrols.$grid.getPhysicalRowIndex($this.prop.gridID, coords.row);
                    var item = syn.uicontrols.$grid.getSourceDataAtRow($this.prop.gridID, physicalRowIndex);
                    syn.uicontrols.$grid.setDataAtCell($this.prop.gridID, coords.row, 'IsSelect', item.IsSelect == '1' ? '0' : '1');
                }
            }
        },

        btnConfirm_click() {
            var result = null;
            var codeConfig = $this.prop.codeConfig;

            if (codeConfig.isMultiSelect == false) {
                var previousRow = syn.uicontrols.$grid.getGridValue($this.prop.gridID) == null ? -1 : syn.uicontrols.$grid.getGridValue($this.prop.gridID).previousRow;
                if (previousRow == null || previousRow == undefined) {
                    previousRow = -1;
                }

                if (previousRow > -1) {
                    var physicalRowIndex = syn.uicontrols.$grid.getPhysicalRowIndex($this.prop.gridID, previousRow);
                    var item = syn.uicontrols.$grid.getSourceDataAtRow($this.prop.gridID, physicalRowIndex);
                    var code = {
                        value: item[$this.prop.codeConfig.CodeColumnID],
                        text: item[$this.prop.codeConfig.ValueColumnID]
                    };

                    var code = syn.$w.argumentsExtend(item, code);
                    delete code['Flag'];
                    result = [code];
                }
            }
            else {
                result = [];
                var length = syn.uicontrols.$grid.countRows($this.prop.gridID);

                for (var rowIndex = 0; rowIndex < length; rowIndex++) {
                    var physicalRowIndex = syn.uicontrols.$grid.getPhysicalRowIndex($this.prop.gridID, rowIndex);
                    var item = syn.uicontrols.$grid.getSourceDataAtRow($this.prop.gridID, physicalRowIndex);
                    if (item.IsSelect == true) {
                        var code = {
                            value: item[$this.prop.codeConfig.CodeColumnID],
                            text: item[$this.prop.codeConfig.ValueColumnID]
                        };

                        var code = syn.$w.argumentsExtend(item, code);
                        delete code['Flag'];
                        delete code['IsSelect'];
                        result.push(code);
                    }
                }
            }

            $this.method.saveReturn(result);
        },

        btnSearch_click() {
            $this.method.search();
        },

        txtSearch_keydown(keyboardEvent) {
            if (keyboardEvent.keyCode == 13) {
                $this.method.search();
                keyboardEvent.preventDefault();
            }
        },
    },

    method: {
        search() {
            var searchType = syn.uicontrols.$select.getValue('ddlSearchType');
            var search = syn.$l.get('txtSearch').value.trim();

            if (search == '') {
                syn.uicontrols.$grid.loadData($this.prop.gridID, $this.prop.codeConfig.DataSource);
            }
            else {
                var items = $this.prop.codeConfig.DataSource.filter(function (item) {
                    return (item[$this.prop.codeConfig.CodeColumnID].toString().indexOf(search) > -1 || item[$this.prop.codeConfig.ValueColumnID].toString().indexOf(search) > -1);
                });

                syn.uicontrols.$grid.loadData($this.prop.gridID, items);
            }

            var settings = syn.uicontrols.$grid.getSettings($this.prop.gridID);
            var hot = syn.uicontrols.$grid.getGridControl($this.prop.gridID);
            var plugin = hot.getPlugin('autoColumnSize');

            if (plugin.isEnabled() == false) {
                plugin.enablePlugin();
            }

            plugin.recalculateAllColumnsWidth();
            setTimeout(function () {
                if (plugin.widths) {
                    settings.colWidths = plugin.widths;
                    syn.uicontrols.$grid.updateSettings($this.prop.gridID, settings);
                }
            }, 25);
        },

        saveReturn(result) {
            if (parent) {
                parent.syn.$w.closeDialog(result);
            }
        },

        initialize() {
            var columns = [];
            var codeConfig = $this.prop.codeConfig;
            var scheme = codeConfig.Scheme;

            if (codeConfig.isMultiSelect == true) {
                columns.push(['IsSelect', '선택', 54, false, 'checkbox', false, 'center']);

                var items = $this.prop.codeConfig.DataSource;
                var length = items.length;
                for (var i = 0; i < length; i++) {
                    var item = items[i];
                    item.IsSelect = 0;
                }
            }

            var length = scheme.length;
            for (var i = 0; i < length; i++) {
                var item = scheme[i];
                columns.push([item.ColumnID, item.ColumnText, 100, $string.toBoolean(item.HiddenYN), 'text', true, 'left']);
            }

            var settings = syn.uicontrols.$grid.getInitializeColumns({ columns: columns });
            settings.colHeaders.unshift('Flag');
            settings.columns.unshift({
                data: 'Flag',
                type: 'text'
            });
            settings.colWidths.unshift(10);
            settings.autoColumnSize = true;
            settings.stretchH = 'all';

            syn.uicontrols.$grid.updateSettings($this.prop.gridID, settings);

            if (codeConfig.isAutoSearch == true) {
                if (codeConfig.searchValue == '' && codeConfig.searchText != '') {
                    syn.$l.get('ddlSearchType').value = '2';
                    syn.$l.get('txtSearch').value = codeConfig.searchText;
                }
                else if (codeConfig.searchValue != '' && codeConfig.searchText == '') {
                    syn.$l.get('ddlSearchType').value = '1';
                    syn.$l.get('txtSearch').value = codeConfig.searchValue;
                }

                $this.method.search();

                if (codeConfig.isMultiSelect == false) {
                    var count = syn.uicontrols.$grid.countRows($this.prop.gridID);
                    if (count == 1) {
                        var item = syn.uicontrols.$grid.getSourceDataAtRow($this.prop.gridID, 0);

                        var result = null;
                        var codeData = item[codeConfig.CodeColumnID];
                        var valueData = item[codeConfig.ValueColumnID];
                        if (codeData && valueData) {
                            result = [{
                                value: codeData,
                                text: valueData
                            }];
                        }
                        else {
                            syn.$l.eventLog('$codehelp.initialize', 'CodeID: {0} 또는 ValueID: {1} 확인 필요'.format(codeConfig.CodeColumnID, codeConfig.ValueColumnID), 'Error');
                        }

                        $this.method.saveReturn(result);
                    }
                }
                else {
                    var count = syn.uicontrols.$grid.countRows($this.prop.gridID);
                    if (0 < count) {
                        if (syn.$l.get('ddlSearchType').value == '1') {
                            var searchItems = codeConfig.searchValue.split(',');
                            for (var i = 0; i < count; i++) {
                                var item = syn.uicontrols.$grid.getSourceDataAtRow($this.prop.gridID, i);
                                var codeData = item[codeConfig.CodeColumnID];
                                if (codeData) {
                                    if (searchItems.includes(item[codeConfig.CodeColumnID].toString()) == true) {
                                        syn.uicontrols.$grid.setDataAtCell($this.prop.gridID, i, 'IsSelect', '1');
                                    }
                                }
                                else {
                                    syn.$l.eventLog('$codehelp.initialize', 'CodeID: {0} 확인 필요'.format(codeConfig.CodeColumnID), 'Error');
                                }
                            }
                        }
                        else {
                            var searchItems = codeConfig.searchText.split(',');
                            for (var i = 0; i < count; i++) {
                                var item = syn.uicontrols.$grid.getSourceDataAtRow($this.prop.gridID, i);
                                var valueData = item[codeConfig.ValueColumnID];
                                if (valueData) {
                                    if (searchItems.includes(item[codeConfig.ValueColumnID].toString()) == true) {
                                        syn.uicontrols.$grid.setDataAtCell($this.prop.gridID, i, 'IsSelect', '1');
                                    }
                                }
                                else {
                                    syn.$l.eventLog('$codehelp.initialize', 'ValueID: {0} 확인 필요'.format(codeConfig.ValueColumnID), 'Error');
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
