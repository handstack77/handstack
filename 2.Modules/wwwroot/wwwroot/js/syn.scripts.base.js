(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["jquery"], factory);
	} else {
		factory(jQuery);
	}
})

	(function ($) {
		var d = [], doc = $(document), ie6 = false && typeof window["XMLHttpRequest"] !== "object", ie7 = false, ieQuirks = null, wndw = $(window), w = [];
		$.alert = function (data, options) {
			return $.alert.impl.init(data, options);
		};
		$.alert.close = function () {
			$.alert.impl.close();
		};
		$.alert.focus = function (pos) {
			$.alert.impl.focus(pos);
		};
		$.alert.setContainerDimensions = function () {
			$.alert.impl.setContainerDimensions();
		};
		$.alert.setPosition = function () {
			$.alert.impl.setPosition();
		};
		$.alert.update = function (height, width) {
			$.alert.impl.update(height, width);
		};
		$.fn.alert = function (options) {
			return $.alert.impl.init(this, options)
		};
		$.alert.defaults = {
			appendTo: "body", focus: true, opacity: 50, overlayId: "alertmodal-overlay", overlayCss: {}, containerId: "alertmodal-container", containerCss: {}, dataId: "alertmodal-data", dataCss: {}, minHeight: null, minWidth: null, maxHeight: null, maxWidth: null, autoResize: false, autoPosition: true, zIndex: 20200, close: true, closeHTML: '<a class="modalCloseImg" title="Close"></a>', closeClass: "alertmodal-close", escClose: false, overlayClose: false, fixed: true, position: null, persist: false, alert: true,
			onOpen: null, onShow: null, onClose: null
		};
		$.alert.impl = {
			d: {}, init: function (data, options) {
				var s = this;
				if (s.d.data) {
					return false;
				}
				ieQuirks = !$.boxModel;
				s.o = $.extend({}, $.alert.defaults, options);
				s.zIndex = s.o.zIndex;
				s.occb = false;
				if (typeof data === "object") {
					data = data instanceof jQuery ? data : $(data);
					s.d.placeholder = false;
					if (data.parent().parent().length > 0) {
						data.before($("<span></span>").attr("id", "alertmodal-placeholder").css({ display: "none" }));
						s.d.placeholder = true;
						s.display = data.css("display");
						if (!s.o.persist) {
							s.d.orig = data.clone(true);
						}
					}
				} else {
					if (typeof data === "string" || typeof data === "number") {
						data = $("<div></div>").html(data);
					} else {
						alert("AlertModal Error: Unsupported data type: " + typeof data);
						return s;
					}
				}
				s.create(data);
				data = null;
				s.open();
				if ($.isFunction(s.o.onShow)) {
					s.o.onShow.apply(s, [s.d]);
				}
				return s
			}, create: function (data) {
				var s = this;
				s.getDimensions();
				if (s.o.alert && syn.$b.isIE6) {
					s.d.iframe = $('<iframe src="javascript:false;"></iframe>').css($.extend(s.o.iframeCss, { display: "none", opacity: 0, position: "fixed", height: w[0], width: w[1], zIndex: s.o.zIndex, top: 0, left: 0 })).appendTo(s.o.appendTo);
				}
				s.d.overlay = $("<div></div>").attr("id", s.o.overlayId).addClass("alertmodal-overlay").css($.extend(s.o.overlayCss, { display: "none", opacity: s.o.opacity / 100, height: s.o.alert ? d[0] : 0, width: s.o.alert ? d[1] : 0, position: "fixed", left: 0, top: 0, zIndex: s.o.zIndex + 1 })).appendTo(s.o.appendTo);
				s.d.container = $("<div></div>").attr("id", s.o.containerId).addClass("alertmodal-container").css($.extend({ position: "fixed" }, s.o.containerCss, { display: "none", zIndex: s.o.zIndex + 2 })).append(s.o.close && s.o.closeHTML ? $(s.o.closeHTML).addClass(s.o.closeClass) : "").appendTo(s.o.appendTo);
				s.d.wrap = $("<div></div>").attr("tabIndex", -1).addClass("alertmodal-wrap").css({ height: "100%", outline: 0, width: "100%" }).appendTo(s.d.container);
				s.d.data = data.attr("id", data.attr("id") || s.o.dataId).addClass("alertmodal-data").css($.extend(s.o.dataCss, { display: "none" })).appendTo("body");
				data = null;
				s.setContainerDimensions();
				s.d.data.appendTo(s.d.wrap);
				if (syn.$b.isIE6) {
					s.fixIE();
				}
			}, bindEvents: function () {
				var s = this;
				$("." + s.o.closeClass).bind("click.alertmodal", function (e) {
					e.preventDefault();
					s.close();
				});
				if (s.o.alert && s.o.close && s.o.overlayClose) {
					s.d.overlay.bind("click.alertmodal", function (e) {
						e.preventDefault();
						s.close();
					})
				}
				doc.bind("keydown.alertmodal", function (e) {
					if (s.o.alert && e.keyCode === 9) {
						s.watchTab(e);
					} else {
						if (s.o.close && s.o.escClose && e.keyCode === 27) {
							e.preventDefault();
							s.close();
						}
					}
				});
				wndw.bind("resize.alertmodal orientationchange.alertmodal", function () {
					s.getDimensions();
					s.o.autoResize ? s.setContainerDimensions() : s.o.autoPosition && s.setPosition();
					if (syn.$b.isIE6) {
						s.fixIE();
					} else {
						if (s.o.alert) {
							s.d.iframe && s.d.iframe.css({ height: w[0], width: w[1] });
							s.d.overlay.css({ height: d[0], width: d[1] });
						}
					}
				})
			}, unbindEvents: function () {
				$("." + this.o.closeClass).unbind("click.alertmodal");
				doc.unbind("keydown.alertmodal");
				wndw.unbind(".alertmodal");
				this.d.overlay.unbind("click.alertmodal");
			}, fixIE: function () {
				var s = this, p = s.o.position;
				$.each([s.d.iframe || null, !s.o.alert ? null : s.d.overlay, s.d.container.css("position") === "fixed" ? s.d.container : null], function (i, el) {
					if (el) {
						var bch = "document.body.clientHeight", bcw = "document.body.clientWidth", bsh = "document.body.scrollHeight", bsl = "document.body.scrollLeft", bst = "document.body.scrollTop", bsw = "document.body.scrollWidth", ch = "document.documentElement.clientHeight", cw = "document.documentElement.clientWidth", sl = "document.documentElement.scrollLeft", st = "document.documentElement.scrollTop", s = el[0].style;
						s.position = "absolute";
						if (i < 2) {
							s.removeExpression("height");
							s.removeExpression("width");
							s.setExpression("height", "" + bsh + " > " + bch + " ? " + bsh + " : " + bch + ' + "px"');
							s.setExpression("width", "" + bsw + " > " + bcw + " ? " + bsw + " : " + bcw + ' + "px"')
						} else {
							var te, le;
							if (p && p.constructor === Array) {
								var top = p[0] ? typeof p[0] === "number" ? p[0].toString() : p[0].replace(/px/, "") : el.css("top").replace(/px/, "");
								te = top.indexOf("%") === -1 ? top + " + (t = " + st + " ? " + st + " : " + bst + ') + "px"' : parseInt(top.replace(/%/, "")) + " * ((" + ch + " || " + bch + ") / 100) + (t = " + st + " ? " + st + " : " + bst + ') + "px"';
								if (p[1]) {
									var left = typeof p[1] === "number" ? p[1].toString() : p[1].replace(/px/, "");
									le = left.indexOf("%") === -1 ? left + " + (t = " + sl + " ? " + sl + " : " + bsl + ') + "px"' : parseInt(left.replace(/%/, "")) + " * ((" + cw + " || " + bcw + ") / 100) + (t = " + sl + " ? " + sl + " : " + bsl + ') + "px"'
								}
							} else {
								te = "(" + ch + " || " + bch + ") / 2 - (this.offsetHeight / 2) + (t = " + st + " ? " + st + " : " + bst + ') + "px"';
								le = "(" + cw + " || " + bcw + ") / 2 - (this.offsetWidth / 2) + (t = " + sl + " ? " + sl + " : " + bsl + ') + "px"'
							}
							s.removeExpression("top");
							s.removeExpression("left");
							s.setExpression("top", te);
							s.setExpression("left", le);
						}
					}
				})
			}, focus: function (pos) {
				var s = this, p = pos && $.inArray(pos, ["first", "last"]) !== -1 ? pos : "first";
				var input = $(":input:enabled:visible:" + p, s.d.wrap);
				setTimeout(function () {
					input.length > 0 ? input.focus() : s.d.wrap.focus();
				}, 10)
			}, getDimensions: function () {
				var s = this, h = wndw.height();
				d = [doc.height(), doc.width()];
				w = [h, wndw.width()];
			}, getVal: function (v, d) {
				return v ? typeof v === "number" ? v : v === "auto" ? 0 : v.indexOf("%") > 0 ? parseInt(v.replace(/%/, "")) / 100 * (d === "h" ? w[0] : w[1]) : parseInt(v.replace(/px/, "")) : null
			}, update: function (height, width) {
				var s = this;
				if (!s.d.data) {
					return false;
				}
				s.d.origHeight = s.getVal(height, "h");
				s.d.origWidth = s.getVal(width, "w");
				s.d.data.hide();
				height && s.d.container.css("height", height);
				width && s.d.container.css("width", width);
				s.setContainerDimensions();
				s.d.data.show();
				s.o.focus && s.focus();
				s.unbindEvents();
				s.bindEvents();
			}, setContainerDimensions: function () {
				var s = this, badIE = syn.$b.isIE6 || syn.$b.isIE7;
				var ch = s.getVal(s.d.container.css('height'), 'h'),
					cw = s.getVal(s.d.container.css('width'), 'h'),
					dh = s.d.data.outerHeight(true),
					dw = s.d.data.outerWidth(true);
				s.d.origHeight = s.d.origHeight || ch;
				s.d.origWidth = s.d.origWidth || cw;
				var mxoh = s.o.maxHeight ? s.getVal(s.o.maxHeight, "h") : null, mxow = s.o.maxWidth ? s.getVal(s.o.maxWidth, "w") : null, mh = mxoh && mxoh < w[0] ? mxoh : w[0], mw = mxow && mxow < w[1] ? mxow : w[1];
				var moh = s.o.minHeight ? s.getVal(s.o.minHeight, "h") : "auto";
				if (ch && ch > moh) {
					if (!dh) {
						ch = moh;
					} else {
						if (dh > mh) {
							ch = mh;
						} else {
							if (s.o.minHeight && moh !== "auto" && dh < moh) {
								ch = moh;
							} else {
								ch = dh;
							}
						}
					}
				} else {
					ch = s.o.autoResize && ch > mh ? mh : ch < moh ? moh : ch;
				}
				var mow = s.o.minWidth ? s.getVal(s.o.minWidth, "w") : "auto";
				if (cw && cw > mow) {
					if (!dw) {
						cw = mow;
					} else {
						if (dw > mw) {
							cw = mw;
						} else {
							if (s.o.minWidth && mow !== "auto" && dw < mow) {
								cw = mow;
							} else {
								cw = dw;
							}
						}
					}
				} else {
					cw = s.o.autoResize && cw > mw ? mw : cw < mow ? mow : cw;
				}
				s.d.container.css({ height: ch, width: cw });
				s.d.wrap.css({ overflow: dh > ch || dw > cw ? "auto" : "visible" });
				s.o.autoPosition && s.setPosition();
			}, setPosition: function () {
				var s = this, top, left, hc = w[0] / 2 - s.d.container.outerHeight(true) / 2, vc = w[1] / 2 - s.d.container.outerWidth(true) / 2, st = s.d.container.css("position") !== "fixed" ? wndw.scrollTop() : 0;
				if (s.o.position && Object.prototype.toString.call(s.o.position) === "[object Array]") {
					top = st + (s.o.position[0] || hc);
					left = s.o.position[1] || vc;
				} else {
					top = st + hc;
					left = vc;
				}
				s.d.container.css({ left: left, top: top })
			}, watchTab: function (e) {
				var s = this;
				if ($(e.target).parents(".alertmodal-container").length > 0) {
					s.inputs = $(":input:enabled:visible:first, :input:enabled:visible:last", s.d.data[0]);
					if (!e.shiftKey && e.target === s.inputs[s.inputs.length - 1] || e.shiftKey && e.target === s.inputs[0] || s.inputs.length === 0) {
						e.preventDefault();
						var pos = e.shiftKey ? "last" : "first";
						s.focus(pos);
					}
				} else {
					e.preventDefault();
					s.focus();
				}
			}, open: function () {
				var s = this;
				s.d.iframe && s.d.iframe.show();
				if ($.isFunction(s.o.onOpen)) {
					s.o.onOpen.apply(s, [s.d])
				} else {
					s.d.overlay.show();
					s.d.container.show();
					s.d.data.show();
				}
				s.o.focus && s.focus();
				s.bindEvents();
			}, close: function () {
				var s = this;
				if (!s.d.data) {
					return false;
				}
				s.unbindEvents();
				if ($.isFunction(s.o.onClose) && !s.occb) {
					s.occb = true;
					s.o.onClose.apply(s, [s.d]);
				} else {
					if (s.d.placeholder) {
						var ph = $("#alertmodal-placeholder");
						if (s.o.persist) {
							ph.replaceWith(s.d.data.removeClass("alertmodal-data").css("display", s.display))
						} else {
							s.d.data.hide().remove();
							ph.replaceWith(s.d.orig)
						}
					} else {
						s.d.data.hide().remove();
					}
					s.d.container.hide().remove();
					s.d.overlay.hide();
					s.d.iframe && s.d.iframe.hide().remove();
					s.d.overlay.remove();
					s.d = {};
				}
			}
		}
	});
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
        getPos = function (w) {
            var p = w.offset();
            p.top -= $(document).scrollTop();
            p.left -= $(document).scrollLeft();
            p.parentW = $(window).width();
            p.parentH = $(window).height();
            return p;
        },
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

        $('.resizer-tl,.resizer-t,.resizer-tr,.resizer-r,.resizer-br,.resizer-b,' +
            '.resizer-bl,.resizer-l', w).mousedown(onStartResize);

        w.click(onClickWindow);

        var tb = $('.windowtitlebar', w);
        tb.mousedown(onStartMove);
        var buts = tb.find('> .horizbuts').mousedown(cancelBubble).children();
        buts.eq(0).click(onClickMinimizeBut);
        buts.eq(1).click(onClickRestoreBut);
        buts.eq(2).click(onClickMaximizeBut);
        buts.eq(3).click(onClickCloseBut);

        var tbt = tb.children('.titlebartext').text(opts.title || lnk || '');
        tbt[0].onselectstart = cancelBubble;
        tbt[0].unselectable = "on";

        $(window.document.body).append(w);

        if (!lnk) { } 

        else if (typeof lnk == 'string') {
            var scrolling = opts.scrolling || 'no';
            var m = lnk.match(/^(https?\:\/\/)([^\/]+)/);
            if (m && m[2] != document.location.hostname)
                w.find('.titlebaricon').attr('src', m[1] + m[2] + "/favicon.ico");
            $('<iframe src="' + lnk + '" target="' + target + '" scrolling="' + scrolling + '"></iframe>' +
                '<div class=iframecover></div>')
                .appendTo(w.find('.windowcontent'));
        }

        else w.find('.windowcontent').append(lnk);

        w.WM_raise();
        return w;
    };

    $(document).delegate('a', 'click', function (e) {
        if ((!e.button || e.button == 0) && this.target.match(/^\_child\b/)) {
            var t = $(this);
            window.jQuery.WM_open(this.href, this.target,
                { title: t.attr('title') || t.text().substr(0, 100) });
            return false;
        }
        return true;
    });

    $(window).resize(function () { $('.window').WM_ensure_viewable(); return true; });

    $(function () {
        if (isIE) $(document.body).addClass('IE');
        $(document.body).append(moverP).append(resizerP);
    });
})(jQuery);


(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		define([ "jquery" ], factory );
	} else {

		factory( jQuery );
	}
}(function( $ ) {

$.ui = $.ui || {};

var version = $.ui.version = "1.12.1";






var widgetUuid = 0;
var widgetSlice = Array.prototype.slice;

$.cleanData = ( function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {
			try {

				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			} catch ( e ) {}
		}
		orig( elems );
	};
} )( $.cleanData );

$.widget = function( name, base, prototype ) {
	var existingConstructor, constructor, basePrototype;

	var proxiedPrototype = {};

	var namespace = name.split( "." )[ 0 ];
	name = name.split( "." )[ 1 ];
	var fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	if ( $.isArray( prototype ) ) {
		prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
	}

	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {

		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	$.extend( constructor, existingConstructor, {
		version: prototype.version,

		_proto: $.extend( {}, prototype ),

		_childConstructors: []
	} );

	basePrototype = new base();

	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = ( function() {
			function _super() {
				return base.prototype[ prop ].apply( this, arguments );
			}

			function _superApply( args ) {
				return base.prototype[ prop ].apply( this, args );
			}

			return function() {
				var __super = this._super;
				var __superApply = this._superApply;
				var returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		} )();
	} );
	constructor.prototype = $.widget.extend( basePrototype, {

		widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	} );

	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor,
				child._proto );
		} );

		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widgetSlice.call( arguments, 1 );
	var inputIndex = 0;
	var inputLength = input.length;
	var key;
	var value;

	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {

				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :

						$.widget.extend( {}, value );

				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string";
		var args = widgetSlice.call( arguments, 1 );
		var returnValue = this;

		if ( isMethodCall ) {

			if ( !this.length && options === "instance" ) {
				returnValue = undefined;
			} else {
				this.each( function() {
					var methodValue;
					var instance = $.data( this, fullName );

					if ( options === "instance" ) {
						returnValue = instance;
						return false;
					}

					if ( !instance ) {
						return $.error( "cannot call methods on " + name +
							" prior to initialization; " +
							"attempted to call method '" + options + "'" );
					}

					if ( !$.isFunction( instance[ options ] ) || options.charAt( 0 ) === "_" ) {
						return $.error( "no such method '" + options + "' for " + name +
							" widget instance" );
					}

					methodValue = instance[ options ].apply( instance, args );

					if ( methodValue !== instance && methodValue !== undefined ) {
						returnValue = methodValue && methodValue.jquery ?
							returnValue.pushStack( methodValue.get() ) :
							methodValue;
						return false;
					}
				} );
			}
		} else {

			if ( args.length ) {
				options = $.widget.extend.apply( null, [ options ].concat( args ) );
			}

			this.each( function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			} );
		}

		return returnValue;
	};
};

$.Widget = function(  ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",

	options: {
		classes: {},
		disabled: false,

		create: null
	},

	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = widgetUuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();
		this.classesElementLookup = {};

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			} );
			this.document = $( element.style ?

				element.ownerDocument :

				element.document || element );
			this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
		}

		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this._create();

		if ( this.options.disabled ) {
			this._setOptionDisabled( this.options.disabled );
		}

		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},

	_getCreateOptions: function() {
		return {};
	},

	_getCreateEventData: $.noop,

	_create: $.noop,

	_init: $.noop,

	destroy: function() {
		var that = this;

		this._destroy();
		$.each( this.classesElementLookup, function( key, value ) {
			that._removeClass( value, key );
		} );

		this.element
			.off( this.eventNamespace )
			.removeData( this.widgetFullName );
		this.widget()
			.off( this.eventNamespace )
			.removeAttr( "aria-disabled" );

		this.bindings.off( this.eventNamespace );
	},

	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key;
		var parts;
		var curOption;
		var i;

		if ( arguments.length === 0 ) {

			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {

			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},

	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},

	_setOption: function( key, value ) {
		if ( key === "classes" ) {
			this._setOptionClasses( value );
		}

		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this._setOptionDisabled( value );
		}

		return this;
	},

	_setOptionClasses: function( value ) {
		var classKey, elements, currentElements;

		for ( classKey in value ) {
			currentElements = this.classesElementLookup[ classKey ];
			if ( value[ classKey ] === this.options.classes[ classKey ] ||
					!currentElements ||
					!currentElements.length ) {
				continue;
			}

			elements = $( currentElements.get() );
			this._removeClass( currentElements, classKey );

			elements.addClass( this._classes( {
				element: elements,
				keys: classKey,
				classes: value,
				add: true
			} ) );
		}
	},

	_setOptionDisabled: function( value ) {
		this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

		if ( value ) {
			this._removeClass( this.hoverable, null, "ui-state-hover" );
			this._removeClass( this.focusable, null, "ui-state-focus" );
		}
	},

	enable: function() {
		return this._setOptions( { disabled: false } );
	},

	disable: function() {
		return this._setOptions( { disabled: true } );
	},

	_classes: function( options ) {
		var full = [];
		var that = this;

		options = $.extend( {
			element: this.element,
			classes: this.options.classes || {}
		}, options );

		function processClassString( classes, checkOption ) {
			var current, i;
			for ( i = 0; i < classes.length; i++ ) {
				current = that.classesElementLookup[ classes[ i ] ] || $();
				if ( options.add ) {
					current = $( $.unique( current.get().concat( options.element.get() ) ) );
				} else {
					current = $( current.not( options.element ).get() );
				}
				that.classesElementLookup[ classes[ i ] ] = current;
				full.push( classes[ i ] );
				if ( checkOption && options.classes[ classes[ i ] ] ) {
					full.push( options.classes[ classes[ i ] ] );
				}
			}
		}

		this._on( options.element, {
			"remove": "_untrackClassesElement"
		} );

		if ( options.keys ) {
			processClassString( options.keys.match( /\S+/g ) || [], true );
		}
		if ( options.extra ) {
			processClassString( options.extra.match( /\S+/g ) || [] );
		}

		return full.join( " " );
	},

	_untrackClassesElement: function( event ) {
		var that = this;
		$.each( that.classesElementLookup, function( key, value ) {
			if ( $.inArray( event.target, value ) !== -1 ) {
				that.classesElementLookup[ key ] = $( value.not( event.target ).get() );
			}
		} );
	},

	_removeClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, false );
	},

	_addClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, true );
	},

	_toggleClass: function( element, keys, extra, add ) {
		add = ( typeof add === "boolean" ) ? add : extra;
		var shift = ( typeof element === "string" || element === null ),
			options = {
				extra: shift ? keys : extra,
				keys: shift ? element : keys,
				element: shift ? this.element : element,
				add: add
			};
		options.element.toggleClass( this._classes( options ), add );
		return this;
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement;
		var instance = this;

		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {

				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
						$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ );
			var eventName = match[ 1 ] + instance.eventNamespace;
			var selector = match[ 2 ];

			if ( selector ) {
				delegateElement.on( eventName, selector, handlerProxy );
			} else {
				element.on( eventName, handlerProxy );
			}
		} );
	},

	_off: function( element, eventName ) {
		eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.off( eventName ).off( eventName );

		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
			},
			mouseleave: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
			}
		} );
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
			},
			focusout: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
			}
		} );
	},

	_trigger: function( type, event, data ) {
		var prop, orig;
		var callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();

		event.target = this.element[ 0 ];

		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}

		var hasOptions;
		var effectName = !options ?
			method :
			options === true || typeof options === "number" ?
				defaultEffect :
				options.effect || defaultEffect;

		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}

		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;

		if ( options.delay ) {
			element.delay( options.delay );
		}

		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue( function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			} );
		}
	};
} );

var widget = $.widget;





( function() {
var cachedScrollbarWidth,
	max = Math.max,
	abs = Math.abs,
	rhorizontal = /left|center|right/,
	rvertical = /top|center|bottom/,
	roffset = /[\+\-]\d+(\.[\d]+)?%?/,
	rposition = /^\w+/,
	rpercent = /%$/,
	_position = $.fn.position;

function getOffsets( offsets, width, height ) {
	return [
		parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
		parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
	];
}

function parseCss( element, property ) {
	return parseInt( $.css( element, property ), 10 ) || 0;
}

function getDimensions( elem ) {
	var raw = elem[ 0 ];
	if ( raw.nodeType === 9 ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: 0, left: 0 }
		};
	}
	if ( $.isWindow( raw ) ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: elem.scrollTop(), left: elem.scrollLeft() }
		};
	}
	if ( raw.preventDefault ) {
		return {
			width: 0,
			height: 0,
			offset: { top: raw.pageY, left: raw.pageX }
		};
	}
	return {
		width: elem.outerWidth(),
		height: elem.outerHeight(),
		offset: elem.offset()
	};
}

$.position = {
	scrollbarWidth: function() {
		if ( cachedScrollbarWidth !== undefined ) {
			return cachedScrollbarWidth;
		}
		var w1, w2,
			div = $( "<div " +
				"style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'>" +
				"<div style='height:100px;width:auto;'></div></div>" ),
			innerDiv = div.children()[ 0 ];

		$( "body" ).append( div );
		w1 = innerDiv.offsetWidth;
		div.css( "overflow", "scroll" );

		w2 = innerDiv.offsetWidth;

		if ( w1 === w2 ) {
			w2 = div[ 0 ].clientWidth;
		}

		div.remove();

		return ( cachedScrollbarWidth = w1 - w2 );
	},
	getScrollInfo: function( within ) {
		var overflowX = within.isWindow || within.isDocument ? "" :
				within.element.css( "overflow-x" ),
			overflowY = within.isWindow || within.isDocument ? "" :
				within.element.css( "overflow-y" ),
			hasOverflowX = overflowX === "scroll" ||
				( overflowX === "auto" && within.width < within.element[ 0 ].scrollWidth ),
			hasOverflowY = overflowY === "scroll" ||
				( overflowY === "auto" && within.height < within.element[ 0 ].scrollHeight );
		return {
			width: hasOverflowY ? $.position.scrollbarWidth() : 0,
			height: hasOverflowX ? $.position.scrollbarWidth() : 0
		};
	},
	getWithinInfo: function( element ) {
		var withinElement = $( element || window ),
			isWindow = $.isWindow( withinElement[ 0 ] ),
			isDocument = !!withinElement[ 0 ] && withinElement[ 0 ].nodeType === 9,
			hasOffset = !isWindow && !isDocument;
		return {
			element: withinElement,
			isWindow: isWindow,
			isDocument: isDocument,
			offset: hasOffset ? $( element ).offset() : { left: 0, top: 0 },
			scrollLeft: withinElement.scrollLeft(),
			scrollTop: withinElement.scrollTop(),
			width: withinElement.outerWidth(),
			height: withinElement.outerHeight()
		};
	}
};

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	options = $.extend( {}, options );

	var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
		target = $( options.of ),
		within = $.position.getWithinInfo( options.within ),
		scrollInfo = $.position.getScrollInfo( within ),
		collision = ( options.collision || "flip" ).split( " " ),
		offsets = {};

	dimensions = getDimensions( target );
	if ( target[ 0 ].preventDefault ) {

		options.at = "left top";
	}
	targetWidth = dimensions.width;
	targetHeight = dimensions.height;
	targetOffset = dimensions.offset;

	basePosition = $.extend( {}, targetOffset );

	$.each( [ "my", "at" ], function() {
		var pos = ( options[ this ] || "" ).split( " " ),
			horizontalOffset,
			verticalOffset;

		if ( pos.length === 1 ) {
			pos = rhorizontal.test( pos[ 0 ] ) ?
				pos.concat( [ "center" ] ) :
				rvertical.test( pos[ 0 ] ) ?
					[ "center" ].concat( pos ) :
					[ "center", "center" ];
		}
		pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
		pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

		horizontalOffset = roffset.exec( pos[ 0 ] );
		verticalOffset = roffset.exec( pos[ 1 ] );
		offsets[ this ] = [
			horizontalOffset ? horizontalOffset[ 0 ] : 0,
			verticalOffset ? verticalOffset[ 0 ] : 0
		];

		options[ this ] = [
			rposition.exec( pos[ 0 ] )[ 0 ],
			rposition.exec( pos[ 1 ] )[ 0 ]
		];
	} );

	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	if ( options.at[ 0 ] === "right" ) {
		basePosition.left += targetWidth;
	} else if ( options.at[ 0 ] === "center" ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[ 1 ] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[ 1 ] === "center" ) {
		basePosition.top += targetHeight / 2;
	}

	atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
	basePosition.left += atOffset[ 0 ];
	basePosition.top += atOffset[ 1 ];

	return this.each( function() {
		var collisionPosition, using,
			elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseCss( this, "marginLeft" ),
			marginTop = parseCss( this, "marginTop" ),
			collisionWidth = elemWidth + marginLeft + parseCss( this, "marginRight" ) +
				scrollInfo.width,
			collisionHeight = elemHeight + marginTop + parseCss( this, "marginBottom" ) +
				scrollInfo.height,
			position = $.extend( {}, basePosition ),
			myOffset = getOffsets( offsets.my, elem.outerWidth(), elem.outerHeight() );

		if ( options.my[ 0 ] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[ 0 ] === "center" ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[ 1 ] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[ 1 ] === "center" ) {
			position.top -= elemHeight / 2;
		}

		position.left += myOffset[ 0 ];
		position.top += myOffset[ 1 ];

		collisionPosition = {
			marginLeft: marginLeft,
			marginTop: marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[ i ] ] ) {
				$.ui.position[ collision[ i ] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
					my: options.my,
					at: options.at,
					within: within,
					elem: elem
				} );
			}
		} );

		if ( options.using ) {

			using = function( props ) {
				var left = targetOffset.left - position.left,
					right = left + targetWidth - elemWidth,
					top = targetOffset.top - position.top,
					bottom = top + targetHeight - elemHeight,
					feedback = {
						target: {
							element: target,
							left: targetOffset.left,
							top: targetOffset.top,
							width: targetWidth,
							height: targetHeight
						},
						element: {
							element: elem,
							left: position.left,
							top: position.top,
							width: elemWidth,
							height: elemHeight
						},
						horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
						vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
					};
				if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
					feedback.horizontal = "center";
				}
				if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
					feedback.vertical = "middle";
				}
				if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
					feedback.important = "horizontal";
				} else {
					feedback.important = "vertical";
				}
				options.using.call( this, props, feedback );
			};
		}

		elem.offset( $.extend( position, { using: using } ) );
	} );
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
				outerWidth = within.width,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = withinOffset - collisionPosLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
				newOverRight;

			if ( data.collisionWidth > outerWidth ) {

				if ( overLeft > 0 && overRight <= 0 ) {
					newOverRight = position.left + overLeft + data.collisionWidth - outerWidth -
						withinOffset;
					position.left += overLeft - newOverRight;

				} else if ( overRight > 0 && overLeft <= 0 ) {
					position.left = withinOffset;

				} else {
					if ( overLeft > overRight ) {
						position.left = withinOffset + outerWidth - data.collisionWidth;
					} else {
						position.left = withinOffset;
					}
				}

			} else if ( overLeft > 0 ) {
				position.left += overLeft;

			} else if ( overRight > 0 ) {
				position.left -= overRight;

			} else {
				position.left = max( position.left - collisionPosLeft, position.left );
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
				outerHeight = data.within.height,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = withinOffset - collisionPosTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
				newOverBottom;

			if ( data.collisionHeight > outerHeight ) {

				if ( overTop > 0 && overBottom <= 0 ) {
					newOverBottom = position.top + overTop + data.collisionHeight - outerHeight -
						withinOffset;
					position.top += overTop - newOverBottom;

				} else if ( overBottom > 0 && overTop <= 0 ) {
					position.top = withinOffset;

				} else {
					if ( overTop > overBottom ) {
						position.top = withinOffset + outerHeight - data.collisionHeight;
					} else {
						position.top = withinOffset;
					}
				}

			} else if ( overTop > 0 ) {
				position.top += overTop;

			} else if ( overBottom > 0 ) {
				position.top -= overBottom;

			} else {
				position.top = max( position.top - collisionPosTop, position.top );
			}
		}
	},
	flip: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.left + within.scrollLeft,
				outerWidth = within.width,
				offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = collisionPosLeft - offsetLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					data.at[ 0 ] === "right" ?
						-data.targetWidth :
						0,
				offset = -2 * data.offset[ 0 ],
				newOverRight,
				newOverLeft;

			if ( overLeft < 0 ) {
				newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth -
					outerWidth - withinOffset;
				if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
					position.left += myOffset + atOffset + offset;
				}
			} else if ( overRight > 0 ) {
				newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset +
					atOffset + offset - offsetLeft;
				if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
					position.left += myOffset + atOffset + offset;
				}
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.top + within.scrollTop,
				outerHeight = within.height,
				offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = collisionPosTop - offsetTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
				top = data.my[ 1 ] === "top",
				myOffset = top ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					data.at[ 1 ] === "bottom" ?
						-data.targetHeight :
						0,
				offset = -2 * data.offset[ 1 ],
				newOverTop,
				newOverBottom;
			if ( overTop < 0 ) {
				newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight -
					outerHeight - withinOffset;
				if ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) {
					position.top += myOffset + atOffset + offset;
				}
			} else if ( overBottom > 0 ) {
				newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset +
					offset - offsetTop;
				if ( newOverTop > 0 || abs( newOverTop ) < overBottom ) {
					position.top += myOffset + atOffset + offset;
				}
			}
		}
	},
	flipfit: {
		left: function() {
			$.ui.position.flip.left.apply( this, arguments );
			$.ui.position.fit.left.apply( this, arguments );
		},
		top: function() {
			$.ui.position.flip.top.apply( this, arguments );
			$.ui.position.fit.top.apply( this, arguments );
		}
	}
};

} )();

var position = $.ui.position;





var keycode = $.ui.keyCode = {
	BACKSPACE: 8,
	COMMA: 188,
	DELETE: 46,
	DOWN: 40,
	END: 35,
	ENTER: 13,
	ESCAPE: 27,
	HOME: 36,
	LEFT: 37,
	PAGE_DOWN: 34,
	PAGE_UP: 33,
	PERIOD: 190,
	RIGHT: 39,
	SPACE: 32,
	TAB: 9,
	UP: 38
};






var uniqueId = $.fn.extend( {
	uniqueId: ( function() {
		var uuid = 0;

		return function() {
			return this.each( function() {
				if ( !this.id ) {
					this.id = "ui-id-" + ( ++uuid );
				}
			} );
		};
	} )(),

	removeUniqueId: function() {
		return this.each( function() {
			if ( /^ui-id-\d+$/.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		} );
	}
} );



var safeActiveElement = $.ui.safeActiveElement = function( document ) {
	var activeElement;

	try {
		activeElement = document.activeElement;
	} catch ( error ) {
		activeElement = document.body;
	}

	if ( !activeElement ) {
		activeElement = document.body;
	}

	if ( !activeElement.nodeName ) {
		activeElement = document.body;
	}

	return activeElement;
};






var widgetsMenu = $.widget( "ui.menu", {
	version: "1.12.1",
	defaultElement: "<ul>",
	delay: 300,
	options: {
		icons: {
			submenu: "ui-icon-caret-1-e"
		},
		items: "> *",
		menus: "ul",
		position: {
			my: "left top",
			at: "right top"
		},
		role: "menu",

		blur: null,
		focus: null,
		select: null
	},

	_create: function() {
		this.activeMenu = this.element;

		this.mouseHandled = false;
		this.element
			.uniqueId()
			.attr( {
				role: this.options.role,
				tabIndex: 0
			} );

		this._addClass( "ui-menu", "ui-widget ui-widget-content" );
		this._on( {

			"mousedown .ui-menu-item": function( event ) {
				event.preventDefault();
			},
			"click .ui-menu-item": function( event ) {
				var target = $( event.target );
				var active = $( $.ui.safeActiveElement( this.document[ 0 ] ) );
				if ( !this.mouseHandled && target.not( ".ui-state-disabled" ).length ) {
					this.select( event );

					if ( !event.isPropagationStopped() ) {
						this.mouseHandled = true;
					}

					if ( target.has( ".ui-menu" ).length ) {
						this.expand( event );
					} else if ( !this.element.is( ":focus" ) &&
							active.closest( ".ui-menu" ).length ) {

						this.element.trigger( "focus", [ true ] );

						if ( this.active && this.active.parents( ".ui-menu" ).length === 1 ) {
							clearTimeout( this.timer );
						}
					}
				}
			},
			"mouseenter .ui-menu-item": function( event ) {

				if ( this.previousFilter ) {
					return;
				}

				var actualTarget = $( event.target ).closest( ".ui-menu-item" ),
					target = $( event.currentTarget );

				if ( actualTarget[ 0 ] !== target[ 0 ] ) {
					return;
				}

				this._removeClass( target.siblings().children( ".ui-state-active" ),
					null, "ui-state-active" );
				this.focus( event, target );
			},
			mouseleave: "collapseAll",
			"mouseleave .ui-menu": "collapseAll",
			focus: function( event, keepActiveItem ) {

				var item = this.active || this.element.find( this.options.items ).eq( 0 );

				if ( !keepActiveItem ) {
					this.focus( event, item );
				}
			},
			blur: function( event ) {
				this._delay( function() {
					var notContained = !$.contains(
						this.element[ 0 ],
						$.ui.safeActiveElement( this.document[ 0 ] )
					);
					if ( notContained ) {
						this.collapseAll( event );
					}
				} );
			},
			keydown: "_keydown"
		} );

		this.refresh();

		this._on( this.document, {
			click: function( event ) {
				if ( this._closeOnDocumentClick( event ) ) {
					this.collapseAll( event );
				}

				this.mouseHandled = false;
			}
		} );
	},

	_destroy: function() {
		var items = this.element.find( ".ui-menu-item" )
				.removeAttr( "role aria-disabled" ),
			submenus = items.children( ".ui-menu-item-wrapper" )
				.removeUniqueId()
				.removeAttr( "tabIndex role aria-haspopup" );

		this.element
			.removeAttr( "aria-activedescendant" )
			.find( ".ui-menu" ).addBack()
				.removeAttr( "role aria-labelledby aria-expanded aria-hidden aria-disabled " +
					"tabIndex" )
				.removeUniqueId()
				.show();

		submenus.children().each( function() {
			var elem = $( this );
			if ( elem.data( "ui-menu-submenu-caret" ) ) {
				elem.remove();
			}
		} );
	},

	_keydown: function( event ) {
		var match, prev, character, skip,
			preventDefault = true;

		switch ( event.keyCode ) {
		case $.ui.keyCode.PAGE_UP:
			this.previousPage( event );
			break;
		case $.ui.keyCode.PAGE_DOWN:
			this.nextPage( event );
			break;
		case $.ui.keyCode.HOME:
			this._move( "first", "first", event );
			break;
		case $.ui.keyCode.END:
			this._move( "last", "last", event );
			break;
		case $.ui.keyCode.UP:
			this.previous( event );
			break;
		case $.ui.keyCode.DOWN:
			this.next( event );
			break;
		case $.ui.keyCode.LEFT:
			this.collapse( event );
			break;
		case $.ui.keyCode.RIGHT:
			if ( this.active && !this.active.is( ".ui-state-disabled" ) ) {
				this.expand( event );
			}
			break;
		case $.ui.keyCode.ENTER:
		case $.ui.keyCode.SPACE:
			this._activate( event );
			break;
		case $.ui.keyCode.ESCAPE:
			this.collapse( event );
			break;
		default:
			preventDefault = false;
			prev = this.previousFilter || "";
			skip = false;

			character = event.keyCode >= 96 && event.keyCode <= 105 ?
				( event.keyCode - 96 ).toString() : String.fromCharCode( event.keyCode );

			clearTimeout( this.filterTimer );

			if ( character === prev ) {
				skip = true;
			} else {
				character = prev + character;
			}

			match = this._filterMenuItems( character );
			match = skip && match.index( this.active.next() ) !== -1 ?
				this.active.nextAll( ".ui-menu-item" ) :
				match;

			if ( !match.length ) {
				character = String.fromCharCode( event.keyCode );
				match = this._filterMenuItems( character );
			}

			if ( match.length ) {
				this.focus( event, match );
				this.previousFilter = character;
				this.filterTimer = this._delay( function() {
					delete this.previousFilter;
				}, 1000 );
			} else {
				delete this.previousFilter;
			}
		}

		if ( preventDefault ) {
			event.preventDefault();
		}
	},

	_activate: function( event ) {
		if ( this.active && !this.active.is( ".ui-state-disabled" ) ) {
			if ( this.active.children( "[aria-haspopup='true']" ).length ) {
				this.expand( event );
			} else {
				this.select( event );
			}
		}
	},

	refresh: function() {
		var menus, items, newSubmenus, newItems, newWrappers,
			that = this,
			icon = this.options.icons.submenu,
			submenus = this.element.find( this.options.menus );

		this._toggleClass( "ui-menu-icons", null, !!this.element.find( ".ui-icon" ).length );

		newSubmenus = submenus.filter( ":not(.ui-menu)" )
			.hide()
			.attr( {
				role: this.options.role,
				"aria-hidden": "true",
				"aria-expanded": "false"
			} )
			.each( function() {
				var menu = $( this ),
					item = menu.prev(),
					submenuCaret = $( "<span>" ).data( "ui-menu-submenu-caret", true );

				that._addClass( submenuCaret, "ui-menu-icon", "ui-icon " + icon );
				item
					.attr( "aria-haspopup", "true" )
					.prepend( submenuCaret );
				menu.attr( "aria-labelledby", item.attr( "id" ) );
			} );

		this._addClass( newSubmenus, "ui-menu", "ui-widget ui-widget-content ui-front" );

		menus = submenus.add( this.element );
		items = menus.find( this.options.items );

		items.not( ".ui-menu-item" ).each( function() {
			var item = $( this );
			if ( that._isDivider( item ) ) {
				that._addClass( item, "ui-menu-divider", "ui-widget-content" );
			}
		} );

		newItems = items.not( ".ui-menu-item, .ui-menu-divider" );
		newWrappers = newItems.children()
			.not( ".ui-menu" )
				.uniqueId()
				.attr( {
					tabIndex: -1,
					role: this._itemRole()
				} );
		this._addClass( newItems, "ui-menu-item" )
			._addClass( newWrappers, "ui-menu-item-wrapper" );

		items.filter( ".ui-state-disabled" ).attr( "aria-disabled", "true" );

		if ( this.active && !$.contains( this.element[ 0 ], this.active[ 0 ] ) ) {
			this.blur();
		}
	},

	_itemRole: function() {
		return {
			menu: "menuitem",
			listbox: "option"
		}[ this.options.role ];
	},

	_setOption: function( key, value ) {
		if ( key === "icons" ) {
			var icons = this.element.find( ".ui-menu-icon" );
			this._removeClass( icons, null, this.options.icons.submenu )
				._addClass( icons, null, value.submenu );
		}
		this._super( key, value );
	},

	_setOptionDisabled: function( value ) {
		this._super( value );

		this.element.attr( "aria-disabled", String( value ) );
		this._toggleClass( null, "ui-state-disabled", !!value );
	},

	focus: function( event, item ) {
		var nested, focused, activeParent;
		this.blur( event, event && event.type === "focus" );

		this._scrollIntoView( item );

		this.active = item.first();

		focused = this.active.children( ".ui-menu-item-wrapper" );
		this._addClass( focused, null, "ui-state-active" );

		if ( this.options.role ) {
			this.element.attr( "aria-activedescendant", focused.attr( "id" ) );
		}

		activeParent = this.active
			.parent()
				.closest( ".ui-menu-item" )
					.children( ".ui-menu-item-wrapper" );
		this._addClass( activeParent, null, "ui-state-active" );

		if ( event && event.type === "keydown" ) {
			this._close();
		} else {
			this.timer = this._delay( function() {
				this._close();
			}, this.delay );
		}

		nested = item.children( ".ui-menu" );
		if ( nested.length && event && ( /^mouse/.test( event.type ) ) ) {
			this._startOpening( nested );
		}
		this.activeMenu = item.parent();

		this._trigger( "focus", event, { item: item } );
	},

	_scrollIntoView: function( item ) {
		var borderTop, paddingTop, offset, scroll, elementHeight, itemHeight;
		if ( this._hasScroll() ) {
			borderTop = parseFloat( $.css( this.activeMenu[ 0 ], "borderTopWidth" ) ) || 0;
			paddingTop = parseFloat( $.css( this.activeMenu[ 0 ], "paddingTop" ) ) || 0;
			offset = item.offset().top - this.activeMenu.offset().top - borderTop - paddingTop;
			scroll = this.activeMenu.scrollTop();
			elementHeight = this.activeMenu.height();
			itemHeight = item.outerHeight();

			if ( offset < 0 ) {
				this.activeMenu.scrollTop( scroll + offset );
			} else if ( offset + itemHeight > elementHeight ) {
				this.activeMenu.scrollTop( scroll + offset - elementHeight + itemHeight );
			}
		}
	},

	blur: function( event, fromFocus ) {
		if ( !fromFocus ) {
			clearTimeout( this.timer );
		}

		if ( !this.active ) {
			return;
		}

		this._removeClass( this.active.children( ".ui-menu-item-wrapper" ),
			null, "ui-state-active" );

		this._trigger( "blur", event, { item: this.active } );
		this.active = null;
	},

	_startOpening: function( submenu ) {
		clearTimeout( this.timer );

		if ( submenu.attr( "aria-hidden" ) !== "true" ) {
			return;
		}

		this.timer = this._delay( function() {
			this._close();
			this._open( submenu );
		}, this.delay );
	},

	_open: function( submenu ) {
		var position = $.extend( {
			of: this.active
		}, this.options.position );

		clearTimeout( this.timer );
		this.element.find( ".ui-menu" ).not( submenu.parents( ".ui-menu" ) )
			.hide()
			.attr( "aria-hidden", "true" );

		submenu
			.show()
			.removeAttr( "aria-hidden" )
			.attr( "aria-expanded", "true" )
			.position( position );
	},

	collapseAll: function( event, all ) {
		clearTimeout( this.timer );
		this.timer = this._delay( function() {

			var currentMenu = all ? this.element :
				$( event && event.target ).closest( this.element.find( ".ui-menu" ) );

			if ( !currentMenu.length ) {
				currentMenu = this.element;
			}

			this._close( currentMenu );

			this.blur( event );

			this._removeClass( currentMenu.find( ".ui-state-active" ), null, "ui-state-active" );

			this.activeMenu = currentMenu;
		}, this.delay );
	},

	_close: function( startMenu ) {
		if ( !startMenu ) {
			startMenu = this.active ? this.active.parent() : this.element;
		}

		startMenu.find( ".ui-menu" )
			.hide()
			.attr( "aria-hidden", "true" )
			.attr( "aria-expanded", "false" );
	},

	_closeOnDocumentClick: function( event ) {
		return !$( event.target ).closest( ".ui-menu" ).length;
	},

	_isDivider: function( item ) {

		return !/[^\-\u2014\u2013\s]/.test( item.text() );
	},

	collapse: function( event ) {
		var newItem = this.active &&
			this.active.parent().closest( ".ui-menu-item", this.element );
		if ( newItem && newItem.length ) {
			this._close();
			this.focus( event, newItem );
		}
	},

	expand: function( event ) {
		var newItem = this.active &&
			this.active
				.children( ".ui-menu " )
					.find( this.options.items )
						.first();

		if ( newItem && newItem.length ) {
			this._open( newItem.parent() );

			this._delay( function() {
				this.focus( event, newItem );
			} );
		}
	},

	next: function( event ) {
		this._move( "next", "first", event );
	},

	previous: function( event ) {
		this._move( "prev", "last", event );
	},

	isFirstItem: function() {
		return this.active && !this.active.prevAll( ".ui-menu-item" ).length;
	},

	isLastItem: function() {
		return this.active && !this.active.nextAll( ".ui-menu-item" ).length;
	},

	_move: function( direction, filter, event ) {
		var next;
		if ( this.active ) {
			if ( direction === "first" || direction === "last" ) {
				next = this.active
					[ direction === "first" ? "prevAll" : "nextAll" ]( ".ui-menu-item" )
					.eq( -1 );
			} else {
				next = this.active
					[ direction + "All" ]( ".ui-menu-item" )
					.eq( 0 );
			}
		}
		if ( !next || !next.length || !this.active ) {
			next = this.activeMenu.find( this.options.items )[ filter ]();
		}

		this.focus( event, next );
	},

	nextPage: function( event ) {
		var item, base, height;

		if ( !this.active ) {
			this.next( event );
			return;
		}
		if ( this.isLastItem() ) {
			return;
		}
		if ( this._hasScroll() ) {
			base = this.active.offset().top;
			height = this.element.height();
			this.active.nextAll( ".ui-menu-item" ).each( function() {
				item = $( this );
				return item.offset().top - base - height < 0;
			} );

			this.focus( event, item );
		} else {
			this.focus( event, this.activeMenu.find( this.options.items )
				[ !this.active ? "first" : "last" ]() );
		}
	},

	previousPage: function( event ) {
		var item, base, height;
		if ( !this.active ) {
			this.next( event );
			return;
		}
		if ( this.isFirstItem() ) {
			return;
		}
		if ( this._hasScroll() ) {
			base = this.active.offset().top;
			height = this.element.height();
			this.active.prevAll( ".ui-menu-item" ).each( function() {
				item = $( this );
				return item.offset().top - base + height > 0;
			} );

			this.focus( event, item );
		} else {
			this.focus( event, this.activeMenu.find( this.options.items ).first() );
		}
	},

	_hasScroll: function() {
		return this.element.outerHeight() < this.element.prop( "scrollHeight" );
	},

	select: function( event ) {

		this.active = this.active || $( event.target ).closest( ".ui-menu-item" );
		var ui = { item: this.active };
		if ( !this.active.has( ".ui-menu" ).length ) {
			this.collapseAll( event, true );
		}
		this._trigger( "select", event, ui );
	},

	_filterMenuItems: function( character ) {
		var escapedCharacter = character.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" ),
			regex = new RegExp( "^" + escapedCharacter, "i" );

		return this.activeMenu
			.find( this.options.items )

				.filter( ".ui-menu-item" )
					.filter( function() {
						return regex.test(
							$.trim( $( this ).children( ".ui-menu-item-wrapper" ).text() ) );
					} );
	}
} );




}));


(function( factory ) {
	"use strict";
	if ( typeof define === "function" && define.amd ) {
		define([ "jquery", "jquery-ui/ui/widgets/menu" ], factory );
	} else {
		factory( jQuery );
	}
}(function( $ ) {

"use strict";

var supportSelectstart = "onselectstart" in document.createElement("div"),
	match = $.ui.menu.version.match(/^(\d)\.(\d+)/),
	uiVersion = {
		major: parseInt(match[1], 10),
		minor: parseInt(match[2], 10)
	},
	isLTE110 = ( uiVersion.major < 2 && uiVersion.minor <= 10 ),
	isLTE111 = ( uiVersion.major < 2 && uiVersion.minor <= 11 );

$.widget("moogle.contextmenu", {
	version: "@VERSION",
	options: {
		addClass: "ui-contextmenu",  
		closeOnWindowBlur: true,     
		autoFocus: false,     
		autoTrigger: true,    
		delegate: null,       
		hide: { effect: "fadeOut", duration: "fast" },
		ignoreParentSelect: true, 
		menu: null,           
		position: null,       
		preventContextMenuForPopup: false, 
		preventSelect: false, 
		show: { effect: "slideDown", duration: "fast" },
		taphold: false,       
		uiMenuOptions: {},	  
		beforeOpen: $.noop,   
		blur: $.noop,         
		close: $.noop,        
		create: $.noop,       
		createMenu: $.noop,   
		focus: $.noop,        
		open: $.noop,         
		select: $.noop        
	},
	_create: function() {
		var cssText, eventNames, targetId,
			opts = this.options;

		this.$headStyle = null;
		this.$menu = null;
		this.menuIsTemp = false;
		this.currentTarget = null;
		this.extraData = {};
		this.previousFocus = null;

		if (opts.delegate == null) {
			$.error("ui-contextmenu: Missing required option `delegate`.");
		}
		if (opts.preventSelect) {
			targetId = ($(this.element).is(document) ? $("body")
				: this.element).uniqueId().attr("id");
			cssText = "#" + targetId + " " + opts.delegate + " { " +
					"-webkit-user-select: none; " +
					"-khtml-user-select: none; " +
					"-moz-user-select: none; " +
					"-ms-user-select: none; " +
					"user-select: none; " +
					"}";
			this.$headStyle = $("<style class='moogle-contextmenu-style' />")
				.prop("type", "text/css")
				.appendTo("head");

			try {
				this.$headStyle.html(cssText);
			} catch ( e ) {
				this.$headStyle[0].styleSheet.cssText = cssText;
			}
			if (supportSelectstart) {
				this.element.on("selectstart" + this.eventNamespace, opts.delegate,
									  function(event) {
					event.preventDefault();
				});
			}
		}
		this._createUiMenu(opts.menu);

		eventNames = "contextmenu" + this.eventNamespace;
		if (opts.taphold) {
			eventNames += " taphold" + this.eventNamespace;
		}
		this.element.on(eventNames, opts.delegate, $.proxy(this._openMenu, this));
	},
	_destroy: function() {
		this.element.off(this.eventNamespace);

		this._createUiMenu(null);

		if (this.$headStyle) {
			this.$headStyle.remove();
			this.$headStyle = null;
		}
	},
	_createUiMenu: function(menuDef) {
		var ct, ed,
			opts = this.options;

		if (this.isOpen()) {
			ct = this.currentTarget;
			ed = this.extraData;
			this._closeMenu(true);
			this.currentTarget = ct;
			this.extraData = ed;
		}
		if (this.menuIsTemp) {
			this.$menu.remove(); 
		} else if (this.$menu) {
			this.$menu
				.menu("destroy")
				.removeClass(this.options.addClass)
				.hide();
		}
		this.$menu = null;
		this.menuIsTemp = false;
		if ( !menuDef ) {
			return;
		} else if ($.isArray(menuDef)) {
			this.$menu = $.moogle.contextmenu.createMenuMarkup(menuDef);
			this.menuIsTemp = true;
		}else if ( typeof menuDef === "string" ) {
			this.$menu = $(menuDef);
		} else {
			this.$menu = menuDef;
		}
		this.$menu
			.hide()
			.addClass(opts.addClass)
			.menu($.extend(true, {}, opts.uiMenuOptions, {
				items: "> :not(.ui-widget-header)",
				blur: $.proxy(opts.blur, this),
				create: $.proxy(opts.createMenu, this),
				focus: $.proxy(opts.focus, this),
				select: $.proxy(function(event, ui) {
					var retval,
						isParent = $.moogle.contextmenu.isMenu(ui.item),
						actionHandler = ui.item.data("actionHandler");

					ui.cmd = ui.item.attr("data-command");
					ui.target = $(this.currentTarget);
					ui.extraData = this.extraData;
					if ( !isParent || !opts.ignoreParentSelect) {
						retval = this._trigger.call(this, "select", event, ui);
						if ( actionHandler ) {
							retval = actionHandler.call(this, event, ui);
						}
						if ( retval !== false ) {
							this._closeMenu.call(this);
						}
						event.preventDefault();
					}
				}, this)
			}));
	},
	_openMenu: function(event, recursive) {
		var res, promise, ui,
			opts = this.options,
			posOption = opts.position,
			self = this,
			manualTrigger = !!event.isTrigger;

		if ( !opts.autoTrigger && !manualTrigger ) {
			return;
		}
		event.preventDefault();

		this.currentTarget = event.target;
		this.extraData = event._extraData || {};

		ui = { menu: this.$menu, target: $(this.currentTarget), extraData: this.extraData,
			   originalEvent: event, result: null };

		if ( !recursive ) {
			res = this._trigger("beforeOpen", event, ui);
			promise = (ui.result && $.isFunction(ui.result.promise)) ? ui.result : null;
			ui.result = null;
			if ( res === false ) {
				this.currentTarget = null;
				return false;
			} else if ( promise ) {
				promise.done(function() {
					self._openMenu(event, true);
				});
				this.currentTarget = null;
				return false;
			}
			ui.menu = this.$menu; 
		}

		$(document).on("keydown" + this.eventNamespace, function(event) {
			if ( event.which === $.ui.keyCode.ESCAPE ) {
				self._closeMenu();
			}
		}).on("mousedown" + this.eventNamespace + " touchstart" + this.eventNamespace,
				function(event) {
			if ( !$(event.target).closest(".ui-menu-item").length ) {
				self._closeMenu();
			}
		});
		$(window).on("blur" + this.eventNamespace, function(event) {
			if ( opts.closeOnWindowBlur ) {
				self._closeMenu();
			}
		});

		if ($.isFunction(posOption)) {
			posOption = posOption(event, ui);
		}
		posOption = $.extend({
			my: "left top",
			at: "left bottom",
			of: (event.pageX === undefined) ? event.target : event,
			collision: "fit"
		}, posOption);

		this._updateEntries(this.$menu);

		this.$menu
			.show() 
			.css({
				position: "absolute",
				left: 0,
				top: 0
			}).position(posOption)
			.hide(); 

		if ( opts.preventContextMenuForPopup ) {
			this.$menu.on("contextmenu" + this.eventNamespace, function(event) {
				event.preventDefault();
			});
		}
		this._show(this.$menu, opts.show, function() {
			var $first;

			if ( opts.autoFocus ) {
				self.previousFocus = $(event.target);
				$first = self.$menu
					.children("li.ui-menu-item")
					.not(".ui-state-disabled")
					.first();
				self.$menu.menu("focus", null, $first).focus();
			}
			self._trigger.call(self, "open", event, ui);
		});
	},
	_closeMenu: function(immediately) {
		var self = this,
			hideOpts = immediately ? false : this.options.hide,
			ui = { menu: this.$menu, target: $(this.currentTarget), extraData: this.extraData };

		$(document)
			.off("mousedown" + this.eventNamespace)
			.off("touchstart" + this.eventNamespace)
			.off("keydown" + this.eventNamespace);
		$(window)
			.off("blur" + this.eventNamespace);

		self.currentTarget = null; 
		self.extraData = {};
		if ( this.$menu ) { 
			this.$menu
				.off("contextmenu" + this.eventNamespace);
			this._hide(this.$menu, hideOpts, function() {
				if ( self.previousFocus ) {
					self.previousFocus.focus();
					self.previousFocus = null;
				}
				self._trigger("close", null, ui);
			});
		} else {
			self._trigger("close", null, ui);
		}
	},
	_setOption: function(key, value) {
		switch (key) {
		case "menu":
			this.replaceMenu(value);
			break;
		}
		$.Widget.prototype._setOption.apply(this, arguments);
	},
	_getMenuEntry: function(cmd) {
		return this.$menu.find("li[data-command=" + cmd + "]");
	},
	close: function() {
		if (this.isOpen()) {
			this._closeMenu();
		}
	},
	_updateEntries: function() {
		var self = this,
			ui = {
				menu: this.$menu, target: $(this.currentTarget), extraData: this.extraData };

		$.each(this.$menu.find(".ui-menu-item"), function(i, o) {
			var $entry = $(o),
				fn = $entry.data("disabledHandler"),
				res = fn ? fn({ type: "disabled" }, ui) : null;

			ui.item = $entry;
			ui.cmd = $entry.attr("data-command");
			if ( res != null ) {
				self.enableEntry(ui.cmd, !res);
				self.showEntry(ui.cmd, res !== "hide");
			}
			fn = $entry.data("titleHandler"),
			res = fn ? fn({ type: "title" }, ui) : null;
			if ( res != null ) {
				self.setTitle(ui.cmd, "" + res);
			}
			fn = $entry.data("tooltipHandler"),
			res = fn ? fn({ type: "tooltip" }, ui) : null;
			if ( res != null ) {
				$entry.attr("title", "" + res);
			}
		});
	},
	enableEntry: function(cmd, flag) {
		this._getMenuEntry(cmd).toggleClass("ui-state-disabled", (flag === false));
	},
	getEntry: function(cmd) {
		return this._getMenuEntry(cmd);
	},
	getEntryWrapper: function(cmd) {
		return this._getMenuEntry(cmd).find(">[role=menuitem]").addBack("[role=menuitem]");
	},
	getMenu: function() {
		return this.$menu;
	},
	isOpen: function() {
		return !!this.$menu && !!this.currentTarget;
	},
	open: function(targetOrEvent, extraData) {
		extraData = extraData || {};

		var isEvent = (targetOrEvent && targetOrEvent.type && targetOrEvent.target),
			event =  isEvent ? targetOrEvent : {},
			target = isEvent ? targetOrEvent.target : targetOrEvent,
			e = jQuery.Event("contextmenu", {
				target: $(target).get(0),
				pageX: event.pageX,
				pageY: event.pageY,
				originalEvent: isEvent ? targetOrEvent : undefined,
				_extraData: extraData
			});
		return this.element.trigger(e);
	},
	replaceMenu: function(data) {
		this._createUiMenu(data);
	},
	setEntry: function(cmd, entry) {
		var $ul,
			$entryLi = this._getMenuEntry(cmd);

		if (typeof entry === "string") {
			window.console && window.console.warn(
				"setEntry(cmd, t) with a plain string title is deprecated since v1.18." +
				"Use setTitle(cmd, '" + entry + "') instead.");
			return this.setTitle(cmd, entry);
		}
		$entryLi.empty();
		entry.cmd = entry.cmd || cmd;
		$.moogle.contextmenu.createEntryMarkup(entry, $entryLi);
		if ($.isArray(entry.children)) {
			$ul = $("<ul/>").appendTo($entryLi);
			$.moogle.contextmenu.createMenuMarkup(entry.children, $ul);
		}
		$entryLi.removeClass("ui-menu-item");
		this.getMenu().menu("refresh");
	},
	setIcon: function(cmd, icon) {
		return this.updateEntry(cmd, { uiIcon: icon });
	},
	setTitle: function(cmd, title) {
		return this.updateEntry(cmd, { title: title });
	},
	showEntry: function(cmd, flag) {
		this._getMenuEntry(cmd).toggle(flag !== false);
	},
	updateEntry: function(cmd, entry) {
		var $icon, $wrapper,
			$entryLi = this._getMenuEntry(cmd);

		if ( entry.title !== undefined ) {
			$.moogle.contextmenu.updateTitle($entryLi, "" + entry.title);
		}
		if ( entry.tooltip !== undefined ) {
			if ( entry.tooltip === null ) {
				$entryLi.removeAttr("title");
			} else {
				$entryLi.attr("title", entry.tooltip);
			}
		}
		if ( entry.uiIcon !== undefined ) {
			$wrapper = this.getEntryWrapper(cmd),
			$icon = $wrapper.find("span.ui-icon").not(".ui-menu-icon");
			$icon.remove();
			if ( entry.uiIcon ) {
				$wrapper.append($("<span class='ui-icon' />").addClass(entry.uiIcon));
			}
		}
		if ( entry.hide !== undefined ) {
			$entryLi.toggle(!entry.hide);
		} else if ( entry.show !== undefined ) {
			$entryLi.toggle(!!entry.show);
		}
		if ( entry.data !== undefined ) {
			$entryLi.data(entry.data);
		}

		if ( entry.disabled === undefined ) {
			entry.disabled = $entryLi.hasClass("ui-state-disabled");
		}
		if ( entry.setClass ) {
			if ( $entryLi.hasClass("ui-menu-item") ) {
				entry.setClass += " ui-menu-item";
			}
			$entryLi.removeClass();
			$entryLi.addClass(entry.setClass);
		} else if ( entry.addClass ) {
			$entryLi.addClass(entry.addClass);
		}
		$entryLi.toggleClass("ui-state-disabled", !!entry.disabled);
	}
});

$.extend($.moogle.contextmenu, {
	createEntryMarkup: function(entry, $parentLi) {
		var $wrapper = null;

		$parentLi.attr("data-command", entry.cmd);

		if ( !/[^\-\u2014\u2013\s]/.test( entry.title ) ) {
			$parentLi.text(entry.title);
		} else {
			if ( isLTE110 ) {
				$wrapper = $("<a/>", {
						html: "" + entry.title,
						href: "#"
					}).appendTo($parentLi);

			} else if ( isLTE111 ) {
				$parentLi.html("" + entry.title);
				$wrapper = $parentLi;

			} else {
				$wrapper = $("<div/>", {
						html: "" + entry.title
					}).appendTo($parentLi);
			}
			if ( entry.uiIcon ) {
				$wrapper.append($("<span class='ui-icon' />").addClass(entry.uiIcon));
			}
			$.each( [ "action", "disabled", "title", "tooltip" ], function(i, attr) {
				if ( $.isFunction(entry[attr]) ) {
					$parentLi.data(attr + "Handler", entry[attr]);
				}
			});
			if ( entry.disabled === true ) {
				$parentLi.addClass("ui-state-disabled");
			}
			if ( entry.isHeader ) {
				$parentLi.addClass("ui-widget-header");
			}
			if ( entry.addClass ) {
				$parentLi.addClass(entry.addClass);
			}
			if ( $.isPlainObject(entry.data) ) {
				$parentLi.data(entry.data);
			}
			if ( typeof entry.tooltip === "string" ) {
				$parentLi.attr("title", entry.tooltip);
			}
		}
	},
	createMenuMarkup: function(options, $parentUl) {
		var i, menu, $ul, $li;
		if ( $parentUl == null ) {
			$parentUl = $("<ul class='ui-helper-hidden' />").appendTo("body");
		}
		for (i = 0; i < options.length; i++) {
			menu = options[i];
			$li = $("<li/>").appendTo($parentUl);

			$.moogle.contextmenu.createEntryMarkup(menu, $li);

			if ( $.isArray(menu.children) ) {
				$ul = $("<ul/>").appendTo($li);
				$.moogle.contextmenu.createMenuMarkup(menu.children, $ul);
			}
		}
		return $parentUl;
	},
	isMenu: function(item) {
		if ( isLTE110 ) {
			return item.has(">a[aria-haspopup='true']").length > 0;
		} else if ( isLTE111 ) {  
			return item.is("[aria-haspopup='true']");
		} else {
			return item.has(">div[aria-haspopup='true']").length > 0;
		}
	},
	replaceFirstTextNodeChild: function(elem, html) {
		var $icons = elem.find(">span.ui-icon,>ul.ui-menu").detach();

		elem
			.empty()
			.html(html)
			.append($icons);
	},
	updateTitle: function(item, title) {
		if ( isLTE110 ) {  
			$.moogle.contextmenu.replaceFirstTextNodeChild($("a", item), title);
		} else if ( isLTE111 ) {  
			$.moogle.contextmenu.replaceFirstTextNodeChild(item, title);
		} else {  
			$.moogle.contextmenu.replaceFirstTextNodeChild($("div", item), title);
		}
	}
});

}));

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


(function(win, doc, NS) {

    var instance = '__instance__',
        first = 'firstChild',
        delay = setTimeout;

    function is_set(x) {
        return typeof x !== "undefined";
    }

    function is_string(x) {
        return typeof x === "string";
    }

    function is_object(x) {
        return typeof x === "object";
    }

    function object_length(x) {
        return Object.keys(x).length;
    }

    function edge(a, b, c) {
        if (a < b) return b;
        if (a > c) return c;
        return a;
    }

    function num(i, j) {
        return parseInt(i, j || 10);
    }

    function round(i) {
        return Math.round(i);
    }

    function HSV2RGB(a) {
        var h = +a[0],
            s = +a[1],
            v = +a[2],
            r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        i = i || 0;
        q = q || 0;
        t = t || 0;
        switch (i % 6) {
            case 0:
                r = v, g = t, b = p;
                break;
            case 1:
                r = q, g = v, b = p;
                break;
            case 2:
                r = p, g = v, b = t;
                break;
            case 3:
                r = p, g = q, b = v;
                break;
            case 4:
                r = t, g = p, b = v;
                break;
            case 5:
                r = v, g = p, b = q;
                break;
        }
        return [round(r * 255), round(g * 255), round(b * 255)];
    }

    function HSV2HEX(a) {
        return RGB2HEX(HSV2RGB(a));
    }

    function RGB2HSV(a) {
        var r = +a[0],
            g = +a[1],
            b = +a[2],
            max = Math.max(r, g, b),
            min = Math.min(r, g, b),
            d = max - min,
            h, s = (max === 0 ? 0 : d / max),
            v = max / 255;
        switch (max) {
            case min:
                h = 0;
                break;
            case r:
                h = (g - b) + d * (g < b ? 6 : 0);
                h /= 6 * d;
                break;
            case g:
                h = (b - r) + d * 2;
                h /= 6 * d;
                break;
            case b:
                h = (r - g) + d * 4;
                h /= 6 * d;
                break;
        }
        return [h, s, v];
    }

    function RGB2HEX(a) {
        var s = +a[2] | (+a[1] << 8) | (+a[0] << 16);
        s = '000000' + s.toString(16);
        return s.slice(-6);
    }

    function HEX2HSV(s) {
        return RGB2HSV(HEX2RGB(s));
    }

    function HEX2RGB(s) {
        if (s.length === 3) {
            s = s.replace(/./g, '$&$&');
        }
        return [num(s[0] + s[1], 16), num(s[2] + s[3], 16), num(s[4] + s[5], 16)];
    }

    function _2HSV_pri(a) {
        return [+a[0] / 360, +a[1] / 100, +a[2] / 100];
    }

    function _2HSV_pub(a) {
        return [round(+a[0] * 360), round(+a[1] * 100), round(+a[2] * 100)];
    }

    function _2RGB_pri(a) {
        return [+a[0] / 255, +a[1] / 255, +a[2] / 255];
    }

    function parse(x) {
        if (is_object(x)) return x;
        var rgb = /\s*rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*$/i.exec(x),
            hsv = /\s*hsv\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)\s*$/i.exec(x),
            hex = x[0] === '#' && x.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
        if (hex) {
            return HEX2HSV(x.slice(1));
        } else if (hsv) {
            return _2HSV_pri([+hsv[1], +hsv[2], +hsv[3]]);
        } else if (rgb) {
            return RGB2HSV([+rgb[1], +rgb[2], +rgb[3]]);
        }
        return [0, 1, 1]; 
    }

    (function($) {

        $.version = '1.4.2';

        $[instance] = {};

        $.each = function(fn, t) {
            return delay(function() {
                var ins = $[instance], i;
                for (i in ins) {
                    fn.call(ins[i], i, ins);
                }
            }, t === 0 ? 0 : (t || 1)), $;
        };

        $.parse = parse;
        $._HSV2RGB = HSV2RGB;
        $._HSV2HEX = HSV2HEX;
        $._RGB2HSV = RGB2HSV;
        $._HEX2HSV = HEX2HSV;
        $._HEX2RGB = function(a) {
            return _2RGB_pri(HEX2RGB(a));
        };
        $.HSV2RGB = function(a) {
            return HSV2RGB(_2HSV_pri(a));
        };
        $.HSV2HEX = function(a) {
            return HSV2HEX(_2HSV_pri(a));
        };
        $.RGB2HSV = function(a) {
            return _2HSV_pub(RGB2HSV(a));
        };
        $.RGB2HEX = RGB2HEX;
        $.HEX2HSV = function(s) {
            return _2HSV_pub(HEX2HSV(s));
        };
        $.HEX2RGB = HEX2RGB;

    })(win[NS] = function(source, events, parent) {

        var b = doc.body,
            h = doc.documentElement,
            $ = this,
            $$ = win[NS],
            _ = false,
            hooks = {},
            self = doc.createElement('div'),
            on_down = "touchstart mousedown",
            on_move = "touchmove mousemove",
            on_up = "touchend mouseup",
            on_resize = "orientationchange resize";

        if (!($ instanceof $$)) {
            return new $$(source, events);
        }

        $$[instance][source.id || source.name || object_length($$[instance])] = $;

        if (!is_set(events) || events === true) {
            events = on_down;
        }

        function on(ev, el, fn) {
            ev = ev.split(/\s+/);
            for (var i = 0, ien = ev.length; i < ien; ++i) {
                el.addEventListener(ev[i], fn, false);
            }
        }

        function off(ev, el, fn) {
            ev = ev.split(/\s+/);
            for (var i = 0, ien = ev.length; i < ien; ++i) {
                el.removeEventListener(ev[i], fn);
            }
        }

        function point(el, e) {
            var T = 'touches',
                X = 'clientX',
                Y = 'clientY',
                x = !!e[T] ? e[T][0][X] : e[X],
                y = !!e[T] ? e[T][0][Y] : e[Y],
                o = offset(el);
            return {
                x: x - o.l,
                y: y - o.t
            };
        }

        function offset(el) {
            var left, top, rect;
            if (el === win) {
                left = win.pageXOffset || h.scrollLeft;
                top = win.pageYOffset || h.scrollTop;
            } else {
                rect = el.getBoundingClientRect();
                left = rect.left;
                top = rect.top;
            }
            return {
                l: left,
                t: top
            };
        }

        function closest(a, b) {
            while ((a = a.parentElement) && a !== b);
            return a;
        }

        function prevent(e) {
            if (e) e.preventDefault();
        }

        function size(el) {
            return el === win ? {
                w: win.innerWidth,
                h: win.innerHeight
            } : {
                w: el.offsetWidth,
                h: el.offsetHeight
            };
        }

        function get_data(a) {
            return _ || (is_set(a) ? a : false);
        }

        function set_data(a) {
            _ = a;
        }

        function add(ev, fn, id) {
            if (!is_set(ev)) return hooks;
            if (!is_set(fn)) return hooks[ev];
            if (!is_set(hooks[ev])) hooks[ev] = {};
            if (!is_set(id)) id = object_length(hooks[ev]);
            return hooks[ev][id] = fn, $;
        }

        function remove(ev, id) {
            if (!is_set(ev)) return hooks = {}, $;
            if (!is_set(id)) return hooks[ev] = {}, $;
            return delete hooks[ev][id], $;
        }

        function trigger(ev, a, id) {
            if (!is_set(hooks[ev])) return $;
            if (!is_set(id)) {
                for (var i in hooks[ev]) {
                    hooks[ev][i].apply($, a);
                }
            } else {
                if (is_set(hooks[ev][id])) {
                    hooks[ev][id].apply($, a);
                }
            }
            return $;
        }

        set_data($$.parse(source.getAttribute('data-color') || source.value || [0, 1, 1]));

        self.className = 'color-picker';
        self.innerHTML = '<div class="color-picker-container"><span class="color-picker-h"><i></i></span><span class="color-picker-sv"><i></i></span></div>';
        var c = self[first].children,
            HSV = get_data([0, 1, 1]), 
            H = c[0],
            SV = c[1],
            H_point = H[first],
            SV_point = SV[first],
            start_H = 0,
            start_SV = 0,
            drag_H = 0,
            drag_SV = 0,
            left = 0,
            top = 0,
            P_W = 0,
            P_H = 0,
            v = [HSV2HEX(HSV)],
            set;

        function trigger_(k, x) {
            if (!k || k === "h") {
                trigger("change:h", x);
            }
            if (!k || k === "sv") {
                trigger("change:sv", x);
            }
            trigger("change", x);
        }

        function visible() {
            return self.parentNode;
        }

        function create(first, bucket) {
            if (!first) {
                (parent || bucket || b).appendChild(self), $.visible = true;
            }
            P_W = size(self).w;
            P_H = size(self).h;
            var SV_size = size(SV),
                SV_point_size = size(SV_point),
                H_H = size(H).h,
                SV_W = SV_size.w,
                SV_H = SV_size.h,
                H_point_H = size(H_point).h,
                SV_point_W = SV_point_size.w,
                SV_point_H = SV_point_size.h;
            if (first) {
                self.style.left = self.style.top = '-9999px';
                function click(e) {
                    var t = e.target,
                        is_source = t === source || closest(t, source) === source;
                    if (is_source) {
                        !visible() && (create(), trigger("enter"));
                    } else {
                        $.exit();
                    }
                }
                if (events !== false) {
                    on(events, source, click);
                }
                $.create = function() {
                    return create(1), trigger("create"), $;
                };
                $.destroy = function() {
                    if (events !== false) {
                        off(events, source, click);
                    }
                    $.exit(), set_data(false);
                    return trigger("destroy"), $;
                };
            } else {
                fit();
            }
            set = function() {
                HSV = get_data(HSV), color();
                H_point.style.top = (H_H - (H_point_H / 2) - (H_H * +HSV[0])) + 'px';
                SV_point.style.right = (SV_W - (SV_point_W / 2) - (SV_W * +HSV[1])) + 'px';
                SV_point.style.top = (SV_H - (SV_point_H / 2) - (SV_H * +HSV[2])) + 'px';
            };
            $.exit = function(e) {
                var exist = visible();
                if (exist) {
                    exist.removeChild(self);
                    $.visible = false;
                }
                off(on_down, H, down_H);
                off(on_down, SV, down_SV);
                off(on_move, doc, move);
                off(on_up, doc, stop);
                off(on_resize, win, fit);
                return trigger("exit"), $;
            };
            function color(e) {
                var a = HSV2RGB(HSV),
                    b = HSV2RGB([HSV[0], 1, 1]);
                SV.style.backgroundColor = 'rgb(' + b.join(',') + ')';
                set_data(HSV);
                prevent(e);
            };
            set();
            function do_H(e) {
                var y = edge(point(H, e).y, 0, H_H);
                HSV[0] = (H_H - y) / H_H;
                H_point.style.top = (y - (H_point_H / 2)) + 'px';
                color(e);
            }
            function do_SV(e) {
                var o = point(SV, e),
                    x = edge(o.x, 0, SV_W),
                    y = edge(o.y, 0, SV_H);
                HSV[1] = 1 - ((SV_W - x) / SV_W);
                HSV[2] = (SV_H - y) / SV_H;
                SV_point.style.right = (SV_W - x - (SV_point_W / 2)) + 'px';
                SV_point.style.top = (y - (SV_point_H / 2)) + 'px';
                color(e);
            }
            function move(e) {
                if (drag_H) {
                    do_H(e), v = [HSV2HEX(HSV)];
                    if (!start_H) {
                        trigger("drag:h", v);
                        trigger("drag", v);
                        trigger_("h", v);
                    }
                }
                if (drag_SV) {
                    do_SV(e), v = [HSV2HEX(HSV)];
                    if (!start_SV) {
                        trigger("drag:sv", v);
                        trigger("drag", v);
                        trigger_("sv", v);
                    }
                }
                start_H = 0,
                start_SV = 0;
            }
            function stop(e) {
                var t = e.target,
                    k = drag_H ? "h" : "sv",
                    a = [HSV2HEX(HSV), $],
                    is_source = t === source || closest(t, source) === source,
                    is_self = t === self || closest(t, self) === self;
                if (!is_source && !is_self) {
                    if (visible() && events !== false) $.exit(), trigger_(0, a);
                } else {
                    if (is_self) {
                        trigger("stop:" + k, a);
                        trigger("stop", a);
                        trigger_(k, a);
                    }
                }
                drag_H = 0,
                drag_SV = 0;
            }
            function down_H(e) {
                start_H = 1,
                drag_H = 1,
                move(e), prevent(e);
                trigger("start:h", v);
                trigger("start", v);
                trigger_("h", v);
            }
            function down_SV(e) {
                start_SV = 1,
                drag_SV = 1,
                move(e), prevent(e);
                trigger("start:sv", v);
                trigger("start", v);
                trigger_("sv", v);
            }
            if (!first) {
                on(on_down, H, down_H);
                on(on_down, SV, down_SV);
                on(on_move, doc, move);
                on(on_up, doc, stop);
                on(on_resize, win, fit);
            }
        } create(1);

        delay(function() {
            var a = [HSV2HEX(HSV)];
            trigger("create", a);
            trigger_(0, a);
        }, 0);

        $.fit = function(o) {
            var w = size(win),
                y = size(h),
                screen_w = w.w - y.w, 
                screen_h = w.h - h.clientHeight, 
                ww = offset(win),
                to = offset(source);
            left = to.l + ww.l;
            top = to.t + ww.t + size(source).h; 
            if (is_object(o)) {
                is_set(o[0]) && (left = o[0]);
                is_set(o[1]) && (top = o[1]);
            } else {
                var min_x = ww.l,
                    min_y = ww.t,
                    max_x = ww.l + w.w - P_W - screen_w,
                    max_y = ww.t + w.h - P_H - screen_h;
                left = edge(left, min_x, max_x) >> 0;
                top = edge(top, min_y, max_y) >> 0;
            }
            self.style.left = left + 'px';
            self.style.top = top + 'px';
            return trigger("fit"), $;
        };

        function fit() {
            return $.fit();
        }

        $.set = function(a) {
            if (!is_set(a)) return get_data();
            if (is_string(a)) {
                a = $$.parse(a);
            }
            return set_data(a), set(), $;
        };

        $.get = function(a) {
            return get_data(a);
        };

        $.source = source;
        $.self = self;
        $.visible = false;
        $.on = add;
        $.off = remove;
        $.fire = trigger;
        $.hooks = hooks;
        $.enter = function(bucket) {
            return create(0, bucket), trigger("enter"), $;
        };

        return $;

    });

})(window, document, 'CP');





(function( factory ) {
	"use strict";

	if ( typeof define === 'function' && define.amd ) {
		define( ['jquery'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ ) {
				$ = typeof window !== 'undefined' ? 
					require('jquery') :
					require('jquery')( root );
			}

			return factory( $, root, root.document );
		};
	}
	else {
		factory( jQuery, window, document );
	}
}
(function( $, window, document, undefined ) {
	"use strict";

	var DataTable = function ( options )
	{
		this.$ = function ( sSelector, oOpts )
		{
			return this.api(true).$( sSelector, oOpts );
		};


		this._ = function ( sSelector, oOpts )
		{
			return this.api(true).rows( sSelector, oOpts ).data();
		};


		this.api = function ( traditional )
		{
			return traditional ?
				new _Api(
					_fnSettingsFromNode( this[ _ext.iApiIndex ] )
				) :
				new _Api( this );
		};


		this.fnAddData = function( data, redraw )
		{
			var api = this.api( true );

			var rows = Array.isArray(data) && ( Array.isArray(data[0]) || $.isPlainObject(data[0]) ) ?
				api.rows.add( data ) :
				api.row.add( data );

					if ( redraw === undefined || redraw ) {
				api.draw();
			}

					return rows.flatten().toArray();
		};


		this.fnAdjustColumnSizing = function ( bRedraw )
		{
			var api = this.api( true ).columns.adjust();
			var settings = api.settings()[0];
			var scroll = settings.oScroll;

					if ( bRedraw === undefined || bRedraw ) {
				api.draw( false );
			}
			else if ( scroll.sX !== "" || scroll.sY !== "" ) {
				_fnScrollDraw( settings );
			}
		};


		this.fnClearTable = function( bRedraw )
		{
			var api = this.api( true ).clear();

					if ( bRedraw === undefined || bRedraw ) {
				api.draw();
			}
		};


		this.fnClose = function( nTr )
		{
			this.api( true ).row( nTr ).child.hide();
		};


		this.fnDeleteRow = function( target, callback, redraw )
		{
			var api = this.api( true );
			var rows = api.rows( target );
			var settings = rows.settings()[0];
			var data = settings.aoData[ rows[0][0] ];

					rows.remove();

					if ( callback ) {
				callback.call( this, settings, data );
			}

					if ( redraw === undefined || redraw ) {
				api.draw();
			}

					return data;
		};


		this.fnDestroy = function ( remove )
		{
			this.api( true ).destroy( remove );
		};


		this.fnDraw = function( complete )
		{
			this.api( true ).draw( complete );
		};


		this.fnFilter = function( sInput, iColumn, bRegex, bSmart, bShowGlobal, bCaseInsensitive )
		{
			var api = this.api( true );

					if ( iColumn === null || iColumn === undefined ) {
				api.search( sInput, bRegex, bSmart, bCaseInsensitive );
			}
			else {
				api.column( iColumn ).search( sInput, bRegex, bSmart, bCaseInsensitive );
			}

					api.draw();
		};


		this.fnGetData = function( src, col )
		{
			var api = this.api( true );

					if ( src !== undefined ) {
				var type = src.nodeName ? src.nodeName.toLowerCase() : '';

						return col !== undefined || type == 'td' || type == 'th' ?
					api.cell( src, col ).data() :
					api.row( src ).data() || null;
			}

					return api.data().toArray();
		};


		this.fnGetNodes = function( iRow )
		{
			var api = this.api( true );

					return iRow !== undefined ?
				api.row( iRow ).node() :
				api.rows().nodes().flatten().toArray();
		};


		this.fnGetPosition = function( node )
		{
			var api = this.api( true );
			var nodeName = node.nodeName.toUpperCase();

					if ( nodeName == 'TR' ) {
				return api.row( node ).index();
			}
			else if ( nodeName == 'TD' || nodeName == 'TH' ) {
				var cell = api.cell( node ).index();

						return [
					cell.row,
					cell.columnVisible,
					cell.column
				];
			}
			return null;
		};


		this.fnIsOpen = function( nTr )
		{
			return this.api( true ).row( nTr ).child.isShown();
		};


		this.fnOpen = function( nTr, mHtml, sClass )
		{
			return this.api( true )
				.row( nTr )
				.child( mHtml, sClass )
				.show()
				.child()[0];
		};


		this.fnPageChange = function ( mAction, bRedraw )
		{
			var api = this.api( true ).page( mAction );

					if ( bRedraw === undefined || bRedraw ) {
				api.draw(false);
			}
		};


		this.fnSetColumnVis = function ( iCol, bShow, bRedraw )
		{
			var api = this.api( true ).column( iCol ).visible( bShow );

					if ( bRedraw === undefined || bRedraw ) {
				api.columns.adjust().draw();
			}
		};


		this.fnSettings = function()
		{
			return _fnSettingsFromNode( this[_ext.iApiIndex] );
		};


		this.fnSort = function( aaSort )
		{
			this.api( true ).order( aaSort ).draw();
		};


		this.fnSortListener = function( nNode, iColumn, fnCallback )
		{
			this.api( true ).order.listener( nNode, iColumn, fnCallback );
		};


		this.fnUpdate = function( mData, mRow, iColumn, bRedraw, bAction )
		{
			var api = this.api( true );

					if ( iColumn === undefined || iColumn === null ) {
				api.row( mRow ).data( mData );
			}
			else {
				api.cell( mRow, iColumn ).data( mData );
			}

					if ( bAction === undefined || bAction ) {
				api.columns.adjust();
			}

					if ( bRedraw === undefined || bRedraw ) {
				api.draw();
			}
			return 0;
		};


		this.fnVersionCheck = _ext.fnVersionCheck;


				var _that = this;
		var emptyInit = options === undefined;
		var len = this.length;

		if ( emptyInit ) {
			options = {};
		}

		this.oApi = this.internal = _ext.internal;

		for ( var fn in DataTable.ext.internal ) {
			if ( fn ) {
				this[fn] = _fnExternApiFunc(fn);
			}
		}

		this.each(function() {
			var o = {};
			var oInit = len > 1 ? 
				_fnExtend( o, options, true ) :
				options;

			var i=0, iLen, j, jLen, k, kLen;
			var sId = this.getAttribute( 'id' );
			var bInitHandedOff = false;
			var defaults = DataTable.defaults;
			var $this = $(this);


			if ( this.nodeName.toLowerCase() != 'table' )
			{
				_fnLog( null, 0, 'Non-table node initialisation ('+this.nodeName+')', 2 );
				return;
			}

			_fnCompatOpts( defaults );
			_fnCompatCols( defaults.column );

			_fnCamelToHungarian( defaults, defaults, true );
			_fnCamelToHungarian( defaults.column, defaults.column, true );

			_fnCamelToHungarian( defaults, $.extend( oInit, $this.data() ), true );



			var allSettings = DataTable.settings;
			for ( i=0, iLen=allSettings.length ; i<iLen ; i++ )
			{
				var s = allSettings[i];

				if (
					s.nTable == this ||
					(s.nTHead && s.nTHead.parentNode == this) ||
					(s.nTFoot && s.nTFoot.parentNode == this)
				) {
					var bRetrieve = oInit.bRetrieve !== undefined ? oInit.bRetrieve : defaults.bRetrieve;
					var bDestroy = oInit.bDestroy !== undefined ? oInit.bDestroy : defaults.bDestroy;

								if ( emptyInit || bRetrieve )
					{
						return s.oInstance;
					}
					else if ( bDestroy )
					{
						s.oInstance.fnDestroy();
						break;
					}
					else
					{
						_fnLog( s, 0, 'Cannot reinitialise DataTable', 3 );
						return;
					}
				}

				if ( s.sTableId == this.id )
				{
					allSettings.splice( i, 1 );
					break;
				}
			}

			if ( sId === null || sId === "" )
			{
				sId = "DataTables_Table_"+(DataTable.ext._unique++);
				this.id = sId;
			}

			var oSettings = $.extend( true, {}, DataTable.models.oSettings, {
				"sDestroyWidth": $this[0].style.width,
				"sInstance":     sId,
				"sTableId":      sId
			} );
			oSettings.nTable = this;
			oSettings.oApi   = _that.internal;
			oSettings.oInit  = oInit;

						allSettings.push( oSettings );

			oSettings.oInstance = (_that.length===1) ? _that : $this.dataTable();

			_fnCompatOpts( oInit );
			_fnLanguageCompat( oInit.oLanguage );

			if ( oInit.aLengthMenu && ! oInit.iDisplayLength )
			{
				oInit.iDisplayLength = Array.isArray( oInit.aLengthMenu[0] ) ?
					oInit.aLengthMenu[0][0] : oInit.aLengthMenu[0];
			}

			oInit = _fnExtend( $.extend( true, {}, defaults ), oInit );


			_fnMap( oSettings.oFeatures, oInit, [
				"bPaginate",
				"bLengthChange",
				"bFilter",
				"bSort",
				"bSortMulti",
				"bInfo",
				"bProcessing",
				"bAutoWidth",
				"bSortClasses",
				"bServerSide",
				"bDeferRender"
			] );
			_fnMap( oSettings, oInit, [
				"asStripeClasses",
				"ajax",
				"fnServerData",
				"fnFormatNumber",
				"sServerMethod",
				"aaSorting",
				"aaSortingFixed",
				"aLengthMenu",
				"sPaginationType",
				"sAjaxSource",
				"sAjaxDataProp",
				"iStateDuration",
				"sDom",
				"bSortCellsTop",
				"iTabIndex",
				"fnStateLoadCallback",
				"fnStateSaveCallback",
				"renderer",
				"searchDelay",
				"rowId",
				[ "iCookieDuration", "iStateDuration" ], 
				[ "oSearch", "oPreviousSearch" ],
				[ "aoSearchCols", "aoPreSearchCols" ],
				[ "iDisplayLength", "_iDisplayLength" ]
			] );
			_fnMap( oSettings.oScroll, oInit, [
				[ "sScrollX", "sX" ],
				[ "sScrollXInner", "sXInner" ],
				[ "sScrollY", "sY" ],
				[ "bScrollCollapse", "bCollapse" ]
			] );
			_fnMap( oSettings.oLanguage, oInit, "fnInfoCallback" );

			_fnCallbackReg( oSettings, 'aoDrawCallback',       oInit.fnDrawCallback,      'user' );
			_fnCallbackReg( oSettings, 'aoServerParams',       oInit.fnServerParams,      'user' );
			_fnCallbackReg( oSettings, 'aoStateSaveParams',    oInit.fnStateSaveParams,   'user' );
			_fnCallbackReg( oSettings, 'aoStateLoadParams',    oInit.fnStateLoadParams,   'user' );
			_fnCallbackReg( oSettings, 'aoStateLoaded',        oInit.fnStateLoaded,       'user' );
			_fnCallbackReg( oSettings, 'aoRowCallback',        oInit.fnRowCallback,       'user' );
			_fnCallbackReg( oSettings, 'aoRowCreatedCallback', oInit.fnCreatedRow,        'user' );
			_fnCallbackReg( oSettings, 'aoHeaderCallback',     oInit.fnHeaderCallback,    'user' );
			_fnCallbackReg( oSettings, 'aoFooterCallback',     oInit.fnFooterCallback,    'user' );
			_fnCallbackReg( oSettings, 'aoInitComplete',       oInit.fnInitComplete,      'user' );
			_fnCallbackReg( oSettings, 'aoPreDrawCallback',    oInit.fnPreDrawCallback,   'user' );

						oSettings.rowIdFn = _fnGetObjectDataFn( oInit.rowId );

			_fnBrowserDetect( oSettings );

						var oClasses = oSettings.oClasses;

						$.extend( oClasses, DataTable.ext.classes, oInit.oClasses );
			$this.addClass( oClasses.sTable );


									if ( oSettings.iInitDisplayStart === undefined )
			{
				oSettings.iInitDisplayStart = oInit.iDisplayStart;
				oSettings._iDisplayStart = oInit.iDisplayStart;
			}

						if ( oInit.iDeferLoading !== null )
			{
				oSettings.bDeferLoading = true;
				var tmp = Array.isArray( oInit.iDeferLoading );
				oSettings._iRecordsDisplay = tmp ? oInit.iDeferLoading[0] : oInit.iDeferLoading;
				oSettings._iRecordsTotal = tmp ? oInit.iDeferLoading[1] : oInit.iDeferLoading;
			}

			var oLanguage = oSettings.oLanguage;
			$.extend( true, oLanguage, oInit.oLanguage );

						if ( oLanguage.sUrl )
			{
				$.ajax( {
					dataType: 'json',
					url: oLanguage.sUrl,
					success: function ( json ) {
						_fnLanguageCompat( json );
						_fnCamelToHungarian( defaults.oLanguage, json );
						$.extend( true, oLanguage, json );

									_fnCallbackFire( oSettings, null, 'i18n', [oSettings]);
						_fnInitialise( oSettings );
					},
					error: function () {
						_fnInitialise( oSettings );
					}
				} );
				bInitHandedOff = true;
			}
			else {
				_fnCallbackFire( oSettings, null, 'i18n', [oSettings]);
			}

			if ( oInit.asStripeClasses === null )
			{
				oSettings.asStripeClasses =[
					oClasses.sStripeOdd,
					oClasses.sStripeEven
				];
			}

			var stripeClasses = oSettings.asStripeClasses;
			var rowOne = $this.children('tbody').find('tr').eq(0);
			if ( $.inArray( true, $.map( stripeClasses, function(el, i) {
				return rowOne.hasClass(el);
			} ) ) !== -1 ) {
				$('tbody tr', this).removeClass( stripeClasses.join(' ') );
				oSettings.asDestroyStripes = stripeClasses.slice();
			}

			var anThs = [];
			var aoColumnsInit;
			var nThead = this.getElementsByTagName('thead');
			if ( nThead.length !== 0 )
			{
				_fnDetectHeader( oSettings.aoHeader, nThead[0] );
				anThs = _fnGetUniqueThs( oSettings );
			}

			if ( oInit.aoColumns === null )
			{
				aoColumnsInit = [];
				for ( i=0, iLen=anThs.length ; i<iLen ; i++ )
				{
					aoColumnsInit.push( null );
				}
			}
			else
			{
				aoColumnsInit = oInit.aoColumns;
			}

			for ( i=0, iLen=aoColumnsInit.length ; i<iLen ; i++ )
			{
				_fnAddColumn( oSettings, anThs ? anThs[i] : null );
			}

			_fnApplyColumnDefs( oSettings, oInit.aoColumnDefs, aoColumnsInit, function (iCol, oDef) {
				_fnColumnOptions( oSettings, iCol, oDef );
			} );

			if ( rowOne.length ) {
				var a = function ( cell, name ) {
					return cell.getAttribute( 'data-'+name ) !== null ? name : null;
				};

							$( rowOne[0] ).children('th, td').each( function (i, cell) {
					var col = oSettings.aoColumns[i];

								if ( col.mData === i ) {
						var sort = a( cell, 'sort' ) || a( cell, 'order' );
						var filter = a( cell, 'filter' ) || a( cell, 'search' );

									if ( sort !== null || filter !== null ) {
							col.mData = {
								_:      i+'.display',
								sort:   sort !== null   ? i+'.@data-'+sort   : undefined,
								type:   sort !== null   ? i+'.@data-'+sort   : undefined,
								filter: filter !== null ? i+'.@data-'+filter : undefined
							};

										_fnColumnOptions( oSettings, i );
						}
					}
				} );
			}

						var features = oSettings.oFeatures;
			var loadedInit = function () {

				if ( oInit.aaSorting === undefined ) {
					var sorting = oSettings.aaSorting;
					for ( i=0, iLen=sorting.length ; i<iLen ; i++ ) {
						sorting[i][1] = oSettings.aoColumns[ i ].asSorting[0];
					}
				}

				_fnSortingClasses( oSettings );

							if ( features.bSort ) {
					_fnCallbackReg( oSettings, 'aoDrawCallback', function () {
						if ( oSettings.bSorted ) {
							var aSort = _fnSortFlatten( oSettings );
							var sortedColumns = {};

										$.each( aSort, function (i, val) {
								sortedColumns[ val.src ] = val.dir;
							} );

										_fnCallbackFire( oSettings, null, 'order', [oSettings, aSort, sortedColumns] );
							_fnSortAria( oSettings );
						}
					} );
				}

							_fnCallbackReg( oSettings, 'aoDrawCallback', function () {
					if ( oSettings.bSorted || _fnDataSource( oSettings ) === 'ssp' || features.bDeferRender ) {
						_fnSortingClasses( oSettings );
					}
				}, 'sc' );



				var captions = $this.children('caption').each( function () {
					this._captionSide = $(this).css('caption-side');
				} );

							var thead = $this.children('thead');
				if ( thead.length === 0 ) {
					thead = $('<thead/>').appendTo($this);
				}
				oSettings.nTHead = thead[0];

							var tbody = $this.children('tbody');
				if ( tbody.length === 0 ) {
					tbody = $('<tbody/>').appendTo($this);
				}
				oSettings.nTBody = tbody[0];

							var tfoot = $this.children('tfoot');
				if ( tfoot.length === 0 && captions.length > 0 && (oSettings.oScroll.sX !== "" || oSettings.oScroll.sY !== "") ) {
					tfoot = $('<tfoot/>').appendTo($this);
				}

							if ( tfoot.length === 0 || tfoot.children().length === 0 ) {
					$this.addClass( oClasses.sNoFooter );
				}
				else if ( tfoot.length > 0 ) {
					oSettings.nTFoot = tfoot[0];
					_fnDetectHeader( oSettings.aoFooter, oSettings.nTFoot );
				}

				if ( oInit.aaData ) {
					for ( i=0 ; i<oInit.aaData.length ; i++ ) {
						_fnAddData( oSettings, oInit.aaData[ i ] );
					}
				}
				else if ( oSettings.bDeferLoading || _fnDataSource( oSettings ) == 'dom' ) {
					_fnAddTr( oSettings, $(oSettings.nTBody).children('tr') );
				}

				oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

				oSettings.bInitialised = true;

				if ( bInitHandedOff === false ) {
					_fnInitialise( oSettings );
				}
			};

			if ( oInit.bStateSave )
			{
				features.bStateSave = true;
				_fnCallbackReg( oSettings, 'aoDrawCallback', _fnSaveState, 'state_save' );
				_fnLoadState( oSettings, oInit, loadedInit );
			}
			else {
				loadedInit();
			}

					} );
		_that = null;
		return this;
	};





		var _ext; 
	var _Api; 
	var _api_register; 
	var _api_registerPlural; 

		var _re_dic = {};
	var _re_new_lines = /[\r\n\u2028]/g;
	var _re_html = /<.*?>/g;

	var _re_date = /^\d{2,4}[\.\/\-]\d{1,2}[\.\/\-]\d{1,2}([T ]{1}\d{1,2}[:\.]\d{2}([\.:]\d{2})?)?$/;

	var _re_escape_regex = new RegExp( '(\\' + [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '$', '^', '-' ].join('|\\') + ')', 'g' );

	var _re_formatted_numeric = /['\u00A0,$£€¥%\u2009\u202F\u20BD\u20a9\u20BArfkɃΞ]/gi;


			var _empty = function ( d ) {
		return !d || d === true || d === '-' ? true : false;
	};


			var _intVal = function ( s ) {
		var integer = parseInt( s, 10 );
		return !isNaN(integer) && isFinite(s) ? integer : null;
	};

	var _numToDecimal = function ( num, decimalPoint ) {
		if ( ! _re_dic[ decimalPoint ] ) {
			_re_dic[ decimalPoint ] = new RegExp( _fnEscapeRegex( decimalPoint ), 'g' );
		}
		return typeof num === 'string' && decimalPoint !== '.' ?
			num.replace( /\./g, '' ).replace( _re_dic[ decimalPoint ], '.' ) :
			num;
	};


			var _isNumber = function ( d, decimalPoint, formatted ) {
		var strType = typeof d === 'string';

		if ( _empty( d ) ) {
			return true;
		}

			if ( decimalPoint && strType ) {
			d = _numToDecimal( d, decimalPoint );
		}

			if ( formatted && strType ) {
			d = d.replace( _re_formatted_numeric, '' );
		}

			return !isNaN( parseFloat(d) ) && isFinite( d );
	};


	var _isHtml = function ( d ) {
		return _empty( d ) || typeof d === 'string';
	};


			var _htmlNumeric = function ( d, decimalPoint, formatted ) {
		if ( _empty( d ) ) {
			return true;
		}

			var html = _isHtml( d );
		return ! html ?
			null :
			_isNumber( _stripHtml( d ), decimalPoint, formatted ) ?
				true :
				null;
	};


			var _pluck = function ( a, prop, prop2 ) {
		var out = [];
		var i=0, ien=a.length;

		if ( prop2 !== undefined ) {
			for ( ; i<ien ; i++ ) {
				if ( a[i] && a[i][ prop ] ) {
					out.push( a[i][ prop ][ prop2 ] );
				}
			}
		}
		else {
			for ( ; i<ien ; i++ ) {
				if ( a[i] ) {
					out.push( a[i][ prop ] );
				}
			}
		}

			return out;
	};


	var _pluck_order = function ( a, order, prop, prop2 )
	{
		var out = [];
		var i=0, ien=order.length;

		if ( prop2 !== undefined ) {
			for ( ; i<ien ; i++ ) {
				if ( a[ order[i] ][ prop ] ) {
					out.push( a[ order[i] ][ prop ][ prop2 ] );
				}
			}
		}
		else {
			for ( ; i<ien ; i++ ) {
				out.push( a[ order[i] ][ prop ] );
			}
		}

			return out;
	};


			var _range = function ( len, start )
	{
		var out = [];
		var end;

			if ( start === undefined ) {
			start = 0;
			end = len;
		}
		else {
			end = start;
			start = len;
		}

			for ( var i=start ; i<end ; i++ ) {
			out.push( i );
		}

			return out;
	};


			var _removeEmpty = function ( a )
	{
		var out = [];

			for ( var i=0, ien=a.length ; i<ien ; i++ ) {
			if ( a[i] ) { 
				out.push( a[i] );
			}
		}

			return out;
	};


			var _stripHtml = function ( d ) {
		return d.replace( _re_html, '' );
	};


	var _areAllUnique = function ( src ) {
		if ( src.length < 2 ) {
			return true;
		}

			var sorted = src.slice().sort();
		var last = sorted[0];

			for ( var i=1, ien=sorted.length ; i<ien ; i++ ) {
			if ( sorted[i] === last ) {
				return false;
			}

				last = sorted[i];
		}

			return true;
	};


	var _unique = function ( src )
	{
		if ( _areAllUnique( src ) ) {
			return src.slice();
		}

		var
			out = [],
			val,
			i, ien=src.length,
			j, k=0;

			again: for ( i=0 ; i<ien ; i++ ) {
			val = src[i];

				for ( j=0 ; j<k ; j++ ) {
				if ( out[j] === val ) {
					continue again;
				}
			}

				out.push( val );
			k++;
		}

			return out;
	};

	var _flatten = function (out, val) {
		if (Array.isArray(val)) {
			for (var i=0 ; i<val.length ; i++) {
				_flatten(out, val[i]);
			}
		}
		else {
			out.push(val);
		}

	  		return out;
	}

	if (! Array.isArray) {
	    Array.isArray = function(arg) {
	        return Object.prototype.toString.call(arg) === '[object Array]';
	    };
	}

	if (!String.prototype.trim) {
	  String.prototype.trim = function () {
	    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	  };
	}

	DataTable.util = {
		throttle: function ( fn, freq ) {
			var
				frequency = freq !== undefined ? freq : 200,
				last,
				timer;

				return function () {
				var
					that = this,
					now  = +new Date(),
					args = arguments;

					if ( last && now < last + frequency ) {
					clearTimeout( timer );

						timer = setTimeout( function () {
						last = undefined;
						fn.apply( that, args );
					}, frequency );
				}
				else {
					last = now;
					fn.apply( that, args );
				}
			};
		},


		escapeRegex: function ( val ) {
			return val.replace( _re_escape_regex, '\\$1' );
		}
	};



	function _fnHungarianMap ( o )
	{
		var
			hungarian = 'a aa ai ao as b fn i m o s ',
			match,
			newKey,
			map = {};

			$.each( o, function (key, val) {
			match = key.match(/^([^A-Z]+?)([A-Z])/);

				if ( match && hungarian.indexOf(match[1]+' ') !== -1 )
			{
				newKey = key.replace( match[0], match[2].toLowerCase() );
				map[ newKey ] = key;

					if ( match[1] === 'o' )
				{
					_fnHungarianMap( o[key] );
				}
			}
		} );

			o._hungarianMap = map;
	}


	function _fnCamelToHungarian ( src, user, force )
	{
		if ( ! src._hungarianMap ) {
			_fnHungarianMap( src );
		}

			var hungarianKey;

			$.each( user, function (key, val) {
			hungarianKey = src._hungarianMap[ key ];

				if ( hungarianKey !== undefined && (force || user[hungarianKey] === undefined) )
			{
				if ( hungarianKey.charAt(0) === 'o' )
				{
					if ( ! user[ hungarianKey ] ) {
						user[ hungarianKey ] = {};
					}
					$.extend( true, user[hungarianKey], user[key] );

						_fnCamelToHungarian( src[hungarianKey], user[hungarianKey], force );
				}
				else {
					user[hungarianKey] = user[ key ];
				}
			}
		} );
	}


	function _fnLanguageCompat( lang )
	{
		var defaults = DataTable.defaults.oLanguage;

		var defaultDecimal = defaults.sDecimal;
		if ( defaultDecimal ) {
			_addNumericSort( defaultDecimal );
		}

			if ( lang ) {
			var zeroRecords = lang.sZeroRecords;

			if ( ! lang.sEmptyTable && zeroRecords &&
				defaults.sEmptyTable === "No data available in table" )
			{
				_fnMap( lang, lang, 'sZeroRecords', 'sEmptyTable' );
			}

			if ( ! lang.sLoadingRecords && zeroRecords &&
				defaults.sLoadingRecords === "Loading..." )
			{
				_fnMap( lang, lang, 'sZeroRecords', 'sLoadingRecords' );
			}

			if ( lang.sInfoThousands ) {
				lang.sThousands = lang.sInfoThousands;
			}

				var decimal = lang.sDecimal;
			if ( decimal && defaultDecimal !== decimal ) {
				_addNumericSort( decimal );
			}
		}
	}


	var _fnCompatMap = function ( o, knew, old ) {
		if ( o[ knew ] !== undefined ) {
			o[ old ] = o[ knew ];
		}
	};


	function _fnCompatOpts ( init )
	{
		_fnCompatMap( init, 'ordering',      'bSort' );
		_fnCompatMap( init, 'orderMulti',    'bSortMulti' );
		_fnCompatMap( init, 'orderClasses',  'bSortClasses' );
		_fnCompatMap( init, 'orderCellsTop', 'bSortCellsTop' );
		_fnCompatMap( init, 'order',         'aaSorting' );
		_fnCompatMap( init, 'orderFixed',    'aaSortingFixed' );
		_fnCompatMap( init, 'paging',        'bPaginate' );
		_fnCompatMap( init, 'pagingType',    'sPaginationType' );
		_fnCompatMap( init, 'pageLength',    'iDisplayLength' );
		_fnCompatMap( init, 'searching',     'bFilter' );

		if ( typeof init.sScrollX === 'boolean' ) {
			init.sScrollX = init.sScrollX ? '100%' : '';
		}
		if ( typeof init.scrollX === 'boolean' ) {
			init.scrollX = init.scrollX ? '100%' : '';
		}

		var searchCols = init.aoSearchCols;

			if ( searchCols ) {
			for ( var i=0, ien=searchCols.length ; i<ien ; i++ ) {
				if ( searchCols[i] ) {
					_fnCamelToHungarian( DataTable.models.oSearch, searchCols[i] );
				}
			}
		}
	}


	function _fnCompatCols ( init )
	{
		_fnCompatMap( init, 'orderable',     'bSortable' );
		_fnCompatMap( init, 'orderData',     'aDataSort' );
		_fnCompatMap( init, 'orderSequence', 'asSorting' );
		_fnCompatMap( init, 'orderDataType', 'sortDataType' );

		var dataSort = init.aDataSort;
		if ( typeof dataSort === 'number' && ! Array.isArray( dataSort ) ) {
			init.aDataSort = [ dataSort ];
		}
	}


	function _fnBrowserDetect( settings )
	{
		if ( ! DataTable.__browser ) {
			var browser = {};
			DataTable.__browser = browser;

			var n = $('<div/>')
				.css( {
					position: 'fixed',
					top: 0,
					left: $(window).scrollLeft()*-1, 
					height: 1,
					width: 1,
					overflow: 'hidden'
				} )
				.append(
					$('<div/>')
						.css( {
							position: 'absolute',
							top: 1,
							left: 1,
							width: 100,
							overflow: 'scroll'
						} )
						.append(
							$('<div/>')
								.css( {
									width: '100%',
									height: 10
								} )
						)
				)
				.appendTo( 'body' );

				var outer = n.children();
			var inner = outer.children();


			browser.barWidth = outer[0].offsetWidth - outer[0].clientWidth;

			browser.bScrollOversize = inner[0].offsetWidth === 100 && outer[0].clientWidth !== 100;

			browser.bScrollbarLeft = Math.round( inner.offset().left ) !== 1;

			browser.bBounding = n[0].getBoundingClientRect().width ? true : false;

				n.remove();
		}

			$.extend( settings.oBrowser, DataTable.__browser );
		settings.oScroll.iBarWidth = DataTable.__browser.barWidth;
	}


	function _fnReduce ( that, fn, init, start, end, inc )
	{
		var
			i = start,
			value,
			isSet = false;

			if ( init !== undefined ) {
			value = init;
			isSet = true;
		}

			while ( i !== end ) {
			if ( ! that.hasOwnProperty(i) ) {
				continue;
			}

				value = isSet ?
				fn( value, that[i], i, that ) :
				that[i];

				isSet = true;
			i += inc;
		}

			return value;
	}

	function _fnAddColumn( oSettings, nTh )
	{
		var oDefaults = DataTable.defaults.column;
		var iCol = oSettings.aoColumns.length;
		var oCol = $.extend( {}, DataTable.models.oColumn, oDefaults, {
			"nTh": nTh ? nTh : document.createElement('th'),
			"sTitle":    oDefaults.sTitle    ? oDefaults.sTitle    : nTh ? nTh.innerHTML : '',
			"aDataSort": oDefaults.aDataSort ? oDefaults.aDataSort : [iCol],
			"mData": oDefaults.mData ? oDefaults.mData : iCol,
			idx: iCol
		} );
		oSettings.aoColumns.push( oCol );

		var searchCols = oSettings.aoPreSearchCols;
		searchCols[ iCol ] = $.extend( {}, DataTable.models.oSearch, searchCols[ iCol ] );

		_fnColumnOptions( oSettings, iCol, $(nTh).data() );
	}


	function _fnColumnOptions( oSettings, iCol, oOptions )
	{
		var oCol = oSettings.aoColumns[ iCol ];
		var oClasses = oSettings.oClasses;
		var th = $(oCol.nTh);

		if ( ! oCol.sWidthOrig ) {
			oCol.sWidthOrig = th.attr('width') || null;

			var t = (th.attr('style') || '').match(/width:\s*(\d+[pxem%]+)/);
			if ( t ) {
				oCol.sWidthOrig = t[1];
			}
		}

		if ( oOptions !== undefined && oOptions !== null )
		{
			_fnCompatCols( oOptions );

			_fnCamelToHungarian( DataTable.defaults.column, oOptions, true );

			if ( oOptions.mDataProp !== undefined && !oOptions.mData )
			{
				oOptions.mData = oOptions.mDataProp;
			}

				if ( oOptions.sType )
			{
				oCol._sManualType = oOptions.sType;
			}

			if ( oOptions.className && ! oOptions.sClass )
			{
				oOptions.sClass = oOptions.className;
			}
			if ( oOptions.sClass ) {
				th.addClass( oOptions.sClass );
			}

				$.extend( oCol, oOptions );
			_fnMap( oCol, oOptions, "sWidth", "sWidthOrig" );

			if ( oOptions.iDataSort !== undefined )
			{
				oCol.aDataSort = [ oOptions.iDataSort ];
			}
			_fnMap( oCol, oOptions, "aDataSort" );
		}

		var mDataSrc = oCol.mData;
		var mData = _fnGetObjectDataFn( mDataSrc );
		var mRender = oCol.mRender ? _fnGetObjectDataFn( oCol.mRender ) : null;

			var attrTest = function( src ) {
			return typeof src === 'string' && src.indexOf('@') !== -1;
		};
		oCol._bAttrSrc = $.isPlainObject( mDataSrc ) && (
			attrTest(mDataSrc.sort) || attrTest(mDataSrc.type) || attrTest(mDataSrc.filter)
		);
		oCol._setter = null;

			oCol.fnGetData = function (rowData, type, meta) {
			var innerData = mData( rowData, type, undefined, meta );

				return mRender && type ?
				mRender( innerData, type, rowData, meta ) :
				innerData;
		};
		oCol.fnSetData = function ( rowData, val, meta ) {
			return _fnSetObjectDataFn( mDataSrc )( rowData, val, meta );
		};

		if ( typeof mDataSrc !== 'number' ) {
			oSettings._rowReadObject = true;
		}

		if ( !oSettings.oFeatures.bSort )
		{
			oCol.bSortable = false;
			th.addClass( oClasses.sSortableNone ); 
		}

		var bAsc = $.inArray('asc', oCol.asSorting) !== -1;
		var bDesc = $.inArray('desc', oCol.asSorting) !== -1;
		if ( !oCol.bSortable || (!bAsc && !bDesc) )
		{
			oCol.sSortingClass = oClasses.sSortableNone;
			oCol.sSortingClassJUI = "";
		}
		else if ( bAsc && !bDesc )
		{
			oCol.sSortingClass = oClasses.sSortableAsc;
			oCol.sSortingClassJUI = oClasses.sSortJUIAscAllowed;
		}
		else if ( !bAsc && bDesc )
		{
			oCol.sSortingClass = oClasses.sSortableDesc;
			oCol.sSortingClassJUI = oClasses.sSortJUIDescAllowed;
		}
		else
		{
			oCol.sSortingClass = oClasses.sSortable;
			oCol.sSortingClassJUI = oClasses.sSortJUI;
		}
	}


	function _fnAdjustColumnSizing ( settings )
	{
		if ( settings.oFeatures.bAutoWidth !== false )
		{
			var columns = settings.aoColumns;

				_fnCalculateColumnWidths( settings );
			for ( var i=0 , iLen=columns.length ; i<iLen ; i++ )
			{
				columns[i].nTh.style.width = columns[i].sWidth;
			}
		}

			var scroll = settings.oScroll;
		if ( scroll.sY !== '' || scroll.sX !== '')
		{
			_fnScrollDraw( settings );
		}

			_fnCallbackFire( settings, null, 'column-sizing', [settings] );
	}


	function _fnVisibleToColumnIndex( oSettings, iMatch )
	{
		var aiVis = _fnGetColumns( oSettings, 'bVisible' );

			return typeof aiVis[iMatch] === 'number' ?
			aiVis[iMatch] :
			null;
	}


	function _fnColumnIndexToVisible( oSettings, iMatch )
	{
		var aiVis = _fnGetColumns( oSettings, 'bVisible' );
		var iPos = $.inArray( iMatch, aiVis );

			return iPos !== -1 ? iPos : null;
	}


	function _fnVisbleColumns( oSettings )
	{
		var vis = 0;

		$.each( oSettings.aoColumns, function ( i, col ) {
			if ( col.bVisible && $(col.nTh).css('display') !== 'none' ) {
				vis++;
			}
		} );

			return vis;
	}


	function _fnGetColumns( oSettings, sParam )
	{
		var a = [];

			$.map( oSettings.aoColumns, function(val, i) {
			if ( val[sParam] ) {
				a.push( i );
			}
		} );

			return a;
	}


	function _fnColumnTypes ( settings )
	{
		var columns = settings.aoColumns;
		var data = settings.aoData;
		var types = DataTable.ext.type.detect;
		var i, ien, j, jen, k, ken;
		var col, cell, detectedType, cache;

		for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			col = columns[i];
			cache = [];

				if ( ! col.sType && col._sManualType ) {
				col.sType = col._sManualType;
			}
			else if ( ! col.sType ) {
				for ( j=0, jen=types.length ; j<jen ; j++ ) {
					for ( k=0, ken=data.length ; k<ken ; k++ ) {
						if ( cache[k] === undefined ) {
							cache[k] = _fnGetCellData( settings, k, i, 'type' );
						}

							detectedType = types[j]( cache[k], settings );

						if ( ! detectedType && j !== types.length-1 ) {
							break;
						}

						if ( detectedType === 'html' ) {
							break;
						}
					}

					if ( detectedType ) {
						col.sType = detectedType;
						break;
					}
				}

				if ( ! col.sType ) {
					col.sType = 'string';
				}
			}
		}
	}


	function _fnApplyColumnDefs( oSettings, aoColDefs, aoCols, fn )
	{
		var i, iLen, j, jLen, k, kLen, def;
		var columns = oSettings.aoColumns;

		if ( aoColDefs )
		{
			for ( i=aoColDefs.length-1 ; i>=0 ; i-- )
			{
				def = aoColDefs[i];

				var aTargets = def.targets !== undefined ?
					def.targets :
					def.aTargets;

					if ( ! Array.isArray( aTargets ) )
				{
					aTargets = [ aTargets ];
				}

					for ( j=0, jLen=aTargets.length ; j<jLen ; j++ )
				{
					if ( typeof aTargets[j] === 'number' && aTargets[j] >= 0 )
					{
						while( columns.length <= aTargets[j] )
						{
							_fnAddColumn( oSettings );
						}

						fn( aTargets[j], def );
					}
					else if ( typeof aTargets[j] === 'number' && aTargets[j] < 0 )
					{
						fn( columns.length+aTargets[j], def );
					}
					else if ( typeof aTargets[j] === 'string' )
					{
						for ( k=0, kLen=columns.length ; k<kLen ; k++ )
						{
							if ( aTargets[j] == "_all" ||
							     $(columns[k].nTh).hasClass( aTargets[j] ) )
							{
								fn( k, def );
							}
						}
					}
				}
			}
		}

		if ( aoCols )
		{
			for ( i=0, iLen=aoCols.length ; i<iLen ; i++ )
			{
				fn( i, aoCols[i] );
			}
		}
	}

	function _fnAddData ( oSettings, aDataIn, nTr, anTds )
	{
		var iRow = oSettings.aoData.length;
		var oData = $.extend( true, {}, DataTable.models.oRow, {
			src: nTr ? 'dom' : 'data',
			idx: iRow
		} );

			oData._aData = aDataIn;
		oSettings.aoData.push( oData );

		var nTd, sThisType;
		var columns = oSettings.aoColumns;

		for ( var i=0, iLen=columns.length ; i<iLen ; i++ )
		{
			columns[i].sType = null;
		}

		oSettings.aiDisplayMaster.push( iRow );

			var id = oSettings.rowIdFn( aDataIn );
		if ( id !== undefined ) {
			oSettings.aIds[ id ] = oData;
		}

		if ( nTr || ! oSettings.oFeatures.bDeferRender )
		{
			_fnCreateTr( oSettings, iRow, nTr, anTds );
		}

			return iRow;
	}


	function _fnAddTr( settings, trs )
	{
		var row;

		if ( ! (trs instanceof $) ) {
			trs = $(trs);
		}

			return trs.map( function (i, el) {
			row = _fnGetRowElements( settings, el );
			return _fnAddData( settings, row.data, el, row.cells );
		} );
	}


	function _fnNodeToDataIndex( oSettings, n )
	{
		return (n._DT_RowIndex!==undefined) ? n._DT_RowIndex : null;
	}


	function _fnNodeToColumnIndex( oSettings, iRow, n )
	{
		return $.inArray( n, oSettings.aoData[ iRow ].anCells );
	}


	function _fnGetCellData( settings, rowIdx, colIdx, type )
	{
		var draw           = settings.iDraw;
		var col            = settings.aoColumns[colIdx];
		var rowData        = settings.aoData[rowIdx]._aData;
		var defaultContent = col.sDefaultContent;
		var cellData       = col.fnGetData( rowData, type, {
			settings: settings,
			row:      rowIdx,
			col:      colIdx
		} );

			if ( cellData === undefined ) {
			if ( settings.iDrawError != draw && defaultContent === null ) {
				_fnLog( settings, 0, "Requested unknown parameter "+
					(typeof col.mData=='function' ? '{function}' : "'"+col.mData+"'")+
					" for row "+rowIdx+", column "+colIdx, 4 );
				settings.iDrawError = draw;
			}
			return defaultContent;
		}

		if ( (cellData === rowData || cellData === null) && defaultContent !== null && type !== undefined ) {
			cellData = defaultContent;
		}
		else if ( typeof cellData === 'function' ) {
			return cellData.call( rowData );
		}

			if ( cellData === null && type == 'display' ) {
			return '';
		}
		return cellData;
	}


	function _fnSetCellData( settings, rowIdx, colIdx, val )
	{
		var col     = settings.aoColumns[colIdx];
		var rowData = settings.aoData[rowIdx]._aData;

			col.fnSetData( rowData, val, {
			settings: settings,
			row:      rowIdx,
			col:      colIdx
		}  );
	}


	var __reArray = /\[.*?\]$/;
	var __reFn = /\(\)$/;

	function _fnSplitObjNotation( str )
	{
		return $.map( str.match(/(\\.|[^\.])+/g) || [''], function ( s ) {
			return s.replace(/\\\./g, '.');
		} );
	}


	function _fnGetObjectDataFn( mSource )
	{
		if ( $.isPlainObject( mSource ) )
		{
			var o = {};
			$.each( mSource, function (key, val) {
				if ( val ) {
					o[key] = _fnGetObjectDataFn( val );
				}
			} );

				return function (data, type, row, meta) {
				var t = o[type] || o._;
				return t !== undefined ?
					t(data, type, row, meta) :
					data;
			};
		}
		else if ( mSource === null )
		{
			return function (data) { 
				return data;
			};
		}
		else if ( typeof mSource === 'function' )
		{
			return function (data, type, row, meta) {
				return mSource( data, type, row, meta );
			};
		}
		else if ( typeof mSource === 'string' && (mSource.indexOf('.') !== -1 ||
			      mSource.indexOf('[') !== -1 || mSource.indexOf('(') !== -1) )
		{
			var fetchData = function (data, type, src) {
				var arrayNotation, funcNotation, out, innerSrc;

					if ( src !== "" )
				{
					var a = _fnSplitObjNotation( src );

						for ( var i=0, iLen=a.length ; i<iLen ; i++ )
					{
						arrayNotation = a[i].match(__reArray);
						funcNotation = a[i].match(__reFn);

							if ( arrayNotation )
						{
							a[i] = a[i].replace(__reArray, '');

							if ( a[i] !== "" ) {
								data = data[ a[i] ];
							}
							out = [];

							a.splice( 0, i+1 );
							innerSrc = a.join('.');

							if ( Array.isArray( data ) ) {
								for ( var j=0, jLen=data.length ; j<jLen ; j++ ) {
									out.push( fetchData( data[j], type, innerSrc ) );
								}
							}

							var join = arrayNotation[0].substring(1, arrayNotation[0].length-1);
							data = (join==="") ? out : out.join(join);

							break;
						}
						else if ( funcNotation )
						{
							a[i] = a[i].replace(__reFn, '');
							data = data[ a[i] ]();
							continue;
						}

							if ( data === null || data[ a[i] ] === undefined )
						{
							return undefined;
						}
						data = data[ a[i] ];
					}
				}

					return data;
			};

				return function (data, type) { 
				return fetchData( data, type, mSource );
			};
		}
		else
		{
			return function (data, type) { 
				return data[mSource];
			};
		}
	}


	function _fnSetObjectDataFn( mSource )
	{
		if ( $.isPlainObject( mSource ) )
		{
			return _fnSetObjectDataFn( mSource._ );
		}
		else if ( mSource === null )
		{
			return function () {};
		}
		else if ( typeof mSource === 'function' )
		{
			return function (data, val, meta) {
				mSource( data, 'set', val, meta );
			};
		}
		else if ( typeof mSource === 'string' && (mSource.indexOf('.') !== -1 ||
			      mSource.indexOf('[') !== -1 || mSource.indexOf('(') !== -1) )
		{
			var setData = function (data, val, src) {
				var a = _fnSplitObjNotation( src ), b;
				var aLast = a[a.length-1];
				var arrayNotation, funcNotation, o, innerSrc;

					for ( var i=0, iLen=a.length-1 ; i<iLen ; i++ )
				{
					if (a[i] === '__proto__' || a[i] === 'constructor') {
						throw new Error('Cannot set prototype values');
					}

					arrayNotation = a[i].match(__reArray);
					funcNotation = a[i].match(__reFn);

						if ( arrayNotation )
					{
						a[i] = a[i].replace(__reArray, '');
						data[ a[i] ] = [];

						b = a.slice();
						b.splice( 0, i+1 );
						innerSrc = b.join('.');

						if ( Array.isArray( val ) )
						{
							for ( var j=0, jLen=val.length ; j<jLen ; j++ )
							{
								o = {};
								setData( o, val[j], innerSrc );
								data[ a[i] ].push( o );
							}
						}
						else
						{
							data[ a[i] ] = val;
						}

						return;
					}
					else if ( funcNotation )
					{
						a[i] = a[i].replace(__reFn, '');
						data = data[ a[i] ]( val );
					}

					if ( data[ a[i] ] === null || data[ a[i] ] === undefined )
					{
						data[ a[i] ] = {};
					}
					data = data[ a[i] ];
				}

				if ( aLast.match(__reFn ) )
				{
					data = data[ aLast.replace(__reFn, '') ]( val );
				}
				else
				{
					data[ aLast.replace(__reArray, '') ] = val;
				}
			};

				return function (data, val) { 
				return setData( data, val, mSource );
			};
		}
		else
		{
			return function (data, val) { 
				data[mSource] = val;
			};
		}
	}


	function _fnGetDataMaster ( settings )
	{
		return _pluck( settings.aoData, '_aData' );
	}


	function _fnClearTable( settings )
	{
		settings.aoData.length = 0;
		settings.aiDisplayMaster.length = 0;
		settings.aiDisplay.length = 0;
		settings.aIds = {};
	}


	function _fnDeleteIndex( a, iTarget, splice )
	{
		var iTargetIndex = -1;

			for ( var i=0, iLen=a.length ; i<iLen ; i++ )
		{
			if ( a[i] == iTarget )
			{
				iTargetIndex = i;
			}
			else if ( a[i] > iTarget )
			{
				a[i]--;
			}
		}

			if ( iTargetIndex != -1 && splice === undefined )
		{
			a.splice( iTargetIndex, 1 );
		}
	}


	function _fnInvalidate( settings, rowIdx, src, colIdx )
	{
		var row = settings.aoData[ rowIdx ];
		var i, ien;
		var cellWrite = function ( cell, col ) {
			while ( cell.childNodes.length ) {
				cell.removeChild( cell.firstChild );
			}

				cell.innerHTML = _fnGetCellData( settings, rowIdx, col, 'display' );
		};

		if ( src === 'dom' || ((! src || src === 'auto') && row.src === 'dom') ) {
			row._aData = _fnGetRowElements(
					settings, row, colIdx, colIdx === undefined ? undefined : row._aData
				)
				.data;
		}
		else {
			var cells = row.anCells;

				if ( cells ) {
				if ( colIdx !== undefined ) {
					cellWrite( cells[colIdx], colIdx );
				}
				else {
					for ( i=0, ien=cells.length ; i<ien ; i++ ) {
						cellWrite( cells[i], i );
					}
				}
			}
		}

		row._aSortData = null;
		row._aFilterData = null;

		var cols = settings.aoColumns;
		if ( colIdx !== undefined ) {
			cols[ colIdx ].sType = null;
		}
		else {
			for ( i=0, ien=cols.length ; i<ien ; i++ ) {
				cols[i].sType = null;
			}

			_fnRowAttributes( settings, row );
		}
	}


	function _fnGetRowElements( settings, row, colIdx, d )
	{
		var
			tds = [],
			td = row.firstChild,
			name, col, o, i=0, contents,
			columns = settings.aoColumns,
			objectRead = settings._rowReadObject;

		d = d !== undefined ?
			d :
			objectRead ?
				{} :
				[];

			var attr = function ( str, td  ) {
			if ( typeof str === 'string' ) {
				var idx = str.indexOf('@');

					if ( idx !== -1 ) {
					var attr = str.substring( idx+1 );
					var setter = _fnSetObjectDataFn( str );
					setter( d, td.getAttribute( attr ) );
				}
			}
		};

		var cellProcess = function ( cell ) {
			if ( colIdx === undefined || colIdx === i ) {
				col = columns[i];
				contents = (cell.innerHTML).trim();

					if ( col && col._bAttrSrc ) {
					var setter = _fnSetObjectDataFn( col.mData._ );
					setter( d, contents );

						attr( col.mData.sort, cell );
					attr( col.mData.type, cell );
					attr( col.mData.filter, cell );
				}
				else {
					if ( objectRead ) {
						if ( ! col._setter ) {
							col._setter = _fnSetObjectDataFn( col.mData );
						}
						col._setter( d, contents );
					}
					else {
						d[i] = contents;
					}
				}
			}

				i++;
		};

			if ( td ) {
			while ( td ) {
				name = td.nodeName.toUpperCase();

					if ( name == "TD" || name == "TH" ) {
					cellProcess( td );
					tds.push( td );
				}

					td = td.nextSibling;
			}
		}
		else {
			tds = row.anCells;

				for ( var j=0, jen=tds.length ; j<jen ; j++ ) {
				cellProcess( tds[j] );
			}
		}

		var rowNode = row.firstChild ? row : row.nTr;

			if ( rowNode ) {
			var id = rowNode.getAttribute( 'id' );

				if ( id ) {
				_fnSetObjectDataFn( settings.rowId )( d, id );
			}
		}

			return {
			data: d,
			cells: tds
		};
	}
	function _fnCreateTr ( oSettings, iRow, nTrIn, anTds )
	{
		var
			row = oSettings.aoData[iRow],
			rowData = row._aData,
			cells = [],
			nTr, nTd, oCol,
			i, iLen, create;

			if ( row.nTr === null )
		{
			nTr = nTrIn || document.createElement('tr');

				row.nTr = nTr;
			row.anCells = cells;

			nTr._DT_RowIndex = iRow;

			_fnRowAttributes( oSettings, row );

			for ( i=0, iLen=oSettings.aoColumns.length ; i<iLen ; i++ )
			{
				oCol = oSettings.aoColumns[i];
				create = nTrIn ? false : true;

					nTd = create ? document.createElement( oCol.sCellType ) : anTds[i];
				nTd._DT_CellIndex = {
					row: iRow,
					column: i
				};

								cells.push( nTd );

				if ( create || ((oCol.mRender || oCol.mData !== i) &&
					 (!$.isPlainObject(oCol.mData) || oCol.mData._ !== i+'.display')
				)) {
					nTd.innerHTML = _fnGetCellData( oSettings, iRow, i, 'display' );
				}

				if ( oCol.sClass )
				{
					nTd.className += ' '+oCol.sClass;
				}

				if ( oCol.bVisible && ! nTrIn )
				{
					nTr.appendChild( nTd );
				}
				else if ( ! oCol.bVisible && nTrIn )
				{
					nTd.parentNode.removeChild( nTd );
				}

					if ( oCol.fnCreatedCell )
				{
					oCol.fnCreatedCell.call( oSettings.oInstance,
						nTd, _fnGetCellData( oSettings, iRow, i ), rowData, iRow, i
					);
				}
			}

				_fnCallbackFire( oSettings, 'aoRowCreatedCallback', null, [nTr, rowData, iRow, cells] );
		}
	}


	function _fnRowAttributes( settings, row )
	{
		var tr = row.nTr;
		var data = row._aData;

			if ( tr ) {
			var id = settings.rowIdFn( data );

				if ( id ) {
				tr.id = id;
			}

				if ( data.DT_RowClass ) {
				var a = data.DT_RowClass.split(' ');
				row.__rowc = row.__rowc ?
					_unique( row.__rowc.concat( a ) ) :
					a;

					$(tr)
					.removeClass( row.__rowc.join(' ') )
					.addClass( data.DT_RowClass );
			}

				if ( data.DT_RowAttr ) {
				$(tr).attr( data.DT_RowAttr );
			}

				if ( data.DT_RowData ) {
				$(tr).data( data.DT_RowData );
			}
		}
	}


	function _fnBuildHead( oSettings )
	{
		var i, ien, cell, row, column;
		var thead = oSettings.nTHead;
		var tfoot = oSettings.nTFoot;
		var createHeader = $('th, td', thead).length === 0;
		var classes = oSettings.oClasses;
		var columns = oSettings.aoColumns;

			if ( createHeader ) {
			row = $('<tr/>').appendTo( thead );
		}

			for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			column = columns[i];
			cell = $( column.nTh ).addClass( column.sClass );

				if ( createHeader ) {
				cell.appendTo( row );
			}

			if ( oSettings.oFeatures.bSort ) {
				cell.addClass( column.sSortingClass );

					if ( column.bSortable !== false ) {
					cell
						.attr( 'tabindex', oSettings.iTabIndex )
						.attr( 'aria-controls', oSettings.sTableId );

						_fnSortAttachListener( oSettings, column.nTh, i );
				}
			}

				if ( column.sTitle != cell[0].innerHTML ) {
				cell.html( column.sTitle );
			}

				_fnRenderer( oSettings, 'header' )(
				oSettings, cell, column, classes
			);
		}

			if ( createHeader ) {
			_fnDetectHeader( oSettings.aoHeader, thead );
		}

		$(thead).children('tr').attr('role', 'row');

		$(thead).children('tr').children('th, td').addClass( classes.sHeaderTH );
		$(tfoot).children('tr').children('th, td').addClass( classes.sFooterTH );

		if ( tfoot !== null ) {
			var cells = oSettings.aoFooter[0];

				for ( i=0, ien=cells.length ; i<ien ; i++ ) {
				column = columns[i];
				column.nTf = cells[i].cell;

					if ( column.sClass ) {
					$(column.nTf).addClass( column.sClass );
				}
			}
		}
	}


	function _fnDrawHead( oSettings, aoSource, bIncludeHidden )
	{
		var i, iLen, j, jLen, k, kLen, n, nLocalTr;
		var aoLocal = [];
		var aApplied = [];
		var iColumns = oSettings.aoColumns.length;
		var iRowspan, iColspan;

			if ( ! aoSource )
		{
			return;
		}

			if (  bIncludeHidden === undefined )
		{
			bIncludeHidden = false;
		}

		for ( i=0, iLen=aoSource.length ; i<iLen ; i++ )
		{
			aoLocal[i] = aoSource[i].slice();
			aoLocal[i].nTr = aoSource[i].nTr;

			for ( j=iColumns-1 ; j>=0 ; j-- )
			{
				if ( !oSettings.aoColumns[j].bVisible && !bIncludeHidden )
				{
					aoLocal[i].splice( j, 1 );
				}
			}

			aApplied.push( [] );
		}

			for ( i=0, iLen=aoLocal.length ; i<iLen ; i++ )
		{
			nLocalTr = aoLocal[i].nTr;

			if ( nLocalTr )
			{
				while( (n = nLocalTr.firstChild) )
				{
					nLocalTr.removeChild( n );
				}
			}

				for ( j=0, jLen=aoLocal[i].length ; j<jLen ; j++ )
			{
				iRowspan = 1;
				iColspan = 1;

				if ( aApplied[i][j] === undefined )
				{
					nLocalTr.appendChild( aoLocal[i][j].cell );
					aApplied[i][j] = 1;

					while ( aoLocal[i+iRowspan] !== undefined &&
					        aoLocal[i][j].cell == aoLocal[i+iRowspan][j].cell )
					{
						aApplied[i+iRowspan][j] = 1;
						iRowspan++;
					}

					while ( aoLocal[i][j+iColspan] !== undefined &&
					        aoLocal[i][j].cell == aoLocal[i][j+iColspan].cell )
					{
						for ( k=0 ; k<iRowspan ; k++ )
						{
							aApplied[i+k][j+iColspan] = 1;
						}
						iColspan++;
					}

					$(aoLocal[i][j].cell)
						.attr('rowspan', iRowspan)
						.attr('colspan', iColspan);
				}
			}
		}
	}


	function _fnDraw( oSettings )
	{
		var aPreDraw = _fnCallbackFire( oSettings, 'aoPreDrawCallback', 'preDraw', [oSettings] );
		if ( $.inArray( false, aPreDraw ) !== -1 )
		{
			_fnProcessingDisplay( oSettings, false );
			return;
		}

			var i, iLen, n;
		var anRows = [];
		var iRowCount = 0;
		var asStripeClasses = oSettings.asStripeClasses;
		var iStripes = asStripeClasses.length;
		var iOpenRows = oSettings.aoOpenRows.length;
		var oLang = oSettings.oLanguage;
		var iInitDisplayStart = oSettings.iInitDisplayStart;
		var bServerSide = _fnDataSource( oSettings ) == 'ssp';
		var aiDisplay = oSettings.aiDisplay;

			oSettings.bDrawing = true;

		if ( iInitDisplayStart !== undefined && iInitDisplayStart !== -1 )
		{
			oSettings._iDisplayStart = bServerSide ?
				iInitDisplayStart :
				iInitDisplayStart >= oSettings.fnRecordsDisplay() ?
					0 :
					iInitDisplayStart;

				oSettings.iInitDisplayStart = -1;
		}

			var iDisplayStart = oSettings._iDisplayStart;
		var iDisplayEnd = oSettings.fnDisplayEnd();

		if ( oSettings.bDeferLoading )
		{
			oSettings.bDeferLoading = false;
			oSettings.iDraw++;
			_fnProcessingDisplay( oSettings, false );
		}
		else if ( !bServerSide )
		{
			oSettings.iDraw++;
		}
		else if ( !oSettings.bDestroying && !_fnAjaxUpdate( oSettings ) )
		{
			return;
		}

			if ( aiDisplay.length !== 0 )
		{
			var iStart = bServerSide ? 0 : iDisplayStart;
			var iEnd = bServerSide ? oSettings.aoData.length : iDisplayEnd;

				for ( var j=iStart ; j<iEnd ; j++ )
			{
				var iDataIndex = aiDisplay[j];
				var aoData = oSettings.aoData[ iDataIndex ];
				if ( aoData.nTr === null )
				{
					_fnCreateTr( oSettings, iDataIndex );
				}

					var nRow = aoData.nTr;

				if ( iStripes !== 0 )
				{
					var sStripe = asStripeClasses[ iRowCount % iStripes ];
					if ( aoData._sRowStripe != sStripe )
					{
						$(nRow).removeClass( aoData._sRowStripe ).addClass( sStripe );
						aoData._sRowStripe = sStripe;
					}
				}

				_fnCallbackFire( oSettings, 'aoRowCallback', null,
					[nRow, aoData._aData, iRowCount, j, iDataIndex] );

					anRows.push( nRow );
				iRowCount++;
			}
		}
		else
		{
			var sZero = oLang.sZeroRecords;
			if ( oSettings.iDraw == 1 &&  _fnDataSource( oSettings ) == 'ajax' )
			{
				sZero = oLang.sLoadingRecords;
			}
			else if ( oLang.sEmptyTable && oSettings.fnRecordsTotal() === 0 )
			{
				sZero = oLang.sEmptyTable;
			}

				anRows[ 0 ] = $( '<tr/>', { 'class': iStripes ? asStripeClasses[0] : '' } )
				.append( $('<td />', {
					'valign':  'top',
					'colSpan': _fnVisbleColumns( oSettings ),
					'class':   oSettings.oClasses.sRowEmpty
				} ).html( sZero ) )[0];
		}

		_fnCallbackFire( oSettings, 'aoHeaderCallback', 'header', [ $(oSettings.nTHead).children('tr')[0],
			_fnGetDataMaster( oSettings ), iDisplayStart, iDisplayEnd, aiDisplay ] );

			_fnCallbackFire( oSettings, 'aoFooterCallback', 'footer', [ $(oSettings.nTFoot).children('tr')[0],
			_fnGetDataMaster( oSettings ), iDisplayStart, iDisplayEnd, aiDisplay ] );

			var body = $(oSettings.nTBody);

			body.children().detach();
		body.append( $(anRows) );

		_fnCallbackFire( oSettings, 'aoDrawCallback', 'draw', [oSettings] );

		oSettings.bSorted = false;
		oSettings.bFiltered = false;
		oSettings.bDrawing = false;
	}


	function _fnReDraw( settings, holdPosition )
	{
		var
			features = settings.oFeatures,
			sort     = features.bSort,
			filter   = features.bFilter;

			if ( sort ) {
			_fnSort( settings );
		}

			if ( filter ) {
			_fnFilterComplete( settings, settings.oPreviousSearch );
		}
		else {
			settings.aiDisplay = settings.aiDisplayMaster.slice();
		}

			if ( holdPosition !== true ) {
			settings._iDisplayStart = 0;
		}

		settings._drawHold = holdPosition;

			_fnDraw( settings );

			settings._drawHold = false;
	}


	function _fnAddOptionsHtml ( oSettings )
	{
		var classes = oSettings.oClasses;
		var table = $(oSettings.nTable);
		var holding = $('<div/>').insertBefore( table ); 
		var features = oSettings.oFeatures;

		var insert = $('<div/>', {
			id:      oSettings.sTableId+'_wrapper',
			'class': classes.sWrapper + (oSettings.nTFoot ? '' : ' '+classes.sNoFooter)
		} );

			oSettings.nHolding = holding[0];
		oSettings.nTableWrapper = insert[0];
		oSettings.nTableReinsertBefore = oSettings.nTable.nextSibling;

		var aDom = oSettings.sDom.split('');
		var featureNode, cOption, nNewNode, cNext, sAttr, j;
		for ( var i=0 ; i<aDom.length ; i++ )
		{
			featureNode = null;
			cOption = aDom[i];

				if ( cOption == '<' )
			{
				nNewNode = $('<div/>')[0];

				cNext = aDom[i+1];
				if ( cNext == "'" || cNext == '"' )
				{
					sAttr = "";
					j = 2;
					while ( aDom[i+j] != cNext )
					{
						sAttr += aDom[i+j];
						j++;
					}

					if ( sAttr == "H" )
					{
						sAttr = classes.sJUIHeader;
					}
					else if ( sAttr == "F" )
					{
						sAttr = classes.sJUIFooter;
					}

					if ( sAttr.indexOf('.') != -1 )
					{
						var aSplit = sAttr.split('.');
						nNewNode.id = aSplit[0].substr(1, aSplit[0].length-1);
						nNewNode.className = aSplit[1];
					}
					else if ( sAttr.charAt(0) == "#" )
					{
						nNewNode.id = sAttr.substr(1, sAttr.length-1);
					}
					else
					{
						nNewNode.className = sAttr;
					}

						i += j; 
				}

					insert.append( nNewNode );
				insert = $(nNewNode);
			}
			else if ( cOption == '>' )
			{
				insert = insert.parent();
			}
			else if ( cOption == 'l' && features.bPaginate && features.bLengthChange )
			{
				featureNode = _fnFeatureHtmlLength( oSettings );
			}
			else if ( cOption == 'f' && features.bFilter )
			{
				featureNode = _fnFeatureHtmlFilter( oSettings );
			}
			else if ( cOption == 'r' && features.bProcessing )
			{
				featureNode = _fnFeatureHtmlProcessing( oSettings );
			}
			else if ( cOption == 't' )
			{
				featureNode = _fnFeatureHtmlTable( oSettings );
			}
			else if ( cOption ==  'i' && features.bInfo )
			{
				featureNode = _fnFeatureHtmlInfo( oSettings );
			}
			else if ( cOption == 'p' && features.bPaginate )
			{
				featureNode = _fnFeatureHtmlPaginate( oSettings );
			}
			else if ( DataTable.ext.feature.length !== 0 )
			{
				var aoFeatures = DataTable.ext.feature;
				for ( var k=0, kLen=aoFeatures.length ; k<kLen ; k++ )
				{
					if ( cOption == aoFeatures[k].cFeature )
					{
						featureNode = aoFeatures[k].fnInit( oSettings );
						break;
					}
				}
			}

			if ( featureNode )
			{
				var aanFeatures = oSettings.aanFeatures;

					if ( ! aanFeatures[cOption] )
				{
					aanFeatures[cOption] = [];
				}

					aanFeatures[cOption].push( featureNode );
				insert.append( featureNode );
			}
		}

		holding.replaceWith( insert );
		oSettings.nHolding = null;
	}


	function _fnDetectHeader ( aLayout, nThead )
	{
		var nTrs = $(nThead).children('tr');
		var nTr, nCell;
		var i, k, l, iLen, jLen, iColShifted, iColumn, iColspan, iRowspan;
		var bUnique;
		var fnShiftCol = function ( a, i, j ) {
			var k = a[i];
	                while ( k[j] ) {
				j++;
			}
			return j;
		};

			aLayout.splice( 0, aLayout.length );

		for ( i=0, iLen=nTrs.length ; i<iLen ; i++ )
		{
			aLayout.push( [] );
		}

		for ( i=0, iLen=nTrs.length ; i<iLen ; i++ )
		{
			nTr = nTrs[i];
			iColumn = 0;

			nCell = nTr.firstChild;
			while ( nCell ) {
				if ( nCell.nodeName.toUpperCase() == "TD" ||
				     nCell.nodeName.toUpperCase() == "TH" )
				{
					iColspan = nCell.getAttribute('colspan') * 1;
					iRowspan = nCell.getAttribute('rowspan') * 1;
					iColspan = (!iColspan || iColspan===0 || iColspan===1) ? 1 : iColspan;
					iRowspan = (!iRowspan || iRowspan===0 || iRowspan===1) ? 1 : iRowspan;

					iColShifted = fnShiftCol( aLayout, i, iColumn );

					bUnique = iColspan === 1 ? true : false;

					for ( l=0 ; l<iColspan ; l++ )
					{
						for ( k=0 ; k<iRowspan ; k++ )
						{
							aLayout[i+k][iColShifted+l] = {
								"cell": nCell,
								"unique": bUnique
							};
							aLayout[i+k].nTr = nTr;
						}
					}
				}
				nCell = nCell.nextSibling;
			}
		}
	}


	function _fnGetUniqueThs ( oSettings, nHeader, aLayout )
	{
		var aReturn = [];
		if ( !aLayout )
		{
			aLayout = oSettings.aoHeader;
			if ( nHeader )
			{
				aLayout = [];
				_fnDetectHeader( aLayout, nHeader );
			}
		}

			for ( var i=0, iLen=aLayout.length ; i<iLen ; i++ )
		{
			for ( var j=0, jLen=aLayout[i].length ; j<jLen ; j++ )
			{
				if ( aLayout[i][j].unique &&
					 (!aReturn[j] || !oSettings.bSortCellsTop) )
				{
					aReturn[j] = aLayout[i][j].cell;
				}
			}
		}

			return aReturn;
	}

	function _fnBuildAjax( oSettings, data, fn )
	{
		_fnCallbackFire( oSettings, 'aoServerParams', 'serverParams', [data] );

		if ( data && Array.isArray(data) ) {
			var tmp = {};
			var rbracket = /(.*?)\[\]$/;

				$.each( data, function (key, val) {
				var match = val.name.match(rbracket);

					if ( match ) {
					var name = match[0];

						if ( ! tmp[ name ] ) {
						tmp[ name ] = [];
					}
					tmp[ name ].push( val.value );
				}
				else {
					tmp[val.name] = val.value;
				}
			} );
			data = tmp;
		}

			var ajaxData;
		var ajax = oSettings.ajax;
		var instance = oSettings.oInstance;
		var callback = function ( json ) {
			_fnCallbackFire( oSettings, null, 'xhr', [oSettings, json, oSettings.jqXHR] );
			fn( json );
		};

			if ( $.isPlainObject( ajax ) && ajax.data )
		{
			ajaxData = ajax.data;

				var newData = typeof ajaxData === 'function' ?
				ajaxData( data, oSettings ) :  
				ajaxData;                      

			data = typeof ajaxData === 'function' && newData ?
				newData :
				$.extend( true, data, newData );

			delete ajax.data;
		}

			var baseAjax = {
			"data": data,
			"success": function (json) {
				var error = json.error || json.sError;
				if ( error ) {
					_fnLog( oSettings, 0, error );
				}

					oSettings.json = json;
				callback( json );
			},
			"dataType": "json",
			"cache": false,
			"type": oSettings.sServerMethod,
			"error": function (xhr, error, thrown) {
				var ret = _fnCallbackFire( oSettings, null, 'xhr', [oSettings, null, oSettings.jqXHR] );

					if ( $.inArray( true, ret ) === -1 ) {
					if ( error == "parsererror" ) {
						_fnLog( oSettings, 0, 'Invalid JSON response', 1 );
					}
					else if ( xhr.readyState === 4 ) {
						_fnLog( oSettings, 0, 'Ajax error', 7 );
					}
				}

					_fnProcessingDisplay( oSettings, false );
			}
		};

		oSettings.oAjaxData = data;

		_fnCallbackFire( oSettings, null, 'preXhr', [oSettings, data] );

			if ( oSettings.fnServerData )
		{
			oSettings.fnServerData.call( instance,
				oSettings.sAjaxSource,
				$.map( data, function (val, key) { 
					return { name: key, value: val };
				} ),
				callback,
				oSettings
			);
		}
		else if ( oSettings.sAjaxSource || typeof ajax === 'string' )
		{
			oSettings.jqXHR = $.ajax( $.extend( baseAjax, {
				url: ajax || oSettings.sAjaxSource
			} ) );
		}
		else if ( typeof ajax === 'function' )
		{
			oSettings.jqXHR = ajax.call( instance, data, callback, oSettings );
		}
		else
		{
			oSettings.jqXHR = $.ajax( $.extend( baseAjax, ajax ) );

			ajax.data = ajaxData;
		}
	}


	function _fnAjaxUpdate( settings )
	{
		if ( settings.bAjaxDataGet ) {
			settings.iDraw++;
			_fnProcessingDisplay( settings, true );

				_fnBuildAjax(
				settings,
				_fnAjaxParameters( settings ),
				function(json) {
					_fnAjaxUpdateDraw( settings, json );
				}
			);

				return false;
		}
		return true;
	}


	function _fnAjaxParameters( settings )
	{
		var
			columns = settings.aoColumns,
			columnCount = columns.length,
			features = settings.oFeatures,
			preSearch = settings.oPreviousSearch,
			preColSearch = settings.aoPreSearchCols,
			i, data = [], dataProp, column, columnSearch,
			sort = _fnSortFlatten( settings ),
			displayStart = settings._iDisplayStart,
			displayLength = features.bPaginate !== false ?
				settings._iDisplayLength :
				-1;

			var param = function ( name, value ) {
			data.push( { 'name': name, 'value': value } );
		};

		param( 'sEcho',          settings.iDraw );
		param( 'iColumns',       columnCount );
		param( 'sColumns',       _pluck( columns, 'sName' ).join(',') );
		param( 'iDisplayStart',  displayStart );
		param( 'iDisplayLength', displayLength );

		var d = {
			draw:    settings.iDraw,
			columns: [],
			order:   [],
			start:   displayStart,
			length:  displayLength,
			search:  {
				value: preSearch.sSearch,
				regex: preSearch.bRegex
			}
		};

			for ( i=0 ; i<columnCount ; i++ ) {
			column = columns[i];
			columnSearch = preColSearch[i];
			dataProp = typeof column.mData=="function" ? 'function' : column.mData ;

				d.columns.push( {
				data:       dataProp,
				name:       column.sName,
				searchable: column.bSearchable,
				orderable:  column.bSortable,
				search:     {
					value: columnSearch.sSearch,
					regex: columnSearch.bRegex
				}
			} );

				param( "mDataProp_"+i, dataProp );

				if ( features.bFilter ) {
				param( 'sSearch_'+i,     columnSearch.sSearch );
				param( 'bRegex_'+i,      columnSearch.bRegex );
				param( 'bSearchable_'+i, column.bSearchable );
			}

				if ( features.bSort ) {
				param( 'bSortable_'+i, column.bSortable );
			}
		}

			if ( features.bFilter ) {
			param( 'sSearch', preSearch.sSearch );
			param( 'bRegex', preSearch.bRegex );
		}

			if ( features.bSort ) {
			$.each( sort, function ( i, val ) {
				d.order.push( { column: val.col, dir: val.dir } );

					param( 'iSortCol_'+i, val.col );
				param( 'sSortDir_'+i, val.dir );
			} );

				param( 'iSortingCols', sort.length );
		}

		var legacy = DataTable.ext.legacy.ajax;
		if ( legacy === null ) {
			return settings.sAjaxSource ? data : d;
		}

		return legacy ? data : d;
	}


	function _fnAjaxUpdateDraw ( settings, json )
	{
		var compat = function ( old, modern ) {
			return json[old] !== undefined ? json[old] : json[modern];
		};

			var data = _fnAjaxDataSrc( settings, json );
		var draw            = compat( 'sEcho',                'draw' );
		var recordsTotal    = compat( 'iTotalRecords',        'recordsTotal' );
		var recordsFiltered = compat( 'iTotalDisplayRecords', 'recordsFiltered' );

			if ( draw !== undefined ) {
			if ( draw*1 < settings.iDraw ) {
				return;
			}
			settings.iDraw = draw * 1;
		}

			_fnClearTable( settings );
		settings._iRecordsTotal   = parseInt(recordsTotal, 10);
		settings._iRecordsDisplay = parseInt(recordsFiltered, 10);

			for ( var i=0, ien=data.length ; i<ien ; i++ ) {
			_fnAddData( settings, data[i] );
		}
		settings.aiDisplay = settings.aiDisplayMaster.slice();

			settings.bAjaxDataGet = false;
		_fnDraw( settings );

			if ( ! settings._bInitComplete ) {
			_fnInitComplete( settings, json );
		}

			settings.bAjaxDataGet = true;
		_fnProcessingDisplay( settings, false );
	}


	function _fnAjaxDataSrc ( oSettings, json )
	{
		var dataSrc = $.isPlainObject( oSettings.ajax ) && oSettings.ajax.dataSrc !== undefined ?
			oSettings.ajax.dataSrc :
			oSettings.sAjaxDataProp; 

		if ( dataSrc === 'data' ) {
			return json.aaData || json[dataSrc];
		}

			return dataSrc !== "" ?
			_fnGetObjectDataFn( dataSrc )( json ) :
			json;
	}

	function _fnFeatureHtmlFilter ( settings )
	{
		var classes = settings.oClasses;
		var tableId = settings.sTableId;
		var language = settings.oLanguage;
		var previousSearch = settings.oPreviousSearch;
		var features = settings.aanFeatures;
		var input = '<input type="search" class="'+classes.sFilterInput+'"/>';

			var str = language.sSearch;
		str = str.match(/_INPUT_/) ?
			str.replace('_INPUT_', input) :
			str+input;

			var filter = $('<div/>', {
				'id': ! features.f ? tableId+'_filter' : null,
				'class': classes.sFilter
			} )
			.append( $('<label/>' ).append( str ) );

			var searchFn = function() {
			var n = features.f;
			var val = !this.value ? "" : this.value; 

			if ( val != previousSearch.sSearch ) {
				_fnFilterComplete( settings, {
					"sSearch": val,
					"bRegex": previousSearch.bRegex,
					"bSmart": previousSearch.bSmart ,
					"bCaseInsensitive": previousSearch.bCaseInsensitive
				} );

				settings._iDisplayStart = 0;
				_fnDraw( settings );
			}
		};

			var searchDelay = settings.searchDelay !== null ?
			settings.searchDelay :
			_fnDataSource( settings ) === 'ssp' ?
				400 :
				0;

			var jqFilter = $('input', filter)
			.val( previousSearch.sSearch )
			.attr( 'placeholder', language.sSearchPlaceholder )
			.on(
				'keyup.DT search.DT input.DT paste.DT cut.DT',
				searchDelay ?
					_fnThrottle( searchFn, searchDelay ) :
					searchFn
			)
			.on( 'mouseup', function(e) {
				setTimeout( function () {
					searchFn.call(jqFilter[0]);
				}, 10);
			} )
			.on( 'keypress.DT', function(e) {
				if ( e.keyCode == 13 ) {
					return false;
				}
			} )
			.attr('aria-controls', tableId);

		$(settings.nTable).on( 'search.dt.DT', function ( ev, s ) {
			if ( settings === s ) {
				try {
					if ( jqFilter[0] !== document.activeElement ) {
						jqFilter.val( previousSearch.sSearch );
					}
				}
				catch ( e ) {}
			}
		} );

			return filter[0];
	}


	function _fnFilterComplete ( oSettings, oInput, iForce )
	{
		var oPrevSearch = oSettings.oPreviousSearch;
		var aoPrevSearch = oSettings.aoPreSearchCols;
		var fnSaveFilter = function ( oFilter ) {
			oPrevSearch.sSearch = oFilter.sSearch;
			oPrevSearch.bRegex = oFilter.bRegex;
			oPrevSearch.bSmart = oFilter.bSmart;
			oPrevSearch.bCaseInsensitive = oFilter.bCaseInsensitive;
		};
		var fnRegex = function ( o ) {
			return o.bEscapeRegex !== undefined ? !o.bEscapeRegex : o.bRegex;
		};

		_fnColumnTypes( oSettings );

		if ( _fnDataSource( oSettings ) != 'ssp' )
		{
			_fnFilter( oSettings, oInput.sSearch, iForce, fnRegex(oInput), oInput.bSmart, oInput.bCaseInsensitive );
			fnSaveFilter( oInput );

			for ( var i=0 ; i<aoPrevSearch.length ; i++ )
			{
				_fnFilterColumn( oSettings, aoPrevSearch[i].sSearch, i, fnRegex(aoPrevSearch[i]),
					aoPrevSearch[i].bSmart, aoPrevSearch[i].bCaseInsensitive );
			}

			_fnFilterCustom( oSettings );
		}
		else
		{
			fnSaveFilter( oInput );
		}

		oSettings.bFiltered = true;
		_fnCallbackFire( oSettings, null, 'search', [oSettings] );
	}


	function _fnFilterCustom( settings )
	{
		var filters = DataTable.ext.search;
		var displayRows = settings.aiDisplay;
		var row, rowIdx;

			for ( var i=0, ien=filters.length ; i<ien ; i++ ) {
			var rows = [];

			for ( var j=0, jen=displayRows.length ; j<jen ; j++ ) {
				rowIdx = displayRows[ j ];
				row = settings.aoData[ rowIdx ];

					if ( filters[i]( settings, row._aFilterData, rowIdx, row._aData, j ) ) {
					rows.push( rowIdx );
				}
			}

			displayRows.length = 0;
			$.merge( displayRows, rows );
		}
	}


	function _fnFilterColumn ( settings, searchStr, colIdx, regex, smart, caseInsensitive )
	{
		if ( searchStr === '' ) {
			return;
		}

			var data;
		var out = [];
		var display = settings.aiDisplay;
		var rpSearch = _fnFilterCreateSearch( searchStr, regex, smart, caseInsensitive );

			for ( var i=0 ; i<display.length ; i++ ) {
			data = settings.aoData[ display[i] ]._aFilterData[ colIdx ];

				if ( rpSearch.test( data ) ) {
				out.push( display[i] );
			}
		}

			settings.aiDisplay = out;
	}


	function _fnFilter( settings, input, force, regex, smart, caseInsensitive )
	{
		var rpSearch = _fnFilterCreateSearch( input, regex, smart, caseInsensitive );
		var prevSearch = settings.oPreviousSearch.sSearch;
		var displayMaster = settings.aiDisplayMaster;
		var display, invalidated, i;
		var filtered = [];

		if ( DataTable.ext.search.length !== 0 ) {
			force = true;
		}

		invalidated = _fnFilterData( settings );

		if ( input.length <= 0 ) {
			settings.aiDisplay = displayMaster.slice();
		}
		else {
			if ( invalidated ||
				 force ||
				 regex ||
				 prevSearch.length > input.length ||
				 input.indexOf(prevSearch) !== 0 ||
				 settings.bSorted 
			) {
				settings.aiDisplay = displayMaster.slice();
			}

			display = settings.aiDisplay;

				for ( i=0 ; i<display.length ; i++ ) {
				if ( rpSearch.test( settings.aoData[ display[i] ]._sFilterRow ) ) {
					filtered.push( display[i] );
				}
			}

				settings.aiDisplay = filtered;
		}
	}


	function _fnFilterCreateSearch( search, regex, smart, caseInsensitive )
	{
		search = regex ?
			search :
			_fnEscapeRegex( search );

				if ( smart ) {
			var a = $.map( search.match( /"[^"]+"|[^ ]+/g ) || [''], function ( word ) {
				if ( word.charAt(0) === '"' ) {
					var m = word.match( /^"(.*)"$/ );
					word = m ? m[1] : word;
				}

					return word.replace('"', '');
			} );

				search = '^(?=.*?'+a.join( ')(?=.*?' )+').*$';
		}

			return new RegExp( search, caseInsensitive ? 'i' : '' );
	}


	var _fnEscapeRegex = DataTable.util.escapeRegex;

		var __filter_div = $('<div>')[0];
	var __filter_div_textContent = __filter_div.textContent !== undefined;

	function _fnFilterData ( settings )
	{
		var columns = settings.aoColumns;
		var column;
		var i, j, ien, jen, filterData, cellData, row;
		var fomatters = DataTable.ext.type.search;
		var wasInvalidated = false;

			for ( i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
			row = settings.aoData[i];

				if ( ! row._aFilterData ) {
				filterData = [];

					for ( j=0, jen=columns.length ; j<jen ; j++ ) {
					column = columns[j];

						if ( column.bSearchable ) {
						cellData = _fnGetCellData( settings, i, j, 'filter' );

							if ( fomatters[ column.sType ] ) {
							cellData = fomatters[ column.sType ]( cellData );
						}

						if ( cellData === null ) {
							cellData = '';
						}

							if ( typeof cellData !== 'string' && cellData.toString ) {
							cellData = cellData.toString();
						}
					}
					else {
						cellData = '';
					}

					if ( cellData.indexOf && cellData.indexOf('&') !== -1 ) {
						__filter_div.innerHTML = cellData;
						cellData = __filter_div_textContent ?
							__filter_div.textContent :
							__filter_div.innerText;
					}

						if ( cellData.replace ) {
						cellData = cellData.replace(/[\r\n\u2028]/g, '');
					}

						filterData.push( cellData );
				}

					row._aFilterData = filterData;
				row._sFilterRow = filterData.join('  ');
				wasInvalidated = true;
			}
		}

			return wasInvalidated;
	}


	function _fnSearchToCamel ( obj )
	{
		return {
			search:          obj.sSearch,
			smart:           obj.bSmart,
			regex:           obj.bRegex,
			caseInsensitive: obj.bCaseInsensitive
		};
	}



	function _fnSearchToHung ( obj )
	{
		return {
			sSearch:          obj.search,
			bSmart:           obj.smart,
			bRegex:           obj.regex,
			bCaseInsensitive: obj.caseInsensitive
		};
	}

	function _fnFeatureHtmlInfo ( settings )
	{
		var
			tid = settings.sTableId,
			nodes = settings.aanFeatures.i,
			n = $('<div/>', {
				'class': settings.oClasses.sInfo,
				'id': ! nodes ? tid+'_info' : null
			} );

			if ( ! nodes ) {
			settings.aoDrawCallback.push( {
				"fn": _fnUpdateInfo,
				"sName": "information"
			} );

				n
				.attr( 'role', 'status' )
				.attr( 'aria-live', 'polite' );

			$(settings.nTable).attr( 'aria-describedby', tid+'_info' );
		}

			return n[0];
	}


	function _fnUpdateInfo ( settings )
	{
		var nodes = settings.aanFeatures.i;
		if ( nodes.length === 0 ) {
			return;
		}

			var
			lang  = settings.oLanguage,
			start = settings._iDisplayStart+1,
			end   = settings.fnDisplayEnd(),
			max   = settings.fnRecordsTotal(),
			total = settings.fnRecordsDisplay(),
			out   = total ?
				lang.sInfo :
				lang.sInfoEmpty;

			if ( total !== max ) {
			out += ' ' + lang.sInfoFiltered;
		}

		out += lang.sInfoPostFix;
		out = _fnInfoMacros( settings, out );

			var callback = lang.fnInfoCallback;
		if ( callback !== null ) {
			out = callback.call( settings.oInstance,
				settings, start, end, max, total, out
			);
		}

			$(nodes).html( out );
	}


			function _fnInfoMacros ( settings, str )
	{
		var
			formatter  = settings.fnFormatNumber,
			start      = settings._iDisplayStart+1,
			len        = settings._iDisplayLength,
			vis        = settings.fnRecordsDisplay(),
			all        = len === -1;

			return str.
			replace(/_START_/g, formatter.call( settings, start ) ).
			replace(/_END_/g,   formatter.call( settings, settings.fnDisplayEnd() ) ).
			replace(/_MAX_/g,   formatter.call( settings, settings.fnRecordsTotal() ) ).
			replace(/_TOTAL_/g, formatter.call( settings, vis ) ).
			replace(/_PAGE_/g,  formatter.call( settings, all ? 1 : Math.ceil( start / len ) ) ).
			replace(/_PAGES_/g, formatter.call( settings, all ? 1 : Math.ceil( vis / len ) ) );
	}



	function _fnInitialise ( settings )
	{
		var i, iLen, iAjaxStart=settings.iInitDisplayStart;
		var columns = settings.aoColumns, column;
		var features = settings.oFeatures;
		var deferLoading = settings.bDeferLoading; 

		if ( ! settings.bInitialised ) {
			setTimeout( function(){ _fnInitialise( settings ); }, 200 );
			return;
		}

		_fnAddOptionsHtml( settings );

		_fnBuildHead( settings );
		_fnDrawHead( settings, settings.aoHeader );
		_fnDrawHead( settings, settings.aoFooter );

		_fnProcessingDisplay( settings, true );

		if ( features.bAutoWidth ) {
			_fnCalculateColumnWidths( settings );
		}

			for ( i=0, iLen=columns.length ; i<iLen ; i++ ) {
			column = columns[i];

				if ( column.sWidth ) {
				column.nTh.style.width = _fnStringToCss( column.sWidth );
			}
		}

			_fnCallbackFire( settings, null, 'preInit', [settings] );

		_fnReDraw( settings );

		var dataSrc = _fnDataSource( settings );
		if ( dataSrc != 'ssp' || deferLoading ) {
			if ( dataSrc == 'ajax' ) {
				_fnBuildAjax( settings, [], function(json) {
					var aData = _fnAjaxDataSrc( settings, json );

					for ( i=0 ; i<aData.length ; i++ ) {
						_fnAddData( settings, aData[i] );
					}

					settings.iInitDisplayStart = iAjaxStart;

						_fnReDraw( settings );

						_fnProcessingDisplay( settings, false );
					_fnInitComplete( settings, json );
				}, settings );
			}
			else {
				_fnProcessingDisplay( settings, false );
				_fnInitComplete( settings );
			}
		}
	}


	function _fnInitComplete ( settings, json )
	{
		settings._bInitComplete = true;

		if ( json || settings.oInit.aaData ) {
			_fnAdjustColumnSizing( settings );
		}

			_fnCallbackFire( settings, null, 'plugin-init', [settings, json] );
		_fnCallbackFire( settings, 'aoInitComplete', 'init', [settings, json] );
	}


			function _fnLengthChange ( settings, val )
	{
		var len = parseInt( val, 10 );
		settings._iDisplayLength = len;

			_fnLengthOverflow( settings );

		_fnCallbackFire( settings, null, 'length', [settings, len] );
	}


	function _fnFeatureHtmlLength ( settings )
	{
		var
			classes  = settings.oClasses,
			tableId  = settings.sTableId,
			menu     = settings.aLengthMenu,
			d2       = Array.isArray( menu[0] ),
			lengths  = d2 ? menu[0] : menu,
			language = d2 ? menu[1] : menu;

			var select = $('<select/>', {
			'name':          tableId+'_length',
			'aria-controls': tableId,
			'class':         classes.sLengthSelect
		} );

			for ( var i=0, ien=lengths.length ; i<ien ; i++ ) {
			select[0][ i ] = new Option(
				typeof language[i] === 'number' ?
					settings.fnFormatNumber( language[i] ) :
					language[i],
				lengths[i]
			);
		}

			var div = $('<div><label/></div>').addClass( classes.sLength );
		if ( ! settings.aanFeatures.l ) {
			div[0].id = tableId+'_length';
		}

			div.children().append(
			settings.oLanguage.sLengthMenu.replace( '_MENU_', select[0].outerHTML )
		);

		$('select', div)
			.val( settings._iDisplayLength )
			.on( 'change.DT', function(e) {
				_fnLengthChange( settings, $(this).val() );
				_fnDraw( settings );
			} );

		$(settings.nTable).on( 'length.dt.DT', function (e, s, len) {
			if ( settings === s ) {
				$('select', div).val( len );
			}
		} );

			return div[0];
	}




	function _fnFeatureHtmlPaginate ( settings )
	{
		var
			type   = settings.sPaginationType,
			plugin = DataTable.ext.pager[ type ],
			modern = typeof plugin === 'function',
			redraw = function( settings ) {
				_fnDraw( settings );
			},
			node = $('<div/>').addClass( settings.oClasses.sPaging + type )[0],
			features = settings.aanFeatures;

			if ( ! modern ) {
			plugin.fnInit( settings, node, redraw );
		}

		if ( ! features.p )
		{
			node.id = settings.sTableId+'_paginate';

				settings.aoDrawCallback.push( {
				"fn": function( settings ) {
					if ( modern ) {
						var
							start      = settings._iDisplayStart,
							len        = settings._iDisplayLength,
							visRecords = settings.fnRecordsDisplay(),
							all        = len === -1,
							page = all ? 0 : Math.ceil( start / len ),
							pages = all ? 1 : Math.ceil( visRecords / len ),
							buttons = plugin(page, pages),
							i, ien;

							for ( i=0, ien=features.p.length ; i<ien ; i++ ) {
							_fnRenderer( settings, 'pageButton' )(
								settings, features.p[i], i, buttons, page, pages
							);
						}
					}
					else {
						plugin.fnUpdate( settings, redraw );
					}
				},
				"sName": "pagination"
			} );
		}

			return node;
	}


	function _fnPageChange ( settings, action, redraw )
	{
		var
			start     = settings._iDisplayStart,
			len       = settings._iDisplayLength,
			records   = settings.fnRecordsDisplay();

			if ( records === 0 || len === -1 )
		{
			start = 0;
		}
		else if ( typeof action === "number" )
		{
			start = action * len;

				if ( start > records )
			{
				start = 0;
			}
		}
		else if ( action == "first" )
		{
			start = 0;
		}
		else if ( action == "previous" )
		{
			start = len >= 0 ?
				start - len :
				0;

				if ( start < 0 )
			{
			  start = 0;
			}
		}
		else if ( action == "next" )
		{
			if ( start + len < records )
			{
				start += len;
			}
		}
		else if ( action == "last" )
		{
			start = Math.floor( (records-1) / len) * len;
		}
		else
		{
			_fnLog( settings, 0, "Unknown paging action: "+action, 5 );
		}

			var changed = settings._iDisplayStart !== start;
		settings._iDisplayStart = start;

			if ( changed ) {
			_fnCallbackFire( settings, null, 'page', [settings] );

				if ( redraw ) {
				_fnDraw( settings );
			}
		}

			return changed;
	}



	function _fnFeatureHtmlProcessing ( settings )
	{
		return $('<div/>', {
				'id': ! settings.aanFeatures.r ? settings.sTableId+'_processing' : null,
				'class': settings.oClasses.sProcessing
			} )
			.html( settings.oLanguage.sProcessing )
			.insertBefore( settings.nTable )[0];
	}


	function _fnProcessingDisplay ( settings, show )
	{
		if ( settings.oFeatures.bProcessing ) {
			$(settings.aanFeatures.r).css( 'display', show ? 'block' : 'none' );
		}

			_fnCallbackFire( settings, null, 'processing', [settings, show] );
	}

	function _fnFeatureHtmlTable ( settings )
	{
		var table = $(settings.nTable);

		table.attr( 'role', 'grid' );

		var scroll = settings.oScroll;

			if ( scroll.sX === '' && scroll.sY === '' ) {
			return settings.nTable;
		}

			var scrollX = scroll.sX;
		var scrollY = scroll.sY;
		var classes = settings.oClasses;
		var caption = table.children('caption');
		var captionSide = caption.length ? caption[0]._captionSide : null;
		var headerClone = $( table[0].cloneNode(false) );
		var footerClone = $( table[0].cloneNode(false) );
		var footer = table.children('tfoot');
		var _div = '<div/>';
		var size = function ( s ) {
			return !s ? null : _fnStringToCss( s );
		};

			if ( ! footer.length ) {
			footer = null;
		}

		var scroller = $( _div, { 'class': classes.sScrollWrapper } )
			.append(
				$(_div, { 'class': classes.sScrollHead } )
					.css( {
						overflow: 'hidden',
						position: 'relative',
						border: 0,
						width: scrollX ? size(scrollX) : '100%'
					} )
					.append(
						$(_div, { 'class': classes.sScrollHeadInner } )
							.css( {
								'box-sizing': 'content-box',
								width: scroll.sXInner || '100%'
							} )
							.append(
								headerClone
									.removeAttr('id')
									.css( 'margin-left', 0 )
									.append( captionSide === 'top' ? caption : null )
									.append(
										table.children('thead')
									)
							)
					)
			)
			.append(
				$(_div, { 'class': classes.sScrollBody } )
					.css( {
						position: 'relative',
						overflow: 'auto',
						width: size( scrollX )
					} )
					.append( table )
			);

			if ( footer ) {
			scroller.append(
				$(_div, { 'class': classes.sScrollFoot } )
					.css( {
						overflow: 'hidden',
						border: 0,
						width: scrollX ? size(scrollX) : '100%'
					} )
					.append(
						$(_div, { 'class': classes.sScrollFootInner } )
							.append(
								footerClone
									.removeAttr('id')
									.css( 'margin-left', 0 )
									.append( captionSide === 'bottom' ? caption : null )
									.append(
										table.children('tfoot')
									)
							)
					)
			);
		}

			var children = scroller.children();
		var scrollHead = children[0];
		var scrollBody = children[1];
		var scrollFoot = footer ? children[2] : null;

		if ( scrollX ) {
			$(scrollBody).on( 'scroll.DT', function (e) {
				var scrollLeft = this.scrollLeft;

					scrollHead.scrollLeft = scrollLeft;

					if ( footer ) {
					scrollFoot.scrollLeft = scrollLeft;
				}
			} );
		}

			$(scrollBody).css('max-height', scrollY);
		if (! scroll.bCollapse) {
			$(scrollBody).css('height', scrollY);
		}

			settings.nScrollHead = scrollHead;
		settings.nScrollBody = scrollBody;
		settings.nScrollFoot = scrollFoot;

		settings.aoDrawCallback.push( {
			"fn": _fnScrollDraw,
			"sName": "scrolling"
		} );

			return scroller[0];
	}



	function _fnScrollDraw ( settings )
	{
		var
			scroll         = settings.oScroll,
			scrollX        = scroll.sX,
			scrollXInner   = scroll.sXInner,
			scrollY        = scroll.sY,
			barWidth       = scroll.iBarWidth,
			divHeader      = $(settings.nScrollHead),
			divHeaderStyle = divHeader[0].style,
			divHeaderInner = divHeader.children('div'),
			divHeaderInnerStyle = divHeaderInner[0].style,
			divHeaderTable = divHeaderInner.children('table'),
			divBodyEl      = settings.nScrollBody,
			divBody        = $(divBodyEl),
			divBodyStyle   = divBodyEl.style,
			divFooter      = $(settings.nScrollFoot),
			divFooterInner = divFooter.children('div'),
			divFooterTable = divFooterInner.children('table'),
			header         = $(settings.nTHead),
			table          = $(settings.nTable),
			tableEl        = table[0],
			tableStyle     = tableEl.style,
			footer         = settings.nTFoot ? $(settings.nTFoot) : null,
			browser        = settings.oBrowser,
			ie67           = browser.bScrollOversize,
			dtHeaderCells  = _pluck( settings.aoColumns, 'nTh' ),
			headerTrgEls, footerTrgEls,
			headerSrcEls, footerSrcEls,
			headerCopy, footerCopy,
			headerWidths=[], footerWidths=[],
			headerContent=[], footerContent=[],
			idx, correction, sanityWidth,
			zeroOut = function(nSizer) {
				var style = nSizer.style;
				style.paddingTop = "0";
				style.paddingBottom = "0";
				style.borderTopWidth = "0";
				style.borderBottomWidth = "0";
				style.height = 0;
			};

		var scrollBarVis = divBodyEl.scrollHeight > divBodyEl.clientHeight;

				if ( settings.scrollBarVis !== scrollBarVis && settings.scrollBarVis !== undefined ) {
			settings.scrollBarVis = scrollBarVis;
			_fnAdjustColumnSizing( settings );
			return; 
		}
		else {
			settings.scrollBarVis = scrollBarVis;
		}


		table.children('thead, tfoot').remove();

			if ( footer ) {
			footerCopy = footer.clone().prependTo( table );
			footerTrgEls = footer.find('tr'); 
			footerSrcEls = footerCopy.find('tr');
		}

		headerCopy = header.clone().prependTo( table );
		headerTrgEls = header.find('tr'); 
		headerSrcEls = headerCopy.find('tr');
		headerCopy.find('th, td').removeAttr('tabindex');



		if ( ! scrollX )
		{
			divBodyStyle.width = '100%';
			divHeader[0].style.width = '100%';
		}

			$.each( _fnGetUniqueThs( settings, headerCopy ), function ( i, el ) {
			idx = _fnVisibleToColumnIndex( settings, i );
			el.style.width = settings.aoColumns[idx].sWidth;
		} );

			if ( footer ) {
			_fnApplyToChildren( function(n) {
				n.style.width = "";
			}, footerSrcEls );
		}

		sanityWidth = table.outerWidth();
		if ( scrollX === "" ) {
			tableStyle.width = "100%";

			if ( ie67 && (table.find('tbody').height() > divBodyEl.offsetHeight ||
				divBody.css('overflow-y') == "scroll")
			) {
				tableStyle.width = _fnStringToCss( table.outerWidth() - barWidth);
			}

			sanityWidth = table.outerWidth();
		}
		else if ( scrollXInner !== "" ) {
			tableStyle.width = _fnStringToCss(scrollXInner);

			sanityWidth = table.outerWidth();
		}


		_fnApplyToChildren( zeroOut, headerSrcEls );

		_fnApplyToChildren( function(nSizer) {
			headerContent.push( nSizer.innerHTML );
			headerWidths.push( _fnStringToCss( $(nSizer).css('width') ) );
		}, headerSrcEls );

		_fnApplyToChildren( function(nToSize, i) {
			if ( $.inArray( nToSize, dtHeaderCells ) !== -1 ) {
				nToSize.style.width = headerWidths[i];
			}
		}, headerTrgEls );

			$(headerSrcEls).height(0);

		if ( footer )
		{
			_fnApplyToChildren( zeroOut, footerSrcEls );

				_fnApplyToChildren( function(nSizer) {
				footerContent.push( nSizer.innerHTML );
				footerWidths.push( _fnStringToCss( $(nSizer).css('width') ) );
			}, footerSrcEls );

				_fnApplyToChildren( function(nToSize, i) {
				nToSize.style.width = footerWidths[i];
			}, footerTrgEls );

				$(footerSrcEls).height(0);
		}



		_fnApplyToChildren( function(nSizer, i) {
			nSizer.innerHTML = '<div class="dataTables_sizing">'+headerContent[i]+'</div>';
			nSizer.childNodes[0].style.height = "0";
			nSizer.childNodes[0].style.overflow = "hidden";
			nSizer.style.width = headerWidths[i];
		}, headerSrcEls );

			if ( footer )
		{
			_fnApplyToChildren( function(nSizer, i) {
				nSizer.innerHTML = '<div class="dataTables_sizing">'+footerContent[i]+'</div>';
				nSizer.childNodes[0].style.height = "0";
				nSizer.childNodes[0].style.overflow = "hidden";
				nSizer.style.width = footerWidths[i];
			}, footerSrcEls );
		}

		if ( table.outerWidth() < sanityWidth )
		{
			correction = ((divBodyEl.scrollHeight > divBodyEl.offsetHeight ||
				divBody.css('overflow-y') == "scroll")) ?
					sanityWidth+barWidth :
					sanityWidth;

			if ( ie67 && (divBodyEl.scrollHeight >
				divBodyEl.offsetHeight || divBody.css('overflow-y') == "scroll")
			) {
				tableStyle.width = _fnStringToCss( correction-barWidth );
			}

			if ( scrollX === "" || scrollXInner !== "" ) {
				_fnLog( settings, 1, 'Possible column misalignment', 6 );
			}
		}
		else
		{
			correction = '100%';
		}

		divBodyStyle.width = _fnStringToCss( correction );
		divHeaderStyle.width = _fnStringToCss( correction );

			if ( footer ) {
			settings.nScrollFoot.style.width = _fnStringToCss( correction );
		}


		if ( ! scrollY ) {
			if ( ie67 ) {
				divBodyStyle.height = _fnStringToCss( tableEl.offsetHeight+barWidth );
			}
		}

		var iOuterWidth = table.outerWidth();
		divHeaderTable[0].style.width = _fnStringToCss( iOuterWidth );
		divHeaderInnerStyle.width = _fnStringToCss( iOuterWidth );

		var bScrolling = table.height() > divBodyEl.clientHeight || divBody.css('overflow-y') == "scroll";
		var padding = 'padding' + (browser.bScrollbarLeft ? 'Left' : 'Right' );
		divHeaderInnerStyle[ padding ] = bScrolling ? barWidth+"px" : "0px";

			if ( footer ) {
			divFooterTable[0].style.width = _fnStringToCss( iOuterWidth );
			divFooterInner[0].style.width = _fnStringToCss( iOuterWidth );
			divFooterInner[0].style[padding] = bScrolling ? barWidth+"px" : "0px";
		}

		table.children('colgroup').insertBefore( table.children('thead') );

		divBody.trigger('scroll');

		if ( (settings.bSorted || settings.bFiltered) && ! settings._drawHold ) {
			divBodyEl.scrollTop = 0;
		}
	}



	function _fnApplyToChildren( fn, an1, an2 )
	{
		var index=0, i=0, iLen=an1.length;
		var nNode1, nNode2;

			while ( i < iLen ) {
			nNode1 = an1[i].firstChild;
			nNode2 = an2 ? an2[i].firstChild : null;

				while ( nNode1 ) {
				if ( nNode1.nodeType === 1 ) {
					if ( an2 ) {
						fn( nNode1, nNode2, index );
					}
					else {
						fn( nNode1, index );
					}

						index++;
				}

					nNode1 = nNode1.nextSibling;
				nNode2 = an2 ? nNode2.nextSibling : null;
			}

				i++;
		}
	}



				var __re_html_remove = /<.*?>/g;


	function _fnCalculateColumnWidths ( oSettings )
	{
		var
			table = oSettings.nTable,
			columns = oSettings.aoColumns,
			scroll = oSettings.oScroll,
			scrollY = scroll.sY,
			scrollX = scroll.sX,
			scrollXInner = scroll.sXInner,
			columnCount = columns.length,
			visibleColumns = _fnGetColumns( oSettings, 'bVisible' ),
			headerCells = $('th', oSettings.nTHead),
			tableWidthAttr = table.getAttribute('width'), 
			tableContainer = table.parentNode,
			userInputs = false,
			i, column, columnIdx, width, outerWidth,
			browser = oSettings.oBrowser,
			ie67 = browser.bScrollOversize;

			var styleWidth = table.style.width;
		if ( styleWidth && styleWidth.indexOf('%') !== -1 ) {
			tableWidthAttr = styleWidth;
		}

		for ( i=0 ; i<visibleColumns.length ; i++ ) {
			column = columns[ visibleColumns[i] ];

				if ( column.sWidth !== null ) {
				column.sWidth = _fnConvertToWidth( column.sWidthOrig, tableContainer );

					userInputs = true;
			}
		}

		if ( ie67 || ! userInputs && ! scrollX && ! scrollY &&
		     columnCount == _fnVisbleColumns( oSettings ) &&
		     columnCount == headerCells.length
		) {
			for ( i=0 ; i<columnCount ; i++ ) {
				var colIdx = _fnVisibleToColumnIndex( oSettings, i );

					if ( colIdx !== null ) {
					columns[ colIdx ].sWidth = _fnStringToCss( headerCells.eq(i).width() );
				}
			}
		}
		else
		{
			var tmpTable = $(table).clone() 
				.css( 'visibility', 'hidden' )
				.removeAttr( 'id' );

			tmpTable.find('tbody tr').remove();
			var tr = $('<tr/>').appendTo( tmpTable.find('tbody') );

			tmpTable.find('thead, tfoot').remove();
			tmpTable
				.append( $(oSettings.nTHead).clone() )
				.append( $(oSettings.nTFoot).clone() );

			tmpTable.find('tfoot th, tfoot td').css('width', '');

			headerCells = _fnGetUniqueThs( oSettings, tmpTable.find('thead')[0] );

				for ( i=0 ; i<visibleColumns.length ; i++ ) {
				column = columns[ visibleColumns[i] ];

					headerCells[i].style.width = column.sWidthOrig !== null && column.sWidthOrig !== '' ?
					_fnStringToCss( column.sWidthOrig ) :
					'';

				if ( column.sWidthOrig && scrollX ) {
					$( headerCells[i] ).append( $('<div/>').css( {
						width: column.sWidthOrig,
						margin: 0,
						padding: 0,
						border: 0,
						height: 1
					} ) );
				}
			}

			if ( oSettings.aoData.length ) {
				for ( i=0 ; i<visibleColumns.length ; i++ ) {
					columnIdx = visibleColumns[i];
					column = columns[ columnIdx ];

						$( _fnGetWidestNode( oSettings, columnIdx ) )
						.clone( false )
						.append( column.sContentPadding )
						.appendTo( tr );
				}
			}

			$('[name]', tmpTable).removeAttr('name');

			var holder = $('<div/>').css( scrollX || scrollY ?
					{
						position: 'absolute',
						top: 0,
						left: 0,
						height: 1,
						right: 0,
						overflow: 'hidden'
					} :
					{}
				)
				.append( tmpTable )
				.appendTo( tableContainer );

			if ( scrollX && scrollXInner ) {
				tmpTable.width( scrollXInner );
			}
			else if ( scrollX ) {
				tmpTable.css( 'width', 'auto' );
				tmpTable.removeAttr('width');

				if ( tmpTable.width() < tableContainer.clientWidth && tableWidthAttr ) {
					tmpTable.width( tableContainer.clientWidth );
				}
			}
			else if ( scrollY ) {
				tmpTable.width( tableContainer.clientWidth );
			}
			else if ( tableWidthAttr ) {
				tmpTable.width( tableWidthAttr );
			}

			var total = 0;
			for ( i=0 ; i<visibleColumns.length ; i++ ) {
				var cell = $(headerCells[i]);
				var border = cell.outerWidth() - cell.width();

				var bounding = browser.bBounding ?
					Math.ceil( headerCells[i].getBoundingClientRect().width ) :
					cell.outerWidth();

				total += bounding;

				columns[ visibleColumns[i] ].sWidth = _fnStringToCss( bounding - border );
			}

				table.style.width = _fnStringToCss( total );

			holder.remove();
		}

		if ( tableWidthAttr ) {
			table.style.width = _fnStringToCss( tableWidthAttr );
		}

			if ( (tableWidthAttr || scrollX) && ! oSettings._reszEvt ) {
			var bindResize = function () {
				$(window).on('resize.DT-'+oSettings.sInstance, _fnThrottle( function () {
					_fnAdjustColumnSizing( oSettings );
				} ) );
			};

			if ( ie67 ) {
				setTimeout( bindResize, 1000 );
			}
			else {
				bindResize();
			}

				oSettings._reszEvt = true;
		}
	}


	var _fnThrottle = DataTable.util.throttle;


	function _fnConvertToWidth ( width, parent )
	{
		if ( ! width ) {
			return 0;
		}

			var n = $('<div/>')
			.css( 'width', _fnStringToCss( width ) )
			.appendTo( parent || document.body );

			var val = n[0].offsetWidth;
		n.remove();

			return val;
	}


	function _fnGetWidestNode( settings, colIdx )
	{
		var idx = _fnGetMaxLenString( settings, colIdx );
		if ( idx < 0 ) {
			return null;
		}

			var data = settings.aoData[ idx ];
		return ! data.nTr ? 
			$('<td/>').html( _fnGetCellData( settings, idx, colIdx, 'display' ) )[0] :
			data.anCells[ colIdx ];
	}


	function _fnGetMaxLenString( settings, colIdx )
	{
		var s, max=-1, maxIdx = -1;

			for ( var i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
			s = _fnGetCellData( settings, i, colIdx, 'display' )+'';
			s = s.replace( __re_html_remove, '' );
			s = s.replace( /&nbsp;/g, ' ' );

				if ( s.length > max ) {
				max = s.length;
				maxIdx = i;
			}
		}

			return maxIdx;
	}


	function _fnStringToCss( s )
	{
		if ( s === null ) {
			return '0px';
		}

			if ( typeof s == 'number' ) {
			return s < 0 ?
				'0px' :
				s+'px';
		}

		return s.match(/\d$/) ?
			s+'px' :
			s;
	}



				function _fnSortFlatten ( settings )
	{
		var
			i, iLen, k, kLen,
			aSort = [],
			aiOrig = [],
			aoColumns = settings.aoColumns,
			aDataSort, iCol, sType, srcCol,
			fixed = settings.aaSortingFixed,
			fixedObj = $.isPlainObject( fixed ),
			nestedSort = [],
			add = function ( a ) {
				if ( a.length && ! Array.isArray( a[0] ) ) {
					nestedSort.push( a );
				}
				else {
					$.merge( nestedSort, a );
				}
			};

		if ( Array.isArray( fixed ) ) {
			add( fixed );
		}

			if ( fixedObj && fixed.pre ) {
			add( fixed.pre );
		}

			add( settings.aaSorting );

			if (fixedObj && fixed.post ) {
			add( fixed.post );
		}

			for ( i=0 ; i<nestedSort.length ; i++ )
		{
			srcCol = nestedSort[i][0];
			aDataSort = aoColumns[ srcCol ].aDataSort;

				for ( k=0, kLen=aDataSort.length ; k<kLen ; k++ )
			{
				iCol = aDataSort[k];
				sType = aoColumns[ iCol ].sType || 'string';

					if ( nestedSort[i]._idx === undefined ) {
					nestedSort[i]._idx = $.inArray( nestedSort[i][1], aoColumns[iCol].asSorting );
				}

					aSort.push( {
					src:       srcCol,
					col:       iCol,
					dir:       nestedSort[i][1],
					index:     nestedSort[i]._idx,
					type:      sType,
					formatter: DataTable.ext.type.order[ sType+"-pre" ]
				} );
			}
		}

			return aSort;
	}

	function _fnSort ( oSettings )
	{
		var
			i, ien, iLen, j, jLen, k, kLen,
			sDataType, nTh,
			aiOrig = [],
			oExtSort = DataTable.ext.type.order,
			aoData = oSettings.aoData,
			aoColumns = oSettings.aoColumns,
			aDataSort, data, iCol, sType, oSort,
			formatters = 0,
			sortCol,
			displayMaster = oSettings.aiDisplayMaster,
			aSort;

		_fnColumnTypes( oSettings );

			aSort = _fnSortFlatten( oSettings );

			for ( i=0, ien=aSort.length ; i<ien ; i++ ) {
			sortCol = aSort[i];

			if ( sortCol.formatter ) {
				formatters++;
			}

			_fnSortData( oSettings, sortCol.col );
		}

		if ( _fnDataSource( oSettings ) != 'ssp' && aSort.length !== 0 )
		{
			for ( i=0, iLen=displayMaster.length ; i<iLen ; i++ ) {
				aiOrig[ displayMaster[i] ] = i;
			}

			if ( formatters === aSort.length ) {
				displayMaster.sort( function ( a, b ) {
					var
						x, y, k, test, sort,
						len=aSort.length,
						dataA = aoData[a]._aSortData,
						dataB = aoData[b]._aSortData;

						for ( k=0 ; k<len ; k++ ) {
						sort = aSort[k];

							x = dataA[ sort.col ];
						y = dataB[ sort.col ];

							test = x<y ? -1 : x>y ? 1 : 0;
						if ( test !== 0 ) {
							return sort.dir === 'asc' ? test : -test;
						}
					}

						x = aiOrig[a];
					y = aiOrig[b];
					return x<y ? -1 : x>y ? 1 : 0;
				} );
			}
			else {
				displayMaster.sort( function ( a, b ) {
					var
						x, y, k, l, test, sort, fn,
						len=aSort.length,
						dataA = aoData[a]._aSortData,
						dataB = aoData[b]._aSortData;

						for ( k=0 ; k<len ; k++ ) {
						sort = aSort[k];

							x = dataA[ sort.col ];
						y = dataB[ sort.col ];

							fn = oExtSort[ sort.type+"-"+sort.dir ] || oExtSort[ "string-"+sort.dir ];
						test = fn( x, y );
						if ( test !== 0 ) {
							return test;
						}
					}

						x = aiOrig[a];
					y = aiOrig[b];
					return x<y ? -1 : x>y ? 1 : 0;
				} );
			}
		}

		oSettings.bSorted = true;
	}


			function _fnSortAria ( settings )
	{
		var label;
		var nextSort;
		var columns = settings.aoColumns;
		var aSort = _fnSortFlatten( settings );
		var oAria = settings.oLanguage.oAria;

		for ( var i=0, iLen=columns.length ; i<iLen ; i++ )
		{
			var col = columns[i];
			var asSorting = col.asSorting;
			var sTitle = col.sTitle.replace( /<.*?>/g, "" );
			var th = col.nTh;

			th.removeAttribute('aria-sort');

			if ( col.bSortable ) {
				if ( aSort.length > 0 && aSort[0].col == i ) {
					th.setAttribute('aria-sort', aSort[0].dir=="asc" ? "ascending" : "descending" );
					nextSort = asSorting[ aSort[0].index+1 ] || asSorting[0];
				}
				else {
					nextSort = asSorting[0];
				}

					label = sTitle + ( nextSort === "asc" ?
					oAria.sSortAscending :
					oAria.sSortDescending
				);
			}
			else {
				label = sTitle;
			}

				th.setAttribute('aria-label', label);
		}
	}


	function _fnSortListener ( settings, colIdx, append, callback )
	{
		var col = settings.aoColumns[ colIdx ];
		var sorting = settings.aaSorting;
		var asSorting = col.asSorting;
		var nextSortIdx;
		var next = function ( a, overflow ) {
			var idx = a._idx;
			if ( idx === undefined ) {
				idx = $.inArray( a[1], asSorting );
			}

				return idx+1 < asSorting.length ?
				idx+1 :
				overflow ?
					null :
					0;
		};

		if ( typeof sorting[0] === 'number' ) {
			sorting = settings.aaSorting = [ sorting ];
		}

		if ( append && settings.oFeatures.bSortMulti ) {
			var sortIdx = $.inArray( colIdx, _pluck(sorting, '0') );

				if ( sortIdx !== -1 ) {
				nextSortIdx = next( sorting[sortIdx], true );

					if ( nextSortIdx === null && sorting.length === 1 ) {
					nextSortIdx = 0; 
				}

					if ( nextSortIdx === null ) {
					sorting.splice( sortIdx, 1 );
				}
				else {
					sorting[sortIdx][1] = asSorting[ nextSortIdx ];
					sorting[sortIdx]._idx = nextSortIdx;
				}
			}
			else {
				sorting.push( [ colIdx, asSorting[0], 0 ] );
				sorting[sorting.length-1]._idx = 0;
			}
		}
		else if ( sorting.length && sorting[0][0] == colIdx ) {
			nextSortIdx = next( sorting[0] );

				sorting.length = 1;
			sorting[0][1] = asSorting[ nextSortIdx ];
			sorting[0]._idx = nextSortIdx;
		}
		else {
			sorting.length = 0;
			sorting.push( [ colIdx, asSorting[0] ] );
			sorting[0]._idx = 0;
		}

		_fnReDraw( settings );

		if ( typeof callback == 'function' ) {
			callback( settings );
		}
	}


	function _fnSortAttachListener ( settings, attachTo, colIdx, callback )
	{
		var col = settings.aoColumns[ colIdx ];

			_fnBindAction( attachTo, {}, function (e) {
			if ( col.bSortable === false ) {
				return;
			}

			if ( settings.oFeatures.bProcessing ) {
				_fnProcessingDisplay( settings, true );

					setTimeout( function() {
					_fnSortListener( settings, colIdx, e.shiftKey, callback );

					if ( _fnDataSource( settings ) !== 'ssp' ) {
						_fnProcessingDisplay( settings, false );
					}
				}, 0 );
			}
			else {
				_fnSortListener( settings, colIdx, e.shiftKey, callback );
			}
		} );
	}


	function _fnSortingClasses( settings )
	{
		var oldSort = settings.aLastSort;
		var sortClass = settings.oClasses.sSortColumn;
		var sort = _fnSortFlatten( settings );
		var features = settings.oFeatures;
		var i, ien, colIdx;

			if ( features.bSort && features.bSortClasses ) {
			for ( i=0, ien=oldSort.length ; i<ien ; i++ ) {
				colIdx = oldSort[i].src;

				$( _pluck( settings.aoData, 'anCells', colIdx ) )
					.removeClass( sortClass + (i<2 ? i+1 : 3) );
			}

			for ( i=0, ien=sort.length ; i<ien ; i++ ) {
				colIdx = sort[i].src;

					$( _pluck( settings.aoData, 'anCells', colIdx ) )
					.addClass( sortClass + (i<2 ? i+1 : 3) );
			}
		}

			settings.aLastSort = sort;
	}


	function _fnSortData( settings, idx )
	{
		var column = settings.aoColumns[ idx ];
		var customSort = DataTable.ext.order[ column.sSortDataType ];
		var customData;

			if ( customSort ) {
			customData = customSort.call( settings.oInstance, settings, idx,
				_fnColumnIndexToVisible( settings, idx )
			);
		}

		var row, cellData;
		var formatter = DataTable.ext.type.order[ column.sType+"-pre" ];

			for ( var i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
			row = settings.aoData[i];

				if ( ! row._aSortData ) {
				row._aSortData = [];
			}

				if ( ! row._aSortData[idx] || customSort ) {
				cellData = customSort ?
					customData[i] : 
					_fnGetCellData( settings, i, idx, 'sort' );

					row._aSortData[ idx ] = formatter ?
					formatter( cellData ) :
					cellData;
			}
		}
	}



	function _fnSaveState ( settings )
	{
		if ( !settings.oFeatures.bStateSave || settings.bDestroying )
		{
			return;
		}

		var state = {
			time:    +new Date(),
			start:   settings._iDisplayStart,
			length:  settings._iDisplayLength,
			order:   $.extend( true, [], settings.aaSorting ),
			search:  _fnSearchToCamel( settings.oPreviousSearch ),
			columns: $.map( settings.aoColumns, function ( col, i ) {
				return {
					visible: col.bVisible,
					search: _fnSearchToCamel( settings.aoPreSearchCols[i] )
				};
			} )
		};

			_fnCallbackFire( settings, "aoStateSaveParams", 'stateSaveParams', [settings, state] );

			settings.oSavedState = state;
		settings.fnStateSaveCallback.call( settings.oInstance, settings, state );
	}


	function _fnLoadState ( settings, oInit, callback )
	{
		var i, ien;
		var columns = settings.aoColumns;
		var loaded = function ( s ) {
			if ( ! s || ! s.time ) {
				callback();
				return;
			}

			var abStateLoad = _fnCallbackFire( settings, 'aoStateLoadParams', 'stateLoadParams', [settings, s] );
			if ( $.inArray( false, abStateLoad ) !== -1 ) {
				callback();
				return;
			}

			var duration = settings.iStateDuration;
			if ( duration > 0 && s.time < +new Date() - (duration*1000) ) {
				callback();
				return;
			}

			if ( s.columns && columns.length !== s.columns.length ) {
				callback();
				return;
			}

			settings.oLoadedState = $.extend( true, {}, s );

			if ( s.start !== undefined ) {
				settings._iDisplayStart    = s.start;
				settings.iInitDisplayStart = s.start;
			}
			if ( s.length !== undefined ) {
				settings._iDisplayLength   = s.length;
			}

			if ( s.order !== undefined ) {
				settings.aaSorting = [];
				$.each( s.order, function ( i, col ) {
					settings.aaSorting.push( col[0] >= columns.length ?
						[ 0, col[1] ] :
						col
					);
				} );
			}

			if ( s.search !== undefined ) {
				$.extend( settings.oPreviousSearch, _fnSearchToHung( s.search ) );
			}

			if ( s.columns ) {
				for ( i=0, ien=s.columns.length ; i<ien ; i++ ) {
					var col = s.columns[i];

					if ( col.visible !== undefined ) {
						columns[i].bVisible = col.visible;
					}

					if ( col.search !== undefined ) {
						$.extend( settings.aoPreSearchCols[i], _fnSearchToHung( col.search ) );
					}
				}
			}

				_fnCallbackFire( settings, 'aoStateLoaded', 'stateLoaded', [settings, s] );
			callback();
		};

			if ( ! settings.oFeatures.bStateSave ) {
			callback();
			return;
		}

			var state = settings.fnStateLoadCallback.call( settings.oInstance, settings, loaded );

			if ( state !== undefined ) {
			loaded( state );
		}
	}


	function _fnSettingsFromNode ( table )
	{
		var settings = DataTable.settings;
		var idx = $.inArray( table, _pluck( settings, 'nTable' ) );

			return idx !== -1 ?
			settings[ idx ] :
			null;
	}


	function _fnLog( settings, level, msg, tn )
	{
		msg = 'DataTables warning: '+
			(settings ? 'table id='+settings.sTableId+' - ' : '')+msg;

			if ( tn ) {
			msg += '. For more information about this error, please see '+
			'http://datatables.net/tn/'+tn;
		}

			if ( ! level  ) {
			var ext = DataTable.ext;
			var type = ext.sErrMode || ext.errMode;

				if ( settings ) {
				_fnCallbackFire( settings, null, 'error', [ settings, tn, msg ] );
			}

				if ( type == 'alert' ) {
				alert( msg );
			}
			else if ( type == 'throw' ) {
				throw new Error(msg);
			}
			else if ( typeof type == 'function' ) {
				type( settings, tn, msg );
			}
		}
		else if ( window.console && console.log ) {
			console.log( msg );
		}
	}


	function _fnMap( ret, src, name, mappedName )
	{
		if ( Array.isArray( name ) ) {
			$.each( name, function (i, val) {
				if ( Array.isArray( val ) ) {
					_fnMap( ret, src, val[0], val[1] );
				}
				else {
					_fnMap( ret, src, val );
				}
			} );

				return;
		}

			if ( mappedName === undefined ) {
			mappedName = name;
		}

			if ( src[name] !== undefined ) {
			ret[mappedName] = src[name];
		}
	}


	function _fnExtend( out, extender, breakRefs )
	{
		var val;

			for ( var prop in extender ) {
			if ( extender.hasOwnProperty(prop) ) {
				val = extender[prop];

					if ( $.isPlainObject( val ) ) {
					if ( ! $.isPlainObject( out[prop] ) ) {
						out[prop] = {};
					}
					$.extend( true, out[prop], val );
				}
				else if ( breakRefs && prop !== 'data' && prop !== 'aaData' && Array.isArray(val) ) {
					out[prop] = val.slice();
				}
				else {
					out[prop] = val;
				}
			}
		}

			return out;
	}


	function _fnBindAction( n, oData, fn )
	{
		$(n)
			.on( 'click.DT', oData, function (e) {
					$(n).trigger('blur'); 
					fn(e);
				} )
			.on( 'keypress.DT', oData, function (e){
					if ( e.which === 13 ) {
						e.preventDefault();
						fn(e);
					}
				} )
			.on( 'selectstart.DT', function () {
					return false;
				} );
	}


	function _fnCallbackReg( oSettings, sStore, fn, sName )
	{
		if ( fn )
		{
			oSettings[sStore].push( {
				"fn": fn,
				"sName": sName
			} );
		}
	}


	function _fnCallbackFire( settings, callbackArr, eventName, args )
	{
		var ret = [];

			if ( callbackArr ) {
			ret = $.map( settings[callbackArr].slice().reverse(), function (val, i) {
				return val.fn.apply( settings.oInstance, args );
			} );
		}

			if ( eventName !== null ) {
			var e = $.Event( eventName+'.dt' );

				$(settings.nTable).trigger( e, args );

				ret.push( e.result );
		}

			return ret;
	}


			function _fnLengthOverflow ( settings )
	{
		var
			start = settings._iDisplayStart,
			end = settings.fnDisplayEnd(),
			len = settings._iDisplayLength;

		if ( start >= end )
		{
			start = end - len;
		}

		start -= (start % len);

			if ( len === -1 || start < 0 )
		{
			start = 0;
		}

			settings._iDisplayStart = start;
	}


			function _fnRenderer( settings, type )
	{
		var renderer = settings.renderer;
		var host = DataTable.ext.renderer[type];

			if ( $.isPlainObject( renderer ) && renderer[type] ) {
			return host[renderer[type]] || host._;
		}
		else if ( typeof renderer === 'string' ) {
			return host[renderer] || host._;
		}

		return host._;
	}


	function _fnDataSource ( settings )
	{
		if ( settings.oFeatures.bServerSide ) {
			return 'ssp';
		}
		else if ( settings.ajax || settings.sAjaxSource ) {
			return 'ajax';
		}
		return 'dom';
	}




	var __apiStruct = [];


	var __arrayProto = Array.prototype;


	var _toSettings = function ( mixed )
	{
		var idx, jq;
		var settings = DataTable.settings;
		var tables = $.map( settings, function (el, i) {
			return el.nTable;
		} );

			if ( ! mixed ) {
			return [];
		}
		else if ( mixed.nTable && mixed.oApi ) {
			return [ mixed ];
		}
		else if ( mixed.nodeName && mixed.nodeName.toLowerCase() === 'table' ) {
			idx = $.inArray( mixed, tables );
			return idx !== -1 ? [ settings[idx] ] : null;
		}
		else if ( mixed && typeof mixed.settings === 'function' ) {
			return mixed.settings().toArray();
		}
		else if ( typeof mixed === 'string' ) {
			jq = $(mixed);
		}
		else if ( mixed instanceof $ ) {
			jq = mixed;
		}

			if ( jq ) {
			return jq.map( function(i) {
				idx = $.inArray( this, tables );
				return idx !== -1 ? settings[idx] : null;
			} ).toArray();
		}
	};


	_Api = function ( context, data )
	{
		if ( ! (this instanceof _Api) ) {
			return new _Api( context, data );
		}

			var settings = [];
		var ctxSettings = function ( o ) {
			var a = _toSettings( o );
			if ( a ) {
				settings.push.apply( settings, a );
			}
		};

			if ( Array.isArray( context ) ) {
			for ( var i=0, ien=context.length ; i<ien ; i++ ) {
				ctxSettings( context[i] );
			}
		}
		else {
			ctxSettings( context );
		}

		this.context = _unique( settings );

		if ( data ) {
			$.merge( this, data );
		}

		this.selector = {
			rows: null,
			cols: null,
			opts: null
		};

			_Api.extend( this, this, __apiStruct );
	};

		DataTable.Api = _Api;

	$.extend( _Api.prototype, {
		any: function ()
		{
			return this.count() !== 0;
		},


				concat:  __arrayProto.concat,


				context: [], 


				count: function ()
		{
			return this.flatten().length;
		},


				each: function ( fn )
		{
			for ( var i=0, ien=this.length ; i<ien; i++ ) {
				fn.call( this, this[i], i, this );
			}

				return this;
		},


				eq: function ( idx )
		{
			var ctx = this.context;

				return ctx.length > idx ?
				new _Api( ctx[idx], this[idx] ) :
				null;
		},


				filter: function ( fn )
		{
			var a = [];

				if ( __arrayProto.filter ) {
				a = __arrayProto.filter.call( this, fn, this );
			}
			else {
				for ( var i=0, ien=this.length ; i<ien ; i++ ) {
					if ( fn.call( this, this[i], i, this ) ) {
						a.push( this[i] );
					}
				}
			}

				return new _Api( this.context, a );
		},


				flatten: function ()
		{
			var a = [];
			return new _Api( this.context, a.concat.apply( a, this.toArray() ) );
		},


				join:    __arrayProto.join,


				indexOf: __arrayProto.indexOf || function (obj, start)
		{
			for ( var i=(start || 0), ien=this.length ; i<ien ; i++ ) {
				if ( this[i] === obj ) {
					return i;
				}
			}
			return -1;
		},

			iterator: function ( flatten, type, fn, alwaysNew ) {
			var
				a = [], ret,
				i, ien, j, jen,
				context = this.context,
				rows, items, item,
				selector = this.selector;

			if ( typeof flatten === 'string' ) {
				alwaysNew = fn;
				fn = type;
				type = flatten;
				flatten = false;
			}

				for ( i=0, ien=context.length ; i<ien ; i++ ) {
				var apiInst = new _Api( context[i] );

					if ( type === 'table' ) {
					ret = fn.call( apiInst, context[i], i );

						if ( ret !== undefined ) {
						a.push( ret );
					}
				}
				else if ( type === 'columns' || type === 'rows' ) {
					ret = fn.call( apiInst, context[i], this[i], i );

						if ( ret !== undefined ) {
						a.push( ret );
					}
				}
				else if ( type === 'column' || type === 'column-rows' || type === 'row' || type === 'cell' ) {
					items = this[i];

						if ( type === 'column-rows' ) {
						rows = _selector_row_indexes( context[i], selector.opts );
					}

						for ( j=0, jen=items.length ; j<jen ; j++ ) {
						item = items[j];

							if ( type === 'cell' ) {
							ret = fn.call( apiInst, context[i], item.row, item.column, i, j );
						}
						else {
							ret = fn.call( apiInst, context[i], item, i, j, rows );
						}

							if ( ret !== undefined ) {
							a.push( ret );
						}
					}
				}
			}

				if ( a.length || alwaysNew ) {
				var api = new _Api( context, flatten ? a.concat.apply( [], a ) : a );
				var apiSelector = api.selector;
				apiSelector.rows = selector.rows;
				apiSelector.cols = selector.cols;
				apiSelector.opts = selector.opts;
				return api;
			}
			return this;
		},


				lastIndexOf: __arrayProto.lastIndexOf || function (obj, start)
		{
			return this.indexOf.apply( this.toArray.reverse(), arguments );
		},


				length:  0,


				map: function ( fn )
		{
			var a = [];

				if ( __arrayProto.map ) {
				a = __arrayProto.map.call( this, fn, this );
			}
			else {
				for ( var i=0, ien=this.length ; i<ien ; i++ ) {
					a.push( fn.call( this, this[i], i ) );
				}
			}

				return new _Api( this.context, a );
		},


				pluck: function ( prop )
		{
			return this.map( function ( el ) {
				return el[ prop ];
			} );
		},

			pop:     __arrayProto.pop,


				push:    __arrayProto.push,


		reduce: __arrayProto.reduce || function ( fn, init )
		{
			return _fnReduce( this, fn, init, 0, this.length, 1 );
		},


				reduceRight: __arrayProto.reduceRight || function ( fn, init )
		{
			return _fnReduce( this, fn, init, this.length-1, -1, -1 );
		},


				reverse: __arrayProto.reverse,


		selector: null,


				shift:   __arrayProto.shift,


				slice: function () {
			return new _Api( this.context, this );
		},


				sort:    __arrayProto.sort, 


				splice:  __arrayProto.splice,


				toArray: function ()
		{
			return __arrayProto.slice.call( this );
		},


				to$: function ()
		{
			return $( this );
		},


				toJQuery: function ()
		{
			return $( this );
		},


				unique: function ()
		{
			return new _Api( this.context, _unique(this) );
		},


				unshift: __arrayProto.unshift
	} );


			_Api.extend = function ( scope, obj, ext )
	{
		if ( ! ext.length || ! obj || ( ! (obj instanceof _Api) && ! obj.__dt_wrapper ) ) {
			return;
		}

			var
			i, ien,
			struct,
			methodScoping = function ( scope, fn, struc ) {
				return function () {
					var ret = fn.apply( scope, arguments );

					_Api.extend( ret, ret, struc.methodExt );
					return ret;
				};
			};

			for ( i=0, ien=ext.length ; i<ien ; i++ ) {
			struct = ext[i];

			obj[ struct.name ] = struct.type === 'function' ?
				methodScoping( scope, struct.val, struct ) :
				struct.type === 'object' ?
					{} :
					struct.val;

				obj[ struct.name ].__dt_wrapper = true;

			_Api.extend( scope, obj[ struct.name ], struct.propExt );
		}
	};






		_Api.register = _api_register = function ( name, val )
	{
		if ( Array.isArray( name ) ) {
			for ( var j=0, jen=name.length ; j<jen ; j++ ) {
				_Api.register( name[j], val );
			}
			return;
		}

			var
			i, ien,
			heir = name.split('.'),
			struct = __apiStruct,
			key, method;

			var find = function ( src, name ) {
			for ( var i=0, ien=src.length ; i<ien ; i++ ) {
				if ( src[i].name === name ) {
					return src[i];
				}
			}
			return null;
		};

			for ( i=0, ien=heir.length ; i<ien ; i++ ) {
			method = heir[i].indexOf('()') !== -1;
			key = method ?
				heir[i].replace('()', '') :
				heir[i];

				var src = find( struct, key );
			if ( ! src ) {
				src = {
					name:      key,
					val:       {},
					methodExt: [],
					propExt:   [],
					type:      'object'
				};
				struct.push( src );
			}

				if ( i === ien-1 ) {
				src.val = val;
				src.type = typeof val === 'function' ?
					'function' :
					$.isPlainObject( val ) ?
						'object' :
						'other';
			}
			else {
				struct = method ?
					src.methodExt :
					src.propExt;
			}
		}
	};

		_Api.registerPlural = _api_registerPlural = function ( pluralName, singularName, val ) {
		_Api.register( pluralName, val );

			_Api.register( singularName, function () {
			var ret = val.apply( this, arguments );

				if ( ret === this ) {
				return this;
			}
			else if ( ret instanceof _Api ) {
				return ret.length ?
					Array.isArray( ret[0] ) ?
						new _Api( ret.context, ret[0] ) : 
						ret[0] :
					undefined;
			}

			return ret;
		} );
	};


	var __table_selector = function ( selector, a )
	{
		if ( Array.isArray(selector) ) {
			return $.map( selector, function (item) {
				return __table_selector(item, a);
			} );
		}

		if ( typeof selector === 'number' ) {
			return [ a[ selector ] ];
		}

		var nodes = $.map( a, function (el, i) {
			return el.nTable;
		} );

			return $(nodes)
			.filter( selector )
			.map( function (i) {
				var idx = $.inArray( this, nodes );
				return a[ idx ];
			} )
			.toArray();
	};



	_api_register( 'tables()', function ( selector ) {
		return selector !== undefined && selector !== null ?
			new _Api( __table_selector( selector, this.context ) ) :
			this;
	} );


			_api_register( 'table()', function ( selector ) {
		var tables = this.tables( selector );
		var ctx = tables.context;

		return ctx.length ?
			new _Api( ctx[0] ) :
			tables;
	} );


			_api_registerPlural( 'tables().nodes()', 'table().node()' , function () {
		return this.iterator( 'table', function ( ctx ) {
			return ctx.nTable;
		}, 1 );
	} );


			_api_registerPlural( 'tables().body()', 'table().body()' , function () {
		return this.iterator( 'table', function ( ctx ) {
			return ctx.nTBody;
		}, 1 );
	} );


			_api_registerPlural( 'tables().header()', 'table().header()' , function () {
		return this.iterator( 'table', function ( ctx ) {
			return ctx.nTHead;
		}, 1 );
	} );


			_api_registerPlural( 'tables().footer()', 'table().footer()' , function () {
		return this.iterator( 'table', function ( ctx ) {
			return ctx.nTFoot;
		}, 1 );
	} );


			_api_registerPlural( 'tables().containers()', 'table().container()' , function () {
		return this.iterator( 'table', function ( ctx ) {
			return ctx.nTableWrapper;
		}, 1 );
	} );



	_api_register( 'draw()', function ( paging ) {
		return this.iterator( 'table', function ( settings ) {
			if ( paging === 'page' ) {
				_fnDraw( settings );
			}
			else {
				if ( typeof paging === 'string' ) {
					paging = paging === 'full-hold' ?
						false :
						true;
				}

					_fnReDraw( settings, paging===false );
			}
		} );
	} );



	_api_register( 'page()', function ( action ) {
		if ( action === undefined ) {
			return this.page.info().page; 
		}

		return this.iterator( 'table', function ( settings ) {
			_fnPageChange( settings, action );
		} );
	} );


	_api_register( 'page.info()', function ( action ) {
		if ( this.context.length === 0 ) {
			return undefined;
		}

			var
			settings   = this.context[0],
			start      = settings._iDisplayStart,
			len        = settings.oFeatures.bPaginate ? settings._iDisplayLength : -1,
			visRecords = settings.fnRecordsDisplay(),
			all        = len === -1;

			return {
			"page":           all ? 0 : Math.floor( start / len ),
			"pages":          all ? 1 : Math.ceil( visRecords / len ),
			"start":          start,
			"end":            settings.fnDisplayEnd(),
			"length":         len,
			"recordsTotal":   settings.fnRecordsTotal(),
			"recordsDisplay": visRecords,
			"serverSide":     _fnDataSource( settings ) === 'ssp'
		};
	} );


	_api_register( 'page.len()', function ( len ) {
		if ( len === undefined ) {
			return this.context.length !== 0 ?
				this.context[0]._iDisplayLength :
				undefined;
		}

		return this.iterator( 'table', function ( settings ) {
			_fnLengthChange( settings, len );
		} );
	} );



				var __reload = function ( settings, holdPosition, callback ) {
		if ( callback ) {
			var api = new _Api( settings );

				api.one( 'draw', function () {
				callback( api.ajax.json() );
			} );
		}

			if ( _fnDataSource( settings ) == 'ssp' ) {
			_fnReDraw( settings, holdPosition );
		}
		else {
			_fnProcessingDisplay( settings, true );

			var xhr = settings.jqXHR;
			if ( xhr && xhr.readyState !== 4 ) {
				xhr.abort();
			}

			_fnBuildAjax( settings, [], function( json ) {
				_fnClearTable( settings );

					var data = _fnAjaxDataSrc( settings, json );
				for ( var i=0, ien=data.length ; i<ien ; i++ ) {
					_fnAddData( settings, data[i] );
				}

					_fnReDraw( settings, holdPosition );
				_fnProcessingDisplay( settings, false );
			} );
		}
	};


	_api_register( 'ajax.json()', function () {
		var ctx = this.context;

			if ( ctx.length > 0 ) {
			return ctx[0].json;
		}

	} );


	_api_register( 'ajax.params()', function () {
		var ctx = this.context;

			if ( ctx.length > 0 ) {
			return ctx[0].oAjaxData;
		}

	} );


	_api_register( 'ajax.reload()', function ( callback, resetPaging ) {
		return this.iterator( 'table', function (settings) {
			__reload( settings, resetPaging===false, callback );
		} );
	} );


	_api_register( 'ajax.url()', function ( url ) {
		var ctx = this.context;

			if ( url === undefined ) {
			if ( ctx.length === 0 ) {
				return undefined;
			}
			ctx = ctx[0];

				return ctx.ajax ?
				$.isPlainObject( ctx.ajax ) ?
					ctx.ajax.url :
					ctx.ajax :
				ctx.sAjaxSource;
		}

		return this.iterator( 'table', function ( settings ) {
			if ( $.isPlainObject( settings.ajax ) ) {
				settings.ajax.url = url;
			}
			else {
				settings.ajax = url;
			}
		} );
	} );


	_api_register( 'ajax.url().load()', function ( callback, resetPaging ) {
		return this.iterator( 'table', function ( ctx ) {
			__reload( ctx, resetPaging===false, callback );
		} );
	} );




					var _selector_run = function ( type, selector, selectFn, settings, opts )
	{
		var
			out = [], res,
			a, i, ien, j, jen,
			selectorType = typeof selector;

		if ( ! selector || selectorType === 'string' || selectorType === 'function' || selector.length === undefined ) {
			selector = [ selector ];
		}

			for ( i=0, ien=selector.length ; i<ien ; i++ ) {
			a = selector[i] && selector[i].split && ! selector[i].match(/[\[\(:]/) ?
				selector[i].split(',') :
				[ selector[i] ];

				for ( j=0, jen=a.length ; j<jen ; j++ ) {
				res = selectFn( typeof a[j] === 'string' ? (a[j]).trim() : a[j] );

					if ( res && res.length ) {
					out = out.concat( res );
				}
			}
		}

		var ext = _ext.selector[ type ];
		if ( ext.length ) {
			for ( i=0, ien=ext.length ; i<ien ; i++ ) {
				out = ext[i]( settings, opts, out );
			}
		}

			return _unique( out );
	};


			var _selector_opts = function ( opts )
	{
		if ( ! opts ) {
			opts = {};
		}

		if ( opts.filter && opts.search === undefined ) {
			opts.search = opts.filter;
		}

			return $.extend( {
			search: 'none',
			order: 'current',
			page: 'all'
		}, opts );
	};


			var _selector_first = function ( inst )
	{
		for ( var i=0, ien=inst.length ; i<ien ; i++ ) {
			if ( inst[i].length > 0 ) {
				inst[0] = inst[i];
				inst[0].length = 1;
				inst.length = 1;
				inst.context = [ inst.context[i] ];

					return inst;
			}
		}

		inst.length = 0;
		return inst;
	};


			var _selector_row_indexes = function ( settings, opts )
	{
		var
			i, ien, tmp, a=[],
			displayFiltered = settings.aiDisplay,
			displayMaster = settings.aiDisplayMaster;

			var
			search = opts.search,  
			order  = opts.order,   
			page   = opts.page;    

			if ( _fnDataSource( settings ) == 'ssp' ) {
			return search === 'removed' ?
				[] :
				_range( 0, displayMaster.length );
		}
		else if ( page == 'current' ) {
			for ( i=settings._iDisplayStart, ien=settings.fnDisplayEnd() ; i<ien ; i++ ) {
				a.push( displayFiltered[i] );
			}
		}
		else if ( order == 'current' || order == 'applied' ) {
			if ( search == 'none') {
				a = displayMaster.slice();
			}
			else if ( search == 'applied' ) {
				a = displayFiltered.slice();
			}
			else if ( search == 'removed' ) {
				var displayFilteredMap = {};

					for ( var i=0, ien=displayFiltered.length ; i<ien ; i++ ) {
					displayFilteredMap[displayFiltered[i]] = null;
				}

					a = $.map( displayMaster, function (el) {
					return ! displayFilteredMap.hasOwnProperty(el) ?
						el :
						null;
				} );
			}
		}
		else if ( order == 'index' || order == 'original' ) {
			for ( i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
				if ( search == 'none' ) {
					a.push( i );
				}
				else { 
					tmp = $.inArray( i, displayFiltered );

						if ((tmp === -1 && search == 'removed') ||
						(tmp >= 0   && search == 'applied') )
					{
						a.push( i );
					}
				}
			}
		}

			return a;
	};


	var __row_selector = function ( settings, selector, opts )
	{
		var rows;
		var run = function ( sel ) {
			var selInt = _intVal( sel );
			var i, ien;
			var aoData = settings.aoData;

			if ( selInt !== null && ! opts ) {
				return [ selInt ];
			}

				if ( ! rows ) {
				rows = _selector_row_indexes( settings, opts );
			}

				if ( selInt !== null && $.inArray( selInt, rows ) !== -1 ) {
				return [ selInt ];
			}
			else if ( sel === null || sel === undefined || sel === '' ) {
				return rows;
			}

			if ( typeof sel === 'function' ) {
				return $.map( rows, function (idx) {
					var row = aoData[ idx ];
					return sel( idx, row._aData, row.nTr ) ? idx : null;
				} );
			}

			if ( sel.nodeName ) {
				var rowIdx = sel._DT_RowIndex;  
				var cellIdx = sel._DT_CellIndex;

					if ( rowIdx !== undefined ) {
					return aoData[ rowIdx ] && aoData[ rowIdx ].nTr === sel ?
						[ rowIdx ] :
						[];
				}
				else if ( cellIdx ) {
					return aoData[ cellIdx.row ] && aoData[ cellIdx.row ].nTr === sel.parentNode ?
						[ cellIdx.row ] :
						[];
				}
				else {
					var host = $(sel).closest('*[data-dt-row]');
					return host.length ?
						[ host.data('dt-row') ] :
						[];
				}
			}

			if ( typeof sel === 'string' && sel.charAt(0) === '#' ) {
				var rowObj = settings.aIds[ sel.replace( /^#/, '' ) ];
				if ( rowObj !== undefined ) {
					return [ rowObj.idx ];
				}

			}

			var nodes = _removeEmpty(
				_pluck_order( settings.aoData, rows, 'nTr' )
			);

			return $(nodes)
				.filter( sel )
				.map( function () {
					return this._DT_RowIndex;
				} )
				.toArray();
		};

			return _selector_run( 'row', selector, run, settings, opts );
	};


			_api_register( 'rows()', function ( selector, opts ) {
		if ( selector === undefined ) {
			selector = '';
		}
		else if ( $.isPlainObject( selector ) ) {
			opts = selector;
			selector = '';
		}

			opts = _selector_opts( opts );

			var inst = this.iterator( 'table', function ( settings ) {
			return __row_selector( settings, selector, opts );
		}, 1 );

		inst.selector.rows = selector;
		inst.selector.opts = opts;

			return inst;
	} );

		_api_register( 'rows().nodes()', function () {
		return this.iterator( 'row', function ( settings, row ) {
			return settings.aoData[ row ].nTr || undefined;
		}, 1 );
	} );

		_api_register( 'rows().data()', function () {
		return this.iterator( true, 'rows', function ( settings, rows ) {
			return _pluck_order( settings.aoData, rows, '_aData' );
		}, 1 );
	} );

		_api_registerPlural( 'rows().cache()', 'row().cache()', function ( type ) {
		return this.iterator( 'row', function ( settings, row ) {
			var r = settings.aoData[ row ];
			return type === 'search' ? r._aFilterData : r._aSortData;
		}, 1 );
	} );

		_api_registerPlural( 'rows().invalidate()', 'row().invalidate()', function ( src ) {
		return this.iterator( 'row', function ( settings, row ) {
			_fnInvalidate( settings, row, src );
		} );
	} );

		_api_registerPlural( 'rows().indexes()', 'row().index()', function () {
		return this.iterator( 'row', function ( settings, row ) {
			return row;
		}, 1 );
	} );

		_api_registerPlural( 'rows().ids()', 'row().id()', function ( hash ) {
		var a = [];
		var context = this.context;

		for ( var i=0, ien=context.length ; i<ien ; i++ ) {
			for ( var j=0, jen=this[i].length ; j<jen ; j++ ) {
				var id = context[i].rowIdFn( context[i].aoData[ this[i][j] ]._aData );
				a.push( (hash === true ? '#' : '' )+ id );
			}
		}

			return new _Api( context, a );
	} );

		_api_registerPlural( 'rows().remove()', 'row().remove()', function () {
		var that = this;

			this.iterator( 'row', function ( settings, row, thatIdx ) {
			var data = settings.aoData;
			var rowData = data[ row ];
			var i, ien, j, jen;
			var loopRow, loopCells;

				data.splice( row, 1 );

			for ( i=0, ien=data.length ; i<ien ; i++ ) {
				loopRow = data[i];
				loopCells = loopRow.anCells;

				if ( loopRow.nTr !== null ) {
					loopRow.nTr._DT_RowIndex = i;
				}

				if ( loopCells !== null ) {
					for ( j=0, jen=loopCells.length ; j<jen ; j++ ) {
						loopCells[j]._DT_CellIndex.row = i;
					}
				}
			}

			_fnDeleteIndex( settings.aiDisplayMaster, row );
			_fnDeleteIndex( settings.aiDisplay, row );
			_fnDeleteIndex( that[ thatIdx ], row, false ); 

			if ( settings._iRecordsDisplay > 0 ) {
				settings._iRecordsDisplay--;
			}

			_fnLengthOverflow( settings );

			var id = settings.rowIdFn( rowData._aData );
			if ( id !== undefined ) {
				delete settings.aIds[ id ];
			}
		} );

			this.iterator( 'table', function ( settings ) {
			for ( var i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
				settings.aoData[i].idx = i;
			}
		} );

			return this;
	} );


			_api_register( 'rows.add()', function ( rows ) {
		var newRows = this.iterator( 'table', function ( settings ) {
				var row, i, ien;
				var out = [];

					for ( i=0, ien=rows.length ; i<ien ; i++ ) {
					row = rows[i];

						if ( row.nodeName && row.nodeName.toUpperCase() === 'TR' ) {
						out.push( _fnAddTr( settings, row )[0] );
					}
					else {
						out.push( _fnAddData( settings, row ) );
					}
				}

					return out;
			}, 1 );

		var modRows = this.rows( -1 );
		modRows.pop();
		$.merge( modRows, newRows );

			return modRows;
	} );





	_api_register( 'row()', function ( selector, opts ) {
		return _selector_first( this.rows( selector, opts ) );
	} );


			_api_register( 'row().data()', function ( data ) {
		var ctx = this.context;

			if ( data === undefined ) {
			return ctx.length && this.length ?
				ctx[0].aoData[ this[0] ]._aData :
				undefined;
		}

		var row = ctx[0].aoData[ this[0] ];
		row._aData = data;

		if ( Array.isArray( data ) && row.nTr && row.nTr.id ) {
			_fnSetObjectDataFn( ctx[0].rowId )( data, row.nTr.id );
		}

		_fnInvalidate( ctx[0], this[0], 'data' );

			return this;
	} );


			_api_register( 'row().node()', function () {
		var ctx = this.context;

			return ctx.length && this.length ?
			ctx[0].aoData[ this[0] ].nTr || null :
			null;
	} );


			_api_register( 'row.add()', function ( row ) {
		if ( row instanceof $ && row.length ) {
			row = row[0];
		}

			var rows = this.iterator( 'table', function ( settings ) {
			if ( row.nodeName && row.nodeName.toUpperCase() === 'TR' ) {
				return _fnAddTr( settings, row )[0];
			}
			return _fnAddData( settings, row );
		} );

		return this.row( rows[0] );
	} );



				var __details_add = function ( ctx, row, data, klass )
	{
		var rows = [];
		var addRow = function ( r, k ) {
			if ( Array.isArray( r ) || r instanceof $ ) {
				for ( var i=0, ien=r.length ; i<ien ; i++ ) {
					addRow( r[i], k );
				}
				return;
			}

			if ( r.nodeName && r.nodeName.toLowerCase() === 'tr' ) {
				rows.push( r );
			}
			else {
				var created = $('<tr><td></td></tr>').addClass( k );
				$('td', created)
					.addClass( k )
					.html( r )
					[0].colSpan = _fnVisbleColumns( ctx );

					rows.push( created[0] );
			}
		};

			addRow( data, klass );

			if ( row._details ) {
			row._details.detach();
		}

			row._details = $(rows);

		if ( row._detailsShow ) {
			row._details.insertAfter( row.nTr );
		}
	};


			var __details_remove = function ( api, idx )
	{
		var ctx = api.context;

			if ( ctx.length ) {
			var row = ctx[0].aoData[ idx !== undefined ? idx : api[0] ];

				if ( row && row._details ) {
				row._details.remove();

					row._detailsShow = undefined;
				row._details = undefined;
			}
		}
	};


			var __details_display = function ( api, show ) {
		var ctx = api.context;

			if ( ctx.length && api.length ) {
			var row = ctx[0].aoData[ api[0] ];

				if ( row._details ) {
				row._detailsShow = show;

					if ( show ) {
					row._details.insertAfter( row.nTr );
				}
				else {
					row._details.detach();
				}

					__details_events( ctx[0] );
			}
		}
	};


			var __details_events = function ( settings )
	{
		var api = new _Api( settings );
		var namespace = '.dt.DT_details';
		var drawEvent = 'draw'+namespace;
		var colvisEvent = 'column-visibility'+namespace;
		var destroyEvent = 'destroy'+namespace;
		var data = settings.aoData;

			api.off( drawEvent +' '+ colvisEvent +' '+ destroyEvent );

			if ( _pluck( data, '_details' ).length > 0 ) {
			api.on( drawEvent, function ( e, ctx ) {
				if ( settings !== ctx ) {
					return;
				}

					api.rows( {page:'current'} ).eq(0).each( function (idx) {
					var row = data[ idx ];

						if ( row._detailsShow ) {
						row._details.insertAfter( row.nTr );
					}
				} );
			} );

			api.on( colvisEvent, function ( e, ctx, idx, vis ) {
				if ( settings !== ctx ) {
					return;
				}

				var row, visible = _fnVisbleColumns( ctx );

					for ( var i=0, ien=data.length ; i<ien ; i++ ) {
					row = data[i];

						if ( row._details ) {
						row._details.children('td[colspan]').attr('colspan', visible );
					}
				}
			} );

			api.on( destroyEvent, function ( e, ctx ) {
				if ( settings !== ctx ) {
					return;
				}

					for ( var i=0, ien=data.length ; i<ien ; i++ ) {
					if ( data[i]._details ) {
						__details_remove( api, i );
					}
				}
			} );
		}
	};

	var _emp = '';
	var _child_obj = _emp+'row().child';
	var _child_mth = _child_obj+'()';

	_api_register( _child_mth, function ( data, klass ) {
		var ctx = this.context;

			if ( data === undefined ) {
			return ctx.length && this.length ?
				ctx[0].aoData[ this[0] ]._details :
				undefined;
		}
		else if ( data === true ) {
			this.child.show();
		}
		else if ( data === false ) {
			__details_remove( this );
		}
		else if ( ctx.length && this.length ) {
			__details_add( ctx[0], ctx[0].aoData[ this[0] ], data, klass );
		}

			return this;
	} );


			_api_register( [
		_child_obj+'.show()',
		_child_mth+'.show()' 
	], function ( show ) {   
		__details_display( this, true );
		return this;
	} );


			_api_register( [
		_child_obj+'.hide()',
		_child_mth+'.hide()' 
	], function () {         
		__details_display( this, false );
		return this;
	} );


			_api_register( [
		_child_obj+'.remove()',
		_child_mth+'.remove()' 
	], function () {           
		__details_remove( this );
		return this;
	} );


			_api_register( _child_obj+'.isShown()', function () {
		var ctx = this.context;

			if ( ctx.length && this.length ) {
			return ctx[0].aoData[ this[0] ]._detailsShow || false;
		}
		return false;
	} );





		var __re_column_selector = /^([^:]+):(name|visIdx|visible)$/;


	var __columnData = function ( settings, column, r1, r2, rows ) {
		var a = [];
		for ( var row=0, ien=rows.length ; row<ien ; row++ ) {
			a.push( _fnGetCellData( settings, rows[row], column ) );
		}
		return a;
	};


			var __column_selector = function ( settings, selector, opts )
	{
		var
			columns = settings.aoColumns,
			names = _pluck( columns, 'sName' ),
			nodes = _pluck( columns, 'nTh' );

			var run = function ( s ) {
			var selInt = _intVal( s );

			if ( s === '' ) {
				return _range( columns.length );
			}

			if ( selInt !== null ) {
				return [ selInt >= 0 ?
					selInt : 
					columns.length + selInt 
				];
			}

			if ( typeof s === 'function' ) {
				var rows = _selector_row_indexes( settings, opts );

					return $.map( columns, function (col, idx) {
					return s(
							idx,
							__columnData( settings, idx, 0, 0, rows ),
							nodes[ idx ]
						) ? idx : null;
				} );
			}

			var match = typeof s === 'string' ?
				s.match( __re_column_selector ) :
				'';

				if ( match ) {
				switch( match[2] ) {
					case 'visIdx':
					case 'visible':
						var idx = parseInt( match[1], 10 );
						if ( idx < 0 ) {
							var visColumns = $.map( columns, function (col,i) {
								return col.bVisible ? i : null;
							} );
							return [ visColumns[ visColumns.length + idx ] ];
						}
						return [ _fnVisibleToColumnIndex( settings, idx ) ];

						case 'name':
						return $.map( names, function (name, i) {
							return name === match[1] ? i : null;
						} );

						default:
						return [];
				}
			}

			if ( s.nodeName && s._DT_CellIndex ) {
				return [ s._DT_CellIndex.column ];
			}

			var jqResult = $( nodes )
				.filter( s )
				.map( function () {
					return $.inArray( this, nodes ); 
				} )
				.toArray();

				if ( jqResult.length || ! s.nodeName ) {
				return jqResult;
			}

			var host = $(s).closest('*[data-dt-column]');
			return host.length ?
				[ host.data('dt-column') ] :
				[];
		};

			return _selector_run( 'column', selector, run, settings, opts );
	};


			var __setColumnVis = function ( settings, column, vis ) {
		var
			cols = settings.aoColumns,
			col  = cols[ column ],
			data = settings.aoData,
			row, cells, i, ien, tr;

		if ( vis === undefined ) {
			return col.bVisible;
		}

		if ( col.bVisible === vis ) {
			return;
		}

			if ( vis ) {
			var insertBefore = $.inArray( true, _pluck(cols, 'bVisible'), column+1 );

				for ( i=0, ien=data.length ; i<ien ; i++ ) {
				tr = data[i].nTr;
				cells = data[i].anCells;

					if ( tr ) {
					tr.insertBefore( cells[ column ], cells[ insertBefore ] || null );
				}
			}
		}
		else {
			$( _pluck( settings.aoData, 'anCells', column ) ).detach();
		}

		col.bVisible = vis;
	};


			_api_register( 'columns()', function ( selector, opts ) {
		if ( selector === undefined ) {
			selector = '';
		}
		else if ( $.isPlainObject( selector ) ) {
			opts = selector;
			selector = '';
		}

			opts = _selector_opts( opts );

			var inst = this.iterator( 'table', function ( settings ) {
			return __column_selector( settings, selector, opts );
		}, 1 );

		inst.selector.cols = selector;
		inst.selector.opts = opts;

			return inst;
	} );

		_api_registerPlural( 'columns().header()', 'column().header()', function ( selector, opts ) {
		return this.iterator( 'column', function ( settings, column ) {
			return settings.aoColumns[column].nTh;
		}, 1 );
	} );

		_api_registerPlural( 'columns().footer()', 'column().footer()', function ( selector, opts ) {
		return this.iterator( 'column', function ( settings, column ) {
			return settings.aoColumns[column].nTf;
		}, 1 );
	} );

		_api_registerPlural( 'columns().data()', 'column().data()', function () {
		return this.iterator( 'column-rows', __columnData, 1 );
	} );

		_api_registerPlural( 'columns().dataSrc()', 'column().dataSrc()', function () {
		return this.iterator( 'column', function ( settings, column ) {
			return settings.aoColumns[column].mData;
		}, 1 );
	} );

		_api_registerPlural( 'columns().cache()', 'column().cache()', function ( type ) {
		return this.iterator( 'column-rows', function ( settings, column, i, j, rows ) {
			return _pluck_order( settings.aoData, rows,
				type === 'search' ? '_aFilterData' : '_aSortData', column
			);
		}, 1 );
	} );

		_api_registerPlural( 'columns().nodes()', 'column().nodes()', function () {
		return this.iterator( 'column-rows', function ( settings, column, i, j, rows ) {
			return _pluck_order( settings.aoData, rows, 'anCells', column ) ;
		}, 1 );
	} );

		_api_registerPlural( 'columns().visible()', 'column().visible()', function ( vis, calc ) {
		var that = this;
		var ret = this.iterator( 'column', function ( settings, column ) {
			if ( vis === undefined ) {
				return settings.aoColumns[ column ].bVisible;
			} 
			__setColumnVis( settings, column, vis );
		} );

		if ( vis !== undefined ) {
			this.iterator( 'table', function ( settings ) {
				_fnDrawHead( settings, settings.aoHeader );
				_fnDrawHead( settings, settings.aoFooter );

				if ( ! settings.aiDisplay.length ) {
					$(settings.nTBody).find('td[colspan]').attr('colspan', _fnVisbleColumns(settings));
				}

						_fnSaveState( settings );

				that.iterator( 'column', function ( settings, column ) {
					_fnCallbackFire( settings, null, 'column-visibility', [settings, column, vis, calc] );
				} );

					if ( calc === undefined || calc ) {
					that.columns.adjust();
				}
			});
		}

			return ret;
	} );

		_api_registerPlural( 'columns().indexes()', 'column().index()', function ( type ) {
		return this.iterator( 'column', function ( settings, column ) {
			return type === 'visible' ?
				_fnColumnIndexToVisible( settings, column ) :
				column;
		}, 1 );
	} );

		_api_register( 'columns.adjust()', function () {
		return this.iterator( 'table', function ( settings ) {
			_fnAdjustColumnSizing( settings );
		}, 1 );
	} );

		_api_register( 'column.index()', function ( type, idx ) {
		if ( this.context.length !== 0 ) {
			var ctx = this.context[0];

				if ( type === 'fromVisible' || type === 'toData' ) {
				return _fnVisibleToColumnIndex( ctx, idx );
			}
			else if ( type === 'fromData' || type === 'toVisible' ) {
				return _fnColumnIndexToVisible( ctx, idx );
			}
		}
	} );

		_api_register( 'column()', function ( selector, opts ) {
		return _selector_first( this.columns( selector, opts ) );
	} );

		var __cell_selector = function ( settings, selector, opts )
	{
		var data = settings.aoData;
		var rows = _selector_row_indexes( settings, opts );
		var cells = _removeEmpty( _pluck_order( data, rows, 'anCells' ) );
		var allCells = $(_flatten( [], cells ));
		var row;
		var columns = settings.aoColumns.length;
		var a, i, ien, j, o, host;

			var run = function ( s ) {
			var fnSelector = typeof s === 'function';

				if ( s === null || s === undefined || fnSelector ) {
				a = [];

					for ( i=0, ien=rows.length ; i<ien ; i++ ) {
					row = rows[i];

						for ( j=0 ; j<columns ; j++ ) {
						o = {
							row: row,
							column: j
						};

							if ( fnSelector ) {
							host = data[ row ];

								if ( s( o, _fnGetCellData(settings, row, j), host.anCells ? host.anCells[j] : null ) ) {
								a.push( o );
							}
						}
						else {
							a.push( o );
						}
					}
				}

					return a;
			}

			if ( $.isPlainObject( s ) ) {
				return s.column !== undefined && s.row !== undefined && $.inArray( s.row, rows ) !== -1 ?
					[s] :
					[];
			}

			var jqResult = allCells
				.filter( s )
				.map( function (i, el) {
					return { 
						row:    el._DT_CellIndex.row,
						column: el._DT_CellIndex.column
	 				};
				} )
				.toArray();

				if ( jqResult.length || ! s.nodeName ) {
				return jqResult;
			}

			host = $(s).closest('*[data-dt-row]');
			return host.length ?
				[ {
					row: host.data('dt-row'),
					column: host.data('dt-column')
				} ] :
				[];
		};

			return _selector_run( 'cell', selector, run, settings, opts );
	};




					_api_register( 'cells()', function ( rowSelector, columnSelector, opts ) {
		if ( $.isPlainObject( rowSelector ) ) {
			if ( rowSelector.row === undefined ) {
				opts = rowSelector;
				rowSelector = null;
			}
			else {
				opts = columnSelector;
				columnSelector = null;
			}
		}
		if ( $.isPlainObject( columnSelector ) ) {
			opts = columnSelector;
			columnSelector = null;
		}

		if ( columnSelector === null || columnSelector === undefined ) {
			return this.iterator( 'table', function ( settings ) {
				return __cell_selector( settings, rowSelector, _selector_opts( opts ) );
			} );
		}

		var internalOpts = opts ? {
			page: opts.page,
			order: opts.order,
			search: opts.search
		} : {};

		var columns = this.columns( columnSelector, internalOpts );
		var rows = this.rows( rowSelector, internalOpts );
		var i, ien, j, jen;

			var cellsNoOpts = this.iterator( 'table', function ( settings, idx ) {
			var a = [];

				for ( i=0, ien=rows[idx].length ; i<ien ; i++ ) {
				for ( j=0, jen=columns[idx].length ; j<jen ; j++ ) {
					a.push( {
						row:    rows[idx][i],
						column: columns[idx][j]
					} );
				}
			}

				return a;
		}, 1 );

		var cells = opts && opts.selected ?
			this.cells( cellsNoOpts, opts ) :
			cellsNoOpts;

			$.extend( cells.selector, {
			cols: columnSelector,
			rows: rowSelector,
			opts: opts
		} );

			return cells;
	} );


			_api_registerPlural( 'cells().nodes()', 'cell().node()', function () {
		return this.iterator( 'cell', function ( settings, row, column ) {
			var data = settings.aoData[ row ];

				return data && data.anCells ?
				data.anCells[ column ] :
				undefined;
		}, 1 );
	} );


			_api_register( 'cells().data()', function () {
		return this.iterator( 'cell', function ( settings, row, column ) {
			return _fnGetCellData( settings, row, column );
		}, 1 );
	} );


			_api_registerPlural( 'cells().cache()', 'cell().cache()', function ( type ) {
		type = type === 'search' ? '_aFilterData' : '_aSortData';

			return this.iterator( 'cell', function ( settings, row, column ) {
			return settings.aoData[ row ][ type ][ column ];
		}, 1 );
	} );


			_api_registerPlural( 'cells().render()', 'cell().render()', function ( type ) {
		return this.iterator( 'cell', function ( settings, row, column ) {
			return _fnGetCellData( settings, row, column, type );
		}, 1 );
	} );


			_api_registerPlural( 'cells().indexes()', 'cell().index()', function () {
		return this.iterator( 'cell', function ( settings, row, column ) {
			return {
				row: row,
				column: column,
				columnVisible: _fnColumnIndexToVisible( settings, column )
			};
		}, 1 );
	} );


			_api_registerPlural( 'cells().invalidate()', 'cell().invalidate()', function ( src ) {
		return this.iterator( 'cell', function ( settings, row, column ) {
			_fnInvalidate( settings, row, src, column );
		} );
	} );



				_api_register( 'cell()', function ( rowSelector, columnSelector, opts ) {
		return _selector_first( this.cells( rowSelector, columnSelector, opts ) );
	} );


			_api_register( 'cell().data()', function ( data ) {
		var ctx = this.context;
		var cell = this[0];

			if ( data === undefined ) {
			return ctx.length && cell.length ?
				_fnGetCellData( ctx[0], cell[0].row, cell[0].column ) :
				undefined;
		}

		_fnSetCellData( ctx[0], cell[0].row, cell[0].column, data );
		_fnInvalidate( ctx[0], cell[0].row, 'data', cell[0].column );

			return this;
	} );



	_api_register( 'order()', function ( order, dir ) {
		var ctx = this.context;

			if ( order === undefined ) {
			return ctx.length !== 0 ?
				ctx[0].aaSorting :
				undefined;
		}

		if ( typeof order === 'number' ) {
			order = [ [ order, dir ] ];
		}
		else if ( order.length && ! Array.isArray( order[0] ) ) {
			order = Array.prototype.slice.call( arguments );
		}

			return this.iterator( 'table', function ( settings ) {
			settings.aaSorting = order.slice();
		} );
	} );


	_api_register( 'order.listener()', function ( node, column, callback ) {
		return this.iterator( 'table', function ( settings ) {
			_fnSortAttachListener( settings, node, column, callback );
		} );
	} );


			_api_register( 'order.fixed()', function ( set ) {
		if ( ! set ) {
			var ctx = this.context;
			var fixed = ctx.length ?
				ctx[0].aaSortingFixed :
				undefined;

				return Array.isArray( fixed ) ?
				{ pre: fixed } :
				fixed;
		}

			return this.iterator( 'table', function ( settings ) {
			settings.aaSortingFixed = $.extend( true, {}, set );
		} );
	} );


	_api_register( [
		'columns().order()',
		'column().order()'
	], function ( dir ) {
		var that = this;

			return this.iterator( 'table', function ( settings, i ) {
			var sort = [];

				$.each( that[i], function (j, col) {
				sort.push( [ col, dir ] );
			} );

				settings.aaSorting = sort;
		} );
	} );



				_api_register( 'search()', function ( input, regex, smart, caseInsen ) {
		var ctx = this.context;

			if ( input === undefined ) {
			return ctx.length !== 0 ?
				ctx[0].oPreviousSearch.sSearch :
				undefined;
		}

		return this.iterator( 'table', function ( settings ) {
			if ( ! settings.oFeatures.bFilter ) {
				return;
			}

				_fnFilterComplete( settings, $.extend( {}, settings.oPreviousSearch, {
				"sSearch": input+"",
				"bRegex":  regex === null ? false : regex,
				"bSmart":  smart === null ? true  : smart,
				"bCaseInsensitive": caseInsen === null ? true : caseInsen
			} ), 1 );
		} );
	} );


			_api_registerPlural(
		'columns().search()',
		'column().search()',
		function ( input, regex, smart, caseInsen ) {
			return this.iterator( 'column', function ( settings, column ) {
				var preSearch = settings.aoPreSearchCols;

					if ( input === undefined ) {
					return preSearch[ column ].sSearch;
				}

				if ( ! settings.oFeatures.bFilter ) {
					return;
				}

					$.extend( preSearch[ column ], {
					"sSearch": input+"",
					"bRegex":  regex === null ? false : regex,
					"bSmart":  smart === null ? true  : smart,
					"bCaseInsensitive": caseInsen === null ? true : caseInsen
				} );

					_fnFilterComplete( settings, settings.oPreviousSearch, 1 );
			} );
		}
	);


		_api_register( 'state()', function () {
		return this.context.length ?
			this.context[0].oSavedState :
			null;
	} );


			_api_register( 'state.clear()', function () {
		return this.iterator( 'table', function ( settings ) {
			settings.fnStateSaveCallback.call( settings.oInstance, settings, {} );
		} );
	} );


			_api_register( 'state.loaded()', function () {
		return this.context.length ?
			this.context[0].oLoadedState :
			null;
	} );


			_api_register( 'state.save()', function () {
		return this.iterator( 'table', function ( settings ) {
			_fnSaveState( settings );
		} );
	} );



	DataTable.versionCheck = DataTable.fnVersionCheck = function( version )
	{
		var aThis = DataTable.version.split('.');
		var aThat = version.split('.');
		var iThis, iThat;

			for ( var i=0, iLen=aThat.length ; i<iLen ; i++ ) {
			iThis = parseInt( aThis[i], 10 ) || 0;
			iThat = parseInt( aThat[i], 10 ) || 0;

			if (iThis === iThat) {
				continue;
			}

			return iThis > iThat;
		}

			return true;
	};


	DataTable.isDataTable = DataTable.fnIsDataTable = function ( table )
	{
		var t = $(table).get(0);
		var is = false;

			if ( table instanceof DataTable.Api ) {
			return true;
		}

			$.each( DataTable.settings, function (i, o) {
			var head = o.nScrollHead ? $('table', o.nScrollHead)[0] : null;
			var foot = o.nScrollFoot ? $('table', o.nScrollFoot)[0] : null;

				if ( o.nTable === t || head === t || foot === t ) {
				is = true;
			}
		} );

			return is;
	};


	DataTable.tables = DataTable.fnTables = function ( visible )
	{
		var api = false;

			if ( $.isPlainObject( visible ) ) {
			api = visible.api;
			visible = visible.visible;
		}

			var a = $.map( DataTable.settings, function (o) {
			if ( !visible || (visible && $(o.nTable).is(':visible')) ) {
				return o.nTable;
			}
		} );

			return api ?
			new _Api( a ) :
			a;
	};


	DataTable.camelToHungarian = _fnCamelToHungarian;



	_api_register( '$()', function ( selector, opts ) {
		var
			rows   = this.rows( opts ).nodes(), 
			jqRows = $(rows);

			return $( [].concat(
			jqRows.filter( selector ).toArray(),
			jqRows.find( selector ).toArray()
		) );
	} );


	$.each( [ 'on', 'one', 'off' ], function (i, key) {
		_api_register( key+'()', function (  ) {
			var args = Array.prototype.slice.call(arguments);

			args[0] = $.map( args[0].split( /\s/ ), function ( e ) {
				return ! e.match(/\.dt\b/) ?
					e+'.dt' :
					e;
				} ).join( ' ' );

				var inst = $( this.tables().nodes() );
			inst[key].apply( inst, args );
			return this;
		} );
	} );


			_api_register( 'clear()', function () {
		return this.iterator( 'table', function ( settings ) {
			_fnClearTable( settings );
		} );
	} );


			_api_register( 'settings()', function () {
		return new _Api( this.context, this.context );
	} );


			_api_register( 'init()', function () {
		var ctx = this.context;
		return ctx.length ? ctx[0].oInit : null;
	} );


			_api_register( 'data()', function () {
		return this.iterator( 'table', function ( settings ) {
			return _pluck( settings.aoData, '_aData' );
		} ).flatten();
	} );


			_api_register( 'destroy()', function ( remove ) {
		remove = remove || false;

			return this.iterator( 'table', function ( settings ) {
			var orig      = settings.nTableWrapper.parentNode;
			var classes   = settings.oClasses;
			var table     = settings.nTable;
			var tbody     = settings.nTBody;
			var thead     = settings.nTHead;
			var tfoot     = settings.nTFoot;
			var jqTable   = $(table);
			var jqTbody   = $(tbody);
			var jqWrapper = $(settings.nTableWrapper);
			var rows      = $.map( settings.aoData, function (r) { return r.nTr; } );
			var i, ien;

			settings.bDestroying = true;

			_fnCallbackFire( settings, "aoDestroyCallback", "destroy", [settings] );

			if ( ! remove ) {
				new _Api( settings ).columns().visible( true );
			}

			jqWrapper.off('.DT').find(':not(tbody *)').off('.DT');
			$(window).off('.DT-'+settings.sInstance);

			if ( table != thead.parentNode ) {
				jqTable.children('thead').detach();
				jqTable.append( thead );
			}

				if ( tfoot && table != tfoot.parentNode ) {
				jqTable.children('tfoot').detach();
				jqTable.append( tfoot );
			}

				settings.aaSorting = [];
			settings.aaSortingFixed = [];
			_fnSortingClasses( settings );

				$( rows ).removeClass( settings.asStripeClasses.join(' ') );

				$('th, td', thead).removeClass( classes.sSortable+' '+
				classes.sSortableAsc+' '+classes.sSortableDesc+' '+classes.sSortableNone
			);

			jqTbody.children().detach();
			jqTbody.append( rows );

			var removedMethod = remove ? 'remove' : 'detach';
			jqTable[ removedMethod ]();
			jqWrapper[ removedMethod ]();

			if ( ! remove && orig ) {
				orig.insertBefore( table, settings.nTableReinsertBefore );

				jqTable
					.css( 'width', settings.sDestroyWidth )
					.removeClass( classes.sTable );

				ien = settings.asDestroyStripes.length;

					if ( ien ) {
					jqTbody.children().each( function (i) {
						$(this).addClass( settings.asDestroyStripes[i % ien] );
					} );
				}
			}

			var idx = $.inArray( settings, DataTable.settings );
			if ( idx !== -1 ) {
				DataTable.settings.splice( idx, 1 );
			}
		} );
	} );


	$.each( [ 'column', 'row', 'cell' ], function ( i, type ) {
		_api_register( type+'s().every()', function ( fn ) {
			var opts = this.selector.opts;
			var api = this;

				return this.iterator( type, function ( settings, arg1, arg2, arg3, arg4 ) {
				fn.call(
					api[ type ](
						arg1,
						type==='cell' ? arg2 : opts,
						type==='cell' ? opts : undefined
					),
					arg1, arg2, arg3, arg4
				);
			} );
		} );
	} );


	_api_register( 'i18n()', function ( token, def, plural ) {
		var ctx = this.context[0];
		var resolved = _fnGetObjectDataFn( token )( ctx.oLanguage );

			if ( resolved === undefined ) {
			resolved = def;
		}

			if ( plural !== undefined && $.isPlainObject( resolved ) ) {
			resolved = resolved[ plural ] !== undefined ?
				resolved[ plural ] :
				resolved._;
		}

			return resolved.replace( '%d', plural ); 
	} );
	DataTable.version = "1.10.24";

	DataTable.settings = [];

	DataTable.models = {};



	DataTable.models.oSearch = {
		"bCaseInsensitive": true,

		"sSearch": "",

		"bRegex": false,

		"bSmart": true
	};




	DataTable.models.oRow = {
		"nTr": null,

		"anCells": null,

		"_aData": [],

		"_aSortData": null,

		"_aFilterData": null,

		"_sFilterRow": null,

		"_sRowStripe": "",

		"src": null,

		"idx": -1
	};


	DataTable.models.oColumn = {
		"idx": null,

		"aDataSort": null,

		"asSorting": null,

		"bSearchable": null,

		"bSortable": null,

		"bVisible": null,

		"_sManualType": null,

		"_bAttrSrc": false,

		"fnCreatedCell": null,

		"fnGetData": null,

		"fnSetData": null,

		"mData": null,

		"mRender": null,

		"nTh": null,

		"nTf": null,

		"sClass": null,

		"sContentPadding": null,

		"sDefaultContent": null,

		"sName": null,

		"sSortDataType": 'std',

		"sSortingClass": null,

		"sSortingClassJUI": null,

		"sTitle": null,

		"sType": null,

		"sWidth": null,

		"sWidthOrig": null
	};



	DataTable.defaults = {
		"aaData": null,


		"aaSorting": [[0,'asc']],


		"aaSortingFixed": [],


		"ajax": null,


		"aLengthMenu": [ 10, 25, 50, 100 ],


		"aoColumns": null,

		"aoColumnDefs": null,


		"aoSearchCols": [],


		"asStripeClasses": null,


		"bAutoWidth": true,


		"bDeferRender": false,


		"bDestroy": false,


		"bFilter": true,


		"bInfo": true,


		"bLengthChange": true,


		"bPaginate": true,


		"bProcessing": false,


		"bRetrieve": false,


		"bScrollCollapse": false,


		"bServerSide": false,


		"bSort": true,


		"bSortMulti": true,


		"bSortCellsTop": false,


		"bSortClasses": true,


		"bStateSave": false,


		"fnCreatedRow": null,


		"fnDrawCallback": null,


		"fnFooterCallback": null,


		"fnFormatNumber": function ( toFormat ) {
			return toFormat.toString().replace(
				/\B(?=(\d{3})+(?!\d))/g,
				this.oLanguage.sThousands
			);
		},


		"fnHeaderCallback": null,


		"fnInfoCallback": null,


		"fnInitComplete": null,


		"fnPreDrawCallback": null,


		"fnRowCallback": null,


		"fnServerData": null,


		"fnServerParams": null,


		"fnStateLoadCallback": function ( settings ) {
			try {
				return JSON.parse(
					(settings.iStateDuration === -1 ? sessionStorage : localStorage).getItem(
						'DataTables_'+settings.sInstance+'_'+location.pathname
					)
				);
			} catch (e) {
				return {};
			}
		},


		"fnStateLoadParams": null,


		"fnStateLoaded": null,


		"fnStateSaveCallback": function ( settings, data ) {
			try {
				(settings.iStateDuration === -1 ? sessionStorage : localStorage).setItem(
					'DataTables_'+settings.sInstance+'_'+location.pathname,
					JSON.stringify( data )
				);
			} catch (e) {}
		},


		"fnStateSaveParams": null,


		"iStateDuration": 7200,


		"iDeferLoading": null,


		"iDisplayLength": 10,


		"iDisplayStart": 0,


		"iTabIndex": 0,


		"oClasses": {},


		"oLanguage": {
			"oAria": {
				"sSortAscending": ": activate to sort column ascending",

				"sSortDescending": ": activate to sort column descending"
			},

			"oPaginate": {
				"sFirst": "First",


				"sLast": "Last",


				"sNext": "Next",


				"sPrevious": "Previous"
			},

			"sEmptyTable": "No data available in table",


			"sInfo": "Showing _START_ to _END_ of _TOTAL_ entries",


			"sInfoEmpty": "Showing 0 to 0 of 0 entries",


			"sInfoFiltered": "(filtered from _MAX_ total entries)",


			"sInfoPostFix": "",


			"sDecimal": "",


			"sThousands": ",",


			"sLengthMenu": "Show _MENU_ entries",


			"sLoadingRecords": "Loading...",


			"sProcessing": "Processing...",


			"sSearch": "Search:",


			"sSearchPlaceholder": "",


			"sUrl": "",


			"sZeroRecords": "No matching records found"
		},


		"oSearch": $.extend( {}, DataTable.models.oSearch ),


		"sAjaxDataProp": "data",


		"sAjaxSource": null,


		"sDom": "lfrtip",


		"searchDelay": null,


		"sPaginationType": "simple_numbers",


		"sScrollX": "",


		"sScrollXInner": "",


		"sScrollY": "",


		"sServerMethod": "GET",


		"renderer": null,


		"rowId": "DT_RowId"
	};

		_fnHungarianMap( DataTable.defaults );




	DataTable.defaults.column = {
		"aDataSort": null,
		"iDataSort": -1,


		"asSorting": [ 'asc', 'desc' ],


		"bSearchable": true,


		"bSortable": true,


		"bVisible": true,


		"fnCreatedCell": null,




		"mData": null,


		"mRender": null,


		"sCellType": "td",


		"sClass": "",

		"sContentPadding": "",


		"sDefaultContent": null,


		"sName": "",


		"sSortDataType": "std",


		"sTitle": null,


		"sType": null,


		"sWidth": null
	};

		_fnHungarianMap( DataTable.defaults.column );



	DataTable.models.oSettings = {
		"oFeatures": {

			"bAutoWidth": null,

			"bDeferRender": null,

			"bFilter": null,

			"bInfo": null,

			"bLengthChange": null,

			"bPaginate": null,

			"bProcessing": null,

			"bServerSide": null,

			"bSort": null,

			"bSortMulti": null,

			"bSortClasses": null,

			"bStateSave": null
		},


		"oScroll": {
			"bCollapse": null,

			"iBarWidth": 0,

			"sX": null,

			"sXInner": null,

			"sY": null
		},

		"oLanguage": {
			"fnInfoCallback": null
		},

		"oBrowser": {
			"bScrollOversize": false,

			"bScrollbarLeft": false,

			"bBounding": false,

			"barWidth": 0
		},


				"ajax": null,


		"aanFeatures": [],

		"aoData": [],

		"aiDisplay": [],

		"aiDisplayMaster": [],

		"aIds": {},

		"aoColumns": [],

		"aoHeader": [],

		"aoFooter": [],

		"oPreviousSearch": {},

		"aoPreSearchCols": [],

		"aaSorting": null,

		"aaSortingFixed": [],

		"asStripeClasses": null,

		"asDestroyStripes": [],

		"sDestroyWidth": 0,

		"aoRowCallback": [],

		"aoHeaderCallback": [],

		"aoFooterCallback": [],

		"aoDrawCallback": [],

		"aoRowCreatedCallback": [],

		"aoPreDrawCallback": [],

		"aoInitComplete": [],


		"aoStateSaveParams": [],

		"aoStateLoadParams": [],

		"aoStateLoaded": [],

		"sTableId": "",

		"nTable": null,

		"nTHead": null,

		"nTFoot": null,

		"nTBody": null,

		"nTableWrapper": null,

		"bDeferLoading": false,

		"bInitialised": false,

		"aoOpenRows": [],

		"sDom": null,

		"searchDelay": null,

		"sPaginationType": "two_button",

		"iStateDuration": 0,

		"aoStateSave": [],

		"aoStateLoad": [],

		"oSavedState": null,

		"oLoadedState": null,

		"sAjaxSource": null,

		"sAjaxDataProp": null,

		"bAjaxDataGet": true,

		"jqXHR": null,

		"json": undefined,

		"oAjaxData": undefined,

		"fnServerData": null,

		"aoServerParams": [],

		"sServerMethod": null,

		"fnFormatNumber": null,

		"aLengthMenu": null,

		"iDraw": 0,

		"bDrawing": false,

		"iDrawError": -1,

		"_iDisplayLength": 10,

		"_iDisplayStart": 0,

		"_iRecordsTotal": 0,

		"_iRecordsDisplay": 0,

		"oClasses": {},

		"bFiltered": false,

		"bSorted": false,

		"bSortCellsTop": null,

		"oInit": null,

		"aoDestroyCallback": [],


		"fnRecordsTotal": function ()
		{
			return _fnDataSource( this ) == 'ssp' ?
				this._iRecordsTotal * 1 :
				this.aiDisplayMaster.length;
		},

		"fnRecordsDisplay": function ()
		{
			return _fnDataSource( this ) == 'ssp' ?
				this._iRecordsDisplay * 1 :
				this.aiDisplay.length;
		},

		"fnDisplayEnd": function ()
		{
			var
				len      = this._iDisplayLength,
				start    = this._iDisplayStart,
				calc     = start + len,
				records  = this.aiDisplay.length,
				features = this.oFeatures,
				paginate = features.bPaginate;

				if ( features.bServerSide ) {
				return paginate === false || len === -1 ?
					start + records :
					Math.min( start+len, this._iRecordsDisplay );
			}
			else {
				return ! paginate || calc>records || len===-1 ?
					records :
					calc;
			}
		},

		"oInstance": null,

		"sInstance": null,

		"iTabIndex": 0,

		"nScrollHead": null,

		"nScrollFoot": null,

		"aLastSort": [],

		"oPlugins": {},

		"rowIdFn": null,

		"rowId": null
	};



	DataTable.ext = _ext = {
		buttons: {},


		classes: {},


		build:"dt/dt-1.10.24/fc-3.3.2/fh-3.1.8/r-2.2.7/rg-1.1.2/sc-2.0.3/sp-1.2.2/sl-1.3.3",


		errMode: "alert",


		feature: [],


		search: [],


		selector: {
			cell: [],
			column: [],
			row: []
		},


		internal: {},


		legacy: {
			ajax: null
		},


		pager: {},


				renderer: {
			pageButton: {},
			header: {}
		},


		order: {},


		type: {
			detect: [],


			search: {},


			order: {}
		},

		_unique: 0,



		fnVersionCheck: DataTable.fnVersionCheck,


		iApiIndex: 0,


		oJUIClasses: {},


		sVersion: DataTable.version
	};


	$.extend( _ext, {
		afnFiltering: _ext.search,
		aTypes:       _ext.type.detect,
		ofnSearch:    _ext.type.search,
		oSort:        _ext.type.order,
		afnSortData:  _ext.order,
		aoFeatures:   _ext.feature,
		oApi:         _ext.internal,
		oStdClasses:  _ext.classes,
		oPagination:  _ext.pager
	} );


			$.extend( DataTable.ext.classes, {
		"sTable": "dataTable",
		"sNoFooter": "no-footer",

		"sPageButton": "paginate_button",
		"sPageButtonActive": "current",
		"sPageButtonDisabled": "disabled",

		"sStripeOdd": "odd",
		"sStripeEven": "even",

		"sRowEmpty": "dataTables_empty",

		"sWrapper": "dataTables_wrapper",
		"sFilter": "dataTables_filter",
		"sInfo": "dataTables_info",
		"sPaging": "dataTables_paginate paging_", 
		"sLength": "dataTables_length",
		"sProcessing": "dataTables_processing",

		"sSortAsc": "sorting_asc",
		"sSortDesc": "sorting_desc",
		"sSortable": "sorting", 
		"sSortableAsc": "sorting_desc_disabled",
		"sSortableDesc": "sorting_asc_disabled",
		"sSortableNone": "sorting_disabled",
		"sSortColumn": "sorting_", 

		"sFilterInput": "",

		"sLengthSelect": "",

		"sScrollWrapper": "dataTables_scroll",
		"sScrollHead": "dataTables_scrollHead",
		"sScrollHeadInner": "dataTables_scrollHeadInner",
		"sScrollBody": "dataTables_scrollBody",
		"sScrollFoot": "dataTables_scrollFoot",
		"sScrollFootInner": "dataTables_scrollFootInner",

		"sHeaderTH": "",
		"sFooterTH": "",

		"sSortJUIAsc": "",
		"sSortJUIDesc": "",
		"sSortJUI": "",
		"sSortJUIAscAllowed": "",
		"sSortJUIDescAllowed": "",
		"sSortJUIWrapper": "",
		"sSortIcon": "",
		"sJUIHeader": "",
		"sJUIFooter": ""
	} );


			var extPagination = DataTable.ext.pager;

		function _numbers ( page, pages ) {
		var
			numbers = [],
			buttons = extPagination.numbers_length,
			half = Math.floor( buttons / 2 ),
			i = 1;

			if ( pages <= buttons ) {
			numbers = _range( 0, pages );
		}
		else if ( page <= half ) {
			numbers = _range( 0, buttons-2 );
			numbers.push( 'ellipsis' );
			numbers.push( pages-1 );
		}
		else if ( page >= pages - 1 - half ) {
			numbers = _range( pages-(buttons-2), pages );
			numbers.splice( 0, 0, 'ellipsis' ); 
			numbers.splice( 0, 0, 0 );
		}
		else {
			numbers = _range( page-half+2, page+half-1 );
			numbers.push( 'ellipsis' );
			numbers.push( pages-1 );
			numbers.splice( 0, 0, 'ellipsis' );
			numbers.splice( 0, 0, 0 );
		}

			numbers.DT_el = 'span';
		return numbers;
	}


			$.extend( extPagination, {
		simple: function ( page, pages ) {
			return [ 'previous', 'next' ];
		},

			full: function ( page, pages ) {
			return [  'first', 'previous', 'next', 'last' ];
		},

			numbers: function ( page, pages ) {
			return [ _numbers(page, pages) ];
		},

			simple_numbers: function ( page, pages ) {
			return [ 'previous', _numbers(page, pages), 'next' ];
		},

			full_numbers: function ( page, pages ) {
			return [ 'first', 'previous', _numbers(page, pages), 'next', 'last' ];
		},

				first_last_numbers: function (page, pages) {
	 		return ['first', _numbers(page, pages), 'last'];
	 	},

		_numbers: _numbers,

		numbers_length: 7
	} );


			$.extend( true, DataTable.ext.renderer, {
		pageButton: {
			_: function ( settings, host, idx, buttons, page, pages ) {
				var classes = settings.oClasses;
				var lang = settings.oLanguage.oPaginate;
				var aria = settings.oLanguage.oAria.paginate || {};
				var btnDisplay, btnClass, counter=0;

					var attach = function( container, buttons ) {
					var i, ien, node, button, tabIndex;
					var disabledClass = classes.sPageButtonDisabled;
					var clickHandler = function ( e ) {
						_fnPageChange( settings, e.data.action, true );
					};

						for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
						button = buttons[i];

							if ( Array.isArray( button ) ) {
							var inner = $( '<'+(button.DT_el || 'div')+'/>' )
								.appendTo( container );
							attach( inner, button );
						}
						else {
							btnDisplay = null;
							btnClass = button;
							tabIndex = settings.iTabIndex;

								switch ( button ) {
								case 'ellipsis':
									container.append('<span class="ellipsis">&#x2026;</span>');
									break;

									case 'first':
									btnDisplay = lang.sFirst;

										if ( page === 0 ) {
										tabIndex = -1;
										btnClass += ' ' + disabledClass;
									}
									break;

									case 'previous':
									btnDisplay = lang.sPrevious;

										if ( page === 0 ) {
										tabIndex = -1;
										btnClass += ' ' + disabledClass;
									}
									break;

									case 'next':
									btnDisplay = lang.sNext;

										if ( pages === 0 || page === pages-1 ) {
										tabIndex = -1;
										btnClass += ' ' + disabledClass;
									}
									break;

									case 'last':
									btnDisplay = lang.sLast;

										if ( pages === 0 || page === pages-1 ) {
										tabIndex = -1;
										btnClass += ' ' + disabledClass;
									}
									break;

									default:
									btnDisplay = settings.fnFormatNumber( button + 1 );
									btnClass = page === button ?
										classes.sPageButtonActive : '';
									break;
							}

								if ( btnDisplay !== null ) {
								node = $('<a>', {
										'class': classes.sPageButton+' '+btnClass,
										'aria-controls': settings.sTableId,
										'aria-label': aria[ button ],
										'data-dt-idx': counter,
										'tabindex': tabIndex,
										'id': idx === 0 && typeof button === 'string' ?
											settings.sTableId +'_'+ button :
											null
									} )
									.html( btnDisplay )
									.appendTo( container );

									_fnBindAction(
									node, {action: button}, clickHandler
								);

									counter++;
							}
						}
					}
				};

				var activeEl;

					try {
					activeEl = $(host).find(document.activeElement).data('dt-idx');
				}
				catch (e) {}

					attach( $(host).empty(), buttons );

					if ( activeEl !== undefined ) {
					$(host).find( '[data-dt-idx='+activeEl+']' ).trigger('focus');
				}
			}
		}
	} );



	$.extend( DataTable.ext.type.detect, [
		function ( d, settings )
		{
			var decimal = settings.oLanguage.sDecimal;
			return _isNumber( d, decimal ) ? 'num'+decimal : null;
		},

		function ( d, settings )
		{
			if ( d && !(d instanceof Date) && ! _re_date.test(d) ) {
				return null;
			}
			var parsed = Date.parse(d);
			return (parsed !== null && !isNaN(parsed)) || _empty(d) ? 'date' : null;
		},

		function ( d, settings )
		{
			var decimal = settings.oLanguage.sDecimal;
			return _isNumber( d, decimal, true ) ? 'num-fmt'+decimal : null;
		},

		function ( d, settings )
		{
			var decimal = settings.oLanguage.sDecimal;
			return _htmlNumeric( d, decimal ) ? 'html-num'+decimal : null;
		},

		function ( d, settings )
		{
			var decimal = settings.oLanguage.sDecimal;
			return _htmlNumeric( d, decimal, true ) ? 'html-num-fmt'+decimal : null;
		},

		function ( d, settings )
		{
			return _empty( d ) || (typeof d === 'string' && d.indexOf('<') !== -1) ?
				'html' : null;
		}
	] );





			$.extend( DataTable.ext.type.search, {
		html: function ( data ) {
			return _empty(data) ?
				data :
				typeof data === 'string' ?
					data
						.replace( _re_new_lines, " " )
						.replace( _re_html, "" ) :
					'';
		},

			string: function ( data ) {
			return _empty(data) ?
				data :
				typeof data === 'string' ?
					data.replace( _re_new_lines, " " ) :
					data;
		}
	} );



				var __numericReplace = function ( d, decimalPlace, re1, re2 ) {
		if ( d !== 0 && (!d || d === '-') ) {
			return -Infinity;
		}

		if ( decimalPlace ) {
			d = _numToDecimal( d, decimalPlace );
		}

			if ( d.replace ) {
			if ( re1 ) {
				d = d.replace( re1, '' );
			}

				if ( re2 ) {
				d = d.replace( re2, '' );
			}
		}

			return d * 1;
	};


	function _addNumericSort ( decimalPlace ) {
		$.each(
			{
				"num": function ( d ) {
					return __numericReplace( d, decimalPlace );
				},

				"num-fmt": function ( d ) {
					return __numericReplace( d, decimalPlace, _re_formatted_numeric );
				},

				"html-num": function ( d ) {
					return __numericReplace( d, decimalPlace, _re_html );
				},

				"html-num-fmt": function ( d ) {
					return __numericReplace( d, decimalPlace, _re_html, _re_formatted_numeric );
				}
			},
			function ( key, fn ) {
				_ext.type.order[ key+decimalPlace+'-pre' ] = fn;

				if ( key.match(/^html\-/) ) {
					_ext.type.search[ key+decimalPlace ] = _ext.type.search.html;
				}
			}
		);
	}


	$.extend( _ext.type.order, {
		"date-pre": function ( d ) {
			var ts = Date.parse( d );
			return isNaN(ts) ? -Infinity : ts;
		},

		"html-pre": function ( a ) {
			return _empty(a) ?
				'' :
				a.replace ?
					a.replace( /<.*?>/g, "" ).toLowerCase() :
					a+'';
		},

		"string-pre": function ( a ) {
			return _empty(a) ?
				'' :
				typeof a === 'string' ?
					a.toLowerCase() :
					! a.toString ?
						'' :
						a.toString();
		},

		"string-asc": function ( x, y ) {
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		},

			"string-desc": function ( x, y ) {
			return ((x < y) ? 1 : ((x > y) ? -1 : 0));
		}
	} );


	_addNumericSort( '' );


			$.extend( true, DataTable.ext.renderer, {
		header: {
			_: function ( settings, cell, column, classes ) {
				$(settings.nTable).on( 'order.dt.DT', function ( e, ctx, sorting, columns ) {
					if ( settings !== ctx ) { 
						return;               
					}

						var colIdx = column.idx;

						cell
						.removeClass(
							classes.sSortAsc +' '+
							classes.sSortDesc
						)
						.addClass( columns[ colIdx ] == 'asc' ?
							classes.sSortAsc : columns[ colIdx ] == 'desc' ?
								classes.sSortDesc :
								column.sSortingClass
						);
				} );
			},

				jqueryui: function ( settings, cell, column, classes ) {
				$('<div/>')
					.addClass( classes.sSortJUIWrapper )
					.append( cell.contents() )
					.append( $('<span/>')
						.addClass( classes.sSortIcon+' '+column.sSortingClassJUI )
					)
					.appendTo( cell );

				$(settings.nTable).on( 'order.dt.DT', function ( e, ctx, sorting, columns ) {
					if ( settings !== ctx ) {
						return;
					}

						var colIdx = column.idx;

						cell
						.removeClass( classes.sSortAsc +" "+classes.sSortDesc )
						.addClass( columns[ colIdx ] == 'asc' ?
							classes.sSortAsc : columns[ colIdx ] == 'desc' ?
								classes.sSortDesc :
								column.sSortingClass
						);

						cell
						.find( 'span.'+classes.sSortIcon )
						.removeClass(
							classes.sSortJUIAsc +" "+
							classes.sSortJUIDesc +" "+
							classes.sSortJUI +" "+
							classes.sSortJUIAscAllowed +" "+
							classes.sSortJUIDescAllowed
						)
						.addClass( columns[ colIdx ] == 'asc' ?
							classes.sSortJUIAsc : columns[ colIdx ] == 'desc' ?
								classes.sSortJUIDesc :
								column.sSortingClassJUI
						);
				} );
			}
		}
	} );


		var __htmlEscapeEntities = function ( d ) {
		return typeof d === 'string' ?
			d
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;') :
			d;
	};

	DataTable.render = {
		number: function ( thousands, decimal, precision, prefix, postfix ) {
			return {
				display: function ( d ) {
					if ( typeof d !== 'number' && typeof d !== 'string' ) {
						return d;
					}

						var negative = d < 0 ? '-' : '';
					var flo = parseFloat( d );

					if ( isNaN( flo ) ) {
						return __htmlEscapeEntities( d );
					}

						flo = flo.toFixed( precision );
					d = Math.abs( flo );

						var intPart = parseInt( d, 10 );
					var floatPart = precision ?
						decimal+(d - intPart).toFixed( precision ).substring( 2 ):
						'';

						return negative + (prefix||'') +
						intPart.toString().replace(
							/\B(?=(\d{3})+(?!\d))/g, thousands
						) +
						floatPart +
						(postfix||'');
				}
			};
		},

			text: function () {
			return {
				display: __htmlEscapeEntities,
				filter: __htmlEscapeEntities
			};
		}
	};




	function _fnExternApiFunc (fn)
	{
		return function() {
			var args = [_fnSettingsFromNode( this[DataTable.ext.iApiIndex] )].concat(
				Array.prototype.slice.call(arguments)
			);
			return DataTable.ext.internal[fn].apply( this, args );
		};
	}


	$.extend( DataTable.ext.internal, {
		_fnExternApiFunc: _fnExternApiFunc,
		_fnBuildAjax: _fnBuildAjax,
		_fnAjaxUpdate: _fnAjaxUpdate,
		_fnAjaxParameters: _fnAjaxParameters,
		_fnAjaxUpdateDraw: _fnAjaxUpdateDraw,
		_fnAjaxDataSrc: _fnAjaxDataSrc,
		_fnAddColumn: _fnAddColumn,
		_fnColumnOptions: _fnColumnOptions,
		_fnAdjustColumnSizing: _fnAdjustColumnSizing,
		_fnVisibleToColumnIndex: _fnVisibleToColumnIndex,
		_fnColumnIndexToVisible: _fnColumnIndexToVisible,
		_fnVisbleColumns: _fnVisbleColumns,
		_fnGetColumns: _fnGetColumns,
		_fnColumnTypes: _fnColumnTypes,
		_fnApplyColumnDefs: _fnApplyColumnDefs,
		_fnHungarianMap: _fnHungarianMap,
		_fnCamelToHungarian: _fnCamelToHungarian,
		_fnLanguageCompat: _fnLanguageCompat,
		_fnBrowserDetect: _fnBrowserDetect,
		_fnAddData: _fnAddData,
		_fnAddTr: _fnAddTr,
		_fnNodeToDataIndex: _fnNodeToDataIndex,
		_fnNodeToColumnIndex: _fnNodeToColumnIndex,
		_fnGetCellData: _fnGetCellData,
		_fnSetCellData: _fnSetCellData,
		_fnSplitObjNotation: _fnSplitObjNotation,
		_fnGetObjectDataFn: _fnGetObjectDataFn,
		_fnSetObjectDataFn: _fnSetObjectDataFn,
		_fnGetDataMaster: _fnGetDataMaster,
		_fnClearTable: _fnClearTable,
		_fnDeleteIndex: _fnDeleteIndex,
		_fnInvalidate: _fnInvalidate,
		_fnGetRowElements: _fnGetRowElements,
		_fnCreateTr: _fnCreateTr,
		_fnBuildHead: _fnBuildHead,
		_fnDrawHead: _fnDrawHead,
		_fnDraw: _fnDraw,
		_fnReDraw: _fnReDraw,
		_fnAddOptionsHtml: _fnAddOptionsHtml,
		_fnDetectHeader: _fnDetectHeader,
		_fnGetUniqueThs: _fnGetUniqueThs,
		_fnFeatureHtmlFilter: _fnFeatureHtmlFilter,
		_fnFilterComplete: _fnFilterComplete,
		_fnFilterCustom: _fnFilterCustom,
		_fnFilterColumn: _fnFilterColumn,
		_fnFilter: _fnFilter,
		_fnFilterCreateSearch: _fnFilterCreateSearch,
		_fnEscapeRegex: _fnEscapeRegex,
		_fnFilterData: _fnFilterData,
		_fnFeatureHtmlInfo: _fnFeatureHtmlInfo,
		_fnUpdateInfo: _fnUpdateInfo,
		_fnInfoMacros: _fnInfoMacros,
		_fnInitialise: _fnInitialise,
		_fnInitComplete: _fnInitComplete,
		_fnLengthChange: _fnLengthChange,
		_fnFeatureHtmlLength: _fnFeatureHtmlLength,
		_fnFeatureHtmlPaginate: _fnFeatureHtmlPaginate,
		_fnPageChange: _fnPageChange,
		_fnFeatureHtmlProcessing: _fnFeatureHtmlProcessing,
		_fnProcessingDisplay: _fnProcessingDisplay,
		_fnFeatureHtmlTable: _fnFeatureHtmlTable,
		_fnScrollDraw: _fnScrollDraw,
		_fnApplyToChildren: _fnApplyToChildren,
		_fnCalculateColumnWidths: _fnCalculateColumnWidths,
		_fnThrottle: _fnThrottle,
		_fnConvertToWidth: _fnConvertToWidth,
		_fnGetWidestNode: _fnGetWidestNode,
		_fnGetMaxLenString: _fnGetMaxLenString,
		_fnStringToCss: _fnStringToCss,
		_fnSortFlatten: _fnSortFlatten,
		_fnSort: _fnSort,
		_fnSortAria: _fnSortAria,
		_fnSortListener: _fnSortListener,
		_fnSortAttachListener: _fnSortAttachListener,
		_fnSortingClasses: _fnSortingClasses,
		_fnSortData: _fnSortData,
		_fnSaveState: _fnSaveState,
		_fnLoadState: _fnLoadState,
		_fnSettingsFromNode: _fnSettingsFromNode,
		_fnLog: _fnLog,
		_fnMap: _fnMap,
		_fnBindAction: _fnBindAction,
		_fnCallbackReg: _fnCallbackReg,
		_fnCallbackFire: _fnCallbackFire,
		_fnLengthOverflow: _fnLengthOverflow,
		_fnRenderer: _fnRenderer,
		_fnDataSource: _fnDataSource,
		_fnRowAttributes: _fnRowAttributes,
		_fnExtend: _fnExtend,
		_fnCalculateEnd: function () {} 
	} );


	$.fn.dataTable = DataTable;

	DataTable.$ = $;

	$.fn.dataTableSettings = DataTable.settings;
	$.fn.dataTableExt = DataTable.ext;

	$.fn.DataTable = function ( opts ) {
		return $(this).dataTable( opts ).api();
	};

	$.each( DataTable, function ( prop, val ) {
		$.fn.DataTable[ prop ] = val;
	} );
















	return $.fn.dataTable;
}));



(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;
var _firefoxScroll;

var FixedColumns = function ( dt, init ) {
	var that = this;

	if ( ! ( this instanceof FixedColumns ) ) {
		alert( "FixedColumns warning: FixedColumns must be initialised with the 'new' keyword." );
		return;
	}

	if ( init === undefined || init === true ) {
		init = {};
	}

	var camelToHungarian = $.fn.dataTable.camelToHungarian;
	if ( camelToHungarian ) {
		camelToHungarian( FixedColumns.defaults, FixedColumns.defaults, true );
		camelToHungarian( FixedColumns.defaults, init );
	}

	var dtSettings = new $.fn.dataTable.Api( dt ).settings()[0];

	this.s = {
		"dt": dtSettings,

		"iTableColumns": dtSettings.aoColumns.length,

		"aiOuterWidths": [],

		"aiInnerWidths": [],


		rtl: $(dtSettings.nTable).css('direction') === 'rtl'
	};


	this.dom = {
		"scroller": null,

		"header": null,

		"body": null,

		"footer": null,

		"grid": {
			"wrapper": null,

			"dt": null,

			"left": {
				"wrapper": null,
				"head": null,
				"body": null,
				"foot": null
			},

			"right": {
				"wrapper": null,
				"head": null,
				"body": null,
				"foot": null
			}
		},

		"clone": {
			"left": {
				"header": null,

				"body": null,

				"footer": null
			},

			"right": {
				"header": null,

				"body": null,

				"footer": null
			}
		}
	};

	if ( dtSettings._oFixedColumns ) {
		throw 'FixedColumns already initialised on this table';
	}

	dtSettings._oFixedColumns = this;

	if ( ! dtSettings._bInitComplete )
	{
		dtSettings.oApi._fnCallbackReg( dtSettings, 'aoInitComplete', function () {
			that._fnConstruct( init );
		}, 'FixedColumns' );
	}
	else
	{
		this._fnConstruct( init );
	}
};



$.extend( FixedColumns.prototype , {

	"fnUpdate": function ()
	{
		this._fnDraw( true );
	},


	"fnRedrawLayout": function ()
	{
		this._fnColCalc();
		this._fnGridLayout();
		this.fnUpdate();
	},


	"fnRecalculateHeight": function ( nTr )
	{
		delete nTr._DTTC_iHeight;
		nTr.style.height = 'auto';
	},


	"fnSetRowHeight": function ( nTarget, iHeight )
	{
		nTarget.style.height = iHeight+"px";
	},


	"fnGetPosition": function ( node )
	{
		var idx;
		var inst = this.s.dt.oInstance;

		if ( ! $(node).parents('.DTFC_Cloned').length )
		{
			return inst.fnGetPosition( node );
		}
		else
		{
			if ( node.nodeName.toLowerCase() === 'tr' ) {
				idx = $(node).index();
				return inst.fnGetPosition( $('tr', this.s.dt.nTBody)[ idx ] );
			}
			else
			{
				var colIdx = $(node).index();
				idx = $(node.parentNode).index();
				var row = inst.fnGetPosition( $('tr', this.s.dt.nTBody)[ idx ] );

				return [
					row,
					colIdx,
					inst.oApi._fnVisibleToColumnIndex( this.s.dt, colIdx )
				];
			}
		}
	},

	fnToFixedNode: function ( rowIdx, colIdx )
	{
		var found;

		if ( colIdx < this.s.iLeftColumns ) {
			found = $(this.dom.clone.left.body).find('[data-dt-row='+rowIdx+'][data-dt-column='+colIdx+']');
		}
		else if ( colIdx >= this.s.iRightColumns ) {
			found = $(this.dom.clone.right.body).find('[data-dt-row='+rowIdx+'][data-dt-column='+colIdx+']');
		}

		if ( found && found.length ) {
			return found[0];
		}

		var table = new $.fn.dataTable.Api(this.s.dt);
		return table.cell(rowIdx, colIdx).node();
	},



	"_fnConstruct": function ( oInit )
	{
		var i, iLen, iWidth,
			that = this;

		if ( typeof this.s.dt.oInstance.fnVersionCheck != 'function' ||
		     this.s.dt.oInstance.fnVersionCheck( '1.8.0' ) !== true )
		{
			alert( "FixedColumns "+FixedColumns.VERSION+" required DataTables 1.8.0 or later. "+
				"Please upgrade your DataTables installation" );
			return;
		}

		if ( this.s.dt.oScroll.sX === "" )
		{
			this.s.dt.oInstance.oApi._fnLog( this.s.dt, 1, "FixedColumns is not needed (no "+
				"x-scrolling in DataTables enabled), so no action will be taken. Use 'FixedHeader' for "+
				"column fixing when scrolling is not enabled" );
			return;
		}

		this.s = $.extend( true, this.s, FixedColumns.defaults, oInit );

		var classes = this.s.dt.oClasses;
		this.dom.grid.dt = $(this.s.dt.nTable).parents('div.'+classes.sScrollWrapper)[0];
		this.dom.scroller = $('div.'+classes.sScrollBody, this.dom.grid.dt )[0];

		this._fnColCalc();
		this._fnGridSetup();

		var mouseController;
		var mouseDown = false;

		$(this.s.dt.nTableWrapper).on( 'mousedown.DTFC', function (e) {
			if ( e.button === 0 ) {
				mouseDown = true;

				$(document).one( 'mouseup', function () {
					mouseDown = false;
				} );
			}
		} );

		$(this.dom.scroller)
			.on( 'mouseover.DTFC touchstart.DTFC', function () {
				if ( ! mouseDown ) {
					mouseController = 'main';
				}
			} )
			.on( 'scroll.DTFC', function (e) {
				if ( ! mouseController && e.originalEvent ) {
					mouseController = 'main';
				}

				if ( mouseController === 'main' || mouseController === 'key' ) {
					if ( that.s.iLeftColumns > 0 ) {
						that.dom.grid.left.liner.scrollTop = that.dom.scroller.scrollTop;
					}
					if ( that.s.iRightColumns > 0 ) {
						that.dom.grid.right.liner.scrollTop = that.dom.scroller.scrollTop;
					}
				}
			} );

		var wheelType = 'onwheel' in document.createElement('div') ?
			'wheel.DTFC' :
			'mousewheel.DTFC';

		if ( that.s.iLeftColumns > 0 ) {
			$(that.dom.grid.left.liner)
				.on( 'mouseover.DTFC touchstart.DTFC', function () {
					if ( ! mouseDown && mouseController !== 'key' ) {
						mouseController = 'left';
					}
				} )
				.on( 'scroll.DTFC', function ( e ) {
					if ( ! mouseController && e.originalEvent ) {
						mouseController = 'left';
					}

					if ( mouseController === 'left' ) {
						that.dom.scroller.scrollTop = that.dom.grid.left.liner.scrollTop;
						if ( that.s.iRightColumns > 0 ) {
							that.dom.grid.right.liner.scrollTop = that.dom.grid.left.liner.scrollTop;
						}
					}
				} )
				.on( wheelType, function(e) {
					mouseController = 'left';

					var xDelta = e.type === 'wheel' ?
						-e.originalEvent.deltaX :
						e.originalEvent.wheelDeltaX;
					that.dom.scroller.scrollLeft -= xDelta;
				} );

			$(that.dom.grid.left.head).on( 'mouseover.DTFC touchstart.DTFC', function () {
				mouseController = 'main';
			});
		}

		if ( that.s.iRightColumns > 0 ) {
			$(that.dom.grid.right.liner)
				.on( 'mouseover.DTFC touchstart.DTFC', function () {
					if ( ! mouseDown && mouseController !== 'key' ) {
						mouseController = 'right';
					}
				} )
				.on( 'scroll.DTFC', function ( e ) {
					if ( ! mouseController && e.originalEvent ) {
						mouseController = 'right';
					}

					if ( mouseController === 'right' ) {
						that.dom.scroller.scrollTop = that.dom.grid.right.liner.scrollTop;
						if ( that.s.iLeftColumns > 0 ) {
							that.dom.grid.left.liner.scrollTop = that.dom.grid.right.liner.scrollTop;
						}
					}
				} )
				.on( wheelType, function(e) {
					mouseController = 'right';

					var xDelta = e.type === 'wheel' ?
						-e.originalEvent.deltaX :
						e.originalEvent.wheelDeltaX;
					that.dom.scroller.scrollLeft -= xDelta;
				} );

			$(that.dom.grid.right.head).on( 'mouseover.DTFC touchstart.DTFC', function () {
				mouseController = 'main';
			});
		}

		$(window).on( 'resize.DTFC', function () {
			that._fnGridLayout.call( that );
		} );

		var bFirstDraw = true;
		var jqTable = $(this.s.dt.nTable);

		jqTable
			.on( 'draw.dt.DTFC', function () {
				that._fnColCalc();
				that._fnDraw.call( that, bFirstDraw );
				bFirstDraw = false;
			} )
			.on('key-focus.dt.DTFC', function () {
				mouseController = 'key';
			})
			.on( 'column-sizing.dt.DTFC', function () {
				that._fnColCalc();
				that._fnGridLayout( that );
			} )
			.on( 'column-visibility.dt.DTFC', function ( e, settings, column, vis, recalc ) {
				if ( recalc === undefined || recalc ) {
					that._fnColCalc();
					that._fnGridLayout( that );
					that._fnDraw( true );
				}
			} )
			.on( 'select.dt.DTFC deselect.dt.DTFC', function ( e, dt, type, indexes ) {
				if ( e.namespace === 'dt' ) {
					that._fnDraw( false );
				}
			} )
			.on( 'position.dts.dt.DTFC', function (e, tableTop) {
				if (that.dom.grid.left.body) {
					$(that.dom.grid.left.body).find('table').eq(0).css('top', tableTop);
				}

				if (that.dom.grid.right.body) {
					$(that.dom.grid.right.body).find('table').eq(0).css('top', tableTop);
				}
			} )
			.on( 'destroy.dt.DTFC', function () {
				jqTable.off( '.DTFC' );

				$(that.dom.scroller).off( '.DTFC' );
				$(window).off( '.DTFC' );
				$(that.s.dt.nTableWrapper).off( '.DTFC' );

				$(that.dom.grid.left.liner).off( '.DTFC '+wheelType );
				$(that.dom.grid.left.wrapper).remove();

				$(that.dom.grid.right.liner).off( '.DTFC '+wheelType );
				$(that.dom.grid.right.wrapper).remove();
			} );

		this._fnGridLayout();
		this.s.dt.oInstance.fnDraw(false);
	},


	"_fnColCalc": function ()
	{
		var that = this;
		var iLeftWidth = 0;
		var iRightWidth = 0;

		this.s.aiInnerWidths = [];
		this.s.aiOuterWidths = [];

		$.each( this.s.dt.aoColumns, function (i, col) {
			var th = $(col.nTh);
			var border;

			if ( ! th.filter(':visible').length ) {
				that.s.aiInnerWidths.push( 0 );
				that.s.aiOuterWidths.push( 0 );
			}
			else
			{
				var iWidth = th.outerWidth();

				if ( that.s.aiOuterWidths.length === 0 ) {
					border = $(that.s.dt.nTable).css('border-left-width');
					iWidth += typeof border === 'string' && border.indexOf('px') === -1 ?
						1 :
						parseInt( border, 10 );
				}

				if ( that.s.aiOuterWidths.length === that.s.dt.aoColumns.length-1 ) {
					border = $(that.s.dt.nTable).css('border-right-width');
					iWidth += typeof border === 'string' && border.indexOf('px') === -1 ?
						1 :
						parseInt( border, 10 );
				}

				that.s.aiOuterWidths.push( iWidth );
				that.s.aiInnerWidths.push( th.width() );

				if ( i < that.s.iLeftColumns )
				{
					iLeftWidth += iWidth;
				}

				if ( that.s.iTableColumns-that.s.iRightColumns <= i )
				{
					iRightWidth += iWidth;
				}
			}
		} );

		this.s.iLeftWidth = iLeftWidth;
		this.s.iRightWidth = iRightWidth;
	},


	"_fnGridSetup": function ()
	{
		var that = this;
		var oOverflow = this._fnDTOverflow();
		var block;

		this.dom.body = this.s.dt.nTable;
		this.dom.header = this.s.dt.nTHead.parentNode;
		this.dom.header.parentNode.parentNode.style.position = "relative";

		var nSWrapper =
			$('<div class="DTFC_ScrollWrapper" style="position:relative; clear:both;">'+
				'<div class="DTFC_LeftWrapper" style="position:absolute; top:0; left:0;" aria-hidden="true">'+
					'<div class="DTFC_LeftHeadWrapper" style="position:relative; top:0; left:0; overflow:hidden;"></div>'+
					'<div class="DTFC_LeftBodyWrapper" style="position:relative; top:0; left:0; height:0; overflow:hidden;">'+
						'<div class="DTFC_LeftBodyLiner" style="position:relative; top:0; left:0; overflow-y:scroll;"></div>'+
					'</div>'+
					'<div class="DTFC_LeftFootWrapper" style="position:relative; top:0; left:0; overflow:hidden;"></div>'+
				'</div>'+
				'<div class="DTFC_RightWrapper" style="position:absolute; top:0; right:0;" aria-hidden="true">'+
					'<div class="DTFC_RightHeadWrapper" style="position:relative; top:0; left:0;">'+
						'<div class="DTFC_RightHeadBlocker DTFC_Blocker" style="position:absolute; top:0; bottom:0;"></div>'+
					'</div>'+
					'<div class="DTFC_RightBodyWrapper" style="position:relative; top:0; left:0; height:0; overflow:hidden;">'+
						'<div class="DTFC_RightBodyLiner" style="position:relative; top:0; left:0; overflow-y:scroll;"></div>'+
					'</div>'+
					'<div class="DTFC_RightFootWrapper" style="position:relative; top:0; left:0;">'+
						'<div class="DTFC_RightFootBlocker DTFC_Blocker" style="position:absolute; top:0; bottom:0;"></div>'+
					'</div>'+
				'</div>'+
			'</div>')[0];
		var nLeft = nSWrapper.childNodes[0];
		var nRight = nSWrapper.childNodes[1];

		this.dom.grid.dt.parentNode.insertBefore( nSWrapper, this.dom.grid.dt );
		nSWrapper.appendChild( this.dom.grid.dt );

		this.dom.grid.wrapper = nSWrapper;

		if ( this.s.iLeftColumns > 0 )
		{
			this.dom.grid.left.wrapper = nLeft;
			this.dom.grid.left.head = nLeft.childNodes[0];
			this.dom.grid.left.body = nLeft.childNodes[1];
			this.dom.grid.left.liner = $('div.DTFC_LeftBodyLiner', nSWrapper)[0];

			nSWrapper.appendChild( nLeft );
		}

		if ( this.s.iRightColumns > 0 )
		{
			this.dom.grid.right.wrapper = nRight;
			this.dom.grid.right.head = nRight.childNodes[0];
			this.dom.grid.right.body = nRight.childNodes[1];
			this.dom.grid.right.liner = $('div.DTFC_RightBodyLiner', nSWrapper)[0];

			nRight.style.right = oOverflow.bar+"px";

			block = $('div.DTFC_RightHeadBlocker', nSWrapper)[0];
			block.style.width = oOverflow.bar+"px";
			block.style.right = -oOverflow.bar+"px";
			this.dom.grid.right.headBlock = block;

			block = $('div.DTFC_RightFootBlocker', nSWrapper)[0];
			block.style.width = oOverflow.bar+"px";
			block.style.right = -oOverflow.bar+"px";
			this.dom.grid.right.footBlock = block;

			nSWrapper.appendChild( nRight );
		}

		if ( this.s.dt.nTFoot )
		{
			this.dom.footer = this.s.dt.nTFoot.parentNode;
			if ( this.s.iLeftColumns > 0 )
			{
				this.dom.grid.left.foot = nLeft.childNodes[2];
			}
			if ( this.s.iRightColumns > 0 )
			{
				this.dom.grid.right.foot = nRight.childNodes[2];
			}
		}

		if ( this.s.rtl ) {
			$('div.DTFC_RightHeadBlocker', nSWrapper).css( {
				left: -oOverflow.bar+'px',
				right: ''
			} );
		}
	},


	"_fnGridLayout": function ()
	{
		var that = this;
		var oGrid = this.dom.grid;
		var iWidth = $(oGrid.wrapper).width();
		var iBodyHeight = this.s.dt.nTable.parentNode.offsetHeight;
		var iFullHeight = this.s.dt.nTable.parentNode.parentNode.offsetHeight;
		var oOverflow = this._fnDTOverflow();
		var iLeftWidth = this.s.iLeftWidth;
		var iRightWidth = this.s.iRightWidth;
		var rtl = $(this.dom.body).css('direction') === 'rtl';
		var wrapper;
		var scrollbarAdjust = function ( node, width ) {
			if ( ! oOverflow.bar ) {
				node.style.width = (width+20)+"px";
				node.style.paddingRight = "20px";
				node.style.boxSizing = "border-box";
			}
			else if ( that._firefoxScrollError() ) {
				if ( $(node).height() > 34 ) {
					node.style.width = (width+oOverflow.bar)+"px";
				}
			}
			else {
				node.style.width = (width+oOverflow.bar)+"px";
			}
		};

		if ( oOverflow.x )
		{
			iBodyHeight -= oOverflow.bar;
		}

		oGrid.wrapper.style.height = iFullHeight+"px";

		if ( this.s.iLeftColumns > 0 )
		{
			wrapper = oGrid.left.wrapper;
			wrapper.style.width = iLeftWidth+'px';
			wrapper.style.height = '1px';

			if ( rtl ) {
				wrapper.style.left = '';
				wrapper.style.right = 0;
			}
			else {
				wrapper.style.left = 0;
				wrapper.style.right = '';
			}

			oGrid.left.body.style.height = iBodyHeight+"px";
			if ( oGrid.left.foot ) {
				oGrid.left.foot.style.top = (oOverflow.x ? oOverflow.bar : 0)+"px"; 
			}

			scrollbarAdjust( oGrid.left.liner, iLeftWidth );
			oGrid.left.liner.style.height = iBodyHeight+"px";
			oGrid.left.liner.style.maxHeight = iBodyHeight+"px";
		}

		if ( this.s.iRightColumns > 0 )
		{
			wrapper = oGrid.right.wrapper;
			wrapper.style.width = iRightWidth+'px';
			wrapper.style.height = '1px';

			if ( this.s.rtl ) {
				wrapper.style.left = oOverflow.y ? oOverflow.bar+'px' : 0;
				wrapper.style.right = '';
			}
			else {
				wrapper.style.left = '';
				wrapper.style.right = oOverflow.y ? oOverflow.bar+'px' : 0;
			}

			oGrid.right.body.style.height = iBodyHeight+"px";
			if ( oGrid.right.foot ) {
				oGrid.right.foot.style.top = (oOverflow.x ? oOverflow.bar : 0)+"px";
			}

			scrollbarAdjust( oGrid.right.liner, iRightWidth );
			oGrid.right.liner.style.height = iBodyHeight+"px";
			oGrid.right.liner.style.maxHeight = iBodyHeight+"px";

			oGrid.right.headBlock.style.display = oOverflow.y ? 'block' : 'none';
			oGrid.right.footBlock.style.display = oOverflow.y ? 'block' : 'none';
		}
	},


	"_fnDTOverflow": function ()
	{
		var nTable = this.s.dt.nTable;
		var nTableScrollBody = nTable.parentNode;
		var out = {
			"x": false,
			"y": false,
			"bar": this.s.dt.oScroll.iBarWidth
		};

		if ( nTable.offsetWidth > nTableScrollBody.clientWidth )
		{
			out.x = true;
		}

		if ( nTable.offsetHeight > nTableScrollBody.clientHeight )
		{
			out.y = true;
		}

		return out;
	},


	"_fnDraw": function ( bAll )
	{
		this._fnGridLayout();
		this._fnCloneLeft( bAll );
		this._fnCloneRight( bAll );

		$(this.dom.scroller).trigger('scroll');

		if ( this.s.fnDrawCallback !== null )
		{
			this.s.fnDrawCallback.call( this, this.dom.clone.left, this.dom.clone.right );
		}

		$(this).trigger( 'draw.dtfc', {
			"leftClone": this.dom.clone.left,
			"rightClone": this.dom.clone.right
		} );
	},


	"_fnCloneRight": function ( bAll )
	{
		if ( this.s.iRightColumns <= 0 ) {
			return;
		}

		var that = this,
			i, jq,
			aiColumns = [];

		for ( i=this.s.iTableColumns-this.s.iRightColumns ; i<this.s.iTableColumns ; i++ ) {
			if ( this.s.dt.aoColumns[i].bVisible ) {
				aiColumns.push( i );
			}
		}

		this._fnClone( this.dom.clone.right, this.dom.grid.right, aiColumns, bAll );
	},


	"_fnCloneLeft": function ( bAll )
	{
		if ( this.s.iLeftColumns <= 0 ) {
			return;
		}

		var that = this,
			i, jq,
			aiColumns = [];

		for ( i=0 ; i<this.s.iLeftColumns ; i++ ) {
			if ( this.s.dt.aoColumns[i].bVisible ) {
				aiColumns.push( i );
			}
		}

		this._fnClone( this.dom.clone.left, this.dom.grid.left, aiColumns, bAll );
	},


	"_fnCopyLayout": function ( aoOriginal, aiColumns, events )
	{
		var aReturn = [];
		var aClones = [];
		var aCloned = [];

		for ( var i=0, iLen=aoOriginal.length ; i<iLen ; i++ )
		{
			var aRow = [];
			aRow.nTr = $(aoOriginal[i].nTr).clone(events, false)[0];

			for ( var j=0, jLen=this.s.iTableColumns ; j<jLen ; j++ )
			{
				if ( $.inArray( j, aiColumns ) === -1 )
				{
					continue;
				}

				var iCloned = $.inArray( aoOriginal[i][j].cell, aCloned );
				if ( iCloned === -1 )
				{
					var nClone = $(aoOriginal[i][j].cell).clone(events, false)[0];
					aClones.push( nClone );
					aCloned.push( aoOriginal[i][j].cell );

					aRow.push( {
						"cell": nClone,
						"unique": aoOriginal[i][j].unique
					} );
				}
				else
				{
					aRow.push( {
						"cell": aClones[ iCloned ],
						"unique": aoOriginal[i][j].unique
					} );
				}
			}

			aReturn.push( aRow );
		}

		return aReturn;
	},


	"_fnClone": function ( oClone, oGrid, aiColumns, bAll )
	{
		var that = this,
			i, iLen, j, jLen, jq, nTarget, iColumn, nClone, iIndex, aoCloneLayout,
			jqCloneThead, aoFixedHeader,
			dt = this.s.dt;

		if ( bAll )
		{
			$(oClone.header).remove();

			oClone.header = $(this.dom.header).clone(true, false)[0];
			oClone.header.className += " DTFC_Cloned";
			oClone.header.style.width = "100%";
			oGrid.head.appendChild( oClone.header );

			aoCloneLayout = this._fnCopyLayout( dt.aoHeader, aiColumns, true );
			jqCloneThead = $('>thead', oClone.header);
			jqCloneThead.empty();

			for ( i=0, iLen=aoCloneLayout.length ; i<iLen ; i++ )
			{
				jqCloneThead[0].appendChild( aoCloneLayout[i].nTr );
			}

			dt.oApi._fnDrawHead( dt, aoCloneLayout, true );
		}
		else
		{
			aoCloneLayout = this._fnCopyLayout( dt.aoHeader, aiColumns, false );
			aoFixedHeader=[];

			dt.oApi._fnDetectHeader( aoFixedHeader, $('>thead', oClone.header)[0] );

			for ( i=0, iLen=aoCloneLayout.length ; i<iLen ; i++ )
			{
				for ( j=0, jLen=aoCloneLayout[i].length ; j<jLen ; j++ )
				{
					aoFixedHeader[i][j].cell.className = aoCloneLayout[i][j].cell.className;

					$('span.DataTables_sort_icon', aoFixedHeader[i][j].cell).each( function () {
						this.className = $('span.DataTables_sort_icon', aoCloneLayout[i][j].cell)[0].className;
					} );
				}
			}
		}
		this._fnEqualiseHeights( 'thead', this.dom.header, oClone.header );

		if ( this.s.sHeightMatch == 'auto' )
		{
			$('>tbody>tr', that.dom.body).css('height', 'auto');
		}

		if ( oClone.body !== null )
		{
			$(oClone.body).remove();
			oClone.body = null;
		}

		oClone.body = $(this.dom.body).clone(true)[0];
		oClone.body.className += " DTFC_Cloned";
		oClone.body.style.paddingBottom = dt.oScroll.iBarWidth+"px";
		oClone.body.style.marginBottom = (dt.oScroll.iBarWidth*2)+"px"; 
		if ( oClone.body.getAttribute('id') !== null )
		{
			oClone.body.removeAttribute('id');
		}

		$('>thead>tr', oClone.body).empty();
		$('>tfoot', oClone.body).remove();

		var nBody = $('tbody', oClone.body)[0];
		$(nBody).empty();
		if ( dt.aiDisplay.length > 0 )
		{
			var nInnerThead = $('>thead>tr', oClone.body)[0];
			for ( iIndex=0 ; iIndex<aiColumns.length ; iIndex++ )
			{
				iColumn = aiColumns[iIndex];

				nClone = $(dt.aoColumns[iColumn].nTh).clone(true)[0];
				nClone.innerHTML = "";

				var oStyle = nClone.style;
				oStyle.paddingTop = "0";
				oStyle.paddingBottom = "0";
				oStyle.borderTopWidth = "0";
				oStyle.borderBottomWidth = "0";
				oStyle.height = 0;
				oStyle.width = that.s.aiInnerWidths[iColumn]+"px";

				nInnerThead.appendChild( nClone );
			}

			$('>tbody>tr', that.dom.body).each( function (z) {
				var i = that.s.dt.oFeatures.bServerSide===false ?
					that.s.dt.aiDisplay[ that.s.dt._iDisplayStart+z ] : z;
				var aTds = that.s.dt.aoData[ i ].anCells || $(this).children('td, th');

				var n = this.cloneNode(false);
				n.removeAttribute('id');
				n.setAttribute( 'data-dt-row', i );

				for ( iIndex=0 ; iIndex<aiColumns.length ; iIndex++ )
				{
					iColumn = aiColumns[iIndex];

					if ( aTds.length > 0 )
					{
						nClone = $( aTds[iColumn] ).clone(true, true)[0];
						nClone.removeAttribute( 'id' );
						nClone.setAttribute( 'data-dt-row', i );
						nClone.setAttribute( 'data-dt-column', iColumn );
						n.appendChild( nClone );
					}
				}
				nBody.appendChild( n );
			} );
		}
		else
		{
			$('>tbody>tr', that.dom.body).each( function (z) {
				nClone = this.cloneNode(true);
				nClone.className += ' DTFC_NoData';
				$('td', nClone).html('');
				nBody.appendChild( nClone );
			} );
		}

		oClone.body.style.width = "100%";
		oClone.body.style.margin = "0";
		oClone.body.style.padding = "0";

		if ( dt.oScroller !== undefined )
		{
			var scrollerForcer = dt.oScroller.dom.force;

			if ( ! oGrid.forcer ) {
				oGrid.forcer = scrollerForcer.cloneNode( true );
				oGrid.liner.appendChild( oGrid.forcer );
			}
			else {
				oGrid.forcer.style.height = scrollerForcer.style.height;
			}
		}

		oGrid.liner.appendChild( oClone.body );

		this._fnEqualiseHeights( 'tbody', that.dom.body, oClone.body );

		if ( dt.nTFoot !== null )
		{
			if ( bAll )
			{
				if ( oClone.footer !== null )
				{
					oClone.footer.parentNode.removeChild( oClone.footer );
				}
				oClone.footer = $(this.dom.footer).clone(true, true)[0];
				oClone.footer.className += " DTFC_Cloned";
				oClone.footer.style.width = "100%";
				oGrid.foot.appendChild( oClone.footer );

				aoCloneLayout = this._fnCopyLayout( dt.aoFooter, aiColumns, true );
				var jqCloneTfoot = $('>tfoot', oClone.footer);
				jqCloneTfoot.empty();

				for ( i=0, iLen=aoCloneLayout.length ; i<iLen ; i++ )
				{
					jqCloneTfoot[0].appendChild( aoCloneLayout[i].nTr );
				}
				dt.oApi._fnDrawHead( dt, aoCloneLayout, true );
			}
			else
			{
				aoCloneLayout = this._fnCopyLayout( dt.aoFooter, aiColumns, false );
				var aoCurrFooter=[];

				dt.oApi._fnDetectHeader( aoCurrFooter, $('>tfoot', oClone.footer)[0] );

				for ( i=0, iLen=aoCloneLayout.length ; i<iLen ; i++ )
				{
					for ( j=0, jLen=aoCloneLayout[i].length ; j<jLen ; j++ )
					{
						aoCurrFooter[i][j].cell.className = aoCloneLayout[i][j].cell.className;
					}
				}
			}
			this._fnEqualiseHeights( 'tfoot', this.dom.footer, oClone.footer );
		}

		var anUnique = dt.oApi._fnGetUniqueThs( dt, $('>thead', oClone.header)[0] );
		$(anUnique).each( function (i) {
			iColumn = aiColumns[i];
			this.style.width = that.s.aiInnerWidths[iColumn]+"px";
		} );

		if ( that.s.dt.nTFoot !== null )
		{
			anUnique = dt.oApi._fnGetUniqueThs( dt, $('>tfoot', oClone.footer)[0] );
			$(anUnique).each( function (i) {
				iColumn = aiColumns[i];
				this.style.width = that.s.aiInnerWidths[iColumn]+"px";
			} );
		}
	},


	"_fnGetTrNodes": function ( nIn )
	{
		var aOut = [];
		for ( var i=0, iLen=nIn.childNodes.length ; i<iLen ; i++ )
		{
			if ( nIn.childNodes[i].nodeName.toUpperCase() == "TR" )
			{
				aOut.push( nIn.childNodes[i] );
			}
		}
		return aOut;
	},


	"_fnEqualiseHeights": function ( nodeName, original, clone )
	{
		if ( this.s.sHeightMatch == 'none' && nodeName !== 'thead' && nodeName !== 'tfoot' )
		{
			return;
		}

		var that = this,
			i, iLen, iHeight, iHeight2, iHeightOriginal, iHeightClone,
			rootOriginal = original.getElementsByTagName(nodeName)[0],
			rootClone    = clone.getElementsByTagName(nodeName)[0],
			jqBoxHack    = $('>'+nodeName+'>tr:eq(0)', original).children(':first'),
			iBoxHack     = jqBoxHack.outerHeight() - jqBoxHack.height(),
			anOriginal   = this._fnGetTrNodes( rootOriginal ),
			anClone      = this._fnGetTrNodes( rootClone ),
			heights      = [];

		for ( i=0, iLen=anClone.length ; i<iLen ; i++ )
		{
			iHeightOriginal = anOriginal[i].offsetHeight;
			iHeightClone = anClone[i].offsetHeight;
			iHeight = iHeightClone > iHeightOriginal ? iHeightClone : iHeightOriginal;

			if ( this.s.sHeightMatch == 'semiauto' )
			{
				anOriginal[i]._DTTC_iHeight = iHeight;
			}

			heights.push( iHeight );
		}

		for ( i=0, iLen=anClone.length ; i<iLen ; i++ )
		{
			anClone[i].style.height = heights[i]+"px";
			anOriginal[i].style.height = heights[i]+"px";
		}
	},

	_firefoxScrollError: function () {
		if ( _firefoxScroll === undefined ) {
			var test = $('<div/>')
				.css( {
					position: 'absolute',
					top: 0,
					left: 0,
					height: 10,
					width: 50,
					overflow: 'scroll'
				} )
				.appendTo( 'body' );

			_firefoxScroll = (
				test[0].clientWidth === test[0].offsetWidth && this._fnDTOverflow().bar !== 0
			);

			test.remove();
		}

		return _firefoxScroll;
	}
} );




FixedColumns.defaults = {
	"iLeftColumns": 1,

	"iRightColumns": 0,

	"fnDrawCallback": null,

	"sHeightMatch": "semiauto"
};





FixedColumns.version = "3.3.2";




DataTable.Api.register( 'fixedColumns()', function () {
	return this;
} );

DataTable.Api.register( 'fixedColumns().update()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx._oFixedColumns ) {
			ctx._oFixedColumns.fnUpdate();
		}
	} );
} );

DataTable.Api.register( 'fixedColumns().relayout()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx._oFixedColumns ) {
			ctx._oFixedColumns.fnRedrawLayout();
		}
	} );
} );

DataTable.Api.register( 'rows().recalcHeight()', function () {
	return this.iterator( 'row', function ( ctx, idx ) {
		if ( ctx._oFixedColumns ) {
			ctx._oFixedColumns.fnRecalculateHeight( this.row(idx).node() );
		}
	} );
} );

DataTable.Api.register( 'fixedColumns().rowIndex()', function ( row ) {
	row = $(row);

	return row.parents('.DTFC_Cloned').length ?
		this.rows( { page: 'current' } ).indexes()[ row.index() ] :
		this.row( row ).index();
} );

DataTable.Api.register( 'fixedColumns().cellIndex()', function ( cell ) {
	cell = $(cell);

	if ( cell.parents('.DTFC_Cloned').length ) {
		var rowClonedIdx = cell.parent().index();
		var rowIdx = this.rows( { page: 'current' } ).indexes()[ rowClonedIdx ];
		var columnIdx;

		if ( cell.parents('.DTFC_LeftWrapper').length ) {
			columnIdx = cell.index();
		}
		else {
			var columns = this.columns().flatten().length;
			columnIdx = columns - this.context[0]._oFixedColumns.s.iRightColumns + cell.index();
		}

		return {
			row: rowIdx,
			column: this.column.index( 'toData', columnIdx ),
			columnVisible: columnIdx
		};
	}
	else {
		return this.cell( cell ).index();
	}
} );

DataTable.Api.registerPlural( 'cells().fixedNodes()', 'cell().fixedNode()', function () {
	return this.iterator( 'cell', function ( settings, row, column ) {
		return settings._oFixedColumns
			? settings._oFixedColumns.fnToFixedNode( row, column )
			: this.cell(row, column).node();
	}, 1 );
} );





$(document).on( 'init.dt.fixedColumns', function (e, settings) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var init = settings.oInit.fixedColumns;
	var defaults = DataTable.defaults.fixedColumns;

	if ( init || defaults ) {
		var opts = $.extend( {}, init, defaults );

		if ( init !== false ) {
			new FixedColumns( settings, opts );
		}
	}
} );



$.fn.dataTable.FixedColumns = FixedColumns;
$.fn.DataTable.FixedColumns = FixedColumns;

return FixedColumns;
}));




(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


var _instCounter = 0;

var FixedHeader = function ( dt, config ) {
	if ( ! (this instanceof FixedHeader) ) {
		throw "FixedHeader must be initialised with the 'new' keyword.";
	}

	if ( config === true ) {
		config = {};
	}

	dt = new DataTable.Api( dt );

	this.c = $.extend( true, {}, FixedHeader.defaults, config );

	this.s = {
		dt: dt,
		position: {
			theadTop: 0,
			tbodyTop: 0,
			tfootTop: 0,
			tfootBottom: 0,
			width: 0,
			left: 0,
			tfootHeight: 0,
			theadHeight: 0,
			windowHeight: $(window).height(),
			visible: true
		},
		headerMode: null,
		footerMode: null,
		autoWidth: dt.settings()[0].oFeatures.bAutoWidth,
		namespace: '.dtfc'+(_instCounter++),
		scrollLeft: {
			header: -1,
			footer: -1
		},
		enable: true
	};

	this.dom = {
		floatingHeader: null,
		thead: $(dt.table().header()),
		tbody: $(dt.table().body()),
		tfoot: $(dt.table().footer()),
		header: {
			host: null,
			floating: null,
			placeholder: null
		},
		footer: {
			host: null,
			floating: null,
			placeholder: null
		}
	};

	this.dom.header.host = this.dom.thead.parent();
	this.dom.footer.host = this.dom.tfoot.parent();

	var dtSettings = dt.settings()[0];
	if ( dtSettings._fixedHeader ) {
		throw "FixedHeader already initialised on table "+dtSettings.nTable.id;
	}

	dtSettings._fixedHeader = this;

	this._constructor();
};


$.extend( FixedHeader.prototype, {

	destroy: function () {
		this.s.dt.off( '.dtfc' );
		$(window).off( this.s.namespace );

		if ( this.c.header ) {
			this._modeChange( 'in-place', 'header', true );
		}

		if ( this.c.footer && this.dom.tfoot.length ) {
			this._modeChange( 'in-place', 'footer', true );
		}
	},

	enable: function ( enable, update )
	{
		this.s.enable = enable;

		if ( update || update === undefined ) {
			this._positions();
			this._scroll( true );
		}
	},

	enabled: function ()
	{
		return this.s.enable;
	},

	headerOffset: function ( offset )
	{
		if ( offset !== undefined ) {
			this.c.headerOffset = offset;
			this.update();
		}

		return this.c.headerOffset;
	},

	footerOffset: function ( offset )
	{
		if ( offset !== undefined ) {
			this.c.footerOffset = offset;
			this.update();
		}

		return this.c.footerOffset;
	},


	update: function ()
	{
		var table = this.s.dt.table().node();

		if ( $(table).is(':visible') ) {
			this.enable( true, false );
		}
		else {
			this.enable( false, false );
		}

		this._positions();
		this._scroll( true );
	},



	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;

		$(window)
			.on( 'scroll'+this.s.namespace, function () {
				that._scroll();
			} )
			.on( 'resize'+this.s.namespace, DataTable.util.throttle( function () {
				that.s.position.windowHeight = $(window).height();
				that.update();
			}, 50 ) );

		var autoHeader = $('.fh-fixedHeader');
		if ( ! this.c.headerOffset && autoHeader.length ) {
			this.c.headerOffset = autoHeader.outerHeight();
		}

		var autoFooter = $('.fh-fixedFooter');
		if ( ! this.c.footerOffset && autoFooter.length ) {
			this.c.footerOffset = autoFooter.outerHeight();
		}

		dt.on( 'column-reorder.dt.dtfc column-visibility.dt.dtfc draw.dt.dtfc column-sizing.dt.dtfc responsive-display.dt.dtfc', function () {
			that.update();
		} );

		dt.on( 'destroy.dtfc', function () {
			that.destroy();
		} );

		this._positions();
		this._scroll();
	},



	_clone: function ( item, force )
	{
		var dt = this.s.dt;
		var itemDom = this.dom[ item ];
		var itemElement = item === 'header' ?
			this.dom.thead :
			this.dom.tfoot;

		if ( ! force && itemDom.floating ) {
			itemDom.floating.removeClass( 'fixedHeader-floating fixedHeader-locked' );
		}
		else {
			if ( itemDom.floating ) {
				itemDom.placeholder.remove();
				this._unsize( item );
				itemDom.floating.children().detach();
				itemDom.floating.remove();
			}

			itemDom.floating = $( dt.table().node().cloneNode( false ) )
				.css( 'table-layout', 'fixed' )
				.attr( 'aria-hidden', 'true' )
				.removeAttr( 'id' )
				.append( itemElement )
				.appendTo( 'body' );

			itemDom.placeholder = itemElement.clone( false );
			itemDom.placeholder
				.find( '*[id]' )
				.removeAttr( 'id' );

			itemDom.host.prepend( itemDom.placeholder );

			this._matchWidths( itemDom.placeholder, itemDom.floating );
		}
	},

	_matchWidths: function ( from, to ) {
		var get = function ( name ) {
			return $(name, from)
				.map( function () {
					return $(this).css('width').replace(/[^\d\.]/g, '') * 1;
				} ).toArray();
		};

		var set = function ( name, toWidths ) {
			$(name, to).each( function ( i ) {
				$(this).css( {
					width: toWidths[i],
					minWidth: toWidths[i]
				} );
			} );
		};

		var thWidths = get( 'th' );
		var tdWidths = get( 'td' );

		set( 'th', thWidths );
		set( 'td', tdWidths );
	},

	_unsize: function ( item ) {
		var el = this.dom[ item ].floating;

		if ( el && (item === 'footer' || (item === 'header' && ! this.s.autoWidth)) ) {
			$('th, td', el).css( {
				width: '',
				minWidth: ''
			} );
		}
		else if ( el && item === 'header' ) {
			$('th, td', el).css( 'min-width', '' );
		}
	},

	_horizontal: function ( item, scrollLeft )
	{
		var itemDom = this.dom[ item ];
		var position = this.s.position;
		var lastScrollLeft = this.s.scrollLeft;

		if ( itemDom.floating && lastScrollLeft[ item ] !== scrollLeft ) {
			itemDom.floating.css( 'left', position.left - scrollLeft );

			lastScrollLeft[ item ] = scrollLeft;
		}
	},

	_modeChange: function ( mode, item, forceChange )
	{
		var dt = this.s.dt;
		var itemDom = this.dom[ item ];
		var position = this.s.position;

		var importantWidth = function (w) {
			itemDom.floating.attr('style', function(i,s) {
				return (s || '') + 'width: '+w+'px !important;';
			});
		};

		var tablePart = this.dom[ item==='footer' ? 'tfoot' : 'thead' ];
		var focus = $.contains( tablePart[0], document.activeElement ) ?
			document.activeElement :
			null;

				if ( focus ) {
			focus.blur();
		}

		if ( mode === 'in-place' ) {
			if ( itemDom.placeholder ) {
				itemDom.placeholder.remove();
				itemDom.placeholder = null;
			}

			this._unsize( item );

			if ( item === 'header' ) {
				itemDom.host.prepend( tablePart );
			}
			else {
				itemDom.host.append( tablePart );
			}

			if ( itemDom.floating ) {
				itemDom.floating.remove();
				itemDom.floating = null;
			}
		}
		else if ( mode === 'in' ) {
			this._clone( item, forceChange );

			itemDom.floating
				.addClass( 'fixedHeader-floating' )
				.css( item === 'header' ? 'top' : 'bottom', this.c[item+'Offset'] )
				.css( 'left', position.left+'px' );

			importantWidth(position.width);

			if ( item === 'footer' ) {
				itemDom.floating.css( 'top', '' );
			}
		}
		else if ( mode === 'below' ) { 
			this._clone( item, forceChange );

			itemDom.floating
				.addClass( 'fixedHeader-locked' )
				.css( 'top', position.tfootTop - position.theadHeight )
				.css( 'left', position.left+'px' );

			importantWidth(position.width);
		}
		else if ( mode === 'above' ) { 
			this._clone( item, forceChange );

			itemDom.floating
				.addClass( 'fixedHeader-locked' )
				.css( 'top', position.tbodyTop )
				.css( 'left', position.left+'px' );

			importantWidth(position.width);
		}

		if ( focus && focus !== document.activeElement ) {
			setTimeout( function () {
				focus.focus();
			}, 10 );
		}

		this.s.scrollLeft.header = -1;
		this.s.scrollLeft.footer = -1;
		this.s[item+'Mode'] = mode;
	},

	_positions: function ()
	{
		var dt = this.s.dt;
		var table = dt.table();
		var position = this.s.position;
		var dom = this.dom;
		var tableNode = $(table.node());

		var thead = tableNode.children('thead');
		var tfoot = tableNode.children('tfoot');
		var tbody = dom.tbody;

		position.visible = tableNode.is(':visible');
		position.width = tableNode.outerWidth();
		position.left = tableNode.offset().left;
		position.theadTop = thead.offset().top;
		position.tbodyTop = tbody.offset().top;
		position.tbodyHeight = tbody.outerHeight();
		position.theadHeight = position.tbodyTop - position.theadTop;

		if ( tfoot.length ) {
			position.tfootTop = tfoot.offset().top;
			position.tfootBottom = position.tfootTop + tfoot.outerHeight();
			position.tfootHeight = position.tfootBottom - position.tfootTop;
		}
		else {
			position.tfootTop = position.tbodyTop + tbody.outerHeight();
			position.tfootBottom = position.tfootTop;
			position.tfootHeight = position.tfootTop;
		}
	},


	_scroll: function ( forceChange )
	{
		var windowTop = $(document).scrollTop();
		var windowLeft = $(document).scrollLeft();
		var position = this.s.position;
		var headerMode, footerMode;

		if ( this.c.header ) {
			if ( ! this.s.enable ) {
				headerMode = 'in-place';
			}
			else if ( ! position.visible || windowTop <= position.theadTop - this.c.headerOffset ) {
				headerMode = 'in-place';
			}
			else if ( windowTop <= position.tfootTop - position.theadHeight - this.c.headerOffset ) {
				headerMode = 'in';
			}
			else {
				headerMode = 'below';
			}

			if ( forceChange || headerMode !== this.s.headerMode ) {
				this._modeChange( headerMode, 'header', forceChange );
			}

			this._horizontal( 'header', windowLeft );
		}

		if ( this.c.footer && this.dom.tfoot.length ) {
			if ( ! this.s.enable ) {
				footerMode = 'in-place';
			}
			else if ( ! position.visible || windowTop + position.windowHeight >= position.tfootBottom + this.c.footerOffset ) {
				footerMode = 'in-place';
			}
			else if ( position.windowHeight + windowTop > position.tbodyTop + position.tfootHeight + this.c.footerOffset ) {
				footerMode = 'in';
			}
			else {
				footerMode = 'above';
			}

			if ( forceChange || footerMode !== this.s.footerMode ) {
				this._modeChange( footerMode, 'footer', forceChange );
			}

			this._horizontal( 'footer', windowLeft );
		}
	}
} );


FixedHeader.version = "3.1.8";

FixedHeader.defaults = {
	header: true,
	footer: false,
	headerOffset: 0,
	footerOffset: 0
};



$.fn.dataTable.FixedHeader = FixedHeader;
$.fn.DataTable.FixedHeader = FixedHeader;


$(document).on( 'init.dt.dtfh', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var init = settings.oInit.fixedHeader;
	var defaults = DataTable.defaults.fixedHeader;

	if ( (init || defaults) && ! settings._fixedHeader ) {
		var opts = $.extend( {}, defaults, init );

		if ( init !== false ) {
			new FixedHeader( settings, opts );
		}
	}
} );

DataTable.Api.register( 'fixedHeader()', function () {} );

DataTable.Api.register( 'fixedHeader.adjust()', function () {
	return this.iterator( 'table', function ( ctx ) {
		var fh = ctx._fixedHeader;

		if ( fh ) {
			fh.update();
		}
	} );
} );

DataTable.Api.register( 'fixedHeader.enable()', function ( flag ) {
	return this.iterator( 'table', function ( ctx ) {
		var fh = ctx._fixedHeader;

		flag = ( flag !== undefined ? flag : true );
		if ( fh && flag !== fh.enabled() ) {
			fh.enable( flag );
		}
	} );
} );

DataTable.Api.register( 'fixedHeader.enabled()', function () {
	if ( this.context.length ) {
		var fh = this.context[0]._fixedHeader;

		if ( fh ) {
			return fh.enabled();
		}
	}

	return false;
} );

DataTable.Api.register( 'fixedHeader.disable()', function ( ) {
	return this.iterator( 'table', function ( ctx ) {
		var fh = ctx._fixedHeader;

		if ( fh && fh.enabled() ) {
			fh.enable( false );
		}
	} );
} );

$.each( ['header', 'footer'], function ( i, el ) {
	DataTable.Api.register( 'fixedHeader.'+el+'Offset()', function ( offset ) {
		var ctx = this.context;

		if ( offset === undefined ) {
			return ctx.length && ctx[0]._fixedHeader ?
				ctx[0]._fixedHeader[el +'Offset']() :
				undefined;
		}

		return this.iterator( 'table', function ( ctx ) {
			var fh = ctx._fixedHeader;

			if ( fh ) {
				fh[ el +'Offset' ]( offset );
			}
		} );
	} );
} );


return FixedHeader;
}));



(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


var Responsive = function ( settings, opts ) {
	if ( ! DataTable.versionCheck || ! DataTable.versionCheck( '1.10.10' ) ) {
		throw 'DataTables Responsive requires DataTables 1.10.10 or newer';
	}

	this.s = {
		dt: new DataTable.Api( settings ),
		columns: [],
		current: []
	};

	if ( this.s.dt.settings()[0].responsive ) {
		return;
	}

	if ( opts && typeof opts.details === 'string' ) {
		opts.details = { type: opts.details };
	}
	else if ( opts && opts.details === false ) {
		opts.details = { type: false };
	}
	else if ( opts && opts.details === true ) {
		opts.details = { type: 'inline' };
	}

	this.c = $.extend( true, {}, Responsive.defaults, DataTable.defaults.responsive, opts );
	settings.responsive = this;
	this._constructor();
};

$.extend( Responsive.prototype, {

	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var dtPrivateSettings = dt.settings()[0];
		var oldWindowWidth = $(window).innerWidth();

		dt.settings()[0]._responsive = this;

		$(window).on( 'resize.dtr orientationchange.dtr', DataTable.util.throttle( function () {
			var width = $(window).innerWidth();

			if ( width !== oldWindowWidth ) {
				that._resize();
				oldWindowWidth = width;
			}
		} ) );

		dtPrivateSettings.oApi._fnCallbackReg( dtPrivateSettings, 'aoRowCreatedCallback', function (tr, data, idx) {
			if ( $.inArray( false, that.s.current ) !== -1 ) {
				$('>td, >th', tr).each( function ( i ) {
					var idx = dt.column.index( 'toData', i );

					if ( that.s.current[idx] === false ) {
						$(this).css('display', 'none');
					}
				} );
			}
		} );

		dt.on( 'destroy.dtr', function () {
			dt.off( '.dtr' );
			$( dt.table().body() ).off( '.dtr' );
			$(window).off( 'resize.dtr orientationchange.dtr' );
			dt.cells('.dtr-control').nodes().to$().removeClass('dtr-control');

			$.each( that.s.current, function ( i, val ) {
				if ( val === false ) {
					that._setColumnVis( i, true );
				}
			} );
		} );

		this.c.breakpoints.sort( function (a, b) {
			return a.width < b.width ? 1 :
				a.width > b.width ? -1 : 0;
		} );

		this._classLogic();
		this._resizeAuto();

		var details = this.c.details;

		if ( details.type !== false ) {
			that._detailsInit();

			dt.on( 'column-visibility.dtr', function () {
				if ( that._timer ) {
					clearTimeout( that._timer );
				}

				that._timer = setTimeout( function () {
					that._timer = null;

					that._classLogic();
					that._resizeAuto();
					that._resize(true);

					that._redrawChildren();
				}, 100 );
			} );

			dt.on( 'draw.dtr', function () {
				that._redrawChildren();
			} );

			$(dt.table().node()).addClass( 'dtr-'+details.type );
		}

		dt.on( 'column-reorder.dtr', function (e, settings, details) {
			that._classLogic();
			that._resizeAuto();
			that._resize(true);
		} );

		dt.on( 'column-sizing.dtr', function () {
			that._resizeAuto();
			that._resize();
		});

		dt.on( 'preXhr.dtr', function () {
			var rowIds = [];
			dt.rows().every( function () {
				if ( this.child.isShown() ) {
					rowIds.push( this.id(true) );
				}
			} );

			dt.one( 'draw.dtr', function () {
				that._resizeAuto();
				that._resize();

				dt.rows( rowIds ).every( function () {
					that._detailsDisplay( this, false );
				} );
			} );
		});

		dt
			.on( 'draw.dtr', function () {
				that._controlClass();
			})
			.on( 'init.dtr', function (e, settings, details) {
				if ( e.namespace !== 'dt' ) {
					return;
				}

				that._resizeAuto();
				that._resize();

				if ( $.inArray( false, that.s.current ) ) {
					dt.columns.adjust();
				}
			} );

		this._resize();
	},



	_columnsVisiblity: function ( breakpoint )
	{
		var dt = this.s.dt;
		var columns = this.s.columns;
		var i, ien;

		var order = columns
			.map( function ( col, idx ) {
				return {
					columnIdx: idx,
					priority: col.priority
				};
			} )
			.sort( function ( a, b ) {
				if ( a.priority !== b.priority ) {
					return a.priority - b.priority;
				}
				return a.columnIdx - b.columnIdx;
			} );

		var display = $.map( columns, function ( col, i ) {
			if ( dt.column(i).visible() === false ) {
				return 'not-visible';
			}
			return col.auto && col.minWidth === null ?
				false :
				col.auto === true ?
					'-' :
					$.inArray( breakpoint, col.includeIn ) !== -1;
		} );

		var requiredWidth = 0;
		for ( i=0, ien=display.length ; i<ien ; i++ ) {
			if ( display[i] === true ) {
				requiredWidth += columns[i].minWidth;
			}
		}

		var scrolling = dt.settings()[0].oScroll;
		var bar = scrolling.sY || scrolling.sX ? scrolling.iBarWidth : 0;
		var widthAvailable = dt.table().container().offsetWidth - bar;
		var usedWidth = widthAvailable - requiredWidth;

		for ( i=0, ien=display.length ; i<ien ; i++ ) {
			if ( columns[i].control ) {
				usedWidth -= columns[i].minWidth;
			}
		}

		var empty = false;
		for ( i=0, ien=order.length ; i<ien ; i++ ) {
			var colIdx = order[i].columnIdx;

			if ( display[colIdx] === '-' && ! columns[colIdx].control && columns[colIdx].minWidth ) {
				if ( empty || usedWidth - columns[colIdx].minWidth < 0 ) {
					empty = true;
					display[colIdx] = false;
				}
				else {
					display[colIdx] = true;
				}

				usedWidth -= columns[colIdx].minWidth;
			}
		}

		var showControl = false;

		for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			if ( ! columns[i].control && ! columns[i].never && display[i] === false ) {
				showControl = true;
				break;
			}
		}

		for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			if ( columns[i].control ) {
				display[i] = showControl;
			}

			if ( display[i] === 'not-visible' ) {
				display[i] = false;
			}
		}

		if ( $.inArray( true, display ) === -1 ) {
			display[0] = true;
		}

		return display;
	},


	_classLogic: function ()
	{
		var that = this;
		var calc = {};
		var breakpoints = this.c.breakpoints;
		var dt = this.s.dt;
		var columns = dt.columns().eq(0).map( function (i) {
			var column = this.column(i);
			var className = column.header().className;
			var priority = dt.settings()[0].aoColumns[i].responsivePriority;
			var dataPriority = column.header().getAttribute('data-priority');

			if ( priority === undefined ) {
				priority = dataPriority === undefined || dataPriority === null?
					10000 :
					dataPriority * 1;
			}

			return {
				className: className,
				includeIn: [],
				auto:      false,
				control:   false,
				never:     className.match(/\bnever\b/) ? true : false,
				priority:  priority
			};
		} );

		var add = function ( colIdx, name ) {
			var includeIn = columns[ colIdx ].includeIn;

			if ( $.inArray( name, includeIn ) === -1 ) {
				includeIn.push( name );
			}
		};

		var column = function ( colIdx, name, operator, matched ) {
			var size, i, ien;

			if ( ! operator ) {
				columns[ colIdx ].includeIn.push( name );
			}
			else if ( operator === 'max-' ) {
				size = that._find( name ).width;

				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].width <= size ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
			else if ( operator === 'min-' ) {
				size = that._find( name ).width;

				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].width >= size ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
			else if ( operator === 'not-' ) {
				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].name.indexOf( matched ) === -1 ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
		};

		columns.each( function ( col, i ) {
			var classNames = col.className.split(' ');
			var hasClass = false;

			for ( var k=0, ken=classNames.length ; k<ken ; k++ ) {
				var className = classNames[k].trim();

				if ( className === 'all' ) {
					hasClass = true;
					col.includeIn = $.map( breakpoints, function (a) {
						return a.name;
					} );
					return;
				}
				else if ( className === 'none' || col.never ) {
					hasClass = true;
					return;
				}
				else if ( className === 'control' || className === 'dtr-control' ) {
					hasClass = true;
					col.control = true;
					return;
				}

				$.each( breakpoints, function ( j, breakpoint ) {
					var brokenPoint = breakpoint.name.split('-');
					var re = new RegExp( '(min\\-|max\\-|not\\-)?('+brokenPoint[0]+')(\\-[_a-zA-Z0-9])?' );
					var match = className.match( re );

					if ( match ) {
						hasClass = true;

						if ( match[2] === brokenPoint[0] && match[3] === '-'+brokenPoint[1] ) {
							column( i, breakpoint.name, match[1], match[2]+match[3] );
						}
						else if ( match[2] === brokenPoint[0] && ! match[3] ) {
							column( i, breakpoint.name, match[1], match[2] );
						}
					}
				} );
			}

			if ( ! hasClass ) {
				col.auto = true;
			}
		} );

		this.s.columns = columns;
	},

	_controlClass: function ()
	{
		if ( this.c.details.type === 'inline' ) {
			var dt = this.s.dt;
			var columnsVis = this.s.current;
			var firstVisible = $.inArray(true, columnsVis);

			dt.cells(
				null,
				function(idx) {
					return idx !== firstVisible;
				},
				{page: 'current'}
			)
				.nodes()
				.to$()
				.filter('.dtr-control')
				.removeClass('dtr-control');

			dt.cells(null, firstVisible, {page: 'current'})
				.nodes()
				.to$()
				.addClass('dtr-control');
		}
	},

	_detailsDisplay: function ( row, update )
	{
		var that = this;
		var dt = this.s.dt;
		var details = this.c.details;

		if ( details && details.type !== false ) {
			var res = details.display( row, update, function () {
				return details.renderer(
					dt, row[0], that._detailsObj(row[0])
				);
			} );

			if ( res === true || res === false ) {
				$(dt.table().node()).triggerHandler( 'responsive-display.dt', [dt, row, res, update] );
			}
		}
	},


	_detailsInit: function ()
	{
		var that    = this;
		var dt      = this.s.dt;
		var details = this.c.details;

		if ( details.type === 'inline' ) {
			details.target = 'td.dtr-control, th.dtr-control';
		}

		dt.on( 'draw.dtr', function () {
			that._tabIndexes();
		} );
		that._tabIndexes(); 

		$( dt.table().body() ).on( 'keyup.dtr', 'td, th', function (e) {
			if ( e.keyCode === 13 && $(this).data('dtr-keyboard') ) {
				$(this).click();
			}
		} );

		var target   = details.target;
		var selector = typeof target === 'string' ? target : 'td, th';

		if ( target !== undefined || target !== null ) {
			$( dt.table().body() )
				.on( 'click.dtr mousedown.dtr mouseup.dtr', selector, function (e) {
					if ( ! $(dt.table().node()).hasClass('collapsed' ) ) {
						return;
					}

					if ( $.inArray( $(this).closest('tr').get(0), dt.rows().nodes().toArray() ) === -1 ) {
						return;
					}

					if ( typeof target === 'number' ) {
						var targetIdx = target < 0 ?
							dt.columns().eq(0).length + target :
							target;

						if ( dt.cell( this ).index().column !== targetIdx ) {
							return;
						}
					}

					var row = dt.row( $(this).closest('tr') );

					if ( e.type === 'click' ) {
						that._detailsDisplay( row, false );
					}
					else if ( e.type === 'mousedown' ) {
						$(this).css('outline', 'none');
					}
					else if ( e.type === 'mouseup' ) {
						$(this).trigger('blur').css('outline', '');
					}
				} );
		}
	},


	_detailsObj: function ( rowIdx )
	{
		var that = this;
		var dt = this.s.dt;

		return $.map( this.s.columns, function( col, i ) {
			if ( col.never || col.control ) {
				return;
			}

			var dtCol = dt.settings()[0].aoColumns[ i ];

			return {
				className:   dtCol.sClass,
				columnIndex: i,
				data:        dt.cell( rowIdx, i ).render( that.c.orthogonal ),
				hidden:      dt.column( i ).visible() && !that.s.current[ i ],
				rowIndex:    rowIdx,
				title:       dtCol.sTitle !== null ?
					dtCol.sTitle :
					$(dt.column(i).header()).text()
			};
		} );
	},


	_find: function ( name )
	{
		var breakpoints = this.c.breakpoints;

		for ( var i=0, ien=breakpoints.length ; i<ien ; i++ ) {
			if ( breakpoints[i].name === name ) {
				return breakpoints[i];
			}
		}
	},


	_redrawChildren: function ()
	{
		var that = this;
		var dt = this.s.dt;

		dt.rows( {page: 'current'} ).iterator( 'row', function ( settings, idx ) {
			var row = dt.row( idx );

			that._detailsDisplay( dt.row( idx ), true );
		} );
	},


	_resize: function (forceRedraw)
	{
		var that = this;
		var dt = this.s.dt;
		var width = $(window).innerWidth();
		var breakpoints = this.c.breakpoints;
		var breakpoint = breakpoints[0].name;
		var columns = this.s.columns;
		var i, ien;
		var oldVis = this.s.current.slice();

		for ( i=breakpoints.length-1 ; i>=0 ; i-- ) {
			if ( width <= breakpoints[i].width ) {
				breakpoint = breakpoints[i].name;
				break;
			}
		}

		var columnsVis = this._columnsVisiblity( breakpoint );
		this.s.current = columnsVis;

		var collapsedClass = false;

			for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			if ( columnsVis[i] === false && ! columns[i].never && ! columns[i].control && ! dt.column(i).visible() === false ) {
				collapsedClass = true;
				break;
			}
		}

		$( dt.table().node() ).toggleClass( 'collapsed', collapsedClass );

		var changed = false;
		var visible = 0;

		dt.columns().eq(0).each( function ( colIdx, i ) {
			if ( columnsVis[i] === true ) {
				visible++;
			}

			if ( forceRedraw || columnsVis[i] !== oldVis[i] ) {
				changed = true;
				that._setColumnVis( colIdx, columnsVis[i] );
			}
		} );

		if ( changed ) {
			this._redrawChildren();

			$(dt.table().node()).trigger( 'responsive-resize.dt', [dt, this.s.current] );

			if ( dt.page.info().recordsDisplay === 0 ) {
				$('td', dt.table().body()).eq(0).attr('colspan', visible);
			}
		}

		that._controlClass();
	},


	_resizeAuto: function ()
	{
		var dt = this.s.dt;
		var columns = this.s.columns;

		if ( ! this.c.auto ) {
			return;
		}

		if ( $.inArray( true, $.map( columns, function (c) { return c.auto; } ) ) === -1 ) {
			return;
		}

		if ( ! $.isEmptyObject( _childNodeStore ) ) {
			$.each( _childNodeStore, function ( key ) {
				var idx = key.split('-');

				_childNodesRestore( dt, idx[0]*1, idx[1]*1 );
			} );
		}

		var tableWidth   = dt.table().node().offsetWidth;
		var columnWidths = dt.columns;
		var clonedTable  = dt.table().node().cloneNode( false );
		var clonedHeader = $( dt.table().header().cloneNode( false ) ).appendTo( clonedTable );
		var clonedBody   = $( dt.table().body() ).clone( false, false ).empty().appendTo( clonedTable ); 

		clonedTable.style.width = 'auto';

		var headerCells = dt.columns()
			.header()
			.filter( function (idx) {
				return dt.column(idx).visible();
			} )
			.to$()
			.clone( false )
			.css( 'display', 'table-cell' )
			.css( 'width', 'auto' )
			.css( 'min-width', 0 );

		$(clonedBody)
			.append( $(dt.rows( { page: 'current' } ).nodes()).clone( false ) )
			.find( 'th, td' ).css( 'display', '' );

		var footer = dt.table().footer();
		if ( footer ) {
			var clonedFooter = $( footer.cloneNode( false ) ).appendTo( clonedTable );
			var footerCells = dt.columns()
				.footer()
				.filter( function (idx) {
					return dt.column(idx).visible();
				} )
				.to$()
				.clone( false )
				.css( 'display', 'table-cell' );

			$('<tr/>')
				.append( footerCells )
				.appendTo( clonedFooter );
		}

		$('<tr/>')
			.append( headerCells )
			.appendTo( clonedHeader );

		if ( this.c.details.type === 'inline' ) {
			$(clonedTable).addClass( 'dtr-inline collapsed' );
		}

		$( clonedTable ).find( '[name]' ).removeAttr( 'name' );

		$( clonedTable ).css( 'position', 'relative' )

				var inserted = $('<div/>')
			.css( {
				width: 1,
				height: 1,
				overflow: 'hidden',
				clear: 'both'
			} )
			.append( clonedTable );

		inserted.insertBefore( dt.table().node() );

		headerCells.each( function (i) {
			var idx = dt.column.index( 'fromVisible', i );
			columns[ idx ].minWidth =  this.offsetWidth || 0;
		} );

		inserted.remove();
	},

	_responsiveOnlyHidden: function ()
	{
		var dt = this.s.dt;

		return $.map( this.s.current, function (v, i) {
			if ( dt.column(i).visible() === false ) {
				return true;
			}
			return v;
		} );
	},

	_setColumnVis: function ( col, showHide )
	{
		var dt = this.s.dt;
		var display = showHide ? '' : 'none'; 

		$( dt.column( col ).header() ).css( 'display', display );
		$( dt.column( col ).footer() ).css( 'display', display );
		dt.column( col ).nodes().to$().css( 'display', display );

		if ( ! $.isEmptyObject( _childNodeStore ) ) {
			dt.cells( null, col ).indexes().each( function (idx) {
				_childNodesRestore( dt, idx.row, idx.column );
			} );
		}
	},


	_tabIndexes: function ()
	{
		var dt = this.s.dt;
		var cells = dt.cells( { page: 'current' } ).nodes().to$();
		var ctx = dt.settings()[0];
		var target = this.c.details.target;

		cells.filter( '[data-dtr-keyboard]' ).removeData( '[data-dtr-keyboard]' );

		if ( typeof target === 'number' ) {
			dt.cells( null, target, { page: 'current' } ).nodes().to$()
				.attr( 'tabIndex', ctx.iTabIndex )
				.data( 'dtr-keyboard', 1 );
		}
		else {
			if ( target === 'td:first-child, th:first-child' ) {
				target = '>td:first-child, >th:first-child';
			}

			$( target, dt.rows( { page: 'current' } ).nodes() )
				.attr( 'tabIndex', ctx.iTabIndex )
				.data( 'dtr-keyboard', 1 );
		}
	}
} );


Responsive.breakpoints = [
	{ name: 'desktop',  width: Infinity },
	{ name: 'tablet-l', width: 1024 },
	{ name: 'tablet-p', width: 768 },
	{ name: 'mobile-l', width: 480 },
	{ name: 'mobile-p', width: 320 }
];


Responsive.display = {
	childRow: function ( row, update, render ) {
		if ( update ) {
			if ( $(row.node()).hasClass('parent') ) {
				row.child( render(), 'child' ).show();

				return true;
			}
		}
		else {
			if ( ! row.child.isShown()  ) {
				row.child( render(), 'child' ).show();
				$( row.node() ).addClass( 'parent' );

				return true;
			}
			else {
				row.child( false );
				$( row.node() ).removeClass( 'parent' );

				return false;
			}
		}
	},

	childRowImmediate: function ( row, update, render ) {
		if ( (! update && row.child.isShown()) || ! row.responsive.hasHidden() ) {
			row.child( false );
			$( row.node() ).removeClass( 'parent' );

			return false;
		}
		else {
			row.child( render(), 'child' ).show();
			$( row.node() ).addClass( 'parent' );

			return true;
		}
	},

	modal: function ( options ) {
		return function ( row, update, render ) {
			if ( ! update ) {
				var close = function () {
					modal.remove(); 
					$(document).off( 'keypress.dtr' );
				};

				var modal = $('<div class="dtr-modal"/>')
					.append( $('<div class="dtr-modal-display"/>')
						.append( $('<div class="dtr-modal-content"/>')
							.append( render() )
						)
						.append( $('<div class="dtr-modal-close">&times;</div>' )
							.click( function () {
								close();
							} )
						)
					)
					.append( $('<div class="dtr-modal-background"/>')
						.click( function () {
							close();
						} )
					)
					.appendTo( 'body' );

				$(document).on( 'keyup.dtr', function (e) {
					if ( e.keyCode === 27 ) {
						e.stopPropagation();

						close();
					}
				} );
			}
			else {
				$('div.dtr-modal-content')
					.empty()
					.append( render() );
			}

			if ( options && options.header ) {
				$('div.dtr-modal-content').prepend(
					'<h2>'+options.header( row )+'</h2>'
				);
			}
		};
	}
};


var _childNodeStore = {};

function _childNodes( dt, row, col ) {
	var name = row+'-'+col;

	if ( _childNodeStore[ name ] ) {
		return _childNodeStore[ name ];
	}

	var nodes = [];
	var children = dt.cell( row, col ).node().childNodes;
	for ( var i=0, ien=children.length ; i<ien ; i++ ) {
		nodes.push( children[i] );
	}

	_childNodeStore[ name ] = nodes;

	return nodes;
}

function _childNodesRestore( dt, row, col ) {
	var name = row+'-'+col;

	if ( ! _childNodeStore[ name ] ) {
		return;
	}

	var node = dt.cell( row, col ).node();
	var store = _childNodeStore[ name ];
	var parent = store[0].parentNode;
	var parentChildren = parent.childNodes;
	var a = [];

	for ( var i=0, ien=parentChildren.length ; i<ien ; i++ ) {
		a.push( parentChildren[i] );
	}

	for ( var j=0, jen=a.length ; j<jen ; j++ ) {
		node.appendChild( a[j] );
	}

	_childNodeStore[ name ] = undefined;
}


Responsive.renderer = {
	listHiddenNodes: function () {
		return function ( api, rowIdx, columns ) {
			var ul = $('<ul data-dtr-index="'+rowIdx+'" class="dtr-details"/>');
			var found = false;

			var data = $.each( columns, function ( i, col ) {
				if ( col.hidden ) {
					var klass = col.className ?
						'class="'+ col.className +'"' :
						'';

						$(
						'<li '+klass+' data-dtr-index="'+col.columnIndex+'" data-dt-row="'+col.rowIndex+'" data-dt-column="'+col.columnIndex+'">'+
							'<span class="dtr-title">'+
								col.title+
							'</span> '+
						'</li>'
					)
						.append( $('<span class="dtr-data"/>').append( _childNodes( api, col.rowIndex, col.columnIndex ) ) )
						.appendTo( ul );

					found = true;
				}
			} );

			return found ?
				ul :
				false;
		};
	},

	listHidden: function () {
		return function ( api, rowIdx, columns ) {
			var data = $.map( columns, function ( col ) {
				var klass = col.className ?
					'class="'+ col.className +'"' :
					'';

				return col.hidden ?
					'<li '+klass+' data-dtr-index="'+col.columnIndex+'" data-dt-row="'+col.rowIndex+'" data-dt-column="'+col.columnIndex+'">'+
						'<span class="dtr-title">'+
							col.title+
						'</span> '+
						'<span class="dtr-data">'+
							col.data+
						'</span>'+
					'</li>' :
					'';
			} ).join('');

			return data ?
				$('<ul data-dtr-index="'+rowIdx+'" class="dtr-details"/>').append( data ) :
				false;
		}
	},

	tableAll: function ( options ) {
		options = $.extend( {
			tableClass: ''
		}, options );

		return function ( api, rowIdx, columns ) {
			var data = $.map( columns, function ( col ) {
				var klass = col.className ?
					'class="'+ col.className +'"' :
					'';

				return '<tr '+klass+' data-dt-row="'+col.rowIndex+'" data-dt-column="'+col.columnIndex+'">'+
						'<td>'+col.title+':'+'</td> '+
						'<td>'+col.data+'</td>'+
					'</tr>';
			} ).join('');

			return $('<table class="'+options.tableClass+' dtr-details" width="100%"/>').append( data );
		}
	}
};

Responsive.defaults = {
	breakpoints: Responsive.breakpoints,

	auto: true,

	details: {
		display: Responsive.display.childRow,

		renderer: Responsive.renderer.listHidden(),

		target: 0,

		type: 'inline'
	},

	orthogonal: 'display'
};


var Api = $.fn.dataTable.Api;

Api.register( 'responsive()', function () {
	return this;
} );

Api.register( 'responsive.index()', function ( li ) {
	li = $(li);

	return {
		column: li.data('dtr-index'),
		row:    li.parent().data('dtr-index')
	};
} );

Api.register( 'responsive.rebuild()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx._responsive ) {
			ctx._responsive._classLogic();
		}
	} );
} );

Api.register( 'responsive.recalc()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx._responsive ) {
			ctx._responsive._resizeAuto();
			ctx._responsive._resize();
		}
	} );
} );

Api.register( 'responsive.hasHidden()', function () {
	var ctx = this.context[0];

	return ctx._responsive ?
		$.inArray( false, ctx._responsive._responsiveOnlyHidden() ) !== -1 :
		false;
} );

Api.registerPlural( 'columns().responsiveHidden()', 'column().responsiveHidden()', function () {
	return this.iterator( 'column', function ( settings, column ) {
		return settings._responsive ?
			settings._responsive._responsiveOnlyHidden()[ column ] :
			false;
	}, 1 );
} );


Responsive.version = '2.2.7';


$.fn.dataTable.Responsive = Responsive;
$.fn.DataTable.Responsive = Responsive;

$(document).on( 'preInit.dt.dtr', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	if ( $(settings.nTable).hasClass( 'responsive' ) ||
		 $(settings.nTable).hasClass( 'dt-responsive' ) ||
		 settings.oInit.responsive ||
		 DataTable.defaults.responsive
	) {
		var init = settings.oInit.responsive;

		if ( init !== false ) {
			new Responsive( settings, $.isPlainObject( init ) ? init : {}  );
		}
	}
} );


return Responsive;
}));




(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


var RowGroup = function ( dt, opts ) {
	if ( ! DataTable.versionCheck || ! DataTable.versionCheck( '1.10.8' ) ) {
		throw 'RowGroup requires DataTables 1.10.8 or newer';
	}

	this.c = $.extend( true, {},
		DataTable.defaults.rowGroup,
		RowGroup.defaults,
		opts
	);

	this.s = {
		dt: new DataTable.Api( dt )
	};

	this.dom = {

	};

	var settings = this.s.dt.settings()[0];
	var existing = settings.rowGroup;
	if ( existing ) {
		return existing;
	}

	settings.rowGroup = this;
	this._constructor();
};


$.extend( RowGroup.prototype, {

	dataSrc: function ( val )
	{
		if ( val === undefined ) {
			return this.c.dataSrc;
		}

		var dt = this.s.dt;

		this.c.dataSrc = val;

		$(dt.table().node()).triggerHandler( 'rowgroup-datasrc.dt', [ dt, val ] );

		return this;
	},

	disable: function ()
	{
		this.c.enable = false;
		return this;
	},

	enable: function ( flag )
	{
		if ( flag === false ) {
			return this.disable();
		}

		this.c.enable = true;
		return this;
	},

	enabled: function ()
	{
		return this.c.enable;
	},


	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var hostSettings = dt.settings()[0];

		dt.on( 'draw.dtrg', function (e, s) {
			if ( that.c.enable && hostSettings === s ) {
				that._draw();
			}
		} );

		dt.on( 'column-visibility.dt.dtrg responsive-resize.dt.dtrg', function () {
			that._adjustColspan();
		} );

		dt.on( 'destroy', function () {
			dt.off( '.dtrg' );
		} );
	},



	_adjustColspan: function ()
	{
		$( 'tr.'+this.c.className, this.s.dt.table().body() ).find('td:visible')
			.attr( 'colspan', this._colspan() );
	},

	_colspan: function ()
	{
		return this.s.dt.columns().visible().reduce( function (a, b) {
			return a + b;
		}, 0 );
	},


	_draw: function ()
	{
		var dt = this.s.dt;
		var groupedRows = this._group( 0, dt.rows( { page: 'current' } ).indexes() );

		this._groupDisplay( 0, groupedRows );
	},

	_group: function ( level, rows ) {
		var fns = $.isArray( this.c.dataSrc ) ? this.c.dataSrc : [ this.c.dataSrc ];
		var fn = DataTable.ext.oApi._fnGetObjectDataFn( fns[ level ] );
		var dt = this.s.dt;
		var group, last;
		var data = [];
		var that = this;

		for ( var i=0, ien=rows.length ; i<ien ; i++ ) {
			var rowIndex = rows[i];
			var rowData = dt.row( rowIndex ).data();
			var group = fn( rowData );

			if ( group === null || group === undefined ) {
				group = that.c.emptyDataGroup;
			}

						if ( last === undefined || group !== last ) {
				data.push( {
					dataPoint: group,
					rows: []
				} );

				last = group;
			}

			data[ data.length-1 ].rows.push( rowIndex );
		}

		if ( fns[ level+1 ] !== undefined ) {
			for ( var i=0, ien=data.length ; i<ien ; i++ ) {
				data[i].children = this._group( level+1, data[i].rows );
			}
		}

		return data;
	},

	_groupDisplay: function ( level, groups )
	{
		var dt = this.s.dt;
		var display;

			for ( var i=0, ien=groups.length ; i<ien ; i++ ) {
			var group = groups[i];
			var groupName = group.dataPoint;
			var row;
			var rows = group.rows;

			if ( this.c.startRender ) {
				display = this.c.startRender.call( this, dt.rows(rows), groupName, level );
				row = this._rowWrap( display, this.c.startClassName, level );

				if ( row ) {
					row.insertBefore( dt.row( rows[0] ).node() );
				}
			}

			if ( this.c.endRender ) {
				display = this.c.endRender.call( this, dt.rows(rows), groupName, level );
				row = this._rowWrap( display, this.c.endClassName, level );

				if ( row ) {
					row.insertAfter( dt.row( rows[ rows.length-1 ] ).node() );
				}
			}

			if ( group.children ) {
				this._groupDisplay( level+1, group.children );
			}
		}
	},

	_rowWrap: function ( display, className, level )
	{
		var row;

				if ( display === null || display === '' ) {
			display = this.c.emptyDataGroup;
		}

		if ( display === undefined || display === null ) {
			return null;
		}

				if ( typeof display === 'object' && display.nodeName && display.nodeName.toLowerCase() === 'tr') {
			row = $(display);
		}
		else if (display instanceof $ && display.length && display[0].nodeName.toLowerCase() === 'tr') {
			row = display;
		}
		else {
			row = $('<tr/>')
				.append(
					$('<td/>')
						.attr( 'colspan', this._colspan() )
						.append( display  )
				);
		}

		return row
			.addClass( this.c.className )
			.addClass( className )
			.addClass( 'dtrg-level-'+level );
	}
} );


RowGroup.defaults = {
	className: 'dtrg-group',

	dataSrc: 0,

	emptyDataGroup: 'No group',

	enable: true,

	endClassName: 'dtrg-end',

	endRender: null,

	startClassName: 'dtrg-start',

	startRender: function ( rows, group ) {
		return group;
	}
};


RowGroup.version = "1.1.2";


$.fn.dataTable.RowGroup = RowGroup;
$.fn.DataTable.RowGroup = RowGroup;


DataTable.Api.register( 'rowGroup()', function () {
	return this;
} );

DataTable.Api.register( 'rowGroup().disable()', function () {
	return this.iterator( 'table', function (ctx) {
		if ( ctx.rowGroup ) {
			ctx.rowGroup.enable( false );
		}
	} );
} );

DataTable.Api.register( 'rowGroup().enable()', function ( opts ) {
	return this.iterator( 'table', function (ctx) {
		if ( ctx.rowGroup ) {
			ctx.rowGroup.enable( opts === undefined ? true : opts );
		}
	} );
} );

DataTable.Api.register( 'rowGroup().enabled()', function () {
	var ctx = this.context;

	return ctx.length && ctx[0].rowGroup ?
		ctx[0].rowGroup.enabled() :
		false;
} );

DataTable.Api.register( 'rowGroup().dataSrc()', function ( val ) {
	if ( val === undefined ) {
		return this.context[0].rowGroup.dataSrc();
	}

	return this.iterator( 'table', function (ctx) {
		if ( ctx.rowGroup ) {
			ctx.rowGroup.dataSrc( val );
		}
	} );
} );


$(document).on( 'preInit.dt.dtrg', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var init = settings.oInit.rowGroup;
	var defaults = DataTable.defaults.rowGroup;

	if ( init || defaults ) {
		var opts = $.extend( {}, defaults, init );

		if ( init !== false ) {
			new RowGroup( settings, opts  );
		}
	}
} );


return RowGroup;

}));




(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


var Scroller = function ( dt, opts ) {
	if ( ! (this instanceof Scroller) ) {
		alert( "Scroller warning: Scroller must be initialised with the 'new' keyword." );
		return;
	}

	if ( opts === undefined ) {
		opts = {};
	}

	var dtApi = $.fn.dataTable.Api( dt );

	this.s = {
		dt: dtApi.settings()[0],

		dtApi: dtApi,

		tableTop: 0,

		tableBottom: 0,

		redrawTop: 0,

		redrawBottom: 0,

		autoHeight: true,

		viewportRows: 0,

		stateTO: null,

		stateSaveThrottle: function () {},

		drawTO: null,

		heights: {
			jump: null,
			page: null,
			virtual: null,
			scroll: null,

			row: null,

			viewport: null,
			labelFactor: 1
		},

		topRowFloat: 0,
		scrollDrawDiff: null,
		loaderVisible: false,
		forceReposition: false,
		baseRowTop: 0,
		baseScrollTop: 0,
		mousedown: false,
		lastScrollTop: 0
	};

	this.s = $.extend( this.s, Scroller.oDefaults, opts );

	this.s.heights.row = this.s.rowHeight;

	this.dom = {
		"force":    document.createElement('div'),
		"label":    $('<div class="dts_label">0</div>'),
		"scroller": null,
		"table":    null,
		"loader":   null
	};

	if ( this.s.dt.oScroller ) {
		return;
	}

	this.s.dt.oScroller = this;

	this.construct();
};



$.extend( Scroller.prototype, {

	measure: function ( redraw )
	{
		if ( this.s.autoHeight )
		{
			this._calcRowHeight();
		}

		var heights = this.s.heights;

		if ( heights.row ) {
			heights.viewport = this._parseHeight($(this.dom.scroller).css('max-height'));

			this.s.viewportRows = parseInt( heights.viewport / heights.row, 10 )+1;
			this.s.dt._iDisplayLength = this.s.viewportRows * this.s.displayBuffer;
		}

		var label = this.dom.label.outerHeight();
		heights.labelFactor = (heights.viewport-label) / heights.scroll;

		if ( redraw === undefined || redraw )
		{
			this.s.dt.oInstance.fnDraw( false );
		}
	},

	pageInfo: function()
	{
		var 
			dt = this.s.dt,
			iScrollTop = this.dom.scroller.scrollTop,
			iTotal = dt.fnRecordsDisplay(),
			iPossibleEnd = Math.ceil(this.pixelsToRow(iScrollTop + this.s.heights.viewport, false, this.s.ani));

		return {
			start: Math.floor(this.pixelsToRow(iScrollTop, false, this.s.ani)),
			end: iTotal < iPossibleEnd ? iTotal-1 : iPossibleEnd-1
		};
	},

	pixelsToRow: function ( pixels, intParse, virtual )
	{
		var diff = pixels - this.s.baseScrollTop;
		var row = virtual ?
			(this._domain( 'physicalToVirtual', this.s.baseScrollTop ) + diff) / this.s.heights.row :
			( diff / this.s.heights.row ) + this.s.baseRowTop;

		return intParse || intParse === undefined ?
			parseInt( row, 10 ) :
			row;
	},

	rowToPixels: function ( rowIdx, intParse, virtual )
	{
		var pixels;
		var diff = rowIdx - this.s.baseRowTop;

		if ( virtual ) {
			pixels = this._domain( 'virtualToPhysical', this.s.baseScrollTop );
			pixels += diff * this.s.heights.row;
		}
		else {
			pixels = this.s.baseScrollTop;
			pixels += diff * this.s.heights.row;
		}

		return intParse || intParse === undefined ?
			parseInt( pixels, 10 ) :
			pixels;
	},


	scrollToRow: function ( row, animate )
	{
		var that = this;
		var ani = false;
		var px = this.rowToPixels( row );

		var preRows = ((this.s.displayBuffer-1)/2) * this.s.viewportRows;
		var drawRow = row - preRows;
		if ( drawRow < 0 ) {
			drawRow = 0;
		}

		if ( (px > this.s.redrawBottom || px < this.s.redrawTop) && this.s.dt._iDisplayStart !== drawRow ) {
			ani = true;
			px = this._domain( 'virtualToPhysical', row * this.s.heights.row );

			if ( this.s.redrawTop < px && px < this.s.redrawBottom ) {
				this.s.forceReposition = true;
				animate = false;
			}
		}

		if ( animate === undefined || animate )
		{
			this.s.ani = ani;
			$(this.dom.scroller).animate( {
				"scrollTop": px
			}, function () {
				setTimeout( function () {
					that.s.ani = false;
				}, 250 );
			} );
		}
		else
		{
			$(this.dom.scroller).scrollTop( px );
		}
	},



	construct: function ()
	{
		var that = this;
		var dt = this.s.dtApi;

		if ( !this.s.dt.oFeatures.bPaginate ) {
			this.s.dt.oApi._fnLog( this.s.dt, 0, 'Pagination must be enabled for Scroller' );
			return;
		}

		this.dom.force.style.position = "relative";
		this.dom.force.style.top = "0px";
		this.dom.force.style.left = "0px";
		this.dom.force.style.width = "1px";

		this.dom.scroller = $('div.'+this.s.dt.oClasses.sScrollBody, this.s.dt.nTableWrapper)[0];
		this.dom.scroller.appendChild( this.dom.force );
		this.dom.scroller.style.position = "relative";

		this.dom.table = $('>table', this.dom.scroller)[0];
		this.dom.table.style.position = "absolute";
		this.dom.table.style.top = "0px";
		this.dom.table.style.left = "0px";

		$(dt.table().container()).addClass('dts DTS');

		if ( this.s.loadingIndicator )
		{
			this.dom.loader = $('<div class="dataTables_processing dts_loading">'+this.s.dt.oLanguage.sLoadingRecords+'</div>')
				.css('display', 'none');

			$(this.dom.scroller.parentNode)
				.css('position', 'relative')
				.append( this.dom.loader );
		}

		this.dom.label.appendTo(this.dom.scroller);

		if ( this.s.heights.row && this.s.heights.row != 'auto' )
		{
			this.s.autoHeight = false;
		}

		this.s.ingnoreScroll = true;
		$(this.dom.scroller).on( 'scroll.dt-scroller', function (e) {
			that._scroll.call( that );
		} );

		$(this.dom.scroller).on('touchstart.dt-scroller', function () {
			that._scroll.call( that );
		} );

		$(this.dom.scroller)
			.on('mousedown.dt-scroller', function () {
				that.s.mousedown = true;
			})
			.on('mouseup.dt-scroller', function () {
				that.s.labelVisible = false;
				that.s.mousedown = false;
				that.dom.label.css('display', 'none');
			});

		$(window).on( 'resize.dt-scroller', function () {
			that.measure( false );
			that._info();
		} );

		var initialStateSave = true;
		var loadedState = dt.state.loaded();

		dt.on( 'stateSaveParams.scroller', function ( e, settings, data ) {
			if ( initialStateSave && loadedState ) {
				data.scroller = loadedState.scroller;
				initialStateSave = false;
			}
			else {
				data.scroller = {
					topRow: that.s.topRowFloat,
					baseScrollTop: that.s.baseScrollTop,
					baseRowTop: that.s.baseRowTop,
					scrollTop: that.s.lastScrollTop
				};
			}
		} );

		if ( loadedState && loadedState.scroller ) {
			this.s.topRowFloat = loadedState.scroller.topRow;
			this.s.baseScrollTop = loadedState.scroller.baseScrollTop;
			this.s.baseRowTop = loadedState.scroller.baseRowTop;
		}

		this.measure( false );

			that.s.stateSaveThrottle = that.s.dt.oApi._fnThrottle( function () {
			that.s.dtApi.state.save();
		}, 500 );

		dt.on( 'init.scroller', function () {
			that.measure( false );

			that.s.scrollType = 'jump';
			that._draw();

			dt.on( 'draw.scroller', function () {
				that._draw();
			});
		} );

		dt.on( 'preDraw.dt.scroller', function () {
			that._scrollForce();
		} );

		dt.on( 'destroy.scroller', function () {
			$(window).off( 'resize.dt-scroller' );
			$(that.dom.scroller).off('.dt-scroller');
			$(that.s.dt.nTable).off( '.scroller' );

			$(that.s.dt.nTableWrapper).removeClass('DTS');
			$('div.DTS_Loading', that.dom.scroller.parentNode).remove();

			that.dom.table.style.position = "";
			that.dom.table.style.top = "";
			that.dom.table.style.left = "";
		} );
	},



	_calcRowHeight: function ()
	{
		var dt = this.s.dt;
		var origTable = dt.nTable;
		var nTable = origTable.cloneNode( false );
		var tbody = $('<tbody/>').appendTo( nTable );
		var container = $(
			'<div class="'+dt.oClasses.sWrapper+' DTS">'+
				'<div class="'+dt.oClasses.sScrollWrapper+'">'+
					'<div class="'+dt.oClasses.sScrollBody+'"></div>'+
				'</div>'+
			'</div>'
		);

		$('tbody tr:lt(4)', origTable).clone().appendTo( tbody );
        var rowsCount = $('tr', tbody).length;

        if ( rowsCount === 1 ) {
            tbody.prepend('<tr><td>&#160;</td></tr>');
            tbody.append('<tr><td>&#160;</td></tr>');
		}
		else {
            for (; rowsCount < 3; rowsCount++) {
                tbody.append('<tr><td>&#160;</td></tr>');
            }
		}

			$('div.'+dt.oClasses.sScrollBody, container).append( nTable );

		var insertEl = this.s.dt.nHolding || origTable.parentNode;

		if ( ! $(insertEl).is(':visible') ) {
			insertEl = 'body';
		}

		container.find("input").removeAttr("name");

		container.appendTo( insertEl );
		this.s.heights.row = $('tr', tbody).eq(1).outerHeight();

		container.remove();
	},

	_draw: function ()
	{
		var
			that = this,
			heights = this.s.heights,
			iScrollTop = this.dom.scroller.scrollTop,
			iTableHeight = $(this.s.dt.nTable).height(),
			displayStart = this.s.dt._iDisplayStart,
			displayLen = this.s.dt._iDisplayLength,
			displayEnd = this.s.dt.fnRecordsDisplay();

		this.s.skip = true;

		if ( (this.s.dt.bSorted || this.s.dt.bFiltered) && displayStart === 0 && !this.s.dt._drawHold ) {
			this.s.topRowFloat = 0;
		}

		iScrollTop = this.s.scrollType === 'jump' ?
			this._domain( 'virtualToPhysical', this.s.topRowFloat * heights.row ) :
			iScrollTop;

		this.s.baseScrollTop = iScrollTop;
		this.s.baseRowTop = this.s.topRowFloat;

		var tableTop = iScrollTop - ((this.s.topRowFloat - displayStart) * heights.row);
		if ( displayStart === 0 ) {
			tableTop = 0;
		}
		else if ( displayStart + displayLen >= displayEnd ) {
			tableTop = heights.scroll - iTableHeight;
		}

		this.dom.table.style.top = tableTop+'px';

		this.s.tableTop = tableTop;
		this.s.tableBottom = iTableHeight + this.s.tableTop;

		var boundaryPx = (iScrollTop - this.s.tableTop) * this.s.boundaryScale;
		this.s.redrawTop = iScrollTop - boundaryPx;
		this.s.redrawBottom = iScrollTop + boundaryPx > heights.scroll - heights.viewport - heights.row ?
			heights.scroll - heights.viewport - heights.row :
			iScrollTop + boundaryPx;

		this.s.skip = false;

		if ( this.s.dt.oFeatures.bStateSave && this.s.dt.oLoadedState !== null &&
			 typeof this.s.dt.oLoadedState.scroller != 'undefined' )
		{
			var ajaxSourced = (this.s.dt.sAjaxSource || that.s.dt.ajax) && ! this.s.dt.oFeatures.bServerSide ?
				true :
				false;

			if ( ( ajaxSourced && this.s.dt.iDraw == 2) ||
			     (!ajaxSourced && this.s.dt.iDraw == 1) )
			{
				setTimeout( function () {
					$(that.dom.scroller).scrollTop( that.s.dt.oLoadedState.scroller.scrollTop );

					setTimeout( function () {
						that.s.ingnoreScroll = false;
					}, 0 );
				}, 0 );
			}
		}
		else {
			that.s.ingnoreScroll = false;
		}

		if ( this.s.dt.oFeatures.bInfo ) {
			setTimeout( function () {
				that._info.call( that );
			}, 0 );
		}

		if ( this.dom.loader && this.s.loaderVisible ) {
			this.dom.loader.css( 'display', 'none' );
			this.s.loaderVisible = false;
		}
	},

	_domain: function ( dir, val )
	{
		var heights = this.s.heights;
		var diff;
		var magic = 10000; 

		if ( heights.virtual === heights.scroll ) {
			return val;
		}

		if ( val < magic ) {
			return val;
		}
		else if ( dir === 'virtualToPhysical' && val >= heights.virtual - magic ) {
			diff = heights.virtual - val;
			return heights.scroll - diff;
		}
		else if ( dir === 'physicalToVirtual' && val >= heights.scroll - magic ) {
			diff = heights.scroll - val;
			return heights.virtual - diff;
		}

		var m = (heights.virtual - magic - magic) / (heights.scroll - magic - magic);
		var c = magic - (m*magic);

		return dir === 'virtualToPhysical' ?
			(val-c) / m :
			(m*val) + c;
	},

	_info: function ()
	{
		if ( !this.s.dt.oFeatures.bInfo )
		{
			return;
		}

		var
			dt = this.s.dt,
			language = dt.oLanguage,
			iScrollTop = this.dom.scroller.scrollTop,
			iStart = Math.floor( this.pixelsToRow(iScrollTop, false, this.s.ani)+1 ),
			iMax = dt.fnRecordsTotal(),
			iTotal = dt.fnRecordsDisplay(),
			iPossibleEnd = Math.ceil( this.pixelsToRow(iScrollTop+this.s.heights.viewport, false, this.s.ani) ),
			iEnd = iTotal < iPossibleEnd ? iTotal : iPossibleEnd,
			sStart = dt.fnFormatNumber( iStart ),
			sEnd = dt.fnFormatNumber( iEnd ),
			sMax = dt.fnFormatNumber( iMax ),
			sTotal = dt.fnFormatNumber( iTotal ),
			sOut;

		if ( dt.fnRecordsDisplay() === 0 &&
			   dt.fnRecordsDisplay() == dt.fnRecordsTotal() )
		{
			sOut = language.sInfoEmpty+ language.sInfoPostFix;
		}
		else if ( dt.fnRecordsDisplay() === 0 )
		{
			sOut = language.sInfoEmpty +' '+
				language.sInfoFiltered.replace('_MAX_', sMax)+
					language.sInfoPostFix;
		}
		else if ( dt.fnRecordsDisplay() == dt.fnRecordsTotal() )
		{
			sOut = language.sInfo.
					replace('_START_', sStart).
					replace('_END_',   sEnd).
					replace('_MAX_',   sMax).
					replace('_TOTAL_', sTotal)+
				language.sInfoPostFix;
		}
		else
		{
			sOut = language.sInfo.
					replace('_START_', sStart).
					replace('_END_',   sEnd).
					replace('_MAX_',   sMax).
					replace('_TOTAL_', sTotal) +' '+
				language.sInfoFiltered.replace(
					'_MAX_',
					dt.fnFormatNumber(dt.fnRecordsTotal())
				)+
				language.sInfoPostFix;
		}

		var callback = language.fnInfoCallback;
		if ( callback ) {
			sOut = callback.call( dt.oInstance,
				dt, iStart, iEnd, iMax, iTotal, sOut
			);
		}

		var n = dt.aanFeatures.i;
		if ( typeof n != 'undefined' )
		{
			for ( var i=0, iLen=n.length ; i<iLen ; i++ )
			{
				$(n[i]).html( sOut );
			}
		}

		$(dt.nTable).triggerHandler( 'info.dt' );
	},

	_parseHeight: function(cssHeight) {
		var height;
		var matches = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|em|rem|vh)$/.exec(cssHeight);

		if (matches === null) {
			return 0;
		}

		var value = parseFloat(matches[1]);
		var unit = matches[2];

		if ( unit === 'px' ) {
			height = value;
		}
		else if ( unit === 'vh' ) {
			height = ( value / 100 ) * $(window).height();
		}
		else if ( unit === 'rem' ) {
			height = value * parseFloat($(':root').css('font-size'));
		}
		else if ( unit === 'em' ) {
			height = value * parseFloat($('body').css('font-size'));
		}

		return height ?
			height :
			0;
	},

	_scroll: function ()
	{
		var
			that = this,
			heights = this.s.heights,
			iScrollTop = this.dom.scroller.scrollTop,
			iTopRow;

		if ( this.s.skip ) {
			return;
		}

		if ( this.s.ingnoreScroll ) {
			return;
		}

		if ( iScrollTop === this.s.lastScrollTop ) {
			return;
		}

		if ( this.s.dt.bFiltered || this.s.dt.bSorted ) {
			this.s.lastScrollTop = 0;
			return;
		}

		this._info();

		clearTimeout( this.s.stateTO );
		this.s.stateTO = setTimeout( function () {
			that.s.dtApi.state.save();
		}, 250 );

		this.s.scrollType = Math.abs(iScrollTop - this.s.lastScrollTop) > heights.viewport ?
			'jump' :
			'cont';

		this.s.topRowFloat = this.s.scrollType === 'cont' ?
			this.pixelsToRow( iScrollTop, false, false ) :
			this._domain( 'physicalToVirtual', iScrollTop ) / heights.row;

		if ( this.s.topRowFloat < 0 ) {
			this.s.topRowFloat = 0;
		}

		if ( this.s.forceReposition || iScrollTop < this.s.redrawTop || iScrollTop > this.s.redrawBottom ) {
			var preRows = Math.ceil( ((this.s.displayBuffer-1)/2) * this.s.viewportRows );

			iTopRow = parseInt(this.s.topRowFloat, 10) - preRows;
			this.s.forceReposition = false;

			if ( iTopRow <= 0 ) {
				iTopRow = 0;
			}
			else if ( iTopRow + this.s.dt._iDisplayLength > this.s.dt.fnRecordsDisplay() ) {
				iTopRow = this.s.dt.fnRecordsDisplay() - this.s.dt._iDisplayLength;
				if ( iTopRow < 0 ) {
					iTopRow = 0;
				}
			}
			else if ( iTopRow % 2 !== 0 ) {
				iTopRow++;
			}

			this.s.targetTop = iTopRow;

			if ( iTopRow != this.s.dt._iDisplayStart ) {
				this.s.tableTop = $(this.s.dt.nTable).offset().top;
				this.s.tableBottom = $(this.s.dt.nTable).height() + this.s.tableTop;

				var draw = function () {
					that.s.dt._iDisplayStart = that.s.targetTop;
					that.s.dt.oApi._fnDraw( that.s.dt );
				};

				if ( this.s.dt.oFeatures.bServerSide ) {
					this.s.forceReposition = true;

					clearTimeout( this.s.drawTO );
					this.s.drawTO = setTimeout( draw, this.s.serverWait );
				}
				else {
					draw();
				}

				if ( this.dom.loader && ! this.s.loaderVisible ) {
					this.dom.loader.css( 'display', 'block' );
					this.s.loaderVisible = true;
				}
			}
		}
		else {
			this.s.topRowFloat = this.pixelsToRow( iScrollTop, false, true );
		}

		this.s.lastScrollTop = iScrollTop;
		this.s.stateSaveThrottle();

		if ( this.s.scrollType === 'jump' && this.s.mousedown ) {
			this.s.labelVisible = true;
		}
		if (this.s.labelVisible) {
			this.dom.label
				.html( this.s.dt.fnFormatNumber( parseInt( this.s.topRowFloat, 10 )+1 ) )
				.css( 'top', iScrollTop + (iScrollTop * heights.labelFactor ) )
				.css( 'display', 'block' );
		}
	},

	_scrollForce: function ()
	{
		var heights = this.s.heights;
		var max = 1000000;

		heights.virtual = heights.row * this.s.dt.fnRecordsDisplay();
		heights.scroll = heights.virtual;

		if ( heights.scroll > max ) {
			heights.scroll = max;
		}

		this.dom.force.style.height = heights.scroll > this.s.heights.row ?
			heights.scroll+'px' :
			this.s.heights.row+'px';
	}
} );





Scroller.defaults = {
	boundaryScale: 0.5,

	displayBuffer: 9,

	loadingIndicator: false,

	rowHeight: "auto",

	serverWait: 200
};

Scroller.oDefaults = Scroller.defaults;




Scroller.version = "2.0.3";




$(document).on( 'preInit.dt.dtscroller', function (e, settings) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var init = settings.oInit.scroller;
	var defaults = DataTable.defaults.scroller;

	if ( init || defaults ) {
		var opts = $.extend( {}, init, defaults );

		if ( init !== false ) {
			new Scroller( settings, opts  );
		}
	}
} );


$.fn.dataTable.Scroller = Scroller;
$.fn.DataTable.Scroller = Scroller;


var Api = $.fn.dataTable.Api;

Api.register( 'scroller()', function () {
	return this;
} );

Api.register( 'scroller().rowToPixels()', function ( rowIdx, intParse, virtual ) {
	var ctx = this.context;

	if ( ctx.length && ctx[0].oScroller ) {
		return ctx[0].oScroller.rowToPixels( rowIdx, intParse, virtual );
	}
} );

Api.register( 'scroller().pixelsToRow()', function ( pixels, intParse, virtual ) {
	var ctx = this.context;

	if ( ctx.length && ctx[0].oScroller ) {
		return ctx[0].oScroller.pixelsToRow( pixels, intParse, virtual );
	}
} );

Api.register( ['scroller().scrollToRow()', 'scroller.toPosition()'], function ( idx, ani ) {
	this.iterator( 'table', function ( ctx ) {
		if ( ctx.oScroller ) {
			ctx.oScroller.scrollToRow( idx, ani );
		}
	} );

	return this;
} );

Api.register( 'row().scrollTo()', function ( ani ) {
	var that = this;

	this.iterator( 'row', function ( ctx, rowIdx ) {
		if ( ctx.oScroller ) {
			var displayIdx = that
				.rows( { order: 'applied', search: 'applied' } )
				.indexes()
				.indexOf( rowIdx );

			ctx.oScroller.scrollToRow( displayIdx, ani );
		}
	} );

	return this;
} );

Api.register( 'scroller.measure()', function ( redraw ) {
	this.iterator( 'table', function ( ctx ) {
		if ( ctx.oScroller ) {
			ctx.oScroller.measure( redraw );
		}
	} );

	return this;
} );

Api.register( 'scroller.page()', function() {
	var ctx = this.context;

	if ( ctx.length && ctx[0].oScroller ) {
		return ctx[0].oScroller.pageInfo();
	}
} );

return Scroller;
}));


(function () {
    'use strict';

    var $;
    var DataTable;
    function setJQuery(jq) {
        $ = jq;
        DataTable = jq.fn.dataTable;
    }
    var SearchPane =  (function () {
        function SearchPane(paneSettings, opts, idx, layout, panesContainer, panes) {
            var _this = this;
            if (panes === void 0) { panes = null; }
            if (!DataTable || !DataTable.versionCheck || !DataTable.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            if (!DataTable.select) {
                throw new Error('SearchPane requires Select');
            }
            var table = new DataTable.Api(paneSettings);
            this.classes = $.extend(true, {}, SearchPane.classes);
            this.c = $.extend(true, {}, SearchPane.defaults, opts);
            this.customPaneSettings = panes;
            this.s = {
                cascadeRegen: false,
                clearing: false,
                colOpts: [],
                deselect: false,
                displayed: false,
                dt: table,
                dtPane: undefined,
                filteringActive: false,
                index: idx,
                indexes: [],
                lastCascade: false,
                lastSelect: false,
                listSet: false,
                name: undefined,
                redraw: false,
                rowData: {
                    arrayFilter: [],
                    arrayOriginal: [],
                    arrayTotals: [],
                    bins: {},
                    binsOriginal: {},
                    binsTotal: {},
                    filterMap: new Map(),
                    totalOptions: 0
                },
                scrollTop: 0,
                searchFunction: undefined,
                selectPresent: false,
                serverSelect: [],
                serverSelecting: false,
                showFiltered: false,
                tableLength: null,
                updating: false
            };
            var rowLength = table.columns().eq(0).toArray().length;
            this.colExists = this.s.index < rowLength;
            this.c.layout = layout;
            var layVal = parseInt(layout.split('-')[1], 10);
            this.dom = {
                buttonGroup: $('<div/>').addClass(this.classes.buttonGroup),
                clear: $('<button type="button">&#215;</button>')
                    .addClass(this.classes.dull)
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.clearButton),
                container: $('<div/>').addClass(this.classes.container).addClass(this.classes.layout +
                    (layVal < 10 ? layout : layout.split('-')[0] + '-9')),
                countButton: $('<button type="button"></button>')
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.countButton),
                dtP: $('<table><thead><tr><th>' +
                    (this.colExists
                        ? $(table.column(this.colExists ? this.s.index : 0).header()).text()
                        : this.customPaneSettings.header || 'Custom Pane') + '</th><th/></tr></thead></table>'),
                lower: $('<div/>').addClass(this.classes.subRow2).addClass(this.classes.narrowButton),
                nameButton: $('<button type="button"></button>').addClass(this.classes.paneButton).addClass(this.classes.nameButton),
                panesContainer: panesContainer,
                searchBox: $('<input/>').addClass(this.classes.paneInputButton).addClass(this.classes.search),
                searchButton: $('<button type = "button" class="' + this.classes.searchIcon + '"></button>')
                    .addClass(this.classes.paneButton),
                searchCont: $('<div/>').addClass(this.classes.searchCont),
                searchLabelCont: $('<div/>').addClass(this.classes.searchLabelCont),
                topRow: $('<div/>').addClass(this.classes.topRow),
                upper: $('<div/>').addClass(this.classes.subRow1).addClass(this.classes.narrowSearch)
            };
            this.s.displayed = false;
            table = this.s.dt;
            this.selections = [];
            this.s.colOpts = this.colExists ? this._getOptions() : this._getBonusOptions();
            var colOpts = this.s.colOpts;
            var clear = $('<button type="button">X</button>').addClass(this.classes.paneButton);
            $(clear).text(table.i18n('searchPanes.clearPane', 'X'));
            this.dom.container.addClass(colOpts.className);
            this.dom.container.addClass((this.customPaneSettings !== null && this.customPaneSettings.className !== undefined)
                ? this.customPaneSettings.className
                : '');
            if (this.s.colOpts.name !== undefined) {
                this.s.name = this.s.colOpts.name;
            }
            else if (this.customPaneSettings !== null && this.customPaneSettings.name !== undefined) {
                this.s.name = this.customPaneSettings.name;
            }
            else {
                this.s.name = this.colExists ?
                    $(table.column(this.s.index).header()).text() :
                    this.customPaneSettings.header || 'Custom Pane';
            }
            $(panesContainer).append(this.dom.container);
            var tableNode = table.table(0).node();
            this.s.searchFunction = function (settings, searchData, dataIndex, origData) {
                if (_this.selections.length === 0) {
                    return true;
                }
                if (settings.nTable !== tableNode) {
                    return true;
                }
                var filter = null;
                if (_this.colExists) {
                    filter = searchData[_this.s.index];
                    if (colOpts.orthogonal.filter !== 'filter') {
                        filter = _this.s.rowData.filterMap.get(dataIndex);
                        if (filter instanceof $.fn.dataTable.Api) {
                            filter = filter.toArray();
                        }
                    }
                }
                return _this._search(filter, dataIndex);
            };
            $.fn.dataTable.ext.search.push(this.s.searchFunction);
            if (this.c.clear) {
                $(clear).on('click', function () {
                    var searches = _this.dom.container.find(_this.classes.search);
                    searches.each(function () {
                        $(this).val('');
                        $(this).trigger('input');
                    });
                    _this.clearPane();
                });
            }
            table.on('draw.dtsp', function () {
                _this._adjustTopRow();
            });
            table.on('buttons-action', function () {
                _this._adjustTopRow();
            });
            $(window).on('resize.dtsp', DataTable.util.throttle(function () {
                _this._adjustTopRow();
            }));
            table.on('column-reorder.dtsp', function (e, settings, details) {
                _this.s.index = details.mapping[_this.s.index];
            });
            return this;
        }
        SearchPane.prototype.clearData = function () {
            this.s.rowData = {
                arrayFilter: [],
                arrayOriginal: [],
                arrayTotals: [],
                bins: {},
                binsOriginal: {},
                binsTotal: {},
                filterMap: new Map(),
                totalOptions: 0
            };
        };
        SearchPane.prototype.clearPane = function () {
            this.s.dtPane.rows({ selected: true }).deselect();
            this.updateTable();
            return this;
        };
        SearchPane.prototype.destroy = function () {
            $(this.s.dtPane).off('.dtsp');
            $(this.s.dt).off('.dtsp');
            $(this.dom.nameButton).off('.dtsp');
            $(this.dom.countButton).off('.dtsp');
            $(this.dom.clear).off('.dtsp');
            $(this.dom.searchButton).off('.dtsp');
            $(this.dom.container).remove();
            var searchIdx = $.fn.dataTable.ext.search.indexOf(this.s.searchFunction);
            while (searchIdx !== -1) {
                $.fn.dataTable.ext.search.splice(searchIdx, 1);
                searchIdx = $.fn.dataTable.ext.search.indexOf(this.s.searchFunction);
            }
            if (this.s.dtPane !== undefined) {
                this.s.dtPane.destroy();
            }
            this.s.listSet = false;
        };
        SearchPane.prototype.getPaneCount = function () {
            return this.s.dtPane !== undefined ?
                this.s.dtPane.rows({ selected: true }).data().toArray().length :
                0;
        };
        SearchPane.prototype.rebuildPane = function (last, dataIn, init, maintainSelection) {
            if (last === void 0) { last = false; }
            if (dataIn === void 0) { dataIn = null; }
            if (init === void 0) { init = null; }
            if (maintainSelection === void 0) { maintainSelection = false; }
            this.clearData();
            var selectedRows = [];
            this.s.serverSelect = [];
            var prevEl = null;
            if (this.s.dtPane !== undefined) {
                if (maintainSelection) {
                    if (!this.s.dt.page.info().serverSide) {
                        selectedRows = this.s.dtPane.rows({ selected: true }).data().toArray();
                    }
                    else {
                        this.s.serverSelect = this.s.dtPane.rows({ selected: true }).data().toArray();
                    }
                }
                this.s.dtPane.clear().destroy();
                prevEl = $(this.dom.container).prev();
                this.destroy();
                this.s.dtPane = undefined;
                $.fn.dataTable.ext.search.push(this.s.searchFunction);
            }
            this.dom.container.removeClass(this.classes.hidden);
            this.s.displayed = false;
            this._buildPane(!this.s.dt.page.info().serverSide ?
                selectedRows :
                this.s.serverSelect, last, dataIn, init, prevEl);
            return this;
        };
        SearchPane.prototype.removePane = function () {
            this.s.displayed = false;
            $(this.dom.container).hide();
        };
        SearchPane.prototype.setCascadeRegen = function (val) {
            this.s.cascadeRegen = val;
        };
        SearchPane.prototype.setClear = function (val) {
            this.s.clearing = val;
        };
        SearchPane.prototype.updatePane = function (draw) {
            if (draw === void 0) { draw = false; }
            this.s.updating = true;
            this._updateCommon(draw);
            this.s.updating = false;
        };
        SearchPane.prototype.updateTable = function () {
            var selectedRows = this.s.dtPane.rows({ selected: true }).data().toArray();
            this.selections = selectedRows;
            this._searchExtras();
            if (this.c.cascadePanes || this.c.viewTotal) {
                this.updatePane();
            }
        };
        SearchPane.prototype._setListeners = function () {
            var _this = this;
            var rowData = this.s.rowData;
            var t0;
            this.s.dtPane.on('select.dtsp', function () {
                clearTimeout(t0);
                if (_this.s.dt.page.info().serverSide && !_this.s.updating) {
                    if (!_this.s.serverSelecting) {
                        _this.s.serverSelect = _this.s.dtPane.rows({ selected: true }).data().toArray();
                        _this.s.scrollTop = $(_this.s.dtPane.table().node()).parent()[0].scrollTop;
                        _this.s.selectPresent = true;
                        _this.s.dt.draw(false);
                    }
                }
                else {
                    $(_this.dom.clear).removeClass(_this.classes.dull);
                    _this.s.selectPresent = true;
                    if (!_this.s.updating) {
                        _this._makeSelection();
                    }
                    _this.s.selectPresent = false;
                }
            });
            this.s.dtPane.on('deselect.dtsp', function () {
                t0 = setTimeout(function () {
                    if (_this.s.dt.page.info().serverSide && !_this.s.updating) {
                        if (!_this.s.serverSelecting) {
                            _this.s.serverSelect = _this.s.dtPane.rows({ selected: true }).data().toArray();
                            _this.s.deselect = true;
                            _this.s.dt.draw(false);
                        }
                    }
                    else {
                        _this.s.deselect = true;
                        if (_this.s.dtPane.rows({ selected: true }).data().toArray().length === 0) {
                            $(_this.dom.clear).addClass(_this.classes.dull);
                        }
                        _this._makeSelection();
                        _this.s.deselect = false;
                        _this.s.dt.state.save();
                    }
                }, 50);
            });
            this.s.dt.on('stateSaveParams.dtsp', function (e, settings, data) {
                if ($.isEmptyObject(data)) {
                    _this.s.dtPane.state.clear();
                    return;
                }
                var selected = [];
                var searchTerm;
                var order;
                var bins;
                var arrayFilter;
                if (_this.s.dtPane !== undefined) {
                    selected = _this.s.dtPane.rows({ selected: true }).data().map(function (item) { return item.filter.toString(); }).toArray();
                    searchTerm = $(_this.dom.searchBox).val();
                    order = _this.s.dtPane.order();
                    bins = rowData.binsOriginal;
                    arrayFilter = rowData.arrayOriginal;
                }
                if (data.searchPanes === undefined) {
                    data.searchPanes = {};
                }
                if (data.searchPanes.panes === undefined) {
                    data.searchPanes.panes = [];
                }
                for (var i = 0; i < data.searchPanes.panes.length; i++) {
                    if (data.searchPanes.panes[i].id === _this.s.index) {
                        data.searchPanes.panes.splice(i, 1);
                        i--;
                    }
                }
                data.searchPanes.panes.push({
                    arrayFilter: arrayFilter,
                    bins: bins,
                    id: _this.s.index,
                    order: order,
                    searchTerm: searchTerm,
                    selected: selected
                });
            });
            this.s.dtPane.on('user-select.dtsp', function (e, _dt, type, cell, originalEvent) {
                originalEvent.stopPropagation();
            });
            this.s.dtPane.on('draw.dtsp', function () {
                _this._adjustTopRow();
            });
            $(this.dom.nameButton).on('click.dtsp', function () {
                var currentOrder = _this.s.dtPane.order()[0][1];
                _this.s.dtPane.order([0, currentOrder === 'asc' ? 'desc' : 'asc']).draw();
                _this.s.dt.state.save();
            });
            $(this.dom.countButton).on('click.dtsp', function () {
                var currentOrder = _this.s.dtPane.order()[0][1];
                _this.s.dtPane.order([1, currentOrder === 'asc' ? 'desc' : 'asc']).draw();
                _this.s.dt.state.save();
            });
            $(this.dom.clear).on('click.dtsp', function () {
                var searches = _this.dom.container.find('.' + _this.classes.search);
                searches.each(function () {
                    $(this).val('');
                    $(this).trigger('input');
                });
                _this.clearPane();
            });
            $(this.dom.searchButton).on('click.dtsp', function () {
                $(_this.dom.searchBox).focus();
            });
            $(this.dom.searchBox).on('input.dtsp', function () {
                _this.s.dtPane.search($(_this.dom.searchBox).val()).draw();
                _this.s.dt.state.save();
            });
            this.s.dt.state.save();
            return true;
        };
        SearchPane.prototype._addOption = function (filter, display, sort, type, arrayFilter, bins) {
            if (Array.isArray(filter) || filter instanceof DataTable.Api) {
                if (filter instanceof DataTable.Api) {
                    filter = filter.toArray();
                    display = display.toArray();
                }
                if (filter.length === display.length) {
                    for (var i = 0; i < filter.length; i++) {
                        if (!bins[filter[i]]) {
                            bins[filter[i]] = 1;
                            arrayFilter.push({
                                display: display[i],
                                filter: filter[i],
                                sort: sort[i],
                                type: type[i]
                            });
                        }
                        else {
                            bins[filter[i]]++;
                        }
                        this.s.rowData.totalOptions++;
                    }
                    return;
                }
                else {
                    throw new Error('display and filter not the same length');
                }
            }
            else if (typeof this.s.colOpts.orthogonal === 'string') {
                if (!bins[filter]) {
                    bins[filter] = 1;
                    arrayFilter.push({
                        display: display,
                        filter: filter,
                        sort: sort,
                        type: type
                    });
                    this.s.rowData.totalOptions++;
                }
                else {
                    bins[filter]++;
                    this.s.rowData.totalOptions++;
                    return;
                }
            }
            else {
                arrayFilter.push({
                    display: display,
                    filter: filter,
                    sort: sort,
                    type: type
                });
            }
        };
        SearchPane.prototype._addRow = function (display, filter, shown, total, sort, type, className) {
            var index;
            for (var _i = 0, _a = this.s.indexes; _i < _a.length; _i++) {
                var entry = _a[_i];
                if (entry.filter === filter) {
                    index = entry.index;
                }
            }
            if (index === undefined) {
                index = this.s.indexes.length;
                this.s.indexes.push({ filter: filter, index: index });
            }
            return this.s.dtPane.row.add({
                className: className,
                display: display !== '' ?
                    display :
                    this.s.colOpts.emptyMessage !== false ?
                        this.s.colOpts.emptyMessage :
                        this.c.emptyMessage,
                filter: filter,
                index: index,
                shown: shown,
                sort: sort !== '' ?
                    sort :
                    this.s.colOpts.emptyMessage !== false ?
                        this.s.colOpts.emptyMessage :
                        this.c.emptyMessage,
                total: total,
                type: type
            });
        };
        SearchPane.prototype._adjustTopRow = function () {
            var subContainers = this.dom.container.find('.' + this.classes.subRowsContainer);
            var subRow1 = this.dom.container.find('.dtsp-subRow1');
            var subRow2 = this.dom.container.find('.dtsp-subRow2');
            var topRow = this.dom.container.find('.' + this.classes.topRow);
            if (($(subContainers[0]).width() < 252 || $(topRow[0]).width() < 252) && $(subContainers[0]).width() !== 0) {
                $(subContainers[0]).addClass(this.classes.narrow);
                $(subRow1[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowSearch);
                $(subRow2[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowButton);
            }
            else {
                $(subContainers[0]).removeClass(this.classes.narrow);
                $(subRow1[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowSearch);
                $(subRow2[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowButton);
            }
        };
        SearchPane.prototype._buildPane = function (selectedRows, last, dataIn, init, prevEl) {
            var _this = this;
            if (selectedRows === void 0) { selectedRows = []; }
            if (last === void 0) { last = false; }
            if (dataIn === void 0) { dataIn = null; }
            if (init === void 0) { init = null; }
            if (prevEl === void 0) { prevEl = null; }
            this.selections = [];
            var table = this.s.dt;
            var column = table.column(this.colExists ? this.s.index : 0);
            var colOpts = this.s.colOpts;
            var rowData = this.s.rowData;
            var countMessage = table.i18n('searchPanes.count', '{total}');
            var filteredMessage = table.i18n('searchPanes.countFiltered', '{shown} ({total})');
            var loadedFilter = table.state.loaded();
            if (this.s.listSet) {
                loadedFilter = table.state();
            }
            if (this.colExists) {
                var idx = -1;
                if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.panes) {
                    for (var i = 0; i < loadedFilter.searchPanes.panes.length; i++) {
                        if (loadedFilter.searchPanes.panes[i].id === this.s.index) {
                            idx = i;
                            break;
                        }
                    }
                }
                if ((colOpts.show === false
                    || (colOpts.show !== undefined && colOpts.show !== true)) &&
                    idx === -1) {
                    this.dom.container.addClass(this.classes.hidden);
                    this.s.displayed = false;
                    return false;
                }
                else if (colOpts.show === true || idx !== -1) {
                    this.s.displayed = true;
                }
                if (!this.s.dt.page.info().serverSide &&
                    (dataIn === null ||
                        dataIn.searchPanes === null ||
                        dataIn.searchPanes.options === null)) {
                    if (rowData.arrayFilter.length === 0) {
                        this._populatePane(last);
                        this.s.rowData.totalOptions = 0;
                        this._detailsPane();
                        if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.panes && idx === -1) {
                            this.dom.container.addClass(this.classes.hidden);
                            this.s.displayed = false;
                            return;
                        }
                        rowData.arrayOriginal = rowData.arrayTotals;
                        rowData.binsOriginal = rowData.binsTotal;
                    }
                    var binLength = Object.keys(rowData.binsOriginal).length;
                    var uniqueRatio = this._uniqueRatio(binLength, table.rows()[0].length);
                    if (this.s.displayed === false && ((colOpts.show === undefined && colOpts.threshold === null ?
                        uniqueRatio > this.c.threshold :
                        uniqueRatio > colOpts.threshold)
                        || (colOpts.show !== true && binLength <= 1))) {
                        this.dom.container.addClass(this.classes.hidden);
                        this.s.displayed = false;
                        return;
                    }
                    if (this.c.viewTotal && rowData.arrayTotals.length === 0) {
                        this.s.rowData.totalOptions = 0;
                        this._detailsPane();
                    }
                    else {
                        rowData.binsTotal = rowData.bins;
                    }
                    this.dom.container.addClass(this.classes.show);
                    this.s.displayed = true;
                }
                else if (dataIn !== null && dataIn.searchPanes !== null && dataIn.searchPanes.options !== null) {
                    if (dataIn.tableLength !== undefined) {
                        this.s.tableLength = dataIn.tableLength;
                        this.s.rowData.totalOptions = this.s.tableLength;
                    }
                    else if (this.s.tableLength === null || table.rows()[0].length > this.s.tableLength) {
                        this.s.tableLength = table.rows()[0].length;
                        this.s.rowData.totalOptions = this.s.tableLength;
                    }
                    var colTitle = table.column(this.s.index).dataSrc();
                    if (dataIn.searchPanes.options[colTitle] !== undefined) {
                        for (var _i = 0, _a = dataIn.searchPanes.options[colTitle]; _i < _a.length; _i++) {
                            var dataPoint = _a[_i];
                            this.s.rowData.arrayFilter.push({
                                display: dataPoint.label,
                                filter: dataPoint.value,
                                sort: dataPoint.label,
                                type: dataPoint.label
                            });
                            this.s.rowData.bins[dataPoint.value] = this.c.viewTotal || this.c.cascadePanes ?
                                dataPoint.count :
                                dataPoint.total;
                            this.s.rowData.binsTotal[dataPoint.value] = dataPoint.total;
                        }
                    }
                    var binLength = Object.keys(rowData.binsTotal).length;
                    var uniqueRatio = this._uniqueRatio(binLength, this.s.tableLength);
                    if (this.s.displayed === false && ((colOpts.show === undefined && colOpts.threshold === null ?
                        uniqueRatio > this.c.threshold :
                        uniqueRatio > colOpts.threshold)
                        || (colOpts.show !== true && binLength <= 1))) {
                        this.dom.container.addClass(this.classes.hidden);
                        this.s.displayed = false;
                        return;
                    }
                    this.s.rowData.arrayOriginal = this.s.rowData.arrayFilter;
                    this.s.rowData.binsOriginal = this.s.rowData.bins;
                    this.s.displayed = true;
                }
            }
            else {
                this.s.displayed = true;
            }
            this._displayPane();
            if (!this.s.listSet) {
                this.dom.dtP.on('stateLoadParams.dt', function (e, settings, data) {
                    if ($.isEmptyObject(table.state.loaded())) {
                        $.each(data, function (index, value) {
                            delete data[index];
                        });
                    }
                });
            }
            if (prevEl !== null && $(this.dom.panesContainer).has(prevEl).length > 0) {
                $(this.dom.container).insertAfter(prevEl);
            }
            else {
                $(this.dom.panesContainer).prepend(this.dom.container);
            }
            var errMode = $.fn.dataTable.ext.errMode;
            $.fn.dataTable.ext.errMode = 'none';
            var haveScroller = DataTable.Scroller;
            this.s.dtPane = $(this.dom.dtP).DataTable($.extend(true, {
                columnDefs: [
                    {
                        className: 'dtsp-nameColumn',
                        data: 'display',
                        render: function (data, type, row) {
                            if (type === 'sort') {
                                return row.sort;
                            }
                            else if (type === 'type') {
                                return row.type;
                            }
                            var message;
                            (_this.s.filteringActive || _this.s.showFiltered) && _this.c.viewTotal
                                ? message = filteredMessage.replace(/{total}/, row.total)
                                : message = countMessage.replace(/{total}/, row.total);
                            message = message.replace(/{shown}/, row.shown);
                            while (message.indexOf('{total}') !== -1) {
                                message = message.replace(/{total}/, row.total);
                            }
                            while (message.indexOf('{shown}') !== -1) {
                                message = message.replace(/{shown}/, row.shown);
                            }
                            var pill = '<span class="' + _this.classes.pill + '">' + message + '</span>';
                            if (_this.c.hideCount || colOpts.hideCount) {
                                pill = '';
                            }
                            return '<div class="' + _this.classes.nameCont + '"><span title="' +
                                (typeof data === 'string' && data.match(/<[^>]*>/) !== null ? data.replace(/<[^>]*>/g, '') : data) +
                                '" class="' + _this.classes.name + '">' +
                                data + '</span>' +
                                pill + '</div>';
                        },
                        targets: 0,
                        type: table.settings()[0].aoColumns[this.s.index] !== undefined ?
                            table.settings()[0].aoColumns[this.s.index]._sManualType :
                            null
                    },
                    {
                        className: 'dtsp-countColumn ' + this.classes.badgePill,
                        data: 'shown',
                        orderData: [1, 2],
                        targets: 1,
                        visible: false
                    },
                    {
                        data: 'total',
                        targets: 2,
                        visible: false
                    }
                ],
                deferRender: true,
                dom: 't',
                info: false,
                language: this.s.dt.settings()[0].oLanguage,
                paging: haveScroller ? true : false,
                scrollX: false,
                scrollY: '200px',
                scroller: haveScroller ? true : false,
                select: true,
                stateSave: table.settings()[0].oFeatures.bStateSave ? true : false
            }, this.c.dtOpts, colOpts !== undefined ? colOpts.dtOpts : {}, (this.s.colOpts.options !== undefined || !this.colExists)
                ? {
                    createdRow: function (row, data, dataIndex) {
                        $(row).addClass(data.className);
                    }
                }
                : undefined, (this.customPaneSettings !== null && this.customPaneSettings.dtOpts !== undefined)
                ? this.customPaneSettings.dtOpts
                : {}));
            $(this.dom.dtP).addClass(this.classes.table);
            $(this.dom.searchBox).attr('placeholder', colOpts.header !== undefined
                ? colOpts.header
                : this.colExists
                    ? table.settings()[0].aoColumns[this.s.index].sTitle
                    : this.customPaneSettings.header || 'Custom Pane');
            $.fn.dataTable.select.init(this.s.dtPane);
            $.fn.dataTable.ext.errMode = errMode;
            if (this.colExists) {
                var search = column.search();
                search = search ? search.substr(1, search.length - 2).split('|') : [];
                var count_1 = 0;
                rowData.arrayFilter.forEach(function (element) {
                    if (element.filter === '') {
                        count_1++;
                    }
                });
                for (var i = 0, ien = rowData.arrayFilter.length; i < ien; i++) {
                    var selected = false;
                    for (var _b = 0, _c = this.s.serverSelect; _b < _c.length; _b++) {
                        var option = _c[_b];
                        if (option.filter === rowData.arrayFilter[i].filter) {
                            selected = true;
                        }
                    }
                    if (this.s.dt.page.info().serverSide &&
                        (!this.c.cascadePanes ||
                            (this.c.cascadePanes && rowData.bins[rowData.arrayFilter[i].filter] !== 0) ||
                            (this.c.cascadePanes && init !== null) ||
                            selected)) {
                        var row = this._addRow(rowData.arrayFilter[i].display, rowData.arrayFilter[i].filter, init ?
                            rowData.binsTotal[rowData.arrayFilter[i].filter] :
                            rowData.bins[rowData.arrayFilter[i].filter], this.c.viewTotal || init
                            ? String(rowData.binsTotal[rowData.arrayFilter[i].filter])
                            : rowData.bins[rowData.arrayFilter[i].filter], rowData.arrayFilter[i].sort, rowData.arrayFilter[i].type);
                        for (var _d = 0, _e = this.s.serverSelect; _d < _e.length; _d++) {
                            var option = _e[_d];
                            if (option.filter === rowData.arrayFilter[i].filter) {
                                this.s.serverSelecting = true;
                                row.select();
                                this.s.serverSelecting = false;
                            }
                        }
                    }
                    else if (!this.s.dt.page.info().serverSide &&
                        rowData.arrayFilter[i] &&
                        (rowData.bins[rowData.arrayFilter[i].filter] !== undefined || !this.c.cascadePanes)) {
                        this._addRow(rowData.arrayFilter[i].display, rowData.arrayFilter[i].filter, rowData.bins[rowData.arrayFilter[i].filter], rowData.binsTotal[rowData.arrayFilter[i].filter], rowData.arrayFilter[i].sort, rowData.arrayFilter[i].type);
                    }
                    else if (!this.s.dt.page.info().serverSide) {
                        this._addRow('', count_1, count_1, '', '', '');
                    }
                }
            }
            DataTable.select.init(this.s.dtPane);
            if (colOpts.options !== undefined ||
                (this.customPaneSettings !== null && this.customPaneSettings.options !== undefined)) {
                this._getComparisonRows();
            }
            this.s.dtPane.draw();
            this._adjustTopRow();
            if (!this.s.listSet) {
                this._setListeners();
                this.s.listSet = true;
            }
            for (var _f = 0, selectedRows_1 = selectedRows; _f < selectedRows_1.length; _f++) {
                var selection = selectedRows_1[_f];
                if (selection !== undefined) {
                    for (var _g = 0, _h = this.s.dtPane.rows().indexes().toArray(); _g < _h.length; _g++) {
                        var row = _h[_g];
                        if (this.s.dtPane.row(row).data() !== undefined && selection.filter === this.s.dtPane.row(row).data().filter) {
                            if (this.s.dt.page.info().serverSide) {
                                this.s.serverSelecting = true;
                                this.s.dtPane.row(row).select();
                                this.s.serverSelecting = false;
                            }
                            else {
                                this.s.dtPane.row(row).select();
                            }
                        }
                    }
                }
            }
            if (this.s.dt.page.info().serverSide) {
                this.s.dtPane.search($(this.dom.searchBox).val()).draw();
            }
            if (loadedFilter &&
                loadedFilter.searchPanes &&
                loadedFilter.searchPanes.panes &&
                (dataIn === null ||
                    dataIn.draw === 1)) {
                if (!this.c.cascadePanes) {
                    this._reloadSelect(loadedFilter);
                }
                for (var _j = 0, _k = loadedFilter.searchPanes.panes; _j < _k.length; _j++) {
                    var pane = _k[_j];
                    if (pane.id === this.s.index) {
                        $(this.dom.searchBox).val(pane.searchTerm);
                        $(this.dom.searchBox).trigger('input');
                        this.s.dtPane.order(pane.order).draw();
                    }
                }
            }
            this.s.dt.state.save();
            return true;
        };
        SearchPane.prototype._detailsPane = function () {
            var table = this.s.dt;
            this.s.rowData.arrayTotals = [];
            this.s.rowData.binsTotal = {};
            var settings = this.s.dt.settings()[0];
            var indexArray = table.rows().indexes();
            if (!this.s.dt.page.info().serverSide) {
                for (var _i = 0, indexArray_1 = indexArray; _i < indexArray_1.length; _i++) {
                    var rowIdx = indexArray_1[_i];
                    this._populatePaneArray(rowIdx, this.s.rowData.arrayTotals, settings, this.s.rowData.binsTotal);
                }
            }
        };
        SearchPane.prototype._displayPane = function () {
            var container = this.dom.container;
            var colOpts = this.s.colOpts;
            var layVal = parseInt(this.c.layout.split('-')[1], 10);
            $(this.dom.topRow).empty();
            $(this.dom.dtP).empty();
            $(this.dom.topRow).addClass(this.classes.topRow);
            if (layVal > 3) {
                $(this.dom.container).addClass(this.classes.smallGap);
            }
            $(this.dom.topRow).addClass(this.classes.subRowsContainer);
            $(this.dom.upper).appendTo(this.dom.topRow);
            $(this.dom.lower).appendTo(this.dom.topRow);
            $(this.dom.searchCont).appendTo(this.dom.upper);
            $(this.dom.buttonGroup).appendTo(this.dom.lower);
            if (this.c.dtOpts.searching === false ||
                (colOpts.dtOpts !== undefined &&
                    colOpts.dtOpts.searching === false) ||
                (!this.c.controls || !colOpts.controls) ||
                (this.customPaneSettings !== null &&
                    this.customPaneSettings.dtOpts !== undefined &&
                    this.customPaneSettings.dtOpts.searching !== undefined &&
                    !this.customPaneSettings.dtOpts.searching)) {
                $(this.dom.searchBox).attr('disabled', 'disabled')
                    .removeClass(this.classes.paneInputButton)
                    .addClass(this.classes.disabledButton);
            }
            $(this.dom.searchBox).appendTo(this.dom.searchCont);
            this._searchContSetup();
            if (this.c.clear && this.c.controls && colOpts.controls) {
                $(this.dom.clear).appendTo(this.dom.buttonGroup);
            }
            if (this.c.orderable && colOpts.orderable && this.c.controls && colOpts.controls) {
                $(this.dom.nameButton).appendTo(this.dom.buttonGroup);
            }
            if (!this.c.hideCount &&
                !colOpts.hideCount &&
                this.c.orderable &&
                colOpts.orderable &&
                this.c.controls &&
                colOpts.controls) {
                $(this.dom.countButton).appendTo(this.dom.buttonGroup);
            }
            $(this.dom.topRow).prependTo(this.dom.container);
            $(container).append(this.dom.dtP);
            $(container).show();
        };
        SearchPane.prototype._getBonusOptions = function () {
            var defaultMutator = {
                orthogonal: {
                    threshold: null
                },
                threshold: null
            };
            return $.extend(true, {}, SearchPane.defaults, defaultMutator, this.c !== undefined ? this.c : {});
        };
        SearchPane.prototype._getComparisonRows = function () {
            var colOpts = this.s.colOpts;
            var options = colOpts.options !== undefined
                ? colOpts.options
                : this.customPaneSettings !== null && this.customPaneSettings.options !== undefined
                    ? this.customPaneSettings.options
                    : undefined;
            if (options === undefined) {
                return;
            }
            var tableVals = this.s.dt.rows({ search: 'applied' }).data().toArray();
            var appRows = this.s.dt.rows({ search: 'applied' });
            var tableValsTotal = this.s.dt.rows().data().toArray();
            var allRows = this.s.dt.rows();
            var rows = [];
            this.s.dtPane.clear();
            for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
                var comp = options_1[_i];
                var insert = comp.label !== '' ? comp.label : this.c.emptyMessage;
                var comparisonObj = {
                    className: comp.className,
                    display: insert,
                    filter: typeof comp.value === 'function' ? comp.value : [],
                    shown: 0,
                    sort: insert,
                    total: 0,
                    type: insert
                };
                if (typeof comp.value === 'function') {
                    for (var tVal = 0; tVal < tableVals.length; tVal++) {
                        if (comp.value.call(this.s.dt, tableVals[tVal], appRows[0][tVal])) {
                            comparisonObj.shown++;
                        }
                    }
                    for (var i = 0; i < tableValsTotal.length; i++) {
                        if (comp.value.call(this.s.dt, tableValsTotal[i], allRows[0][i])) {
                            comparisonObj.total++;
                        }
                    }
                    if (typeof comparisonObj.filter !== 'function') {
                        comparisonObj.filter.push(comp.filter);
                    }
                }
                if (!this.c.cascadePanes || (this.c.cascadePanes && comparisonObj.shown !== 0)) {
                    rows.push(this._addRow(comparisonObj.display, comparisonObj.filter, comparisonObj.shown, comparisonObj.total, comparisonObj.sort, comparisonObj.type, comparisonObj.className));
                }
            }
            return rows;
        };
        SearchPane.prototype._getOptions = function () {
            var table = this.s.dt;
            var defaultMutator = {
                emptyMessage: false,
                orthogonal: {
                    threshold: null
                },
                threshold: null
            };
            return $.extend(true, {}, SearchPane.defaults, defaultMutator, table.settings()[0].aoColumns[this.s.index].searchPanes);
        };
        SearchPane.prototype._makeSelection = function () {
            this.updateTable();
            this.s.updating = true;
            this.s.dt.draw();
            this.s.updating = false;
        };
        SearchPane.prototype._populatePane = function (last) {
            if (last === void 0) { last = false; }
            var table = this.s.dt;
            this.s.rowData.arrayFilter = [];
            this.s.rowData.bins = {};
            var settings = this.s.dt.settings()[0];
            if (!this.s.dt.page.info().serverSide) {
                var indexArray = (this.c.cascadePanes || this.c.viewTotal) && (!this.s.clearing && !last) ?
                    table.rows({ search: 'applied' }).indexes() :
                    table.rows().indexes();
                for (var _i = 0, _a = indexArray.toArray(); _i < _a.length; _i++) {
                    var index = _a[_i];
                    this._populatePaneArray(index, this.s.rowData.arrayFilter, settings);
                }
            }
        };
        SearchPane.prototype._populatePaneArray = function (rowIdx, arrayFilter, settings, bins) {
            if (bins === void 0) { bins = this.s.rowData.bins; }
            var colOpts = this.s.colOpts;
            if (typeof colOpts.orthogonal === 'string') {
                var rendered = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal);
                this.s.rowData.filterMap.set(rowIdx, rendered);
                this._addOption(rendered, rendered, rendered, rendered, arrayFilter, bins);
            }
            else {
                var filter = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.search);
                if (filter === null) {
                    filter = '';
                }
                if (typeof filter === 'string') {
                    filter = filter.replace(/<[^>]*>/g, '');
                }
                this.s.rowData.filterMap.set(rowIdx, filter);
                if (!bins[filter]) {
                    bins[filter] = 1;
                    this._addOption(filter, settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.display), settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.sort), settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.type), arrayFilter, bins);
                    this.s.rowData.totalOptions++;
                }
                else {
                    bins[filter]++;
                    this.s.rowData.totalOptions++;
                    return;
                }
            }
        };
        SearchPane.prototype._reloadSelect = function (loadedFilter) {
            if (loadedFilter === undefined) {
                return;
            }
            var idx;
            for (var i = 0; i < loadedFilter.searchPanes.panes.length; i++) {
                if (loadedFilter.searchPanes.panes[i].id === this.s.index) {
                    idx = i;
                    break;
                }
            }
            if (idx !== undefined) {
                var table = this.s.dtPane;
                var rows = table.rows({ order: 'index' }).data().map(function (item) { return item.filter !== null ?
                    item.filter.toString() :
                    null; }).toArray();
                for (var _i = 0, _a = loadedFilter.searchPanes.panes[idx].selected; _i < _a.length; _i++) {
                    var filter = _a[_i];
                    var id = -1;
                    if (filter !== null) {
                        id = rows.indexOf(filter.toString());
                    }
                    if (id > -1) {
                        this.s.serverSelecting = true;
                        table.row(id).select();
                        this.s.serverSelecting = false;
                    }
                }
            }
        };
        SearchPane.prototype._search = function (filter, dataIndex) {
            var colOpts = this.s.colOpts;
            var table = this.s.dt;
            for (var _i = 0, _a = this.selections; _i < _a.length; _i++) {
                var colSelect = _a[_i];
                if (typeof colSelect.filter === 'string') {
                    colSelect.filter = colSelect.filter.replaceAll('&amp;', '&');
                }
                if (Array.isArray(filter)) {
                    if (filter.indexOf(colSelect.filter) !== -1) {
                        return true;
                    }
                }
                else if (typeof colSelect.filter === 'function') {
                    if (colSelect.filter.call(table, table.row(dataIndex).data(), dataIndex)) {
                        if (colOpts.combiner === 'or') {
                            return true;
                        }
                    }
                    else if (colOpts.combiner === 'and') {
                        return false;
                    }
                }
                else if ((filter === colSelect.filter) ||
                    (!(typeof filter === 'string' && filter.length === 0) && filter == colSelect.filter) ||
                    (colSelect.filter === null && typeof filter === 'string' && filter === '')) {
                    return true;
                }
            }
            if (colOpts.combiner === 'and') {
                return true;
            }
            else {
                return false;
            }
        };
        SearchPane.prototype._searchContSetup = function () {
            if (this.c.controls && this.s.colOpts.controls) {
                $(this.dom.searchButton).appendTo(this.dom.searchLabelCont);
            }
            if (!(this.c.dtOpts.searching === false ||
                this.s.colOpts.dtOpts.searching === false ||
                (this.customPaneSettings !== null &&
                    this.customPaneSettings.dtOpts !== undefined &&
                    this.customPaneSettings.dtOpts.searching !== undefined &&
                    !this.customPaneSettings.dtOpts.searching))) {
                $(this.dom.searchLabelCont).appendTo(this.dom.searchCont);
            }
        };
        SearchPane.prototype._searchExtras = function () {
            var updating = this.s.updating;
            this.s.updating = true;
            var filters = this.s.dtPane.rows({ selected: true }).data().pluck('filter').toArray();
            var nullIndex = filters.indexOf(this.s.colOpts.emptyMessage !== false ?
                this.s.colOpts.emptyMessage :
                this.c.emptyMessage);
            var container = $(this.s.dtPane.table().container());
            if (nullIndex > -1) {
                filters[nullIndex] = '';
            }
            if (filters.length > 0) {
                container.addClass(this.classes.selected);
            }
            else if (filters.length === 0) {
                container.removeClass(this.classes.selected);
            }
            this.s.updating = updating;
        };
        SearchPane.prototype._uniqueRatio = function (bins, rowCount) {
            if (rowCount > 0 &&
                ((this.s.rowData.totalOptions > 0 && !this.s.dt.page.info().serverSide) ||
                    (this.s.dt.page.info().serverSide && this.s.tableLength > 0))) {
                return bins / this.s.rowData.totalOptions;
            }
            else {
                return 1;
            }
        };
        SearchPane.prototype._updateCommon = function (draw) {
            if (draw === void 0) { draw = false; }
            if (!this.s.dt.page.info().serverSide &&
                this.s.dtPane !== undefined &&
                (!this.s.filteringActive || this.c.cascadePanes || draw === true) &&
                (this.c.cascadePanes !== true || this.s.selectPresent !== true) && (!this.s.lastSelect || !this.s.lastCascade)) {
                var colOpts = this.s.colOpts;
                var selected = this.s.dtPane.rows({ selected: true }).data().toArray();
                var scrollTop = $(this.s.dtPane.table().node()).parent()[0].scrollTop;
                var rowData = this.s.rowData;
                this.s.dtPane.clear();
                if (this.colExists) {
                    if (rowData.arrayFilter.length === 0) {
                        this._populatePane();
                    }
                    else if (this.c.cascadePanes
                        && this.s.dt.rows().data().toArray().length === this.s.dt.rows({ search: 'applied' }).data().toArray().length) {
                        rowData.arrayFilter = rowData.arrayOriginal;
                        rowData.bins = rowData.binsOriginal;
                    }
                    else if (this.c.viewTotal || this.c.cascadePanes) {
                        this._populatePane();
                    }
                    if (this.c.viewTotal) {
                        this._detailsPane();
                    }
                    else {
                        rowData.binsTotal = rowData.bins;
                    }
                    if (this.c.viewTotal && !this.c.cascadePanes) {
                        rowData.arrayFilter = rowData.arrayTotals;
                    }
                    var _loop_1 = function (dataP) {
                        if (dataP && ((rowData.bins[dataP.filter] !== undefined && rowData.bins[dataP.filter] !== 0 && this_1.c.cascadePanes)
                            || !this_1.c.cascadePanes
                            || this_1.s.clearing)) {
                            var row = this_1._addRow(dataP.display, dataP.filter, !this_1.c.viewTotal
                                ? rowData.bins[dataP.filter]
                                : rowData.bins[dataP.filter] !== undefined
                                    ? rowData.bins[dataP.filter]
                                    : 0, this_1.c.viewTotal
                                ? String(rowData.binsTotal[dataP.filter])
                                : rowData.bins[dataP.filter], dataP.sort, dataP.type);
                            var selectIndex = selected.findIndex(function (element) {
                                return element.filter === dataP.filter;
                            });
                            if (selectIndex !== -1) {
                                row.select();
                                selected.splice(selectIndex, 1);
                            }
                        }
                    };
                    var this_1 = this;
                    for (var _i = 0, _a = rowData.arrayFilter; _i < _a.length; _i++) {
                        var dataP = _a[_i];
                        _loop_1(dataP);
                    }
                }
                if ((colOpts.searchPanes !== undefined && colOpts.searchPanes.options !== undefined) ||
                    colOpts.options !== undefined ||
                    (this.customPaneSettings !== null && this.customPaneSettings.options !== undefined)) {
                    var rows = this._getComparisonRows();
                    var _loop_2 = function (row) {
                        var selectIndex = selected.findIndex(function (element) {
                            if (element.display === row.data().display) {
                                return true;
                            }
                        });
                        if (selectIndex !== -1) {
                            row.select();
                            selected.splice(selectIndex, 1);
                        }
                    };
                    for (var _b = 0, rows_1 = rows; _b < rows_1.length; _b++) {
                        var row = rows_1[_b];
                        _loop_2(row);
                    }
                }
                for (var _c = 0, selected_1 = selected; _c < selected_1.length; _c++) {
                    var selectedEl = selected_1[_c];
                    var row = this._addRow(selectedEl.display, selectedEl.filter, 0, this.c.viewTotal
                        ? selectedEl.total
                        : 0, selectedEl.display, selectedEl.display);
                    this.s.updating = true;
                    row.select();
                    this.s.updating = false;
                }
                this.s.dtPane.draw();
                this.s.dtPane.table().node().parentNode.scrollTop = scrollTop;
            }
        };
        SearchPane.version = '1.1.0';
        SearchPane.classes = {
            buttonGroup: 'dtsp-buttonGroup',
            buttonSub: 'dtsp-buttonSub',
            clear: 'dtsp-clear',
            clearAll: 'dtsp-clearAll',
            clearButton: 'clearButton',
            container: 'dtsp-searchPane',
            countButton: 'dtsp-countButton',
            disabledButton: 'dtsp-disabledButton',
            dull: 'dtsp-dull',
            hidden: 'dtsp-hidden',
            hide: 'dtsp-hide',
            layout: 'dtsp-',
            name: 'dtsp-name',
            nameButton: 'dtsp-nameButton',
            nameCont: 'dtsp-nameCont',
            narrow: 'dtsp-narrow',
            paneButton: 'dtsp-paneButton',
            paneInputButton: 'dtsp-paneInputButton',
            pill: 'dtsp-pill',
            search: 'dtsp-search',
            searchCont: 'dtsp-searchCont',
            searchIcon: 'dtsp-searchIcon',
            searchLabelCont: 'dtsp-searchButtonCont',
            selected: 'dtsp-selected',
            smallGap: 'dtsp-smallGap',
            subRow1: 'dtsp-subRow1',
            subRow2: 'dtsp-subRow2',
            subRowsContainer: 'dtsp-subRowsContainer',
            title: 'dtsp-title',
            topRow: 'dtsp-topRow'
        };
        SearchPane.defaults = {
            cascadePanes: false,
            clear: true,
            combiner: 'or',
            controls: true,
            container: function (dt) {
                return dt.table().container();
            },
            dtOpts: {},
            emptyMessage: '<i>No Data</i>',
            hideCount: false,
            layout: 'columns-3',
            name: undefined,
            orderable: true,
            orthogonal: {
                display: 'display',
                filter: 'filter',
                hideCount: false,
                search: 'filter',
                show: undefined,
                sort: 'sort',
                threshold: 0.6,
                type: 'type'
            },
            preSelect: [],
            threshold: 0.6,
            viewTotal: false
        };
        return SearchPane;
    }());

    var $$1;
    var DataTable$1;
    function setJQuery$1(jq) {
        $$1 = jq;
        DataTable$1 = jq.fn.dataTable;
    }
    var SearchPanes =  (function () {
        function SearchPanes(paneSettings, opts, fromInit) {
            var _this = this;
            if (fromInit === void 0) { fromInit = false; }
            this.regenerating = false;
            if (!DataTable$1 || !DataTable$1.versionCheck || !DataTable$1.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            if (!DataTable$1.select) {
                throw new Error('SearchPane requires Select');
            }
            var table = new DataTable$1.Api(paneSettings);
            this.classes = $$1.extend(true, {}, SearchPanes.classes);
            this.c = $$1.extend(true, {}, SearchPanes.defaults, opts);
            this.dom = {
                clearAll: $$1('<button type="button">Clear All</button>').addClass(this.classes.clearAll),
                container: $$1('<div/>').addClass(this.classes.panes).text(table.i18n('searchPanes.loadMessage', 'Loading Search Panes...')),
                emptyMessage: $$1('<div/>').addClass(this.classes.emptyMessage),
                options: $$1('<div/>').addClass(this.classes.container),
                panes: $$1('<div/>').addClass(this.classes.container),
                title: $$1('<div/>').addClass(this.classes.title),
                titleRow: $$1('<div/>').addClass(this.classes.titleRow),
                wrapper: $$1('<div/>')
            };
            this.s = {
                colOpts: [],
                dt: table,
                filterCount: 0,
                filterPane: -1,
                page: 0,
                panes: [],
                selectionList: [],
                serverData: {},
                stateRead: false,
                updating: false
            };
            if (table.settings()[0]._searchPanes !== undefined) {
                return;
            }
            this._getState();
            if (this.s.dt.page.info().serverSide) {
                table.on('preXhr.dt', function (e, settings, data) {
                    if (data.searchPanes === undefined) {
                        data.searchPanes = {};
                    }
                    for (var _i = 0, _a = _this.s.selectionList; _i < _a.length; _i++) {
                        var selection = _a[_i];
                        var src = _this.s.dt.column(selection.index).dataSrc();
                        if (data.searchPanes[src] === undefined) {
                            data.searchPanes[src] = {};
                        }
                        for (var i = 0; i < selection.rows.length; i++) {
                            data.searchPanes[src][i] = selection.rows[i].filter;
                        }
                    }
                });
            }
            table.on('xhr', function (e, settings, json, xhr) {
                if (json && json.searchPanes && json.searchPanes.options) {
                    _this.s.serverData = json;
                    _this.s.serverData.tableLength = json.recordsTotal;
                    _this._serverTotals();
                }
            });
            table.settings()[0]._searchPanes = this;
            this.dom.clearAll.text(table.i18n('searchPanes.clearMessage', 'Clear All'));
            if (this.s.dt.settings()[0]._bInitComplete || fromInit) {
                this._paneDeclare(table, paneSettings, opts);
            }
            else {
                table.one('preInit.dt', function (settings) {
                    _this._paneDeclare(table, paneSettings, opts);
                });
            }
            return this;
        }
        SearchPanes.prototype.clearSelections = function () {
            var searches = this.dom.container.find(this.classes.search);
            searches.each(function () {
                $$1(this).val('');
                $$1(this).trigger('input');
            });
            var returnArray = [];
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    returnArray.push(pane.clearPane());
                }
            }
            this.s.dt.draw();
            return returnArray;
        };
        SearchPanes.prototype.getNode = function () {
            return this.dom.container;
        };
        SearchPanes.prototype.rebuild = function (targetIdx, maintainSelection) {
            if (targetIdx === void 0) { targetIdx = false; }
            if (maintainSelection === void 0) { maintainSelection = false; }
            $$1(this.dom.emptyMessage).remove();
            var returnArray = [];
            if (targetIdx === false) {
                $$1(this.dom.panes).empty();
            }
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (targetIdx !== false && pane.s.index !== targetIdx) {
                    continue;
                }
                pane.clearData();
                returnArray.push(
                pane.rebuildPane(this.s.selectionList[this.s.selectionList.length - 1] !== undefined ?
                    pane.s.index === this.s.selectionList[this.s.selectionList.length - 1].index :
                    false, this.s.dt.page.info().serverSide ?
                    this.s.serverData :
                    undefined, null, maintainSelection));
                $$1(this.dom.panes).append(pane.dom.container);
            }
            if (!this.s.dt.page.info().serverSide) {
                this.s.dt.draw();
            }
            if (this.c.cascadePanes || this.c.viewTotal) {
                this.redrawPanes(true);
            }
            else {
                this._updateSelection();
            }
            this._updateFilterCount();
            this._attachPaneContainer();
            this.s.dt.draw();
            if (returnArray.length === 1) {
                return returnArray[0];
            }
            else {
                return returnArray;
            }
        };
        SearchPanes.prototype.redrawPanes = function (rebuild) {
            if (rebuild === void 0) { rebuild = false; }
            var table = this.s.dt;
            if (!this.s.updating && !this.s.dt.page.info().serverSide) {
                var filterActive = true;
                var filterPane = this.s.filterPane;
                if (table.rows({ search: 'applied' }).data().toArray().length === table.rows().data().toArray().length) {
                    filterActive = false;
                }
                else if (this.c.viewTotal) {
                    for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        if (pane.s.dtPane !== undefined) {
                            var selectLength = pane.s.dtPane.rows({ selected: true }).data().toArray().length;
                            if (selectLength === 0) {
                                for (var _b = 0, _c = this.s.selectionList; _b < _c.length; _b++) {
                                    var selection = _c[_b];
                                    if (selection.index === pane.s.index && selection.rows.length !== 0) {
                                        selectLength = selection.rows.length;
                                    }
                                }
                            }
                            if (selectLength > 0 && filterPane === -1) {
                                filterPane = pane.s.index;
                            }
                            else if (selectLength > 0) {
                                filterPane = null;
                            }
                        }
                    }
                }
                var deselectIdx = void 0;
                var newSelectionList = [];
                if (!this.regenerating) {
                    for (var _d = 0, _e = this.s.panes; _d < _e.length; _d++) {
                        var pane = _e[_d];
                        if (pane.s.selectPresent) {
                            this.s.selectionList.push({ index: pane.s.index, rows: pane.s.dtPane.rows({ selected: true }).data().toArray(), protect: false });
                            table.state.save();
                            break;
                        }
                        else if (pane.s.deselect) {
                            deselectIdx = pane.s.index;
                            var selectedData = pane.s.dtPane.rows({ selected: true }).data().toArray();
                            if (selectedData.length > 0) {
                                this.s.selectionList.push({ index: pane.s.index, rows: selectedData, protect: true });
                            }
                        }
                    }
                    if (this.s.selectionList.length > 0) {
                        var last = this.s.selectionList[this.s.selectionList.length - 1].index;
                        for (var _f = 0, _g = this.s.panes; _f < _g.length; _f++) {
                            var pane = _g[_f];
                            pane.s.lastSelect = (pane.s.index === last);
                        }
                    }
                    for (var i = 0; i < this.s.selectionList.length; i++) {
                        if (this.s.selectionList[i].index !== deselectIdx || this.s.selectionList[i].protect === true) {
                            var further = false;
                            for (var j = i + 1; j < this.s.selectionList.length; j++) {
                                if (this.s.selectionList[j].index === this.s.selectionList[i].index) {
                                    further = true;
                                }
                            }
                            if (!further) {
                                newSelectionList.push(this.s.selectionList[i]);
                                this.s.selectionList[i].protect = false;
                            }
                        }
                    }
                    var solePane = -1;
                    if (newSelectionList.length === 1) {
                        solePane = newSelectionList[0].index;
                    }
                    for (var _h = 0, _j = this.s.panes; _h < _j.length; _h++) {
                        var pane = _j[_h];
                        if (pane.s.dtPane !== undefined) {
                            var tempFilter = true;
                            pane.s.filteringActive = true;
                            if ((filterPane !== -1 && filterPane !== null && filterPane === pane.s.index) ||
                                filterActive === false ||
                                pane.s.index === solePane) {
                                tempFilter = false;
                                pane.s.filteringActive = false;
                            }
                            pane.updatePane(!tempFilter ? false : filterActive);
                        }
                    }
                    this._updateFilterCount();
                    if (newSelectionList.length > 0 && (newSelectionList.length < this.s.selectionList.length || rebuild)) {
                        this._cascadeRegen(newSelectionList);
                        var last = newSelectionList[newSelectionList.length - 1].index;
                        for (var _k = 0, _l = this.s.panes; _k < _l.length; _k++) {
                            var pane = _l[_k];
                            pane.s.lastSelect = (pane.s.index === last);
                        }
                    }
                    else if (newSelectionList.length > 0) {
                        for (var _m = 0, _o = this.s.panes; _m < _o.length; _m++) {
                            var paneUpdate = _o[_m];
                            if (paneUpdate.s.dtPane !== undefined) {
                                var tempFilter = true;
                                paneUpdate.s.filteringActive = true;
                                if ((filterPane !== -1 && filterPane !== null && filterPane === paneUpdate.s.index) || filterActive === false) {
                                    tempFilter = false;
                                    paneUpdate.s.filteringActive = false;
                                }
                                paneUpdate.updatePane(!tempFilter ? tempFilter : filterActive);
                            }
                        }
                    }
                }
                else {
                    var solePane = -1;
                    if (newSelectionList.length === 1) {
                        solePane = newSelectionList[0].index;
                    }
                    for (var _p = 0, _q = this.s.panes; _p < _q.length; _p++) {
                        var pane = _q[_p];
                        if (pane.s.dtPane !== undefined) {
                            var tempFilter = true;
                            pane.s.filteringActive = true;
                            if ((filterPane !== -1 && filterPane !== null && filterPane === pane.s.index) ||
                                filterActive === false ||
                                pane.s.index === solePane) {
                                tempFilter = false;
                                pane.s.filteringActive = false;
                            }
                            pane.updatePane(!tempFilter ? tempFilter : filterActive);
                        }
                    }
                    this._updateFilterCount();
                }
                if (!filterActive) {
                    this.s.selectionList = [];
                }
            }
        };
        SearchPanes.prototype._attach = function () {
            var _this = this;
            $$1(this.dom.container).removeClass(this.classes.hide);
            $$1(this.dom.titleRow).removeClass(this.classes.hide);
            $$1(this.dom.titleRow).remove();
            $$1(this.dom.title).appendTo(this.dom.titleRow);
            if (this.c.clear) {
                $$1(this.dom.clearAll).appendTo(this.dom.titleRow);
                $$1(this.dom.clearAll).on('click.dtsps', function () {
                    _this.clearSelections();
                });
            }
            $$1(this.dom.titleRow).appendTo(this.dom.container);
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                $$1(pane.dom.container).appendTo(this.dom.panes);
            }
            $$1(this.dom.panes).appendTo(this.dom.container);
            if ($$1('div.' + this.classes.container).length === 0) {
                $$1(this.dom.container).prependTo(this.s.dt);
            }
            return this.dom.container;
        };
        SearchPanes.prototype._attachExtras = function () {
            $$1(this.dom.container).removeClass(this.classes.hide);
            $$1(this.dom.titleRow).removeClass(this.classes.hide);
            $$1(this.dom.titleRow).remove();
            $$1(this.dom.title).appendTo(this.dom.titleRow);
            if (this.c.clear) {
                $$1(this.dom.clearAll).appendTo(this.dom.titleRow);
            }
            $$1(this.dom.titleRow).appendTo(this.dom.container);
            return this.dom.container;
        };
        SearchPanes.prototype._attachMessage = function () {
            var message;
            try {
                message = this.s.dt.i18n('searchPanes.emptyPanes', 'No SearchPanes');
            }
            catch (error) {
                message = null;
            }
            if (message === null) {
                $$1(this.dom.container).addClass(this.classes.hide);
                $$1(this.dom.titleRow).removeClass(this.classes.hide);
                return;
            }
            else {
                $$1(this.dom.container).removeClass(this.classes.hide);
                $$1(this.dom.titleRow).addClass(this.classes.hide);
            }
            $$1(this.dom.emptyMessage).text(message);
            this.dom.emptyMessage.appendTo(this.dom.container);
            return this.dom.container;
        };
        SearchPanes.prototype._attachPaneContainer = function () {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed === true) {
                    return this._attach();
                }
            }
            return this._attachMessage();
        };
        SearchPanes.prototype._cascadeRegen = function (newSelectionList) {
            this.regenerating = true;
            var solePane = -1;
            if (newSelectionList.length === 1) {
                solePane = newSelectionList[0].index;
            }
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                pane.setCascadeRegen(true);
                pane.setClear(true);
                if ((pane.s.dtPane !== undefined && pane.s.index === solePane) || pane.s.dtPane !== undefined) {
                    pane.clearPane();
                }
                pane.setClear(false);
            }
            this._makeCascadeSelections(newSelectionList);
            this.s.selectionList = newSelectionList;
            for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                var pane = _c[_b];
                pane.setCascadeRegen(false);
            }
            this.regenerating = false;
        };
        SearchPanes.prototype._checkMessage = function () {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed === true) {
                    return;
                }
            }
            return this._attachMessage();
        };
        SearchPanes.prototype._getState = function () {
            var loadedFilter = this.s.dt.state.loaded();
            if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.selectionList !== undefined) {
                this.s.selectionList = loadedFilter.searchPanes.selectionList;
            }
        };
        SearchPanes.prototype._makeCascadeSelections = function (newSelectionList) {
            for (var i = 0; i < newSelectionList.length; i++) {
                var _loop_1 = function (pane) {
                    if (pane.s.index === newSelectionList[i].index && pane.s.dtPane !== undefined) {
                        if (i === newSelectionList.length - 1) {
                            pane.s.lastCascade = true;
                        }
                        if (pane.s.dtPane.rows({ selected: true }).data().toArray().length > 0 && pane.s.dtPane !== undefined) {
                            pane.setClear(true);
                            pane.clearPane();
                            pane.setClear(false);
                        }
                        var _loop_2 = function (row) {
                            pane.s.dtPane.rows().every(function (rowIdx) {
                                if (pane.s.dtPane.row(rowIdx).data() !== undefined &&
                                    row !== undefined &&
                                    pane.s.dtPane.row(rowIdx).data().filter === row.filter) {
                                    pane.s.dtPane.row(rowIdx).select();
                                }
                            });
                        };
                        for (var _i = 0, _a = newSelectionList[i].rows; _i < _a.length; _i++) {
                            var row = _a[_i];
                            _loop_2(row);
                        }
                        this_1._updateFilterCount();
                        pane.s.lastCascade = false;
                    }
                };
                var this_1 = this;
                for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    _loop_1(pane);
                }
            }
            this.s.dt.state.save();
        };
        SearchPanes.prototype._paneDeclare = function (table, paneSettings, opts) {
            var _this = this;
            table
                .columns(this.c.columns.length > 0 ? this.c.columns : undefined)
                .eq(0)
                .each(function (idx) {
                _this.s.panes.push(new SearchPane(paneSettings, opts, idx, _this.c.layout, _this.dom.panes));
            });
            var rowLength = table.columns().eq(0).toArray().length;
            var paneLength = this.c.panes.length;
            for (var i = 0; i < paneLength; i++) {
                var id = rowLength + i;
                this.s.panes.push(new SearchPane(paneSettings, opts, id, this.c.layout, this.dom.panes, this.c.panes[i]));
            }
            if (this.c.order.length > 0) {
                var newPanes = this.c.order.map(function (name, index, values) {
                    return _this._findPane(name);
                });
                this.dom.panes.empty();
                this.s.panes = newPanes;
                for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    this.dom.panes.append(pane.dom.container);
                }
            }
            if (this.s.dt.settings()[0]._bInitComplete) {
                this._startup(table);
            }
            else {
                this.s.dt.settings()[0].aoInitComplete.push({ fn: function () {
                        _this._startup(table);
                    } });
            }
        };
        SearchPanes.prototype._findPane = function (name) {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (name === pane.s.name) {
                    return pane;
                }
            }
        };
        SearchPanes.prototype._serverTotals = function () {
            var selectPresent = false;
            var deselectPresent = false;
            var table = this.s.dt;
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.selectPresent) {
                    this.s.selectionList.push({ index: pane.s.index, rows: pane.s.dtPane.rows({ selected: true }).data().toArray(), protect: false });
                    table.state.save();
                    pane.s.selectPresent = false;
                    selectPresent = true;
                    break;
                }
                else if (pane.s.deselect) {
                    var selectedData = pane.s.dtPane.rows({ selected: true }).data().toArray();
                    if (selectedData.length > 0) {
                        this.s.selectionList.push({ index: pane.s.index, rows: selectedData, protect: true });
                    }
                    selectPresent = true;
                    deselectPresent = true;
                }
            }
            if (!selectPresent) {
                this.s.selectionList = [];
            }
            else {
                var newSelectionList = [];
                for (var i = 0; i < this.s.selectionList.length; i++) {
                    var further = false;
                    for (var j = i + 1; j < this.s.selectionList.length; j++) {
                        if (this.s.selectionList[j].index === this.s.selectionList[i].index) {
                            further = true;
                        }
                    }
                    if (!further) {
                        var push = false;
                        for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                            var pane = _c[_b];
                            if (pane.s.index === this.s.selectionList[i].index &&
                                pane.s.dtPane.rows({ selected: true }).data().toArray().length > 0) {
                                push = true;
                            }
                        }
                        if (push) {
                            newSelectionList.push(this.s.selectionList[i]);
                        }
                    }
                }
                this.s.selectionList = newSelectionList;
            }
            var initIdx = -1;
            if (deselectPresent && this.s.selectionList.length === 1) {
                for (var _d = 0, _e = this.s.panes; _d < _e.length; _d++) {
                    var pane = _e[_d];
                    pane.s.lastSelect = false;
                    pane.s.deselect = false;
                    if (pane.s.dtPane !== undefined && pane.s.dtPane.rows({ selected: true }).data().toArray().length > 0) {
                        initIdx = pane.s.index;
                    }
                }
            }
            else if (this.s.selectionList.length > 0) {
                var last = this.s.selectionList[this.s.selectionList.length - 1].index;
                for (var _f = 0, _g = this.s.panes; _f < _g.length; _f++) {
                    var pane = _g[_f];
                    pane.s.lastSelect = (pane.s.index === last);
                    pane.s.deselect = false;
                }
            }
            else if (this.s.selectionList.length === 0) {
                for (var _h = 0, _j = this.s.panes; _h < _j.length; _h++) {
                    var pane = _j[_h];
                    pane.s.lastSelect = false;
                    pane.s.deselect = false;
                }
            }
            $$1(this.dom.panes).empty();
            for (var _k = 0, _l = this.s.panes; _k < _l.length; _k++) {
                var pane = _l[_k];
                if (!pane.s.lastSelect) {
                    pane.rebuildPane(undefined, this.s.dt.page.info().serverSide ? this.s.serverData : undefined, pane.s.index === initIdx ? true : null, true);
                }
                else {
                    pane._setListeners();
                }
                $$1(this.dom.panes).append(pane.dom.container);
                if (pane.s.dtPane !== undefined) {
                    $$1(pane.s.dtPane.table().node()).parent()[0].scrollTop = pane.s.scrollTop;
                    $$1.fn.dataTable.select.init(pane.s.dtPane);
                }
            }
            if (!this.s.dt.page.info().serverSide) {
                this.s.dt.draw();
            }
        };
        SearchPanes.prototype._startup = function (table) {
            var _this = this;
            $$1(this.dom.container).text('');
            this._attachExtras();
            $$1(this.dom.container).append(this.dom.panes);
            $$1(this.dom.panes).empty();
            var loadedFilter = this.s.dt.state.loaded();
            if (this.c.viewTotal && !this.c.cascadePanes) {
                if (loadedFilter !== null &&
                    loadedFilter !== undefined &&
                    loadedFilter.searchPanes !== undefined &&
                    loadedFilter.searchPanes.panes !== undefined) {
                    var filterActive = false;
                    for (var _i = 0, _a = loadedFilter.searchPanes.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        if (pane.selected.length > 0) {
                            filterActive = true;
                            break;
                        }
                    }
                    if (filterActive) {
                        for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                            var pane = _c[_b];
                            pane.s.showFiltered = true;
                        }
                    }
                }
            }
            for (var _d = 0, _e = this.s.panes; _d < _e.length; _d++) {
                var pane = _e[_d];
                pane.rebuildPane(undefined, Object.keys(this.s.serverData).length > 0 ? this.s.serverData : undefined);
                $$1(this.dom.panes).append(pane.dom.container);
            }
            if (!this.s.dt.page.info().serverSide) {
                this.s.dt.draw();
            }
            if (!this.s.stateRead && loadedFilter !== null && loadedFilter !== undefined) {
                this.s.dt.page((loadedFilter.start / this.s.dt.page.len()));
                this.s.dt.draw('page');
            }
            this.s.stateRead = true;
            if (this.c.viewTotal && !this.c.cascadePanes) {
                for (var _f = 0, _g = this.s.panes; _f < _g.length; _f++) {
                    var pane = _g[_f];
                    pane.updatePane();
                }
            }
            this._updateFilterCount();
            this._checkMessage();
            table.on('preDraw.dtsps', function () {
                _this._updateFilterCount();
                if ((_this.c.cascadePanes || _this.c.viewTotal) && !_this.s.dt.page.info().serverSide) {
                    _this.redrawPanes();
                }
                else {
                    _this._updateSelection();
                }
                _this.s.filterPane = -1;
            });
            this.s.dt.on('stateSaveParams.dtsp', function (e, settings, data) {
                if (data.searchPanes === undefined) {
                    data.searchPanes = {};
                }
                data.searchPanes.selectionList = _this.s.selectionList;
            });
            if (this.s.dt.page.info().serverSide) {
                table.off('page');
                table.on('page', function () {
                    _this.s.page = _this.s.dt.page();
                });
                table.off('preXhr.dt');
                table.on('preXhr.dt', function (e, settings, data) {
                    if (data.searchPanes === undefined) {
                        data.searchPanes = {};
                    }
                    var filterCount = 0;
                    for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        var src = _this.s.dt.column(pane.s.index).dataSrc();
                        if (data.searchPanes[src] === undefined) {
                            data.searchPanes[src] = {};
                        }
                        if (pane.s.dtPane !== undefined) {
                            var rowData = pane.s.dtPane.rows({ selected: true }).data().toArray();
                            for (var i = 0; i < rowData.length; i++) {
                                data.searchPanes[src][i] = rowData[i].filter;
                                filterCount++;
                            }
                        }
                    }
                    if (_this.c.viewTotal) {
                        _this._prepViewTotal();
                    }
                    if (filterCount > 0) {
                        if (filterCount !== _this.s.filterCount) {
                            data.start = 0;
                            _this.s.page = 0;
                        }
                        else {
                            data.start = _this.s.page * _this.s.dt.page.len();
                        }
                        _this.s.dt.page(_this.s.page);
                        _this.s.filterCount = filterCount;
                    }
                });
            }
            else {
                table.on('preXhr.dt', function (e, settings, data) {
                    for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        pane.clearData();
                    }
                });
            }
            this.s.dt.on('xhr', function (e, settings, json, xhr) {
                var processing = false;
                if (!_this.s.dt.page.info().serverSide) {
                    _this.s.dt.one('preDraw', function () {
                        if (processing) {
                            return;
                        }
                        var page = _this.s.dt.page();
                        processing = true;
                        $$1(_this.dom.panes).empty();
                        for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                            var pane = _a[_i];
                            pane.clearData(); 
                            pane.rebuildPane(_this.s.selectionList[_this.s.selectionList.length - 1] !== undefined ?
                                pane.s.index === _this.s.selectionList[_this.s.selectionList.length - 1].index :
                                false, undefined, undefined, true);
                            $$1(_this.dom.panes).append(pane.dom.container);
                        }
                        if (!_this.s.dt.page.info().serverSide) {
                            _this.s.dt.draw();
                        }
                        if (_this.c.cascadePanes || _this.c.viewTotal) {
                            _this.redrawPanes(_this.c.cascadePanes);
                        }
                        else {
                            _this._updateSelection();
                        }
                        _this._checkMessage();
                        _this.s.dt.one('draw', function () {
                            _this.s.dt.page(page).draw(false);
                        });
                    });
                }
            });
            for (var _h = 0, _j = this.s.panes; _h < _j.length; _h++) {
                var pane = _j[_h];
                if (pane !== undefined &&
                    pane.s.dtPane !== undefined &&
                    ((pane.s.colOpts.preSelect !== undefined && pane.s.colOpts.preSelect.length > 0) ||
                        (pane.customPaneSettings !== null &&
                            pane.customPaneSettings.preSelect !== undefined &&
                            pane.customPaneSettings.preSelect.length > 0))) {
                    var tableLength = pane.s.dtPane.rows().data().toArray().length;
                    for (var i = 0; i < tableLength; i++) {
                        if (pane.s.colOpts.preSelect.indexOf(pane.s.dtPane.cell(i, 0).data()) !== -1 ||
                            (pane.customPaneSettings !== null &&
                                pane.customPaneSettings.preSelect !== undefined &&
                                pane.customPaneSettings.preSelect.indexOf(pane.s.dtPane.cell(i, 0).data()) !== -1)) {
                            pane.s.dtPane.row(i).select();
                        }
                    }
                    pane.updateTable();
                }
            }
            if (this.s.selectionList !== undefined && this.s.selectionList.length > 0) {
                var last = this.s.selectionList[this.s.selectionList.length - 1].index;
                for (var _k = 0, _l = this.s.panes; _k < _l.length; _k++) {
                    var pane = _l[_k];
                    pane.s.lastSelect = (pane.s.index === last);
                }
            }
            if (this.s.selectionList.length > 0 && this.c.cascadePanes) {
                this._cascadeRegen(this.s.selectionList);
            }
            this._updateFilterCount();
            table.on('destroy.dtsps', function () {
                for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    pane.destroy();
                }
                table.off('.dtsps');
                $$1(_this.dom.clearAll).off('.dtsps');
                $$1(_this.dom.container).remove();
                _this.clearSelections();
            });
            if (this.c.clear) {
                $$1(this.dom.clearAll).on('click.dtsps', function () {
                    _this.clearSelections();
                });
            }
            table.settings()[0]._searchPanes = this;
        };
        SearchPanes.prototype._prepViewTotal = function () {
            var filterPane = this.s.filterPane;
            var filterActive = false;
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    var selectLength = pane.s.dtPane.rows({ selected: true }).data().toArray().length;
                    if (selectLength > 0 && filterPane === -1) {
                        filterPane = pane.s.index;
                        filterActive = true;
                    }
                    else if (selectLength > 0) {
                        filterPane = null;
                    }
                }
            }
            for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                var pane = _c[_b];
                if (pane.s.dtPane !== undefined) {
                    pane.s.filteringActive = true;
                    if ((filterPane !== -1 && filterPane !== null && filterPane === pane.s.index) || filterActive === false) {
                        pane.s.filteringActive = false;
                    }
                }
            }
        };
        SearchPanes.prototype._updateFilterCount = function () {
            var filterCount = 0;
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    filterCount += pane.getPaneCount();
                }
            }
            var message = this.s.dt.i18n('searchPanes.title', 'Filters Active - %d', filterCount);
            $$1(this.dom.title).text(message);
            if (this.c.filterChanged !== undefined && typeof this.c.filterChanged === 'function') {
                this.c.filterChanged.call(this.s.dt, filterCount);
            }
        };
        SearchPanes.prototype._updateSelection = function () {
            this.s.selectionList = [];
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    this.s.selectionList.push({ index: pane.s.index, rows: pane.s.dtPane.rows({ selected: true }).data().toArray(), protect: false });
                }
            }
            this.s.dt.state.save();
        };
        SearchPanes.version = '1.2.2';
        SearchPanes.classes = {
            clear: 'dtsp-clear',
            clearAll: 'dtsp-clearAll',
            container: 'dtsp-searchPanes',
            emptyMessage: 'dtsp-emptyMessage',
            hide: 'dtsp-hidden',
            panes: 'dtsp-panesContainer',
            search: 'dtsp-search',
            title: 'dtsp-title',
            titleRow: 'dtsp-titleRow'
        };
        SearchPanes.defaults = {
            cascadePanes: false,
            clear: true,
            container: function (dt) {
                return dt.table().container();
            },
            columns: [],
            filterChanged: undefined,
            layout: 'columns-3',
            order: [],
            panes: [],
            viewTotal: false
        };
        return SearchPanes;
    }());

    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            define(['jquery', 'datatables.net'], function ($) {
                return factory($, window, document);
            });
        }
        else if (typeof exports === 'object') {
            module.exports = function (root, $) {
                if (!root) {
                    root = window;
                }
                if (!$ || !$.fn.dataTable) {
                    $ = require('datatables.net')(root, $).$;
                }
                return factory($, root, root.document);
            };
        }
        else {
            factory(window.jQuery, window, document);
        }
    }(function ($, window, document) {
        setJQuery($);
        setJQuery$1($);
        var DataTable = $.fn.dataTable;
        $.fn.dataTable.SearchPanes = SearchPanes;
        $.fn.DataTable.SearchPanes = SearchPanes;
        $.fn.dataTable.SearchPane = SearchPane;
        $.fn.DataTable.SearchPane = SearchPane;
        var apiRegister = $.fn.dataTable.Api.register;
        apiRegister('searchPanes()', function () {
            return this;
        });
        apiRegister('searchPanes.clearSelections()', function () {
            return this.iterator('table', function (ctx) {
                if (ctx._searchPanes) {
                    ctx._searchPanes.clearSelections();
                }
            });
        });
        apiRegister('searchPanes.rebuildPane()', function (targetIdx, maintainSelections) {
            return this.iterator('table', function (ctx) {
                if (ctx._searchPanes) {
                    ctx._searchPanes.rebuild(targetIdx, maintainSelections);
                }
            });
        });
        apiRegister('searchPanes.container()', function () {
            var ctx = this.context[0];
            return ctx._searchPanes
                ? ctx._searchPanes.getNode()
                : null;
        });
        $.fn.dataTable.ext.buttons.searchPanesClear = {
            text: 'Clear Panes',
            action: function (e, dt, node, config) {
                dt.searchPanes.clearSelections();
            }
        };
        $.fn.dataTable.ext.buttons.searchPanes = {
            action: function (e, dt, node, config) {
                e.stopPropagation();
                this.popover(config._panes.getNode(), {
                    align: 'dt-container'
                });
                config._panes.rebuild(undefined, true);
            },
            config: {},
            init: function (dt, node, config) {
                var panes = new $.fn.dataTable.SearchPanes(dt, $.extend({
                    filterChanged: function (count) {
                        dt.button(node).text(dt.i18n('searchPanes.collapse', { 0: 'SearchPanes', _: 'SearchPanes (%d)' }, count));
                    }
                }, config.config));
                var message = dt.i18n('searchPanes.collapse', 'SearchPanes', 0);
                dt.button(node).text(message);
                config._panes = panes;
            },
            text: 'Search Panes'
        };
        function _init(settings, fromPre) {
            if (fromPre === void 0) { fromPre = false; }
            var api = new DataTable.Api(settings);
            var opts = api.init().searchPanes || DataTable.defaults.searchPanes;
            var searchPanes = new SearchPanes(api, opts, fromPre);
            var node = searchPanes.getNode();
            return node;
        }
        $(document).on('preInit.dt.dtsp', function (e, settings, json) {
            if (e.namespace !== 'dt') {
                return;
            }
            if (settings.oInit.searchPanes ||
                DataTable.defaults.searchPanes) {
                if (!settings._searchPanes) {
                    _init(settings, true);
                }
            }
        });
        DataTable.ext.feature.push({
            cFeature: 'P',
            fnInit: _init
        });
        if (DataTable.ext.features) {
            DataTable.ext.features.register('searchPanes', _init);
        }
    }));

}());


(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'datatables.net-dt', 'datatables.net-searchpanes'], function ($) {
            return factory($, window, document);
        });
    }
    else if (typeof exports === 'object') {
        module.exports = function (root, $) {
            if (!root) {
                root = window;
            }
            if (!$ || !$.fn.dataTable) {
                $ = require('datatables.net-dt')(root, $).$;
            }
            if (!$.fn.dataTable.SearchPanes) {
                require('datatables.net-searchpanes')(root, $);
            }
            return factory($, root, root.document);
        };
    }
    else {
        factory(jQuery, window, document);
    }
}(function ($, window, document) {
    'use strict';
    var DataTable = $.fn.dataTable;
    return DataTable.searchPanes;
}));



(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


DataTable.select = {};

DataTable.select.version = '1.3.3';

DataTable.select.init = function ( dt ) {
	var ctx = dt.settings()[0];
	var init = ctx.oInit.select;
	var defaults = DataTable.defaults.select;
	var opts = init === undefined ?
		defaults :
		init;

	var items = 'row';
	var style = 'api';
	var blurable = false;
	var toggleable = true;
	var info = true;
	var selector = 'td, th';
	var className = 'selected';
	var setStyle = false;

	ctx._select = {};

	if ( opts === true ) {
		style = 'os';
		setStyle = true;
	}
	else if ( typeof opts === 'string' ) {
		style = opts;
		setStyle = true;
	}
	else if ( $.isPlainObject( opts ) ) {
		if ( opts.blurable !== undefined ) {
			blurable = opts.blurable;
		}

				if ( opts.toggleable !== undefined ) {
			toggleable = opts.toggleable;
		}

		if ( opts.info !== undefined ) {
			info = opts.info;
		}

		if ( opts.items !== undefined ) {
			items = opts.items;
		}

		if ( opts.style !== undefined ) {
			style = opts.style;
			setStyle = true;
		}
		else {
			style = 'os';
			setStyle = true;
		}

		if ( opts.selector !== undefined ) {
			selector = opts.selector;
		}

		if ( opts.className !== undefined ) {
			className = opts.className;
		}
	}

	dt.select.selector( selector );
	dt.select.items( items );
	dt.select.style( style );
	dt.select.blurable( blurable );
	dt.select.toggleable( toggleable );
	dt.select.info( info );
	ctx._select.className = className;


	$.fn.dataTable.ext.order['select-checkbox'] = function ( settings, col ) {
		return this.api().column( col, {order: 'index'} ).nodes().map( function ( td ) {
			if ( settings._select.items === 'row' ) {
				return $( td ).parent().hasClass( settings._select.className );
			} else if ( settings._select.items === 'cell' ) {
				return $( td ).hasClass( settings._select.className );
			}
			return false;
		});
	};

	if ( ! setStyle && $( dt.table().node() ).hasClass( 'selectable' ) ) {
		dt.select.style( 'os' );
	}
};




function cellRange( dt, idx, last )
{
	var indexes;
	var columnIndexes;
	var rowIndexes;
	var selectColumns = function ( start, end ) {
		if ( start > end ) {
			var tmp = end;
			end = start;
			start = tmp;
		}

				var record = false;
		return dt.columns( ':visible' ).indexes().filter( function (i) {
			if ( i === start ) {
				record = true;
			}

						if ( i === end ) { 
				record = false;
				return true;
			}

			return record;
		} );
	};

	var selectRows = function ( start, end ) {
		var indexes = dt.rows( { search: 'applied' } ).indexes();

		if ( indexes.indexOf( start ) > indexes.indexOf( end ) ) {
			var tmp = end;
			end = start;
			start = tmp;
		}

		var record = false;
		return indexes.filter( function (i) {
			if ( i === start ) {
				record = true;
			}

						if ( i === end ) {
				record = false;
				return true;
			}

			return record;
		} );
	};

	if ( ! dt.cells( { selected: true } ).any() && ! last ) {
		columnIndexes = selectColumns( 0, idx.column );
		rowIndexes = selectRows( 0 , idx.row );
	}
	else {
		columnIndexes = selectColumns( last.column, idx.column );
		rowIndexes = selectRows( last.row , idx.row );
	}

	indexes = dt.cells( rowIndexes, columnIndexes ).flatten();

	if ( ! dt.cells( idx, { selected: true } ).any() ) {
		dt.cells( indexes ).select();
	}
	else {
		dt.cells( indexes ).deselect();
	}
}

function disableMouseSelection( dt )
{
	var ctx = dt.settings()[0];
	var selector = ctx._select.selector;

	$( dt.table().container() )
		.off( 'mousedown.dtSelect', selector )
		.off( 'mouseup.dtSelect', selector )
		.off( 'click.dtSelect', selector );

	$('body').off( 'click.dtSelect' + _safeId(dt.table().node()) );
}

function enableMouseSelection ( dt )
{
	var container = $( dt.table().container() );
	var ctx = dt.settings()[0];
	var selector = ctx._select.selector;
	var matchSelection;

	container
		.on( 'mousedown.dtSelect', selector, function(e) {
			if ( e.shiftKey || e.metaKey || e.ctrlKey ) {
				container
					.css( '-moz-user-select', 'none' )
					.one('selectstart.dtSelect', selector, function () {
						return false;
					} );
			}

			if ( window.getSelection ) {
				matchSelection = window.getSelection();
			}
		} )
		.on( 'mouseup.dtSelect', selector, function() {
			container.css( '-moz-user-select', '' );
		} )
		.on( 'click.dtSelect', selector, function ( e ) {
			var items = dt.select.items();
			var idx;

			if ( matchSelection ) {
				var selection = window.getSelection();

				if ( ! selection.anchorNode || $(selection.anchorNode).closest('table')[0] === dt.table().node() ) {
					if ( selection !== matchSelection ) {
						return;
					}
				}
			}

			var ctx = dt.settings()[0];
			var wrapperClass = dt.settings()[0].oClasses.sWrapper.trim().replace(/ +/g, '.');

			if ( $(e.target).closest('div.'+wrapperClass)[0] != dt.table().container() ) {
				return;
			}

			var cell = dt.cell( $(e.target).closest('td, th') );

			if ( ! cell.any() ) {
				return;
			}

			var event = $.Event('user-select.dt');
			eventTrigger( dt, event, [ items, cell, e ] );

			if ( event.isDefaultPrevented() ) {
				return;
			}

			var cellIndex = cell.index();
			if ( items === 'row' ) {
				idx = cellIndex.row;
				typeSelect( e, dt, ctx, 'row', idx );
			}
			else if ( items === 'column' ) {
				idx = cell.index().column;
				typeSelect( e, dt, ctx, 'column', idx );
			}
			else if ( items === 'cell' ) {
				idx = cell.index();
				typeSelect( e, dt, ctx, 'cell', idx );
			}

			ctx._select_lastCell = cellIndex;
		} );

	$('body').on( 'click.dtSelect' + _safeId(dt.table().node()), function ( e ) {
		if ( ctx._select.blurable ) {
			if ( $(e.target).parents().filter( dt.table().container() ).length ) {
				return;
			}

			if ( $(e.target).parents('html').length === 0 ) {
			 	return;
			}

			if ( $(e.target).parents('div.DTE').length ) {
				return;
			}

			clear( ctx, true );
		}
	} );
}

function eventTrigger ( api, type, args, any )
{
	if ( any && ! api.flatten().length ) {
		return;
	}

	if ( typeof type === 'string' ) {
		type = type +'.dt';
	}

	args.unshift( api );

	$(api.table().node()).trigger( type, args );
}

function info ( api )
{
	var ctx = api.settings()[0];

	if ( ! ctx._select.info || ! ctx.aanFeatures.i ) {
		return;
	}

	if ( api.select.style() === 'api' ) {
		return;
	}

	var rows    = api.rows( { selected: true } ).flatten().length;
	var columns = api.columns( { selected: true } ).flatten().length;
	var cells   = api.cells( { selected: true } ).flatten().length;

	var add = function ( el, name, num ) {
		el.append( $('<span class="select-item"/>').append( api.i18n(
			'select.'+name+'s',
			{ _: '%d '+name+'s selected', 0: '', 1: '1 '+name+' selected' },
			num
		) ) );
	};

	$.each( ctx.aanFeatures.i, function ( i, el ) {
		el = $(el);

		var output  = $('<span class="select-info"/>');
		add( output, 'row', rows );
		add( output, 'column', columns );
		add( output, 'cell', cells  );

		var exisiting = el.children('span.select-info');
		if ( exisiting.length ) {
			exisiting.remove();
		}

		if ( output.text() !== '' ) {
			el.append( output );
		}
	} );
}

function init ( ctx ) {
	var api = new DataTable.Api( ctx );

	ctx.aoRowCreatedCallback.push( {
		fn: function ( row, data, index ) {
			var i, ien;
			var d = ctx.aoData[ index ];

			if ( d._select_selected ) {
				$( row ).addClass( ctx._select.className );
			}

			for ( i=0, ien=ctx.aoColumns.length ; i<ien ; i++ ) {
				if ( ctx.aoColumns[i]._select_selected || (d._selected_cells && d._selected_cells[i]) ) {
					$(d.anCells[i]).addClass( ctx._select.className );
				}
			}
		},
		sName: 'select-deferRender'
	} );

	api.on( 'preXhr.dt.dtSelect', function (e, settings) {
		if (settings !== api.settings()[0]) {
			return;
		}

		var rows = api.rows( { selected: true } ).ids( true ).filter( function ( d ) {
			return d !== undefined;
		} );

		var cells = api.cells( { selected: true } ).eq(0).map( function ( cellIdx ) {
			var id = api.row( cellIdx.row ).id( true );
			return id ?
				{ row: id, column: cellIdx.column } :
				undefined;
		} ).filter( function ( d ) {
			return d !== undefined;
		} );

		api.one( 'draw.dt.dtSelect', function () {
			api.rows( rows ).select();

			if ( cells.any() ) {
				cells.each( function ( id ) {
					api.cells( id.row, id.column ).select();
				} );
			}
		} );
	} );

	api.on( 'draw.dtSelect.dt select.dtSelect.dt deselect.dtSelect.dt info.dt', function () {
		info( api );
	} );

	api.on( 'destroy.dtSelect', function () {
		api.rows({selected: true}).deselect();

		disableMouseSelection( api );
		api.off( '.dtSelect' );
	} );
}

function rowColumnRange( dt, type, idx, last )
{
	var indexes = dt[type+'s']( { search: 'applied' } ).indexes();
	var idx1 = $.inArray( last, indexes );
	var idx2 = $.inArray( idx, indexes );

	if ( ! dt[type+'s']( { selected: true } ).any() && idx1 === -1 ) {
		indexes.splice( $.inArray( idx, indexes )+1, indexes.length );
	}
	else {
		if ( idx1 > idx2 ) {
			var tmp = idx2;
			idx2 = idx1;
			idx1 = tmp;
		}

		indexes.splice( idx2+1, indexes.length );
		indexes.splice( 0, idx1 );
	}

	if ( ! dt[type]( idx, { selected: true } ).any() ) {
		dt[type+'s']( indexes ).select();
	}
	else {
		indexes.splice( $.inArray( idx, indexes ), 1 );
		dt[type+'s']( indexes ).deselect();
	}
}

function clear( ctx, force )
{
	if ( force || ctx._select.style === 'single' ) {
		var api = new DataTable.Api( ctx );

				api.rows( { selected: true } ).deselect();
		api.columns( { selected: true } ).deselect();
		api.cells( { selected: true } ).deselect();
	}
}

function typeSelect ( e, dt, ctx, type, idx )
{
	var style = dt.select.style();
	var toggleable = dt.select.toggleable();
	var isSelected = dt[type]( idx, { selected: true } ).any();

		if ( isSelected && ! toggleable ) {
		return;
	}

	if ( style === 'os' ) {
		if ( e.ctrlKey || e.metaKey ) {
			dt[type]( idx ).select( ! isSelected );
		}
		else if ( e.shiftKey ) {
			if ( type === 'cell' ) {
				cellRange( dt, idx, ctx._select_lastCell || null );
			}
			else {
				rowColumnRange( dt, type, idx, ctx._select_lastCell ?
					ctx._select_lastCell[type] :
					null
				);
			}
		}
		else {
			var selected = dt[type+'s']( { selected: true } );

			if ( isSelected && selected.flatten().length === 1 ) {
				dt[type]( idx ).deselect();
			}
			else {
				selected.deselect();
				dt[type]( idx ).select();
			}
		}
	} else if ( style == 'multi+shift' ) {
		if ( e.shiftKey ) {
			if ( type === 'cell' ) {
				cellRange( dt, idx, ctx._select_lastCell || null );
			}
			else {
				rowColumnRange( dt, type, idx, ctx._select_lastCell ?
					ctx._select_lastCell[type] :
					null
				);
			}
		}
		else {
			dt[ type ]( idx ).select( ! isSelected );
		}
	}
	else {
		dt[ type ]( idx ).select( ! isSelected );
	}
}

function _safeId( node ) {
	return node.id.replace(/[^a-zA-Z0-9\-\_]/g, '-');
}




$.each( [
	{ type: 'row', prop: 'aoData' },
	{ type: 'column', prop: 'aoColumns' }
], function ( i, o ) {
	DataTable.ext.selector[ o.type ].push( function ( settings, opts, indexes ) {
		var selected = opts.selected;
		var data;
		var out = [];

		if ( selected !== true && selected !== false ) {
			return indexes;
		}

		for ( var i=0, ien=indexes.length ; i<ien ; i++ ) {
			data = settings[ o.prop ][ indexes[i] ];

			if ( (selected === true && data._select_selected === true) ||
			     (selected === false && ! data._select_selected )
			) {
				out.push( indexes[i] );
			}
		}

		return out;
	} );
} );

DataTable.ext.selector.cell.push( function ( settings, opts, cells ) {
	var selected = opts.selected;
	var rowData;
	var out = [];

	if ( selected === undefined ) {
		return cells;
	}

	for ( var i=0, ien=cells.length ; i<ien ; i++ ) {
		rowData = settings.aoData[ cells[i].row ];

		if ( (selected === true && rowData._selected_cells && rowData._selected_cells[ cells[i].column ] === true) ||
		     (selected === false && ( ! rowData._selected_cells || ! rowData._selected_cells[ cells[i].column ] ) )
		) {
			out.push( cells[i] );
		}
	}

	return out;
} );




var apiRegister = DataTable.Api.register;
var apiRegisterPlural = DataTable.Api.registerPlural;

apiRegister( 'select()', function () {
	return this.iterator( 'table', function ( ctx ) {
		DataTable.select.init( new DataTable.Api( ctx ) );
	} );
} );

apiRegister( 'select.blurable()', function ( flag ) {
	if ( flag === undefined ) {
		return this.context[0]._select.blurable;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.blurable = flag;
	} );
} );

apiRegister( 'select.toggleable()', function ( flag ) {
	if ( flag === undefined ) {
		return this.context[0]._select.toggleable;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.toggleable = flag;
	} );
} );

apiRegister( 'select.info()', function ( flag ) {
	if ( flag === undefined ) {
		return this.context[0]._select.info;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.info = flag;
	} );
} );

apiRegister( 'select.items()', function ( items ) {
	if ( items === undefined ) {
		return this.context[0]._select.items;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.items = items;

		eventTrigger( new DataTable.Api( ctx ), 'selectItems', [ items ] );
	} );
} );

apiRegister( 'select.style()', function ( style ) {
	if ( style === undefined ) {
		return this.context[0]._select.style;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.style = style;

		if ( ! ctx._select_init ) {
			init( ctx );
		}

		var dt = new DataTable.Api( ctx );
		disableMouseSelection( dt );

				if ( style !== 'api' ) {
			enableMouseSelection( dt );
		}

		eventTrigger( new DataTable.Api( ctx ), 'selectStyle', [ style ] );
	} );
} );

apiRegister( 'select.selector()', function ( selector ) {
	if ( selector === undefined ) {
		return this.context[0]._select.selector;
	}

	return this.iterator( 'table', function ( ctx ) {
		disableMouseSelection( new DataTable.Api( ctx ) );

		ctx._select.selector = selector;

		if ( ctx._select.style !== 'api' ) {
			enableMouseSelection( new DataTable.Api( ctx ) );
		}
	} );
} );



apiRegisterPlural( 'rows().select()', 'row().select()', function ( select ) {
	var api = this;

	if ( select === false ) {
		return this.deselect();
	}

	this.iterator( 'row', function ( ctx, idx ) {
		clear( ctx );

		ctx.aoData[ idx ]._select_selected = true;
		$( ctx.aoData[ idx ].nTr ).addClass( ctx._select.className );
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'select', [ 'row', api[i] ], true );
	} );

	return this;
} );

apiRegisterPlural( 'columns().select()', 'column().select()', function ( select ) {
	var api = this;

	if ( select === false ) {
		return this.deselect();
	}

	this.iterator( 'column', function ( ctx, idx ) {
		clear( ctx );

		ctx.aoColumns[ idx ]._select_selected = true;

		var column = new DataTable.Api( ctx ).column( idx );

		$( column.header() ).addClass( ctx._select.className );
		$( column.footer() ).addClass( ctx._select.className );

		column.nodes().to$().addClass( ctx._select.className );
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'select', [ 'column', api[i] ], true );
	} );

	return this;
} );

apiRegisterPlural( 'cells().select()', 'cell().select()', function ( select ) {
	var api = this;

	if ( select === false ) {
		return this.deselect();
	}

	this.iterator( 'cell', function ( ctx, rowIdx, colIdx ) {
		clear( ctx );

		var data = ctx.aoData[ rowIdx ];

		if ( data._selected_cells === undefined ) {
			data._selected_cells = [];
		}

		data._selected_cells[ colIdx ] = true;

		if ( data.anCells ) {
			$( data.anCells[ colIdx ] ).addClass( ctx._select.className );
		}
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'select', [ 'cell', api.cells(api[i]).indexes().toArray() ], true );
	} );

	return this;
} );


apiRegisterPlural( 'rows().deselect()', 'row().deselect()', function () {
	var api = this;

	this.iterator( 'row', function ( ctx, idx ) {
		ctx.aoData[ idx ]._select_selected = false;
		ctx._select_lastCell = null;
		$( ctx.aoData[ idx ].nTr ).removeClass( ctx._select.className );
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'deselect', [ 'row', api[i] ], true );
	} );

	return this;
} );

apiRegisterPlural( 'columns().deselect()', 'column().deselect()', function () {
	var api = this;

	this.iterator( 'column', function ( ctx, idx ) {
		ctx.aoColumns[ idx ]._select_selected = false;

		var api = new DataTable.Api( ctx );
		var column = api.column( idx );

		$( column.header() ).removeClass( ctx._select.className );
		$( column.footer() ).removeClass( ctx._select.className );

		api.cells( null, idx ).indexes().each( function (cellIdx) {
			var data = ctx.aoData[ cellIdx.row ];
			var cellSelected = data._selected_cells;

			if ( data.anCells && (! cellSelected || ! cellSelected[ cellIdx.column ]) ) {
				$( data.anCells[ cellIdx.column  ] ).removeClass( ctx._select.className );
			}
		} );
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'deselect', [ 'column', api[i] ], true );
	} );

	return this;
} );

apiRegisterPlural( 'cells().deselect()', 'cell().deselect()', function () {
	var api = this;

	this.iterator( 'cell', function ( ctx, rowIdx, colIdx ) {
		var data = ctx.aoData[ rowIdx ];

		data._selected_cells[ colIdx ] = false;

		if ( data.anCells && ! ctx.aoColumns[ colIdx ]._select_selected ) {
			$( data.anCells[ colIdx ] ).removeClass( ctx._select.className );
		}
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'deselect', [ 'cell', api[i] ], true );
	} );

	return this;
} );



function i18n( label, def ) {
	return function (dt) {
		return dt.i18n( 'buttons.'+label, def );
	};
}

function namespacedEvents ( config ) {
	var unique = config._eventNamespace;

	return 'draw.dt.DT'+unique+' select.dt.DT'+unique+' deselect.dt.DT'+unique;
}

function enabled ( dt, config ) {
	if ( $.inArray( 'rows', config.limitTo ) !== -1 && dt.rows( { selected: true } ).any() ) {
		return true;
	}

	if ( $.inArray( 'columns', config.limitTo ) !== -1 && dt.columns( { selected: true } ).any() ) {
		return true;
	}

	if ( $.inArray( 'cells', config.limitTo ) !== -1 && dt.cells( { selected: true } ).any() ) {
		return true;
	}

	return false;
}

var _buttonNamespace = 0;

$.extend( DataTable.ext.buttons, {
	selected: {
		text: i18n( 'selected', 'Selected' ),
		className: 'buttons-selected',
		limitTo: [ 'rows', 'columns', 'cells' ],
		init: function ( dt, node, config ) {
			var that = this;
			config._eventNamespace = '.select'+(_buttonNamespace++);

			dt.on( namespacedEvents(config), function () {
				that.enable( enabled(dt, config) );
			} );

			this.disable();
		},
		destroy: function ( dt, node, config ) {
			dt.off( config._eventNamespace );
		}
	},
	selectedSingle: {
		text: i18n( 'selectedSingle', 'Selected single' ),
		className: 'buttons-selected-single',
		init: function ( dt, node, config ) {
			var that = this;
			config._eventNamespace = '.select'+(_buttonNamespace++);

			dt.on( namespacedEvents(config), function () {
				var count = dt.rows( { selected: true } ).flatten().length +
				            dt.columns( { selected: true } ).flatten().length +
				            dt.cells( { selected: true } ).flatten().length;

				that.enable( count === 1 );
			} );

			this.disable();
		},
		destroy: function ( dt, node, config ) {
			dt.off( config._eventNamespace );
		}
	},
	selectAll: {
		text: i18n( 'selectAll', 'Select all' ),
		className: 'buttons-select-all',
		action: function () {
			var items = this.select.items();
			this[ items+'s' ]().select();
		}
	},
	selectNone: {
		text: i18n( 'selectNone', 'Deselect all' ),
		className: 'buttons-select-none',
		action: function () {
			clear( this.settings()[0], true );
		},
		init: function ( dt, node, config ) {
			var that = this;
			config._eventNamespace = '.select'+(_buttonNamespace++);

			dt.on( namespacedEvents(config), function () {
				var count = dt.rows( { selected: true } ).flatten().length +
				            dt.columns( { selected: true } ).flatten().length +
				            dt.cells( { selected: true } ).flatten().length;

				that.enable( count > 0 );
			} );

			this.disable();
		},
		destroy: function ( dt, node, config ) {
			dt.off( config._eventNamespace );
		}
	}
} );

$.each( [ 'Row', 'Column', 'Cell' ], function ( i, item ) {
	var lc = item.toLowerCase();

	DataTable.ext.buttons[ 'select'+item+'s' ] = {
		text: i18n( 'select'+item+'s', 'Select '+lc+'s' ),
		className: 'buttons-select-'+lc+'s',
		action: function () {
			this.select.items( lc );
		},
		init: function ( dt ) {
			var that = this;

			dt.on( 'selectItems.dt.DT', function ( e, ctx, items ) {
				that.active( items === lc );
			} );
		}
	};
} );




$(document).on( 'preInit.dt.dtSelect', function (e, ctx) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	DataTable.select.init( new DataTable.Api( ctx ) );
} );


return DataTable.select;
}));



(function( factory ){
   if ( typeof define === 'function' && define.amd ) {
      define( ['jquery', 'datatables.net'], function ( $ ) {
         return factory( $, window, document );
      } );
   }
   else if ( typeof exports === 'object' ) {
      module.exports = function (root, $) {
         if ( ! root ) {
            root = window;
         }

         if ( ! $ || ! $.fn.dataTable ) {
            $ = require('datatables.net')(root, $).$;
         }

         return factory( $, root, root.document );
      };
   }
   else {
      factory( jQuery, window, document );
   }
}(function( $, window, document ) {
   'use strict';
   var DataTable = $.fn.dataTable;


   var Checkboxes = function ( settings ) {
      if ( ! DataTable.versionCheck || ! DataTable.versionCheck( '1.10.8' ) ) {
         throw 'DataTables Checkboxes requires DataTables 1.10.8 or newer';
      }

      this.s = {
         dt: new DataTable.Api( settings ),
         columns: [],
         data: {},
         dataDisabled: {},
         ignoreSelect: false
      };

      this.s.ctx = this.s.dt.settings()[0];

      if ( this.s.ctx.checkboxes ) {
         return;
      }

      settings.checkboxes = this;

      this._constructor();
   };


   Checkboxes.prototype = {

      _constructor: function ()
      {
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;
         var hasCheckboxes = false;
         var hasCheckboxesSelectRow = false;

         for(var i = 0; i < ctx.aoColumns.length; i++){
            if (ctx.aoColumns[i].checkboxes){
               var $colHeader = $(dt.column(i).header());


               hasCheckboxes = true;

               if(!$.isPlainObject(ctx.aoColumns[i].checkboxes)){
                  ctx.aoColumns[i].checkboxes = {};
               }

               ctx.aoColumns[i].checkboxes = $.extend(
                  {}, Checkboxes.defaults, ctx.aoColumns[i].checkboxes
               );


               var colOptions = {
                  'searchable': false,
                  'orderable': false
               };

               if(ctx.aoColumns[i].sClass === ''){
                  colOptions['className'] = 'dt-checkboxes-cell';
               } else {
                  colOptions['className'] = ctx.aoColumns[i].sClass + ' dt-checkboxes-cell';
               }

               if(ctx.aoColumns[i].sWidthOrig === null){
                  colOptions['width'] = '1%';
               }

               if(ctx.aoColumns[i].mRender === null){
                  colOptions['render'] = function(){
                     return '<input type="checkbox" class="dt-checkboxes" autocomplete="off">';
                  };
               }

               DataTable.ext.internal._fnColumnOptions(ctx, i, colOptions);


               $colHeader.removeClass('sorting');

               $colHeader.off('.dt');

               if(ctx.sAjaxSource === null){
                  var cells = dt.cells('tr', i);
                  cells.invalidate('data');

                  $(cells.nodes()).addClass(colOptions['className']);
               }



               self.s.data[i] = {};
               self.s.dataDisabled[i] = {};

               self.s.columns.push(i);



               if(ctx.aoColumns[i].checkboxes.selectRow){

                  if(ctx._select){
                     hasCheckboxesSelectRow = true;

                  } else {
                     ctx.aoColumns[i].checkboxes.selectRow = false;
                  }
               }

               if(ctx.aoColumns[i].checkboxes.selectAll){
                  $colHeader.data('html', $colHeader.html());

                  if(ctx.aoColumns[i].checkboxes.selectAllRender !== null){
                     var selectAllHtml = '';

                     if($.isFunction(ctx.aoColumns[i].checkboxes.selectAllRender)){
                        selectAllHtml = ctx.aoColumns[i].checkboxes.selectAllRender();

                     } else if(typeof ctx.aoColumns[i].checkboxes.selectAllRender === 'string'){
                        selectAllHtml = ctx.aoColumns[i].checkboxes.selectAllRender;
                     }

                     $colHeader
                        .html(selectAllHtml)
                        .addClass('dt-checkboxes-select-all')
                        .attr('data-col', i);
                  }
               }
            }
         }

         if(hasCheckboxes){

            self.loadState();


            var $table = $(dt.table().node());
            var $tableBody = $(dt.table().body());
            var $tableContainer = $(dt.table().container());

            if(hasCheckboxesSelectRow){
               $table.addClass('dt-checkboxes-select');

               $table.on('user-select.dt.dtCheckboxes', function (e, dt, type, cell , originalEvent){
                  self.onDataTablesUserSelect(e, dt, type, cell , originalEvent);
               });

               $table.on('select.dt.dtCheckboxes deselect.dt.dtCheckboxes', function(e, api, type, indexes){
                  self.onDataTablesSelectDeselect(e, type, indexes);
               });

               if(ctx._select.info){
                  dt.select.info(false);

                  $table.on('draw.dt.dtCheckboxes select.dt.dtCheckboxes deselect.dt.dtCheckboxes', function(){
                     self.showInfoSelected();
                  });
               }
            }

            $table.on('draw.dt.dtCheckboxes', function(e){
               self.onDataTablesDraw(e);
            });

            $tableBody.on('click.dtCheckboxes', 'input.dt-checkboxes', function(e){
               self.onClick(e, this);
            });

            $tableContainer.on('click.dtCheckboxes', 'thead th.dt-checkboxes-select-all input[type="checkbox"]', function(e){
               self.onClickSelectAll(e, this);
            });

            $tableContainer.on('click.dtCheckboxes', 'thead th.dt-checkboxes-select-all', function() {
               $('input[type="checkbox"]', this).not(':disabled').trigger('click');
            });

            if(!hasCheckboxesSelectRow){
               $tableContainer.on('click.dtCheckboxes', 'tbody td.dt-checkboxes-cell', function() {
                  $('input[type="checkbox"]', this).not(':disabled').trigger('click');
               });
            }

            $tableContainer.on('click.dtCheckboxes', 'thead th.dt-checkboxes-select-all label, tbody td.dt-checkboxes-cell label', function(e) {
               e.preventDefault();
            });

            $(document).on('click.dtCheckboxes', '.fixedHeader-floating thead th.dt-checkboxes-select-all input[type="checkbox"]', function(e){
               if(ctx._fixedHeader){
                  if(ctx._fixedHeader.dom['header'].floating){
                     self.onClickSelectAll(e, this);
                  }
               }
            });

            $(document).on('click.dtCheckboxes', '.fixedHeader-floating thead th.dt-checkboxes-select-all', function() {
               if(ctx._fixedHeader){
                  if(ctx._fixedHeader.dom['header'].floating){
                     $('input[type="checkbox"]', this).trigger('click');
                  }
               }
            });

            $table.on('init.dt.dtCheckboxes', function(){
               setTimeout(function(){
                   self.onDataTablesInit();
               }, 0);
            });

            $table.on('stateSaveParams.dt.dtCheckboxes', function (e, settings, data) {
               self.onDataTablesStateSave(e, settings, data);
            });

            $table.one('destroy.dt.dtCheckboxes', function(e, settings){
               self.onDataTablesDestroy(e, settings);
            });
         }
      },

      onDataTablesInit: function(){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         if(!ctx.oFeatures.bServerSide){

            if(ctx.oFeatures.bStateSave){
               self.updateState();
            }

            $(dt.table().node()).on('xhr.dt.dtCheckboxes', function ( e, settings , json, xhr ) {
               self.onDataTablesXhr(e. settings, json, xhr);
            });
         }
      },

      onDataTablesUserSelect: function ( e, dt, type, cell  ){
         var self = this;

         var cellIdx = cell.index();
         var rowIdx = cellIdx.row;
         var colIdx = self.getSelectRowColIndex();
         var cellData = dt.cell({ row: rowIdx, column: colIdx }).data();

         if(!self.isCellSelectable(colIdx, cellData)){
            e.preventDefault();
         }
      },

      onDataTablesSelectDeselect: function(e, type, indexes){
         var self = this;
         var dt = self.s.dt;

         if(self.s.ignoreSelect){ return; }

         if(type === 'row'){
            var colIdx = self.getSelectRowColIndex();
            if(colIdx !== null){
               var cells = dt.cells(indexes, colIdx);

               self.updateData(cells, colIdx, (e.type === 'select') ? true : false);
               self.updateCheckbox(cells, colIdx, (e.type === 'select') ? true : false);
               self.updateSelectAll(colIdx);
            }
         }
      },

      onDataTablesStateSave: function (e, settings, data) {
         var self = this;
         var ctx = self.s.ctx;

         $.each(self.s.columns, function(index, colIdx){
            if(ctx.aoColumns[colIdx].checkboxes.stateSave){
               if(!Object.prototype.hasOwnProperty.call(data, 'checkboxes')){
                  data.checkboxes = [];
               }

               data.checkboxes[colIdx] = self.s.data[colIdx];
            }
         });
      },

      onDataTablesDestroy: function(){
         var self = this;
         var dt = self.s.dt;

         var $table = $(dt.table().node());
         var $tableBody = $(dt.table().body());
         var $tableContainer = $(dt.table().container());

         $(document).off('click.dtCheckboxes');
         $tableContainer.off('.dtCheckboxes');
         $tableBody.off('.dtCheckboxes');
         $table.off('.dtCheckboxes');

         self.s.data = {};
         self.s.dataDisabled = {};

         $('.dt-checkboxes-select-all', $table).each(function(index, el){
            $(el)
               .html($(el).data('html'))
               .removeClass('dt-checkboxes-select-all');
         });
      },

      onDataTablesDraw: function(){
         var self = this;
         var ctx = self.s.ctx;

         if(ctx.oFeatures.bServerSide || ctx.oFeatures.bDeferRender){
            self.updateStateCheckboxes({ page: 'current', search: 'none' });
         }

         $.each(self.s.columns, function(index, colIdx){
            self.updateSelectAll(colIdx);
         });         
      },

      onDataTablesXhr: function(  ){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         var $table = $(dt.table().node());

         $.each(self.s.columns, function(index, colIdx){
            self.s.data[colIdx] = {};
            self.s.dataDisabled[colIdx] = {};
         });

         if(ctx.oFeatures.bStateSave){
            self.loadState();

            $table.one('draw.dt.dtCheckboxes', function(){
               self.updateState();
            });
         }
      },

      updateData: function(cells, colIdx, isSelected){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         if(ctx.aoColumns[colIdx].checkboxes){
            var cellsData = cells.data();
            cellsData.each(function(cellData){
               if(isSelected){
                  ctx.checkboxes.s.data[colIdx][cellData] = 1;

               } else {
                  delete ctx.checkboxes.s.data[colIdx][cellData];
               }
            });

            if(ctx.oFeatures.bStateSave){
               if(ctx.aoColumns[colIdx].checkboxes.stateSave){
                  dt.state.save();
               }
            }
         }
      },

      updateSelect: function(selector, isSelected){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         if(ctx._select){
            self.s.ignoreSelect = true;

            if(isSelected){
               dt.rows(selector).select();
            } else {
               dt.rows(selector).deselect();
            }

            self.s.ignoreSelect = false;
         }
      },

      updateCheckbox: function(cells, colIdx, isSelected){
         var self = this;
         var ctx = self.s.ctx;

         var cellNodes = cells.nodes();
         if(cellNodes.length){
            $('input.dt-checkboxes', cellNodes).not(':disabled').prop('checked', isSelected);

            if($.isFunction(ctx.aoColumns[colIdx].checkboxes.selectCallback)){
               ctx.aoColumns[colIdx].checkboxes.selectCallback(cellNodes, isSelected);
            }
         }
      },

      updateState: function(){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         self.updateStateCheckboxes({ page: 'all', search: 'none' });

         if(ctx._oFixedColumns){                   
            setTimeout(function(){
               $.each(self.s.columns, function(index, colIdx){
                  self.updateSelectAll(colIdx);
               });
            }, 0);
         }
      },

      updateStateCheckboxes: function(opts){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         dt.cells('tr', self.s.columns, opts).every(function(rowIdx, colIdx){
            var cellData = this.data();

            var isCellSelectable = self.isCellSelectable(colIdx, cellData);

            if(
               Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.data, colIdx)
               && Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.data[colIdx], cellData)
            ) {
               if(ctx.aoColumns[colIdx].checkboxes.selectRow && isCellSelectable){
                  self.updateSelect(rowIdx, true);
               }

               self.updateCheckbox(this, colIdx, true);
            }

            if(!isCellSelectable){
               $('input.dt-checkboxes', this.node()).prop('disabled', true);
            }
         });
      },

      onClick: function(e, ctrl){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         var cellSelector;

         var $cell = $(ctrl).closest('td');

         if($cell.parents('.DTFC_Cloned').length){
            cellSelector = dt.fixedColumns().cellIndex($cell);

         } else {
            cellSelector = $cell;
         }

         var cell    = dt.cell(cellSelector);
         var cellIdx = cell.index();
         var colIdx  = cellIdx.column;

         if(!ctx.aoColumns[colIdx].checkboxes.selectRow){
            cell.checkboxes.select(ctrl.checked);

            e.stopPropagation();

         } else {
            setTimeout(function(){
               var cellData = cell.data();

               var hasData = (
                  Object.prototype.hasOwnProperty.call(self.s.data, colIdx)
                  && Object.prototype.hasOwnProperty.call(self.s.data[colIdx], cellData)
               );

               if(hasData !== ctrl.checked){
                  self.updateCheckbox(cell, colIdx, hasData);
                  self.updateSelectAll(colIdx);
               }
            }, 0);
         }
      },

      onClickSelectAll: function(e, ctrl){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         var colIdx = null;
         var $th = $(ctrl).closest('th');

         if($th.parents('.DTFC_Cloned').length){
            var cellIdx = dt.fixedColumns().cellIndex($th);
            colIdx = cellIdx.column;
         } else {
            colIdx = dt.column($th).index();
         }

         $(ctrl).data('is-changed', true);

         dt.column(colIdx, {
            page: (
               (ctx.aoColumns[colIdx].checkboxes && ctx.aoColumns[colIdx].checkboxes.selectAllPages)
                  ? 'all'
                  : 'current'
            ),
            search: 'applied'
         }).checkboxes.select(ctrl.checked);

         e.stopPropagation();
      },

      loadState: function () {
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         if(ctx.oFeatures.bStateSave){
            var state = dt.state.loaded();

            $.each(self.s.columns, function(index, colIdx){
               if(state && state.checkboxes && state.checkboxes.hasOwnProperty(colIdx)){
                  if(ctx.aoColumns[colIdx].checkboxes.stateSave){
                     self.s.data[colIdx] = state.checkboxes[colIdx];
                  }
               }
            });
         }
      },

      updateSelectAll: function(colIdx){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         if(ctx.aoColumns[colIdx].checkboxes && ctx.aoColumns[colIdx].checkboxes.selectAll){
            var cells = dt.cells('tr', colIdx, {
               page: (
                  (ctx.aoColumns[colIdx].checkboxes.selectAllPages)
                     ? 'all'
                     : 'current'
               ),
               search: 'applied'
            });

            var $tableContainer = dt.table().container();
            var $checkboxesSelectAll = $('.dt-checkboxes-select-all[data-col="' + colIdx + '"] input[type="checkbox"]', $tableContainer);

            var countChecked = 0;
            var countDisabled = 0;
            var cellsData = cells.data();
            $.each(cellsData, function(index, cellData){
               if(self.isCellSelectable(colIdx, cellData)){
                  if(
                     Object.prototype.hasOwnProperty.call(self.s.data, colIdx)
                     && Object.prototype.hasOwnProperty.call(self.s.data[colIdx], cellData)
                  ) {
                     countChecked++;
                  }

               } else {
                  countDisabled++;
               }
            });

            if(ctx._fixedHeader){
               if(ctx._fixedHeader.dom['header'].floating){
                  $checkboxesSelectAll = $('.fixedHeader-floating .dt-checkboxes-select-all[data-col="' + colIdx + '"] input[type="checkbox"]');
               }
            }

            var isSelected;
            var isIndeterminate;

            if (countChecked === 0){
               isSelected      = false;
               isIndeterminate = false;

            } else if ((countChecked + countDisabled) === cellsData.length){
               isSelected      = true;
               isIndeterminate = false;

            } else {
               isSelected      = true;
               isIndeterminate = true;
            }

            var isChanged          = $checkboxesSelectAll.data('is-changed');
            var isSelectedNow      = $checkboxesSelectAll.prop('checked');
            var isIndeterminateNow = $checkboxesSelectAll.prop('indeterminate');

            if(isChanged || isSelectedNow !== isSelected || isIndeterminateNow !== isIndeterminate){
               $checkboxesSelectAll.data('is-changed', false);

               $checkboxesSelectAll.prop({
                  'checked': isIndeterminate ? false : isSelected,
                  'indeterminate': isIndeterminate
               });

               if($.isFunction(ctx.aoColumns[colIdx].checkboxes.selectAllCallback)){
                  ctx.aoColumns[colIdx].checkboxes.selectAllCallback($checkboxesSelectAll.closest('th').get(0), isSelected, isIndeterminate);
               }
            }
         }
      },

      showInfoSelected: function(){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         if ( ! ctx.aanFeatures.i ) {
            return;
         }

         var colIdx = self.getSelectRowColIndex();

         if(colIdx !== null){
            var countRows = 0;
            for (var cellData in ctx.checkboxes.s.data[colIdx]){
               if(
                  Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.data, colIdx)
                  && Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.data[colIdx], cellData)
               ) {
                  countRows++;
               }
            }

            var add = function($el, name, num){
               $el.append( $('<span class="select-item"/>').append( dt.i18n(
                  'select.'+name+'s',
                  { _: '%d '+name+'s selected', 0: '', 1: '1 '+name+' selected' },
                  num
               ) ) );
            };

            $.each( ctx.aanFeatures.i, function ( i, el ) {
               var $el = $(el);

               var $output  = $('<span class="select-info"/>');
               add($output, 'row', countRows);

               var $existing = $el.children('span.select-info');
               if($existing.length){
                  $existing.remove();
               }

               if($output.text() !== ''){
                  $el.append($output);
               }
            });
         }
      },

      isCellSelectable: function(colIdx, cellData){
         var self = this;
         var ctx = self.s.ctx;

         if(
            Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.dataDisabled, colIdx)
            && Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.dataDisabled[colIdx], cellData)
         ) {
            return false;

         } else {
            return true;
         }
      },

      getCellIndex: function(cell){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         if(ctx._oFixedColumns){
            return dt.fixedColumns().cellIndex(cell);

         } else {
            return dt.cell(cell).index();
         }
      },

      getSelectRowColIndex: function(){
         var self = this;
         var ctx = self.s.ctx;

         var colIdx = null;

         for(var i = 0; i < ctx.aoColumns.length; i++){
            if(ctx.aoColumns[i].checkboxes && ctx.aoColumns[i].checkboxes.selectRow){
               colIdx = i;
               break;
            }
         }

         return colIdx;
      },

      updateFixedColumn: function(colIdx){
         var self = this;
         var dt = self.s.dt;
         var ctx = self.s.ctx;

         if(ctx._oFixedColumns){
            var leftCols = ctx._oFixedColumns.s.iLeftColumns;
            var rightCols = ctx.aoColumns.length - ctx._oFixedColumns.s.iRightColumns - 1;

            if (colIdx < leftCols || colIdx > rightCols){
               dt.fixedColumns().update();

               setTimeout(function(){
                  $.each(self.s.columns, function(index, colIdx){
                     self.updateSelectAll(colIdx);
                  });
               }, 0);
            }
         }
      }
   };


   Checkboxes.defaults = {
      stateSave: true,

      selectRow: false,

      selectAll: true,

      selectAllPages: true,

      selectCallback: null,

      selectAllCallback: null,

      selectAllRender: '<input type="checkbox" autocomplete="off">'
   };


   var Api = $.fn.dataTable.Api;

   Api.register( 'checkboxes()', function () {
      return this;
   } );

   Api.registerPlural( 'columns().checkboxes.select()', 'column().checkboxes.select()', function ( state ) {
      if(typeof state === 'undefined'){ state = true; }

      return this.iterator( 'column-rows', function ( ctx, colIdx, i, j, rowsIdx ) {
         if(ctx.aoColumns[colIdx].checkboxes){
            var selector = [];
            $.each(rowsIdx, function(index, rowIdx){
               selector.push({ row: rowIdx, column: colIdx });
            });

            var cells = this.cells(selector);
            var cellsData = cells.data();

            var rowsSelectableIdx = [];
            selector = [];
            $.each(cellsData, function(index, cellData){
               if(ctx.checkboxes.isCellSelectable(colIdx, cellData)){
                  selector.push({ row: rowsIdx[index], column: colIdx });
                  rowsSelectableIdx.push(rowsIdx[index]);
               }
            });

            cells = this.cells(selector);

            ctx.checkboxes.updateData(cells, colIdx, state);

            if(ctx.aoColumns[colIdx].checkboxes.selectRow){
               ctx.checkboxes.updateSelect(rowsSelectableIdx, state);
            }

            ctx.checkboxes.updateCheckbox(cells, colIdx, state);

            ctx.checkboxes.updateSelectAll(colIdx);

            ctx.checkboxes.updateFixedColumn(colIdx);
         }
      }, 1 );
   } );

   Api.registerPlural( 'cells().checkboxes.select()', 'cell().checkboxes.select()', function ( state ) {
      if(typeof state === 'undefined'){ state = true; }

      return this.iterator( 'cell', function ( ctx, rowIdx, colIdx ) {
         if(ctx.aoColumns[colIdx].checkboxes){
            var cells = this.cells([{ row: rowIdx, column: colIdx }]);
            var cellData = this.cell({ row: rowIdx, column: colIdx }).data();

            if(ctx.checkboxes.isCellSelectable(colIdx, cellData)){
               ctx.checkboxes.updateData(cells, colIdx, state);

               if(ctx.aoColumns[colIdx].checkboxes.selectRow){
                  ctx.checkboxes.updateSelect(rowIdx, state);
               }

               ctx.checkboxes.updateCheckbox(cells, colIdx, state);

               ctx.checkboxes.updateSelectAll(colIdx);

               ctx.checkboxes.updateFixedColumn(colIdx);
            }
         }
      }, 1 );
   } );

   Api.registerPlural( 'cells().checkboxes.enable()', 'cell().checkboxes.enable()', function ( state ) {
      if(typeof state === 'undefined'){ state = true; }

      return this.iterator( 'cell', function ( ctx, rowIdx, colIdx ) {
         if(ctx.aoColumns[colIdx].checkboxes){
            var cell = this.cell({ row: rowIdx, column: colIdx });

            var cellData = cell.data();

            if(state){
               delete ctx.checkboxes.s.dataDisabled[colIdx][cellData];

            } else {
               ctx.checkboxes.s.dataDisabled[colIdx][cellData] = 1;
            }

            var cellNode = cell.node();
            if(cellNode){
               $('input.dt-checkboxes', cellNode).prop('disabled', !state);
            }

            if(ctx.aoColumns[colIdx].checkboxes.selectRow){
               if(
                  Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.data, colIdx)
                  && Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.data[colIdx], cellData)
               ) {
                  ctx.checkboxes.updateSelect(rowIdx, state);
               }
            }
         }
      }, 1 );
   } );

   Api.registerPlural( 'cells().checkboxes.disable()', 'cell().checkboxes.disable()', function ( state ) {
      if(typeof state === 'undefined'){ state = true; }
      return this.checkboxes.enable(!state);
   } );

   Api.registerPlural( 'columns().checkboxes.deselect()', 'column().checkboxes.deselect()', function ( state ) {
      if(typeof state === 'undefined'){ state = true; }
      return this.checkboxes.select(!state);
   } );

   Api.registerPlural( 'cells().checkboxes.deselect()', 'cell().checkboxes.deselect()', function ( state ) {
      if(typeof state === 'undefined'){ state = true; }
      return this.checkboxes.select(!state);
   } );

   Api.registerPlural( 'columns().checkboxes.deselectAll()', 'column().checkboxes.deselectAll()', function () {
      return this.iterator( 'column', function (ctx, colIdx){
         if(ctx.aoColumns[colIdx].checkboxes){
            ctx.checkboxes.s.data[colIdx] = {};

            this.column(colIdx).checkboxes.select(false);
         }
      }, 1 );
   } );

   Api.registerPlural( 'columns().checkboxes.selected()', 'column().checkboxes.selected()', function () {
      return this.iterator( 'column-rows', function ( ctx, colIdx, i, j, rowsIdx ) {

         if(ctx.aoColumns[colIdx].checkboxes){
            var data = [];

            if(ctx.oFeatures.bServerSide){
               $.each(ctx.checkboxes.s.data[colIdx], function(cellData){
                  if(ctx.checkboxes.isCellSelectable(colIdx, cellData)){
                     data.push(cellData);
                  }
               });

            } else {
               var selector = [];
               $.each(rowsIdx, function(index, rowIdx){
                  selector.push({ row: rowIdx, column: colIdx });
               });

               var cells = this.cells(selector);
               var cellsData = cells.data();

               $.each(cellsData, function(index, cellData){
                  if(
                     Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.data, colIdx)
                     && Object.prototype.hasOwnProperty.call(ctx.checkboxes.s.data[colIdx], cellData)
                  ) {
                     if(ctx.checkboxes.isCellSelectable(colIdx, cellData)){
                        data.push(cellData);
                     }
                  }
               });
            }

            return data;

         } else {
            return [];
         }
      }, 1 );
   } );


   Checkboxes.version = '1.2.13-dev';



   $.fn.DataTable.Checkboxes = Checkboxes;
   $.fn.dataTable.Checkboxes = Checkboxes;


   $(document).on( 'preInit.dt.dtCheckboxes', function (e, settings  ) {
      if ( e.namespace !== 'dt' ) {
         return;
      }

      new Checkboxes( settings );
   } );


   return Checkboxes;
}));
