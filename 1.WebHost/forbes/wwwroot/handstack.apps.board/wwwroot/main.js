'use strict';
let $main = {
    prop: {
    },

    hook: {
        async pageLoad() {
            $this.prop.clientIP = await syn.$b.getIpAddress();
        },
    },

    event: {
    },

    method: {
    }
}
