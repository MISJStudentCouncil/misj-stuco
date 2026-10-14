/* ==========================================================================
   BE THE MENTARIAN — SPRITES
   Characters are drawn in code as 16 × 16 pixel art:
   4 directions (down, left, right, up) × 3 frames (stand, step, step).
   ========================================================================== */
(function () {
  'use strict';
  const MG = (window.MG = window.MG || {});
  const SHOE = '#24242e', EYE = '#17172a';

  function drawChar(g, ox, oy, dir, frame, L) {
    const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); };
    const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const front = dir === 0, back = dir === 3, side = dir === 1 || dir === 2;

    g.fillStyle = 'rgba(0,0,0,.22)';
    g.beginPath(); g.ellipse(ox + 8, oy + 15, 5, 1.6, 0, 0, Math.PI * 2); g.fill();

    /* legs */
    if (!side) {
      const l = step === 1 ? 1 : 0, r = step === -1 ? 1 : 0;
      p(5, 12 - l, 2, 3, L.pants); p(9, 12 - r, 2, 3, L.pants);
      p(5, 14 - l, 2, 1, SHOE); p(9, 14 - r, 2, 1, SHOE);
    } else {
      p(6 + step, 12, 2, 3, L.pants); p(8 - step, 12, 2, 3, L.pants);
      p(6 + step, 14, 2, 1, SHOE); p(8 - step, 14, 2, 1, SHOE);
    }
    /* body */
    p(4, 8, 8, 5, L.shirt);
    p(4, 12, 8, 1, 'rgba(0,0,0,.12)');
    if (front) {
      if (L.extra === 'apron') p(5, 9, 6, 4, '#f4f1ea');
      p(6, 8, 4, 1, L.collar || '#ffffff');
      if (L.extra === 'tie') p(7, 9, 2, 3, L.tie || '#0b2c9c');
      if (L.badge) p(10, 9, 1, 1, '#ffd21f');
    }
    if (back && L.bag) { p(5, 8, 6, 4, L.bag); p(5, 8, 6, 1, 'rgba(255,255,255,.25)'); }
    /* arms */
    if (!side) {
      p(3, 8 + (step === 1 ? 1 : 0), 1, 4, L.shirt); p(12, 8 + (step === -1 ? 1 : 0), 1, 4, L.shirt);
      p(3, 12 + (step === 1 ? 1 : 0), 1, 1, L.skin); p(12, 12 + (step === -1 ? 1 : 0), 1, 1, L.skin);
    } else {
      const ax = dir === 1 ? 7 : 8;
      p(ax + step, 9, 2, 3, L.shirt); p(ax + step, 12, 2, 1, L.skin);
    }
    /* head */
    p(4, 2, 8, 6, L.skin); p(5, 1, 6, 1, L.skin);
    const h = L.hair, s = L.hairStyle;
    if (s === 'hijab') {
      if (back) p(3, 1, 10, 9, h);
      else {
        p(3, 1, 10, 3, h); p(4, 0, 8, 1, h);
        if (front) { p(3, 3, 2, 6, h); p(11, 3, 2, 6, h); p(4, 8, 8, 2, h); }
        else if (dir === 1) { p(8, 3, 5, 6, h); p(3, 3, 1, 4, h); p(4, 8, 8, 2, h); }
        else { p(3, 3, 5, 6, h); p(12, 3, 1, 4, h); p(4, 8, 8, 2, h); }
      }
    } else {
      const long = s === 'long';
      if (back) p(4, 1, 8, long ? 8 : 6, h);
      else {
        p(4, 1, 8, 2, h); p(5, 0, 6, 1, h);
        if (front) { p(4, 3, 1, long ? 6 : 2, h); p(11, 3, 1, long ? 6 : 2, h); }
        else if (dir === 1) p(9, 3, 3, long ? 6 : 3, h);
        else p(4, 3, 3, long ? 6 : 3, h);
      }
      if (s === 'cap') {
        const c = L.cap || '#d63a3a';
        p(4, 0, 8, 3, c);
        if (front) p(4, 3, 8, 1, c); else if (dir === 1) p(2, 3, 5, 1, c); else if (dir === 2) p(9, 3, 5, 1, c);
      }
    }
    /* face */
    if (front) {
      p(6, 5, 1, 2, EYE); p(9, 5, 1, 2, EYE);
      if (L.glasses) { p(5, 5, 3, 1, '#2a2a33'); p(8, 5, 3, 1, '#2a2a33'); p(6, 5, 1, 1, '#9fd0f2'); p(9, 5, 1, 1, '#9fd0f2'); }
      p(7, 7, 2, 1, 'rgba(120,50,40,.45)');
    } else if (dir === 1) { p(5, 5, 1, 2, EYE); if (L.glasses) p(4, 5, 3, 1, '#2a2a33'); }
    else if (dir === 2) { p(10, 5, 1, 2, EYE); if (L.glasses) p(9, 5, 3, 1, '#2a2a33'); }
  }

  const cache = new Map();
  MG.sheet = function (look) {
    const key = JSON.stringify(look);
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas');
    c.width = 48; c.height = 64;
    const g = c.getContext('2d');
    for (let d = 0; d < 4; d++) for (let f = 0; f < 3; f++) drawChar(g, f * 16, d * 16, d, f, look);
    cache.set(key, c);
    return c;
  };

  /* ---------- items drawn straight onto the game canvas ---------- */
  MG.drawItem = function (g, type, X, Y, t, e) {
    const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
    const bob = Math.round(Math.sin(t / 260 + X * 0.1) * 1);
    const shadow = () => { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(X + 8, Y + 14, 4, 1.4, 0, 0, 7); g.fill(); };
    switch (type) {
      case 'litter-plastic': shadow(); p(6, 5 + bob, 4, 8, '#cfe8ff'); p(6, 5 + bob, 1, 8, '#5a8bc0'); p(9, 5 + bob, 1, 8, '#5a8bc0'); p(7, 4 + bob, 2, 1, '#2a6bd1'); p(6, 9 + bob, 4, 2, '#3f6dff'); break;
      case 'litter-paper': shadow(); p(5, 7 + bob, 6, 5, '#f6f4ee'); p(4, 8 + bob, 1, 3, '#f6f4ee'); p(6, 9 + bob, 4, 1, '#b9b4a6'); p(5, 11 + bob, 3, 1, '#b9b4a6'); p(10, 7 + bob, 1, 1, '#d8d3c5'); break;
      case 'litter-food': shadow(); p(7, 6 + bob, 2, 3, '#e0b33c'); p(5, 8 + bob, 2, 4, '#f2c94c'); p(9, 8 + bob, 2, 4, '#f2c94c'); p(5, 11 + bob, 1, 1, '#7a5520'); p(10, 11 + bob, 1, 1, '#7a5520'); p(7, 9 + bob, 2, 3, '#fff2b8'); break;
      case 'book': shadow(); p(4, 6 + bob, 8, 7, e.color || '#d64f4f'); p(4, 12 + bob, 8, 1, '#ffffff'); p(5, 7 + bob, 1, 5, 'rgba(255,255,255,.35)'); p(7, 8 + bob, 4, 1, '#ffd21f'); break;
      case 'idcard': shadow(); p(4, 7 + bob, 8, 6, '#ffffff'); p(4, 7 + bob, 8, 2, '#1a47d6'); p(5, 10 + bob, 2, 2, '#e8b48a'); p(8, 10 + bob, 3, 1, '#9aa6b2'); p(8, 12 + bob, 2, 1, '#9aa6b2'); break;
      case 'flag': p(7, 1, 1, 14, '#e8e8e8'); p(8, 1 + bob, 5, 4, '#ffd21f'); p(8, 3 + bob, 5, 1, '#e0b400'); p(6, 14, 3, 1, '#7d8696'); break;
      case 'plant': {
        p(5, 10, 6, 5, '#a0522d'); p(5, 10, 6, 1, '#c06a3f');
        if (e.wet) { p(7, 3, 2, 7, '#3d8b3d'); p(4, 4, 3, 3, '#4fb04f'); p(9, 5, 3, 3, '#4fb04f'); p(6, 1, 4, 3, '#ff6fa8'); p(7, 2, 2, 1, '#ffd21f'); }
        else { p(7, 5, 2, 5, '#8a7a3a'); p(4, 7, 3, 2, '#b59a4a'); p(9, 6, 3, 2, '#a68a3c'); p(5, 9, 1, 1, '#7a5a2a'); }
        break;
      }
      case 'bin-plastic': case 'bin-paper': case 'bin-food': {
        const col = { 'bin-plastic': ['#2a6bd1', '#1a4fa8'], 'bin-paper': ['#ffd21f', '#d9a800'], 'bin-food': ['#3e9e57', '#2c7a40'] }[type];
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(X + 8, Y + 15, 6, 1.6, 0, 0, 7); g.fill();
        p(3, 4, 10, 11, col[0]); p(2, 2, 12, 3, col[1]); p(6, 1, 4, 1, col[1]); p(3, 14, 10, 1, 'rgba(0,0,0,.25)');
        p(6, 7, 4, 4, 'rgba(255,255,255,.85)'); p(7, 8, 2, 2, col[0]);
        break;
      }
      default: break;
    }
  };

  /* little sparkle used on collectibles */
  MG.drawSparkle = function (g, X, Y, t) {
    const k = (t / 700 + X * 0.07) % 1;
    if (k > 0.25) return;
    const s = k < 0.12 ? 1 : 2;
    g.fillStyle = '#ffffff';
    g.fillRect(X + 12, Y + 3 - s, 1, s * 2 + 1); g.fillRect(X + 12 - s, Y + 3, s * 2 + 1, 1);
  };
})();
