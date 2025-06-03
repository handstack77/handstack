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
                "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
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
                syn.$l.get('txtLogDeleteRepeatSecond').value = $string.isNumber($this.prop.moduleConfig.ModuleConfig.LogDeleteRepeatSecond) == true ? $string.toNumber($this.prop.moduleConfig.ModuleConfig.LogDeleteRepeatSecond) : 60;
                syn.$l.get('txtModuleBasePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleBasePath;
                syn.$l.get('chkIsSQLiteCreateOnNotSettingRequest').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsSQLiteCreateOnNotSettingRequest);

                $this.method.sectionRender('MediatorAction');
                $this.method.sectionRender('DataSource');
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
                    $this.prop.moduleConfig.ModuleConfig.LogDeleteRepeatSecond = $string.isNumber(syn.$l.get('txtLogDeleteRepeatSecond').value) ? $string.toNumber(syn.$l.get('txtLogDeleteRepeatSecond').value) : -1;
                    $this.prop.moduleConfig.ModuleConfig.ModuleBasePath = syn.$l.get('txtModuleBasePath').value;
                    $this.prop.moduleConfig.ModuleConfig.IsSQLiteCreateOnNotSettingRequest = syn.$l.get('chkIsSQLiteCreateOnNotSettingRequest').checked;

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

        btnDataSource_click() {
            $this.method.showModal('DataSource', {
                dataID: '',
                title: 'DataSource 추가'
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
            else if (baseTableID == 'tblDataSource') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                $this.method.showModal('DataSource', {
                    dataID: values,
                    title: 'DataSource 수정'
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
            else if (baseTableID == 'tblDataSource') {
                var baseEL = this.closest('tr');
                var baseDataID = baseEL.getAttribute('syn-value');

                var data = $this.method.getDataSource(baseDataID);
                if (data) {
                    var items = $this.prop.moduleConfig.ModuleConfig.DataSource;

                    $array.removeAt(items, items.indexOf(data));
                    $this.method.sectionRender('DataSource');
                }
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

        btnManageDataSource_click(evt) {
            var baseDataID = syn.$l.get('txtBaseDataID_DataSource').value;
            var applicationID = syn.$l.get('txtApplicationID_DataSource').value.trim();
            var projectID = syn.$l.get('txtTableName_DataSource').value.trim();
            var removePeriod = syn.$l.get('txtRemovePeriod_DataSource').value.trim();
            var dataProvider = syn.$l.get('ddlDataProvider_DataSource').value.trim();
            var connectionString = syn.$l.get('txtConnectionString_DataSource').value.trim();
            var isEncryption = syn.$l.get('chkIsEncryption').checked == true ? 'Y' : 'N';
            var comment = syn.$l.get('txtComment_DataSource').value.trim();

            if (applicationID == '' || projectID == '' || removePeriod == '' || dataProvider == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var dataID = `${applicationID}|${projectID}|${dataProvider}|${removePeriod}`;
            var items = $this.prop.moduleConfig.ModuleConfig.DataSource;
            if (baseDataID == '') {
                if (items.includes(dataID) == true) {
                    syn.$w.alert(`중복된 항목을 입력 할 수 없습니다.`);
                    return;
                }
                else {
                    items.push({
                        ApplicationID: applicationID,
                        TableName: projectID,
                        RemovePeriod: removePeriod,
                        DataProvider: dataProvider,
                        ConnectionString: connectionString,
                        IsEncryption: isEncryption,
                        Comment: comment
                    });
                }
            }
            else {
                var data = $this.method.getDataSource(baseDataID);
                if (data) {
                    data.ApplicationID = applicationID;
                    data.TableName = projectID;
                    data.RemovePeriod = removePeriod;
                    data.DataProvider = dataProvider;
                    data.ConnectionString = connectionString;
                    data.IsEncryption = isEncryption;
                    data.Comment = comment;
                }
            }

            $this.method.sectionRender('DataSource');
            $this.prop.modal.hide();
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
            else if (elID == 'DataSource') {
                var el = syn.$l.get('mdlDataSource');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        dataID: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_DataSource').innerText = options.title;

                    var data = null;
                    if ($string.isNullOrEmpty(options.dataID) == false) {
                        data = $this.method.getDataSource(options.dataID);
                    }

                    if (data) {
                        syn.$l.get('txtApplicationID_DataSource').value = data.ApplicationID;
                        syn.$l.get('txtTableName_DataSource').value = data.TableName;
                        syn.$l.get('txtRemovePeriod_DataSource').value = data.RemovePeriod;
                        syn.$l.get('ddlDataProvider_DataSource').value = data.DataProvider;
                        syn.$l.get('txtBaseDataID_DataSource').value = `${data.ApplicationID}|${data.TableName}|${data.RemovePeriod}|${data.DataProvider}`;
                        syn.$l.get('txtConnectionString_DataSource').value = data.ConnectionString;
                        syn.$l.get('chkIsEncryption').checked = $string.toBoolean(data.IsEncryption);
                        syn.$l.get('txtComment_DataSource').value = data.Comment;
                    }
                    else {
                        syn.$l.get('txtApplicationID_DataSource').value = '';
                        syn.$l.get('txtTableName_DataSource').value = '';
                        syn.$l.get('txtRemovePeriod_DataSource').value = '-30';
                        syn.$l.get('ddlDataProvider_DataSource').value = 'SqlServer';
                        syn.$l.get('txtBaseDataID_DataSource').value = '';
                        syn.$l.get('txtConnectionString_DataSource').value = '';
                        syn.$l.get('chkIsEncryption').checked = false;
                        syn.$l.get('txtComment_DataSource').value = '';
                    }

                    $this.prop.modal = new bootstrap.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtApplicationID_DataSource').focus(); }, 100);
                }
            }
        },

        getDataSource(dataID) {
            var values = $array.split(dataID, '|');
            return $this.prop.moduleConfig.ModuleConfig.DataSource.find((item) => {
                return item.ApplicationID == values[0]
                    && item.TableName == values[1]
                    && item.DataProvider == values[2]
                    && item.RemovePeriod == values[3]
            });
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
            else if (sectionID == 'DataSource') {
                var dataSource = {
                    items: $this.prop.moduleConfig.ModuleConfig.DataSource
                };

                $this.method.drawHtmlTemplate('tblDataSourceItems', 'tplDataSourceItem', dataSource);
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
