/// <reference path="/assets/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $contextmenu = syn.uicontrols.$contextmenu || new syn.module();

    $contextmenu.extend({
        name: 'syn.uicontrols.$contextmenu',
        version: '1.0.0',
        menuControls: [],
        eventHooks: [
            'close',
            'create',
            'beforeOpen',
            'open',
            'select'
        ],
        defaultSetting: {
            target: 'targetCSSSelector',
            delegate: 'delegateCSSSelector',
            autoFocus: true,
            closeOnWindowBlur: true,
            hide: false,
            show: false,
            menu: [
                // uiIcon: https://api.jqueryui.com/theming/icons/
                { title: 'Cut', cmd: 'cut' },
                { title: 'Copy', cmd: 'copy', uiIcon: 'ui-icon-copy' },
                { title: '---' },
                {
                    title: 'More', children: [
                        { title: 'Sub 1', cmd: 'sub1' },
                        { title: 'Sub 2', cmd: 'sub1' }
                    ]
                }
            ],
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);
            setting = syn.$w.argumentsExtend($contextmenu.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var hookEvents = el.getAttribute('syn-events');
            try {
                if (hookEvents) {
                    hookEvents = eval(hookEvents);
                }
            } catch (error) {
                syn.$l.eventLog('ContextMenu_controlLoad', error.toString(), 'Debug');
            }

            for (var i = 0; i < hookEvents.length; i++) {
                var hookEvent = hookEvents[i];
                if ($contextmenu.eventHooks.indexOf(hookEvent) > -1) {
                    if ($object.isNullOrUndefined(setting[hookEvent]) == true) {
                        setting[hookEvent] = function (evt, ui) {
                            var eventName = $contextmenu.eventHooks.find(function (item) { return item.toLowerCase() == evt.type.replace('contextmenu', '') });
                            var mod = window[syn.$w.pageScript];
                            if (mod) {
                                var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, eventName)] : null;
                                if (eventHandler) {
                                    eventHandler.apply(syn.$l.get(elID), [evt, ui]);
                                }
                            }
                        }
                    }
                }
            }

            $contextmenu.menuControls.push({
                id: elID,
                context: $(setting.target).contextmenu(setting),
                config: setting
            });
        },

        getValue(elID, meta) {
            // 지원 안함
            return null;
        },

        setValue(elID, value, meta) {
            // 지원 안함
        },

        clear(elID, isControlLoad) {
            // 지원 안함
        },

        getControl(elID) {
            var result = null;
            var length = $contextmenu.menuControls.length;
            for (var i = 0; i < length; i++) {
                var item = $contextmenu.menuControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        close(elID) {
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                context.contextmenu('close');
            }
        },

        enableEntry(elID, cmd, flag) {
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                context.contextmenu('enableEntry', cmd, flag);
            }
        },

        getEntry(elID, cmd) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('getEntry', cmd);
            }

            return result;
        },

        setEntry(elID, cmd, data) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('setEntry', cmd, data);
            }

            return result;
        },

        updateEntry(elID, cmd, data) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('updateEntry', cmd, data);
            }

            return result;
        },

        showEntry(elID, cmd, flag) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('showEntry', cmd, flag);
            }

            return result;
        },

        getEntryWrapper(elID, cmd) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('getEntryWrapper', cmd);
            }

            return result;
        },

        getMenu(elID) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('getMenu');
            }

            return result;
        },

        isOpen(elID) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('isOpen');
            }

            return result;
        },

        open(elID, targetOrEvent, extraData) {
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                context.contextmenu('open', targetOrEvent, extraData);
            }
        },

        setIcon(elID, cmd, icon) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('setIcon', cmd, icon);
            }

            return result;
        },

        setTitle(elID, cmd, title) {
            var result = null;
            var context = $contextmenu.getControl(elID).context;
            if (context) {
                result = context.contextmenu('setTitle', cmd, title);
            }

            return result;
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$contextmenu = $contextmenu;
})(window);