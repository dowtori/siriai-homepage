/* heroHorizon.js — Concept II: HORIZON  (recommended)
   A blade of amber light is drawn across the dark; it blooms upward and
   breathes. Type floats above. (Scroll-flood lives in the Full Page demo.) */
(function () {
  window.SIRIAI = window.SIRIAI || {};

  window.SIRIAI.buildHorizon = function (host) {
    host.innerHTML = `
      <div class="hz-scene">
        <div class="hz-sky"></div>
        <div class="hz-glow"></div>
        <div class="hz-sun-wrap"><div class="hz-sun"></div></div>
        <div class="hz-line"></div>
        <div class="hz-stars"></div>
      </div>
      <div class="hero-stack hz-stack">
        ${SIRIAI.heroForeground()}
      </div>
      <div class="vignette" style="background:radial-gradient(130% 120% at 50% 30%, transparent 38%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.94) 100%)"></div>
      <div class="scroll-hint"><span class="line"></span></div>
    `;
    SIRIAI.attachGrain(host);

    const scene = host.querySelector('.hz-scene');
    const line  = host.querySelector('.hz-line');
    const glow  = host.querySelector('.hz-glow');
    const sunWrap = host.querySelector('.hz-sun-wrap');
    const stack = host.querySelector('.hero-stack');
    let plx = null, played = false;

    function start() {
      if (!played) {
        played = true;
        if (SIRIAI.reducedMotion) {
          scene.classList.add('lit');
        } else {
          void host.offsetWidth;
          setTimeout(() => {
            line.classList.add('draw');
            setTimeout(() => scene.classList.add('lit'), 1400);
          }, 40);
        }
        SIRIAI.revealIn([...host.querySelectorAll('.hero-kicker, .hero-h, .hero-sub, .cta-row, .hero-card')], { delay: 1300, step: 150 });
      } else {
        scene.classList.add('lit');
      }
      plx = SIRIAI.parallax(host, [
        { el: sunWrap, depth: 20 },
        { el: stack, depth: 8 },
      ]);
    }
    function stop() {
      if (plx) plx.stop();
    }
    return { start, stop };
  };
})();
