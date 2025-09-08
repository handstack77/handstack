/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $calendar = syn.uicontrols.$calendar || new syn.module();

    $calendar.extend({
        name: 'syn.uicontrols.$calendar',
        version: 'v2025.9.6',
        calendarControls: [],
        defaultSetting: {
            elID: '',
            height: 'auto',
            expandRows: true,
            locale: 'ko',
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            dayMaxEvents: true,
            displayEventTime: false,
            selectable: false,
            editable: false,
            eventMapping: {
                id: 'ScheduleEventID',
                title: 'ScheduleTitle',
                start: 'StartDate',
                end: 'EndDate',
                backgroundColor: 'BackgroundColor',
                borderColor: 'BackgroundColor',
                textColor: 'TextColor',
                allDay: 'AllDay',
                color: 'Color',
                classNames: 'ClassNames'
            },
            getter: false,
            setter: false,
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
            setting = syn.$w.argumentsExtend($calendar.defaultSetting, setting);

            if (FullCalendar) {
                FullCalendar.CalendarDataManager.prototype._computeOptionsData = function (optionOverrides, dynamicOptionOverrides, calendarApi) {
                    var _a = this.processRawCalendarOptions(optionOverrides, dynamicOptionOverrides), refinedOptions = _a.refinedOptions, pluginHooks = _a.pluginHooks, localeDefaults = _a.localeDefaults, availableLocaleData = _a.availableLocaleData, extra = _a.extra;
                    var dateEnv = this.buildDateEnv(refinedOptions.timeZone, refinedOptions.locale, refinedOptions.weekNumberCalculation, refinedOptions.firstDay, refinedOptions.weekText, pluginHooks, availableLocaleData, refinedOptions.defaultRangeSeparator);
                    var viewSpecs = this.buildViewSpecs(pluginHooks.views, optionOverrides, dynamicOptionOverrides, localeDefaults);
                    var theme = this.buildTheme(refinedOptions, pluginHooks);
                    var toolbarConfig = this.parseToolbars(refinedOptions, optionOverrides, theme, viewSpecs, calendarApi);
                    return {
                        calendarOptions: refinedOptions,
                        pluginHooks: pluginHooks,
                        dateEnv: dateEnv,
                        viewSpecs: viewSpecs,
                        theme: theme,
                        toolbarConfig: toolbarConfig,
                        localeDefaults: localeDefaults,
                        availableRawLocales: availableLocaleData.map,
                    };
                };

                FullCalendar.CalendarDataManager.prototype._computeCurrentViewData = function (viewType, optionsData, optionOverrides, dynamicOptionOverrides) {
                    var viewSpec = optionsData.viewSpecs[viewType];
                    if (!viewSpec) {
                        throw new Error("viewType \"" + viewType + "\" is not available. Please make sure you've loaded all neccessary plugins");
                    }
                    var _a = this.processRawViewOptions(viewSpec, optionsData.pluginHooks, optionsData.localeDefaults, optionOverrides, dynamicOptionOverrides), refinedOptions = _a.refinedOptions, extra = _a.extra;
                    var dateProfileGenerator = this.buildDateProfileGenerator({
                        dateProfileGeneratorClass: viewSpec.optionDefaults.dateProfileGeneratorClass,
                        duration: viewSpec.duration,
                        durationUnit: viewSpec.durationUnit,
                        usesMinMaxTime: viewSpec.optionDefaults.usesMinMaxTime,
                        dateEnv: optionsData.dateEnv,
                        calendarApi: this.props.calendarApi,
                        slotMinTime: refinedOptions.slotMinTime,
                        slotMaxTime: refinedOptions.slotMaxTime,
                        showNonCurrentDates: refinedOptions.showNonCurrentDates,
                        dayCount: refinedOptions.dayCount,
                        dateAlignment: refinedOptions.dateAlignment,
                        dateIncrement: refinedOptions.dateIncrement,
                        hiddenDays: refinedOptions.hiddenDays,
                        weekends: refinedOptions.weekends,
                        nowInput: refinedOptions.now,
                        validRangeInput: refinedOptions.validRange,
                        visibleRangeInput: refinedOptions.visibleRange,
                        monthMode: refinedOptions.monthMode,
                        fixedWeekCount: refinedOptions.fixedWeekCount,
                    });
                    var viewApi = this.buildViewApi(viewType, this.getCurrentData, optionsData.dateEnv);
                    return { viewSpec: viewSpec, options: refinedOptions, dateProfileGenerator: dateProfileGenerator, viewApi: viewApi };
                };
            }

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.elID = elID;
            el.setAttribute('syn-options', JSON.stringify(setting));

            if (mod) {
                var hookEvents = el.getAttribute('syn-events') || [];
                if (hookEvents) {
                    hookEvents = eval(hookEvents);

                    for (var i = 0, length = hookEvents.length; i < length; i++) {
                        var hook = hookEvents[i];
                        var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                        if (eventHandler) {
                            setting[hook] = eventHandler;
                        }
                    }
                }
            }

            var calendar = new FullCalendar.Calendar(el, setting);
            calendar.render();

            $calendar.calendarControls.push({
                id: elID,
                calendar: calendar,
                setting: $object.clone(setting)
            });
        },

        getValue(elID, meta) {
            // 지원 안함. getterValue 를 이용하여 syn.uicontrols.$data 를 통해 가져올 것.
            return null;
        },

        setValue(elID, value, meta) {
            var control = $calendar.getControl(elID);
            if (!control || !value) {
                return;
            }

            var oldEventSource = control.calendar.getEventSourceById(elID + '_eventSource');
            if (oldEventSource) {
                oldEventSource.remove();
            }

            var mapping = control.setting.eventMapping;
            var newEvents = value.map(function (item) {
                var eventObj = {};
                var extendedProps = Object.assign({}, item);
                extendedProps.Flag = 'R';
                for (var key in mapping) {
                    var sourceKey = mapping[key];
                    if (item.hasOwnProperty(mapping[key]) == true) {
                        eventObj[key] = item[mapping[key]];
                        delete extendedProps[sourceKey];
                    }
                }

                eventObj.extendedProps = extendedProps;
                return eventObj;
            });

            control.calendar.addEventSource({
                id: elID + '_eventSource',
                events: newEvents
            });
        },

        getterValue(elID, meta) {
            var createEvents = syn.uicontrols.$calendar.findEvents(elID, {
                Flag: 'C'
            });

            var deleteEvents = syn.uicontrols.$calendar.findEvents(elID, {
                Flag: 'D'
            });

            var updateEvents = syn.uicontrols.$calendar.findEvents(elID, {
                Flag: 'U'
            });

            var allModifiedEvents = createEvents.concat(updateEvents, deleteEvents);
            var result = allModifiedEvents.map(function (event) {
                var flattenedEvent = {};
                var key;

                for (key in event) {
                    if (Object.prototype.hasOwnProperty.call(event, key)) {
                        flattenedEvent[key] = event[key];
                    }
                }

                if (flattenedEvent.extendedProps && typeof flattenedEvent.extendedProps === 'object') {
                    for (key in flattenedEvent.extendedProps) {
                        if (Object.prototype.hasOwnProperty.call(flattenedEvent.extendedProps, key)) {
                            flattenedEvent[key] = flattenedEvent.extendedProps[key];
                        }
                    }
                }

                delete flattenedEvent.extendedProps;
                return flattenedEvent;
            });

            return result;
        },

        addEvent(elID, eventData) {
            var control = $calendar.getControl(elID);
            if (!control || !eventData) {
                return;
            }

            var calendar = control.calendar;
            var mapping = control.setting.eventMapping;

            var eventObj = {};
            var extendedProps = Object.assign({}, eventData);
            extendedProps.Flag = 'C';

            for (var key in mapping) {
                var sourceKey = mapping[key];
                if (eventData.hasOwnProperty(sourceKey)) {
                    eventObj[key] = eventData[sourceKey];
                    delete extendedProps[sourceKey];
                }
            }

            eventObj.extendedProps = extendedProps;

            calendar.addEvent(eventObj);
        },

        removeEvent(elID, eventID) {
            var calendar = this.getCalendar(elID);
            if (!calendar) {
                return;
            }

            var event = calendar.getEventById(eventID);
            if (event) {
                if (event.extendedProps && event.extendedProps.Flag === 'C') {
                    event.remove();
                }
                else {
                    event.setExtendedProp('Flag', 'D');
                    event.setProp('display', 'none');
                }
            }
        },

        updateEvent(elID, eventData) {
            var control = this.getControl(elID);
            if (!control || !eventData) {
                return;
            }

            var calendar = control.calendar;
            var mapping = control.setting.eventMapping;
            var idKey = mapping.id;

            if (!eventData.hasOwnProperty(idKey)) {
                return;
            }

            var eventID = eventData[idKey];
            var event = calendar.getEventById(eventID);

            if (!event) {
                return;
            }

            var propsToUpdate = {};
            var extendedProps = Object.assign({}, eventData);
            if (extendedProps.Flag === 'R') {
                extendedProps.Flag = 'U';
            }

            for (var key in mapping) {
                var sourceKey = mapping[key];
                if (eventData.hasOwnProperty(sourceKey)) {
                    propsToUpdate[key] = eventData[sourceKey];
                    delete extendedProps[sourceKey];
                }
            }
            propsToUpdate.extendedProps = extendedProps;

            event.setProps(propsToUpdate);
        },

        getEvents(elID) {
            let result = null;
            var control = $calendar.getControl(elID);
            if (control) {
                result = control.calendar.getEvents().map(function (evt) { return evt.toPlainObject(); });
            }
            return result;
        },

        findEvents(elID, filter) {
            var calendar = this.getCalendar(elID);
            if (!calendar) {
                return [];
            }

            var allEvents = calendar.getEvents();

            if (!filter || Object.keys(filter).length === 0) {
                return allEvents.map(event => event.toPlainObject());
            }

            var filteredEvents = allEvents.filter(function (event) {
                for (var key in filter) {
                    if (filter.hasOwnProperty(key)) {
                        var filterValue = filter[key];
                        var eventValue;

                        if (key === 'title') {
                            eventValue = event.title;
                        }
                        else {
                            eventValue = event.extendedProps[key];
                        }

                        if (eventValue === undefined || eventValue === null) {
                            return false;
                        }

                        if (typeof eventValue === 'string' && typeof filterValue === 'string') {
                            if (eventValue.toLowerCase().indexOf(filterValue.toLowerCase()) === -1) {
                                return false;
                            }
                        }
                        else {
                            if (eventValue !== filterValue) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            });

            return filteredEvents.map(event => event.toPlainObject());
        },

        clear(elID, isControlLoad) {
            var control = $calendar.getControl(elID);
            if (control) {
                control.calendar.removeAllEvents();
            }
        },

        getControl(elID) {
            return $calendar.calendarControls.find(item => item.id === elID) || null;
        },

        getCalendar(elID) {
            var control = this.getControl(elID);
            return control ? control.calendar : null;
        },

        gotoDate(elID, date) {
            var calendar = this.getCalendar(elID);
            if (calendar) {
                calendar.gotoDate(date);
            }
        },

        changeView(elID, viewName, dateOrRange) {
            var calendar = this.getCalendar(elID);
            if (calendar) {
                calendar.changeView(viewName, dateOrRange);
            }
        },

        refetchEvents(elID) {
            var calendar = this.getCalendar(elID);
            if (calendar) {
                calendar.refetchEvents();
            }
        }
    });
    syn.uicontrols.$calendar = $calendar;
})(window);
