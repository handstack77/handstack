'use strict';
let $ProfilePicture = {
    prop: {
        managerID: 'ProfileFileUpload',
        fileUploadOptions: null,
        profileFileName: null,
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
                syn.$l.eventLog('$fileclient.controlLoad', '파일 컨트롤 초기화 오류, ApplicationID 정보 확인 필요', 'Error');
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
            $this.prop.profileFileName = $this.prop.fileUploadOptions.profileFileName;
            $this.prop.uploadDependencyID = $this.prop.fileUploadOptions.dependencyID;
            $this.prop.fileUpdateCallback = $this.prop.fileUploadOptions.fileUpdateCallback;

            syn.uicontrols.$fileclient.init('ProfileFileUpload', syn.$l.get('divProfilePicture'), $this.prop.fileUploadOptions, $this.method.fileChangeHandler);
            $this.method.initFileUploadUI();
        }
    },

    event: {
        btnUpload_click() {
            var profileFile = syn.$l.querySelector('[name=files]').value.trim();
            if (profileFile == '') {
                syn.$w.alert('업로드 할 파일을 선택하세요');
                return;
            }

            syn.uicontrols.$fileclient.doUpload($this.prop.managerID, $this.prop.fileUploadOptions, '$this.method.doUploadCallback');
        },

        btnUploadFileDelete_click(e) {
            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = '2';
            alertOptions.buttonType = '3';
            syn.$w.alert($resource.translations.removeConfirm, $resource.translations.delete, alertOptions, function (result) {
                if (result == 'Yes') {
                    var itemID = syn.$l.get('imgProfilePicture').item.ItemID;
                    if (itemID) {
                        syn.uicontrols.$fileclient.deleteItem($this.prop.managerID, itemID, function (result) {
                            if (result.Result == true) {
                                syn.$l.get('imgProfilePicture').src = '/img/common/profile.png';
                                syn.$m.addClass(syn.$l.get('btnUploadFileDelete'), 'hidden');
                                syn.$m.addClass(syn.$l.get('btnUploadFileDownload'), 'hidden');
                                syn.$m.removeClass(syn.$l.get('btnUpload'), 'hidden');
                                $this.method.initFileUploadUI();

                                if ($this.prop.fileUpdateCallback) {
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
        },

        btnUploadFileDownload_click() {
            var itemID = syn.$l.get('imgProfilePicture').item.ItemID;
            if (itemID) {
                var downloadRequest = {
                    repositoryID: syn.uicontrols.$fileclient.getRepositoryID($this.prop.managerID),
                    itemID: itemID
                };
                syn.uicontrols.$fileclient.fileDownload(downloadRequest);
            }
        }
    },

    method: {
        initFileUploadUI() {
            var fileManager = syn.uicontrols.$fileclient.getFileManager($this.prop.managerID);
            var uploadSetting = fileManager.datas;

            syn.uicontrols.$fileclient.setDependencyID($this.prop.managerID, $this.prop.uploadDependencyID);

            syn.uicontrols.$fileclient.getItems($this.prop.managerID, $this.prop.uploadDependencyID, function (repositoryItems) {
                $this.prop.uploadExtensions = uploadSetting.uploadExtensions;
                $this.prop.uploadCount = uploadSetting.uploadCount;

                // Repository에 등록된 uploadCount와 업로드된 아이템의 갯수를 비교하여 FileUpload UI 항목를 화면에 추가합니다.
                for (var i = 0; i < $this.prop.uploadCount - repositoryItems.length; i++) {
                    syn.uicontrols.$fileclient.addFileUI($this.prop.managerID, uploadSetting.accept);
                }

                // 업로드된 아이템의 갯수만큼 FileDownload UI 항목를 화면에 추가합니다.
                if (repositoryItems.length > 0) {
                    var repositoryItem = repositoryItems[0];
                    syn.$l.get('imgProfilePicture').src = repositoryItem.AbsolutePath + (repositoryItem.AbsolutePath.indexOf('?') == -1 ? '?' : '&') + 'ext=' + repositoryItem.Extension;
                    syn.$l.get('imgProfilePicture').item = repositoryItem;

                    syn.$m.removeClass(syn.$l.get('btnUploadFileDelete'), 'hidden');
                    syn.$m.removeClass(syn.$l.get('btnUploadFileDownload'), 'hidden');
                    syn.$m.addClass(syn.$l.get('btnUpload'), 'hidden');
                }
            });
        },

        fileChangeHandler(el, fileItem) {
            var mimeType = fileItem.type;
            if (mimeType.indexOf('image') > -1) {
                var ext = mimeType.substring(6);
                var isAllowUpload = ($this.prop.uploadExtensions.indexOf('*/*') > -1 || $this.prop.uploadExtensions.indexOf(ext) > -1)
                if (isAllowUpload == false) {
                    el.value = '';
                }
            }
            else {
                el.value = '';
            }

            if (el.value == '') {
                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.stack = '"{0}" 이미지 파일을 선택하세요'.format($this.prop.uploadExtensions);
                syn.$w.alert('선택할 수 없는 파일입니다', '이미지 업로드', alertOptions);
                return;
            }

            if (el.files && el.files[0]) {
                var reader = new FileReader();

                reader.onload = function (evt) {
                    $('#imgProfilePicture').attr('src', evt.target.result);
                }

                reader.readAsDataURL(el.files[0]);
            }
        },

        // Chrome 브라우저 보안 이슈로 인해 호출이 안됨. postMessage로 폴백 처리했으며, IE, FF에서 확인 필요
        doUploadCallback(repositoryID, repositoryItems) {
            if ($this.prop.fileUpdateCallback) {
                if (repositoryItems.length > 0) {
                    var repositoryItem = repositoryItems[0];
                    syn.$l.get('imgProfilePicture').src = $this.prop.fileUploadOptions.fileManagerServer + repositoryItem.RelativePath;
                    syn.$l.get('imgProfilePicture').item = repositoryItem;

                    syn.$m.removeClass(syn.$l.get('btnUploadFileDelete'), 'hidden');
                    syn.$m.removeClass(syn.$l.get('btnUploadFileDownload'), 'hidden');
                    syn.$m.addClass(syn.$l.get('btnUpload'), 'hidden');
                }

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
                        repositoryID: repositoryID,
                        items: repositoryItems
                    };

                    clientCallback('upload', result);
                }
            }
        },
    }
};
