'use strict';
var $binding = createControlBindingExample({
    adapterName: 'auigrid',
    initialValue: [
        {CodeID: '01', CodeValue: '신청', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 1, ModifiedBy: 'system'},
        {CodeID: '02', CodeValue: '처리중', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 2, ModifiedBy: 'system'},
        {CodeID: '03', CodeValue: '완료', CategoryID: 'WORK', UseYN: 'Y', SortingNo: 3, ModifiedBy: 'system'}
    ],
    get: function (page) {
        return page.method.readGridRows();
    },
    set: function (value, page) {
        var rows = (value || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return page.method.toBusinessRow(item, false);
        });
        syn.uicontrols.$auigrid.setValue('grdBinding', rows);
    },
    nextValue: function (current) {
        var queried = (current || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return {
                CodeID: item.CodeID,
                CodeValue: item.CodeValue,
                CategoryID: item.CategoryID,
                UseYN: item.UseYN,
                SortingNo: item.SortingNo,
                ModifiedBy: 'server'
            };
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
        var count = syn.uicontrols.$auigrid.countRows('grdBinding');
        if (count > 0) {
            syn.uicontrols.$auigrid.selectCell('grdBinding', 0, 'CodeID');
        }
        syn.uicontrols.$auigrid.setFitColumnSize('grdBinding', 220, true);
        page.method.updateGridSummary('조회 결과 ' + count + '건: 첫 셀 선택 및 컬럼 폭 자동 맞춤 완료');
    },
    events: {
        grdBinding_afterChange: function () {
            this.method.updateGridSummary();
            return this.method.readGridRows();
        },
        btnGridAdd_click: function () {
            var sequence = syn.uicontrols.$auigrid.countRows('grdBinding') + 1;
            syn.uicontrols.$auigrid.insertRow('grdBinding', {
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
            this.method.updateGridSummary('신규 행(C)을 추가했습니다. 코드와 코드명을 입력하세요.');
            return this.method.readGridRows();
        },
        btnGridEdit_click: function () {
            var rowIndex = syn.uicontrols.$auigrid.getActiveRowIndex('grdBinding');
            if (rowIndex < 0) {
                rowIndex = 0;
            }
            syn.uicontrols.$auigrid.setDataAtCell('grdBinding', rowIndex, 'UseYN', 'N');
            syn.uicontrols.$auigrid.setDataAtCell('grdBinding', rowIndex, 'ModifiedBy', 'demo-user');
            this.method.updateGridSummary('선택 행을 수정(U)하고 수정자 정보를 함께 기록했습니다.');
            return this.method.readGridRows();
        },
        btnGridRemove_click: function () {
            syn.uicontrols.$auigrid.removeRow('grdBinding', 'CodeID');
            this.method.updateGridSummary('선택 행을 삭제(D) 상태로 전환했습니다.');
            return this.method.readGridRows();
        }
    },
    methods: {
        toBusinessRow: function (item, includeFlag) {
            var row = {
                CodeID: item.CodeID || '',
                CodeValue: item.CodeValue || '',
                CategoryID: item.CategoryID || '',
                UseYN: item.UseYN || '',
                SortingNo: Number(item.SortingNo || 0),
                ModifiedBy: item.ModifiedBy || ''
            };
            if (includeFlag) {
                row.Flag = item.Flag || '';
            }
            return row;
        },
        readGridRows: function () {
            return (syn.uicontrols.$auigrid.getGridData('grdBinding') || []).map(function (item) {
                return $binding.method.toBusinessRow(item, true);
            });
        },
        updateGridSummary: function (message) {
            var rows = $binding.method.readGridRows();
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
        title: '공통코드 저장 거래 준비',
        description: '화면 모델은 전체 행과 Flag를 유지하고, 실제 저장 시에는 C/U/D 변경 행만 List 입력으로 구성합니다.',
        rules: [
            '변경 행이 한 건 이상이어야 합니다.',
            '코드와 코드명은 필수이며 코드는 전체 행에서 중복될 수 없습니다.',
            '사용여부는 Y 또는 N만 허용합니다.'
        ],
        validate: function (value, page) {
            var grid = syn.uicontrols.$auigrid;
            if (!grid.checkEditValue('grdBinding')) {
                return '저장할 변경 행이 없습니다. 행을 추가·수정·삭제하세요.';
            }
            if (grid.checkEmptyValueCol('grdBinding', 'CodeID')) {
                return '코드를 입력하세요.';
            }
            if (grid.checkEmptyValueCol('grdBinding', 'CodeValue')) {
                return '코드명을 입력하세요.';
            }
            if (!grid.checkUniqueValueCol('grdBinding', 'CodeID')) {
                return '코드는 중복될 수 없습니다.';
            }

            var invalidUseYN = page.method.readGridRows().some(function (item) {
                return item.Flag !== 'D' && ['Y', 'N'].indexOf(item.UseYN) < 0;
            });
            return invalidUseYN ? '사용여부는 Y 또는 N으로 입력하세요.' : true;
        },
        buildPayload: function (value, page) {
            var changes = page.method.readGridRows().filter(function (item) {
                return ['C', 'U', 'D'].indexOf(item.Flag) > -1;
            });
            return {
                transactionID: 'MD01',
                inputs: [{
                    type: 'List',
                    dataFieldID: 'CodeList',
                    rows: changes
                }],
                changedCount: changes.length
            };
        },
        onReset: function (page) {
            page.method.updateGridSummary('조회 원본으로 되돌리고 C/U/D 상태를 초기화했습니다.');
        }
    }
});
