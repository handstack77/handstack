(function ($resource) {
    /// <summary>
    /// 다국어 처리를 위한 문자열 리소스를 확장하는 모듈입니다. 
    /// </summary>
    if (!$resource) {
        $resource = new syn.module();
    }

    $resource.extend({
        labels: [],
        messages: [],
        mimeType: {
            'html': 'text/html'
            , 'htm': 'text/html'
            , 'css': 'text/css'
            , 'xml': 'text/xml'
            , 'mml': 'text/mathml'
            , 'txt': 'text/plain'
            , 'jad': 'text/vnd.sun.j2me.app-descriptor'
            , 'wml': 'text/vnd.wap.wml'
            , 'htc': 'text/x-component'
            , 'gif': 'image/gif'
            , 'jpeg': 'image/jpeg'
            , 'jpg': 'image/jpeg'
            , 'png': 'image/png'
            , 'tif': 'image/tiff'
            , 'tiff': 'image/tiff'
            , 'wbmp': 'image/vnd.wap.wbmp'
            , 'ico': 'image/x-icon'
            , 'jng': 'image/x-jng'
            , 'bmp': 'image/x-ms-bmp'
            , 'svg': 'image/svg+xml'
            , 'webp': 'image/webp'
            , 'js': 'application/x-javascript'
            , 'atom': 'application/atom+xml'
            , 'rss': 'application/rss+xml'
            , 'jar': 'application/java-archive'
            , 'war': 'application/java-archive'
            , 'ear': 'application/java-archive'
            , 'hqx': 'application/mac-binhex40'
            , 'pdf': 'application/pdf'
            , 'ps': 'application/postscript'
            , 'eps': 'application/postscript'
            , 'ai': 'application/postscript'
            , 'rtf': 'application/rtf'
            , 'doc': 'application/msword'
            , 'docx': 'application/msword'
            , 'xls': 'application/vnd.ms-excel'
            , 'xlsx': 'application/vnd.ms-excel'
            , 'ppt': 'application/vnd.ms-powerpoint'
            , 'pptx': 'application/vnd.ms-powerpoint'
            , 'wmlc': 'application/vnd.wap.wmlc'
            , 'kml': 'application/vnd.google-earth.kml+xml'
            , 'kmz': 'application/vnd.google-earth.kmz'
            , '7z': 'application/x-7z-compressed'
            , 'cco': 'application/x-cocoa'
            , 'jardiff': 'application/x-java-archive-diff'
            , 'jnlp': 'application/x-java-jnlp-file'
            , 'run': 'application/x-makeself'
            , 'rar': 'application/x-rar-compressed'
            , 'rpm': 'application/x-redhat-package-manager'
            , 'sea': 'application/x-sea'
            , 'swf': 'application/x-shockwave-flash'
            , 'sit': 'application/x-stuffit'
            , 'tcl': 'application/x-tcl'
            , 'tk': 'application/x-tcl'
            , 'der': 'application/x-x509-ca-cert'
            , 'pem': 'application/x-x509-ca-cert'
            , 'crt': 'application/x-x509-ca-cert'
            , 'xpi': 'application/x-xpinstall'
            , 'xhtml': 'application/xhtml+xml'
            , 'zip': 'application/zip'
            , 'bin': 'application/octet-stream'
            , 'exe': 'application/octet-stream'
            , 'dll': 'application/octet-stream'
            , 'deb': 'application/octet-stream'
            , 'dmg': 'application/octet-stream'
            , 'eot': 'application/octet-stream'
            , 'iso': 'application/octet-stream'
            , 'img': 'application/octet-stream'
            , 'msi': 'application/octet-stream'
            , 'ewp': 'application/octet-stream'
            , 'msm': 'application/octet-stream'
            , 'mid': 'audio/midi'
            , 'midi': 'audio/midi'
            , 'mp3': 'audio/mpeg'
            , 'ogg': 'audio/ogg'
            , 'ra': 'audio/x-realaudio'
            , '3gpp': 'video/3gpp'
            , '3gp': 'video/3gpp'
            , 'mpeg': 'video/mpeg'
            , 'mpg': 'video/mpeg'
            , 'mov': 'video/quicktime'
            , 'flv': 'video/x-flv'
            , 'mng': 'video/x-mng'
            , 'asx': 'video/x-ms-asf'
            , 'asf': 'video/x-ms-asf'
            , 'wmv': 'video/x-ms-wmv'
            , 'avi': 'video/x-msvideo'
            , 'm4v': 'video/mp4'
            , 'mp4': 'video/mp4'
        },

        addStringResource(id, val) {
            /// <summary>
            /// 다국어 문자열 리소스를 추가합니다. 중복되는 키가 있을 경우 덮어씁니다.
            /// &#10;&#10;
            /// example :&#10;
            /// &#10;$resource.add("addResource1": {title:"타이틀입니다.", text:"메시지입니다."});
            /// &#10;alert($resource.messages.addResource1.title);
            /// &#10;alert($resource.messages.addResource1.title);
            /// </summary>
            /// <param name="id" type="String">다국어 문자열 리소스 키입니다.</param>
            /// <param name="val" type="Object">다국어 문자열 값입니다.</param>
            /// <returns type="Type" />
            if ($object.typeOf(val) === "object") {
                this.messages[id] = val;
                return this.messages;
            }
            else {
                this.labels[id] = val;
                return this.labels;
            }

            return this;
        }
    });
})($resource);

(function ($webform) {
    if (!$webform) {
        $webform = new syn.module();
    }

    $webform.extend({
        User: null,
        Variable: null,

        isPerformanceLog: false,

        dialogResult: null,
        alertResult: null,

        isShowDialog: false,
        isShowAlert: false,

        isProgress: false,
        progressCloseCount: 0,
        progressIntervalID: 0,
        progressText: '',

        notifications: [],

        dialogOptions:
        {
            opacity: 0,
            overlayId: 'simplemodal-overlay',
            containerId: 'simplemodal-container',
            closeHTML: '<div class="absolute font:22 right:24 ti ti-x top:8"></div>',
            minWidth: 320,
            minHeight: 240,
            modal: true,
            escClose: false,
            overlayClose: false,
            persist: true,
            fixed: false,
            isHidden: false,
            scrolling: false,
            onOpen: null,
            // onOpen(dialog)
            // {
            //     dialog.overlay.fadeIn('fast', function ()
            //     {
            //         dialog.data.hide();
            //         dialog.container.fadeIn('fast', function ()
            //         {
            //             dialog.data.slideDown('fast');
            //         });
            //     });
            // },
            onClose(dialog) {
                // dialog.data.fadeOut('fast', function ()
                // {
                //     $.modal.close();
                // });
                syn.$w.isShowDialog = false;
                if (parent.$main) {
                    parent.$main.prop.buttonAction = true;
                }

                if ($.modal.impl.o.isHidden) {
                    $.modal.impl.o.hide();
                }
                else {
                    $.modal.close();
                }

                if ($.modal.impl.o.onCallback) {
                    if (syn.$b.isIE) {
                        window.focus();
                    }

                    $.modal.impl.o.onCallback(syn.$w.dialogResult);
                    syn.$w.dialogResult = null;
                }

                if (syn.$v.focusElement) {
                    syn.$v.focusElement.focus();
                    syn.$v.focusElement = null;
                }
            },
            onShow(dialog) {
            },
            onCallback: null
        },

        alertOptions:
        {
            opacity: 0,
            overlayId: 'alertmodal-overlay',
            containerId: 'alertmodal-container',
            dataId: 'alertmodal-data',
            closeClass: 'alertmodal-close',
            closeHTML: '<a class="modalCloseImg icon-delete" title="Close"></a>',
            minWidth: 380,
            minHeight: 240,
            icon: 1,
            buttonType: 1,
            textHeight: null,
            autoSize: false,
            modal: true,
            escClose: false,
            overlayClose: false,
            persist: true,
            fixed: false,
            isHidden: false,
            onOpen: null,
            onClose(dialog) {
                syn.$w.isShowAlert = false;
                if (parent.$main) {
                    parent.$main.prop.buttonAction = true;
                }

                if ($.alert.impl.o.isHidden) {
                    $.alert.impl.o.hide();
                }
                else {
                    $.alert.close();
                }

                if ($.alert.impl.o.onCallback) {
                    if (syn.$b.isIE) {
                        window.focus();
                    }

                    $.alert.impl.o.onCallback(syn.$w.alertResult);
                    syn.$w.alertResult = null;
                }

                if (syn.$v.focusElement) {
                    syn.$v.focusElement.focus();
                    syn.$v.focusElement = null;
                }
            },
            onShow(dialog) {
            },
            onCallback: null
        },

        channels: [],

        popupOptions: {
            target: null,
            debugOutput: false,
            isCloseHidden: false,
            isCloseButton: true,
            isModal: true,
            baseELID: '',
            title: null,
            projectID: '',
            fileID: '',
            src: '',
            origin: '*',
            scope: 'default_channel',
            notifyActions: [],
            top: 50,
            left: 50,
            width: 640,
            height: 480
        },

        executeChannelMessage(executeName, methodName, parameters, callback, channelID) {
            var frameMessage = syn.$w.channels.find(function (item) { return item.id == (channelID || $this.prop.channelID) });
            if ($object.isNullOrUndefined(frameMessage) == false) {
                frameMessage.channel[executeName]({
                    method: methodName,
                    params: parameters,
                    error(error, message) {
                        syn.$l.eventLog('syn.$w.executeChannelMessage', methodName + ' error: ' + error + ' (' + message + ')', 'Error');

                        if (callback) {
                            callback(error, message);
                        }
                    },
                    success(val) {
                        syn.$l.eventLog('syn.$w.executeChannelMessage', methodName + ' returns: ' + val, 'Debug');

                        if (callback) {
                            callback(null, val);
                        }
                    }
                });
            }
        },

        serviceClientException(title, message, stack) {
            if (syn.$w.domainTransactionLoaderEnd) {
                syn.$w.domainTransactionLoaderEnd();
            }

            if ($.modal) {
                $.modal.close();
            }

            if (syn.$w.alert) {
                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.minWidth = 480;
                alertOptions.minHeight = 285;
                alertOptions.stack = stack;
                alertOptions.autoSize = true;
                syn.$w.alert(message, title, alertOptions);
            }
            else {
                console.log(title, message);
            }

            return false;
        },

        setServiceObjectHeader(jsonObject) {
        },

        serviceClientCallback(jsonObject) {
        },

        serviceClientInterceptor(clientTag, xhr) {
            if (syn.$w.domainTransactionLoaderEnd) {
                syn.$w.domainTransactionLoaderEnd();
            }

            if (clientTag == "ROQKFWKTLFGODZNJFL") {
                syn.$l.eventLog('serviceClientInterceptor', JSON.parse(xhr.responseText).Result.replace(/↓/g, '\n\n'), 'Information');
                return false;
            }
            else {
                try {
                    var response = JSON.parse(xhr.responseText);
                    var acknowledge = response.Acknowledge;
                    var exceptionText = response.ExceptionText;
                    if (acknowledge == 0 && exceptionText.match(/(ERR-20[0-9]{3})/) != null) {
                        var messages = ['ERR-20001', 'ERR-20999'];
                        for (var i = 0; i < messages.length; i++) {
                            var message = messages[i];
                            if (exceptionText.indexOf(message) > -1) {
                                var matched = exceptionText.match(/ERR\-20((.|\n)*?)\./);
                                var parseText = matched == null ? null : matched[0];
                                if (parseText != null && parseText.length > 1) {
                                    syn.$l.eventLog('serviceClientInterceptor', parseText, 'Information');
                                }
                                return false;
                            }
                        }

                        var mod = globalThis[syn.$w.pageScript];
                        if (mod.hook['afterTransaction']) {
                            var addtionalData = {};
                            addtionalData.exceptionText = exceptionText;
                            mod.hook['afterTransaction'](null, response.transaction.functionID, null, addtionalData);
                        }
                        return false;
                    }
                    else if (acknowledge == 0 && exceptionText.match(/(HandStack-20[0-9]{3})/) != null) {
                        var matched = exceptionText.match(/HandStack\-20((.|\n)*?)\./);
                        var parseText = matched == null ? null : matched[0];
                        if (parseText != null && parseText.length > 1) {
                            syn.$l.eventLog('serviceClientInterceptor', parseText, 'Information');
                        }
                        return false;
                    }
                } catch (error) {
                    syn.$l.eventLog('serviceClientInterceptor', error, 'Error');
                }

                return true;
            }
        },

        setServiceClientHeader(xhr) {
            var isContinue = true;
            var evt = window.event || parent.window.event || null;

            if (evt && evt.ctrlKey == true && evt.altKey == true) {
                syn.$w.clientTag = 'ROQKFWKTLFGODZNJFL';
                xhr.setRequestHeader('ClientTag', 'ROQKFWKTLFGODZNJFL');
            }
            else {
                syn.$w.clientTag = 'SGFuZFN0YWNr';
                xhr.setRequestHeader('ClientTag', 'SGFuZFN0YWNr');

                var tabID = syn.$r.query('tabID');
                if (tabID) {
                    var tabInfo = syn.$r.query('tabID').split('$');
                    xhr.setRequestHeader('CategoryID', tabInfo[3]);
                    xhr.setRequestHeader('MenuID', tabInfo[0]);
                }
            }

            if (location.href.toLowerCase().indexOf('/views/ui/') > -1 || location.href.toLowerCase().indexOf('/views/shared/') > -1 || location.href.toLowerCase().indexOf('/sample/') > -1) {
                var member = null;
                if (syn.$r.getCookie(`${syn.$w.cookiePrefixName}.Member`)) {
                    var value = syn.$c.base64Decode(syn.$r.getCookie(`${syn.$w.cookiePrefixName}.Member`));
                    member = JSON.parse(value);
                }

                if ($string.isNullOrEmpty(member) == false) {
                    // xhr.setRequestHeader(`${syn.$w.cookiePrefixName}.Member`, member.UserID);
                }
            }

            return isContinue;
        },

        getFetchClientOptions(options) {
            var result = null;
            var defaultSetting = {
                method: 'GET', // *GET, POST, PUT, DELETE, etc.
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'default', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                headers: {
                    'Content-Type': 'text/plain', // text/plain, application/json, application/x-www-form-urlencoded, multipart/form-data
                },
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer-when-downgrade', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            };

            result = syn.$w.argumentsExtend(defaultSetting, options);
            var evt = window.event || parent.window.event || null;

            if (evt && evt.ctrlKey == true && evt.altKey == true) {
                result.headers['ClientTag'] = 'ROQKFWKTLFGODZNJFL';
            }
            else {
                result.headers['ClientTag'] = 'SGFuZFN0YWNr';

                var tabID = syn.$r.query('tabID');
                if (tabID) {
                    var tabInfo = syn.$r.query('tabID').split('$');
                    result.headers['CategoryID'] = tabInfo[3];
                    result.headers['MenuID'] = tabInfo[0];
                }
            }

            if (location.href.toLowerCase().indexOf('/views/ui/') > -1 || location.href.toLowerCase().indexOf('/views/shared/') > -1 || location.href.toLowerCase().indexOf('/sample/') > -1) {
                var member = null;
                if (syn.$r.getCookie(`${syn.$w.cookiePrefixName}.Member`)) {
                    var value = syn.$c.base64Decode(syn.$r.getCookie(`${syn.$w.cookiePrefixName}.Member`));
                    member = JSON.parse(value);
                }

                if ($string.isNullOrEmpty(member) == false) {
                    // result.headers[`${syn.$w.cookiePrefixName}.Member`] = member.UserID;
                }
            }

            return result;
        },

        serviceClient(url, jsonObject, callBack, async, token) {
            if (!jsonObject) {
                alert('서비스 호출에 필요한 jsonObject가 구성되지 않았습니다.');
                return;
            }

            var jsonString = JSON.stringify(jsonObject);

            var xhr = this.xmlHttp();

            if (syn.Config && syn.Config.IsClientCaching == false) {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + 'noCache=' + (new Date()).getTime();
            }

            if (!async) {
                async = true;
            }

            xhr.open(syn.$w.method, url, async);
            xhr.setRequestHeader('Accept-Language', this.localeID);

            if (this.setServiceClientHeader) {
                if (this.setServiceClientHeader(xhr) == false) {
                    return;
                }
            }

            if (token !== undefined) {
                xhr.setRequestHeader('User-Token', token);
            }

            if (async === false) {
                xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                xhr.setRequestHeader('content-type', 'application/json');
                xhr.send(jsonString);

                return xhr;
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status == 0) {
                        return;
                    }
                    else if (xhr.status !== 200) {
                        if (xhr.responseText.length > 0) {
                            alert(xhr.responseText || xhr.statusText);
                        }
                    }

                    try {
                        if (syn.$w.clientTag && syn.$w.clientTag == 'ROQKFWKTLFGODZNJFL' && syn.$w.serviceClientInterceptor) {
                            if (syn.$w.serviceClientInterceptor(url, xhr) === false) {
                                return;
                            }
                        }
                    }
                    catch (e) {
                        // ajax 요청중에 웹 페이지가 close되었을 경우 return 처리입니다.
                        return;
                    }

                    var contentType = 'text';
                    var errorText = '';
                    var serviceID = '';

                    try {
                        var jsonObject = JSON.parse(xhr.responseText);
                        contentType = jsonObject.ReturnType;
                        serviceID = jsonObject.ServiceID;

                        if (contentType === 'error') {
                            errorText = jsonObject.ExceptionText;
                        }

                        if (contentType === 'warning') {
                            var mod = window[syn.$w.pageScript];
                            if (mod.hook['serviceClientException']) {
                                mod.hook['serviceClientException'](url, jsonObject, xhr);
                            }
                            else {
                                alert('ServiceID : ' + serviceID + '\n' + jsonObject.Result);
                            }
                        }
                        else if (contentType.indexOf('text') > -1 || contentType.indexOf('json') > -1) {
                            if (callBack) {
                                callBack(jsonObject);
                            }
                        }
                        else if (contentType.indexOf('xml') > -1) {
                            if (callBack) {
                                callBack(xhr.responseXML);
                            }
                        }
                        else {
                            if (syn.$w.serviceClientException) {
                                if (syn.$w.serviceClientException(url, jsonObject, xhr) === false) {
                                    alert('ServiceID : ' + serviceID + '\n' + errorText);
                                }
                            }
                            else {
                                alert('ServiceID : ' + serviceID + '\n' + errorText);
                            }

                            var mod = window[syn.$w.pageScript];
                            if (mod.serviceClientException) {
                                mod.serviceClientException(url, jsonObject, xhr);
                            }
                        }
                    }
                    catch (e) {
                    }

                    mod = null;
                    contentType = null;
                    errorText = null;
                    serviceID = null;
                    pageScript = null;
                    url = null;
                    jsonObject = null
                    xhr = null;
                    return;
                }
            }
            xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
            xhr.setRequestHeader('content-type', 'application/json');
            xhr.send(jsonString);
        },

        getActiveTabInfo() {
            var tabInfo = null;
            if (parent.$main) {
                tabInfo = parent.$main.method.getActiveTab();
            }

            return tabInfo;
        },

        getCurrentTabInfo() {
            var tabObject = null;

            var tabID = syn.$r.query('tabID');
            if (tabID) {
                var tabInfo = tabID.split('$');
                tabObject =
                {
                    tabID: tabID,
                    projectID: tabInfo[0],
                    fileID: tabInfo[1],
                    menuID: tabInfo[2],
                    parentMenuID: tabInfo[3]
                }
            }

            return tabObject;
        },

        getTabInfo(projectID, fileID) {
            var menuObject = null;
            if (parent.$main) {
                menuObject = parent.$main.method.getTabInfo(projectID, fileID);
            }

            return menuObject;
        },

        setTabTitleText(val) {
            var tabID = syn.$r.query('tabID');
            if (tabID && val) {
                if (parent.$main) {
                    var tabHead = parent.syn.$l.get(tabID);
                    if (tabHead) {
                        tabHead.querySelector('span').textContent = val;
                    }
                }
            }
        },

        setTabContentHeight: async function (projectID, fileID) {
            var tabID = null;
            if (parent.$main) {
                if (projectID && fileID) {
                    tabID = parent.$main.method.getActiveTabID(projectID, fileID);
                }
                else {
                    tabID = syn.$r.query('tabID');
                }

                if (tabID) {
                    var tabFrame = parent.syn.$l.get(tabID + '$i');
                    if (tabFrame) {
                        tabFrame.height = '100%';
                        var scrollHeight = 0;

                        var checkDocumentHeight = function () {
                            var result = 0;
                            var pageWrapper = document.querySelector('.page-wrapper');
                            if (pageWrapper) {
                                result = pageWrapper.scrollHeight;
                            }
                            else {
                                result = document.body.scrollHeight;
                            }

                            return result;
                        };

                        while (scrollHeight == 0) {
                            scrollHeight = checkDocumentHeight();
                            await syn.$w.sleep(25);
                        }

                        if (tabFrame.height != scrollHeight) {
                            tabFrame.height = scrollHeight;
                            tabFrame.style.height = `${scrollHeight}px`;
                        }

                        var frameHeight = syn.$d.getSize(parent.document.body).height - (56 + 57 + 20);
                        var uiHeight = syn.$d.getSize(tabFrame).height;
                        if (frameHeight > uiHeight) {
                            tabFrame.style.height = `${frameHeight}px`;
                        }
                    }
                }
            }
        },

        getTabContentHeight(projectID, fileID) {
            var tabID = null;
            if (parent.$main) {
                if (projectID && fileID) {
                    tabID = parent.$main.method.getActiveTabID(projectID, fileID);
                }
                else {
                    tabID = syn.$r.query('tabID');
                }
            }
            else {
                return;
            }

            try {
                var result = 0;
                result = $(parent.syn.$l.get(tabID + '$i')).height();
                var documentHeight = $(document.body).height();

                if (result < documentHeight) {
                    result = documentHeight;
                }

                return result;
            } catch (error) {
                syn.$l.eventLog('getTabContentHeight', error, 'Error');
            }
        },

        triggerUICommand(projectID, fileID, func, val) {
            if (parent.$main) {
                var tabID = parent.$main.method.getActiveTabID(projectID, fileID);
                if (tabID) {
                    parent.$main.method.focusTabUI(tabID);
                    var pageWindow = parent.$main.method.getActiveTabContent(tabID);
                    if (pageWindow && pageWindow.syn) {
                        var pageScript = pageWindow[pageWindow.syn.$w.pageScript];
                        var targetFunction = pageScript[func];

                        if (targetFunction) {
                            targetFunction(val);
                        }
                    }
                }
                else {
                    syn.$w.addTabUI(projectID, fileID, function (tabID) {
                        if (parent && parent.$main) {
                            var tabLI = parent.document.querySelector('ul[class="mainTabUI"] > li[id="' + tabID + '"]');
                            if (tabLI) {
                                parent.syn.$m.setStyle(tabLI, 'display', 'block');
                            }
                        }

                        var tryCount = 0;
                        var readyCheckID = setInterval(function () {
                            if (tryCount > 10) {
                                clearInterval(readyCheckID);
                                return;
                            }

                            if (tabID) {
                                var pageWindow = parent.$main.method.getActiveTabContent(tabID);
                                if (pageWindow && pageWindow.syn) {
                                    clearInterval(readyCheckID);

                                    var pageWebform = pageWindow.syn.$w;
                                    var pageScript = pageWindow[pageWebform.pageScript];
                                    var remainingTriggerIntervalID = setInterval(function () {
                                        clearInterval(remainingTriggerIntervalID);
                                        if (pageWebform.isPageLoad == true) {
                                            var targetFunction = pageScript[func];

                                            if (targetFunction) {
                                                targetFunction(val);
                                            }
                                        }
                                    }, 250);
                                }
                            }
                        }, 600);

                        return false;
                    });
                }
            }
        },

        setUIStorage(projectID, fileID, storageKey, val) {
            if (parent.$main) {
                var menuID = '{0}${1}'.format(projectID, fileID);
                if (val) {
                    syn.$w.setStorage(menuID + '~' + storageKey, val);

                    var tabID = parent.$main.method.getActiveTabID(projectID, fileID);
                    var pageWindow = parent.$main.method.getActiveTabContent(tabID);;
                    if (pageWindow && pageWindow.syn) {
                        var pageScript = pageWindow[pageWindow.syn.$w.pageScript];
                        parent.$main.method.layout_UIStoregeChanging(pageScript, tabID, storageKey);
                    }
                }
                else {
                    syn.$w.removeStorage(menuID + '~' + storageKey);
                }
            }
        },

        getUIStorage(storageKey) {
            if (parent.$main) {
                var tabInfo = syn.$w.getCurrentTabInfo();
                var menuID = '{0}${1}'.format(tabInfo.projectID, tabInfo.fileID);

                return syn.$w.getStorage(menuID + '~' + storageKey);
            }
        },

        domainTransactionLoaderStart() {
            syn.$w.domainTransactionLoaderEnd();
        },

        domainTransactionLoaderEnd() {
            syn.$w.closeProgress();
        },

        transactionLoadOptions(loadOptions) {
            try {
                if (location.pathname.startsWith((syn.Config.TenantAppRequestPath ? `/${syn.Config.TenantAppRequestPath}/` : '/app/')) == true) {
                    var paths = location.pathname.split('/');
                    loadOptions['work-id'] = paths[2];
                    loadOptions['app-id'] = paths[3];
                }
                else if (syn.$r.query('app-id') == true) {
                    loadOptions['app-id'] = syn.$r.query('app-id');
                    if (syn.$r.query('work-id') == true) {
                        loadOptions['work-id'] = syn.$r.query('work-id');
                    }
                }
                else if ($this && $this.prop && $this.prop.selectedAppID) {
                    loadOptions['app-id'] = $this.prop.selectedAppID;
                    if ($this && $this.prop && $this.prop.selectedUserWorkID) {
                        loadOptions['work-id'] = $this.prop.selectedUserWorkID;
                    }
                }
            } catch (error) {
                syn.$l.eventLog('transactionLoadOptions', error, 'Error');
            }
        },

        progressMessage(val) {
            val = val || '';
            if (syn.$w.isProgress == true) {
                syn.$w.closeProgress();
            }

            if (parent.$main) {
                parent.$main.prop.buttonAction = false;
            }

            syn.$w.progressIntervalID = setInterval(function () {
                if (syn.$w.progressCloseCount >= 120) {
                    clearInterval(syn.$w.progressIntervalID);
                }

                syn.$w.progressCloseCount++;
            }, 1000);
            syn.$w.progressText = val;

            var divProgressBar = syn.$m.create({
                id: 'divProgressBar',
                tag: 'div',
                className: 'progress fixed top:0 border-radius:0 h:2! z:10000'
            });
            divProgressBar.innerHTML = '<div class="progress-bar progress-bar-indeterminate bg-primary"></div><div class="progress-backdrop"></div>';
            syn.$m.appendChild(document.body, divProgressBar);

            syn.$w.isProgress = true;

            if (parent.$main) {
                var tabInfo = syn.$w.getCurrentTabInfo();

                if (tabInfo) {
                    parent.$main.method.setStatusMessage(tabInfo.tabID, val);
                }
            }
        },

        closeProgress() {
            var divProgressBar = syn.$l.get('divProgressBar');
            if (divProgressBar) {
                syn.$m.remove(divProgressBar);
            }

            clearInterval(syn.$w.progressIntervalID);

            syn.$w.progressIntervalID = null;
            syn.$w.progressText = '';
            syn.$w.isProgress = false;

            if (parent.$main) {
                parent.$main.prop.buttonAction = true;
            }
        },

        statusMessage(val) {
            if (parent.$mainframe) {
                var tabInfo = syn.$w.getCurrentTabInfo();
                if (tabInfo) {
                    parent.$layout.method.setStatusMessage(tabInfo.tabID, val);
                }
                else {
                    syn.$l.eventLog('statusMessage', val, 'Information');
                }
            }

            if (window == top || syn.$w.pageScript == '$mainframe') {
                var tabInfo = syn.$w.getCurrentTabInfo();
                if (tabInfo) {
                    parent.$layout.method.setStatusMessage(tabInfo.tabID, val);
                }
                else {
                    syn.$l.eventLog('statusMessage', val, 'Information');
                }
            }
            else {
                if (window.parent) {
                    window.parent.syn.$w.statusMessage(val);
                }
            }
        },

        notify(type, message, title, timeout) {
            if (window == top || syn.$w.pageScript == '$main') {
                if (notifier && $string.isNullOrEmpty(message) == false) {
                    type = type || '';
                    title = title || '';

                    var notifyType = 'default';
                    var iconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWV4Y2xhbWF0aW9uLW1hcmsiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSI+PC9wYXRoPjxwYXRoIGQ9Ik0xMiAxOXYuMDEiPjwvcGF0aD48cGF0aCBkPSJNMTIgMTV2LTEwIj48L3BhdGg+PC9zdmc+';
                    switch (type) {
                        case 'debug':
                            timeout = timeout || 3000;
                            notifyType = 'success';
                            iconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWJ1ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIj48L3BhdGg+PHBhdGggZD0iTTkgOXYtMWEzIDMgMCAwIDEgNiAwdjEiPjwvcGF0aD48cGF0aCBkPSJNOCA5aDhhNiA2IDAgMCAxIDEgM3YzYTUgNSAwIDAgMSAtMTAgMHYtM2E2IDYgMCAwIDEgMSAtMyI+PC9wYXRoPjxwYXRoIGQ9Ik0zIDEzbDQgMCI+PC9wYXRoPjxwYXRoIGQ9Ik0xNyAxM2w0IDAiPjwvcGF0aD48cGF0aCBkPSJNMTIgMjBsMCAtNiI+PC9wYXRoPjxwYXRoIGQ9Ik00IDE5bDMuMzUgLTIiPjwvcGF0aD48cGF0aCBkPSJNMjAgMTlsLTMuMzUgLTIiPjwvcGF0aD48cGF0aCBkPSJNNCA3bDMuNzUgMi40Ij48L3BhdGg+PHBhdGggZD0iTTIwIDdsLTMuNzUgMi40Ij48L3BhdGg+PC9zdmc+';
                            break;
                        case 'information':
                            timeout = timeout || 3000;
                            notifyType = 'info';
                            iconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWluZm8tY2lyY2xlIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBzdHJva2U9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiPjwvcGF0aD48cGF0aCBkPSJNMyAxMmE5IDkgMCAxIDAgMTggMGE5IDkgMCAwIDAgLTE4IDAiPjwvcGF0aD48cGF0aCBkPSJNMTIgOWguMDEiPjwvcGF0aD48cGF0aCBkPSJNMTEgMTJoMXY0aDEiPjwvcGF0aD48L3N2Zz4=';
                            break;
                        case 'success':
                            timeout = timeout || 3000;
                            notifyType = 'info';
                            iconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWNpcmNsZS1jaGVjayIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIj48L3BhdGg+PHBhdGggZD0iTTEyIDEybS05IDBhOSA5IDAgMSAwIDE4IDBhOSA5IDAgMSAwIC0xOCAwIj48L3BhdGg+PHBhdGggZD0iTTkgMTJsMiAybDQgLTQiPjwvcGF0aD48L3N2Zz4=';
                            break;
                        case 'warning':
                            timeout = timeout || 6000;
                            notifyType = 'warning';
                            iconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWFsZXJ0LWNpcmNsZSIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIj48L3BhdGg+PHBhdGggZD0iTTMgMTJhOSA5IDAgMSAwIDE4IDBhOSA5IDAgMCAwIC0xOCAwIj48L3BhdGg+PHBhdGggZD0iTTEyIDh2NCI+PC9wYXRoPjxwYXRoIGQ9Ik0xMiAxNmguMDEiPjwvcGF0aD48L3N2Zz4=';
                            break;
                        case 'error':
                            timeout = timeout || 6000;
                            notifyType = 'danger';
                            iconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWJlbGwteCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIj48L3BhdGg+PHBhdGggZD0iTTEzIDE3aC05YTQgNCAwIDAgMCAyIC0zdi0zYTcgNyAwIDAgMSA0IC02YTIgMiAwIDEgMSA0IDBhNyA3IDAgMCAxIDQgNnYyIj48L3BhdGg+PHBhdGggZD0iTTkgMTd2MWEzIDMgMCAwIDAgNC4xOTQgMi43NTMiPjwvcGF0aD48cGF0aCBkPSJNMjIgMjJsLTUgLTUiPjwvcGF0aD48cGF0aCBkPSJNMTcgMjJsNSAtNSI+PC9wYXRoPjwvc3ZnPg==';
                            break;
                        case 'fatal':
                            timeout = timeout || 6000;
                            notifyType = 'danger';
                            iconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWJlbGwtcmluZ2luZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIj48L3BhdGg+PHBhdGggZD0iTTEwIDVhMiAyIDAgMCAxIDQgMGE3IDcgMCAwIDEgNCA2djNhNCA0IDAgMCAwIDIgM2gtMTZhNCA0IDAgMCAwIDIgLTN2LTNhNyA3IDAgMCAxIDQgLTYiPjwvcGF0aD48cGF0aCBkPSJNOSAxN3YxYTMgMyAwIDAgMCA2IDB2LTEiPjwvcGF0aD48cGF0aCBkPSJNMjEgNi43MjdhMTEuMDUgMTEuMDUgMCAwIDAgLTIuNzk0IC0zLjcyNyI+PC9wYXRoPjxwYXRoIGQ9Ik0zIDYuNzI3YTExLjA1IDExLjA1IDAgMCAxIDIuNzkyIC0zLjcyNyI+PC9wYXRoPjwvc3ZnPg==';
                            break;
                        default:
                            return;
                    }
                    var notifierID = notifier.show(title, message, notifyType, iconDataUri, timeout);
                    syn.$w.notifications.push(notifierID);
                    if (syn.$w.notifications.length > 7) {
                        var firstNotifierID = syn.$w.notifications[0];
                        notifier.hide(firstNotifierID);
                        syn.$w.notifications.shift();
                    }
                }
            }
            else {
                if (window.parent) {
                    window.parent.syn.$w.notify(type, message, title, timeout);
                }
            }
        },

        addTabUI(projectID, fileID, callback) {
            if (parent.$main) {
                var tabID = syn.$r.query('tabID');
                if (tabID != '') {
                    var menu_node = null;
                    var menu_nodes = parent.$main.prop.menus.filter(function (item) { return item.projectID == projectID && item.fileID == fileID });
                    if (menu_nodes.length > 0) {
                        menu_node = menu_nodes[0];
                    }
                    else {
                        syn.$w.alert('메뉴 정보가 올바르지 않습니다', '정보');
                        return;
                    }

                    var url = '';

                    if (menu_node.url) {
                        url = menu_node.url;
                    }
                    else {
                        url = './view/{0}/{1}.html'.format(menu_node.projectID, menu_node.fileID);
                    }

                    parent.$main.method.addTabUI(menu_node);
                }
            }
        },

        addUIButton() {
            /*
            actionButtons: [{
                command: 'search',
                icon: 'search',
                text: '화면검색',
                class: 'btn-red', // https://tabler.io/docs/components/buttons
                disabled: false,
                hidden: false,
                action(evt) {
                    debugger;
                }
            }]
            */
            var tabID = syn.$r.query('tabID');
            if (tabID) {
                if (parent.$main) {
                    var actionButtons = arguments.length > 0 && $object.isArray(arguments[0]) == true ? arguments[0] : $this.config.actionButtons;
                    var tabEl = parent.syn.$l.querySelector(`[data-tab-id="${tabID}"]`);
                    if (tabEl) {
                        if (actionButtons && actionButtons.length > 0) {
                            tabEl.defaultActionButtons = JSON.parse(JSON.stringify(actionButtons));
                            parent.$main.method.refreshUIButtons(tabID, actionButtons);
                        }
                    }
                }
            }
        },

        updateUIButton() {
            /*
            actionButtons: [{
                command: 'search',
                icon: 'search',
                text: '화면검색',
                class: 'btn-red',
                disabled: false,
                hidden: false
            }]
            */
            var tabID = syn.$r.query('tabID');
            if (tabID) {
                if (parent.$main) {
                    var tabEl = parent.syn.$l.querySelector(`[data-tab-id="${tabID}"]`);
                    if (tabEl) {
                        var refreshButtons = function (actionButtons) {
                            if (actionButtons && actionButtons.length > 0) {
                                var existButtons = tabEl.actionButtons;
                                if (existButtons && existButtons.length > 0) {
                                    for (var i = 0; i < actionButtons.length; i++) {
                                        var updateButton = actionButtons[i];
                                        var existButton = existButtons.find(function (item) { return item.command == updateButton.command });

                                        if (existButton) {
                                            if ($string.isNullOrEmpty(updateButton.icon) == false) {
                                                existButton.icon = updateButton.icon;
                                            }

                                            if ($string.isNullOrEmpty(updateButton.text) == false) {
                                                existButton.text = updateButton.text;
                                            }

                                            if ($string.isNullOrEmpty(updateButton.class) == false) {
                                                existButton.class = updateButton.class;
                                            }

                                            if ($string.isNullOrEmpty(updateButton.disabled) == false) {
                                                existButton.disabled = updateButton.disabled;
                                            }

                                            if ($string.isNullOrEmpty(updateButton.hidden) == false) {
                                                existButton.hidden = updateButton.hidden;
                                            }
                                        }
                                    }

                                }
                            }

                            parent.$main.method.refreshUIButtons(tabID);
                        }

                        refreshButtons(tabEl.defaultActionButtons);
                        if (arguments.length > 0) {
                            refreshButtons(arguments[0]);
                        }
                    }
                }
            }
        },

        closeTabID(tabID) {
            if (parent.$main) {
                parent.$main.method.closeTabID(tabID);
            }
        },

        closeTabUI(projectID, fileID) {
            if (parent.$main) {
                var tabID = parent.$main.method.getActiveTabID(projectID, fileID);
                parent.$main.method.closeTabID(tabID);
            }
        },

        isTabUI(projectID, fileID) {
            var result = false;
            if (parent.$main) {
                var tabID = parent.$main.method.getActiveTabID(projectID, fileID);
                if (tabID) {
                    result = true;
                }
            }

            return result;
        },

        alert(text, caption, options, callback) {
            var el = document.createElement('div');
            var dl = syn.$m.append(el, 'dl');
            var dt = syn.$m.append(dl, 'dt');
            var dd = syn.$m.append(dl, 'dd');
            var elCaption = syn.$m.append(dd, 'div');
            var elText = syn.$m.append(dd, 'p');

            if (options && options.autoSize == true) {
                var textSize = syn.$d.measureSize(options.stack);

                if (textSize) {
                    var textWidth = parseInt(textSize.width.replace('px', '')) + 35;
                    var textHeight = parseInt(textSize.height.replace('px', ''));

                    if (textWidth > 800) {
                        textWidth = 800;
                    }

                    if (textWidth > options.minWidth) {
                        options.minWidth = textWidth;
                    }

                    if (textHeight > (options.minHeight - 200)) {
                        if (textHeight > 600) {
                            textHeight = 600;
                        }
                        options.minHeight = textHeight + 200;
                        options.textHeight = textHeight;
                    }

                    dd.style.width = `calc(${options.minWidth}px - 146px)`;
                }
            }

            if (options && options.stack) {
                var elStack = syn.$m.append(el, 'div');
                var textHeight = options.textHeight ? options.textHeight + 'px' : '100%';
                syn.$m.addCssText(elStack, 'margin: 15px; height: {0}; overflow: auto; color: #000; background-color: #eee;'.format(textHeight));
                elStack.innerHTML = options.stack.replace(/(\n|\r\n)/gm, '<br />');
            }

            var elButtons = syn.$m.append(el, 'div');
            var elIcon = syn.$m.append(dt, 'span');

            syn.$m.addCssText(elIcon, 'color: #434343; font-size: 72px;');
            syn.$m.addClass(elButtons, 'btn-area');

            syn.$m.setStyle(el, 'display', 'none');

            elText.innerHTML = text.replace(/(\n|\r\n)/gm, '<br />');
            syn.$m.addClass(elCaption, 'strong');
            syn.$m.addClass(elCaption, 'f:18');
            elCaption.innerText = caption ? caption : '';
            if (options) {
                options.close = false;
            }
            else {
                options = $object.clone(syn.$w.alertOptions);
                // options.icon = 'default'; // debug, information, success, question, error, fatal
                // options.buttonType = '1'; // 1:OK, 2:OKCancel, 3:YesNo, 4:YesNoCancel (default:1)
                options.close = false;
            }

            if (options.icon) {
                switch (options.icon) {
                    case 'debug':
                        syn.$m.addClass(elIcon, 'ti ti-bug');
                        break;
                    case 'information':
                        syn.$m.addClass(elIcon, 'ti ti-info-circle');
                        break;
                    case 'success':
                        syn.$m.addClass(elIcon, 'ti ti-circle-check');
                        break;
                    case 'question':
                        syn.$m.addClass(elIcon, 'ti ti-help-circle');
                        break;
                    case 'error':
                        syn.$m.addClass(elIcon, 'ti ti-bell-x');
                        break;
                    case 'fatal':
                        syn.$m.addClass(elIcon, 'ti ti-urgent');
                        break;
                    default:
                        syn.$m.addClass(elIcon, 'ti ti-clipboard-text');
                        break;
                }
            }

            if (options.buttonType) {
                var button1 = null;
                var button2 = null;
                var button3 = null;
                switch (options.buttonType) {
                    case '1': // 1:OK
                        button1 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button1.value = $resource.labels.Confirm ? $resource.labels.Confirm : '확인';
                        button1.data = 'OK';
                        break;
                    case '2': // 2:OKCancel
                        button1 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button1.value = $resource.labels.Confirm ? $resource.labels.Confirm : '확인';
                        button1.data = 'OK';

                        button2 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button2.value = $resource.labels.Cancel ? $resource.labels.Cancel : '취소';
                        button2.data = 'Cancel';
                        break;
                    case '3': // 3:YesNo
                        button1 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button1.value = $resource.labels.Yes ? $resource.labels.Yes : '예';
                        button1.data = 'Yes';

                        button2 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button2.value = $resource.labels.No ? $resource.labels.No : '아니오';
                        button2.data = 'No';
                        break;
                    case '4': // 4:YesNoCancel
                        button1 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button1.value = $resource.labels.Yes ? $resource.labels.Yes : '예';
                        button1.data = 'Yes';

                        button2 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button2.value = $resource.labels.No ? $resource.labels.No : '아니오';
                        button2.data = 'No';

                        button3 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button3.value = $resource.labels.Cancel ? $resource.labels.Cancel : '취소';
                        button3.data = 'Cancel';
                        break;
                    default: // 1:OK
                        button1 = $('<input type="button"/>').appendTo(elButtons)[0];
                        button1.value = $resource.labels.Confirm ? $resource.labels.Confirm : '확인';
                        button1.data = 'OK';
                        break;
                }

                var buttonCallback = function (evt) {
                    var el = evt.target || evt;
                    syn.$w.closeAlertDialog(el.data);
                };

                syn.$m.addClass(button1, 'btn');
                syn.$m.addClass(button1, 'btn-primary');
                syn.$l.addEvent(button1, 'click', buttonCallback);

                if (button2) {
                    syn.$m.addClass(button2, 'btn');
                    syn.$m.addClass(button2, 'btn-default');
                    syn.$l.addEvent(button2, 'click', buttonCallback);
                }

                if (button3) {
                    syn.$m.addClass(button3, 'btn');
                    syn.$m.addClass(button3, 'btn-default');
                    syn.$l.addEvent(button3, 'click', buttonCallback);
                }
            }

            if (options) {
                if (callback) {
                    options.onCallback = callback;
                }
                $.alert(el, options);
            }
            else {
                if (callback) {
                    syn.$w.alertOptions.onCallback = callback;
                }
                $.alert(el, syn.$w.alertOptions);
            }

            if (parent.$main) {
                syn.$w.isShowAlert = true;
                parent.$main.prop.buttonAction = false;
            }
        },

        showDialog(el, options, callback) {
            var dialogOptions = $object.clone(syn.$w.dialogOptions);
            options = syn.$w.argumentsExtend(dialogOptions, options);

            if (options) {
                if (callback) {
                    options.onCallback = callback;
                }
                $.modal(el, options);
            }
            else {
                if (callback) {
                    syn.$w.dialogOptions.onCallback = callback;
                }
                $.modal(el, syn.$w.dialogOptions);
            }

            if (parent.$main) {
                syn.$w.isShowDialog = true;
                parent.$main.prop.buttonAction = false;
            }

            var modelEL = document.getElementById('simplemodal-container');
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            function elementDrag(evt) {
                evt = evt || window.event;
                evt.preventDefault();
                pos1 = pos3 - evt.clientX;
                pos2 = pos4 - evt.clientY;
                pos3 = evt.clientX;
                pos4 = evt.clientY;
                modelEL.style.top = (modelEL.offsetTop - pos2) + 'px';
                modelEL.style.left = (modelEL.offsetLeft - pos1) + 'px';
            }

            function closeDragElement() {
                syn.$l.removeEvent(document, 'mouseup', closeDragElement);
                syn.$l.removeEvent(document, 'mousemove', elementDrag);
            }

            function dragMouseDown(evt) {
                evt = evt || window.event;
                evt.preventDefault();
                pos3 = evt.clientX;
                pos4 = evt.clientY;

                syn.$l.addEvent(document, 'mouseup', closeDragElement);
                syn.$l.addEvent(document, 'mousemove', elementDrag);
            }

            var modelHeader = syn.$l.querySelector('#simplemodal-container .simplemodal-data h3');
            if (modelHeader) {
                syn.$l.addEvent(modelHeader, 'mousedown', dragMouseDown);
            } else {
                syn.$l.addEvent(modelEL, 'mousedown', dragMouseDown);
            }
        },

        showUIDialog(src, options, callback) {
            var el = document.createElement('div');
            syn.$m.addClass(el, 'simplemodal-data');
            syn.$m.setStyle(el, 'display', 'none');

            var h3 = syn.$m.append(el, 'h3');
            syn.$m.addClass(h3, 'mt-0');
            syn.$m.addClass(h3, 'mb-0');
            h3.innerText = options.caption ? options.caption : src;

            var iframe = syn.$m.append(el, 'iframe');
            syn.$m.setStyle(iframe, 'border', '0px');
            iframe.setAttribute('name', 'syn-repository');

            options.onShow = function (dialog) {
                iframe.setAttribute('src', src);
            }

            if (options.scrolling) {
                iframe.scrolling = 'yes';
            }
            else {
                iframe.scrolling = 'no';
            }

            if (options) {
                options.persist = false;
                if (callback) {
                    options.onCallback = callback;
                }

                iframe.width = '100%';
                iframe.height = (options.minHeight - 40).toString();

                $.modal(el, options);
            }
            else {
                options.persist = false;
                if (callback) {
                    syn.$w.dialogOptions.onCallback = callback;
                }

                iframe.width = '100%';
                iframe.height = '320';

                $.modal(el, syn.$w.dialogOptions);
            }

            if (parent.$main) {
                syn.$w.isShowDialog = true;
                parent.$main.prop.buttonAction = false;
            }

            var modelEL = document.getElementById('simplemodal-container');
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            function elementDrag(evt) {
                evt = evt || window.event;
                evt.preventDefault();
                pos1 = pos3 - evt.clientX;
                pos2 = pos4 - evt.clientY;
                pos3 = evt.clientX;
                pos4 = evt.clientY;
                modelEL.style.top = (modelEL.offsetTop - pos2) + 'px';
                modelEL.style.left = (modelEL.offsetLeft - pos1) + 'px';
            }

            function closeDragElement() {
                syn.$l.removeEvent(document, 'mouseup', closeDragElement);
                syn.$l.removeEvent(document, 'mousemove', elementDrag);
            }

            function dragMouseDown(evt) {
                evt = evt || window.event;
                evt.preventDefault();
                pos3 = evt.clientX;
                pos4 = evt.clientY;

                syn.$l.addEvent(document, 'mouseup', closeDragElement);
                syn.$l.addEvent(document, 'mousemove', elementDrag);
            }

            var modelHeader = syn.$l.querySelector('#simplemodal-container .simplemodal-data h3');
            if (modelHeader) {
                syn.$l.addEvent(modelHeader, 'mousedown', dragMouseDown);
            } else {
                syn.$l.addEvent(modelEL, 'mousedown', dragMouseDown);
            }
        },

        windowOpen(elID, options, callback) {
            if (options.isCloseHidden == true) {
                $.fn.WM_close = syn.$w.windowHide;
            }

            if (syn.$l.get(elID)) {
                syn.$w.alert(elID + '는 사용 중인 팝업 ID 입니다');
                return;
            }

            if (window == top || window.parent.syn.$w.pageScript == '$main') {
                var popupOptions = syn.$w.argumentsExtend(syn.$w.popupOptions, options);

                if ($object.isNullOrUndefined(popupOptions.left) == true || popupOptions.left == 50) {
                    popupOptions.left = (document.body.offsetWidth / 2) - (popupOptions.width / 2);
                }

                if ($object.isNullOrUndefined(popupOptions.top) == true || popupOptions.top == 50) {
                    popupOptions.top = (document.body.offsetHeight / 2) - (popupOptions.height / 2);
                }

                if (popupOptions.projectID && popupOptions.fileID && (popupOptions.src == null || popupOptions.src == undefined || popupOptions.src.trim() == '')) {
                    if (parent.$main && parent.$main.prop.search_nodes) {
                        var menu_node = parent.$main.prop.search_nodes.find(function (item) { return (item.ASSEMBLYNAME == popupOptions.projectID && item.CLASSNAME == popupOptions.fileID) });
                        if (menu_node) {
                            var url = '';
                            if (menu_node.PROGRAMPATH) {
                                url = menu_node.PROGRAMPATH;
                            }
                            else {
                                if (menu_node.CLASSNAME.indexOf('|') > -1) {
                                    var menuCommand = menu_node.CLASSNAME.split('|')[0];
                                    var menuPath = menu_node.CLASSNAME.split('|')[1];
                                    if (menuCommand == 'URL') {
                                        url = menuPath;
                                    }
                                }
                                else {
                                    url = '/views/{0}/{1}.html'.format(menu_node.ASSEMBLYNAME, menu_node.CLASSNAME);
                                }
                            }

                            popupOptions.title = $object.isNullOrUndefined(popupOptions.title) == true ? menu_node.PROGRAMNAME : popupOptions.title;
                            popupOptions.src = url;
                        }
                    }
                }

                if (popupOptions.src == null || popupOptions.src == undefined || popupOptions.src.trim() == '') {
                    syn.$l.eventLog('syn.domain.windowOpen', '{0}메뉴ID 또는 URL 속성 확인 필요'.format(popupOptions.fileID ? popupOptions.fileID : ''), 'Warning');
                    return;
                }

                if (popupOptions.notifyActions.length == 0) {
                    syn.$l.eventLog('syn.domain.windowOpen', 'notifyActions 속성 확인 필요', 'Warning');
                    return;
                }

                var channelID = popupOptions.channelID ? popupOptions.channelID : null;
                popupOptions.title = $object.isNullOrUndefined(popupOptions.title) == false ? popupOptions.title : elID;

                if (popupOptions.title === '') {
                    popupOptions.title = ' ';
                }

                syn.$r.path = popupOptions.src;
                syn.$r.params = [];
                syn.$r.params['baseELID'] = (popupOptions.baseELID ? popupOptions.baseELID : elID);
                if (channelID) {
                    syn.$r.params['channelID'] = channelID;
                }

                var options = syn.$r.toUrlObject(popupOptions.src);
                for (var prop in options) {
                    syn.$r.params[prop] = options[prop];
                }

                if ($string.isNullOrEmpty(syn.$w.User.WorkCompanyNo) == false && syn.$r.params.hasOwnProperty('companyNo') == false) {
                    syn.$r.params['companyNo'] = syn.$w.User.WorkCompanyNo;
                }

                var documentAdjustHeight = (syn.$d.getSize(document.body).height - 20);
                if (documentAdjustHeight > 0 && popupOptions.height > documentAdjustHeight) {
                    popupOptions.height = documentAdjustHeight;
                }

                popupOptions.src = syn.$r.url();
                var windowHandle = $.WM_open(elID, popupOptions.src, popupOptions.target, popupOptions);
                if (options.isCloseButton == false) {
                    windowHandle.find('.horizbuts').hide();
                }

                windowHandle.find('.closebut').addClass('ti ti-x f:22').css('background', 'transparent');

                if (windowHandle) {
                    var windowOffset = windowHandle.offset();
                    if (windowOffset.top < 0) {
                        windowHandle.offset({ top: 0 });
                    }

                    if (windowOffset.left < 0) {
                        windowHandle.offset({ left: 0 });
                    }

                    windowHandle.attr('channelID', channelID ? channelID : '');
                    windowHandle.attr('baseELID', popupOptions.baseELID);
                    if (popupOptions.isModal == true) {
                        var overlayEL = document.createElement('div');
                        var overlayZIndex = windowHandle.css('zIndex');
                        windowHandle.attr('overlayZIndex', overlayZIndex);
                        overlayEL.id = elID + '_overlay';
                        syn.$m.setStyle(overlayEL, 'z-index', (overlayZIndex - 1));
                        syn.$m.addClass(overlayEL, 'modal_overlay');
                        syn.$m.appendChild(document.body, overlayEL);
                    }

                    var contentWindow = windowHandle.find('iframe')[0].contentWindow;
                    syn.$l.addEvent(contentWindow, 'load', function () {
                        if (callback) {
                            callback(elID);
                        }
                    });

                    if (channelID) {
                        var frameMessage = {
                            elID: elID,
                            windowHandle: windowHandle,
                            id: channelID,
                            channel: syn.$n.rooms.connect({
                                debugOutput: popupOptions.debugOutput,
                                window: contentWindow,
                                origin: popupOptions.origin,
                                scope: channelID
                            })
                        };

                        for (var i = 0; i < popupOptions.notifyActions.length; i++) {
                            var notifyAction = popupOptions.notifyActions[i];
                            frameMessage.channel.bind(notifyAction.actionID, notifyAction.handler);
                        }

                        syn.$w.channels.push(frameMessage);
                    }
                }
            }
            else {
                if (window.parent) {
                    setTimeout(function () {
                        window.parent.syn.$w.windowOpen(elID, options, callback);
                    });
                }
            }
        },

        windowShow(elID) {
            var windowForm = syn.$l.get(elID);
            if (windowForm) {
                syn.$m.setStyle(windowForm, 'display', 'block');
            }

            $('#' + elID).WM_raise();
        },

        windowHide(elID) {
            if (elID) {
                if (syn.$l.get(elID)) {
                    syn.$m.setStyle(syn.$l.get(elID), 'display', 'none');
                }
            }
            else {
                if (this.filter('.window').length > 0) {
                    syn.$m.setStyle(this.filter('.window')[0], 'display', 'none');
                }
            }

            $('#' + elID).WM_raise();
        },

        windowClose(elID) {
            if (window == top || window.parent.syn.$w.pageScript == '$main') {
                var channels = syn.$w.channels.filter(function (item) { return item.elID == elID });
                if (channels.length > 0) {
                    var iframeChannel = channels[0];
                    var windowHandle = iframeChannel.windowHandle;
                    var channel = iframeChannel.channel;
                    channel.destroy();

                    var baseELID = windowHandle.attr('baseELID');
                    if (baseELID != '') {
                        $('#' + baseELID).closest('.window').WM_raise();
                    }
                    var windowOverlayID = windowHandle.attr('id') + '_overlay';
                    $('#' + windowOverlayID).remove();
                    windowHandle.WM_close();
                }
            }
            else {
                if (window.parent) {
                    window.parent.syn.$w.windowClose(elID);
                }
            }
        },

        closeDialog(result) {
            syn.$w.dialogResult = result;
            $.modal.close();
        },

        closeAlertDialog(result) {
            syn.$w.alertResult = result;
            $.alert.close();
        },

        getUpdateParameters(cssSelector) {
            var result = [];
            var controls = [];

            if (cssSelector) {
                controls = syn.$l.querySelectorAll(cssSelector + ' *[bindingID]');
            }
            else {
                controls = syn.$l.querySelectorAll('input[type="text"], input[type="button"], input[type="checkbox"], input[type="hidden"], button, select, textarea');
            }

            var control = null;
            var bindingID = null;

            for (var i = 0; i < controls.length; i++) {
                control = controls[i];
                bindingID = control.getAttribute('bindingID');
                if (bindingID) {
                    switch (control.type.toLowerCase()) {
                        case 'checkbox':
                            result.push({ 'prop': bindingID, 'val': control.checked });
                            break;
                        default:
                            if (control.getAttribute('TextEditType') == 'Numeric') {
                                result.push({ 'prop': bindingID, 'val': control.value.toNumberString() });
                            }
                            else {
                                result.push({ 'prop': bindingID, 'val': control.value });
                            }
                            break;
                    }
                }
            }

            controls = syn.$l.querySelectorAll('input[type="radio"]');
            control = null;
            var elemIDs = [];
            var elID = '';

            for (var i = 0; i < controls.length; i++) {
                control = controls[i];
                bindingID = control.getAttribute('bindingID');

                if (bindingID) {
                    elemIDs.push(bindingID);
                }
            }

            elemIDs = $array.distinct(elemIDs);

            var radioButtons = null;
            for (var i = 0; i < elemIDs.length; i++) {
                elID = elemIDs[i];
                if ($radio) {
                    result.push({ 'prop': elID, 'val': $radio.getValue(elID) });
                }
                else {
                    radioButtons = document.getElementsByName(elID);
                    for (var j = 0; j < radioButtons.length; j++) {
                        if (radioButtons[j].checked) {
                            result.push({ 'prop': elID, 'val': radioButtons[j].value })
                            break;
                        }
                    }
                }
            }
            return result;
        },

        getSSOInfo() {
            var result = null;

            if (syn.$r.getCookie(`${syn.$w.cookiePrefixName}.Member`)) {
                var value = syn.$c.base64Decode(syn.$r.getCookie(`${syn.$w.cookiePrefixName}.Member`));
                result = JSON.parse(value);
            }

            return result;
        },

        getVariable() {
            var result = null;

            if (syn.$r.getCookie(`${syn.$w.cookiePrefixName}.Variable`)) {
                var value = syn.$c.base64Decode(syn.$r.getCookie(`${syn.$w.cookiePrefixName}.Variable`));
                result = JSON.parse(value);
            }

            return result;
        },

        setVariable(appInfo) {
            var today = new Date();
            today.setTime(today.getTime());

            var expires = 1000 * 60 * 60 * 24;
            var expiresDate = new Date(today.getTime() + (expires));
            var value = syn.$c.base64Encode(encodeURIComponent(JSON.stringify(appInfo)));
            document.cookie = `${syn.$w.cookiePrefixName}.Variable=${syn.$w.cookiePrefixName}.Variable=` + value + ((expires) ? ';path=/;expires=' + expiresDate.toGMTString() : '');
        },

        execPrefixFunc(el, func) {
            var prefixs = ['webkit', 'moz', 'ms', 'o', ''];
            var i = 0, m, t;
            while (i < prefixs.length && !el[m]) {
                m = func;
                if (prefixs[i] == '') {
                    m = m.substr(0, 1).toLowerCase() + m.substr(1);
                }
                m = prefixs[i] + m;
                t = typeof el[m];
                if (t != 'undefined') {
                    prefixs = [prefixs[i]];
                    return (t == 'function' ? el[m]() : el[m]);
                }
                i++;
            }
        },

        updateValue(el, bindingID) {
            switch (el.type.toLowerCase()) {
                case 'checkbox':
                    result[bindingID] = control.checked;
                    break;
                case 'text':
                    result[bindingID] = control.value;
                    break;
                default:
                    result[bindingID] = control.value;
                    break;
            }
        },

        initializeFormReset(el) {
            syn.$l.get('form1').reset();
            var els = syn.$l.querySelectorAll('select,checkbox');

            for (var i = 0; i < els.length; i++) {
                switch (els[i].type.toLowerCase()) {
                    case 'radio':
                        els[i].checked = false;
                        break;
                    case 'checkbox':
                        els[i].checked = false;
                        break;
                    case 'text':
                        els[i].value = '';
                    case 'select-one':
                        els[i].selectedIndex = 0;
                        break;
                    default:
                        els[i].value = '';
                        break;
                }
            }

            if ($object.isNullOrUndefined(el) == false) {
                el.focus();
            }

            els = null;
            el = null;

            return this;
        },

        initializeValue(el) {
            if (el.type !== undefined) {
                switch (el.type.toLowerCase()) {
                    case 'radio':
                        el.checked = el.getAttribute('IsDefaultChecked');
                        break;
                    case 'checkbox':
                        el.checked = false;
                        break;
                    case 'text':
                    case 'textarea':
                        el.value = '';
                        if (el.getAttribute('Booltoday') == 'True') {
                            el.value = (new Date()).getNow('d');
                        }
                        break;
                    case 'select-one':
                        el.selectedIndex = 0;
                        break;
                }
            }
            else if (el.className == 'grd_control') {
                $grid.dataClear(el.id.replace('_Box', ''));
            }
        },

        bindingValue(el, val) {
            switch (el.type.toLowerCase()) {
                case 'checkbox':
                    el.checked = val == '1' ? true : false;
                    break;
                case 'radio':
                    el.checked = el.value == val ? true : false;
                    break;
                case 'text':
                    if (el.getAttribute('TextEditType') == 'Numeric') {
                        el.value = val.toCurrency();
                    }
                    else {
                        el.value = val;
                    }
                    break;
                case 'select':
                    el.value = val;
                    break;
                default:
                    el.value = val;
                    break;
            }
        },

        fireResizeEvent(contents) {
            if (document.createEvent) {
                var e = document.createEvent('HTMLEvents');
                e.initEvent('resize', true, false);
                document.body.dispatchEvent(e);

            }
            else if (document.createEventObject) {
                document.body.fireEvent('onresize');
            }
        },

        getDataSource(dataSourceID, parameters, callback) {
            if (dataSourceID) {
                var mod = window[syn.$w.pageScript];
                if (mod && mod.config) {
                    var applicationID = '';
                    var businessID = '';
                    var transactionID = '';
                    var featureID = 'LD01';
                    var codeHelpID = syn.Environment ? syn.Environment.Application.CodeHelpID : '';
                    if ($string.isNullOrEmpty(codeHelpID) == false) {
                        var items = codeHelpID.split('|');
                        if (items.length == 3) {
                            applicationID = (location.pathname.startsWith((syn.Config.TenantAppRequestPath ? `/${syn.Config.TenantAppRequestPath}/` : '/app/')) == true) ? syn.$w.ManagedApp.ApplicationID : syn.Config.ApplicationID;
                            businessID = items[0];
                            transactionID = items[1];
                            featureID = items[2];
                        }
                        else {
                            syn.$w.alert(`앱 환경변수의 코드헬프 값 확인이 필요합니다. '${codeHelpID}'`, '정보');
                            return;
                        }
                    }
                    var transactionObject = syn.$w.transactionObject(featureID, 'Json');
                    transactionObject.programID = applicationID || syn.Config.ApplicationID;
                    transactionObject.businessID = businessID || syn.Config.ProjectID;
                    transactionObject.systemID = syn.Config.SystemID;
                    transactionObject.transactionID = transactionID || 'SYS010';
                    transactionObject.screenID = syn.$w.pageScript.replace('$', '');
                    transactionObject.startTraceID = 'syn.domain.$w.getDataSource';

                    if (parameters == null || parameters == undefined) {
                        parameters = '';
                    }

                    var applicationIDPattern = /(\@ApplicationID)\s*:/;
                    if (applicationIDPattern.test(parameters) == false) {
                        parameters = '@ApplicationID:{0};'.format(transactionObject.programID) + parameters;
                    }

                    var projectIDPattern = /(\@ProjectID)\s*:/;
                    if (projectIDPattern.test(parameters) == false) {
                        parameters = '@ProjectID:{0};'.format(transactionObject.businessID) + parameters;
                    }

                    var companyNoPattern = /(\@CompanyNo)\s*:/;
                    if (syn.$w.User && syn.$w.User.WorkCompanyNo && companyNoPattern.test(parameters) == false) {
                        parameters = '@CompanyNo:{0};'.format(syn.$w.User.WorkCompanyNo) + parameters;
                    }

                    var localeIDPattern = /(\@LocaleID)\s*:/;
                    if (localeIDPattern.test(parameters) == false) {
                        parameters = '@LocaleID:{0};'.format(syn.Config.Program.LocaleID) + parameters;
                    }

                    if (parameters.indexOf('${syn.$w.User.UserNo}') > -1) {
                        parameters = parameters.replaceAll('${syn.$w.User.UserNo}', syn.$w.User.UserNo);
                    }

                    if (parameters.indexOf('${syn.$w.Variable.ApplicationNo}') > -1) {
                        parameters = parameters.replaceAll('${syn.$w.Variable.ApplicationNo}', syn.$w.Variable.ApplicationNo);
                    }

                    if (parameters.indexOf('${syn.$w.ManagedApp.ApplicationNo}') > -1) {
                        parameters = parameters.replaceAll('${syn.$w.ManagedApp.ApplicationNo}', syn.$w.ManagedApp.ApplicationNo);
                    }

                    var inputObjects = [];
                    inputObjects.push({ prop: 'ApplicationID', val: transactionObject.programID });
                    inputObjects.push({ prop: 'CodeHelpID', val: dataSourceID });
                    inputObjects.push({ prop: 'Parameters', val: parameters });

                    if (syn.$w.User && syn.$w.User.WorkCompanyNo) {
                        inputObjects.push({ prop: 'CompanyNo', val: syn.$w.User.WorkCompanyNo });
                    }

                    transactionObject.inputs.push(inputObjects);
                    transactionObject.inputsItemCount.push(1);

                    var sysConfig = {};
                    sysConfig.programID = transactionObject.programID;
                    sysConfig.businessID = transactionObject.businessID;
                    sysConfig.systemID = transactionObject.systemID;
                    sysConfig.transactionID = transactionObject.transactionID;
                    sysConfig.screenID = transactionObject.screenID;

                    syn.$w.executeTransaction(sysConfig, transactionObject, function (responseData) {
                        if (responseData.length > 0) {
                            var chpResult = responseData[0];
                            if (callback && chpResult.value && $string.isNullOrEmpty(chpResult.value.CodeColumnID) == false) {
                                callback(chpResult.value);
                            }
                            else {
                                callback(null);
                            }
                        }
                        else {
                            syn.$l.eventLog('getDataSource', 'DataSourceID: "{0}" 데이터 없음'.format(dataSourceID));
                        }
                    });
                }
            }
        },

        codeCacheClear(options) {
            options = syn.$w.argumentsExtend({
                url: null,
                callback: null
            }, options);

            var url = null;
            if ($string.isNullOrEmpty(options.url) == true) {
                var apiService = syn.Config.DomainAPIServer;
                if (apiService.Port && apiService.Port != '') {
                    url = '{0}://{1}:{2}{3}'.format(apiService.Protocol, apiService.IP, apiService.Port, apiService.Path);
                }
                else {
                    url = '{0}://{1}{3}'.format(apiService.Protocol, apiService.IP, apiService.Path);
                }

                url = url + '/CacheClear';
            }
            else {
                url = options.url;
            }

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        if (options.callback) {
                            options.callback(xhr.responseText);
                        }
                    }
                    else {
                        syn.$l.eventLog('syn.$w.getCacheClearUrl', 'async url: ' + url + ', status: ' + xhr.status.toString() + ', responseText: ' + xhr.responseText, 'Error');
                    }
                }
            };
            xhr.open('GET', url, true);
            xhr.send();
        }
    });
})(syn.$w);

(function (window) {
    /// <summary>
    /// UI내에서 유효성 검사기능을 제공하는 모듈입니다.
    /// </summary>
    var $validation = $validation || window.$validation || new syn.module();
    var document = window.document;

    $validation.extend({
        version: '1.0.0',

        /// <summary>
        /// 유효성 검사후 입력 포커스를 부여할 element입니다.
        /// </summary>
        focusElement: null,

        /// <summary>
        /// 전체 유효성 검사(validateForm)시 검증 예외가 발생하면 다음 유효성 검사를 수행할지 결정합니다.
        /// </summary>
        isContinue: true,

        clear() {
            /// <summary>
            /// 유효성 검사기를 초기화합니다.
            /// </summary>
            /// <returns type='Type'></returns>
            var els = syn.$l.querySelectorAll('.need');
            for (var i = 0; i < els.length; i++) {
                syn.$m.removeClass(els[i], 'need');
            }

            els = null;
            return this;
        },

        validateControl(el) {
            /// <summary>
            /// HTML Element에 선언된 유효성 검사기를 실행합니다.
            /// &#10;&#10;
            /// example :&#10;
            /// &#10;syn.$v.validateControl(syn.$l.get('Text1'))
            /// </summary>
            /// <param name='el' domElement='true'>HTML Element입니다.</param>
            /// <returns type='Type'></returns>
            var isValidate = true;
            var result = false;

            if (el.value.length > 0) {
                result = true;
                syn.$m.removeClass(el, 'need');
            }
            else {
                result = false;
                isValidate = false;

                if (syn.$w.hasClass(el, 'need') == false) {
                    syn.$m.addClass(el, 'need');
                }

                if (!this.focusElement) {
                    this.focusElement = el;
                }

                if (this.isContinue == false) {
                    return isValidate;
                }
            }

            result = null;

            try {
                return isValidate;
            }
            finally {
                isValidate = null;
            }
        },

        validateControls(els) {
            /// <summary>
            /// HTML Element에 선언된 유효성 검사기를 실행합니다.
            /// &#10;&#10;
            /// example :&#10;
            /// &#10;syn.$v.validateControls(syn.$l.get('Text1', 'Text2', 'Text3'))
            /// </summary>
            /// <param name='el' domElement='true' optional='true'>HTML Element입니다.</param>
            /// <returns type='Type'></returns>
            var isValidate = true;
            var result = true;
            var el = null;

            if (!els) {
                els = syn.$l.querySelectorAll('.required');
            }

            if (els.type) {
                el = els;
                isValidate = this.validateControl(el);
            }
            else if (els.length) {
                for (var i = 0; i < els.length; i++) {
                    el = els[i];
                    result = this.validateControl(el);

                    if (result == false) {
                        isValidate = false;
                    }
                }
            }

            el = null;
            result = null;

            try {
                return isValidate;
            }
            finally {
                isValidate = null;
            }
        },

        // 'require', 'numeric', 'ipaddress', 'email', 'date', 'url'
        transactionValidate(controlModule, controlInfo, options, requestType) {
            if ((controlInfo.module == 'syn.uicontrols.$button' ||
                controlInfo.module == 'syn.uicontrols.$textbox' ||
                controlInfo.module == 'syn.uicontrols.$radio' ||
                controlInfo.module == 'syn.uicontrols.$select' ||
                controlInfo.module == 'syn.uicontrols.$multiselect' ||
                controlInfo.module == 'syn.uicontrols.$codepicker' ||
                controlInfo.module == 'syn.uicontrols.$colorpicker' ||
                controlInfo.module == 'syn.uicontrols.$datepicker' ||
                controlInfo.module == 'syn.uicontrols.$editor' ||
                controlInfo.module == 'syn.uicontrols.$jsoneditor' ||
                controlInfo.module == 'syn.uicontrols.$htmleditor' ||
                controlInfo.module == 'syn.uicontrols.$sourceeditor' ||
                controlInfo.module == 'syn.uicontrols.$files'
            ) && options.validators && options.validators.length > 0) {
                var valiationFunc = function (message) {
                    alert(message);
                    return false;
                };

                var controlText = options.controlText;
                var value = controlModule.getValue(controlInfo.id);
                if (options.validators.indexOf('require') > -1) {
                    if (value == '' || value == null) {
                        var message = '{0} 항목은 반드시 입력 해야합니다'.format(controlText);
                        return valiationFunc(message);
                    }

                    if (options.validators.indexOf('numeric') > -1) {
                        if (isNaN(value) == true) {
                            var message = '{0} 항목은 숫자값만 입력할 수 있습니다'.format(controlText);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('ipaddress') > -1) {
                        if (regexs.ipaddress.test(value) == false) {
                            var message = '{0} 항목은 IP 주소만 입력할 수 있습니다'.format(controlText);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('email') > -1) {
                        if (regexs.email.test(value) == false) {
                            var message = '{0} 항목은 이메일 주소만 입력할 수 있습니다'.format(controlText);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('date') > -1) {
                        var isDateCheck = true;
                        if (regexs.date.test(value) == false) {
                            isDateCheck = false;
                        };

                        var date = new Date(value);
                        var dateNum = date.getTime();
                        if (!dateNum && dateNum !== 0) {
                            isDateCheck = false;
                        }

                        isDateCheck = (date.toISOString().slice(0, 10) === value);

                        if (isDateCheck == false) {
                            var message = '{0} 항목은 "YYYY-MM-DD" 형식의 올바른 일자만 입력할 수 있습니다'.format(controlText);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('url') > -1) {
                        if (regexs.url.test(value) == false) {
                            var message = '{0} 항목은 웹 URL 주소만 입력할 수 있습니다'.format(controlText);
                            return valiationFunc(message);
                        }
                    }
                }
            }
            else if (controlInfo.module == 'syn.uicontrols.$grid' && requestType == 'Row' && options.validators && options.validators.length > 0) {
                var valiationFunc = function (message) {
                    alert(message);
                    return false;
                };

                var controlText = options.controlText;
                var columnName = controlModule.getColHeader(controlInfo.id, controlModule.propToCol(controlInfo.id, options.data));
                var row = controlModule.getActiveRowIndex(controlInfo.id);
                var col = controlModule.propToCol(controlInfo.id, options.data);
                var flag = controlModule.getDataAtCell(controlInfo.id, row, 'Flag');
                if (flag != 'D') {
                    return true;
                }
                else {
                    var value = controlModule.getDataAtCell(controlInfo.id, row, col);
                    if (options.validators.indexOf('require') > -1) {
                        if (value === '' || value == null) {
                            var message = '{0} 그리드의 {1} 컬럼은 반드시 입력 해야입니다'.format(controlText, columnName);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('numeric') > -1) {
                        if (isNaN(value) == true) {
                            var message = '{0} 그리드의 {1} 컬럼은 숫자값만 입력할 수 있습니다'.format(controlText, columnName);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('ipaddress') > -1) {
                        if (regexs.ipaddress.test(value) == false) {
                            var message = '{0} 그리드의 {1} 컬럼은 IP 주소만 입력할 수 있습니다'.format(controlText, columnName);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('email') > -1) {
                        if (regexs.email.test(value) == false) {
                            var message = '{0} 그리드의 {1} 컬럼은 이메일 주소만 입력할 수 있습니다'.format(controlText, columnName);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('date') > -1) {
                        var isDateCheck = true;
                        if (regexs.date.test(value) == false) {
                            isDateCheck = false;
                        };

                        var date = new Date(value);
                        var dateNum = date.getTime();
                        if (!dateNum && dateNum !== 0) {
                            isDateCheck = false;
                        }

                        isDateCheck = (date.toISOString().slice(0, 10) === value);

                        if (isDateCheck == false) {
                            var message = '{0} 그리드의 {1} 컬럼은 "YYYY-MM-DD" 형식의 올바른 일자만 입력할 수 있습니다'.format(controlText, columnName);
                            return valiationFunc(message);
                        }
                    }

                    if (options.validators.indexOf('url') > -1) {
                        if (regexs.url.test(value) == false) {
                            var message = '{0} 그리드의 {1} 컬럼은 웹 URL 주소만 입력할 수 있습니다'.format(controlText, columnName);
                            return valiationFunc(message);
                        }
                    }
                }
            }
            else if (controlInfo.module == 'syn.uicontrols.$grid' && requestType == 'List' && options.validators && options.validators.length > 0) {
                var valiationFunc = function (message) {
                    alert(message);
                    return false;
                };

                var controlText = options.controlText;
                var columnName = controlModule.getColHeader(controlInfo.id, controlModule.propToCol(controlInfo.id, options.data));
                var flagData = controlModule.getSourceDataAtCol(controlInfo.id, 'Flag');
                var rowData = controlModule.getSourceDataAtCol(controlInfo.id, options.data);

                var vaildateData = [];
                var length = flagData.length;
                for (var i = 0; i < length; i++) {
                    if (flagData[i] != 'D') {
                        vaildateData.push(rowData[i]);
                    }
                }

                if (options.validators.indexOf('require') > -1) {
                    if (vaildateData.filter(function (row) { return (row === '' || row == null) }).length > 0) {
                        var message = '{0} 그리드의 {1} 컬럼은 반드시 입력 해야입니다'.format(controlText, columnName);
                        return valiationFunc(message);
                    }
                }

                if (options.validators.indexOf('unique') > -1) {
                    if (vaildateData.filter(function (row, index) { return (vaildateData.indexOf(row) !== index) }).length > 0) {
                        var message = '{0} 그리드의 {1} 컬럼은 중복값을 입력할 수 없습니다'.format(controlText, columnName);
                        return valiationFunc(message);
                    }
                }

                if (options.validators.indexOf('numeric') > -1) {
                    if (vaildateData.filter(function (row) { return isNaN(row) }).length > 0) {
                        var message = '{0} 그리드의 {1} 컬럼은 숫자값만 입력할 수 있습니다'.format(controlText, columnName);
                        return valiationFunc(message);
                    }
                }

                if (options.validators.indexOf('ipaddress') > -1) {
                    if (vaildateData.filter(function (row) { return !regexs.ipaddress.test(row) }).length > 0) {
                        var message = '{0} 그리드의 {1} 컬럼은 IP 주소만 입력할 수 있습니다'.format(controlText, columnName);
                        return valiationFunc(message);
                    }
                }

                if (options.validators.indexOf('email') > -1) {
                    if (vaildateData.filter(function (row) { return !regexs.email.test(row) }).length > 0) {
                        var message = '{0} 그리드의 {1} 컬럼은 이메일 주소만 입력할 수 있습니다'.format(controlText, columnName);
                        return valiationFunc(message);
                    }
                }

                if (options.validators.indexOf('date') > -1) {
                    if (vaildateData.filter(function (row) {
                        if (regexs.date.test(row) == false) {
                            return true;
                        };

                        var date = new Date(row);
                        var dateNum = date.getTime();
                        if (!dateNum && dateNum !== 0) {
                            return true;
                        }

                        return !(date.toISOString().slice(0, 10) === row);
                    }).length > 0) {
                        var message = '{0} 그리드의 {1} 컬럼은 "YYYY-MM-DD" 형식의 올바른 일자만 입력할 수 있습니다'.format(controlText, columnName);
                        return valiationFunc(message);
                    }
                }

                if (options.validators.indexOf('url') > -1) {
                    if (vaildateData.filter(function (row) { return !regexs.url.test(row) }).length > 0) {
                        var message = '{0} 그리드의 {1} 컬럼은 웹 URL 주소만 입력할 수 있습니다'.format(controlText, columnName);
                        return valiationFunc(message);
                    }
                }
            }

            return true;
        }
    });
    window.$validation = syn.$v || window.$validation || $validation;
})(window);
function domainLibraryLoad() {
    if ($object.isBoolean(syn.Config.IsClientCaching) == true) {
        syn.$r.setCookie('syn.iscache', syn.Config.IsClientCaching, null, '/');
    }

    if ($string.isNullOrEmpty(syn.Config.CookiePrefixName) == false) {
        syn.$w.cookiePrefixName = syn.Config.CookiePrefixName;
    }

    if (location.pathname.startsWith((syn.Config.TenantAppRequestPath ? `/${syn.Config.TenantAppRequestPath}/` : '/app/')) == true) {
        syn.$w.cookiePrefixName = location.pathname.split('/')[2];
    }

    if (syn.Config.Environment == 'Production') {
        syn.$l.addEvent(document, 'selectstart', (evt) => { if (evt.preventDefault) { evt.preventDefault(); } if (evt.stopPropagation) { evt.stopPropagation(); } return false; });
        syn.$l.addEvent(document, 'contextmenu', (evt) => { if (evt.preventDefault) { evt.preventDefault(); } if (evt.stopPropagation) { evt.stopPropagation(); } return false; });
    }
    syn.$l.addEvent(document, 'keypress', (evt) => {
        var el = (evt && evt.target || evt.srcElement);
        if (el && el.tagName != 'TEXTAREA' && evt.which == '13') {
            if (evt.preventDefault) {
                evt.preventDefault();
            }

            if (evt.stopPropagation) {
                evt.stopPropagation();
            }
            return false;
        }
    });

    if (syn.Config.IsDebugMode == false) {
    }

    // 서버 컨트롤의 초기화 함수를 실행합니다. (페이지 뷰 속도를 향상하기 위해 script defer 처리가 되어 컨트롤 초기화 함수를 분리합니다.)
    if (window['controlInit']) {
        controlInit();
    }

    window.bearerToken = null;
    if (syn.$r.getCookie(`${syn.$w.cookiePrefixName}.BearerToken`)) {
        window.bearerToken = syn.$r.getCookie(`${syn.$w.cookiePrefixName}.BearerToken`);
    }

    syn.$w.User = syn.$w.getSSOInfo() || {
        UserNo: '',
        UserID: '',
        UserName: '',
        Email: '',
        Roles: [],
        Claims: {}
    };

    syn.$w.User.Claims = syn.$w.User.Claims || {};
    syn.$w.User.Claims.UserWorkID = syn.$w.User.Claims.UserWorkID || '';
    syn.$w.User.Claims.TenantAppRequestPath = syn.$w.User.Claims.TenantAppRequestPath || 'app';
    syn.$w.User.WorkCompanyNo = (syn.$r.query('companyNo') || syn.$r.query('CompanyNo') || syn.$r.query('companyNO') || syn.$r.query('CompanyNO') || syn.$r.query('COMPANYNO') || syn.$r.query('companyno')) || syn.$w.User.CompanyNo;
    syn.$w.User.WorkUserNo = (syn.$r.query('employeeNo') || syn.$r.query('EmployeeNo') || syn.$r.query('employeeNO') || syn.$r.query('EmployeeNO') || syn.$r.query('EMPLOYEENO') || syn.$r.query('employeeno')) || null;

    syn.$w.Variable = syn.$w.getVariable() || {
        ApplicationNo: '',
        ApplicationID: '',
        AccessKey: '',
        ApplicationName: '',
        ClientIP: '0.0.0.1'
    };

    syn.$w.ManagedApp = syn.$w.getStorage('handstack_managedapp', true) || {
        ApplicationNo: '',
        ApplicationID: '',
        ApplicationName: '',
        MemberNo: '',
        UserWorkID: '',
        ExpiredAt: new Date()
    };
    syn.$w.ManagedApp.ExpiredAt = new Date(syn.$w.ManagedApp.ExpiredAt);
    syn.$l.deepFreeze(syn.$w.ManagedApp);

    var mod = window[syn.$w.pageScript];
    if (mod && mod.hook.pageInit) {
        var isContinue = mod.hook.pageInit();
        if ($object.isNullOrUndefined(isContinue) == false && isContinue === false) {
            return false;
        }
    }

    syn.$k.setElement(document);

    var apiService = null;
    var apiServices = syn.$w.getStorage('apiServices', false);
    if (apiServices) {
        apiService = apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)];
        if ((apiServices.BearerToken == null || apiServices.BearerToken == undefined) && window.bearerToken) {
            apiServices.BearerToken = window.bearerToken;
            syn.$w.setStorage('apiServices', apiServices, false);
        }
    }
    else {
        if (syn.Config.DomainAPIServer != null) {
            apiService = syn.Config.DomainAPIServer;
            apiServices = {};
            if (window.bearerToken) {
                apiServices.BearerToken = window.bearerToken;
            }
            apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)] = apiService;
            syn.$w.setStorage('apiServices', apiServices, false);
        }
    }

    if (apiService == null && syn.Config.IsApiFindServer == true) {
        var apiFind = syn.$w.xmlHttp();
        apiFind.open('GET', syn.Config.DiscoveryApiServerUrl + '?systemID={0}&serverType={1}'.format(syn.Config.SystemID, syn.Config.Environment.substring(0, 1)), true);

        apiFind.setRequestHeader('Accept-Language', syn.$w.localeID);
        apiFind.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
        apiFind.setRequestHeader('content-type', 'application/json');
        apiFind.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var apiService = JSON.parse(apiFind.responseText);
                if (apiService.ExceptionText) {
                    syn.$l.eventLog('apiFind', 'SystemID: {0}, ServerType: {1}, Message: {2}'.format(syn.Config.SystemID, syn.Config.Environment.substring(0, 1), apiService.ExceptionText), 'Verbose');
                }
                else {
                    apiServices = {};
                    if (window.bearerToken) {
                        apiServices.BearerToken = window.bearerToken;
                    }
                    apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)] = apiService;
                    syn.$w.setStorage('apiServices', apiServices, false);
                    syn.$l.eventLog('apiFind', 'systemApi: {0}'.format(JSON.stringify(apiService)), 'Verbose');
                }
            }
        };
        apiFind.send();
    }
    else {
        syn.$l.eventLog('apiFind', 'systemApi: {0}'.format(JSON.stringify(apiService)), 'Verbose');
    }
}

function domainPageLoad() {
    var checkCount = 0;
    var pageStyleLoadedIntervalID = setInterval(function () {
        if (checkCount > 200 || (window.pageStyleLoaded != undefined && window.pageStyleLoaded == true)) {
            clearInterval(pageStyleLoadedIntervalID);

            var hidden = null;
            if (document.forms) {
                for (var i = 0; i < document.forms.length; i++) {
                    var form = document.forms[i];
                    hidden = form.getAttribute('hidden');
                    if ($object.isNullOrUndefined(hidden) == false && $string.toBoolean(hidden) == false) {
                        form.removeAttribute('hidden');
                        syn.$m.removeClass(form, 'hidden');
                        form.style.display = '';
                    }
                }
            }

            hidden = document.body.getAttribute('hidden');
            if ($object.isNullOrUndefined(hidden) == false && $string.toBoolean(hidden) == false) {
                document.body.removeAttribute('hidden');
                syn.$m.removeClass(document.body, 'hidden');
            }

            if (document.forms) {
                for (var i = 0; i < document.forms.length; i++) {
                    var form = document.forms[i];
                    if (form.style.display == 'none' && $string.toBoolean(form.getAttribute('hidden')) == false) {
                        form.style.display = '';
                    }
                }
            }

            if (document.body.style.display == 'none') {
                document.body.style.display = '';
            }

            if (document.body.style.visibility == 'hidden') {
                document.body.style.visibility = '';
            }

            if (syn.uicontrols && syn.uicontrols.$grid) {
                for (var i = 0; i < syn.uicontrols.$grid.gridControls.length; i++) {
                    syn.uicontrols.$grid.gridControls[i].hot.render();
                }
            }

            var isDarkMode = (window.localStorage && localStorage.getItem('isDarkMode') == 'true');
            if (isDarkMode == true) {
                DarkReader.enable({
                    brightness: 100,
                    contrast: 100,
                    sepia: 0
                });
            }
        }

        checkCount++;
    }, 25);
}

function domainPageComplete() {
    syn.$w.setTabContentHeight();
}

function domainPageMediaQuery(classInfix) {
    syn.$w.setTabContentHeight();
}
