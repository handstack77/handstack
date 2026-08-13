'use strict';
let $mainframe = {
    config: {
        dataSource: {
            Empty: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    {
                        CodeID: '',
                        CodeValue: ''
                    }
                ]
            }
        }
    },

    prop: {
        resizeTimerID: null,
        windowWidth: null,
        windowHeight: null,
        tabFrameSize: null,

        work_menus: [],
        module_menus: {},
        module_searchmenus: {},
        module_items: {},
        module_nodes: {},
        modules: null,
        chromeTabs: null,

        root_node: null,
        gnb_nodes: [],
        search_nodes: [],

        selectedModuleID: '',
        selectedGnbID: '',
        selectedLnbID: '',

        recentMenus: [],

        timerID: null,
        cookieCheckTryCount: 0,
        timerRunning: false,
        timerDelay: 6000,
        isUserLogout: false,
        editorControls: [],

        appFileItems: [],
        focusTreeNode: null,
        functionType: '',

        lastedTabButtonID: 'btnModuleMenu',
        dashboardTabID: 'U$DSH$DSH000$000$000$',
        adjustHeight: 134
    },

    hook: {
        async pageInit() {
            const tokenID = syn.$r.getCookie(`HandStack.TokenID`);
            if (tokenID) {
                syn.$w.setStorage(`HandStack.tokenID`, tokenID, true);
            }
            else {
                const isDevAutoSignIn = await $this.method.tryDevAutoSignIn();
                if (isDevAutoSignIn == true) {
                    location.reload();
                }
                return false;
            }

            document.onselectstart = function () { return true; };
            document.oncontextmenu = function () { return true; };

            let expireTicks = syn.$r.getCookie(`HandStack.ExpireTicks`);
            if (syn.$w.getStorage('expireTicks') == null && expireTicks) {
                syn.$w.setStorage('expireTicks', expireTicks, false);
            }

            syn.$k.setElement(document);
            syn.$k.addKeyCode('keydown', syn.$k.keyCodes.f10, $this.method.keyEventHandler);
            syn.$k.addKeyCode('keydown', syn.$k.keyCodes.enter, $this.method.keyEventHandler);
            syn.$k.addKeyCode('keydown', syn.$k.keyCodes.escape, $this.method.keyEventHandler);
            syn.$k.addKeyCode('keydown', syn.$k.keyCodes.tab, $this.method.keyEventHandler);
            syn.$k.addKeyCode('keydown', syn.$k.keyCodes.backspace, $this.method.keyEventHandler);
        },

        async pageLoad() {
            const tokenID = syn.$r.getCookie(`HandStack.TokenID`);
            const member = syn.$r.getCookie(`HandStack.Member`);
            const variable = syn.$r.getCookie(`HandStack.Variable`);
            const bearerToken = syn.$r.getCookie(`HandStack.BearerToken`);
            $this.method.applyColorClassesToOptions('ddlPointColor');

            if ($string.isNullOrEmpty(tokenID) == true
                || $string.isNullOrEmpty(member) == true
                || $string.isNullOrEmpty(variable) == true
                || $string.isNullOrEmpty(bearerToken) == true) {
                location.href = `/`;
                return false;
            }

            $this.method.startSessionTimer();

            const loginUserName = `${syn.$w.User.UserName} ${syn.$w.User.PositionName}`;
            syn.$l.get('lblLoginUserName1').innerText = loginUserName;

            const loginUserBelong = `${syn.$w.User.DepartmentName} [${syn.$w.User.CompanyName}]`;
            syn.$l.get('lblLoginUserBelong1').innerText = loginUserBelong;

            syn.$l.addEvent(window, 'storage', $this.event.window_storage);
            syn.$l.addEvent(window, 'resize', $this.event.window_resize);

            syn.$w.loadJson('/menus.json?tick=' + new Date().getTime(), null, function (mod, responseData) {
                if (responseData.length > 1) {
                    const items = [
                        {
                            menuID: '000',
                            menuName: 'HandStack',
                            parentMenuID: null,
                            moduleName: 'HandStack',
                            showYN: 'Y',
                            menuType: 'D',
                            functions: null,
                            projectID: null,
                            fileID: null,
                            depth: 0,
                            icon: null,
                            badge: null,
                            sortingNo: 0
                        }
                    ];

                    const compareArrays = (nestedMenus, baseMenus) => {
                        const smallMap = new Map();
                        nestedMenus.forEach(item => {
                            smallMap.set(`${item.MenuID}-${item.ParentMenuID}`, item);
                        });

                        let result = baseMenus.filter(item => {
                            return !smallMap.has(`${item.MenuID}-${item.ParentMenuID}`);
                        });

                        return result;
                    }

                    const modules = responseData[0].value;
                    const module_menus = responseData[1].value;
                    for (let i = 0; i < modules.length; i++) {
                        const module = modules[i];

                        let root = module_menus.find(function (item) { return item.ParentMenuID == null && item.MenuID == module.ModuleID });
                        if ($object.isNullOrUndefined(root) == true) {
                            continue;
                        }

                        items.push({
                            menuID: module.ModuleID,
                            menuName: module.ModuleName,
                            parentMenuID: '000',
                            moduleName: 'HandStack',
                            showYN: 'Y',
                            menuType: 'D',
                            functions: null,
                            projectID: null,
                            fileID: null,
                            depth: 1,
                            icon: module.IconID,
                            badge: null,
                            sortingNo: i
                        });

                        const json = syn.$l.parseFlat2Nested(module_menus, root, root, 'MenuID', 'ParentMenuID', 'items');
                        let nestedNode = syn.$l.findNestedByID(json, root.MenuID, 'MenuID', 'items');
                        let flatItems = syn.$l.nested2Flat(nestedNode, 'MenuID', 'ParentMenuID', 'items');
                        const exceptItems = compareArrays(flatItems, module_menus.filter(item => item.ModuleName == module.ModuleName));
                        flatItems = flatItems.concat(exceptItems);
                        let menuItems = [];
                        for (let j = 0, length = flatItems.length; j < length; j++) {
                            const flatItem = flatItems[j];
                            const menuItem = {
                                menuID: flatItem.MenuID,
                                menuName: flatItem.MenuName,
                                parentMenuID: flatItem.ParentMenuID,
                                moduleName: flatItem.ModuleName,
                                showYN: flatItem.ViewYN,
                                menuType: flatItem.FolderYN == 'Y' ? 'D' : 'U',
                                functions: `${(flatItem.FnSearch == 'Y' ? '|search' : '')}${(flatItem.FnSave == 'Y' ? '|save' : '')}${(flatItem.FnDelete == 'Y' ? '|delete' : '')}${(flatItem.FnPrint == 'Y' ? '|print' : '')}${(flatItem.FnExport == 'Y' ? '|export' : '')}${(flatItem.FnRefresh == 'Y' ? '|refresh' : '')}`,
                                projectID: flatItem.DirectoryID,
                                fileID: flatItem.ItemID,
                                depth: flatItem.Step,
                                icon: null,
                                badge: null,
                                sortingNo: flatItem.SortingNo
                            };
                            menuItems.push(menuItem);
                        }

                        let copyMenuItems = JSON.parse(JSON.stringify(menuItems));
                        root = menuItems.find(function (item) { return item.parentMenuID == null && item.menuID == module.ModuleID });
                        nestedNode = syn.$l.parseFlat2Nested(copyMenuItems, root, root, 'menuID', 'parentMenuID', 'items');

                        $this.prop.module_nodes[module.ModuleID] = nestedNode;
                        $this.prop.module_menus[module.ModuleID] = copyMenuItems;

                        const menuNameMap = new Map(copyMenuItems.map(item => [item.menuID, item.menuName]));
                        const searchMenus = copyMenuItems
                            .filter(item => item.showYN === 'Y' && item.menuType === 'U')
                            .map(item => ({
                                MenuID: item.menuID,
                                MenuName: item.menuName,
                                ParentMenuName: menuNameMap.get(item.parentMenuID),
                                ProjectID: item.projectID,
                                FileID: item.fileID,
                            }));
                        $this.prop.module_searchmenus[module.ModuleID] = searchMenus;
                    }

                    $this.prop.modules = items;
                    $this.method.concreateModuleControl('divModuleTreeMenu', $this.prop.modules, 'basic');

                    $this.prop.selectedModuleID = 'DMOMENU000';
                    const defaultModuleEL = syn.$l.get(`module_basic_${$this.prop.selectedModuleID}`);
                    if (defaultModuleEL) {
                        defaultModuleEL.click();
                    }

                    syn.$l.get('btnDashBoard').click();
                    $this.method.loadFavoriteMenu();

                    setTimeout(function () {
                        $mainframe.method.linkExecute('handstack_linkData');
                        $mainframe.method.openMenuFromQuery();
                    }, 200);
                }
                else {
                    const alertOptions = $object.clone(syn.$w.alertOptions);
                    alertOptions.icon = 'warning';
                    alertOptions.buttonType = '1';
                    syn.$w.alert('메뉴 정보를 조회 하지 못했습니다. 다시 로그인해야 합니다.', '메뉴 조회', alertOptions);
                }
            }, null, true);

            const el = document.querySelector('.chrome-tabs');
            syn.$l.addEvent(el, 'activeTabChange', $this.event.menuTab_activeTabChange);
            syn.$l.addEvent(el, 'tabAdd', $this.event.menuTab_tabAdd);
            syn.$l.addEvent(el, 'tabRemove', $this.event.menuTab_tabRemove);

            syn.$l.addEvent('btnMenuSelector', 'click', $this.event.btnMenuSelector_click);

            syn.$l.addEvent('btnCloseOffCanvas', 'click', (evt) => {
                syn.$m.toggleClass('divOffcanvasEnd', 'show');
                syn.$m.toggleClass('divOffCanvasBackdrop', 'hidden');
            });

            syn.$l.addEvent('btnMyProfile', 'click', (evt) => {
                syn.$l.get('txtUserName').value = syn.$w.User.UserName;
                syn.$l.get('txtPositionName').value = syn.$w.User.PositionName;
                syn.$l.get('txtDepartmentName').value = syn.$w.User.DepartmentName;
                syn.$l.get('txtCelluar').value = syn.$w.User.Celluar;
                syn.$l.get('txtExtensionNo').value = syn.$w.User.ExtensionNo;
                syn.$l.get('ddlPointColor').value = syn.$w.Variable.UserPreferences.find(item => item.Category == 'Employee' && item.Name == 'PointColor')?.Value;

                syn.$w.showDialog(syn.$l.get('tplMyProfile'), {
                    minWidth: 520,
                    minHeight: 480,
                });
            });

            syn.$l.addEvent('btnApplyMyProfile', 'click', (evt) => {
                const password = syn.$l.get('txtPassword').value.trim();
                const newPassword = syn.$l.get('txtNewPassword').value.trim();
                if ($string.isNullOrEmpty(password) == false || $string.isNullOrEmpty(newPassword) == false) {
                    if ($string.isNullOrEmpty(password) == true || $string.isNullOrEmpty(newPassword) == true) {
                        syn.$w.alert('기존 비밀번호와 변경 비밀번호를 입력 하세요');
                        return false;
                    }
                }

                const celluar = syn.$l.get('txtCelluar').value.trim();
                if (celluar == '') {
                    syn.$w.alert('연락처를 입력 하세요');
                    return false;
                }

                const alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'warning';
                alertOptions.buttonType = '3';
                alertOptions.style = 'font:red!';
                syn.$w.alert(`개인정보 변경 후 로그아웃됩니다. 변경 하시겠습니까?`, '변경 확인', alertOptions, function (result) {
                    if (result == 'Yes') {

                    }
                });
            });

            syn.$l.addEvent('btnLogout', 'click', (evt) => {
                const alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'question';
                alertOptions.buttonType = '2';
                syn.$w.alert($resource.translations.isLogOut, 'System Logout', alertOptions, function (result) {
                    if (result == 'OK') {
                        $this.prop.isUserLogout = true;
                        $this.method.logout();
                    }
                });
            });

            $this.prop.chromeTabs = new ChromeTabs();
            $this.prop.chromeTabs.init(el);

            syn.$m.addClass('tplAddFavoriteMenu', 'hidden');
            syn.$m.removeClass('tplAddFavoriteMenu', 'invisible');
            syn.$m.addClass('tplEditFavoriteGroup', 'hidden');
            syn.$m.removeClass('tplEditFavoriteGroup', 'invisible');
            syn.$m.addClass('tplEditFavoriteMenu', 'hidden');
            syn.$m.removeClass('tplEditFavoriteMenu', 'invisible');
            syn.$m.addClass('tplSearchMenu', 'hidden');
            syn.$m.removeClass('tplSearchMenu', 'invisible');

            $this.event.btnDarkMode_click();
        }
    },

    event: {
        window_storage(evt) {
            if (evt.key == `HandStack.tokenID` && evt.oldValue != evt.newValue && !evt.oldValue) {
                $l.eventLog('window_storage', 'handstack_tokenID oldValue={0}, newValue={1}'.format(evt.oldValue, evt.newValue), 'Information');
                if ($mainframe.prop.isUserLogout == false) {
                    $mainframe.method.logout();
                }
            }
            else if (evt.key == `HandStack.tokenID` && evt.oldValue != null && evt.newValue == null) {
                $mainframe.method.logout();
            }
        },

        btnModuleMenu_click() {
            syn.$l.get('btnModuleMenu').checked = true;

            syn.$m.addClass('divProgramMenu', 'hidden');
            syn.$m.addClass('divFavoriteMenu', 'hidden');
            syn.$m.addClass('divHistoryMenu', 'hidden');
        },

        btnProgramMenu_click() {
            syn.$l.get('btnProgramMenu').checked = true;

            syn.$m.removeClass('divProgramMenu', 'hidden');
            syn.$m.addClass('divFavoriteMenu', 'hidden');
            syn.$m.addClass('divHistoryMenu', 'hidden');
        },

        btnFavoriteMenu_click() {
            syn.$l.get('btnFavoriteMenu').checked = true;

            syn.$m.addClass('divProgramMenu', 'hidden');
            syn.$m.removeClass('divFavoriteMenu', 'hidden');
            syn.$m.addClass('divHistoryMenu', 'hidden');
        },

        btnHistoryMenu_click() {
            syn.$l.get('btnHistoryMenu').checked = true;

            syn.$m.addClass('divProgramMenu', 'hidden');
            syn.$m.addClass('divFavoriteMenu', 'hidden');
            syn.$m.removeClass('divHistoryMenu', 'hidden');

            $this.method.loadRecentMenu();
        },

        window_resize() {
            if ($object.isNullOrUndefined($this.prop.resizeTimerID) == true) {
                $this.prop.resizeTimerID = setTimeout($this.event.mainFrame_resize, 200);
            }
        },

        mainFrame_resize() {
            $this.prop.tabFrameSize = syn.$d.getSize(syn.$l.get('tabContainer'));
            const windowWidth = $this.method.getWindowWidth();
            const windowHeight = $this.method.getWindowHeight();

            if ($this.prop.windowWidth === windowWidth && $this.prop.windowHeight === windowHeight) {
                if ($this.prop.resizeTimerID) {
                    clearTimeout($this.prop.resizeTimerID);
                    $this.prop.resizeTimerID = null;
                }
                else {
                    return;
                }
            }
            else {
                if ($this.prop.windowWidth === windowWidth && $this.prop.windowHeight === windowHeight) {
                    if ($this.prop.resizeTimerID) {
                        clearTimeout($this.prop.resizeTimerID);
                        $this.prop.resizeTimerID = null;
                    }
                }
                else {
                    $this.prop.windowWidth = windowWidth;
                    $this.prop.windowHeight = windowHeight;
                    $this.prop.resizeTimerID = setTimeout($this.event.mainFrame_resize, 100);
                }

                return;
            }

            const length = $this.prop.editorControls.length;
            for (let i = 0; i < length; i++) {
                const item = $this.prop.editorControls[i];
                const tabEL = syn.$l.querySelector(`[data-tab-id="${item.id.replace('$i', '')}"]`);
                if (tabEL && tabEL.getAttribute('active') == '') {
                    const control = $this.method.getEditorControl(item.id);
                    if (control) {
                        if (control.editor) {
                            control.editor.layout();
                        }
                    }
                }
            }

            let tabID = null;
            const tabEL = $this.method.getActiveTab();
            if (tabEL) {
                tabID = tabEL.getAttribute('data-tab-id');
            }
            else {
                tabID = `${$this.prop.dashboardTabID}${$this.prop.selectedModuleID}`;
            }

            if ($string.isNullOrEmpty(tabID) == false) {
                const isHeaderHidden = syn.$m.hasClass(syn.$l.querySelector('header'), 'hidden');
                const pageWindow = $this.method.getActiveTabContent(tabID);
                if (pageWindow && pageWindow.syn && pageWindow.syn.$w.setTabContentHeight) {
                    const pageHeader = pageWindow.syn.$l.querySelector('div.page-header');
                    if (pageHeader) {
                        if (isHeaderHidden == true) {
                            pageWindow.syn.$m.addClass(pageHeader, 'hidden');
                        }
                        else {
                            pageWindow.syn.$m.removeClass(pageHeader, 'hidden');
                        }
                    }
                    pageWindow.syn.$w.setTabContentHeight();
                }

                const tabFrame = parent.syn.$l.get(`${tabID}$i`);
                if (tabFrame) {
                    const pageWrapper = document.querySelector('.page-wrapper');
                    if (pageWrapper) {
                        const frameHeight = syn.$d.getDocumentSize().frameHeight;
                        const headerHeight = syn.$d.getSize(syn.$l.querySelector('header')).offsetHeight;
                        const footerHeight = syn.$d.getSize(syn.$l.querySelector('footer')).offsetHeight;
                        const scrollHeight = frameHeight - ((isHeaderHidden == true ? headerHeight : 56) + footerHeight + 76);
                        tabFrame.height = scrollHeight;
                        tabFrame.style.height = `${scrollHeight}px`;
                    }
                }
            }

            $this.method.resizeTabUI();

            var height = $this.prop.windowHeight - $this.prop.adjustHeight;
            var adjustHeight = height < 300 ? 300 : height;
            syn.uicontrols.$auigrid.setControlSize('grdSearchKeyword', { height: adjustHeight });
        },

        btnMenuSelector_click(evt) {
            $this.prop.chromeTabs.layoutTabs();
        },

        btnDashBoard_click(evt) {
            const activeTab = syn.$l.querySelector('.chrome-tab[active]');
            if (activeTab != null) {
                activeTab.removeAttribute('active');
            }

            const tabFrames = syn.$l.querySelectorAll('#tabContainer [tag="iframe"]');

            for (let i = 0, l = tabFrames.length; i < l; i++) {
                const tabFrame = tabFrames[i];
                syn.$m.setStyle(tabFrame, 'display', 'none');
            }

            syn.$l.get('lblActiveTabTitle').textContent = '대시보드';

            const tabID = `${$this.prop.dashboardTabID}${$this.prop.selectedModuleID}$i`;
            syn.$m.setStyle(tabID, 'display', 'block');

            const divActionButtons = syn.$l.get('divActionButtons');
            syn.$w.purge(divActionButtons);
            divActionButtons.innerHTML = '';

            const actionButton = {
                command: 'refresh',
                icon: 'refresh',
                action(evt) {
                    const pageWindow = $this.method.getActiveTabContent(`${$this.prop.dashboardTabID}${$this.prop.selectedModuleID}`);
                    if (pageWindow && pageWindow.syn) {
                        pageWindow.location.reload();
                    }
                }
            };

            const button = syn.$m.create({
                id: 'fab_' + actionButton.command,
                tag: 'button',
                className: `btn`
            });

            button.innerHTML = `<i class="f:18 ti ti-${actionButton.icon}"></i>`;

            if (actionButton.action) {
                syn.$l.addEvent(button, 'click', actionButton.action);
            }

            syn.$m.appendChild(divActionButtons, button);

            const pageWindow = $this.method.getActiveTabContent(tabID);
            if (pageWindow && pageWindow.syn && pageWindow.syn.$w.setTabContentHeight) {
                pageWindow.syn.$w.setTabContentHeight();
                $this.method.resizeTabUI();
            }
            $this.method.loadModuleDashboard();
            syn.$m.addClass('divUIDefaultButton', 'hidden');
        },

        menuTab_activeTabChange(evt) {
            const el = evt.detail.tabEl;
            const tabFrames = syn.$l.querySelectorAll('#tabContainer [tag="iframe"]');

            for (let i = 0, l = tabFrames.length; i < l; i++) {
                const tabFrame = tabFrames[i];
                syn.$m.setStyle(tabFrame, 'display', 'none');
            }

            syn.$l.get('lblActiveTabTitle').textContent = el.querySelector('.chrome-tab-title').textContent;

            const tabID = evt.detail.tabEl.getAttribute('data-tab-id');
            $this.method.focusTabUI(tabID);
            $this.method.resizeTabUI();

            const tabInfos = tabID.split('$');
            const menuType = tabInfos[0];
            const menuID = tabInfos[3];
            const parentMenuID = tabInfos[4];
            if (menuType == 'U') {
                const menuStyle = 'basic';
                const lnbMenuItem = syn.$l.get(`lnb_${menuStyle}_${parentMenuID}`);
                const lstMenuItem = syn.$l.get(`lst_${menuStyle}_${menuID}`);
                if (lstMenuItem != null) {
                    $this.method.menuItemActive(lstMenuItem);
                }
            }

            const pageWindow = $this.method.getActiveTabContent(tabID);
            if (pageWindow && pageWindow.syn) {
                $this.event.window_resize();
            }
            else {
                const tabIFrame = syn.$l.get(tabID + '$i');
                if (tabIFrame) {
                    const divEditor = tabIFrame.querySelector('.monaco-editor');
                    if (divEditor) {
                        $this.event.window_resize();
                    }
                }
            }

            if (tabInfos.length > 5) {
                const moduleID = tabInfos[5];
                const menus = $this.prop.module_menus[moduleID];
                if (menus) {
                    const menuNode = menus.find(function (item) { return item.menuID == menuID });
                    if ($object.isNullOrUndefined(menuNode) == false && $this.prop.selectedModuleID != moduleID) {
                        $this.prop.selectedModuleID = moduleID;
                        const defaultModuleEL = syn.$l.get(`module_basic_${moduleID}`);
                        if (defaultModuleEL) {
                            defaultModuleEL.click();
                        }

                        setTimeout(() => {
                            $this.method.focusTabUI(tabID);
                        });
                    }
                }
            }
        },

        menuTab_tabAdd(evt) {
            const el = evt.detail.tabEl;
            const tabID = el.getAttribute('data-tab-id');
            const tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`);

            const tabInfos = tabID.split('$');
            const menuType = tabInfos[0];
            const menuID = tabInfos[3];

            const tabContainer = syn.$l.get('tabContainer');
            const tabFrames = syn.$l.querySelectorAll('#tabContainer [tag="iframe"]');

            for (let i = 0, l = tabFrames.length; i < l; i++) {
                const tabFrame = tabFrames[i];
                syn.$m.setStyle(tabFrame, 'display', 'none');
            }

            const isHeaderHidden = syn.$m.hasClass(syn.$l.querySelector('header'), 'hidden');
            if (['D', 'S', 'A', 'L', 'M'].indexOf(menuType) > -1) {
                const menus = $this.prop.work_menus;
                const menuNode = menus.find(function (item) { return item.menuID == tabID || item.tabID == tabID });
                if ($object.isNullOrUndefined(menuNode) == true) {
                    return;
                }

                tabEl.title = tabID;
                tabEl.functions = menuNode.functions;

                const tabFrame = syn.$m.append(tabContainer, 'iframe', tabID + '$i', {
                    styles: { display: 'none' }
                });
                tabFrame.width = '100%';
                tabFrame.height = '100%';
                tabFrame.frameborder = '0';
                tabFrame.scrolling = 'no';
                tabFrame.border = '0';
                tabFrame.hspace = '0';
                tabFrame.vspace = '0';
                tabFrame.setAttribute('allowfullscreen', 'allowfullscreen');
                tabFrame.setAttribute('tag', 'iframe');
                tabFrame.style.border = 0;

                const pageWrapper = document.querySelector('.page-wrapper');
                if (pageWrapper) {
                    const frameHeight = syn.$d.getDocumentSize().frameHeight;
                    const headerHeight = syn.$d.getSize(syn.$l.querySelector('header')).offsetHeight;
                    const footerHeight = syn.$d.getSize(syn.$l.querySelector('footer')).offsetHeight;
                    const scrollHeight = frameHeight - ((isHeaderHidden == true ? headerHeight : 56) + footerHeight + 76);
                    tabFrame.height = scrollHeight + (isHeaderHidden == true ? 52 : 0);
                    tabFrame.style.height = `${scrollHeight}px`;
                }

                let url = '';
                if (menuNode.url) {
                    url = menuNode.url;
                }
                else {
                    url = `/view/HDS/{0}/{1}.html`.format(menuNode.projectID, menuNode.fileID);
                }

                if (syn.Config && syn.Config.IsClientCaching == true) {
                    tabFrame.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tabID=' + tabID;
                }
                else {
                    tabFrame.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tabID=' + tabID + '&tick=' + new Date().getTime();
                }

                syn.$l.addEvent(tabFrame, 'load', function () {
                    const pageWindow = $this.method.getActiveTabContent(tabID);
                    if (pageWindow && pageWindow.document) {
                        const pageHeader = pageWindow.document.querySelector('div.page-header');
                        if (pageHeader) {
                            if (isHeaderHidden == true) {
                                pageHeader.classList.add('hidden');
                            }
                            else {
                                pageHeader.classList.remove('hidden');
                            }
                        }

                        const pageHeaderTitle = pageWindow.document.querySelector('.page-pretitle');
                        if (pageHeaderTitle && menuNode.moduleName) {
                            pageHeaderTitle.innerHTML = `${menuNode.moduleName}`;
                        }
                    }

                    if (menuNode.callback) {
                        menuNode.callback(tabID);
                    }
                });

                tabFrame.style.display = 'block';
            }
            else if (menuType == 'U') {
                const menus = $this.prop.module_menus[$this.prop.selectedModuleID];
                const menuNode = menus.find(function (item) { return item.menuID == menuID });
                if ($object.isNullOrUndefined(menuNode) == true) {
                    return;
                }

                const baseNode = menus.find(function (item) { return item.menuID == menuNode.parentMenuID });
                if ($object.isNullOrUndefined(menuNode) == true) {
                    return;
                }

                tabEl.title = tabID;
                tabEl.functions = menuNode.functions;

                const tabFrame = syn.$m.append(tabContainer, 'iframe', tabID + '$i', {
                    styles: { display: 'none' }
                });
                tabFrame.width = '100%';
                tabFrame.height = '100%';
                tabFrame.frameborder = '0';
                tabFrame.scrolling = 'yes';
                tabFrame.border = '0';
                tabFrame.hspace = '0';
                tabFrame.vspace = '0';
                tabFrame.setAttribute('allowfullscreen', 'allowfullscreen');
                tabFrame.setAttribute('tag', 'iframe');
                tabFrame.style.border = 0;

                const pageWrapper = document.querySelector('.page-wrapper');
                if (pageWrapper) {
                    const frameHeight = syn.$d.getDocumentSize().frameHeight;
                    const headerHeight = syn.$d.getSize(syn.$l.querySelector('header')).offsetHeight;
                    const footerHeight = syn.$d.getSize(syn.$l.querySelector('footer')).offsetHeight;
                    const scrollHeight = frameHeight - ((isHeaderHidden == true ? headerHeight : 56) + footerHeight + 76);
                    tabFrame.height = scrollHeight + (isHeaderHidden == true ? 52 : 0);
                    tabFrame.style.height = `${scrollHeight}px`;
                }

                let url = '';
                if (menuNode.url) {
                    url = menuNode.url;
                }
                else {
                    url = `/view/HDS/{0}/{1}.html`.format(menuNode.projectID, menuNode.fileID);
                }

                if (syn.Config && syn.Config.IsClientCaching == true) {
                    tabFrame.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tabID=' + tabID;
                }
                else {
                    tabFrame.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tabID=' + tabID + '&tick=' + new Date().getTime();
                }

                syn.$l.addEvent(tabFrame, 'load', function () {
                    const pageWindow = $this.method.getActiveTabContent(tabID);
                    if (pageWindow && pageWindow.document) {
                        const pageHeader = pageWindow.document.querySelector('div.page-header');
                        if (pageHeader) {
                            if (isHeaderHidden == true) {
                                pageHeader.classList.add('hidden');
                            }
                            else {
                                pageHeader.classList.remove('hidden');
                            }
                        }

                        const pageHeaderTitle = pageWindow.document.querySelector('.page-pretitle');
                        if (pageHeaderTitle) {
                            pageHeaderTitle.innerHTML = `${baseNode.moduleName} / ${baseNode.menuName}`;
                        }
                    }

                    if (menuNode.callback) {
                        menuNode.callback(tabID);
                    }
                });

                tabFrame.style.display = 'block';
            }

            syn.$l.addEvent(tabEl, 'mousedown', (evt) => {
                if (evt.which === 2) {
                    const currentTabEl = evt.currentTarget;
                    if (currentTabEl) {
                        $this.prop.chromeTabs.removeTab(currentTabEl);
                    }
                }
            });
        },

        menuTab_tabRemove(evt) {
            const el = evt.detail.tabEl;
            const tabID = el.getAttribute('data-tab-id');

            try {
                const tabInfos = tabID.split('$');
                const menuType = tabInfos[0];
                if (['D', 'S', 'A', 'L', 'M'].indexOf(menuType) > -1) {
                    const menus = $this.prop.work_menus;
                    const menuIndex = menus.findIndex(function (item) { return item.menuID == tabID });
                    if (menuIndex > -1) {
                        $array.removeAt(menus, menuIndex);
                    }
                }

                const tabIFrame = syn.$l.get(tabID + '$i');
                const tabContent = $this.method.getActiveTabContent(tabID);
                if (tabContent) {
                    const contentIframes = tabContent.document.getElementsByTagName('iframe');
                    if (contentIframes && contentIframes.length > 0) {
                        if ($this && $this.closeIframes) {
                            $this.closeIframes(contentIframes);
                        }
                    }

                    if (tabContent.syn) {
                        tabContent.syn.$l.events.flush();
                    }
                    tabContent.close();
                    tabIFrame.src = '';
                }
                syn.$m.remove(tabIFrame);
            }
            catch (error) {
                syn.$l.eventLog('iframe flush', error.toString());
            }

            const iframes = document.querySelectorAll('div#tabContainer [tag="iframe"]');
            const hiddenIframes = Array.from(iframes).filter(iframe => iframe.style.display === 'none');
            if (iframes.length == hiddenIframes.length) {
                $this.event.btnDashBoard_click();
            }
        },

        moduleItem_click(evt) {
            const el = evt.currentTarget;

            const liModules = syn.$l.querySelectorAll('#divModuleTreeMenu li');
            for (let i = 0, length = liModules.length; i < length; i++) {
                syn.$m.removeClass(liModules[i], 'active');
            }

            syn.$m.addClass(el, 'active');

            const tiIcon = el.querySelector('i.ti').className.split(' ').find((item) => { return item.indexOf('ti-') > -1 }) || 'ti-category';
            const title = el.querySelector('span.nav-link-title').textContent;
            const truncateTitle = title.length > 4 ? title.substring(0, 4) + '...' : title;

            syn.$l.querySelector('label[for="btnModuleMenu"]').innerHTML = `<i class="f:18 ti ${tiIcon} mr-1"></i>${truncateTitle}`

            $this.prop.selectedModuleID = el.id.replace('module_basic_', '');

            $this.method.concreateMenuControl('divProgramTreeMenu', 'basic');
            // $this.event.btnDashBoard_click();

            const elFooterAreas = syn.$l.querySelectorAll('div[id*="divFooterArea_"]');
            for (let i = 0, length = elFooterAreas.length; i < length; i++) {
                syn.$m.addClass(elFooterAreas[i], 'hidden');
            }

            const elFooterArea = syn.$l.get('divFooterArea_' + $this.prop.selectedModuleID);
            if (elFooterArea) {
                syn.$m.removeClass(elFooterArea, 'hidden');
            }

            syn.$l.get('btnProgramMenu').click();

            evt.preventDefault();
            evt.stopPropagation();
        },

        navItem_click(evt) {
            const el = evt.currentTarget;
            const menuStyle = 'basic';
            for (let i = 0, length = $this.prop.gnb_nodes.length; i < length; i++) {
                const baseNode = $this.prop.gnb_nodes[i];
                const elGnb = syn.$l.get(`gnb_${menuStyle}_${baseNode.menuID}`);

                if (elGnb) {
                    syn.$m.removeClass(elGnb, 'active');
                }
            }

            syn.$m.addClass(el, 'active');

            if (syn.$m.hasClass(el, 'dropdown') == true) {
                const elDropDownMenu = el.querySelector('.dropdown-menu');

                if (syn.$m.hasClass(elDropDownMenu, 'show') == true) {
                    syn.$m.removeClass(elDropDownMenu, 'show');
                }
                else {
                    syn.$m.addClass(elDropDownMenu, 'show');
                }
            }

            $this.prop.selectedGnbID = el.id;

            evt.preventDefault();
            evt.stopPropagation();
        },

        lnbItem_click(evt) {
            const el = evt.currentTarget;
            const menuDepths = el.id.split('_');
            if (menuDepths.length != 3) {
                return;
            }

            const menuStyle = menuDepths[1];
            const menuID = menuDepths[2];
            const menus = $this.prop.module_menus[$this.prop.selectedModuleID];
            const lnb_node = menus.find(function (item) { return item.menuID == menuID });
            if ($object.isNullOrUndefined(lnb_node) == true) {
                return;
            }

            const baseNode = menus.find(function (item) { return item.menuID == lnb_node.parentMenuID });
            if ($object.isNullOrUndefined(baseNode) == true) {
                return;
            }

            const elGnb = syn.$l.get(`gnb_${menuStyle}_${baseNode.menuID}`);
            if ($this.prop.selectedGnbID != elGnb.id) {
                for (let i = 0, length = $this.prop.gnb_nodes.length; i < length; i++) {
                    const node = $this.prop.gnb_nodes[i];
                    const gnb = syn.$l.get(`gnb_${menuStyle}_${node.menuID}`);

                    if (gnb) {
                        syn.$m.removeClass(gnb, 'active');
                    }
                }

                syn.$m.addClass(elGnb, 'active');
                $this.prop.selectedGnbID = elGnb.id;
            }

            const elLst = syn.$l.get(`lst_${menuStyle}_${menuID}`);
            if (elLst) {
                if (syn.$m.hasClass(elLst, 'show') == true) {
                    syn.$m.removeClass(elLst, 'show');
                }
                else {
                    syn.$m.addClass(elLst, 'show');
                }
            }

            $this.prop.selectedLnbID = el.id;

            evt.preventDefault();
            evt.stopPropagation();
        },

        lstItem_click(evt) {
            const el = evt.currentTarget;

            $this.method.menuItemActive(el);

            evt.preventDefault();
            evt.stopPropagation();
        },

        hlpDataSource_change(el) {
            const elID = el.id;
            switch (elID) {
                case 'divProgramMenu':
                    syn.$l.trigger('btnProgramMenu', 'click');
                    break;
                case 'divFavoriteMenu':
                    syn.$l.trigger('btnFavoriteMenu', 'click');
                    break;
                case 'divHistoryMenu':
                    syn.$w.closeDialog('tplSearchMenu');
                    syn.$l.trigger('btnHistoryMenu', 'click');
                    break;
                case 'lblSearchMenu':
                    syn.$l.trigger('btnSearchMenu', 'click');
                    break;
                case 'btnToggleLeftMenu':
                    syn.$w.closeDialog('tplSearchMenu');
                    syn.$l.trigger($this.prop.lastedTabButtonID, 'click');
                    break;
            }
        },

        hlpDataSource_exit() {
            syn.$l.trigger($this.prop.lastedTabButtonID, 'click');
        },

        btnGuideTour_click(evt) {
            $this.prop.lastedTabButtonID = syn.uicontrols.$radio.getSelectedByID('menuType');
            syn.uicontrols.$guide.introStart('hlpDataSource');
        },

        btnDarkMode_click(evt) {
            if (evt) {
                $this.method.toogleDarkMode();
            }

            const iconEL = syn.$l.get('btnDarkMode').querySelector('i');
            const isDarkMode = (window.localStorage && localStorage.getItem('isDarkMode') == 'true');
            if (isDarkMode == true) {
                syn.$m.removeClass(iconEL, 'ti-moon');
                syn.$m.addClass(iconEL, 'ti-brightness-down');
            }
            else {
                syn.$m.removeClass(iconEL, 'ti-brightness-down');
                syn.$m.addClass(iconEL, 'ti-moon');
            }
        },

        btnUIFunctionSearch_click(evt) {
            $this.method.executeUIFunction('search');
        },

        btnUIFunctionSave_click(evt) {
            $this.method.executeUIFunction('save');
        },

        btnUIFunctionDelete_click(evt) {
            $this.method.executeUIFunction('delete');
        },

        btnUIFunctionPrint_click(evt) {
            $this.method.executeUIFunction('print');
        },

        btnUIFunctionExport_click(evt) {
            $this.method.executeUIFunction('export');
        },

        btnUIAreaVisible_click(evt) {
            const header = syn.$l.querySelector('header');
            const iconEL = syn.$l.get('btnUIAreaVisible').querySelector('i');
            if (syn.$m.hasClass(header, 'hidden') == true) {
                syn.$m.removeClass(iconEL, 'ti-keyboard-show');
                syn.$m.addClass(iconEL, 'ti-keyboard-hide');
                syn.$m.removeClass(header, 'hidden');
            }
            else {
                syn.$m.removeClass(iconEL, 'ti-keyboard-hide');
                syn.$m.addClass(iconEL, 'ti-keyboard-show');
                syn.$m.addClass(header, 'hidden');
            }

            $this.event.window_resize();
        },

        btnUIFunctionRefresh_click(evt) {
            const tabEL = $this.method.getActiveTab();
            if (tabEL) {
                const tabID = tabEL.getAttribute('data-tab-id');
                const pageWindow = $this.method.getActiveTabContent(tabID);
                if (pageWindow) {
                    pageWindow.location.reload();
                }
            }
        },

        btnToogleFavorite_click(evt) {
            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'information';

            const tabEL = $this.method.getActiveTab();
            if (tabEL) {
                syn.$w.alert('즐겨찾기 준비 중입니다.', '즐겨찾기 추가', alertOptions);
            }
            else {
                syn.$w.alert('즐겨찾기에 추가 할 수 없는 화면 입니다.', '즐겨찾기 추가', alertOptions);
            }
        },

        btnEditFavoriteGroup_click() {
            syn.$w.alert('즐겨찾기 준비 중입니다.', '즐겨찾기 편집');
        },

        btnConfirmUpdateFavoriteGroup_click(evt) {
            const updatedData = syn.uicontrols.$auigrid.getValue('grdFavoriteGroup', 'List', {
                Flag: {
                    fieldID: 'Flag',
                    dataType: 'string'
                },
                FavoriteID: {
                    fieldID: 'FavoriteID',
                    dataType: 'string'
                },
                FavoriteName: {
                    fieldID: 'FavoriteName',
                    dataType: 'string'
                },
                SortingNo: {
                    fieldID: 'SortingNo',
                    dataType: 'string'
                },
                CreatedUserNo: {
                    fieldID: 'CreatedUserNo',
                    dataType: 'string'
                }
            });

            if (updatedData.length == 0) {
                syn.$w.alert('수정된 내용이 없습니다.');
                return;
            }

            syn.$w.alert('즐겨찾기 그룹 변경 준비 중입니다.');
        },

        btnConfirmUpdateFavoriteMenu_click(evt) {
            const updatedData = syn.uicontrols.$auigrid.getValue('grdFavoriteMenu', 'List', {
                Flag: {
                    fieldID: 'Flag',
                    dataType: 'string'
                },
                FavoriteID: {
                    fieldID: 'FavoriteID',
                    dataType: 'string'
                },
                SortingNo: {
                    fieldID: 'SortingNo',
                    dataType: 'string'
                },
                CreatedUserNo: {
                    fieldID: 'CreatedUserNo',
                    dataType: 'string'
                }
            });

            if (updatedData.length == 0) {
                syn.$w.alert('수정된 내용이 없습니다.');
                return;
            }

            syn.$w.alert('즐겨찾기 변경 준비 중입니다.');
        },

        async btnConfirmAddFavoriteMenu_click(evt) {
            syn.$w.alert('즐겨찾기 추가 준비 중입니다.');
        },

        btnToggleFavoriteMenu_click(evt, favoriteGroupID) {
            const favoriteGroup = syn.$l.querySelector(`div[data-favorite-group="${favoriteGroupID}"]`);
            let accordionCollapse = favoriteGroup.querySelector('div.accordion-collapse');
            let toggleIcon = favoriteGroup.querySelector('div.accordion-button-toggle i');
            const isMenuOpen = toggleIcon.className.indexOf('ti-chevron-down') > -1;
            if (isMenuOpen == true) {
                syn.$m.removeClass(toggleIcon, 'ti-chevron-down');
                syn.$m.addClass(toggleIcon, 'ti-chevron-up');
                syn.$m.removeClass(accordionCollapse, 'show');
            }
            else {
                syn.$m.addClass(toggleIcon, 'ti-chevron-down');
                syn.$m.removeClass(toggleIcon, 'ti-chevron-up');
                syn.$m.addClass(accordionCollapse, 'show');
            }
        },

        btnEditFavoriteMenu_click(evt, favoriteID) {
            syn.$w.alert('즐겨찾기 편집 준비 중입니다.');

            evt.preventDefault();
            evt.stopPropagation();
        },

        liFavoriteMenu_click(evt, projectID, fileID) {
            const menuNode = $this.method.getTabInfo(projectID, fileID);
            if (menuNode) {
                $this.method.addTabUI(menuNode);
            }
            else {
                syn.$w.alert('메뉴를 조회 할 수 없습니다.');
            }
        },

        grdFavoriteGroup_dropEnd(evt) {
            var items = [];
            var rowIndexes = [];
            var length = syn.uicontrols.$auigrid.countRows('grdFavoriteGroup');
            for (var i = 0; i < length; i++) {
                rowIndexes.push(i);
                items.push({ SortingNo: (i + 1) });
            }
            syn.uicontrols.$auigrid.updateRows('grdFavoriteGroup', items, rowIndexes);
        },

        grdFavoriteMenu_dropEnd(evt) {
            var items = [];
            var rowIndexes = [];
            var length = syn.uicontrols.$auigrid.countRows('grdFavoriteMenu');
            for (var i = 0; i < length; i++) {
                rowIndexes.push(i);
                items.push({ SortingNo: (i + 1) });
            }
            syn.uicontrols.$auigrid.updateRows('grdFavoriteMenu', items, rowIndexes);
        },

        btnAddFavoriteGroup_click() {
            syn.uicontrols.$auigrid.insertRow('grdFavoriteGroup', {
                amount: 1
            }, async function (row) {
                var values = [];
                values.push([row, 'FavoriteID', await syn.$w.newSuid()]);
                values.push([row, 'CreatedUserNo', syn.$w.Variable.UserNo]);

                syn.uicontrols.$auigrid.setDataAtRow('grdFavoriteGroup', values);
                syn.uicontrols.$auigrid.selectCell('grdFavoriteGroup', row, 'FavoriteName');
            });
        },

        btnRemoveFavoriteGroup_click() {
            const activeRow = syn.uicontrols.$auigrid.getActiveRowIndex('grdFavoriteGroup');
            syn.uicontrols.$auigrid.removeRow('grdFavoriteGroup', 'FavoriteName', activeRow);
        },

        btnRemoveFavoriteMenu_click() {
            const activeRow = syn.uicontrols.$auigrid.getActiveRowIndex('grdFavoriteMenu');
            syn.uicontrols.$auigrid.removeRow('grdFavoriteMenu', 'FavoriteName', activeRow);
        },

        btnSearchMenu_click(evt) {
            syn.uicontrols.$auigrid.setValue('grdSearchMenu', $this.prop.module_searchmenus[$this.prop.selectedModuleID]);

            syn.$w.showDialog(syn.$l.get('tplSearchMenu'), {
                minWidth: 480,
                minHeight: 480,
            });
        },

        btnCloseSearchMenu_click(evt) {
            syn.$w.closeDialog();
        },

        grdSearchMenu_cellDoubleClick(evt) {
            const activeRow = syn.uicontrols.$auigrid.getActiveRowIndex('grdSearchMenu');
            const projectID = syn.uicontrols.$auigrid.getDataAtCell('grdSearchMenu', activeRow, 'ProjectID');
            const fileID = syn.uicontrols.$auigrid.getDataAtCell('grdSearchMenu', activeRow, 'FileID');

            const menuNode = $this.method.getTabInfo(projectID, fileID);
            if (menuNode) {
                syn.$w.closeDialog();
                $this.method.addTabUI(menuNode);
            }
            else {
                syn.$w.alert('메뉴를 조회 할 수 없습니다.');
            }
        },

        txtSearchKeyword_keydown(evt) {
            const searchText = syn.$l.get('txtSearchKeyword').value.trim();
            if (searchText.length > 0 && evt.key === 'Enter') {
                syn.$l.get('spnSearchKeyword').textContent = $string.isNullOrEmpty(searchText) == true ? '' : `"${searchText}"`;
                syn.uicontrols.$auigrid.setValue('grdSearchKeyword', []);

                syn.$m.toggleClass('divOffcanvasEnd', 'show');
                syn.$m.toggleClass('divOffCanvasBackdrop', 'hidden');
            }
        },

        grdSearchKeyword_cellDoubleClick(evt) {
            const activeRow = syn.uicontrols.$auigrid.getActiveRowIndex('grdSearchKeyword');
            const keywordID = syn.uicontrols.$auigrid.getDataAtCell('grdSearchKeyword', activeRow, 'KeywordID');

            syn.$w.alert(`${keywordID} 키워드에 대한 연결 문서 정보가 없습니다.`);
        },

        divOffCanvasBackdrop_click(evt) {
            syn.$m.toggleClass('divOffcanvasEnd', 'show');
            syn.$m.toggleClass('divOffCanvasBackdrop', 'hidden');
        },

        btnToggleLeftMenu_click(evt) {
            const navBar = syn.$l.get('navBar');
            const divNavMenu = syn.$l.querySelector('div#divNavMenu');
            const headerNavBar = syn.$l.querySelector('header#hdrNavBar');
            const headerMenuBar = syn.$l.querySelector('header#hdrMenuBar');
            const divPageWrapper = syn.$l.querySelector('div.page-wrapper');
            const footerLayout = syn.$l.querySelector('footer.footer');
            const iconSideMenu = syn.$l.querySelector('#btnToggleLeftMenu i');
            if (syn.$m.hasClass(iconSideMenu, 'ti-layout-sidebar-left-collapse') == true) {
                syn.$m.removeClass(iconSideMenu, 'ti-layout-sidebar-left-collapse');
                syn.$m.addClass(iconSideMenu, 'ti-layout-sidebar-left-expand');

                syn.$m.addClass(navBar, 'hidden');
                syn.$m.removeClass(divNavMenu, 'ml:240px!');
                syn.$m.addClass(headerNavBar, 'ml:0!');
                syn.$m.addClass(headerMenuBar, 'ml:0!');
                syn.$m.addClass(divPageWrapper, 'ml:0!');
                syn.$m.addClass(footerLayout, 'ml:0!');
            }
            else {
                syn.$m.removeClass(iconSideMenu, 'ti-layout-sidebar-left-expand');
                syn.$m.addClass(iconSideMenu, 'ti-layout-sidebar-left-collapse');

                syn.$m.removeClass(navBar, 'hidden');
                syn.$m.addClass(divNavMenu, 'ml:240px!');
                syn.$m.removeClass(headerNavBar, 'ml:0!');
                syn.$m.removeClass(headerMenuBar, 'ml:0!');
                syn.$m.removeClass(divPageWrapper, 'ml:0!');
                syn.$m.removeClass(footerLayout, 'ml:0!');
            }

            $this.method.resizeTabUI();
        }
    },

    method: {
        async tryDevAutoSignIn() {
            try {
                const returnUrl = location.pathname + location.search;
                const response = await fetch(`/wwwroot/api/dev-account/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`, {
                    method: 'GET',
                    redirect: 'follow'
                });

                return response.ok;
            }
            catch (error) {
                return false;
            }
        },

        executeUIFunction(command, tabID) {
            const tabEL = $string.isNullOrEmpty(tabID) == true ? $this.method.getActiveTab() : syn.$l.querySelector(`[data-tab-id="${tabID}"]`);
            if (tabEL) {
                tabID = tabID || tabEL.dataset.tabId;
                const pageWindow = $this.method.getActiveTabContent(tabID);
                if (pageWindow) {
                    const tabInfos = tabID.split('$');
                    const itemID = tabInfos[2];
                    var mod = pageWindow[`$${itemID}`];
                    if (mod && mod.hook['frameEvent']) {
                        mod.hook.frameEvent('buttonCommand', {
                            actionID: command
                        });
                    }
                }
            }
        },

        loadModuleDashboard() {
            let menuNode = null;
            let tabID = '';
            if ($string.isNullOrEmpty($this.prop.selectedModuleID) == false) {
                tabID = '';
                const menus = $this.prop.module_menus[$this.prop.selectedModuleID];
                if ($object.isNullOrUndefined(menus) == false) {
                    menuNode = menus.find(item => item.menuName == `MODULE_DASHBOARD_${$this.prop.selectedModuleID}_${syn.$w.User.ManagerYN}`);
                    if (menuNode) {
                        tabID = `${menuNode.menuType}$${menuNode.projectID}$${menuNode.fileID}$${menuNode.menuID}$${menuNode.parentMenuID}$${$this.prop.selectedModuleID}`;
                    }
                }
            }

            if ($string.isNullOrEmpty(tabID) == false) {
                const tabFrame = syn.$l.get(`${$this.prop.dashboardTabID}${$this.prop.selectedModuleID}$i`);
                if (tabFrame) {
                    if (tabFrame.src == '') {
                        tabFrame.src = `/view/HDS/${menuNode.projectID}/${menuNode.fileID}.html?tabID=${tabID}`;
                    }

                    tabFrame.width = '100%';
                    tabFrame.height = '100%';
                    tabFrame.frameborder = '0';
                    tabFrame.scrolling = 'yes';
                    tabFrame.border = '0';
                    tabFrame.hspace = '0';
                    tabFrame.vspace = '0';
                    tabFrame.setAttribute('allowfullscreen', 'allowfullscreen');
                    tabFrame.setAttribute('tag', 'iframe');
                    tabFrame.style.border = 0;
                    tabFrame.style.display = 'block';

                    const pageWrapper = document.querySelector('.page-wrapper');
                    if (pageWrapper) {
                        const frameHeight = syn.$d.getDocumentSize().frameHeight;
                        const headerHeight = syn.$d.getSize(syn.$l.querySelector('header')).offsetHeight;
                        const footerHeight = syn.$d.getSize(syn.$l.querySelector('footer')).offsetHeight;
                        const scrollHeight = frameHeight - (((syn.$m.hasClass(syn.$l.querySelector('header'), 'hidden') == true) ? headerHeight : 56) + footerHeight + 76);
                        tabFrame.height = scrollHeight;
                        tabFrame.style.height = `${scrollHeight}px`;
                    }

                    const pageWindow = $this.method.getActiveTabContent(`${$this.prop.dashboardTabID}${$this.prop.selectedModuleID}`);
                    if (pageWindow && pageWindow.syn) {
                        const pageScript = pageWindow[pageWindow.syn.$w.pageScript];

                        $this.method.tabUIResizing(pageScript, tabFrame);
                    }
                }
            }
        },

        toogleDarkMode() {
            if (window.localStorage) {
                const isDarkMode = (window.localStorage && localStorage.getItem('isDarkMode') == 'true');
                const urlFlag = '?darkMode=' + (!isDarkMode).toString();
                if (isDarkMode == false) {
                    localStorage.setItem('isDarkMode', true);

                    if (window.DarkReader) {
                        DarkReader.enable({
                            brightness: 100,
                            contrast: 90,
                            sepia: 10
                        });

                        const tabHeaders = syn.$l.querySelectorAll('[data-tab-id]');
                        for (let i = 0, length = tabHeaders.length; i < length; i++) {
                            const tabID = tabHeaders[i].getAttribute('data-tab-id');
                            const pageWindow = $this.method.getActiveTabContent(tabID);
                            if (pageWindow) {
                                const contentIframes = pageWindow.document.getElementsByTagName('iframe');
                                if (contentIframes && contentIframes.length > 0) {
                                    $this.method.applyIframesDarkMode(contentIframes, true);
                                }

                                if (pageWindow.syn) {
                                    const pageWebform = pageWindow.syn.$w;
                                    if (pageWebform) {
                                        pageWebform.loadStyle('/css/dark_mode.css' + urlFlag, 'dark_mode');
                                    }

                                    const pageScript = pageWindow[pageWindow.syn.$w.pageScript];
                                    if (pageScript && pageScript.hook && pageScript.hook.frameEvent) {
                                        pageScript.hook.frameEvent('darkModeChanging', {
                                            isDarkMode: !isDarkMode
                                        });
                                    }
                                }

                                if (pageWindow.DarkReader) {
                                    pageWindow.DarkReader.enable({
                                        brightness: 100,
                                        contrast: 90,
                                        sepia: 10
                                    });
                                }
                            }
                        }
                    }
                }
                else {
                    localStorage.setItem('isDarkMode', false);

                    if (window.DarkReader) {
                        DarkReader.disable();

                        const tabHeaders = syn.$l.querySelectorAll('[data-tab-id]');
                        for (let i = 0, length = tabHeaders.length; i < length; i++) {
                            const tabID = tabHeaders[i].getAttribute('data-tab-id');
                            const pageWindow = $this.method.getActiveTabContent(tabID);
                            if (pageWindow) {
                                const contentIframes = pageWindow.document.getElementsByTagName('iframe');
                                if (contentIframes && contentIframes.length > 0) {
                                    $this.method.applyIframesDarkMode(contentIframes, false);
                                }

                                if (pageWindow.syn) {
                                    const pageManipulation = pageWindow.syn.$m;
                                    const pageLibrary = pageWindow.syn.$l;
                                    if (pageManipulation) {
                                        pageManipulation.remove(pageLibrary.get('dark_mode'));
                                    }

                                    const pageScript = pageWindow[pageWindow.syn.$w.pageScript];
                                    if (pageScript && pageScript.hook && pageScript.hook.frameEvent) {
                                        pageScript.hook.frameEvent('darkModeChanging', {
                                            isDarkMode: !isDarkMode
                                        });
                                    }
                                }

                                if (pageWindow.DarkReader) {
                                    pageWindow.DarkReader.disable();
                                }
                            }
                        }
                    }
                }
            }
        },

        applyIframesDarkMode(iframes, isDarkMode) {
            if (iframes) {
                for (let i = 0; i < iframes.length; i++) {
                    const iframe = iframes[i];
                    const contentDocument = iframe.contentDocument;
                    const contentWindow = iframe.contentWindow;

                    const contentIframes = contentDocument.getElementsByTagName('iframe');
                    if (contentIframes && contentIframes.length > 0) {
                        $this.method.applyIframesDarkMode(contentIframes, isDarkMode);
                    }

                    if (contentWindow.syn) {
                        const pageManipulation = contentWindow.syn.$m;
                        const pageLibrary = contentWindow.syn.$l;
                        if (pageManipulation) {
                            pageManipulation.remove(pageLibrary.get('dark_mode'));
                        }

                        const pageScript = contentWindow[contentWindow.syn.$w.pageScript];
                        if (pageScript && pageScript.hook && pageScript.hook.frameEvent) {
                            pageScript.hook.frameEvent('darkModeChanging', {
                                isDarkMode: !isDarkMode
                            });
                        }
                    }

                    if (contentWindow.DarkReader && syn.$m.hasClass(iframe, 'tox-edit-area__iframe') == false) {
                        if (isDarkMode == true) {
                            contentWindow.DarkReader.enable({
                                brightness: 100,
                                contrast: 90,
                                sepia: 10
                            });
                        }
                        else {
                            contentWindow.DarkReader.disable();
                        }
                    }
                }
            }
        },

        menuItemActive(el) {
            syn.$w.closeDialog();

            const menuDepths = el.id.split('_');
            if (menuDepths.length != 3) {
                return;
            }

            const menuID = menuDepths[2];
            const menus = $this.prop.module_menus[$this.prop.selectedModuleID];
            const menuNode = menus.find(function (item) { return item.menuID == menuID });
            if ($object.isNullOrUndefined(menuNode) == true) {
                return;
            }

            const lnb_node = menus.find(function (item) { return item.menuID == menuNode.parentMenuID });
            if ($object.isNullOrUndefined(lnb_node) == true) {
                return;
            }

            const baseNode = menus.find(function (item) { return item.menuID == lnb_node.parentMenuID });
            if ($object.isNullOrUndefined(baseNode) == true) {
                return;
            }

            const elGnb = syn.$l.get(`gnb_${menuDepths[1]}_${baseNode.menuID}`);
            if ($this.prop.selectedGnbID != elGnb.id) {
                for (let i = 0, length = $this.prop.gnb_nodes.length; i < length; i++) {
                    const node = $this.prop.gnb_nodes[i];
                    const gnb = syn.$l.get(`gnb_${menuDepths[1]}_${node.menuID}`);

                    if (gnb) {
                        syn.$m.removeClass(gnb, 'active');
                    }
                }

                syn.$m.addClass(elGnb, 'active');
                $this.prop.selectedGnbID = elGnb.id;
            }

            const prevEL = syn.$l.querySelector('span.dropdown-item.bg-primary');
            if (prevEL != null) {
                syn.$m.removeClass(prevEL, 'bg-primary');
            }
            syn.$m.addClass(el, 'bg-primary');

            $this.method.addTabUI(menuNode);
        },

        addWorkTabUI(workTabID, title, buttons, url, options) {
            if ($string.isNullOrEmpty(workTabID) == true || $string.isNullOrEmpty(title) == true || $string.isNullOrEmpty(url) == true) {
                syn.$w.alert('업무 탭을 열 수 있는 필수 항목 확인 필요', '정보');
                return;
            }

            options = syn.$w.argumentsExtend({
                uiType: 'L', // D: document, A: approval, S: share, L: link, U: UI, M: 모듈
                callback: null
            }, options);

            options.uiType = options.uiType.toUpperCase();

            const tabWorkInfos = $string.split(workTabID, '$');
            const menuID = tabWorkInfos[3];
            const parentMenuID = tabWorkInfos[4];

            let tabID = workTabID;

            if ($string.toBoolean(options.fixedID) == false) {
                if ($string.isNullOrEmpty(options.uniqueID) == false) {
                    tabID = tabID + '$' + options.uniqueID;
                }
                else {
                    tabID = tabID + '$' + syn.$l.random();
                }
            }

            if (syn.$l.querySelector(`[data-tab-id="${tabID}"]`)) {
                $this.method.focusTabUI(tabID);
                return;
            }

            let tabIcon = `/img/logo.svg`;
            if (options.uiType == 'D' || options.uiType == 'A' || options.uiType == 'S' || options.uiType == 'L') {
                tabIcon = `/img/worktab-icon-${options.uiType}.svg`;
            }

            buttons = syn.$w.argumentsExtend({
                FnSearch: 'N',
                FnSave: 'N',
                FnDelete: 'N',
                FnPrint: 'N',
                FnExport: 'N',
                FnRefresh: 'N'
            }, buttons);

            const menuNode = {
                tabID: tabID,
                menuID: menuID,
                menuName: title,
                parentMenuID: `${parentMenuID}`,
                moduleName: null,
                showYN: 'Y',
                menuType: options.uiType,
                functions: `${(buttons.FnSearch == 'Y' ? '|search' : '')}${(buttons.FnSave == 'Y' ? '|save' : '')}${(buttons.FnDelete == 'Y' ? '|delete' : '')}${(buttons.FnPrint == 'Y' ? '|print' : '')}${(buttons.FnExport == 'Y' ? '|export' : '')}${(buttons.FnRefresh == 'Y' ? '|refresh' : '')}`,
                projectID: options.projectID,
                fileID: options.fileID,
                url: url,
                depth: 3,
                icon: null,
                badge: null,
                sortingNo: 1
            };

            if ($this.prop.work_menus.findIndex(function (item) { return item.menuID == menuID }) == -1) {
                $this.prop.work_menus.push(menuNode);
            }

            $this.prop.chromeTabs.addTab({
                id: tabID,
                title: menuNode.menuName,
                favicon: tabIcon
            }, {
                animate: false
            });
        },

        addTabUI(menuNode, callback) {
            if ($object.isNullOrUndefined(menuNode) == true) {
                syn.$w.alert('메뉴 정보가 올바르지 않습니다', '정보');
                return;
            }

            const menuType = menuNode.menuType;
            const projectID = menuNode.projectID;
            const projectType = menuNode.projectType;
            const fileID = menuNode.fileID;
            const menuID = menuNode.menuID;
            const parentMenuID = menuNode.parentMenuID;

            const tabID = ''.concat(menuType, '$', projectID, '$', fileID, '$', menuID, '$', parentMenuID, '$', $this.prop.selectedModuleID);
            if (syn.$l.querySelector(`[data-tab-id="${tabID}"]`)) {
                $this.method.focusTabUI(tabID, true);
                if (callback) {
                    callback(tabID);
                }
                return;
            }

            if (callback) {
                menuNode.callback = callback;
            }

            let tabIcon = `/img/logo.svg`;
            if (menuType == 'F') {
                tabIcon = `/img/tab-icon-${projectType}.svg`;
            }

            $this.prop.chromeTabs.addTab({
                id: tabID,
                title: menuNode.menuName,
                favicon: tabIcon
            }, {
                animate: false
            });
        },

        closeTabID(tabID, isForce) {
            const tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`);
            if (tabEl) {
                $this.prop.chromeTabs.removeTab(tabEl);
            }
        },

        closeTabUI(projectID, itemID) {
            const tabID = $this.method.getActiveTabID(projectID, fileID);
            if ($string.isNullOrEmpty(tabID) == false) {
                $this.method.closeTabID(tabID);
            }
        },

        closeIframes(iframes) {
            if (iframes) {
                for (let i = 0; i < iframes.length; i++) {
                    const iframe = iframes[i];
                    const contentDocument = iframe.contentDocument;
                    const contentWindow = iframe.contentWindow;

                    const contentIframes = contentDocument.getElementsByTagName('iframe');
                    if (contentIframes && contentIframes.length > 0) {
                        if ($this && $this.closeIframes) {
                            $this.closeIframes(contentIframes);
                        }
                    }

                    if (contentWindow.syn) {
                        contentWindow.syn.$l.events.flush();
                    }
                    contentWindow.close();
                    iframe.src = '';
                    syn.$m.remove(iframe);
                }
            }
        },

        closeAllTabUI() {
            const tabHeaders = syn.$l.querySelectorAll('[data-tab-id]');
            for (let i = tabHeaders.length; i > 0; i--) {
                const tabID = tabHeaders[i].getAttribute('data-tab-id');
                $this.method.closeTabUI(tabID, true);
            }
        },

        getActiveTab() {
            return $this.prop.chromeTabs.activeTabEl;
        },

        getTabInfo(projectID, fileID) {
            let result = null;
            const menus = $this.prop.module_menus[$this.prop.selectedModuleID];
            const findNodes = menus.filter(function (item) { return item.projectID == projectID && item.fileID == fileID });
            if (findNodes.length > 0) {
                result = findNodes[0];
            }

            return result;
        },

        openMenuFromQuery() {
            const menuID = new URLSearchParams(location.search).get('menuID');
            if ($string.isNullOrEmpty(menuID) == true) {
                return;
            }

            const menuParts = menuID.split('|');
            if (menuParts.length != 2) {
                syn.$l.eventLog('openMenuFromQuery', 'menuID 매개변수 형식이 올바르지 않습니다. (예: menuID=디렉토리ID|파일ID)');
                return;
            }

            const projectID = menuParts[0];
            const fileID = menuParts[1];

            let targetModuleID = null;
            let menuNode = null;
            for (const moduleID in $this.prop.module_menus) {
                const menus = $this.prop.module_menus[moduleID];
                const findNode = menus.find(function (item) { return item.projectID == projectID && item.fileID == fileID; });
                if (findNode) {
                    targetModuleID = moduleID;
                    menuNode = findNode;
                    break;
                }
            }

            if ($object.isNullOrUndefined(menuNode) == true) {
                syn.$l.eventLog('openMenuFromQuery', '메뉴를 조회 할 수 없습니다.');
                return;
            }

            if (targetModuleID != $this.prop.selectedModuleID) {
                const moduleEL = syn.$l.get(`module_basic_${targetModuleID}`);
                if (moduleEL) {
                    moduleEL.click();
                }
            }

            $this.method.addTabUI(menuNode);
        },

        getActiveTabID(projectID, fileID) {
            let tabID = '';
            const tab = syn.$l.querySelector('div[class="chrome-tab"] [data-tab-id*="' + projectID + '$' + fileID + '"]');

            if (tab) {
                tabID = tab.getAttribute('data-tab-id');
            }

            return tabID;
        },

        getActiveTabContent(tabID) {
            const currentTab = syn.$l.get(tabID + '$i');
            let contentWindow = null;

            if (currentTab) {
                contentWindow = currentTab.contentWindow;
            }

            return contentWindow;
        },

        focusTabUI(tabID, isAddTab) {
            const tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`);
            if (tabEl) {
                $this.prop.chromeTabs.setCurrentTab(tabEl);
            }
            else {
                return;
            }

            const tabFrames = syn.$l.querySelectorAll('div#tabContainer [tag="iframe"]');
            const tabInfos = tabID.split('$');
            const menuType = tabInfos[0];
            const projectID = tabInfos[1];
            const fileID = tabInfos[2];
            const menuID = tabInfos[3];
            const parentMenuID = tabInfos[4];
            const moduleID = tabInfos[5];

            let activeTabID = '';
            let tabFrame = null;
            for (let i = 0, l = tabFrames.length; i < l; i++) {
                tabFrame = tabFrames[i];
                if (syn.$m.getStyle(tabFrame, 'display') === 'block') {
                    activeTabID = tabFrame.id;
                    break;
                }
            }

            if (isAddTab == true) {
                const recentMenu = {
                    MenuType: menuType,
                    DirectoryID: projectID,
                    ItemID: fileID,
                    MenuID: menuID,
                    MenuName: tabEl.querySelector('.chrome-tab-title').textContent,
                    ParentMenuID: parentMenuID,
                    ParentMenuName: '',
                    ModuleID: moduleID,
                    MenuOpenTime: $date.toString(new Date, 't').substring(0, 5)
                };

                const menus = $this.prop.module_menus[moduleID];
                if (menus) {
                    const parentMenuNode = menus.find(function (item) { return item.menuID == parentMenuID });
                    if ($object.isNullOrUndefined(parentMenuNode) == false) {
                        recentMenu.ParentMenuName = parentMenuNode.menuName;
                    }

                    const baseMenuNode = menus.find(function (item) { return item.menuID == parentMenuNode.parentMenuID });
                    if ($object.isNullOrUndefined(baseMenuNode) == false) {
                        recentMenu.ParentMenuName = `${baseMenuNode.menuName} > ${parentMenuNode.menuName}`;
                    }
                }

                const existMenu = $this.prop.recentMenus.find((item) => { return item.MenuID == recentMenu.MenuID && item.MenuOpenTime == recentMenu.MenuOpenTime });
                if ($object.isNullOrUndefined(existMenu) == true) {
                    $this.method.addRecentMenus(recentMenu);
                }
            }

            const pageWindow = $this.method.getActiveTabContent(tabID);
            if (pageWindow && pageWindow.syn) {
                if (pageWindow.syn.$w.isProgress == true) {
                    $this.prop.buttonAction = false;
                }
                else {
                    $this.prop.buttonAction = true;
                }
            }

            $this.method.refreshUIButtons(tabID);

            const focusTabID = tabID + '$i';
            if (activeTabID != focusTabID) {
                if (activeTabID) {
                    const activeTabEl = syn.$l.get(activeTabID);
                    if (activeTabEl != null) {
                        syn.$m.setStyle(activeTabEl, 'display', 'none');
                    }
                }

                if (focusTabID) {
                    const focusTabFrame = syn.$l.get(focusTabID);
                    if (focusTabFrame != null) {
                        syn.$m.setStyle(focusTabFrame, 'display', 'block');
                    }
                }
            }

            syn.$m.removeClass('divUIDefaultButton', 'hidden');
            window.focus();

            try {
                if (pageWindow && pageWindow.syn && pageWindow.syn.$w) {
                    const pageScript = pageWindow[pageWindow.syn.$w.pageScript];

                    if (pageScript && pageWindow.syn.uicontrols && pageWindow.syn.uicontrols.$grid) {
                        for (let i = 0; i < pageWindow.syn.uicontrols.$grid.gridControls.length; i++) {
                            pageWindow.syn.uicontrols.$grid.gridControls[i].hot.render();
                        }
                    }

                    $this.method.tabUIVisibleChanged(pageScript, true);
                    pageWindow.syn.$w.setTabContentHeight();
                }
            }
            catch (error) {
                syn.$l.eventLog('focusTabUI', error.toString());
            }

            if (menuType == 'F') {
                const fancyNode = syn.uicontrols.$tree.getControl('tvlTreeView').tree.findFirst((node) => {
                    return node.data.menuType == menuType
                        && node.data.projectID == projectID
                        && node.data.fileID == fileID
                        && node.data.menuID == menuID
                        && node.data.parentMenuID == parentMenuID;
                });

                if (fancyNode) {
                    fancyNode.setActive(true);
                }
            }
        },

        executeUIButtonCommand(pageScript, actionID, tabID, actionButton) {
            const pageWindow = $this.method.getActiveTabContent(tabID);
            if (pageWindow && pageScript && actionButton.action) {
                if (pageScript && pageWindow.syn.uicontrols && pageWindow.syn.uicontrols.$grid && pageWindow.syn.uicontrols.$grid.gridControls) {
                    for (let i = 0; i < pageWindow.syn.uicontrols.$grid.gridControls.length; i++) {
                        const gridControl = pageWindow.syn.uicontrols.$grid.gridControls[i];
                        gridControl.value.passSelectCellEvent = true;
                        const value = gridControl.value;
                        if (value) {
                            gridControl.hot.selectCell(value.previousRow, value.previousCol);
                        }
                        delete gridControl.value.passSelectCellEvent;
                    }
                }

                const contentIframes = pageWindow.document.getElementsByTagName('iframe');
                if (contentIframes) {
                    for (let i = 0; i < contentIframes.length; i++) {
                        const contentIframe = contentIframes[i];
                        const innerModule = contentIframe.contentWindow['$this'];
                        if (innerModule) {
                            if (innerModule.$auigrid && innerModule.$auigrid.gridControls) {
                                for (let i = 0; i < innerModule.$auigrid.gridControls.length; i++) {
                                    const gridControl = innerModule.$auigrid.gridControls[i];
                                    gridControl.value.passSelectCellEvent = true;
                                    const value = gridControl.value;
                                    if (value) {
                                        gridControl.hot.selectCell(value.previousRow, value.previousCol);
                                    }
                                    delete gridControl.value.passSelectCellEvent;
                                }
                            }
                        }
                    }
                }

                actionButton.action.call(pageScript, actionID, tabID);
            }
        },

        tabUIVisibleChanged(pageScript, isVisible) {
            if (pageScript && pageScript.hook.pageVisible) {
                pageScript.hook.pageVisible(isVisible);
            }
        },

        tabUIVisibleChanging(pageScript, sourceTabID, storageKey) {
            if (pageScript && pageScript.hook.frameEvent) {
                pageScript.hook.frameEvent('storegeChanging', {
                    sourceTabID: sourceTabID,
                    storageKey: storageKey
                });
            }
        },

        tabUIResizing(pageScript, tabFrame) {
            if (pageScript && pageScript.hook.pageResizing) {
                const tabSize = tabFrame && syn.$d.getSize(tabFrame);
                const dimension = {
                    windowWidth: $this.prop.windowWidth,
                    windowHeight: $this.prop.windowHeight,
                    tabWidth: (tabSize && tabSize.width) || ($this.prop.tabFrameSize && $this.prop.tabFrameSize.width) || $this.prop.windowWidth,
                    tabHeight: (tabSize && tabSize.height) || ($this.prop.tabFrameSize && $this.prop.tabFrameSize.height) || $this.prop.windowHeight
                };

                pageScript.hook.pageResizing(dimension);
            }
        },

        tabUIClosed(pageScript) {
            let result = true;
            if (pageScript && pageScript.hook.pageClosed) {
                const isClosed = pageScript.hook.pageClosed();
                result = $object.isBoolean(isClosed) ? isClosed : true;
            }

            return result;
        },

        tabUISessionClosed(pageScript) {
            if (pageScript && pageScript.hook.frameEvent) {
                pageScript.hook.frameEvent('sessionDestroy');
            }
        },

        refreshUIButtons(tabID, actionButtons) {
            if (tabID) {
                const tabInfos = tabID.split('$');
                const menuType = tabInfos[0];
                const menuID = tabInfos[3];
                const moduleID = tabInfos[5];

                syn.$l.get('btnUIFunctionSearch').disabled = true;
                syn.$l.get('btnUIFunctionSave').disabled = true;
                syn.$l.get('btnUIFunctionDelete').disabled = true;
                syn.$l.get('btnUIFunctionPrint').disabled = true;
                syn.$l.get('btnUIFunctionExport').disabled = true;
                syn.$l.get('btnUIFunctionRefresh').disabled = false;

                const moduleMenus = $this.prop.module_menus[moduleID];
                if ($object.isNullOrUndefined(moduleMenus) == false) {
                    let menuItem = moduleMenus.find(function (item) { return item.menuID == menuID });
                    if (menuItem == null) {
                        menuItem = $this.prop.work_menus.find(function (item) { return item.menuID == menuID });
                    }

                    if (menuItem) {
                        const functions = $array.split(menuItem.functions, '|');
                        for (let i = 0; i < functions.length; i++) {
                            const functionName = $string.capitalize(functions[i]);
                            const button = syn.$l.get(`btnUIFunction${functionName}`);
                            if (button) {
                                button.disabled = false;
                            }
                        }
                    }
                }

                const tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`)
                if ($object.isNullOrUndefined(actionButtons) == true) {
                    actionButtons = tabEl.actionButtons;
                }

                if ($object.isNullOrUndefined(actionButtons) == true) {
                    actionButtons = [];
                }

                tabEl.actionButtons = actionButtons;

                const divActionButtons = syn.$l.get('divActionButtons');
                syn.$w.purge(divActionButtons);
                divActionButtons.innerHTML = '';
                for (let i = 0; i < actionButtons.length; i++) {
                    const actionButton = actionButtons[i];
                    const button = syn.$m.create({
                        id: 'fab_' + actionButton.command,
                        tag: 'button',
                        className: `btn ${($string.isNullOrEmpty(actionButton.class) == true ? '' : actionButton.class)}`
                    });

                    button.type = 'button';

                    if ($string.isNullOrEmpty(actionButton.disabled) == false && $string.toBoolean(actionButton.disabled) == true) {
                        button.disabled = 'disabled';
                    }

                    if ($string.isNullOrEmpty(actionButton.hidden) == false && $string.toBoolean(actionButton.hidden) == true) {
                        syn.$m.addClass(button, 'hide!');
                    }
                    else {
                        syn.$m.removeClass(button, 'hide!');
                    }

                    if ($string.isNullOrEmpty(actionButton.text) == true) {
                        button.innerHTML = `<i class="f:18 ti ti-${actionButton.icon}"></i>`;
                    }
                    else {
                        button.innerHTML = `<i class="f:18 ti ti-${actionButton.icon} mr:4"></i> ${actionButton.text}`;
                    }

                    if (actionButton.action) {
                        syn.$l.addEvent(button, 'click', actionButton.action);
                    }

                    syn.$m.appendChild(divActionButtons, button);
                }
            }
        },

        resizeTabUI() {
            const currentTab = syn.$l.querySelector('.chrome-tab[active]');
            const tabFrames = syn.$l.querySelectorAll('#tabContainer [tag="iframe"]');

            for (let i = 0, l = tabFrames.length; i < l; i++) {
                tabFrames[i].resizeReady = true;
            }

            if (currentTab) {
                try {
                    const tabID = currentTab.getAttribute('data-tab-id');
                    const tabFrame = parent.syn.$l.get(`${tabID}$i`);
                    if (tabFrame) {
                        const pageWindow = $this.method.getActiveTabContent(tabID);

                        if (pageWindow && pageWindow.syn) {
                            const pageScript = pageWindow[pageWindow.syn.$w.pageScript];

                            $this.method.tabUIResizing(pageScript, tabFrame);
                        }
                        syn.$l.get(tabID + '$i').resizeReady = false;
                    }
                }
                catch (error) {
                }
            }
            else {
                $this.method.loadModuleDashboard();
            }
        },

        addRecentMenus(recentMenu) {
            $this.prop.recentMenus.push(recentMenu);

            if ($this.prop.recentMenus.length > 50) {
                $this.prop.recentMenus.shift();
            }
        },

        concreateModuleControl(elID, menus, group) {
            const orderSortFunction = function (a, b) {
                if (a.sortingNo > b.sortingNo) {
                    return 1;
                }
                if (a.sortingNo < b.sortingNo) {
                    return -1;
                }
                return 0;
            };

            const root_node = menus.find(function (item) { return item.parentMenuID == null });
            if ($object.isNullOrUndefined(root_node) == true) {
                syn.$l.eventLog('concreateModuleControl', 'root 메뉴 정보 확인 필요', 'Error');
                return;
            }

            const module_nodes = menus.filter(function (item) { return item.parentMenuID == root_node.menuID }).sort(orderSortFunction);

            const elLnbMenus = syn.$l.get(elID);
            const navList = syn.$m.create({
                tag: 'ul',
                className: 'navbar-nav'
            });

            for (let i = 0, gnbLength = module_nodes.length; i < gnbLength; i++) {
                const baseNode = module_nodes[i];

                if ($string.isNullOrEmpty(baseNode.showYN) == false && baseNode.showYN == 'N') {
                    continue;
                }

                const navItem = syn.$m.create({
                    id: `module_${group}_${baseNode.menuID}`,
                    tag: 'li',
                    className: 'nav-item'
                });

                syn.$l.addEvent(navItem, 'click', $this.event.moduleItem_click);

                const navLink = syn.$m.create({
                    tag: 'div',
                    className: 'nav-link'
                });

                if ($string.isNullOrEmpty(baseNode.icon) == true) {
                    baseNode.icon = 'border-none';
                }

                const navIcon = syn.$m.create({
                    tag: 'span',
                    className: 'nav-link-icon d-md-none d-lg-inline-block',
                    html: `<i class="f:18 ti ti-${baseNode.icon}"></i>`
                });

                const navTitle = syn.$m.create({
                    tag: 'span',
                    className: 'nav-link-title'
                });

                navTitle.textContent = baseNode.menuName;

                syn.$m.appendChild(navLink, navIcon);
                syn.$m.appendChild(navLink, navTitle);
                syn.$m.appendChild(navItem, navLink);

                syn.$m.addClass(navItem, 'dropdown');

                syn.$m.appendChild(navList, navItem);
            }

            syn.$m.appendChild(elLnbMenus, navList);
        },

        concreateMenuControl(elID, group) {
            for (let i = 0; i < $this.prop.modules.length; i++) {
                const module = $this.prop.modules[i];
                const elNav = syn.$l.get(`nav_${group}_${module.menuID.toLowerCase()}`);
                if (elNav) {
                    syn.$m.addClass(elNav, 'hidden');
                }
            }

            const elNavMenu = syn.$l.get(`nav_${group}_${$this.prop.selectedModuleID.toLowerCase()}`);
            if (elNavMenu) {
                syn.$m.removeClass(elNavMenu, 'hidden');
                return;
            }

            const menus = $this.prop.module_menus[$this.prop.selectedModuleID];
            if ($object.isNullOrUndefined(menus) == true) {
                syn.$l.eventLog('concreateMenuControl', `${$this.prop.selectedModuleID} 메뉴 정보 확인 필요`, 'Error');
                return;
            }

            const orderSortFunction = function (a, b) {
                if (a.sortingNo > b.sortingNo) {
                    return 1;
                }
                if (a.sortingNo < b.sortingNo) {
                    return -1;
                }
                return 0;
            };

            const nameSortFunction = function (a, b) {
                if (a.menuName > b.menuName) {
                    return 1;
                }
                if (a.menuName < b.menuName) {
                    return -1;
                }
                return 0;
            };
            const root_node = menus.find(function (item) { return item.parentMenuID == null });
            if ($object.isNullOrUndefined(root_node) == true) {
                syn.$l.eventLog('concreateMenuControl', 'root 항목 정보 확인 필요', 'Error');
                return;
            }

            $this.prop.gnb_nodes = menus.filter(function (item) { return item.parentMenuID == root_node.menuID }).sort(orderSortFunction);
            $this.prop.search_nodes = menus.filter(function (item) { return item.menuType == 'U' }).sort(nameSortFunction);

            const elLnbMenus = syn.$l.get(elID);
            const navList = syn.$m.create({
                id: `nav_${group}_${$this.prop.selectedModuleID.toLowerCase()}`,
                tag: 'ul',
                className: 'navbar-nav'
            });

            for (let i = 0, gnbLength = $this.prop.gnb_nodes.length; i < gnbLength; i++) {
                const baseNode = $this.prop.gnb_nodes[i];

                if ($string.isNullOrEmpty(baseNode.showYN) == false && baseNode.showYN == 'N') {
                    continue;
                }

                const navItem = syn.$m.create({
                    id: `gnb_${group}_${baseNode.menuID}`,
                    tag: 'li',
                    className: 'nav-item'
                });

                syn.$l.addEvent(navItem, 'click', $this.event.navItem_click);

                const navLink = syn.$m.create({
                    tag: 'div',
                    className: 'nav-link'
                });

                if ($string.isNullOrEmpty(baseNode.icon) == true) {
                    baseNode.icon = 'point-filled';
                }

                const navIcon = syn.$m.create({
                    tag: 'span',
                    className: 'nav-link-icon d-md-none d-lg-inline-block',
                    html: `<i class="f:18 ti ti-${baseNode.icon}"></i>`
                });

                const navTitle = syn.$m.create({
                    tag: 'span',
                    className: 'nav-link-title'
                });

                navTitle.textContent = baseNode.menuName;

                syn.$m.appendChild(navLink, navIcon);
                syn.$m.appendChild(navLink, navTitle);
                syn.$m.appendChild(navItem, navLink);

                if (baseNode.menuType == 'D') {
                    syn.$m.addClass(navItem, 'dropdown');
                    syn.$m.addClass(navLink, 'dropdown-toggle');

                    const lnb_nodes = menus.filter(function (item) { return item.parentMenuID == baseNode.menuID }).sort(orderSortFunction);
                    if (lnb_nodes.length > 0) {
                        const dropDownMenu = syn.$m.create({
                            tag: 'div',
                            className: 'dropdown-menu'
                        });

                        const dropDownColumns = syn.$m.create({
                            tag: 'div',
                            className: 'dropdown-menu-columns'
                        });

                        const dropDownColumn = syn.$m.create({
                            tag: 'div',
                            className: 'dropdown-menu-column'
                        });

                        for (let j = 0, lnbLength = lnb_nodes.length; j < lnbLength; j++) {
                            const lnb_node = lnb_nodes[j];

                            if ($string.isNullOrEmpty(lnb_node.showYN) == false && lnb_node.showYN == 'N') {
                                continue;
                            }

                            const lnbItem = syn.$m.create({
                                id: `lnb_${group}_${lnb_node.menuID}`,
                                tag: 'span',
                                className: 'dropdown-item',
                                text: lnb_node.menuName
                            });

                            syn.$l.addEvent(lnbItem, 'click', $this.event.lnbItem_click);

                            if ($string.isNullOrEmpty(lnb_node.badge) == false) {
                                const badge = syn.$m.create({
                                    tag: 'span',
                                    className: 'badge badge-sm bg-blue-lt ms-auto',
                                    text: lnb_node.badge
                                });

                                syn.$m.appendChild(lnbItem, badge);
                            }

                            if (lnb_node.menuType == 'D') {
                                const dropEnd = syn.$m.create({
                                    tag: 'div',
                                    className: 'dropend'
                                });

                                syn.$m.addClass(lnbItem, 'dropdown-toggle');

                                syn.$m.appendChild(dropEnd, lnbItem);

                                const lst_nodes = menus.filter(function (item) { return item.parentMenuID == lnb_node.menuID }).sort(orderSortFunction);
                                if (lst_nodes.length > 0) {
                                    const lstDropDownMenu = syn.$m.create({
                                        id: `lst_${group}_${lnb_node.menuID}`,
                                        tag: 'div',
                                        className: 'dropdown-menu'
                                    });

                                    for (let k = 0, lstLength = lst_nodes.length; k < lstLength; k++) {
                                        const menuNode = lst_nodes[k];

                                        if ($string.isNullOrEmpty(menuNode.showYN) == false && menuNode.showYN == 'N') {
                                            continue;
                                        }

                                        const lstItem = syn.$m.create({
                                            id: `lst_${group}_${menuNode.menuID}`,
                                            tag: 'span',
                                            className: 'dropdown-item',
                                            text: menuNode.menuName
                                        });

                                        syn.$l.addEvent(lstItem, 'click', $this.event.lstItem_click);

                                        if ($string.isNullOrEmpty(menuNode.badge) == false) {
                                            const badge = syn.$m.create({
                                                tag: 'span',
                                                className: 'badge badge-sm bg-blue-lt ms-auto',
                                                text: lnb_node.badge
                                            });

                                            syn.$m.appendChild(lstItem, badge);
                                        }

                                        syn.$m.appendChild(lstDropDownMenu, lstItem);
                                    }

                                    syn.$m.appendChild(dropEnd, lstDropDownMenu);
                                }
                                syn.$m.appendChild(dropDownColumn, dropEnd);
                            }
                            else {
                                syn.$m.appendChild(dropDownColumn, lnbItem);
                            }
                        }

                        syn.$m.appendChild(dropDownColumns, dropDownColumn);
                        syn.$m.appendChild(dropDownMenu, dropDownColumns);

                        syn.$m.appendChild(navItem, dropDownMenu);
                    }
                }

                syn.$m.appendChild(navList, navItem);
            }

            syn.$m.appendChild(elLnbMenus, navList);
        },

        getWindowHeight(isCurrentWindow) {
            let result = 600;
            let context = top.window;
            if ($object.isNullOrUndefined(isCurrentWindow) == false && $string.toBoolean(isCurrentWindow) == true) {
                context = window;
            }

            if (context.innerHeight) {
                result = context.innerHeight;
            }
            else {
                if (context.document.body && context.document.body.offsetHeight) {
                    result = context.document.body.offsetHeight;
                }
                else if (context.document.compatMode == 'CSS1Compat' && context.document.documentElement && context.document.documentElement.offsetHeight) {
                    result = context.document.documentElement.offsetHeight;
                }
            }

            return result;
        },

        getWindowWidth(isCurrentWindow) {
            let result = 1100;
            let context = top.window;
            if ($object.isNullOrUndefined(isCurrentWindow) == false && $string.toBoolean(isCurrentWindow) == true) {
                context = window;
            }

            if (window.innerWidth) {
                result = window.innerWidth;
            }
            else {
                if (context.document.body && context.document.body.offsetWidth) {
                    result = context.document.body.offsetWidth;
                }
                else if (context.document.compatMode == 'CSS1Compat' && context.document.documentElement && context.document.documentElement.offsetWidth) {
                    result = context.document.documentElement.offsetWidth;
                }
            }

            return result;
        },

        setStatusMessage(tabID, val) {
            const tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`)
            if (tabEl) {
                tabEl.statusMessage = val;
                const el = syn.$l.querySelector('.statusSection .status');
                if (el) {
                    el.innerText = val;
                }
            }
        },

        async logout(message) {
            $this.method.stopSessionTimer();

            syn.$r.deleteCookie(`HandStack.TokenID`, '/');
            syn.$r.deleteCookie(`HandStack.Cookies`, '/');
            syn.$r.deleteCookie(`HandStack.Member`, '/');
            syn.$r.deleteCookie(`HandStack.Variable`, '/');
            syn.$r.deleteCookie(`HandStack.BearerToken`, '/');

            syn.$r.httpRequest('GET', `/account/logout`);
            syn.$w.removeStorage(`HandStack.tokenID`, true);
            sessionStorage.clear();

            if ($string.isNullOrEmpty(message) == true) {
                message = '로그아웃 준비 중입니다.';
            }

            const alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'success';
            alertOptions.buttonType = '1';
            syn.$w.alert(message, 'System Logout', alertOptions);
        },

        isConnectedSession() {
            if ($this.prop.timerRunning) {
                if (syn.$r.getCookie(`HandStack.Variable`) == null || syn.$r.getCookie(`HandStack.Member`) == null || syn.$r.getCookie(`HandStack.BearerToken`) == null) {
                    $this.prop.cookieCheckTryCount = $this.prop.cookieCheckTryCount + 1;
                    if ($this.prop.cookieCheckTryCount > 3) {
                        $this.method.stopSessionTimer();
                        $this.method.logout('보안상의 이유로 HandStack 액세스 토큰이 만료되었습니다. HandStack에 다시 로그인해야 합니다');
                    }
                    else {
                        syn.$l.eventLog('isConnectedSession failure', 'cookieCheckTryCount - {0}'.format($this.prop.cookieCheckTryCount), 'Information');

                        if (syn.Config.Environment == 'Development') {
                            syn.$l.eventLog('cookie', `HandStack.Variable - {0}`.format(syn.$r.getCookie(`HandStack.Variable`)), 'Information');
                            syn.$l.eventLog('cookie', `HandStack.Member - {0}`.format(syn.$r.getCookie(`HandStack.Member`)), 'Information');
                            syn.$l.eventLog('cookie', `HandStack.BearerToken - {0}`.format(syn.$r.getCookie(`HandStack.BearerToken`)), 'Information');
                            syn.$l.eventLog('storage', 'apiServices - {0}'.format(syn.$w.getStorage('apiServices', false)), 'Information');
                            syn.$l.eventLog('storage', 'member - {0}'.format(syn.$w.getStorage('member', false)), 'Information');
                            syn.$l.eventLog('storage', 'variable - {0}'.format(syn.$w.getStorage('variable', false)), 'Information');
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
        },

        getTreeNodeTabID(node) {
            let result = null;
            if (node && node.data) {
                const item = node.data;

                const menuType = item.menuType;
                const projectID = item.projectID;
                const fileID = item.fileID;
                const menuID = item.menuID;
                const parentMenuID = item.parentMenuID;

                result = ''.concat(menuType, '$', projectID, '$', fileID, '$', menuID, '$', parentMenuID);
            }

            return result;
        },

        keyEventHandler() {
            if (keyboardEvent && documentEvent && (keyboardEvent === documentEvent)) {
                const el = documentEvent.target || documentEvent.srcElement || null;

                switch (documentEvent.keyCode) {
                    case 13: // ENTER
                        return true;
                        break;
                    case 9: // TAB
                        return true;
                        break;
                    case 27: // ESC
                        if (keyboardEvent && keyboardEvent.view && keyboardEvent.view.syn.$w) {
                            if (keyboardEvent.view.syn.$w.transactionLoaderID == null) {
                                const uiContext = keyboardEvent.view;
                                const el = uiContext.syn.$w.activeControl();

                                if (el && uiContext.syn && uiContext.syn.uicontrols) {
                                    if (el.id) {
                                        if (uiContext.syn.uicontrols.$colorpicker) {
                                            const colorControl = uiContext.syn.uicontrols.$colorpicker.getControl(el.id);
                                            if (colorControl) {
                                                if (colorControl.picker.visible == true) {
                                                    colorControl.picker.exit();
                                                }
                                            }
                                        }

                                        if (syn.uicontrols.$datepicker) {
                                            const dateControl = syn.uicontrols.$datepicker.getControl(el.id);
                                            if (dateControl) {
                                                if (dateControl.picker.isVisible() == true) {
                                                    dateControl.picker.hide();
                                                }
                                            }
                                        }
                                    }
                                }

                                if (uiContext.syn.$w.isShowAlert == true) {
                                    uiContext.syn.$w.closeAlertDialog();
                                    return false;
                                }

                                if (uiContext.syn.$w.isShowDialog == true) {
                                    uiContext.syn.$w.closeDialog();
                                    return false;
                                }

                                if (uiContext.parent.syn.$w.isShowAlert == true) {
                                    uiContext.parent.syn.$w.closeAlertDialog();
                                    return false;
                                }

                                if (uiContext.parent.syn.$w.isShowDialog == true) {
                                    uiContext.parent.syn.$w.closeDialog();
                                    return false;
                                }

                                if (uiContext.syn.$w.channels) {
                                    const channels = uiContext.syn.$w.channels;
                                    const channelCount = channels.length;
                                    if (channelCount == 0) {
                                        for (let i = 0; i < 10; i++) {
                                            uiContext = uiContext.parent;
                                            channels = uiContext.syn.$w.channels;
                                            channelCount = channels.length;

                                            if (channelCount > 0) {
                                                break;
                                            }
                                        }
                                    }

                                    if (channelCount > 0) {
                                        const channel = uiContext.syn.$w.channels[(channelCount - 1)];
                                        const isCloseButton = (channel.windowHandle.find('.horizbuts').length > 0 && channel.windowHandle.find('.horizbuts')[0].style.display != 'none');

                                        if (isCloseButton == true) {
                                            const elID = uiContext.syn.$w.channels[(channelCount - 1)].elID;
                                            if (channelCount > 1) {
                                                const baseELID = uiContext.syn.$w.channels[(channelCount - 2)].elID;
                                                uiContext.$('#' + baseELID).WM_raise();
                                            }

                                            uiContext.syn.$w.windowClose(elID);
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case 121: // F10
                        if (documentEvent.ctrlKey == true && documentEvent.shiftKey == true) {
                            const alertOptions = $object.clone(syn.$w.alertOptions);
                            alertOptions.minWidth = 600;
                            alertOptions.stack = JSON.stringify(syn.$w.User);
                            $w.alert('로그인 사용자 정보', '정보', alertOptions);
                        }
                        break;
                    case 8: // Backspace 이전
                        if (el != null) {
                            let tagName = el.tagName;
                            if (tagName) {
                                tagName = tagName.toUpperCase();

                                if (tagName == 'INPUT') {
                                    return true;
                                }
                            }
                        }
                }

                return false;
            }
        },

        shortcutUITrigger() {
            if (documentEvent) {
                if (documentEvent.keyCode == 113 || (documentEvent.ctrlKey == true && documentEvent.altKey == true && documentEvent.shiftKey == false)) {
                    window.focus();
                    let tabID = null;
                    const tabEL = $this.method.getActiveTab();
                    if (tabEL) {
                        try {
                            tabID = tabEL.getAttribute('data-tab-id');
                            const pageWindow = $this.method.getActiveTabContent(tabID);
                            if (pageWindow) {
                                const pageWebform = pageWindow.syn.$w;
                                if (pageWebform && pageWebform.transactionLoaderID == null) {
                                    const pageScript = pageWindow[pageWebform.pageScript];
                                    let actionID = null;
                                    switch (documentEvent.keyCode) {
                                        case 68: // 삭제 D
                                            actionID = syn.$l.get('btnUIFunctionDelete').disabled == true ? null : 'delete';
                                            break;
                                        case 113: // 조회 F2
                                        case 70: // 조회 F
                                            actionID = syn.$l.get('btnUIFunctionSearch').disabled == true ? null : 'search';
                                            break;
                                        case 82: // 화면 새로고침 R
                                            actionID = syn.$l.get('btnUIFunctionSearch').disabled == true ? null : 'refresh';
                                            break;
                                        case 83: // 저장 S
                                            actionID = syn.$l.get('btnUIFunctionRefresh').disabled == true ? null : 'save';
                                            break;
                                        case 80: // 출력 P
                                            actionID = syn.$l.get('btnUIFunctionPrint').disabled == true ? null : 'print';
                                            break;
                                        case 69: // 파일 내보내기 E
                                            actionID = syn.$l.get('btnUIFunctionExport').disabled == true ? null : 'export';
                                            break;
                                    }

                                    if ([68, 113, 70, 82, 83, 80, 69].indexOf(documentEvent.keyCode) > -1) {
                                        if ($string.isNullOrEmpty(actionID) == false) {
                                            $this.method.executeUIFunction(actionID);
                                        }
                                    }
                                    else if ($string.isNullOrEmpty(actionID) == false) {
                                        const tabEl = syn.$l.querySelector(`[data-tab-id="${tabID}"]`);
                                        if ($object.isNullOrUndefined(tabEl.actionButtons) == false) {
                                            const actionButton = tabEl.actionButtons.find(item => syn.$k.getKeyCode(item.keyName) == documentEvent.keyCode);
                                            if (actionButton) {
                                                if (actionButton.command == 'refresh') {
                                                    pageWindow.location.reload();
                                                    return;
                                                }

                                                $this.method.executeUIButtonCommand(pageScript, actionButton.command, tabID, actionButton);
                                            }
                                        }
                                    }
                                    else {
                                        return true;
                                    }
                                }
                            }
                        }
                        catch (error) {
                            syn.$l.eventLog('shortcutUITrigger', error, 'Error');
                        }
                    }
                    return false;
                }
            }
        },

        numericUITrigger() {
            if (documentEvent) {
                if (documentEvent.ctrlKey == true && documentEvent.altKey == true && documentEvent.shiftKey == false) {
                    const index = documentEvent.keyCode - 49;
                    const tabEL = syn.$l.querySelectorAll('div.chrome-tab')[index];
                    if (tabEL) {
                        window.focus();
                        const tabID = tabEL.getAttribute('data-tab-id');
                        $this.method.focusTabUI(tabID);
                    }
                    return false;
                }
            }
        },

        linkExecute(storageKey) {
            const storageValue = syn.$w.getStorage(storageKey, true);
            if ($object.isNullOrUndefined(storageValue) == false) {
                const linkData = JSON.parse(syn.$c.base64Decode(storageValue));
                const index = syn.$w.Variable.CONCURRENTCOMPANYNO.split(',').indexOf(linkData.ReceiverCompanyNo);
                if (index > -1 && syn.$w.User.UserID == linkData.ReceiverID) {
                    const menus = $this.prop.module_menus[linkData.ModuleID];
                    if (menus) {
                        const menu = menus.find(function (item) {
                            return item.projectID == linkData.BusinessID
                                && item.fileID == linkData.TransactionID
                        });

                        if ($object.isNullOrUndefined(menu) == false) {
                            const url = `/view/HDS/{0}/{1}.html?linkUrl=Y`.format(linkData.BusinessID, linkData.TransactionID) + linkData.Parameters;
                            parent.$this.method.addWorkTabUI('{0}${1}${2}${3}'.format(linkData.TransactionID, linkData.ReceiverCompanyNo, 'LINK', syn.$l.random()), linkData.UITabName, {
                                FnSearch: menu.FnSearch,
                                FnSave: menu.FnSave,
                                FnDelete: menu.FnDelete,
                                FnPrint: menu.FnPrint,
                                FnExport: menu.FnExport,
                            }, url, {
                                uiType: 'L',
                                uniqueID: linkData.UniqueID
                            });
                        }
                    }
                }

                setTimeout(() => {
                    syn.$w.removeStorage(storageKey, true);
                }, 200);
            }
        },

        drawHtmlTemplate(elID, templateID, dataSource, prefixHtml) {
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

        loadFavoriteMenu() {
            syn.$l.eventLog('$this.method.loadFavoriteMenu', '즐겨찾기 조회 준비 중입니다.', 'Information');
        },

        loadRecentMenu() {
            const dataSource = {
                historyMenus: $this.prop.recentMenus
            };

            $this.method.drawHtmlTemplate('divHistoryList', 'tplHistoryMenuItem', dataSource);
        },

        applyColorClassesToOptions(elID) {
            const el = syn.$l.get(elID);
            const options = el.querySelectorAll('option');

            options.forEach(option => {
                let hexColor = option.value;
                if (!hexColor || hexColor.length < 4 || hexColor.charAt(0) !== '#') {
                    return;
                }

                hexColor = hexColor.substring(1);
                if (hexColor.length === 3) {
                    hexColor = hexColor.split('').map(char => char + char).join('');
                }

                if (hexColor.length !== 6) {
                    return;
                }

                option.classList.add(`bg:#${hexColor}`);

                const r = parseInt(hexColor.substring(0, 2), 16);
                const g = parseInt(hexColor.substring(2, 4), 16);
                const b = parseInt(hexColor.substring(4, 6), 16);
                const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
                const threshold = 0.4;

                if (luma < threshold) {
                    option.classList.add('f:#F7F7F7');
                }
            });
        }
    }
}
