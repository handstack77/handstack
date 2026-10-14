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
            syn.uicontrols.$dropdowntextlist.setValue('autoSize', $this.prop.options);
            syn.uicontrols.$dropdowntextlist.setValue('fixedSize', $this.prop.options);
        }
    },
    event: {
        animals_initialize() {
            document.getElementById('events').textContent = 'initialize\n';
        },

        animals_change(value) {
            document.getElementById('result').textContent = JSON.stringify(value, null, 2);
            $this.method.log('change', value);
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
