/* ═══ Siriai · dot-matrix symbol renderer ═══
   Renders a halftone dot-field (from assets/dot/symbols-data.js) onto a canvas
   and animates it. State model:
     - inactive  → dots are grayscale (monochrome)
     - active    → dots tween to the symbol's own colour
   Subtle per-dot twinkle + a slow diagonal shimmer keep it alive (à la the
   dot-horse loop). Honours prefers-reduced-motion. Self-contained, no deps.

   API:
     const inst = DotSymbol.mount(canvasEl, symbolData, { pad, gray });
     inst.setActive(true|false);   // toggle colour
     inst.destroy();               // stop + cleanup
*/
(function () {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const GRAY = [40, 40, 46];                       // monochrome (inactive) tone
  const hex = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const lerp = (a, b, t) => a + (b - a) * t;

  function mount(canvas, sym, opt) {
    opt = opt || {};
    const ctx = canvas.getContext('2d');
    const col = hex(sym.color);
    const gray = opt.gray || GRAY;
    const dots = sym.dots;
    const pad = opt.pad != null ? opt.pad : 0.10;   // inner margin (fraction)
    const ph = dots.map(d => d[0] * 7.3 + d[1] * 11.7);
    const DPR = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, active = 0, target = 0, raf = 0, running = true;

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * DPR));
      canvas.height = Math.max(1, Math.round(H * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function frame(ts) {
      if (!running) return;
      const t = ts / 1000;
      active += (target - active) * 0.09;
      ctx.clearRect(0, 0, W, H);
      const S = Math.min(W, H), ox = (W - S) / 2, oy = (H - S) / 2;
      const o2 = S * pad, inner = S * (1 - pad * 2);
      const cr = lerp(gray[0], col[0], active) | 0;
      const cg = lerp(gray[1], col[1], active) | 0;
      const cb = lerp(gray[2], col[2], active) | 0;
      ctx.fillStyle = 'rgb(' + cr + ',' + cg + ',' + cb + ')';
      ctx.globalAlpha = 0.72 + 0.28 * active;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const x = ox + o2 + d[0] * inner;
        const y = oy + o2 + d[1] * inner;
        let r = d[2] * inner;
        if (!RM) {
          const tw = 1 + 0.11 * Math.sin(t * 2.1 + ph[i]);
          const sweep = 0.5 + 0.5 * Math.sin(t * 0.7 - (d[0] + d[1]) * 3.4);
          r *= tw * (1 + 0.10 * sweep);
        }
        r *= 1 + 0.05 * active;
        if (r < 0.35) continue;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    raf = requestAnimationFrame(frame);
    return {
      setActive(b) { target = b ? 1 : 0; },
      get active() { return target > 0.5; },
      destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); }
    };
  }
  window.DotSymbol = { mount };
})();
