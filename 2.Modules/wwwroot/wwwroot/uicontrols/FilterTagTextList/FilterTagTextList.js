/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $filtertagtextlist = syn.uicontrols.$filtertagtextlist || new syn.module();

    $filtertagtextlist.extend({
        name: 'syn.uicontrols.$filtertagtextlist',
        version: 'v2026.10.19',
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
            create: true,
            openOnFocus: false,
            defaultGroupID: '',
            groupDisplay: 'badge',
            groupNav: true,
            groupNavMode: 'menu',
            selectedDisplay: 'text',
            groupSelectAll: true,
            groupChangeClearsText: true,
            dropdownByButtonOnly: true,
            useParam: false,
            rangeLayout: 'nav',
            suggest: null,
            suggestLevel: 1,
            suggestEnterFirst: true,
            defaultLogic: 'OR',
            defaultOperator: 'contains',
            conditionEditable: false,
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
            suggest_select: 'onSuggestSelect',
            load: 'onLoad',
            destroy: 'onDestroy'
        },

        addModuleList(el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';
            // useParam:true이면 거래 요청에 Conditions 하나가 아니라 optgroups의 value마다 요청 항목(dataMapSet의 id)을 하나씩 등록한다.
            // range 그룹은 value + 'Start', value + 'End' 두 개다. 프레임워크가 컨트롤 하나에서 항목 하나만 읽으므로 등록 단계에서 필드를 나눈다.
            var names = $filtertagtextlist.getParamFields(setting);
            if (dataField && names.length > 0) {
                names.forEach(function (name) {
                    moduleList.push({
                        id: elementID,
                        formDataFieldID: formDataField,
                        field: name,
                        module: $filtertagtextlist.name,
                        type: controlType
                    });
                });
                return;
            }
            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: $filtertagtextlist.name,
                type: controlType
            });
        },

        // useParam:true일 때 서버 param으로 보낼 필드 이름 목록. optgroups의 value(범위 그룹은 value + 'Start'·'End')이며 syn-options에 직접 쓴 optgroups만 대상이다.
        getParamFields(setting) {
            if (!setting || setting.useParam !== true || !Array.isArray(setting.optgroups)) {
                return [];
            }
            var names = [];
            setting.optgroups.forEach(function (group) {
                if (!group || group.value == null || String(group.value) === '') {
                    return;
                }
                var name = String(group.value);
                if ($filtertagtextlist.hasProperty($filtertagtextlist.ranges, group.range)) {
                    names.push(name + 'Start', name + 'End');
                }
                else {
                    names.push(name);
                }
            });
            return names;
        },

        // 요청 필드 하나의 값. 후보 그룹은 선택한 key를 쉼표로 이어 붙이고(빈 key '전체'를 선택했거나 선택이 없으면 빈 문자열), 범위 그룹은 사용자가 입력한 시작·끝 값이다.
        getParamValue(elID, fieldID) {
            var control = $filtertagtextlist.requireControl(elID);

            var picker = control.picker;
            fieldID = String(fieldID);
            var side = '';
            var groupID = fieldID;
            var match = /^(.+)(Start|End)$/.exec(fieldID);
            if (match && !$filtertagtextlist.hasProperty(picker.optgroups, fieldID) && $filtertagtextlist.getRangeKind(control.id, match[1]) !== '') {
                groupID = match[1];
                side = match[2] === 'Start' ? 'start' : 'end';
            }
            if (side) {
                return $filtertagtextlist.getRange(control.id, groupID)[side];
            }
            var keys = [];
            var all = false;
            picker.items.forEach(function (id) {
                var option = picker.options[id];
                if (!option || option._dttlGroup !== groupID) {
                    return;
                }
                if (option._dttlKey === '') {
                    all = true;
                }
                else {
                    keys.push(option._dttlKey);
                }
            });
            return all ? '' : keys.join(',');
        },

        controlLoad(elID, setting) {
            var control = $filtertagtextlist.getControl(elID);
            if (control) {
                return control;
            }
            var el = syn.$l.get(elID);
            if (!el) {
                throw new Error('FilterTagTextList: 요소를 찾을 수 없습니다: ' + elID);
            }
            if (typeof TomSelect === 'undefined') {
                throw new Error('FilterTagTextList: Tom Select를 먼저 불러와야 합니다');
            }
            setting = syn.$w.argumentsExtend($filtertagtextlist.defaultSetting, setting || {});
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }
            setting.elID = elID;
            $filtertagtextlist.normalizeDropdownSize(setting.dropdownWidth, 'dropdownWidth');
            $filtertagtextlist.normalizeDropdownSize(setting.dropdownHeight, 'dropdownHeight');
            el.setAttribute('syn-options', JSON.stringify(setting));
            try {
                control = $filtertagtextlist.addControlSetting(el, setting);
            } catch (error) {
                $filtertagtextlist.textListControls = $filtertagtextlist.textListControls.filter(function (item) {
                    return item.id !== elID;
                });
                throw error;
            }
            $filtertagtextlist.initialize(elID);
            return control;
        },

        addControlSetting(el, setting) {
            if (setting.rangeLayout !== 'inline' && setting.rangeLayout !== 'nav') {
                throw new TypeError('FilterTagTextList: rangeLayout은 inline 또는 nav여야 합니다');
            }
            if (setting.groupNavMode !== 'scroll' && setting.groupNavMode !== 'menu') {
                throw new TypeError('FilterTagTextList: groupNavMode는 scroll 또는 menu여야 합니다');
            }
            if (setting.selectedDisplay !== 'tag' && setting.selectedDisplay !== 'text') {
                throw new TypeError('FilterTagTextList: selectedDisplay는 tag 또는 text여야 합니다');
            }
            if (typeof setting.useParam !== 'boolean') {
                throw new TypeError('FilterTagTextList: useParam은 boolean이어야 합니다');
            }
            if (typeof setting.groupChangeClearsText !== 'boolean') {
                throw new TypeError('FilterTagTextList: groupChangeClearsText는 boolean이어야 합니다');
            }
            if (typeof setting.dropdownByButtonOnly !== 'boolean') {
                throw new TypeError('FilterTagTextList: dropdownByButtonOnly는 boolean이어야 합니다');
            }
            if (setting.suggestLevel !== 1 && setting.suggestLevel !== 2) {
                throw new TypeError('FilterTagTextList: suggestLevel은 1 또는 2여야 합니다');
            }
            if (typeof setting.suggestEnterFirst !== 'boolean') {
                throw new TypeError('FilterTagTextList: suggestEnterFirst는 boolean이어야 합니다');
            }
            if (typeof setting.groupSelectAll !== 'boolean') {
                throw new TypeError('FilterTagTextList: groupSelectAll은 boolean이어야 합니다');
            }
            // 기본값이 menu 모드 기준이므로, 선행 옵션(groupNavMode:'menu', selectedDisplay:'text', suggestLevel:1)을 쓰지 않는 컨트롤에서는
            // 이에 의존하는 옵션을 오류 대신 꺼서 기존 방식(scroll·tag·2단 팝업)으로 동작하게 한다.
            if (setting.groupNavMode !== 'menu') {
                setting.dropdownByButtonOnly = false;
                setting.groupChangeClearsText = false;
                setting.selectedDisplay = 'tag';
            }
            if (setting.groupNav === false) {
                setting.selectedDisplay = 'tag';
            }
            if (setting.selectedDisplay !== 'text') {
                setting.groupSelectAll = false;
            }
            if (setting.suggestLevel !== 1) {
                setting.suggestEnterFirst = false;
            }
            if (setting.suggest != null && setting.suggest !== false && typeof setting.suggest !== 'function') {
                throw new TypeError('FilterTagTextList: suggest는 함수여야 합니다');
            }
            if (!['AND', 'OR'].includes(setting.defaultLogic) || !$filtertagtextlist.hasProperty($filtertagtextlist.operators, setting.defaultOperator)) {
                throw new TypeError('FilterTagTextList: defaultLogic 또는 defaultOperator가 올바르지 않습니다');
            }
            (setting.optgroups || []).forEach(function (group) {
                return $filtertagtextlist.checkRangeGroup(group);
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
                    $filtertagtextlist.textListControls = $filtertagtextlist.textListControls.filter(function (item) {
                        return item.id !== control.id;
                    });
                },

                on(event, handler) {
                    return $filtertagtextlist.on(control.id, event, handler);
                },

                off(event, handler) {
                    return $filtertagtextlist.off(control.id, event, handler);
                },

                trigger(event, ...args) {
                    return $filtertagtextlist.trigger(control.id, event, ...args);
                },

                getValue() {
                    return $filtertagtextlist.getValue(control.id);
                },

                setValue(value, silent) {
                    return $filtertagtextlist.setValue(control.id, value, silent);
                },

                getSummaryText(options) {
                    return $filtertagtextlist.getSummaryText(control.id, options);
                },

                getGroupConditions(list) {
                    return $filtertagtextlist.getGroupConditions(list);
                },

                getNormalText() {
                    return $filtertagtextlist.getNormalText(control.id);
                },

                setNormalText(items, silent) {
                    return $filtertagtextlist.setNormalText(control.id, items, silent);
                },

                addOption(data, user_created) {
                    return $filtertagtextlist.addOption(control.id, data, user_created);
                },

                addOptions(data, user_created) {
                    return $filtertagtextlist.addOptions(control.id, data, user_created);
                },

                updateOption(value, data) {
                    return $filtertagtextlist.updateOption(control.id, value, data);
                },

                removeOption(value) {
                    return $filtertagtextlist.removeOption(control.id, value);
                },

                getOption(value, create) {
                    return $filtertagtextlist.getOption(control.id, value, create);
                },

                clearFilter(option, value) {
                    return $filtertagtextlist.clearFilter(control.id, option, value);
                },

                clearOptions(filter) {
                    return $filtertagtextlist.clearOptions(control.id, filter);
                },

                clear(silent) {
                    return $filtertagtextlist.clear(control.id, silent);
                },

                getItem(value) {
                    return $filtertagtextlist.getItem(control.id, value);
                },

                addItem(value, silent) {
                    return $filtertagtextlist.addItem(control.id, value, silent);
                },

                removeItem(value, silent) {
                    return $filtertagtextlist.removeItem(control.id, value, silent);
                },

                refreshItems() {
                    return $filtertagtextlist.refreshItems(control.id);
                },

                createItem(value, callback) {
                    return $filtertagtextlist.createItem(control.id, value, callback);
                },

                load(query) {
                    return $filtertagtextlist.load(control.id, query);
                },

                addOptionGroup(id, data) {
                    return $filtertagtextlist.addOptionGroup(control.id, id, data);
                },

                removeOptionGroup(id) {
                    return $filtertagtextlist.removeOptionGroup(control.id, id);
                },

                clearOptionGroups() {
                    return $filtertagtextlist.clearOptionGroups(control.id);
                },

                lock() {
                    return $filtertagtextlist.lock(control.id);
                },

                unlock() {
                    return $filtertagtextlist.unlock(control.id);
                },

                disable() {
                    return $filtertagtextlist.disable(control.id);
                },

                enable() {
                    return $filtertagtextlist.enable(control.id);
                },

                sync() {
                    return $filtertagtextlist.sync(control.id);
                },

                destroy() {
                    if (control.destroyed) {
                        return;
                    }
                    return $filtertagtextlist.destroy(control.id);
                },

                getAdjacent(element, direction) {
                    return $filtertagtextlist.getAdjacent(control.id, element, direction);
                },

                refreshOptions(triggerDropdown) {
                    return $filtertagtextlist.refreshOptions(control.id, triggerDropdown);
                },

                open() {
                    return $filtertagtextlist.open(control.id);
                },

                close() {
                    return $filtertagtextlist.close(control.id);
                },

                positionDropdown() {
                    return $filtertagtextlist.positionDropdown(control.id);
                },

                focus() {
                    return $filtertagtextlist.focus(control.id);
                },

                blur() {
                    return $filtertagtextlist.blur(control.id);
                },

                setCaret(index) {
                    return $filtertagtextlist.setCaret(control.id, index);
                },

                isFull() {
                    return $filtertagtextlist.isFull(control.id);
                },

                clearCache() {
                    return $filtertagtextlist.clearCache(control.id);
                },

                setTextboxValue(str) {
                    return $filtertagtextlist.setTextboxValue(control.id, str);
                },

                setRange(groupID, start, end) {
                    return $filtertagtextlist.setRange(control.id, groupID, start, end);
                },

                getRange(groupID) {
                    return $filtertagtextlist.getRange(control.id, groupID);
                }
            };
            $filtertagtextlist.textListControls.push(control);
            var mod = window[syn.$w.pageScript];
            var events = control.originalEvents ? $object.parseJsonValue(control.originalEvents, 'json') : [];
            Object.keys($filtertagtextlist.eventCallbacks).forEach(function (event) {
                if (typeof setting[$filtertagtextlist.eventCallbacks[event]] === 'function') {
                    $filtertagtextlist.on(control.id, event, setting[$filtertagtextlist.eventCallbacks[event]]);
                }
                if (events.includes(event) && mod && mod.event && typeof mod.event[control.id + '_' + event] === 'function') {
                    $filtertagtextlist.on(control.id, event, mod.event[control.id + '_' + event]);
                }
            });
            // 컨트롤 이벤트는 직접 연결하여 공통 로더의 DOM 이벤트와 중복 호출되지 않게 한다.
            if (control.originalEvents !== null) {
                el.setAttribute('syn-events', JSON.stringify(events.filter(function (event) {
                    return !$filtertagtextlist.hasProperty($filtertagtextlist.eventCallbacks, event);
                })));
            }
            control.container = document.createElement('div');
            // AND/OR 배지를 숨기면(hideLogicBadge:true) 배지가 튀어나올 자리로 둔 태그 위쪽 여백과 줄 간격을 없앤다. 초기화 때 한 번만 정한다.
            control.container.className = 'syn-filtertagtextlist' + (setting.hideLogicBadge === false ? '' : ' dttl-hide-badge') + (setting.selectedDisplay === 'text' ? ' dttl-select-text' : '');
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
            $filtertagtextlist.listen(control.id, control.source, 'change', function (event) {
                return event.stopPropagation();
            });
            $filtertagtextlist.listen(control.id, control.source, 'input', function (event) {
                return event.stopPropagation();
            });
            var options = (setting.options || []).map(function (data) {
                return $filtertagtextlist.normalize(control.id, data);
            });
            var selectSetting = Object.assign({}, setting, {
                options: options,
                items: [],
                preload: false,
                mode: 'multi',
                duplicates: false,
                // selectedDisplay:'text'는 선택한 후보를 목록에 남겨 다시 눌러 해제하므로 선택한 후보를 숨기지 않는다.
                hideSelected: setting.selectedDisplay === 'text' ? false : setting.hideSelected,
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
                        var condition = control.conditions.get(data._dttlID) || $filtertagtextlist.getDefaultCondition(control.id);
                        var normal = data._dttlGroup === $filtertagtextlist.normalGroup;
                        var group = control.picker && !normal ? control.picker.optgroups[data._dttlGroup] : null;
                        var groupLabel = normal ? $filtertagtextlist.getNormalParts(data).key || '텍스트' : group && group.label != null ? String(group.label) : data._dttlGroup || '기타';
                        var summary = (normal ? '일반 텍스트 · ' : '') + groupLabel + ' · ' + data._dttlLabel + ' · ' + condition.logic + ' · ' + $filtertagtextlist.operators[condition.operator];

                        // AND/OR 배지는 hideLogicBadge:false일 때만 만든다(기본값 true는 만들지 않는다).
                        var showBadge = setting.hideLogicBadge === false;
                        // 그룹 이름은 기본적으로(groupDisplay:'tooltip') 툴팁(title)으로만 보여주고 'inline'이면 태그 안에, 'badge'이면 AND/OR 배지 뒤에 보여준다.
                        // range 그룹의 태그는 groupDisplay 값과 관계없이 값만 보여준다. 'badge'는 배지를 숨기면(hideLogicBadge:true) 그룹 이름을 보여주지 않는다.
                        var isRange = !normal && $filtertagtextlist.getRangeKind(control.id, data._dttlGroup) !== '';
                        var normalKey = normal ? $filtertagtextlist.getNormalParts(data).key : '';
                        // 일반 텍스트의 key는 배지가 있으면 배지 뒤에 보여주고, 배지를 숨겼으면 후보의 그룹 이름처럼 groupDisplay:'inline'일 때만 그룹 이름 영역에 보여준다(key가 없으면 표시하지 않는다).
                        var hideGroup = normal ? showBadge || setting.groupDisplay !== 'inline' || !normalKey : setting.groupDisplay !== 'inline' || isRange;
                        // 배지는 AND/OR를 보여주며 뒤에 이어서 일반 텍스트는 key, groupDisplay:'badge'인 후보는 그룹 이름을 보여준다(없으면 AND/OR만).
                        // 그룹 ID가 비어 있는 후보와 range 태그는 이어 붙이지 않는다.
                        var badgeKey = !showBadge ? '' : normal ? normalKey : setting.groupDisplay === 'badge' && !isRange && data._dttlGroup ? groupLabel : '';
                        // 이어 붙인 텍스트가 길면 그 부분만 줄임표로 자르므로 태그가 배지 폭만큼 넓어지도록 최소 폭을 준다(최대 8.5rem).
                        var badge = showBadge ? '<span class="dttl-logic-badge" aria-hidden="true">' + condition.logic +
                            (badgeKey ? '<span class="dttl-badge-key"> · ' + escape(badgeKey) + '</span>' : '') + '</span>' : '';
                        var minWidth = badgeKey ? ' style="min-width:' + Math.min(136, Array.from(badgeKey).length * 9 + 34) + 'px"' : '';
                        // conditionEditable:false이면 조건 편집창을 열 수 없으므로 편집 동작을 알리는 role·이름을 붙이지 않는다. range 태그는 범위 편집창이 열리므로 제외한다.
                        var fixed = setting.conditionEditable === false && !isRange;
                        // selectedDisplay:'text'이면 그룹 버튼이 있는 후보와 범위 조건은 태그를 숨기고 그룹 버튼의 글자로 보여준다(일반 텍스트는 태그).
                        var inButton = setting.selectedDisplay === 'text' && !normal && !!group && group.label != null;

                        return '<div class="dttl-item' + (normal ? ' dttl-normal' : '') + (hideGroup ? ' dttl-group-tooltip' : '') + (fixed ? ' dttl-fixed' : '') + (inButton ? ' dttl-item-hidden' : '') + '" data-dttl-logic="' + condition.logic + '" data-dttl-operator="' + condition.operator + '" title="' + escape(summary) + '"' + minWidth + '>' +
                            badge +
                            '<span class="dttl-group"' + (fixed ? '' : ' role="button" tabindex="0" aria-label="' + escape(summary + ' 조건 편집') + '"') + '>' + escape(groupLabel) + '</span>' +
                            '<button type="button" class="dttl-edit" aria-label="' + escape(fixed ? summary : summary + ' 조건 편집') + '"><span class="dttl-label">' + escape(data._dttlLabel) + '</span></button>' +
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
            Object.keys($filtertagtextlist.eventCallbacks).forEach(function (event) {
                selectSetting[$filtertagtextlist.eventCallbacks[event]] = function (...args) {
                    control.picker = this;
                    $filtertagtextlist.relay(control.id, event, args);
                };
            });
            control.picker = new TomSelect(control.source, selectSetting);
            // range 그룹의 등록·제거를 범위 버튼에 반영한다.
            ['addOptionGroup', 'removeOptionGroup', 'clearOptionGroups'].forEach(function (name) {
                var original = control.picker[name];
                control.picker[name] = function () {
                    if (name === 'addOptionGroup') {
                        $filtertagtextlist.checkRangeGroup(arguments[1]);
                    }
                    var result = original.apply(control.picker, arguments);
                    if (!control.destroyed) {
                        $filtertagtextlist.renderRanges(control.id);
                    }
                    return result;
                };
            });
            $filtertagtextlist.renderRanges(control.id);
            if (typeof ResizeObserver === 'function') {
                var rangeObserver = new ResizeObserver(function () {
                    if (!control.destroyed) {
                        $filtertagtextlist.layoutRanges(control.id);
                    }
                });
                rangeObserver.observe(control.container);
                control.cleanups.push(function () {
                    return rangeObserver.disconnect();
                });
            }
            $filtertagtextlist.listen(control.id, control.ranges, 'click', function (event) {
                var button = event.target.closest('.dttl-range-open');
                if (!button || !control.ranges.contains(button) || control.picker.isLocked || control.picker.isDisabled) {
                    return;
                }
                if (control.editor && control.editorAnchor === button) {
                    $filtertagtextlist.closeEditor(control.id, true);
                }
                else {
                    $filtertagtextlist.openRange(control.id, button.dataset.group, button);
                }
            });
            var originalPositionDropdown = control.picker.positionDropdown;
            control.picker.positionDropdown = function () {
                var result = originalPositionDropdown.call(control.picker);
                if (!control.destroyed) {
                    $filtertagtextlist.sizeDropdown(control.id);
                }
                return result;
            };
            var originalRefreshOptions = control.picker.refreshOptions;
            control.picker.refreshOptions = function (triggerDropdown) {
                var result = originalRefreshOptions.call(control.picker, triggerDropdown);
                if (!control.destroyed) {
                    $filtertagtextlist.updateGroupNav(control.id);
                }
                if (control.picker.isOpen && !control.destroyed) {
                    $filtertagtextlist.sizeDropdown(control.id);
                }
                return result;
            };
            // groupNavMode:'menu'이면 그룹 버튼이 연 목록에 고른 그룹의 후보만 남기도록 검색 결과를 거른다(빈 입력일 때도 적용되도록 search 결과에서 거른다).
            control.navFilter = '';
            control.menuAnchor = null;
            control.menuAligned = false;
            var originalSearch = control.picker.search;
            control.picker.search = function () {
                var results = originalSearch.apply(control.picker, arguments);
                var text = control.settings.selectedDisplay === 'text';
                if ((control.navFilter || text) && !control.destroyed) {
                    // TomSelect가 마지막 검색 결과(currentResults)를 재사용하므로 원본은 고치지 않고 거른 복사본을 돌려준다.
                    // text 모드는 선택한 후보를 숨기지 않으므로 선택한 일반 텍스트와 범위 조건은 후보 목록에서 뺀다.
                    var items = results.items.filter(function (item) {
                        var option = control.picker.options[item.id];
                        if (!option) {
                            return false;
                        }
                        if (text && (option._dttlGroup === $filtertagtextlist.normalGroup || $filtertagtextlist.getRangeKind(control.id, option._dttlGroup) !== '')) {
                            return false;
                        }
                        return !control.navFilter || option._dttlGroup === control.navFilter;
                    });
                    return Object.assign({}, results, { items: items, total: items.length });
                }
                return results;
            };
            if (setting.dropdownByButtonOnly === true) {
                // 후보 드롭다운은 그룹 버튼(navFilter)이 연 목록일 때만 열린다. 입력·포커스·↓ 키·태그 생성 후에는 열지 않는다.
                var openByButton = control.picker.open;
                control.picker.open = function () {
                    if (!control.navFilter && !control.destroyed) {
                        return;
                    }
                    return openByButton.apply(control.picker, arguments);
                };
            }
            if (setting.selectedDisplay === 'text') {
                // 선택한 후보는 목록에 남겨 두므로 다시 누르면(클릭·Enter) 선택을 해제한다.
                var toggleOption = function (option) {
                    var value = option && option.dataset ? option.dataset.value : undefined;
                    if (value === undefined) {
                        return false;
                    }
                    var data = control.picker.options[value];
                    if (control.settings.groupSelectAll === true && data && data._dttlKey === '' && data._dttlGroup !== $filtertagtextlist.normalGroup) {
                        // 그룹의 빈 key 후보('전체')는 그 그룹의 모든 후보를 선택하거나(하나라도 선택되지 않았으면) 모두 해제한다(모두 선택되어 있으면).
                        $filtertagtextlist.toggleGroupAll(control.id, data._dttlGroup);
                        return true;
                    }
                    if (!control.picker.items.includes(value)) {
                        return false;
                    }
                    if (!control.picker.isLocked && !control.destroyed) {
                        control.picker.removeItem(value);
                        control.picker.lastQuery = null;
                        control.picker.refreshOptions(false);
                    }
                    return true;
                };
                // 마우스 클릭은 TomSelect가 내부에서 묶은 처리를 쓰므로 목록의 클릭을 캡처 단계에서 먼저 받는다.
                $filtertagtextlist.listen(control.id, control.picker.dropdown, 'click', function (event) {
                    var option = event.target.closest('.option[data-value]');
                    if (option && control.picker.dropdown.contains(option) && toggleOption(option)) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                    }
                }, true);
                // Enter로 고르는 경우는 TomSelect가 self.onOptionSelect를 호출한다.
                var originalOptionSelect = control.picker.onOptionSelect;
                control.picker.onOptionSelect = function (event, option) {
                    if (toggleOption(option)) {
                        return;
                    }
                    return originalOptionSelect.apply(control.picker, arguments);
                };
                // 숨겨진 태그가 Backspace·방향키·Ctrl+A로 보이지 않게 지워지거나 선택되지 않도록, 입력창이 비었을 때는 보이는 일반 텍스트 태그만 다룬다.
                $filtertagtextlist.listen(control.id, control.picker.control_input, 'keydown', function (event) {
                    var input = control.picker.control_input;
                    if (control.composing || event.isComposing || control.picker.activeItems.length || input.selectionStart !== 0 || input.selectionEnd !== 0) {
                        return;
                    }
                    var select = (event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'a';
                    if (event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && !select) {
                        return;
                    }
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    if (event.key === 'Backspace' && !control.picker.isLocked) {
                        var normals = control.picker.items.filter(function (id) {
                            return $filtertagtextlist.isNormalID(id);
                        });
                        if (normals.length) {
                            control.picker.removeItem(normals[normals.length - 1]);
                        }
                    }
                }, true);
            }
            // rangeLayout:'nav'이면 groupNav:false여도 범위 버튼을 담기 위해 버튼 줄을 만든다.
            if (setting.groupNav !== false || setting.rangeLayout === 'nav') {
                $filtertagtextlist.createGroupNav(control.id);
            }
            // 콜백과 Promise 방식 모두 같은 생성·조회 처리와 파괴 여부 검사를 사용한다.
            control.picker.createItem = function (value, callback) {
                return $filtertagtextlist.createItem(control.id, value, callback);
            };
            control.picker.load = function (query) {
                return $filtertagtextlist.load(control.id, query);
            };
            $filtertagtextlist.listen(control.id, control.picker.control, 'click', function (event) {
                return $filtertagtextlist.onTagClick(control.id, event);
            }, true);
            $filtertagtextlist.listen(control.id, control.picker.control, 'keydown', function (event) {
                var target = event.target.closest('.dttl-group,.dttl-edit');
                if (target && (event.key === 'Enter' || event.key === ' ' || event.key === 'F2')) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $filtertagtextlist.editCondition(control.id, target.closest('[data-value]'));
                    return;
                }
                if ((event.key === 'Enter' || event.key === 'F2') && control.picker.activeItems.length) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $filtertagtextlist.editCondition(control.id, control.picker.activeItems[0]);
                }
            }, true);
            $filtertagtextlist.listen(control.id, control.picker.control_input, 'compositionstart', function () {
                control.composing = true;
            });
            $filtertagtextlist.listen(control.id, control.picker.control_input, 'compositionend', function () {
                control.composing = false;
            });
            $filtertagtextlist.listen(control.id, control.picker.control_input, 'keydown', function (event) {
                if (control.composing || event.isComposing) {
                    event.stopImmediatePropagation();
                }
            }, true);
            $filtertagtextlist.listen(control.id, document, 'pointerdown', function (event) {
                if (control.suggest && control.suggest.visible && !control.container.contains(event.target)) {
                    $filtertagtextlist.hideSuggest(control.id);
                }
                if (control.editor && !control.editor.contains(event.target) && !control.picker.control.contains(event.target) && !control.ranges.contains(event.target)) {
                    $filtertagtextlist.closeEditor(control.id, false);
                }
            });
            $filtertagtextlist.listen(control.id, window, 'resize', function () {
                if (control.picker.isOpen) {
                    control.picker.positionDropdown();
                }
                if (control.suggest && control.suggest.visible) {
                    $filtertagtextlist.positionSuggest(control.id);
                }
                if (control.editor) {
                    $filtertagtextlist.positionEditor(control.id);
                }
            });
            $filtertagtextlist.listen(control.id, document, 'scroll', function (event) {
                if (control.suggest && control.suggest.visible && !control.suggest.root.contains(event.target)) {
                    $filtertagtextlist.positionSuggest(control.id);
                }
                if (control.editor && !control.editor.contains(event.target)) {
                    $filtertagtextlist.positionEditor(control.id);
                }
            }, true);
            if (typeof setting.suggest === 'function') {
                $filtertagtextlist.createSuggest(control.id);
            }
            if (setting.items && setting.items.length) {
                $filtertagtextlist.setValue(control.id, setting.items, true);
            }
            else {
                // options의 selected:true 후보는 처음부터 선택한다. items를 지정하면 items가 우선하며 selected는 무시한다.
                options.forEach(function (option) {
                    if (option._dttlRaw.selected === true || option._dttlRaw.selected === 'true') {
                        control.picker.addItem(option._dttlID, true);
                    }
                });
            }
            if (setting.disabled || el.disabled) {
                $filtertagtextlist.disable(control.id);
            }
            if (setting.locked || el.readOnly) {
                $filtertagtextlist.lock(control.id);
            }
            control.ready = true;
            $filtertagtextlist.writeValue(control.id);
            return control;
        },

        on(elID, event, handler) {
            var control = $filtertagtextlist.requireControl(elID);

            if (typeof handler !== 'function') {
                throw new TypeError('FilterTagTextList: handler는 함수여야 합니다');
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
            var control = $filtertagtextlist.requireControl(elID);

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
            var control = $filtertagtextlist.requireControl(elID);

            Array.from(control.handlers.get(event) || []).forEach(function (handler) {
                return handler.apply(control, args);
            });
            return control;
        },

        // meta: 프레임워크가 거래 요청을 만들 때 넘기는 {fieldID, dataType}. useParam:true이면 fieldID에 해당하는 그룹의 param 값(문자열)을 반환하고,
        // 그 밖에는(meta 없음 포함) 선택한 조건 배열을 반환한다.
        getValue(elID, meta) {
            var control = $filtertagtextlist.requireControl(elID);

            if (control.settings.useParam === true && meta && typeof meta === 'object' && typeof meta.fieldID === 'string') {
                return $filtertagtextlist.getParamValue(control.id, meta.fieldID);
            }
            return control.picker.items.filter(function (id) {
                return $filtertagtextlist.hasProperty(control.picker.options, id) && control.picker.options[id]._dttlGroup !== $filtertagtextlist.normalGroup;
            }).map(function (id) {
                var data = control.picker.options[id];
                var condition = control.conditions.get(id) || $filtertagtextlist.getDefaultCondition(control.id);
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
            var control = $filtertagtextlist.requireControl(elID);

            options = options || {};
            var groupLogic = options.groupLogic == null ? 'AND' : options.groupLogic;
            if (!['AND', 'OR'].includes(groupLogic)) {
                throw new TypeError('FilterTagTextList: groupLogic은 AND 또는 OR여야 합니다');
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
                if (!$filtertagtextlist.hasProperty(control.picker.options, id)) {
                    return;
                }
                var item = $filtertagtextlist.getConditionItem(control.id, id);
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
                var side = item.normal ? '' : $filtertagtextlist.getRangeSide(control.id, id);
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
                    text: group.label + ' ' + $filtertagtextlist.operators[item.operator] + ' ' + (item.normal && item.key && normalTextLabel ? normalTextLabel + ' ' : '') + quote(item.value)
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
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.items.filter(function (id) {
                return $filtertagtextlist.hasProperty(control.picker.options, id) && control.picker.options[id]._dttlGroup === $filtertagtextlist.normalGroup;
            }).map(function (id) {
                var parts = $filtertagtextlist.getNormalParts(control.picker.options[id]);
                var condition = control.conditions.get(id) || $filtertagtextlist.getDefaultCondition(control.id);
                return {
                    logic: condition.logic,
                    operator: condition.operator,
                    key: parts.key,
                    value: parts.value
                };
            });
        },

        // item_add·item_remove·option_change에 전달할 항목 하나의 정보를 반환한다. 일반 텍스트는 groupID 대신 normal: true를 가진다.
        // 조건 정보가 없으면 기본값(defaultLogic, defaultOperator. 기본 OR, contains)을 사용하며 후보가 이미 제거된 경우 id에서 groupID와 key를 얻고 value는 생략한다.
        getConditionItem(elID, id) {
            var control = $filtertagtextlist.requireControl(elID);

            var data = control.picker.options[id];
            var reference = $filtertagtextlist.getOptionReference(id);
            var condition = control.conditions.get(id) || $filtertagtextlist.getDefaultCondition(control.id);
            if (reference.groupID === $filtertagtextlist.normalGroup) {
                var parts = $filtertagtextlist.getNormalParts(data || { _dttlKey: reference.key });
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
            var control = $filtertagtextlist.requireControl(elID);

            silent = silent === true;
            if (items == null) {
                items = [];
            }
            if (!Array.isArray(items)) {
                throw new TypeError('FilterTagTextList: 일반 텍스트는 배열이어야 합니다');
            }
            var prepared = items.map(function (item) {
                var parts = typeof item === 'string' || typeof item === 'number' ? $filtertagtextlist.parseNormalText(item) : null;
                var logic = control.settings.defaultLogic;
                var operator = control.settings.defaultOperator;
                if (item && typeof item === 'object') {
                    var key = item.key == null ? '' : $filtertagtextlist.normalizeScalar(item.key, 'key', true).trim();
                    var value = $filtertagtextlist.normalizeScalar(item.value, 'value', false).trim();
                    parts = value === '' || key.indexOf('\u0000') >= 0 ? null : { key: key, value: value };
                    logic = item.logic == null ? logic : item.logic;
                    operator = item.operator == null ? operator : item.operator;
                    if (!['AND', 'OR'].includes(logic) || !$filtertagtextlist.hasProperty($filtertagtextlist.operators, operator)) {
                        throw new TypeError('FilterTagTextList: logic 또는 operator가 올바르지 않습니다');
                    }
                }
                if (!parts) {
                    throw new TypeError('FilterTagTextList: 일반 텍스트가 올바르지 않습니다');
                }
                return { option: $filtertagtextlist.normalOption(parts.key, parts.value), logic: logic, operator: operator };
            });
            var maxItems = control.picker.settings.maxItems;
            var others = control.picker.items.filter(function (id) {
                return !$filtertagtextlist.isNormalID(id);
            }).length;
            if (maxItems != null && others + prepared.length > maxItems) {
                throw new Error('FilterTagTextList: maxItems를 초과했습니다');
            }

            var before = $filtertagtextlist.snapshot(control.id);
            $filtertagtextlist.cancelPending(control.id);
            $filtertagtextlist.closeEditor(control.id, false);
            $filtertagtextlist.clearItems(control.id, true);
            var ids = [];
            prepared.forEach(function (item) {
                var id = item.option._dttlID;
                if (ids.includes(id)) {
                    return;
                }
                ids.push(id);
                control.conditions.set(id, { logic: item.logic, operator: item.operator });
                if (!$filtertagtextlist.hasProperty(control.picker.options, id)) {
                    control.picker.addOption(item.option, true);
                }
            });
            control.picker.addItems(ids, true);
            $filtertagtextlist.refreshItems(control.id);
            control.picker.refreshOptions(false);
            $filtertagtextlist.notify(control.id, before, silent);
        },

        // getValue()와 getNormalText()를 함께 비교하여 일반 텍스트만 바뀌어도 변경으로 판단한다.
        snapshot(elID) {
            return JSON.stringify([$filtertagtextlist.getValue(elID), $filtertagtextlist.getNormalText(elID)]);
        },

        isNormalID(id) {
            var pair;
            try {
                pair = JSON.parse(id);
            } catch (error) {
                return false;
            }
            return Array.isArray(pair) && pair[0] === $filtertagtextlist.normalGroup;
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
                throw new TypeError('FilterTagTextList: 일반 텍스트가 올바르지 않습니다');
            }
            var internal = key + '\u0000' + value;
            return {
                _dttlID: $filtertagtextlist.getOptionID($filtertagtextlist.normalGroup, internal),
                _dttlKey: internal,
                _dttlGroup: $filtertagtextlist.normalGroup,
                _dttlLabel: value,
                _dttlRaw: { normal: true, key: key, value: value }
            };
        },

        // 선택된 후보 중 일반 텍스트(normal=true) 또는 일반 후보(normal=false)만 조용히 해제한다.
        clearItems(elID, normal) {
            var control = $filtertagtextlist.requireControl(elID);

            var targets = control.picker.items.filter(function (id) {
                return $filtertagtextlist.isNormalID(id) === normal;
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
            var control = $filtertagtextlist.requireControl(elID);

            var ids = Object.keys(control.picker.options).filter(function (id) {
                var option = control.picker.options[id];
                return option._dttlGroup !== $filtertagtextlist.normalGroup && (option._dttlKey === text || option._dttlLabel === text) && !$filtertagtextlist.getRangeSide(control.id, id);
            });
            return ids.find(function (id) {
                return !control.picker.items.includes(id);
            }) || ids[0] || '';
        },

        setValue(elID, value, silent = false) {
            var control = $filtertagtextlist.requireControl(elID);

            // 거래 setter의 세 번째 인자는 메타데이터일 수 있으므로 true일 때만 change를 생략한다.
            silent = silent === true;
            var values = Array.isArray(value) ? value : [value];
            var kind = values.length ? $filtertagtextlist.getValueType(values[0], control.settings) : 'key';
            if (values.some(function (item) {
                return $filtertagtextlist.getValueType(item, control.settings) !== kind;
            })) {
                throw new TypeError('FilterTagTextList: 후보와 일반 텍스트를 섞은 배열은 지원하지 않습니다');
            }
            var prepared = [];
            if (kind === 'condition') {
                prepared = values.map(function (item) {
                    return $filtertagtextlist.condition(control.id, item);
                });
            }
            else if (kind === 'option') {
                prepared = values.map(function (item) {
                    return $filtertagtextlist.normalize(control.id, item);
                });
            }
            else {
                prepared = values.map(function (item) {
                    var id = $filtertagtextlist.resolve(control.id, item);
                    if (!id) {
                        throw new Error('FilterTagTextList: 알 수 없는 key입니다: ' + item);
                    }
                    return id;
                });
            }

            var before = $filtertagtextlist.snapshot(control.id);
            var userOptions = Object.assign({}, control.picker.userOptions);
            $filtertagtextlist.cancelPending(control.id);
            $filtertagtextlist.closeEditor(control.id, false);
            if (kind === 'option') {
                var incoming = new Map(prepared.map(function (data) {
                    return [data._dttlID, data];
                }));
                Object.keys(control.picker.options).forEach(function (id) {
                    // 일반 텍스트는 후보 데이터가 아니므로 후보를 교체해도 유지한다.
                    if (!incoming.has(id) && !$filtertagtextlist.isNormalID(id)) {
                        control.picker.removeOption(id, true);
                    }
                });
                incoming.forEach(function (data, id) {
                    if ($filtertagtextlist.hasProperty(control.picker.options, id)) {
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
                $filtertagtextlist.clearItems(control.id, false);
                $filtertagtextlist.purgeRangeOptions(control.id);
                var ids = [];
                prepared.forEach(function (data, index) {
                    var id = kind === 'condition' ? $filtertagtextlist.getOptionID(data.groupID, data.key) : data;
                    if (ids.includes(id)) {
                        return;
                    }
                    ids.push(id);
                    if (kind === 'condition') {
                        control.conditions.set(id, {
                            logic: data.logic,
                            operator: data.operator
                        });
                        var option = $filtertagtextlist.fromCondition(control.id, data);
                        if ($filtertagtextlist.hasProperty(control.picker.options, id)) {
                            control.picker.updateOption(id, option);
                        }
                        else {
                            control.picker.addOption(option, $filtertagtextlist.hasProperty(userOptions, id));
                        }
                    }
                    else if (!$filtertagtextlist.hasProperty(control.picker.options, id)) {
                        control.picker.addOption(selectedOptions[index], $filtertagtextlist.hasProperty(userOptions, id));
                    }
                });
                control.picker.addItems(ids, true);
            }
            $filtertagtextlist.refreshItems(control.id);
            control.picker.refreshOptions(false);
            $filtertagtextlist.notify(control.id, before, silent);
        },

        addOption(elID, data, user_created = false) {
            var control = $filtertagtextlist.requireControl(elID);

            control.picker.addOption($filtertagtextlist.normalize(control.id, data), user_created);
        },

        addOptions(elID, data, user_created = false) {
            var control = $filtertagtextlist.requireControl(elID);

            var options = data.map(function (item) {
                return $filtertagtextlist.normalize(control.id, item);
            });
            options.forEach(function (item) {
                return control.picker.addOption(item, user_created);
            });
        },

        updateOption(elID, value, data) {
            var control = $filtertagtextlist.requireControl(elID);

            var id = $filtertagtextlist.resolve(control.id, value);
            var option = $filtertagtextlist.normalize(control.id, data);
            if (!id || !$filtertagtextlist.hasProperty(control.picker.options, id)) {
                return;
            }
            if ($filtertagtextlist.isNormalID(id)) {
                throw new Error('FilterTagTextList: 일반 텍스트는 수정할 수 없습니다. setNormalText를 사용하세요');
            }
            if (id !== option._dttlID && $filtertagtextlist.hasProperty(control.picker.options, option._dttlID)) {
                throw new Error('FilterTagTextList: groupID와 key가 중복되었습니다');
            }
            var before = $filtertagtextlist.snapshot(control.id);
            var condition = control.conditions.get(id);
            control.conditions.delete(id);
            if (condition) {
                control.conditions.set(option._dttlID, condition);
            }
            var userCreated = $filtertagtextlist.hasProperty(control.picker.userOptions, id);
            control.picker.updateOption(id, option);
            if (userCreated) {
                delete control.picker.userOptions[id];
                control.picker.userOptions[option._dttlID] = true;
            }
            control.picker.updateOriginalInput({
                silent: true
            });
            $filtertagtextlist.closeEditor(control.id, false);
            $filtertagtextlist.notify(control.id, before, false);
            if (control.picker.isOpen) {
                control.picker.positionDropdown();
            }
        },

        removeOption(elID, value) {
            var control = $filtertagtextlist.requireControl(elID);

            var id = $filtertagtextlist.resolve(control.id, value);
            if (id) {
                control.picker.removeOption(id);
            }
        },

        getOption(elID, value, create = false) {
            var control = $filtertagtextlist.requireControl(elID);

            var id = $filtertagtextlist.resolve(control.id, value);
            return id ? control.picker.getOption(id, create) : null;
        },

        clearFilter(elID, option, value) {
            var control = $filtertagtextlist.requireControl(elID);

            var id = $filtertagtextlist.resolve(control.id, value);
            return control.picker.items.includes(id);
        },

        clearOptions(elID, filter) {
            var control = $filtertagtextlist.requireControl(elID);

            var users = Object.assign({}, control.picker.userOptions);
            $filtertagtextlist.cancelPending(control.id);
            control.picker.clearOptions(function (data, id) {
                return control.picker.items.includes(id) || (filter ? filter.call(control, Object.assign({}, data._dttlRaw), $filtertagtextlist.getOptionReference(id)) === true : false);
            });
            Object.keys(users).forEach(function (id) {
                if ($filtertagtextlist.hasProperty(control.picker.options, id)) {
                    control.picker.userOptions[id] = true;
                }
            });
        },

        clear(elID, silent = false) {
            var control = $filtertagtextlist.requireControl(elID);

            $filtertagtextlist.cancelPending(control.id);
            control.picker.clear(silent === true);
            control.conditions.clear();
            $filtertagtextlist.closeEditor(control.id, false);
            $filtertagtextlist.writeValue(control.id);
        },

        getItem(elID, value) {
            var control = $filtertagtextlist.requireControl(elID);

            var id = $filtertagtextlist.resolve(control.id, value);
            return id ? control.picker.getItem(id) : null;
        },

        addItem(elID, value, silent = false) {
            var control = $filtertagtextlist.requireControl(elID);

            var id = $filtertagtextlist.resolve(control.id, value);
            if (id) {
                control.picker.addItem(id, silent === true);
            }
            else if (control.settings.create && (typeof value === 'string' || typeof value === 'number')) {
                // 후보에 없는 텍스트는 createItem과 같은 규칙으로 일반 텍스트가 된다. 잠금 상태에서도 코드로는 추가할 수 있다.
                $filtertagtextlist.createItem(control.id, String(value), undefined, { silent: silent === true, force: true });
            }
            $filtertagtextlist.writeValue(control.id);
        },

        removeItem(elID, value, silent = false) {
            var control = $filtertagtextlist.requireControl(elID);

            var id = $filtertagtextlist.resolve(control.id, value);
            if (id) {
                control.picker.removeItem(id, silent === true);
            }
            $filtertagtextlist.writeValue(control.id);
        },

        refreshItems(elID) {
            var control = $filtertagtextlist.requireControl(elID);

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
            $filtertagtextlist.updateButtons(control.id);
            $filtertagtextlist.writeValue(control.id);
        },

        // 후보에 없는 입력은 모두 일반 텍스트가 된다. 입력이 후보의 키·표시값과 같으면 그 후보를 선택한다.
        // internal: addItem이 사용하는 { silent, force }. force는 잠금 상태 검사를 건너뛰고 입력창을 지우지 않는다.
        createItem(elID, value, callback, internal) {
            var control = $filtertagtextlist.requireControl(elID);

            internal = internal || {};
            value = (value == null ? control.picker.control_input.value : String(value)).trim();
            if (!value || !control.settings.create || control.destroyed || (!internal.force && control.picker.isLocked) || !control.picker.canCreate(value)) {
                if (callback) {
                    callback();
                }
                return false;
            }
            var existing = $filtertagtextlist.findOptionByText(control.id, value);
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
                    option = $filtertagtextlist.normalOption(parts.key, parts.value);
                } catch (error) {
                    console.warn(error);
                    if (callback) {
                        callback();
                    }
                    return;
                }
                if (!$filtertagtextlist.hasProperty(control.picker.options, option._dttlID)) {
                    control.picker.addOption(option, true);
                }
                control.picker.setCaret(caret);
                control.picker.addItem(option._dttlID, internal.silent === true);
                if (!internal.force) {
                    control.picker.setTextboxValue('');
                }
                if (callback) {
                    callback({ logic: control.settings.defaultLogic, operator: control.settings.defaultOperator, key: parts.key, value: parts.value });
                }
            };
            try {
                if (typeof control.settings.create === 'function') {
                    // 함수가 돌려준 데이터는 그룹을 무시하고 valueField를 key, labelField를 value로 사용한다.
                    var finish = function (data) {
                        done($filtertagtextlist.fromCreateResult(control.id, data));
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
                    done($filtertagtextlist.parseNormalText(value));
                }
            } catch (error) {
                console.warn(error);
                done();
            }
            return true;
        },

        // create 함수가 돌려준 데이터를 일반 텍스트의 key·value로 바꾼다. labelField가 없거나 valueField와 같으면 key 없이 value만 사용한다.
        fromCreateResult(elID, data) {
            var control = $filtertagtextlist.requireControl(elID);

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
            var control = $filtertagtextlist.requireControl(elID);

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
                            return $filtertagtextlist.normalize(control.id, item);
                        });
                        groups.forEach(function (group) {
                            return $filtertagtextlist.addOptionGroup(control.id, group.value, group);
                        });
                        normalized.forEach(function (option) {
                            return control.picker.addOption(option);
                        });
                        control.picker.refreshOptions(control.picker.isFocused);
                        $filtertagtextlist.trigger(control.id, 'load', data.map(function (item) {
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
            var control = $filtertagtextlist.requireControl(elID);

            control.picker.addOptionGroup(String(id), Object.assign({}, data, {
                value: String(id)
            }));
            $filtertagtextlist.refreshItems(elID);
        },

        removeOptionGroup(elID, id) {
            var control = $filtertagtextlist.requireControl(elID);

            control.picker.removeOptionGroup(String(id));
            $filtertagtextlist.refreshItems(elID);
        },

        clearOptionGroups(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            control.picker.clearOptionGroups();
            $filtertagtextlist.refreshItems(elID);
        },

        lock(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            control.explicitLock = true;
            $filtertagtextlist.closeEditor(control.id, false);
            control.picker.lock();
            $filtertagtextlist.updateButtons(control.id);
        },

        unlock(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            control.explicitLock = false;
            if (!control.creating && !control.picker.isDisabled) {
                control.picker.unlock();
            }
            $filtertagtextlist.updateButtons(control.id);
        },

        disable(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            $filtertagtextlist.closeEditor(control.id, false);
            control.picker.disable();
            $filtertagtextlist.updateButtons(control.id);
        },

        enable(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            control.picker.enable();
            if (control.explicitLock || control.creating) {
                control.picker.lock();
            }
            $filtertagtextlist.updateButtons(control.id);
        },

        sync(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var before = $filtertagtextlist.snapshot(control.id);
            var records = Array.from(control.source.options).map(function (option) {
                var ref = $filtertagtextlist.getOptionReference(option.value);
                var currentOption = control.picker.options[option.value];
                var raw = Object.assign({}, currentOption ? currentOption._dttlRaw : undefined, {
                    [control.settings.optgroupField]: ref.groupID,
                    [control.settings.valueField]: ref.key,
                    [control.settings.labelField]: option.text
                });
                return {
                    data: $filtertagtextlist.normalize(control.id, raw),
                    selected: option.selected
                };
            });
            var conditions = new Map(control.conditions);
            $filtertagtextlist.setValue(control.id, records.map(function (record) {
                return record.data._dttlRaw;
            }), true);
            control.picker.clear(true);
            control.conditions = conditions;
            // 해제 과정에서 정리된 범위·일반 텍스트 후보를 선택 항목으로 되살린다.
            records.forEach(function (record) {
                if (record.selected && !$filtertagtextlist.hasProperty(control.picker.options, record.data._dttlID)) {
                    control.picker.addOption(record.data, true);
                }
            });
            control.picker.addItems(records.filter(function (record) {
                return record.selected;
            }).map(function (record) {
                return record.data._dttlID;
            }), true);
            $filtertagtextlist.refreshItems(control.id);
            if (control.source.disabled) {
                $filtertagtextlist.disable(control.id);
            }
            else {
                $filtertagtextlist.enable(control.id);
            }
            $filtertagtextlist.notify(control.id, before, false);
        },

        destroy(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            if (control.destroyed) {
                return;
            }
            $filtertagtextlist.trigger(control.id, 'destroy');
            $filtertagtextlist.cancelPending(control.id);
            control.destroyed = true;
            clearTimeout(control.picker.refreshTimeout);
            $filtertagtextlist.closeEditor(control.id, false);
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
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.getAdjacent(element, direction);
        },

        refreshOptions(elID, triggerDropdown) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.refreshOptions(triggerDropdown);
        },

        open(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.open();
        },

        close(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.close();
        },

        positionDropdown(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            control.picker.positionDropdown();
            if (control.editor) {
                $filtertagtextlist.positionEditor(elID);
            }
        },

        focus(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.focus();
        },

        blur(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.blur();
        },

        setCaret(elID, index) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.setCaret(index);
        },

        isFull(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.isFull();
        },

        clearCache(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.clearCache();
        },

        setTextboxValue(elID, str) {
            var control = $filtertagtextlist.requireControl(elID);

            return control.picker.setTextboxValue(str);
        },

        getControl(elID) {
            var result = null;
            for (var i = 0, length = $filtertagtextlist.textListControls.length; i < length; i++) {
                var control = $filtertagtextlist.textListControls[i];
                if (control.id === elID) {
                    result = control;
                    break;
                }
            }
            return result;
        },

        requireControl(elID) {
            var control = $filtertagtextlist.getControl(elID);
            if (!control) {
                throw new Error('FilterTagTextList: 컨트롤이 초기화되지 않았습니다: ' + elID);
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
                throw new TypeError('FilterTagTextList: ' + field + '은(는) ' + (empty ? '' : '비어 있지 않은 ') + '문자열 또는 숫자여야 합니다');
            }
            return String(value);
        },

        initialize(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            $filtertagtextlist.trigger(control.id, 'initialize');
            if (control.settings.preload === true && control.destroyed !== true) {
                $filtertagtextlist.load(control.id, '');
            }
        },

        listen(elID, element, event, handler, capture = false) {
            var control = $filtertagtextlist.requireControl(elID);

            element.addEventListener(event, handler, capture);
            control.cleanups.push(function () {
                return element.removeEventListener(event, handler, capture);
            });
        },

        // 조건 정보가 없는 항목의 기본 연결·비교. defaultLogic, defaultOperator 설정(기본 OR, contains)을 반환한다.
        getDefaultCondition(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            return {
                logic: control.settings.defaultLogic,
                operator: control.settings.defaultOperator
            };
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
                    return $filtertagtextlist.hasProperty(value, key);
                });
                var explicit = ['logic', 'operator'].some(function (key) {
                    return $filtertagtextlist.hasProperty(value, key);
                });
                var collision = !!settings && (settings.optgroupField === 'groupID' || settings.valueField === 'key');
                if (hasCore && (explicit || !collision)) {
                    result = 'condition';
                }
            }

            return result;
        },

        normalize(elID, data) {
            var control = $filtertagtextlist.requireControl(elID);

            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                throw new TypeError('FilterTagTextList: option은 객체여야 합니다');
            }
            // key는 빈 문자열도 허용한다('전체'처럼 값이 없는 후보). 내부 ID에 groupID가 들어가므로 그룹이 다르면 같은 빈 key도 충돌하지 않는다.
            var key = $filtertagtextlist.normalizeScalar(data[control.settings.valueField], 'key', true);
            var groupID = $filtertagtextlist.normalizeScalar(data[control.settings.optgroupField] == null ? '' : data[control.settings.optgroupField], 'groupID', true);
            var value = $filtertagtextlist.normalizeScalar(data[control.settings.labelField], 'value', true);
            if (groupID === $filtertagtextlist.normalGroup) {
                // 일반 텍스트 전용 그룹은 내부 키(key NUL value)로만 만들 수 있다. 표시값은 내부 키의 value를 사용한다.
                if (key.indexOf('\u0000') < 0) {
                    throw new TypeError('FilterTagTextList: 예약된 groupID입니다: ' + groupID);
                }
                value = $filtertagtextlist.getNormalParts({ _dttlKey: key }).value;
            }
            return {
                _dttlID: $filtertagtextlist.getOptionID(groupID, key),
                _dttlKey: key,
                _dttlGroup: groupID,
                _dttlLabel: value,
                _dttlRaw: Object.assign({}, data)
            };
        },

        condition(elID, data) {
            var control = $filtertagtextlist.requireControl(elID);

            var groupID = $filtertagtextlist.normalizeScalar(data.groupID, 'groupID', true);
            var key = $filtertagtextlist.normalizeScalar(data.key, 'key', true);
            var value = $filtertagtextlist.normalizeScalar(data.value, 'value', true);
            // logic, operator를 생략하면 defaultLogic, defaultOperator(기본 OR, contains)를 사용한다.
            var logic = data.logic == null ? control.settings.defaultLogic : data.logic;
            var operator = data.operator == null ? control.settings.defaultOperator : data.operator;
            if (!['AND', 'OR'].includes(logic) || !$filtertagtextlist.hasProperty($filtertagtextlist.operators, operator)) {
                throw new TypeError('FilterTagTextList: logic 또는 operator가 올바르지 않습니다');
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
            var control = $filtertagtextlist.requireControl(elID);

            return $filtertagtextlist.normalize(control.id, {
                [control.settings.optgroupField]: data.groupID,
                [control.settings.valueField]: data.key,
                [control.settings.labelField]: data.value
            });
        },

        resolve(elID, value) {
            var control = $filtertagtextlist.requireControl(elID);

            if (value instanceof HTMLElement) {
                return value.dataset.value;
            }
            if (value && typeof value === 'object') {
                return $filtertagtextlist.getOptionID($filtertagtextlist.normalizeScalar(value.groupID, 'groupID', true), $filtertagtextlist.normalizeScalar(value.key, 'key', true));
            }
            // 빈 문자열('')은 빈 key를 가진 후보를 찾는다. 여러 그룹에 있으면 모호하므로 {groupID, key}를 사용해야 한다.
            var key = $filtertagtextlist.normalizeScalar(value, 'key', true);
            var matches = Object.keys(control.picker.options).filter(function (id) {
                return control.picker.options[id]._dttlKey === key;
            });
            if (matches.length > 1) {
                throw new Error('FilterTagTextList: key가 모호합니다. {groupID, key}를 사용하세요');
            }
            return matches[0];
        },

        relay(elID, event, args) {
            var control = $filtertagtextlist.requireControl(elID);

            if (event === 'initialize' || event === 'destroy' || !control.ready || control.destroyed) {
                return;
            }
            // groupChangeClearsText:true이면 그룹 버튼의 목록이 열린 동안 후보 그룹의 선택이 바뀔 때(선택·해제·전체 토글) 일반 텍스트를 지운다.
            // 범위 조건과 일반 텍스트 자신의 변경은 제외하며, 옵션이 정리되기 전에 판단한다.
            var groupChange = false;
            if (control.settings.groupChangeClearsText === true && control.navFilter && (event === 'item_add' || event === 'item_remove')) {
                var changed = control.picker.options[args[0]];
                groupChange = !!changed && changed._dttlGroup !== $filtertagtextlist.normalGroup && $filtertagtextlist.getRangeKind(control.id, changed._dttlGroup) === '';
            }
            if (event === 'change') {
                $filtertagtextlist.writeValue(control.id);
                args = [$filtertagtextlist.getValue(control.id), $filtertagtextlist.getNormalText(control.id)];
            }
            else if (event === 'item_add' || event === 'item_remove' || event === 'option_add' || event === 'option_remove') {
                var id = args[0];
                // 조건은 제거·정리 전에 읽는다. 일반 텍스트의 option 이벤트도 logic, operator 기본값을 포함한다.
                var conditionItem = event === 'item_add' || event === 'item_remove' || $filtertagtextlist.isNormalID(id) ? $filtertagtextlist.getConditionItem(control.id, id) : null;
                if (event === 'item_remove') {
                    $filtertagtextlist.closeEditor(control.id, false);
                    // 범위 입력과 일반 텍스트로 만든 후보는 해제 후 후보 목록에 남기지 않는다.
                    // 이때 발생하는 option_remove가 조건을 읽을 수 있도록 조건은 정리한 뒤에 지운다.
                    if (($filtertagtextlist.getRangeSide(control.id, args[0]) || $filtertagtextlist.isNormalID(args[0])) && $filtertagtextlist.hasProperty(control.picker.options, args[0])) {
                        control.picker.removeOption(args[0], true);
                    }
                    control.conditions.delete(args[0]);
                }
                args = args.slice();
                args[0] = $filtertagtextlist.getOptionReference(args[0]);
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
                $filtertagtextlist.closeEditor(control.id, false);
                $filtertagtextlist.purgeRangeOptions(control.id);
                $filtertagtextlist.purgeNormalOptions(control.id);
            }
            if (event === 'item_add' || event === 'clear' || event === 'blur') {
                $filtertagtextlist.hideSuggest(control.id);
            }
            if (control.settings.groupNavMode === 'menu' && control.nav) {
                if (event === 'dropdown_close' && control.navFilter) {
                    // 목록이 닫히면 다음에 여는 목록(포커스·입력)은 모든 그룹을 보여준다.
                    control.navFilter = '';
                    control.menuAnchor = null;
                    control.picker.refreshOptions(false);
                }
                if (event === 'dropdown_open' || event === 'dropdown_close' || event === 'change' || event === 'item_add' || event === 'item_remove' || event === 'clear' || event === 'option_add' || event === 'option_remove') {
                    // 그룹 버튼의 열림 표시와 선택할 후보가 없는 그룹의 비활성 상태, 새로 생기거나 없어진 그룹 버튼을 반영한다.
                    $filtertagtextlist.updateGroupNav(control.id);
                }
            }
            $filtertagtextlist.writeValue(control.id);
            $filtertagtextlist.trigger(control.id, event, ...args);
            if (groupChange) {
                $filtertagtextlist.clearNormalItems(control.id);
            }
            if (event === 'focus' && control.settings.preload === 'focus' && !control.preloaded && control.destroyed !== true) {
                control.preloaded = true;
                $filtertagtextlist.load(control.id, '');
            }
        },

        // 일반 텍스트 태그를 모두 지운다(후보·범위 조건은 지우지 않는다). 태그마다 item_remove 이벤트가 발생한다. groupChangeClearsText에서 사용한다.
        clearNormalItems(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var picker = control.picker;
            if (picker.isLocked || picker.isDisabled || control.destroyed) {
                return;
            }
            picker.items.filter(function (id) {
                return $filtertagtextlist.isNormalID(id);
            }).forEach(function (id) {
                picker.removeItem(id);
            });
        },

        writeValue(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            control.host.value = JSON.stringify($filtertagtextlist.getValue(control.id));
            // 선택하지 않은 후보와 변경한 표시명도 기반 select에 반영하여 sync()에 사용한다.
            Array.from(control.source.options).forEach(function (option) {
                if (!$filtertagtextlist.hasProperty(control.picker.options, option.value)) {
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
            $filtertagtextlist.updateButtons(control.id);
        },

        notify(elID, before, silent) {
            var control = $filtertagtextlist.requireControl(elID);

            $filtertagtextlist.writeValue(control.id);
            if (!silent && before !== $filtertagtextlist.snapshot(control.id)) {
                control.picker.trigger('change', control.picker.getValue());
            }
        },

        cancelPending(elID) {
            var control = $filtertagtextlist.requireControl(elID);

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
            var control = $filtertagtextlist.requireControl(elID);

            control.picker.control.querySelectorAll('button').forEach(function (button) {
                button.disabled = control.picker.isLocked || control.picker.isDisabled;
            });
            control.picker.control.querySelectorAll('.dttl-group').forEach(function (group) {
                var disabled = control.picker.isLocked || control.picker.isDisabled;
                if (group.closest('.dttl-fixed')) {
                    return;
                }
                group.tabIndex = disabled ? -1 : 0;
                group.setAttribute('aria-disabled', String(disabled));
            });
            control.picker.control.querySelectorAll('.dttl-fixed .dttl-edit').forEach(function (button) {
                button.tabIndex = -1;
            });
            if (control.ranges) {
                control.ranges.querySelectorAll('button').forEach(function (button) {
                    var range = $filtertagtextlist.getRange(control.id, button.dataset.group);
                    var active = range.start !== '' || range.end !== '';
                    button.disabled = control.picker.isLocked || control.picker.isDisabled;
                    button.classList.toggle('dttl-range-active', active);
                    button.setAttribute('aria-pressed', String(active));
                });
            }
            if (control.nav) {
                control.nav.querySelectorAll('button[data-range-group]').forEach(function (button) {
                    var range = $filtertagtextlist.getRange(control.id, button.dataset.rangeGroup);
                    var active = range.start !== '' || range.end !== '';
                    button.disabled = control.picker.isLocked || control.picker.isDisabled;
                    button.classList.toggle('dttl-range-active', active);
                    button.setAttribute('aria-pressed', String(active));
                });
            }
        },

        onTagClick(elID, event) {
            var control = $filtertagtextlist.requireControl(elID);

            var target = event.target.closest('.dttl-group,.dttl-edit,.dttl-remove');
            if (!target || !control.picker.control.contains(target)) {
                if (control.editor) {
                    $filtertagtextlist.closeEditor(elID, false);
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
                $filtertagtextlist.removeItem(control.id, item);
                $filtertagtextlist.focus(control.id);
            }
            else {
                $filtertagtextlist.editCondition(control.id, item);
            }
        },

        editCondition(elID, item) {
            var control = $filtertagtextlist.requireControl(elID);

            if (control.picker.isLocked || control.picker.isDisabled) {
                return;
            }
            var id = item.dataset.value;
            // 범위 입력으로 만든 시작·끝 조건은 시작과 끝을 함께 편집한다.
            if ($filtertagtextlist.getRangeSide(control.id, id)) {
                return $filtertagtextlist.openRange(control.id, $filtertagtextlist.getOptionReference(id).groupID, item);
            }
            // conditionEditable:false이면 연결·비교 편집창을 열지 않는다(range 태그의 범위 편집창은 위에서 열린다).
            if (control.settings.conditionEditable === false) {
                return;
            }
            $filtertagtextlist.hideSuggest(control.id);
            $filtertagtextlist.closeEditor(control.id, false);
            var current = control.conditions.get(id) || $filtertagtextlist.getDefaultCondition(control.id);
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
            var operator = field('비교', $filtertagtextlist.operators, current.operator, 'data-dttl-operator');
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
                var before = $filtertagtextlist.snapshot(control.id);
                var previous = {
                    logic: current.logic,
                    operator: current.operator
                };
                control.conditions.set(id, {
                    logic: logic.value,
                    operator: operator.value
                });
                $filtertagtextlist.refreshItems(control.id);
                $filtertagtextlist.closeEditor(control.id, true);
                $filtertagtextlist.notify(control.id, before, false);
                // change 다음에 변경된 항목 하나만 option_change로 전달한다.
                if (!control.destroyed && (previous.logic !== logic.value || previous.operator !== operator.value) && $filtertagtextlist.hasProperty(control.picker.options, id)) {
                    $filtertagtextlist.trigger(control.id, 'option_change', $filtertagtextlist.getConditionItem(control.id, id), previous);
                }
            });
            cancel.addEventListener('click', function () {
                return $filtertagtextlist.closeEditor(control.id, true);
            });
            editor.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    $filtertagtextlist.closeEditor(control.id, true);
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
            $filtertagtextlist.positionEditor(elID);
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

            throw new TypeError('FilterTagTextList: ' + name + '은(는) auto' +
                (name === 'dropdownWidth' ? ', 100% 또는' : ' 또는') + ' 양의 픽셀 값이어야 합니다');
        },

        // 드롭다운 목록 위쪽에 optgroup으로 바로 이동하는 버튼 그룹을 만든다. 보이는 그룹이 둘 이상일 때만 표시한다(groupNav:false이면 만들지 않는다).
        // rangeLayout:'nav'이면 같은 버튼 그룹 끝에 range 그룹의 범위 버튼(년월일·년월·시간)도 넣으며, 누르면 범위 편집창을 연다.
        createGroupNav(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var nav = document.createElement('div');
            nav.className = 'dttl-group-nav';
            nav.setAttribute('role', 'group');
            nav.setAttribute('aria-label', '그룹 이동');
            nav.hidden = true;
            control.nav = nav;
            control.navSignature = '';
            control.navActive = '';
            control.navUntil = 0;
            var menu = control.settings.groupNavMode === 'menu';
            if (menu) {
                // 입력 영역 안쪽 왼쪽에 버튼을 고정하고, 버튼을 누르면 그 버튼 아래에 해당 그룹의 목록을 연다.
                nav.classList.add('dttl-nav-inline');
                // TomSelect는 입력 영역 안에서 앞쪽 형제 요소의 개수로 항목 위치(삭제·캐럿)를 계산하므로 항목보다 앞에 DOM을 두면 위치가 어긋난다.
                // 버튼 줄은 DOM 맨 뒤에 붙이고 CSS order로 화면의 맨 앞에 보여준다.
                control.picker.control.append(nav);
            }
            else {
                control.picker.dropdown.insertBefore(nav, control.picker.dropdown_content);
            }
            // 버튼을 눌러도 입력 영역의 포커스를 유지하여 드롭다운이 닫히지 않게 한다. 입력 영역 안의 버튼은 TomSelect의 입력 영역 mousedown 처리도 막는다.
            $filtertagtextlist.listen(control.id, nav, 'mousedown', function (event) {
                event.preventDefault();
                if (menu) {
                    event.stopPropagation();
                }
            });
            $filtertagtextlist.listen(control.id, nav, 'click', function (event) {
                if (menu) {
                    // 열려 있는 목록에서 입력 영역을 누르면 TomSelect가 blur하여 닫으므로 click도 전파하지 않는다.
                    event.stopPropagation();
                }
                var rangeButton = event.target.closest('button[data-range-group]');
                if (rangeButton && nav.contains(rangeButton)) {
                    // 드롭다운이 닫히므로 편집창은 menu 모드에서는 누른 버튼 아래에, 그 밖에는 입력 영역 아래에 표시한다.
                    $filtertagtextlist.openRange(control.id, rangeButton.dataset.rangeGroup, menu ? rangeButton : control.picker.control);
                    return;
                }
                var button = event.target.closest('button[data-group]');
                if (button && nav.contains(button)) {
                    if (menu) {
                        $filtertagtextlist.toggleGroupMenu(control.id, button.dataset.group, button);
                    }
                    else {
                        $filtertagtextlist.scrollToGroup(control.id, button.dataset.group);
                    }
                }
            });
            var frame = 0;
            $filtertagtextlist.listen(control.id, control.picker.dropdown_content, 'scroll', function () {
                if (frame || Date.now() < control.navUntil) {
                    return;
                }
                frame = requestAnimationFrame(function () {
                    frame = 0;
                    if (!control.destroyed) {
                        $filtertagtextlist.syncGroupNav(control.id);
                    }
                });
            });
            control.cleanups.push(function () {
                if (frame) {
                    cancelAnimationFrame(frame);
                }
            });
            $filtertagtextlist.updateGroupNav(control.id);
        },

        // 현재 목록에 그려진 optgroup(헤더가 있는 것)을 반환한다. 범위 그룹처럼 후보가 없는 그룹은 포함되지 않는다.
        getRenderedGroups(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            return Array.from(control.picker.dropdown_content.querySelectorAll('.optgroup[data-group]')).filter(function (group) {
                return group.querySelector('.optgroup-header') !== null;
            });
        },

        updateGroupNav(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            if (!control.nav) {
                return;
            }
            // 그룹 버튼은 groupNav:false이거나 (scroll 모드에서) 그룹이 하나뿐이면 만들지 않는다. 범위 버튼(rangeLayout:'nav')은 range 그룹이 있으면 항상 만든다.
            // menu 모드는 누른 그룹만 목록에 그려지므로 후보 데이터에서 그룹을 구하며 그룹이 하나여도 버튼을 만든다.
            var menuMode = control.settings.groupNavMode === 'menu';
            var groups = control.settings.groupNav === false ? [] : menuMode ? $filtertagtextlist.getFilterGroups(control.id) : $filtertagtextlist.getRenderedGroups(control.id).map(function (group) {
                return { id: group.dataset.group, label: group.querySelector('.optgroup-header').textContent };
            });
            if (groups.length < 2 && !menuMode) {
                groups = [];
            }
            if (control.navFilter && !groups.some(function (group) { return group.id === control.navFilter; })) {
                // 고른 그룹의 후보가 없어졌으면 전체 목록으로 되돌리고 다시 그린다(refreshOptions가 이 함수를 다시 부르므로 무한 반복하지 않는다).
                control.navFilter = '';
                control.menuAnchor = null;
                control.picker.refreshOptions(false);
                return;
            }
            var ranges = control.settings.rangeLayout === 'nav' ? Object.keys(control.picker.optgroups).filter(function (groupID) {
                return $filtertagtextlist.getRangeKind(control.id, groupID) !== '';
            }) : [];
            var signature = groups.map(function (group) {
                return group.id + '\u0000' + group.label;
            }).concat(ranges.map(function (groupID) {
                return 'range\u0000' + groupID + '\u0000' + $filtertagtextlist.getRangeLabel(control.id, groupID);
            })).join('\u0001');
            var visible = groups.length > 0 || ranges.length > 0;
            if (signature !== control.navSignature) {
                control.navSignature = signature;
                control.navActive = '';
                control.nav.textContent = '';
                var buttons = document.createElement('div');
                buttons.className = 'btn-group';
                buttons.setAttribute('role', 'group');
                var size = menuMode ? ' btn-sm' : '';
                groups.forEach(function (group) {
                    var button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'btn' + size;
                    button.tabIndex = -1;
                    button.dataset.group = group.id;
                    if (menuMode) {
                        // 선택한 값을 이어 붙이면 길어지므로 글자만 줄임표로 자르고 목록을 여는 화살표(::after)는 항상 보이게 한다.
                        var text = document.createElement('span');
                        text.className = 'dttl-nav-text';
                        text.textContent = group.label;
                        button.append(text);
                        button.setAttribute('aria-haspopup', 'listbox');
                        button.setAttribute('aria-expanded', 'false');
                    }
                    else {
                        button.textContent = group.label;
                    }
                    buttons.append(button);
                });
                ranges.forEach(function (groupID) {
                    var label = $filtertagtextlist.getRangeLabel(control.id, groupID);
                    var button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'btn dttl-nav-range' + size;
                    button.tabIndex = -1;
                    button.dataset.rangeGroup = groupID;
                    button.dataset.range = $filtertagtextlist.getRangeKind(control.id, groupID);
                    if (menuMode) {
                        var rangeText = document.createElement('span');
                        rangeText.className = 'dttl-nav-text';
                        rangeText.textContent = label;
                        button.append(rangeText);
                    }
                    else {
                        button.textContent = label;
                    }
                    button.setAttribute('aria-label', label.replace(' · ', ' ') + ' 범위 입력');
                    buttons.append(button);
                });
                control.nav.append(buttons);
                $filtertagtextlist.updateButtons(control.id);
                if (control.navFilter) {
                    // 버튼을 다시 만들었으면 열려 있는 목록의 기준 버튼도 새 버튼으로 바꾼다.
                    control.menuAnchor = Array.from(control.nav.querySelectorAll('button[data-group]')).find(function (button) {
                        return button.dataset.group === control.navFilter;
                    }) || null;
                }
            }
            control.nav.hidden = !visible;
            if (menuMode) {
                $filtertagtextlist.updateNavLabels(control.id);
                $filtertagtextlist.markGroupMenu(control.id);
                // 글자가 바뀌어 버튼 폭이 달라지면 열려 있는 목록의 최소 폭도 다시 맞춘다.
                $filtertagtextlist.alignGroupMenu(control.id);
            }
            else {
                control.picker.dropdown.classList.toggle('dttl-has-nav', visible);
                if (visible) {
                    $filtertagtextlist.syncGroupNav(control.id);
                }
            }
        },

        // menu 모드에서 그룹 버튼에 표시할 그룹을 후보 데이터에서 구한다(범위·일반 텍스트 그룹과 후보가 없는 그룹은 제외).
        getFilterGroups(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var picker = control.picker;
            var present = {};
            Object.keys(picker.options).forEach(function (id) {
                present[picker.options[id]._dttlGroup] = true;
            });
            return Object.keys(picker.optgroups).filter(function (groupID) {
                return groupID !== $filtertagtextlist.normalGroup && present[groupID] === true && picker.optgroups[groupID].label != null &&
                    $filtertagtextlist.getRangeKind(control.id, groupID) === '';
            }).map(function (groupID) {
                return { id: groupID, label: String(picker.optgroups[groupID].label) };
            });
        },

        // groupSelectAll:true일 때 그룹의 빈 key 후보('전체')를 누르면 호출한다. 그 그룹의 후보(빈 key 후보 포함)가 모두 선택되어 있으면 모두 해제하고,
        // 하나라도 선택되지 않았으면 모두 선택한다. 선택·해제는 후보를 하나씩 선택·해제할 때와 같은 이벤트를 발생시킨다.
        toggleGroupAll(elID, groupID) {
            var control = $filtertagtextlist.requireControl(elID);

            var picker = control.picker;
            if (picker.isLocked || picker.isDisabled || control.destroyed) {
                return;
            }
            var ids = Object.keys(picker.options).filter(function (id) {
                return picker.options[id]._dttlGroup === groupID;
            });
            var all = ids.length > 0 && ids.every(function (id) {
                return picker.items.includes(id);
            });
            ids.forEach(function (id) {
                if (all) {
                    picker.removeItem(id);
                }
                else if (!picker.items.includes(id)) {
                    picker.addItem(id);
                }
            });
            picker.lastQuery = null;
            picker.refreshOptions(false);
        },

        // menu 모드: 그룹 버튼을 누르면 그 버튼 아래에 해당 그룹의 후보만 목록으로 연다. 열려 있는 같은 버튼을 다시 누르면 닫고,
        // 다른 버튼을 누르면 목록을 그 그룹으로 바꾼다. 입력창의 텍스트와 포커스는 그대로 두며 검색어는 그 그룹 안에서만 찾는다.
        toggleGroupMenu(elID, groupID, anchor) {
            var control = $filtertagtextlist.requireControl(elID);

            var picker = control.picker;
            if (picker.isLocked || picker.isDisabled || control.destroyed) {
                return;
            }
            groupID = String(groupID);
            $filtertagtextlist.hideSuggest(control.id);
            $filtertagtextlist.closeEditor(control.id, false);
            if (picker.isOpen && control.navFilter === groupID) {
                picker.close();
                return;
            }
            control.navFilter = groupID;
            control.menuAnchor = anchor || null;
            if (!picker.isFocused) {
                picker.focus();
            }
            picker.refreshOptions(false);
            if (!picker.isOpen) {
                picker.open();
            }
            picker.dropdown_content.scrollTop = 0;
            picker.positionDropdown();
            $filtertagtextlist.markGroupMenu(control.id);
        },

        // selectedDisplay:'text'이면 그룹 버튼 글자에 선택한 값을 콤마로 이어 붙이고(예: 직위 명: 팀장, 부장) 범위 버튼에는 선택한 범위를 보여준다.
        // 선택한 값이 있는 버튼은 dttl-has-value로 표시하며 전체 글자는 title로도 제공한다. 'tag'이면 항상 기본 이름이다.
        updateNavLabels(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            if (!control.nav) {
                return;
            }
            var picker = control.picker;
            var text = control.settings.selectedDisplay === 'text';
            var values = {};
            if (text) {
                picker.items.forEach(function (id) {
                    var option = picker.options[id];
                    if (!option || option._dttlGroup === $filtertagtextlist.normalGroup || $filtertagtextlist.getRangeKind(control.id, option._dttlGroup) !== '') {
                        return;
                    }
                    (values[option._dttlGroup] = values[option._dttlGroup] || []).push(String(option._dttlLabel));
                });
            }
            Array.from(control.nav.querySelectorAll('button[data-group]')).forEach(function (button) {
                var group = picker.optgroups[button.dataset.group];
                var base = group && group.label != null ? String(group.label) : button.dataset.group;
                var names = values[button.dataset.group] || [];
                var full = names.length ? base + ': ' + names.join(', ') : base;
                // 선택한 값이 있으면 버튼에는 값만(예: 부장, 팀장) 보이고 그룹 이름을 포함한 전체 글자는 툴팁(title)과 접근성 이름으로 제공한다.
                var shown = names.length ? names.join(', ') : base;
                var target = button.querySelector('.dttl-nav-text') || button;
                if (target.textContent !== shown) {
                    target.textContent = shown;
                }
                button.title = names.length ? full : '';
                button.setAttribute('aria-label', full);
                button.classList.toggle('dttl-has-value', names.length > 0);
            });
            Array.from(control.nav.querySelectorAll('button[data-range-group]')).forEach(function (button) {
                var groupID = button.dataset.rangeGroup;
                var base = $filtertagtextlist.getRangeLabel(control.id, groupID);
                var range = text ? $filtertagtextlist.getRange(control.id, groupID) : { start: '', end: '' };
                var group = picker.optgroups[groupID];
                var groupLabel = group && group.label != null ? String(group.label) : groupID || '기타';
                var set = range.start !== '' || range.end !== '';
                var value = [range.start !== '' ? range.start : '', '~', range.end].filter(Boolean).join(' ');
                var full = set ? groupLabel + ': ' + value : base;
                // 범위를 선택했으면 버튼에는 값만(예: 2026-01-01 ~ 2026-01-31) 보이고 그룹 이름을 포함한 전체 글자는 title과 접근성 이름으로 제공한다.
                var shown = set ? value : base;
                var target = button.querySelector('.dttl-nav-text') || button;
                if (target.textContent !== shown) {
                    target.textContent = shown;
                }
                button.title = set ? full : '';
                button.setAttribute('aria-label', set ? full : base.replace(' · ', ' ') + ' 범위 입력');
            });
        },

        // 열린 그룹 버튼을 활성으로 표시하고, 선택하지 않은 후보가 없는 그룹의 버튼은 비활성으로 한다(열려 있는 버튼은 닫을 수 있도록 유지).
        markGroupMenu(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            if (!control.nav) {
                return;
            }
            var picker = control.picker;
            var available = {};
            Object.keys(picker.options).forEach(function (id) {
                var option = picker.options[id];
                if (!picker.settings.hideSelected || !picker.items.includes(id)) {
                    available[option._dttlGroup] = true;
                }
            });
            Array.from(control.nav.querySelectorAll('button[data-group]')).forEach(function (button) {
                var active = picker.isOpen && button.dataset.group === control.navFilter;
                button.classList.toggle('active', active);
                button.setAttribute('aria-expanded', String(active));
                button.disabled = !active && available[button.dataset.group] !== true;
            });
        },

        // 메뉴(목록)를 연 그룹 버튼 아래로 드롭다운을 옮긴다. 버튼 폭과 내용에 맞추되 입력 영역 오른쪽을 넘지 않게 하고, 메뉴가 아니면 원래 위치로 되돌린다.
        alignGroupMenu(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var picker = control.picker;
            var dropdown = picker.dropdown;
            var anchor = control.menuAnchor;
            if (!anchor || !control.navFilter || !anchor.isConnected || !picker.isOpen) {
                if (control.menuAligned) {
                    control.menuAligned = false;
                    dropdown.classList.remove('dttl-group-menu');
                    dropdown.style.left = '';
                    dropdown.style.top = '';
                    dropdown.style.minWidth = '';
                }
                return;
            }
            dropdown.classList.add('dttl-group-menu');
            var body = picker.settings.dropdownParent === 'body';
            var wrapper = picker.wrapper.getBoundingClientRect();
            var rect = anchor.getBoundingClientRect();
            var limit = body ? document.documentElement.clientWidth : wrapper.width;
            control.menuAligned = true;
            dropdown.style.minWidth = Math.max(Math.ceil(rect.width), 140) + 'px';
            dropdown.style.maxWidth = Math.max(1, limit) + 'px';
            dropdown.style.width = 'max-content';
            var left = body ? rect.left + window.scrollX : rect.left - wrapper.left;
            var top = body ? rect.bottom + window.scrollY : rect.bottom - wrapper.top;
            var offset = body ? window.scrollX : 0;
            left = Math.max(offset, Math.min(left, offset + limit - dropdown.offsetWidth));
            dropdown.style.left = left + 'px';
            dropdown.style.top = top + 'px';
        },

        // 상단에 닿은 헤더의 그룹 버튼을 활성으로 표시한다.
        syncGroupNav(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            if (!control.nav || control.nav.hidden || control.settings.groupNavMode === 'menu') {
                return;
            }
            var content = control.picker.dropdown_content;
            var groups = $filtertagtextlist.getRenderedGroups(control.id);
            var active = groups.length ? groups[0].dataset.group : '';
            groups.forEach(function (group) {
                if ($filtertagtextlist.getGroupScrollTop(content, group) <= content.scrollTop + 1) {
                    active = group.dataset.group;
                }
            });
            // 끝까지 스크롤하면 짧은 마지막 그룹도 활성으로 표시한다.
            if (groups.length && content.scrollHeight > content.clientHeight && content.scrollTop + content.clientHeight >= content.scrollHeight - 1) {
                active = groups[groups.length - 1].dataset.group;
            }
            $filtertagtextlist.setGroupNavActive(control.id, active);
        },

        setGroupNavActive(elID, groupID) {
            var control = $filtertagtextlist.requireControl(elID);

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
            var control = $filtertagtextlist.requireControl(elID);

            var group = $filtertagtextlist.getRenderedGroups(control.id).find(function (item) {
                return item.dataset.group === String(groupID);
            });
            if (!group) {
                return;
            }
            var content = control.picker.dropdown_content;
            // 이동하는 동안에는 스크롤 이벤트로 활성 버튼을 다시 계산하지 않는다.
            control.navUntil = Date.now() + 700;
            $filtertagtextlist.setGroupNavActive(control.id, String(groupID));
            content.scrollTo({
                top: $filtertagtextlist.getGroupScrollTop(content, group),
                behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
            window.setTimeout(function () {
                if (!control.destroyed) {
                    $filtertagtextlist.syncGroupNav(control.id);
                }
            }, 750);
        },

        sizeDropdown(elID) {
            var control = $filtertagtextlist.requireControl(elID);
            var picker = control.picker;
            var dropdown = picker.dropdown;
            var content = picker.dropdown_content;
            var width = $filtertagtextlist.normalizeDropdownSize(control.settings.dropdownWidth, 'dropdownWidth');
            var height = $filtertagtextlist.normalizeDropdownSize(control.settings.dropdownHeight, 'dropdownHeight');

            // 기본 높이는 Tom Select의 최대 높이 정책을 그대로 사용한다.
            if (height === 'auto') {
                dropdown.style.height = '';
                content.style.height = '';
                content.style.maxHeight = '';
                content.style.boxSizing = '';
            }
            else {
                dropdown.style.height = height;
                content.style.height = control.nav && !control.nav.hidden && control.nav.parentNode === dropdown ? 'calc(100% - ' + control.nav.offsetHeight + 'px)' : '100%';
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
            $filtertagtextlist.alignGroupMenu(control.id);
        },

        positionEditor(elID) {
            var control = $filtertagtextlist.requireControl(elID);
            var editor = control.editor;
            if (!editor) {
                return;
            }

            var item = control.editorAnchor || control.picker.getItem(control.editingID);
            if (!item || !item.isConnected) {
                $filtertagtextlist.closeEditor(elID, false);
                return;
            }

            var itemRect = item.getBoundingClientRect();
            var containerRect = control.container.getBoundingClientRect();
            var viewportWidth = document.documentElement.clientWidth;
            var viewportHeight = window.innerHeight;
            var padding = 8;
            var gap = 6;
            if (itemRect.bottom < 0 || itemRect.top > viewportHeight || itemRect.right < 0 || itemRect.left > viewportWidth) {
                $filtertagtextlist.closeEditor(elID, false);
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
            var control = $filtertagtextlist.requireControl(elID);

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
            if (!$filtertagtextlist.hasProperty($filtertagtextlist.ranges, group.range)) {
                throw new TypeError('FilterTagTextList: range는 date, month 또는 time이어야 합니다');
            }
            var min = $filtertagtextlist.parseRangeValue(group.range, group.min);
            var max = $filtertagtextlist.parseRangeValue(group.range, group.max);
            if (min && max && min > max) {
                throw new TypeError('FilterTagTextList: min은 max보다 늦을 수 없습니다');
            }
        },

        // 그룹의 min·max 옵션. 지정하지 않으면 제한이 없다(빈 문자열).
        getRangeLimit(elID, groupID) {
            var control = $filtertagtextlist.requireControl(elID);

            var group = control.picker.optgroups[groupID];
            var kind = $filtertagtextlist.getRangeKind(control.id, groupID);
            return {
                min: kind ? $filtertagtextlist.parseRangeValue(kind, group.min) : '',
                max: kind ? $filtertagtextlist.parseRangeValue(kind, group.max) : ''
            };
        },

        // 범위 편집창의 기본값으로 사용할 현재 날짜·월·시각(브라우저 로컬 시간)
        getRangeNow(kind, limits) {
            var pad = $filtertagtextlist.pad;
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
            var error = new TypeError('FilterTagTextList: ' + message);
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
            var control = $filtertagtextlist.requireControl(elID);

            var group = control.picker ? control.picker.optgroups[groupID] : null;
            return group && $filtertagtextlist.hasProperty($filtertagtextlist.ranges, group.range) ? group.range : '';
        },

        // setRange로 만든 조건이면 'start'(gte) 또는 'end'(lt, lte)를 반환한다. 표시명의 '부터'·'까지' 접미사와 연산자로 판단한다.
        getRangeSide(elID, id) {
            var control = $filtertagtextlist.requireControl(elID);

            var option = control.picker ? control.picker.options[id] : null;
            if (!option) {
                return '';
            }
            var kind = $filtertagtextlist.getRangeKind(control.id, option._dttlGroup);
            var match = kind ? /^(.+) (부터|까지)$/.exec(option._dttlLabel) : null;
            if (!match || !$filtertagtextlist.ranges[kind].pattern.test(match[1])) {
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
            var spec = $filtertagtextlist.ranges[kind];
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
                        valid = parts[2] >= 1 && parts[2] <= $filtertagtextlist.daysInMonth(parts[0], parts[1]);
                    }
                }
            }
            if (!valid) {
                throw $filtertagtextlist.rangeError('invalid ' + kind + ' value: ' + text, spec.label + ' 형식이 올바르지 않습니다. (' + spec.placeholder + ')');
            }
            return text;
        },

        // 끝 값은 서버의 lt 비교에 맞춰 입력한 끝의 다음 날·다음 달·다음 분으로 변환한다. 23:59만 lte로 보낸다.
        rangeEnd(kind, text) {
            var pad = $filtertagtextlist.pad;
            var parts = text.split(/[-:]/).map(Number);
            var overflow = $filtertagtextlist.rangeError('range end is too large: ' + text, '끝 값이 지원 범위를 벗어났습니다.');
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
            if (day > $filtertagtextlist.daysInMonth(year, month)) {
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
            start = $filtertagtextlist.parseRangeValue(kind, start);
            end = $filtertagtextlist.parseRangeValue(kind, end);
            if (start && end && start > end) {
                throw $filtertagtextlist.rangeError('range start must not be later than end', '시작은 끝보다 늦을 수 없습니다.');
            }
            [start, end].forEach(function (value) {
                if (value && ((limits.min && value < limits.min) || (limits.max && value > limits.max))) {
                    throw $filtertagtextlist.rangeError('range is out of min/max: ' + value, $filtertagtextlist.ranges[kind].label + ' 범위는 ' +
                        (limits.min || '제한 없음') + ' ~ ' + (limits.max || '제한 없음') + ' 사이여야 합니다.');
                }
            });
            var result = [];
            if (start) {
                result.push({ operator: 'gte', key: start, value: start + ' 부터' });
            }
            if (end) {
                result.push(Object.assign($filtertagtextlist.rangeEnd(kind, end), { value: end + ' 까지' }));
            }
            return result;
        },

        // 그룹에 선택된 범위 조건에서 사용자가 입력한 시작·끝 값을 반환한다. 없으면 빈 문자열이다.
        getRange(elID, groupID) {
            var control = $filtertagtextlist.requireControl(elID);

            var result = { start: '', end: '' };
            control.picker.items.forEach(function (id) {
                var side = $filtertagtextlist.getRangeSide(control.id, id);
                if (side && control.picker.options[id]._dttlGroup === groupID) {
                    result[side] = control.picker.options[id]._dttlLabel.replace(/ (부터|까지)$/, '');
                }
            });
            return result;
        },

        // 시작은 gte, 끝은 lt(23:59는 lte) 조건으로 선택하고 기존 범위 조건은 교체한다. 둘 다 비우면 범위를 해제한다.
        setRange(elID, groupID, start, end) {
            var control = $filtertagtextlist.requireControl(elID);

            groupID = String(groupID);
            var kind = $filtertagtextlist.getRangeKind(control.id, groupID);
            if (!kind) {
                throw new Error('FilterTagTextList: 범위 그룹이 아닙니다: ' + groupID);
            }
            var conditions = $filtertagtextlist.buildRange(kind, start, end, $filtertagtextlist.getRangeLimit(control.id, groupID));
            var previous = control.picker.items.filter(function (id) {
                return $filtertagtextlist.getRangeSide(control.id, id) && control.picker.options[id]._dttlGroup === groupID;
            });
            var maxItems = control.picker.settings.maxItems;
            if (maxItems != null && control.picker.items.length - previous.length + conditions.length > maxItems) {
                throw new Error('FilterTagTextList: maxItems를 초과했습니다');
            }

            var before = $filtertagtextlist.snapshot(control.id);
            $filtertagtextlist.cancelPending(control.id);
            $filtertagtextlist.closeEditor(control.id, false);
            previous.forEach(function (id) {
                // item_remove 처리에서 조건과 범위 후보도 함께 제거한다.
                control.picker.removeItem(id, true);
            });
            var ids = conditions.map(function (condition) {
                var id = $filtertagtextlist.getOptionID(groupID, condition.key);
                var option = $filtertagtextlist.fromCondition(control.id, {
                    groupID: groupID,
                    key: condition.key,
                    value: condition.value
                });
                if ($filtertagtextlist.hasProperty(control.picker.options, id)) {
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
            $filtertagtextlist.refreshItems(control.id);
            control.picker.refreshOptions(false);
            $filtertagtextlist.notify(control.id, before, false);
        },

        // 선택되지 않은 범위 후보를 제거하여 일반 후보 목록에 노출되지 않게 한다.
        purgeRangeOptions(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            Object.keys(control.picker.options).forEach(function (id) {
                if (!control.picker.items.includes(id) && $filtertagtextlist.getRangeSide(control.id, id)) {
                    control.picker.removeOption(id, true);
                }
            });
        },

        // 선택되지 않은 일반 텍스트 후보를 제거한다. 일반 텍스트는 후보 목록에 남지 않는다.
        purgeNormalOptions(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            Object.keys(control.picker.options).forEach(function (id) {
                if (!control.picker.items.includes(id) && $filtertagtextlist.isNormalID(id)) {
                    control.picker.removeOption(id, true);
                }
            });
        },

        // suggest 옵션(함수)을 제공하면 입력한 텍스트를 제공자에게 넘겨 [{label, key?, count?, items:[값|{value}]}]를 받아 2단 팝업으로 보여준다.
        // 1차 팝업은 그룹(예: 그리드 컬럼)과 일치 개수, 2차 팝업은 선택한 그룹의 값 목록이다. 값을 고르면 key(생략하면 label)와 value의 일반 텍스트로 추가한다.
        // 제공자가 그룹을 하나도 돌려주지 않으면 기존 후보 드롭다운을 그대로 사용하고, 그룹이 있으면 팝업이 떠 있는 동안 후보 드롭다운은 열지 않는다.
        createSuggest(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var root = document.createElement('div');
            // suggestLevel:1이면 1차 팝업(그룹 목록)만 입력 중인 글자 아래에 보여주고, 선택하면 입력한 텍스트가 그 그룹(key)의 일반 텍스트가 된다.
            var single = control.settings.suggestLevel === 1;
            root.className = 'dttl-suggest' + (single ? ' dttl-suggest-single' : '');
            root.hidden = true;
            var groupMenu = document.createElement('div');
            groupMenu.className = 'dttl-suggest-menu dttl-suggest-groups';
            groupMenu.setAttribute('role', 'listbox');
            groupMenu.setAttribute('aria-label', '일치하는 항목 그룹');
            var itemMenu = document.createElement('div');
            itemMenu.className = 'dttl-suggest-menu dttl-suggest-items';
            itemMenu.setAttribute('role', 'listbox');
            itemMenu.setAttribute('aria-label', '일치하는 값');
            root.append(groupMenu, itemMenu);
            control.container.append(root);
            control.suggest = {
                root: root,
                groupMenu: groupMenu,
                itemMenu: itemMenu,
                groups: [],
                query: '',
                sequence: 0,
                groupIndex: 0,
                itemIndex: 0,
                level: 0,
                visible: false
            };
            var input = control.picker.control_input;
            var originalOpen = control.picker.open;
            // 팝업이 떠 있는 동안에는 후보 드롭다운이 같은 자리를 가리지 않도록 열지 않는다.
            control.picker.open = function () {
                if (control.suggest.visible && !control.destroyed) {
                    return;
                }
                return originalOpen.apply(control.picker, arguments);
            };
            // 팝업을 눌러도 입력 영역의 포커스를 유지한다. TomSelect는 자신의 래퍼·드롭다운 밖의 mousedown을 문서에서 받아 blur하므로 전파도 막는다.
            $filtertagtextlist.listen(control.id, root, 'mousedown', function (event) {
                event.preventDefault();
                event.stopPropagation();
            });
            $filtertagtextlist.listen(control.id, root, 'click', function (event) {
                var row = event.target.closest('.dttl-suggest-row');
                if (!row || !root.contains(row)) {
                    return;
                }
                if (row.parentElement === groupMenu) {
                    if (single) {
                        if (row.getAttribute('aria-disabled') !== 'true') {
                            $filtertagtextlist.selectSuggest(control.id, Number(row.dataset.index), 0);
                        }
                        return;
                    }
                    $filtertagtextlist.setSuggestGroup(control.id, Number(row.dataset.index), 1);
                }
                else if (row.getAttribute('aria-disabled') !== 'true') {
                    $filtertagtextlist.selectSuggest(control.id, control.suggest.groupIndex, Number(row.dataset.index));
                }
            });
            $filtertagtextlist.listen(control.id, groupMenu, 'mouseover', function (event) {
                var row = event.target.closest('.dttl-suggest-row');
                if (!single && row && groupMenu.contains(row) && Number(row.dataset.index) !== control.suggest.groupIndex) {
                    $filtertagtextlist.setSuggestGroup(control.id, Number(row.dataset.index), 0);
                }
            });
            $filtertagtextlist.listen(control.id, input, 'input', function () {
                $filtertagtextlist.updateSuggest(control.id);
            });
            $filtertagtextlist.listen(control.id, input, 'blur', function () {
                $filtertagtextlist.hideSuggest(control.id);
            });
            // 한글 조합 중에는 TomSelect의 방향키·Enter 처리와 같이 건너뛴다(조합 검사 핸들러가 먼저 등록되어 있다).
            $filtertagtextlist.listen(control.id, input, 'keydown', function (event) {
                $filtertagtextlist.onSuggestKey(control.id, event);
            }, true);
        },

        updateSuggest(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var state = control.suggest;
            var query = control.picker.control_input.value.trim();
            var sequence = ++state.sequence;
            // 그룹 버튼으로 연 목록(menu 모드)이 있으면 입력한 글자는 그 목록 안에서 찾으므로 추천 팝업은 띄우지 않는다.
            if (!query || control.navFilter || control.picker.isLocked || control.picker.isDisabled) {
                $filtertagtextlist.hideSuggest(control.id);
                return;
            }
            var finish = function (result) {
                if (control.destroyed || sequence !== state.sequence) {
                    return;
                }
                var groups = $filtertagtextlist.normalizeSuggest(result, control.settings.suggestLevel === 1);
                if (!groups.length) {
                    $filtertagtextlist.hideSuggest(control.id);
                    return;
                }
                state.query = query;
                state.groups = groups;
                state.groupIndex = 0;
                state.itemIndex = 0;
                state.level = 0;
                state.visible = true;
                // TomSelect.close()는 입력창을 비운다. 한글 조합 중에 값을 지우거나 다시 쓰면 조합이 깨지므로(예: 신 → 시신)
                // 닫는 동안만 setTextboxValue를 무력화해 입력창 값을 건드리지 않는다.
                if (control.picker.isOpen) {
                    var picker = control.picker;
                    picker.setTextboxValue = function () { };
                    try {
                        picker.close();
                    }
                    finally {
                        delete picker.setTextboxValue;
                    }
                }
                $filtertagtextlist.renderSuggest(control.id);
            };
            try {
                var result = control.settings.suggest.call(control, query);
                if (result && typeof result.then === 'function') {
                    result.then(finish, function (error) {
                        console.warn(error);
                        finish([]);
                    });
                }
                else {
                    finish(result);
                }
            } catch (error) {
                console.warn(error);
                finish([]);
            }
        },

        // 제공자의 결과를 {id, label, key, count, items:[{value}]}로 정리한다. 값이 없는 항목과 항목이 없는 그룹은 버린다.
        // 1단 모드(single, suggestLevel:1)는 입력한 텍스트가 값이 되므로 items가 없어도 이름(label 또는 key)이 있는 그룹을 유지한다.
        normalizeSuggest(result, single) {
            if (!Array.isArray(result)) {
                return [];
            }
            var groups = [];
            result.forEach(function (group, index) {
                if (!group || (!single && !Array.isArray(group.items))) {
                    return;
                }
                var items = [];
                (Array.isArray(group.items) ? group.items : []).forEach(function (item) {
                    var value = item && typeof item === 'object' ? item.value : item;
                    if ((typeof value === 'string' || typeof value === 'number') && String(value).trim() !== '') {
                        items.push({ value: String(value).trim() });
                    }
                });
                var label = group.label == null ? (group.key == null ? '' : String(group.key)) : String(group.label);
                if ((!single && !items.length) || label === '') {
                    return;
                }
                groups.push({
                    id: String(group.id == null ? index : group.id),
                    label: label,
                    key: group.key == null ? label : String(group.key),
                    count: Number.isFinite(group.count) ? group.count : items.length,
                    items: items
                });
            });
            return groups;
        },

        // 일치한 글자를 <mark>로 강조하여 요소에 채운다(텍스트 노드만 사용하므로 HTML 이스케이프가 필요 없다).
        fillMarked(element, text, query) {
            element.textContent = '';
            var lower = text.toLowerCase();
            var needle = query.toLowerCase();
            var from = 0;
            var index = needle ? lower.indexOf(needle) : -1;
            while (index >= 0) {
                if (index > from) {
                    element.append(document.createTextNode(text.slice(from, index)));
                }
                var mark = document.createElement('mark');
                mark.textContent = text.slice(index, index + needle.length);
                element.append(mark);
                from = index + needle.length;
                index = lower.indexOf(needle, from);
            }
            if (from < text.length) {
                element.append(document.createTextNode(text.slice(from)));
            }
        },

        renderSuggest(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var state = control.suggest;
            var single = control.settings.suggestLevel === 1;
            state.groupMenu.textContent = '';
            state.groups.forEach(function (group, index) {
                var row = document.createElement('div');
                row.className = 'dttl-suggest-row';
                row.id = control.id + '_sg_' + index;
                row.dataset.index = String(index);
                row.setAttribute('role', 'option');
                var label = document.createElement('span');
                label.className = 'dttl-suggest-label';
                label.textContent = group.label;
                row.append(label);
                if (single) {
                    // 1단 모드: 그룹 이름만 보여주며 이미 같은 그룹·텍스트를 선택했으면 비활성으로 표시한다.
                    if (control.picker.items.includes($filtertagtextlist.getSuggestID(group, { value: state.query }))) {
                        row.setAttribute('aria-disabled', 'true');
                        row.title = '이미 선택한 항목';
                    }
                }
                else {
                    var count = document.createElement('span');
                    count.className = 'dttl-suggest-count';
                    count.textContent = String(group.count);
                    row.append(count);
                }
                state.groupMenu.append(row);
            });
            if (!single) {
                $filtertagtextlist.renderSuggestItems(control.id);
            }
            state.root.hidden = false;
            $filtertagtextlist.positionSuggest(control.id);
        },

        // 선택한 그룹의 값 목록(2차 팝업)을 그린다. 이미 선택한 일반 텍스트는 비활성으로 표시한다.
        renderSuggestItems(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var state = control.suggest;
            var group = state.groups[state.groupIndex];
            state.itemMenu.textContent = '';
            state.itemMenu.setAttribute('aria-label', group.label + ' 일치하는 값');
            group.items.forEach(function (item, index) {
                var row = document.createElement('div');
                row.className = 'dttl-suggest-row';
                row.id = control.id + '_si_' + index;
                row.dataset.index = String(index);
                row.setAttribute('role', 'option');
                if (control.picker.items.includes($filtertagtextlist.getSuggestID(group, item))) {
                    row.setAttribute('aria-disabled', 'true');
                    row.title = '이미 선택한 항목';
                }
                var text = document.createElement('span');
                text.className = 'dttl-suggest-text';
                $filtertagtextlist.fillMarked(text, item.value, state.query);
                row.append(text);
                state.itemMenu.append(row);
            });
            $filtertagtextlist.markSuggest(control.id);
        },

        getSuggestID(group, item) {
            return $filtertagtextlist.getOptionID($filtertagtextlist.normalGroup, group.key + '\u0000' + item.value);
        },

        // 현재 단계(level 1: 그룹, 2: 값)의 활성 행과 표시 중인 그룹 행(current)을 갱신하고 접근성 속성을 맞춘다.
        markSuggest(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var state = control.suggest;
            var input = control.picker.control_input;
            var active = null;
            Array.from(state.groupMenu.children).forEach(function (row) {
                var index = Number(row.dataset.index);
                row.classList.toggle('dttl-suggest-current', index === state.groupIndex);
                var isActive = state.level === 1 && index === state.groupIndex;
                row.classList.toggle('active', isActive);
                row.setAttribute('aria-selected', String(index === state.groupIndex));
                if (isActive) {
                    active = row;
                }
            });
            Array.from(state.itemMenu.children).forEach(function (row) {
                var isActive = state.level === 2 && Number(row.dataset.index) === state.itemIndex;
                row.classList.toggle('active', isActive);
                row.setAttribute('aria-selected', String(isActive));
                if (isActive) {
                    active = row;
                }
            });
            if (active) {
                input.setAttribute('aria-activedescendant', active.id);
                active.scrollIntoView({ block: 'nearest' });
            }
            else {
                input.removeAttribute('aria-activedescendant');
            }
        },

        // 그룹을 바꾸어 2차 팝업을 갱신한다. level은 이후 키보드 단계(0: 입력창, 1: 그룹 목록)이다.
        setSuggestGroup(elID, index, level) {
            var control = $filtertagtextlist.requireControl(elID);

            var state = control.suggest;
            if (!state.visible || !state.groups[index]) {
                return;
            }
            if (index !== state.groupIndex) {
                state.groupIndex = index;
                state.itemIndex = 0;
                $filtertagtextlist.renderSuggestItems(control.id);
            }
            state.level = level;
            $filtertagtextlist.markSuggest(control.id);
            $filtertagtextlist.positionSuggest(control.id);
        },

        // 입력 영역 아래(공간이 부족하면 위)에 1차 팝업을 두고 2차 팝업은 오른쪽에 이어 붙인다. 화면 오른쪽을 넘으면 왼쪽으로 당긴다.
        positionSuggest(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var state = control.suggest;
            if (!state.visible) {
                return;
            }
            var root = state.root;
            // 1단 모드는 입력 중인 글자가 시작되는 입력창의 왼쪽 아래에, 2단 모드는 입력 영역의 왼쪽 아래에 둔다.
            var anchor = (control.settings.suggestLevel === 1 ? control.picker.control_input : control.picker.control).getBoundingClientRect();
            var containerRect = control.container.getBoundingClientRect();
            var viewportWidth = document.documentElement.clientWidth;
            var viewportHeight = window.innerHeight;
            var padding = 8;
            var gap = 2;
            if (anchor.bottom < 0 || anchor.top > viewportHeight) {
                $filtertagtextlist.hideSuggest(control.id);
                return;
            }
            root.style.left = '0px';
            root.style.top = '0px';
            root.style.maxWidth = Math.max(0, viewportWidth - padding * 2) + 'px';
            var width = root.offsetWidth;
            var height = root.offsetHeight;
            var left = Math.max(padding, Math.min(anchor.left, viewportWidth - padding - width));
            var spaceBelow = viewportHeight - padding - anchor.bottom - gap;
            var spaceAbove = anchor.top - padding - gap;
            var top = height > spaceBelow && spaceAbove > spaceBelow ? anchor.top - gap - height : anchor.bottom + gap;
            root.style.left = Math.round(left - containerRect.left - control.container.clientLeft + control.container.scrollLeft) + 'px';
            root.style.top = Math.round(top - containerRect.top - control.container.clientTop + control.container.scrollTop) + 'px';
        },

        hideSuggest(elID) {
            var control = $filtertagtextlist.getControl(elID);

            if (!control || !control.suggest) {
                return;
            }
            var state = control.suggest;
            state.sequence++;
            if (!state.visible) {
                return;
            }
            state.visible = false;
            state.level = 0;
            state.root.hidden = true;
            control.picker.control_input.removeAttribute('aria-activedescendant');
        },

        // 팝업이 떠 있을 때의 키 처리. 입력창(level 0) ↓: 그룹 목록, 그룹 목록 →·Enter: 값 목록, 값 목록 ←: 그룹 목록, Enter: 선택, Esc: 닫기.
        // 처리하지 않는 키(글자·Backspace 등)는 TomSelect로 넘기고 입력창 Enter는 일반 텍스트 추가가 된다.
        onSuggestKey(elID, event) {
            var control = $filtertagtextlist.requireControl(elID);

            var state = control.suggest;
            if (!state.visible || control.composing || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }
            var handled = true;
            var key = event.key;
            var group = state.groups[state.groupIndex];
            if (key === 'Escape') {
                $filtertagtextlist.hideSuggest(control.id);
            }
            else if (key === 'Tab') {
                $filtertagtextlist.hideSuggest(control.id);
                handled = false;
            }
            else if (key === 'ArrowDown' || key === 'ArrowUp') {
                var step = key === 'ArrowDown' ? 1 : -1;
                if (state.level === 0) {
                    state.level = 1;
                }
                else if (state.level === 1) {
                    var next = Math.max(0, Math.min(state.groups.length - 1, state.groupIndex + step));
                    if (next !== state.groupIndex) {
                        state.groupIndex = next;
                        state.itemIndex = 0;
                        if (control.settings.suggestLevel !== 1) {
                            $filtertagtextlist.renderSuggestItems(control.id);
                        }
                    }
                }
                else {
                    state.itemIndex = Math.max(0, Math.min(group.items.length - 1, state.itemIndex + step));
                }
                $filtertagtextlist.markSuggest(control.id);
            }
            else if (control.settings.suggestLevel === 1) {
                // 1단 모드: 그룹 목록(level 1)에서 Enter로 선택한다. →·←는 처리하지 않는다.
                if (key === 'Enter' && state.level === 1) {
                    $filtertagtextlist.selectSuggest(control.id, state.groupIndex, 0);
                }
                else if (key === 'Enter' && state.level === 0 && control.settings.suggestEnterFirst === true) {
                    // 행을 고르지 않고 입력창에서 Enter를 누르면 이미 선택한 행(비활성)을 건너뛴 첫 번째 행을 선택한다. 선택할 행이 없으면 아무것도 하지 않는다.
                    var first = Array.from(state.groupMenu.children).find(function (row) {
                        return row.getAttribute('aria-disabled') !== 'true';
                    });
                    if (first) {
                        $filtertagtextlist.selectSuggest(control.id, Number(first.dataset.index), 0);
                    }
                }
                else {
                    handled = false;
                }
            }
            else if (key === 'ArrowRight' && state.level === 1 || key === 'Enter' && state.level === 1) {
                state.level = 2;
                state.itemIndex = 0;
                $filtertagtextlist.markSuggest(control.id);
            }
            else if (key === 'ArrowLeft' && state.level === 2) {
                state.level = 1;
                $filtertagtextlist.markSuggest(control.id);
            }
            else if (key === 'Enter' && state.level === 2) {
                $filtertagtextlist.selectSuggest(control.id, state.groupIndex, state.itemIndex);
            }
            else {
                handled = false;
            }
            if (handled) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        },

        // 값을 고르면 key(그룹의 key)와 value의 일반 텍스트로 추가하고 입력창을 비운다. 이미 선택했거나 maxItems에 도달했으면 무시한다.
        selectSuggest(elID, groupIndex, itemIndex) {
            var control = $filtertagtextlist.requireControl(elID);

            var state = control.suggest;
            var group = state.groups[groupIndex];
            // 1단 모드는 입력한 텍스트가 값이 된다.
            var item = group ? (control.settings.suggestLevel === 1 ? { value: state.query } : group.items[itemIndex]) : null;
            if (!item || control.picker.isLocked || control.picker.isDisabled) {
                return;
            }
            var option;
            try {
                option = $filtertagtextlist.normalOption(group.key, item.value);
            } catch (error) {
                console.warn(error);
                return;
            }
            if (control.picker.items.includes(option._dttlID) || control.picker.isFull()) {
                return;
            }
            if (!$filtertagtextlist.hasProperty(control.picker.options, option._dttlID)) {
                control.picker.addOption(option, true);
            }
            control.picker.addItem(option._dttlID);
            control.picker.setTextboxValue('');
            $filtertagtextlist.hideSuggest(control.id);
            $filtertagtextlist.trigger(control.id, 'suggest_select', { groupID: group.id, key: group.key, value: item.value });
        },

        // 범위 버튼에 표시할 이름. 예: 작성일 · 년월일
        getRangeLabel(elID, groupID) {
            var control = $filtertagtextlist.requireControl(elID);

            var group = control.picker.optgroups[groupID];
            var label = group.label != null ? String(group.label) : groupID || '기타';
            return label + ' · ' + $filtertagtextlist.ranges[$filtertagtextlist.getRangeKind(control.id, groupID)].label;
        },

        renderRanges(elID) {
            var control = $filtertagtextlist.requireControl(elID);

            var count = 0;
            // rangeLayout:'nav'이면 범위 버튼을 입력 영역이 아니라 드롭다운의 그룹 이동 버튼 줄(updateGroupNav)에 배치한다.
            var nav = control.settings.rangeLayout === 'nav';
            control.ranges.textContent = '';
            Object.keys(control.picker.optgroups).forEach(function (groupID) {
                var kind = $filtertagtextlist.getRangeKind(control.id, groupID);
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
                button.textContent = label + ' · ' + $filtertagtextlist.ranges[kind].label;
                button.setAttribute('aria-label', label + ' ' + $filtertagtextlist.ranges[kind].label + ' 범위 입력');
                if (!nav) {
                    control.ranges.append(button);
                }
                count++;
            });
            control.ranges.hidden = nav || count === 0;
            $filtertagtextlist.layoutRanges(control.id);
            $filtertagtextlist.updateGroupNav(control.id);
            $filtertagtextlist.updateButtons(control.id);
        },

        // 범위 버튼을 입력 영역 오른쪽 안에 겹쳐 배치한다. 폭이 좁으면 입력 영역 아래로 내린다.
        layoutRanges(elID) {
            var control = $filtertagtextlist.requireControl(elID);

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
                $filtertagtextlist.positionEditor(control.id);
            }
        },

        openRange(elID, groupID, anchor) {
            var control = $filtertagtextlist.requireControl(elID);

            var kind = $filtertagtextlist.getRangeKind(control.id, groupID);
            if (!kind || control.picker.isLocked || control.picker.isDisabled) {
                return;
            }
            $filtertagtextlist.hideSuggest(control.id);
            $filtertagtextlist.closeEditor(control.id, false);
            control.picker.close();
            var spec = $filtertagtextlist.ranges[kind];
            var group = control.picker.optgroups[groupID];
            var groupLabel = group.label != null ? String(group.label) : groupID || '기타';
            var current = $filtertagtextlist.getRange(control.id, groupID);
            var limits = $filtertagtextlist.getRangeLimit(control.id, groupID);
            // 선택한 범위가 없으면 시작·끝 모두 현재 값(min·max 안으로 보정)을 기본값으로 보여준다.
            if (current.start === '' && current.end === '') {
                current.start = current.end = $filtertagtextlist.getRangeNow(kind, limits);
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
                // setRange가 편집창을 먼저 닫으므로 돌려줄 포커스 대상을 미리 보관한다.
                var focusTarget = control.editorFocus;
                try {
                    $filtertagtextlist.setRange(control.id, groupID, startValue, endValue);
                } catch (error) {
                    if (error.userMessage) {
                        message.textContent = error.userMessage;
                        message.hidden = false;
                        return;
                    }
                    throw error;
                }
                // groupChangeClearsText:true이면 범위를 적용하거나 해제할 때도 일반 텍스트를 지운다.
                if (control.settings.groupChangeClearsText === true) {
                    $filtertagtextlist.clearNormalItems(control.id);
                }
                if (control.editor === editor) {
                    $filtertagtextlist.closeEditor(control.id, true);
                }
                else if (!control.destroyed && focusTarget && focusTarget.isConnected) {
                    focusTarget.focus({ preventScroll: true });
                }
            };
            apply.addEventListener('click', function () {
                submit(start.value, end.value);
            });
            clear.addEventListener('click', function () {
                submit('', '');
            });
            cancel.addEventListener('click', function () {
                return $filtertagtextlist.closeEditor(control.id, true);
            });
            editor.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    $filtertagtextlist.closeEditor(control.id, true);
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
            control.editorFocus = control.settings.rangeLayout === 'nav' ? control.picker.control_input : Array.from(control.ranges.querySelectorAll('button')).find(function (button) {
                return button.dataset.group === groupID;
            });
            control.container.append(editor);
            $filtertagtextlist.positionEditor(control.id);
            start.focus({ preventScroll: true });
        },

        setLocale() {}
    });

    syn.uicontrols.$filtertagtextlist = $filtertagtextlist;
})(window);
