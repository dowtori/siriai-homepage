/* ════════════════════════════════════════════════════════════════════════
   CREATOR CONTENTS — content sphere (canvas). No overlay, no carousel.
   브랜드(또는 구체 오브젝트) 활성화 시 → 관련(같은 브랜드) 타일들이 구체 안에서
   '눈에 보일 정도'로 커진다. 나머지는 작고 흐리게. 가느다란 선으로 연결.
   데이터: creator-cards.js (window.CREATOR_CARDS)
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  const DATA   = window.CREATOR_CARDS;
  const sec    = (document.getElementById('cvStage') && document.getElementById('cvStage').closest('section')) || document.getElementById('pb') || document.getElementById('creator');
  const stage  = document.getElementById('cvStage');
  const canvas = document.getElementById('cvCanvas');
  const menu   = document.getElementById('cvBrands');
  const descEl = document.getElementById('cvDesc');
  if(!DATA || !sec || !stage || !canvas || !menu) return;
  const ctx    = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  /* mobile: hover/tap-to-enlarge ('handover') is dropped — the sphere only auto-enlarges on its timer (matches the CSS ≤760px breakpoint) */
  const mqMobile = matchMedia('(max-width:760px)');

  const brands = DATA.brands;
  const byKey  = {}; brands.forEach(b=> byKey[b.key]=b);
  const flat=[]; brands.forEach(b=> b.cards.forEach(c=> flat.push(Object.assign({brand:b.key}, c))));
  function shuffled(arr, seed){ const a=arr.slice(); let s=seed||1;
    for(let i=a.length-1;i>0;i--){ s=(s*9301+49297)%233280; const j=Math.floor(s/233280*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  const imgCache={}; function getImg(src){ let im=imgCache[src]; if(im) return im; im=new Image(); im.decoding='async'; im.src=src; imgCache[src]=im; return im; }
  const markImg=getImg('assets/siriai-mark-ink.png');
  let sphereHover=false, coreOp=0;
  /* ── ambient idle life: ghost-hover a random brand + faint twinkles when the user is away ── */
  const AMB = { idle:1500, gap:[5000,8200], hold:1700, twGap:[900,1900], twDur:950 };
  let lastUserTs=performance.now();
  let ghostBrand=null, ghostUntil=0, ghostNext=performance.now()+2200, twNext=performance.now()+1500;
  let liveSeen=false, introGhostAt=0;
  function userPoke(){ lastUserTs=performance.now(); }
  const arand=(a,b)=> a+Math.random()*(b-a);

  /* ── tiles on a fibonacci sphere ── */
  const TILE_N = reduce ? 120 : 224;
  const SIZE = 1.4;   // global tile-size multiplier — the sphere reads as a full-page backdrop
  const order=[]; let pool=[];
  for(let i=0;i<TILE_N;i++){ if(!pool.length) pool=shuffled(flat, i+1); order.push(pool.pop()); }
  const GA=Math.PI*(3-Math.sqrt(5));
  const tiles=[];
  for(let i=0;i<TILE_N;i++){
    const card=order[i];
    const y=1-(i/(TILE_N-1))*2, r=Math.sqrt(Math.max(0,1-y*y)), th=GA*i;
    tiles.push({ card, brand:card.brand, px:!!card.px, img:null, src:card.tile,
      vx:Math.cos(th)*r, vy:y, vz:Math.sin(th)*r,
      base:9+((i*37)%5)*2.6, sd:((i*53)%TILE_N)/TILE_N*0.6, g:1, orig:false,
      _x:0,_y:0,_z:0,_w:0,_h:0,_a:0,_cx:0,_cy:0 });
  }

  /* ── mark ONE representative ('original') tile per unique card ──
     Only originals grow / brighten / connect on focus, so duplicate filler stays
     small in the background and the active cluster reads as unique works, not repeats.
     Each card appears once per shuffle-block (≈4× across the sphere); cycling the chosen
     block by the card's order spreads the representatives across every band. */
  (function(){
    const occ={};                                   // card.id -> [tile indices] in sphere order
    tiles.forEach((t,i)=>{ const id=t.card.id; (occ[id]||(occ[id]=[])).push(i); });
    flat.forEach((c,k)=>{ const ix=occ[c.id]; if(ix&&ix.length) tiles[ix[k%ix.length]].orig=true; });
  })();

  /* ── canvas sizing ── */
  let cssW=0, cssH=0, R=300, offX=0;
  function measure(){
    const r=stage.getBoundingClientRect();
    cssW=r.width; cssH=r.height;
    const dpr=Math.min(window.devicePixelRatio||1, 1);   // cap at 1× — crisp on hover-zoom, far lighter than retina
    canvas.width=Math.round(cssW*dpr); canvas.height=Math.round(cssH*dpr);
    canvas.style.width=cssW+'px'; canvas.style.height=cssH+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    R=Math.min(cssW*0.86, innerHeight*1.02)/2;   // full-bleed — the sphere fills the page like a backdrop, not a contained object
    offX=0;
  }

  /* ── rotation + intro ── */
  let ay=0.3, ax=-0.12, velY=reduce?0:0.0014, velX=0, tgtVX=0, tgtVY=reduce?0:0.0014;
  let intro=0, introStart=0; function easeOut(t){ return 1-Math.pow(1-t,3); }

  /* ── focus model ── */
  let hoverList=null, hoverTile=null, hoveredTile=null, locked=null, featured=null, featScale=0;
  function activeBrand(){ return hoverList||hoverTile||locked||ghostBrand; }
  /* the directly-hovered tile becomes its card's representative — hovering a duplicate grows THAT tile (and suppresses its far original, so no double-enlarge) */
  function isRep(t){ if(!locked && hoveredTile && t.card===hoveredTile.card) return t===hoveredTile; return t.orig; }
  function applyFocus(){
    const ab=activeBrand();
    [...menu.children].forEach(c=> c.classList.toggle('active', c.dataset.brand===ab));
    sec.classList.toggle('focus', !!ab);
    if(descEl){ if(featured){
        const g=descEl.querySelector('.cv-desc-group'), t=descEl.querySelector('.cv-desc-title');
        if(g&&t){ g.textContent=featured.group||''; t.textContent=featured.name||''; }
        else descEl.textContent=featured.name;
        descEl.classList.add('on'); } else descEl.classList.remove('on'); }
  }

  /* ── render: active-brand tiles grow to a visible size, others stay small + faint ── */
  const GROW=6.5;
  let frozen=false, raf=0, sortTick=0;
  function renderSphere(){
    const now=performance.now();
    if(!introStart){ introStart=now; ghostNext=now+1300; twNext=now+1600; }   // time ambient from first render, not page load
    if(intro<1) intro=reduce?1:easeOut(Math.min(1,(now-introStart)/1100));
    velY+=(tgtVY-velY)*0.05; velX+=(tgtVX-velX)*0.05;
    if(!locked){ ay+=velY; ax+=velX; ax=Math.max(-0.55,Math.min(0.55,ax)); }   // click freezes the sphere
    const cy=Math.cos(ay), sy=Math.sin(ay), cx=Math.cos(ax), sx=Math.sin(ax);
    // ambient idle life — ghost-hover a random brand + spawn faint twinkles while the user is away
    if(!reduce){
      // first appearance: fire one activation within ~0.6s of the sphere going live (don't wait for the idle gap)
      if(!liveSeen && sec.classList.contains('pb-live')){ liveSeen=true; introGhostAt=now+600; }
      if(introGhostAt && now>introGhostAt && !locked && !featured){
        ghostBrand=brands[(Math.random()*brands.length)|0].key; ghostUntil=now+AMB.hold+1100;
        lastUserTs=now-AMB.idle-100;   // treat as idle so this intro ghost persists, not instantly cleared
        applyFocus(); introGhostAt=0;
      }
      const idle = (now-lastUserTs)>AMB.idle && !locked && !featured;
      if(ghostBrand){
        if(now>ghostUntil || !idle){ ghostBrand=null; applyFocus(); ghostNext=now+arand(AMB.gap[0],AMB.gap[1]); }
      } else if(idle && now>ghostNext){
        ghostBrand=brands[(Math.random()*brands.length)|0].key; ghostUntil=now+AMB.hold; applyFocus();
      }
      if(idle && now>twNext){
        const vis=[]; for(let i=0;i<tiles.length;i++){ if(tiles[i]._z>-0.2) vis.push(i); }
        if(vis.length) tiles[vis[(Math.random()*vis.length)|0]]._tw=now;
        twNext=now+arand(AMB.twGap[0],AMB.twGap[1]);
      }
    }
    const ab=activeBrand();
    const breathe = reduce?0:Math.sin(now/2600)*0.006;
    const ox=cssW/2+offX, oy=innerHeight*0.48, rr=R*(0.84+0.16*intro+breathe);
    ctx.clearRect(0,0,cssW,cssH);
    for(const t of tiles){
      const x=t.vx*cy + t.vz*sy, z=-t.vx*sy + t.vz*cy, yv=t.vy*cx - z*sx, z2=t.vy*sx + z*cx;
      t._z=z2; const depth=(z2+1)/2, sc=0.5+depth*0.62;
      const on=ab && t.brand===ab && isRep(t);     // representative tile per card grows + brightens (hovered duplicate is promoted)
      const gt=on?GROW:1; t.g+=(gt-t.g)*0.12;
      t._w=t.base*sc*t.g*SIZE;
      const _im=t.img;
      t._h = (_im && _im.naturalWidth)
        ? t._w*(_im.naturalHeight/_im.naturalWidth)   // every tile takes its image's original ratio (no forced card shape)
        : t._w*1.28;
      t._cx=ox + x*rr; t._cy=oy + yv*rr; t._x=t._cx-t._w/2; t._y=t._cy-t._h/2;
      const li=Math.max(0,Math.min(1,(intro*1.6 - t.sd)/0.4));
      let a=(0.26+depth*0.74)*li;
      if(ab) a = on ? li : a*0.34;                 // active fully opaque (no transparency), others faded
      if(featScale>0.05) a*= (1-featScale*0.72);   // dim the cloud when one photo is featured
      t._a=a;
    }
    /* grown tiles draw on top — re-sort every frame while focused, else every 4th (depth drifts slowly) */
    if(ab || (sortTick=(sortTick+1)&3)===0) tiles.sort((p,q)=> (p.g>1.1?p._z+10:p._z) - (q.g>1.1?q._z+10:q._z));
    /* faint connection lines among the grown set — remember the hub (and its depth) where they converge */
    let hubX=0, hubY=0, hubZ=0, hubOn=false;
    if(ab){
      const pts=[]; let mx=0,my=0,mz=0;
      for(const t of tiles){ if(t.brand===ab && isRep(t) && t._z>-0.3){ pts.push(t); mx+=t._cx; my+=t._cy; mz+=t._z; } }
      if(pts.length>1){ mx/=pts.length; my/=pts.length; hubX=mx; hubY=my; hubZ=mz/pts.length; hubOn=true;
        ctx.lineWidth=0.8; ctx.strokeStyle='rgba(33,26,51,0.16)';
        ctx.beginPath(); for(const t of pts){ ctx.moveTo(mx,my); ctx.lineTo(t._cx,t._cy); } ctx.stroke(); }
    }
    /* tiny siriai mark at the convergence hub — drawn AT the cluster's depth so nearer photos occlude it */
    coreOp += ((hubOn&&!featured?1:0)-coreOp)*0.16;
    const MS=14, mAr=markImg.naturalHeight/markImg.naturalWidth;
    const canMark = coreOp>0.01 && hubOn && markImg.complete && markImg.naturalWidth;
    function drawHubMark(){ ctx.globalAlpha=coreOp; ctx.imageSmoothingEnabled=true;
      ctx.drawImage(markImg, hubX-MS/2, hubY-MS*mAr/2, MS, MS*mAr); ctx.globalAlpha=1; }
    let markDrawn=false;
    let smooth=true; ctx.imageSmoothingEnabled=true;
    for(const t of tiles){
      if(canMark && !markDrawn && t._z > hubZ){ drawHubMark(); smooth=true; markDrawn=true; }
      const im=t.img; if(!im || !im.complete || !im.naturalWidth) continue;
      let a=t._a;
      if(t._tw){ const e=1-(now-t._tw)/AMB.twDur; if(e<=0) t._tw=0; else a=Math.min(1, a+Math.sin(e*Math.PI)*0.5); }
      if(a<0.02) continue;                       // skip near-invisible tiles — one fewer drawImage
      if(t.px===smooth){ smooth=!t.px; ctx.imageSmoothingEnabled=smooth; }
      ctx.globalAlpha=a;
      if(t.card.fit==='contain'){           // logos: whole mark at original ratio, transparent padding (no squish)
        const iAR=im.naturalWidth/im.naturalHeight, dAR=t._w/t._h;
        let cw=t._w, ch=t._h; if(iAR>dAR) ch=t._w/iAR; else cw=t._h*iAR;
        ctx.drawImage(im, t._cx-cw/2, t._cy-ch/2, cw, ch);
      } else {                               // photos: cover-crop to the card, preserving aspect (no sideways squish)
        const iAR=im.naturalWidth/im.naturalHeight, dAR=t._w/t._h;
        let sx=0, sy=0, sw=im.naturalWidth, sh=im.naturalHeight;
        if(iAR>dAR){ sw=sh*dAR; sx=(im.naturalWidth-sw)/2; } else { sh=sw/dAR; sy=(im.naturalHeight-sh)/2; }
        ctx.drawImage(im, sx, sy, sw, sh, t._x, t._y, t._w, t._h);
      }
    }
    if(canMark && !markDrawn) drawHubMark();   // hub sits in front of the whole cluster
    ctx.globalAlpha=1;
    /* single featured photo — one big image (reference-style) */
    featScale += ((featured?1:0)-featScale)*0.28; if(featScale<0.002) featScale=0;
    if(featScale>0.01 && featured){
      const im=featured._img || (featured._img=getImg(featured.card));
      if(im.complete && im.naturalWidth){
        const iAR=im.naturalWidth/im.naturalHeight;          // featured shows the image at its ORIGINAL ratio
        const maxW=Math.min(cssW*0.42, 440), maxH=Math.min(innerHeight*0.6, 560);
        let hw, hh; if(iAR > maxW/maxH){ hw=maxW; hh=maxW/iAR; } else { hh=maxH; hw=maxH*iAR; }
        hw*=featScale; hh*=featScale;
        const hx=cssW/2+offX, hy=Math.min(cssH*0.5, innerHeight*0.52);
        const fx=hx-hw/2, fy=hy-hh/2;
        ctx.imageSmoothingEnabled=!featured.px; ctx.globalAlpha=Math.min(1,featScale*1.25);
        ctx.drawImage(im, fx, fy, hw, hh);
        // store bounds for click detection
        featBounds={x:fx, y:fy, w:hw, h:hh};
        // draw L/R chevrons on image + X to close
        if(featScale>0.7){
          const a=Math.min(1,(featScale-0.7)/0.3)*0.72;
          ctx.globalAlpha=a; ctx.strokeStyle='rgba(255,255,255,0.92)'; ctx.lineWidth=2; ctx.lineCap='round';
          // left chevron
          const lx=fx+22, my=fy+hh/2; ctx.beginPath(); ctx.moveTo(lx+9,my-11); ctx.lineTo(lx,my); ctx.lineTo(lx+9,my+11); ctx.stroke();
          // right chevron
          const rx=fx+hw-22; ctx.beginPath(); ctx.moveTo(rx-9,my-11); ctx.lineTo(rx,my); ctx.lineTo(rx-9,my+11); ctx.stroke();
        }
        ctx.globalAlpha=1;
      } else { featBounds=null; }
    } else { featBounds=null; }
  }
  function hit(px,py){
    let best=null, bestZ=-2;
    for(const t of tiles){ if(t._a<0.12) continue;
      if(px>=t._x&&px<=t._x+t._w&&py>=t._y&&py<=t._y+t._h&&t._z>bestZ){ best=t; bestZ=t._z; } }
    return best;
  }

  /* ── pointer: steer spin + hover-activate ── */
  let lastHover=null, featBounds=null;
  canvas.addEventListener('pointermove',e=>{
    userPoke();
    const r=canvas.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top;
    if(featured && featBounds){
      const {x,y,w,h}=featBounds;
      canvas.style.cursor=(px>=x&&px<=x+w&&py>=y&&py<=y+h)?'pointer':'default';
      return;
    }
    if(!reduce && !locked){ tgtVY=0.0014+((px-cssW/2)/(cssW/2))*0.014; tgtVX=-((py-cssH/2)/(cssH/2))*0.009; }
    const h=hit(px,py);
    sphereHover=true;
    canvas.style.cursor=h?'pointer':'default';
    if(!locked && !mqMobile.matches){ hoveredTile=h; const hb=h?h.brand:null; if(hb!==lastHover){ lastHover=hb; hoverTile=hb; applyFocus(); } }
  });
  canvas.addEventListener('pointerleave',()=>{ tgtVY=reduce?0:0.0014; tgtVX=0; sphereHover=false; hoveredTile=null; if(hoverTile){ hoverTile=null; lastHover=null; applyFocus(); } canvas.style.cursor='default'; });
  /* ── swipe tracking ── */
  let swipeX0=null;
  canvas.addEventListener('pointerdown',e=>{ swipeX0=e.clientX; userPoke(); });
  canvas.addEventListener('pointerup',e=>{
    const dx=e.clientX-(swipeX0??e.clientX); swipeX0=null;
    if(featured && featBounds && Math.abs(dx)>28){
      const brandCards=byKey[locked]?.cards||[];
      if(brandCards.length>1){
        const idx=brandCards.indexOf(featured), dir=dx<0?1:-1;
        featured=brandCards[(idx+dir+brandCards.length)%brandCards.length];
        applyFocus();
      }
    }
  });
  canvas.addEventListener('click',e=>{
    userPoke();
    if(mqMobile.matches) return;   // mobile: taps don't enlarge — auto-enlarge timer handles it
    const r=canvas.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top;
    if(featured && featBounds){
      const {x,y,w,h}=featBounds;
      if(px>=x&&px<=x+w&&py>=y&&py<=y+h){
        const brandCards=byKey[locked]?.cards||[];
        if(brandCards.length>1){
          const idx=brandCards.indexOf(featured), dir=px<x+w/2?-1:1;
          featured=brandCards[(idx+dir+brandCards.length)%brandCards.length];
          applyFocus(); return;
        }
      } else { featured=null; locked=null; applyFocus(); return; }
    }
    const h=hit(px,py);
    if(h){ locked=h.brand; featured=h.card; hoverTile=null; hoveredTile=null; applyFocus(); }
    else{ if(locked) locked=null; applyFocus(); }
  });

  /* ── right brand list (index / navigation) — desktop only; hidden on mobile via CSS ── */
  brands.forEach(b=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.className='cv-brand'; btn.dataset.brand=b.key; btn.textContent=b.label;
    btn.addEventListener('pointerenter',()=>{ hoverList=b.key; userPoke(); applyFocus(); });
    btn.addEventListener('pointerleave',()=>{ hoverList=null; applyFocus(); });
    btn.addEventListener('click',()=>{
      userPoke();
      if(locked===b.key&&featured){ locked=null; featured=null; }
      else{ locked=b.key; hoverTile=null;
        const bc=byKey[b.key]?.cards||[];
        featured=bc.length?bc[Math.floor(Math.random()*bc.length)]:null; }
      applyFocus();
    });
    menu.appendChild(btn);
  });
  document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if(featured){ featured=null; locked=null; } else if(locked){ locked=null; } applyFocus(); });

  /* ── lifecycle ── */
  let running=false;
  function nearView(){ const r=sec.getBoundingClientRect(); return r.bottom>-260 && r.top<innerHeight+260; }
  let lastDraw=0; const FRAME_MS=1000/40;
  function frame(ts){
    if(!nearView()){ running=false; return; }     // park while the section is scrolled away — frees the hero's main thread
    raf=requestAnimationFrame(frame);
    if((ts||0)-lastDraw < FRAME_MS) return;        // cap to ~40fps — the slow drift doesn't need 60
    lastDraw=ts||0;
    if(!frozen) renderSphere();
  }
  let imagesReady=false;
  function ensureImages(){ if(imagesReady) return; imagesReady=true; for(const t of tiles) t.img=getImg(t.src); }
  function startLoop(){ if(running) return; ensureImages(); running=true; raf=requestAnimationFrame(frame); }
  let rt; addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ measure(); if(nearView()) startLoop(); },150); });
  addEventListener('scroll',()=>{ if(nearView()) startLoop(); },{passive:true});
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden && nearView()) startLoop(); });
  addEventListener('load',measure);
  measure(); applyFocus(); if(nearView()) startLoop();
})();
