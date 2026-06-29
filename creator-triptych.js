/* creator-triptych.js — 크리에이터 협업 섹션: 단일 영상 → 세로 릴스 3분할
   · 데스크톱: 3 레인(세로 릴스) 나란히, 14개를 분배해 staggered 크로스페이드 순환
   · 모바일(<=760px): 1-up 가로 스와이프 캐러셀 (scroll-snap), 가운데 영상만 재생
   · 성능: 섹션이 화면에 들어올 때만 재생, 비가시 영상은 디코딩 안 함 */
(function () {
  const root = document.getElementById('creatorTri');
  if (!root) return;

  const SRC = [
    'assets/creator-vids/c01.mp4', 'assets/creator-vids/c02.mp4', 'assets/creator-vids/c03.mp4',
    'assets/creator-vids/c04.mp4', 'assets/creator-vids/c05.mp4', 'assets/creator-vids/c06.mp4',
    'assets/creator-vids/c07.mp4', 'assets/creator-vids/c08.mp4', 'assets/creator-vids/c09.mp4',
    'assets/creator-vids/c10.mp4', 'assets/creator-vids/c11.mp4', 'assets/creator-vids/c12.mp4',
    'assets/creator-vids/c13.mp4', 'assets/creator-vids/c14.mp4'
  ];

  const mqMobile = matchMedia('(max-width: 760px)');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');

  function mkVideo() {
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('preload', 'none');
    v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    return v;
  }
  function play(v) { if (!v) return; try { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (_) {} }
  function pause(v) { try { if (v) v.pause(); } catch (_) {} }

  let controller = null;
  let visible = false;

  /* ---------- 데스크톱: 3분할 트립틱 ---------- */
  function buildDesktop() {
    root.innerHTML = '';
    const grid = document.createElement('div'); grid.className = 'tri';
    const lanes = [[], [], []];
    SRC.forEach(function (s, i) { lanes[i % 3].push(s); });
    const ctls = [];

    lanes.forEach(function (pl) {
      const lane = document.createElement('div'); lane.className = 'tri-lane';
      let front = mkVideo(), back = mkVideo();
      lane.append(front, back);
      grid.append(lane);
      let idx = 0, busy = false;
      front.src = pl[0]; front.preload = 'auto'; front.classList.add('on');

      function advance() {
        if (busy || pl.length < 2) return; busy = true;
        const next = (idx + 1) % pl.length;
        back.src = pl[next]; back.preload = 'auto';
        let settled = false;
        const go = function () {
          if (settled) return; settled = true;
          try { back.currentTime = 0; } catch (_) {}
          play(back);
          back.classList.add('on'); front.classList.remove('on');
          const old = front;
          setTimeout(function () {
            pause(old); old.removeAttribute('src'); try { old.load(); } catch (_) {}
            old.preload = 'none'; busy = false;
          }, 1000);
          front = back; back = old; idx = next;
        };
        if (back.readyState >= 3) go();
        else { back.addEventListener('canplay', go, { once: true }); setTimeout(go, 2600); }
      }
      ctls.push({ getFront: function () { return front; }, advance: advance, startPlay: function () { play(front); } });
    });
    root.append(grid);

    let timers = [];
    return {
      play: function () {
        ctls.forEach(function (c) { c.startPlay(); });
        if (mqReduce.matches) return;
        timers.forEach(clearTimeout); timers = [];
        ctls.forEach(function (c, li) {
          const tick = function () { c.advance(); timers.push(setTimeout(tick, 5200 + Math.random() * 1600)); };
          timers.push(setTimeout(tick, 4200 + li * 1700)); // 레인별 시차
        });
      },
      stop: function () { timers.forEach(clearTimeout); timers = []; ctls.forEach(function (c) { pause(c.getFront()); }); },
      destroy: function () { timers.forEach(clearTimeout); timers = []; root.innerHTML = ''; }
    };
  }

  /* ---------- 모바일: 가로 스와이프 캐러셀 ---------- */
  function buildMobile() {
    root.innerHTML = '';
    const row = document.createElement('div'); row.className = 'tri-row';
    const cells = [];
    SRC.forEach(function (s) {
      const cell = document.createElement('div'); cell.className = 'tri-cell';
      const v = mkVideo(); cell.append(v); row.append(cell);
      cells.push({ cell: cell, v: v, s: s });
    });
    root.append(row);

    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          const c = cells.find(function (x) { return x.cell === e.target; });
          if (!c) return;
          if (e.isIntersecting && visible) { if (!c.v.src) { c.v.src = c.s; c.v.preload = 'auto'; } play(c.v); }
          else pause(c.v);
        });
      }, { root: row, threshold: 0.6 });
      cells.forEach(function (c) { io.observe(c.cell); });
    }
    return {
      play: function () { const f = cells[0]; if (f) { if (!f.v.src) { f.v.src = f.s; f.v.preload = 'auto'; } play(f.v); } },
      stop: function () { cells.forEach(function (c) { pause(c.v); }); },
      destroy: function () { if (io) io.disconnect(); root.innerHTML = ''; }
    };
  }

  function build() {
    if (controller) { controller.destroy(); controller = null; }
    controller = mqMobile.matches ? buildMobile() : buildDesktop();
    if (visible) controller.play();
  }

  /* 섹션 가시성 → 재생/정지 (오프스크린 디코딩 방지) */
  const section = document.getElementById('creator');
  if ('IntersectionObserver' in window && section) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        visible = e.isIntersecting;
        if (!controller) return;
        if (visible) controller.play(); else controller.stop();
      });
    }, { threshold: 0.15 }).observe(section);
  } else { visible = true; }

  build();
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', build);
  else if (mqMobile.addListener) mqMobile.addListener(build);

  /* 엄격한 자동재생 정책 대비: 첫 상호작용 시 한 번 더 시도 */
  const kick = function () {
    if (controller && visible) controller.play();
    window.removeEventListener('pointerdown', kick); window.removeEventListener('touchstart', kick);
  };
  window.addEventListener('pointerdown', kick, { once: true });
  window.addEventListener('touchstart', kick, { once: true });
})();
