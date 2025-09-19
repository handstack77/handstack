/// <reference path="/js/syn.js" />
/// <reference path="/lib/superplaceholder/superplaceholder.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $textbox = $textbox || new syn.module();

    $textbox.extend({
        name: 'syn.uicontrols.$textbox',
        version: 'v2025.3.25',
        defaultSetting: {
            editType: 'text',
            inValidateClear: true,
            formatNumber: true,
            maskPattern: null,
            maxCount: null,
            minCount: 0,
            allowChars: [],
            placeText: [],
            defaultSetValue: '0',
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

            setting = syn.$w.argumentsExtend($textbox.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            el.setAttribute('syn-options', JSON.stringify(setting));
            el.spellcheck = $string.toBoolean(setting.spellcheck) == true ? 'true' : 'false';

            if ($object.isEmpty(setting.placeText) == false) {
                superplaceholder({
                    el: el,
                    sentences: $object.isString(setting.placeText) == true ? [setting.placeText] : setting.placeText
                });
            }

            switch (setting.editType) {
                case 'text':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    break;
                case 'english':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_english_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_english_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    break;
                case 'uppercase':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_uppercase_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_uppercase_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    break;
                case 'lowercase':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_lowercase_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_lowercase_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    break;
                case 'number':
                    syn.$l.addEvent(el, 'focus', $textbox.event_numeric_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_number_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');

                    VMasker(el).maskNumber();
                    break;
                case 'numeric':
                    syn.$l.addEvent(el, 'focus', $textbox.event_numeric_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_numeric_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');

                    VMasker(el).maskNumber();
                    break;
                case 'spinner':
                    syn.$l.addEvent(el, 'focus', $textbox.event_numeric_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_numeric_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    if (el.offsetWidth) {
                        // el.offsetWidth = el.offsetWidth <= 28 ? 0 : el.offsetWidth - 28;
                    }

                    new ISpin(el, {
                        wrapperClass: 'ispin-wrapper',
                        buttonsClass: 'ispin-button',
                        step: 1,
                        pageStep: 10,
                        disabled: false,
                        repeatInterval: 100,
                        wrapOverflow: false,
                        parse: Number,
                        format: String
                    });
                    VMasker(el).maskNumber();
                    break;
                case 'year':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_year_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    break;
                case 'date':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_date_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    break;
                case 'hour':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_hour_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    break;
                case 'minute':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_minute_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    break;
                case 'yearmonth':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_yearmonth_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    break;
                case 'homephone':
                    syn.$l.addEvent(el, 'focus', $textbox.event_phone_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_homephone_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    break;
                case 'mobilephone':
                    syn.$l.addEvent(el, 'focus', $textbox.event_phone_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_mobilephone_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    break;
                case 'phone':
                    syn.$l.addEvent(el, 'focus', $textbox.event_phone_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_phone_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');
                    break;
                case 'email':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_email_blur);
                    syn.$m.setStyle(el, 'ime-mode', 'inactive');
                    break;
                case 'juminno':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_juminno_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');

                    if ($string.isNullOrEmpty(setting.maskPattern) == true) {
                        VMasker(el).maskPattern('999999-9999999');
                    }
                    break;
                case 'businessno':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_businessno_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');

                    if ($string.isNullOrEmpty(setting.maskPattern) == true) {
                        VMasker(el).maskPattern('999-99-99999');
                    }
                    break;
                case 'corporateno':
                    syn.$l.addEvent(el, 'focus', $textbox.event_focus);
                    syn.$l.addEvent(el, 'blur', $textbox.event_corporateno_blur);
                    syn.$l.addEvent(el, 'input', $textbox.event_numeric_input);
                    syn.$m.setStyle(el, 'ime-mode', 'disabled');

                    if ($string.isNullOrEmpty(setting.maskPattern) == true) {
                        VMasker(el).maskPattern('999999-9999999');
                    }
                    break;
            }

            if (el.getAttribute('maxlength') || el.getAttribute('maxlengthB')) {
                if (el.getAttribute('maxlengthB')) {
                    el.setAttribute('maxlength', el.getAttribute('maxlengthB'));
                }
                syn.$l.addEvent(el, 'blur', $textbox.event_blur);
            }

            if ($string.isNullOrEmpty(setting.maskPattern) == false) {
                VMasker(el).maskPattern(setting.maskPattern);
            }

            if (setting.contents) {
                $textbox.setValue(elID, setting.contents);
            }

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        event_english_input(evt) {
            var el = evt.target || evt.srcElement || evt;
            var charCode = evt.which || evt.keyCode;
            var value = false;
            if (/^[a-zA-Z0-9_]$/.test(String.fromCharCode(charCode))) {
                value = true;
            }
            else {
                el.value = el.value.replace(/[\ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');

                evt.returnValue = false;
                evt.cancel = true;
                if (evt.preventDefault) {
                    evt.preventDefault();
                }

                value = false;
            }

            var synOptions = JSON.parse(el.getAttribute('syn-options'));
            var textCase = synOptions.textCase || '';
            if (textCase == 'upper') {
                el.value = el.value.toUpperCase();
            }
            else if (textCase == 'lower') {
                el.value = el.value.toLowerCase();
            }

            return value;
        },

        event_uppercase_input(evt) {
            var el = evt.target || evt.srcElement || evt;
            el.value = el.value.replace(/[^A-Za-z]/g, '').toUpperCase();

            evt.returnValue = false;
            evt.cancel = true;
            if (evt.preventDefault) {
                evt.preventDefault();
            }

            return false;
        },

        event_lowercase_input(evt) {
            var el = evt.target || evt.srcElement || evt;
            el.value = el.value.replace(/[^A-Za-z]/g, '').toLowerCase();

            evt.returnValue = false;
            evt.cancel = true;
            if (evt.preventDefault) {
                evt.preventDefault();
            }

            return false;
        },

        event_numeric_input(evt) {
            var el = evt.target || evt.srcElement || evt;
            var charCode = evt.which || evt.keyCode;
            var value = false;
            if (charCode > 31 && (charCode < 48 || charCode > 57 || charCode == 45 || charCode == 109)) {
                if (charCode == 45 || charCode == 109) {
                    var val = el.value;
                    if (val.startsWith('-') == true && val.split('-').length <= 2 || val.split('-').length == 1) {
                        return true;
                    }
                }

                evt.returnValue = false;
                evt.cancel = true;
                if (evt.preventDefault) {
                    evt.preventDefault();
                }

                value = false;
            }

            value = true;
            return value;
        },

        event_focus(evt) {
            var el = evt.target || evt.srcElement || evt;

            if (el.value.length > 0) {
                $textbox.rangeMoveCaret(el);
            }
        },

        event_phone_focus(evt) {
            var el = evt.target || evt.srcElement || evt;
            if (el.value.length > 0) {
                el.value = el.value.replace(/-/g, '');
                $textbox.rangeMoveCaret(el);
            }
        },

        event_numeric_focus(evt) {
            var el = evt.target || evt.srcElement || evt;
            if (el.value.length > 0) {
                el.value = $string.toNumberString(el.value);
                $textbox.rangeMoveCaret(el);
            }
        },

        event_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            var maxlengthB = el.getAttribute('maxlengthB');
            if ($string.isNullOrEmpty(maxlengthB) == false) {
                var length = parseInt(el.getAttribute('maxlengthB'));
                var textLength = $string.length(el.value);

                if (textLength > length) {
                    var alertOptions = $object.clone(syn.$w.alertOptions);
                    // alertOptions.stack = '영어외에는 2자리씩 계산되며, 현재 {1}글자를 입력했습니다'.format($string.toCurrency(textLength));
                    syn.$w.alert($resource.translations.textMaxLength.format($string.toCurrency(length)), '정보', alertOptions);

                    el.focus();
                    $textbox.event_focus(el);
                }
            }
            else {
                var maxLength = el.getAttribute('maxlength');
                if ($string.isNullOrEmpty(maxLength) == false) {
                    var length = parseInt(el.getAttribute('maxlength'));
                    var textLength = el.value.length;

                    if (textLength > length) {
                        var alertOptions = $object.clone(syn.$w.alertOptions);
                        // alertOptions.stack = '영어외에는 2자리씩 계산되며, 현재 {1}글자를 입력했습니다'.format($string.toCurrency(textLength));
                        syn.$w.alert($resource.translations.textMaxLength.format($string.toCurrency(length)), '정보', alertOptions);

                        el.focus();
                        $textbox.event_focus(el);
                    }
                }
            }
        },

        event_hour_blur(evt) {
            var el = evt.target || evt.srcElement || evt;

            if (el.value.length > 0) {
                if (parseInt(el.value) > 23) {
                    el.value = '23';
                }

                if (el.value.length == 1) {
                    el.value = el.value.padStart(2, '0');
                }
            }
        },

        event_minute_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            if (el.value.length > 0) {
                if (parseInt(el.value) > 59) {
                    el.value = '59';
                }

                if (el.value.length == 1) {
                    el.value = el.value.padStart(2, '0');
                }
            }
        },

        event_english_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            var synOptions = JSON.parse(el.getAttribute('syn-options'));
            var allowChars = synOptions.allowChars || [];
            if (allowChars.length > 0 && allowChars.indexOf(el.value) > -1) {
            }
            else {
                el.value = el.value.replace(/[^a-z0-9]/gi, '');
            }
        },

        event_uppercase_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            el.value = el.value.replace(/[^A-Z]/gi, '');
        },

        event_lowercase_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            el.value = el.value.replace(/[^a-z]/gi, '');
        },

        event_number_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            var synOptions = JSON.parse(el.getAttribute('syn-options'));

            if ($object.isNullOrUndefined(synOptions.maxCount) == false) {
                if ($string.toNumber(el.value) > synOptions.maxCount) {
                    el.value = synOptions.maxCount;
                }
            }

            if ($object.isNullOrUndefined(synOptions.minCount) == false) {
                if ($string.toNumber(el.value) < synOptions.minCount) {
                    el.value = synOptions.minCount;
                }
            }

            var val = el.value;
            if (val.startsWith('-') == true && val.length == 1 || val.trim().length == 0) {
                el.value = '0';
            }
        },

        event_numeric_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            var synOptions = JSON.parse(el.getAttribute('syn-options'));

            if ($object.isNullOrUndefined(synOptions.maxCount) == false) {
                if ($string.toNumber(el.value) > synOptions.maxCount) {
                    el.value = synOptions.maxCount;
                }
            }

            if ($object.isNullOrUndefined(synOptions.minCount) == false) {
                if ($string.toNumber(el.value) < synOptions.minCount) {
                    el.value = synOptions.minCount;
                }
            }

            if (el.value.length > 0 && synOptions.formatNumber === true) {
                el.value = $string.toCurrency(el.value);
            }

            var val = el.value;
            if (val.startsWith('-') == true && val.length == 1 || val.trim().length == 0) {
                el.value = '0';
            }
        },

        event_homephone_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            el.value = el.value.replace(/-/g, '');
            var value = el.value;

            if (value.length > 0) {
                el.setAttribute('placeholder', '');
                if (value.length == 12) {
                    if (syn.$v.regexs.onesPhone.test(value) == true) {
                        el.value = value.substr(0, 4).concat('-', value.substr(4, 4), '-', value.substr(8, 4));
                    } else {
                        el.value = '';
                    }
                } else {
                    if (value.length == 9) {
                        if (syn.$v.regexs.seoulPhone.test(value) == true) {
                            el.value = value.substr(0, 2).concat('-', value.substr(2, 3), '-', value.substr(5, 4));
                        } else {
                            el.value = '';
                        }
                    } else if (value.length == 10) {
                        if (value.substring(0, 2) == '02') {
                            if (syn.$v.regexs.seoulPhone.test(value) == true) {
                                el.value = value.substr(0, 2).concat('-', value.substr(2, 4), '-', value.substr(6, 4));
                            } else {
                                el.value = '';
                            }
                        } else {
                            if (syn.$v.regexs.areaPhone.test(value) == true) {
                                el.value = value.substr(0, 3).concat('-', value.substr(3, 3), '-', value.substr(6, 4));
                            }
                            else {
                                el.value = '';
                            }
                        }
                    } else if (value.length == 11) {
                        if (syn.$v.regexs.areaPhone.test(value) == true || syn.$v.regexs.onesPhone.test(value) == true) {
                            el.value = value.substr(0, 3).concat('-', value.substr(3, 4), '-', value.substr(7, 4));
                        }
                        else if (syn.$v.regexs.mobilePhone.test(value) == true) {
                            el.value = value.substr(0, 3).concat('-', value.substr(3, 4), '-', value.substr(7, 4));
                        }
                        else {
                            el.value = '';
                        }
                    } else {
                        el.value = '';
                    }
                }

                if (el.value == '') {
                    el.setAttribute('placeholder', '전화번호 확인 필요');
                }
            }
        },

        event_mobilephone_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            el.value = el.value.replace(/-/g, '');
            var value = el.value;

            if (value.length > 0) {
                el.setAttribute('placeholder', '');
                if (syn.$v.regexs.mobilePhone.test(value) == true) {
                    if (value.length == 10) {
                        el.value = value.substr(0, 3).concat('-', value.substr(3, 3), '-', value.substr(6, 4));
                    } else if (value.length == 11) {
                        el.value = value.substr(0, 3).concat('-', value.substr(3, 4), '-', value.substr(7, 4));
                    } else {
                        el.value = '';
                    }
                } else {
                    el.value = '';
                }

                if (el.value == '') {
                    el.setAttribute('placeholder', '전화번호 확인 필요');
                }
            }
        },

        event_phone_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            el.value = el.value.replace(/-/g, '');
            var value = el.value;

            if (value.length > 0) {
                el.setAttribute('placeholder', '');
                if (syn.$v.regexs.mobilePhone.test(value) == true) {
                    if (value.length == 10) {
                        el.value = value.substr(0, 3).concat('-', value.substr(3, 3), '-', value.substr(6, 4));
                    } else if (value.length == 11) {
                        el.value = value.substr(0, 3).concat('-', value.substr(3, 4), '-', value.substr(7, 4));
                    } else {
                        el.value = '';
                    }
                }
                else if (value.length == 12) {
                    if (syn.$v.regexs.onesPhone.test(value) == true) {
                        el.value = value.substr(0, 4).concat('-', value.substr(4, 4), '-', value.substr(8, 4));
                    } else {
                        el.value = '';
                    }
                } else {
                    if (value.length == 9) {
                        if (syn.$v.regexs.seoulPhone.test(value) == true) {
                            el.value = value.substr(0, 2).concat('-', value.substr(2, 3), '-', value.substr(5, 4));
                        } else {
                            el.value = '';
                        }
                    } else if (value.length == 10) {
                        if (value.substring(0, 2) == '02') {
                            if (syn.$v.regexs.seoulPhone.test(value) == true) {
                                el.value = value.substr(0, 2).concat('-', value.substr(2, 4), '-', value.substr(6, 4));
                            } else {
                                el.value = '';
                            }
                        } else {
                            if (syn.$v.regexs.areaPhone.test(value) == true) {
                                el.value = value.substr(0, 3).concat('-', value.substr(3, 3), '-', value.substr(6, 4));
                            }
                            else {
                                el.value = '';
                            }
                        }
                    } else if (value.length == 11) {
                        if (syn.$v.regexs.areaPhone.test(value) == true || syn.$v.regexs.onesPhone.test(value) == true) {
                            el.value = value.substr(0, 3).concat('-', value.substr(3, 4), '-', value.substr(7, 4));
                        }
                        else if (syn.$v.regexs.mobilePhone.test(value) == true) {
                            el.value = value.substr(0, 3).concat('-', value.substr(3, 4), '-', value.substr(7, 4));
                        }
                        else {
                            el.value = '';
                        }
                    } else {
                        el.value = '';
                    }
                }

                if (el.value == '') {
                    el.setAttribute('placeholder', '전화번호 확인 필요');
                }
            }
        },

        event_email_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            var value = el.value;

            if (el.value.length > 0) {
                el.setAttribute('placeholder', '');
                if (syn.$v.regexs.email.test(value) == false) {
                    el.setAttribute('placeholder', '이메일 확인 필요');
                    el.value = '';
                }
            }
        },

        event_year_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            if (el.value.length > 0) {
                el.setAttribute('placeholder', '');
                if (el.value == '0000' || $date.isDate(el.value) == false) {
                    el.setAttribute('placeholder', '년도 확인 필요');
                    el.value = '';
                }
            }
        },

        event_yearmonth_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            if (el.value.length > 0) {
                el.setAttribute('placeholder', '');
                if (el.value == '0000-00' || $date.isDate(el.value + '-01') == false) {
                    el.setAttribute('placeholder', '년월 확인 필요');
                    el.value = '';
                }
            }
        },

        event_date_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            if (el.value.length > 0) {
                el.setAttribute('placeholder', '');
                var value = el.value;
                if (value.length == 8) {
                    value = value.substring(0, 4) + '-' + value.substring(4, 6) + '-' + value.substring(6, 8);
                }

                if ($date.isDate(value) == true) {
                    el.value = value;
                } else {
                    el.setAttribute('placeholder', '일자 확인 필요');
                    el.value = '';
                }
            }
        },

        event_juminno_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            var val = el.value;

            if (val.length > 0) {
                el.setAttribute('placeholder', '');
                if (syn.$v.regexs.juminNo.test(val) == false) {
                    el.setAttribute('placeholder', '주민등록번호 확인 필요');
                    el.value = '';
                }
                else {
                    if (val.length == 13) {
                        val = val.substring(0, 6) + '-' + val.substring(6, 13);
                    }
                    el.value = val;
                }
            }
        },

        event_businessno_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            var val = el.value;
            if (val.length > 0) {
                el.setAttribute('placeholder', '');
                if ($textbox.isBusinessNo(val) == false) {
                    el.setAttribute('placeholder', '사업자번호 확인 필요');
                    el.value = '';
                }
                else {
                    if (val.length != 12) {
                        val = val.replace(/-/gi, '');
                        val = val.substring(0, 3) + '-' + val.substring(3, 5) + '-' + val.substring(5);
                    }

                    el.value = val;
                }
            }
        },

        event_corporateno_blur(evt) {
            var el = evt.target || evt.srcElement || evt;
            var val = el.value;
            if (val.length > 0) {
                el.setAttribute('placeholder', '');
                if ($textbox.isCorporateNo(val) == false) {
                    var synOptions = JSON.parse(el.getAttribute('syn-options'));
                    if ($object.isNullOrUndefined(synOptions.inValidateClear) == true || synOptions.inValidateClear == true) {
                        el.setAttribute('placeholder', '법인번호 확인 필요');
                        el.value = '';
                    }
                    else {
                        syn.$m.addClass(el, 'font:red!');
                        syn.$m.addClass(el, 'font:bold');
                    }
                }
                else {
                    if (val.length != 14) {
                        val = val.replace(/-/gi, '');
                        val = val.substring(0, 6) + '-' + val.substring(6);
                    }

                    el.value = val;

                    syn.$m.removeClass(el, 'font:red!');
                    syn.$m.removeClass(el, 'font:bold');
                }
            }
        },

        isBusinessNo(val) {
            var result = false;
            var valueMap = val.replace(/-/gi, '').split('').map(function (item) {
                return parseInt(item, 10);
            });

            if (valueMap.length === 10) {
                try {
                    var multiply = [1, 3, 7, 1, 3, 7, 1, 3, 5];
                    var checkSum = 0;

                    for (var i = 0; i < multiply.length; ++i) {
                        checkSum += multiply[i] * valueMap[i];
                    }

                    checkSum += parseInt((multiply[8] * valueMap[8]) / 10, 10);
                    result = Math.floor(valueMap[9]) === ((10 - (checkSum % 10)) % 10);
                } catch (e) {
                    result = false;
                }
            }

            return result;
        },

        isCorporateNo(val) {
            var result = false;
            var corpNo = val.replace(/-/gi, '');
            corpNo = corpNo.trim();

            var checkID = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
            var i, checkSum = 0;

            if (corpNo.length != 13) {
                return false;
            }

            for (var i = 0; i < 12; i++) {
                checkSum += checkID[i] * corpNo.charAt(i);
            }

            if ((10 - (checkSum % 10)) % 10 != corpNo.charAt(12)) {
                result = false;
            } else {
                result = true;
            }

            return result;
        },

        rangeMoveCaret(evt) {
            var begin = 0;
            var end = 0;

            var el = evt.target ? evt.srcElement : evt;
            end = el.value.length;

            var moveCaret = function () {
                if (el.type == 'text' && el.setSelectionRange) {
                    el.setSelectionRange(begin, end);
                } else if (el.createTextRange) {
                    var range = el.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', end);
                    range.moveStart('character', begin);
                    range.select();
                }
            };

            (syn.$b.isIE ? moveCaret : () => { setTimeout(moveCaret, 0) })();
        },

        getValue(elID) {
            var result = '';
            var el = syn.$l.get(elID);

            if ($object.isNullOrUndefined(el) == false) {
                var setting = JSON.parse(el.getAttribute('syn-options'));
                switch (setting.editType) {
                    case 'text':
                    case 'english':
                    case 'number':
                    case 'spinner':
                    case 'date':
                    case 'hour':
                    case 'minute':
                    case 'yearmonth':
                    case 'homephone':
                    case 'mobilephone':
                    case 'email':
                    case 'juminno':
                    case 'businessno':
                    case 'corporateno':
                        var mod = window[syn.$w.pageScript];
                        if (setting.getter === true && mod.hook.frameEvent) {
                            result = mod.hook.frameEvent('controlGetter', {
                                elID: elID,
                                value: el.value
                            });

                            if ($object.isNullOrUndefined(result) == true) {
                                result = el.value;
                            }
                        }
                        else {
                            result = el.value;
                        }
                        break;
                    case 'numeric':
                        result = el.value.replace(/,/g, '');
                        break;
                    default:
                        result = '';
                        break;
                }
            }

            return result;
        },

        setValue(elID, value) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                if (value != undefined && value != null) {
                    var result = '';
                    var setting = JSON.parse(el.getAttribute('syn-options'));
                    switch (setting.editType) {
                        case 'text':
                        case 'english':
                        case 'number':
                        case 'spinner':
                        case 'date':
                        case 'hour':
                        case 'minute':
                        case 'yearmonth':
                        case 'homephone':
                        case 'mobilephone':
                        case 'email':
                        case 'juminno':
                        case 'businessno':
                        case 'corporateno':
                            var mod = window[syn.$w.pageScript];
                            if (setting && setting.setter === true && mod.hook.frameEvent) {
                                result = mod.hook.frameEvent('controlSetter', {
                                    elID: elID,
                                    value: value
                                });

                                if ($object.isNullOrUndefined(result) == true) {
                                    el.value = result;
                                }
                            }
                            else {
                                el.value = value;
                            }
                            break;
                        case 'numeric':
                            el.value = $string.isNumber(value) == true ? $string.toCurrency(value) : value;
                            break;
                        default:
                            el.value = '';
                            break;
                    }
                }
                else {
                    var triggerOptions = syn.$w.getTriggerOptions(elID);
                    if (triggerOptions && triggerOptions.value) {
                        el.value = triggerOptions.value;
                    }
                }
            }
        },

        clear(elID, isControlLoad) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var options = JSON.parse(el.getAttribute('syn-options'));
                el.value = $object.defaultValue(options.dataType);
            }
        },

        setLocale(elID, translations, control, options) {
            var el = syn.$l.get(elID);

            var bind = $resource.getBindSource(control, 'placeholder');
            if (bind != null) {
                var value = $resource.translateText(control, options);;
                el[bind] = value;

                if (bind == 'placeholder') {
                    var setting = JSON.parse(el.getAttribute('syn-options'));
                    if (setting) {
                        setting.placeText = value;
                        if ($object.isEmpty(setting.placeText) == false) {
                            superplaceholder({
                                el: el,
                                sentences: $object.isString(setting.placeText) == true ? [setting.placeText] : setting.placeText
                            });
                        }

                        el.setAttribute('syn-options', JSON.stringify(setting));
                    }
                }
                else if (bind == 'controlText') {
                    var setting = JSON.parse(el.getAttribute('syn-options'));
                    if (setting) {
                        setting.controlText = value;
                        el.setAttribute('syn-options', JSON.stringify(setting));
                    }
                }
            }
        }
    });
    syn.uicontrols.$textbox = $textbox;
})(window);
