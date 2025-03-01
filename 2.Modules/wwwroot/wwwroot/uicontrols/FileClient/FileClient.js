/// <reference path="/js/syn.js" />
/// <reference path="/js/syn.domain.js" />

(function (window) {
    'use strict';
    window.fileUploadOptions = null;

    /// <summary>
    /// FileUpload $fileclient 컨트롤 모듈입니다.
    /// </summary>
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $fileclient = $fileclient || new syn.module();

    $fileclient.extend({
        name: 'syn.uicontrols.$fileclient',
        version: 'v2025.3.1',

        fileManagers: [],
        fileControls: [],
        applicationID: '',
        businessID: '',

        mimeType: {
            'html': 'text/html'
            , 'htm': 'text/html'
            , 'css': 'text/css'
            , 'xml': 'text/xml'
            , 'txt': 'text/plain'
            , 'gif': 'image/gif'
            , 'jpeg': 'image/jpeg'
            , 'jpg': 'image/jpeg'
            , 'png': 'image/png'
            , 'tif': 'image/tiff'
            , 'ico': 'image/x-icon'
            , 'bmp': 'image/x-ms-bmp'
            , 'svg': 'image/svg+xml'
            , 'webp': 'image/webp'
            , 'js': 'application/x-javascript'
            , 'pdf': 'application/pdf'
            , 'rtf': 'application/rtf'
            , 'doc': 'application/msword'
            , 'docx': 'application/msword'
            , 'xls': 'application/vnd.ms-excel'
            , 'xlsx': 'application/vnd.ms-excel'
            , 'ppt': 'application/vnd.ms-powerpoint'
            , 'pptx': 'application/vnd.ms-powerpoint'
            , '7z': 'application/x-7z-compressed'
            , 'zip': 'application/zip'
            , 'bin': 'application/octet-stream'
            , 'exe': 'application/octet-stream'
            , 'dll': 'application/octet-stream'
            , 'iso': 'application/octet-stream'
            , 'msi': 'application/octet-stream'
            , 'mp3': 'audio/mpeg'
            , 'ogg': 'audio/ogg'
            , 'mp4': 'video/mp4'
        },

        isFileAPIBrowser: false,

        defaultSetting: {
            elementID: null,
            dialogTitle: '파일 업로드',
            tokenID: '',
            repositoryID: '',
            dependencyID: '',
            businessID: '',
            applicationID: '',
            fileUpdateCallback: null,
            accept: '*/*', // .gif, .jpg, .png, .doc, audio/*,video/*,image/*
            uploadUrl: '',
            fileChangeHandler: undefined,
            custom1: undefined,
            custom2: undefined,
            custom3: undefined,
            minHeight: 360,
            fileManagerServer: '',
            fileManagerPath: '/repository/api/storage',
            pageGetRepository: 'get-repository',
            pageUploadFile: 'upload-file',
            pageUploadFiles: 'upload-files',
            pageActionHandler: 'action-handler',
            pageRemoveItem: 'remove-item',
            pageRemoveItems: 'remove-items',
            pageDownloadFile: 'download-file',
            pageHttpDownloadFile: 'http-download-file',
            pageVirtualDownloadFile: 'virtual-download-file',
            pageVirtualDeleteFile: 'virtual-delete-file',
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
            setting = syn.$w.argumentsExtend($fileclient.defaultSetting, setting);
            setting.elementID = elID;

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.uploadType = null;
            setting.uploadUrl = null;

            if ($string.isNullOrEmpty(setting.fileManagerServer) == true && syn.Config && syn.Config.FileManagerServer) {
                setting.fileManagerServer = syn.Config.FileManagerServer;
            }

            if ($string.isNullOrEmpty(setting.fileManagerServer) == true) {
                syn.$l.eventLog('$fileclient.controlLoad', '파일 컨트롤 초기화 오류, 파일 서버 정보 확인 필요', 'Error');
                return;
            }

            if (location.pathname.startsWith((syn.Config.TenantAppRequestPath ? `/${syn.Config.TenantAppRequestPath}/` : '/app/')) == true) {
                if ($string.isNullOrEmpty($fileclient.applicationID) == true) {
                    $fileclient.applicationID = syn.$w.ManagedApp.ApplicationID;
                }
            }
            else {
                if ($string.isNullOrEmpty($fileclient.applicationID) == true) {
                    $fileclient.applicationID = syn.$w.Variable.ApplicationID || syn.$w.User.ApplicationID || syn.Config.ApplicationID;
                }
            }

            if ($string.isNullOrEmpty($fileclient.applicationID) == true) {
                syn.$l.eventLog('$fileclient.controlLoad', '파일 컨트롤 초기화 오류, ApplicationID 정보 확인 필요', 'Error');
                return;
            }

            if (syn.Config.FileBusinessIDSource && syn.Config.FileBusinessIDSource != 'None') {
                if (syn.Config.FileBusinessIDSource == 'Cookie') {
                    $fileclient.businessID = syn.$r.getCookie('FileBusinessID');
                }
                else if (syn.Config.FileBusinessIDSource == 'SessionStorage') {
                    $fileclient.businessID = syn.$w.getStorage('FileBusinessID');
                }
            }

            if ($string.isNullOrEmpty($fileclient.businessID) == true) {
                $fileclient.businessID = syn.$w.User.WorkCompanyNo;
            }

            if ($string.isNullOrEmpty($fileclient.businessID) == true) {
                $fileclient.businessID = '0';
            }

            syn.$w.loadJson(setting.fileManagerServer + setting.fileManagerPath + '/' + setting.pageGetRepository + '?applicationID={0}&repositoryID={1}'.format($fileclient.applicationID, setting.repositoryID), setting, function (setting, repositoryData) {
                setting.dialogTitle = repositoryData.RepositoryName;
                setting.storageType = repositoryData.StorageType;
                setting.isMultiUpload = repositoryData.IsMultiUpload;
                setting.isAutoPath = repositoryData.IsAutoPath;
                setting.policyPathID = repositoryData.PolicyPathID;
                setting.uploadType = repositoryData.UploadType;
                setting.uploadExtensions = repositoryData.UploadExtensions;
                setting.accept = repositoryData.UploadExtensions;
                setting.uploadCount = repositoryData.UploadCount;
                setting.uploadSizeLimit = repositoryData.UploadSizeLimit;

                if (setting.uploadType == 'Single') {
                    setting.uploadUrl = syn.Config.SharedAssetUrl + 'upload/SingleFile.html';
                }
                else if (setting.uploadType == 'Profile') {
                    setting.uploadUrl = syn.Config.SharedAssetUrl + 'upload/ProfilePicture.html';
                }
                else if (setting.uploadType == 'Multi') {
                    setting.uploadUrl = syn.Config.SharedAssetUrl + 'upload/MultiFiles.html';
                }
                else if (setting.uploadType == 'ImageLink') {
                    setting.uploadUrl = syn.Config.SharedAssetUrl + 'upload/ImageLinkFiles.html';
                }

                setting.elID = elID;
                el.setAttribute('id', el.id + '_hidden');
                el.setAttribute('syn-options', JSON.stringify(setting));
                el.style.display = 'none';

                var dataFieldID = el.getAttribute('syn-datafield');
                var events = el.getAttribute('syn-events');
                var value = el.value ? el.value : '';
                var name = el.name ? el.name : '';
                var html = '';
                if (events) {
                    html = '<input type="hidden" id="{0}" name="{1}" syn-datafield="{2}" value="{3}" syn-events={4}>'.format(elID, name, dataFieldID, value, '[\'' + eval(events).join('\',\'') + '\']');
                }
                else {
                    html = '<input type="hidden" id="{0}" name="{1}" syn-datafield="{2}" value="{3}">'.format(elID, name, dataFieldID, value);
                }

                var parent = el.parentNode;
                var wrapper = document.createElement('div');
                wrapper.innerHTML = html;

                parent.appendChild(wrapper);

                syn.$l.get(elID).setAttribute('syn-options', JSON.stringify(setting));

                $fileclient.fileControls.push({
                    id: elID,
                    setting: $object.clone(setting)
                });
            }, function () {
                if ($string.isNullOrEmpty(setting.uploadUrl) == true) {
                    syn.$w.alert('{0}에 대한 파일 서버 저장 정보 확인 필요'.format(setting.repositoryID));
                }
            }, true, true);

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        moduleInit() {
            syn.$l.addEvent(window, 'message', function (e) {
                var repositoryData = e.data;
                var setting = $fileclient.getFileSetting(repositoryData.elementID);
                if (setting && ($fileclient.getRepositoryUrl()).indexOf(e.origin) > -1 && repositoryData && repositoryData.action == 'upload-files') {
                    if (repositoryData.callback) {
                        var mod = window[syn.$w.pageScript];
                        if (mod) {
                            var clientCallback = null;
                            clientCallback = mod.event[repositoryData.callback];
                            if ($object.isNullOrUndefined(clientCallback) == true) {
                                try {
                                    clientCallback = eval('$this.event.' + repositoryData.callback);
                                } catch (error) {
                                    syn.$l.eventLog('clientCallback', error, 'Warning');
                                }
                            }

                            if (clientCallback) {
                                var result = {
                                    elID: repositoryData.elementID,
                                    repositoryID: repositoryData.repositoryID,
                                    items: repositoryData.repositoryItems
                                };

                                var items = [];
                                for (var i = 0; i < repositoryData.repositoryItems.length; i++) {
                                    var item = repositoryData.repositoryItems[i];
                                    items.push(item.ItemID);
                                }

                                if (repositoryData.elementID) {
                                    syn.$l.get(repositoryData.elementID).value = items.join(',');
                                }

                                clientCallback('upload', result);
                            }
                        }
                    }

                    if ($.modal) {
                        $.modal.close();
                    }
                }

                e.stopPropagation();
                return false;
            });
        },

        getFileSetting(elID) {
            var result = null;

            var length = $fileclient.fileControls.length;
            for (var i = 0; i < length; i++) {
                var item = $fileclient.fileControls[i];
                if (item.id == elID) {
                    result = item.setting;
                    break;
                }
            }

            return result;
        },

        getFileManagerSetting() {
            var result = null;

            if ($fileclient.fileControls.length > 0) {
                result = $fileclient.fileControls[0].setting;
            }

            return result;
        },

        setPageSetting(pageSettings) {
            pageSettings = pageSettings || {
                pageGetRepository: 'get-repository',
                pageUploadFile: 'upload-file',
                pageUploadFiles: 'upload-files',
                pageActionHandler: 'action-handler',
                pageRemoveItem: 'remove-item',
                pageRemoveItems: 'remove-items',
                pageDownloadFile: 'download-file',
                pageHttpDownloadFile: 'http-download-file',
                pageVirtualDownloadFile: 'virtual-download-file',
                pageVirtualDeleteFile: 'virtual-delete-file',
            };

            var length = $fileclient.fileControls.length;
            for (var i = 0; i < length; i++) {
                var item = $fileclient.fileControls[i];
                item.setting = syn.$w.argumentsExtend(item.setting, pageSettings);
            }
        },

        getValue(elID, meta) {
            return syn.$l.get(elID).value;
        },

        setValue(elID, value, meta) {
            var el = syn.$l.get(elID);
            el.value = value ? value : '';
        },

        clear(elID, isControlLoad) {
            var el = syn.$l.get(elID);
            el.value = '';
        },

        init(elID, fileContainer, repositoryData, fileChangeHandler) {
            var dependencyID = $fileclient.getTemporaryDependencyID(elID);
            $fileclient.fileManagers.push({
                elID: elID,
                container: fileContainer,
                datas: repositoryData,
                dependencyID: dependencyID,
                filechange: fileChangeHandler
            });

            if (window.File && window.FileList) {
                $fileclient.isFileAPIBrowser = true;
            }

            if (fileContainer != null) {
                if (document.forms.length > 0) {
                    var form = document.forms[0];
                    if (syn.$l.get('syn-repository') == null) {
                        var repositoryTarget = syn.$m.append(form, 'iframe', 'syn-repository', {
                            styles: { display: 'none' }
                        });
                        repositoryTarget.name = 'syn-repository';
                    }

                    form.enctype = 'multipart/form-data';
                    form.target = 'syn-repository';
                    form.method = 'post';
                    form.action = $fileclient.getRepositoryUrl();
                }
            }
        },

        getRepositoryUrl() {
            var setting = $fileclient.getFileManagerSetting();
            return setting.fileManagerServer + setting.fileManagerPath;
        },

        getFileManager(elID) {
            var val = null;
            var container = null;
            for (var i = 0; i < $fileclient.fileManagers.length; i++) {
                container = $fileclient.fileManagers[i];

                if (container.elID == elID) {
                    val = container;
                    break;
                }
            }

            return val;
        },

        getFileMaxIndex(elID) {
            var val = 1;
            var indexs = [];
            var files = syn.$l.querySelectorAll('[id*="' + elID + '_filesName"]');
            for (var i = 1; i <= files.length; i++) {
                indexs.push(i);
            }

            val = indexs[indexs.length - 1];

            if (val == undefined) {
                val = 0;
            }

            val++;

            return val;
        },

        addFileUI(elID, accept) {
            var manager = $fileclient.getFileManager(elID);

            if (manager) {
                var container = manager.container;
                var div = document.createElement('div');
                syn.$m.addClass(div, 'mt-2');

                var divFile = document.createElement('div');
                syn.$m.addClass(divFile, 'input-group');

                var file = document.createElement('input');
                syn.$m.addClass(file, 'form-control');

                var remove = document.createElement('button');
                syn.$m.addClass(remove, 'btn btn-icon bg-muted-lt');
                remove.innerHTML = '<i class="f:18 ti ti-trash"></i>';

                divFile.appendChild(file);
                divFile.appendChild(remove);
                div.appendChild(divFile);
                container.appendChild(div);

                var index = $fileclient.getFileMaxIndex(elID).toString();

                file.id = elID + '_filesName_' + index;
                file.name = 'files';
                file.type = 'file';
                file.multiple = false;

                if (accept) {
                    file.accept = accept;
                }

                syn.$l.addEvent(file, 'change', function (e) {
                    var fileElem = e.target;
                    var fileItem = null;
                    var fileIndex = null;
                    var idx = fileElem.id.split('_');
                    var manager = $fileclient.getFileManager(idx[0]);

                    if (manager && manager.filechange) {
                        fileIndex = idx[idx.length - 1];

                        if ($fileclient.isFileAPIBrowser == true) {
                            var fileObject = fileElem.files[0];
                            fileItem = {
                                name: fileObject.name,
                                size: fileObject.size,
                                type: fileObject.type,
                                index: fileIndex
                            };
                        }
                        else {
                            var image = new Image();
                            image.src = fileElem.value;
                            fileItem = {
                                name: image.nameProp,
                                size: undefined,
                                type: $fileclient.getFileMimeType(image.nameProp),
                                index: fileIndex
                            };
                        }

                        manager.filechange(fileElem, fileItem);
                    }
                });

                remove.id = elID + '_filesRemove_' + index;
                remove.name = elID + '_filesRemove_' + index;
                remove.type = 'button';
                remove.index = index;
                syn.$l.addEvent(remove, 'click', function (evt) {
                    var el = evt.srcElement || evt.target;
                    if (el.tagName == 'I') {
                        el = el.parentElement;
                    }
                    var elFile = syn.$l.get(el.id.replace('_filesRemove_', '_filesName_'))
                    elFile.value = '';
                });
            }
            else {
                syn.$w.alert(elID + ' 파일 관리자가 지정되지 않았습니다.');
            }
        },

        getFileMimeType(fileName) {
            var result = 'application/octet-stream';
            var ext = fileName.substring(fileName.lastIndexOf('.') + 1);
            if (ext) {
                if ($resource && $resource.mimeType) {
                    if ($resource.mimeType.hasOwnProperty(ext) == true) {
                        result = $resource.mimeType[ext];
                    }
                }
                else {
                    if ($fileclient.mimeType.hasOwnProperty(ext) == true) {
                        result = $fileclient.mimeType[ext];
                    }
                }
            }

            return result;
        },

        prependChild(elID, nextSibling) {
            var manager = $fileclient.getFileManager(elID);
            var container = manager.container;
            var childNodes = container.childNodes;
            var lastIndex = childNodes.length - 1;

            if (nextSibling) {
                container.insertBefore(childNodes[lastIndex], nextSibling);
            }
        },

        getRepositoryID(elID) {
            var val = '';
            var manager = $fileclient.getFileManager(elID);
            if (manager) {
                val = manager.datas.repositoryID;
            }

            return val;
        },

        getDependencyID(elID) {
            var val = '';
            var manager = $fileclient.getFileManager(elID);
            if (manager) {
                val = manager.dependencyID;
            }

            return val;
        },

        setDependencyID(elID, dependencyID) {
            var manager = $fileclient.getFileManager(elID);
            if (manager) {
                manager.dependencyID = dependencyID;
            }
        },

        doUpload(elID, fileUploadOptions) {
            var manager = $fileclient.getFileManager(elID);
            var uploadItem = null;

            if (manager) {
                var isContinue = false;
                if (manager.datas.uploadExtensions.indexOf('*/*') == -1) {
                    var allowExtensions = manager.datas.uploadExtensions.split(';');
                    var uploadItems = syn.$l.querySelectorAll("[id*='_filesName_']");
                    for (var i = 0; i < manager.datas.uploadCount; i++) {
                        uploadItem = uploadItems[i];
                        if (uploadItem == undefined) {
                            break;
                        }

                        for (var j = 0; j < allowExtensions.length; j++) {
                            if (uploadItem.value == '') {
                                isContinue = true;
                                break;
                            }
                            else if (uploadItem.value.substring(uploadItem.value.lastIndexOf('.') + 1, uploadItem.value.length).toLowerCase() === allowExtensions[j].toLowerCase()) {
                                isContinue = true;
                                break;
                            }
                        }

                        if (isContinue == false) {
                            break;
                        }
                    }
                }
                else {
                    var uploadItems = syn.$l.querySelectorAll("[id*='_filesName_']");
                    if (uploadItems.length > 0) {
                        for (var i = 0; i < uploadItems.length; i++) {
                            uploadItem = uploadItems[i];
                            if ($string.isNullOrEmpty(uploadItem.value) == false) {
                                isContinue = true;
                            }
                        }

                        if (isContinue == false) {
                            syn.$w.alert('업로드할 파일을 선택 해야 합니다');
                            return;
                        }
                    }
                }

                if (isContinue == true && document.forms.length > 0) {
                    if (syn.$l.get('syn-repository') != null) {
                        syn.$r.params = [];
                        var repositoryID = $fileclient.getRepositoryID(elID);
                        var setting = $fileclient.getFileManagerSetting();
                        syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageUploadFiles;
                        syn.$r.params['elementID'] = fileUploadOptions.elementID;
                        syn.$r.params['repositoryID'] = repositoryID;
                        syn.$r.params['dependencyID'] = $fileclient.getDependencyID(elID);
                        syn.$r.params['custompath1'] = fileUploadOptions.custom1;
                        syn.$r.params['custompath2'] = fileUploadOptions.custom2;
                        syn.$r.params['custompath3'] = fileUploadOptions.custom3;

                        if ($string.isNullOrEmpty(fileUploadOptions.profileFileName) == false) {
                            syn.$r.params['fileName'] = fileUploadOptions.profileFileName;
                        }

                        if (manager.datas.fileUpdateCallback) {
                            syn.$r.params['callback'] = manager.datas.fileUpdateCallback;
                        }

                        if ($string.isNullOrEmpty($fileclient.businessID) == false) {
                            syn.$r.params['businessID'] = $fileclient.businessID;
                        }

                        syn.$r.params['applicationID'] = $fileclient.applicationID;

                        var form = document.forms[0];
                        form.action = syn.$r.url();
                        form.submit();

                        if (window.$progressBar) {
                            $progressBar.show('파일 업로드 중입니다...');
                        }
                    }
                    else {
                        syn.$w.alert('doUpload 메서드를 지원하지 않는 화면입니다.');
                    }
                }
                else {
                    if ($object.isNullOrUndefined(uploadItem) == true) {
                        syn.$w.alert('업로드할 파일을 선택 해야 합니다');
                    }
                    else {
                        syn.$w.alert(manager.datas.uploadExtensions + '확장자를 가진 파일을 업로드 해야 합니다');
                    }
                }
            }
            else {
                syn.$w.alert(elID + ' 파일 관리자가 지정되지 않았습니다.');
            }
        },

        getUploadUrl(repositoryID, dependencyID, isSingleUpload, fileName) {
            if ($object.isNullOrUndefined(isSingleUpload) == true) {
                isSingleUpload = true;
            }

            var setting = $fileclient.getFileManagerSetting();
            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + (isSingleUpload == true ? setting.pageUploadFile : setting.pageUploadFiles);
            syn.$r.params['repositoryID'] = repositoryID;
            syn.$r.params['dependencyID'] = dependencyID;
            syn.$r.params['businessID'] = $fileclient.businessID;
            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['responseType'] = 'json';

            if (isSingleUpload == true && $string.isNullOrEmpty(fileName) == false) {
                syn.$r.params['fileName'] = fileName;
            }

            return syn.$r.url();
        },

        getFileAction(options, callback) {
            if ($string.isNullOrEmpty(options.repositoryID) == true || $object.isNullOrUndefined(options.action) == true) {
                syn.$l.eventLog('getFileAction', '요청 정보 확인 필요', 'Warning');
                return;
            }

            var setting = $fileclient.getFileManagerSetting();
            if ($object.isNullOrUndefined(setting) == true) {
                syn.$l.eventLog('getFileAction', `${options.repositoryID} 정보 확인 필요`, 'Warning');
                return;
            }

            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageActionHandler;
            var action = options.action;
            syn.$r.params['action'] = action;
            switch (action) {
                case 'GetItem':
                    syn.$r.params['repositoryID'] = options.repositoryID;
                    syn.$r.params['itemID'] = options.itemID;
                    break;
                case 'GetItems':
                    syn.$r.params['repositoryID'] = options.repositoryID;
                    syn.$r.params['dependencyID'] = options.dependencyID;
                    break;
                case 'UpdateDependencyID':
                    syn.$r.params['repositoryID'] = options.repositoryID;
                    syn.$r.params['sourceDependencyID'] = options.sourceDependencyID;
                    syn.$r.params['targetDependencyID'] = options.targetDependencyID;
                    break;
                case 'UpdateFileName':
                    syn.$r.params['repositoryID'] = options.repositoryID;
                    syn.$r.params['itemID'] = options.itemID;
                    syn.$r.params['fileName'] = options.fileName;
                    break;
                case 'DeleteItem':
                    syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageRemoveItem;
                    syn.$r.params['repositoryID'] = options.repositoryID;
                    syn.$r.params['itemID'] = options.itemID;
                    break;
                case 'DeleteItems':
                    syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageRemoveItems;
                    syn.$r.params['repositoryID'] = options.repositoryID;
                    syn.$r.params['dependencyID'] = options.dependencyID;
                    break;
                default:
                    syn.$l.eventLog('getFileAction', 'action 확인 필요', 'Warning');
                    return;
                    break;
            }

            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            $fileclient.executeProxy(syn.$r.url(), callback);
        },

        getItem(elID, itemID, callback) {
            var setting = $fileclient.getFileSetting(elID);
            if (setting == null) {
                var fileManager = $fileclient.getFileManager(elID);
                if (fileManager) {
                    setting = fileManager.datas;
                }
            }

            if (setting) {
                syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageActionHandler;
                syn.$r.params['action'] = 'GetItem';
                syn.$r.params['repositoryID'] = setting.repositoryID;
                syn.$r.params['itemID'] = itemID;
            }
            else {
                var repositoryID = $fileclient.getRepositoryID(elID);
                syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageActionHandler;
                syn.$r.params['action'] = 'GetItem';
                syn.$r.params['repositoryID'] = repositoryID;
                syn.$r.params['itemID'] = itemID;
            }

            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            $fileclient.executeProxy(syn.$r.url(), callback);
        },

        getItems(elID, dependencyID, callback) {
            var setting = $fileclient.getFileSetting(elID);
            if (setting == null) {
                var fileManager = $fileclient.getFileManager(elID);
                if (fileManager) {
                    setting = fileManager.datas;
                }
            }

            if (setting) {
                syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageActionHandler;
                syn.$r.params['action'] = 'GetItems';
                syn.$r.params['repositoryID'] = setting.repositoryID;
                syn.$r.params['dependencyID'] = dependencyID;
            }
            else {
                var repositoryID = $fileclient.getRepositoryID(elID);
                syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageActionHandler;
                syn.$r.params['action'] = 'GetItems';
                syn.$r.params['repositoryID'] = repositoryID;
                syn.$r.params['dependencyID'] = dependencyID;
            }

            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            $fileclient.executeProxy(syn.$r.url(), callback);
        },

        updateDependencyID(elID, sourceDependencyID, targetDependencyID, callback) {
            var setting = $fileclient.getFileSetting(elID);
            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageActionHandler;
            syn.$r.params['action'] = 'UpdateDependencyID';
            syn.$r.params['repositoryID'] = setting.repositoryID;
            syn.$r.params['sourceDependencyID'] = sourceDependencyID;
            syn.$r.params['targetDependencyID'] = targetDependencyID;
            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            $fileclient.executeProxy(syn.$r.url(), callback);
        },

        updateFileName(elID, itemID, fileName, callback) {
            var setting = $fileclient.getFileSetting(elID);
            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageActionHandler;
            syn.$r.params['action'] = 'UpdateFileName';
            syn.$r.params['repositoryID'] = setting.repositoryID;
            syn.$r.params['itemID'] = itemID;
            syn.$r.params['fileName'] = fileName;
            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            $fileclient.executeProxy(syn.$r.url(), callback);
        },

        /*
    직접 파일 업로드 구현 필요
    btnReviewImageUpload_click: async function () {
        if ($this.inValidFileNames.length > 0) {
            syn.$w.alert($this.inValidFileNames.join(', ') + ' 파일은 업로드 할 수 없는 파일 형식입니다')
            return;
        }

        syn.$l.get('btnReviewImageUpload').value = '업로드 중...';
        syn.uicontrols.$fileclient.fileUpload('fleReviewImageUpload', '06', '6', function (upload) {
            syn.$l.get('btnReviewImageUpload').value = '전송';

            if (upload.status == 200) {
                var uploadResult = null;
                try {
                    uploadResult = JSON.parse(upload.response);

                    if (uploadResult.Result == true) {
                        $this.remainingCount = uploadResult.RemainingCount;
                        var uploadFiles = uploadResult.FileUploadResults;
                    }
                    else {
                        syn.$w.alert('첨부파일을 업로드 하지 못했습니다');
                    }
                } catch {
                    syn.$w.alert('첨부파일을 업로드 하지 못했습니다');
                }
            }
        });
    },

    fleReviewImageUpload_change(evt) {
        var el = evt.target || evt.srcElement;
        if (el.files.length > $this.remainingCount) {
            syn.$l.get('fleReviewImageUpload').value = '';
            syn.$w.alert('{0} 건 이상 파일 업로드 할 수 없습니다'.format($this.uploadOptions.uploadCount));
        }

        $this.inValidFileNames = [];
        var acceptTypes = $this.uploadOptions.accept.split(';');

        for (var i = (el.files.length - 1); i >= 0; i--) {
            var file = el.files[i];
            var fileExtension = file.name.split('.')[1];
            if (acceptTypes.indexOf(fileExtension) == -1) {
                $this.inValidFileNames.push(file.name);
            }
        }

        if ($this.inValidFileNames.length > 0) {
            syn.$w.alert($this.inValidFileNames.join(', ') + ' 파일은 업로드 할 수 없는 파일 형식입니다')
        }
    },
         */
        fileUpload(el, repositoryID, dependencyID, callback, uploadUrl) {
            var result = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            var setting = $fileclient.getFileSetting(el.id);
            if ($object.isNullOrUndefined(el) == true || $object.isNullOrUndefined(setting) == true) {
                syn.$l.eventLog('fileUpload', `요청 정보 확인 필요`, 'Warning');
                return;
            }

            var url = '';
            if ($object.isNullOrUndefined(uploadUrl) == true) {
                url = $fileclient.getRepositoryUrl() + '/' + setting.pageUploadFiles + '?repositoryID={0}&dependencyID={1}&responseType=json&callback=none'.format(repositoryID, dependencyID);
            }
            else {
                url = uploadUrl;
            }

            if (url.indexOf('?') == -1) {
                url = url + `?applicationID=${syn.uicontrols.$fileclient.applicationID}&businessID=${syn.uicontrols.$fileclient.businessID}`;
            }
            else {
                url = url + `&applicationID=${syn.uicontrols.$fileclient.applicationID}&businessID=${syn.uicontrols.$fileclient.businessID}`;
            }

            if (el && el.type.toUpperCase() == 'FILE') {
                var formData = new FormData();
                for (var i = 0; i < el.files.length; i++) {
                    formData.append('files', el.files[i]);
                }

                var xhr = syn.$w.xmlHttp();
                xhr.open('POST', url, true);
                xhr.onload = function () {
                    if (callback) {
                        callback({
                            status: xhr.status,
                            response: xhr.responseText
                        });
                    }
                };
                xhr.onerror = function () {
                    if (callback) {
                        callback({
                            status: xhr.status,
                            response: xhr.responseText
                        });
                    }
                };

                xhr.send(formData);
            }
        },

        fileDownload(options) {
            var downloadRequest = null;
            if ($object.isString(options) == true) {
                var elID = options;
                var setting = $fileclient.getFileSetting(elID);
                var itemID = syn.$l.get(elID) ? syn.$l.get(elID).value : null;

                if (setting && itemID) {
                    downloadRequest = JSON.stringify({
                        RepositoryID: setting.repositoryID,
                        ItemID: itemID,
                        FileMD5: '',
                        TokenID: setting.tokenID,
                        ApplicationID: $fileclient.applicationID,
                        BusinessID: $fileclient.businessID
                    });
                }
                else {
                    syn.$l.eventLog('fileDownload', '"{0}"에 대한 요청 정보 확인 필요'.format(elID), 'Debug');
                    return;
                }
            }
            else {
                if (options.repositoryID && options.itemID) {
                    downloadRequest = JSON.stringify({
                        RepositoryID: options.repositoryID,
                        ItemID: options.itemID,
                        FileMD5: options.fileMD5,
                        TokenID: options.tokenID,
                        ApplicationID: $fileclient.applicationID,
                        BusinessID: $fileclient.businessID
                    });
                }
                else {
                    syn.$l.eventLog('fileDownload', '"{0}"에 대한 요청 정보 확인 필요'.format(elID), 'Debug');
                    return;
                }
            }

            var setting = $fileclient.getFileManagerSetting();
            if ($object.isNullOrUndefined(setting) == true) {
                syn.$l.eventLog('fileDownload', `FileManagerSetting 정보 확인 필요`, 'Warning');
                return;
            }

            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageDownloadFile;

            var http = syn.$w.xmlHttp();
            http.open('POST', syn.$r.url(), true);
            http.setRequestHeader('Content-type', 'application/json');
            http.responseType = 'blob';
            http.onload = function (e) {
                if (http.status == 200) {
                    if (http.getResponseHeader('FileModelType') == 'DownloadResult') {
                        var responseData = syn.$c.base64Decode(http.getResponseHeader('FileResult'));
                        var downloadResult = JSON.parse(responseData);
                        if (downloadResult.Result == true) {
                            syn.$l.blobToDownload(http.response, downloadResult.FileName);
                        }
                        else {
                            syn.$l.eventLog('fileDownload', '파일 다운로드 실패: "{0}"'.format(downloadResult.Message), 'Debug');
                        }
                    }
                    else {
                        syn.$l.eventLog('fileDownload', 'itemID: "{0}" 파일 다운로드 응답 오류'.format(JSON.stringify(options)), 'Debug');
                    }
                }
                else {
                    syn.$l.eventLog('fileDownload', '파일 다운로드 오류, status: "{0}"'.format(http.statusText), 'Debug');
                }
            }

            http.send(downloadRequest);
        },

        httpDownloadFile(repositoryID, itemID, fileMD5, tokenID) {
            if (document.forms.length > 0 && syn.$l.get('repositoryDownload') == null) {
                var form = document.forms[0];
                var repositoryDownload = syn.$m.append(form, 'iframe', 'repositoryDownload', {
                    styles: { display: 'none' }
                });
                repositoryDownload.name = 'repositoryDownload';
                repositoryDownload.width = '100%';
            }

            var setting = $fileclient.getFileManagerSetting();
            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageHttpDownloadFile;
            syn.$r.params['repositoryID'] = repositoryID;
            syn.$r.params['itemID'] = itemID;
            syn.$r.params['fileMD5'] = fileMD5;
            syn.$r.params['tokenID'] = tokenID;
            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            syn.$l.get('repositoryDownload').src = syn.$r.url();
        },

        virtualDownloadFile(repositoryID, fileName, subDirectory) {
            if (document.forms.length > 0 && syn.$l.get('repositoryDownload') == null) {
                var form = document.forms[0];
                var repositoryDownload = syn.$m.append(form, 'iframe', 'repositoryDownload', {
                    styles: { display: 'none' }
                });
                repositoryDownload.name = 'repositoryDownload';
            }

            var setting = $fileclient.getFileManagerSetting();
            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageVirtualDownloadFile;
            syn.$r.params['repositoryID'] = repositoryID;
            syn.$r.params['fileName'] = fileName;
            syn.$r.params['subDirectory'] = subDirectory;
            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            syn.$l.get('repositoryDownload').src = syn.$r.url();
        },

        virtualDeleteFile(repositoryID, fileName, subDirectory) {
            var setting = $fileclient.getFileManagerSetting();
            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageVirtualDeleteFile;
            syn.$r.params['repositoryID'] = repositoryID;
            syn.$r.params['fileName'] = fileName;
            syn.$r.params['subDirectory'] = subDirectory;
            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            $fileclient.executeProxy(syn.$r.url(), function (response) {
                if (response.Result == false) {
                    syn.$l.eventLog('virtualDeleteFile', response.Message);
                }
            });
        },

        deleteItem(elID, itemID, callback) {
            var setting = $fileclient.getFileSetting(elID);
            if (setting == null) {
                var fileManager = $fileclient.getFileManager(elID);
                if (fileManager) {
                    setting = fileManager.datas;
                }
            }

            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageRemoveItem;
            syn.$r.params['repositoryID'] = setting.repositoryID;
            syn.$r.params['itemID'] = itemID;
            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            $fileclient.executeProxy(syn.$r.url(), function (response) {
                if (setting.uploadType == 'Single' || setting.uploadType == 'Profile') {
                    if (response && response.Result == true) {
                        var el = syn.$l.get(elID);
                        if ($object.isNullOrUndefined(el) == false) {
                            el.value = '';
                        }
                    }
                }
                else {
                    if (response && response.Result == true) {
                        var el = syn.$l.get(elID);
                        if ($object.isNullOrUndefined(el) == false) {
                            var items = [];
                            var uploadItems = el.value.split(',');
                            for (var i = 0; i < uploadItems.length; i++) {
                                var uploadItem = uploadItems[i];
                                if (uploadItem != itemID) {
                                    items.push(uploadItem);
                                }
                            }

                            el.value = items.join(',');
                        }
                    }
                }

                if (callback) {
                    callback(response);
                }
            });
        },

        deleteItems(elID, dependencyID, callback) {
            var setting = $fileclient.getFileSetting(elID);
            if (setting == null) {
                var fileManager = $fileclient.getFileManager(elID);
                if (fileManager) {
                    setting = fileManager.datas;
                }
            }

            syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageRemoveItems;
            syn.$r.params['repositoryID'] = setting.repositoryID;
            syn.$r.params['dependencyID'] = dependencyID;
            syn.$r.params['applicationID'] = $fileclient.applicationID;
            syn.$r.params['businessID'] = $fileclient.businessID;

            $fileclient.executeProxy(syn.$r.url(), function (response) {
                if (response && response.Result == true) {
                    var el = syn.$l.get(elID);
                    if ($object.isNullOrUndefined(el) == false) {
                        el.value = '';
                    }
                }

                if (callback) {
                    callback(response);
                }
            });
        },

        uploadBlob(options, callback) {
            options = syn.$w.argumentsExtend({
                repositoryID: null,
                dependencyID: null,
                blobInfo: null,
                mimeType: 'application/octet-stream',
                fileName: null
            }, options);

            var setting = $fileclient.getFileManagerSetting();
            if ($string.isNullOrEmpty(options.repositoryID) == false && $string.isNullOrEmpty(options.dependencyID) == false && options.blobInfo) {
                syn.$r.path = $fileclient.getRepositoryUrl() + '/' + setting.pageUploadFile;
                syn.$r.params['repositoryID'] = options.repositoryID;
                syn.$r.params['dependencyID'] = options.dependencyID;
                syn.$r.params['applicationID'] = $fileclient.applicationID;
                syn.$r.params['businessID'] = $fileclient.businessID;

                var xhr = syn.$w.xmlHttp();
                xhr.open('POST', syn.$r.url());
                xhr.onload = function () {
                    if (xhr.status != 200) {
                        syn.$l.eventLog('$fileclient.uploadBlob', 'HTTP Error code: {0}, text: {1}'.format(xhr.status, xhr.statusText), 'Warning');
                        return;
                    }

                    try {
                        var responseText = xhr.responseText;
                        if ($string.isNullOrEmpty(responseText) == false) {
                            if (callback) {
                                callback(JSON.parse(responseText));
                            }
                        }
                        else {
                            syn.$w.alert('Blob 파일 업로드 정보 확인 필요');
                        }
                    } catch (error) {
                        syn.$w.alert('Blob 파일 업로드 오류: {0}'.format(error.message));
                        syn.$l.eventLog('$fileclient.uploadBlob', error, 'Warning');
                    }
                };

                xhr.onerror = function () {
                    syn.$l.eventLog('$fileclient.uploadBlob', 'HTTP Error code: {0}, text: {1}'.format(xhr.status, xhr.statusText), 'Warning');
                };

                var formData = new FormData();
                var fileName = options.fileName || 'blob-' + syn.$l.random(24);
                formData.append('file', options.blobInfo, fileName);
                xhr.send(formData);
            }
            else {
                var message = 'Blob 파일 업로드 필수 항목 확인 필요';
                syn.$w.alert(message);
                syn.$l.eventLog('$fileclient.uploadBlob', message, 'Warning');
            }
        },

        uploadDataUri(options, callback) {
            options = syn.$w.argumentsExtend({
                repositoryID: null,
                dependencyID: null,
                dataUri: null,
                mimeType: null,
                fileName: null
            }, options);

            if ($string.isNullOrEmpty(options.repositoryID) == false && $string.isNullOrEmpty(options.dependencyID) == false && $string.isNullOrEmpty(options.dataUri) == false) {
                options.blobInfo = syn.$l.dataUriToBlob(options.dataUri);
                options.mimeType = options.blobInfo.type;
                $fileclient.uploadBlob(options, callback);
            }
            else {
                var message = 'DataUri 파일 업로드 필수 항목 확인 필요';
                syn.$w.alert(message);
                syn.$l.eventLog('$fileclient.uploadDataUri', message, 'Warning');
            }
        },

        uploadBlobUri(options, callback) {
            options = syn.$w.argumentsExtend({
                repositoryID: null,
                dependencyID: null,
                blobUri: null,
                mimeType: null,
                fileName: null
            }, options);

            if ($string.isNullOrEmpty(options.repositoryID) == false && $string.isNullOrEmpty(options.dependencyID) == false && $string.isNullOrEmpty(options.blobUri) == false) {
                syn.$l.blobUrlToBlob(options.blobUri, function (blobInfo) {
                    options.blobInfo = blobInfo;
                    options.mimeType = options.blobInfo.type;
                    $fileclient.uploadBlob(options, callback);
                });
            }
            else {
                var message = 'BlobUri 파일 업로드 필수 항목 확인 필요';
                syn.$w.alert(message);
                syn.$l.eventLog('$fileclient.uploadBlobUri', message, 'Warning');
            }
        },

        uploadUI(uploadOptions) {
            var dialogOptions = $object.clone(syn.$w.dialogOptions);
            dialogOptions.minWidth = 420;
            dialogOptions.minHeight = 320;

            uploadOptions = syn.$w.argumentsExtend(dialogOptions, uploadOptions);
            dialogOptions.minWidth = uploadOptions.minWidth;
            dialogOptions.minHeight = uploadOptions.minHeight;
            dialogOptions.caption = uploadOptions.dialogTitle;

            if (uploadOptions.repositoryID == '' || uploadOptions.uploadUrl == '') {
                syn.$w.alert('uploadOptions에 repositoryID 또는 uploadUrl이 입력되지 않았습니다.');
                return;
            }

            if (uploadOptions.uploadUrl.indexOf('?') > -1) {
                uploadOptions.uploadUrl += '&repositoryID=' + uploadOptions.repositoryID;
            }
            else {
                uploadOptions.uploadUrl += '?repositoryID=' + uploadOptions.repositoryID;
            }

            uploadOptions.uploadUrl += '&companyNo=' + syn.$w.User.WorkCompanyNo;

            fileUploadOptions = uploadOptions;
            syn.$w.showUIDialog(uploadOptions.uploadUrl, dialogOptions);
        },

        toFileLengthString(fileLength) {
            var val = '0 KB';
            if (fileLength < 0) {
                fileLength = 0;
            }

            if (fileLength < 1048576.0) {
                val = (fileLength / 1024.0).toString() + ' KB';
            }
            if (fileLength < 1073741824.0) {
                val = ((fileLength / 1024.0) / 1024.0).toString() + ' MB';
            }

            return val;
        },

        executeProxy(url, callback) {
            var xhr = syn.$w.xmlHttp();

            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        var responseText = xhr.responseText;
                        if ($string.isNullOrEmpty(responseText) == false) {
                            if (callback) {
                                callback(JSON.parse(responseText));
                            }
                        }
                        else {
                            syn.$w.alert('파일 응답 정보 확인 필요');
                        }
                    }
                    else {
                        syn.$l.eventLog('$fileclient.executeProxy', 'async url: ' + url + ', status: ' + xhr.status.toString() + ', responseText: ' + xhr.responseText, 'Error');
                    }
                }
            };

            xhr.open('GET', url, true);
            xhr.send();
        },

        getTemporaryDependencyID(prefix) {
            return $string.isNullOrEmpty(prefix) == true ? syn.$l.guid().replaceAll('-','') : prefix + syn.$l.random(24);
        },

        setLocale(elID, translations, control, options) {
        }
    });

    $fileclient.moduleInit();

    syn.uicontrols.$fileclient = $fileclient;
})(window);
