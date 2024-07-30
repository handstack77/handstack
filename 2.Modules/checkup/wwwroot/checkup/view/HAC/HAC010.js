'use strict';
let $HAC010 = {
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

                var dataSourceID = syn.$l.get('txtDataSourceID').value.trim();
                if (dataSourceID == '') {
                    syn.$w.alert('데이터 원본 ID를 입력하세요');
                    return false;
                }

                if ($this.prop.pageMode == 'new') {
                    var dataSource = $this.store.DataSource.find((item) => { return item.DataSourceID == dataSourceID });
                    if (dataSource) {
                        syn.$w.alert('중복된 데이터 원본 ID 입니다');
                        return false;
                    }
                }

                if (syn.$l.get('ddlDataProvider').value == 'SQLite') {
                    var fileName = syn.$l.get('txtFileName').value.trim();
                    if (fileName == '') {
                        syn.$w.alert('SQLite 파일명을 입력하세요');
                        return false;
                    }
                    else {
                        if (fileName.indexOf('.db') == -1) {
                            fileName = fileName + '.db';
                        }

                        for (var i = 0, length = $this.store.DataSource.length; i < length; i++) {
                            var item = $this.store.DataSource[i];
                            if (item.ConnectionString.indexOf(`/${fileName};`) > -1) {
                                syn.$w.alert(`'${fileName}' SQLite 파일명이 '${item.DataSourceID}'에 사용 중입니다. 중복 되지 않게 입력하세요`);
                                return false;
                            }
                        }

                        syn.$l.get('txtConnectionString').value = `URI=file:{appBasePath}/.managed/sqlite/${fileName};Journal Mode=Off;Cache Size=4000;Synchronous=Normal;Page Size=4096;Pooling=True;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;`;
                    }
                }

                var connectionString = syn.$l.get('txtConnectionString').value.trim();
                if (connectionString == '') {
                    syn.$w.alert('연결 문자열을 입력하세요');
                    return false;
                }

                var projectID = syn.$l.get('txtProjectID').value.trim();
                if (projectID == '') {
                    syn.$w.alert('데이터베이스 접근을 허용할 프로젝트 ID를 입력하세요');
                    return false;
                }

                if ($this.prop.pageMode == 'new' || $this.prop.pageMode == 'read' || $this.prop.pageMode == 'edit') {
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
                syn.$w.setTabContentHeight();
            }
        },
        {
            command: 'link',
            icon: 'link',
            text: '연결 테스트',
            hidden: true,
            action(evt) {
                var connectionString = syn.$l.get('txtConnectionString').value.trim();
                if (connectionString == '') {
                    syn.$w.alert('연결 문자열을 입력하세요');
                    return false;
                }

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
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'DataSource' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($object.isNullOrUndefined(error) == true) {
                    for (var i = 0, length = $this.store.DataSource.length; i < length; i++) {
                        var item = $this.store.DataSource[i];
                        item.DefaultID = item.ConnectionString.indexOf('/app.db;') > -1;
                    }

                    var dataSource = {
                        items: $this.store.DataSource
                    };

                    $this.method.drawHtmlTemplate('lstDataSource', 'tplDataSourceItem', dataSource, '<div class="list-group-header sticky-top">데이터 원본</div>');
                    $this.method.clearSelectedItem('Y');

                    if ($string.isNullOrEmpty($this.prop.searchSelectedItem) == false) {
                        var el = syn.$l.get('divItem_' + $this.prop.searchSelectedItem);
                        var dataSource = $this.store.DataSource.find((item) => { return item.DataSourceID == $this.prop.searchSelectedItem });
                        if (el && dataSource) {
                            $this.event.divDataSourceItem_click(el, $this.prop.searchSelectedItem);
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
                var dataSourceID = syn.$l.get('txtDataSourceID').value;
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '연결 되었습니다', dataSourceID);
                }
                else {
                    syn.$w.notify('warning', '연결에 실패했습니다. 오류: ' + $this.store.Exception.Message, dataSourceID);
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
                var dataSourceID = syn.$l.get('txtDataSourceID').value;
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '저장 되었습니다', dataSourceID);

                    $this.prop.searchSelectedItem = dataSourceID;

                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '저장에 실패했습니다. 오류: ' + $this.store.Exception.Message, dataSourceID);
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
                var dataSourceID = syn.$l.get('txtDataSourceID').value;
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '삭제 되었습니다', dataSourceID);

                    $this.method.search();
                }
                else {
                    syn.$w.notify('warning', '삭제에 실패했습니다. 오류: ' + $this.store.Exception.Message, dataSourceID);
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
        divDataSourceItem_click(el, dataSourceID) {
            var dataSource = $this.store.DataSource.find((item) => { return item.DataSourceID == dataSourceID });
            if (dataSource) {
                $this.method.clearSelectedItem('N');

                syn.$w.setterValue('GD01', [dataSource]);

                $this.method.visibleDivConnection(dataSource.DataProvider);

                syn.$l.get('txtDataSourceID').setAttribute('disabled', 'disabled');
                syn.$l.get('ddlDataProvider').setAttribute('disabled', 'disabled');
                syn.$l.get('txtFileName').setAttribute('disabled', 'disabled');
                syn.$l.get('txtConnectionString').setAttribute('disabled', 'disabled');

                if (syn.$l.get('txtConnectionString').value.indexOf('/app.db;') == -1) {
                    syn.$m.addClass('lblDataSourceIDAlert', 'hidden');

                    syn.$l.get('txtDataSourceID').removeAttribute('disabled');
                    syn.$l.get('ddlDataProvider').removeAttribute('disabled');
                    syn.$l.get('txtFileName').removeAttribute('disabled');
                    syn.$l.get('txtConnectionString').removeAttribute('disabled');

                    $this.method.updateActionButton('edit');
                }
                else {
                    syn.$m.removeClass('lblDataSourceIDAlert', 'hidden');

                    $this.method.updateActionButton('read');
                }

                syn.$l.get('txtProjectID').value = syn.$l.get('txtProjectID').value.split(',').sort().join(',');
                $this.method.updateProjectItem(syn.$l.get('txtProjectID').value);
            }
        },

        lblProjectItem_click(el, projectID) {
            var projects = syn.$l.get('txtProjectID').value.split(',');
            projects.splice(projects.indexOf(projectID), 1);
            syn.$l.get('txtProjectID').value = projects.sort().join(',');
            $this.method.updateProjectItem(syn.$l.get('txtProjectID').value);
        },

        txtProjectAppender_keypress(evt) {
            if (evt.key == 'Enter') {
                $this.method.mergeProjectItem(syn.$l.get('txtProjectID').value);
            }
        },

        btnProjectAppender_click(evt) {
            $this.method.mergeProjectItem(syn.$l.get('txtProjectID').value);
        },

        btnNewDataSource_click(evt) {
            $this.method.clearSelectedItem('N');

            $this.method.updateActionButton('new');

            syn.$l.get('txtDataSourceID').focus();
        },

        ddlDataProvider_change(evt) {
            $this.method.visibleDivConnection(syn.$l.get('ddlDataProvider').value);
        }
    },

    method: {
        search() {
            syn.$w.transactionAction('LF01');
        },

        visibleDivConnection(dataProvider) {
            syn.$l.get('txtFileName').value = '';

            if (dataProvider == 'SQLite') {
                syn.$m.addClass('divConnection2', 'hidden');
                syn.$m.removeClass('divConnection1', 'hidden');

                var connectionString = syn.$l.get('txtConnectionString').value;
                var regex = /\/sqlite\/([^\/]+);Journal/;
                var matchs = connectionString.match(regex);

                if (matchs && matchs.length == 2) {
                    syn.$l.get('txtFileName').value = matchs[1];
                }
            }
            else {
                syn.$m.removeClass('divConnection2', 'hidden');
                syn.$m.addClass('divConnection1', 'hidden');
            }
        },

        clearSelectedItem(isDisabled) {
            var listItems = syn.$l.querySelectorAll('.list-group-item.active');
            for (var i = 0, length = listItems.length; i < length; i++) {
                var listItem = listItems[i];
                syn.$m.removeClass(listItem, 'active');
            }

            syn.$l.get('txtDataSourceID').value = '';
            syn.$l.get('ddlDataProvider').value = 'SQLite';
            syn.$l.get('txtFileName').value = '';
            syn.$l.get('txtConnectionString').value = '';
            syn.$l.get('txtProjectID').value = '';
            syn.$l.get('txtProjectAppender').value = '';
            syn.$l.get('lstProject').innerHTML = '';
            syn.$l.get('txtComment').value = '';

            syn.$m.addClass('lblDataSourceIDAlert', 'hidden');

            $this.method.visibleDivConnection(syn.$l.get('ddlDataProvider').value);

            var els = syn.$l.get('txtDataSourceID'
                , 'ddlDataProvider'
                , 'txtFileName'
                , 'txtConnectionString'
                , 'txtProjectID'
                , 'txtProjectAppender'
                , 'btnProjectAppender'
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
                    syn.$l.get('btnNewDataSource').removeAttribute('disabled');
                    break;
                case 'new':
                    syn.$w.updateUIButton([{ command: 'save', hidden: false, }, { command: 'cancel', hidden: false, }, { command: 'link', hidden: false, }]);
                    syn.$l.get('btnNewDataSource').setAttribute('disabled', 'disabled');
                    break;
                case 'read':
                    syn.$w.updateUIButton([{ command: 'save', hidden: false, }, { command: 'delete', hidden: true, }, { command: 'cancel', hidden: false, }, { command: 'link', hidden: false, }]);
                    syn.$l.get('btnNewDataSource').setAttribute('disabled', 'disabled');
                    break;
                case 'edit':
                    syn.$w.updateUIButton([{ command: 'save', hidden: false, }, { command: 'delete', hidden: false, }, { command: 'cancel', hidden: false, }, { command: 'link', hidden: false, }]);
                    syn.$l.get('btnNewDataSource').setAttribute('disabled', 'disabled');
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

        updateProjectItem(projectID) {
            var projectItems = [];
            var projects = projectID.split(',');
            for (var i = 0, length = projects.length; i < length; i++) {
                var project = projects[i].trim();
                if ($string.isNullOrEmpty(project) == false) {
                    projectItems.push(project);
                }
            }

            var dataSource = {
                items: projectItems
            };

            $this.method.drawHtmlTemplate('lstProject', 'tplProjectItem', dataSource);
            syn.$w.setTabContentHeight();
        },

        drawHtmlTemplate(elID, templateID, dataSource, prefixHtml) {
            prefixHtml = prefixHtml || '';
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                var templateHtml = tplEL.innerHTML;
                drawEl.innerHTML = prefixHtml + Mustache.render(templateHtml, dataSource);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.message, 'Error');
            }
        }
    }
}
