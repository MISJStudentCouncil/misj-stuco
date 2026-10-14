/* ==========================================================================
   BE THE MENTARIAN — WORLD
   The MISJ campus as a tile map (64 × 48 tiles of 16 px), generated in code
   and pre-rendered once as pixel art.
   ========================================================================== */
(function () {
  'use strict';
  const MG = (window.MG = window.MG || {});
  const W = 64, H = 48, T = 16;
  Object.assign(MG, { W, H, T });

  const K = (MG.K = {
    GRASS: 0, PATH: 1, FLOOR: 2, WALL: 3, TREE: 4, WATER: 5, DESK: 6, SHELF: 7, FLOWER: 8, BENCH: 9,
    FENCE: 10, COUNTER: 11, FIELD: 12, BOARD: 13, LAB: 14, EASEL: 15, TABLE: 16, DOOR: 17, BUSH: 18,
    LINE: 19, TRACK: 20, RUG: 22, POLE: 23
  });
  const SOLID = new Set([K.WALL, K.TREE, K.WATER, K.DESK, K.SHELF, K.BENCH, K.FENCE, K.COUNTER, K.BOARD, K.LAB, K.EASEL, K.TABLE, K.BUSH, K.POLE]);

  const map = new Uint8Array(W * H), area = new Uint8Array(W * H);
  const areas = [{ name: 'Campus', style: null }];
  const I = (x, y) => y * W + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  MG.tile = (x, y) => (inb(x, y) ? map[I(x, y)] : K.FENCE);
  MG.solid = (x, y) => !inb(x, y) || SOLID.has(map[I(x, y)]);
  MG.areaAt = (x, y) => (inb(x, y) ? areas[area[I(x, y)]].name : '');
  const styleAt = (x, y) => (inb(x, y) ? areas[area[I(x, y)]].style : null);

  const set = (x, y, k) => { if (inb(x, y)) map[I(x, y)] = k; };
  const rect = (x, y, w, h, k) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, k); };
  const mark = (x, y, w, h, a) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inb(i, j)) area[I(i, j)] = a; };
  const zone = (name, x, y, w, h) => { const a = areas.push({ name, style: null }) - 1; mark(x, y, w, h, a); };
  function room(name, style, x, y, w, h, doors) {
    const a = areas.push({ name, style }) - 1;
    rect(x, y, w, h, K.WALL); rect(x + 1, y + 1, w - 2, h - 2, K.FLOOR); mark(x, y, w, h, a);
    doors.forEach(([dx, dy]) => set(dx, dy, K.DOOR));
  }

  /* ---------- the campus ---------- */
  function build() {
    map.fill(K.GRASS);
    zone('Main Avenue', 26, 30, 12, 17);
    zone('Corridor', 1, 12, 62, 3);
    zone('Courtyard', 16, 15, 32, 15);
    zone('Sports Field', 1, 30, 25, 17);
    zone('Garden', 38, 30, 25, 17);

    rect(0, 0, W, 1, K.FENCE); rect(0, H - 1, W, 1, K.FENCE); rect(0, 0, 1, H, K.FENCE); rect(W - 1, 0, 1, H, K.FENCE);
    rect(30, H - 1, 4, 1, K.PATH);                       // the gate

    rect(2, 12, 60, 3, K.PATH);                           // corridor
    rect(20, 17, 24, 13, K.PATH);                         // courtyard plaza
    rect(16, 21, 32, 3, K.PATH);                          // library ↔ canteen walk
    rect(30, 15, 4, 32, K.PATH);                          // main avenue
    rect(25, 35, 5, 2, K.PATH); rect(34, 35, 6, 2, K.PATH); // to field + garden

    room('Math Room', 'class', 2, 2, 12, 10, [[7, 11]]);
    room('Science Lab', 'lab', 14, 2, 12, 10, [[19, 11]]);
    room('StuCo Hall', 'hall', 26, 2, 12, 10, [[31, 11], [32, 11]]);
    room('English Room', 'class', 38, 2, 12, 10, [[43, 11]]);
    room('Art Studio', 'art', 50, 2, 12, 10, [[55, 11]]);
    room('Library', 'library', 2, 17, 14, 13, [[15, 22]]);
    room('Canteen', 'canteen', 48, 17, 14, 13, [[48, 22]]);

    /* classrooms: board, teacher's desk, two rows of desks with an aisle to the door */
    [[2, K.DESK], [14, K.LAB], [38, K.DESK], [50, K.EASEL]].forEach(([x, k]) => {
      rect(x + 3, 3, 6, 1, K.BOARD);
      set(x + 7, 4, K.TABLE); set(x + 8, 4, K.TABLE);
      [6, 8].forEach((y) => [x + 2, x + 3, x + 7, x + 8].forEach((i) => {
        if (k === K.EASEL && (i === x + 3 || i === x + 7)) return;
        set(i, y, k);
      }));
    });
    /* StuCo Hall */
    rect(28, 4, 8, 6, K.RUG); rect(29, 3, 6, 1, K.BOARD);
    set(27, 3, K.POLE); set(36, 3, K.POLE);
    rect(28, 8, 2, 1, K.TABLE); rect(34, 8, 2, 1, K.TABLE);
    /* Library */
    [19, 25, 27].forEach((y) => rect(3, y, 6, 1, K.SHELF));
    rect(3, 22, 5, 1, K.SHELF);
    rect(11, 21, 1, 3, K.COUNTER);
    rect(12, 26, 2, 1, K.TABLE);
    /* Canteen */
    rect(50, 20, 9, 1, K.COUNTER);
    [24, 27].forEach((y) => [51, 52, 56, 57].forEach((x) => set(x, y, K.TABLE)));

    /* Courtyard */
    rect(29, 18, 6, 3, K.WATER);
    [[21, 25], [22, 25], [41, 25], [42, 25]].forEach(([x, y]) => set(x, y, K.BENCH));
    set(36, 27, K.POLE);
    [[20, 17], [43, 17], [20, 29], [43, 29]].forEach(([x, y]) => set(x, y, K.BUSH));
    [[17, 18], [18, 27], [45, 18], [46, 27], [17, 25], [46, 20]].forEach(([x, y]) => set(x, y, K.TREE));
    rect(2, 15, 26, 1, K.FLOWER); rect(36, 15, 26, 1, K.FLOWER);

    /* Avenue */
    [31, 33, 38, 41, 44].forEach((y) => { set(28, y, K.TREE); set(35, y, K.TREE); });

    /* Sports field: running track around a pitch */
    rect(2, 31, 23, 15, K.TRACK); rect(4, 33, 19, 11, K.FIELD); rect(13, 33, 1, 11, K.LINE);

    /* Garden */
    rect(40, 32, 4, 2, K.FLOWER); rect(56, 32, 4, 2, K.FLOWER); rect(41, 45, 6, 1, K.FLOWER);
    rect(52, 38, 5, 4, K.WATER);
    [[39, 40], [61, 36], [50, 45], [61, 42], [44, 31]].forEach(([x, y]) => set(x, y, K.TREE));
    [[1, 3], [1, 7], [62, 3], [1, 20], [1, 26], [62, 24], [26, 45], [37, 45]].forEach(([x, y]) => set(x, y, K.TREE));
  }

  /* ---------- pixel-art tiles ---------- */
  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const C = {
    grass: '#5c9e4e', grassD: '#4c8b42', grassL: '#72b65f', path: '#e3d7b9', pathD: '#cdbf9c',
    roof: '#1a3fa8', roofL: '#2a55c8', face: '#efebe2', faceD: '#d8d2c3', base: '#0b2c9c', trim: '#ffd21f', glass: '#9fd0f2',
    wood: '#c49564', woodD: '#9c7046', dark: '#3a2a1e', water: '#3f8fd6', waterL: '#8cc8f2', leaf: '#2f7a3b', leafL: '#47a052'
  };
  const FLOORS = {
    class: ['#ece6d6', '#e1dac7'], lab: ['#e3ecef', '#d3dfe3'], art: ['#e6e1d8', '#dcd5c8'],
    hall: ['#c8a074', '#bb9064'], library: ['#b98a5e', '#a97b52'], canteen: ['#eef2f6', '#d9e1ea']
  };

  function drawTile(g, x, y) {
    const k = map[I(x, y)], X = x * T, Y = y * T, r = (s) => hash(x, y, s);
    const p = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(X + px, Y + py, w, h); };
    const st = styleAt(x, y);
    const floor = () => {
      const f = FLOORS[st] || FLOORS.class;
      if (st === 'library' || st === 'hall') { p(0, 0, 16, 16, f[0]); for (let j = 3; j < 16; j += 4) p(0, j, 16, 1, f[1]); p(((x * 5) % 3) * 5, 0, 1, 16, f[1]); }
      else { p(0, 0, 16, 16, f[0]); p(0, 0, 8, 8, f[1]); p(8, 8, 8, 8, f[1]); }
      if (st === 'art' && r(4) > 0.7) p(Math.floor(r(5) * 12) + 2, Math.floor(r(6) * 12) + 2, 2, 2, ['#ff6fa8', '#ffd21f', '#3f6dff'][Math.floor(r(7) * 3)]);
    };
    const grass = () => {
      p(0, 0, 16, 16, C.grass);
      for (let n = 0; n < 5; n++) p(Math.floor(r(n) * 15), Math.floor(r(n + 9) * 14), 1, 2, r(n + 20) > 0.5 ? C.grassD : C.grassL);
    };
    const path = () => {
      p(0, 0, 16, 16, C.path);
      for (let n = 0; n < 3; n++) p(Math.floor(r(n) * 14), Math.floor(r(n + 5) * 14), 2, 1, C.pathD);
    };
    const under = () => (st ? floor() : (k === K.BENCH || k === K.POLE ? path() : grass()));

    switch (k) {
      case K.GRASS: grass(); break;
      case K.PATH: path(); break;
      case K.FLOOR: floor(); break;
      case K.DOOR: floor(); p(2, 9, 12, 6, C.trim); p(2, 11, 12, 1, '#e0b400'); p(2, 13, 12, 1, '#e0b400'); break;
      case K.WALL: {
        const below = MG.tile(x, y + 1);
        if (below === K.WALL || y + 1 >= H) {
          p(0, 0, 16, 16, C.roof); p(0, 0, 16, 1, C.roofL); p(0, 0, 1, 16, C.roofL);
          if (r(1) > 0.6) p(4, 6, 8, 1, C.roofL);
        } else {
          p(0, 0, 16, 5, C.roof); p(0, 0, 16, 1, C.roofL); p(0, 5, 16, 1, C.trim);
          p(0, 6, 16, 8, C.face); p(0, 13, 16, 1, C.faceD); p(0, 14, 16, 2, C.base);
          if ((x % 3 === 1) && below !== K.DOOR) { p(3, 7, 10, 5, C.dark); p(4, 8, 8, 3, C.glass); p(8, 8, 1, 3, C.dark); p(4, 8, 2, 1, '#d6efff'); }
        }
        break;
      }
      case K.TREE:
        grass(); p(6, 10, 4, 5, C.woodD); p(6, 14, 4, 1, C.dark);
        g.fillStyle = C.leaf; g.beginPath(); g.arc(X + 8, Y + 7, 7, 0, 7); g.fill();
        g.fillStyle = C.leafL; g.beginPath(); g.arc(X + 6, Y + 5, 3.5, 0, 7); g.fill();
        break;
      case K.BUSH:
        grass(); g.fillStyle = C.leaf; g.beginPath(); g.arc(X + 8, Y + 9, 6, 0, 7); g.fill();
        p(5, 6, 3, 2, C.leafL); p(10, 10, 2, 2, '#ff6fa8');
        break;
      case K.WATER: {
        p(0, 0, 16, 16, C.water);
        for (let n = 0; n < 3; n++) p(Math.floor(r(n) * 12), Math.floor(r(n + 3) * 14), 4, 1, C.waterL);
        if (MG.tile(x, y - 1) !== K.WATER) p(0, 0, 16, 2, '#cfe9fb');
        if (MG.tile(x - 1, y) !== K.WATER) p(0, 0, 1, 16, '#2c6fb3');
        if (MG.tile(x + 1, y) !== K.WATER) p(15, 0, 1, 16, '#2c6fb3');
        if (MG.tile(x, y + 1) !== K.WATER) p(0, 15, 16, 1, '#2c6fb3');
        break;
      }
      case K.DESK:
        floor(); p(2, 3, 12, 7, C.wood); p(2, 9, 12, 1, C.woodD); p(4, 4, 5, 4, '#ffffff'); p(10, 4, 1, 4, '#1a47d6');
        p(5, 11, 6, 3, '#2b3f7a'); p(5, 14, 1, 2, C.dark); p(10, 14, 1, 2, C.dark);
        break;
      case K.SHELF: {
        floor(); p(0, 0, 16, 15, C.woodD); p(0, 15, 16, 1, C.dark);
        const books = ['#d64f4f', '#3f6dff', '#ffd21f', '#3ecf8e', '#f4f1ea', '#8a5cc8'];
        [1, 8].forEach((sy) => { for (let bx = 1; bx < 15; bx += 2) p(bx, sy + Math.floor(r(bx + sy) * 2), 2, 6 - Math.floor(r(bx + sy) * 2), books[Math.floor(r(bx * sy + 3) * 6)]); p(0, sy + 6, 16, 1, C.dark); });
        break;
      }
      case K.FLOWER: {
        grass();
        const cols = ['#ff6fa8', '#ffd21f', '#ffffff', '#ff8a3d', '#b38cff'];
        for (let n = 0; n < 4; n++) { const fx = 1 + Math.floor(r(n) * 12), fy = 1 + Math.floor(r(n + 7) * 12); p(fx, fy, 3, 3, cols[Math.floor(r(n + 2) * 5)]); p(fx + 1, fy + 1, 1, 1, '#ffd21f'); }
        break;
      }
      case K.BENCH: path(); p(1, 5, 14, 3, C.wood); p(1, 9, 14, 3, C.wood); p(1, 12, 14, 1, C.woodD); p(2, 13, 2, 3, C.dark); p(12, 13, 2, 3, C.dark); break;
      case K.FENCE: grass(); p(0, 5, 16, 2, '#071a5c'); p(0, 11, 16, 2, '#071a5c'); for (let fx = 1; fx < 16; fx += 5) p(fx, 2, 2, 13, '#0b2c9c'); break;
      case K.COUNTER: floor(); p(0, 2, 16, 12, '#b8c0cc'); p(0, 2, 16, 3, '#e4e8ee'); p(0, 13, 16, 1, '#7d8696'); break;
      case K.FIELD: p(0, 0, 16, 16, y % 2 ? '#6bb85b' : '#61ad52'); break;
      case K.LINE: p(0, 0, 16, 16, y % 2 ? '#6bb85b' : '#61ad52'); p(7, 0, 2, 16, '#f4f4f0'); break;
      case K.TRACK: {
        p(0, 0, 16, 16, '#c9653f');
        const side = x === 2 || x === 3 || x === 23 || x === 24;
        if (side && y > 32 && y < 44) { p(7, 0, 1, 16, '#e8a487'); } else { p(0, 7, 16, 1, '#e8a487'); }
        break;
      }
      case K.BOARD:
        floor();
        if (st === 'hall') { p(0, 0, 16, 11, '#ffd21f'); p(0, 9, 16, 2, '#0b2c9c'); p(3 + (x % 2) * 4, 3, 5, 3, '#0b2c9c'); }
        else if (st === 'art') { p(0, 0, 16, 11, '#c49564'); p(2, 2, 5, 6, '#ffffff'); p(9, 3, 5, 5, ['#ff6fa8', '#3f6dff', '#ffd21f'][x % 3]); }
        else { p(0, 0, 16, 11, '#8a6a48'); p(1, 1, 14, 9, '#2e5e4e'); if (r(2) > 0.3) p(3, 3, Math.floor(r(3) * 8) + 3, 1, '#e8f0ea'); if (r(4) > 0.4) p(3, 6, Math.floor(r(5) * 9) + 2, 1, '#e8f0ea'); }
        break;
      case K.LAB:
        floor(); p(1, 3, 14, 9, '#f4f6f8'); p(1, 11, 14, 1, '#9aa6b2');
        p(3, 4, 2, 5, '#3ecf8e'); p(7, 5, 2, 4, '#3f6dff'); p(11, 4, 2, 5, '#ff6fa8'); p(3, 4, 2, 1, '#ffffff');
        break;
      case K.EASEL: floor(); p(4, 12, 1, 4, C.woodD); p(11, 12, 1, 4, C.woodD); p(7, 1, 2, 14, C.woodD); p(3, 2, 10, 9, '#ffffff'); p(5, 4, 4, 3, ['#ff6fa8', '#3f6dff', '#ffd21f'][x % 3]); p(3, 11, 10, 1, C.woodD); break;
      case K.TABLE: floor(); p(1, 3, 14, 9, C.wood); p(1, 3, 14, 1, '#d8ad7c'); p(1, 11, 14, 1, C.woodD); p(2, 12, 2, 3, C.dark); p(12, 12, 2, 3, C.dark); break;
      case K.RUG: {
        p(0, 0, 16, 16, '#1a47d6');
        if (MG.tile(x, y - 1) !== K.RUG) p(0, 1, 16, 1, '#ffd21f');
        if (MG.tile(x, y + 1) !== K.RUG) p(0, 14, 16, 1, '#ffd21f');
        if (MG.tile(x - 1, y) !== K.RUG) p(1, 0, 1, 16, '#ffd21f');
        if (MG.tile(x + 1, y) !== K.RUG) p(14, 0, 1, 16, '#ffd21f');
        break;
      }
      case K.POLE: under(); p(7, 1, 2, 15, '#c9ced6'); p(9, 2, 6, 3, '#d63a3a'); p(9, 5, 6, 3, '#ffffff'); p(6, 14, 4, 2, '#7d8696'); break;
      default: grass();
    }
  }

  MG.buildWorld = function () {
    if (MG.mapCanvas) return;
    build();
    const c = document.createElement('canvas');
    c.width = W * T; c.height = H * T;
    const g = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) drawTile(g, x, y);
    MG.mapCanvas = c;
  };
})();
