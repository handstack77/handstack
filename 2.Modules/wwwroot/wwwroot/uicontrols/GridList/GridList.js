/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $list = syn.uicontrols.$list || new syn.module();

    /*
    // 업무 화면 사용자 검색 필터 처리 필요
    var listDataTable = syn.uicontrols.$list.getControl('lstDataTable');
    $('#toDate, #fromDate').unbind().bind('keyup', function () {
        listDataTable.table.draw();
    });

    $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {
            var min = Date.parse($('#fromDate').val());
            var max = Date.parse($('#toDate').val());
            var targetDate = Date.parse(data[5]);

            if ((isNaN(min) && isNaN(max)) ||
                (isNaN(min) && targetDate <= max) ||
                (min <= targetDate && isNaN(max)) ||
                (targetDate >= min && targetDate <= max)) {
                return true;
            }
            return false;
        }
    );
    */

    $list.extend({
        name: 'syn.uicontrols.$list',
        version: '1.0',
        listControls: [],
        defaultSetting: {
            width: '100%',
            height: '300px',
            paging: true,
            ordering: true,
            info: true,
            searching: true,
            select: true,
            lengthChange: false,
            autoWidth: true,
            pageLength: 50,
            orderCellsTop: true,
            fixedHeader: true,
            responsive: true,
            checkbox: false,
            order: [],
            sScrollY: '0px',
            footerCallback: function () {
                // 업무 화면 footer 영역에 사용자 지정 집계 구현
                // <tfoot>
                //     <tr>
                //         <th colspan="2" style="text-align:right;white-space:nowrap;">TOTAL : </th>
                //         <th colspan="6" style="text-align:left;white-space:nowrap;"></th>
                //     </tr>
                // </tfoot>
                // var api = this.api();
                // var result = 0;
                // api.column(7, { search: 'applied' }).data().each(function (data, index) {
                //     result += parseFloat(data);
                // });
                // $(api.column(3).footer()).html(result.toLocaleString() + '원');
            },
            fnDrawCallback: function () {
                var $dataTable = this.dataTable();
                var $dataTableWrapper = this.closest('.dataTables_wrapper');
                setTimeout(function () {
                    // $dataTable.fnAdjustColumnSizing(false);

                    if (typeof (TableTools) != 'undefined') {
                        var tableTools = TableTools.fnGetInstance(table);
                        if (tableTools != null && tableTools.fnResizeRequired()) {
                            tableTools.fnResizeButtons();
                        }
                    }

                    var panelHeight = $dataTableWrapper.parent().height();
                    var paginateHeight = $dataTableWrapper.find('.dataTables_paginate').height();

                    var toolbarHeights = 0;
                    $dataTableWrapper.find('.fg-toolbar').each(function (i, obj) {
                        toolbarHeights = toolbarHeights + $(obj).height();
                    });

                    var scrollHeadHeight = 0;
                    $dataTableWrapper.find('.dataTables_scrollHead').each(function (i, obj) {
                        scrollHeadHeight = scrollHeadHeight + $(obj).height();
                    });

                    var height = panelHeight - toolbarHeights - scrollHeadHeight - paginateHeight;
                    var elScrollY = $dataTableWrapper.find('.dataTables_scrollBody');
                    elScrollY.height(height);
                    elScrollY.css({ 'maxHeight': (height).toString() + 'px' });
                    $dataTable._fnScrollDraw();
                }, 150);
            },
            language: {
                emptyTable: '데이터가 없습니다',
                info: '_START_ - _END_ \/ _TOTAL_',
                infoEmpty: '0 - 0 \/ 0',
                infoFiltered: '(총 _MAX_ 개)',
                infoThousands: ',',
                lengthMenu: '페이지당 줄수 _MENU_',
                loadingRecords: '읽는중...',
                processing: '처리중...',
                search: '검색:',
                zeroRecords: '검색 결과가 없습니다',
                paginate: {
                    first: '처음',
                    last: '마지막',
                    next: '다음',
                    previous: '이전'
                }
            },
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList: function (el, moduleList, setting, controlType) {
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

        controlLoad: function (elID, setting) {
            var el = syn.$l.get(elID);
            setting = syn.$w.argumentsExtend($list.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;

            el.setAttribute('id', elID + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.style.width = setting.width;
            wrapper.style.height = setting.height;
            wrapper.style.position = 'relative';
            wrapper.className = 'list-container';

            var headers = [];

            headers.push('<thead><tr>');

            if (setting.checkbox === true) {
                // syn.uicontrols.$list.getControl('lstDataTable').table.column(0).checkboxes.selected().toArray();
                setting.columnDefs = [{
                    targets: 0,
                    checkboxes: {
                        selectRow: true
                    }
                }];

                setting.select = {
                    style: 'multi'
                };

                delete setting.sScrollY;
                delete setting.fnDrawCallback;
            };

            for (var i = 0; i < setting.columns.length; i++) {
                var column = setting.columns[i];
                headers.push('<th>{0}</th>'.format(column.title));

                delete column.title;
            }
            headers.push('</tr></thead>');

            wrapper.innerHTML = '<table id="' + elID + '" class="display" style="width:100%">' + headers.join('') + '</table>';

            parent.appendChild(wrapper);

            if (setting.searching === true) {
                $('#{0} thead tr'.format(elID)).clone(true).appendTo('#{0} thead'.format(elID));
                $('#{0} thead tr:eq(1) th'.format(elID)).each(function (i) {
                    var title = $(this).text();
                    $(this).html('<input type="text" class="dataTables_searchtext" />');

                    $('input', this).on('keyup change', function () {
                        var elID = this.closest('.dataTables_wrapper').id.split('_')[0];
                        var table = $list.getControl(elID).table;
                        if (table.column(i).search() !== this.value) {
                            table.column(i).search(this.value).draw();
                        }
                    });
                });

                if (setting.checkbox === true) {
                    $('#lstDataTable thead tr:eq(1) th:first-child input').hide();
                }
            }

            var elDataTable = $('#' + elID);
            var table = elDataTable.DataTable(setting);

            var gridHookEvents = syn.$l.get(elID + '_hidden').getAttribute('syn-events');
            try {
                if (gridHookEvents) {
                    gridHookEvents = eval(gridHookEvents);
                }
            } catch (error) {
                syn.$l.eventLog('GridList_controlLoad', error.toString(), 'Debug');
            }

            if (gridHookEvents) {
                for (var i = 0; i < gridHookEvents.length; i++) {
                    var hook = gridHookEvents[i];

                    var mod = window[syn.$w.pageScript];
                    if (mod) {
                        var eventHandler = mod.event['{0}_{1}'.format(elID, hook)];
                        if (eventHandler) {
                            switch (hook) {
                                case 'select':
                                    table.on('select', function (e, dt, type, indexes) {
                                        table[type](indexes).nodes().to$().addClass('custom-selected');
                                        if (type === 'row') {
                                            var data = table.rows(indexes).data();
                                            var eventHandler = mod.event['{0}_{1}'.format(elID, hook)];
                                            eventHandler.apply(syn.$l.get(elID), [data, e, dt, type, indexes]);
                                        }
                                    });
                                    break;
                                case 'deselect':
                                    table.on('deselect', function (e, dt, type, indexes) {
                                        var eventHandler = mod.event['{0}_{1}'.format(elID, hook)];
                                        eventHandler.apply(syn.$l.get(elID), [e, dt, type, indexes]);
                                    });
                                    break;
                                case 'dblclick':
                                    $('#{0}_wrapper table tbody'.format(elID)).on('dblclick', 'tr', function () {
                                        var data = table.row(this).data();
                                        var eventHandler = mod.event['{0}_{1}'.format(elID, hook)];
                                        eventHandler.apply(syn.$l.get(elID), [this, data]);
                                    });
                                    break;
                            }
                        }
                    }
                }
            }

            $list.listControls.push({
                id: elID,
                table: table,
                list: elDataTable.dataTable(),
                config: setting,
                value: null
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue: function (elID, meta) {
            var result = null;
            var listControl = $('#' + elID).DataTable();

            if (listControl.context) {
                result = listControl.data().toArray();
            }

            return result;
        },

        setValue: function (elID, value, meta) {
            var listControl = $list.getControl(elID);
            if (listControl) {
                listControl.list.fnClearTable();
                listControl.list.fnAddData(value);
            }
        },

        clear: function (elID, isControlLoad) {
            var listControl = $list.getControl(elID);
            if (listControl) {
                listControl.list.fnClearTable();
                listControl.table.columns().search('').draw();
                var els = document.getElementById(elID + '_wrapper').querySelectorAll('.dataTables_searchtext');
                for (var i = 0; i < els.length; i++) {
                    var el = els[i];
                    el.value = '';
                }
            }
        },

        getControl: function (elID) {
            var result = null;
            var length = $list.listControls.length;
            for (var i = 0; i < length; i++) {
                var item = $list.listControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        setCellData: function (elID, row, col, value) {
            var control = $list.getControl(elID);
            if (control) {
                if ($object.isString(col) == true) {
                    col = $list.propToCol(elID, col);
                }

                var cell = control.table.cell(row, col);
                if (cell.length > 0) {
                    control.table.cell(row, col).data(value).draw();
                }
            }
        },

        propToCol: function (elID, columnName) {
            var result = -1;
            var control = $list.getControl(elID);
            if (control) {
                var columns = control.table.settings().toArray()[0].aoColumns;
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].data == columnName) {
                        result = i;
                        break;
                    }
                }
            }

            return result;
        },

        setLocale: function (elID, translations, control, options) {
        }
    });
    syn.uicontrols.$list = $list;
})(window);
