/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $barcalender = syn.uicontrols.$barcalender || new syn.module();

    $barcalender.extend({
        name: 'syn.uicontrols.$barcalender',
        version: 'v2026.10.15',
        calendarControls: [],
        defaultSetting: {
            mode: 'day',
            value: '',
            width: '100%',
            disabled: false,
            readOnly: false,
            yearRange: 10,
            highlights: {},
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
            var control = $barcalender.getControl(elID);
            if (control) {
                return control;
            }

            var el = syn.$l.get(elID);
            if (!el) {
                throw new Error('BarCalender: element not found: ' + elID);
            }

            setting = syn.$w.argumentsExtend($barcalender.defaultSetting, setting || {});

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            if (setting.mode !== 'day' && setting.mode !== 'month') {
                throw new Error('BarCalender: mode must be day or month');
            }

            setting.elID = elID;
            setting.yearRange = Number.isInteger(setting.yearRange) && setting.yearRange >= 0 ? Math.min(setting.yearRange, 9999) : 10;
            setting.highlights = Object.assign({}, setting.highlights && typeof setting.highlights === 'object' ? setting.highlights : {});
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.classList.add('syn-barcalender');
            el.style.width = setting.width;
            el.setAttribute('role', 'group');
            el.setAttribute('aria-label', setting.controlText || (setting.mode === 'day' ? '날짜 선택' : '월 선택'));

            var navigation = document.createElement('div');
            navigation.className = 'syn-barcalender-navigation';

            var previous = $barcalender.createButton('‹', '이전 달');
            var next = $barcalender.createButton('›', '다음 달');

            var yearSelect = document.createElement('select');
            yearSelect.className = 'form-select syn-barcalender-year';
            yearSelect.setAttribute('aria-label', '연도');

            var monthSelect = document.createElement('select');
            monthSelect.className = 'form-select syn-barcalender-month';
            monthSelect.setAttribute('aria-label', '월');
            for (var month = 1; month <= 12; month++) {
                monthSelect.appendChild($barcalender.createOption(month, month + '월'));
            }

            monthSelect.hidden = setting.mode === 'month';
            navigation.append(previous, yearSelect, monthSelect, next);

            var items = document.createElement('div');
            items.className = 'syn-barcalender-items';
            items.setAttribute('role', 'group');
            items.setAttribute('aria-label', setting.mode === 'day' ? '날짜' : '월');
            el.replaceChildren(navigation, items);

            var now = new Date();
            control = {
                id: elID,
                host: el,
                setting: setting,
                previous: previous,
                next: next,
                yearSelect: yearSelect,
                monthSelect: monthSelect,
                items: items,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                value: '',
                disabled: setting.disabled === true,
                readOnly: setting.readOnly === true
            };

            $barcalender.bindEvents(control);
            $barcalender.calendarControls.push(control);
            $barcalender.setValue(elID, setting.value);

            return control;
        },

        getValue(elID, meta) {
            var result = null;
            var control = $barcalender.getControl(elID);
            if (control) {
                result = control.value;
            }

            return result;
        },

        setValue(elID, value, meta) {
            var control = $barcalender.getControl(elID);
            if (!control) {
                return false;
            }

            var date = $barcalender.parseValue(value, control.setting.mode);
            if (date === null) {
                syn.$l.eventLog('$barcalender.setValue', 'elID: "{0}" 날짜 형식 또는 날짜가 올바르지 않습니다.'.format(elID), 'Warning');

                // 초기 값이 잘못된 경우에도 빈 달력을 표시한다.
                $barcalender.render(control);
                return false;
            }

            var year = date ? date.getFullYear() : control.year;
            var month = date ? date.getMonth() + 1 : control.month;
            $barcalender.updateControl(control, year, month, date ? value : '', false);

            return true;
        },

        clear(elID, isControlLoad) {
            return $barcalender.setValue(elID, '');
        },

        setDisabled(elID, disabled) {
            var control = $barcalender.getControl(elID);
            if (control) {
                control.disabled = disabled !== false;
                $barcalender.applyState(control);
            }
        },

        setReadOnly(elID, readOnly) {
            var control = $barcalender.getControl(elID);
            if (control) {
                control.readOnly = readOnly !== false;
                $barcalender.applyState(control);
            }
        },

        getControl(elID) {
            var result = null;
            var length = $barcalender.calendarControls.length;
            for (var i = 0; i < length; i++) {
                var item = $barcalender.calendarControls[i];
                if (item.id === elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        bindEvents(control) {
            syn.$l.addEvent(control.previous, 'click', function () {
                $barcalender.moveMonth(control, -1);
            });

            syn.$l.addEvent(control.next, 'click', function () {
                $barcalender.moveMonth(control, 1);
            });

            syn.$l.addEvent(control.yearSelect, 'change', function (evt) {
                $barcalender.changeView(control, evt);
            });

            syn.$l.addEvent(control.monthSelect, 'change', function (evt) {
                $barcalender.changeView(control, evt);
            });

            syn.$l.addEvent(control.items, 'click', function (evt) {
                var item = evt.target.closest('button[data-value]');
                if (!item || !control.items.contains(item) || $barcalender.isLocked(control) == true) {
                    return;
                }

                var date = $barcalender.parseValue(item.dataset.value, control.setting.mode);
                $barcalender.updateControl(control, date.getFullYear(), date.getMonth() + 1, item.dataset.value, true);

                // 버튼을 다시 그린 뒤 페이지를 스크롤하지 않고 키보드 포커스를 복원한다.
                var selectedItem = control.items.querySelector('[data-value="' + item.dataset.value + '"]');
                selectedItem.focus({ preventScroll: true });
            });

            syn.$l.addEvent(control.host, 'keydown', function (evt) {
                // HandStack의 공통 keypress 처리가 막는 Enter 버튼 동작을 지원한다.
                if (evt.key === 'Enter' && evt.target.tagName === 'BUTTON' && $barcalender.isLocked(control) == false) {
                    evt.preventDefault();
                    if (!evt.repeat) {
                        evt.target.click();
                    }
                }
            });
        },

        moveMonth(control, offset) {
            if ($barcalender.isLocked(control) == true) {
                return;
            }

            var date = $barcalender.createDate(control.year, control.month - 1 + offset, 1);
            var year = date.getFullYear();
            if (year < 1 || year > 9999) {
                return;
            }

            var value = control.setting.mode === 'month' ? $barcalender.formatMonth(date) : control.value;
            $barcalender.updateControl(control, year, date.getMonth() + 1, value, true);
        },

        changeView(control, evt) {
            // select의 기본 change 이벤트가 컨트롤 change로 중복 전달되지 않도록 한다.
            evt.stopPropagation();
            if ($barcalender.isLocked(control) == true) {
                return;
            }

            var year = Number(control.yearSelect.value);
            var month = Number(control.monthSelect.value);
            var value = control.value;
            if (control.setting.mode === 'month' && control.value) {
                value = $barcalender.formatYear(year) + '-' + $barcalender.padNumber(month);
            }

            $barcalender.updateControl(control, year, month, value, true);
        },

        updateControl(control, year, month, value, userAction) {
            var previousValue = control.value;
            var viewChanged = control.year !== year || control.month !== month;
            control.year = year;
            control.month = month;
            control.value = value;
            $barcalender.render(control);

            if (userAction && viewChanged) {
                syn.$l.triggerEvent(control.host, 'viewChange', {
                    year: year,
                    month: month,
                    mode: control.setting.mode
                });
            }

            if (userAction && previousValue !== value) {
                syn.$l.triggerEvent(control.host, 'change', {
                    value: value,
                    previousValue: previousValue,
                    mode: control.setting.mode
                });
            }
        },

        render(control) {
            var today = new Date();
            var range = control.setting.yearRange;
            var currentYear = today.getFullYear();
            var startYear = Math.max(1, Math.min(currentYear - range, control.year));
            var endYear = Math.min(9999, Math.max(currentYear + range, control.year));

            control.yearSelect.replaceChildren();
            for (var year = startYear; year <= endYear; year++) {
                control.yearSelect.appendChild($barcalender.createOption(year, year + '년'));
            }

            control.yearSelect.value = control.year;
            control.monthSelect.value = control.month;
            control.items.replaceChildren();

            var isDay = control.setting.mode === 'day';
            var count = isDay ? $barcalender.createDate(control.year, control.month, 0).getDate() : 12;
            for (var index = 1; index <= count; index++) {
                var date = $barcalender.createDate(control.year, isDay ? control.month - 1 : index - 1, isDay ? index : 1);
                var value = isDay ? $barcalender.formatDate(date) : $barcalender.formatMonth(date);
                var item = $barcalender.createButton(isDay ? String(index) : index + '월', value);
                item.classList.add('syn-barcalender-item');
                item.dataset.value = value;
                item.setAttribute('aria-pressed', value === control.value ? 'true' : 'false');

                var highlight = control.setting.highlights[value];
                if (typeof highlight === 'string') {
                    var classNames = highlight.split(/\s+/);
                    for (var i = 0; i < classNames.length; i++) {
                        if (classNames[i]) {
                            item.classList.add(classNames[i]);
                        }
                    }
                }

                if (isDay && (date.getDay() === 0 || date.getDay() === 6)) {
                    item.classList.add('syn-barcalender-weekend');
                }

                var isToday = value === (isDay ? $barcalender.formatDate(today) : $barcalender.formatMonth(today));
                if (isToday) {
                    item.classList.add('syn-barcalender-today');
                    item.setAttribute('aria-current', 'date');
                }

                if (value === control.value) {
                    item.classList.add('syn-barcalender-selected');
                }

                control.items.appendChild(item);
            }

            $barcalender.applyState(control);

            var target = control.items.querySelector('.syn-barcalender-selected') || control.items.querySelector('.syn-barcalender-today');
            if (target) {
                // 페이지가 아닌 날짜·월 버튼 영역만 스크롤한다.
                control.items.scrollLeft = Math.max(0, target.offsetLeft - (control.items.clientWidth - target.offsetWidth) / 2);
            }
        },

        applyState(control) {
            var isLocked = $barcalender.isLocked(control);
            control.host.setAttribute('aria-disabled', control.disabled ? 'true' : 'false');
            control.host.setAttribute('aria-readonly', control.readOnly ? 'true' : 'false');
            control.host.classList.toggle('syn-barcalender-disabled', control.disabled);
            control.host.classList.toggle('syn-barcalender-readonly', control.readOnly);

            var elements = control.host.querySelectorAll('button, select');
            for (var i = 0; i < elements.length; i++) {
                elements[i].disabled = isLocked;
            }

            if (isLocked == false) {
                control.previous.disabled = control.year === 1 && control.month === 1;
                control.next.disabled = control.year === 9999 && control.month === 12;
            }
        },

        isLocked(control) {
            return control.disabled || control.readOnly;
        },

        createButton(text, label) {
            var el = document.createElement('button');
            el.type = 'button';
            el.className = 'btn';
            el.textContent = text;
            if (label) {
                el.setAttribute('aria-label', label);
            }

            return el;
        },

        createOption(value, text) {
            var el = document.createElement('option');
            el.value = value;
            el.textContent = text;

            return el;
        },

        // 1~99년도와 월·연도 경계를 로컬 날짜로 계산한다.
        createDate(year, month, day) {
            var date = new Date(0);
            date.setHours(0, 0, 0, 0);
            date.setFullYear(year, month, day);

            return date;
        },

        // 빈 값은 '', 잘못된 값은 null, 유효한 값은 Date를 반환한다.
        parseValue(value, mode) {
            if (value === null || value === undefined || value === '') {
                return '';
            }

            if (typeof value !== 'string') {
                return null;
            }

            var pattern = mode === 'month' ? /^(\d{4})-(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2})$/;
            var match = pattern.exec(value);
            if (!match) {
                return null;
            }

            var year = Number(match[1]);
            var month = Number(match[2]);
            var day = mode === 'month' ? 1 : Number(match[3]);
            if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
                return null;
            }

            var date = $barcalender.createDate(year, month - 1, day);
            var result = null;
            if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                result = date;
            }

            return result;
        },

        padNumber(value) {
            return String(value).padStart(2, '0');
        },

        formatYear(year) {
            return String(year).padStart(4, '0');
        },

        formatMonth(date) {
            return $barcalender.formatYear(date.getFullYear()) + '-' + $barcalender.padNumber(date.getMonth() + 1);
        },

        formatDate(date) {
            return $barcalender.formatMonth(date) + '-' + $barcalender.padNumber(date.getDate());
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$barcalender = $barcalender;
})(window);
