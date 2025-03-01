/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $checkbox = syn.uicontrols.$checkbox || new syn.module();

    $checkbox.extend({
        name: 'syn.uicontrols.$checkbox',
        version: 'v2025.3.1',
        defaultSetting: {
            contents: '',
            toSynControl: false,
            disabled: false,
            checkedValue: '1',
            uncheckedValue: '0',
            dataType: 'string',
            belongID: null,
            controlText: null,
            textContent: '',
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

            setting = syn.$w.argumentsExtend($checkbox.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            if (setting.toSynControl == true) {
                el.setAttribute('id', el.id + '_hidden');
                el.setAttribute('syn-options', JSON.stringify(setting));
                el.style.display = 'none';

                var dataFieldID = el.getAttribute('syn-datafield');
                var events = el.getAttribute('syn-events');
                var value = el.value;
                var checked = el.checked;
                var disabled = setting.disabled || el.disabled;
                var html = '';
                if (events) {
                    html = '<input class="ui_checkbox" id="{0}" name="{1}" type="checkbox" syn-datafield="{2}" value="{3}" {4} {5} syn-events={6}>'.format(elID, name, dataFieldID, value, checked == true ? 'checked="checked"' : '', disabled == true ? 'disabled="disabled"' : '', '[\'' + eval(events).join('\',\'') + '\']');
                }
                else {
                    html = '<input class="ui_checkbox" id="{0}" name="{1}" type="checkbox" syn-datafield="{2}" value="{3}" {4} {5}>'.format(elID, name, dataFieldID, value, checked == true ? 'checked="checked"' : '', disabled == true ? 'disabled="disabled"' : '');
                }

                if ($object.isString(setting.textContent) == true) {
                    html = html + '<label class="ml-1" for="{0}">{1}</label>'.format(elID, setting.textContent);
                }

                var parent = el.parentNode;
                var wrapper = syn.$m.create({
                    tag: 'span',
                    className: 'formControl'
                });
                wrapper.innerHTML = html;

                parent.appendChild(wrapper);
                syn.$l.get(elID).setAttribute('syn-options', JSON.stringify(setting));
            }
            else {
                el.setAttribute('syn-options', JSON.stringify(setting));
            }

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue(elID, meta) {
            var result = null;
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var synOptions = el.getAttribute('syn-options');
                if (synOptions) {
                    var options = JSON.parse(synOptions);
                    if (options.checkedValue && options.uncheckedValue) {
                        if (el.checked == true) {
                            result = options.checkedValue;
                        }
                        else {
                            result = options.uncheckedValue;
                        }
                    }
                }
                else {
                    result = el.checked;
                }
            }
            else {
                result = '';
            }

            return result;
        },

        setValue(elID, value, meta) {
            var el = syn.$l.get(elID);
            if (value) {
                value = value.toString().toUpperCase();
                el.checked = (value == 'TRUE' || value == 'Y' || value == '1');
            }
            else {
                el.checked = false;
            }
        },

        toggleValue(elID) {
            var el = syn.$l.get(elID);
            if (el.checked == false) {
                el.checked = true;
            } else {
                if (el.checked == true) {
                    el.checked = false;
                }
            }
        },

        clear(elID, isControlLoad) {
            var el = syn.$l.get(elID);
            el.checked = false;
        },

        getGroupNames() {
            var value = [];
            var els = syn.$l.querySelectorAll('input[type=\'checkbox\']');
            for (var i = 0; i < els.length; i++) {
                value.push(els[i].name);
            }

            return $array.distinct(value);
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$checkbox = $checkbox;
})(window);
