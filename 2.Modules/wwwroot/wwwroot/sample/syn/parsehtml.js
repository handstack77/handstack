'use strict';
let $parsehtml = {
    prop: {
        converter: null
    },

    hook: {
        extendLoad($this) {
            if (window.showdown) {
                $this.prop.converter = new showdown.Converter({
                    tables: true,
                    tasklists: true,
                    underline: true,
                    strikethrough: true,
                    simplifiedAutoLink: true,
                    simpleLineBreaks: true,
                    emoji: true
                });
                
                let texts = syn.$l.getTagName('text');
                if (texts) {
                    syn.$m.each(texts, (item) => {
                        item.outerHTML = $this.prop.converter.makeHtml(item.innerHTML);
                    });
                }
            }
            else {
                syn.$l.eventLog('extendLoad', '<script src="/lib/showdownjs@2.1.0/showdown.min.js"></script> 확인 필요', 'Warning');
            }

            if (window.hljs) {
                let codes = syn.$l.getTagName('code');
                if (codes) {
                    syn.$m.each(codes, (item) => {
                        item.outerHTML = hljs.highlight(item.innerHTML, { language: (item.getAttribute('language') || 'text') }).value;
                    });
                }
            }
            else {
                syn.$l.eventLog('extendLoad', '<script src="/lib/highlight.js@11.6.0/highlight.min.js"></script> 확인 필요', 'Warning');
            }
        }
    }
};
