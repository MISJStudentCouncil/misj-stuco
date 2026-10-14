/* ==========================================================================
   MISJ STUCO — DEPARTMENT MOTIFS
   Twelve subtle canvas animations, one visual language per department.
   Keyed by department id. Unknown ids fall back to the "pr" network motif.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SC;
  const WH = '255,255,255', Y = '255,210,31';
  const rgba = (c, a) => `rgba(${c},${a})`;
  const TAU = Math.PI * 2;
  const line = (c, x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  const dot = (c, x, y, r, col) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); };
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const R = {};

  /* 01 Events — animated timelines */
  R.events = {
    draw(c, w, h, t) {
      for (let r = 0; r < 6; r++) {
        const y = h * (0.2 + r * 0.12), gap = 70 + r * 16, pos = t * 0.03 * (0.6 + r * 0.25);
        const off = pos % gap, first = Math.floor(pos / gap);
        c.lineWidth = 1; c.strokeStyle = rgba(WH, 0.1 + (r % 2) * 0.04); line(c, 0, y, w, y);
        for (let i = 0, x = -off; x < w + gap; i++, x += gap) {
          c.strokeStyle = rgba(WH, 0.3); line(c, x, y - 5, x, y + 5);
          if ((first + i + r * 2) % 5 === 0) dot(c, x, y, 3.2, rgba(Y, 0.9));
        }
      }
      c.strokeStyle = rgba(Y, 0.5); c.setLineDash([3, 6]); line(c, w * 0.62, 0, w * 0.62, h); c.setLineDash([]);
    }
  };

  /* 02 Sports — fast energetic lines */
  R.sports = {
    init(s, w, h) { s.p = Array.from({ length: 46 }, () => ({ x: Math.random() * w, y: Math.random() * h, l: 40 + Math.random() * 170, v: 2 + Math.random() * 7, y2: Math.random() < 0.12 })); },
    draw(c, w, h, t, s) {
      const dx = Math.cos(-0.2), dy = Math.sin(-0.2);
      for (const p of s.p) {
        p.x += p.v * 1.6; p.y += p.v * 1.6 * dy;
        if (p.x - p.l > w) { p.x = -20; p.y = Math.random() * h * 1.2; }
        if (p.y < -60) p.y = h + 60;
        const col = p.y2 ? Y : WH;
        const g = c.createLinearGradient(p.x - p.l * dx, p.y - p.l * dy, p.x, p.y);
        g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, p.y2 ? 0.9 : 0.35));
        c.strokeStyle = g; c.lineWidth = p.y2 ? 2 : 1;
        line(c, p.x - p.l * dx, p.y - p.l * dy, p.x, p.y);
      }
    }
  };

  /* 03 Creative — abstract shapes */
  R.creative = {
    init(s) {
      const kinds = ['circle', 'arc', 'tri', 'square', 'line'];
      s.sh = Array.from({ length: 14 }, (_, i) => ({ k: kinds[i % 5], x: Math.random(), y: Math.random(), r: 20 + Math.random() * 90, rot: Math.random() * 6, v: (Math.random() - 0.5) * 0.0007, y2: i === 3 || i === 10 }));
    },
    draw(c, w, h, t, s) {
      for (const o of s.sh) {
        const x = o.x * w + Math.sin(t * 0.0003 + o.r) * 16, y = o.y * h + Math.cos(t * 0.00025 + o.r) * 16;
        c.save(); c.translate(x, y); c.rotate(o.rot + t * o.v);
        c.strokeStyle = o.y2 ? rgba(Y, 0.85) : rgba(WH, 0.3); c.lineWidth = o.y2 ? 1.6 : 1;
        c.beginPath();
        if (o.k === 'circle') c.arc(0, 0, o.r, 0, TAU);
        else if (o.k === 'arc') c.arc(0, 0, o.r, 0, Math.PI * 1.2);
        else if (o.k === 'tri') { c.moveTo(0, -o.r); c.lineTo(o.r * 0.87, o.r * 0.5); c.lineTo(-o.r * 0.87, o.r * 0.5); c.closePath(); }
        else if (o.k === 'square') c.rect(-o.r / 2, -o.r / 2, o.r, o.r);
        else { c.moveTo(-o.r, 0); c.lineTo(o.r, 0); }
        c.stroke(); c.restore();
      }
    }
  };

  /* 04 Media — camera frame + film strip */
  R.media = {
    draw(c, w, h, t) {
      const S = Math.min(w, h), m = S * 0.12, L = S * 0.08;
      const x0 = m, y0 = m, x1 = w - m, y1 = h - m * 1.7;
      c.strokeStyle = rgba(WH, 0.55); c.lineWidth = 1.5;
      [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => {
        c.beginPath(); c.moveTo(x, y + L * sy); c.lineTo(x, y); c.lineTo(x + L * sx, y); c.stroke();
      });
      c.strokeStyle = rgba(WH, 0.1); c.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        line(c, x0 + ((x1 - x0) * i) / 3, y0, x0 + ((x1 - x0) * i) / 3, y1);
        line(c, x0, y0 + ((y1 - y0) * i) / 3, x1, y0 + ((y1 - y0) * i) / 3);
      }
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, fs = 24 + Math.sin(t * 0.002) * 4;
      c.strokeStyle = rgba(Y, 0.9); c.strokeRect(cx - fs, cy - fs, fs * 2, fs * 2);
      if (Math.floor(t / 700) % 2 === 0) dot(c, x0 + 12, y0 + 16, 4, rgba(Y, 1));
      c.fillStyle = rgba(WH, 0.7); c.font = `500 11px ${MONO}`; c.fillText('REC', x0 + 24, y0 + 20);
      const fy = h - m * 1.15, fh = m * 0.75, off = (t * 0.05) % 40;
      c.strokeStyle = rgba(WH, 0.18); line(c, 0, fy, w, fy); line(c, 0, fy + fh, w, fy + fh);
      c.fillStyle = rgba(WH, 0.16);
      for (let x = -off; x < w; x += 40) { c.fillRect(x, fy + 4, 14, 5); c.fillRect(x, fy + fh - 9, 14, 5); }
      c.strokeStyle = rgba(WH, 0.12);
      for (let x = -((t * 0.15) % 160); x < w; x += 160) c.strokeRect(x + 6, fy + 13, 140, Math.max(4, fh - 26));
    }
  };

  /* 05 PR & Engagement — connected dots + signals (also the default) */
  R.pr = {
    init(s, w, h) {
      const n = Math.round(Math.min(26, 8 + (w * h) / 40000));
      s.n = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 }));
      s.pulses = []; s.maxD = Math.min(w, h) * 0.38;
    },
    draw(c, w, h, t, s) {
      const N = s.n, links = [];
      for (const p of N) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
      c.lineWidth = 1;
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        const a = N[i], b = N[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < s.maxD) { links.push([i, j]); c.strokeStyle = rgba(WH, 0.22 * (1 - d / s.maxD)); line(c, a.x, a.y, b.x, b.y); }
      }
      if (links.length && Math.random() < 0.07) { const l = links[(Math.random() * links.length) | 0]; s.pulses.push({ a: l[0], b: l[1], t: 0 }); }
      s.pulses = s.pulses.filter((p) => p.t <= 1);
      for (const p of s.pulses) { p.t += 0.016; const a = N[p.a], b = N[p.b]; dot(c, a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 2.6, rgba(Y, 1)); }
      for (const p of N) dot(c, p.x, p.y, 2.2, rgba(WH, 0.8));
      const hub = N[0], r = (t * 0.06) % 120;
      c.strokeStyle = rgba(Y, 0.5 * (1 - r / 120)); c.beginPath(); c.arc(hub.x, hub.y, r, 0, TAU); c.stroke();
      dot(c, hub.x, hub.y, 4, rgba(Y, 1));
    }
  };

  /* 06 Student Welfare — soft organic motion */
  R.welfare = {
    draw(c, w, h, t) {
      const T = t * 0.0005;
      for (let k = 0; k < 7; k++) {
        c.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y = h * (0.3 + k * 0.07) + Math.sin(x * 0.006 + T * (1 + k * 0.2) + k) * 24 * (1 + k * 0.15) + Math.sin(x * 0.013 - T * 1.4 + k * 2) * 10;
          x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.strokeStyle = k === 3 ? rgba(Y, 0.75) : rgba(WH, 0.16 + k * 0.015); c.lineWidth = k === 3 ? 1.6 : 1; c.stroke();
      }
      c.lineWidth = 1;
      [[0.25, 0.72], [0.55, 0.32], [0.8, 0.66]].forEach(([px, py], i) => {
        const r = Math.min(w, h) * (0.08 + 0.025 * Math.sin(T * 2 + i * 2));
        c.strokeStyle = rgba(WH, 0.22); c.beginPath(); c.arc(px * w, py * h, r, 0, TAU); c.stroke();
        c.strokeStyle = rgba(WH, 0.1); c.beginPath(); c.arc(px * w, py * h, r * 1.6, 0, TAU); c.stroke();
      });
    }
  };

  /* 07 Academics — structured grid + knowledge glyphs */
  const GLYPHS = ['A', 'Σ', 'π', '∫', 'x²', '√', 'λ', 'Δ', '∞', 'ƒ', 'Ω', '≈', 'θ', 'B+', '01', 'Aa'];
  R.academics = {
    init(s) { s.g = 48; s.cells = []; },
    draw(c, w, h, t, s) {
      const g = s.g, ox = (w % g) / 2, oy = (h % g) / 2;
      c.strokeStyle = rgba(WH, 0.08); c.lineWidth = 1;
      for (let x = ox; x <= w; x += g) line(c, x, 0, x, h);
      for (let y = oy; y <= h; y += g) line(c, 0, y, w, y);
      if (Math.random() < 0.08) s.cells.push({ x: Math.floor((Math.random() * w) / g), y: Math.floor((Math.random() * h) / g), ch: GLYPHS[(Math.random() * GLYPHS.length) | 0], life: 0, y2: Math.random() < 0.16 });
      s.cells = s.cells.filter((cl) => cl.life < 1);
      c.font = `500 16px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const cl of s.cells) {
        cl.life += 0.006;
        const a = Math.sin(cl.life * Math.PI), x = ox + cl.x * g + g / 2, y = oy + cl.y * g + g / 2;
        if (cl.y2) { c.fillStyle = rgba(Y, 0.14 * a); c.fillRect(x - g / 2, y - g / 2, g, g); }
        c.fillStyle = cl.y2 ? rgba(Y, a) : rgba(WH, 0.7 * a);
        c.fillText(cl.ch, x, y);
      }
      c.textAlign = 'start'; c.textBaseline = 'alphabetic';
    }
  };

  /* 08 Finance — precise geometric data */
  R.finance = {
    draw(c, w, h, t) {
      const T = t * 0.001, n = 18, bw = (w * 0.7) / n, x0 = w * 0.15, base = h * 0.82;
      c.strokeStyle = rgba(WH, 0.3); c.lineWidth = 1; line(c, x0, base, x0 + w * 0.7, base);
      for (let i = 0; i < n; i++) {
        const v = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(i * 0.7 + T * 0.8)) * (0.6 + 0.4 * Math.sin(i * 0.31 + T * 0.3));
        const bh = v * h * 0.45;
        c.fillStyle = i === n - 3 ? rgba(Y, 0.85) : rgba(WH, 0.14);
        c.fillRect(x0 + i * bw + bw * 0.2, base - bh, bw * 0.6, bh);
      }
      c.beginPath();
      for (let i = 0; i <= n; i++) { const x = x0 + i * bw, y = h * 0.3 + Math.sin(i * 0.55 + T) * h * 0.06 - i * h * 0.006; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.strokeStyle = rgba(Y, 0.9); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1;
      c.fillStyle = rgba(WH, 0.5); c.font = `500 10px ${MONO}`;
      for (let i = 0; i <= 4; i++) { const y = base - i * h * 0.12; c.fillRect(x0 - 8, y, 5, 1); c.fillText(String(i * 25).padStart(3, '0'), x0 - 36, y + 3); }
      c.fillStyle = rgba(Y, 0.9); c.fillText('BUDGET ' + (78.4 + Math.sin(T) * 3.2).toFixed(1) + '%', x0 + w * 0.7 - 110, h * 0.17);
    }
  };

  /* 09 Fundraising — connected network nodes, growing */
  R.fundraising = {
    init(s, w, h) {
      const cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * 0.3;
      s.cx = cx; s.cy = cy;
      s.hubs = [0, 1, 2].map((i) => ({ x: cx + Math.cos(i * 2.094 - 1.571) * R0, y: cy + Math.sin(i * 2.094 - 1.571) * R0 }));
      s.leaves = [];
      s.hubs.forEach((hb, hi) => { for (let k = 0; k < 7; k++) { const a = Math.random() * TAU, r = 30 + Math.random() * Math.min(w, h) * 0.16; s.leaves.push({ h: hi, x: hb.x + Math.cos(a) * r, y: hb.y + Math.sin(a) * r, d: k * 0.12 + hi * 0.05 }); } });
    },
    draw(c, w, h, t, s) {
      const T = (t * 0.00025) % 1.5;
      c.strokeStyle = rgba(Y, 0.7); c.lineWidth = 1.4;
      s.hubs.forEach((hb) => line(c, s.cx, s.cy, hb.x, hb.y));
      c.lineWidth = 1;
      s.leaves.forEach((l) => {
        const hb = s.hubs[l.h], p = SC.clamp((T - l.d) / 0.25);
        if (p <= 0) return;
        c.strokeStyle = rgba(WH, 0.3); line(c, hb.x, hb.y, hb.x + (l.x - hb.x) * p, hb.y + (l.y - hb.y) * p);
        if (p >= 1) dot(c, l.x, l.y, 2.4, rgba(WH, 0.85));
      });
      s.hubs.forEach((hb) => dot(c, hb.x, hb.y, 5, rgba(Y, 1)));
      dot(c, s.cx, s.cy, 7, rgba(WH, 1));
      c.strokeStyle = rgba(WH, 0.25); c.beginPath(); c.arc(s.cx, s.cy, 16, 0, TAU); c.stroke();
    }
  };

  /* 10 Environment — organic contour lines */
  R.environment = {
    draw(c, w, h, t) {
      const T = t * 0.00018, cx = w * 0.5, cy = h * 0.55, S = Math.min(w, h);
      for (let k = 1; k <= 11; k++) {
        const r = S * 0.045 * k;
        c.beginPath();
        for (let a = 0; a <= TAU + 0.01; a += 0.08) {
          const n = Math.sin(a * 3 + T * 2 + k * 0.4) * 0.12 + Math.sin(a * 5 - T * 1.4 + k) * 0.06 + Math.sin(a * 2 + k * 0.7) * 0.08;
          const rr = r * (1 + n), x = cx + Math.cos(a) * rr * 1.25, y = cy + Math.sin(a) * rr;
          a === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.closePath();
        c.strokeStyle = k === 6 ? rgba(Y, 0.7) : rgba(WH, 0.1 + 0.015 * (11 - k)); c.lineWidth = k === 6 ? 1.5 : 1; c.stroke();
      }
    }
  };

  /* 11 Responsibility — precise alignment */
  R.responsibility = {
    draw(c, w, h, t) {
      const cx = w / 2, cy = h / 2, T = t * 0.0004, S = Math.min(w, h);
      c.lineWidth = 1; c.strokeStyle = rgba(WH, 0.12); c.setLineDash([2, 6]); line(c, 0, cy, w, cy); line(c, cx, 0, cx, h); c.setLineDash([]);
      const settle = Math.max(0, Math.cos(T * 0.5));
      for (let k = 1; k <= 6; k++) {
        const s = S * 0.07 * k, a = Math.sin(T + k * 0.5) * (0.5 / k) * settle;
        c.save(); c.translate(cx, cy); c.rotate(a);
        c.strokeStyle = k === 3 ? rgba(Y, 0.85) : rgba(WH, 0.25); c.lineWidth = k === 3 ? 1.5 : 1;
        c.strokeRect(-s / 2, -s / 2, s, s); c.restore();
      }
      c.lineWidth = 1; c.strokeStyle = rgba(WH, 0.3);
      for (let x = cx % 12; x < w; x += 12) { const L = Math.round((x - cx) / 12) % 5 === 0 ? 10 : 5; line(c, x, h - 24, x, h - 24 - L); }
      c.strokeStyle = rgba(Y, 0.9); line(c, cx - 8, cy, cx + 8, cy); line(c, cx, cy - 8, cx, cy + 8);
    }
  };

  /* 12 Technology — particles, perspective grid, scan line */
  R.technology = {
    init(s, w, h) { s.p = Array.from({ length: 70 }, () => ({ x: Math.random() * w, y: Math.random() * h, v: 0.2 + Math.random() * 0.8, s: Math.random() < 0.15 })); },
    draw(c, w, h, t, s) {
      const hz = h * 0.45, T = t * 0.04;
      c.lineWidth = 1; c.strokeStyle = rgba(WH, 0.12);
      for (let i = -14; i <= 14; i++) line(c, w / 2 + i * 20, hz, w / 2 + i * w * 0.16, h);
      for (let k = 0; k < 14; k++) { const z = ((k * 40 + T) % 560) / 560, y = hz + (h - hz) * z * z; c.strokeStyle = rgba(WH, 0.05 + 0.18 * z); line(c, 0, y, w, y); }
      c.strokeStyle = rgba(Y, 0.7); line(c, 0, hz, w, hz);
      for (const p of s.p) {
        p.y -= p.v; if (p.y < 0) { p.y = h; p.x = Math.random() * w; }
        const a = 0.2 + 0.6 * (1 - p.y / h);
        if (p.s) dot(c, p.x, p.y, 1.8, rgba(Y, a)); else { c.fillStyle = rgba(WH, a * 0.7); c.fillRect(p.x, p.y, 1.5, 1.5); }
      }
      const sy = ((t * 0.12) % (h + 80)) - 40, g = c.createLinearGradient(0, sy - 40, 0, sy);
      g.addColorStop(0, rgba(WH, 0)); g.addColorStop(1, rgba(WH, 0.08));
      c.fillStyle = g; c.fillRect(0, sy - 40, w, 40);
      c.strokeStyle = rgba(WH, 0.25); line(c, 0, sy, w, sy);
    }
  };

  /* Mount a motif on a canvas. Returns { stop }. */
  function mount(canvas, key) {
    const ctx = canvas.getContext('2d');
    const fn = R[key] || R.pr;
    const state = {};
    let raf = 0, alive = true, w = 0, h = 0, inited = false;
    function size() {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      inited = false;
    }
    function frame(t) {
      if (!alive) return;
      if (canvas.clientWidth !== w || canvas.clientHeight !== h) size();
      if (w && h) {
        if (!inited) { if (fn.init) fn.init(state, w, h); inited = true; }
        ctx.clearRect(0, 0, w, h);
        fn.draw(ctx, w, h, t, state);
      }
      if (!SC.reduce) raf = requestAnimationFrame(frame);
    }
    size();
    raf = requestAnimationFrame(frame);
    return { stop() { alive = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h); } };
  }

  SC.motifs = { mount, has: (k) => !!R[k] };
})();
