'use strict';
let $module_settings = {
    prop: {
        defaultConfig: {
            "ModuleID": "prompter",
            "Name": "prompter",
            "IsBundledWithHost": false,
            "Version": "1.0.0",
            "ModuleConfig": {
                "SystemID": "HANDSTACK",
                "ModuleBasePath": "../modules/prompter",
                "ContractBasePath": [
                    "../contracts/prompter"
                ],
                "BusinessServerUrl": "http://localhost:8000/transact/api/transaction/execute",
                "IsTransactionLogging": false,
                "ModuleLogFilePath": "../log/prompter/module.log",
                "IsLogServer": true,
                "LogServerUrl": "http://localhost:8000/logger/api/log/insert",
                "EventAction": [
                    "prompter.Events.ManagedRequest"
                ],
                "SubscribeAction": [],
                "LLMSource": [
                    {
                        "ApplicationID": "HDS",
                        "ProjectID": "*",
                        "DataSourceID": "LLM1",
                        "LLMProvider": "OpenAI",
                        "ApiKey": "[sk-proj-API...키]",
                        "ModelID": "gpt-3.5-turbo",
                        "Comment": "OpenAI 프롬프트 API"
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
                syn.$l.get('chkIsTransactionLogging').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsTransactionLogging);
                syn.$l.get('txtModuleLogFilePath').value = $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath;
                syn.$l.get('chkIsLogServer').checked = $string.toBoolean($this.prop.moduleConfig.ModuleConfig.IsLogServer);
                syn.$l.get('txtLogServerUrl').value = $this.prop.moduleConfig.ModuleConfig.LogServerUrl;

                $this.method.sectionRender('MediatorAction');
                $this.method.sectionRender('ContractBasePath');
                $this.method.sectionRender('LLMSource');
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
                    $this.prop.moduleConfig.ModuleConfig.IsTransactionLogging = $string.toBoolean(syn.$l.get('chkIsTransactionLogging').checked);
                    $this.prop.moduleConfig.ModuleConfig.ModuleLogFilePath = syn.$l.get('txtModuleLogFilePath').value;
                    $this.prop.moduleConfig.ModuleConfig.IsLogServer = $string.toBoolean(syn.$l.get('chkIsLogServer').checked);
                    $this.prop.moduleConfig.ModuleConfig.LogServerUrl = syn.$l.get('txtLogServerUrl').value;

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

        btnLLMSource_click() {
            $this.method.showModal('LLMSource', {
                dataID: '',
                title: 'LLMSource 추가'
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
            else if (baseTableID == 'tblLLMSource') {
                var baseEL = this.closest('tr');
                var values = baseEL.getAttribute('syn-value');
                $this.method.showModal('LLMSource', {
                    dataID: values,
                    title: 'LLMSource 수정'
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
            else if (baseTableID == 'tblLLMSource') {
                var baseEL = this.closest('tr');
                var baseDataID = baseEL.getAttribute('syn-value');

                var data = $this.method.getLLMSource(baseDataID);
                if (data) {
                    var items = $this.prop.moduleConfig.ModuleConfig.LLMSource;

                    $array.removeAt(items, items.indexOf(data));
                    $this.method.sectionRender('LLMSource');
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

        btnManageLLMSource_click(evt) {
            var baseDataID = syn.$l.get('txtBaseDataID_LLMSource').value;
            var applicationID = syn.$l.get('txtApplicationID_LLMSource').value.trim();
            var projectID = syn.$l.get('txtProjectID_LLMSource').value.trim();
            var dataSourceID = syn.$l.get('txtDataSourceID_LLMSource').value.trim();
            var dataProvider = syn.$l.get('ddlLLMProvider_LLMSource').value.trim();
            var apiKey = syn.$l.get('txtApiKey_LLMSource').value.trim();
            var modelID = syn.$l.get('txtModelID_LLMSource').value.trim();
            var comment = syn.$l.get('txtComment_LLMSource').value.trim();

            if (applicationID == '' || projectID == '' || dataSourceID == '' || dataProvider == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var dataID = `${applicationID}|${projectID}|${dataSourceID}|${dataProvider}`;
            var items = $this.prop.moduleConfig.ModuleConfig.LLMSource;
            if (baseDataID == '') {
                if (items.includes(dataID) == true) {
                    syn.$w.notify('information', `중복된 데이터 원본을 입력 할 수 없습니다.`);
                    return;
                }
                else {
                    items.push({
                        ApplicationID: applicationID,
                        ProjectID: projectID,
                        DataSourceID: dataSourceID,
                        LLMProvider: dataProvider,
                        ApiKey: apiKey,
                        ModelID: modelID,
                        Comment: comment
                    });
                }
            }
            else {
                var data = $this.method.getLLMSource(baseDataID);
                if (data) {
                    data.ApplicationID = applicationID;
                    data.ProjectID = projectID;
                    data.DataSourceID = dataSourceID;
                    data.LLMProvider = dataProvider;
                    data.ApiKey = apiKey;
                    data.ModelID = modelID;
                    data.Comment = comment;
                }
            }

            $this.method.sectionRender('LLMSource');
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
            else if (elID == 'LLMSource') {
                var el = syn.$l.get('mdlLLMSource');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        dataID: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_LLMSource').innerText = options.title;

                    var data = null;
                    if ($string.isNullOrEmpty(options.dataID) == false) {
                        data = $this.method.getLLMSource(options.dataID);
                    }

                    if (data) {
                        syn.$l.get('txtApplicationID_LLMSource').value = data.ApplicationID;
                        syn.$l.get('txtProjectID_LLMSource').value = data.ProjectID;
                        syn.$l.get('txtDataSourceID_LLMSource').value = data.DataSourceID;
                        syn.$l.get('ddlLLMProvider_LLMSource').value = data.LLMProvider;
                        syn.$l.get('txtBaseDataID_LLMSource').value = `${data.ApplicationID}|${data.ProjectID}|${data.DataSourceID}|${data.LLMProvider}`;
                        syn.$l.get('txtApiKey_LLMSource').value = data.ApiKey;
                        syn.$l.get('txtModelID_LLMSource').value = data.ModelID;
                        syn.$l.get('txtComment_LLMSource').value = data.Comment;
                    }
                    else {
                        syn.$l.get('txtApplicationID_LLMSource').value = '';
                        syn.$l.get('txtProjectID_LLMSource').value = '';
                        syn.$l.get('txtDataSourceID_LLMSource').value = '';
                        syn.$l.get('ddlLLMProvider_LLMSource').value = 'SqlServer';
                        syn.$l.get('txtBaseDataID_LLMSource').value = '';
                        syn.$l.get('txtApiKey_LLMSource').value = '';
                        syn.$l.get('txtModelID_LLMSource').value = '';
                        syn.$l.get('txtComment_LLMSource').value = '';
                    }

                    $this.prop.modal = new bootstrap.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtApplicationID_LLMSource').focus(); }, 100);
                }
            }
        },

        getLLMSource(dataID) {
            var values = $array.split(dataID, '|');
            return $this.prop.moduleConfig.ModuleConfig.LLMSource.find((item) => {
                return item.ApplicationID == values[0]
                    && item.ProjectID == values[1]
                    && item.DataSourceID == values[2]
                    && item.LLMProvider == values[3]
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
            else if (sectionID == 'LLMSource') {
                var dataSource = {
                    items: $this.prop.moduleConfig.ModuleConfig.LLMSource
                };

                $this.method.drawHtmlTemplate('tblLLMSourceItems', 'tplLLMSourceItem', dataSource);
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
