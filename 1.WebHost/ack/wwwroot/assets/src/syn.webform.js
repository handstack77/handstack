(function (context) {
    'use strict';
    const $webform = context.$webform || new syn.module();
    let doc = null;
    if (globalRoot.devicePlatform !== 'node') {
        $webform.context = context;
        $webform.document = context.document;
        doc = context.document;
    }

    $webform.extend({
        localeID: 'ko-KR',
        cookiePrefixName: 'HandStack',
        timezoneOffsetMinutes: -(new Date().getTimezoneOffset()),
        method: 'POST',
        isPageLoad: false,
        transactionLoaderID: null,
        pageReadyTimeout: 60000,
        eventAddReady: (globalRoot.devicePlatform === 'node') ? null : new CustomEvent('addready'),
        eventRemoveReady: (globalRoot.devicePlatform === 'node') ? null : new CustomEvent('removeready'),
        mappingModule: true,
        moduleReadyIntervalID: null,
        remainingReadyIntervalID: null,
        remainingReadyCount: 0,
        intersectionObservers: {},
        proxyBasePath: '',

        defaultControlOptions: {
            value: '',
            dataType: 'string',
            belongID: null,
            controlText: null,
            validators: ['require', 'unique', 'numeric', 'ipaddress', 'email', 'date', 'url'],
            transactConfig: null,
            triggerConfig: null,
            getter: false,
            setter: false,
            bindingID: '',
            resourceKey: '',
            localeID: 'ko-KR',
            required: false,
            tooltip: ''
        },

        setStorage(prop, val, isLocal = false, ttl) {
            const storageKey = prop;
            const storageValue = JSON.stringify(val);

            if (globalRoot.devicePlatform === 'node') {
                if (isLocal) {
                    localStorage.setItem(storageKey, storageValue);
                } else {
                    const effectiveTTL = ttl ?? 1200000;
                    const now = Date.now();
                    const item = {
                        value: val,
                        expiry: now + effectiveTTL,
                        ttl: effectiveTTL
                    };
                    localStorage.setItem(storageKey, JSON.stringify(item));
                }
            } else {
                const storage = isLocal ? localStorage : sessionStorage;
                storage.setItem(storageKey, storageValue);
            }

            return this;
        },

        getStorage(prop, isLocal = false) {
            const storageKey = prop;

            if (globalRoot.devicePlatform === 'node') {
                if (isLocal) {
                    const val = localStorage.getItem(storageKey);
                    return val ? JSON.parse(val) : null;
                } else {
                    const itemStr = localStorage.getItem(storageKey);
                    if (!itemStr) return null;

                    try {
                        const item = JSON.parse(itemStr);
                        const now = Date.now();

                        if (now > item.expiry) {
                            localStorage.removeItem(storageKey);
                            return null;
                        }

                        const refreshedItem = {
                            ...item,
                            expiry: now + item.ttl,
                        };
                        localStorage.setItem(storageKey, JSON.stringify(refreshedItem));
                        return item.value;

                    } catch (e) {
                        syn.$l.eventLog('$w.getStorage (Node)', `키 "${storageKey}"에 대한 스토리지 항목 파싱 오류: ${e}`, 'Error');
                        localStorage.removeItem(storageKey);
                    }
                }
            } else {
                const storage = isLocal ? localStorage : sessionStorage;
                if ($object.isString(storageKey) == true) {
                    const val = storage.getItem(storageKey);
                    try {
                        return val ? JSON.parse(val) : null;
                    } catch (e) {
                        syn.$l.eventLog('$w.getStorage (Browser)', `키 "${storageKey}"에 대한 스토리지 항목 파싱 오류: ${e}`, 'Error');
                        storage.removeItem(storageKey);
                    }
                }
                else if ($object.isArray(storageKey) == true) {
                    let results = {};
                    for (let i = 0; i < storage.length; i++) {
                        const key = storage.key(i);
                        if (storageKey.includes(key) == true) {
                            results[key] = storage.getItem(key);
                        }
                    }
                }
            }

            return null;
        },

        removeStorage(prop, isLocal = false) {
            const storageKey = prop;
            if (globalRoot.devicePlatform === 'node') {
                localStorage.removeItem(storageKey);
            } else {
                const storage = isLocal ? localStorage : sessionStorage;
                storage.removeItem(storageKey);
            }
            return this;
        },

        getStorageKeys(isLocal = false) {
            const keys = [];
            const storage = isLocal ? localStorage : sessionStorage;

            for (let i = 0; i < storage.length; i++) {
                keys.push(storage.key(i));
            }
            return keys;
        },

        activeControl(evt) {
            const event = evt || context.event || null;
            let result = null;

            if (event) {
                result = event.target || event.srcElement || event || null;
            } else if (doc) {
                result = doc.activeElement || null;
            }

            if (!result && globalRoot.$this?.context) {
                result = $this.context.focusControl || null;
            }

            if (result && globalRoot.$this?.context) {
                $this.context.focusControl = result;
            }

            return result;
        },

        async contentLoaded() {
            syn.$l.addEvent(document, 'addready', function () {
                syn.$w.remainingReadyCount++;
            });

            syn.$l.addEvent(document, 'removeready', function () {
                syn.$w.remainingReadyCount--;
            });

            if (syn.$l.get('moduleScript')) {
                syn.$w.extend({ pageScript: syn.$l.get('moduleScript').value });
            }
            else {
                var pathname = location.pathname;
                if (pathname.split('/').length > 0) {
                    var filename = pathname.split('/')[pathname.split('/').length - 1];
                    $webform.extend({
                        pageProject: pathname.split('/')[pathname.split('/').length - 2],
                        pageScript: '$' + (filename.indexOf('.') > -1 ? filename.substring(0, filename.indexOf('.')) : filename)
                    });
                }

                var input = document.createElement('input');
                input.id = 'moduleScript';
                input.type = 'hidden';
                input.value = syn.$w.pageScript;
                document.body.appendChild(input);

                if (document.forms) {
                    for (var i = 0; i < document.forms.length; i++) {
                        syn.$l.addEvent(document.forms[i], 'submit', function (e) {
                            var result = false;
                            var el = e.target || e.srcElement;
                            if ($this && $this.hook && $this.hook.frameEvent) {
                                result = $this.hook.frameEvent('beforeSubmit', {
                                    el: el,
                                    evt: e
                                });

                                if ($object.isNullOrUndefined(result) == true || $string.toBoolean(result) == false) {
                                    result = false;
                                }
                            }

                            if (result == false) {
                                e.returnValue = false;
                                e.cancel = true;
                                if (e.preventDefault) {
                                    e.preventDefault();
                                }

                                if (e.stopPropagation) {
                                    e.stopPropagation();
                                }
                                return false;
                            }
                        });
                    }
                }
            }

            var pageLoad = function () {
                if (context.domainPageLoad) {
                    context.domainPageLoad();
                }

                var mod = context[syn.$w.pageScript];
                if (mod && mod.hook.pageLoad) {
                    mod.hook.pageLoad();
                }

                if (mod && mod.hook.pageMatch) {
                    var matchMedia_change = function (evt) {
                        var media = evt.media;
                        var classInfix = 'xs';
                        switch (media) {
                            case '(min-width: 576px)':
                                classInfix = 'sm';
                                break;
                            case '(min-width: 768px)':
                                classInfix = 'md';
                                break;
                            case '(min-width: 992px)':
                                classInfix = 'lg';
                                break;
                            case '(min-width: 1200px)':
                                classInfix = 'xl';
                                break;
                            case '(min-width: 1400px)':
                                classInfix = 'xxl';
                                break;
                        }

                        document.dispatchEvent(new CustomEvent('mediaquery', { detail: classInfix }));
                        mod.hook.pageMatch(classInfix);

                        if (context.domainPageMediaQuery) {
                            context.domainPageMediaQuery(classInfix);
                        }
                    }

                    syn.$l.addEvent(matchMedia('(min-width: 0px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 576px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 768px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 992px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 1200px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 1400px)'), 'change', matchMedia_change);
                }

                if ($object.isNullOrUndefined(syn.$w.User) == true) {
                    var sso = {
                        TokenID: '',
                        UserNo: 0,
                        UserID: '',
                        UserName: '',
                        BusinessPhoneNo: '',
                        BusinessEmail: '',
                        DepartmentID: '',
                        DepartmentName: '',
                        PositionID: '',
                        PositionName: '',
                        CompanyNo: '',
                        CompanyName: '',
                        Roles: [],
                        Claims: []
                    }

                    if (syn.$w.getSSOInfo) {
                        syn.$w.User = syn.$w.getSSOInfo() || sso;
                    }
                    else {
                        syn.$w.User = sso;
                    }
                }

                if ($object.isNullOrUndefined(syn.$w.User) == false) {
                    syn.$l.deepFreeze(syn.$w.User);
                }

                if ($object.isNullOrUndefined(syn.$w.Variable) == false) {
                    syn.$l.deepFreeze(syn.$w.Variable);
                }

                if (mod && mod.context.synControls && ($object.isNullOrUndefined(mod.context.tabOrderControls) == true || mod.context.tabOrderControls.length == 0)) {
                    var synTagNames = [];
                    var syn_tags = document.body.outerHTML.match(/<(syn_).+?>/gi);
                    if (syn_tags) {
                        var synControlCount = syn_tags.length;
                        for (var i = 0; i < synControlCount; i++) {
                            var syn_tag = syn_tags[i];
                            var tagName = syn_tag.substring(1, syn_tag.indexOf(' ')).toUpperCase();
                            synTagNames.push(tagName);
                        }
                    }

                    synTagNames = $array.distinct(synTagNames);
                    var findElements = document.querySelectorAll('input,select,textarea,button' + (synTagNames.length > 0 ? ',' + synTagNames.join(',') : ''));
                    var els = [];
                    var length = findElements.length;
                    for (var idx = 0; idx < length; idx++) {
                        var el = findElements[idx];
                        if (el && el.style && el.style.display == 'none' || el.type == 'hidden') {
                            if (el.id && el.tagName.toUpperCase() == 'SELECT' && $string.isNullOrEmpty(el.getAttribute('syn-datafield')) == false) {
                                els.push(el);
                            }
                            else {
                                continue;
                            }
                        }
                        else {
                            if (el.id && el.id.includes('btn_syneditor_') == false && el.id.includes('chk_syngrid_') == false && el.id.includes('_hidden') == false) {
                                els.push(el);
                            }
                            else if (el.id && el.tagName.toUpperCase() == 'SELECT' && $string.isNullOrEmpty(el.getAttribute('syn-datafield')) == false) {
                                els.push(el);
                            }
                            else if (el.id && el.tagName.includes('SYN_') == true) {
                                els.push(el);
                            }
                        }
                    }

                    var items = [];
                    var i = 0;
                    length = els.length;
                    for (var idx = 0; idx < length; idx++) {
                        var el = els[idx];
                        if (el.id && el.id.includes('btn_syneditor_') == false && el.id.includes('chk_syngrid_') == false && el.id.includes('_hidden') == false) {
                            var elID = el.id;
                            var offset = syn.$d.offset(el);
                            var baseID = el.getAttribute('baseID');
                            if (baseID) {
                                elID = baseID;
                            }

                            var setting = mod.context.synControls.find(function (item) { return item.id == elID });

                            if (setting) {
                                if (setting.type == 'datepicker') {
                                    offset = syn.$d.offset(el.parentElement);
                                }
                                else if (setting.type == 'colorpicker') {
                                    offset = syn.$d.offset(el.parentElement.parentElement);
                                }

                                items.push({
                                    elID: el.id,
                                    tagName: el.tagName,
                                    formID: setting.formDataFieldID,
                                    type: setting.type,
                                    top: offset.top,
                                    left: offset.left
                                });
                            }
                        }
                        else if (el.id && el.tagName.toUpperCase() == 'SELECT' && $string.isNullOrEmpty(el.getAttribute('syn-datafield')) == false) {
                            var offset = null;
                            if (el.getAttribute('multiple') === false) {
                                var control = syn.uicontrols.$select.getControl(el.id);
                                if (control) {
                                    offset = syn.$d.offset(control.picker.select);
                                }
                            }
                            else {
                                var control = syn.uicontrols.$multiselect.getControl(el.id);
                                if (control) {
                                    offset = syn.$d.offset(control.picker.select);
                                }
                            }

                            if (offset) {
                                var setting = mod.context.synControls.find(function (item) { return item.id == el.id });

                                if (setting) {
                                    items.push({
                                        elID: el.id,
                                        tagName: el.tagName,
                                        formID: setting.formDataFieldID,
                                        type: setting.type,
                                        top: offset.top,
                                        left: offset.left
                                    });
                                }
                            }
                        }
                        else if (el.id && el.tagName.includes('SYN_') == true) {
                            var elID = el.id.replace('_hidden', '');
                            var offset = null;
                            if (el.tagName == 'SYN_DATEPICKER') {
                                // var offset = syn.$d.offset(el);
                            }
                            else if (el.tagName == 'SYN_COLORPICKER') {
                                // var offset = syn.$d.offset(el);
                            }

                            if (offset) {
                                var setting = mod.context.synControls.find(function (item) { return item.id == elID });
                                if (setting) {
                                    items.push({
                                        elID: elID,
                                        tagName: el.tagName,
                                        formID: setting.formDataFieldID,
                                        type: setting.type,
                                        top: offset.top,
                                        left: offset.left
                                    });
                                }
                            }
                        }

                        i = i + 1;
                    }

                    mod.context.focusControl = null;
                    mod.context.tabOrderFocusID = null;
                    mod.context.tabOrderControls = items;

                    if (mod && mod.hook.frameEvent) {
                        mod.hook.frameEvent('tabOrderControls', mod.context.tabOrderControls);
                    }

                    if (mod.context.tabOrderControls.length > 0) {
                        if (mod.config) {
                            // html (html defined), tdlr (top > down > left > right), lrtd (left > right > top > down)
                            if ($string.isNullOrEmpty(mod.context.tapOrderFlow) == true) {
                                mod.context.tapOrderFlow = 'html';
                            }

                            if (mod.context.tapOrderFlow == 'tdlr') {
                                mod.context.tabOrderControls.sort(
                                    function (a, b) {
                                        if (a.top === b.top) {
                                            return a.left - b.left;
                                        }
                                        return a.top > b.top ? 1 : -1;
                                    });
                            }
                            else if (mod.context.tapOrderFlow == 'lrtd') {
                                mod.context.tabOrderControls.sort(
                                    function (a, b) {
                                        if (a.left === b.left) {
                                            return a.top - b.top;
                                        }
                                        return a.left > b.left ? 1 : -1;
                                    });
                            }
                        }
                        else {
                            mod.context.tabOrderControls.sort(
                                function (a, b) {
                                    if (a.top === b.top) {
                                        return a.left - b.left;
                                    }
                                    return a.top > b.top ? 1 : -1;
                                });
                        }
                    }

                    var focusEL = syn.$l.querySelector("[autofocus]")
                    if (focusEL && focusEL.id && focusEL.tagName) {
                        var tagName = focusEL.tagName.toUpperCase();
                        var tags = 'input,select,textarea,button'.toUpperCase().split(',');
                        if (tags.indexOf(tagName) > -1) {
                            mod.context.focusControl = focusEL;
                            mod.context.tabOrderFocusID = focusEL.id;
                            setTimeout(function () {
                                focusEL.focus();
                            });
                        }
                    }
                }

                if (mod && mod.hook.pageComplete) {
                    mod.hook.pageComplete();
                }

                if (context.domainPageComplete) {
                    context.domainPageComplete();
                }
            }

            var pageFormInit = async () => {
                var mod = context[syn.$w.pageScript];
                if (mod.config && $string.isNullOrEmpty(mod.config.layoutPage) == false) {
                    var masterLayout = await syn.$w.fetchText(mod.config.layoutPage);
                    if (masterLayout) {
                        var parser = new DOMParser();
                        var masterPage = parser.parseFromString(masterLayout, 'text/html');
                        if (masterPage) {
                            document.body.style.visibility = 'hidden';
                            var heads = syn.$l.querySelectorAll('syn-head');
                            for (var i = 0, length = heads.length; i < length; i++) {
                                var head = heads[i];
                                document.head.insertAdjacentHTML('afterbegin', head.innerHTML);
                            }

                            var sections = syn.$l.querySelectorAll('syn-section');
                            for (var i = 0, length = sections.length; i < length; i++) {
                                var section = sections[i];
                                var componentSection = masterPage.querySelector(section.getAttribute('selector'));
                                if (componentSection) {
                                    componentSection.innerHTML = section.innerHTML;
                                }
                            }

                            var bodys = syn.$l.querySelectorAll('syn-body');
                            for (var i = 0, length = bodys.length; i < length; i++) {
                                var body = bodys[i];
                                var position = body.getAttribute('position');
                                if ($string.isNullOrEmpty(position) == false && ['beforebegin', 'afterbegin', 'beforeend', 'afterend'].indexOf(position) > -1) {
                                    masterPage.body.insertAdjacentHTML(position, body.innerHTML);
                                }
                            }

                            document.body.innerHTML = masterPage.body.innerHTML;
                        }
                    }
                }

                if (mod && mod.hook.pageFormInit) {
                    await mod.hook.pageFormInit();
                }

                if (context.domainLibraryLoad) {
                    var isContinue = await domainLibraryLoad();
                    if ($object.isNullOrUndefined(isContinue) == false && isContinue === false) {
                        return false;
                    }
                }

                var getTagModule = (tagName) => {
                    var controlModule = null;
                    if (syn.uicontrols) {
                        var controlType = '';
                        if (tagName.indexOf('SYN_') > -1) {
                            var moduleName = tagName.substring(4).toLowerCase();
                            controlModule = syn.uicontrols['$' + moduleName];
                            controlType = moduleName;
                        }
                        else {
                            switch (tagName) {
                                case 'BUTTON':
                                    controlModule = syn.uicontrols.$button;
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
                                            controlModule = syn.uicontrols.$textbox;
                                            break;
                                        case 'submit':
                                        case 'reset':
                                        case 'button':
                                            controlModule = syn.uicontrols.$button;
                                            break;
                                        case 'radio':
                                            controlModule = syn.uicontrols.$radio;
                                            break;
                                        case 'checkbox':
                                            controlModule = syn.uicontrols.$checkbox;
                                            break;
                                    }
                                    break;
                                case 'TEXTAREA':
                                    controlModule = syn.uicontrols.$textarea;
                                    controlType = 'textarea';
                                    break;
                                case 'SELECT':
                                    if (synControl.getAttribute('multiple') == null) {
                                        controlModule = syn.uicontrols.$select;
                                        controlType = 'select';
                                    }
                                    else {
                                        controlModule = syn.uicontrols.$multiselect;
                                        controlType = 'multiselect';
                                    }
                                    break;
                                default:
                                    controlModule = syn.uicontrols.$element;
                                    controlType = 'element';
                                    break;
                            }
                        }
                    }

                    return {
                        module: controlModule,
                        type: controlType
                    };
                }

                var synControlList = [];
                var synControls = document.querySelectorAll('[tag^="syn_"],[syn-datafield],[syn-options],[syn-events]');
                for (var i = 0; i < synControls.length; i++) {
                    var synControl = synControls[i];
                    if (synControl.tagName) {
                        var tagName = synControl.tagName.toUpperCase();
                        var dataField = synControl.getAttribute('syn-datafield');
                        var elementID = synControl.getAttribute('id');
                        var formDataField = synControl.closest('form') ? synControl.closest('form').getAttribute('syn-datafield') : '';

                        var controlOptions = synControl.getAttribute('syn-options') || null;
                        if (controlOptions != null) {
                            try {
                                controlOptions = eval('(' + controlOptions + ')');
                            } catch (error) {
                                syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요: '.format(elementID) + error.message, 'Warning');
                            }
                        }
                        else {
                            controlOptions = {};
                        }

                        var tagModule = getTagModule(tagName);
                        if (tagModule.module) {
                            tagModule.module.controlLoad(elementID, controlOptions);
                        }
                        else {
                            if ($this.hook.controlLoad) {
                                $this.hook.controlLoad(elementID, controlOptions);
                            }
                        }
                    }
                }

                synControls = document.querySelectorAll('[tag^="syn_"],[syn-datafield],[syn-options],[syn-events]');
                for (var i = 0; i < synControls.length; i++) {
                    var synControl = synControls[i];
                    if (synControl.tagName) {
                        var tagName = synControl.tagName.toUpperCase();
                        var dataField = synControl.getAttribute('syn-datafield');
                        var elementID = synControl.getAttribute('id');
                        var formDataField = synControl.closest('form') ? synControl.closest('form').getAttribute('syn-datafield') : '';

                        var controlOptions = synControl.getAttribute('syn-options') || null;
                        if (controlOptions != null) {
                            try {
                                controlOptions = eval('(' + controlOptions + ')');
                            } catch (error) {
                                syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요: '.format(elementID) + error.message, 'Warning');
                            }
                        }
                        else {
                            controlOptions = {};
                        }

                        syn.$l.addEvent(synControl.id, 'focus', function (evt) {
                            $this.context.focusControl = evt.target || evt.currentTarget || evt.srcElement;
                            if ($this.context.focusControl) {
                                $this.context.tabOrderFocusID = $this.context.focusControl.id;
                            }
                            else {
                                $this.context.tabOrderFocusID = null;
                            }
                        });

                        var tagModule = getTagModule(tagName);
                        if (tagModule.module) {
                            if (tagModule.module.addModuleList) {
                                tagModule.module.addModuleList(synControl, synControlList, controlOptions, tagModule.type);
                            }
                        }
                        else {
                            if (elementID && dataField) {
                                synControlList.push({
                                    id: elementID,
                                    formDataFieldID: formDataField,
                                    field: dataField,
                                    module: null,
                                    type: tagModule.type ? tagModule.type : synControl.tagName.toLowerCase()
                                });
                            }
                        }
                    }
                }

                var synEventControls = document.querySelectorAll('[syn-events]');
                for (var i = 0; i < synEventControls.length; i++) {
                    var synControl = synEventControls[i];
                    var elEvents = null;

                    try {
                        elEvents = eval('(' + synControl.getAttribute('syn-events') + ')');
                    } catch (error) {
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-events 확인 필요: '.format(synControl.id) + error.message, 'Warning');
                    }

                    if (elEvents && $this.event) {
                        var length = elEvents.length;
                        for (var j = 0; j < length; j++) {
                            var elEvent = elEvents[j];

                            var func = $this.event[synControl.id + '_' + elEvent];
                            if (func) {
                                syn.$l.addEvent(synControl.id, elEvent, func);
                            }
                        }
                    }
                }

                var synOptionControls = document.querySelectorAll('[syn-options]');
                for (var i = 0; i < synOptionControls.length; i++) {
                    var synControl = synOptionControls[i];
                    var elID = synControl.id.replace('_hidden', '');
                    var options = null;

                    try {
                        var el = syn.$l.get(synControl.id + '_hidden') || syn.$l.get(synControl.id);
                        var synOptions = el.getAttribute('syn-options') || null;
                        if (synOptions != null) {
                            options = eval('(' + synOptions + ')');
                        }
                    } catch (error) {
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요: '.format(synControl.id) + error.message, 'Warning');
                    }

                    if (options && options.transactConfig && options.transactConfig.triggerEvent) {
                        if ($object.isString(options.transactConfig.triggerEvent) == true) {
                            syn.$l.addEvent(elID, options.transactConfig.triggerEvent, function (evt) {
                                var el = syn.$w.activeControl(evt);
                                var synOptions = el.getAttribute('syn-options') || null;
                                if (synOptions != null) {
                                    options = eval('(' + synOptions + ')');
                                }

                                var transactConfig = null;
                                if (options && options.transactConfig) {
                                    transactConfig = options.transactConfig;
                                }

                                if (transactConfig) {
                                    syn.$w.transactionAction(transactConfig, transactConfig.options);
                                }
                            });
                        }
                        else if ($object.isArray(options.transactConfig.triggerEvent) == true) {
                            var triggerFunction = function (evt) {
                                var el = syn.$w.activeControl(evt);
                                var synOptions = el.getAttribute('syn-options') || null;
                                if (synOptions != null) {
                                    options = eval('(' + synOptions + ')');
                                }

                                var transactConfig = null;
                                if (options && options.transactConfig) {
                                    transactConfig = options.transactConfig;
                                }

                                if (transactConfig) {
                                    syn.$w.transactionAction(transactConfig, transactConfig.options);
                                }
                            };

                            for (var key in options.transactConfig.triggerEvent) {
                                var eventName = options.transactConfig.triggerEvent[key];
                                syn.$l.addEvent(elID, eventName, triggerFunction);
                            }
                        }
                    }

                    if (options && options.triggerConfig && options.triggerConfig.triggerEvent) {
                        if ($object.isString(options.triggerConfig.triggerEvent) == true) {
                            syn.$l.addEvent(elID, options.triggerConfig.triggerEvent, function (evt) {
                                var triggerConfig = null;
                                var el = syn.$w.activeControl(evt);
                                var synOptions = el.getAttribute('syn-options') || null;
                                if (synOptions != null) {
                                    options = eval('(' + synOptions + ')');
                                }
                                else {
                                    synOptions = el.parentElement.getAttribute('syn-options') || null;
                                    if (synOptions != null) {
                                        options = eval('(' + synOptions + ')');
                                    }
                                }

                                if (options && options.triggerConfig) {
                                    triggerConfig = options.triggerConfig;
                                }

                                if (triggerConfig) {
                                    syn.$w.triggerAction(triggerConfig);
                                }
                            });
                        }
                        else if ($object.isArray(options.triggerConfig.triggerEvent) == true) {
                            var triggerFunction = function (evt) {
                                var triggerConfig = null;
                                var el = syn.$w.activeControl(evt);
                                var synOptions = el.getAttribute('syn-options') || null;
                                if (synOptions != null) {
                                    options = eval('(' + synOptions + ')');
                                }
                                else {
                                    synOptions = el.parentElement.getAttribute('syn-options') || null;
                                    if (synOptions != null) {
                                        options = eval('(' + synOptions + ')');
                                    }
                                }

                                if (options && options.triggerConfig) {
                                    triggerConfig = options.triggerConfig;
                                }

                                if (triggerConfig) {
                                    syn.$w.triggerAction(triggerConfig);
                                }
                            };

                            for (var key in options.triggerConfig.triggerEvent) {
                                var eventName = options.triggerConfig.triggerEvent[key];
                                syn.$l.addEvent(elID, eventName, triggerFunction);
                            }
                        }
                    }
                }

                var elem = document.createElement('input');
                elem.type = 'hidden';
                elem.id = 'synControlList';
                elem.textContent = JSON.stringify(synControlList);;
                document.body.appendChild(elem);

                if (mod) {
                    mod.context.synControls = synControlList;
                }
                else {
                    context.synControls = synControlList;
                }

                syn.$w.remainingReadyIntervalID = setInterval(function () {
                    if ($object.isNullOrUndefined(syn.$w.remainingReadyIntervalID) == false && syn.$w.remainingReadyCount == 0) {
                        clearInterval(syn.$w.remainingReadyIntervalID);
                        syn.$w.remainingReadyIntervalID = null;

                        pageLoad();
                        syn.$w.isPageLoad = true;
                    }
                }, 25);

                setTimeout(function () {
                    if ($object.isNullOrUndefined(syn.$w.remainingReadyIntervalID) == false) {
                        clearInterval(syn.$w.remainingReadyIntervalID);
                        syn.$w.remainingReadyIntervalID = null;
                        syn.$l.eventLog('pageLoad', '화면 초기화 오류, remainingReadyCount: {0} 확인 필요'.format(syn.$w.remainingReadyCount), 'Fatal');
                    }
                }, syn.$w.pageReadyTimeout);
            };

            syn.$w.mappingModule = syn.$w.getLoaderQueryString('mappingModule') == null ? true : $string.toBoolean(syn.$w.getLoaderQueryString('mappingModule'));
            if (syn.$w.mappingModule == true) {
                var module = {};
                if (syn.$l.get('moduleScript')) {
                    syn.$w.extend({ pageScript: syn.$l.get('moduleScript').value });
                }

                if ($string.toBoolean(window.noPageScript) == false) {
                    module = await syn.$w.fetchScript(syn.$w.pageScript.replace('$', ''));
                }

                var mod = context[syn.$w.pageScript] || new syn.module();
                mod.config = {
                    programID: syn.Config.ApplicationID,
                    moduleID: (globalRoot.devicePlatform == 'browser' ? location.pathname.split('/').filter(Boolean)[0] : undefined) || syn.Config.ModuleID,
                    businessID: syn.$w.pageProject || syn.Config.ProjectID,
                    systemID: syn.Config.SystemID,
                    transactionID: syn.$w.pageScript.replace('$', ''),
                    transactions: [],
                    dataSource: {},
                    actionButtons: []
                };
                mod.prop = {};
                mod.model = {};
                mod.hook = {};
                mod.event = {};
                mod.translate = {};
                mod.transaction = {};
                mod.method = {};
                mod.store = {};
                mod.context = {};

                mod.extend(module);
                context[syn.$w.pageScript] = mod;
                context.$this = mod;

                if (window.synLoader) {
                    syn.$l.addEvent(document, 'pageReady', pageFormInit);
                    context.pageFormReady = true;
                    setTimeout(function () {
                        syn.$l.removeEvent(document, 'pageReady', pageFormInit);

                        if (syn.$w.remainingReadyIntervalID != null) {
                            syn.$l.eventLog('pageReady', '화면 초기화 오류, loader 또는 dispatchEvent 확인 필요', 'Fatal');
                        }
                    }, syn.$w.pageReadyTimeout);
                }
                else {
                    setTimeout(async () => {
                        await pageFormInit();
                    }, 25);
                }
            }
            else {
                pageLoad();
                syn.$w.isPageLoad = true;
            }
        },

        getLoaderQueryString(name) {
            var currentScript = document.currentScript || document.querySelector('script[src*="syn.loader.js"]');
            if (currentScript && currentScript.src) {
                const params = new URLSearchParams(new URL(currentScript.src).search);
                return params.get(name);
            }
            return null;
        },

        addReadyCount() {
            if (syn.$w.eventAddReady && syn.$w.isPageLoad == false) {
                doc.dispatchEvent(syn.$w.eventAddReady);
            }
        },

        removeReadyCount() {
            if (syn.$w.eventRemoveReady && syn.$w.isPageLoad == false) {
                doc.dispatchEvent(syn.$w.eventRemoveReady);
            }
        },

        createSelection(el, start, end) {
            const element = syn.$l.getElement(el);
            if (!element) return;

            try {
                if (element.setSelectionRange && element.type !== 'email') {
                    element.setSelectionRange(start, end);
                } else if (element.createTextRange) { // IE
                    const range = element.createTextRange();
                    range.collapse(true);
                    range.moveStart('character', start);
                    range.moveEnd('character', end - start);
                    range.select();
                }
                element.focus();
            } catch (e) {
                syn.$l.eventLog('$w.createSelection', `${element.id}의 선택 영역 설정 오류: ${e}`, 'Warning');
            }
        },

        argumentsExtend(...args) {
            return Object.assign({}, ...args);
        },

        loadJson(url, setting, success, callback, async = true, isForceCallback = false) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, async);

            if (syn.$w.setServiceClientHeader && !this.setServiceClientHeader(xhr)) {
                syn.$l.eventLog('$w.loadJson', `URL ${url}에 대한 setServiceClientHeader 실패`, 'Error');
                if (callback && isForceCallback) callback();
                return;
            }

            const handleResponse = () => {
                if (xhr.status === 200) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        if (success) success(setting, responseData);
                    } catch (e) {
                        syn.$l.eventLog('$w.loadJson', `URL: ${url}, 상태: ${xhr.status}, 오류: ${e}에 대한 JSON 파싱 오류`, 'Error');
                    } finally {
                        if (callback) callback();
                    }
                } else {
                    syn.$l.eventLog('$w.loadJson', `URL: ${url}, 상태: ${xhr.status}, 응답 텍스트: ${xhr.responseText} HTTP 오류`, 'Error');
                    if (callback && isForceCallback) callback();
                }
            };

            if (async) {
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        handleResponse();
                    }
                };
                xhr.onerror = () => {
                    syn.$l.eventLog('$w.loadJson', `URL ${url} 네트워크 오류`, 'Error');
                    if (callback && isForceCallback) callback();
                };
                xhr.send();
            } else {
                try {
                    xhr.send();
                    handleResponse();
                } catch (e) {
                    syn.$l.eventLog('$w.loadJson', `URL: ${url}, 오류: ${e}에 대한 동기 요청 중 오류 발생`, 'Error');
                    if (callback && isForceCallback) callback();
                }
            }
        },

        getTriggerOptions(el) {
            const element = syn.$l.getElement(el);
            const optionsAttr = element?.getAttribute('triggerOptions');
            if (!optionsAttr) return null;
            try {
                return JSON.parse(optionsAttr);
            } catch (e) {
                syn.$l.eventLog('$w.getTriggerOptions', `엘리먼트 ${element?.id}의 triggerOptions 파싱 실패: ${e}`, 'Warning');
                return null;
            }
        },

        triggerAction(triggerConfig) {
            if (!$this) return;

            let isContinue = true;
            const defaults = { arguments: [], options: {} };
            const configParams = syn.$w.argumentsExtend(defaults, triggerConfig.params);

            if ($this.hook?.beforeTrigger) {
                isContinue = $this.hook.beforeTrigger(triggerConfig.triggerID, triggerConfig.action, configParams);
            }

            if (isContinue ?? true) {
                const el = syn.$l.get(triggerConfig.triggerID);
                let triggerResult = null;
                let trigger = null;

                try {
                    if (triggerConfig.action?.startsWith('syn.uicontrols.$')) {
                        trigger = triggerConfig.action.split('.').slice(1).reduce((obj, prop) => obj?.[prop], syn);
                    } else if (triggerConfig.triggerID && triggerConfig.action && $this.event) {
                        trigger = $this.event[`${triggerConfig.triggerID}_${triggerConfig.action}`];
                    } else if (triggerConfig.method) {
                        trigger = new Function(`return (${triggerConfig.method})`)();
                    }

                    if (typeof trigger === 'function') {
                        if (el && triggerConfig.action?.startsWith('syn.uicontrols.$')) {
                            el.setAttribute('triggerOptions', JSON.stringify(configParams.options || {}));
                            configParams.arguments.unshift(triggerConfig.triggerID);
                            triggerResult = trigger.apply(el, configParams.arguments);
                        } else if (el && triggerConfig.triggerID && triggerConfig.action && $this.event) {
                            triggerResult = trigger.apply(el, configParams.arguments);
                        }
                        else if (triggerConfig.method) {
                            triggerResult = trigger.apply($this, configParams.arguments);
                        } else {
                            throw new Error("트리거 컨텍스트 불일치 또는 잘못된 설정입니다.");
                        }

                        if ($this.hook?.afterTrigger) {
                            $this.hook.afterTrigger(null, triggerConfig.action, { elID: triggerConfig.triggerID, result: triggerResult });
                        }
                    } else {
                        throw new Error(`액션: ${triggerConfig.action || triggerConfig.method}에 대한 트리거 함수를 찾을 수 없거나 유효하지 않습니다.`);
                    }
                } catch (error) {
                    const errorMessage = `트리거 실행 실패: ${error.message}`;
                    syn.$l.eventLog('$w.triggerAction', errorMessage, 'Error');
                    if ($this.hook?.afterTrigger) {
                        $this.hook.afterTrigger(errorMessage, triggerConfig.action, null);
                    }
                }
            } else {
                if ($this.hook?.afterTrigger) {
                    $this.hook.afterTrigger('hook.beforeTrigger가 false를 반환했습니다', triggerConfig.action, null);
                }
            }
        },

        getControlModule(modulePath) {
            if (!modulePath) return null;
            try {
                return modulePath.split('.').reduce((obj, prop) => obj?.[prop], context);
            } catch (e) {
                syn.$l.eventLog('$w.getControlModule', `모듈 경로 "${modulePath}" 접근 오류: ${e}`, 'Warning');
                return null;
            }
        },

        tryAddFunction(transactConfig) {
            if (transactConfig && $this && $this.config) {
                if ($object.isNullOrUndefined(transactConfig.noProgress) == true) {
                    transactConfig.noProgress = false;
                }

                try {
                    if ($object.isNullOrUndefined($this.config.transactions) == true) {
                        $this.config.transactions = [];
                    }

                    const transactions = $this.config.transactions;
                    for (let i = 0; i < transactions.length; i++) {
                        if (transactConfig.functionID == transactions[i].functionID) {
                            transactions.splice(i, 1);
                            break;
                        }
                    }

                    const synControlList = $this.context.synControls;
                    const transactionObject = {};
                    transactionObject.functionID = transactConfig.functionID;
                    transactionObject.transactionResult = $object.isNullOrUndefined(transactConfig.transactionResult) == true ? true : transactConfig.transactionResult === true;
                    transactionObject.inputs = [];
                    transactionObject.outputs = [];

                    if (transactConfig.inputs) {
                        const inputs = transactConfig.inputs;
                        const inputsLength = inputs.length;
                        for (let i = 0; i < inputsLength; i++) {
                            const inputConfig = inputs[i];
                            const input = {
                                requestType: inputConfig.type,
                                dataFieldID: inputConfig.dataFieldID ? inputConfig.dataFieldID : document.forms.length > 0 ? document.forms[0].getAttribute('syn-datafield') : '',
                                items: {}
                            };

                            let synControlConfigs = null;
                            if (inputConfig.type == 'Row') {
                                synControlConfigs = synControlList.filter(function (item) {
                                    return item.formDataFieldID == input.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1 || item.type.indexOf('data') > -1) == false;
                                });

                                if (synControlConfigs && synControlConfigs.length > 0) {
                                    for (let k = 0; k < synControlConfigs.length; k++) {
                                        const synControlConfig = synControlConfigs[k];

                                        const el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        const options = el && el.getAttribute('syn-options');
                                        if (options == null) {
                                            continue;
                                        }

                                        let synOptions = null;

                                        try {
                                            synOptions = JSON.parse(options);
                                        } catch (e) {
                                            synOptions = eval('(' + options + ')');
                                        }

                                        if (synOptions == null || $string.isNullOrEmpty(synControlConfig.field) == true) {
                                            continue;
                                        }

                                        let isBelong = false;
                                        if (synOptions.belongID) {
                                            if ($object.isString(synOptions.belongID) == true) {
                                                isBelong = transactConfig.functionID == synOptions.belongID;
                                            }
                                            else if ($object.isArray(synOptions.belongID) == true) {
                                                isBelong = synOptions.belongID.indexOf(transactConfig.functionID) > -1;
                                            }
                                        }

                                        if (isBelong == true) {
                                            input.items[synControlConfig.field] = {
                                                fieldID: synControlConfig.field,
                                                dataType: synOptions.dataType || 'string'
                                            };
                                        }
                                    }
                                }
                                else {
                                    const synControlConfig = synControlList.find(function (item) {
                                        return item.field == input.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1) == true;
                                    });

                                    const controlModule = $object.isNullOrUndefined(synControlConfig) == true ? null : syn.$w.getControlModule(synControlConfig.module);
                                    if ($object.isNullOrUndefined(controlModule) == false && controlModule.setTransactionBelongID) {
                                        controlModule.setTransactionBelongID(synControlConfig.id, input, transactConfig);
                                    }
                                    else {
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                const store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == input.dataFieldID) {
                                                    for (let l = 0; l < store.columns.length; l++) {
                                                        const column = store.columns[l];
                                                        let isBelong = false;
                                                        if ($object.isString(column.belongID) == true) {
                                                            isBelong = transactConfig.functionID == column.belongID;
                                                        }
                                                        else if ($object.isArray(column.belongID) == true) {
                                                            isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                                                        }

                                                        if (isBelong == true) {
                                                            input.items[column.data] = {
                                                                fieldID: column.data,
                                                                dataType: column.dataType || 'string'
                                                            };
                                                        }
                                                    }

                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else if (inputConfig.type == 'List') {
                                const synControlConfig = synControlList.find(function (item) {
                                    return item.field == input.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1) == true;
                                });

                                const controlModule = $object.isNullOrUndefined(synControlConfig) == true ? null : syn.$w.getControlModule(synControlConfig.module);
                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.setTransactionBelongID) {
                                    controlModule.setTransactionBelongID(synControlConfig.id, input, transactConfig);
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                            const store = syn.uicontrols.$data.storeList[k];
                                            if (store.storeType == 'Grid' && store.dataSourceID == input.dataFieldID) {
                                                for (let l = 0; l < store.columns.length; l++) {
                                                    const column = store.columns[l];
                                                    let isBelong = false;
                                                    if ($object.isString(column.belongID) == true) {
                                                        isBelong = transactConfig.functionID == column.belongID;
                                                    }
                                                    else if ($object.isArray(column.belongID) == true) {
                                                        isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                                                    }

                                                    if (isBelong == true) {
                                                        input.items[column.data] = {
                                                            fieldID: column.data,
                                                            dataType: column.dataType || 'string'
                                                        };
                                                    }
                                                }

                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            transactionObject.inputs.push(input);
                        }
                    }

                    if (transactConfig.outputs) {
                        const outputs = transactConfig.outputs;
                        const outputsLength = outputs.length;
                        const synControls = $this.context.synControls;
                        for (let i = 0; i < outputsLength; i++) {
                            const outputConfig = outputs[i];
                            const output = {
                                responseType: outputConfig.type,
                                dataFieldID: outputConfig.dataFieldID ? outputConfig.dataFieldID : '',
                                items: {}
                            };

                            let synControlConfigs = null;
                            if (outputConfig.type == 'Form') {
                                synControlConfigs = synControlList.filter(function (item) {
                                    return item.formDataFieldID == output.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1 || item.type.indexOf('data') > -1) == false;
                                });

                                if (synControlConfigs && synControlConfigs.length > 0) {
                                    for (let k = 0; k < synControlConfigs.length; k++) {
                                        const synControlConfig = synControlConfigs[k];

                                        const el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        const options = el && el.getAttribute('syn-options');
                                        if (options == null) {
                                            continue;
                                        }

                                        let synOptions = null;

                                        try {
                                            synOptions = JSON.parse(options);
                                        } catch (e) {
                                            synOptions = eval('(' + options + ')');
                                        }

                                        if (synOptions == null || $string.isNullOrEmpty(synControlConfig.field) == true) {
                                            continue;
                                        }

                                        output.items[synControlConfig.field] = {
                                            fieldID: synControlConfig.field,
                                            dataType: synOptions.dataType
                                        };

                                        if ($object.isNullOrUndefined(outputConfig.clear) == true || outputConfig.clear == true) {
                                            if (synControls && synControls.length > 0) {
                                                const controlInfo = synControls.find(function (item) {
                                                    return item.field == outputConfig.dataFieldID;
                                                });

                                                if ($string.isNullOrEmpty(controlInfo.module) == true) {
                                                    continue;
                                                }

                                                const controlModule = syn.$w.getControlModule(controlInfo.module);
                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.clear) {
                                                    controlModule.clear(controlInfo.id);
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                            const store = syn.uicontrols.$data.storeList[k];
                                            if (store.storeType == 'Form' && store.dataSourceID == output.dataFieldID) {
                                                for (let l = 0; l < store.columns.length; l++) {
                                                    const column = store.columns[l];

                                                    output.items[column.data] = {
                                                        fieldID: column.data,
                                                        dataType: column.dataType || 'string'
                                                    };
                                                }

                                                if ($object.isNullOrUndefined(outputConfig.clear) == true || outputConfig.clear == true) {
                                                    const dataStore = $this.store[store.dataSourceID];
                                                    if (dataStore) {
                                                        dataStore.length = 0;
                                                    }
                                                }

                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            else if (outputConfig.type == 'Grid') {
                                const synControlConfig = synControlList.find(function (item) {
                                    return item.field == output.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1) == true;
                                });

                                const controlModule = $object.isNullOrUndefined(synControlConfig) == true ? null : syn.$w.getControlModule(synControlConfig.module);
                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.setTransactionBelongID) {
                                    controlModule.setTransactionBelongID(synControlConfig.id, output);

                                    if ($object.isNullOrUndefined(outputConfig.clear) == true || outputConfig.clear == true) {
                                        if (synControls && synControls.length > 0) {
                                            const controlInfo = synControls.find(function (item) {
                                                return item.field == output.dataFieldID;
                                            });

                                            const controlModule = syn.$w.getControlModule(controlInfo.module);
                                            if ($object.isNullOrUndefined(controlModule) == false && controlModule.clear) {
                                                controlModule.clear(controlInfo.id);
                                            }
                                        }
                                    }
                                }
                                else {
                                    synControlConfigs = synControlList.filter(function (item) {
                                        return item.field == output.dataFieldID && ['chart', 'chartjs'].indexOf(item.type) > -1;
                                    });

                                    if (synControlConfigs && synControlConfigs.length == 1) {
                                        const synControlConfig = synControlConfigs[0];

                                        const el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        const synOptions = JSON.parse(el.getAttribute('syn-options'));

                                        if (synOptions == null) {
                                            continue;
                                        }

                                        for (let k = 0; k < synOptions.series.length; k++) {
                                            const column = synOptions.series[k];
                                            output.items[column.columnID] = {
                                                fieldID: column.columnID,
                                                dataType: column.dataType ? column.dataType : 'string'
                                            };
                                        }

                                        if ($object.isNullOrUndefined(outputConfig.clear) == true || outputConfig.clear == true) {
                                            if (synControls && synControls.length > 0) {
                                                const controlInfo = synControls.find(function (item) {
                                                    return item.field == outputConfig.dataFieldID;
                                                });

                                                if ($string.isNullOrEmpty(controlInfo.module) == true) {
                                                    continue;
                                                }

                                                const controlModule = syn.$w.getControlModule(controlInfo.module);
                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.clear) {
                                                    controlModule.clear(controlInfo.id);
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                const store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == output.dataFieldID) {
                                                    for (let l = 0; l < store.columns.length; l++) {
                                                        const column = store.columns[l];

                                                        output.items[column.data] = {
                                                            fieldID: column.data,
                                                            dataType: column.dataType || 'string'
                                                        };
                                                    }

                                                    if ($object.isNullOrUndefined(outputConfig.clear) == true || outputConfig.clear == true) {
                                                        const dataStore = $this.store[store.dataSourceID];
                                                        if (dataStore) {
                                                            dataStore.length = 0;
                                                        }
                                                    }

                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            transactionObject.outputs.push(output);
                        }
                    }

                    $this.config.transactions.push(transactionObject);
                } catch (error) {
                    syn.$l.eventLog('$w.tryAddFunction', error, 'Error');
                }
            }
            else {
                syn.$l.eventLog('$w.tryAddFunction', '{0} 거래 ID 또는 설정 확인 필요'.format(transactConfig), 'Warning');
            }
        },

        transactionAction(transactConfigInput, options) {
            let transactConfig = transactConfigInput;
            if (typeof transactConfigInput === 'string') {
                const functionID = transactConfigInput;
                transactConfig = $this?.transaction?.[functionID];
                if (!transactConfig) {
                    syn.$l.eventLog('$w.transactionAction', `functionID "${functionID}"에 대한 거래 설정을 찾을 수 없습니다.`, 'Warning');
                    return;
                }

                transactConfig.functionID = transactConfig.functionID || functionID;
            }

            if (!transactConfig || !$this?.config) {
                syn.$l.eventLog('$w.transactionAction', '거래 설정이 유효하지 않거나 $this 컨텍스트가 없습니다.', 'Warning');
                return;
            }


            try {
                let isContinue = true;
                if ($this.hook?.beforeTransaction) {
                    isContinue = $this.hook.beforeTransaction(transactConfig);
                }

                if (isContinue ?? true) {
                    const mergedOptions = syn.$w.argumentsExtend({
                        message: '', dynamic: 'Y', authorize: 'N', commandType: 'D',
                        returnType: 'Json', transactionScope: 'N', transactionLog: 'Y'
                    }, options);

                    transactConfig.noProgress = transactConfig.noProgress ?? false;

                    if (syn.$w.progressMessage && !transactConfig.noProgress) {
                        syn.$w.progressMessage(mergedOptions.message);
                    }

                    syn.$w.tryAddFunction(transactConfig);

                    syn.$w.transaction(transactConfig.functionID, (result, additionalData, correlationID) => {
                        let error = null;
                        if (result?.errorText?.length > 0) {
                            error = result.errorText[0];
                            syn.$l.eventLog('$w.transactionAction.callback', `거래 오류: ${error}`, 'Error');
                            return;
                        }

                        let callbackResult = null;
                        if (typeof transactConfig.callback === 'function') {
                            try {
                                callbackResult = transactConfig.callback(error, result, additionalData, correlationID);
                            } catch (e) {
                                syn.$l.eventLog('$w.transactionAction.callbackExec', `콜백 실행 오류: ${e}`, 'Error');
                            }
                        } else if (Array.isArray(transactConfig.callback) && transactConfig.callback.length === 2) {
                            setTimeout(() => {
                                syn.$l.trigger(transactConfig.callback[0], transactConfig.callback[1], { error, result, additionalData, correlationID });
                            }, 0);
                        }

                        if (callbackResult === null || callbackResult === true || Array.isArray(transactConfig.callback)) {
                            if ($this.hook?.afterTransaction) {
                                $this.hook.afterTransaction(null, transactConfig.functionID, result, additionalData, correlationID);
                            }
                        } else if (callbackResult === false) {
                            if ($this.hook?.afterTransaction) {
                                $this.hook.afterTransaction('callbackResult가 false를 반환했습니다', transactConfig.functionID, null, null, correlationID);
                            }
                        }
                    }, mergedOptions);

                } else {
                    if (syn.$w.closeProgressMessage) syn.$w.closeProgressMessage();
                    if ($this.hook?.afterTransaction) {
                        $this.hook.afterTransaction('beforeTransaction이 false를 반환했습니다', transactConfig.functionID, null, null);
                    }
                }
            } catch (error) {
                syn.$l.eventLog('$w.transactionAction', `거래 액션 실행 중 오류 발생: ${error}`, 'Error');
                if (syn.$w.closeProgressMessage) syn.$w.closeProgressMessage();
            }
        },

        transactionDirect(directObject, callback, options) {
            if (!directObject) {
                syn.$l.eventLog('$w.transactionDirect', 'directObject 파라미터가 필요합니다.', 'Error');
                return Promise.reject(new Error('directObject 파라미터가 필요합니다.'));
            }

            return new Promise((resolve, reject) => {
                if (syn.$w.progressMessage && !(directObject.noProgress === true)) {
                    syn.$w.progressMessage();
                }

                const transactionObj = syn.$w.transactionObject(directObject.functionID, 'Json');

                transactionObj.programID = directObject.programID || syn.Config.ApplicationID;
                transactionObj.moduleID = directObject.moduleID || (globalRoot.devicePlatform === 'browser' ? location.pathname.split('/').filter(Boolean)[0] : undefined) || syn.Config.ModuleID;
                transactionObj.businessID = directObject.businessID || syn.Config.ProjectID;
                transactionObj.systemID = directObject.systemID || globalRoot.$this?.config?.systemID || syn.Config.SystemID;
                transactionObj.transactionID = directObject.transactionID;
                transactionObj.transactionToken = directObject.transactionToken;
                transactionObj.dataMapInterface = directObject.dataMapInterface || 'Row|Form';
                transactionObj.transactionResult = directObject.transactionResult ?? true;
                transactionObj.screenID = globalRoot.devicePlatform === 'node'
                    ? (directObject.screenID || directObject.transactionID)
                    : (syn.$w.pageScript?.replace('$', '') ?? '');
                transactionObj.startTraceID = directObject.startTraceID || options?.startTraceID || '';
                transactionObj.inputObjects = directObject.inputObjects || [];

                const mergedOptions = syn.$w.argumentsExtend({
                    message: '', dynamic: 'Y', authorize: 'N', commandType: 'D',
                    returnType: 'Json', transactionScope: 'N', transactionLog: 'Y'
                }, options);
                transactionObj.options = mergedOptions;

                if (directObject.inputLists?.length > 0) {
                    transactionObj.inputs.push(...directObject.inputLists);
                    transactionObj.inputsItemCount.push(directObject.inputLists.length);
                } else if (directObject.inputObjects) {
                    transactionObj.inputs.push(directObject.inputObjects);
                    transactionObj.inputsItemCount.push(1);
                }

                syn.$w.executeTransaction(directObject, transactionObj, (responseData, additionalData) => {
                    if (callback) {
                        try {
                            callback(responseData, additionalData);
                        } catch (e) {
                            const error = new Error(`콜백 오류: ${e}`);
                            syn.$l.eventLog('$w.transactionDirect.callback', error.message, 'Error');
                            reject(error);
                            return;
                        }
                    }

                    if (responseData && responseData.errorText) {
                        reject(new Error(responseData.errorText));
                    } else {
                        resolve({ responseData, additionalData });
                    }
                });
            });
        },

        transaction(functionID, callback, options) {
            let errorText = '';
            try {
                if (syn.$w.domainTransactionLoaderStart) {
                    syn.$w.domainTransactionLoaderStart();
                }

                options = syn.$w.argumentsExtend({
                    message: '',
                    dynamic: 'Y',
                    authorize: 'N',
                    commandType: 'D',
                    returnType: 'Json',
                    transactionScope: 'N',
                    transactionLog: 'Y'
                }, options);

                if (options) {

                    if (syn.$w.progressMessage) {
                        syn.$w.progressMessage(options.message);
                    }
                }

                const result = {
                    errorText: [],
                    outputStat: []
                };

                if ($this && $this.config && $this.config.transactions) {
                    const transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        const transaction = transactions[0];
                        const transactionObject = syn.$w.transactionObject(transaction.functionID, 'Json');

                        transactionObject.programID = $this.config.programID;
                        transactionObject.businessID = $this.config.businessID;
                        transactionObject.systemID = $this.config.systemID;
                        transactionObject.transactionID = $this.config.transactionID;
                        transactionObject.screenID = syn.$w.pageScript.replace('$', '');
                        transactionObject.startTraceID = options.startTraceID || '';
                        transactionObject.options = options;

                        // synControls 컨트롤 목록
                        const synControls = $this.context.synControls;

                        // Input Mapping
                        const inputLength = transaction.inputs.length;
                        for (let inputIndex = 0; inputIndex < inputLength; inputIndex++) {
                            const inputMapping = transaction.inputs[inputIndex];
                            let inputObjects = [];

                            if (inputMapping.requestType == 'Row') {
                                let bindingControlInfos = synControls.filter(function (item) {
                                    return item.field == inputMapping.dataFieldID;
                                });

                                if (bindingControlInfos.length == 1) {
                                    const controlInfo = bindingControlInfos[0];

                                    if (controlInfo.type.indexOf('grid') > -1 || controlInfo.type.indexOf('chart') > -1) {
                                        const dataFieldID = inputMapping.dataFieldID;

                                        let controlValue = '';
                                        if (synControls && synControls.length > 0) {
                                            bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                const controlInfo = bindingControlInfos[0];
                                                const controlModule = syn.$w.getControlModule(controlInfo.module);

                                                const el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                                const synOptions = JSON.parse(el.getAttribute('syn-options'));

                                                for (let k = 0; k < synOptions.columns.length; k++) {
                                                    const column = synOptions.columns[k];
                                                    if (column.validators && $validation.transactionValidate) {
                                                        column.controlText = synOptions.controlText || '';
                                                        const isValidate = $validation.transactionValidate(controlModule, controlInfo, column, inputMapping.requestType);

                                                        if (isValidate == false) {
                                                            if ($this.hook.afterTransaction) {
                                                                $this.hook.afterTransaction('validators continue false', functionID, column, null);
                                                            }

                                                            if (syn.$w.domainTransactionLoaderEnd) {
                                                                syn.$w.domainTransactionLoaderEnd();
                                                            }

                                                            return false;
                                                        }
                                                    }
                                                }

                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                                    inputObjects = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'Row', inputMapping.items)[0];
                                                }
                                            }
                                            else {
                                                syn.$l.eventLog('$w.transaction', '"{0}" Row List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                    else {
                                        for (const key in inputMapping.items) {
                                            const meta = inputMapping.items[key];
                                            const dataFieldID = key;
                                            const fieldID = meta.fieldID; // DbColumnID
                                            const dataType = meta.dataType;
                                            const serviceObject = { prop: fieldID, val: '' };

                                            let controlValue = '';
                                            if (synControls.length > 0) {
                                                bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == dataFieldID && item.formDataFieldID == inputMapping.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    const controlInfo = bindingControlInfos[0];
                                                    if ($object.isNullOrUndefined(controlInfo.module) == true) {
                                                        controlValue = syn.$l.get(controlInfo.id).value;
                                                    }
                                                    else {
                                                        const controlModule = syn.$w.getControlModule(controlInfo.module);

                                                        const el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                                        const synOptions = JSON.parse(el.getAttribute('syn-options'));

                                                        if (synOptions.validators && $validation.transactionValidate) {
                                                            const isValidate = $validation.transactionValidate(controlModule, controlInfo, synOptions, inputMapping.requestType);

                                                            if (isValidate == false) {
                                                                if ($this.hook.afterTransaction) {
                                                                    $this.hook.afterTransaction('validators continue false', functionID, synOptions, null);
                                                                }

                                                                if (syn.$w.domainTransactionLoaderEnd) {
                                                                    syn.$w.domainTransactionLoaderEnd();
                                                                }

                                                                return false;
                                                            }
                                                        }

                                                        if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                                            controlValue = controlModule.getValue(controlInfo.id.replace('_hidden', ''), meta);
                                                        }

                                                        if ($object.isNullOrUndefined(controlValue) == true && (dataType == 'number' || dataType == 'numeric')) {
                                                            controlValue = 0;
                                                        }
                                                    }
                                                }
                                                else {
                                                    syn.$l.eventLog('$w.transaction', '"{0}" Row Control Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                                    continue;
                                                }
                                            }

                                            serviceObject.val = controlValue;
                                            inputObjects.push(serviceObject);
                                        }
                                    }
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (const key in inputMapping.items) {
                                            let isMapping = false;
                                            const meta = inputMapping.items[key];
                                            const dataFieldID = key;
                                            const fieldID = meta.fieldID; // DbColumnID
                                            const dataType = meta.dataType;
                                            const serviceObject = { prop: fieldID, val: '' };

                                            let controlValue = '';
                                            for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                const store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == inputMapping.dataFieldID) {
                                                    isMapping = true;
                                                    bindingControlInfos = store.columns.filter(function (item) {
                                                        return item.data == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        const controlInfo = bindingControlInfos[0];
                                                        controlValue = $this.store[store.dataSourceID][controlInfo.data];

                                                        if ($object.isNullOrUndefined(controlValue) == true && (dataType == 'number' || dataType == 'numeric')) {
                                                            controlValue = 0;
                                                        }

                                                        if ($object.isNullOrUndefined(controlValue) == true) {
                                                            controlValue = '';
                                                        }
                                                    }
                                                    else {
                                                        syn.$l.eventLog('$w.transaction', '"{0}" Row Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                                    }

                                                    break;
                                                }
                                            }

                                            if (isMapping == true) {
                                                serviceObject.val = controlValue;
                                                inputObjects.push(serviceObject);
                                            }
                                            else {
                                                syn.$l.eventLog('$w.transaction', '{0} Row 컨트롤 ID 중복 또는 존재여부 확인 필요'.format(inputMapping.dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                }

                                transactionObject.inputs.push(inputObjects);
                                transactionObject.inputsItemCount.push(1);
                            }
                            else if (inputMapping.requestType == 'List') {
                                const dataFieldID = inputMapping.dataFieldID;

                                if (synControls && synControls.length > 0) {
                                    let bindingControlInfos = synControls.filter(function (item) {
                                        return item.field == dataFieldID;
                                    });

                                    if (bindingControlInfos.length == 1) {
                                        const controlInfo = bindingControlInfos[0];
                                        const controlModule = syn.$w.getControlModule(controlInfo.module);

                                        const el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                        const synOptions = JSON.parse(el.getAttribute('syn-options'));

                                        for (let k = 0; k < synOptions.columns.length; k++) {
                                            const column = synOptions.columns[k];
                                            column.controlText = synOptions.controlText || '';
                                            if (column.validators && $validation.transactionValidate) {
                                                const isValidate = $validation.transactionValidate(controlModule, controlInfo, column, inputMapping.requestType);

                                                if (isValidate == false) {
                                                    if ($this.hook.afterTransaction) {
                                                        $this.hook.afterTransaction('validators continue false', functionID, column, null);
                                                    }

                                                    if (syn.$w.domainTransactionLoaderEnd) {
                                                        syn.$w.domainTransactionLoaderEnd();
                                                    }

                                                    return false;
                                                }
                                            }
                                        }

                                        if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                            inputObjects = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'List', inputMapping.items);
                                        }
                                    }
                                    else {
                                        let isMapping = false;
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                const store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == dataFieldID) {
                                                    isMapping = true;
                                                    const bindingInfo = syn.uicontrols.$data.bindingList.find(function (item) {
                                                        return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                    });

                                                    if (bindingInfo) {
                                                        inputObjects = $this.store[store.dataSourceID][bindingInfo.dataFieldID];
                                                    }
                                                    else {
                                                        let controlValue = [];
                                                        const items = $this.store[store.dataSourceID];
                                                        const length = items.length;
                                                        for (let i = 0; i < length; i++) {
                                                            const item = items[i];

                                                            const row = [];
                                                            for (const key in item) {
                                                                const serviceObject = { prop: key, val: item[key] };
                                                                row.push(serviceObject);
                                                            }
                                                            controlValue.push(row);
                                                        }

                                                        inputObjects = controlValue;
                                                    }

                                                    break;
                                                }
                                            }
                                        }

                                        if (isMapping == false) {
                                            syn.$l.eventLog('$w.transaction', '"{0}" List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                        }
                                    }
                                }

                                if (inputObjects && inputObjects.length == 0) {
                                    inputObjects = [[{ prop: 'DefaultEmpty', val: '' }]];
                                };

                                for (const key in inputObjects) {
                                    transactionObject.inputs.push(inputObjects[key]);
                                }
                                transactionObject.inputsItemCount.push(inputObjects.length);
                            }
                        }

                        syn.$w.executeTransaction($this.config, transactionObject, function (responseData, addtionalData, correlationID) {
                            let isDynamicOutput = false;
                            for (let i = 0; i < transaction.outputs.length; i++) {
                                if (transaction.outputs[i].responseType == 'Dynamic') {
                                    isDynamicOutput = true;
                                    break;
                                }
                            }

                            if (isDynamicOutput == true) {
                                result.outputStat.push({
                                    fieldID: 'Dynamic',
                                    count: 1,
                                    dynamicData: responseData
                                });
                            }
                            else {
                                if (responseData.length == transaction.outputs.length) {
                                    const synControls = $this.context.synControls;
                                    const outputLength = transaction.outputs.length;
                                    for (let outputIndex = 0; outputIndex < outputLength; outputIndex++) {
                                        const outputMapping = transaction.outputs[outputIndex];
                                        const dataMapItem = responseData[outputIndex];
                                        const responseFieldID = dataMapItem['id'];
                                        const outputData = dataMapItem['value'];

                                        if ($this.hook.outputDataBinding) {
                                            $this.hook.outputDataBinding(functionID, responseFieldID, outputData);
                                        }

                                        if (outputMapping.responseType == 'Form') {
                                            if ($object.isNullOrUndefined(outputData) == true || $object.isObjectEmpty(outputData) == true) {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: 0
                                                });
                                            }
                                            else {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: 1
                                                });

                                                for (const key in outputMapping.items) {
                                                    const meta = outputMapping.items[key];
                                                    const dataFieldID = key;
                                                    const fieldID = meta.fieldID;

                                                    const controlValue = outputData[fieldID];
                                                    if (controlValue !== undefined && synControls && synControls.length > 0) {
                                                        let bindingControlInfos = synControls.filter(function (item) {
                                                            return item.field == dataFieldID && item.formDataFieldID == outputMapping.dataFieldID;
                                                        });

                                                        if (bindingControlInfos.length == 1) {
                                                            const controlInfo = bindingControlInfos[0];
                                                            const controlModule = syn.$w.getControlModule(controlInfo.module);
                                                            if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                                controlModule.setValue(controlInfo.id.replace('_hidden', ''), controlValue, meta);
                                                            }
                                                        }
                                                        else {
                                                            let isMapping = false;
                                                            if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                                for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                                    const store = syn.uicontrols.$data.storeList[k];
                                                                    if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                                        $this.store[store.dataSourceID] = {};
                                                                    }

                                                                    if (store.storeType == 'Form' && store.dataSourceID == outputMapping.dataFieldID) {
                                                                        isMapping = true;
                                                                        bindingControlInfos = store.columns.filter(function (item) {
                                                                            return item.data == dataFieldID;
                                                                        });

                                                                        if (bindingControlInfos.length == 1) {
                                                                            $this.store[store.dataSourceID][dataFieldID] = controlValue;
                                                                        }

                                                                        break;
                                                                    }
                                                                }
                                                            }

                                                            if (isMapping == false) {
                                                                errorText = '"{0}" Form Output Mapping 확인 필요'.format(dataFieldID);
                                                                result.errorText.push(errorText);
                                                                syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        else if (outputMapping.responseType == 'Grid') {
                                            result.outputStat.push({
                                                fieldID: responseFieldID,
                                                Count: outputData.length
                                            });
                                            const dataFieldID = outputMapping.dataFieldID;
                                            if (synControls && synControls.length > 0) {
                                                let bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    const controlInfo = bindingControlInfos[0];
                                                    const controlModule = syn.$w.getControlModule(controlInfo.module);
                                                    if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                        controlModule.setValue(controlInfo.id.replace('_hidden', ''), outputData, outputMapping.items);
                                                    }
                                                }
                                                else {
                                                    let isMapping = false;
                                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                        for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                            const store = syn.uicontrols.$data.storeList[k];
                                                            if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                                $this.store[store.dataSourceID] = [];
                                                            }

                                                            if (store.storeType == 'Grid' && store.dataSourceID == outputMapping.dataFieldID) {
                                                                isMapping = true;
                                                                const bindingInfos = syn.uicontrols.$data.bindingList.filter(function (item) {
                                                                    return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                                });

                                                                const length = outputData.length;
                                                                for (let i = 0; i < length; i++) {
                                                                    outputData[i].Flag = 'R';
                                                                }

                                                                if (bindingInfos.length > 0) {
                                                                    for (let binding_i = 0; binding_i < bindingInfos.length; binding_i++) {
                                                                        const bindingInfo = bindingInfos[binding_i];
                                                                        $this.store[store.dataSourceID][bindingInfo.dataFieldID] = outputData;
                                                                    }
                                                                }
                                                                else {
                                                                    $this.store[store.dataSourceID] = outputData;
                                                                }
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    if (isMapping == false) {
                                                        errorText = '"{0}" Grid Output Mapping 확인 필요'.format(dataFieldID);
                                                        result.errorText.push(errorText);
                                                        syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                    }
                                                }
                                            }
                                        }
                                        else if (outputMapping.responseType == 'Chart') {
                                            result.outputStat.push({
                                                fieldID: responseFieldID,
                                                Count: outputData.length
                                            });
                                            const dataFieldID = outputMapping.dataFieldID;

                                            if (synControls && synControls.length > 0) {
                                                let bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    const controlInfo = bindingControlInfos[0];
                                                    const controlModule = syn.$w.getControlModule(controlInfo.module);
                                                    if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                        controlModule.setValue(controlInfo.id.replace('_hidden', ''), outputData, outputMapping.items);
                                                    }
                                                }
                                                else {
                                                    errorText = '"{0}" Chart Output Mapping 확인 필요'.format(dataFieldID);
                                                    result.errorText.push(errorText);
                                                    syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    errorText = '"{0}" 기능의 거래 응답 정의와 데이터 갯수가 다릅니다'.format(transaction.functionID);
                                    result.errorText.push(errorText);
                                    syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                }
                            }

                            if (callback) {
                                callback(result, addtionalData, correlationID);
                            }

                            if (syn.$w.domainTransactionLoaderEnd) {
                                syn.$w.domainTransactionLoaderEnd();
                            }
                        });
                    }
                    else {
                        errorText = '"{0}" 거래 중복 또는 존재여부 확인 필요'.format(functionID);
                        result.errorText.push(errorText);
                        syn.$l.eventLog('$w.transaction', errorText, 'Error');

                        if (callback) {
                            callback(result);
                        }

                        if (syn.$w.domainTransactionLoaderEnd) {
                            syn.$w.domainTransactionLoaderEnd();
                        }
                    }
                }
                else {
                    errorText = '화면 매핑 정의 데이터가 없습니다';
                    result.errorText.push(errorText);
                    syn.$l.eventLog('$w.transaction', errorText, 'Error');

                    if (callback) {
                        callback(result);
                    }

                    if (syn.$w.domainTransactionLoaderEnd) {
                        syn.$w.domainTransactionLoaderEnd();
                    }
                }
            } catch (error) {
                syn.$l.eventLog('$w.transaction', error, 'Error');

                if (syn.$w.domainTransactionLoaderEnd) {
                    syn.$w.domainTransactionLoaderEnd();
                }
            }
        },

        getterValue(functionID) {
            try {
                const transactConfig = $this.transaction[functionID];
                if ($object.isNullOrUndefined(transactConfig) == true) {
                    syn.$l.eventLog('$w.getterValue', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
                    return;
                }

                if ($string.isNullOrEmpty(transactConfig.functionID) == true) {
                    transactConfig.functionID = functionID;
                }

                syn.$w.tryAddFunction(transactConfig);

                let errorText = '';
                const result = {
                    errors: [],
                    inputs: [],
                };

                if ($this && $this.config && $this.config.transactions) {
                    const transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        const transaction = transactions[0];

                        const synControls = context[syn.$w.pageScript].context.synControls;

                        const inputLength = transaction.inputs.length;
                        for (let inputIndex = 0; inputIndex < inputLength; inputIndex++) {
                            const inputMapping = transaction.inputs[inputIndex];
                            let inputObjects = [];

                            if (inputMapping.requestType == 'Row') {
                                let bindingControlInfos = synControls.filter(function (item) {
                                    return item.field == inputMapping.dataFieldID;
                                });

                                if (bindingControlInfos.length == 1) {
                                    const controlInfo = bindingControlInfos[0];

                                    if (controlInfo.type.indexOf('grid') > -1 || controlInfo.type.indexOf('chart') > -1) {
                                        const dataFieldID = inputMapping.dataFieldID;

                                        let controlValue = '';
                                        if (synControls && synControls.length > 0) {
                                            bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                const controlInfo = bindingControlInfos[0];
                                                const controlModule = syn.$w.getControlModule(controlInfo.module);
                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                                    inputObjects = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'Row', inputMapping.items)[0];
                                                }
                                            }
                                            else {
                                                syn.$l.eventLog('$w.getterValue', '"{0}" Row List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                    else {
                                        for (const key in inputMapping.items) {
                                            const meta = inputMapping.items[key];
                                            const dataFieldID = key;
                                            const fieldID = meta.fieldID;
                                            const dataType = meta.dataType;
                                            const serviceObject = { prop: fieldID, val: '' };

                                            let controlValue = '';
                                            if (synControls.length > 0) {
                                                bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == dataFieldID && item.formDataFieldID == inputMapping.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    const controlInfo = bindingControlInfos[0];
                                                    const controlModule = syn.$w.getControlModule(controlInfo.module);
                                                    if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                                        controlValue = controlModule.getValue(controlInfo.id.replace('_hidden', ''), meta);
                                                    }

                                                    if ($object.isNullOrUndefined(controlValue) == true && (dataType == 'number' || dataType == 'numeric')) {
                                                        controlValue = 0;
                                                    }
                                                }
                                                else {
                                                    syn.$l.eventLog('$w.getterValue', '"{0}" Row Control Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                                    continue;
                                                }
                                            }

                                            serviceObject.val = controlValue;
                                            inputObjects.push(serviceObject);
                                        }
                                    }
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (const key in inputMapping.items) {
                                            let isMapping = false;
                                            const meta = inputMapping.items[key];
                                            const dataFieldID = key;
                                            const fieldID = meta.fieldID;
                                            const dataType = meta.dataType;
                                            const serviceObject = { prop: fieldID, val: '' };

                                            let controlValue = '';
                                            for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                const store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == inputMapping.dataFieldID) {
                                                    isMapping = true;
                                                    bindingControlInfos = store.columns.filter(function (item) {
                                                        return item.data == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        const controlInfo = bindingControlInfos[0];
                                                        controlValue = $this.store[store.dataSourceID][controlInfo.data];

                                                        if ($object.isNullOrUndefined(controlValue) == true && (dataType == 'number' || dataType == 'numeric')) {
                                                            controlValue = 0;
                                                        }

                                                        if ($object.isNullOrUndefined(controlValue) == true) {
                                                            controlValue = '';
                                                        }
                                                    }
                                                    else {
                                                        syn.$l.eventLog('$w.getterValue', '"{0}" Row Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                                    }

                                                    break;
                                                }
                                            }

                                            if (isMapping == true) {
                                                serviceObject.val = controlValue;
                                                inputObjects.push(serviceObject);
                                            }
                                            else {
                                                syn.$l.eventLog('$w.getterValue', '{0} Row 컨트롤 ID 중복 또는 존재여부 확인 필요'.format(inputMapping.dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                }

                                const input = {};
                                for (let i = 0; i < inputObjects.length; i++) {
                                    const inputObject = inputObjects[i];
                                    input[inputObject.prop] = inputObject.val;
                                }
                                result.inputs.push(input);
                            }
                            else if (inputMapping.requestType == 'List') {
                                const dataFieldID = inputMapping.dataFieldID;

                                if (synControls && synControls.length > 0) {
                                    let bindingControlInfos = synControls.filter(function (item) {
                                        return item.field == dataFieldID;
                                    });

                                    if (bindingControlInfos.length == 1) {
                                        const controlInfo = bindingControlInfos[0];
                                        const controlModule = syn.$w.getControlModule(controlInfo.module);
                                        if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                            inputObjects = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'List', inputMapping.items);
                                        }
                                    }
                                    else {
                                        let isMapping = false;
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                const store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == dataFieldID) {
                                                    isMapping = true;
                                                    const bindingInfo = syn.uicontrols.$data.bindingList.find(function (item) {
                                                        return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                    });

                                                    if (bindingInfo) {
                                                        inputObjects = $this.store[store.dataSourceID][bindingInfo.dataFieldID];
                                                    }
                                                    else {
                                                        let controlValue = [];
                                                        const items = $this.store[store.dataSourceID];
                                                        const length = items.length;
                                                        for (let i = 0; i < length; i++) {
                                                            const item = items[i];

                                                            const row = [];
                                                            for (const key in item) {
                                                                const serviceObject = { prop: key, val: item[key] };
                                                                row.push(serviceObject);
                                                            }
                                                            controlValue.push(row);
                                                        }

                                                        inputObjects = controlValue;
                                                    }

                                                    break;
                                                }
                                            }
                                        }

                                        if (isMapping == false) {
                                            syn.$l.eventLog('$w.getterValue', '"{0}" List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                        }
                                    }
                                }


                                if (inputObjects && inputObjects.length == 0) {
                                    inputObjects = [[{ prop: 'DefaultEmpty', val: '' }]];
                                };

                                for (const key in inputObjects) {
                                    const input = {};
                                    const inputList = inputObjects[key];
                                    for (let i = 0; i < inputList.length; i++) {
                                        const inputObject = inputList[i];
                                        input[inputObject.prop] = inputObject.val;
                                    }
                                    result.inputs.push(input);
                                }
                            }
                        }

                        return result;
                    }
                    else {
                        errorText = '"{0}" 거래 중복 또는 존재여부 확인 필요'.format(functionID);
                        result.errors.push(errorText);
                        syn.$l.eventLog('$w.getterValue', errorText, 'Error');

                        return result;
                    }
                }
                else {
                    errorText = '화면 매핑 정의 데이터가 없습니다';
                    result.errors.push(errorText);
                    syn.$l.eventLog('$w.getterValue', errorText, 'Error');

                    return result;
                }
            } catch (error) {
                syn.$l.eventLog('$w.getterValue', error, 'Error');

                result.errors.push(error.message);
                return result;
            }
        },

        setterValue(functionID, responseData) {
            try {
                const transactConfig = $this.transaction[functionID];
                if ($object.isNullOrUndefined(transactConfig) == true) {
                    syn.$l.eventLog('$w.setterValue', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
                    return;
                }

                if ($string.isNullOrEmpty(transactConfig.functionID) == true) {
                    transactConfig.functionID = functionID;
                }

                syn.$w.tryAddFunction(transactConfig);

                let errorText = '';
                const result = {
                    errors: [],
                    outputs: [],
                };

                if ($this && $this.config && $this.config.transactions) {
                    const transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        const transaction = transactions[0];
                        const synControls = context[syn.$w.pageScript].context.synControls;
                        const outputLength = transaction.outputs.length;
                        for (let outputIndex = 0; outputIndex < outputLength; outputIndex++) {
                            const outputMapping = transaction.outputs[outputIndex];
                            const responseFieldID = outputMapping.responseType + 'Data' + outputIndex.toString();
                            const outputData = responseData[outputIndex];

                            if (outputMapping.responseType == 'Form') {
                                if ($object.isNullOrUndefined(outputData) == true || $object.isObjectEmpty(outputData) == true) {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: 0
                                    });
                                }
                                else {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: 1
                                    });

                                    for (const key in outputMapping.items) {
                                        const meta = outputMapping.items[key];
                                        const dataFieldID = key;
                                        const fieldID = meta.fieldID;

                                        const controlValue = outputData[fieldID];
                                        if (controlValue !== undefined && synControls && synControls.length > 0) {
                                            let bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID && item.formDataFieldID == outputMapping.dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                const controlInfo = bindingControlInfos[0];
                                                const controlModule = syn.$w.getControlModule(controlInfo.module);
                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                    controlModule.setValue(controlInfo.id.replace('_hidden', ''), controlValue, meta);
                                                }
                                            }
                                            else {
                                                let isMapping = false;
                                                if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                    for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                        const store = syn.uicontrols.$data.storeList[k];
                                                        if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                            $this.store[store.dataSourceID] = {};
                                                        }

                                                        if (store.storeType == 'Form' && store.dataSourceID == outputMapping.dataFieldID) {
                                                            isMapping = true;
                                                            bindingControlInfos = store.columns.filter(function (item) {
                                                                return item.data == dataFieldID;
                                                            });

                                                            if (bindingControlInfos.length == 1) {
                                                                $this.store[store.dataSourceID][dataFieldID] = controlValue;
                                                            }

                                                            break;
                                                        }
                                                    }
                                                }

                                                if (isMapping == false) {
                                                    errorText = '"{0}" Form Output Mapping 확인 필요'.format(dataFieldID);
                                                    result.errors.push(errorText);
                                                    syn.$l.eventLog('$w.setterValue', errorText, 'Error');
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else if (outputMapping.responseType == 'Grid') {
                                if (outputData.length && outputData.length > 0) {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: outputData.length
                                    });
                                    const dataFieldID = outputMapping.dataFieldID;
                                    if (synControls && synControls.length > 0) {
                                        let bindingControlInfos = synControls.filter(function (item) {
                                            return item.field == dataFieldID;
                                        });

                                        if (bindingControlInfos.length == 1) {
                                            const controlInfo = bindingControlInfos[0];
                                            const controlModule = syn.$w.getControlModule(controlInfo.module);
                                            if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                controlModule.setValue(controlInfo.id.replace('_hidden', ''), outputData, outputMapping.items);
                                            }
                                        }
                                        else {
                                            let isMapping = false;
                                            if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                for (let k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                    const store = syn.uicontrols.$data.storeList[k];
                                                    if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                        $this.store[store.dataSourceID] = [];
                                                    }

                                                    if (store.storeType == 'Grid' && store.dataSourceID == outputMapping.dataFieldID) {
                                                        isMapping = true;
                                                        const bindingInfos = syn.uicontrols.$data.bindingList.filter(function (item) {
                                                            return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                        });

                                                        const length = outputData.length;
                                                        for (let i = 0; i < length; i++) {
                                                            outputData[i].Flag = 'R';
                                                        }

                                                        if (bindingInfos.length > 0) {
                                                            for (let binding_i = 0; binding_i < bindingInfos.length; binding_i++) {
                                                                const bindingInfo = bindingInfos[binding_i];
                                                                $this.store[store.dataSourceID][bindingInfo.dataFieldID] = outputData;
                                                            }
                                                        }
                                                        else {
                                                            $this.store[store.dataSourceID] = outputData;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }

                                            if (isMapping == false) {
                                                errorText = '"{0}" Grid Output Mapping 확인 필요'.format(dataFieldID);
                                                result.errors.push(errorText);
                                                syn.$l.eventLog('$w.setterValue', errorText, 'Error');
                                            }
                                        }
                                    }
                                }
                                else {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: 0
                                    });
                                }
                            }
                            else if (outputMapping.responseType == 'Chart') {
                                if (outputData.length && outputData.length > 0) {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: outputData.length
                                    });
                                    const dataFieldID = outputMapping.dataFieldID;

                                    if (synControls && synControls.length > 0) {
                                        let bindingControlInfos = synControls.filter(function (item) {
                                            return item.field == dataFieldID;
                                        });

                                        if (bindingControlInfos.length == 1) {
                                            const controlInfo = bindingControlInfos[0];
                                            const controlModule = syn.$w.getControlModule(controlInfo.module);
                                            if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                controlModule.setValue(controlInfo.id.replace('_hidden', ''), outputData, outputMapping.items);
                                            }
                                        }
                                        else {
                                            errorText = '"{0}" Chart Output Mapping 확인 필요'.format(dataFieldID);
                                            result.errors.push(errorText);
                                            syn.$l.eventLog('$w.setterValue', errorText, 'Error');
                                        }
                                    }
                                }
                                else {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: 0
                                    });
                                }
                            }
                        }

                        return result;
                    }
                    else {
                        errorText = '"{0}" 거래 중복 또는 존재여부 확인 필요'.format(functionID);
                        result.errors.push(errorText);
                        syn.$l.eventLog('$w.setterValue', errorText, 'Error');

                        return result;
                    }
                }
                else {
                    errorText = '화면 매핑 정의 데이터가 없습니다';
                    result.errors.push(errorText);
                    syn.$l.eventLog('$w.setterValue', errorText, 'Error');

                    return result;
                }
            } catch (error) {
                syn.$l.eventLog('$w.setterValue', error, 'Error');
                result.errors.push(error.message);
                return result;
            }
        },

        scrollToTop() {
            if (!doc?.documentElement || !context.requestAnimationFrame || !context.scrollTo) return;

            const scrollStep = () => {
                const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
                if (scrollTop > 0) {
                    context.requestAnimationFrame(scrollStep);
                    context.scrollTo(0, scrollTop - scrollTop / 8);
                }
            };
            context.requestAnimationFrame(scrollStep);
        },

        scrollToElement(el, offset) {
            const doc = document;
            const context = window;

            if (!doc?.documentElement || !context.requestAnimationFrame || !context.scrollTo) {
                return;
            }

            el = syn.$l.getElement(el);
            if (!el) {
                return;
            }

            offset = offset || 0;
            const targetScrollTop = el.getBoundingClientRect().top + context.scrollY - offset;;
            const startScrollTop = context.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop;
            const distance = targetScrollTop - startScrollTop;
            const startTime = performance.now();
            const duration = 200;
            const scrollStep = (currentTime) => {
                const elapsed = currentTime - startTime;

                const progress = Math.min(1, elapsed / duration);

                const easeProgress = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                const currentScroll = startScrollTop + (distance * easeProgress);

                context.scrollTo(0, currentScroll);

                if (progress < 1) {
                    context.requestAnimationFrame(scrollStep);
                }
            };

            context.requestAnimationFrame(scrollStep);
        },

        setFavicon(url) {
            if (!doc) return;
            let favicon = doc.querySelector('link[rel="icon"]');
            if (favicon) {
                favicon.href = url;
            } else {
                favicon = doc.createElement('link');
                favicon.rel = 'icon';
                favicon.href = url;
                doc.head?.appendChild(favicon);
            }
        },

        fileDownload(url, fileName) {
            if (!doc || !url) return;

            const downloadFileName = fileName || url.substring(url.lastIndexOf('/') + 1).split('.')[0] || 'download';
            const link = doc.createElement('a');
            link.href = url;
            link.download = downloadFileName;
            link.style.display = 'none';

            doc.body.appendChild(link);
            try {
                link.click();
            } catch (e) {
                syn.$l.eventLog('$w.fileDownload', `${url} 다운로드 실행 오류: ${e}`, 'Error');
            } finally {
                setTimeout(() => doc.body.removeChild(link), 100);
            }
        },

        sleep(ms, callback) {
            if (typeof callback === 'function') {
                return setTimeout(callback, ms);
            } else if (typeof Promise !== 'undefined') {
                return new Promise(resolve => setTimeout(resolve, ms));
            } else {
                syn.$l.eventLog('$w.sleep', '콜백 또는 Promise 지원이 필요합니다.', 'Debug');
                const start = Date.now();
                while (Date.now() < start + ms) { }
                return undefined;
            }
        },

        purge(el) {
            if (!el) return;
            const attributes = el.attributes;
            if (attributes) {
                for (let i = attributes.length - 1; i >= 0; i--) {
                    const name = attributes[i].name;
                    if (name.startsWith('on') && typeof el[name] === 'function') {
                        try { el[name] = null; } catch (e) { }
                    }
                }
            }

            let child = el.firstChild;
            while (child) {
                syn.$w.purge(child);
                child = child.nextSibling;
            }

            if (syn.$l?.events?.removeAllForElement) {
                syn.$l.events.removeAllForElement(el);
            }
        },

        setServiceObject(value) {
            syn.$w.serviceObject = typeof value === 'string' ? value : JSON.stringify(value);
            return this;
        },

        setServiceClientHeader(xhr) {
            xhr.setRequestHeader('CertificationKey', 'SGFuZFN0YWNr');
            return true;
        },

        xmlParser(xmlString) {
            if (typeof DOMParser === 'undefined') {
                syn.$l.eventLog('$w.xmlParser', '이 환경에서는 DOMParser가 지원되지 않습니다.', 'Error');
                return null;
            }
            try {
                const parser = new DOMParser();
                return parser.parseFromString(xmlString, 'text/xml');
            } catch (e) {
                syn.$l.eventLog('$w.xmlParser', `XML 파싱 오류: ${e}`, 'Error');
                return null;
            }
        },

        apiHttp(url) {
            return new Proxy({}, {
                get(target, action) {
                    return async function (raw, options) {
                        if (['send'].indexOf(action) == -1) {
                            return Promise.resolve({ error: `${action} 메서드 확인 필요` });
                        }

                        options = syn.$w.argumentsExtend({
                            method: 'GET'
                        }, options);

                        var requestTimeoutID = null;
                        if ($object.isNullOrUndefined(raw) == false && $object.isString(raw) == false) {
                            if (options.method == 'GET' || options.method == 'HEAD') {
                                options.method = 'POST';
                            }
                            else {
                                options.method = options.method || 'POST';
                            }

                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                if (raw instanceof FormData) {
                                }
                                else {
                                    options.headers.append('Content-Type', options.contentType || 'application/json');
                                }
                            }

                            if (syn.Environment) {
                                var environment = syn.Environment;
                                if (environment.Header) {
                                    for (var item in environment.Header) {
                                        if (options.headers.has(item) == false) {
                                            options.headers.append(item, environment.Header[item]);
                                        }
                                    }
                                }
                            }

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                body: raw instanceof FormData ? raw : JSON.stringify(raw),
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                var controller = new AbortController();
                                requestTimeoutID = setTimeout(() => controller.abort(), options.timeout);
                                data.signal = controller.signal;
                            }

                            var response = await fetch(url, data);

                            if (requestTimeoutID) {
                                clearTimeout(requestTimeoutID);
                            }
                        }
                        else {
                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                options.headers.append('Content-Type', options.contentType || 'application/json');
                            }

                            if (syn.Environment) {
                                var environment = syn.Environment;
                                if (environment.Header) {
                                    for (var item in environment.Header) {
                                        if (options.headers.has(item) == false) {
                                            options.headers.append(item, environment.Header[item]);
                                        }
                                    }
                                }
                            }

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                var controller = new AbortController();
                                requestTimeoutID = setTimeout(() => controller.abort(), options.timeout);
                                data.signal = controller.signal;
                            }

                            var response = await fetch(url, data);

                            if (requestTimeoutID) {
                                clearTimeout(requestTimeoutID);
                            }
                        }
                        var result = { error: '요청 정보 확인 필요' };
                        if (response.ok == true) {
                            var contentType = response.headers.get('Content-Type') || '';
                            if (contentType.includes('application/json') == true) {
                                result = await response.json();
                            }
                            else if (contentType.includes('text/') == true) {
                                result = await response.text();
                            }
                            else {
                                result = await response.blob();
                            }
                            return Promise.resolve(result);
                        }
                        else {
                            result = { error: `상태: ${response.status}, 텍스트: ${await response.text()}` }
                            syn.$l.eventLog('$w.apiHttp', `API HTTP 오류: ${result.error}`, 'Error');
                        }

                        return Promise.resolve(result);
                    };
                }
            });
        },

        xmlHttp() {
            return new globalRoot.XMLHttpRequest();
        },

        loadScript(url, scriptID, callback) {
            var head;
            var resourceID;
            if (document.getElementsByTagName('head')) {
                head = document.getElementsByTagName('head')[0];
            }
            else {
                document.documentElement.insertBefore(document.createElement('head'), document.documentElement.firstChild);
                head = document.getElementsByTagName('head')[0];
            }

            resourceID = scriptID || 'id_' + syn.$l.random();

            var scriptTag = document.getElementById(resourceID);
            if (scriptTag) {
                callback();
            } else {
                var el = document.createElement('script');
                el.setAttribute('type', 'text/javascript');
                el.setAttribute('id', resourceID);
                if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                    el.setAttribute('src', url);
                }
                else {
                    el.setAttribute('src', url + (url.indexOf('?') > -1 ? '&' : '?') + 'noCache=' + (new Date()).getTime());
                }

                if (callback && typeof callback === 'function') {
                    el.onload = function () {
                        callback();
                    };
                }

                head.insertBefore(el, head.firstChild);
            }

            return $webform;
        },

        loadStyle(url, styleID, callback) {
            var head;
            var resourceID;
            if (document.getElementsByTagName('head')) {
                head = document.getElementsByTagName('head')[0];
            }
            else {
                document.documentElement.insertBefore(document.createElement('head'), document.documentElement.firstChild);
                head = document.getElementsByTagName('head')[0];
            }

            resourceID = styleID || 'id_' + syn.$l.random();

            var styleTag = document.getElementById('scriptID');
            if (styleTag) {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            } else {
                var el = document.createElement('link');
                el.setAttribute('rel', 'stylesheet');
                el.setAttribute('type', 'text/css');
                el.setAttribute('id', resourceID);
                if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                    el.setAttribute('href', url);
                }
                else {
                    el.setAttribute('href', url + (url.indexOf('?') > -1 ? '&' : '?') + 'noCache=' + (new Date()).getTime());
                }

                head.appendChild(el);

                if (callback && typeof callback === 'function') {
                    callback();
                }
            }

            return $webform;
        },

        getDynamicStyle(styleID) {
            if ($object.isNullOrUndefined(styleID) == true) {
                const sheets = doc.styleSheets;
                if (sheets.length > 0) {
                    return sheets[sheets.length - 1];
                }
                return null;
            }

            let styleEl = doc.getElementById(styleID);
            if (!styleEl) {
                styleEl = doc.createElement('style');
                styleEl.id = styleID;
                doc.head.appendChild(styleEl);
            }
            return styleEl.sheet;
        },

        // syn.$l.addCssRule('.highlight { background-color: yellow; font-weight: bold; }', 'page-style');
        // syn.$l.addCssRule('div { border: 1px solid red; }', 'page-styles');
        // syn.$l.addCssRule('span { border: 1px solid blue; }', 'page-styles');
        addCssRule(rules, styleID) {
            const sheet = this.getDynamicStyle(styleID);
            if (!sheet) {
                syn.$l.eventLog('$w.addCssRule', 'StyleSheet를 가져올 수 없습니다.', 'Error');
                return [];
            }

            const addedIndexes = [];
            const rulesArray = Array.isArray(rules) ? rules : [rules];

            rulesArray.forEach(rule => {
                try {
                    const index = sheet.insertRule(rule, sheet.cssRules.length);
                    addedIndexes.push(index);
                } catch (error) {
                    syn.$l.eventLog('$w.addCssRule', `잘못된 CSS 규칙: "${rule}"`, 'Error', error);
                }
            });

            return addedIndexes;
        },

        // syn.$l.removeCssRule('.highlight', 'page-styles');
        removeCssRule(identifier, styleID) {
            const sheet = this.getDynamicStyle(styleID);
            if (!sheet) return false;

            if (typeof identifier === 'number') {
                if (identifier >= 0 && identifier < sheet.cssRules.length) {
                    sheet.deleteRule(identifier);
                    return true;
                }
                return false;
            }

            if (typeof identifier === 'string') {
                const selector = identifier.toLowerCase();
                for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                    const rule = sheet.cssRules[i];
                    if (rule.selectorText && rule.selectorText.toLowerCase().split(',').map(s => s.trim()).includes(selector)) {
                        sheet.deleteRule(i);
                        return true;
                    }
                }
            }

            syn.$l.eventLog('$w.removeCssRule', `삭제할 규칙을 찾을 수 없습니다: ${identifier}`, 'Warning');
            return false;
        },

        // const loadedImage = await syn.$w.fetchImage('path/to/image.jpg', 'path/to/fallback.png');
        fetchImage(url, fallbackUrl) {
            return new Promise((resolve, reject) => {
                const image = new Image();
                let isFallbackAttempted = false;

                image.addEventListener('load', () => {
                    resolve(image);
                });

                image.addEventListener('error', error => {
                    if (!fallbackUrl || isFallbackAttempted) {
                        reject(error);
                    } else {
                        isFallbackAttempted = true;
                        syn.$l.eventLog('$w.fetchImage', `이미지 로딩 실패. Fallback 시도: ${fallbackUrl}`, 'Information');
                        image.src = fallbackUrl;
                    }
                });

                image.src = url;
            });
        },

        async fetchScript(moduleUrl) {
            var result = null;
            var moduleName;
            if (moduleUrl.split('/').length > 1) {
                moduleName = moduleUrl.split('/')[location.pathname.split('/').length - 1];
                moduleName = moduleName.split('.').length == 2 ? (moduleName.indexOf('.') > -1 ? moduleName.substring(0, moduleName.indexOf('.')) : moduleName) : '';
            }
            else {
                moduleName = moduleUrl;
            }

            moduleName = moduleName.replaceAll('-', '_');

            var moduleScript;
            if ($string.isNullOrEmpty(moduleName) == false) {
                try {
                    var module;
                    if (eval('typeof $' + moduleName) == 'object') {
                        var $module = new syn.module();
                        module = $module.extend(eval('$' + moduleName));
                    }
                    else {
                        if (syn.Config && syn.Config.IsClientCaching == true) {
                            moduleScript = await syn.$w.fetchText(moduleUrl + '.js');
                        }
                        else {
                            moduleScript = await syn.$w.fetchText(moduleUrl + '.js?tick=' + new Date().getTime());
                        }

                        var isBase64 = function (str) {
                            var result = false;
                            if (str && str.length > 32) {
                                var base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
                                if (base64Regex.test(str.substring(0, 32)) == true) {
                                    result = true;
                                }
                            }
                            return result;
                        }

                        if (isBase64(moduleScript) == true) {
                            var decodeError = null;
                            var decodeScript;
                            try {
                                decodeScript = syn.$c.LZString.decompressFromBase64(moduleScript);
                                if (decodeScript == null) {
                                    decodeError = 'LZString decompress 오류';
                                }
                            } catch {
                                decodeError = 'LZString decompress 오류';
                            }

                            if (decodeError) {
                                try {
                                    decodeScript = syn.$c.base64Decode(moduleScript);
                                    decodeError = null;
                                } catch {
                                    decodeError = 'base64Decode 오류';
                                }
                            }

                            if (decodeError) {
                                syn.$l.eventLog('$w.fetchScript', `${decodeError} 오류, <script src="${moduleUrl}.js"></script> 문법 확인이 필요합니다`, 'Error');
                            }
                            else {
                                moduleScript = decodeScript;
                            }
                        }

                        if (moduleScript) {
                            var moduleFunction = "return (function(){var module={};(function(window,module){'use strict';" + moduleScript + ";var $module=new syn.module();$module.extend($" + moduleName + ");module.exports=$module;})(typeof window!=='undefined'?window:{},typeof module!=='undefined'?module:{});return module.exports;})();";
                            module = new Function(moduleFunction).call(globalRoot);
                        }
                        else {
                            module = new syn.module();
                        }
                    }

                    if (module.extends && $object.isArray(module.extends) == true) {
                        for (var i = 0; i < module.extends.length; i++) {
                            var name = module.extends[i];
                            var result = await syn.$w.fetchText(name + '.js');
                            var moduleText = result.substring(result.indexOf('{'), result.lastIndexOf('}') + 1);
                            var base = eval('(' + moduleText + ')');

                            var $base = new syn.module();
                            $base.extend(base);

                            module = syn.$w.argumentsExtend($base, module);
                            module.config = syn.$w.argumentsExtend($base.config, module.config);
                            module.prop = syn.$w.argumentsExtend($base.prop, module.prop);
                            module.hook = syn.$w.argumentsExtend($base.hook, module.hook);
                            module.event = syn.$w.argumentsExtend($base.event, module.event);
                            module.model = syn.$w.argumentsExtend($base.model, module.model);
                            module.transaction = syn.$w.argumentsExtend($base.transaction, module.transaction);
                            module.method = syn.$w.argumentsExtend($base.method, module.method);
                            module.message = syn.$w.argumentsExtend($base.message, module.message);

                            if ($base.hook && $base.hook.extendLoad) {
                                base.hook.extendLoad(module);
                            }
                        }
                    }

                    result = module;
                }
                catch (error) {
                    syn.$l.eventLog('$w.fetchScript', `스크립트 로드 오류: ${error}`, 'Warning');
                    if (moduleScript) {
                        syn.$l.eventLog('$w.fetchScript', '<script src="{0}.js"></script> 문법 확인이 필요합니다'.format(moduleUrl), 'Error');
                    }
                }
            }

            return result;
        },

        async fetchText(url) {
            const defaultOptions = {
                method: 'GET',
                mode: 'cors',
                cache: 'default',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'text/plain' },
                redirect: 'follow',
                referrerPolicy: 'no-referrer-when-downgrade'
            };
            const fetchOptions = syn.$w.getFetchClientOptions ? syn.$w.getFetchClientOptions(defaultOptions) : defaultOptions;
            const cacheBust = (syn.Config?.IsClientCaching === false) ? `${url.includes('?') ? '&' : '?'} tick = ${Date.now()}` : '';
            const finalUrl = url + cacheBust;

            try {
                const response = await fetch(finalUrl, fetchOptions);
                if (!response.ok) {
                    const errorText = await response.text().catch(() => `HTTP ${response.status} ${response.statusText}`);
                    syn.$l.eventLog('$w.fetchText', `${finalUrl} Fetch 실패: 상태 ${response.status}, 텍스트: ${errorText}`, 'Warning');
                    return null;
                }
                return await response.text();
            } catch (error) {
                syn.$l.eventLog('$w.fetchText', `${finalUrl} Fetch 오류: ${error}`, 'Error');
                throw error;
            }
        },

        async fetchJson(url) {
            const defaultOptions = {
                method: 'GET',
                mode: 'cors',
                cache: 'default',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                redirect: 'follow',
                referrerPolicy: 'no-referrer-when-downgrade'
            };
            const fetchOptions = syn.$w.getFetchClientOptions ? syn.$w.getFetchClientOptions(defaultOptions) : defaultOptions;
            const cacheBust = (syn.Config?.IsClientCaching === false) ? `${url.includes('?') ? '&' : '?'} tick = ${Date.now()}` : '';
            const finalUrl = url + cacheBust;

            try {
                const response = await fetch(finalUrl, fetchOptions);
                if (!response.ok) {
                    const errorText = await response.text().catch(() => `HTTP ${response.status} ${response.statusText}`);
                    syn.$l.eventLog('$w.fetchJson', `${finalUrl} Fetch 실패: 상태 ${response.status}, 텍스트: ${errorText}`, 'Warning');
                    return null;
                }

                const contentType = response.headers.get('Content-Type') || '';
                if (!contentType.includes('application/json')) {
                    syn.$l.eventLog('$w.fetchJson', `${finalUrl}에서 JSON을 예상했지만 Content - Type: ${contentType}을 받았습니다.`, 'Warning');
                }

                return await response.json();
            } catch (error) {
                if (error instanceof SyntaxError) {
                    syn.$l.eventLog('$w.fetchJson', `${finalUrl} JSON 파싱 오류: ${error}`, 'Error');
                } else {
                    syn.$l.eventLog('$w.fetchJson', `${finalUrl} Fetch 오류: ${error}`, 'Error');
                }
                return null;
            }
        },

        transactionObject(functionID, returnType = 'Json') {
            const jsonObject = {
                programID: '',
                businessID: '',
                systemID: '',
                transactionID: '',
                transactionToken: '',
                dataMapInterface: null,
                transactionResult: true,
                functionID: functionID,
                screenID: '',
                startTraceID: '',
                requestID: null,
                returnType: returnType,
                resultAlias: [],
                inputsItemCount: [],
                inputs: []
            };

            if (syn.$w.setServiceObject) syn.$w.setServiceObject(jsonObject);
            return jsonObject;
        },

        dynamicType: Object.freeze({
            DataSet: '0', Json: '1', Scalar: '2', NonQuery: '3',
            SQLText: '4', SchemeOnly: '5', CodeHelp: '6', Xml: '7', DynamicJson: '8'
        }),

        async executeTransaction(config, transactionObject, callback, async, token) {
            const fallback = transactionObject?.fallback || function () { };
            if ($object.isNullOrUndefined(config) == true || $object.isNullOrUndefined(transactionObject) == true) {
                if (globalRoot.devicePlatform === 'browser') {
                    alert('서비스 호출에 필요한 거래 정보가 구성되지 않았습니다');
                }
                syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 거래 정보 확인 필요', 'Error');
                fallback(config, transactionObject);
                throw new Error('서비스 호출에 필요한 거래 정보 확인 필요');
            }

            let apiService = syn.Config.DomainAPIServer;
            if ($object.isNullOrUndefined(apiService) == true) {
                syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보 확인 필요', 'Error');
                fallback(config, transactionObject);
                throw new Error('서비스 호출에 필요한 DomainAPIServer 정보 확인 필요');
            }

            let ipAddress = syn.$w.getStorage('ipAddress', false);
            if ($object.isNullOrUndefined(ipAddress) == true && globalRoot.devicePlatform === 'node') {
                ipAddress = apiService.ClientIP;
            }

            if ($object.isNullOrUndefined(ipAddress) == true) {
                ipAddress = await syn.$b.getIpAddress();
            }

            if ($object.isNullOrUndefined(ipAddress) == true) {
                ipAddress = 'localhost';
            }

            syn.$w.setStorage('ipAddress', ipAddress, false);

            let url = '';
            if (apiService.Port && apiService.Port != '') {
                url = '{0}://{1}:{2}{3}'.format(apiService.Protocol, apiService.IP, apiService.Port, apiService.Path);
            }
            else {
                url = '{0}://{1}{2}'.format(apiService.Protocol, apiService.IP, apiService.Path);
            }

            const installType = syn.$w.Variable && syn.$w.Variable.InstallType ? syn.$w.Variable.InstallType : 'L';
            const environment = syn.Config && syn.Config.Environment ? syn.Config.Environment.substring(0, 1) : 'D';
            const machineTypeID = syn.Config && syn.Config.Transaction ? syn.Config.Transaction.MachineTypeID.substring(0, 1) : 'W';
            const programID = (syn.$w.Variable && syn.$w.Variable.ProgramID ? syn.$w.Variable.ProgramID : config.programID).padStart(8, '0');
            const businessID = config.businessID.padStart(3, '0').substring(0, 3);
            const transactionID = transactionObject.transactionID.padStart(6, '0').substring(0, 6);
            const functionID = transactionObject.functionID.padStart(4, '0').substring(0, 4);
            const tokenID = (syn.$w.User && syn.$w.User.TokenID ? syn.$w.User.TokenID : syn.$l.random(6)).padStart(6, '0').substring(0, 6);
            const requestTime = $date.toString(new Date(), 's').substring(0, 6);
            // -- 36바이트 = 설치구분 1자리(L: Local, C: Cloud, O: Onpremise) + 환경 ID 1자리 + 애플리케이션 ID 8자리 + 프로젝트 ID 3자리 + 거래 ID 6자리 + 기능 ID 4자리 + 시스템 구분 1자리 (W: WEB, P: Program, S: SVR, E: EXT) + ClientTokenID 6자리 + Timestamp (HHmmss) 6자리
            const requestID = `${installType}${environment}${programID}${businessID}${transactionID}${functionID}${machineTypeID}${tokenID}${requestTime}`.toUpperCase();
            let globalID = '';

            if ($string.isNullOrEmpty(syn.Config.FindGlobalIDServer) == false) {
                const result = await syn.$r.httpFetch(syn.Config.FindGlobalIDServer).send({
                    applicationID: programID,
                    projectID: businessID,
                    transactionID: transactionID,
                    serviceID: functionID,
                    screenID: transactionObject.screenID,
                    tokenID: tokenID
                }, {
                    method: 'POST',
                    redirect: 'follow',
                    timeout: 30000
                });

                if (result && !result.error) {
                    apiService.GlobalID = result;
                } else {
                    console.error(`GlobalID 조회 실패: ${syn.Config.FindGlobalIDServer}, ${result?.error}`);
                }
            }

            if ($string.isNullOrEmpty(apiService.GlobalID) == false) {
                globalID = apiService.GlobalID;
            }
            else {
                globalID = requestID;
            }

            const clientTag = syn.Config.SystemID.concat('|', syn.Config.HostName, '|', syn.Config.Program.ProgramName, '|', syn.Config.Environment.substring(0, 1));
            const userID = globalRoot.devicePlatform == 'browser' ? (syn.$w.User ? syn.$w.User.UserID : '') : syn.Config.Program.ProgramName;
            const fingerPrint = globalRoot.devicePlatform == 'browser' ? syn.$b.fingerPrint(userID, ipAddress) : `${syn.$c.sha256(clientTag)}|${clientTag}|${$date.toString(new Date(), 'f')}`;
            const deviceID = fingerPrint.substring(0, 64);

            const transactionRequest = {
                accessToken: token || globalRoot.bearerToken,
                action: 'SYN', // "SYN: Request/Response, PSH: Execute/None, ACK: Subscribe",
                kind: 'BIZ', // "DBG: Debug, BIZ: Business, URG: Urgent, FIN: Finish",
                clientTag: clientTag,
                loadOptions: {
                    encryptionType: syn.Config.Transaction.EncryptionType, // "P:Plain, F:Full, H:Header, B:Body",
                    encryptionKey: syn.Config.Transaction.EncryptionKey, // "P:프로그램, K:KMS 서버, G:GlobalID 키",
                    platform: globalRoot.devicePlatform == 'browser' ? syn.$b.platform : globalRoot.devicePlatform,
                    programID: syn.$w.Variable?.ProgramID || ''
                },
                requestID: requestID,
                version: syn.Config.Transaction.ProtocolVersion,
                environment: syn.Config.Environment.substring(0, 1),
                system: {
                    programID: config.programID,
                    moduleID: transactionObject.moduleID || (globalRoot.devicePlatform == 'browser' ? globalRoot[syn.$w.pageScript].config.moduleID : undefined) || (globalRoot.devicePlatform == 'browser' ? location.pathname.split('/').filter(Boolean)[0] : undefined) || syn.Config.ModuleID,
                    version: syn.Config.SystemVersion,
                    routes: [
                        {
                            systemID: config.systemID,
                            requestTick: (new Date()).getTime()
                        }
                    ],
                    localeID: syn.Config.Program.LocaleID,
                    hostName: globalRoot.devicePlatform == 'browser' ? location.host : syn.Config.HostName,
                    pathName: globalRoot.devicePlatform == 'browser' ? location.pathname : '',
                    deviceID: syn.$w.Variable?.DeviceID || deviceID || config.programID,
                },
                interface: {
                    devicePlatform: globalRoot.devicePlatform,
                    interfaceID: syn.Config.Transaction.MachineTypeID,
                    sourceIP: ipAddress,
                    sourcePort: 0,
                    sourceMAC: '',
                    connectionType: globalRoot.devicePlatform == 'node' ? 'unknown' : navigator.connection?.effectiveType,
                    timeout: syn.Config.TransactionTimeout
                },
                transaction: {
                    globalID: globalID,
                    businessID: config.businessID,
                    transactionID: transactionObject.transactionID,
                    functionID: transactionObject.functionID,
                    commandType: transactionObject.options ? (transactionObject.options.commandType || 'D') : 'D',
                    simulationType: syn.Config.Transaction.SimulationType, // "D:더미 P:운영 T:테스트",
                    terminalGroupID: globalRoot.devicePlatform == 'browser' ? (syn.$w.User ? '{0}|{1}'.format(syn.$w.User.CompanyID, syn.$w.User.DepartmentID) : '') : syn.Config.Program.BranchCode,
                    operatorID: userID,
                    screenID: transactionObject.screenID,
                    startTraceID: transactionObject.startTraceID,
                    dataFormat: syn.Config.Transaction.DataFormat,
                    compressionYN: syn.Config.Transaction.CompressionYN,
                    transactionToken: transactionObject.transactionToken
                },
                payLoad: {
                    property: {},
                    dataMapInterface: '',
                    dataMapCount: [],
                    dataMapSet: []
                }
            };

            if (syn.$w.transactionLoadOptions) {
                syn.$w.transactionLoadOptions(transactionRequest.loadOptions, transactionObject);
            }

            if ($object.isNullOrUndefined(transactionObject.options) == false) {
                for (const key in transactionObject.options) {
                    const item = transactionObject.options[key];

                    if (key == 'encryptionType' || key == 'encryptionKey' || key == 'platform') {
                        fallback(config, transactionObject);
                        throw new Error('{0} 옵션 사용 불가'.format(key));
                    }
                    else {
                        transactionRequest.loadOptions[key] = item;
                    }
                }

                const dynamic = transactionRequest.loadOptions['dynamic'];
                if ($string.isNullOrEmpty(dynamic) == false && $string.toBoolean(dynamic) == false) {
                    delete transactionRequest.loadOptions['dynamic'];
                    delete transactionRequest.loadOptions['authorize'];
                    delete transactionRequest.loadOptions['commandType'];
                    delete transactionRequest.loadOptions['returnType'];
                    delete transactionRequest.loadOptions['transactionScope'];
                    delete transactionRequest.loadOptions['transactionLog'];
                }

                const action = transactionRequest.loadOptions['action'];
                if ($string.isNullOrEmpty(action) == false) {
                    transactionRequest.action = action;
                    delete transactionRequest.loadOptions['action'];
                }

                const kind = transactionRequest.loadOptions['kind'];
                if ($string.isNullOrEmpty(kind) == false) {
                    transactionRequest.kind = kind;
                    delete transactionRequest.loadOptions['kind'];
                }

                delete transactionRequest.loadOptions['message'];
            }

            const mod = context[syn.$w.pageScript];
            if (mod && mod.hook.payLoadProperty) {
                let property = {};
                property = mod.hook.payLoadProperty(transactionObject.transactionID, transactionObject.functionID);
                if ($object.isNullOrUndefined(property) == true) {
                    property = {};
                }

                transactionRequest.payLoad.property = property;
            }

            if (config.transactions) {
                const transactions = config.transactions.filter(function (item) {
                    return item.functionID == transactionObject.functionID;
                });

                if (transactions.length == 1) {
                    const transaction = transactions[0];

                    const inputs = transaction.inputs.map(function (item) { return item.requestType; }).join(',');
                    const outputs = transaction.outputs.map(function (item) { return item.responseType; }).join(',');
                    transactionRequest.payLoad.dataMapInterface = '{0}|{1}'.format(inputs, outputs);
                }
            }
            else if (transactionObject.dataMapInterface) {
                transactionRequest.payLoad.dataMapInterface = transactionObject.dataMapInterface;
            }

            if (transactionRequest.transaction.dataFormat == 'J' || transactionRequest.transaction.dataFormat == 'T') {
            }
            else {
                fallback(config, transactionObject);
                throw new Error('transaction.dataFormat 확인 필요: {0}'.format(transactionRequest.transaction.dataFormat));
            }

            transactionRequest.payLoad.dataMapCount = transactionObject.inputsItemCount;
            transactionRequest.payLoad.dataMapSet = [];
            transactionRequest.payLoad.dataMapSetRaw = [];
            const length = transactionObject.inputs.length;

            for (let i = 0; i < length; i++) {
                const inputs = transactionObject.inputs[i];

                const reqInputs = [];
                for (let j = 0; j < inputs.length; j++) {
                    const item = inputs[j];

                    reqInputs.push({
                        id: item.prop,
                        value: item.val
                    });
                }

                if (syn.Config.Transaction.CompressionYN == 'Y') {
                    if (transactionRequest.transaction.dataFormat == 'J') {
                        transactionRequest.payLoad.dataMapSetRaw.push(syn.$c.LZString.compressToBase64(JSON.stringify(reqInputs)));
                    }
                    else {
                        transactionRequest.payLoad.dataMapSetRaw.push(syn.$c.LZString.compressToBase64($object.toCSV(reqInputs, { delimeter: '｜', newline: '↵' })));
                    }
                }
                else {
                    if (transactionRequest.transaction.dataFormat == 'J') {
                        transactionRequest.payLoad.dataMapSet.push(reqInputs);
                    }
                    else {
                        transactionRequest.payLoad.dataMapSetRaw.push($object.toCSV(reqInputs, { delimeter: '｜', newline: '↵' }));
                    }
                }
            }

            if (globalThis.devicePlatform != 'node' && transactionRequest.action == 'PSH') {
                const blob = new Blob([JSON.stringify(transactionRequest)], { type: 'application/json; charset=UTF-8' });
                navigator.sendBeacon(url, blob);

                if (syn.$w.domainTransactionLoaderEnd) {
                    syn.$w.domainTransactionLoaderEnd();
                }

                if (syn.$w.closeProgressMessage) {
                    syn.$w.closeProgressMessage();
                }
            }
            else {
                const xhr = syn.$w.xmlHttp();
                xhr.open(syn.$w.method, url, true);
                xhr.setRequestHeader('Accept-Language', syn.$w.localeID);
                xhr.setRequestHeader('Server-SystemID', config.systemID || syn.Config.SystemID);
                xhr.setRequestHeader('Server-BusinessID', config.businessID);

                if (syn.Environment) {
                    const environment = syn.Environment;
                    if (environment.Header) {
                        for (const item in environment.Header) {
                            xhr.setRequestHeader(item, environment.Header[item]);
                        }
                    }
                }

                if (syn.$w.setServiceClientHeader) {
                    if (syn.$w.setServiceClientHeader(xhr) == false) {
                        syn.$l.eventLog('$w.executeTransaction', 'setServiceClientHeader 전송 안함', 'Warning');
                        fallback(config, transactionObject);
                        return;
                    }
                }

                if (async !== undefined && xhr.async == true) {
                    xhr.async = async;

                    if (xhr.async == false) {
                        xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.send(transactionRequest);

                        return xhr;
                    }
                }

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200) {
                            if (xhr.status == 0) {
                                syn.$l.eventLog('$w.executeTransaction', 'X-Requested 전송 오류', 'Fatal');
                            }
                            else {
                                syn.$l.eventLog('$w.executeTransaction', '응답 상태 - {0}: '.format(xhr.statusText) + xhr.responseText, 'Error');
                            }

                            if (syn.$w.domainTransactionLoaderEnd) {
                                syn.$w.domainTransactionLoaderEnd();
                            }
                            fallback(config, transactionObject);
                            return;
                        }

                        if (syn.$w.clientTag && syn.$w.serviceClientInterceptor) {
                            if (syn.$w.serviceClientInterceptor(syn.$w.clientTag, xhr) === false) {
                                syn.$l.eventLog('$w.executeTransaction', 'serviceClientInterceptor 전송 안함', 'Warning');
                                fallback(config, transactionObject);
                                return;
                            }
                        }

                        try {
                            const transactionResponse = JSON.parse(xhr.responseText);
                            if (transactionObject.transactionResult == true) {
                                if (transactionResponse.acknowledge == 1) {
                                    const jsonResult = [];
                                    const message = transactionResponse.message;
                                    if (transactionResponse.result.dataSet != null && transactionResponse.result.dataSet.length > 0) {
                                        const dataMapItem = transactionResponse.result.dataSet;
                                        message.additions.push({ code: 'dataSetMeta', text: transactionResponse.result.dataSetMeta });
                                        message.additions.push({ code: 'dataMapCount', text: transactionResponse.result.dataMapCount });
                                        const length = dataMapItem.length;
                                        for (let i = 0; i < length; i++) {
                                            const item = dataMapItem[i];
                                            const dataSetMeta = transactionResponse.result.dataSetMeta[i];

                                            if (transactionResponse.transaction.simulationType == syn.$w.dynamicType.CodeHelp) {
                                                jsonResult.push({
                                                    id: item.id,
                                                    value: item.value
                                                });
                                                continue;
                                            }

                                            if (transactionResponse.transaction.dataFormat == 'J') {
                                                if (transactionResponse.transaction.compressionYN == 'Y') {
                                                    jsonResult.push({
                                                        id: item.id,
                                                        value: JSON.parse(syn.$c.LZString.decompressFromBase64(item.value))
                                                    });
                                                }
                                                else {
                                                    jsonResult.push({
                                                        id: item.id,
                                                        value: item.value
                                                    });
                                                }
                                            }
                                            else {
                                                if (config.transactions) {
                                                    const transaction = config.transactions.find(function (item) {
                                                        return item.functionID == transactionObject.functionID;
                                                    });

                                                    if (transaction) {
                                                        let value = null;
                                                        if ($object.isEmpty(item.value) == false) {
                                                            value = transactionResponse.transaction.compressionYN == 'Y' ? syn.$c.LZString.decompressFromBase64(item.value) : item.value;
                                                            const meta = $string.toParameterObject(dataSetMeta);
                                                            value = $string.toJson(value, { delimeter: '｜', newline: '↵', meta: meta });

                                                            const outputMapping = transaction.outputs[i];
                                                            if (outputMapping.responseType == 'Form') {
                                                                value = dataSetMeta;
                                                                if ($object.isNullOrUndefined(value) == true) {
                                                                    value = {};
                                                                }
                                                            }
                                                            else {
                                                                if ($object.isNullOrUndefined(value) == true) {
                                                                    value = [];
                                                                }
                                                            }
                                                        }

                                                        jsonResult.push({
                                                            id: item.id,
                                                            value: value
                                                        });
                                                    }
                                                }
                                                else {
                                                    let value = transactionResponse.transaction.compressionYN == 'Y' ? syn.$c.LZString.decompressFromBase64(item.value) : item.value;
                                                    const meta = $string.toParameterObject(dataSetMeta);
                                                    value = $string.toJson(value, { delimeter: '｜', newline: '↵', meta: meta });
                                                    if (item.id.startsWith('Form') == true) {
                                                        value = dataSetMeta;
                                                        if ($object.isNullOrUndefined(value) == true) {
                                                            value = {};
                                                        }
                                                        else {
                                                            if ($object.isNullOrUndefined(value) == true) {
                                                                value = [];
                                                            }
                                                        }
                                                    }

                                                    jsonResult.push({
                                                        id: item.id,
                                                        value: value
                                                    });
                                                }
                                            }
                                        }
                                    }

                                    if (callback) {
                                        const addtionalData = {};
                                        if (message.additions && message.additions.length > 0) {
                                            for (let i = 0; i < message.additions.length; i++) {
                                                const addition = message.additions[i];

                                                if ($string.isNullOrEmpty(addition.code) == false && $object.isNullOrUndefined(addtionalData[addition.code]) == true) {
                                                    addtionalData[addition.code] = addition.text;
                                                }
                                            }
                                        }

                                        try {
                                            callback(jsonResult, addtionalData, transactionResponse.correlationID);
                                        } catch (error) {
                                            syn.$l.eventLog('$w.executeTransaction callback', `executeTransaction 콜백 오류: ${error}`, 'Error');
                                            fallback(config, transactionObject);
                                        }
                                    }
                                }
                                else {
                                    const errorText = transactionResponse.exceptionText;
                                    const errorMessage = '거래: {0}, 기능: {1} 수행 중 예외 정보 확인이 필요합니다\nGlobalID: {2}'.format(transactionRequest.transaction.transactionID, transactionRequest.transaction.functionID, transactionRequest.transaction.globalID);
                                    if (syn.$w.serviceClientException) {
                                        syn.$w.serviceClientException('요청 정보 확인', errorMessage, errorText);
                                    }
                                    syn.$l.eventLog('$w.executeTransaction', `거래 실행 오류: ${errorText}`, 'Warning');
                                    fallback(config, transactionObject);

                                    if (globalRoot.devicePlatform === 'browser') {
                                        if ($this && $this.hook && $this.hook.frameEvent) {
                                            $this.hook.frameEvent('transactionException', {
                                                transactionID: transactionRequest.transaction.transactionID,
                                                functionID: transactionRequest.transaction.functionID,
                                                errorText: errorText,
                                                errorMessage: errorMessage
                                            });
                                        }
                                    }
                                    else {
                                        if (callback) {
                                            try {
                                                callback([], null, transactionResponse.correlationID); // Pass correlationID even on error
                                            } catch (error) {
                                                syn.$l.eventLog('$w.executeTransaction callback', `executeTransaction 콜백 오류: ${error}`, 'Error');
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (callback) {
                                    if (transactionResponse && transactionResponse.acknowledge && transactionResponse.acknowledge == 1) {
                                        try {
                                            if (transactionResponse.result.dataSet != null && transactionResponse.result.dataSet.length > 0) {
                                                const dataMapItem = transactionResponse.result.dataSet;
                                                const length = dataMapItem.length;
                                                for (let i = 0; i < length; i++) {
                                                    const item = dataMapItem[i];
                                                    if (transactionResponse.transaction.dataFormat == 'J') {
                                                        if (transactionResponse.transaction.compressionYN == 'Y') {
                                                            item.value = JSON.parse(syn.$c.LZString.decompressFromBase64(item.value));
                                                        }
                                                    }
                                                    else {
                                                        item.value = transactionResponse.transaction.compressionYN == 'Y' ? syn.$c.LZString.decompressFromBase64(item.value) : item.value;
                                                    }
                                                }
                                            }
                                        } catch (error) {
                                            syn.$l.eventLog('$w.executeTransaction', `executeTransaction 오류: ${error}`, 'Error');
                                            fallback(config, transactionObject);
                                        }
                                    }

                                    try {
                                        callback(transactionResponse, null, transactionResponse.correlationID);
                                    } catch (error) {
                                        syn.$l.eventLog('$w.executeTransaction callback', `executeTransaction 콜백 오류: ${error}`, 'Error');
                                        fallback(config, transactionObject);
                                    }
                                }
                            }
                        }
                        catch (error) {
                            const errorMessage = '거래: {0}, 기능: {1} 수행 중 예외 정보 확인이 필요합니다\nGlobalID: {2}'.format(transactionRequest.transaction.transactionID, transactionRequest.transaction.functionID, transactionRequest.transaction.globalID);
                            if (syn.$w.serviceClientException) {
                                syn.$w.serviceClientException('요청 정보 확인', errorMessage, error.stack);
                            }
                            syn.$l.eventLog('$w.executeTransaction', `executeTransaction 오류: ${error}`, 'Error');
                            fallback(config, transactionObject);

                            if (globalRoot.devicePlatform === 'browser') {
                                if ($this && $this.hook && $this.hook.frameEvent) {
                                    $this.hook.frameEvent('transactionError', {
                                        transactionID: transactionRequest.transaction.transactionID,
                                        functionID: transactionRequest.transaction.functionID,
                                        errorText: error.message,
                                        errorMessage: errorMessage
                                    });
                                }
                            }
                            else {
                                if (callback) {
                                    try {
                                        callback([], null);
                                    } catch (error) {
                                        syn.$l.eventLog('$w.executeTransaction callback', `executeTransaction 콜백 오류: ${error}`, 'Error');
                                        fallback(config, transactionObject);
                                    }
                                }
                            }
                        }

                        if (syn.$w.domainTransactionLoaderEnd) {
                            syn.$w.domainTransactionLoaderEnd();
                        }
                    }
                }
                syn.$l.eventLog('$w.executeTransaction', `거래 GlobalID: ${transactionRequest.transaction.globalID}`, 'Verbose');

                xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.timeout = syn.Config.TransactionTimeout;
                xhr.send(JSON.stringify(transactionRequest));
            }
        },

        pseudoStyle(elID, selector, cssText) {
            var head = document.head || (document.getElementsByTagName('head').length == 0 ? null : document.getElementsByTagName('head')[0]);
            if (head) {
                var sheet = document.getElementById(elID) || document.createElement('style');
                if (sheet.id == '') {
                    sheet.id = elID;
                }

                sheet.innerHTML = selector + '{' + cssText + '}';
                head.appendChild(sheet);
            }
        },

        pseudoStyles(elID, styles) {
            var head = document.head || (document.getElementsByTagName('head').length == 0 ? null : document.getElementsByTagName('head')[0]);
            if (head && $object.isArray(styles) == true && styles.length > 0) {
                var sheet = document.getElementById(elID) || document.createElement('style');
                if (sheet.id == '') {
                    sheet.id = elID;
                }

                var styleTexts = [];
                for (var i = 0, length = styles.length; i < length; i++) {
                    var style = styles[i];

                    styleTexts.push(style.selector + '{' + style.cssText + '}');
                }

                sheet.innerHTML = styleTexts.join('\n');
                head.appendChild(sheet);
            }
        },

        async copyToClipboard(text) {
            if (!text) return Promise.reject('');

            if (context.navigator?.clipboard?.writeText) {
                try {
                    await context.navigator.clipboard.writeText(text);
                    return Promise.resolve();
                } catch (error) {
                    syn.$l.eventLog('$w.copyToClipboard', `Clipboard API 실패: ${error.message}`, 'Warning');
                    return Promise.reject(error);
                }
            }

            const textArea = doc.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.top = "-9999px";
            textArea.style.left = "-9999px";
            doc.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = doc.execCommand('copy');
                doc.body.removeChild(textArea);
                if (successful) {
                    return Promise.resolve();
                }
                return Promise.reject(new Error('execCommand copy 실패'));
            } catch (error) {
                doc.body.removeChild(textArea);
                syn.$l.eventLog('$w.copyToClipboard', `execCommand 실패: ${error.message}`, 'Error');
                return Promise.reject(error);
            }
        },

        // function loadMoreContent(done) {
        // 	   done(true);
        // }
        // 
        // syn.$w.startIntersection(
        //     'my-list-scroll', 
        //     '#loading-placeholder', 
        //     loadMoreContent,
        //     {
        //         rootMargin: '100px' // placeholder가 화면 상하좌우 100px 안으로 들어오면 미리 로드 시작
        //     }
        // );
        startIntersection(id, placeholder, loadMore, options = {}) {
            const targetElement = syn.$l.getElement(placeholder);

            if (typeof id !== 'string' || !id) {
                syn.$l.eventLog('$w.startIntersection', '고유한 ID를 제공해야 합니다.', 'Error');
                return null;
            }
            if (this.intersectionObservers[id]) {
                syn.$l.eventLog('$w.startIntersection', `ID '${id}'를 가진 Observer가 이미 존재합니다.`, 'Warning');
                return this.intersectionObservers[id].observer;
            }
            if (!targetElement) {
                syn.$l.eventLog('$w.startIntersection', '감시할 placeholder 엘리먼트를 찾을 수 없습니다.', 'Warning');
                return null;
            }
            if (!context.IntersectionObserver) {
                syn.$l.eventLog('$w.startIntersection', '이 브라우저는 IntersectionObserver를 지원하지 않습니다.', 'Error');
                return null;
            }

            let isLoading = false;

            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.01,
                ...options
            };

            const observer = new IntersectionObserver((entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isLoading) {
                    isLoading = true;

                    const done = (isFinished = false) => {
                        isLoading = false;
                        if (isFinished === true) {
                            this.stopIntersection(id);
                        }
                    };

                    loadMore(done);
                }
            }, observerOptions);

            observer.observe(targetElement);

            this.intersectionObservers[id] = {
                observer: observer,
                element: targetElement,
                isLoading: isLoading
            };

            syn.$l.eventLog('$w.startIntersection', `무한 스크롤 시작 (ID: ${id})`, 'Information');
            return observer;
        },

        // syn.$w.stopIntersection('my-list-scroll');
        stopIntersection(id) {
            const observerInfo = this.intersectionObservers[id];
            if (observerInfo) {
                observerInfo.observer.unobserve(observerInfo.element);
                observerInfo.observer.disconnect();
                delete this.intersectionObservers[id];
                syn.$l.eventLog('$w.stopIntersection', `무한 스크롤 중지 (ID: ${id})`, 'Information');
            }
        },

        // syn.$l.addEvent(context, 'beforeunload', () => {
        //     syn.$w.stopAllInfiniteScrolls();
        // });
        stopAllIntersections() {
            Object.keys(this.intersectionObservers).forEach(id => this.stopIntersection(id));
        }
    });

    if (syn && !syn.Config) {
        syn.Config = {};
    }

    context.$webform = syn.$w = $webform;
    if (globalRoot.devicePlatform === 'node') {
        var fs = require('fs');
        var path = require('path');

        if (process.env.SYN_CONFIG) {
            syn.Config = JSON.parse(process.env.SYN_CONFIG);
        }
        else {
            var filePath = path.join(process.cwd(), '..', 'modules', 'function', 'node.config.json');
            if (fs.existsSync(filePath) == true) {
                console.info('Node.js 환경설정 로드. 파일 경로: {0}'.format(filePath));
                var data = fs.readFileSync(filePath, 'utf8');
                syn.Config = JSON.parse(data);
                syn.Config.LoadFilePath = filePath;

                process.env.SYN_LogMinimumLevel = syn.Config.LogMinimumLevel || 'trace';
                process.env.SYN_FileLogBasePath = syn.Config.FileLogBasePath || path.join(process.cwd(), '..', 'log', 'function', 'javascript');
                process.env.SYN_LocalStoragePath = syn.Config.LocalStoragePath || path.join(process.cwd(), '..', 'cache', 'function');
            }
            else {
                console.error('Node.js 환경설정 파일이 존재하지 않습니다. 파일 경로: {0}'.format(filePath));
            }
        }

        if (syn.Config && $string.isNullOrEmpty(syn.Config.DataSourceFilePath) == true) {
            syn.Config.DataSourceFilePath = path.join(process.cwd(), '..', 'modules', 'dbclient', 'module.json');
        }

        if (syn.Config && $string.isNullOrEmpty(syn.Config.ProxyPathName) == false) {
            $webform.proxyBasePath = (syn.Config.IsProxyServe == true && syn.Config.ProxyPathName.length > 0) ? `/${syn.Config.ProxyPathName}` : '';
        }

        const browserOnlyMethods = [
            'activeControl', 'contentLoaded', 'addReadyCount', 'removeReadyCount', 'createSelection',
            'getTriggerOptions', 'scrollToTop', 'setFavicon', 'fileDownload', 'pseudoStyle', 'pseudoStyles',
            'isPageLoad', 'pageReadyTimeout', 'eventAddReady', 'eventRemoveReady', 'moduleReadyIntervalID',
            'remainingReadyIntervalID', 'remainingReadyCount', 'defaultControlOptions', 'mappingModule'
        ];
        browserOnlyMethods.forEach(method => { delete $webform[method]; });
    }
    else {
        const preferColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (preferColorScheme) {
            context.$webform.isDarkMode = preferColorScheme.matches;
            preferColorScheme.addEventListener('change', (event) => {
                context.$webform.isDarkMode = event.matches;
            });
        }

        const pathname = location.pathname;
        const pathSegments = pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
            const filename = pathSegments[pathSegments.length - 1];
            const pageProject = pathSegments[pathSegments.length - 2] || '';
            const pageScript = '$' + (filename.includes('.') ? filename.substring(0, filename.indexOf('.')) : filename);
            $webform.extend({ pageProject, pageScript });
        }

        syn.$l.addEvent(context, 'load', () => {
            const mod = context[$webform.pageScript];
            mod?.hook?.windowLoad?.();
        });

        var urlArgs = syn.$r.getCookie('syn.iscache') == 'true' ? '' : '?tick=' + new Date().getTime();
        var isAsyncLoad = syn.$b.isIE == false;

        globalRoot.isLoadConfig = false;
        if (context.synConfig) {
            syn.Config = syn.$w.argumentsExtend(syn.Config, synConfig);
            context.synConfig = undefined;
            if (syn.Config && $string.isNullOrEmpty(syn.Config.ProxyPathName) == false) {
                $webform.proxyBasePath = (syn.Config.IsProxyServe == true && syn.Config.ProxyPathName.length > 0) ? `/${syn.Config.ProxyPathName}` : '';
            }

            globalRoot.isLoadConfig = true;
            setTimeout(async function () {
                await $webform.contentLoaded();
            });
        }
        else {
            if (context.synConfigName) {
                $webform.loadJson('/' + context.synConfigName + urlArgs, null, function (setting, json) {
                    syn.Config = syn.$w.argumentsExtend(syn.Config, json);
                    if (syn.Config && $string.isNullOrEmpty(syn.Config.ProxyPathName) == false) {
                        $webform.proxyBasePath = (syn.Config.IsProxyServe == true && syn.Config.ProxyPathName.length > 0) ? `/${syn.Config.ProxyPathName}` : '';
                    }

                    globalRoot.isLoadConfig = true;
                    setTimeout(async function () {
                        await $webform.contentLoaded();
                    });
                }, null, isAsyncLoad);
            }
            else {
                if (context.document.readyState === 'loading') {
                    context.document.addEventListener('DOMContentLoaded', $webform.contentLoaded, { once: true });
                } else {
                    $webform.contentLoaded();
                }
            }
        }

        if (context.Configuration) {
            syn.Environment = context.Configuration;
            syn.$l.deepFreeze(syn.Environment);
            delete context.Configuration;
        }

        if (syn.Environment) {
            var environment = syn.Environment;
            if (environment.Cookie) {
                for (var item in environment.Cookie) {
                    var value = syn.$r.getCookie(item);
                    if ($object.isNullOrUndefined(value) == true) {
                        syn.$r.setCookie(item, environment.Cookie[item]);
                    }
                }
            }
        }

        if (globalRoot.devicePlatform === 'browser') {
            syn.$b.appName = syn.Config.HostName;
            syn.$b.appCodeName = syn.Config.ApplicationID;
        }
    }
})(globalRoot);
