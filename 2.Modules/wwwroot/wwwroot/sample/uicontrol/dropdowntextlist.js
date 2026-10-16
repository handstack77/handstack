'use strict';
let $dropdowntextlist = {
    prop: {
        saved: [],
        options: [
            { class: 'mammal', value: 'dog', name: 'Dog' },
            { class: 'mammal', value: 'cat', name: 'Cat' },
            { class: 'mammal', value: 'horse', name: 'Horse' },
            { class: 'mammal', value: 'kangaroo', name: 'Kangaroo' },
            { class: 'bird', value: 'duck', name: 'Duck' },
            { class: 'bird', value: 'chicken', name: 'Chicken' },
            { class: 'bird', value: 'ostrich', name: 'Ostrich' },
            { class: 'bird', value: 'seagull', name: 'Seagull' },
            { class: 'reptile', value: 'snake', name: 'Snake' },
            { class: 'reptile', value: 'lizard', name: 'Lizard' },
            { class: 'reptile', value: 'alligator', name: 'Alligator' },
            { class: 'reptile', value: 'turtle', name: 'Turtle' }
        ]
    },
    hook: {
        controlInit(elID) {
            if (elID === 'remote') return {
                load(query, callback) {
                    setTimeout(() => callback($this.prop.options.filter(option => option.name.toLowerCase().includes(query.toLowerCase()))), 200);
                }
            };
        },
        pageLoad() {
            const control = syn.uicontrols.$dropdowntextlist.getControl('animals');

            [
                'item_add',
                'item_remove',
                'item_select',
                'clear',
                'option_add',
                'option_remove',
                'option_clear',
                'optgroup_add',
                'optgroup_remove',
                'optgroup_clear',
                'dropdown_open',
                'dropdown_close',
                'focus',
                'blur',
                'type',
                'load',
                'destroy'
            ].forEach(name => {
                control.on(name, (...args) => $this.method.log(name, args));
            });
            control.setValue($this.prop.options);
            syn.uicontrols.$dropdowntextlist.setValue('defaultSize', $this.prop.options);
            syn.uicontrols.$dropdowntextlist.setValue('autoSize', $this.prop.options);
            syn.uicontrols.$dropdowntextlist.setValue('fixedSize', $this.prop.options);
            syn.uicontrols.$dropdowntextlist.setValue('periods', [
                { class: 'status', value: 'open', name: '진행' },
                { class: 'status', value: 'done', name: '완료' }
            ]);
            syn.uicontrols.$dropdowntextlist.setValue('texts', [
                { class: 'user', value: 'U01', name: '김선임' },
                { class: 'user', value: 'U02', name: '박대리' },
                { class: 'dept', value: 'D01', name: '작업실' }
            ]);
        }
    },
    event: {
        animals_initialize() {
            document.getElementById('events').textContent = 'initialize\n';
        },

        // 조건 편집창의 적용으로 논리·연산자가 바뀐 항목 하나와 변경 전 값을 받는다.
        animals_option_change(item, previous) {
            $this.method.log('option_change', [item, previous]);
        },

        animals_change(value) {
            document.getElementById('result').textContent = JSON.stringify(value, null, 2);
            document.getElementById('summary').textContent = syn.uicontrols.$dropdowntextlist.getSummaryText('animals');
            $this.method.log('change', value);
        },

        periods_change(value) {
            document.getElementById('periodResult').textContent = JSON.stringify(value, null, 2);
            document.getElementById('periodSummary').textContent = syn.uicontrols.$dropdowntextlist.getSummaryText('periods');
        },

        texts_change(value, normalText) {
            document.getElementById('textValue').textContent = JSON.stringify(value, null, 2);
            document.getElementById('textResult').textContent = JSON.stringify(normalText, null, 2);
            document.getElementById('textSummary').textContent = syn.uicontrols.$dropdowntextlist.getSummaryText('texts');
        },

        btnTextAdd_click() {
            syn.uicontrols.$dropdowntextlist.addItem('texts', '작업실');
            syn.uicontrols.$dropdowntextlist.addItem('texts', '이름:홍길동');
            syn.uicontrols.$dropdowntextlist.addItem('texts', '시각:09:30');
        },

        btnTextSet_click() {
            syn.uicontrols.$dropdowntextlist.setNormalText('texts', [
                { logic: 'AND', operator: 'contains', key: '', value: '블라블라' },
                { logic: 'OR', operator: 'begins_with', key: '메모', value: '긴급' },
                '비고:확인 필요'
            ]);
        },

        btnTextRestore_click() {
            $this.prop.savedTexts = syn.uicontrols.$dropdowntextlist.getNormalText('texts');
            syn.uicontrols.$dropdowntextlist.setNormalText('texts', []);
            syn.uicontrols.$dropdowntextlist.setNormalText('texts', $this.prop.savedTexts);
        },

        btnTextClear_click() {
            syn.uicontrols.$dropdowntextlist.setNormalText('texts', []);
        },

        btnRangeSet_click() {
            syn.uicontrols.$dropdowntextlist.setRange('periods', 'createdAt', '2026-10-01', '2026-10-31');
        },

        btnRangeSingle_click() {
            syn.uicontrols.$dropdowntextlist.setRange('periods', 'createdAt', '2026-10-15', '2026-10-15');
        },

        btnRangeMonth_click() {
            syn.uicontrols.$dropdowntextlist.setRange('periods', 'closingMonth', '2026-10', '2026-12');
        },

        btnRangeTime_click() {
            syn.uicontrols.$dropdowntextlist.setRange('periods', 'workTime', '09:30', '23:59');
        },

        btnRangeClear_click() {
            syn.uicontrols.$dropdowntextlist.setRange('periods', 'createdAt', '', '');
        },

        btnRangeRestore_click() {
            $this.prop.savedPeriods = syn.uicontrols.$dropdowntextlist.getValue('periods');
            syn.uicontrols.$dropdowntextlist.clear('periods');
            syn.uicontrols.$dropdowntextlist.setValue('periods', $this.prop.savedPeriods);
        },

        btnSource_click() {
            syn.uicontrols.$dropdowntextlist.setValue('animals', $this.prop.options);
        },
        btnSelect_click() {
            syn.uicontrols.$dropdowntextlist.addItem('animals', { groupID: 'mammal', key: 'dog' });
        },

        btnSave_click() {
            $this.prop.saved = syn.uicontrols.$dropdowntextlist.getValue('animals'); $this.method.log('saved', $this.prop.saved);
        },

        btnRestore_click() {
            syn.uicontrols.$dropdowntextlist.setValue('animals', $this.prop.saved);
        },

        btnClear_click() {
            syn.uicontrols.$dropdowntextlist.clear('animals');
        },

        btnUpdate_click() {
            syn.uicontrols.$dropdowntextlist.updateOption('animals', 'dog', { class: 'mammal', value: 'dog', name: '강아지' });
        },

        btnLock_click() {
            const c = syn.uicontrols.$dropdowntextlist.getControl('animals'); c.picker.isLocked ? c.unlock() : c.lock();
        },

        btnDisable_click() {
            const c = syn.uicontrols.$dropdowntextlist.getControl('animals'); c.picker.isDisabled ? c.enable() : c.disable();
        }
    },
    method: {
        log(name, value) {
            const log = document.getElementById('events');
            const text = JSON.stringify(value, (key, item) => item instanceof HTMLElement ? '<' + item.tagName.toLowerCase() + '>' : item);
            log.textContent = (name + ' ' + (text || '') + '\n' + log.textContent).slice(0, 10000);
        }
    }
};
