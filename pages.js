/* SIRIAI — inner-page interactions (shared) */
(function () {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav solidifies on scroll */
  const nav = document.querySelector('.nav');
  const onScroll = () => { if (nav) nav.classList.toggle('solid', scrollY > 12); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* reveal on enter */
  const rvs = [...document.querySelectorAll('.rv')];
  if (RM) rvs.forEach(e => e.classList.add('in'));
  else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    rvs.forEach((e, i) => { e.style.transitionDelay = (Math.min(i, 4) * 0.06) + 's'; io.observe(e); });
  } else rvs.forEach(e => e.classList.add('in'));

  /* legal TOC active state + smooth anchor */
  const toc = document.querySelector('.toc');
  if (toc) {
    const links = [...toc.querySelectorAll('a')];
    const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const spy = () => {
      let cur = secs[0];
      for (const s of secs) { if (s.getBoundingClientRect().top <= 140) cur = s; }
      links.forEach(a => a.classList.toggle('here', a.getAttribute('href') === '#' + (cur && cur.id)));
    };
    addEventListener('scroll', spy, { passive: true }); spy();
  }

  /* contact: chips + fake submit */
  document.querySelectorAll('.chips').forEach(group => {
    group.addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      c.classList.toggle('on');
    });
  });
  const form = document.getElementById('ct-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const ok = document.getElementById('ct-ok');
      form.style.display = 'none';
      if (ok) ok.classList.add('show');
      ok && ok.scrollIntoView ? null : null;
    });
  }

  /* footer year */
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
