'use strict';
let $checkin = {
    config: {
        programID: 'HDS',
        businessID: 'SYS',
        systemID: 'BP01',
        transactionID: 'SYS010',
    },

    prop: {
        stepCount: 1,
        forbesID: '',
        logoItemID: '',
        projectTemplates: [
            {
                ForbesID: 'handstack.apps.empty',
                LogoPath: '',
                Acronyms: 'EPT',
                ForbesName: '빈 프로젝트',
                Comment: '빈 프로젝트 템플릿입니다. 이 템플릿에는 내용이 없습니다'
            },
            {
                ForbesID: 'handstack.apps.helloworld',
                LogoPath: '',
                Acronyms: 'HWD',
                ForbesName: 'Hello World',
                Comment: '기본 화면 및 거래가 포함되어 있습니다'
            },
            {
                ForbesID: 'handstack.apps.uicontrols',
                LogoPath: '',
                Acronyms: 'UIC',
                ForbesName: 'UI 화면 컨트롤 샘플',
                Comment: '화면에서 제공하는 UI 커스텀 컨트롤 예제입니다'
            },
            {
                ForbesID: 'handstack.apps.board',
                LogoPath: '',
                Acronyms: 'BOD',
                ForbesName: '간단 게시판 예제',
                Comment: '게시글 목록, 신규, 편집 기능 예제입니다'
            }
        ],

        timerID: null,
        cookieCheckTryCount: 0,
        timerRunning: false,
        timerDelay: 6000,
        isUserLogout: false,
    },

    transaction: {
        LD04: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Grid', dataFieldID: 'MyProjects' },
                { type: 'Grid', dataFieldID: 'ParticipateProjects' }
            ],
            callback: function (error, responseObject, addtionalData) {
                if (error) {
                    syn.$l.eventLog('transaction', 'LD04 - error: {0}'.format(JSON.stringify(error)));
                    return;
                }

                var dataSource = {
                    items: $this.store.MyProjects
                };

                for (var i = 0, length = dataSource.items.length; i < length; i++) {
                    var item = dataSource.items[i];

                    if ($string.toBoolean(item.PublicYN) == true) {
                        item.IsPublic = '공개';
                    }

                    var roles = item.Roles.split(',').filter(p => p !== '');
                    if (roles.length > 0) {
                        item.roles = [];
                        for (var j = 0; j < roles.length; j++) {
                            var role = roles[j];
                            if (role == 'Y') {
                                var roleName = '';
                                switch (j) {
                                    case 0:
                                        roleName = '개발';
                                        break;
                                    case 1:
                                        roleName = '업무';
                                        break;
                                    case 2:
                                        roleName = '운영';
                                        break;
                                    case 3:
                                        roleName = '관리';
                                        break;
                                }

                                if ($string.isNullOrEmpty(roleName) == false) {
                                    item.roles.push({ RoleName: roleName });
                                }
                            }
                        }
                    }
                }

                $this.method.drawHtmlTemplate('lstMyProjects', 'tplProjectItem', dataSource);

                var dataSource = {
                    items: $this.store.ParticipateProjects
                };

                for (var i = 0, length = dataSource.items.length; i < length; i++) {
                    var item = dataSource.items[i];

                    if ($string.toBoolean(item.PublicYN) == true) {
                        item.IsPublic = '공개';
                    }

                    var roles = item.Roles.split(',').filter(p => p !== '');
                    if (roles.length > 0) {
                        item.roles = [];
                        for (var j = 0; j < roles.length; j++) {
                            var role = roles[j];
                            if (role == 'Y') {
                                var roleName = '';
                                switch (j) {
                                    case 0:
                                        roleName = '개발';
                                        break;
                                    case 1:
                                        roleName = '업무';
                                        break;
                                    case 2:
                                        roleName = '운영';
                                        break;
                                    case 3:
                                        roleName = '관리';
                                        break;
                                }

                                if ($string.isNullOrEmpty(roleName) == false) {
                                    item.roles.push({ RoleName: roleName });
                                }
                            }
                        }
                    }
                }

                $this.method.drawHtmlTemplate('lstParticipateProjects', 'tplProjectItem', dataSource);
            }
        },

        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'ManagedApp' }],
            callback: async (error, responseObject, addtionalData) => {
                if (error) {
                    syn.$l.eventLog('transaction', 'GD01 - error: {0}'.format(JSON.stringify(error)));
                    return;
                }

                var tokenID = syn.$w.getStorage('program_token', true);
                if (tokenID == null) {
                    tokenID = syn.$r.getCookie('HandStack.TokenID');
                    if (tokenID) {
                        syn.$w.setStorage('program_token', tokenID, true);
                    }
                }

                if ($object.isEmpty($this.store.ManagedApp) == false) {
                    await fetch(`/checkup/api/tenant-app/sign-in?applicationNo=${$this.store.ManagedApp.ApplicationNo}&memberNo=${$this.store.ManagedApp.MemberNo}`);
                    syn.$w.setStorage('handstack_managedapp', $this.store.ManagedApp, true);

                    setTimeout(() => {
                        location.href = 'main.html';
                    }, 200);
                }
                else {
                    syn.$w.alert('프로젝트 정보를 확인 할 수 없습니다. 잠시 후 다시 시작해주세요');
                }
            }
        }
    },

    hook: {
        pageLoad() {
            var tokenID = syn.$r.getCookie(syn.Config.CookiePrefixName + '.TokenID');
            var member = syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member');
            var variable = syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable');
            var bearerToken = syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken');

            if ($string.isNullOrEmpty(tokenID) == true
                || $string.isNullOrEmpty(member) == true
                || $string.isNullOrEmpty(variable) == true
                || $string.isNullOrEmpty(bearerToken) == true) {

                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'warning';
                alertOptions.buttonType = '1';
                syn.$w.alert('보안상의 이유로 HandStack 액세스 토큰이 만료되었습니다. HandStack에 다시 로그인해야 합니다', 'System Logout', alertOptions, function (result) {
                    location.href = 'account/signin.html';
                });
                return false;
            }

            if (syn.$w.User.UserNo != syn.$w.ManagedApp.MemberNo) {
                syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
                syn.$w.removeStorage('handstack_managedapp', true);
            }

            $this.method.startSessionTimer();

            syn.$l.get('txtMemberNo').value = syn.$w.User.UserNo;

            $this.method.search();

            var random = syn.$l.random(3).toUpperCase();
            syn.$l.get('txtApplicationName').value = random + ' 어플리케이션';
            syn.$l.get('txtAcronyms').value = random;
            syn.$l.get('txtCompanyName').value = syn.$w.User.CompanyName;
            syn.$l.get('txtOwnerName').value = syn.$w.User.UserName;
            syn.$l.get('btnNextInfomation').removeAttribute('disabled');


            var dataSource = {
                items: $this.prop.projectTemplates
            };

            $this.method.drawHtmlTemplate('lstProjectTemplates', 'tplProjectTemplate', dataSource);
        },
    },

    event: {
        txtApplicationName_change() {
            $this.method.updateButtonNextInfomation();
        },

        txtAcronyms_change() {
            $this.method.updateButtonNextInfomation();
        },

        btnStartWorkSpace_click() {
            syn.$w.transactionAction('GD01');
        },

        btnCreateProject_click() {
            $this.prop.stepCount = 1;
            $this.method.stepCountVisible();

            syn.$m.addClass('btnPrevInfomation', 'hidden');
            syn.$m.addClass('btnCreateApplication', 'hidden');
            syn.$m.removeClass('btnNextInfomation', 'hidden');

            $this.method.clearSelectedItem('divNewProject');
            $this.event.btnClearUploadLogoPath_click();

            syn.$w.showDialog(syn.$l.get('tplNewApplication'), {
                minWidth: 800,
                minHeight: 615,
            });
        },

        divApplicationItem_click(el, applicationNo) {
            syn.$l.get('txtApplicationNo').value = applicationNo;
            $this.method.clearSelectedItem('divExistProject');

            syn.$m.addClass(el, 'active');

            syn.$l.get('btnStartWorkSpace').removeAttribute('disabled');
        },

        divProjectTemplateItem_click(el, forbesID) {
            $this.prop.forbesID = forbesID;
            $this.method.clearSelectedItem('divNewProject');

            syn.$m.addClass(el, 'active');

            syn.$l.get('btnCreateApplication').removeAttribute('disabled');
        },

        btnPrevInfomation_click() {
            if ($this.prop.stepCount > 1) {
                $this.prop.stepCount = $this.prop.stepCount - 1;
                $this.method.stepCountVisible();
            }
        },

        btnNextInfomation_click() {
            if ($this.prop.stepCount < 3) {
                $this.prop.stepCount = $this.prop.stepCount + 1;
                $this.method.stepCountVisible();

                syn.$l.get('lblApplicationName').textContent = syn.$l.get('txtApplicationName').value.trim();
                syn.$l.get('lblAcronymsPublic').textContent = `${syn.$l.get('txtAcronyms').value.trim()}, ${syn.$l.get('chkPublicYN').checked ? '공개' : '미공개'}`;
                syn.$l.get('lblCompanyOwner').textContent = `${syn.$l.get('txtCompanyName').value.trim()}, ${syn.$l.get('txtOwnerName').value.trim()}`;

                var comment = syn.$l.get('txtComment').value.trim();
                if (comment == '') {
                    syn.$l.get('txtComment').value = '프로젝트에 대한 설명이 없습니다';
                }
                syn.$l.get('lblComment').textContent = syn.$l.get('txtComment').value.trim();
            }
        },

        async btnCreateApplication_click() {
            var createUrl = `/checkup/api/tenant-app/create-app?memberNo=${syn.$w.User.UserNo}&accessKey=6eac215f2f5e495cad4f2abfdcad7644`;
            var myHeaders = new Headers();
            var formData = new FormData();
            formData.append("applicationName", syn.$l.get('txtApplicationName').value.trim());
            formData.append("acronyms", syn.$l.get('txtAcronyms').value.trim());
            formData.append("logoItemID", $this.prop.logoItemID);
            formData.append("companyName", syn.$l.get('txtCompanyName').value.trim());
            formData.append("ownerName", syn.$l.get('txtOwnerName').value.trim());
            formData.append("publicYN", syn.$l.get('chkPublicYN').checked == true ? 'Y' : 'N');
            formData.append("comment", syn.$l.get('txtComment').value.trim());
            formData.append("forbesID", $this.prop.forbesID);
            formData.append("userWorkID", syn.$w.User.Claims.UserWorkID);

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: formData
            };

            var response = await fetch(createUrl, requestOptions);
            if (response.status == 200) {
                syn.$l.get('txtApplicationNo').value = await response.text();
                $this.event.btnStartWorkSpace_click();
            }
            else {
                var error = await response.text();
                syn.$w.alert(`앱을 만들 수 없습니다. ${error}`);
            }
        },

        async fleUploadLogoPath_change(evt) {
            var fileUpload = syn.$l.get('fleUploadLogoPath');
            if (fileUpload.files.length > 0) {
                var file = fileUpload.files[0];
                var blob = await syn.$l.fileToBlob(file);
                var resizeFile = await syn.$l.resizeImage(blob, 80);
                file = await syn.$l.blobToFile(resizeFile.blob, file.name, file.type);

                var myHeaders = new Headers();
                var formData = new FormData();
                formData.append('file', file);

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: formData
                };

                var dependencyID = syn.uicontrols.$fileclient.getTemporaryDependencyID('temp-id-');
                var uploadUrl = `/repository/api/storage/upload-file?applicationID=${syn.$w.User.ApplicationID}&repositoryID=CHECKUPLP01&dependencyID=${dependencyID}`;
                var response = await fetch(uploadUrl, requestOptions);
                if (response.status == 200) {
                    var item = await response.json();
                    $this.prop.logoItemID = item.ItemID;

                    syn.$l.get('imgLogoProfile1').src = `/repository/HDS/CHECKUPLP01/${$this.prop.logoItemID}`;
                    syn.$l.get('imgLogoProfile2').src = `/repository/HDS/CHECKUPLP01/${$this.prop.logoItemID}`;

                }
                else {
                    syn.$w.alert('로고 이미지를 업로드 할 수 없습니다');
                }
            }
        },

        btnClearUploadLogoPath_click() {
            syn.$l.get('imgLogoProfile1').src = `/checkup/img/common/profile.png`;
            syn.$l.get('imgLogoProfile2').src = `/checkup/img/common/profile.png`;
            syn.$l.get('fleUploadLogoPath').value = '';
        }
    },

    method: {
        updateButtonNextInfomation() {
            if (syn.$l.get('txtApplicationName').value.trim() != '' && syn.$l.get('txtAcronyms').value.trim() != '') {
                syn.$l.get('btnNextInfomation').removeAttribute('disabled');
            }
            else {
                syn.$l.get('btnNextInfomation').setAttribute('disabled', 'disabled');
            }
        },

        stepCountVisible() {
            syn.$m.addClass('divStep1', 'hidden');
            syn.$m.addClass('divStep2', 'hidden');
            syn.$m.addClass('divStep3', 'hidden');
            syn.$m.removeClass(syn.$l.querySelector('.step-item.active'), 'active');

            switch ($this.prop.stepCount) {
                case 1:
                    syn.$m.addClass('btnPrevInfomation', 'hidden');
                    syn.$m.removeClass('btnNextInfomation', 'hidden');
                    syn.$m.addClass('btnCreateApplication', 'hidden');
                    break;
                case 2:
                    syn.$m.removeClass('btnPrevInfomation', 'hidden');
                    syn.$m.removeClass('btnNextInfomation', 'hidden');
                    syn.$m.addClass('btnCreateApplication', 'hidden');
                    break;
                case 3:
                    syn.$m.removeClass('btnPrevInfomation', 'hidden');
                    syn.$m.addClass('btnNextInfomation', 'hidden');
                    syn.$m.removeClass('btnCreateApplication', 'hidden');
                    break;
            }

            syn.$m.addClass('lsiStep' + $this.prop.stepCount, 'active');
            syn.$m.removeClass('divStep' + $this.prop.stepCount, 'hidden');
        },

        search() {
            syn.$w.transactionAction('LD04');
        },

        clearSelectedItem(parentID) {
            var listItems = syn.$l.querySelectorAll(`#${parentID} .list-group-item.active`);
            for (var i = 0, length = listItems.length; i < length; i++) {
                var listItem = listItems[i];
                syn.$m.removeClass(listItem, 'active');
            }

            if (parentID == 'divExistProject') {
                syn.$l.get('btnStartWorkSpace').setAttribute('disabled', 'disabled');
            }
            else {
                syn.$l.get('btnCreateApplication').setAttribute('disabled', 'disabled');
            }
        },

        drawHtmlTemplate(elID, templateID, dataSource) {
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                var templateHtml = tplEL.innerHTML;
                drawEl.innerHTML = Mustache.render(templateHtml, dataSource);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.stack, 'Error');
            }
        },

        logout: async function (message) {
            $this.method.stopSessionTimer();

            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.TokenID', '/');
            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.Cookies', '/');
            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.Member', '/');
            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.Variable', '/');
            syn.$r.deleteCookie(syn.Config.CookiePrefixName + '.BearerToken', '/');

            syn.$r.httpRequest('GET', '/checkup/api/tenant-app/logout');
            syn.$w.removeStorage('program_token', true);
            syn.$w.removeStorage('handstack_managedapp', true);
            sessionStorage.clear();

            await syn.$r.httpRequest('GET', '/checkup/api/account/logout?tick=' + new Date().getTime());

            if ($string.isNullOrEmpty(message) == true) {
                message = '로그아웃 되었습니다';
            }

            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'success';
            alertOptions.buttonType = '1';
            syn.$w.alert(message, 'System Logout', alertOptions, function (result) {
                location.href = '/checkup/account/signin.html';
            });

            setTimeout(() => {
                location.href = '/checkup/account/signin.html';
            }, 10000);
        },

        isConnectedSession() {
            if ($this.prop.timerRunning) {
                if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable') == null || syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member') == null || syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken') == null) {
                    $this.prop.cookieCheckTryCount = $this.prop.cookieCheckTryCount + 1;
                    if ($this.prop.cookieCheckTryCount > 3) {
                        $this.method.stopSessionTimer();
                        $this.method.logout('보안상의 이유로 HandStack 액세스 토큰이 만료되었습니다. HandStack에 다시 로그인해야 합니다');
                    }
                    else {
                        syn.$l.eventLog('isConnectedSession failure', 'cookieCheckTryCount - {0}'.format($this.prop.cookieCheckTryCount), 'Information');

                        if (syn.Config.Environment == 'Development') {
                            syn.$l.eventLog('cookie', syn.Config.CookiePrefixName + '.Variable - {0}'.format(syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable')), 'Information');
                            syn.$l.eventLog('cookie', syn.Config.CookiePrefixName + '.Member - {0}'.format(syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member')), 'Information');
                            syn.$l.eventLog('cookie', syn.Config.CookiePrefixName + '.BearerToken - {0}'.format(syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken')), 'Information');
                            syn.$l.eventLog('storage', 'apiServices - {0}'.format($w.getStorage('apiServices', false)), 'Information');
                            syn.$l.eventLog('storage', 'member - {0}'.format($w.getStorage('member', false)), 'Information');
                            syn.$l.eventLog('storage', 'variable - {0}'.format($w.getStorage('variable', false)), 'Information');
                        }

                        var expireTicks = syn.$w.getStorage('expireTicks') || syn.$r.getCookie(syn.Config.CookiePrefixName + '.ExpireTicks') || null;
                        if (expireTicks == null || expireTicks == undefined) {
                            expireTicks = (new Date()).getTime() + (1000 * 60 * 60 * 24);
                        }
                        else {
                            expireTicks = (new Date(parseFloat(expireTicks))).getTime();
                        }

                        var expires = new Date(expireTicks);

                        if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable') == null && syn.$w.getStorage('variable')) {
                            syn.$r.setCookie(syn.Config.CookiePrefixName + '.Variable', syn.$w.getStorage('variable'), expires);
                        }

                        if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member') == null && syn.$w.getStorage('member')) {
                            syn.$r.setCookie(syn.Config.CookiePrefixName + '.Member', syn.$w.getStorage('member'), expires);
                        }

                        if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken') == null && syn.$w.getStorage('bearerToken')) {
                            syn.$r.setCookie(syn.Config.CookiePrefixName + '.BearerToken', syn.$w.getStorage('bearerToken'), expires);
                        }

                        if (syn.$r.getCookie(syn.Config.CookiePrefixName + '.TokenID') == null && syn.$w.getStorage('program_token', true)) {
                            syn.$r.setCookie(syn.Config.CookiePrefixName + '.TokenID', syn.$w.getStorage('program_token', true), expires);
                        }
                    }
                }
                else {
                    $this.prop.cookieCheckTryCount = 0;
                }
            }
        },

        startSessionTimer() {
            $this.prop.timerRunning = true;
            $this.prop.timerID = setTimeout($this.method.startSessionTimer, $this.prop.timerDelay);
            $this.method.isConnectedSession();
        },

        stopSessionTimer() {
            if ($this.prop.timerRunning) {
                clearTimeout($this.prop.timerID);
            }

            $this.prop.timerRunning = false;
        }
    }
}
