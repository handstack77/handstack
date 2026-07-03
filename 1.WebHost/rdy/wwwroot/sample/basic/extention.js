'use strict';
let $extention = {
    config: {
        CUSTOM1: 'CUSTOM1',
        CUSTOM2: 'CUSTOM2',
        CUSTOM3: 'CUSTOM3',
    },

    event: {
        btnHelloWorld_click() {
            alert('반갑습니다 !, ' + $this.config.CUSTOM1);
        }
    },
};
