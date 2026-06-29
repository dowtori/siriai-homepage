/* ════════════════════════════════════════════════════════════════════════
   legal-modal.js — 약관/개인정보 본문을 "모달로 올라오는" 형태로 표시.
   푸터·본문의 Terms.html / Privacy.html 링크 클릭을 가로채 페이지 이동 없이
   현재 페이지 위로 본문을 fetch 해서 띄운다. JS 미동작 시엔 그냥 링크 이동(폴백).
   v2 + 모든 서브페이지에 공용으로 로드.
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  if (window.__legalModalInit) return; window.__legalModalInit = true;

  const TARGETS = { 'terms.html':'Terms.html', 'privacy.html':'Privacy.html' };
  function targetFor(a){
    if(!a) return null;
    let path;
    try { path = new URL(a.href, location.href).pathname.split('/').pop().toLowerCase(); }
    catch(e){ return null; }
    return TARGETS[path] || null;
  }

  /* ── styles (self-contained; inherits host tokens, falls back if absent) ── */
  const css = `
  .legal-modal[hidden]{display:none}
  .legal-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;
    --lm-ink:var(--ink,#211a33);--lm-paper:var(--paper,#f3eee2);
    --lm-ink2:var(--ink-2,rgba(33,26,51,.66));--lm-ink3:var(--ink-3,rgba(33,26,51,.46));
    --lm-line:var(--line,rgba(33,26,51,.13));--lm-accent:var(--accent,#2a6fdb);
    --lm-paper2:var(--paper-2,#efe8d8);
    --lm-display:var(--display,'Helvetica Neue','Arimo','Pretendard',sans-serif);
    --lm-grotesk:var(--grotesk,'Helvetica Neue','Arimo','Pretendard',sans-serif);
    --lm-sans:var(--sans,'Pretendard',system-ui,sans-serif);
    --lm-mono:var(--mono,'JetBrains Mono','Arimo','Pretendard',ui-monospace,monospace);
    --lm-ease:var(--ease,cubic-bezier(0.22,1,0.36,1))}
  @media (min-width:640px){.legal-modal{align-items:center}}
  html.legal-modal-open{overflow:hidden}
  .legal-modal__backdrop{position:absolute;inset:0;background:rgba(20,15,33,.46);
    -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
    opacity:0;transition:opacity .4s var(--lm-ease)}
  .legal-modal.is-open .legal-modal__backdrop{opacity:1}
  .legal-modal__panel{position:relative;display:flex;flex-direction:column;
    width:min(760px,100%);max-height:92vh;background:#fff;
    border-radius:26px 26px 0 0;
    box-shadow:0 -30px 80px -34px rgba(33,26,51,.55),0 24px 70px -40px rgba(33,26,51,.5);
    transform:translateY(34px);opacity:0;
    transition:transform .52s var(--lm-ease),opacity .4s var(--lm-ease);overflow:hidden}
  @media (min-width:640px){.legal-modal__panel{border-radius:26px;max-height:86vh}}
  .legal-modal.is-open .legal-modal__panel{transform:none;opacity:1}
  .legal-modal__head{position:relative;display:flex;align-items:flex-start;justify-content:space-between;
    gap:20px;padding:26px clamp(22px,4vw,40px) 18px;border-bottom:1px solid var(--lm-line);flex:none;
    background:linear-gradient(180deg,rgba(243,238,226,.55),rgba(255,255,255,0))}
  .legal-modal__eyebrow{display:inline-flex;align-items:center;gap:9px;font-family:var(--lm-grotesk);
    font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--lm-ink3);margin-bottom:9px}
  .legal-modal__eyebrow::before{content:'';width:20px;height:1px;background:var(--lm-ink3)}
  .legal-modal__headtext{flex:1 1 auto;min-width:0}
  .legal-modal__title{font-family:var(--lm-display);font-weight:600;font-size:clamp(21px,3vw,28px);
    letter-spacing:-0.02em;color:var(--lm-ink);line-height:1.12;word-break:keep-all;text-wrap:balance}
  .legal-modal__close{flex:none;width:40px;height:40px;border-radius:50%;border:1px solid var(--lm-line);
    background:#fff;color:var(--lm-ink);cursor:pointer;display:grid;place-items:center;
    transition:background .25s,border-color .25s,transform .35s var(--lm-ease)}
  .legal-modal__close:hover{background:var(--lm-ink);color:#fff;border-color:var(--lm-ink);transform:rotate(90deg)}
  .legal-modal__body{overflow-y:auto;overscroll-behavior:contain;
    padding:clamp(24px,4vw,40px) clamp(22px,4vw,40px) clamp(30px,5vw,48px);-webkit-overflow-scrolling:touch}
  .legal-modal__prose{max-width:none}
  .legal-modal__prose .meta{font-size:13px;color:var(--lm-ink3);margin-bottom:30px;
    font-family:var(--lm-sans);letter-spacing:.02em}
  .legal-modal__prose section{padding:4px 0 26px}
  .legal-modal__prose section:last-child{padding-bottom:0}
  .legal-modal__prose h2{font-family:var(--lm-display);font-weight:600;font-size:clamp(18px,2vw,23px);
    letter-spacing:-0.02em;margin-bottom:13px;display:flex;gap:13px;align-items:baseline;color:var(--lm-ink);word-break:keep-all}
  .legal-modal__prose h2 .no{font-family:var(--lm-mono);font-size:12px;color:var(--lm-accent);
    font-weight:500;letter-spacing:0;flex:none}
  .legal-modal__prose h3{font-family:var(--lm-grotesk);font-weight:600;font-size:16px;margin:20px 0 7px;
    letter-spacing:-0.01em;color:var(--lm-ink)}
  .legal-modal__prose p{font-size:15px;line-height:1.72;color:var(--lm-ink2);margin-bottom:13px;letter-spacing:-0.003em;word-break:keep-all;text-wrap:pretty}
  .legal-modal__prose ul{margin:0 0 15px;padding-left:0;list-style:none}
  .legal-modal__prose li{position:relative;font-size:15px;line-height:1.7;color:var(--lm-ink2);
    padding-left:21px;margin-bottom:8px;word-break:keep-all}
  .legal-modal__prose li::before{content:'';position:absolute;left:4px;top:.7em;width:6px;height:6px;
    border-radius:50%;background:var(--lm-ink3)}
  .legal-modal__prose strong{color:var(--lm-ink);font-weight:600}
  .legal-modal__prose .tbl{border:1px solid var(--lm-line);border-radius:14px;overflow:hidden;margin:8px 0 18px}
  .legal-modal__prose table{width:100%;border-collapse:collapse;font-size:14px}
  .legal-modal__prose th,.legal-modal__prose td{text-align:left;padding:12px 15px;
    border-bottom:1px solid var(--lm-line);vertical-align:top;line-height:1.55}
  .legal-modal__prose th{background:var(--lm-paper);font-weight:600;color:var(--lm-ink);font-size:12.5px}
  .legal-modal__prose tr:last-child td{border-bottom:0}
  .legal-modal__prose td{color:var(--lm-ink2)}
  .legal-modal__prose a{color:var(--lm-accent);text-decoration:none;border-bottom:1px solid var(--lm-line);
    transition:border-color .25s}
  .legal-modal__prose a:hover{border-bottom-color:var(--lm-accent)}
  @media (prefers-reduced-motion:reduce){
    .legal-modal__panel,.legal-modal__backdrop{transition:opacity .2s linear}
    .legal-modal__panel{transform:none}
  }`;
  const style = document.createElement('style');
  style.id = 'legal-modal-style'; style.textContent = css;
  document.head.appendChild(style);

  /* ── DOM ── */
  const root = document.createElement('div');
  root.className = 'legal-modal'; root.hidden = true;
  root.innerHTML =
    '<div class="legal-modal__backdrop" data-close></div>' +
    '<div class="legal-modal__panel" role="dialog" aria-modal="true" aria-labelledby="lmTitle">' +
      '<header class="legal-modal__head">' +
        '<div class="legal-modal__headtext">' +
          '<span class="legal-modal__eyebrow">Legal</span>' +
          '<h2 class="legal-modal__title" id="lmTitle"></h2>' +
        '</div>' +
        '<button class="legal-modal__close" type="button" aria-label="닫기" data-close>' +
          '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="legal-modal__body"><div class="prose legal-modal__prose" id="lmProse"></div></div>' +
    '</div>';
  function mount(){ if(!root.isConnected) document.body.appendChild(root); }
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  const panel  = root.querySelector('.legal-modal__panel');
  const titleEl= root.querySelector('#lmTitle');
  const proseEl= root.querySelector('#lmProse');
  const bodyEl = root.querySelector('.legal-modal__body');
  const closeBtn = root.querySelector('.legal-modal__close');

  /* ── fetch + cache the legal body ── */
  const cache = {};
  async function fetchLegal(file){
    if(cache[file]) return cache[file];
    const res = await fetch(file);
    if(!res.ok) throw new Error('fetch '+res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const prose = doc.querySelector('.prose');
    const title = (doc.title||'').replace(/\s*[—–-]\s*SIRIAI\s*$/i,'').trim() || '약관';
    const data = { title, html: prose ? prose.innerHTML : '' };
    if(data.html) cache[file] = data;
    return data;
  }

  let lastFocus = null, closeTimer = 0;
  function open(file){
    mount();
    lastFocus = document.activeElement;
    fetchLegal(file).then(function(data){
      if(!data.html){ location.href = file; return; }   // no content extracted → fall back
      titleEl.textContent = data.title;
      proseEl.innerHTML = data.html;
      bodyEl.scrollTop = 0;
      clearTimeout(closeTimer);
      root.hidden = false;
      document.documentElement.classList.add('legal-modal-open');
      void panel.offsetWidth;                 // force reflow so the entrance transition runs (no rAF dependency)
      root.classList.add('is-open');
      try{ closeBtn.focus({preventScroll:true}); }catch(_){ closeBtn.focus(); }
    }).catch(function(){ location.href = file; });        // fetch failed (e.g. file://) → full page
  }
  function close(){
    if(root.hidden) return;
    root.classList.remove('is-open');
    document.documentElement.classList.remove('legal-modal-open');
    closeTimer = setTimeout(function(){ root.hidden = true; }, 520);
    if(lastFocus && lastFocus.focus){ try{ lastFocus.focus({preventScroll:true}); }catch(_){ lastFocus.focus(); } }
  }
  window.SiriaiLegalModal = { open: open, close: close };

  /* ── interactions ── */
  document.addEventListener('click', function(e){
    if(!root.hidden && e.target.closest && e.target.closest('[data-close]')){ e.preventDefault(); close(); return; }
    const a = e.target.closest && e.target.closest('a');
    if(!a) return;
    if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if(a.target && a.target!=='' && a.target!=='_self') return;   // respect new-tab links
    const file = targetFor(a);
    if(!file) return;
    e.preventDefault();
    open(file);
  });
  document.addEventListener('keydown', function(e){
    if(root.hidden) return;
    if(e.key==='Escape'){ e.preventDefault(); close(); return; }
    if(e.key==='Tab'){
      const f = panel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if(!f.length) return;
      const first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  });
})();
