'use strict';
let $HAC020 = {
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

                var repositoryID = syn.$l.get('txtRepositoryID').value.trim();
                if (repositoryID == '') {
                    syn.$w.alert('저장소 ID를 입력하세요');
                    return false;
                }

                if ($this.prop.pageMode == 'new') {
                    var repository = $this.store.Repository.find((item) => { return item.RepositoryID == repositoryID });
                    if (repository) {
                        syn.$w.alert('중복된 저장소 ID 입니다');
                        return false;
                    }
                }

                if ($this.prop.pageMode == 'new' || $this.prop.pageMode == 'edit') {
                    $this.store.Exception.Error = '';

                    syn.$l.get('txtPhysicalPath').value = '{appBasePath}/.managed/storage/' + syn.$l.get('txtRelativePath').value;

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
            text: '저장소 확인 테스트',
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
                { type: 'Grid', dataFieldID: 'Repository' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($object.isNullOrUndefined(error) == true) {
                    var repository = {
                        items: $this.store.Repository
                    };

                    $this.method.drawHtmlTemplate('lstRepository', 'tplRepositoryItem', repository, '<div class="list-group-header sticky-top">저장소</div>');
                    $this.method.clearSelectedItem('Y');

                    if ($string.isNullOrEmpty($this.prop.searchSelectedItem) == false) {
                        var el = syn.$l.get('divItem_' + $this.prop.searchSelectedItem);
                        var repository = $this.store.Repository.find((item) => { return item.RepositoryID == $this.prop.searchSelectedItem });
                        if (el && repository) {
                            $this.event.divRepositoryItem_click(el, $this.prop.searchSelectedItem);
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
                var repositoryID = syn.$l.get('txtRepositoryID').value;
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '확인 되었습니다', repositoryID);
                }
                else {
                    syn.$w.notify('warning', '확인에 실패했습니다. 오류: ' + $this.store.Exception.Message, repositoryID);
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
                var repositoryID = syn.$l.get('txtRepositoryID').value;
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '저장 되었습니다', repositoryID);

                    $this.prop.searchSelectedItem = repositoryID;

                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + $this.store.Exception.Message, repositoryID);
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
                var repositoryID = syn.$l.get('txtRepositoryID').value;
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '삭제 되었습니다', repositoryID);

                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '삭제에 실패했습니다. 오류: ' + $this.store.Exception.Message, repositoryID);
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
            syn.$l.get('txtRequestOrigin').value = location.origin;

            $this.method.search();
        },
    },

    event: {
        divRepositoryItem_click(el, repositoryID) {
            var repository = $this.store.Repository.find((item) => { return item.RepositoryID == repositoryID });
            if (repository) {
                $this.method.clearSelectedItem('N');

                syn.$w.setterValue('GD01', [repository]);

                syn.$l.get('txtRelativePath').value = syn.$l.get('txtPhysicalPath').value.replace('{appBasePath}/.managed/storage/', '');

                var listItems = syn.$l.querySelectorAll('.list-group-item.active');
                for (var i = 0, length = listItems.length; i < length; i++) {
                    var listItem = listItems[i];
                    syn.$m.removeClass(listItem, 'active');
                }
                syn.$m.addClass(el, 'active');

                $this.method.updateActionButton('edit');
            }
        },

        btnNewRepository_click(evt) {
            $this.method.clearSelectedItem('N');

            $this.method.updateActionButton('new');

            syn.$l.get('txtRepositoryID').focus();
        },

        btnAccessIDGenerate_click(evt) {
            syn.$l.get('txtAccessID').value = syn.$l.random();
        },

        btnDefaultTransactionCommand_click(evt) {
            syn.$l.get('txtTransactionGetItem').value = 'HDS|STR|STR010|LD01';
            syn.$l.get('txtTransactionGetItems').value = 'HDS|STR|STR010|LD02';
            syn.$l.get('txtTransactionDeleteItem').value = 'HDS|STR|STR010|DD01';
            syn.$l.get('txtTransactionUpsertItem').value = 'HDS|STR|STR010|MD01';
            syn.$l.get('txtTransactionUpdateDependencyID').value = 'HDS|STR|STR010|UD01';
            syn.$l.get('txtTransactionUpdateFileName').value = 'HDS|STR|STR010|UD02';
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

            syn.$l.get('txtRepositoryID').value = '';
            syn.$l.get('txtRepositoryName').value = '';
            syn.$l.get('txtAccessID').value = '';
            syn.$l.get('txtStorageType').value = 'FileSystem';
            syn.$l.get('txtPhysicalPath').value = '';
            syn.$l.get('txtRelativePath').value = '';
            syn.$l.get('txtBlobContainerID').value = '';
            syn.$l.get('txtBlobConnectionString').value = '';
            syn.$l.get('txtBlobItemUrl').value = '';
            syn.$l.get('chkIsVirtualPath').checked = false;
            syn.$l.get('ddlAccessMethod').value = 'public';
            syn.$l.get('chkIsFileUploadDownloadOnly').checked = false;
            syn.$l.get('chkIsMultiUpload').checked = false;
            syn.$l.get('chkIsFileOverWrite').checked = false;
            syn.$l.get('chkIsFileNameEncrypt').checked = false;
            syn.$l.get('chkIsKeepFileExtension').checked = false;
            syn.$l.get('chkIsAutoPath').checked = false;
            syn.$l.get('ddlPolicyPathID').value = '1';
            syn.$l.get('ddlUploadTypeID').value = 'Single';
            syn.$l.get('txtUploadExtensions').value = '';
            syn.$l.get('txtUploadCount').value = '';
            syn.$l.get('txtUploadSizeLimit').value = '';
            syn.$l.get('ddlIsLocalDBFileManaged').value = 'false';
            syn.$l.get('txtSQLiteConnectionString').value = 'URI=file:{appBasePath}/.managed/sqlite/storage.db;Pooling=True;Max Pool Size=100;Version=3;';
            syn.$l.get('txtTransactionGetItem').value = 'HDS|STR|STR010|LD01';
            syn.$l.get('txtTransactionGetItems').value = 'HDS|STR|STR010|LD02';
            syn.$l.get('txtTransactionDeleteItem').value = 'HDS|STR|STR010|DD01';
            syn.$l.get('txtTransactionUpsertItem').value = 'HDS|STR|STR010|MD01';
            syn.$l.get('txtTransactionUpdateDependencyID').value = 'HDS|STR|STR010|UD01';
            syn.$l.get('txtTransactionUpdateFileName').value = 'HDS|STR|STR010|UD02';
            syn.$l.get('txtComment').value = '';

            var els = syn.$l.get('txtRepositoryID'
                , 'txtRepositoryName'
                , 'txtAccessID'
                , 'txtStorageType'
                , 'txtPhysicalPath'
                , 'txtRelativePath'
                , 'txtBlobContainerID'
                , 'txtBlobConnectionString'
                , 'txtBlobItemUrl'
                , 'chkIsVirtualPath'
                , 'ddlAccessMethod'
                , 'chkIsFileUploadDownloadOnly'
                , 'chkIsMultiUpload'
                , 'chkIsFileOverWrite'
                , 'chkIsFileNameEncrypt'
                , 'chkIsKeepFileExtension'
                , 'chkIsAutoPath'
                , 'ddlPolicyPathID'
                , 'ddlUploadTypeID'
                , 'txtUploadExtensions'
                , 'txtUploadCount'
                , 'txtUploadSizeLimit'
                , 'ddlIsLocalDBFileManaged'
                , 'txtSQLiteConnectionString'
                , 'txtTransactionGetItem'
                , 'txtTransactionGetItems'
                , 'txtTransactionDeleteItem'
                , 'txtTransactionUpsertItem'
                , 'txtTransactionUpdateDependencyID'
                , 'txtTransactionUpdateFileName'
                , 'txtComment'
                , 'btnAccessIDGenerate'
                , 'btnDefaultTransactionCommand');

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
                    syn.$l.get('btnNewRepository').removeAttribute('disabled');
                    break;
                case 'new':
                    syn.$w.updateUIButton([{ command: 'save', hidden: false, }, { command: 'cancel', hidden: false, }, { command: 'link', hidden: false, }]);
                    syn.$l.get('btnNewRepository').setAttribute('disabled', 'disabled');
                    break;
                case 'edit':
                    syn.$w.updateUIButton([{ command: 'save', hidden: false, }, { command: 'delete', hidden: false, }, { command: 'cancel', hidden: false, }, { command: 'link', hidden: false, }]);
                    syn.$l.get('btnNewRepository').setAttribute('disabled', 'disabled');
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

        drawHtmlTemplate(elID, templateID, repository, prefixHtml) {
            prefixHtml = prefixHtml || '';
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                var templateHtml = tplEL.innerHTML;
                drawEl.innerHTML = prefixHtml + Mustache.render(templateHtml, repository);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.message, 'Error');
            }
        },
    },
}
