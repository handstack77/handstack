/// <reference path='/js/syn.js' />

(function (window) {
    'use strict';

    if (window.AUIGrid) {
        window.AUIGrid.TextareaEditor = window.AUIGrid.Class({
            tagName: 'div',
            element: null,
            cssClass: 'aui-grid-edit-renderer-custom aui-grid-edit-renderer-custom-textarea',
            data: null,
            columnData: null,
            columnIndex: -1,
            rowIndex: -1,
            dataField: '',
            extraProps: null,
            __textareaEle: null,

            destroy: function (unload) {
                this.__textarea.removeEventListener('keyup', this.__textareaKeyUpHandler);
                this.__confirmBtn.removeEventListener('click', this.__confirmBtnClickHandler);
                this.__cancelBtn.removeEventListener('click', this.__cancelBtnClickHandler);

                this.__textarea = null;
                this.__confirmBtn = null;
                this.__cancelBtn = null;

                this.$super.destroy(unload);
            },

            create: function () {
                var extraProps = this.extraProps;

                this.__textarea = document.createElement('textarea');
                var measureWidth = (text) => {
                    var el = document.createElement('div');

                    el.style.position = 'absolute';
                    el.style.visibility = 'hidden';
                    el.style.whiteSpace = 'nowrap';
                    el.style.left = '-9999px';
                    el.innerText = text;

                    document.body.appendChild(el);
                    var width = window.getComputedStyle(el).width;
                    document.body.removeChild(el);
                    return width;
                }

                var measureHeight = (text, width) => {
                    var el = document.createElement('div');

                    el.style.position = 'absolute';
                    el.style.visibility = 'hidden';
                    el.style.width = width;
                    el.style.left = '-9999px';
                    el.innerText = text;

                    document.body.appendChild(el);
                    var height = window.getComputedStyle(el).height;
                    document.body.removeChild(el);
                    return height;
                }

                var documentWidth = document.documentElement.clientWidth || document.body.clientWidth || 0;
                var documentHeight = document.documentElement.clientHeight || document.body.clientHeight || 0;
                var frameWidth = documentWidth - 200;
                var frameHeight = documentHeight / 2 - 60;
                var textWidth = parseInt(measureWidth(this.labelText).replace('px', ''));
                var textHeight = parseInt(measureHeight(this.labelText).replace('px', ''));

                var columnWidth = parseInt(this.columnData.width);

                if (frameWidth < columnWidth) {
                    frameWidth = columnWidth;
                }

                if (frameWidth < textWidth) {
                    textWidth = frameWidth;
                }

                if (frameHeight < textHeight) {
                    textHeight = frameHeight;
                }

                if (textWidth < columnWidth) {
                    textWidth = columnWidth;
                }

                var minHeight = (extraProps && extraProps.minHeight) ? extraProps.minHeight : 60;
                if (textHeight < minHeight) {
                    textHeight = minHeight;
                }

                this.__textarea.setAttribute('spellcheck', 'false');
                this.__textarea.style.width = `${textWidth}px`;
                this.__textarea.style.height = `${textHeight}px`;
                this.__textarea.value = this.data[this.dataField];
                this.__textareaKeyUpHandler = this.__textareaKeyUpHandler.bind(this);
                this.__textarea.addEventListener('keyup', this.__textareaKeyUpHandler);
                this.element.appendChild(this.__textarea);

                this.__confirmBtn = document.createElement('button');
                this.__confirmBtn.className = 'custom-textarea-confirm-btn';
                this.__confirmBtn.innerText = extraProps.confirm || '확 인';
                this.__confirmBtnClickHandler = this.__confirmBtnClickHandler.bind(this);
                this.__confirmBtn.addEventListener('click', this.__confirmBtnClickHandler);

                this.__cancelBtn = document.createElement('button');
                this.__cancelBtn.className = 'custom-textarea-cancel-btn';
                this.__cancelBtn.innerText = extraProps.cancel || '취 소';
                this.__cancelBtnClickHandler = this.__cancelBtnClickHandler.bind(this);
                this.__cancelBtn.addEventListener('click', this.__cancelBtnClickHandler);

                this.element.appendChild(this.__confirmBtn);
                this.element.appendChild(this.__cancelBtn);

                setTimeout(
                    function () {
                        document.getElementsByClassName('aui-grid-edit-renderer-custom')[0].style.width = null;
                        this.__textarea.style.minWidth = '240px';
                        this.__textarea.focus();
                        this.__textarea.select();
                    }.bind(this)
                );
            },

            triggerEditEndEvent: function (newValue, which) {
                this.$super.triggerEditEndEvent(newValue, which);
            },

            triggerEditCancelEvent: function (which) {
                this.$super.triggerEditCancelEvent(which);
            },

            injectValue: function (value) {
                this.$super.injectValue(value);
            },

            __textareaKeyUpHandler: function (evt) {
                if (evt.keyCode == 13 && evt.ctrlKey) {
                    evt.preventDefault();
                    this.triggerEditEndEvent(this.__textarea.value);
                    return;
                } else if (evt.keyCode == 27) {
                    evt.preventDefault();
                    this.triggerEditCancelEvent();
                    return;
                }

                if (evt.keyCode != 13) this.injectValue(this.__textarea.value);
            },

            __confirmBtnClickHandler: function (evt) {
                this.triggerEditEndEvent(this.__textarea.value);
            },

            __cancelBtnClickHandler: function (evt) {
                this.triggerEditCancelEvent();
            }
        }).extend(window.AUIGrid.EditRendererBase);
    }

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $auigrid = syn.uicontrols.$auigrid || new syn.module();

    $auigrid.extend({
        name: 'syn.uicontrols.$auigrid',
        version: 'v2025.12.11',

        gridControls: [],
        gridCodeDatas: [],
        nowHeaderMenuVisible: false,
        currentDataField: null,
        codeHelpUrl: '/assets/shared/codehelp/index2.html',
        gridOptions: {
            headerHeight: 40,
            rowHeight: 40,
            showFooter: false,
            footerPosition: 'bottom',
            enableClipboard: true,
            wrapSelectionMove: false,
            fillColumnSizeMode: false,
            enableCellMerge: false,
            cellMergeRowSpan: true,
            cellMergePolicy: 'default',
            fixedRowCount: 0,
            fixedColumnCount: 0,
            showRowNumColumn: true,
            showStateColumn: false,
            showRowCheckColumn: false,
            rowCheckToRadio: false,
            showDragKnobColumn: false,
            enableDrag: false,
            enableDrop: false,
            enableSorting: true,
            enableMovingColumn: false,
            wordWrap: false,
            editable: true,
            enterKeyColumnBase: true,
            selectionMode: 'multipleCells',
            hoverMode: 'singleRow',
            useContextMenu: true,
            enableFilter: true,
            showInlineFilter: false,
            showEditedCellMarker: false,
            useGroupingPanel: false,
            showStateColumn: false,
            displayTreeOpen: false,
            simplifySelectionEvent: true,
            softRemoveRowMode: false,
            allowClipboardPaste: false,
            applyRestPercentWidth: true,
            copyDisplayFunction: (rowIndex, columnIndex, value, item, columnItem) => {
                if (columnItem.editRenderer && (columnItem.editRenderer.type == 'DropDownListRenderer'
                    || columnItem.columnType == 'password'
                )) {
                    return true;
                }
                return false;
            },
            rowNumHeaderText: '',
            noDataMessage: '',
            groupingMessage: '여기에 컬럼을 드래그하면 그룹핑이 됩니다.',
            rowStyleFunction: (rowIndex, item) => {
                if (item._$isGroupSumField) {
                    switch (item._$depth) {
                        case 2:
                            return 'aui-grid-row-depth1-style';
                        case 3:
                            return 'aui-grid-row-depth2-style';
                        case 4:
                            return 'aui-grid-row-depth3-style';
                        default:
                            return 'aui-grid-row-depth-default-style';
                    }
                }

                return null;
            }
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);
            var gridID = '#' + elID;
            setting = syn.$w.argumentsExtend($auigrid.gridOptions, setting);

            var columnLayout = null;
            if (setting.columns) {
                var flagColumn = setting.columns.find(function (item) { return item.length > 0 && item[0] == 'Flag'; });
                if ($object.isNullOrUndefined(flagColumn) == true) {
                    setting.columns.unshift(['Flag', 'Flag', 60, true, 'text', true, 'left']);
                }
                columnLayout = $auigrid.getInitializeColumns(elID, setting.columns, setting.editable);
            }

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                setting.columnLayout = columnLayout;
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);

                columnLayout = $object.clone(setting.columnLayout);
                delete setting.columnLayout;
            }

            setting.width = setting.width || '100%';
            if ($object.isNumber(setting.width) == true) {
                setting.width = setting.width + 'px';
            }

            setting.height = setting.height || '240px';
            if ($object.isNumber(setting.height) == true) {
                setting.height = setting.height + 'px';
            }

            setting.columns = columnLayout || setting.columns || [];
            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var className = el.getAttribute('class') || '';
            var dataField = el.getAttribute('syn-datafield');
            var html = `<div id="{0}" class="syn-auigrid ${className}" style="width:${setting.width};height:${setting.height};overflow:hidden;"></div>`.format(elID, dataField);

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.innerHTML = html;

            parent.appendChild(wrapper);

            var fileEL = document.createElement('input');
            fileEL.id = '{0}_ImportFile'.format(elID);
            fileEL.type = 'file';
            fileEL.style.display = 'none';
            fileEL.accept = '.csv, .xls, .xlsx';
            syn.$l.addEvent(fileEL, 'change', $auigrid.importFileLoad);
            parent.appendChild(fileEL);

            var controlSetting = $object.clone(setting);
            $auigrid.gridControls.push({
                id: elID,
                gridID: AUIGrid.create(gridID, columnLayout, controlSetting),
                setting: controlSetting
            });

            if (setting.grandTotals) {
                $auigrid.setFooter(elID, setting.grandTotals);
            }

            if (mod) {
                // https://www.auisoft.net/documentation/auigrid/DataGrid/Events.html
                var gridHookEvents = el.getAttribute('syn-events') || [];
                try {
                    if (gridHookEvents) {
                        gridHookEvents = eval(gridHookEvents);

                        var bypassHookEvents = ['cellEditEndBefore', 'cellEditEnd'];
                        for (var i = 0, length = gridHookEvents.length; i < length; i++) {
                            var hook = gridHookEvents[i];
                            var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                            if (bypassHookEvents.includes(hook) == false && eventHandler) {
                                AUIGrid.bind(gridID, hook, eventHandler);
                            }
                        }

                        if (gridHookEvents.includes('clipboardPaste') == true && gridHookEvents.indexOf('pasteBegin') == -1) {
                            AUIGrid.bind(gridID, 'pasteBegin', function (evt) {
                                var elID = evt.pid.substring(1);
                                var setting = $auigrid.getGridSetting(elID);
                                if ($string.toBoolean(setting.allowClipboardPaste) == false) {
                                    return false;
                                }

                                var mod = window[syn.$w.pageScript];
                                var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, 'clipboardPaste')] : null;
                                if (eventHandler) {
                                    const clipboardData = eventHandler(elID, evt.clipboardData);
                                    if ($object.isNullOrUndefined(clipboardData) == false && clipboardData.length > 0 && clipboardData[0].length > 0 && $object.isArray(clipboardData) == true && $object.isArray(clipboardData[0]) == true) {
                                        return clipboardData;
                                    }
                                }
                                return false;
                            });
                        }

                        if (gridHookEvents.includes('afterSelectionEnd') == true && gridHookEvents.indexOf('selectionChange') == -1) {
                            AUIGrid.bind(gridID, 'selectionChange', function (evt) {
                                var elID = evt.pid.substring(1);
                                var mod = window[syn.$w.pageScript];
                                var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, 'afterSelectionEnd')] : null;
                                if (eventHandler) {
                                    var primeCell = evt.primeCell;
                                    var rowIndex = primeCell.rowIndex;
                                    var columnIndex = primeCell.columnIndex;
                                    var dataField = primeCell.dataField;
                                    var value = primeCell.value;
                                    var editable = primeCell.editable;
                                    var item = primeCell.item;

                                    eventHandler(elID, rowIndex, columnIndex, dataField, value, editable, item);
                                }
                            });
                        }

                        AUIGrid.bind(gridID, 'cellEditEndBefore', function (evt) {
                            var gridID = evt.pid;
                            var elID = gridID.substring(1);
                            var rowIndex = evt.rowIndex;
                            var columnIndex = evt.columnIndex;
                            var dataField = evt.dataField;
                            var item = evt.item;
                            var oldValue = evt.oldValue;
                            var newValue = evt.value;

                            var mod = window[syn.$w.pageScript];
                            var columns = AUIGrid.getColumnInfoList(gridID);
                            var columnInfo = columns.find((item) => { return item.dataField == dataField });
                            if (columnInfo && columnInfo.columnType == 'dropdown' && $string.isNullOrEmpty(columnInfo.nameColumnID) == false) {
                                if (rowIndex > -1) {
                                    var storeSourceID = columnInfo.storeSourceID || columnInfo.dataSourceID;
                                    if (storeSourceID) {
                                        if (mod.config && mod.config.dataSource) {
                                            var keyValueList = mod.config.dataSource[storeSourceID] ? mod.config.dataSource[storeSourceID].DataSource : [];
                                            var keyValue = keyValueList.find((item) => { return item.CodeID == newValue });
                                            if (keyValue) {
                                                AUIGrid.setCellValue(gridID, rowIndex, columnInfo.nameColumnID, keyValue.CodeValue);
                                            }
                                        }
                                    }
                                }
                            }

                            var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, 'cellEditEndBefore')] : null;
                            if (eventHandler) {
                                var value = eventHandler(elID, evt);
                                if ($object.isNullOrUndefined(value) == false) {
                                    newValue = value;
                                }
                            }

                            return newValue;
                        });

                        AUIGrid.bind(gridID, 'cellEditEnd', function (evt) {
                            var elID = evt.pid.substring(1);
                            var eventHandler1 = mod.event ? mod.event['{0}_{1}'.format(elID, 'cellEditEnd')] : null;
                            if (eventHandler1) {
                                eventHandler1(elID, evt);
                            }

                            var eventHandler2 = mod.event ? mod.event['{0}_{1}'.format(elID, 'afterChange')] : null;
                            if (eventHandler2) {
                                var rowIndex = evt.rowIndex;
                                var columnIndex = evt.columnIndex;
                                var dataField = evt.dataField;
                                var oldValue = evt.oldValue;
                                var newValue = evt.value;
                                var item = evt.item;

                                eventHandler2(elID, rowIndex, columnIndex, dataField, oldValue, newValue, item);
                            }
                        });

                        if (gridHookEvents.indexOf('contextMenu') == -1) {
                            if (syn.$l.get('auigridHeaderContextMenu') == null) {
                                var contextEL = document.createElement('ul');
                                contextEL.id = 'auigridHeaderContextMenu';
                                contextEL.className = 'aui-grid-context-ui-menu';
                                contextEL.style.cssText = 'position: absolute; display: none; z-index: 100; padding: 16px;';

                                var li1 = document.createElement('li');
                                li1.id = 'headerItem1';
                                li1.textContent = '오름차순 정렬';
                                contextEL.appendChild(li1);

                                var li2 = document.createElement('li');
                                li2.id = 'headerItem2';
                                li2.textContent = '내림차순 정렬';
                                contextEL.appendChild(li2);

                                var li3 = document.createElement('li');
                                li3.id = 'headerItem3';
                                li3.textContent = '정렬 초기화';
                                contextEL.appendChild(li3);

                                contextEL.appendChild(document.createElement('li'));

                                var li4 = document.createElement('li');
                                li4.id = 'headerItem4';
                                li4.textContent = '현재 칼럼 숨기기';
                                contextEL.appendChild(li4);

                                var li5 = document.createElement('li');
                                li5.id = 'headerItem5';
                                li5.textContent = '모든 칼럼 보이기';
                                contextEL.appendChild(li5);

                                var li6 = document.createElement('li');
                                li6.id = 'headerItem6';
                                li6.textContent = '컬럼 숨김 복원하기';
                                contextEL.appendChild(li6);

                                document.body.appendChild(contextEL);

                                syn.$l.addEvent(document, 'click', function (evt) {
                                    $auigrid.hideContextMenu();
                                });

                                AUIGrid.bind(gridID, 'vScrollChange', function (evt) {
                                    $auigrid.hideContextMenu();
                                });

                                AUIGrid.bind(gridID, 'hScrollChange', function (evt) {
                                    $auigrid.hideContextMenu();
                                });
                            }

                            AUIGrid.bind(gridID, 'contextMenu', $auigrid.contextEventHandler);
                        }
                    }
                } catch (error) {
                    syn.$l.eventLog('AUIGrid_gridHookEvents', error.toString(), 'Debug');
                }
            }
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

        // columns = [{
        //    0 columnID: '',
        //    1 columnText: '',
        //    2 width: '',
        //    3 isHidden: '',
        //    4 columnType: '',
        //    5 readOnly: '',
        //    6 alignConstants: '',
        //    7 belongID: '',
        //    8 options: { sorting: true, placeholder: 'Empty Cell' }
        //    9 children: [columns]
        // }]
        getInitializeColumns(elID, columns, editable) {
            var result = [];
            var length = columns.length;
            for (var i = 0; i < length; i++) {
                var column = columns[i];

                var columnID = column[0];
                var columnText = column[1];
                var width = column[2];
                var isHidden = column[3];
                var columnType = column[4];
                var readOnly = column[5];
                var alignConstants = column[6];
                var belongID = column[7];
                var options = column[8];
                var children = column[9];

                var columnInfo = {
                    elID: elID,
                    headerText: columnText,
                    columnType: columnType,
                    filter: {
                        enable: true,
                        showIcon: true
                    },
                    isHidden: isHidden,
                    visible: !isHidden,
                    editable: $string.toBoolean(editable) == false ? false : !$string.toBoolean(readOnly),
                    style: $object.isNullOrUndefined(alignConstants) == true ? '' : `text:${alignConstants}!`,
                    belongID: $object.isNullOrUndefined(belongID) == true ? '' : ($object.isArray(belongID) == true ? belongID.join(',') : belongID),
                    validators: null
                };

                if ($object.isNullOrUndefined(columnID) == false) {
                    columnInfo.dataField = columnID;
                }

                if ($object.isNullOrUndefined(width) == false && width > 0) {
                    columnInfo.width = width;
                }

                if (options) {
                    for (var option in options) {
                        if (columnInfo[option] || option == '') {
                            if (option == 'style') {
                                columnInfo[option] = columnInfo[option] + ' ' + options[option];
                            }

                            continue;
                        }

                        if (option == 'filterEnable') {
                            columnInfo.filter = $string.toBoolean(options[option]);
                            columnInfo.showIcon = $string.toBoolean(options[option]);
                        }

                        columnInfo[option] = options[option];
                    }
                }

                if ($string.toBoolean(readOnly) == true) {
                    columnInfo.style = columnInfo.style + ' column-readonly';
                }

                if (columnInfo.validators && columnInfo.validators.indexOf('require') > -1) {
                    columnInfo.style = columnInfo.style + ' column-required';
                }

                var dataSource = null;
                if ($object.isString(columnType) == true) {
                    switch (columnType) {
                        case 'text':
                            if ($string.isNullOrEmpty(columnInfo.cellButtonIcon) == false) {
                                columnInfo.renderer = {
                                    type: "IconRenderer",
                                    iconPosition: "aisleRight",
                                    iconWidth: 18,
                                    iconHeight: 18,
                                    iconTableRef: {
                                        default: columnInfo.cellButtonIcon
                                    },
                                    onClick: function (evt) {
                                        var gridID = evt.pid;
                                        var elID = gridID.substring(1);
                                        var isAllowEdit = AUIGrid.getProp(gridID, 'editable');
                                        var mod = window[syn.$w.pageScript];
                                        var eventHandler = isAllowEdit == true && mod.event ? mod.event['{0}_{1}'.format(elID, 'cellEditBegin')] : null;
                                        if (eventHandler) {
                                            var value = eventHandler(evt);
                                            isAllowEdit = $string.toBoolean(value);
                                        }

                                        if (isAllowEdit == true) {
                                            var mod = window[syn.$w.pageScript];
                                            var eventHandler = mod.event['{0}_cellButtonClick'.format(elID)];
                                            if (eventHandler) {
                                                eventHandler(elID, evt.rowIndex, evt.columnIndex, evt.dataField, evt.item);
                                            }
                                        }
                                    }
                                }
                            }

                            columnInfo.editRenderer = {
                                type: 'InputEditRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: $string.isNullOrEmpty(columnInfo.cellButtonIcon),
                                onlyNumeric: $string.toBoolean(columnInfo.onlyNumeric),
                                inputMode: $string.isNullOrEmpty(columnInfo.inputMode) == false ? 'text' : columnInfo.inputMode
                            }
                            break;
                        case 'textarea':
                            columnInfo.style = columnInfo.style + ' white-space:pre-wrap';
                            columnInfo.wrapText = true;
                            columnInfo.editRenderer = {
                                type: "CustomEditRenderer",
                                jsClass: AUIGrid.TextareaEditor,
                                extraProps: {
                                    confirm: "확인",
                                    cancel: "취소",
                                    minHeight: 100
                                },
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                            }
                            break;
                        case 'korean':
                            columnInfo.editRenderer = {
                                type: 'InputEditRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                regExp: '^[ㄱ-힣0-9\\s,.~!@#$%^&*()[\\]{}<>`\'":;|+\\-\\/\\\\]+$',
                            }
                            break;
                        case 'english':
                            columnInfo.editRenderer = {
                                type: 'InputEditRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                regExp: '^[a-zA-Z0-9\\s,.~!@#$%^&*()[\\]{}<>`\'":;|+\\-\\/\\\\]+$',
                            }
                            break;
                        case 'number':
                            if ($string.toBoolean(columnInfo.barRender) == true) {
                                columnInfo.renderer = {
                                    type: 'BarRenderer',
                                    min: columnInfo.barMin || 0,
                                    max: columnInfo.barMax || 100,
                                }
                            }
                            else if ($string.toBoolean(columnInfo.stepRender) == true) {
                                columnInfo.renderer = {
                                    type: 'NumberStepRenderer',
                                    min: columnInfo.stepMin || 0,
                                    max: columnInfo.stepMax || 100,
                                    step: columnInfo.stepStep || 10,
                                    inputHeight: columnInfo.stepInputHeight || 28,
                                    textEditable: columnInfo.stepEditable || true
                                }
                            }

                            columnInfo.editRenderer = {
                                type: 'InputEditRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: false,
                                onlyNumeric: true,
                                allowPoint: false,
                                allowNegative: false,
                                textAlign: 'center',
                                autoThousandSeparator: false
                            }

                            if ($string.isNullOrEmpty(columnInfo.format) == false) {
                                columnInfo.labelFunction = (rowIndex, columnIndex, value, headerText, item) => {
                                    return AUIGrid.formatNumber(value, columnInfo.format);
                                }
                            }

                            if ($string.isNullOrEmpty(columnInfo.expFunction) == false && eval('typeof ' + columnInfo.expFunction) == 'function') {
                                columnInfo.expFunction = eval(columnInfo.expFunction);
                            }
                            break;
                        case 'numeric':
                            if ($object.isNullOrUndefined(columnInfo.dataType) == true) {
                                columnInfo.dataType = 'numeric';
                            }

                            columnInfo.editRenderer = {
                                type: 'InputEditRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: false,
                                onlyNumeric: true,
                                allowPoint: true,
                                allowNegative: true,
                                textAlign: 'right',
                                autoThousandSeparator: true
                            }

                            if ($string.isNullOrEmpty(columnInfo.expFunction) == false && eval('typeof ' + columnInfo.expFunction) == 'function') {
                                columnInfo.expFunction = eval(columnInfo.expFunction);
                            }
                            break;
                        case 'password':
                            var editRenderer = {
                                type: 'InputEditRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                passwordMode: false,
                                regExp: '^[a-zA-Z0-9\\s,.~!@#$%^&*()[\\]{}<>`\'":;|+\\-\\/\\\\]+$'
                            }

                            columnInfo.editRenderer = {
                                type: 'ConditionRenderer',
                                conditionFunction: function (rowIndex, columnIndex, value, item, dataField) {
                                    return editRenderer;
                                }
                            }

                            columnInfo.labelFunction = (rowIndex, columnIndex, value, headerText, item) => {
                                value += '';
                                return value.replace(/./gi, '*');
                            }
                            break;
                        case 'safehtml':
                            columnInfo.renderer = {
                                type: 'TemplateRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                wordWrap: $string.toBoolean(columnInfo.wordWrap)
                            }

                            columnInfo.editRenderer = {
                                type: 'CustomEditRenderer',
                                jsClass: AUIGrid.TextareaEditor,
                                vPosition: 'top',
                                extraProps: {
                                    confirm: '확인 (Ctrl + Enter)',
                                    cancel: '취소 (Esc)'
                                }
                            }

                            columnInfo.labelFunction = (rowIndex, columnIndex, value, headerText, item) => {
                                var result = '';
                                value += '';
                                var stripTags = (input, allowed) => {
                                    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
                                        commentsTags = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>/gi;

                                    allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');

                                    return input.replace(commentsTags, '').replace(tags, function ($0, $1) {
                                        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
                                    });
                                };

                                result = stripTags(value, '<em><p><br><b><u><strong><big><img><div><span><label>');
                                return result == '' ? value : result;
                            };
                            break;
                        case 'link':
                            columnInfo.renderer = {
                                type: 'LinkRenderer',
                                baseUrl: 'javascript',
                                jsCallback: (rowIndex, columnIndex, value, item) => {
                                    var mod = window[syn.$w.pageScript];
                                    var eventHandler = mod.event['{0}_cellLinkClick'.format(columnInfo.elID)];
                                    if (eventHandler) {
                                        var gridID = $auigrid.getGridID(columnInfo.elID);
                                        var dataField = AUIGrid.getDataFieldByColumnIndex(gridID, columnIndex);
                                        eventHandler(columnInfo.elID, rowIndex, columnIndex, dataField, value, item);
                                    }
                                }
                            }
                            break;
                        case 'button':
                            columnInfo.renderer = {
                                type: 'ButtonRenderer',
                                onClick: (evt) => {
                                    var gridID = evt.pid;
                                    var elID = gridID.substring(1);
                                    var isAllowEdit = AUIGrid.getProp(gridID, 'editable');
                                    var mod = window[syn.$w.pageScript];
                                    var eventHandler = isAllowEdit == true && mod.event ? mod.event['{0}_cellButtonClick'.format(elID)] : null;
                                    if (eventHandler) {
                                        eventHandler(elID, evt.rowIndex, evt.columnIndex, evt.dataField, evt.item);
                                    }
                                },
                                visibleFunction: function (rowIndex, columnIndex, value, item, dataField) {
                                    if ($string.isNullOrEmpty(value) == true) {
                                        return false;
                                    }
                                    return true;
                                }
                            }

                            if ($string.isNullOrEmpty(columnInfo.labelText) == false) {
                                columnInfo.renderer.labelText = columnInfo.labelText;
                            }

                            if ($string.isNullOrEmpty(columnInfo.disabledFunction) == false && eval('typeof ' + columnInfo.disabledFunction) == 'function') {
                                columnInfo.renderer.disabledFunction = eval(columnInfo.disabledFunction);
                            }
                            break;
                        case 'image':
                            columnInfo.renderer = {
                                type: 'ImageRenderer',
                                imgHeight: $string.isNullOrEmpty(columnInfo.imgHeight) == true ? 24 : columnInfo.imgHeight,
                            }

                            if ($string.isNullOrEmpty(columnInfo.prefix) == false) {
                                columnInfo.renderer.prefix = columnInfo.prefix;
                            }

                            if ($string.isNullOrEmpty(columnInfo.altField) == false) {
                                columnInfo.renderer.altField = columnInfo.altField;
                            }

                            if ($string.isNullOrEmpty(columnInfo.srcFunction) == false && eval('typeof ' + columnInfo.srcFunction) == 'function') {
                                columnInfo.renderer.srcFunction = eval(columnInfo.srcFunction);
                            }
                            break;
                        case 'imagefallback':
                            columnInfo.renderer = {
                                type: 'TemplateRenderer',
                                imgHeight: $string.isNullOrEmpty(columnInfo.imgHeight) == true ? 24 : columnInfo.imgHeight,
                            }

                            if ($string.isNullOrEmpty(columnInfo.altField) == false) {
                                columnInfo.renderer.altField = columnInfo.altField;
                            }

                            columnInfo.labelFunction = function (rowIndex, columnIndex, value, headerText, item) { // HTML 템플릿 작성
                                if ($string.isNullOrEmpty(value) == true) {
                                    return '';
                                }

                                if ($string.isNullOrEmpty(columnInfo.altField) == false) {
                                    columnInfo.renderer.altField = columnInfo.altField;
                                }

                                var info = $auigrid.getColumnInfo(columnInfo.elID, columnIndex);

                                const altText = info.altField ? item[info.altField] : value;
                                let onErrorHandler = 'this.onerror=null;';
                                if ($string.isNullOrEmpty(info.fallbackUrl) == false) {
                                    onErrorHandler = `this.src='${info.fallbackUrl}';`;
                                } else if ($string.toBoolean(info.hideOnError) == true) {
                                    onErrorHandler = "this.style.display='none';";
                                }

                                if ($string.isNullOrEmpty(info.prefix) == false) {
                                    value = info.prefix + value;
                                }

                                return `<img class="aui-img" style="border: 0px; padding: 0px; margin: 0px; text-align: center; vertical-align: middle; max-width: 100%; height: ${info.imgHeight}px;" alt="${altText}" src="${value}" onerror="${onErrorHandler}">`;
                            }

                            break;
                        case 'dropdown':
                            var mod = window[syn.$w.pageScript];
                            var storeSourceID = columnInfo.storeSourceID || columnInfo.dataSourceID;
                            if (storeSourceID) {
                                if (mod.config && mod.config.dataSource && mod.config.dataSource[storeSourceID]) {
                                    dataSource = mod.config.dataSource[storeSourceID];
                                }
                            }

                            if ($object.isNullOrUndefined(dataSource) == true) {
                                mod.config.dataSource[storeSourceID] = {
                                    CodeColumnID: columnInfo.keyField || 'CodeID',
                                    ValueColumnID: columnInfo.valueField || 'CodeValue',
                                    DataSource: []
                                };
                                dataSource = mod.config.dataSource[storeSourceID];
                                syn.$w.addReadyCount();
                                $auigrid.dataRefresh(elID, columnInfo);
                            }

                            columnInfo.labelFunction = function (rowIndex, columnIndex, value, headerText, item) {
                                var result = '';
                                var storeSourceID = this.storeSourceID || this.dataSourceID;
                                var keyField = this.keyField || 'CodeID';
                                var valueField = this.valueField || 'CodeValue';
                                if (storeSourceID) {
                                    var dataSource = $this.config.dataSource[storeSourceID] ? $this.config.dataSource[storeSourceID].DataSource : [];
                                    for (var i = 0, len = dataSource.length; i < len; i++) {
                                        var item = dataSource[i];
                                        if (item[keyField] == value) {
                                            result = item[valueField];
                                            break;
                                        }
                                    }
                                }
                                return result == '' ? value : result;
                            };

                            columnInfo.editRenderer = {
                                type: 'DropDownListRenderer',
                                easyMode: true,
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                listAlign: 'left',
                                list: $this.config.dataSource[storeSourceID] ? $this.config.dataSource[storeSourceID].DataSource : [],
                                keyField: columnInfo.keyField || 'CodeID',
                                valueField: columnInfo.valueField || 'CodeValue',
                                listFunction: function (rowIndex, columnIndex, item, dataField) {
                                    var result = [];
                                    var info = $auigrid.getColumnInfo(elID, dataField);
                                    var storeSourceID = info.storeSourceID || info.dataSourceID;
                                    if (storeSourceID) {
                                        result = $this.config.dataSource[storeSourceID] ? $this.config.dataSource[storeSourceID].DataSource : [];
                                    }
                                    return result;
                                }
                            }
                            break;
                        case 'checkbox':
                            columnInfo.renderer = {
                                type: 'CheckBoxEditRenderer',
                                showLabel: false,
                                editable: true,
                                checkValue: $string.isNullOrEmpty(columnInfo.checkValue) == true ? '1' : columnInfo.checkValue,
                                unCheckValue: $string.isNullOrEmpty(columnInfo.unCheckValue) == true ? '0' : columnInfo.unCheckValue,
                            }

                            if ($string.isNullOrEmpty(columnInfo.checkableFunction) == false && eval('typeof ' + columnInfo.checkableFunction) == 'function') {
                                columnInfo.renderer.checkableFunction = eval(columnInfo.checkableFunction);
                            }
                            else {
                                columnInfo.renderer.checkableFunction = (rowIndex, columnIndex, value, isChecked, item, dataField) => {
                                    var result = true;
                                    var info = $auigrid.getColumnInfo(elID, dataField);
                                    if (info) {
                                        result = info.editable;
                                    }
                                    return result;
                                }
                            }
                            break;
                        case 'codehelp':
                            columnInfo.renderer = {
                                type: "IconRenderer",
                                iconPosition: "aisleRight",
                                iconWidth: 18,
                                iconHeight: 18,
                                iconTableRef: {
                                    default: columnInfo.cellButtonIcon || '/img/btn/search.png'
                                },
                                onClick: function (evt) {
                                    var gridID = evt.pid;
                                    var elID = gridID.substring(1);
                                    var rowIndex = evt.rowIndex;
                                    var columnIndex = evt.columnIndex;
                                    var dataField = evt.dataField;
                                    var isAllowEdit = AUIGrid.getProp(gridID, 'editable');
                                    var mod = window[syn.$w.pageScript];
                                    var eventHandler = isAllowEdit == true && mod.event ? mod.event['{0}_{1}'.format(elID, 'cellEditBegin')] : null;
                                    if (eventHandler) {
                                        var value = eventHandler(evt);
                                        isAllowEdit = $string.toBoolean(value);
                                    }

                                    if (isAllowEdit == true) {
                                        var columns = AUIGrid.getColumnInfoList(gridID);
                                        var columnInfo = columns.find((item) => { return item.dataField == dataField });
                                        if (columnInfo && columnInfo.columnType == 'codehelp') {
                                            if (rowIndex > -1) {
                                                var synOptions = syn.$w.argumentsExtend(syn.uicontrols.$codepicker.defaultSetting, columnInfo);

                                                var codeButtonHandler = mod.event['{0}_codeButtonClick'.format(elID)];
                                                if (codeButtonHandler) {
                                                    var codeOptions = codeButtonHandler(elID, evt.rowIndex, evt.columnIndex, evt.dataField, evt.item);
                                                    if ($object.isObject(codeOptions) == true) {
                                                        synOptions = syn.$w.argumentsExtend(synOptions, codeOptions);
                                                    }
                                                    else if ($string.toBoolean(codeOptions) == false) {
                                                        return;
                                                    }
                                                }

                                                synOptions.elID = elID;
                                                synOptions.viewType = 'auigrid';
                                                synOptions.url = $auigrid.codeHelpUrl || '';
                                                synOptions.searchText = evt.text || '';
                                                syn.uicontrols.$codepicker.find(synOptions, function (result) {
                                                    var changeHandler = mod.event['{0}_codeChange'.format(elID)];
                                                    if (changeHandler) {
                                                        changeHandler(elID, evt.rowIndex, evt.columnIndex, evt.dataField, result);
                                                    }

                                                    var returnHandler = mod.hook.frameEvent;
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

                                                setTimeout(() => { AUIGrid.forceEditingComplete(gridID, null, false); }, 25);
                                            }
                                        }
                                    }
                                }
                            }

                            columnInfo.editRenderer = {
                                type: 'InputEditRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: false,
                            }

                            columnInfo.dataSource = columnInfo.dataSource || null;
                            columnInfo.dataSourceID = columnInfo.dataSourceID || '';
                            columnInfo.storeSourceID = columnInfo.storeSourceID || columnInfo.dataSourceID;
                            columnInfo.local = $object.isNullOrUndefined(columnInfo.local) == true ? true : columnInfo.local;
                            columnInfo.controlText = columnInfo.controlText || '';
                            columnInfo.codeColumnID = columnInfo.codeColumnID ? columnInfo.codeColumnID : columnID;
                            columnInfo.textColumnID = columnInfo.textColumnID ? columnInfo.textColumnID : columnID;
                            columnInfo.parameters = columnInfo.parameters || '';
                            break;
                        case 'date':
                            columnInfo.dataType = 'date';
                            columnInfo.dateInputFormat = 'yyyy-mm-dd';
                            columnInfo.formatString = $string.isNullOrEmpty(columnInfo.formatString) == true ? 'yyyy-mm-dd' : columnInfo.formatString;
                            columnInfo.editRenderer = {
                                type: 'CalendarRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                defaultFormat: 'yyyy-mm-dd',
                                showPlaceholder: false,
                                openDirectly: true,
                                onlyCalendar: false,
                                showExtraDays: true,
                                showTodayBtn: true,
                                showUncheckDateBtn: true,
                                uncheckDateValue: '',
                                validator: function (oldValue, newValue, item, dataField) {
                                    const isValid = $string.isNullOrEmpty(newValue) == true ? true : $date.isDate(newValue);
                                    return {
                                        validate: isValid,
                                        message: '유효한 날짜 형식으로 입력해주세요.'
                                    };
                                }
                            }
                            break;
                        case 'time':
                            let timeFormat = $string.toBoolean(columnInfo.showTimeSecond) == true ? 'HH:MM:ss' : 'HH:MM';
                            if ($string.isNullOrEmpty(columnInfo.formatString) == false) {
                                timeFormat = columnInfo.formatString;
                            }

                            columnInfo.dataType = 'date';
                            columnInfo.dateInputFormat = timeFormat;
                            columnInfo.formatString = timeFormat;
                            columnInfo.editRenderer = {
                                type: 'CalendarRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                defaultFormat: timeFormat,
                                openDirectly: true,
                                onlyCalendar: true,
                                onlyTimeMode: true,
                                showTimePicker: true,
                                showTimeSecond: $string.isNullOrEmpty(columnInfo.showTimeSecond) == true ? false : columnInfo.showTimeSecond,
                                showConfirmBtn: true,
                                showUncheckDateBtn: true,
                                uncheckDateText: '시간 선택 해제',
                                uncheckDateValue: '',
                                hourInterval: 1,
                                minList: columnInfo.minList || [0, 15, 30, 45],
                                hourList: columnInfo.hourList || [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
                            }
                            break;
                        case 'sparkline':
                            columnInfo.renderer = {
                                type: 'SparkLineRenderer',
                                markMaxValue: true,
                                markMinValue: true,
                                markFirstValue: true,
                                markLastValue: true,
                            }
                            break;
                        case 'sparkcolumn':
                            columnInfo.renderer = {
                                type: 'SparkColumnRenderer',
                                markMaxValue: true,
                                markMinValue: true,
                                markFirstValue: true,
                                markLastValue: true,
                            }
                            break;
                    }

                    if ($string.isNullOrEmpty(columnInfo.dataType) == true) {
                        columnInfo.dataType = 'string'; // numeric, string, date, boolean
                    }

                    if ($string.isNullOrEmpty(columnInfo.tooltip) == false) {
                        columnInfo.headerTooltip = {
                            show: true,
                            tooltipHtml: columnInfo.tooltip
                        };
                    }

                    if ($string.isNullOrEmpty(columnInfo.maxlength) == false && $object.isNullOrUndefined(columnInfo.editRenderer) == false) {
                        columnInfo.editRenderer.maxlength = columnInfo.maxlength;
                    }
                }

                if ($object.isNullOrUndefined(children) == false) {
                    columnInfo.children = $auigrid.getInitializeColumns(elID, children, editable);
                }

                result.push(columnInfo);
            }

            return result;
        },

        dataRefresh(elID, setting, callback) {
            var gridID = $auigrid.getGridID(elID);
            if ($object.isNullOrUndefined(gridID) == true) {
                gridID = elID.replace('#', '');
            }

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
            }

            setting = setting || {};
            setting.elID = elID;
            setting.storeSourceID = setting.storeSourceID || setting.dataSourceID;
            setting = syn.$w.argumentsExtend(defaultSetting, setting);
            setting.sharedAssetUrl = setting.sharedAssetUrl || syn.Config.SharedAssetUrl;

            if (setting.dataField && setting.storeSourceID) {
                var mod = window[syn.$w.pageScript];
                if (mod.config && mod.config.dataSource && mod.config.dataSource[setting.storeSourceID] && $string.toBoolean(setting.deleteCache) == true) {
                    delete mod.config.dataSource[setting.storeSourceID];
                }

                if (mod && mod.hook.controlInit) {
                    var moduleSettings = mod.hook.controlInit(elID, setting);
                    setting = syn.$w.argumentsExtend(setting, moduleSettings);
                }

                var dataSource = null;
                if (mod.config && mod.config.dataSource && mod.config.dataSource[setting.storeSourceID]) {
                    dataSource = mod.config.dataSource[setting.storeSourceID];
                }

                if (dataSource && dataSource.DataSource.length > 0) {
                    if (callback) {
                        callback();
                    }
                    syn.$w.removeReadyCount();
                } else {
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
                            }
                            syn.$w.removeReadyCount();
                        }, false);
                    } else {
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
                            }
                            syn.$w.removeReadyCount();
                        });
                    }
                }

                AUIGrid.setColumnPropByDataField(gridID, setting.dataField, setting);
            }
        },

        hideContextMenu() {
            if ($auigrid.nowHeaderMenuVisible) {
                $('#auigridHeaderContextMenu').menu('destroy');
                $('#auigridHeaderContextMenu').hide();
                $auigrid.nowHeaderMenuVisible = false;
            }
        },

        contextEventHandler(evt) {
            if ($auigrid.nowHeaderMenuVisible) {
                $auigrid.hideContextMenu();
            }

            if (evt.target == 'header') {
                syn.$m.removeClass('headerItem1', 'hidden');
                syn.$m.removeClass('headerItem2', 'hidden');
                syn.$m.removeClass('headerItem3', 'hidden');
                syn.$m.removeClass('headerItem4', 'hidden');
                syn.$m.removeClass('headerItem5', 'hidden');
                if ($string.isNullOrEmpty(evt.dataField) == true) {
                    syn.$m.addClass('headerItem1', 'hidden');
                    syn.$m.addClass('headerItem2', 'hidden');
                }
                else {
                    syn.$m.addClass('headerItem4', 'hidden');
                    syn.$m.addClass('headerItem5', 'hidden');
                    $auigrid.currentDataField = evt.dataField.replaceAll(',', '_');
                }

                $auigrid.nowHeaderMenuVisible = true;
                $("#auigridHeaderContextMenu").attr('context', JSON.stringify(evt));
                $('#auigridHeaderContextMenu').menu({
                    select: $auigrid.headerMenuSelectHandler
                });

                $('#auigridHeaderContextMenu').css({
                    left: evt.pageX,
                    top: evt.pageY
                }).show();

            } else if (evt.target == 'body') {
                return true;
            }
        },

        headerMenuSelectHandler(evt, ui) {
            var context = JSON.parse($('#auigridHeaderContextMenu').attr('context'));
            var gridID = context.pid;
            var selectedId = ui.item.prop('id');

            switch (selectedId) {
                case 'headerItem1':
                    AUIGrid.setSorting(gridID, [{ dataField: $auigrid.currentDataField, sortType: 1 }]);
                    break;
                case 'headerItem2':
                    AUIGrid.setSorting(gridID, [{ dataField: $auigrid.currentDataField, sortType: -1 }]);
                    break;
                case 'headerItem3':
                    AUIGrid.clearSortingAll(gridID);
                    break;
                case 'headerItem4':
                    var colIndex = AUIGrid.getSelectedIndex(gridID)[1];
                    $auigrid.currentDataField = AUIGrid.getDataFieldByColumnIndex(gridID, colIndex);
                    AUIGrid.hideColumnByDataField(gridID, $auigrid.currentDataField);
                    break;
                case 'headerItem5':
                    AUIGrid.showAllColumns(gridID);
                    $('#headerItemUL span.ui-icon[data]').addClass('ui-icon-check').removeClass('ui-icon-blank');
                    break;
                case 'headerItem6':
                    const columnInfos = AUIGrid.getColumnInfoList(gridID);
                    for (let i = 0, length = columnInfos.length; i < length; i++) {
                        const columnInfo = columnInfos[i];
                        if (columnInfo.isHidden == true) {
                            const dataField = AUIGrid.getDataFieldByColumnIndex(gridID, columnInfo.columnIndex);
                            AUIGrid.hideColumnByDataField(gridID, dataField);
                        }
                    }
                    break;
            }

            $auigrid.hideContextMenu();
        },

        propToCol(elID, dataField) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }
                result = AUIGrid.getColumnIndexByDataField(gridID, dataField);
            }

            return result;
        },

        getProperty(elID, name) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getProp(gridID, name);
            }

            return result;
        },

        // value = { headerText: '헤더 그룹', headerStyle: 'my-strong-header' }
        setColumnProperty(elID, dataField, value) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isString(dataField) == true) {
                    AUIGrid.setColumnPropByDataField(gridID, dataField, value);
                }
                else {
                    AUIGrid.setColumnProp(gridID, dataField, value);
                }
            }
        },

        setProperty(elID, name, value) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.setProp(gridID, name, value);

                AUIGrid.update(gridID);
            }
        },

        setFooter(elID, footerLayout, isChangeFooter) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.setProp(gridID, 'showFooter', true);

                if ($string.toBoolean(isChangeFooter) == false) {
                    AUIGrid.setFooter(gridID, footerLayout);
                }
                else {
                    AUIGrid.changeFooterLayout(gridID, footerLayout);
                }
            }
        },

        search(elID, dataField, term, options) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var defaultOptions = {
                    direction: true,
                    caseSensitive: false,
                    wholeWord: false,
                    wrapSearch: true
                };

                options = syn.$w.argumentsExtend(defaultOptions, options);

                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }
                AUIGrid.search(gridID, dataField, term, options);
            }
        },

        searchAll(elID, term, options) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var defaultOptions = {
                    direction: true,
                    caseSensitive: false,
                    wholeWord: false,
                    wrapSearch: true
                };

                options = syn.$w.argumentsExtend(defaultOptions, options);

                AUIGrid.searchAll(gridID, term, options);
            }
        },

        setControlSize(elID, size) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var el = syn.$l.get(elID);
                if (el) {
                    if (size) {
                        if ($object.isNumber(size.width) == true) {
                            size.width = size.width + 'px';
                        }

                        if ($object.isNumber(size.height) == true) {
                            size.height = size.height + 'px';
                        }

                        if (size.width) {
                            el.style.width = size.width;
                        }

                        if (size.height) {
                            el.style.height = size.height;
                        }

                        AUIGrid.resize(gridID, size.width, size.height);
                    }
                    else {
                        AUIGrid.resize(gridID);
                    }

                    if (syn.$w.setTabContentHeight) {
                        syn.$w.setTabContentHeight();
                    }
                }
            }
        },

        // sortInfos = [{ dataField: 'country', sortType: 1 }, { dataField: 'name', sortType: -1 }]
        setSorting(elID, sortInfos) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.setSorting(gridID, sortInfos);
            }
        },

        clearSorting(elID) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.clearSortingAll(gridID);
            }
        },

        getColumnWidth(elID, dataField) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }
                var columnItem = AUIGrid.getColumnItemByDataField(gridID, dataField);
                if ($object.isNullOrUndefined(columnItem) == false) {
                    result = columnItem.width;
                }
            }

            return result;
        },

        getColumnWidths(elID, isKeyValue) {
            var result = [];
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var dataFields = AUIGrid.getColumnInfoList(gridID);
                for (var i = 0, length = dataFields.length; i < length; i++) {
                    var dataField = dataFields[i];

                    if ($string.toBoolean(isKeyValue) == true) {
                        result.push({
                            dataField: dataField.dataField,
                            width: dataField.width,
                        });
                    }
                    else {
                        result.push(dataField.width);
                    }
                }
            }

            return result;
        },

        setColumnWidth(elID, dataField, width) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var columnWidths = $auigrid.getColumnWidths(elID);

                if ($object.isString(dataField) == true) {
                    dataField = AUIGrid.getColumnIndexByDataField(gridID, dataField);
                }

                var colIndex = columnWidths[dataField];
                if ($object.isNullOrUndefined(colIndex) == false) {
                    columnWidths[dataField] = width;
                    AUIGrid.setColumnSizeList(gridID, columnWidths);
                }
            }
        },

        setColumnWidths(elID, columnWidths) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isArray(columnWidths) == true) {
                    AUIGrid.setColumnSizeList(gridID, columnWidths);
                }
            }
        },

        getColumnSize(elID, dataField) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getColumnIndexByDataField(gridID, dataField);
            }

            return result;
        },

        setFitColumnSize(elID, maxWidth, fitToGrid) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                maxWidth = maxWidth || 300;
                var colSizeList = AUIGrid.getFitColumnSizeList(gridID, $string.toBoolean(fitToGrid));
                for (var i = 0, length = colSizeList.length; i < length; i++) {
                    colSizeList[i] = colSizeList[i] + 14;
                    if (colSizeList[i] > maxWidth) {
                        colSizeList[i] = maxWidth;
                    }
                }

                AUIGrid.setColumnSizeList(gridID, colSizeList);
            }
        },

        setCellMerge(elID, isMerged) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.setCellMerge(gridID, $string.toBoolean(isMerged));
            }
        },

        setFixedColumnCount(elID, fixedCount) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var fixedCount = $string.toNumber(fixedCount);
                AUIGrid.setFixedColumnCount(gridID, (fixedCount < 0 ? 0 : fixedCount));
            }
        },

        setFixedRowCount(elID, fixedCount) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var fixedCount = $string.toNumber(fixedCount);
                AUIGrid.setFixedRowCount(gridID, (fixedCount < 0 ? 0 : fixedCount));
            }
        },

        getSelectedIndex(elID) {
            var result = [-1, -1];
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getSelectedIndex(gridID);
            }
            return result;
        },

        getActiveRowIndex(elID) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getSelectedIndex(gridID)[0];
            }
            return result;
        },

        getActiveColIndex(elID) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getSelectedIndex(gridID)[1];
            }
            return result;
        },

        selectCell(elID, rowIndex, dataField) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var colIndex = 0;
                if ($object.isString(dataField) == true) {
                    colIndex = AUIGrid.getColumnIndexByDataField(gridID, dataField);
                }
                else {
                    colIndex = dataField;
                }

                AUIGrid.setSelectionByIndex(gridID, $string.toNumber(rowIndex), $string.toNumber(colIndex));
            }
        },

        clearSelection(elID) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.clearSelection(gridID);
            }
        },

        propToCol(elID, dataField) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getColumnIndexByDataField(gridID, dataField);
            }
            return result;
        },


        colToProp(elID, colIndex) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getDataFieldByColumnIndex(gridID, $string.toNumber(colIndex));
            }
            return result;
        },

        // func = (dataField, value, item) => {}
        setFilter(elID, dataField, func) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }

                if ($string.isNullOrEmpty(dataField) == false) {
                    AUIGrid.setFilter(gridID, dataField, func);
                }
            }
        },

        addFilterCache(elID, dataField, value) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }

                if ($string.isNullOrEmpty(dataField) == false) {
                    var filterCache = AUIGrid.getFilterCache(gridID);
                    filterCache[dataField] = value;
                    AUIGrid.setFilterCache(gridID, filterCache);
                }
            }
        },

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
        not_between: 사이가 아님
        not_contains: 포함하지 않음
        not_empty: 비우지 않음
        neq: 같지 않다
         */
        addCondition(elID, dataField, name, args, args2) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }

                if ($string.isNullOrEmpty(dataField) == false) {
                    AUIGrid.setFilter(gridID, dataField, (dataField, value, item) => {
                        var result = false;
                        if (value) {
                            switch (name) {
                                case 'begins_with':
                                    result = value.startsWith(args);
                                    break;
                                case 'between':
                                    result = (args <= value && value <= args2);
                                    break;
                                case 'ends_with':
                                    result = value.endsWith(args);
                                    break;
                                case 'contains':
                                case 'by_value':
                                case 'eq':
                                    result = value == args;
                                    break;
                                case 'not_contains':
                                case 'neq':
                                    result = value != args;
                                    break;
                                case 'gt':
                                    result = value > args;
                                    break;
                                case 'gte':
                                    result = value >= args;
                                    break;
                                case 'lt':
                                    result = value < args;
                                    break;
                                case 'lte':
                                    result = value <= args;
                                    break;
                                case 'not_between':
                                    result = !(args <= value && value <= args2);
                                    break;
                                case 'not_empty':
                                    result = $string.isNullOrEmpty(value) == false;
                                    break;
                                default:
                                    result = value == args;
                                    break;
                            }
                        }
                        else {
                            if (name == 'empty') {
                                result = true;
                            }
                        }
                        return result;
                    });
                }
            }
        },

        removeCondition(elID, dataField) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }

                if ($string.isNullOrEmpty(dataField) == false) {
                    AUIGrid.clearFilter(gridID, dataField);
                }
            }
        },

        clearConditions(elID) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if (AUIGrid.isFilteredGrid(gridID) == true) {
                    AUIGrid.clearFilterAll(gridID);
                }
            }
        },

        render(elID) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.refresh(gridID);
            }
        },

        insertRow(elID, setting, callback) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isObject(setting) == false || $object.isArray(setting) == true) {
                    setting = {};
                }

                setting = syn.$w.argumentsExtend({
                    values: {},
                    index: 'last',
                    amount: 1
                }, setting);

                var values = [];
                var defaultValue = {};
                var columns = AUIGrid.getColumnInfoList(gridID);
                for (var i = 0, length = columns.length; i < length; i++) {
                    var column = columns[i];
                    var dataField = column.dataField;
                    var dataType = column.dataType;
                    var value = null;

                    var val = setting.values[dataField];
                    if (val === undefined) {
                        switch (dataType) {
                            case 'string':
                            case 'date':
                                value = '';
                                break;
                            case 'numeric':
                                value = 0;
                                break;
                            case 'boolean':
                                if (column.renderer && $string.isNullOrEmpty(column.renderer.unCheckValue) == false) {
                                    value = column.renderer.unCheckValue;
                                }
                                else {
                                    value = false;
                                }
                                break;
                        }
                    }
                    else {
                        value = val;
                    }

                    defaultValue[dataField] = value;
                }

                defaultValue['Flag'] = 'C';

                var triggerOptions = syn.$w.getTriggerOptions(elID);
                if (triggerOptions) {
                    if (triggerOptions.focusColumnID) {
                        setting.focusColumnID = triggerOptions.focusColumnID;
                    }

                    if (triggerOptions.sourceValueID && triggerOptions.targetColumnID) {
                        var mod = window[syn.$w.pageScript];
                        if (mod) {
                            var synControls = mod.context.synControls;
                            if (synControls && synControls.length > 0) {
                                if ($object.isArray(triggerOptions.sourceValueID) == true && $object.isArray(triggerOptions.targetColumnID) == true) {
                                    var length = triggerOptions.sourceValueID.length;
                                    for (var i = 0; i < length; i++) {
                                        var sourceValueID = triggerOptions.sourceValueID[i];
                                        var targetColumnID = triggerOptions.targetColumnID[i];
                                        var keyValues = sourceValueID.split('@');
                                        var dataFieldID = keyValues[0];
                                        var dataColumnID = keyValues[1];
                                        var items = synControls.filter(function (item) {
                                            return item.field == dataFieldID;
                                        });

                                        if (items.length == 1) {
                                            var controlInfo = items[0];

                                            var targetColumn = columns.find(function (item) { return item.dataField == targetColumnID; });
                                            if (targetColumn != null) {
                                                if (controlInfo.type == 'grid') {
                                                    var sourceGridID = controlInfo.id;
                                                    var sourceRow = $grid.getActiveRowIndex(sourceGridID);
                                                    var sourceCol = $grid.propToCol(sourceGridID, dataColumnID);
                                                    var sourceValue = $grid.getDataAtCell(sourceGridID, sourceRow, sourceCol);

                                                    defaultValue[targetColumnID] = sourceValue;
                                                }
                                                else if (controlInfo.type == 'auigrid') {
                                                    var sourceGridID = controlInfo.id;
                                                    var auiGridID = $auigrid.getGridID(sourceGridID);
                                                    var selected = AUIGrid.getSelectedIndex(auiGridID);
                                                    var sourceRow = selected[0];
                                                    var sourceValue = AUIGrid.getCellValue(auiGridID, sourceRow, dataColumnID);

                                                    defaultValue[targetColumnID] = sourceValue;
                                                }
                                                else {
                                                    var el = syn.$l.querySelector('[syn-datafield="{0}"] #{1}'.format(dataFieldID, dataColumnID));
                                                    if ($object.isNullOrUndefined(el) == false) {
                                                        defaultValue[targetColumnID] = el.value;
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
                }

                for (var i = 0; i < setting.amount; i++) {
                    var item = $object.clone(defaultValue);

                    values.push(item);
                }

                var filterCache = AUIGrid.getFilterCache(gridID);
                // rowIndex = Number or first, last, selectionUp, selectionDown
                AUIGrid.addRow(gridID, values, setting.rowIndex);

                var isUserFilter = false;
                for (var item in filterCache) {
                    if (filterCache[item] == 'userFilter') {
                        isUserFilter = true;
                        break;
                    }
                }

                if (isUserFilter == false) {
                    AUIGrid.setFilterCache(gridID, filterCache);
                }

                AUIGrid.setFocus(gridID);

                var rowIndex = AUIGrid.getSelectedIndex(gridID)[0] + (setting.amount - 1);
                if (setting.focusColumnID) {
                    var colIndex = AUIGrid.getColumnIndexByDataField(gridID, setting.focusColumnID);
                    if (colIndex > -1) {
                        AUIGrid.setSelectionByIndex(gridID, rowIndex, colIndex);
                    }
                }
                else {
                    AUIGrid.setSelectionByIndex(gridID, rowIndex, 0);
                }

                if (callback) {
                    callback(rowIndex, setting);
                }
            }
        },

        removeRow(elID, dataField, rowIndex, callback) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                rowIndex = rowIndex || '';
                var colIndex = 0;
                if ($string.isNullOrEmpty(rowIndex) == true) {
                    var selected = AUIGrid.getSelectedIndex(gridID);
                    rowIndex = selected[0];
                    colIndex = selected[1];
                }

                var rowCount = AUIGrid.getRowCount(gridID);
                if (rowIndex == -1 && rowCount == 0) {
                    return;
                }
                else if (rowIndex == -1) {
                    rowIndex = rowCount - 1;
                }

                AUIGrid.removeRow(gridID, rowIndex);
                AUIGrid.setFocus(gridID);

                if ($object.isString(rowIndex) == true) {
                    rowIndex = AUIGrid.getSelectedIndex(gridID)[0];
                    dataField = dataField || AUIGrid.getSelectedIndex(gridID)[1];
                    var lastRowIndex = rowCount - 1;
                    if (rowIndex > lastRowIndex || (rowIndex == -1 && lastRowIndex > 0)) {
                        rowIndex = lastRowIndex;
                    }
                }
                else {
                    rowIndex = (rowIndex || rowCount) - 1;
                }

                if ($object.isString(dataField) == true) {
                    colIndex = AUIGrid.getColumnIndexByDataField(gridID, dataField);
                }
                else {
                    colIndex = dataField;
                }

                if (rowIndex > -1) {
                    if (colIndex > -1) {
                        AUIGrid.setSelectionByIndex(gridID, rowIndex, colIndex);
                    }
                    else {
                        AUIGrid.setSelectionByIndex(gridID, rowIndex, 0);
                    }
                }

                if (callback) {
                    callback(rowIndex, colIndex);
                }
            }
        },

        removeRowByRowId(elID, rowIDs) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.removeRowByRowId(gridID, rowIDs);
            }
        },

        countRows(elID) {
            var result = 0;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getRowCount(gridID);
            }
            return result;
        },

        countCols(elID) {
            var result = 0;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getColumnCount(gridID);
            }
            return result;
        },


        getFirstShowColIndex(elID) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var source = AUIGrid.getColumnInfoList(gridID).map((item) => { return item.columnIndex });
                var target = AUIGrid.getHiddenColumnIndexes(gridID);

                var arr = source.filter(function (item) {
                    return !target.includes(item);
                });

                if (arr.length > 0) {
                    result = arr[0];
                }
            }
            return result;
        },

        getLastShowColIndex(elID) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var source = AUIGrid.getColumnInfoList(gridID).map((item) => { return item.columnIndex });
                var target = AUIGrid.getHiddenColumnIndexes(gridID);

                var arr = source.filter(function (item) {
                    return !target.includes(item);
                });

                if (arr.length > 0) {
                    result = arr[arr.length - 1];
                }
            }
            return result;
        },

        getSelected(elID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getSelectedItems(gridID);
            }
            return result;
        },

        getMergeItems(elID, rowIndex, dataField) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isString(dataField) == true) {
                    dataField = AUIGrid.getColumnIndexByDataField(gridID, dataField);
                }
                result = AUIGrid.getMergeItems(gridID, rowIndex, dataField);
            }
            return result;
        },

        getRangeSelected(elID, rowID, colID) {
            const data = $auigrid.getSelected(elID);
            if (!data || data.length === 0) {
                return null;
            }

            rowID = rowID || 'rowIndex';
            colID = colID || 'columnIndex';

            return $auigrid.getRangeIndices(data, rowID, colID);
        },

        getRangeIndices(data, rowID, colID) {
            if (!data || data.length === 0) {
                return null;
            }

            rowID = rowID || 'rowIndex';
            colID = colID || 'columnIndex';

            return data.reduce((range, cell, index) => {
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
            endRowIndex = endRowIndex || startRowIndex;

            if ($object.isString(startDataField) == true) {
                startDataField = AUIGrid.getColumnIndexByDataField(gridID, startDataField);
            }

            endDataField = endDataField || startDataField;

            if ($object.isString(endDataField) == true) {
                endDataField = AUIGrid.getColumnIndexByDataField(gridID, endDataField);
            }

            if (($object.isNullOrUndefined(startRowIndex) == true || $object.isNullOrUndefined(startDataField) == true)
                || (startRowIndex == -1 || startDataField == -1 || endRowIndex == -1 || endDataField == -1)
                || startRowIndex > endRowIndex) {
                return false;
            }

            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                for (var rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex++) {
                    for (var colIndex = startDataField; colIndex <= endDataField; colIndex++) {
                        let mergeItems = AUIGrid.getMergeItems(gridID, rowIndex, colIndex);
                        if (mergeItems && mergeItems.length > 1) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },

        getRowPosition(elID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getRowPosition(gridID);
            }
            return result;
        },

        setRowPosition(elID, rowIndex) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.setRowPosition(gridID, rowIndex);
            }
        },

        setColumnPosition(elID, dataField) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isString(dataField) == true) {
                    dataField = AUIGrid.getColumnIndexByDataField(gridID, dataField);
                }
                AUIGrid.setHScrollPosition(gridID, dataField);
            }
        },

        isCreated(elID) {
            var result = false;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.isCreated(gridID);
            }

            return result;
        },

        getPhysicalColText(elID, columnText) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                var columnInfoList = AUIGrid.getColumnInfoList(gridID);
                if (columnInfoList.length > 0) {
                    var columnInfo = columnInfoList.find(item => item.headerText == columnText);
                    if (columnInfo) {
                        result = columnInfo.columnIndex;
                    }
                }
            }

            return result;
        },

        unHiddenColumns(elID) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var dataFields = AUIGrid.getHiddenColumnDataFields(gridID);
                for (var i = 0, length = dataFields.length; i < length; i++) {
                    var dataField = dataFields[i];
                    AUIGrid.showColumnByDataField(gridID, dataField);
                }
            }
        },

        isColumnHidden(elID, dataField) {
            var result = false;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var colIndexs = AUIGrid.getHiddenColumnIndexes(gridID);

                if ($object.isString(dataField) == true) {
                    dataField = AUIGrid.getColumnIndexByDataField(gridID, dataField);
                }
                result = colIndexs.indexOf($string.toNumber(dataField)) >= 0;
            }

            return result;
        },

        visibleColumns(elID, columns, isShow) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                isShow = $string.toBoolean(isShow);
                if (isShow == true) {
                    if ($object.isNumber(columns) == true) {
                        var dataField = AUIGrid.getDataFieldByColumnIndex(gridID, columns);
                        if ($string.isNullOrEmpty(dataField) == false) {
                            AUIGrid.showColumnByDataField(gridID, dataField);
                        }
                    }
                    else if ($object.isString(columns) == true) {
                        var columnIndex = AUIGrid.getColumnIndexByDataField(gridID, columns);
                        if (columnIndex > -1) {
                            AUIGrid.showColumnByDataField(gridID, columns);
                        }
                    }
                    else {
                        for (var i = 0, length = columns.length; i < length; i++) {
                            var column = columns[i];
                            if ($object.isNumber(column) == true) {
                                var dataField = AUIGrid.getDataFieldByColumnIndex(gridID, column);
                                if ($string.isNullOrEmpty(dataField) == false) {
                                    AUIGrid.showColumnByDataField(gridID, dataField);
                                }
                            }
                            else if ($object.isString(column) == true) {
                                var columnIndex = AUIGrid.getColumnIndexByDataField(gridID, column);
                                if (columnIndex > -1) {
                                    AUIGrid.showColumnByDataField(gridID, column);
                                }
                            }
                        }
                    }
                } else {
                    if ($object.isNumber(columns) == true) {
                        var dataField = AUIGrid.getDataFieldByColumnIndex(gridID, columns);
                        if ($string.isNullOrEmpty(dataField) == false) {
                            AUIGrid.hideColumnByDataField(gridID, dataField);
                        }
                    }
                    else if ($object.isString(columns) == true) {
                        var columnIndex = AUIGrid.getColumnIndexByDataField(gridID, columns);
                        if (columnIndex > -1) {
                            AUIGrid.hideColumnByDataField(gridID, columns);
                        }
                    }
                    else {
                        for (var i = 0, length = columns.length; i < length; i++) {
                            var column = columns[i];
                            if ($object.isNumber(column) == true) {
                                var dataField = AUIGrid.getDataFieldByColumnIndex(gridID, column);
                                if ($string.isNullOrEmpty(dataField) == false) {
                                    AUIGrid.hideColumnByDataField(gridID, dataField);
                                }
                            }
                            else if ($object.isString(column) == true) {
                                var columnIndex = AUIGrid.getColumnIndexByDataField(gridID, column);
                                if (columnIndex > -1) {
                                    AUIGrid.hideColumnByDataField(gridID, column);
                                }
                            }
                        }
                    }
                }
            }
        },

        isUpdateData(elID) {
            var result = '';
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = !$object.isEmpty(AUIGrid.getStateCache(gridID).cache);
            }

            return result;
        },

        getFlag(elID, row) {
            var result = '';
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var isAdded = false;
                var isEdited = false;
                var isRemoved = false;
                if ($object.isNumber(row) == true) {
                    isAdded = AUIGrid.isAddedByRowIndex(gridID, row);
                    isEdited = AUIGrid.isEditedByRowIndex(gridID, row);
                    isRemoved = AUIGrid.isRemovedByRowIndex(gridID, row);
                }
                else {
                    isAdded = AUIGrid.isAddedById(gridID, row);
                    isEdited = AUIGrid.isEditedById(gridID, row);
                    isRemoved = AUIGrid.isRemovedById(gridID, row);
                }

                if (isRemoved == true) {
                    result = 'D';
                }
                else if (isEdited == true && isAdded == false) {
                    result = 'U';
                }
                else if (isAdded == true) {
                    result = 'C';
                }
            }

            return result;
        },

        setFlag(elID, rowIndex, flagValue) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var colIndex = $auigrid.propToCol(gridID, 'Flag');
                if (rowIndex > -1 && colIndex > -1) {
                    var flag = $auigrid.getDataAtCell(gridID, rowIndex, colIndex);
                    if (flag != 'S') {
                        $auigrid.setDataAtCell(gridID, rowIndex, colIndex, flagValue);
                    }
                }
            }
        },

        exportToObject(elID, keyValueMode) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.exportToObject(gridID, $object.isNullOrUndefined(keyValueMode) == true ? true : $string.toBoolean(keyValueMode));
            }
            return result;
        },

        // syn.uicontrols.$auigrid.exportAsString('grdDataList', { type: 'csv', callback: (data) => { console.log(data)} });
        exportAsString(elID, options) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var defaultOptions = {
                    type: 'json',
                    localControl: true,
                    localAsText: true
                };

                options = syn.$w.argumentsExtend(defaultOptions, options);

                if ($object.isFunction(options.callback) == true) {
                    options.localControlFunc = options.callback;
                    switch (options.type) {
                        case 'csv':
                            AUIGrid.exportToCsv(gridID, options);
                            break;
                        case 'txt':
                            AUIGrid.exportToTxt(gridID, options);
                            break;
                        case 'xml':
                            AUIGrid.exportToXml(gridID, options);
                            break;
                        case 'json':
                            AUIGrid.exportToJson(gridID, options);
                            break;
                    }
                }
            }
        },

        // options = { type: 'xlsx', fileName: 'export.xlsx' }
        exportFile(elID, options) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var defaultOptions = {
                    type: 'xlsx',
                    localControl: true
                };

                options = syn.$w.argumentsExtend(defaultOptions, options);

                if ($object.isNullOrUndefined(options.fileName) == true) {
                    options.fileName = `export_${$date.toString(new Date(), 'f')}.${options.type}`;
                }

                if ($object.isNullOrUndefined(options.localControlFunc) == true) {
                    options.localControlFunc = (data) => {
                        window.saveAs(data, options.fileName);
                    }
                }

                switch (options.type) {
                    case 'xlsx':
                        if ($string.toBoolean(options.exceptHiddenColumn) == true) {
                            options.exceptColumnFields = AUIGrid.getHiddenColumnDataFields(gridID);
                        }

                        AUIGrid.exportToXlsx(gridID, options);
                        break;
                    case 'csv':
                        AUIGrid.exportToCsv(gridID, options);
                        break;
                    case 'txt':
                        AUIGrid.exportToTxt(gridID, options);
                        break;
                    case 'xml':
                        AUIGrid.exportToXml(gridID, options);
                        break;
                    case 'json':
                        AUIGrid.exportToJson(gridID, options);
                        break;
                }
            }
        },

        importFile(elID, callback) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var fileEL = syn.$l.get('{0}_ImportFile'.format(elID));
                fileEL.callback = callback;
                fileEL.click();
            }
        },

        importFileLoad(evt) {
            var el = evt.srcElement || evt.target;
            var elID = el.id.split('_')[0];
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
                var gridID = $auigrid.getGridID(elID);
                if (gridID) {
                    var columns = AUIGrid.getColumnInfoList(gridID);
                    if (fileExtension == '.csv') {
                        var lines = data.split(/\r\n|\n/);

                        if (lines.length == 0) {
                            $auigrid.clear(elID);
                        }
                        else if (lines.length > 0) {
                            var result = [];
                            var headers = lines[0].split(columnDelimiter);
                            var bindColumns = [];
                            var columnFields = columns.map(function (item) { return item.dataField; });
                            var columnTexts = columns.map(function (item) { return item.headerText; })
                            var columnTypes = columns.map(function (item) { return item.dataType; });
                            for (var i = 0; i < headers.length; i++) {
                                var value = headers[i];
                                value = value.replace(/^["]/, '');
                                value = value.replace(/["]$/, '');
                                headers[i] = value;

                                var colIndex = columnTexts.indexOf(columnText);
                                if (columnText !== 'No.' && colIndex == -1) {
                                    syn.$w.alert('올바른 형식의 파일이 아닙니다.\n파일을 확인해주세요.');
                                    return false;
                                }

                                var columnIndex = AUIGrid.getColumnIndexByDataField(gridID, columnFields[colIndex]);

                                bindColumns.push({
                                    headerIndex: i,
                                    columnID: columnFields[colIndex],
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
                                            isTypeCheck = $date.isDate(value);
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
                        var columnFields = columns.map(function (item) { return item.dataField; });
                        var columnTexts = columns.map(function (item) { return item.headerText; })
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
                            var colIndex = columnTexts.indexOf(columnText);
                            if (columnText !== 'No.' && colIndex == -1) {
                                syn.$w.alert('올바른 형식의 파일이 아닙니다.\n파일을 확인해주세요.');
                                return false;
                            }

                            var columnID = columnFields[colIndex] || 'No.';
                            cell.v = columnID;
                            cell.h = columnID;
                            cell.w = columnID;
                        }

                        result = XLSX.utils.sheet_to_json(sheet);
                    }

                    var metaColumns = {};
                    for (var k = 0; k < columns.length; k++) {
                        var column = columns[k];

                        metaColumns[column.dataField] = {
                            fieldID: column.dataField,
                            dataType: column.dataType
                        };
                    }

                    result = result.filter(function (item) {
                        return typeof item['No.'] === 'number';
                    });

                    AUIGrid.clearGridData(gridID);
                    $auigrid.setValue(elID, result, metaColumns);

                    if (el.callback) {
                        el.callback(result, fileName);
                    }
                }
            };

            if (fileExtension == '.csv') {
                reader.readAsText(el.files[0]);
            }
            else {
                reader.readAsBinaryString(el.files[0]);
            }
        },

        getGridID(elID) {
            var result = null;
            elID = elID.replace('_hidden', '');
            var length = $auigrid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $auigrid.gridControls[i];
                if (item.id == elID) {
                    result = item.gridID;
                    break;
                }
            }

            return result;
        },

        getColumnInfoList(elID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getColumnInfoList(gridID);
            }

            return result;
        },

        getColumnInfo(elID, dataField) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }

                var columns = AUIGrid.getColumnInfoList(gridID);
                result = columns.find((item) => { return item.dataField == dataField });
            }

            return result;
        },

        getColumnLayout(elID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getColumnLayout(gridID);
            }

            return result;
        },

        getDataAtCol(elID, dataField, total) {
            return $auigrid.getColumnValues(elID, dataField, total);
        },

        getColumnValues(elID, dataField, total) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = $auigrid.colToProp(elID, dataField);
                }

                result = AUIGrid.getColumnValues(gridID, dataField, $string.toBoolean(total));
            }

            return result;
        },

        getGridSetting(elID) {
            var result = null;

            var length = $auigrid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $auigrid.gridControls[i];
                if (item.id == elID) {
                    result = item.setting;
                    break;
                }
            }

            return result;
        },

        getSelectedItem(elID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var selectedItems = AUIGrid.getSelectedItems(gridID);
                if (result.length > 0) {
                    result = selectedItems[0];
                }
            }

            return result;
        },

        getSelectedItems(elID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                result = AUIGrid.getSelectedItems(gridID);
            }

            return result;
        },

        getSelectedText(elID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                result = AUIGrid.getSelectedText(gridID);
            }

            return result;
        },

        forceEditingComplete(elID, value, cancel) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, value, cancel);
            }
        },

        getCellFormatValue(elID, rowIndex, dataField) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }

                result = AUIGrid.getCellFormatValue(gridID, rowIndex, dataField);
            }
            return result;
        },

        getDataAtCell(elID, rowIndex, dataField) {
            if ($string.isNullOrEmpty(rowIndex) == true) {
                return null;
            }

            return $auigrid.getCellValue(elID, rowIndex, dataField);
        },

        getCellValue(elID, rowIndex, dataField) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }

                result = AUIGrid.getCellValue(gridID, rowIndex, dataField);
            }
            return result;
        },

        getColumnDistinctValues(elID, rowIndex, dataField) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                result = AUIGrid.getColumnDistinctValues(gridID, rowIndex, dataField);
            }
            return result;
        },

        validateGridData(elID, dataField) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                result = AUIGrid.validateGridData(gridID, dataField);
            }
            return result;
        },

        setDataAtCell(elID, rowIndex, dataField, value) {
            $auigrid.setCellValue(elID, rowIndex, dataField, value);
        },

        setDataAtRow(elID, values) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID && $object.isArray(values) == true && values.length > 0) {
                var items = [];
                var rowIndexes = [];

                for (var i = 0, length = values.length; i < length; i++) {
                    var item = values[i];
                    var row = item[0];
                    var col = item[1];
                    var value = item[2];

                    var dataField = null;
                    if ($object.isString(col) == true) {
                        if ($auigrid.propToCol(elID, col) > -1) {
                            dataField = col;
                        }
                    }
                    else if ($object.isNumber(col) == true) {
                        dataField = $auigrid.colToProp(elID, col);
                    }

                    if ($string.isNullOrEmpty(dataField) == false) {
                        var data = {};
                        data[dataField] = value;

                        items.push(data);
                        rowIndexes.push(row);
                    }
                }

                if (rowIndexes.length > 0) {
                    AUIGrid.forceEditingComplete(gridID, null, false);

                    AUIGrid.updateRows(gridID, items, rowIndexes);
                }
            }
        },

        setCellValue(elID, rowIndex, dataField, value) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                AUIGrid.setCellValue(gridID, rowIndex, dataField, value);
            }
        },

        setRowPosition(elID, rowIndex) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.setRowPosition(gridID, rowIndex);
            }
        },

        resetUpdatedItems(elID, option) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                option = option || 'a';
                AUIGrid.resetUpdatedItems(gridID, option);
            }
        },

        updateRow(elID, value, rowIndex) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                AUIGrid.updateRow(gridID, value, rowIndex);
            }
        },

        updateRows(elID, values, rowIndexs) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                AUIGrid.updateRows(gridID, values, rowIndexs);
            }
        },

        updateRowBlockToValue(elID, startRowIndex, endRowIndex, dataFields, values) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                AUIGrid.updateRowBlockToValue(gridID, startRowIndex, endRowIndex, dataFields, values);
            }
        },

        updateRowsById(elID, values) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                AUIGrid.updateRowsById(gridID, values);
            }
        },

        updateAllToValue(elID, dataField, value) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }
                AUIGrid.updateAllToValue(gridID, dataField, value);
            }
        },

        indexToRowID(elID, rowIndex) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.indexToRowId(gridID, rowIndex);
            }

            return result;
        },

        isUniqueValue(elID, dataField, value) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }
                result = AUIGrid.isUniqueValue(gridID, dataField, value);
            }

            return result;
        },

        getCheckedRowItems(elID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getCheckedRowItems(gridID);
            }

            return result;
        },

        getRowIndexesByValue(elID, dataField, value) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }
                result = AUIGrid.getRowIndexesByValue(gridID, dataField, value);
            }

            return result;
        },

        getRowsByValue(elID, dataField, value) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }
                result = AUIGrid.getRowsByValue(gridID, dataField, value);
            }

            return result;
        },

        getInitValueItem(elID, RowID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                result = AUIGrid.getInitValueItem(gridID, RowID);
            }

            return result;
        },

        getSourceDataAtRow(elID, rowIndex) {
            return $auigrid.getItemByRowIndex(elID, rowIndex);
        },

        getItemByRowIndex(elID, rowIndex) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                result = AUIGrid.getItemByRowIndex(gridID, rowIndex);
            }

            return result;
        },

        getItemByRowID(elID, rowID) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                result = AUIGrid.getItemByRowId(gridID, rowID);
            }

            return result;
        },

        getItemsByValue(elID, dataField, value) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = AUIGrid.getDataFieldByColumnIndex(gridID, dataField);
                }
                result = AUIGrid.getItemsByValue(gridID, dataField, value);
            }

            return result;
        },

        getGridData(elID, options) {
            var result = null;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var defaultOptions = {
                    stateField: null,
                    added: 'C',
                    removed: 'D',
                    edited: 'U',
                }

                options = syn.$w.argumentsExtend(defaultOptions, options);

                if ($string.isNullOrEmpty(options.stateField) == true) {
                    options.stateField = 'Flag';
                }

                result = AUIGrid.getGridDataWithState(gridID, options.stateField, options);

                var removedRowItems = AUIGrid.getRemovedItems(gridID);
                for (var i = 0, length = removedRowItems.length; i < length; i++) {
                    removedRowItems[i].Flag = 'D';
                }

                var result = result.concat(removedRowItems);

                for (var i = 0, length = result.length; i < length; i++) {
                    var item = result[i];
                    var flagField = item[options.stateField];
                    if ($object.isNullOrUndefined(flagField) == true) {
                        item[options.stateField] = '';
                    }
                }
            }

            return result;
        },

        changeColumnLayout(elID, columnLayout) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.changeColumnLayout(gridID, columnLayout);
            }
        },

        checkEditValue(elID) {
            var result = false;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                var removedRowItems = AUIGrid.getRemovedItems(gridID);
                var editedRowItems = AUIGrid.getEditedRowItems(gridID);
                var addedRowItems = AUIGrid.getAddedRowItems(gridID);
                result = (removedRowItems.length + editedRowItems.length + addedRowItems.length) > 0;
            }

            return result;
        },

        checkUniqueValueCol(elID, dataField, total) {
            var result = true;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = $auigrid.colToProp(elID, dataField);
                }
                total = total || true;
                var columnValues = AUIGrid.getColumnValues(gridID, dataField, $string.toBoolean(total));
                result = !columnValues.filter(function (row, index) { return (columnValues.indexOf(row) !== index) }).length > 0
            }

            return result;
        },

        checkValueCountCol(elID, dataField, checkValue, total) {
            var result = 0;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = $auigrid.colToProp(elID, dataField);
                }

                var columnValues = AUIGrid.getColumnValues(gridID, dataField, $string.toBoolean(total));
                result = columnValues.filter((item) => { return item === checkValue }).length;
            }

            return result;
        },

        checkEmptyValueCol(elID, dataField, checkValue, total) {
            var result = false;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = $auigrid.colToProp(elID, dataField);
                }

                var columnValues = AUIGrid.getColumnValues(gridID, dataField, $string.toBoolean(total));
                if ($object.isNullOrUndefined(checkValue) == true) {
                    if ($auigrid.countRows(elID) == 0) {
                        result = false;
                    }
                    else {
                        result = columnValues.filter((item) => { return $string.isNullOrEmpty(item) == true }).length > 0;
                    }
                }
                else {
                    result = columnValues.filter((item) => { return item === checkValue }).length > 0;
                }
            }

            return result;
        },

        checkEmptyValueCols(elID, columns, checkValue) {
            var result = false;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                var items = AUIGrid.getOrgGridData(gridID);
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
            }

            return result;
        },

        setTransactionBelongID(elID, belongFlow, transactConfig) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                var columns = AUIGrid.getColumnInfoList(gridID);
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
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
                        belongFlow.items[column.dataField] = {
                            fieldID: column.dataField,
                            dataType: dataType
                        };
                    }
                    else {
                        var isBelong = false;
                        if (column.dataField == 'Flag') {
                            isBelong = true;
                        }
                        else if ($object.isNullOrUndefined(column.belongID) == false) {
                            if (column.belongID.indexOf(',') > -1) {
                                var columnBelongIDs = column.belongID.split(',');
                                isBelong = columnBelongIDs.indexOf(transactConfig.functionID) > -1;
                            }
                            else if ($object.isString(column.belongID) == true) {
                                isBelong = transactConfig.functionID == column.belongID;
                            }
                        }

                        if (isBelong == true) {
                            belongFlow.items[column.dataField] = {
                                fieldID: column.dataField,
                                dataType: dataType
                            };
                        }
                    }
                }
            }
        },

        getValue(elID, requestType, metaColumns) {
            var result = [];
            var items = [];
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if (metaColumns) {
                    if (requestType == 'Row') {
                        var rowIndex = AUIGrid.getSelectedIndex(gridID)[0];

                        if (rowIndex != null && rowIndex > -1) {
                            var rowData = AUIGrid.getItemByRowIndex(gridID, rowIndex);
                            var rowFlag = $auigrid.getFlag(gridID, rowIndex) || 'C';
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

                                items.push(data);
                            }
                        }
                    }
                    else if (requestType == 'List') {
                        var removedRowItems = AUIGrid.getRemovedItems(gridID);
                        for (var i = 0, length = removedRowItems.length; i < length; i++) {
                            removedRowItems[i].Flag = 'D';
                        }

                        var editedRowItems = AUIGrid.getEditedRowItems(gridID);
                        for (var i = 0, length = editedRowItems.length; i < length; i++) {
                            editedRowItems[i].Flag = 'U';
                        }

                        var addedRowItems = AUIGrid.getAddedRowItems(gridID);
                        for (var i = 0, length = addedRowItems.length; i < length; i++) {
                            addedRowItems[i].Flag = 'C';
                        }

                        var rowDatas = items.concat(removedRowItems, editedRowItems, addedRowItems);
                        var length = rowDatas.length;

                        for (var rowIndex = 0; rowIndex < length; rowIndex++) {
                            var rowData = rowDatas[rowIndex];
                            var rowFlag = rowData.Flag || 'C';
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

                                    items.push(data);
                                }
                            }
                        }
                    }

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
                } else {
                    syn.$l.eventLog('getUpdateData', 'Input Mapping 설정 없음', 'Debug');
                }
            }

            return result;
        },

        setValue(elID, value, metaColumns) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID && value && value.length > 0) {
                if ($object.isNullOrUndefined(metaColumns) == false) {
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
                                syn.$l.eventLog('syn.uicontrols.$auigrid', '바인딩 데이터 타입과 매핑 정의가 다름, 바인딩 ID - "{0}", 타입 - "{1}"'.format(column, metaColumn.dataType), 'Warning');
                                return;
                            }
                        } else {
                            continue;
                        }
                    }
                }
            }

            AUIGrid.clearSelection(gridID);
            $auigrid.clearConditions(elID);
            const length = value.length;
            for (let i = 0; i < length; i++) {
                value[i].Flag = 'R';
            }

            AUIGrid.setGridData(gridID, value);
        },

        clear(elID, isControlLoad) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.clearGridData(gridID);
            }
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$auigrid = $auigrid;

})(window);
