/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $textarea = syn.uicontrols.$textarea || new syn.module();

    $textarea.extend({
        name: 'syn.uicontrols.$textarea',
        version: '1.0.0',
        textControls: [],
        defaultSetting: {
            width: '100%',
            height: '240px',
            indentUnit: 4,
            lineNumbers: true,
            toSynControl: true,
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

            setting = syn.$w.argumentsExtend($textarea.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.elementID = elID;
            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;
            el.style.width = setting.width;
            el.style.height = setting.height;

            el.setAttribute('syn-options', JSON.stringify(setting));

            var events = el.getAttribute('syn-events');
            var editor = null;

            if (setting.toSynControl == true) {
                if (el.getAttribute('maxlength') || el.getAttribute('maxlengthB')) {
                    if (el.getAttribute('maxlengthB')) {
                        el.setAttribute('maxlength', el.getAttribute('maxlengthB'));
                    }
                    setting.maxLength = el.getAttribute('maxlength');
                }

                editor = CodeMirror.fromTextArea(el, setting);

                if ($object.isNullOrUndefined(setting.maxLength) == false) {
                    editor.on('blur', function (cm, change) {
                        var el = syn.$l.get(editor.options.elementID);
                        var maxLength = 0;
                        var maxLengthB = el.getAttribute('maxlengthB');
                        if ($string.isNullOrEmpty(maxLengthB) == false) {
                            maxLength = parseInt(maxLengthB);
                        }
                        else {
                            maxLength = cm.getOption('maxLength');
                        }

                        var length = maxLength;
                        var textLength = $string.length(cm.getValue());

                        if (textLength > length) {
                            var alertOptions = $object.clone(syn.$w.alertOptions);
                            // alertOptions.stack = '영어외에는 2자리씩 계산되며, 현재 {1}글자를 입력했습니다'.format($string.toCurrency(textLength));
                            syn.$w.alert($resource.translations.textMaxLength.format($string.toCurrency(length)), '정보', alertOptions, function (result) {
                                editor.focus();
                            });
                        }

                        return true;
                    });
                }

                if (events) {
                    events = eval(events);
                    for (var i = 0; i < events.length; i++) {
                        var editorEvent = events[i];
                        var eventHandler = mod.event[el.id + '_' + editorEvent];
                        if (eventHandler) {
                            editor.on(editorEvent, eventHandler);
                        }
                    }
                }

                editor.setSize(setting.width, setting.height);
                setTimeout(function () {
                    editor.refresh();
                }, 30);
            }
            else {
                if (el.getAttribute('maxlength') || el.getAttribute('maxlengthB')) {
                    if (el.getAttribute('maxlengthB')) {
                        el.setAttribute('maxlength', el.getAttribute('maxlengthB'));
                    }
                    syn.$l.addEvent(el, 'blur', $textarea.event_blur);
                }
            }

            $textarea.textControls.push({
                id: elID,
                editor: editor,
                setting: $object.clone(setting)
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue(elID) {
            var result = null;
            var textControl = $textarea.getControl(elID);

            if (textControl && textControl.editor) {
                result = textControl.editor.getValue();
            }
            else {
                var el = syn.$l.get(elID);
                if ($object.isNullOrUndefined(el) == false) {
                    result = el.value;
                }
            }

            return result;
        },

        setValue(elID, value) {
            var textControl = $textarea.getControl(elID);

            if (textControl && textControl.editor) {
                textControl.editor.setValue(value);
            }
            else {
                var el = syn.$l.get(elID);
                if ($object.isNullOrUndefined(el) == false) {
                    el.value = value;
                }
            }
        },

        clear(elID, isControlLoad) {
            var textControl = $textarea.getControl(elID);

            if (textControl && textControl.editor) {
                textControl.editor.setValue('');
            }
            else {
                var el = syn.$l.get(elID);
                if ($object.isNullOrUndefined(el) == false) {
                    el.value = '';
                }
            }
        },

        getControl(elID) {
            var result = null;
            var length = $textarea.textControls.length;
            for (var i = 0; i < length; i++) {
                var item = $textarea.textControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        event_blur(e) {
            var el = e.target || e.srcElement || e;
            var maxLengthB = el.getAttribute('maxlengthB');
            if ($string.isNullOrEmpty(maxLengthB) == false) {
                var length = parseInt(maxLengthB);
                var textLength = $string.length(el.value);

                if (textLength > length) {
                    var alertOptions = $object.clone(syn.$w.alertOptions);
                    // alertOptions.stack = '영어외에는 2자리씩 계산되며, 현재 {1}글자를 입력했습니다'.format($string.toCurrency(textLength));
                    syn.$w.alert($resource.translations.textMaxLength.format($string.toCurrency(length)), '정보', alertOptions);

                    el.focus();
                }
            }
            else {
                var maxLength = el.getAttribute('maxlength');
                if ($string.isNullOrEmpty(maxLength) == false) {
                    var length = parseInt(maxLength);
                    var textLength = el.value.length;

                    if (textLength > length) {
                        var alertOptions = $object.clone(syn.$w.alertOptions);
                        // alertOptions.stack = '영어외에는 2자리씩 계산되며, 현재 {1}글자를 입력했습니다'.format($string.toCurrency(textLength));
                        syn.$w.alert($resource.translations.textMaxLength.format($string.toCurrency(length)), '정보', alertOptions);

                        el.focus();
                    }
                }
            }
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$textarea = $textarea;
})(window);
