(function (context) {
    'use strict';
    const $date = context.$date || new syn.module();
    const $array = context.$array || new syn.module();
    const $string = context.$string || new syn.module();
    const $number = context.$number || new syn.module();
    const $object = context.$object || new syn.module();

    (function () {
        if (!Function.prototype.clone) {
            Function.prototype.clone = function () {
                var that = this;
                var result = function T() {
                    return that.apply(this, arguments);
                };

                for (var key in this) {
                    result[key] = this[key];
                }

                return result;
            };
        }

        if (!Object.assign) {
            Object.assign = function clone(obj) {
                if (obj === null || typeof (obj) !== 'object') {
                    return obj;
                }

                var copy = obj.constructor();

                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) {
                        copy[attr] = obj[attr];
                    }
                }

                return copy;
            }
        }

        if (!Object.entries) {
            Object.entries = function (obj) {
                var ownProps = Object.keys(obj),
                    i = ownProps.length,
                    resArray = new Array(i);
                while (i--) {
                    resArray[i] = [ownProps[i], obj[ownProps[i]]];
                }
                return resArray;
            }
        }

        if (!String.prototype.trim) {
            String.prototype.trim = function () {
                var val = this.replace(/^\s+/, '');
                for (var i = val.length - 1; i > 0; i--) {
                    if (/\S/.test(val.charAt(i))) {
                        val = val.substring(0, i + 1);
                        break;
                    }
                }

                return val;
            };
        }

        if (!String.prototype.includes) {
            String.prototype.includes = function (val) {
                return this.indexOf(val) !== -1;
            };
        }

        if (!String.prototype.format) {
            String.prototype.format = function () {
                var val = this;
                for (var i = 0, len = arguments.length; i < len; i++) {
                    var exp = new RegExp('\{' + i.toString() + '+?\}', 'g');
                    val = val.replace(exp, arguments[i]);
                }

                return val;
            };
        }

        if (globalRoot.devicePlatform === 'node') {
        }
        else {
            if (!Element.prototype.matches) {
                Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
            }

            if (!Element.prototype.closest) {
                Element.prototype.closest = function (s) {
                    var el = this;

                    do {
                        if (el.matches(s)) {
                            return el;
                        }
                        el = el.parentElement || el.parentNode;
                    } while (el !== null && el.nodeType === 1);
                    return null;
                };
            }
        }
    })();

    $date.extend({
        interval: Object.freeze({
            year: 31536000000,
            week: 604800000,
            day: 86400000,
            hour: 3600000,
            minute: 60000,
            second: 1000,
        }),

        now() {
            return new Date();
        },

        clone(date) {
            if (date instanceof Date) {
                return new Date(date.getTime());
            } else if ($object.isString(date)) {
                try {
                    return new Date(date);
                } catch {
                    return null;
                }
            }
            return null;
        },

        isBetween(date, start, end) {
            if (!(date instanceof Date && start instanceof Date && end instanceof Date)) return false;
            const time = date.getTime();
            return time >= start.getTime() && time <= end.getTime();
        },

        equals(date, targetDate) {
            return date instanceof Date && targetDate instanceof Date && date.getTime() === targetDate.getTime();
        },

        equalDay(date, targetDate) {
            return date instanceof Date && targetDate instanceof Date && date.toDateString() === targetDate.toDateString();
        },

        isToday(date) {
            return date instanceof Date && this.equalDay(date, new Date());
        },

        toString(date, format, options = {}) {
            let dateObj = date;
            if ($object.isString(date) && this.isDate(date)) {
                dateObj = new Date(date);
            }

            if (!($object.isDate(dateObj) && !isNaN(dateObj))) {
                return '';
            }

            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            const hours = dateObj.getHours();
            const minutes = dateObj.getMinutes();
            const seconds = dateObj.getSeconds();
            const milliseconds = dateObj.getMilliseconds();
            const weekNames = ['일', '월', '화', '수', '목', '금', '토'];
            const dayOfWeek = weekNames[dateObj.getDay()];

            const pad = (num, len = 2) => String(num).padStart(len, '0');

            switch (format) {
                case 'd': return `${year}-${pad(month)}-${pad(day)}`;
                case 't': return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                case 'a': return `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                case 'i': return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)} Z`;
                case 'f': return `${year}${pad(month)}${pad(day)}${pad(hours)}${pad(minutes)}${pad(seconds)}${pad(milliseconds, 3)}`;
                case 's': return `${pad(hours)}${pad(minutes)}${pad(seconds)}${pad(milliseconds, 3)}`;
                case 'n': return `${year}년 ${pad(month)}월 ${pad(day)}일 (${dayOfWeek})`;
                case 'nt': return `${year}년 ${pad(month)}월 ${pad(day)}일 (${dayOfWeek}), ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                case 'mdn': return `${pad(month)}월 ${pad(day)}일`;
                case 'w':
                    const opts = { weekStartSunday: true, ...options };
                    const yearNum = dateObj.getFullYear();
                    const monthNum = dateObj.getMonth() + 1;
                    const weeksInMonth = this.weekOfMonth(yearNum, monthNum, opts.weekStartSunday);
                    const currentDateNum = parseInt(`${yearNum}${pad(monthNum)}${pad(day)}`, 10);

                    for (let i = 0; i < weeksInMonth.length; i++) {
                        const week = weeksInMonth[i];
                        const start = parseInt(week.weekStartDate.replace(/-/g, ''), 10);
                        const end = parseInt(week.weekEndDate.replace(/-/g, ''), 10);
                        if (currentDateNum >= start && currentDateNum <= end) {
                            return i + 1;
                        }
                    }
                    return 1;
                case 'wn': return dayOfWeek;
                case 'm': return pad(month);
                case 'y': return String(year);
                case 'ym': return `${year}-${pad(month)}`;
                default:
                    const map = {
                        yyyy: date.getFullYear(),
                        MM: ('0' + (date.getMonth() + 1)).slice(-2),
                        dd: ('0' + date.getDate()).slice(-2),
                        HH: ('0' + date.getHours()).slice(-2),
                        mm: ('0' + date.getMinutes()).slice(-2),
                        ss: ('0' + date.getSeconds()).slice(-2)
                    };
                    return format.replace(/yyyy|MM|dd|HH|mm|ss/gi, matched => map[matched] || '');
            }
        },


        addSecond(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            return new Date(date.getTime() + val * this.interval.second);
        },

        addMinute(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            return new Date(date.getTime() + val * this.interval.minute);
        },

        addHour(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            return new Date(date.getTime() + val * this.interval.hour);
        },

        addDay(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            const newDate = new Date(date.getTime());
            newDate.setDate(date.getDate() + val);
            return newDate;
        },

        addWeek(date, val) {
            return this.addDay(date, val * 7);
        },

        addMonth(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            const newDate = new Date(date.getTime());
            const targetMonth = date.getMonth() + val;
            newDate.setMonth(targetMonth);
            if (newDate.getMonth() !== (targetMonth % 12 + 12) % 12) {
                newDate.setDate(0);
            }
            return newDate;
        },

        addYear(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            const newDate = new Date(date.getTime());
            newDate.setFullYear(date.getFullYear() + val);
            if (date.getMonth() === 1 && date.getDate() === 29 && newDate.getDate() !== 29) {
                newDate.setDate(0);
            }
            return newDate;
        },


        getFirstDate(date) {
            if (!(date instanceof Date)) return null;
            return new Date(date.getFullYear(), date.getMonth(), 1);
        },

        getLastDate(date) {
            if (!(date instanceof Date)) return null;
            return new Date(date.getFullYear(), date.getMonth() + 1, 0);
        },

        diff(start, end, interval = 'day') {
            if (!(start instanceof Date && end instanceof Date)) return 0;

            if (interval === 'month') {
                return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            } else if (this.interval[interval]) {
                const diffMs = end.getTime() - start.getTime();
                return Math.floor(diffMs / this.interval[interval]);
            }
            return 0;
        },

        toTicks(date) {
            if (!(date instanceof Date)) return 0;
            return date.getTime() * 10000 + 621355968000000000;
        },

        isDate(val) {
            if (val instanceof Date && !isNaN(val)) return true;
            if (!$object.isString(val)) return false;

            const parsedDate = new Date(val);
            if (!isNaN(parsedDate)) return true;

            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                const parts = val.split('-');
                if (parts[1] >= 1 && parts[1] <= 12 && parts[2] >= 1 && parts[2] <= 31) {
                    const specificDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    return !isNaN(specificDate);
                }
            }

            return false;
        },

        isISOString(val) {
            return $object.isString(val) && $validation.regexs.isoDate.test(val);
        },

        weekOfMonth(year, month, weekStartSunday = true) {
            const result = [];
            const normalizedWeekStartSunday = typeof weekStartSunday === 'boolean'
                ? weekStartSunday
                : weekStartSunday === 'true';
            const currentMonth = month || new Date().getMonth() + 1;
            const weekStand = normalizedWeekStartSunday ? 7 : 8;

            const date = new Date(year, currentMonth - 1);
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const numberPad = (num, width) =>
                String(num).padStart(width, '0');

            let firstWeekEndDate = true;
            const thisMonthFirstWeek = firstDay.getDay();

            for (let num = 1; num <= 6; num++) {
                if (lastDay.getMonth() !== firstDay.getMonth()) {
                    break;
                }

                const week = {};
                if (firstDay.getDay() <= 1) {
                    if (firstDay.getDay() === 0 && !normalizedWeekStartSunday) {
                        firstDay.setDate(firstDay.getDate() + 1);
                    }

                    week.weekStartDate = `${firstDay.getFullYear()}-${numberPad(firstDay.getMonth() + 1, 2)}-${numberPad(firstDay.getDate(), 2)}`;
                }

                if (weekStand > thisMonthFirstWeek) {
                    if (firstWeekEndDate) {
                        if (weekStand - firstDay.getDay() === 1) {
                            firstDay.setDate(firstDay.getDate() + (weekStand - firstDay.getDay()) - 1);
                        } else if (weekStand - firstDay.getDay() > 1) {
                            firstDay.setDate(firstDay.getDate() + (weekStand - firstDay.getDay()) - 1);
                        }
                        firstWeekEndDate = false;
                    } else {
                        firstDay.setDate(firstDay.getDate() + 6);
                    }
                } else {
                    firstDay.setDate(firstDay.getDate() + (6 - firstDay.getDay()) + weekStand);
                }

                if (week.weekStartDate) {
                    week.weekEndDate = `${firstDay.getFullYear()}-${numberPad(firstDay.getMonth() + 1, 2)}-${numberPad(firstDay.getDate(), 2)}`;
                    result.push(week);
                }

                firstDay.setDate(firstDay.getDate() + 1);
            }

            return result;
        },

        timeAgo(dateInput) {
            let date;
            if ($object.isString(dateInput) && this.isDate(dateInput)) {
                date = new Date(dateInput);
            } else if (dateInput instanceof Date) {
                date = dateInput;
            } else {
                return '';
            }

            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 0) return 'in the future';

            const intervals = [
                { label: '년', seconds: 31536000 },
                { label: '달', seconds: 2592000 },
                { label: '주', seconds: 604800 },
                { label: '일', seconds: 86400 },
                { label: '시간', seconds: 3600 },
                { label: '분', seconds: 60 },
                { label: '초', seconds: 1 }
            ];

            for (const interval of intervals) {
                const count = Math.floor(seconds / interval.seconds);
                if (count >= 1) {
                    return `${count}${interval.label} 전`;
                }
            }
            return '방금 전';
        }

    });
    context.$date = $date;

    $string.extend({
        toValue(value, defaultValue = '') {
            return (value === undefined || value === null) ? String(defaultValue) : String(value);
        },

        br(val) {
            return String(val).replace(/(\r\n|\r|\n)/g, '<br />');
        },

        interpolate(text, json, options = {}) {
            if (json === null || json === undefined || typeof text !== 'string') return text;

            const { defaultValue = null, separator = '\n' } = options;

            const replaceFunc = (template, item) => {
                return template.replace(/#\{([^{}]*)\}/g, (match, key) => {
                    const value = item[key];
                    if (value !== undefined && value !== null) {
                        if (Array.isArray(value)) return value.join(', ');
                        if (value instanceof Date) return $date.toString(value, 'a');
                        return String(value);
                    }
                    return defaultValue !== null ? defaultValue : match;
                });
            };

            if (Array.isArray(json)) {
                return json.map(item => replaceFunc(text, item)).join(separator);
            } else if (typeof json === 'object') {
                return replaceFunc(text, json);
            }

            return text;
        },

        isNullOrEmpty(val) {
            return val === undefined || val === null || String(val).trim() === '';
        },

        sanitizeHTML(val, removeSpecialChars = false) {
            if (typeof val !== 'string') return '';
            let result = val.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/gi, ' ');
            if (removeSpecialChars) {
                result = result.replace(/[.,;:'"!?%#$*_+=\-\\/()[\]{}<>~`“”’]/g, '');
            }
            return result.trim();
        },

        cleanHTML(val) {
            if (typeof val !== 'string' || globalRoot.devicePlatform === 'node') return val;
            try {
                const el = document.createElement('div');
                el.innerHTML = val.replace(/<br\s*\/?>/gi, '\n');
                const text = el.textContent || el.innerText || '';
                return text.replace(/\s{2,}/g, ' ');
            } catch {
                return val;
            }
        },

        toHtmlChar(val, charStrings = `&'<>!"#%()*+,./;=@[\]^\`{|}~`) {
            if (typeof val !== 'string') return '';
            const charMap = {
                '&': '&amp;', '\'': '&#39;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '!': '&#33;', '#': '&#35;', '%': '&#37;',
                '(': '&#40;', ')': '&#41;', '*': '&#42;', '+': '&#43;', ',': '&#44;', '.': '&#46;', '/': '&#47;', ';': '&#59;',
                '=': '&#61;', '@': '&#64;', '[': '&#91;', '\\': '&#92;', ']': '&#93;', '^': '&#94;', '`': '&#96;', '{': '&#123;',
                '|': '&#124;', '}': '&#125;', '~': '&#126;'
            };
            const escapedChars = charStrings.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`[${escapedChars}]`, 'g');
            return val.replace(regex, char => charMap[char] || char);
        },

        toCharHtml(val, escapedChars = '&(amp|#39|lt|gt|quot|#33|#35|#37|#40|#41|#42|#43|#44|#46|#47|#59|#61|#64|#91|#92|#93|#94|#96|#123|#124|#125|#126);') {
            if (typeof val !== 'string') return '';
            const entityMap = {
                '&amp;': '&', '&#39;': '\'', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#33;': '!', '&#35;': '#', '&#37;': '%',
                '&#40;': '(', '&#41;': ')', '&#42;': '*', '&#43;': '+', '&#44;': ',', '&#46;': '.', '&#47;': '/', '&#59;': ';',
                '&#61;': '=', '&#64;': '@', '&#91;': '[', '&#92;': '\\', '&#93;': ']', '&#94;': '^', '&#96;': '`', '&#123;': '{',
                '&#124;': '|', '&#125;': '}', '&#126;': '~'
            };
            const regex = new RegExp(escapedChars, 'g');
            return val.replace(regex, match => entityMap[match] || match);
        },

        length(val) {
            if (typeof val !== 'string') return 0;
            let byteLength = 0;
            for (let i = 0; i < val.length; i++) {
                const charCode = val.charCodeAt(i);
                if (charCode <= 0x7F) {
                    byteLength += 1;
                } else if (charCode <= 0x7FF) {
                    byteLength += 2;
                } else if (charCode <= 0xFFFF) {
                    byteLength += 3;
                } else {
                    byteLength += 4;
                }
            }
            return byteLength;
        },

        split(val, char = ',') {
            return typeof val === 'string' ? val.split(char).filter(p => p.trim() !== '') : [];
        },

        isNumber(num) {
            if (num === null || num === undefined || String(num).trim() === '') return false;
            const regex = /^-?(\d+|\d{1,3}(,\d{3})*)(\.\d+)?$/;
            const strNum = String(num).trim();
            if (regex.test(strNum)) {
                const cleanedNum = strNum.replace(/,/g, '');
                return !isNaN(parseFloat(cleanedNum));
            }
            return false;
        },

        toNumber(val) {
            var result = 0;
            try {
                result = parseFloat(($object.isNullOrUndefined(val) == true ? 0 : val) === 0 || val === '' ? '0' : val.toString().replace(/,/g, ''));
            } catch (error) {
                syn.$l.eventLog('$string.toNumber', error, 'Warning');
            }

            return result;
        },

        capitalize(val) {
            return typeof val === 'string'
                ? val.replace(/\b([a-z])/g, match => match.toUpperCase())
                : '';
        },

        toJson(val, options = {}) {
            if (typeof val !== 'string') return [];

            const { delimiter = ',', newline = '\n', meta = {} } = options;
            const lines = val.split(newline);
            if (lines.length < 1) return [];

            const headers = lines[0].split(delimiter).map(header => header.trim().replace(/^"|"$/g, ''));
            const headerLength = headers.length;
            const result = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;

                const row = line.split(delimiter);
                const item = {};

                for (let j = 0; j < headerLength; j++) {
                    const columnName = headers[j];
                    const cellValue = row[j]?.trim() ?? '';

                    item[columnName] = meta[columnName]
                        ? this.toParseType(cellValue, meta[columnName])
                        : this.toDynamic(cellValue);
                }
                result.push(item);
            }
            return result;
        },

        toParameterObject(parameters) {
            return (parameters.match(/([^?:;]+)(:([^;]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf(':')).replace('@', '')] = v.slice(v.indexOf(':') + 1), a;
            }, {});
        },

        toUrlObject(url) {
            url = url || '';
            return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1), a;
            }, {});
        },

        toBoolean(val) {
            if ($object.isNullOrUndefined(val) == true) {
                return false;
            }

            const lowerVal = val.toString().toLowerCase();
            const trueValues = ['true', 'y', '1', 'ok', 'yes', 'on'];
            return trueValues.includes(lowerVal);
        },

        toDynamic(val, emptyIsNull = false) {
            const strVal = String(val).trim();

            if (emptyIsNull && strVal === '') return null;
            if (strVal === '') return '';

            if (/^(true|y|1)$/i.test(strVal)) return true;
            if (/^(false|n|0)$/i.test(strVal)) return false;

            const numStr = strVal.replace(/,/g, '');
            if ($validation.regexs.float.test(numStr)) {
                const num = parseFloat(numStr);
                if (!isNaN(num)) return num;
            }

            if ($validation.regexs.isoDate.test(strVal)) {
                const date = new Date(strVal);
                if (!isNaN(date)) return date;
            }

            return val;
        },

        toParseType(val, metaType = 'string', emptyIsNull = false) {
            const strVal = String(val).trim();

            if (emptyIsNull && strVal === '') return null;

            switch (String(metaType).toLowerCase()) {
                case 'string':
                    return strVal;
                case 'bool':
                case 'boolean':
                    return this.toBoolean(strVal);
                case 'number':
                case 'numeric':
                case 'int':
                    const numStr = strVal.replace(/,/g, '');
                    if ($validation.regexs.float.test(numStr)) {
                        const num = parseFloat(numStr);
                        return isNaN(num) ? (emptyIsNull ? null : 0) : num;
                    }
                    return emptyIsNull ? null : 0;
                case 'date':
                case 'datetime':
                    if ($validation.regexs.isoDate.test(strVal)) {
                        const date = new Date(strVal);
                        return isNaN(date) ? null : date;
                    } else if ($date.isDate(strVal)) {
                        const date = new Date(strVal);
                        return isNaN(date) ? null : date;
                    }
                    return null;
                default:
                    return strVal;
            }
        },

        toNumberString(val) {
            return typeof val === 'string' ? val.trim().replace(/[^\d.-]/g, '') : '';
        },

        toCurrency(val, localeID, options = {}) {
            const num = this.toNumber(val);
            if (isNaN(num)) return null;

            if (localeID && typeof Intl !== 'undefined' && Intl.NumberFormat) {
                const formatOptions = {
                    style: 'currency',
                    currency: 'KRW',
                    ...options
                };
                try {
                    return new Intl.NumberFormat(localeID, formatOptions).format(num);
                } catch (e) {
                    syn.$l.eventLog('$string.toCurrency', `Intl formatting error for locale ${localeID}: ${e}`, 'Warning');
                }
            }

            const [integerPart, decimalPart] = String(num).split('.');
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
        },


        pad(val, length, fix = '0', isLeft = true) {
            const strVal = String(val);
            const padLength = Math.max(0, length - strVal.length);
            const padding = String(fix).repeat(padLength);
            return $string.toBoolean(isLeft) ? padding + strVal : strVal + padding;
        }

    });
    context.$string = $string;

    $array.extend({
        distinct(arr) {
            return Array.isArray(arr) ? [...new Set(arr)] : [];
        },

        sort(arr, ascending = true) {
            if (!Array.isArray(arr)) return [];
            return [...arr].sort((a, b) => {
                if (a < b) return ascending ? -1 : 1;
                if (a > b) return ascending ? 1 : -1;
                return 0;
            });
        },

        objectSort(arr, prop, ascending = true) {
            if (!Array.isArray(arr) || !prop) return [];
            return [...arr].sort((v1, v2) => {
                const prop1 = v1[prop];
                const prop2 = v2[prop];
                if (prop1 < prop2) return ascending ? -1 : 1;
                if (prop1 > prop2) return ascending ? 1 : -1;
                return 0;
            });
        },

        groupBy(data, predicate) {
            if (!Array.isArray(data)) return {};
            const keySelector = typeof predicate === 'function' ? predicate : (item => item[predicate]);
            return data.reduce((result, value) => {
                const groupKey = keySelector(value);
                (result[groupKey] = result[groupKey] || []).push(value);
                return result;
            }, {});
        },

        shuffle(arr) {
            if (!Array.isArray(arr)) return [];
            const shuffled = [...arr];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        },

        addAt(arr, index, val) {
            if (!Array.isArray(arr)) return [];
            const copy = [...arr];
            const effectiveIndex = Math.max(0, Math.min(index, copy.length));
            copy.splice(effectiveIndex, 0, val);
            return copy;
        },

        removeAt(arr, index) {
            if (!Array.isArray(arr)) return [];
            const copy = [...arr];
            if (index >= 0 && index < copy.length) {
                copy.splice(index, 1);
            }
            return copy;
        },

        contains(arr, val) {
            return Array.isArray(arr) && arr.includes(val);
        },

        merge(arr, brr, predicate = (a, b) => a === b) {
            if (!Array.isArray(arr) || !Array.isArray(brr)) return arr || [];
            const crr = [...arr];
            brr.forEach(bItem => {
                if (!crr.some(cItem => predicate(bItem, cItem))) {
                    crr.push(bItem);
                }
            });
            return crr;
        },

        union(sourceArray, targetArray) {
            if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return [];
            return [...new Set([...sourceArray, ...targetArray])];
        },

        difference(sourceArray, targetArray) {
            if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return [];
            const targetSet = new Set(targetArray);
            return sourceArray.filter(x => !targetSet.has(x));
        },

        intersect(sourceArray, targetArray) {
            if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return [];
            const targetSet = new Set(targetArray);
            return sourceArray.filter(x => targetSet.has(x));
        },

        symmetryDifference(sourceArray, targetArray) {
            if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return [];
            const sourceSet = new Set(sourceArray);
            const targetSet = new Set(targetArray);
            const diff1 = sourceArray.filter(x => !targetSet.has(x));
            const diff2 = targetArray.filter(x => !sourceSet.has(x));
            return [...diff1, ...diff2];
        },

        getValue(items, parameterName, defaultValue, parameterProperty, valueProperty) {
            var result = null;

            if (items && items.length > 0) {
                var parseParameter = null;
                if (parameterProperty) {
                    parseParameter = items.find(function (item) { return item[parameterProperty] == parameterName; });
                }
                else {
                    parseParameter = items.find(function (item) { return item.ParameterName == parameterName || item.parameterName == parameterName; });
                }

                if (parseParameter) {
                    if (valueProperty) {
                        result = parseParameter[valueProperty];
                    }
                    else {
                        result = parseParameter.Value || parseParameter.value;
                    }
                }
            }

            if (result == null) {
                if (defaultValue === undefined) {
                    result = '';
                }
                else {
                    result = defaultValue;
                }
            }

            return result;
        },

        ranks(values, asc = false) {
            if (!Array.isArray(values)) return [];

            const indexedValues = values.map((value, index) => ({ value: $string.toNumber(value), index }));

            indexedValues.sort((a, b) => asc ? a.value - b.value : b.value - a.value);

            const ranks = new Array(values.length);
            let currentRank = 1;
            for (let i = 0; i < indexedValues.length; i++) {
                if (i > 0 && indexedValues[i].value !== indexedValues[i - 1].value) {
                    currentRank = i + 1;
                }
                ranks[indexedValues[i].index] = currentRank;
            }

            return ranks;
        },

        split(value, flag = ',') {
            if (typeof value !== 'string') return [];
            return value.split(flag).map(item => item.trim()).filter(item => item.length > 0);
        }
    });
    context.$array = $array;

    $number.extend({
        duration(ms) {
            if (typeof ms !== 'number' || isNaN(ms)) return {};
            const absMs = Math.abs(ms);
            const seconds = Math.floor(absMs / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const years = Math.floor(days / 365);
            const weeks = Math.floor((days % 365) / 7);

            return {
                year: years,
                week: weeks,
                day: days,
                hour: hours % 24,
                minute: minutes % 60,
                second: seconds % 60,
                millisecond: absMs % 1000
            };
        },

        toByteString(num, precision = 3, addSpace = true) {
            if (typeof num !== 'number' || isNaN(num)) return `0${addSpace ? ' ' : ''}B`;

            const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const absNum = Math.abs(num);

            if (absNum < 1) return `${num}${addSpace ? ' ' : ''}${units[0]}`;

            const exponent = Math.min(
                Math.floor(Math.log(absNum) / Math.log(1024)),
                units.length - 1
            );

            const scaledNum = absNum / Math.pow(1024, exponent);
            const formattedNum = Number(scaledNum.toPrecision(precision));

            return `${num < 0 ? '-' : ''}${formattedNum}${addSpace ? ' ' : ''}${units[exponent]}`;
        },


        random(start = 0, end = 10) {
            const min = Math.ceil(Math.min(start, end));
            const max = Math.floor(Math.max(start, end));
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        isRange(num, low, high) {
            return typeof num === 'number' && num >= low && num <= high;
        },

        limit(num, low, high) {
            return typeof num === 'number' ? Math.max(low, Math.min(num, high)) : low;
        },

        percent(num, total, precision = 0) {
            if (typeof num !== 'number' || typeof total !== 'number' || total === 0) return 0;
            const factor = Math.pow(10, precision);
            return Math.round((num * 100 / total) * factor) / factor;
        }
    });
    context.$number = $number;

    $object.extend({
        isNullOrUndefined(val) {
            return val === undefined || val === null;
        },

        toCSV(obj, options = {}) {
            if (typeof obj !== 'object' || obj === null) return null;

            const { scopechar = '/', delimiter = ',', newline = '\n' } = options;
            const dataArray = Array.isArray(obj) ? obj : [obj];
            if (dataArray.length === 0) return '';

            const rowsData = [];
            const headersSet = new Set();

            dataArray.forEach(item => {
                const flatRow = {};
                const queue = [[item, '']];

                while (queue.length > 0) {
                    const [currentObj, prefix] = queue.pop();

                    if (currentObj !== null && typeof currentObj === 'object' && !Array.isArray(currentObj) && !(currentObj instanceof Date)) {
                        Object.entries(currentObj).forEach(([key, value]) => {
                            queue.push([value, prefix ? `${prefix}${scopechar}${key}` : key]);
                        });
                    } else {
                        const headerName = prefix || 'value';
                        headersSet.add(headerName);
                        flatRow[headerName] = (Array.isArray(currentObj) || currentObj instanceof Date)
                            ? JSON.stringify(currentObj)
                            : (currentObj ?? '');
                    }
                }
                rowsData.push(flatRow);
            });

            const headersArray = Array.from(headersSet).sort();
            const headerRow = headersArray.join(delimiter);

            const valueRows = rowsData.map(row =>
                headersArray.map(header => {
                    let cellValue = String(row[header] ?? '');
                    if (cellValue.includes(delimiter) || cellValue.includes(newline) || cellValue.includes('"')) {
                        cellValue = `"${cellValue.replace(/"/g, '""')}"`;
                    }
                    return cellValue;
                }).join(delimiter)
            );

            return [headerRow, ...valueRows].join(newline);
        },

        toParameterString(jsonObject) {
            if (!jsonObject || typeof jsonObject !== 'object') return '';
            return Object.entries(jsonObject)
                .map(([key, val]) => `@${key}:${$string.toValue($string.toDynamic(val), '')}`)
                .join(';');
        },

        getType(val) {
            const type = typeof val;
            if (type === 'object') {
                if (val === null) return 'null';
                if (Array.isArray(val)) return 'array';
                if (val instanceof Date) return 'date';
                if (globalRoot.devicePlatform !== 'node' && val instanceof HTMLElement) return 'element';
                return 'object';
            }
            return type;
        },

        defaultValue(type) {
            switch (String(type).toLowerCase()) {
                case 'boolean': return false;
                case 'function': return () => { };
                case 'null': return null;
                case 'number': case 'numeric': case 'int': return 0;
                case 'object': return {};
                case 'date': case 'datetime': return new Date();
                case 'string': return '';
                case 'symbol': return Symbol();
                case 'undefined': return undefined;
                case 'array': return [];
                default: return '';
            }
        },

        isDefined(val) {
            return val !== undefined;
        },

        isNull(val) {
            return val === null;
        },

        isArray(val) {
            return Array.isArray(val);
        },

        isDate(val) {
            return val instanceof Date && !isNaN(val.getTime());
        },

        isString(val) {
            return typeof val === 'string';
        },

        isNumber(val) {
            return typeof val === 'number' && !isNaN(val);
        },

        isFunction(val) {
            return typeof val === 'function';
        },

        isObject(val) {
            return typeof val === 'object' && val !== null;
        },

        isObjectEmpty(val) {
            return typeof val === 'object' && val !== null && Object.keys(val).length === 0 && val.constructor === Object;
        },

        isBoolean(val) {
            if (typeof val === 'boolean') return true;
            if (val === undefined || val === null) return false;
            const strVal = String(val).toUpperCase();
            return ['TRUE', 'FALSE', 'Y', 'N', '1', '0'].includes(strVal);
        },

        isEmpty(val) {
            if (val === undefined || val === null) return true;
            if (typeof val === 'number' && isNaN(val)) return true;
            if (typeof val === 'string' && val.trim() === '') return true;
            if (Array.isArray(val) && val.length === 0) return true;
            if (typeof val === 'object' && !(val instanceof Date) && Object.keys(val).length === 0 && val.constructor === Object) return true;
            return false;
        },

        clone(val, isNested = true) {
            if (typeof val !== 'object' || val === null) {
                return val;
            }

            if (val instanceof Date) {
                return new Date(val.getTime());
            }

            if (Array.isArray(val)) {
                return isNested ? val.map(item => this.clone(item, true)) : [...val];
            }

            if (val instanceof HTMLElement && typeof val.cloneNode === 'function') {
                return val.cloneNode(isNested);
            }

            if (typeof val === 'object') {
                const clonedObj = Object.create(Object.getPrototypeOf(val));
                if (isNested) {
                    Object.keys(val).forEach(key => {
                        clonedObj[key] = this.clone(val[key], true);
                    });
                } else {
                    Object.assign(clonedObj, val);
                }
                return clonedObj;
            }

            return val;
        },

        extend(to, from, overwrite = true) {
            if (!from || typeof from !== 'object') return to;

            Object.entries(from).forEach(([prop, fromVal]) => {
                const toVal = to[prop];
                const hasProp = Object.prototype.hasOwnProperty.call(to, prop);

                if (this.isObject(fromVal) && fromVal !== null && !this.isDate(fromVal) && !Array.isArray(fromVal) && !(fromVal instanceof HTMLElement)) {
                    if (!hasProp || !this.isObject(toVal)) {
                        to[prop] = {};
                    }
                    this.extend(to[prop], fromVal, overwrite);
                } else if (overwrite || !hasProp) {
                    to[prop] = this.clone(fromVal, false);
                }
            });
            return to;
        },

        excludeKeys(sourceObject, keysToExclude) {
            return Object.fromEntries(
                Object.entries(sourceObject).filter(([key]) => !keysToExclude.includes(key))
            );
        }
    });
    context.$object = $object;
})(globalRoot);
