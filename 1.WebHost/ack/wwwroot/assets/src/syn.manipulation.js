(function (context) {
    'use strict';
    const $manipulation = context.$manipulation || new syn.module();
    const doc = context.document;

    $manipulation.extend({
        body() {
            return doc;
        },

        documentElement() {
            return doc?.documentElement;
        },

        childNodes(el) {
            el = syn.$l.getElement(el);
            return el ? el.childNodes : null;
        },

        children(el) {
            el = syn.$l.getElement(el);
            return el ? el.children : null;
        },

        firstChild(el) {
            el = syn.$l.getElement(el);
            return el ? el.firstChild : null;
        },

        firstElementChild(el) {
            el = syn.$l.getElement(el);
            return el ? el.firstElementChild : null;
        },

        lastChild(el) {
            el = syn.$l.getElement(el);
            return el ? el.lastChild : null;
        },

        lastElementChild(el) {
            el = syn.$l.getElement(el);
            return el ? el.lastElementChild : null;
        },

        nextSibling(el) {
            el = syn.$l.getElement(el);
            return el ? el.nextSibling : null;
        },

        nextElementSibling(el) {
            el = syn.$l.getElement(el);
            return el ? el.nextElementSibling : null;
        },

        previousSibling(el) {
            el = syn.$l.getElement(el);
            return el ? el.previousSibling : null;
        },

        previousElementSibling(el) {
            el = syn.$l.getElement(el);
            return el ? el.previousElementSibling : null;
        },

        siblings(el) {
            el = syn.$l.getElement(el);
            if (!el?.parentElement?.children) return null;
            return Array.from(el.parentElement.children).filter(child => child !== el);
        },

        parentNode(el) {
            el = syn.$l.getElement(el);
            return el ? el.parentNode : null;
        },

        parentElement(el) {
            el = syn.$l.getElement(el);
            return el ? el.parentElement : null;
        },

        value(el, value) {
            el = syn.$l.getElement(el);
            if (!el) return null;
            if (value !== undefined) {
                el.value = $string.toValue(value);
            }
            return el.value;
        },

        textContent(el, value) {
            el = syn.$l.getElement(el);
            if (!el) return null;
            if (value !== undefined) {
                el.textContent = $string.toValue(value);
            }
            return el.textContent;
        },

        innerText(el, value) {
            el = syn.$l.getElement(el);
            if (!el) return null;
            if (value !== undefined) {
                el.innerText = $string.toValue(value);
            }
            return el.innerText;
        },

        innerHTML(el, value) {
            el = syn.$l.getElement(el);
            if (!el) return null;
            if (value !== undefined) {
                el.innerHTML = $string.toValue(value);
            }
            return el.innerHTML;
        },

        outerHTML(el) {
            el = syn.$l.getElement(el);
            return el ? el.outerHTML : null;
        },

        className(el) {
            el = syn.$l.getElement(el);
            return el ? el.className : null;
        },

        removeAttribute(el, prop) {
            el = syn.$l.getElement(el);
            if (el && prop) {
                el.removeAttribute(prop);
            }
            return this;
        },

        getAttribute(el, prop) {
            el = syn.$l.getElement(el);
            return el && prop ? el.getAttribute(prop) : null;
        },

        setAttribute(el, prop, val) {
            el = syn.$l.getElement(el);
            if (el && prop) {
                el.setAttribute(prop, val);
            }
            return this;
        },

        appendChild(el, node) {
            el = syn.$l.getElement(el);
            if (el && node) {
                el.appendChild(node);
            }
            return this;
        },

        setStyle(el, prop, val) {
            el = syn.$l.getElement(el);
            if (el?.style && prop) {
                el.style[prop] = val;
            }
            return this;
        },

        addCssText(el, cssText) {
            el = syn.$l.getElement(el);
            if (el?.style) {
                el.style.cssText += `;${cssText}`;
            }
            return this;
        },

        addStyle(el, objects) {
            el = syn.$l.getElement(el);
            if (el?.style && $object.isObject(objects)) {
                Object.entries(objects).forEach(([prop, val]) => {
                    el.style[prop] = val;
                });
            }
            return this;
        },

        getStyle(el, prop) {
            el = syn.$l.getElement(el);
            return el?.style?.[prop] ?? null;
        },

        hasHidden(el) {
            el = syn.$l.getElement(el);
            return !el || el.offsetParent === null || context.getComputedStyle(el).display === 'none';
        },

        getComputedStyle(el, prop) {
            el = syn.$l.getElement(el);
            if (!el || !prop) return null;
            try {
                return context.getComputedStyle(el)[prop];
            } catch {
                return null;
            }
        },

        addClass(el, css) {
            el = syn.$l.getElement(el);
            if (el && css) {
                css.split(' ').forEach(cls => {
                    if (cls) el.classList.add(cls);
                });
            }
            return this;
        },

        hasClass(el, css) {
            el = syn.$l.getElement(el);
            return el && css ? el.classList.contains(css) : false;
        },

        toggleClass(el, css) {
            el = syn.$l.getElement(el);
            if (el && css) {
                el.classList.toggle(css);
            }
            return this;
        },

        removeClass(el, css) {
            el = syn.$l.getElement(el);
            if (el) {
                if (css === undefined) {
                    el.className = '';
                } else if (css) {
                    css.split(' ').forEach(cls => {
                        if (cls) el.classList.remove(cls);
                    });
                }
            }
            return this;
        },

        // syn.$m.addClass(el, 'highlight').fade(el, { duration: 1000, to: 0.5 });
        fade(el, options = {}) {
            el = syn.$l.getElement(el);
            if (el) {
                const config = {
                    duration: 1000,
                    from: parseFloat(context.getComputedStyle(el).opacity) || 1,
                    to: 0,
                    fps: 60,
                    callback: null,
                    ...options
                };

                const frameInterval = 1000 / config.fps;
                const totalFrames = (config.duration / 1000) * config.fps;
                const opacityChange = config.to - config.from;
                const opacityIncrement = opacityChange / totalFrames;

                let currentOpacity = config.from;
                let lastTimestamp;

                const animate = (timestamp) => {
                    if (!lastTimestamp) {
                        lastTimestamp = timestamp;
                    }

                    const elapsed = timestamp - lastTimestamp;

                    if (elapsed < frameInterval) {
                        requestAnimationFrame(animate);
                        return;
                    }

                    lastTimestamp = timestamp;
                    currentOpacity += opacityIncrement;

                    if ((opacityIncrement > 0 && currentOpacity >= config.to) || (opacityIncrement < 0 && currentOpacity <= config.to)) {
                        el.style.opacity = config.to;
                        if (typeof config.callback === 'function') {
                            config.callback.call(el);
                        }
                    } else {
                        el.style.opacity = currentOpacity;
                        requestAnimationFrame(animate);
                    }
                };

                requestAnimationFrame(animate);
            }

            return this;
        },

        append(baseEl, tag, elID, options = {}) {
            const baseElement = syn.$l.getElement(baseEl);
            if (!baseElement || !tag || !doc) return null;

            const el = doc.createElement(tag);

            if (elID) el.id = elID;
            if (options.type) el.type = options.type;
            if (options.styles) this.addStyle(el, options.styles);
            if (options.classNames) this.addClass(el, options.classNames);
            if (options.value !== undefined) this.value(el, options.value);
            if (options.text !== undefined) this.innerText(el, options.text);
            if (options.content !== undefined) this.textContent(el, options.content);
            if (options.html !== undefined) this.innerHTML(el, options.html);

            baseElement.appendChild(el);
            return el;
        },

        prepend(el, baseEl) {
            el = syn.$l.getElement(el);
            const baseElement = syn.$l.getElement(baseEl);
            if (el && baseElement?.firstChild) {
                baseElement.insertBefore(el, baseElement.firstChild);
            } else if (el && baseElement) {
                baseElement.appendChild(el);
            }
            return this;
        },

        copy(el) {
            el = syn.$l.getElement(el);
            return el ? el.cloneNode(true) : null;
        },

        remove(el) {
            el = syn.$l.getElement(el);
            if (el) {
                if ($webform?.purge) $webform.purge(el);
                el.remove();
            }
            return this;
        },

        hasChild(el) {
            el = syn.$l.getElement(el);
            return el ? el.hasChildNodes() : false;
        },

        insertBefore(el, targetEL) {
            el = syn.$l.getElement(el);
            const targetElement = syn.$l.getElement(targetEL);
            if (el && targetElement?.parentNode) {
                targetElement.parentNode.insertBefore(el, targetElement);
            }
            return this;
        },

        insertAfter(el, targetEL) {
            el = syn.$l.getElement(el);
            const targetElement = syn.$l.getElement(targetEL);
            if (el && targetElement?.parentNode) {
                targetElement.parentNode.insertBefore(el, targetElement.nextSibling);
            }
            return this;
        },

        display(el, isShow) {
            el = syn.$l.getElement(el);
            if (el?.style) {
                el.style.display = $string.toBoolean(isShow) ? 'block' : 'none';
            }
            return this;
        },

        toggleDisplay(el) {
            el = syn.$l.getElement(el);
            if (!el?.style) return 'none';

            const currentDisplay = context.getComputedStyle(el).display;
            this.display(el, currentDisplay === 'none');
            return el.style.display || context.getComputedStyle(el).display;
        },

        parent(el, id) {
            let current = syn.$l.getElement(el);
            if (!current) return null;

            let parent = current.parentElement;
            if (!id) return parent;

            while (parent && parent.tagName !== 'HTML') {
                if (parent.id === id) return parent;
                parent = parent.parentElement;
            }
            return null;
        },

        create(options = {}) {
            if (!doc) return null;
            const el = doc.createElement(options.tag || 'div');

            if (options.id) el.id = options.id;
            if (options.styles) this.addStyle(el, options.styles);
            if (options.className) el.className = options.className;
            if (options.classNames) this.addClass(el, options.classNames);
            if (options.attributes) {
                Object.entries(options.attributes).forEach(([prop, val]) => el.setAttribute(prop, val));
            }
            if (options.data) el.dataset.data = JSON.stringify(options.data);
            if (options.value !== undefined) this.value(el, options.value);
            if (options.text !== undefined) this.innerText(el, options.text);
            if (options.content !== undefined) this.textContent(el, options.content);
            if (options.html !== undefined) this.innerHTML(el, options.html);

            return el;
        },

        each(array, handler) {
            if ($object.isArray(array) && $object.isFunction(handler)) {
                array.forEach(handler);
            }
        },

        setActive(el, value) {
            el = syn.$l.getElement(el);
            if (el?.classList) {
                el.classList.toggle('active', $string.toBoolean(value));
            }
            return this;
        },

        setSelected(el, value, multiple = false) {
            el = syn.$l.getElement(el);
            if (!el) return this;

            const boolValue = $string.toBoolean(value);

            if (!$string.toBoolean(multiple)) {
                this.siblings(el)?.forEach(siblingEL => {
                    siblingEL.selected = false;
                    siblingEL.removeAttribute('selected');
                });
            }

            el.selected = boolValue;
            if (boolValue) {
                el.setAttribute('selected', 'selected');
            } else {
                el.removeAttribute('selected');
            }
            return this;
        },

        setChecked(el, value, multiple = false) {
            el = syn.$l.getElement(el);
            if (!el) return this;

            const boolValue = $string.toBoolean(value);

            if (!$string.toBoolean(multiple)) {
                this.siblings(el)?.forEach(siblingEL => {
                    if (siblingEL.tagName === el.tagName && siblingEL.type === el.type && siblingEL.name === el.name) {
                        siblingEL.checked = false;
                        siblingEL.removeAttribute('checked');
                    }
                });
            }

            el.checked = boolValue;
            if (boolValue) {
                el.setAttribute('checked', 'checked');
            } else {
                el.removeAttribute('checked');
            }
            return this;
        },

        getClassRegEx(css) {
            const escapedCss = css.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            return new RegExp(`(^|\\s)${escapedCss} (\\s | $)`);
        }
    });
    context.$manipulation = syn.$m = $manipulation;
})(globalRoot);
