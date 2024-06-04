/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    if (window.Handsontable) {
        var textEditor = Handsontable.editors.TextEditor.prototype.extend();

        Handsontable.validators.registerValidator('require', function (query, callback) {
            var result = false;
            if ($string.isNullOrEmpty(query) == true) {
                result = false;
            } else {
                result = true;
            }
            if (callback) {
                callback(result);
            }
            return result;
        });


        Handsontable.cellTypes.registerCellType('codehelp', {
            editor: textEditor,
            renderer(instance, td, row, column, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                var button;
                var label;

                label = document.createElement('SPAN');
                label.textContent = value;

                button = document.createElement('BUTTON');
                syn.$m.addCssText(button, 'height: 21px;;');
                syn.$m.addClass(button, 'btn w:21px mt:1px float:right');
                button.tag = [instance, td, row, column, prop, value, cellProperties];
                button.innerHTML = '<i class="ti ti-search"></i>';

                Handsontable.dom.addEvent(button, 'click', function (evt) {
                    evt.preventDefault();

                    var el = evt.currentTarget;
                    var hot = el.tag[0];
                    var row = el.tag[2];
                    var col = el.tag[3];
                    var columnName = el.tag[4];

                    var columnInfos = hot.getSettings().columns;
                    var columnInfo = columnInfos.filter(function (item) { return item.data == columnName; })[0];

                    var elID = hot.rootElement.id;
                    var synOptions = syn.$w.argumentsExtend(syn.uicontrols.$codepicker.defaultSetting, columnInfo);
                    synOptions.elID = elID;
                    synOptions.controlType = 'grid';

                    syn.uicontrols.$codepicker.find(synOptions, function (result) {
                        if (result && columnInfo.codeColumnID && columnInfo.textColumnID) {
                            var gridValue = [];
                            gridValue.push([row, hot.propToCol(columnInfo.codeColumnID), result[0].value]);
                            gridValue.push([row, col, result[0].text]);
                            hot.setDataAtCell(gridValue);
                        }

                        var mod = window[syn.$w.pageScript];

                        var returnHandler = mod.hook.frameEvent;
                        if (returnHandler) {
                            returnHandler.call(this, 'codeReturn', {
                                elID: elID,
                                row: row,
                                col: col,
                                columnName: columnName,
                                result: result
                            });
                        }
                    });
                });

                Handsontable.dom.empty(td);
                td.appendChild(button);
                td.appendChild(label);

                if (cellProperties && cellProperties.className) {
                    var classNames = cellProperties.className.split(' ');
                    for (var i = 0; i < classNames.length; i++) {
                        var className = classNames[i];
                        if (className != '') {
                            syn.$m.addClass(td, className);
                        }
                    }
                }

                return td;
            },
            validator(query, callback) {
                callback(true);
            },
            allowInvalid: true
        });

        Handsontable.cellTypes.registerCellType('button', {
            renderer(instance, td, row, column, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                if ($string.isNullOrEmpty(value) == false) {
                    var columnOptions = instance.getSettings().columns[column].columnOptions;
                    var button = document.createElement('BUTTON');
                    button.classList.add('celltype');

                    if (columnOptions) {
                        if (columnOptions.clearBorder == true) {
                            button.style.border = '0px';
                            button.style.backgroundColor = 'transparent';
                            button.style.textDecoration = 'underline';
                        }

                        if (columnOptions.color) {
                            button.style.color = columnOptions.color;
                        }

                        if (columnOptions.bold == true) {
                            button.style.fontWeight = '900';
                        }
                    }

                    if (value.indexOf && value.indexOf('|') > -1) {
                        var values = value.split('|');
                        var classLists = values[0];
                        if (classLists.split(' ').length > 1) {
                            var classValues = classLists.split(' ');
                            for (var key in classValues) {
                                button.classList.add(classValues[key]);
                            }
                        }
                        else {
                            button.classList.add(classLists);
                        }

                        value = values[1];
                    }

                    button.tag = [instance, td, row, column, prop, value, cellProperties];
                    button.setAttribute('data', value);
                    button.textContent = (columnOptions && $string.toBoolean(columnOptions.toCurrency) == true) ? $string.toCurrency(value) : value;

                    syn.$l.addEvent(button, 'click', function (evt) {
                        evt.preventDefault();

                        var el = event.target || event.srcElement;
                        var mod = window[syn.$w.pageScript];
                        var eventHandler = mod.event['{0}_cellButtonClick'.format(instance.rootElement.id)];
                        if (eventHandler) {
                            eventHandler.apply(el, [instance.rootElement.id, row, column, prop, value]);
                        }
                    });

                    Handsontable.dom.empty(td);
                    td.appendChild(button);

                    if (cellProperties && cellProperties.className) {
                        var classNames = cellProperties.className.split(' ');
                        for (var i = 0; i < classNames.length; i++) {
                            var className = classNames[i];
                            if (className != '') {
                                syn.$m.addClass(td, className);
                            }
                        }
                    }
                }

                return td;
            },
            validator(query, callback) {
                callback(true);
            },
            allowInvalid: true
        });

        Handsontable.cellTypes.registerCellType('safehtml', {
            editor: textEditor,
            renderer(instance, td, row, column, prop, value, cellProperties) {
                var escaped = Handsontable.helper.stringify(value);

                var stripTags = function (input, allowed) {
                    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
                        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;

                    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');

                    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
                        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
                    });
                };

                escaped = stripTags(escaped, '<em><p><br><b><u><strong><a><big><img>');
                td.innerHTML = escaped;

                if (cellProperties && cellProperties.className) {
                    var classNames = cellProperties.className.split(' ');
                    for (var i = 0; i < classNames.length; i++) {
                        var className = classNames[i];
                        if (className != '') {
                            syn.$m.addClass(td, className);
                        }
                    }
                }

                return td;
            },
            validator(query, callback) {
                callback(true);
            },
            allowInvalid: true
        });

        Handsontable.cellTypes.registerCellType('image', {
            editor: textEditor,
            renderer(instance, td, row, column, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                var escaped = Handsontable.helper.stringify(value),
                    img;

                if (escaped.indexOf('http') === 0) {
                    img = document.createElement('IMG');
                    img.src = value;

                    Handsontable.dom.addEvent(img, 'click', function (e) {
                        e.preventDefault();
                    });

                    Handsontable.dom.empty(td);
                    td.appendChild(img);
                } else {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                }

                if (cellProperties && cellProperties.className) {
                    var classNames = cellProperties.className.split(' ');
                    for (var i = 0; i < classNames.length; i++) {
                        var className = classNames[i];
                        if (className != '') {
                            syn.$m.addClass(td, className);
                        }
                    }
                }

                return td;
            },
            validator(query, callback) {
                callback(true);
            },
            allowInvalid: true
        });

        Handsontable.cellTypes.registerCellType('radio', {
            renderer(instance, td, row, column, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                var inputID = 'rdo_{0}_{1}_{2}'.format(instance.rootElement.id, row, column);
                var input = document.createElement('INPUT');
                input.id = inputID;
                input.type = 'radio';
                syn.$m.addClass(input, 'form-check-input');

                if (value) {
                    if ($string.toBoolean(value) === true) {
                        input.checked = true;
                    }
                    else {
                        input.checked = false;
                    }
                }

                Handsontable.dom.addEvent(input, 'click', function (evt) {
                    evt.preventDefault();

                    var el = evt.target || evt.srcElement;
                    var mod = window[syn.$w.pageScript];
                    var gridSettings = instance.getSettings();
                    var readonly = gridSettings.columns[column].readOnly;
                    var cellMeta = instance.getCellMeta(row, column);
                    if (readonly === false && cellMeta.readOnly == false) {
                        if (gridSettings.data && gridSettings.data.length > 0) {
                            var data = gridSettings.data;
                            var length = data.length;
                            for (var i = 0; i < length; i++) {
                                if ($string.toBoolean(data[i][prop]) == true) {
                                    if (data[i]['Flag'] == 'R') {
                                        data[i]['Flag'] = 'U';
                                    }

                                    data[i][prop] = 0;
                                    var radio = syn.$l.get('rdo_{0}_{1}_{2}'.format(instance.rootElement.id, i, column));
                                    if (radio) {
                                        radio.checked = false;
                                    }
                                }
                            }
                        }

                        instance.setDataAtCell(row, column, (el.checked === true ? '1' : '0'));

                        var eventHandler = mod.event['{0}_cellRadioClick'.format(instance.rootElement.id)];
                        if (eventHandler) {
                            eventHandler.apply(el, [instance.rootElement.id, row, column, prop, (el.checked === true ? '1' : '0')]);
                        }
                        instance.render();
                    }
                });

                Handsontable.dom.empty(td);
                td.appendChild(input);

                if (cellProperties && cellProperties.className) {
                    var classNames = cellProperties.className.split(' ');
                    for (var i = 0; i < classNames.length; i++) {
                        var className = classNames[i];
                        if (className != '') {
                            syn.$m.addClass(td, className);
                        }
                    }
                }

                return td;
            },
            validator(query, callback) {
                callback(true);
            },
            allowInvalid: true
        });

        Handsontable.cellTypes.registerCellType('checkbox2', {
            renderer(instance, td, row, column, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                var inputID = 'chk_syngrid_{0}_{1}_{2}'.format(instance.rootElement.id, row, column);
                var input = document.createElement('INPUT');
                input.id = inputID;
                input.type = 'checkbox';
                syn.$m.addClass(input, 'form-check-input');

                if (value) {
                    if ($string.toBoolean(value) === true) {
                        input.checked = true;
                    }
                    else {
                        input.checked = false;
                    }
                }

                Handsontable.dom.addEvent(input, 'click', function (evt) {
                    evt.preventDefault();

                    var el = evt.target || evt.srcElement;
                    var mod = window[syn.$w.pageScript];
                    var readonly = instance.getSettings().columns[column].readOnly;

                    var cellMeta = instance.getCellMeta(row, column);
                    if (readonly == false || cellMeta.readOnly == false) {
                        instance.setDataAtCell(row, column, (el.checked === true ? '1' : '0'));

                        var eventHandler = mod.event['{0}_cellCheckboxClick'.format(instance.rootElement.id)];
                        if (eventHandler) {
                            eventHandler.apply(el, [instance.rootElement.id, row, column, prop, (el.checked === true ? '1' : '0')]);
                        }
                    }
                });

                Handsontable.dom.empty(td);
                td.appendChild(input);

                if (cellProperties && cellProperties.className) {
                    var classNames = cellProperties.className.split(' ');
                    for (var i = 0; i < classNames.length; i++) {
                        var className = classNames[i];
                        if (className != '') {
                            syn.$m.addClass(td, className);
                        }
                    }
                }

                return td;
            },
            validator(query, callback) {
                callback(true);
            },
            allowInvalid: true
        });
    }

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $grid = syn.uicontrols.$grid || new syn.module();

    $grid.extend({
        name: 'syn.uicontrols.$grid',
        version: '1.0.0',
        defaultHotSettings: {
            licenseKey: 'non-commercial-and-evaluation',
            language: 'ko-KR',
            locale: 'ko-KR',
            imeFastEdit: true,
            data: [],
            colWidths: 120,
            rowHeights: 31,
            rowHeaders: true,
            copyPaste: true,
            beforePaste(data, coords) {
                return false;
            },
            autoColumnSize: false,
            stretchH: 'none',
            undo: false,
            observeChanges: false,
            observeDOMVisibility: true,
            currentRowClassName: 'currentRow',
            manualColumnResize: true,
            manualRowResize: false,
            manualColumnMove: false,
            manualRowMove: false,
            manualColumnFreeze: false,
            autoInsertRow: false,
            isRemoveRowHidden: true,
            autoWrapRow: true,
            outsideClickDeselects: true,
            selectionMode: 'range',
            sortIndicator: false,
            columnSorting: true,
            wordWrap: false,
            dropdownMenu: false,
            filters: true,
            isContainFilterHeader: false,
            firstShowColIndex: null,
            lastShowColIndex: null,
            fillHandle: false,
            contextMenu: {
                items: {
                    "copy": {
                        name: '내용복사'
                    },
                    "hidden_columns_hide": {
                        name: '컬럼 숨김',
                        callback(key, selection, clickEvent) {
                            if (selection && selection.length > 0) {
                                var range = selection[0];
                                var startIndex = range.start.col;
                                var endIndex = range.end.col;
                                var targetColumns = [];

                                for (startIndex; startIndex <= endIndex; startIndex++) {
                                    targetColumns.push(startIndex);
                                }

                                $grid.visibleColumns(this.rootElement.id, targetColumns, false);

                                var mod = window[syn.$w.pageScript];
                                if (mod) {
                                    var eventHandler = mod.event ? mod.event['{0}_{1}'.format(this.rootElement.id, 'afterHiddenColumns')] : null;
                                    if (eventHandler) {
                                        eventHandler.apply(syn.$l.get(this.rootElement.id), [targetColumns]);
                                    }
                                }
                            }
                        }
                    },
                    "hidden_columns_show": {
                        name: '컬럼 표시',
                        callback(key, selection, clickEvent) {
                            if (selection && selection.length > 0) {
                                var range = selection[0];
                                var startIndex = range.start.col;
                                var endIndex = range.end.col;
                                var targetColumns = [];

                                for (startIndex; startIndex <= endIndex; startIndex++) {
                                    targetColumns.push(startIndex);
                                }

                                $grid.visibleColumns(this.rootElement.id, targetColumns, true);

                                var mod = window[syn.$w.pageScript];
                                if (mod) {
                                    var eventHandler = mod.event ? mod.event['{0}_{1}'.format(this.rootElement.id, 'afterUnHiddenColumns')] : null;
                                    if (eventHandler) {
                                        eventHandler.apply(syn.$l.get(this.rootElement.id), targetColumns);
                                    }
                                }
                            }
                        }
                    },
                    "columns_chooser": {
                        name: '컬럼 표시 선택',
                        callback(key, selection, clickEvent) {
                            var hot = this;
                            var elID = this.rootElement.id;
                            var dialogOptions = $object.clone(syn.$w.dialogOptions);
                            dialogOptions.minWidth = 240;
                            dialogOptions.minHeight = 240;

                            var columnChooler = syn.$l.get('columnChooserHtml');
                            if (!columnChooler) {
                                var wrapper = syn.$m.create({
                                    tag: 'div',
                                    id: 'columnChooserHtml'
                                });
                                wrapper.style.display = 'none';
                                wrapper.innerHTML = '<h3 class="mt-0 mb-0">컬럼 표시 선택</h3><div class="btn-area"><input type="button" id="btnColumnApply" class="btn btn-primary" value="컬럼 표시 적용"></div><ul class="row" id="lstChooseColumns" style = "overflow: auto; height: 150px; width:360px; padding-top:10px; padding-left:10px;" > <li><input type="checkbox" id="a"><label for="a">컬럼명</label></li></ul>';
                                document.body.appendChild(wrapper);
                                columnChooler = syn.$l.get('columnChooserHtml');
                            }

                            Handsontable.dom.addEvent(columnChooler.querySelector('#btnColumnApply'), 'click', function () {
                                var result = [];
                                var liELs = syn.$l.get('lstChooseColumns').children;
                                for (var i = 0; i < liELs.length; i++) {
                                    var liEL = liELs[i];
                                    var columnID = liEL.children[0].id.split('_')[2];
                                    var isHidden = !liEL.children[0].checked;
                                    result.push({
                                        col: i,
                                        colID: columnID,
                                        isHidden: isHidden
                                    });
                                }
                                syn.$w.closeDialog(result);
                            });

                            var ulEL = columnChooler.querySelector('ul');
                            ulEL.innerHTML = '';

                            var gridSettings = hot.getSettings();
                            var colHeaders = hot.getSettings().colHeaders;
                            var gridColumns = gridSettings.columns;
                            for (var i = 1; i < gridColumns.length; i++) {
                                var colHeader = colHeaders[i];
                                var gridColumn = gridColumns[i];

                                var liEL = document.createElement('li');
                                var liEL = syn.$m.create({ tag: 'li', className: 'col-12' });
                                syn.$m.setStyle(liEL, 'padding-top', '10px');
                                var checkboxID = '{0}_checkbox_{1}'.format(elID, gridColumn.data);
                                var isHidden = $grid.isColumnHidden(elID, i);
                                var checkEL = syn.$m.create({ tag: 'input', id: checkboxID, attributes: { type: 'checkbox' } });
                                checkEL.checked = !isHidden;
                                var labelEL = syn.$m.create({ tag: 'label', id: '{0}_label_{1}'.format(elID, gridColumn.data), attributes: { for: checkboxID } });
                                syn.$m.setStyle(labelEL, 'padding-left', '10px');
                                labelEL.textContent = colHeader;

                                syn.$m.appendChild(liEL, checkEL);
                                syn.$m.appendChild(liEL, labelEL);
                                syn.$m.appendChild(ulEL, liEL);
                            }

                            syn.$w.showDialog(syn.$l.get('columnChooserHtml'), dialogOptions, function (result) {
                                if (result) {
                                    var showColumns = [];
                                    var hideColumns = [];
                                    for (var i = 1; i < gridColumns.length; i++) {
                                        var item = result[i - 1];
                                        if (item) {
                                            if (item.isHidden == false) {
                                                showColumns.push(i);
                                            }
                                            else {
                                                hideColumns.push(i)
                                            }
                                        }
                                    }

                                    $grid.visibleColumns(elID, showColumns, true);
                                    $grid.visibleColumns(elID, hideColumns, false);

                                    var mod = window[syn.$w.pageScript];
                                    if (mod) {
                                        var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, 'afterVisibleColumns')] : null;
                                        if (eventHandler) {
                                            eventHandler.apply(syn.$l.get(elID), showColumns, hideColumns);
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            },
            hiddenColumns: {
                columns: [0],
                indicators: false
            },
            deleteKeyColumns: [],
            keyLockedColumns: [],
            summarys: [],
            exportColumns: [],
            transactConfig: null,
            triggerConfig: null
        },
        gridControls: [],
        handsontableHooks: null,
        gridHooks: [],
        gridCodeDatas: [],

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

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend($grid.defaultHotSettings, setting);

            if (setting.columns) {
                var moduleHotSettings = $grid.getInitializeColumns(setting, elID);
                setting = syn.$w.argumentsExtend(setting, moduleHotSettings);
            }

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleHotSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleHotSettings);
            }

            setting.elementID = elID;
            setting.colHeaders = setting.colHeaders || ['Flag', 'A', 'B', 'C'];
            if (setting.colHeaders.indexOf('Flag') == -1) {
                setting.colHeaders.unshift('Flag');
                setting.colWidths.unshift(10);
            }

            setting.columns = setting.columns || [{ data: 0 }, { data: 1 }, { data: 2 }, { data: 3 }];
            var isFlagColumn = false;
            var columnCount = setting.columns.length;
            for (var i = 0; i < columnCount; i++) {
                var column = setting.columns[i];
                if (column.data == 'Flag') {
                    isFlagColumn = true;
                    break;
                }
            }

            if (isFlagColumn == false) {
                setting.columns.unshift({
                    data: 'Flag',
                    type: 'text',
                    readOnly: true
                });
            }

            if (setting.dropdownMenu === true) {
                setting.dropdownMenu = ['filter_by_condition', 'filter_operators', 'filter_by_condition2', 'filter_action_bar'];
            }
            else {
                setting.dropdownMenu = false;
            }

            var debounceFn = Handsontable.helper.debounce(function (colIndex, event) {
                var el = (event.target || event.srcElement);
                colIndex = $grid.getActiveColIndex(el.gridID);
                var hot = $grid.getGridControl(el.gridID);
                var filtersPlugin = hot.getPlugin('filters');

                if (filtersPlugin.isEnabled() == false) {
                    filtersPlugin.enablePlugin();
                }

                filtersPlugin.clearConditions(colIndex);

                if (event.target.value.length > 0) {
                    filtersPlugin.addCondition(colIndex, 'contains', [event.target.value]);
                }
                filtersPlugin.filter();
            }, 100);

            var isSummary = false;
            if (setting.summarys && setting.summarys.length > 0) {
                isSummary = true;
                setting.fixedRowsBottom = 1;
                setting.cells = function (row, column, prop) {
                    var hot = this.instance;

                    var gridValue = $grid.getGridValue(hot.elID);
                    if (gridValue.applyCells == true) {
                        var gridSettings = hot.getSettings();
                        if (gridSettings.summarys && gridSettings.summarys.length > 0) {
                            var lastRowIndex = gridSettings.data.length - 1;
                            if (row === lastRowIndex) {
                                var cellProperties = {};

                                // 고정 행 모든 컬럼 cell 타입을 text로 변경
                                cellProperties.type = 'text';
                                cellProperties.readOnly = true;
                                cellProperties.className = 'summaryRow';

                                var summaryColumn = gridSettings.columns.find(function (item) { return item.data == prop });
                                if (summaryColumn && summaryColumn.className && summaryColumn.className.indexOf(cellProperties.className) == -1) {
                                    cellProperties.className += ' ' + summaryColumn.className;
                                }

                                return cellProperties;
                            }
                        }
                    }

                    var mod = window[syn.$w.pageScript];
                    if (mod) {
                        var eventHandler = mod.event['{0}_applyCells'.format(hot.elID)];
                        if (eventHandler) {
                            var cellProperties = eventHandler.apply(hot, [hot.elID, row, column, prop]);
                            if (cellProperties) {
                                return cellProperties;
                            }
                        }
                    }
                };
            }
            else {
                setting.cells = function (row, column, prop) {
                    var mod = window[syn.$w.pageScript];
                    if (mod) {
                        var hot = this.instance;
                        var eventHandler = mod.event['{0}_applyCells'.format(hot.elID)];
                        if (eventHandler) {
                            var cellProperties = eventHandler.apply(hot, [hot.elID, row, column, prop]);
                            if (cellProperties) {
                                return cellProperties;
                            }
                        }
                    }
                };
            }

            setting.beforeColumnSort = function (currentSortConfig, destinationSortConfigs) {
                var hot = this;
                var gridSettings = hot.getSettings();
                if (gridSettings.summarys && gridSettings.summarys.length > 0) {
                    var gridValue = $grid.getGridValue(hot.elID);
                    gridValue.applyCells = false;

                    var gridSettings = hot.getSettings();
                    var itemToFind = gridSettings.data.find(function (item) { return item['Flag'] == 'S' });
                    if (itemToFind) {
                        var rowIndex = gridSettings.data.indexOf(itemToFind);
                        if (rowIndex > -1) {
                            gridSettings.data.splice(rowIndex, 1);
                        }
                    }
                }
            }

            setting.afterColumnSort = function (currentSortConfig, destinationSortConfigs) {
                var hot = this;
                var gridSettings = hot.getSettings();
                if (gridSettings.summarys && gridSettings.summarys.length > 0) {
                    $grid.renderSummary(hot);
                }
            };

            setting.afterGetColHeader = function (col, TH) {
                if (typeof col !== 'number') {
                    return col;
                }

                if (col >= 0 && setting.isContainFilterHeader == true && TH.childElementCount < 2) {
                    var div = document.createElement('div');
                    var input = document.createElement('input');

                    div.className = 'filterHeader';
                    input.gridID = elID;

                    Handsontable.dom.addEvent(input, 'contextmenu', function (evt) {
                        Handsontable.dom.stopImmediatePropagation(evt);
                        if (evt.preventDefault) {
                            evt.preventDefault();
                        }

                        return false;
                    });

                    Handsontable.dom.addEvent(input, 'keydown', function (evt) {
                        debounceFn(col, evt);
                    });

                    Handsontable.dom.addEvent(input, 'focus', function (evt) {
                        var mod = window[syn.$w.pageScript];
                        if (mod) {
                            mod.prop.focusControl = syn.$l.get(input.gridID);
                        }
                    });

                    div.appendChild(input);
                    TH.appendChild(div);
                }

                var childElementCount = $object.isArray(setting.dropdownMenu) == true ? 3 : 2;
                var column = setting.columns[col];
                if (column && column.isSelectAll === true) {
                    childElementCount = childElementCount + 2;
                }

                if (col >= 0 && column && (column.type == 'checkbox' || column.type == 'checkbox2') && column.isSelectAll === true && TH.firstElementChild.childElementCount < childElementCount) {
                    if (TH.firstElementChild.childElementCount != 3 && syn.$m.hasClass(TH, 'hiddenHeader') == false) {
                        var inputID = 'chk_syngrid_All_{0}_{1}'.format(elID, col);
                        if (syn.$l.get(inputID) != null) {
                            syn.$m.remove(syn.$l.get(inputID));
                            syn.$m.remove(syn.$l.querySelector('label[for="' + inputID + '"]'));
                        }
                        var input = document.createElement('input');
                        input.id = inputID;
                        input.type = 'checkbox';
                        input.setAttribute('columnSelectAll', '1');
                        input.gridID = elID;
                        input.checked = column.toogleChecked == 1 ? true : false;
                        syn.$m.addClass(input, 'form-check-input');

                        Handsontable.dom.addEvent(input, 'click', function (evt) {
                            var el = evt.target || evt.srcElement;
                            var toogleChecked = el.checked ? '1' : '0';
                            column.toogleChecked = toogleChecked;

                            var mod = window[syn.$w.pageScript];
                            var eventHandler = mod.event['{0}_selectAllCheck'.format(input.gridID)];
                            if (eventHandler) {
                                eventHandler.apply(el, [input.gridID, col, $string.toBoolean(column.toogleChecked.toString())]);
                                var hot = $grid.getGridControl(el.gridID);
                                hot.render();
                            }
                            else {
                                var hot = $grid.getGridControl(el.gridID);
                                var gridSettings = $grid.getSettings(el.gridID);

                                if (gridSettings.data && gridSettings.data.length > 0) {
                                    var data = gridSettings.data;
                                    var length = data.length;
                                    var colProp = hot.colToProp(col);
                                    for (var i = 0; i < length; i++) {
                                        var flag = data[i]['Flag'];
                                        if (flag == 'R') {
                                            data[i]['Flag'] = 'U';
                                        }

                                        if (flag != 'S') {
                                            data[i][colProp] = toogleChecked;
                                        }
                                    }
                                }
                                hot.render();
                            }

                            evt.stopImmediatePropagation();
                        });

                        syn.$m.prepend(input, TH.firstElementChild);
                    }
                }
                else {
                    var checkbox = TH.querySelector('input[type="checkbox"]');
                    if (col >= 0 && column && (column.type == 'checkbox' || column.type == 'checkbox2') && checkbox != null) {
                        TH.firstElementChild.removeChild(checkbox);

                        var label = TH.querySelector('label[for]');
                        TH.firstElementChild.removeChild(label);
                    }
                }
            };

            if (setting.isContainFilterHeader == true) {
                setting.className = 'contain-filter-header';
            }

            setting.width = setting.width || '100%';
            setting.height = setting.height || 240;

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            if (isSummary == true) {
                syn.$m.addClass(wrapper, 'summaryRow');
            }
            wrapper.id = elID;

            parent.appendChild(wrapper);

            var fileEL = document.createElement('input');
            fileEL.id = '{0}_ImportFile'.format(elID);
            fileEL.type = 'file';
            fileEL.style.display = 'none';
            fileEL.accept = '.csv, .xls, .xlsx';
            Handsontable.dom.addEvent(fileEL, 'change', $grid.importFileLoad);
            parent.appendChild(fileEL);

            el = syn.$l.get(elID);

            if (!$grid.handsontableHooks) {
                $grid.handsontableHooks = Handsontable.hooks.getRegistered();
            }

            $grid.gridHooks = [
                'afterChange',
                'afterCreateRow',
                'afterRemoveRow',
                'beforeOnCellMouseDown',
                'afterSelectionEnd',
                'beforeKeyDown'
            ];

            var gridHookEvents = syn.$l.get(el.id + '_hidden').getAttribute('syn-events');
            try {
                if (gridHookEvents) {
                    gridHookEvents = eval(gridHookEvents);
                }
            } catch (error) {
                syn.$l.eventLog('WebGrid_controlLoad', error.toString(), 'Debug');
            }

            if (gridHookEvents) {
                for (var i = 0; i < gridHookEvents.length; i++) {
                    var hook = gridHookEvents[i];
                    if ($grid.gridHooks.indexOf(hook) == -1) {
                        $grid.gridHooks.push(hook);
                    }
                }
            }

            $grid.gridHooks.forEach(function (hook) {
                setting[hook] = function () {
                    var elID = this.rootElement.id;
                    var $grid = syn.uicontrols.$grid;
                    var mod = window[syn.$w.pageScript];
                    var hot = $grid.getGridControl(elID);

                    if (hot == null) { return; }

                    // syn.$l.eventLog('gridHooks', 'elID: {0}, hook: {1}'.format(elID, hook), 'Debug');
                    var defaultGridHooks = [
                        'afterChange',
                        'afterCreateRow',
                        'afterRemoveRow',
                        'beforeOnCellMouseDown',
                        'afterSelectionEnd',
                        'beforeKeyDown'
                    ];

                    var gridValue = $grid.getGridValue(elID);
                    if (defaultGridHooks.indexOf(hook) == -1) {
                        if (gridValue.passSelectCellEvent == true) {
                        }
                        else {
                            if (mod) {
                                var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                                if (eventHandler) {
                                    eventHandler.apply(syn.$l.get(elID), arguments);
                                }
                            }
                        }
                        return;
                    }

                    if (gridValue) {
                        if (hook == 'afterChange' && (gridValue.eventName == 'insertRow' || gridValue.eventName == 'removeRow')) {
                            gridValue.eventName == '';
                            return;
                        }
                    }

                    if (hook == 'beforeKeyDown') {
                        var evt = arguments[0];
                        if (evt.altKey == true && evt.keyCode == 13) {
                            Handsontable.dom.stopImmediatePropagation(evt);
                        }
                        else if (evt.shiftKey == true && evt.keyCode == 9) {
                            var selected = hot.getSelected()[0];
                            var currentRow = selected[0];
                            var currentCol = selected[1];
                            var firstCol = $grid.getFirstShowColIndex(elID);
                            var lastCol = $grid.getLastShowColIndex(elID);

                            if (currentRow > 0 && currentCol == firstCol) {
                                Handsontable.dom.stopImmediatePropagation(evt);
                                if (evt.preventDefault) {
                                    evt.preventDefault();
                                }

                                hot.selectCell((currentRow - 1), lastCol);
                            }
                            else if (currentRow == 0 && currentCol == firstCol) {
                                Handsontable.dom.stopImmediatePropagation(evt);
                                if (evt.preventDefault) {
                                    evt.preventDefault();
                                }

                                var lastRow = hot.countRows() - 1;
                                if (lastRow > -1) {
                                    hot.selectCell(lastRow, lastCol);
                                }
                            }
                        }
                        else if (evt.keyCode == 9) {
                            var selected = hot.getSelected()[0];
                            var currentRow = selected[0];
                            var currentCol = selected[1];
                            var firstCol = $grid.getFirstShowColIndex(elID);
                            var lastCol = $grid.getLastShowColIndex(elID);
                            var lastRow = hot.countRows() - 1;

                            if (currentRow < lastRow && currentCol == lastCol) {
                                Handsontable.dom.stopImmediatePropagation(evt);
                                if (evt.preventDefault) {
                                    evt.preventDefault();
                                }

                                hot.selectCell((currentRow + 1), firstCol);
                            }
                            else if (currentRow == lastRow && currentCol == lastCol) {
                                Handsontable.dom.stopImmediatePropagation(evt);
                                if (evt.preventDefault) {
                                    evt.preventDefault();
                                }

                                if (setting.autoInsertRow == true) {
                                    $grid.insertRow(elID, {
                                        amount: 1
                                    }, function (row) {
                                        hot.selectCell(row, firstCol);
                                    });

                                    Handsontable.dom.stopImmediatePropagation(evt);
                                    if (evt.preventDefault) {
                                        evt.preventDefault();
                                    }
                                }
                                else {
                                    hot.selectCell(0, firstCol);
                                }
                            }
                        }
                    } else if (hook == 'afterChange' || hook == 'afterCreateRow' || hook == 'afterRemoveRow' || hook == 'hiddenRow') {
                        if (hook == 'afterChange' && arguments[1] == 'loadData') {
                            return;
                        }
                        else if (hook == 'afterChange' && arguments[1] == 'edit' && arguments[0][0][1] == 'Flag') {
                            return;
                        }

                        var rowIndex;
                        if (hook == 'afterCreateRow') {
                            var method_index = arguments[0];
                            var method_amount = arguments[1];
                            var method_source = arguments[2];

                            rowIndex = method_index;

                            // var columns = setting.columns;
                            // var defaultFields = method_source ? method_source : {};
                            // var defalutValue = '';
                            // 
                            // var defaultValues = [];
                            // for (var amount = 0; amount < method_amount; amount++) {
                            //     var amountIndex = rowIndex + amount;
                            //     var length = columns.length;
                            //     for (var i = 0; i < length; i++) {
                            //         var column = columns[i];
                            //         if (column.type == 'numeric') {
                            //             defalutValue = 0;
                            //         } else if (column.type == 'checkbox') {
                            //             defalutValue = false;
                            //         }
                            // 
                            //         if (defaultFields[column.data]) {
                            //             defalutValue = defaultFields[column.data];
                            //         }
                            // 
                            //         defaultValues.push([amountIndex, i, defalutValue]);
                            //         defalutValue = '';
                            //     }
                            // }
                            // 
                            // if (defaultValues.length > 0) {
                            //     defaultValues[0][2] = 'C'
                            //     hot.setDataAtCell(defaultValues);
                            //     return;
                            // }
                        } else if (hook == 'afterChange') {
                            var method_changes = arguments[0];
                            var method_source = arguments[1];

                            if ($object.isNullOrUndefined(method_changes) == true) {
                                return;
                            }

                            rowIndex = method_changes[0][0];

                            var columnName = method_changes[0][1];
                            var changeValue = method_changes[0][3];
                            var columnInfos = hot.getSettings().columns;
                            // var colIndex = hot.propToCol(columnName);
                            var columnInfo = columnInfos.filter(function (item) { return item.data == columnName; })[0];
                            if (columnInfo.type == 'dropdown') {
                                var dataSource = columnInfo.dataSource;
                                if (dataSource) {
                                    if (columnInfo.required == false && changeValue == '') {
                                        method_changes[0][4] = '';

                                        hot.setDataAtCell(rowIndex, hot.propToCol(columnInfo.codeColumnID), '');
                                    }
                                    else {
                                        for (var j = 0; j < dataSource.DataSource.length; j++) {
                                            var item = dataSource.DataSource[j];
                                            if (item[dataSource.ValueColumnID] == changeValue) {
                                                var code = item[dataSource.CodeColumnID];
                                                method_changes[0][4] = code;

                                                hot.setDataAtCell(rowIndex, hot.propToCol(columnInfo.codeColumnID), code);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            else if (columnInfo.type == 'codehelp') {
                                var oldValue = method_changes[0][2];
                                if (changeValue == '') {
                                    method_changes[0][4] = '';

                                    hot.setDataAtCell(rowIndex, hot.propToCol(columnInfo.codeColumnID), '');
                                }
                                else if (oldValue != changeValue) {
                                    hot.setDataAtCell(rowIndex, hot.propToCol(columnInfo.codeColumnID), '');
                                }
                            }
                        } else if (hook == 'afterRemoveRow') {
                            var method_index = arguments[0];
                            var method_amount = arguments[1];

                            rowIndex = method_index;
                        } else if (hook == 'hiddenRow') {
                            var method_rows = arguments[0];

                            rowIndex = method_rows[0];
                        }

                        if (rowIndex || rowIndex == 0) { } else {
                            return;
                        }

                        var physicalRowIndex = hot.toPhysicalRow(rowIndex); // Handsontable.hooks.run(hot, 'modifyRow', rowIndex);
                        var rowData = hot.getSourceDataAtRow(physicalRowIndex);
                        // var rowMeta = hot.getCellMetaAtRow(physicalRowIndex);
                        var rowFlag = rowData && rowData.Flag ? rowData.Flag : 'C';

                        if (hook == 'afterCreateRow') {
                            rowFlag = 'C';
                        } else if (hook == 'afterChange') {
                            if (rowFlag == 'R' && method_changes[0][2] != method_changes[0][3]) {
                                rowFlag = 'U';
                            }
                        } else if (hook == 'hiddenRow') {
                            if (rowFlag == 'R' || rowFlag == 'U') {
                                rowFlag = 'D';
                            }
                        }

                        if (hook == 'afterRemoveRow') {

                        } else {
                            var cellRowFlag = hot.getDataAtCell(rowIndex, 0);
                            if (cellRowFlag != rowFlag) {
                                hot.setDataAtCell(rowIndex, 0, rowFlag);

                                if (hook == 'afterCreateRow' && rowFlag == 'C') {

                                }
                            }
                        }
                    }
                    else if (hook == 'beforeOnCellMouseDown') {
                        var event = arguments[0];
                        var coords = arguments[1];
                        var td = arguments[2];

                        if (coords.row === -1 && event.target.nodeName === 'INPUT') {
                            event.stopImmediatePropagation();
                            this.deselectCell();
                        }

                        if (coords.row == -1) {
                            var gridValue = $grid.getGridValue(elID);
                            gridValue.colHeaderClick = true;
                            gridValue.previousRow = coords.row;
                            gridValue.previousCol = coords.col;
                        }

                        var now = new Date().getTime();
                        if (!(td.lastClick && now - td.lastClick < 200)) {
                            td.lastClick = now;
                        } else {
                            hook = 'afterOnCellDoubleClick';
                        }
                    }

                    if (mod) {
                        var el = syn.$l.get(elID);
                        var elHidden = syn.$l.get(elID + '_hidden');
                        var gridHookEvents = elHidden.getAttribute('syn-events');
                        try {
                            if (gridHookEvents) {
                                gridHookEvents = eval(gridHookEvents);
                            }
                        } catch (error) {
                            syn.$l.eventLog('WebGrid_gridHookEvents', error.toString(), 'Debug');
                        }

                        if (gridHookEvents) {
                            if (gridHookEvents.indexOf(hook) > -1) {
                                if (gridValue.passSelectCellEvent == true) {
                                }
                                else {
                                    if (mod) {
                                        var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                                        if (eventHandler) {
                                            eventHandler.apply(el, arguments);
                                        }
                                    }
                                }
                            }
                        }

                        // if ($l && syn.$l.hasEvent(el, hook) == true) {
                        //     var options = eval('(' + elHidden.getAttribute('syn-options') + ')');
                        //     if (options.transactConfig) {
                        //         var gridValue = $grid.getGridValue(elID);
                        //         var previousRow = -1;
                        //         if (gridValue) {
                        //             previousRow = gridValue.previousRow;
                        //         }
                        //         var currentRow = $grid.getActiveRowIndex(elID);
                        //         if (gridValue.colHeaderClick == false && currentRow != previousRow) {
                        //             syn.$l.trigger(el, hook, options.transactConfig);
                        //         }
                        //     }
                        // 
                        //     if (options.triggerConfig) {
                        //         var gridValue = $grid.getGridValue(elID);
                        //         var previousRow = -1;
                        //         if (gridValue) {
                        //             previousRow = gridValue.previousRow;
                        //         }
                        //         var currentRow = $grid.getActiveRowIndex(elID);
                        //         if (gridValue.colHeaderClick == false && currentRow != previousRow) {
                        //             syn.$l.trigger(el, hook, options.transactConfig);
                        //         }
                        //         syn.$l.trigger(el, hook, options.triggerConfig);
                        //     }
                        // }
                    }

                    if (hook == 'afterOnCellDoubleClick') {
                        hook = 'beforeOnCellMouseDown';
                    }

                    if (hook == 'afterSelectionEnd') {
                        var gridValue = $grid.getGridValue(elID);
                        gridValue.colHeaderClick = false;
                        gridValue.previousRow = arguments[0];
                        gridValue.previousCol = arguments[1];

                        if (mod) {
                            mod.prop.focusControl = syn.$l.get(elID);
                        }
                    }
                }
            });

            var controlSetting = $object.clone(setting);
            $grid.gridControls.push({
                id: elID,
                hot: new Handsontable(el, controlSetting),
                setting: controlSetting,
                value: {
                    eventName: '',
                    colHeaderClick: false,
                    applyCells: false,
                    previousRow: -1,
                    previousCol: -1
                }
            });

            var wtHolder = syn.$l.get(elID).querySelector('.wtHolder');
            wtHolder.gridID = elID;
            Handsontable.dom.addEvent(wtHolder, 'click', function (evt) {
                var mod = window[syn.$w.pageScript];
                if (mod) {
                    mod.prop.focusControl = syn.$l.get(wtHolder.gridID);
                }
            });

            if ($grid.gridCodeDatas.length > 0) {
                var length = $grid.gridCodeDatas.length;
                for (var i = 0; i < length; i++) {
                    syn.$w.addReadyCount();
                    var codeData = $grid.gridCodeDatas[i];
                    $grid.dataRefresh(codeData.elID, codeData.type);
                }
            }

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }

            if ($object.isNullOrUndefined($grid.remainingReadyIntervalID) == true) {
                $grid.remainingReadyIntervalID = setInterval(function () {
                    if (syn.$w.isPageLoad == true) {
                        clearInterval($grid.remainingReadyIntervalID);
                        $grid.remainingReadyIntervalID = null;

                        for (var i = 0, length = $grid.gridControls.length; i < length; i++) {
                            var hot = $grid.gridControls[i].hot;
                            hot.render();
                        }
                    }
                }, 25);
            }
        },

        dataRefresh(elID, setting, callback) {
            var defaultSetting = {
                columnName: null,
                codeColumnID: null,
                required: true,
                local: true,
                dataSourceID: null,
                storeSourceID: null,
                dataSource: null,
                parameters: null,
                selectedValue: null
            }

            setting = syn.$w.argumentsExtend(defaultSetting, setting);
            setting.elID = elID;
            setting.storeSourceID = setting.storeSourceID || setting.dataSourceID;

            if (setting.columnName && setting.storeSourceID) {
                var mod = window[syn.$w.pageScript];
                if (mod.config && mod.config.dataSource && mod.config.dataSource[setting.storeSourceID]) {
                    delete mod.config.dataSource[setting.storeSourceID];
                }

                if (mod && mod.hook.controlInit) {
                    var moduleSettings = mod.hook.controlInit(elID, setting);
                    setting = syn.$w.argumentsExtend(setting, moduleSettings);
                }

                var dataSource = null;
                if (mod.config && mod.config.dataSource && mod.config.dataSource[setting.dataSourceID]) {
                    dataSource = mod.config.dataSource[setting.storeSourceID];
                }

                var hot = $grid.getGridControl(elID);
                var gridSettings = hot.getSettings();
                var columnInfos = gridSettings.columns;
                var colIndex = hot.propToCol(setting.columnName);
                var columnInfo = columnInfos[colIndex];
                if (columnInfo.type == 'dropdown') {
                    var loadData = function (columnInfo, dataSource, setting) {
                        columnInfo.dataSource = dataSource;
                        columnInfo.storeSourceID = setting.storeSourceID;
                        columnInfo.local = setting.local;
                        columnInfo.required = setting.required;
                        columnInfo.codeColumnID = setting.codeColumnID || columnInfo.codeColumnID;
                        var source = [];

                        if (columnInfo.required == false) {
                            source.push('');
                        }

                        for (var j = 0; j < dataSource.DataSource.length; j++) {
                            var item = dataSource.DataSource[j];
                            source.push(item[dataSource.ValueColumnID]);
                        }

                        columnInfo.source = source;
                        columnInfo.visibleRows = 10;
                        columnInfo.trimDropdown = true;
                        columnInfo.trimWhitespace = true;
                        columnInfo.wordWrap = false;
                        columnInfo.allowInvalid = false;
                        $grid.updateSettings(setting.elID, gridSettings);

                        if (setting.selectedValue) {
                            var row = $grid.getActiveRowIndex(elID);

                            if (row > -1) {
                                var codeColIndex = hot.propToCol(columnInfo.codeColumnID);
                                var selectedText = '';
                                var length = columnInfo.dataSource.DataSource.length;
                                for (var i = 0; i < length; i++) {
                                    var item = columnInfo.dataSource.DataSource[i];
                                    if (item.CodeID == setting.selectedValue) {
                                        selectedText = item.CodeValue;
                                        break;
                                    }
                                }

                                var codeValue = [
                                    [row, codeColIndex, setting.selectedValue],
                                    [row, colIndex, selectedText]
                                ];
                                hot.setDataAtCell(codeValue);
                            }
                        }
                    }

                    if (dataSource) {
                        loadData(columnInfo, dataSource, setting);
                        if (callback) {
                            callback();
                        }
                        syn.$w.removeReadyCount();
                    } else {
                        if (setting.local == true) {
                            syn.$w.loadJson(syn.Config.SharedAssetUrl + 'code/{0}.json'.format(setting.storeSourceID), setting, function (setting, json) {
                                if (json) {
                                    mod.config.dataSource[setting.storeSourceID] = json;
                                    loadData(columnInfo, json, setting);
                                    if (callback) {
                                        callback();
                                    }
                                }
                                syn.$w.removeReadyCount();
                            }, false);
                        } else {
                            syn.$w.getDataSource(setting.dataSourceID, setting.parameters, function (json) {
                                if (json) {
                                    mod.config.dataSource[setting.storeSourceID] = json;
                                    loadData(columnInfo, json, setting);
                                    if (callback) {
                                        callback();
                                    }
                                }
                                syn.$w.removeReadyCount();
                            });
                        }
                    }
                }
            }
        },

        // columns = [{
        //    0 columnID: '',
        //    1 columnName: '',
        //    2 width: '',
        //    3 isHidden: '',
        //    4 columnType: '',
        //    5 readOnly: '',
        //    6 alignConstants: '',
        //    7 belongID: '',
        //    8 validators: ['require', 'unique', 'number', 'ipaddress', 'email', 'date', 'dateformat']
        //    9 options: { sorting: true, placeholder: 'Empty Cell' }
        // }]
        getInitializeColumns(settings, elID) {
            var columns = settings.columns;
            var gridSetting = {
                colHeaders: [],
                columns: [],
                colWidths: [],
                hiddenColumns: {
                    columns: [0],
                    indicators: false
                }
            };

            var length = columns.length;
            for (var i = 0; i < length; i++) {
                var column = columns[i];

                var columnID = column[0];
                var columnName = column[1];
                var width = column[2];
                var isHidden = column[3];
                var columnType = column[4];
                var readOnly = column[5];
                var alignConstants = column[6];
                var belongID = column[7];
                var validators = column[8];
                var options = column[9];

                var columnInfo = {
                    data: columnID,
                    type: 'text',
                    filter: true,
                    isHidden: isHidden,
                    readOnly: $string.toBoolean(settings.readOnly) == true ? true : $string.toBoolean(readOnly),
                    className: $object.isNullOrUndefined(alignConstants) == true ? '' : 'ht' + $string.capitalize(alignConstants),
                    belongID: $object.isNullOrUndefined(belongID) == true ? '' : belongID,
                    validators: null
                }

                if (column.length > 8 && validators) {
                    columnInfo.validators = validators;

                    if (columnInfo.validators.indexOf('require') > -1) {
                        columnInfo.className = columnInfo.className + ' required';
                    }
                }

                if (column.length > 9 && options) {
                    var columnOptions = options;

                    if ($string.isNullOrEmpty(columnOptions.placeholder) == false) {
                        columnInfo.placeholder = columnOptions.placeholder;
                    }

                    if (columnOptions.sorting == true) {
                    }
                    else {
                        columnInfo.columnSorting = {
                            indicator: false,
                            headerAction: false,
                            compareFunctionFactorycompareFunctionFactory() {
                                return function comparator() {
                                    return 0;
                                };
                            }
                        };
                    }

                    if ((columnInfo.type == 'checkbox' || columnInfo.type == 'checkbox2') && columnOptions.isRadioTheme == true) {
                        columnInfo.className = columnInfo.className + ' required';
                    }

                    columnInfo.columnOptions = columnOptions;
                }

                if (column.length != 10 && settings.columnSorting == false) {
                    columnInfo.columnSorting = {
                        indicator: false,
                        headerAction: false,
                        compareFunctionFactorycompareFunctionFactory() {
                            return function comparator() {
                                return 0;
                            };
                        }
                    };
                }

                var dataSource = null;
                var type = columnType;
                if ($object.isString(type) == true) {
                    columnInfo.type = type;
                    if ((columnInfo.type == 'dropdown' || columnInfo.type == 'codehelp')) {
                        syn.$l.eventLog('getInitializeColumns', '"{0}" 컬럼 타입은 객체로 선언 필요'.format(type), 'Warning');
                    }
                    else if (columnInfo.type == 'checkbox' || columnInfo.type == 'checkbox2') {
                        columnInfo.isSelectAll = false;
                        columnInfo.checkedTemplate = '1';
                        columnInfo.uncheckedTemplate = '0';
                        columnInfo.allowInvalid = false;
                    }
                    else if (columnInfo.type == 'numeric' || columnInfo.type == 'date' || columnInfo.type == 'time' || columnInfo.type == 'autocomplete') {
                        columnInfo.allowInvalid = false;
                        if (columnInfo.type == 'numeric') {
                            if (type.numericFormat) {
                                columnInfo.numericFormat = type.numericFormat;
                            }
                            else if (type.numericFormat == false) {
                            }
                            else {
                                columnInfo.numericFormat = {
                                    pattern: '0,00',
                                    culture: 'ko-KR'
                                }
                            }
                        }
                        else if (columnInfo.type == 'date') {
                            columnInfo.dateFormat = type.timeFormat;
                            columnInfo.correctFormat = type.correctFormat;
                            columnInfo.defaultDate = type.defaultDate;
                            columnInfo.datePickerConfig = type.datePickerConfig;
                        }
                        else if (columnInfo.type == 'time') {
                            columnInfo.timeFormat = type.timeFormat;
                            columnInfo.correctFormat = type.correctFormat;
                        }
                    }
                }
                else {
                    columnInfo.type = type.columnType;

                    if ((columnInfo.type == 'dropdown' || columnInfo.type == 'codehelp')) {
                        var storeSourceID = type.storeSourceID || type.dataSourceID;
                        if (storeSourceID) {
                            var mod = window[syn.$w.pageScript];
                            if (mod.config && mod.config.dataSource && mod.config.dataSource[storeSourceID]) {
                                dataSource = mod.config.dataSource[storeSourceID];
                            }
                        }
                    }
                    else if (columnInfo.type == 'checkbox' || columnInfo.type == 'checkbox2') {
                        columnInfo.isSelectAll = $object.isNullOrUndefined(type.isSelectAll) == false && type.isSelectAll === true ? true : false;
                        columnInfo.checkedTemplate = $object.isNullOrUndefined(type.checkedTemplate) == false ? type.checkedTemplate : '1';
                        columnInfo.uncheckedTemplate = $object.isNullOrUndefined(type.uncheckedTemplate) == false ? type.uncheckedTemplate : '1';
                        columnInfo.allowInvalid = $object.isNullOrUndefined(type.allowInvalid) == false && type.allowInvalid === true ? true : false;
                    }
                    else if (columnInfo.type == 'numeric' || columnInfo.type == 'date' || columnInfo.type == 'time' || columnInfo.type == 'autocomplete') {
                        columnInfo.allowInvalid = false;
                        if (columnInfo.type == 'numeric') {
                            if (type.numericFormat) {
                                columnInfo.numericFormat = type.numericFormat;
                            }
                            else if (type.numericFormat == false) {
                            }
                            else {
                                columnInfo.numericFormat = {
                                    pattern: '0,00',
                                    culture: 'ko-KR'
                                }
                            }
                        }
                        else if (columnInfo.type == 'date') {
                            columnInfo.dateFormat = type.timeFormat;
                            columnInfo.correctFormat = type.correctFormat;
                            columnInfo.defaultDate = type.defaultDate;
                            columnInfo.datePickerConfig = type.datePickerConfig;
                        }
                        else if (columnInfo.type == 'time') {
                            columnInfo.timeFormat = type.timeFormat;
                            columnInfo.correctFormat = type.correctFormat;
                        }
                    }
                }

                if (columnInfo.type == 'dropdown') {
                    var source = [];
                    if (dataSource) {
                        for (var j = 0; j < dataSource.DataSource.length; j++) {
                            var item = dataSource.DataSource[j];
                            source.push(item[dataSource.ValueColumnID]);
                        }
                    }
                    else {
                        if (elID) {
                            type.columnName = columnID;
                            if (type.local === true) {
                                $grid.dataRefresh(elID, type);
                            }
                            else {
                                $grid.gridCodeDatas.push({
                                    elID: elID,
                                    type: type
                                });
                            }
                        }
                    }

                    columnInfo.dataSource = dataSource;
                    columnInfo.dataSourceID = type.dataSourceID;
                    columnInfo.storeSourceID = type.storeSourceID || type.dataSourceID;
                    columnInfo.local = (type.local === true);
                    columnInfo.codeBelongID = type.codeBelongID;
                    columnInfo.codeColumnID = type.codeColumnID;
                    columnInfo.codeColumnType = type.codeColumnType ? type.codeColumnType : 'text';
                    columnInfo.codeColumnHidden = type.codeColumnHidden == undefined ? true : type.codeColumnHidden;
                    columnInfo.source = source;
                    columnInfo.strict = true;
                    columnInfo.visibleRows = $object.isNullOrUndefined(source) == true ? 0 : source.length + 1;
                    columnInfo.trimDropdown = true;
                    columnInfo.trimWhitespace = true;
                    columnInfo.wordWrap = false;
                    columnInfo.allowInvalid = false;
                } else if (columnInfo.type == 'codehelp') {
                    columnInfo.dataSource = dataSource;
                    columnInfo.dataSourceID = type.dataSourceID;
                    columnInfo.storeSourceID = type.storeSourceID || type.dataSourceID;
                    columnInfo.local = type.local;
                    columnInfo.controlText = type.controlText;
                    columnInfo.codeColumnID = type.codeColumnID ? type.codeColumnID : columnID;
                    columnInfo.textColumnID = type.textColumnID ? type.textColumnID : columnID;
                    columnInfo.parameters = type.parameters ? type.parameters : '';
                } else if (columnInfo.type == 'date') {
                    columnInfo.dateFormat = type.dateFormat ? type.dateFormat : 'YYYY-MM-DD';
                    columnInfo.correctFormat = true;
                    columnInfo.datePickerConfig = {
                        format: columnInfo.dateFormat,
                        ariaLabel: '날짜를 선택하세요',
                        i18n: {
                            previousMonth: '이전 달',
                            nextMonth: '다음 달',
                            months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                            weekdays: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
                            weekdaysShort: ['일', '월', '화', '수', '목', '금', '토']
                        },
                        showWeekNumber: false,
                        showMonthAfterYear: true,
                        yearSuffix: '년',
                        firstDay: 0,
                        numberOfMonths: 1
                    }
                }

                if (columnInfo.type == 'dropdown') {
                    var hiddenColumnInfo = {
                        data: columnInfo.codeColumnID,
                        type: columnInfo.codeColumnType,
                        filter: true,
                        readOnly: true,
                        className: 'htLeft',
                        belongID: columnInfo.codeBelongID ? columnInfo.codeBelongID : $object.clone(belongID)
                    }

                    if (columnInfo.codeColumnHidden == true) {
                        gridSetting.colHeaders.push(columnName + '_$HIDDEN');
                        columnInfo.columnText = columnName + '_$HIDDEN';
                    }
                    else {
                        gridSetting.colHeaders.push(columnName + '_코드');
                        columnInfo.columnText = columnName + '_코드';
                    }
                    gridSetting.columns.push(hiddenColumnInfo);
                    gridSetting.colWidths.push(width);
                }

                gridSetting.colHeaders.push(columnName);
                columnInfo.columnText = columnName;
                gridSetting.columns.push(columnInfo);
                gridSetting.colWidths.push(width);
            }

            var headerLength = gridSetting.colHeaders.length;
            for (var i = 0; i < headerLength; i++) {
                var colHeader = gridSetting.colHeaders[i];
                if (colHeader.indexOf('_$HIDDEN') > -1) {
                    gridSetting.hiddenColumns.columns.push((i + 1));
                }
            }

            for (var i = 0; i < headerLength; i++) {
                var columnInfo = gridSetting.columns[i];
                if (columnInfo.isHidden == true) {
                    gridSetting.hiddenColumns.columns.push((i + 1));
                }
            }

            return gridSetting;
        },

        merge(elID, startRow, startColumn, endRow, endColumn) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var mergePlugin = hot.getPlugin('mergeCells');

                if (mergePlugin.isEnabled() == false) {
                    mergePlugin.enablePlugin();
                }

                mergePlugin.merge(startRow, startColumn, endRow, endColumn);
            }
        },

        unmerge(elID, startRow, startColumn, endRow, endColumn) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var mergePlugin = hot.getPlugin('mergeCells');

                if (mergePlugin.isEnabled() == false) {
                    mergePlugin.enablePlugin();
                }

                mergePlugin.unmerge(startRow, startColumn, endRow, endColumn);
            }
        },

        addCondition(elID, col, name, args) {
            /*
            name에 들어갈수 있는 조건
            begins_with: 로 시작
            between: 사이
            by_value: 값
            contains: 포함
            empty: 비우기
            ends_with: 로 끝나다
            eq: 같음
            gt:  보다 큰
            gte: 크거나 같음
            lt: 이하
            lte: 이하거나 같음
            none: 없음 (필터 없음)
            not_between: 사이가 아님
            not_contains: 포함하지 않음
            not_empty: 비우지 않음
            neq: 같지 않다
             */
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var filtersPlugin = hot.getPlugin('filters');

                if (filtersPlugin.isEnabled() == false) {
                    filtersPlugin.enablePlugin();
                }

                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }

                if ($object.isString(args) == true) {
                    args = [args];
                }

                filtersPlugin.addCondition(col, name, args);
                filtersPlugin.filter();
            }
        },

        removeCondition(elID, col) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var filtersPlugin = hot.getPlugin('filters');

                if (filtersPlugin.isEnabled() == false) {
                    filtersPlugin.enablePlugin();
                }

                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }

                filtersPlugin.removeConditions(col);
                filtersPlugin.filter();
            }
        },

        clearConditions(elID) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var filtersPlugin = hot.getPlugin('filters');

                if (filtersPlugin.isEnabled() == false) {
                    filtersPlugin.enablePlugin();
                }

                filtersPlugin.clearConditions();
                filtersPlugin.filter();
            }
        },

        countRows(elID, isIncludeHidden) {
            var result = 0;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var hiddenRowCount = 0;
                if (isIncludeHidden === true) {
                    var hiddenRowsPlugin = hot.getPlugin('hiddenRows');

                    if (hiddenRowsPlugin.isEnabled() == false) {
                        hiddenRowsPlugin.enablePlugin();
                    }
                    hiddenRowCount = hiddenRowsPlugin ? hiddenRowsPlugin.getHiddenRows().length : 0;
                }
                var sourceRowCount = hot.countSourceRows();
                result = (sourceRowCount - hiddenRowCount);
            }

            return result;
        },

        countRenderedRows(elID) {
            var result = -1;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.countRenderedRows();
            }

            return result;
        },

        countRenderedCols(elID) {
            var result = -1;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.countRenderedCols();
            }

            return result;
        },

        render(elID) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                hot.render();
            }
        },

        insertRow(elID, setting, callback) {
            var hot = $grid.getGridControl(elID);
            setting = syn.$w.argumentsExtend({
                index: hot.countRows(),
                amount: 1
            }, setting);

            hot.alter('insert_row_below', setting.index, setting.amount);
            hot.render();

            hot.suspendRender();
            var gridValue = $grid.getGridValue(elID);
            gridValue.eventName = 'insertRow';

            var row = (setting && setting.index) ? setting.index : 0;
            var amount = (setting && setting.amount) ? setting.amount : 1;
            var gridSetting = hot.getSettings();
            if (gridSetting) {
                var checkboxDefaultValues = [];
                var columns = gridSetting.columns;
                var length = columns.length;
                for (var col = 0; col < length; col++) {
                    var column = columns[col];
                    if (col >= 0 && (column.type == 'checkbox' || column.type == 'checkbox2')) {
                        var defaultValue = false;
                        if (column.uncheckedTemplate != undefined || column.uncheckedTemplate != null) {
                            defaultValue = column.uncheckedTemplate;
                        }

                        if (amount == 1) {
                            checkboxDefaultValues.push([row, col, defaultValue]);
                        }
                        else if (amount > 1) {
                            for (var i = 0; i < amount; i++) {
                                var rowAmount = row + i;
                                checkboxDefaultValues.push([rowAmount, col, defaultValue]);
                            }
                        }
                    }
                }

                if (checkboxDefaultValues.length > 0) {
                    hot.setDataAtCell(checkboxDefaultValues);
                }
            }

            var triggerOptions = syn.$w.getTriggerOptions(elID);
            if (triggerOptions) {
                if (triggerOptions.sourceValueID && triggerOptions.targetColumnID) {
                    var mod = window[syn.$w.pageScript];
                    if (mod) {
                        var synControls = mod.context.synControls;
                        if (synControls && synControls.length > 0) {
                            if ($object.isString(triggerOptions.sourceValueID) == true && $object.isString(triggerOptions.targetColumnID) == true) {
                                var keyValues = triggerOptions.sourceValueID.split('@');
                                var dataFieldID = keyValues[0];
                                var dataColumnID = keyValues[1];
                                var items = synControls.filter(function (item) {
                                    return item.field == dataFieldID;
                                });

                                if (items.length == 1) {
                                    var controlInfo = items[0];

                                    if (controlInfo.type == 'grid') {
                                        var targetCol = hot.propToCol(triggerOptions.targetColumnID);
                                        var sourceGridID = controlInfo.id;
                                        var sourceRow = $grid.getActiveRowIndex(sourceGridID);
                                        var sourceCol = $grid.propToCol(sourceGridID, dataColumnID);
                                        var sourceValue = $grid.getDataAtCell(sourceGridID, sourceRow, sourceCol);

                                        if (amount == 1) {
                                            hot.setDataAtCell(row, targetCol, sourceValue);
                                        }
                                        else if (amount > 1) {
                                            for (var i = 0; i < amount; i++) {
                                                var rowAmount = row + i;
                                                hot.setDataAtCell(rowAmount, targetCol, sourceValue);
                                            }
                                        }
                                    }
                                    else {
                                        var col = hot.propToCol(triggerOptions.targetColumnID);
                                        var el = syn.$l.querySelector('[syn-datafield="{0}"] #{1}'.format(dataFieldID, dataColumnID));
                                        if ($object.isNullOrUndefined(el) == false) {
                                            if (amount == 1) {
                                                hot.setDataAtCell(row, col, el.value);
                                            }
                                            else if (amount > 1) {
                                                for (var i = 0; i < amount; i++) {
                                                    var rowAmount = row + i;
                                                    hot.setDataAtCell(rowAmount, col, el.value);
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    syn.$l.eventLog('insertRow', '{0} 컬럼 ID 중복 또는 존재여부 확인 필요'.format(dataFieldID), 'Debug');
                                }
                            }
                            else if ($object.isArray(triggerOptions.sourceValueID) == true && $object.isArray(triggerOptions.targetColumnID) == true) {
                                var length = triggerOptions.sourceValueID.length;
                                for (var i = 0; i < length; i++) {
                                    var sourceValueID = triggerOptions.sourceValueID[i];
                                    var keyValues = sourceValueID.split('@');
                                    var dataFieldID = keyValues[0];
                                    var dataColumnID = keyValues[1];
                                    var items = synControls.filter(function (item) {
                                        return item.field == dataFieldID;
                                    });

                                    if (items.length == 1) {
                                        var controlInfo = items[0];

                                        if (controlInfo.type == 'grid') {
                                            var targetCol = hot.propToCol(triggerOptions.targetColumnID[i]);
                                            var sourceGridID = controlInfo.id;
                                            var sourceRow = $grid.getActiveRowIndex(sourceGridID);
                                            var sourceCol = $grid.propToCol(sourceGridID, dataColumnID);
                                            var sourceValue = $grid.getDataAtCell(sourceGridID, sourceRow, sourceCol);

                                            if (amount == 1) {
                                                hot.setDataAtCell(row, targetCol, sourceValue);
                                            }
                                            else if (amount > 1) {
                                                for (var i = 0; i < amount; i++) {
                                                    var rowAmount = row + i;
                                                    hot.setDataAtCell(rowAmount, targetCol, sourceValue);
                                                }
                                            }
                                        }
                                        else {
                                            var col = hot.propToCol(triggerOptions.targetColumnID[i]);
                                            var el = syn.$l.querySelector('[syn-datafield="{0}"] #{1}'.format(dataFieldID, dataColumnID));
                                            if ($object.isNullOrUndefined(el) == false) {
                                                if (amount == 1) {
                                                    hot.setDataAtCell(row, col, el.value);
                                                }
                                                else if (amount > 1) {
                                                    for (var i = 0; i < amount; i++) {
                                                        var rowAmount = row + i;
                                                        hot.setDataAtCell(rowAmount, col, el.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        syn.$l.eventLog('insertRow', '{0} 컬럼 ID 중복 또는 존재여부 확인 필요'.format(dataFieldID), 'Debug');
                                    }
                                }
                            }
                        }
                    }
                }

                if (triggerOptions.focusColumnID) {
                    var col = hot.propToCol(triggerOptions.focusColumnID);
                    hot.selectCell(row + (amount - 1), col);
                }
            }
            else {
                var values = [];
                if (amount == 1) {
                    for (var columnID in setting.values) {
                        var col = $grid.propToCol(elID, columnID);
                        if ($object.isNumber(col) == true) {
                            values.push([row, col, setting.values[columnID]]);
                        }
                    }
                }
                else if (amount > 1) {
                    for (var i = 0; i < amount; i++) {
                        var rowAmount = row + i;

                        for (var columnID in setting.values) {
                            var col = $grid.propToCol(elID, columnID);
                            if ($object.isNumber(col) == true) {
                                values.push([rowAmount, col, setting.values[columnID]]);
                            }
                        }
                    }
                }

                $grid.setDataAtRow(elID, values);
            }

            hot.resumeRender();
            if (callback) {
                callback(row, amount);
            }

            if (setting.focusColumnID) {
                var col = hot.propToCol(setting.focusColumnID);
                hot.selectCell(row + (amount - 1), col);
            }

            gridValue.eventName = '';
        },

        removeRow(elID, focusColumnIndex, rowIndex, callback) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                hot.suspendRender();
                if ($object.isNullOrUndefined(rowIndex) == true) {
                    var selected = hot.getSelected();
                    if (selected) {
                        rowIndex = selected[0][0];
                    }
                    else {
                        rowIndex = $grid.getActiveRowIndex(elID);

                        if (rowIndex && rowIndex > -1) {
                            var gridValue = $grid.getGridValue(elID);
                            gridValue.colHeaderClick = false;
                            gridValue.previousRow = -1;
                            gridValue.previousCol = -1;
                        }
                    }
                }

                if ($object.isNullOrUndefined(rowIndex) == true) {
                    rowIndex = $grid.countRows(elID, true) - 1;
                }

                if ($grid.isRowHidden(elID, rowIndex) == true) {
                    return;
                }

                if (rowIndex > -1) {
                    var gridValue = $grid.getGridValue(elID);
                    gridValue.eventName = 'removeRow';

                    var physicalRowIndex = hot.toPhysicalRow(rowIndex);

                    var rowData = hot.getSourceDataAtRow(physicalRowIndex);
                    var rowFlag = rowData && rowData.Flag ? rowData.Flag : 'C';

                    if (rowFlag == 'D') {
                        rowFlag = 'U';
                        hot.setDataAtCell(rowIndex, 0, rowFlag);

                        for (var i = 0; i < hot.countCols(); i++) {
                            var cellMeta = hot.getCellMeta(rowIndex, i)['className'];
                            cellMeta = cellMeta.replace(' removeRow', '');
                            hot.setCellMeta(rowIndex, i, 'className', cellMeta);
                        }
                    }
                    else {
                        if (rowFlag == 'R' || rowFlag == 'U') {
                            rowFlag = 'D';
                        }

                        if (rowFlag == 'C' || rowFlag == 'S') {
                        } else {
                            hot.setDataAtCell(rowIndex, 0, rowFlag);
                        }

                        if (rowFlag == 'C') {
                            hot.alter('remove_row', rowIndex);

                            var countRows = hot.countSourceRows();
                            var triggerOptions = syn.$w.getTriggerOptions(elID);
                            if (triggerOptions && triggerOptions.focusColumnID) {
                                var col = hot.propToCol(triggerOptions.focusColumnID);
                                if (rowIndex > 0 && rowIndex >= countRows) {
                                    rowIndex = countRows - 1;
                                    hot.selectCell(rowIndex, col);
                                }
                                else {
                                    hot.selectCell(rowIndex - 1, col);
                                }
                            }
                        } else if (rowFlag != 'S') {
                            var gridSettings = hot.getSettings();
                            if (gridSettings.isRemoveRowHidden === true) {
                                $grid.visibleRows(elID, rowIndex, false);
                            }
                            else {
                                for (var i = 0; i < hot.countCols(); i++) {
                                    hot.setCellMeta(rowIndex, i, 'className', hot.getCellMeta(rowIndex, i)['className'] + ' removeRow');
                                }
                            }
                        }
                    }

                    if (callback) {
                        callback(rowIndex);
                    }
                    else {
                        if ($string.isNullOrEmpty(focusColumnIndex) == true) {
                            focusColumnIndex = 1;
                        }

                        var focusRowIndex = rowIndex - 1;
                        if (focusRowIndex >= 0) {
                            $grid.selectCell(elID, rowIndex - 1, focusColumnIndex);
                        }
                    }

                    gridValue.eventName = '';
                }

                hot.resumeRender();
            }
        },

        loadData(elID, objectData, callback) {
            var hot = $grid.getGridControl(elID);
            if (hot) {

                var gridValue = $grid.getGridValue(elID);
                gridValue.applyCells = false;

                hot.deselectCell();
                $grid.clearConditions(elID);
                $grid.unHiddenRows(elID);

                var checkELs = syn.$l.querySelectorAll('div.handsontable > div table input[type=checkbox][columnSelectAll]');
                for (var i = 0; i < checkELs.length; i++) {
                    var checkEL = checkELs[i];
                    checkEL.checked = false;
                }

                var length = objectData.length;
                for (var i = 0; i < length; i++) {
                    objectData[i].Flag = 'R';
                }

                hot.loadData(objectData);

                var setting = hot.getSettings();
                for (var i = 0; i < setting.columns.length; i++) {
                    var column = setting.columns[i];
                    if (column.toogleChecked) {
                        column.toogleChecked = 0;
                    }
                }

                gridValue.colHeaderClick = false;
                gridValue.previousRow = -1;
                gridValue.previousCol = -1;

                if (setting.columnSorting != false) {
                    var columnSortingPlugin = hot.getPlugin('columnSorting');

                    if (columnSortingPlugin.isEnabled() == false) {
                        columnSortingPlugin.enablePlugin();
                    }

                    if (columnSortingPlugin.isSorted() == true) {
                        columnSortingPlugin.sort(columnSortingPlugin.sortColumn, columnSortingPlugin.sortOrder);
                    }
                }

                gridValue.applyCells = true;
            }

            if (callback) {
                callback();
            }
        },

        getFirstShowColIndex(elID) {
            var result = 0;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var settings = hot.getSettings();
                if (settings.firstShowColIndex) {
                    result = settings.firstShowColIndex;
                }
                else {
                    var countCols = (hot.countCols() - 1);
                    var cols = [];
                    for (var i = 0; i <= countCols; i++) {
                        cols.push(i);
                    }

                    if (settings.hiddenColumns && settings.hiddenColumns.columns && settings.hiddenColumns.columns.length > 0) {
                        var length = settings.hiddenColumns.columns.length;
                        for (var i = 0; i < length; i++) {
                            var hiddenCol = settings.hiddenColumns.columns[i];
                            for (var j = (cols.length - 1); j > -1; j--) {
                                if (hiddenCol == cols[j]) {
                                    $array.removeAt(cols, j);
                                    break;
                                }
                            }
                        }

                        result = cols[0];
                    }
                }
            }

            return result;
        },

        getLastShowColIndex(elID) {
            var result = 0;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var settings = hot.getSettings();
                if (settings.lastShowColIndex) {
                    result = settings.lastShowColIndex;
                }
                else {
                    result = (hot.countCols() - 1);
                    var cols = [];
                    for (var i = 0; i <= result; i++) {
                        cols.push(i);
                    }

                    if (settings.hiddenColumns && settings.hiddenColumns.columns && settings.hiddenColumns.columns.length > 0) {
                        var length = settings.hiddenColumns.columns.length;
                        for (var i = 0; i < length; i++) {
                            var hiddenCol = settings.hiddenColumns.columns[i];
                            for (var j = (cols.length - 1); j > -1; j--) {
                                if (hiddenCol == cols[j]) {
                                    $array.removeAt(cols, i);
                                    break;
                                }
                            }
                        }

                        result = cols[(cols.length - 1)];
                    }
                }
            }

            return result;
        },

        updateSettings(elID, settings, isDataClear) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if (isDataClear && isDataClear == true) {
                    $grid.clear(elID);
                }

                hot.updateSettings(settings);
                hot.render();
            }
        },

        getSettings(elID) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.getSettings();
            }

            return result;
        },

        isUpdateData(elID) {
            var result = false;
            var gridSettings = $grid.getSettings(elID);
            if (gridSettings) {
                if (gridSettings.data && gridSettings.data.length > 0) {
                    var length = gridSettings.data.length;
                    for (var i = 0; i < length; i++) {
                        var flag = gridSettings.data[i]['Flag'];
                        if ($string.isNullOrEmpty(flag) == true || flag == 'R' || flag == 'S') {
                            continue;
                        }
                        else {
                            result = true;
                            break;
                        }
                    }
                }
            }

            return result;
        },

        getFlag(elID, row) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                return hot.getDataAtCell(row, 'Flag');
            }
        },

        setFlag(elID, row, flagValue) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var col = hot.propToCol('Flag');
                var flag = hot.getDataAtCell(row, col);
                if (flag != 'S') {
                    hot.setDataAtCell(row, col, flagValue);
                }
            }
        },

        getDataAtCell(elID, row, col) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                return hot.getDataAtCell(row, col);
            }
        },

        scrollViewportTo(elID, row, column, snapToBottom, snapToRight) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.scrollViewportTo(row, column, snapToBottom, snapToRight);
            }

            return result;
        },

        isEmptyRow(elID, row) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.isEmptyRow(row);
            }

            return result;
        },

        isEmptyCol(elID, col) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }
                result = hot.isEmptyCol(col);
            }

            return result;
        },

        getDataAtRow(elID, row) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.getDataAtRow(row);
            }

            return result;
        },

        getSourceDataAtRow(elID, row) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.getSourceDataAtRow(row);
            }

            return result;
        },

        getDataAtCol(elID, col) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }
                result = hot.getDataAtCol(col);
            }

            return result;
        },

        getSourceDataAtCol(elID, col) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }
                result = hot.getSourceDataAtCol(col);
            }

            return result;
        },

        getRowHeader(elID, row) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.getRowHeader(row);
            }

            return result;
        },

        setDataAtCell(elID, row, col, value, source) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }
                hot.setDataAtCell(row, col, value, source);
            }
        },

        setDataAtRow(elID, values) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                hot.setDataAtCell(values);
            }
        },

        isCellClassName(elID, row, col, className) {
            var result = false;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }

                var meta = hot.getCellMeta(row, col)['className'];
                result = (meta != null && meta.indexOf(className) > -1);
            }

            return result;
        },

        // className: .handsontable .my-class {background: #fea!important;}
        setCellClassName(elID, row, col, className, isApply) {
            if ($object.isNullOrUndefined(className) == true) {
                syn.$l.eventLog('$grid.setCellClassName', 'className 확인 필요', 'Warning');
            }
            else {
                var hot = $grid.getGridControl(elID);
                if (hot) {
                    if ($object.isString(col) == true) {
                        col = hot.propToCol(col);
                    }

                    if ($object.isNullOrUndefined(isApply) == true) {
                        isApply = false;
                    }

                    var execute = function (row, col, className, isApply) {
                        var meta = hot.getCellMeta(row, col)['className'];
                        if (meta) {
                            if (isApply === true) {
                                if (meta.indexOf(className) == -1) {
                                    hot.setCellMeta(row, col, 'className', hot.getCellMeta(row, col)['className'] + ' ' + className);
                                }
                            }
                            else {
                                if (meta.indexOf(className) > -1) {
                                    meta = meta.replace(' ' + className, '');
                                    hot.setCellMeta(row, col, 'className', meta);
                                }
                            }
                        }
                        else {
                            hot.setCellMeta(row, col, 'className', className);
                        }
                    }

                    if (row == -1 && col == -1) {
                        var rowCount = hot.countRows();
                        var colCount = hot.countCols();
                        for (var i = 0; i < rowCount; i++) {
                            for (var j = 0; j < colCount; j++) {
                                execute(i, j, className, isApply);
                            }
                        }
                    }
                    else if (row == -1 && col > -1) {
                        var rowCount = hot.countRows();
                        for (var i = 0; i < rowCount; i++) {
                            execute(i, col, className, isApply);
                        }
                    }
                    else if (row > -1 && col == -1) {
                        var colCount = hot.countCols();
                        for (var i = 0; i < colCount; i++) {
                            execute(row, i, className, isApply);
                        }
                    }
                    else {
                        execute(row, col, className, isApply);
                    }

                    hot.render();
                }
            }
        },

        setCellMeta(elID, row, col, key, value) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }
                hot.setCellMeta(row, col, key, value);
            }
        },

        setDataAtRowProp(elID, row, col, value, source) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }
                hot.setDataAtRowProp(row, col, value, source);
            }
        },

        getCellMeta(elID, row, col) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }
                result = hot.getCellMeta(row, col);
            }
            return result;
        },

        getCellMetaAtRow(elID, row) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.getCellMetaAtRow(row);
            }
            return result;
        },

        getUpdateData(elID, requestType, metaColumns) {
            var result = [];
            var hot = $grid.getGridControl(elID);
            if (metaColumns) {
                if (requestType == 'Row') {
                    var physicalRowIndex = hot.toPhysicalRow($grid.getActiveRowIndex(elID));

                    if (physicalRowIndex != null && physicalRowIndex > -1) {
                        var rowData = hot.getSourceDataAtRow(physicalRowIndex);
                        var rowFlag = rowData.Flag ? rowData.Flag : 'C';
                        var rowMeta = hot.getCellMetaAtRow(physicalRowIndex);
                        if (rowFlag && rowFlag != 'S') {
                            rowData = $object.clone(rowData);

                            var data = {};
                            data.Flag = rowFlag;

                            for (var key in metaColumns) {
                                var column = metaColumns[key];
                                var rowValue = rowData[key];

                                data[column.fieldID] = rowValue;
                                if (rowValue === undefined) {
                                    data[column.fieldID] = column.dataType == 'number' ? null : $object.defaultValue(column.dataType);
                                } else {
                                    data[column.fieldID] = rowValue;
                                }
                            }

                            result.push(data);
                        }
                    }
                } else if (requestType == 'List') {
                    var length = hot.countSourceRows();

                    for (var rowIndex = 0; rowIndex < length; rowIndex++) {
                        var physicalRowIndex = hot.toPhysicalRow(rowIndex);

                        if (physicalRowIndex == null) {
                            continue;
                        }

                        var rowData = hot.getSourceDataAtRow(physicalRowIndex);
                        var rowFlag = rowData.Flag ? rowData.Flag : 'C';
                        var rowMeta = hot.getCellMetaAtRow(physicalRowIndex);
                        if (rowFlag && rowFlag != 'S') {
                            if (rowFlag != 'R') {
                                rowData = $object.clone(rowData);

                                var data = {};
                                data.Flag = rowFlag;

                                for (var key in metaColumns) {
                                    var column = metaColumns[key];
                                    var rowValue = rowData[key];

                                    data[column.fieldID] = rowValue;
                                    if (rowValue === undefined) {
                                        data[column.fieldID] = column.dataType == 'number' ? null : $object.defaultValue(column.dataType);
                                    } else {
                                        data[column.fieldID] = rowValue;
                                    }
                                }

                                result.push(data);
                            }
                        }
                    }
                }
            } else {
                syn.$l.eventLog('getUpdateData', 'Input Mapping 설정 없음', 'Debug');
            }

            return result;
        },

        validateColumns(elID, columns, callback) {
            var result = false;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.validateColumns(columns, callback);
            }
            return result;
        },

        validateRows(elID, rows, callback) {
            var result = false;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.validateRows(rows, callback);
            }
            return result;
        },

        getPhysicalRowIndex(elID, logicalRowIndex) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.toPhysicalRow(logicalRowIndex);
            }
            return result;
        },

        getPhysicalColIndex(elID, logicalColIndex) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.toPhysicalColumn(logicalColIndex);
            }
            return result;
        },

        getPhysicalColText(elID, columnText) {
            var result = -1;
            var head = syn.$l.querySelector(`#${elID} .handsontable thead tr`);
            if (head) {
                var childNodes = head.childNodes;
                for (var i = 0; i < childNodes.length; i++) {
                    var childNode = childNodes[i];
                    if (childNode.innerHTML.indexOf(`>${columnText}<`) > -1) {
                        result = i;
                        break;
                    }
                }
            }
            return result;
        },

        getLogicalRowIndex(elID, physicalRowIndex) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.toVisualRow(physicalRowIndex);
            }
            return result;
        },

        getLogicalColIndex(elID, physicalColIndex) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.toVisualColumn(physicalColIndex);
            }
            return result;
        },

        unHiddenColumns(elID) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var hiddenPlugin = hot.getPlugin('hiddenColumns');

                if (hiddenPlugin.isEnabled() == false) {
                    hiddenPlugin.enablePlugin();
                }

                var colCount = hot.countCols();
                var columns = [];
                for (var i = 0; i < colCount; i++) {
                    if (hot.colToProp(i) == 'Flag') {
                        continue;
                    }

                    if (hiddenPlugin.isHidden(i) == true) {
                        columns.push(i);
                    }
                }

                $grid.visibleColumns(elID, columns, true);
            }
        },

        isColumnHidden(elID, colIndex, isPhysicalIndex) {
            var result = false;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var hiddenPlugin = hot.getPlugin('hiddenColumns');

                if (hiddenPlugin.isEnabled() == false) {
                    hiddenPlugin.enablePlugin();
                }

                result = hiddenPlugin.isHidden(colIndex, isPhysicalIndex);
            }

            return result;
        },

        visibleColumns(elID, columns, isShow) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var hiddenPlugin = hot.getPlugin('hiddenColumns');

                if (hiddenPlugin.isEnabled() == false) {
                    hiddenPlugin.enablePlugin();
                }

                var gridSettings = hot.getSettings();
                var gridColumns = gridSettings.columns;

                if (isShow == true) {
                    if ($object.isNumber(columns) == true) {
                        gridColumns[columns].isHidden = false;
                        hiddenPlugin.showColumn(columns);
                    } else {
                        for (var i = 0; i < columns.length; i++) {
                            var column = gridColumns[columns[i]];
                            column.isHidden = false;
                        }
                        hiddenPlugin.showColumns(columns);
                    }
                } else {
                    if ($object.isNumber(columns) == true) {
                        gridColumns[columns].isHidden = true;
                        hiddenPlugin.hideColumn(columns);
                    } else {
                        for (var i = 0; i < columns.length; i++) {
                            var column = gridColumns[columns[i]];
                            column.isHidden = true;
                        }
                        hiddenPlugin.hideColumns(columns);
                    }
                }
                hot.render();
            }
        },

        unHiddenRows(elID) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var hiddenPlugin = hot.getPlugin('hiddenRows');

                if (hiddenPlugin.isEnabled() == false) {
                    hiddenPlugin.enablePlugin();
                }

                var rowCount = hot.countRows();
                var rows = [];
                for (var i = 0; i < rowCount; i++) {
                    if (hiddenPlugin.isHidden(i) == true) {
                        rows.push(i);
                    }
                }

                $grid.visibleRows(elID, rows, true);
            }
        },

        isRowHidden(elID, rowIndex, isPhysicalIndex) {
            var result = false;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var hiddenPlugin = hot.getPlugin('hiddenRows');

                if (hiddenPlugin.isEnabled() == false) {
                    hiddenPlugin.enablePlugin();
                }

                result = hiddenPlugin.isHidden(rowIndex, isPhysicalIndex);
            }

            return result;
        },

        visibleRows(elID, rows, isShow) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var hiddenRowsPlugin = hot.getPlugin('hiddenRows');

                if (hiddenRowsPlugin.isEnabled() == false) {
                    hiddenRowsPlugin.enablePlugin();
                }

                if (isShow == true) {
                    if ($object.isNumber(rows) == true) {
                        hiddenRowsPlugin.showRow(rows);
                    } else {
                        hiddenRowsPlugin.showRows(rows);
                    }
                } else {
                    if ($object.isNumber(rows) == true) {
                        hiddenRowsPlugin.hideRow(rows);
                    } else {
                        hiddenRowsPlugin.hideRows(rows);
                    }
                }
                hot.render();
            }
        },

        propToCol(elID, columnName) {
            var result = -1;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.propToCol(columnName);
            }

            return result;
        },

        getColHeader(elID, col) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.getColHeader(col);
            }

            return result;
        },

        colToProp(elID, col) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.colToProp(col);
            }

            return result;
        },

        countCols(elID) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.countCols();
            }

            return result;
        },

        getSelected(elID) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.getSelected();
            }

            return result;
        },

        getActiveRowIndex(elID) {
            var result = -1;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var selected = hot.getSelected();
                if (selected && selected.length > 0) {
                    result = hot.getSelected()[0][0];
                }
                else {
                    var gridValue = $grid.getGridValue(elID);
                    result = gridValue.previousRow;
                }
            }

            return result;
        },

        getActiveColIndex(elID) {
            var result = -1;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var selected = hot.getSelected();
                if (selected && selected.length > 0) {
                    result = hot.getSelected()[0][1];
                }
                else {
                    var gridValue = $grid.getGridValue(elID);
                    result = gridValue.previousCol;
                }
            }

            return result;
        },

        selectCell(elID, row, column, endRow, endColumn, scrollToCell, changeListener) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                if (row === -1) {
                    var hiddenRowCount = 0;
                    var hiddenRowsPlugin = hot.getPlugin('hiddenRows');

                    if (hiddenRowsPlugin.isEnabled() == false) {
                        hiddenRowsPlugin.enablePlugin();
                    }
                    hiddenRowCount = hiddenRowsPlugin ? hiddenRowsPlugin.hiddenRows.length : 0;
                    var sourceRowCount = hot.countSourceRows();
                    row = (sourceRowCount - hiddenRowCount) - 1;
                }

                hot.selectCell(row, column, endRow, endColumn, scrollToCell, changeListener);
            }
        },

        getExportPlugin(elID, options) {
            var result = null;
            var hot = $grid.getGridControl(elID);
            if (hot) {
                result = hot.getPlugin('exportFile');
                if (result.isEnabled() == false) {
                    result.enablePlugin();
                }
            }

            return result;
        },

        exportAsString(elID, options) {
            var result = null;

            var exportPlugin = $grid.getExportPlugin(elID, options);
            if (exportPlugin) {
                if ($object.isNullOrUndefined(options) == true) {
                    options = {};
                }

                var hot = $grid.getGridControl(elID);
                options = syn.$w.argumentsExtend({
                    exportHiddenRows: false,
                    exportHiddenColumns: false,
                    rowHeaders: false,
                    bom: false,
                    columnDelimiter: ',',
                    range: options.range ? options.range : [0, 1, hot.countRows(), hot.countCols() - 1],
                    filename: '{0}_{1}_{2}'.format(syn.$w.pageScript, elID, $date.toTicks(new Date()))
                }, options);

                options.columnHeaders = false;

                var gridColumns = hot.getSettings().columns;
                var exportColumns = [];
                var lowEnd = options.range ? options.range[1] : 1;
                var highEnd = options.range ? options.range[3] : hot.countCols() - 1;
                for (var i = lowEnd; i <= highEnd; i++) {
                    exportColumns.push(gridColumns[i]);
                }

                var columnIDs = exportColumns
                    .filter(function (item) { return options.exportHiddenColumns == true || item.isHidden == false; })
                    .map(function (item) { return item.columnText; });

                var exportString = exportPlugin.exportAsString('csv', options);
                result = columnIDs.join(',') + '\r\n' + exportString;
            }

            return result;
        },

        exportFile(elID, options) {
            var exportPlugin = $grid.getExportPlugin(elID, options);
            if (exportPlugin) {
                if ($object.isNullOrUndefined(options) == true) {
                    options = {};
                }

                options = syn.$w.argumentsExtend({
                    fileType: 'excel',
                    exportHiddenRows: false,
                    exportHiddenColumns: false,
                    columnHeaders: true,
                    rowHeaders: false,
                    bom: false,
                    columnDelimiter: ','
                }, options);

                if (options.fileType == 'excel') {
                    var hot = $grid.getGridControl(elID);
                    var gridSettings = hot.getSettings();

                    var gridColumns = gridSettings.columns;
                    var exportColumns = [];
                    var lowEnd = options.range ? options.range[1] : 1;
                    var highEnd = options.range ? options.range[3] : hot.countCols() - 1;
                    for (var i = lowEnd; i <= highEnd; i++) {
                        exportColumns.push(gridColumns[i]);
                    }

                    var columnIndexs = exportColumns
                        .filter(function (item) { return options.exportHiddenColumns == true || item.isHidden == false; })
                        .map(function (item, index) {
                            return {
                                index: hot.propToCol(item.data),
                                type: item.type
                            }
                        });

                    var defaultExportColumns = gridSettings.exportColumns
                        .map(function (item, index) {
                            return {
                                index: hot.propToCol(item.columnID),
                                type: item.type
                            }
                        });

                    columnIndexs = $object.extend(columnIndexs, defaultExportColumns);

                    var columnLength = columnIndexs.length;
                    var colWidths = gridSettings.colWidths;
                    var wsCols = [];
                    for (var i = 0; i < columnLength; i++) {
                        var columnIndex = columnIndexs[i].index;
                        wsCols.push({ wpx: colWidths[columnIndex] });
                    }

                    var value = $grid.exportAsString(elID, options);
                    var data = Papa.parse(value).data;
                    var dataLength = data.length;
                    var div = document.createElement("DIV");
                    for (var i = 0; i < columnLength; i++) {
                        if (columnIndexs[i].type == 'numeric') {
                            for (var j = 1; j < dataLength; j++) {
                                data[j][i] = $string.toParseType(data[j][i], 'number');
                            }
                        }
                        else if (columnIndexs[i].type.indexOf('html') > -1) {
                            for (var j = 1; j < dataLength; j++) {
                                div.innerHTML = data[j][i];
                                data[j][i] = div.textContent || div.innerText || '';
                            }
                        }
                    }
                    div = null;

                    var wb = XLSX.utils.book_new();
                    var newWorksheet = XLSX.utils.aoa_to_sheet(data);
                    newWorksheet['!cols'] = wsCols;
                    XLSX.utils.book_append_sheet(wb, newWorksheet, 'Sheet1');
                    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
                    syn.$l.blobToDownload(new Blob([$l.stringToArrayBuffer(wbout)], { type: "application/octet-stream" }), options.filename + '.xlsx');
                }
                else if (options.fileType == 'csv') {
                    var hot = $grid.getGridControl(elID);
                    options = syn.$w.argumentsExtend({
                        range: options.range ? options.range : [0, 1, hot.countRows(), hot.countCols()],
                        filename: '{0}_{1}_{2}'.format(syn.$w.pageScript, elID, $date.toTicks(new Date()))
                    }, options);

                    exportPlugin.downloadFile('csv', options);
                }
            }
        },

        importFile(elID, callback) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var fileEL = syn.$l.get('{0}_ImportFile'.format(elID));
                fileEL.callback = callback;
                fileEL.click();
            }
        },

        importFileLoad(evt) {
            var el = evt.srcElement || evt.target;
            var elID = el.id.split('_')[0];
            var gridSettings = $grid.getSettings(elID);

            var validExts = ['.csv', '.xls', '.xlsx'];
            var fileName = el.files[0].name;
            var fileExtension = fileName.substring(fileName.lastIndexOf('.') == -1 ? fileName.length : fileName.lastIndexOf('.'))

            if (fileExtension && validExts.indexOf(fileExtension) < 0) {
                syn.$w.alert('{0} 확장자를 가진 파일만 가능합니다'.format(validExts.toString()));
                return false;
            }

            var reader = new FileReader();
            reader.onload = function (file) {
                var columnDelimiter = ',';
                el.value = '';
                var data = file.target.result;
                var hot = $grid.getGridControl(elID);
                if (fileExtension == '.csv') {
                    var lines = data.split(/\r\n|\n/);

                    if (lines.length == 0) {
                        $grid.clear(elID);
                    }
                    else if (lines.length > 0) {
                        var result = [];
                        var headers = lines[0].split(columnDelimiter);
                        var bindColumns = [];
                        var columns = gridSettings.columns.map(function (item) { return item.data; });
                        var columnTypes = gridSettings.columns.map(function (item) { return item.type; });
                        for (var i = 0; i < headers.length; i++) {
                            var value = headers[i];
                            value = value.replace(/^["]/, '');
                            value = value.replace(/["]$/, '');
                            headers[i] = value;

                            var colIndex = gridSettings.colHeaders.indexOf(value);
                            if (colIndex == -1) {
                                syn.$w.alert('올바른 형식의 파일이 아닙니다.\n파일을 확인해주세요.');
                                return false;
                            }

                            var columnIndex = hot.propToCol(columns[colIndex]);
                            bindColumns.push({
                                headerIndex: i,
                                columnID: columns[colIndex],
                                columnIndex: columnIndex,
                                columnType: columnTypes[colIndex]
                            });
                        }

                        var line = lines[1];
                        var values = line.split(columnDelimiter);
                        for (var i = 0; i < bindColumns.length; i++) {
                            var bindColumn = bindColumns[i];
                            var value = values[i];
                            value = value.replace(/^["]/, '');
                            value = value.replace(/["]$/, '');

                            var isTypeCheck = true;
                            switch (bindColumn.columnType) {
                                case 'checkbox':
                                case 'checkbox2':
                                    isTypeCheck = $string.toBoolean(value);
                                    break;
                                case 'numeric':
                                    if (value == null) {
                                        value = 0;
                                    }

                                    isTypeCheck = $object.isNumber(value) == true ? true : $string.isNumber(value);
                                    break;
                                case 'date':
                                    if (value == null) {
                                        isTypeCheck = true;
                                    } else {
                                        isTypeCheck = $object.isDate(value);
                                    }
                                    break;
                                default:
                                    if (value == null) {
                                        value = '';
                                    }

                                    isTypeCheck = $object.isString(value);
                                    break;
                            }

                            if (isTypeCheck == false) {
                                syn.$w.alert('올바른 형식의 파일이 아닙니다.\n파일을 확인해주세요.');
                                return false;
                            }
                        }

                        for (var i = 1; i < lines.length; i++) {
                            line = lines[i];
                            if ($string.isNullOrEmpty(line) == false) {
                                var obj = {};
                                var values = lines[i].split(columnDelimiter);
                                for (var j = 0; j < bindColumns.length; j++) {
                                    var bindColumn = bindColumns[j];
                                    var value = values[j];
                                    if ($object.isNullOrUndefined(value) == true) {
                                        value = '';
                                    }
                                    else {
                                        value = value.replace(/^["]/, '');
                                        value = value.replace(/["]$/, '');
                                    }

                                    if (bindColumn.columnType == 'numeric') {
                                        if (value != null) {
                                            value = $object.isNumber(value) == true ? value : Number(value);
                                        }
                                    }

                                    obj[bindColumn.columnID] = value;
                                }

                                result.push(obj);
                            }
                        }
                    }
                }
                else {
                    var columns = gridSettings.columns.map(function (item) { return item.data; });
                    var workbook = XLSX.read(data, { type: 'binary' });
                    var sheet = workbook.Sheets[workbook.SheetNames[0]];
                    var range = XLSX.utils.decode_range(sheet['!ref']);
                    for (var C = range.s.c; C <= range.e.c; ++C) {
                        var cellref = XLSX.utils.encode_cell({ c: C, r: 0 });
                        var cell = sheet[cellref];
                        if (cell == undefined) {
                            break;
                        }

                        var columnText = cell.v;
                        var colIndex = gridSettings.colHeaders.indexOf(columnText);
                        if (colIndex == -1) {
                            syn.$w.alert('올바른 형식의 파일이 아닙니다.\n파일을 확인해주세요.');
                            return false;
                        }

                        var columnID = columns[colIndex];
                        cell.v = columnID;
                        cell.h = columnID;
                        cell.w = columnID;
                    }

                    result = XLSX.utils.sheet_to_json(sheet);
                }

                var metaColumns = {};
                for (var k = 0; k < gridSettings.columns.length; k++) {
                    var column = gridSettings.columns[k];
                    var dataType = 'string'
                    switch (column.type) {
                        case 'radio':
                        case 'checkbox':
                        case 'checkbox2':
                            dataType = 'bool';
                            break;
                        case 'numeric':
                            dataType = 'numeric';
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

                $grid.clear(elID);
                $grid.setValue(elID, result, metaColumns);
                var col = hot.propToCol('Flag');

                var rowCount = hot.countRows(elID);
                var flags = [];
                for (var i = 0; i < rowCount; i++) {
                    flags.push([i, col, 'C']);
                }
                hot.setDataAtCell(flags);

                if (el.callback) {
                    el.callback(fileName);
                }
            };

            if (fileExtension == '.csv') {
                reader.readAsText(el.files[0]);
            }
            else {
                reader.readAsBinaryString(el.files[0]);
            }
        },

        getGridControl(elID) {
            var result = null;

            var length = $grid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $grid.gridControls[i];
                if (item.id == elID) {
                    result = item.hot;
                    break;
                }
            }

            return result;
        },

        getGridValue(elID) {
            var result = null;

            var length = $grid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $grid.gridControls[i];
                if (item.id == elID) {
                    result = item.value;
                    break;
                }
            }

            return result;
        },

        getGridSetting(elID) {
            var result = null;

            var length = $grid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $grid.gridControls[i];
                if (item.id == elID) {
                    result = item.setting;
                    break;
                }
            }

            return result;
        },

        getColumnWidths(elID) {
            var result = [];

            var hot = $grid.getGridControl(elID);
            if (hot) {
                var colCount = hot.countCols();

                for (var i = 0; i < colCount; i++) {
                    result.push(hot.getColWidth(i));
                }
            }

            return result;
        },

        setColumnWidth(elID, col, width) {
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var columnResizePlugin = hot.getPlugin('manualColumnResize');

                if (columnResizePlugin.isEnabled() == false) {
                    columnResizePlugin.enablePlugin();
                }

                if ($object.isString(col) == true) {
                    col = hot.propToCol(col);
                }

                if ($object.isNumber(width) == true) {
                    columnResizePlugin.setManualSize(col, width);
                }
            }
        },

        setControlSize(elID, size) {
            var el = syn.$l.get(elID);
            if (el && size) {
                if (size.width) {
                    el.style.width = size.width;
                }

                if (size.height) {
                    el.style.height = size.height;
                }

                $grid.getGridControl(elID).render();
            }
        },

        getValue(elID, requestType, metaColumns) {
            var result = [];
            var items = $grid.getUpdateData(elID, requestType, metaColumns);
            var length = items.length;
            for (var i = 0; i < length; i++) {
                var item = items[i];

                var row = [];
                for (var key in item) {
                    var serviceObject = { prop: key, val: item[key] };
                    row.push(serviceObject);
                }
                result.push(row);
            }
            return result;
        },

        setValue(elID, value, metaColumns) {
            var error = '';
            var hot = $grid.getGridControl(elID);
            if (hot) {
                var gridSettings = hot.getSettings();
                if (gridSettings && value && value.length > 0) {
                    if ($object.isNullOrUndefined(metaColumns) == false) {
                        var item = value[0];
                        for (var column in item) {
                            var isTypeCheck = false;
                            var metaColumn = metaColumns[column];
                            if (metaColumn) {
                                switch (metaColumn.dataType.toLowerCase()) {
                                    case 'string':
                                        isTypeCheck = item[column] == null || $object.isString(item[column]) || $string.isNumber(item[column]);
                                        break;
                                    case 'bool':
                                        isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isBoolean(item[column]);
                                        break;
                                    case 'number':
                                    case 'numeric':
                                        isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $string.isNumber(item[column]) || $object.isNumber(item[column]);
                                        break;
                                    case 'date':
                                        isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isDate(item[column]);
                                        break;
                                    default:
                                        isTypeCheck = false;
                                        break;
                                }

                                if (isTypeCheck == false) {
                                    syn.$l.eventLog('syn.uicontrols.$grid', '바인딩 데이터 타입과 매핑 정의가 다름, 바인딩 ID - "{0}", 타입 - "{1}"'.format(column, metaColumn.dataType), 'Warning');
                                    return;
                                }
                            } else {
                                continue;
                            }
                        }

                        var columnInfos = gridSettings.columns;
                        var dropdownColumns = [];

                        for (var i = 0; i < columnInfos.length; i++) {
                            var columnInfo = columnInfos[i];
                            if (columnInfo.type == 'dropdown') {
                                dropdownColumns.push(columnInfo);
                            }
                        }

                        if (dropdownColumns.length > 0) {
                            for (var i = 0; i < dropdownColumns.length; i++) {
                                var columnInfo = dropdownColumns[i];
                                var dataSource = columnInfo.dataSource;
                                if (dataSource) {
                                    for (var j = 0; j < value.length; j++) {
                                        var code = value[j][columnInfo.codeColumnID];
                                        for (var k = 0; k < dataSource.DataSource.length; k++) {
                                            var item = dataSource.DataSource[k];
                                            if (item[dataSource.CodeColumnID] == code) {
                                                value[j][columnInfo.data] = item[dataSource.ValueColumnID];
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    $grid.loadData(elID, value);
                    $grid.renderSummary(hot);
                } else {
                    $grid.loadData(elID, []);
                    $grid.renderSummary(hot);
                }
            }
        },

        renderSummary(hot) {
            var gridSettings = hot.getSettings();
            if (gridSettings.summarys && gridSettings.summarys.length > 0) {
                var setting = {
                    index: hot.countRows(),
                    amount: 1
                };

                hot.alter('insert_row_below', setting.index, setting.amount);
                hot.render();

                var gridValue = $grid.getGridValue(hot.elID);
                gridValue.applyCells = true;

                $grid.refreshSummary(hot.elID);
            }
        },

        refreshSummary(elID) {
            var hot = $grid.getGridControl(elID);
            var gridSettings = hot.getSettings();
            if (gridSettings.summarys && gridSettings.summarys.length > 0) {
                var lastRowIndex = gridSettings.data.length - 1;
                var rowValue = [];
                var length = gridSettings.summarys.length;
                var calcFunction = function (val) {
                    return ($string.isNullOrEmpty(val) == true || $string.isNumber(val) == false) ? 0 : parseFloat($object.isNumber(val) ? val : $string.toNumber(val));
                };

                for (var i = 0; i < length; i++) {
                    var summary = 0;
                    var summaryColumn = gridSettings.summarys[i];
                    var col = hot.propToCol(summaryColumn.columnID);
                    var columnMap = gridSettings.data.map(function (item) { return item.Flag && item.Flag != 'S' && item[summaryColumn.columnID]; });
                    if (columnMap.length > 0) {
                        var columnData = JSON.parse(JSON.stringify(columnMap));
                        switch (summaryColumn.type) {
                            case 'min':
                                $array.sort(columnData, true);
                                var val = columnData[0];
                                summary = calcFunction(val);
                                break;
                            case 'max':
                                $array.sort(columnData, false);
                                var val = columnData[0];
                                summary = calcFunction(val);
                                break;
                            case 'avg':
                                for (var j = 0; j < columnData.length; j++) {
                                    var val = columnData[j];
                                    summary += calcFunction(val);
                                }

                                summary = summary / columnData.length;
                                break;
                            case 'sum':
                                for (var j = 0; j < columnData.length; j++) {
                                    var val = columnData[j];
                                    summary += calcFunction(val);
                                }
                                break;
                            case 'count':
                                summary = columnData.length - 1;
                                break;
                            case 'custom':
                                var mod = window[syn.$w.pageScript];
                                if (mod) {
                                    var eventHandler = mod.event['{0}_customSummary'.format(hot.elID)];
                                    if (eventHandler) {
                                        summary = eventHandler.apply(hot, [hot.elID, summaryColumn.columnID, col, columnData]);
                                    }
                                }
                                break;
                        }

                        if (summaryColumn.type != 'custom') {
                            if ($object.isNullOrUndefined(summaryColumn.fixed) == true) {
                                summary = summary.toFixed(summaryColumn.type == 'avg' ? '1' : '0');
                            }
                            else {
                                summary = summary.toFixed(summaryColumn.fixed);
                            }

                            if ($object.isNullOrUndefined(summaryColumn.format) == true) {
                                summary = $string.toCurrency(summary);
                            }
                            else {
                                if (summaryColumn.format === true) {
                                    summary = $string.toCurrency(summary);
                                }
                                else {
                                    summary = summary.toString();
                                }
                            }
                        }

                        rowValue.push([lastRowIndex, col, summary]);
                    }
                }

                rowValue.push([lastRowIndex, 0, 'S']);
                hot.setDataAtCell(rowValue);
            }
        },

        clear(elID, isControlLoad) {
            $grid.loadData(elID, []);
        },

        setTransactionBelongID(elID, belongFlow, transactConfig) {
            var el = syn.$l.get(elID + '_hidden') || syn.$l.get(elID);
            var synOptions = JSON.parse(el.getAttribute('syn-options'));

            if (synOptions == null) {
                return;
            }

            for (var i = 0; i < synOptions.columns.length; i++) {
                var column = synOptions.columns[i];
                var dataType = 'string'
                switch (column.columnType) {
                    case 'checkbox':
                        dataType = 'bool';
                        break;
                    case 'numeric':
                        dataType = 'numeric';
                        break;
                    case 'number':
                        dataType = 'number';
                        break;
                    case 'date':
                        dataType = 'date';
                        break;
                }

                if ($object.isNullOrUndefined(transactConfig) == true) {
                    belongFlow.items[column.data] = {
                        fieldID: column.data,
                        dataType: dataType
                    };
                }
                else {
                    var isBelong = false;
                    if (column.data == 'Flag') {
                        isBelong = true;
                    }
                    else if (column.belongID) {
                        if ($object.isString(column.belongID) == true) {
                            isBelong = transactConfig.functionID == column.belongID;
                        }
                        else if ($object.isArray(column.belongID) == true) {
                            isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                        }
                    }

                    if (isBelong == true) {
                        belongFlow.items[column.data] = {
                            fieldID: column.data,
                            dataType: dataType
                        };
                    }
                }
            }
        },

        checkEditValue(elID) {
            return $grid.getDataAtCol(elID, 'Flag').filter((item) => { return $string.isNullOrEmpty(item) == false && item != 'R' }).length > 0;
        },

        checkUniqueValueCol(elID, column) {
            var result = false;
            var vaildateData = $grid.getSourceDataAtCol(elID, column);
            result = !vaildateData.filter(function (row, index) { return (vaildateData.indexOf(row) !== index) }).length > 0
            return result;
        },

        checkValueCountCol(elID, column, checkValue) {
            return $grid.getDataAtCol(elID, column).filter((item) => { return item === checkValue }).length;
        },

        checkEmptyValueCol(elID, column, checkValue) {
            var result = false;
            if ($object.isNullOrUndefined(checkValue) == true) {
                if ($grid.countRows(elID) == 0) {
                    result = false;
                }
                else {
                    result = $grid.getDataAtCol(elID, column).filter((item) => { return $string.isNullOrEmpty(item) == true }).length > 0;
                }
            }
            else {
                result = $grid.getDataAtCol(elID, column).filter((item) => { return item === checkValue }).length > 0;
            }
            return result;
        },

        checkEmptyValueCols(elID, columns, checkValue) {
            var items = $grid.getSettings(elID).data;

            for (var i = 0, length = items.length; i < length; i++) {
                var item = items[i];

                var checkResult = false;
                for (var j = 0; j < columns.length; j++) {
                    var column = columns[j];

                    if ($object.isNullOrUndefined(checkValue) == true) {
                        if ($string.isNullOrEmpty(item[column]) == true) {
                            checkResult = true;
                        }
                        else {
                            checkResult = false;
                            break;
                        }
                    }
                    else {
                        if ($string.isNullOrEmpty(item[column]) == true || item[column] === checkValue) {
                            checkResult = true;
                        }
                        else {
                            checkResult = false;
                            break;
                        }
                    }
                }

                if (checkResult == true) {
                    return checkResult;
                }
            }
            return false;
        },

        setLocale(elID, translations, control, options) {
            var el = syn.$l.get(elID);
            var bind = $resource.getBindSource(control);
            if (bind != null) {
                // var value = $resource.translateText(control, options);
                // if (value) {
                //     el[bind] = value;
                // }
            }
            // debugger;
        }
    });
    syn.uicontrols.$grid = $grid;
})(window);
