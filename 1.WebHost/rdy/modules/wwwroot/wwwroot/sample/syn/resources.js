'use strict';
let $resources = {
    prop: {
        childrenChannel: null
    },

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = $resource.version;
        }
    },

    event: {
    }
}
