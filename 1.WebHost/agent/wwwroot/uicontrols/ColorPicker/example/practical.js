'use strict';
let $practical = {
    prop: {
        defaults: { clpPrimary: '#206BC4', clpAccent: '#F76707', clpBackground: '#F5F7FB' }
    },

    hook: {
        // syn-events 의 change 는 연결되지 않으므로, 색상이 바뀔 때마다 미리보기를 갱신하도록 피커(CP)의 change 에 연결한다.
        pageComplete() {
            Object.keys($this.prop.defaults).forEach((id) => {
                syn.uicontrols.$colorpicker.getControl(id).picker.on('change', () => { $this.method.apply(); });
                syn.$l.addEvent(id, 'input', () => { $this.method.apply(); });
            });
            $this.method.apply();
        }
    },

    method: {
        value(elID) {
            return syn.uicontrols.$colorpicker.getValue(elID);
        },

        toRgb(hex) {
            let match = /^#?([0-9a-f]{6})$/i.exec(hex || '');
            if (match == null) {
                return null;
            }

            let value = parseInt(match[1], 16);
            return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
        },

        // 상대 휘도(WCAG)로 두 색의 명도 대비를 계산한다. 4.5 이상이면 일반 글자에도 읽기 좋은 수준이다.
        luminance(hex) {
            let rgb = $this.method.toRgb(hex);
            if (rgb == null) {
                return null;
            }

            let channel = (v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
        },

        contrast(hexA, hexB) {
            let a = $this.method.luminance(hexA);
            let b = $this.method.luminance(hexB);
            if (a == null || b == null) {
                return null;
            }

            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        },

        // 선택한 색상을 미리보기에 적용하고, 흰 글자가 주 색상 위에서 잘 읽히는지 대비를 확인한다.
        apply() {
            let primary = $this.method.value('clpPrimary');
            let accent = $this.method.value('clpAccent');
            let background = $this.method.value('clpBackground');

            syn.$l.get('divPreviewBox').style.backgroundColor = background || '';
            syn.$l.get('divPreviewHeader').style.backgroundColor = primary || '';
            syn.$l.get('divPreviewHeader').style.color = '#fff';
            syn.$l.get('btnPreviewPrimary').style.backgroundColor = primary || '';
            syn.$l.get('spnPreviewBadge').style.backgroundColor = accent || '';

            let ratio = $this.method.contrast(primary, '#FFFFFF');
            let label = syn.$l.get('divContrast');
            if (ratio == null) {
                label.innerText = '주 색상을 선택하세요.';
                return;
            }

            label.innerText = `주 색상과 흰색 글자의 명도 대비 ${ratio.toFixed(1)}:1 (${ratio >= 4.5 ? '읽기 좋음' : '글자가 잘 보이지 않을 수 있음'})`;
            label.classList.toggle('text-danger', ratio < 4.5);
        },

        save() {
            let primary = $this.method.value('clpPrimary');
            let accent = $this.method.value('clpAccent');
            if ($string.isNullOrEmpty(primary) == true) {
                syn.$w.alert('주 색상 항목은 반드시 선택 해야합니다.');
                return;
            }

            if ($string.isNullOrEmpty(accent) == true) {
                syn.$w.alert('강조 색상 항목은 반드시 선택 해야합니다.');
                return;
            }

            if (primary.toUpperCase() == accent.toUpperCase()) {
                syn.$w.alert('주 색상과 강조 색상은 서로 달라야 합니다.');
                return;
            }

            let data = { PrimaryColor: primary, AccentColor: accent, BackgroundColor: $this.method.value('clpBackground') };
            syn.$l.get('preResult').innerText = JSON.stringify(data, null, 2);
            syn.$l.eventLog('save', '테마 색상을 저장했습니다: ' + JSON.stringify(data));
        },

        reset() {
            Object.keys($this.prop.defaults).forEach((id) => {
                syn.uicontrols.$colorpicker.setValue(id, $this.prop.defaults[id]);
            });
            $this.method.apply();
            syn.$l.get('preResult').innerText = '저장 버튼을 누르면 선택한 색상이 JSON 으로 표시됩니다.';
        }
    },

    event: {
        btnSave_click() { $this.method.save(); },
        btnReset_click() { $this.method.reset(); }
    }
}
