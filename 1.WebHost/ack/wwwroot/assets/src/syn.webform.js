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
                        syn.$l.eventLog('$w.getStorage (Node)', `Error parsing storage item for key "${storageKey}": ${e}`, 'Error');
                        localStorage.removeItem(storageKey);
                        return null;
                    }
                }
            } else {
                const storage = isLocal ? localStorage : sessionStorage;
                const val = storage.getItem(storageKey);
                try {
                    return val ? JSON.parse(val) : null;
                } catch (e) {
                    syn.$l.eventLog('$w.getStorage (Browser)', `Error parsing storage item for key "${storageKey}": ${e}`, 'Error');
                    storage.removeItem(storageKey);
                    return null;
                }
            }
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
                    var isContinue = domainLibraryLoad();
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
                                syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요 '.format(elementID) + error.message, 'Warning');
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
                                syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요 '.format(elementID) + error.message, 'Warning');
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
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-events 확인 필요 '.format(synControl.id) + error.message, 'Warning');
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
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요'.format(synControl.id) + error.message, 'Warning');
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
                syn.$l.eventLog('$w.createSelection', `Error setting selection for element ${element.id}: ${e}`, 'Warning');
            }
        },

        argumentsExtend(...args) {
            return Object.assign({}, ...args);
        },

        loadJson(url, setting, success, callback, async = true, isForceCallback = false) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, async);

            if (syn.$w.setServiceClientHeader && !this.setServiceClientHeader(xhr)) {
                syn.$l.eventLog('$w.loadJson', `setServiceClientHeader failed for URL: ${url}`, 'Error');
                if (callback && isForceCallback) callback();
                return;
            }

            const handleResponse = () => {
                if (xhr.status === 200) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        if (success) success(setting, responseData);
                    } catch (e) {
                        syn.$l.eventLog('$w.loadJson', `JSON parse error for URL: ${url}, status: ${xhr.status}, error: ${e}`, 'Error');
                    } finally {
                        if (callback) callback();
                    }
                } else {
                    syn.$l.eventLog('$w.loadJson', `HTTP error for URL: ${url}, status: ${xhr.status}, responseText: ${xhr.responseText}`, 'Error');
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
                    syn.$l.eventLog('$w.loadJson', `Network error for URL: ${url}`, 'Error');
                    if (callback && isForceCallback) callback();
                };
                xhr.send();
            } else {
                try {
                    xhr.send();
                    handleResponse();
                } catch (e) {
                    syn.$l.eventLog('$w.loadJson', `Error during synchronous request for URL: ${url}, error: ${e}`, 'Error');
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
                syn.$l.eventLog('$w.getTriggerOptions', `Failed to parse triggerOptions for element ${element?.id}: ${e}`, 'Warning');
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
                            throw new Error("Trigger context mismatch or invalid configuration.");
                        }

                        if ($this.hook?.afterTrigger) {
                            $this.hook.afterTrigger(null, triggerConfig.action, { elID: triggerConfig.triggerID, result: triggerResult });
                        }
                    } else {
                        throw new Error(`Trigger function not found or invalid for action: ${triggerConfig.action || triggerConfig.method}`);
                    }
                } catch (error) {
                    const errorMessage = `Trigger execution failed: ${error.message}`;
                    syn.$l.eventLog('$w.triggerAction', errorMessage, 'Error');
                    if ($this.hook?.afterTrigger) {
                        $this.hook.afterTrigger(errorMessage, triggerConfig.action, null);
                    }
                }
            } else {
                if ($this.hook?.afterTrigger) {
                    $this.hook.afterTrigger('hook.beforeTrigger returned false', triggerConfig.action, null);
                }
            }
        },

        getControlModule(modulePath) {
            if (!modulePath) return null;
            try {
                return modulePath.split('.').reduce((obj, prop) => obj?.[prop], context);
            } catch (e) {
                syn.$l.eventLog('$w.getControlModule', `Error accessing module path "${modulePath}": ${e}`, 'Warning');
                return null;
            }
        },

        tryAddFunction(transactConfig) {
            if (!transactConfig || !$this?.config) {
                syn.$l.eventLog('$w.tryAddFunction', `Invalid transactConfig or $this.config missing for functionID: ${transactConfig?.functionID}`, 'Warning');
                return;
            }

            try {
                transactConfig.noProgress = transactConfig.noProgress ?? false;
                $this.config.transactions = $this.config.transactions || [];

                const transactions = $this.config.transactions;
                const existingIndex = transactions.findIndex(t => t.functionID === transactConfig.functionID);
                if (existingIndex > -1) {
                    transactions.splice(existingIndex, 1);
                }

                const synControlList = $this.context?.synControls ?? [];
                const defaultFormId = doc?.forms?.[0]?.getAttribute('syn-datafield') ?? '';

                const transactionObject = {
                    functionID: transactConfig.functionID,
                    transactionResult: transactConfig.transactionResult ?? true,
                    inputs: [],
                    outputs: []
                };

                (transactConfig.inputs || []).forEach(inputConfig => {
                    const input = {
                        requestType: inputConfig.type,
                        dataFieldID: inputConfig.dataFieldID || defaultFormId,
                        items: {}
                    };

                    const isBelong = (belongID) => {
                        if (!belongID) return false;
                        return Array.isArray(belongID)
                            ? belongID.includes(transactConfig.functionID)
                            : transactConfig.functionID === belongID;
                    };

                    const processControlOptions = (controlConfig) => {
                        const el = syn.$l.get(`${controlConfig.id}_hidden`) || syn.$l.get(controlConfig.id);
                        const optionsStr = el?.getAttribute('syn-options') || '{}';
                        try {
                            const synOptions = new Function(`return (${optionsStr})`)();
                            if (synOptions && controlConfig.field && isBelong(synOptions.belongID)) {
                                input.items[controlConfig.field] = {
                                    fieldID: controlConfig.field,
                                    dataType: synOptions.dataType || 'string'
                                };
                            }
                        } catch (e) {
                            syn.$l.eventLog('$w.tryAddFunction.input', `Error parsing syn-options for ${controlConfig.id}: ${e}`, 'Warning');
                        }
                    };

                    const processStoreColumns = (store, type) => {
                        if (store?.storeType === type && store.dataSourceID === input.dataFieldID) {
                            (store.columns || []).forEach(column => {
                                if (isBelong(column.belongID)) {
                                    input.items[column.data] = {
                                        fieldID: column.data,
                                        dataType: column.dataType || 'string'
                                    };
                                }
                            });
                            return true;
                        }
                        return false;
                    };

                    if (inputConfig.type === 'Row') {
                        const formControls = synControlList.filter(item =>
                            item.formDataFieldID === input.dataFieldID &&
                            !item.type?.includes('grid') && !item.type?.includes('chart') && !item.type?.includes('data')
                        );

                        if (formControls.length > 0) {
                            formControls.forEach(processControlOptions);
                        } else {
                            let storeProcessed = false;
                            if (syn.uicontrols?.$data?.storeList) {
                                for (const store of syn.uicontrols.$data.storeList) {
                                    if (processStoreColumns(store, 'Form')) {
                                        storeProcessed = true;
                                        break;
                                    }
                                }
                            }
                            if (!storeProcessed) {
                                const specificControlConfig = synControlList.find(item => item.field === input.dataFieldID && (item.type?.includes('grid') || item.type?.includes('chart')));
                                const controlModule = specificControlConfig ? syn.$w.getControlModule(specificControlConfig.module) : null;
                                controlModule?.setTransactionBelongID?.(specificControlConfig.id, input, transactConfig);
                            }
                        }
                    } else if (inputConfig.type === 'List') {
                        const listControlConfig = synControlList.find(item => item.field === input.dataFieldID && (item.type?.includes('grid') || item.type?.includes('chart')));
                        const controlModule = listControlConfig ? syn.$w.getControlModule(listControlConfig.module) : null;

                        if (controlModule?.setTransactionBelongID) {
                            controlModule.setTransactionBelongID(listControlConfig.id, input, transactConfig);
                        } else if (syn.uicontrols?.$data?.storeList) {
                            let storeProcessed = false;
                            for (const store of syn.uicontrols.$data.storeList) {
                                if (processStoreColumns(store, 'Grid')) {
                                    storeProcessed = true;
                                    break;
                                }
                            }
                            if (!storeProcessed) {
                                syn.$l.eventLog('$w.tryAddFunction.input', `No list source found for dataFieldID "${input.dataFieldID}"`, 'Warning');
                            }
                        }
                    }
                    transactionObject.inputs.push(input);
                });

                (transactConfig.outputs || []).forEach(outputConfig => {
                    const output = {
                        responseType: outputConfig.type,
                        dataFieldID: outputConfig.dataFieldID || '',
                        items: {}
                    };

                    const processControlOutput = (controlConfig) => {
                        const el = syn.$l.get(`${controlConfig.id}_hidden`) || syn.$l.get(controlConfig.id);
                        const optionsStr = el?.getAttribute('syn-options') || '{}';
                        try {
                            const synOptions = new Function(`return (${optionsStr})`)();
                            if (synOptions && controlConfig.field) {
                                output.items[controlConfig.field] = {
                                    fieldID: controlConfig.field,
                                    dataType: synOptions.dataType || 'string'
                                };
                            }
                        } catch (e) {
                            syn.$l.eventLog('$w.tryAddFunction.output', `Error parsing syn-options for ${controlConfig.id}: ${e}`, 'Warning');
                        }

                        if (outputConfig.clear) {
                            const controlModule = syn.$w.getControlModule(controlConfig.module);
                            controlModule?.clear?.(controlConfig.id);
                        }
                    };

                    const processStoreOutput = (store, type) => {
                        if (store?.storeType === type && store.dataSourceID === output.dataFieldID) {
                            (store.columns || []).forEach(column => {
                                output.items[column.data] = {
                                    fieldID: column.data,
                                    dataType: column.dataType || 'string'
                                };
                            });
                            if (outputConfig.clear && $this?.store?.[store.dataSourceID]) {
                                if (Array.isArray($this.store[store.dataSourceID])) {
                                    $this.store[store.dataSourceID].length = 0;
                                } else {
                                    $this.store[store.dataSourceID] = {};
                                }
                            }
                            return true;
                        }
                        return false;
                    };

                    if (outputConfig.type === 'Form') {
                        const formControls = synControlList.filter(item =>
                            item.formDataFieldID === output.dataFieldID &&
                            !item.type?.includes('grid') && !item.type?.includes('chart') && !item.type?.includes('data')
                        );
                        if (formControls.length > 0) {
                            formControls.forEach(processControlOutput);
                        } else if (syn.uicontrols?.$data?.storeList) {
                            let storeProcessed = false;
                            for (const store of syn.uicontrols.$data.storeList) {
                                if (processStoreOutput(store, 'Form')) {
                                    storeProcessed = true;
                                    break;
                                }
                            }
                            if (!storeProcessed) {
                                syn.$l.eventLog('$w.tryAddFunction.output', `No form source found for dataFieldID "${output.dataFieldID}"`, 'Warning');
                            }
                        }
                    } else if (outputConfig.type === 'Grid') {
                        const listControlConfig = synControlList.find(item => item.field === output.dataFieldID && (item.type?.includes('grid') || item.type?.includes('chart'))); // Allow chart as grid output sometimes
                        const controlModule = listControlConfig ? syn.$w.getControlModule(listControlConfig.module) : null;

                        if (controlModule?.setTransactionBelongID) {
                            controlModule.setTransactionBelongID(listControlConfig.id, output);
                            if (outputConfig.clear) controlModule.clear?.(listControlConfig.id);
                        } else if (syn.uicontrols?.$data?.storeList) {
                            let storeProcessed = false;
                            for (const store of syn.uicontrols.$data.storeList) {
                                if (processStoreOutput(store, 'Grid')) {
                                    storeProcessed = true;
                                    break;
                                }
                            }
                            if (!storeProcessed) {
                                syn.$l.eventLog('$w.tryAddFunction.output', `No grid source found for dataFieldID "${output.dataFieldID}"`, 'Warning');
                            }
                        }
                    }
                    transactionObject.outputs.push(output);
                });

                transactions.push(transactionObject);
            } catch (error) {
                syn.$l.eventLog('$w.tryAddFunction', `Error processing function ${transactConfig.functionID}: ${error}`, 'Error');
            }
        },

        transactionAction(transactConfigInput, options) {
            let transactConfig = transactConfigInput;
            if (typeof transactConfigInput === 'string') {
                const functionID = transactConfigInput;
                transactConfig = $this?.transaction?.[functionID];
                if (!transactConfig) {
                    syn.$l.eventLog('$w.transactionAction', `Transaction config not found for functionID "${functionID}"`, 'Warning');
                    return;
                }

                transactConfig.functionID = transactConfig.functionID || functionID;
            }

            if (!transactConfig || !$this?.config) {
                syn.$l.eventLog('$w.transactionAction', 'Invalid transaction config or $this context missing.', 'Warning');
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
                            syn.$l.eventLog('$w.transactionAction.callback', `Transaction error: ${error}`, 'Error');
                            return;
                        }

                        let callbackResult = null;
                        if (typeof transactConfig.callback === 'function') {
                            try {
                                callbackResult = transactConfig.callback(error, result, additionalData, correlationID);
                            } catch (e) {
                                syn.$l.eventLog('$w.transactionAction.callbackExec', `Error executing callback: ${e}`, 'Error');
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
                                $this.hook.afterTransaction('callbackResult returned false', transactConfig.functionID, null, null, correlationID);
                            }
                        }
                    }, mergedOptions);

                } else {
                    if (syn.$w.closeProgressMessage) syn.$w.closeProgressMessage();
                    if ($this.hook?.afterTransaction) {
                        $this.hook.afterTransaction('beforeTransaction returned false', transactConfig.functionID, null, null);
                    }
                }
            } catch (error) {
                syn.$l.eventLog('$w.transactionAction', `Error executing transaction action: ${error}`, 'Error');
                if (syn.$w.closeProgressMessage) syn.$w.closeProgressMessage();
            }
        },

        transactionDirect(directObject, callback, options) {
            if (!directObject) {
                syn.$l.eventLog('$w.transactionDirect', 'directObject parameter is required.', 'Error');
                return;
            }

            if (syn.$w.progressMessage && !(directObject.noProgress === true)) {
                syn.$w.progressMessage();
            }

            const transactionObj = syn.$w.transactionObject(directObject.functionID, 'Json');

            transactionObj.programID = directObject.programID || syn.Config.ApplicationID;
            transactionObj.moduleID = directObject.moduleID || (globalRoot.devicePlatform === 'browser' ? location.pathname.split('/').filter(Boolean)[0] : undefined) || syn.Config.ModuleID;
            transactionObj.businessID = directObject.businessID || syn.Config.ProjectID;
            transactionObj.systemID = directObject.systemID || globalRoot.$this?.config?.systemID || syn.Config.SystemID;
            transactionObj.transactionID = directObject.transactionID;
            transactionObj.dataMapInterface = directObject.dataMapInterface || 'Row|Form';
            transactionObj.transactionResult = directObject.transactionResult ?? true;
            transactionObj.screenID = globalRoot.devicePlatform === 'node'
                ? (directObject.screenID || directObject.transactionID)
                : (syn.$w.pageScript?.replace('$', '') ?? '');
            transactionObj.startTraceID = directObject.startTraceID || options?.startTraceID || '';

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
                        syn.$l.eventLog('$w.transactionDirect.callback', `Error in callback: ${e}`, 'Error');
                    }
                }
            });
        },

        transaction(functionID, callback, options) {
            let errorText = '';
            const result = { errorText: [], outputStat: [] };

            try {
                if (syn.$w.domainTransactionLoaderStart) syn.$w.domainTransactionLoaderStart();

                const mergedOptions = syn.$w.argumentsExtend({
                    message: '',
                    dynamic: 'Y',
                    authorize: 'N',
                    commandType: 'D',
                    returnType: 'Json',
                    transactionScope: 'N',
                    transactionLog: 'Y'
                }, options);

                if (syn.$w.progressMessage) syn.$w.progressMessage(mergedOptions.message);

                if (!$this?.config?.transactions) {
                    throw new Error('Transaction configuration ($this.config.transactions) is missing.');
                }

                const transactions = $this.config.transactions.filter(item => item.functionID === functionID);

                if (transactions.length !== 1) {
                    throw new Error(`Transaction definition for functionID "${functionID}" not found or is duplicated.`);
                }

                const transaction = transactions[0];
                const transactionObject = syn.$w.transactionObject(transaction.functionID, 'Json');

                transactionObject.programID = $this.config.programID;
                transactionObject.businessID = $this.config.businessID;
                transactionObject.systemID = $this.config.systemID;
                transactionObject.transactionID = $this.config.transactionID;
                transactionObject.screenID = syn.$w.pageScript?.replace('$', '') ?? '';
                transactionObject.startTraceID = mergedOptions.startTraceID || '';
                transactionObject.options = mergedOptions;

                const synControls = $this.context?.synControls ?? [];

                transaction.inputs.forEach(inputMapping => {
                    let inputObjects = [];
                    const dataFieldID = inputMapping.dataFieldID;

                    const getControlValue = (controlInfo, meta) => {
                        if (!controlInfo) return meta?.dataType?.includes('num') ? 0 : '';
                        const controlModule = syn.$w.getControlModule(controlInfo.module);
                        let value = controlModule?.getValue?.(controlInfo.id.replace('_hidden', ''), meta);

                        if (value === undefined || value === null) {
                            value = meta?.dataType?.includes('num') ? 0 : '';
                        }
                        return value;
                    };

                    const validateControl = (controlInfo, options, type) => {
                        if (options?.validators && $validation?.transactionValidate) {
                            const controlModule = syn.$w.getControlModule(controlInfo.module);
                            return $validation.transactionValidate(controlModule, controlInfo, options, type);
                        }
                        return true;
                    };

                    if (inputMapping.requestType === 'Row') {
                        const rowData = [];
                        const formControls = synControls.filter(item => item.field === dataFieldID || item.formDataFieldID === dataFieldID);

                        if (formControls.length > 0) {
                            const gridChartControl = formControls.find(c => c.type?.includes('grid') || c.type?.includes('chart'));
                            if (gridChartControl && gridChartControl.field === dataFieldID) {
                                const controlModule = syn.$w.getControlModule(gridChartControl.module);
                                const values = controlModule?.getValue?.(gridChartControl.id.replace('_hidden', ''), 'Row', inputMapping.items);
                                inputObjects = values?.[0] ?? [];
                            } else {
                                Object.entries(inputMapping.items).forEach(([itemDataField, meta]) => {
                                    const controlInfo = formControls.find(c => c.field === itemDataField && c.formDataFieldID === dataFieldID);
                                    const el = controlInfo ? (syn.$l.get(`${controlInfo.id}_hidden`) || syn.$l.get(controlInfo.id)) : null;
                                    const synOptionsStr = el?.getAttribute('syn-options') || '{}';
                                    try {
                                        const synOptions = new Function(`return (${synOptionsStr})`)();
                                        if (!validateControl(controlInfo, synOptions, 'Row')) {
                                            throw new Error(`Validation failed for control: ${controlInfo?.id}`);
                                        }
                                        const controlValue = getControlValue(controlInfo, meta);
                                        rowData.push({ prop: meta.fieldID, val: controlValue });
                                    } catch (e) {
                                        throw new Error(`Error processing row control ${itemDataField}: ${e.message}`);
                                    }
                                });
                                inputObjects = rowData;
                            }
                        } else {
                            if (syn.uicontrols?.$data?.storeList) {
                                const store = syn.uicontrols.$data.storeList.find(s => s.storeType === 'Form' && s.dataSourceID === dataFieldID);
                                if (store && $this.store?.[store.dataSourceID]) {
                                    Object.entries(inputMapping.items).forEach(([itemDataField, meta]) => {
                                        const storeData = $this.store[store.dataSourceID];
                                        const controlValue = storeData?.[itemDataField] ?? (meta.dataType?.includes('num') ? 0 : '');
                                        rowData.push({ prop: meta.fieldID, val: controlValue });
                                    });
                                    inputObjects = rowData;
                                } else {
                                    syn.$l.eventLog('$w.transaction', `No Row source found for dataFieldID "${dataFieldID}"`, 'Warning');
                                }
                            } else {
                                syn.$l.eventLog('$w.transaction', `No Row source found for dataFieldID "${dataFieldID}"`, 'Warning');
                            }
                        }
                        transactionObject.inputs.push(inputObjects);
                        transactionObject.inputsItemCount.push(1);

                    } else if (inputMapping.requestType === 'List') {
                        let listData = [];
                        const listControl = synControls.find(item => item.field === dataFieldID);

                        if (listControl) {
                            const controlModule = syn.$w.getControlModule(listControl.module);
                            const el = syn.$l.get(`${listControl.id}_hidden`) || syn.$l.get(listControl.id);
                            const synOptionsStr = el?.getAttribute('syn-options') || '{}';
                            try {
                                const synOptions = new Function(`return (${synOptionsStr})`)();
                                (synOptions?.columns || []).forEach(column => {
                                    column.controlText = synOptions.controlText || '';
                                    if (!validateControl(listControl, column, 'List')) {
                                        throw new Error(`Validation failed for list control column: ${column.data}`);
                                    }
                                });

                                listData = controlModule?.getValue?.(listControl.id.replace('_hidden', ''), 'List', inputMapping.items) ?? [];

                            } catch (e) {
                                throw new Error(`Error processing list control ${dataFieldID}: ${e.message}`);
                            }
                        } else {
                            if (syn.uicontrols?.$data?.storeList) {
                                const store = syn.uicontrols.$data.storeList.find(s => s.storeType === 'Grid' && s.dataSourceID === dataFieldID);
                                if (store && $this.store?.[store.dataSourceID]) {
                                    const storeItems = $this.store[store.dataSourceID];
                                    listData = storeItems.map(item =>
                                        Object.entries(inputMapping.items).map(([df, meta]) => ({
                                            prop: meta.fieldID,
                                            val: item[df] ?? (meta.dataType?.includes('num') ? 0 : '')
                                        }))
                                    );
                                } else {
                                    syn.$l.eventLog('$w.transaction', `No List source found for dataFieldID "${dataFieldID}"`, 'Warning');
                                }
                            } else {
                                syn.$l.eventLog('$w.transaction', `No List source found for dataFieldID "${dataFieldID}"`, 'Warning');
                            }
                        }
                        transactionObject.inputs.push(...listData);
                        transactionObject.inputsItemCount.push(listData.length);
                    }
                });

                syn.$w.executeTransaction($this.config, transactionObject, (responseData, additionalData, correlationID) => {
                    try {
                        const isDynamicOutput = transaction.outputs.some(o => o.responseType === 'Dynamic');

                        if (isDynamicOutput) {
                            result.outputStat.push({ fieldID: 'Dynamic', count: 1, dynamicData: responseData });
                        } else if (responseData?.length === transaction.outputs.length) {
                            transaction.outputs.forEach((outputMapping, outputIndex) => {
                                const dataMapItem = responseData[outputIndex];
                                const responseFieldID = dataMapItem?.id;
                                const outputData = dataMapItem?.value;

                                if ($this.hook?.outputDataBinding) {
                                    $this.hook.outputDataBinding(functionID, responseFieldID, outputData);
                                }

                                const mapOutputData = (targetType, dataFieldID, data) => {
                                    const controls = synControls.filter(item => item.field === dataFieldID || (targetType === 'Form' && item.formDataFieldID === dataFieldID));

                                    if (controls.length > 0) {
                                        const targetControl = controls.find(c => c.field === dataFieldID) || controls[0];
                                        const controlModule = syn.$w.getControlModule(targetControl.module);
                                        if (controlModule?.setValue) {
                                            if (targetType === 'Form') {
                                                Object.entries(outputMapping.items).forEach(([itemDataField, meta]) => {
                                                    const formControlInfo = controls.find(c => c.field === itemDataField && c.formDataFieldID === dataFieldID);
                                                    if (formControlInfo && data?.[meta.fieldID] !== undefined) {
                                                        const formModule = syn.$w.getControlModule(formControlInfo.module);
                                                        formModule?.setValue?.(formControlInfo.id.replace('_hidden', ''), data[meta.fieldID], meta);
                                                    }
                                                });
                                            } else {
                                                controlModule.setValue(targetControl.id.replace('_hidden', ''), data, outputMapping.items);
                                            }
                                            return true;
                                        }
                                    }
                                    return false;
                                };

                                const mapOutputToStore = (targetType, dataFieldID, data) => {
                                    if (syn.uicontrols?.$data?.storeList) {
                                        const store = syn.uicontrols.$data.storeList.find(s => s.storeType === targetType && s.dataSourceID === dataFieldID);
                                        if (store && $this?.store) {
                                            if (targetType === 'Form') {
                                                $this.store[store.dataSourceID] = $this.store[store.dataSourceID] ?? {};
                                                Object.entries(outputMapping.items).forEach(([itemDataField, meta]) => {
                                                    if (data?.[meta.fieldID] !== undefined) {
                                                        $this.store[store.dataSourceID][itemDataField] = data[meta.fieldID];
                                                    }
                                                });
                                            } else {
                                                $this.store[store.dataSourceID] = (data || []).map(item => ({ ...item, Flag: 'R' }));
                                            }
                                            return true;
                                        }
                                    }
                                    return false;
                                };

                                if (outputMapping.responseType === 'Form') {
                                    const count = (outputData && Object.keys(outputData).length > 0) ? 1 : 0;
                                    result.outputStat.push({ fieldID: responseFieldID, Count: count });
                                    if (count > 0) {
                                        if (!mapOutputData('Form', outputMapping.dataFieldID, outputData)) {
                                            if (!mapOutputToStore('Form', outputMapping.dataFieldID, outputData)) {
                                                result.errorText.push(`"${outputMapping.dataFieldID}" Form Output Mapping target not found.`);
                                                syn.$l.eventLog('$w.transaction', `"${outputMapping.dataFieldID}" Form Output Mapping target not found.`, 'Error');
                                            }
                                        }
                                    }
                                } else if (outputMapping.responseType === 'Grid' || outputMapping.responseType === 'Chart') {
                                    const count = outputData?.length ?? 0;
                                    result.outputStat.push({ fieldID: responseFieldID, Count: count });
                                    if (count > 0) {
                                        if (!mapOutputData(outputMapping.responseType, outputMapping.dataFieldID, outputData)) {
                                            if (!mapOutputToStore(outputMapping.responseType, outputMapping.dataFieldID, outputData)) { // Try store mapping
                                                const targetDesc = outputMapping.responseType === 'Grid' ? 'Grid' : 'Chart';
                                                result.errorText.push(`"${outputMapping.dataFieldID}" ${targetDesc} Output Mapping target not found.`);
                                                syn.$l.eventLog('$w.transaction', `"${outputMapping.dataFieldID}" ${targetDesc} Output Mapping target not found.`, 'Error');
                                            }
                                        }
                                    }
                                }
                            });
                        } else {
                            throw new Error(`Mismatch between output definitions (${transaction.outputs.length}) and response data (${responseData?.length ?? 0}).`);
                        }

                        if (callback) callback(result, additionalData, correlationID);

                    } catch (mappingError) {
                        result.errorText.push(`Output mapping error: ${mappingError.message}`);
                        syn.$l.eventLog('$w.transaction.outputMap', `Output mapping error: ${mappingError}`, 'Error');
                        if (callback) callback(result, additionalData, correlationID);
                    } finally {
                        if (syn.$w.domainTransactionLoaderEnd) syn.$w.domainTransactionLoaderEnd();
                    }
                });

            } catch (error) {
                errorText = `Transaction setup error: ${error.message}`;
                result.errorText.push(errorText);
                syn.$l.eventLog('$w.transaction', errorText, 'Error');
                if (callback) callback(result, null, null);
                if (syn.$w.domainTransactionLoaderEnd) syn.$w.domainTransactionLoaderEnd();
            }
        },

        getterValue(transactConfigInput) {
            const result = { errors: [], inputs: [] };
            let transactConfig = transactConfigInput;
            if (typeof transactConfigInput === 'string') {
                transactConfig = $this?.transaction?.[transactConfigInput];
                if (!transactConfig) {
                    syn.$l.eventLog('$w.transactionAction', `Transaction config not found for functionID "${transactConfigInput}"`, 'Warning');
                    return;
                }
            }

            try {
                syn.$w.tryAddFunction(transactConfig);

                if (!$this?.config?.transactions) {
                    throw new Error('Transaction configuration ($this.config.transactions) is missing.');
                }

                const transactions = $this.config.transactions.filter(item => item.functionID === transactConfig.functionID);
                if (transactions.length !== 1) {
                    throw new Error(`Transaction definition for functionID "${transactConfig.functionID}" not found or is duplicated.`);
                }
                const transaction = transactions[0];
                const synControls = $this.context?.synControls ?? [];

                transaction.inputs.forEach(inputMapping => {
                    let inputObjects = [];
                    const dataFieldID = inputMapping.dataFieldID;

                    const getControlValue = (controlInfo, meta) => {
                        if (!controlInfo) return meta?.dataType?.includes('num') ? 0 : '';
                        const controlModule = syn.$w.getControlModule(controlInfo.module);
                        let value = controlModule?.getValue?.(controlInfo.id.replace('_hidden', ''), meta);
                        return value ?? (meta?.dataType?.includes('num') ? 0 : '');
                    };


                    if (inputMapping.requestType === 'Row') {
                        const rowData = {};
                        const formControls = synControls.filter(item => item.field === dataFieldID || item.formDataFieldID === dataFieldID);

                        if (formControls.length > 0) {
                            const gridChartControl = formControls.find(c => c.type?.includes('grid') || c.type?.includes('chart'));
                            if (gridChartControl && gridChartControl.field === dataFieldID) {
                                const controlModule = syn.$w.getControlModule(gridChartControl.module);
                                const values = controlModule?.getValue?.(gridChartControl.id.replace('_hidden', ''), 'Row', inputMapping.items);
                                inputObjects = values?.[0] ?? [];
                                inputObjects.forEach(item => { rowData[item.prop] = item.val; });

                            } else {
                                Object.entries(inputMapping.items).forEach(([itemDataField, meta]) => {
                                    const controlInfo = formControls.find(c => c.field === itemDataField && c.formDataFieldID === dataFieldID);
                                    rowData[meta.fieldID] = getControlValue(controlInfo, meta);
                                });
                            }
                        } else if (syn.uicontrols?.$data?.storeList) {
                            const store = syn.uicontrols.$data.storeList.find(s => s.storeType === 'Form' && s.dataSourceID === dataFieldID);
                            if (store && $this.store?.[store.dataSourceID]) {
                                Object.entries(inputMapping.items).forEach(([itemDataField, meta]) => {
                                    const storeData = $this.store[store.dataSourceID];
                                    rowData[meta.fieldID] = storeData?.[itemDataField] ?? (meta.dataType?.includes('num') ? 0 : '');
                                });
                            } else {
                                syn.$l.eventLog('$w.getterValue', `No Row source found for dataFieldID "${dataFieldID}"`, 'Warning');
                            }
                        } else {
                            syn.$l.eventLog('$w.getterValue', `No Row source found for dataFieldID "${dataFieldID}"`, 'Warning');
                        }
                        result.inputs.push(rowData);

                    } else if (inputMapping.requestType === 'List') {
                        let listData = [];
                        const listControl = synControls.find(item => item.field === dataFieldID);

                        if (listControl) {
                            const controlModule = syn.$w.getControlModule(listControl.module);
                            const rawListData = controlModule?.getValue?.(listControl.id.replace('_hidden', ''), 'List', inputMapping.items) ?? [];
                            listData = rawListData.map(rowItems =>
                                rowItems.reduce((obj, item) => {
                                    obj[item.prop] = item.val;
                                    return obj;
                                }, {})
                            );
                        } else if (syn.uicontrols?.$data?.storeList) {
                            const store = syn.uicontrols.$data.storeList.find(s => s.storeType === 'Grid' && s.dataSourceID === dataFieldID);
                            if (store && $this.store?.[store.dataSourceID]) {
                                const storeItems = $this.store[store.dataSourceID];
                                listData = storeItems.map(item =>
                                    Object.entries(inputMapping.items).reduce((obj, [df, meta]) => {
                                        obj[meta.fieldID] = item[df] ?? (meta.dataType?.includes('num') ? 0 : '');
                                        return obj;
                                    }, {})
                                );
                            } else {
                                syn.$l.eventLog('$w.getterValue', `No List source found for dataFieldID "${dataFieldID}"`, 'Warning');
                            }
                        } else {
                            syn.$l.eventLog('$w.getterValue', `No List source found for dataFieldID "${dataFieldID}"`, 'Warning');
                        }
                        result.inputs.push(...listData);
                    }
                });

            } catch (error) {
                result.errors.push(`Getter error: ${error.message}`);
                syn.$l.eventLog('$w.getterValue', `Getter error: ${error}`, 'Error');
            }
            return result;
        },

        setterValue(transactConfigInput, responseData) {
            const result = { errors: [], outputs: [] };
            let transactConfig = transactConfigInput;
            if (typeof transactConfigInput === 'string') {
                transactConfig = $this?.transaction?.[transactConfigInput];
                if (!transactConfig) {
                    syn.$l.eventLog('$w.transactionAction', `Transaction config not found for functionID "${transactConfigInput}"`, 'Warning');
                    return;
                }
            }

            try {
                syn.$w.tryAddFunction(transactConfig);

                if (!$this?.config?.transactions) {
                    throw new Error('Transaction configuration ($this.config.transactions) is missing.');
                }
                const transactions = $this.config.transactions.filter(item => item.functionID === transactConfig.functionID);
                if (transactions.length !== 1) {
                    throw new Error(`Transaction definition for functionID "${transactConfig.functionID}" not found or is duplicated.`);
                }
                const transaction = transactions[0];
                const synControls = $this.context?.synControls ?? [];

                if (responseData?.length !== transaction.outputs.length) {
                    throw new Error(`Mismatch between output definitions (${transaction.outputs.length}) and response data (${responseData?.length ?? 0}).`);
                }

                transaction.outputs.forEach((outputMapping, outputIndex) => {
                    const outputData = responseData[outputIndex];
                    const responseFieldID = outputMapping.responseType + 'Data' + outputIndex;

                    const mapOutputData = (targetType, dataFieldID, data) => {
                        const controls = synControls.filter(item => item.field === dataFieldID || (targetType === 'Form' && item.formDataFieldID === dataFieldID));
                        if (controls.length === 0) return false;

                        const targetControl = controls.find(c => c.field === dataFieldID) || controls[0];
                        const controlModule = syn.$w.getControlModule(targetControl.module);
                        if (controlModule?.setValue) {
                            if (targetType === 'Form') {
                                Object.entries(outputMapping.items).forEach(([itemDataField, meta]) => {
                                    const formControlInfo = controls.find(c => c.field === itemDataField && c.formDataFieldID === dataFieldID);
                                    if (formControlInfo && data?.[meta.fieldID] !== undefined) {
                                        const formModule = syn.$w.getControlModule(formControlInfo.module);
                                        formModule?.setValue?.(formControlInfo.id.replace('_hidden', ''), data[meta.fieldID], meta);
                                    }
                                });
                            } else {
                                controlModule.setValue(targetControl.id.replace('_hidden', ''), data, outputMapping.items);
                            }
                            return true;
                        }
                        return false;
                    };

                    const mapOutputToStore = (targetType, dataFieldID, data) => {
                        if (syn.uicontrols?.$data?.storeList) {
                            const store = syn.uicontrols.$data.storeList.find(s => s.storeType === targetType && s.dataSourceID === dataFieldID);
                            if (store && $this?.store) {
                                if (targetType === 'Form') {
                                    $this.store[store.dataSourceID] = $this.store[store.dataSourceID] ?? {};
                                    Object.entries(outputMapping.items).forEach(([itemDataField, meta]) => {
                                        if (data?.[meta.fieldID] !== undefined) {
                                            $this.store[store.dataSourceID][itemDataField] = data[meta.fieldID];
                                        }
                                    });
                                } else {
                                    $this.store[store.dataSourceID] = (data || []).map(item => ({ ...item, Flag: 'R' }));
                                }
                                return true;
                            }
                        }
                        return false;
                    };


                    if (outputMapping.responseType === 'Form') {
                        const count = (outputData && Object.keys(outputData).length > 0) ? 1 : 0;
                        result.outputs.push({ fieldID: responseFieldID, Count: count });
                        if (count > 0) {
                            if (!mapOutputData('Form', outputMapping.dataFieldID, outputData)) {
                                if (!mapOutputToStore('Form', outputMapping.dataFieldID, outputData)) {
                                    result.errors.push(`"${outputMapping.dataFieldID}" Form Output Mapping target not found.`);
                                    syn.$l.eventLog('$w.setterValue', `"${outputMapping.dataFieldID}" Form Output Mapping target not found.`, 'Error');
                                }
                            }
                        }
                    } else if (outputMapping.responseType === 'Grid' || outputMapping.responseType === 'Chart') {
                        const count = outputData?.length ?? 0;
                        result.outputs.push({ fieldID: responseFieldID, Count: count });
                        if (count > 0) {
                            if (!mapOutputData(outputMapping.responseType, outputMapping.dataFieldID, outputData)) {
                                if (!mapOutputToStore(outputMapping.responseType, outputMapping.dataFieldID, outputData)) {
                                    const targetDesc = outputMapping.responseType === 'Grid' ? 'Grid' : 'Chart';
                                    result.errors.push(`"${outputMapping.dataFieldID}" ${targetDesc} Output Mapping target not found.`);
                                    syn.$l.eventLog('$w.setterValue', `"${outputMapping.dataFieldID}" ${targetDesc} Output Mapping target not found.`, 'Error');
                                }
                            }
                        }
                    }
                });

            } catch (error) {
                result.errors.push(`Setter error: ${error.message}`);
                syn.$l.eventLog('$w.setterValue', `Setter error: ${error}`, 'Error');
            }
            return result;
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
                syn.$l.eventLog('$w.fileDownload', `Error triggering download for ${url}: ${e}`, 'Error');
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
                syn.$l.eventLog('$w.sleep', 'Callback or Promise support required.', 'Debug');
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
                syn.$l.eventLog('$w.xmlParser', 'DOMParser not supported in this environment.', 'Error');
                return null;
            }
            try {
                const parser = new DOMParser();
                return parser.parseFromString(xmlString, 'text/xml');
            } catch (e) {
                syn.$l.eventLog('$w.xmlParser', `Error parsing XML: ${e}`, 'Error');
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
                            options.method = options.method || 'POST';

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
                            result = { error: `status: ${response.status}, text: ${await response.text()}` }
                            syn.$l.eventLog('$w.apiHttp', `${result.error}`, 'Error');
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
                                syn.$l.eventLog('$w.fetchScript', `${decodeError}, <script src="${moduleUrl}.js"></script> 문법 확인 필요`, 'Error');
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
                    syn.$l.eventLog('$w.fetchScript', error, 'Warning');
                    if (moduleScript) {
                        syn.$l.eventLog('$w.fetchScript', '<script src="{0}.js"></script> 문법 확인 필요'.format(moduleUrl), 'Error');
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
            const cacheBust = (syn.Config?.IsClientCaching === false) ? `${url.includes('?') ? '&' : '?'}tick=${Date.now()}` : '';
            const finalUrl = url + cacheBust;

            try {
                const response = await fetch(finalUrl, fetchOptions);
                if (!response.ok) {
                    const errorText = await response.text().catch(() => `HTTP ${response.status} ${response.statusText}`);
                    syn.$l.eventLog('$w.fetchText', `Fetch failed for ${finalUrl}: status ${response.status}, text: ${errorText}`, 'Warning');
                    return null;
                }
                return await response.text();
            } catch (error) {
                syn.$l.eventLog('$w.fetchText', `Fetch error for ${finalUrl}: ${error}`, 'Error');
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
            const cacheBust = (syn.Config?.IsClientCaching === false) ? `${url.includes('?') ? '&' : '?'}tick=${Date.now()}` : '';
            const finalUrl = url + cacheBust;

            try {
                const response = await fetch(finalUrl, fetchOptions);
                if (!response.ok) {
                    const errorText = await response.text().catch(() => `HTTP ${response.status} ${response.statusText}`);
                    syn.$l.eventLog('$w.fetchJson', `Fetch failed for ${finalUrl}: status ${response.status}, text: ${errorText}`, 'Warning');
                    return null;
                }

                const contentType = response.headers.get('Content-Type') || '';
                if (!contentType.includes('application/json')) {
                    syn.$l.eventLog('$w.fetchJson', `Expected JSON but received Content-Type: ${contentType} for ${finalUrl}`, 'Warning');
                }

                return await response.json();
            } catch (error) {
                if (error instanceof SyntaxError) {
                    syn.$l.eventLog('$w.fetchJson', `JSON parse error for ${finalUrl}: ${error}`, 'Error');
                } else {
                    syn.$l.eventLog('$w.fetchJson', `Fetch error for ${finalUrl}: ${error}`, 'Error');
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
            if ($object.isNullOrUndefined(config) == true || $object.isNullOrUndefined(transactionObject) == true) {
                if (globalRoot.devicePlatform === 'browser') {
                    alert('서비스 호출에 필요한 거래 정보가 구성되지 않았습니다');
                }

                syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 거래 정보 확인 필요', 'Error');
                return;
            }

            var serviceID = syn.Config.SystemID + syn.Config.Environment.substring(0, 1) + ($string.isNullOrEmpty(syn.Config.LoadModuleID) == true ? '' : syn.Config.LoadModuleID);
            var apiService = null;
            var apiServices = syn.$w.getStorage('apiServices', false);
            if (globalRoot.devicePlatform === 'node') {
                if (apiServices) {
                    apiService = apiServices[serviceID];
                    if (apiService) {
                        if ($object.isNullOrUndefined(apiServices.BearerToken) == true && globalRoot.bearerToken) {
                            apiServices.BearerToken = globalRoot.bearerToken;
                            syn.$w.setStorage('apiServices', apiServices, false);
                        }
                    }
                    else if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = apiServices || {};
                        if (token || globalRoot.bearerToken) {
                            apiServices.BearerToken = token || globalRoot.bearerToken;
                        }
                        apiServices[serviceID] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보가 구성되지 확인 필요', 'Error');
                    }
                }
                else {
                    if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = apiServices || {};
                        if (token || globalRoot.bearerToken) {
                            apiServices.BearerToken = token || globalRoot.bearerToken;
                        }
                        apiServices[serviceID] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보가 구성되지 확인 필요', 'Error');
                    }
                }
            }
            else {
                if (apiServices) {
                    apiService = apiServices[serviceID];
                    if (apiService) {
                        if ((apiServices.BearerToken == null || apiServices.BearerToken == undefined) && window.bearerToken) {
                            apiServices.BearerToken = window.bearerToken;
                            syn.$w.setStorage('apiServices', apiServices, false);
                        }
                    }
                    else if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = apiServices || {};
                        if (window.bearerToken) {
                            apiServices.BearerToken = window.bearerToken;
                        }
                        apiServices[serviceID] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보가 구성되지 확인 필요', 'Error');
                    }
                }
                else {
                    if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = apiServices || {};
                        if (window.bearerToken) {
                            apiServices.BearerToken = window.bearerToken;
                        }
                        apiServices[serviceID] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보가 구성되지 확인 필요', 'Error');
                    }
                }
            }

            var apiServices = syn.$w.getStorage('apiServices', false);
            if (apiServices) {
                apiService = apiServices[serviceID];
            }

            if (apiService == null) {
                syn.$l.eventLog('$w.executeTransaction', 'apiService 확인 필요', 'Fatal');
            }
            else {
                if (apiService.exceptionText) {
                    syn.$l.eventLog('$w.executeTransaction', 'apiService 확인 필요 SystemID: {0}, ServerType: {1}, Message: {2}'.format(config.systemID, syn.Config.Environment.substring(0, 1), apiService.exceptionText), 'Fatal');
                    return;
                }

                var ipAddress = syn.$w.getStorage('ipAddress', false);
                if ($object.isNullOrUndefined(ipAddress) == true && $string.isNullOrEmpty(syn.Config.FindClientIPServer) == false) {
                    ipAddress = await syn.$r.httpFetch(syn.Config.FindClientIPServer || '/checkip').send(null, {
                        method: 'GET',
                        redirect: 'follow',
                        timeout: 1000
                    });
                }

                if ($object.isNullOrUndefined(ipAddress) == true) {
                    ipAddress = 'localhost';
                }

                syn.$w.setStorage('ipAddress', ipAddress, false);

                var url = '';
                if (apiService.Port && apiService.Port != '') {
                    url = '{0}://{1}:{2}{3}'.format(apiService.Protocol, apiService.IP, apiService.Port, apiService.Path);
                }
                else {
                    url = '{0}://{1}{2}'.format(apiService.Protocol, apiService.IP, apiService.Path);
                }

                var installType = syn.$w.Variable && syn.$w.Variable.InstallType ? syn.$w.Variable.InstallType : 'L';
                var environment = syn.Config && syn.Config.Environment ? syn.Config.Environment.substring(0, 1) : 'D';
                var machineTypeID = syn.Config && syn.Config.Transaction ? syn.Config.Transaction.MachineTypeID.substring(0, 1) : 'W';
                var programID = (syn.$w.Variable && syn.$w.Variable.ProgramID ? syn.$w.Variable.ProgramID : config.programID).padStart(8, '0');
                var businessID = config.businessID.padStart(3, '0').substring(0, 3);
                var transactionID = transactionObject.transactionID.padStart(6, '0').substring(0, 6);
                var functionID = transactionObject.functionID.padStart(4, '0').substring(0, 4);
                var tokenID = (syn.$w.User && syn.$w.User.TokenID ? syn.$w.User.TokenID : syn.$l.random(6)).padStart(6, '0').substring(0, 6);
                var requestTime = $date.toString(new Date(), 's').substring(0, 6);
                // -- 36바이트 = 설치구분 1자리(L: Local, C: Cloud, O: Onpremise) + 환경 ID 1자리 + 애플리케이션 ID 8자리 + 프로젝트 ID 3자리 + 거래 ID 6자리 + 기능 ID 4자리 + 시스템 구분 1자리 (W: WEB, P: Program, S: SVR, E: EXT) + ClientTokenID 6자리 + Timestamp (HHmmss) 6자리
                var requestID = `${installType}${environment}${programID}${businessID}${transactionID}${functionID}${machineTypeID}${tokenID}${requestTime}`.toUpperCase();
                var globalID = '';

                if ($string.isNullOrEmpty(syn.Config.FindGlobalIDServer) == false) {
                    apiService.GlobalID = await syn.$r.httpFetch(syn.Config.FindGlobalIDServer).send({
                        applicationID: programID,
                        projectID: businessID,
                        transactionID: transactionID,
                        serviceID: functionID,
                        screenID: transactionObject.screenID,
                        tokenID: tokenID
                    }, {
                        method: 'POST',
                        redirect: 'follow',
                        timeout: 1000
                    });
                }

                if ($string.isNullOrEmpty(apiService.GlobalID) == false) {
                    globalID = apiService.GlobalID;
                }
                else {
                    globalID = requestID;
                }

                var transactionRequest = {
                    accessToken: token || globalRoot.bearerToken || apiServices.BearerToken,
                    action: 'SYN', // "SYN: Request/Response, PSH: Execute/None, ACK: Subscribe",
                    kind: 'BIZ', // "DBG: Debug, BIZ: Business, URG: Urgent, FIN: Finish",
                    clientTag: syn.Config.SystemID.concat('|', syn.Config.HostName, '|', syn.Config.Program.ProgramName, '|', syn.Config.Environment.substring(0, 1)),
                    loadOptions: {
                        encryptionType: syn.Config.Transaction.EncryptionType, // "P:Plain, F:Full, H:Header, B:Body",
                        encryptionKey: syn.Config.Transaction.EncryptionKey, // "P:프로그램, K:KMS 서버, G:GlobalID 키",
                        platform: globalRoot.devicePlatform == 'browser' ? syn.$b.platform : globalRoot.devicePlatform
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
                        pathName: globalRoot.devicePlatform == 'browser' ? location.pathname : ''
                    },
                    interface: {
                        devicePlatform: globalRoot.devicePlatform,
                        interfaceID: syn.Config.Transaction.MachineTypeID,
                        sourceIP: ipAddress,
                        sourcePort: 0,
                        sourceMAC: '',
                        connectionType: globalRoot.devicePlatform == 'node' ? 'unknown' : navigator.connection.effectiveType,
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
                        operatorID: globalRoot.devicePlatform == 'browser' ? (syn.$w.User ? syn.$w.User.UserID : '') : syn.Config.Program.ProgramName,
                        screenID: transactionObject.screenID,
                        startTraceID: transactionObject.startTraceID,
                        dataFormat: syn.Config.Transaction.DataFormat,
                        compressionYN: syn.Config.Transaction.CompressionYN
                    },
                    payLoad: {
                        property: {},
                        dataMapInterface: '',
                        dataMapCount: [],
                        dataMapSet: []
                    }
                };

                if (syn.$w.transactionLoadOptions) {
                    syn.$w.transactionLoadOptions(transactionRequest.loadOptions);
                }

                if ($object.isNullOrUndefined(transactionObject.options) == false) {
                    for (var key in transactionObject.options) {
                        var item = transactionObject.options[key];

                        if (key == 'encryptionType' || key == 'encryptionKey' || key == 'platform') {
                            throw new Error('{0} 옵션 사용 불가'.format(key));
                        }
                        else {
                            transactionRequest.loadOptions[key] = item;
                        }
                    }

                    var dynamic = transactionRequest.loadOptions['dynamic'];
                    if ($string.isNullOrEmpty(dynamic) == false && $string.toBoolean(dynamic) == false) {
                        delete transactionRequest.loadOptions['dynamic'];
                        delete transactionRequest.loadOptions['authorize'];
                        delete transactionRequest.loadOptions['commandType'];
                        delete transactionRequest.loadOptions['returnType'];
                        delete transactionRequest.loadOptions['transactionScope'];
                        delete transactionRequest.loadOptions['transactionLog'];
                    }

                    var action = transactionRequest.loadOptions['action'];
                    if ($string.isNullOrEmpty(action) == false) {
                        transactionRequest.action = action;
                        delete transactionRequest.loadOptions['action'];
                    }

                    var kind = transactionRequest.loadOptions['kind'];
                    if ($string.isNullOrEmpty(kind) == false) {
                        transactionRequest.kind = kind;
                        delete transactionRequest.loadOptions['kind'];
                    }

                    delete transactionRequest.loadOptions['message'];
                }

                var mod = context[syn.$w.pageScript];
                if (mod && mod.hook.payLoadProperty) {
                    var property = {};
                    property = mod.hook.payLoadProperty(transactionObject.transactionID, transactionObject.functionID);
                    if ($object.isNullOrUndefined(property) == true) {
                        property = {};
                    }

                    transactionRequest.payLoad.property = property;
                }

                if (config.transactions) {
                    var transactions = config.transactions.filter(function (item) {
                        return item.functionID == transactionObject.functionID;
                    });

                    if (transactions.length == 1) {
                        var transaction = transactions[0];

                        var inputs = transaction.inputs.map(function (item) { return item.requestType; }).join(',');
                        var outputs = transaction.outputs.map(function (item) { return item.responseType; }).join(',');
                        transactionRequest.payLoad.dataMapInterface = '{0}|{1}'.format(inputs, outputs);
                    }
                }
                else if (transactionObject.dataMapInterface) {
                    transactionRequest.payLoad.dataMapInterface = transactionObject.dataMapInterface;
                }

                if (transactionRequest.transaction.dataFormat == 'J' || transactionRequest.transaction.dataFormat == 'T') {
                }
                else {
                    throw new Error('transaction.dataFormat 확인 필요: {0}'.format(transactionRequest.transaction.dataFormat));
                }

                transactionRequest.payLoad.dataMapCount = transactionObject.inputsItemCount;
                transactionRequest.payLoad.dataMapSet = [];
                transactionRequest.payLoad.dataMapSetRaw = [];
                var length = transactionObject.inputs.length;

                for (var i = 0; i < length; i++) {
                    var inputs = transactionObject.inputs[i];

                    var reqInputs = [];
                    for (var j = 0; j < inputs.length; j++) {
                        var item = inputs[j];

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
                    var blob = new Blob([JSON.stringify(transactionRequest)], { type: 'application/json; charset=UTF-8' });
                    navigator.sendBeacon(url, blob);

                    if (syn.$w.domainTransactionLoaderEnd) {
                        syn.$w.domainTransactionLoaderEnd();
                    }

                    if (syn.$w.closeProgressMessage) {
                        syn.$w.closeProgressMessage();
                    }
                }
                else {
                    var xhr = syn.$w.xmlHttp();
                    xhr.open(syn.$w.method, url, true);
                    xhr.setRequestHeader('Accept-Language', syn.$w.localeID);
                    xhr.setRequestHeader('Server-SystemID', config.systemID || syn.Config.SystemID);
                    xhr.setRequestHeader('Server-BusinessID', config.businessID);

                    if (syn.Environment) {
                        var environment = syn.Environment;
                        if (environment.Header) {
                            for (var item in environment.Header) {
                                xhr.setRequestHeader(item, environment.Header[item]);
                            }
                        }
                    }

                    if (syn.$w.setServiceClientHeader) {
                        if (syn.$w.setServiceClientHeader(xhr) == false) {
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
                                    syn.$l.eventLog('$w.executeTransaction', 'X-Requested transfort error', 'Fatal');
                                }
                                else {
                                    syn.$l.eventLog('$w.executeTransaction', 'response status - {0}'.format(xhr.statusText) + xhr.responseText, 'Error');
                                }

                                if (syn.$w.domainTransactionLoaderEnd) {
                                    syn.$w.domainTransactionLoaderEnd();
                                }
                                return;
                            }

                            if (syn.$w.clientTag && syn.$w.serviceClientInterceptor) {
                                if (syn.$w.serviceClientInterceptor(syn.$w.clientTag, xhr) === false) {
                                    return;
                                }
                            }

                            try {
                                var transactionResponse = JSON.parse(xhr.responseText);
                                if (transactionObject.transactionResult == true) {
                                    if (transactionResponse.acknowledge == 1) {
                                        var jsonResult = [];
                                        var message = transactionResponse.message;
                                        if (transactionResponse.result.dataSet != null && transactionResponse.result.dataSet.length > 0) {
                                            var dataMapItem = transactionResponse.result.dataSet;
                                            var length = dataMapItem.length;
                                            for (var i = 0; i < length; i++) {
                                                var item = dataMapItem[i];

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
                                                        var transaction = config.transactions.find(function (item) {
                                                            return item.functionID == transactionObject.functionID;
                                                        });

                                                        if (transaction) {
                                                            var value = null;
                                                            if ($object.isEmpty(item.value) == false) {
                                                                value = transactionResponse.transaction.compressionYN == 'Y' ? syn.$c.LZString.decompressFromBase64(item.value).split('＾') : item.value.split('＾');
                                                                var meta = $string.toParameterObject(value[0]);
                                                                value = $string.toJson(value[1], { delimeter: '｜', newline: '↵', meta: meta });

                                                                var outputMapping = transaction.outputs[i];
                                                                if (outputMapping.responseType == 'Form') {
                                                                    value = value[0];
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
                                                        var value = transactionResponse.transaction.compressionYN == 'Y' ? syn.$c.LZString.decompressFromBase64(item.value).split('＾') : item.value.split('＾');
                                                        var meta = $string.toParameterObject(value[0]);
                                                        value = $string.toJson(value[1], { delimeter: '｜', newline: '↵', meta: meta });
                                                        if (item.id.startsWith('Form') == true) {
                                                            value = value[0];
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
                                            var addtionalData = {};
                                            if (message.additions && message.additions.length > 0) {
                                                for (var i = 0; i < message.additions.length; i++) {
                                                    var addition = message.additions[i];

                                                    if (addition.code == 'F' && $object.isNullOrUndefined(addtionalData[addition.code]) == true) {
                                                        addtionalData[addition.code] = addition.text;
                                                    }
                                                    else if (addition.code == 'P') {

                                                    }
                                                    else if (addition.code == 'S') {

                                                    }
                                                }
                                            }

                                            try {
                                                callback(jsonResult, addtionalData, transactionResponse.correlationID);
                                            } catch (error) {
                                                syn.$l.eventLog('$w.executeTransaction callback', error, 'Error');
                                            }
                                        }
                                    }
                                    else {
                                        var errorText = transactionResponse.exceptionText;
                                        var errorMessage = '거래: {0}, 기능: {1} 수행중 오류가 발생하였습니다\nGlobalID: {2}'.format(transactionRequest.transaction.transactionID, transactionRequest.transaction.functionID, transactionRequest.transaction.globalID);
                                        if (syn.$w.serviceClientException) {
                                            syn.$w.serviceClientException('요청오류', errorMessage, errorText);
                                        }

                                        syn.$l.eventLog('$w.executeTransaction', errorText, 'Warning');

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
                                                    callback([], null), transactionResponse.correlationID;
                                                } catch (error) {
                                                    syn.$l.eventLog('$w.executeTransaction callback', error, 'Error');
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
                                                    var dataMapItem = transactionResponse.result.dataSet;
                                                    var length = dataMapItem.length;
                                                    for (var i = 0; i < length; i++) {
                                                        var item = dataMapItem[i];
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
                                                syn.$l.eventLog('$w.executeTransaction', error, 'Error');
                                            }
                                        }

                                        try {
                                            callback(transactionResponse, null, transactionResponse.correlationID);
                                        } catch (error) {
                                            syn.$l.eventLog('$w.executeTransaction callback', error, 'Error');
                                        }
                                    }
                                }
                            }
                            catch (error) {
                                var errorMessage = '거래: {0}, 기능: {1} 수행중 오류가 발생하였습니다\nGlobalID: {2}'.format(transactionRequest.transaction.transactionID, transactionRequest.transaction.functionID, transactionRequest.transaction.globalID);
                                if (syn.$w.serviceClientException) {
                                    syn.$w.serviceClientException('요청오류', errorMessage, error.stack);
                                }

                                syn.$l.eventLog('$w.executeTransaction', error, 'Error');

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
                                            syn.$l.eventLog('$w.executeTransaction callback', error, 'Error');
                                        }
                                    }
                                }
                            }

                            if (syn.$w.domainTransactionLoaderEnd) {
                                syn.$w.domainTransactionLoaderEnd();
                            }
                        }
                    }

                    syn.$l.eventLog('$w.executeTransaction', transactionRequest.transaction.globalID, 'Verbose');

                    xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.timeout = syn.Config.TransactionTimeout;
                    xhr.send(JSON.stringify(transactionRequest));
                }
            }
        },

        // syn.$w.pseudoStyle('styGrid1', '.handsontable tbody tr td:nth-of-type(3)', `color: red;text-decoration: underline;font-weight: 600;cursor: pointer;`)
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

        // syn.$w.pseudoStyles('styGrid1', [{selector: '.handsontable tbody tr td:nth-of-type(3)', cssText: `color: red;text-decoration: underline;font-weight: 600;cursor: pointer;`}])
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
            var filePath = path.join(process.cwd(), 'node.config.json');
            if (fs.existsSync(filePath) == true) {
                var data = fs.readFileSync(filePath, 'utf8');
                syn.Config = JSON.parse(data);

                process.env.SYN_LogMinimumLevel = syn.Config.LogMinimumLevel || 'trace';
                process.env.SYN_FileLogBasePath = syn.Config.FileLogBasePath || path.join(process.cwd(), '..', 'log', 'function', 'javascript');
                process.env.SYN_LocalStoragePath = syn.Config.LocalStoragePath || path.join(process.cwd(), '..', 'cache', 'function');
            }
            else {
                console.error('Node.js 환경설정 파일이 존재하지 않습니다. 파일경로: {0}'.format(filePath));
            }
        }

        if (syn.Config && $string.isNullOrEmpty(syn.Config.DataSourceFilePath) == true) {
            syn.Config.DataSourceFilePath = path.join(process.cwd(), '..', 'modules', 'dbclient', 'module.json');
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
            syn.Config = syn.$w.argumentsExtend(synConfig, syn.Config);
            context.synConfig = undefined;

            globalRoot.isLoadConfig = true;
            setTimeout(async function () {
                await $webform.contentLoaded();
            });
        }
        else {
            $webform.loadJson('/' + (context.synConfigName || 'syn.config.json') + urlArgs, null, function (setting, json) {
                syn.Config = syn.$w.argumentsExtend(json, syn.Config);

                globalRoot.isLoadConfig = true;
                setTimeout(async function () {
                    await $webform.contentLoaded();
                });
            }, null, isAsyncLoad);
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
