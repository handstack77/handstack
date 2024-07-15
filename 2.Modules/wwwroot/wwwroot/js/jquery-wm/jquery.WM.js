(function ($) {
    var winJQ, lastMouseX, lastMouseY, zIndex = 10000, minH, minW = 160, newWinOffset = 50,
        isIE = navigator.userAgent.match(/MSIE/),
        template = '<div class=window><div class=windowtitlebar><img src=/favicon.ico width=16 height=16 class=titlebaricon><div class=titlebartext></div><div class=horizbuts><div class=minimizebut title="hidden"></div><div class=restorebut style="display:none;" title=restore></div><div class="maximizebut" style="display: none;" title=close></div><div class=closebut title=close></div></div></div><div class=windowcontent></div><div class=resizer-tl></div><div class=resizer-t></div><div class=resizer-tr></div><div class=resizer-r></div><div class=resizer-br></div><div class=resizer-b></div><div class=resizer-bl></div><div class=resizer-l></div></div>',

        resizerP = $('<div id=resizerproxy>').mousemove(function (e) {
            if (resizeMask & 1) {
                resizerPos.top += (lastMouseY - e.pageY) * -1;
                var a = resizerPos.parentH - resizerPos.top - resizerPos.bottom - minH;
                if (a < 0) resizerPos.top += a;
            }
            else if (resizeMask & 4) {
                resizerPos.bottom += (lastMouseY - e.pageY);
                var a = resizerPos.parentH - resizerPos.top - resizerPos.bottom - minH;
                if (a < 0) resizerPos.bottom += a;
            }
            if (resizeMask & 8) {
                resizerPos.left += (lastMouseX - e.pageX) * -1;
                var a = resizerPos.parentW - resizerPos.left - resizerPos.right - minW;
                if (a < 0) resizerPos.left += a;
            }
            else if (resizeMask & 2) {
                resizerPos.right += (lastMouseX - e.pageX);
                var a = resizerPos.parentW - resizerPos.left - resizerPos.right - minW;
                if (a < 0) resizerPos.left += a;
            }
            lastMouseX = e.pageX;
            lastMouseY = e.pageY;
            resizerC.css(resizerPos);
            return false;
        })
            .mouseup(function () {
                resizerP.hide();
                winJQ.css(resizerPos).WM_ensure_viewable();
                winJQ = undefined;
                return false;
            }),
        resizerC = $('<div>').appendTo(resizerP),
        resizerPos = null,
        resizeMask = null,
        onStartResize = function (e) {
            var rv = this.className.match(/resizer\-(\w+)/);
            if (rv.length != 2) return true;
            var type = rv[1];
            resizeMask = 0;
            if (type[0] == 't') resizeMask |= 1;
            else if (type[0] == 'b') resizeMask |= 4;
            if (type.match(/l/)) resizeMask |= 8;
            else if (type.match(/r/)) resizeMask |= 2;
            winJQ = $(this).closest('.window')
                .removeClass('minimized').removeClass('maximized').removeData('oldPos');
            minH = winJQ.find('> .windowtitlebar').height() + 5;
            resizerPos = getPos(winJQ);

            resizerPos.right = resizerPos.parentW - winJQ.outerWidth() - resizerPos.left;
            resizerPos.bottom = resizerPos.parentH - winJQ.outerHeight() - resizerPos.top;
            resizerPos.width = resizerPos.height = 'auto';
            lastMouseX = e.pageX;
            lastMouseY = e.pageY;
            resizerC.css(resizerPos);
            resizerP.show();
            return false;
        },
        moverP = $('<div id=moverproxy>')
            .mousemove(function (e) {
                moverPos.top += (lastMouseY - e.pageY) * -1;
                moverPos.left += (lastMouseX - e.pageX) * -1;
                lastMouseX = e.pageX;
                lastMouseY = e.pageY;
                moverC.css(moverPos);
                return false;
            })
            .mouseup(function () {
                moverP.hide();
                winJQ.css(moverPos).WM_ensure_viewable().removeClass('moving');
                winJQ = undefined;
                return false;
            }),
        moverPos = { left: 0, top: 0, right: 'auto', bottom: 'auto', width: 0, height: 0 },
        moverC = $('<div>').appendTo(moverP), lastClick = 0,
        onStartMove = function (e) {
            winJQ = $(this).closest('.window');
            // if dbdclick title bar, then maximize
            if (!isIE)
                var t1 = new Date().getTime();
            if (t1 - lastClick <= 250) {
                lastClick = 0;
                winJQ.triggerHandler('dblclick');
                return false;
            }

            lastClick = t1;
            winJQ.WM_raise();
            moverPos = getPos(winJQ);
            moverPos.width = winJQ.width() + 2;
            moverPos.height = winJQ.height() + 2;
            moverPos.bottom = moverPos.right = 'auto';
            moverC.css(moverPos);
            moverP.show();
            lastMouseX = e.pageX;
            lastMouseY = e.pageY;
            return false;
        },
        // take fixed pos into account
        getPos = function (w) {
            var p = w.offset();
            p.top -= $(document).scrollTop();
            p.left -= $(document).scrollLeft();
            p.parentW = $(window).width();
            p.parentH = $(window).height();
            return p;
        },
        // save win current position (called before max or mining a win) 
        savePos = function (w) {
            if (!w.data('oldPos')) {
                var p = getPos(w);
                w.data('oldPos', {
                    top: p.top, left: p.left, right: 'auto',
                    bottom: 'auto', width: w.width(), height: w.height()
                });
            }
        },
        cancelBubble = function () { return false; },
        onClickWindow =
            function () { $(this).closest('.window').WM_raise(); return true; },
        onClickMinimizeBut =
            function () { $(this).closest('.window').WM_minimize(); return false; },
        onClickRestoreBut =
            function () { $(this).closest('.window').WM_restore(); return false; },
        onClickMaximizeBut =
            function () { $(this).closest('.window').WM_maximize(); return false; },
        onClickCloseBut =
            function () {
                var windowHandle = $(this).closest('.window');
                var elID = windowHandle.attr('id');

                var channels = syn.$w.channels.filter(function (item) { return item.elID == elID });
                if (channels.length > 0) {
                    var iframeChannel = channels[0];
                    var windowHandle = iframeChannel.windowHandle;
                    var channel = iframeChannel.channel;
                    channel.destroy();

                    var baseELID = windowHandle.attr('baseELID');
                    if (baseELID != '') {
                        $('#' + baseELID).closest('.window').WM_raise();
                    }
                    var windowOverlayID = windowHandle.attr('id') + '_overlay';
                    $('#' + windowOverlayID).remove();
                    windowHandle.WM_close();
                }

                return false;
            },
        onDblClickTitlebar = function () {
            var w = $(this).closest('.window');
            if (w.hasClass('maximized')) w.WM_restore();
            else w.WM_maximize();
            return false;
        };
    moverP[0].onselectstart = cancelBubble;

    $.fn.WM_ensure_viewable = function () {
        this.filter('.window').each(function () {
            var w = $(this);
            var p = getPos(w);
            if (p.top < 0)
                w.css('top', 0);
            else if (p.parentH - p.top < 20)
                w.css('top', p.parentH - 20);
            if (p.left + w.width() < 80)
                w.css({ left: w.width() * -1 + 80, width: w.width(), right: 'auto' });
            else if (p.parentW - p.left < 30)
                w.css('left', p.parentW - 30);
        });
        return this;
    };

    $.fn.WM_minimize = function () {
        this.each(function () {
            var w = $(this);
            if (!w.is('.window')) return true;
            w.removeClass('maximized');
            savePos(w);
            minH = w.find('>.windowtitlebar').height() + 5;
            w.css({ left: 'auto', top: 'auto', right: 0, width: 300, height: minH, zIndex: 10000 })
                .removeClass('focused')
                .addClass('minimized');
        });
        $.WM_retileMin();
        return this;
    };

    $.WM_retileMin = function () {
        $('.window.minimized').each(function (i) {
            var b = i * (minH + 2)
            if ($(this).css('bottom') != b) $(this).css('bottom', b);
        });
        return this;
    };

    $.fn.WM_maximize = function () {
        var retile;
        this.each(function () {
            var w = $(this);
            if (!w.is('.window')) return true;
            if (w.hasClass('minimized')) {
                w.removeClass('minimized');
                retile = 1;
            }
            savePos(w);
            w.css({ left: 0, top: 0, bottom: 0, right: 0, width: 'auto', height: 'auto' })
                .WM_raise().addClass('maximized');
        });
        if (retile) $.WM_retileMin();
        return this;
    };

    $.fn.WM_restore = function () {
        var retile;
        this.each(function () {
            var w = $(this);
            if (!w.is('.window')) return true;
            if (w.hasClass('minimized')) {
                w.removeClass('minimized');
                retile = 1;
            } else w.removeClass('maximized');
            w.css(w.data('oldPos'))
                .removeData('oldPos')
                .WM_ensure_viewable()
        });
        if (retile) $.WM_retileMin();
        this.WM_raise();
        return this;
    };

    $.fn.WM_raise = function () {
        var w = this.filter('.window:first');
        if (w.length == 0 || w.hasClass('focused')) return this;
        $(".window.focused").removeClass('focused');
        w.addClass('focused');

        var baseELID = w.attr('baseELID');
        if (baseELID) {
            if (w.attr('id') != baseELID) {
                w.css('zIndex', ++zIndex);
            }
        }
        else {
            if (baseELID != '') {
                w.css('zIndex', ++zIndex);
            }
        }

        return this;
    };

    $.fn.WM_close = function () {
        var channelID = this.attr('channelID');
        if (channelID) {
            var itemToFind = syn.$w.channels.find(function (item) { return item.id == channelID });
            var idx = syn.$w.channels.indexOf(itemToFind);
            if (idx > -1) {
                syn.$w.channels.splice(idx, 1);
            }
        }
        return this.filter('.window').remove();
    };

    $.WM_open = function (elemID, lnk, target, opts) {
        if (!opts) opts = {};
        var w = $(template);
        w[0].id = elemID;

        var nam = opts.name || opts.title || target || lnk;
        if (lnk) {
            nam = lnk.replace(/^https?:\/\/[^\/]+\//, '').replace(/\.\w+$/, '')
                .replace(/[^A-Za-z0-9]/g, '');
        }
        if (!nam) nam = 'default';
        w.addClass('windowname_' + nam);

        // smart window placement
        newWinOffset += 10;
        if (newWinOffset > 400) {
            newWinOffset = 50;
        }

        if (opts.width) {
            w.css('width', opts.width);
        }

        if (opts.height) {
            w.css('height', opts.height);
        }

        if (opts.top) {
            w.css('top', opts.top);
        }
        else {
            w.css('top', newWinOffset);
        }

        if (opts.left) {
            w.css('left', opts.left);
        }
        else {
            w.css('left', newWinOffset);
        }

        // hook in resizer handles
        $('.resizer-tl,.resizer-t,.resizer-tr,.resizer-r,.resizer-br,.resizer-b,' +
            '.resizer-bl,.resizer-l', w).mousedown(onStartResize);

        // raise window if clicked
        w.click(onClickWindow);

        // hook in titlebar actions
        var tb = $('.windowtitlebar', w);
        tb.mousedown(onStartMove);
        //tb.dblclick(onDblClickTitlebar);
        var buts = tb.find('> .horizbuts').mousedown(cancelBubble).children();
        buts.eq(0).click(onClickMinimizeBut);
        buts.eq(1).click(onClickRestoreBut);
        buts.eq(2).click(onClickMaximizeBut);
        buts.eq(3).click(onClickCloseBut);

        // set default window title
        var tbt = tb.children('.titlebartext').text(opts.title || lnk || '');
        tbt[0].onselectstart = cancelBubble;
        tbt[0].unselectable = "on";

        // place window
        $(window.document.body).append(w);

        // open iframe if external link
        if (!lnk) { } // do nothing

        // if content is url, load in iframe
        else if (typeof lnk == 'string') {
            var scrolling = opts.scrolling || 'no';
            // if external link, add external favicon
            var m = lnk.match(/^(https?\:\/\/)([^\/]+)/);
            if (m && m[2] != document.location.hostname)
                w.find('.titlebaricon').attr('src', m[1] + m[2] + "/favicon.ico");
            $('<iframe src="' + lnk + '" target="' + target + '" scrolling="' + scrolling + '"></iframe>' +
                '<div class=iframecover></div>')
                .appendTo(w.find('.windowcontent'));
        }

        // else let jquery append it
        else w.find('.windowcontent').append(lnk);

        w.WM_raise();
        return w;
    };

    // if anchor clicked having target=_child open link as child window
    $(document).delegate('a', 'click', function (e) {
        if ((!e.button || e.button == 0) && this.target.match(/^\_child\b/)) {
            var t = $(this);
            window.jQuery.WM_open(this.href, this.target,
                { title: t.attr('title') || t.text().substr(0, 100) });
            return false;
        }
        return true;
    });

    // make sure all child windows are on screen when window resizes
    $(window).resize(function () { $('.window').WM_ensure_viewable(); return true; });

    $(function () {
        if (isIE) $(document.body).addClass('IE');
        $(document.body).append(moverP).append(resizerP);
    });
})(jQuery);
