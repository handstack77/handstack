'use strict';
var $binding = createControlBindingExample({
    adapterName: 'webgrid',
    initialValue: [
        {CodeID: '01', CodeValue: '신청', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 1, ModifiedBy: 'system'},
        {CodeID: '02', CodeValue: '처리중', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 2, ModifiedBy: 'system'},
        {CodeID: '03', CodeValue: '완료', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 3, ModifiedBy: 'system'}
    ],
    get: function () {
        return $binding.method.readWebGridRows();
    },
    set: function (value) {
        var rows = (value || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return $binding.method.toWebGridRow(item, false);
        });
        syn.uicontrols.$grid.setValue('grdBinding', rows);
    },
    nextValue: function (current) {
        var queried = (current || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return $binding.method.toWebGridRow(item, false, 'server');
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
        var count = syn.uicontrols.$grid.countRows('grdBinding');
        if (count > 0) {
            syn.uicontrols.$grid.selectCell('grdBinding', 0, 'CodeID');
        }
        syn.uicontrols.$grid.setColumnWidth('grdBinding', 'CodeValue', 180);
        syn.uicontrols.$grid.setColumnWidth('grdBinding', 'ModifiedBy', 100);
        page.method.updateWebGridSummary('조회 결과 ' + count + '건: 첫 셀 선택 및 업무 컬럼 폭 적용 완료');
    },
    events: {
        grdBinding_afterChange: function () {
            this.method.updateWebGridSummary();
            return this.method.readWebGridRows();
        },
        btnGridAdd_click: function () {
            var sequence = syn.uicontrols.$grid.countRows('grdBinding') + 1;
            syn.uicontrols.$grid.insertRow('grdBinding', {
                index: syn.uicontrols.$grid.countRows('grdBinding'),
                amount: 1,
                values: {
                    CodeID: '',
                    CodeValue: '',
                    CategoryID: 'WORK',
                    UseYN: 'Y',
                    SortingNo: sequence,
                    ModifiedBy: 'demo-user'
                },
                focusColumnID: 'CodeID'
            });
            this.method.updateWebGridSummary('신규 행(C)을 추가했습니다. 코드와 코드명을 입력하세요.');
            return this.method.readWebGridRows();
        },
        btnGridEdit_click: function () {
            var rowIndex = syn.uicontrols.$grid.getActiveRowIndex('grdBinding');
            if (rowIndex < 0) {
                rowIndex = 0;
            }
            syn.uicontrols.$grid.setDataAtCell('grdBinding', rowIndex, 'UseYN', 'N');
            syn.uicontrols.$grid.setDataAtCell('grdBinding', rowIndex, 'ModifiedBy', 'demo-user');
            this.method.updateWebGridSummary('선택 행을 수정(U)하고 수정자 정보를 기록했습니다.');
            return this.method.readWebGridRows();
        },
        btnGridRemove_click: function () {
            syn.uicontrols.$grid.removeRow('grdBinding');
            this.method.updateWebGridSummary('선택 행을 삭제(D)하고 화면에서는 숨겼습니다.');
            return this.method.readWebGridRows();
        }
    },
    methods: {
        toWebGridRow: function (item, includeFlag, modifiedBy) {
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
        readWebGridRows: function () {
            var settings = syn.uicontrols.$grid.getSettings('grdBinding');
            return (settings && settings.data ? settings.data : []).filter(function (item) {
                return item && item.Flag !== 'S' &&
                    (item.CodeID || item.CodeValue || item.CategoryID || item.UseYN || item.SortingNo || item.ModifiedBy);
            }).map(function (item) {
                return $binding.method.toWebGridRow(item, true);
            });
        },
        readWebGridChanges: function () {
            var metaColumns = {
                CodeID: {fieldID: 'CodeID', dataType: 'string'},
                CodeValue: {fieldID: 'CodeValue', dataType: 'string'},
                CategoryID: {fieldID: 'CategoryID', dataType: 'string'},
                UseYN: {fieldID: 'UseYN', dataType: 'string'},
                SortingNo: {fieldID: 'SortingNo', dataType: 'number'},
                ModifiedBy: {fieldID: 'ModifiedBy', dataType: 'string'}
            };
            return syn.uicontrols.$grid.getUpdateData('grdBinding', 'List', metaColumns) || [];
        },
        updateWebGridSummary: function (message) {
            var rows = $binding.method.readWebGridRows();
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
        title: 'WebGrid 공통코드 변경분 저장',
        description: '숨김 처리된 D 행을 포함해 Handsontable 원본의 Flag를 유지하고, getUpdateData가 반환한 C/U/D만 List 입력으로 전송합니다.',
        rules: [
            '저장할 변경 행이 한 건 이상이어야 합니다.',
            '코드와 코드명은 필수이며 삭제되지 않은 코드끼리 중복될 수 없습니다.',
            '사용여부는 Y 또는 N, 정렬 순서는 0 이상이어야 합니다.'
        ],
        validate: function () {
            var grid = syn.uicontrols.$grid;
            if (!grid.checkEditValue('grdBinding')) {
                return '저장할 변경 행이 없습니다.';
            }
            var ids = {};
            var invalid = $binding.method.readWebGridRows().some(function (item) {
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
            var changes = $binding.method.readWebGridChanges();
            return {
                transactionID: 'MD01',
                inputs: [{type: 'List', dataFieldID: 'CodeList', rows: changes}],
                changedCount: changes.length
            };
        },
        onReset: function (page) {
            page.method.updateWebGridSummary('조회 원본으로 되돌리고 C/U/D 상태를 초기화했습니다.');
        }
    }
});
