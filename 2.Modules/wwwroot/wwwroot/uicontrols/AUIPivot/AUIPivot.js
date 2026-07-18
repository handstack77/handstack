/// <reference path='/js/syn.js' />

(function (window) {
    'use strict';

    window.AUIPivotMessages = {
        rowNumHeaderText: 'No.',
        rowLabelText: '행 레이블',
        columnLabelText: '열 레이블',
        columnTotalSumText: '총 합계',
        footerTotalSumText: '총 합계',
        emptyText: '( 비어 있음 )',
        emptyValue: '( 값 없음 )',
        noDataMessage: '보고서를 작성하려면 필드 목록에서 필드를 선택하십시오.',
        summaryText: ' 요약',
        totalSummaryText: '전체 ',
        columnText: '열',
        rowText: '행',
        valueText: '값',

        opLabelTexts: {
            SUM: '합계',
            MIN: '최소값',
            MAX: '최대값',
            AVG: '평균',
            COUNT: '개수',
            MULTIPLY: '곱',
            VARIANCE: '분산',
            STD_DEVIATION: '표준 편차',
            RATIO: '비율',
            ROW_RATIO: '행 합계 비율',
        },

        dateSeperateNames: {
            year: '$0년',
            half: ['상반기', '하반기'],
            quarter: '$0사분기',
            month: '$0월',
        },

        pivotPanel: {
            title: 'Pivot 필드 설정',
            fieldListTitle: '보고서에 추가할 필드 선택 : ',
            fieldMessage: '아래의 영역 사이에 필드를 끌어 놓으십시오.',
            filterText: '필터',
            columnText: '열',
            rowText: '행',
            valueText: '값',
            valueSummaryText: 'Σ 값',
            updateLater: '나중에 피벗 업데이트',
            updateBtn: '업데이트',
            okText: '확인',
            cancelText: '취소',
            closeText: '닫기',
        },

        fieldDropDownTexts: {
            toUp: '위로 이동',
            toDown: '아래로 이동',
            toFirst: '처음으로 이동',
            toLast: '끝으로 이동',
            toFilter: '보고서 필터로 이동',
            toRow: '행 레이블로  이동',
            toColumn: '열 레이블로 이동',
            toValue: '값으로 이동',
            remove: '필드 제거',
            setting: '값 필드 설정',
        },

        valueModalWindow: {
            title: '값 필드 설정 하기',
            fieldName: '필드 이름',
            customLabel: '사용자 지정 이름',
            operationType: '계산 유형',
            formatType: '표시 형식',
            okText: '확인',
            cancelText: '취소',
            closeText: '닫기',
        },

        filterWindow: {
            fieldSelectText: '필드 선택 :',
            clearAllText: '필터 전체 초기화',
            clearText: '$0 필드 필터 초기화',
            checkAllText: '(전체선택)',
            searchCheckAllText: '(검색 전체선택)',
            noValueText: '(필드 값 없음)',
            itemMoreMessage: '하단에 더 많은 값이 있습니다. 검색으로 구체화 하십시오.',
            placeholder: '검색',
            okText: '확 인',
            cancelText: '취 소',
        },

        formatStringList: [
            {
                formatString: '#,##0',
                labelText: '정수(#,##0)',
            },
            {
                formatString: '#,##0.0',
                labelText: '소수점 1자리(#,##0.0)',
            },
            {
                formatString: '#,##0.00',
                labelText: '소수점 2자리(#,##0.00)',
            },
            {
                formatString: '#,##0.000',
                labelText: '소수점 3자리(#,##0.000)',
            },
            {
                formatString: '###0.#####',
                labelText: '표시 유형 지정 안함',
            },
        ],

        exportProgress: {
            init: '내보내기 초기화 중...',
            progress: '내보내기 진행 중...',
            complete: '내보내기가 곧 완료됩니다.',
        },
    };

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $auipivot = syn.uicontrols.$auipivot || new syn.module();

    $auipivot.extend({
        name: 'syn.uicontrols.$auipivot',
        version: 'v2025.12.07',

        gridControls: [],
        pivotOptions: {
            autoGridHeight: true,
            autoGridMinHeight: NaN,
            autoGridParentHeight: false,
            autoScrollSize: false,
            columnAutoWidthGap: 4,
            contextMenuHeaderItems: [],
            contextMenuItems: [],
            copyDisplayValue: false,
            dateTypeField: null,
            defaultFormatString: "###0.#####",
            defaultHeatmapColors: ["#FFFFFF", "#4374D9"],
            displayAutoAscending: true,
            displayTreeOpen: false,
            enableClipboard: true,
            enableColumnResize: true,
            enableFocus: true,
            enableHScrollByOnlyShiftKey: true,
            enableHScrollByWheel: true,
            enableMouseWheel: true,
            enableMultipleSorting: true,
            enableSorting: true,
            exportURL: null,
            fieldListAreaRatio: 0.5,
            filterLayerHeight: 380,
            filterLayerWidth: 240,
            filterMenuItemMaxCount: 50,
            filterPanelHeight: 240,
            fixedAlterWidth: 200,
            fixedColumnHGap: 0,
            footerHeight: 30,
            footerVGap: 1,
            headerHeight: 24,
            height: NaN,
            isFormatNullValue: false,
            layoutType: "tree",
            minFieldPanelHeight: 400,
            minFieldPanelWidth: 300,
            movableFieldPanel: true,
            multiSortingKey: "shiftKey",
            onlyTreeLastDepthSorting: false,
            panelHeight: NaN,
            panelWidth: NaN,
            pivotPanelId: null,
            resizableFieldPanel: true,
            reverseRowNum: false,
            rowHeight: 24,
            rowNumColumnWidth: 40,
            rowStyleFunction: null,
            scrollHeight: 14,
            scrollHeight4Mobile: 4,
            scrollThumbHeight: 12,
            showColumnLabelHeader: true,
            showColumnTreeIcon: true,
            showFooter: false,
            showGrandTotalColumn: true,
            showRowNumColumn: true,
            showSelectionBorder: true,
            showStateColumn: true,
            showSummaryColumn: true,
            showSummaryRow: true,
            showTooltip: false,
            showTreeIcon: true,
            showValueLabelHeader: true,
            stateColumnWidth: 16,
            summaryColumnPosition: "last",
            tooltipFunction: null,
            tooltipSensitivity: 700,
            treeLevelIndent: 18,
            treeOpenRecursivly: false,
            useContextHeaderMenu: false,
            useContextMenu: false,
            useFixedColumns: true,
            useHeaderFilterMenu: true,
            useHeatmap: false,
            wheelSensitivity: 5,
            width: NaN
        },

        controlLoad(elID, setting) {
            let el = syn.$l.get(elID);
            const gridID = '#' + elID;
            setting = syn.$w.argumentsExtend($auipivot.pivotOptions, setting);

            var pivotLayout = null;
            if (setting.layout) {
                pivotLayout = setting.layout;
            }
            else {
                pivotLayout = {
                    dateTypeField: 'Date',
                    rowFields: ['Region', 'Name', 'Model'],
                    columnFields: ['DateQuarter', 'DateMonth'],
                    valueFields: [
                        {
                            dataField: 'Total',
                            operation: 'SUM',
                            formatString: '#,##0'
                        },
                        {
                            dataField: 'Count',
                            operation: 'SUM',
                            formatString: '#,##0'
                        }
                    ],
                    fieldAlias: {
                        Region: '판매 지역',
                        Name: '라인명',
                        Model: '상품명',
                        Color: '색상',
                        Price: '가격',
                        Count: '판매 수',
                        Total: '매출액',
                        Date: '일',
                        DateYear: '년',
                        DateHalf: '반기',
                        DateQuarter: '분기',
                        DateMonth: '월'
                    }
                }
            }

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                setting.pivotLayout = pivotLayout;
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);

                pivotLayout = $object.clone(setting.pivotLayout);
                delete setting.pivotLayout;
            }

            setting.width = setting.width || '100%';
            if ($object.isNumber(setting.width) == true) {
                setting.width = setting.width + 'px';
            }

            setting.height = setting.height || '240px';
            if ($object.isNumber(setting.height) == true) {
                setting.height = setting.height + 'px';
            }

            setting.layout = pivotLayout || setting.layout || [];
            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var className = el.getAttribute('class') || '';
            var dataField = el.getAttribute('syn-datafield');
            var html = `<div id="{0}" class="syn-auipivot ${className}" style="width:${setting.width};height:${setting.height};overflow:hidden;"></div>`.format(elID, dataField);

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.innerHTML = html;

            parent.appendChild(wrapper);

            var controlSetting = $object.clone(setting);
            $auipivot.gridControls.push({
                id: elID,
                gridID: AUIPivot.create(gridID, controlSetting),
                setting: controlSetting
            });

            if (pivotLayout) {
                if (pivotLayout.dateTypeField) {
                    AUIPivot.setDateTypeField(gridID, pivotLayout.dateTypeField);
                }

                if (pivotLayout.fieldAlias) {
                    AUIPivot.setFieldAlias(gridID, pivotLayout.fieldAlias);
                }

                if (pivotLayout.rowFields && Array.isArray(pivotLayout.rowFields)) {
                    AUIPivot.setRowFields(gridID, pivotLayout.rowFields);
                }

                if (pivotLayout.columnFields && Array.isArray(pivotLayout.columnFields)) {
                    AUIPivot.setColumnFields(gridID, pivotLayout.columnFields);
                }

                if (pivotLayout.valueFields && Array.isArray(pivotLayout.valueFields)) {
                    AUIPivot.setValueFields(gridID, pivotLayout.valueFields);
                }

                if (pivotLayout.filterFields && Array.isArray(pivotLayout.filterFields)) {
                    AUIPivot.setFilterFields(gridID, pivotLayout.filterFields);
                }
            }

            if (mod) {
                // https://www.auisoft.net/documentation/auipivot/Pivot/Events.html
                var gridHookEvents = el.getAttribute('syn-events') || [];
                try {
                    if (gridHookEvents) {
                        gridHookEvents = eval(gridHookEvents);

                        const getEventHandler = (pid, eventName) => {
                            const elID = pid.substring(1);
                            const mod = window[syn.$w.pageScript];
                            const handlerName = '{0}_{1}'.format(elID, eventName);
                            return {
                                elID: elID,
                                handler: mod.event ? mod.event[handlerName] : null
                            };
                        };

                        if (gridHookEvents.includes('cellClick') == true) {
                            AUIPivot.bind(gridID, 'cellClick', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'cellClick');
                                if (handler) {
                                    handler(elID, evt.rowIndex, evt.columnIndex, evt.dataField, evt.value, evt.item, evt.type, evt.headerText);
                                }
                            });
                        }

                        if (gridHookEvents.includes('cellDoubleClick') == true) {
                            AUIPivot.bind(gridID, 'cellDoubleClick', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'cellDoubleClick');
                                if (handler) {
                                    handler(elID, evt.rowIndex, evt.columnIndex, evt.dataField, evt.value, evt.item, evt.type, evt.headerText);
                                }
                            });
                        }

                        if (gridHookEvents.includes('columnStateChange') == true) {
                            AUIPivot.bind(gridID, 'columnStateChange', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'columnStateChange');
                                if (handler) {
                                    handler(elID, evt.property, evt.dataField, evt.headerText, evt.depth, evt.isBranch, evt.old, evt.current, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('contextMenu') == true) {
                            AUIPivot.bind(gridID, 'contextMenu', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'contextMenu');
                                if (handler) {
                                    return handler(elID, evt.target, evt.dataField, evt.headerText, evt.columnIndex, evt.rowIndex, evt.depth, evt.item, evt.pageX, evt.pageY, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('footerClick') == true) {
                            AUIPivot.bind(gridID, 'footerClick', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'footerClick');
                                if (handler) {
                                    handler(elID, evt.footerIndex, evt.footerText, evt.footerValue, evt.pageX, evt.pageY, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('footerDoubleClick') == true) {
                            AUIPivot.bind(gridID, 'footerDoubleClick', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'footerDoubleClick');
                                if (handler) {
                                    handler(elID, evt.footerIndex, evt.footerText, evt.footerValue, evt.pageX, evt.pageY, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('headerClick') == true) {
                            AUIPivot.bind(gridID, 'headerClick', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'headerClick');
                                if (handler) {
                                    return handler(elID, evt.columnIndex, evt.headerText, evt.depth, evt.item, evt.dataField, evt.pageX, evt.pageY, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('hScrollChange') == true) {
                            AUIPivot.bind(gridID, 'hScrollChange', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'hScrollChange');
                                if (handler) {
                                    handler(elID, evt.position, evt.oldPosition, evt.minPosition, evt.maxPosition, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('pivotBegin') == true) {
                            AUIPivot.bind(gridID, 'pivotBegin', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'pivotBegin');
                                if (handler) {
                                    return handler(elID, evt.rowFields, evt.columnFields, evt.valueFields, evt.filterFields, evt.byPanelController, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('pivotComplete') == true) {
                            AUIPivot.bind(gridID, 'pivotComplete', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'pivotComplete');
                                if (handler) {
                                    handler(elID, evt.rowFields, evt.columnFields, evt.valueFields, evt.filterFields, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('pivotPanelHide') == true) {
                            AUIPivot.bind(gridID, 'pivotPanelHide', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'pivotPanelHide');
                                if (handler) {
                                    handler(elID, evt.panelId, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('pivotPanelShow') == true) {
                            AUIPivot.bind(gridID, 'pivotPanelShow', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'pivotPanelShow');
                                if (handler) {
                                    handler(elID, evt.panelId, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('sorting') == true) {
                            AUIPivot.bind(gridID, 'sorting', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'sorting');
                                if (handler) {
                                    handler(elID, evt.sortingFields, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('treeOpenChange') == true) {
                            AUIPivot.bind(gridID, 'treeOpenChange', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'treeOpenChange');
                                if (handler) {
                                    handler(elID, evt.isOpen, evt.rowIndex, evt.depth, evt.item, evt.type);
                                }
                            });
                        }

                        if (gridHookEvents.includes('vScrollChange') == true) {
                            AUIPivot.bind(gridID, 'vScrollChange', function (evt) {
                                const { elID, handler } = getEventHandler(evt.pid, 'vScrollChange');
                                if (handler) {
                                    handler(elID, evt.position, evt.oldPosition, evt.minPosition, evt.maxPosition, evt.type);
                                }
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

        getPivotID(elID) {
            var result = null;
            elID = elID.replace('_hidden', '');
            var length = $auipivot.gridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $auipivot.gridControls[i];
                if (item.id == elID) {
                    result = item.gridID;
                    break;
                }
            }

            return result;
        },

        bind(elID, type, func) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.bind(gridID, type, func);
            }
        },

        changeHeatmapColors(elID, dateField, operation, colors) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.changeHeatmapColors(gridID, dateField, operation, colors);
            }
        },

        clearFilterAll(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.clearFilterAll(gridID);
            }
        },

        clearPivot(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.clearPivot(gridID);
            }
        },

        clearPivotFieldsAll(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.clearPivotFieldsAll(gridID);
            }
        },

        clearSortingAll(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.clearSortingAll(gridID);
            }
        },

        closeFilterLayer(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.closeFilterLayer(gridID);
            }
        },

        collapseAll(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.collapseAll(gridID);
            }
        },

        collapseAllColumns(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.collapseAllColumns(gridID);
            }
        },

        createPivotPanel(elID, panelPID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.createPivotPanel(gridID, panelPID);
            }
        },

        destroy(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.destroy(gridID);
            }
        },

        destroyPivotPanel(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.destroyPivotPanel(gridID);
            }
        },

        expandAll(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.expandAll(gridID);
            }
        },

        expandAllColumns(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.expandAllColumns(gridID);
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
                        AUIGrid.AUIPivot(gridID, options);
                        break;
                    case 'csv':
                        AUIGrid.AUIPivot(gridID, options);
                        break;
                    case 'pdf':
                        AUIGrid.AUIPivot(gridID, options);
                        break;
                }
            }
        },

        getAliasByDataField(elID, dateField) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getAliasByDataField(gridID, dateField);
            }
            return result;
        },

        getCellDetailList(elID, rowIndex, columnIndex) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getCellDetailList(gridID, rowIndex, columnIndex);
            }
            return result;
        },

        getColumnFields(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getColumnFields(gridID);
            }
            return result;
        },

        getColumnIndexByDataField(elID, dataField) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getColumnIndexByDataField(gridID, dataField);
            }
            return result;
        },

        getColumnInfoList(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getColumnInfoList(gridID);
            }
            return result;
        },

        getColumnItemByDataField(elID, dataField) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getColumnItemByDataField(gridID, dataField);
            }
            return result;
        },

        getColumnLayout(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getColumnLayout(gridID);
            }
            return result;
        },

        getDataFieldByColumnIndex(elID, columnIndex) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getDataFieldByColumnIndex(gridID, columnIndex);
            }
            return result;
        },

        getDataFieldList(elID, all) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getDataFieldList(gridID, all);
            }
            return result;
        },

        getDimensionValues(elID, rowIndex, columnIndex) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getDimensionValues(gridID, rowIndex, columnIndex);
            }
            return result;
        },

        getDisplayOrderRules(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getDisplayOrderRules(gridID);
            }
            return result;
        },

        getExceptSumRowFields(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getExceptSumRowFields(gridID);
            }
            return result;
        },

        getFieldAlias(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getFieldAlias(gridID);
            }
            return result;
        },

        getFilterCache(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getFilterCache(gridID);
            }
            return result;
        },

        getFilterFields(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getFilterFields(gridID);
            }
            return result;
        },

        getFitColumnSizeList(elID, fitToGrid) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getFitColumnSizeList(gridID, fitToGrid);
            }
            return result;
        },

        getFooterData(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getFooterData(gridID);
            }
            return result;
        },

        getItemByRowIndex(elID, rowIndex) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getItemByRowIndex(gridID, rowIndex);
            }
            return result;
        },

        getPivotData(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getPivotData(gridID);
            }
            return result;
        },

        getPivotPanelState(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getPivotPanelState(gridID);
            }
            return result;
        },

        getProp(elID, name) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getProp(gridID, name);
            }
            return result;
        },

        getRowCount(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getRowCount(gridID);
            }
            return result;
        },

        getRowFields(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getRowFields(gridID);
            }
            return result;
        },

        getSelectedIndex(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getSelectedIndex(gridID);
            }
            return result;
        },

        getSourceData(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getSourceData(gridID);
            }
            return result;
        },

        getSourceItemByValue(elID, dataField, value) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getSourceItemByValue(gridID, dataField, value);
            }
            return result;
        },

        getSourceItemsByValue(elID, dataField, value) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getSourceItemsByValue(gridID, dataField, value);
            }
            return result;
        },

        getTreeTotalDepth(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getTreeTotalDepth(gridID);
            }
            return result;
        },

        getValueFields(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.getValueFields(gridID);
            }
            return result;
        },

        hidePivotPanel(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.hidePivotPanel(gridID);
            }
        },

        isAvailabePdf(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.isAvailabePdf(gridID);
            }
            return result;
        },

        isAvailableLocalDownload(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.isAvailableLocalDownload(gridID);
            }
            return result;
        },

        isCreated(elID) {
            // isCreated는 selector를 받지만 여기서는 패턴에 맞춰 내부 처리
            return AUIPivot.isCreated(elID);
        },

        isFilteredPivot(elID) {
            var result = null;
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                result = AUIPivot.isFilteredPivot(gridID);
            }
            return result;
        },

        removeAjaxLoader(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.removeAjaxLoader(gridID);
            }
        },

        resize(elID, width, height) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.resize(gridID, width, height);
            }
        },

        resizePivotPanel(elID, width, height) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.resizePivotPanel(gridID, width, height);
            }
        },

        setColumnFields(elID, fields) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setColumnFields(gridID, fields);
            }
        },

        setColumnFormatString(elID, formatStringObjs) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setColumnFormatString(gridID, formatStringObjs);
            }
        },

        setColumnSizeList(elID, sizeList) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setColumnSizeList(gridID, sizeList);
            }
        },

        setDataType(elID, dataTypeObj) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setDataType(gridID, dataTypeObj);
            }
        },

        setDateFormatString(elID, formatStringObj) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setDateFormatString(gridID, formatStringObj);
            }
        },

        setDateTypeField(elID, dateField) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setDateTypeField(gridID, dateField);
            }
        },

        setDisplayOrderRules(elID, rules) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setDisplayOrderRules(gridID, rules);
            }
        },

        setExceptFields(elID, fields) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setExceptFields(gridID, fields);
            }
        },

        setExceptSumRowFields(elID, fields) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setExceptSumRowFields(gridID, fields);
            }
        },

        setFieldAlias(elID, aliasObj) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setFieldAlias(gridID, aliasObj);
            }
        },

        setFieldOrder(elID, orders) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setFieldOrder(gridID, orders);
            }
        },

        setFilterCache(elID, cache) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setFilterCache(gridID, cache);
            }
        },

        setFilterFields(elID, fields) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setFilterFields(gridID, fields);
            }
        },

        setGridData(elID, data) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setGridData(gridID, data);
            }
        },

        setHeatmapColors(elID, dateField, operation, colors) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setHeatmapColors(gridID, dateField, operation, colors);
            }
        },

        setMaxWidthOfRowFields(elID, widthObj) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setMaxWidthOfRowFields(gridID, widthObj);
            }
        },

        setRowDimStyleFunction(elID, func) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setRowDimStyleFunction(gridID, func);
            }
        },

        setRowFields(elID, fields) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setRowFields(gridID, fields);
            }
        },

        setRowFormatString(elID, formatStringObjs) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setRowFormatString(gridID, formatStringObjs);
            }
        },

        setSorting(elID, sortingInfo, onlyLastDepthSorting) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setSorting(gridID, sortingInfo, onlyLastDepthSorting);
            }
        },

        setValueFields(elID, fields) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.setValueFields(gridID, fields);
            }
        },

        showAjaxLoader(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.showAjaxLoader(gridID);
            }
        },

        showItemsOnDepth(elID, depth) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.showItemsOnDepth(gridID, depth);
            }
        },

        showPivotPanel(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.showPivotPanel(gridID);
            }
        },

        unbind(elID, type) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.unbind(gridID, type);
            }
        },

        updatePivot(elID) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.updatePivot(gridID);
            }
        },

        getValue(elID, requestType, metaColumns) {
            var result = [];
            return result;
        },

        setValue(elID, value) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                $auipivot.clearPivotFieldsAll(elID);
                $auipivot.setGridData(gridID, value);
            }
        },

        clear(elID, isControlLoad) {
            var gridID = $auipivot.getPivotID(elID);
            if (gridID) {
                AUIPivot.clearPivot(gridID);
            }
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$auipivot = $auipivot;

})(window);
