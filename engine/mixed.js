/* Mixed review: draws quiz questions from many modules, weighted toward ones missed before
   or not seen for a while, shuffles them and their options, and records each result.
   Shared by the course pages (checkpoints at the end of each section) and the Review page.

   A question: {id, p: prompt html, o: [option html], k: correct index, w: explanation html, ...}
   A log entry, per question id: {t: day last answered, r: [1, 0, ...] last five results, newest last} */
(function () {
  var DAY = 86400000;
  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function weight(e, now) {
    if (!e || !e.r || !e.r.length) return 3;           // never answered
    if (e.r[e.r.length - 1] === 0) return 6;           // missed last time
    var age = now - e.t;
    if (age < 1) return 0.2;                           // answered right today
    return 1 + Math.min(age / 7, 3);                   // the longer ago, the likelier
  }
  /* pick n questions; at most `per` from any one group (a module) */
  function pick(pool, n, logOf, per) {
    per = per || 2;
    var now = today(), out = [], used = {}, rest = [];
    var cands = pool.map(function (q) { return { q: q, w: weight(logOf(q), now) }; });
    while (out.length < n && cands.length) {
      var total = 0, i = 0;
      cands.forEach(function (c) { total += c.w; });
      var x = Math.random() * total;
      for (; i < cands.length - 1; i++) { x -= cands[i].w; if (x <= 0) break; }
      var c = cands.splice(i, 1)[0], g = c.q.group || c.q.mid;
      if ((used[g] || 0) >= per) { rest.push(c.q); continue; }
      used[g] = (used[g] || 0) + 1; out.push(c.q);
    }
    while (out.length < n && rest.length) out.push(rest.shift());   // small pools: relax the cap
    return shuffle(out);
  }
  function record(log, id, ok) {
    var e = log[id] || { t: 0, r: [] };
    e.t = today(); e.r.push(ok ? 1 : 0); if (e.r.length > 5) e.r.shift();
    log[id] = e; return log;
  }
  /* render questions into box. opts.source(q) -> html naming where it came from; opts.onAnswer(q, ok, right, answered, total) */
  function render(box, qs, opts) {
    box.innerHTML = '';
    var right = 0, answered = 0;
    qs.forEach(function (q, n) {
      var order = shuffle(q.o.map(function (_, i) { return i; }));
      var el = document.createElement('div');
      el.className = 'q mx-q';
      if (q.color) el.style.setProperty('--src', q.color);
      el.innerHTML = '<p class="mx-num">' + (n + 1) + ' of ' + qs.length + '</p><p class="q-prompt">' + q.p + '</p><ol>' +
        order.map(function (i) { return '<li><button type="button">' + q.o[i] + '</button></li>'; }).join('') +
        '</ol><div class="q-why" aria-live="polite"></div>';
      var btns = el.querySelectorAll('ol button'), why = el.querySelector('.q-why');
      Array.prototype.forEach.call(btns, function (b, pos) {
        b.addEventListener('click', function () {
          if (el.dataset.answered) return;
          var ok = order[pos] === q.k;
          el.dataset.answered = ok ? 'right' : 'wrong';
          b.classList.add(ok ? 'right' : 'wrong');
          btns[order.indexOf(q.k)].classList.add('right');
          Array.prototype.forEach.call(btns, function (x) { x.setAttribute('aria-disabled', 'true'); });
          why.innerHTML = '<b>' + (ok ? 'Correct. ' : 'Not quite. ') + '</b>' + q.w +
            (opts.source ? '<span class="mx-src">' + opts.source(q) + '</span>' : '');
          why.classList.add('shown'); el.classList.add('mx-done');
          answered++; if (ok) right++;
          if (opts.onAnswer) opts.onAnswer(q, ok, right, answered, qs.length);
        });
      });
      box.appendChild(el);
    });
  }
  window.Mixed = { today: today, pick: pick, record: record, render: render, shuffle: shuffle, weight: weight };
})();
