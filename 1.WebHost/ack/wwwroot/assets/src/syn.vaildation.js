/// <reference path='syn.core.js' />
/// <reference path='syn.library.js' />

(function (context) {
    'use strict';
    var $validation = context.$validation || new syn.module();

    $validation.extend({
        version: '1.0.0',
        isContinue: true,
        messages: [],
        targetEL: null,
        elements: {},

        initializeValidObject(el) {
            var validObject = $validation.elements[el.id];
            if ($object.isNullOrUndefined(validObject) == true) {
                validObject = {};
                validObject['pattern'] = {};
                validObject['range'] = {};
                validObject['custom'] = {};

                $validation.elements[el.id] = validObject;
            }
        },

        setElement(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                $validation.initializeValidObject(el);
                $validation.targetEL = el;
            }

            return $validation;
        },

        required(el, isRequired, message) {
            if ($string.isNullOrEmpty(message) == false) {
                el = $object.isString(el) == true ? syn.$l.get(el) : el;
                $validation.setElement(el);
                if ($object.isNullOrUndefined(el) == false) {
                    el.required = $string.toBoolean(isRequired);
                    el.message = message;
                }
            }
            else {
                syn.$l.eventLog('$v.required', 'message 확인 필요', 'Information');
            }
            return $validation;
        },

        pattern(el, validID, options) {
            if ($object.isNullOrUndefined(options) == false) {
                if ($object.isNullOrUndefined(options.expr) == false && $string.isNullOrEmpty(options.message) == false) {
                    el = $object.isString(el) == true ? syn.$l.get(el) : el;
                    $validation.setElement(el);
                    if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                        var validObject = $validation.elements[el.id];
                        validObject['pattern'][validID] = options;
                    }
                }
                else {
                    syn.$l.eventLog('$v.pattern', 'options.expr, options.message 확인 필요', 'Information');
                }
            }
            else {
                syn.$l.eventLog('$v.pattern', 'options 확인 필요', 'Information');
            }
            return $validation;
        },

        range(el, validID, options) {
            if ($object.isNullOrUndefined(options) == false) {
                if ($string.isNumber(options.min) == true
                    && $string.isNumber(options.max) == true
                    && $string.isNullOrEmpty(options.minOperator) == false
                    && $string.isNullOrEmpty(options.maxOperator) == false
                    && $string.isNullOrEmpty(options.message) == false
                ) {
                    el = $object.isString(el) == true ? syn.$l.get(el) : el;
                    $validation.setElement(el);
                    if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                        var validObject = $validation.elements[el.id];
                        validObject['range'][validID] = options;
                    }
                }
                else {
                    syn.$l.eventLog('$v.pattern', 'options.min, options.minOperator, options.max, options.maxOperator, options.message 확인 필요', 'Information');
                }
            }
            else {
                syn.$l.eventLog('$v.range', 'options 확인 필요', 'Information');
            }
            return $validation;
        },

        custom(el, validID, options) {
            if ($object.isNullOrUndefined(options) == false) {
                if ($object.isNullOrUndefined(options.functionName) == false && $string.isNullOrEmpty(options.message) == false) {
                    el = $object.isString(el) == true ? syn.$l.get(el) : el;
                    $validation.setElement(el);
                    if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                        var validObject = $validation.elements[el.id];
                        validObject['custom'][validID] = options;
                    }
                }
                else {
                    syn.$l.eventLog('$v.custom', 'options.functionName, options.message 확인 필요', 'Information');
                }
            }
            else {
                syn.$l.eventLog('$v.custom', 'options 확인 필요', 'Information');
            }
            return $validation;
        },

        removeValidate(validType, validID) {
            if ($validation.targetEL) {
                $validation.initializeValidObject($validation.targetEL);
                var validObject = $validation.elements[$validation.targetEL.id];

                try {
                    validObject[validType][validID] = null;
                    delete validObject[validType][validID];
                } catch {
                }
            }
            return $validation;
        },

        remove(validID) {
            if ($validation.targetEL) {
                var validObject = $validation.elements[$validation.targetEL.id];
                if ($object.isNullOrUndefined(validObject) == false) {
                    validObject['pattern'][validID] = null;
                    delete validObject['pattern'][validID];
                    validObject['range'][validID] = null;
                    delete validObject['range'][validID];
                    validObject['custom'][validID] = null;
                    delete validObject['custom'][validID];
                }
            }
            return $validation;
        },

        clear() {
            $validation.isContinue = false;
            $validation.messages = [];
            $validation.targetEL = null;
            $validation.elements = {};

            return $validation;
        },

        validateControl(el) {
            var result = false;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            $validation.setElement(el);
            if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                if ($string.toBoolean(el.required) == true) {
                    if (el.value.length > 0) {
                        result = true;
                    }
                    else {
                        result = false;
                        $validation.messages.push(el.message);

                        if ($validation.isContinue == false) {
                            return result;
                        }
                    }
                }

                var validObject = $validation.elements[el.id];
                if ($object.isNullOrUndefined(validObject) == false) {
                    for (var validType in validObject) {
                        if (validType === 'pattern') {
                            var pattern = null;
                            var expr = null;

                            for (var validID in validObject[validType]) {
                                var pattern = validObject[validType][validID];
                                var expr = pattern.expr;
                                result = expr.test(el.value);

                                if (result == false) {
                                    $validation.messages.push(pattern.message);

                                    if ($validation.isContinue == false) {
                                        break;
                                    }
                                }
                            }
                        }
                        else if (validType === 'range') {
                            var range = null;
                            var min = null;
                            var max = null;
                            var minOperator = null;
                            var maxOperator = null;

                            for (var validID in validObject[validType]) {
                                range = validObject[validType][validID];
                                min = range.min;
                                max = range.max;
                                minOperator = range.minOperator;
                                maxOperator = range.maxOperator;

                                try {
                                    var value = el.value.trim();
                                    if ($string.isNumber(value) == true) {
                                        result = eval(`${min} ${minOperator} ${value} && ${max} ${maxOperator} ${value}`);
                                    }
                                    else {
                                        result = false;
                                    }
                                } catch (error) {
                                    syn.$l.eventLog('$v.validateControl', 'elID: "{0}" 유효성 range 검사 오류 '.format(el.id) + error.message, 'Warning');
                                }

                                if (result == false) {
                                    $validation.messages.push(range.message);

                                    if ($validation.isContinue == false) {
                                        break;
                                    }
                                }
                            }
                        }
                        else if (validType === 'custom') {
                            var custom = null;
                            var functionName = null;
                            var parameters = null;

                            for (var validID in validObject[validType]) {
                                custom = validObject[validType][validID];
                                functionName = custom.functionName;
                                parameters = [];

                                for (var parameterName in custom) {
                                    if (parameterName !== 'functionName') {
                                        parameters[parameterName] = custom[parameterName];
                                    }
                                }

                                try {
                                    if ($this) {
                                        result = eval('window[syn.$w.pageScript]["method"]["' + functionName + '"]').call($this, parameters);
                                    }
                                    else {
                                        result = eval(functionName).call(globalRoot, parameters);
                                    }
                                } catch (error) {
                                    syn.$l.eventLog('$v.validateControl', 'elID: "{0}" 유효성 custom 검사 오류 '.format(el.id) + error.message, 'Warning');
                                }

                                if (result == false) {
                                    $validation.messages.push(custom.message);

                                    if ($validation.isContinue == false) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return $validation.messages.length === 0;
        },

        validateControls(els) {
            var result = true;
            var el = null;

            if (els.type) {
                el = els;
                result = $validation.validateControl(el);
            }
            else if (els.length) {
                for (var i = 0, len = els.length; i < len; i++) {
                    el = els[i];
                    result = $validation.validateControl(el);
                }
            }

            return result;
        },

        validateForm() {
            var result = false;
            for (var elID in $validation.elements) {
                result = $validation.validateControl(elID);
            }

            return result;
        },

        toMessages() {
            var result = [];
            for (var i = 0; i < $validation.messages.length; i++) {
                result.push($validation.messages[i]);
            }

            $validation.messages = [];
            return result.join('\n');
        },

        valueType: new function () {
            this.valid = 0;
            this.valueMissing = 1;
            this.typeMismatch = 2;
            this.patternMismatch = 3;
            this.tooLong = 4;
            this.rangeUnderflow = 5;
            this.rangeOverflow = 6;
            this.stepMismatch = 7;
        },

        validType: new function () {
            this.required = 0;
            this.pattern = 1;
            this.range = 2;
            this.custom = 3;
        },

        regexs: new function () {
            this.alphabet = /^[a-zA-Z]*$/;
            this.juminNo = /^(?:[0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1,2][0-9]|3[0,1]))-?[1-4][0-9]{6}$/;
            this.numeric = /^-?[0-9]*(\.[0-9]+)?$/;
            this.email = /^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i;
            this.url = /^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$/i;
            this.ipAddress = /^(?:\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b|null)$/;
            this.date = /^\d{4}-\d{2}-\d{2}$/;
            this.mobilePhone = /^01([0|1|6|7|8|9])(\d{7,8})/;
            this.seoulPhone = /^02(\d{7,8})/;
            this.areaPhone = /^0([0|3|4|5|6|7|8|])([0|1|2|3|4|5|])(\d{7,8})/;
            this.onesPhone = /^050([2|5])(\d{7,8})/;
            this.float = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;
            this.isoDate = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
        }
    });
    syn.$v = $validation;
})(globalRoot);
