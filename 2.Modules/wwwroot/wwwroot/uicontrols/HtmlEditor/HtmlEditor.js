/// <reference path="/assets/js/syn.js" />

(function (context) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $htmleditor = syn.uicontrols.$htmleditor || new syn.module();

    $htmleditor.extend({
        name: 'syn.uicontrols.$htmleditor',
        version: '1.0.0',
        applicationID: '',
        editorControls: [],
        defaultSetting: {
            applicationID: '',
            selector: '',
            fileManagerServer: '',
            repositoryID: null,
            dependencyID: null,
            relative_urls: false,
            remove_script_host: false,
            convert_urls: false,
            isNumberTempDependency: true,
            height: 300,
            imageFileSizeLimit: 300000,
            viewerHtml: '<html><head><base href="/"><style type="text/css">body { font-family: \'맑은 고딕\', 돋움체; font-size: 12px; }</style><link type="text/css" rel="stylesheet" href="/lib/tinymce-5.6.0/skins/ui/oxide/content.min.css"><link type="text/css" rel="stylesheet" href="/lib/tinymce-5.6.0/skins/content/default/content.min.css"></head><body id="tinymce" class="mce-content-body">{0}<script>document.onselectstart = function () { return false; }; document.oncontextmenu = function () { return false; }; document.addEventListener && document.addEventListener("click", function(e) {for (var elm = e.target; elm; elm = elm.parentNode) {if (elm.nodeName === "A" && !(e.ctrlKey && !e.altKey)) {e.preventDefault();}}}, false);</script></body></html>',
            language: 'ko_KR',
            // plugins: [
            //     'autolink link image lists print preview hr anchor pagebreak',
            //     'searchreplace visualblocks visualchars code insertdatetime media nonbreaking',
            //     'table template paste powerpaste export powerpaste advcode help'
            // ],
            plugins: ['autolink link image lists print hr anchor pagebreak searchreplace visualblocks visualchars code insertdatetime media nonbreaking table paste advcode help'],
            // toolbar: 'styleselect | bold italic forecolor backcolor table | alignleft aligncenter alignright | bullist numlist outdent indent | link image media | preview export code help',
            toolbar: 'styleselect | bold italic forecolor backcolor table | alignleft aligncenter alignright | link image | code help',
            menubar: false, // 'file edit view insert format tools table help',
            content_style: 'body { font-family: \'맑은 고딕\', 돋움체; font-size: 12px; }',
            powerpaste_word_import: 'merge',
            powerpaste_googledocs_import: 'merge',
            defaultHtmlContent: null,
            table_default_attributes: { 'border': '1', 'width': '100%' },
            table_default_styles: { 'border-collapse': 'collapse', 'width': '100%' },
            table_responsive_width: false,
            limitTableWidth: null,
            verify_html: false,
            table_sizing_mode: 'fixed',
            images_file_types: 'jpeg,jpg,png,gif,bmp,webp,JPEG,JPG,PNG,GIF,BMP,WEBP',
            paste_data_images: true,
            resize: false,
            allowExternalLink: false,
            prefixHtml: '',
            suffixHtml: '',
            limitGuideLineWidth: '',
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList(el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';

            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: this.name,
                type: controlType
            });
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend($htmleditor.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            if ($string.isNullOrEmpty(setting.repositoryID) == false) {
                if ($string.isNullOrEmpty($htmleditor.applicationID) == true) {
                    $htmleditor.applicationID = syn.$w.User.ApplicationID;
                }

                if ($string.isNullOrEmpty($htmleditor.applicationID) == true) {
                    syn.$l.eventLog('$htmleditor.controlLoad', '파일 컨트롤 초기화 오류, 파일 업무 ID 정보 확인 필요', 'Information');
                }

                if (syn.Config && syn.Config.FileManagerServer) {
                    setting.fileManagerServer = syn.Config.FileManagerServer;
                }

                if ($string.isNullOrEmpty(setting.fileManagerServer) == true) {
                    syn.$l.eventLog('$htmleditor.fileManagerServer', 'HTML 편집기 업로드 초기화 오류, 파일 서버 정보 확인 필요', 'Information');
                }

                if ($string.isNullOrEmpty(setting.dependencyID) == true) {
                    if (setting.isNumberTempDependency == true) {
                        setting.dependencyID = $date.toTicks(new Date()).toString();
                    }
                    else {
                        setting.dependencyID = syn.uicontrols.$fileclient.getTemporaryDependencyID(elID);
                    }
                }

                setting.images_upload_handler = function (file, success, failure) {
                    var uploadHandler = function (blobInfo, success, failure) {
                        var xhr = syn.$w.xmlHttp();
                        xhr.withCredentials = false;

                        var targetUrl = setting.fileManagerServer + '/repository/api/storage/upload-file?RepositoryID={0}&DependencyID={1}'.format(setting.repositoryID, setting.dependencyID);

                        if ($string.isNullOrEmpty($htmleditor.applicationID) == false) {
                            targetUrl = targetUrl + '&applicationID=' + $htmleditor.applicationID;
                        }

                        xhr.open('POST', targetUrl);
                        xhr.onload = function () {
                            if (xhr.status != 200) {
                                var error = 'HTTP Error code: {0}, text: {1}'.format(xhr.status, xhr.statusText);
                                syn.$l.eventLog('$htmleditor.images_upload_handler', error, 'Warning');
                                failure(error);
                                return;
                            }

                            try {
                                var response = JSON.parse(xhr.responseText);

                                if (response && response.Result == true) {
                                    syn.$r.path = setting.fileManagerServer + '/repository/api/storage/action-handler';
                                    syn.$r.params['action'] = 'GetItem';
                                    syn.$r.params['repositoryID'] = setting.repositoryID;
                                    syn.$r.params['itemID'] = response.ItemID;

                                    if ($string.isNullOrEmpty($htmleditor.applicationID) == false) {
                                        syn.$r.params['applicationID'] = $htmleditor.applicationID;
                                    }

                                    var xhrGetItem = syn.$w.xmlHttp();
                                    xhrGetItem.onreadystatechange = function () {
                                        if (xhrGetItem.readyState === XMLHttpRequest.DONE) {
                                            if (xhrGetItem.status === 200) {
                                                var result = JSON.parse(xhrGetItem.responseText);
                                                // response.location = setting.fileManagerServer + '/repository/api/storage/http-download-file?RepositoryID={0}&ItemID={1}'.format(setting.repositoryID, response.ItemID);
                                                response.location = result.AbsolutePath;
                                                success(response.location);

                                                setTimeout(function () {
                                                    var uploadedImage = tinymce.activeEditor.$('img[src$="' + response.location + '"]')
                                                    if (uploadedImage.length > 0) {
                                                        var width = blobInfo.width;
                                                        var height = blobInfo.height;

                                                        tinymce.activeEditor.dom.setStyle(uploadedImage, 'width', width);
                                                        tinymce.activeEditor.dom.setStyle(uploadedImage, 'height', height);

                                                        uploadedImage.attr('width', width);
                                                        uploadedImage.attr('height', height);

                                                        uploadedImage.after('&nbsp;');
                                                    }
                                                }, 100);
                                            }
                                            else {
                                                syn.$l.eventLog('$htmleditor.images_upload_handler', 'async url: ' + url + ', status: ' + xhrGetItem.status.toString() + ', responseText: ' + xhrGetItem.responseText, 'Error');
                                            }
                                        }
                                    };

                                    xhrGetItem.open('GET', syn.$r.url(), true);
                                    xhrGetItem.send();
                                } else {
                                    var error = response.Message;
                                    syn.$w.alert('이미지 업로드 실패: {0}'.format(error));
                                    syn.$l.eventLog('$htmleditor.images_upload_handler', error, 'Warning');
                                    failure(error);
                                    return;
                                }
                            } catch (error) {
                                syn.$w.alert('이미지 업로드 오류: {0}'.format(error.message));
                                syn.$l.eventLog('$htmleditor.images_upload_handler', error, 'Warning');
                                failure(error);
                            }
                        };

                        xhr.onerror = function () {
                            var error = 'HTTP Error code: {0}, text: {1}'.format(xhr.status, xhr.statusText);
                            syn.$l.eventLog('$htmleditor.images_upload_handler', error, 'Warning');
                            failure(error);
                        };

                        var formData = new FormData();
                        formData.append('file', blobInfo.blob, blobInfo.fileName);
                        xhr.send(formData);
                    }

                    var fileSize = file.blob().size;
                    if (setting.imageFileSizeLimit < fileSize) {
                        var message = '에디터에 표시 가능한 이미지 파일크기는 {0} 미만입니다'.format($number.toByteString(setting.imageFileSizeLimit));
                        syn.$w.alert(message);

                        var blobUri = file.blobUri();
                        syn.$r.revokeBlobUrl(blobUri);
                        failure(message);

                        var tempImage = tinymce.activeEditor.$('img[src$="' + blobUri + '"]')
                        if (tempImage.length > 0) {
                            tempImage.remove();
                        }
                    }
                    else {
                        try {
                            var mod = window[syn.$w.pageScript];
                            var eventHandler = mod.event['{0}_beforeUploadImageResize'.format(elID)];
                            if (eventHandler) {
                                // txtCONTENTS_beforeUploadImageResize(elID, blobInfo, callback) {
                                //     syn.uicontrols.$htmleditor.resizeImage(blobInfo, 320).then(function (adjustBlob) {
                                //         callback(adjustBlob);
                                // 
                                //         var editor = syn.uicontrols.$htmleditor.getHtmlEditor(elID);
                                //         editor.execCommand('mceRepaint');
                                //     });
                                // },
                                eventHandler.apply(el, [elID, file, (adjustBlob) => {
                                    uploadHandler({
                                        blob: adjustBlob.blob,
                                        width: adjustBlob.width,
                                        height: adjustBlob.height,
                                        fileName: file.filename()
                                    }, success, failure);
                                }]);
                            }
                            else {
                                $htmleditor.resizeImage(file.blob(), 0).then((adjustBlob) => {
                                    uploadHandler({
                                        blob: adjustBlob.blob,
                                        width: adjustBlob.width,
                                        height: adjustBlob.height,
                                        fileName: file.filename()
                                    }, success, failure);

                                    var editor = syn.uicontrols.$htmleditor.getHtmlEditor(elID);
                                    editor.execCommand('mceRepaint');
                                });
                            }
                        } catch (error) {
                            syn.$l.eventLog('$htmleditor.images_upload_handler', error.toString(), 'Error');
                        }
                    }
                };
            }
            else {
                syn.$l.eventLog('$htmleditor.fileManagerServer', `${elID}: HTML 편집기내 이미지 파일 업로드 사용 안함`, 'Debug');
            }

            setting.paste_preprocess = function (plugin, args) {
                // console.log(args.content);
                // debugger;
                // $this.blobUrlToString(args.content.substring(10, args.content.length - 2));
                // args.content += ' preprocess';
            };

            setting.paste_postprocess = function (plugin, args) {
                if (args.node.firstElementChild && args.node.firstElementChild.tagName == 'TABLE' && (args.mode && args.mode == 'merge') == false) {
                    var table = args.node.firstElementChild;
                    table.border = '1';
                    table.cellspacing = '0';
                    table.cellpadding = '0';
                    syn.$m.setStyle(table, 'border-collapse', 'collapse');

                    var headers = table.querySelectorAll('thead tr:first-child td');
                    var headerLength = headers.length;
                    if (headerLength > 0) {
                        for (var i = 0; i < headerLength; i++) {
                            var header = headers[i];
                            syn.$m.setStyle(header, 'background-color', '#ecf0f1');
                        }
                    }
                    else {
                        headers = table.querySelectorAll('tr:first-child td');
                        headerLength = headers.length;
                        if (headerLength > 0) {
                            for (var i = 0; i < headerLength; i++) {
                                var header = headers[i];
                                syn.$m.setStyle(header, 'background-color', '#ecf0f1');
                            }
                        }
                    }
                }
            };

            setting.width = el.style.width || 320;
            setting.height = el.style.height || 240;

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.style.width = setting.width
            wrapper.style.height = setting.height
            wrapper.id = elID;
            wrapper.innerHTML = $string.isNullOrEmpty(el.innerHTML) == true ? '<div></div>' : el.innerHTML;

            parent.appendChild(wrapper);
            setting.selector = '#' + elID;

            setting.init_instance_callback = function (editor) {
                var el = syn.$l.get(elID);
                var setInitValue = el.getAttribute('setInitValue');
                if (setInitValue) {
                    editor.setContent(setInitValue);
                }

                editor.on('keydown', function (e) {
                    var key = e.keyCode || e.which;

                    if (key == 9) {
                        editor.execCommand('mceInsertContent', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                        tinymce.dom.Event.cancel(e);
                        e.preventDefault();
                        return;
                    }
                });

                editor.on('ObjectResized', function (e) {
                    if (e.target.nodeName == 'TABLE') {
                        var table = e.target;
                        if ($string.isNullOrEmpty(setting.limitTableWidth) == false && setting.limitTableWidth < table.style.width) {
                            table.style.width = setting.limitTableWidth;
                        }

                        if ($string.isNullOrEmpty(table.style.width) == false) {
                            table.setAttribute('width', table.style.width);
                        }

                        if ($string.isNullOrEmpty(table.style.height) == false) {
                            table.setAttribute('height', table.style.height);
                        }

                        var tds = e.target.querySelectorAll('td');
                        var length = tds.length;
                        for (var i = 0; i < length; i++) {
                            var td = tds[i];
                            if ($string.isNullOrEmpty(td.style.width) == false) {
                                td.setAttribute('width', td.style.width);
                            }

                            if ($string.isNullOrEmpty(td.style.height) == false) {
                                td.setAttribute('height', td.style.height);
                            }
                        }
                    }

                    if (e.target.nodeName == 'IMG') {
                        var selectedImage = tinymce.activeEditor.selection.getNode();

                        var mod = window[syn.$w.pageScript];
                        var eventHandler = mod.event['{0}_imageResized'.format(elID)];
                        if (eventHandler) {
                            // txtCONTENTS_imageResized(elID, evt, editor, selectedImage) {
                            //     if (evt.width > 600) {
                            //         var ratio = (evt.width / evt.height);
                            //         evt.width = 600;
                            //         evt.height = parseFloat(evt.width / ratio);
                            //         tinymce.activeEditor.dom.setStyle(selectedImage, 'width', evt.width);
                            //         tinymce.activeEditor.dom.setStyle(selectedImage, 'height', evt.height);
                            // 
                            //         selectedImage.setAttribute('width', evt.width);
                            //         selectedImage.setAttribute('height', evt.height);
                            //     }
                            // }
                            eventHandler.apply(el, [elID, e, editor, selectedImage]);
                        }
                    }
                });

                if ($string.isNullOrEmpty(setting.defaultHtmlContent) == false) {
                    editor.setContent(setting.defaultHtmlContent);
                }

                $htmleditor.editorControls.push({
                    id: elID,
                    editor: editor,
                    setting: $object.clone(setting)
                });

                if (setting.readonly == true) {
                    Array.from(editor.getDoc().querySelectorAll('a')).map(function (el) {
                        el.target = '_blank';
                    });
                }

                if (setting.readonly == true && setting.allowExternalLink == true) {
                    Array.from(editor.getDoc().querySelectorAll('.mce-object-iframe')).map(function (el) {
                        el.setAttribute('data-mce-selected', '2');
                    });
                }

                var mod = window[syn.$w.pageScript];
                var eventHandler = mod.event['{0}_documentReady'.format(elID)];
                if (eventHandler) {
                    eventHandler.apply(el, [elID, editor]);
                }
            };

            tinymce.init(setting);
            if ($string.isNullOrEmpty(setting.limitGuideLineWidth) == false) {
                syn.$l.get(elID).controlPseudoStyle(' + div .tox-edit-area:after', '{content: "";width: 2px;height: 100%;background: #EF4444 repeat-y;top: 0px;left: {0};position: absolute;display: inline-block;}'.format(setting.limitGuideLineWidth))
            }

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        resizeImage(file, maxSize) {
            var reader = new FileReader();
            var image = new Image();
            var canvas = document.createElement('canvas');
            var dataURItoBlob = function (dataURI) {
                var bytes = dataURI.split(',')[0].indexOf('base64') >= 0 ?
                    atob(dataURI.split(',')[1]) :
                    decodeURIComponent(dataURI.split(',')[1]);
                var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
                var max = bytes.length;
                var ia = new Uint8Array(max);
                for (var i = 0; i < max; i++)
                    ia[i] = bytes.charCodeAt(i);
                return new Blob([ia], { type: mime || 'image/jpeg' });
            };
            var resize = function () {
                var width = image.width;
                var height = image.height;
                if (width > height) {
                    if (maxSize <= 0) {
                        maxSize = 600;
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    }
                    else {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    }
                } else {
                    if (maxSize <= 0) {
                        maxSize = 600;
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                var dataUrl = canvas.toDataURL('image/jpeg');
                return {
                    blob: dataURItoBlob(dataUrl),
                    width: width,
                    height: height,
                };
            };
            return new Promise(function (success, failure) {
                var blob = file.blob();
                if (!blob.type.match(/image.*/)) {
                    failure(new Error("이미지 파일 확인 필요"));
                    return;
                }
                reader.onload = function (readerEvent) {
                    image.onload = function () { return success(resize()); };
                    image.src = readerEvent.target.result;
                };
                reader.readAsDataURL(blob);
            });
        },

        getHtmlEditor(elID) {
            var editor = null;

            var length = $htmleditor.editorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $htmleditor.editorControls[i];
                if (item.id == elID) {
                    editor = item.editor;
                    break;
                }
            }

            return editor;
        },

        getHtmlSetting(elID) {
            var setting = null;

            var length = $htmleditor.editorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $htmleditor.editorControls[i];
                if (item.id == elID) {
                    setting = item.setting;
                    break;
                }
            }

            return setting;
        },

        // mode - design, readonly
        setMode(elID, mode) {
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                editor.setMode(mode);
            }
        },

        insertContent(elID, content) {
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                editor.insertContent(content);
            }
        },

        // https://www.tiny.cloud/docs-3x/reference/TinyMCE3x@Command_identifiers/
        execCommand(elID, command, uiState, value, args) {
            var result = false;
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                if ($object.isNullOrUndefined(uiState) == true) {
                    uiState = false;
                }
                result = editor.execCommand(command, uiState, value, args);
            }

            return result;
        },

        isDirty(elID) {
            var result = false;
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                result = editor.isDirty();
            }

            return result;
        },

        updateDependencyID(elID, targetDependencyID, callback) {
            var setting = $htmleditor.getHtmlSetting(elID);
            syn.$r.path = setting.fileManagerServer + '/repository/api/storage/action-handler';
            syn.$r.params['action'] = 'UpdateDependencyID';
            syn.$r.params['repositoryID'] = setting.repositoryID;
            syn.$r.params['sourceDependencyID'] = setting.dependencyID;
            syn.$r.params['targetDependencyID'] = targetDependencyID;

            syn.uicontrols.$fileclient.executeProxy(syn.$r.url(), callback);
        },

        getDependencyID(elID) {
            var val = '';
            var setting = $htmleditor.getHtmlSetting(elID);
            if (setting) {
                val = setting.dependencyID;
            }

            return val;
        },

        setDependencyID(elID, dependencyID) {
            var setting = $htmleditor.getHtmlSetting(elID);
            if (setting) {
                setting.dependencyID = dependencyID;
            }
        },

        getValue(elID, meta) {
            var result = null;
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                result = editor.getContent();
                var setting = $htmleditor.getHtmlSetting(elID);
                if ($string.isNullOrEmpty(setting.limitTableWidth) == false) {
                    var tables = result.match(/<table[^>]*>(.*?)/gmi);
                    if ($string.isNullOrEmpty(tables) == false) {
                        for (var i = 0; i < tables.length; i++) {
                            var html = tables[i];
                            if (html.indexOf('width=') == -1) {
                                result = result.replace(html, html.substring(0, (html.length - 1)) + ' width="{0}">'.format(setting.limitTableWidth))
                            }
                        }
                    }
                }

                if ($string.isNullOrEmpty(setting.prefixHtml) == false) {
                    result = setting.prefixHtml + result;
                }

                if ($string.isNullOrEmpty(setting.suffixHtml) == false) {
                    result = result + setting.suffixHtml;
                }
            }

            result = result.replace(/&amp;/gm, '&');
            result = result.replace(/\<p\>\<\/p\>/gm, '\<p\>&nbsp;\<\/p\>');
            result = result.replace(/\<p style="text-align: left;"\>\<\/p\>/gm, '\<p style="text-align: left;"\>&nbsp;\<\/p\>');
            result = result.replace(/\<p style="text-align: center;"\>\<\/p\>/gm, '\<p style="text-align: center;"\>&nbsp;\<\/p\>');
            result = result.replace(/\<p style="text-align: right;"\>\<\/p\>/gm, '\<p style="text-align: right;"\>&nbsp;\<\/p\>');

            return result;
        },

        setValue(elID, value, meta) {
            var editor = $htmleditor.getHtmlEditor(elID);

            var controlOptions = syn.$l.get('{0}_hidden'.format(elID)).getAttribute('syn-options');
            if ($object.isNullOrUndefined(controlOptions) == false) {
                var setting = JSON.parse(controlOptions);
                if ($string.isNullOrEmpty(setting.prefixHtml) == false) {
                    if ($string.isNullOrEmpty(setting.prefixHtml) == false && value.startsWith(setting.prefixHtml) == true) {
                        value = value.replace(setting.prefixHtml, '');
                    }
                }

                if ($string.isNullOrEmpty(setting.suffixHtml) == false) {
                    if ($string.isNullOrEmpty(setting.suffixHtml) == false && value.endsWith(setting.suffixHtml) == true) {
                        value = value.replace(setting.suffixHtml, '');
                    }
                }
            }

            if (editor) {
                editor.setContent(value);
            }
            else {
                syn.$l.get(elID).setAttribute("setInitValue", value);
            }
        },

        clear(elID, isControlLoad) {
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                editor.setContent('');
            }
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$htmleditor = $htmleditor;
})(globalRoot);
