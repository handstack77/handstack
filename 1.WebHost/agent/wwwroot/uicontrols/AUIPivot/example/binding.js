'use strict';

(function (context) {
    'use strict';

    function cloneValue(value) {
        var raw = context.syn && syn.$bind ? syn.$bind.raw(value) : value;
        if (raw === undefined || raw === null || typeof raw !== 'object') {
            return raw;
        }

        return JSON.parse(JSON.stringify(raw));
    }

    function renderValue(value) {
        if (value === undefined) {
            return 'undefined';
        }

        return JSON.stringify(cloneValue(value), null, 2);
    }

    context.createControlBindingExample = function (config) {
        var initialValue = cloneValue(config.initialValue);

        function normalizeValidation(result) {
            if (result === undefined || result === null || result === true) {
                return {valid: true, message: '저장 전 업무 규칙 검증을 통과했습니다.', errors: []};
            }
            if (result === false) {
                return {valid: false, message: '저장 전 업무 규칙을 확인하세요.', errors: []};
            }
            if (typeof result === 'string') {
                return {valid: false, message: result, errors: [result]};
            }
            if (Array.isArray(result)) {
                return {
                    valid: result.length === 0,
                    message: result.length === 0 ? '저장 전 업무 규칙 검증을 통과했습니다.' : result[0],
                    errors: result
                };
            }

            return {
                valid: result.valid !== false,
                message: result.message || (result.valid === false ? '저장 전 업무 규칙을 확인하세요.' : '저장 전 업무 규칙 검증을 통과했습니다.'),
                errors: result.errors || []
            };
        }

        var page = {
            prop: {
                mounted: null,
                adapterHandler: null,
                applyingModel: false,
                skipNextModelApply: false,
                unsubscribePreview: null
            },

            hook: {
                pageLoad: function () {
                    if (typeof config.setup === 'function') {
                        config.setup(page);
                    }
                },

                pageComplete: function () {
                    page.method.mount();
                }
            },

            event: {
                btnModelChange_click: function () {
                    if (!page.prop.mounted) {
                        return;
                    }

                    var current = cloneValue(page.prop.mounted.store.data.value);
                    var next = config.nextValue(current, page);
                    page.prop.mounted.store.data.value = cloneValue(next);
                    page.prop.mounted.store.data.direction = '모델 → 컨트롤: Proxy 데이터 변경을 어댑터가 반영했습니다.';
                },

                btnControlRead_click: function () {
                    if (!page.prop.mounted) {
                        return;
                    }

                    page.method.controlToModel();
                }
            },

            method: {
                mount: function () {
                    var adapterName = config.adapterName;
                    syn.$bind.registerAdapter(adapterName, {
                        get: function () {
                            return cloneValue(config.get(page));
                        },
                        set: function (el, value) {
                            if (page.prop.skipNextModelApply) {
                                page.prop.skipNextModelApply = false;
                                return;
                            }

                            page.prop.applyingModel = true;
                            try {
                                config.set(cloneValue(value), page);
                                if (typeof config.afterSet === 'function') {
                                    config.afterSet(cloneValue(value), page);
                                }
                            } finally {
                                page.prop.applyingModel = false;
                            }
                        },
                        on: function (el, handler) {
                            page.prop.adapterHandler = handler;
                        },
                        off: function (el, handler) {
                            if (page.prop.adapterHandler === handler) {
                                page.prop.adapterHandler = null;
                            }
                        }
                    });

                    page.prop.mounted = syn.$bind.mount(
                        document.getElementById(config.rootID || 'bindingRoot'),
                        {
                            value: cloneValue(initialValue),
                            direction: '초기 모델 → 컨트롤: mount 시점에 초기값을 적용했습니다.'
                        }
                    );

                    page.method.renderPreview();
                    page.prop.unsubscribePreview = page.prop.mounted.store.subscribe(
                        'value',
                        page.method.renderPreview,
                        { deep: true }
                    );

                    if (typeof config.afterMount === 'function') {
                        config.afterMount(page);
                    }

                    if (config.business) {
                        page.method.createBusinessPanel();
                    }
                },

                controlToModel: function (value) {
                    if (!page.prop.mounted || page.prop.applyingModel || typeof page.prop.adapterHandler !== 'function') {
                        return;
                    }

                    page.prop.skipNextModelApply = true;
                    if (arguments.length > 0) {
                        page.prop.adapterHandler(cloneValue(value));
                    } else {
                        page.prop.adapterHandler();
                    }
                    page.prop.mounted.store.data.direction = '컨트롤 → 모델: 변경 이벤트가 어댑터를 통해 Proxy 데이터에 반영됐습니다.';
                },

                renderPreview: function () {
                    var preview = document.getElementById('preModel');
                    if (preview && page.prop.mounted) {
                        preview.textContent = renderValue(page.prop.mounted.store.data.value);
                    }
                },

                validateBusiness: function () {
                    var value = cloneValue(page.prop.mounted.store.data.value);
                    var result = typeof config.business.validate === 'function'
                        ? config.business.validate(value, page)
                        : true;
                    result = normalizeValidation(result);
                    page.method.renderBusinessMessage(result);
                    return result;
                },

                prepareBusinessPayload: function () {
                    var validation = page.method.validateBusiness();
                    var preview = document.getElementById('preBusinessPayload');
                    if (!validation.valid) {
                        preview.textContent = renderValue({
                            readyToSave: false,
                            errors: validation.errors.length ? validation.errors : [validation.message]
                        });
                        return;
                    }

                    var value = cloneValue(page.prop.mounted.store.data.value);
                    var payload = typeof config.business.buildPayload === 'function'
                        ? config.business.buildPayload(value, page)
                        : {command: 'Save', data: value};
                    preview.textContent = renderValue(payload);
                },

                resetBusiness: function () {
                    page.prop.mounted.store.data.value = cloneValue(initialValue);
                    page.prop.mounted.store.data.direction = '업무 초기화 → 컨트롤: 조회 원본으로 되돌렸습니다.';
                    document.getElementById('preBusinessPayload').textContent = '';
                    page.method.renderBusinessMessage({
                        valid: true,
                        message: '조회 원본으로 초기화했습니다.',
                        errors: []
                    });
                    if (typeof config.business.onReset === 'function') {
                        config.business.onReset(page);
                    }
                },

                renderBusinessMessage: function (result) {
                    var message = document.getElementById('businessValidationMessage');
                    message.className = 'binding-business-message ' + (result.valid ? 'is-valid' : 'is-invalid');
                    message.textContent = result.message;
                },

                createBusinessPanel: function () {
                    var business = config.business;
                    var panel = document.createElement('section');
                    panel.className = 'binding-panel binding-business-panel';

                    var title = document.createElement('h2');
                    title.textContent = business.title || '실무 저장 흐름';
                    panel.appendChild(title);

                    var description = document.createElement('p');
                    description.className = 'binding-business-description';
                    description.textContent = business.description || '컨트롤 값을 업무 규칙으로 검증한 뒤 저장 거래 payload를 만듭니다.';
                    panel.appendChild(description);

                    if (Array.isArray(business.rules) && business.rules.length) {
                        var ruleList = document.createElement('ul');
                        ruleList.className = 'binding-business-rules';
                        business.rules.forEach(function (rule) {
                            var item = document.createElement('li');
                            item.textContent = rule;
                            ruleList.appendChild(item);
                        });
                        panel.appendChild(ruleList);
                    }

                    var toolbar = document.createElement('div');
                    toolbar.className = 'binding-toolbar';
                    [
                        ['btnBusinessValidate', '업무 규칙 검증', page.method.validateBusiness],
                        ['btnBusinessPayload', '저장 payload 만들기', page.method.prepareBusinessPayload],
                        ['btnBusinessReset', '조회 원본으로 초기화', page.method.resetBusiness]
                    ].forEach(function (buttonInfo) {
                        var button = document.createElement('button');
                        button.type = 'button';
                        button.id = buttonInfo[0];
                        button.textContent = buttonInfo[1];
                        button.addEventListener('click', buttonInfo[2]);
                        toolbar.appendChild(button);
                    });
                    panel.appendChild(toolbar);

                    var message = document.createElement('div');
                    message.id = 'businessValidationMessage';
                    message.className = 'binding-business-message';
                    message.textContent = '아직 업무 규칙을 검증하지 않았습니다.';
                    panel.appendChild(message);

                    var payloadTitle = document.createElement('h3');
                    payloadTitle.textContent = '거래 요청 예시';
                    panel.appendChild(payloadTitle);

                    var payload = document.createElement('pre');
                    payload.id = 'preBusinessPayload';
                    payload.className = 'binding-preview';
                    panel.appendChild(payload);

                    var root = document.getElementById(config.rootID || 'bindingRoot');
                    var panels = root.querySelectorAll('.binding-panel');
                    var lastPanel = panels.length ? panels[panels.length - 1] : null;
                    if (lastPanel) {
                        root.insertBefore(panel, lastPanel);
                    } else {
                        root.appendChild(panel);
                    }
                }
            }
        };

        var events = config.events || {};
        Object.keys(events).forEach(function (eventName) {
            page.event[eventName] = function () {
                if (page.prop.applyingModel) {
                    return;
                }

                var mapper = events[eventName];
                if (typeof mapper === 'function') {
                    var value = mapper.apply(page, arguments);
                    if (value !== undefined) {
                        page.method.controlToModel(value);
                        return;
                    }
                }

                page.method.controlToModel();
            };
        });

        if (config.methods) {
            Object.keys(config.methods).forEach(function (methodName) {
                page.method[methodName] = config.methods[methodName];
            });
        }

        return page;
    };
})(window);

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
