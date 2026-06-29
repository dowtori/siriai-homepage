/* ════════════════════════════════════════════════════════════════════════
   SIRIAI · Architecture for Insight → 시리아이의 しりあい
   One pinned stage, three movements driven by an honest scroll-down:

     ① DESCENT  (scroll)  — you fall through black toward a shaft of light.
                            It grows, blooms, and floods you into white; the
                            copy "Architecture / for Insight, AI" forms from it.
     ② BURST    (auto+lock)— the instant you arrive, the page holds you and
                            the copy goes 펑 — atoms scatter, then swarm onto
                            the content-sphere shell.  (You cannot slip past.)
     ③ SPHERE   (scroll)  — the live photo sphere takes over as a FULL-PAGE
                            backdrop; title + subcopy rise at the bottom.

   Re-arms whenever you leave and come back.
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  const stage  = document.getElementById('pbStage');
  const pin    = document.getElementById('pbPin');
  const dark   = document.getElementById('pbDark');
  const canvas = document.getElementById('pbReveal');
  const sec    = document.getElementById('pb');
  if(!stage || !pin || !dark || !canvas || !sec) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ── tunables ─────────────────────────────────────────────────────────── */
  const CFG = {
    lines:    ['Architecture', 'for Insight, AI'],
    sampleGap: 5,
    maxParticles: 1500,
    dotMin: 1.3, dotMax: 2.7,
    // refined, tonal — ink & indigo family, no rainbow
    palette: ['#211a33','#211a33','#211a33','#211a33','#2c2440','#37305a','#46406b','#241c34'],
    descEnd: 0.08,           // tiny manual lead-in — enter the dark, a faint seam cracks, then it ALL automates
    burstMs: 3800,           // auto sequence: open → white-out → copy → 펑 → sphere
    // burst timeline t∈[0,1]
    tIn:     [0.30, 0.46],
    tHold:   0.54,
    tBurst:  [0.54, 0.72],   // the 펑 — explosive scatter
    tSphere: [0.70, 0.90],   // swarm onto the shell
    tResolve:[0.87, 1.00],   // photo sphere takes over
    tDark:   [0.72, 0.95]    // the white descent-layer lifts away
  };

  /* ── geometry (mirrors creator-graph.js so the hand-off lines up) ─────── */
  let cssW=0, cssH=0, R=300, cx=0, cy=0;
  function geom(){
    const r = pin.getBoundingClientRect();
    cssW = r.width || innerWidth; cssH = r.height || innerHeight;
    const dpr = Math.min(window.devicePixelRatio||1, 1.5);
    canvas.width = Math.round(cssW*dpr); canvas.height = Math.round(cssH*dpr);
    canvas.style.width = cssW+'px'; canvas.style.height = cssH+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    R  = Math.min(cssW*0.86, innerHeight*1.02)/2;   // == creator-graph R (full-bleed)
    cx = cssW/2;
    cy = innerHeight*0.48;                          // == creator-graph oy
  }

  /* ── particles ───────────────────────────────────────────────────────── */
  let parts = [];
  const GA = Math.PI*(3-Math.sqrt(5));
  function rand(a,b){ return a+Math.random()*(b-a); }
  function buildText(){
    const off = document.createElement('canvas'), octx = off.getContext('2d');
    off.width = Math.max(2, Math.round(cssW)); off.height = Math.max(2, Math.round(cssH));
    // sized to read as a quiet, centred two-line statement (understated — keeps the mystique)
    const fs = Math.min(cssW*0.105, innerHeight*0.17, 168);
    octx.fillStyle='#000'; octx.textAlign='center'; octx.textBaseline='middle';
    // match the hero headline's type — var(--display): Helvetica Neue/Arimo, weight 500, tracking -0.022em
    octx.font = `500 ${fs}px 'Helvetica Neue','Arimo','Pretendard',sans-serif`;
    try{ octx.letterSpacing = (fs*-0.022)+'px'; }catch(_){}
    const lh = fs*1.06, n = CFG.lines.length;
    CFG.lines.forEach((ln,i)=> octx.fillText(ln, cx, cy + (i-(n-1)/2)*lh));
    const data = octx.getImageData(0,0,off.width,off.height).data, pts=[], gap=CFG.sampleGap;
    for(let y=0;y<off.height;y+=gap) for(let x=0;x<off.width;x+=gap)
      if(data[(y*off.width+x)*4+3] > 128) pts.push([x+rand(-1,1), y+rand(-1,1)]);
    if(pts.length > CFG.maxParticles){
      const keep=CFG.maxParticles, step=pts.length/keep, out=[];
      for(let i=0;i<keep;i++) out.push(pts[Math.floor(i*step)]); return out;
    }
    return pts;
  }
  function build(){
    const text = buildText();
    if(!text.length){ parts = []; return; }   // canvas not measured yet (0×0) — skip; frame() rebuilds once it's on-screen with real dimensions
    const N = text.length;
    parts = new Array(N);
    for(let i=0;i<N;i++){
      const yv = 1-(i/Math.max(1,N-1))*2, rr = Math.sqrt(Math.max(0,1-yv*yv)), th = GA*i;
      const ang = Math.random()*Math.PI*2, rad = R*rand(1.15, 2.7);
      parts[i] = {
        tx:text[i][0], ty:text[i][1],
        sx:Math.cos(th)*rr, sy:yv, sz:Math.sin(th)*rr,
        dx:cx+Math.cos(ang)*rad*rand(.7,1.3), dy:cy+Math.sin(ang)*rad*0.8*rand(.7,1.3),
        ph:Math.random()*Math.PI*2, amp:rand(8,34),
        col:CFG.palette[(Math.random()*CFG.palette.length)|0], r:rand(CFG.dotMin,CFG.dotMax)
      };
    }
  }

  /* ── easing ──────────────────────────────────────────────────────────── */
  function clamp01(v){ return v<0?0:v>1?1:v; }
  function win(p,a,b){ return clamp01((p-a)/(b-a)); }
  function smooth(t){ t=clamp01(t); return t*t*(3-2*t); }
  function easeIn(t){ return t*t; }
  function easeOut(t){ return 1-Math.pow(1-t,3); }
  function easeIO(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }

  /* ── ① manual lead-in: a brief scroll into the dark — only a faint seam of light cracks open ── */
  function paintDescent(d){
    dark.style.opacity = '1';
    dark.style.setProperty('--beam-o', (smooth(d)*0.55).toFixed(3));
    dark.style.setProperty('--open', (0.12*smooth(d)).toFixed(3));   // barely cracked
    dark.style.setProperty('--halo',  (smooth(d)*0.30).toFixed(3));
    dark.style.setProperty('--flood-s', '1.0');
    dark.style.setProperty('--flood', '0');
    ctx.clearRect(0,0,cssW,cssH);
  }

  /* ── ② automated sequence: white-out → copy → 펑 → sphere ─────────────── */
  let ay0 = 0.3;
  function paintBurst(tl, now){
    const tOpen   = smooth(win(tl, 0.00, 0.20));      // the aperture finishes opening (automated)
    const tFlood  = smooth(win(tl, 0.16, 0.38));      // then the open light floods to white (envelops you)
    const tIn     = smooth(win(tl, CFG.tIn[0], CFG.tIn[1]));
    const tBurst  = easeOut(win(tl, CFG.tBurst[0], CFG.tBurst[1]));
    const tSphere = easeIO(win(tl, CFG.tSphere[0], CFG.tSphere[1]));
    const resolve = smooth(win(tl, CFG.tResolve[0], CFG.tResolve[1]));

    // automated: finish opening the centre, bloom to a white-out, then lift the layer to reveal the live sphere
    dark.style.opacity = (1 - smooth(win(tl, CFG.tDark[0], CFG.tDark[1]))).toFixed(3);
    dark.style.setProperty('--open', (0.12 + tOpen*0.92).toFixed(3));
    dark.style.setProperty('--beam-o', (0.55 + smooth(win(tl,0,0.16))*0.45).toFixed(3));
    dark.style.setProperty('--halo', (0.30 + smooth(win(tl,0,0.22))*0.70).toFixed(3));
    dark.style.setProperty('--flood-s', (1.2 + tFlood*5.0).toFixed(3));
    dark.style.setProperty('--flood', tFlood.toFixed(3));

    ctx.clearRect(0,0,cssW,cssH);
    const cloudFade = 1 - resolve;
    if(cloudFade <= 0.001) return;

    const ay = ay0 + tl*2.6 + (now||0)*0.00006;
    const cyR=Math.cos(ay), syR=Math.sin(ay);
    const ax=-0.12, cxR=Math.cos(ax), sxR=Math.sin(ax);
    const rr = R*(0.82 + 0.16*tSphere);
    const time = (now||0)*0.001;

    // a flash ring at the instant of the burst — the 펑
    const br = win(tl, CFG.tBurst[0], CFG.tBurst[0]+0.15);
    if(br>0 && br<1){
      ctx.globalAlpha = (1-br)*0.45*cloudFade;
      ctx.strokeStyle = '#211a33'; ctx.lineWidth = 2.5*(1-br)+0.5;
      ctx.beginPath(); ctx.arc(cx, cy, br*R*1.5, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for(let i=0;i<parts.length;i++){
      const t=parts[i]; let x,y,a,sz=t.r;
      if(tl < CFG.tBurst[1]){
        const k=tBurst;
        x = t.tx + (t.dx-t.tx)*k + Math.sin(time*1.1+t.ph)*t.amp*k;
        y = t.ty + (t.dy-t.ty)*k + Math.cos(time*1.0+t.ph)*t.amp*k;
        a = (0.16 + 0.84*tIn) * (1 - 0.3*k);
      } else {
        const k=tSphere;
        const X = t.sx*cyR + t.sz*syR, Z = -t.sx*syR + t.sz*cyR;
        const Yv = t.sy*cxR - Z*sxR, Z2 = t.sy*sxR + Z*cxR;
        const depth=(Z2+1)/2, px=cx+X*rr, py=cy+Yv*rr, drift=(1-k);
        x = t.dx + (px-t.dx)*k + Math.sin(time*0.9+t.ph)*t.amp*drift;
        y = t.dy + (py-t.dy)*k + Math.cos(time*0.9+t.ph)*t.amp*drift;
        a = 0.30 + 0.70*depth; sz = t.r*(0.7+0.55*depth);
      }
      a *= cloudFade;
      if(a<0.02) continue;
      ctx.globalAlpha=a; ctx.fillStyle=t.col;
      ctx.beginPath(); ctx.arc(x,y,sz,0,6.2832); ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  /* ── scroll-lock (the resistance at arrival) ─────────────────────────── */
  let locked=false;
  const prevent = e=>{ e.preventDefault(); };
  const preventKeys = e=>{ if([32,33,34,35,36,38,40].indexOf(e.keyCode)>=0) e.preventDefault(); };
  function lockScroll(){
    if(locked) return; locked=true;
    addEventListener('wheel', prevent, {passive:false});
    addEventListener('touchmove', prevent, {passive:false});
    addEventListener('keydown', preventKeys, {passive:false});
  }
  function unlockScroll(){
    if(!locked) return; locked=false;
    removeEventListener('wheel', prevent, {passive:false});
    removeEventListener('touchmove', prevent, {passive:false});
    removeEventListener('keydown', preventKeys, {passive:false});
  }

  /* ── progress + state machine ────────────────────────────────────────── */
  function raw(){
    const r = stage.getBoundingClientRect();
    const span = r.height - innerHeight;
    if(span<=0) return 0;
    return clamp01(-r.top/span);
  }
  function inView(){
    const r = stage.getBoundingClientRect();
    return r.bottom > -200 && r.top < innerHeight + 200;
  }
  const chrome = ['#topbar','#bizcta','.top'].map(s=>document.querySelector(s)).filter(Boolean);
  let immOn=null;
  function immersive(on){
    if(immOn===on) return; immOn=on;
    document.body.classList.toggle('pb-immersive', on);
    chrome.forEach(el=>{
      el.style.transition='opacity .45s var(--ease)';
      el.style.opacity = on ? '0' : '';
      el.style.pointerEvents = on ? 'none' : '';
    });
  }
  let phase='descent', burstT0=0, raf=0, running=false, lockTimer=0, pulled=false, pulling=false, pullRAF=0, snapped=false, snapping=false, snapRAF=0;
  function startBurst(){
    snapping=false; cancelAnimationFrame(snapRAF);
    phase='burst'; burstT0=performance.now();
    clearTimeout(lockTimer);
    lockTimer = setTimeout(()=>{ if(phase==='burst') finishBurst(); }, CFG.burstMs+700);
  }
  function finishBurst(){
    phase='done'; clearTimeout(lockTimer);
    sec.classList.add('pb-live');
    dark.style.opacity='0';
    ctx.clearRect(0,0,cssW,cssH);
    immersive(false);
  }
  function rearm(){
    phase='descent'; clearTimeout(lockTimer);
    snapped=false; snapping=false; cancelAnimationFrame(snapRAF);
    sec.classList.remove('pb-live');
  }
  /* enter like the hero -> section-one transition: once committed to the descent,
     a single smooth snap carries you into the reveal (no forced per-frame pull, no input lock) */
  function maybeSnap(){
    if(snapped || snapping || phase!=='descent') return;
    const r = stage.getBoundingClientRect();
    if(r.top < innerHeight*0.7 && r.top > -innerHeight*0.15){
      snapped=true; snapping=true;
      const target = scrollY + r.top + (CFG.descEnd+0.01)*(r.height - innerHeight);
      window.scrollTo({ top: target, behavior: 'smooth' });
      const t0 = performance.now();
      cancelAnimationFrame(snapRAF);
      (function settle(){
        if(!snapping) return;
        if(Math.abs(scrollY - target) < 4 || performance.now()-t0 > 1300){ snapping=false; return; }
        snapRAF = requestAnimationFrame(settle);
      })();
    }
  }

  /* ── auto-pull: once the descent edge rises into view, smoothly draw the page down
        into the reveal (like the hero → section-one snap) — you don't manually scrub it ── */
  function maybePull(){
    if(pulled || pulling || phase!=='descent') return;
    const r = stage.getBoundingClientRect();
    if(r.top < innerHeight*0.85 && r.top > -innerHeight*0.35) startPull();
  }
  function startPull(){
    pulled=true; pulling=true;
    const r = stage.getBoundingClientRect();
    const span = r.height - innerHeight;
    const targetY = scrollY + r.top + (CFG.descEnd+0.006)*span;   // just past the burst trigger
    if(targetY - scrollY <= 6){ pulling=false; return; }
    let lastY = scrollY, lastT = performance.now();
    cancelAnimationFrame(pullRAF);
    (function step(now){
      if(!pulling || phase!=='descent'){ pulling=false; return; }
      const cur = window.scrollY;
      if(cur < lastY - 8){ pulling=false; return; }            // you scrolled up / resisted -> release, no force
      const dt = Math.min(40, now - lastT); lastT = now;
      const remaining = targetY - cur;
      if(remaining <= 2){ pulling=false; return; }
      let move = 0.46 * dt;                                    // ~460px/s -> a calm draw, not a yank
      if(remaining < 200) move *= (0.18 + 0.82*remaining/200); // ease out into the arrival
      const nextY = cur + Math.min(remaining, Math.max(0.5, move));  // always forward (down) from the LIVE position
      window.scrollTo(0, nextY);
      lastY = Math.max(lastY, nextY);
      pullRAF = requestAnimationFrame(step);
    })(lastT);
  }

  function frame(now){
    if(!inView()){
      running=false; immersive(false);
      // re-arm only when we've left via the TOP (off-screen), so a fresh DOWNWARD
      // scroll replays the reveal. Leaving via the bottom keeps the sphere ready,
      // so an UP-scroll back in shows the sphere — no reverse light-show.
      const rr = stage.getBoundingClientRect();
      if(phase==='done' && rr.top >= innerHeight) rearm();
      return;
    }
    raf=requestAnimationFrame(frame);
    if(!parts.length){ geom(); build(); }   // first on-screen frame: measure for real (parse-time geom can read 0×0), then build the copy
    const r = raw();
    if(phase==='descent'){
      maybeSnap();
      const d = clamp01(r/CFG.descEnd);
      paintDescent(d);
      immersive(snapping || d>0.10);
      if(r >= CFG.descEnd){ startBurst(); }
    } else if(phase==='burst'){
      immersive(true);
      const tl = clamp01((now - burstT0)/CFG.burstMs);
      paintBurst(tl, now);
      if(tl>=1) finishBurst();
    } else { // done — the sphere stays as the backdrop across the whole stage.
      // No reverse replay on up-scroll: it simply reads continuous with the prior section.
      immersive(false);
      const rr = stage.getBoundingClientRect();
      if(rr.top >= innerHeight*0.82) rearm();   // scrolled back up past the reveal -> ready to replay
    }
  }
  function start(){ if(running) return; running=true; raf=requestAnimationFrame(frame); }

  if(reduce){
    sec.classList.add('pb-live'); dark.style.opacity='0'; canvas.style.display='none'; return;
  }

  geom(); build();
  addEventListener('scroll', start, {passive:true});
  let rt; addEventListener('resize', ()=>{ clearTimeout(rt); rt=setTimeout(()=>{ geom(); build(); if(inView()) start(); }, 160); });
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && inView()) start(); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>{ geom(); build(); });
  if(inView()) start(); else paintDescent(0);
})();
