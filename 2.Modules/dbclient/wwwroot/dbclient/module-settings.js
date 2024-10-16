'use strict';
let $module_settings = {
    prop: {
        defaultConfig: {
            "ModuleID": "dbclient",
            "Name": "dbclient",
            "IsBundledWithHost": false,
            "Version": "1.0.0",
            "ModuleConfig": {
                "SystemID": "HANDSTACK",
                "BusinessServerUrl": "http://localhost:8000/transact/api/transaction/execute",
                "CircuitBreakResetSecond": 60,
                "DefaultCommandTimeout": 30,
                "ContractBasePath": [
                    "../contracts/dbclient"
                ],
                "IsTransactionLogging": false,
                "ModuleLogFilePath": "../log/dbclient/module.log",
                "IsLogServer": true,
                "LogServerUrl": "http://localhost:8000/logger/api/log/insert",
                "IsProfileLogging": false,
                "ProfileLogFilePath": "../log/dbclient/profile.log",
                "EventAction": [],
                "SubscribeAction": [
                    "dbclient.Events.DbClientRequest",
                    "dbclient.Events.ManagedRequest"
                ],
                "DataSource": [
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "CHECKUPDB",
                        "DataProvider": "SQLite",
                        "ConnectionString": "URI=file:../sqlite/HDS/dbclient/checkup.db;Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;",
                        "IsEncryption": "N",
                        "Comment": "SQLite 기본 데이터베이스"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "DB01",
                        "DataProvider": "SQLite",
                        "ConnectionString": "URI=file:../sqlite/HDS/dbclient/HDS.db;Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;",
                        "IsEncryption": "N",
                        "Comment": "SQLite 기본 데이터베이스"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "DB02",
                        "DataProvider": "SqlServer",
                        "ConnectionString": "Data Source=localhost;Initial Catalog=master;User ID=sa;Password=Strong@Passw0rd;",
                        "IsEncryption": "N",
                        "Comment": "SqlServer 기본 데이터베이스"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "DB03",
                        "DataProvider": "Oracle",
                        "ConnectionString": "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SID=ORCL)));User Id=system;Password=Strong@Passw0rd;",
                        "IsEncryption": "N",
                        "Comment": "Oracle 기본 데이터베이스"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "DB04",
                        "DataProvider": "MySQL",
                        "ConnectionString": "Server=localhost;Port=3306;Uid=root;Pwd=Strong@Passw0rd;PersistSecurityInfo=True;SslMode=none;Charset=utf8;Allow User Variables=True;",
                        "IsEncryption": "N",
                        "Comment": "MySQL 기본 데이터베이스"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "DB05",
                        "DataProvider": "PostgreSQL",
                        "ConnectionString": "Host=localhost;Port=5432;Database=postgres;User ID=postgres;Password=Strong@Passw0rd;",
                        "IsEncryption": "N",
                        "Comment": "PostgreSQL 기본 데이터베이스"
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
                syn.$l.get('txtCircuitBreakResetSecond').value = $string.isNumber($this.prop.moduleConfig.ModuleConfig.CircuitBreakResetSecond) == true ? $string.toNumber($this.prop.moduleConfig.ModuleConfig.CircuitBreakResetSecond) : 60;
                syn.$l.get('txtDefaultCommandTimeout').value = $string.isNumber($this.prop.moduleConfig.ModuleConfig.DefaultCommandTimeout) == true ? $string.toNumber($this.prop.moduleConfig.ModuleConfig.DefaultCommandTimeout) : 30;
                syn.$l.get('chkIsTransactionLogging').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsTransactionLogging);
                syn.$l.get('txtModuleLogFilePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath;
                syn.$l.get('chkIsLogServer').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsLogServer);
                syn.$l.get('txtLogServerUrl').value = $this.prop.moduleConfig.ModuleConfig.LogServerUrl;
                syn.$l.get('chkIsProfileLogging').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsProfileLogging);
                syn.$l.get('txtProfileLogFilePath').value = $this.prop.moduleConfig.ModuleConfig.ProfileLogFilePath;

                $this.method.sectionRender('MediatorAction');
                $this.method.sectionRender('ContractBasePath');
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
                    $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath = syn.$l.get('txtModuleLogFilePath').value;
                    $this.prop.moduleConfig.ModuleConfig.CircuitBreakResetSecond = $string.isNumber(syn.$l.get('txtCircuitBreakResetSecond').value) ? $string.toNumber(syn.$l.get('txtCircuitBreakResetSecond').value) : 60;
                    $this.prop.moduleConfig.ModuleConfig.DefaultCommandTimeout = syn.$l.get('txtDefaultCommandTimeout').value;
                    $this.prop.moduleConfig.ModuleConfig.IsTransactionLogging = syn.$l.get('chkIsTransactionLogging').checked;
                    $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath = syn.$l.get('txtModuleLogFilePath').value;
                    $this.prop.moduleConfig.ModuleConfig.IsLogServer = syn.$l.get('chkIsLogServer').checked;
                    $this.prop.moduleConfig.ModuleConfig.LogServerUrl = syn.$l.get('txtLogServerUrl').value;
                    $this.prop.moduleConfig.ModuleConfig.IsProfileLogging = syn.$l.get('chkIsProfileLogging').checked;
                    $this.prop.moduleConfig.ModuleConfig.ProfileLogFilePath = syn.$l.get('txtProfileLogFilePath').value;

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

        btnContractBasePath_click() {
            $this.method.showModal('ContractBasePath', {
                itemPathID: '',
                title: 'ContractBasePath 추가'
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
            else if (baseTableID == 'tblContractBasePath') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                var itemPathID = baseEL.querySelector('td:nth-child(1)').innerText.trim();
                $this.method.showModal('ContractBasePath', {
                    itemPathID: itemPathID,
                    title: 'ContractBasePath 수정'
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
            else if (baseTableID == 'tblContractBasePath') {
                var baseEL = this.closest('tr');
                var baseItemPathID = baseEL.getAttribute('syn-value');

                var items = $this.prop.moduleConfig.ModuleConfig.ContractBasePath;

                $array.removeAt(items, items.indexOf(baseItemPathID));
                $this.method.sectionRender('ContractBasePath');
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

        btnManageContractBasePath_click(evt) {
            var baseItemPathID = syn.$l.get('txtBaseItemPathID').value;
            var itemPathID = syn.$l.get('txtItemPathID').value.trim();
            if (itemPathID == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var items = $this.prop.moduleConfig.ModuleConfig.ContractBasePath;

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

            $this.method.sectionRender('ContractBasePath');
            $this.prop.modal.hide();
        },

        btnManageDataSource_click(evt) {
            var baseDataID = syn.$l.get('txtBaseDataID_DataSource').value;
            var applicationID = syn.$l.get('txtApplicationID_DataSource').value.trim();
            var projectID = syn.$l.get('txtProjectID_DataSource').value.trim();
            var dataSourceID = syn.$l.get('txtDataSourceID_DataSource').value.trim();
            var dataProvider = syn.$l.get('ddlDataProvider_DataSource').value.trim();
            var connectionString = syn.$l.get('txtConnectionString_DataSource').value.trim();
            var isEncryption = syn.$l.get('chkIsEncryption').checked == true ? 'Y' : 'N';
            var comment = syn.$l.get('txtComment_DataSource').value.trim();

            if (applicationID == '' || projectID == '' || dataSourceID == '' || dataProvider == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var dataID = `${applicationID}|${projectID}|${dataSourceID}|${dataProvider}`;
            var items = $this.prop.moduleConfig.ModuleConfig.DataSource;
            if (baseDataID == '') {
                if (items.includes(dataID) == true) {
                    syn.$w.alert(`중복된 항목을 입력 할 수 없습니다.`);
                    return;
                }
                else {
                    items.push({
                        ApplicationID: applicationID,
                        ProjectID: projectID,
                        DataSourceID: dataSourceID,
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
                    data.ProjectID = projectID;
                    data.DataSourceID = dataSourceID;
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
            else if (elID == 'ContractBasePath') {
                var el = syn.$l.get('mdlContractBasePath');
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
                        syn.$l.get('txtProjectID_DataSource').value = data.ProjectID;
                        syn.$l.get('txtDataSourceID_DataSource').value = data.DataSourceID;
                        syn.$l.get('ddlDataProvider_DataSource').value = data.DataProvider;
                        syn.$l.get('txtBaseDataID_DataSource').value = `${data.ApplicationID}|${data.ProjectID}|${data.DataSourceID}|${data.DataProvider}`;
                        syn.$l.get('txtConnectionString_DataSource').value = data.ConnectionString;
                        syn.$l.get('chkIsEncryption').checked = $string.toBoolean(data.IsEncryption);
                        syn.$l.get('txtComment_DataSource').value = data.Comment;
                    }
                    else {
                        syn.$l.get('txtApplicationID_DataSource').value = '';
                        syn.$l.get('txtProjectID_DataSource').value = '';
                        syn.$l.get('txtDataSourceID_DataSource').value = '';
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
                    && item.ProjectID == values[1]
                    && item.DataSourceID == values[2]
                    && item.DataProvider == values[3]
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
            else if (sectionID == 'ContractBasePath') {
                var pathList = $this.prop.moduleConfig.ModuleConfig.ContractBasePath;
                var dataSource = {
                    items: pathList.map(pathID => ({ ItemPathID: pathID.trim() }))
                };

                $this.method.drawHtmlTemplate('tblContractBasePathItems', 'tplContractBasePathItem', dataSource);
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
