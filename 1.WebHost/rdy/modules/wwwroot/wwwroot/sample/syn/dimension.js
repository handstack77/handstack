'use strict';
let $dimension = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$d.version;
        }
    },

    event: {
        btn_getDocumentSize_click() {
            syn.$l.get('txt_getDocumentSize').value = JSON.stringify(syn.$d.getDocumentSize());
        },

        btn_getWindowSize_click() {
            syn.$l.get('txt_getWindowSize').value = JSON.stringify(syn.$d.getWindowSize());
        },

        btn_getScrollPosition_click() {
            syn.$l.get('txt_getScrollPosition').value = JSON.stringify(syn.$d.getScrollPosition('btn_getScrollPosition'));
        },

        btn_getMousePosition_click(evt) {
            syn.$l.get('txt_getMousePosition').value = JSON.stringify(syn.$d.getMousePosition(evt));
        },

        btn_offset_click(evt) {
            syn.$l.get('txt_offset').value = JSON.stringify(syn.$d.offset('btn_offset'));
        },

        btn_offsetLeft_click(evt) {
            syn.$l.get('txt_offsetLeft').value = JSON.stringify(syn.$d.offsetLeft('btn_offsetLeft'));
        },

        btn_parentOffsetLeft_click(evt) {
            syn.$l.get('txt_parentOffsetLeft').value = JSON.stringify(syn.$d.parentOffsetLeft('btn_parentOffsetLeft'));
        },

        btn_offsetTop_click(evt) {
            syn.$l.get('txt_offsetTop').value = JSON.stringify(syn.$d.offsetTop('btn_offsetTop'));
        },

        btn_parentOffsetTop_click(evt) {
            syn.$l.get('txt_parentOffsetTop').value = JSON.stringify(syn.$d.parentOffsetTop('btn_parentOffsetTop'));
        },

        btn_getSize_click(evt) {
            syn.$l.get('txt_getSize').value = JSON.stringify(syn.$d.getSize('btn_getSize'));
        },

        btn_measureWidth_click(evt) {
            syn.$l.get('txt_measureWidth').value = JSON.stringify(syn.$d.measureWidth('hello world', '14px'));
        },

        btn_measureHeight_click(evt) {
            syn.$l.get('txt_measureHeight').value = JSON.stringify(syn.$d.measureHeight('hello world', '14px'));
        },

        btn_measureSize_click(evt) {
            syn.$l.get('txt_measureSize').value = JSON.stringify(syn.$d.measureSize('hello world', '14px'));
        }
    }
};
