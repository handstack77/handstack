/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $datepicker = syn.uicontrols.$datepicker || new syn.module();

    $datepicker.extend({
        name: 'syn.uicontrols.$datepicker',
        version: '1.0.0',
        dateControls: [],
        defaultSetting: {
            elID: '',
            width: '100%',
            value: '',
            defaultDate: null,
            setDefaultDate: false,
            minDate: null,
            maxDate: null,
            bound: true,
            format: 'YYYY-MM-DD',
            ariaLabel: '날짜를 선택하세요',
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

            setting.elID = elID;
            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var dataField = el.getAttribute('syn-datafield');
            var events = el.getAttribute('syn-events');

            var textbox = syn.$m.create({
                id: elID,
                tag: 'input',
                className: 'form-control'
            });
            textbox.type = 'text';
            if ($string.isNullOrEmpty(dataField) == false) {
                textbox.setAttribute('syn-datafield', dataField);
            }

            if ($string.isNullOrEmpty(setting.belongID) == true) {
                textbox.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string'}`);
            }
            else {
                if ($object.isArray(setting.belongID) == true) {
                    textbox.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string', belongID: ${JSON.stringify(setting.belongID)}}`);
                }
                else {
                    textbox.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string', belongID: '${setting.belongID}'}`);
                }
            }

            if ($object.isNullOrUndefined(events) == false) {
                textbox.setAttribute('syn-events', events);
            }

            syn.$m.insertAfter(textbox, el);

            var button = syn.$m.create({
                id: `${elID}_Button`,
                tag: 'button',
                className: 'btn btn-icon f:20! bg-muted-lt'
            });
            button.innerHTML = `<i class="ti ti-calendar"></i>`;
            syn.$m.insertAfter(button, textbox);

            syn.uicontrols.$textbox.controlLoad(elID, eval('(' + syn.$l.get(elID).getAttribute('syn-options') + ')'));

            setting.field = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend({
                onOpen() {
                    var elID = this._o.elID;
                    var date = this.getDate();
                    $datepicker.updateRangeDate(elID, date);

                    var mod = window[syn.$w.pageScript];
                    var selectFunction = '{0}_onselect'.format(elID);
                    if (mod && mod.event[selectFunction]) {
                        mod.event[selectFunction](elID, date);
                    }
                },
                onClose() {
                    var elID = this._o.elID;
                    var date = this.getDate();
                    $datepicker.updateRangeDate(elID, date);

                    var mod = window[syn.$w.pageScript];
                    var selectFunction = '{0}_onselect'.format(elID);
                    if (mod && mod.event[selectFunction]) {
                        mod.event[selectFunction](elID, date);
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
                        mod.event[selectFunction](elID, date);
                    }
                }
            }, setting);

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
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
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
                dateControl.picker.setDate(value);
            }
        },

        clear(elID, isControlLoad) {
            var dateControl = $datepicker.getControl(elID);
            if (dateControl) {
                dateControl.picker.clear();
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
