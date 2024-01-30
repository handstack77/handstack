/// <reference path='syn.core.js' />
/// <reference path='syn.library.js' />

(function (context) {
    'use strict';
    var $webform = context.$webform || new syn.module();
    var document = null;
    if (globalRoot.devicePlatform === 'node') {
    }
    else {
        $webform.context = context;
        $webform.document = context.document;
        document = context.document;
    }

    $webform.extend({
        version: '1.0.0',
        localeID: 'ko-KR',
        cookiePrefixName: 'HandStack',
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
            text: '',
            dataType: 'string',
            bindingID: '',
            resourceKey: '',
            localeID: 'ko-KR',
            required: false,
            tooltip: ''
        },

        setStorage(prop, val, isLocal, ttl) {
            if (isLocal == undefined || isLocal == null) {
                isLocal = false;
            }

            if (globalRoot.devicePlatform === 'node') {
                if (isLocal == true) {
                    localStorage.setItem(prop, JSON.stringify(val));
                }
                else {
                    if (ttl == undefined || ttl == null) {
                        ttl = 1200000;
                    }

                    var now = new Date();
                    var item = {
                        value: val,
                        expiry: now.getTime() + ttl,
                        ttl: ttl
                    };
                    localStorage.setItem(prop, JSON.stringify(item));
                }
            }
            else {
                if (isLocal == true) {
                    localStorage.setItem(prop, JSON.stringify(val));
                }
                else {
                    sessionStorage.setItem(prop, JSON.stringify(val));
                }
            }

            return $webform;
        },

        getStorage(prop, isLocal) {
            var result = null;
            var val = null;

            if (isLocal == undefined || isLocal == null) {
                isLocal = false;
            }

            if (globalRoot.devicePlatform === 'node') {
                if (isLocal == true) {
                    val = localStorage.getItem(prop);
                }
                else {
                    var itemStr = localStorage.getItem(prop)
                    if (!itemStr) {
                        return null;
                    }
                    var item = JSON.parse(itemStr)
                    var now = new Date()
                    if (now.getTime() > item.expiry) {
                        localStorage.removeItem(prop);
                        return null;
                    }

                    result = item.value;

                    var ttl = item.ttl;
                    var now = new Date();
                    var item = {
                        value: result,
                        expiry: now.getTime() + ttl,
                        ttl: ttl
                    };
                    localStorage.setItem(prop, JSON.stringify(item));
                }
            }
            else {
                if (isLocal == true) {
                    result = JSON.parse(localStorage.getItem(prop));
                }
                else {
                    result = JSON.parse(sessionStorage.getItem(prop));
                }
            }

            return result;
        },

        removeStorage(prop, isLocal) {
            if (isLocal == undefined || isLocal == null) {
                isLocal = false;
            }

            if (globalRoot.devicePlatform === 'node') {
                localStorage.removeItem(prop);
            }
            else {
                if (isLocal == true) {
                    localStorage.removeItem(prop);
                }
                else {
                    sessionStorage.removeItem(prop);
                }
            }
        },

        activeControl(evt) {
            var result = null;
            evt = evt || context.event || null;
            if (evt) {
                result = evt.target || evt.srcElement || evt || null;
            }
            else {
                result = document.activeElement || null;
            }

            if (result == null) {
                if (globalRoot.$this) {
                    result = $this.context.focusControl || null;
                }
            }
            else {
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
                input.type = 'text';
                input.style.display = 'none';
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
                        BusinessTel: '',
                        BusinessEMail: '',
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
                            if (el.id && el.tagName.toUpperCase() == 'SELECT' && (el.getAttribute('syn-datafield') != null || el.getAttribute('syn-datafield') != undefined)) {
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
                            else if (el.id && el.tagName.toUpperCase() == 'SELECT' && (el.getAttribute('syn-datafield') != null || el.getAttribute('syn-datafield') != undefined)) {
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
                        else if (el.id && el.tagName.toUpperCase() == 'SELECT' && (el.getAttribute('syn-datafield') != null || el.getAttribute('syn-datafield') != undefined)) {
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

            var pageFormInit = async function () {
                var mod = context[syn.$w.pageScript];
                if (mod && mod.hook.pageFormInit) {
                    await mod.hook.pageFormInit();
                }

                if (context.domainLibraryLoad) {
                    var isContinue = domainLibraryLoad();
                    if ($object.isNullOrUndefined(isContinue) == false && isContinue === false) {
                        return false;
                    }
                }

                var synControlList = [];
                var synControls = document.querySelectorAll('[syn-datafield],[syn-options],[syn-events]');
                for (var i = 0; i < synControls.length; i++) {
                    var synControl = synControls[i];
                    if (synControl.tagName) {
                        var tagName = synControl.tagName.toUpperCase();
                        var dataField = synControl.getAttribute('syn-datafield');
                        var elementID = synControl.getAttribute('id');
                        var formDataField = synControl.closest('form') ? synControl.closest('form').getAttribute('syn-datafield') : '';
                        var controlType = '';

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

                        var controlModule = null;
                        if (syn.uicontrols) {
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
                                        controlType = synControl.getAttribute('type') == null ? 'text' : synControl.getAttribute('type').toLowerCase();
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

                        syn.$l.addEvent(synControl.id, 'focus', function (evt) {
                            $this.context.focusControl = evt.target || evt.currentTarget || evt.srcElement;
                            if ($this.context.focusControl) {
                                $this.context.tabOrderFocusID = $this.context.focusControl.id;
                            }
                            else {
                                $this.context.tabOrderFocusID = null;
                            }
                        });

                        if (controlModule) {
                            if (controlModule.addModuleList) {
                                controlModule.addModuleList(synControl, synControlList, controlOptions, controlType);
                            }

                            controlModule.controlLoad(elementID, controlOptions);
                        }
                        else {
                            if (elementID) {
                                synControlList.push({
                                    id: elementID,
                                    formDataFieldID: formDataField,
                                    field: dataField,
                                    module: null,
                                    type: controlType ? controlType : synControl.tagName.toLowerCase()
                                });
                            }

                            if ($this.hook.controlLoad) {
                                $this.hook.controlLoad(elementID, controlOptions);
                            }
                        }
                    }
                }

                var synEventControls = document.querySelectorAll('[syn-events]');
                for (var i = 0; i < synEventControls.length; i++) {
                    var synControl = synEventControls[i];
                    var events = null;

                    try {
                        events = eval('(' + synControl.getAttribute('syn-events') + ')');
                    } catch (error) {
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-events 확인 필요 '.format(synControl.id) + error.message, 'Warning');
                    }

                    if (events && $this.event) {
                        var length = events.length;
                        for (var j = 0; j < length; j++) {
                            var event = events[j];

                            var func = $this.event[synControl.id + '_' + event];
                            if (func) {
                                syn.$l.addEvent(synControl.id, event, func);
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
                        options = eval('(' + el.getAttribute('syn-options') + ')');
                    } catch (error) {
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요'.format(synControl.id) + error.message, 'Warning');
                    }

                    if (options && options.transactConfig && options.transactConfig.triggerEvent) {
                        if ($object.isString(options.transactConfig.triggerEvent) == true) {
                            syn.$l.addEvent(elID, options.transactConfig.triggerEvent, function (evt) {
                                var el = $webform.activeControl(evt);
                                var options = eval('(' + el.getAttribute('syn-options') + ')');
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
                                var el = $webform.activeControl(evt);
                                var options = eval('(' + el.getAttribute('syn-options') + ')');
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
                            syn.$l.addEvent(elID, options.triggerConfig.triggerEvent, function (triggerConfig) {
                                var el = $webform.activeControl(evt);
                                if (triggerConfig && $object.isNullOrUndefined(triggerConfig.triggerEvent) == true) {
                                    var options = eval('(' + el.getAttribute('syn-options') + ')');
                                    triggerConfig = options.triggerConfig;
                                }
                                else {
                                    var options = eval('(' + el.getAttribute('syn-options') + ')');
                                    if (options && options.triggerConfig) {
                                        triggerConfig = options.triggerConfig;
                                    }
                                }

                                if (triggerConfig) {
                                    syn.$w.triggerAction(triggerConfig);
                                }
                            });
                        }
                        else if ($object.isArray(options.triggerConfig.triggerEvent) == true) {
                            var triggerFunction = function (triggerConfig) {
                                var el = $webform.activeControl(evt);
                                if (triggerConfig && $object.isNullOrUndefined(triggerConfig.triggerEvent) == true) {
                                    var options = eval('(' + el.getAttribute('syn-options') + ')');
                                    triggerConfig = options.triggerConfig;
                                }
                                else {
                                    var options = eval('(' + el.getAttribute('syn-options') + ')');
                                    if (options && options.triggerConfig) {
                                        triggerConfig = options.triggerConfig;
                                    }
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
                    if (syn.$w.remainingReadyCount == 0) {
                        clearInterval(syn.$w.remainingReadyIntervalID);
                        syn.$w.remainingReadyIntervalID = null;

                        pageLoad();
                        syn.$w.isPageLoad = true;
                    }
                }, 25);

                setTimeout(function () {
                    if (syn.$w.remainingReadyIntervalID != null) {
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
                context['$this'] = mod;

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
                    await pageFormInit();
                }
            }
            else {
                pageLoad();
                syn.$w.isPageLoad = true;
            }
        },

        addReadyCount() {
            if (syn.$w.eventAddReady && syn.$w.isPageLoad == false) {
                document.dispatchEvent(syn.$w.eventAddReady);
            }
        },

        removeReadyCount() {
            if (syn.$w.eventRemoveReady && syn.$w.isPageLoad == false) {
                document.dispatchEvent(syn.$w.eventRemoveReady);
            }
        },

        createSelection(el, start, end) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if (el.createTextRange) {
                var newend = end - start;
                var selRange = el.createTextRange();
                selRange.collapse(true);
                selRange.moveStart('character', start);
                selRange.moveEnd('character', newend);
                selRange.select();
                newend = null;
                selRange = null;
            }
            else if (el.type != 'email' && el.setSelectionRange) {
                el.setSelectionRange(start, end);
            }

            el.focus();
        },

        argumentsExtend() {
            var extended = {};

            for (var key in arguments) {
                var argument = arguments[key];
                for (var prop in argument) {
                    if (Object.prototype.hasOwnProperty.call(argument, prop)) {
                        extended[prop] = argument[prop];
                    }
                }
            }

            return extended;
        },

        loadJson(url, setting, success, callback, async, isForceCallback) {
            if (async == undefined || async == null) {
                async = true;
            }

            if (isForceCallback == undefined || isForceCallback == null) {
                isForceCallback = false;
            }

            var xhr = new XMLHttpRequest();
            if (async === true) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            if (success) {
                                success(setting, JSON.parse(xhr.responseText));
                            }

                            if (callback) {
                                callback();
                            }
                        }
                        else {
                            syn.$l.eventLog('$w.loadJson', 'async url: ' + url + ', status: ' + xhr.status.toString() + ', responseText: ' + xhr.responseText, 'Error');
                        }

                        if (xhr.status !== 200 && callback && isForceCallback == true) {
                            callback();
                        }
                    }
                };
                xhr.open('GET', url, true);

                if (syn.$w.setServiceClientHeader) {
                    if (syn.$w.setServiceClientHeader(xhr) == false) {
                        return;
                    }
                }

                xhr.send();
            }
            else {
                xhr.open('GET', url, false);

                if (syn.$w.setServiceClientHeader) {
                    if (syn.$w.setServiceClientHeader(xhr) == false) {
                        return;
                    }
                }

                xhr.send();

                if (xhr.status === 200) {
                    if (success) {
                        success(setting, JSON.parse(xhr.responseText));
                    }

                    if (callback) {
                        callback();
                    }
                }
                else {
                    syn.$l.eventLog('$w.loadJson', 'sync url: ' + url + ', status: ' + xhr.status.toString() + ', responseText: ' + xhr.responseText, 'Error');
                }

                if (callback && isForceCallback == true) {
                    callback();
                }
            }
        },

        getTriggerOptions(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            return JSON.parse(el.getAttribute('triggerOptions'));
        },

        triggerAction(triggerConfig) {
            if ($this) {
                var isContinue = true;

                var defaultParams = {
                    args: [],
                    options: {}
                };

                triggerConfig.params = syn.$w.argumentsExtend(defaultParams, triggerConfig.params);

                if ($this.hook.beforeTrigger) {
                    isContinue = $this.hook.beforeTrigger(triggerConfig.triggerID, triggerConfig.action, triggerConfig.params);
                }

                if ($object.isNullOrUndefined(isContinue) == true || isContinue == true) {
                    var el = syn.$l.get(triggerConfig.triggerID);
                    var triggerResult = null;
                    var trigger = null;

                    if (triggerConfig.action && triggerConfig.action.startsWith('syn.uicontrols.$') == true) {
                        trigger = syn.uicontrols;
                        var currings = triggerConfig.action.split('.');
                        if (currings.length > 3) {
                            for (var i = 2; i < currings.length; i++) {
                                var curring = currings[i];
                                if (trigger) {
                                    trigger = trigger[curring];
                                }
                                else {
                                    trigger = context[curring];
                                }
                            }
                        }
                        else {
                            trigger = context[triggerConfig.action];
                        }
                    }
                    else {
                        trigger = $this.event ? $this.event['{0}_{1}'.format(triggerConfig.triggerID, triggerConfig.action)] : null;
                    }

                    if (trigger) {
                        el.setAttribute('triggerOptions', JSON.stringify(triggerConfig.params.options));

                        if (triggerConfig.action.indexOf('$') > -1) {
                            $array.addAt(triggerConfig.params.args, 0, triggerConfig.triggerID);
                        }

                        triggerResult = trigger.apply(el, triggerConfig.params.args);
                        if ($this.hook.afterTrigger) {
                            $this.hook.afterTrigger(null, triggerConfig.action, {
                                elID: triggerConfig.triggerID,
                                result: triggerResult
                            });
                        }
                    }
                    else {
                        if ($this.hook.afterTrigger) {
                            $this.hook.afterTrigger('{0} trigger 확인 필요'.format(triggerConfig.action), triggerConfig.action, null);
                        }
                    }
                }
                else {
                    if ($this.hook.afterTrigger) {
                        $this.hook.afterTrigger('hook.beforeTrigger continue false', triggerConfig.action, null);
                    }
                }
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

                    var transactions = $this.config.transactions;
                    for (var i = 0; i < transactions.length; i++) {
                        if (transactConfig.functionID == transactions[i].functionID) {
                            transactions.splice(i, 1);
                            break;
                        }
                    }

                    var synControlList = $this.context.synControls;
                    var transactionObject = {};
                    transactionObject.functionID = transactConfig.functionID;
                    transactionObject.transactionResult = $object.isNullOrUndefined(transactConfig.transactionResult) == true ? true : transactConfig.transactionResult === true;
                    transactionObject.inputs = [];
                    transactionObject.outputs = [];

                    if (transactConfig.inputs) {
                        var inputs = transactConfig.inputs;
                        var inputsLength = inputs.length;
                        for (var i = 0; i < inputsLength; i++) {
                            var inputConfig = inputs[i];
                            var input = {
                                requestType: inputConfig.type,
                                dataFieldID: inputConfig.dataFieldID ? inputConfig.dataFieldID : document.forms.length > 0 ? document.forms[0].getAttribute('syn-datafield') : '',
                                items: {}
                            };

                            var synControlConfigs = null;
                            if (inputConfig.type == 'Row') {
                                var synControlConfigs = synControlList.filter(function (item) {
                                    return item.formDataFieldID == input.dataFieldID && ['grid', 'chart', 'chartjs'].indexOf(item.type) == -1;
                                });

                                if (synControlConfigs && synControlConfigs.length > 0) {
                                    for (var k = 0; k < synControlConfigs.length; k++) {
                                        var synControlConfig = synControlConfigs[k];

                                        var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        var options = el.getAttribute('syn-options');
                                        if (options == null) {
                                            continue;
                                        }

                                        var synOptions = null;

                                        try {
                                            synOptions = JSON.parse(options);
                                        } catch (e) {
                                            synOptions = eval('(' + options + ')');
                                        }

                                        if (synOptions == null || synControlConfig.field == '') {
                                            continue;
                                        }

                                        var isBelong = false;
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
                                    var synControlConfigs = synControlList.filter(function (item) {
                                        return item.field == input.dataFieldID && item.type == 'grid';
                                    });

                                    if (synControlConfigs && synControlConfigs.length > 0) {
                                        for (var k = 0; k < synControlConfigs.length; k++) {
                                            var synControlConfig = synControlConfigs[k];

                                            var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                            var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                            if (synOptions == null) {
                                                continue;
                                            }

                                            for (var l = 0; l < synOptions.columns.length; l++) {
                                                var column = synOptions.columns[l];
                                                var dataType = 'string'
                                                switch (column.columnType) {
                                                    case 'checkbox':
                                                        dataType = 'bool';
                                                        break;
                                                    case 'numeric':
                                                        dataType = 'int';
                                                        break;
                                                    case 'date':
                                                        dataType = 'date';
                                                        break;
                                                }

                                                var isBelong = false;
                                                if (column.data == 'Flag') {
                                                    isBelong = true;
                                                }
                                                else if (column.belongID) {
                                                    if ($object.isString(column.belongID) == true) {
                                                        isBelong = transactConfig.functionID == column.belongID;
                                                    }
                                                    else if ($object.isArray(column.belongID) == true) {
                                                        isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                                                    }
                                                }

                                                if (isBelong == true) {
                                                    input.items[column.data] = {
                                                        fieldID: column.data,
                                                        dataType: dataType
                                                    };
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == input.dataFieldID) {
                                                    for (var l = 0; l < store.columns.length; l++) {
                                                        var column = store.columns[l];
                                                        var isBelong = false;
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
                                var synControlConfigs = synControlList.filter(function (item) {
                                    return item.field == input.dataFieldID && item.type == 'grid';
                                });

                                if (synControlConfigs && synControlConfigs.length == 1) {
                                    var synControlConfig = synControlConfigs[0];

                                    var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                    var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                    if (synOptions == null) {
                                        continue;
                                    }

                                    for (var k = 0; k < synOptions.columns.length; k++) {
                                        var column = synOptions.columns[k];
                                        var dataType = 'string'
                                        switch (column.columnType) {
                                            case 'checkbox':
                                                dataType = 'bool';
                                                break;
                                            case 'numeric':
                                                dataType = 'int';
                                                break;
                                            case 'date':
                                                dataType = 'date';
                                                break;
                                        }

                                        var isBelong = false;
                                        if (column.data == 'Flag') {
                                            isBelong = true;
                                        }
                                        else if (column.belongID) {
                                            if ($object.isString(column.belongID) == true) {
                                                isBelong = transactConfig.functionID == column.belongID;
                                            }
                                            else if ($object.isArray(column.belongID) == true) {
                                                isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                                            }
                                        }

                                        if (isBelong == true) {
                                            input.items[column.data] = {
                                                fieldID: column.data,
                                                dataType: dataType
                                            };
                                        }
                                    }
                                }
                                else {
                                    var isMapping = false;
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                            var store = syn.uicontrols.$data.storeList[k];
                                            if (store.storeType == 'Grid' && store.dataSourceID == input.dataFieldID) {
                                                isMapping = true;
                                                for (var l = 0; l < store.columns.length; l++) {
                                                    var column = store.columns[l];
                                                    var isBelong = false;
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

                                    if (isMapping == false) {
                                        syn.$l.eventLog('$w.tryAddFunction', '{0} 컬럼 ID 중복 또는 존재여부 확인 필요'.format(input.dataFieldID), 'Warning');
                                    }
                                }
                            }

                            transactionObject.inputs.push(input);
                        }
                    }

                    if (transactConfig.outputs) {
                        var outputs = transactConfig.outputs;
                        var outputsLength = outputs.length;
                        var synControls = $this.context.synControls;
                        for (var i = 0; i < outputsLength; i++) {
                            var outputConfig = outputs[i];
                            var output = {
                                responseType: outputConfig.type,
                                dataFieldID: outputConfig.dataFieldID ? outputConfig.dataFieldID : '',
                                items: {}
                            };

                            var synControlConfigs = null;
                            if (outputConfig.type == 'Form') {
                                var synControlConfigs = synControlList.filter(function (item) {
                                    return item.formDataFieldID == output.dataFieldID && ['grid', 'chart', 'chartjs'].indexOf(item.type) == -1;
                                });

                                if (synControlConfigs && synControlConfigs.length > 0) {
                                    for (var k = 0; k < synControlConfigs.length; k++) {
                                        var synControlConfig = synControlConfigs[k];

                                        var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        var options = el.getAttribute('syn-options');
                                        if (options == null) {
                                            continue;
                                        }

                                        var synOptions = null;

                                        try {
                                            synOptions = JSON.parse(options);
                                        } catch (e) {
                                            synOptions = eval('(' + options + ')');
                                        }

                                        if (synOptions == null || synControlConfig.field == '') {
                                            continue;
                                        }

                                        output.items[synControlConfig.field] = {
                                            fieldID: synControlConfig.field,
                                            dataType: synOptions.dataType
                                        };

                                        if (outputConfig.clear == true) {
                                            if (synControls && synControls.length == 1) {
                                                var bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == outputConfig.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    var controlInfo = bindingControlInfos[0];
                                                    if (controlInfo.module == null) {
                                                        continue;
                                                    }

                                                    var controlID = controlInfo.id;
                                                    var controlField = controlInfo.field;
                                                    var controlModule = null;
                                                    var currings = controlInfo.module.split('.');
                                                    if (currings.length > 0) {
                                                        for (var l = 0; l < currings.length; l++) {
                                                            var curring = currings[l];
                                                            if (controlModule) {
                                                                controlModule = controlModule[curring];
                                                            }
                                                            else {
                                                                controlModule = context[curring];
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        controlModule = context[controlInfo.module];
                                                    }

                                                    if (controlModule.clear) {
                                                        controlModule.clear(controlID);
                                                    }
                                                }
                                                else {
                                                    syn.$l.eventLog('$w.tryAddFunction Form', '{0} dataFieldID 중복 또는 존재여부 확인 필요'.format(outputConfig.dataFieldID), 'Warning');
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                            var store = syn.uicontrols.$data.storeList[k];
                                            if (store.storeType == 'Form' && store.dataSourceID == output.dataFieldID) {
                                                for (var l = 0; l < store.columns.length; l++) {
                                                    var column = store.columns[l];

                                                    output.items[column.data] = {
                                                        fieldID: column.data,
                                                        dataType: column.dataType || 'string'
                                                    };
                                                }

                                                if (outputConfig.clear == true) {
                                                    var dataStore = $this.store[store.dataSourceID];
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
                                var synControlConfigs = synControlList.filter(function (item) {
                                    return item.field == output.dataFieldID && item.type == 'grid';
                                });

                                if (synControlConfigs && synControlConfigs.length == 1) {
                                    var synControlConfig = synControlConfigs[0];

                                    var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                    var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                    if (synOptions == null) {
                                        continue;
                                    }

                                    for (var k = 0; k < synOptions.columns.length; k++) {
                                        var column = synOptions.columns[k];
                                        var dataType = 'string'
                                        switch (column.type) {
                                            case 'checkbox':
                                                dataType = 'bool';
                                                break;
                                            case 'numeric':
                                                dataType = 'int';
                                                break;
                                            case 'date':
                                                dataType = 'date';
                                                break;
                                        }

                                        output.items[column.data] = {
                                            fieldID: column.data,
                                            dataType: dataType
                                        };
                                    }

                                    if (outputConfig.clear == true) {
                                        if (synControls && synControls.length > 0) {
                                            var bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == output.dataFieldID;
                                            });

                                            var controlInfo = bindingControlInfos[0];
                                            var controlModule = null;
                                            var currings = controlInfo.module.split('.');
                                            if (currings.length > 0) {
                                                for (var l = 0; l < currings.length; l++) {
                                                    var curring = currings[l];
                                                    if (controlModule) {
                                                        controlModule = controlModule[curring];
                                                    }
                                                    else {
                                                        controlModule = context[curring];
                                                    }
                                                }
                                            }
                                            else {
                                                controlModule = context[controlInfo.module];
                                            }

                                            if (controlModule.clear) {
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
                                        var synControlConfig = synControlConfigs[0];

                                        var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                        if (synOptions == null) {
                                            continue;
                                        }

                                        for (var k = 0; k < synOptions.series.length; k++) {
                                            var column = synOptions.series[k];
                                            output.items[column.columnID] = {
                                                fieldID: column.columnID,
                                                dataType: column.dataType ? column.dataType : 'string'
                                            };
                                        }

                                        if (outputConfig.clear == true) {
                                            if (synControls && synControls.length == 1) {
                                                var bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == outputConfig.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    var controlInfo = bindingControlInfos[0];
                                                    if (controlInfo.module == null) {
                                                        continue;
                                                    }

                                                    var controlID = controlInfo.id;
                                                    var controlField = controlInfo.field;
                                                    var controlModule = null;
                                                    var currings = controlInfo.module.split('.');
                                                    if (currings.length > 0) {
                                                        for (var l = 0; l < currings.length; l++) {
                                                            var curring = currings[l];
                                                            if (controlModule) {
                                                                controlModule = controlModule[curring];
                                                            }
                                                            else {
                                                                controlModule = context[curring];
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        controlModule = context[controlInfo.module];
                                                    }

                                                    if (controlModule.clear) {
                                                        controlModule.clear(controlID);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        var isMapping = false;
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == output.dataFieldID) {
                                                    isMapping = true;

                                                    for (var l = 0; l < store.columns.length; l++) {
                                                        var column = store.columns[l];

                                                        output.items[column.data] = {
                                                            fieldID: column.data,
                                                            dataType: column.dataType || 'string'
                                                        };
                                                    }

                                                    if (outputConfig.clear == true) {
                                                        var dataStore = $this.store[store.dataSourceID];
                                                        if (dataStore) {
                                                            dataStore.length = 0;
                                                        }
                                                    }

                                                    break;
                                                }
                                            }
                                        }

                                        if (isMapping == false) {
                                            syn.$l.eventLog('$w.tryAddFunction Grid', '{0} dataFieldID 중복 또는 존재여부 확인 필요'.format(output.dataFieldID), 'Warning');
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

        transactionAction(transactConfig, options) {
            if ($object.isString(transactConfig) == true) {
                var functionID = transactConfig;
                transactConfig = $this.transaction[transactConfig];

                if ($object.isNullOrUndefined(transactConfig) == true) {
                    syn.$l.eventLog('$w.transactionAction', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
                    return;
                }

                if ($string.isNullOrEmpty(transactConfig.functionID) == true) {
                    transactConfig.functionID = functionID;
                }
            }

            if (transactConfig && $this && $this.config) {
                if ($object.isNullOrUndefined(transactConfig.noProgress) == true) {
                    transactConfig.noProgress = false;
                }

                if (syn.$w.progressMessage && transactConfig.noProgress == false) {
                    syn.$w.progressMessage($resource.translations.progress);
                }

                try {
                    if ($object.isNullOrUndefined($this.config.transactions) == true) {
                        $this.config.transactions = [];
                    }

                    var isContinue = true;
                    if ($this.hook.beforeTransaction) {
                        isContinue = $this.hook.beforeTransaction(transactConfig);
                    }

                    if ($object.isNullOrUndefined(isContinue) == true || isContinue == true) {
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

                        syn.$w.tryAddFunction(transactConfig);
                        syn.$w.transaction(transactConfig.functionID, function (result, addtionalData, correlationID) {
                            var error = null;
                            if (result && result.errorText.length > 0) {
                                error = result.errorText[0];
                                syn.$l.eventLog('$w.transaction.callback', error, 'Error');
                            }

                            var callbackResult = null;
                            if (transactConfig.callback && $object.isFunction(transactConfig.callback) == true) {
                                callbackResult = transactConfig.callback(error, result, addtionalData, correlationID);
                            }

                            if (callbackResult == null || callbackResult === true) {
                                if ($this.hook.afterTransaction) {
                                    $this.hook.afterTransaction(null, transactConfig.functionID, result, addtionalData, correlationID);
                                }
                            }
                            else if (callbackResult === false) {
                                if ($this.hook.afterTransaction) {
                                    $this.hook.afterTransaction('callbackResult continue false', transactConfig.functionID, null, null, correlationID);
                                }
                            }

                            if (transactConfig.callback && $object.isArray(transactConfig.callback) == true) {
                                setTimeout(function () {
                                    var eventData = {
                                        error: error,
                                        result: result,
                                        addtionalData: addtionalData,
                                        correlationID: correlationID
                                    }
                                    syn.$l.trigger(transactConfig.callback[0], transactConfig.callback[1], eventData);
                                });
                            }
                        }, options);
                    }
                    else {
                        if (syn.$w.closeProgressMessage) {
                            syn.$w.closeProgressMessage();
                        }

                        if ($this.hook.afterTransaction) {
                            $this.hook.afterTransaction('beforeTransaction continue false', transactConfig.functionID, null, null);
                        }
                    }
                } catch (error) {
                    syn.$l.eventLog('$w.transactionAction', error, 'Error');

                    if (syn.$w.closeProgressMessage) {
                        syn.$w.closeProgressMessage();
                    }
                }
            }
            else {
                syn.$l.eventLog('$w.transactionAction', '{0} 거래 ID 또는 설정 확인 필요'.format(transactConfig), 'Warning');
            }
        },

        /*
        var directObject = {
            programID: 'SVU',
            businessID: 'ZZW',
            systemID: 'BP01',
            transactionID: 'ZZA010',
            functionID: 'L01',
            dataMapInterface: 'Row|Form',
            transactionResult: true,
            inputObjects: [
                { prop: 'ApplicationID', val: '' },
                { prop: 'ProjectID', val: '' },
                { prop: 'TransactionID', val: '' }
            ]
        };

        syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
            debugger;
        });
        */
        transactionDirect(directObject, callback, options) {
            directObject.transactionResult = $object.isNullOrUndefined(directObject.transactionResult) == true ? true : directObject.transactionResult === true;
            directObject.systemID = directObject.systemID || $this.config.systemID;

            var transactionObject = syn.$w.transactionObject(directObject.functionID, 'Json');

            transactionObject.programID = directObject.programID;
            transactionObject.businessID = directObject.businessID;
            transactionObject.systemID = directObject.systemID;
            transactionObject.transactionID = directObject.transactionID;
            transactionObject.dataMapInterface = directObject.dataMapInterface || 'Row|Form';
            transactionObject.transactionResult = $object.isNullOrUndefined(directObject.transactionResult) == true ? true : directObject.transactionResult === true;

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
            transactionObject.options = options;

            if (globalRoot.devicePlatform === 'node') {
                transactionObject.screenID = directObject.screenID || directObject.transactionID;
            }
            else {
                transactionObject.screenID = syn.$w.pageScript.replace('$', '');
            }
            transactionObject.startTraceID = directObject.startTraceID || options.startTraceID || '';

            if (directObject.inputLists && directObject.inputLists.length > 0) {
                for (var key in directObject.inputLists) {
                    transactionObject.inputs.push(directObject.inputLists[key]);
                }
                transactionObject.inputsItemCount.push(directObject.inputLists.length);
            }
            else {
                transactionObject.inputs.push(directObject.inputObjects);
                transactionObject.inputsItemCount.push(1);
            }

            syn.$w.executeTransaction(directObject, transactionObject, function (responseData, addtionalData) {
                if (callback) {
                    callback(responseData, addtionalData);
                }
            });
        },

        transaction(functionID, callback, options) {
            var errorText = '';
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

                var result = {
                    errorText: [],
                    outputStat: []
                };

                if ($this && $this.config && $this.config.transactions) {
                    var transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        var transaction = transactions[0];
                        var transactionObject = syn.$w.transactionObject(transaction.functionID, 'Json');

                        transactionObject.programID = $this.config.programID;
                        transactionObject.businessID = $this.config.businessID;
                        transactionObject.systemID = $this.config.systemID;
                        transactionObject.transactionID = $this.config.transactionID;
                        transactionObject.screenID = syn.$w.pageScript.replace('$', '');
                        transactionObject.startTraceID = options.startTraceID || '';
                        transactionObject.options = options;

                        // synControls 컨트롤 목록
                        var synControls = $this.context.synControls;

                        // Input Mapping
                        var inputLength = transaction.inputs.length;
                        for (var inputIndex = 0; inputIndex < inputLength; inputIndex++) {
                            var inputMapping = transaction.inputs[inputIndex];
                            var inputObjects = [];

                            if (inputMapping.requestType == 'Row') {
                                var bindingControlInfos = synControls.filter(function (item) {
                                    return item.field == inputMapping.dataFieldID;
                                });

                                if (bindingControlInfos.length == 1) {
                                    var controlInfo = bindingControlInfos[0];

                                    if (['grid', 'chart'].indexOf(controlInfo.type) > -1) {
                                        var dataFieldID = inputMapping.dataFieldID; // syn-datafield

                                        var controlValue = '';
                                        if (synControls && synControls.length > 0) {
                                            bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                var controlInfo = bindingControlInfos[0];
                                                var controlModule = null;
                                                var currings = controlInfo.module.split('.');
                                                if (currings.length > 0) {
                                                    for (var i = 0; i < currings.length; i++) {
                                                        var curring = currings[i];
                                                        if (controlModule) {
                                                            controlModule = controlModule[curring];
                                                        }
                                                        else {
                                                            controlModule = context[curring];
                                                        }
                                                    }
                                                }
                                                else {
                                                    controlModule = context[controlInfo.module];
                                                }

                                                var el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                                var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                                for (var k = 0; k < synOptions.columns.length; k++) {
                                                    var column = synOptions.columns[k];
                                                    if (column.validators && $validation.transactionValidate) {
                                                        column.controlText = synOptions.controlText || '';
                                                        var isValidate = $validation.transactionValidate(controlModule, controlInfo, column, inputMapping.requestType);

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

                                                inputObjects = controlModule.getValue(controlInfo.id, 'Row', inputMapping.items)[0];
                                            }
                                            else {
                                                syn.$l.eventLog('$w.transaction', '"{0}" Row List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                    else {
                                        for (var key in inputMapping.items) {
                                            var meta = inputMapping.items[key];
                                            var dataFieldID = key; // syn-datafield
                                            var fieldID = meta.fieldID; // DbColumnID
                                            var dataType = meta.dataType;
                                            var serviceObject = { prop: fieldID, val: '' };

                                            var controlValue = '';
                                            if (synControls.length > 0) {
                                                bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == dataFieldID && item.formDataFieldID == inputMapping.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    var controlInfo = bindingControlInfos[0];
                                                    if ($object.isNullOrUndefined(controlInfo.module) == true) {
                                                        controlValue = syn.$l.get(controlInfo.id).value;
                                                    }
                                                    else {
                                                        var controlModule = null;
                                                        var currings = controlInfo.module.split('.');
                                                        if (currings.length > 0) {
                                                            for (var i = 0; i < currings.length; i++) {
                                                                var curring = currings[i];
                                                                if (controlModule) {
                                                                    controlModule = controlModule[curring];
                                                                }
                                                                else {
                                                                    controlModule = context[curring];
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            controlModule = context[controlInfo.module];
                                                        }

                                                        var el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                                        var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                                        if (synOptions.validators && $validation.transactionValidate) {
                                                            var isValidate = $validation.transactionValidate(controlModule, controlInfo, synOptions, inputMapping.requestType);

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

                                                        controlValue = controlModule.getValue(controlInfo.id, meta);

                                                        if ($object.isNullOrUndefined(controlValue) == true && dataType == 'int') {
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
                                        for (var key in inputMapping.items) {
                                            var isMapping = false;
                                            var meta = inputMapping.items[key];
                                            var dataFieldID = key; // syn-datafield
                                            var fieldID = meta.fieldID; // DbColumnID
                                            var dataType = meta.dataType;
                                            var serviceObject = { prop: fieldID, val: '' };

                                            var controlValue = '';
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == inputMapping.dataFieldID) {
                                                    isMapping = true;
                                                    bindingControlInfos = store.columns.filter(function (item) {
                                                        return item.data == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        var controlInfo = bindingControlInfos[0];
                                                        controlValue = $this.store[store.dataSourceID][controlInfo.data];

                                                        if (!controlValue && dataType == 'int') {
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

                                transactionObject.inputs.push(inputObjects); // transactionObject.inputs.push($object.clone(inputObjects));
                                transactionObject.inputsItemCount.push(1);
                            }
                            else if (inputMapping.requestType == 'List') {
                                var dataFieldID = inputMapping.dataFieldID; // syn-datafield

                                var controlValue = '';
                                if (synControls && synControls.length > 0) {
                                    var bindingControlInfos = synControls.filter(function (item) {
                                        return item.field == dataFieldID;
                                    });

                                    if (bindingControlInfos.length == 1) {
                                        var controlInfo = bindingControlInfos[0];
                                        var controlModule = null;
                                        var currings = controlInfo.module.split('.');
                                        if (currings.length > 0) {
                                            for (var i = 0; i < currings.length; i++) {
                                                var curring = currings[i];
                                                if (controlModule) {
                                                    controlModule = controlModule[curring];
                                                }
                                                else {
                                                    controlModule = context[curring];
                                                }
                                            }
                                        }
                                        else {
                                            controlModule = context[controlInfo.module];
                                        }

                                        var el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                        var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                        for (var k = 0; k < synOptions.columns.length; k++) {
                                            var column = synOptions.columns[k];
                                            column.controlText = synOptions.controlText || '';
                                            if (column.validators && $validation.transactionValidate) {
                                                var isValidate = $validation.transactionValidate(controlModule, controlInfo, column, inputMapping.requestType);

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

                                        inputObjects = controlModule.getValue(controlInfo.id, 'List', inputMapping.items);
                                    }
                                    else {
                                        var isMapping = false;
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == dataFieldID) {
                                                    isMapping = true;
                                                    var bindingInfo = syn.uicontrols.$data.bindingList.find(function (item) {
                                                        return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                    });

                                                    if (bindingInfo) {
                                                        inputObjects = $this.store[store.dataSourceID][bindingInfo.dataFieldID];
                                                    }
                                                    else {
                                                        var controlValue = [];
                                                        var items = $this.store[store.dataSourceID];
                                                        var length = items.length;
                                                        for (var i = 0; i < length; i++) {
                                                            var item = items[i];

                                                            var row = [];
                                                            for (var key in item) {
                                                                var serviceObject = { prop: key, val: item[key] };
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

                                for (var key in inputObjects) {
                                    transactionObject.inputs.push(inputObjects[key]);
                                }
                                transactionObject.inputsItemCount.push(inputObjects.length);
                            }
                        }

                        syn.$w.executeTransaction($this.config, transactionObject, function (responseData, addtionalData, correlationID) {
                            var isDynamicOutput = false;
                            for (var i = 0; i < transaction.outputs.length; i++) {
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
                                    // synControls 컨트롤 목록
                                    var synControls = $this.context.synControls;

                                    // Output Mapping을 설정
                                    var outputLength = transaction.outputs.length;
                                    for (var outputIndex = 0; outputIndex < outputLength; outputIndex++) {
                                        var outputMapping = transaction.outputs[outputIndex];
                                        var dataMapItem = responseData[outputIndex];
                                        var responseFieldID = dataMapItem['id'];
                                        var outputData = dataMapItem['value'];

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

                                                for (var key in outputMapping.items) {
                                                    var meta = outputMapping.items[key];
                                                    var dataFieldID = key; // syn-datafield
                                                    var fieldID = meta.fieldID; // DbColumnID

                                                    var controlValue = outputData[fieldID];
                                                    if (controlValue != undefined && synControls && synControls.length > 0) {
                                                        var bindingControlInfos = synControls.filter(function (item) {
                                                            return item.field == dataFieldID && item.formDataFieldID == outputMapping.dataFieldID;
                                                        });

                                                        if (bindingControlInfos.length == 1) {
                                                            var controlInfo = bindingControlInfos[0];
                                                            var controlModule = null;
                                                            var currings = controlInfo.module.split('.');
                                                            if (currings.length > 0) {
                                                                for (var i = 0; i < currings.length; i++) {
                                                                    var curring = currings[i];
                                                                    if (controlModule) {
                                                                        controlModule = controlModule[curring];
                                                                    }
                                                                    else {
                                                                        controlModule = context[curring];
                                                                    }
                                                                }
                                                            }
                                                            else {
                                                                controlModule = context[controlInfo.module];
                                                            }

                                                            controlModule.setValue(controlInfo.id, controlValue, meta);
                                                        }
                                                        else {
                                                            var isMapping = false;
                                                            if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                                for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                                    var store = syn.uicontrols.$data.storeList[k];
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
                                            if (outputData.length && outputData.length > 0) {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: outputData.length
                                                });
                                                var dataFieldID = outputMapping.dataFieldID; // syn-datafield
                                                if (synControls && synControls.length > 0) {
                                                    var bindingControlInfos = synControls.filter(function (item) {
                                                        return item.field == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        var controlInfo = bindingControlInfos[0];
                                                        var controlModule = null;
                                                        var currings = controlInfo.module.split('.');
                                                        if (currings.length > 0) {
                                                            for (var i = 0; i < currings.length; i++) {
                                                                var curring = currings[i];
                                                                if (controlModule) {
                                                                    controlModule = controlModule[curring];
                                                                }
                                                                else {
                                                                    controlModule = context[curring];
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            controlModule = context[controlInfo.module];
                                                        }

                                                        controlModule.setValue(controlInfo.id, outputData, outputMapping.items);
                                                    }
                                                    else {
                                                        var isMapping = false;
                                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                                var store = syn.uicontrols.$data.storeList[k];
                                                                if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                                    $this.store[store.dataSourceID] = [];
                                                                }

                                                                if (store.storeType == 'Grid' && store.dataSourceID == outputMapping.dataFieldID) {
                                                                    isMapping = true;
                                                                    var bindingInfos = syn.uicontrols.$data.bindingList.filter(function (item) {
                                                                        return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                                    });

                                                                    var length = outputData.length;
                                                                    for (var i = 0; i < length; i++) {
                                                                        outputData[i].Flag = 'R';
                                                                    }

                                                                    if (bindingInfos.length > 0) {
                                                                        for (var binding_i = 0; binding_i < bindingInfos.length; binding_i++) {
                                                                            var bindingInfo = bindingInfos[binding_i];
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
                                            else {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: 0
                                                });
                                            }
                                        }
                                        else if (outputMapping.responseType == 'Chart') {
                                            if (outputData.length && outputData.length > 0) {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: outputData.length
                                                });
                                                var dataFieldID = outputMapping.dataFieldID; // syn-datafield

                                                if (synControls && synControls.length > 0) {
                                                    var bindingControlInfos = synControls.filter(function (item) {
                                                        return item.field == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        var controlInfo = bindingControlInfos[0];
                                                        var controlModule = null;
                                                        var currings = controlInfo.module.split('.');
                                                        if (currings.length > 0) {
                                                            for (var i = 0; i < currings.length; i++) {
                                                                var curring = currings[i];
                                                                if (controlModule) {
                                                                    controlModule = controlModule[curring];
                                                                }
                                                                else {
                                                                    controlModule = context[curring];
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            controlModule = context[controlInfo.module];
                                                        }

                                                        controlModule.setValue(controlInfo.id, outputData, outputMapping.items);
                                                    }
                                                    else {
                                                        errorText = '"{0}" Chart Output Mapping 확인 필요'.format(dataFieldID);
                                                        result.errorText.push(errorText);
                                                        syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                    }
                                                }
                                            }
                                            else {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: 0
                                                });
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
                var transactConfig = $this.transaction[functionID];
                if ($object.isNullOrUndefined(transactConfig) == true) {
                    syn.$l.eventLog('$w.setterValue', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
                    return;
                }

                if ($string.isNullOrEmpty(transactConfig.functionID) == true) {
                    transactConfig.functionID = functionID;
                }

                syn.$w.tryAddFunction(transactConfig);

                var errorText = '';
                var result = {
                    errors: [],
                    inputs: [],
                };

                if ($this && $this.config && $this.config.transactions) {
                    var transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        var transaction = transactions[0];

                        var synControls = context[syn.$w.pageScript].context.synControls;

                        var inputLength = transaction.inputs.length;
                        for (var inputIndex = 0; inputIndex < inputLength; inputIndex++) {
                            var inputMapping = transaction.inputs[inputIndex];
                            var inputObjects = [];

                            if (inputMapping.requestType == 'Row') {
                                var bindingControlInfos = synControls.filter(function (item) {
                                    return item.field == inputMapping.dataFieldID;
                                });

                                if (bindingControlInfos.length == 1) {
                                    var controlInfo = bindingControlInfos[0];

                                    if (['grid', 'chart'].indexOf(controlInfo.type) > -1) {
                                        var dataFieldID = inputMapping.dataFieldID;

                                        var controlValue = '';
                                        if (synControls && synControls.length > 0) {
                                            bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                var controlInfo = bindingControlInfos[0];
                                                var controlModule = null;
                                                var currings = controlInfo.module.split('.');
                                                if (currings.length > 0) {
                                                    for (var i = 0; i < currings.length; i++) {
                                                        var curring = currings[i];
                                                        if (controlModule) {
                                                            controlModule = controlModule[curring];
                                                        }
                                                        else {
                                                            controlModule = context[curring];
                                                        }
                                                    }
                                                }
                                                else {
                                                    controlModule = context[controlInfo.module];
                                                }

                                                inputObjects = controlModule.getValue(controlInfo.id, 'Row', inputMapping.items)[0];
                                            }
                                            else {
                                                syn.$l.eventLog('$w.getterValue', '"{0}" Row List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                    else {
                                        for (var key in inputMapping.items) {
                                            var meta = inputMapping.items[key];
                                            var dataFieldID = key;
                                            var fieldID = meta.fieldID;
                                            var dataType = meta.dataType;
                                            var serviceObject = { prop: fieldID, val: '' };

                                            var controlValue = '';
                                            if (synControls.length > 0) {
                                                bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == dataFieldID && item.formDataFieldID == inputMapping.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    var controlInfo = bindingControlInfos[0];
                                                    var controlModule = null;
                                                    var currings = controlInfo.module.split('.');
                                                    if (currings.length > 0) {
                                                        for (var i = 0; i < currings.length; i++) {
                                                            var curring = currings[i];
                                                            if (controlModule) {
                                                                controlModule = controlModule[curring];
                                                            }
                                                            else {
                                                                controlModule = context[curring];
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        controlModule = context[controlInfo.module];
                                                    }

                                                    controlValue = controlModule.getValue(controlInfo.id, meta);

                                                    if (!controlValue && dataType == 'int') {
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
                                        for (var key in inputMapping.items) {
                                            var isMapping = false;
                                            var meta = inputMapping.items[key];
                                            var dataFieldID = key;
                                            var fieldID = meta.fieldID;
                                            var dataType = meta.dataType;
                                            var serviceObject = { prop: fieldID, val: '' };

                                            var controlValue = '';
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == inputMapping.dataFieldID) {
                                                    isMapping = true;
                                                    bindingControlInfos = store.columns.filter(function (item) {
                                                        return item.data == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        var controlInfo = bindingControlInfos[0];
                                                        controlValue = $this.store[store.dataSourceID][controlInfo.data];

                                                        if (!controlValue && dataType == 'int') {
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

                                var input = {};
                                for (var i = 0; i < inputObjects.length; i++) {
                                    var inputObject = inputObjects[i];
                                    input[inputObject.prop] = inputObject.val;
                                }
                                result.inputs.push(input);
                            }
                            else if (inputMapping.requestType == 'List') {
                                var dataFieldID = inputMapping.dataFieldID;

                                var controlValue = '';
                                if (synControls && synControls.length > 0) {
                                    var bindingControlInfos = synControls.filter(function (item) {
                                        return item.field == dataFieldID;
                                    });

                                    if (bindingControlInfos.length == 1) {
                                        var controlInfo = bindingControlInfos[0];
                                        var controlModule = null;
                                        var currings = controlInfo.module.split('.');
                                        if (currings.length > 0) {
                                            for (var i = 0; i < currings.length; i++) {
                                                var curring = currings[i];
                                                if (controlModule) {
                                                    controlModule = controlModule[curring];
                                                }
                                                else {
                                                    controlModule = context[curring];
                                                }
                                            }
                                        }
                                        else {
                                            controlModule = context[controlInfo.module];
                                        }

                                        inputObjects = controlModule.getValue(controlInfo.id, 'List', inputMapping.items);
                                    }
                                    else {
                                        var isMapping = false;
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == dataFieldID) {
                                                    isMapping = true;
                                                    var bindingInfo = syn.uicontrols.$data.bindingList.find(function (item) {
                                                        return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                    });

                                                    if (bindingInfo) {
                                                        inputObjects = $this.store[store.dataSourceID][bindingInfo.dataFieldID];
                                                    }
                                                    else {
                                                        var controlValue = [];
                                                        var items = $this.store[store.dataSourceID];
                                                        var length = items.length;
                                                        for (var i = 0; i < length; i++) {
                                                            var item = items[i];

                                                            var row = [];
                                                            for (var key in item) {
                                                                var serviceObject = { prop: key, val: item[key] };
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

                                for (var key in inputObjects) {
                                    var input = {};
                                    var inputList = inputObjects[key];
                                    for (var i = 0; i < inputList.length; i++) {
                                        var inputObject = inputList[i];
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
                var transactConfig = $this.transaction[functionID];
                if ($object.isNullOrUndefined(transactConfig) == true) {
                    syn.$l.eventLog('$w.setterValue', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
                    return;
                }

                if ($string.isNullOrEmpty(transactConfig.functionID) == true) {
                    transactConfig.functionID = functionID;
                }

                syn.$w.tryAddFunction(transactConfig);

                var errorText = '';
                var result = {
                    errors: [],
                    outputs: [],
                };

                if ($this && $this.config && $this.config.transactions) {
                    var transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        var transaction = transactions[0];
                        var synControls = context[syn.$w.pageScript].context.synControls;
                        var outputLength = transaction.outputs.length;
                        for (var outputIndex = 0; outputIndex < outputLength; outputIndex++) {
                            var outputMapping = transaction.outputs[outputIndex];
                            var responseFieldID = outputMapping.responseType + 'Data' + outputIndex.toString();
                            var outputData = responseData[outputIndex];

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

                                    for (var key in outputMapping.items) {
                                        var meta = outputMapping.items[key];
                                        var dataFieldID = key;
                                        var fieldID = meta.fieldID;

                                        var controlValue = outputData[fieldID];
                                        if (controlValue != undefined && synControls && synControls.length > 0) {
                                            var bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID && item.formDataFieldID == outputMapping.dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                var controlInfo = bindingControlInfos[0];
                                                var controlModule = null;
                                                var currings = controlInfo.module.split('.');
                                                if (currings.length > 0) {
                                                    for (var i = 0; i < currings.length; i++) {
                                                        var curring = currings[i];
                                                        if (controlModule) {
                                                            controlModule = controlModule[curring];
                                                        }
                                                        else {
                                                            controlModule = context[curring];
                                                        }
                                                    }
                                                }
                                                else {
                                                    controlModule = context[controlInfo.module];
                                                }

                                                controlModule.setValue(controlInfo.id, controlValue, meta);
                                            }
                                            else {
                                                var isMapping = false;
                                                if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                    for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                        var store = syn.uicontrols.$data.storeList[k];
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
                                                    syn.$l.eventLog('$w.transaction', errorText, 'Error');
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
                                    var dataFieldID = outputMapping.dataFieldID;
                                    if (synControls && synControls.length > 0) {
                                        var bindingControlInfos = synControls.filter(function (item) {
                                            return item.field == dataFieldID;
                                        });

                                        if (bindingControlInfos.length == 1) {
                                            var controlInfo = bindingControlInfos[0];
                                            var controlModule = null;
                                            var currings = controlInfo.module.split('.');
                                            if (currings.length > 0) {
                                                for (var i = 0; i < currings.length; i++) {
                                                    var curring = currings[i];
                                                    if (controlModule) {
                                                        controlModule = controlModule[curring];
                                                    }
                                                    else {
                                                        controlModule = context[curring];
                                                    }
                                                }
                                            }
                                            else {
                                                controlModule = context[controlInfo.module];
                                            }

                                            controlModule.setValue(controlInfo.id, outputData, outputMapping.items);
                                        }
                                        else {
                                            var isMapping = false;
                                            if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                    var store = syn.uicontrols.$data.storeList[k];
                                                    if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                        $this.store[store.dataSourceID] = [];
                                                    }

                                                    if (store.storeType == 'Grid' && store.dataSourceID == outputMapping.dataFieldID) {
                                                        isMapping = true;
                                                        var bindingInfos = syn.uicontrols.$data.bindingList.filter(function (item) {
                                                            return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                        });

                                                        var length = outputData.length;
                                                        for (var i = 0; i < length; i++) {
                                                            outputData[i].Flag = 'R';
                                                        }

                                                        if (bindingInfos.length > 0) {
                                                            for (var binding_i = 0; binding_i < bindingInfos.length; binding_i++) {
                                                                var bindingInfo = bindingInfos[binding_i];
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
                                                syn.$l.eventLog('$w.transaction', errorText, 'Error');
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
                                    var dataFieldID = outputMapping.dataFieldID;

                                    if (synControls && synControls.length > 0) {
                                        var bindingControlInfos = synControls.filter(function (item) {
                                            return item.field == dataFieldID;
                                        });

                                        if (bindingControlInfos.length == 1) {
                                            var controlInfo = bindingControlInfos[0];
                                            var controlModule = null;
                                            var currings = controlInfo.module.split('.');
                                            if (currings.length > 0) {
                                                for (var i = 0; i < currings.length; i++) {
                                                    var curring = currings[i];
                                                    if (controlModule) {
                                                        controlModule = controlModule[curring];
                                                    }
                                                    else {
                                                        controlModule = context[curring];
                                                    }
                                                }
                                            }
                                            else {
                                                controlModule = context[controlInfo.module];
                                            }

                                            controlModule.setValue(controlInfo.id, outputData, outputMapping.items);
                                        }
                                        else {
                                            errorText = '"{0}" Chart Output Mapping 확인 필요'.format(dataFieldID);
                                            result.errors.push(errorText);
                                            syn.$l.eventLog('$w.transaction', errorText, 'Error');
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
                        syn.$l.eventLog('$w.transaction', errorText, 'Error');

                        return result;
                    }
                }
                else {
                    errorText = '화면 매핑 정의 데이터가 없습니다';
                    result.errors.push(errorText);
                    syn.$l.eventLog('$w.transaction', errorText, 'Error');

                    return result;
                }
            } catch (error) {
                syn.$l.eventLog('$w.transaction', error, 'Error');
                result.errors.push(error.message);
                return result;
            }
        },

        scrollToTop() {
            var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

            if (scrollTop > 0) {
                context.requestAnimationFrame(syn.$w.scrollToTop);
                context.scrollTo(0, scrollTop - scrollTop / 8);
            }
        },

        setFavicon(url) {
            var favicon = document.querySelector('link[rel="icon"]');

            if (favicon) {
                favicon.href = url;
            } else {
                var link = document.createElement('link');
                link.rel = 'icon';
                link.href = url;

                document.head.appendChild(link);
            }
        },

        fileDownload(url, fileName) {
            var downloadFileName = '';
            if (fileName) {
                downloadFileName = fileName;
            }
            else {
                var match = url.toString().match(/.*\/(.+?)\./);
                if (match && match.length > 1) {
                    downloadFileName = match[1];
                }
            }

            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', downloadFileName);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        sleep(ms, callback) {
            if (callback) {
                setTimeout(callback, ms);
            }
            else if (globalRoot.Promise) {
                return new Promise(function (resolve) {
                    return setTimeout(resolve, ms);
                });
            }
            else {
                syn.$l.eventLog('$w.sleep', '지원하지 않는 기능. 매개변수 확인 필요', 'Debug');
            }
        },

        purge(el) {
            var a = el.attributes, i, l, n;
            if (a) {
                for (i = a.length - 1; i >= 0; i -= 1) {
                    n = a[i].name;
                    if (typeof el[n] === 'function') {
                        el[n] = null;
                    }
                }
            }
            a = el.childNodes;
            if (a) {
                l = a.length;
                for (i = 0; i < l; i += 1) {
                    syn.$w.purge(el.childNodes[i]);
                }
            }
        },

        setServiceObject(value) {
            var message = typeof value == 'string' ? value : JSON.stringify(value);

            return $webform;
        },

        setServiceClientHeader(xhr) {
            xhr.setRequestHeader('CertificationKey', 'SGFuZFN0YWNr');
            return true;
        },

        xmlParser(xml) {
            var parser = new globalRoot.DOMParser();
            return parser.parseFromString(xml, 'text/xml');
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

                        if ($object.isNullOrUndefined(raw) == false && $object.isString(raw) == false) {
                            options.method = 'POST';

                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                options.headers.append('Content-Type', 'application/json');
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

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                body: raw instanceof FormData ? raw : JSON.stringify(raw),
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                data.timeout = options.timeout;
                            }

                            var response = await fetch(url, data);
                        }
                        else {
                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                options.headers.append('Content-Type', 'text/plain');
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

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                data.timeout = options.timeout;
                            }

                            var response = await fetch(url, data);
                        }

                        if (response.ok == true) {
                            var result = null;
                            var contentType = response.headers.get('Content-Type');
                            if (contentType.indexOf('application/json') > -1) {
                                result = response.json();
                            }
                            else {
                                result = response.text();
                            }
                            return Promise.resolve(result);
                        }
                        else {
                            syn.$l.eventLog('$w.apiHttp', `status: ${response.status}, text: ${await response.text()}`, 'Error');
                        }

                        return Promise.resolve({ error: '요청 정보 확인 필요' });
                    };
                }
            });
        },

        xmlHttp() {
            return new globalRoot.XMLHttpRequest();
        },

        loadScript(url, scriptID) {
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

            var el = document.createElement('script');
            el.setAttribute('type', 'text/javascript');
            el.setAttribute('id', resourceID);
            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                el.setAttribute('src', url);
            }
            else {
                el.setAttribute('src', url + (url.indexOf('?') > -1 ? '&' : '?') + 'noCache=' + (new Date()).getTime());
            }

            head.insertBefore(el, head.firstChild);

            return $webform;
        },

        loadStyle(url, styleID) {
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

                        if (moduleScript) {
                            var moduleFunction = "return (function() {var module = {};(function (window, module) {'use strict';" + moduleScript + ";var $module = new syn.module();$module.extend($" + moduleName + ");module.exports = $module;})(typeof window !== 'undefined' ? window : {},typeof module !== 'undefined' ? module : {});return module.exports;})();";
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
                        syn.$l.eventLog('$w.fetchScript', '<script src="{0}.js"></script> 문법 확인 필요'.format(moduleUrl), 'Information');
                    }
                }
            }

            return result;
        },

        fetchText(url) {
            var fetchOptions = {};
            if (syn.$w.getFetchClientOptions) {
                fetchOptions = syn.$w.getFetchClientOptions(fetchOptions);
            }
            else {
                fetchOptions = {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'default',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer-when-downgrade'
                };
            }

            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tick=' + new Date().getTime();
            }

            return new Promise(function (resolve, reject) {
                fetch(url, fetchOptions).then(async function (response) {
                    var statusHead = response.status?.toString().substring(0, 1);
                    if (statusHead == '2') {
                        return resolve(response.text());
                    }

                    syn.$l.eventLog('$w.fetchText', `status: ${response.status}, text: ${await response.text()}`, 'Warning');
                    return resolve(null);
                }).catch(function (error) {
                    syn.$l.eventLog('$w.fetchText', error, 'Error');
                    return reject(error);
                });
            });
        },

        fetchJson(url) {
            var fetchOptions = {};
            if (syn.$w.getFetchClientOptions) {
                fetchOptions = syn.$w.getFetchClientOptions(fetchOptions);
            }
            else {
                fetchOptions = {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'default',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer-when-downgrade'
                };
            }

            fetchOptions.headers['Content-Type'] = 'application/json';

            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tick=' + new Date().getTime();
            }

            return new Promise(function (resolve, reject) {
                fetch(url, fetchOptions).then(function (response) {
                    var statusHead = response.status?.toString().substring(0, 1);
                    if (statusHead == '2') {
                        return resolve(response.json());
                    }

                    syn.$l.eventLog('$w.fetchJson', `status: ${response.status}, text: ${response.text()}`, 'Warning');
                    return resolve(null);
                }).catch(function (error) {
                    syn.$l.eventLog('$w.fetchJson', error, 'Error');
                    return reject(null);
                });

            });
        },

        transactionObject(functionID, returnType) {
            var dataType = 'Json';
            if (returnType) {
                dataType = returnType;
            }

            var jsonObject = {};
            jsonObject.programID = '';
            jsonObject.businessID = '';
            jsonObject.systemID = '';
            jsonObject.transactionID = '';
            jsonObject.dataMapInterface = null;
            jsonObject.transactionResult = true;
            jsonObject.functionID = functionID;
            jsonObject.screenID = '';
            jsonObject.startTraceID = '';
            jsonObject.requestID = null;
            jsonObject.returnType = dataType;
            jsonObject.resultAlias = [];
            jsonObject.inputsItemCount = [];
            jsonObject.inputs = [];

            if (syn.$w.setServiceObject) {
                syn.$w.setServiceObject(jsonObject);
            }

            return jsonObject;
        },

        dynamicType: new function () {
            this.DataSet = '0';
            this.Json = '1';
            this.Scalar = '2';
            this.NonQuery = '3';
            this.SQLText = '4';
            this.SchemeOnly = '5';
            this.CodeHelp = '6';
            this.Xml = '7';
            this.DynamicJson = '8';
        },

        async executeTransaction(config, transactionObject, callback, async, token) {
            if ($object.isNullOrUndefined(config) == true || $object.isNullOrUndefined(transactionObject) == true) {
                if (globalRoot.devicePlatform === 'browser') {
                    alert('서비스 호출에 필요한 거래 정보가 구성되지 않았습니다');
                }

                syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 거래 정보 확인 필요', 'Error');
                return;
            }

            var apiService = null;
            if (globalRoot.devicePlatform === 'node') {
                var apiServices = syn.$w.getStorage('apiServices', false);
                if (apiServices) {
                    apiService = apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)];
                    if ($object.isNullOrUndefined(apiServices.BearerToken) == true && globalRoot.bearerToken) {
                        apiServices.BearerToken = globalRoot.bearerToken;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                }
                else {
                    if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = {};
                        if (token || globalRoot.bearerToken) {
                            apiServices.BearerToken = token || globalRoot.bearerToken;
                        }
                        apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                        syn.$l.eventLog('$w.executeTransaction', 'apiService 확인 필요 systemApi: {0}'.format(JSON.stringify(apiService)), 'Warning');
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 BP 정보가 구성되지 확인 필요', 'Error');
                    }
                }
            }

            var apiServices = syn.$w.getStorage('apiServices', false);
            if (apiServices) {
                apiService = apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)];
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
                    ipAddress = await syn.$w.apiHttp(syn.Config.FindClientIPServer).send(null, {
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

                url = '/transact/api/transaction/execute';

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
                    apiService.GlobalID = await syn.$w.apiHttp(syn.Config.FindGlobalIDServer).send({
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
                    accessToken: apiServices.BearerToken,
                    action: 'SYN', // "SYN: Request/Response, PSH: Execute/None, ACK: Subscribe",
                    kind: 'BIZ', // "DBG: Debug, BIZ: Business, URG: Urgent, FIN: Finish",
                    clientTag: syn.Config.SystemID.concat('|', syn.Config.HostName, '|', syn.Config.Program.ProgramName, '|', syn.Config.Environment.substring(0, 1)),
                    loadOptions: {
                        encryptionType: syn.Config.Transaction.EncryptionType, // "P:Plain, F:Full, H:Header, B:Body",
                        encryptionKey: syn.Config.Transaction.EncryptionKey, // "P:프로그램, K:KMS 서버, G:GlobalID 키",
                        platform: syn.$b.platform
                    },
                    requestID: requestID,
                    version: syn.Config.Transaction.ProtocolVersion,
                    environment: syn.Config.Environment.substring(0, 1),
                    system: {
                        programID: config.programID,
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

                if (transactionRequest.action == 'PSH') {
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
                    xhr.setRequestHeader('Server-SystemID', config.systemID);
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

                    syn.$l.eventLog('$w.executeTransaction', transactionRequest.requestID, 'Verbose');

                    xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.timeout = syn.Config.TransactionTimeout;
                    xhr.send(JSON.stringify(transactionRequest));
                }
            }
        }
    });

    if (syn && !syn.Config) {
        syn.Config = {};
    }

    syn.$w = $webform;
    if (globalRoot.devicePlatform === 'node') {
        var fs = require('fs');
        var path = require('path');

        if (process.env.SYN_CONFIG) {
            syn.Config = JSON.parse(process.env.SYN_CONFIG);
        }

        if (syn.Config && $string.isNullOrEmpty(syn.Config.DataSourceFilePath) == true) {
            syn.Config.DataSourceFilePath = path.join(process.cwd(), 'BusinessContract/Database/DataSource.xml');
        }

        delete syn.$w.isPageLoad;
        delete syn.$w.pageReadyTimeout;
        delete syn.$w.eventAddReady;
        delete syn.$w.eventRemoveReady;
        delete syn.$w.moduleReadyIntervalID;
        delete syn.$w.remainingReadyIntervalID;
        delete syn.$w.remainingReadyCount;
        delete syn.$w.defaultControlOptions;
        delete syn.$w.initializeScript;
        delete syn.$w.activeControl;
        delete syn.$w.contentLoaded;
        delete syn.$w.addReadyCount;
        delete syn.$w.removeReadyCount;
        delete syn.$w.createSelection;
        delete syn.$w.getTriggerOptions;
        delete syn.$w.triggerAction;
        delete syn.$w.transactionAction;
        delete syn.$w.transaction;
        delete syn.$w.scrollToTop;
        delete syn.$w.setFavicon;
        delete syn.$w.fileDownload;
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

        syn.$l.addEvent(context, 'load', function () {
            var mod = context[syn.$w.pageScript];
            if (mod && mod.hook.windowLoad) {
                mod.hook.windowLoad();
            }
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
