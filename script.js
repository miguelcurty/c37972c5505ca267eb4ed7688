(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = !reduce && root.classList.contains('anim');
  var qs = function (s, c) { return (c || document).querySelector(s); };
  var qsa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var hasIO = 'IntersectionObserver' in window;

  var toggle = qs('.nav-toggle');
  var nav = qs('#menu');
  var header = qs('.site-header');
  qsa('li', nav).forEach(function (li, i) { li.style.setProperty('--i', i); });
  function setMenu(open) {
    nav.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !e.target.closest('.site-header')) setMenu(false);
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1020) setMenu(false); });

  if (reduce) {
    qsa('animateMotion').forEach(function (a) { a.parentNode.parentNode.removeChild(a.parentNode); });
  }

  var headings = [];
  function splitWords(node, list) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.nodeValue.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'), i = document.createElement('span');
          w.className = 'w'; i.className = 'wi'; i.textContent = p;
          w.appendChild(i); frag.appendChild(w); list.push(w);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) { splitWords(n, list); }
    });
  }
  if (anim) {
    qsa('h1.rv, h2.rv, h3.rv').forEach(function (h) {
      var list = [];
      splitWords(h, list);
      h.classList.add('split');
      headings.push({ el: h, words: list });
    });
  }
  function lineIndex() {
    var tops = headings.map(function (h) { return h.words.map(function (w) { return w.offsetTop; }); });
    headings.forEach(function (h, k) {
      var l = -1, last = null;
      h.words.forEach(function (w, j) {
        if (last === null || Math.abs(tops[k][j] - last) > 4) { l++; last = tops[k][j]; }
        w.style.setProperty('--l', l);
      });
    });
  }

  var counters = qsa('[data-count]');
  var started = new WeakSet();
  function finalText(c) { return (c.getAttribute('data-prefix') || '') + parseInt(c.getAttribute('data-count'), 10); }
  function runCounter(c, delay) {
    if (started.has(c)) return; started.add(c);
    var target = parseInt(c.getAttribute('data-count'), 10), prefix = c.getAttribute('data-prefix') || '';
    if (!anim) { c.textContent = finalText(c); return; }
    var t0 = null, dur = 1900;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = p >= 1 ? 1 : 1 - Math.pow(2, -9 * p);
      c.textContent = prefix + Math.round(target * e);
      if (p < 1) requestAnimationFrame(step); else c.textContent = finalText(c);
    }
    setTimeout(function () { requestAnimationFrame(step); }, delay || 0);
  }
  if (anim) {
    var widths = counters.map(function (c) { return c.offsetWidth / parseFloat(getComputedStyle(c).fontSize); });
    counters.forEach(function (c, i) {
      c.style.minWidth = widths[i].toFixed(3) + 'em';
      c.textContent = (c.getAttribute('data-prefix') || '') + '0';
    });
  }

  var items = qsa('.rv');
  var heroItems = qsa('.hero-text .rv');
  function reveal(el, d) {
    el.style.setProperty('--d', d + 'ms');
    el.classList.add('in');
    qsa('[data-count]', el).forEach(function (c) { runCounter(c, d + 250); });
    setTimeout(function () { el.classList.add('done'); }, d + 1700);
  }
  if (!anim || !hasIO) {
    items.forEach(function (el) { el.classList.add('in', 'done'); });
    counters.forEach(function (c) { c.textContent = finalText(c); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      vis.sort(function (a, b) {
        var ta = Math.round(a.boundingClientRect.top / 30), tb = Math.round(b.boundingClientRect.top / 30);
        return ta - tb || a.boundingClientRect.left - b.boundingClientRect.left;
      });
      var base = performance.now() < 1900 ? 560 : 0;
      vis.forEach(function (en, i) { io.unobserve(en.target); reveal(en.target, base + Math.min(i, 7) * 75); });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { if (heroItems.indexOf(el) < 0) io.observe(el); });
  }

  var heroStarted = false;
  function heroGo() {
    if (heroStarted) return; heroStarted = true;
    lineIndex();
    var lastL = 0;
    qsa('h1 .w', qs('.hero-text')).forEach(function (w) { lastL = Math.max(lastL, parseInt(w.style.getPropertyValue('--l'), 10) || 0); });
    var after = 180 + lastL * 55 + 120;
    var seq = [['.eyebrow', 120], ['h1', 180], ['.lead', after], ['.tagline', after + 80], ['.actions', after + 160]];
    var box = qs('.hero-text');
    seq.forEach(function (s) { var el = qs(s[0], box); if (el) reveal(el, s[1]); });
    root.classList.add('hero-go');
  }
  if (anim) {
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 450); })]).then(heroGo);
    fontsReady.then(function () { lineIndex(); measure(); });
  } else {
    heroItems.forEach(function (el) { el.classList.add('in', 'done'); });
  }

  var bar = qs('.progress i');
  var toTop = qs('.to-top');
  var links = qsa('[data-spy]');
  var sections = qsa('[data-nav]');
  var hero = qs('#home');
  var stepsEl = qs('.steps');
  var stepLis = stepsEl ? qsa('li', stepsEl) : [];
  var G = { vh: 0, docH: 1, secTop: [], heroH: 0, steps: null, px: [] };
  var heroLayers = [];
  var hz = {};
  if (anim && hero) {
    [['.hero-bg', 0.16], ['.hero-art .glow', 0.12], ['.hero-art .map', 0.08], ['.hero-art .conn-main', 0.04],
     ['.hero-art .conn-circ', -0.05], ['.hero-art .conn-btn', -0.09]].forEach(function (d) {
      var el = qs(d[0], hero); if (el) heroLayers.push({ el: el, k: d[1] });
    });
    hz = { f1: qs('.hz1'), f2: qs('.hz2'), f3: qs('.hz3'), tr: qs('.hz-tr') };
    qsa('.pattern-circuit').forEach(function (sec) {
      var layer = document.createElement('div');
      layer.className = 'px-layer'; layer.setAttribute('aria-hidden', 'true');
      sec.insertBefore(layer, sec.firstChild); sec.classList.add('has-px');
      G.px.push({ sec: sec, el: layer, top: 0, h: 0 });
    });
  }
  function measure() {
    var y0 = window.pageYOffset || 0;
    G.vh = window.innerHeight;
    G.docH = Math.max(1, document.documentElement.scrollHeight - G.vh);
    G.secTop = sections.map(function (s) { return s.getBoundingClientRect().top + y0; });
    G.heroH = hero ? hero.offsetHeight : 0;
    G.hdr = header.offsetHeight;
    G.px.forEach(function (p) { var r = p.sec.getBoundingClientRect(); p.top = r.top + y0; p.h = r.height; });
    if (stepsEl) {
      var r = stepsEl.getBoundingClientRect();
      var mode = window.innerWidth <= 700 ? 'vert' : (stepLis.length > 1 && stepLis[0].offsetTop === stepLis[stepLis.length - 1].offsetTop ? 'row' : 'grid');
      G.steps = { top: r.top + y0, h: r.height, mode: mode, lis: stepLis.map(function (li) { var q = li.getBoundingClientRect(); return { top: q.top + y0, h: q.height }; }) };
    }
    request();
  }
  var ticking = false, lastY = -1, waTimer = null, current = '';
  var wa = qs('.wa');
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  var lpCache = [], litCache = [];
  function frame() {
    ticking = false;
    var y = window.pageYOffset || 0, vh = G.vh || window.innerHeight;

    if (bar) bar.style.transform = 'scaleX(' + clamp(y / G.docH, 0, 1).toFixed(4) + ')';

    header.classList.toggle('scrolled', y > 8);
    if (toTop) toTop.classList.toggle('show', y > 700);
    var line = G.hdr + vh * 0.3, cur = 'home';
    for (var i = 0; i < sections.length; i++) if (G.secTop[i] - y <= line) cur = sections[i].getAttribute('data-nav');
    if (vh + y >= G.docH + vh - 4) cur = 'contato';
    if (cur !== current) {
      current = cur;
      links.forEach(function (a) {
        var on = a.getAttribute('data-spy') === cur;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }
    if (!anim) return;

    if (y <= G.heroH + 120) {
      var yy = Math.min(y, G.heroH), p = G.heroH ? yy / G.heroH : 0;
      heroLayers.forEach(function (L) { L.el.style.transform = 'translate3d(0,' + (yy * L.k).toFixed(1) + 'px,0)'; });
      if (hz.f1) hz.f1.style.transform = 'translate3d(0,' + (p * 44).toFixed(1) + 'px,0)';
      if (hz.f2) hz.f2.style.transform = 'translate3d(0,' + (p * 24).toFixed(1) + 'px,0)';
      if (hz.f3) hz.f3.style.transform = 'translate3d(0,' + (p * 8).toFixed(1) + 'px,0)';
      if (hz.tr) hz.tr.style.transform = 'translate3d(' + (-p * 110).toFixed(1) + 'px,0,0)';
    }

    G.px.forEach(function (o) {
      if (y + vh < o.top - 40 || y > o.top + o.h + 40) return;
      var off = (y + vh / 2) - (o.top + o.h / 2);
      o.el.style.transform = 'translate3d(0,' + clamp(-off * 0.1, -120, 120).toFixed(1) + 'px,0)';
    });

    var S = G.steps;
    if (S && y + vh > S.top - 80) {
      var lineY = y + vh * 0.7, u = 0, P = 0;
      if (S.mode === 'row') { P = clamp((y + vh * 0.86 - S.top) / (vh * 0.36), 0, 1); u = P * 5; }
      S.lis.forEach(function (L, k) {
        var lit, lp = 0;
        if (S.mode === 'row') { lit = P > 0 && u + 0.02 >= k; lp = clamp(u - k, 0, 1); }
        else { lit = lineY >= L.top + 30; lp = S.mode === 'vert' ? clamp((lineY - (L.top + 30)) / (L.h + 22), 0, 1) : 0; }
        if (lit !== litCache[k]) { litCache[k] = lit; stepLis[k].classList.toggle('lit', lit); }
        lp = Math.round(lp * 500) / 500;
        if (lp !== lpCache[k]) { lpCache[k] = lp; stepLis[k].style.setProperty('--lp', lp); }
      });
    }
  }
  window.addEventListener('scroll', function () {
    request();
    if (wa) {
      wa.classList.add('is-scroll'); if (toTop) toTop.classList.add('is-scroll');
      clearTimeout(waTimer);
      waTimer = setTimeout(function () { wa.classList.remove('is-scroll'); if (toTop) toTop.classList.remove('is-scroll'); }, 700);
    }
  }, { passive: true });
  var rzT = null;
  function onResize() { clearTimeout(rzT); rzT = setTimeout(function () { lineIndex(); measure(); }, 160); }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('load', function () { measure(); });
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(document.body);
  if (anim && stepsEl) { stepLis.forEach(function (li) { li.style.setProperty('--lp', 0); }); }
  measure();
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var h = qs('#home'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });

  var contato = qs('#contato');
  if (wa && contato && hasIO) {
    var seen = { contato: false, home: false };
    var small = window.matchMedia('(max-width: 1020px)');
    var syncWa = function () { wa.classList.toggle('wa-hide', seen.contato || (small.matches && seen.home)); };
    var wio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      syncWa();
    }, { threshold: 0 });
    wio.observe(contato);
    if (hero) wio.observe(hero);
    if (small.addEventListener) small.addEventListener('change', syncWa);
  }

  var form = qs('#form-contato');
  var status = qs('#form-status');
  var msgs = {
    nome: 'Informe o seu nome.',
    email: 'Informe um e-mail válido, por exemplo nome@empresa.com.br.',
    telefone: 'Informe o seu telefone ou celular.',
    mensagem: 'Escreva a sua mensagem.'
  };
  var required = ['nome', 'email', 'telefone', 'mensagem'];
  function valid(name, v) {
    v = v.trim();
    if (!v) return false;
    if (name === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (name === 'telefone') return v.replace(/\D/g, '').length >= 8;
    if (name === 'mensagem') return v.length <= 2000;
    return true;
  }
  function check(field) {
    if (required.indexOf(field.name) < 0) return true;
    var ok = valid(field.name, field.value);
    var err = document.getElementById('e-' + field.name);
    field.setAttribute('aria-invalid', ok ? 'false' : 'true');
    var base = field.name === 'mensagem' ? 'cont-msg ' : '';
    field.setAttribute('aria-describedby', (base + (ok ? '' : err.id)).trim());
    if (!ok) field.setAttribute('aria-describedby', (base + err.id).trim());
    else if (!base) field.removeAttribute('aria-describedby');
    err.textContent = ok ? '' : msgs[field.name];
    return ok;
  }
  if (form) {
  required.forEach(function (n) {
    var f = form.elements[n];
    f.addEventListener('blur', function () { check(f); });
    f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f); });
  });
  var msg = form.elements.mensagem, counter = qs('#cont-msg');
  msg.addEventListener('input', function () { counter.textContent = msg.value.length + ' / 2000'; });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-note';
    var first = null;
    required.forEach(function (n) { var f = form.elements[n]; if (!check(f) && !first) first = f; });
    if (first) { first.focus(); status.textContent = 'Corrija os campos destacados e envie novamente.'; status.classList.add('bad'); return; }

    if (form.elements.website.value) { status.textContent = 'Obrigado! Mensagem enviada.'; return; }
    var d = {};
    ['nome', 'email', 'empresa', 'telefone', 'assunto', 'mensagem'].forEach(function (n) { d[n] = form.elements[n].value.trim(); });
    var subject = d.assunto || ('Contato pelo site - ' + d.nome);
    var body = 'Nome: ' + d.nome + '\r\nE-mail: ' + d.email +
      (d.empresa ? '\r\nEmpresa: ' + d.empresa : '') +
      (d.telefone ? '\r\nTelefone: ' + d.telefone : '') +
      '\r\n\r\nMensagem:\r\n' + d.mensagem;
    window.location.href = 'mailto:contato@connectimport.com.br?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body.replace(/\r?\n/g, '\r\n'));
    status.textContent = 'Abrindo o seu aplicativo de e-mail. Se nada acontecer, escreva para contato@connectimport.com.br.';
    status.classList.add('ok');
  });
  }

  qsa('.video-facade').forEach(function (f) {
    function load() {
      if (f.dataset.loaded) return; f.dataset.loaded = '1';
      var ifr = document.createElement('iframe');
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + f.dataset.videoId + '?autoplay=1&rel=0';
      ifr.title = 'Conheça a História da Connect Import';
      ifr.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      ifr.allowFullscreen = true;
      ifr.loading = 'lazy';
      f.textContent = '';
      f.appendChild(ifr);
      f.removeAttribute('role'); f.removeAttribute('tabindex');
    }
    f.addEventListener('click', load);
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); } });
  });

  window.__ci = 1;
})();
