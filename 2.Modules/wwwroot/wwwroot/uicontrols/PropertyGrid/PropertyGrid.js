/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $propertygrid = syn.uicontrols.$propertygrid || new syn.module();
    var propertyGridSequence = 0;

    $propertygrid.extend({
        name: 'syn.uicontrols.$propertygrid',
        version: 'v2026.7.3',
        propertyGridControls: [],
        defaultSetting: {
            elID: '',
            data: null,
            value: null,
            meta: null,
            customTypes: null,
            helpHtml: '[?]',
            sort: false,
            isCollapsible: false,
            defaultGroupName: 'Other',
            mode: '',
            autoMeta: true,
            jsonRows: 5,
            includeFunctions: true,
            classNames: 'syn-propertygrid',
            callback: null,
            dataType: 'object',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList(el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';

            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: this.name,
                type: controlType
            });
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == true) {
                return;
            }

            setting = syn.$w.argumentsExtend($propertygrid.defaultSetting, setting || {});

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.elID = elID;
            setting.meta = setting.meta && typeof setting.meta === 'object' ? setting.meta : {};
            setting.customTypes = setting.customTypes && typeof setting.customTypes === 'object' ? setting.customTypes : {};
            setting.defaultGroupName = setting.defaultGroupName;
            setting.value = $propertygrid.normalizeSource(setting.data || setting.value || {});
            setting.callback = $propertygrid.resolveCallback(setting.callback);

            el.setAttribute('syn-options', JSON.stringify($propertygrid.toSerializableSetting(setting)));
            $propertygrid.addControlSetting(el, setting);
            $propertygrid.render(elID, setting.value, setting);

            if (setting.bindingID && syn.uicontrols.$data) {
                // syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        addControlSetting(el, setting) {
            var control = $propertygrid.getControl(el.id);
            if (control) {
                control.setting = $object.clone($propertygrid.toSerializableSetting(setting));
                control.runtimeSetting = setting;
                control.valueFuncs = {};
                control.fields = {};
                return control;
            }

            control = {
                id: el.id,
                sequence: 'pg' + (propertyGridSequence++),
                setting: $object.clone($propertygrid.toSerializableSetting(setting)),
                runtimeSetting: setting,
                valueFuncs: {},
                fields: {}
            };

            $propertygrid.propertyGridControls.push(control);
            return control;
        },

        render(elID, value, setting) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == true) {
                return;
            }

            setting = syn.$w.argumentsExtend($propertygrid.defaultSetting, setting || {});
            setting.elID = elID;
            setting.meta = setting.meta && typeof setting.meta === 'object' ? setting.meta : {};
            setting.customTypes = setting.customTypes && typeof setting.customTypes === 'object' ? setting.customTypes : {};
            setting.defaultGroupName = setting.defaultGroupName;
            setting.value = $propertygrid.normalizeSource(value || {});
            setting.callback = $propertygrid.resolveCallback(setting.callback);

            var control = $propertygrid.getControl(elID) || $propertygrid.addControlSetting(el, setting);
            control.setting = $object.clone($propertygrid.toSerializableSetting(setting));
            control.runtimeSetting = setting;
            control.valueFuncs = {};
            control.fields = {};

            if (setting.classNames) {
                syn.$m.addClass(el, setting.classNames);
            }

            el.innerHTML = '';
            var table = document.createElement('table');
            table.className = 'pgTable';
            table.setAttribute('role', 'grid');

            var groupedRows = {};
            var groupOrder = [];
            var properties = Object.keys(setting.value);

            if (setting.sort) {
                if (typeof setting.sort === 'function') {
                    properties.sort(setting.sort);
                }
                else {
                    properties.sort();
                }
            }

            properties.forEach(function (propertyName) {
                var propertyValue = setting.value[propertyName];
                var propertyMeta = setting.meta[propertyName] || {};

                propertyMeta = $propertygrid.prepareMeta(propertyName, propertyValue, propertyMeta, setting);

                if (propertyMeta.browsable === false || (typeof propertyValue === 'function' && setting.includeFunctions !== true)) {
                    return;
                }

                var groupName = propertyMeta.group || setting.defaultGroupName;
                if (!groupedRows[groupName]) {
                    groupedRows[groupName] = [];
                    groupOrder.push(groupName);
                }

                groupedRows[groupName].push($propertygrid.createPropertyRow(control, propertyName, propertyValue, propertyMeta, setting));
            });

            groupOrder.forEach(function (groupName) {
                table.appendChild($propertygrid.createGroupRow(groupName, setting.isCollapsible));
                groupedRows[groupName].forEach(function (row) {
                    table.appendChild(row);
                });
            });

            el.appendChild(table);
        },

        createGroupRow(displayName, isCollapsible) {
            var row = document.createElement('tr');
            row.className = 'pgGroupRow' + (isCollapsible ? ' pgCollapsible' : '');

            var cell = document.createElement('td');
            cell.className = 'pgGroupCell';
            cell.colSpan = 2;
            cell.textContent = (isCollapsible ? '- ' : '') + displayName;
            row.appendChild(cell);

            if (isCollapsible) {
                row.addEventListener('click', function () {
                    var isExpanded = row.getAttribute('aria-expanded') !== 'false';
                    row.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
                    cell.textContent = (isExpanded ? '+ ' : '- ') + displayName;

                    var next = row.nextElementSibling;
                    while (next && next.classList.contains('pgGroupRow') == false) {
                        next.hidden = isExpanded;
                        next = next.nextElementSibling;
                    }
                });
                row.setAttribute('aria-expanded', 'true');
            }

            return row;
        },

        createPropertyRow(control, name, value, meta, setting) {
            var row = document.createElement('tr');
            row.className = 'pgRow';
            row.setAttribute('data-property', name);

            var displayName = meta.name || name;
            var inputCell;

            if (meta.colspan2 == true) {
                inputCell = document.createElement('td');
                inputCell.className = 'pgCell pgValueCell';
                inputCell.colSpan = 2;
                inputCell.appendChild($propertygrid.createValueElement(control, name, value, meta, setting));
                row.appendChild(inputCell);
            }
            else {
                var labelCell = document.createElement('td');
                labelCell.className = 'pgCell pgNameCell';
                labelCell.appendChild($propertygrid.createLabelElement(displayName, meta, setting));
                row.appendChild(labelCell);

                inputCell = document.createElement('td');
                inputCell.className = 'pgCell pgValueCell';
                inputCell.appendChild($propertygrid.createValueElement(control, name, value, meta, setting));
                row.appendChild(inputCell);
            }

            return row;
        },

        createLabelElement(displayName, meta, setting) {
            var fragment = document.createDocumentFragment();
            var text = document.createElement('span');
            text.className = 'pgLabelText';
            text.textContent = displayName;
            fragment.appendChild(text);

            if (typeof meta.description === 'string' && meta.description && (typeof meta.showHelp === 'undefined' || meta.showHelp)) {
                var help = document.createElement('span');
                help.className = 'pgTooltip';
                help.title = meta.description;
                help.innerHTML = setting.helpHtml;
                fragment.appendChild(help);
            }

            return fragment;
        },

        createValueElement(control, name, value, meta, setting) {
            meta = meta || {};

            var type = meta.type || '';
            var elemId = control.sequence + '_' + name;
            var customType = setting.customTypes[type];
            var element;

            if (customType && typeof customType.html === 'function') {
                element = $propertygrid.createCustomElement(customType.html(elemId, name, value, meta));
                $propertygrid.registerCustomValue(control, customType, elemId, name, value, meta);
            }
            else if (type === 'boolean' || (type === '' && typeof value === 'boolean')) {
                element = document.createElement('input');
                element.type = 'checkbox';
                element.id = elemId;
                element.checked = !!value;
                control.valueFuncs[name] = function () {
                    return element.checked;
                };
                $propertygrid.bindChange(element, control, name, setting, function () {
                    return element.checked;
                });
            }
            else if (type === 'options' && Array.isArray(meta.options)) {
                element = $propertygrid.createSelectElement(elemId, value, meta.options);
                control.valueFuncs[name] = function () {
                    return element.value;
                };
                $propertygrid.bindChange(element, control, name, setting, function () {
                    return element.value;
                });
            }
            else if (type === 'number' || (type === '' && typeof value === 'number')) {
                element = document.createElement('input');
                element.type = 'number';
                element.id = elemId;
                element.value = $object.isNullOrUndefined(value) == true ? '' : value;
                $propertygrid.applyNumberOptions(element, meta.options);
                control.valueFuncs[name] = function () {
                    var numberValue = Number(element.value);
                    return element.value === '' || isNaN(numberValue) ? null : numberValue;
                };
                $propertygrid.bindChange(element, control, name, setting, function () {
                    var numberValue = Number(element.value);
                    return element.value === '' || isNaN(numberValue) ? null : numberValue;
                });
            }
            else if (type === 'color') {
                element = document.createElement('input');
                element.type = 'color';
                element.id = elemId;
                element.value = $propertygrid.normalizeColor(value);
                control.valueFuncs[name] = function () {
                    return element.value;
                };
                $propertygrid.bindChange(element, control, name, setting, function () {
                    return element.value;
                });
            }
            else if (type === 'label') {
                element = document.createElement('label');
                element.id = elemId;
                element.textContent = $object.isNullOrUndefined(value) == true ? '' : value;
                if (typeof meta.description === 'string' && meta.description) {
                    element.title = meta.description;
                }
            }
            else if (type === 'json') {
                element = document.createElement('textarea');
                element.id = elemId;
                element.rows = meta.rows || setting.jsonRows;
                element.value = $propertygrid.stringifyJsonValue(value);
                control.valueFuncs[name] = function () {
                    return $propertygrid.parseJsonValue(element, value);
                };
                $propertygrid.bindChange(element, control, name, setting, function () {
                    return $propertygrid.parseJsonValue(element, value);
                });
            }
            else if (type === 'function') {
                element = document.createElement('textarea');
                element.id = elemId;
                element.rows = meta.rows || setting.jsonRows;
                element.value = typeof value === 'function' ? value.toString() : '';
                element.readOnly = meta.readonly !== false && meta.readOnly !== false;
                control.valueFuncs[name] = function () {
                    return value;
                };
            }
            else {
                element = document.createElement('input');
                element.type = 'text';
                element.id = elemId;
                element.value = $object.isNullOrUndefined(value) == true ? '' : value;
                control.valueFuncs[name] = function () {
                    return element.value;
                };
                $propertygrid.bindChange(element, control, name, setting, function () {
                    return element.value;
                });
            }

            $propertygrid.applyCommonMeta(element, meta);
            control.fields[name] = element;
            return element;
        },

        prepareMeta(name, value, meta, setting) {
            meta = meta || {};
            var result = {};
            for (var key in meta) {
                result[key] = meta[key];
            }

            if (!result.name) {
                result.name = name;
            }

            if (!result.group && setting.mode === 'defaultSetting') {
                result.group = $propertygrid.getDefaultSettingGroup(name, value);
            }

            if (!result.type && setting.autoMeta === true) {
                result.type = $propertygrid.inferType(value);
            }

            if (!result.description && setting.mode === 'defaultSetting') {
                result.description = $propertygrid.getDefaultSettingDescription(name, value);
            }

            return result;
        },

        inferType(value) {
            if (typeof value === 'boolean') {
                return 'boolean';
            }

            if (typeof value === 'number') {
                return 'number';
            }

            if (typeof value === 'function') {
                return 'function';
            }

            if (value === null || typeof value === 'undefined' || Array.isArray(value) || (value && typeof value === 'object')) {
                return 'json';
            }

            if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
                return 'color';
            }

            return '';
        },

        getDefaultSettingGroup(name, value) {
            if (['dataType', 'belongID', 'getter', 'setter', 'controlText', 'validators', 'transactConfig', 'triggerConfig', 'bindingID'].indexOf(name) > -1) {
                return 'Binding';
            }

            if (name.indexOf('dataSource') > -1 || name.indexOf('storeSource') > -1 || name === 'parameters' || name === 'local' || name === 'sharedAssetUrl') {
                return 'Data Source';
            }

            if (name.indexOf('Width') > -1 || name.indexOf('Height') > -1 || name === 'width' || name === 'height' || name.indexOf('Class') > -1 || name === 'classNames') {
                return 'Layout';
            }

            if (typeof value === 'boolean' || name === 'required' || name === 'readonly' || name === 'disabled') {
                return 'Behavior';
            }

            if (Array.isArray(value) || (value && typeof value === 'object') || value === null || typeof value === 'undefined' || typeof value === 'function') {
                return 'Advanced';
            }

            return 'General';
        },

        getDefaultSettingDescription(name, value) {
            if (typeof value === 'function') {
                return 'Function values are shown read-only because they are not valid JSON.';
            }

            if (typeof value === 'undefined') {
                return 'Undefined is preserved in the control value, but JSON.stringify omits it.';
            }

            if (value === null) {
                return 'Null can be edited as JSON null or replaced with another JSON value.';
            }

            if (Array.isArray(value) || (value && typeof value === 'object')) {
                return 'Edit as JSON. Invalid JSON keeps the previous value and marks the field.';
            }

            return '';
        },

        stringifyJsonValue(value) {
            if (typeof value === 'undefined') {
                return 'undefined';
            }

            return JSON.stringify(value, null, 4);
        },

        parseJsonValue(element, previousValue) {
            var text = element.value.trim();
            element.classList.remove('pgInvalid');

            if (text === 'undefined') {
                return undefined;
            }

            try {
                return JSON.parse(text);
            }
            catch (error) {
                element.classList.add('pgInvalid');
                return previousValue;
            }
        },

        createCustomElement(valueHtml) {
            if (valueHtml instanceof window.Node) {
                return valueHtml;
            }

            var template = document.createElement('template');
            template.innerHTML = (valueHtml || '').toString().trim();
            if (template.content.childElementCount === 1) {
                return template.content.firstElementChild;
            }

            var wrapper = document.createElement('span');
            wrapper.className = 'pgCustomValue';
            wrapper.appendChild(template.content);
            return wrapper;
        },

        registerCustomValue(control, customType, elemId, name, value, meta) {
            var valueFunc = null;
            if (customType.hasOwnProperty('makeValueFn')) {
                valueFunc = customType.makeValueFn(elemId, name, value, meta);
            }
            else if (customType.hasOwnProperty('valueFn')) {
                valueFunc = customType.valueFn;
            }
            else {
                valueFunc = function () {
                    var element = document.getElementById(elemId);
                    return element && 'value' in element ? element.value : null;
                };
            }

            if (typeof valueFunc === 'function') {
                control.valueFuncs[name] = valueFunc;
            }
        },

        createSelectElement(id, selectedValue, options) {
            var select = document.createElement('select');
            select.id = id;

            options.forEach(function (option) {
                var item = document.createElement('option');
                if (option && typeof option === 'object') {
                    item.value = option.value;
                    item.textContent = option.text;
                }
                else {
                    item.value = option;
                    item.textContent = option;
                }

                if (selectedValue == item.value) {
                    item.selected = true;
                }

                select.appendChild(item);
            });

            return select;
        },

        applyNumberOptions(element, options) {
            if (!options || typeof options !== 'object') {
                return;
            }

            ['min', 'max', 'step'].forEach(function (name) {
                if ($object.isNullOrUndefined(options[name]) == false) {
                    element.setAttribute(name, options[name]);
                }
            });
        },

        applyCommonMeta(element, meta) {
            if (!element || element.nodeType !== 1) {
                return;
            }

            element.classList.add('pgInput');

            if (typeof meta.description === 'string' && meta.description && meta.showHelp === false) {
                element.title = meta.description;
            }

            if (meta.readonly === true || meta.readOnly === true) {
                element.setAttribute('readonly', 'readonly');
            }

            if (meta.disabled === true) {
                element.setAttribute('disabled', 'disabled');
            }

            if (meta.placeholder) {
                element.setAttribute('placeholder', meta.placeholder);
            }
        },

        bindChange(element, control, name, setting, valueGetter) {
            var callback = setting.callback;
            if (typeof callback !== 'function') {
                return;
            }

            var handler = function () {
                callback(element, name, valueGetter(), control);
            };

            ['change', 'input', 'keyup', 'paste'].forEach(function (eventName) {
                element.addEventListener(eventName, handler);
            });
        },

        getValue(elID, meta) {
            var result = {};
            var control = $propertygrid.getControl(elID);

            if (control) {
                for (var name in control.valueFuncs) {
                    if (typeof control.valueFuncs[name] === 'function') {
                        result[name] = control.valueFuncs[name]();
                    }
                }
            }

            return result;
        },

        setValue(elID, value, meta) {
            var control = $propertygrid.getControl(elID);
            var el = syn.$l.get(elID);
            if (!control || $object.isNullOrUndefined(el) == true) {
                return;
            }

            var setting = syn.$w.argumentsExtend($propertygrid.defaultSetting, control.runtimeSetting || control.setting || {});
            setting.meta = meta || setting.meta || {};
            $propertygrid.render(elID, $propertygrid.normalizeSource(value || {}), setting);
        },

        clear(elID, isControlLoad) {
            var control = $propertygrid.getControl(elID);
            var el = syn.$l.get(elID);

            if (control) {
                control.valueFuncs = {};
                control.fields = {};
            }

            if ($object.isNullOrUndefined(el) == false) {
                el.innerHTML = '';
            }
        },

        getControl(elID) {
            var result = null;
            var length = $propertygrid.propertyGridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $propertygrid.propertyGridControls[i];
                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        createDefaultSettingMeta(defaultSetting, meta) {
            var result = {};
            defaultSetting = $propertygrid.normalizeSource(defaultSetting);
            meta = meta || {};

            Object.keys(defaultSetting).forEach(function (name) {
                result[name] = $propertygrid.prepareMeta(name, defaultSetting[name], meta[name], {
                    mode: 'defaultSetting',
                    autoMeta: true
                });
            });

            return result;
        },

        normalizeSource(value) {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                return {};
            }

            return value;
        },

        normalizeColor(value) {
            if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
                return value;
            }

            return '#000000';
        },

        resolveCallback(callback) {
            if (typeof callback === 'function') {
                return callback;
            }

            if (typeof callback === 'string' && callback) {
                var names = callback.split('.');
                var context = window;
                for (var i = 0; i < names.length; i++) {
                    context = context[names[i]];
                    if (!context) {
                        return null;
                    }
                }

                return typeof context === 'function' ? context : null;
            }

            return null;
        },

        toSerializableSetting(setting) {
            var result = {};
            for (var name in setting) {
                if (typeof setting[name] !== 'function') {
                    result[name] = setting[name];
                }
            }

            return result;
        },

        setLocale(elID, translations, control, options) {
        }
    });

    syn.uicontrols.$propertygrid = $propertygrid;
})(window);
