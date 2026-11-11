'use strict';
let $features = {
    method: {
        preview() {
            let color = syn.uicontrols.$colorpicker.getValue('clpBasic');
            let box = syn.$l.get('divPreview');
            box.style.backgroundColor = color || '';
            box.style.color = $this.method.isDark(color) == true ? '#fff' : '#000';
        },

        // 밝기를 계산해 어두운 색이면 글자를 흰색으로 바꾼다.
        isDark(hex) {
            let rgb = $this.method.toRgb(hex);
            return rgb == null ? false : (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 < 128;
        },

        toRgb(hex) {
            let match = /^#?([0-9a-f]{6})$/i.exec(hex || '');
            if (match == null) {
                return null;
            }

            let value = parseInt(match[1], 16);
            return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
        }
    },

    hook: {
        // syn-events 의 change 는 연결되지 않으므로, 색상이 바뀔 때마다 이벤트를 받도록 피커(CP)의 change 에 연결한다.
        pageComplete() {
            ['clpBasic', 'clpPalette', 'clpEmpty'].forEach((id) => {
                syn.uicontrols.$colorpicker.getControl(id).picker.on('change', () => {
                    syn.$l.eventLog(id + '_change', syn.uicontrols.$colorpicker.getValue(id));
                    if (id == 'clpBasic') {
                        $this.method.preview();
                    }
                });
            });
            $this.method.preview();
        }
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify({
                Basic: syn.uicontrols.$colorpicker.getValue('clpBasic'),
                Palette: syn.uicontrols.$colorpicker.getValue('clpPalette'),
                Empty: syn.uicontrols.$colorpicker.getValue('clpEmpty')
            }));
        },

        btnSetValue_click() {
            syn.uicontrols.$colorpicker.setValue('clpBasic', '#2FB344');
            $this.method.preview();
        },

        btnClear_click() {
            ['clpBasic', 'clpPalette', 'clpEmpty'].forEach((id) => {
                syn.uicontrols.$colorpicker.clear(id);
            });
            $this.method.preview();
        },

        btnGetControl_click() {
            let control = syn.uicontrols.$colorpicker.getControl('clpBasic');
            syn.$l.eventLog('btnGetControl_click', `id: ${control.id}, picker: ${control.picker ? 'CP' : '(없음)'}, defaultColor: ${control.setting.defaultColor}`);
        },

        btnConvert_click() {
            let rgb = $this.method.toRgb(syn.uicontrols.$colorpicker.getValue('clpBasic'));
            syn.$l.eventLog('btnConvert_click', rgb == null ? '색상을 선택하세요.' : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b}) / 어두운 색: ${$this.method.isDark(syn.uicontrols.$colorpicker.getValue('clpBasic'))}`);
        }
    }
}
