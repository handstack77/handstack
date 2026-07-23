'use strict';
var $binding = createControlBindingExample({
    adapterName: 'jqgrid',
    initialValue: [
        {CodeID: '01', CodeValue: '신청', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 1, ModifiedBy: 'system'},
        {CodeID: '02', CodeValue: '처리중', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 2, ModifiedBy: 'system'},
        {CodeID: '03', CodeValue: '완료', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 3, ModifiedBy: 'system'}
    ],
    setup: function (page) {
        page.prop.pendingJqRows = [];
        if (window.jQuery && jQuery.fn.jqGrid && syn.uicontrols.$jqgrid) {
            syn.uicontrols.$jqgrid.controlLoad('grdBinding', {
                caption: '공통코드 목록',
                gridWidth: 760,
                gridHeight: '300px',
                rowNumbers: true,
                multiSelect: false,
                colModels: [
                    {name: 'CodeID', label: '코드', width: 100, key: true, edittype: 'text'},
                    {name: 'CodeValue', label: '코드명', width: 180, edittype: 'text'},
                    {name: 'CategoryID', label: '분류', width: 100, edittype: 'text'},
                    {name: 'UseYN', label: '사용여부', width: 80, edittype: 'text', align: 'center'},
                    {name: 'SortingNo', label: '정렬', width: 70, edittype: 'text', align: 'right'},
                    {name: 'ModifiedBy', label: '수정자', width: 100, edittype: 'text', align: 'center'}
                ]
            });
        }
    },
    get: function () {
        return $binding.method.readJqGridRows();
    },
    set: function (value, page) {
        page.prop.pendingJqRows = (value || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return $binding.method.toJqGridRow(item, false);
        });
        if (page.method.isJqGridReady()) {
            syn.uicontrols.$jqgrid.dataBinding('grdBinding', page.prop.pendingJqRows);
        }
    },
    nextValue: function (current) {
        var queried = (current || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return $binding.method.toJqGridRow(item, false, 'server');
        });
        queried.push({
            CodeID: '04',
            CodeValue: '반려',
            CategoryID: 'WORK',
            UseYN: 'Y',
            SortingNo: 4,
            ModifiedBy: 'server'
        });
        return queried;
    },
    afterSet: function (value, page) {
        page.method.finishJqGridBinding('조회 원본 ' + page.prop.pendingJqRows.length + '건을 적용했습니다.', value);
    },
    afterMount: function (page) {
        if (!window.jQuery || !jQuery.fn.jqGrid || !syn.uicontrols.$jqgrid) {
            return;
        }
        var attempts = 0;
        var bindWhenReady = function () {
            if (page.method.isJqGridReady()) {
                syn.uicontrols.$jqgrid.dataBinding('grdBinding', page.prop.pendingJqRows);
                page.method.finishJqGridBinding('비동기 jqGrid 초기화 후 조회 원본을 적용했습니다.');
            } else if (attempts++ < 50) {
                setTimeout(bindWhenReady, 50);
            }
        };
        bindWhenReady();
    },
    events: {
        btnGridAdd_click: function () {
            var result;
            if (this.method.isJqGridReady()) {
                var rowID = syn.uicontrols.$jqgrid.addRow('grdBinding', {
                    CodeID: '',
                    CodeValue: '',
                    CategoryID: 'WORK',
                    UseYN: 'Y',
                    SortingNo: syn.uicontrols.$jqgrid.getRowCount('grdBinding') + 1,
                    ModifiedBy: 'demo-user'
                }, 'last');
                syn.uicontrols.$jqgrid.focusRow('grdBinding', rowID);
                result = this.method.readJqGridRows();
            } else {
                var rows = this.method.readJqGridRows();
                rows.push({
                    CodeID: '',
                    CodeValue: '',
                    CategoryID: 'WORK',
                    UseYN: 'Y',
                    SortingNo: rows.filter(function (item) { return item.Flag !== 'D'; }).length + 1,
                    ModifiedBy: 'demo-user',
                    Flag: 'I'
                });
                this.prop.pendingJqRows = rows;
                result = rows;
            }
            this.method.updateJqGridSummary('신규 행(I)을 추가했습니다. 저장 payload에서는 C로 변환됩니다.', result);
            return result;
        },
        btnGridEdit_click: function () {
            var result;
            if (this.method.isJqGridReady()) {
                var rowID = syn.uicontrols.$jqgrid.getFocusRowID('grdBinding') ||
                    syn.uicontrols.$jqgrid.getRowID('grdBinding', 0);
                if (rowID) {
                    syn.uicontrols.$jqgrid.updateRow('grdBinding', rowID, {UseYN: 'N', ModifiedBy: 'demo-user'});
                    syn.uicontrols.$jqgrid.focusRow('grdBinding', rowID);
                }
                result = this.method.readJqGridRows();
            } else {
                var rows = this.method.readJqGridRows();
                var target = rows.find(function (item) { return item.Flag !== 'D'; });
                if (target) {
                    target.UseYN = 'N';
                    target.ModifiedBy = 'demo-user';
                    target.Flag = target.Flag === 'I' ? 'I' : 'U';
                }
                this.prop.pendingJqRows = rows;
                result = rows;
            }
            this.method.updateJqGridSummary('선택 행을 수정(U)하고 수정자 정보를 기록했습니다.', result);
            return result;
        },
        btnGridRemove_click: function () {
            var result;
            if (this.method.isJqGridReady()) {
                var rowID = syn.uicontrols.$jqgrid.getFocusRowID('grdBinding') ||
                    syn.uicontrols.$jqgrid.getRowID('grdBinding', 0);
                if (rowID) {
                    syn.uicontrols.$jqgrid.deleteRow('grdBinding', rowID);
                }
                result = this.method.readJqGridRows();
            } else {
                var rows = this.method.readJqGridRows();
                var index = rows.findIndex(function (item) { return item.Flag !== 'D'; });
                if (index > -1) {
                    if (rows[index].Flag === 'I') {
                        rows.splice(index, 1);
                    } else {
                        rows[index].Flag = 'D';
                        rows[index].ModifiedBy = 'demo-user';
                    }
                }
                this.prop.pendingJqRows = rows;
                result = rows;
            }
            this.method.updateJqGridSummary('선택 행을 삭제(D) 상태로 전환했습니다.', result);
            return result;
        }
    },
    methods: {
        isJqGridReady: function () {
            var table = document.getElementById('grdBinding');
            return Boolean(window.jQuery && jQuery.fn.jqGrid && syn.uicontrols.$jqgrid && table && table.grid);
        },
        toJqGridRow: function (item, includeFlag, modifiedBy) {
            var row = {
                CodeID: item.CodeID || '',
                CodeValue: item.CodeValue || '',
                CategoryID: item.CategoryID || '',
                UseYN: item.UseYN || '',
                SortingNo: Number(String(item.SortingNo || 0).replace(/,/g, '')),
                ModifiedBy: modifiedBy || item.ModifiedBy || ''
            };
            if (includeFlag) {
                row.Flag = item.Flag || item.flag || 'R';
            }
            return row;
        },
        readJqGridRows: function () {
            if ($binding.method.isJqGridReady()) {
                var statusByID = {};
                (syn.uicontrols.$jqgrid.getAllRowStatus('grdBinding') || []).forEach(function (item) {
                    statusByID[item.rowid] = item.flag;
                });
                return jQuery('#grdBinding').jqGrid('getDataIDs').map(function (rowID) {
                    var row = syn.uicontrols.$jqgrid.getRowData('grdBinding', rowID);
                    row.Flag = statusByID[rowID] || 'R';
                    return $binding.method.toJqGridRow(row, true);
                });
            }
            if (!$binding.prop.mounted) {
                return [];
            }
            var value = syn.$bind.raw($binding.prop.mounted.store.data.value) || [];
            return JSON.parse(JSON.stringify(value)).map(function (item) {
                return $binding.method.toJqGridRow(item, true);
            });
        },
        finishJqGridBinding: function (message, sourceRows) {
            if ($binding.method.isJqGridReady()) {
                syn.uicontrols.$jqgrid.autoSizeMode('grdBinding', true);
                var rowID = syn.uicontrols.$jqgrid.getRowID('grdBinding', 0);
                if (rowID) {
                    syn.uicontrols.$jqgrid.focusRow('grdBinding', rowID);
                }
            }
            $binding.method.updateJqGridSummary(message, sourceRows);
        },
        updateJqGridSummary: function (message, sourceRows) {
            var rows = sourceRows
                ? JSON.parse(JSON.stringify(sourceRows)).map(function (item) {
                    return $binding.method.toJqGridRow(item, true);
                })
                : $binding.method.readJqGridRows();
            var changed = rows.filter(function (item) {
                return ['I', 'U', 'D'].indexOf(item.Flag) > -1;
            });
            var mode = $binding.method.isJqGridReady() ? 'jqGrid 행 클래스' : 'Proxy 대체 모델';
            var summary = document.getElementById('gridWorkSummary');
            if (summary) {
                summary.textContent = (message ? message + ' / ' : '') +
                    mode + ' · 전체 ' + rows.length + '건 · 저장 대상 I/U/D ' + changed.length + '건';
            }
        }
    },
    business: {
        title: 'JQGrid 공통코드 변경분 저장',
        description: '레거시 엔진의 I/U/D 행 클래스를 읽고, 거래 계약에서는 신규 I를 표준 C로 변환해 List 입력을 구성합니다.',
        rules: [
            '저장할 I/U/D 변경 행이 한 건 이상이어야 합니다.',
            '코드와 코드명은 필수이며 삭제되지 않은 코드끼리 중복될 수 없습니다.',
            '사용여부는 Y 또는 N, 정렬 순서는 0 이상이어야 합니다.'
        ],
        validate: function (value) {
            var changed = (value || []).filter(function (item) {
                return ['I', 'U', 'D'].indexOf(item.Flag) > -1;
            });
            if (!changed.length) {
                return '저장할 변경 행이 없습니다.';
            }
            var ids = {};
            var invalid = (value || []).some(function (item) {
                if (item.Flag === 'D') {
                    return false;
                }
                if (!item.CodeID || !String(item.CodeValue || '').trim() || !item.CategoryID ||
                    ['Y', 'N'].indexOf(item.UseYN) < 0 || Number(item.SortingNo) < 0 || ids[item.CodeID]) {
                    return true;
                }
                ids[item.CodeID] = true;
                return false;
            });
            return invalid ? '필수값, 코드 중복, 사용여부 또는 정렬 순서를 확인하세요.' : true;
        },
        buildPayload: function (value) {
            var changes = value.filter(function (item) {
                return ['I', 'U', 'D'].indexOf(item.Flag) > -1;
            }).map(function (item) {
                var row = $binding.method.toJqGridRow(item, false);
                row.Flag = item.Flag === 'I' ? 'C' : item.Flag;
                return row;
            });
            return {
                transactionID: 'MD01',
                inputs: [{type: 'List', dataFieldID: 'CodeList', rows: changes}],
                changedCount: changes.length,
                stateMapping: 'I → C, U → U, D → D'
            };
        },
        onReset: function (page) {
            page.method.finishJqGridBinding('조회 원본으로 되돌리고 I/U/D 상태를 초기화했습니다.');
        }
    }
});
