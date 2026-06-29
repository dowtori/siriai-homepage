/* app.js — shell: view router, lifecycle, notes drawer, boot veil */
(function () {
  const S = window.SIRIAI;

  const VIEWS = [
    { id: 'aperture', label: 'I · Aperture', build: 'buildAperture' },
    { id: 'horizon',  label: 'II · Horizon', build: 'buildHorizon'  },
    { id: 'eclipse',  label: 'III · Eclipse', build: 'buildEclipse' },
    { id: 'full',     label: 'Full Page',     build: 'buildFullPage' },
  ];

  const stage    = document.getElementById('stage');
  const tabsEl   = document.getElementById('tabs');
  const notesBtn = document.getElementById('notesToggle');
  const panel    = document.getElementById('notesPanel');
  const panelBody= document.getElementById('notesBody');
  const boot     = document.getElementById('boot');
  const built    = {};       // id -> { el, ctrl }
  let current    = null;

  /* ---- build tabs ---- */
  VIEWS.forEach(v => {
    const b = document.createElement('button');
    b.className = 'tab';
    b.textContent = v.label;
    b.dataset.id = v.id;
    b.setAttribute('aria-selected', 'false');
    b.addEventListener('click', () => go(v.id));
    tabsEl.appendChild(b);
  });

  function ensureBuilt(v) {
    if (built[v.id]) return built[v.id];
    const el = document.createElement('div');
    el.className = 'view';
    el.dataset.id = v.id;
    el.setAttribute('data-screen-label', v.label);
    stage.appendChild(el);
    let ctrl = { start() {}, stop() {} };
    const fn = S[v.build];
    if (typeof fn === 'function') {
      const c = fn(el);
      if (c) ctrl = c;
    } else {
      el.innerHTML = '<div class="hero"><div class="hero-stack"><div class="hero-display">' + v.label + '</div></div></div>';
    }
    built[v.id] = { el, ctrl, v };
    return built[v.id];
  }

  function go(id) {
    const v = VIEWS.find(x => x.id === id);
    if (!v || (current && current.v.id === id)) return;
    const next = ensureBuilt(v);
    // stop & hide current
    if (current) {
      current.el.classList.remove('active');
      const prev = current;
      setTimeout(() => { if (prev !== current) prev.ctrl.stop(); }, 1150);
    }
    // show next
    next.el.classList.add('active');
    setTimeout(() => next.ctrl.start(), 30);
    current = next;
    // tabs
    [...tabsEl.children].forEach(b =>
      b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
    // notes
    renderNotes(id);
    closeNotes();
    // url
    history.replaceState(null, '', '#' + id);
  }

  /* ---- notes drawer ---- */
  function renderNotes(id) {
    const n = S.NOTES[id];
    if (!n) { panelBody.innerHTML = ''; notesBtn.querySelector('.idx').textContent = ''; return; }
    notesBtn.querySelector('.idx').textContent = n.idx;
    notesBtn.querySelector('.lbl').textContent = 'Design notes';
    let html = `<div class="notes-kicker">${n.kicker}</div>
      <div class="notes-title">${n.title}${n.rec ? '<span class="rec-badge">추천</span>' : ''}</div>
      <div class="notes-mood">${n.mood}</div>`;
    n.blocks.forEach(([h, p]) => {
      html += `<div class="notes-block"><h4>${h}</h4><p>${p}</p></div>`;
    });
    panelBody.innerHTML = html;
  }
  function openNotes()  { panel.classList.add('open'); }
  function closeNotes() { panel.classList.remove('open'); }
  notesBtn.addEventListener('click', () =>
    panel.classList.contains('open') ? closeNotes() : openNotes());
  document.getElementById('notesClose').addEventListener('click', closeNotes);

  /* ---- keyboard nav ---- */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNotes();
    if (!current) return;
    const i = VIEWS.findIndex(x => x.id === current.v.id);
    if (e.key === 'ArrowRight') go(VIEWS[(i + 1) % VIEWS.length].id);
    if (e.key === 'ArrowLeft')  go(VIEWS[(i - 1 + VIEWS.length) % VIEWS.length].id);
  });

  /* ---- boot ---- */
  function launch() {
    const initial = (location.hash || '#aperture').slice(1);
    const start = VIEWS.find(v => v.id === initial) ? initial : 'aperture';
    go(start);
    setTimeout(() => boot.classList.add('gone'), S.reducedMotion ? 200 : 1700);
  }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]).then(launch);
  } else {
    launch();
  }
})();
