/// <reference path='syn.core.js' />
/// <reference path='syn.library.js' />

(function (context) {
    'use strict';
    var $dimension = context.$dimension || new syn.module();
    var document = context.document;

    $dimension.extend({
        version: '1.0.0',

        getDocumentSize() {
            return {
                width: Math.max(
                    document.body.scrollWidth, document.documentElement.scrollWidth,
                    document.body.offsetWidth, document.documentElement.offsetWidth,
                    document.body.clientWidth, document.documentElement.clientWidth
                ),
                height: Math.max(
                    document.body.scrollHeight, document.documentElement.scrollHeight,
                    document.body.offsetHeight, document.documentElement.offsetHeight,
                    document.body.clientHeight, document.documentElement.clientHeight
                ),
                frameWidth: document.documentElement.clientWidth || document.body.clientWidth || 0,
                frameHeight: document.documentElement.clientHeight || document.body.clientHeight || 0
            };
        },

        getWindowSize() {
            return {
                width: globalRoot.innerWidth,
                height: globalRoot.innerHeight
            };
        },

        getScrollPosition(el) {
            var result = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                result = {
                    left: document.documentElement.scrollLeft || document.body.scrollLeft || 0,
                    top: document.documentElement.scrollTop || document.body.scrollTop || 0
                };
            }
            else {
                result = {
                    left: el.pageXOffset || el.scrollLeft || 0,
                    top: el.pageYOffset || el.scrollTop || 0
                };
            }

            return result;
        },

        getMousePosition(evt) {
            evt = evt || context.event || top.context.event;
            var scroll = syn.$d.getScrollPosition();
            return {
                x: evt.pageX || evt.clientX + scroll.left || 0,
                y: evt.pageY || evt.clientY + scroll.top || 0,
                relativeX: evt.layerX || evt.offsetX || 0,
                relativeY: evt.layerY || evt.offsetY || 0
            };
        },

        offset(el) {
            var result = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                var rect = el.getBoundingClientRect();
                var scrollLeft = context.pageXOffset || document.documentElement.scrollLeft;
                var scrollTop = context.pageYOffset || document.documentElement.scrollTop;
                result = {
                    top: rect.top + scrollTop,
                    left: rect.left + scrollLeft
                };
            }

            return result;
        },

        offsetLeft(el) {
            var result = 0;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                while (typeof el !== 'undefined' && el && el.parentElement !== context) {
                    if (el.offsetLeft) {
                        result += el.offsetLeft;
                    }
                    el = el.parentElement;
                }
            }

            return result;
        },

        parentOffsetLeft(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            el = el || top.document.documentElement || top.document.body;
            return el.parentElement === el.offsetParent ? el.offsetLeft : (syn.$d.offsetLeft(el) - syn.$d.offsetLeft(el.parentElement));
        },

        offsetTop(el) {
            var result = 0;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                while (typeof el !== 'undefined' && el && el.parentElement !== context) {
                    if (el.offsetTop) {
                        result += el.offsetTop;
                    }
                    el = el.parentElement;
                }
            }

            return result;
        },

        parentOffsetTop(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            el = el || top.document.documentElement || top.document.body;
            return el.parentElement === el.offsetParent ? el.offsetTop : (syn.$d.offsetTop(el) - syn.$d.offsetTop(el.parentElement));
        },

        getSize(el) {
            var result = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                var styles = context.getComputedStyle(el);
                result = {
                    width: el.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight),
                    height: el.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom),
                    clientWidth: el.clientWidth,
                    clientHeight: el.clientHeight,
                    offsetWidth: el.offsetWidth,
                    offsetHeight: el.offsetHeight,
                    marginWidth: el.offsetWidth + parseFloat(styles.marginLeft) + parseFloat(styles.marginRight),
                    marginHeight: el.offsetHeight + parseFloat(styles.marginTop) + parseFloat(styles.marginBottom),
                };
            }

            return result;
        },

        measureWidth(text, fontSize) {
            var el = document.createElement('div');

            el.style.position = 'absolute';
            el.style.visibility = 'hidden';
            el.style.whiteSpace = 'nowrap';
            el.style.left = '-9999px';

            if (fontSize) {
                el.style.fontSize = fontSize;
            }
            el.innerText = text;

            document.body.appendChild(el);
            var width = context.getComputedStyle(el).width;
            document.body.removeChild(el);
            return width;
        },

        measureHeight(text, width, fontSize) {
            var el = document.createElement('div');

            el.style.position = 'absolute';
            el.style.visibility = 'hidden';
            el.style.width = width;
            el.style.left = '-9999px';

            if (fontSize) {
                el.style.fontSize = fontSize;
            }
            el.innerText = text;

            document.body.appendChild(el);
            var height = context.getComputedStyle(el).height;
            document.body.removeChild(el);
            return height;
        },

        measureSize(text, fontSize, maxWidth) {
            maxWidth = maxWidth || '800px';
            if ($object.isNumber(maxWidth) == true) {
                maxWidth = maxWidth.toString() + 'px';
            }

            if ($object.isNullOrUndefined(text) == true) {
                return null;
            }

            var width = syn.$d.measureWidth(text, fontSize);
            if (width.endsWith('px') == true && $string.isNullOrEmpty(maxWidth) == false) {
                var calcWidth = $string.toNumber(width.substring(0, width.indexOf('px')));

                if (maxWidth.endsWith('px') == true) {
                    maxWidth = $string.toNumber(maxWidth.substring(0, maxWidth.indexOf('px')));
                }
                else {
                    maxWidth = $string.toNumber(maxWidth);
                }

                if (isNaN(maxWidth) == false) {
                    if (calcWidth > maxWidth) {
                        width = maxWidth.toString() + 'px';
                    }
                }
            }

            return {
                width: width,
                height: syn.$d.measureHeight(text, width, fontSize)
            };
        }
    });
    syn.$d = $dimension;
})(globalRoot);
