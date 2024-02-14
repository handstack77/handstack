(async function () {
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

        return unescape(document.cookie.substring(len, end));
    }

    var backgroundColor = '#ed1c23';
    var style = document.createElement('style');
    style.innerHTML = '.pl-container{position:absolute;top:0;left:0;background-color:#fff;width:100vw;height:100vh;z-index:999}.pl-cube-grid{position:absolute;left:50%;top:50%;margin:-20px 0 0 -20px;width:40px;height:40px}.pl-cube-grid .pl-cube{width:33%;height:33%;background-color:' + backgroundColor + ';float:left;-webkit-animation:pl-cubeGridScaleDelay 1.3s infinite ease-in-out;animation:pl-cubeGridScaleDelay 1.3s infinite ease-in-out}.pl-cube-grid .pl-cube1{-webkit-animation-delay:.2s;animation-delay:.2s}.pl-cube-grid .pl-cube2{-webkit-animation-delay:.3s;animation-delay:.3s}.pl-cube-grid .pl-cube3{-webkit-animation-delay:.4s;animation-delay:.4s}.pl-cube-grid .pl-cube4{-webkit-animation-delay:.1s;animation-delay:.1s}.pl-cube-grid .pl-cube5{-webkit-animation-delay:.2s;animation-delay:.2s}.pl-cube-grid .pl-cube6{-webkit-animation-delay:.3s;animation-delay:.3s}.pl-cube-grid .pl-cube7{-webkit-animation-delay:0s;animation-delay:0s}.pl-cube-grid .pl-cube8{-webkit-animation-delay:.1s;animation-delay:.1s}.pl-cube-grid .pl-cube9{-webkit-animation-delay:.2s;animation-delay:.2s}@-webkit-keyframes pl-cubeGridScaleDelay{0%,100%,70%{-webkit-transform:scale3D(1,1,1);transform:scale3D(1,1,1)}35%{-webkit-transform:scale3D(0,0,1);transform:scale3D(0,0,1)}}@keyframes pl-cubeGridScaleDelay{0%,100%,70%{-webkit-transform:scale3D(1,1,1);transform:scale3D(1,1,1)}35%{-webkit-transform:scale3D(0,0,1);transform:scale3D(0,0,1)}}.wtBorder{background-color:' + backgroundColor + ' !important;}';
    document.head.appendChild(style);

    // var pageBackground = document.createElement('div');
    // pageBackground.id = 'pageLoader';
    // pageBackground.classList.add('pl-container');
    // pageBackground.innerHTML = '<div class="pl-cube-grid"><div class="pl-cube pl-cube1"></div><div class="pl-cube pl-cube2"></div><div class="pl-cube pl-cube3"></div><div class="pl-cube pl-cube4"></div><div class="pl-cube pl-cube5"></div><div class="pl-cube pl-cube6"></div><div class="pl-cube pl-cube7"></div><div class="pl-cube pl-cube8"></div><div class="pl-cube pl-cube9"></div></div>';
    // document.body.appendChild(pageBackground);

    var agent = navigator.userAgent.toLowerCase();
    var isIE = (navigator.appName == 'Netscape' && agent.indexOf('trident') != -1) || (agent.indexOf("msie") != -1);
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
        argArgs: '',
        currentLoadedCount: 0,
        styleLoadedCount: 0,
        remainLoadedCount: 0,
        isEnableModuleLogging: sessionStorage.getItem('EnableModuleLogging') === 'true', // sessionStorage.setItem('EnableModuleLogging', true)

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
                var styleFile = synLoader.styleFiles[i];
                synLoader.eventLog('request', 'loading style ' + styleFile);

                var style = document.createElement('link');
                style.rel = 'stylesheet';
                style.href = styleFile + (styleFile.indexOf('?') > -1 ? '&' : '?') + synLoader.argArgs;
                style.type = 'text/css';

                if (styleFile.indexOf('dark_mode') > -1) {
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
            };

            var src = synLoader.scriptFiles[i];
            src = src + (src.indexOf('?') > -1 ? '&' : '?') + synLoader.argArgs;

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.async = 'async';
            script.onload = function (evt) {
                synLoader.eventLog('loaded', 'Loaded script: ' + evt.target.src);
                synLoader.currentLoadedCount++;

                if (synLoader.remainLoadedCount === synLoader.currentLoadedCount) {
                    synLoader.loadCallback();
                }
                else {
                    loadNextScript();
                }
            };
            script.onerror = function (evt) {
                synLoader.eventLog('load error', 'Loaded fail script: ' + evt.target.src);
                synLoader.currentLoadedCount++;

                if (synLoader.remainLoadedCount === synLoader.currentLoadedCount) {
                    synLoader.loadCallback();
                }
                else {
                    loadNextScript();
                }
            };

            document.body.appendChild(script);
        },

        loadText: async function (id, url) {
            url = url + (url.indexOf('?') > -1 ? '&' : '?') + synLoader.argArgs;
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
            synLoader.resources = resources;
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

            await synLoader.loadFiles();
        },

        sleep(ms) {
            return new Promise((r) => setTimeout(r, ms));
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
    if (window.synConfigName == 'syn.config.json' && cacheSynConfig && cacheSynConfig.Environment == 'Production') {
        window.synConfig = JSON.parse(cacheSynConfig);
        if (window.synConfig.CreatedAt) {
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
        if (location.pathname.startsWith((synConfig.TenantAppRequestPath ? `/${synConfig.TenantAppRequestPath}/` : '/app/')) == true) {
            var userWorkID = location.pathname.split('/')[2];
            var applicationID = location.pathname.split('/')[3];
            var tenantID = `${userWorkID}|${applicationID}`;
            var cacheAppConfig = sessionStorage.getItem(`${tenantID}Config`);
            if (cacheAppConfig && cacheSynConfig.Environment == 'Production') {
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
                    window.Configuration = { Application: {}, Cookie: {}, Header: {}, Definition: { Scripts: [], Styles: [], Controls: [] } };
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
                synConfig.IsDebugMode = configuration.Application.IsDebugMode;
                synConfig.CodeHelpID = configuration.Application.CodeHelpID;
            }
        }

        if (window.Configuration && window.Configuration.Definition) {
            jsFiles = window.Configuration.Definition.Scripts || [];
            jsFiles = jsFiles.concat(window.Configuration.Definition.Controls || []);
            styleFiles = window.Configuration.Definition.Styles || [];
        }
        else {
            if (synConfig.Environment == 'Development') {
                styleFiles = [
                    // syn.scripts.js
                    '/lib/tabler@1.0.0-beta20/css/tabler.syn.css',
                    '/lib/handsontable-13.1.0/dist/handsontable.full.css',
                    '/lib/tail.select-0.5.15/css/default/tail.select-light.css',
                    '/lib/ispin-2.0.1/ispin.css',
                    '/lib/css-checkbox-1.0.0/checkboxes.css',
                    '/lib/color-picker-1.0.0/color-picker.css',
                    '/lib/codemirror-5.50.2/codemirror.css',
                    "/lib/fancytree-2.38.0/skin-win8/ui.fancytree.css",
                    "/lib/jquery-ui-contextmenu-1.18.1/jquery-ui.css",
                    "/lib/orgchart-3.1.1/jquery.orgchart.css",
                    "/lib/printjs-1.6.0/print.min.css",
                    '/lib/notifier-1.0.0/notifier.css',

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

                    // 프로젝트 화면 디자인
                    '/css/base.css',
                    '/css/tabler-icons.css',
                ];

                jsFiles = [
                    '/js/syn.scripts.js',
                ];

                jsFiles.push('/js/syn.js');
                jsFiles.push('/js/syn.controls.js');
            }
            else {
                if (synConfig.IsDebugMode == true) {
                    styleFiles = [
                        '/css/syn.bundle.css'
                    ];

                    jsFiles = [
                        '/js/syn.bundle.js'
                    ];
                }
                else {
                    styleFiles = [
                        '/css/syn.bundle.min.css'
                    ];

                    jsFiles = [
                        '/js/syn.bundle.min.js'
                    ];
                }
            }
        }

        jsFiles.push(loaderPath);

        if (synConfig.Environment == 'Development') {
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

            if (moduleFile.length > 0 && window[moduleFile] == undefined) {
                jsFiles.unshift(moduleFile.indexOf('.js') > -1 ? moduleFile : moduleFile + '.js');
            }
        }

        /*
        <script type="text/javascript">
            function pageLoadFiles(styleFiles, jsFiles, templateFiles) {
                styleFiles.push('/js/uicontrols/GridList/GridList.css');
                jsFiles.push('/assets/lib/datatable-1.10.21/datatables.js');
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

        // synLoader.argArgs = getCookie('syn.iscache') == 'true' ? '' : 'tick=' + new Date().getTime();
        await synLoader.request(loadFiles);
    }

    if (window.synConfig) {
        loaderRequest();
    }
    else {
        var response = await fetch('/' + window.synConfigName, { cache: 'no-cache' });
        if (response.status === 200) {
            window.synConfig = await response.json();
            window.synConfig.CreatedAt = new Date();
            sessionStorage.setItem('synConfig', JSON.stringify(window.synConfig));
            loaderRequest();
        }
        else {
            synLoader.eventLog('loadJson', ' ' + window.synConfigName + ', ' + response.status.toString() + ', ' + await response.text(), 'Error');
        }
    }
}());
