/* Shared toolkit for the hands-on simulators.
   A module places <div class="sim" data-sim="name" data-title="…" data-lede="…"></div>;
   a course's sims.js calls Sim.register("name", function (body, ctx) { … }) to build it. */
(function () {
  var registry = {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'on') Object.keys(v).forEach(function (e) { el.addEventListener(e, v[e]); });
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(function (k) { add(el, k); });
    else el.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  var uid = 0;
  function slider(o) {
    var id = 'sim-r' + (++uid);
    var out = h('output', { for: id });
    var input = h('input', { type: 'range', id: id, min: o.min, max: o.max, step: o.step || 1, value: o.value });
    var fmt = o.fmt || String;
    function sync() { out.textContent = fmt(+input.value); }
    input.addEventListener('input', function () { sync(); o.on && o.on(+input.value); });
    sync();
    var el = h('label', { class: 'sim-slider' }, h('span', { class: 'sim-lab' }, o.label, ' ', out), input);
    return { el: el, input: input, get value() { return +input.value; }, set: function (v) { input.value = v; sync(); } };
  }
  function seg(o) {
    var value = o.value, btns = [];
    var el = h('div', { class: 'sim-seg', role: 'group', 'aria-label': o.label || null },
      o.label ? h('span', { class: 'sim-lab' }, o.label) : null);
    var row = h('div', { class: 'sim-seg-row' });
    o.options.forEach(function (opt) {
      var b = h('button', { type: 'button', 'aria-pressed': String(opt[0] === value), on: { click: function () {
        value = opt[0]; btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x._v === value)); }); o.on && o.on(value);
      } } }, opt[1]);
      b._v = opt[0]; btns.push(b); row.appendChild(b);
    });
    el.appendChild(row);
    return { el: el, get value() { return value; } };
  }
  function toggle(o) {
    var input = h('input', { type: 'checkbox' });
    input.checked = !!o.checked;
    input.addEventListener('change', function () { o.on && o.on(input.checked); });
    return { el: h('label', { class: 'sim-toggle' }, input, h('span', null, o.label)), input: input, get value() { return input.checked; } };
  }
  function button(label, on, primary) {
    return h('button', { type: 'button', class: 'sim-btn' + (primary ? ' primary' : ''), on: { click: on } }, label);
  }
  function stat(label, value) {
    var v = h('b', null, value == null ? '–' : value);
    var el = h('div', { class: 'sim-stat' }, h('span', null, label), v);
    return { el: el, set: function (x, cls) { v.textContent = x; v.className = cls || ''; } };
  }
  function logbox(cls) {
    var el = h('ol', { class: 'sim-log ' + (cls || ''), 'aria-live': 'polite' });
    return {
      el: el,
      add: function (text, kind, extra) {
        var li = h('li', { class: kind || '' }, extra ? h('span', { class: 'sim-tag' }, extra) : null, text);
        el.appendChild(li); el.scrollTop = el.scrollHeight; return li;
      },
      clear: function () { clear(el); }
    };
  }
  /* horizontal bars: items = [{label, value, max?, color?, note?}] */
  function bars(el, items, o) {
    o = o || {};
    clear(el); el.classList.add('sim-bars');
    var max = o.max || Math.max.apply(null, items.map(function (i) { return i.max || i.value; }).concat([1e-9]));
    items.forEach(function (it) {
      var pct = Math.max(0, Math.min(100, 100 * it.value / max));
      el.appendChild(h('div', { class: 'sim-bar' },
        h('span', { class: 'sim-bar-l' }, it.label),
        h('span', { class: 'sim-bar-t' }, h('i', { style: { width: pct + '%', background: it.color || 'var(--wire)' } })),
        h('span', { class: 'sim-bar-v' }, it.note != null ? it.note : String(it.value))));
    });
  }
  /* a tiny line chart in SVG: series = [{name, color, values:[…]}] */
  function lines(el, series, o) {
    o = o || {};
    var W = 560, H = o.height || 200, P = 34;
    var all = [].concat.apply([], series.map(function (s) { return s.values; }));
    var lo = o.min != null ? o.min : Math.min.apply(null, all), hi = o.max != null ? o.max : Math.max.apply(null, all);
    if (hi - lo < Math.abs(hi) * 0.04 || hi === lo) { var pad = Math.max(Math.abs(hi) * 0.05, 1); lo -= pad; hi += pad; }
    var n = Math.max.apply(null, series.map(function (s) { return s.values.length; }));
    var x = function (i) { return P + (W - P - 8) * (n <= 1 ? 0 : i / (n - 1)); };
    var y = function (v) { return H - 22 - (H - 34) * (v - lo) / (hi - lo); };
    var svg = '<svg class="sim-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.label || 'chart') + '">';
    [lo, (lo + hi) / 2, hi].forEach(function (v) {
      svg += '<line x1="' + P + '" x2="' + (W - 8) + '" y1="' + y(v) + '" y2="' + y(v) + '" style="stroke:var(--rule)"/>' +
        '<text x="' + (P - 4) + '" y="' + (y(v) + 4) + '" text-anchor="end" style="font-size:11px;fill:var(--muted)">' + (o.fmt ? o.fmt(v) : Math.round(v)) + '</text>';
    });
    series.forEach(function (s) {
      var d = s.values.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
      svg += '<path d="' + d + '" style="fill:none;stroke:' + s.color + ';stroke-width:2.5;stroke-linejoin:round"/>';
    });
    svg += '</svg>';
    var legend = series.length > 1 ? '<p class="sim-legend">' + series.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + s.name + '</span>'; }).join('') + '</p>' : '';
    el.innerHTML = svg + legend;
  }
  function rng(seed) {             // mulberry32: repeatable "randomness"
    var a = seed >>> 0 || 1;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function fmt(n, d) { return Number(n).toLocaleString(undefined, { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 }); }
  function money(n) { return n >= 100 ? '$' + fmt(n) : '$' + fmt(n, 2); }
  function pct(n, d) { return fmt(100 * n, d == null ? 0 : d) + '%'; }
  function row() { return h.apply(null, ['div', { class: 'sim-row' }].concat([].slice.call(arguments))); }
  function panel(title) { var el = h('div', { class: 'sim-panel' }, title ? h('p', { class: 'sim-ptitle' }, title) : null); return el; }

  window.Sim = { register: function (n, f) { registry[n] = f; }, h: h, clear: clear, slider: slider, seg: seg, toggle: toggle,
    button: button, stat: stat, logbox: logbox, bars: bars, lines: lines, rng: rng, wait: wait, fmt: fmt, money: money,
    pct: pct, row: row, panel: panel, reduce: reduce };

  function boot() {
    document.querySelectorAll('.sim[data-sim]').forEach(function (el) {
      var f = registry[el.dataset.sim];
      if (!f || el._built) return;
      el._built = true;
      clear(el);
      var body = h('div', { class: 'sim-body' });
      el.appendChild(h('div', { class: 'sim-head' },
        h('p', { class: 'sim-kicker' }, 'Try it'),
        h('h3', null, el.dataset.title || 'Simulator'),
        el.dataset.lede ? h('p', { class: 'sim-lede' }, el.dataset.lede) : null));
      el.appendChild(body);
      try { f(body, el); } catch (e) { body.textContent = 'This simulator failed to load: ' + e.message; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
