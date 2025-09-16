'use strict';
let $MultiFiles = {
    prop: {
        managerID: 'MultiFileUpload',
        fileUploadOptions: null,
        fileUpdateCallback: null,
        uploadCount: 0,
        uploadExtensions: '*/*',
        uploadDependencyID: null,
    },

    hook: {
        controlInit(elID, controlOptions) {
            if (elID == 'synFileClient') {
                controlOptions.repositoryID = syn.$r.query('repositoryID');
                return controlOptions;
            }
        },

        pageLoad() {
            if (location.pathname.startsWith((syn.Config.TenantAppRequestPath ? `/${syn.Config.TenantAppRequestPath}/` : '/app/')) == true) {
                if ($string.isNullOrEmpty(syn.uicontrols.$fileclient.applicationID) == true) {
                    syn.uicontrols.$fileclient.applicationID = syn.$w.ManagedApp.ApplicationID;
                }
            }
            else {
                if ($string.isNullOrEmpty(syn.uicontrols.$fileclient.applicationID) == true) {
                    syn.uicontrols.$fileclient.applicationID = syn.$w.Variable.ApplicationID || syn.$w.User.ApplicationID || syn.Config.ApplicationID;
                }
            }

            if ($string.isNullOrEmpty(syn.uicontrols.$fileclient.applicationID) == true) {
                syn.$l.eventLog('$fileclient.hook.controlLoad', '파일 컨트롤 초기화 오류, ApplicationID 정보 확인 필요', 'Error');
                return;
            }

            if (syn.Config.FileBusinessIDSource && syn.Config.FileBusinessIDSource != 'None') {
                if (syn.Config.FileBusinessIDSource == 'Cookie') {
                    syn.uicontrols.$fileclient.businessID = syn.$r.getCookie('FileBusinessID');
                }
                else if (syn.Config.FileBusinessIDSource == 'SessionStorage') {
                    syn.uicontrols.$fileclient.businessID = syn.$w.getStorage('FileBusinessID');
                }
            }

            if ($string.isNullOrEmpty(syn.uicontrols.$fileclient.businessID) == true) {
                syn.uicontrols.$fileclient.businessID = syn.$w.User.WorkCompanyNo;
            }

            if ($string.isNullOrEmpty(syn.uicontrols.$fileclient.businessID) == true) {
                syn.uicontrols.$fileclient.businessID = '0';
            }

            $this.prop.fileUploadOptions = parent.fileUploadOptions;
            $this.prop.uploadDependencyID = $this.prop.fileUploadOptions.dependencyID;
            $this.prop.fileUpdateCallback = $this.prop.fileUploadOptions.fileUpdateCallback;

            syn.uicontrols.$fileclient.init('MultiFileUpload', syn.$l.get('divAttachFiles'), $this.prop.fileUploadOptions, $this.method.fileChangeHandler);
            $this.method.initFileUploadUI();
        }
    },

    event: {
        // Chrome 브라우저 보안 이슈로 인해 호출이 안됨. postMessage로 폴백 처리했으며, IE, FF에서 확인 필요
        doUploadCallback(repositoryID, repositoryItems) {
            if ($this.prop.fileUpdateCallback) {
                if (repositoryItems.length > 0) {
                    var removeItems = syn.$l.querySelectorAll('#divAttachFiles > li', '#divFileInfos > li');
                    // 기존 업로드된 파일 목록을 삭제합니다.
                    for (var i = 0; i < removeItems.length; i++) {
                        syn.$m.remove(removeItems[i]);
                    }

                    // Repository에 등록된 uploadCount와 업로드된 아이템의 갯수를 비교하여 FileUpload UI 항목를 화면에 추가합니다.
                    for (var i = 0; i < $this.prop.uploadCount - repositoryItems.length; i++) {
                        syn.uicontrols.$fileclient.addFileUI($this.prop.managerID);
                    }

                    // 업로드된 아이템의 갯수만큼 FileDownload UI 항목를 화면에 추가합니다.
                    if (repositoryItems.length > 0) {
                        var repositoryItem = repositoryItems[0];
                        var div = syn.$m.append(syn.$l.get('divFileInfos'), 'div', repositoryItem.ItemID);
                        var link = syn.$m.append(div, 'a', repositoryItem.ItemID + 'link');
                        link.href = 'javascript: void(0)';
                        link.downloadPath = repositoryItem.AbsolutePath + (repositoryItem.AbsolutePath.indexOf('?') == -1 ? '?' : '&') + 'ext=' + repositoryItem.Extension;
                        link.download = repositoryItem.FileName;
                        syn.$l.addEvent(link, 'click', function () {
                            var downloadPath = this.downloadPath;
                            var download = this.download;
                            syn.$l.blobUrlToBlob(downloadPath, function (blob) {
                                syn.$l.blobToDownload(blob, download);
                            });
                            return false;
                        });
                        link.textContent = repositoryItem.FileName;

                        var span = syn.$m.append(div, 'button', repositoryItem.ItemID + '_span');
                        syn.$m.addClass(span, 'btn btn-icon bg-muted-lt ml-2');
                        span.innerHTML = '<i class="f:18 ti ti-trash"></i>';

                        syn.$l.addEvent(span, 'click', $this.event.btnAttachFileDelete_click);
                        span.item = repositoryItem;
                    }
                }

                // UI 화면 모듈의 콜백 함수를 호출합니다.
                var clientCallback = null;
                var uploadCallbacks = $this.prop.fileUpdateCallback.split('.');
                for (var i = 0; i < uploadCallbacks.length; i++) {
                    try {
                        if (i === 0) {
                            clientCallback = parent.$this.event[uploadCallbacks[i]];
                        }
                        else {
                            clientCallback = clientCallback[uploadCallbacks[i]];
                        }
                    }
                    catch (exception) {
                        clientCallback = null;
                        break;
                    }
                }

                if (clientCallback) {
                    var result = {
                        elID: $this.prop.fileUploadOptions.elementID,
                        repositoryID: repositoryID,
                        items: repositoryItems
                    };

                    clientCallback('upload', result);
                }
            }
        },

        btnUpload_click() {
            syn.uicontrols.$fileclient.doUpload($this.prop.managerID, $this.prop.fileUploadOptions, '$this.method.doUploadCallback');
        },

        btnAttachFileDelete_click(e) {
            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = '2';
            alertOptions.buttonType = '3';
            syn.$w.alert($resource.translations.removeConfirm, $resource.translations.delete, alertOptions, function (result) {
                if (result == 'Yes') {
                    var elButton = e.target || e;
                    var el = syn.$l.get(elButton.item.ItemID);
                    var itemID = elButton.item.ItemID;
                    if (itemID) {
                        syn.uicontrols.$fileclient.deleteItem($this.prop.managerID, itemID, function (result) {
                            if (result.Result == true) {
                                syn.$m.remove(el);

                                syn.uicontrols.$fileclient.addFileUI($this.prop.managerID);
                                if ($this.prop.fileUpdateCallback) {
                                    // UI 화면 모듈의 콜백 함수를 호출합니다.
                                    var clientCallback = null;
                                    var uploadCallbacks = $this.prop.fileUpdateCallback.split('.');
                                    for (var i = 0; i < uploadCallbacks.length; i++) {
                                        try {
                                            if (i === 0) {
                                                clientCallback = parent.$this.event[uploadCallbacks[i]];
                                            }
                                            else {
                                                clientCallback = clientCallback[uploadCallbacks[i]];
                                            }
                                        }
                                        catch (exception) {
                                            clientCallback = null;
                                            break;
                                        }
                                    }

                                    if (clientCallback) {
                                        var result = {
                                            elID: $this.prop.fileUploadOptions.elementID,
                                            repositoryID: syn.uicontrols.$fileclient.getRepositoryID($this.prop.managerID),
                                            itemID: itemID
                                        };

                                        if ($this.prop.fileUploadOptions.elementID) {
                                            parent.syn.$l.get($this.prop.fileUploadOptions.elementID).value = '';
                                        }

                                        clientCallback('delete', result);
                                    }
                                }
                            }
                            else {
                                syn.$w.alert(result.Message, '경고');
                            }
                        });
                    }
                }
            });
        }
    },

    method: {
        initFileUploadUI() {
            var fileManager = syn.uicontrols.$fileclient.getFileManager($this.prop.managerID);
            var uploadSetting = fileManager.datas;

            syn.uicontrols.$fileclient.setDependencyID($this.prop.managerID, $this.prop.uploadDependencyID);

            syn.uicontrols.$fileclient.getItems($this.prop.managerID, $this.prop.uploadDependencyID, function (repositoryItems) {
                if ($object.isArray(repositoryItems) == true) {
                    $this.prop.uploadExtensions = uploadSetting.uploadExtensions;
                    $this.prop.uploadCount = uploadSetting.uploadCount;

                    // Repository에 등록된 uploadCount와 업로드된 아이템의 갯수를 비교하여 FileUpload UI 항목를 화면에 추가합니다.
                    for (var i = 0; i < $this.prop.uploadCount - repositoryItems.length; i++) {
                        syn.uicontrols.$fileclient.addFileUI($this.prop.managerID, uploadSetting.accept);
                    }

                    // 업로드된 아이템의 갯수만큼 FileDownload UI 항목를 화면에 추가합니다.
                    if (repositoryItems.length > 0) {
                        for (var i = 0; i < repositoryItems.length; i++) {
                            var repositoryItem = repositoryItems[i];

                            var div = syn.$m.append(syn.$l.get('divFileInfos'), 'div', repositoryItem.ItemID);
                            var link = syn.$m.append(div, 'a', repositoryItem.ItemID + '_link');
                            link.href = 'javascript: void(0)';
                            link.downloadPath = repositoryItem.AbsolutePath + (repositoryItem.AbsolutePath.indexOf('?') == -1 ? '?' : '&') + 'ext=' + repositoryItem.Extension;
                            link.download = repositoryItem.FileName;
                            syn.$l.addEvent(link, 'click', function () {
                                var downloadPath = this.downloadPath;
                                var download = this.download;
                                syn.$l.blobUrlToBlob(downloadPath, function (blob) {
                                    syn.$l.blobToDownload(blob, download);
                                });
                                return false;
                            });
                            link.textContent = repositoryItem.FileName;

                            var span = syn.$m.append(div, 'button', repositoryItem.ItemID + '_span');
                            syn.$m.addClass(span, 'btn btn-icon bg-muted-lt ml-2');
                            span.innerHTML = '<i class="f:18 ti ti-trash"></i>';

                            syn.$l.addEvent(span, 'click', $this.event.btnAttachFileDelete_click);
                            span.item = repositoryItem;
                        }
                    }
                }
                else {
                    syn.$l.eventLog('$fileclient.method.initFileUploadUI', '파일 컨트롤 초기화 오류, ApplicationID 정보 확인 필요', 'Error');
                }
            });
        },

        fileChangeHandler(el, fileItem) {
            // syn.$l.get('divFileInfos').innerText = unescape(fileName);
        }
    }
};
