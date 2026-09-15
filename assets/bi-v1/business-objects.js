
/* ---- business-line objects — the hero's field, given a controlled silhouette --------------------
   Built only out of the hero's own primitives (warp / bloom / colormap / grain, straight from
   HERO_FIELD). Each slot supplies a DENSITY, exactly as the hero does: dense -> core, thin ->
   shoulder, none -> true black, so the canvas leaves no rectangle and the object floats in the
   page's own black.

   Hovering does not change the object. It only leans it a few pixels toward the pointer, slowly, and
   lets it come back. There is no settling and nothing to undo — an object that has to be unwound on
   hover will unwind everything it has accumulated, which is exactly what happened here.

   Nothing between two bodies is ever DRAWN. A bridge is not a shape, it is what happens when two
   metaballs are close enough that their fields close over the gap. That single fact carries both of
   the first two lines, and it is why they are the same function with different numbers:

     CONNECT    ONE DROP, seen from straight above, and the rings it sends out. A circle and a wave,
                and nothing else. A brand does not arrive everywhere at once by being loud: it lands in
                one place, on one person, and that is the thing that travels.
     ARCHITECT  the same primitive, ORDERED: a measured array of identical parts. Then the grid breaks,
                the parts drift and swell, and their fields close over each other WHERE THEY HAPPEN TO
                MEET — an uneven web, because that is what a network is. Then it runs as a wave.
     BUILD      three spheres whose combination changes. Their densities SUM the way the hero sums
                its two blooms, so every overlap doubles and turns pink on its own. Integration is
                literally the heat.
   ---------------------------------------------------------------------------------------------- */
(function(){
  function start(){
  var FIELD = window.__heroFieldGLSL;
  if(!FIELD) return;
  var VERT = 'attribute vec2 aPos;varying vec2 vUv;void main(){vUv=aPos*0.5+0.5;gl_Position=vec4(aPos,0.0,1.0);}';
  var HEAD = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform float uAmp;',
    'uniform float uLight;',                /* 1 = the light ramp; 0 = the page heat ramp */
    'uniform float uSE;',                   /* 1 = spheres (BUILD); 0 = metaballs (CONNECT/ARCHITECT) */
    'uniform vec3 uSpA;',                   /* BUILD: three spheres, x / y / radius */
    'uniform vec3 uSpB;',
    'uniform vec3 uSpC;',
    'uniform float uSpread;',               /* CONNECT/ARCHITECT: the outer bodies, this far out, */
    'uniform float uRadL;',                 /* the left one this big, */
    'uniform float uRadR;',                 /* the right one this big (0 for CONNECT — its right is a crowd), */
    'uniform float uRadM;',                 /* a body in the gap, this big (0 = absent), */
    'uniform float uCrowd;',                /* a crowd of marks, this present (0 = absent), */
    'uniform float uDrop;',                 /* the drop, this big, */
    'uniform float uRipple;',               /* and what it sent out, this far arrived, */
    'uniform float uArray;',                /* a measured array of parts, this present (0 = absent), */
    'uniform float uLink;',                 /* the array, this far broken out of its grid and linked up, */
    'uniform float uPull;',                 /* the whole of it, this far pulled together, */
    'uniform float uWave;',                 /* and this far into having become a wave. */
    ''
  ].join('\n');
  var OBJ = [
    '/* a sphere with a boundary that breathes, carrying its own volume — BUILD */',
    'float sph(vec2 q, vec2 c, float R){',
    '  float r = length(q - c) / R;',
    '  float body = 1.0 - smoothstep(0.78, 1.06, r);',
    '  float vol  = 1.0 - smoothstep(0.0, 1.30, r);',
    '  return body * (0.16 + 0.84 * vol);',
    '}',
    '/* a metaball: a body with an infinite tail, so two of them REACH for each other. This is the only',
    '   reason a bridge can exist without anyone drawing one. */',
    'float mball(vec2 q, vec2 c, float r){',
    '  if(r < 0.0005) return 0.0;',
    '  vec2 v = q - c;',
    '  return (r * r) / max(dot(v, v), r * r * 0.16);   /* capped: an uncapped 1/d^2 spikes at every centre */',
    '}',
    'float bodies(vec2 q){',
    '  float m = mball(q, vec2(-uSpread, 0.0), uRadL)',
    '          + mball(q, vec2( uSpread, 0.0), uRadR)',
    '          + mball(q, vec2( 0.0,     0.0), uRadM);   /* whoever stands between — present only for CONNECT */',
    '  if(uCrowd > 0.0005){',
    '    /* ONE DROP, FROM DIRECTLY ABOVE, AND WHAT IT SENDS OUT. That is the whole object: a circle and a',
    '       wave. It is also the claim, without illustrating it — a brand does not arrive everywhere at',
    '       once by being loud. It lands in one place, on one person, and that is what travels.',
    '       The rings are concentric and they travel outward on their own; the drop shrinks as they leave,',
    '       because what made them came out of it. */',
    '    float rr = length(q);',
    '    float dr = rr / max(uDrop, 0.0001);',
    '    float drop = exp(-dr * dr * 1.8);',
    '    float ph = rr * 40.0 - uTime * 2.4;   /* the rings just travel. Scaling this term to still them',
    '                                              rewound every second it had ever accumulated. */',
    '    float w = 0.5 + 0.5 * sin(ph);',
    '    w = w * w;                                                   /* soft bands. At the fourth power these were',
    '                                                                    hard thin lines — drawn, not rippled. */',
    '    float env = smoothstep(0.045, 0.165, rr)                     /* nothing rings inside the drop */',
    '              * (1.0 - smoothstep(0.24, 0.48, rr));              /* and it spends itself before the edge */',
    '    /* straight out, NOT through the metaball surface below. That threshold reads a field of summed',
    '       bodies, where values run 1..6; a drop is one normalised density and 1.0 is its maximum, so it',
    '       came out clipped to 0.44 and the whole section rendered nearly black. A drop is not a metaball',
    '       and has no business being surfaced like one. */',
    '    /* The rings stay well under the drop. On this colormap density IS brightness AND hue, so holding',
    '       them low does not merely dim them — it walks them back down the ramp to amber while the drop',
    '       keeps the orange. Which is the truth of it: the drop is the event, the rings are its echo, and',
    '       an echo is fainter than the thing and spends itself as it travels. */',
    '    float fade = 1.0 - smoothstep(0.12, 0.46, rr);',
    '    return max(drop, w * env * (0.17 + 0.29 * fade) * uRipple) * uCrowd;',
    '  }',
    '  if(uArray > 0.0005){',
    '    /* A MEASURED ARRAY: even spacing, aligned axes, identical parts. That is the whole of what reads',
    '       as technical here, and it needs no drawn line to do it — CONNECT is this same primitive',
    '       SCATTERED, ARCHITECT is it ORDERED. Human against engineered, in one shape language.',
    '       Then uLink breaks the grid: every part drifts off its own cell by its own fixed amount and',
    '       swells, so some fields close over each other and some never do. That irregularity IS the',
    '       network — a lattice where everything joins everything is a slab, and a slab is not a',
    '       structure. Nothing is drawn between them here either; proximity is the only mechanism.',
    '       Then uPull lays the web out along its own axis — NOT into a pile. Funnelling a network into',
    '       one point is the same mistake the two circles were: a network has no reason to collapse. It',
    '       straightens, and a straight chain of bodies and a wave are both horizontal bands, so one can',
    '       become the other without either of them ghosting through the middle. */',
    '    for(int i = 0; i < 4; i++){',
    '      for(int j = 0; j < 3; j++){',
    '        vec2 g = vec2((float(i) - 1.5) * 0.185, (float(j) - 1.0) * 0.185);',
    '        vec2 off = (vec2(hash(vec2(float(i), float(j)) + 1.7),',
    '                         hash(vec2(float(j), float(i)) + 8.3)) - 0.5) * 0.235;   /* fixed per part, never random per frame */',
    '        /* the target is the WAVE ITSELF, not a straight line on the way to it. Laying the parts out',
    '           flat first left a chain standing there with no wave on it, and that read as a fourth beat',
    '           nobody asked for. Sent onto the curve, the in-between shape simply does not exist. */',
    '        float tx = g.x * 1.15;',
    '        float tt = tx + 0.5;',
    '        float ty = sin(tt * 6.28318 * 1.55) * 0.150 * sin(tt * 3.14159) * 1.16;   /* the same curve the band uses */',
    '        vec2 c = mix(g + off * uLink, vec2(tx, ty), uPull);',
    '        m += mball(q, c, mix(0.029, 0.058, uLink) * uArray);',
    '      }',
    '    }',
    '  }',
    '  float surf  = smoothstep(0.55, 1.45, m);      /* the surface. where two bodies both reach, it closes over. */',
    '  float depth = smoothstep(1.00, 4.50, m);      /* a gentle lift toward the core — volume, without every',
    '                                                   body centre becoming its own hot spot */',
    '  float body = surf * (0.72 + 0.28 * depth);',
    '  if(uWave < 0.002) return body;',
    '  /* the fused body runs. ONE analytic band, dense on its line and dispersing off it — built out of a',
    '     chain of separate bodies it read as a caterpillar, because a chain is exactly what it was. */',
    '  float t = q.x + 0.5;',
    '  float ph = uTime * 0.62;',
    '  float env = sin(t * 3.14159);                                  /* dies at both ends, so it never hits the edge */',
    '  float base = sin(t * 6.28318 * 1.55) * 0.150;                  /* THE fixed silhouette */',
    '  float flow = (sin(t * 6.28318 * 2.70 + ph * 1.7) * 0.062',
    '             +  sin(t * 6.28318 * 1.05 - ph * 1.1) * 0.050)',
    '             ;',
    '  float sw = (base + flow) * env * 1.16;',
    '  float e = (q.y - sw) / 0.082;',
    '  float wave = exp(-e * e) * smoothstep(0.0, 0.11, t) * (1.0 - smoothstep(0.90, 1.0, t));',
    '  return mix(body, wave, uWave);',
    '}',
    'void main(){',
    '  vec2 q = warp(vUv - 0.5, 0.052);   /* the hero\'s own warp */',
    '  float d = uSE > 0.5',
    '    ? sph(q, uSpA.xy, uSpA.z) + sph(q, uSpB.xy, uSpB.z) + sph(q, uSpC.xy, uSpC.z)',
    '    : bodies(q);',
    '  vec3 col = uLight > 0.5 ? colormapLight(d * uAmp) : colormap(d * uAmp);',
    '  vec2 fc = vUv * uRes;',
    '  float gA = hash(fc * 0.58);',
    '  float gB = hash(fc * 0.31 + 19.0);',
    '  float grain = (gA * 0.55 + gB * 0.45) - 0.5;',
    '  float glum = max(col.r, max(col.g, col.b));',
    '  col += grain * (0.34 * smoothstep(0.0, 0.50, glum));   /* SILENT ON BLACK: no lit pixels outside the object,',
    '                                                            so the canvas leaves no rectangle on the page */',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');
  var FRAG = HEAD + FIELD + '\n' + OBJ;

  /* CONNECT — the outer two never move, and at this distance their fields reach 0.35 between them:
     under the 0.55 the surface needs, so they simply cannot touch. Only the body in the middle changes. */
  var CONNECT = [
    { spread:0.0, radL:0.0, radR:0.0, mid:0.0, crowd:1.0, drop:0.200, ripple:0.0, array:0.0, link:0.0, pull:0.0, wave:0.0 },   /* 01  the drop, whole. Nothing has happened yet. */
    { spread:0.0, radL:0.0, radR:0.0, mid:0.0, crowd:1.0, drop:0.112, ripple:0.6, array:0.0, link:0.0, pull:0.0, wave:0.0 },   /* 02  it lands, and the first ring leaves it */
    { spread:0.0, radL:0.0, radR:0.0, mid:0.0, crowd:1.0, drop:0.068, ripple:1.0, array:0.0, link:0.0, pull:0.0, wave:0.0 }    /* 03  one landing, and it is out across the whole surface */
  ];
  /* ARCHITECT — no third body. The two close on each other instead, and then run. */
  /* ARCHITECT is nothing but the array, all the way through. There are no two circles any more: they
     were a leftover from when this section was three separate steps, and the claim it carries now says
     NETWORK — funnelling twelve parts into two piles is the opposite of one. */
  var ARCH = [
    { spread:0.215, radL:0.0, radR:0.0, mid:0.0, crowd:0.0, drop:0.0, ripple:0.0, array:1.0, link:0.0, pull:0.0, wave:0.0 },   /* 01  the parts, measured out. Nothing is a structure yet. */
    { spread:0.215, radL:0.0, radR:0.0, mid:0.0, crowd:0.0, drop:0.0, ripple:0.0, array:1.0, link:1.0, pull:0.0, wave:0.0 },   /* 02  the grid breaks and the fields close over each other where they happen to meet — a network, uneven, because a network is */
    { spread:0.215, radL:0.0, radR:0.0, mid:0.0, crowd:0.0, drop:0.0, ripple:0.0, array:1.0, link:1.0, pull:1.0, wave:1.0 }    /* 03  and the whole web runs */
  ];
  /* BUILD — the same three spheres, recombined. x, y, radius. */
  var SE = [
    [[-0.100,-0.092, 0.212], [ 0.132, 0.110, 0.162], [-0.058, 0.152, 0.104]],  /* 01  apart, touching — distinct parts */
    [[-0.072,-0.048, 0.194], [ 0.082, 0.052, 0.178], [ 0.004, 0.130, 0.126]],  /* 02  slid together — intersections open up */
    [[-0.048, 0.004, 0.206], [ 0.048, 0.022, 0.202], [ 0.000,-0.030, 0.150]]   /* 03  one mass, its parts still legible inside */
  ];

  function build(cv){
    var gl = cv.getContext('webgl', {antialias:false, alpha:false, preserveDrawingBuffer:true});
    if(!gl){ cv.style.background='#000'; return null; }
    function sh(t,s){ var o=gl.createShader(t); gl.shaderSource(o,s); gl.compileShader(o);
      if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){ console.warn('orb shader:', gl.getShaderInfoLog(o)); return null; } return o; }
    var vs=sh(gl.VERTEX_SHADER,VERT), fsh=sh(gl.FRAGMENT_SHADER,FRAG);
    if(!vs||!fsh) return null;
    var pr=gl.createProgram(); gl.attachShader(pr,vs); gl.attachShader(pr,fsh); gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ console.warn('orb link:', gl.getProgramInfoLog(pr)); return null; }
    gl.useProgram(pr);
    var buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(pr,'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    var U={}; ['uRes','uTime','uAmp','uLight','uSE','uSpA','uSpB','uSpC','uSpread','uRadL','uRadR','uRadM','uCrowd','uDrop','uRipple','uArray','uLink','uPull','uWave']
      .forEach(function(n){ U[n]=gl.getUniformLocation(pr,n); });
    var set = cv.getAttribute('data-set') || 'a';
    var se = set === 's';
    gl.uniform1f(U.uSE, se ? 1.0 : 0.0);
    /* Three lines of work, three depths into the SAME two ramps. No new colour is invented for any of
       them, because the page has one lamp and they are only ever standing at different distances from it.
         CONNECT   the heat ramp, held on its amber shoulder: warm, and it never burns. This one is about
                   being known by people, not about making a thing.
         ARCHITECT the light ramp, run to the top: thinking, which happens before anything is made.
         BUILD     the heat ramp at full, so an overlap reaches pink. Integration is the heat. */
    gl.uniform1f(U.uLight, set === 'a' ? 1.0 : 0.0);
    gl.uniform1f(U.uAmp,   set === 'a' ? 1.0 : (set === 'c' ? 0.62 : 0.74));   /* .62: on this ramp brightness and hue share an
                                                                                  axis, and .50 capped the glow at .68 — too dim
                                                                                  for points. Pink does not start until ~.75. */
    var states = se ? SE : (set === 'c' ? CONNECT : ARCH);
    return {gl:gl, U:U, se:se, states:states,
            from:states[0], to:states[0], cur:states[0], mix:1, t0:0,
            idx:0, dir:1, holdUntil:0};
  }

  function lp(a,b,t){ return a+(b-a)*t; }
  function ez(t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }
  function cl(t){ return Math.max(0, Math.min(1, t)); }
  function blendSE(a,b,t){ return [0,1,2].map(function(i){ return [lp(a[i][0],b[i][0],t), lp(a[i][1],b[i][1],t), lp(a[i][2],b[i][2],t)]; }); }
  /* The two bodies have to ARRIVE before the wave can take over from them. Run both at once and you get
     a blob and a wave dissolving through each other. So the halves are staggered with a beat between
     them: the bodies finish closing, there is a moment where they are simply one mass, and only then
     does that mass start to run. Reversed, the wave settles back into the mass first. */
  /* One ease for everything. The halves used to be staggered so that the bodies arrived before the wave
     took over — that was for the two circles, which are long gone, and all it does now is hold a
     shape between 02 and 03 that nobody wants to see. The parts land ON the curve, so the wave has
     nothing to wait for. */
  function blendBod(a,b,t){
    var e = ez(t);
    return { spread:lp(a.spread,b.spread,e), radL:lp(a.radL,b.radL,e), radR:lp(a.radR,b.radR,e),
             mid:lp(a.mid,b.mid,e), crowd:lp(a.crowd,b.crowd,e),
             drop:lp(a.drop,b.drop,e), ripple:lp(a.ripple,b.ripple,e),
             array:lp(a.array,b.array,e), link:lp(a.link,b.link,e), pull:lp(a.pull,b.pull,e),
             wave:lp(a.wave,b.wave,e) };
  }

  var orbs=[];
  [].slice.call(document.querySelectorAll('canvas.orb-field')).forEach(function(cv){
    var r=build(cv); if(!r) return;
    r.cv=cv; r.host=cv.closest('.mv-biz-orb'); orbs.push(r);
  });
  if(!orbs.length) return;

  function size(o){
    var w=Math.max(1,Math.round(o.cv.getBoundingClientRect().width||440));
    var px=Math.round(w*Math.min(window.devicePixelRatio||1,1.5));
    if(o.cv.width!==px){ o.cv.width=px; o.cv.height=px; o.gl.viewport(0,0,px,px); }
    return px;
  }
  var vis=new WeakMap();
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ vis.set(e.target, e.isIntersecting); }); },{rootMargin:'240px'});
  orbs.forEach(function(o){ vis.set(o.host,false); io.observe(o.host); });

  /* The loop runs on a clock, and it runs FAST. Its job is not to be studied — the claim beside it is
     what gets read — it is to move enough, in the couple of seconds a reader is next to it, that they
     look at all. The first timing (1.6s per morph, then 2.1s of stillness) spent most of that couple
     of seconds holding perfectly still, which is how a thing gets ignored. 01 -> 03 now takes 2.3s
     rather than 7.4s, and it is moving about two thirds of the time. */
  var MORPH = 750, HOLD = 380;
  var T0=performance.now(), prev=T0;
  var lastFrame=performance.now(), animationClock=lastFrame;
  function frame(wallNow){
    var paused=document.hidden || document.documentElement.dataset.paused==="true" || matchMedia("(prefers-reduced-motion:reduce)").matches;
    if(!paused && orbs.some(function(o){return vis.get(o.host)})) animationClock+=Math.min(50,wallNow-lastFrame);
    lastFrame=wallNow;var now=animationClock;
    var dt=Math.min(0.05,(now-prev)/1000); prev=now;
    for(var k=0;k<orbs.length;k++){
      var o=orbs[k];
      if(!vis.get(o.host) || (paused && o.rendered)) continue;
      var px=size(o), gl=o.gl;

      if(o.mix < 1){
        o.mix = Math.min(1, (now - o.t0) / MORPH);
        o.cur = o.se ? blendSE(o.from, o.to, ez(o.mix)) : blendBod(o.from, o.to, o.mix);
        if(o.mix >= 1) o.holdUntil = now + HOLD;
      } else if(now >= o.holdUntil){
        /* back and forth rather than a hard cut 03 -> 01: the story reads in both directions, and a
           snap back to the start is the one edit nobody asked for. */
        if(o.idx === o.states.length - 1) o.dir = -1; else if(o.idx === 0) o.dir = 1;
        o.idx += o.dir;
        o.from = o.cur; o.to = o.states[o.idx]; o.mix = 0; o.t0 = now;
      }

      if(o.se){
        gl.uniform3f(o.U.uSpA, o.cur[0][0], o.cur[0][1], o.cur[0][2]);
        gl.uniform3f(o.U.uSpB, o.cur[1][0], o.cur[1][1], o.cur[1][2]);
        gl.uniform3f(o.U.uSpC, o.cur[2][0], o.cur[2][1], o.cur[2][2]);
      } else {
        gl.uniform1f(o.U.uSpread, o.cur.spread);
        gl.uniform1f(o.U.uRadL, o.cur.radL);
        gl.uniform1f(o.U.uRadR, o.cur.radR);
        gl.uniform1f(o.U.uRadM, o.cur.mid);
        gl.uniform1f(o.U.uCrowd, o.cur.crowd);
        gl.uniform1f(o.U.uDrop, o.cur.drop);
        gl.uniform1f(o.U.uRipple, o.cur.ripple);
        gl.uniform1f(o.U.uArray, o.cur.array);
        gl.uniform1f(o.U.uLink, o.cur.link);
        gl.uniform1f(o.U.uPull, o.cur.pull);
        gl.uniform1f(o.U.uWave, o.cur.wave);
      }
      gl.uniform2f(o.U.uRes,px,px);
      gl.uniform1f(o.U.uTime,(now-T0)/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
      o.rendered=true;o.host.dataset.ready="true";
    }
    requestAnimationFrame(frame);
  }

  orbs.forEach(function(o){ o.holdUntil = T0; });
  requestAnimationFrame(frame);

  /* Hover leans the object a few pixels toward the pointer and no more. It does not reset, it does not
     jump, and it does not have to be undone — the drift is the whole gesture. The easing lives in CSS
     so the object keeps following after the pointer has stopped, which is what makes it read as slow
     rather than as tracking. */
  if(!matchMedia('(pointer:coarse)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches){
    orbs.forEach(function(o){
      o.host.addEventListener('mousemove', function(e){
        var b = o.host.getBoundingClientRect();
        var dx = (e.clientX - b.left) / b.width - 0.5;
        var dy = (e.clientY - b.top) / b.height - 0.5;
        o.host.style.transform = 'translate3d(' + (dx * 13).toFixed(1) + 'px,' + (dy * 13).toFixed(1) + 'px,0)';
      });
      o.host.addEventListener('mouseleave', function(){ o.host.style.transform = ''; });
    });
  }
  }
  start();
})();



