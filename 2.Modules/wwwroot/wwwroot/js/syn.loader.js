(async function () {
    var systemVersion = '1.0.0';
    var getCookie = function (id) {
        var start = document.cookie.indexOf(id + '=');
        var len = start + id.length + 1;

        if ((!start) && (id != document.cookie.substring(0, id.length))) {
            start = null;
            len = null;
            return null;
        }

        if (start == -1) {
            start = null;
            len = null;
            return null;
        }

        var end = document.cookie.indexOf(';', len);

        if (end == -1) {
            end = document.cookie.length;
        }

        return decodeURIComponent(document.cookie.substring(len, end));
    }

    var backgroundColor = '#ed1c23';
    var style = document.createElement('style');
    style.innerHTML = '.pl-container{position:absolute;top:0;left:0;background-color:#fff;width:100vw;height:100vh;z-index:999}.pl-cube-grid{position:absolute;left:50%;top:50%;margin:-20px 0 0 -20px;width:40px;height:40px}.pl-cube-grid .pl-cube{width:33%;height:33%;background-color:' + backgroundColor + ';float:left;-webkit-animation:pl-cubeGridScaleDelay 1.3s infinite ease-in-out;animation:pl-cubeGridScaleDelay 1.3s infinite ease-in-out}.pl-cube-grid .pl-cube1{-webkit-animation-delay:.2s;animation-delay:.2s}.pl-cube-grid .pl-cube2{-webkit-animation-delay:.3s;animation-delay:.3s}.pl-cube-grid .pl-cube3{-webkit-animation-delay:.4s;animation-delay:.4s}.pl-cube-grid .pl-cube4{-webkit-animation-delay:.1s;animation-delay:.1s}.pl-cube-grid .pl-cube5{-webkit-animation-delay:.2s;animation-delay:.2s}.pl-cube-grid .pl-cube6{-webkit-animation-delay:.3s;animation-delay:.3s}.pl-cube-grid .pl-cube7{-webkit-animation-delay:0s;animation-delay:0s}.pl-cube-grid .pl-cube8{-webkit-animation-delay:.1s;animation-delay:.1s}.pl-cube-grid .pl-cube9{-webkit-animation-delay:.2s;animation-delay:.2s}@-webkit-keyframes pl-cubeGridScaleDelay{0%,100%,70%{-webkit-transform:scale3D(1,1,1);transform:scale3D(1,1,1)}35%{-webkit-transform:scale3D(0,0,1);transform:scale3D(0,0,1)}}@keyframes pl-cubeGridScaleDelay{0%,100%,70%{-webkit-transform:scale3D(1,1,1);transform:scale3D(1,1,1)}35%{-webkit-transform:scale3D(0,0,1);transform:scale3D(0,0,1)}}.wtBorder{background-color:' + backgroundColor + ' !important;}';
    document.head.appendChild(style);

    var agent = navigator.userAgent.toLowerCase();
    var isIE = (agent.indexOf('trident') != -1) || (agent.indexOf("msie") != -1);
    if (isIE == true) {
        var html = 'Internet Explorer 지원이 종료되었습니다.<br /><a href="https://www.google.co.kr/chrome" target="_blank">Chrome</a> 또는 <a href="https://www.microsoft.com/edge" target="_blank">Microsoft Edge</a> 웹 브라우저를 사용하세요.';
        document.body.innerHTML = '';
        var page = document.createElement('div');
        page.innerHTML = html;
        document.body.appendChild(page);
        return;
    }

    document.onkeydown = function (evt) {
        if (evt.ctrlKey == true && evt.altKey == true && evt.shiftKey == true) {
            if (evt.keyCode == '68') {
                if (window.parent && window.parent.$w && window.parent.$w.pageScript == '$main') {
                    window.parent.$main.toogleDarkMode();
                }
                else {
                    var isDarkMode = (localStorage.getItem('isDarkMode') == 'true');
                    var urlFlag = '?darkMode=' + (!isDarkMode).toString();
                    if (isDarkMode == false) {
                        localStorage.setItem('isDarkMode', true);

                        syn.$w.loadStyle('/css/dark_mode.css' + urlFlag, 'dark_mode');
                    }
                    else {
                        localStorage.setItem('isDarkMode', false);

                        syn.$m.remove(syn.$l.get('dark_mode'));
                    }
                }
            }
            else if (evt.keyCode == '69') {
                if (window.parent && window.parent.$w && window.parent.$w.pageScript == '$main') {
                    window.parent.$main.toogleDeveloperMode();
                }
                else {
                    window.synConfigName = sessionStorage.getItem('synConfigName') || 'syn.config.json';
                    if (window.synConfigName == 'syn.config.json') {
                        sessionStorage.setItem('synConfigName', 'syn.config.dev.json');
                    }
                    else {
                        sessionStorage.setItem('synConfigName', 'syn.config.json');
                    }
                }
            }
        }
    }

    window.synLoader = {
        name: 'syn.synLoader',
        version: '1.0.0',
        resources: [],
        templateFiles: [],
        scriptFiles: [],
        styleFiles: [],
        start: (new Date()).getTime(),
        logTimer: null,
        logCount: 0,
        assetsCachingID: '',
        noCache: '',
        currentLoadedCount: 0,
        styleLoadedCount: 0,
        remainLoadedCount: 0,
        isEnableModuleLogging: sessionStorage.getItem('EnableModuleLogging') === 'true',

        endsWith(str, suffix) {
            if (str === null || suffix === null) {
                return false;
            }
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        },

        loadFiles: async function () {
            synLoader.currentLoadedCount = 0;
            synLoader.remainLoadedCount = synLoader.scriptFiles.length + synLoader.styleFiles.length;

            function finishLoad() {
                if (synLoader.remainLoadedCount === synLoader.currentLoadedCount) {
                    synLoader.loadCallback();
                }

                if (synLoader.styleLoadedCount >= synLoader.styleFiles.length) {
                    window.pageStyleLoaded = true;
                }
            }

            if (synLoader.templateFiles.length > 0) {
                for (var i = 0; i < synLoader.templateFiles.length; i++) {
                    var templateFile = synLoader.templateFiles[i];
                    var templateObject = synLoader.toUrlObject(templateFile);
                    var id = templateObject.id || 'id_' + Math.random().toString(8);
                    await synLoader.loadText(id, templateFile);
                }
            }

            for (var i = 0; i < synLoader.styleFiles.length; i++) {
                synLoader.eventLog('request', 'loading style ' + url);

                var url = synLoader.styleFiles[i];
                if (synLoader.assetsCachingID != '' && url.indexOf('/view/') == -1) {
                    url = url + (url.indexOf('?') > -1 ? '&' : '?') + synLoader.assetsCachingID;
                }
                else if (synLoader.noCache != '') {
                    url = url + (url.indexOf('?') > -1 ? '&' : '?') + synLoader.noCache;
                }

                var style = document.createElement('link');
                style.rel = 'stylesheet';
                style.type = 'text/css';
                style.href = url;
                style.async = 'async';

                if (url.indexOf('dark_mode') > -1) {
                    style.id = 'dark_mode';
                }

                style.onload = function (evt) {
                    synLoader.eventLog('loaded', 'loaded style: ' + evt.target.href);
                    synLoader.currentLoadedCount++;
                    synLoader.styleLoadedCount++;
                    finishLoad();
                };
                style.onerror = function (evt) {
                    synLoader.eventLog('load error', 'loaded fail style: ' + evt.target.href);
                    synLoader.currentLoadedCount++;
                    synLoader.styleLoadedCount++;
                    finishLoad();
                };

                document.head.appendChild(style);
            }

            if (synLoader.scriptFiles.length > 0) {
                synLoader.loadScript(0);
            }

            if (synLoader.styleFiles.length == 0) {
                window.pageStyleLoaded = true;
            }
        },

        loadScript(i) {
            synLoader.eventLog('request', 'loading script ' + synLoader.scriptFiles[i]);

            var loadNextScript = function () {
                var nextIndex = i + 1;
                if (nextIndex < synLoader.scriptFiles.length) {
                    synLoader.loadScript(nextIndex);
                }
                else {
                    synLoader.loadCallback();
                }
            };

            var url = synLoader.scriptFiles[i];
            if (synLoader.assetsCachingID != '' && url.indexOf('/view/') == -1) {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + synLoader.assetsCachingID;
            }
            else if (synLoader.noCache != '') {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + synLoader.noCache;
            }

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.async = 'async';
            script.onload = function (evt) {
                synLoader.eventLog('loaded', 'Loaded script: ' + evt.target.src);
                synLoader.currentLoadedCount++;

                loadNextScript();
            };
            script.onerror = function (evt) {
                synLoader.eventLog('load error', 'Loaded fail script: ' + evt.target.src);
                synLoader.currentLoadedCount++;

                loadNextScript();
            };

            document.body.appendChild(script);
        },

        loadText: async function (id, url) {
            if (synLoader.assetsCachingID != '' && url.indexOf('/view/') == -1) {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + synLoader.assetsCachingID;
            }
            else if (synLoader.noCache != '') {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + synLoader.noCache;
            }

            var response = await fetch(url);
            if (response.status !== 200) {
                if (response.status == 0) {
                    synLoader.eventLog('$w.loadText', 'X-Requested transfort error');
                }
                else {
                    synLoader.eventLog('$w.loadText', 'response status - {0}' + response.statusText + await response.text());
                }
                return;
            }

            var script = document.createElement('script');
            script.id = id;
            script.type = 'text/html';
            script.async = 'async';
            script.innerHTML = await response.text();

            var head;
            if (document.getElementsByTagName('head')) {
                head = document.getElementsByTagName('head')[0];
            }
            else {
                document.documentElement.insertBefore(document.createElement('head'), document.documentElement.firstChild);
                head = document.getElementsByTagName('head')[0];
            }

            head.appendChild(script);
        },

        toUrlObject(url) {
            return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1), a;
            }, {});
        },

        request: async function (resources) {
            resources = resources.filter(item => item !== null && item !== undefined);
            var length = resources.length;
            for (var i = 0; i < length; ++i) {
                var resource = resources[i];
                if (synLoader.endsWith(resource, '.css')) {
                    synLoader.styleFiles.push(resource);
                }
                else if (synLoader.endsWith(resource, '.js')) {
                    synLoader.scriptFiles.push(resource);
                }
                else if (resource.indexOf('/template/') > -1 || resource.indexOf('/TPL') > -1) {
                    synLoader.templateFiles.push(resource);
                }
                else {
                    synLoader.eventLog('unknown filetype', resource);
                }
            }

            if (window.synConfigName == 'syn.config.json') {
                var moduleFile = '';
                if (window.moduleFile) {
                    moduleFile = window.moduleFile;
                }
                else {
                    var pathname = location.pathname;
                    if (pathname.split('/').length > 0) {
                        moduleFile = pathname.split('/')[location.pathname.split('/').length - 1];
                        moduleFile = moduleFile.split('.').length == 2 ? (moduleFile.indexOf('.') > -1 ? moduleFile.substring(0, moduleFile.indexOf('.')) : moduleFile) : '';
                    }
                }

                if (moduleFile.length > 0 && window['$' + moduleFile] == undefined) {
                    var fileName = moduleFile.indexOf('.js') > -1 ? moduleFile : moduleFile + '.js';
                    if (synLoader.scriptFiles.find(function (p) { return p === fileName; }) === undefined) {
                        synLoader.scriptFiles.push(fileName);
                    }
                }
            }

            await synLoader.loadFiles();
        },

        sleep(ms) {
            return new Promise((r) => setTimeout(r, ms));
        },

        definedResources() {
            var result = [];
            var synControlList = [];
            var synControls = document.querySelectorAll('[tag^="syn_"],[syn-datafield],[syn-options],[syn-events]');
            for (var i = 0; i < synControls.length; i++) {
                var synControl = synControls[i];
                if (synControl.tagName) {
                    var tagName = synControl.tagName.toUpperCase();
                    var controlType = '';
                    var moduleName = null;

                    if (tagName.indexOf('SYN_') > -1) {
                        moduleName = tagName.substring(4).toLowerCase();
                        controlType = moduleName;
                    }
                    else {
                        switch (tagName) {
                            case 'BUTTON':
                                moduleName = 'button';
                                controlType = 'button';
                                break;
                            case 'INPUT':
                                controlType = (synControl.getAttribute('type') || 'text').toLowerCase();
                                switch (controlType) {
                                    case 'hidden':
                                    case 'text':
                                    case 'password':
                                    case 'color':
                                    case 'email':
                                    case 'number':
                                    case 'search':
                                    case 'tel':
                                    case 'url':
                                        moduleName = 'textbox';
                                        break;
                                    case 'submit':
                                    case 'reset':
                                    case 'button':
                                        moduleName = 'button';
                                        break;
                                    case 'radio':
                                        moduleName = 'radio';
                                        break;
                                    case 'checkbox':
                                        moduleName = 'checkbox';
                                        break;
                                }
                                break;
                            case 'TEXTAREA':
                                moduleName = 'textarea';
                                controlType = 'textarea';
                                break;
                            case 'SELECT':
                                if (synControl.getAttribute('multiple') == null) {
                                    moduleName = 'select';
                                    controlType = 'select';
                                }
                                else {
                                    moduleName = 'multiselect';
                                    controlType = 'multiselect';
                                }
                                break;
                            default:
                                moduleName = 'element';
                                controlType = 'element';
                                break;
                        }
                    }

                    if (moduleName) {
                        synControlList.push({
                            module: moduleName,
                            type: controlType ? controlType : synControl.tagName.toLowerCase()
                        });
                    }
                }
            }

            result = synControlList.filter(function (control, idx, arr) {
                return synControlList.findIndex(function (item) {
                    return item.module === control.module && item.type === control.type;
                }) === idx;
            });

            result.unshift({
                module: 'before-default',
                type: 'before-default',
                css: [
                    '/lib/tabler-core/dist/css/tabler.css',
                    '/lib/tabler-icons-webfont/dist/tabler-icons.css',
                    '/js/notifier/notifier.css',
                    '/js/jquery-ui-contextmenu/jquery-ui.css'
                ],
                js: [
                    '/lib/tabler-core/dist/js/tabler.min.js',
                    '/lib/jquery/jquery.js',
                    '/js/jquery.alertmodal/jquery.alertmodal.js',
                    '/lib/jquery-simplemodal/src/jquery.simplemodal.js',
                    '/js/jquery-wm/jquery.WM.js',
                    '/js/jquery-ui-contextmenu/jquery-ui.js',
                    '/js/jquery-ui-contextmenu/jquery.ui-contextmenu.js',
                    '/lib/nanobar/nanobar.js',
                    '/js/notifier/notifier.js',
                    '/lib/clipboard.js/clipboard.js',
                    '/lib/mustache/mustache.js',
                    '/js/syn.js'
                ]
            });

            for (var i = 0; i < result.length; i++) {
                var item = result[i];

                switch (item.module) {
                    case 'textbox':
                        item.css = ['/uicontrols/TextBox/TextBox.css'];
                        item.js = [
                            '/lib/jquery.maskedinput/jquery.maskedinput.js',
                            '/lib/ispin/dist/ispin.js',
                            '/lib/superplaceholder/superplaceholder.js',
                            '/lib/vanilla-masker/vanilla-masker.min.js',
                            '/uicontrols/TextBox/TextBox.js'
                        ];
                        break;
                    case 'button':
                        item.css = ['/uicontrols/TextButton/TextButton.css'];
                        item.js = ['/uicontrols/TextButton/TextButton.js'];
                        break;
                    case 'radio':
                        item.css = ['/uicontrols/RadioButton/RadioButton.css'];
                        item.js = ['/uicontrols/RadioButton/RadioButton.js'];
                        break;
                    case 'checkbox':
                        item.css = [
                            '/js/css-checkbox/checkboxes.css',
                            '/uicontrols/CheckBox/CheckBox.css'
                        ];
                        item.js = ['/uicontrols/CheckBox/CheckBox.js'];
                        break;
                    case 'textarea':
                        item.css = [
                            '/lib/codemirror/codemirror.css',
                            '/uicontrols/TextArea/TextArea.css'
                        ];
                        item.js = [
                            '/lib/codemirror/codemirror.js',
                            '/uicontrols/TextArea/TextArea.js'
                        ];
                        break;
                    case 'select':
                        item.css = [
                            '/lib/tail.select.js/css/default/tail.select-light.css',
                            '/uicontrols/DropDownList/DropDownList.css'
                        ];
                        item.js = [
                            '/lib/tail.select.js/js/tail.select.js',
                            '/uicontrols/DropDownList/DropDownList.js'
                        ];
                        break;
                    case 'multiselect':
                        item.css = [
                            '/lib/tail.select.js/css/default/tail.select-light.css',
                            '/uicontrols/DropDownCheckList/DropDownCheckList.css'
                        ];
                        item.js = [
                            '/lib/tail.select.js/js/tail.select.js',
                            '/uicontrols/DropDownCheckList/DropDownCheckList.js'
                        ];
                        break;
                    case 'chart':
                        item.css = [
                            '/uicontrols/Chart/Chart.css'
                        ];
                        item.js = [
                            '/lib/highcharts/highcharts.js',
                            '/uicontrols/Chart/Chart.js'
                        ];
                        break;
                    case 'chartjs':
                        item.css = [
                            '/uicontrols/Chart/ChartJS.css'
                        ];
                        item.js = [
                            '/lib/chart.js/chart.umd.js',
                            '/uicontrols/Chart/ChartJS.js'
                        ];
                        break;
                    case 'codepicker':
                        item.css = ['/uicontrols/CodePicker/CodePicker.css'];
                        item.js = ['/uicontrols/CodePicker/CodePicker.js'];
                        break;
                    case 'colorpicker':
                        item.css = [
                            '/js/color-picker/color-picker.css',
                            '/uicontrols/ColorPicker/ColorPicker.css'
                        ];
                        item.js = [
                            '/js/color-picker/color-picker.js',
                            '/uicontrols/ColorPicker/ColorPicker.js'
                        ];
                        break;
                    case 'contextmenu':
                        item.css = [
                            '/js/jquery-ui-contextmenu/jquery-ui.css',
                            '/uicontrols/ContextMenu/ContextMenu.css'
                        ];
                        item.js = [
                            '/js/jquery-ui-contextmenu/jquery-ui.js',
                            '/js/jquery-ui-contextmenu/jquery.ui-contextmenu.js',
                            '/uicontrols/ContextMenu/ContextMenu.js'
                        ];
                        break;
                    case 'data':
                        item.css = ['/uicontrols/DataSource/DataSource.css'];
                        item.js = ['/uicontrols/DataSource/DataSource.js'];
                        break;
                    case 'datepicker':
                        item.css = [
                            '/lib/pikaday/css/pikaday.css',
                            '/uicontrols/TextBox/TextBox.css',
                            '/uicontrols/DatePicker/DatePicker.css'
                        ];
                        item.js = [
                            '/lib/jquery.maskedinput/jquery.maskedinput.js',
                            '/lib/ispin/dist/ispin.js',
                            '/lib/moment.js/moment.js',
                            '/lib/pikaday/pikaday.js',
                            '/lib/superplaceholder/superplaceholder.js',
                            '/uicontrols/TextBox/TextBox.js',
                            '/uicontrols/DatePicker/DatePicker.js'
                        ];
                        break;
                    case 'dateperiodpicker':
                        item.css = [
                            '/lib/pikaday/css/pikaday.css',
                            '/uicontrols/TextBox/TextBox.css',
                            '/uicontrols/DatePeriodPicker/DatePeriodPicker.css'
                        ];
                        item.js = [
                            '/lib/jquery.maskedinput/jquery.maskedinput.js',
                            '/lib/ispin/dist/ispin.js',
                            '/lib/moment.js/moment.js',
                            '/lib/pikaday/pikaday.js',
                            '/lib/superplaceholder/superplaceholder.js',
                            '/uicontrols/TextBox/TextBox.js',
                            '/uicontrols/DatePeriodPicker/DatePeriodPicker.js'
                        ];
                        break;
                    case 'fileclient':
                        item.css = ['/uicontrols/FileClient/FileClient.css'];
                        item.js = ['/uicontrols/FileClient/FileClient.js'];
                        break;
                    case 'list':
                        item.css = ['/uicontrols/GridList/GridList.css'];
                        item.js = [
                            '/js/datatable/datatables.js',
                            '/js/datatable/dataTables.checkboxes.js',
                            '/uicontrols/GridList/GridList.js'
                        ];
                        break;
                    case 'htmleditor':
                        item.css = [
                            '/uicontrols/FileClient/FileClient.css',
                            '/uicontrols/HtmlEditor/HtmlEditor.css'
                        ];
                        item.js = [
                            '/uicontrols/FileClient/FileClient.js',
                            '/uicontrols/HtmlEditor/HtmlEditor.js'
                        ];
                        break;
                    case 'jsoneditor':
                        item.css = ['/uicontrols/JsonEditor/JsonEditor.css'];
                        item.js = ['/uicontrols/JsonEditor/JsonEditor.js'];
                        break;
                    case 'organization':
                        item.css = [
                            '/lib/orgchart/css/jquery.orgchart.css',
                            '/uicontrols/OrganizationView/OrganizationView.css'
                        ];
                        item.js = [
                            '/lib/orgchart/js/jquery.orgchart.js',
                            '/uicontrols/OrganizationView/OrganizationView.js'
                        ];
                        break;
                    case 'sourceeditor':
                        item.css = ['/uicontrols/SourceEditor/SourceEditor.css'];
                        item.js = ['/uicontrols/SourceEditor/SourceEditor.js'];
                        break;
                    case 'editor':
                        item.css = ['/uicontrols/TextEditor/TextEditor.css'];
                        item.js = ['/uicontrols/TextEditor/TextEditor.js'];
                        break;
                    case 'tree':
                        item.css = [
                            '/lib/fancytree/skin-win8/ui.fancytree.css',
                            '/uicontrols/TreeView/TreeView.css'
                        ];
                        item.js = [
                            '/lib/fancytree/jquery.fancytree-all-deps.js',
                            '/uicontrols/TreeView/TreeView.js'
                        ];
                        break;
                    case 'grid':
                        item.css = [
                            '/uicontrols/DataSource/DataSource.css',
                            '/uicontrols/CodePicker/CodePicker.css',
                            '/lib/handsontable/dist/handsontable.full.css',
                            '/uicontrols/WebGrid/WebGrid.css'
                        ];
                        item.js = [
                            '/uicontrols/DataSource/DataSource.js',
                            '/uicontrols/CodePicker/CodePicker.js',
                            '/lib/papaparse/papaparse.js',
                            '/lib/xlsx/xlsx.core.min.js',
                            '/lib/handsontable/dist/handsontable.full.js',
                            '/lib/handsontable/languages/ko-KR.js',
                            '/uicontrols/WebGrid/WebGrid.js'
                        ];
                        break;
                    case 'auigrid':
                        item.css = [
                            '/uicontrols/DataSource/DataSource.css',
                            '/uicontrols/CodePicker/CodePicker.css',
                            '/uicontrols/WebGrid/AUIGrid.css'
                        ];
                        item.js = [
                            '/uicontrols/DataSource/DataSource.js',
                            '/uicontrols/CodePicker/CodePicker.js',
                            '/lib/papaparse/papaparse.js',
                            '/lib/xlsx/xlsx.core.min.js',
                            '/js/auigrid/AUIGridLicense.js',
                            '/js/auigrid/AUIGrid.js',
                            '/js/auigrid/FileSaver.min.js',
                            '/uicontrols/WebGrid/AUIGrid.js'
                        ];
                        break;
                    case 'guide':
                        item.css = [
                            '/lib/intro.js/introjs.min.css',
                            '/uicontrols/Guide/Guide.css'
                        ];
                        item.js = [
                            '/lib/popper.js/umd/popper.js',
                            '/lib/tippy.js/tippy-bundle.umd.js',
                            '/lib/intro.js/intro.js',
                            '/lib/superplaceholder/superplaceholder.js',
                            '/uicontrols/Guide/Guide.js'
                        ];
                        break;
                    case 'element':
                        item.js = ['/uicontrols/Element/Element.js'];
                        break;
                }
            }

            result.push({
                module: 'after-default',
                type: 'after-default',
                css: [
                    '/css/layouts/Dialogs.css',
                    '/css/layouts/LoadingPage.css',
                    '/css/layouts/ProgressBar.css',
                    '/css/layouts/Tooltips.css',
                    '/css/layouts/WindowManager.css',
                    '/css/uicontrols/Control.css',

                    '/css/base.css',
                ],
                js: [
                    '/uicontrols/Element/Element.js',
                    '/lib/darkreader/darkreader.min.js',
                    '/lib/master-css/index.js'
                ]
            });

            return result;
        },

        loadCallback() {
            (async function () {
                while (true) {
                    if (window.pageFormReady) {
                        document.dispatchEvent(new CustomEvent('pageReady'));
                        break;
                    }
                    await synLoader.sleep(25);
                }
            })();
            synLoader.eventLog('loadCallback', 'done');
        },

        eventLog(event, data) {
            if (synLoader.isEnableModuleLogging == false) {
                return;
            }

            var now = (new Date()).getTime(),
                diff = now - synLoader.start,
                value, div, text;

            value = synLoader.logCount.toString() +
                '@' + (diff / 1000).toString() +
                '[' + event + '] ' + JSON.stringify(data);

            if (window.console) {
                console.log(value);
            }
            else {
                div = document.createElement('DIV');
                text = document.createTextNode(value);

                div.appendChild(text);

                var eventlogs = document.getElementById('eventlogs');
                if (eventlogs) {
                    eventlogs.appendChild(div);

                    clearTimeout(synLoader.logTimer);
                    synLoader.logTimer = setTimeout(function () {
                        eventlogs.scrollTop = eventlogs.scrollHeight;
                    }, 10);
                }
                else {
                    document.body.appendChild(div);
                }
            }

            synLoader.logCount++;
        }
    };

    window.synConfigName = sessionStorage.getItem('synConfigName') || 'syn.config.json';
    var cacheSynConfig = sessionStorage.getItem('synConfig');
    if (window.synConfigName == 'syn.config.json' && cacheSynConfig) {
        window.synConfig = JSON.parse(cacheSynConfig);
        if (systemVersion != window.synConfig.SystemVersion) {
            window.synConfig = null;
            sessionStorage.removeItem('synConfig');
        }
        else if (window.synConfig.CreatedAt) {
            var diffHours = Math.abs(new Date() - new Date(window.synConfig.CreatedAt)) / 3600000;
            if (diffHours >= 1) {
                window.synConfig = null;
                sessionStorage.removeItem('synConfig');
            }
        }
        else {
            window.synConfig = null;
            sessionStorage.removeItem('synConfig');
        }
    }

    var loaderRequest = async function () {
        var toBoolean = (val) => {
            return (val === 'true' || val === 'True' || val === 'TRUE' || val === 'Y' || val == '1');
        };

        var urlOptions = synLoader.toUrlObject(location.href);
        if (location.pathname.startsWith((synConfig.TenantAppRequestPath ? `/${synConfig.TenantAppRequestPath}/` : '/app/')) == true) {
            var userWorkID = location.pathname.split('/')[2];
            var applicationID = location.pathname.split('/')[3];
            var tenantID = `${userWorkID}|${applicationID}`;
            var cacheAppConfig = sessionStorage.getItem(`${tenantID}Config`);
            if (cacheAppConfig) {
                window.Configuration = JSON.parse(cacheAppConfig);
                if (window.Configuration.CreatedAt) {
                    var diffHours = Math.abs(new Date() - new Date(window.Configuration.CreatedAt)) / 3600000;
                    if (diffHours >= 1) {
                        window.Configuration = null;
                        sessionStorage.removeItem(`${tenantID}Config`);
                    }
                }
                else {
                    window.Configuration = null;
                    sessionStorage.removeItem(`${tenantID}Config`);
                }
            }

            if (window.Configuration == null || window.Configuration == undefined) {
                var appConfigName = `/app/${userWorkID}/${applicationID}/wwwroot/app.environment.json`;
                var response = await fetch(appConfigName, { cache: 'no-cache' });
                if (response.status === 200) {
                    window.Configuration = await response.json();
                    window.Configuration.CreatedAt = new Date();
                }
                else {
                    window.Configuration = { Application: {}, Cookie: {}, Header: {}, Definition: { BindingAction: 'Replace', Scripts: [], Styles: [], Controls: [] } };
                }

                sessionStorage.setItem(`${tenantID}Config`, JSON.stringify(window.Configuration));
            }
        }
        else {
            if (synConfig.EnvironmentSetting) {
                window.Configuration = synConfig.EnvironmentSetting;
            }
        }

        var loadFiles = null;
        var templateFiles = [];
        var styleFiles = [];
        var jsFiles = [];

        var loaderPath = '/js/syn.domain.js';
        if (window.Configuration) {
            var configuration = window.Configuration;
            if (configuration.Application) {
                loaderPath = configuration.Application.LoaderPath || loaderPath;
                synConfig.IsDebugMode = configuration.Application.IsDebugMode || synConfig.IsDebugMode;
                synConfig.IsBundleLoad = configuration.Application.IsBundleLoad || synConfig.IsBundleLoad;
            }
        }

        var bindingAction;
        if (window.Configuration && window.Configuration.Definition) {
            bindingAction = window.Configuration.Definition.BindingAction || 'Replace';
            if (bindingAction != 'None') {
                jsFiles = window.Configuration.Definition.Scripts || [];
                jsFiles = jsFiles.concat(window.Configuration.Definition.Controls || []);
            }
        }

        if (bindingAction != 'Replace') {
            if (toBoolean(synConfig.IsBundleLoad) == false) {
                var definedResource = synLoader.definedResources();
                var cssList = definedResource.map(function (item) { return item.css });
                var jsList = definedResource.map(function (item) { return item.js });

                for (var i = 0; i < cssList.length; i++) {
                    styleFiles = styleFiles.concat(cssList[i]);
                }

                for (var i = 0; i < jsList.length; i++) {
                    jsFiles = jsFiles.concat(jsList[i]);
                }
            }
            else {
                if (synConfig.Environment == 'Development') {
                    styleFiles = styleFiles.concat([
                        // syn.scripts.js
                        '/lib/tabler-core/dist/css/tabler.css',
                        '/lib/tabler-icons-webfont/dist/tabler-icons.css',
                        '/lib/handsontable/dist/handsontable.full.css',
                        '/lib/tail.select.js/css/default/tail.select-light.css',
                        '/lib/ispin/dist/ispin.css',
                        '/js/css-checkbox/checkboxes.css',
                        '/js/color-picker/color-picker.css',
                        '/lib/codemirror/codemirror.css',
                        '/lib/fancytree/skin-win8/ui.fancytree.css',
                        '/js/jquery-ui-contextmenu/jquery-ui.css',
                        '/lib/orgchart/css/jquery.orgchart.css',
                        '/lib/print-js/print.min.css',
                        '/js/notifier/notifier.css',

                        // syn.domain.js
                        '/css/layouts/Dialogs.css',
                        '/css/layouts/LoadingPage.css',
                        '/css/layouts/ProgressBar.css',
                        '/css/layouts/Tooltips.css',
                        '/css/layouts/WindowManager.css',
                        '/css/uicontrols/Control.css',

                        // syn.controls.js
                        '/uicontrols/Chart/Chart.css',
                        '/uicontrols/CheckBox/CheckBox.css',
                        '/uicontrols/ColorPicker/ColorPicker.css',
                        '/uicontrols/ContextMenu/ContextMenu.css',
                        '/uicontrols/DataSource/DataSource.css',
                        '/uicontrols/DatePicker/DatePicker.css',
                        '/uicontrols/DropDownCheckList/DropDownCheckList.css',
                        '/uicontrols/DropDownList/DropDownList.css',
                        '/uicontrols/FileClient/FileClient.css',
                        '/uicontrols/GridList/GridList.css',
                        '/uicontrols/RadioButton/RadioButton.css',
                        '/uicontrols/TextArea/TextArea.css',
                        '/uicontrols/TextBox/TextBox.css',
                        '/uicontrols/SourceEditor/SourceEditor.css',
                        '/uicontrols/HtmlEditor/HtmlEditor.css',
                        '/uicontrols/OrganizationView/OrganizationView.css',
                        '/uicontrols/TreeView/TreeView.css',
                        '/uicontrols/WebGrid/WebGrid.css',
                        '/uicontrols/WebGrid/AUIGrid.css',

                        // 프로젝트 화면 디자인
                        '/css/base.css',
                    ]);

                    jsFiles = jsFiles.concat([
                        '/js/syn.scripts.js',
                    ]);

                    jsFiles.push('/js/syn.js');
                    jsFiles.push('/js/syn.controls.js');
                }
                else {
                    if (synConfig.IsDebugMode == true) {
                        styleFiles = styleFiles.concat([
                            '/css/syn.bundle.css'
                        ]);

                        jsFiles = jsFiles.concat([
                            '/js/syn.bundle.js'
                        ]);
                    }
                    else {
                        styleFiles = styleFiles.concat([
                            '/css/syn.bundle.min.css'
                        ]);

                        jsFiles = jsFiles.concat([
                            '/js/syn.bundle.min.js'
                        ]);
                    }
                }
            }
        }

        jsFiles.push(loaderPath);
        styleFiles = styleFiles.concat(window.Configuration.Definition?.Styles || []);

        var moduleFile = '';
        if (window.moduleFile) {
            moduleFile = window.moduleFile;
        }
        else {
            var pathname = location.pathname;
            if (pathname.split('/').length > 0) {
                moduleFile = pathname.split('/')[pathname.split('/').length - 1];
                moduleFile = moduleFile.split('.').length == 2 ? (moduleFile.indexOf('.') > -1 ? moduleFile.substring(0, moduleFile.indexOf('.')) : moduleFile) : '';
            }
        }

        if (moduleFile.length > 0 && window['$' + moduleFile] == undefined) {
            jsFiles.unshift(moduleFile.indexOf('.js') > -1 ? moduleFile : moduleFile + '.js');
        }

        /*
        <script type="text/javascript">
            function pageLoadFiles(styleFiles, jsFiles, templateFiles) {
                styleFiles.push('/js/uicontrols/GridList/GridList.css');
                jsFiles.push('/js/datatable/datatables.js');
            }
        </script>
         */
        if (window.pageLoadFiles) {
            pageLoadFiles(jsFiles, styleFiles, templateFiles);
            loadFiles = styleFiles.concat(jsFiles).concat(templateFiles);
        }
        else {
            loadFiles = styleFiles.concat(jsFiles);
        }

        if (window.beforeLoadFiles && window.beforeLoadFiles.length > 0) {
            for (var i = window.beforeLoadFiles.length - 1; i >= 0; i--) {
                loadFiles.unshift(window.beforeLoadFiles[i]);
            }
        }

        if (window.afterLoadFiles && window.afterLoadFiles.length > 0) {
            for (var i = window.afterLoadFiles.length - 1; i >= 0; i--) {
                loadFiles.push(window.afterLoadFiles[i]);
            }
        }

        loadFiles = [...new Set(loadFiles)];

        var toBoolean = (val) => {
            return (val === 'true' || val === 'True' || val === 'TRUE' || val === 'Y' || val == '1');
        }

        synLoader.assetsCachingID = synConfig.AssetsCachingID === '' ? '' : 'tick=' + synConfig.AssetsCachingID;
        synLoader.noCache = toBoolean(synConfig.IsClientCaching) === true ? '' : 'tick=' + new Date().getTime();
        await synLoader.request(loadFiles);
    }

    if (!window.synConfig) {
        var response = await fetch('/' + window.synConfigName, { cache: 'no-cache' });
        if (response.status === 200) {
            window.synConfig = await response.json();
            window.synConfig.CreatedAt = new Date();
            sessionStorage.setItem('synConfig', JSON.stringify(window.synConfig));
        }
        else {
            synLoader.eventLog('loadJson', ' ' + window.synConfigName + ', ' + response.status.toString() + ', ' + await response.text(), 'Error');
        }
    }

    if (window.synConfig && synConfig.LoadModuleConfig && synConfig.LoadModuleConfig.length > 0) {
        var loadModuleID = synConfig.LoadModuleConfig.find((item) => { return location.pathname.startsWith('/' + item) == true; });
        if (loadModuleID) {
            var modConfigName = '/' + loadModuleID + '/mod.config.json';
            var response = await fetch(modConfigName, { cache: 'no-cache' });
            if (response.status === 200) {
                window.modConfig = await response.json();
                if (window.modConfig.SynConfigPath) {
                    var configResponse = await fetch(window.modConfig.SynConfigPath, { cache: 'no-cache' });
                    if (configResponse.status === 200) {
                        window.synConfig = await configResponse.json();
                        window.synConfig.LoadModuleID = loadModuleID;
                    }
                }
            }
        }
    }

    if (window.synConfig) {
        loaderRequest();
    }
    else {
        synLoader.eventLog('loadJson', ' ' + window.synConfigName + ', ' + response.status.toString() + ', ' + await response.text(), 'Error');
    }
}());
