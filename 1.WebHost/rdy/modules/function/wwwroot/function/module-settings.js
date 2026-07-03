'use strict';
let $module_settings = {
    prop: {
        defaultConfig: {
            "ModuleID": "function",
            "Name": "function",
            "IsBundledWithHost": false,
            "Version": "1.0.0",
            "ModuleConfig": {
                "SystemID": "HANDSTACK",
                "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
                "CircuitBreakResetSecond": 60,
                "IsLogServer": true,
                "LogServerUrl": "http://localhost:8421/logger/api/log/insert",
                "ContractBasePath": [
                    "../contracts/function"
                ],
                "ModuleLogFilePath": "../log/function/module.log",
                "NodeFunctionConfig": {
                    "LocalStoragePath": "../cache/function",
                    "LogMinimumLevel": "trace",
                    "FileLogBasePath": "../log/function/javascript",
                    "TimeoutMS": -1,
                    "IsSingleThread": true,
                    "WatchGracefulShutdown": true,
                    "EnableFileWatching": true,
                    "WatchFileNamePatterns": ["featureMain.js"],
                    "NodeAndV8Options": "",
                    "EnvironmentVariables": ""
                },
                "CSharpFunctionConfig": {
                    "EnableFileWatching": true,
                    "FileLogBasePath": "../log/function/csharp",
                    "WatchFileNamePatterns": ["featureMain.cs"]
                },
                "PythonFunctionConfig": {
                    "EnablePythonDLL": false,
                    "PythonDLLFilePath": "C:/anaconda3/envs/myenv/python313.dll",
                    "FileLogBasePath": "../log/function/python",
                    "EnableFileWatching": true,
                    "WatchFileNamePatterns": ["featureMain.py"]
                },
                "EventAction": [],
                "SubscribeAction": [],
                "FunctionSource": [
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "FN01",
                        "DataProvider": "SQLite",
                        "ConnectionString": "URI=file:../sqlite/HDS/dbclient/HDS.db;Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;",
                        "IsEncryption": "N",
                        "WorkingDirectoryPath": "../tmp/HDS/function/HDS_FN01",
                        "Comment": "SQLite 기본 거래"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "FN02",
                        "DataProvider": "SqlServer",
                        "ConnectionString": "Data Source=localhost;TrustServerCertificate=True;Initial Catalog=master;User ID=sa;Password=Strong@Passw0rd;",
                        "IsEncryption": "N",
                        "WorkingDirectoryPath": "../tmp/HDS/function/HDS_FN02",
                        "Comment": "SqlServer 기본 거래"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "FN03",
                        "DataProvider": "Oracle",
                        "ConnectionString": "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SID=ORCL)));User Id=system;Password=Strong@Passw0rd;",
                        "IsEncryption": "N",
                        "WorkingDirectoryPath": "../tmp/HDS/function/HDS_FN03",
                        "Comment": "Oracle 기본 거래"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "FN04",
                        "DataProvider": "MySQL",
                        "ConnectionString": "Server=localhost;Port=3306;Uid=root;Pwd=Strong@Passw0rd;PersistSecurityInfo=True;SslMode=none;Charset=utf8;Allow User Variables=True;",
                        "IsEncryption": "N",
                        "WorkingDirectoryPath": "../tmp/HDS/function/HDS_FN04",
                        "Comment": "MySQL 기본 거래"
                    },
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "FN05",
                        "DataProvider": "PostgreSQL",
                        "ConnectionString": "Host=localhost;Port=5432;Database=postgres;User ID=postgres;Password=Strong@Passw0rd;",
                        "IsEncryption": "N",
                        "WorkingDirectoryPath": "../tmp/HDS/function/HDS_FN05",
                        "Comment": "PostgreSQL 기본 거래"
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
                syn.$l.get('txtModuleLogFilePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath;
                syn.$l.get('chkIsLogServer').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsLogServer);
                syn.$l.get('txtLogServerUrl').value = $this.prop.moduleConfig.ModuleConfig.LogServerUrl;

                syn.$l.get('txtLocalStoragePath_NodeFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.LocalStoragePath;
                syn.$l.get('txtLogMinimumLevel_NodeFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.LogMinimumLevel;
                syn.$l.get('txtFileLogBasePath_NodeFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.FileLogBasePath;
                syn.$l.get('txtTimeoutMS_NodeFunctionConfig').value = $string.isNumber($this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.TimeoutMS) == true ? $string.toNumber($this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.TimeoutMS) : -1;
                syn.$l.get('chkIsSingleThread_NodeFunctionConfig').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.IsSingleThread);
                syn.$l.get('chkIsWatchGracefulShutdown_NodeFunctionConfig').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.IsWatchGracefulShutdown);
                syn.$l.get('chkEnableFileWatching_NodeFunctionConfig').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.EnableFileWatching);
                syn.$l.get('txtWatchFileNamePatterns_NodeFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.WatchFileNamePatterns;
                syn.$l.get('txtNodeAndV8Options_NodeFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.NodeAndV8Options;
                syn.$l.get('txtEnvironmentVariables_NodeFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.EnvironmentVariables;

                syn.$l.get('txtFileLogBasePath_CSharpFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.CSharpFunctionConfig.FileLogBasePath;
                syn.$l.get('chkEnableFileWatching_CSharpFunctionConfig').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.CSharpFunctionConfig.EnableFileWatching);
                syn.$l.get('txtWatchFileNamePatterns_CSharpFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.CSharpFunctionConfig.WatchFileNamePatterns;

                syn.$l.get('chkEnablePythonDLL_PythonFunctionConfig').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.EnablePythonDLL);
                syn.$l.get('txtPythonDLLFilePath_PythonFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.PythonDLLFilePath;
                syn.$l.get('txtFileLogBasePath_PythonFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.FileLogBasePath;
                syn.$l.get('chkEnableFileWatching_PythonFunctionConfig').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.EnableFileWatching);
                syn.$l.get('txtWatchFileNamePatterns_PythonFunctionConfig').value = $this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.WatchFileNamePatterns;

                $this.method.sectionRender('MediatorAction');
                $this.method.sectionRender('ContractBasePath');
                $this.method.sectionRender('FunctionSource');
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
                    $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath = syn.$l.get('txtModuleLogFilePath').value;
                    $this.prop.moduleConfig.ModuleConfig.IsLogServer = syn.$l.get('chkIsLogServer').checked;
                    $this.prop.moduleConfig.ModuleConfig.LogServerUrl = syn.$l.get('txtLogServerUrl').value;

                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.LocalStoragePath = syn.$l.get('txtLocalStoragePath_NodeFunctionConfig').value;
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.LogMinimumLevel = syn.$l.get('txtLogMinimumLevel_NodeFunctionConfig').value;
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.FileLogBasePath = syn.$l.get('txtFileLogBasePath_NodeFunctionConfig').value;
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.TimeoutMS = $string.isNumber(syn.$l.get('txtTimeoutMS_NodeFunctionConfig').value) ? $string.toNumber(syn.$l.get('txtTimeoutMS_NodeFunctionConfig').value) : -1;
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.IsSingleThread = syn.$l.get('chkIsSingleThread_NodeFunctionConfig').checked;
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.IsWatchGracefulShutdown = syn.$l.get('chkIsWatchGracefulShutdown_NodeFunctionConfig').checked;
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.EnableFileWatching = syn.$l.get('chkEnableFileWatching_NodeFunctionConfig').checked;
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.WatchFileNamePatterns = $array.split(syn.$l.get('txtWatchFileNamePatterns_NodeFunctionConfig').value);
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.NodeAndV8Options = syn.$l.get('txtNodeAndV8Options_NodeFunctionConfig').value;
                    $this.prop.moduleConfig.ModuleConfig.NodeFunctionConfig.EnvironmentVariables = syn.$l.get('txtEnvironmentVariables_NodeFunctionConfig').value;

                    $this.prop.moduleConfig.ModuleConfig.CSharpFunctionConfig.FileLogBasePath = syn.$l.get('txtFileLogBasePath_CSharpFunctionConfig').value;
                    $this.prop.moduleConfig.ModuleConfig.CSharpFunctionConfig.EnableFileWatching = syn.$l.get('chkEnableFileWatching_CSharpFunctionConfig').checked;
                    $this.prop.moduleConfig.ModuleConfig.CSharpFunctionConfig.WatchFileNamePatterns = $array.split(syn.$l.get('txtWatchFileNamePatterns_CSharpFunctionConfig').value);

                    $this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.EnablePythonDLL = syn.$l.get('chkEnablePythonDLL_PythonFunctionConfig').checked;
                    $this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.PythonDLLFilePath = syn.$l.get('txtPythonDLLFilePath_PythonFunctionConfig').value;
                    $this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.FileLogBasePath = syn.$l.get('txtFileLogBasePath_PythonFunctionConfig').value;
                    $this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.EnableFileWatching = syn.$l.get('chkEnableFileWatching_PythonFunctionConfig').checked;
                    $this.prop.moduleConfig.ModuleConfig.PythonFunctionConfig.WatchFileNamePatterns = $array.split(syn.$l.get('txtWatchFileNamePatterns_PythonFunctionConfig').value);

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

        btnFunctionSource_click() {
            $this.method.showModal('FunctionSource', {
                dataID: '',
                title: 'FunctionSource 추가'
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
            else if (baseTableID == 'tblFunctionSource') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                $this.method.showModal('FunctionSource', {
                    dataID: values,
                    title: 'FunctionSource 수정'
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
            else if (baseTableID == 'tblFunctionSource') {
                var baseEL = this.closest('tr');
                var baseDataID = baseEL.getAttribute('syn-value');

                var data = $this.method.getFunctionSource(baseDataID);
                if (data) {
                    var items = $this.prop.moduleConfig.ModuleConfig.FunctionSource;

                    $array.removeAt(items, items.indexOf(data));
                    $this.method.sectionRender('FunctionSource');
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

        btnManageFunctionSource_click(evt) {
            var baseDataID = syn.$l.get('txtBaseDataID_FunctionSource').value;
            var applicationID = syn.$l.get('txtApplicationID_FunctionSource').value.trim();
            var projectID = syn.$l.get('txtProjectID_FunctionSource').value.trim();
            var dataSourceID = syn.$l.get('txtDataSourceID_FunctionSource').value.trim();
            var dataProvider = syn.$l.get('ddlDataProvider_FunctionSource').value.trim();
            var connectionString = syn.$l.get('txtConnectionString_FunctionSource').value.trim();
            var isEncryption = syn.$l.get('chkIsEncryption').checked == true ? 'Y' : 'N';
            var workingDirectoryPath = syn.$l.get('txtWorkingDirectoryPath_FunctionSource').value.trim();
            var comment = syn.$l.get('txtComment_FunctionSource').value.trim();

            if (applicationID == '' || projectID == '' || dataSourceID == '' || dataProvider == '' || workingDirectoryPath == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var dataID = `${applicationID}|${projectID}|${dataSourceID}|${dataProvider}`;
            var items = $this.prop.moduleConfig.ModuleConfig.FunctionSource;
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
                        WorkingDirectoryPath: workingDirectoryPath,
                        IsEncryption: isEncryption,
                        Comment: comment
                    });
                }
            }
            else {
                var data = $this.method.getFunctionSource(baseDataID);
                if (data) {
                    data.ApplicationID = applicationID;
                    data.ProjectID = projectID;
                    data.DataSourceID = dataSourceID;
                    data.DataProvider = dataProvider;
                    data.ConnectionString = connectionString;
                    data.IsEncryption = isEncryption;
                    data.WorkingDirectoryPath = workingDirectoryPath;
                    data.Comment = comment;
                }
            }

            $this.method.sectionRender('FunctionSource');
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
            else if (elID == 'FunctionSource') {
                var el = syn.$l.get('mdlFunctionSource');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        dataID: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_FunctionSource').innerText = options.title;

                    var data = null;
                    if ($string.isNullOrEmpty(options.dataID) == false) {
                        data = $this.method.getFunctionSource(options.dataID);
                    }

                    if (data) {
                        syn.$l.get('txtApplicationID_FunctionSource').value = data.ApplicationID;
                        syn.$l.get('txtProjectID_FunctionSource').value = data.ProjectID;
                        syn.$l.get('txtDataSourceID_FunctionSource').value = data.DataSourceID;
                        syn.$l.get('ddlDataProvider_FunctionSource').value = data.DataProvider;
                        syn.$l.get('txtBaseDataID_FunctionSource').value = `${data.ApplicationID}|${data.ProjectID}|${data.DataSourceID}|${data.DataProvider}`;
                        syn.$l.get('txtConnectionString_FunctionSource').value = data.ConnectionString;
                        syn.$l.get('chkIsEncryption').checked = $string.toBoolean(data.IsEncryption);
                        syn.$l.get('txtWorkingDirectoryPath_FunctionSource').value = data.WorkingDirectoryPath;
                        syn.$l.get('txtComment_FunctionSource').value = data.Comment;
                    }
                    else {
                        syn.$l.get('txtApplicationID_FunctionSource').value = '';
                        syn.$l.get('txtProjectID_FunctionSource').value = '';
                        syn.$l.get('txtDataSourceID_FunctionSource').value = '';
                        syn.$l.get('ddlDataProvider_FunctionSource').value = 'SqlServer';
                        syn.$l.get('txtBaseDataID_FunctionSource').value = '';
                        syn.$l.get('txtConnectionString_FunctionSource').value = '';
                        syn.$l.get('chkIsEncryption').checked = false;
                        syn.$l.get('txtWorkingDirectoryPath_FunctionSource').value = '';
                        syn.$l.get('txtComment_FunctionSource').value = '';
                    }

                    $this.prop.modal = new bootstrap.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtApplicationID_FunctionSource').focus(); }, 100);
                }
            }
        },

        getFunctionSource(dataID) {
            var values = $array.split(dataID, '|');
            return $this.prop.moduleConfig.ModuleConfig.FunctionSource.find((item) => {
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
            else if (sectionID == 'FunctionSource') {
                var dataSource = {
                    items: $this.prop.moduleConfig.ModuleConfig.FunctionSource
                };

                $this.method.drawHtmlTemplate('tblFunctionSourceItems', 'tplFunctionSourceItem', dataSource);
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
