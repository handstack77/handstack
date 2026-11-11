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
    adapterName: 'htmleditor',
    initialValue: '<h3>서비스 점검 안내</h3><p>7월 23일 22시부터 정기점검을 진행합니다.</p>',
    get: function () {
        return syn.uicontrols.$htmleditor.getValue('edtBinding');
    },
    set: function (value) {
        syn.uicontrols.$htmleditor.setValue('edtBinding', value);
    },
    nextValue: function (current) {
        return current.indexOf('변경') > -1
            ? '<h3>서비스 점검 안내</h3><p>7월 23일 22시부터 정기점검을 진행합니다.</p>'
            : '<h3>서비스 점검 일정 변경</h3><p>점검 시작 시각이 7월 24일 22시로 변경되었습니다.</p>';
    },
    afterMount: function (page) {
        var attempts = 0;
        var attachChangeHandler = function () {
            var editor = syn.uicontrols.$htmleditor.getHtmlEditor('edtBinding');
            if (editor) {
                editor.setContent(page.prop.mounted.store.data.value);
                editor.on('change input undo redo', function () {
                    page.method.controlToModel();
                });
            } else if (attempts++ < 100) {
                setTimeout(attachChangeHandler, 50);
            }
        };
        attachChangeHandler();
    },
    business: {
        title: 'HTML 공지 템플릿 저장',
        description: '편집기의 HTML 원문을 공지 템플릿으로 저장하되 실제 서비스에서는 서버측 HTML 정제도 함께 수행해야 합니다.',
        rules: ['태그를 제외한 본문이 비어 있지 않아야 합니다.', 'HTML 원문은 10,000자를 넘을 수 없습니다.'],
        validate: function (value) {
            var text = String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            if (!text) {
                return '공지 본문을 입력하세요.';
            }
            return String(value).length <= 10000 ? true : 'HTML 원문은 10,000자 이하로 입력하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {TemplateID: 'OPS_NOTICE', Subject: '서비스 점검 안내', HtmlBody: value}};
        }
    }
});
