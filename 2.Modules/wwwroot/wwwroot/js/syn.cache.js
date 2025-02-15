(function () {
    "use strict";

    function injectRawStyle(text) {
        var style = document.createElement('style');
        style.setAttribute("type", "text/css");
        style.innerHTML = text;
        var head = document.getElementsByTagName('head')[0];
        if (!head) {
            head = document.createElement('head');
            document.documentElement.appendChild(head);
        }

        head.appendChild(style);
    }

    var preloadUrl = '/css/preload.css';
    if (window.sessionStorage && sessionStorage.font_css_cache) {
        injectRawStyle(sessionStorage.font_css_cache);
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", preloadUrl, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                injectRawStyle(xhr.responseText);
                sessionStorage.font_css_cache = xhr.responseText;
            }
        };
        xhr.send();
    }
}());
