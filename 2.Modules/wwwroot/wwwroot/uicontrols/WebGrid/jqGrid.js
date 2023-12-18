/// <reference path="/assets/js/syn.js" />

(function (window) {
    jQuery.extend($.fn.fmatter, {
        textFormatter(cellvalue, options, rowObject) {
            return "<input id='".concat(options.rowId, "_", options.pos.toString(), "_text' gid='", options.gid, "' col='", options.pos, "' type='text' datatype='text' class='ui_textbox' textEditType='Text' value='", cellvalue, "' onfocus='$text.textbox_focus(event);' onchange='$grid.dataChangeEventer(event);' />");
        },

        codepickerFormatter(cellvalue, options, rowObject) {
            var dataOptions = options.colModel.dataoptions;
            var code = "";
            var val = "";

            if (cellvalue && cellvalue.indexOf('ⅰ') > -1) {
                var codes = cellvalue.split('ⅰ');
                code = codes[0];
                val = codes[1];
            }
            return "<div style='width:85%;'><input id='".concat(options.rowId, "_", options.pos.toString(), "_codepicker' gid='", options.gid, "' col='", options.pos, "' QueryID='", dataOptions.queryID, "' ParameterFormatString='", dataOptions.parameterFormatString, "' TextField='", dataOptions.textField, "' ValueField='", dataOptions.valueField, "' DialogWidth='", dataOptions.dialogWidth, "' DialogHeight='", dataOptions.dialogHeight, "' HiddenCols='", dataOptions.hiddenCols, "' IsAutoSearch='", dataOptions.isAutoSearch, "' type='text' datatype='codepicker' value='", val, "' maxlength='10' onfocus='$text.textbox_focus(event);' onchange='$grid.dataChangeEventer(event);' onkeydown='$codePicker.jqGridOnKeyDown (event);'/><input type='hidden' id='", options.rowId, "_", options.pos.toString(), "_value' value='" + code + "' /><input type='button' id='", options.rowId, "_", options.pos.toString(), "_button' onclick='$codePicker.jqGridCodePicker (event);' value='...' /></div>");
        },

        selectFormatter(cellvalue, options, rowObject) {
            var result = "";
            var isData = false;
            var items = "";
            var itemData = null;
            var val = "";
            var selectOption = null;
            if ($grid.selectOptions.length > 0) {
                for (var i in $grid.selectOptions) {
                    selectOption = $grid.selectOptions[i];
                    if (selectOption.gid == options.gid && selectOption.pos == options.pos) {
                        val = selectOption.val;
                        items = selectOption.items;
                        isData = true;
                        break;
                    }
                }
            }

            if (items.length > 0) {
                if (val === cellvalue) {
                }
                else {
                    items = items.replace(" selected", "").replace("value='" + cellvalue + "'", "value='" + cellvalue + "' selected");
                }
            }
            else {
                if (options.colModel.dataoptions != null) {
                    $.each(options.colModel.dataoptions.value.split(";"), function (key, value) {
                        itemData = value.split(":");

                        if (itemData[0] === cellvalue) {
                            items += "<option value='".concat(itemData[0], "' selected>", itemData[1], "</option>");
                        }
                        else {
                            items += "<option value='".concat(itemData[0], "'>", itemData[1], "</option>");
                        }
                    });
                }
            }

            if (isData == false) {
                var itemOptions = { "gid": options.gid, "pos": options.pos, "val": cellvalue, "items": items };
                $grid.selectOptions.push(itemOptions);
                itemOptions = null;
            }

            result = "<select id='".concat(options.rowId, "_", options.pos.toString(), "_select' gid='", options.gid, "' col='", options.pos, "' datatype='select' value='", cellvalue, "' onchange='$grid.dataChangeEventer(event);'>", items, "</select>");

            isData = null;
            items = null;
            itemData = null;
            val = null;
            selectOption = null;

            try {
                return result;
            }
            finally {
                result = null;
            }
        },

        checkboxFormatter(cellvalue, options, rowObject) {
            var result = "";
            var checked = "";
            if ((cellvalue.toLowerCase() === "true")) {
                checked = "checked";
            }

            result = "<input id='".concat(options.rowId, "_", options.pos.toString(), "_checkbox' gid='", options.gid, "' col='", options.pos, "' type='checkbox' datatype='checkbox' ", checked, " value='", cellvalue, "' onmouseover='$grid.checkboxDataChecker(event);' onchange='$grid.dataChangeEventer(event);' />");

            checked = null;
            try {
                return result;
            }
            finally {
                result = null;
            }
        },

        buttonFormatter(cellvalue, options, rowObject) {
            var result = "";

            if (cellvalue) {
                result = "<input id='".concat(options.rowId, "_", options.pos.toString(), "_button' gid='", options.gid, "' col='", options.pos, "' type='button' datatype='button' class='ui_textbutton small' value='", cellvalue, "' onclick='$grid.buttonClickEventer(event);' onchange='$grid.dataChangeEventer(event);' />");
            }

            try {
                return result;
            }
            finally {
                result = null;
            }
        },


        radioFormatter(cellvalue, options, rowObject) {
            var items = "";
            var itemData = null;

            if (options.colModel.dataoptions != null) {
                $.each(options.colModel.dataoptions.value.split(";"), function (key, value) {
                    itemData = value.split(":");

                    if (itemData[0] === cellvalue) {
                        items += "<input class='ui_radio' id='".concat(options.rowId, "_", options.pos.toString(), key, "' gid='", options.gid, "' col='", options.pos, "' type='radio' datatype='radio' name='", options.rowId, "_", options.pos.toString(), "_radiogroup' value='", itemData[0], "' checked onchange='$grid.dataChangeEventer(this);' /><label for='", options.rowId, "_", options.pos.toString(), key, "'>", itemData[1], "</label>");
                    }
                    else {
                        items += "<input class='ui_radio' id='".concat(options.rowId, "_", options.pos.toString(), key, "' gid='", options.gid, "' col='", options.pos, "' type='radio' datatype='radio' name='", options.rowId, "_", options.pos.toString(), "_radiogroup' value='", itemData[0], "' onchange='$grid.dataChangeEventer(this);' /><label for='", options.rowId, "_", options.pos.toString(), key, "'>", itemData[1], "</label>");
                    }
                });
            }

            itemData = null;
            try {
                return items;
            }
            finally {
                items = null;
            }
        },

        dateFormatter(cellvalue, options, rowObject) {
            var result = "";
            result = "<div style='width:85%;'><input id='".concat(options.rowId, "_", options.pos.toString(), "_date' gid='", options.gid, "' col='", options.pos, "' type='text' datatype='date' value='", cellvalue, "' maxlength='10' onfocus='$text.textbox_focus(event);' onblur='$text.date_textbox_blur(this, event);' onkeydown='return $text.numeric_textbox_keydown(event);' onchange='$grid.dataChangeEventer(event);' /><input type='button' id='", options.rowId, "_", options.pos.toString(), "_button' onclick='jqGridCalendar (event);' value='...' /></div>");

            try {
                return result;
            }
            finally {
                result = null;
            }
        },

        imageFormatter(cellvalue, options, rowObject) {
            var result = "";
            result = "<img id='".concat(options.rowId, "_", options.pos.toString(), "_image' gid='", options.gid, "' col='", options.pos, "' datatype='image' src='", cellvalue, "' />");

            try {
                return result;
            }
            finally {
                result = null;
            }
        },

        numberFormatter(cellvalue, options, rowObject) {
            var result = "";
            result = "<input id='".concat(options.rowId, "_", options.pos.toString(), "_number' gid='", options.gid, "' col='", options.pos, "' type='text' datatype='number' class='ui_textbox numeric' textEditType='Numeric' value='", cellvalue.toCurrency(), "' onfocus='$text.numeric_textbox_focus(event);' onblur='$text.numeric_textbox_blur(this, event);' onkeydown='return $text.numeric_textbox_keydown(event);' onchange='$grid.dataChangeEventer(event);' />");

            try {
                return result;
            }
            finally {
                result = null;
            }
        }
    });

    jQuery.extend($.fn.fmatter.textFormatter, {
        unformat(cellvalue, options, cell) {
            return $('input', cell).val();
        }
    });

    jQuery.extend($.fn.fmatter.codepickerFormatter, {
        unformat(cellvalue, options, cell) {
            return $('input[id*=_value]', cell).val() + "ⅰ" + $('input[id*=_codepicker]', cell).val();
        }
    });

    jQuery.extend($.fn.fmatter.selectFormatter, {
        unformat(cellvalue, options, cell) {
            return $('select', cell).val();
        }
    });

    jQuery.extend($.fn.fmatter.checkboxFormatter, {
        unformat(cellvalue, options, cell) {
            return $('input', cell).val();
        }
    });

    jQuery.extend($.fn.fmatter.buttonFormatter, {
        unformat(cellvalue, options, cell) {
            return $('input', cell).val();
        }
    });

    jQuery.extend($.fn.fmatter.numberFormatter, {
        unformat(cellvalue, options, cell) {
            return $('input', cell).val().toNumberString();
        }
    });

    jQuery.extend($.fn.fmatter.radioFormatter, {
        unformat(cellvalue, options, cell) {
            return $radio.getValue($('input', cell)[0].name);
        }
    });

    jQuery.extend($.fn.fmatter.dateFormatter, {
        unformat(cellvalue, options, cell) {
            return $('input', cell).val();
        }
    });

    jQuery.extend($.fn.fmatter.imageFormatter, {
        unformat(cellvalue, options, cell) {
            return $('img', cell).attr('src');
        }
    });

    syn.uicontrols = syn.uicontrols || new syn.module();

    var $jqgrid = $jqgrid || new syn.module();

    $jqgrid.extend({
        name: 'syn.uicontrols.$jqgrid',
        version: '1.0.0',

        sortDatas: [],
        selectOptions: [],
        radioOptions: [],
        pagingSettings: [],
        lastRowID: null,
        isMouseDown: false,
        gridOptions: {
            caption: null,
            autoWidth: true,
            gridWidth: 250,
            gridHeight: '200px',
            multiSelect: false,
            multiSelectWidth: 20,
            dataType: 'json',
            rowNumbers: true,
            sortAble: true,
            sortName: '',
            sortOrder: 'asc',
            isPagingLayout: false,
            viewRecords: true,
            gridView: true,
            frozenColumns: false,
            colModels: [
                {
                    name: 'ColumnID1',
                    label: '컬럼명 1',
                    align: 'left',
                    key: false,
                    width: 100,
                    edittype: 'text',
                    frozen: false,
                    hidden: false,
                    resizable: true,
                    sortable: true,
                    sorttype: 'text',
                    dataedittype: ''
                },
                {
                    name: 'ColumnID2',
                    label: '컬럼명 2',
                    align: 'left',
                    key: false,
                    width: 100,
                    edittype: 'text',
                    frozen: false,
                    hidden: false,
                    resizable: true,
                    sortable: true,
                    sorttype: 'text',
                    dataedittype: ''
                },
                {
                    name: 'ColumnID3',
                    label: '컬럼명 3',
                    align: 'left',
                    key: false,
                    width: 100,
                    edittype: 'text',
                    frozen: false,
                    hidden: false,
                    resizable: true,
                    sortable: true,
                    sorttype: 'text',
                    dataedittype: ''
                }
            ]
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend($jqgrid.gridOptions, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                setting.colModels.length = 0;
                var moduleHotSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleHotSettings);
            }

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var dataField = el.getAttribute('syn-datafield');
            var html = '<table id="{0}" name="{0}" syn-datafield="{1}"></table>'.format(elID, dataField);

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.innerHTML = html;

            parent.appendChild(wrapper);

            setTimeout(function () {
                $jqgrid.init(elID, setting);
            }, 25);
        },

        init(eid, setting) {
            /// <summary>
            /// 그리드를 초기화합니다.
            /// </summary>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            syn.$l.addEvent(document, 'contextmenu', function (e) { return false; });
            syn.$l.addEvent(document, 'mousedown', function (e) {
                $jqgrid.isMouseDown = true;
            });

            syn.$l.addEvent(document, 'mousemove', function (e) {
                if (e.ctrlKey == true && $jqgrid.isMouseDown == true) {
                    $jqgrid.isMouseDown = true;
                }
                else {
                    $jqgrid.isMouseDown = false;
                }
            });

            var pathname = location.pathname;
            if (!$w.pageScript) {
                if (pathname.split('/').length > 0) {
                    var filename = pathname.split('/')[pathname.split('/').length - 1];
                    $webform.extend({
                        pageProject: pathname.split('/')[pathname.split('/').length - 2],
                        pageScript: '$' + (filename.indexOf('.') > -1 ? filename.substring(0, filename.indexOf('.')) : filename)
                    });
                }
            }

            var grid = $('#' + eid);
            var gridOptions = setting;

            if (gridOptions.colModels.length > 0) {
                if (gridOptions.multiSelect) {
                    grid.jqGrid({
                        datatype: 'local',
                        editurl: 'clientArray',
                        scrollOffset: 0,
                        shrinkToFit: false,
                        loadonce: false,
                        gridview: gridOptions.gridView,
                        multiselect: gridOptions.multiSelect,
                        multikey: 'ctrlKey',
                        multiselectWidth: 20,
                        colNames: gridOptions.colNames,
                        colModel: gridOptions.colModels,
                        rowNum: 1000,
                        loadtext: 'loading',
                        ondblClickRow() {
                        },
                        onRightClickRow() {
                        }
                    });
                }
                else if (gridOptions.rowNumbers) {
                    grid.jqGrid({
                        datatype: 'local',
                        editurl: 'clientArray',
                        scrollOffset: 0,
                        shrinkToFit: false,
                        loadonce: false,
                        gridview: gridOptions.gridView,
                        rownumbers: false, //gridOptions.rowNumbers,
                        rownumWidth: 20,
                        colNames: gridOptions.colNames,
                        colModel: gridOptions.colModels,
                        rowNum: 1000,
                        loadtext: 'loading',
                        ondblClickRow() {
                        },
                        onRightClickRow() {
                        }
                    });
                }
            }

            //grid.jqGrid('setCaption', gridOptions.caption);
            grid.jqGrid('setGridState', 'state', 'hidden');

            if (grid.jqGrid('getGridParam', 'gridstate') == 'visible') {
                $('#' + eid + '_Box a.ui-jqgrid-titlebar-close').css('display', 'none');
            }

            grid[0].isPagingLayout = gridOptions.isPagingLayout;
            grid[0].sortAble = gridOptions.sortAble;
            if (gridOptions.isPagingLayout == true) {
                var gridHeight = parseInt(gridOptions.gridHeight.replace('px', '')) - 20;
                if (gridHeight < 0) {
                    gridHeight = 0;
                }
                gridOptions.gridHeight = gridHeight.toString() + 'px';

                var navButtons = syn.$l.querySelectorAll('#' + eid + '_Navigation span.bt');
                syn.$l.addEvent(navButtons[0], 'click', $jqgrid.navigationStart);
                syn.$l.addEvent(navButtons[1], 'click', $jqgrid.navigationPreview);
                syn.$l.addEvent(navButtons[2], 'click', $jqgrid.navigationNext);
                syn.$l.addEvent(navButtons[3], 'click', $jqgrid.navigationEnd);
                gridHeight = null;
            }

            grid.jqGrid('setGridHeight', (parseInt(gridOptions.gridHeight.replace('px', '')) - 24).toString() + 'px');
            grid.jqGrid('gridResize', { minWidth: '350', maxWidth: gridOptions.gridWidth, minHeight: '80', maxHeight: gridOptions.gridHeight });

            if (gridOptions.frozenColumns == true) {
                grid.jqGrid('setFrozenColumns');
            }

            var gridParams = {};
            gridParams.datatype = gridOptions.dataType;
            gridParams.sortable = gridOptions.sortAble;
            gridParams.sortname = gridOptions.sortName;
            gridParams.sortorder = gridOptions.sortOrder;
            gridParams.viewrecords = gridOptions.viewRecords;

            $jqgrid.setControlSize(eid, $(syn.$l.get(eid + '_Box').parentElement).width(), false);

            if (syn.$w.pageScript) {
                var mod = window[syn.$w.pageScript];
                if (mod) {
                    gridParams.beforeSelectRow = $jqgrid.webGrid_beforeSelectRow;
                    gridParams.onSortCol = $jqgrid.webGrid_onSortCol;

                    if (mod[eid + '_ondblClickRow']) {
                        gridParams.ondblClickRow = mod[eid + '_ondblClickRow'];
                    }

                    if (mod[eid + '_onRightClickRow']) {
                        gridParams.onRightClickRow = mod[eid + '_onRightClickRow'];
                    }

                    if (mod[eid + '_onSelectRow']) {
                        gridParams.onSelectRow = mod[eid + '_onSelectRow'];
                    }

                    if (mod[eid + '_onSelectAll']) {
                        gridParams.onSelectAll = mod[eid + '_onSelectAll'];
                    }

                    if (mod[eid + '_resizeStart']) {
                        gridParams.resizeStart = mod[eid + '_resizeStart'];
                    }

                    if (mod[eid + '_resizeStop']) {
                        gridParams.resizeStop = mod[eid + '_resizeStop'];
                    }
                }
                mod = null;
            }

            grid.jqGrid('setGridParam', gridParams);

            pathname = null;
            grid = null;
            gridOptions = null;
        },

        webGrid_onCodePickerCallback(eid, rowData) {
            var el = syn.$l.get(eid);
            var gridID = el.getAttribute('gid');
            var mod = window[syn.$webform.pageScript];
            if (mod) {
                var codePickerCallback = mod[gridID + '_onCodePickerCallback'];
                if (codePickerCallback) {
                    var rowid = el.id.split('_')[0];
                    var colid = $jqgrid.getColumnID(gridID, $.jgrid.getCellIndex(el.parentElement.parentElement));
                    codePickerCallback(gridID, rowid, colid, rowData);

                    rowid = null;
                    colid = null;
                    mod = null;
                }
            }

            el = null;
            gridID = null;
        },

        webGrid_onSortCol(index, iCol, sortorder) {
            /// <summary>
            /// onSortCol 이벤트를 재정의합니다.
            /// </summary>
            var target = event.target || event.srcElement;
            var gridID = target.parentNode.id.split('_')[0];
            var grid = syn.$l.get(gridID);
            var mod = window[syn.$w.pageScript];
            if (mod) {
                var headerClick = mod[gridID + '_onHeaderClick'];
                if (headerClick) {
                    headerClick(gridID, iCol);
                    return 'stop';
                }
            }

            if (grid) {
                if (grid.sortAble == true) {
                    if (grid.isPagingLayout == true) {
                        var pagingSettings = $jqgrid.getPagingSettings(gridID);
                        if (pagingSettings) {
                            var JsonObject = null;
                            if (sortorder == 'asc') {
                                JsonObject = JSLINQ(pagingSettings.originalJsonObject)
                                    .OrderBy(function (item) { return item[index]; })
                                    .Select(function (item) { return item; });
                            }
                            else {
                                JsonObject = JSLINQ(pagingSettings.originalJsonObject)
                                    .OrderByDescending(function (item) { return item[index]; })
                                    .Select(function (item) { return item; });
                            }

                            $jqgrid.pageBinding(gridID, JsonObject.items, pagingSettings.viewCount);
                        }

                        target = null;
                        pagingSettings = null;
                        JsonObject = null;
                    }
                    else {
                        // 그리드의 전체 RowStatus를 백업
                        $jqgrid.sortDatas = $jqgrid.getAllRowStatus(gridID);

                        var jGrid = $('#' + gridID);
                        if (jGrid.jqGrid('getGridParam', 'datatype') == 'json') {
                            var dataJsonObject = [];
                            var dataIDs = jGrid.jqGrid('getDataIDs');
                            for (var i = 0, l = dataIDs.length; i < l; i++) {
                                dataJsonObject.push(jGrid.jqGrid('getRowData', dataIDs[i]));
                            }

                            var JsonObject = null;
                            if (sortorder == 'asc') {
                                JsonObject = JSLINQ(dataJsonObject)
                                    .OrderBy(function (item) { return item[index]; })
                                    .Select(function (item) { return item; });
                            }
                            else {
                                JsonObject = JSLINQ(dataJsonObject)
                                    .OrderByDescending(function (item) { return item[index]; })
                                    .Select(function (item) { return item; });
                            }

                            $jqgrid.dataBinding(gridID, JsonObject.items);
                        }
                    }

                    if (mod) {
                        var sortCol = mod[gridID + '_onSortCol'];
                        if (sortCol) {
                            return sortCol(index, iCol, sortorder);
                        }
                    }

                    mod = null;
                }
                else {
                    target = null;
                    gridID = null;
                    return 'stop';
                }
            }
            else {
                target = null;
                gridID = null;
                return 'stop';
            }

            target = null;
            gridID = null;
            grid = null;
        },

        webGrid_onSortingCol(index, iCol, sortorder) {
            /// <summary>
            /// onSortCol 이벤트후를 정의합니다.
            /// </summary>
            var target = event.target || event.srcElement;
            var gridID = target.parentNode.id.split('_')[0];
            var rowStatus = null;

            // 정렬후 RowStatus 복원
            if ($jqgrid.sortDatas) {
                for (var i = 0, l = $jqgrid.sortDatas.length; i < l; i++) {
                    rowStatus = $jqgrid.sortDatas[i];
                    $jqgrid.updateRowStatus(gridID, rowStatus.rowid, rowStatus.flag);

                    if (rowStatus.flag == 'D') {
                        $jqgrid.setRowColor(gridID, rowStatus.rowid, '#fde5d6');
                    }
                }
            }

            var mod = window[syn.$w.pageScript];
            if (mod) {
                var sortingCol = mod[gridID + '_onSortingCol'];
                if (sortingCol) {
                    return sortingCol(index, iCol, sortorder);
                }
            }

            rowStatus = null;
            mod = null;
            target = null;
            gridID = null;
        },

        webGrid_beforeSelectRow(rowid, e) {
            /// <summary>
            /// beforeSelectRow 이벤트를 재정의합니다.
            /// </summary>
            var grid = $('#' + e.delegateTarget.id);
            if (grid.jqGrid('getGridParam', 'multiselect')) {
                if ($.jgrid.getCellIndex(e.target) == 0 || (grid.jqGrid('getGridParam', 'multikey') == 'ctrlKey' && e.ctrlKey)) {
                    grid.jqGrid('setSelection', rowid, false);
                }
            }
            else {
                $jqgrid.resetFocusRow(e.delegateTarget.id);
                $jqgrid.focusRow(e.delegateTarget.id, rowid);
            }

            var mod = window[syn.$webform.pageScript];
            if (mod) {
                var beforeSelectRow = mod[e.delegateTarget.id + '_beforeSelectRow'];
                if (beforeSelectRow) {
                    beforeSelectRow(arguments[0], arguments[1]);
                }
            }
            mod = null;
            grid = null;
        },

        addRow(eid, rowData, position, srcrowid) {
            /// <summary>
            /// 신규 Row를 추가합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.addRow('WebGrid1', { id: '9', invdate: '2007-09-01', name: 'test3', note: 'note3', amount: '400.00', tax: '30.00', total: '430.00' });
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowData' type='Object'>Row 데이터를 표현하는 json 객체입니다.</param>
            /// <param name='position' type='String'>입력되는 데이터의 위치('first', 'last', 'before', 'last')를 설정합니다.</param>
            /// <param name='position' type='String'>입력되는 데이터의 위치가 'before', 'last'일 경우 기준이 되는 rowid입니다.</param>
            var newId = $.jgrid.randId(eid);
            $('#' + eid).jqGrid('addRowData', newId, rowData, position, srcrowid);
            $('#' + newId).addClass('I');
            return newId;
        },

        pageBinding(eid, jsonObject, viewCount, isReadOnly) {
            /// <summary>
            /// json 데이터 셋을 바인딩합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.addRow('WebGrid1', [{ id: '9', invdate: '2007-09-01', name: 'test3', note: 'note3', amount: '400.00', tax: '30.00', total: '430.00' }]);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowData' type='Object'>Row 데이터를 표현하는 json 객체입니다.</param>
            /// <param name='viewCount' type='Integer'>한 화면에 보여질 Rows 수입니다. 기본값은 50입니다.</param>
            /// <param name='isReadOnly' type='Boolean'>읽기전용 바인딩으로 Row의 상태값 스타일 클래스를 반영하지 않습니다.</param>
            var originalJsonObject = $object.clone(jsonObject);
            var rowCount = jsonObject.length;
            var pageViewCount = viewCount;
            if (syn.$l.get(eid).isPagingLayout == true) {
                if (!viewCount) {
                    if (syn.$b.isMobile == true) {
                        pageViewCount = 200;
                    }
                    else {
                        pageViewCount = 500;
                    }
                }

                var val = {};
                var gridRowCount = jsonObject.length;
                var gridTotalPages = gridRowCount % pageViewCount > 0 ? Math.floor(gridRowCount / pageViewCount) + 1 : Math.floor(gridRowCount / (pageViewCount == 0 ? 1 : pageViewCount));
                var spliceJsonObjects = [];

                for (var i = 0; i < gridTotalPages; i++) {
                    spliceJsonObjects.push(jsonObject.splice(0, pageViewCount));
                }

                val.gridid = eid;
                val.rowCount = gridRowCount; // 총 Rows수
                val.viewCount = pageViewCount; // 한 화면에 보여질 Rows수
                val.totalPages = gridTotalPages; // 총 Page 수
                val.currentPageIndex = 1; // 현재 Page 위치
                val.jsonObjects = spliceJsonObjects; // Splice JSON 데이터
                val.originalJsonObject = originalJsonObject; // JSON 데이터

                //2013-01-24 이동호 추가
                var pagingSetting = null;
                for (var i = 0; i < $jqgrid.pagingSettings.length; i++) {
                    pagingSetting = $jqgrid.pagingSettings[i];

                    if (pagingSetting) {
                        if (pagingSetting.gridid == eid) {
                            delete $jqgrid.pagingSettings[i];
                        }
                    }
                }

                $jqgrid.pagingSettings.push(val);

                if (spliceJsonObjects.length > 0) {
                    jsonObject = spliceJsonObjects[0];
                }
                val = null;
                gridRowCount = null;
                spliceJsonObjects = null;
            }

            $jqgrid.dataBinding(eid, jsonObject, false, isReadOnly);
            syn.$l.querySelector('#' + eid + '_Navigation dt').innerText = 'Rows : ' + rowCount.toString();
            syn.$l.querySelector('#' + eid + '_Navigation dd > .page').innerText = '1 / ' + gridTotalPages;

            gridTotalPages = null;
            originalJsonObject = null;
            rowCount = null;
        },

        getPagingSettings(eid) {
            /// <summary>
            /// 지정한 식별자의 PagingSettings를 반환합니다.
            /// </summary>
            /// <param name='managerid' type='String'>파일 관리자 식별자입니다.</param>
            var val = null;
            var pagingSetting = null;
            for (var i = 0; i < $jqgrid.pagingSettings.length; i++) {
                pagingSetting = $jqgrid.pagingSettings[i];

                if (pagingSetting) {
                    if (pagingSetting.gridid == eid) {
                        val = pagingSetting;
                        break;
                    }
                }
            }

            pagingSetting = null;
            try {
                return val;
            }
            finally {
                val = null;
            }
        },

        navigationStart(e) {
            /// <summary>
            /// 첫 페이지로 이동합니다.
            /// </summary>
            /// <param name='e' type='MouseEvent'>MouseEvent 객체입니다.</param>
            var el = e.target || e.srcElement || e;
            var eid = el.parentElement.parentElement.id.replace('_Navigation', '');
            var pagingSetting = $jqgrid.getPagingSettings(eid);

            if (pagingSetting != null) {
                var jsonObject = pagingSetting.jsonObjects[0];
                var isContinue = true;
                var mod = window[syn.$webform.pageScript];
                if (mod) {
                    var beforeNavigation = mod[eid + '_beforeNavigation'];
                    if (beforeNavigation) {
                        isContinue = beforeNavigation(eid, $jqgrid.isUpdateDatas(eid), pagingSetting.currentPageIndex, 1);
                    }
                }

                if (isContinue == true) {
                    pagingSetting.currentPageIndex = 1;
                    $jqgrid.dataBinding(eid, jsonObject);
                    syn.$l.querySelector('#' + eid + '_Navigation dd > .page').innerText = '1 / ' + pagingSetting.totalPages.toString();
                }

                if (mod) {
                    var afterNavigation = mod[eid + '_afterNavigation'];
                    if (afterNavigation) {
                        isContinue = afterNavigation(eid);
                    }
                }

                mod = null;
                jsonObject = null;
                isContinue = null;
            }

            el = null;
            eid = null;
            pagingSetting = null;
        },

        navigationPreview(e) {
            /// <summary>
            /// 이전 페이지로 이동합니다.
            /// </summary>
            /// <param name='e' type='MouseEvent'>MouseEvent 객체입니다.</param>
            var el = e.target || e.srcElement || e;
            var eid = el.parentElement.parentElement.id.replace('_Navigation', '');
            var pagingSetting = $jqgrid.getPagingSettings(eid);

            if (pagingSetting != null) {
                var jsonObject = null;
                var isContinue = true;
                var mod = window[syn.$webform.pageScript];

                if (pagingSetting.currentPageIndex > 1) {
                    if (mod) {
                        var beforeNavigation = mod[eid + '_beforeNavigation'];
                        if (beforeNavigation) {
                            isContinue = beforeNavigation(eid, $jqgrid.isUpdateDatas(eid), pagingSetting.currentPageIndex, (pagingSetting.currentPageIndex - 1));
                        }
                    }

                    if (isContinue == true) {
                        pagingSetting.currentPageIndex--;
                        jsonObject = pagingSetting.jsonObjects[pagingSetting.currentPageIndex - 1];

                        $jqgrid.dataBinding(eid, jsonObject);
                        syn.$l.querySelector('#' + eid + '_Navigation dd > .page').innerText = pagingSetting.currentPageIndex.toString() + ' / ' + pagingSetting.totalPages.toString();
                    }
                }

                if (mod) {
                    var afterNavigation = mod[eid + '_afterNavigation'];
                    if (afterNavigation) {
                        isContinue = afterNavigation(eid);
                    }
                }

                mod = null;
                jsonObject = null;
                isContinue = null;
            }

            el = null;
            eid = null;
            pagingSetting = null;
        },

        navigationNext(e) {
            /// <summary>
            /// 다음 페이지로 이동합니다.
            /// </summary>
            /// <param name='e' type='MouseEvent'>MouseEvent 객체입니다.</param>
            var el = e.target || e.srcElement || e;
            var eid = el.parentElement.parentElement.id.replace('_Navigation', '');
            var pagingSetting = $jqgrid.getPagingSettings(eid);

            if (pagingSetting != null) {
                var jsonObject = null;
                var isContinue = true;
                var mod = window[syn.$webform.pageScript];

                if (pagingSetting.currentPageIndex < pagingSetting.totalPages) {
                    if (mod) {
                        var beforeNavigation = mod[eid + '_beforeNavigation'];
                        if (mod[eid + '_beforeNavigation']) {
                            isContinue = mod[eid + '_beforeNavigation'](eid, $jqgrid.isUpdateDatas(eid), pagingSetting.currentPageIndex, (pagingSetting.currentPageIndex + 1));
                        }
                    }

                    if (isContinue == true) {
                        pagingSetting.currentPageIndex++;
                        jsonObject = pagingSetting.jsonObjects[pagingSetting.currentPageIndex - 1];

                        $jqgrid.dataBinding(eid, jsonObject);
                        syn.$l.querySelector('#' + eid + '_Navigation dd > .page').innerText = pagingSetting.currentPageIndex.toString() + ' / ' + pagingSetting.totalPages.toString();
                    }
                }

                if (mod) {
                    var afterNavigation = mod[eid + '_afterNavigation'];
                    if (afterNavigation) {
                        isContinue = afterNavigation(eid);
                    }
                }

                mod = null;
                jsonObject = null;
                isContinue = null;
            }

            el = null;
            eid = null;
            pagingSetting = null;
        },

        navigationEnd(e) {
            /// <summary>
            /// 마지막 페이지로 이동합니다.
            /// </summary>
            /// <param name='e' type='MouseEvent'>MouseEvent 객체입니다.</param>
            var el = e.target || e.srcElement || e;
            var eid = el.parentElement.parentElement.id.replace('_Navigation', '');
            var pagingSetting = $jqgrid.getPagingSettings(eid);

            if (pagingSetting != null) {
                var jsonObject = pagingSetting.jsonObjects[pagingSetting.jsonObjects.length - 1];
                var isContinue = true;
                var mod = window[syn.$webform.pageScript];

                if (mod) {
                    var beforeNavigation = mod[eid + '_beforeNavigation'];
                    if (beforeNavigation) {
                        isContinue = beforeNavigation(eid, $jqgrid.isUpdateDatas(eid), pagingSetting.currentPageIndex, pagingSetting.totalPages);
                    }
                }

                if (isContinue == true) {
                    pagingSetting.currentPageIndex = pagingSetting.totalPages;
                    $jqgrid.dataBinding(eid, jsonObject);
                    syn.$l.querySelector('#' + eid + '_Navigation dd > .page').innerText = pagingSetting.totalPages.toString() + ' / ' + pagingSetting.totalPages.toString();
                }

                if (mod) {
                    var afterNavigation = mod[eid + '_afterNavigation'];
                    if (afterNavigation) {
                        isContinue = afterNavigation(eid);
                    }
                }

                mod = null;
                jsonObject = null;
                isContinue = null;
            }

            el = null;
            eid = null;
            pagingSetting = null;
        },

        isUpdateDatas(eid) {
            /// <summary>
            /// 입력, 수정, 삭제가 발생한 모든 데이터 정보가 있는지 확인합니다.
            /// </summary>
            /// <example>
            /// var isUpdate = $jqgrid.isUpdateDatas('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <returns type='Boolean' />
            var val = false;
            var flag = '';
            var row = null;
            var el = null;
            var grid = $('#' + eid);
            var gridTable = grid[0];

            for (var i = 1, l = gridTable.rows.length; i < l; i++) {
                el = gridTable.rows[i];
                flag = syn.$m.hasClass(el, 'I') == true ? 'I' : syn.$m.hasClass(el, 'U') == true ? 'U' : syn.$m.hasClass(el, 'D') == true ? 'D' : '';

                switch (flag) {
                    case 'I':
                    case 'U':
                    case 'D':
                        return true;
                        break;
                }
            }

            flag = null;
            row = null;
            el = null;
            grid = null;
            gridTable = null;
            try {
                return val;
            }
            finally {
                val = null;
            }
        },

        dataBinding(eid, jsonObject, isAdd, isReadOnly) {
            /// <summary>
            /// json 데이터 셋을 바인딩합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.addRow('WebGrid1', [{ id: '9', invdate: '2007-09-01', name: 'test3', note: 'note3', amount: '400.00', tax: '30.00', total: '430.00' }]);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowData' type='Object'>Row 데이터를 표현하는 json 객체입니다.</param>
            /// <param name='isAdd' type='Boolean'>데이터 바인딩시 기존 데이터를 삭제할지 여부입니다. 기본값은 false입니다.</param>
            /// <param name='isReadOnly' type='Boolean'>읽기전용 바인딩으로 Row의 상태값 스타일 클래스를 반영하지 않습니다.</param>
            var row = null;
            var grid = $('#' + eid);

            if (!isAdd) {
                isAdd = false;
            }

            if (isAdd == false) {
                grid.jqGrid('clearGridData');
            }

            if (isReadOnly) {
                for (var i = 0, l = jsonObject.length; i < l; i++) {
                    grid.jqGrid('addRowData', $.jgrid.randId(eid), jsonObject[i]);
                }
            }
            else {
                var newId = null;
                for (var i = 0, l = jsonObject.length; i < l; i++) {
                    newId = $.jgrid.randId(eid);
                    grid.jqGrid('addRowData', newId, jsonObject[i]);
                    $('#' + newId).addClass('R');
                }

                newId = null;
            }

            row = null;
            grid = null;
        },

        bulkBinding(eid, jsonObject, isReadOnly) {
            /// <summary>
            /// json 데이터 셋을 바인딩합니다. 바인딩 전에 그리드 데이터를 초기화합니다.
            /// </summary>
            /// <example>
            // $jqgrid.bulkBinding('WebGrid1', {'name':'Table','page':1,'total':4,'records':4,'rows':[{'id':'jqGridJson00','cell':['1','E착한학생복의업체','서울 E착한학생복의업체 입니다.','True']},{'id':'jqGridJson01','cell':['2','테스트외부업체','테스트용 업체','True']},{'id':'jqGridJson02','cell':['3','E착한학생복해 업체','전라남도 영광 입니다.','True']},{'id':'jqGridJson03','cell':['4','테스트업체','서울 테스트업체 입니다.','True']}]});
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='jsonObject' type='Object'>Row 데이터를 표현하는 Json 객체입니다.</param>
            /// <param name='isReadOnly' type='Boolean'>읽기전용 바인딩으로 Row의 상태값 스타일 클래스를 반영하지 않습니다.</param>
            var grid = $('#' + eid);
            $.jgrid.uidPref = eid;
            var el = null;
            var gridTable = grid[0];

            grid.jqGrid('setGridParam', { datatype: 'json', loadonce: true });
            gridTable.addJSONData(jsonObject);
            grid.jqGrid('setGridParam', { datatype: 'local', loadonce: true });

            if (isReadOnly) {
            }
            else {
                for (var i = 1, l = gridTable.rows.length; i < l; i++) {
                    syn.$m.addClass(gridTable.rows[i], 'R');
                }
            }

            el = null;
            grid = null;
            gridTable = null;
            i = null;
            l = null;
        },

        restoreHideRow(eid, rowid) {
            /// <summary>
            /// deleteRow 처리된 행을 복구합니다.
            /// </summary>
            /// <example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>
            var rowControl = $('#' + rowid);
            if (rowid) {
                rowControl.removeClass('D').addClass('R').show();
                $jqgrid.setRowColor(eid, rowid, '');
            }

            rowControl = null;
        },

        deleteRow(eid, rowid) {
            /// <summary>
            /// Row 데이터를 삭제합니다. Row 식별자를 지정하지 않으면, 현재 선택된 Row를 삭제합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.deleteRow('WebGrid1');
            /// $jqgrid.deleteRow('WebGrid1', 'rowid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>
            var grid = $('#' + eid);
            var rowControl = $('#' + rowid);

            if (rowid) {
                if (rowControl.hasClass('I')) {
                    grid.jqGrid('delRowData', rowid);
                }
                else if (rowControl.hasClass('R')) {
                    rowControl.removeClass('R').addClass('D');
                    $jqgrid.setRowColor(eid, rowid, '#fde5d6');
                }
                else if (rowControl.hasClass('U')) {
                    rowControl.removeClass('U').addClass('D');
                    $jqgrid.setRowColor(eid, rowid, '#fde5d6');
                }
            }
            else {
                var selrow = grid.jqGrid('getGridParam', 'selrow');
                if (selrow == null) {
                    alert('Please select the rows to be deleted.');
                }
                else {
                    if (rowControl.hasClass('I')) {
                        grid.jqGrid('delRowData', rowid);
                    }
                    else {
                        rowControl.addClass('D');
                        $jqgrid.setRowColor(eid, rowid, '#fde5d6');
                    }
                }
                selrow = null;
            }

            rowControl = null;
            grid = null;
        },

        hiddenRow(eid, rowid) {
            /// <summary>
            /// Row 데이터를 삭제합니다. Row 식별자를 지정하지 않으면, 현재 선택된 Row를 삭제합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.hiddenRow('WebGrid1');
            /// $jqgrid.hiddenRow('WebGrid1', 'rowid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>
            var grid = $('#' + eid);
            var rowControl = $('#' + rowid);

            if (rowid) {
                if (rowControl.hasClass('I')) {
                    grid.jqGrid('delRowData', rowid);
                }
                else if (rowControl.hasClass('R')) {
                    rowControl.removeClass('R').addClass('D').hide();
                }
                else if (rowControl.hasClass('U')) {
                    rowControl.removeClass('U').addClass('D').hide();
                }
            }
            else {
                var selrow = grid.jqGrid('getGridParam', 'selrow');
                if (selrow == null) {
                    alert('Please select the rows to be hidden.');
                }
                else {
                    if (rowControl.hasClass('I')) {
                        grid.jqGrid('delRowData', rowid);
                    }
                    else {
                        rowControl.addClass('D').hide();
                    }
                }
                selrow = null;
            }

            rowControl = null;
            grid = null;
        },

        editRow(eid, rowid) {
            /// <summary>
            /// Row를 편집 모드로 변경합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.editRow('WebGrid1', 'rowid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>
            syn.$l.get(rowid).gridRowObject = $jqgrid.getRowData(eid, rowid);
            $('#' + eid).jqGrid('editRow', rowid);
        },

        saveRow(eid, rowid) {
            /// <summary>
            /// 편집한 데이터를 저장합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.saveRow('WebGrid1', 'rowid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>
            $('#' + eid).jqGrid('saveRow', rowid, false, 'clientArray');

            var rowControl = $('#' + rowid);

            if (rowControl.hasClass('R')) {
                rowControl.removeClass('R');
                rowControl.addClass('U');
            }

            rowControl = null;
        },

        restoreRow(eid, rowid) {
            /// <summary>
            /// 편집한 데이터를 취소 한다음 편집모드를 해제합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.restoreRow('WebGrid1', 'rowid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>

            //$('#' + eid).jqGrid('restoreRow', rowid);
            $jqgrid.saveRow(eid, rowid);
            var row = syn.$l.get(rowid);
            if (row.gridRowObject) {
                $jqgrid.updateRow(eid, rowid, row.gridRowObject);
                row.gridRowObject = undefined;
            }

            row = null;
        },

        updateRow(eid, rowid, jsonObject) {
            /// <summary>
            /// Row 데이터를 변경합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.updateRow('WebGrid1', 'rowid1', { id: 'update', invdate: '2012-00-01', name: 'test3', note: 'note3', amount: '400.00', tax: '30.00', total: '430.00' });
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>
            /// <param name='jsonObject' type='Object'>Row 데이터를 표현하는 Json 객체입니다.</param>
            var grid = $('#' + eid);
            var rowControl = $('#' + rowid);

            if (rowControl.hasClass('I') || rowControl.hasClass('R') || rowControl.hasClass('U')) {
                grid.jqGrid('updateRow', rowid, jsonObject);
            }

            if (rowControl.hasClass('R')) {
                rowControl.removeClass('R');
                rowControl.addClass('U');
            }

            grid = null;
            rowControl = null;
        },

        updateRowStatus(eid, rowid, statusFlag) {
            /// <summary>
            /// Row 데이터 상태값을 변경합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.updateRowStatus('WebGrid1', 'rowid1', 'U');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>
            /// <param name='statusFlag' type='String'>Row 데이터 상태를 표시하는 값('I', 'R', 'U', 'D')입니다.</param>
            var rowControl = $('#' + rowid);

            rowControl.removeClass('I').removeClass('R').removeClass('U').removeClass('D');
            rowControl.addClass(statusFlag);

            rowControl = null;
        },

        updateRowsStatus(eid, statusFlag) {
            /// <summary>
            /// 전체 Row 데이터 상태값을 변경합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.updateRowStatus('WebGrid1', 'rowid1', 'U');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='statusFlag' type='String'>Row 데이터 상태를 표시하는 값('I', 'R', 'U', 'D')입니다.</param>
            var grid = $('#' + eid);
            var dataIDs = grid.jqGrid('getDataIDs');

            for (var i = 0, l = dataIDs.length; i < l; i++) {
                $jqgrid.updateRowStatus(eid, dataIDs[i], statusFlag);
            }

            grid = null;
            dataIDs = null;
        },

        colHidden(eid, colid, isHidden) {
            /// <summary>
            /// Row 데이터를 변경합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.colHidden('WebGrid1', 'id', true);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='colid' type='String'>Column 식별자입니다.</param>
            /// <param name='isHidden' type='Boolean'>컬럼 숨김 여부입니다.</param>
            var grid = $('#' + eid);

            if (isHidden) {
                grid.jqGrid('hideCol', colid);
            }
            else {
                grid.jqGrid('showCol', colid);
            }

            grid = null;
        },

        deleteSelectedRow(eid) {
            /// <summary>
            /// MultiSelect그리드일 경우, 선택된 모든 Row 데이터를 삭제합니다. 
            /// </summary>
            /// <example>
            /// $jqgrid.deleteSelectedRow('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row 식별자입니다.</param>
            var grid = $('#' + eid);
            var selarrrow = null;
            selarrrow = grid.jqGrid('getGridParam', 'selarrrow');
            for (var i = selarrrow.length - 1; i >= 0; i--) {
                this.deleteRow(eid, selarrrow[i]);
            }

            grid = null;
            selarrrow = null;
        },

        gridExportJson(eid) {
            /// <summary>
            /// 선택된 jqGrid의 모든 정보를 Json 문자열로 반환합니다.
            /// </summary>
            /// <example>
            /// var jsonString = $jqgrid.gridExportJson('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <returns type='String' />
            return $('#' + eid).jqGrid('jqGridExport', { exptype: 'jsonstring' });
        },

        gridImportJson(eid, jsonString) {
            /// <summary>
            /// (현재사용안함) jqGrid 모든 정보를 Json 문자열로 그리드를 복원합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.gridImportJson('WebGrid1', jsonString);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='jsonString' type='String'>Json 문자열입니다.</param>
            $('#' + eid).jqGrid('jqGridImport', { imptype: 'jsonstring', impstring: jsonString });
        },

        getFocusRowID(eid) {
            /// <summary>
            /// 선택된 Row의 Row 식별자를 반환합니다.
            /// </summary>
            /// <example>
            /// var rowid = $jqgrid.getFocusRowID('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <returns type='String' />
            return $('#' + eid).jqGrid('getGridParam', 'selrow');
        },

        focusRow(eid, rowid) {
            /// <summary>
            /// 특정 Row에 포커스를 지정합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.focusRow('WebGrid1', $jqgrid.getRowID('WebGrid1', 2));
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            $('#' + eid).jqGrid('setSelection', rowid, true);
        },

        resetFocusRow(eid) {
            /// <summary>
            /// 모든 Row에 적용되어 있는 포커스를 삭제합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.resetFocusRow('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            $('#' + eid).jqGrid('resetSelection');
        },

        autoSizeMode(eid, shrink) {
            /// <summary>
            /// 모든 Column Size를 재 조정합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.autoSizeMode('WebGrid1', true);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='shrink' type='Boolean'>WebGrid의 식별자입니다.</param>
            $('#' + eid).jqGrid('setGridWidth', $('#' + eid).jqGrid('getGridParam', 'width'), shrink);
        },

        getRowID(eid, rowIndex) {
            /// <summary>
            /// 특정 Row 인덱스의 Row 식별자를 반환합니다.
            /// </summary>
            /// <example>
            /// var rowid = $jqgrid.getRowID('WebGrid1', 1);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowIndex' type='Integer'>Row의 인덱스입니다.</param>
            /// <returns type='String' />
            return $('#' + eid).jqGrid('getDataIDs')[rowIndex];
        },

        getRowIndex(eid, rowID) {
            /// <summary>
            /// 특정 Row 인덱스의 Row 인덱스를 반환합니다.
            /// </summary>
            /// <example>
            /// var rowid = $jqgrid.getRowIndex('WebGrid1', 'rowid');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowID' type='String'>Row의 식별자입니다.</param>
            /// <returns type='String' />
            return $('#' + eid)[0].rows[rowID].rowIndex;
        },

        getRowCount(eid) {
            /// <summary>
            /// 그리드의 전체 Row 수를 반환합니다.
            /// </summary>
            /// <example>
            /// var rowid = $jqgrid.getRowCount('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <returns type='Integer' />
            return $('#' + eid).jqGrid('getDataIDs').length;
        },

        getVisibleRowCount(eid) {
            /// <summary>
            /// 그리드의 숨겨진 행을 제외한 Row 수를 반환합니다.
            /// </summary>
            /// <example>
            /// var rowid = $jqgrid.getRowCount('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <returns type='Integer' />
            var grid = $('#' + eid);
            var gridTable = grid[0];
            var rowCount = 0;
            var flag = '';

            for (var i = 1; i < gridTable.rows.length; i++) {
                el = gridTable.rows[i];
                flag = syn.$m.hasClass(el, 'I') == true ? 'I' : syn.$m.hasClass(el, 'U') == true ? 'U' : syn.$m.hasClass(el, 'D') == true ? 'D' : 'R';

                switch (flag) {
                    case 'I':
                    case 'U':
                    case 'R':
                        rowCount++;
                        break;
                }
            }

            grid = null;
            gridTable = null;
            flag = null;
            try {
                return rowCount;
            }
            finally {
                rowCount = null;
            }
        },

        getCellText(eid, rowid, colid) {
            /// <summary>
            /// 특정 Cell의 텍스트 값을 반환합니다.
            /// </summary>
            /// <example>
            /// var value = $jqgrid.getCellText('WebGrid1', $jqgrid.getRowID('WebGrid1', 2), 'id');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <param name='colid' type='String'>Column의 식별자입니다.</param>
            /// <returns type='String' />
            var grid = $('#' + eid);
            var val = grid.jqGrid('getCell', rowid, colid);
            var colModels = grid.jqGrid('getGridParam', 'colModel');
            var colModel = null;

            if (colModels) {
                var selectValue = '';
                for (var i = 0; i < colModels.length; i++) {
                    colModel = colModels[i];

                    if (colModel.name === colid && (colModel.edittype === 'select' || colModel.dataedittype === 'datalist')) {
                        if (colModel.edittype === 'select') {
                            if (colModel.dataoptions != null) {
                                $.each(colModel.editoptions.value.split(';'), function (key, value) {
                                    selectData = value.split(':');

                                    if (val == selectData[0]) {
                                        selectValue = selectData[1];
                                    }
                                });
                            }
                        }
                        else if (colModel.dataedittype === 'datalist') {
                            if (colModel.dataoptions != null) {
                                $.each(colModel.dataoptions.value.split(';'), function (key, value) {
                                    selectData = value.split(':');

                                    if (val == selectData[0]) {
                                        selectValue = selectData[1];
                                    }
                                });
                            }
                        }

                        if (selectValue.length > 0) {
                            val = selectValue;
                            break;
                        }
                    }
                }
            }

            if (val === false) {
                val = '';
            }

            grid = null;
            colModels = null;
            colModel = null;

            try {
                return val;
            }
            finally {
                val = null;
            }
        },

        getCellValue(eid, rowid, colid) {
            /// <summary>
            /// 특정 Cell의 값을 반환합니다.
            /// </summary>
            /// <example>
            /// var value = $jqgrid.getCellValue('WebGrid1', $jqgrid.getRowID('WebGrid1', 2), 'id');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <param name='colid' type='String'>Column의 식별자입니다.</param>
            /// <returns type='String' />
            var grid = $('#' + eid);
            var val = grid.jqGrid('getCell', rowid, colid);
            var colModels = grid.jqGrid('getGridParam', 'colModel');
            var colModel = null;

            if (colModels) {
                var selectValue = '';
                for (var i = 0; i < colModels.length; i++) {
                    colModel = colModels[i];

                    if (colModel.name === colid && (colModel.edittype === 'select' || colModel.dataedittype === 'datalist')) {
                        if (colModel.edittype === 'select') {
                            $.each(colModel.editoptions.value.split(';'), function (key, value) {
                                selectData = value.split(':');

                                if (val == selectData[0]) {
                                    selectValue = selectData[0];
                                }
                            });
                        }
                        else if (colModel.dataedittype === 'datalist') {
                            $.each(colModel.dataoptions.value.split(';'), function (key, value) {
                                selectData = value.split(':');

                                if (val == selectData[0]) {
                                    selectValue = selectData[0];
                                }
                            });
                        }

                        if (selectValue.length > 0) {
                            val = selectValue;
                            break;
                        }
                    }
                }
            }

            if (val === false) {
                val = '';
            }

            grid = null;
            colModels = null;
            colModel = null;

            try {
                return val;
            }
            finally {
                val = null;
            }
        },

        setCellText(eid, rowid, colid, value) {
            /// <summary>
            /// 특정 Cell의 텍스트 값을 입력합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.setCellText('WebGrid1', $jqgrid.getRowID('WebGrid1', 2), 'id', 'update');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <param name='colid' type='String'>Column의 식별자입니다.</param>
            /// <param name='value' type='String'>Cell에 입력할 값입니다.</param>
            var grid = $('#' + eid);
            var rowData = grid.jqGrid('getRowData', rowid);
            var val = rowData[colid];
            var rowControl = $('#' + rowid);

            if (val == undefined) {
            }
            else {
                rowData[colid] = value;
                grid.jqGrid('updateRow', rowid, rowData);

                if (rowControl.hasClass('R')) {
                    rowControl.removeClass('R');
                    rowControl.addClass('U');
                }
            }

            grid = null;
            rowData = null;
            rowControl = null;
            val = null;
        },

        setCellValue(eid, rowid, colid, value) {
            /// <summary>
            /// 특정 Cell의 값을 입력합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.setCellValue('WebGrid1', $jqgrid.getRowID('WebGrid1', 2), 'id', 'update');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <param name='colid' type='String'>Column의 식별자입니다.</param>
            /// <param name='value' type='String'>Cell에 입력할 값입니다.</param>
            var grid = $('#' + eid);
            var rowData = grid.jqGrid('getRowData', rowid);
            var val = rowData[colid];
            var rowControl = $('#' + rowid);

            if (val == undefined) {
            }
            else {
                rowData[colid] = value;
                grid.jqGrid('updateRow', rowid, rowData);

                if (rowControl.hasClass('R')) {
                    rowControl.removeClass('R');
                    rowControl.addClass('U');
                }
            }

            grid = null;
            rowData = null;
            rowControl = null;
            val = null;
        },

        getColumnCollection(eid) {
            /// <summary>
            /// jqGrid의 모든 컬럼 정보가 있는 colModel 컬렉션을 반환합니다.
            /// </summary>
            /// <example>
            /// var columns = $jqgrid.getColumnCollection('WebGrid1');
            /// for (var i = 0; i < columns.length; i++)
            /// {
            ///     alert(columns[i].name);
            /// }
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <returns type='Object[]' />
            return $('#' + eid).jqGrid('getGridParam', 'colModel');
        },

        getColumn(eid, colid) {
            /// <summary>
            /// 특정 컬럼 정보가 있는 colModel 컬렉션을 반환합니다.
            /// </summary>
            /// <example>
            /// var colModel = $jqgrid.getColumn('WebGrid1', 'id');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='colid' type='String'>Column의 식별자입니다.</param>
            /// <returns type='Object[]' />
            return $('#' + eid).jqGrid('getCol', colid);
        },

        getColumnID(eid, colIndex) {
            /// <summary>
            /// 특정 컬럼의 식별자를 반환합니다.
            /// </summary>
            /// <example>
            /// var colid = $jqgrid.getColumnID('WebGrid1', 1);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='colIndex' type='Integer'>Column의 순서입니다.</param>
            /// <returns type='String' />
            var colData = $('#' + eid).jqGrid('getGridParam', 'colModel')[colIndex];
            var val = undefined;

            if (colData != undefined) {
                val = colData.name;
            }

            colData = null;
            try {
                return val;
            }
            finally {
                val = null;
            }
        },

        setHeaderText(eid, colName, value) {
            /// <summary>
            /// 특정 컬럼의 헤더를 지정합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.setHeaderText('WebGrid1', 'id', 'update HeaderText');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='colName' type='String'>Column의 식별자입니다.</param>
            /// <param name='value' type='String'>헤더 텍스트에 적용할 문자열입니다.</param>
            $('#' + eid).jqGrid('setLabel', colName, value);
        },

        getRowData(eid, rowid) {
            /// <summary>
            /// 특정 Row의 Json 객체를 반환합니다.
            /// </summary>
            /// <example>
            /// var rowObject = $jqgrid.getRowData('WebGrid1', 'rowid');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <returns type='Json Object' />
            return $('#' + eid).jqGrid('getRowData', rowid);
        },

        getCellIndex(targetElement) {
            /// <summary>
            /// HTML TableDataCell 요소의 컬럼 인덱스를 반환합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.getCellIndex(eventTarget);
            /// </example>
            /// <param name='eventTarget' type='Element'>HTML TableDataCell 요소입니다.</param>
            /// <returns type='Integer' />
            var val;

            try {
                val = $.jgrid.getCellIndex(targetElement);
            }
            catch (e) {
                val = undefined;
            }

            try {
                return val;
            }
            finally {
                val = null;
            }
        },

        setControlSize(eid, width, shrink, height) {
            /// <summary>
            /// 그리드의 사이즈를 변경합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.setControlSize('WebGrid1', 800, 480, true);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='width' type='Integer'>Width 값입니다.</param>
            /// <param name='height' type='Integer'>Height 값입니다.</param>
            /// <param name='shrink' type='Boolean'>사이즈 변경시 컬럼의 사이즈를 반영할 지 여부입니다.</param>
            var grid = $('#' + eid);
            grid.jqGrid('setGridWidth', width, shrink);

            if (height) {
                grid.jqGrid('setGridHeight', height);
            }

            grid = null;
        },

        setColumnWidth(eid, colIndex, colWidth) {
            /// <summary>
            /// (현재사용안함) 컬럼의 사이즈를 변경합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.setColumnWidth('WebGrid1', 1, 100);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='colIndex' type='Integer'>컬럼 인덱스입니다.</param>
            /// <param name='colWidth' type='Integer'>Width 값입니다.</param>
            var grid = $('#' + eid);
            var colData = grid.jqGrid('getGridParam', 'colModel')[colIndex];

            if (colData == undefined) {
                alert('컬럼 인덱스에 맞는 컬럼 정보를 찾을 수 없습니다.');
            }
            else {
                grid.jqGrid('setColProp', colData.name, { width: colWidth });
            }

            grid = null;
            colData = null;
        },

        dataClear(eid) {
            /// <summary>
            /// 그리드의 모든 Row를 삭제합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.setColumnWidth('WebGrid1', 1, 100);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            $('#' + eid).jqGrid('clearGridData');

            if (syn.$l.get(eid).isPagingLayout == true) {
                var pagingSetting = null;
                for (var i = 0; i < $jqgrid.pagingSettings.length; i++) {
                    pagingSetting = $jqgrid.pagingSettings[i];

                    if (pagingSetting) {
                        if (pagingSetting.gridid == eid) {
                            delete $jqgrid.pagingSettings[i];
                            break;
                        }
                    }
                }

                syn.$l.querySelector('#' + eid + '_Navigation dt').innerText = 'Rows : 0';
                syn.$l.querySelector('#' + eid + '_Navigation dd > .page').innerText = '1 / 1';
                pagingSetting = null;
            }
        },

        getUpdateRowID(eid, dataClass) {
            /// <summary>
            /// 지정한 dataClass에 맞는 모든 rowid 컬렉션을 반환합니다.
            /// </summary>
            /// <example>
            /// var insertRowIDs = $jqgrid.getUpdateRowID('WebGrid1', 'I');
            /// var updateRowIDs = $jqgrid.getUpdateRowID('WebGrid1', 'U');
            /// var deleteRowIDs = $jqgrid.getUpdateRowID('WebGrid1', 'D');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='dataClass' type='String'>데이터의 식별자 그룹입니다.</param>
            /// <returns type='String[]' />
            var grid = $('#' + eid);
            var gridTable = grid[0];
            var ids = [], i = 0, l, j = 0;
            var el = null;

            l = gridTable.rows.length;
            if (l && l > 0) {
                while (i < l) {
                    el = gridTable.rows[i];
                    if (syn.$m.hasClass(el, dataClass) == true) {
                        ids[j] = el.id;
                        j++;
                    }
                    i++;
                }
            }

            el = null;
            grid = null;
            gridTable = null;
            i = null;
            l = null;
            j = null;

            try {
                return ids;
            }
            finally {
                ids = null;
            }
        },

        getAllRowStatus(eid) {
            /// <summary>
            /// 지정한 그리드의 모든 row 상태 컬렉션을 반환합니다.
            /// </summary>
            /// <example>
            /// var rowsStatus = $jqgrid.getAllRowStatus('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <returns type='String[]' />
            var grid = $('#' + eid);
            var gridTable = grid[0];
            var ids = [], i = 0, j = 0, l;
            var el = null;
            var flag = '';

            l = gridTable.rows.length;
            for (var i = 1; i < l; i++) {
                el = gridTable.rows[i];
                flag = syn.$m.hasClass(el, 'I') == true ? 'I' : syn.$m.hasClass(el, 'U') == true ? 'U' : syn.$m.hasClass(el, 'D') == true ? 'D' : 'R';

                ids[j] = { 'rowid': el.id, 'flag': flag };
                j++;
            }

            flag = null;
            el = null;
            grid = null;
            gridTable = null;
            i = null;
            j = null;
            l = null;

            try {
                return ids;
            }
            finally {
                ids = null;
            }
        },

        getUpdateDatasByXML(eid, columns) {
            /// <summary>
            /// 입력, 수정, 삭제가 발생한 모든 데이터 정보를 XML 문자열로 반환합니다.
            /// </summary>
            /// <example>
            /// var updateGridRows = $jqgrid.getUpdateDatasByXML('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='columns' type='Array String'>데이터 정보를 반환할 컬럼 식별자 목록입니다. columns 매개변수가 없을 경우 전체 컬럼의 데이터를 반환합니다.</param>
            /// <returns type='string' />
            var el = null;
            var grid = $('#' + eid);
            var gridTable = grid[0];
            var l = gridTable.rows.length;
            var flag = '';
            var row = null;

            $sb.clear();
            $sb.append('<' + eid + '>');

            if (columns) {
                for (var i = 0; i < gridTable.rows.length; i++) {
                    el = gridTable.rows[i];

                    flag = syn.$m.hasClass(el, 'I') == true ? 'I' : syn.$m.hasClass(el, 'U') == true ? 'U' : syn.$m.hasClass(el, 'D') == true ? 'D' : '';
                    switch (flag) {
                        case 'I':
                        case 'U':
                        case 'D':
                            row = grid.getRowData(el.id);

                            $sb.append("<rows flag='' + flag + '' ");
                            for (var col in row) {
                                if ($array.contains(columns, col) == true) {
                                    $sb.append(col.toString() + "='' + row[col].toString().replace(/&/gi, '&amp;').replace(/</gi, '&lt;').replace(/>/gi, '&gt;').replace(/\n/gi, '&#10;').replace(/'/gi, '&apos;') + '' ");
                                }
                            }
                            $sb.append('/>');
                            break;
                    }
                }
            }
            else {
                for (var i = 0; i < gridTable.rows.length; i++) {
                    el = gridTable.rows[i];

                    flag = syn.$m.hasClass(el, 'I') == true ? 'I' : syn.$m.hasClass(el, 'U') == true ? 'U' : syn.$m.hasClass(el, 'D') == true ? 'D' : '';
                    switch (flag) {
                        case 'I':
                        case 'U':
                        case 'D':
                            row = grid.getRowData(el.id);

                            $sb.append("<rows flag='' + flag + '' ");
                            for (var col in row) {
                                $sb.append(col.toString() + "='' + row[col].toString().replace(/&/gi, '&amp;').replace(/</gi, '&lt;').replace(/>/gi, '&gt;').replace(/\n/gi, '&#10;').replace(/'/gi, '&apos;') + '' ");
                            }
                            $sb.append('/>');
                            break;
                    }
                }
            }

            $sb.append('</' + eid + '>');

            el = null;
            grid = null;
            gridTable = null;
            l = null;
            flag = null;
            row = null;

            return $sb.toString();
        },

        getUpdateDatas(eid, columns) {
            /// <summary>
            /// 입력, 수정, 삭제가 발생한 모든 데이터 정보를 Json 객체로 반환합니다.
            /// </summary>
            /// <example>
            /// var updateGridRows = $jqgrid.getUpdateDatas('WebGrid1');
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='columns' type='Array String'>데이터 정보를 반환할 컬럼 식별자 목록입니다. columns 매개변수가 없을 경우 전체 컬럼의 데이터를 반환합니다.</param>
            /// <returns type='Json Object' />
            var val = {};
            val.gridID = eid;
            val.rows = new Array();

            var flag = '';
            var row = null;
            var el = null;
            var grid = $('#' + eid);
            var gridTable = grid[0];
            var tmpRow = [];

            if (columns) {
                for (var i = 0; i < gridTable.rows.length; i++) {
                    el = gridTable.rows[i];
                    flag = syn.$m.hasClass(el, 'I') == true ? 'I' : syn.$m.hasClass(el, 'U') == true ? 'U' : syn.$m.hasClass(el, 'D') == true ? 'D' : '';

                    switch (flag) {
                        case 'I':
                        case 'U':
                        case 'D':
                            row = grid.getRowData(el.id);

                            for (var col in row) {
                                if ($array.contains(columns, col) == true) {
                                    tmpRow[col] = row[col];
                                }
                            }

                            row.flag = flag;
                            val.rows.push(tmpRow);
                            tmpRow = [];
                            break;
                    }
                }
            }
            else {
                for (var i = 0; i < gridTable.rows.length; i++) {
                    el = gridTable.rows[i];
                    flag = syn.$m.hasClass(el, 'I') == true ? 'I' : syn.$m.hasClass(el, 'U') == true ? 'U' : syn.$m.hasClass(el, 'D') == true ? 'D' : '';

                    switch (flag) {
                        case 'I':
                        case 'U':
                        case 'D':
                            row = grid.getRowData(el.id);
                            row.flag = flag;
                            val.rows.push(row);
                            break;
                    }
                }
            }

            flag = null;
            row = null;
            tmpRow = null;
            el = null;
            grid = null;
            gridTable = null;

            try {
                return val;
            }
            finally {
                val = null;
            }
        },

        setMergeHeader(eid, useColSpan, headers) {
            /// <summary>
            /// 그룹 헤더를 지정합니다.
            /// </summary>
            /// <example>
            /// $jqgrid.setMergeHeader('WebGrid1', true, [{ startColumnName: 'id', numberOfColumns: 3, titleText: 'Header Text'}]);
            /// </example>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='useColSpan' type='Boolean'>컬럼 병합을 시도합니다.</param>
            /// <param name='headers' type='Array Object'>헤더 구성에 필요한 배열 객체입니다.</param>
            $('#' + eid).jqGrid('setGroupHeaders', { useColSpanStyle: useColSpan, groupHeaders: headers });
        },

        getCellStyle(eid, rowid, colid, style) {
            /// <summary>
            /// 특정 Cell의 스타일 값을 가져옵니다.
            /// </summary>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <param name='colid' type='String'>Column의 식별자입니다.</param>
            /// <param name='style' type='String'>CSS 속성 단일값입니다.</param>
            var el = syn.$l.querySelector('#' + eid + ' #' + rowid + ' > td[aria-describedby*=' + colid + ']');
            var result = null;

            if ($object.isNullOrUndefined(el) == false) {
                result = syn.$w.getStyle(el, style);
            }

            try {
                return result;
            }
            finally {
                result = null;
            }
        },

        getRowStyle(eid, rowid, style) {
            /// <summary>
            /// 특정 Row의 스타일 값을 가져옵니다.
            /// </summary>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <param name='style' type='String'>CSS 속성 단일값입니다.</param>
            var el = syn.$l.querySelector('#' + eid + ' #' + rowid);
            var result = null;

            if ($object.isNullOrUndefined(el) == false) {
                result = syn.$w.getStyle(el, style);
            }

            try {
                return result;
            }
            finally {
                result = null;
            }
        },

        setCellColor(eid, rowid, colid, foreColor, backColor) {
            /// <summary>
            /// 특정 Cell의 폰트색 또는 배경색을 설정합니다.
            /// </summary>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <param name='colid' type='String'>Column의 식별자입니다.</param>
            /// <param name='foreColor' type='String'>HTML 컬러값입니다.</param>
            /// <param name='backColor' type='String'>HTML 컬러값입니다.</param>
            var grid = $('#' + eid);
            if (foreColor) {
                $('#' + eid).jqGrid('setCell', rowid, colid, '', { 'color': foreColor });
            }

            if (backColor) {
                $('#' + eid).jqGrid('setCell', rowid, colid, '', { 'background-color': backColor });
            }
            grid = null;
        },

        setRowColor(eid, rowid, backColor) {
            /// <summary>
            /// 특정 Row의 폰트색 또는 배경색을 설정합니다.
            /// </summary>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='rowid' type='String'>Row의 식별자입니다.</param>
            /// <param name='backColor' type='String'>HTML 컬러값입니다.</param>
            syn.$m.setStyle(syn.$l.get(rowid), 'background-color', backColor);
        },

        setColumnsColor(eid, colids, foreColor, backColor) {
            /// <summary>
            /// 지정한 컬럼들의 폰트색 또는 배경색을 설정합니다.
            /// </summary>
            /// <param name='eid' type='String'>WebGrid의 식별자입니다.</param>
            /// <param name='colids' type='String[]'>컬럼의 식별자 배열입니다.</param>
            /// <param name='foreColor' type='String'>HTML 컬러값입니다.</param>
            /// <param name='backColor' type='String'>HTML 컬러값입니다.</param>
            var grid = $('#' + eid);
            var gridTable = $('#' + eid)[0];
            var rowid = null;
            var el = null;
            if ($object.isArray(colids) == true) {
                if (foreColor && backColor) {
                    for (var i = 1, l = gridTable.rows.length; i < l; i++) {
                        el = gridTable.rows[i];
                        rowid = el.id;
                        for (var j = 0; j < colids.length; j++) {
                            grid.jqGrid('setCell', rowid, colids[j], '', { 'color': foreColor });
                            grid.jqGrid('setCell', rowid, colids[j], '', { 'background-color': backColor });
                        }
                    }
                }
                else if (foreColor && !backColor) {
                    for (var i = 1, l = gridTable.rows.length; i < l; i++) {
                        el = gridTable.rows[i];
                        for (var j = 0; j < colids.length; j++) {
                            grid.jqGrid('setCell', el.id, colids[j], '', { 'color': foreColor });
                        }
                    }
                }
                else if (!foreColor && backColor) {
                    for (var i = 1, l = gridTable.rows.length; i < l; i++) {
                        el = gridTable.rows[i];
                        for (var j = 0; j < colids.length; j++) {
                            grid.jqGrid('setCell', el.id, colids[j], '', { 'background-color': backColor });
                        }
                    }
                }
            }
            else {
                if (foreColor && backColor) {
                    for (var i = 1, l = gridTable.rows.length; i < l; i++) {
                        el = gridTable.rows[i];
                        rowid = el.id;
                        grid.jqGrid('setCell', rowid, colids, '', { 'color': foreColor });
                        grid.jqGrid('setCell', rowid, colids, '', { 'background-color': backColor });
                    }
                }
                else if (foreColor && !backColor) {
                    for (var i = 1, l = gridTable.rows.length; i < l; i++) {
                        el = gridTable.rows[i];
                        grid.jqGrid('setCell', el.id, colids, '', { 'color': foreColor });
                    }
                }
                else if (!foreColor && backColor) {
                    for (var i = 1, l = gridTable.rows.length; i < l; i++) {
                        el = gridTable.rows[i];
                        grid.jqGrid('setCell', el.id, colids, '', { 'background-color': backColor });
                    }
                }
            }

            el = null;
            rowid = null;
            grid = null;
            gridTable = null;
        },

        checkboxDataChecker(e) {
            var el = e.target;
            if (!el) {
                el = e;
            }

            if ($jqgrid.isMouseDown == true && $jqgrid.lastRowID != el.id) {
                if (el.checked == true) {
                    el.checked = false;
                }
                else {
                    el.checked = true;
                }

                $jqgrid.dataChangeEventer(el);
            }

            $jqgrid.lastRowID = el.id;
            el = null;
        },

        buttonClickEventer(e) {
            var el = e.target;
            if (!el) {
                el = e;
            }
            var gid = el.getAttribute('gid');
            var colIndex = el.getAttribute('col');
            var type = el.getAttribute('type');
            var rowId = el.id.split('_')[0];

            if (window[syn.$w.pageScript]) {
                var func = window[syn.$w.pageScript][gid + '_buttonClick'];
                if (func) {
                    func(el, gid, rowId, colIndex);
                }
            }

            func = null;
            el = null;
            gid = null;
            colIndex = null;
            type = null;
            rowId = null;
            functionName = null;
        },

        dataChangeEventer(e) {
            var el = e.target;
            if (!el) {
                el = e;
            }
            var gid = el.getAttribute('gid');
            var colIndex = el.getAttribute('col');
            var type = el.getAttribute('datatype');
            var rowid = el.id.split('_')[0];
            var rowObject = $jqgrid.getRowData(gid, rowid);

            rowObject[$jqgrid.getColumnID(gid, colIndex)] = function (el, type) {
                var val = '';
                switch (type) {
                    case 'checkbox':
                        val = el.checked.toString().toLowerCase();
                        break;
                    case 'select':
                        val = el.options[el.selectedIndex].value;
                        break;
                    case 'radio':
                        val = $radio.getValue(rowid + '_' + colIndex + '_radiogroup');
                        break;
                    case 'date':
                        $text.date_textbox_blur(el, event);
                        val = el.value;
                        break;
                    case 'codepicker':
                        var text = '';
                        var value = '';
                        if (el.resultValue) {
                            text = el.resultValue['textField'];
                            value = el.resultValue['valueField'];
                        }
                        else {
                            text = el.value;
                            value = syn.$l.get(el.id.replace('_codepicker', '_value')).value;
                        }

                        syn.$l.get(el.id.replace('_codepicker', '_value')).value = value;
                        el.value = text;
                        val = value + 'ⅰ' + text;
                        text = null;
                        value = null;
                        break;
                    default:
                        val = el.value;
                        break;
                }

                try {
                    return val;
                }
                finally {
                    val = null;
                }
            }(el, type);

            var mod = window[syn.$webform.pageScript];
            if (mod) {
                var func = mod[gid + '_beforeUpdateRow'];
                if (func) {
                    func(gid, rowid, colIndex, rowObject);
                }
            }

            $jqgrid.updateRow(gid, rowid, rowObject);

            var row = syn.$l.get(rowid);
            if (syn.$m.hasClass(row, 'R') == true) {
                syn.$m.removeClass(row, 'R');
                syn.$m.addClass(row, 'U');
            }

            mod = null;
            func = null;
            el = null;
            gid = null;
            colIndex = null;
            type = null;
            rowId = null;
            row = null;
            rowObject = null;
            functionName = null;
        },

        clear(elID, isControlLoad) {
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$jqgrid = $jqgrid;

})(window);
