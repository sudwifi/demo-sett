/* Sud Wifi — démo SETT hors ligne : moteur d'affichage autonome (aucune dépendance) */
(function () {
  'use strict';

  var fnCache = {};
  function evalExpr(expr, scope) {
    var f = fnCache[expr];
    if (!f) {
      try { f = fnCache[expr] = new Function('__s', 'with (__s) { return (' + expr + '); }'); }
      catch (e) { console.warn('[demo] expression invalide', expr); f = fnCache[expr] = function () { return undefined; }; }
    }
    try { return f(scope); } catch (e) { return undefined; }
  }
  var ONE = /^\s*\{\{([\s\S]+?)\}\}\s*$/;
  var MANY = /\{\{([\s\S]+?)\}\}/g;
  function interp(str, scope) {
    return str.replace(MANY, function (_, e) { var v = evalExpr(e, scope); return v == null ? '' : String(v); });
  }
  function exprOf(v) { var m = ONE.exec(v || ''); return m ? m[1] : (v || ''); }

  function processChildren(el, scope) {
    Array.prototype.slice.call(el.childNodes).forEach(function (c) {
      var out = processNode(c, scope);
      if (out.length === 1 && out[0] === c) return;
      out.forEach(function (n) { el.insertBefore(n, c); });
      el.removeChild(c);
    });
  }
  function expandFrom(tplNode, scope) {
    var out = [];
    Array.prototype.slice.call(tplNode.childNodes).forEach(function (c) {
      out.push.apply(out, processNode(c.cloneNode(true), scope));
    });
    return out;
  }
  function processNode(node, scope) {
    if (node.nodeType === 3) {
      if (node.nodeValue.indexOf('{{') >= 0) node.nodeValue = interp(node.nodeValue, scope);
      return [node];
    }
    if (node.nodeType !== 1) return [node];
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var list = evalExpr(exprOf(node.getAttribute('list')), scope) || [];
      var as = node.getAttribute('as') || 'item';
      var res = [];
      list.forEach(function (item, i) {
        var s = Object.create(scope); s[as] = item; s.index = i;
        res.push.apply(res, expandFrom(node, s));
      });
      return res;
    }
    if (tag === 'sc-if') {
      return evalExpr(exprOf(node.getAttribute('value')), scope) ? expandFrom(node, scope) : [];
    }
    Array.prototype.slice.call(node.attributes).forEach(function (a) {
      var n = a.name, v = a.value;
      if (n.indexOf('hint-') === 0) { node.removeAttribute(n); return; }
      if (n.length > 2 && n.indexOf('on') === 0 && v.indexOf('{{') >= 0) {
        node.removeAttribute(n);
        var fn = evalExpr(exprOf(v), scope);
        if (typeof fn === 'function') node.addEventListener(n.slice(2), function (ev) { fn(ev); });
        return;
      }
      if (v.indexOf('{{') >= 0) node.setAttribute(n, interp(v, scope));
    });
    processChildren(node, scope);
    return [node];
  }

  var instance = null, tpl = null, root = null, pending = false;
  function render() {
    pending = false;
    var vals = instance.renderVals() || {};
    var scope = Object.assign(Object.create(null), vals, { props: instance.props, state: instance.state });
    var frag = tpl.content.cloneNode(true);
    processChildren(frag, scope);
    root.replaceChildren(frag);
  }
  function schedule() { if (!pending) { pending = true; Promise.resolve().then(render); } }

  window.DCLogic = function DCLogic(props) { this.props = props || {}; this.state = {}; };
  window.DCLogic.prototype.setState = function (u) {
    var next = typeof u === 'function' ? u(this.state, this.props) : u;
    this.state = Object.assign({}, this.state, next);
    schedule();
  };
  window.DCLogic.prototype.renderVals = function () { return {}; };

  /* ---------- Mise à l'échelle de l'écran ---------- */
  function fit() {
    var cfg = window.DEMO_PAGE;
    var s = Math.min(window.innerWidth / cfg.w, window.innerHeight / cfg.h);
    var x = Math.max(0, (window.innerWidth - cfg.w * s) / 2), y = Math.max(0, (window.innerHeight - cfg.h * s) / 2);
    root.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
  }

  /* ---------- Menu discret de la démo ---------- */
  function buildMenu() {
    var cfg = window.DEMO_PAGE, pages = window.DEMO_PAGES;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'demo-btn'; btn.setAttribute('aria-label', 'Écrans de la démo'); btn.textContent = '☰';
    var panel = document.createElement('div');
    panel.className = 'demo-panel'; panel.hidden = true;
    var h = '<p class="demo-title">Démo Sud Wifi · SETT</p>';
    pages.forEach(function (p, i) {
      h += '<a href="' + p.file + '"' + (p.file === cfg.file ? ' aria-current="page"' : '') + '><span>' + (i + 1) + '</span>' + p.title + '</a>';
    });
    h += '<button type="button" class="demo-fs">Plein écran</button><p class="demo-hint">Flèches ← → : écran précédent / suivant · F : plein écran</p>';
    panel.innerHTML = h;
    btn.addEventListener('click', function () { panel.hidden = !panel.hidden; });
    panel.querySelector('.demo-fs').addEventListener('click', toggleFs);
    document.body.appendChild(panel); document.body.appendChild(btn);
  }
  function toggleFs() {
    var d = document;
    if (!d.fullscreenElement && d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () {});
    else if (d.exitFullscreen) d.exitFullscreen().catch(function () {});
  }
  function go(delta) {
    var pages = window.DEMO_PAGES, cfg = window.DEMO_PAGE;
    var i = pages.findIndex(function (p) { return p.file === cfg.file; });
    var j = (i + delta + pages.length) % pages.length;
    location.href = pages[j].file;
  }
  document.addEventListener('keydown', function (e) {
    var t = (e.target && e.target.tagName) || '';
    if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'f' || e.key === 'F') toggleFs();
  });

  window.addEventListener('DOMContentLoaded', function () {
    tpl = document.getElementById('dc-tpl');
    root = document.getElementById('dc-root');
    var cfg = window.DEMO_PAGE;
    root.style.width = cfg.w + 'px'; root.style.height = cfg.h + 'px';
    instance = new window.Component(cfg.props || {});
    render(); fit(); buildMenu();
    window.addEventListener('resize', fit);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  });
})();
