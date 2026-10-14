/* ==========================================================================
   BE THE MENTARIAN — PEOPLE, TASKS & STORY
   Everyone on campus, what they say, and the 13 tasks in the journal.
   ========================================================================== */
(function () {
  'use strict';
  const MG = (window.MG = window.MG || {});
  const say = (...a) => MG.say(...a), ask = (...a) => MG.ask(...a);

  const STUDENT = (hair, style, skin, bag) => ({ skin, hair, hairStyle: style, shirt: '#f6f5f0', pants: '#1d2f6b', badge: true, extra: 'tie', bag });
  const LOOK = {
    dinda: { skin: '#d9a27a', hair: '#0b2c9c', hairStyle: 'hijab', shirt: '#f6f5f0', pants: '#1d2f6b', badge: true },
    asep: { skin: '#c58b62', hair: '#1b1b1b', hairStyle: 'cap', cap: '#2d5e43', shirt: '#3f7f5a', pants: '#33363f' },
    budi: { skin: '#d29a6e', hair: '#1b1b1b', hairStyle: 'short', shirt: '#cfe0f7', pants: '#3b3b45', extra: 'tie', tie: '#b0302c', glasses: true },
    sari: { skin: '#e2ad84', hair: '#7a4f9e', hairStyle: 'hijab', shirt: '#ffffff', pants: '#4a4f5c' },
    clara: { skin: '#f0c8a8', hair: '#7a4a2a', hairStyle: 'long', shirt: '#d64f6a', pants: '#2b2f3a' },
    yosef: { skin: '#b97d55', hair: '#9a9a9a', hairStyle: 'short', shirt: '#f2a03d', pants: '#4a3a2a', glasses: true, extra: 'apron' },
    andi: { skin: '#c88a5c', hair: '#1b1b1b', hairStyle: 'cap', cap: '#ffd21f', shirt: '#d63a3a', pants: '#222222' },
    rina: { skin: '#e6b48c', hair: '#2f8a7a', hairStyle: 'hijab', shirt: '#e9e1cf', pants: '#4a4f5c', glasses: true },
    kantin: { skin: '#d29a6e', hair: '#c0392b', hairStyle: 'hijab', shirt: '#f2a65a', pants: '#5a4a3a', extra: 'apron' },
    joko: { skin: '#b07a50', hair: '#1b1b1b', hairStyle: 'cap', cap: '#d9b45c', shirt: '#4f7d3a', pants: '#4a3a2a' },
    principal: { skin: '#d8a47c', hair: '#8d8d8d', hairStyle: 'short', shirt: '#1d2f6b', pants: '#1d2f6b', extra: 'tie', tie: '#ffd21f', collar: '#f6f5f0', glasses: true },
    nadia: STUDENT('#1b1b1b', 'long', '#e8b48a', '#d64f6a'),
    s1: STUDENT('#3b2416', 'short', '#c58b62', '#1a47d6'),
    s2: STUDENT('#0b2c9c', 'hijab', '#e2ad84', '#3ecf8e'),
    s3: STUDENT('#1b1b1b', 'short', '#f0c8a8', '#ffd21f'),
    s4: STUDENT('#6a3b1f', 'long', '#d29a6e', '#8a5cc8'),
    s5: STUDENT('#1b1b1b', 'short', '#b97d55', '#d63a3a')
  };
  MG.PLAYER_LOOKS = [
    STUDENT('#2b1d14', 'short', '#e8b48a', '#ffd21f'),
    STUDENT('#1b1b1b', 'long', '#d9a27a', '#ffd21f'),
    STUDENT('#1a47d6', 'hijab', '#c58b62', '#ffd21f')
  ];

  /* x, y, type, name */
  const LITTER = [
    [24, 19, 'plastic', 'Plastic bottle'], [40, 28, 'paper', 'Crumpled worksheet'], [9, 13, 'food', 'Banana peel'],
    [52, 14, 'plastic', 'Plastic cup'], [10, 37, 'paper', 'Old event flyer'], [18, 42, 'food', 'Apple core'],
    [47, 41, 'plastic', 'Yoghurt cup'], [58, 34, 'paper', 'Paper bag'], [33, 39, 'food', 'Orange peel'],
    [59, 27, 'plastic', 'Plastic straw'], [4, 28, 'paper', 'Torn notebook page'], [62, 6, 'food', 'Half-eaten sandwich']
  ];
  const BOOKS = [[8, 45, 'Atlas of Indonesia', '#d64f4f'], [60, 44, 'Collected Poems', '#3f6dff'], [59, 9, 'A History of Art', '#3ecf8e']];
  const PLANTS = [[42, 38], [45, 43], [49, 35], [58, 37], [55, 44], [48, 40]];
  const FLAGS = [[3, 32], [23, 32], [23, 44], [3, 44], [13, 38]];

  MG.fresh = () => ({
    v: 1, name: 'Mentarian', look: 0, stage: 0, mp: 0, time: 0, x: 31, y: 45, dir: 3,
    litter: [], carry: [], sorted: 0, sortFirst: 0,
    cls: { math: 0, science: 0, english: 0, art: 0, pe: 0 },
    books: [], booksReturned: 0, can: false, watered: [], lunch: 0, id: 0, done: false
  });
  MG.pe = { active: false, t: 0, got: [] };

  /* ---------- the journal ---------- */
  const near = (list) => {
    const P = MG.player;
    return list.filter((e) => e && !e.hidden).sort((a, b) => Math.abs(a.x - P.x) + Math.abs(a.y - P.y) - (Math.abs(b.x - P.x) + Math.abs(b.y - P.y)))[0] || null;
  };
  const E = (id) => MG.ent(id);
  const ofKind = (pre) => MG.ents.filter((e) => e.id.startsWith(pre) && !e.hidden);
  MG.tasks = function () {
    const S = MG.S;
    return [
      { id: 'checkin', label: 'Check in with Kak Dinda', done: S.stage > 0, target: () => E('dinda') },
      { id: 'collect', label: 'Pick up litter around campus', n: S.litter.length, of: 12, done: S.litter.length >= 12, target: () => near(ofKind('lit')) },
      { id: 'sort', label: 'Sort it at the bins (courtyard)', n: S.sorted, of: 12, done: S.sorted >= 12, target: () => E('asep') },
      { id: 'math', label: 'Math class — Math Room', done: !!S.cls.math, target: () => E('budi') },
      { id: 'science', label: 'Science class — Science Lab', done: !!S.cls.science, target: () => E('sari') },
      { id: 'english', label: 'English class — English Room', done: !!S.cls.english, target: () => E('clara') },
      { id: 'art', label: 'Art class — Art Studio', done: !!S.cls.art, target: () => E('yosef') },
      { id: 'pe', label: 'PE class — Sports Field', done: !!S.cls.pe, target: () => (MG.pe.active ? near(ofKind('flag')) : E('andi')) },
      { id: 'books', label: 'Return the lost library books', n: S.booksReturned, of: 3, done: S.booksReturned >= 3, target: () => (S.books.length > S.booksReturned && !ofKind('book').length) || S.books.length > S.booksReturned + 1 ? E('rina') : near(ofKind('book')) || E('rina') },
      { id: 'plants', label: 'Water the garden plants', n: S.watered.length, of: 6, done: S.watered.length >= 6, target: () => (S.can ? near(MG.ents.filter((e) => e.id.startsWith('plant') && !e.wet)) : E('joko')) },
      { id: 'lunch', label: "Bring Coach Andi's lunch", done: S.lunch === 2, target: () => (S.lunch === 1 ? E('andi') : E('kantin')) },
      { id: 'id', label: 'Return the lost student ID', done: S.id === 2, target: () => (S.id === 1 ? E('nadia') : E('idcard') || E('nadia')) },
      { id: 'final', label: 'Final assembly — StuCo Hall', done: S.done, target: () => E('principal') }
    ];
  };
  MG.suggested = function () {
    const S = MG.S, t = MG.tasks(), open = t.filter((x) => !x.done);
    if (!open.length) return null;
    if (S.stage === 0) return t[0];
    if (open.length === 1) return open[0];
    if (MG.pe.active) return t.find((x) => x.id === 'pe');
    if (S.carry.length >= 4 || (S.carry.length && S.litter.length >= 12)) return t.find((x) => x.id === 'sort');
    return open.find((x) => x.id !== 'sort' && x.id !== 'final') || open[0];
  };

  /* ---------- helpers ---------- */
  const npc = (id, name, x, y, dir, look, talk, o = {}) => Object.assign({ id, kind: 'npc', name, x, y, tx: x, ty: y, dir, look, solid: true, interact: talk }, o);
  const notYet = (who) => say({ who, text: "Good morning! Have you checked in with Kak Dinda at the main gate yet? She'll give you your Mentarian Journal." });

  async function teach(id, who, intro, game, pass, after) {
    const S = MG.S;
    if (S.stage === 0) return notYet(who);
    if (S.cls[id]) return say({ who, text: after });
    const c = await ask(who, intro, ["Let's begin!", 'Maybe later']);
    if (c !== 0) return;
    const r = await MG.mini[game]();
    if (r.quit) return say({ who, text: 'No problem — come back whenever you are ready.' });
    if (r.pass) { S.cls[id] = 1; MG.addMP(50 + Math.max(0, r.bonus || 0), `${who.split(' ').pop()}'s class passed`); MG.save(); await say({ who, text: pass }); }
    else await say({ who, text: 'Not quite — every expert was once a beginner. Talk to me when you want another try.' });
  }

  async function sortLitter() {
    const S = MG.S;
    if (!S.carry.length) {
      if (S.sorted >= 12) return say({ who: 'Pak Asep', text: 'Every bin sorted, every corner clean. The campus shines because of you. Terima kasih!' });
      return say([{ who: 'Pak Asep', text: 'Wah, the campus is a little messy today…' }, { who: 'Pak Asep', text: 'If you see litter, pick it up and bring it here. Blue for recycling, yellow for paper, green for food waste.' }]);
    }
    const items = S.carry.map((i) => ({ i, type: LITTER[i][2], name: LITTER[i][3] }));
    const r = await MG.mini.sort(items);
    r.done.forEach((d) => { S.carry = S.carry.filter((x) => x !== d.i); S.sorted++; if (d.first) S.sortFirst++; S.mp += d.first ? 10 : 5; });
    if (r.done.length) MG.toast(`+${r.done.reduce((a, d) => a + (d.first ? 10 : 5), 0)} MP · ${r.done.length} sorted`);
    MG.save();
    if (S.sorted >= 12) await say({ who: 'Pak Asep', text: 'All twelve pieces sorted! A clean school is everyone\'s job — you just proved it.' });
    else if (r.done.length) await say({ who: 'Pak Asep', text: `Thank you! ${12 - S.sorted} more piece${12 - S.sorted === 1 ? '' : 's'} still out there somewhere.` });
  }

  /* ---------- PE: five flags in 75 seconds ---------- */
  function startPE() {
    MG.pe = { active: true, t: 75, got: [] };
    FLAGS.forEach(([x, y], k) => MG.ents.push({ id: 'flag' + k, kind: 'item', type: 'flag', x, y, pickup: (e) => {
      e.hidden = true; MG.pe.got.push(k); MG.burst(e.x, e.y, '#ffd21f'); MG.toast(`Flag ${MG.pe.got.length} / 5`);
      if (MG.pe.got.length >= 5) endPE(true);
    } }));
  }
  async function endPE(ok) {
    const left = MG.pe.t;
    MG.ents = MG.ents.filter((e) => !e.id.startsWith('flag'));
    MG.pe = { active: false, t: 0, got: [] };
    if (ok) {
      MG.S.cls.pe = 1; MG.addMP(50 + Math.round((left / 75) * 30), 'PE class passed'); MG.save();
      await say({ who: 'Coach Andi', text: `Fantastic hustle — ${Math.round(75 - left)} seconds! Remember: give your best, and cheer for everyone else's.` });
    } else await say({ who: 'Coach Andi', text: "Time! Catch your breath, drink some water, and talk to me when you're ready to try again." });
  }
  MG.questTick = function (dt) { if (MG.pe.active) { MG.pe.t -= dt; if (MG.pe.t <= 0) endPE(false); } };

  /* ---------- everyone on campus ---------- */
  MG.buildEntities = function () {
    const S = MG.S, L = [];
    const inHall = S.stage > 0;

    L.push(npc('dinda', 'Kak Dinda', inHall ? 33 : 31, inHall ? 5 : 43, 0, LOOK.dinda, async (e) => {
      if (S.stage === 0) {
        await say([
          { who: 'Kak Dinda', text: `Selamat pagi, ${S.name}! Welcome to MISJ. I'm Dinda, president of the Student Council.` },
          { who: 'Kak Dinda', text: "Today you'll find out what it really means to be a Mentarian." },
          { who: 'Kak Dinda', text: 'Mentarians respect everyone, take responsibility, and help without being asked.' },
          { who: 'Kak Dinda', text: "Here's your Mentarian Journal. Press J (or the Journal button) any time to see your tasks." },
          { who: 'Kak Dinda', text: 'Keep the campus clean, attend all five classes, and help the people around school.' },
          { who: 'Kak Dinda', text: 'When your journal is complete, meet me in the StuCo Hall at the top of the avenue. Good luck!' }
        ]);
        S.stage = 1; MG.addMP(10, 'Checked in'); MG.toast('Got: Mentarian Journal'); e.x = e.tx = 33; e.y = e.ty = 5; MG.save();
        return;
      }
      const t = MG.tasks().filter((x) => x.id !== 'final'), d = t.filter((x) => x.done).length;
      if (d === t.length) return say({ who: 'Kak Dinda', text: 'Your journal is complete! Talk to the Principal — the assembly is about to begin.' });
      const s = MG.suggested();
      return say({ who: 'Kak Dinda', text: `${d} of ${t.length} tasks done — keep going! Next, maybe: ${s ? s.label.toLowerCase() : 'explore'}.` });
    }, { marker: () => S.stage === 0 }));

    L.push(npc('principal', 'Principal', 31, 4, 0, LOOK.principal, async () => {
      const left = MG.tasks().filter((x) => x.id !== 'final' && !x.done);
      if (S.done) return say({ who: 'Principal', text: 'Remember: the next chapter is yours. Go write it.' });
      if (left.length) return say([{ who: 'Principal', text: `Welcome to the StuCo Hall, ${S.name}.` }, { who: 'Principal', text: `Your journal still has ${left.length} unfinished task${left.length > 1 ? 's' : ''}. Come back when it's complete — I'll be right here.` }]);
      await say([
        { who: 'Principal', text: `${S.name}, today you picked up what others walked past.` },
        { who: 'Principal', text: 'You showed up to every class, and you helped people who never asked you to.' },
        { who: 'Kak Dinda', text: 'Students have ideas. StuCo gives those ideas direction. And people like you turn them into action.' },
        { who: 'Principal', text: 'That is what a Mentarian is. Not a uniform — a choice you make every day.' },
        { who: 'Principal', text: 'Congratulations. The next chapter is yours.' }
      ]);
      S.done = true; MG.addMP(100, 'Final assembly'); MG.save(); MG.finale();
    }, { marker: () => S.stage > 0 && !S.done && MG.tasks().filter((x) => x.id !== 'final' && !x.done).length === 0 }));
    L.push(npc('m1', 'StuCo member', 28, 6, 0, LOOK.s3, () => say({ who: 'Raka · StuCo', text: 'The 12 StuCo departments plan everything from Spirit Week to the Zero-Waste Canteen. Want to join one day?' })));
    L.push(npc('m2', 'StuCo member', 35, 6, 0, LOOK.s2, () => say({ who: 'Ayu · StuCo', text: "Leadership isn't a title. It's what you do when nobody's watching." })));

    L.push(npc('asep', 'Pak Asep', 27, 27, 1, LOOK.asep, sortLitter, { marker: () => S.carry.length > 0 }));
    [['plastic', 24], ['paper', 25], ['food', 26]].forEach(([t, x]) => L.push({ id: 'bin-' + t, kind: 'item', type: 'bin-' + t, x, y: 27, solid: true, interact: sortLitter }));

    L.push(npc('budi', 'Pak Budi', 7, 4, 0, LOOK.budi, () => teach('math', 'Pak Budi', 'Good morning! Sit down, sit down. Six quick mental-math questions — get four right and you pass.', 'math', 'Excellent! Numbers are just patterns waiting to be noticed.', 'Keep practising your times tables — little and often!'), { marker: () => S.stage > 0 && !S.cls.math }));
    L.push(npc('sari', 'Bu Sari', 19, 4, 0, LOOK.sari, () => teach('science', 'Bu Sari', 'Safety goggles on! Watch the order the flasks glow, then repeat it. Science starts with careful observation.', 'science', 'Wonderful! Good scientists are patient and precise — just like you.', 'Always label your experiments and clean your station afterwards!'), { marker: () => S.stage > 0 && !S.cls.science }));
    L.push(npc('clara', 'Ms. Clara', 43, 4, 0, LOOK.clara, () => teach('english', 'Ms. Clara', 'Words are powerful. Unscramble the values that every Mentarian lives by.', 'english', 'Beautiful! Now the hard part — living those words every day.', 'Reading for twenty minutes a day changes everything. Try it!'), { marker: () => S.stage > 0 && !S.cls.english }));
    L.push(npc('yosef', 'Pak Yosef', 55, 4, 0, LOOK.yosef, () => teach('art', 'Pak Yosef', 'Art is about looking carefully. Copy my patterns exactly — every square counts.', 'art', 'Magnifique! You noticed every detail.', 'Creativity is intelligence having fun. Keep making things!'), { marker: () => S.stage > 0 && !S.cls.art }));

    L.push(npc('andi', 'Coach Andi', 24, 33, 0, LOOK.andi, async () => {
      if (S.lunch === 1) { S.lunch = 2; MG.addMP(50, 'Lunch delivered'); MG.save(); await say({ who: 'Coach Andi', text: "Is that my lunch?! I forgot it again. You're a lifesaver — terima kasih!" }); return; }
      if (S.stage === 0) return notYet('Coach Andi');
      if (S.cls.pe) return say({ who: 'Coach Andi', text: 'Teamwork beats talent when talent doesn\'t work together!' });
      if (MG.pe.active) return say({ who: 'Coach Andi', text: 'Go go go! Touch all five yellow flags!' });
      const c = await ask('Coach Andi', 'PE time! Five yellow flags around the field. Touch them all within 75 seconds. Hold Shift (or B) to sprint!', ['Ready!', 'Give me a minute']);
      if (c === 0) { startPE(); MG.toast('GO! 75 seconds'); }
    }, { marker: () => S.lunch === 1 || (S.stage > 0 && !S.cls.pe && !MG.pe.active) }));

    L.push(npc('rina', 'Bu Rina', 10, 22, 2, LOOK.rina, async () => {
      const n = S.books.length - S.booksReturned;
      if (n > 0) {
        S.booksReturned = S.books.length; MG.addMP(20 * n, `${n} book${n > 1 ? 's' : ''} returned`); MG.save();
        return say({ who: 'Bu Rina', text: S.booksReturned >= 3 ? 'All three books are home! Libraries only work when we look after them together. Thank you.' : `Oh, wonderful — thank you! ${3 - S.booksReturned} still missing. Maybe somewhere outdoors?` });
      }
      if (S.booksReturned >= 3) return say({ who: 'Bu Rina', text: 'Shh… a quiet library is a kind library.' });
      return say([{ who: 'Bu Rina', text: 'Shh… oh, hello! Three of our books went missing this week.' }, { who: 'Bu Rina', text: 'Students borrowed them and left them around school — the field, the garden, maybe the art studio. Could you bring them back?' }]);
    }, { marker: () => S.books.length > S.booksReturned }));

    L.push(npc('kantin', 'Ibu Kantin', 54, 19, 0, LOOK.kantin, async () => {
      if (S.lunch === 0) {
        const c = await ask('Ibu Kantin', "Nak, Coach Andi forgot his lunch again! Could you take it to him at the sports field?", ['Of course!', 'Not right now']);
        if (c === 0) { S.lunch = 1; MG.toast("Got: Coach Andi's lunch"); MG.save(); }
        return;
      }
      if (S.lunch === 1) return say({ who: 'Ibu Kantin', text: 'The sports field is down the avenue, on the left. Hurry before it gets cold!' });
      return say({ who: 'Ibu Kantin', text: 'Remember to say thank you and wipe your table after eating. Small things matter!' });
    }, { marker: () => S.lunch === 0 && S.stage > 0 }));

    L.push(npc('joko', 'Pak Joko', 41, 36, 1, LOOK.joko, async () => {
      if (!S.can) { S.can = true; MG.toast('Got: watering can'); MG.save(); return say([{ who: 'Pak Joko', text: 'Panas sekali today… the garden plants are thirsty.' }, { who: 'Pak Joko', text: 'Take this watering can and give all six dry plants a drink, ya?' }]); }
      const left = 6 - S.watered.length;
      if (left > 0) return say({ who: 'Pak Joko', text: `${left} plant${left > 1 ? 's' : ''} still thirsty. Look for the brown, droopy leaves.` });
      return say({ who: 'Pak Joko', text: 'Look how green it is now! Taking care of living things is part of being a good student too.' });
    }, { marker: () => S.stage > 0 && !S.can }));

    L.push(npc('nadia', 'Nadia', 54, 26, 0, LOOK.nadia, async () => {
      if (S.id === 1) { S.id = 2; MG.addMP(50, 'ID card returned'); MG.save(); return say({ who: 'Nadia', text: "My student ID! I've been looking everywhere. Thank you so much — you didn't have to do that." }); }
      if (S.id === 0) return say({ who: 'Nadia', text: "I lost my student ID somewhere around the courtyard this morning… if you find it, could you bring it to me?" });
      return say({ who: 'Nadia', text: 'Thanks again! I owe you one — see you at Spirit Week!' });
    }, { marker: () => S.id === 1 }));

    /* students walking around */
    const chat = (who, lines) => { let k = 0; return () => say({ who, text: lines[k++ % lines.length] }); };
    L.push(npc('s1', 'Bima', 23, 26, 0, LOOK.s1, chat('Bima', ['Did you know StuCo has 12 departments? Tech & Innovation built the school website!', 'I want to run for StuCo next year. Maybe you should too!']), { wander: [21, 24, 28, 28] }));
    L.push(npc('s2', 'Sinta', 44, 33, 0, LOOK.s2, chat('Sinta', ['The garden club composts our food waste. That\'s why sorting matters!', 'Pak Joko says plants grow best when someone cares about them. Same with people.']), { wander: [40, 31, 50, 34] }));
    L.push(npc('s3', 'Kevin', 40, 13, 0, LOOK.s3, chat('Kevin', ['Tip: hold Shift to run. But walk in real hallways, okay?', 'If you get lost, open your journal — the yellow arrow points to your next task.']), { wander: [35, 12, 46, 14] }));
    L.push(npc('s4', 'Laras', 14, 27, 1, LOOK.s4, chat('Laras', ["Shh… I'm studying for the Peer Study Marathon.", 'Teaching a friend is the best way to learn something yourself.'])));
    L.push(npc('s5', 'Reza', 12, 32, 0, LOOK.s5, chat('Reza', ['Coach Andi times everything. Even lunch.', "I'm training for Inter-House Sports Day. Go Blue House!"]), { wander: [5, 32, 21, 32] }));

    /* things to find */
    LITTER.forEach(([x, y, t, name], i) => {
      if (S.litter.includes(i)) return;
      L.push({ id: 'lit' + i, kind: 'item', type: 'litter-' + t, x, y, pickup: (e) => {
        e.hidden = true; S.litter.push(i); S.carry.push(i); MG.addMP(5, `${name} picked up`); MG.burst(x, y, '#ffffff');
        if (S.litter.length === 1) say({ who: '', text: `You picked up a ${name.toLowerCase()}. Bring litter to Pak Asep's bins in the courtyard to sort it.` });
        MG.save();
      } });
    });
    BOOKS.forEach(([x, y, title, color], i) => {
      if (S.books.includes(i)) return;
      L.push({ id: 'book' + i, kind: 'item', type: 'book', color, x, y, pickup: (e) => {
        e.hidden = true; S.books.push(i); MG.burst(x, y, color); MG.toast(`Found: "${title}"`);
        say({ who: '', text: `A library book: "${title}". Bu Rina in the library will want this back.` }); MG.save();
      } });
    });
    PLANTS.forEach(([x, y], i) => L.push({ id: 'plant' + i, kind: 'item', type: 'plant', x, y, solid: true, wet: S.watered.includes(i), interact: (e) => {
      if (e.wet) return say({ who: '', text: 'This plant looks happy and healthy now.' });
      if (!S.can) return say({ who: '', text: 'This plant looks dry and droopy. Maybe the gardener has a watering can.' });
      e.wet = true; S.watered.push(i); MG.addMP(10, `Plant watered (${S.watered.length}/6)`); MG.burst(x, y, '#8cc8f2'); MG.save();
    } }));
    if (S.id === 0) L.push({ id: 'idcard', kind: 'item', type: 'idcard', x: 38, y: 18, pickup: (e) => {
      e.hidden = true; S.id = 1; MG.burst(e.x, e.y, '#ffffff'); MG.save();
      say({ who: '', text: 'You found a student ID card: NADIA · Grade 10. Someone must be worried about it.' });
    } });
    return L;
  };

  /* first moments of a new game */
  MG.intro = () => say([
    { who: '', text: `It's a bright morning at Mentari Intercultural School Jakarta, and ${MG.S.name} has just arrived at the gate.` },
    { who: '', text: 'Move with WASD or the arrow keys (or the D-pad on a phone). Talk and interact with E, Space or A.' },
    { who: 'Kak Dinda', text: 'Hey! Over here — come say hi!' }
  ]);
})();
