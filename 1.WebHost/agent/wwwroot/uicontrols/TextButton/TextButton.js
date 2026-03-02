/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $button = $button || new syn.module();

    $button.extend({
        name: 'syn.uicontrols.$button',
        version: 'v2025.3.1',
        defaultSetting: {
            color: 'default',
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

            setting = syn.$w.argumentsExtend($button.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            if (setting.toSynControl == true) {
                var color = 'btn-{0}'.format(setting.color);
                if (syn.$m.hasClass(el, color) == false) {
                    syn.$m.addClass(el, 'btn');
                    syn.$m.addClass(el, color);
                }
            }

            el.setAttribute('syn-options', JSON.stringify(setting));

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue(elID, meta) {
            var result = false;
            var el = syn.$l.get(elID);
            result = el.value;

            return result;
        },

        setValue(elID, value, meta) {
            var el = syn.$l.get(elID);
            el.value = value;
        },

        clear(elID, isControlLoad) {
            var el = syn.$l.get(elID);
            el.value = '';
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$button = $button;
})(window);