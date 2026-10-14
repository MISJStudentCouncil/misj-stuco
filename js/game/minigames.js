/* ==========================================================================
   BE THE MENTARIAN — MINIGAMES
   Each class is a short game shown in a panel over the world.
   Every function returns a Promise → { pass, bonus, mistakes, quit }.
   ========================================================================== */
(function () {
  'use strict';
  const MG = (window.MG = window.MG || {});
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* shared shell: header, body, leave button, key handler */
  function shell(subject, title, body, onKey) {
    const p = MG.openPanel(`<div class="mg-card"><header class="mg-card__head"><div><span class="micro">${esc(subject)}</span><h3>${esc(title)}</h3></div><button type="button" class="mg-x" aria-label="Leave this activity">✕</button></header><div class="mg-card__body">${body}</div></div>`);
    let quit = null;
    const key = (e) => { if (onKey) onKey(e); };
    document.addEventListener('keydown', key);
    const done = () => { document.removeEventListener('keydown', key); MG.closePanel(); };
    p.querySelector('.mg-x').addEventListener('click', () => quit && quit());
    return { p, $: (s) => p.querySelector(s), $$: (s) => Array.from(p.querySelectorAll(s)), done, onQuit: (fn) => (quit = fn) };
  }
  function result(ui, ok, title, text) {
    return new Promise((res) => {
      ui.$('.mg-card__body').innerHTML = `<div class="mg-result ${ok ? 'is-ok' : 'is-no'}"><p class="mg-result__big">${ok ? '✓' : '↻'}</p><h4>${esc(title)}</h4><p>${esc(text)}</p><button type="button" class="mg-go">Continue →</button></div>`;
      const b = ui.$('.mg-go'); b.focus();
      b.addEventListener('click', () => { ui.done(); res(); });
    });
  }

  /* ---------- MATH: six quick questions, need four ---------- */
  function mathQ() {
    const t = rnd(0, 3);
    let q, a;
    if (t === 0) { const x = rnd(14, 79), y = rnd(11, 48); q = `${x} + ${y}`; a = x + y; }
    else if (t === 1) { const x = rnd(45, 99), y = rnd(12, 39); q = `${x} − ${y}`; a = x - y; }
    else if (t === 2) { const x = rnd(3, 12), y = rnd(3, 9); q = `${x} × ${y}`; a = x * y; }
    else { const pc = [10, 25, 50][rnd(0, 2)], n = [40, 80, 120, 200, 60][rnd(0, 4)]; q = `${pc}% of ${n}`; a = (pc * n) / 100; }
    const opts = new Set([a]);
    while (opts.size < 4) { const d = [1, 2, 3, 10, -1, -2, -10, 5][rnd(0, 7)]; if (a + d > 0) opts.add(a + d); }
    return { q, a, opts: shuffle([...opts]) };
  }
  MG.mini = {};
  MG.mini.math = () => new Promise((res) => {
    const N = 6, NEED = 4, TIME = 12;
    let i = 0, right = 0, t0 = 0, raf = 0, locked = false, cur;
    const ui = shell('Math class · Pak Budi', 'Mental math', `
      <div class="mg-meta"><span class="mg-n"></span><span class="mg-score"></span></div>
      <div class="mg-timer"><i></i></div>
      <p class="mg-q"></p><div class="mg-choices mg-choices--4"></div>
      <p class="mg-hint micro">Keys 1–4 · get ${NEED} of ${N} right</p>`,
      (e) => { const n = +e.key; if (n >= 1 && n <= 4 && !locked) { const b = ui.$$('.mg-choice')[n - 1]; if (b) b.click(); } });
    ui.onQuit(() => { cancelAnimationFrame(raf); ui.done(); res({ quit: true }); });
    const bar = ui.$('.mg-timer i');
    function next() {
      if (i >= N) return finish();
      cur = mathQ(); locked = false;
      ui.$('.mg-n').textContent = `Question ${i + 1} / ${N}`;
      ui.$('.mg-score').textContent = `${right} correct`;
      ui.$('.mg-q').textContent = `${cur.q} = ?`;
      ui.$('.mg-choices').innerHTML = cur.opts.map((o, k) => `<button type="button" class="mg-choice" data-v="${o}"><kbd>${k + 1}</kbd>${o}</button>`).join('');
      ui.$$('.mg-choice').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.v, b)));
      t0 = performance.now(); tick();
    }
    function tick() {
      const k = 1 - (performance.now() - t0) / (TIME * 1000);
      bar.style.transform = `scaleX(${Math.max(0, k)})`;
      if (k <= 0) return answer(null, null);
      raf = requestAnimationFrame(tick);
    }
    async function answer(v, btn) {
      if (locked) return; locked = true; cancelAnimationFrame(raf);
      const ok = v === cur.a; if (ok) right++;
      ui.$$('.mg-choice').forEach((b) => { if (+b.dataset.v === cur.a) b.classList.add('is-right'); });
      if (btn && !ok) btn.classList.add('is-wrong');
      await wait(650); i++; next();
    }
    async function finish() {
      const pass = right >= NEED;
      await result(ui, pass, pass ? `${right} / ${N} — class passed!` : `${right} / ${N} — not quite`, pass ? 'Sharp thinking. Practice makes progress.' : `You need ${NEED} correct. Talk to Pak Budi to try again.`);
      res({ pass, bonus: (right - NEED) * 10 + (right === N ? 10 : 0), mistakes: N - right });
    }
    next();
  });

  /* ---------- SCIENCE: repeat the order the flasks glow ---------- */
  MG.mini.science = () => new Promise((res) => {
    const COLS = ['#3f6dff', '#ffd21f', '#3ecf8e', '#ff6fa8'], NAMES = ['Blue', 'Yellow', 'Green', 'Pink'];
    const LENS = [3, 4, 5, 6], seq = Array.from({ length: 6 }, () => rnd(0, 3));
    let round = 0, pos = 0, input = false, mistakes = 0, alive = true;
    const ui = shell('Science lab · Bu Sari', 'Reaction sequence', `
      <div class="mg-meta"><span class="mg-n"></span><span class="mg-score"></span></div>
      <p class="mg-say">Watch the flasks…</p>
      <div class="mg-flasks">${COLS.map((c, k) => `<button type="button" class="mg-flask" data-k="${k}" style="--c:${c}" aria-label="${NAMES[k]} flask"><span></span><kbd>${k + 1}</kbd></button>`).join('')}</div>
      <p class="mg-hint micro">Keys 1–4 · four rounds, each one longer</p>`,
      (e) => { const n = +e.key; if (n >= 1 && n <= 4) press(n - 1); });
    ui.onQuit(() => { alive = false; ui.done(); res({ quit: true }); });
    const flasks = ui.$$('.mg-flask');
    flasks.forEach((b) => b.addEventListener('click', () => press(+b.dataset.k)));
    const flash = async (k, ms) => { flasks[k].classList.add('is-on'); await wait(ms); flasks[k].classList.remove('is-on'); };
    async function play() {
      input = false; pos = 0;
      ui.$('.mg-n').textContent = `Round ${round + 1} / ${LENS.length}`;
      ui.$('.mg-score').textContent = `${LENS[round]} steps`;
      ui.$('.mg-say').textContent = 'Watch the flasks…';
      await wait(650);
      for (let i = 0; i < LENS[round] && alive; i++) { await flash(seq[i], 460); await wait(170); }
      if (!alive) return;
      ui.$('.mg-say').textContent = 'Your turn — repeat the order.';
      input = true;
    }
    async function press(k) {
      if (!input || !alive) return;
      flash(k, 200);
      if (k !== seq[pos]) { input = false; mistakes++; ui.$('.mg-say').textContent = 'Not quite — watch again carefully.'; ui.$('.mg-flasks').classList.add('shake'); await wait(900); ui.$('.mg-flasks').classList.remove('shake'); return play(); }
      pos++;
      if (pos >= LENS[round]) {
        input = false; round++;
        if (round >= LENS.length) {
          await wait(300);
          await result(ui, true, 'Experiment complete!', mistakes ? `Finished with ${mistakes} retr${mistakes === 1 ? 'y' : 'ies'}. Careful observation wins.` : 'Perfect memory. A true scientist!');
          return res({ pass: true, bonus: Math.max(0, 30 - mistakes * 8), mistakes });
        }
        ui.$('.mg-say').textContent = 'Correct! Next round…'; await wait(500); play();
      }
    }
    play();
  });

  /* ---------- ENGLISH: unscramble the values ---------- */
  const WORDS = [
    ['RESPECT', 'Treating others the way you want to be treated.'],
    ['KINDNESS', 'Being friendly, generous and caring.'],
    ['HONEST', 'Telling the truth, even when it is hard.'],
    ['TEAMWORK', 'Working together toward one goal.'],
    ['CURIOUS', 'Always wanting to learn something new.'],
    ['GRATEFUL', 'Saying thank you and meaning it.']
  ];
  MG.mini.english = () => new Promise((res) => {
    const list = shuffle(WORDS.slice()).slice(0, 4);
    let i = 0, picked = [], tiles = [], mistakes = 0;
    const ui = shell('English · Ms. Clara', 'Word unscramble', `
      <div class="mg-meta"><span class="mg-n"></span><span class="mg-score">Values every Mentarian lives by</span></div>
      <p class="mg-clue"></p><div class="mg-slots"></div><div class="mg-tiles"></div>
      <div class="mg-row"><button type="button" class="mg-ghost" data-a="undo">← Undo</button><button type="button" class="mg-ghost" data-a="clear">Clear</button></div>
      <p class="mg-hint micro">Type the letters or tap the tiles</p>`,
      (e) => {
        if (e.key === 'Backspace') { e.preventDefault(); undo(); return; }
        const ch = e.key.toUpperCase();
        if (/^[A-Z]$/.test(ch)) { const k = tiles.findIndex((t, n) => t === ch && !picked.includes(n)); if (k >= 0) pick(k); }
      });
    ui.onQuit(() => { ui.done(); res({ quit: true }); });
    ui.$('[data-a="undo"]').addEventListener('click', () => undo());
    ui.$('[data-a="clear"]').addEventListener('click', () => { picked = []; draw(); });
    function load() {
      const w = list[i][0];
      do { tiles = shuffle(w.split('')); } while (tiles.join('') === w);
      picked = [];
      ui.$('.mg-n').textContent = `Word ${i + 1} / ${list.length}`;
      ui.$('.mg-clue').textContent = list[i][1];
      draw();
    }
    function draw() {
      const w = list[i][0];
      ui.$('.mg-slots').innerHTML = w.split('').map((_, n) => `<span class="mg-slot">${picked[n] != null ? tiles[picked[n]] : ''}</span>`).join('');
      ui.$('.mg-tiles').innerHTML = tiles.map((t, n) => `<button type="button" class="mg-tile" data-n="${n}" ${picked.includes(n) ? 'disabled' : ''}>${t}</button>`).join('');
      ui.$$('.mg-tile').forEach((b) => b.addEventListener('click', () => pick(+b.dataset.n)));
    }
    function undo() { picked.pop(); draw(); }
    async function pick(n) {
      if (picked.includes(n)) return;
      picked.push(n); draw();
      const w = list[i][0];
      if (picked.length < w.length) return;
      const guess = picked.map((k) => tiles[k]).join('');
      if (guess === w) {
        ui.$('.mg-slots').classList.add('is-ok'); await wait(650); ui.$('.mg-slots').classList.remove('is-ok');
        i++;
        if (i >= list.length) {
          await result(ui, true, 'Lesson complete!', 'Respect, kindness, honesty — words that turn into actions.');
          return res({ pass: true, bonus: Math.max(0, 30 - mistakes * 6), mistakes });
        }
        load();
      } else {
        mistakes++; ui.$('.mg-slots').classList.add('shake'); await wait(500); ui.$('.mg-slots').classList.remove('shake'); picked = []; draw();
      }
    }
    load();
  });

  /* ---------- ART: copy the pattern ---------- */
  MG.mini.art = () => new Promise((res) => {
    const PAL = ['#f4f1ea', '#1a47d6', '#ffd21f', '#071542'], N = 5;
    let round = 0, color = 1, target = [], grid = [], mistakes = 0, painting = false;
    const ui = shell('Art studio · Pak Yosef', 'Copy the pattern', `
      <div class="mg-meta"><span class="mg-n"></span><span class="mg-score">Look carefully — then paint</span></div>
      <div class="mg-art"><div><p class="micro">Pak Yosef's pattern</p><div class="mg-grid mg-grid--target"></div></div><div><p class="micro">Your canvas</p><div class="mg-grid mg-grid--mine"></div></div></div>
      <div class="mg-row mg-pal">${PAL.map((c, k) => `<button type="button" class="mg-sw" data-c="${k}" style="--c:${c}" aria-label="Colour ${k + 1}"><kbd>${k + 1}</kbd></button>`).join('')}<button type="button" class="mg-go mg-check">Check ✓</button></div>
      <p class="mg-say"></p>`,
      (e) => { const n = +e.key; if (n >= 1 && n <= 4) setColor(n - 1); });
    ui.onQuit(() => { ui.done(); res({ quit: true }); });
    const setColor = (k) => { color = k; ui.$$('.mg-sw').forEach((b) => b.classList.toggle('is-on', +b.dataset.c === k)); };
    ui.$$('.mg-sw').forEach((b) => b.addEventListener('click', () => setColor(+b.dataset.c)));
    window.addEventListener('pointerup', () => (painting = false));
    function make() {
      target = []; const used = [1, 2, 3];
      for (let y = 0; y < N; y++) for (let x = 0; x < 3; x++) { const c = Math.random() < 0.42 ? 0 : used[rnd(0, round === 0 ? 1 : 2)]; target[y * N + x] = c; target[y * N + (N - 1 - x)] = c; }
      grid = Array(N * N).fill(0);
      ui.$('.mg-n').textContent = `Pattern ${round + 1} / 2`;
      ui.$('.mg-say').textContent = '';
      ui.$('.mg-grid--target').innerHTML = target.map((c) => `<span style="--c:${PAL[c]}"></span>`).join('');
      drawMine();
    }
    function drawMine() {
      ui.$('.mg-grid--mine').innerHTML = grid.map((c, n) => `<button type="button" data-n="${n}" style="--c:${PAL[c]}" aria-label="Cell ${n + 1}"></button>`).join('');
      ui.$$('.mg-grid--mine button').forEach((b) => {
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); painting = true; paint(+b.dataset.n); });
        b.addEventListener('pointerenter', () => { if (painting) paint(+b.dataset.n); });
        b.addEventListener('click', (e) => { if (e.detail === 0) paint(+b.dataset.n); });
      });
    }
    function paint(n) { grid[n] = color; const b = ui.$(`.mg-grid--mine [data-n="${n}"]`); if (b) b.style.setProperty('--c', PAL[color]); }
    ui.$('.mg-check').addEventListener('click', async () => {
      const wrong = grid.map((c, n) => (c !== target[n] ? n : -1)).filter((n) => n >= 0);
      if (wrong.length) {
        mistakes++;
        ui.$('.mg-say').textContent = `${wrong.length} cell${wrong.length > 1 ? 's' : ''} don't match yet — they're flashing.`;
        wrong.forEach((n) => ui.$(`.mg-grid--mine [data-n="${n}"]`).classList.add('is-wrong'));
        await wait(900);
        ui.$$('.mg-grid--mine .is-wrong').forEach((b) => b.classList.remove('is-wrong'));
        return;
      }
      round++;
      if (round >= 2) {
        await result(ui, true, 'Masterpiece!', 'Great artists see the details others miss.');
        return res({ pass: true, bonus: Math.max(0, 30 - mistakes * 8), mistakes });
      }
      ui.$('.mg-say').textContent = 'Perfect copy! One more…'; await wait(600); make();
    });
    setColor(1); make();
  });

  /* ---------- SORTING: put each piece of litter in the right bin ---------- */
  const BINS = [
    { type: 'plastic', label: 'Recycling', sub: 'plastic & cans', c: '#2a6bd1' },
    { type: 'paper', label: 'Paper', sub: 'paper & card', c: '#ffd21f' },
    { type: 'food', label: 'Food waste', sub: 'for compost', c: '#3e9e57' }
  ];
  const HINT = { plastic: 'Plastic goes in the blue recycling bin.', paper: 'Paper goes in the yellow paper bin.', food: 'Food scraps go in the green bin — they become compost!' };
  MG.mini.sort = (items) => new Promise((res) => {
    let i = 0, first = true;
    const done = [];
    const ui = shell('Clean campus · Pak Asep', 'Sort the litter', `
      <div class="mg-meta"><span class="mg-n"></span><span class="mg-score">Choose the right bin</span></div>
      <div class="mg-item"><canvas width="16" height="16"></canvas><strong></strong></div>
      <div class="mg-choices mg-bins">${BINS.map((b, k) => `<button type="button" class="mg-choice mg-bin" data-t="${b.type}" style="--c:${b.c}"><kbd>${k + 1}</kbd><b>${b.label}</b><small>${b.sub}</small></button>`).join('')}</div>
      <p class="mg-say"></p>`,
      (e) => { const n = +e.key; if (n >= 1 && n <= 3) ui.$$('.mg-bin')[n - 1].click(); });
    ui.onQuit(() => { ui.done(); res({ done }); });
    ui.$$('.mg-bin').forEach((b) => b.addEventListener('click', () => choose(b.dataset.t, b)));
    function show() {
      const it = items[i];
      ui.$('.mg-n').textContent = `Item ${i + 1} / ${items.length}`;
      ui.$('.mg-item strong').textContent = it.name;
      ui.$('.mg-say').textContent = '';
      const cv = ui.$('.mg-item canvas'), g = cv.getContext('2d');
      g.clearRect(0, 0, 16, 16); MG.drawItem(g, 'litter-' + it.type, 0, 0, 0, {});
      first = true;
    }
    async function choose(t, b) {
      const it = items[i];
      if (t !== it.type) { first = false; b.classList.add('is-wrong'); ui.$('.mg-say').textContent = HINT[it.type]; await wait(500); b.classList.remove('is-wrong'); return; }
      b.classList.add('is-right'); done.push({ i: it.i, first });
      await wait(420); b.classList.remove('is-right');
      i++;
      if (i >= items.length) {
        const good = done.filter((d) => d.first).length;
        await result(ui, true, `${items.length} item${items.length > 1 ? 's' : ''} sorted`, `${good} sorted right first time. Small actions, bigger change.`);
        return res({ done });
      }
      show();
    }
    show();
  });
})();
