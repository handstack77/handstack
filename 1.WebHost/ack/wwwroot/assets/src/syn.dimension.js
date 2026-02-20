(function (context) {
    'use strict';
    const $dimension = context.$dimension || new syn.module();
    const doc = context.document;

    $dimension.extend({
        getDocumentSize(isTopWindow = false) {
            const currentDoc = $string.toBoolean(isTopWindow) ? top.document : doc;
            if (!currentDoc?.body || !currentDoc?.documentElement) return { width: 0, height: 0, frameWidth: 0, frameHeight: 0 };

            return {
                width: Math.max(
                    currentDoc.body.scrollWidth, currentDoc.documentElement.scrollWidth,
                    currentDoc.body.offsetWidth, currentDoc.documentElement.offsetWidth,
                    currentDoc.body.clientWidth, currentDoc.documentElement.clientWidth
                ),
                height: Math.max(
                    currentDoc.body.scrollHeight, currentDoc.documentElement.scrollHeight,
                    currentDoc.body.offsetHeight, currentDoc.documentElement.offsetHeight,
                    currentDoc.body.clientHeight, currentDoc.documentElement.clientHeight
                ),
                frameWidth: currentDoc.documentElement.clientWidth || currentDoc.body.clientWidth || 0,
                frameHeight: currentDoc.documentElement.clientHeight || currentDoc.body.clientHeight || 0
            };
        },

        getWindowSize(isTopWindow = false) {
            const currentWindow = $string.toBoolean(isTopWindow) ? top.window : context;
            return {
                width: currentWindow?.innerWidth ?? 0,
                height: currentWindow?.innerHeight ?? 0
            };
        },

        getScrollPosition(el) {
            el = syn.$l.getElement(el);
            if (el) {
                return {
                    left: el.pageXOffset ?? el.scrollLeft ?? 0,
                    top: el.pageYOffset ?? el.scrollTop ?? 0
                };
            } else if (doc) {
                return {
                    left: doc.documentElement?.scrollLeft ?? doc.body?.scrollLeft ?? 0,
                    top: doc.documentElement?.scrollTop ?? doc.body?.scrollTop ?? 0
                };
            }
            return { left: 0, top: 0 };
        },


        getMousePosition(evt) {
            const event = evt || context.event || top?.event;
            if (!event) return { x: 0, y: 0, relativeX: 0, relativeY: 0 };

            const scroll = this.getScrollPosition();
            return {
                x: event.pageX ?? (event.clientX + scroll.left) ?? 0,
                y: event.pageY ?? (event.clientY + scroll.top) ?? 0,
                relativeX: event.layerX ?? event.offsetX ?? 0,
                relativeY: event.layerY ?? event.offsetY ?? 0
            };
        },

        offset(el) {
            el = syn.$l.getElement(el);
            if (!el?.getBoundingClientRect) return null;

            const rect = el.getBoundingClientRect();
            const scrollLeft = context.pageXOffset || doc?.documentElement?.scrollLeft || 0;
            const scrollTop = context.pageYOffset || doc?.documentElement?.scrollTop || 0;

            return {
                top: rect.top + scrollTop,
                left: rect.left + scrollLeft
            };
        },

        offsetLeft(el) {
            el = syn.$l.getElement(el);
            let result = 0;
            while (el && el.offsetParent) {
                result += el.offsetLeft;
                el = el.offsetParent;
            }
            return result;
        },

        parentOffsetLeft(el) {
            el = syn.$l.getElement(el) || doc?.documentElement || doc?.body;
            if (!el?.parentElement) return 0;
            return el.parentElement === el.offsetParent
                ? el.offsetLeft
                : (this.offsetLeft(el) - this.offsetLeft(el.parentElement));
        },

        offsetTop(el) {
            el = syn.$l.getElement(el);
            let result = 0;
            while (el && el.offsetParent) {
                result += el.offsetTop;
                el = el.offsetParent;
            }
            return result;
        },

        parentOffsetTop(el) {
            el = syn.$l.getElement(el) || doc?.documentElement || doc?.body;
            if (!el?.parentElement) return 0;
            return el.parentElement === el.offsetParent
                ? el.offsetTop
                : (this.offsetTop(el) - this.offsetTop(el.parentElement));
        },

        getSize(el) {
            el = syn.$l.getElement(el);
            if (!el || !context.getComputedStyle) return null;

            const styles = context.getComputedStyle(el);
            const paddingLeft = parseFloat(styles.paddingLeft) || 0;
            const paddingRight = parseFloat(styles.paddingRight) || 0;
            const paddingTop = parseFloat(styles.paddingTop) || 0;
            const paddingBottom = parseFloat(styles.paddingBottom) || 0;
            const marginLeft = parseFloat(styles.marginLeft) || 0;
            const marginRight = parseFloat(styles.marginRight) || 0;
            const marginTop = parseFloat(styles.marginTop) || 0;
            const marginBottom = parseFloat(styles.marginBottom) || 0;

            return {
                width: el.clientWidth - paddingLeft - paddingRight,
                height: el.clientHeight - paddingTop - paddingBottom,
                clientWidth: el.clientWidth,
                clientHeight: el.clientHeight,
                offsetWidth: el.offsetWidth,
                offsetHeight: el.offsetHeight,
                marginWidth: el.offsetWidth + marginLeft + marginRight,
                marginHeight: el.offsetHeight + marginTop + marginBottom,
            };
        },

        measureWidth(text, fontSize) {
            if (!doc?.body) return '0px';
            const el = doc.createElement('div');
            Object.assign(el.style, {
                position: 'absolute',
                visibility: 'hidden',
                whiteSpace: 'nowrap',
                left: '-9999px',
                fontSize: fontSize || 'inherit'
            });
            el.textContent = text;

            doc.body.appendChild(el);
            const width = context.getComputedStyle(el).width;
            doc.body.removeChild(el);
            return width;
        },

        measureHeight(text, width, fontSize) {
            if (!doc?.body) return '0px';
            const el = doc.createElement('div');
            Object.assign(el.style, {
                position: 'absolute',
                visibility: 'hidden',
                width: width || 'auto',
                left: '-9999px',
                fontSize: fontSize || 'inherit',
                wordWrap: 'break-word'
            });
            el.textContent = text;

            doc.body.appendChild(el);
            const height = context.getComputedStyle(el).height;
            doc.body.removeChild(el);
            return height;
        },

        measureSize(text, fontSize, maxWidth = '800px') {
            if (text === undefined || text === null) return null;

            let effectiveMaxWidth = maxWidth;
            if ($object.isNumber(maxWidth)) {
                effectiveMaxWidth = `${maxWidth}px`;
            }

            let measuredWidth = this.measureWidth(text, fontSize);
            let numericWidth = 0;
            let numericMaxWidth = Infinity;

            if (measuredWidth.endsWith('px')) {
                numericWidth = $string.toNumber(measuredWidth.slice(0, -2));
            }

            if (effectiveMaxWidth.endsWith('px')) {
                numericMaxWidth = $string.toNumber(effectiveMaxWidth.slice(0, -2));
            } else {
                numericMaxWidth = $string.toNumber(effectiveMaxWidth);
            }

            if (!isNaN(numericMaxWidth) && numericWidth > numericMaxWidth) {
                measuredWidth = `${numericMaxWidth}px`;
            }

            const measuredHeight = this.measureHeight(text, measuredWidth, fontSize);

            return {
                width: measuredWidth,
                height: measuredHeight
            };
        }
    });
    context.$dimension = syn.$d = $dimension;
})(globalRoot);
