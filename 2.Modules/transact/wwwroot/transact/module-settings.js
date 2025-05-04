'use strict';
let $module_settings = {
    prop: {
        defaultConfig: {
            "ModuleID": "transact",
            "Name": "transact",
            "IsBundledWithHost": false,
            "Version": "1.0.0",
            "ModuleConfig": {
                "SystemID": "HANDSTACK",
                "BusinessServerUrl": "http://localhost:8000/transact/api/transaction/execute",
                "CircuitBreakResetSecond": 60,
                "IsValidationRequest": false,
                "IsAllowDynamicRequest": false,
                "AllowTenantTransactionCommands": ["D"],
                "IsLogServer": true,
                "IsTransactAggregate": true,
                "IsDataMasking": false,
                "MaskingChar": "*",
                "MaskingMethod": "Syn",
                "ContractBasePath": [
                    "../contracts/transact"
                ],
                "AvailableEnvironment": [ "P", "D", "S" ],
                "LogServerUrl": "http://localhost:8000/logger/api/log/insert",
                "IsCodeDataCache": true,
                "CodeDataCacheTimeout": 20,
                "ModuleBasePath": "../modules/transact",
                "TransactionLogBasePath": "../sqlite/aggregate",
                "TrustedProxyIP": "1.1.1.1",
                "UseApiAuthorize": false,
                "BypassAuthorizeIP": [
                    "localhost",
                    "127.0.0.1"
                ],
                "AllowRequestTransactions": {
                    "HDS": ["*"]
                },
                "RoutingCommandUri": {
                    "HDS|*|D|D": "http://localhost:8000/dbclient/api/query",
                    "HDS|*|F|D": "http://localhost:8000/function/api/execution",
                    "HDS|*|P|D": "http://localhost:8000/prompter/api/query",
                    "HDS|*|D|P": "http://localhost:8000/dbclient/api/query",
                    "HDS|*|F|P": "http://localhost:8000/function/api/execution",
                    "HDS|*|P|P": "http://localhost:8000/prompter/api/query",
                    "HDS|*|D|T": "http://localhost:8000/dbclient/api/query",
                    "HDS|*|F|T": "http://localhost:8000/function/api/execution",
                    "HDS|*|P|T": "http://localhost:8000/prompter/api/query"
                },
                "EventAction": [],
                "SubscribeAction": [
                    "transact.Events.TransactRequest"
                ],
                "PublicTransactions": [
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "TransactionID": "*"
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
                syn.$l.get('chkIsValidationRequest').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsValidationRequest);
                syn.$l.get('chkIsAllowDynamicRequest').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsAllowDynamicRequest);
                syn.uicontrols.$multiselect.setSelectedValue('ddlAllowTenantTransactionCommands', $this.prop.moduleConfig.ModuleConfig.AllowTenantTransactionCommands);
                syn.$l.get('chkIsLogServer').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsLogServer);
                syn.$l.get('chkIsTransactAggregate').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsTransactAggregate);
                syn.$l.get('chkIsDataMasking').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsDataMasking);
                syn.$l.get('txtMaskingChar').value = $this.prop.moduleConfig.ModuleConfig.MaskingChar;
                syn.$l.get('ddlMaskingMethod').value = $this.prop.moduleConfig.ModuleConfig.MaskingMethod;
                syn.uicontrols.$multiselect.setSelectedValue('ddlAvailableEnvironment', $this.prop.moduleConfig.ModuleConfig.AvailableEnvironment);
                syn.$l.get('txtLogServerUrl').value = $this.prop.moduleConfig.ModuleConfig.LogServerUrl;
                syn.$l.get('chkIsCodeDataCache').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsCodeDataCache);
                syn.$l.get('txtCodeDataCacheTimeout').value = $string.isNumber($this.prop.moduleConfig.ModuleConfig.CodeDataCacheTimeout) == true ? $string.toNumber($this.prop.moduleConfig.ModuleConfig.CodeDataCacheTimeout) : 20;
                syn.$l.get('txtModuleBasePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleBasePath;
                syn.$l.get('txtTransactionLogBasePath').value = $this.prop.moduleConfig.ModuleConfig.TransactionLogBasePath;
                syn.$l.get('txtTrustedProxyIP').value = $this.prop.moduleConfig.ModuleConfig.TrustedProxyIP;
                syn.$l.get('chkUseApiAuthorize').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.UseApiAuthorize);
                syn.$l.get('txtBypassAuthorizeIP').value = $this.prop.moduleConfig.ModuleConfig.BypassAuthorizeIP;

                $this.method.sectionRender('MediatorAction');
                $this.method.sectionRender('ContractBasePath');
                $this.method.sectionRender('AllowRequestTransaction');
                $this.method.sectionRender('RoutingCommandUri');
                $this.method.sectionRender('PublicTransaction');
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
                    $this.prop.moduleConfig.ModuleConfig.CircuitBreakResetSecond = $string.isNumber(syn.$l.get('txtCircuitBreakResetSecond').value) ? $string.toNumber(syn.$l.get('txtCircuitBreakResetSecond').value) : 60;

                    $this.prop.moduleConfig.ModuleConfig.IsValidationRequest = syn.$l.get('chkIsValidationRequest').checked;
                    $this.prop.moduleConfig.ModuleConfig.IsAllowDynamicRequest = syn.$l.get('chkIsAllowDynamicRequest').checked;
                    $this.prop.moduleConfig.ModuleConfig.AllowTenantTransactionCommands = syn.uicontrols.$multiselect.getSelectedValue('ddlAllowTenantTransactionCommands');
                    $this.prop.moduleConfig.ModuleConfig.IsLogServer = syn.$l.get('chkIsLogServer').checked;
                    $this.prop.moduleConfig.ModuleConfig.IsTransactAggregate = syn.$l.get('chkIsTransactAggregate').checked;
                    $this.prop.moduleConfig.ModuleConfig.IsDataMasking = syn.$l.get('chkIsDataMasking').checked;
                    $this.prop.moduleConfig.ModuleConfig.MaskingChar = syn.$l.get('txtMaskingChar').value;
                    syn.$l.get('ddlMaskingMethod').value = $this.prop.moduleConfig.ModuleConfig.MaskingMethod;
                    $this.prop.moduleConfig.ModuleConfig.AvailableEnvironment = syn.uicontrols.$multiselect.getSelectedValue('ddlAvailableEnvironment');
                    $this.prop.moduleConfig.ModuleConfig.LogServerUrl = syn.$l.get('txtLogServerUrl').value;
                    $this.prop.moduleConfig.ModuleConfig.IsCodeDataCache = syn.$l.get('chkIsCodeDataCache').checked;
                    $this.prop.moduleConfig.ModuleConfig.CodeDataCacheTimeout = $string.isNumber(syn.$l.get('txtCodeDataCacheTimeout').value) ? $string.toNumber(syn.$l.get('txtCodeDataCacheTimeout').value) : 20;
                    $this.prop.moduleConfig.ModuleConfig.ModuleBasePath = syn.$l.get('txtModuleBasePath').value;
                    $this.prop.moduleConfig.ModuleConfig.TransactionLogBasePath = syn.$l.get('txtTransactionLogBasePath').value;
                    $this.prop.moduleConfig.ModuleConfig.UseApiAuthorize = syn.$l.get('chkUseApiAuthorize').checked;
                    $this.prop.moduleConfig.ModuleConfig.BypassAuthorizeIP = $array.split(syn.$l.get('txtBypassAuthorizeIP').value);;

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

        btnAllowRequestTransaction_click() {
            $this.method.showModal('AllowRequestTransaction', {
                dataID: '',
                title: 'AllowRequestTransaction 추가'
            });
        },

        btnRoutingCommandUri_click() {
            $this.method.showModal('RoutingCommandUri', {
                dataID: '',
                title: 'RoutingCommandUri 추가'
            });
        },

        btnPublicTransaction_click() {
            $this.method.showModal('PublicTransaction', {
                dataID: '',
                title: 'PublicTransaction 추가'
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
            else if (baseTableID == 'tblAllowRequestTransaction') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                var key = baseEL.querySelector('td:nth-child(1)').innerText.trim();
                var value = baseEL.querySelector('td:nth-child(2)').innerText.trim();
                $this.method.showModal('AllowRequestTransaction', {
                    key: key,
                    value: value,
                    title: 'AllowRequestTransaction 수정'
                });
            }
            else if (baseTableID == 'tblRoutingCommandUri') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                var key = baseEL.querySelector('td:nth-child(1)').innerText.trim();
                var value = baseEL.querySelector('td:nth-child(2)').innerText.trim();
                $this.method.showModal('RoutingCommandUri', {
                    key: key,
                    value: value,
                    title: 'RoutingCommandUri 수정'
                });
            }
            else if (baseTableID == 'tblPublicTransaction') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                $this.method.showModal('PublicTransaction', {
                    dataID: values,
                    title: 'PublicTransaction 수정'
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
            else if (baseTableID == 'tblAllowRequestTransaction') {
                var baseEL = this.closest('tr');
                var baseDataID = baseEL.getAttribute('syn-value');

                var data = $this.prop.moduleConfig.ModuleConfig.AllowRequestTransactions[baseDataID];
                if (data && data.length > 0) {
                    delete items[baseDataID];
                    $this.method.sectionRender('AllowRequestTransaction');
                }
            }
            else if (baseTableID == 'tblRoutingCommandUri') {
                var baseEL = this.closest('tr');
                var baseDataID = baseEL.getAttribute('syn-value');

                var data = $this.prop.moduleConfig.ModuleConfig.RoutingCommandUri[baseDataID];
                if (data) {
                    var items = $this.prop.moduleConfig.ModuleConfig.RoutingCommandUri;
                    delete items[baseDataID];
                    $this.method.sectionRender('RoutingCommandUri');
                }
            }
            else if (baseTableID == 'tblPublicTransaction') {
                var baseEL = this.closest('tr');
                var baseDataID = baseEL.getAttribute('syn-value');

                var data = $this.method.getPublicTransaction(baseDataID);
                if (data) {
                    var items = $this.prop.moduleConfig.ModuleConfig.PublicTransactions;

                    $array.removeAt(items, items.indexOf(data));
                    $this.method.sectionRender('PublicTransaction');
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

        btnManageAllowRequestTransaction_click(evt) {
            var baseDataID = syn.$l.get('txtBaseDataID_AllowRequestTransaction').value;
            var routing = syn.$l.get('txtKey_AllowRequestTransaction').value.trim();
            var commandUri = syn.$l.get('txtValue_AllowRequestTransaction').value.trim();

            if (routing == '' || commandUri == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var dataID = `${routing}`;
            var items = $this.prop.moduleConfig.ModuleConfig.AllowRequestTransactions;
            if (baseDataID == '') {
                items[dataID] = commandUri;
            }
            else {
                delete items[baseDataID];
                items[dataID] = commandUri;
            }

            $this.method.sectionRender('AllowRequestTransaction');
            $this.prop.modal.hide();
        },

        btnManageRoutingCommandUri_click(evt) {
            var baseDataID = syn.$l.get('txtBaseDataID_RoutingCommandUri').value;
            var applicationID = syn.$l.get('txtKey_RoutingCommandUri').value.trim();
            var projectID = syn.$l.get('txtValue_RoutingCommandUri').value.trim();

            if (applicationID == '' || projectID == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var dataID = `${applicationID}`;
            var items = $this.prop.moduleConfig.ModuleConfig.RoutingCommandUri;
            if (baseDataID == '') {
                items[dataID] = projectID;
            }
            else {
                delete items[baseDataID];
                items[dataID] = projectID;
            }

            $this.method.sectionRender('RoutingCommandUri');
            $this.prop.modal.hide();
        },

        btnManagePublicTransaction_click(evt) {
            var baseDataID = syn.$l.get('txtBaseDataID_PublicTransaction').value;
            var applicationID = syn.$l.get('txtApplicationID_PublicTransaction').value.trim();
            var projectID = syn.$l.get('txtProjectID_PublicTransaction').value.trim();
            var transactionID = syn.$l.get('txtTransactionID_PublicTransaction').value.trim();

            if (applicationID == '' || projectID == '' || transactionID == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var dataID = `${applicationID}|${projectID}|${transactionID}`;
            var items = $this.prop.moduleConfig.ModuleConfig.PublicTransactions;
            if (baseDataID == '') {
                if (items.includes(dataID) == true) {
                    syn.$w.alert(`중복된 항목을 입력 할 수 없습니다.`);
                    return;
                }
                else {
                    items.push({
                        ApplicationID: applicationID,
                        ProjectID: projectID,
                        TransactionID: transactionID,
                    });
                }
            }
            else {
                var data = $this.method.getPublicTransaction(baseDataID);
                if (data) {
                    data.ApplicationID = applicationID;
                    data.ProjectID = projectID;
                    data.TransactionID = transactionID;
                }
            }

            $this.method.sectionRender('PublicTransaction');
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
            else if (elID == 'AllowRequestTransaction') {
                var el = syn.$l.get('mdlAllowRequestTransaction');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        key: '',
                        value: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_AllowRequestTransaction').innerText = options.title;

                    var data = null;
                    if ($string.isNullOrEmpty(options.key) == false) {
                        data = $this.prop.moduleConfig.ModuleConfig.AllowRequestTransactions[options.key];
                    }

                    if (data && data.length > 0) {
                        syn.$l.get('txtBaseDataID_AllowRequestTransaction').value = options.key;
                        syn.$l.get('txtKey_AllowRequestTransaction').value = options.key;
                        syn.$l.get('txtValue_AllowRequestTransaction').value = options.value;
                    }
                    else {
                        syn.$l.get('txtBaseDataID_AllowRequestTransaction').value = '';
                        syn.$l.get('txtKey_AllowRequestTransaction').value = '';
                        syn.$l.get('txtValue_AllowRequestTransaction').value = '';
                    }

                    $this.prop.modal = new bootstrap.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtKey_AllowRequestTransaction').focus(); }, 100);
                }
            }
            else if (elID == 'RoutingCommandUri') {
                var el = syn.$l.get('mdlRoutingCommandUri');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        key: '',
                        value: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_RoutingCommandUri').innerText = options.title;

                    var data = null;
                    if ($string.isNullOrEmpty(options.key) == false) {
                        data = $this.prop.moduleConfig.ModuleConfig.RoutingCommandUri[options.key];
                    }

                    if (data) {
                        syn.$l.get('txtBaseDataID_RoutingCommandUri').value = options.key;
                        syn.$l.get('txtKey_RoutingCommandUri').value = options.key;
                        syn.$l.get('txtValue_RoutingCommandUri').value = options.value;
                    }
                    else {
                        syn.$l.get('txtBaseDataID_RoutingCommandUri').value = '';
                        syn.$l.get('txtKey_RoutingCommandUri').value = '';
                        syn.$l.get('txtValue_RoutingCommandUri').value = '';
                    }

                    $this.prop.modal = new bootstrap.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtKey_RoutingCommandUri').focus(); }, 100);
                }
            }
            else if (elID == 'PublicTransaction') {
                var el = syn.$l.get('mdlPublicTransaction');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        dataID: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_PublicTransaction').innerText = options.title;

                    var data = null;
                    if ($string.isNullOrEmpty(options.dataID) == false) {
                        data = $this.method.getPublicTransaction(options.dataID);
                    }

                    if (data) {
                        syn.$l.get('txtApplicationID_PublicTransaction').value = data.ApplicationID;
                        syn.$l.get('txtProjectID_PublicTransaction').value = data.ProjectID;
                        syn.$l.get('txtTransactionID_PublicTransaction').value = data.TransactionID;
                        syn.$l.get('txtBaseDataID_PublicTransaction').value = `${data.ApplicationID}|${data.ProjectID}|${data.TransactionID}`;
                    }
                    else {
                        syn.$l.get('txtApplicationID_PublicTransaction').value = '';
                        syn.$l.get('txtProjectID_PublicTransaction').value = '';
                        syn.$l.get('txtTransactionID_PublicTransaction').value = '';
                        syn.$l.get('txtBaseDataID_PublicTransaction').value = '';
                    }

                    $this.prop.modal = new bootstrap.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtApplicationID_PublicTransaction').focus(); }, 100);
                }
            }
        },

        getPublicTransaction(dataID) {
            var values = $array.split(dataID, '|');
            return $this.prop.moduleConfig.ModuleConfig.PublicTransactions.find((item) => {
                return item.ApplicationID == values[0]
                    && item.ProjectID == values[1]
                    && item.TransactionID == values[2]
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
            else if (sectionID == 'AllowRequestTransaction') {
                var dataSource = {
                    items: []
                };

                for (const [key, value] of Object.entries($this.prop.moduleConfig.ModuleConfig.AllowRequestTransactions)) {
                    dataSource.items.push({
                        Key: key,
                        Value: value
                    });
                }

                $this.method.drawHtmlTemplate('tblAllowRequestTransactionItems', 'tplKeyValueItem', dataSource);
            }
            else if (sectionID == 'RoutingCommandUri') {
                var dataSource = {
                    items: []
                };

                for (const [key, value] of Object.entries($this.prop.moduleConfig.ModuleConfig.RoutingCommandUri)) {
                    dataSource.items.push({
                        Key: key,
                        Value: value
                    });
                }

                $this.method.drawHtmlTemplate('tblRoutingCommandUriItems', 'tplKeyValueItem', dataSource);
            }
            else if (sectionID == 'PublicTransaction') {
                var dataSource = {
                    items: $this.prop.moduleConfig.ModuleConfig.PublicTransactions
                };

                $this.method.drawHtmlTemplate('tblPublicTransactionItems', 'tplPublicTransactionItem', dataSource);
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
