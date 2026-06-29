/* heroAperture.js — Concept I: APERTURE
   An iris opens from pure black; a warm light core breathes at center;
   serif type is revealed through a soft radial bloom. */
(function () {
  window.SIRIAI = window.SIRIAI || {};

  window.SIRIAI.buildAperture = function (host) {
    host.innerHTML = `
      <div class="ap-scene">
        <div class="ap-core-wrap">
          <div class="ap-halo"></div>
          <div class="ap-core"></div>
          <div class="ap-ring"></div>
        </div>
        <div class="ap-iris"></div>
      </div>
      <div class="hero-stack ap-stack">
        ${SIRIAI.heroForeground()}
      </div>
      <div class="vignette"></div>
      <div class="scroll-hint"><span class="line"></span></div>
    `;
    SIRIAI.attachGrain(host);

    const scene = host.querySelector('.ap-scene');
    const iris = host.querySelector('.ap-iris');
    const stack = host.querySelector('.hero-stack');
    const coreWrap = host.querySelector('.ap-core-wrap');

    let plx = null, opened = false;

    function start() {
      // iris open
      void host.offsetWidth;
      setTimeout(() => { iris.classList.add('open'); }, 40);
      if (!opened) {
        opened = true;
        SIRIAI.revealIn([...host.querySelectorAll('.hero-kicker, .hero-h, .hero-sub, .cta-row, .hero-card')], { delay: 1100, step: 150 });
      }
      plx = SIRIAI.parallax(host, [
        { el: coreWrap, depth: 22 },
        { el: stack, depth: 8 },
      ]);
    }
    function stop() {
      if (plx) plx.stop();
    }
    return { start, stop };
  };
})();
