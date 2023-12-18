/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $manipulation = context.$manipulation || new syn.module();
    var document = context.document;

    $manipulation.extend({
        version: '1.0.0',

        body() {
            return document;
        },

        documentElement() {
            return document.documentElement;
        },

        childNodes(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.childNodes;
        },

        children(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.children;
        },

        firstChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.firstChild;
        },

        firstElementChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.firstElementChild;
        },

        lastChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.lastChild;
        },

        lastElementChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.lastElementChild;
        },

        nextSibling(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.nextSibling;
        },

        nextElementSibling(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.nextElementSibling;
        },

        previousSibling(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.previousSibling;
        },

        previousElementSibling(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.previousElementSibling;
        },

        siblings(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return [].slice.call(el.parentElement.children).filter(function (child) {
                return child !== el;
            });
        },

        parentNode(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.parentNode;
        },

        parentElement(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.parentElement;
        },

        value(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            else {
                el.value = $string.toValue(value);
            }
            return el.value;
        },

        textContent(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            else {
                el.textContent = $string.toValue(value);
            }
            return el.textContent;
        },

        innerText(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            else {
                el.innerText = $string.toValue(value);
            }
            return el.innerText;
        },

        innerHTML(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            else {
                el.innerHTML = $string.toValue(value);
            }
            return el.innerHTML;
        },

        outerHTML(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.outerHTML;
        },

        className(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.className;
        },

        removeAttribute(el, prop) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.removeAttribute(prop);
        },

        getAttribute(el, prop) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.getAttribute(prop);
        },

        setAttribute(el, prop, val) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.setAttribute(prop, val);
        },

        appendChild(el, node) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.appendChild(node);
        },

        setStyle(el, prop, val) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                el.style[prop] = val;
            }
            return $manipulation;
        },

        addCssText(el, cssText) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                el.style.cssText = cssText;
            }
            return $manipulation;
        },

        addStyle(el, objects) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                for (var prop in objects) {
                    $manipulation.setStyle(el, prop, objects[prop]);
                }
            }
            return $manipulation;
        },

        getStyle(el, prop) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.style[prop];
        },

        hasHidden(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            return (el == null || el.offsetParent == null || context.getComputedStyle(el)['display'] == 'none');
        },

        getComputedStyle(el, prop) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return context.getComputedStyle(el)[prop];
        },

        addClass(el, css) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;

            if ($object.isNullOrUndefined(el) == false) {
                if ($string.isNullOrEmpty(css) == false) {
                    if (css.indexOf(' ') > -1) {
                        var classList = css.split(' ');
                        for (var i = 0, length = classList.length; i < length; i++) {
                            var cssItem = classList[i];
                            if ($string.isNullOrEmpty(cssItem) == false) {
                                if ($manipulation.hasClass(el, cssItem) == false) {
                                    if (el.classList && el.classList.add) {
                                        el.classList.add(cssItem);
                                    }
                                    else {
                                        el.className = (el.className + ' ' + cssItem).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if ($manipulation.hasClass(el, css) == false) {
                            if (el.classList && el.classList.add) {
                                el.classList.add(css);
                            }
                            else {
                                el.className = (el.className + ' ' + css).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                            }
                        }
                    }
                }
            }

            return $manipulation;
        },

        hasClass(el, css) {
            var result = false;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if (el.classList && el.classList.contains) {
                    result = el.classList.contains(css);
                }
                else {
                    result = syn.$m.getClassRegEx(css).test(el.className);
                }
            }

            return result;
        },

        toggleClass(el, css) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if (el.classList && el.classList.toggle) {
                    el.classList.toggle(css);
                }
            }

            return $manipulation;
        },

        removeClass(el, css) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if (css === undefined) {
                    el.className = '';
                }
                else {
                    if (el.classList && el.classList.remove) {
                        el.classList.remove(css);
                    }
                    else {
                        var re = syn.$m.getClassRegEx(css);
                        el.className = el.className.replace(re, '');
                        re = null;
                    }

                }
            }

            return $manipulation;
        },

        append(baseEl, tag, elID, options) {
            var el = null;
            baseEl = $object.isString(baseEl) == true ? syn.$l.get(baseEl) : baseEl;
            if ($object.isNullOrUndefined(baseEl) == false && $string.isNullOrEmpty(tag) == false) {
                el = document.createElement(tag);

                if ($string.isNullOrEmpty(elID) == false) {
                    el.id = elID;
                }

                if ($object.isNullOrUndefined(options) == false) {
                    if ($string.isNullOrEmpty(options.type) == false) {
                        el.type = options.type;
                    }

                    if ($object.isNullOrUndefined(options.styles) == false) {
                        $manipulation.addStyle(el, options.styles);
                    }

                    if ($string.isNullOrEmpty(options.classNames) == false) {
                        $manipulation.addClass(el, options.classNames);
                    }

                    if ($object.isNullOrUndefined(options.value) == false) {
                        $manipulation.value(el, options.value);
                    }

                    if ($object.isNullOrUndefined(options.text) == false) {
                        $manipulation.innerText(el, options.text);
                    }

                    if ($object.isNullOrUndefined(options.content) == false) {
                        $manipulation.textContent(el, options.content);
                    }

                    if ($object.isNullOrUndefined(options.html) == false) {
                        $manipulation.innerHTML(el, options.html);
                    }
                }

                baseEl.appendChild(el);
            }
            return el;
        },

        prepend(el, baseEl) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            baseEl = $object.isString(baseEl) == true ? syn.$l.get(baseEl) : baseEl;
            if ($object.isNullOrUndefined(el) == false && $object.isNullOrUndefined(baseEl) == false) {
                baseEl.insertBefore(el, baseEl.firstChild);
            }

            return $manipulation;
        },

        copy(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.cloneNode(true);
        },

        remove(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                syn.$w.purge(el);

                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }

            return $manipulation;
        },

        hasChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                return el.hasChildNodes();
            }

            return false;
        },

        insertAfter(el, targetEL) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            targetEL = $object.isString(targetEL) == true ? syn.$l.get(targetEL) : targetEL;
            if ($object.isNullOrUndefined(el) == false && $object.isNullOrUndefined(targetEL) == false) {
                var parent = targetEL.parentNode;
                if (targetEL.nextElementSibling) {
                    parent.insertBefore(el, targetEL.nextElementSibling);
                } else {
                    if ($object.isNullOrUndefined(parent) == false) {
                        parent.appendChild(el);
                    }
                    else {
                        $manipulation.appendChild(targetEL, el);
                    }
                }
            }

            return $manipulation;
        },

        display(el, isShow) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if ($string.toBoolean(isShow) == true) {
                    el.style.display = 'block';
                }
                else {
                    el.style.display = 'none';
                }
            }

            return $manipulation;
        },

        toggleDisplay(el) {
            var result = 'none';
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if (context.getComputedStyle(el).display === 'block') {
                    $manipulation.display(el, false);
                }
                else {
                    $manipulation.display(el, true);
                }

                result = context.getComputedStyle(el).display;
            }

            return result;
        },

        parent(el, id) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                var parent = el.parentElement;
                if ($string.isNullOrEmpty(id) == false) {
                    while (parent && ($string.isNullOrEmpty(parent.tagName) == false && parent.tagName != 'HTML')) {
                        if ($object.isNullOrUndefined(parent) == true) {
                            break;
                        }

                        if (parent.id == id) {
                            return parent;
                        }

                        parent = parent.parentElement;
                    }
                }
            }

            return parent;
        },

        create(options) {
            var el = document.createElement(options.tag || 'div');
            if ($string.isNullOrEmpty(options.id) == false) {
                el.id = options.id;
            }

            if ($object.isNullOrUndefined(options.styles) == false) {
                $manipulation.addStyle(el, options.styles);
            }

            if ($string.isNullOrEmpty(options.className) == false) {
                el.className = options.className;
            }

            if ($string.isNullOrEmpty(options.classNames) == false) {
                $manipulation.addClass(el, options.classNames);
            }

            if ($object.isNullOrUndefined(options.attributes) == false) {
                for (var prop in options.attributes) {
                    el.setAttribute(prop, options.attributes[prop]);
                }
            }

            if ($object.isNullOrUndefined(options.data) == false) {
                el.setAttribute('dataset', JSON.stringify(options.data));
            }

            if ($object.isNullOrUndefined(options.value) == false) {
                $manipulation.value(el, options.value);
            }

            if ($object.isNullOrUndefined(options.text) == false) {
                $manipulation.innerText(el, options.text);
            }

            if ($object.isNullOrUndefined(options.content) == false) {
                $manipulation.textContent(el, options.content);
            }

            if ($object.isNullOrUndefined(options.html) == false) {
                $manipulation.innerHTML(el, options.html);
            }

            return el;
        },

        each(array, handler) {
            if ($object.isNullOrUndefined(array) == false) {
                if ($object.isArray(array) == true && $object.isFunction(handler) == true) {
                    for (var i = 0, length = array.length; i < length; i++) {
                        handler(array[i], i);
                    }
                }
            }
        },

        setActive(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if ($string.toBoolean(value) == true) {
                    el.classList.add('active');
                }
                else {
                    el.classList.remove('active');
                }
            }
        },

        setSelected(el, value, multiple) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if ($string.toBoolean(multiple) == false) {
                    var siblingELs = $manipulation.siblings(el);
                    if ($object.isNullOrUndefined(siblingELs) == false) {
                        $manipulation.each(siblingELs, (itemEL, index) => {
                            itemEL.selected = false;
                            itemEL.removeAttribute('selected');
                        });
                    }
                }

                if ($string.toBoolean(value) == true) {
                    el.selected = true;
                    el.setAttribute('selected', 'selected');
                }
                else {
                    el.selected = false;
                    el.removeAttribute('selected');
                }
            }
        },

        setChecked(el, value, multiple) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if ($string.toBoolean(multiple) == false) {
                    var siblingELs = $manipulation.siblings(el);
                    if ($object.isNullOrUndefined(siblingELs) == false) {
                        $manipulation.each(siblingELs, (itemEL, index) => {
                            itemEL.checked = false;
                            itemEL.removeAttribute('checked');
                        });
                    }
                }

                if ($string.toBoolean(value) == true) {
                    el.checked = true;
                    el.setAttribute('checked', 'checked');
                }
                else {
                    el.checked = false;
                    el.removeAttribute('checked');
                }
            }
        },

        getClassRegEx(css) {
            return new RegExp('(^|\\s)' + css + '(\\s|$)');
        }
    });
    syn.$m = $manipulation;
})(globalRoot);
