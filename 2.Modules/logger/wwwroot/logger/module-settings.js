'use strict';
let $module_settings = {
    prop: {
        defaultConfig: {
            "ModuleID": "logger",
            "Name": "logger",
            "IsBundledWithHost": false,
            "Version": "1.0.0",
            "ModuleConfig": {
                "SystemID": "HANDSTACK",
                "IsSQLiteCreateOnNotSettingRequest": true,
                "LogDeleteRepeatSecond": 43200,
                "ModuleBasePath": "../modules/logger",
                "BusinessServerUrl": "http://localhost:8000/transact/api/transaction/execute",
                "EventAction": [],
                "SubscribeAction": [],
                "DataSource": [
                    {
                        "ApplicationID": "HDS",
                        "TableName": "TransactLog",
                        "DataProvider": "SQLite",
                        "RemovePeriod": -30,
                        "ConnectionString": "URI=file:../sqlite/HDS/logger/transact.db;Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;",
                        "IsEncryption": "N"
                    }
                ]
            }
        },
        moduleConfig: null
    },

    hook: {
        pageLoad() {
            $this.prop.defaultConfig.ModuleConfig.ManagedAccessKey = syn.$l.random(32);
            $this.prop.defaultConfig.ModuleConfig.EncryptionAES256Key = syn.$l.random(16);

            $this.prop.moduleConfig = $object.clone($this.prop.defaultConfig, true);

            syn.$l.addLive('[name="btnActionEdit"]', 'click', $this.event.btnActionEdit_click);
            syn.$l.addLive('[name="btnActionDelete"]', 'click', $this.event.btnActionDelete_click);

            $this.event.btnImportDefaultConfig_click();
            $this.event.btnApplyConfig_click();

            $this.method.sectionRender('MediatorAction');
            $this.method.sectionRender('LoadPassAssemblyPath');
        }
    },

    event: {
        btnImportDefaultConfig_click() {
            syn.$l.get('txtJsonView').value = JSON.stringify($this.prop.defaultConfig, null, 4);
        },

        btnApplyConfig_click() {
            try {
                var jsonConfig = JSON.parse(syn.$l.get('txtJsonView').value);
                $this.prop.moduleConfig = syn.$w.argumentsExtend($this.prop.defaultConfig, jsonConfig);

                syn.$l.get('txtModuleID').value = $this.prop.moduleConfig.ModuleID;
                syn.$l.get('txtName').value = $this.prop.moduleConfig.Name;
                syn.$l.get('chkIsBundledWithHost').checked = $string.toBoolean($this.prop.moduleConfig.IsBundledWithHost);
                syn.$l.get('txtVersion').value = $this.prop.moduleConfig.Version;

                syn.$l.get('txtSystemID').value = $this.prop.moduleConfig.ModuleConfig.SystemID;
                syn.$l.get('txtBusinessServerUrl').value = $this.prop.moduleConfig.ModuleConfig.BusinessServerUrl;
                syn.$l.get('txtModuleConfigurationUrl').value = $this.prop.moduleConfig.ModuleConfig.ModuleConfigurationUrl;
                syn.$l.get('txtModuleLogFilePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath;
                syn.$l.get('txtModuleBasePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleBasePath;
                syn.$l.get('txtWWWRootBasePath').value = $this.prop.moduleConfig.ModuleConfig.WWWRootBasePath;
                syn.$l.get('txtIndexingBasePath').value = $this.prop.moduleConfig.ModuleConfig.IndexingBasePath;
                syn.$l.get('txtConnectionString').value = $this.prop.moduleConfig.ModuleConfig.ConnectionString;
            } catch (error) {
                syn.$w.notify('error', `JSON을 적용하지 못했습니다. ${error.message}`);
                syn.$l.eventLog('$this.event.btnApplyConfig_click', error.stack, 'Error');
            }
        },

        btnJsonView_click() {
            if ($object.isNullOrUndefined($this.prop.moduleConfig) == false) {
                try {
                    $this.prop.moduleConfig.ModuleID = syn.$l.get('txtModuleID').value;
                    $this.prop.moduleConfig.Name = syn.$l.get('txtName').value;
                    $this.prop.moduleConfig.IsBundledWithHost = $string.toBoolean(syn.$l.get('chkIsBundledWithHost').checked);
                    $this.prop.moduleConfig.Version = syn.$l.get('txtVersion').value;

                    $this.prop.moduleConfig.ModuleConfig.SystemID = syn.$l.get('txtSystemID').value;
                    $this.prop.moduleConfig.ModuleConfig.BusinessServerUrl = syn.$l.get('txtBusinessServerUrl').value;
                    $this.prop.moduleConfig.ModuleConfig.ModuleConfigurationUrl = syn.$l.get('txtModuleConfigurationUrl').value;
                    $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath = syn.$l.get('txtModuleLogFilePath').value;
                    $this.prop.moduleConfig.ModuleConfig.ModuleBasePath = syn.$l.get('txtModuleBasePath').value;
                    $this.prop.moduleConfig.ModuleConfig.WWWRootBasePath = syn.$l.get('txtWWWRootBasePath').value;
                    $this.prop.moduleConfig.ModuleConfig.IndexingBasePath = syn.$l.get('txtIndexingBasePath').value;
                    $this.prop.moduleConfig.ModuleConfig.ConnectionString = syn.$l.get('txtConnectionString').value;

                    syn.$l.get('txtJsonView').value = JSON.stringify($this.prop.moduleConfig, null, 4);
                } catch (error) {
                    syn.$l.get('txtJsonView').value = '';
                    syn.$l.eventLog('$this.event.btnJsonView_click', error.stack, 'Error');
                }
            }
        },

        btnManagedAccessKey_click() {
            syn.$l.get('txtManagedAccessKey').value = syn.$l.random(32);
        },

        btnEncryptionAES256Key_click() {
            syn.$l.get('txtEncryptionAES256Key').value = syn.$l.random(16);
        },

        btnEventAction_click() {
            $this.method.showModal('ManageAction', {
                action: 'EventAction',
                eventID: '',
                title: 'EventAction 추가'
            });
        },

        btnSubscribeAction_click() {
            $this.method.showModal('ManageAction', {
                action: 'SubscribeAction',
                eventID: '',
                title: 'SubscribeAction 추가'
            });
        },

        btnLoadPassAssemblyPath_click() {
            $this.method.showModal('LoadPassAssemblyPath', {
                itemPathID: '',
                title: 'LoadPassAssemblyPath 추가'
            });
        },

        btnActionEdit_click(evt) {
            var baseTableID = this.closest('table').id;
            if (baseTableID == 'tblEventAction' || baseTableID == 'tblSubscribeAction') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                var eventID = baseEL.querySelector('td:nth-child(1)').innerText.trim();
                var action = baseTableID == 'tblEventAction' ? 'EventAction' : 'SubscribeAction';
                $this.method.showModal('ManageAction', {
                    action: action,
                    eventID: eventID,
                    title: 'EventAction 수정'
                });
            }
            else if (baseTableID == 'tblLoadPassAssemblyPath') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                var itemPathID = baseEL.querySelector('td:nth-child(1)').innerText.trim();
                $this.method.showModal('LoadPassAssemblyPath', {
                    itemPathID: itemPathID,
                    title: 'LoadPassAssemblyPath 수정'
                });
            }
        },

        btnActionDelete_click(evt) {
            var baseTableID = this.closest('table').id;
            if (baseTableID == 'tblEventAction' || baseTableID == 'tblSubscribeAction') {
                var baseEL = this.closest('tr');
                var baseEventID = baseEL.getAttribute('syn-value');
                var action = baseTableID == 'tblEventAction' ? 'EventAction' : 'SubscribeAction';

                var actions = [];
                if (action == 'EventAction') {
                    actions = $this.prop.moduleConfig.ModuleConfig.EventAction;
                }
                else if (action == 'SubscribeAction') {
                    actions = $this.prop.moduleConfig.ModuleConfig.SubscribeAction;
                }

                $array.removeAt(actions, actions.indexOf(baseEventID));
                $this.method.sectionRender('MediatorAction');
            }
            else if (baseTableID == 'tblLoadPassAssemblyPath') {
                var baseEL = this.closest('tr');
                var baseItemPathID = baseEL.getAttribute('syn-value');

                var items = $this.prop.moduleConfig.LoadPassAssemblyPath;

                $array.removeAt(items, items.indexOf(baseItemPathID));
                $this.method.sectionRender('LoadPassAssemblyPath');
            }
        },

        btnManageAction_click(evt) {
            var action = syn.$l.get('txtEventAction').value;
            var baseEventID = syn.$l.get('txtBaseEventID').value;
            var eventID = syn.$l.get('txtEventID').value.trim();
            if (eventID == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var actions = [];
            if (action == 'EventAction') {
                actions = $this.prop.moduleConfig.ModuleConfig.EventAction;
            }
            else if (action == 'SubscribeAction') {
                actions = $this.prop.moduleConfig.ModuleConfig.SubscribeAction;
            }

            if (baseEventID == '') {
                if (actions.includes(eventID) == true) {
                    syn.$w.notify('information', `중복된 값을 입력 할 수 없습니다.`);
                    return;
                }
                else {
                    actions.push(eventID);
                }
            }
            else {
                actions[actions.indexOf(baseEventID)] = eventID;
            }

            $this.method.sectionRender('MediatorAction');
        },

        btnManageLoadPassAssemblyPath_click(evt) {
            var baseItemPathID = syn.$l.get('txtBaseItemPathID').value;
            var itemPathID = syn.$l.get('txtItemPathID').value.trim();

            var items = $this.prop.moduleConfig.LoadPassAssemblyPath;

            if (baseItemPathID == '') {
                if (items.includes(itemPathID) == true) {
                    syn.$w.notify('information', `중복된 파일 경로를 입력 할 수 없습니다.`);
                    return;
                }
                else {
                    items.push(itemPathID);
                }
            }
            else {
                items[items.indexOf(baseItemPathID)] = itemPathID;
            }

            $this.method.sectionRender('LoadPassAssemblyPath');
        }
    },

    method: {
        showModal(elID, options) {
            if (elID == 'ManageAction') {
                var el = syn.$l.get('mdlManageAction');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        action: '',
                        eventID: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('txtEventAction').value = options.action;
                    syn.$l.get('lblActionTitle').innerText = options.title;
                    syn.$l.get('txtEventID').value = options.eventID;
                    syn.$l.get('txtBaseEventID').value = options.eventID;

                    $this.prop.modal = new bootstrap.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtEventID').focus(); }, 100);
                }
            }
            else if (elID == 'LoadPassAssemblyPath') {
                var el = syn.$l.get('mdlLoadPassAssemblyPath');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        itemPathID: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblItemPathTitle').innerText = options.title;
                    syn.$l.get('txtItemPathID').value = options.itemPathID;
                    syn.$l.get('txtBaseItemPathID').value = options.itemPathID;

                    $this.prop.modal = new bootstrap.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtItemPathID').focus(); }, 100);
                }
            }
        },

        sectionRender(sectionID) {
            if (sectionID == 'MediatorAction') {
                var actions = [
                    { key: 'EventAction', tbodyID: 'tblEventActionItems' },
                    { key: 'SubscribeAction', tbodyID: 'tblSubscribeActionItems' }
                ];

                actions.forEach(action => {
                    var actionList = $this.prop.moduleConfig.ModuleConfig[action.key];
                    var dataSource = {
                        items: actionList.map(action => ({ EventID: action.trim() }))
                    };

                    $this.method.drawHtmlTemplate(action.tbodyID, 'tplActionItem', dataSource);
                });
            }
            else if (sectionID == 'LoadPassAssemblyPath') {
                var pathList = $this.prop.moduleConfig.LoadPassAssemblyPath;
                var dataSource = {
                    items: pathList.map(pathID => ({ ItemPathID: pathID.trim() }))
                };

                $this.method.drawHtmlTemplate('tblLoadPassAssemblyPathItems', 'tplAssemblyPathItem', dataSource);
            }
        },

        drawHtmlTemplate(elID, templateID, dataSource) {
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                var templateHtml = tplEL.innerHTML;
                drawEl.innerHTML = Mustache.render(templateHtml, dataSource);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.stack, 'Error');
            }
        }
    }
}
