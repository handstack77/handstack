/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $dateperiodpicker = syn.uicontrols.$dateperiodpicker || new syn.module();

    $dateperiodpicker.extend({
        name: 'syn.uicontrols.$dateperiodpicker',
        version: 'v2025.5.22',
        dateControls: [],
        selectedYear: null,
        pkaStartDate: null,
        pkaEndDate: null,
        periodPickerHtml: '<div class=card-body><div class="row g-1"><div class="col pl-0"><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnThisYear>올해</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnUntilToday>오늘까지</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnToday>오늘</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnPreviousDay>전일</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnWeekly>주간</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnPreviousWeek>전주</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnThisMonth>당월</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnPreviousMonth>이전달</button></div></div><div class="row g-1 mt-1"><div class="col pl-0"><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnPreviousYear>전년도</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnTwoYearAgo>전전년도</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnQuarter1>1분기</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnQuarter2>2분기</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnQuarter3>3분기</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnQuarter4>4분기</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnFirstHalf>상반기</button></div><div class=col><button class="btn w-100 border-color:#ccc!"id=_DatePeriodPicker_btnSecondHalf>하반기</button></div></div><div class="row g-1 mt-1"><div class="col pl-0"><div class="w-100 btn-group"role=group><input id=_DatePeriodPicker_chkPeriodMonth1 type=checkbox class=btn-check value=01> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth1>1월</label> <input id=_DatePeriodPicker_chkPeriodMonth2 type=checkbox class=btn-check value=02> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth2>2월</label> <input id=_DatePeriodPicker_chkPeriodMonth3 type=checkbox class=btn-check value=03> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth3>3월</label> <input id=_DatePeriodPicker_chkPeriodMonth4 type=checkbox class=btn-check value=04> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth4>4월</label> <input id=_DatePeriodPicker_chkPeriodMonth5 type=checkbox class=btn-check value=05> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth5>5월</label> <input id=_DatePeriodPicker_chkPeriodMonth6 type=checkbox class=btn-check value=06> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth6>6월</label> <input id=_DatePeriodPicker_chkPeriodMonth7 type=checkbox class=btn-check value=07> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth7>7월</label> <input id=_DatePeriodPicker_chkPeriodMonth8 type=checkbox class=btn-check value=08> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth8>8월</label> <input id=_DatePeriodPicker_chkPeriodMonth9 type=checkbox class=btn-check value=09> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth9>9월</label> <input id=_DatePeriodPicker_chkPeriodMonth10 type=checkbox class=btn-check value=10> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth10>10월</label> <input id=_DatePeriodPicker_chkPeriodMonth11 type=checkbox class=btn-check value=11> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth11>11월</label> <input id=_DatePeriodPicker_chkPeriodMonth12 type=checkbox class=btn-check value=12> <label class="btn p-2"for=_DatePeriodPicker_chkPeriodMonth12>12월</label></div></div></div><div class="row mt-2"><div class="col pl-0"><div class=h:227 id=calStartDate></div><input id=_DatePeriodPicker_txtStartDate type=hidden></div><div class="col pl-0"><div class=h:227 id=calEndDate></div><input id=_DatePeriodPicker_txtEndDate type=hidden></div></div></div><div class="p-2 card-footer"><div class="row align-items-center"><div class=col>선택기간: <span id=spnPeriodDate>0일</span></div><div class=col-auto><div class="btn-list flex-nowrap"><button class="btn w-100"id=_DatePeriodPicker_btnReset>기간 선택 취소</button><button class="btn w-100 btn-primary"id=_DatePeriodPicker_btnConfirm>확인</button></div></div></div></div>',
        defaultSetting: {
            elID: '',
            width: '100%',
            value: '',
            defaultDate: null,
            setDefaultDate: false,
            minDate: null,
            maxDate: null,
            bound: false,
            format: 'YYYY-MM-DD',
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
            numberOfMonths: 1,
            startDataFieldID: '',
            endDataFieldID: '',
            startClassName: 'form-control',
            endClassName: 'form-control',
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
            setting = syn.$w.argumentsExtend($dateperiodpicker.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.elID = elID;
            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var events = el.getAttribute('syn-events');

            var textbox1ID = elID + '_StartedAt';
            var dataField1ID = setting.startDataFieldID || elID + '_StartedAt';

            var textbox1 = syn.$m.create({
                id: textbox1ID,
                tag: 'input',
                className: $string.isNullOrEmpty(setting.startClassName) == true ? 'form-control' : setting.startClassName
            });

            textbox1.type = 'text';
            textbox1.setAttribute('syn-datafield', dataField1ID);

            if ($string.isNullOrEmpty(setting.belongID) == true) {
                textbox1.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string'}`);
            }
            else {
                if ($object.isArray(setting.belongID) == true) {
                    textbox1.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string', belongID: ${JSON.stringify(setting.belongID)}}`);
                }
                else {
                    textbox1.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string', belongID: '${setting.belongID}'}`);
                }
            }

            if ($object.isNullOrUndefined(events) == false) {
                textbox1.setAttribute('syn-events', events);
            }

            syn.$m.insertAfter(textbox1, el);

            syn.$l.addEvent(textbox1, 'blur', (evt) => {
                var elID = evt.currentTarget.id.replace('_StartedAt', '');
                var textbox1ID = elID + '_StartedAt';
                var textbox2ID = elID + '_EndedAt';

                var textbox1Value = syn.$l.get(textbox1ID).value.trim();
                var textbox2Value = syn.$l.get(textbox2ID).value.trim();

                if (textbox1Value > textbox2Value) {
                    syn.$l.get(textbox1ID).value = textbox2Value || $date.toString(new Date(), 'd');
                }
            });

            var span = syn.$m.create({
                id: `${elID}_Span`,
                tag: 'span',
                className: 'input-group-text p-1 border-0 bg:#fff!'
            });
            span.innerHTML = `~`;
            syn.$m.insertAfter(span, textbox1);

            var textbox2ID = elID + '_EndedAt';
            var dataField1ID = setting.endDataFieldID || elID + '_EndedAt';

            var textbox2 = syn.$m.create({
                id: textbox2ID,
                tag: 'input',
                className: $string.isNullOrEmpty(setting.endClassName) == true ? 'form-control' : setting.endClassName
            });

            textbox2.type = 'text';
            textbox2.setAttribute('syn-datafield', dataField1ID);

            if ($string.isNullOrEmpty(setting.belongID) == true) {
                textbox2.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string'}`);
            }
            else {
                if ($object.isArray(setting.belongID) == true) {
                    textbox2.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string', belongID: ${JSON.stringify(setting.belongID)}}`);
                }
                else {
                    textbox2.setAttribute('syn-options', `{editType: 'date', maskPattern: '9999-99-99', dataType: 'string', belongID: '${setting.belongID}'}`);
                }
            }

            if ($object.isNullOrUndefined(events) == false) {
                textbox2.setAttribute('syn-events', events);
            }

            syn.$m.insertAfter(textbox2, span);

            syn.$l.addEvent(textbox2, 'blur', (evt) => {
                var elID = evt.currentTarget.id.replace('_EndedAt', '');
                var textbox1ID = elID + '_StartedAt';
                var textbox2ID = elID + '_EndedAt';

                var textbox1Value = syn.$l.get(textbox1ID).value.trim();
                var textbox2Value = syn.$l.get(textbox2ID).value.trim();

                if (textbox1Value > textbox2Value) {
                    syn.$l.get(textbox2ID).value = textbox1Value || $date.toString(new Date(), 'd');
                }
            });

            var button = syn.$m.create({
                id: `${elID}_Button`,
                tag: 'button',
                className: 'btn btn-icon f:20! bg-muted-lt'
            });
            button.innerHTML = `<i class="ti ti-calendar"></i>`;
            syn.$m.insertAfter(button, textbox2);

            syn.uicontrols.$textbox.controlLoad(textbox1ID, eval('(' + syn.$l.get(textbox1ID).getAttribute('syn-options') + ')'));
            syn.uicontrols.$textbox.controlLoad(textbox2ID, eval('(' + syn.$l.get(textbox2ID).getAttribute('syn-options') + ')'));

            setting.field = el;

            if (syn.$l.get('divPeriodPicker') == null) {
                var divPeriodPicker = syn.$m.create({
                    id: 'divPeriodPicker',
                    tag: 'div',
                    className: 'card absolute w:568 z-index:100 border-radius:0! border:1px|solid|#ccc! hidden'
                });

                divPeriodPicker.innerHTML = $dateperiodpicker.periodPickerHtml;
                divPeriodPicker.style.cssText = `box-shadow: 0 5px 15px -5px rgba(0, 0, 0, 0.5);`;

                document.body.appendChild(divPeriodPicker);

                syn.$l.addEvent('_DatePeriodPicker_btnThisYear', 'click', $dateperiodpicker._DatePeriodPicker_btnThisYear_click);
                syn.$l.addEvent('_DatePeriodPicker_btnUntilToday', 'click', $dateperiodpicker._DatePeriodPicker_btnUntilToday_click);
                syn.$l.addEvent('_DatePeriodPicker_btnToday', 'click', $dateperiodpicker._DatePeriodPicker_btnToday_click);
                syn.$l.addEvent('_DatePeriodPicker_btnPreviousDay', 'click', $dateperiodpicker._DatePeriodPicker_btnPreviousDay_click);
                syn.$l.addEvent('_DatePeriodPicker_btnTomorrow', 'click', $dateperiodpicker._DatePeriodPicker_btnTomorrow_click);
                syn.$l.addEvent('_DatePeriodPicker_btnWeekly', 'click', $dateperiodpicker._DatePeriodPicker_btnWeekly_click);
                syn.$l.addEvent('_DatePeriodPicker_btnPreviousWeek', 'click', $dateperiodpicker._DatePeriodPicker_btnPreviousWeek_click);
                syn.$l.addEvent('_DatePeriodPicker_btnThisMonth', 'click', $dateperiodpicker._DatePeriodPicker_btnThisMonth_click);
                syn.$l.addEvent('_DatePeriodPicker_btnPreviousMonth', 'click', $dateperiodpicker._DatePeriodPicker_btnPreviousMonth_click);
                syn.$l.addEvent('_DatePeriodPicker_btnPreviousYear', 'click', $dateperiodpicker._DatePeriodPicker_btnPreviousYear_click);
                syn.$l.addEvent('_DatePeriodPicker_btnTwoYearAgo', 'click', $dateperiodpicker._DatePeriodPicker_btnTwoYearAgo_click);
                syn.$l.addEvent('_DatePeriodPicker_btnQuarter1', 'click', $dateperiodpicker._DatePeriodPicker_btnQuarter1_click);
                syn.$l.addEvent('_DatePeriodPicker_btnQuarter2', 'click', $dateperiodpicker._DatePeriodPicker_btnQuarter2_click);
                syn.$l.addEvent('_DatePeriodPicker_btnQuarter3', 'click', $dateperiodpicker._DatePeriodPicker_btnQuarter3_click);
                syn.$l.addEvent('_DatePeriodPicker_btnQuarter4', 'click', $dateperiodpicker._DatePeriodPicker_btnQuarter4_click);
                syn.$l.addEvent('_DatePeriodPicker_btnFirstHalf', 'click', $dateperiodpicker._DatePeriodPicker_btnFirstHalf_click);
                syn.$l.addEvent('_DatePeriodPicker_btnSecondHalf', 'click', $dateperiodpicker._DatePeriodPicker_btnSecondHalf_click);
                syn.$l.addEvent('_DatePeriodPicker_btnReset', 'click', $dateperiodpicker._DatePeriodPicker_btnReset_click);
                syn.$l.addEvent('_DatePeriodPicker_btnConfirm', 'click', $dateperiodpicker._DatePeriodPicker_btnConfirm_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth1"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth2"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth3"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth4"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth5"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth6"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth7"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth8"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth9"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth10"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth11"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);
                syn.$l.addEvent(syn.$l.querySelector('[for="_DatePeriodPicker_chkPeriodMonth12"]'), 'click', $dateperiodpicker._DatePeriodPicker_chkPeriodMonth_click);

                $dateperiodpicker.selectedYear = $date.toString(new Date(), 'y');

                var pkaStartSetting = $object.clone(setting);
                pkaStartSetting.field = syn.$l.get('_DatePeriodPicker_txtStartDate');
                pkaStartSetting.container = syn.$l.get('calStartDate');
                pkaStartSetting.onSelect = (date) => {
                    if ($object.isNullOrUndefined(date) == true) {
                        return;
                    }

                    var elID = arguments[0];
                    var target = window.event && window.event.currentTarget;
                    if (target && target.id == `${elID}_Button`) {
                        return;
                    }

                    var startedAt = $dateperiodpicker.pkaStartDate.getDate();
                    var endedAt = $dateperiodpicker.pkaEndDate.getDate();
                    syn.$l.get('spnPeriodDate').innerText = `${($date.diff(startedAt, endedAt) + 1)}일`;

                    $dateperiodpicker.pkaEndDate.setMinDate(startedAt);
                    $dateperiodpicker.checkPeriodMonth();

                    var popup = syn.$l.get('divPeriodPicker');
                    if (syn.$m.hasClass(popup, 'hidden') == false) {
                        var control = $dateperiodpicker.getControl(elID);
                        if (control) {
                            var textbox1 = syn.$l.get(control.textbox1ID);
                            var mod = window[syn.$w.pageScript];
                            var events = eval(textbox1.getAttribute('syn-events'));

                            var selectFunction = '{0}_onselect'.format(elID);
                            if (events && events.includes('onselect') && mod && mod.event[selectFunction]) {
                                mod.event[selectFunction](elID, 'startedAt', date);
                            }
                        }
                    }
                };

                $dateperiodpicker.pkaStartDate = new Pikaday(pkaStartSetting);

                var pkaEndSetting = $object.clone(setting);
                pkaEndSetting.field = syn.$l.get('_DatePeriodPicker_txtEndDate');
                pkaEndSetting.container = syn.$l.get('calEndDate');
                pkaEndSetting.onSelect = (date) => {
                    if ($object.isNullOrUndefined(date) == true) {
                        return;
                    }

                    var elID = arguments[0];
                    var target = window.event && window.event.currentTarget;
                    if (target && target.id == `${elID}_Button`) {
                        return;
                    }

                    var startedAt = $dateperiodpicker.pkaStartDate.getDate();
                    var endedAt = $dateperiodpicker.pkaEndDate.getDate();
                    syn.$l.get('spnPeriodDate').innerText = `${($date.diff(startedAt, endedAt) + 1)}일`;

                    $dateperiodpicker.pkaStartDate.setMaxDate(endedAt);
                    $dateperiodpicker.checkPeriodMonth();

                    var popup = syn.$l.get('divPeriodPicker');
                    if (syn.$m.hasClass(popup, 'hidden') == false) {
                        var control = $dateperiodpicker.getControl(elID);
                        if (control) {
                            var textbox2 = syn.$l.get(control.textbox2ID);
                            var mod = window[syn.$w.pageScript];
                            var events = eval(textbox2.getAttribute('syn-events'));

                            var selectFunction = '{0}_onselect'.format(elID);
                            if (events && events.includes('onselect') && mod && mod.event[selectFunction]) {
                                mod.event[selectFunction](elID, 'endedAt', date);
                            }
                        }
                    }
                };

                $dateperiodpicker.pkaEndDate = new Pikaday(pkaEndSetting);

                syn.$l.addEvent(document.body, 'click', (evt) => {
                    var popup = syn.$l.get('divPeriodPicker');
                    if (popup && syn.$m.hasClass(popup, 'hidden') == false) {
                        var elID = popup.getAttribute('elID');
                        if (popup.contains(evt.target) == false) {
                            var button = evt.target.closest('button');
                            if ($string.isNullOrEmpty(evt.target.data) == true && ($object.isNullOrUndefined(button) == true || button.id.startsWith(elID) == false)) {
                                $dateperiodpicker.hidePopup();
                            }
                        }

                        evt.returnValue = false;
                        evt.cancel = true;
                        if (evt.preventDefault) {
                            evt.preventDefault();
                        }

                        if (evt.stopPropagation) {
                            evt.stopPropagation();
                        }
                        return false;
                    }
                });
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

            if ($string.isNullOrEmpty(setting.value) == false) {
                var value = setting.value;
                var number = $string.toNumber(value.split(':')[1]);
                var date = null;
                if (value == 'now') {
                    date = new Date();
                }
                else if (value.startsWith('day:') == true) {
                    date = $date.addDay(new Date(), number);
                }
                else if (value.startsWith('week:') == true) {
                    date = $date.addWeek(new Date(), number);
                }
                else if (value.startsWith('month:') == true) {
                    date = $date.addMonth(new Date(), number);
                }
                else if (value.startsWith('year:') == true) {
                    date = $date.addYear(new Date(), number);
                }

                if (number < 0) {
                    if (date) {
                        var textbox1 = syn.$l.get(textbox1ID);
                        textbox1.value = $date.toString(date, 'd');

                        var textbox2 = syn.$l.get(textbox2ID);
                        textbox2.value = $date.toString(new Date(), 'd');
                    }
                }
                else {
                    if (date) {
                        var textbox1 = syn.$l.get(textbox1ID);
                        textbox1.value = $date.toString(new Date(), 'd');

                        var textbox2 = syn.$l.get(textbox2ID);
                        textbox2.value = $date.toString(date, 'd');
                    }
                }
            }

            syn.$l.addEvent(syn.$l.get(elID + '_Button'), 'click', function (evt) {
                var elID = evt.currentTarget.id.replace('_Button', '');
                var today = $date.toString(new Date(), 'd');
                var control = $dateperiodpicker.getControl(elID);
                if (control) {
                    var textbox1 = syn.$l.get(control.textbox1ID);
                    var startDate = $date.toString(new Date(textbox1.value || today), 'd');
                    var textbox2 = syn.$l.get(control.textbox2ID);
                    var endDate = $date.toString(new Date(textbox2.value || today), 'd');

                    $dateperiodpicker.pkaStartDate.setDate(startDate);
                    $dateperiodpicker.pkaEndDate.setDate(endDate);

                    $dateperiodpicker.setDateRange(startDate, endDate);
                }
                else {
                    $dateperiodpicker.pkaStartDate.setDate(today);
                    $dateperiodpicker.pkaEndDate.setDate(today);

                    $dateperiodpicker.setDateRange(today, today);
                }

                $dateperiodpicker.checkPeriodMonth();
                $dateperiodpicker.showPopup(elID);
            });

            $dateperiodpicker.dateControls.push({
                id: elID,
                textbox1ID: textbox1ID,
                textbox2ID: textbox2ID,
                setting: $object.clone(setting)
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        showPopup(elID) {
            var control = $dateperiodpicker.getControl(elID);
            if (control) {
                var textbox = syn.$l.get(control.textbox1ID);
                var popup = syn.$l.get('divPeriodPicker');
                popup.setAttribute('elID', elID);
                var rect = textbox.getBoundingClientRect();

                syn.$m.removeClass(popup, 'hidden');

                var positions = [
                    { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
                    { top: rect.top + window.scrollY - popup.offsetHeight, left: rect.left + window.scrollX }
                ];

                var bestPosition = positions[0];
                var viewportWidth = window.innerWidth;
                var viewportHeight = window.innerHeight;

                for (var i = 0; i < positions.length; i++) {
                    var pos = positions[i];
                    if (pos.left >= 0 && pos.left + popup.offsetWidth <= viewportWidth &&
                        pos.top >= 0 && pos.top + popup.offsetHeight <= viewportHeight) {
                        bestPosition = pos;
                        break;
                    }
                }

                popup.style.top = bestPosition.top + 'px';
                popup.style.left = bestPosition.left + 'px';
            }
        },

        hidePopup() {
            var popup = syn.$l.get('divPeriodPicker');
            syn.$m.addClass(popup, 'hidden');
        },

        getValue(elID, meta) {
            var result = null;
            var dateControl = $dateperiodpicker.getControl(elID);

            if (dateControl) {
                var startedAt = '';
                if (dateControl.textbox1ID && syn.$l.get(dateControl.textbox1ID)) {
                    startedAt = syn.$l.get(dateControl.textbox1ID).value;
                }

                var endedAt = '';
                if (dateControl.textbox1ID && syn.$l.get(dateControl.textbox2ID)) {
                    endedAt = syn.$l.get(dateControl.textbox2ID).value;
                }
                result = `${startedAt} ~ ${endedAt}`;
            }

            return result;
        },

        setValue(elID, value, meta) {
            var dateControl = $dateperiodpicker.getControl(elID);
            if (dateControl) {
                var startedAt = '';
                var endedAt = '';
                var splitValue = $string.split(value, ',');
                if (splitValue.length > 1) {
                    startedAt = splitValue[0];
                    endedAt = splitValue[1];
                }
                else if (splitValue.length > 0) {
                    startedAt = splitValue[0];
                    endedAt = splitValue[0];
                }

                if (dateControl.textbox1ID && syn.$l.get(dateControl.textbox1ID)) {
                    syn.$l.get(dateControl.textbox1ID).value = startedAt;
                }

                if (dateControl.textbox1ID && syn.$l.get(dateControl.textbox2ID)) {
                    syn.$l.get(dateControl.textbox2ID).value = endedAt;
                }
            }
        },

        clear(elID, isControlLoad) {
            var dateControl = $dateperiodpicker.getControl(elID);
            if (dateControl) {
                if (dateControl.textbox1ID && syn.$l.get(dateControl.textbox1ID)) {
                    syn.$l.get(dateControl.textbox1ID).value = '';
                }

                if (dateControl.textbox1ID && syn.$l.get(dateControl.textbox2ID)) {
                    syn.$l.get(dateControl.textbox2ID).value = '';
                }
            }
        },

        getControl(elID) {
            var result = null;
            var length = $dateperiodpicker.dateControls.length;
            for (var i = 0; i < length; i++) {
                var item = $dateperiodpicker.dateControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
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

        setDateRange(startDate, endDate) {
            startDate = startDate || $date.toString(new Date(), 'd');
            endDate = endDate || $date.toString(new Date(), 'd');

            $dateperiodpicker.selectedYear = startDate.substring(0, 4);

            var startedAt = new Date(startDate);
            var endedAt = new Date(endDate);

            $dateperiodpicker.pkaStartDate.setDate(startDate);
            $dateperiodpicker.pkaEndDate.setDate(endDate);
            setTimeout(() => {
                $dateperiodpicker.pkaStartDate.setDate(startDate);
                $dateperiodpicker.pkaEndDate.setDate(endDate);
            }, 25);

            syn.$l.get('spnPeriodDate').innerText = `${($date.diff(startedAt, endedAt) + 1)}일`;
        },

        checkSelectedMonth(month) {
            var date = new Date($dateperiodpicker.selectedYear + `-${month}-01`);
            var startDate = $date.toString(date, 'd');
            var endDate = $date.getLastDate(new Date(startDate));

            $dateperiodpicker.setDateRange(startDate, endDate);
            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([$string.toNumber(month)]);
            }, 30);
        },

        checkPeriodMonth(months) {
            for (var i = 1; i <= 12; i++) {
                syn.$l.get('_DatePeriodPicker_chkPeriodMonth' + i.toString()).checked = ($object.isArray(months) == true && months.includes(i) == true);
            }
        },

        setLocale(elID, translations, control, options) {
        },

        _DatePeriodPicker_btnThisYear_click() {
            var date = new Date();
            var year = $date.toString(date, 'y');
            var startDate = year + '-01-01';
            var endDate = year + '-12-31';

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            }, 30);
        },

        _DatePeriodPicker_btnUntilToday_click() {
            var date = new Date();
            var today = $date.toString(date, 'd');
            var startDate = today.substring(0, 4) + '-01-01';
            var endDate = today;

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                var thisMonth = parseInt($date.toString(date, 'm'));
                $dateperiodpicker.checkPeriodMonth(Array(thisMonth).fill().map((_, i) => i + 1));
            }, 30);
        },

        _DatePeriodPicker_btnToday_click() {
            var date = new Date();
            var startDate = $date.toString(date, 'd');
            var endDate = startDate;

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                var thisMonth = parseInt($date.toString(date, 'm'));
                $dateperiodpicker.checkPeriodMonth([thisMonth]);
            }, 30);
        },

        _DatePeriodPicker_btnPreviousDay_click() {
            var date = new Date();
            var startDate = $date.toString($date.addDay(date, -1), 'd');
            var endDate = startDate;

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                var thisMonth = parseInt($date.toString(date, 'm'));
                $dateperiodpicker.checkPeriodMonth([thisMonth]);
            }, 30);
        },

        _DatePeriodPicker_btnWeekly_click() {
            var date = new Date();
            var today = $date.toString(date, 'd');
            var weekNumber = $date.toString(date, 'w');
            var weekIndex = weekNumber - 1;
            var weekOfMonths = $date.weekOfMonth(today.substring(0, 4), today.substring(5, 7));
            var week = weekOfMonths[weekIndex];
            var startDate = week.weekStartDate;
            var endDate = week.weekEndDate;

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                var thisMonth = parseInt($date.toString(date, 'm'));
                $dateperiodpicker.checkPeriodMonth([thisMonth]);
            }, 30);
        },

        _DatePeriodPicker_btnPreviousWeek_click() {
            var date = new Date();
            var week = null;
            if ($date.addWeek(date, -1).getMonth() < date.getMonth()) {
                date = $date.getLastDate($date.addMonth(new Date(), -1));
            }

            var today = $date.toString(date, 'd');
            var weekNumber = $date.toString(date, 'w');
            var weekIndex = weekNumber - 1 - ($date.addWeek(date, -1).getMonth() == date.getMonth() ? 1 : 0);
            var weekOfMonths = $date.weekOfMonth(today.substring(0, 4), today.substring(5, 7));
            var week = weekOfMonths[weekIndex];

            var startDate = week.weekStartDate;
            var endDate = week.weekEndDate;

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                var thisMonth = parseInt($date.toString(date, 'm'));
                $dateperiodpicker.checkPeriodMonth([thisMonth]);
            }, 30);
        },

        _DatePeriodPicker_btnThisMonth_click() {
            var date = new Date();
            var startDate = $date.toString(date, 'ym') + '-01';
            var endDate = $date.getLastDate(date);

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                var thisMonth = parseInt($date.toString(date, 'm'));
                $dateperiodpicker.checkPeriodMonth([thisMonth]);
            }, 30);
        },

        _DatePeriodPicker_btnPreviousMonth_click() {
            var date = $date.addMonth(new Date(), -1);
            var startDate = $date.toString(date, 'ym') + '-01';
            var endDate = $date.getLastDate(date);
            $dateperiodpicker.selectedYear = startDate.substring(0, 4);

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                var thisMonth = parseInt($date.toString(date, 'm'));
                $dateperiodpicker.checkPeriodMonth([thisMonth]);
            }, 30);
        },

        _DatePeriodPicker_btnPreviousYear_click() {
            var date = $date.addYear(new Date(), -1);
            var year = $date.toString(date, 'y');
            var startDate = year + '-01-01';
            var endDate = year + '-12-31';

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            }, 30);
        },

        _DatePeriodPicker_btnTwoYearAgo_click() {
            var date = $date.addYear(new Date(), -2);
            var year = $date.toString(date, 'y');
            var startDate = year + '-01-01';
            var endDate = year + '-12-31';

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            }, 30);
        },

        _DatePeriodPicker_btnQuarter1_click() {
            var date = new Date($dateperiodpicker.selectedYear + '-01-01');
            var year = $date.toString(date, 'y');
            var startDate = year + '-01-01';
            var endDate = $date.getLastDate(new Date(year + '-03-31'));

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([1, 2, 3]);
            }, 30);
        },

        _DatePeriodPicker_btnQuarter2_click() {
            var date = new Date($dateperiodpicker.selectedYear + '-01-01');
            var year = $date.toString(date, 'y');
            var startDate = year + '-04-01';
            var endDate = $date.getLastDate(new Date(year + '-06-30'));

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([4, 5, 6]);
            }, 30);
        },

        _DatePeriodPicker_btnQuarter3_click() {
            var date = new Date($dateperiodpicker.selectedYear + '-01-01');
            var year = $date.toString(date, 'y');
            var startDate = year + '-07-01';
            var endDate = $date.getLastDate(new Date(year + '-09-30'));

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([7, 8, 9]);
            }, 30);
        },

        _DatePeriodPicker_btnQuarter4_click() {
            var date = new Date($dateperiodpicker.selectedYear + '-01-01');
            var year = $date.toString(date, 'y');
            var startDate = year + '-10-01';
            var endDate = $date.getLastDate(new Date(year + '-12-31'));

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([10, 11, 12]);
            }, 30);
        },

        _DatePeriodPicker_btnFirstHalf_click() {
            var date = new Date($dateperiodpicker.selectedYear + '-01-01');
            var year = $date.toString(date, 'y');
            var startDate = year + '-01-01';
            var endDate = $date.getLastDate(new Date(year + '-06-30'));

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([1, 2, 3, 4, 5, 6]);
            }, 30);
        },

        _DatePeriodPicker_btnSecondHalf_click() {
            var date = new Date($dateperiodpicker.selectedYear + '-01-01');
            var year = $date.toString(date, 'y');
            var startDate = year + '-07-01';
            var endDate = $date.getLastDate(new Date(year + '-12-31'));

            $dateperiodpicker.setDateRange(startDate, endDate);

            setTimeout(() => {
                $dateperiodpicker.checkPeriodMonth([7, 8, 9, 10, 11, 12]);
            }, 30);
        },

        _DatePeriodPicker_btnReset_click() {
            var popup = syn.$l.get('divPeriodPicker');
            if (syn.$m.hasClass(popup, 'hidden') == false) {
                var elID = popup.getAttribute('elID');

                var control = $dateperiodpicker.getControl(elID);
                if (control) {
                    var textbox1 = syn.$l.get(control.textbox1ID);
                    textbox1.value = '';

                    var textbox2 = syn.$l.get(control.textbox2ID);
                    textbox2.value = '';

                    var mod = window[syn.$w.pageScript];
                    var events = eval(textbox1.getAttribute('syn-events'));

                    var resetFunction = '{0}_onreset'.format(elID);
                    if (events && events.includes('onreset') && mod && mod.event[resetFunction]) {
                        mod.event[resetFunction](elID, textbox1.value, textbox2.value);
                    }
                }

                $dateperiodpicker.hidePopup();
            }
        },

        _DatePeriodPicker_btnConfirm_click() {
            if (syn.$l.get('spnPeriodDate').innerText.startsWith('-') == true) {
                syn.$w.alert('시작일자가 종료일자 보다 클 수 없습니다.');
                return;
            }

            var popup = syn.$l.get('divPeriodPicker');
            if (syn.$m.hasClass(popup, 'hidden') == false) {
                var elID = popup.getAttribute('elID');

                var control = $dateperiodpicker.getControl(elID);
                if (control) {
                    var startedAt = $dateperiodpicker.pkaStartDate.getDate();
                    var endedAt = $dateperiodpicker.pkaEndDate.getDate();

                    var textbox1 = syn.$l.get(control.textbox1ID);
                    textbox1.value = $date.toString(startedAt, 'd');

                    var textbox2 = syn.$l.get(control.textbox2ID);
                    textbox2.value = $date.toString(endedAt, 'd');

                    var mod = window[syn.$w.pageScript];
                    var events = eval(textbox1.getAttribute('syn-events'));

                    var confirmFunction = '{0}_onconfirm'.format(elID);
                    if (events && events.includes('onconfirm') && mod && mod.event[confirmFunction]) {
                        mod.event[confirmFunction](elID, textbox1.value, textbox2.value);
                    }
                }

                $dateperiodpicker.hidePopup();
            }
        },

        _DatePeriodPicker_chkPeriodMonth_click(evt) {
            const el = syn.$l.get(evt.target.getAttribute('for'));
            if (el) {
                $dateperiodpicker.checkSelectedMonth(el.value);
            }
        }
    });
    syn.uicontrols.$dateperiodpicker = $dateperiodpicker;
})(window);
