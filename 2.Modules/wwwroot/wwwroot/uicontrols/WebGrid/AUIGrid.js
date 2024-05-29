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
        version: '1.0.0',

        gridControls: [],
        gridCodeDatas: [],
        nowHeaderMenuVisible: false,
        currentDataField: null,
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
            cellMergePolicy: 'withNull',
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
            editable: true,
            enterKeyColumnBase: true,
            selectionMode: 'multipleCells',
            hoverMode: 'singleRow',
            useContextMenu: true,
            enableFilter: true,
            useGroupingPanel: false,
            showStateColumn: false,
            displayTreeOpen: false,
            simplifySelectionEvent: true,
            softRemoveRowMode: false,
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
                columnLayout = $auigrid.getInitializeColumns(setting, elID);
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
            setting.height = setting.height || '100%';

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var dataField = el.getAttribute('syn-datafield');
            var html = '<div id="{0}" syn-datafield="{1}"></div>'.format(elID, dataField);

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

            if (mod) {
                // https://www.auisoft.net/documentation/auigrid/DataGrid/Events.html
                var gridHookEvents = el.getAttribute('syn-events');
                try {
                    if (gridHookEvents) {
                        gridHookEvents = eval(gridHookEvents);

                        for (var i = 0, length = gridHookEvents.length; i < length; i++) {
                            var hook = gridHookEvents[i];
                            var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                            if (eventHandler) {
                                AUIGrid.bind(gridID, hook, eventHandler);
                            }
                        }

                        if (gridHookEvents.indexOf('pasteBegin') == -1) {
                            AUIGrid.bind(gridID, 'pasteBegin', function (evt) {
                                if ($string.toBoolean(setting.isClipboardPaste) == false) {
                                    return false;
                                }
                            });
                        }

                        if (gridHookEvents.indexOf('contextMenu') == -1) {
                            var contextEL = document.createElement('ul');
                            contextEL.id = 'auigridHeaderContextMenu';
                            contextEL.className = 'aui-grid-context-ui-menu';
                            contextEL.style.cssText = 'position: absolute; display: none; z-index: 100; padding: 16px;';

                            var li1 = document.createElement('li');
                            li1.id = 'headerItem1';
                            li1.textContent = '오름 차순 정렬';
                            contextEL.appendChild(li1);

                            var li2 = document.createElement('li');
                            li2.id = 'headerItem2';
                            li2.textContent = '내림 차순 정렬';
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
                            li6.textContent = '메뉴 닫기';
                            contextEL.appendChild(li6);

                            document.body.appendChild(contextEL);

                            AUIGrid.bind(gridID, 'contextMenu', $auigrid.contextEventHandler);

                            AUIGrid.bind(gridID, 'vScrollChange', function (evt) {
                                $auigrid.hideContextMenu();
                            });

                            AUIGrid.bind(gridID, 'hScrollChange', function (evt) {
                                $auigrid.hideContextMenu();
                            });
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
            var result = [];

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
                var options = column[8];

                var columnInfo = {
                    elID: elID,
                    dataField: columnID,
                    headerText: columnName,
                    columnType: columnType,
                    width: width,
                    filter: {
                        enable: true,
                        showIcon: true
                    },
                    visible: !isHidden,
                    editable: $string.toBoolean(settings.editable) == false ? false : !$string.toBoolean(readOnly),
                    style: $object.isNullOrUndefined(alignConstants) == true ? '' : `text:${alignConstants}!`,
                    belongID: $object.isNullOrUndefined(belongID) == true ? '' : belongID,
                    validators: null
                }

                if (options) {
                    for (var option in options) {
                        if (option == 'validators' || option == '') {
                            continue;
                        }

                        columnInfo[option] = options[option];
                    }
                }

                var dataSource = null;
                if ($object.isString(columnType) == true) {
                    switch (columnType) {
                        case 'text':
                            columnInfo.editRenderer = {
                                type: 'InputEditRenderer',
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
                            columnInfo.editRenderer = {
                                type: 'InputEditRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                passwordMode: true,
                                regExp: '^[a-zA-Z0-9\\s,.~!@#$%^&*()[\\]{}<>`\'":;|+\\-\\/\\\\]+$'
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

                                result = stripTags(value, '<em><p><br><b><u><strong><big><img>');
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
                                        eventHandler(dataField, rowIndex, columnIndex, value, item);
                                    }
                                }
                            }
                            break;
                        case 'button':
                            columnInfo.renderer = {
                                type: 'ButtonRenderer',
                                onClick: (evt) => {
                                    var mod = window[syn.$w.pageScript];
                                    var eventHandler = mod.event['{0}_cellButtonClick'.format(columnInfo.elID)];
                                    if (eventHandler) {
                                        eventHandler(evt.dataField, evt.rowIndex, evt.columnIndex, evt.text, evt.item);
                                    }
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

                            if ($string.isNullOrEmpty(columnInfo.altField) == false) {
                                columnInfo.renderer.altField = columnInfo.altField;
                            }

                            if ($string.isNullOrEmpty(columnInfo.srcFunction) == false && eval('typeof ' + columnInfo.srcFunction) == 'function') {
                                columnInfo.renderer.srcFunction = eval(columnInfo.srcFunction);
                            }
                            break;
                        case 'dropdown':
                            var storeSourceID = columnInfo.storeSourceID || columnInfo.dataSourceID;
                            if (storeSourceID) {
                                var mod = window[syn.$w.pageScript];
                                if (mod.config && mod.config.dataSource && mod.config.dataSource[storeSourceID]) {
                                    dataSource = mod.config.dataSource[storeSourceID];
                                }
                            }

                            if ($object.isNullOrUndefined(dataSource) == true) {
                                $auigrid.dataRefresh(elID, columnInfo);
                            }

                            columnInfo.labelFunction = function (rowIndex, columnIndex, value, headerText, item) {
                                var result = '';
                                var storeSourceID = this.storeSourceID || this.dataSourceID;
                                if (storeSourceID) {
                                    var keyValueList = $this.config.dataSource[storeSourceID] ? $this.config.dataSource[storeSourceID].DataSource : [];
                                    for (var i = 0, len = keyValueList.length; i < len; i++) {
                                        if (keyValueList[i]['CodeID'] == value) {
                                            result = keyValueList[i]['CodeValue'];
                                            break;
                                        }
                                    }
                                }
                                return result == '' ? value : result;
                            };

                            columnInfo.editRenderer = {
                                type: 'DropDownListRenderer',
                                autoCompleteMode: true,
                                easyMode: true,
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                listAlign: 'left',
                                list: $this.config.dataSource[storeSourceID] ? $this.config.dataSource[storeSourceID].DataSource : [],
                                keyField: 'CodeID',
                                valueField: 'CodeValue',
                                validator: function (oldValue, newValue, item, dataField, fromClipboard, which) {
                                    var isValid = false;
                                    var storeSourceID = this.storeSourceID || this.dataSourceID;
                                    if (storeSourceID) {
                                        var keyValueList = $this.config.dataSource[codeColumnID] ? $this.config.dataSource[codeColumnID].DataSource : [];
                                        for (var i = 0, len = keyValueList.length; i < len; i++) {
                                            if (keyValueList[i]['CodeValue'] == newValue) {
                                                isValid = true;
                                                break;
                                            }
                                        }
                                    }
                                    return isValid;
                                }
                            }
                            break;
                        case 'checkbox':
                            columnInfo.renderer = {
                                type: 'CheckBoxEditRenderer',
                                showLabel: false,
                                editable: true,
                                checkValue: $string.isNullOrEmpty(columnInfo.checkValue) == true ? 'Y' : columnInfo.checkValue,
                                unCheckValue: $string.isNullOrEmpty(columnInfo.unCheckValue) == true ? 'N' : columnInfo.unCheckValue,
                            }

                            if ($string.isNullOrEmpty(columnInfo.checkableFunction) == false && eval('typeof ' + columnInfo.checkableFunction) == 'function') {
                                columnInfo.renderer.checkableFunction = eval(columnInfo.checkableFunction);
                            }
                            break;
                        case 'codehelp':
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
                                showPlaceholder: true,
                                openDirectly: true,
                                onlyCalendar: false,
                                showExtraDays: true
                            }
                            break;
                        case 'time':
                            columnInfo.dataType = 'date';
                            columnInfo.dateInputFormat = 'HH:MM:ss';
                            columnInfo.formatString = $string.isNullOrEmpty(columnInfo.formatString) == true ? 'HH:MM:ss' : columnInfo.formatString;
                            columnInfo.editRenderer = {
                                type: 'CalendarRenderer',
                                showEditorBtn: false,
                                showEditorBtnOver: true,
                                defaultFormat: 'HH:MM:ss',
                                onlyTimeMode: true,
                                showTimePicker: true,
                                showTimeSecond: $string.isNullOrEmpty(columnInfo.showTimeSecond) == true ? false : columnInfo.showTimeSecond,
                                showConfirmBtn: true
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

                result.push(columnInfo);
            }

            return result;
        },

        dataRefresh(elID, setting, callback) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
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

                    var columnInfos = AUIGrid.getColumnInfoList(gridID);
                    var colIndex = $auigrid.propToCol(elID, setting.columnName);
                    var columnInfo = columnInfos[colIndex];
                    if (columnInfo.columnType == 'dropdown') {
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
                $auigrid.nowHeaderMenuVisible = true;
                $auigrid.currentDataField = evt.dataField.replaceAll(',', '_');

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
                    AUIGrid.hideColumnByDataField(gridID, $auigrid.currentDataField);
                    break;
                case 'headerItem5':
                    AUIGrid.showAllColumns(gridID);
                    $('#headerItemUL span.ui-icon[data]').addClass('ui-icon-check')
                        .removeClass('ui-icon-blank');
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

        setControlSize(elID, width, height) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.resize(gridID, width, height);
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

        getColumnSize(elID, columnName) {
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getColumnIndexByDataField(gridID, columnName);
            }

            return result;
        },

        setFitColumnSize(elID, fitToGrid) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                setTimeout(() => {
                    var colSizeList = AUIGrid.getFitColumnSizeList(gridID, $string.toBoolean(fitToGrid));
                    AUIGrid.setColumnSizeList(gridID, colSizeList);
                }, 200);
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

        selectCell(elID, rowIndex, colIndex) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.setSelectionByIndex(gridID, $string.toNumber(rowIndex), $string.toNumber(colIndex));
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
            var result = -1;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                result = AUIGrid.getDataFieldByColumnIndex(gridID, $string.toNumber(colIndex));
            }
            return result;
        },

        // func = (dataField, value, item) => {}
        addCondition(elID, dataField, func) {
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
                result = AUIGrid.clearFilterAll(gridID);
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

                var triggerOptions = syn.$w.getTriggerOptions(elID);
                if (triggerOptions) {
                    if (triggerOptions.sourceValueID && triggerOptions.targetColumnID) {
                        var mod = window[syn.$w.pageScript];
                        if (mod) {
                            var synControls = mod.context.synControls;
                            if (synControls && synControls.length > 0) {
                                if ($object.isArray(triggerOptions.sourceValueID) == true && $object.isArray(triggerOptions.targetColumnID) == true) {
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

                                            var targetColumn = columns.find(function (item) { return item.dataField == triggerOptions.targetColumnID; });
                                            if (targetColumn != null) {
                                                if (controlInfo.type == 'grid') {
                                                    var sourceGridID = controlInfo.id;
                                                    var sourceRow = $grid.getActiveRowIndex(sourceGridID);
                                                    var sourceCol = $grid.propToCol(sourceGridID, dataColumnID);
                                                    var sourceValue = $grid.getDataAtCell(sourceGridID, sourceRow, sourceCol);

                                                    defaultValue[triggerOptions.targetColumnID] = sourceValue;
                                                }
                                                else if (controlInfo.type == 'auigrid') {
                                                    var sourceGridID = controlInfo.id;
                                                    var gridID = $auigrid.getGridID(sourceGridID);
                                                    var selected = AUIGrid.getSelectedIndex(gridID);
                                                    var sourceRow = selected[0];
                                                    var sourceValue = AUIGrid.getCellValue(gridID, sourceRow, dataColumnID);

                                                    defaultValue[triggerOptions.targetColumnID] = sourceValue;
                                                }
                                                else {
                                                    var el = syn.$l.querySelector('[syn-datafield="{0}"] #{1}'.format(dataFieldID, dataColumnID));
                                                    if ($object.isNullOrUndefined(el) == false) {
                                                        defaultValue[triggerOptions.targetColumnID] = el.value;
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

                // rowIndex = Number or first, last, selectionUp, selectionDown
                AUIGrid.addRow(gridID, values, setting.rowIndex);

                if (callback) {
                    callback(row, amount);
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
            }
        },

        removeRow(elID, dataField, rowIndex, callback) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                rowIndex = rowIndex || 'selectedIndex';
                var colIndex = 0;
                if ($object.isNullOrUndefined(rowIndex) == true) {
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
                    rowIndex = rowCount - 1;
                }

                if ($object.isString(dataField) == true) {
                    colIndex = AUIGrid.getColumnIndexByDataField(gridID, dataField);
                }
                else {
                    colIndex = dataField;
                }

                if (callback) {
                    callback(rowIndex, colIndex);
                }

                if (rowIndex > -1) {
                    if (colIndex > -1) {
                        AUIGrid.setSelectionByIndex(gridID, rowIndex, colIndex);
                    }
                    else {
                        AUIGrid.setSelectionByIndex(gridID, rowIndex, 0);
                    }
                }
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
                    } else {
                        for (var i = 0, length = columns.length; i < length; i++) {
                            var column = columns[i];
                            var dataField = AUIGrid.getDataFieldByColumnIndex(gridID, column);
                            if ($string.isNullOrEmpty(dataField) == false) {
                                AUIGrid.showColumnByDataField(gridID, dataField);
                            }
                        }
                    }
                } else {
                    if ($object.isNumber(columns) == true) {
                        var dataField = AUIGrid.getDataFieldByColumnIndex(gridID, columns);
                        if ($string.isNullOrEmpty(dataField) == false) {
                            AUIGrid.hideColumnByDataField(gridID, dataField);
                        }
                    } else {
                        for (var i = 0, length = columns.length; i < length; i++) {
                            var column = columns[i];
                            var dataField = AUIGrid.getDataFieldByColumnIndex(gridID, column);
                            if ($string.isNullOrEmpty(dataField) == false) {
                                AUIGrid.hideColumnByDataField(gridID, dataField);
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

        setCellValue(elID, dataField, value) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                AUIGrid.setCellValue(gridID, dataField, value);
            }
        },

        setRowPosition(elID, rowIndex) {
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.setRowPosition(gridID, rowIndex);
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

        checkUniqueValueCol(elID, dataField, total) {
            var result = true;
            var gridID = $auigrid.getGridID(elID);
            if (gridID) {
                AUIGrid.forceEditingComplete(gridID, null, false);

                if ($object.isNumber(dataField) == true) {
                    dataField = $auigrid.colToProp(elID, dataField);
                }

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

                var items = AUIGrid.getOrgGridData(elID);
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
                            var rowData = AUIGrid.getItemByRowIndex(rowIndex);
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

                        var rowDatas = items.concat(removedRowItems, editedRowItems, addedRowItems)
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
                                    isTypeCheck = item[column] == null || $object.isString(item[column]) || $string.isNumber(item[column]);
                                    break;
                                case 'bool':
                                    isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isBoolean(item[column]);
                                    break;
                                case 'number':
                                case 'int':
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
                }

                AUIGrid.setGridData(gridID, value);
            }
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
