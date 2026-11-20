/* LLM Engineering: one hands-on simulator per module. Everything runs in the page; prices are examples, not quotes. */
(function () {
  var S = Sim, h = S.h;
  var TIERS = { local: ['Local (Ollama)', 0, 0], small: ['Small model', 0.25, 2], mid: ['Mid-size model', 1.25, 10], large: ['Large frontier model', 5, 25] };

  /* ---------------- Module 0: what will this cost me? */
  S.register('cost-estimator', function (body) {
    var tier = 'small';
    var pick = S.seg({ label: 'Model (example prices per million tokens)', value: tier,
      options: Object.keys(TIERS).map(function (k) { var t = TIERS[k]; return [k, t[0] + (t[1] ? ' · $' + t[1] + ' in / $' + t[2] + ' out' : ' · free')]; }),
      on: function (v) { tier = v; calc(); } });
    var calls = S.slider({ label: 'Calls per day', min: 10, max: 5000, step: 10, value: 200, fmt: S.fmt, on: calc });
    var inTok = S.slider({ label: 'Input tokens per call', min: 100, max: 20000, step: 100, value: 1500, fmt: S.fmt, on: calc });
    var outTok = S.slider({ label: 'Output tokens per call', min: 50, max: 4000, step: 50, value: 400, fmt: S.fmt, on: calc });
    var per = S.stat('Per call'), day = S.stat('Per day'), month = S.stat('Per month'), loop = S.stat('A 500-call runaway loop');
    function calc() {
      var t = TIERS[tier], c = (inTok.value * t[1] + outTok.value * t[2]) / 1e6;
      per.set(c ? '$' + c.toFixed(4) : '$0'); day.set(S.money(c * calls.value)); month.set(S.money(c * calls.value * 30), c * calls.value * 30 > 100 ? 'bad' : '');
      loop.set(S.money(c * 500));
    }
    body.append(pick.el, S.row(calls.el, inTok.el, outTok.el), h('div', { class: 'sim-stats' }, per.el, day.el, month.el, loop.el),
      h('p', { class: 'sim-note' }, 'Output tokens usually cost several times more than input tokens. A bug that loops is the most common way to get a surprise bill, which is why a spending limit comes first.'));
    calc();
  });

  /* ---------------- Module 1: see text as tokens */
  var SAMPLES = {
    English: 'Large language models read text as tokens, not words. Unusual words get split into pieces.',
    Code: 'def summarize(url: str) -> str:\n    return ask(f"Summarize {fetch_text(url)}")',
    Numbers: 'Order 4815162342 shipped on 2026-11-19 for $1,234.56 to 221B Baker Street.',
    Spanish: 'Los modelos de lenguaje leen el texto como fragmentos llamados tokens.',
    Japanese: '大規模言語モデルはテキストをトークンとして読みます。'
  };
  function tokenize(text) {
    var out = [], re = /( ?[A-Za-zÀ-ɏ]+| ?\d{1,3}| ?[^\sA-Za-z\dÀ-ɏ]|\s+)/g, m;
    while ((m = re.exec(text))) {
      var t = m[0], core = t.replace(/^ /, '');
      if (/^[A-Za-zÀ-ɏ]+$/.test(core) && core.length > 8) {
        var lead = t.length > core.length ? ' ' : '', suf = (core.match(/(ization|ations|ation|ing|tion|ness|ment|ers|ed|ly|es|s)$/i) || [''])[0];
        var stem = core.slice(0, core.length - suf.length), pieces = [];
        while (stem.length > 7) { pieces.push(stem.slice(0, 6)); stem = stem.slice(6); }
        if (stem) pieces.push(stem); if (suf) pieces.push(suf);
        pieces[0] = lead + pieces[0]; out.push.apply(out, pieces);
      } else out.push(t);
    }
    return out;
  }
  S.register('tokenizer', function (body) {
    var ta = h('textarea', { 'aria-label': 'Text to tokenize', spellcheck: 'false' });
    ta.value = SAMPLES.English;
    var chips = h('div', { class: 'sim-chips', 'aria-live': 'polite' });
    var chars = S.stat('Characters'), toks = S.stat('Tokens (approx.)'), ratio = S.stat('Characters per token'), fill = S.stat('Share of a 128k window');
    var COLORS = ['#3A6FD8', '#8A4FD0', '#D2551F', '#1E9B8A', '#C2337A', '#B8860B'];
    function run() {
      var t = tokenize(ta.value); S.clear(chips);
      t.forEach(function (x, i) { chips.appendChild(h('span', { style: { background: 'color-mix(in srgb,' + COLORS[i % 6] + ' 22%,var(--paper))' } }, x.replace(/\n/g, '↵'))); });
      chars.set(S.fmt(ta.value.length)); toks.set(S.fmt(t.length)); ratio.set(t.length ? (ta.value.length / t.length).toFixed(1) : '–');
      fill.set((100 * t.length / 128000).toFixed(3) + '%');
    }
    ta.addEventListener('input', run);
    body.append(h('div', { class: 'sim-seg-row' }, Object.keys(SAMPLES).map(function (k) {
      return S.button(k, function () { ta.value = SAMPLES[k]; run(); }); })), ta, chips,
      h('div', { class: 'sim-stats' }, chars.el, toks.el, ratio.el, fill.el),
      h('p', { class: 'sim-note' }, 'This page approximates a byte-pair tokenizer: common words are one token, rare words split into pieces, and digits and non-Latin scripts cost more. For exact counts, run tiktoken or the model’s own tokenizer. English averages about four characters per token; compare it with Japanese and numbers.'));
    run();
  });

  /* ---------------- Module 2: watch the messages list during a tool call */
  S.register('tool-messages', function (body) {
    var PRICES = { London: '$799', Paris: '$899', Tokyo: '$1,400', Berlin: '$499' };
    var city = S.seg({ label: 'Destination', value: 'London', options: [['London', 'London'], ['Tokyo', 'Tokyo'], ['Atlantis', 'Atlantis (not in the database)']], on: reset });
    var two = S.toggle({ label: 'Ask about Paris too', on: reset });
    var list = h('ol', { class: 'tm-list' }), callS = S.stat('API calls'), finS = S.stat('Last finish_reason'), cntS = S.stat('Messages sent');
    var stepBtn = S.button('Next step', step, true), plan, k, calls;
    function cities() { return [city.value].concat(two.value ? ['Paris'] : []); }
    function msg(role, content, cls) { list.appendChild(h('li', { class: cls || role }, h('b', null, role), h('code', null, content))); }
    function reset() {
      S.clear(list); calls = 0; k = 0; stepBtn.disabled = false;
      msg('system', '"You are a helpful assistant for an airline called FlightAI. Be brief and courteous."');
      var q = 'How much is a return ticket to ' + cities().join(' and ') + '?';
      msg('user', '"' + q + '"');
      plan = ['call1', 'tools', 'call2']; callS.set(0); finS.set('–'); cntS.set(2);
    }
    function step() {
      var p = plan[k++], cs = cities();
      if (p === 'call1') {
        calls++; finS.set('tool_calls');
        msg('assistant', 'tool_calls: [' + cs.map(function (c, i) { return '{id: "call_' + (i + 1) + '", name: "get_ticket_price", arguments: {"destination_city": "' + c + '"}}'; }).join(', ') + ']', 'assistant');
      } else if (p === 'tools') {
        cs.forEach(function (c, i) { msg('tool', 'tool_call_id: "call_' + (i + 1) + '", content: "' + (PRICES[c] ? c + ': ' + PRICES[c] : 'No price found for ' + c) + '"', 'tool'); });
      } else if (p === 'call2') {
        calls++; finS.set('stop');
        var parts = cs.map(function (c) { return PRICES[c] ? 'a return ticket to ' + c + ' is ' + PRICES[c] : 'I don’t have a fare for ' + c; });
        msg('assistant', '"' + parts.join(', and ') + '."', 'final');
      }
      callS.set(calls); cntS.set(list.children.length);
      if (k >= plan.length) stepBtn.disabled = true;
    }
    body.append(city.el, S.row(two.el), S.row(stepBtn, S.button('Reset', reset)), list, h('div', { class: 'sim-stats' }, callS.el, finS.el, cntS.el),
      h('p', { class: 'sim-note' }, 'The second API call sends the whole list again, including the assistant’s tool request and one tool result per call ID. Ask about two cities and note that one assistant message can request two tools.'));
    reset();
  });

  /* ---------------- Module 3: will it fit on the GPU? */
  S.register('gpu-memory', function (body) {
    var params = S.slider({ label: 'Model size', min: 1, max: 70, value: 8, fmt: function (v) { return v + 'B parameters'; }, on: calc });
    var bits = '16';
    var prec = S.seg({ label: 'Precision', value: bits, options: [['32', '32-bit'], ['16', '16-bit'], ['8', '8-bit'], ['4', '4-bit']], on: function (v) { bits = v; calc(); } });
    var train = S.toggle({ label: 'Fine-tuning with LoRA (optimizer, activations, adapters)', on: calc });
    var gpus = h('div'), need = S.stat('Memory needed');
    var CARDS = [['Colab T4', 15], ['L4', 24], ['A100 40 GB', 40], ['A100 / H100 80 GB', 80]];
    function calc() {
      var gb = params.value * (+bits / 8) * 1.2 * (train.value ? 1.4 : 1) + (train.value ? 2 : 0.5);
      need.set(gb.toFixed(1) + ' GB');
      S.bars(gpus, CARDS.map(function (c) {
        var fits = gb <= c[1];
        return { label: c[0] + ' (' + c[1] + ' GB)', value: Math.min(gb / c[1], 1), color: fits ? 'var(--w4)' : 'var(--w7)',
          note: fits ? 'fits, ' + Math.round(100 * gb / c[1]) + '%' : (gb / c[1]).toFixed(1) + '× too big' };
      }), { max: 1 });
    }
    body.append(S.row(params.el), prec.el, S.row(train.el), h('div', { class: 'sim-stats' }, need.el), gpus,
      h('p', { class: 'sim-note' }, 'Rule of thumb: parameters × bytes per parameter, plus about 20% for the KV cache and overhead. The black tick on each bar is the card’s capacity. Try an 8B model at 16-bit on a T4, then at 4-bit.'));
    calc();
  });

  /* ---------------- Module 4: a model race */
  S.register('model-race', function (body) {
    var MODELS = [
      ['Frontier, high reasoning', 0.95, 0.92, 38, [300, 1500], [800, 9000]],
      ['Frontier, small', 0.85, 0.7, 12, [80, 600], [100, 2000]],
      ['Open-weights 120B', 0.85, 0.75, 20, [100, 900], [400, 110000]],
      ['Small local coder', 0.45, 0.2, 26, [5, 80], [5, 60]]
    ];
    var prob = 'easy', seed = 5;
    var pick = S.seg({ label: 'Program to port', value: prob, options: [['easy', 'Easy: a numeric series'], ['hard', 'Hard: maximum subarray']], on: function (v) { prob = v; } });
    var lanes = h('div', { class: 'mr-lanes' }), best = S.stat('Winner'), ok = S.stat('Correct programs');
    var busy = false;
    async function race() {
      if (busy) return; busy = true;
      var r = S.rng(seed++), hard = prob === 'hard', results = [];
      S.clear(lanes);
      var rows = MODELS.map(function (m) {
        var bar = h('i'), res = h('span', { class: 'mr-res' }, 'writing…');
        lanes.appendChild(h('div', { class: 'mr-lane' }, h('span', null, m[0]), h('span', { class: 'mr-track' }, bar), res));
        return { m: m, bar: bar, res: res };
      });
      await Promise.all(rows.map(async function (row) {
        var m = row.m, t = m[3] * (0.7 + r() * 0.6);
        row.bar.style.transitionDuration = (S.reduce ? 0 : t * 40) + 'ms'; row.bar.style.width = '70%';
        await S.wait(t * 40);
        var compiles = r() < (hard ? m[2] + 0.05 : m[1] + 0.03), correct = compiles && r() < (hard ? m[2] : m[1]) / (hard ? m[2] + 0.05 : m[1] + 0.03);
        row.bar.style.transitionDuration = (S.reduce ? 0 : 300) + 'ms'; row.bar.style.width = '100%';
        await S.wait(300);
        var range = hard ? m[5] : m[4];
        if (!compiles) { row.res.textContent = '✗ compile error'; row.bar.className = 'fail'; }
        else if (!correct) { row.res.textContent = '✗ wrong output'; row.bar.className = 'fail'; }
        else { var x = Math.round(range[0] * Math.pow(range[1] / range[0], r())); row.res.textContent = '✓ ' + S.fmt(x) + '× faster'; results.push([m[0], x]); }
      }));
      results.sort(function (a, b) { return b[1] - a[1]; });
      best.set(results.length ? results[0][0] : 'nobody'); ok.set(results.length + ' / 4');
      busy = false;
    }
    body.append(pick.el, S.row(S.button('Start the race', race, true)), lanes, h('div', { class: 'sim-stats' }, best.el, ok.el),
      h('p', { class: 'sim-note' }, 'Simulated, with odds loosely based on published runs of this project. Race several times on each program: results vary run to run, which is why you measure on your own task, more than once.'));
    race();
  });

  /* ---------------- Module 5: chunking and retrieval */
  var DOC = 'Larkspur Mutual is a home and auto insurer founded in 2014 in Portland by Maya Chen, who is still chief executive. ' +
    'The company moved its headquarters to Denver in 2022 and now employs 312 people across four offices. ' +
    'Larkspur sells three products. HomeShield covers houses and apartments. AutoSure, launched in 2019, covers private cars and light vans. ' +
    'PawPlan, the newest product, covers vet bills for cats and dogs. ' +
    'Claims under $2,000 are approved automatically within 48 hours if the photos and receipts pass the fraud check. ' +
    'Larger claims go to a human adjuster, and the claims team is led by Jordan Okafor. ' +
    'Customers can cancel any policy within 14 days for a full refund. After that, a cancellation fee of $25 applies. ' +
    'Larkspur’s contracts with repair shops are renewed every March, and the preferred network has 140 garages in Colorado and Oregon. ' +
    'The 2025 customer survey gave HomeShield a satisfaction score of 4.6 out of 5, and AutoSure 4.2.';
  var QS = [['Who leads the claims team?', 'Jordan Okafor'], ['How quickly are small claims approved?', 'within 48 hours'],
    ['When was AutoSure launched?', 'launched in 2019'], ['What is the fee to cancel after two weeks?', '$25'], ['Where is the head office?', 'Denver']];
  var STOP = { the: 1, a: 1, an: 1, is: 1, are: 1, of: 1, to: 1, in: 1, and: 1, what: 1, who: 1, when: 1, where: 1, how: 1, was: 1, for: 1, after: 1, do: 1, does: 1 };
  function words(s) { return (s.toLowerCase().match(/[a-z0-9$]+/g) || []).filter(function (w) { return !STOP[w]; }); }
  function stem(w) { return w.replace(/(ing|ed|es|s|ly)$/, ''); }
  S.register('rag-playground', function (body) {
    var size = S.slider({ label: 'Chunk size', min: 80, max: 600, step: 20, value: 200, fmt: function (v) { return v + ' characters'; }, on: run });
    var overlap = S.slider({ label: 'Overlap', min: 0, max: 150, step: 10, value: 0, fmt: function (v) { return v + ' characters'; }, on: run });
    var topk = S.slider({ label: 'Chunks retrieved (k)', min: 1, max: 4, value: 2, on: run });
    var qi = 0, q = S.seg({ label: 'Question', value: 0, options: QS.map(function (x, i) { return [i, x[0]]; }), on: function (v) { qi = v; run(); } });
    var out = h('div', { class: 'rag-chunks' }), nS = S.stat('Chunks'), hitS = S.stat('Answer retrieved?'), ctxS = S.stat('Context sent');
    function chunk() {
      var c = [], start = 0, step = Math.max(20, size.value - overlap.value);
      while (start < DOC.length) {
        var end = Math.min(DOC.length, start + size.value);
        if (end < DOC.length) { var sp = DOC.lastIndexOf(' ', end); if (sp > start + 20) end = sp; }
        c.push(DOC.slice(start, end).trim());
        if (end >= DOC.length) break;
        start = Math.max(start + 1, end - overlap.value);
        var sp2 = DOC.indexOf(' ', start); if (sp2 > 0 && sp2 - start < 15) start = sp2 + 1;
      }
      return c;
    }
    function run() {
      var cs = chunk(), qw = words(QS[qi][0]).map(stem), ans = QS[qi][1];
      var df = {}; cs.forEach(function (c) { var seen = {}; words(c).map(stem).forEach(function (w) { if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } }); });
      var scored = cs.map(function (c, i) {
        var ws = words(c).map(stem), s = 0;
        qw.forEach(function (w) { if (ws.indexOf(w) >= 0) s += Math.log(1 + cs.length / df[w]); });
        return { i: i, c: c, s: s };
      });
      var top = scored.slice().sort(function (a, b) { return b.s - a.s; }).slice(0, topk.value).filter(function (x) { return x.s > 0; });
      var ids = top.map(function (x) { return x.i; }), hit = top.some(function (x) { return x.c.indexOf(ans) >= 0; });
      var split = !hit && !cs.some(function (c) { return c.indexOf(ans) >= 0; });
      S.clear(out);
      scored.forEach(function (x) {
        var picked = ids.indexOf(x.i) >= 0;
        var p = h('div', { class: 'rag-chunk' + (picked ? ' picked' : '') }, h('b', null, '#' + (x.i + 1) + ' · score ' + x.s.toFixed(1)));
        var t = h('span'); var at = x.c.indexOf(ans);
        if (at >= 0) { t.append(x.c.slice(0, at), h('mark', null, ans), x.c.slice(at + ans.length)); } else t.textContent = x.c;
        p.appendChild(t); out.appendChild(p);
      });
      nS.set(cs.length);
      hitS.set(hit ? 'yes' : split ? 'no: split across chunks' : 'no', hit ? 'good' : 'bad');
      ctxS.set(S.fmt(top.reduce(function (s, x) { return s + x.c.length; }, 0)) + ' chars');
    }
    body.append(q.el, S.row(size.el, overlap.el, topk.el), h('div', { class: 'sim-stats' }, nS.el, hitS.el, ctxS.el), out,
      h('p', { class: 'sim-note' }, 'Retrieval here scores chunks by shared keywords, a stand-in for embedding similarity. Highlighted chunks go to the model; the answer is marked. Make the chunks tiny and watch answers get cut in half, then add overlap. Then ask where the head office is: keyword matching finds nothing, because the document says "headquarters". Embeddings match meaning, not spelling, which is why RAG uses them.'));
    run();
  });

  /* ---------------- Module 6: baselines on a tiny product set */
  var ITEMS = [
    ['Cordless drill 20V with two batteries', 'Tools', 4.2, 129], ['Stainless steel hex key set', 'Tools', 0.8, 18], ['Orbital sander 240W', 'Tools', 3.1, 59],
    ['Socket wrench set 94 piece', 'Tools', 9.5, 89], ['Laser distance measure 50m', 'Tools', 0.4, 45], ['Wireless earbuds noise cancelling', 'Electronics', 0.2, 149],
    ['USB-C charger 65W', 'Electronics', 0.3, 35], ['27 inch 4K monitor', 'Electronics', 14, 329], ['Portable Bluetooth speaker', 'Electronics', 1.2, 79],
    ['Smart watch with GPS', 'Electronics', 0.1, 249], ['Car phone mount magnetic', 'Automotive', 0.3, 22], ['Tire inflator portable 12V', 'Automotive', 2.4, 49],
    ['Jump starter 2000A', 'Automotive', 3, 99], ['All-weather floor mats set', 'Automotive', 7, 65], ['Dash camera front and rear', 'Automotive', 0.6, 119],
    ['Electric kettle 1.7L', 'Appliances', 2.6, 39], ['Stand mixer 5 quart', 'Appliances', 22, 279], ['Air fryer 6 quart', 'Appliances', 11, 99],
    ['Cordless hand vacuum', 'Appliances', 3.5, 69], ['Espresso machine with grinder', 'Appliances', 24, 599],
    ['Impact driver 20V brushless', 'Tools', 3.3, 109], ['Noise cancelling headphones', 'Electronics', 0.6, 299], ['Car vacuum cleaner 12V', 'Automotive', 2.2, 39], ['Blender 1200W', 'Appliances', 9.8, 129]
  ];
  S.register('baselines', function (body) {
    var train = ITEMS.slice(0, 18), test = ITEMS.slice(18);
    var mean = train.reduce(function (s, x) { return s + x[3]; }, 0) / train.length;
    var bycat = {}; train.forEach(function (x) { (bycat[x[1]] = bycat[x[1]] || []).push(x[3]); });
    var xm = train.reduce(function (s, x) { return s + x[2]; }, 0) / train.length;
    var b1 = train.reduce(function (s, x) { return s + (x[2] - xm) * (x[3] - mean); }, 0) / train.reduce(function (s, x) { return s + Math.pow(x[2] - xm, 2); }, 0);
    function tw(t) { return t.toLowerCase().split(/\W+/).filter(function (w) { return w.length > 2; }); }
    var STRATS = {
      constant: ['Constant: the average price', function () { return mean; }],
      category: ['Average for the category', function (x) { var a = bycat[x[1]]; return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }],
      weight: ['Linear regression on weight', function (x) { return mean + b1 * (x[2] - xm); }],
      neighbor: ['Most similar title (nearest neighbor)', function (x) {
        var w = tw(x[0]), best = null, bs = -1;
        train.forEach(function (y) { var v = tw(y[0]), inter = w.filter(function (k) { return v.indexOf(k) >= 0; }).length, s = inter / (w.length + v.length - inter) + (y[1] === x[1] ? 0.05 : 0); if (s > bs) { bs = s; best = y; } });
        return best[3]; }]
    };
    var cur = 'constant', board = h('div'), table = h('div', { class: 'tbl' });
    var pick = S.seg({ label: 'Show predictions for', value: cur, options: Object.keys(STRATS).map(function (k) { return [k, STRATS[k][0]]; }), on: function (v) { cur = v; draw(); } });
    function mae(f) { return test.reduce(function (s, x) { return s + Math.abs(f(x) - x[3]); }, 0) / test.length; }
    function draw() {
      S.bars(board, Object.keys(STRATS).map(function (k) { var e = mae(STRATS[k][1]); return { label: STRATS[k][0], value: e, note: '$' + e.toFixed(0), color: k === cur ? 'var(--w6)' : 'color-mix(in srgb,var(--w6) 45%,var(--rule))' }; }));
      var f = STRATS[cur][1], rows = test.map(function (x) { var p = f(x), e = Math.abs(p - x[3]);
        return h('tr', null, h('td', null, x[0]), h('td', null, x[1]), h('td', null, '$' + x[3]), h('td', null, '$' + p.toFixed(0)), h('td', { class: e < 0.25 * x[3] ? 'ok' : 'bad' }, '$' + e.toFixed(0))); });
      table.replaceChildren(h('table', null, h('thead', null, h('tr', null, ['Test item', 'Category', 'Price', 'Predicted', 'Error'].map(function (c) { return h('th', null, c); }))), h('tbody', null, rows)));
    }
    body.append(h('p', { class: 'sim-ptitle' }, 'Average error on 6 held-out items (lower is better), trained on 18'), board, pick.el, table,
      h('p', { class: 'sim-note' }, 'The same evaluation for every approach is what makes the numbers comparable. Even this toy set shows the pattern from the real project: text that carries meaning beats a single number like weight.'));
    draw();
  });

  /* ---------------- Module 7: how small is a LoRA adapter? */
  S.register('lora-calc', function (body) {
    var MODELS = { '3b': ['Llama 3.2 3B', 3072, 28, 8192, 3.2e9], '8b': ['Llama 3.1 8B', 4096, 32, 14336, 8.0e9], '70b': ['Llama 3.1 70B', 8192, 80, 28672, 70.6e9] };
    var m = '3b', tg = 'attn';
    var pickM = S.seg({ label: 'Base model', value: m, options: Object.keys(MODELS).map(function (k) { return [k, MODELS[k][0]]; }), on: function (v) { m = v; calc(); } });
    var rank = S.slider({ label: 'Rank r', min: 2, max: 7, value: 4, fmt: function (v) { return Math.pow(2, v); }, on: calc });
    var pickT = S.seg({ label: 'Target modules', value: tg, options: [['qv', 'q_proj, v_proj'], ['attn', 'all attention (q, k, v, o)'], ['all', 'attention + MLP']], on: function (v) { tg = v; calc(); } });
    var trainS = S.stat('Trainable parameters'), shareS = S.stat('Share of the model'), sizeS = S.stat('Adapter file (16-bit)');
    var vis = h('div', { class: 'lora-vis' });
    function calc() {
      var M = MODELS[m], d = M[1], L = M[2], I = M[3], r = Math.pow(2, rank.value);
      var mods = { qv: [[d, d], [d, d / 4]], attn: [[d, d], [d, d / 4], [d, d / 4], [d, d]], all: [[d, d], [d, d / 4], [d, d / 4], [d, d], [d, I], [d, I], [I, d]] }[tg];
      var per = mods.reduce(function (s, x) { return s + r * (x[0] + x[1]); }, 0), total = per * L;
      trainS.set(total >= 1e9 ? (total / 1e9).toFixed(2) + 'B' : total >= 1e6 ? (total / 1e6).toFixed(1) + 'M' : S.fmt(total)); shareS.set((100 * total / M[4]).toFixed(2) + '%'); var mb = total * 2 / 1048576; sizeS.set(mb >= 1024 ? (mb / 1024).toFixed(1) + ' GB' : mb.toFixed(0) + ' MB');
      var px = 150, rp = Math.max(2, px * r / d * 6);
      vis.innerHTML = '<svg viewBox="0 0 560 190" role="img" aria-label="A frozen weight matrix beside the two thin LoRA matrices A and B">' +
        '<rect x="20" y="20" width="' + px + '" height="' + px + '" style="fill:color-mix(in srgb,var(--rule) 60%,var(--paper));stroke:var(--ink)"/>' +
        '<text x="95" y="100" text-anchor="middle" style="font-size:14px;font-weight:700">W (frozen)</text><text x="95" y="186" text-anchor="middle" style="font-size:12px;fill:var(--muted)">' + d + ' × ' + d + '</text>' +
        '<text x="205" y="100" text-anchor="middle" style="font-size:22px">+</text>' +
        '<rect x="240" y="20" width="' + rp + '" height="' + px + '" style="fill:var(--w7)"/><text x="' + (248 + rp) + '" y="100" style="font-size:13px;font-weight:700">B</text>' +
        '<text x="' + (290 + rp) + '" y="100" text-anchor="middle" style="font-size:18px">×</text>' +
        '<rect x="' + (320 + rp) + '" y="90" width="' + px + '" height="' + rp + '" style="fill:var(--w7)"/><text x="' + (320 + rp + px / 2) + '" y="' + (84) + '" text-anchor="middle" style="font-size:13px;font-weight:700">A</text>' +
        '<text x="' + (320 + rp + px / 2) + '" y="186" text-anchor="middle" style="font-size:12px;fill:var(--muted)">only A and B train · r = ' + r + '</text></svg>';
    }
    body.append(pickM.el, S.row(rank.el), pickT.el, h('div', { class: 'sim-stats' }, trainS.el, shareS.el, sizeS.el), vis,
      h('p', { class: 'sim-note' }, 'Counts assume grouped-query attention, where k and v are a quarter the size of q. Doubling r doubles the adapter; adding the MLP modules multiplies it several times. Either way it stays a small fraction of the model.'));
    calc();
  });

  /* ---------------- Module 8: tune the ensemble */
  S.register('ensemble', function (body) {
    var TRUE = [89, 249, 39, 599, 129, 22, 329, 65, 149, 279];
    var P = { Specialist: [97, 199, 45, 520, 118, 26, 289, 71, 128, 301], 'Frontier + RAG': [79, 265, 35, 640, 139, 20, 355, 59, 169, 249], 'Neural net': [110, 220, 52, 470, 101, 31, 300, 80, 120, 230] };
    var names = Object.keys(P), sl = {}, outS = {};
    var res = h('div'), ens = S.stat('Ensemble error');
    function mae(pred) { return pred.reduce(function (s, p, i) { return s + Math.abs(p - TRUE[i]); }, 0) / TRUE.length; }
    function ensemble() {
      var w = names.map(function (n) { return sl[n].value; }), tot = w.reduce(function (a, b) { return a + b; }, 0) || 1;
      return TRUE.map(function (_, i) { return names.reduce(function (s, n, j) { return s + P[n][i] * w[j] / tot; }, 0); });
    }
    function calc() {
      var e = mae(ensemble());
      S.bars(res, names.map(function (n) { var x = mae(P[n]); return { label: n + ' alone', value: x, note: '$' + x.toFixed(1), color: 'color-mix(in srgb,var(--w8) 45%,var(--rule))' }; })
        .concat([{ label: 'Ensemble', value: e, note: '$' + e.toFixed(1), color: 'var(--w8)' }]));
      ens.set('$' + e.toFixed(1), e < Math.min.apply(null, names.map(function (n) { return mae(P[n]); })) ? 'good' : '');
    }
    names.forEach(function (n, i) { sl[n] = S.slider({ label: n + ' weight', min: 0, max: 100, value: [40, 40, 20][i], on: calc }); });
    function best() {
      var b = null, be = 1e9;
      for (var a = 0; a <= 100; a += 5) for (var c = 0; c <= 100 - a; c += 5) {
        var w = [a, c, 100 - a - c], tot = 100, pred = TRUE.map(function (_, i) { return names.reduce(function (s, n, j) { return s + P[n][i] * w[j] / tot; }, 0); }), e = mae(pred);
        if (e < be) { be = e; b = w; }
      }
      names.forEach(function (n, j) { sl[n].set(b[j]); }); calc();
    }
    body.append(S.row.apply(null, names.map(function (n) { return sl[n].el; })), S.row(S.button('Search for the best weights', best, true)), res, h('div', { class: 'sim-stats' }, ens.el),
      h('p', { class: 'sim-note' }, 'Errors on ten test items. Models that are wrong in different directions cancel out when averaged. Search the weights here, but choose them on a validation set in practice, or you’re tuning to the test.'));
    calc();
  });

  /* ---------------- Module 9: production cost levers */
  S.register('prod-cost', function (body) {
    var req = S.slider({ label: 'Requests per day', min: 100, max: 100000, step: 100, value: 5000, fmt: S.fmt, on: calc });
    var shared = S.slider({ label: 'Prompt that is the same every time', min: 0, max: 90, step: 5, value: 60, fmt: function (v) { return v + '%'; }, on: calc });
    var cache = S.toggle({ label: 'Prompt caching (cached input at 10% of the price)', on: calc });
    var route = S.toggle({ label: 'Route easy requests (60%) to a small model', on: calc });
    var batch = S.toggle({ label: 'Batch API for the 30% that can wait (50% off)', on: calc });
    var before = S.stat('Monthly cost, no levers'), after = S.stat('Monthly cost, with levers'), save = S.stat('Saving');
    function cost(o) {
      var IN = 3000, OUT = 500, mid = TIERS.mid, small = TIERS.small;
      function one(t) { var inp = IN * (o.cache ? (shared.value / 100) * 0.1 + (1 - shared.value / 100) : 1); return (inp * t[1] + OUT * t[2]) / 1e6; }
      var c = o.route ? 0.6 * one(small) + 0.4 * one(mid) : one(mid);
      if (o.batch) c *= 0.7 + 0.3 * 0.5;
      return c * req.value * 30;
    }
    function calc() {
      var b = cost({}), a = cost({ cache: cache.value, route: route.value, batch: batch.value });
      before.set(S.money(b)); after.set(S.money(a), a < b ? 'good' : ''); save.set(S.pct(1 - a / b));
    }
    body.append(S.row(req.el, shared.el), S.row(cache.el), S.row(route.el), S.row(batch.el), h('div', { class: 'sim-stats' }, before.el, after.el, save.el),
      h('p', { class: 'sim-note' }, 'Example prices: a mid-size model at $1.25 in and $10 out per million tokens, a small one at $0.25 and $2, with 3,000 input and 500 output tokens per request. Routing only saves money if the small model is good enough, so measure it on your evaluation set first.'));
    calc();
  });
})();
