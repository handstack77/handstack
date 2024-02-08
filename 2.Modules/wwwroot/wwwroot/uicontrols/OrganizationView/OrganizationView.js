/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $organization = syn.uicontrols.$organization || new syn.module();

    $organization.extend({
        name: 'syn.uicontrols.$organization',
        version: '1.0',
        organizationControls: [],
        eventHooks: [
            'nodedrop',
            'select',
            'click'
        ],
        defaultSetting: {
            width: '100%',
            height: '300px',
            itemID: 'id',
            parentItemID: 'parentID',
            childrenID: 'children',
            reduceMap: {
                key: 'id',
                title: 'title',
                parentID: 'parentID',
            },
            nodeTitle: 'name',
            nodeContent: 'title',
            direction: 't2b',
            pan: false,
            zoom: false,
            zoominLimit: 2,
            zoomoutLimit: 0.8,
            draggable: false,
            className: 'top-level',
            verticalLevel: 4,
            nodeTemplate: null, // $this.elID_nodeTemplate: function (data) {}
            createNode: null, // $this.elID_createNode: function ($node, data) {}
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
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
            setting = syn.$w.argumentsExtend($organization.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;

            el.setAttribute('id', elID + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            if (setting.nodeTemplate != null && $object.isString(setting.nodeTemplate) == true) {
                setting.nodeTemplate = eval(setting.nodeTemplate);
            }

            if (setting.createNode != null && $object.isString(setting.createNode) == true) {
                setting.createNode = eval(setting.createNode);
            }

            var hookEvents = el.getAttribute('syn-events');
            try {
                if (hookEvents) {
                    hookEvents = eval(hookEvents);
                }
            } catch (error) {
                syn.$l.eventLog('OrganizationView_controlLoad', error.toString(), 'Debug');
            }

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.style.width = setting.width;
            wrapper.style.height = setting.height;
            wrapper.className = 'organization-container';
            wrapper.innerHTML = '<div id="' + elID + '"></div>';
            parent.appendChild(wrapper);

            setting.data = {};
            var orgchart = $('#' + elID).orgchart(setting);

            for (var i = 0; i < hookEvents.length; i++) {
                var hookEvent = hookEvents[i];
                if ($organization.eventHooks.indexOf(hookEvent) > -1) {
                    if ($object.isNullOrUndefined(setting[hookEvent]) == true) {
                        switch (hookEvent) {
                            case 'nodedrop':
                                setting[hookEvent] = function (evt, params) {
                                    var mod = window[syn.$w.pageScript];
                                    if (mod) {
                                        var eventHandler = mod.event['{0}_{1}'.format(elID, 'nodedrop')];
                                        if (eventHandler) {
                                            eventHandler.apply(syn.$l.get(elID), [evt, params]);
                                        }
                                    }
                                }

                                orgchart.$chart.on('nodedrop.orgchart', setting[hookEvent]);
                                break;
                            case 'select':
                                setting[hookEvent] = function (evt) {
                                    var mod = window[syn.$w.pageScript];
                                    if (mod) {
                                        var that = $(this);
                                        var eventHandler = mod.event['{0}_{1}'.format(elID, 'select')];
                                        if (eventHandler) {
                                            eventHandler.apply(syn.$l.get(elID), [evt, that]);
                                        }
                                    }
                                }

                                orgchart.$chartContainer.on('click', '.node', setting[hookEvent]);
                                break;
                            case 'click':
                                setting[hookEvent] = function (evt) {
                                    var mod = window[syn.$w.pageScript];
                                    if (mod) {
                                        var eventHandler = mod.event['{0}_{1}'.format(elID, 'click')];
                                        if (eventHandler) {
                                            eventHandler.apply(syn.$l.get(elID), [evt, $(evt.target).closest('.node').length]);
                                        }
                                    }
                                }

                                orgchart.$chartContainer.on('click', '.orgchart', setting[hookEvent]);
                                break;
                        }
                    }
                }
            }

            $organization.organizationControls.push({
                id: elID,
                orgchart: orgchart,
                config: setting
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue: function (elID, meta) {
            var result = null;
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart) {
                var setting = $organization.getControl(elID).config;
                var map = setting.reduceMap;
                var jsonRoot = orgchart.getHierarchy();
                var flatValue = syn.$l.nested2Flat(jsonRoot, setting.itemID, setting.parentItemID, setting.childrenID);

                var reduceSource = [];
                var length = flatValue.length;
                for (var i = 0; i < length; i++) {
                    var item = flatValue[i];

                    var dataItem = item.data;
                    if (dataItem) {
                        dataItem[map.key] = item.key;
                        dataItem[map.title] = item.title;
                        dataItem[map.parentID] = item.parentID;
                        reduceSource.push(dataItem);
                    }
                }

                result = reduceSource;
            }
            return result;
        },

        setValue: function (elID, value, meta) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart) {
                var setting = $organization.getControl(elID).config;
                var map = setting.reduceMap;
                var reduceSource = [];
                var length = value.length;
                for (var i = 0; i < length; i++) {
                    var item = value[i];

                    reduceSource.push({
                        id: item[map.key],
                        key: item[map.key],
                        title: item[map.title],
                        parentID: item[map.parentID],
                        data: $object.clone(item, false)
                    });
                }

                var nestedValue = syn.$l.flat2Nested(reduceSource, setting.itemID, setting.parentItemID, setting.childrenID);
                orgchart.init({ data: nestedValue });

                var nodedropFunc = setting['nodedrop'];
                if (nodedropFunc) {
                    orgchart.$chart.on('nodedrop.orgchart', nodedropFunc);
                }
            }
        },

        clear: function (elID, isControlLoad) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart) {
                orgchart.init({ data: null });
            }
        },

        getControl: function (elID) {
            var result = null;
            var length = $organization.organizationControls.length;
            for (var i = 0; i < length; i++) {
                var item = $organization.organizationControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        init: function (elID, newOptions) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart) {
                orgchart.init(newOptions);
            }
        },

        addParent: function (elID, data) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart) {
                orgchart.addParent($('#' + elID).find('.node:first'), data);
            }
        },

        addSiblings: function (elID, node, data) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.addSiblings(node, data);
            }
        },

        addChildren: function (elID, node, data) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.addChildren(node, data);
            }
        },

        removeNodes: function (elID, node) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.removeNodes(node);
            }
        },

        getHierarchy: function (elID, includeNodeData) {
            var result = null;
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart) {
                if ($object.isNullOrUndefined(includeNodeData) == true) {
                    includeNodeData = false;
                }

                result = orgchart.getHierarchy(includeNodeData);
            }

            return result;
        },

        hideParent: function (elID, node) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.hideParent(node);
            }
        },

        showParent: function (elID, node) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.showParent(node);
            }
        },

        showChildren: function (elID, node) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.showChildren(node);
            }
        },

        hideSiblings: function (elID, node, direction) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.hideSiblings(node, direction);
            }
        },

        showSiblings: function (elID, node, direction) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.showSiblings(node, direction);
            }
        },

        getNodeState: function (elID, node, relation) {
            var result = null;
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                if ($object.isNullOrUndefined(relation) == true) {
                    relation = 'children'; // "parent", "children", "siblings"
                }

                result = orgchart.getNodeState(node, relation);
            }

            return result;
        },

        getRelatedNodes: function (elID, node, relation) {
            var result = null;
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                if ($object.isNullOrUndefined(relation) == true) {
                    relation = 'children'; // "parent", "children", "siblings"
                }

                result = orgchart.getRelatedNodes(node, relation);
            }
            return result;
        },

        setChartScale: function (elID, node, newScale) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart && node) {
                orgchart.setChartScale(node, newScale);
            }
        },

        export: function (elID, fileName, fileExtension) {
            var orgchart = $organization.getControl(elID).orgchart;
            if (orgchart) {
                if ($object.isNullOrUndefined(fileName) == true) {
                    fileName = syn.$l.random();
                }

                orgchart.export(fileName, fileExtension);
            }
        },

        setLocale: function (elID, translations, control, options) {
        }
    });
    syn.uicontrols.$organization = $organization;
})(window);
