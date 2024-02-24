'use strict';
let $SYS030 = {
    config: {
        actionButtons: [{
            icon: 'news',
            class: 'btn-primary',
            action(evt) {
                debugger;
            }
        },
        {
            icon: 'search',
            action(evt) {
                debugger;
            }
        },
        {
            icon: 'edit',
            action(evt) {
                debugger;
            }
        },
        {
            icon: 'trash',
            action(evt) {
                debugger;
            }
        },
        {
            icon: 'printer',
            action(evt) {
                debugger;
            }
        },
        {
            icon: 'file-export',
            action(evt) {
                debugger;
            }
        },
        {
            icon: 'refresh',
            action(evt) {
                debugger;
            }
        }]
    },

    prop: {
        menus: null
    },

    transaction: {
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
        },

        pageMatch(classInfix) {
        },
    },

    event: {
    },

    method: {
    },
}
