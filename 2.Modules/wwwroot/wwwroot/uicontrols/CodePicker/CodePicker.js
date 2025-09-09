/// <reference path="/js/syn.js" />
/// <reference path="/js/syn.domain.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $codepicker = $codepicker || new syn.module();

    $codepicker.extend({
        name: 'syn.uicontrols.$codepicker',
        version: 'v2025.9.10',
        defaultSetting: {
            dataSourceID: null,
            storeSourceID: null,
            local: true,
            parameters: '',
            label: '',
            labelWidth: '',
            codeElementID: '',
            codeElementWidth: '',
            codeElementClass: '',
            textElementID: '',
            textElementWidth: '',
            textElementClass: '',
            required: false,
            readonly: false,
            disabled: false,
            textBelongID: null,
            textDataFieldID: null,
            searchValue: '',
            searchText: '',
            isMultiSelect: false,
            isAutoSearch: true,
            isOnlineData: false,
            viewType: '',
            sharedAssetUrl: '',
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
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';

            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: null,
                module: this.name,
                type: controlType
            });
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend($codepicker.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }
            setting.sharedAssetUrl = setting.sharedAssetUrl || syn.Config.SharedAssetUrl;

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var dataField = el.getAttribute('syn-datafield');
            var events = el.getAttribute('syn-events');

            var textboxCode = syn.$m.create({
                id: `${elID}_Code`,
                tag: 'input',
                className: 'form-control'
            });

            textboxCode.type = 'text';
            textboxCode.setAttribute('syn-events', `['keydown', 'blur']`);
            textboxCode.setAttribute('baseID', elID);

            if ($string.isNullOrEmpty(dataField) == false) {
                textboxCode.setAttribute('syn-datafield', dataField);
            }

            if ($string.isNullOrEmpty(setting.codeElementWidth) == false) {
                textboxCode.style.width = codeElementWidth;
            }

            if ($string.isNullOrEmpty(setting.codeElementClass) == false) {
                syn.$m.addClass(textboxCode, codeElementClass);
            }

            if ($string.toBoolean(setting.readonly) == true) {
                textboxCode.setAttribute('readonly', 'readonly');
            }

            if ($string.toBoolean(setting.disabled) == true) {
                textboxCode.setAttribute('disabled', 'disabled');
            }

            if ($string.toBoolean(setting.required) == true) {
                textboxCode.setAttribute('required', 'required');
            }

            if ($string.isNullOrEmpty(setting.belongID) == true) {
                textboxCode.setAttribute('syn-options', `{editType: 'text', dataType: 'string'}`);
            }
            else {
                if ($object.isArray(setting.belongID) == true) {
                    textboxCode.setAttribute('syn-options', `{editType: 'text', dataType: 'string', belongID: ${JSON.stringify(setting.belongID)}}`);
                }
                else {
                    textboxCode.setAttribute('syn-options', `{editType: 'text', dataType: 'string', belongID: '${setting.belongID}'}`);
                }
            }

            if ($object.isNullOrUndefined(events) == false) {
                textboxCode.setAttribute('syn-events', events);
            }
            syn.$m.insertBefore(textboxCode, el);

            var buttonOpen = syn.$m.create({
                id: `${elID}_Button`,
                tag: 'button',
                className: 'btn btn-icon f:18! bg-muted-lt'
            });
            buttonOpen.innerHTML = `<i class="ti ti-search"></i>`;

            syn.$m.insertAfter(buttonOpen, el);

            var textboxText = syn.$m.create({
                id: `${elID}_Text`,
                tag: 'input',
                className: 'form-control'
            });

            textboxText.type = 'text';
            textboxText.setAttribute('syn-events', `['keydown', 'blur']`);
            textboxText.setAttribute('baseID', elID);

            if ($string.isNullOrEmpty(setting.textDataFieldID) == false) {
                textboxText.setAttribute('syn-datafield', setting.textDataFieldID);
            }

            if ($string.isNullOrEmpty(setting.textElementWidth) == false) {
                textboxText.style.width = textElementWidth;
            }

            if ($string.isNullOrEmpty(setting.textElementClass) == false) {
                syn.$m.addClass(textboxText, textElementClass);
            }

            if ($string.toBoolean(setting.readonly) == true) {
                textboxText.setAttribute('readonly', 'readonly');
            }

            if ($string.toBoolean(setting.disabled) == true) {
                textboxText.setAttribute('disabled', 'disabled');
            }

            if ($string.toBoolean(setting.required) == true) {
                textboxText.setAttribute('required', 'required');
            }

            if ($string.isNullOrEmpty(setting.textBelongID) == true) {
                textboxText.setAttribute('syn-options', `{editType: 'text', dataType: 'string'}`);
            }
            else {
                if ($object.isArray(setting.textBelongID) == true) {
                    textboxText.setAttribute('syn-options', `{editType: 'text', dataType: 'string', belongID: ${JSON.stringify(setting.textBelongID)}}`);
                }
                else {
                    textboxText.setAttribute('syn-options', `{editType: 'text', dataType: 'string', belongID: '${setting.textBelongID}'}`);
                }
            }

            if ($object.isNullOrUndefined(events) == false) {
                textboxText.setAttribute('syn-events', events);
            }
            syn.$m.insertAfter(textboxText, buttonOpen);

            var codeEL = syn.$l.get(elID + '_Code');
            syn.$l.addEvent(codeEL, 'focus', function (evt) {
                var el = evt.srcElement || evt.target;
                var mod = window[syn.$w.pageScript];
                if (mod) {
                    mod.prop.focusControl = el;
                }
            });

            var fnCodeChange = function (evt) {
                var el = evt.currentTarget;
                var elID = el.id.replace('_Code', '');

                syn.$l.get(elID + '_Text').value = '';

                if (evt.keyCode == 13 || evt instanceof FocusEvent) {
                    syn.$l.trigger(syn.$l.get(elID + '_Button'), 'click', evt)
                }
            }

            syn.$l.addEvent(codeEL, 'keydown', fnCodeChange);
            syn.$l.addEvent(codeEL, 'blur', fnCodeChange);

            var synOptions = codeEL.getAttribute('syn-options');
            if ($string.isNullOrEmpty(synOptions) == false) {
                syn.uicontrols.$textbox.controlLoad(codeEL.id, eval('(' + synOptions + ')'));
            }
            else {
                syn.uicontrols.$textbox.controlLoad(codeEL.id, {});
            }

            var textEL = syn.$l.get(elID + '_Text');
            syn.$l.addEvent(textEL, 'focus', function (evt) {
                var el = evt.srcElement || evt.target;
                var mod = window[syn.$w.pageScript];
                if (mod) {
                    mod.prop.focusControl = el;
                }
            });

            var fnTextChange = function (evt) {
                var el = evt.currentTarget;
                var elID = el.id.replace('_Text', '');

                syn.$l.get(elID + '_Code').value = '';

                if (evt.keyCode == 13 || evt instanceof FocusEvent) {
                    syn.$l.trigger(syn.$l.get(elID + '_Button'), 'click', evt)
                }
            }

            syn.$l.addEvent(textEL, 'keydown', fnTextChange);
            syn.$l.addEvent(textEL, 'blur', fnTextChange);

            synOptions = textEL.getAttribute('syn-options');
            if ($string.isNullOrEmpty(synOptions) == false) {
                syn.uicontrols.$textbox.controlLoad(textEL.id, eval('(' + synOptions + ')'));
            }
            else {
                syn.uicontrols.$textbox.controlLoad(textEL.id, {});
            }

            var buttonEL = syn.$l.get(elID + '_Button');
            syn.$l.addEvent(buttonEL, 'focus', function (evt) {
                var el = evt.srcElement || evt.target;
                var mod = window[syn.$w.pageScript];
                if (mod) {
                    mod.prop.focusControl = el;
                }
            });

            syn.$l.addEvent(buttonEL, 'click', function (evt) {
                var el = (this && this.id.indexOf('_Button') > -1) ? this : evt.currentTarget;
                var elID = el.id.replace('_Button', '').replace('_Code', '').replace('_Text', '');
                var synOptions = JSON.parse(syn.$l.get(elID + '_hidden').getAttribute('syn-options'));
                synOptions.elID = elID;
                synOptions.viewType = 'form';
                synOptions.codeElementID = elID + '_Code';
                synOptions.textElementID = elID + '_Text';
                synOptions.searchValue = syn.$l.get(synOptions.codeElementID).value;
                synOptions.searchText = syn.$l.get(synOptions.textElementID).value;

                var inputValue = syn.$l.get(synOptions.codeElementID).value;
                var inputText = syn.$l.get(synOptions.textElementID).value;
                syn.uicontrols.$codepicker.find(synOptions, function (result) {
                    if (result && result.length > 0) {
                        var changeHandler = mod.event[elID + '_change'];
                        if (changeHandler) {
                            changeHandler(inputValue, inputText, result);
                        }
                    }

                    var returnHandler = mod.hook.frameEvent;
                    if (returnHandler) {
                        returnHandler.call(this, 'codeReturn', {
                            elID: elID,
                            result: result
                        });
                    }
                });
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        find(setting, callback) {
            if ($object.isNullOrUndefined(setting.dataSourceID) == true) {
                syn.$l.eventLog('$codepicker.find', 'dataSourceID 설정 없음', 'Debug');
                return;
            }

            setting.storeSourceID = setting.storeSourceID || setting.dataSourceID;
            var parameterID = setting.elID + setting.viewType + setting.dataSourceID;
            var mod = window[syn.$w.pageScript];
            if (mod) {
                if (mod.hook.frameEvent) {
                    var codeSetting = mod.hook.frameEvent('codeInit', setting);
                    setting = syn.$w.argumentsExtend(setting, codeSetting);
                }

                var applicationIDPattern = /(\@ApplicationID)\s*:/;
                if (applicationIDPattern.test(setting.parameters) == false) {
                    setting.parameters = '@ApplicationID:{0};'.format(syn.Config.ApplicationID) + setting.parameters;
                }

                var companyNoPattern = /(\@CompanyNo)\s*:/;
                if (syn.$w.User && syn.$w.User.WorkCompanyNo && companyNoPattern.test(setting.parameters) == false) {
                    setting.parameters = '@CompanyNo:{0};'.format(syn.$w.User.WorkCompanyNo) + setting.parameters;
                }

                var localeIDPattern = /(\@LocaleID)\s*:/;
                if (localeIDPattern.test(setting.parameters) == false) {
                    setting.parameters = '@LocaleID:{0};'.format(syn.Config.Program.LocaleID) + setting.parameters;
                }

                mod.codePickerArguments = mod.codePickerArguments || {};
                mod.codePickerArguments[parameterID] = setting;
            }

            var dialogOptions = $object.clone(syn.$w.dialogOptions);
            dialogOptions.minWidth = 640;
            dialogOptions.minHeight = 480;
            dialogOptions.close = true;
            dialogOptions.caption = (setting.controlText || setting.columnText || setting.headerText || setting.dataSourceID) + ' 코드도움';

            var url = $string.isNullOrEmpty(setting.url) == false ? setting.url : setting.sharedAssetUrl + 'codehelp/index.html';
            syn.$w.showUIDialog(url + '?parameterID={0}'.format(parameterID), dialogOptions, function (result) {
                if (result && result.length > 0) {
                    var value = '';
                    var text = '';
                    if (setting.isMultiSelect == false) {
                        var item = result[0];
                        value = item.value;
                        text = item.text;
                    } else {
                        var values = [];
                        var texts = [];
                        var length = result.length;
                        for (var i = 0; i < length; i++) {
                            var item = result[i];
                            values.push(item.value);
                            texts.push(item.text);
                        }

                        value = values.join();
                        text = texts.join();
                    }

                    if (setting.viewType == 'form') {
                        syn.$l.get(setting.codeElementID).value = value;
                        if (setting.textElementID) {
                            syn.$l.get(setting.textElementID).value = text;
                        }
                    }
                    else if (setting.viewType == 'grid' && syn.uicontrols.$grid) {
                        var row = syn.uicontrols.$grid.getActiveRowIndex(setting.elID);
                        syn.uicontrols.$grid.setDataAtCell(setting.elID, row, setting.codeColumnID, value);
                        if (setting.textColumnID) {
                            syn.uicontrols.$grid.setDataAtCell(setting.elID, row, setting.textColumnID, text);
                        }
                    }
                    else if (setting.viewType == 'auigrid' && syn.uicontrols.$auigrid) {
                        var row = syn.uicontrols.$auigrid.getActiveRowIndex(setting.elID);
                        syn.uicontrols.$auigrid.setDataAtCell(setting.elID, row, setting.codeColumnID, value);
                        if (setting.textColumnID) {
                            syn.uicontrols.$auigrid.setDataAtCell(setting.elID, row, setting.textColumnID, text);
                        }
                    }
                }

                if (callback) {
                    callback(result);
                }
            });
        },

        toParameterString(jsonObject) {
            return jsonObject ? Object.entries(jsonObject).reduce(function (queryString, _ref, index) {
                var key = _ref[0],
                    val = _ref[1];
                if (key.indexOf('@') == -1) {
                    queryString += typeof val === 'string' ? '@' + key + ":" + val + ';' : '';
                }
                return queryString;
            }, '') : '';
        },

        toParameterObject(parameters) {
            return (parameters.match(/([^?:;]+)(:([^;]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf(':')).replace('@', '')] = v.slice(v.indexOf(':') + 1), a;
            }, {});
        },

        getValue(elID, meta) {
            var result = false;
            var el = syn.$l.get(elID + '_Code');
            result = el.value;

            return result;
        },

        setValue(elID, value, meta) {
            var el = syn.$l.get(elID + '_Code');
            el.value = value;
        },

        setText(elID, value, meta) {
            var el = syn.$l.get(elID + '_Text');
            el.value = value;
        },

        clear(elID, isControlLoad) {
            syn.$l.get(elID + '_Code').value = '';
            syn.$l.get(elID + '_Text').value = '';
        },

        open(elID) {
            syn.$l.trigger(elID + '_Button', 'click');
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$codepicker = $codepicker;
})(window);
