//#region src/content-block/regex.ts
var e = [
	"(",
	"\\{\\{embed:",
	`(${[
		"contact",
		"content_block_pension",
		"content_block_contact",
		"content_block_tax",
		"content_block_time_period"
	].join("|")})`,
	":",
	"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z0-9\\-–—]+)",
	"(\\/[a-z0-9_\\-–—/]*)?",
	"(#[^}#]+)?",
	"\\}\\}",
	")"
].join(""), t = new RegExp(e, "g"), n = RegExp(`^${e}$`), r = (e) => n.test(e);
//#endregion
//#region node_modules/dompurify/dist/purify.es.mjs
function i(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function a(e) {
	if (Array.isArray(e)) return e;
}
function o(e, t) {
	var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n != null) {
		var r, i, a, o, s = [], c = !0, l = !1;
		try {
			if (a = (n = n.call(e)).next, t !== 0) for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
		} catch (e) {
			l = !0, i = e;
		} finally {
			try {
				if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
			} finally {
				if (l) throw i;
			}
		}
		return s;
	}
}
function s() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function c(e, t) {
	return a(e) || o(e, t) || l(e, t) || s();
}
function l(e, t) {
	if (e) {
		if (typeof e == "string") return i(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? i(e, t) : void 0;
	}
}
var u = Object.entries, d = Object.setPrototypeOf, f = Object.isFrozen, ee = Object.getPrototypeOf, te = Object.getOwnPropertyDescriptor, p = Object.freeze, m = Object.seal, h = Object.create, ne = typeof Reflect < "u" && Reflect, g = ne.apply, _ = ne.construct;
p ||= function(e) {
	return e;
}, m ||= function(e) {
	return e;
}, g ||= function(e, t) {
	var n = [...arguments].slice(2);
	return e.apply(t, n);
}, _ ||= function(e) {
	return new e(...[...arguments].slice(1));
};
var v = D(Array.prototype.forEach), re = D(Array.prototype.lastIndexOf), ie = D(Array.prototype.pop), y = D(Array.prototype.push), ae = D(Array.prototype.splice), b = Array.isArray, oe = D(String.prototype.toLowerCase), se = D(String.prototype.toString), ce = D(String.prototype.match), le = D(String.prototype.replace), ue = D(String.prototype.indexOf), de = D(String.prototype.trim), fe = D(Number.prototype.toString), pe = D(Boolean.prototype.toString), x = typeof BigInt > "u" ? null : D(BigInt.prototype.toString), S = typeof Symbol > "u" ? null : D(Symbol.prototype.toString), C = D(Object.prototype.hasOwnProperty), w = D(Object.prototype.toString), T = D(RegExp.prototype.test), E = me(TypeError);
function D(e) {
	return function(t) {
		t instanceof RegExp && (t.lastIndex = 0);
		var n = [...arguments].slice(1);
		return g(e, t, n);
	};
}
function me(e) {
	return function() {
		return _(e, [...arguments]);
	};
}
function O(e, t) {
	let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : oe;
	if (d && d(e, null), !b(t)) return e;
	let r = t.length;
	for (; r--;) {
		let i = t[r];
		if (typeof i == "string") {
			let e = n(i);
			e !== i && (f(t) || (t[r] = e), i = e);
		}
		e[i] = !0;
	}
	return e;
}
function he(e) {
	for (let t = 0; t < e.length; t++) C(e, t) || (e[t] = null);
	return e;
}
function k(e) {
	let t = h(null);
	for (let r of u(e)) {
		var n = c(r, 2);
		let i = n[0], a = n[1];
		C(e, i) && (b(a) ? t[i] = he(a) : a && typeof a == "object" && a.constructor === Object ? t[i] = k(a) : t[i] = a);
	}
	return t;
}
function ge(e) {
	switch (typeof e) {
		case "string": return e;
		case "number": return fe(e);
		case "boolean": return pe(e);
		case "bigint": return x ? x(e) : "0";
		case "symbol": return S ? S(e) : "Symbol()";
		case "undefined": return w(e);
		case "function":
		case "object": {
			if (e === null) return w(e);
			let t = e, n = A(t, "toString");
			if (typeof n == "function") {
				let e = n(t);
				return typeof e == "string" ? e : w(e);
			}
			return w(e);
		}
		default: return w(e);
	}
}
function A(e, t) {
	for (; e !== null;) {
		let n = te(e, t);
		if (n) {
			if (n.get) return D(n.get);
			if (typeof n.value == "function") return D(n.value);
		}
		e = ee(e);
	}
	function n() {
		return null;
	}
	return n;
}
function _e(e) {
	try {
		return T(e, ""), !0;
	} catch {
		return !1;
	}
}
var ve = p(/* @__PURE__ */ "a.abbr.acronym.address.area.article.aside.audio.b.bdi.bdo.big.blink.blockquote.body.br.button.canvas.caption.center.cite.code.col.colgroup.content.data.datalist.dd.decorator.del.details.dfn.dialog.dir.div.dl.dt.element.em.fieldset.figcaption.figure.font.footer.form.h1.h2.h3.h4.h5.h6.head.header.hgroup.hr.html.i.img.input.ins.kbd.label.legend.li.main.map.mark.marquee.menu.menuitem.meter.nav.nobr.ol.optgroup.option.output.p.picture.pre.progress.q.rp.rt.ruby.s.samp.search.section.select.shadow.slot.small.source.spacer.span.strike.strong.style.sub.summary.sup.table.tbody.td.template.textarea.tfoot.th.thead.time.tr.track.tt.u.ul.var.video.wbr".split(".")), ye = p(/* @__PURE__ */ "svg.a.altglyph.altglyphdef.altglyphitem.animatecolor.animatemotion.animatetransform.circle.clippath.defs.desc.ellipse.enterkeyhint.exportparts.filter.font.g.glyph.glyphref.hkern.image.inputmode.line.lineargradient.marker.mask.metadata.mpath.part.path.pattern.polygon.polyline.radialgradient.rect.stop.style.switch.symbol.text.textpath.title.tref.tspan.view.vkern".split(".")), be = p([
	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feComposite",
	"feConvolveMatrix",
	"feDiffuseLighting",
	"feDisplacementMap",
	"feDistantLight",
	"feDropShadow",
	"feFlood",
	"feFuncA",
	"feFuncB",
	"feFuncG",
	"feFuncR",
	"feGaussianBlur",
	"feImage",
	"feMerge",
	"feMergeNode",
	"feMorphology",
	"feOffset",
	"fePointLight",
	"feSpecularLighting",
	"feSpotLight",
	"feTile",
	"feTurbulence"
]), xe = p([
	"animate",
	"color-profile",
	"cursor",
	"discard",
	"font-face",
	"font-face-format",
	"font-face-name",
	"font-face-src",
	"font-face-uri",
	"foreignobject",
	"hatch",
	"hatchpath",
	"mesh",
	"meshgradient",
	"meshpatch",
	"meshrow",
	"missing-glyph",
	"script",
	"set",
	"solidcolor",
	"unknown",
	"use"
]), Se = p(/* @__PURE__ */ "math.menclose.merror.mfenced.mfrac.mglyph.mi.mlabeledtr.mmultiscripts.mn.mo.mover.mpadded.mphantom.mroot.mrow.ms.mspace.msqrt.mstyle.msub.msup.msubsup.mtable.mtd.mtext.mtr.munder.munderover.mprescripts".split(".")), Ce = p([
	"maction",
	"maligngroup",
	"malignmark",
	"mlongdiv",
	"mscarries",
	"mscarry",
	"msgroup",
	"mstack",
	"msline",
	"msrow",
	"semantics",
	"annotation",
	"annotation-xml",
	"mprescripts",
	"none"
]), we = p(["#text"]), Te = p(/* @__PURE__ */ "accept.action.align.alt.autocapitalize.autocomplete.autopictureinpicture.autoplay.background.bgcolor.border.capture.cellpadding.cellspacing.checked.cite.class.clear.color.cols.colspan.command.commandfor.controls.controlslist.coords.crossorigin.datetime.decoding.default.dir.disabled.disablepictureinpicture.disableremoteplayback.download.draggable.enctype.enterkeyhint.exportparts.face.for.headers.height.hidden.high.href.hreflang.id.inert.inputmode.integrity.ismap.kind.label.lang.list.loading.loop.low.max.maxlength.media.method.min.minlength.multiple.muted.name.nonce.noshade.novalidate.nowrap.open.optimum.part.pattern.placeholder.playsinline.popover.popovertarget.popovertargetaction.poster.preload.pubdate.radiogroup.readonly.rel.required.rev.reversed.role.rows.rowspan.spellcheck.scope.selected.shape.size.sizes.slot.span.srclang.start.src.srcset.step.style.summary.tabindex.title.translate.type.usemap.valign.value.width.wrap.xmlns".split(".")), Ee = p(/* @__PURE__ */ "accent-height.accumulate.additive.alignment-baseline.amplitude.ascent.attributename.attributetype.azimuth.basefrequency.baseline-shift.begin.bias.by.class.clip.clippathunits.clip-path.clip-rule.color.color-interpolation.color-interpolation-filters.color-profile.color-rendering.cx.cy.d.dx.dy.diffuseconstant.direction.display.divisor.dominant-baseline.dur.edgemode.elevation.end.exponent.fill.fill-opacity.fill-rule.filter.filterunits.flood-color.flood-opacity.font-family.font-size.font-size-adjust.font-stretch.font-style.font-variant.font-weight.fx.fy.g1.g2.glyph-name.glyphref.gradientunits.gradienttransform.height.href.id.image-rendering.in.in2.intercept.k.k1.k2.k3.k4.kerning.keypoints.keysplines.keytimes.lang.lengthadjust.letter-spacing.kernelmatrix.kernelunitlength.lighting-color.local.marker-end.marker-mid.marker-start.markerheight.markerunits.markerwidth.maskcontentunits.maskunits.max.mask.mask-type.media.method.mode.min.name.numoctaves.offset.operator.opacity.order.orient.orientation.origin.overflow.paint-order.path.pathlength.patterncontentunits.patterntransform.patternunits.points.preservealpha.preserveaspectratio.primitiveunits.r.rx.ry.radius.refx.refy.repeatcount.repeatdur.restart.result.rotate.scale.seed.shape-rendering.slope.specularconstant.specularexponent.spreadmethod.startoffset.stddeviation.stitchtiles.stop-color.stop-opacity.stroke-dasharray.stroke-dashoffset.stroke-linecap.stroke-linejoin.stroke-miterlimit.stroke-opacity.stroke.stroke-width.style.surfacescale.systemlanguage.tabindex.tablevalues.targetx.targety.transform.transform-origin.text-anchor.text-decoration.text-orientation.text-rendering.textlength.type.u1.u2.unicode.values.viewbox.visibility.version.vert-adv-y.vert-origin-x.vert-origin-y.width.word-spacing.wrap.writing-mode.xchannelselector.ychannelselector.x.x1.x2.xmlns.y.y1.y2.z.zoomandpan".split(".")), De = p(/* @__PURE__ */ "accent.accentunder.align.bevelled.close.columnalign.columnlines.columnspacing.columnspan.denomalign.depth.dir.display.displaystyle.encoding.fence.frame.height.href.id.largeop.length.linethickness.lquote.lspace.mathbackground.mathcolor.mathsize.mathvariant.maxsize.minsize.movablelimits.notation.numalign.open.rowalign.rowlines.rowspacing.rowspan.rspace.rquote.scriptlevel.scriptminsize.scriptsizemultiplier.selection.separator.separators.stretchy.subscriptshift.supscriptshift.symmetric.voffset.width.xmlns".split(".")), Oe = p([
	"xlink:href",
	"xml:id",
	"xlink:title",
	"xml:space",
	"xmlns:xlink"
]), ke = m(/{{[\w\W]*|^[\w\W]*}}/g), Ae = m(/<%[\w\W]*|^[\w\W]*%>/g), je = m(/\${[\w\W]*/g), Me = m(/^data-[\-\w.\u00B7-\uFFFF]+$/), Ne = m(/^aria-[\-\w]+$/), Pe = m(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i), Fe = m(/^(?:\w+script|data):/i), Ie = m(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g), Le = m(/^html$/i), Re = m(/^[a-z][.\w]*(-[.\w]+)+$/i), ze = m(/<[/\w!]/g), Be = m(/<[/\w]/g), Ve = m(/<\/no(script|embed|frames)/i), He = m(/\/>/i), j = {
	element: 1,
	attribute: 2,
	text: 3,
	cdataSection: 4,
	entityReference: 5,
	entityNode: 6,
	processingInstruction: 7,
	comment: 8,
	document: 9,
	documentType: 10,
	documentFragment: 11,
	notation: 12
}, Ue = function() {
	return typeof window > "u" ? null : window;
}, We = function(e, t) {
	if (typeof e != "object" || typeof e.createPolicy != "function") return null;
	let n = null, r = "data-tt-policy-suffix";
	t && t.hasAttribute(r) && (n = t.getAttribute(r));
	let i = "dompurify" + (n ? "#" + n : "");
	try {
		return e.createPolicy(i, {
			createHTML(e) {
				return e;
			},
			createScriptURL(e) {
				return e;
			}
		});
	} catch {
		return console.warn("TrustedTypes policy " + i + " could not be created."), null;
	}
}, Ge = function() {
	return {
		afterSanitizeAttributes: [],
		afterSanitizeElements: [],
		afterSanitizeShadowDOM: [],
		beforeSanitizeAttributes: [],
		beforeSanitizeElements: [],
		beforeSanitizeShadowDOM: [],
		uponSanitizeAttribute: [],
		uponSanitizeElement: [],
		uponSanitizeShadowNode: []
	};
}, M = function(e, t, n, r) {
	return C(e, t) && b(e[t]) ? O(r.base ? k(r.base) : {}, e[t], r.transform) : n;
};
function Ke() {
	let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Ue(), t = (e) => Ke(e);
	if (t.version = "3.4.12", t.removed = [], !e || !e.document || e.document.nodeType !== j.document || !e.Element) return t.isSupported = !1, t;
	let n = e.document, r = n, i = r.currentScript;
	e.DocumentFragment;
	let a = e.HTMLTemplateElement, o = e.Node, s = e.Element, c = e.NodeFilter;
	e.NamedNodeMap === void 0 && (e.NamedNodeMap || e.MozNamedAttrMap), e.HTMLFormElement;
	let l = e.DOMParser, d = e.trustedTypes, f = s.prototype, ee = A(f, "cloneNode"), te = A(f, "remove"), ne = A(f, "nextSibling"), g = A(f, "childNodes"), _ = A(f, "parentNode"), fe = A(f, "shadowRoot"), pe = A(f, "attributes"), x = o && o.prototype ? A(o.prototype, "nodeType") : null, S = o && o.prototype ? A(o.prototype, "nodeName") : null;
	if (typeof a == "function") {
		let e = n.createElement("template");
		e.content && e.content.ownerDocument && (n = e.content.ownerDocument);
	}
	let w, D = "", me, he = !1, N = 0, qe = function() {
		if (N > 0) throw E("A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the \"DOMPurify and Trusted Types\" section of the README.");
	}, P = function(e) {
		qe(), N++;
		try {
			return w.createHTML(e);
		} finally {
			N--;
		}
	}, Je = function(e) {
		qe(), N++;
		try {
			return w.createScriptURL(e);
		} finally {
			N--;
		}
	}, Ye = function() {
		return he ||= (me = We(d, i), !0), me;
	}, Xe = n, Ze = Xe.implementation, Qe = Xe.createNodeIterator, $e = Xe.createDocumentFragment, et = Xe.getElementsByTagName, tt = r.importNode, F = Ge();
	t.isSupported = typeof u == "function" && typeof _ == "function" && Ze && Ze.createHTMLDocument !== void 0;
	let nt = ke, rt = Ae, it = je, at = Me, ot = Ne, st = Fe, ct = Ie, lt = Re, ut = Pe, I = null, dt = O({}, [
		...ve,
		...ye,
		...be,
		...Se,
		...we
	]), L = null, ft = O({}, [
		...Te,
		...Ee,
		...De,
		...Oe
	]), R = Object.seal(h(null, {
		tagNameCheck: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: null
		},
		attributeNameCheck: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: null
		},
		allowCustomizedBuiltInElements: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: !1
		}
	})), pt = null, mt = null, z = Object.seal(h(null, {
		tagCheck: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: null
		},
		attributeCheck: {
			writable: !0,
			configurable: !1,
			enumerable: !0,
			value: null
		}
	})), ht = !0, gt = !0, _t = !1, vt = !0, B = !1, V = !0, H = !1, yt = !1, bt = null, xt = null, St = !1, U = !1, Ct = !1, wt = !1, Tt = !0, Et = !1, Dt = "user-content-", Ot = !0, kt = !1, W = {}, G = null, At = O({}, /* @__PURE__ */ "annotation-xml.audio.colgroup.desc.foreignobject.head.iframe.math.mi.mn.mo.ms.mtext.noembed.noframes.noscript.plaintext.script.selectedcontent.style.svg.template.thead.title.video.xmp".split(".")), jt = null, Mt = O({}, [
		"audio",
		"video",
		"img",
		"source",
		"image",
		"track"
	]), Nt = null, Pt = O({}, [
		"alt",
		"class",
		"for",
		"id",
		"label",
		"name",
		"pattern",
		"placeholder",
		"role",
		"summary",
		"title",
		"value",
		"style",
		"xmlns"
	]), Ft = "http://www.w3.org/1998/Math/MathML", It = "http://www.w3.org/2000/svg", K = "http://www.w3.org/1999/xhtml", q = K, Lt = !1, Rt = null, zt = O({}, [
		Ft,
		It,
		K
	], se), Bt = p([
		"mi",
		"mo",
		"mn",
		"ms",
		"mtext"
	]), Vt = O({}, Bt), Ht = p(["annotation-xml"]), Ut = O({}, Ht), Wt = O({}, [
		"title",
		"style",
		"font",
		"a",
		"script"
	]), Gt = null, Kt = ["application/xhtml+xml", "text/html"], J = null, Y = null, qt = n.createElement("form"), Jt = function(e) {
		return e instanceof RegExp || e instanceof Function;
	}, Yt = function() {
		let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		if (Y && Y === e) return;
		(!e || typeof e != "object") && (e = {}), e = k(e), Gt = Kt.indexOf(e.PARSER_MEDIA_TYPE) === -1 ? "text/html" : e.PARSER_MEDIA_TYPE, J = Gt === "application/xhtml+xml" ? se : oe, I = M(e, "ALLOWED_TAGS", dt, { transform: J }), L = M(e, "ALLOWED_ATTR", ft, { transform: J }), Rt = M(e, "ALLOWED_NAMESPACES", zt, { transform: se }), Nt = M(e, "ADD_URI_SAFE_ATTR", Pt, {
			transform: J,
			base: Pt
		}), jt = M(e, "ADD_DATA_URI_TAGS", Mt, {
			transform: J,
			base: Mt
		}), G = M(e, "FORBID_CONTENTS", At, { transform: J }), pt = M(e, "FORBID_TAGS", k({}), { transform: J }), mt = M(e, "FORBID_ATTR", k({}), { transform: J }), W = C(e, "USE_PROFILES") ? e.USE_PROFILES && typeof e.USE_PROFILES == "object" ? k(e.USE_PROFILES) : e.USE_PROFILES : !1, ht = e.ALLOW_ARIA_ATTR !== !1, gt = e.ALLOW_DATA_ATTR !== !1, _t = e.ALLOW_UNKNOWN_PROTOCOLS || !1, vt = e.ALLOW_SELF_CLOSE_IN_ATTR !== !1, B = e.SAFE_FOR_TEMPLATES || !1, V = e.SAFE_FOR_XML !== !1, H = e.WHOLE_DOCUMENT || !1, U = e.RETURN_DOM || !1, Ct = e.RETURN_DOM_FRAGMENT || !1, wt = e.RETURN_TRUSTED_TYPE || !1, St = e.FORCE_BODY || !1, Tt = e.SANITIZE_DOM !== !1, Et = e.SANITIZE_NAMED_PROPS || !1, Ot = e.KEEP_CONTENT !== !1, kt = e.IN_PLACE || !1, ut = _e(e.ALLOWED_URI_REGEXP) ? e.ALLOWED_URI_REGEXP : Pe, q = typeof e.NAMESPACE == "string" ? e.NAMESPACE : K, Vt = C(e, "MATHML_TEXT_INTEGRATION_POINTS") && e.MATHML_TEXT_INTEGRATION_POINTS && typeof e.MATHML_TEXT_INTEGRATION_POINTS == "object" ? k(e.MATHML_TEXT_INTEGRATION_POINTS) : O({}, Bt), Ut = C(e, "HTML_INTEGRATION_POINTS") && e.HTML_INTEGRATION_POINTS && typeof e.HTML_INTEGRATION_POINTS == "object" ? k(e.HTML_INTEGRATION_POINTS) : O({}, Ht);
		let t = C(e, "CUSTOM_ELEMENT_HANDLING") && e.CUSTOM_ELEMENT_HANDLING && typeof e.CUSTOM_ELEMENT_HANDLING == "object" ? k(e.CUSTOM_ELEMENT_HANDLING) : h(null);
		if (R = h(null), C(t, "tagNameCheck") && Jt(t.tagNameCheck) && (R.tagNameCheck = t.tagNameCheck), C(t, "attributeNameCheck") && Jt(t.attributeNameCheck) && (R.attributeNameCheck = t.attributeNameCheck), C(t, "allowCustomizedBuiltInElements") && typeof t.allowCustomizedBuiltInElements == "boolean" && (R.allowCustomizedBuiltInElements = t.allowCustomizedBuiltInElements), m(R), B && (gt = !1), Ct && (U = !0), W && (I = O({}, we), L = h(null), W.html === !0 && (O(I, ve), O(L, Te)), W.svg === !0 && (O(I, ye), O(L, Ee), O(L, Oe)), W.svgFilters === !0 && (O(I, be), O(L, Ee), O(L, Oe)), W.mathMl === !0 && (O(I, Se), O(L, De), O(L, Oe))), z.tagCheck = null, z.attributeCheck = null, C(e, "ADD_TAGS") && (typeof e.ADD_TAGS == "function" ? z.tagCheck = e.ADD_TAGS : b(e.ADD_TAGS) && (I === dt && (I = k(I)), O(I, e.ADD_TAGS, J))), C(e, "ADD_ATTR") && (typeof e.ADD_ATTR == "function" ? z.attributeCheck = e.ADD_ATTR : b(e.ADD_ATTR) && (L === ft && (L = k(L)), O(L, e.ADD_ATTR, J))), C(e, "ADD_URI_SAFE_ATTR") && b(e.ADD_URI_SAFE_ATTR) && O(Nt, e.ADD_URI_SAFE_ATTR, J), C(e, "FORBID_CONTENTS") && b(e.FORBID_CONTENTS) && (G === At && (G = k(G)), O(G, e.FORBID_CONTENTS, J)), C(e, "ADD_FORBID_CONTENTS") && b(e.ADD_FORBID_CONTENTS) && (G === At && (G = k(G)), O(G, e.ADD_FORBID_CONTENTS, J)), Ot && (I["#text"] = !0), H && O(I, [
			"html",
			"head",
			"body"
		]), I.table && (O(I, ["tbody"]), delete pt.tbody), e.TRUSTED_TYPES_POLICY) {
			if (typeof e.TRUSTED_TYPES_POLICY.createHTML != "function") throw E("TRUSTED_TYPES_POLICY configuration option must provide a \"createHTML\" hook.");
			if (typeof e.TRUSTED_TYPES_POLICY.createScriptURL != "function") throw E("TRUSTED_TYPES_POLICY configuration option must provide a \"createScriptURL\" hook.");
			let t = w;
			w = e.TRUSTED_TYPES_POLICY;
			try {
				D = P("");
			} catch (e) {
				throw w = t, e;
			}
		} else e.TRUSTED_TYPES_POLICY === null ? (w = void 0, D = "") : (w === void 0 && (w = Ye()), w && typeof D == "string" && (D = P("")));
		p && p(e), Y = e;
	}, Xt = O({}, [
		...ye,
		...be,
		...xe
	]), Zt = O({}, [...Se, ...Ce]), Qt = function(e, t, n) {
		return t.namespaceURI === K ? e === "svg" : t.namespaceURI === Ft ? e === "svg" && (n === "annotation-xml" || Vt[n]) : !!Xt[e];
	}, $t = function(e, t, n) {
		return t.namespaceURI === K ? e === "math" : t.namespaceURI === It ? e === "math" && Ut[n] : !!Zt[e];
	}, en = function(e, t, n) {
		return t.namespaceURI === It && !Ut[n] || t.namespaceURI === Ft && !Vt[n] ? !1 : !Zt[e] && (Wt[e] || !Xt[e]);
	}, tn = function(e) {
		let t = _(e);
		(!t || !t.tagName) && (t = {
			namespaceURI: q,
			tagName: "template"
		});
		let n = oe(e.tagName), r = oe(t.tagName);
		return Rt[e.namespaceURI] ? e.namespaceURI === It ? Qt(n, t, r) : e.namespaceURI === Ft ? $t(n, t, r) : e.namespaceURI === K ? en(n, t, r) : !!(Gt === "application/xhtml+xml" && Rt[e.namespaceURI]) : !1;
	}, X = function(e) {
		y(t.removed, { element: e });
		try {
			_(e).removeChild(e);
		} catch {
			if (te(e), !_(e)) throw E("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
		}
	}, nn = function(e) {
		an(e);
		let t = g(e);
		if (t) {
			let e = [];
			v(t, (t) => {
				y(e, t);
			}), v(e, (e) => {
				try {
					te(e);
				} catch {}
			});
		}
		let n = pe(e);
		if (n) for (let t = n.length - 1; t >= 0; --t) {
			let r = n[t], i = r && r.name;
			if (typeof i == "string") try {
				e.removeAttribute(i);
			} catch {}
		}
	}, Z = function(e, n) {
		try {
			y(t.removed, {
				attribute: n.getAttributeNode(e),
				from: n
			});
		} catch {
			y(t.removed, {
				attribute: null,
				from: n
			});
		}
		if (n.removeAttribute(e), e === "is") if (U || Ct) try {
			X(n);
		} catch {}
		else try {
			n.setAttribute(e, "");
		} catch {}
	}, rn = function(e) {
		let t = pe(e);
		if (t) for (let n = t.length - 1; n >= 0; --n) {
			let r = t[n], i = r && r.name;
			if (!(typeof i != "string" || L[J(i)])) try {
				e.removeAttribute(i);
			} catch {}
		}
	}, an = function(e) {
		let t = [e];
		for (; t.length > 0;) {
			let e = t.pop();
			(x ? x(e) : e.nodeType) === j.element && rn(e);
			let n = g(e);
			if (n) for (let e = n.length - 1; e >= 0; --e) t.push(n[e]);
		}
	}, on = function(e) {
		if (!V) return;
		let t = [e];
		for (; t.length > 0;) {
			let e = t.pop(), n = x ? x(e) : e.nodeType;
			if (n === j.processingInstruction || n === j.comment && T(Be, e.data)) {
				try {
					te(e);
				} catch {}
				continue;
			}
			if (n === j.element) {
				let t = e, n = J(S ? S(e) : e.nodeName);
				try {
					t.hasAttribute && t.hasAttribute("patchsrc") && t.removeAttribute("patchsrc"), t.hasAttribute && t.hasAttribute("for") && n !== "label" && n !== "output" && t.removeAttribute("for");
				} catch {}
			}
			let r = g(e);
			if (r) for (let e = r.length - 1; e >= 0; --e) t.push(r[e]);
		}
	}, sn = function(e) {
		let t = null, r = null;
		if (St) e = "<remove></remove>" + e;
		else {
			let t = ce(e, /^[\r\n\t ]+/);
			r = t && t[0];
		}
		Gt === "application/xhtml+xml" && q === K && (e = "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>" + e + "</body></html>");
		let i = w ? P(e) : e;
		if (q === K) try {
			t = new l().parseFromString(i, Gt);
		} catch {}
		if (!t || !t.documentElement) {
			t = Ze.createDocument(q, "template", null);
			try {
				t.documentElement.innerHTML = Lt ? D : i;
			} catch {}
		}
		let a = t.body || t.documentElement;
		return e && r && a.insertBefore(n.createTextNode(r), a.childNodes[0] || null), q === K ? et.call(t, H ? "html" : "body")[0] : H ? t.documentElement : a;
	}, cn = function(e) {
		return Qe.call(e.ownerDocument || e, e, c.SHOW_ELEMENT | c.SHOW_COMMENT | c.SHOW_TEXT | c.SHOW_PROCESSING_INSTRUCTION | c.SHOW_CDATA_SECTION, null);
	}, ln = function(e) {
		return e = le(e, nt, " "), e = le(e, rt, " "), e = le(e, it, " "), e;
	}, un = function(e) {
		e.normalize();
		let t = Qe.call(e.ownerDocument || e, e, c.SHOW_TEXT | c.SHOW_COMMENT | c.SHOW_CDATA_SECTION | c.SHOW_PROCESSING_INSTRUCTION, null), n = t.nextNode();
		for (; n;) n.data = ln(n.data), n = t.nextNode();
		let r = e.querySelectorAll?.call(e, "template");
		r && v(r, (e) => {
			Q(e.content) && un(e.content);
		});
	}, dn = function(e) {
		let t = S ? S(e) : null;
		return typeof t != "string" || J(t) !== "form" ? !1 : typeof e.nodeName != "string" || typeof e.textContent != "string" || typeof e.removeChild != "function" || e.attributes !== pe(e) || typeof e.removeAttribute != "function" || typeof e.setAttribute != "function" || typeof e.namespaceURI != "string" || typeof e.insertBefore != "function" || typeof e.hasChildNodes != "function" || e.nodeType !== x(e) || e.childNodes !== g(e);
	}, Q = function(e) {
		if (!x || typeof e != "object" || !e) return !1;
		try {
			return x(e) === j.documentFragment;
		} catch {
			return !1;
		}
	}, fn = function(e) {
		if (!x || typeof e != "object" || !e) return !1;
		try {
			return typeof x(e) == "number";
		} catch {
			return !1;
		}
	};
	function $(e, n, r) {
		e.length !== 0 && v(e, (e) => {
			e.call(t, n, r, Y);
		});
	}
	let pn = function(e, t) {
		return !!(V && e.hasChildNodes() && !fn(e.firstElementChild) && T(ze, e.textContent) && T(ze, e.innerHTML) || V && e.namespaceURI === K && t === "style" && fn(e.firstElementChild) || e.nodeType === j.processingInstruction || V && e.nodeType === j.comment && T(Be, e.data));
	}, mn = function(e, t) {
		if (!pt[t] && vn(t) && (R.tagNameCheck instanceof RegExp && T(R.tagNameCheck, t) || R.tagNameCheck instanceof Function && R.tagNameCheck(t))) return !1;
		if (Ot && !G[t]) {
			let t = _(e), n = g(e);
			if (n && t) {
				let r = n.length;
				for (let i = r - 1; i >= 0; --i) {
					let r = kt ? n[i] : ee(n[i], !0);
					t.insertBefore(r, ne(e));
				}
			}
		}
		return X(e), !0;
	}, hn = function(e, n) {
		if ($(F.beforeSanitizeElements, e, null), e !== n && _(e) === null) return !0;
		if (dn(e)) return X(e), !0;
		let r = J(S ? S(e) : e.nodeName);
		if ($(F.uponSanitizeElement, e, {
			tagName: r,
			allowedTags: I
		}), e !== n && _(e) === null) return !0;
		if (pn(e, r)) return X(e), !0;
		if (pt[r] || !(z.tagCheck instanceof Function && z.tagCheck(r)) && !I[r]) {
			let t = mn(e, r);
			return t === !1 && $(F.afterSanitizeElements, e, null), t;
		}
		if ((x ? x(e) : e.nodeType) === j.element && !tn(e) || (r === "noscript" || r === "noembed" || r === "noframes") && T(Ve, e.innerHTML)) return X(e), !0;
		if (B && e.nodeType === j.text) {
			let n = ln(e.textContent);
			e.textContent !== n && (y(t.removed, { element: e.cloneNode() }), e.textContent = n);
		}
		return $(F.afterSanitizeElements, e, null), !1;
	}, gn = function(e, t, r) {
		if (mt[t] || V && t === "patchsrc" || V && t === "for" && e !== "label" && e !== "output" || Tt && (t === "id" || t === "name") && (r in n || r in qt)) return !1;
		let i = L[t] || z.attributeCheck instanceof Function && z.attributeCheck(t, e);
		if (!(gt && T(at, t)) && !(ht && T(ot, t))) {
			if (!i) {
				if (!(vn(e) && (R.tagNameCheck instanceof RegExp && T(R.tagNameCheck, e) || R.tagNameCheck instanceof Function && R.tagNameCheck(e)) && (R.attributeNameCheck instanceof RegExp && T(R.attributeNameCheck, t) || R.attributeNameCheck instanceof Function && R.attributeNameCheck(t, e)) || t === "is" && R.allowCustomizedBuiltInElements && (R.tagNameCheck instanceof RegExp && T(R.tagNameCheck, r) || R.tagNameCheck instanceof Function && R.tagNameCheck(r)))) return !1;
			} else if (!Nt[t] && !T(ut, le(r, ct, "")) && !((t === "src" || t === "xlink:href" || t === "href") && e !== "script" && ue(r, "data:") === 0 && jt[e]) && !(_t && !T(st, le(r, ct, ""))) && r) return !1;
		}
		return !0;
	}, _n = O({}, [
		"annotation-xml",
		"color-profile",
		"font-face",
		"font-face-format",
		"font-face-name",
		"font-face-src",
		"font-face-uri",
		"missing-glyph"
	]), vn = function(e) {
		return !_n[oe(e)] && T(lt, e);
	}, yn = function(e, t, n, r) {
		if (w && typeof d == "object" && typeof d.getAttributeType == "function" && !n) switch (d.getAttributeType(e, t)) {
			case "TrustedHTML": return P(r);
			case "TrustedScriptURL": return Je(r);
		}
		return r;
	}, bn = function(e, n, r, i) {
		try {
			r ? e.setAttributeNS(r, n, i) : e.setAttribute(n, i), dn(e) ? X(e) : ie(t.removed);
		} catch {
			Z(n, e);
		}
	}, xn = function(e) {
		$(F.beforeSanitizeAttributes, e, null);
		let t = e.attributes;
		if (!t || dn(e)) return;
		let n = {
			attrName: "",
			attrValue: "",
			keepAttr: !0,
			allowedAttributes: L,
			forceKeepAttr: void 0
		}, r = t.length, i = J(e.nodeName);
		for (; r--;) {
			let a = t[r], o = a.name, s = a.namespaceURI, c = a.value, l = J(o), u = c, d = o === "value" ? u : de(u);
			if (n.attrName = l, n.attrValue = d, n.keepAttr = !0, n.forceKeepAttr = void 0, $(F.uponSanitizeAttribute, e, n), d = n.attrValue, Et && (l === "id" || l === "name") && ue(d, Dt) !== 0 && (Z(o, e), d = Dt + d), V && T(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, d)) {
				Z(o, e);
				continue;
			}
			if (l === "attributename" && ce(d, "href")) {
				Z(o, e);
				continue;
			}
			if (!n.forceKeepAttr) {
				if (!n.keepAttr) {
					Z(o, e);
					continue;
				}
				if (!vt && T(He, d)) {
					Z(o, e);
					continue;
				}
				if (B && (d = ln(d)), !gn(i, l, d)) {
					Z(o, e);
					continue;
				}
				d = yn(i, l, s, d), d !== u && bn(e, o, s, d);
			}
		}
		$(F.afterSanitizeAttributes, e, null);
	}, Sn = function(e) {
		let t = null, n = cn(e);
		for ($(F.beforeSanitizeShadowDOM, e, null); t = n.nextNode();) if ($(F.uponSanitizeShadowNode, t, null), hn(t, e), xn(t), Q(t.content) && Sn(t.content), (x ? x(t) : t.nodeType) === j.element) {
			let e = fe(t);
			Q(e) && (Cn(e), Sn(e));
		}
		$(F.afterSanitizeShadowDOM, e, null);
	}, Cn = function(e) {
		let t = [{
			node: e,
			shadow: null
		}];
		for (; t.length > 0;) {
			let e = t.pop();
			if (e.shadow) {
				Sn(e.shadow);
				continue;
			}
			let n = e.node, r = (x ? x(n) : n.nodeType) === j.element, i = g(n);
			if (i) for (let e = i.length - 1; e >= 0; --e) t.push({
				node: i[e],
				shadow: null
			});
			if (r) {
				let e = S ? S(n) : null;
				if (typeof e == "string" && J(e) === "template") {
					let e = n.content;
					Q(e) && t.push({
						node: e,
						shadow: null
					});
				}
			}
			if (r) {
				let e = fe(n);
				Q(e) && t.push({
					node: null,
					shadow: e
				}, {
					node: e,
					shadow: null
				});
			}
		}
	};
	return t.sanitize = function(e) {
		let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, i = null, a = null, o = null, s = null;
		if (Lt = !e, Lt && (e = "<!-->"), typeof e != "string" && !fn(e) && (e = ge(e), typeof e != "string")) throw E("dirty is not a string, aborting");
		if (!t.isSupported) return e;
		yt ? (I = bt, L = xt) : Yt(n), (F.uponSanitizeElement.length > 0 || F.uponSanitizeAttribute.length > 0) && (I = k(I)), F.uponSanitizeAttribute.length > 0 && (L = k(L)), t.removed = [];
		let c = kt && typeof e != "string" && fn(e);
		if (c) {
			on(e);
			let t = S ? S(e) : e.nodeName;
			if (typeof t == "string") {
				let n = J(t);
				if (!I[n] || pt[n]) throw nn(e), E("root node is forbidden and cannot be sanitized in-place");
			}
			if (dn(e)) throw nn(e), E("root node is clobbered and cannot be sanitized in-place");
			try {
				Cn(e);
			} catch (t) {
				throw nn(e), t;
			}
		} else if (fn(e)) i = sn("<!---->"), a = i.ownerDocument.importNode(e, !0), a.nodeType === j.element && a.nodeName === "BODY" || a.nodeName === "HTML" ? i = a : i.appendChild(a), Cn(a);
		else {
			if (!U && !B && !H && e.indexOf("<") === -1) return w && wt ? P(e) : e;
			if (i = sn(e), !i) return U ? null : wt ? D : "";
		}
		i && St && X(i.firstChild);
		let l = c ? e : i, u = cn(l);
		try {
			for (; o = u.nextNode();) hn(o, l), xn(o), Q(o.content) && Sn(o.content);
		} catch (n) {
			throw c && (nn(e), v(t.removed, (e) => {
				e.element && an(e.element);
			})), n;
		}
		if (c) return v(t.removed, (e) => {
			e.element && an(e.element);
		}), B && un(e), e;
		if (U) {
			if (B && un(i), Ct) for (s = $e.call(i.ownerDocument); i.firstChild;) s.appendChild(i.firstChild);
			else s = i;
			return (L.shadowroot || L.shadowrootmode) && (s = tt.call(r, s, !0)), s;
		}
		let d = H ? i.outerHTML : i.innerHTML;
		return H && I["!doctype"] && i.ownerDocument && i.ownerDocument.doctype && i.ownerDocument.doctype.name && T(Le, i.ownerDocument.doctype.name) && (d = "<!DOCTYPE " + i.ownerDocument.doctype.name + ">\n" + d), B && (d = ln(d)), w && wt ? P(d) : d;
	}, t.setConfig = function() {
		Yt(arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}), yt = !0, bt = I, xt = L;
	}, t.clearConfig = function() {
		Y = null, yt = !1, bt = null, xt = null, w = me, D = "";
	}, t.isValidAttribute = function(e, t, n) {
		return Y || Yt({}), gn(J(e), J(t), n);
	}, t.addHook = function(e, t) {
		typeof t == "function" && C(F, e) && y(F[e], t);
	}, t.removeHook = function(e, t) {
		if (C(F, e)) {
			if (t !== void 0) {
				let n = re(F[e], t);
				return n === -1 ? void 0 : ae(F[e], n, 1)[0];
			}
			return ie(F[e]);
		}
	}, t.removeHooks = function(e) {
		C(F, e) && (F[e] = []);
	}, t.removeAllHooks = function() {
		F = Ge();
	}, t;
}
var N = Ke(), qe = {
	embedHighlightColour: "ffa500",
	allowedHtmlTags: /* @__PURE__ */ "a.abbr.blockquote.br.code.div.em.h1.h2.h3.h4.h5.h6.hr.li.ol.p.pre.span.strong.sub.sup.table.tbody.td.tfoot.th.thead.tr.ul".split("."),
	allowedHtmlAttributes: ["href"]
}, P = (e) => {
	let t = /* @__PURE__ */ new Set();
	N.addHook("uponSanitizeElement", (e, n) => {
		n.allowedTags[n.tagName] === void 0 && n.tagName && n.tagName !== "body" && n.tagName !== "html" && t.add(n.tagName);
	});
	let n = N.sanitize(e, {
		ALLOWED_TAGS: qe.allowedHtmlTags,
		ALLOWED_ATTR: qe.allowedHtmlAttributes,
		KEEP_CONTENT: !0
	});
	return N.removeAllHooks(), t.size > 0 && console.warn(`Content block preview contained disallowed HTML tags which were removed: ${Array.from(t).join(", ")}`), n;
}, Je = () => {
	let e = document.createElement("div");
	return e.className = "content-block-highlight__preview", e.hidden = !0, e.setAttribute("aria-hidden", "true"), e;
}, Ye = (e) => P(e), Xe = class {
	cache = /* @__PURE__ */ new Map();
	baseUrl;
	API_BASE_PATH = "/api/blocks";
	BLOCKS_PATH = this.API_BASE_PATH;
	RENDER_PATH = `${this.API_BASE_PATH}/:embedCode/render`;
	constructor(e) {
		this.baseUrl = new URL(e);
	}
	fetchAllBlocks() {
		let e = new URL(this.BLOCKS_PATH, this.baseUrl).toString();
		return fetch(e).then((e) => {
			if (!e.ok) throw Error(`Failed to fetch blocks: ${e.status}`);
			return e.json();
		}).then((e) => e.results);
	}
	fetchPreview(e) {
		if (this.cache.has(e)) return this.cache.get(e);
		let t;
		try {
			t = this.buildUrl(e);
		} catch (e) {
			return Promise.reject(e);
		}
		let n = fetch(t).then((t) => {
			if (!t.ok) throw this.cache.delete(e), Error(`Failed to fetch block ${e}: ${t.status}`);
			return t.text();
		}).then((e) => ({ html: e })).catch((t) => {
			throw this.cache.delete(e), t;
		});
		return this.cache.set(e, n), n;
	}
	get(e) {
		return this.cache.get(e);
	}
	buildUrl(e) {
		if (!r(e)) throw Error(`Invalid embed code: ${e}`);
		let t = this.RENDER_PATH.replace(":embedCode", encodeURIComponent(e)), n = new URL(t, this.baseUrl);
		if (n.origin !== this.baseUrl.origin) throw Error(`Invalid URL: ${n} is not on the same origin as ${this.baseUrl}`);
		if (!n.pathname.startsWith(this.baseUrl.pathname)) throw Error(`Invalid URL: ${n} is not within the base path of ${this.baseUrl}`);
		return n.toString();
	}
}, Ze = class e {
	embedPreviewDelayMs;
	textarea;
	wrapper;
	highlight;
	preview;
	apiClient;
	hoverPreviewTimeoutId;
	activeHoverEmbedCode = null;
	currentMarkUnderCursor = null;
	blockListElement = null;
	blockListRequest;
	constructor(e, t) {
		this.embedPreviewDelayMs = t.embedPreviewDelayMs ?? 200, this.textarea = this.initializeModule(e), this.wrapper = this.createWrapper(), this.highlight = this.createHighlight(), this.preview = Je(), this.wrapper.appendChild(this.preview);
		let n = t.baseUrl;
		this.apiClient = new Xe(n), this.textarea.classList.add("content-block-highlight__input"), this.updateHighlight(), this.textarea.addEventListener("input", () => this.updateHighlight()), this.textarea.addEventListener("scroll", () => {
			this.syncScroll(), this.onTextareaMouseLeave();
		}), this.textarea.addEventListener("mousemove", (e) => void this.onTextareaMouseMove(e)), this.textarea.addEventListener("mouseleave", () => this.onTextareaMouseLeave()), this.textarea.dataset.cbpInsertBlockButton && (this.blockListElement = this.createBlockListElement(), this.attachInsertBlockButtonListener(this.blockListElement), this.attachBlockListHideListeners(this.blockListElement)), "ResizeObserver" in window && new ResizeObserver(() => this.syncScroll()).observe(this.textarea);
	}
	syncScroll() {
		this.highlight.scrollTop = this.textarea.scrollTop, this.highlight.scrollLeft = this.textarea.scrollLeft;
	}
	initializeModule(e) {
		if (e instanceof HTMLTextAreaElement) return e;
		throw Error(`The module ${e.outerHTML} is not a textarea`);
	}
	createWrapper() {
		let e = document.createElement("div");
		return e.className = "content-block-highlight__wrapper", this.textarea.parentNode.insertBefore(e, this.textarea), e.appendChild(this.textarea), e;
	}
	createHighlight() {
		let e = document.createElement("div");
		return e.className = "govuk-textarea content-block-highlight__highlight", e.setAttribute("aria-hidden", "true"), this.wrapper.appendChild(e), e;
	}
	createBlockListElement() {
		let e = document.createElement("div");
		return e.className = "content-block-highlight__block-list", e.hidden = !0, e.setAttribute("role", "dialog"), e.setAttribute("aria-hidden", "true"), e.setAttribute("aria-label", "Insert content block"), document.body.appendChild(e), e;
	}
	attachInsertBlockButtonListener(e) {
		let t = this.textarea.dataset.cbpInsertBlockButton;
		if (!t) return;
		let n = document.getElementById(t);
		n instanceof HTMLButtonElement && n.addEventListener("click", (t) => {
			t.preventDefault(), t.stopPropagation(), e && this.showBlockListElement(n, e);
		});
	}
	attachBlockListHideListeners(e) {
		e.addEventListener("click", () => {
			this.hideElement(e);
		}), document.addEventListener("click", (t) => {
			e.hidden || t.target instanceof Node && (e.contains(t.target) || this.hideElement(e));
		}), document.addEventListener("keydown", (t) => {
			t.key === "Escape" && this.hideElement(e);
		});
	}
	showBlockListElement(e, t) {
		let n = e.getBoundingClientRect();
		t.style.top = `${n.bottom + window.scrollY + 8}px`, t.style.left = `${n.left + window.scrollX}px`, t.replaceChildren(document.createTextNode("Fetching blocks...")), this.showElement(t), this.fetchAndRenderBlockList();
	}
	showElement(e) {
		e.hidden = !1, e.setAttribute("aria-hidden", "false");
	}
	hideElement(e) {
		e.hidden = !0, e.setAttribute("aria-hidden", "true");
	}
	renderBlockListErrorState() {
		this.blockListElement?.replaceChildren(document.createTextNode("Unable to load blocks."));
	}
	insertEmbedCode(e) {
		let t = this.textarea.selectionStart ?? 0, n = this.textarea.selectionEnd ?? 0, r = this.textarea.value, { insertPosition: i, textEndPosition: a } = this.adjustInsertPositionIfSelectionOverlapsEmbedCode(t, n, r);
		this.textarea.value = r.slice(0, i) + e + r.slice(a);
		let o = i + e.length;
		this.textarea.selectionStart = o, this.textarea.selectionEnd = o, this.textarea.dispatchEvent(new Event("input"));
	}
	adjustInsertPositionIfSelectionOverlapsEmbedCode(e, n, r) {
		let i = r.matchAll(t), a = -1;
		for (let t of i) {
			let r = t.index, i = t.index + t[0].length;
			(e >= r && e < i || n > r && n <= i || e < r && n > i) && (a = Math.max(a, i));
		}
		return a === -1 ? {
			insertPosition: e,
			textEndPosition: n
		} : {
			insertPosition: a,
			textEndPosition: Math.max(n, a)
		};
	}
	createBlockListButton(e, t) {
		let n = document.createElement("button");
		return n.type = "button", n.textContent = e, n.addEventListener("click", () => {
			this.insertEmbedCode(t), this.textarea.focus();
		}), n;
	}
	renderBlockList(e) {
		if (!this.blockListElement) return;
		let t = document.createElement("ul");
		for (let n of e) {
			let e = document.createElement("li");
			if (e.dataset.embedCode = n.embed_code, e.appendChild(this.createBlockListButton(n.title, n.embed_code)), n.formats.length > 0) {
				let t = document.createElement("ul");
				for (let e of n.formats) {
					let r = `${n.embed_code.slice(0, -2)}#${e}}}`, i = document.createElement("li");
					i.dataset.embedCode = r, i.appendChild(this.createBlockListButton(e, r)), t.appendChild(i);
				}
				e.appendChild(t);
			}
			t.appendChild(e);
		}
		this.blockListElement.replaceChildren(t);
	}
	async fetchAndRenderBlockList() {
		if (!this.blockListRequest) {
			this.blockListRequest = this.apiClient.fetchAllBlocks();
			try {
				let e = await this.blockListRequest;
				this.renderBlockList(e);
			} catch (e) {
				console.error(e), this.renderBlockListErrorState();
			} finally {
				this.blockListRequest === this.blockListRequest && (this.blockListRequest = void 0);
			}
		}
	}
	updateHighlight() {
		let e = this.textarea.value;
		e[e.length - 1] === "\n" && (e += " "), e = e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), e = e.replace(t, "<mark class=\"content-block-highlight__mark\">$&</mark>"), this.highlight.innerHTML = e;
		let n = e.matchAll(t);
		for (let e of n) this.apiClient.fetchPreview(e[0]).catch((e) => console.error(e));
	}
	async onTextareaMouseMove(e) {
		let t = this.getMarkUnderCursor(e);
		if (t === this.currentMarkUnderCursor) return;
		let n = this.currentMarkUnderCursor;
		this.currentMarkUnderCursor = t, n && this.onMarkLeave(), t && await this.onMarkEnter(t);
	}
	onTextareaMouseLeave() {
		this.currentMarkUnderCursor = null, this.onMarkLeave();
	}
	getMarkUnderCursor(e) {
		let t = this.textarea.style.pointerEvents;
		this.textarea.style.pointerEvents = "none";
		let n = document.elementFromPoint(e.clientX, e.clientY);
		if (this.textarea.style.pointerEvents = t, !(n instanceof Element)) return null;
		let r = n.closest(".content-block-highlight__mark");
		return r instanceof HTMLElement ? r : null;
	}
	async onMarkEnter(e) {
		let t = e.textContent?.trim();
		if (!t) return;
		let n = this.apiClient.get(t);
		n && (this.activeHoverEmbedCode = t, this.clearHoverTimer(), this.hoverPreviewTimeoutId = window.setTimeout(() => {
			this.renderHoverPreview(e, t, n);
		}, this.embedPreviewDelayMs));
	}
	onMarkLeave() {
		this.activeHoverEmbedCode = null, this.clearHoverTimer(), this.hideHoverPreview();
	}
	async renderHoverPreview(e, t, n) {
		try {
			let r = await n;
			if (this.activeHoverEmbedCode !== t) return;
			this.preview.innerHTML = Ye(r.html), this.positionHoverPreview(e), this.showElement(this.preview);
		} catch (e) {
			console.error(e), this.hideHoverPreview();
		}
	}
	positionHoverPreview(e) {
		let t = e.getBoundingClientRect(), n = this.wrapper.getBoundingClientRect(), r = t.bottom - n.top + 8, i = t.left - n.left;
		this.preview.style.position = "absolute", this.preview.style.top = `${r}px`, this.preview.style.left = `${i}px`;
	}
	hideHoverPreview() {
		this.preview.hidden = !0, this.preview.setAttribute("aria-hidden", "true"), this.preview.innerHTML = "";
	}
	clearHoverTimer() {
		this.hoverPreviewTimeoutId !== void 0 && (window.clearTimeout(this.hoverPreviewTimeoutId), this.hoverPreviewTimeoutId = void 0);
	}
	static initAll(t, n = document) {
		let r = n.querySelectorAll("[data-module~=\"content-block-highlight\"]");
		return Array.from(r).map((n) => new e(n, t));
	}
};
//#endregion
export { Ze as ContentBlockPicker };
