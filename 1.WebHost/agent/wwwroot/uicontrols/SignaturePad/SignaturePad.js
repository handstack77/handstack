/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    // 값은 항상 data URL 전체('data:image/png;base64,....')로 주고받는다. setValue 는 접두사 없는 순수 base64 도 허용한다.
    const dataUrlPattern = /^data:image\/[a-z0-9.+-]+(;[a-z0-9=.+-]+)*;base64,/i;
    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
    const mimeSignatures = [['iVBOR', 'image/png'], ['/9j/', 'image/jpeg'], ['R0lGOD', 'image/gif'], ['UklGR', 'image/webp'], ['PHN2Zy', 'image/svg+xml'], ['PD94bW', 'image/svg+xml']];
    const padOptionNames = ['dotSize', 'minWidth', 'maxWidth', 'penColor', 'minDistance', 'velocityFilterWeight', 'compositeOperation', 'backgroundColor', 'throttle'];
    const padEvents = ['beginStroke', 'endStroke'];

    const isTransparent = color => typeof color !== 'string' || color === '' || color === 'transparent' || /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(\.0+)?\s*\)$/i.test(color);

    // 반환: '' = 빈 값, null = 해석 불가, 그 외 = data URL
    const normalize = value => {
        if (value === null || value === undefined) return '';
        if (typeof value !== 'string') return null;
        value = value.trim();
        if (value === '') return '';
        if (dataUrlPattern.test(value)) return value;
        if (value.startsWith('data:')) return null;
        const compact = value.replace(/\s+/g, '');
        if (!base64Pattern.test(compact)) return null;
        const signature = mimeSignatures.find(item => compact.startsWith(item[0]));
        return 'data:' + (signature ? signature[1] : 'image/png') + ';base64,' + compact;
    };

    const notify = (control, type, detail) => syn.$l.triggerEvent(control.host, type, detail);

    // 비어 있을 때만 안내 문구를 보여준다.
    const refresh = control => {
        const empty = control.pad.isEmpty();
        control.placeholder.hidden = !empty;
        control.host.classList.toggle('syn-signaturepad-empty', empty);
    };

    // 캔버스를 초기화하고 기준 이미지(setValue)와 획(strokes)을 다시 그린다. 이미지 로딩이 비동기이므로 Promise<boolean> 을 반환한다.
    const repaint = (control, strokes) => {
        const pad = control.pad;
        const token = ++control.paintToken;
        control.loading = false;
        pad.clear();

        if (control.baseValue) {
            control.loading = true;
            return pad.fromDataURL(control.baseValue, { ratio: control.ratio }).then(() => true, error => {
                syn.$l.eventLog('$signaturepad.setValue', 'elID: "{0}" 이미지를 불러오지 못했습니다.'.format(control.id), 'Warning');
                return false;
            }).then(success => {
                if (token !== control.paintToken) return success;

                control.loading = false;
                if (success === false) {
                    control.baseValue = null;
                    pad.clear();
                }
                pad.fromData(strokes, { clear: false });
                refresh(control);
                return success;
            });
        }

        pad.fromData(strokes, { clear: false });
        refresh(control);
        return Promise.resolve(true);
    };

    // 호스트 크기에 맞춰 캔버스 해상도를 맞춘다(devicePixelRatio 반영). 크기가 바뀌어도 그려진 내용은 유지한다.
    const layout = (control, force) => {
        const host = control.host;
        const canvas = control.canvas;
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (width === 0 || height === 0) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const pixelWidth = Math.round(width * ratio);
        const pixelHeight = Math.round(height * ratio);
        if (force !== true && canvas.width === pixelWidth && canvas.height === pixelHeight) return;

        const strokes = control.pad.toData().slice();
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.getContext('2d').scale(ratio, ratio);
        control.ratio = ratio;
        repaint(control, strokes);
    };

    const applyState = control => {
        const locked = control.readOnly || control.disabled;
        if (locked) {
            control.pad.off();
        }
        else {
            control.pad.on();
        }

        control.host.classList.toggle('syn-signaturepad-readonly', control.readOnly);
        control.host.classList.toggle('syn-signaturepad-disabled', control.disabled);
        control.host.setAttribute('aria-readonly', control.readOnly ? 'true' : 'false');
        control.host.setAttribute('aria-disabled', control.disabled ? 'true' : 'false');
    };

    syn.uicontrols = syn.uicontrols || new syn.module();
    const module = syn.uicontrols.$signaturepad || new syn.module();

    module.extend({
        name: 'syn.uicontrols.$signaturepad',
        version: 'v2026.10.14',
        signatureControls: [],
        defaultSetting: {
            width: '100%',
            height: '200px',
            placeholder: '여기에 서명해 주세요',
            penColor: '#000000',
            backgroundColor: 'rgba(0,0,0,0)',
            minWidth: 0.5,
            maxWidth: 2.5,
            dotSize: null,
            minDistance: 5,
            velocityFilterWeight: 0.7,
            throttle: 16,
            compositeOperation: 'source-over',
            imageType: 'image/png',
            imageQuality: null,
            readOnly: false,
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList(el, moduleList, setting, controlType) {
            moduleList.push({
                id: el.getAttribute('id'),
                formDataFieldID: el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '',
                field: el.getAttribute('syn-datafield'),
                module: this.name,
                type: controlType
            });
        },

        controlLoad(elID, setting) {
            const existing = this.getControl(elID);
            if (existing) {
                return existing;
            }

            const el = syn.$l.get(elID);
            if (!el) {
                throw new Error('SignaturePad: element not found: ' + elID);
            }

            if (typeof SignaturePad === 'undefined') {
                throw new Error('SignaturePad: signature_pad library must be loaded first');
            }

            setting = syn.$w.argumentsExtend(this.defaultSetting, setting || {});

            const mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                setting = syn.$w.argumentsExtend(setting, mod.hook.controlInit(elID, setting));
            }

            // JPEG 는 투명도를 지원하지 않아 투명 배경이 검은색으로 저장되므로 흰색 배경으로 바꾼다.
            if (setting.imageType === 'image/jpeg' && isTransparent(setting.backgroundColor) == true) {
                setting.backgroundColor = '#ffffff';
            }

            setting.elID = elID;
            el.setAttribute('syn-options', JSON.stringify(setting));

            el.classList.add('syn-signaturepad');
            el.style.width = setting.width;
            el.style.height = setting.height;
            el.replaceChildren();

            const canvas = document.createElement('canvas');
            canvas.className = 'syn-signaturepad-canvas';
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', setting.controlText || '서명 입력');

            const placeholder = document.createElement('div');
            placeholder.className = 'syn-signaturepad-placeholder';
            placeholder.textContent = setting.placeholder || '';

            el.append(canvas, placeholder);

            const padOptions = {};
            padOptionNames.forEach(name => {
                if (setting[name] !== null && setting[name] !== undefined) {
                    padOptions[name] = setting[name];
                }
            });

            const control = {
                id: elID,
                host: el,
                canvas: canvas,
                pad: new SignaturePad(canvas, padOptions),
                placeholder: placeholder,
                setting: $object.clone(setting),
                ratio: 1,
                baseValue: null,
                loading: false,
                paintToken: 0,
                readOnly: setting.readOnly === true,
                disabled: false,
                observer: null,
                onWindowResize: null
            };

            padEvents.forEach(type => {
                control.pad.addEventListener(type, evt => {
                    if (type === 'beginStroke') {
                        control.placeholder.hidden = true;
                        notify(control, type, { originalEvent: evt.detail });
                    }
                    else {
                        refresh(control);
                        notify(control, type, { originalEvent: evt.detail });
                        notify(control, 'change', { value: module.getValue(elID) });
                    }
                });
            });

            this.signatureControls.push(control);

            applyState(control);
            layout(control, true);
            refresh(control);

            if (typeof ResizeObserver === 'function') {
                control.observer = new ResizeObserver(() => layout(control));
                control.observer.observe(el);
            }
            else {
                control.onWindowResize = () => layout(control);
                window.addEventListener('resize', control.onWindowResize);
            }

            return control;
        },

        // data URL 전체를 반환한다. 서명이 없으면 빈 문자열이다.
        getValue(elID, meta) {
            const control = this.getControl(elID);
            if (!control) {
                return null;
            }

            // setValue 이미지 로딩이 끝나기 전에는 캔버스가 비어 있으므로 요청받은 값을 그대로 돌려준다.
            if (control.loading) {
                return control.baseValue;
            }

            if (control.pad.isEmpty()) {
                return '';
            }

            const quality = $object.isNumber(control.setting.imageQuality) ? control.setting.imageQuality : undefined;
            return control.pad.toDataURL(control.setting.imageType, quality);
        },

        // 접두사('data:image/...;base64,')를 제외한 순수 base64 문자열을 반환한다.
        getBase64(elID) {
            const value = this.getValue(elID);
            return $object.isString(value) ? value.substring(value.indexOf(',') + 1) : value;
        },

        // data URL 또는 순수 base64 를 그린다(기존 내용은 교체). 빈 값이면 지운다. change 이벤트는 발생하지 않는다.
        // 이미지 로딩이 비동기이므로 Promise<boolean> 을 반환한다.
        setValue(elID, value, meta) {
            const control = this.getControl(elID);
            if (!control) {
                return Promise.resolve(false);
            }

            const dataUrl = normalize(value);
            if (dataUrl === null) {
                syn.$l.eventLog('$signaturepad.setValue', 'elID: "{0}" data URL 또는 base64 문자열이 아닌 값은 설정할 수 없습니다.'.format(elID), 'Warning');
                return Promise.resolve(false);
            }

            control.baseValue = dataUrl === '' ? null : dataUrl;
            return repaint(control, []);
        },

        clear(elID, isControlLoad) {
            const control = this.getControl(elID);
            if (control) {
                control.baseValue = null;
                repaint(control, []);
            }
        },

        isEmpty(elID) {
            const control = this.getControl(elID);
            return control ? control.pad.isEmpty() : true;
        },

        // 마지막 획을 취소한다. setValue 로 불러온 이미지는 취소 대상이 아니다. 취소하면 change 이벤트가 발생한다.
        undo(elID) {
            const control = this.getControl(elID);
            if (!control) {
                return false;
            }

            const strokes = control.pad.toData().slice();
            if (strokes.length === 0) {
                return false;
            }

            strokes.pop();
            repaint(control, strokes).then(() => notify(control, 'change', { value: module.getValue(elID) }));
            return true;
        },

        setPenColor(elID, color) {
            const control = this.getControl(elID);
            if (control) {
                control.pad.penColor = color;
                control.setting.penColor = color;
            }
        },

        setReadOnly(elID, isReadOnly) {
            const control = this.getControl(elID);
            if (control) {
                control.readOnly = isReadOnly !== false;
                applyState(control);
            }
        },

        setDisabled(elID, isDisabled) {
            const control = this.getControl(elID);
            if (control) {
                control.disabled = isDisabled !== false;
                applyState(control);
            }
        },

        // 표시 영역 크기가 바뀐 뒤 직접 맞춰야 할 때 호출한다(보통 자동 감지된다).
        resize(elID) {
            const control = this.getControl(elID);
            if (control) {
                layout(control, true);
            }
        },

        destroy(elID) {
            const control = this.getControl(elID);
            if (!control) {
                return;
            }

            control.pad.off();
            if (control.observer) {
                control.observer.disconnect();
            }

            if (control.onWindowResize) {
                window.removeEventListener('resize', control.onWindowResize);
            }

            control.canvas.remove();
            control.placeholder.remove();
            control.host.classList.remove('syn-signaturepad', 'syn-signaturepad-empty', 'syn-signaturepad-readonly', 'syn-signaturepad-disabled');
            this.signatureControls = this.signatureControls.filter(item => item.id !== elID);
        },

        getControl(elID) {
            return this.signatureControls.find(item => item.id === elID) || null;
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$signaturepad = module;
})(window);
