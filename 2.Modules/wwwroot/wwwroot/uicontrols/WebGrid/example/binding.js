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
