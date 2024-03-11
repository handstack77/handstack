'use strict';
let $main = {
    prop: {
    },

    hook: {
        async pageLoad() {
            $this.prop.clientIP = await syn.$w.apiHttp('/checkip').send();
        },
    },

    event: {
    },

    method: {
    }
}
