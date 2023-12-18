/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $resource = context.$resource || new syn.module();
    var document = context.document;

    $resource.extend({
        version: '1.0.0',
        localeID: 'ko-KR',
        fullyQualifiedLocale: {
            ko: 'ko-KR',
            en: 'en-US',
            ja: 'ja-JP',
            zh: 'zh-CN'
        },

        translations: {},
        translateControls: [],

        concreate() {
            var els = document.querySelectorAll('[syn-i18n]');
            for (var i = 0; i < els.length; i++) {
                var el = els[i];

                var tagName = el.tagName.toUpperCase();
                var elID = el.getAttribute('id');
                var i18nOption = el.getAttribute('syn-i18n');

                if (i18nOption === undefined || i18nOption === null || i18nOption === '') {
                    continue;
                }

                var options = null;
                if (i18nOption.startsWith('{') == true) {
                    try {
                        options = eval('(' + i18nOption + ')');
                        if (options.options.bindSource === undefined || options.options.bindSource === null) {
                            options.bindSource = 'content';
                        }
                        else {
                            options.bindSource = options.options.bindSource;
                        }
                    } catch (error) {
                        console.log('$resource.concreate, tagName: "' + tagName + '", elID: "' + elID + '" syn-i18n 확인 필요, error: ' + error.message);
                    }
                }
                else {
                    options = {
                        key: i18nOption,
                        bindSource: 'content'
                    };
                }

                if (options && (options.key === undefined || options.key === null || options.key === '') == false) {
                    el.setAttribute('i18n-key', options.key);
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
                                controlType = el.getAttribute('type').toLowerCase();
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
                                if (el.getAttribute('multiple') == null) {
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
                                break;
                        }
                    }

                    var key = options.key;
                    var bindSource = options.bindSource;

                    delete options.key;
                    delete options.bindSource;

                    $resource.translateControls.push({
                        elID: elID,
                        key: key,
                        bindSource: bindSource,
                        tag: tagName,
                        module: moduleName,
                        type: controlType,
                        options: options
                    });
                }
                else {
                    console.log('$resource.concreate, tagName: "' + tagName + '", elID: "' + elID + '" key 확인 필요');
                }
            }

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.pageResource) {
                mod.hook.pageResource($resource.localeID);
            }

            if (syn.Config && $string.toBoolean(syn.Config.IsLocaleTranslations) == true) {
                $resource.remainingReadyIntervalID = setInterval(function () {
                    if (syn.$w.isPageLoad == true) {
                        clearInterval($resource.remainingReadyIntervalID);
                        $resource.remainingReadyIntervalID = null;
                        $resource.setLocale($resource.localeID);
                    }
                }, 25);
            }
        },

        add(id, val) {
            $resource.translations[id] = val;
        },

        remove(id) {
            delete $resource.translations[id];
        },

        interpolate(message, interpolations) {
            return Object.keys(interpolations).reduce(function (interpolated, key) {
                return interpolated.replace(new RegExp('#{s*' + key + 's*}', 'g'), interpolations[key]);
            }, message);
        },

        getControl(el) {
            var result = null;
            if ($object.isString(el) == true) {
                el = syn.$l.get(el);
            }

            if ($object.isNullOrUndefined(el) == false) {
                var elID = el.id;
                var tag = el.tagName;
                var key = el.getAttribute('i18n-key');

                if ($string.isNullOrEmpty(elID) == true) {
                    result = $resource.translateControls.find(function (item) { return item.tag == tag && item.key == key; });
                }
                else {
                    result = $resource.translateControls.find(function (item) { return item.elID == elID && item.tag == tag && item.key == key; });
                }
            }

            return result;
        },

        translatePage() {
            $resource.translateControls.forEach(function (control) {
                $resource.translateControl(control);
            });
        },

        translateElement(el, options) {
            var control = $resource.getControl(el);
            if ($object.isNullOrUndefined(control) == false) {
                $resource.translateControl(control, options);
            }
        },

        translateControl(control, options) {
            if ($object.isNullOrUndefined(control) == false) {
                var el = null;
                if ($string.isNullOrEmpty(control.elID) == false) {
                    el = syn.$l.get(control.elID);
                }
                else {
                    el = syn.$l.querySelector('{0}[i18n-key="{1}"]'.format(control.tag, control.key));
                }

                if ($object.isNullOrUndefined(control.module) == true) {
                    var bind = $resource.getBindSource(control);
                    if ($string.isNullOrEmpty(bind) == false) {
                        el[bind] = $resource.translateText(control, options);
                    }
                }
                else {
                    if (syn.uicontrols) {
                        var controlModule = syn.uicontrols['$' + control.module];
                        if (controlModule && controlModule.setLocale) {
                            controlModule.setLocale(control.elID, $resource.translations, control, options);
                        }
                    }
                }
            }
        },

        translateText(control, options) {
            var result = '';
            if (control) {
                var key = control.key;
                var translation = $resource.translations[key];

                var text = null;
                if ($object.isString(translation) == true) {
                    text = translation;
                }
                else if ($object.isArray(translation) == true) {
                    text = translation[0];
                }
                else if ($object.isObject(translation) == true) {
                    text = translation.Text;
                }

                if (/#{s*\w+s*}/g.test(text) == true) {
                    var interpolateOption = syn.$w.getSSOInfo();
                    if (interpolateOption) {
                        if (options) {
                            interpolateOption = syn.$w.argumentsExtend(interpolateOption, options);
                        }
                    }
                    else {
                        interpolateOption = options;
                    }

                    result = interpolateOption ? $resource.interpolate(text, interpolateOption) : text;
                }
                else {
                    result = text;
                }
            }

            return result;
        },

        getBindSource(control) {
            var result = null;
            switch (control.bindSource) {
                case 'text':
                    result = 'innerText';
                    break;
                case 'content':
                    result = 'textContent';
                    break;
                case 'html':
                    result = 'innerHTML';
                    break;
                case 'url':
                    result = 'src';
                    break;
                case 'placeholder':
                    result = 'placeholder';
                    break;
                case 'control':
                    result = 'controlText';
                    break;
                case 'value':
                    result = 'value';
                    break;
            }

            return result;
        },

        async setLocale(localeID) {
            var localeUrl = '/assets/shared/language/';
            if (syn && syn.Config) {
                localeUrl = syn.Config.LocaleAssetUrl ? syn.Config.LocaleAssetUrl : syn.Config.SharedAssetUrl + 'language/';
            }

            $resource.localeID = localeID;
            localeUrl = `${localeUrl}${localeID}.json`;
            var enabled = await syn.$r.isCorsEnabled(localeUrl);
            if (enabled == true) {
                try {
                    var translations = await syn.$w.fetchJson(localeUrl);
                    $resource.translations = syn.$w.argumentsExtend($resource.translations, translations);
                } catch (error) {
                    syn.$l.eventLog('$resource.setLocale', error.message, 'Warning');
                }
            }
            document.documentElement.lang = localeID.substring(0, 2);
            $resource.translatePage();
        }
    });

    context.$resource = $resource;
})(globalRoot);
