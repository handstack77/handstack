/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $date = context.$date || new syn.module();
    var $array = context.$array || new syn.module();
    var $string = context.$string || new syn.module();
    var $number = context.$number || new syn.module();
    var $object = context.$object || new syn.module();

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
        version: '1.0.0',
        interval: {
            year: 1000 * 60 * 60 * 24 * 365,
            week: 1000 * 60 * 60 * 24 * 7,
            day: 1000 * 60 * 60 * 24,
            hour: 60000 * 60,
            minute: 60000,
            second: 1000,
        },

        now() {
            return new Date();
        },

        clone(date) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.getTime());
            }
            else if ($object.isString(date) == true) {
                result = new Date(date);
            }
            return result;
        },

        isBetween(date, start, end) {
            var result = false;
            if (date instanceof Date && start instanceof Date && end instanceof Date) {
                result = date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
            }

            return result;
        },

        equals(date, targetDate) {
            var result = false;
            if (date instanceof Date && targetDate instanceof Date) {
                result = (date.getTime() == targetDate.getTime());
            }

            return result;
        },

        equalDay(date, targetDate) {
            var result = false;
            if (date instanceof Date && targetDate instanceof Date) {
                result = date.toDateString() == targetDate.toDateString();
            }

            return result;
        },

        isToday(date) {
            var result = false;
            if (date instanceof Date) {
                result = $date.equalDay(date, new Date());
            }
            return result;
        },

        toString(date, format) {
            var result = '';
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate().toString().length == 1 ? '0' + date.getDate().toString() : date.getDate().toString();
            var hours = date.getHours().toString().length == 1 ? '0' + date.getHours().toString() : date.getHours().toString();
            var minutes = date.getMinutes().toString().length == 1 ? '0' + date.getMinutes().toString() : date.getMinutes().toString();
            var seconds = date.getSeconds().toString().length == 1 ? '0' + date.getSeconds().toString() : date.getSeconds().toString();
            var milliseconds = date.getMilliseconds().toString().padStart(3, '0');
            var weekNames = ['일', '월', '화', '수', '목', '금', '토'];

            month = month.toString().length == 1 ? '0' + month.toString() : month.toString();

            switch (format) {
                case 'd':
                    result = year.toString().concat('-', month, '-', day);
                    break;
                case 't':
                    result = hours.toString().concat(':', minutes, ':', seconds);
                    break;
                case 'a':
                    result = year.toString().concat('-', month, '-', day, ' ', hours, ':', minutes, ':', seconds);
                    break;
                case 'f':
                    result = year.toString().concat(month, day, hours, minutes, seconds, milliseconds);
                    break;
                case 's':
                    result = hours.toString().concat(minutes, seconds, milliseconds);
                    break;
                case 'n':
                    var dayOfWeek = weekNames[date.getDay()];
                    result = year.toString().concat('년 ', month, '월 ', day, '일 ', '(', dayOfWeek, ')');
                    break;
                case 'mdn':
                    var dayOfWeek = weekNames[date.getDay()];
                    result = month.toString().concat('월 ', day, '일');
                    break;
                case 'w':
                    var weekNumber = 1;
                    var weekOfMonths = $date.weekOfMonth(year, month);
                    var currentDate = Number($date.toString(date, 'd').replace(/-/g, ''));
                    for (var i = 0; i < weekOfMonths.length; i++) {
                        var weekOfMonth = weekOfMonths[i];
                        var startDate = Number(weekOfMonth.weekStartDate.replace(/-/g, ''));
                        var endDate = Number(weekOfMonth.weekEndDate.replace(/-/g, ''));

                        if (currentDate >= startDate && currentDate <= endDate) {
                            weekNumber = (i + 1);
                            break;
                        }
                    }

                    result = weekNumber;
                    break;
                case 'wn':
                    result = weekNames[date.getDay()];
                    break;
                case 'm':
                    result = month;
                    break;
                case 'y':
                    result = year.toString();
                    break;
                case 'ym':
                    result = year.toString().concat('-', month);
                    break;
                default:
                    result = date.getDate().toString().padStart(2, '0');
            }

            return result;
        },

        addSecond(date, val) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.getTime() + (val * $date.interval.second));
            }
            return result;
        },

        addMinute(date, val) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.getTime() + (val * $date.interval.minute));
            }
            return result;
        },

        addHour(date, val) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.getTime() + (val * $date.interval.hour));
            }
            return result;
        },

        addDay(date, val) {
            var result = null;
            if (date instanceof Date) {
                var cloneDate = new Date(date.getTime());
                result = new Date(cloneDate.setDate(date.getDate() + val));
            }
            return result;
        },

        addWeek(date, val) {
            var result = null;
            if (date instanceof Date) {
                var cloneDate = new Date(date.getTime());
                result = new Date(cloneDate.setDate(date.getDate() + (val * 7)));
            }
            return result;
        },

        addMonth(date, val) {
            var result = null;
            if (date instanceof Date) {
                var cloneDate = new Date(date.getTime());
                result = new Date(cloneDate.setMonth(date.getMonth() + val));
            }
            return result;
        },

        addYear(date, val) {
            var result = null;
            if (date instanceof Date) {
                var cloneDate = new Date(date.getTime());
                result = new Date(cloneDate.setFullYear(date.getFullYear() + val));
            }
            return result;
        },

        getFirstDate(date) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.setDate(1));
            }
            return result;
        },

        getLastDate(date) {
            var result = null;
            if (date instanceof Date) {
                date = $date.addMonth(date, 1);
                return $date.addDay(new Date(date.setDate(1)), -1);
            }
            return result;
        },

        diff(start, end, interval) {
            var result = 0;
            if (start instanceof Date && end instanceof Date) {
                interval = interval || 'day';

                if (interval == 'month') {
                    result = end.getMonth() - start.getMonth() + 12 * (end.getFullYear() - start.getFullYear());
                }
                else if ($object.isNullOrUndefined($date.interval[interval]) == false) {
                    var diff = Math.abs(end - start)
                    result = Math.floor(diff / $date.interval[interval]);
                }
            }

            return result;
        },

        toTicks(date) {
            return ((date.getTime() * 10000) + 621355968000000000);
        },

        isDate(val) {
            var result = false;
            var scratch = null;
            if ($object.isString(val) == true) {
                scratch = new Date(val);
                if (scratch.toString() == 'NaN' || scratch.toString() == 'Invalid Date') {
                    if (syn.$b.isSafari == true && syn.$b.isChrome == false) {
                        var parts = val.match(/(\d+)/g);
                        scratch = new Date(parts[0], parts[1] - 1, parts[2]);
                        if (scratch.toString() == 'NaN' || scratch.toString() == 'Invalid Date') {
                            result = false;
                        }
                        else {
                            result = true;
                        }
                    }
                    else {
                        result = false;
                    }
                }
                else {
                    result = true;
                }
            }

            return result;
        },

        isISOString(val) {
            var result = false;
            if ($date.isDate(val) == true) {
                var date = new Date(val);
                result = date.toISOString() === val;
            }

            return result;
        },

        weekOfMonth(year, month, weekStand) {
            var result = [];
            month = month || new Date().getMonth() + 1;
            weekStand = weekStand || 8;
            var date = new Date(year, month);

            var firstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
            var week = null;

            var firstWeekEndDate = true;
            var thisMonthFirstWeek = firstDay.getDay();
            var numberPad = function (num, width) {
                num = String(num);
                return num.length >= width ? num : new Array(width - num.length + 1).join('0') + num;
            }

            for (var num = 1; num <= 6; num++) {
                if (lastDay.getMonth() != firstDay.getMonth()) {
                    break;
                }

                week = {};
                if (firstDay.getDay() <= 1) {
                    if (firstDay.getDay() == 0) {
                        firstDay.setDate(firstDay.getDate() + 1);
                    }

                    week.weekStartDate = firstDay.getFullYear().toString() + '-' + numberPad((firstDay.getMonth() + 1).toString(), 2) + '-' + numberPad(firstDay.getDate().toString(), 2);
                }

                if (weekStand > thisMonthFirstWeek) {
                    if (firstWeekEndDate) {
                        if (weekStand - firstDay.getDay() == 1) {
                            firstDay.setDate(firstDay.getDate() + (weekStand - firstDay.getDay()) - 1);
                        }

                        if (weekStand - firstDay.getDay() > 1) {
                            firstDay.setDate(firstDay.getDate() + (weekStand - firstDay.getDay()) - 1);
                        }

                        firstWeekEndDate = false;
                    } else {
                        firstDay.setDate(firstDay.getDate() + 6);
                    }
                } else {
                    firstDay.setDate(firstDay.getDate() + (6 - firstDay.getDay()) + weekStand);
                }

                if (typeof week.weekStartDate !== 'undefined') {
                    week.weekEndDate = firstDay.getFullYear().toString() + '-' + numberPad((firstDay.getMonth() + 1).toString(), 2) + '-' + numberPad(firstDay.getDate().toString(), 2);
                    result.push(week);
                }

                firstDay.setDate(firstDay.getDate() + 1);
            }

            return result;
        }
    });
    context.$date = $date;

    $string.extend({
        version: '1.0.0',

        toValue(value, defaultValue) {
            var result = '';
            if ($object.isNullOrUndefined(value) == true) {
                if ($string.isNullOrEmpty(defaultValue) == false) {
                    result = defaultValue.toString();
                }
            }
            else {
                result = value.toString();
            }

            return result;
        },

        br(val) {
            return val.replace(/(\r\n|\r|\n)/g, '<br />');
        },

        interpolate(text, json, options = null) {
            var result = null;

            if (json != null) {
                options = syn.$w.argumentsExtend({
                    defaultValue: null,
                    separator: '\n',
                }, options);

                var replaceFunc = function (text, item) {
                    return text.replace(/\#{([^{}]*)}/g,
                        function (pattern, key) {
                            var value = item[key];
                            var result = pattern;
                            if (typeof value === 'string' || typeof value === 'number') {
                                result = value;
                            }
                            else if ($object.isNullOrUndefined(value) == false) {
                                if ($object.isArray(value) == true) {
                                    result = value.join(', ');
                                }
                                else if ($object.isDate(value) == true) {
                                    result = $date.toString(value, 'a');
                                }
                                else if ($object.isBoolean(value) == true) {
                                    result = value.toString();
                                }
                            }
                            else {
                                result = options.defaultValue == null ? pattern : options.defaultValue;
                            }
                            return result;
                        }
                    )
                };

                if ($object.isArray(json) == false) {
                    result = replaceFunc(text, json);
                }
                else {
                    var values = [];
                    for (var key in json) {
                        var item = json[key];
                        values.push(replaceFunc(text, item));
                    }

                    result = values.join(options.separator);
                }
            }

            return result;
        },

        isNullOrEmpty(val) {
            if (val === undefined || val === null || val === '') {
                return true;
            }
            else {
                return false;
            }
        },

        sanitizeHTML(val, hasSpecialChar) {
            var result = '';
            hasSpecialChar = hasSpecialChar || true;

            if (hasSpecialChar == true) {
                result = val.replace(/<.[^<>]*?>/g, '')
                    .replace(/&nbsp;|&#160;/gi, ' ');
            }
            else {
                result = val.replace(/<.[^<>]*?>/g, '')
                    .replace(/&nbsp;|&#160;/gi, ' ')
                    .replace(/[.(),;:!?%#$'\"_+=\/\-“”’]*/g, '');
            }

            return result.trim();
        },

        cleanHTML(val) {
            var el = document.createElement('div');
            el.innerHTML = val.replace(/\<br\s*\/\>/gim, '\n');
            return el.innerText.trim();
        },

        // 참조(http://www.ascii.cl/htmlcodes.htm)
        toHtmlChar(val) {
            return val.replace(/&/g, '&amp;').replace(/\'/g, '&quot;').replace(/\'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        toCharHtml(val) {
            return val.replace(/&amp;/g, '&').replace(/&quot;/g, '\'').replace(/&#39;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        },

        length(val) {
            var result = 0;
            for (var i = 0, len = val.length; i < len; i++) {
                if (val.charCodeAt(i) > 127) {
                    result += 2;
                }
                else {
                    result++;
                }
            }

            return result;
        },

        split(val, char) {
            return val.split(char).filter(p => p);
        },

        isNumber(num) {
            num = String(num).replace(/^\s+|\s+$/g, '');
            var regex = /^[\-]?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+){1}(\.[0-9]+)?$/g;

            if (regex.test(num)) {
                num = num.replace(/,/g, '');
                return isNaN(num) ? false : true;
            } else {
                return false;
            }
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
            return val.replace(/\b([a-z])/g, function (val) {
                return val.toUpperCase()
            });
        },

        toJson(val, option) {
            option = option || {};
            var delimeter = option.delimeter || ',';
            var newline = option.newline || '\n';
            var meta = option.meta || {};
            var i, row, lines = val.split(RegExp('{0}'.format(newline), 'g'));
            var headers = lines[0].split(delimeter);
            for (i = 0; i < headers.length; i++) {
                headers[i] = headers[i].replace(/(^[\s"]+|[\s"]+$)/g, '');
            }
            var result = [];
            var lineLength = lines.length;
            var headerLength = headers.length;
            if ($object.isEmpty(meta) == true) {
                for (i = 1; i < lineLength; i++) {
                    row = lines[i].split(delimeter);
                    var item = {};
                    for (var j = 0; j < headerLength; j++) {
                        item[headers[j]] = $string.toDynamic(row[j]);
                    }
                    result.push(item);
                }
            }
            else {
                for (i = 1; i < lineLength; i++) {
                    row = lines[i].split(delimeter);
                    var item = {};
                    for (var j = 0; j < headerLength; j++) {
                        var columnName = headers[j];
                        item[columnName] = $string.toParseType(row[j], meta[columnName]);
                    }
                    result.push(item);
                }
            }
            return result;
        },

        toParameterObject(parameters) {
            return (parameters.match(/([^?:;]+)(:([^;]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf(':')).replace('@', '')] = v.slice(v.indexOf(':') + 1), a;
            }, {});
        },

        toBoolean(val) {
            return (val === 'true' || val === 'True' || val === 'TRUE' || val === 'Y' || val == '1');
        },

        toDynamic(val, emptyIsNull) {
            var result;
            emptyIsNull = $string.toBoolean(emptyIsNull);

            if (emptyIsNull == true && val === '') {
                result = null;
            }
            else {
                if (val === 'true' || val === 'True' || val === 'TRUE') {
                    result = true;
                }
                else if (val === 'false' || val === 'False' || val === 'FALSE') {
                    result = false;
                }
                else if ($validation.regexs.float.test(val)) {
                    result = $string.toNumber(val);
                }
                else if ($validation.regexs.isoDate.test(val)) {
                    result = new Date(val);
                }
                else {
                    result = val;
                }
            }

            return result;
        },

        toParseType(val, metaType, emptyIsNull) {
            var result;
            metaType = metaType || 'string';
            emptyIsNull = $string.toBoolean(emptyIsNull);

            if (emptyIsNull == true && val === '') {
                result = null;
            }
            else {
                switch (metaType) {
                    case 'string':
                        result = val;
                        break;
                    case 'bool':
                        result = $string.toBoolean(val);
                        break;
                    case 'number':
                    case 'int':
                        result = $object.isNullOrUndefined(val) == true ? null : $string.isNumber(val) == true ? $string.toNumber(val) : null;
                        break;
                    case 'date':
                        if ($validation.regexs.isoDate.test(val)) {
                            result = new Date(val);
                        }
                        break;
                    default:
                        result = val;
                        break;
                }
            }

            return result;
        },

        toNumberString(val) {
            return val.trim().replace(/[^0-9\-\.]/g, '');
        },

        toCurrency(val, localeID, options) {
            var result = null;
            if ($string.isNumber(val) == false) {
                return result;
            }

            if ($object.isNullOrUndefined(localeID) == true) {
                var x = val.toString().split('.');
                var x1 = x[0];

                var x2 = x.length > 1 ? '.' + x[1] : '';
                var expr = /(\d+)(\d{3})/;

                while (expr.test(x1)) {
                    x1 = x1.replace(expr, '$1' + ',' + '$2');
                }

                result = x1 + x2;
            }
            else {
                // https://ko.wikipedia.org/wiki/ISO_4217
                var formatOptions = syn.$w.argumentsExtend({
                    style: 'currency',
                    currency: 'KRW'
                }, options);

                result = Intl.NumberFormat(localeID, formatOptions).format(val);
            }

            return result;
        }
    });
    context.$string = $string;

    $array.extend({
        version: '1.0.0',

        distinct(arr) {
            var derived = [];
            for (var i = 0, len = arr.length; i < len; i++) {
                if ($array.contains(derived, arr[i]) == false) {
                    derived.push(arr[i])
                }
            }

            return derived;
        },

        sort(arr, order) {
            var temp = null;
            order = order || true;
            if (order == true) {
                for (var i = 0, ilen = arr.length; i < ilen; i++) {
                    for (var j = 0, jlen = arr.length; j < jlen; j++) {
                        if (arr[i] < arr[j]) {
                            temp = arr[i];
                            arr[i] = arr[j];
                            arr[j] = temp;
                        }
                    }
                }
            }
            else {
                for (var i = 0, ilen = arr.length; i < ilen; i++) {
                    for (var j = 0, jlen = arr.length; j < jlen; j++) {
                        if (arr[i] > arr[j]) {
                            temp = arr[i];
                            arr[i] = arr[j];
                            arr[j] = temp;
                        }
                    }
                }
            }
            return arr;
        },

        objectSort(arr, prop, order) {
            order = order || true;
            if (order == true) {
                arr.sort(
                    function (v1, v2) {
                        var prop1 = v1[prop];
                        var prop2 = v2[prop];

                        if (prop1 < prop2) {
                            return -1;
                        }

                        if (prop1 > prop2) {
                            return 1;
                        }

                        return 0;
                    }
                );
            }
            else {
                arr.sort(
                    function (v1, v2) {
                        var prop1 = v1[prop];
                        var prop2 = v2[prop];

                        if (prop1 < prop2) {
                            return 1;
                        }

                        if (prop1 > prop2) {
                            return -1;
                        }

                        return 0;
                    }
                );
            }
            return arr;
        },

        groupBy(data, predicate) {
            return data.reduce((result, value) => {
                var group = value[predicate];

                if ('function' === typeof predicate) {
                    group = predicate(value);
                }

                if (result[group] === undefined) {
                    result[group] = [];
                }

                result[group].push(value);
                return result;
            }, {});
        },

        shuffle(arr) {
            var i = arr.length, j;
            var temp = null;
            while (i--) {
                j = Math.floor((i + 1) * Math.random());
                temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
            return arr;
        },

        addAt(arr, index, val) {
            if (index <= arr.length - 1) {
                arr.splice(index, 0, val);
            }
            return arr;
        },

        removeAt(arr, index) {
            if (index <= (arr.length - 1)) {
                arr.splice(index, 1);
            }
            return arr;
        },

        contains(arr, val) {
            for (var i = 0, len = arr.length; i < len; i++) {
                if (arr[i] === val) {
                    return true;
                }
            }

            return false;
        },

        merge(arr, brr, predicate = (arr, brr) => arr === brr) {
            const crr = [...arr];
            brr.forEach((bItem) => (crr.some((cItem) => predicate(bItem, cItem)) ? null : crr.push(bItem)));
            return crr;
        },

        union(sourceArray, targetArray) {
            var result = [];
            var temp = {}
            for (var i = 0; i < sourceArray.length; i++) {
                temp[sourceArray[i]] = 1;
            }

            for (var i = 0; i < targetArray.length; i++) {
                temp[targetArray[i]] = 1;
            }

            for (var k in temp) {
                result.push(k)
            };
            return result;
        },

        difference(sourceArray, targetArray) {
            return sourceArray.filter(function (x) {
                return !targetArray.includes(x);
            });
        },

        intersect(sourceArray, targetArray) {
            return sourceArray.filter(function (x) {
                return targetArray.includes(x);
            });
        },

        symmetryDifference(sourceArray, targetArray) {
            return sourceArray.filter(function (x) {
                return !targetArray.includes(x);
            }).concat(targetArray.filter(function (x) {
                return !sourceArray.includes(x);
            }));
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
                else {
                    if (defaultValue === undefined) {
                        result = '';
                    }
                    else {
                        result = defaultValue;
                    }
                }
            }

            return result;
        },

        ranks(value, asc) {
            var result = [];
            if ($object.isNullOrUndefined(value) == false && $object.isArray(value) == true) {
                if ($object.isNullOrUndefined(asc) == true) {
                    asc = false;
                }
                else {
                    asc = $string.toBoolean(asc);
                }

                if (asc == true) {
                    for (var i = 0; i < value.length; i++) {
                        value[i] = - + value[i];
                    }
                }

                var sorted = value.slice().sort(function (a, b) {
                    return b - a;
                });
                result = value.map(function (v) {
                    return sorted.indexOf(v) + 1;
                });
            }

            return result;
        }
    });
    context.$array = $array;

    $number.extend({
        version: '1.0.0',

        duration(ms) {
            if (ms < 0) ms = -ms;
            var time = {
                year: 0,
                week: 0,
                day: Math.floor(ms / 86400000),
                hour: Math.floor(ms / 3600000) % 24,
                minute: Math.floor(ms / 60000) % 60,
                second: Math.floor(ms / 1000) % 60,
                millisecond: Math.floor(ms) % 1000
            };

            if (time.day > 365) {
                time.year = time.day % 365;
                time.day = Math.floor(time.day / 365);
            }

            if (time.day > 7) {
                time.week = time.day % 7;
                time.day = Math.floor(time.day / 7);
            }

            return time;
        },

        toByteString(num, precision, addSpace) {
            if (precision === void 0) {
                precision = 3;
            }

            if (addSpace === void 0) {
                addSpace = true;
            }

            var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            if (Math.abs(num) < 1) return num + (addSpace ? ' ' : '') + units[0];
            var exponent = Math.min(Math.floor(Math.log10(num < 0 ? -num : num) / 3), units.length - 1);
            var n = Number(((num < 0 ? -num : num) / Math.pow(1024, exponent)).toPrecision(precision));
            return (num < 0 ? '-' : '') + n + (addSpace ? ' ' : '') + units[exponent];
        },

        random(start, end) {
            if ($string.isNullOrEmpty(start) == true) {
                start = 0;
            }

            if ($string.isNullOrEmpty(end) == true) {
                end = 10;
            }

            return Math.floor((Math.random() * (end - start + 1)) + start);
        },

        isRange(num, low, high) {
            return num >= low && num <= high;
        },

        limit(num, low, high) {
            return num < low ? low : (num > high ? high : num);
        },

        percent(num, total, precision) {
            var precision = precision || 0;
            var result = Math.pow(10, precision);

            return Math.round((num * 100 / total) * result) / result;
        }
    });
    context.$number = $number;

    $object.extend({
        version: '1.0.0',

        isNullOrUndefined(val) {
            if (val === undefined || val === null) {
                return true;
            }
            else {
                return false;
            }
        },

        toCSV(obj, option) {
            if (typeof obj !== 'object') return null;
            option = option || {};
            var scopechar = option.scopechar || '/';
            var delimeter = option.delimeter || ',';
            var newline = option.newline || '\n';
            if (Array.isArray(obj) === false) obj = [obj];
            var curs, name, i, key, queue, values = [], rows = [], headers = {}, headersArr = [];
            for (i = 0; i < obj.length; i++) {
                queue = [obj[i], ''];
                rows[i] = {};
                while (queue.length > 0) {
                    name = queue.pop();
                    curs = queue.pop();
                    if (curs !== null && typeof curs === 'object') {
                        for (key in curs) {
                            if (curs.hasOwnProperty(key)) {
                                queue.push(curs[key]);
                                queue.push(name + (name ? scopechar : '') + key);
                            }
                        }
                    } else {
                        if (headers[name] === undefined) headers[name] = true;
                        rows[i][name] = curs;
                    }
                }
                values[i] = [];
            }

            for (key in headers) {
                if (headers.hasOwnProperty(key)) {
                    headersArr.push(key);
                    for (i = 0; i < obj.length; i++) {
                        values[i].push(rows[i][key] === undefined
                            ? ''
                            : rows[i][key]);
                    }
                }
            }
            for (i = 0; i < obj.length; i++) {
                values[i] = values[i].join(delimeter);
            }
            return headersArr.join(delimeter) + newline + values.join(newline);
        },

        toParameterString(jsonObject) {
            return jsonObject ? Object.entries(jsonObject).reduce(function (queryString, ref, index) {
                var key = ref[0];
                var val = ref[1];
                queryString += `@${key}:${$string.toValue($string.toDynamic(val), '')};`;
                return queryString;
            }, '') : '';
        },

        getType(val) {
            var result = typeof val;
            if (result == 'object') {
                if (val) {
                    if (val instanceof Array || (!(val instanceof Object) && (Object.prototype.toString.call((val)) == '[object Array]') || typeof val.length == 'number' && typeof val.splice != 'undefined' && typeof val.propertyIsEnumerable != 'undefined' && !val.propertyIsEnumerable('splice'))) {
                        return 'array';
                    }

                    if (!(val instanceof Object) && (Object.prototype.toString.call((val)) == '[object Function]' || typeof val.call != 'undefined' && typeof val.propertyIsEnumerable != 'undefined' && !val.propertyIsEnumerable('call'))) {
                        return 'function';
                    }

                    if (val instanceof Date) {
                        return 'date';
                    }

                    if (val instanceof HTMLElement) {
                        return 'element';
                    }
                }
                else {
                    return 'null';
                }
            }
            else if (result == 'function' && typeof val.call == 'undefined') {
                return 'object';
            }

            return result;
        },

        defaultValue(type) {
            if (typeof type !== 'string') {
                return '';
            }

            switch (type) {
                case 'bool':
                case 'boolean':
                    return false;
                case 'function': return function () { };
                case 'null': return null;
                case 'int':
                case 'number':
                    return 0;
                case 'object': return {};
                case 'date': return new Date();
                case 'string': return '';
                case 'symbol': return Symbol();
                case 'undefined': return void 0;
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
            return this.getType(val) == 'array';
        },

        isDate(val) {
            var result = false;
            try {
                if (Object.prototype.toString.call(val) === '[object Date]') {
                    result = true;
                }
                else if (typeof val == 'string') {
                    if (val.includes('T') == true) {
                        var date = val.parseISOString();
                        result = typeof date.getFullYear == 'function';
                    }
                    else if ($date.isDate(val) == true) {
                        result = true;
                    }
                }
            } catch (e) {
            }

            return result;
        },

        isString(val) {
            return typeof val == 'string';
        },

        isNumber(val) {
            return typeof val == 'number';
        },

        isFunction(val) {
            return this.getType(val) == 'function';
        },

        isObject(val) {
            return typeof val == 'object';
        },

        isObjectEmpty(val) {
            if (typeof val == 'object') {
                for (var key in val) {
                    if (val.hasOwnProperty(key) == true) {
                        return false;
                    }
                }
            }
            return true;
        },

        isBoolean(val) {
            if ($object.isNullOrUndefined(val) == true) {
                return false;
            }

            if (typeof val == 'boolean') {
                return true;
            }
            else if (typeof val == 'string' || typeof val == 'number') {
                val = val.toString();
                return (val.toUpperCase() === 'TRUE' ||
                    val.toUpperCase() === 'FALSE' ||
                    val === 'Y' ||
                    val === 'N' ||
                    val == '1' ||
                    val == '0');
            }

            return false;
        },

        isEmpty(val) {
            var result = false;
            if (typeof val == 'number' || typeof val == 'boolean' || typeof val == 'function' || (typeof val === 'object' && val instanceof Date)) {
                result = false;
            }
            else {
                result = (val == null || !(Object.keys(val) || val).length);
            }
            return result;
        },

        clone(val, isNested) {
            var result = null;

            if ($object.isNullOrUndefined(isNested) == true) {
                isNested = true;
            }

            if ($object.isArray(val) == true) {
                result = JSON.parse(JSON.stringify(val));
            }
            else if ($object.isObject(val) == true) {
                if (val) {
                    var types = [Number, String, Boolean], result;
                    types.forEach(function (type) {
                        if (val instanceof type) {
                            result = type(val);
                        }
                    });

                    if (isNested == true && Object.prototype.toString.call(val) === '[object Array]') {
                        result = [];
                        val.forEach(function (child, index, array) {
                            result[index] = $object.clone(child);
                        });
                    }
                    else if (typeof val == 'object') {
                        if (val.nodeType && typeof val.cloneNode == 'function') {
                            result = val.cloneNode(true);
                        }
                        else if (!val.prototype) {
                            result = {};
                            for (var i in val) {
                                result[i] = $object.clone(val[i]);
                            }
                        }
                        else {
                            if (val.constructor) {
                                result = new val.constructor();
                            }
                            else {
                                result = val;
                            }
                        }
                    }
                    else {
                        result = val;
                    }
                }
                else {
                    result = val;
                }
            }
            else if ($object.isFunction(val) == true) {
                result = val.clone();
            }
            else {
                result = val;
            }

            return result;
        },

        extend(to, from, overwrite) {
            var prop, hasProp;
            for (prop in from) {
                hasProp = to[prop] !== undefined;
                if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
                    if ($object.isDate(from[prop])) {
                        if (overwrite) {
                            to[prop] = new Date(from[prop].getTime());
                        }
                    }
                    else if ($object.isArray(from[prop])) {
                        if (overwrite) {
                            to[prop] = from[prop].slice(0);
                        }
                    } else {
                        to[prop] = $object.extend({}, from[prop], overwrite);
                    }
                } else if (overwrite || !hasProp) {
                    to[prop] = from[prop];
                }
            }
            return to;
        }
    });
    context.$object = $object;
})(globalRoot);
