/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $tree = syn.uicontrols.$tree || new syn.module();

    $tree.extend({
        name: 'syn.uicontrols.$tree',
        version: '1.0.0',
        treeControls: [],
        eventHooks: [
            'blurTree',
            'focusTree',
            'activate',
            'beforeActivate',
            'beforeExpand',
            'beforeSelect',
            'blur',
            'click',
            'collapse',
            'createNode',
            'dblclick',
            'expand',
            'focus',
            'keydown',
            'keypress'
        ],
        defaultSetting: {
            width: '100%',
            height: '300px',
            itemID: 'id',
            parentItemID: 'parentID',
            childrenID: 'children',
            reduceMap: {
                key: 'key',
                title: 'title',
                parentID: 'parentID',
                folder: 'folder',
                icon: false
            },
            toggleEffect: false,
            checkbox: false,
            extensions: ['persist', 'filter'], // https://github.com/mar10/fancytree/wiki/ExtensionIndex
            persist: {
                expandLazy: false,
                expandOpts: {
                    noAnimation: false,
                    noEvents: false
                },
                overrideSource: true,
                store: 'session',
                types: 'active expanded focus selected'
            },
            multi: {
                mode: 'sameParent'
            },
            filter: {
                counter: false,
                mode: 'hide'
            },
            source: [],
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

            $tree.defaultSetting.persist = false;
            $tree.defaultSetting.multi = false;

            setting = syn.$w.argumentsExtend($tree.defaultSetting, setting);

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

            var hookEvents = el.getAttribute('syn-events');
            try {
                if (hookEvents) {
                    hookEvents = eval(hookEvents);
                }
            } catch (error) {
                syn.$l.eventLog('TreeView_controlLoad', error.toString(), 'Debug');
            }

            for (var i = 0; i < hookEvents.length; i++) {
                var hookEvent = hookEvents[i];
                if ($tree.eventHooks.indexOf(hookEvent) > -1) {
                    if ($object.isNullOrUndefined(setting[hookEvent]) == true) {
                        setting[hookEvent] = function (evt, data) {
                            var eventName = $tree.eventHooks.find(function (item) { return item.toLowerCase() == evt.type.replace('fancytree', '') });
                            var mod = window[syn.$w.pageScript];
                            if (mod) {
                                var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, eventName)] : null;
                                if (eventHandler) {
                                    eventHandler.apply(syn.$l.get(elID), [evt, data]);
                                }
                            }
                        }
                    }
                }
            }

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.style.width = setting.width;
            wrapper.style.height = setting.height;
            wrapper.className = 'tree-container border';
            wrapper.innerHTML = '<div id="' + elID + '"></div>';
            parent.appendChild(wrapper);

            $tree.treeControls.push({
                id: elID,
                element: $('#' + elID).fancytree(setting),
                tree: $.ui.fancytree.getTree('#' + elID),
                config: setting
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue(elID, meta) {
            var result = null;
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                var setting = $tree.getControl(elID).config;
                var map = setting.reduceMap;
                var jsonRoot = tree.toDict(true);
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
                        dataItem[map.folder] = item.folder;
                        reduceSource.push(dataItem);
                    }
                }

                result = reduceSource;
            }
            return result;
        },

        setValue(elID, value, meta) {
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                var setting = $tree.getControl(elID).config;
                var map = setting.reduceMap;
                var reduceSource = [];
                var length = value.length;
                for (var i = 0; i < length; i++) {
                    var item = value[i];

                    reduceSource.push({
                        key: item[map.key],
                        title: item[map.title],
                        parentID: item[map.parentID],
                        folder: $string.toBoolean(item[map.folder]),
                        icon: false,
                        data: $object.clone(item, false)
                    });
                }

                var nestedValue = syn.$l.flat2Nested(reduceSource, setting.itemID, setting.parentItemID, setting.childrenID);
                tree.reload([nestedValue]);
            }
        },

        clear(elID, isControlLoad) {
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                tree.reload([]);
            }
        },

        getControl(elID) {
            var result = null;
            var length = $tree.treeControls.length;
            for (var i = 0; i < length; i++) {
                var item = $tree.treeControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        getActiveNode(elID) {
            var result = null;
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                result = tree.getActiveNode();
            }

            return result;
        },

        toogleEnabled(elID) {
            var result = false;
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                result = !tree.options.disabled;
                tree.enable(!result);
            }

            return result;
        },

        getRootNodeID(elID) {
            var result = null;
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                result = tree.rootNode.key.replace('root_', '');
            }

            return result;
        },

        activateKey(elID, key) {
            if ($object.isNullOrUndefined(key) == true) {
                return;
            }

            var tree = $tree.getControl(elID).tree;
            if (tree) {
                tree.activateKey(key);
            }
        },

        expendLevel(elID, level) {
            if ($object.isNullOrUndefined(level) == true) {
                level = 1;
            }

            var tree = $tree.getControl(elID).tree;
            if (tree) {
                tree.visit(function (node) {
                    if (node.getLevel() < level) {
                        node.setExpanded(true);
                    }
                });
            }
        },

        collapseLevel(elID, level) {
            if ($object.isNullOrUndefined(level) == true) {
                level = 1;
            }

            var tree = $tree.getControl(elID).tree;
            if (tree) {
                tree.visit(function (node) {
                    if (node.getLevel() < level) {
                        node.setExpanded(false);
                    }
                });
            }
        },

        expandAll(elID) {
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                tree.expandAll();
            }
        },

        collapseAll(elID) {
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                tree.expandAll(false);
            }
        },

        getSelectedNodes(elID) {
            var result = [];
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                result = tree.getSelectedNodes();
            }

            return result;
        },

        filterNodes(elID, filter) {
            var result = [];
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                tree.filterNodes(filter, { autoExpand: true });
            }

            return result;
        },

        filterBranches(elID, filter) {
            var result = [];
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                tree.filterBranches(filter, { autoExpand: true, leavesOnly: true });
            }

            return result;
        },

        clearFilter(elID) {
            var result = [];
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                result = tree.clearFilter();
            }

            return result;
        },

        setSelectedAll(elID, node) {
            var result = [];
            var tree = $tree.getControl(elID).tree;
            if (tree) {
                var isSelected = node.isSelected();
                node.visit(function (childNode) {
                    childNode.setSelected(isSelected);
                });
            }

            return result;
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$tree = $tree;
})(window);
