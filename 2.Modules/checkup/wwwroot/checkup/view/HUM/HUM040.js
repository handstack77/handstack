'use strict';

let $HUM040 = {
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
            action(evt) {
                $this.method.save();
            }
        },
        {
            command: 'delete',
            icon: 'trash',
            text: '항목 삭제',
            class: 'btn-danger',
            action(evt) {
                $this.method.deleteFileItems();
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
        className: 'directory',
        editorLoadIntervalID: null,
        sourceEditor: null
    },

    transaction: {
        LF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception', clear: true },
                { type: 'Grid', dataFieldID: 'FileItem', clear: true }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    $this.method.updateFileItems();
                }
            }
        },

        GF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception', clear: true },
                { type: 'Form', dataFieldID: 'MainForm', clear: true }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($this.prop.sourceEditor && $string.toBoolean($this.store.Exception.Error) == false) {
                    var sourceText = syn.$l.get('txtCompressBase64').value;
                    sourceText = syn.$c.LZString.decompressFromBase64(sourceText);
                    $this.prop.sourceEditor.setValue(sourceText);
                    $this.prop.sourceEditor.setScrollPosition({ scrollTop: 0 });
                }
                else {
                    syn.$w.notify('warning', `파일 조회에 실패했습니다. 오류: ${$this.store.Exception.Message}`);
                }
            }
        },

        MF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'Exception', clear: true }],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$w.notify('success', '저장 되었습니다');

                    $this.store.Exception.Error = '';
                    syn.$w.transactionAction('LF01');
                }
                else {
                    syn.$w.notify('warning', `저장에 실패했습니다. 오류: ${$this.store.Exception.Message}`);
                }
            }
        }
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();

            if (syn.uicontrols.$sourceeditor) {
                window.require = {
                    paths: { 'vs': syn.uicontrols.$sourceeditor.defaultSetting.basePath },
                    'vs/nls': {
                        availableLanguages: {
                            '*': 'ko'
                        }
                    }
                };
                syn.$w.loadScript(syn.uicontrols.$sourceeditor.defaultSetting.basePath + '/loader.js', null, () => {
                    syn.$w.loadScript(syn.uicontrols.$sourceeditor.defaultSetting.basePath + '/editor/editor.main.nls.ko.js');
                    syn.$w.loadScript(syn.uicontrols.$sourceeditor.defaultSetting.basePath + '/editor/editor.main.js');
                });
            }
        },

        async pageLoad() {
            syn.$l.get('txtUserWorkID').value = syn.$w.ManagedApp.UserWorkID;
            syn.$l.get('txtApplicationID').value = syn.$w.ManagedApp.ApplicationID;
            syn.$l.get('txtApplicationName').value = syn.$w.ManagedApp.ApplicationName;
            syn.$l.get('txtUserNo').value = syn.$w.User.UserNo;

            $this.prop.editorLoadIntervalID = setInterval(() => {
                if ($object.isNullOrUndefined(window.monaco) == false && $object.isNullOrUndefined($this.prop.editorLoadIntervalID) == false) {
                    clearInterval($this.prop.editorLoadIntervalID);
                    $this.prop.editorLoadIntervalID = null;

                    var editorSetting = {
                        width: '100%',
                        height: '100vh',
                        language: 'txt',
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

                    editorSetting = syn.$w.argumentsExtend(syn.uicontrols.$sourceeditor.defaultSetting, editorSetting);
                    $this.prop.sourceEditor = monaco.editor.create(syn.$l.get('divSourceEditor'), editorSetting);

                    syn.$w.transactionAction('LF01');
                }
            }, 25);
        },
    },

    event: {
        async fleCommon_change(evt) {
            var length = fleCommon.files.length;
            if (length > 0) {
                if (length > 10) {
                    syn.$w.alert(`10개 이상의 파일을 업로드 할 수 없습니다`);
                }

                for (var i = 0; i < length; i++) {
                    var file = fleCommon.files[i];
                    var extension = file.name.split('.').length > 1 ? file.name.split('.')[1] : '';
                    if ($string.isNullOrEmpty(extension) == false && ['html', 'js', 'json', 'css'].indexOf(extension) > -1) {
                        var myHeaders = new Headers();
                        var formData = new FormData();
                        formData.append('file', file);

                        var requestOptions = {
                            method: 'POST',
                            headers: myHeaders,
                            body: formData
                        };

                        var response = await fetch(`/checkup/api/tenant-app/upload-common-file?userWorkID=${syn.$w.ManagedApp.UserWorkID}&applicationID=${syn.$w.ManagedApp.ApplicationID}&accessKey=${syn.$w.Variable.AccessKey}`, requestOptions);
                        if (response.status != 200) {
                            syn.$w.notify('warning', `${file.name} 파일은 업로드가 실패했습니다`);
                        }
                    }
                    else {
                        syn.$w.notify('warning', `${file.name} 파일은 업로드 할 수 없습니다`);
                    }
                }

                $this.store.Exception.Error = '';
                syn.$w.transactionAction('LF01');
            }
        },

        btnCommonFileUpload_click() {
            syn.$l.get('fleCommon').click();
        },

        btnMaximize_click() {
            syn.$m.addClass('pnlSourceEditor', 'maximize');
            syn.$m.addClass('btnMaximize', 'hidden');
            syn.$m.removeClass('btnMinimize', 'hidden');

            syn.$m.removeClass('divSourceEditor', 'minimize');

            $this.prop.sourceEditor.layout();
        },

        btnMinimize_click() {
            syn.$m.removeClass('pnlSourceEditor', 'maximize');
            syn.$m.addClass('btnMinimize', 'hidden');
            syn.$m.removeClass('btnMaximize', 'hidden');

            syn.$m.addClass('divSourceEditor', 'minimize');

            $this.prop.sourceEditor.layout();
        },

        lblFileItem_click(evt, fileID, fileName, extension) {
            var language = '';
            switch (extension.toLowerCase()) {
                case '.js':
                    language = 'javascript'
                    break;
                case '.json':
                    language = 'json'
                    break;
                case '.html':
                    language = 'html'
                    break;
                case '.css':
                    language = 'css'
                    break;
            }

            if (language != '' && $object.isNullOrUndefined($this.prop.sourceEditor) == false) {
                monaco.editor.setModelLanguage($this.prop.sourceEditor.getModel(), language)

                syn.$l.get('lblFileName').textContent = fileName;
                syn.$l.get('txtItemPath').value = fileID;
                $this.store.Exception.Error = '';
                syn.$w.transactionAction('GF01');
            }
            else {
                syn.$w.notify('warning', '선택한 파일이 올바르지 않거나 소스 에디터 로드가 실패했습니다');
            }
        }
    },

    method: {
        search() {
            $this.store.Exception.Error = '';
            syn.$w.transactionAction('LF01');
        },

        save() {
            if (syn.$l.get('txtItemPath').value != '' && $object.isNullOrUndefined($this.prop.sourceEditor) == false) {
                syn.$l.get('txtCompressBase64').value = syn.$c.LZString.compressToBase64($this.prop.sourceEditor.getValue());
                $this.store.Exception.Error = '';
                syn.$w.transactionAction('MF01');
            }
            else {
                syn.$w.notify('warning', '선택한 파일이 올바르지 않거나 소스 에디터 로드가 실패했습니다');
            }
        },

        deleteFileItems() {
            var deletes = [];
            var els = syn.$l.querySelectorAll('input.form-check-input:checked');
            for (var i = 0, length = els.length; i < length; i++) {
                var el = els[i];
                var no = el.id.split('_')[1];
                var item = $this.store.FileItem.find((x) => { return x.No == no });
                if (item) {
                    deletes.push(item);
                }
            }

            if (deletes.length > 0) {
                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'question';
                alertOptions.buttonType = '3';
                syn.$w.alert('정말로 삭제하시겠습니까?', '삭제 확인', alertOptions, async function (result) {
                    if (result == 'Yes') {
                        var myHeaders = new Headers();
                        var requestOptions = {
                            method: 'GET',
                            headers: myHeaders
                        };

                        for (var i = 0, length = deletes.length; i < length; i++) {
                            var item = deletes[i];
                            var itemPath = item.FileName;

                            if (syn.$l.get('txtItemPath').value == itemPath) {
                                syn.$l.get('lblFileName').textContent = '';
                                syn.$l.get('txtItemPath').value = '';
                                $this.prop.sourceEditor.setValue('');
                            }

                            var response = await fetch(`/checkup/api/tenant-app/delete-file?userWorkID=${syn.$w.ManagedApp.UserWorkID}&applicationID=${syn.$w.ManagedApp.ApplicationID}&projectType=R&accessKey=${syn.$w.Variable.AccessKey}&itemPath=${itemPath}`, requestOptions);
                            if (response.status != 200) {
                                syn.$w.notify('warning', `${item.FileName} 파일 삭제가 실패했습니다`);
                            }
                        }

                        $this.store.Exception.Error = '';
                        syn.$w.transactionAction('LF01');
                    }
                });
            }
            else {
                syn.$w.alert('삭제 할 항목을 선택하세요');
            }
        },

        updateFileItems() {
            for (var i = 0, length = $this.store.FileItem.length; i < length; i++) {
                var item = $this.store.FileItem[i];
                item.No = (i + 1).toString();
                item.FileLength = $string.toCurrency(item.Length);
            }

            var dataSource = {
                items: $this.store.FileItem
            };

            $this.method.drawHtmlTemplate('lstFile', 'tplFileItem', dataSource);
        },

        drawHtmlTemplate(elID, templateID, dataSource, prefixHtml) {
            prefixHtml = prefixHtml || '';
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                var templateHtml = tplEL.textContent;
                drawEl.innerHTML = prefixHtml + Mustache.render(templateHtml, dataSource);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.message, 'Error');
            }
        }
    }
}
