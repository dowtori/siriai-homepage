/* heroEclipse.js — Concept III: ECLIPSE
   The light core is occluded by a dark disc; only the corona leaks out.
   A bright highlight travels the rim; faint lens-flare streaks drift. */
(function () {
  window.SIRIAI = window.SIRIAI || {};

  window.SIRIAI.buildEclipse = function (host) {
    host.innerHTML = `
      <div class="ec-scene">
        <div class="ec-glow"></div>
        <div class="ec-flare ec-flare-1"></div>
        <div class="ec-flare ec-flare-2"></div>
        <div class="ec-orb-wrap">
          <div class="ec-orb">
            <div class="ec-corona"></div>
            <div class="ec-arc"></div>
            <div class="ec-disc"></div>
            <div class="ec-coord">N 37.5665°&nbsp;&nbsp;·&nbsp;&nbsp;E 126.9780°</div>
          </div>
        </div>
      </div>
      <div class="hero-stack ec-stack">
        ${SIRIAI.heroForeground()}
      </div>
      <div class="vignette"></div>
      <div class="scroll-hint"><span class="line"></span></div>
    `;
    SIRIAI.attachGrain(host);

    const scene = host.querySelector('.ec-scene');
    const orbWrap = host.querySelector('.ec-orb-wrap');
    const stack = host.querySelector('.hero-stack');
    let plx = null, played = false;

    function start() {
      void host.offsetWidth;
      setTimeout(() => scene.classList.add('lit'), 40);
      if (!played) {
        played = true;
        SIRIAI.revealIn([...host.querySelectorAll('.hero-kicker, .hero-h, .hero-sub, .cta-row, .hero-card')], { delay: 1000, step: 150 });
      }
      plx = SIRIAI.parallax(host, [
        { el: orbWrap, depth: 26 },
        { el: stack, depth: 8 },
      ]);
    }
    function stop() {
      if (plx) plx.stop();
    }
    return { start, stop };
  };
})();
