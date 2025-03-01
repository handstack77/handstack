/// <reference path="/js/syn.js" />

(function (window) {
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $sourceeditor = syn.uicontrols.$sourceeditor || new syn.module();

    $sourceeditor.extend({
        name: 'syn.uicontrols.$sourceeditor',
        version: 'v2025.3.1',
        editorPendings: [],
        editorControls: [],
        defaultSetting: {
            width: '100%',
            height: '360px',
            language: "javascript",
            minimap: {
                enabled: false
            },
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            lineNumbers: 'on',
            theme: 'vs-dark',
            dataType: 'string',
            basePath: '/lib/monaco-editor/min/vs',
            belongID: null,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        controlLoad(elID, setting) {
            if (window.monaco) {
                $sourceeditor.lazyControlLoad(elID, setting);
            }
            else {
                syn.$w.loadScript($sourceeditor.defaultSetting.basePath + '/loader.js', 'monacosourceeditor', () => {
                    if (window.require) {
                        require.config({
                            paths: { 'vs': syn.uicontrols.$sourceeditor.defaultSetting.basePath },
                            'vs/nls': {
                                availableLanguages: {
                                    '*': 'ko'
                                }
                            }
                        });

                        window.MonacoEnvironment = {
                            getWorkerUrl: function (workerId, label) {
                                return `data:text/javascript,`;
                            }
                        };

                        require(['vs/editor/editor.main', 'vs/nls.messages.ko'], function () {
                            if (window.monaco) {
                                var length = $sourceeditor.editorPendings.length;
                                for (var i = 0; i < length; i++) {
                                    var item = $sourceeditor.editorPendings[i];

                                    $sourceeditor.lazyControlLoad(item.elID, item.setting);
                                }

                                $sourceeditor.editorPendings.length = 0;
                            }
                        });
                    }
                });

                $sourceeditor.editorPendings.push({
                    elID: elID,
                    setting: setting
                });
            }
        },

        lazyControlLoad(elID, setting) {
            var el = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend($sourceeditor.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var parent = el.parentNode;
            var container = document.createElement('div');
            container.id = elID;
            container.setAttribute('syn-datafield', el.getAttribute('syn-datafield'));
            container.setAttribute('syn-options', el.getAttribute('syn-options'));
            syn.$m.setStyle(container, 'width', setting.width);
            syn.$m.setStyle(container, 'height', setting.height);

            parent.appendChild(container);

            var editor = monaco.editor.create(container, setting);
            editor.onKeyDown(function (e) {
                if (e.code === 'Space' && e.ctrlKey === true) {
                    e.preventDefault();
                }
            });

            syn.$l.addEvent(window, 'resize', $sourceeditor.window_onresize);

            $sourceeditor.editorControls.push({
                id: elID,
                editor: editor,
                setting: $object.clone(setting)
            });
        },

        window_onresize() {
            var length = $sourceeditor.editorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $sourceeditor.editorControls[i];

                var control = $sourceeditor.getControl(item.id);
                if (control) {
                    if (control.editor) {
                        result = control.editor.layout();
                    }
                }
            }
        },

        getValue(elID, meta) {
            var result = '';
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        result = control.editor.getValue();
                    }
                }
            }

            return result;
        },

        setValue(elID, value, meta) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        control.editor.setValue(value);
                    }
                }
            }
        },

        clear(elID, isControlLoad) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        control.editor.setValue('');
                    }
                }
            }
        },

        applyEdits(text, position) {
            if (!text) {
                return;
            }

            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        if (position == null) {
                            position = control.editor.getPosition();
                        }

                        control.editor.getModel().applyEdits([{
                            range: monaco.Range.fromPositions(position),
                            text: text
                        }]);
                    }
                }
            }
        },

        getValueInRange(position) {
            var result = null;
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        if (position == null) {
                            position = control.editor.getPosition();
                        }

                        result = control.editor.getModel().getValueInRange(position);
                    }
                }
            }

            return result;
        },

        getContentLine(text) {
            if (!text) {
                return;
            }

            var result = 0;
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        var editorValue = control.editor.getValue();
                        var splitedText = editorValue.split('\n');

                        var length = splitedText.length;
                        for (var i = 0; i < length; i++) {
                            var item = splitedText[i];
                            if (item.indexOf(text) > -1) {
                                result = (i + 1);
                                break;
                            }
                        }
                    }
                }
            }

            return result;
        },

        setSelection(range) {
            if (!range) {
                return;
            }

            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        control.editor.setSelection(range);
                    }
                }
            }
        },

        revealLine(line) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        if (line) {
                            var lineCount = control.editor.getModel().getLineCount();
                            line = line > lineCount ? lineCount : line;
                        }

                        control.editor.revealLine(line);
                    }
                }
            }
        },

        findSelection(text) {
            if (!text) {
                return;
            }

            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        control.editor.trigger(text, 'actions.find');
                        control.editor.trigger(text, 'actions.findWithSelection');
                        control.editor.trigger(text, 'editor.action.nextMatchFindAction');
                        control.editor.trigger('keyboard', 'closeFindWidget');
                    }
                }
            }
        },

        layoutResize(elID) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        control.editor.layout();
                    }
                }
            }
        },

        getActions(elID) {
            var result = null;
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == false) {
                var control = $sourceeditor.getControl(elID);
                if (control) {
                    if (control.editor) {
                        result = control.editor.getActions();
                    }
                }
            }

            return result;
        },

        getControl(elID) {
            var result = null;
            var length = $sourceeditor.editorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $sourceeditor.editorControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$sourceeditor = $sourceeditor;
})(window);
