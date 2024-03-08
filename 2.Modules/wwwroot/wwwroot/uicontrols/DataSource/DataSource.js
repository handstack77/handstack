/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $data = syn.uicontrols.$data || new syn.module();

    $data.extend({
        name: 'syn.uicontrols.$data',
        version: '1.0.0',
        bindingList: [],
        storeList: [],

        propertyEvent: true,
        defaultSetting: {
            dataSourceID: '',
            storeType: 'Form',
            dataItems: [],
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
            setting = syn.$w.argumentsExtend($data.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            $this.store[setting.dataSourceID] = setting.storeType == 'Form' ? {} : [];
            $data.storeList.push({
                id: elID,
                dataSourceID: setting.dataSourceID,
                storeType: setting.storeType,
                columns: setting.columns
            });
        },

        getValue(elID, meta) {
            var result = null;
            $data.propertyEvent = false;
            var metaStore = $data.getMetaStore(elID);
            if (metaStore) {
                result = $this.store[metaStore.dataSourceID];
            }
            $data.propertyEvent = true;

            return result;
        },

        setValue(elID, value, meta) {
            // 지원 안함
        },

        clear(elID, isControlLoad) {
            // 지원 안함
        },

        getMetaStore(elID) {
            var result = null;
            var length = $data.storeList.length;
            for (var i = 0; i < length; i++) {
                var item = $data.storeList[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        reactionGetValue(elID, dataSourceID, dataFieldID) {
            var result = null;
            var bindingInfo = $data.bindingList.find(function (item) {
                return (item.elID == elID && item.dataSourceID == dataSourceID && item.dataFieldID == dataFieldID);
            });

            if (bindingInfo) {
                var storeInfo = $data.storeList.find(function (item) {
                    return (item.dataSourceID == bindingInfo.dataSourceID);
                });

                if (bindingInfo.controlType == 'grid' || bindingInfo.controlType == 'list' || bindingInfo.controlType == 'chart') {
                    var metaItems = {};
                    var length = storeInfo.columns.length;
                    for (var i = 0; i < length; i++) {
                        var metaItem = storeInfo.columns[i];

                        metaItems[metaItem.data] = {
                            fieldID: metaItem.data,
                            dataType: metaItem.dataType
                        };
                    }

                    var getType = storeInfo.storeType == 'Form' ? 'Row' : 'List';
                    result = bindingInfo.controlModule.getValue(elID, getType, metaItems);
                }
                else {
                    result = bindingInfo.controlModule.getValue(elID);
                }
            }

            return result;
        },

        reactionSetValue(elID, dataSourceID, dataFieldID, value) {
            var bindingInfo = $data.bindingList.find(function (item) {
                return (item.elID == elID && item.dataSourceID == dataSourceID && item.dataFieldID == dataFieldID);
            });

            if (bindingInfo) {
                var storeInfo = $data.storeList.find(function (item) {
                    return (item.dataSourceID == bindingInfo.dataSourceID);
                });

                if (bindingInfo.controlType == 'grid' || bindingInfo.controlType == 'list' || bindingInfo.controlType == 'chart') {
                    var metaItems = {};
                    var length = storeInfo.columns.length;
                    for (var i = 0; i < length; i++) {
                        var metaItem = storeInfo.columns[i];

                        metaItems[metaItem.data] = {
                            fieldID: metaItem.data,
                            dataType: metaItem.dataType
                        };
                    }

                    bindingInfo.controlModule.setValue(elID, value, metaItems);
                }
                else {
                    bindingInfo.controlModule.setValue(elID, value);
                }
            }
        },

        bindingSource(elID, dataSourceID) {
            var dataSource = $this.store[dataSourceID];
            var el = syn.$l.get(elID + '_hidden') || syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var tagName = el.tagName.toUpperCase();
                var controlModule = null;
                var controlType = null;

                if (tagName.indexOf('SYN_') > -1) {
                    var moduleName = tagName.substring(4).toLowerCase();
                    controlModule = syn.uicontrols['$' + moduleName];
                    controlType = moduleName;
                }
                else {
                    switch (tagName) {
                        case 'BUTTON':
                            controlModule = syn.uicontrols.$button;
                            controlType = 'button';
                            break;
                        case 'INPUT':
                            controlType = el.getAttribute('type').toLowerCase();
                            switch (controlType) {
                                case 'hidden':
                                case 'text':
                                case 'password':
                                case 'color':
                                case 'email':
                                case 'number':
                                case 'search':
                                case 'tel':
                                case 'url':
                                    controlModule = syn.uicontrols.$textbox;
                                    break;
                                case 'submit':
                                case 'reset':
                                case 'button':
                                    controlModule = syn.uicontrols.$button;
                                    break;
                                case 'radio':
                                    controlModule = syn.uicontrols.$radio;
                                    break;
                                case 'checkbox':
                                    controlModule = syn.uicontrols.$checkbox;
                                    break;
                            }
                            break;
                        case 'TEXTAREA':
                            controlModule = syn.uicontrols.$textarea;
                            controlType = 'textarea';
                            break;
                        case 'SELECT':
                            if (el.getAttribute('multiple') == null) {
                                controlModule = syn.uicontrols.$select;
                                controlType = 'select';
                            }
                            else {
                                controlModule = syn.uicontrols.$multiselect;
                                controlType = 'multiselect';
                            }
                            break;
                        default:
                            break;
                    }
                }

                var dataFieldID = el.getAttribute('syn-datafield');
                if (dataFieldID) {
                    var binding = null;

                    if (controlType == 'grid' || controlType == 'list' || controlType == 'chart') {
                        binding = $data.bindingList.find(function (item) {
                            return (item.dataSourceID == dataSourceID);
                        });
                    }
                    else {
                        binding = $data.bindingList.find(function (item) {
                            return (item.elID == elID && item.dataSourceID == dataSourceID && item.dataFieldID == dataFieldID);
                        });
                    }

                    if (binding == null) {
                        $data.bindingList.push({
                            elID: elID,
                            dataSourceID: dataSourceID,
                            dataFieldID: dataFieldID,
                            controlModule: controlModule,
                            controlType: controlType
                        });

                        Object.defineProperty(dataSource, dataFieldID, {
                            get() {
                                if ($data.propertyEvent == true) {
                                    return $data.reactionGetValue(elID, dataSourceID, dataFieldID);
                                }
                            },
                            set(value) {
                                if ($data.propertyEvent == true) {
                                    $data.reactionSetValue(elID, dataSourceID, dataFieldID, value);
                                }
                            },
                            configurable: true,
                            enumerable: true
                        });
                    }
                    else {
                        syn.$l.eventLog('$data.bindingSource', 'binding 정보 확인 필요 - elID: {0}, dataSourceID: {1}, dataFieldID: {2}, controlType: {3}, '.format(elID, dataSourceID, dataFieldID, controlType), 'Warning');
                    }
                }
                else {
                    syn.$l.eventLog('$data.bindingSource', 'dataFieldID 확인 필요', 'Warning');
                }
            }
            else {
                syn.$l.eventLog('$data.bindingSource', '"{0}" elID 확인 필요'.format(elID), 'Warning');
            }
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$data = $data;
})(window);
