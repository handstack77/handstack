﻿'use strict';
let $ImageLinkFiles = {
    prop: {
        managerID: 'ImageLinkFileUpload',
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

            syn.uicontrols.$fileclient.init('ImageLinkFileUpload', syn.$l.get('divEditorImageFiles'), $this.prop.fileUploadOptions, $this.fileChangeHandler);
            $this.method.initFileUploadUI();
        },
    },

    event: {
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

                                var uploadCount = parseInt(syn.$l.get('spnRemainUploadCount').textContent);
                                syn.$l.get('spnRemainUploadCount').textContent = uploadCount + 1;

                                if ($this.prop.fileUpdateCallback) {
                                    // UI 화면 모듈의 콜백 함수를 호출합니다.
                                    var clientCallback = null;
                                    var uploadCallbacks = $this.prop.fileUpdateCallback.split('.');
                                    for (var i = 0; i < uploadCallbacks.length; i++) {
                                        try {
                                            if (i === 0) {
                                                clientCallback = parent.$this[uploadCallbacks[i]];
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
                                            parent.$l.get($this.prop.fileUploadOptions.elementID).value = '';
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

                    syn.$l.get('spnMaxUploadCount').textContent = $this.prop.uploadCount.toString();
                    syn.$l.get('spnRemainUploadCount').textContent = ($this.prop.uploadCount - repositoryItems.length).toString();

                    // 업로드된 아이템의 갯수만큼 FileDownload UI 항목를 화면에 추가합니다.
                    if (repositoryItems.length > 0) {
                        for (var i = 0; i < repositoryItems.length; i++) {
                            var repositoryItem = repositoryItems[i];
                            var listGroupItem = syn.$m.append(syn.$l.get('divFileInfos'), 'div', repositoryItem.ItemID);
                            listGroupItem.className = 'list-group-item p-1';

                            var row = syn.$m.append(listGroupItem, 'div');
                            row.className = 'row align-items-center';

                            var colAvatar = syn.$m.append(row, 'div');
                            colAvatar.className = 'col-auto';

                            var avatarSpan = syn.$m.append(colAvatar, 'span');
                            avatarSpan.className = 'avatar avatar-1';
                            avatarSpan.style.backgroundImage = 'url(' + (repositoryItem.AbsolutePath + (repositoryItem.AbsolutePath.indexOf('?') == -1 ? '?' : '&') + 'ext=' + repositoryItem.Extension) + ')';

                            var colText = syn.$m.append(row, 'div');
                            colText.className = 'col text-truncate';

                            var fileLink = syn.$m.append(colText, 'a', repositoryItem.ItemID + '_link');
                            fileLink.downloadPath = repositoryItem.AbsolutePath + (repositoryItem.AbsolutePath.indexOf('?') == -1 ? '?' : '&') + 'ext=' + repositoryItem.Extension;
                            fileLink.download = repositoryItem.FileName;
                            syn.$l.addEvent(fileLink, 'click', function () {
                                var downloadPath = this.downloadPath;
                                var download = this.download;
                                syn.$l.blobUrlToBlob(downloadPath, function (blob) {
                                    syn.$l.blobToDownload(blob, download);
                                });
                                return false;
                            });
                            fileLink.className = 'text-reset d-block';
                            fileLink.textContent = repositoryItem.FileName;

                            var descriptionDiv = syn.$m.append(colText, 'div');
                            descriptionDiv.className = 'd-block text-secondary text-truncate mt-n1';
                            descriptionDiv.textContent = `파일 크기: ${$number.toByteString(repositoryItem.Size)}`;

                            var colDelete = syn.$m.append(row, 'div');
                            colDelete.className = 'col-auto';

                            var deleteIcon = syn.$m.append(colDelete, 'i');
                            deleteIcon.className = 'font:20 mr:4 ti ti-x';
                            deleteIcon.style.cursor = 'pointer';
                            syn.$l.addEvent(deleteIcon, 'click', $this.event.btnAttachFileDelete_click);
                            deleteIcon.item = repositoryItem;
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
        },
    },
};
