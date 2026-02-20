(function (context) {
    'use strict';
    const $keyboard = context.$keyboard || new syn.module();
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

        keyNames: Object.freeze({
            'Backspace': 'backspace',
            'Tab': 'tab',
            'Enter': 'enter',
            'ShiftLeft': 'shift',
            'ShiftRight': 'shift',
            'ControlLeft': 'control',
            'ControlRight': 'control',
            'AltLeft': 'alt',
            'AltRight': 'alt',
            'CapsLock': 'capslock',
            'Escape': 'escape',
            'Space': 'space',
            'PageUp': 'pageup',
            'PageDown': 'pagedown',
            'End': 'end',
            'Home': 'home',
            'ArrowLeft': 'left',
            'ArrowUp': 'up',
            'ArrowRight': 'right',
            'ArrowDown': 'down',
            'Delete': 'delete',
            'Semicolon': 'semicolon',
            'Equal': 'equal',
            'Comma': 'comma',
            'Minus': 'minus',
            'Period': 'period',
            'Slash': 'slash',
            'Backquote': 'backtick',
            'BracketLeft': 'openingsquarebracket',
            'Backslash': 'backslash',
            'BracketRight': 'closingsquarebracket',
            'Quote': 'singlequote',
            'Clear': 'clear',
            'MetaLeft': 'meta',
            'MetaRight': 'meta',
            'ContextMenu': 'contextmenu',
            'Numpad0': 'numpad0',
            'Numpad1': 'numpad1',
            'Numpad2': 'numpad2',
            'Numpad3': 'numpad3',
            'Numpad4': 'numpad4',
            'Numpad5': 'numpad5',
            'Numpad6': 'numpad6',
            'Numpad7': 'numpad7',
            'Numpad8': 'numpad8',
            'Numpad9': 'numpad9',
            'NumpadMultiply': 'multiply',
            'NumpadAdd': 'add',
            'NumpadSubtract': 'subtract',
            'NumpadDecimal': 'decimal',
            'NumpadDivide': 'divide',
            'Digit0': '0',
            'Digit1': '1',
            'Digit2': '2',
            'Digit3': '3',
            'Digit4': '4',
            'Digit5': '5',
            'Digit6': '6',
            'Digit7': '7',
            'Digit8': '8',
            'Digit9': '9',
            'KeyA': 'a',
            'KeyB': 'b',
            'KeyC': 'c',
            'KeyD': 'd',
            'KeyE': 'e',
            'KeyF': 'f',
            'KeyG': 'g',
            'KeyH': 'h',
            'KeyI': 'i',
            'KeyJ': 'j',
            'KeyK': 'k',
            'KeyL': 'l',
            'KeyM': 'm',
            'KeyN': 'n',
            'KeyO': 'o',
            'KeyP': 'p',
            'KeyQ': 'q',
            'KeyR': 'r',
            'KeyS': 's',
            'KeyT': 't',
            'KeyU': 'u',
            'KeyV': 'v',
            'KeyW': 'w',
            'KeyX': 'x',
            'KeyY': 'y',
            'KeyZ': 'z',
            'F1': 'f1',
            'F2': 'f2',
            'F3': 'f3',
            'F4': 'f4',
            'F5': 'f5',
            'F6': 'f6',
            'F7': 'f7',
            'F8': 'f8',
            'F9': 'f9',
            'F10': 'f10',
            'F11': 'f11',
            'F12': 'f12'
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
        },

        getKeyCode(code) {
            const keyName = $keyboard.keyNames[code];
            if (keyName) {
                return $keyboard.keyCodes[keyName];
            }

            return null;
        }
    });
    context.$keyboard = syn.$k = $keyboard;
})(globalRoot);
