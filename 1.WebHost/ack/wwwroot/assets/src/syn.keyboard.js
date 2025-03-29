(function (context) {
    'use strict';
    const $keyboard = context.$keyboard || new syn.module();
    const $o = context.$object;
    const $l = context.$library;

    $keyboard.extend({
        keyCodes: Object.freeze({
            'backspace': 8, 'tab': 9, 'enter': 13, 'shift': 16, 'control': 17, 'alt': 18, 'capslock': 20,
            'escape': 27, 'space': 32, 'pageup': 33, 'pagedown': 34, 'end': 35, 'home': 36,
            'left': 37, 'up': 38, 'right': 39, 'down': 40, 'delete': 46,
            'semicolon': 186, 'colon': 186, 'equal': 187, 'plus': 187, 'comma': 188, 'less': 188,
            'minus': 189, 'underscore': 189, 'period': 190, 'greater': 190, 'slash': 191, 'questionmark': 191,
            'backtick': 192, 'tilde': 192, 'openingsquarebracket': 219, 'openingcurlybracket': 219,
            'backslash': 220, 'pipe': 220, 'closingsquarebracket': 221, 'closingcurlybracket': 221,
            'singlequote': 222, 'doublequote': 222,
            'clear': 12, 'meta': 91, 'contextmenu': 93,
            'numpad0': 96, 'numpad1': 97, 'numpad2': 98, 'numpad3': 99, 'numpad4': 100, 'numpad5': 101,
            'numpad6': 102, 'numpad7': 103, 'numpad8': 104, 'numpad9': 105,
            'multiply': 106, 'add': 107, 'subtract': 109, 'decimal': 110, 'divide': 111,
            '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
            'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74,
            'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84,
            'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90,
            'f1': 112, 'f2': 113, 'f3': 114, 'f4': 115, 'f5': 116, 'f6': 117, 'f7': 118, 'f8': 119,
            'f9': 120, 'f10': 121, 'f11': 122, 'f12': 123
        }),

        targetEL: null,
        elements: {},

        setElement(el) {
            el = syn.$l.getElement(el);
            if (!el) return this;

            const eventID = el.id || el.nodeName || `el_${$l.random()}`;
            el.eventID = eventID;

            if (!this.elements[eventID]) {
                const keyObject = {
                    keydown: {},
                    keyup: {}
                };

                const handler = (evt) => {
                    const eventType = evt.type;
                    const keyCode = evt.keyCode || evt.key;
                    const callback = keyObject[eventType]?.[keyCode];

                    if (typeof callback === 'function') {
                        context.keyboardEvent = evt;
                        context.documentEvent = evt;

                        const result = callback(evt);
                        if (result === false) {
                            evt.preventDefault();
                            evt.stopPropagation();
                            return false;
                        }
                    }
                };

                syn.$l.addEvent(el, 'keydown', handler);
                syn.$l.addEvent(el, 'keyup', handler);
                this.elements[eventID] = keyObject;
            }

            this.targetEL = el;
            return this;
        },

        addKeyCode(keyType, keyCode, func) {
            if (this.targetEL?.eventID && this.elements[this.targetEL.eventID]?.[keyType] && typeof func === 'function') {
                this.elements[this.targetEL.eventID][keyType][keyCode] = func;
            }
            return this;
        },

        removeKeyCode(keyType, keyCode) {
            if (this.targetEL?.eventID && this.elements[this.targetEL.eventID]?.[keyType]?.[keyCode]) {
                delete this.elements[this.targetEL.eventID][keyType][keyCode];
            }
            return this;
        }
    });
    context.$keyboard = syn.$k = $keyboard;
})(globalRoot);
