/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    /*
    open-grid (https://github.com/farmerkweon/OpenGrid, MIT License) v1.3.1 기반 HandStack 그리드 엔진 브리지.

    open-grid는 ESM 전용 라이브러리(dist가 import/export 구문)이므로, gulp concat 대상인 이 classic
    script에서는 동적 import()로 vendor/open-grid/open-grid.js를 비동기 로드해 window.OpenGrid에
    바인딩한다. 가상 스크롤·렌더링·정렬/필터·인라인 편집 등 그리드 엔진 자체의 구현은 전부 vendor 번들에
    위임하고, 이 파일은 HandStack uicontrol 관례(syn.uicontrols.$opengrid 싱글턴, columns 축약 배열
    정의, Flag(R/C/U/D) 기반 변경 추적, codehelp 팝업 연동 등)를 실제 open-grid 공개 API 위에 재배선하는
    래퍼 역할만 담당한다.

    로딩 경합 처리: engine 모듈이 아직 로드되지 않았을 때 controlLoad/setValue/clear 등 그리드를 직접
    생성·조작하는 진입점은 syn.$w.addReadyCount()/removeReadyCount()로 페이지 준비 상태를 잡아 둔 채
    __ogReady 완료 후 자기 자신을 재호출한다(다른 다수의 조회성 메서드는 getGridControl(elID)이 null을
    반환하면 기존처럼 조용히 no-op).
    */
    var __ogReady = import(/* webpackIgnore: true */ ((syn.$w && syn.$w.proxyBasePath) || '') + '/js/open-grid/open-grid.js').then(function (mod) {
        window.OpenGrid = mod.OpenGrid;
        return mod;
    }).catch(function (error) {
        if (syn.$l && syn.$l.eventLog) {
            syn.$l.eventLog('OpenGrid', 'open-grid 엔진 모듈 로드 실패: ' + error.toString(), 'Error');
        }
        throw error;
    });

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $opengrid = syn.uicontrols.$opengrid || new syn.module();

    $opengrid.extend({
        name: 'syn.uicontrols.$opengrid',
        version: 'v2026.7.5',
        gridControls: [],
        codeHelpUrl: `${syn.$w.proxyBasePath}/assets/shared/codehelp/index2.html`,
        eventHooks: ['rowClick', 'rowDoubleClick', 'selectionChange', 'cellEditEnd', 'sortChange', 'filterChange', 'dataChange'],
        defaultSetting: {
            width: '100%',
            height: '360px',
            columns: null,
            editable: true,
            rowHeight: 35,
            dynamicRowHeight: false,
            selectionMode: 'single',
            contextMenu: true,
            contextMenuTitle: null,
            contextMenuOptions: null,
            exportFileName: null,
            loadMoreDataFunction: null,
            messages: null,
            pagination: null,
            locale: null,
            dataType: 'list',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList(el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';

            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: this.name,
                type: controlType
            });
        },

        // columns 축약 정의: [columnID, columnText, width, isHidden, columnType, readOnly, alignConstants, belongID, options, children]
        getInitializeColumns(elID, columns, editable) {
            var result = [];
            if ($object.isNullOrUndefined(columns) == true) {
                return result;
            }

            var mod = window[syn.$w.pageScript];
            if (mod) {
                mod.config = mod.config || {};
                mod.config.dataSource = mod.config.dataSource || {};
            }

            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];
                if ($object.isArray(column) == true) {
                    var columnID = column[0];
                    var columnText = column[1];
                    var width = column[2];
                    var isHidden = column[3];
                    var columnType = column[4] || 'text';
                    var readOnly = column[5];
                    var alignConstants = column[6];
                    var belongID = column[7];
                    var options = column[8];
                    var children = column[9];
                    var mappedType = columnType == 'numeric' ? 'number' : columnType;
                    if (['text', 'number', 'checkbox', 'dropdown', 'codehelp'].indexOf(mappedType) == -1) {
                        mappedType = 'text';
                    }

                    var columnInfo = {
                        elID: elID,
                        field: columnID,
                        dataField: columnID,
                        headerText: $object.isNullOrUndefined(columnText) == true ? columnID : columnText,
                        width: width || null,
                        editable: $string.toBoolean(editable) == false ? false : !$string.toBoolean(readOnly),
                        columnType: mappedType,
                        hidden: $string.toBoolean(isHidden),
                        isHidden: $string.toBoolean(isHidden),
                        align: alignConstants || null,
                        belongID: $object.isNullOrUndefined(belongID) == true ? '' : ($object.isArray(belongID) == true ? belongID.join(',') : belongID)
                    };

                    if (options && $object.isObject(options) == true) {
                        for (var option in options) {
                            columnInfo[option] = options[option];
                        }
                    }

                    if (mappedType == 'checkbox') {
                        columnInfo.checkValue = $string.isNullOrEmpty(columnInfo.checkValue) == true ? '1' : columnInfo.checkValue;
                        columnInfo.unCheckValue = $string.isNullOrEmpty(columnInfo.unCheckValue) == true ? '0' : columnInfo.unCheckValue;
                    }
                    else if (mappedType == 'dropdown') {
                        columnInfo.storeSourceID = columnInfo.storeSourceID || columnInfo.dataSourceID;
                        columnInfo.keyField = columnInfo.keyField || 'CodeID';
                        columnInfo.valueField = columnInfo.valueField || 'CodeValue';
                        if (mod && columnInfo.storeSourceID) {
                            if ($object.isNullOrUndefined(mod.config.dataSource[columnInfo.storeSourceID]) == true) {
                                mod.config.dataSource[columnInfo.storeSourceID] = {
                                    CodeColumnID: columnInfo.keyField,
                                    ValueColumnID: columnInfo.valueField,
                                    DataSource: []
                                };
                                syn.$w.addReadyCount();
                                $opengrid.dataRefresh(elID, columnInfo);
                            }

                            columnInfo.optionsProvider = function () {
                                var storeSourceID = this.storeSourceID || this.dataSourceID;
                                var keyField = this.keyField || 'CodeID';
                                var valueField = this.valueField || 'CodeValue';
                                var store = mod.config && mod.config.dataSource ? mod.config.dataSource[storeSourceID] : null;
                                var dataSource = store && store.DataSource ? store.DataSource : [];
                                return dataSource.map(function (item) {
                                    return {
                                        value: item[keyField],
                                        text: item[valueField]
                                    };
                                });
                            };
                        }
                    }
                    else if (mappedType == 'codehelp') {
                        columnInfo.dataSource = columnInfo.dataSource || null;
                        columnInfo.dataSourceID = columnInfo.dataSourceID || '';
                        columnInfo.storeSourceID = columnInfo.storeSourceID || columnInfo.dataSourceID;
                        columnInfo.local = $object.isNullOrUndefined(columnInfo.local) == true ? true : columnInfo.local;
                        columnInfo.controlText = columnInfo.controlText || '';
                        columnInfo.codeColumnID = columnInfo.codeColumnID || columnID;
                        columnInfo.textColumnID = columnInfo.textColumnID || columnID;
                        columnInfo.parameters = columnInfo.parameters || '';
                    }

                    if ($object.isNullOrUndefined(children) == false && syn.$l && syn.$l.eventLog) {
                        syn.$l.eventLog('$opengrid.getInitializeColumns', 'OpenGrid는 children 컬럼을 지원하지 않아 무시합니다. columnID: ' + columnID, 'Warning');
                    }

                    result.push(columnInfo);
                }
                else {
                    result.push(column);
                }
            }

            return result;
        },

        _escapeHtml(text) {
            return String(text == null ? '' : text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        // 레거시 columnInfo(컬럼 축약 정의에서 만들어진 확장 객체) → 실제 open-grid ColumnDef 변환
        toColumnDefs(columnInfoList) {
            var result = [];
            for (var i = 0; i < (columnInfoList || []).length; i++) {
                var col = columnInfoList[i];
                var def = {
                    field: col.field,
                    header: $object.isNullOrUndefined(col.headerText) == true ? col.field : col.headerText,
                    editable: col.editable !== false
                };

                if (col.width) {
                    var widthNumber = parseInt(col.width, 10);
                    if (!isNaN(widthNumber)) {
                        def.width = widthNumber;
                    }
                }

                if (col.align == 'center' || col.align == 'right') {
                    def.align = col.align;
                }

                if (col.columnType == 'number') {
                    def.type = 'number';
                }
                else if (col.columnType == 'checkbox') {
                    def.type = 'boolean';
                    def.editor = { type: 'checkbox' };
                    def.renderer = { type: 'checkbox' };
                }
                else if (col.columnType == 'dropdown') {
                    var choices = typeof col.optionsProvider == 'function' ? col.optionsProvider.call(col) : [];
                    def.editor = { type: 'select', options: choices };
                    def.renderer = { type: 'template', templateFn: (function (list) {
                        return function (value) {
                            for (var k = 0; k < list.length; k++) {
                                if (list[k].value == value) {
                                    return '<span>' + $opengrid._escapeHtml(list[k].text) + '</span>';
                                }
                            }
                            return '<span>' + $opengrid._escapeHtml(value) + '</span>';
                        };
                    })(choices) };
                }
                else if (col.columnType == 'codehelp') {
                    def.editable = false;
                    def.renderer = { type: 'template', templateFn: function (value, row, rowIndex) {
                        return '<span class="og-codehelp-value">' + $opengrid._escapeHtml(value) + '</span>' +
                            '<button type="button" class="og-codehelp-button" data-og-codehelp-field="' + $opengrid._escapeHtml(col.field) + '" data-og-codehelp-row="' + rowIndex + '" title="' + $opengrid._escapeHtml(col.controlText || '') + '">' +
                            '<svg viewBox="0 0 24 24" width="15" height="15"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
                            '</button>';
                    } };
                }
                else {
                    def.type = 'string';
                }

                if (col.format) {
                    def.format = col.format;
                }

                result.push(def);
            }
            return result;
        },

        controlLoad(elID, setting) {
            if (!window.OpenGrid) {
                syn.$w.addReadyCount();
                __ogReady.then(function () {
                    syn.$w.removeReadyCount();
                    $opengrid.controlLoad(elID, setting);
                });
                return;
            }

            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == true) {
                return;
            }

            setting = syn.$w.argumentsExtend($opengrid.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.width = el.style.width || setting.width || '100%';
            if ($object.isNumber(setting.width) == true) {
                setting.width = setting.width + 'px';
            }

            setting.height = el.style.height || setting.height || '360px';
            if ($object.isNumber(setting.height) == true) {
                setting.height = setting.height + 'px';
            }

            var columns = $opengrid.getInitializeColumns(elID, setting.columns, setting.editable);

            el.setAttribute('id', elID + '_hidden');
            el.setAttribute('syn-options', JSON.stringify($opengrid.toSerializableSetting(setting)));
            el.style.display = 'none';

            var className = el.getAttribute('class') || '';
            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.innerHTML = `<div id="${elID}" class="syn-opengrid ${className}" style="width:${setting.width};height:${setting.height};"></div>`;
            parent.appendChild(wrapper);

            var gridSetup = {
                columns: $opengrid.toColumnDefs(columns),
                height: setting.height,
                width: setting.width,
                rowHeight: setting.rowHeight,
                autoHeight: setting.dynamicRowHeight,
                editable: setting.editable,
                selectionMode: setting.selectionMode || 'single',
                contextMenu: setting.contextMenu !== false,
                messages: setting.messages || undefined,
                locale: setting.locale || undefined
            };

            if (setting.loadMoreDataFunction || setting.contextMenuTitle || setting.contextMenuOptions) {
                syn.$l.eventLog('$opengrid.controlLoad', 'loadMoreDataFunction/contextMenuTitle/contextMenuOptions는 open-grid 재기반 이후 지원되지 않습니다(elID: ' + elID + ')', 'Warning');
            }

            // 실제 open-grid 이벤트 옵션명(onXxx)은 HandStack의 훅 이름과 다르고, 콜백 시그니처도
            // (이벤트 객체) vs (controlID, ...positional args)로 다르다. 훅 이름 → 실제 옵션명 매핑과
            // 시그니처 변환 어댑터를 함께 둔다.
            var hookAdapters = {
                rowClick: { option: 'onRowClick', adapt: function (e) { return [elID, e.rowIndex, e.row, undefined]; } },
                rowDoubleClick: { option: 'onRowDblClick', adapt: function (e) { return [elID, e.rowIndex, e.row, undefined]; } },
                selectionChange: { option: 'onSelectionChange', adapt: function (e) { return [elID, (e.rowIndexes && e.rowIndexes[0] != null) ? e.rowIndexes[0] : -1, (e.rows && e.rows[0]) || null]; } },
                cellEditEnd: { option: 'onEditEnd', adapt: function (e) { return [elID, e.rowIndex, e.field, e.oldValue, e.newValue, e.row]; } },
                sortChange: { option: 'onSortChange', adapt: function (e) { return [elID, e.field, e.dir]; } },
                filterChange: { option: 'onFilterChange', adapt: function (e) { return [elID, e.field, e.filterItems]; } },
                dataChange: { option: 'onDataChange', adapt: function (data) { return [elID, data]; } }
            };

            var gridHookEvents = el.getAttribute('syn-events') || [];
            try {
                if (gridHookEvents) {
                    gridHookEvents = eval(gridHookEvents);
                }
            } catch (error) {
                gridHookEvents = [];
                syn.$l.eventLog('OpenGrid_controlLoad', error.toString(), 'Debug');
            }

            if (mod && gridHookEvents && gridHookEvents.length > 0) {
                for (var i = 0; i < $opengrid.eventHooks.length; i++) {
                    (function (hook) {
                        if (gridHookEvents.indexOf(hook) > -1) {
                            var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                            var adapter = hookAdapters[hook];
                            if (eventHandler && adapter) {
                                gridSetup[adapter.option] = function (payload) {
                                    return eventHandler.apply(syn.$l.get(elID), adapter.adapt(payload));
                                };
                            }
                        }
                    })($opengrid.eventHooks[i]);
                }
            }

            var gridElement = syn.$l.get(elID);
            var grid = new OpenGrid(gridElement, gridSetup);

            // codehelp 컬럼 버튼은 템플릿 렌더러가 만든 정적 HTML이라, 클릭은 컨테이너에 위임해서 받는다.
            gridElement.addEventListener('click', function (e) {
                var button = e.target.closest ? e.target.closest('.og-codehelp-button') : null;
                if (!button) {
                    return;
                }
                var dataField = button.getAttribute('data-og-codehelp-field');
                var rowIndex = Number(button.getAttribute('data-og-codehelp-row'));
                var item = grid.getRowAt(rowIndex);
                $opengrid.showCodeHelpPopup(elID, rowIndex, dataField, item, item ? item[dataField] : '');
            });

            $opengrid.gridControls.push({
                id: elID,
                grid: grid,
                setting: setting,
                columnInfoList: columns
            });

            if (setting.data && setting.data.length > 0) {
                grid.setData(setting.data);
            }

            if (setting.bindingID && syn.uicontrols.$data) {
                // syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        toSerializableSetting(setting) {
            var result = {};
            for (var name in setting) {
                if (typeof setting[name] !== 'function' && name !== 'data') {
                    result[name] = setting[name];
                }
            }
            return result;
        },

        getControl(elID) {
            var result = null;
            var length = $opengrid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $opengrid.gridControls[i];
                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        getGridControl(elID) {
            var control = $opengrid.getControl(elID);
            return control ? control.grid : null;
        },

        getGridSetting(elID) {
            var control = $opengrid.getControl(elID);
            return control ? control.setting : null;
        },

        getGridID(elID) {
            elID = (elID || '').replace('_hidden', '');
            return $opengrid.getGridControl(elID) ? elID : null;
        },

        _getColumnField(elID, dataField) {
            if ($object.isNumber(dataField) == true) {
                return $opengrid.colToProp(elID, dataField);
            }
            return dataField;
        },

        // total=true: 정렬/필터를 걷어 낸 원본 전체 데이터. total=false: 현재 화면에 보이는(정렬/필터 반영) 데이터.
        _getDataItems(elID, total) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return [];
            }
            return $string.toBoolean(total) == true ? grid.getSourceRows() : grid.getData();
        },

        _getControlState(elID) {
            var control = $opengrid.getControl(elID);
            if (!control) {
                return null;
            }
            control.state = control.state || {
                properties: {},
                footer: null,
                fixedColumnCount: 0,
                fixedRowCount: 0,
                cellMerge: false,
                selectedColumnIndex: 0
            };
            return control.state;
        },

        dataRefresh(elID, setting, callback) {
            var defaultSetting = {
                dataField: null,
                required: true,
                emptyText: '전체',
                local: true,
                sharedAssetUrl: '',
                dataSourceID: null,
                storeSourceID: null,
                dataSource: null,
                parameters: null,
                deleteCache: false,
                selectedValue: null
            };

            setting = setting || {};
            setting.elID = elID;
            setting.dataField = setting.dataField || setting.field;
            setting.storeSourceID = setting.storeSourceID || setting.dataSourceID;
            setting = syn.$w.argumentsExtend(defaultSetting, setting);
            setting.sharedAssetUrl = setting.sharedAssetUrl || syn.Config.SharedAssetUrl;

            if (!(setting.dataField && setting.storeSourceID)) {
                return;
            }

            var mod = window[syn.$w.pageScript];
            if (!mod) {
                return;
            }

            mod.config = mod.config || {};
            mod.config.dataSource = mod.config.dataSource || {};

            if (mod.config.dataSource[setting.storeSourceID] && $string.toBoolean(setting.deleteCache) == true) {
                delete mod.config.dataSource[setting.storeSourceID];
            }

            if (mod.hook && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            // dropdown 컬럼의 optionsProvider가 참조하는 데이터소스가 이제 막 채워졌을 수 있으므로,
            // 단순 재렌더가 아니라 컬럼 정의를 다시 만들어(템플릿 렌더러 closure 갱신) applyColumns 한다.
            var refreshGrid = function () {
                var control = $opengrid.getControl(elID);
                if (control && control.grid && control.columnInfoList) {
                    control.grid.applyColumns($opengrid.toColumnDefs(control.columnInfoList));
                }
            };

            var dataSource = mod.config.dataSource[setting.storeSourceID];
            if (dataSource && dataSource.DataSource && dataSource.DataSource.length > 0) {
                if (callback) {
                    callback();
                }
                refreshGrid();
                syn.$w.removeReadyCount();
                return;
            }

            if (setting.local == true) {
                syn.$w.loadJson(setting.sharedAssetUrl + 'code/{0}.json'.format(setting.storeSourceID), setting, function (setting, json) {
                    if (json) {
                        if (setting.required == false) {
                            var empty = {};
                            empty[json.CodeColumnID] = '';
                            empty[json.ValueColumnID] = setting.emptyText || '';
                            json.DataSource.unshift(empty);
                        }

                        mod.config.dataSource[setting.storeSourceID] = json;
                        if (callback) {
                            callback();
                        }
                        refreshGrid();
                    }
                    syn.$w.removeReadyCount();
                }, false);
            }
            else {
                syn.$w.getDataSource(setting.dataSourceID, setting.parameters, function (json) {
                    if (json) {
                        if (setting.required == false) {
                            var empty = {};
                            empty[json.CodeColumnID] = '';
                            empty[json.ValueColumnID] = setting.emptyText || '';
                            json.DataSource.unshift(empty);
                        }

                        mod.config.dataSource[setting.storeSourceID] = json;
                        if (callback) {
                            callback();
                        }
                        refreshGrid();
                    }
                    syn.$w.removeReadyCount();
                });
            }
        },

        showCodeHelpPopup(elID, rowIndex, dataField, item, searchText) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            var columnInfo = $opengrid.getColumnInfo(elID, dataField);
            if (!columnInfo || columnInfo.columnType != 'codehelp') {
                return;
            }

            var control = $opengrid.getControl(elID);
            var isAllowEdit = (!control || control.setting.editable !== false) && columnInfo.editable !== false;
            var mod = window[syn.$w.pageScript];
            var eventHandler = isAllowEdit == true && mod && mod.event ? mod.event['{0}_{1}'.format(elID, 'cellEditBegin')] : null;
            var columnIndex = $opengrid.propToCol(elID, dataField);
            if (eventHandler) {
                var value = eventHandler({
                    elID: elID,
                    rowIndex: rowIndex,
                    columnIndex: columnIndex,
                    dataField: dataField,
                    item: item,
                    value: item ? item[dataField] : null,
                    text: searchText
                });
                isAllowEdit = $string.toBoolean(value);
            }

            if (isAllowEdit != true || !mod) {
                return;
            }

            var synOptions = syn.$w.argumentsExtend(syn.uicontrols.$codepicker.defaultSetting, columnInfo);
            var codeButtonHandler = mod.event ? mod.event['{0}_codeButtonClick'.format(elID)] : null;
            if (codeButtonHandler) {
                var codeOptions = codeButtonHandler(elID, rowIndex, columnIndex, dataField, item);
                if ($object.isObject(codeOptions) == true) {
                    synOptions = syn.$w.argumentsExtend(synOptions, codeOptions);
                }
                else if ($string.toBoolean(codeOptions) == false) {
                    return;
                }
            }

            synOptions.elID = elID;
            synOptions.viewType = 'opengrid';
            synOptions.url = $opengrid.codeHelpUrl || '';
            synOptions.searchText = searchText || (item ? item[dataField] : '') || '';
            syn.uicontrols.$codepicker.find(synOptions, function (result) {
                var changeHandler = mod.event ? mod.event['{0}_codeChange'.format(elID)] : null;
                if (changeHandler) {
                    changeHandler(elID, rowIndex, columnIndex, dataField, result);
                }

                var returnHandler = mod.hook ? mod.hook.frameEvent : null;
                if (returnHandler) {
                    returnHandler.call(this, 'codeReturn', {
                        elID: elID,
                        row: rowIndex,
                        col: columnIndex,
                        columnName: dataField,
                        result: result
                    });
                }
            });
        },

        // open-grid에는 Flag(R/C/U/D) 개념이 없다(변경 추적은 getChanges()→{added,edited,removed}).
        // HandStack 계약(item.Flag)을 유지하기 위해 행 객체에 Flag를 직접 마킹한다.
        // 주의: getSourceRows()가 돌려주는 행 참조가 getData()/getChanges()의 행 참조와 항상 동일하다고
        // 보장할 수 없어(실측 결과 참조 불일치 확인), "변경분" 판정은 getChanges()/getRemovedRows() 결과를
        // 그대로 신뢰해서 만들고, "전체 목록" 판정은 getData() 위에서 참조 매칭으로 보강한다.
        _syncFlags(grid) {
            var changes = grid.getChanges();
            var addedList = changes.added || [];
            var editedList = changes.edited || [];
            var rows = grid.getData();
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (addedList.indexOf(row) > -1) {
                    row.Flag = 'C';
                }
                else if (editedList.indexOf(row) > -1) {
                    row.Flag = 'U';
                }
                else if ($object.isNullOrUndefined(row.Flag) == true) {
                    row.Flag = 'R';
                }
            }

            // getData()가 필터로 added/edited 행을 가리는 경우까지 대비해, 참조로 못 찾은 변경분은
            // 별도로 합쳐 준다(중복 방지를 위해 rows에 이미 포함된 참조는 제외).
            var extraAdded = addedList.filter(function (row) { return rows.indexOf(row) == -1; });
            var extraEdited = editedList.filter(function (row) { return rows.indexOf(row) == -1; });
            extraAdded.forEach(function (row) { row.Flag = 'C'; });
            extraEdited.forEach(function (row) { row.Flag = 'U'; });

            var removed = (grid.getRemovedRows() || []).map(function (row) {
                var clone = $object.clone(row);
                clone.Flag = 'D';
                return clone;
            });

            return { rows: rows.concat(extraAdded).concat(extraEdited), removed: removed };
        },

        _resolveRow(grid, rowRef) {
            if ($object.isNumber(rowRef) == true) {
                return grid.getRowAt(rowRef);
            }
            return rowRef || null;
        },

        getGridData(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }

            var synced = $opengrid._syncFlags(grid);
            var result = synced.rows.map(function (item) {
                var clone = $object.clone(item);
                if ($object.isNullOrUndefined(clone.Flag) == true) {
                    clone.Flag = 'R';
                }
                return clone;
            });

            return result.concat(synced.removed);
        },

        // getSourceRows()/getData()와 무관하게 getChanges()/getRemovedRows()를 직접 신뢰해서 만든다
        // (참조 동일성에 기대지 않는 가장 안전한 경로 — 실제 변경분 판정의 정본은 getChanges()다).
        getUpdateItems(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return [];
            }

            var changes = grid.getChanges();
            var added = (changes.added || []).map(function (row) {
                row.Flag = 'C';
                return row;
            });
            var edited = (changes.edited || []).map(function (row) {
                row.Flag = 'U';
                return row;
            });
            var removed = (grid.getRemovedRows() || []).map(function (row) {
                var clone = $object.clone(row);
                clone.Flag = 'D';
                return clone;
            });

            return added.concat(edited).concat(removed);
        },

        isUpdateData(elID) {
            return $opengrid.getUpdateItems(elID).length > 0;
        },

        checkEditValue(elID) {
            return $opengrid.isUpdateData(elID);
        },

        // flag 생략/'a'/'R': 저장 완료로 간주해 전체를 기준선(setData 재적용)으로 되돌린다.
        // 그 외 특정 Flag만 골라 초기화하는 것은 open-grid의 일괄 변경추적 모델에서 지원하지 않는다.
        resetUpdatedItems(elID, flag) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            if (flag == null || flag == 'a' || flag == 'R') {
                var baseline = grid.getSourceRows().map(function (row) {
                    var clone = $object.clone(row);
                    clone.Flag = 'R';
                    return clone;
                });
                grid.setData(baseline);
                return;
            }

            syn.$l.eventLog('$opengrid.resetUpdatedItems', 'open-grid 재기반 이후 특정 Flag만 골라 초기화하는 기능은 지원하지 않습니다(elID: ' + elID + ', flag: ' + flag + ')', 'Warning');
        },

        // 참고: open-grid는 행 id를 데이터 객체 위에 노출하지 않는다(FlatRowModel 내부에서만 관리되고,
        // getChanges().added로 얻는 참조는 getData()/getRowAt()의 참조와 동일하지 않아 인덱스 역추적도
        // 안 됨을 실측으로 확인). 따라서 반환되는 신규 행 객체에는 item.id가 채워지지 않는다 — 신규 행을
        // 다시 찾아야 하면 값 기준(getRowsByValue 등)으로 조회해야 한다.
        _insertOne(grid, values, position) {
            grid.insertRow(values, (typeof position == 'string' || typeof position == 'number') ? position : 'last');
            var added = grid.getChanges().added;
            var row = added.length > 0 ? added[added.length - 1] : null;
            if (row) {
                row.Flag = 'C';
            }
            return row;
        },

        insertRow(elID, values, options) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }

            if ($object.isObject(values) == true && (values.values || values.amount || values.index || values.rowIndex)) {
                var setting = syn.$w.argumentsExtend({
                    values: {},
                    index: null,
                    rowIndex: null,
                    amount: 1
                }, values);
                var insertIndex = setting.index != null ? setting.index : setting.rowIndex;
                var position = (insertIndex == null || insertIndex == 'last') ? 'last' : insertIndex;
                var inserted = null;
                for (var i = 0; i < setting.amount; i++) {
                    inserted = $opengrid._insertOne(grid, setting.values, typeof position == 'number' ? position + i : position);
                }
                if (typeof options == 'function') {
                    options(grid.getActiveRow(), setting);
                }
                return inserted;
            }

            return $opengrid._insertOne(grid, values, options);
        },

        removeRow(elID, dataField, rowIndex, callback) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }

            var rowRef = rowIndex;
            if (arguments.length <= 2) {
                rowRef = dataField;
            }
            if ($object.isNullOrUndefined(rowRef) == true || rowRef === '') {
                rowRef = grid.getActiveRow();
            }
            if ($object.isNumber(rowRef) == false || rowRef < 0) {
                return null;
            }

            var removedRow = grid.getRowAt(rowRef);
            var removedSnapshot = removedRow ? $object.clone(removedRow) : null;
            if (removedSnapshot) {
                removedSnapshot.Flag = 'D';
            }
            grid.deleteRow(rowRef);

            var total = grid.getData().length;
            var nextIndex = Math.min(rowRef, total - 1);
            if (nextIndex > -1) {
                grid.activate(nextIndex);
            }
            if (typeof callback == 'function') {
                callback(nextIndex, $opengrid.propToCol(elID, dataField));
            }
            return removedSnapshot;
        },

        updateRow(elID, values, rowRef) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid || $object.isNullOrUndefined(values) == true) {
                return null;
            }

            var rowIndex = $object.isNumber(rowRef) == true ? rowRef : grid.getActiveRow();
            if (rowIndex == null || rowIndex < 0) {
                return null;
            }

            var patches = [];
            for (var field in values) {
                patches.push({ rowIndex: rowIndex, field: field, value: values[field] });
            }
            grid.writeCells(patches);

            var row = grid.getRowAt(rowIndex);
            if (row && row.Flag != 'C') {
                row.Flag = 'U';
            }
            return row;
        },

        appendData(elID, newData) {
            var grid = $opengrid.getGridControl(elID);
            if (grid && newData) {
                grid.pushRow(newData);
            }
        },

        // 참고: open-grid에는 필드 단위 실시간 강조 애니메이션(field-increased/decreased 등) API가
        // 없다. 값 갱신 자체는 writeCells로 재현하되, 애니메이션 강조는 지원하지 않는다.
        updateRecordData(elID, newData, options) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid || !newData) {
                return;
            }

            var list = $object.isArray(newData) == true ? newData : [newData];
            for (var i = 0; i < list.length; i++) {
                var record = list[i];
                var rowIndex = $object.isNumber(record.rowIndex) == true ? record.rowIndex : null;
                if (rowIndex == null && record.id != null) {
                    rowIndex = grid.getFlatRowModel().flatIndexOfRowId ? grid.getFlatRowModel().flatIndexOfRowId(record.id) : null;
                }
                if (rowIndex == null || rowIndex < 0) {
                    continue;
                }
                var patches = [];
                for (var field in record) {
                    if (field == 'rowIndex' || field == 'id') {
                        continue;
                    }
                    patches.push({ rowIndex: rowIndex, field: field, value: record[field] });
                }
                grid.writeCells(patches);
            }
        },

        countRows(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getData().length : 0;
        },

        getFlag(elID, rowRef) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }
            $opengrid._syncFlags(grid);
            var row = $opengrid._resolveRow(grid, rowRef);
            return row ? (row.Flag || 'R') : null;
        },

        setFlag(elID, rowRef, flag) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }
            var row = $opengrid._resolveRow(grid, rowRef);
            if (row) {
                row.Flag = flag;
            }
        },

        getCellValue(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }

            if ($object.isNumber(dataField) == true) {
                dataField = $opengrid.colToProp(elID, dataField);
            }

            return grid.readCell(rowIndex, dataField);
        },

        getDataAtCell(elID, rowIndex, dataField) {
            return $opengrid.getCellValue(elID, rowIndex, dataField);
        },

        setCellValue(elID, rowIndex, dataField, value) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                if ($object.isNumber(dataField) == true) {
                    dataField = $opengrid.colToProp(elID, dataField);
                }
                grid.writeCell(rowIndex, dataField, value);
                var row = grid.getRowAt(rowIndex);
                if (row && row.Flag != 'C') {
                    row.Flag = 'U';
                }
            }
        },

        setDataAtCell(elID, rowIndex, dataField, value) {
            $opengrid.setCellValue(elID, rowIndex, dataField, value);
        },

        getColumnValues(elID, dataField, total) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return [];
            }

            dataField = $opengrid._getColumnField(elID, dataField);
            return $opengrid._getDataItems(elID, total).map(function (item) {
                return item[dataField];
            });
        },

        propToCol(elID, dataField) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getColumnIndex(dataField) : -1;
        },

        colToProp(elID, colIndex) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }
            var field = grid.getFieldAt(colIndex);
            return $string.isNullOrEmpty(field) == true ? null : field;
        },

        getSelectedIndex(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getActiveRow() : -1;
        },

        getActiveRowIndex(elID) {
            return $opengrid.getSelectedIndex(elID);
        },

        getSelectedItem(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }
            var selections = grid.getSelections();
            return selections && selections.length > 0 ? selections[0] : null;
        },

        selectRow(elID, rowIndex) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.activate(rowIndex);
                grid.jumpToRow(rowIndex);
            }
        },

        setRowPosition(elID, rowIndex) {
            $opengrid.selectRow(elID, rowIndex);
        },

        clearSelection(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.deselect();
            }
        },

        setSorting(elID, dataField, sortDirection) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                if ($object.isArray(dataField) == true && dataField.length > 0) {
                    var sortInfo = dataField[0];
                    grid.orderBy(sortInfo.dataField || sortInfo.field, sortInfo.sortType == -1 || sortInfo.sortDirection == 'desc' ? 'desc' : 'asc');
                }
                else {
                    grid.orderBy($opengrid._getColumnField(elID, dataField), sortDirection);
                }
            }
        },

        clearSorting(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.resetOrder();
            }
        },

        // 참고: open-grid는 "전체 컬럼 대상 OR 검색"에 해당하는 API가 없다(setFilter는 컬럼별 AND
        // 조건만 지원). 완전한 재현이 불가능해 경고만 남기고 no-op 처리한다.
        searchAll(elID, term) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }
            if ($string.isNullOrEmpty(term) == false) {
                syn.$l.eventLog('$opengrid.searchAll', 'open-grid는 전체 컬럼 대상 검색을 지원하지 않습니다. search(elID, dataField, term)로 컬럼을 지정하세요(elID: ' + elID + ')', 'Warning');
            }
        },

        clearFilter(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.resetFilter();
            }
        },

        visibleColumns(elID, columns, isShow) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            if ($object.isArray(columns) == false) {
                columns = [columns];
            }

            var show = $string.toBoolean(isShow);
            for (var i = 0; i < columns.length; i++) {
                var dataField = $opengrid._getColumnField(elID, columns[i]);
                if (show) {
                    grid.showColumn(dataField);
                }
                else {
                    grid.hideColumn(dataField);
                }

                var columnInfo = $opengrid.getColumnInfo(elID, dataField);
                if (columnInfo) {
                    columnInfo.hidden = !show;
                    columnInfo.isHidden = !show;
                }
            }
        },

        isColumnHidden(elID, dataField) {
            var columnInfo = $opengrid.getColumnInfo(elID, dataField);
            return columnInfo ? columnInfo.isHidden === true : false;
        },

        // 레거시 columnInfo(축약 컬럼 정의에서 만들어진 확장 객체) 목록은 controlLoad 때 control
        // 레코드에 저장해 둔 것을 그대로 반환한다(실제 open-grid ColumnDef에는 columnType/isHidden/
        // belongID 같은 HandStack 전용 필드가 없기 때문).
        getColumnInfoList(elID) {
            var control = $opengrid.getControl(elID);
            return control ? (control.columnInfoList || []) : [];
        },

        setControlSize(elID, size) {
            var el = syn.$l.get(elID);
            if (el) {
                size = size || {};
                if (size.width) {
                    el.style.width = $object.isNumber(size.width) == true ? size.width + 'px' : size.width;
                }

                if (size.height) {
                    el.style.height = $object.isNumber(size.height) == true ? size.height + 'px' : size.height;
                }

                var grid = $opengrid.getGridControl(elID);
                if (grid) {
                    setTimeout(function () {
                        grid.resize();
                    }, 50);
                }
            }
        },

        exportFile(elID, options) {
            options = options || {};
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                var setting = $opengrid.getGridSetting(elID);
                grid.exportCsv({ filename: options.fileName || (setting && setting.exportFileName) || elID + '.csv' });
            }
        },

        hideContextMenu() {
            var length = $opengrid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var grid = $opengrid.gridControls[i].grid;
                if (grid && grid.closeContextMenu) {
                    grid.closeContextMenu();
                }
            }
        },

        contextEventHandler(evt) {
            $opengrid.hideContextMenu();
        },

        headerMenuSelectHandler(evt, ui) {
            $opengrid.hideContextMenu();
        },

        getProperty(elID, name) {
            var grid = $opengrid.getGridControl(elID);
            var setting = $opengrid.getGridSetting(elID);
            var state = $opengrid._getControlState(elID);
            if (!grid) {
                return null;
            }
            if (name in grid) {
                return grid[name];
            }
            if (setting && name in setting) {
                return setting[name];
            }
            return state && state.properties ? state.properties[name] : null;
        },

        setColumnProperty(elID, dataField, value) {
            var control = $opengrid.getControl(elID);
            if (!control || !control.grid) {
                return;
            }

            dataField = $opengrid._getColumnField(elID, dataField);
            var column = $opengrid.getColumnInfo(elID, dataField);
            if (column && value) {
                Object.assign(column, value);
                if (value.headerText || value.headerName || value.columnText) {
                    column.headerText = value.headerText || value.headerName || value.columnText;
                }
                if (value.width) {
                    column.configWidth = value.width;
                    column.width = value.width;
                }
                control.grid.applyColumns($opengrid.toColumnDefs(control.columnInfoList));
            }
        },

        // 참고: open-grid는 그리드 전체 editable/rowHeight를 생성 후 동적으로 바꾸는 공개 API가 없다
        // (editable은 컬럼별로만 조정 가능, rowHeight는 생성 시점 옵션). editable은 전체 컬럼에
        // 재적용해 재현하고, rowHeight는 경고만 남긴다.
        setProperty(elID, name, value) {
            var control = $opengrid.getControl(elID);
            var state = $opengrid._getControlState(elID);
            if (!control || !control.grid || !state) {
                return;
            }

            state.properties[name] = value;
            if (name == 'editable') {
                var editable = $string.toBoolean(value);
                control.setting.editable = editable;
                for (var i = 0; i < control.columnInfoList.length; i++) {
                    control.columnInfoList[i].editable = editable && control.columnInfoList[i].columnType != 'codehelp';
                }
                control.grid.applyColumns($opengrid.toColumnDefs(control.columnInfoList));
            }
            else if (name == 'rowHeight') {
                syn.$l.eventLog('$opengrid.setProperty', 'open-grid는 생성 이후 rowHeight 변경을 지원하지 않습니다(elID: ' + elID + ')', 'Warning');
            }
        },

        setFooter(elID, footerLayout, isChangeFooter) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.footer = footerLayout || null;
            }

            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setFooter(footerLayout || []);
            }
        },

        // open-grid의 contains 연산자는 대소문자를 구분한다(기존 대소문자 무시 검색과 다름).
        search(elID, dataField, term, options) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            if ($string.isNullOrEmpty(term) == true) {
                grid.resetFilter(dataField);
                return;
            }

            grid.setFilter(dataField, [{ operator: 'contains', value: term }]);
        },

        getColumnWidth(elID, dataField) {
            var column = $opengrid.getColumnInfo(elID, dataField);
            return column ? (column.configWidth || column.width || null) : null;
        },

        getColumnWidths(elID, isKeyValue) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            return columns.map(function (column) {
                var width = column.configWidth || column.width || null;
                return $string.toBoolean(isKeyValue) == true ? { dataField: column.dataField || column.field, width: width } : width;
            });
        },

        setColumnWidth(elID, dataField, width) {
            var item = {};
            item.width = width;
            $opengrid.setColumnProperty(elID, dataField, item);
        },

        setColumnWidths(elID, columnWidths) {
            if ($object.isArray(columnWidths) == false) {
                return;
            }

            for (var i = 0; i < columnWidths.length; i++) {
                var item = columnWidths[i];
                if ($object.isObject(item) == true) {
                    $opengrid.setColumnWidth(elID, item.dataField || item.field, item.width);
                }
                else {
                    $opengrid.setColumnWidth(elID, i, item);
                }
            }
        },

        getColumnSize(elID, dataField) {
            return $opengrid.propToCol(elID, dataField);
        },

        // 참고: open-grid는 컬럼 내용에 맞춰 폭을 자동 계산하는 API가 없다(calcColWidths/setColWidths는
        // 라이브러리 자체에서도 no-op stub). maxWidth 상한 클램프만 우리 columnInfoList 기준으로 재현한다.
        setFitColumnSize(elID, maxWidth, fitToGrid) {
            var control = $opengrid.getControl(elID);
            if (!control || !control.grid) {
                return;
            }

            syn.$l.eventLog('$opengrid.setFitColumnSize', 'open-grid는 컬럼 내용 기준 자동 맞춤을 지원하지 않습니다. maxWidth 상한만 적용합니다(elID: ' + elID + ')', 'Warning');

            if (maxWidth) {
                var changed = false;
                for (var i = 0; i < control.columnInfoList.length; i++) {
                    var column = control.columnInfoList[i];
                    var width = parseInt(column.width || '0', 10);
                    if (width > maxWidth) {
                        column.configWidth = maxWidth;
                        column.width = maxWidth;
                        changed = true;
                    }
                }
                if (changed) {
                    control.grid.applyColumns($opengrid.toColumnDefs(control.columnInfoList));
                }
            }
        },

        setCellMerge(elID, isMerged) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.cellMerge = $string.toBoolean(isMerged);
            }
        },

        setFixedColumnCount(elID, fixedCount) {
            var state = $opengrid._getControlState(elID);
            var grid = $opengrid.getGridControl(elID);
            var count = Math.max(0, Number(fixedCount) || 0);
            if (state) {
                state.fixedColumnCount = count;
            }
            if (grid) {
                grid.freeze(count);
            }
        },

        // 참고: open-grid는 행 고정(freeze rows)을 지원하지 않는다(freezeRows는 라이브러리 자체에서도
        // no-op stub). 상태만 기록하고 경고를 남긴다.
        setFixedRowCount(elID, fixedCount) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.fixedRowCount = Math.max(0, Number(fixedCount) || 0);
            }
            syn.$l.eventLog('$opengrid.setFixedRowCount', 'open-grid는 행 고정을 지원하지 않습니다(elID: ' + elID + ')', 'Warning');
        },

        getActiveColIndex(elID) {
            var state = $opengrid._getControlState(elID);
            return state ? (state.selectedColumnIndex || 0) : -1;
        },

        selectCell(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            var state = $opengrid._getControlState(elID);
            if (grid) {
                dataField = $opengrid._getColumnField(elID, dataField);
                if (state) {
                    state.selectedColumnIndex = $opengrid.propToCol(elID, dataField);
                }
                grid.activate(Number(rowIndex));
                grid.jumpToRow(Number(rowIndex));
            }
        },

        // AUIGrid 호환 조건 이름 → open-grid FilterItem.operator. between/not_*/empty류는 open-grid
        // 연산자 집합(=,!=,>,>=,<,<=,contains,startsWith,endsWith)에 없어 매핑 불가(null 반환).
        _conditionToFilterItem(name, args, args2) {
            switch (name) {
                case 'begins_with': return { operator: 'startsWith', value: args };
                case 'ends_with': return { operator: 'endsWith', value: args };
                case 'contains': return { operator: 'contains', value: args };
                case 'by_value':
                case 'eq': return { operator: '=', value: args };
                case 'neq': return { operator: '!=', value: args };
                case 'gt': return { operator: '>', value: args };
                case 'gte': return { operator: '>=', value: args };
                case 'lt': return { operator: '<', value: args };
                case 'lte': return { operator: '<=', value: args };
                default: return null;
            }
        },

        // 참고: open-grid의 setFilter(field, filterItems)는 연산자 기반 FilterItem만 받으므로,
        // 과거처럼 임의의 JS predicate 함수를 필터로 거는 것은 지원하지 않는다(감지 불가 → 경고 후 no-op).
        setFilter(elID, dataField, func) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var grid = $opengrid.getGridControl(elID);
            if (!grid || $string.isNullOrEmpty(dataField) == true) {
                return;
            }
            syn.$l.eventLog('$opengrid.setFilter', 'open-grid는 임의의 predicate 함수 필터를 지원하지 않습니다. addCondition(elID, dataField, name, args)를 사용하세요(elID: ' + elID + ', dataField: ' + dataField + ')', 'Warning');
        },

        addFilterCache(elID, dataField, value) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var grid = $opengrid.getGridControl(elID);
            if (grid && $string.isNullOrEmpty(dataField) == false) {
                grid.setFilter(dataField, [{ operator: '=', value: value }]);
            }
        },

        addCondition(elID, dataField, name, args, args2) {
            dataField = $opengrid._getColumnField(elID, dataField);
            if ($string.isNullOrEmpty(dataField) == true) {
                return;
            }

            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            var filterItem = $opengrid._conditionToFilterItem(name, args, args2);
            if (!filterItem) {
                syn.$l.eventLog('$opengrid.addCondition', 'open-grid는 "' + name + '" 조건(between/not_*/empty류)을 지원하지 않습니다(elID: ' + elID + ', dataField: ' + dataField + ')', 'Warning');
                return;
            }

            grid.setFilter(dataField, [filterItem]);
        },

        removeCondition(elID, dataField) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.resetFilter(dataField);
            }
        },

        clearConditions(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.resetFilter();
            }
        },

        render(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.resize();
            }
        },

        removeRowByRowId(elID, rowIDs) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }
            if ($object.isArray(rowIDs) == false) {
                rowIDs = [rowIDs];
            }
            var flatModel = grid.getFlatRowModel();
            for (var i = 0; i < rowIDs.length; i++) {
                var index = flatModel && flatModel.flatIndexOfRowId ? flatModel.flatIndexOfRowId(rowIDs[i]) : -1;
                if (index != null && index > -1) {
                    grid.deleteRow(index);
                }
            }
        },

        countCols(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getColumnCount() : 0;
        },

        getFirstShowColIndex(elID) {
            return $opengrid.countCols(elID) > 0 ? 0 : -1;
        },

        getLastShowColIndex(elID) {
            var count = $opengrid.countCols(elID);
            return count > 0 ? count - 1 : -1;
        },

        getSelected(elID) {
            var rowIndex = $opengrid.getSelectedIndex(elID);
            var item = $opengrid.getSelectedItem(elID);
            if (!item || rowIndex < 0) {
                return [];
            }
            return [{
                rowIndex: rowIndex,
                columnIndex: $opengrid.getActiveColIndex(elID),
                item: item
            }];
        },

        getMergeItems(elID, rowIndex, dataField) {
            var item = $opengrid.getItemByRowIndex(elID, rowIndex);
            return item ? [item] : [];
        },

        getRangeSelected(elID, rowID, colID) {
            var data = $opengrid.getSelected(elID);
            return $opengrid.getRangeIndices(data, rowID || 'rowIndex', colID || 'columnIndex');
        },

        getRangeIndices(data, rowID, colID) {
            if (!data || data.length === 0) {
                return null;
            }

            rowID = rowID || 'rowIndex';
            colID = colID || 'columnIndex';

            return data.reduce(function (range, cell, index) {
                if (index === 0) {
                    return {
                        startRowIndex: cell[rowID],
                        endRowIndex: cell[rowID],
                        startColIndex: cell[colID],
                        endColIndex: cell[colID]
                    };
                }

                return {
                    startRowIndex: Math.min(range.startRowIndex, cell[rowID]),
                    endRowIndex: Math.max(range.endRowIndex, cell[rowID]),
                    startColIndex: Math.min(range.startColIndex, cell[colID]),
                    endColIndex: Math.max(range.endColIndex, cell[colID])
                };
            }, {});
        },

        hasMerge(elID, startRowIndex, startDataField, endRowIndex, endDataField) {
            return false;
        },

        getRowPosition(elID) {
            return $opengrid.getSelectedIndex(elID);
        },

        setColumnPosition(elID, dataField) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.selectedColumnIndex = $opengrid.propToCol(elID, dataField);
            }
        },

        isCreated(elID) {
            return !!$opengrid.getGridControl(elID);
        },

        getPhysicalColText(elID, columnText) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            for (var i = 0; i < columns.length; i++) {
                if (columns[i].headerName == columnText || columns[i].headerText == columnText) {
                    return i;
                }
            }
            return -1;
        },

        unHiddenColumns(elID) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            var grid = $opengrid.getGridControl(elID);
            for (var i = 0; i < columns.length; i++) {
                columns[i].hidden = false;
                columns[i].isHidden = false;
                if (grid) {
                    grid.showColumn(columns[i].field);
                }
            }
        },

        exportToObject(elID, keyValueMode) {
            var rows = $opengrid.getGridData(elID) || [];
            return $string.toBoolean(keyValueMode) == false ? rows.map(function (item) {
                return Object.keys(item).map(function (key) {
                    return item[key];
                });
            }) : rows;
        },

        exportAsString(elID, options) {
            options = syn.$w.argumentsExtend({
                type: 'json',
                callback: null
            }, options || {});

            var rows = $opengrid.getGridData(elID) || [];
            var result = '';
            if (options.type == 'csv' || options.type == 'txt') {
                var columns = $opengrid.getColumnInfoList(elID) || [];
                var fields = columns.map(function (column) { return column.dataField || column.field; });
                result = fields.join(',') + '\n' + rows.map(function (row) {
                    return fields.map(function (field) {
                        var value = row[field] == null ? '' : String(row[field]).replace(/"/g, '""');
                        return '"' + value + '"';
                    }).join(',');
                }).join('\n');
            }
            else {
                result = JSON.stringify(rows);
            }

            if (typeof options.callback == 'function') {
                options.callback(result);
            }
            return result;
        },

        importFile(elID, callback) {
            var fileEL = syn.$l.get('{0}_ImportFile'.format(elID));
            if (!fileEL) {
                fileEL = document.createElement('input');
                fileEL.type = 'file';
                fileEL.id = '{0}_ImportFile'.format(elID);
                fileEL.style.display = 'none';
                fileEL.addEventListener('change', $opengrid.importFileLoad);
                document.body.appendChild(fileEL);
            }
            fileEL.callback = callback;
            fileEL.click();
        },

        importFileLoad(evt) {
            var el = evt.srcElement || evt.target;
            if (!el || !el.files || el.files.length == 0) {
                return;
            }

            var elID = el.id.split('_')[0];
            var fileName = el.files[0].name;
            var fileExtension = fileName.substring(fileName.lastIndexOf('.') == -1 ? fileName.length : fileName.lastIndexOf('.')).toLowerCase();
            var reader = new FileReader();
            reader.onload = function (file) {
                var result = [];
                var data = file.target.result;
                if (fileExtension == '.csv' || fileExtension == '.txt') {
                    var lines = data.split(/\r\n|\n/).filter(function (line) { return line !== ''; });
                    if (lines.length > 0) {
                        var headers = lines[0].split(',').map(function (value) { return value.replace(/^"|"$/g, ''); });
                        for (var i = 1; i < lines.length; i++) {
                            var values = lines[i].split(',');
                            var row = {};
                            for (var j = 0; j < headers.length; j++) {
                                row[headers[j]] = (values[j] || '').replace(/^"|"$/g, '').replace(/""/g, '"');
                            }
                            result.push(row);
                        }
                    }
                }
                else if (window.XLSX) {
                    var workbook = XLSX.read(data, { type: 'binary' });
                    var sheet = workbook.Sheets[workbook.SheetNames[0]];
                    result = XLSX.utils.sheet_to_json(sheet);
                }

                $opengrid.setValue(elID, result);
                if (el.callback) {
                    el.callback(result, fileName);
                }
                el.value = '';
            };

            if (fileExtension == '.csv' || fileExtension == '.txt') {
                reader.readAsText(el.files[0]);
            }
            else {
                reader.readAsBinaryString(el.files[0]);
            }
        },

        getColumnInfo(elID, dataField) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var list = $opengrid.getColumnInfoList(elID);
            for (var i = 0; i < list.length; i++) {
                if (list[i].field == dataField) {
                    return list[i];
                }
            }
            return null;
        },

        getColumnLayout(elID) {
            return $opengrid.getColumnInfoList(elID);
        },

        getDataAtCol(elID, dataField, total) {
            return $opengrid.getColumnValues(elID, dataField, total);
        },

        getSelectedItems(elID) {
            var item = $opengrid.getSelectedItem(elID);
            return item ? [item] : [];
        },

        getSelectedText(elID) {
            var item = $opengrid.getSelectedItem(elID);
            var dataField = $opengrid.colToProp(elID, $opengrid.getActiveColIndex(elID));
            return item && dataField ? item[dataField] : null;
        },

        // 참고: open-grid는 진행 중인 셀 편집을 외부에서 강제로 커밋/취소하는 공개 API가 없다.
        forceEditingComplete(elID, value, cancel) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                syn.$l.eventLog('$opengrid.forceEditingComplete', 'open-grid는 셀 편집 강제 완료/취소를 지원하지 않습니다(elID: ' + elID + ')', 'Warning');
            }
        },

        getCellFormatValue(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            dataField = $opengrid._getColumnField(elID, dataField);
            if (!grid) {
                return null;
            }
            return grid.getDisplayValue(rowIndex, dataField);
        },

        getColumnDistinctValues(elID, rowIndex, dataField) {
            var values = $opengrid.getColumnValues(elID, dataField, true) || [];
            var result = [];
            for (var i = rowIndex || 0; i < values.length; i++) {
                if (result.indexOf(values[i]) == -1) {
                    result.push(values[i]);
                }
            }
            return result;
        },

        validateGridData(elID, dataField) {
            var columns = dataField ? [$opengrid.getColumnInfo(elID, dataField)] : $opengrid.getColumnInfoList(elID);
            var rows = $opengrid._getDataItems(elID, true);
            var errors = [];
            columns = (columns || []).filter(function (column) { return !!column; });
            for (var i = 0; i < rows.length; i++) {
                for (var j = 0; j < columns.length; j++) {
                    var column = columns[j];
                    if ($string.toBoolean(column.required) == true && $string.isNullOrEmpty(rows[i][column.dataField || column.field]) == true) {
                        errors.push({ rowIndex: i, dataField: column.dataField || column.field, reason: 'required' });
                    }
                }
            }
            return errors.length > 0 ? errors : null;
        },

        setDataAtRow(elID, values) {
            if ($object.isArray(values) == false) {
                return;
            }
            for (var i = 0; i < values.length; i++) {
                var item = values[i];
                var row = item[0];
                var col = item[1];
                var value = item[2];
                $opengrid.setDataAtCell(elID, row, col, value);
            }
        },

        updateRows(elID, values, rowIndexs) {
            if ($object.isArray(values) == false) {
                return;
            }
            for (var i = 0; i < values.length; i++) {
                var rowIndex = rowIndexs && rowIndexs[i] != null ? rowIndexs[i] : i;
                $opengrid.updateRow(elID, values[i], rowIndex);
            }
        },

        updateRowBlockToValue(elID, startRowIndex, endRowIndex, dataFields, values) {
            if ($object.isArray(dataFields) == false) {
                dataFields = [dataFields];
            }
            if ($object.isArray(values) == false) {
                values = [values];
            }
            for (var rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex++) {
                var rowValues = {};
                for (var i = 0; i < dataFields.length; i++) {
                    rowValues[$opengrid._getColumnField(elID, dataFields[i])] = values[i];
                }
                $opengrid.updateRow(elID, rowValues, rowIndex);
            }
        },

        updateRowsById(elID, values) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid || $object.isArray(values) == false) {
                return;
            }
            var flatModel = grid.getFlatRowModel();
            for (var i = 0; i < values.length; i++) {
                var rowID = values[i].id || values[i]._$uid || values[i].rowId;
                var rowIndex = flatModel && flatModel.flatIndexOfRowId ? flatModel.flatIndexOfRowId(rowID) : -1;
                if (rowIndex != null && rowIndex > -1) {
                    $opengrid.updateRow(elID, values[i], rowIndex);
                }
            }
        },

        updateAllToValue(elID, dataField, value) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var rows = $opengrid._getDataItems(elID, true);
            for (var i = 0; i < rows.length; i++) {
                rows[i][dataField] = value;
                if (rows[i].Flag != 'C') {
                    rows[i].Flag = 'U';
                }
            }
            $opengrid.render(elID);
        },

        indexToRowID(elID, rowIndex) {
            var item = $opengrid.getItemByRowIndex(elID, rowIndex);
            return item ? item.id : null;
        },

        isUniqueValue(elID, dataField, value) {
            var values = $opengrid.getColumnValues(elID, dataField, true) || [];
            return values.filter(function (item) { return item == value; }).length <= 1;
        },

        getCheckedRowItems(elID) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            var checkColumn = columns.find(function (column) { return column.columnType == 'checkbox'; });
            if (!checkColumn) {
                return [];
            }
            var field = checkColumn.dataField || checkColumn.field;
            var checkValue = checkColumn.checkValue;
            return $opengrid._getDataItems(elID, true).filter(function (item) {
                return String(item[field]) == String(checkValue) || item[field] === true;
            });
        },

        getRowIndexByValue(elID, dataField, value) {
            var indexes = $opengrid.getRowIndexesByValue(elID, dataField, value);
            return indexes.length > 0 ? indexes[0] : -1;
        },

        getRowIndexesByValue(elID, dataField, value) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var rows = $opengrid._getDataItems(elID, true);
            var result = [];
            for (var i = 0; i < rows.length; i++) {
                if (rows[i][dataField] == value) {
                    result.push(i);
                }
            }
            return result;
        },

        getRowsByValue(elID, dataField, value) {
            dataField = $opengrid._getColumnField(elID, dataField);
            return $opengrid._getDataItems(elID, true).filter(function (item) {
                return item[dataField] == value;
            });
        },

        getInitValueItem(elID, RowID) {
            return $opengrid.getItemByRowID(elID, RowID);
        },

        getSourceDataAtRow(elID, rowIndex) {
            return $opengrid.getItemByRowIndex(elID, rowIndex);
        },

        getItemByRowIndex(elID, rowIndex) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? (grid.getRowAt(rowIndex) || null) : null;
        },

        getItemByRowID(elID, rowID) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }
            var flatModel = grid.getFlatRowModel();
            var rowIndex = flatModel && flatModel.flatIndexOfRowId ? flatModel.flatIndexOfRowId(rowID) : -1;
            return (rowIndex != null && rowIndex > -1) ? grid.getRowAt(rowIndex) : null;
        },

        getItemsByValue(elID, dataField, value) {
            return $opengrid.getRowsByValue(elID, dataField, value);
        },

        // columnLayout은 controlLoad와 같은 축약 배열 컬럼 정의 형식을 받는다.
        changeColumnLayout(elID, columnLayout) {
            var control = $opengrid.getControl(elID);
            if (!control || !control.grid) {
                return;
            }
            var columns = $opengrid.getInitializeColumns(elID, columnLayout || [], control.setting.editable);
            control.columnInfoList = columns;
            control.grid.applyColumns($opengrid.toColumnDefs(columns));
        },

        checkUniqueValueCol(elID, dataField, total) {
            var values = $opengrid.getColumnValues(elID, dataField, total) || [];
            return values.filter(function (row, index) { return values.indexOf(row) !== index; }).length == 0;
        },

        checkValueCountCol(elID, dataField, checkValue, total) {
            var values = $opengrid.getColumnValues(elID, dataField, total) || [];
            return values.filter(function (item) { return item === checkValue; }).length;
        },

        checkEmptyValueCol(elID, dataField, checkValue, total) {
            var values = $opengrid.getColumnValues(elID, dataField, total) || [];
            if ($object.isNullOrUndefined(checkValue) == true) {
                return values.length > 0 && values.filter(function (item) { return $string.isNullOrEmpty(item) == true; }).length > 0;
            }
            return values.filter(function (item) { return item === checkValue; }).length > 0;
        },

        checkEmptyValueCols(elID, columns, checkValue) {
            var rows = $opengrid._getDataItems(elID, true);
            for (var i = 0; i < rows.length; i++) {
                var empty = true;
                for (var j = 0; j < columns.length; j++) {
                    var value = rows[i][columns[j]];
                    if ($object.isNullOrUndefined(checkValue) == true) {
                        empty = $string.isNullOrEmpty(value) == true;
                    }
                    else {
                        empty = $string.isNullOrEmpty(value) == true || value === checkValue;
                    }
                    if (empty == false) {
                        break;
                    }
                }
                if (empty == true) {
                    return true;
                }
            }
            return false;
        },

        setTransactionBelongID(elID, belongFlow, transactConfig) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            belongFlow.items = belongFlow.items || {};
            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];
                var dataType = 'string';
                switch (column.columnType) {
                    case 'checkbox':
                        dataType = 'bool';
                        break;
                    case 'number':
                        dataType = 'number';
                        break;
                }

                var isBelong = $object.isNullOrUndefined(transactConfig) == true || column.dataField == 'Flag';
                if (isBelong == false && $string.isNullOrEmpty(column.belongID) == false) {
                    var belongIDs = String(column.belongID).split(',');
                    isBelong = belongIDs.indexOf(transactConfig.functionID) > -1;
                }

                if (isBelong == true) {
                    belongFlow.items[column.dataField || column.field] = {
                        fieldID: column.dataField || column.field,
                        dataType: dataType
                    };
                }
            }
        },

        getValue(elID, requestType, metaColumns) {
            var result = [];
            var items = [];
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return result;
            }

            if (metaColumns) {
                if (requestType == 'Row') {
                    var selectedItem = $opengrid.getSelectedItem(elID);
                    if (selectedItem) {
                        var rowFlag = selectedItem.Flag || 'C';
                        if (rowFlag && rowFlag != 'S') {
                            items.push($opengrid.mapMetaColumns(selectedItem, rowFlag, metaColumns));
                        }
                    }
                }
                else if (requestType == 'List') {
                    var updateItems = $opengrid.getUpdateItems(elID);
                    for (var i = 0, length = updateItems.length; i < length; i++) {
                        var rowData = updateItems[i];
                        var flag = rowData.Flag || 'C';
                        if (flag && flag != 'S' && flag != 'R') {
                            items.push($opengrid.mapMetaColumns(rowData, flag, metaColumns));
                        }
                    }
                }

                var length = items.length;
                for (var i = 0; i < length; i++) {
                    var item = items[i];
                    var row = [];
                    for (var key in item) {
                        row.push({ prop: key, val: item[key] });
                    }
                    result.push(row);
                }
            }
            else {
                syn.$l.eventLog('$opengrid.getValue', 'Input Mapping 설정 없음', 'Debug');
            }

            return result;
        },

        mapMetaColumns(rowData, flag, metaColumns) {
            var data = {};
            data.Flag = flag;

            for (var key in metaColumns) {
                var column = metaColumns[key];
                var rowValue = rowData[key];

                if (rowValue === undefined) {
                    data[column.fieldID] = column.dataType == 'number' ? null : $object.defaultValue(column.dataType);
                }
                else {
                    data[column.fieldID] = rowValue;
                }
            }

            return data;
        },

        setValue(elID, value, metaColumns) {
            if (!window.OpenGrid) {
                syn.$w.addReadyCount();
                __ogReady.then(function () {
                    syn.$w.removeReadyCount();
                    $opengrid.setValue(elID, value, metaColumns);
                });
                return;
            }

            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            value = value || [];
            if (value.length > 0 && $object.isNullOrUndefined(metaColumns) == false) {
                var item = value[0];
                for (var column in item) {
                    var isTypeCheck = false;
                    var metaColumn = metaColumns[column];
                    if (metaColumn) {
                        switch (metaColumn.dataType.toLowerCase()) {
                            case 'string':
                                isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isString(item[column]) || $string.isNumber(item[column]);
                                break;
                            case 'bool':
                                isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isBoolean(item[column]);
                                break;
                            case 'number':
                            case 'numeric':
                                isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $string.isNumber(item[column]) || $object.isNumber(item[column]);
                                break;
                            case 'date':
                                isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $date.isDate(item[column]);
                                break;
                            default:
                                isTypeCheck = false;
                                break;
                        }

                        if (isTypeCheck == false) {
                            syn.$l.eventLog('syn.uicontrols.$opengrid', '바인딩 데이터 타입과 매핑 정의가 다름, 바인딩 ID - "{0}", 타입 - "{1}"'.format(column, metaColumn.dataType), 'Warning');
                            return;
                        }
                    }
                    else {
                        continue;
                    }
                }
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                value[i].Flag = 'R';
            }

            grid.setData(value);
        },

        clear(elID, isControlLoad) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setData([]);
            }
        },

        // open-grid에는 번역 사전을 한 번에 주입하는 setMessages(dict)가 없다 — setMessage(key, value)
        // 단건 오버라이드만 있어 사전 키를 순회하며 재현한다.
        setLocale(elID, translations, control, options) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid || !translations) {
                return;
            }
            for (var key in translations) {
                grid.setMessage(key, translations[key]);
            }
        },

        destroy(elID) {
            var control = $opengrid.getControl(elID);
            if (control) {
                control.grid.destroy();
                var index = $opengrid.gridControls.indexOf(control);
                if (index > -1) {
                    $opengrid.gridControls.splice(index, 1);
                }
            }
        },

        // ============================================================
        // 아래는 예제 갤러리(스타일/테마, 그룹&트리, 마스킹, 워크시트, 수식,
        // 다국어, 엑셀/인쇄 내보내기)를 위해 추가한 open-grid 실제 API의 얇은 패스스루다.
        // 기존 200여개 AUIGrid 호환 메서드와 달리, 여기부터는 이름/시그니처를 open-grid
        // 공식 API 그대로 사용한다(별도의 레거시 호환 계약이 없기 때문).
        // ============================================================

        setTheme(elID, theme) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setTheme(theme);
            }
        },

        setThemeVar(elID, name, value) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setThemeVar(name, value);
            }
        },

        setSkin(elID, skin) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setSkin(skin);
            }
        },

        setSkinVar(elID, name, value) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setSkinVar(name, value);
            }
        },

        setDensity(elID, name) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setDensity(name);
            }
        },

        setTexture(elID, name) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setTexture(name);
            }
        },

        groupBy(elID, fields) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.groupBy($object.isArray(fields) == true ? fields : [fields]);
            }
        },

        clearGroup(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.clearGroup();
            }
        },

        expandAllGroups(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.expandAll();
            }
        },

        collapseAllGroups(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.collapseAll();
            }
        },

        enableTree(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.enableTree();
            }
        },

        disableTree(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.disableTree();
            }
        },

        expandAllNodes(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.expandAllNodes();
            }
        },

        collapseAllNodes(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.collapseAllNodes();
            }
        },

        setMaskEnabled(elID, dataField, enabled) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                dataField = $opengrid._getColumnField(elID, dataField);
                grid.setMaskEnabled(dataField, $string.toBoolean(enabled));
            }
        },

        getMaskEnabled(elID, dataField) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return false;
            }
            dataField = $opengrid._getColumnField(elID, dataField);
            return grid.getMaskEnabled(dataField);
        },

        // config: { columns: [{field, ...}], ... } — 상위 선택이 하위 선택지를 좁히는 캐스케이딩 필터 패널.
        // null을 넘기면 패널 제거.
        setFilterSelect(elID, config) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setFilterSelect(config || null);
            }
        },

        setGridLocale(elID, locale) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setLocale(locale);
            }
        },

        getGridLocale(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getLocale() : null;
        },

        addWorksheet(elID, name, columnLayout, data) {
            var control = $opengrid.getControl(elID);
            if (!control || !control.grid) {
                return;
            }
            var columnDefs = columnLayout ? $opengrid.toColumnDefs($opengrid.getInitializeColumns(elID, columnLayout, control.setting.editable)) : undefined;
            control.grid.addWorksheet(name, columnDefs, data || []);
        },

        switchWorksheet(elID, name) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.switchWorksheet(name);
            }
        },

        removeWorksheet(elID, name) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.removeWorksheet(name);
            }
        },

        getWorksheetNames(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getWorksheetNames() : [];
        },

        setCellFormula(elID, rowIndex, dataField, formula) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                dataField = $opengrid._getColumnField(elID, dataField);
                grid.setCellFormula(rowIndex, dataField, formula);
            }
        },

        getCellFormula(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }
            dataField = $opengrid._getColumnField(elID, dataField);
            return grid.getCellFormula(rowIndex, dataField);
        },

        clearCellFormula(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                dataField = $opengrid._getColumnField(elID, dataField);
                grid.clearCellFormula(rowIndex, dataField);
            }
        },

        getCellError(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }
            dataField = $opengrid._getColumnField(elID, dataField);
            return grid.getCellError(rowIndex, dataField);
        },

        exportExcel(elID, options) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.exportExcel(options || {});
            }
        },

        exportJson(elID, options) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.exportJson(options || {});
            }
        },

        printGrid(elID, options) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.print(options || {});
            }
        }
    });

    syn.uicontrols.$opengrid = $opengrid;
})(window);
