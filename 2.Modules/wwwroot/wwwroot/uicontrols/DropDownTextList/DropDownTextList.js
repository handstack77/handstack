/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $dropdowntextlist = syn.uicontrols.$dropdowntextlist || new syn.module();

    $dropdowntextlist.extend({
        name: 'syn.uicontrols.$dropdowntextlist',
        version: 'v2026.10.14',
        textListControls: [],
        defaultSetting: {
            optgroups: [],
            optgroupField: 'class',
            valueField: 'value',
            labelField: 'name',
            options: [],
            items: [],
            placeholder: '검색하여 선택...',
            width: '100%',
            dropdownWidth: 'auto',
            dropdownHeight: 'auto',
            maxItems: null,
            hideSelected: true,
            clearAfterSelect: true,
            persist: true,
            create: false,
            defaultGroupID: '',
            load: null,
            loadThrottle: 300,
            preload: false,
            dataType: 'object',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        operators: Object.freeze({
            eq: '같음',
            lte: '같거나작게',
            gte: '같거나크게',
            ne: '다름',
            startsWith: '시작함',
            endsWith: '끝남',
            contains: '포함'
        }),
        eventCallbacks: {
            initialize: 'onInitialize',
            change: 'onChange',
            focus: 'onFocus',
            blur: 'onBlur',
            item_add: 'onItemAdd',
            item_remove: 'onItemRemove',
            item_select: 'onItemSelect',
            clear: 'onClear',
            option_add: 'onOptionAdd',
            option_remove: 'onOptionRemove',
            option_clear: 'onOptionClear',
            optgroup_add: 'onOptionGroupAdd',
            optgroup_remove: 'onOptionGroupRemove',
            optgroup_clear: 'onOptionGroupClear',
            dropdown_open: 'onDropdownOpen',
            dropdown_close: 'onDropdownClose',
            type: 'onType',
            load: 'onLoad',
            destroy: 'onDestroy'
        },

        addModuleList(el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';
            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: $dropdowntextlist.name,
                type: controlType
            });
        },

        controlLoad(elID, setting) {
            var control = $dropdowntextlist.getControl(elID);
            if (control) {
                return control;
            }
            var el = syn.$l.get(elID);
            if (!el) {
                throw new Error('DropDownTextList: element not found: ' + elID);
            }
            if (typeof TomSelect === 'undefined') {
                throw new Error('DropDownTextList: Tom Select must be loaded first');
            }
            setting = syn.$w.argumentsExtend($dropdowntextlist.defaultSetting, setting || {});
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }
            setting.elID = elID;
            $dropdowntextlist.normalizeDropdownSize(setting.dropdownWidth, 'dropdownWidth');
            $dropdowntextlist.normalizeDropdownSize(setting.dropdownHeight, 'dropdownHeight');
            el.setAttribute('syn-options', JSON.stringify(setting));
            try {
                control = $dropdowntextlist.addControlSetting(el, setting);
            } catch (error) {
                $dropdowntextlist.textListControls = $dropdowntextlist.textListControls.filter(function (item) {
                    return item.id !== elID;
                });
                throw error;
            }
            $dropdowntextlist.initialize(elID);
            return control;
        },

        addControlSetting(el, setting) {
            var control = {
                id: el.id,
                host: el,
                settings: setting,
                handlers: new Map(),
                conditions: new Map(),
                cleanups: [],
                revision: 0,
                loadSequence: 0,
                destroyed: false,
                ready: false,
                originalEvents: el.getAttribute('syn-events'),
                originalDisplay: el.style.display,
                dispose: function () {
                    $dropdowntextlist.textListControls = $dropdowntextlist.textListControls.filter(function (item) {
                        return item.id !== control.id;
                    });
                },

                on(event, handler) {
                    return $dropdowntextlist.on(control.id, event, handler);
                },

                off(event, handler) {
                    return $dropdowntextlist.off(control.id, event, handler);
                },

                trigger(event, ...args) {
                    return $dropdowntextlist.trigger(control.id, event, ...args);
                },

                getValue() {
                    return $dropdowntextlist.getValue(control.id);
                },

                setValue(value, silent) {
                    return $dropdowntextlist.setValue(control.id, value, silent);
                },

                addOption(data, user_created) {
                    return $dropdowntextlist.addOption(control.id, data, user_created);
                },

                addOptions(data, user_created) {
                    return $dropdowntextlist.addOptions(control.id, data, user_created);
                },

                updateOption(value, data) {
                    return $dropdowntextlist.updateOption(control.id, value, data);
                },

                removeOption(value) {
                    return $dropdowntextlist.removeOption(control.id, value);
                },

                getOption(value, create) {
                    return $dropdowntextlist.getOption(control.id, value, create);
                },

                clearFilter(option, value) {
                    return $dropdowntextlist.clearFilter(control.id, option, value);
                },

                clearOptions(filter) {
                    return $dropdowntextlist.clearOptions(control.id, filter);
                },

                clear(silent) {
                    return $dropdowntextlist.clear(control.id, silent);
                },

                getItem(value) {
                    return $dropdowntextlist.getItem(control.id, value);
                },

                addItem(value, silent) {
                    return $dropdowntextlist.addItem(control.id, value, silent);
                },

                removeItem(value, silent) {
                    return $dropdowntextlist.removeItem(control.id, value, silent);
                },

                refreshItems() {
                    return $dropdowntextlist.refreshItems(control.id);
                },

                createItem(value, callback) {
                    return $dropdowntextlist.createItem(control.id, value, callback);
                },

                load(query) {
                    return $dropdowntextlist.load(control.id, query);
                },

                addOptionGroup(id, data) {
                    return $dropdowntextlist.addOptionGroup(control.id, id, data);
                },

                removeOptionGroup(id) {
                    return $dropdowntextlist.removeOptionGroup(control.id, id);
                },

                clearOptionGroups() {
                    return $dropdowntextlist.clearOptionGroups(control.id);
                },

                lock() {
                    return $dropdowntextlist.lock(control.id);
                },

                unlock() {
                    return $dropdowntextlist.unlock(control.id);
                },

                disable() {
                    return $dropdowntextlist.disable(control.id);
                },

                enable() {
                    return $dropdowntextlist.enable(control.id);
                },

                sync() {
                    return $dropdowntextlist.sync(control.id);
                },

                destroy() {
                    if (control.destroyed) {
                        return;
                    }
                    return $dropdowntextlist.destroy(control.id);
                },

                getAdjacent(element, direction) {
                    return $dropdowntextlist.getAdjacent(control.id, element, direction);
                },

                refreshOptions(triggerDropdown) {
                    return $dropdowntextlist.refreshOptions(control.id, triggerDropdown);
                },

                open() {
                    return $dropdowntextlist.open(control.id);
                },

                close() {
                    return $dropdowntextlist.close(control.id);
                },

                positionDropdown() {
                    return $dropdowntextlist.positionDropdown(control.id);
                },

                focus() {
                    return $dropdowntextlist.focus(control.id);
                },

                blur() {
                    return $dropdowntextlist.blur(control.id);
                },

                setCaret(index) {
                    return $dropdowntextlist.setCaret(control.id, index);
                },

                isFull() {
                    return $dropdowntextlist.isFull(control.id);
                },

                clearCache() {
                    return $dropdowntextlist.clearCache(control.id);
                },

                setTextboxValue(str) {
                    return $dropdowntextlist.setTextboxValue(control.id, str);
                }
            };
            $dropdowntextlist.textListControls.push(control);
            var mod = window[syn.$w.pageScript];
            var events = control.originalEvents ? $object.parseJsonValue(control.originalEvents, 'json') : [];
            Object.keys($dropdowntextlist.eventCallbacks).forEach(function (event) {
                if (typeof setting[$dropdowntextlist.eventCallbacks[event]] === 'function') {
                    $dropdowntextlist.on(control.id, event, setting[$dropdowntextlist.eventCallbacks[event]]);
                }
                if (events.includes(event) && mod && mod.event && typeof mod.event[control.id + '_' + event] === 'function') {
                    $dropdowntextlist.on(control.id, event, mod.event[control.id + '_' + event]);
                }
            });
            // 컨트롤 이벤트는 직접 연결하여 공통 로더의 DOM 이벤트와 중복 호출되지 않게 한다.
            if (control.originalEvents !== null) {
                el.setAttribute('syn-events', JSON.stringify(events.filter(function (event) {
                    return !$dropdowntextlist.hasProperty($dropdowntextlist.eventCallbacks, event);
                })));
            }
            control.container = document.createElement('div');
            control.container.className = 'syn-dropdowntextlist';
            control.container.style.width = setting.width;
            control.source = document.createElement('select');
            control.source.multiple = true;
            control.source.id = control.id + '_select';
            control.source.setAttribute('aria-label', setting.controlText || setting.placeholder);
            control.container.append(control.source);
            if (/^(INPUT|SELECT)$/.test(el.tagName)) {
                el.style.display = 'none';
                el.insertAdjacentElement('afterend', control.container);
            }
            else {
                el.append(control.container);
            }
            $dropdowntextlist.listen(control.id, control.source, 'change', function (event) {
                return event.stopPropagation();
            });
            $dropdowntextlist.listen(control.id, control.source, 'input', function (event) {
                return event.stopPropagation();
            });
            var options = (setting.options || []).map(function (data) {
                return $dropdowntextlist.normalize(control.id, data);
            });
            var selectSetting = Object.assign({}, setting, {
                options: options,
                items: [],
                preload: false,
                mode: 'multi',
                duplicates: false,
                valueField: '_dttlID',
                labelField: '_dttlLabel',
                optgroupField: '_dttlGroup',
                searchField: ['_dttlKey', '_dttlLabel'],
                optgroupValueField: 'value',
                optgroupLabelField: 'label',
                plugins: ['caret_position'],
                loadThrottle: null,
                create: setting.create ? true : false,
                render: {
                    item: function (data, escape) {
                        var condition = control.conditions.get(data._dttlID) || {
                            logic: 'AND',
                            operator: 'eq'
                        };
                        var group = control.picker ? control.picker.optgroups[data._dttlGroup] : null;
                        var groupLabel = group && group.label != null ? String(group.label) : data._dttlGroup || '기타';
                        var summary = groupLabel + ' · ' + data._dttlLabel + ' · ' + condition.logic + ' · ' + $dropdowntextlist.operators[condition.operator];

                        return '<div class="dttl-item" data-dttl-logic="' + condition.logic + '" data-dttl-operator="' + condition.operator + '" title="' + escape(summary) + '">' +
                            '<span class="dttl-logic-badge" aria-hidden="true">' + condition.logic + '</span>' +
                            '<span class="dttl-group" role="button" tabindex="0" aria-label="' + escape(summary + ' 조건 편집') + '">' + escape(groupLabel) + '</span>' +
                            '<button type="button" class="dttl-edit" aria-label="' + escape(summary + ' 조건 편집') + '"><span class="dttl-label">' + escape(data._dttlLabel) + '</span></button>' +
                            '<button type="button" class="dttl-remove" aria-label="' + escape(data._dttlLabel + ' 삭제') + '">×</button></div>';
                    },
                    option: function (data, escape) {
                        return '<div>' + escape(data._dttlLabel) + '</div>';
                    },
                    no_results: function () {
                        return '<div class="no-results">검색 결과가 없습니다.</div>';
                    }
                }
            });
            Object.keys($dropdowntextlist.eventCallbacks).forEach(function (event) {
                selectSetting[$dropdowntextlist.eventCallbacks[event]] = function (...args) {
                    control.picker = this;
                    $dropdowntextlist.relay(control.id, event, args);
                };
            });
            control.picker = new TomSelect(control.source, selectSetting);
            var originalPositionDropdown = control.picker.positionDropdown;
            control.picker.positionDropdown = function () {
                var result = originalPositionDropdown.call(control.picker);
                if (!control.destroyed) {
                    $dropdowntextlist.sizeDropdown(control.id);
                }
                return result;
            };
            var originalRefreshOptions = control.picker.refreshOptions;
            control.picker.refreshOptions = function (triggerDropdown) {
                var result = originalRefreshOptions.call(control.picker, triggerDropdown);
                if (control.picker.isOpen && !control.destroyed) {
                    $dropdowntextlist.sizeDropdown(control.id);
                }
                return result;
            };
            // 콜백과 Promise 방식 모두 같은 생성·조회 처리와 파괴 여부 검사를 사용한다.
            control.picker.createItem = function (value, callback) {
                return $dropdowntextlist.createItem(control.id, value, callback);
            };
            control.picker.load = function (query) {
                return $dropdowntextlist.load(control.id, query);
            };
            $dropdowntextlist.listen(control.id, control.picker.control, 'click', function (event) {
                return $dropdowntextlist.onTagClick(control.id, event);
            }, true);
            $dropdowntextlist.listen(control.id, control.picker.control, 'keydown', function (event) {
                var target = event.target.closest('.dttl-group,.dttl-edit');
                if (target && (event.key === 'Enter' || event.key === ' ' || event.key === 'F2')) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $dropdowntextlist.editCondition(control.id, target.closest('[data-value]'));
                    return;
                }
                if ((event.key === 'Enter' || event.key === 'F2') && control.picker.activeItems.length) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $dropdowntextlist.editCondition(control.id, control.picker.activeItems[0]);
                }
            }, true);
            $dropdowntextlist.listen(control.id, control.picker.control_input, 'compositionstart', function () {
                control.composing = true;
            });
            $dropdowntextlist.listen(control.id, control.picker.control_input, 'compositionend', function () {
                control.composing = false;
            });
            $dropdowntextlist.listen(control.id, control.picker.control_input, 'keydown', function (event) {
                if (control.composing || event.isComposing) {
                    event.stopImmediatePropagation();
                }
            }, true);
            $dropdowntextlist.listen(control.id, document, 'pointerdown', function (event) {
                if (control.editor && !control.editor.contains(event.target) && !control.picker.control.contains(event.target)) {
                    $dropdowntextlist.closeEditor(control.id, false);
                }
            });
            $dropdowntextlist.listen(control.id, window, 'resize', function () {
                if (control.picker.isOpen) {
                    control.picker.positionDropdown();
                }
                if (control.editor) {
                    $dropdowntextlist.positionEditor(control.id);
                }
            });
            $dropdowntextlist.listen(control.id, document, 'scroll', function (event) {
                if (control.editor && !control.editor.contains(event.target)) {
                    $dropdowntextlist.positionEditor(control.id);
                }
            }, true);
            if (setting.items && setting.items.length) {
                $dropdowntextlist.setValue(control.id, setting.items, true);
            }
            if (setting.disabled || el.disabled) {
                $dropdowntextlist.disable(control.id);
            }
            if (setting.locked || el.readOnly) {
                $dropdowntextlist.lock(control.id);
            }
            control.ready = true;
            $dropdowntextlist.writeValue(control.id);
            return control;
        },

        on(elID, event, handler) {
            var control = $dropdowntextlist.requireControl(elID);

            if (typeof handler !== 'function') {
                throw new TypeError('DropDownTextList: handler must be a function');
            }
            event.split(/\s+/).forEach(function (name) {
                if (!control.handlers.has(name)) {
                    control.handlers.set(name, new Set());
                }
                control.handlers.get(name).add(handler);
            });
            return control;
        },

        off(elID, event, handler) {
            var control = $dropdowntextlist.requireControl(elID);

            if (!event) {
                control.handlers.clear();
            }
            else {
                event.split(/\s+/).forEach(function (name) {
                    if (handler) {
                        var handlers = control.handlers.get(name);
                        if (handlers) {
                            handlers.delete(handler);
                        }
                    }
                    else {
                        control.handlers.delete(name);
                    }
                });
            }
            return control;
        },

        trigger(elID, event, ...args) {
            var control = $dropdowntextlist.requireControl(elID);

            Array.from(control.handlers.get(event) || []).forEach(function (handler) {
                return handler.apply(control, args);
            });
            return control;
        },

        getValue(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.items.filter(function (id) {
                return $dropdowntextlist.hasProperty(control.picker.options, id);
            }).map(function (id) {
                var data = control.picker.options[id];
                var condition = control.conditions.get(id) || {
                    logic: 'AND',
                    operator: 'eq'
                };
                return {
                    groupID: data._dttlGroup,
                    logic: condition.logic,
                    operator: condition.operator,
                    key: data._dttlKey,
                    value: data._dttlLabel
                };
            });
        },

        setValue(elID, value, silent = false) {
            var control = $dropdowntextlist.requireControl(elID);

            // 거래 setter의 세 번째 인자는 메타데이터일 수 있으므로 true일 때만 change를 생략한다.
            silent = silent === true;
            var values = Array.isArray(value) ? value : [value];
            var kind = values.length ? $dropdowntextlist.getValueType(values[0]) : 'key';
            if (values.some(function (item) {
                return $dropdowntextlist.getValueType(item) !== kind;
            })) {
                throw new TypeError('DropDownTextList: mixed arrays are not supported');
            }
            var prepared = [];
            if (kind === 'condition') {
                prepared = values.map(function (item) {
                    return $dropdowntextlist.condition(control.id, item);
                });
            }
            else if (kind === 'option') {
                prepared = values.map(function (item) {
                    return $dropdowntextlist.normalize(control.id, item);
                });
            }
            else {
                prepared = values.map(function (item) {
                    var id = $dropdowntextlist.resolve(control.id, item);
                    if (!id) {
                        throw new Error('DropDownTextList: unknown key ' + item);
                    }
                    return id;
                });
            }

            var before = JSON.stringify($dropdowntextlist.getValue(control.id));
            var userOptions = Object.assign({}, control.picker.userOptions);
            $dropdowntextlist.cancelPending(control.id);
            $dropdowntextlist.closeEditor(control.id, false);
            if (kind === 'option') {
                var incoming = new Map(prepared.map(function (data) {
                    return [data._dttlID, data];
                }));
                Object.keys(control.picker.options).forEach(function (id) {
                    if (!incoming.has(id)) {
                        control.picker.removeOption(id, true);
                    }
                });
                incoming.forEach(function (data, id) {
                    if ($dropdowntextlist.hasProperty(control.picker.options, id)) {
                        control.picker.updateOption(id, data);
                    }
                    else {
                        control.picker.addOption(data);
                    }
                });
            }
            else {
                // 선택을 재설정할 때 persist=false로 제거되는 사용자 생성 후보도 보존한다.
                var selectedOptions = kind === 'key' ? prepared.map(function (id) {
                    return control.picker.options[id];
                }) : [];
                control.picker.clear(true);
                control.conditions.clear();
                var ids = [];
                prepared.forEach(function (data, index) {
                    var id = kind === 'condition' ? $dropdowntextlist.getOptionID(data.groupID, data.key) : data;
                    if (ids.includes(id)) {
                        return;
                    }
                    ids.push(id);
                    if (kind === 'condition') {
                        control.conditions.set(id, {
                            logic: data.logic,
                            operator: data.operator
                        });
                        var option = $dropdowntextlist.fromCondition(control.id, data);
                        if ($dropdowntextlist.hasProperty(control.picker.options, id)) {
                            control.picker.updateOption(id, option);
                        }
                        else {
                            control.picker.addOption(option, $dropdowntextlist.hasProperty(userOptions, id));
                        }
                    }
                    else if (!$dropdowntextlist.hasProperty(control.picker.options, id)) {
                        control.picker.addOption(selectedOptions[index], $dropdowntextlist.hasProperty(userOptions, id));
                    }
                });
                control.picker.addItems(ids, true);
            }
            $dropdowntextlist.refreshItems(control.id);
            control.picker.refreshOptions(false);
            $dropdowntextlist.notify(control.id, before, silent);
        },

        addOption(elID, data, user_created = false) {
            var control = $dropdowntextlist.requireControl(elID);

            control.picker.addOption($dropdowntextlist.normalize(control.id, data), user_created);
        },

        addOptions(elID, data, user_created = false) {
            var control = $dropdowntextlist.requireControl(elID);

            var options = data.map(function (item) {
                return $dropdowntextlist.normalize(control.id, item);
            });
            options.forEach(function (item) {
                return control.picker.addOption(item, user_created);
            });
        },

        updateOption(elID, value, data) {
            var control = $dropdowntextlist.requireControl(elID);

            var id = $dropdowntextlist.resolve(control.id, value);
            var option = $dropdowntextlist.normalize(control.id, data);
            if (!id || !$dropdowntextlist.hasProperty(control.picker.options, id)) {
                return;
            }
            if (id !== option._dttlID && $dropdowntextlist.hasProperty(control.picker.options, option._dttlID)) {
                throw new Error('DropDownTextList: duplicate groupID + key');
            }
            var before = JSON.stringify($dropdowntextlist.getValue(control.id));
            var condition = control.conditions.get(id);
            control.conditions.delete(id);
            if (condition) {
                control.conditions.set(option._dttlID, condition);
            }
            var userCreated = $dropdowntextlist.hasProperty(control.picker.userOptions, id);
            control.picker.updateOption(id, option);
            if (userCreated) {
                delete control.picker.userOptions[id];
                control.picker.userOptions[option._dttlID] = true;
            }
            control.picker.updateOriginalInput({
                silent: true
            });
            $dropdowntextlist.closeEditor(control.id, false);
            $dropdowntextlist.notify(control.id, before, false);
            if (control.picker.isOpen) {
                control.picker.positionDropdown();
            }
        },

        removeOption(elID, value) {
            var control = $dropdowntextlist.requireControl(elID);

            var id = $dropdowntextlist.resolve(control.id, value);
            if (id) {
                control.picker.removeOption(id);
            }
        },

        getOption(elID, value, create = false) {
            var control = $dropdowntextlist.requireControl(elID);

            var id = $dropdowntextlist.resolve(control.id, value);
            return id ? control.picker.getOption(id, create) : null;
        },

        clearFilter(elID, option, value) {
            var control = $dropdowntextlist.requireControl(elID);

            var id = $dropdowntextlist.resolve(control.id, value);
            return control.picker.items.includes(id);
        },

        clearOptions(elID, filter) {
            var control = $dropdowntextlist.requireControl(elID);

            var users = Object.assign({}, control.picker.userOptions);
            $dropdowntextlist.cancelPending(control.id);
            control.picker.clearOptions(function (data, id) {
                return control.picker.items.includes(id) || (filter ? filter.call(control, Object.assign({}, data._dttlRaw), $dropdowntextlist.getOptionReference(id)) === true : false);
            });
            Object.keys(users).forEach(function (id) {
                if ($dropdowntextlist.hasProperty(control.picker.options, id)) {
                    control.picker.userOptions[id] = true;
                }
            });
        },

        clear(elID, silent = false) {
            var control = $dropdowntextlist.requireControl(elID);

            $dropdowntextlist.cancelPending(control.id);
            control.picker.clear(silent === true);
            control.conditions.clear();
            $dropdowntextlist.closeEditor(control.id, false);
            $dropdowntextlist.writeValue(control.id);
        },

        getItem(elID, value) {
            var control = $dropdowntextlist.requireControl(elID);

            var id = $dropdowntextlist.resolve(control.id, value);
            return id ? control.picker.getItem(id) : null;
        },

        addItem(elID, value, silent = false) {
            var control = $dropdowntextlist.requireControl(elID);

            var id = $dropdowntextlist.resolve(control.id, value);
            if (id) {
                control.picker.addItem(id, silent === true);
            }
            $dropdowntextlist.writeValue(control.id);
        },

        removeItem(elID, value, silent = false) {
            var control = $dropdowntextlist.requireControl(elID);

            var id = $dropdowntextlist.resolve(control.id, value);
            if (id) {
                control.picker.removeItem(id, silent === true);
            }
            $dropdowntextlist.writeValue(control.id);
        },

        refreshItems(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            // Tom Select가 기존 태그를 재사용하는 경우에도 조건 요약을 다시 렌더링한다.
            control.picker.items.forEach(function (id) {
                var old = control.picker.getItem(id);
                var node = control.picker._render('item', control.picker.options[id]);
                if (old) {
                    old.replaceWith(node);
                }
            });
            control.picker.clearActiveItems();
            control.picker.updateOriginalInput({
                silent: true
            });
            control.picker.refreshState();
            $dropdowntextlist.updateButtons(control.id);
            $dropdowntextlist.writeValue(control.id);
        },

        createItem(elID, value, callback) {
            var control = $dropdowntextlist.requireControl(elID);

            value = value == null ? control.picker.control_input.value : String(value);
            if (!value || !control.settings.create || control.destroyed || control.picker.isLocked || !control.picker.canCreate(value)) {
                if (callback) {
                    callback();
                }
                return false;
            }
            var revision = control.revision;
            var caret = control.picker.caretPos;
            control.creating = true;
            control.picker.lock();
            var completed = false;
            var done = function (data) {
                if (completed || control.destroyed || revision !== control.revision) {
                    return;
                }
                completed = true;
                control.creating = false;
                if (!control.explicitLock && !control.picker.isDisabled) {
                    control.picker.unlock();
                }
                if (!data) {
                    if (callback) {
                        callback();
                    }
                    return;
                }
                var option;
                try {
                    option = $dropdowntextlist.normalize(control.id, data);
                } catch (error) {
                    console.warn(error);
                    if (callback) {
                        callback();
                    }
                    return;
                }
                control.picker.addOption(option, true);
                control.picker.setCaret(caret);
                control.picker.addItem(option._dttlID);
                control.picker.setTextboxValue('');
                if (callback) {
                    callback(Object.assign({}, data));
                }
            };
            try {
                var result = typeof control.settings.create === 'function' ? control.settings.create.call(control, value, done) : {
                    [control.settings.optgroupField]: control.settings.defaultGroupID,
                    [control.settings.valueField]: value,
                    [control.settings.labelField]: value
                };
                if (result && typeof result.then === 'function') {
                    result.then(done, function (error) {
                        console.warn(error);
                        done();
                    });
                }
                else if (result !== undefined) {
                    done(result);
                }
            } catch (error) {
                console.warn(error);
                done();
            }
            return true;
        },

        load(elID, query) {
            var control = $dropdowntextlist.requireControl(elID);

            if (control.destroyed || typeof control.settings.load !== 'function') {
                return;
            }
            query = String(query || '');
            var sequence = ++control.loadSequence;
            clearTimeout(control.loadTimer);
            control.picker.loading = 1;
            control.picker.wrapper.classList.add(control.picker.settings.loadingClass);
            control.loadTimer = setTimeout(function () {
                if (control.destroyed || sequence !== control.loadSequence) {
                    return;
                }
                var completed = false;
                var done = function (data = [], groups = []) {
                    if (completed || control.destroyed || sequence !== control.loadSequence) {
                        return;
                    }
                    completed = true;
                    control.picker.loading = 0;
                    control.picker.wrapper.classList.remove(control.picker.settings.loadingClass);
                    try {
                        var normalized = data.map(function (item) {
                            return $dropdowntextlist.normalize(control.id, item);
                        });
                        groups.forEach(function (group) {
                            return $dropdowntextlist.addOptionGroup(control.id, group.value, group);
                        });
                        normalized.forEach(function (option) {
                            return control.picker.addOption(option);
                        });
                        control.picker.refreshOptions(control.picker.isFocused);
                        $dropdowntextlist.trigger(control.id, 'load', data.map(function (item) {
                            return Object.assign({}, item);
                        }));
                    } catch (error) {
                        console.warn(error);
                    }
                };
                try {
                    var result = control.settings.load.call(control, query, done);
                    if (result && typeof result.then === 'function') {
                        result.then(function (data) {
                            return done(data);
                        }, function (error) {
                            console.warn(error);
                            done();
                        });
                    }
                    else if (Array.isArray(result)) {
                        done(result);
                    }
                } catch (error) {
                    console.warn(error);
                    done();
                }
            }, control.settings.loadThrottle || 0);
        },

        addOptionGroup(elID, id, data) {
            var control = $dropdowntextlist.requireControl(elID);

            control.picker.addOptionGroup(String(id), Object.assign({}, data, {
                value: String(id)
            }));
            $dropdowntextlist.refreshItems(elID);
        },

        removeOptionGroup(elID, id) {
            var control = $dropdowntextlist.requireControl(elID);

            control.picker.removeOptionGroup(String(id));
            $dropdowntextlist.refreshItems(elID);
        },

        clearOptionGroups(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            control.picker.clearOptionGroups();
            $dropdowntextlist.refreshItems(elID);
        },

        lock(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            control.explicitLock = true;
            $dropdowntextlist.closeEditor(control.id, false);
            control.picker.lock();
            $dropdowntextlist.updateButtons(control.id);
        },

        unlock(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            control.explicitLock = false;
            if (!control.creating && !control.picker.isDisabled) {
                control.picker.unlock();
            }
            $dropdowntextlist.updateButtons(control.id);
        },

        disable(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            $dropdowntextlist.closeEditor(control.id, false);
            control.picker.disable();
            $dropdowntextlist.updateButtons(control.id);
        },

        enable(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            control.picker.enable();
            if (control.explicitLock || control.creating) {
                control.picker.lock();
            }
            $dropdowntextlist.updateButtons(control.id);
        },

        sync(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            var before = JSON.stringify($dropdowntextlist.getValue(control.id));
            var records = Array.from(control.source.options).map(function (option) {
                var ref = $dropdowntextlist.getOptionReference(option.value);
                var currentOption = control.picker.options[option.value];
                var raw = Object.assign({}, currentOption ? currentOption._dttlRaw : undefined, {
                    [control.settings.optgroupField]: ref.groupID,
                    [control.settings.valueField]: ref.key,
                    [control.settings.labelField]: option.text
                });
                return {
                    data: $dropdowntextlist.normalize(control.id, raw),
                    selected: option.selected
                };
            });
            var conditions = new Map(control.conditions);
            $dropdowntextlist.setValue(control.id, records.map(function (record) {
                return record.data._dttlRaw;
            }), true);
            control.picker.clear(true);
            control.conditions = conditions;
            control.picker.addItems(records.filter(function (record) {
                return record.selected;
            }).map(function (record) {
                return record.data._dttlID;
            }), true);
            $dropdowntextlist.refreshItems(control.id);
            if (control.source.disabled) {
                $dropdowntextlist.disable(control.id);
            }
            else {
                $dropdowntextlist.enable(control.id);
            }
            $dropdowntextlist.notify(control.id, before, false);
        },

        destroy(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            if (control.destroyed) {
                return;
            }
            $dropdowntextlist.trigger(control.id, 'destroy');
            $dropdowntextlist.cancelPending(control.id);
            control.destroyed = true;
            clearTimeout(control.picker.refreshTimeout);
            $dropdowntextlist.closeEditor(control.id, false);
            control.cleanups.forEach(function (cleanup) {
                return cleanup();
            });
            control.cleanups = [];
            control.picker.destroy();
            control.container.remove();
            control.host.style.display = control.originalDisplay;
            if (control.originalEvents !== null) {
                control.host.setAttribute('syn-events', control.originalEvents);
            }
            control.handlers.clear();
            control.conditions.clear();
            control.dispose();
        },

        getAdjacent(elID, element, direction) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.getAdjacent(element, direction);
        },

        refreshOptions(elID, triggerDropdown) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.refreshOptions(triggerDropdown);
        },

        open(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.open();
        },

        close(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.close();
        },

        positionDropdown(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            control.picker.positionDropdown();
            if (control.editor) {
                $dropdowntextlist.positionEditor(elID);
            }
        },

        focus(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.focus();
        },

        blur(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.blur();
        },

        setCaret(elID, index) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.setCaret(index);
        },

        isFull(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.isFull();
        },

        clearCache(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.clearCache();
        },

        setTextboxValue(elID, str) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.setTextboxValue(str);
        },

        getControl(elID) {
            var result = null;
            for (var i = 0, length = $dropdowntextlist.textListControls.length; i < length; i++) {
                var control = $dropdowntextlist.textListControls[i];
                if (control.id === elID) {
                    result = control;
                    break;
                }
            }
            return result;
        },

        requireControl(elID) {
            var control = $dropdowntextlist.getControl(elID);
            if (!control) {
                throw new Error('DropDownTextList: control not initialized: ' + elID);
            }
            return control;
        },

        hasProperty(object, key) {
            return Object.prototype.hasOwnProperty.call(object, key);
        },

        getOptionID(groupID, key) {
            return JSON.stringify([groupID, key]);
        },

        getOptionReference(id) {
            var pair = JSON.parse(id);
            return {
                groupID: pair[0],
                key: pair[1]
            };
        },

        normalizeScalar(value, field, empty) {
            if (typeof value !== 'string' && typeof value !== 'number' || !empty && String(value) === '') {
                throw new TypeError('DropDownTextList: ' + field + ' must be a ' + (empty ? '' : 'nonempty ') + 'string or number');
            }
            return String(value);
        },

        initialize(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            $dropdowntextlist.trigger(control.id, 'initialize');
            if (control.settings.preload === true && control.destroyed !== true) {
                $dropdowntextlist.load(control.id, '');
            }
        },

        listen(elID, element, event, handler, capture = false) {
            var control = $dropdowntextlist.requireControl(elID);

            element.addEventListener(event, handler, capture);
            control.cleanups.push(function () {
                return element.removeEventListener(event, handler, capture);
            });
        },

        getValueType(value) {
            var result = 'option';
            if (typeof value === 'string' || typeof value === 'number') {
                result = 'key';
            }
            else if (value && typeof value === 'object') {
                var isCondition = ['groupID', 'logic', 'operator', 'key'].every(function (key) {
                    return $dropdowntextlist.hasProperty(value, key);
                });
                if (isCondition) {
                    result = 'condition';
                }
            }

            return result;
        },

        normalize(elID, data) {
            var control = $dropdowntextlist.requireControl(elID);

            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                throw new TypeError('DropDownTextList: option must be an object');
            }
            var key = $dropdowntextlist.normalizeScalar(data[control.settings.valueField], 'key', false);
            var groupID = $dropdowntextlist.normalizeScalar(data[control.settings.optgroupField] == null ? '' : data[control.settings.optgroupField], 'groupID', true);
            var value = $dropdowntextlist.normalizeScalar(data[control.settings.labelField], 'value', true);
            return {
                _dttlID: $dropdowntextlist.getOptionID(groupID, key),
                _dttlKey: key,
                _dttlGroup: groupID,
                _dttlLabel: value,
                _dttlRaw: Object.assign({}, data)
            };
        },

        condition(elID, data) {
            var control = $dropdowntextlist.requireControl(elID);

            var groupID = $dropdowntextlist.normalizeScalar(data.groupID, 'groupID', true);
            var key = $dropdowntextlist.normalizeScalar(data.key, 'key', false);
            var value = $dropdowntextlist.normalizeScalar(data.value, 'value', true);
            if (!['AND', 'OR'].includes(data.logic) || !$dropdowntextlist.hasProperty($dropdowntextlist.operators, data.operator)) {
                throw new TypeError('DropDownTextList: invalid logic or operator');
            }
            return {
                groupID: groupID,
                logic: data.logic,
                operator: data.operator,
                key: key,
                value: value
            };
        },

        fromCondition(elID, data) {
            var control = $dropdowntextlist.requireControl(elID);

            return $dropdowntextlist.normalize(control.id, {
                [control.settings.optgroupField]: data.groupID,
                [control.settings.valueField]: data.key,
                [control.settings.labelField]: data.value
            });
        },

        resolve(elID, value) {
            var control = $dropdowntextlist.requireControl(elID);

            if (value instanceof HTMLElement) {
                return value.dataset.value;
            }
            if (value && typeof value === 'object') {
                return $dropdowntextlist.getOptionID($dropdowntextlist.normalizeScalar(value.groupID, 'groupID', true), $dropdowntextlist.normalizeScalar(value.key, 'key', false));
            }
            var key = $dropdowntextlist.normalizeScalar(value, 'key', false);
            var matches = Object.keys(control.picker.options).filter(function (id) {
                return control.picker.options[id]._dttlKey === key;
            });
            if (matches.length > 1) {
                throw new Error('DropDownTextList: ambiguous key; use {groupID, key}');
            }
            return matches[0];
        },

        relay(elID, event, args) {
            var control = $dropdowntextlist.requireControl(elID);

            if (event === 'initialize' || event === 'destroy' || !control.ready || control.destroyed) {
                return;
            }
            if (event === 'change') {
                $dropdowntextlist.writeValue(control.id);
                args = [$dropdowntextlist.getValue(control.id)];
            }
            else if (event === 'item_add' || event === 'item_remove' || event === 'option_add' || event === 'option_remove') {
                if (event === 'item_remove') {
                    control.conditions.delete(args[0]);
                    $dropdowntextlist.closeEditor(control.id, false);
                }
                args = args.slice();
                args[0] = $dropdowntextlist.getOptionReference(args[0]);
                if (event === 'option_add') {
                    args[1] = Object.assign({}, args[1]._dttlRaw);
                }
            }
            else if (event === 'clear') {
                control.conditions.clear();
                $dropdowntextlist.closeEditor(control.id, false);
            }
            $dropdowntextlist.writeValue(control.id);
            $dropdowntextlist.trigger(control.id, event, ...args);
            if (event === 'focus' && control.settings.preload === 'focus' && !control.preloaded && control.destroyed !== true) {
                control.preloaded = true;
                $dropdowntextlist.load(control.id, '');
            }
        },

        writeValue(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            control.host.value = JSON.stringify($dropdowntextlist.getValue(control.id));
            // 선택하지 않은 후보와 변경한 표시명도 기반 select에 반영하여 sync()에 사용한다.
            Array.from(control.source.options).forEach(function (option) {
                if (!$dropdowntextlist.hasProperty(control.picker.options, option.value)) {
                    option.remove();
                }
            });
            var nodes = new Map(Array.from(control.source.options).map(function (option) {
                return [option.value, option];
            }));
            Object.keys(control.picker.options).forEach(function (id) {
                var data = control.picker.options[id];
                var option = nodes.get(id) || new Option(data._dttlLabel, id);
                option.text = data._dttlLabel;
                option.selected = control.picker.items.includes(id);
                if (!option.parentElement) {
                    control.source.add(option);
                }
                data.$option = option;
            });
            $dropdowntextlist.updateButtons(control.id);
        },

        notify(elID, before, silent) {
            var control = $dropdowntextlist.requireControl(elID);

            $dropdowntextlist.writeValue(control.id);
            if (!silent && before !== JSON.stringify($dropdowntextlist.getValue(control.id))) {
                control.picker.trigger('change', control.picker.getValue());
            }
        },

        cancelPending(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            control.revision++;
            control.loadSequence++;
            clearTimeout(control.loadTimer);
            control.picker.loading = 0;
            control.picker.wrapper.classList.remove(control.picker.settings.loadingClass);
            if (control.creating) {
                control.creating = false;
                if (!control.explicitLock && !control.picker.isDisabled) {
                    control.picker.unlock();
                }
            }
        },

        updateButtons(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            control.picker.control.querySelectorAll('button').forEach(function (button) {
                button.disabled = control.picker.isLocked || control.picker.isDisabled;
            });
            control.picker.control.querySelectorAll('.dttl-group').forEach(function (group) {
                var disabled = control.picker.isLocked || control.picker.isDisabled;
                group.tabIndex = disabled ? -1 : 0;
                group.setAttribute('aria-disabled', String(disabled));
            });
        },

        onTagClick(elID, event) {
            var control = $dropdowntextlist.requireControl(elID);

            var target = event.target.closest('.dttl-group,.dttl-edit,.dttl-remove');
            if (!target || !control.picker.control.contains(target)) {
                if (control.editor) {
                    $dropdowntextlist.closeEditor(elID, false);
                }
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (control.picker.isLocked || control.picker.isDisabled) {
                return;
            }
            var item = target.closest('[data-value]');
            if (target.classList.contains('dttl-remove')) {
                $dropdowntextlist.removeItem(control.id, item);
                $dropdowntextlist.focus(control.id);
            }
            else {
                $dropdowntextlist.editCondition(control.id, item);
            }
        },

        editCondition(elID, item) {
            var control = $dropdowntextlist.requireControl(elID);

            if (control.picker.isLocked || control.picker.isDisabled) {
                return;
            }
            $dropdowntextlist.closeEditor(control.id, false);
            var id = item.dataset.value;
            var current = control.conditions.get(id) || {
                logic: 'AND',
                operator: 'eq'
            };
            control.picker.close();
            var editor = document.createElement('div');
            editor.className = 'dttl-editor';
            editor.setAttribute('role', 'dialog');
            editor.setAttribute('aria-label', control.picker.options[id]._dttlLabel + ' 조건 편집');
            var field = function (label, values, value, colorAttribute) {
                var wrapper = document.createElement('label');
                wrapper.append(document.createTextNode(label));
                var select = document.createElement('select');
                Object.keys(values).forEach(function (key) {
                    var option = new Option(values[key], key);
                    option.setAttribute(colorAttribute, key);
                    select.add(option);
                });
                select.value = value;
                select.setAttribute(colorAttribute, value);
                select.addEventListener('change', function () {
                    select.setAttribute(colorAttribute, select.value);
                });
                wrapper.append(select);
                editor.append(wrapper);
                return select;
            };
            var logic = field('연결', {
                AND: 'AND',
                OR: 'OR'
            }, current.logic, 'data-dttl-logic');
            var operator = field('비교', $dropdowntextlist.operators, current.operator, 'data-dttl-operator');
            var apply = document.createElement('button');
            apply.type = 'button';
            apply.textContent = '적용';
            apply.className = 'dttl-apply';
            var cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.textContent = '취소';
            editor.append(apply, cancel);
            apply.addEventListener('click', function () {
                if (control.picker.isLocked || control.picker.isDisabled) {
                    return;
                }
                var before = JSON.stringify($dropdowntextlist.getValue(control.id));
                control.conditions.set(id, {
                    logic: logic.value,
                    operator: operator.value
                });
                $dropdowntextlist.refreshItems(control.id);
                $dropdowntextlist.closeEditor(control.id, true);
                $dropdowntextlist.notify(control.id, before, false);
            });
            cancel.addEventListener('click', function () {
                return $dropdowntextlist.closeEditor(control.id, true);
            });
            editor.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    $dropdowntextlist.closeEditor(control.id, true);
                }
                if (event.key === 'Tab') {
                    if (event.shiftKey && event.target === logic) {
                        event.preventDefault();
                        cancel.focus();
                    }
                    else if (!event.shiftKey && event.target === cancel) {
                        event.preventDefault();
                        logic.focus();
                    }
                }
            });
            control.editor = editor;
            control.editingID = id;
            control.container.append(editor);
            $dropdowntextlist.positionEditor(elID);
            logic.focus({ preventScroll: true });
            control.picker.clearActiveItems();
            control.picker.setActiveItemClass(item);
        },

        normalizeDropdownSize(value, name) {
            var defaultValue = 'auto';
            if (value == null || value === '') {
                return defaultValue;
            }
            if (value === defaultValue || (name === 'dropdownWidth' && value === '100%')) {
                return value;
            }
            if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
                return value + 'px';
            }
            if (typeof value === 'string' && /^\d+(?:\.\d+)?px$/.test(value) && parseFloat(value) > 0) {
                return value;
            }

            throw new TypeError('DropDownTextList: ' + name + ' must be ' + defaultValue +
                (name === 'dropdownWidth' ? ', 100%, or' : ' or') + ' a positive pixel value');
        },

        sizeDropdown(elID) {
            var control = $dropdowntextlist.requireControl(elID);
            var picker = control.picker;
            var dropdown = picker.dropdown;
            var content = picker.dropdown_content;
            var width = $dropdowntextlist.normalizeDropdownSize(control.settings.dropdownWidth, 'dropdownWidth');
            var height = $dropdowntextlist.normalizeDropdownSize(control.settings.dropdownHeight, 'dropdownHeight');

            // 기본 높이는 Tom Select의 최대 높이 정책을 그대로 사용한다.
            if (height === 'auto') {
                dropdown.style.height = '';
                content.style.height = '';
                content.style.maxHeight = '';
                content.style.boxSizing = '';
            }
            else {
                dropdown.style.height = height;
                content.style.height = '100%';
                content.style.maxHeight = 'none';
                content.style.boxSizing = 'border-box';
            }

            dropdown.style.maxWidth = '';
            dropdown.style.overflowWrap = '';
            if (width === '100%') {
                if (picker.settings.dropdownParent !== 'body') {
                    dropdown.style.width = '';
                }
            }
            else if (width === 'auto') {
                dropdown.style.width = 'max-content';
                dropdown.style.overflowWrap = 'anywhere';
                var left = picker.control.getBoundingClientRect().left;
                var availableWidth = Math.max(1, document.documentElement.clientWidth - Math.max(0, left) - 8);
                dropdown.style.maxWidth = availableWidth + 'px';
                if (dropdown.getClientRects().length > 0) {
                    var scrollbarWidth = content.offsetWidth - content.clientWidth;
                    dropdown.style.width = Math.min(availableWidth, Math.ceil(dropdown.getBoundingClientRect().width) + scrollbarWidth) + 'px';
                }
            }
            else {
                dropdown.style.width = width;
            }
        },

        positionEditor(elID) {
            var control = $dropdowntextlist.requireControl(elID);
            var editor = control.editor;
            if (!editor) {
                return;
            }

            var item = control.picker.getItem(control.editingID);
            if (!item) {
                $dropdowntextlist.closeEditor(elID, false);
                return;
            }

            var itemRect = item.getBoundingClientRect();
            var containerRect = control.container.getBoundingClientRect();
            var viewportWidth = document.documentElement.clientWidth;
            var viewportHeight = window.innerHeight;
            var padding = 8;
            var gap = 6;
            if (itemRect.bottom < 0 || itemRect.top > viewportHeight || itemRect.right < 0 || itemRect.left > viewportWidth) {
                $dropdowntextlist.closeEditor(elID, false);
                return;
            }

            // 태그 바로 아래를 우선 사용하고, 화면 가장자리에서는 위치와 높이를 조정한다.
            var spaceBelow = Math.max(0, viewportHeight - padding - itemRect.bottom - gap);
            var spaceAbove = Math.max(0, itemRect.top - padding - gap);
            editor.style.left = '0px';
            editor.style.top = '0px';
            editor.style.width = '';
            editor.style.maxWidth = Math.max(0, Math.min(control.container.clientWidth, viewportWidth - padding * 2)) + 'px';
            editor.style.maxHeight = Math.max(spaceBelow, spaceAbove) + 'px';
            editor.style.width = Math.ceil(editor.getBoundingClientRect().width) + 'px';
            var editorWidth = editor.offsetWidth;
            var editorHeight = editor.offsetHeight;
            var left = Math.max(padding, Math.min(itemRect.left, viewportWidth - padding - editorWidth));
            var top = itemRect.bottom + gap;
            if (editorHeight > spaceBelow && spaceAbove > spaceBelow) {
                top = itemRect.top - gap - editorHeight;
            }
            top = Math.max(padding, Math.min(top, viewportHeight - padding - editorHeight));
            editor.style.left = Math.round(left - containerRect.left - control.container.clientLeft + control.container.scrollLeft) + 'px';
            editor.style.top = Math.round(top - containerRect.top - control.container.clientTop + control.container.scrollTop) + 'px';
        },

        closeEditor(elID, restoreFocus) {
            var control = $dropdowntextlist.requireControl(elID);

            if (!control.editor) {
                return;
            }
            var id = control.editingID;
            control.editor.remove();
            control.editor = null;
            control.editingID = null;
            control.picker.clearActiveItems();
            if (restoreFocus) {
                var item = control.picker.getItem(id);
                var button = item ? item.querySelector('.dttl-edit') : null;
                if (button) {
                    item.classList.add('active', 'last-active');
                    control.picker.activeItems.push(item);
                    button.focus({ preventScroll: true });
                }
            }
        },

        setLocale() {}
    });

    syn.uicontrols.$dropdowntextlist = $dropdowntextlist;
})(window);
