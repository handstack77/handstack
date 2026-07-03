/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $element = syn.uicontrols.$element || new syn.module();

    $element.extend({
        name: 'syn.uicontrols.$element',
        version: 'v2025.12.25',
        defaultSetting: {
            disabled: false,
            checkedValue: '1',
            uncheckedValue: '0',
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            content: null,
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
            if (el) {
                setting = syn.$w.argumentsExtend($element.defaultSetting, setting);

                var mod = window[syn.$w.pageScript];
                if (mod && mod.hook.controlInit) {
                    var moduleSettings = mod.hook.controlInit(elID, setting);
                    setting = syn.$w.argumentsExtend(setting, moduleSettings);
                }

                el.setAttribute('syn-options', JSON.stringify(setting));

                if (setting.bindingID && syn.uicontrols.$data) {
                    syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
                }
            }
        },

        getValue(elID, meta) {
            var result = null;
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var synOptions = el.getAttribute('syn-options');
                if (synOptions) {
                    var options = JSON.parse(synOptions);
                    switch (options.content) {
                        case 'value':
                            result = el.value;
                            break;
                        case 'html':
                            if ('innerHTML' in el) {
                                result = el.innerHTML;
                            }
                            break;
                        case 'content':
                            if ('textContent' in el) {
                                result = el.textContent;
                            }
                            break;
                        default:
                            if ('innerText' in el) {
                                result = el.innerText;
                            }
                            break;
                    }

                    switch (options.dataType) {
                        case 'number':
                        case 'numeric':
                            result = $string.toNumberString(result);
                            break;
                        case 'bool':
                        case 'boolean':
                            if ($string.toBoolean(result) == true) {
                                result = $object.isNullOrUndefined(options.checkedValue) == true ? '1' : options.checkedValue;
                            }
                            else {
                                result = $object.isNullOrUndefined(options.uncheckedValue) == true ? '0' : options.uncheckedValue;
                            }
                            break;
                    }
                }
                else {
                    result = el.value;
                }
            }
            else {
                result = '';
            }

            return result;
        },

        setValue(elID, value, meta) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(value) == false) {
                if ($object.isNullOrUndefined(el) == false) {
                    var synOptions = el.getAttribute('syn-options');
                    if (synOptions) {
                        var options = JSON.parse(synOptions);
                        switch (options.dataType) {
                            case 'number':
                            case 'numeric':
                                value = $string.isNumber(value) == true ? $string.toCurrency(value) : value;
                                break;
                        }

                        switch (options.content) {
                            case 'value':
                                el.value = value;
                                break;
                            case 'html':
                                if ('innerHTML' in el) {
                                    el.innerHTML = value;
                                }
                                break;
                            case 'content':
                                if ('textContent' in el) {
                                    el.textContent = value;
                                }
                                break;
                            default:
                                if ('innerText' in el) {
                                    el.innerText = value;
                                }
                                break;
                        }
                    }
                    else {
                        el.value = value;
                    }
                }
            }
        },

        clear(elID, isControlLoad) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var value = '';
                var synOptions = el.getAttribute('syn-options');
                if (synOptions) {
                    var options = JSON.parse(synOptions);
                    switch (options.content) {
                        case 'value':
                            el.value = value;
                            break;
                        case 'html':
                            if ('innerHTML' in el) {
                                el.innerHTML = value;
                            }
                            break;
                        case 'content':
                            if ('textContent' in el) {
                                el.textContent = value;
                            }
                            break;
                        default:
                            el.value = value;
                            break;
                    }
                }
                else {
                    el.value = value;
                }
            }
        },

        setLocale(elID, translations, control, options) {
            if ($object.isNullOrUndefined(control) == false) {
                var el = null;
                if ($string.isNullOrEmpty(control.elID) == false) {
                    el = syn.$l.get(control.elID);
                }
                else {
                    el = syn.$l.querySelector('{0}[i18n-key="{1}"]'.format(control.tag, control.key));
                }

                var bind = $resource.getBindSource(control);
                if ($string.isNullOrEmpty(bind) == false) {
                    el[bind] = $resource.translateText(control, options);
                }
            }
        }
    });
    syn.uicontrols.$element = $element;
})(window);
