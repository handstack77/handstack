/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $datepicker = syn.uicontrols.$datepicker || new syn.module();

    $datepicker.extend({
        name: 'syn.uicontrols.$datepicker',
        version: 'v2026.10.1',
        dateControls: [],
        dateTimeFormat: 'YYYY-MM-DD HH:mm',
        dateTimeParseFormats: ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm', 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD', 'YYYYMMDDHHmm', 'YYYYMMDD'],
        defaultSetting: {
            elID: '',
            width: '100%',
            value: '',
            placeholder: '',
            defaultDate: null,
            setDefaultDate: false,
            minDate: null,
            maxDate: null,
            bound: true,
            format: 'YYYY-MM-DD',
            useTime: false,
            minuteStep: 1,
            ariaLabel: '날짜를 선택 하세요',
            i18n: {
                previousMonth: '이전 달',
                nextMonth: '다음 달',
                months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                weekdays: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
                weekdaysShort: ['일', '월', '화', '수', '목', '금', '토']
            },
            showWeekNumber: false,
            showMonthAfterYear: true,
            showDaysInNextAndPreviousMonths: true,
            enableSelectionDaysInNextAndPreviousMonths: true,
            yearSuffix: '년',
            firstDay: 0,
            useRangeSelect: false,
            rangeStartControlID: null,
            rangeEndControlID: null,
            numberOfMonths: 1,
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
            setting = syn.$w.argumentsExtend($datepicker.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            if (setting.useRangeSelect === true) {
                if ($object.isNullOrUndefined(setting.rangeStartControlID) == true) {
                    setting.rangeStartControlID = elID;
                }

                if ($object.isNullOrUndefined(setting.rangeEndControlID) == true) {
                    setting.rangeEndControlID = elID;
                }
            }

            var className = el.getAttribute('class');
            var dataField = el.getAttribute('syn-datafield');
            var events = el.getAttribute('syn-events');

            var textbox = syn.$m.create({
                id: elID,
                tag: 'input',
                className: $string.isNullOrEmpty(className) == true ? 'form-control' : className
            });
            textbox.type = 'text';

            if ($string.isNullOrEmpty(setting.placeholder) == false) {
                textbox.setAttribute('placeholder', setting.placeholder);
            }

            if ($string.isNullOrEmpty(dataField) == false) {
                textbox.setAttribute('syn-datafield', dataField);
            }

            setting.elID = elID;
            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.removeAttribute('syn-datafield');
            el.style.display = 'none';

            var editOptions = setting.useTime === true ? `editType: 'text', maskPattern: '9999-99-99 99:99'` : `editType: 'date', maskPattern: '9999-99-99'`;
            if ($string.isNullOrEmpty(setting.belongID) == true) {
                textbox.setAttribute('syn-options', `{${editOptions}, dataType: 'string'}`);
            }
            else {
                if ($object.isArray(setting.belongID) == true) {
                    textbox.setAttribute('syn-options', `{${editOptions}, dataType: 'string', belongID: ${JSON.stringify(setting.belongID)}}`);
                }
                else {
                    textbox.setAttribute('syn-options', `{${editOptions}, dataType: 'string', belongID: '${setting.belongID}'}`);
                }
            }

            if ($object.isNullOrUndefined(events) == false) {
                textbox.setAttribute('syn-events', events);
            }

            syn.$m.insertBefore(textbox, el);

            var button = syn.$m.create({
                id: `${elID}_Button`,
                tag: 'button',
                className: 'btn btn-icon f:20! bg-muted-lt'
            });
            button.innerHTML = `<i class="ti ti-calendar"></i>`;
            syn.$m.insertAfter(button, el);

            syn.uicontrols.$textbox.controlLoad(elID, eval('(' + syn.$l.get(elID).getAttribute('syn-options') + ')'));

            setting.field = syn.$l.get(elID);

            if (setting.useTime === true) {
                syn.$l.addEvent(setting.field, 'blur', function (evt) {
                    var textbox = evt.currentTarget;
                    var value = textbox.value.trim();
                    if (value.length > 0) {
                        textbox.setAttribute('placeholder', '');
                        if (moment(value, $datepicker.dateTimeFormat, true).isValid() == false) {
                            textbox.setAttribute('placeholder', '일시 확인 필요');
                            textbox.value = '';
                        }
                    }
                });
            }

            setting = syn.$w.argumentsExtend({
                onOpen() {
                    var elID = this._o.elID;
                    var date = this.getDate();
                    $datepicker.updateRangeDate(elID, date);

                    var mod = window[syn.$w.pageScript];
                    var selectFunction = '{0}_onselect'.format(elID);
                    if (mod && mod.event[selectFunction]) {
                        mod.event[selectFunction](elID, $datepicker.withTime(this, date));
                    }
                },
                onClose() {
                    var elID = this._o.elID;
                    var date = this.getDate();
                    $datepicker.updateRangeDate(elID, date);

                    var mod = window[syn.$w.pageScript];
                    var selectFunction = '{0}_onselect'.format(elID);
                    if (mod && mod.event[selectFunction]) {
                        mod.event[selectFunction](elID, $datepicker.withTime(this, date));
                    }

                    const el = syn.$l.get(elID);
                    var control = $datepicker.getControl(elID);
                    if (el && $string.isNullOrEmpty(el.placeholder) == true && control && $string.isNullOrEmpty(control.setting.placeholder) == false) {
                        el.placeholder = control.setting.placeholder;
                    }
                },
                onSelect(date) {
                    if (!date) {
                        return;
                    }

                    var elID = this._o.elID;
                    $datepicker.updateRangeDate(elID, date);

                    var mod = window[syn.$w.pageScript];
                    var selectFunction = '{0}_onselect'.format(elID);
                    if (mod && mod.event[selectFunction]) {
                        mod.event[selectFunction](elID, $datepicker.withTime(this, date));
                    }
                }
            }, setting);

            if (setting.useTime === true) {
                setting.format = $datepicker.dateTimeFormat;
                setting.timeHour = 0;
                setting.timeMinute = 0;
                setting.toString = function (date, format) {
                    return moment(date).hour(this.timeHour || 0).minute(this.timeMinute || 0).format(format);
                };
                setting.parse = function (value, format) {
                    var parsed = moment(value, $datepicker.dateTimeParseFormats, true);
                    if (parsed.isValid() == false) {
                        return null;
                    }

                    this.timeHour = parsed.hour();
                    this.timeMinute = parsed.minute();
                    return parsed.toDate();
                };
                setting.onDraw = function (picker) {
                    $datepicker.drawTime(picker);
                };
            }

            if (moment && moment.locale() != 'ko') {
                moment.locale('ko', {
                    months: '1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월'.split('_'),
                    monthsShort: '1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월'.split(
                        '_'
                    ),
                    weekdays: '일요일_월요일_화요일_수요일_목요일_금요일_토요일'.split('_'),
                    weekdaysShort: '일_월_화_수_목_금_토'.split('_'),
                    weekdaysMin: '일_월_화_수_목_금_토'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm',
                        LTS: 'A h:mm:ss',
                        L: 'YYYY.MM.DD.',
                        LL: 'YYYY년 MMMM D일',
                        LLL: 'YYYY년 MMMM D일 A h:mm',
                        LLLL: 'YYYY년 MMMM D일 dddd A h:mm',
                        l: 'YYYY.MM.DD.',
                        ll: 'YYYY년 MMMM D일',
                        lll: 'YYYY년 MMMM D일 A h:mm',
                        llll: 'YYYY년 MMMM D일 dddd A h:mm',
                    },
                    calendar: {
                        sameDay: '오늘 LT',
                        nextDay: '내일 LT',
                        nextWeek: 'dddd LT',
                        lastDay: '어제 LT',
                        lastWeek: '지난주 dddd LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s 후',
                        past: '%s 전',
                        s: '몇 초',
                        ss: '%d초',
                        m: '1분',
                        mm: '%d분',
                        h: '한 시간',
                        hh: '%d시간',
                        d: '하루',
                        dd: '%d일',
                        M: '한 달',
                        MM: '%d달',
                        y: '일 년',
                        yy: '%d년',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(일|월|주)/,
                    ordinal: function (number, period) {
                        switch (period) {
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return number + '일';
                            case 'M':
                                return number + '월';
                            case 'w':
                            case 'W':
                                return number + '주';
                            default:
                                return number;
                        }
                    },
                    meridiemParse: /오전|오후/,
                    isPM: function (token) {
                        return token === '오후';
                    },
                    meridiem: function (hour, minute, isUpper) {
                        return hour < 12 ? '오전' : '오후';
                    },
                });
            }

            var picker = new Pikaday(setting);

            if (setting.useTime === true && setting.bound === true) {
                var keepOpen = function (evt) {
                    var target = evt.target;
                    if (target && picker.el.contains(target) == true && syn.$m.hasClass(target, 'pika-button') == true) {
                        picker._o.bound = false;
                        setTimeout(function () {
                            picker._o.bound = true;
                        }, 0);
                    }
                };

                document.addEventListener('mousedown', keepOpen, true);
                document.addEventListener('touchend', keepOpen, true);
            }

            if ($string.isNullOrEmpty(setting.value) == false) {
                var value = setting.value;
                var date = null;
                if (value == 'now') {
                    date = new Date();
                }
                else if (value.startsWith('day:') == true) {
                    date = $date.addDay(new Date(), $string.toNumber(value.split(':')[1]));
                }
                else if (value.startsWith('week:') == true) {
                    date = $date.addWeek(new Date(), $string.toNumber(value.split(':')[1]));
                }
                else if (value.startsWith('month:') == true) {
                    date = $date.addMonth(new Date(), $string.toNumber(value.split(':')[1]));
                }
                else if (value.startsWith('year:') == true) {
                    date = $date.addYear(new Date(), $string.toNumber(value.split(':')[1]));
                }

                if (date) {
                    if (setting.useTime === true) {
                        picker._o.timeHour = date.getHours();
                        picker._o.timeMinute = date.getMinutes();
                    }

                    picker.setDate($date.toString(date, 'd'));
                }
            }

            syn.$l.addEvent(syn.$l.get(elID + '_Button'), 'click', function (e) {
                picker[picker.isVisible() ? 'hide' : 'show']();
            });

            $datepicker.dateControls.push({
                id: elID,
                picker: picker,
                setting: $object.clone(setting)
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                // syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue(elID, meta) {
            var result = null;
            var dateControl = $datepicker.getControl(elID);

            if (dateControl) {
                result = dateControl.picker._o.field.value;
            }

            return result;
        },

        setValue(elID, value, meta) {
            var dateControl = $datepicker.getControl(elID);
            if (dateControl) {
                var picker = dateControl.picker;
                if (picker._o.useTime === true && $string.isNullOrEmpty(value) == false) {
                    var parsed = $object.isDate(value) == true ? moment(value) : moment(value, $datepicker.dateTimeParseFormats, true);
                    if (parsed.isValid() == true) {
                        picker._o.timeHour = parsed.hour();
                        picker._o.timeMinute = parsed.minute();
                        picker.setDate(parsed.toDate());
                    }
                    return;
                }

                picker.setDate(value);
            }
        },

        clear(elID, isControlLoad) {
            var dateControl = $datepicker.getControl(elID);
            if (dateControl) {
                dateControl.picker._o.timeHour = 0;
                dateControl.picker._o.timeMinute = 0;
                dateControl.picker.clear();
            }
        },

        withTime(picker, date) {
            if ($object.isNullOrUndefined(date) == true || picker._o.useTime !== true) {
                return date;
            }

            var result = new Date(date.getTime());
            result.setHours(picker._o.timeHour || 0, picker._o.timeMinute || 0, 0, 0);
            return result;
        },

        drawTime(picker) {
            var options = picker._o;
            var step = Math.max(1, parseInt(options.minuteStep, 10) || 1);
            var hour = options.timeHour || 0;
            var minute = options.timeMinute || 0;

            var hourOptions = [];
            for (var i = 0; i < 24; i++) {
                hourOptions.push(`<option value="${i}"${i == hour ? ' selected="selected"' : ''}>${String(i).padStart(2, '0')}</option>`);
            }

            var minuteOptions = [];
            for (var i = 0; i < 60; i += step) {
                minuteOptions.push(i);
            }

            if (minuteOptions.includes(minute) == false) {
                minuteOptions.push(minute);
                minuteOptions.sort(function (a, b) { return a - b; });
            }

            var minuteHtml = minuteOptions.map(function (i) {
                return `<option value="${i}"${i == minute ? ' selected="selected"' : ''}>${String(i).padStart(2, '0')}</option>`;
            });

            var wrapper = document.createElement('div');
            wrapper.className = 'pika-time';
            wrapper.innerHTML = `<select class="pika-select pika-time-hour" tabindex="-1" aria-label="시">${hourOptions.join('')}</select><span class="pika-time-separator">:</span><select class="pika-select pika-time-minute" tabindex="-1" aria-label="분">${minuteHtml.join('')}</select><button type="button" class="btn w-100 btn-primary pika-time-confirm">확인</button>`;
            picker.el.appendChild(wrapper);

            var hourSelect = wrapper.querySelector('.pika-time-hour');
            var minuteSelect = wrapper.querySelector('.pika-time-minute');
            var changeTime = function () {
                $datepicker.changeTime(picker, parseInt(hourSelect.value, 10), parseInt(minuteSelect.value, 10));
            };

            hourSelect.addEventListener('change', changeTime);
            minuteSelect.addEventListener('change', changeTime);
            hourSelect.addEventListener('keydown', function (evt) { evt.stopPropagation(); });
            minuteSelect.addEventListener('keydown', function (evt) { evt.stopPropagation(); });
            wrapper.querySelector('.pika-time-confirm').addEventListener('click', function () {
                picker.hide();
            });
        },

        changeTime(picker, hour, minute) {
            picker._o.timeHour = hour;
            picker._o.timeMinute = minute;

            if (picker.getDate() == null) {
                picker.setDate(new Date());
                return;
            }

            var field = picker._o.field;
            field.value = picker.toString();

            var changeEvent = document.createEvent('HTMLEvents');
            changeEvent.initEvent('change', true, false);
            changeEvent.firedBy = picker;
            field.dispatchEvent(changeEvent);

            var elID = picker._o.elID;
            var mod = window[syn.$w.pageScript];
            var selectFunction = '{0}_onselect'.format(elID);
            if (mod && mod.event[selectFunction]) {
                mod.event[selectFunction](elID, $datepicker.withTime(picker, picker.getDate()));
            }
        },

        getControl(elID) {
            var result = null;
            var length = $datepicker.dateControls.length;
            for (var i = 0; i < length; i++) {
                var item = $datepicker.dateControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        updateRangeDate(elID, date) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $datepicker.getControl(elID);
                if (control) {
                    if (control.setting.useRangeSelect === true) {
                        if (control.setting.rangeStartControlID == elID) {
                            var startPicker = control.picker;
                            var endPicker = null;
                            var targetControl = $datepicker.getControl(control.setting.rangeEndControlID);
                            if (targetControl) {
                                endPicker = targetControl.picker;
                            }

                            if (startPicker && endPicker) {
                                $datepicker.updateStartDate(startPicker, endPicker, date);
                            }
                        }
                        else if (control.setting.rangeEndControlID == elID) {
                            var startPicker = null;
                            var endPicker = control.picker;
                            var targetControl = $datepicker.getControl(control.setting.rangeStartControlID);
                            if (targetControl) {
                                startPicker = targetControl.picker;
                            }

                            if (startPicker && endPicker) {
                                $datepicker.updateEndDate(startPicker, endPicker, date);
                            }
                        }
                    }
                }
            }
        },

        updateStartDate(startPicker, endPicker, startDate) {
            startPicker.setStartRange(startDate);
            endPicker.setStartRange(startDate);
            endPicker.setMinDate(startDate);
        },

        updateEndDate(startPicker, endPicker, endDate) {
            startPicker.setEndRange(endDate);
            startPicker.setMaxDate(endDate);
            endPicker.setEndRange(endDate);
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$datepicker = $datepicker;
})(window);
