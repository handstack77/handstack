'use strict';
let $main = {
    config: {
        dataSource: {
            Empty: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: '',
                        CodeValue: ''
                    }
                ]
            },
            QueryType: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: 'I',
                        CodeValue: 'Insert'
                    },
                    {
                        CodeID: 'U',
                        CodeValue: 'Update'
                    },
                    {
                        CodeID: 'D',
                        CodeValue: 'Delete'
                    },
                    {
                        CodeID: 'G',
                        CodeValue: 'Get Row'
                    },
                    {
                        CodeID: 'L',
                        CodeValue: 'List'
                    },
                    {
                        CodeID: 'A',
                        CodeValue: 'All'
                    }
                ]
            },
            ReturnType: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: 'Json',
                        CodeValue: 'Json'
                    },
                    {
                        CodeID: 'Xml',
                        CodeValue: 'Xml'
                    },
                    {
                        CodeID: 'Scalar',
                        CodeValue: 'Scalar'
                    },
                    {
                        CodeID: 'NonQuery',
                        CodeValue: '없음'
                    }
                ]
            },
            ExecuteType: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: 'D',
                        CodeValue: '데이터베이스'
                    },
                    {
                        CodeID: 'F',
                        CodeValue: '함수'
                    }
                ]
            }
        }
    },

    prop: {
        resizeTimerID: null,
        windowWidth: null,
        windowHeight: null,

        menus: null,
        chromeTabs: null,

        root_node: null,
        gnb_nodes: [],
        search_nodes: [],

        selectedGnbID: '',
        selectedLnbID: '',

        recentMenus: [],

        timerID: null,
        cookieCheckTryCount: 0,
        timerRunning: false,
        timerDelay: 6000,
        isUserLogout: false,
        editorControls: [],

        appFileItems: [],
        focusTreeNode: null,
        functionType: ''
    },

    hook: {
        pageInit() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/js/syn.worker.js?r=' + syn.$l.random()).then(function (registration) {
                    syn.$l.eventLog('서비스 작업자 scriptURL:', registration.active.scriptURL);
                })
                .catch(function (error) {
                    syn.$l.eventLog('서비스 작업자:', error);
                });
            }

            document.onselectstart = function () { return true; };
            document.oncontextmenu = function () { return true; };

            var expireTicks = syn.$r.getCookie(syn.Config.CookiePrefixName + '.ExpireTicks');
            if (syn.$w.getStorage('expireTicks') == null && expireTicks) {
                syn.$w.setStorage('expireTicks', expireTicks, false);
            }

            if (syn.uicontrols.$sourceeditor) {
                window.require = {
                    paths: { 'vs': syn.uicontrols.$sourceeditor.defaultSetting.basePath },
                    'vs/nls': {
                        availableLanguages: {
                            '*': 'ko'
                        }
                    }
                };
                syn.$w.loadScript(syn.uicontrols.$sourceeditor.defaultSetting.basePath + '/loader.js');
                syn.$w.loadScript(syn.uicontrols.$sourceeditor.defaultSetting.basePath + '/editor/editor.main.nls.ko.js');
                syn.$w.loadScript(syn.uicontrols.$sourceeditor.defaultSetting.basePath + '/editor/editor.main.js');
            }
        },

        async pageLoad() {
            var tokenID = syn.$r.getCookie(syn.Config.CookiePrefixName + '.TokenID');
            var member = syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member');
            var variable = syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable');
            var bearerToken = syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken');

            if (syn.$w.ManagedApp.ExpiredAt.getTime() < (new Date()).getTime()) {
                syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
                syn.$w.removeStorage('handstack_managedapp', true);

                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'warning';
                alertOptions.buttonType = '1';
                syn.$w.alert('프로젝트 액세스 토큰이 만료되었습니다', '프로젝트 닫기', alertOptions, function (result) {
                    var tokenID = syn.$r.getCookie(syn.Config.CookiePrefixName + '.TokenID');
                    var member = syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member');
                    var variable = syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable');
                    var bearerToken = syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken');

                    if ($string.isNullOrEmpty(tokenID) == true
                        || $string.isNullOrEmpty(member) == true
                        || $string.isNullOrEmpty(variable) == true
                        || $string.isNullOrEmpty(bearerToken) == true) {
                        syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
                        syn.$w.removeStorage('handstack_managedapp', true);

                        location.href = 'account/signin.html';
                    }
                    else {
                        location.href = 'checkin.html';
                    }
                });
                return false;
            }

            if ($string.isNullOrEmpty(tokenID) == true
                || $string.isNullOrEmpty(member) == true
                || $string.isNullOrEmpty(variable) == true
                || $string.isNullOrEmpty(bearerToken) == true) {
                syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
                syn.$w.removeStorage('handstack_managedapp', true);

                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'warning';
                alertOptions.buttonType = '1';
                syn.$w.alert('보안상의 이유로 HandStack 액세스 토큰이 만료되었습니다. HandStack에 다시 로그인해야 합니다', 'System Logout', alertOptions, function (result) {
                    location.href = 'account/signin.html';
                });
                return false;
            }

            $this.method.startSessionTimer();

            var loginUserName = `${syn.$w.User.UserName} ${syn.$w.User.PositionName}`;
            syn.$l.get('lblLoginUserName1').innerText = loginUserName;
            syn.$l.get('lblLoginUserName2').innerText = loginUserName;

            var loginUserBelong = `${syn.$w.User.DepartmentName} [${syn.$w.User.CompanyName}]`;
            syn.$l.get('lblLoginUserBelong1').innerText = loginUserBelong;
            syn.$l.get('lblLoginUserBelong2').innerText = loginUserBelong;

            syn.$l.addEvent(window, 'storage', $this.event.window_storage);
            syn.$l.addEvent(window, 'resize', $this.event.window_resize);

            syn.$w.loadJson('/checkup/menus.json?tick=' + new Date().getTime(), null, function (mod, json) {
                if ($object.isObjectEmpty(json) == true) {
                    syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
                    syn.$w.removeStorage('handstack_managedapp', true);

                    var alertOptions = $object.clone(syn.$w.alertOptions);
                    alertOptions.icon = 'warning';
                    alertOptions.buttonType = '1';
                    syn.$w.alert('프로젝트 정보를 확인 해야합니다', '프로젝트 닫기', alertOptions, function (result) {
                        location.href = 'checkin.html';
                    });
                    return;
                }

                $this.isUILog = false;
                $this.prop.menus = json;

                $this.method.concreateMenuControl();
                $this.event.icoDashBoard_click();
            }, null, true);

            var el = document.querySelector('.chrome-tabs');
            syn.$l.addEvent(el, 'activeTabChange', $this.event.menuTab_activeTabChange);
            syn.$l.addEvent(el, 'tabAdd', $this.event.menuTab_tabAdd);
            syn.$l.addEvent(el, 'tabRemove', $this.event.menuTab_tabRemove);

            syn.$l.addEvent('icoDashBoard', 'click', $this.event.icoDashBoard_click);
            syn.$l.addEvent('btnMenuSelector', 'click', $this.event.btnMenuSelector_click);
            syn.$l.addEvent('btnOffCanvas', 'click', (evt) => {
                syn.$m.toggleClass('divOffcanvasEnd', 'show');
                syn.$m.toggleClass('divOffCanvasBackdrop', 'hidden');
            });

            syn.$l.addEvent('btnCloseOffCanvas', 'click', (evt) => {
                syn.$m.toggleClass('divOffcanvasEnd', 'show');
                syn.$m.toggleClass('divOffCanvasBackdrop', 'hidden');
            });

            syn.$l.addEvent('btnCloseProject', 'click', (evt) => {
                $this.method.stopSessionTimer();

                syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
                syn.$w.removeStorage('program_token', true);
                syn.$w.removeStorage('handstack_managedapp', true);
                setTimeout(() => {
                    location.href = `/checkup/checkin.html?tick=${(new Date()).getTime()}`;
                }, 200);
            });

            syn.$l.addEvent('btnLogout', 'click', (evt) => {
                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'question';
                alertOptions.buttonType = '2';
                syn.$w.alert($resource.translations.isLogOut, 'System Logout', alertOptions, function (result) {
                    if (result == 'OK') {
                        $this.prop.isUserLogout = true;
                        $this.method.logout();
                    }
                });
            });

            $this.prop.chromeTabs = new ChromeTabs();
            $this.prop.chromeTabs.init(el);

            $this.method.refreshAppFileItems();
        }
    },

    event: {
        btnViewPreview_click(evt) {

        },

        window_storage(evt) {
            if (evt.key == 'handstack_managedapp' && evt.oldValue != evt.newValue && evt.oldValue) {
                location.href = `/checkup/checkin.html?tick=${(new Date()).getTime()}`;
            }
            else if (evt.key == 'handstack_managedapp' && evt.oldValue != null && evt.newValue == null) {
                location.href = `/checkup/checkin.html?tick=${(new Date()).getTime()}`;
            }
        },

        btnConfirmFunctionCreateItem_click() {
            var tplFunctionContractItem = syn.$l.get('tplFunctionContractItem').textContent;
            var nodeData = $this.prop.focusTreeNode.node.data;

            var functionLanguage = syn.$l.get('txtFunctionLanguage').value.trim();
            var itemID = syn.$l.get('txtFunctionItemName').value.trim();
            if (itemID == '') {
                syn.$w.alert('항목 ID를 입력하세요');
                syn.$l.get('txtFunctionItemName').focus();
                return false;
            }

            var ddlFunctionDataSource = syn.$l.get('ddlFunctionDataSource');
            var dataSourceID = ddlFunctionDataSource.value.trim();
            if (dataSourceID == '') {
                syn.$w.alert('데이터 소스 ID를 입력하세요');
                syn.$l.get('txtFunctionItemName').focus();
                return false;
            }

            var gridID = 'grdFeatureFunctionConfiguration';
            if (syn.uicontrols.$grid.checkEmptyValueCol(gridID, '변수 ID') == true) {
                syn.$w.alert('추가 설정의 변수 ID를 입력하세요');
                return false;
            }

            var dataSource = {
                applicationID: syn.$w.ManagedApp.ApplicationID,
                projectID: nodeData.menuName,
                transactionID: itemID,
                dataSourceID: dataSourceID,
                languageType: syn.$l.get('txtFunctionLanguage').value,
                configurations: [],
                comment: syn.$l.get('txtFunctionComment').value.trim(),
                commands: []
            };

            var rowCount = syn.uicontrols.$grid.countRows(gridID);
            for (var i = 0, iLength = rowCount; i < iLength; i++) {
                var item = syn.uicontrols.$grid.getSourceDataAtRow(gridID, i);

                dataSource.configurations.push({
                    id: item.ID,
                    value: item.Value,
                });
            }

            gridID = 'grdFeatureFunctionItem';
            var rowCount = syn.uicontrols.$grid.countRows(gridID);
            for (var i = 0, iLength = rowCount; i < iLength; i++) {
                var item = syn.uicontrols.$grid.getSourceDataAtRow(gridID, i);

                var command = {
                    featureID: item.FeatureID,
                    seq: item.Sequence.toString(),
                    comment: item.Comment,
                    createAt: $date.toString(new Date(), 'a'),
                    params: [],
                    comma: ((i + 1) < iLength ? true : false)
                };

                var entityNo = item.EntityNo;
                var entityFields = null;
                var entity = $this.config.dataSource.CHP014.DataSource.find((item) => { return item.EntityNo == entityNo });
                if (entity && $string.isNullOrEmpty(entity.EntityField) == false) {
                    entityFields = JSON.parse(entity.EntityField);
                    for (var j = 0, jLength = entityFields.length; j < jLength; j++) {
                        var entityField = entityFields[j];
                        var maxLength = entityField.MaxLength.toString();
                        command.params.push({
                            variableID: entityField.FieldID.substring(0, 1).toLowerCase() + entityField.FieldID.substring(1),
                            id: entityField.FieldID,
                            type: entityField.FieldType,
                            length: $string.isNumber(maxLength) == true ? maxLength : -1,
                            comma: ((j + 1) < jLength ? true : false)
                        });
                    }
                }

                dataSource.commands.push(command);
            }

            var renderText = Mustache.render(tplFunctionContractItem, dataSource);
            var itemPath = `function/${functionLanguage}/${nodeData.menuName}/${itemID}/featureMeta.json`;

            $this.method.createFileItem(itemID, itemPath, renderText, () => {
                if (functionLanguage == 'csharp') {
                    var tplFunctionCSharpItem = syn.$l.get('tplFunctionCSharpItem').textContent;
                    renderText = Mustache.render(tplFunctionCSharpItem, dataSource);
                    itemPath = `function/${functionLanguage}/${nodeData.menuName}/${itemID}/featureMain.cs`;
                }
                else if (functionLanguage == 'javascript') {
                    var tplFunctionJavascriptItem = syn.$l.get('tplFunctionJavascriptItem').textContent;
                    renderText = Mustache.render(tplFunctionJavascriptItem, dataSource);
                    itemPath = `function/${functionLanguage}/${nodeData.menuName}/${itemID}/featureMain.js`;
                }
                $this.method.createFileItem(itemID, itemPath, renderText, () => {
                    $this.method.refreshAppFileItems(() => {
                        var fancyNodes = syn.uicontrols.$tree.getControl('tvlTreeView').tree.findAll((node) => {
                            return node.data.menuID == itemPath;
                        });

                        if (fancyNodes && fancyNodes.length > 0) {
                            var fancyNode = fancyNodes[0];
                            var item = fancyNode.data;
                            if (item.menuType == 'F') {
                                $this.method.addTabUI(item);
                            }
                        }

                        setTimeout(() => {
                            itemPath = `function/${functionLanguage}/${nodeData.menuName}/${itemID}/featureMeta.json`;
                            var fancyNodes = syn.uicontrols.$tree.getControl('tvlTreeView').tree.findAll((node) => {
                                return node.data.menuID == itemPath;
                            });

                            if (fancyNodes && fancyNodes.length > 0) {
                                var fancyNode = fancyNodes[0];
                                var item = fancyNode.data;
                                if (item.menuType == 'F') {
                                    $this.method.addTabUI(item);
                                }
                            }
                        }, 600);
                    });
                });
            });
        },

        btnAddFunctionItemField_click() {
            syn.uicontrols.$grid.insertRow('grdFeatureFunctionItem', {
                amount: 1,
                values: {
                    Sequence: '0',
                },
                focusColumnID: 'FeatureID'
            });
        },

        btnRemoveFunctionItemField_click() {
            syn.uicontrols.$grid.removeRow('grdFeatureFunctionItem');
        },

        btnAddFunctionConfiguration_click() {
            syn.uicontrols.$grid.insertRow('grdFeatureFunctionConfiguration', {
                amount: 1,
                focusColumnID: 'ID'
            });
        },

        btnRemoveFunctionConfiguration_click() {
            syn.uicontrols.$grid.removeRow('grdFeatureFunctionConfiguration');
        },

        btnConfirmTransactCreateItem_click() {
            var gridID = 'grdFeatureTransactItem';
            var tplTransactItem = syn.$l.get('tplTransactItem').textContent;
            var nodeData = $this.prop.focusTreeNode.node.data;

            var itemID = syn.$l.get('txtTransactItemName').value.trim();
            if (itemID == '') {
                syn.$w.alert('항목 ID를 입력하세요');
                syn.$l.get('txtTransactItemName').focus();
                return false;
            }

            var transactionProjectID = syn.$l.get('txtTransactionProjectID').value.trim();
            if ($string.isNullOrEmpty(transactionProjectID) == true) {
                transactionProjectID = nodeData.menuName;
            }

            var dataSource = {
                applicationID: syn.$w.ManagedApp.ApplicationID,
                projectID: nodeData.menuName,
                transactionProjectID: transactionProjectID,
                transactionID: itemID,
                comment: syn.$l.get('txtTransactComment').value.trim(),
                createAt: $date.toString(new Date(), 'a'),
                services: []
            };

            var rowCount = syn.uicontrols.$grid.countRows(gridID);
            for (var i = 0, iLength = rowCount; i < iLength; i++) {
                var item = syn.uicontrols.$grid.getSourceDataAtRow(gridID, i);

                var service = {
                    serviceID: item.FeatureID,
                    authorize: $string.toBoolean(item.Authorize),
                    returnType: item.ReturnType,
                    commandType: item.CommandType,
                    transactionScope: $string.toBoolean(item.TransactionScope),
                    inputs: [],
                    outputs: [],
                    comma: ((i + 1) < iLength ? true : false)
                };

                var validateInputs = ['Row', 'List'];
                var validateOutputs = ['Form', 'Grid'];
                var dtis = item.DTI.split('|');
                if (dtis.length == 1) {
                    var inputText = dtis[0].trim();
                    if ($string.isNullOrEmpty(inputText) == false) {
                        var inputs = inputText.split(',');
                        for (var j = 0, jLength = inputs.length; j < jLength; j++) {
                            var input = inputs[j].trim();
                            if (validateInputs.indexOf(input) == -1) {
                                syn.$w.alert(`입력 DTI 항목은 ${validateInputs.join(', ')} 중에서 가능합니다`);
                                return;
                            }

                            service.inputs.push({ type: input, comma: ((j + 1) < jLength ? true : false) });
                        }
                    }
                }
                else if (dtis.length == 2) {
                    var inputText = dtis[0].trim();
                    if ($string.isNullOrEmpty(inputText) == false) {
                        var inputs = inputText.split(',');
                        for (var j = 0, jLength = inputs.length; j < jLength; j++) {
                            var input = inputs[j].trim();
                            if (validateInputs.indexOf(input) == -1) {
                                syn.$w.alert(`입력 DTI 항목은 ${validateInputs.join(', ')} 중에서 가능합니다`);
                                return;
                            }

                            service.inputs.push({ type: input, comma: ((j + 1) < jLength ? true : false) });
                        }
                    }

                    var outputText = dtis[1].trim();
                    if ($string.isNullOrEmpty(outputText) == false) {
                        var outputs = outputText.split(',');
                        for (var j = 0, jLength = outputs.length; j < jLength; j++) {
                            var output = outputs[j].trim();
                            if (validateOutputs.indexOf(output) == -1) {
                                syn.$w.alert(`출력 DTI 항목은 ${validateOutputs.join(', ')} 중에서 가능합니다`);
                                return;
                            }

                            service.outputs.push({ type: output, comma: ((j + 1) < jLength ? true : false) });
                        }
                    }
                }

                dataSource.services.push(service);
            }

            var renderText = Mustache.render(tplTransactItem, dataSource);
            var itemPath = `transact/${nodeData.menuName}/${itemID}.json`;
            $this.method.createFileItem(itemID, itemPath, renderText);
        },

        btnAddTransactItemField_click() {
            syn.uicontrols.$grid.insertRow('grdFeatureTransactItem', {
                amount: 1,
                values: {
                    Authorize: '0',
                    ReturnType: 'Json',
                    ReturnTypeName: 'Json',
                    CommandType: 'D',
                    CommandTypeName: '데이터베이스',
                    TransactionScope: '0',
                    DTI: 'Row,List|Form,Grid',
                },
                focusColumnID: 'FeatureID'
            });
        },

        btnRemoveTransactItemField_click() {
            syn.uicontrols.$grid.removeRow('grdFeatureTransactItem');
        },

        btnConfirmDbClientCreateItem_click() {
            var gridID = 'grdFeatureDbClientItem';
            var tplDbClientItem = syn.$l.get('tplDbClientItem').textContent;
            var nodeData = $this.prop.focusTreeNode.node.data;

            var itemID = syn.$l.get('txtDbClientItemName').value.trim();
            if (itemID == '') {
                syn.$w.alert('항목 ID를 입력하세요');
                syn.$l.get('txtDbClientItemName').focus();
                return false;
            }

            var ddlDbClientDataSource = syn.$l.get('ddlDbClientDataSource');
            var dataSourceID = ddlDbClientDataSource.value.trim();
            if (dataSourceID == '') {
                syn.$w.alert('데이터 소스 ID를 입력하세요');
                syn.$l.get('txtDbClientItemName').focus();
                return false;
            }

            var dataSource = {
                applicationID: syn.$w.ManagedApp.ApplicationID,
                projectID: nodeData.menuName,
                transactionID: itemID,
                dataSourceID: dataSourceID,
                comment: syn.$l.get('txtDbClientComment').value.trim(),
                statements: []
            };

            var rowCount = syn.uicontrols.$grid.countRows(gridID);
            for (var i = 0, iLength = rowCount; i < iLength; i++) {
                var item = syn.uicontrols.$grid.getSourceDataAtRow(gridID, i);

                var statement = {
                    featureID: item.FeatureID,
                    seq: item.Sequence.toString(),
                    comment: item.Comment,
                    createAt: $date.toString(new Date(), 'a'),
                    commandSql: '',
                    params: []
                };

                var entityNo = item.EntityNo;
                var entityFields = null;
                var entity = $this.config.dataSource.CHP014.DataSource.find((item) => { return item.EntityNo == entityNo });
                if (entity && $string.isNullOrEmpty(entity.EntityField) == false) {
                    entityFields = JSON.parse(entity.EntityField);
                    for (var j = 0, jLength = entityFields.length; j < jLength; j++) {
                        var entityField = entityFields[j];
                        var maxLength = entityField.MaxLength.toString();
                        statement.params.push({
                            id: entityField.FieldID,
                            type: entityField.FieldType,
                            length: $string.isNumber(maxLength) == true ? maxLength : '-1'
                        });
                    }
                }

                var qb = null;
                var acronyms = entity.Acronyms;
                var entityName = entity.EntityName.substring(0, entity.EntityName.indexOf(' ['));
                switch (item.CommandType) {
                    case 'I':
                        qb = squel.insert();
                        qb.into(entityName);

                        for (var j = 0, jLength = entityFields.length; j < jLength; j++) {
                            var entityField = entityFields[j];

                            qb.set(entityField.FieldID, `@${entityField.FieldID}`, { dontQuote: true });
                        }
                        break;
                    case 'U':
                        qb = squel.update();
                        qb.table(entityName);

                        for (var j = 0, jLength = entityFields.length; j < jLength; j++) {
                            var entityField = entityFields[j];

                            qb.set(entityField.FieldID, `@${entityField.FieldID}`, { dontQuote: true });
                        }

                        var fieldIndexs = entityFields.filter((item) => { return item.FieldIndex == 'Y' });
                        for (var k = 0; k < fieldIndexs.length; k++) {
                            var fieldIndex = fieldIndexs[k];
                            qb.where(`${fieldIndex.FieldID} = @${fieldIndex.FieldID}`);
                        }
                        break;
                    case 'D':
                        qb = squel.delete();
                        qb.from(entityName);

                        var fieldIndexs = entityFields.filter((item) => { return item.FieldIndex == 'Y' });
                        for (var k = 0; k < fieldIndexs.length; k++) {
                            var fieldIndex = fieldIndexs[k];
                            qb.where(`${fieldIndex.FieldID} = @${fieldIndex.FieldID}`);
                        }
                        break;
                    case 'G':
                    case 'L':
                    case 'A':
                        qb = squel.select({ autoQuoteAliasNames: false });
                        if ($string.isNullOrEmpty(acronyms) == true) {
                            qb.from(entityName);
                        }
                        else {
                            qb.from(entityName, acronyms);
                        }

                        for (var j = 0, jLength = entityFields.length; j < jLength; j++) {
                            var entityField = entityFields[j];

                            qb.field(`${$string.isNullOrEmpty(acronyms) == true ? '' : acronyms + '.'}${entityField.FieldID}`);
                        }

                        var fieldIndexs = entityFields.filter((item) => { return item.FieldIndex == 'Y' });
                        for (var k = 0; k < fieldIndexs.length; k++) {
                            var fieldIndex = fieldIndexs[k];
                            qb.where(`${$string.isNullOrEmpty(acronyms) == true ? '' : acronyms + '.'}${fieldIndex.FieldID} = @${fieldIndex.FieldID}`);
                        }
                        break;
                }

                statement.commandSql = qb.toString();

                var language = 'sql';
                var dataProvider = ddlDbClientDataSource.options[ddlDbClientDataSource.selectedIndex].getAttribute('provider');
                switch (dataProvider) {
                    case 'SqlServer':
                        language = 'tsql';
                        break;
                    case 'Oracle':
                        language = 'plsql';
                        break;
                    case 'MySQL':
                        language = 'mysql';
                        break;
                    case 'PostgreSQL':
                        language = 'postgresql';
                        break;
                    case 'SQLite':
                        language = 'sqlite';
                        break;
                }

                statement.commandSql = sqlFormatter.format(statement.commandSql, {
                    language: language,
                    tabWidth: 4,
                    useTabs: true,
                    keywordCase: 'preserve',
                    indentStyle: 'standard',
                    logicalOperatorNewline: 'before',
                    expressionWidth: '80',
                    denseOperators: false,
                    newlineBeforeSemicolon: false
                });

                dataSource.statements.push(statement);
            }

            var renderText = Mustache.render(tplDbClientItem, dataSource);

            var itemPath = `dbclient/${nodeData.menuName}/${itemID}.xml`;
            $this.method.createFileItem(itemID, itemPath, renderText);
        },

        btnAddDbClientItemField_click() {
            syn.uicontrols.$grid.insertRow('grdFeatureDbClientItem', {
                amount: 1,
                values: {
                    Sequence: '0',
                    CommandType: 'L',
                    CommandTypeName: 'List'
                },
                focusColumnID: 'FeatureID'
            });
        },

        btnRemoveDbClientItemField_click() {
            syn.uicontrols.$grid.removeRow('grdFeatureDbClientItem');
        },

        btnDevelopmentAddDirectory_click(evt, data) {
            if ($object.isNullOrUndefined($this.prop.focusTreeNode) == false) {
                var item = $this.prop.focusTreeNode.node.data;

                if ($string.isNullOrEmpty(item.parentMenuID) == true) {
                }
                else {
                    if (item.level == 2 && item.parentMenuID == syn.$w.ManagedApp.ApplicationID) {
                        if (item.menuID != 'function' && ['dbclient', 'transact', 'wwwroot/view'].indexOf(item.menuID) > -1) {
                            syn.$l.get('lblModuleDirectory').textContent = `${item.menuID} 신규 디렉토리`.replace('wwwroot/view', 'view');
                            syn.$l.get('txtProjectType').value = item.projectType;
                            syn.$l.get('txtDirectoryName').value = '';
                            syn.$w.showDialog(syn.$l.get('tplCreateDirectory'), {
                                minWidth: 540,
                                minHeight: 260
                            });
                            syn.$l.get('txtDirectoryName').focus();
                        }
                    }
                    else if (item.level == 3) {
                        if (item.parentMenuID == 'function') {
                            syn.$l.get('lblModuleDirectory').textContent = `${item.parentMenuID} 신규 디렉토리`;
                            syn.$l.get('txtProjectType').value = item.projectType;
                            $this.prop.functionType = item.menuName;
                            syn.$l.get('txtDirectoryName').value = '';
                            syn.$w.showDialog(syn.$l.get('tplCreateDirectory'), {
                                minWidth: 540,
                                minHeight: 260
                            });
                            syn.$l.get('txtDirectoryName').focus();
                        }
                    }
                }
            }
        },

        btnConfirmCreateView_click(evt, data) {
            var tplUIViewItem = syn.$l.get('tplUIViewItem').textContent;
            var nodeData = $this.prop.focusTreeNode.node.data;

            var itemID = syn.$l.get('txtViewItemName').value.trim();
            if (itemID == '') {
                syn.$w.alert('항목 ID를 입력하세요');
                syn.$l.get('txtViewItemName').focus();
                return false;
            }

            var dataSource = {
                applicationID: syn.$w.ManagedApp.ApplicationID,
                projectID: nodeData.menuName,
                itemID: itemID
            };

            var renderText = Mustache.render(tplUIViewItem, dataSource);
            var itemPath = `wwwroot/view/${nodeData.menuName}/${itemID}.html`;
            $this.method.createFileItem(itemID, itemPath, renderText, () => {
                var tplUIJavascriptItem = syn.$l.get('tplUIJavascriptItem').textContent;
                renderText = Mustache.render(tplUIJavascriptItem, dataSource);
                itemPath = `wwwroot/view/${nodeData.menuName}/${itemID}.js`;
                $this.method.createFileItem(itemID, itemPath, renderText, () => {
                    $this.method.refreshAppFileItems(() => {
                        var fancyNodes = syn.uicontrols.$tree.getControl('tvlTreeView').tree.findAll((node) => {
                            return node.data.menuID == itemPath;
                        });

                        if (fancyNodes && fancyNodes.length > 0) {
                            var fancyNode = fancyNodes[0];
                            var item = fancyNode.data;
                            if (item.menuType == 'F') {
                                $this.method.addTabUI(item);
                            }
                        }

                        setTimeout(() => {
                            itemPath = `wwwroot/view/${nodeData.menuName}/${itemID}.html`;
                            var fancyNodes = syn.uicontrols.$tree.getControl('tvlTreeView').tree.findAll((node) => {
                                return node.data.menuID == itemPath;
                            });

                            if (fancyNodes && fancyNodes.length > 0) {
                                var fancyNode = fancyNodes[0];
                                var item = fancyNode.data;
                                if (item.menuType == 'F') {
                                    $this.method.addTabUI(item);
                                }
                            }
                        }, 600);
                    });
                });
            });
        },

        btnConfirmCreateDirectory_click(evt, data) {
            if ($object.isNullOrUndefined($this.prop.focusTreeNode) == false) {
                var item = $this.prop.focusTreeNode.node.data;

                var itemPath = syn.$l.get('txtDirectoryName').value.trim();
                if (itemPath == '') {
                    syn.$w.alert('디렉토리 ID를 입력하세요');
                    return false;
                }

                itemPath = `${item.menuID}/${itemPath}`;

                syn.$w.closeDialog();

                var directObject = {
                    programID: syn.Config.ApplicationID,
                    businessID: 'SYS',
                    transactionID: 'SYS010',
                    functionID: 'IF01',
                    dataMapInterface: 'Row|Form',
                    inputObjects: [
                        { prop: 'ApplicationNo', val: syn.$w.ManagedApp.ApplicationNo },
                        { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                        { prop: 'UserNo', val: syn.$w.User.UserNo },
                        { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID },
                        { prop: 'ItemPath', val: itemPath },
                        { prop: 'ProjectType', val: item.projectType }
                    ]
                };

                syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                    var exception = responseData[0].value;
                    if ($string.toBoolean(exception.Error) == false) {
                        $this.method.refreshAppFileItems();
                    }
                    else {
                        syn.$w.notify('warning', `디렉토리를 생성하지 못했습니다. ${exception.Message}`);
                    }
                });
            }
        },

        btnDevelopmentAddFile_click(evt, data) {
            if ($object.isNullOrUndefined($this.prop.focusTreeNode) == false) {
                var item = $this.prop.focusTreeNode.node.data;
                if ($string.isNullOrEmpty(item.parentMenuID) == true) {
                }
                else {
                    if (item.level == 3) {
                        if (item.parentMenuID != 'function') {
                            switch (item.parentMenuID) {
                                case 'dbclient':
                                    syn.uicontrols.$grid.clear('grdFeatureDbClientItem');
                                    syn.uicontrols.$grid.dataRefresh('grdFeatureDbClientItem', {
                                        columnName: 'EntityName',
                                        dataSourceID: 'CHP014',
                                        parameters: `@ApplicationNo:${syn.$w.ManagedApp.ApplicationNo};@UserNo:${syn.$w.User.UserNo};#TenantID:${syn.$w.ManagedApp.UserWorkID}|${syn.$w.ManagedApp.ApplicationID};`,
                                        local: false,
                                        required: false
                                    }, function () {
                                        syn.uicontrols.$grid.insertRow('grdFeatureDbClientItem', {
                                            amount: 1,
                                            values: {
                                                FeatureID: 'LD01',
                                                Sequence: '0',
                                                CommandType: 'L',
                                                CommandTypeName: 'List'
                                            }
                                        });

                                        syn.uicontrols.$grid.insertRow('grdFeatureDbClientItem', {
                                            amount: 1,
                                            values: {
                                                FeatureID: 'GD01',
                                                Sequence: '0',
                                                CommandType: 'G',
                                                CommandTypeName: 'Get Row'
                                            }
                                        });

                                        syn.uicontrols.$grid.insertRow('grdFeatureDbClientItem', {
                                            amount: 1,
                                            values: {
                                                FeatureID: 'UD01',
                                                Sequence: '0',
                                                CommandType: 'U',
                                                CommandTypeName: 'Update'
                                            }
                                        });

                                        syn.uicontrols.$grid.insertRow('grdFeatureDbClientItem', {
                                            amount: 1,
                                            values: {
                                                FeatureID: 'ID01',
                                                Sequence: '0',
                                                CommandType: 'I',
                                                CommandTypeName: 'Insert'
                                            }
                                        });

                                        syn.uicontrols.$grid.insertRow('grdFeatureDbClientItem', {
                                            amount: 1,
                                            values: {
                                                FeatureID: 'DD01',
                                                Sequence: '0',
                                                CommandType: 'D',
                                                CommandTypeName: 'Delete'
                                            }
                                        });
                                    });

                                    var directObject = {
                                        programID: syn.Config.ApplicationID,
                                        businessID: 'SYS',
                                        transactionID: 'SYS010',
                                        functionID: 'LF03',
                                        dataMapInterface: 'Row|Form,Grid',
                                        inputObjects: [
                                            { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                                            { prop: 'UserNo', val: syn.$w.User.UserNo },
                                            { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID }
                                        ]
                                    };

                                    syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                                        if (responseData.length == 2) {
                                            var dataSource = responseData[1].value;
                                            var optionText = '<option value="#{DataSourceID}" title="#{Comment}" provider="#{DataProvider}">#{DataSourceID} (#{DataProvider})</option>';
                                            syn.$l.get('ddlDbClientDataSource').innerHTML = $string.interpolate(optionText, dataSource);
                                            syn.$l.get('lblDbClientModuleItem').textContent = `${item.menuID} 신규 항목`;
                                            syn.$l.get('txtDbClientItemName').value = '';
                                            syn.$l.get('txtDbClientComment').value = '';

                                            syn.$w.showDialog(syn.$l.get('tplCreateDbClientItem'), {
                                                minWidth: 1080,
                                                minHeight: 428
                                            });

                                            syn.uicontrols.$grid.getGridControl('grdFeatureDbClientItem').render();
                                            syn.$l.get('txtDbClientItemName').focus();
                                        }
                                        else {
                                            syn.$w.alert(`$태넌트 앱 데이터 소스 정보를 조회하지 못했습니다`);
                                        }
                                    });
                                    break;
                                case 'transact':
                                    syn.uicontrols.$grid.clear('grdFeatureTransactItem');
                                    syn.uicontrols.$grid.insertRow('grdFeatureTransactItem', {
                                        amount: 1,
                                        values: {
                                            FeatureID: 'LD01',
                                            Authorize: '0',
                                            ReturnType: 'Json',
                                            ReturnTypeName: 'Json',
                                            CommandType: 'D',
                                            CommandTypeName: '데이터베이스',
                                            TransactionScope: '0',
                                            DTI: 'Row|Grid',
                                        }
                                    });

                                    syn.uicontrols.$grid.insertRow('grdFeatureTransactItem', {
                                        amount: 1,
                                        values: {
                                            FeatureID: 'GD01',
                                            Authorize: '0',
                                            ReturnType: 'Json',
                                            ReturnTypeName: 'Json',
                                            CommandType: 'D',
                                            CommandTypeName: '데이터베이스',
                                            TransactionScope: '0',
                                            DTI: 'Row|Form',
                                        }
                                    });

                                    syn.uicontrols.$grid.insertRow('grdFeatureTransactItem', {
                                        amount: 1,
                                        values: {
                                            FeatureID: 'UD01',
                                            Authorize: '1',
                                            ReturnType: 'Json',
                                            ReturnTypeName: 'Json',
                                            CommandType: 'D',
                                            CommandTypeName: '데이터베이스',
                                            TransactionScope: '0',
                                            DTI: 'Row|Form',
                                        }
                                    });

                                    syn.uicontrols.$grid.insertRow('grdFeatureTransactItem', {
                                        amount: 1,
                                        values: {
                                            FeatureID: 'ID01',
                                            Authorize: '1',
                                            ReturnType: 'Json',
                                            ReturnTypeName: 'Json',
                                            CommandType: 'D',
                                            CommandTypeName: '데이터베이스',
                                            TransactionScope: '0',
                                            DTI: 'Row|',
                                        }
                                    });

                                    syn.uicontrols.$grid.insertRow('grdFeatureTransactItem', {
                                        amount: 1,
                                        values: {
                                            FeatureID: 'DD01',
                                            Authorize: '1',
                                            ReturnType: 'Json',
                                            ReturnTypeName: 'Json',
                                            CommandType: 'D',
                                            CommandTypeName: '데이터베이스',
                                            TransactionScope: '0',
                                            DTI: 'Row|Form',
                                        }
                                    });

                                    syn.uicontrols.$grid.insertRow('grdFeatureTransactItem', {
                                        amount: 1,
                                        values: {
                                            FeatureID: 'AD01',
                                            Authorize: '0',
                                            ReturnType: 'Json',
                                            ReturnTypeName: 'Json',
                                            CommandType: 'D',
                                            CommandTypeName: '데이터베이스',
                                            TransactionScope: '0',
                                            DTI: 'Row,List|Form,Grid,Grid',
                                        }
                                    });

                                    syn.$l.get('lblTransactModuleItem').textContent = `${item.menuID} 신규 항목`;
                                    syn.$l.get('txtTransactItemName').value = '';
                                    syn.$l.get('txtTransactComment').value = '';
                                    syn.$l.get('txtTransactionProjectID').value = item.menuName;

                                    syn.$w.showDialog(syn.$l.get('tplCreateTransactItem'), {
                                        minWidth: 1080,
                                        minHeight: 428
                                    });

                                    syn.uicontrols.$grid.getGridControl('grdFeatureTransactItem').render();
                                    syn.$l.get('txtTransactItemName').focus();
                                    break;
                                case 'wwwroot/view':
                                    syn.$l.get('lblViewModuleItem').textContent = `${item.menuID} 신규 항목`;
                                    syn.$l.get('txtViewItemName').value = '';

                                    syn.$w.showDialog(syn.$l.get('tplCreateViewItem'), {
                                        minWidth: 540,
                                        minHeight: 260
                                    });

                                    syn.$l.get('txtViewItemName').focus();
                                    break;
                            }
                        }
                    }
                    else if (item.level == 4) {
                        if (item.parentMenuID.startsWith('function/csharp') == true || item.parentMenuID.startsWith('function/javascript') == true) {
                            syn.uicontrols.$grid.clear('grdFeatureFunctionItem');
                            syn.uicontrols.$grid.dataRefresh('grdFeatureFunctionItem', {
                                columnName: 'EntityName',
                                dataSourceID: 'CHP014',
                                parameters: `@ApplicationNo:${syn.$w.ManagedApp.ApplicationNo};@UserNo:${syn.$w.User.UserNo};`,
                                local: false,
                                required: false
                            }, function () {
                                syn.uicontrols.$grid.insertRow('grdFeatureFunctionItem', {
                                    amount: 1,
                                    values: {
                                        FeatureID: 'GF01',
                                        Sequence: '0'
                                    }
                                });
                            });

                            var directObject = {
                                programID: syn.Config.ApplicationID,
                                businessID: 'SYS',
                                transactionID: 'SYS010',
                                functionID: 'LF03',
                                dataMapInterface: 'Row|Form,Grid',
                                inputObjects: [
                                    { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                                    { prop: 'UserNo', val: syn.$w.User.UserNo },
                                    { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID }
                                ]
                            };

                            syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                                if (responseData.length == 2) {
                                    var dataSource = responseData[1].value;
                                    var optionText = '<option value="#{DataSourceID}" title="#{Comment}" provider="#{DataProvider}">#{DataSourceID} (#{DataProvider})</option>';
                                    syn.$l.get('ddlFunctionDataSource').innerHTML = $string.interpolate(optionText, dataSource);
                                    syn.$l.get('lblFunctionModuleItem').textContent = `${item.menuID} 신규 항목`;
                                    syn.$l.get('txtFunctionItemName').value = '';
                                    syn.$l.get('txtFunctionComment').value = '';
                                    syn.$l.get('txtFunctionLanguage').value = item.parentMenuName;

                                    syn.$w.showDialog(syn.$l.get('tplCreateFunctionItem'), {
                                        minWidth: 1080,
                                        minHeight: 600
                                    });

                                    syn.uicontrols.$grid.getGridControl('grdFeatureFunctionItem').render();
                                    syn.uicontrols.$grid.getGridControl('grdFeatureFunctionConfiguration').render();
                                    syn.$l.get('txtFunctionItemName').focus();
                                }
                                else {
                                    syn.$w.alert(`$태넌트 앱 데이터 소스 정보를 조회하지 못했습니다`);
                                }
                            });
                        }
                    }
                }
            }
        },

        btnDevelopmentTrash_click(evt, data) {
            if ($object.isNullOrUndefined($this.prop.focusTreeNode) == false) {
                var item = $this.prop.focusTreeNode.node.data;

                if ($string.isNullOrEmpty(item.parentMenuID) == true) {
                }
                else {
                    var alertOptions = $object.clone(syn.$w.alertOptions);
                    alertOptions.icon = 'question';
                    alertOptions.buttonType = '3';
                    if (item.level == 3) {
                        if (item.parentMenuID != 'function' && ['dbclient', 'transact', 'wwwroot/view'].indexOf(item.parentMenuID) > -1) {
                            syn.$w.alert(`${item.menuName} 디렉토리를 정말로 삭제하시겠습니까?`, '삭제 확인', alertOptions, function (result) {
                                if (result == 'Yes') {
                                    $this.method.deleteTenantAppItem('DF01', item.menuID, item.projectType);
                                }
                            });
                        }
                        else {
                        }
                    }
                    else if (item.level == 4) {
                        if (item.parentMenuID.startsWith('function') == true) {
                            syn.$w.alert(`${item.menuName} 디렉토리를 정말로 삭제하시겠습니까?`, '삭제 확인', alertOptions, function (result) {
                                if (result == 'Yes') {
                                    $this.method.deleteTenantAppItem('DF01', `${item.menuID}`, item.projectType);
                                }
                            });
                        }
                        else {
                            syn.$w.alert(`${item.menuName} 파일을 정말로 삭제하시겠습니까?`, '삭제 확인', alertOptions, function (result) {
                                if (result == 'Yes') {
                                    $this.method.deleteTenantAppItem('DF02', `${item.parentMenuName}/${item.menuName}`, item.projectType);
                                }
                            });
                        }
                    }
                    else if (item.level == 5 && item.parentMenuID.startsWith('function') == true) {
                        syn.$w.alert(`${item.menuName} 파일을 정말로 삭제하시겠습니까?`, '삭제 확인', alertOptions, function (result) {
                            if (result == 'Yes') {
                                $this.method.deleteTenantAppItem('DF02', `${item.menuID.substring(9)}`, item.projectType);
                            }
                        });
                    }
                }
            }
        },

        btnDevelopmentSearch_click(evt, data) {
            if (syn.$m.hasClass('divTreeSearch', 'hidden') == true) {
                syn.$m.removeClass('divTreeSearch', 'hidden');
                syn.$l.get('txtTreeSearch').focus();
            }
            else {
                syn.$m.addClass('divTreeSearch', 'hidden');
                $this.event.btnClearTreeFilter_click(evt);
            }
        },

        txtTreeSearch_keydown(evt, data) {
            if (evt.keyCode == 13) {
                $this.event.btnApplyTreeFilter_click(evt);

                evt.returnValue = false;
                evt.cancel = true;
                if (evt.preventDefault) {
                    evt.preventDefault();
                }

                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                return false;
            }
            else if (evt.keyCode == 27) {
                $this.event.btnClearTreeFilter_click(evt);

                evt.returnValue = false;
                evt.cancel = true;
                if (evt.preventDefault) {
                    evt.preventDefault();
                }

                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                return false;
            }
        },

        btnClearTreeFilter_click(evt, data) {
            syn.uicontrols.$tree.clearFilter('tvlTreeView');

            var el = syn.$l.get('txtTreeSearch');
            el.value = '';
            el.focus();
        },

        btnApplyTreeFilter_click(evt, data) {
            var filterText = syn.$l.get('txtTreeSearch').value.trim();
            if ($string.isNullOrEmpty(filterText) == false) {
                syn.uicontrols.$tree.filterNodes('tvlTreeView', filterText);
            }
            else {
                syn.uicontrols.$tree.clearFilter('tvlTreeView');
            }
        },

        btnDevelopmentRefresh_click(evt, data) {
            $this.method.refreshAppFileItems();
        },

        btnDevelopmentSetting_click(evt, data) {
            var customSetting = syn.$w.getStorage('editorSetting', true);
            if (customSetting != null) {
                syn.$l.get('txtFontFamily').value = $string.isNullOrEmpty(customSetting.fontFamily) == false ? customSetting.fontFamily : 'D2Coding,monaco,Consolas,Lucida Console,monospace';
                syn.$l.get('txtFontSize').value = ($string.isNullOrEmpty(customSetting.fontSize) == false && $string.isNumber(customSetting.fontSize) == true) ? customSetting.fontSize : 14;
                syn.$l.get('chkMinimap').checked = $string.toBoolean(customSetting.minimap);
                syn.$l.get('chkLineNumbers').checked = $string.toBoolean(customSetting.lineNumbers);
                syn.$l.get('chkDarkMode').checked = $string.toBoolean(customSetting.darkMode);
                syn.$l.get('chkMouseWheelZoom').checked = $string.toBoolean(customSetting.mouseWheelZoom);
                syn.$l.get('chkAutoIndent').checked = $string.toBoolean(customSetting.autoIndent);
            }
            else {
                syn.$l.get('txtFontFamily').value = 'D2Coding,monaco,Consolas,Lucida Console,monospace';
                syn.$l.get('txtFontSize').value = 14;
                syn.$l.get('chkMinimap').checked = false;
                syn.$l.get('chkLineNumbers').checked = true;
                syn.$l.get('chkDarkMode').checked = true;
                syn.$l.get('chkMouseWheelZoom').checked = false;
                syn.$l.get('chkAutoIndent').checked = true;
            }

            syn.$w.showDialog(syn.$l.get('tplDevelopmentSetting'), {
                minWidth: 620,
                minHeight: 580
            });
            syn.$l.get('txtFontFamily').focus();
        },

        btnApplyDevelopmentSetting_click(evt, data) {
            var editorSetting = {
                fontFamily: syn.$l.get('txtFontFamily').value,
                fontSize: syn.$l.get('txtFontSize').value,
                minimap: syn.$l.get('chkMinimap').checked,
                lineNumbers: syn.$l.get('chkLineNumbers').checked,
                darkMode: syn.$l.get('chkDarkMode').checked,
                mouseWheelZoom: syn.$l.get('chkMouseWheelZoom').checked,
                autoIndent: syn.$l.get('chkAutoIndent').checked
            };

            syn.$w.setStorage('editorSetting', editorSetting, true);

            syn.$w.closeDialog();

            syn.$w.notify('success', '에디터 설정이 적용 되었습니다');
        },

        tvlTreeView_dblclick(evt, data) {
            var item = data.node.data;
            if (item.menuType == 'F') {
                $this.method.addTabUI(item);
            }
        },

        tvlTreeView_focus(evt, data) {
            var item = data.node.data;
            $this.prop.focusTreeNode = data;

            syn.$l.get('btnDevelopmentAddDirectory').setAttribute('disabled', 'disabled');
            syn.$l.get('btnDevelopmentAddFile').setAttribute('disabled', 'disabled');
            syn.$l.get('btnDevelopmentTrash').setAttribute('disabled', 'disabled');

            if ($string.isNullOrEmpty(item.parentMenuID) == true) {
            }
            else {
                if (item.level == 2 && item.parentMenuID == syn.$w.ManagedApp.ApplicationID) {
                    if (item.menuID != 'function') {
                        syn.$l.get('btnDevelopmentAddDirectory').removeAttribute('disabled');
                    }
                }
                else if (item.level == 3) {
                    if (item.parentMenuID == 'function') {
                        syn.$l.get('btnDevelopmentAddDirectory').removeAttribute('disabled');
                    }
                    else {
                        syn.$l.get('btnDevelopmentAddFile').removeAttribute('disabled');
                        syn.$l.get('btnDevelopmentTrash').removeAttribute('disabled');
                    }
                }
                else if (item.level == 4) {
                    if (item.parentMenuID.startsWith('function') == true) {
                        syn.$l.get('btnDevelopmentAddFile').removeAttribute('disabled');
                    }

                    syn.$l.get('btnDevelopmentTrash').removeAttribute('disabled');
                }
                else if (item.level == 5) {
                    syn.$l.get('btnDevelopmentTrash').removeAttribute('disabled');
                }
            }
        },

        btnBusiness_click() {
            syn.$m.addClass('divEditorButton', 'hidden');
            syn.$m.addClass('divTreeView', 'hidden');

            syn.$l.get('divTreeMenu').style.removeProperty('display');
        },

        btnDevelopment_click() {
            syn.$m.removeClass('divEditorButton', 'hidden');
            syn.$m.removeClass('divTreeView', 'hidden');

            syn.$l.get('divTreeMenu').style.setProperty('display', 'none', 'important');
        },

        window_resize() {
            if ($object.isNullOrUndefined($this.prop.resizeTimerID) == true) {
                $this.prop.resizeTimerID = setTimeout($this.event.mainFrame_resize, 200);
            }
        },

        mainFrame_resize() {
            var windowWidth = $this.method.getWindowWidth();
            var windowHeight = $this.method.getWindowHeight();

            if ($this.prop.windowWidth === windowWidth && $this.prop.windowHeight === windowHeight) {
                if ($this.prop.resizeTimerID) {
                    clearTimeout($this.prop.resizeTimerID);
                    $this.prop.resizeTimerID = null;
                }
                else {
                    return;
                }
            }
            else {
                if ($this.prop.windowWidth === windowWidth && $this.prop.windowHeight === windowHeight) {
                    if ($this.prop.resizeTimerID) {
                        clearTimeout($this.rprop.esizeTimerID);
                        $this.prop.resizeTimerID = null;
                    }
                }
                else {
                    $this.prop.windowWidth = windowWidth;
                    $this.prop.windowHeight = windowHeight;
                    $this.prop.resizeTimerID = setTimeout($this.event.mainFrame_resize, 100);
                }

                return;
            }

            var length = $this.prop.editorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $this.prop.editorControls[i];
                var tabEL = syn.$l.querySelector(`[data-tab-id="${item.id.replace('$i', '')}"]`);
                if (tabEL && tabEL.getAttribute('active') == '') {
                    var control = $this.method.getEditorControl(item.id);
                    if (control) {
                        if (control.editor) {
                            control.editor.layout();
                        }
                    }
                }
            }

            var tabID = null;
            var tabEL = $this.method.getActiveTab();
            if (tabEL) {
                tabID = tabEL.getAttribute('data-tab-id');
            }
            else {
                tabID = 'HAC$HAC000$HAC000$HAC';
            }

            if ($string.isNullOrEmpty(tabID) == false) {
                var pageWindow = $this.method.getActiveTabContent(tabID);
                if (pageWindow && pageWindow.syn && pageWindow.syn.$w.setTabContentHeight) {
                    pageWindow.syn.$w.setTabContentHeight();
                }
            }
        },

        btnMenuSelector_click(evt) {
            $this.prop.chromeTabs.layoutTabs();
        },

        icoDashBoard_click(evt) {
            var activeTab = syn.$l.querySelector('.chrome-tab[active]');
            if (activeTab != null) {
                activeTab.removeAttribute('active');
            }

            var tabFrames = syn.$l.querySelectorAll('#tabContainer [tag="iframe"]');

            for (var i = 0, l = tabFrames.length; i < l; i++) {
                var tabFrame = tabFrames[i];
                syn.$m.setStyle(tabFrame, 'display', 'none');
            }

            syn.$l.get('lblActiveTabTitle').textContent = '대시보드';

            var tabID = 'HAC$HAC000$HAC000$HAC';
            syn.$m.setStyle(tabID + '$i', 'display', 'block');

            var divActionButtons = syn.$l.get('divActionButtons');
            syn.$w.purge(divActionButtons);
            divActionButtons.innerHTML = '';

            var actionButton = {
                command: 'refresh',
                icon: 'refresh',
                action(evt) {
                    var pageWindow = $this.method.getActiveTabContent(tabID);
                    if (pageWindow && pageWindow.syn) {
                        pageWindow.location.reload();
                    }
                }
            };

            var button = syn.$m.create({
                id: 'fab_' + actionButton.command,
                tag: 'button',
                className: `btn`
            });

            button.innerHTML = `<i class="f:18 ti ti-${actionButton.icon}"></i>`;

            if (actionButton.action) {
                syn.$l.addEvent(button, 'click', actionButton.action);
            }

            syn.$m.appendChild(divActionButtons, button);

            var pageWindow = $this.method.getActiveTabContent(tabID);
            if (pageWindow && pageWindow.syn && pageWindow.syn.$w.setTabContentHeight) {
                pageWindow.syn.$w.setTabContentHeight();
            }
        },

        menuTab_activeTabChange(evt) {
            var el = evt.detail.tabEl;
            var tabFrames = syn.$l.querySelectorAll('#tabContainer [tag="iframe"]');

            for (var i = 0, l = tabFrames.length; i < l; i++) {
                var tabFrame = tabFrames[i];
                syn.$m.setStyle(tabFrame, 'display', 'none');
            }

            syn.$l.get('lblActiveTabTitle').textContent = el.querySelector('.chrome-tab-title').textContent;

            var tabID = evt.detail.tabEl.getAttribute('data-tab-id');
            $this.method.focusTabUI(tabID);
            $this.method.resizeTabUI();

            var pageWindow = $this.method.getActiveTabContent(tabID);
            if (pageWindow && pageWindow.syn) {
                pageWindow.syn.$w.setTabContentHeight();
            }
            else {
                var tabIFrame = syn.$l.get(tabID + '$i');
                if (tabIFrame) {
                    var divEditor = tabIFrame.querySelector('.monaco-editor');
                    if (divEditor) {
                        $this.event.window_resize();
                    }
                }
            }
        },

        menuTab_tabAdd(evt) {
            var el = evt.detail.tabEl;
            var tabID = el.getAttribute('data-tab-id');
            var tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`);

            var tabHeaderInfos = tabID.split('$');
            var menuType = tabHeaderInfos[0];
            var menuID = tabHeaderInfos[3];

            var tabContainer = syn.$l.get('tabContainer');
            var tabFrames = syn.$l.querySelectorAll('#tabContainer [tag="iframe"]');

            for (var i = 0, l = tabFrames.length; i < l; i++) {
                var tabFrame = tabFrames[i];
                syn.$m.setStyle(tabFrame, 'display', 'none');
            }

            if (menuType == 'F') {
                var menuNode = $this.prop.appFileItems.find(function (item) { return item.menuID == menuID });
                if ($object.isNullOrUndefined(menuNode) == true) {
                    return;
                }

                var rootNode = $this.prop.appFileItems.find(function (item) { return item.menuID == menuNode.parentMenuID });
                if ($object.isNullOrUndefined(rootNode) == true) {
                    return;
                }

                tabEl.actionButtons = [
                    {
                        command: 'save',
                        icon: 'edit',
                        text: '저장',
                        class: 'btn-primary',
                        action(evt) {
                            var control = $this.method.getEditorControl(tabID + '$i');
                            if (control) {
                                if (control.editor) {
                                    var compressBase64 = syn.$c.LZString.compressToBase64(control.editor.getValue());
                                    var directObject = {
                                        programID: syn.Config.ApplicationID,
                                        businessID: 'SYS',
                                        transactionID: 'SYS010',
                                        functionID: 'MF01',
                                        inputObjects: [
                                            { prop: 'ApplicationNo', val: syn.$w.ManagedApp.ApplicationNo },
                                            { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                                            { prop: 'UserNo', val: syn.$w.User.UserNo },
                                            { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID },
                                            { prop: 'ItemPath', val: menuNode.menuID },
                                            { prop: 'CompressBase64', val: compressBase64 },
                                            { prop: 'ProjectType', val: 'A' }
                                        ]
                                    };

                                    syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                                        if (responseData.length == 1) {
                                            var error = responseData[0].value;
                                            if ($string.toBoolean(error.Error) == false) {
                                                syn.$w.notify('success', `${menuNode.menuName} 파일을 저장 했습니다`);
                                            }
                                            else {
                                                syn.$w.notify('warning', `${menuNode.menuName} 저장에 실패했습니다. 오류: ` + error.Message);
                                            }
                                        }
                                        else {
                                            syn.$w.alert(`${menuNode.menuName} 파일을 저장하지 못했습니다`);
                                        }
                                    });
                                }
                            }
                        }
                    }
                ];

                if (menuNode.projectType == 'U' && menuNode.directoryYN == 'N' && menuNode.extension == '.html') {
                    tabEl.actionButtons.push({
                        command: 'preview',
                        icon: 'presentation',
                        text: '미리보기',
                        action(evt) {
                            var previewUrl = `${location.origin}/${syn.Config.TenantAppRequestPath}/${syn.$w.ManagedApp.UserWorkID}/${syn.$w.ManagedApp.ApplicationID}/${menuNode.menuID}`;
                            window.open(previewUrl, tabID);
                        }
                    });
                }

                tabEl.actionButtons.push({
                    command: 'search',
                    icon: 'refresh',
                    text: '',
                    async action(evt) {
                        var control = $this.method.getEditorControl(tabID + '$i');
                        if (control) {
                            if (control.editor) {
                                var directObject = {
                                    programID: syn.Config.ApplicationID,
                                    businessID: 'SYS',
                                    transactionID: 'SYS010',
                                    functionID: 'GF01',
                                    dataMapInterface: 'Row|Form,Form',
                                    inputObjects: [
                                        { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                                        { prop: 'UserNo', val: syn.$w.User.UserNo },
                                        { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID },
                                        { prop: 'ItemPath', val: menuNode.menuID },
                                        { prop: 'ProjectType', val: 'A' }
                                    ]
                                };

                                syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                                    if (responseData.length == 2) {
                                        var sourceText = responseData[1].value.SourceText;
                                        sourceText = syn.$c.LZString.decompressFromBase64(sourceText);
                                        control.editor.setValue(sourceText);
                                    }
                                    else {
                                        syn.$w.alert(`${menuNode.menuName} 파일을 조회하지 못했습니다`);
                                    }
                                });
                            }
                        }
                    }
                });

                var language = 'ini';
                var extension = menuNode.menuName.split('.')[1];

                switch (extension) {
                    case 'cs':
                        language = 'csharp'
                        break;
                    case 'js':
                        language = 'javascript'
                        break;
                    case 'json':
                        language = 'json'
                        break;
                    case 'html':
                        language = 'html'
                        break;
                    case 'css':
                        language = 'css'
                        break;
                    case 'xml':
                        language = 'xml'
                        break;
                    case 'ts':
                        language = 'typescript'
                        break;
                    case 'md':
                        language = 'markdown'
                        break;
                    case 'sql':
                        language = 'sql'
                        break;
                }

                tabEl.title = tabID;
                tabEl.functions = menuNode.functions;

                var tabFrame = syn.$m.append(tabContainer, 'div', tabID + '$i', {
                    styles: { display: 'none' }
                });
                tabFrame.setAttribute('tag', 'iframe');

                var editorSetting = {
                    width: '100%',
                    height: 'calc(100vh - 134px)',
                    language: language,
                    minimap: {
                        enabled: false
                    },
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    lineNumbers: 'on',
                    theme: 'vs-dark',
                    formatOnPaste: true,
                    autoIndent: "none",
                    fontFamily: 'D2Coding,monaco,Consolas,Lucida Console,monospace',
                    fontSize: 20,
                    lineHeight: 22,
                    dataType: 'string',
                    basePath: '/lib/monaco-editor-0.39.0/vs',
                    mouseWheelZoom: true,
                    isLoadScript: true,
                    belongID: null,
                    controlText: null,
                    validators: null,
                    transactConfig: null,
                    triggerConfig: null
                };

                var customSetting = syn.$w.getStorage('editorSetting', true);
                if (customSetting != null) {
                    editorSetting.fontFamily = $string.isNullOrEmpty(customSetting.fontFamily) == false ? customSetting.fontFamily : 'D2Coding,monaco,Consolas,Lucida Console,monospace';
                    editorSetting.fontSize = ($string.isNullOrEmpty(customSetting.fontSize) == false && $string.isNumber(customSetting.fontSize) == true) ? customSetting.fontSize : 14;
                    editorSetting.minimap = $string.toBoolean(customSetting.minimap) == true ? { enabled: true } : { enabled: false };
                    editorSetting.lineNumbers = $string.toBoolean(customSetting.lineNumbers) == true ? 'on' : 'off';
                    editorSetting.theme = $string.toBoolean(customSetting.darkMode) == true ? 'vs-dark' : 'vs';
                    editorSetting.mouseWheelZoom = $string.toBoolean(customSetting.mouseWheelZoom);
                    editorSetting.autoIndent = $string.toBoolean(customSetting.autoIndent) == true ? 'full' : 'none';
                }

                $this.method.editorLoad(tabID + '$i', editorSetting, async (editor) => {
                    var directObject = {
                        programID: syn.Config.ApplicationID,
                        businessID: 'SYS',
                        transactionID: 'SYS010',
                        functionID: 'GF01',
                        dataMapInterface: 'Row|Form,Form',
                        inputObjects: [
                            { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                            { prop: 'UserNo', val: syn.$w.User.UserNo },
                            { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID },
                            { prop: 'ItemPath', val: menuNode.menuID },
                            { prop: 'ProjectType', val: 'A' }
                        ]
                    };

                    syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                        if (responseData.length == 2) {
                            var sourceText = responseData[1].value.SourceText;
                            sourceText = syn.$c.LZString.decompressFromBase64(sourceText);
                            editor.setValue(sourceText);
                        }
                        else {
                            syn.$w.alert(`${menuNode.menuName} 파일을 조회하지 못했습니다`);
                        }
                    });
                });

                tabFrame.style.display = 'block';
            }
            else if (menuType == 'U') {
                var menuNode = $this.prop.menus.find(function (item) { return item.menuID == menuID });
                if ($object.isNullOrUndefined(menuNode) == true) {
                    return;
                }

                var rootNode = $this.prop.menus.find(function (item) { return item.menuID == menuNode.parentMenuID });
                if ($object.isNullOrUndefined(menuNode) == true) {
                    return;
                }

                tabEl.title = tabID;
                tabEl.functions = menuNode.functions;

                var tabFrame = syn.$m.append(tabContainer, 'iframe', tabID + '$i', {
                    styles: { display: 'none' }
                });
                tabFrame.width = '100%';
                tabFrame.height = '100%';
                tabFrame.frameborder = '0';
                tabFrame.scrolling = 'no';
                tabFrame.border = '0';
                tabFrame.hspace = '0';
                tabFrame.vspace = '0';
                tabFrame.setAttribute('allowfullscreen', 'allowfullscreen');
                tabFrame.setAttribute('tag', 'iframe');
                tabFrame.style.border = 0;

                var pageWrapper = document.querySelector('.page-wrapper');
                if (pageWrapper) {
                    var scrollHeight = pageWrapper.scrollHeight - 77;
                    tabFrame.height = scrollHeight;
                    tabFrame.style.height = `${scrollHeight}px`;
                }

                var url = '';
                if (menuNode.url) {
                    url = menuNode.url;
                }
                else {
                    url = '/checkup/view/{0}/{1}.html'.format(menuNode.projectID, menuNode.fileID);
                }

                if (syn.Config && syn.Config.IsClientCaching == true) {
                    tabFrame.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tabID=' + tabID;
                }
                else {
                    tabFrame.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tabID=' + tabID + '&tick=' + new Date().getTime();
                }

                syn.$l.addEvent(tabFrame, 'load', function () {
                    var pageWindow = $this.method.getActiveTabContent(tabID);
                    if (pageWindow && pageWindow.document) {
                        var pageHeader = pageWindow.document.querySelector('.page-pretitle');
                        if (pageHeader) {
                            pageHeader.innerHTML = `${rootNode.parentMenuName} / ${menuNode.parentMenuName}`;
                        }
                    }
                });

                tabFrame.style.display = 'block';
            }

            syn.$l.addEvent(tabEl, 'mousedown', (evt) => {
                if (evt.which === 2) {
                    var currentTabEl = evt.currentTarget;
                    if (currentTabEl) {
                        $this.prop.chromeTabs.removeTab(currentTabEl);
                    }
                }
            });

            $this.method.refreshUIButtons(tabID);

            if ($this.isUILog == true) {
                // 신규 탭 생성시 화면 사용 로그를 기록
            }
        },

        menuTab_tabRemove(evt) {
            var el = evt.detail.tabEl;
            var tabID = el.getAttribute('data-tab-id');

            try {
                var tabIFrame = syn.$l.get(tabID + '$i');
                var tabContent = $this.method.getActiveTabContent(tabID);
                if (tabContent) {
                    var contentIframes = tabContent.document.getElementsByTagName('iframe');
                    if (contentIframes && contentIframes.length > 0) {
                        if ($this && $this.closeIframes) {
                            $this.closeIframes(contentIframes);
                        }
                    }

                    tabContent.events.flush();
                    tabContent.close();
                    tabIFrame.src = '';
                }
                syn.$m.remove(tabIFrame);
            }
            catch (error) {
                syn.$l.eventLog('iframe flush', error.toString());
            }

            if (syn.$l.querySelectorAll('div#tabContainer [tag="iframe"]').length == 1) {
                $this.event.icoDashBoard_click();
            }
        },

        navItem_click(evt) {
            var el = evt.currentTarget;

            if ($this.prop.selectedGnbID != el.id) {
                for (var i = 0, length = $this.prop.gnb_nodes.length; i < length; i++) {
                    var rootNode = $this.prop.gnb_nodes[i];
                    var elGnb = syn.$l.get('gnb' + rootNode.menuID);

                    if (elGnb) {
                        syn.$m.removeClass(elGnb, 'active');
                    }
                }

                syn.$m.addClass(el, 'active');
            }

            if (syn.$m.hasClass(el, 'dropdown') == true) {
                var elDropDownMenu = el.querySelector('.dropdown-menu');

                if (syn.$m.hasClass(elDropDownMenu, 'show') == true) {
                    syn.$m.removeClass(elDropDownMenu, 'show');
                }
                else {
                    syn.$m.addClass(elDropDownMenu, 'show');
                }
            }

            $this.prop.selectedGnbID = el.id;

            evt.preventDefault();
            evt.stopPropagation();
        },

        lnbItem_click(evt) {
            var el = evt.currentTarget;

            var menuID = el.id.substring(3);
            var lnb_node = $this.prop.menus.find(function (item) { return item.menuID == menuID });
            if ($object.isNullOrUndefined(lnb_node) == true) {
                return;
            }

            var rootNode = $this.prop.menus.find(function (item) { return item.menuID == lnb_node.parentMenuID });
            if ($object.isNullOrUndefined(rootNode) == true) {
                return;
            }

            var elGnb = syn.$l.get('gnb' + rootNode.menuID);
            if ($this.prop.selectedGnbID != elGnb.id) {
                for (var i = 0, length = $this.prop.gnb_nodes.length; i < length; i++) {
                    var node = $this.prop.gnb_nodes[i];
                    var gnb = syn.$l.get('gnb' + node.menuID);

                    if (gnb) {
                        syn.$m.removeClass(gnb, 'active');
                    }
                }

                syn.$m.addClass(elGnb, 'active');
                $this.prop.selectedGnbID = elGnb.id;
            }

            var elLst = syn.$l.get('lst' + menuID);
            if (elLst) {
                if (syn.$m.hasClass(elLst, 'show') == true) {
                    syn.$m.removeClass(elLst, 'show');
                }
                else {
                    syn.$m.addClass(elLst, 'show');
                }
            }

            $this.prop.selectedLnbID = el.id;

            evt.preventDefault();
            evt.stopPropagation();
        },

        lstItem_click(evt) {
            var el = evt.currentTarget;

            var menuID = el.id.substring(3);
            var menuNode = $this.prop.menus.find(function (item) { return item.menuID == menuID });
            if ($object.isNullOrUndefined(menuNode) == true) {
                return;
            }

            var lnb_node = $this.prop.menus.find(function (item) { return item.menuID == menuNode.parentMenuID });
            if ($object.isNullOrUndefined(lnb_node) == true) {
                return;
            }

            var rootNode = $this.prop.menus.find(function (item) { return item.menuID == lnb_node.parentMenuID });
            if ($object.isNullOrUndefined(rootNode) == true) {
                return;
            }

            var elGnb = syn.$l.get('gnb' + rootNode.menuID);
            if ($this.prop.selectedGnbID != elGnb.id) {
                for (var i = 0, length = $this.prop.gnb_nodes.length; i < length; i++) {
                    var node = $this.prop.gnb_nodes[i];
                    var gnb = syn.$l.get('gnb' + node.menuID);

                    if (gnb) {
                        syn.$m.removeClass(gnb, 'active');
                    }
                }

                syn.$m.addClass(elGnb, 'active');
                $this.prop.selectedGnbID = elGnb.id;
            }

            $this.method.addTabUI(menuNode);

            evt.preventDefault();
            evt.stopPropagation();
        }
    },

    transaction: {
    },

    method: {
        createFileItem(itemID, itemPath, text, callback) {
            var compressBase64 = syn.$c.LZString.compressToBase64(text);
            var directObject = {
                programID: syn.Config.ApplicationID,
                businessID: 'SYS',
                transactionID: 'SYS010',
                functionID: 'IF02',
                inputObjects: [
                    { prop: 'ApplicationNo', val: syn.$w.ManagedApp.ApplicationNo },
                    { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                    { prop: 'UserNo', val: syn.$w.User.UserNo },
                    { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID },
                    { prop: 'ItemPath', val: itemPath },
                    { prop: 'CompressBase64', val: compressBase64 },
                    { prop: 'ProjectType', val: 'A' }
                ]
            };

            syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                if (responseData.length == 1) {
                    var error = responseData[0].value;
                    if ($string.toBoolean(error.Error) == false) {
                        if (callback) {
                            callback();
                        }
                        else {
                            $this.method.refreshAppFileItems(() => {
                                var fancyNodes = syn.uicontrols.$tree.getControl('tvlTreeView').tree.findAll((node) => {
                                    return node.data.menuID == itemPath;
                                });

                                if (fancyNodes && fancyNodes.length > 0) {
                                    var fancyNode = fancyNodes[0];
                                    var item = fancyNode.data;
                                    if (item.menuType == 'F') {
                                        $this.method.addTabUI(item);
                                    }
                                }
                            });
                        }
                    }
                    else {
                        syn.$w.notify('warning', `${itemID} 저장에 실패했습니다. 오류: ` + error.Message);
                    }
                }
                else {
                    syn.$w.alert(`${itemID} 파일을 저장하지 못했습니다`);
                }
            });
        },

        deleteTenantAppItem(functionID, itemPath, projectType) {
            var directObject = {
                programID: syn.Config.ApplicationID,
                businessID: 'SYS',
                transactionID: 'SYS010',
                functionID: functionID,
                dataMapInterface: 'Row|Form',
                inputObjects: [
                    { prop: 'ApplicationNo', val: syn.$w.ManagedApp.ApplicationNo },
                    { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                    { prop: 'UserNo', val: syn.$w.User.UserNo },
                    { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID },
                    { prop: 'ItemPath', val: itemPath },
                    { prop: 'ProjectType', val: projectType }
                ]
            };

            syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                var exception = responseData[0].value;
                if ($string.toBoolean(exception.Error) == false) {
                    $this.method.refreshAppFileItems();
                }
                else {
                    syn.$w.notify('warning', `${(functionID == 'DF01' ? '디렉토리' : '파일')} 삭제를 하지 못했습니다. ${exception.Message}`);
                }
            });
        },

        refreshAppFileItems(callback) {
            var directObject = {
                programID: syn.Config.ApplicationID,
                businessID: 'SYS',
                transactionID: 'SYS010',
                functionID: 'LF01',
                dataMapInterface: 'Row|Form,Form',
                inputObjects: [
                    { prop: 'ApplicationID', val: syn.$w.ManagedApp.ApplicationID },
                    { prop: 'ApplicationName', val: syn.$w.ManagedApp.ApplicationName },
                    { prop: 'UserNo', val: syn.$w.User.UserNo },
                    { prop: 'UserWorkID', val: syn.$w.ManagedApp.UserWorkID }
                ]
            };

            syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                if (responseData.length == 2 && $string.toBoolean(responseData[0].value.Error) == false) {
                    var hostFileMenu = responseData[1].value.HostFileMenu;
                    hostFileMenu = syn.$c.LZString.decompressFromBase64(hostFileMenu);
                    $this.prop.appFileItems = JSON.parse(hostFileMenu);
                    if ($object.isNullOrUndefined($this.prop.appFileItems) == false && $object.isArray($this.prop.appFileItems) == true) {
                        syn.uicontrols.$tree.setValue('tvlTreeView', $this.prop.appFileItems);
                        syn.uicontrols.$tree.expendLevel('tvlTreeView', 3);
                    }

                    if (callback) {
                        callback();
                    }
                }
                else {
                    syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
                    syn.$w.removeStorage('handstack_managedapp', true);

                    var alertOptions = $object.clone(syn.$w.alertOptions);
                    alertOptions.icon = 'warning';
                    alertOptions.buttonType = '1';
                    syn.$w.alert('태넌트 앱 파일을 조회하지 못했습니다', '프로젝트 닫기', alertOptions, function (result) {
                        location.href = 'checkin.html';
                    });
                }
            });
        },

        editorLoad(elID, setting, callback) {
            var el = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend(syn.uicontrols.$sourceeditor.defaultSetting, setting);

            syn.$m.setStyle(el, 'width', setting.width);
            syn.$m.setStyle(el, 'height', setting.height);

            setTimeout(function () {
                var editor = monaco.editor.create(el, setting);
                editor.onKeyDown(function (e) {
                    if (e.code === 'Space' && e.ctrlKey === true) {
                        e.preventDefault();
                    }
                });

                $this.prop.editorControls.push({
                    id: elID,
                    editor: editor,
                    setting: $object.clone(setting)
                });

                if (callback) {
                    callback(editor);
                }
            }, 25);
        },

        getEditorControl(elID) {
            var result = null;
            var length = $this.prop.editorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $this.prop.editorControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        addTabUI(menu_node) {
            if ($object.isNullOrUndefined(menu_node) == true) {
                syn.$w.alert('메뉴 정보가 올바르지 않습니다', '정보');
                return;
            }

            var menuType = menu_node.menuType;
            var projectID = menu_node.projectID;
            var projectType = menu_node.projectType;
            var fileID = menu_node.fileID;
            var menuID = menu_node.menuID;
            var parentMenuID = menu_node.parentMenuID;

            var tabID = '';
            tabID = tabID.concat(menuType, '$', projectID, '$', fileID, '$', menuID, '$', parentMenuID);

            var tabIcon = '/checkup/img/logo.svg';
            if (menuType == 'F') {
                tabIcon = `/checkup/img/tab-icon-${projectType}.svg`;
            }

            if (syn.$l.querySelector(`[data-tab-id="${tabID}"]`)) {
                $this.method.focusTabUI(tabID);
                return;
            }

            $this.prop.chromeTabs.addTab({
                id: tabID,
                title: menu_node.menuName,
                favicon: tabIcon
            }, {
                animate: false
            });
        },

        closeTabUI(tabID, isForce) {
            var tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`);
            $this.prop.chromeTabs.removeTab(tabEl);
        },

        closeIframes(iframes) {
            if (iframes) {
                for (var i = 0; i < iframes.length; i++) {
                    var iframe = iframes[i];
                    var contentDocument = iframe.contentDocument;
                    var contentWindow = iframe.contentWindow;

                    var contentIframes = contentDocument.getElementsByTagName('iframe');
                    if (contentIframes && contentIframes.length > 0) {
                        if ($this && $this.closeIframes) {
                            $this.closeIframes(contentIframes);
                        }
                    }

                    if (contentWindow.events && contentWindow.events.flush) {
                        contentWindow.events.flush();
                    }

                    contentWindow.close();
                    iframe.src = '';
                    syn.$m.remove(iframe);
                }
            }
        },

        closeAllTabUI() {
            var tabHeaders = syn.$l.querySelectorAll('[data-tab-id]');
            for (var i = tabHeaders.length; i > 0; i--) {
                var tabID = tabHeaders[i].getAttribute('data-tab-id');
                $this.method.closeTabUI(tabID, true);
            }
        },

        getActiveTab() {
            return $this.prop.chromeTabs.activeTabEl;
        },

        getTabInfo(projectID, fileID) {
            var result = null;
            var findNodes = $this.prop.menus.filter(function (item) { return item.projectID == projectID && item.fileID == fileID });
            if (findNodes.length > 0) {
                result = findNodes[0];
            }

            return result;
        },

        getActiveTabID(projectID, fileID) {
            var tabID = '';
            var tab = syn.$l.querySelector('div[class="chrome-tab"] [data-tab-id*="' + projectID + '$' + fileID + '"]');

            if (tab) {
                tabID = tab.getAttribute('data-tab-id');
            }

            return tabID;
        },

        getActiveTabContent(tabID) {
            var currentTab = syn.$l.get(tabID + '$i');
            var contentWindow = null;

            if (currentTab) {
                contentWindow = currentTab.contentWindow;
            }

            return contentWindow;
        },

        focusTabUI(tabID) {
            var tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`);
            if (tabEl) {
                $this.prop.chromeTabs.setCurrentTab(tabEl);
            }
            else {
                return;
            }

            var tabFrames = syn.$l.querySelectorAll('div#tabContainer [tag="iframe"]');
            var tabHeaderInfos = tabID.split('$');
            var menuType = tabHeaderInfos[0];
            var projectID = tabHeaderInfos[1];
            var fileID = tabHeaderInfos[2];
            var menuID = tabHeaderInfos[3];
            var parentMenuID = tabHeaderInfos[4];

            var activeTabID = '';
            var tabFrame = null;
            for (var i = 0, l = tabFrames.length; i < l; i++) {
                tabFrame = tabFrames[i];
                if (syn.$m.getStyle(tabFrame, 'display') === 'block') {
                    activeTabID = tabFrame.id;
                    break;
                }
            }

            var recentMenu = {};
            recentMenu.menuNav = '';
            recentMenu.tabID = tabID;
            recentMenu.tabInfo =
            {
                tabID: tabID,
                menuType: menuType,
                projectID: projectID,
                fileID: fileID,
                menuID: menuID,
                parentMenuID: parentMenuID,
                menuText: tabEl.querySelector('.chrome-tab-title').textContent
            };

            $this.method.addRecentMenus(recentMenu);

            var pageWindow = $this.method.getActiveTabContent(tabID);
            if (pageWindow && pageWindow.syn) {
                if (pageWindow.syn.$w.isProgress == true) {
                    $this.prop.buttonAction = false;
                }
                else {
                    $this.prop.buttonAction = true;
                }
            }

            $this.method.refreshUIButtons(tabID);

            var focusTabID = tabID + '$i';
            if (activeTabID != focusTabID) {
                if (activeTabID) {
                    var activeTabEl = syn.$l.get(activeTabID);
                    if (activeTabEl != null) {
                        syn.$m.setStyle(activeTabEl, 'display', 'none');
                    }
                }

                if (focusTabID) {
                    var focusTabFrame = syn.$l.get(focusTabID);
                    if (focusTabFrame != null) {
                        syn.$m.setStyle(focusTabFrame, 'display', 'block');
                    }
                }
            }

            window.focus();

            try {
                if (pageWindow && pageWindow.syn && pageWindow.syn.$w) {
                    var pageScript = pageWindow[pageWindow.syn.$w.pageScript];

                    if (pageScript && pageWindow.syn.uicontrols && pageWindow.syn.uicontrols.$grid) {
                        for (var i = 0; i < pageWindow.syn.uicontrols.$grid.gridControls.length; i++) {
                            pageWindow.syn.uicontrols.$grid.gridControls[i].hot.render();
                        }
                    }

                    $this.method.tabUIVisibleChanged(pageScript, true);
                    pageWindow.syn.$w.setTabContentHeight();
                }
            }
            catch (error) {
                syn.$l.eventLog('focusTabUI', error.toString());
            }
        },

        executeUIButtonCommand(pageScript, actionID, tabID) {
            if (pageScript && pageScript.hook.frameEvent) {
                if (pageScript && pageWindow.syn.uicontrols && pageWindow.syn.uicontrols.$grid && pageWindow.syn.uicontrols.$grid.gridControls) {
                    for (var i = 0; i < pageWindow.syn.uicontrols.$grid.gridControls.length; i++) {
                        var gridControl = pageWindow.syn.uicontrols.$grid.gridControls[i];
                        gridControl.value.passSelectCellEvent = true;
                        var value = gridControl.value;
                        if (value) {
                            gridControl.hot.selectCell(value.previousRow, value.previousCol);
                        }
                        delete gridControl.value.passSelectCellEvent;
                    }
                }

                var pageWindow = $this.method.getActiveTabContent(tabID);
                var contentIframes = pageWindow.document.getElementsByTagName('iframe');
                if (contentIframes) {
                    for (var i = 0; i < contentIframes.length; i++) {
                        var contentIframe = contentIframes[i];
                        var innerModule = contentIframe.contentWindow['$this'];
                        if (innerModule) {
                            if (innerModule.$grid && innerModule.$grid.gridControls) {
                                for (var i = 0; i < innerModule.$grid.gridControls.length; i++) {
                                    var gridControl = innerModule.$grid.gridControls[i];
                                    gridControl.value.passSelectCellEvent = true;
                                    var value = gridControl.value;
                                    if (value) {
                                        gridControl.hot.selectCell(value.previousRow, value.previousCol);
                                    }
                                    delete gridControl.value.passSelectCellEvent;
                                }
                            }
                        }
                    }
                }

                setTimeout(function () {
                    pageScript.hook.frameEvent('buttonCommand', {
                        actionID: actionID
                    });
                }, 25);
            }
        },

        tabUIVisibleChanged(pageScript, isVisible) {
            if (pageScript && pageScript.hook.pageVisible) {
                pageScript.hook.pageVisible(isVisible);
            }
        },

        tabUIVisibleChanging(pageScript, sourceTabID, storageKey) {
            if (pageScript && pageScript.hook.frameEvent) {
                pageScript.hook.frameEvent('storegeChanging', {
                    sourceTabID: sourceTabID,
                    storageKey: storageKey
                });
            }
        },

        tabUIResizing(pageScript) {
            if (pageScript && pageScript.hook.pageResizing) {
                var dimension = {
                    windowWidth: $this.prop.windowWidth,
                    windowHeight: $this.prop.windowHeight,
                    tabWidth: $this.prop.tabFrameSize.width,
                    tabHeight: $this.prop.tabFrameSize.height
                };

                pageScript.hook.pageResizing(dimension);
            }
        },

        tabUIClosed(pageScript) {
            var result = true;
            if (pageScript && pageScript.hook.pageClosed) {
                var isClosed = pageScript.hook.pageClosed();
                result = $object.isBoolean(isClosed) ? isClosed : true;
                isClosed = null;
            }

            return result;
        },

        tabUISessionClosed(pageScript) {
            if (pageScript && pageScript.hook.frameEvent) {
                pageScript.hook.frameEvent('sessionDestroy');
            }
        },

        refreshUIButtons(tabID, actionButtons) {
            if (tabID) {
                var tabHeaderInfos = tabID.split('$');
                var menuType = tabHeaderInfos[0];

                var tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`)
                if ($object.isNullOrUndefined(actionButtons) == true) {
                    actionButtons = tabEl.actionButtons;
                }

                if ($object.isNullOrUndefined(actionButtons) == true) {
                    actionButtons = [];
                }

                tabEl.actionButtons = actionButtons;

                var divActionButtons = syn.$l.get('divActionButtons');
                syn.$w.purge(divActionButtons);
                divActionButtons.innerHTML = '';

                for (var i = 0; i < actionButtons.length; i++) {
                    var actionButton = actionButtons[i];
                    var button = syn.$m.create({
                        id: 'fab_' + actionButton.command,
                        tag: 'button',
                        className: `${(menuType == 'F' ? '' : 'hidden')} btn ${($string.isNullOrEmpty(actionButton.class) == true ? '' : actionButton.class)}`
                    });

                    button.type = 'button';

                    if ($string.isNullOrEmpty(actionButton.disabled) == false && $string.toBoolean(actionButton.disabled) == true) {
                        button.disabled = 'disabled';
                    }

                    if ($string.isNullOrEmpty(actionButton.hidden) == false && $string.toBoolean(actionButton.hidden) == true) {
                        syn.$m.addClass(button, 'hide!');
                    }
                    else {
                        syn.$m.removeClass(button, 'hide!');
                    }

                    if ($string.isNullOrEmpty(actionButton.text) == true) {
                        button.innerHTML = `<i class="f:18 ti ti-${actionButton.icon}"></i>`;
                    }
                    else {
                        button.innerHTML = `<i class="f:18 ti ti-${actionButton.icon} mr:4"></i> ${actionButton.text}`;
                    }

                    if (actionButton.action) {
                        syn.$l.addEvent(button, 'click', actionButton.action);
                    }

                    syn.$m.appendChild(divActionButtons, button);
                }

                if (tabEl && tabEl.functions) {
                    var commands = tabEl.functions.split("|");
                    for (var i = 0; i < commands.length; i++) {
                        var command = commands[i];
                        if ($string.isNullOrEmpty(command) == false) {
                            syn.$m.removeClass('fab_' + command, 'hidden');
                        }
                    }
                }
            }
        },

        resizeTabUI() {
            var currentTab = syn.$l.querySelector('.chrome-tab[active]');
            var tabFrames = syn.$l.querySelectorAll('#tabContainer [tag="iframe"]');

            for (var i = 0, l = tabFrames.length; i < l; i++) {
                tabFrames[i].resizeReady = true;
            }

            if (currentTab) {
                try {
                    var tabID = currentTab.getAttribute('data-tab-id');
                    var pageWindow = $this.method.getActiveTabContent(tabID);

                    if (pageWindow && pageWindow.syn) {
                        var pageScript = pageWindow[pageWindow.syn.$w.pageScript];

                        $this.method.tabUIResizing(pageScript);
                    }
                    syn.$l.get(tabID + '$i').resizeReady = false;
                }
                catch (error) {
                }
            }
        },

        addRecentMenus(recentMenu) {
            if ($this.prop.recentMenus.length > 0) {
                var lastRecentMenu = $this.prop.recentMenus[$this.prop.recentMenus.length - 1];

                if (lastRecentMenu.tabID !== recentMenu.tabID) {
                    $this.prop.recentMenus.push(recentMenu);
                }

                lastRecentMenu = null;
            }
            else {
                $this.prop.recentMenus.push(recentMenu);
            }
        },

        getRecentMenus() {
            return $this.prop.recentMenus;
        },

        concreateMenuControl() {
            var orderSortFunction = function (a, b) {
                if (a.sortingNo > b.sortingNo) {
                    return 1;
                }
                if (a.sortingNo < b.sortingNo) {
                    return -1;
                }
                return 0;
            };

            var nameSortFunction = function (a, b) {
                if (a.menuName > b.menuName) {
                    return 1;
                }
                if (a.menuName < b.menuName) {
                    return -1;
                }
                return 0;
            };

            var root_node = $this.prop.menus.find(function (item) { return item.parentMenuID == null });
            if ($object.isNullOrUndefined(root_node) == true) {
                syn.$l.eventLog('concreateMenuControl', 'root 메뉴 정보 확인 필요', 'Error');
                return;
            }

            $this.prop.gnb_nodes = $this.prop.menus.filter(function (item) { return item.parentMenuID == root_node.menuID }).sort(orderSortFunction);
            $this.prop.search_nodes = $this.prop.menus.filter(function (item) { return item.menuType == 'U' }).sort(nameSortFunction);

            var elLnbMenus = syn.$l.get('divTreeMenu');
            var navList = syn.$m.create({
                tag: 'ul',
                className: 'navbar-nav pt-lg-3'
            });

            for (var i = 0, gnbLength = $this.prop.gnb_nodes.length; i < gnbLength; i++) {
                var rootNode = $this.prop.gnb_nodes[i];

                if ($string.isNullOrEmpty(rootNode.showYN) == false && rootNode.showYN == 'N') {
                    continue;
                }

                var navItem = syn.$m.create({
                    id: 'gnb' + rootNode.menuID,
                    tag: 'li',
                    className: 'nav-item'
                });

                syn.$l.addEvent(navItem, 'click', $this.event.navItem_click);

                var navLink = syn.$m.create({
                    tag: 'div',
                    className: 'nav-link'
                });

                if ($string.isNullOrEmpty(rootNode.icon) == true) {
                    rootNode.icon = 'border-none';
                }

                var navIcon = syn.$m.create({
                    tag: 'span',
                    className: 'nav-link-icon d-md-none d-lg-inline-block',
                    html: `<i class="f:18 ti ti-${rootNode.icon}"></i>`
                });

                var navTitle = syn.$m.create({
                    tag: 'span',
                    className: 'nav-link-title'
                });

                navTitle.textContent = rootNode.menuName;

                syn.$m.appendChild(navLink, navIcon);
                syn.$m.appendChild(navLink, navTitle);
                syn.$m.appendChild(navItem, navLink);

                if (rootNode.menuType == 'D') {
                    syn.$m.addClass(navItem, 'dropdown');
                    syn.$m.addClass(navLink, 'dropdown-toggle');

                    var lnb_nodes = $this.prop.menus.filter(function (item) { return item.parentMenuID == rootNode.menuID }).sort(orderSortFunction);
                    if (lnb_nodes.length > 0) {
                        var dropDownMenu = syn.$m.create({
                            tag: 'div',
                            className: 'dropdown-menu'
                        });

                        var dropDownColumns = syn.$m.create({
                            tag: 'div',
                            className: 'dropdown-menu-columns'
                        });

                        var dropDownColumn = syn.$m.create({
                            tag: 'div',
                            className: 'dropdown-menu-column'
                        });

                        for (var j = 0, lnbLength = lnb_nodes.length; j < lnbLength; j++) {
                            var lnb_node = lnb_nodes[j];

                            if ($string.isNullOrEmpty(lnb_node.showYN) == false && lnb_node.showYN == 'N') {
                                continue;
                            }

                            var lnbItem = syn.$m.create({
                                id: 'lnb' + lnb_node.menuID,
                                tag: 'span',
                                className: 'dropdown-item',
                                text: lnb_node.menuName
                            });

                            syn.$l.addEvent(lnbItem, 'click', $this.event.lnbItem_click);

                            if ($string.isNullOrEmpty(lnb_node.badge) == false) {
                                var badge = syn.$m.create({
                                    tag: 'span',
                                    className: 'badge badge-sm bg-blue-lt ms-auto',
                                    text: lnb_node.badge
                                });

                                syn.$m.appendChild(lnbItem, badge);
                            }

                            if (lnb_node.menuType == 'D') {
                                var dropEnd = syn.$m.create({
                                    tag: 'div',
                                    className: 'dropend'
                                });

                                syn.$m.addClass(lnbItem, 'dropdown-toggle');

                                syn.$m.appendChild(dropEnd, lnbItem);

                                var lst_nodes = $this.prop.menus.filter(function (item) { return item.parentMenuID == lnb_node.menuID }).sort(orderSortFunction);
                                if (lst_nodes.length > 0) {
                                    var lstDropDownMenu = syn.$m.create({
                                        id: 'lst' + lnb_node.menuID,
                                        tag: 'div',
                                        className: 'dropdown-menu'
                                    });

                                    for (var k = 0, lstLength = lst_nodes.length; k < lstLength; k++) {
                                        var menuNode = lst_nodes[k];

                                        if ($string.isNullOrEmpty(menuNode.showYN) == false && menuNode.showYN == 'N') {
                                            continue;
                                        }

                                        var lstItem = syn.$m.create({
                                            id: 'lst' + menuNode.menuID,
                                            tag: 'span',
                                            className: 'dropdown-item',
                                            text: menuNode.menuName
                                        });

                                        syn.$l.addEvent(lstItem, 'click', $this.event.lstItem_click);

                                        if ($string.isNullOrEmpty(menuNode.badge) == false) {
                                            var badge = syn.$m.create({
                                                tag: 'span',
                                                className: 'badge badge-sm bg-blue-lt ms-auto',
                                                text: lnb_node.badge
                                            });

                                            syn.$m.appendChild(lstItem, badge);
                                        }

                                        syn.$m.appendChild(lstDropDownMenu, lstItem);
                                    }

                                    syn.$m.appendChild(dropEnd, lstDropDownMenu);
                                }
                                syn.$m.appendChild(dropDownColumn, dropEnd);
                            }
                            else {
                                syn.$m.appendChild(dropDownColumn, lnbItem);
                            }
                        }

                        syn.$m.appendChild(dropDownColumns, dropDownColumn);
                        syn.$m.appendChild(dropDownMenu, dropDownColumns);

                        syn.$m.appendChild(navItem, dropDownMenu);
                    }
                }

                syn.$m.appendChild(navList, navItem);
            }

            syn.$m.appendChild(elLnbMenus, navList);
        },

        getWindowHeight(isCurrentWindow) {
            var result = 600;
            var context = top.window;
            if ($object.isNullOrUndefined(isCurrentWindow) == false && $string.toBoolean(isCurrentWindow) == true) {
                context = window;
            }

            if (context.innerHeight) {
                result = context.innerHeight;
            }
            else {
                if (context.document.body && context.document.body.offsetHeight) {
                    result = context.document.body.offsetHeight;
                }
                else if (context.document.compatMode == 'CSS1Compat' && context.document.documentElement && context.document.documentElement.offsetHeight) {
                    result = context.document.documentElement.offsetHeight;
                }
            }

            return result;
        },

        getWindowWidth(isCurrentWindow) {
            var result = 1024;
            var context = top.window;
            if ($object.isNullOrUndefined(isCurrentWindow) == false && $string.toBoolean(isCurrentWindow) == true) {
                context = window;
            }

            if (window.innerWidth) {
                result = window.innerWidth;
            }
            else {
                if (context.document.body && context.document.body.offsetWidth) {
                    result = context.document.body.offsetWidth;
                }
                else if (context.document.compatMode == 'CSS1Compat' && context.document.documentElement && context.document.documentElement.offsetWidth) {
                    result = context.document.documentElement.offsetWidth;
                }
            }

            return result;
        },

        setStatusMessage(tabID, val) {
            var tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`)
            if (tabEl) {
                tabEl.statusMessage = val;
                var el = syn.$l.querySelector('.statusSection .status');
                if (el) {
                    el.innerText = val;
                }
            }
        },

        logout: async function (message) {
            $this.method.stopSessionTimer();

            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.TokenID', '/');
            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.Cookies', '/');
            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.Member', '/');
            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.Variable', '/');
            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.BearerToken', '/');

            syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
            syn.$w.removeStorage('program_token', true);
            syn.$w.removeStorage('handstack_managedapp', true);
            sessionStorage.clear();

            await syn.$r.httpRequest('GET', '/checkup/api/account/logout?tick=' + new Date().getTime());

            if ($string.isNullOrEmpty(message) == true) {
                message = '로그아웃 되었습니다';
            }

            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'success';
            alertOptions.buttonType = '1';
            syn.$w.alert(message, 'System Logout', alertOptions, function (result) {
                location.href = '/checkup//account/signin.html';
            });

            setTimeout(() => {
                location.href = '/checkup//account/signin.html';
            }, 10000);
        },

        isConnectedSession() {
            if ($this.prop.timerRunning) {
                if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable') == null || syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member') == null || syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken') == null) {
                    $this.prop.cookieCheckTryCount = $this.prop.cookieCheckTryCount + 1;
                    if ($this.prop.cookieCheckTryCount > 3) {
                        $this.method.stopSessionTimer();
                        $this.method.logout('보안상의 이유로 HandStack 액세스 토큰이 만료되었습니다. HandStack에 다시 로그인해야 합니다');
                    }
                    else {
                        syn.$l.eventLog('isConnectedSession failure', 'cookieCheckTryCount - {0}'.format($this.prop.cookieCheckTryCount), 'Information');

                        if (syn.Config.Environment == 'Development') {
                            syn.$l.eventLog('cookie', syn.Config.CookiePrefixName + '.Variable - {0}'.format(syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable')), 'Information');
                            syn.$l.eventLog('cookie', syn.Config.CookiePrefixName + '.Member - {0}'.format(syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member')), 'Information');
                            syn.$l.eventLog('cookie', syn.Config.CookiePrefixName + '.BearerToken - {0}'.format(syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken')), 'Information');
                            syn.$l.eventLog('storage', 'apiServices - {0}'.format($w.getStorage('apiServices', false)), 'Information');
                            syn.$l.eventLog('storage', 'member - {0}'.format($w.getStorage('member', false)), 'Information');
                            syn.$l.eventLog('storage', 'variable - {0}'.format($w.getStorage('variable', false)), 'Information');
                        }

                        var expireTicks = syn.$w.getStorage('expireTicks') || syn.$r.getCookie(syn.Config.CookiePrefixName + '.ExpireTicks') || null;
                        if (expireTicks == null || expireTicks == undefined) {
                            expireTicks = (new Date()).getTime() + (1000 * 60 * 60 * 24);
                        }
                        else {
                            expireTicks = (new Date(parseFloat(expireTicks))).getTime();
                        }

                        var expires = new Date(expireTicks);

                        if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable') == null && syn.$w.getStorage('variable')) {
                            syn.$r.setCookie(syn.Config.CookiePrefixName + '.Variable', syn.$w.getStorage('variable'), expires);
                        }

                        if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member') == null && syn.$w.getStorage('member')) {
                            syn.$r.setCookie(syn.Config.CookiePrefixName + '.Member', syn.$w.getStorage('member'), expires);
                        }

                        if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken') == null && syn.$w.getStorage('bearerToken')) {
                            syn.$r.setCookie(syn.Config.CookiePrefixName + '.BearerToken', syn.$w.getStorage('bearerToken'), expires);
                        }

                        if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.TokenID') == null && syn.$w.getStorage('program_token', true)) {
                            syn.$r.setCookie(syn.Config.CookiePrefixName + '.TokenID', syn.$w.getStorage('program_token', true), expires);
                        }
                    }
                }
                else {
                    $this.prop.cookieCheckTryCount = 0;
                }
            }
        },

        startSessionTimer() {
            $this.prop.timerRunning = true;
            $this.prop.timerID = setTimeout($this.method.startSessionTimer, $this.prop.timerDelay);
            $this.method.isConnectedSession();
        },

        stopSessionTimer() {
            if ($this.prop.timerRunning) {
                clearTimeout($this.prop.timerID);
            }

            $this.prop.timerRunning = false;
        }
    }
}
