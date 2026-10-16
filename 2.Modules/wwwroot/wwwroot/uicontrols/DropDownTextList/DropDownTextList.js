/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $dropdowntextlist = syn.uicontrols.$dropdowntextlist || new syn.module();

    $dropdowntextlist.extend({
        name: 'syn.uicontrols.$dropdowntextlist',
        version: 'v2026.10.15',
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
            dropdownWidth: '100%',
            dropdownHeight: 'auto',
            maxItems: null,
            hideSelected: true,
            clearAfterSelect: true,
            persist: true,
            create: false,
            defaultGroupID: '',
            groupDisplay: 'tooltip',
            groupNav: true,
            hideLogicBadge: true,
            load: null,
            loadThrottle: 200,
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
            neq: '다름',
            contains: '포함',
            not_contains: '미포함',
            lt: '작게',
            lte: '같거나작게',
            gt: '크게',
            gte: '같거나크게',
            begins_with: '시작함',
            ends_with: '끝남'
        }),
        // options에 없는 입력(일반 텍스트)이 사용하는 내부 전용 그룹. 후보 데이터에서는 사용할 수 없다.
        normalGroup: '__dttl_normal__',
        // optgroups의 range 옵션 값. 입력 형식은 서버 dbclient 필터의 Date/DateTime(yyyy-MM-dd, yyyy-MM)과 Time(HH:mm) 형식과 같다.
        ranges: Object.freeze({
            date: { label: '년월일', type: 'date', placeholder: 'yyyy-MM-dd', pattern: /^\d{4}-\d{2}-\d{2}$/ },
            month: { label: '년월', type: 'month', placeholder: 'yyyy-MM', pattern: /^\d{4}-\d{2}$/ },
            time: { label: '시간', type: 'time', placeholder: 'HH:mm', pattern: /^\d{2}:\d{2}$/ }
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
            option_change: 'onOptionChange',
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
            (setting.optgroups || []).forEach(function (group) {
                return $dropdowntextlist.checkRangeGroup(group);
            });
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

                getSummaryText(options) {
                    return $dropdowntextlist.getSummaryText(control.id, options);
                },

                getGroupConditions(list) {
                    return $dropdowntextlist.getGroupConditions(list);
                },

                getNormalText() {
                    return $dropdowntextlist.getNormalText(control.id);
                },

                setNormalText(items, silent) {
                    return $dropdowntextlist.setNormalText(control.id, items, silent);
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
                },

                setRange(groupID, start, end) {
                    return $dropdowntextlist.setRange(control.id, groupID, start, end);
                },

                getRange(groupID) {
                    return $dropdowntextlist.getRange(control.id, groupID);
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
            // AND/OR 배지를 숨기면(hideLogicBadge:true) 배지가 튀어나올 자리로 둔 태그 위쪽 여백과 줄 간격을 없앤다. 초기화 때 한 번만 정한다.
            control.container.className = 'syn-dropdowntextlist' + (setting.hideLogicBadge === false ? '' : ' dttl-hide-badge');
            control.container.style.width = setting.width;
            control.source = document.createElement('select');
            control.source.multiple = true;
            control.source.id = control.id + '_select';
            control.source.setAttribute('aria-label', setting.controlText || setting.placeholder);
            control.container.append(control.source);
            control.ranges = document.createElement('div');
            control.ranges.className = 'dttl-ranges';
            control.ranges.hidden = true;
            control.container.append(control.ranges);
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
                            operator: 'contains'
                        };
                        var normal = data._dttlGroup === $dropdowntextlist.normalGroup;
                        var group = control.picker && !normal ? control.picker.optgroups[data._dttlGroup] : null;
                        var groupLabel = normal ? $dropdowntextlist.getNormalParts(data).key || '텍스트' : group && group.label != null ? String(group.label) : data._dttlGroup || '기타';
                        var summary = (normal ? '일반 텍스트 · ' : '') + groupLabel + ' · ' + data._dttlLabel + ' · ' + condition.logic + ' · ' + $dropdowntextlist.operators[condition.operator];

                        // AND/OR 배지는 hideLogicBadge:false일 때만 만든다(기본값 true는 만들지 않는다).
                        var showBadge = setting.hideLogicBadge === false;
                        // 그룹 이름은 기본적으로(groupDisplay:'tooltip') 툴팁(title)으로만 보여주고 'inline'이면 태그 안에, 'badge'이면 AND/OR 배지 뒤에 보여준다.
                        // range 그룹의 태그는 groupDisplay 값과 관계없이 값만 보여준다. 'badge'는 배지를 숨기면(hideLogicBadge:true) 그룹 이름을 보여주지 않는다.
                        var isRange = !normal && $dropdowntextlist.getRangeKind(control.id, data._dttlGroup) !== '';
                        var normalKey = normal ? $dropdowntextlist.getNormalParts(data).key : '';
                        // 일반 텍스트의 key는 배지가 있으면 배지 뒤에 보여주고, 배지를 숨겼으면 후보의 그룹 이름처럼 groupDisplay:'inline'일 때만 그룹 이름 영역에 보여준다(key가 없으면 표시하지 않는다).
                        var hideGroup = normal ? showBadge || setting.groupDisplay !== 'inline' || !normalKey : setting.groupDisplay !== 'inline' || isRange;
                        // 배지는 AND/OR를 보여주며 뒤에 이어서 일반 텍스트는 key, groupDisplay:'badge'인 후보는 그룹 이름을 보여준다(없으면 AND/OR만).
                        // 그룹 ID가 비어 있는 후보와 range 태그는 이어 붙이지 않는다.
                        var badgeKey = !showBadge ? '' : normal ? normalKey : setting.groupDisplay === 'badge' && !isRange && data._dttlGroup ? groupLabel : '';
                        // 이어 붙인 텍스트가 길면 그 부분만 줄임표로 자르므로 태그가 배지 폭만큼 넓어지도록 최소 폭을 준다(최대 8.5rem).
                        var badge = showBadge ? '<span class="dttl-logic-badge" aria-hidden="true">' + condition.logic +
                            (badgeKey ? '<span class="dttl-badge-key"> · ' + escape(badgeKey) + '</span>' : '') + '</span>' : '';
                        var minWidth = badgeKey ? ' style="min-width:' + Math.min(136, Array.from(badgeKey).length * 9 + 34) + 'px"' : '';

                        return '<div class="dttl-item' + (normal ? ' dttl-normal' : '') + (hideGroup ? ' dttl-group-tooltip' : '') + '" data-dttl-logic="' + condition.logic + '" data-dttl-operator="' + condition.operator + '" title="' + escape(summary) + '"' + minWidth + '>' +
                            badge +
                            '<span class="dttl-group" role="button" tabindex="0" aria-label="' + escape(summary + ' 조건 편집') + '">' + escape(groupLabel) + '</span>' +
                            '<button type="button" class="dttl-edit" aria-label="' + escape(summary + ' 조건 편집') + '"><span class="dttl-label">' + escape(data._dttlLabel) + '</span></button>' +
                            '<button type="button" class="dttl-remove" aria-label="' + escape(data._dttlLabel + ' 삭제') + '">×</button></div>';
                    },
                    option: function (data, escape) {
                        return '<div>' + escape(data._dttlLabel) + '</div>';
                    },
                    option_create: function (data, escape) {
                        return '<div class="create">일반 텍스트 추가 <strong>' + escape(data.input) + '</strong>&hellip;</div>';
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
            // range 그룹의 등록·제거를 범위 버튼에 반영한다.
            ['addOptionGroup', 'removeOptionGroup', 'clearOptionGroups'].forEach(function (name) {
                var original = control.picker[name];
                control.picker[name] = function () {
                    if (name === 'addOptionGroup') {
                        $dropdowntextlist.checkRangeGroup(arguments[1]);
                    }
                    var result = original.apply(control.picker, arguments);
                    if (!control.destroyed) {
                        $dropdowntextlist.renderRanges(control.id);
                    }
                    return result;
                };
            });
            $dropdowntextlist.renderRanges(control.id);
            if (typeof ResizeObserver === 'function') {
                var rangeObserver = new ResizeObserver(function () {
                    if (!control.destroyed) {
                        $dropdowntextlist.layoutRanges(control.id);
                    }
                });
                rangeObserver.observe(control.container);
                control.cleanups.push(function () {
                    return rangeObserver.disconnect();
                });
            }
            $dropdowntextlist.listen(control.id, control.ranges, 'click', function (event) {
                var button = event.target.closest('.dttl-range-open');
                if (!button || !control.ranges.contains(button) || control.picker.isLocked || control.picker.isDisabled) {
                    return;
                }
                if (control.editor && control.editorAnchor === button) {
                    $dropdowntextlist.closeEditor(control.id, true);
                }
                else {
                    $dropdowntextlist.openRange(control.id, button.dataset.group, button);
                }
            });
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
                if (!control.destroyed) {
                    $dropdowntextlist.updateGroupNav(control.id);
                }
                if (control.picker.isOpen && !control.destroyed) {
                    $dropdowntextlist.sizeDropdown(control.id);
                }
                return result;
            };
            if (setting.groupNav !== false) {
                $dropdowntextlist.createGroupNav(control.id);
            }
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
                if (control.editor && !control.editor.contains(event.target) && !control.picker.control.contains(event.target) && !control.ranges.contains(event.target)) {
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
                return $dropdowntextlist.hasProperty(control.picker.options, id) && control.picker.options[id]._dttlGroup !== $dropdowntextlist.normalGroup;
            }).map(function (id) {
                var data = control.picker.options[id];
                var condition = control.conditions.get(id) || {
                    logic: 'AND',
                    operator: 'contains'
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

        // 현재 선택한 조건을 사용자에게 보여줄 한 줄 텍스트로 반환한다. 같은 그룹의 조건은 각 항목의 logic으로, 그룹 사이는 options.groupLogic으로 연결한다.
        // 예: (이름 같음 "홍길동" 또는 이름 포함 "김") 그리고 작성일 2026-10-01 ~ 2026-10-31
        // options: {groupLogic:'AND', logicLabels:{AND:'그리고', OR:'또는'}, includeNormalText:true, normalTextLabel:'텍스트', parentheses:true}
        getSummaryText(elID, options) {
            var control = $dropdowntextlist.requireControl(elID);

            options = options || {};
            var groupLogic = options.groupLogic == null ? 'AND' : options.groupLogic;
            if (!['AND', 'OR'].includes(groupLogic)) {
                throw new TypeError('DropDownTextList: groupLogic must be AND or OR');
            }
            var labels = Object.assign({
                AND: '그리고',
                OR: '또는'
            }, options.logicLabels);
            var includeNormalText = options.includeNormalText !== false;
            // key가 있는 일반 텍스트는 같은 이름의 후보 그룹과 구분되도록 값 앞에 이 문구를 붙인다. key가 없으면 그룹 이름 자리의 '텍스트'가 그 역할을 한다.
            var normalTextLabel = options.normalTextLabel == null ? '텍스트' : String(options.normalTextLabel);
            var parentheses = options.parentheses !== false;
            var quote = function (text) {
                return '"' + String(text).replace(/"/g, '\\"') + '"';
            };
            var groups = new Map();
            control.picker.items.forEach(function (id) {
                if (!$dropdowntextlist.hasProperty(control.picker.options, id)) {
                    return;
                }
                var item = $dropdowntextlist.getConditionItem(control.id, id);
                if (item.normal && !includeNormalText) {
                    return;
                }
                // 일반 텍스트는 key가 같은 것끼리, 후보와 범위는 groupID가 같은 것끼리 묶는다.
                var groupKey = item.normal ? 'n:' + item.key : 'g:' + item.groupID;
                var group = groups.get(groupKey);
                if (!group) {
                    var groupOption = item.normal ? null : control.picker.optgroups[item.groupID];
                    group = {
                        label: item.normal ? item.key || '텍스트' : groupOption && groupOption.label != null ? String(groupOption.label) : item.groupID || '기타',
                        entries: [],
                        range: null
                    };
                    groups.set(groupKey, group);
                }
                var side = item.normal ? '' : $dropdowntextlist.getRangeSide(control.id, id);
                if (side) {
                    // setRange로 만든 시작·끝 조건은 한 항목으로 합친다.
                    if (!group.range) {
                        group.range = {
                            logic: item.logic,
                            start: '',
                            end: ''
                        };
                        group.entries.push(group.range);
                    }
                    group.range[side] = /^(.+) (?:부터|까지)$/.exec(item.value)[1];
                    return;
                }
                group.entries.push({
                    logic: item.logic,
                    text: group.label + ' ' + $dropdowntextlist.operators[item.operator] + ' ' + (item.normal && item.key && normalTextLabel ? normalTextLabel + ' ' : '') + quote(item.value)
                });
            });
            var wrap = parentheses && groups.size > 1;
            return Array.from(groups.values()).map(function (group) {
                var text = group.entries.map(function (entry, index) {
                    var body = entry.text;
                    if (body === undefined) {
                        body = group.label + ' ' + (entry.start && entry.end ? entry.start + ' ~ ' + entry.end : entry.start ? entry.start + ' 부터' : entry.end + ' 까지');
                    }
                    return (index > 0 ? labels[entry.logic] + ' ' : '') + body;
                }).join(' ');
                return wrap && group.entries.length > 1 ? '(' + text + ')' : text;
            }).join(' ' + labels[groupLogic] + ' ');
        },

        // {operator, value, logic} 목록을 operator와 logic이 같은 것끼리 묶어 [{name, args, logic}]로 반환한다. 묶는 순서는 처음 나타난 순서이고 args는 value의 순서를 유지한다.
        // 예: getNormalText() 결과를 AUIGrid addMultiCondition 같은 다중 조건 형식으로 바꿀 때 사용한다. operator 이름은 변환하지 않는다.
        getGroupConditions(list) {
            var groups = new Map();

            list.forEach(function (item) {
                var groupKey = JSON.stringify([item.operator, item.logic]);
                if (!groups.has(groupKey)) {
                    groups.set(groupKey, {
                        name: item.operator,
                        args: [],
                        logic: item.logic
                    });
                }
                groups.get(groupKey).args.push(item.value);
            });

            return Array.from(groups.values());
        },

        // options에 없는 입력(일반 텍스트)만 선택한 순서대로 반환한다. getValue()에는 포함되지 않는다.
        getNormalText(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return control.picker.items.filter(function (id) {
                return $dropdowntextlist.hasProperty(control.picker.options, id) && control.picker.options[id]._dttlGroup === $dropdowntextlist.normalGroup;
            }).map(function (id) {
                var parts = $dropdowntextlist.getNormalParts(control.picker.options[id]);
                var condition = control.conditions.get(id) || {
                    logic: 'AND',
                    operator: 'contains'
                };
                return {
                    logic: condition.logic,
                    operator: condition.operator,
                    key: parts.key,
                    value: parts.value
                };
            });
        },

        // item_add·item_remove·option_change에 전달할 항목 하나의 정보를 반환한다. 일반 텍스트는 groupID 대신 normal: true를 가진다.
        // 조건 정보가 없으면 기본값 AND, contains를 사용하며 후보가 이미 제거된 경우 id에서 groupID와 key를 얻고 value는 생략한다.
        getConditionItem(elID, id) {
            var control = $dropdowntextlist.requireControl(elID);

            var data = control.picker.options[id];
            var reference = $dropdowntextlist.getOptionReference(id);
            var condition = control.conditions.get(id) || {
                logic: 'AND',
                operator: 'contains'
            };
            if (reference.groupID === $dropdowntextlist.normalGroup) {
                var parts = $dropdowntextlist.getNormalParts(data || { _dttlKey: reference.key });
                return {
                    normal: true,
                    logic: condition.logic,
                    operator: condition.operator,
                    key: parts.key,
                    value: parts.value
                };
            }
            var item = {
                groupID: reference.groupID,
                logic: condition.logic,
                operator: condition.operator,
                key: reference.key
            };
            if (data) {
                item.value = data._dttlLabel;
            }
            return item;
        },

        // 일반 텍스트 선택을 교체한다. 항목은 {logic?, operator?, key?, value} 객체이거나 `value` 또는 `key:value` 문자열이다.
        setNormalText(elID, items, silent = false) {
            var control = $dropdowntextlist.requireControl(elID);

            silent = silent === true;
            if (items == null) {
                items = [];
            }
            if (!Array.isArray(items)) {
                throw new TypeError('DropDownTextList: normal text must be an array');
            }
            var prepared = items.map(function (item) {
                var parts = typeof item === 'string' || typeof item === 'number' ? $dropdowntextlist.parseNormalText(item) : null;
                var logic = 'AND';
                var operator = 'contains';
                if (item && typeof item === 'object') {
                    var key = item.key == null ? '' : $dropdowntextlist.normalizeScalar(item.key, 'key', true).trim();
                    var value = $dropdowntextlist.normalizeScalar(item.value, 'value', false).trim();
                    parts = value === '' || key.indexOf('\u0000') >= 0 ? null : { key: key, value: value };
                    logic = item.logic == null ? logic : item.logic;
                    operator = item.operator == null ? operator : item.operator;
                    if (!['AND', 'OR'].includes(logic) || !$dropdowntextlist.hasProperty($dropdowntextlist.operators, operator)) {
                        throw new TypeError('DropDownTextList: invalid logic or operator');
                    }
                }
                if (!parts) {
                    throw new TypeError('DropDownTextList: invalid normal text');
                }
                return { option: $dropdowntextlist.normalOption(parts.key, parts.value), logic: logic, operator: operator };
            });
            var maxItems = control.picker.settings.maxItems;
            var others = control.picker.items.filter(function (id) {
                return !$dropdowntextlist.isNormalID(id);
            }).length;
            if (maxItems != null && others + prepared.length > maxItems) {
                throw new Error('DropDownTextList: maxItems exceeded');
            }

            var before = $dropdowntextlist.snapshot(control.id);
            $dropdowntextlist.cancelPending(control.id);
            $dropdowntextlist.closeEditor(control.id, false);
            $dropdowntextlist.clearItems(control.id, true);
            var ids = [];
            prepared.forEach(function (item) {
                var id = item.option._dttlID;
                if (ids.includes(id)) {
                    return;
                }
                ids.push(id);
                control.conditions.set(id, { logic: item.logic, operator: item.operator });
                if (!$dropdowntextlist.hasProperty(control.picker.options, id)) {
                    control.picker.addOption(item.option, true);
                }
            });
            control.picker.addItems(ids, true);
            $dropdowntextlist.refreshItems(control.id);
            control.picker.refreshOptions(false);
            $dropdowntextlist.notify(control.id, before, silent);
        },

        // getValue()와 getNormalText()를 함께 비교하여 일반 텍스트만 바뀌어도 변경으로 판단한다.
        snapshot(elID) {
            return JSON.stringify([$dropdowntextlist.getValue(elID), $dropdowntextlist.getNormalText(elID)]);
        },

        isNormalID(id) {
            var pair;
            try {
                pair = JSON.parse(id);
            } catch (error) {
                return false;
            }
            return Array.isArray(pair) && pair[0] === $dropdowntextlist.normalGroup;
        },

        // 입력 텍스트를 일반 텍스트로 해석한다. 첫 ':' 앞은 key, 뒤는 value이며 ':'가 없으면 value만 사용한다. value가 비면 null이다.
        parseNormalText(text) {
            text = String(text == null ? '' : text).trim();
            var index = text.indexOf(':');
            var key = index < 0 ? '' : text.slice(0, index).trim();
            var value = index < 0 ? text : text.slice(index + 1).trim();
            return value === '' ? null : { key: key, value: value };
        },

        // 내부 키는 key와 value를 NUL로 이어 붙인다. 입력 텍스트에는 NUL을 넣을 수 없으므로 같은 key·value만 같은 항목이 된다.
        getNormalParts(option) {
            var index = option._dttlKey.indexOf('\u0000');
            return { key: option._dttlKey.slice(0, index), value: option._dttlKey.slice(index + 1) };
        },

        normalOption(key, value) {
            if (key.indexOf('\u0000') >= 0) {
                throw new TypeError('DropDownTextList: invalid normal text');
            }
            var internal = key + '\u0000' + value;
            return {
                _dttlID: $dropdowntextlist.getOptionID($dropdowntextlist.normalGroup, internal),
                _dttlKey: internal,
                _dttlGroup: $dropdowntextlist.normalGroup,
                _dttlLabel: value,
                _dttlRaw: { normal: true, key: key, value: value }
            };
        },

        // 선택된 후보 중 일반 텍스트(normal=true) 또는 일반 후보(normal=false)만 조용히 해제한다.
        clearItems(elID, normal) {
            var control = $dropdowntextlist.requireControl(elID);

            var targets = control.picker.items.filter(function (id) {
                return $dropdowntextlist.isNormalID(id) === normal;
            });
            if (targets.length === control.picker.items.length) {
                control.picker.clear(true);
                control.conditions.clear();
                return;
            }
            targets.forEach(function (id) {
                control.picker.removeItem(id, true);
                control.conditions.delete(id);
            });
        },

        // 입력이 일반 후보의 키 또는 표시값과 정확히 같으면 그 후보 ID를 반환한다. 여러 개면 아직 선택하지 않은 첫 후보를 우선한다.
        findOptionByText(elID, text) {
            var control = $dropdowntextlist.requireControl(elID);

            var ids = Object.keys(control.picker.options).filter(function (id) {
                var option = control.picker.options[id];
                return option._dttlGroup !== $dropdowntextlist.normalGroup && (option._dttlKey === text || option._dttlLabel === text) && !$dropdowntextlist.getRangeSide(control.id, id);
            });
            return ids.find(function (id) {
                return !control.picker.items.includes(id);
            }) || ids[0] || '';
        },

        setValue(elID, value, silent = false) {
            var control = $dropdowntextlist.requireControl(elID);

            // 거래 setter의 세 번째 인자는 메타데이터일 수 있으므로 true일 때만 change를 생략한다.
            silent = silent === true;
            var values = Array.isArray(value) ? value : [value];
            var kind = values.length ? $dropdowntextlist.getValueType(values[0], control.settings) : 'key';
            if (values.some(function (item) {
                return $dropdowntextlist.getValueType(item, control.settings) !== kind;
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

            var before = $dropdowntextlist.snapshot(control.id);
            var userOptions = Object.assign({}, control.picker.userOptions);
            $dropdowntextlist.cancelPending(control.id);
            $dropdowntextlist.closeEditor(control.id, false);
            if (kind === 'option') {
                var incoming = new Map(prepared.map(function (data) {
                    return [data._dttlID, data];
                }));
                Object.keys(control.picker.options).forEach(function (id) {
                    // 일반 텍스트는 후보 데이터가 아니므로 후보를 교체해도 유지한다.
                    if (!incoming.has(id) && !$dropdowntextlist.isNormalID(id)) {
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
                // 일반 텍스트 선택은 setNormalText로 따로 교체하므로 일반 후보만 해제한다.
                $dropdowntextlist.clearItems(control.id, false);
                $dropdowntextlist.purgeRangeOptions(control.id);
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
            if ($dropdowntextlist.isNormalID(id)) {
                throw new Error('DropDownTextList: normal text cannot be updated; use setNormalText');
            }
            if (id !== option._dttlID && $dropdowntextlist.hasProperty(control.picker.options, option._dttlID)) {
                throw new Error('DropDownTextList: duplicate groupID + key');
            }
            var before = $dropdowntextlist.snapshot(control.id);
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
            else if (control.settings.create && (typeof value === 'string' || typeof value === 'number')) {
                // 후보에 없는 텍스트는 createItem과 같은 규칙으로 일반 텍스트가 된다. 잠금 상태에서도 코드로는 추가할 수 있다.
                $dropdowntextlist.createItem(control.id, String(value), undefined, { silent: silent === true, force: true });
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

        // 후보에 없는 입력은 모두 일반 텍스트가 된다. 입력이 후보의 키·표시값과 같으면 그 후보를 선택한다.
        // internal: addItem이 사용하는 { silent, force }. force는 잠금 상태 검사를 건너뛰고 입력창을 지우지 않는다.
        createItem(elID, value, callback, internal) {
            var control = $dropdowntextlist.requireControl(elID);

            internal = internal || {};
            value = (value == null ? control.picker.control_input.value : String(value)).trim();
            if (!value || !control.settings.create || control.destroyed || (!internal.force && control.picker.isLocked) || !control.picker.canCreate(value)) {
                if (callback) {
                    callback();
                }
                return false;
            }
            var existing = $dropdowntextlist.findOptionByText(control.id, value);
            if (existing) {
                var existingData = Object.assign({}, control.picker.options[existing]._dttlRaw);
                control.picker.addItem(existing, internal.silent === true);
                if (!internal.force) {
                    control.picker.setTextboxValue('');
                }
                if (callback) {
                    callback(existingData);
                }
                return true;
            }
            var revision = control.revision;
            var caret = control.picker.caretPos;
            control.creating = true;
            control.picker.lock();
            var completed = false;
            var done = function (parts) {
                if (completed || control.destroyed || revision !== control.revision) {
                    return;
                }
                completed = true;
                control.creating = false;
                if (!control.explicitLock && !control.picker.isDisabled) {
                    control.picker.unlock();
                }
                if (!parts) {
                    if (callback) {
                        callback();
                    }
                    return;
                }
                var option;
                try {
                    option = $dropdowntextlist.normalOption(parts.key, parts.value);
                } catch (error) {
                    console.warn(error);
                    if (callback) {
                        callback();
                    }
                    return;
                }
                if (!$dropdowntextlist.hasProperty(control.picker.options, option._dttlID)) {
                    control.picker.addOption(option, true);
                }
                control.picker.setCaret(caret);
                control.picker.addItem(option._dttlID, internal.silent === true);
                if (!internal.force) {
                    control.picker.setTextboxValue('');
                }
                if (callback) {
                    callback({ logic: 'AND', operator: 'contains', key: parts.key, value: parts.value });
                }
            };
            try {
                if (typeof control.settings.create === 'function') {
                    // 함수가 돌려준 데이터는 그룹을 무시하고 valueField를 key, labelField를 value로 사용한다.
                    var finish = function (data) {
                        done($dropdowntextlist.fromCreateResult(control.id, data));
                    };
                    var result = control.settings.create.call(control, value, finish);
                    if (result && typeof result.then === 'function') {
                        result.then(finish, function (error) {
                            console.warn(error);
                            done();
                        });
                    }
                    else if (result !== undefined) {
                        finish(result);
                    }
                }
                else {
                    done($dropdowntextlist.parseNormalText(value));
                }
            } catch (error) {
                console.warn(error);
                done();
            }
            return true;
        },

        // create 함수가 돌려준 데이터를 일반 텍스트의 key·value로 바꾼다. labelField가 없거나 valueField와 같으면 key 없이 value만 사용한다.
        fromCreateResult(elID, data) {
            var control = $dropdowntextlist.requireControl(elID);

            if (!data || typeof data !== 'object') {
                return null;
            }
            var raw = data[control.settings.valueField];
            var label = data[control.settings.labelField];
            var key = raw == null ? '' : String(raw).trim();
            var value = label == null ? key : String(label).trim();
            if (value === '') {
                return null;
            }
            return { key: label == null || key === value ? '' : key, value: value };
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

            var before = $dropdowntextlist.snapshot(control.id);
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
            // 해제 과정에서 정리된 범위·일반 텍스트 후보를 선택 항목으로 되살린다.
            records.forEach(function (record) {
                if (record.selected && !$dropdowntextlist.hasProperty(control.picker.options, record.data._dttlID)) {
                    control.picker.addOption(record.data, true);
                }
            });
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

        // 조건 객체는 groupID와 key가 있고 logic·operator는 생략할 수 있다. 다만 후보 스키마가 groupID·key 필드명을 쓰는 컨트롤(optgroupField:'groupID' 또는
        // valueField:'key')에서는 후보와 구분할 수 없으므로 logic 또는 operator가 있을 때만 조건 객체로 본다.
        getValueType(value, settings) {
            var result = 'option';
            if (typeof value === 'string' || typeof value === 'number') {
                result = 'key';
            }
            else if (value && typeof value === 'object') {
                var hasCore = ['groupID', 'key'].every(function (key) {
                    return $dropdowntextlist.hasProperty(value, key);
                });
                var explicit = ['logic', 'operator'].some(function (key) {
                    return $dropdowntextlist.hasProperty(value, key);
                });
                var collision = !!settings && (settings.optgroupField === 'groupID' || settings.valueField === 'key');
                if (hasCore && (explicit || !collision)) {
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
            if (groupID === $dropdowntextlist.normalGroup) {
                // 일반 텍스트 전용 그룹은 내부 키(key NUL value)로만 만들 수 있다. 표시값은 내부 키의 value를 사용한다.
                if (key.indexOf('\u0000') < 0) {
                    throw new TypeError('DropDownTextList: reserved groupID: ' + groupID);
                }
                value = $dropdowntextlist.getNormalParts({ _dttlKey: key }).value;
            }
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
            // logic, operator를 생략하면 AND, contains를 사용한다.
            var logic = data.logic == null ? 'AND' : data.logic;
            var operator = data.operator == null ? 'contains' : data.operator;
            if (!['AND', 'OR'].includes(logic) || !$dropdowntextlist.hasProperty($dropdowntextlist.operators, operator)) {
                throw new TypeError('DropDownTextList: invalid logic or operator');
            }
            return {
                groupID: groupID,
                logic: logic,
                operator: operator,
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
                args = [$dropdowntextlist.getValue(control.id), $dropdowntextlist.getNormalText(control.id)];
            }
            else if (event === 'item_add' || event === 'item_remove' || event === 'option_add' || event === 'option_remove') {
                var id = args[0];
                // 조건은 제거·정리 전에 읽는다. 일반 텍스트의 option 이벤트도 logic, operator 기본값을 포함한다.
                var conditionItem = event === 'item_add' || event === 'item_remove' || $dropdowntextlist.isNormalID(id) ? $dropdowntextlist.getConditionItem(control.id, id) : null;
                if (event === 'item_remove') {
                    $dropdowntextlist.closeEditor(control.id, false);
                    // 범위 입력과 일반 텍스트로 만든 후보는 해제 후 후보 목록에 남기지 않는다.
                    // 이때 발생하는 option_remove가 조건을 읽을 수 있도록 조건은 정리한 뒤에 지운다.
                    if (($dropdowntextlist.getRangeSide(control.id, args[0]) || $dropdowntextlist.isNormalID(args[0])) && $dropdowntextlist.hasProperty(control.picker.options, args[0])) {
                        control.picker.removeOption(args[0], true);
                    }
                    control.conditions.delete(args[0]);
                }
                args = args.slice();
                args[0] = $dropdowntextlist.getOptionReference(args[0]);
                if (conditionItem) {
                    // 일반 텍스트의 내부 식별자는 노출하지 않고 {normal, logic, operator, key, value}로 전달한다.
                    args[0] = conditionItem;
                    if (event === 'option_add' && conditionItem.normal) {
                        args[1] = Object.assign({}, conditionItem);
                    }
                }
                if (event === 'option_add' && !conditionItem) {
                    args[1] = Object.assign({}, args[1]._dttlRaw);
                }
            }
            else if (event === 'clear') {
                control.conditions.clear();
                $dropdowntextlist.closeEditor(control.id, false);
                $dropdowntextlist.purgeRangeOptions(control.id);
                $dropdowntextlist.purgeNormalOptions(control.id);
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
            if (!silent && before !== $dropdowntextlist.snapshot(control.id)) {
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
            if (control.ranges) {
                control.ranges.querySelectorAll('button').forEach(function (button) {
                    var range = $dropdowntextlist.getRange(control.id, button.dataset.group);
                    var active = range.start !== '' || range.end !== '';
                    button.disabled = control.picker.isLocked || control.picker.isDisabled;
                    button.classList.toggle('dttl-range-active', active);
                    button.setAttribute('aria-pressed', String(active));
                });
            }
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
            var id = item.dataset.value;
            // 범위 입력으로 만든 시작·끝 조건은 시작과 끝을 함께 편집한다.
            if ($dropdowntextlist.getRangeSide(control.id, id)) {
                return $dropdowntextlist.openRange(control.id, $dropdowntextlist.getOptionReference(id).groupID, item);
            }
            $dropdowntextlist.closeEditor(control.id, false);
            var current = control.conditions.get(id) || {
                logic: 'AND',
                operator: 'contains'
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
            // 적용·취소는 Tabler btn-group으로 묶는다. 높이는 CSS에서 콤보박스와 같게 맞춘다.
            var buttons = document.createElement('div');
            buttons.className = 'btn-group';
            buttons.setAttribute('role', 'group');
            var apply = document.createElement('button');
            apply.type = 'button';
            apply.textContent = '적용';
            apply.className = 'btn btn-primary dttl-apply';
            var cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.textContent = '취소';
            cancel.className = 'btn';
            buttons.append(apply, cancel);
            editor.append(buttons);
            apply.addEventListener('click', function () {
                if (control.picker.isLocked || control.picker.isDisabled) {
                    return;
                }
                var before = $dropdowntextlist.snapshot(control.id);
                var previous = {
                    logic: current.logic,
                    operator: current.operator
                };
                control.conditions.set(id, {
                    logic: logic.value,
                    operator: operator.value
                });
                $dropdowntextlist.refreshItems(control.id);
                $dropdowntextlist.closeEditor(control.id, true);
                $dropdowntextlist.notify(control.id, before, false);
                // change 다음에 변경된 항목 하나만 option_change로 전달한다.
                if (!control.destroyed && (previous.logic !== logic.value || previous.operator !== operator.value) && $dropdowntextlist.hasProperty(control.picker.options, id)) {
                    $dropdowntextlist.trigger(control.id, 'option_change', $dropdowntextlist.getConditionItem(control.id, id), previous);
                }
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
            // 너비 기본값은 컨트롤 폭('100%'), 높이 기본값은 내용에 맞춤('auto')이다.
            var defaultValue = name === 'dropdownWidth' ? '100%' : 'auto';
            if (value == null || value === '') {
                return defaultValue;
            }
            if (value === 'auto' || (name === 'dropdownWidth' && value === '100%')) {
                return value;
            }
            if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
                return value + 'px';
            }
            if (typeof value === 'string' && /^\d+(?:\.\d+)?px$/.test(value) && parseFloat(value) > 0) {
                return value;
            }

            throw new TypeError('DropDownTextList: ' + name + ' must be auto' +
                (name === 'dropdownWidth' ? ', 100%, or' : ' or') + ' a positive pixel value');
        },

        // 드롭다운 목록 위쪽에 optgroup으로 바로 이동하는 버튼 그룹을 만든다. 보이는 그룹이 둘 이상일 때만 표시한다(groupNav:false이면 만들지 않는다).
        createGroupNav(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            var nav = document.createElement('div');
            nav.className = 'dttl-group-nav';
            nav.setAttribute('role', 'group');
            nav.setAttribute('aria-label', '그룹 이동');
            nav.hidden = true;
            control.nav = nav;
            control.navSignature = '';
            control.navActive = '';
            control.navUntil = 0;
            control.picker.dropdown.insertBefore(nav, control.picker.dropdown_content);
            // 버튼을 눌러도 입력 영역의 포커스를 유지하여 드롭다운이 닫히지 않게 한다.
            $dropdowntextlist.listen(control.id, nav, 'mousedown', function (event) {
                event.preventDefault();
            });
            $dropdowntextlist.listen(control.id, nav, 'click', function (event) {
                var button = event.target.closest('button[data-group]');
                if (button && nav.contains(button)) {
                    $dropdowntextlist.scrollToGroup(control.id, button.dataset.group);
                }
            });
            var frame = 0;
            $dropdowntextlist.listen(control.id, control.picker.dropdown_content, 'scroll', function () {
                if (frame || Date.now() < control.navUntil) {
                    return;
                }
                frame = requestAnimationFrame(function () {
                    frame = 0;
                    if (!control.destroyed) {
                        $dropdowntextlist.syncGroupNav(control.id);
                    }
                });
            });
            control.cleanups.push(function () {
                if (frame) {
                    cancelAnimationFrame(frame);
                }
            });
        },

        // 현재 목록에 그려진 optgroup(헤더가 있는 것)을 반환한다. 범위 그룹처럼 후보가 없는 그룹은 포함되지 않는다.
        getRenderedGroups(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            return Array.from(control.picker.dropdown_content.querySelectorAll('.optgroup[data-group]')).filter(function (group) {
                return group.querySelector('.optgroup-header') !== null;
            });
        },

        updateGroupNav(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            if (!control.nav) {
                return;
            }
            var groups = $dropdowntextlist.getRenderedGroups(control.id);
            var signature = groups.map(function (group) {
                return group.dataset.group + '\u0000' + group.querySelector('.optgroup-header').textContent;
            }).join('\u0001');
            var visible = groups.length >= 2;
            if (signature !== control.navSignature) {
                control.navSignature = signature;
                control.navActive = '';
                control.nav.textContent = '';
                var buttons = document.createElement('div');
                buttons.className = 'btn-group';
                buttons.setAttribute('role', 'group');
                groups.forEach(function (group) {
                    var button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'btn btn-sm';
                    button.tabIndex = -1;
                    button.dataset.group = group.dataset.group;
                    button.textContent = group.querySelector('.optgroup-header').textContent;
                    buttons.append(button);
                });
                control.nav.append(buttons);
            }
            control.nav.hidden = !visible;
            control.picker.dropdown.classList.toggle('dttl-has-nav', visible);
            if (visible) {
                $dropdowntextlist.syncGroupNav(control.id);
            }
        },

        // 상단에 닿은 헤더의 그룹 버튼을 활성으로 표시한다.
        syncGroupNav(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            if (!control.nav || control.nav.hidden) {
                return;
            }
            var content = control.picker.dropdown_content;
            var groups = $dropdowntextlist.getRenderedGroups(control.id);
            var active = groups.length ? groups[0].dataset.group : '';
            groups.forEach(function (group) {
                if ($dropdowntextlist.getGroupScrollTop(content, group) <= content.scrollTop + 1) {
                    active = group.dataset.group;
                }
            });
            // 끝까지 스크롤하면 짧은 마지막 그룹도 활성으로 표시한다.
            if (groups.length && content.scrollHeight > content.clientHeight && content.scrollTop + content.clientHeight >= content.scrollHeight - 1) {
                active = groups[groups.length - 1].dataset.group;
            }
            $dropdowntextlist.setGroupNavActive(control.id, active);
        },

        setGroupNavActive(elID, groupID) {
            var control = $dropdowntextlist.requireControl(elID);

            if (!control.nav || control.navActive === groupID) {
                return;
            }
            control.navActive = groupID;
            Array.from(control.nav.querySelectorAll('button[data-group]')).forEach(function (button) {
                var active = button.dataset.group === groupID;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', String(active));
                if (active) {
                    var left = button.offsetLeft;
                    var right = left + button.offsetWidth;
                    if (left < control.nav.scrollLeft) {
                        control.nav.scrollLeft = left;
                    }
                    else if (right > control.nav.scrollLeft + control.nav.clientWidth) {
                        control.nav.scrollLeft = right - control.nav.clientWidth;
                    }
                }
            });
        },

        // 그룹 헤더가 목록 상단(고정 위치)에 닿는 scrollTop을 반환한다. 헤더는 sticky여서 위치가 바뀌므로 optgroup 위쪽의 구분선 높이는
        // 첫 옵션의 위치에서 헤더 높이를 빼서 구한다.
        getGroupScrollTop(content, group) {
            var groupTop = group.getBoundingClientRect().top;
            var header = group.querySelector('.optgroup-header');
            var option = group.querySelector('.option');
            var offset = header && option ? Math.max(0, option.getBoundingClientRect().top - groupTop - header.getBoundingClientRect().height) : 0;
            return groupTop - content.getBoundingClientRect().top + content.scrollTop + offset;
        },

        scrollToGroup(elID, groupID) {
            var control = $dropdowntextlist.requireControl(elID);

            var group = $dropdowntextlist.getRenderedGroups(control.id).find(function (item) {
                return item.dataset.group === String(groupID);
            });
            if (!group) {
                return;
            }
            var content = control.picker.dropdown_content;
            // 이동하는 동안에는 스크롤 이벤트로 활성 버튼을 다시 계산하지 않는다.
            control.navUntil = Date.now() + 700;
            $dropdowntextlist.setGroupNavActive(control.id, String(groupID));
            content.scrollTo({
                top: $dropdowntextlist.getGroupScrollTop(content, group),
                behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
            window.setTimeout(function () {
                if (!control.destroyed) {
                    $dropdowntextlist.syncGroupNav(control.id);
                }
            }, 750);
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
                content.style.height = control.nav && !control.nav.hidden ? 'calc(100% - ' + control.nav.offsetHeight + 'px)' : '100%';
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

            var item = control.editorAnchor || control.picker.getItem(control.editingID);
            if (!item || !item.isConnected) {
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
            var focusTarget = control.editorFocus;
            control.editor.remove();
            control.editor = null;
            control.editingID = null;
            control.editorAnchor = null;
            control.editorFocus = null;
            control.picker.clearActiveItems();
            if (restoreFocus && focusTarget && focusTarget.isConnected) {
                focusTarget.focus({ preventScroll: true });
            }
            else if (restoreFocus) {
                var item = control.picker.getItem(id);
                var button = item ? item.querySelector('.dttl-edit') : null;
                if (button) {
                    item.classList.add('active', 'last-active');
                    control.picker.activeItems.push(item);
                    button.focus({ preventScroll: true });
                }
            }
        },

        checkRangeGroup(group) {
            if (!group || group.range == null || group.range === '') {
                return;
            }
            if (!$dropdowntextlist.hasProperty($dropdowntextlist.ranges, group.range)) {
                throw new TypeError('DropDownTextList: range must be date, month or time');
            }
            var min = $dropdowntextlist.parseRangeValue(group.range, group.min);
            var max = $dropdowntextlist.parseRangeValue(group.range, group.max);
            if (min && max && min > max) {
                throw new TypeError('DropDownTextList: min must not be later than max');
            }
        },

        // 그룹의 min·max 옵션. 지정하지 않으면 제한이 없다(빈 문자열).
        getRangeLimit(elID, groupID) {
            var control = $dropdowntextlist.requireControl(elID);

            var group = control.picker.optgroups[groupID];
            var kind = $dropdowntextlist.getRangeKind(control.id, groupID);
            return {
                min: kind ? $dropdowntextlist.parseRangeValue(kind, group.min) : '',
                max: kind ? $dropdowntextlist.parseRangeValue(kind, group.max) : ''
            };
        },

        // 범위 편집창의 기본값으로 사용할 현재 날짜·월·시각(브라우저 로컬 시간)
        getRangeNow(kind, limits) {
            var pad = $dropdowntextlist.pad;
            var now = new Date();
            var date = pad(now.getFullYear(), 4) + '-' + pad(now.getMonth() + 1, 2);
            var value = kind === 'time' ? pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2) : kind === 'month' ? date : date + '-' + pad(now.getDate(), 2);
            if (limits.min && value < limits.min) {
                value = limits.min;
            }
            if (limits.max && value > limits.max) {
                value = limits.max;
            }
            return value;
        },

        rangeError(message, userMessage) {
            var error = new TypeError('DropDownTextList: ' + message);
            error.userMessage = userMessage;
            return error;
        },

        daysInMonth(year, month) {
            var leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
            return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
        },

        pad(value, length) {
            return String(value).padStart(length, '0');
        },

        // 범위 입력은 optgroups의 range('date'|'month'|'time')가 지정된 그룹에서만 사용한다. 지정하지 않은 그룹은 빈 문자열이다.
        getRangeKind(elID, groupID) {
            var control = $dropdowntextlist.requireControl(elID);

            var group = control.picker ? control.picker.optgroups[groupID] : null;
            return group && $dropdowntextlist.hasProperty($dropdowntextlist.ranges, group.range) ? group.range : '';
        },

        // setRange로 만든 조건이면 'start'(gte) 또는 'end'(lt, lte)를 반환한다. 표시명의 '부터'·'까지' 접미사와 연산자로 판단한다.
        getRangeSide(elID, id) {
            var control = $dropdowntextlist.requireControl(elID);

            var option = control.picker ? control.picker.options[id] : null;
            if (!option) {
                return '';
            }
            var kind = $dropdowntextlist.getRangeKind(control.id, option._dttlGroup);
            var match = kind ? /^(.+) (부터|까지)$/.exec(option._dttlLabel) : null;
            if (!match || !$dropdowntextlist.ranges[kind].pattern.test(match[1])) {
                return '';
            }
            var side = match[2] === '부터' ? 'start' : 'end';
            var condition = control.conditions.get(id);
            if (condition && (side === 'start' ? condition.operator !== 'gte' : condition.operator !== 'lt' && condition.operator !== 'lte')) {
                return '';
            }
            return side;
        },

        parseRangeValue(kind, text) {
            var spec = $dropdowntextlist.ranges[kind];
            text = text == null ? '' : String(text).trim();
            if (text === '') {
                return '';
            }
            var valid = spec.pattern.test(text);
            if (valid) {
                var parts = text.split(/[-:]/).map(Number);
                if (kind === 'time') {
                    valid = parts[0] <= 23 && parts[1] <= 59;
                }
                else {
                    valid = parts[0] >= 1 && parts[1] >= 1 && parts[1] <= 12;
                    if (valid && kind === 'date') {
                        valid = parts[2] >= 1 && parts[2] <= $dropdowntextlist.daysInMonth(parts[0], parts[1]);
                    }
                }
            }
            if (!valid) {
                throw $dropdowntextlist.rangeError('invalid ' + kind + ' value: ' + text, spec.label + ' 형식이 올바르지 않습니다. (' + spec.placeholder + ')');
            }
            return text;
        },

        // 끝 값은 서버의 lt 비교에 맞춰 입력한 끝의 다음 날·다음 달·다음 분으로 변환한다. 23:59만 lte로 보낸다.
        rangeEnd(kind, text) {
            var pad = $dropdowntextlist.pad;
            var parts = text.split(/[-:]/).map(Number);
            var overflow = $dropdowntextlist.rangeError('range end is too large: ' + text, '끝 값이 지원 범위를 벗어났습니다.');
            if (kind === 'time') {
                if (parts[0] === 23 && parts[1] === 59) {
                    return { operator: 'lte', key: '23:59:59.9999999' };
                }
                var minutes = parts[0] * 60 + parts[1] + 1;
                return { operator: 'lt', key: pad(Math.floor(minutes / 60), 2) + ':' + pad(minutes % 60, 2) };
            }
            var year = parts[0];
            var month = parts[1];
            if (kind === 'month') {
                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
                if (year > 9999) {
                    throw overflow;
                }
                return { operator: 'lt', key: pad(year, 4) + '-' + pad(month, 2) };
            }
            var day = parts[2] + 1;
            if (day > $dropdowntextlist.daysInMonth(year, month)) {
                day = 1;
                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
            }
            if (year > 9999) {
                throw overflow;
            }
            return { operator: 'lt', key: pad(year, 4) + '-' + pad(month, 2) + '-' + pad(day, 2) };
        },

        buildRange(kind, start, end, limits) {
            limits = limits || { min: '', max: '' };
            start = $dropdowntextlist.parseRangeValue(kind, start);
            end = $dropdowntextlist.parseRangeValue(kind, end);
            if (start && end && start > end) {
                throw $dropdowntextlist.rangeError('range start must not be later than end', '시작은 끝보다 늦을 수 없습니다.');
            }
            [start, end].forEach(function (value) {
                if (value && ((limits.min && value < limits.min) || (limits.max && value > limits.max))) {
                    throw $dropdowntextlist.rangeError('range is out of min/max: ' + value, $dropdowntextlist.ranges[kind].label + ' 범위는 ' +
                        (limits.min || '제한 없음') + ' ~ ' + (limits.max || '제한 없음') + ' 사이여야 합니다.');
                }
            });
            var result = [];
            if (start) {
                result.push({ operator: 'gte', key: start, value: start + ' 부터' });
            }
            if (end) {
                result.push(Object.assign($dropdowntextlist.rangeEnd(kind, end), { value: end + ' 까지' }));
            }
            return result;
        },

        // 그룹에 선택된 범위 조건에서 사용자가 입력한 시작·끝 값을 반환한다. 없으면 빈 문자열이다.
        getRange(elID, groupID) {
            var control = $dropdowntextlist.requireControl(elID);

            var result = { start: '', end: '' };
            control.picker.items.forEach(function (id) {
                var side = $dropdowntextlist.getRangeSide(control.id, id);
                if (side && control.picker.options[id]._dttlGroup === groupID) {
                    result[side] = control.picker.options[id]._dttlLabel.replace(/ (부터|까지)$/, '');
                }
            });
            return result;
        },

        // 시작은 gte, 끝은 lt(23:59는 lte) 조건으로 선택하고 기존 범위 조건은 교체한다. 둘 다 비우면 범위를 해제한다.
        setRange(elID, groupID, start, end) {
            var control = $dropdowntextlist.requireControl(elID);

            groupID = String(groupID);
            var kind = $dropdowntextlist.getRangeKind(control.id, groupID);
            if (!kind) {
                throw new Error('DropDownTextList: not a range group: ' + groupID);
            }
            var conditions = $dropdowntextlist.buildRange(kind, start, end, $dropdowntextlist.getRangeLimit(control.id, groupID));
            var previous = control.picker.items.filter(function (id) {
                return $dropdowntextlist.getRangeSide(control.id, id) && control.picker.options[id]._dttlGroup === groupID;
            });
            var maxItems = control.picker.settings.maxItems;
            if (maxItems != null && control.picker.items.length - previous.length + conditions.length > maxItems) {
                throw new Error('DropDownTextList: maxItems exceeded');
            }

            var before = $dropdowntextlist.snapshot(control.id);
            $dropdowntextlist.cancelPending(control.id);
            $dropdowntextlist.closeEditor(control.id, false);
            previous.forEach(function (id) {
                // item_remove 처리에서 조건과 범위 후보도 함께 제거한다.
                control.picker.removeItem(id, true);
            });
            var ids = conditions.map(function (condition) {
                var id = $dropdowntextlist.getOptionID(groupID, condition.key);
                var option = $dropdowntextlist.fromCondition(control.id, {
                    groupID: groupID,
                    key: condition.key,
                    value: condition.value
                });
                if ($dropdowntextlist.hasProperty(control.picker.options, id)) {
                    control.picker.updateOption(id, option);
                }
                else {
                    control.picker.addOption(option, true);
                }
                control.conditions.set(id, {
                    logic: 'AND',
                    operator: condition.operator
                });
                return id;
            });
            control.picker.addItems(ids, true);
            $dropdowntextlist.refreshItems(control.id);
            control.picker.refreshOptions(false);
            $dropdowntextlist.notify(control.id, before, false);
        },

        // 선택되지 않은 범위 후보를 제거하여 일반 후보 목록에 노출되지 않게 한다.
        purgeRangeOptions(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            Object.keys(control.picker.options).forEach(function (id) {
                if (!control.picker.items.includes(id) && $dropdowntextlist.getRangeSide(control.id, id)) {
                    control.picker.removeOption(id, true);
                }
            });
        },

        // 선택되지 않은 일반 텍스트 후보를 제거한다. 일반 텍스트는 후보 목록에 남지 않는다.
        purgeNormalOptions(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            Object.keys(control.picker.options).forEach(function (id) {
                if (!control.picker.items.includes(id) && $dropdowntextlist.isNormalID(id)) {
                    control.picker.removeOption(id, true);
                }
            });
        },

        renderRanges(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            var count = 0;
            control.ranges.textContent = '';
            Object.keys(control.picker.optgroups).forEach(function (groupID) {
                var kind = $dropdowntextlist.getRangeKind(control.id, groupID);
                if (!kind) {
                    return;
                }
                var group = control.picker.optgroups[groupID];
                var label = group.label != null ? String(group.label) : groupID || '기타';
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'dttl-range-open';
                button.dataset.group = groupID;
                button.dataset.range = kind;
                button.textContent = label + ' · ' + $dropdowntextlist.ranges[kind].label;
                button.setAttribute('aria-label', label + ' ' + $dropdowntextlist.ranges[kind].label + ' 범위 입력');
                control.ranges.append(button);
                count++;
            });
            control.ranges.hidden = count === 0;
            $dropdowntextlist.layoutRanges(control.id);
            $dropdowntextlist.updateButtons(control.id);
        },

        // 범위 버튼을 입력 영역 오른쪽 안에 겹쳐 배치한다. 폭이 좁으면 입력 영역 아래로 내린다.
        layoutRanges(elID) {
            var control = $dropdowntextlist.requireControl(elID);

            var container = control.container;
            if (control.ranges.hidden) {
                container.classList.remove('dttl-ranges-inline');
                container.style.removeProperty('--dttl-ranges-width');
                return;
            }
            container.classList.add('dttl-ranges-inline');
            var width = Math.ceil(control.ranges.getBoundingClientRect().width);
            var inline = container.clientWidth >= width + 220;
            container.classList.toggle('dttl-ranges-inline', inline);
            if (inline) {
                container.style.setProperty('--dttl-ranges-width', (width + 16) + 'px');
            }
            else {
                container.style.removeProperty('--dttl-ranges-width');
            }
            if (control.editor) {
                $dropdowntextlist.positionEditor(control.id);
            }
        },

        openRange(elID, groupID, anchor) {
            var control = $dropdowntextlist.requireControl(elID);

            var kind = $dropdowntextlist.getRangeKind(control.id, groupID);
            if (!kind || control.picker.isLocked || control.picker.isDisabled) {
                return;
            }
            $dropdowntextlist.closeEditor(control.id, false);
            control.picker.close();
            var spec = $dropdowntextlist.ranges[kind];
            var group = control.picker.optgroups[groupID];
            var groupLabel = group.label != null ? String(group.label) : groupID || '기타';
            var current = $dropdowntextlist.getRange(control.id, groupID);
            var limits = $dropdowntextlist.getRangeLimit(control.id, groupID);
            // 선택한 범위가 없으면 시작·끝 모두 현재 값(min·max 안으로 보정)을 기본값으로 보여준다.
            if (current.start === '' && current.end === '') {
                current.start = current.end = $dropdowntextlist.getRangeNow(kind, limits);
            }
            // 끝은 다음 날·다음 달로 변환해 서버에 보내므로 마지막 날·달은 선택할 수 없다.
            var endCap = kind === 'date' ? '9999-12-30' : kind === 'month' ? '9999-11' : '';
            var endMax = limits.max && (!endCap || limits.max < endCap) ? limits.max : endCap;
            var editor = document.createElement('div');
            editor.className = 'dttl-editor dttl-range-editor';
            editor.setAttribute('role', 'dialog');
            editor.setAttribute('aria-label', groupLabel + ' ' + spec.label + ' 범위 편집');
            var field = function (label, value, min, max) {
                var wrapper = document.createElement('label');
                wrapper.append(document.createTextNode(label));
                var input = document.createElement('input');
                input.type = spec.type;
                input.placeholder = spec.placeholder;
                input.value = value;
                if (min) {
                    input.min = min;
                }
                if (max) {
                    input.max = max;
                }
                wrapper.append(input);
                editor.append(wrapper);
                return input;
            };
            var start = field('시작', current.start, limits.min, limits.max);
            var end = field('끝', current.end, limits.min, endMax);
            var message = document.createElement('div');
            message.className = 'dttl-range-error';
            message.setAttribute('role', 'alert');
            message.hidden = true;
            // 적용·해제·취소는 조건 편집창과 같은 Tabler btn-group으로 묶는다. 높이는 CSS에서 입력 상자와 같게 맞춘다.
            var buttons = document.createElement('div');
            buttons.className = 'btn-group';
            buttons.setAttribute('role', 'group');
            var apply = document.createElement('button');
            apply.type = 'button';
            apply.textContent = '적용';
            apply.className = 'btn btn-primary dttl-apply';
            var clear = document.createElement('button');
            clear.type = 'button';
            clear.textContent = '해제';
            clear.className = 'btn';
            var cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.textContent = '취소';
            cancel.className = 'btn';
            buttons.append(apply, clear, cancel);
            editor.append(buttons, message);
            var submit = function (startValue, endValue) {
                if (control.picker.isLocked || control.picker.isDisabled) {
                    return;
                }
                try {
                    $dropdowntextlist.setRange(control.id, groupID, startValue, endValue);
                } catch (error) {
                    if (error.userMessage) {
                        message.textContent = error.userMessage;
                        message.hidden = false;
                        return;
                    }
                    throw error;
                }
                $dropdowntextlist.closeEditor(control.id, true);
            };
            apply.addEventListener('click', function () {
                submit(start.value, end.value);
            });
            clear.addEventListener('click', function () {
                submit('', '');
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
                else if (event.key === 'Enter' && (event.target === start || event.target === end)) {
                    event.preventDefault();
                    submit(start.value, end.value);
                }
                else if (event.key === 'Tab') {
                    if (event.shiftKey && event.target === start) {
                        event.preventDefault();
                        cancel.focus();
                    }
                    else if (!event.shiftKey && event.target === cancel) {
                        event.preventDefault();
                        start.focus();
                    }
                }
            });
            control.editor = editor;
            control.editingID = null;
            control.editorAnchor = anchor;
            control.editorFocus = Array.from(control.ranges.querySelectorAll('button')).find(function (button) {
                return button.dataset.group === groupID;
            });
            control.container.append(editor);
            $dropdowntextlist.positionEditor(control.id);
            start.focus({ preventScroll: true });
        },

        setLocale() {}
    });

    syn.uicontrols.$dropdowntextlist = $dropdowntextlist;
})(window);
