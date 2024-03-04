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