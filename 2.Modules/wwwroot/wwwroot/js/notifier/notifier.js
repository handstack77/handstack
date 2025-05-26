; (function (root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        exports['notifier'] = factory();
    } else {
        root['notifier'] = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    let notificationCounter = 0;
    const createElement = function (tagName, attributes) {
        const element = document.createElement(tagName);
        for (const property in attributes) {
            element.setAttribute(property, attributes[property]);
        }
        return element;
    };

    const createNotificationContainer = function () {
        const container = createElement('div', { class: 'notifier-container', id: 'notifier-container' });
        document.body.appendChild(container);
    };

    const showNotification = function (title, message, notificationType, iconUrl, options) {
        let config = {
            autoHideTimeout: 3000,
            classList: [],
            payload: {},
            clickNotify: null
        };

        title = title || '알림';
        message = message || '메시지 입니다.';
        notificationType = notificationType || 'info';

        if (typeof options === 'number') {
            config.autoHideTimeout = options;
        } else if (typeof options === 'object' && options !== null) {
            config.autoHideTimeout = typeof options.autoHideTimeout === 'number' ? options.autoHideTimeout : 3000;
            config.classList = options.classList || [];
            config.payload = options.payload || {};
            config.clickNotify = typeof options.clickNotify === 'function' ? options.clickNotify : null;
        }

        const notificationId = config.payload.id || 'notifier-' + notificationCounter;
        const container = document.querySelector('.notifier-container'),
            notification = createElement('div', { class: 'notifier ' + notificationType }),
            titleElement = createElement('h3', { class: 'notifier-title' }),
            bodyElement = createElement('div', { class: 'notifier-body' }),
            imageContainer = createElement('div', { class: 'notifier-img' }),
            closeButton = createElement('button', { class: 'notifier-close', type: 'button' });

        if (config.classList && config.classList.length > 0) {
            config.classList.forEach(cls => {
                if (!container.classList.contains(cls)) {
                    container.classList.add(cls);
                }
            });
        }
        titleElement.innerHTML = title;
        bodyElement.innerHTML = message;
        closeButton.innerHTML = '&times;';

        if (iconUrl && iconUrl.length > 0) {
            imageContainer.appendChild(createElement('img', { class: 'img', src: iconUrl }));
        }

        notification.appendChild(closeButton);
        notification.appendChild(imageContainer);
        notification.appendChild(titleElement);
        notification.appendChild(bodyElement);

        container.appendChild(notification);

        imageContainer.style.height = imageContainer.parentNode.offsetHeight + 'px' || null;

        setTimeout(function () {
            notification.className += ' shown';
            notification.setAttribute('id', notificationId);
        }, 100);

        if (config.autoHideTimeout > 0) {
            setTimeout(function () {
                hideNotification(notificationId);
            }, config.autoHideTimeout);
        }

        if (config.clickNotify) {
            notification.addEventListener('click', function (evt) {
                if (evt.target !== closeButton) {
                    config.clickNotify(evt, config.payload, notificationId);
                    hideNotification(notificationId);
                }
            });
            notification.style.cursor = 'pointer';
        }

        closeButton.addEventListener('click', function () {
            hideNotification(notificationId);
        });

        notificationCounter += 1;

        return notificationId;
    };

    const hideNotification = function (notificationId) {
        const notificationElement = document.getElementById(notificationId);

        if (notificationElement) {
            notificationElement.className = notificationElement.className.replace(' shown', '');

            setTimeout(function () {
                notificationElement.parentNode?.removeChild(notificationElement);
            }, 600);

            return true;
        } else {
            return false;
        }
    };

    createNotificationContainer();

    return {
        show: showNotification,
        hide: hideNotification
    };
}));
