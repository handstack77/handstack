'use strict';
let $module_settings = {
    prop: {
        defaultConfig: {
            "ModuleID": "graphclient",
            "Name": "graphclient",
            "IsBundledWithHost": false,
            "Version": "1.0.0",
            "ModuleConfig": {
                "AuthorizationKey": "",
                "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
                "CircuitBreakResetSecond": 60,
                "DefaultCommandTimeout": 30,
                "IsContractFileWatching": true,
                "ContractBasePath": [
                    "../contracts/graphclient"
                ],
                "IsTransactionLogging": false,
                "ModuleLogFilePath": "../log/graphclient/module.log",
                "IsLogServer": true,
                "LogServerUrl": "http://localhost:8421/logger/api/log/insert",
                "IsProfileLogging": false,
                "ProfileLogFilePath": "../log/graphclient/profile.log",
                "EventAction": [],
                "SubscribeAction": [
                    "graphclient.Events.GraphClientRequest",
                    "graphclient.Events.ManagedRequest"
                ],
                "DefaultDataSourceID": "GRAPH01",
                "AllowClientIP": [
                    "*"
                ],
                "GraphDataSource": [
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "GRAPH01",
                        "GraphProvider": "Neo4j",
                        "ConnectionString": "bolt://localhost:7687",
                        "UserName": "neo4j",
                        "Password": "local-password",
                        "Database": "neo4j",
                        "IsEncryption": "N",
                        "Comment": "기본 Neo4j 로컬 데이터 원본"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "GRAPH02",
                        "GraphProvider": "Memgraph",
                        "ConnectionString": "bolt://localhost:7688",
                        "UserName": "",
                        "Password": "",
                        "Database": "memgraph",
                        "IsEncryption": "N",
                        "Comment": "기본 Memgraph 로컬 데이터 원본"
                    }
                ]
            }
        },
        moduleConfig: null,
        modal: null
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
                var moduleConfig = $this.prop.moduleConfig.ModuleConfig;

                moduleConfig.ContractBasePath = moduleConfig.ContractBasePath || [];
                moduleConfig.EventAction = moduleConfig.EventAction || [];
                moduleConfig.SubscribeAction = moduleConfig.SubscribeAction || [];
                moduleConfig.AllowClientIP = moduleConfig.AllowClientIP || ['*'];
                moduleConfig.GraphDataSource = moduleConfig.GraphDataSource || [];

                syn.$l.get('txtModuleID').value = $this.prop.moduleConfig.ModuleID;
                syn.$l.get('txtName').value = $this.prop.moduleConfig.Name;
                syn.$l.get('chkIsBundledWithHost').checked = $string.toBoolean($this.prop.moduleConfig.IsBundledWithHost);
                syn.$l.get('txtVersion').value = $this.prop.moduleConfig.Version;

                syn.$l.get('txtAuthorizationKey').value = moduleConfig.AuthorizationKey || '';
                syn.$l.get('txtBusinessServerUrl').value = moduleConfig.BusinessServerUrl || '';
                syn.$l.get('txtCircuitBreakResetSecond').value = $string.isNumber(moduleConfig.CircuitBreakResetSecond) ? $string.toNumber(moduleConfig.CircuitBreakResetSecond) : 60;
                syn.$l.get('txtDefaultCommandTimeout').value = $string.isNumber(moduleConfig.DefaultCommandTimeout) ? $string.toNumber(moduleConfig.DefaultCommandTimeout) : 30;
                syn.$l.get('chkIsContractFileWatching').checked = $string.toBoolean(moduleConfig.IsContractFileWatching);
                syn.$l.get('txtDefaultDataSourceID').value = moduleConfig.DefaultDataSourceID || '';
                syn.$l.get('txtAllowClientIP').value = moduleConfig.AllowClientIP.join('\n');
                syn.$l.get('chkIsTransactionLogging').checked = $string.toBoolean(moduleConfig.IsTransactionLogging);
                syn.$l.get('txtModuleLogFilePath').value = moduleConfig.ModuleLogFilePath || '';
                syn.$l.get('chkIsLogServer').checked = $string.toBoolean(moduleConfig.IsLogServer);
                syn.$l.get('txtLogServerUrl').value = moduleConfig.LogServerUrl || '';
                syn.$l.get('chkIsProfileLogging').checked = $string.toBoolean(moduleConfig.IsProfileLogging);
                syn.$l.get('txtProfileLogFilePath').value = moduleConfig.ProfileLogFilePath || '';

                $this.method.sectionRender('MediatorAction');
                $this.method.sectionRender('ContractBasePath');
                $this.method.sectionRender('GraphDataSource');
            }
            catch (error) {
                syn.$w.notify('error', `JSON을 적용하지 못했습니다. ${error.message}`);
                syn.$l.eventLog('$this.event.btnApplyConfig_click', error.stack, 'Error');
            }
        },

        btnJsonView_click() {
            if ($object.isNullOrUndefined($this.prop.moduleConfig) == true) {
                return;
            }

            try {
                var moduleConfig = $this.prop.moduleConfig.ModuleConfig;

                $this.prop.moduleConfig.ModuleID = syn.$l.get('txtModuleID').value;
                $this.prop.moduleConfig.Name = syn.$l.get('txtName').value;
                $this.prop.moduleConfig.IsBundledWithHost = syn.$l.get('chkIsBundledWithHost').checked;
                $this.prop.moduleConfig.Version = syn.$l.get('txtVersion').value;

                moduleConfig.AuthorizationKey = syn.$l.get('txtAuthorizationKey').value;
                moduleConfig.BusinessServerUrl = syn.$l.get('txtBusinessServerUrl').value;
                moduleConfig.CircuitBreakResetSecond = $string.isNumber(syn.$l.get('txtCircuitBreakResetSecond').value) ? $string.toNumber(syn.$l.get('txtCircuitBreakResetSecond').value) : 60;
                moduleConfig.DefaultCommandTimeout = $string.isNumber(syn.$l.get('txtDefaultCommandTimeout').value) ? $string.toNumber(syn.$l.get('txtDefaultCommandTimeout').value) : 30;
                moduleConfig.IsContractFileWatching = syn.$l.get('chkIsContractFileWatching').checked;
                moduleConfig.DefaultDataSourceID = syn.$l.get('txtDefaultDataSourceID').value;
                moduleConfig.AllowClientIP = $this.method.parseTextareaItems(syn.$l.get('txtAllowClientIP').value);
                moduleConfig.IsTransactionLogging = syn.$l.get('chkIsTransactionLogging').checked;
                moduleConfig.ModuleLogFilePath = syn.$l.get('txtModuleLogFilePath').value;
                moduleConfig.IsLogServer = syn.$l.get('chkIsLogServer').checked;
                moduleConfig.LogServerUrl = syn.$l.get('txtLogServerUrl').value;
                moduleConfig.IsProfileLogging = syn.$l.get('chkIsProfileLogging').checked;
                moduleConfig.ProfileLogFilePath = syn.$l.get('txtProfileLogFilePath').value;

                syn.$l.get('txtJsonView').value = JSON.stringify($this.prop.moduleConfig, null, 4);
            }
            catch (error) {
                syn.$l.get('txtJsonView').value = '';
                syn.$l.eventLog('$this.event.btnJsonView_click', error.stack, 'Error');
            }
        },

        btnEventAction_click() {
            $this.method.showModal('ManageAction', {
                listType: 'EventAction',
                value: '',
                title: 'EventAction 추가'
            });
        },

        btnSubscribeAction_click() {
            $this.method.showModal('ManageAction', {
                listType: 'SubscribeAction',
                value: '',
                title: 'SubscribeAction 추가'
            });
        },

        btnContractBasePath_click() {
            $this.method.showModal('ContractBasePath', {
                value: '',
                title: 'ContractBasePath 추가'
            });
        },

        btnGraphDataSource_click() {
            $this.method.showModal('GraphDataSource', {
                dataID: '',
                title: 'GraphDataSource 추가'
            });
        },

        btnActionEdit_click() {
            var tableID = this.closest('table').id;
            var baseEL = this.closest('tr');
            var rowValue = baseEL.getAttribute('syn-value');

            if (tableID == 'tblEventAction') {
                $this.method.showModal('ManageAction', {
                    listType: 'EventAction',
                    value: rowValue,
                    title: 'EventAction 수정'
                });
            }
            else if (tableID == 'tblSubscribeAction') {
                $this.method.showModal('ManageAction', {
                    listType: 'SubscribeAction',
                    value: rowValue,
                    title: 'SubscribeAction 수정'
                });
            }
            else if (tableID == 'tblContractBasePath') {
                $this.method.showModal('ContractBasePath', {
                    value: rowValue,
                    title: 'ContractBasePath 수정'
                });
            }
            else if (tableID == 'tblGraphDataSource') {
                $this.method.showModal('GraphDataSource', {
                    dataID: rowValue,
                    title: 'GraphDataSource 수정'
                });
            }
        },

        btnActionDelete_click() {
            var tableID = this.closest('table').id;
            var baseEL = this.closest('tr');
            var rowValue = baseEL.getAttribute('syn-value');

            if (tableID == 'tblEventAction' || tableID == 'tblSubscribeAction') {
                var listType = tableID == 'tblEventAction' ? 'EventAction' : 'SubscribeAction';
                var items = $this.prop.moduleConfig.ModuleConfig[listType];
                $array.removeAt(items, items.indexOf(rowValue));
                $this.method.sectionRender('MediatorAction');
            }
            else if (tableID == 'tblContractBasePath') {
                var pathItems = $this.prop.moduleConfig.ModuleConfig.ContractBasePath;
                $array.removeAt(pathItems, pathItems.indexOf(rowValue));
                $this.method.sectionRender('ContractBasePath');
            }
            else if (tableID == 'tblGraphDataSource') {
                var data = $this.method.getGraphDataSource(rowValue);
                if (data) {
                    var dataItems = $this.prop.moduleConfig.ModuleConfig.GraphDataSource;
                    $array.removeAt(dataItems, dataItems.indexOf(data));
                    $this.method.sectionRender('GraphDataSource');
                }
            }
        },

        btnManageAction_click() {
            var listType = syn.$l.get('txtActionListType').value;
            var baseValue = syn.$l.get('txtBaseActionValue').value;
            var currentValue = syn.$l.get('txtActionValue').value.trim();

            if (currentValue == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var items = $this.prop.moduleConfig.ModuleConfig[listType];
            if (baseValue == '') {
                if (items.includes(currentValue) == true) {
                    syn.$w.notify('information', '중복된 값을 입력 할 수 없습니다.');
                    return;
                }

                items.push(currentValue);
            }
            else {
                items[items.indexOf(baseValue)] = currentValue;
            }

            $this.method.sectionRender('MediatorAction');
            $this.prop.modal.hide();
        },

        btnManageContractBasePath_click() {
            var baseValue = syn.$l.get('txtBaseItemPathID').value;
            var currentValue = syn.$l.get('txtItemPathID').value.trim();

            if (currentValue == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var items = $this.prop.moduleConfig.ModuleConfig.ContractBasePath;
            if (baseValue == '') {
                if (items.includes(currentValue) == true) {
                    syn.$w.notify('information', '중복된 파일 경로를 입력 할 수 없습니다.');
                    return;
                }

                items.push(currentValue);
            }
            else {
                items[items.indexOf(baseValue)] = currentValue;
            }

            $this.method.sectionRender('ContractBasePath');
            $this.prop.modal.hide();
        },

        btnManageGraphDataSource_click() {
            var baseDataID = syn.$l.get('txtBaseGraphDataSourceID').value;
            var applicationID = syn.$l.get('txtApplicationID_GraphDataSource').value.trim();
            var projectID = syn.$l.get('txtProjectID_GraphDataSource').value.trim();
            var dataSourceID = syn.$l.get('txtDataSourceID_GraphDataSource').value.trim();
            var graphProvider = syn.$l.get('ddlGraphProvider_GraphDataSource').value.trim();
            var connectionString = syn.$l.get('txtConnectionString_GraphDataSource').value.trim();
            var userName = syn.$l.get('txtUserName_GraphDataSource').value.trim();
            var password = syn.$l.get('txtPassword_GraphDataSource').value.trim();
            var database = syn.$l.get('txtDatabase_GraphDataSource').value.trim();
            var isEncryption = syn.$l.get('chkIsEncryption_GraphDataSource').checked == true ? 'Y' : 'N';
            var comment = syn.$l.get('txtComment_GraphDataSource').value.trim();

            if (applicationID == '' || projectID == '' || dataSourceID == '' || graphProvider == '' || connectionString == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var item = {
                ApplicationID: applicationID,
                ProjectID: projectID,
                DataSourceID: dataSourceID,
                GraphProvider: graphProvider,
                ConnectionString: connectionString,
                UserName: userName,
                Password: password,
                Database: database,
                IsEncryption: isEncryption,
                Comment: comment
            };

            var graphDataSource = $this.prop.moduleConfig.ModuleConfig.GraphDataSource;
            var itemKey = $this.method.buildGraphDataSourceKey(item);

            if (baseDataID == '') {
                if (graphDataSource.some(source => $this.method.buildGraphDataSourceKey(source) == itemKey) == true) {
                    syn.$w.notify('information', '중복된 GraphDataSource를 입력 할 수 없습니다.');
                    return;
                }

                graphDataSource.push(item);
            }
            else {
                var source = $this.method.getGraphDataSource(baseDataID);
                if (source) {
                    source.ApplicationID = item.ApplicationID;
                    source.ProjectID = item.ProjectID;
                    source.DataSourceID = item.DataSourceID;
                    source.GraphProvider = item.GraphProvider;
                    source.ConnectionString = item.ConnectionString;
                    source.UserName = item.UserName;
                    source.Password = item.Password;
                    source.Database = item.Database;
                    source.IsEncryption = item.IsEncryption;
                    source.Comment = item.Comment;
                }
            }

            $this.method.sectionRender('GraphDataSource');
            $this.prop.modal.hide();
        }
    },

    method: {
        showModal(elID, options) {
            if (elID == 'ManageAction') {
                var manageActionEl = syn.$l.get('mdlManageAction');
                if (manageActionEl && syn.$m.hasClass(manageActionEl, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        listType: '',
                        value: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('txtActionListType').value = options.listType;
                    syn.$l.get('txtBaseActionValue').value = options.value;
                    syn.$l.get('txtActionValue').value = options.value;
                    syn.$l.get('lblActionTitle').innerText = options.title;

                    $this.prop.modal = new bootstrap.Modal(manageActionEl);
                    $this.prop.modal.show();
                    setTimeout(() => { syn.$l.get('txtActionValue').focus(); }, 100);
                }
            }
            else if (elID == 'ContractBasePath') {
                var contractBasePathEl = syn.$l.get('mdlContractBasePath');
                if (contractBasePathEl && syn.$m.hasClass(contractBasePathEl, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        value: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('txtBaseItemPathID').value = options.value;
                    syn.$l.get('txtItemPathID').value = options.value;
                    syn.$l.get('lblItemPathTitle').innerText = options.title;

                    $this.prop.modal = new bootstrap.Modal(contractBasePathEl);
                    $this.prop.modal.show();
                    setTimeout(() => { syn.$l.get('txtItemPathID').focus(); }, 100);
                }
            }
            else if (elID == 'GraphDataSource') {
                var graphDataSourceEl = syn.$l.get('mdlGraphDataSource');
                if (graphDataSourceEl && syn.$m.hasClass(graphDataSourceEl, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        dataID: '',
                        title: ''
                    }, options || {});

                    var source = null;
                    if ($string.isNullOrEmpty(options.dataID) == false) {
                        source = $this.method.getGraphDataSource(options.dataID);
                    }

                    syn.$l.get('lblTitle_GraphDataSource').innerText = options.title;

                    if (source) {
                        syn.$l.get('txtBaseGraphDataSourceID').value = $this.method.buildGraphDataSourceKey(source);
                        syn.$l.get('txtApplicationID_GraphDataSource').value = source.ApplicationID || '';
                        syn.$l.get('txtProjectID_GraphDataSource').value = source.ProjectID || '';
                        syn.$l.get('txtDataSourceID_GraphDataSource').value = source.DataSourceID || '';
                        syn.$l.get('ddlGraphProvider_GraphDataSource').value = source.GraphProvider || 'Neo4j';
                        syn.$l.get('txtConnectionString_GraphDataSource').value = source.ConnectionString || '';
                        syn.$l.get('txtUserName_GraphDataSource').value = source.UserName || '';
                        syn.$l.get('txtPassword_GraphDataSource').value = source.Password || '';
                        syn.$l.get('txtDatabase_GraphDataSource').value = source.Database || '';
                        syn.$l.get('chkIsEncryption_GraphDataSource').checked = $string.toBoolean(source.IsEncryption);
                        syn.$l.get('txtComment_GraphDataSource').value = source.Comment || '';
                    }
                    else {
                        syn.$l.get('txtBaseGraphDataSourceID').value = '';
                        syn.$l.get('txtApplicationID_GraphDataSource').value = '';
                        syn.$l.get('txtProjectID_GraphDataSource').value = '';
                        syn.$l.get('txtDataSourceID_GraphDataSource').value = '';
                        syn.$l.get('ddlGraphProvider_GraphDataSource').value = 'Neo4j';
                        syn.$l.get('txtConnectionString_GraphDataSource').value = 'bolt://localhost:7687';
                        syn.$l.get('txtUserName_GraphDataSource').value = 'neo4j';
                        syn.$l.get('txtPassword_GraphDataSource').value = '';
                        syn.$l.get('txtDatabase_GraphDataSource').value = 'neo4j';
                        syn.$l.get('chkIsEncryption_GraphDataSource').checked = false;
                        syn.$l.get('txtComment_GraphDataSource').value = '';
                    }

                    $this.prop.modal = new bootstrap.Modal(graphDataSourceEl);
                    $this.prop.modal.show();
                    setTimeout(() => { syn.$l.get('txtApplicationID_GraphDataSource').focus(); }, 100);
                }
            }
        },

        parseTextareaItems(value) {
            return (value || '')
                .split(/[\r\n,]+/)
                .map(item => item.trim())
                .filter(item => item !== '');
        },

        buildGraphDataSourceKey(item) {
            return `${item.ApplicationID}|${item.ProjectID}|${item.DataSourceID}|${item.GraphProvider}`;
        },

        getGraphDataSource(dataID) {
            return $this.prop.moduleConfig.ModuleConfig.GraphDataSource.find(item => {
                return $this.method.buildGraphDataSourceKey(item) == dataID;
            });
        },

        sectionRender(sectionID) {
            if (sectionID == 'MediatorAction') {
                [
                    { key: 'EventAction', tbodyID: 'tblEventActionItems' },
                    { key: 'SubscribeAction', tbodyID: 'tblSubscribeActionItems' }
                ].forEach(actionInfo => {
                    var dataSource = {
                        items: ($this.prop.moduleConfig.ModuleConfig[actionInfo.key] || []).map(item => ({ EventID: item.trim() }))
                    };
                    $this.method.drawHtmlTemplate(actionInfo.tbodyID, 'tplActionItem', dataSource);
                });
            }
            else if (sectionID == 'ContractBasePath') {
                $this.method.drawHtmlTemplate('tblContractBasePathItems', 'tplContractBasePathItem', {
                    items: ($this.prop.moduleConfig.ModuleConfig.ContractBasePath || []).map(item => ({ ItemPathID: item.trim() }))
                });
            }
            else if (sectionID == 'GraphDataSource') {
                $this.method.drawHtmlTemplate('tblGraphDataSourceItems', 'tplGraphDataSourceItem', {
                    items: $this.prop.moduleConfig.ModuleConfig.GraphDataSource || []
                });
            }
        },

        drawHtmlTemplate(elID, templateID, dataSource) {
            var drawEl = syn.$l.get(elID);
            var templateEl = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                drawEl.innerHTML = Mustache.render(templateEl.innerHTML, dataSource);
            }
            catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.stack, 'Error');
            }
        }
    }
};
