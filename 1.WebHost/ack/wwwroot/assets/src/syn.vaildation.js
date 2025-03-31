(function (context) {
    'use strict';
    const $validation = context.$validation || new syn.module();
    const $o = context.$object;
    const $s = context.$string;
    const $l = context.$library;
    const $this = context.$this;

    $validation.extend({
        isContinue: true,
        messages: [],
        targetEL: null,
        elements: {},

        initializeValidObject(el) {
            if (!this.elements[el.id]) {
                this.elements[el.id] = {
                    pattern: {},
                    range: {},
                    custom: {}
                };
            }
            return this.elements[el.id];
        },

        setElement(el) {
            el = syn.$l.getElement(el);
            if (el?.id) {
                this.initializeValidObject(el);
                this.targetEL = el;
            } else {
                this.targetEL = null;
            }
            return this;
        },

        required(el, isRequired = true, message) {
            if ($string.isNullOrEmpty(message)) {
                syn.$l.eventLog('$v.required', 'message 확인 필요', 'Information');
                return this;
            }
            el = syn.$l.getElement(el);
            if (el) {
                this.setElement(el);
                el.required = $string.toBoolean(isRequired);
                el.message = message;
            }
            return this;
        },

        pattern(el, validID, options = {}) {
            if (!options.expr || $string.isNullOrEmpty(options.message)) {
                syn.$l.eventLog('$v.pattern', 'options.expr, options.message 확인 필요', 'Information');
                return this;
            }
            this.setElement(el);
            if (this.targetEL?.id && validID) {
                const validObject = this.elements[this.targetEL.id];
                validObject.pattern[validID] = options;
            }
            return this;
        },

        range(el, validID, options = {}) {
            if (!$string.isNumber(options.min) || !$string.isNumber(options.max) ||
                $string.isNullOrEmpty(options.minOperator) || $string.isNullOrEmpty(options.maxOperator) ||
                $string.isNullOrEmpty(options.message)) {
                syn.$l.eventLog('$v.range', 'options.min, options.minOperator, options.max, options.maxOperator, options.message 확인 필요', 'Information');
                return this;
            }
            this.setElement(el);
            if (this.targetEL?.id && validID) {
                const validObject = this.elements[this.targetEL.id];
                validObject.range[validID] = options;
            }
            return this;
        },

        custom(el, validID, options = {}) {
            if (!options.functionName || $string.isNullOrEmpty(options.message)) {
                syn.$l.eventLog('$v.custom', 'options.functionName, options.message 확인 필요', 'Information');
                return this;
            }
            this.setElement(el);
            if (this.targetEL?.id && validID) {
                const validObject = this.elements[this.targetEL.id];
                validObject.custom[validID] = options;
            }
            return this;
        },

        removeValidate(validType, validID) {
            if (this.targetEL?.id && this.elements[this.targetEL.id]?.[validType]?.[validID]) {
                try {
                    delete this.elements[this.targetEL.id][validType][validID];
                } catch (e) {
                    syn.$l.eventLog('$v.removeValidate', `Failed to delete validation: ${validType}.${validID}`, 'Warning');
                }
            }
            return this;
        },

        remove(validID) {
            if (this.targetEL?.id && this.elements[this.targetEL.id]) {
                delete this.elements[this.targetEL.id].pattern?.[validID];
                delete this.elements[this.targetEL.id].range?.[validID];
                delete this.elements[this.targetEL.id].custom?.[validID];
            }
            return this;
        },

        clear() {
            this.isContinue = true;
            this.messages = [];
            this.targetEL = null;
            this.elements = {};
            return this;
        },

        validateControl(el) {
            el = syn.$l.getElement(el);
            if (!el?.id) return true;

            this.setElement(el);

            let isValid = true;
            const value = el.value?.trim() ?? '';

            if ($string.toBoolean(el.required) && value.length === 0) {
                isValid = false;
                this.messages.push(el.message);
                if (!this.isContinue) return false;
            }

            if (!isValid && !this.isContinue) return false;
            if (!$string.toBoolean(el.required) && value.length === 0) return true;

            const validObject = this.elements[el.id];
            if (!validObject) return isValid;

            for (const [validID, patternRule] of Object.entries(validObject.pattern)) {
                if (!patternRule.expr.test(value)) {
                    isValid = false;
                    this.messages.push(patternRule.message);
                    if (!this.isContinue) return false;
                }
            }
            if (!isValid && !this.isContinue) return false;

            for (const [validID, rangeRule] of Object.entries(validObject.range)) {
                let rangeResult = false;
                if ($string.isNumber(value)) {
                    try {
                        const numValue = $string.toNumber(value);
                        const min = $string.toNumber(rangeRule.min);
                        const max = $string.toNumber(rangeRule.max);

                        const checkMin = (op, val, limit) => {
                            switch (op) {
                                case '>': return limit > val;
                                case '>=': return limit >= val;
                                case '<': return limit < val;
                                case '<=': return limit <= val;
                                case '==': return limit == val;
                                case '!=': return limit != val;
                                default: return false;
                            }
                        };
                        const checkMax = (op, val, limit) => {
                            switch (op) {
                                case '<': return limit < val;
                                case '<=': return limit <= val;
                                case '>': return limit > val;
                                case '>=': return limit >= val;
                                case '==': return limit == val;
                                case '!=': return limit != val;
                                default: return false;
                            }
                        };
                        rangeResult = checkMin(rangeRule.minOperator, numValue, min) && checkMax(rangeRule.maxOperator, numValue, max);

                    } catch (error) {
                        syn.$l.eventLog('$v.validateControl', `elID: "${el.id}" 유효성 range 검사 오류 ${error.message}`, 'Warning');
                        rangeResult = false;
                    }
                } else {
                    rangeResult = false;
                }

                if (!rangeResult) {
                    isValid = false;
                    this.messages.push(rangeRule.message);
                    if (!this.isContinue) return false;
                }
            }
            if (!isValid && !this.isContinue) return false;

            for (const [validID, customRule] of Object.entries(validObject.custom)) {
                let customResult = false;
                const functionName = customRule.functionName;
                const parameters = { ...customRule };
                delete parameters.functionName;
                delete parameters.message;

                try {
                    let funcToCall = null;
                    if ($this?.method && typeof $this.method[functionName] === 'function') {
                        funcToCall = $this.method[functionName];
                        customResult = funcToCall.call($this, parameters);
                    }
                    else if (typeof context[functionName] === 'function') {
                        funcToCall = context[functionName];
                        customResult = funcToCall.call(context, parameters);
                    } else {
                        throw new Error(`Custom validation function "${functionName}" not found.`);
                    }
                } catch (error) {
                    syn.$l.eventLog('$v.validateControl', `elID: "${el.id}" 유효성 custom 검사 오류 ${error.message}`, 'Warning');
                    customResult = false;
                }

                if (!customResult) {
                    isValid = false;
                    this.messages.push(customRule.message);
                    if (!this.isContinue) return false;
                }
            }

            return isValid;
        },

        validateControls(els) {
            let allValid = true;
            const elements = Array.isArray(els) ? els : (els && els.type ? [els] : []);

            for (const el of elements) {
                const isValid = this.validateControl(el);
                if (!isValid) {
                    allValid = false;
                    if (!this.isContinue) break;
                }
            }
            return allValid;
        },

        validateForm() {
            let allValid = true;
            for (const elID in this.elements) {
                if (Object.prototype.hasOwnProperty.call(this.elements, elID)) {
                    const isValid = this.validateControl(elID);
                    if (!isValid) {
                        allValid = false;
                        if (!this.isContinue) break;
                    }
                }
            }
            return allValid;
        },

        toMessages() {
            const messageString = this.messages.join('\n');
            this.messages = [];
            return messageString;
        },

        valueType: Object.freeze({
            valid: 0, valueMissing: 1, typeMismatch: 2, patternMismatch: 3, tooLong: 4,
            rangeUnderflow: 5, rangeOverflow: 6, stepMismatch: 7
        }),

        validType: Object.freeze({
            required: 0, pattern: 1, range: 2, custom: 3
        }),

        regexs: Object.freeze({
            alphabet: /^[a-zA-Z0-9]*$/,
            juminNo: /^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[-]?([1-4]|9)\d{6}$/,
            numeric: /^-?(\d+|\d{1,3}(,\d{3})*)(\.\d+)?$/,
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
            url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i,
            ipAddress: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$|^localhost$/i,
            date: /^\d{4}-\d{2}-\d{2}$/,
            mobilePhone: /^01[016789]\d{7,8}$/,
            seoulPhone: /^02\d{7,8}$/,
            areaPhone: /^0(3[1-3]|4[1-4]|5[1-5]|6[1-4])\d{7,8}$/,
            onesPhone: /^050([245678])\d{7,8}$/,
            float: /^\s*-?(\d*\.?\d+|\d+\.?\d*)([eE][-+]?\d+)?\s*$/i,
            isoDate: /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d(:[0-5]\d)?|Z)/i
        })
    });
    context.$validation = syn.$v = $validation;
})(globalRoot);
