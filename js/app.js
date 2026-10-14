/* ==========================================================================
   MISJ STUCO — START
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SC, C = window.STUCO_CONTENT;
  if (!SC || !C) { console.error('StuCo: content/content.js or js/core.js failed to load.'); return; }

  SC.render(C);
  SC.initSmooth();
  SC.initCursor();
  SC.initAnchors();
  SC.initMenu();
  SC.initScenes();
  SC.initDepartments();
  if (window.MG && MG.initTeaser) MG.initTeaser();
  SC.reveal(document);
  SC.refresh();
  SC.onFrame(SC.tick);
  SC.start();
  SC.watchLayout();

  /* arrival: wait for the fonts so the first frame is the designed one */
  let started = false;
  const arrive = () => {
    if (started) return;
    started = true;
    document.documentElement.classList.add('loaded');
    SC.refresh();
    SC.heroIntro();
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrive);
  setTimeout(arrive, 2500);
  addEventListener('load', () => SC.refresh());
})();
