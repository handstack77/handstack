'use strict';
let $main = {
    prop: {
    },

    hook: {
        async pageLoad() {
            $this.prop.clientIP = await syn.$w.apiHttp('/wwwroot/api/index/client-ip').send();
        },
    },

    event: {
    },

    method: {
    }
}
