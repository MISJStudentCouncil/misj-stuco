/* ==========================================================================
   BE THE MENTARIAN — ENGINE
   Game loop, grid movement, camera, dialog, HUD, journal, saving,
   touch controls, and the attract-mode preview on the page.
   ========================================================================== */
(function () {
  'use strict';
  const MG = window.MG, SC = window.SC || {};
  const T = MG.T, K = MG.K, SAVE = 'mentarian-save-v1';
  const VEC = [[0, 1], [-1, 0], [1, 0], [0, -1]], OPP = [3, 2, 1, 0];
  const DIRK = { ArrowDown: 0, KeyS: 0, ArrowLeft: 1, KeyA: 1, ArrowRight: 2, KeyD: 2, ArrowUp: 3, KeyW: 3 };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  let root, cv, ctx, vw = 0, vh = 0, raf = 0, last = 0;
  let running = false, paused = false, panelOpen = false;
  let held = [], padDir = -1, run = false, padRun = false, hudT = 0, saveT = 0, curArea = '', locT = 0;
  let parts = [];
  const ui = {};
  MG.ents = [];
  MG.ent = (id) => MG.ents.find((e) => e.id === id && !e.hidden) || null;

  /* ---------- saving ---------- */
  const load = () => { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && s.v === 1 ? s : null; } catch (e) { return null; } };
  MG.save = () => {
    if (!MG.S || !MG.player) return;
    Object.assign(MG.S, { x: MG.player.x, y: MG.player.y, dir: MG.player.dir });
    try {
      if (MG.S.done) localStorage.removeItem(SAVE);   // a finished game starts fresh next time
      else localStorage.setItem(SAVE, JSON.stringify(MG.S));
    } catch (e) { /* storage unavailable: play on without saving */ }
  };

  /* ---------- DOM ---------- */
  function setup() {
    root = document.createElement('div');
    root.className = 'mg' + (SC.fine === false ? ' is-touch' : '');
    root.id = 'mentarian'; root.hidden = true; root.tabIndex = -1;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Be The Mentarian — game');
    root.innerHTML = `
      <canvas class="mg-canvas" aria-hidden="true"></canvas>
      <div class="mg-hud">
        <div class="mg-obj" aria-live="polite"><span class="micro">Objective · <b class="mg-obj__n"></b></span><strong class="mg-obj__t"></strong><small class="mg-obj__p"></small></div>
        <div class="mg-top">
          <span class="mg-chip mg-mp">★ <b>0</b> MP</span>
          <span class="mg-chip mg-clock">00:00</span>
          <button type="button" class="mg-chip mg-btn" data-act="journal">Journal <kbd>J</kbd></button>
          <button type="button" class="mg-chip mg-btn" data-act="pause">Pause <kbd>Esc</kbd></button>
        </div>
      </div>
      <div class="mg-pe" hidden></div>
      <p class="mg-loc" aria-live="polite"></p>
      <div class="mg-toasts" aria-live="polite"></div>
      <div class="mg-dialog" hidden><span class="mg-dialog__who"></span><p class="mg-dialog__text"></p><div class="mg-dialog__choices"></div><span class="mg-dialog__next" aria-hidden="true">▼</span></div>
      <div class="mg-panel" hidden></div>
      <div class="mg-pad" aria-hidden="true">
        <div class="mg-dpad"><button type="button" data-d="3">▲</button><button type="button" data-d="1">◀</button><button type="button" data-d="2">▶</button><button type="button" data-d="0">▼</button></div>
        <div class="mg-ab"><button type="button" data-k="b">B<small>run</small></button><button type="button" data-k="a">A<small>talk</small></button></div>
      </div>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    Object.assign(ui, {
      obj: q('.mg-obj__t'), objP: q('.mg-obj__p'), objN: q('.mg-obj__n'), mp: q('.mg-mp b'), clock: q('.mg-clock'), pe: q('.mg-pe'),
      loc: q('.mg-loc'), toasts: q('.mg-toasts'), dialog: q('.mg-dialog'), who: q('.mg-dialog__who'), text: q('.mg-dialog__text'),
      choices: q('.mg-dialog__choices'), panel: q('.mg-panel')
    });
    cv = q('.mg-canvas'); ctx = cv.getContext('2d');

    q('[data-act="journal"]').addEventListener('click', () => !panelOpen && openJournal());
    q('[data-act="pause"]').addEventListener('click', () => !panelOpen && openPause());
    ui.dialog.addEventListener('click', (e) => { if (!e.target.closest('button')) advance(); });
    root.querySelectorAll('.mg-dpad button').forEach((b) => {
      const d = +b.dataset.d;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); padDir = d; b.setPointerCapture(e.pointerId); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => b.addEventListener(ev, () => { if (padDir === d) padDir = -1; }));
    });
    const A = q('[data-k="a"]'), B = q('[data-k="b"]');
    A.addEventListener('pointerdown', (e) => { e.preventDefault(); if (panelOpen) return; dlg ? advance() : interact(); });
    B.addEventListener('pointerdown', (e) => { e.preventDefault(); padRun = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => B.addEventListener(ev, () => (padRun = false)));

    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', (e) => {
      if (e.code in DIRK) held = held.filter((d) => d !== DIRK[e.code]);
      if (e.key === 'Shift') run = false;
    });
    window.addEventListener('blur', () => { held = []; run = false; padDir = -1; });
    window.addEventListener('resize', () => running && resize());
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const s = Math.max(2, Math.min(4, Math.round(Math.min(w / 430, h / 280))));
    vw = Math.ceil(w / s); vh = Math.ceil(h / s);
    cv.width = vw; cv.height = vh;
    cv.style.width = vw * s + 'px'; cv.style.height = vh * s + 'px';
    ctx.imageSmoothingEnabled = false;
  }

  /* ---------- panels (minigames, journal, pause) ---------- */
  MG.openPanel = (html, kind = 'game') => {
    ui.panel.innerHTML = html; ui.panel.hidden = false; ui.panel.dataset.kind = kind;
    panelOpen = true; held = [];
    const f = ui.panel.querySelector('input, .mg-go, button'); if (f) setTimeout(() => f.focus(), 30);
    return ui.panel;
  };
  MG.closePanel = () => { ui.panel.hidden = true; ui.panel.innerHTML = ''; panelOpen = false; paused = false; root.focus({ preventScroll: true }); };

  /* ---------- dialog ---------- */
  let dlg = null;
  const dq = [];
  MG.say = (lines, who) => new Promise((res) => push({ arr: [].concat(lines).map((l) => (typeof l === 'string' ? { who: who || '', text: l } : l)), res }));
  MG.ask = (who, text, options) => new Promise((res) => push({ arr: [{ who, text, options }], res }));
  function push(d) { dq.push(d); if (!dlg) next(); }
  function next() { dlg = dq.shift() || null; if (!dlg) { ui.dialog.hidden = true; return; } dlg.i = 0; show(); }
  function show() {
    const L = dlg.arr[dlg.i];
    ui.dialog.hidden = false; ui.dialog.classList.remove('is-full', 'has-choices');
    ui.who.textContent = L.who || ''; ui.who.hidden = !L.who;
    ui.text.textContent = ''; ui.choices.innerHTML = '';
    dlg.c = 0; dlg.full = false;
  }
  function typeTick(dt) {
    if (!dlg || dlg.full) return;
    const L = dlg.arr[dlg.i];
    dlg.c += dt * 52;
    const n = Math.min(L.text.length, Math.floor(dlg.c));
    ui.text.textContent = L.text.slice(0, n);
    if (n >= L.text.length) finish();
  }
  function finish() {
    const L = dlg.arr[dlg.i];
    dlg.full = true; ui.text.textContent = L.text; ui.dialog.classList.add('is-full');
    if (L.options) {
      ui.dialog.classList.add('has-choices');
      ui.choices.innerHTML = L.options.map((o, k) => `<button type="button" data-k="${k}">${esc(o)}</button>`).join('');
      ui.choices.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { const d = dlg; ui.dialog.hidden = true; next(); d.res(+b.dataset.k); }));
      ui.choices.querySelector('button').focus();
    }
  }
  function advance() {
    if (!dlg) return;
    if (!dlg.full) return finish();
    if (dlg.arr[dlg.i].options) return;
    dlg.i++;
    if (dlg.i >= dlg.arr.length) { const d = dlg; next(); d.res(); } else show();
  }

  /* ---------- feedback ---------- */
  MG.toast = (text) => {
    const t = document.createElement('p'); t.className = 'mg-toast'; t.textContent = text;
    ui.toasts.appendChild(t);
    while (ui.toasts.children.length > 4) ui.toasts.firstChild.remove();
    setTimeout(() => t.classList.add('out'), 2300); setTimeout(() => t.remove(), 2800);
  };
  MG.addMP = (n, label) => { MG.S.mp += n; MG.toast(`+${n} MP · ${label}`); ui.mp.parentNode.classList.remove('pulse'); void ui.mp.offsetWidth; ui.mp.parentNode.classList.add('pulse'); };
  MG.burst = (x, y, color, n = 14) => {
    for (let i = 0; i < n; i++) parts.push({ x: x * T + 8, y: y * T + 8, vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 70, life: 0.7, c: color });
  };

  /* ---------- input ---------- */
  function onKey(e) {
    if (!running) return;
    if (e.code === 'Escape') {
      e.preventDefault();
      if (panelOpen) { if (ui.panel.dataset.kind === 'menu') MG.closePanel(); return; }
      return openPause();
    }
    if (panelOpen) return;                 // minigames and menus handle their own keys
    if (e.repeat && !(e.code in DIRK)) return;
    if (e.code === 'KeyJ') { e.preventDefault(); return openJournal(); }
    if (dlg) {
      const L = dlg.arr[dlg.i];
      if (dlg.full && L.options) {
        const bs = Array.from(ui.choices.querySelectorAll('button')), k = bs.indexOf(document.activeElement);
        if (['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA'].includes(e.code)) { e.preventDefault(); (bs[k - 1] || bs[bs.length - 1]).focus(); }
        if (['ArrowDown', 'ArrowRight', 'KeyS', 'KeyD'].includes(e.code)) { e.preventDefault(); (bs[k + 1] || bs[0]).focus(); }
        if (e.code === 'KeyE' && k >= 0) bs[k].click();
        return;
      }
      if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); advance(); }
      if (e.code in DIRK) e.preventDefault();
      return;
    }
    if (e.code in DIRK) { e.preventDefault(); const d = DIRK[e.code]; held = held.filter((x) => x !== d); held.push(d); return; }
    if (e.key === 'Shift') { run = true; return; }
    if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); interact(); }
  }

  /* ---------- world ---------- */
  const solidAt = (x, y, self) => MG.ents.some((e) => e !== self && !e.hidden && e.solid && ((e.x === x && e.y === y) || (e.moving && e.tx === x && e.ty === y)));
  const playerAt = (x, y) => { const P = MG.player; return (P.x === x && P.y === y) || (P.tx === x && P.ty === y); };
  const entAt = (x, y) => MG.ents.find((e) => !e.hidden && e.interact && e.x === x && e.y === y);

  const FLAVOR = {
    [K.SHELF]: 'Rows and rows of books. A Mentarian never stops learning.',
    [K.BOARD]: (x, y) => ({ 'StuCo Hall': 'The banner reads: STUDENTS → IDEAS → ACTION → IMPACT.', 'Art Studio': 'Pinned up: paintings from last semester. One of them is of the canteen cat.' }[MG.areaAt(x, y)] || 'Written on the board: "Respect · Responsibility · Kindness."'),
    [K.WATER]: 'The water sparkles in the sunshine.',
    [K.POLE]: 'The Merah Putih waves proudly in the breeze.',
    [K.DESK]: 'A tidy desk with the chair pushed in. Respect for the next class.',
    [K.LAB]: 'Beakers and flasks, every one neatly labelled. Safety first!',
    [K.EASEL]: 'A half-finished painting of the MISJ courtyard.',
    [K.TREE]: 'A big shady tree. Perfect for reading at lunchtime.',
    [K.BENCH]: 'A clean bench. Somebody always tidies up here — nice.',
    [K.COUNTER]: (x, y) => (MG.areaAt(x, y) === 'Canteen' ? "Today's menu: nasi goreng, soto ayam and fresh fruit." : 'The returns desk. "Please return books on time."'),
    [K.TABLE]: 'A clean table. Everyone wiped up after themselves.',
    [K.FENCE]: 'The school fence. The whole world is out there — but today, school comes first.'
  };
  function interact() {
    const P = MG.player;
    if (P.moving || dlg || panelOpen) return;
    const [dx, dy] = VEC[P.dir];
    let x = P.x + dx, y = P.y + dy, e = entAt(x, y);
    if (!e && MG.tile(x, y) === K.COUNTER) e = entAt(x + dx, y + dy);
    if (e) { if (e.kind === 'npc') { e.dir = OPP[P.dir]; e.moving = false; e.t = 0; e.tx = e.x; e.ty = e.y; } e.interact(e); return; }
    const f = FLAVOR[MG.tile(x, y)];
    if (f) MG.say({ who: '', text: typeof f === 'function' ? f(x, y) : f });
  }

  function arrive() {
    const P = MG.player;
    MG.ents.filter((e) => !e.hidden && e.pickup && e.x === P.x && e.y === P.y).forEach((e) => e.pickup(e));
    const a = MG.areaAt(P.x, P.y);
    if (a && a !== curArea) { curArea = a; ui.loc.textContent = a; ui.loc.classList.add('on'); locT = 2; }
  }

  function updatePlayer(dt) {
    const P = MG.player;
    if (P.moving) {
      P.t += dt / P.dur; P.anim += dt;
      if (P.t >= 1) { P.x = P.tx; P.y = P.ty; P.moving = false; P.t = 0; arrive(); }
    }
    if (!P.moving && !dlg && !panelOpen) {
      const d = held.length ? held[held.length - 1] : padDir;
      if (d >= 0) {
        P.dir = d;
        const nx = P.x + VEC[d][0], ny = P.y + VEC[d][1];
        if (!MG.solid(nx, ny) && !solidAt(nx, ny, P)) { P.tx = nx; P.ty = ny; P.moving = true; P.t = 0; P.dur = run || padRun ? 0.095 : 0.165; }
      }
    }
    if (!P.moving) P.anim = 0;
  }
  function updateNPCs(dt) {
    MG.ents.forEach((e) => {
      if (e.kind !== 'npc') return;
      if (e.moving) { e.t += dt / 0.34; if (e.t >= 1) { e.x = e.tx; e.y = e.ty; e.moving = false; e.t = 0; } return; }
      if (!e.wander || dlg || panelOpen) return;
      e.wt = (e.wt == null ? Math.random() * 2 : e.wt) - dt;
      if (e.wt > 0) return;
      e.wt = 1.2 + Math.random() * 2.8;
      const d = Math.floor(Math.random() * 4), nx = e.x + VEC[d][0], ny = e.y + VEC[d][1], [x0, y0, x1, y1] = e.wander;
      e.dir = d;
      if (nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1 && !MG.solid(nx, ny) && !solidAt(nx, ny, e) && !playerAt(nx, ny)) { e.tx = nx; e.ty = ny; e.moving = true; e.t = 0; }
    });
  }
  const pos = (e) => { const k = e.moving ? Math.min(1, e.t) : 0; return [(e.x + (e.tx - e.x) * k) * T, (e.y + (e.ty - e.y) * k) * T]; };

  /* ---------- drawing ---------- */
  function drawChar(g, e, sx, sy, now) {
    const f = e.moving ? [1, 0, 2, 0][Math.floor((e.anim || now / 1000) * 8) % 4] : 0;
    g.drawImage(MG.sheet(e.look), f * 16, e.dir * 16, 16, 16, Math.round(sx), Math.round(sy) - 3, 16, 16);
  }
  function drawMarker(g, sx, sy, now) {
    const b = Math.round(Math.sin(now / 200) * 1.5), x = Math.round(sx) + 4, y = Math.round(sy) - 15 + b;
    g.fillStyle = '#071542'; g.fillRect(x - 1, y - 1, 9, 11);
    g.fillStyle = '#ffd21f'; g.fillRect(x, y, 7, 9);
    g.fillStyle = '#071542'; g.fillRect(x + 3, y + 1, 1, 5); g.fillRect(x + 3, y + 7, 1, 1);
  }
  function drawArrow(g, tx, ty, now) {
    const pad = 16;
    if (tx > pad && tx < vw - pad && ty > pad + 6 && ty < vh - pad) {
      const b = Math.round(Math.sin(now / 180) * 2), x = Math.round(tx), y = Math.round(ty) - 22 + b;
      g.fillStyle = '#071542'; g.beginPath(); g.moveTo(x - 5, y - 1); g.lineTo(x + 5, y - 1); g.lineTo(x, y + 6); g.fill();
      g.fillStyle = '#ffd21f'; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.lineTo(x, y + 4); g.fill();
      return;
    }
    const cx = vw / 2, cy = vh / 2, dx = tx - cx, dy = ty - cy;
    const k = Math.min((vw / 2 - pad) / Math.abs(dx || 1e-3), (vh / 2 - pad) / Math.abs(dy || 1e-3));
    const ax = cx + dx * k, ay = cy + dy * k, a = Math.atan2(dy, dx);
    g.save(); g.translate(ax, ay); g.rotate(a);
    g.fillStyle = '#071542'; g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.fill();
    g.fillStyle = '#ffd21f'; g.beginPath(); g.moveTo(7, 0); g.lineTo(-4, -5); g.lineTo(-4, 5); g.fill();
    g.restore();
  }

  function render(now) {
    const P = MG.player, [ppx, ppy] = pos(P), mw = MG.W * T, mh = MG.H * T;
    let cx = Math.round(ppx + 8 - vw / 2), cy = Math.round(ppy + 8 - vh / 2);
    cx = mw <= vw ? Math.round((mw - vw) / 2) : Math.max(0, Math.min(mw - vw, cx));
    cy = mh <= vh ? Math.round((mh - vh) / 2) : Math.max(0, Math.min(mh - vh, cy));
    ctx.fillStyle = '#2f6b3a'; ctx.fillRect(0, 0, vw, vh);
    ctx.drawImage(MG.mapCanvas, -cx, -cy);

    const list = MG.ents.filter((e) => !e.hidden).map((e) => { const [x, y] = e.kind === 'npc' ? pos(e) : [e.x * T, e.y * T]; return { e, x, y }; });
    list.push({ e: P, x: ppx, y: ppy });
    list.sort((a, b) => a.y - b.y);
    for (const { e, x, y } of list) {
      const sx = x - cx, sy = y - cy;
      if (sx < -24 || sy < -32 || sx > vw + 24 || sy > vh + 24) continue;
      if (e.kind === 'npc' || e === P) drawChar(ctx, e, sx, sy, now);
      else { MG.drawItem(ctx, e.type, sx, sy, now, e); if (e.pickup) MG.drawSparkle(ctx, sx, sy, now); }
    }
    for (const { e, x, y } of list) if (e.marker && e.marker()) drawMarker(ctx, x - cx, y - cy, now);
    parts.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life / 0.7); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 2, 2); });
    ctx.globalAlpha = 1;
    const s = MG.suggested(), t = s && s.target && s.target();
    if (t && !dlg && !panelOpen) {
      const [tx, ty] = t.kind === 'npc' ? pos(t) : [t.x * T, t.y * T];
      if (!(t.marker && t.marker())) drawArrow(ctx, tx + 8 - cx, ty + 8 - cy, now);
      else if (tx + 8 - cx < 0 || tx - cx > vw || ty - cy < 0 || ty - cy > vh) drawArrow(ctx, tx + 8 - cx, ty + 8 - cy, now);
    }
  }

  function hud() {
    const S = MG.S, s = MG.suggested(), all = MG.tasks(), d = all.filter((x) => x.done).length;
    ui.objN.textContent = `${d} / ${all.length} done`;
    ui.obj.textContent = s ? s.label : 'Journal complete!';
    ui.objP.textContent = s && s.of ? `${s.n} / ${s.of}` : s && s.id === 'sort' ? `${S.carry.length} carried` : '';
    ui.mp.textContent = S.mp;
    ui.clock.textContent = mmss(S.time);
    ui.pe.hidden = !MG.pe.active;
    if (MG.pe.active) ui.pe.textContent = `PE · ${Math.ceil(MG.pe.t)}s · flags ${MG.pe.got.length} / 5`;
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused) {
      MG.S.time += dt;
      typeTick(dt); updatePlayer(dt); updateNPCs(dt);
      if (!dlg && !panelOpen) MG.questTick(dt);
      parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.life -= dt; });
      parts = parts.filter((p) => p.life > 0);
      if ((locT -= dt) <= 0 && curArea) ui.loc.classList.remove('on');
      if ((saveT -= dt) <= 0) { saveT = 15; MG.save(); }
    }
    if ((hudT -= dt) <= 0) { hudT = 0.2; hud(); }
    render(now);
  }

  /* ---------- journal & pause ---------- */
  function openJournal() {
    if (dlg) return;
    const all = MG.tasks(), d = all.filter((x) => x.done).length, s = MG.suggested();
    const p = MG.openPanel(`<div class="mg-card mg-journal"><header class="mg-card__head"><div><span class="micro">Mentarian Journal · ${esc(MG.S.name)}</span><h3>${d} of ${all.length} tasks</h3></div><button type="button" class="mg-x" aria-label="Close journal">✕</button></header>
      <div class="mg-card__body mg-journal__body">
        <ol class="mg-tasks">${all.map((t) => `<li class="${t.done ? 'is-done' : ''}${s && s.id === t.id ? ' is-next' : ''}"><span class="mg-check">${t.done ? '✓' : ''}</span><span>${esc(t.label)}</span>${t.of ? `<em>${t.n} / ${t.of}</em>` : ''}</li>`).join('')}</ol>
        <div class="mg-map"><canvas width="${MG.W * 3}" height="${MG.H * 3}" aria-label="Campus map"></canvas><p class="micro"><i class="dot dot--you"></i>You <i class="dot dot--goal"></i>Next task</p></div>
      </div></div>`, 'menu');
    const g = p.querySelector('.mg-map canvas').getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(MG.mapCanvas, 0, 0, MG.W * 3, MG.H * 3);
    const t = s && s.target && s.target();
    if (t) { g.fillStyle = '#ff6fa8'; g.fillRect(t.x * 3 - 2, t.y * 3 - 2, 7, 7); }
    g.fillStyle = '#071542'; g.fillRect(MG.player.x * 3 - 3, MG.player.y * 3 - 3, 9, 9);
    g.fillStyle = '#ffd21f'; g.fillRect(MG.player.x * 3 - 2, MG.player.y * 3 - 2, 7, 7);
    p.querySelector('.mg-x').addEventListener('click', MG.closePanel);
  }
  function openPause() {
    if (dlg) return;
    paused = true; held = [];
    const p = MG.openPanel(`<div class="mg-card mg-pause"><header class="mg-card__head"><div><span class="micro">Paused · ${mmss(MG.S.time)}</span><h3>Be The Mentarian</h3></div></header>
      <div class="mg-card__body">
        <div class="mg-menu"><button type="button" class="mg-go" data-a="resume">Resume</button><button type="button" class="mg-ghost" data-a="journal">Journal</button><button type="button" class="mg-ghost" data-a="exit">Save &amp; exit</button></div>
        <dl class="mg-keys"><div><dt>Move</dt><dd>WASD / arrow keys · D-pad</dd></div><div><dt>Talk / interact</dt><dd>E · Space · Enter · A</dd></div><div><dt>Run</dt><dd>Hold Shift · hold B</dd></div><div><dt>Journal</dt><dd>J</dd></div></dl>
      </div></div>`, 'menu');
    p.querySelector('[data-a="resume"]').addEventListener('click', MG.closePanel);
    p.querySelector('[data-a="journal"]').addEventListener('click', () => { MG.closePanel(); openJournal(); });
    p.querySelector('[data-a="exit"]').addEventListener('click', () => { MG.closePanel(); MG.close(); });
  }

  /* ---------- new game: name + look ---------- */
  function chooseHero() {
    return new Promise((res) => {
      let look = 0;
      const p = MG.openPanel(`<div class="mg-card mg-hero"><header class="mg-card__head"><div><span class="micro">New game · Be The Mentarian</span><h3>Who are you?</h3></div></header>
        <div class="mg-card__body">
          <label class="mg-field"><span class="micro">Your name</span><input type="text" maxlength="14" placeholder="Type your name" autocomplete="off" spellcheck="false"></label>
          <p class="micro mg-field-label">Choose your look</p>
          <div class="mg-looks">${MG.PLAYER_LOOKS.map((_, k) => `<button type="button" class="mg-look" data-k="${k}" aria-label="Look ${k + 1}"><canvas width="16" height="16"></canvas></button>`).join('')}</div>
          <button type="button" class="mg-go mg-start">Start the day →</button>
        </div></div>`, 'game');
      p.querySelectorAll('.mg-look').forEach((b) => {
        const k = +b.dataset.k, g = b.querySelector('canvas').getContext('2d');
        g.drawImage(MG.sheet(MG.PLAYER_LOOKS[k]), 0, 0, 16, 16, 0, 0, 16, 16);
        b.addEventListener('click', () => { look = k; p.querySelectorAll('.mg-look').forEach((x) => x.classList.toggle('is-on', x === b)); });
      });
      p.querySelector('.mg-look').classList.add('is-on');
      const input = p.querySelector('input');
      const go = () => { const n = input.value.trim().replace(/\s+/g, ' ').slice(0, 14); MG.closePanel(); res({ name: n || 'Mentarian', look }); };
      p.querySelector('.mg-start').addEventListener('click', go);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      setTimeout(() => input.focus(), 60);
    });
  }

  function makeWorld() {
    const S = MG.S;
    MG.pe = { active: false, t: 0, got: [] };
    MG.ents = MG.buildEntities();
    MG.player = { kind: 'player', x: S.x, y: S.y, tx: S.x, ty: S.y, dir: S.dir, t: 0, moving: false, anim: 0, dur: 0.165, look: MG.PLAYER_LOOKS[S.look] || MG.PLAYER_LOOKS[0] };
    curArea = ''; parts = [];
  }

  /* ---------- open / close ---------- */
  MG.open = async function (mode) {
    if (!root) setup();
    MG.buildWorld();
    const saved = mode === 'continue' ? load() : null;
    MG.S = Object.assign(MG.fresh(), saved || {});
    makeWorld();
    root.hidden = false;
    document.documentElement.classList.add('mg-open');
    if (SC.lock) SC.lock(true);
    resize();
    running = true; paused = false; last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    root.focus({ preventScroll: true });
    if (saved) { MG.toast(`Welcome back, ${MG.S.name}!`); arrive(); return; }
    const h = await chooseHero();
    MG.S.name = h.name; MG.S.look = h.look; MG.S.time = 0; MG.player.look = MG.PLAYER_LOOKS[h.look];
    MG.save(); arrive();
    MG.intro();
  };
  MG.close = function () {
    if (!running) return;
    MG.save();
    running = false; cancelAnimationFrame(raf);
    dq.length = 0; dlg = null; ui.dialog.hidden = true;
    if (panelOpen) MG.closePanel();
    root.hidden = true;
    document.documentElement.classList.remove('mg-open');
    if (SC.lock) SC.lock(false);
    if (MG.refreshTeaser) MG.refreshTeaser();
    const s = document.getElementById('game');
    if (s) s.querySelector('.js-game-start').focus({ preventScroll: true });
  };

  /* ---------- the ending ---------- */
  MG.finale = function () {
    const S = MG.S, P = MG.player;
    const cols = ['#ffd21f', '#3f6dff', '#ffffff', '#ff6fa8', '#3ecf8e'];
    for (let k = 0; k < 5; k++) setTimeout(() => MG.burst(P.x + (Math.random() * 6 - 3), P.y - 1 - Math.random() * 3, cols[k], 30), k * 220);
    const rank = S.mp >= 800 ? 'Gold Mentarian' : S.mp >= 600 ? 'Silver Mentarian' : 'Bronze Mentarian';
    try { localStorage.removeItem(SAVE); } catch (e) { /* ignore */ }
    setTimeout(() => {
      const p = MG.openPanel(`<div class="mg-card mg-cert">
        <p class="micro">Mentari Intercultural School Jakarta · Student Council</p>
        <h3>Certificate of Mentarian Spirit</h3>
        <p>This certifies that</p>
        <p class="mg-cert__name">${esc(S.name)}</p>
        <p>picked up what others walked past, showed up to every class, and helped without being asked — and is officially a</p>
        <p class="mg-cert__rank">${rank}</p>
        <dl class="mg-cert__stats"><div><dt>Mentarian Points</dt><dd>${S.mp}</dd></div><div><dt>Time</dt><dd>${mmss(S.time)}</dd></div><div><dt>Sorted first try</dt><dd>${S.sortFirst} / 12</dd></div></dl>
        <p class="mg-cert__line">The next chapter is yours.</p>
        <div class="mg-menu"><button type="button" class="mg-go" data-a="journey">Back to the journey →</button><button type="button" class="mg-ghost" data-a="again">Play again</button></div>
      </div>`, 'end');
      p.querySelector('[data-a="journey"]').addEventListener('click', () => { MG.close(); if (SC.scrollTo) setTimeout(() => SC.scrollTo('#future'), 200); });
      p.querySelector('[data-a="again"]').addEventListener('click', () => { MG.closePanel(); MG.close(); setTimeout(() => MG.open('new'), 100); });
    }, 1600);
  };

  /* ---------- attract-mode preview inside the page ---------- */
  MG.initTeaser = function () {
    const sec = document.getElementById('game');
    if (!sec) return;
    MG.buildWorld();
    const c = sec.querySelector('.game__preview'), g = c.getContext('2d');
    const start = sec.querySelector('.js-game-start'), cont = sec.querySelector('.js-game-continue');
    start.addEventListener('click', () => MG.open('new'));
    cont.addEventListener('click', () => MG.open('continue'));
    MG.refreshTeaser = () => {
      const s = load(), can = !!(s && !s.done);
      cont.hidden = !can;
      start.querySelector('span').textContent = can ? 'New game' : 'Start game';
    };
    MG.refreshTeaser();

    const route = [[21, 28], [42, 28], [42, 14], [21, 14]];
    const seg = route.map((p, i) => { const q = route[(i + 1) % route.length]; return { p, q, len: Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) }; });
    const total = seg.reduce((a, s) => a + s.len, 0);
    const cast = [
      { look: { skin: '#c58b62', hair: '#1b1b1b', hairStyle: 'cap', cap: '#2d5e43', shirt: '#3f7f5a', pants: '#33363f' }, x: 27, y: 27, dir: 1 },
      { look: MG.PLAYER_LOOKS[2], x: 25, y: 22, dir: 0 }, { look: MG.PLAYER_LOOKS[1], x: 38, y: 24, dir: 1 },
      { look: { skin: '#d9a27a', hair: '#0b2c9c', hairStyle: 'hijab', shirt: '#f6f5f0', pants: '#1d2f6b', badge: true }, x: 31, y: 16, dir: 0 }
    ];
    const items = [[24, 19, 'litter-plastic'], [40, 26, 'litter-paper'], [33, 23, 'litter-food']];
    let vis = false, raf2 = 0, mx = 0, my = 0, sm = { x: 0, y: 0 };
    const size = () => {
      const r = c.getBoundingClientRect(), s = Math.max(2, Math.round(r.width / 340));
      c.width = Math.max(1, Math.round(r.width / s)); c.height = Math.max(1, Math.round(r.height / s));
      g.imageSmoothingEnabled = false;
    };
    function frame(now) {
      raf2 = vis ? requestAnimationFrame(frame) : 0;
      const d = ((now / 1000) * 3) % total;
      let acc = 0, wx = 21, wy = 28, dir = 2;
      for (const s of seg) {
        if (d <= acc + s.len) { const k = (d - acc) / s.len; wx = s.p[0] + (s.q[0] - s.p[0]) * k; wy = s.p[1] + (s.q[1] - s.p[1]) * k; dir = s.q[0] > s.p[0] ? 2 : s.q[0] < s.p[0] ? 1 : s.q[1] > s.p[1] ? 0 : 3; break; }
        acc += s.len;
      }
      sm.x += (mx - sm.x) * 0.06; sm.y += (my - sm.y) * 0.06;
      const mw = MG.W * T, mh = MG.H * T;
      const cx = Math.max(0, Math.min(mw - c.width, Math.round(wx * T + 8 - c.width / 2 + sm.x * 60)));
      const cy = Math.max(0, Math.min(mh - c.height, Math.round(wy * T + 8 - c.height / 2 + sm.y * 36)));
      g.drawImage(MG.mapCanvas, -cx, -cy);
      items.forEach(([x, y, t]) => { MG.drawItem(g, t, x * T - cx, y * T - cy, now, {}); MG.drawSparkle(g, x * T - cx, y * T - cy, now); });
      const who = cast.map((n) => ({ ...n, px: n.x * T, py: n.y * T, f: 0 }));
      who.push({ look: MG.PLAYER_LOOKS[0], px: wx * T, py: wy * T, dir, f: [1, 0, 2, 0][Math.floor(now / 125) % 4] });
      who.sort((a, b) => a.py - b.py).forEach((n) => g.drawImage(MG.sheet(n.look), n.f * 16, n.dir * 16, 16, 16, Math.round(n.px - cx), Math.round(n.py - cy) - 3, 16, 16));
    }
    sec.querySelector('.game__screen').addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    new IntersectionObserver((en) => {
      vis = en[0].isIntersecting;
      if (vis && !raf2) { size(); raf2 = requestAnimationFrame(frame); }
    }).observe(c);
    window.addEventListener('resize', () => vis && size());
  };
})();
