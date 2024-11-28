/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $guide = syn.uicontrols.$guide || new syn.module();

    $guide.extend({
        name: 'syn.uicontrols.$guide',
        version: '1.0.0',
        guideControls: [],
        itemTemplate: {
            helpType: '', // I: introJs, T: tippy, P: superplaceholder, U: UI Help & Link
            selector: '', // querySelector
            subject: '', // html string
            sentence: '', // html string
            options: '', // json string {"contentType":"html"}
            sortingNo: 0 // step by step
        },
        defaultSetting: {
            items: [],
            introOptions: {
                prevLabel: '<svg xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>',
                nextLabel: '<svg xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>',
                doneLabel: '완료',
                skipLabel: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>',
                dontShowAgainLabel: '다시 안보기',
                exitOnEsc: true,
                showStepNumbers: true,
                showBullets: false,
                tooltipPosition: 'auto',
                overlayOpacity: 0.2,
                steps: []
            },
            tooltipOptions: {
                placement: 'top-start',
                allowHTML: true,
                animateFill: true,
                maxWidth: '640px'
            },
            placeholderOptions: {
                letterDelay: 25,
                sentenceDelay: 1000,
                startOnFocus: true,
                loop: false,
                shuffle: false,
                showCursor: true,
                cursor: '|'
            }
        },

        addModuleList(el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';

            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: this.name,
                type: controlType
            });
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);
            setting = syn.$w.argumentsExtend($guide.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';
            
            var tooltips = [];
            var intros = null;
            var placeholders = [];
            if (setting.items && setting.items.length > 0) {
                /*
                items: [{
                    helpType: 'U',
                    selector: '',
                    subject: '제목입니다.',
                    sentence: 'https://handstack.kr/docs/startup/install/지원-운영체제',
                    options: '{&#34;contentType&#34;: &#34;link&#34;}',
                },{
                    helpType: 'U',
                    selector: '',
                    subject: '제목입니다.',
                    sentence: '&lt;b&gt;&lt;u&gt;본문&lt;/u&gt;&lt;/b&gt;입니다.',
                    options: '{&#34;contentType&#34;: &#34;html&#34;}',
                },
                {
                    helpType: 'I',
                    selector: '#btnNewDataSource',
                    subject: '신규 데이터 원본을 설정하세요.',
                    sentence: 'SqlServer, Oracle, MySQL & MariaDB, PostgreSQL, SQLite 데이터베이스를 연동하세요.',
                },
                {
                    helpType: 'I',
                    selector: '#lstDataSource',
                    subject: '연결 가능한 데이터 원본입니다.',
                    sentence: '앱 에서 데이터베이스 요청을 실행하는 dbclient 모듈의 계약 정보에 사용하는 DataSourceID 목록입니다.',
                },
                {
                    helpType: 'I',
                    selector: '#ddlDataProvider',
                    subject: '데이터베이스에 접속할 연결문자열을 입력합니다.',
                    sentence: 'qrame.kr 에서 접근 가능한 개발 및 테스트 목적의 데이터베이스 연결문자열을 입력하세요. SQLite 의 경우 하위 디렉토리 경로만 가능합니다.',
                },
                {
                    helpType: 'I',
                    selector: '#txtProjectAppender',
                    subject: '데이터 원본에 접근 허용할 프로젝트 ID를 입력하세요.',
                    sentence: '화면내 호출 가능한 거래 접근 제어를 위해 콤마를 구분으로 여러 프로젝트 ID 3자리가 입력되며, * 포함시 모든 프로젝트에 허용됩니다.',
                },
                {
                    helpType: 'T',
                    selector: 'span.badge.bg-primary',
                    subject: '앱에서 사용하는 기본 데이터베이스 입니다.',
                    sentence: '기본 데이터 원본 정보는 제공자와 연결 문자열을 편집할 수 없습니다.',
                    applyDelay: 1000
                },
                {
                    helpType: 'T',
                    selector: '#lblDataSourceID',
                    subject: 'dbclient 모듈의 계약 정보에 사용하는 DataSourceID 입니다.',
                    sentence: '변경 또는 삭제시 사용중인 계약 정보에 영향을 줍니다.',
                },
                {
                    helpType: 'P',
                    selector: '#txtConnectionString',
                    subject: '중요',
                    sentence: '개발 및 테스트 목적의 데이터베이스 연결문자열을 입력해야 합니다. 데이터베이스에 따라 연결문자열에 대한 참고 내용은 https://www.connectionstrings.com 를 확인하세요.',
                }]
                */
                var helpIntros = setting.items.filter(function (item) { return item.helpType == 'I' });
                if (window.introJs && helpIntros.length > 0) {
                    var introOptions = setting.introOptions;
                    var steps = [];
                    helpIntros = $array.objectSort(helpIntros, 'sortingNo', true);
                    for (var i = 0; i < helpIntros.length; i++) {
                        var helpIntro = helpIntros[i];
                        var introEL = syn.$l.querySelector(helpIntro.selector);
                        if (introEL == null) {
                            continue;
                        }

                        if ($string.isNullOrEmpty(helpIntro.options) == false) {
                            introOptions = syn.$w.argumentsExtend(introOptions, eval('(' + helpIntro.options + ')'));
                        }

                        steps.push({
                            title: helpIntro.subject,
                            element: introEL,
                            intro: helpIntro.sentence,
                            position: helpIntro.position || 'auto'
                        });
                    }

                    if (steps.length > 0) {
                        introOptions = syn.$w.argumentsExtend(introOptions, { steps: steps });
                        intros = introJs().setOptions(introOptions);

                        if (mod) {
                            var hookEvents = el.getAttribute('syn-events') || [];
                            if (hookEvents) {
                                hookEvents = eval(hookEvents);

                                for (var i = 0, length = hookEvents.length; i < length; i++) {
                                    var hook = hookEvents[i];
                                    var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                                    if (eventHandler) {
                                        switch (hook) {
                                            case 'complete':
                                                intros.oncomplete(eventHandler);
                                                break;
                                            case 'exit':
                                                intros.onexit(eventHandler);
                                                break;
                                            case 'beforeexit':
                                                intros.onbeforeexit(eventHandler);
                                                break;
                                            case 'change':
                                                intros.onchange(eventHandler);
                                                break;
                                            case 'beforechange':
                                                intros.onbeforechange(eventHandler);
                                                break;
                                            case 'afterchange':
                                                intros.onafterchange(eventHandler);
                                                break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                var helpTooltips = setting.items.filter(function (item) { return item.helpType == 'T' });
                if (window.tippy && helpTooltips.length > 0) {
                    var tooltipOptions = setting.tooltipOptions;
                    for (var i = 0; i < helpTooltips.length; i++) {
                        var helpTooltip = helpTooltips[i];
                        var applyDelay = $string.toNumber(helpTooltip.applyDelay);
                        var tooltipEL = syn.$l.querySelector(helpTooltip.selector);
                        if (tooltipEL == null && applyDelay == 0) {
                            continue;
                        }

                        if ($string.isNullOrEmpty(helpTooltip.options) == false) {
                            tooltipOptions = syn.$w.argumentsExtend(tooltipOptions, eval('(' + helpTooltip.options + ')'));
                        }

                        tooltipOptions.content = ($string.isNullOrEmpty(helpTooltip.subject) == true ? '' : '<strong>{0}</strong> '.format(helpTooltip.subject)) + helpTooltip.sentence;
                        if (applyDelay > 0) {
                            setTimeout((selector, options) => {
                                tooltips.push(tippy(selector, options)[0]);
                            }, applyDelay, helpTooltip.selector, $object.clone(tooltipOptions, true));
                        }
                        else {
                            tooltips.push(tippy(helpTooltip.selector, tooltipOptions)[0]);
                        }
                    }
                }

                var helpPlaceHolders = setting.items.filter(function (item) { return item.helpType == 'P' });
                if (window.superplaceholder && helpPlaceHolders.length > 0) {
                    for (var i = 0; i < helpPlaceHolders.length; i++) {
                        var helpPlaceHolder = helpPlaceHolders[i];
                        var placeholderOptions = {};
                        placeholderOptions.el = syn.$l.querySelector(helpPlaceHolder.selector);
                        if (placeholderOptions.el == null) {
                            continue;
                        }

                        placeholderOptions.options = setting.placeholderOptions;
                        if ($string.isNullOrEmpty(helpPlaceHolder.options) == false) {
                            placeholderOptions.options = syn.$w.argumentsExtend(placeholderOptions.options, eval('(' + helpPlaceHolder.options + ')'));
                        }

                        if ($object.isString(helpPlaceHolder.sentence) == true) {
                            placeholderOptions.sentences = [($string.isNullOrEmpty(helpPlaceHolder.subject) == true ? '' : '[{0}] '.format(helpPlaceHolder.subject)) + helpPlaceHolder.sentence];
                        }
                        else if ($object.isArray(helpPlaceHolder.sentence) == true) {
                            if ($string.isNullOrEmpty(helpPlaceHolder.subject) == false) {
                                for (var i = 0, length = helpPlaceHolder.sentence.length; i < length; i++) {
                                    helpPlaceHolder.sentence[i] = `[${helpPlaceHolder.subject}] ` + helpPlaceHolder.sentence[i];
                                }
                            }
                            placeholderOptions.sentences = helpPlaceHolder.sentence;
                        }

                        if ($object.isNullOrUndefined(placeholderOptions.sentences) == false) {
                            placeholders.push(superplaceholder(placeholderOptions));
                        }
                    }
                }
            }
            else {
                setting.items = [];
            }

            $guide.guideControls.push({
                id: elID,
                items: setting.items,
                tooltip: tooltips,
                intro: intros,
                placeholder: placeholders
            });
        },

        getGuideControl(elID) {
            var result = null;

            var length = $guide.guideControls.length;
            for (var i = 0; i < length; i++) {
                var item = $guide.guideControls[i];
                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        introStart(elID) {
            var guide = $guide.getGuideControl(elID);
            if (guide) {
                var intro = guide.intro;
                if (intro) {
                    // https://introjs.com/docs/intro/api
                    intro.start();
                }
            }
        },

        openUIHelp(elID) {
            var guide = $guide.getGuideControl(elID);
            if (guide) {
                var el = syn.$l.get(elID);
                var help = guide.items.find(function (item) { return item.helpType == 'U' });
                if ($object.isNullOrUndefined(help) == false) {
                    var options = help.options && JSON.parse($string.toCharHtml(help.options));
                    if (options && options.contentType == 'link') {
                        if ($string.isNullOrEmpty(help.sentence) == false) {
                            window.open(help.sentence, 'help');
                        }
                        else {
                            syn.$l.eventLog('callProgramHelp', '화면 도움말 링크 확인 필요', 'Warning');
                        }
                    }
                    else {
                        var helpWindow = window.open('', 'help');
                        if ($object.isNullOrUndefined(helpWindow) == true) {
                            syn.$w.alert('"{0}" 내용을 확인하기 위해 팝업을 허용해야 합니다'.format(help.subject));
                        }
                        else {
                            var html = `
                            <html style="margin: 0;">
                                <head>
                                    <link type="text/css" rel="stylesheet" href="/js/tinymce/skins/ui/oxide/content.min.css">
                                    <link type="text/css" rel="stylesheet" href="/js/tinymce/skins/content/default/content.min.css">
                                </head>
                                <body style="margin: 0; width: 100%; padding:8px;" class="mce-content-body">
                                    <h1>${help.subject}</h1>${help.sentence}
                                </body>
                            </html>
                            `;

                            helpWindow.document.open();
                            helpWindow.document.write(html);
                            helpWindow.document.close();
                        }
                    }
                }
            }
        },

        dataRefresh(elID, items) {
            var setting = JSON.parse(syn.$l.get(elID).getAttribute('syn-options'));
            var guide = $guide.getGuideControl(elID);
            if (guide && items) {
                $guide.clear(elID);
                guide.items = [];
                guide.tooltip = [];
                guide.intro = null;
                guide.placeholder = [];

                var tooltips = [];
                var intros = null;
                var placeholders = [];
                if (items && items.length > 0) {
                    var helpIntros = items.filter(function (item) { return item.helpType == 'I' });
                    if (window.introJs && helpIntros.length > 0) {
                        var introOptions = setting.introOptions;
                        var steps = [];
                        helpIntros = $array.objectSort(helpIntros, 'sortingNo', true);
                        for (var i = 0; i < helpIntros.length; i++) {
                            var helpIntro = helpIntros[i];
                            if ($string.isNullOrEmpty(helpIntro.options) == false) {
                                introOptions = syn.$w.argumentsExtend(introOptions, eval('(' + helpIntro.options + ')'));
                            }

                            steps.push({
                                title: helpIntro.subject,
                                element: syn.$l.querySelector(helpIntro.selector),
                                intro: helpIntro.sentence
                            });
                        }

                        if (steps.length > 0) {
                            introOptions = syn.$w.argumentsExtend(introOptions, { steps: steps });
                            intros = introJs().setOptions(introOptions);
                        }
                    }

                    var helpTooltips = items.filter(function (item) { return item.helpType == 'T' });
                    if (window.tippy && helpTooltips.length > 0) {
                        var tooltipOptions = setting.tooltipOptions;
                        for (var i = 0; i < helpTooltips.length; i++) {
                            var helpTooltip = helpTooltips[i];
                            if ($string.isNullOrEmpty(helpTooltip.options) == false) {
                                tooltipOptions = syn.$w.argumentsExtend(tooltipOptions, eval('(' + helpTooltip.options + ')'));
                            }

                            tooltipOptions.content = ($string.isNullOrEmpty(helpTooltip.subject) == true ? '' : '<strong>{0}</strong> '.format(helpTooltip.subject)) + helpTooltip.sentence;
                            var applyDelay = $string.toNumber(helpTooltip.applyDelay);
                            if (applyDelay > 0) {
                                setTimeout((selector, options) => {
                                    tooltips.push(tippy(selector, options)[0]);
                                }, applyDelay, helpTooltip.selector, $object.clone(tooltipOptions, true));
                            }
                            else {
                                tooltips.push(tippy(helpTooltip.selector, tooltipOptions)[0]);
                            }
                        }
                    }

                    var helpPlaceHolders = items.filter(function (item) { return item.helpType == 'P' });
                    if (window.superplaceholder && helpPlaceHolders.length > 0) {
                        for (var i = 0; i < helpPlaceHolders.length; i++) {
                            var placeholderOptions = {};
                            placeholderOptions.options = setting.placeholderOptions;
                            var helpPlaceHolder = helpPlaceHolders[i];
                            if ($string.isNullOrEmpty(helpPlaceHolder.options) == false) {
                                placeholderOptions.options = syn.$w.argumentsExtend(placeholderOptions.options, eval('(' + helpPlaceHolder.options + ')'));
                            }

                            placeholderOptions.el = syn.$l.querySelector(helpPlaceHolder.selector);
                            if ($object.isString(helpPlaceHolder.sentence) == true) {
                                placeholderOptions.sentences = [($string.isNullOrEmpty(helpPlaceHolder.subject) == true ? '' : '[{0}] '.format(helpPlaceHolder.subject)) + helpPlaceHolder.sentence];
                            }
                            else if ($object.isArray(helpPlaceHolder.sentence) == true) {
                                if ($string.isNullOrEmpty(helpPlaceHolder.subject) == false) {
                                    for (var i = 0, length = helpPlaceHolder.sentence.length; i < length; i++) {
                                        helpPlaceHolder.sentence[i] = `[${helpPlaceHolder.subject}] ` + helpPlaceHolder.sentence[i];
                                    }
                                }
                                placeholderOptions.sentences = helpPlaceHolder.sentence;
                            }

                            if ($object.isNullOrUndefined(placeholderOptions.sentences) == false) {
                                placeholders.push(superplaceholder(placeholderOptions));
                            }
                        }
                    }
                }
                else {
                    items = [];
                }

                $guide.clear(elID);
                guide.items = items;
                guide.tooltip = tooltips;
                guide.intro = intros;
                guide.placeholder = placeholders;
            }
        },

        getValue(elID) {
            return syn.$l.get(elID).value;
        },

        setValue(elID, value) {
            var el = syn.$l.get(elID);
            el.value = value ? value : '';
        },

        clear(elID) {
            var el = syn.$l.get(elID);
            el.value = '';

            var guide = $guide.getGuideControl(elID);
            if (guide) {
                if ($object.isNullOrUndefined(guide.tooltip) == false) {
                    for (var i = 0, length = guide.tooltip.length; i < length; i++) {
                        guide.tooltip[i].destroy();
                    }
                }

                if ($object.isNullOrUndefined(guide.intro) == false) {
                    guide.intro.exit();
                }

                if ($object.isNullOrUndefined(guide.placeholder) == false) {
                    for (var i = 0, length = guide.placeholder.length; i < length; i++) {
                        guide.placeholder[i].destroy();
                    }
                }
            }
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$guide = $guide;
})(window);
