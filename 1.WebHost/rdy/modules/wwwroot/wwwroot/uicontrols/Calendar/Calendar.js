/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $calendar = syn.uicontrols.$calendar || new syn.module();

    $calendar.extend({
        name: 'syn.uicontrols.$calendar',
        version: 'v2025.12.26',
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

        addModuleList: function (el, moduleList, setting, controlType) {
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

        controlLoad: function (elID, setting) {
            var el = syn.$l.get(elID);
            setting = syn.$w.argumentsExtend($calendar.defaultSetting, setting);

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
                    try {
                        if (typeof hookEvents === 'string' && hookEvents.indexOf('[') === 0) {
                            hookEvents = eval(hookEvents);
                        }
                    } catch (e) {
                        console.error('Event parsing error:', e);
                        hookEvents = [];
                    }

                    if (Array.isArray(hookEvents)) {
                        for (var i = 0, length = hookEvents.length; i < length; i++) {
                            var hook = hookEvents[i];
                            var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                            if (eventHandler) {
                                setting[hook] = eventHandler;
                            }
                        }
                    }
                }
            }

            const customProperties = [
                'elID',
                'eventMapping',
                'getter',
                'setter',
                'transactConfig',
                'triggerConfig'
            ];

            const calendarSettings = {};
            Object.keys(setting).forEach(key => {
                if (customProperties.includes(key) == false) {
                    calendarSettings[key] = setting[key];
                }
            });

            var calendar = new FullCalendar.Calendar(el, calendarSettings);
            calendar.render();

            $calendar.calendarControls.push({
                id: elID,
                calendar: calendar,
                setting: $object.clone(setting)
            });
        },

        getValue: function (elID, meta) {
            return null;
        },

        setValue: function (elID, value, meta) {
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
                    if (item.hasOwnProperty(sourceKey)) {
                        eventObj[key] = item[sourceKey];
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

        getterValue: function (elID, meta) {
            var createEvents = syn.uicontrols.$calendar.findEvents(elID, { Flag: 'C' });
            var deleteEvents = syn.uicontrols.$calendar.findEvents(elID, { Flag: 'D' });
            var updateEvents = syn.uicontrols.$calendar.findEvents(elID, { Flag: 'U' });

            var allModifiedEvents = createEvents.concat(updateEvents, deleteEvents);

            var result = allModifiedEvents.map(function (event) {
                var flattenedEvent = {};
                var key;

                for (key in event) {
                    if (Object.prototype.hasOwnProperty.call(event, key) && key !== 'extendedProps' && key !== 'source') {
                        flattenedEvent[key] = event[key];
                    }
                }

                if (event.extendedProps && typeof event.extendedProps === 'object') {
                    for (key in event.extendedProps) {
                        if (Object.prototype.hasOwnProperty.call(event.extendedProps, key)) {
                            flattenedEvent[key] = event.extendedProps[key];
                        }
                    }
                }

                return flattenedEvent;
            });

            return result;
        },

        addEvent: function (elID, eventData) {
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

        removeEvent: function (elID, eventID) {
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

        updateEvent: function (elID, eventData) {
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

            var currentFlag = event.extendedProps ? event.extendedProps.Flag : 'R';
            if (currentFlag === 'R') {
                event.setExtendedProp('Flag', 'U');
            }

            for (var key in mapping) {
                var sourceKey = mapping[key];
                if (eventData.hasOwnProperty(sourceKey)) {
                    var newVal = eventData[sourceKey];

                    if (key !== 'id') {
                        event.setProp(key, newVal);
                    }
                }
            }

            for (var propKey in eventData) {
                if (eventData.hasOwnProperty(propKey)) {
                    var isMapped = false;
                    for (var mapKey in mapping) {
                        if (mapping[mapKey] === propKey) {
                            isMapped = true;
                            break;
                        }
                    }

                    if (!isMapped) {
                        event.setExtendedProp(propKey, eventData[propKey]);
                    }
                }
            }
        },

        getEvents: function (elID) {
            var result = null;
            var control = $calendar.getControl(elID);
            if (control) {
                result = control.calendar.getEvents().map(function (evt) {
                    return evt.toPlainObject();
                });
            }
            return result;
        },

        findEvents: function (elID, filter) {
            var calendar = this.getCalendar(elID);
            if (!calendar) {
                return [];
            }

            var allEvents = calendar.getEvents();

            if (!filter || Object.keys(filter).length === 0) {
                return allEvents.map(function (e) { return e.toPlainObject(); });
            }

            var filteredEvents = allEvents.filter(function (event) {
                for (var key in filter) {
                    if (filter.hasOwnProperty(key)) {
                        var filterValue = filter[key];
                        var eventValue;

                        if (key === 'title' || key === 'id' || key === 'start' || key === 'end') {
                            eventValue = event[key];
                        }
                        else {
                            eventValue = event.extendedProps ? event.extendedProps[key] : undefined;
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
                            if (eventValue != filterValue) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            });

            return filteredEvents.map(function (e) { return e.toPlainObject(); });
        },

        clear: function (elID, isControlLoad) {
            var control = $calendar.getControl(elID);
            if (control) {
                control.calendar.removeAllEvents();
            }
        },

        getControl: function (elID) {
            return $calendar.calendarControls.find(function (item) { return item.id === elID; }) || null;
        },

        getCalendar: function (elID) {
            var control = this.getControl(elID);
            return control ? control.calendar : null;
        },

        gotoDate: function (elID, date) {
            var calendar = this.getCalendar(elID);
            if (calendar) {
                calendar.gotoDate(date);
            }
        },

        changeView: function (elID, viewName, dateOrRange) {
            var calendar = this.getCalendar(elID);
            if (calendar) {
                calendar.changeView(viewName, dateOrRange);
            }
        },

        refetchEvents: function (elID) {
            var calendar = this.getCalendar(elID);
            if (calendar) {
                calendar.refetchEvents();
            }
        }
    });

    syn.uicontrols.$calendar = $calendar;
})(window);
