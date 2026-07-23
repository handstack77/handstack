'use strict';
var $binding = createControlBindingExample({
    adapterName: 'opengrid',
    initialValue: [
        {CodeID: '01', CodeValue: '신청', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 1, ModifiedBy: 'system'},
        {CodeID: '02', CodeValue: '처리중', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 2, ModifiedBy: 'system'},
        {CodeID: '03', CodeValue: '완료', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 3, ModifiedBy: 'system'}
    ],
    get: function () {
        return $binding.method.readOpenGridRows();
    },
    set: function (value) {
        var rows = (value || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return $binding.method.toOpenGridRow(item, false);
        });
        syn.uicontrols.$opengrid.setValue('grdBinding', rows);
    },
    nextValue: function (current) {
        var queried = (current || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return $binding.method.toOpenGridRow(item, false, 'server');
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
        var count = syn.uicontrols.$opengrid.countRows('grdBinding');
        if (count > 0) {
            syn.uicontrols.$opengrid.selectCell('grdBinding', 0, 'CodeID');
        }
        syn.uicontrols.$opengrid.setColumnWidths('grdBinding', [
            {dataField: 'CodeValue', width: 180},
            {dataField: 'ModifiedBy', width: 110}
        ]);
        page.method.updateOpenGridSummary('조회 결과 ' + count + '건: 첫 셀 선택 및 업무 컬럼 폭 적용 완료');
    },
    events: {
        grdBinding_cellEditEnd: function () {
            this.method.updateOpenGridSummary();
            return this.method.readOpenGridRows();
        },
        grdBinding_dataChange: function () {
            this.method.updateOpenGridSummary();
            return this.method.readOpenGridRows();
        },
        btnGridAdd_click: function () {
            var sequence = syn.uicontrols.$opengrid.countRows('grdBinding') + 1;
            syn.uicontrols.$opengrid.insertRow('grdBinding', {
                values: {
                    CodeID: '',
                    CodeValue: '',
                    CategoryID: 'WORK',
                    UseYN: 'Y',
                    SortingNo: sequence,
                    ModifiedBy: 'demo-user'
                },
                index: 'last'
            });
            var rowIndex = syn.uicontrols.$opengrid.countRows('grdBinding') - 1;
            syn.uicontrols.$opengrid.selectCell('grdBinding', rowIndex, 'CodeID');
            this.method.updateOpenGridSummary('신규 행(C)을 추가하고 코드 셀로 포커스를 이동했습니다.');
            return this.method.readOpenGridRows();
        },
        btnGridEdit_click: function () {
            var rowIndex = syn.uicontrols.$opengrid.getActiveRowIndex('grdBinding');
            if (rowIndex < 0) {
                rowIndex = 0;
            }
            syn.uicontrols.$opengrid.setDataAtCell('grdBinding', rowIndex, 'UseYN', 'N');
            syn.uicontrols.$opengrid.setDataAtCell('grdBinding', rowIndex, 'ModifiedBy', 'demo-user');
            this.method.updateOpenGridSummary('선택 행을 수정(U)하고 수정자 정보를 기록했습니다.');
            return this.method.readOpenGridRows();
        },
        btnGridRemove_click: function () {
            syn.uicontrols.$opengrid.removeRow('grdBinding');
            this.method.updateOpenGridSummary('선택 행을 삭제(D)하고 삭제 스냅샷을 보존했습니다.');
            return this.method.readOpenGridRows();
        }
    },
    methods: {
        toOpenGridRow: function (item, includeFlag, modifiedBy) {
            var row = {
                CodeID: item.CodeID || '',
                CodeValue: item.CodeValue || '',
                CategoryID: item.CategoryID || '',
                UseYN: item.UseYN || '',
                SortingNo: Number(item.SortingNo || 0),
                ModifiedBy: modifiedBy || item.ModifiedBy || ''
            };
            if (includeFlag) {
                row.Flag = item.Flag || 'R';
            }
            return row;
        },
        readOpenGridRows: function () {
            var rows = (syn.uicontrols.$opengrid.getGridData('grdBinding') || []).map(function (item) {
                return $binding.method.toOpenGridRow(item, true);
            });
            var changeCounts = {};
            $binding.method.readOpenGridChanges().forEach(function (item) {
                var key = item.Flag + '|' + $binding.method.openGridRowSignature(item);
                changeCounts[key] = (changeCounts[key] || 0) + 1;
            });
            var seenCounts = {};
            return rows.filter(function (item) {
                var key = item.Flag + '|' + $binding.method.openGridRowSignature(item);
                if (!changeCounts[key]) {
                    return true;
                }
                seenCounts[key] = (seenCounts[key] || 0) + 1;
                return seenCounts[key] <= changeCounts[key];
            });
        },
        readOpenGridChanges: function () {
            return (syn.uicontrols.$opengrid.getUpdateItems('grdBinding') || []).map(function (item) {
                return $binding.method.toOpenGridRow(item, true);
            });
        },
        openGridRowSignature: function (item) {
            return [
                item.CodeID,
                item.CodeValue,
                item.CategoryID,
                item.UseYN,
                Number(item.SortingNo || 0),
                item.ModifiedBy
            ].join('\u001f');
        },
        updateOpenGridSummary: function (message) {
            var rows = $binding.method.readOpenGridRows();
            var changed = rows.filter(function (item) {
                return ['C', 'U', 'D'].indexOf(item.Flag) > -1;
            });
            var summary = document.getElementById('gridWorkSummary');
            if (summary) {
                summary.textContent = message || ('전체 ' + rows.length + '건 / 저장 대상 C·U·D ' + changed.length + '건');
            }
        }
    },
    business: {
        title: 'OpenGrid 공통코드 변경분 저장',
        description: '화면 전체 행은 getGridData로 모델에 유지하고, 저장 거래에는 getUpdateItems의 C/U/D 스냅샷만 사용합니다.',
        rules: [
            '저장할 변경 행이 한 건 이상이어야 합니다.',
            '코드와 코드명은 필수이며 삭제되지 않은 코드끼리 중복될 수 없습니다.',
            '사용여부는 Y 또는 N, 정렬 순서는 0 이상이어야 합니다.'
        ],
        validate: function () {
            var grid = syn.uicontrols.$opengrid;
            if (!grid.checkEditValue('grdBinding')) {
                return '저장할 변경 행이 없습니다.';
            }
            var ids = {};
            var invalid = $binding.method.readOpenGridRows().some(function (item) {
                if (item.Flag === 'D') {
                    return false;
                }
                if (!item.CodeID || !String(item.CodeValue).trim() || !item.CategoryID ||
                    ['Y', 'N'].indexOf(item.UseYN) < 0 || Number(item.SortingNo) < 0 || ids[item.CodeID]) {
                    return true;
                }
                ids[item.CodeID] = true;
                return false;
            });
            return invalid ? '필수값, 코드 중복, 사용여부 또는 정렬 순서를 확인하세요.' : true;
        },
        buildPayload: function () {
            var changes = $binding.method.readOpenGridChanges();
            return {
                transactionID: 'MD01',
                inputs: [{type: 'List', dataFieldID: 'CodeList', rows: changes}],
                changedCount: changes.length
            };
        },
        onReset: function (page) {
            page.method.updateOpenGridSummary('조회 원본으로 되돌리고 C/U/D 상태를 초기화했습니다.');
        }
    }
});
