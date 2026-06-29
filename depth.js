/* SIRIAI — depth: hero recede + reveal + the mark-agent that delivers the deck CTA */
(function () {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  const hero    = document.getElementById('center');
  const stage   = document.querySelector('.stage');
  const biz     = document.getElementById('biz');
  const closing = document.getElementById('close');
  const mark    = document.getElementById('mark');
  const agent   = document.getElementById('agent');
  const bizcta  = document.getElementById('bizcta');
  const slot    = bizcta ? bizcta.querySelector('.slot') : null;
  const sigfill = document.getElementById('sigfill');
  const tiles   = [...document.querySelectorAll('.tile')];
  let revealEls = [...document.querySelectorAll('.reveal')];

  const START = 0.08;        // scroll fraction where the mark hands off to the agent
  const SPAN  = 0.92;        // travel completes by this fraction

  let lin = 0;               // raw linear cross progress (0..1)
  let startX = null, startY = null;   // captured headline-mark centre at handoff
  let agentTop = 0;                    // target opacity for the travelling orb

  function slotCenter() {
    if (!slot) return { x: innerWidth - 60, y: innerHeight - 60 };
    const r = slot.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function update() {
    const vh = innerHeight, sy = window.pageYOffset || document.documentElement.scrollTop || 0;
    lin = clamp(sy / (vh * 0.82), 0, 1);
    const p = easeInOut(lin);

    if (hero) {
      hero.style.transform = `scale(${1 - p * 0.19}) translateY(${-p * 74}px)`;
      hero.style.opacity = `${1 - easeInOut(clamp(lin / 0.7, 0, 1))}`;
      hero.style.filter = p > 0.005 ? `blur(${p * 18}px)` : 'none';
    }
    if (stage) {
      stage.style.opacity = `${1 - p * 0.96}`;
      stage.style.transform = `scale(${1 + p * 0.11})`;
      stage.style.filter = p > 0.005 ? `blur(${p * 9}px) saturate(${1 - p * 0.5})` : 'none';
    }
    if (biz) biz.style.setProperty('--cross', p.toFixed(3));

    // capture the headline mark's screen position once, at the moment of handoff
    if (lin > START) {
      if (startX === null && mark) {
        const r = mark.getBoundingClientRect();
        startX = r.left + r.width / 2;
        startY = r.top + r.height / 2;
      }
    } else {
      startX = startY = null;
    }

    // the floating deck CTA appears once we've committed to section two,
    // and steps aside near the closing block so it never fights the final CTA
    let nearEnd = false;
    if (closing) {
      const c = closing.getBoundingClientRect();
      if (c.top < vh * 0.62) nearEnd = true;
    }
    if (bizcta) bizcta.classList.toggle('show', lin > 0.62 && !nearEnd);
    // the orb is visible while it carries the deck CTA down; it steps aside near the closing block
    agentTop = (lin > START && !nearEnd) ? 1 : 0;
    // reveal once (closing block)
    for (let i = revealEls.length - 1; i >= 0; i--) {
      const r = revealEls[i].getBoundingClientRect();
      if (r.top < vh * 0.93 && r.bottom > 0) { revealEls[i].classList.add('in'); revealEls.splice(i, 1); }
    }

    // section-two signal thread: draws down as you travel the four practices
    if (sigfill && biz) {
      const r = biz.getBoundingClientRect();
      const span = Math.max(1, r.height - vh * 0.55);
      const prog = clamp((-r.top + vh * 0.45) / span, 0, 1);
      sigfill.style.height = (prog * 100).toFixed(2) + '%';
    }

    // influencer cascade: gentle scroll parallax per tile
    for (const t of tiles) {
      const sc = t.parentElement && t.parentElement.closest('.scene');
      if (!sc) continue;
      const rr = sc.getBoundingClientRect();
      const rel = (vh / 2) - (rr.top + rr.height / 2);
      const d = parseFloat(t.dataset.depth || '0');
      t.style.transform = `translateY(${(rel * d).toFixed(1)}px) rotate(var(--rot,0deg))`;
    }
  }

  /* ---------- the agent: a calm, sprung orb that carries the deck CTA into place ---------- */
  let ax = -100, ay = -100, av = 0;   // live position + opacity (spring state)
  function agentLoop() {
    const vh = innerHeight;
    const k = clamp((lin - START) / (SPAN - START), 0, 1);
    const e = easeInOut(k);

    let tx, ty, top;
    if (startX === null) {
      // resting in the hero: park (invisibly) on the headline mark so the handoff is seamless
      if (mark) { const r = mark.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2; }
      else { tx = innerWidth * 0.5; ty = vh * 0.46; }
      top = 0;
    } else {
      // travelling: the period flies from the headline down into the CTA's slot and docks there
      const s = slotCenter();
      tx = startX + (s.x - startX) * e;
      ty = startY + (s.y - startY) * e;
      top = agentTop;
    }

    if (av < 0.02) { ax = tx; ay = ty; }            // snap while hidden — no fly-in from a stale spot
    ax += (tx - ax) * 0.08; ay += (ty - ay) * 0.08; av += (top - av) * 0.1;

    agent.style.transform = `translate(${(ax - 17).toFixed(1)}px,${(ay - 17).toFixed(1)}px) scale(${(0.9 + av * 0.1).toFixed(3)})`;
    agent.style.opacity = av.toFixed(3);
    if (Math.abs(tx - ax) < 0.25 && Math.abs(ty - ay) < 0.25 && Math.abs(top - av) < 0.004) { agentRunning = false; return; }
    requestAnimationFrame(agentLoop);
  }
  let agentRunning = false;
  function startAgent() { if (agentRunning || RM || !agent) return; agentRunning = true; requestAnimationFrame(agentLoop); }

  if (RM) {
    revealEls.forEach(el => el.classList.add('in'));
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return;
  }

  /* ---------- threshold-pull: a little past the lip and the sheet takes over (Gemini idiom) ---------- */
  let snapping = false, snapTimer = 0;
  const THRESH = 0.26;
  function settleSnap() {
    if (snapping) return;
    const vh = innerHeight, sy = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (sy <= 2 || sy >= vh * 0.97) return;
    const target = (sy / vh) > THRESH ? Math.round(vh) : 0;
    if (Math.abs(target - sy) < 2) return;
    snapping = true;
    window.scrollTo({ top: target, behavior: 'smooth' });
    const t0 = performance.now();
    (function settleCheck() {
      const cur = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (Math.abs(cur - target) < 3 || performance.now() - t0 > 900) { snapping = false; return; }
      requestAnimationFrame(settleCheck);
    })();
  }

  let queued = false, lastY = window.pageYOffset || document.documentElement.scrollTop || 0;
  function onScroll() {
    if (!queued) { queued = true; requestAnimationFrame(() => { update(); queued = false; }); }
    startAgent();
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    const goingDown = y > lastY + 0.5;
    lastY = y;
    clearTimeout(snapTimer);
    if (goingDown && !snapping) snapTimer = setTimeout(settleSnap, 110);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
  setTimeout(update, 200);
  startAgent();
})();
