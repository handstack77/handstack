'use strict';
let $HAC030 = {
    config: {
        actionButtons: [{
            command: 'search',
            icon: 'search',
            text: '조회',
            action(evt) {
                $this.method.search();
            }
        },
        {
            command: 'save',
            icon: 'edit',
            text: '저장',
            class: 'btn-primary',
            hidden: true,
            action(evt) {
                syn.$l.get('txtPageMode').value = $this.prop.pageMode;

                var applicationID = syn.$l.get('txtApplicationID').value.trim();
                if (applicationID == '') {
                    syn.$w.alert('어플리케이션 ID를 입력하세요');
                    return false;
                }

                var projectID = syn.$l.get('txtProjectID').value.trim();
                if (projectID == '') {
                    syn.$w.alert('프로젝트 ID를 입력하세요');
                    return false;
                }

                var uri = syn.$l.get('txtUri').value.trim();
                if (uri == '') {
                    syn.$w.alert('통합 자원 식별자를 입력하세요');
                    return false;
                }

                var commandType = syn.$l.get('ddlCommandType').value.trim();
                var environment = syn.$l.get('ddlEnvironment').value.trim();

                if ($this.prop.pageMode == 'new') {
                    var transactProxy = $this.store.Routing.find((item) => {
                        return item.ApplicationID == applicationID
                            && item.ProjectID == projectID
                            && item.CommandType == commandType
                            && item.Environment == environment
                    });

                    if (transactProxy) {
                        syn.$w.alert('중복된 거래 라우팅 ID 입니다');
                        return false;
                    }
                }

                if ($this.prop.pageMode == 'new' || $this.prop.pageMode == 'edit') {
                    $this.store.Exception.Error = '';

                    syn.$w.transactionAction('MF01');
                }
            }
        },
        {
            command: 'delete',
            icon: 'trash',
            text: '삭제',
            class: 'btn-danger',
            hidden: true,
            action(evt) {
                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'question';
                alertOptions.buttonType = '3';
                syn.$w.alert('정말로 삭제하시겠습니까?', '삭제 확인', alertOptions, function (result) {
                    if (result == 'Yes') {
                        $this.store.Exception.Error = '';
                        syn.$w.transactionAction('DF01');
                    }
                });
            }
        },
        {
            command: 'cancel',
            icon: 'arrow-back-up',
            text: '취소',
            hidden: true,
            action(evt) {
                $this.method.clearSelectedItem('Y');
            }
        },
        {
            command: 'link',
            icon: 'link',
            text: '거래 라우팅 확인 테스트',
            hidden: true,
            action(evt) {
                $this.store.Exception.Error = '';
                syn.$w.transactionAction('GF01');
            }
        },
        {
            command: 'refresh',
            icon: 'refresh',
            action(evt) {
                location.reload();
            }
        }]
    },

    prop: {
        pageMode: 'ready',
        searchSelectedItem: null
    },

    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }]
        },

        LF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'MainForm' },
                { type: 'Grid', dataFieldID: 'Routing' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($object.isNullOrUndefined(error) == true) {
                    for (var i = 0, length = $this.store.Routing.length; i < length; i++) {
                        var item = $this.store.Routing[i];
                        item.TransactProxyID = `${item.ApplicationID}|${item.ProjectID}|${item.CommandType}|${item.Environment}`;
                        item.EnvironmentName = item.Environment == 'D' ? '개발' : (item.Environment == 'P' ? '운영' : '테스트');
                    }

                    var routing = {
                        items: $this.store.Routing
                    };

                    $this.method.drawHtmlTemplate('lstTransactProxy', 'tplTransactProxyItem', routing, '<div class="list-group-header sticky-top">거래 라우팅</div>');
                    $this.method.clearSelectedItem('Y');

                    if ($string.isNullOrEmpty($this.prop.searchSelectedItem) == false) {
                        var el = syn.$l.get('divItem_' + $this.prop.searchSelectedItem);
                        var routing = $this.store.Routing.find((item) => {
                            return item.ApplicationID == $this.prop.searchSelectedItem.ApplicationID
                                && item.ProjectID == $this.prop.searchSelectedItem.ProjectID
                                && item.CommandType == $this.prop.searchSelectedItem.CommandType
                                && item.Environment == $this.prop.searchSelectedItem.Environment
                        });
                        if (el && routing) {
                            $this.event.divTransactProxyItem_click(el, $this.prop.searchSelectedItem);
                        }

                        $this.prop.searchSelectedItem = null;
                    }
                }
            }
        },

        GF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '확인 되었습니다');
                }
                else {
                    syn.$w.notify('warning', '확인에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        },

        MF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '저장 되었습니다');

                    $this.prop.searchSelectedItem = `${syn.$l.get('txtApplicationID').value}|${syn.$l.get('txtProjectID').value}|${syn.$l.get('ddlCommandType').value}|${syn.$l.get('ddlEnvironment').value}`;

                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        },

        DF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '삭제 되었습니다');

                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '삭제에 실패했습니다. 오류: ' + $this.store.Exception.Message);
                }
            }
        },
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            syn.$l.get('txtUserWorkID').value = syn.$w.ManagedApp.UserWorkID;
            syn.$l.get('txtApplicationID').value = syn.$w.ManagedApp.ApplicationID;

            $this.method.search();
        },
    },

    event: {
        divTransactProxyItem_click(el, transactProxyID) {
            var transactProxy = $this.store.Routing.find((item) => { return item.TransactProxyID == transactProxyID });
            if (transactProxy) {
                syn.$l.get('txtTransactProxyID').value = transactProxyID;

                $this.method.clearSelectedItem('N');

                syn.$w.setterValue('GD01', [transactProxy]);

                var listItems = syn.$l.querySelectorAll('.list-group-item.active');
                for (var i = 0, length = listItems.length; i < length; i++) {
                    var listItem = listItems[i];
                    syn.$m.removeClass(listItem, 'active');
                }
                syn.$m.addClass(el, 'active');

                $this.method.updateActionButton('edit');
            }
        },

        btnNewTransactProxy_click(evt) {
            $this.method.clearSelectedItem('N');

            $this.method.updateActionButton('new');

            syn.$l.get('txtProjectID').focus();
        }
    },

    method: {
        search() {
            syn.$w.transactionAction('LF01');
        },

        clearSelectedItem(isDisabled) {
            isDisabled = isDisabled || 'N';
            var listItems = syn.$l.querySelectorAll('.list-group-item.active');
            for (var i = 0, length = listItems.length; i < length; i++) {
                var listItem = listItems[i];
                syn.$m.removeClass(listItem, 'active');
            }

            syn.$l.get('txtProjectID').value = '';
            syn.$l.get('ddlCommandType').value = 'D';
            syn.$l.get('ddlEnvironment').value = 'D';
            syn.$l.get('txtUri').value = '';
            syn.$l.get('txtComment').value = '';

            var els = syn.$l.get('txtProjectID'
                , 'ddlCommandType'
                , 'ddlEnvironment'
                , 'txtUri'
                , 'txtComment');

            if ($string.toBoolean(isDisabled) == true) {
                for (var i = 0, length = els.length; i < length; i++) {
                    els[i].setAttribute('disabled', 'disabled');
                }
            }
            else {
                for (var i = 0, length = els.length; i < length; i++) {
                    els[i].removeAttribute('disabled');
                }
            }

            $this.method.updateActionButton('ready');
        },

        updateActionButton(pageMode) {
            switch (pageMode) {
                case 'ready':
                    syn.$w.updateUIButton();
                    syn.$l.get('btnNewTransactProxy').removeAttribute('disabled');
                    break;
                case 'new':
                    syn.$w.updateUIButton([{ command: 'save', hidden: false, }, { command: 'cancel', hidden: false, }, { command: 'link', hidden: false, }]);
                    syn.$l.get('btnNewTransactProxy').setAttribute('disabled', 'disabled');
                    break;
                case 'edit':
                    syn.$w.updateUIButton([{ command: 'save', hidden: false, }, { command: 'delete', hidden: false, }, { command: 'cancel', hidden: false, }, { command: 'link', hidden: false, }]);
                    syn.$l.get('btnNewTransactProxy').setAttribute('disabled', 'disabled');
                    break;
            }

            $this.prop.pageMode = pageMode;
        },

        mergeProjectItem() {
            if (syn.$l.get('txtProjectAppender').value.trim() != '') {
                var sourceProjects = syn.$l.get('txtProjectAppender').value.replaceAll(' ', '').split(',');
                var targetProjects = syn.$l.get('txtProjectID').value.replaceAll(' ', '').split(',');

                var projects = sourceProjects.concat(targetProjects);
                syn.$l.get('txtProjectID').value = [...new Set(projects)].sort().join(',');
                $this.method.updateProjectItem(syn.$l.get('txtProjectID').value);

                syn.$l.get('txtProjectAppender').value = '';
            }
        },

        drawHtmlTemplate(elID, templateID, transactProxy, prefixHtml) {
            prefixHtml = prefixHtml || '';
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                var templateHtml = tplEL.innerHTML;
                drawEl.innerHTML = prefixHtml + Mustache.render(templateHtml, transactProxy);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.stack, 'Error');
            }
        },
    },
}
