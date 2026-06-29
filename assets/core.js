/* core.js — shared utilities for SIRIAI Hero Studio */
(function () {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.SIRIAI = window.SIRIAI || {};
  window.SIRIAI.reducedMotion = RM;

  /* ---- generate a monochrome film-grain data URL once ---- */
  function makeGrain(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }
  let grainURL = null;
  window.SIRIAI.attachGrain = function (hostEl) {
    if (!grainURL) grainURL = makeGrain(120);
    const g = document.createElement('div');
    g.className = 'grain';
    g.style.backgroundImage = `url(${grainURL})`;
    hostEl.appendChild(g);
    return g;
  };

  /* ---- pointer parallax: translate layers by a fraction of cursor offset ---- */
  /* layers: [{el, depth}]  depth ~ px of max travel */
  window.SIRIAI.parallax = function (hostEl, layers) {
    if (RM) return { stop() {} };
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, alive = true;
    function onMove(e) {
      const r = hostEl.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    }
    function tick() {
      if (!alive) return;
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      for (const L of layers) {
        L.el.style.translate =
          `${(-cx * L.depth).toFixed(2)}px ${(-cy * L.depth).toFixed(2)}px`;
      }
      raf = requestAnimationFrame(tick);
    }
    hostEl.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(tick);
    return {
      stop() {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        hostEl.removeEventListener('pointermove', onMove);
      }
    };
  };

  /* ---- verbatim hero copy (§7) — 2 lines each, monumental ---- */
  window.SIRIAI.MSGS = [
    ['Architecture for', '<em>Insight</em> with AI.'],
    ['Not tools.', '<em>Structure.</em>'],
    ['Not output.', '<em>Decisions.</em>'],
    ['Not deployment.', '<em>Design.</em>'],
  ];

  /* ---- product-style hero foreground (twelvelabs idiom):
     left lead (kicker + headline + sub + CTAs) + frosted glass decision-flow widget ---- */
  window.SIRIAI.heroForeground = function (opts) {
    opts = opts || {};
    const kicker = opts.kicker || 'SIRIAI — AI Consulting Studio';
    return `
      <div class="hero-lead">
        <p class="hero-kicker"><span class="k-dot"></span>${kicker}</p>
        <h1 class="hero-h">Architecture for<br><em>Insight</em> with AI.</h1>
        <p class="hero-sub">AI 기반 인사이트, 가장 쉽고 감각적으로.<br>도구가 아니라, 남는 구조를 설계합니다.</p>
        <div class="cta-row">
          <a class="btn btn-primary">바로 스케줄 예약하기<span class="arr">→</span></a>
          <a class="btn btn-ghost">사례 보기</a>
        </div>
      </div>
      <aside class="hero-card">
        <div class="hc-head"><span class="hc-dot"></span>Decision flow<span class="hc-badge">live</span></div>
        <div class="hc-flow">
          <span class="hc-step">Signal</span>
          <span class="hc-step">Judgment</span>
          <span class="hc-step">Action</span>
          <span class="hc-step">Record</span>
        </div>
        <div class="hc-foot">판단의 흐름을, 보이게.</div>
      </aside>`;
  };

  /* build the .hero-msgs markup with per-line mask wrappers */
  window.SIRIAI.heroMessages = function (specs) {
    specs = specs || window.SIRIAI.MSGS;
    const body = specs.map((lines, i) => {
      const ln = lines.map(l =>
        `<span class="ln"><span class="ln-i">${l}</span></span>`).join('');
      return `<div class="msg${i === 0 ? ' on' : ''}"><div class="hero-display">${ln}</div></div>`;
    }).join('');
    return `<div class="hero-msgs">${body}</div>`;
  };

  /* play a display's lines IN (rise from mask + unblur, staggered) */
  window.SIRIAI.playLines = function (displayEl, opts) {
    opts = opts || {};
    const ins = [...displayEl.querySelectorAll('.ln-i')];
    ins.forEach((el, k) => {
      if (RM) { el.style.transform = 'none'; el.style.opacity = '1'; el.style.filter = 'none'; return; }
      el.style.transition = 'none';
      el.style.transform = 'translateY(116%)';
      el.style.opacity = '0';
      el.style.filter = 'blur(6px)';
      void el.offsetWidth;
      setTimeout(() => {
        el.style.transition = 'transform 1.55s var(--ease-slow), opacity 1.2s var(--ease-slow), filter 1.2s var(--ease-slow)';
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
        el.style.filter = 'blur(0px)';
      }, (opts.delay || 0) + k * (opts.step || 150));
    });
  };
  /* play a display's lines OUT (sink upward) */
  window.SIRIAI.exitLines = function (displayEl) {
    if (RM) return;
    [...displayEl.querySelectorAll('.ln-i')].forEach((el, k) => {
      el.style.transition = 'transform 0.95s var(--ease-slow), opacity 0.7s var(--ease-slow), filter 0.7s var(--ease-slow)';
      el.style.transform = 'translateY(-118%)';
      el.style.opacity = '0';
      el.style.filter = 'blur(6px)';
    });
  };

  /* ---- hero message cycler: line-masked swap ---- */
  window.SIRIAI.cycleMessages = function (msgs, opts) {
    opts = opts || {};
    const holds = opts.holds || msgs.map((_, i) => (i === 0 ? 7000 : 5400));
    let i = 0, t1 = null, t2 = null, alive = true;
    msgs.forEach((m, k) => m.classList.toggle('on', k === 0));
    if (RM || msgs.length < 2) return { stop() {} };
    function next() {
      if (!alive) return;
      const cur = msgs[i];
      window.SIRIAI.exitLines(cur.querySelector('.hero-display'));
      t2 = setTimeout(() => {
        if (!alive) return;
        cur.classList.remove('on');
        i = (i + 1) % msgs.length;
        const nx = msgs[i];
        nx.classList.add('on');
        window.SIRIAI.playLines(nx.querySelector('.hero-display'), { step: 130 });
        t1 = setTimeout(next, holds[i]);
      }, 1050);
    }
    t1 = setTimeout(next, holds[0]);
    return { stop() { alive = false; if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); } };
  };

  /* ---- staggered reveal of elements (opacity + blur + rise) ---- */
  window.SIRIAI.revealIn = function (els, opts) {
    opts = opts || {};
    const base = opts.delay || 0;
    const step = opts.step || 220;
    els.forEach((el, k) => {
      if (RM) { el.style.opacity = '1'; el.style.filter = 'none'; el.style.transform = 'none'; return; }
      el.style.opacity = '0';
      el.style.filter = 'blur(12px)';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity 1.7s var(--ease-slow), filter 1.7s var(--ease-slow), transform 1.7s var(--ease-slow)';
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.filter = 'blur(0px)';
        el.style.transform = 'translateY(0)';
      }, base + k * step);
    });
  };
})();
