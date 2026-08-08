'use strict';
var $binding = createControlBindingExample({
    adapterName: 'auipivot',
    initialValue: [
        {PlanID: 'PLAN-001', Region: '서울', Product: '모니터', Quarter: '2026-Q1', Total: 1000, ModifiedBy: 'system'},
        {PlanID: 'PLAN-002', Region: '서울', Product: '키보드', Quarter: '2026-Q1', Total: 800, ModifiedBy: 'system'},
        {PlanID: 'PLAN-003', Region: '부산', Product: '모니터', Quarter: '2026-Q1', Total: 700, ModifiedBy: 'system'}
    ],
    setup: function () {
        if (window.AUIPivot && syn.uicontrols.$auipivot) {
            syn.uicontrols.$auipivot.controlLoad('pvtBinding', {
                height: 340,
                layout: {
                    rowFields: ['Region', 'Product'],
                    columnFields: ['Quarter'],
                    valueFields: [{dataField: 'Total', operation: 'SUM', formatString: '#,##0'}],
                    fieldAlias: {
                        Region: '지역',
                        Product: '상품',
                        Quarter: '분기',
                        Total: '계획금액'
                    }
                }
            });
        }
    },
    get: function (page) {
        return page.method.readPivotRows();
    },
    set: function (value) {
        if (window.AUIPivot && syn.uicontrols.$auipivot) {
            syn.uicontrols.$auipivot.setGridData('pvtBinding', $binding.method.visiblePivotRows(value));
        }
    },
    nextValue: function (current) {
        var queried = (current || []).filter(function (item) {
            return item.Flag !== 'D';
        }).map(function (item) {
            return $binding.method.toPivotRow(item, false, 'server');
        });
        queried.push({
            PlanID: 'PLAN-004',
            Region: '대전',
            Product: '키보드',
            Quarter: '2026-Q2',
            Total: 850,
            ModifiedBy: 'server'
        });
        return queried;
    },
    afterSet: function (value, page) {
        page.method.finishPivotBinding('조회 원본 ' + page.method.visiblePivotRows(value).length + '건을 집계했습니다.', value);
    },
    afterMount: function (page) {
        document.getElementById('btnPivotDetail').addEventListener('click', function () {
            page.method.showPivotDetail();
        });
    },
    events: {
        btnPivotAdd_click: function () {
            var rows = this.method.currentPivotModel();
            var sequence = rows.reduce(function (max, item) {
                var number = Number(String(item.PlanID || '').replace(/\D/g, ''));
                return Math.max(max, number || 0);
            }, 0) + 1;
            rows.push({
                PlanID: 'PLAN-' + String(sequence).padStart(3, '0'),
                Region: '서울',
                Product: '신규상품',
                Quarter: '2026-Q2',
                Total: 0,
                ModifiedBy: 'demo-user',
                Flag: 'C'
            });
            this.method.applyPivotWorkRows(rows, '신규 계획(C)을 추가하고 피벗을 다시 집계했습니다.');
            return rows;
        },
        btnPivotEdit_click: function () {
            var rows = this.method.currentPivotModel();
            var target = rows.find(function (item) {
                return item.Flag !== 'D';
            });
            if (target) {
                target.Total = Number(target.Total || 0) + 100;
                target.ModifiedBy = 'demo-user';
                target.Flag = target.Flag === 'C' ? 'C' : 'U';
            }
            this.method.applyPivotWorkRows(rows, '원본 계획을 수정(U)하고 피벗 집계를 갱신했습니다.');
            return rows;
        },
        btnPivotRemove_click: function () {
            var rows = this.method.currentPivotModel();
            var index = rows.findIndex(function (item) {
                return item.Flag !== 'D';
            });
            if (index > -1) {
                if (rows[index].Flag === 'C') {
                    rows.splice(index, 1);
                } else {
                    rows[index].Flag = 'D';
                    rows[index].ModifiedBy = 'demo-user';
                }
            }
            this.method.applyPivotWorkRows(rows, '삭제(D) 원본은 모델에 보존하고 피벗 집계에서는 제외했습니다.');
            return rows;
        }
    },
    methods: {
        toPivotRow: function (item, includeFlag, modifiedBy) {
            var row = {
                PlanID: item.PlanID || '',
                Region: item.Region || '',
                Product: item.Product || '',
                Quarter: item.Quarter || '',
                Total: Number(item.Total || 0),
                ModifiedBy: modifiedBy || item.ModifiedBy || ''
            };
            if (includeFlag) {
                row.Flag = item.Flag || 'R';
            }
            return row;
        },
        currentPivotModel: function () {
            if (!$binding.prop.mounted) {
                return [];
            }
            var value = syn.$bind.raw($binding.prop.mounted.store.data.value) || [];
            return JSON.parse(JSON.stringify(value)).map(function (item) {
                return $binding.method.toPivotRow(item, true);
            });
        },
        visiblePivotRows: function (rows) {
            return (rows || []).filter(function (item) {
                return item.Flag !== 'D';
            }).map(function (item) {
                return $binding.method.toPivotRow(item, false);
            });
        },
        readPivotRows: function () {
            var modelRows = $binding.method.currentPivotModel();
            if (!window.AUIPivot || !syn.uicontrols.$auipivot) {
                return modelRows;
            }

            var states = {};
            modelRows.forEach(function (item) {
                states[item.PlanID] = item;
            });
            var rows = (syn.uicontrols.$auipivot.getSourceData('pvtBinding') || []).map(function (item) {
                var state = states[item.PlanID] || {};
                var row = $binding.method.toPivotRow(item, true);
                row.Flag = state.Flag || 'R';
                return row;
            });
            modelRows.filter(function (item) {
                return item.Flag === 'D';
            }).forEach(function (item) {
                rows.push(item);
            });
            return rows;
        },
        applyPivotWorkRows: function (rows, message) {
            if (window.AUIPivot && syn.uicontrols.$auipivot) {
                syn.uicontrols.$auipivot.setGridData('pvtBinding', $binding.method.visiblePivotRows(rows));
            }
            $binding.method.finishPivotBinding(message, rows);
        },
        finishPivotBinding: function (message, rows) {
            if (window.AUIPivot && syn.uicontrols.$auipivot) {
                syn.uicontrols.$auipivot.expandAll('pvtBinding');
                syn.uicontrols.$auipivot.expandAllColumns('pvtBinding');
                syn.uicontrols.$auipivot.setMaxWidthOfRowFields('pvtBinding', {Region: 140, Product: 180});
                var fitSizes = syn.uicontrols.$auipivot.getFitColumnSizeList('pvtBinding', true);
                if (fitSizes && fitSizes.length) {
                    syn.uicontrols.$auipivot.setColumnSizeList('pvtBinding', fitSizes);
                }
            }
            $binding.method.updatePivotSummary(message, rows);
        },
        updatePivotSummary: function (message, sourceRows) {
            var rows = sourceRows
                ? JSON.parse(JSON.stringify(sourceRows)).map(function (item) {
                    return $binding.method.toPivotRow(item, true);
                })
                : $binding.method.currentPivotModel();
            var visible = rows.filter(function (item) {
                return item.Flag !== 'D';
            });
            var changed = rows.filter(function (item) {
                return ['C', 'U', 'D'].indexOf(item.Flag) > -1;
            });
            var total = visible.reduce(function (sum, item) {
                return sum + Number(item.Total || 0);
            }, 0);
            var summary = document.getElementById('pivotWorkSummary');
            if (summary) {
                summary.textContent = (message ? message + ' / ' : '') +
                    '원본 ' + visible.length + '건 · 계획 합계 ' + total.toLocaleString() + ' · 저장 대상 ' + changed.length + '건';
            }
        },
        showPivotDetail: function () {
            var detail = [];
            if (window.AUIPivot && syn.uicontrols.$auipivot) {
                var selected = syn.uicontrols.$auipivot.getSelectedIndex('pvtBinding') || [-1, -1];
                if (selected[0] > -1 && selected[1] > -1) {
                    detail = syn.uicontrols.$auipivot.getCellDetailList('pvtBinding', selected[0], selected[1]) || [];
                }
            }
            if (!detail.length) {
                detail = $binding.method.currentPivotModel().filter(function (item) {
                    return item.Flag !== 'D';
                }).slice(0, 2);
            }
            document.getElementById('prePivotDetail').textContent = JSON.stringify(detail, null, 2);
        }
    },
    business: {
        title: '분기 매출계획 변경분 저장',
        description: '피벗은 D 행을 집계에서 제외하지만 Proxy 모델에는 보존하고, 실제 저장 시 C/U/D 원본 행만 List 입력으로 구성합니다.',
        rules: [
            '저장할 원본 변경 행이 한 건 이상이어야 합니다.',
            '계획 ID, 지역, 상품, YYYY-Qn 분기는 필수이며 계획 ID는 중복될 수 없습니다.',
            '계획 금액은 0 이상이어야 합니다.'
        ],
        validate: function (value) {
            var changed = (value || []).filter(function (item) {
                return ['C', 'U', 'D'].indexOf(item.Flag) > -1;
            });
            if (!changed.length) {
                return '저장할 원본 변경 행이 없습니다.';
            }
            var ids = {};
            var invalid = (value || []).some(function (item) {
                if (item.Flag === 'D') {
                    return false;
                }
                if (!item.PlanID || !item.Region || !item.Product || !/^\d{4}-Q[1-4]$/.test(item.Quarter) ||
                    Number(item.Total) < 0 || ids[item.PlanID]) {
                    return true;
                }
                ids[item.PlanID] = true;
                return false;
            });
            return invalid ? '계획 ID/지역/상품/분기, ID 중복, 계획 금액을 확인하세요.' : true;
        },
        buildPayload: function (value) {
            var changes = value.filter(function (item) {
                return ['C', 'U', 'D'].indexOf(item.Flag) > -1;
            });
            return {
                transactionID: 'MD01',
                inputs: [{type: 'List', dataFieldID: 'SalesPlan', rows: changes}],
                changedCount: changes.length
            };
        },
        onReset: function (page) {
            page.method.finishPivotBinding('조회 원본으로 되돌리고 C/U/D 상태를 초기화했습니다.');
            document.getElementById('prePivotDetail').textContent = '피벗 셀을 선택한 뒤 원본 보기 버튼을 누르세요.';
        }
    }
});
