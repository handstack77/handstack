﻿'use strict';
let $module_settings = {
    prop: {
        defaultConfig: {
            "ModuleID": "openapi",
            "Name": "openapi",
            "IsBundledWithHost": false,
            "Version": "1.0.0",
            "ModuleConfig": {
                "SystemID": "HANDSTACK",
                "ModuleBasePath": "../modules/openapi",
                "ManagerEmailID": "manager@handstack.kr",
                "ManagerSHA256Password": "48c691ca3e9d0e01bdaab5923534a1ebc01dcb52f87bddccbae6e185f3f481d9",
                "ModuleConfigurationUrl": "http://localhost:8421/openapi/api/managed/initialize-settings",
                "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
                "ModuleLogFilePath": "../log/openapi/module.log",
                "IsLogServer": true,
                "LogServerUrl": "http://localhost:8421/logger/api/log/insert",
                "DataSource": {
                    "ApplicationID": "HDS",
                    "ProjectID": "HOA",
                    "DataSourceID": "OPENAPIDB",
                    "DataProvider": "SQLite",
                    "ConnectionString": "URI=file:../sqlite/HDS/openapi/managed.db;Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;",
                    "IsEncryption": "N"
                },
                "EventAction": [
                    "dbclient.Events.ManagedRequest"
                ],
                "SubscribeAction": []
            }
        },
        moduleConfig: null
    },

    hook: {
        pageLoad() {
            $this.prop.moduleConfig = $object.clone($this.prop.defaultConfig, true);

            syn.$l.addLive('[name="btnActionEdit"]', 'click', $this.event.btnActionEdit_click);
            syn.$l.addLive('[name="btnActionDelete"]', 'click', $this.event.btnActionDelete_click);

            $this.event.btnImportDefaultConfig_click();
            $this.event.btnApplyConfig_click();
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
                syn.$l.get('txtModuleBasePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleBasePath;
                syn.$l.get('txtManagerEmailID').value = $this.prop.moduleConfig.ModuleConfig.ManagerEmailID;
                syn.$l.get('txtManagerSHA256Password').value = $this.prop.moduleConfig.ModuleConfig.ManagerSHA256Password;
                syn.$l.get('txtModuleConfigurationUrl').value = $this.prop.moduleConfig.ModuleConfig.ModuleConfigurationUrl;
                syn.$l.get('txtModuleLogFilePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath;
                syn.$l.get('chkIsLogServer').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsLogServer);
                syn.$l.get('txtLogServerUrl').value = $this.prop.moduleConfig.ModuleConfig.LogServerUrl;

                syn.$l.get('txtApplicationID').value = $this.prop.moduleConfig.ModuleConfig.DataSource.ApplicationID;
                syn.$l.get('txtProjectID').value = $this.prop.moduleConfig.ModuleConfig.DataSource.ProjectID;
                syn.$l.get('txtDataSourceID').value = $this.prop.moduleConfig.ModuleConfig.DataSource.DataSourceID;
                syn.$l.get('ddlDataProvider').value = $this.prop.moduleConfig.ModuleConfig.DataSource.DataProvider;
                syn.$l.get('txtConnectionString').value = $this.prop.moduleConfig.ModuleConfig.DataSource.ConnectionString;
                syn.$l.get('chkIsEncryption').value = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.DataSource.IsEncryption);

                $this.method.sectionRender('MediatorAction');
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
                    $this.prop.moduleConfig.IsBundledWithHost = syn.$l.get('chkIsBundledWithHost').checked;
                    $this.prop.moduleConfig.Version = syn.$l.get('txtVersion').value;

                    $this.prop.moduleConfig.ModuleConfig.SystemID = syn.$l.get('txtSystemID').value;
                    $this.prop.moduleConfig.ModuleConfig.BusinessServerUrl = syn.$l.get('txtBusinessServerUrl').value;
                    $this.prop.moduleConfig.ModuleConfig.ModuleBasePath = syn.$l.get('txtModuleBasePath').value;
                    $this.prop.moduleConfig.ModuleConfig.ManagerEmailID = syn.$l.get('txtManagerEmailID').value;
                    $this.prop.moduleConfig.ModuleConfig.ManagerSHA256Password = syn.$l.get('txtManagerSHA256Password').value;
                    $this.prop.moduleConfig.ModuleConfig.ModuleConfigurationUrl = syn.$l.get('txtModuleConfigurationUrl').value;
                    $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath = syn.$l.get('txtModuleLogFilePath').value;
                    $this.prop.moduleConfig.ModuleConfig.IsLogServer = syn.$l.get('chkIsLogServer').checked;
                    $this.prop.moduleConfig.ModuleConfig.LogServerUrl = syn.$l.get('txtLogServerUrl').value;

                    $this.prop.moduleConfig.ModuleConfig.DataSource.ApplicationID = syn.$l.get('txtApplicationID').value;
                    $this.prop.moduleConfig.ModuleConfig.DataSource.ProjectID = syn.$l.get('txtProjectID').value;
                    $this.prop.moduleConfig.ModuleConfig.DataSource.DataSourceID = syn.$l.get('txtDataSourceID').value;
                    $this.prop.moduleConfig.ModuleConfig.DataSource.DataProvider = syn.$l.get('ddlDataProvider').value;
                    $this.prop.moduleConfig.ModuleConfig.DataSource.ConnectionString = syn.$l.get('txtConnectionString').value;
                    $this.prop.moduleConfig.ModuleConfig.DataSource.IsEncryption = syn.$l.get('chkIsEncryption').checked;

                    syn.$l.get('txtJsonView').value = JSON.stringify($this.prop.moduleConfig, null, 4);
                } catch (error) {
                    syn.$l.get('txtJsonView').value = '';
                    syn.$l.eventLog('$this.event.btnJsonView_click', error.stack, 'Error');
                }
            }
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
            $this.prop.modal.hide();
        },

        txtManagerSHA256Password_blur() {
            var value = syn.$l.get('txtManagerSHA256Password').value.trim();
            if (/^[a-f0-9]{64}$/i.test(value) == false) {
                syn.$l.get('txtManagerSHA256Password').value = syn.$c.sha256(value);
            }
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
