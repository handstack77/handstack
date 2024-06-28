/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $radio = $radio || new syn.module();

    $radio.extend({
        name: 'syn.uicontrols.$radio',
        version: '1.0.0',
        defaultSetting: {
            contents: '',
            toSynControl: false,
            dataType: 'string',
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

            setting = syn.$w.argumentsExtend($radio.defaultSetting, setting);

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
                var name = el.name;
                var html = '';
                if (events) {
                    html = '<input class="ui_radio" id="{0}" name="{1}" type="radio" syn-datafield="{2}" value="{3}" {4} syn-events={5}>'.format(elID, name, dataFieldID, value, checked == true ? 'checked="checked"' : '', '[\'' + eval(events).join('\',\'') + '\']');
                }
                else {
                    html = '<input class="ui_radio" id="{0}" name="{1}" type="radio" syn-datafield="{2}" value="{3}" {4}>'.format(elID, name, dataFieldID, value, checked == true ? 'checked="checked"' : '');
                }

                if ($object.isString(setting.textContent) == true) {
                    html = html + '<label for="{0}">{1}</label>'.format(elID, setting.textContent);
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
            var result = false;
            var el = syn.$l.get(elID);
            result = el.checked;

            return result;
        },

        setValue(elID, value, meta) {
            var el = syn.$l.get(elID);
            el.checked = value;
        },

        clear(elID, isControlLoad) {
            var el = syn.$l.get(elID);
            el.checked = false;
        },

        getGroupNames() {
            var value = [];
            var els = syn.$l.querySelectorAll('input[type=\'radio\']');
            for (var i = 0; i < els.length; i++) {
                value.push(els[i].name);
            }

            return $array.distinct(value);
        },

        getSelectedByValue(group) {
            var result = null;
            var els = syn.$l.querySelectorAll('input[type="radio"][name="{0}"]'.format(group));
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (el.id.indexOf('_hidden') == -1 && el.checked == true) {
                    result = el.value;
                    break;
                }
            }

            return result;
        },

        getSelectedByID(group) {
            var result = null;
            var els = syn.$l.querySelectorAll('input[type="radio"][name="{0}"]'.format(group));
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (el.id.indexOf('_hidden') == -1 && el.checked == true) {
                    result = el.id;
                    break;
                }
            }

            return result;
        },

        selectedValue(group, value) {
            var els = syn.$l.querySelectorAll('input[type="radio"][name="{0}"]'.format(group));
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (els[i].id.indexOf('_hidden') == -1 && els[i].value === value) {
                    els[i].checked = true;
                    break;
                }
            }
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$radio = $radio;
})(window);
